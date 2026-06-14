// UC-08 (confirm_item), UC-09 (reject_item), UC-10 (correct_item).

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../../ingestion/index.js";
import { domainOf } from "../../ingestion/index.js";
import {
  assertValueInDomain,
  parseAttributeValue,
} from "../../ingestion/validation/structural.js";
import { isValidationFailure } from "../../ingestion/validation/errors.js";
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
  /**
   * Boot-loaded ingestion CatalogSnapshot — shared with the `propose_attribute`
   * pipeline. Required by `correctItemService` (UC-10 / BR-23) to resolve the
   * predecessor's `attribute_key` for the type-parse + closed-value-domain
   * legs. `confirmItemService` and `rejectItemService` do not consult it but
   * accept the field uniformly so the route/MCP wiring stays a single shape.
   *
   * The ingestion catalog is used (rather than the knowledge-graph one)
   * because it materializes `attributeValidValuesByKeyId` and exposes the
   * `domainOf` helper added by TC-02 of the valid-values-attribute-domains
   * workflow. Both catalogs share the `attributeKeyById` lookup; only the
   * ingestion catalog also carries the closed-domain map.
   */
  readonly catalog: CatalogSnapshot;
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

    // BR-23 (TC-04): when correcting an attribute AND `corrected.value` is
    // supplied, run two legs against the predecessor's `attribute_key`
    // BEFORE any DB write:
    //   (1) parseAttributeValue against `value_type` (type leg)
    //   (2) assertValueInDomain when the key has a closed domain (domain leg)
    // Both helpers throw `ValidationFailure` with `STRUCTURAL_INVALID` —
    // curation re-raises as `BUSINESS_INVALID_ATTRIBUTE_VALUE` (HTTP 422)
    // because curation collapses business reasons into the BUSINESS_*
    // envelope. Other curator actions (`prefer_one`, `adjust_periods`,
    // `confirm_item`, `reject_item`) do not write `value` and are out of
    // scope (curation.spec.md UC-10 main flow step 5; alt 5a, 5b).
    if (
      body.item_kind === "attribute" &&
      body.corrected.value !== undefined &&
      body.corrected.value !== null
    ) {
      const attributeKeyId = predecessor.attribute_key_id;
      if (!attributeKeyId) {
        // Defensive: loadItemsForUpdate always selects `attribute_key_id`
        // for the `attribute` kind. If this fires the SELECT shape drifted.
        throw new BusinessError(
          "BUSINESS_INVALID_ATTRIBUTE_VALUE",
          "predecessor attribute row is missing attribute_key_id",
          { item_id: body.item_id }
        );
      }
      const attrKey = deps.catalog.attributeKeyById.get(attributeKeyId);
      if (!attrKey) {
        // The predecessor row's attribute_key_id is not in the catalog
        // snapshot. This can happen only if the catalog was loaded before a
        // migration added the key OR if the predecessor was written against a
        // stale schema. Surface as BUSINESS_INVALID_ATTRIBUTE_VALUE rather
        // than 500 — the operator can re-run with a fresh boot.
        throw new BusinessError(
          "BUSINESS_INVALID_ATTRIBUTE_VALUE",
          "predecessor attribute_key_id does not resolve in the catalog snapshot",
          { attribute_key_id: attributeKeyId, value: body.corrected.value }
        );
      }

      // Type leg — details: { value_type, value } (BR-23 first leg).
      try {
        parseAttributeValue({
          value: body.corrected.value,
          value_type: attrKey.value_type,
        });
      } catch (err) {
        if (isValidationFailure(err)) {
          throw new BusinessError(
            "BUSINESS_INVALID_ATTRIBUTE_VALUE",
            "corrected.value does not parse against attribute_key.value_type",
            { value_type: attrKey.value_type, value: body.corrected.value }
          );
        }
        throw err;
      }

      // Domain leg — runs only when the key has a closed domain. Details:
      // { attribute_key, value, allowed_values } (BR-23 second leg).
      const domain = domainOf(deps.catalog, attrKey.id);
      if (domain !== null) {
        try {
          assertValueInDomain(body.corrected.value, domain);
        } catch (err) {
          if (isValidationFailure(err)) {
            // Pull the sorted allowed_values from the underlying failure to
            // match the prompt-builder ordering (TC-02 contract).
            const detail = err.details as { allowed_values?: string[] };
            throw new BusinessError(
              "BUSINESS_INVALID_ATTRIBUTE_VALUE",
              "corrected.value is not in the closed value domain",
              {
                attribute_key: attrKey.key,
                value: body.corrected.value,
                allowed_values: detail.allowed_values ?? [],
              }
            );
          }
          throw err;
        }
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
