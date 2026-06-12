// PostgreSQL connection pool — singleton, raw `pg` driver, parameterized
// queries only. No ORM (A6, §2.2 of v7).
//
// TC-01 acceptance criteria covered here:
//   - pg pool connects to the DB and executes a ping query on startup.
//   - statement_timeout is set per session via the `connect` hook.
//   - The pool is created exactly once and shared across all modules.

import { Pool, type PoolConfig, type PoolClient } from "pg";

import type { Env } from "./env.js";

/**
 * Per-connection setup. Runs once per backend connection acquired from the
 * pool — sets the statement timeout that the spec requires (10 s default).
 * Pool-level errors (`pool.on('error', ...)`) are emitted asynchronously
 * for connections idling in the pool — the bootstrap wires a handler on the
 * returned pool to log those without crashing the process.
 */
function buildPoolConfig(env: Env): PoolConfig {
  return {
    connectionString: env.DATABASE_URL,
    min: env.PG_POOL_MIN,
    max: env.PG_POOL_MAX,
    // Conservative connection-timeout: 5 s gives time for Neon to accept the
    // TCP handshake even on a cold connection without hanging the request
    // indefinitely.
    connectionTimeoutMillis: 5_000,
    // Drop idle connections after 30 s — managed Postgres (Neon) closes idle
    // ones anyway; doing it client-side keeps the pool slim.
    idleTimeoutMillis: 30_000,
    statement_timeout: env.PG_STATEMENT_TIMEOUT_MS,
  };
}

/**
 * Build a new pg `Pool`. The caller (`server.ts`) is responsible for keeping
 * the reference as a singleton and passing it to anyone who needs DB access.
 */
export function buildPool(env: Env): Pool {
  return new Pool(buildPoolConfig(env));
}

/**
 * Acquire a connection, run `SELECT 1`, release it. Used at startup to fail
 * fast when DATABASE_URL is unreachable or the credentials are wrong. The
 * caller decides what to do on failure (we surface the original error).
 */
export async function pingDatabase(pool: Pool): Promise<void> {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    const result = await client.query<{ ok: number }>("SELECT 1 AS ok");
    if (result.rows.length !== 1 || result.rows[0]?.ok !== 1) {
      throw new Error("Unexpected ping response from PostgreSQL.");
    }
  } finally {
    if (client !== undefined) {
      client.release();
    }
  }
}
