// Transaction wrapper for curation write endpoints.
//
// BR-24: every UC-02..UC-10 endpoint runs inside ONE PostgreSQL transaction.
// The wrapper opens BEGIN / COMMIT around the supplied function. On any
// thrown error it ROLLBACKs — including the audit-row INSERT, so an
// uncommitted curation_action never leaks into the consumer side.

import type { Pool, PoolClient } from "pg";

export async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Swallow rollback failure — surface the original error.
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function withReadOnly<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await fn(client);
    await client.query("ROLLBACK");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Swallow rollback failure — surface the original error.
    }
    throw err;
  } finally {
    client.release();
  }
}
