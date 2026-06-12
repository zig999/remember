// Transaction wrapper for the compliance-audit write endpoint (UC-01).
//
// BR-02: every UC-01 invocation runs inside ONE PostgreSQL transaction at
// READ COMMITTED isolation. BEGIN is opened by the route / MCP handler; the
// service receives the live `client` and never opens its own transaction.

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
      // Swallow ROLLBACK failure — surface the original error.
    }
    throw err;
  } finally {
    client.release();
  }
}
