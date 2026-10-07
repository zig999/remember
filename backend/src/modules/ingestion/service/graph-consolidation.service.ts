import type { PoolClient } from "pg";

import type {
  AttributeKeyRow,
  LinkTypeRow,
} from "../catalog/catalog.js";
import { ValidationFailure } from "../validation/errors.js";

import type { RunContext } from "./propose.types.js";

const SUCCESSION_MARKERS = [
  "deixou de",
  "passou a",
  "novo",
  "nova",
  "substituiu",
  "substituido",
  "substituido por",
  "succeeded",
  "replaced",
] as const;

export function hasSuccessionSignal(
  fragmentTexts: readonly string[]
): boolean {
  for (const f of fragmentTexts) {
    const lower = f.toLowerCase();
    for (const m of SUCCESSION_MARKERS) {
      if (lower.includes(m)) return true;
    }
  }
  return false;
}

export type ConsolidateOutcome =
  | "accepted"
  | "consolidated"
  | "superseded_previous"
  | "disputed";

export interface ConsolidateLinkArgs {
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type_id: string;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_basis: "stated" | "document" | "received" | null;
  readonly change_hint: "none" | "succession" | "correction";
  readonly fragment_ids: readonly string[];
  readonly status_for_new_row: "active" | "uncertain";
}

export interface ConsolidateAttributeArgs {
  readonly node_id: string;
  readonly attribute_key_id: string;
  readonly value_type: "date" | "number" | "text" | "bool";
  readonly value: string;
  readonly confidence: number;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly valid_from_basis: "stated" | "document" | "received" | null;
  readonly change_hint: "none" | "succession" | "correction";
  readonly fragment_ids: readonly string[];
  readonly status_for_new_row: "active" | "uncertain";
}

export interface ConsolidateLinkResult {
  readonly outcome: ConsolidateOutcome;
  readonly link_id: string;
  readonly superseded_link_id?: string;
  readonly conflicting_link_id?: string;
}

export interface ConsolidateAttributeResult {
  readonly outcome: ConsolidateOutcome;
  readonly attribute_id: string;
  readonly superseded_attribute_id?: string;
  readonly conflicting_attribute_id?: string;
}

interface VigentLinkRow {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type_id: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly status: string;
}

interface VigentAttributeRow {
  readonly id: string;
  readonly node_id: string;
  readonly attribute_key_id: string;
  readonly value: string;
  readonly valid_from: string | null;
  readonly valid_to: string | null;
  readonly status: string;
}

interface PgError extends Error {
  readonly code?: string;
  readonly constraint?: string;
}

function isDupGuardViolation(err: unknown, guard: string): boolean {
  const e = err as PgError;
  return (
    e instanceof Error &&
    e.code === "23505" &&
    e.constraint === guard
  );
}

async function insertLinkProvenance(
  client: PoolClient,
  linkId: string,
  fragmentIds: readonly string[]
): Promise<void> {
  await client.query(
    `INSERT INTO provenance (link_id, fragment_id)
       SELECT $1, f FROM unnest($2::uuid[]) AS f
       ON CONFLICT DO NOTHING`,
    [linkId, fragmentIds]
  );
  await promoteFragmentsToAccepted(client, fragmentIds);
}

async function insertAttributeProvenance(
  client: PoolClient,
  attributeId: string,
  fragmentIds: readonly string[]
): Promise<void> {
  await client.query(
    `INSERT INTO provenance (attribute_id, fragment_id)
       SELECT $1, f FROM unnest($2::uuid[]) AS f
       ON CONFLICT DO NOTHING`,
    [attributeId, fragmentIds]
  );
  await promoteFragmentsToAccepted(client, fragmentIds);
}

async function promoteFragmentsToAccepted(
  client: PoolClient,
  fragmentIds: readonly string[]
): Promise<void> {
  if (fragmentIds.length === 0) return;
  await client.query(
    `UPDATE information_fragment
        SET status = 'accepted'
      WHERE id = ANY($1::uuid[])
        AND status = 'proposed'`,
    [fragmentIds]
  );
}

