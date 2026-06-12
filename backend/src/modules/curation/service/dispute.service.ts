// UC-05 / UC-06 / UC-07 — POST /api/v1/curation/disputes/resolve.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type {
  AttributeKeyRow,
  CatalogSnapshot,
  LinkTypeRow,
} from "../../knowledge-graph/index.js";
import type { ResolveDisputeBody } from "../dto/dispute.dto.js";
import type {
  AssertionStatus,
  ItemKind,
} from "../dto/enums.dto.js";
import {
  adjustItemPeriod,
  insertCurationAction,
  loadItemsForUpdate,
  resolveDisputeLosers,
  resolveDisputeWinner,
  type ItemLockedRow,
} from "../repository/curation.repository.js";
import {
  BusinessError,
  ConflictError,
  ResourceNotFoundError,
} from "./errors.js";
import { withTransaction } from "./transaction.js";

export interface DisputeServiceDeps {
  readonly pool: Pool;
  readonly logger: Logger;
  readonly catalog: CatalogSnapshot;
}

export interface ResolveDisputeItemResult {
  readonly item_id: string;
  readonly resulting_status: AssertionStatus;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
}

export interface ResolveDisputeResult {
  readonly item_kind: ItemKind;
  readonly decision: "prefer_one" | "adjust_periods" | "keep_disputed";
  readonly items: readonly ResolveDisputeItemResult[];
  readonly action_id: string;
}

export async function resolveDisputeService(
  deps: DisputeServiceDeps,
  body: ResolveDisputeBody
): Promise<ResolveDisputeResult> {
  return withTransaction(deps.pool, async (client) => {
    // BR-26: lock every item row.
    const locked = await loadItemsForUpdate(client, body.item_kind, body.item_ids);
    if (locked.length !== body.item_ids.length) {
      const foundIds = new Set(locked.map((r) => r.id));
      const missing = body.item_ids.find((id) => !foundIds.has(id));
      throw new ResourceNotFoundError("Item not found", {
        missing_id: missing,
        item_kind: body.item_kind,
      });
    }

    // BR-22: every row must be `disputed`.
    for (const row of locked) {
      if (row.status !== "disputed") {
        throw new ConflictError(
          "BUSINESS_ITEM_NOT_DISPUTED",
          "All items must be in status=disputed",
          { offending_id: row.id, current_status: row.status }
        );
      }
    }

    // BR-14: all items must share the same conflict scope.
    assertSameScope(body.item_kind, locked);

    if (body.decision === "keep_disputed") {
      const action = await insertCurationAction(client, {
        action: "resolve_dispute",
        target_kind: body.item_kind,
        target_id: body.item_ids[0]!,
        payload: {
          decision: "keep_disputed",
          item_ids: body.item_ids,
        },
        reason: body.reason ?? null,
      });
      deps.logger.info(
        {
          route: "POST /api/v1/curation/disputes/resolve",
          operation: "resolve_dispute",
          decision: "keep_disputed",
          item_kind: body.item_kind,
          action_id: action.id,
          rows_mutated: 0,
        },
        "curation_resolve_dispute_ok"
      );
      return {
        item_kind: body.item_kind,
        decision: "keep_disputed",
        items: locked.map((r) => ({
          item_id: r.id,
          resulting_status: r.status,
          valid_from: r.valid_from,
          valid_to: r.valid_to,
        })),
        action_id: action.id,
      };
    }

    if (body.decision === "prefer_one") {
      const winnerId = body.winner_id;
      if (!winnerId) {
        throw new BusinessError(
          "BUSINESS_DISPUTE_WINNER_REQUIRED",
          "decision=prefer_one requires winner_id"
        );
      }
      const loserIds = body.item_ids.filter((id) => id !== winnerId);
      const winnerUpdated = await resolveDisputeWinner(
        client,
        body.item_kind,
        winnerId
      );
      if (winnerUpdated !== 1) {
        throw new ConflictError(
          "BUSINESS_ITEM_NOT_DISPUTED",
          "Winner row status changed under lock",
          { offending_id: winnerId }
        );
      }
      const losersUpdated = await resolveDisputeLosers(
        client,
        body.item_kind,
        loserIds
      );
      if (losersUpdated !== loserIds.length) {
        throw new ConflictError(
          "BUSINESS_ITEM_NOT_DISPUTED",
          "One or more loser rows could not be transitioned to deleted",
          { affected: losersUpdated, expected: loserIds.length }
        );
      }

      const action = await insertCurationAction(client, {
        action: "resolve_dispute",
        target_kind: body.item_kind,
        target_id: winnerId,
        payload: {
          decision: "prefer_one",
          item_ids: body.item_ids,
          winner_id: winnerId,
        },
        reason: body.reason ?? null,
      });

      deps.logger.info(
        {
          route: "POST /api/v1/curation/disputes/resolve",
          operation: "resolve_dispute",
          decision: "prefer_one",
          item_kind: body.item_kind,
          action_id: action.id,
          rows_mutated: winnerUpdated + losersUpdated,
        },
        "curation_resolve_dispute_ok"
      );

      const items: ResolveDisputeItemResult[] = locked.map((r) => {
        if (r.id === winnerId) {
          return {
            item_id: r.id,
            resulting_status: "active",
            valid_from: r.valid_from,
            valid_to: r.valid_to,
          };
        }
        return {
          item_id: r.id,
          resulting_status: "deleted",
          valid_from: r.valid_from,
          valid_to: r.valid_to,
        };
      });

      return {
        item_kind: body.item_kind,
        decision: "prefer_one",
        items,
        action_id: action.id,
      };
    }

    // decision === "adjust_periods"
    const periods = body.periods;
    if (!periods || periods.length === 0) {
      throw new BusinessError(
        "BUSINESS_DISPUTE_PERIODS_REQUIRED",
        "decision=adjust_periods requires periods[]"
      );
    }

    // BR-16: functional-scope predicate — at most one row may end with
    // valid_to = NULL when the scope's `allows_multiple_current = false`.
    const allowsMultipleCurrent = scopeAllowsMultipleCurrent(
      body.item_kind,
      locked,
      deps.catalog
    );
    if (!allowsMultipleCurrent) {
      const openCount = periods.filter(
        (p) => p.valid_to === null || p.valid_to === undefined
      ).length;
      if (openCount > 1) {
        throw new BusinessError(
          "BUSINESS_TEMPORAL_INCOHERENT",
          "More than one row would remain current after the adjustment",
          { open_count: openCount }
        );
      }
    }

    const items: ResolveDisputeItemResult[] = [];
    for (const p of periods) {
      const updated = await adjustItemPeriod(
        client,
        body.item_kind,
        p.item_id,
        p.valid_from,
        p.valid_to ?? null
      );
      if (updated !== 1) {
        throw new ConflictError(
          "BUSINESS_ITEM_NOT_DISPUTED",
          "Item could not be transitioned out of disputed",
          { offending_id: p.item_id }
        );
      }
      items.push({
        item_id: p.item_id,
        resulting_status: "active",
        valid_from: p.valid_from,
        valid_to: p.valid_to ?? null,
      });
    }

    const action = await insertCurationAction(client, {
      action: "resolve_dispute",
      target_kind: body.item_kind,
      target_id: body.item_ids[0]!,
      payload: {
        decision: "adjust_periods",
        item_ids: body.item_ids,
        periods,
      },
      reason: body.reason ?? null,
    });

    deps.logger.info(
      {
        route: "POST /api/v1/curation/disputes/resolve",
        operation: "resolve_dispute",
        decision: "adjust_periods",
        item_kind: body.item_kind,
        action_id: action.id,
        rows_mutated: items.length,
      },
      "curation_resolve_dispute_ok"
    );

    return {
      item_kind: body.item_kind,
      decision: "adjust_periods",
      items,
      action_id: action.id,
    };
  });
}

