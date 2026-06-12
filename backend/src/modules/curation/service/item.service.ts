// UC-08 (confirm_item), UC-09 (reject_item), UC-10 (correct_item).

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CorrectItemBody, ConfirmItemBody, RejectItemBody } from "../dto/item.dto.js";
import type { AssertionStatus, ItemKind } from "../dto/enums.dto.js";
import {
  appendProvenanceFragment,
  confirmItem,
  copyProvenance,
  findInformationFragmentById,
  insertCorrectedRow,
  insertCurationAction,
  loadItemsForUpdate,
  rejectItem,
  supersedePredecessor,
} from "../repository/curation.repository.js";
import {
  BusinessError,
  ConflictError,
  ResourceNotFoundError,
} from "./errors.js";
import { withTransaction } from "./transaction.js";

export interface ItemServiceDeps {
  readonly pool: Pool;
  readonly logger: Logger;
}

export interface ItemActionResult {
  readonly item_kind: ItemKind;
  readonly item_id: string;
  readonly resulting_status: AssertionStatus;
  readonly action_id: string;
}

export async function confirmItemService(
  deps: ItemServiceDeps,
  body: ConfirmItemBody
): Promise<ItemActionResult> {
  return withTransaction(deps.pool, async (client) => {
    const locked = await loadItemsForUpdate(client, body.item_kind, [
      body.item_id,
    ]);
    if (locked.length === 0) {
      throw new ResourceNotFoundError("Item not found", {
        item_id: body.item_id,
        item_kind: body.item_kind,
      });
    }
    const row = locked[0]!;
    if (row.status !== "uncertain") {
      throw new ConflictError(
        "BUSINESS_ITEM_NOT_UNCERTAIN",
        "confirm_item requires status=uncertain",
        { item_id: body.item_id, current_status: row.status }
      );
    }

    const updated = await confirmItem(client, body.item_kind, body.item_id);
    if (updated !== 1) {
      throw new ConflictError(
        "BUSINESS_ITEM_NOT_UNCERTAIN",
        "Item status changed under lock",
        { item_id: body.item_id }
      );
    }

    const action = await insertCurationAction(client, {
      action: "confirm_item",
      target_kind: body.item_kind,
      target_id: body.item_id,
      payload: {},
      reason: body.reason ?? null,
    });

    deps.logger.info(
      {
        route: "POST /api/v1/curation/items/confirm",
        operation: "confirm_item",
        item_kind: body.item_kind,
        action_id: action.id,
        rows_mutated: updated,
      },
      "curation_confirm_item_ok"
    );

    return {
      item_kind: body.item_kind,
      item_id: body.item_id,
      resulting_status: "active",
      action_id: action.id,
    };
  });
}

export async function rejectItemService(
  deps: ItemServiceDeps,
  body: RejectItemBody
): Promise<ItemActionResult> {
  return withTransaction(deps.pool, async (client) => {
    const locked = await loadItemsForUpdate(client, body.item_kind, [
      body.item_id,
    ]);
    if (locked.length === 0) {
      throw new ResourceNotFoundError("Item not found", {
        item_id: body.item_id,
        item_kind: body.item_kind,
      });
    }
    const row = locked[0]!;
    if (row.status === "deleted" || row.status === "superseded") {
      throw new ConflictError(
        "BUSINESS_ITEM_NOT_DELETABLE",
        "Item is already deleted or superseded",
        { item_id: body.item_id, current_status: row.status }
      );
    }

    const updated = await rejectItem(client, body.item_kind, body.item_id);
    if (updated !== 1) {
      throw new ConflictError(
        "BUSINESS_ITEM_NOT_DELETABLE",
        "Item status changed under lock",
        { item_id: body.item_id }
      );
    }

    const action = await insertCurationAction(client, {
      action: "reject_item",
      target_kind: body.item_kind,
      target_id: body.item_id,
      payload: {},
      reason: body.reason,
    });

    deps.logger.info(
      {
        route: "POST /api/v1/curation/items/reject",
        operation: "reject_item",
        item_kind: body.item_kind,
        action_id: action.id,
        rows_mutated: updated,
      },
      "curation_reject_item_ok"
    );

    return {
      item_kind: body.item_kind,
      item_id: body.item_id,
      resulting_status: "deleted",
      action_id: action.id,
    };
  });
}

