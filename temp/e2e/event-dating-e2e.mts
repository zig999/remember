/**
 * Frente 2 — Real-LLM verification that v2 dates Events (BR-26).
 *
 * Unlike the deterministic prompt unit test (which proves the v2 SYSTEM prompt
 * CARRIES the Event-dating directive and that the registry dispatches v2), THIS
 * drives the WHOLE pipeline with the REAL Anthropic model and asserts the model
 * actually COMPLIES: a document describing dated events must yield Event nodes
 * with a populated `event_date`.
 *
 *   POST /api/v1/ingest/raw-information  (prompt_version="v2")
 *     → POST /api/v1/ingest/llm-runs/:id/run   (real Anthropic tool-use loop)
 *     → assert run completed
 *     → DB: node_attribute rows with key='event_date' created_by THIS run  ≥ 1
 *
 * It is LLM-bound (minutes possible), spends Anthropic tokens, is
 * NON-DETERMINISTIC, and writes durable rows. Run deliberately.
 *
 * Safety: NEVER runs against backend/.env as-is. REQUIRES E2E_BRANCH_HOST (an
 * `ep-...` ephemeral-branch endpoint host) and swaps ONLY the host in the @host/
 * segment — credentials are read from .env into memory, never logged. Requires
 * E2E_CONFIRM=1.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AddressInfo } from "node:net";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const BACKEND_DIR = resolve(REPO_ROOT, "backend");
const ENV_FILE = process.env.BACKEND_ENV_FILE ?? resolve(BACKEND_DIR, ".env");

const OPERATOR_ID = "event-dating-e2e-operator";
const MODEL = process.env.E2E_MODEL ?? "claude-opus-4-8";
const PROMPT_VERSION = process.env.E2E_PROMPT_VERSION ?? "v2"; // the version under test
const RUN_TIMEOUT_MS = Number(process.env.E2E_RUN_TIMEOUT_MS ?? 600_000);
const DOC_DATE = "2026-05-20"; // the ata's date — basis 'document' for valid_from

function loadEnvFile(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    fail(`Could not read env file at ${path} (needs DATABASE_URL / ANTHROPIC_API_KEY / NEON_AUTH_URL).`);
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}
function fail(msg: string): never {
  process.stderr.write(`\n✗ EVENT-DATING E2E ABORTED: ${msg}\n`);
  process.exit(2);
}
function redactDbHost(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}
function swapHost(dbUrl: string, host: string): string {
  const at = dbUrl.lastIndexOf("@");
  if (at < 0) fail("DATABASE_URL has no '@' — cannot swap host safely.");
  const slash = dbUrl.indexOf("/", at);
  if (slash < 0) fail("DATABASE_URL has no '/' after the host — cannot swap host safely.");
  return dbUrl.slice(0, at + 1) + host + dbUrl.slice(slash);
}

interface HttpResult {
  status: number;
  body: any;
}
async function http(
  baseUrl: string,
  method: "GET" | "POST",
  path: string,
  opts: { body?: unknown; timeoutMs?: number } = {}
): Promise<HttpResult> {
  const headers: Record<string, string> = { authorization: "Bearer event-dating-e2e-stub-token" };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
  }
  return { status: res.status, body };
}

const failures: string[] = [];
const warnings: string[] = [];
function assert(cond: boolean, label: string): void {
  log(cond ? `      ✓ ${label}` : `      ✗ ${label}`);
  if (!cond) failures.push(label);
}
function soft(cond: boolean, label: string): void {
  log(cond ? `      ✓ ${label}` : `      ⚠ ${label} (soft)`);
  if (!cond) warnings.push(label);
}

async function main(): Promise<void> {
  log("── Frente 2 — real-LLM Event-dating verification (v2) ────────────────");

  if (process.env.E2E_CONFIRM !== "1") {
    fail("refusing to run without E2E_CONFIRM=1 (spends Anthropic tokens; writes durable rows).");
  }
  const BRANCH_HOST = process.env.E2E_BRANCH_HOST;
  if (!BRANCH_HOST || !BRANCH_HOST.startsWith("ep-")) {
    fail(
      "E2E_BRANCH_HOST must be the ephemeral branch endpoint host (ep-...).\n" +
        "  This guard prevents the test from ever running against the default backend/.env host (prod)."
    );
  }

  loadEnvFile(ENV_FILE);
  if (process.env.DATABASE_URL === undefined) fail("DATABASE_URL not found in backend/.env.");
  process.env.DATABASE_URL = swapHost(process.env.DATABASE_URL!, BRANCH_HOST!);

  const { loadEnv } = await import("../../backend/src/config/env.ts");
  const { buildPool } = await import("../../backend/src/config/db.ts");
  const { buildLogger } = await import("../../backend/src/config/logger.ts");
  const { buildMcpServer } = await import("../../backend/src/mcp/server.ts");
  const { buildApp } = await import("../../backend/src/app.ts");
  const { loadCatalog } = await import("../../backend/src/modules/knowledge-graph/index.ts");
  const { loadCatalog: loadIngestionCatalog } = await import("../../backend/src/modules/ingestion/index.ts");

  const env = loadEnv();
  log(`• Target DB : ${redactDbHost(env.DATABASE_URL)}`);
  log(`• Model     : ${MODEL}   • Prompt: ${PROMPT_VERSION}`);
  log("");

  const logger = buildLogger({ LOG_LEVEL: (process.env.LOG_LEVEL as any) ?? "warn", NODE_ENV: env.NODE_ENV });
  const pool = buildPool(env);
  const auth = {
    preHandler: async (req: any) => {
      req.user = { id: OPERATOR_ID, claims: { sub: OPERATOR_ID } };
    },
  };

  let app: Awaited<ReturnType<typeof buildApp>> | undefined;
  try {
    const catClient = await pool.connect();
    let catalog;
    let ingestionCatalog;
    try {
      catalog = await loadCatalog(catClient);
      ingestionCatalog = await loadIngestionCatalog(catClient);
    } finally {
      catClient.release();
    }
    log(
      `• Catalog   : ${catalog.nodeTypeById.size} node types, ${catalog.linkTypeById.size} link types, ${catalog.attributeKeyById.size} attribute keys`
    );

    app = await buildApp({
      env,
      logger,
      pool,
      auth: auth as any,
      mcp: buildMcpServer(logger),
      catalog,
      ingestionCatalog,
    });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const addr = app.server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${addr.port}`;
    log(`• BFF up    : ${baseUrl}`);

    const nonce = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`.replace(
      /[^a-z0-9]/g,
      ""
    );
    const MARK = `evt${nonce}`;
    log(`• Nonce     : ${MARK}`);
    log("");

    // A document with THREE clearly dated events (a meeting, a go-live, a
    // workshop) — the v2 directive should make the model create Event nodes with
    // event_date. The nonce keeps content_hash + entity names unique per run.
    const content = [
      `Ata da reunião do projeto Atlas ${MARK}.`,
      `A reunião de kickoff do Atlas ${MARK} foi realizada em ${DOC_DATE}.`,
      `Ficou decidido que o go-live do Atlas ${MARK} será em 2026-11-01.`,
      `Haverá um workshop de treinamento do Atlas ${MARK} em 2026-09-15.`,
    ].join("\n");

    log(`[1/3] POST /ingest/raw-information  (prompt_version=${PROMPT_VERSION})`);
    const intake = await http(baseUrl, "POST", "/api/v1/ingest/raw-information", {
      body: {
        source_type: "ata",
        content,
        metadata: { title: `Event-dating verify ${MARK}`, document_date: DOC_DATE },
        model: MODEL,
        prompt_version: PROMPT_VERSION,
      },
    });
    if (intake.status !== 201 && intake.status !== 200) {
      fail(`intake HTTP ${intake.status}: ${JSON.stringify(intake.body)}`);
    }
    const runId: string = intake.body.llm_run_id;
    log(`      → raw=${intake.body.raw_information_id} run=${runId} chunks=${intake.body.chunk_count}`);

    log(`[2/3] POST /ingest/llm-runs/${runId}/run  (real Anthropic loop — may take minutes)`);
    const t0 = Date.now();
    const run = await http(baseUrl, "POST", `/api/v1/ingest/llm-runs/${runId}/run`, {
      timeoutMs: RUN_TIMEOUT_MS,
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    if (run.status !== 200) {
      fail(`run HTTP ${run.status} after ${elapsed}s: ${JSON.stringify(run.body)}`);
    }
    log(`      → status=${run.body.status} attempts=${run.body.attempts} (${elapsed}s)`);
    log(`      → summary=${JSON.stringify(run.body.summary)}`);
    assert(run.body.status === "completed", "run completed");

    // ---- Assertion: did this run produce Event.event_date? ----
    log("[3/3] DB: Event.event_date attributes created by this run");
    const c = await pool.connect();
    let rows: any[];
    let eventNodeCount = 0;
    try {
      const r = await c.query(
        `SELECT na.node_id,
                na.value AS event_date,
                to_char(na.valid_from, 'YYYY-MM-DD') AS valid_from,
                na.valid_from_source,
                (SELECT a2.value FROM node_attribute a2
                   JOIN attribute_key k2 ON k2.id = a2.attribute_key_id
                  WHERE a2.node_id = na.node_id AND k2.key = 'event_type' LIMIT 1) AS event_type
           FROM node_attribute na
           JOIN attribute_key ak ON ak.id = na.attribute_key_id
          WHERE ak.key = 'event_date' AND na.created_by_run_id = $1
          ORDER BY na.value ASC`,
        [runId]
      );
      rows = r.rows;
      // knowledge_node carries no created_by_run_id (only node_attribute does);
      // count the distinct Event nodes this run gave a date to.
      eventNodeCount = new Set(rows.map((row) => row.node_id)).size;
    } finally {
      c.release();
    }

    log(`      → Event nodes created this run: ${eventNodeCount}`);
    for (const row of rows) {
      log(
        `      • event_date='${row.event_date}' valid_from=${row.valid_from ?? "null"}` +
          ` basis=${row.valid_from_source ?? "—"} event_type=${row.event_type ?? "—"} node=${String(row.node_id).slice(0, 8)}`
      );
    }

    // HARD: the whole point of Frente 2 — the model dated at least one Event.
    assert(rows.length >= 1, "≥1 Event.event_date populated by the v2 run (Frente 2 works end-to-end)");
    // SOFT (LLM-variance): ideally it dated the go-live and the workshop too.
    soft(rows.length >= 2, "≥2 events dated (go-live + workshop both captured)");
    soft(
      rows.some((r) => r.event_date === "2026-11-01"),
      "the go-live event_date (2026-11-01) was captured"
    );
    soft(eventNodeCount >= 1, "≥1 Event node created this run");
  } finally {
    if (app !== undefined) await app.close().catch(() => undefined);
    await pool.end().catch(() => undefined);
  }

  log("");
  log("─────────────────────────────────────────────────────────────────────");
  for (const w of warnings) log(`⚠  ${w}`);
  if (failures.length === 0) {
    log(`✓ EVENT-DATING E2E PASSED — the real model, on prompt v2, produced dated Events.`);
    log(`  Frente 2 verified end-to-end (${warnings.length} soft warning(s)).`);
    process.exitCode = 0;
  } else {
    log(`✗ EVENT-DATING E2E FAILED — ${failures.length} assertion(s):`);
    for (const f of failures) log(`    - ${f}`);
    log("  If '≥1 Event.event_date' failed, the v2 directive did not steer the model — strengthen it.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`\n✗ EVENT-DATING E2E CRASHED: ${err?.stack ?? String(err)}\n`);
  process.exit(3);
});