/** BR-14: all items must share the same conflict scope. */
function assertSameScope(
  itemKind: ItemKind,
  rows: readonly ItemLockedRow[]
): void {
  if (rows.length === 0) return;
  const first = rows[0]!;
  if (itemKind === "link") {
    for (const r of rows) {
      if (
        r.source_node_id !== first.source_node_id ||
        r.target_node_id !== first.target_node_id ||
        r.link_type_id !== first.link_type_id
      ) {
        throw new ConflictError(
          "BUSINESS_ITEM_NOT_DISPUTED",
          "Items do not share the same conflict scope",
          { scope_mismatch: true }
        );
      }
    }
    return;
  }
  for (const r of rows) {
    if (
      r.node_id !== first.node_id ||
      r.attribute_key_id !== first.attribute_key_id
    ) {
      throw new ConflictError(
        "BUSINESS_ITEM_NOT_DISPUTED",
        "Items do not share the same conflict scope",
        { scope_mismatch: true }
      );
    }
  }
}

function scopeAllowsMultipleCurrent(
  itemKind: ItemKind,
  rows: readonly ItemLockedRow[],
  catalog: CatalogSnapshot
): boolean {
  if (rows.length === 0) return true;
  const first = rows[0]!;
  if (itemKind === "link") {
    const lt: LinkTypeRow | undefined = catalog.linkTypeById.get(
      first.link_type_id!
    );
    return lt?.allows_multiple_current ?? true;
  }
  const ak: AttributeKeyRow | undefined = catalog.attributeKeyById.get(
    first.attribute_key_id!
  );
  return ak?.allows_multiple_current ?? true;
}