export interface CorrectItemResult {
  readonly item_kind: ItemKind;
  readonly predecessor_id: string;
  readonly new_item_id: string;
  readonly action_id: string;
}

export async function correctItemService(
  deps: ItemServiceDeps,
  body: CorrectItemBody
): Promise<CorrectItemResult> {
  return withTransaction(deps.pool, async (client) => {
    const locked = await loadItemsForUpdate(client, body.item_kind, [
      body.item_id,
    ]);
    if (locked.length === 0) {
      throw new ResourceNotFoundError("Item not found", {
        item_id: body.item_id,
        item_kind: body.item_kind,
      });
    }
    const predecessor = locked[0]!;
    if (
      predecessor.status === "deleted" ||
      predecessor.status === "superseded"
    ) {
      throw new ConflictError(
        "BUSINESS_ITEM_NOT_DELETABLE",
        "Cannot correct a row that is already superseded or deleted",
        { item_id: body.item_id, current_status: predecessor.status }
      );
    }

    // BR-17: when `valid_from_fragment_id` is supplied, the fragment must
    // exist AND its status must be `accepted`.
    if (
      body.corrected.valid_from_fragment_id !== undefined &&
      body.corrected.valid_from_fragment_id !== null
    ) {
      const fragment = await findInformationFragmentById(
        client,
        body.corrected.valid_from_fragment_id
      );
      if (!fragment || fragment.status !== "accepted") {
        throw new BusinessError(
          "BUSINESS_DATE_UNJUSTIFIED",
          "valid_from_fragment_id does not reference an accepted fragment",
          { fragment_id: body.corrected.valid_from_fragment_id }
        );
      }
    }

    // 1. Supersede predecessor — `valid_to` UNCHANGED (BR-18).
    const predecessorUpdated = await supersedePredecessor(
      client,
      body.item_kind,
      body.item_id
    );
    if (predecessorUpdated !== 1) {
      throw new ConflictError(
        "BUSINESS_ITEM_NOT_DELETABLE",
        "Item status changed under lock",
        { item_id: body.item_id }
      );
    }

    // 2. Insert new row with COALESCE overrides.
    const newItemId = await insertCorrectedRow(client, body.item_kind, {
      predecessorId: body.item_id,
      correctedValue: body.corrected.value ?? null,
      correctedTargetNodeId: body.corrected.target_node_id ?? null,
      correctedValidFrom: body.corrected.valid_from ?? null,
      correctedValidTo: body.corrected.valid_to ?? null,
      correctedValidFromSource: body.corrected.valid_from_source ?? null,
    });

    // 3. Copy provenance.
    await copyProvenance(client, body.item_kind, body.item_id, newItemId);

    // 4. Append the errata fragment if supplied (BR-19).
    if (
      body.corrected.valid_from_fragment_id !== undefined &&
      body.corrected.valid_from_fragment_id !== null
    ) {
      await appendProvenanceFragment(
        client,
        body.item_kind,
        newItemId,
        body.corrected.valid_from_fragment_id
      );
    }

    // 5. Audit row.
    const action = await insertCurationAction(client, {
      action: "correct_item",
      target_kind: body.item_kind,
      target_id: body.item_id,
      payload: {
        corrected: body.corrected,
        new_item_id: newItemId,
      },
      reason: body.reason,
    });

    deps.logger.info(
      {
        route: "POST /api/v1/curation/items/correct",
        operation: "correct_item",
        item_kind: body.item_kind,
        predecessor_id: body.item_id,
        new_item_id: newItemId,
        action_id: action.id,
        rows_mutated: predecessorUpdated + 1,
      },
      "curation_correct_item_ok"
    );

    return {
      item_kind: body.item_kind,
      predecessor_id: body.item_id,
      new_item_id: newItemId,
      action_id: action.id,
    };
  });
}