async function closeVigentForSuccession(
  client: PoolClient,
  table: "knowledge_link" | "node_attribute",
  vigentId: string,
  closeDate: string | null
): Promise<void> {
  const closeExpr = closeDate !== null ? "$2::date" : "now()::date";
  const params: unknown[] = closeDate !== null ? [vigentId, closeDate] : [vigentId];
  await client.query(
    `UPDATE ${table}
        SET valid_to = CASE
                         WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}
                           THEN valid_to
                         ELSE ${closeExpr}
                       END,
            superseded_at = CASE
                              WHEN valid_from IS NOT NULL AND valid_from >= ${closeExpr}
                                THEN now()
                              ELSE superseded_at
                            END,
            status        = 'superseded'::assertion_status
      WHERE id = $1`,
    params
  );
}

async function lockVigentLinkBySourceAndType(
  client: PoolClient,
  sourceNodeId: string,
  linkTypeId: string
): Promise<VigentLinkRow | null> {
  const res = await client.query<VigentLinkRow>(
    `SELECT id, source_node_id, target_node_id, link_type_id,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM knowledge_link
      WHERE source_node_id = $1
        AND link_type_id   = $2
        AND valid_to       IS NULL
        AND superseded_at  IS NULL
      FOR UPDATE`,
    [sourceNodeId, linkTypeId]
  );
  return res.rows[0] ?? null;
}

async function lockVigentLinkByTriple(
  client: PoolClient,
  sourceNodeId: string,
  linkTypeId: string,
  targetNodeId: string
): Promise<VigentLinkRow | null> {
  const res = await client.query<VigentLinkRow>(
    `SELECT id, source_node_id, target_node_id, link_type_id,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM knowledge_link
      WHERE source_node_id = $1
        AND link_type_id   = $2
        AND target_node_id = $3
        AND valid_to       IS NULL
        AND superseded_at  IS NULL
      FOR UPDATE`,
    [sourceNodeId, linkTypeId, targetNodeId]
  );
  return res.rows[0] ?? null;
}

async function lockVigentAttributeByNodeAndKey(
  client: PoolClient,
  nodeId: string,
  attributeKeyId: string
): Promise<VigentAttributeRow | null> {
  const res = await client.query<VigentAttributeRow>(
    `SELECT id, node_id, attribute_key_id, value,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM node_attribute
      WHERE node_id          = $1
        AND attribute_key_id = $2
        AND valid_to         IS NULL
        AND superseded_at    IS NULL
      FOR UPDATE`,
    [nodeId, attributeKeyId]
  );
  return res.rows[0] ?? null;
}

async function lockVigentAttributeByTriple(
  client: PoolClient,
  nodeId: string,
  attributeKeyId: string,
  value: string
): Promise<VigentAttributeRow | null> {
  const res = await client.query<VigentAttributeRow>(
    `SELECT id, node_id, attribute_key_id, value,
            to_char(valid_from, 'YYYY-MM-DD') AS valid_from,
            to_char(valid_to,   'YYYY-MM-DD') AS valid_to,
            status
       FROM node_attribute
      WHERE node_id          = $1
        AND attribute_key_id = $2
        AND value            = $3
        AND valid_to         IS NULL
        AND superseded_at    IS NULL
      FOR UPDATE`,
    [nodeId, attributeKeyId, value]
  );
  return res.rows[0] ?? null;
}

export async function consolidateLink(
  client: PoolClient,
  args: ConsolidateLinkArgs,
  linkTypeInfo: LinkTypeRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateLinkResult> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const savepoint = `gc_link_${attempt}`;
    await client.query(`SAVEPOINT ${savepoint}`);
    try {
      const result = await consolidateLinkOnce(
        client,
        args,
        linkTypeInfo,
        fragmentTexts,
        runCtx
      );
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return result;
    } catch (err) {
      if (!isDupGuardViolation(err, "knowledge_link_current_dup_guard")) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        throw err;
      }
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      if (attempt === 2) {
        throw new ValidationFailure(
          "SYSTEM_INTERNAL_ERROR",
          "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.",
          { scope: "knowledge_link" }
        );
      }
    }
  }
  throw new ValidationFailure(
    "SYSTEM_INTERNAL_ERROR",
    "consolidateLinkWithRetry: unreachable loop exit.",
    {}
  );
}

