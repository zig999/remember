import type { PoolClient } from "pg";

import { InvariantError } from "../../../shared/invariant-error.js";
import type { AttributeKeyRow } from "../../ingestion/catalog/catalog.js";
import type { AttributeChange } from "../dto/edit-entity.dto.js";
import type { AssertionStatus, ValidFromSource } from "../dto/enums.dto.js";
import {
  appendProvenanceFragment,
  insertNewAttribute,
} from "../repository/curation.repository.js";
import { utcCalendarDateOf } from "./attribute-change-validity.js";
import type { EditedKey } from "./entity-edit-attributes.js";
import type { OperatorNoteRecord } from "./entity-edit-note.js";

export const ENTITY_EDIT_ATTRIBUTE_STATUS: AssertionStatus = "active";
export const ENTITY_EDIT_ATTRIBUTE_CONFIDENCE = 1.0;

const DEFAULTED_START_BASIS: ValidFromSource = "received";
const STATED_START_BASIS: ValidFromSource = "stated";

export interface NewAttributeInput {
  readonly target: EditedKey;
  readonly change: AttributeChange;
  readonly note: OperatorNoteRecord;
  readonly editedAt: Date;
}

interface RecordedValidity {
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly validFromSource: ValidFromSource | null;
}

const NO_VALIDITY: RecordedValidity = {
  validFrom: null,
  validTo: null,
  validFromSource: null,
};

function validityOf(
  attributeKey: AttributeKeyRow,
  change: AttributeChange,
  editedAt: Date
): RecordedValidity {
  if (!attributeKey.is_temporal) {
    return NO_VALIDITY;
  }
  const validTo = change.valid_to ?? null;
  if (change.valid_from === undefined) {
    return {
      validFrom: utcCalendarDateOf(editedAt),
      validTo,
      validFromSource: DEFAULTED_START_BASIS,
    };
  }
  return {
    validFrom: change.valid_from,
    validTo,
    validFromSource: STATED_START_BASIS,
  };
}

export async function recordNewAttribute(
  client: PoolClient,
  input: NewAttributeInput
): Promise<string> {
  const { target, change, note, editedAt } = input;
  if (change.value === undefined) {
    throw new InvariantError("recordNewAttribute: a set change states no value");
  }
  const attributeId = await insertNewAttribute(client, {
    nodeId: target.node.id,
    attributeKeyId: target.attributeKey.id,
    valueType: target.attributeKey.value_type,
    value: change.value,
    ...validityOf(target.attributeKey, change, editedAt),
    status: ENTITY_EDIT_ATTRIBUTE_STATUS,
    confidence: ENTITY_EDIT_ATTRIBUTE_CONFIDENCE,
    createdByRunId: note.llmRunId,
  });
  await appendProvenanceFragment(client, "attribute", attributeId, note.fragmentId);
  return attributeId;
}
