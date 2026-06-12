// Service layer for the compliance-audit module.
//
// Transport-agnostic: the same functions are called by both the REST handler
// (`routes/compliance-audit.routes.ts`) and the MCP handler
// (`mcp/compliance-toolset.ts`) — BR-14.
//
// Transaction policy (BR-02):
//   - The CALLER (route or MCP handler) opens BEGIN / COMMIT / ROLLBACK and
//     hands the live `client` to `complianceDelete`. Every DB statement of
//     UC-01 runs on that same client; commit is reached only after BR-08 has
//     written BOTH audit rows.
//   - The four read endpoints (listComplianceDeletions / getById on
//     compliance_deletion / listCurationActions / getById on curation_action)
//     are read-only and accept a `pool.connect()`-derived client too. They
//     issue ONE auto-committed SELECT each.

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

import {
  type ComplianceDeleteRequest,
  type ComplianceDeleteResponse,
  type ComplianceDeletion,
  type ComplianceDeletionList,
  type ListComplianceDeletionsQuery,
} from "../dto/compliance-delete.dto.js";
import {
  type CurationAction,
  type CurationActionList,
  type ListCurationActionsQuery,
} from "../dto/curation-action.dto.js";
import {
  findComplianceDeletionById,
  findComplianceDeletionByRawId,
  findCurationActionById,
  insertComplianceDeletion,
  insertCurationAction,
  listComplianceDeletions as listComplianceDeletionsRepo,
  listCurationActions as listCurationActionsRepo,
  loadRawInformationForUpdate,
  tombstoneCascadedAttributes,
  tombstoneCascadedFragments,
  tombstoneCascadedLinks,
  tombstoneRawChunksOfRaw,
  tombstoneRawInformation,
  type ComplianceDeletionRow,
  type CurationActionRow,
} from "../repository/compliance-audit.repository.js";
import { InternalFailure, ResourceNotFoundError } from "./errors.js";

/**
 * The literal `[REDACTED]` is hardcoded by spec (constraint #4 of TC-08:
 * "[REDACTED] literal is hardcoded in the service (not config); a Vitest test
 *  must pin its exact byte value"). Exposed as a NAMED constant so the unit
 *  test can import and pin it.
 */
export const REDACTED_LITERAL = "[REDACTED]" as const;

export interface ComplianceAuditServiceDeps {
  readonly logger: Logger;
}

// ---------------------------------------------------------------------------
// UC-01: complianceDelete
// ---------------------------------------------------------------------------

/**
 * BR-02 — full UC-01 flow, transport-agnostic. The caller MUST open the
 * transaction (BEGIN) before calling; the caller is responsible for
 * COMMIT/ROLLBACK based on the return / throw.
 *
 * Discriminated union return:
 *   - { outcome: 'deleted',              deletion } -> HTTP 201
 *   - { outcome: 'noop_already_deleted', deletion } -> HTTP 200
 *
 * Throws:
 *   - ResourceNotFoundError on UC-01 alt 4a (raw_information_id resolves to
 *     no row).
 *   - InternalFailure('legacy_orphan_tombstone') on UC-01 alt 4c (BR-17).
 */
export async function complianceDelete(
  deps: ComplianceAuditServiceDeps,
  client: PoolClient,
  body: ComplianceDeleteRequest
): Promise<ComplianceDeleteResponse> {
  const { logger } = deps;
  const raw = await loadRawInformationForUpdate(client, body.raw_information_id);

  // UC-01 alt 4a — raw not found.
  if (!raw) {
    throw new ResourceNotFoundError(
      `RawInformation ${body.raw_information_id} not found.`,
      {
        entity: "raw_information",
        id: body.raw_information_id,
      }
    );
  }

  // UC-01 alt 4b — already tombstoned: idempotent no-op (BR-03).
  if (raw.status === "deleted") {
    const existing = await findComplianceDeletionByRawId(
      client,
      body.raw_information_id
    );
    if (existing) {
      logger.info(
        {
          component: "compliance-audit.service",
          operation: "compliance_delete",
          raw_information_id: body.raw_information_id,
          outcome: "noop_already_deleted",
          compliance_deletion_id: existing.id,
        },
        "compliance_delete_noop"
      );
      return {
        outcome: "noop_already_deleted",
        deletion: rowToDto(existing),
      };
    }

    // UC-01 alt 4c — legacy orphan tombstone (BR-17). Operational alarm and
    // 500. The caller (transaction wrapper) will ROLLBACK.
    logger.error(
      {
        component: "compliance-audit.service",
        alarm: "compliance.legacy_orphan_tombstone",
        raw_information_id: body.raw_information_id,
      },
      "compliance_legacy_orphan_tombstone"
    );
    throw new InternalFailure("legacy_orphan_tombstone", {
      raw_information_id: body.raw_information_id,
    });
  }

  // Main path — tombstone + cascade + dual audit row.
  // The raw was previously 'active' / 'needs_review'. The UPDATE returns the
  // row count for sanity; the FOR UPDATE above guarantees this is 1.
  const rawTombstoned = await tombstoneRawInformation(
    client,
    body.raw_information_id
  );
  if (rawTombstoned !== 1) {
    throw new InternalFailure("raw_tombstone_mismatch", {
      raw_information_id: body.raw_information_id,
      rows_updated: rawTombstoned,
    });
  }

  // BR-06 / BR-07 cascade. RETURNING counts feed `affected.*` (BR-16).
  const chunks = await tombstoneRawChunksOfRaw(client, body.raw_information_id);
  const fragments = await tombstoneCascadedFragments(
    client,
    body.raw_information_id
  );
  const links = await tombstoneCascadedLinks(client, body.raw_information_id);
  const attributes = await tombstoneCascadedAttributes(
    client,
    body.raw_information_id
  );

  const affected = { chunks, fragments, links, attributes };

  // BR-08 — write ComplianceDeletion row.
  const deletion = await insertComplianceDeletion(client, {
    raw_information_id: body.raw_information_id,
    reason: body.reason,
    affected,
  });

  // BR-08 — write CurationAction row (action='compliance_delete',
  // target_kind='raw_information', target_id=<the raw>).
  await insertCurationAction(client, {
    action: "compliance_delete",
    target_kind: "raw_information",
    target_id: body.raw_information_id,
    payload: { reason: body.reason, affected },
    reason: body.reason,
  });

  logger.info(
    {
      component: "compliance-audit.service",
      operation: "compliance_delete",
      raw_information_id: body.raw_information_id,
      outcome: "deleted",
      compliance_deletion_id: deletion.id,
      affected,
    },
    "compliance_delete_ok"
  );

  return {
    outcome: "deleted",
    deletion: rowToDto(deletion),
  };
}

