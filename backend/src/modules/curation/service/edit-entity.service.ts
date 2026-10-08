import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import { InvariantError } from "../../../shared/invariant-error.js";
import { isPgUniqueViolation } from "../../../shared/error-mapping.js";
import type {
  CatalogSnapshot,
  NodeTypeRow,
} from "../../ingestion/catalog/catalog.js";
import type {
  AttributeChange,
  EditEffect,
  EditEntityBody,
} from "../dto/edit-entity.dto.js";
import {
  loadAttributeIdsOfKeyForUpdate,
  loadItemsForUpdate,
} from "../repository/curation.repository.js";
import type {
  ItemLockedRow,
  KnowledgeNodeLockedRow,
} from "../repository/curation.repository.js";
import {
  checkChangeAgainstCatalog,
  resolveAttributeKey,
} from "./attribute-change-catalog.js";
import { checkChangeValidity } from "./attribute-change-validity.js";
import { appliedEntry, recordEditAction } from "./entity-edit-action.js";
import type { AppliedChange, AppliedEntry } from "./entity-edit-action.js";
import {
  LIVE_STATUSES,
  checkChangeAgainstHeldAttributes,
} from "./entity-edit-attributes.js";
import type { EditedKey } from "./entity-edit-attributes.js";
import { recordCorrection } from "./entity-edit-correction.js";
import { decideChangeEffect } from "./entity-edit-effect.js";
import { loadActiveNodeForEdit } from "./entity-edit-node.js";
import { recordNewAttribute } from "./entity-edit-new-attribute.js";
import { recordOperatorNote } from "./entity-edit-note.js";
import type { OperatorNoteRecord } from "./entity-edit-note.js";
import { recordRemoval } from "./entity-edit-removal.js";
import { recordSuccession } from "./entity-edit-succession.js";
import { BusinessError, TemporalIncoherentError } from "./errors.js";
import { withTransaction } from "./transaction.js";

const NO_CHANGES_CODE = "BUSINESS_ENTITY_EDIT_NO_CHANGES";
const EDIT_ROUTE = "POST /api/v1/nodes/{node_id}/edit";
const EDIT_OPERATION = "edit_entity";
const EDIT_LOG_MESSAGE = "curation_edit_entity_ok";
const ATTRIBUTE_ITEM_KIND = "attribute";
const UNCHANGED_EFFECT: EditEffect = "unchanged";

export interface EditEntityServiceDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

export interface EditEntityResult {
  readonly node_id: string;
  readonly action_id: string;
  readonly applied: readonly AppliedEntry[];
}

interface EditScope {
  readonly client: PoolClient;
  readonly catalog: CatalogSnapshot;
  readonly node: KnowledgeNodeLockedRow;
  readonly nodeType: NodeTypeRow;
  readonly editedAt: Date;
  readonly noteOf: () => Promise<OperatorNoteRecord>;
}

interface CheckedChange {
  readonly target: EditedKey;
  readonly effect: EditEffect;
  readonly attributes: readonly ItemLockedRow[];
}

function lazyNote(
  client: PoolClient,
  input: { nodeId: string; reason: string; editedAt: Date }
): () => Promise<OperatorNoteRecord> {
  let recorded: Promise<OperatorNoteRecord> | undefined;
  return () => {
    recorded ??= recordOperatorNote(client, input);
    return recorded;
  };
}

function openEditScope(
  client: PoolClient,
  catalog: CatalogSnapshot,
  node: KnowledgeNodeLockedRow,
  reason: string
): EditScope {
  const nodeType = catalog.nodeTypeById.get(node.node_type_id);
  if (nodeType === undefined) {
    throw new InvariantError(
      `editEntityService: node type ${node.node_type_id} is not in the catalog`
    );
  }
  const editedAt = new Date();
  return {
    client,
    catalog,
    node,
    nodeType,
    editedAt,
    noteOf: lazyNote(client, { nodeId: node.id, reason, editedAt }),
  };
}

async function loadLiveAttributesOfKey(
  client: PoolClient,
  target: EditedKey
): Promise<ItemLockedRow[]> {
  const ids = await loadAttributeIdsOfKeyForUpdate(client, {
    nodeId: target.node.id,
    attributeKeyId: target.attributeKey.id,
    statuses: LIVE_STATUSES,
  });
  return loadItemsForUpdate(client, ATTRIBUTE_ITEM_KIND, ids);
}