async function consolidateLinkOnce(
  client: PoolClient,
  args: ConsolidateLinkArgs,
  linkTypeInfo: LinkTypeRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateLinkResult> {
  const functional = !linkTypeInfo.allows_multiple_current;

  let vigent: VigentLinkRow | null;
  if (functional) {
    vigent = await lockVigentLinkBySourceAndType(
      client,
      args.source_node_id,
      linkTypeInfo.id
    );
  } else {
    vigent = await lockVigentLinkByTriple(
      client,
      args.source_node_id,
      linkTypeInfo.id,
      args.target_node_id
    );
  }

  if (vigent !== null) {
    const sameTarget = vigent.target_node_id === args.target_node_id;

    if (sameTarget && args.change_hint !== "correction") {
      await insertLinkProvenance(client, vigent.id, args.fragment_ids);
      return { outcome: "consolidated", link_id: vigent.id };
    }

    if (args.change_hint === "correction") {
      await client.query(
        `UPDATE knowledge_link
            SET superseded_at = now(),
                status        = 'superseded'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      const newRow = await insertLinkRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_link_id: vigent.id,
      });
      await insertLinkProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "accepted",
        link_id: newRow.id,
        superseded_link_id: vigent.id,
      };
    }

    if (
      functional &&
      !sameTarget &&
      (args.change_hint === "succession" ||
        hasSuccessionSignal(fragmentTexts))
    ) {
      await closeVigentForSuccession(
        client,
        "knowledge_link",
        vigent.id,
        args.valid_from
      );
      const newRow = await insertLinkRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_link_id: vigent.id,
      });
      await insertLinkProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "superseded_previous",
        link_id: newRow.id,
        superseded_link_id: vigent.id,
      };
    }

    if (functional) {
      await client.query(
        `UPDATE knowledge_link
            SET status = 'disputed'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      const newRow = await insertLinkRow(client, args, runCtx, {
        status: "disputed",
        supersedes_link_id: null,
      });
      await insertLinkProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "disputed",
        link_id: newRow.id,
        conflicting_link_id: vigent.id,
      };
    }
  }

  const newRow = await insertLinkRow(client, args, runCtx, {
    status: args.status_for_new_row,
    supersedes_link_id: null,
  });
  await insertLinkProvenance(client, newRow.id, args.fragment_ids);
  return { outcome: "accepted", link_id: newRow.id };
}

async function insertLinkRow(
  client: PoolClient,
  args: ConsolidateLinkArgs,
  runCtx: RunContext,
  extras: {
    readonly status: "active" | "uncertain" | "disputed";
    readonly supersedes_link_id: string | null;
  }
): Promise<{ readonly id: string }> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO knowledge_link
       (source_node_id, target_node_id, link_type_id,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id, supersedes_link_id)
     VALUES ($1, $2, $3,
             $4::date, $5::date,
             $6::assertion_status, $7,
             $8::valid_from_source, $9, $10)
     RETURNING id`,
    [
      args.source_node_id,
      args.target_node_id,
      args.link_type_id,
      args.valid_from,
      args.valid_to,
      extras.status,
      args.confidence,
      args.valid_from_basis,
      runCtx.llmRunId,
      extras.supersedes_link_id,
    ]
  );
  return res.rows[0]!;
}

export async function consolidateAttribute(
  client: PoolClient,
  args: ConsolidateAttributeArgs,
  attrKeyInfo: AttributeKeyRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateAttributeResult> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const savepoint = `gc_attr_${attempt}`;
    await client.query(`SAVEPOINT ${savepoint}`);
    try {
      const result = await consolidateAttributeOnce(
        client,
        args,
        attrKeyInfo,
        fragmentTexts,
        runCtx
      );
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return result;
    } catch (err) {
      if (!isDupGuardViolation(err, "node_attribute_current_dup_guard")) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        throw err;
      }
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      if (attempt === 2) {
        throw new ValidationFailure(
          "SYSTEM_INTERNAL_ERROR",
          "graph consolidation: dup-guard constraint hit on retry; a concurrent transaction committed a conflicting row.",
          { scope: "node_attribute" }
        );
      }
    }
  }
  throw new ValidationFailure(
    "SYSTEM_INTERNAL_ERROR",
    "consolidateAttributeWithRetry: unreachable loop exit.",
    {}
  );
}

async function consolidateAttributeOnce(
  client: PoolClient,
  args: ConsolidateAttributeArgs,
  attrKeyInfo: AttributeKeyRow,
  fragmentTexts: readonly string[],
  runCtx: RunContext
): Promise<ConsolidateAttributeResult> {
  const functional = !attrKeyInfo.allows_multiple_current;

  let vigent: VigentAttributeRow | null;
  if (functional) {
    vigent = await lockVigentAttributeByNodeAndKey(
      client,
      args.node_id,
      attrKeyInfo.id
    );
  } else {
    vigent = await lockVigentAttributeByTriple(
      client,
      args.node_id,
      attrKeyInfo.id,
      args.value
    );
  }

  if (vigent !== null) {
    const sameValue = vigent.value === args.value;

    if (sameValue && args.change_hint !== "correction") {
      await insertAttributeProvenance(client, vigent.id, args.fragment_ids);
      return { outcome: "consolidated", attribute_id: vigent.id };
    }

    if (args.change_hint === "correction") {
      await client.query(
        `UPDATE node_attribute
            SET superseded_at = now(),
                status        = 'superseded'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      const newRow = await insertAttributeRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_attribute_id: vigent.id,
      });
      await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "accepted",
        attribute_id: newRow.id,
        superseded_attribute_id: vigent.id,
      };
    }

    if (
      functional &&
      !sameValue &&
      (args.change_hint === "succession" ||
        hasSuccessionSignal(fragmentTexts))
    ) {
      await closeVigentForSuccession(
        client,
        "node_attribute",
        vigent.id,
        args.valid_from
      );
      const newRow = await insertAttributeRow(client, args, runCtx, {
        status: args.status_for_new_row,
        supersedes_attribute_id: vigent.id,
      });
      await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "superseded_previous",
        attribute_id: newRow.id,
        superseded_attribute_id: vigent.id,
      };
    }

    if (functional) {
      await client.query(
        `UPDATE node_attribute
            SET status = 'disputed'::assertion_status
          WHERE id = $1`,
        [vigent.id]
      );
      const newRow = await insertAttributeRow(client, args, runCtx, {
        status: "disputed",
        supersedes_attribute_id: null,
      });
      await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
      return {
        outcome: "disputed",
        attribute_id: newRow.id,
        conflicting_attribute_id: vigent.id,
      };
    }
  }

  const newRow = await insertAttributeRow(client, args, runCtx, {
    status: args.status_for_new_row,
    supersedes_attribute_id: null,
  });
  await insertAttributeProvenance(client, newRow.id, args.fragment_ids);
  return { outcome: "accepted", attribute_id: newRow.id };
}

async function insertAttributeRow(
  client: PoolClient,
  args: ConsolidateAttributeArgs,
  runCtx: RunContext,
  extras: {
    readonly status: "active" | "uncertain" | "disputed";
    readonly supersedes_attribute_id: string | null;
  }
): Promise<{ readonly id: string }> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO node_attribute
       (node_id, attribute_key_id, value_type, value,
        valid_from, valid_to, status, confidence,
        valid_from_source, created_by_run_id, supersedes_attribute_id)
     VALUES ($1, $2, $3::attribute_value_type, $4,
             $5::date, $6::date,
             $7::assertion_status, $8,
             $9::valid_from_source, $10, $11)
     RETURNING id`,
    [
      args.node_id,
      args.attribute_key_id,
      args.value_type,
      args.value,
      args.valid_from,
      args.valid_to,
      extras.status,
      args.confidence,
      args.valid_from_basis,
      runCtx.llmRunId,
      extras.supersedes_attribute_id,
    ]
  );
  return res.rows[0]!;
}

export const __testing__ = {
  hasSuccessionSignal,
  SUCCESSION_MARKERS,
};
