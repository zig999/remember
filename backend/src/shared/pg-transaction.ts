// Single source of truth for the pg transaction wrappers used across every
// module. Before this file the SAME `withTransaction` / `withReadOnly` bodies
// were copy-pasted in ~12 places (ingestion, curation, compliance-audit,
// knowledge-graph, query-retrieval — REST routes AND MCP toolsets), "kept in
// sync" by comment only. They now live here; each consumer imports them.
//
//   - withTransaction: BEGIN / COMMIT, ROLLBACK on any thrown error. The audit
//     row INSERT participates in the same transaction, so an uncommitted write
//     never leaks to the consumer side (curation BR-24, compliance BR-02).
//   - withReadOnly: BEGIN READ ONLY / unconditional ROLLBACK, so multi-statement
//     reads observe a stable `current_date` (knowledge-graph back spec §1
//     "Transaction policy"). There is nothing to commit.
//
// On the error path the secondary ROLLBACK failure is swallowed so the ORIGINAL
// error is the one that propagates (it is what the caller must see). Passing the
// optional `logger` surfaces that swallowed rollback failure at debug level for
// observability — without it the behavior is identical to the pre-extraction
// copies.

import type { Pool, PoolClient } from "pg";
import type { Logger } from "pino";

async function rollbackQuietly(
  client: PoolClient,
  logger?: Logger
): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch (err) {
    // Swallow rollback failure — surface the original error. Log at debug so
    // the swallow is observable when a logger is available.
    logger?.debug(
      { cause_message: err instanceof Error ? err.message : "unknown" },
      "pg ROLLBACK failed during error cleanup — original error preserved"
    );
  }
}

export async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
  logger?: Logger
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await rollbackQuietly(client, logger);
    throw err;
  } finally {
    client.release();
  }
}

export async function withReadOnly<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
  logger?: Logger
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await fn(client);
    await client.query("ROLLBACK");
    return result;
  } catch (err) {
    await rollbackQuietly(client, logger);
    throw err;
  } finally {
    client.release();
  }
}