async function checkChange(
  scope: EditScope,
  change: AttributeChange
): Promise<CheckedChange> {
  const attributeKey = resolveAttributeKey(
    scope.catalog,
    scope.nodeType,
    change.attribute_key
  );
  checkChangeAgainstCatalog(scope.catalog, scope.nodeType, change);
  checkChangeValidity(attributeKey, change, scope.editedAt);
  const target: EditedKey = { node: scope.node, attributeKey };
  await checkChangeAgainstHeldAttributes(scope.client, target, change);
  const attributes = await loadLiveAttributesOfKey(scope.client, target);
  return {
    target,
    effect: decideChangeEffect(attributeKey, change, attributes),
    attributes,
  };
}

function namedItemOf(change: AttributeChange): string {
  if (change.item_id === undefined) {
    throw new InvariantError(
      `editEntityService: a ${change.kind} change of '${change.attribute_key}' names no attribute`
    );
  }
  return change.item_id;
}

function predecessorOf(
  change: AttributeChange,
  checked: CheckedChange
): ItemLockedRow {
  const itemId = namedItemOf(change);
  const predecessor = checked.attributes.find((held) => held.id === itemId);
  if (predecessor === undefined) {
    throw new InvariantError(
      `editEntityService: attribute ${itemId} is not a live attribute of its key`
    );
  }
  return predecessor;
}

async function writeNewAttribute(
  scope: EditScope,
  change: AttributeChange,
  checked: CheckedChange
): Promise<string> {
  const input = {
    target: checked.target,
    change,
    note: await scope.noteOf(),
    editedAt: scope.editedAt,
  };
  if (checked.effect === "succession") {
    const predecessor = predecessorOf(change, checked);
    return recordSuccession(scope.client, { ...input, predecessor });
  }
  if (checked.effect === "correction") {
    const predecessor = predecessorOf(change, checked);
    return recordCorrection(scope.client, { ...input, predecessor });
  }
  return recordNewAttribute(scope.client, input);
}

async function recordChange(
  scope: EditScope,
  change: AttributeChange,
  checked: CheckedChange
): Promise<AppliedChange> {
  const applied = {
    attribute_key: change.attribute_key,
    effect: checked.effect,
  };
  if (checked.effect === UNCHANGED_EFFECT) {
    return { ...applied, item_id: null, predecessor_id: null };
  }
  if (checked.effect === "removal") {
    const removedId = namedItemOf(change);
    await recordRemoval(scope.client, {
      attributeId: removedId,
      editedAt: scope.editedAt,
    });
    return { ...applied, item_id: null, predecessor_id: removedId };
  }
  const itemId = await writeNewAttribute(scope, change, checked);
  return { ...applied, item_id: itemId, predecessor_id: change.item_id ?? null };
}

async function applyChanges(
  scope: EditScope,
  changes: readonly AttributeChange[]
): Promise<AppliedChange[]> {
  const applied: AppliedChange[] = [];
  for (const change of changes) {
    const checked = await checkChange(scope, change);
    applied.push(await recordChange(scope, change, checked));
  }
  return applied;
}

function assertSomethingChanged(applied: readonly AppliedChange[]): void {
  if (applied.every((change) => change.effect === UNCHANGED_EFFECT)) {
    throw new BusinessError(
      NO_CHANGES_CODE,
      "The edit changes no attribute of the node."
    );
  }
}

async function editWithin(
  deps: EditEntityServiceDeps,
  client: PoolClient,
  nodeId: string,
  body: EditEntityBody
): Promise<EditEntityResult> {
  const node = await loadActiveNodeForEdit(client, nodeId);
  const scope = openEditScope(client, deps.catalog, node, body.reason);
  const applied = await applyChanges(scope, body.changes);
  assertSomethingChanged(applied);
  const actionId = await recordEditAction(client, {
    nodeId: node.id,
    reason: body.reason,
    applied,
  });
  deps.logger.info(
    {
      route: EDIT_ROUTE,
      operation: EDIT_OPERATION,
      node_id: node.id,
      action_id: actionId,
      changes: applied.length,
    },
    EDIT_LOG_MESSAGE
  );
  return {
    node_id: node.id,
    action_id: actionId,
    applied: applied.map(appliedEntry),
  };
}

export async function editEntityService(
  deps: EditEntityServiceDeps,
  nodeId: string,
  body: EditEntityBody
): Promise<EditEntityResult> {
  try {
    return await withTransaction(deps.pool, (client) =>
      editWithin(deps, client, nodeId, body)
    );
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      throw new TemporalIncoherentError({ node_id: nodeId });
    }
    throw err;
  }
}
