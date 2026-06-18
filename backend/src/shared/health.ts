// BFF health probe — single source for the liveness/DB-reachability check used
// by BOTH the public `GET /health` route (app.ts) and the `health` MCP tool
// (ingestion toolset). Kept here, neutral of Fastify and of any domain module,
// so the MCP toolset can import it without a cycle back into app.ts.

import type { Pool } from "pg";

import { pingDatabase } from "../config/db.js";

/** Health-check result shape returned by `GET /health` and the `health` MCP tool. */
export interface HealthReport {
  ok: boolean;
  service: "remember-bff";
  database: "ok" | "unreachable";
  checked_at: string;
}

/**
 * Probe the BFF: confirm the process is up and the database is reachable. Never
 * throws — a DB failure surfaces as `{ ok: false, database: "unreachable" }`
 * so callers always get a usable report (the BFF answering at all proves it is
 * running; the `database` field reports the dependency separately).
 */
export async function collectHealth(pool: Pool): Promise<HealthReport> {
  const checkedAt = new Date().toISOString();
  try {
    await pingDatabase(pool);
    return {
      ok: true,
      service: "remember-bff",
      database: "ok",
      checked_at: checkedAt,
    };
  } catch {
    return {
      ok: false,
      service: "remember-bff",
      database: "unreachable",
      checked_at: checkedAt,
    };
  }
}