// ---------------------------------------------------------------------------
// UC-02 / UC-03 — read paths for compliance_deletion
// ---------------------------------------------------------------------------

export async function listComplianceDeletions(
  pool: Pool,
  query: ListComplianceDeletionsQuery
): Promise<ComplianceDeletionList> {
  const client = await pool.connect();
  try {
    const result = await listComplianceDeletionsRepo(client, {
      raw_information_id: query.raw_information_id,
      executed_from: query.executed_from,
      executed_to: query.executed_to,
      limit: query.limit,
      offset: query.offset,
    });
    return {
      total: result.total,
      limit: query.limit,
      offset: query.offset,
      items: result.items.map(rowToDto),
    };
  } finally {
    client.release();
  }
}

export async function getComplianceDeletionById(
  pool: Pool,
  id: string
): Promise<ComplianceDeletion> {
  const client = await pool.connect();
  try {
    const row = await findComplianceDeletionById(client, id);
    if (!row) {
      throw new ResourceNotFoundError(`ComplianceDeletion ${id} not found.`, {
        entity: "compliance_deletion",
        id,
      });
    }
    return rowToDto(row);
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// UC-04 / UC-05 — read paths for curation_action
// ---------------------------------------------------------------------------

export async function listCurationActions(
  pool: Pool,
  query: ListCurationActionsQuery
): Promise<CurationActionList> {
  const client = await pool.connect();
  try {
    const result = await listCurationActionsRepo(client, {
      action: query.action,
      target_kind: query.target_kind,
      target_id: query.target_id,
      created_from: query.created_from,
      created_to: query.created_to,
      limit: query.limit,
      offset: query.offset,
    });
    return {
      total: result.total,
      limit: query.limit,
      offset: query.offset,
      items: result.items.map(curationRowToDto),
    };
  } finally {
    client.release();
  }
}

export async function getCurationActionById(
  pool: Pool,
  id: string
): Promise<CurationAction> {
  const client = await pool.connect();
  try {
    const row = await findCurationActionById(client, id);
    if (!row) {
      throw new ResourceNotFoundError(`CurationAction ${id} not found.`, {
        entity: "curation_action",
        id,
      });
    }
    return curationRowToDto(row);
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Row -> DTO converters (ISO timestamps; jsonb -> typed object).
// ---------------------------------------------------------------------------

function rowToDto(row: ComplianceDeletionRow): ComplianceDeletion {
  // `affected` is already jsonb -> object via the pg driver; defensively
  // coerce missing keys to 0 so the response always satisfies the Zod
  // contract on the read path even if a legacy row carries a partial blob.
  const a = row.affected as Partial<Record<string, unknown>>;
  return {
    id: row.id,
    raw_information_id: row.raw_information_id,
    reason: row.reason,
    executed_at: toIso(row.executed_at),
    affected: {
      chunks: coerceNonNegativeInt(a.chunks),
      fragments: coerceNonNegativeInt(a.fragments),
      links: coerceNonNegativeInt(a.links),
      attributes: coerceNonNegativeInt(a.attributes),
    },
  };
}

function curationRowToDto(row: CurationActionRow): CurationAction {
  return {
    id: row.id,
    action: row.action,
    target_kind: row.target_kind,
    target_id: row.target_id,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    reason: row.reason,
    created_at: toIso(row.created_at),
  };
}

function toIso(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  // Defensive — some pg setups may surface timestamps as strings.
  return new Date(d).toISOString();
}

function coerceNonNegativeInt(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
    return Math.trunc(v);
  }
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return Math.trunc(n);
  }
  return 0;
}
