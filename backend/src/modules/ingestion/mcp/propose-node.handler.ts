// MCP `ingest.propose_node` (UC-09).
//
// Scope of THIS Task Contract:
//   - Structural layer (BR-14): node_type must exist in the seeded catalog;
//     Zod already enforces non-empty name (≤ 500 chars).
//   - Concurrency primitive (BR-20): pg_advisory_xact_lock keyed by
//     hash(node_type_id || US || norm(name)).
//   - Minimal happy path: create-new with `status = 'active'` + a canonical
//     alias row.
//
// The full entity-resolution pipeline (§4 of v7 / threshold table A12 / the
// `needs_review` flow) lives in a future `entity-resolution` domain. When that
// domain is wired in, it slots BETWEEN the advisory-lock acquire and the
// INSERT — this handler delegates without changing its surface contract.

import type { Pool } from "pg";
import type { Logger } from "pino";

import type { CatalogSnapshot } from "../catalog/catalog.js";
import {
  ProposeNodeInputSchema,
  type ProposeNodeInput,
  type ProposeNodeResult,
} from "../dto/propose-node.dto.js";
import { ValidationFailure } from "../validation/errors.js";
import { assertKnownType } from "../validation/structural.js";
import {
  assertRunIsRunning,
  runIngestHandler,
  type McpEnvelope,
} from "./handler-base.js";

export function buildProposeNodeHandler(args: {
  pool: Pool;
  logger: Logger;
  llm_run_id: string;
  catalog: CatalogSnapshot;
}) {
  return async (raw: unknown): Promise<McpEnvelope<ProposeNodeResult>> => {
    const parsed = ProposeNodeInputSchema.safeParse(raw);
    if (!parsed.success) {
      return await runIngestHandler({
        deps: { pool: args.pool, logger: args.logger, llm_run_id: args.llm_run_id },
        tool_name: "propose_node",
        input: raw as ProposeNodeInput,
        run: async () => {
          throw new ValidationFailure(
            "STRUCTURAL_INVALID",
            "Input failed Zod parse.",
            { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }
          );
        },
      });
    }
    return await proposeNodeHandler(parsed.data, args);
  };
}

export async function proposeNodeHandler(
  input: ProposeNodeInput,
  deps: { pool: Pool; logger: Logger; llm_run_id: string; catalog: CatalogSnapshot }
): Promise<McpEnvelope<ProposeNodeResult>> {
  return await runIngestHandler({
    deps,
    tool_name: "propose_node",
    input,
    run: async (client) => {
      await assertRunIsRunning(client, deps.llm_run_id);

      // Layer 1 — catalog lookup.
      const nodeType = deps.catalog.nodeTypeByName.get(input.node_type);
      assertKnownType({
        kind: "node_type",
        name: input.node_type,
        found: nodeType !== undefined,
      });
      // narrowing — assertKnownType guarantees defined
      const resolvedType = nodeType!;

      // Layer "concurrency primitive" — pg_advisory_xact_lock (BR-20). The
      // lock key combines node_type_id and norm(name) via the DB's hashtextextended.
      // We rely on the DB function `norm` already loaded by migration 0001.
      const lockArgRes = await client.query<{ key: string }>(
        `SELECT (CAST($1::text AS text) || E'\\x1F' || norm($2::text)) AS key`,
        [resolvedType.id, input.name]
      );
      const lockArg = lockArgRes.rows[0]?.key ?? `${resolvedType.id}\x1F${input.name}`;
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`,
        [lockArg]
      );

      // Entity-resolution proper is out of scope; the simplest correct write
      // path under the lock is: try to match an existing node by exact-norm
      // alias; otherwise create new.
      const matchRes = await client.query<{ node_id: string }>(
        `SELECT na.node_id
           FROM node_alias na
           JOIN knowledge_node kn ON kn.id = na.node_id
          WHERE na.alias_norm = norm($1::text)
            AND kn.node_type_id = $2
            AND kn.status = 'active'
          LIMIT 1`,
        [input.name, resolvedType.id]
      );

      let nodeId: string;
      let resolution: ProposeNodeResult["resolution"];
      if (matchRes.rows.length > 0) {
        nodeId = matchRes.rows[0]!.node_id;
        resolution = "matched_existing";
      } else {
        const ins = await client.query<{ id: string }>(
          `INSERT INTO knowledge_node (node_type_id, canonical_name)
           VALUES ($1, $2)
           RETURNING id`,
          [resolvedType.id, input.name]
        );
        nodeId = ins.rows[0]!.id;
        resolution = "created_new";
        // Canonical alias mirrors the canonical_name.
        await client.query(
          `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id)
           VALUES ($1, $2, 'canonical', $3)
           ON CONFLICT DO NOTHING`,
          [nodeId, input.name, deps.llm_run_id]
        );
      }

      // Add any new aliases — UNIQUE(node_id, alias_norm) handles duplicates.
      if (input.aliases && input.aliases.length > 0) {
        for (const alias of input.aliases) {
          await client.query(
            `INSERT INTO node_alias (node_id, alias, kind, created_by_run_id)
             VALUES ($1, $2, 'alias', $3)
             ON CONFLICT DO NOTHING`,
            [nodeId, alias, deps.llm_run_id]
          );
        }
      }

      const result: ProposeNodeResult = { node_id: nodeId, resolution };
      return {
        result,
        validation_outcome: "accepted",
        tool_call_result: { ...result },
      };
    },
  });
}
