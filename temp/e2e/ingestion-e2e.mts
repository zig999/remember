/**
 * Ingestion → Knowledge-Graph functional E2E (text → graph).
 *
 * This is the live end-to-end test the project has carried as a known gap
 * ("functional E2E still untried"): it drives the WHOLE ingestion pipeline
 * against the REAL infrastructure and asserts the knowledge graph actually
 * gets populated and is queryable.
 *
 *   POST /api/v1/ingest/raw-information   (intake: RawInformation + chunks + LLMRun)
 *     → POST /api/v1/ingest/llm-runs/:id/run   (the real Anthropic tool-use loop, §9.3)
 *       → GET  /api/v1/ingest/llm-runs/:id           (run closed as `completed`)
 *       → GET  /api/v1/ingest/llm-runs/:id/tool-calls (per-proposal audit)
 *       → GET  /api/v1/nodes                          (graph readable over HTTP)
 *       → GET  /api/v1/search?query=…                 (lexical retrieval works)
 *
 * It is NOT part of `vitest run`: it is slow (LLM-bound, minutes possible),
 * costs Anthropic API tokens, and writes durable rows to a real PostgreSQL.
 * Run it deliberately. See ./README.md for the full runbook + safety notes.
 *
 * Design:
 *  - Boots the real BFF in-process via `buildApp` (real pg pool → Neon, real
 *    catalog loaded from the DB, real `@anthropic-ai/sdk`), listening on an
 *    ephemeral localhost port, and hits it over real HTTP with `fetch`.
 *  - Auth is the access gate only (single-owner, no `User` entity) and has its
 *    own integration tests; here the JWKS verification is replaced by a stub
 *    preHandler that sets the operator identity. Everything below auth is real.
 *  - Each run embeds a unique nonce in the document so the content_hash is
 *    fresh (the intake is idempotent on content_hash — a fixed document would
 *    return `noop_existing` on the 2nd run and the run could not be re-driven).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AddressInfo } from "node:net";

// --------------------------------------------------------------------------
// Paths + config
// --------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const BACKEND_DIR = resolve(REPO_ROOT, "backend");
const ENV_FILE = process.env.BACKEND_ENV_FILE ?? resolve(BACKEND_DIR, ".env");

const OPERATOR_ID = "e2e-operator";
const MODEL = process.env.E2E_MODEL ?? "claude-opus-4-8";
const PROMPT_VERSION = process.env.E2E_PROMPT_VERSION ?? "extraction.v1";
const RUN_TIMEOUT_MS = Number(process.env.E2E_RUN_TIMEOUT_MS ?? 600_000);

// A distinctive term from the test document, used to prove lexical retrieval
// over HTTP. "Rodrigo" appears in both paragraphs and should surface as a node.
const SEARCH_TERM = "Rodrigo";

// Counters that the pipeline writes to. We diff before/after to attribute the
// graph growth to THIS run rather than to whatever was already in the DB.
const COUNTED_TABLES = [
  "information_fragment",
  "knowledge_node",
  "knowledge_link",
  "node_attribute",
  "provenance",
  "tool_call",
] as const;
type CountedTable = (typeof COUNTED_TABLES)[number];
type Counts = Record<CountedTable, number>;

// --------------------------------------------------------------------------
// Tiny .env loader (no dotenv dependency — keep this script self-sufficient
// regardless of how it is launched). Existing process.env wins, so callers
// can still override DATABASE_URL etc. on the command line.
// --------------------------------------------------------------------------

function loadEnvFile(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    fail(
      `Could not read env file at ${path}. Point BACKEND_ENV_FILE at backend/.env ` +
        `or export DATABASE_URL / ANTHROPIC_API_KEY / NEON_AUTH_URL yourself.`
    );
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// --------------------------------------------------------------------------
// Reporting helpers
// --------------------------------------------------------------------------

function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

function fail(msg: string): never {
  process.stderr.write(`\n✗ E2E ABORTED: ${msg}\n`);
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

// --------------------------------------------------------------------------
// The test document. Deliberately small (one chunk) and information-dense:
// 4 entities (2 projects, 2 people), several relations + attributes, and a
// datable fact — enough for the LLM to propose nodes, links and attributes
// with provenance while staying fast/cheap. It also exercises §4 coreference:
// "Rodrigo" in the 2nd paragraph must resolve to "Rodrigo Isensee" (one node,
// not two). The nonce keeps the content_hash unique per execution.
// --------------------------------------------------------------------------

function buildDocument(nonce: string): { content: string; title: string } {
  const title = `Status de projetos — WMS e Portal de Compras (e2e ${nonce})`;
  const content = [
    `O projeto WMS é um projeto de responsabilidade do Rodrigo Isensee.`,
    `Este projeto está sem prazo definido e está em fase de aprovação.`,
    ``,
    `O projeto Portal de Compras também é de responsabilidade do Rodrigo.`,
    `Este projeto também está sem prazo e em aprovação.`,
    ``,
    `No dia 27/05/2026 as propostas foram entregues ao diretor Luiz Bogo desde então aguarda-se uma deliberação de aprovação.`,
    ``,
    `(marcador de teste e2e ${nonce})`,
  ].join("\n");
  return { content, title };
}

// --------------------------------------------------------------------------
// HTTP helpers (over the real listening socket)
// --------------------------------------------------------------------------

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
  const headers: Record<string, string> = {
    // The stub auth preHandler ignores the token value, but we send one so the
    // request shape matches production (Authorization: Bearer <jwt>).
    authorization: "Bearer e2e-stub-token",
  };
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

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main(): Promise<void> {
  log("── Ingestion → Knowledge-Graph functional E2E ───────────────────────");

  if (process.env.E2E_CONFIRM !== "1") {
    fail(
      "refusing to run without E2E_CONFIRM=1.\n" +
        "  This test writes durable rows to the real database and spends Anthropic API tokens.\n" +
        "  RawInformation is immutable (no normal delete) — prefer a Neon ephemeral branch.\n" +
        "  See temp/e2e/README.md, then re-run with E2E_CONFIRM=1."
    );
  }

  loadEnvFile(ENV_FILE);

  // Dynamic imports AFTER env load — defensive even though no backend module
  // reads process.env at import time. Paths are relative to this script.
  const { loadEnv } = await import("../../backend/src/config/env.ts");
  const { buildPool } = await import("../../backend/src/config/db.ts");
  const { buildLogger } = await import("../../backend/src/config/logger.ts");
  const { buildMcpServer } = await import("../../backend/src/mcp/server.ts");
  const { buildApp } = await import("../../backend/src/app.ts");
  const { loadCatalog } = await import(
    "../../backend/src/modules/knowledge-graph/index.ts"
  );
  const { loadCatalog: loadIngestionCatalog } = await import(
    "../../backend/src/modules/ingestion/index.ts"
  );

  const env = loadEnv();
  log(`• Target DB : ${redactDbHost(env.DATABASE_URL)}`);
  log(`• Model     : ${MODEL}`);
  log(`• Prompt    : ${PROMPT_VERSION}`);
  log("");

  // pino → we keep it quiet so the report dominates stdout. Flip with LOG_LEVEL.
  const logger = buildLogger({
    LOG_LEVEL: (process.env.LOG_LEVEL as any) ?? "warn",
    NODE_ENV: env.NODE_ENV,
  });
  const pool = buildPool(env);

  // Auth seam: replace JWKS verification with a single-owner stub. Everything
  // below this line is the real pipeline.
  const auth = {
    preHandler: async (req: any) => {
      req.user = { id: OPERATOR_ID, claims: { sub: OPERATOR_ID } };
    },
  };

  let appClosed = false;
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;
  const failures: string[] = [];
  const warnings: string[] = [];

  try {
    // Load both catalog snapshots from the DB (knowledge-graph + ingestion).
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
      `• Catalog   : ${catalog.nodeTypeById.size} node types, ` +
        `${catalog.linkTypeById.size} link types, ` +
        `${catalog.attributeKeyById.size} attribute keys`
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
    log("");

    // ---- Step 0: pre-counts -------------------------------------------------
    const before = await snapshotCounts(pool);

    // ---- Step 1: intake -----------------------------------------------------
    const nonce = `${Date.now().toString(36)}-${Math.floor(
      Math.random() * 1e6
    ).toString(36)}`;
    const { content, title } = buildDocument(nonce);
    log(`[1/5] POST /ingest/raw-information  (nonce=${nonce})`);
    const intake = await http(baseUrl, "POST", "/api/v1/ingest/raw-information", {
      body: {
        source_type: "ata",
        content,
        metadata: { title, document_date: "2026-05-27" },
        model: MODEL,
        prompt_version: PROMPT_VERSION,
      },
    });
    if (intake.status !== 201 && intake.status !== 200) {
      fail(`intake returned HTTP ${intake.status}: ${JSON.stringify(intake.body)}`);
    }
    const rawId: string = intake.body.raw_information_id;
    const runId: string = intake.body.llm_run_id;
    const chunkCount: number = intake.body.chunk_count;
    log(
      `      → outcome=${intake.body.outcome} raw=${rawId} run=${runId} chunks=${chunkCount}`
    );
    if (intake.body.outcome !== "created") {
      warnings.push(
        `intake outcome was '${intake.body.outcome}', not 'created' — the run may not be runnable`
      );
    }
    assert(failures, chunkCount >= 1, "chunk_count >= 1");

    // ---- Step 2: drive the LLM extraction loop ------------------------------
    log(`[2/5] POST /ingest/llm-runs/${runId}/run  (real Anthropic loop — may take minutes)`);
    const t0 = Date.now();
    const run = await http(baseUrl, "POST", `/api/v1/ingest/llm-runs/${runId}/run`, {
      timeoutMs: RUN_TIMEOUT_MS,
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    if (run.status !== 200) {
      fail(
        `run returned HTTP ${run.status} after ${elapsed}s: ${JSON.stringify(run.body)}`
      );
    }
    log(`      → status=${run.body.status} attempts=${run.body.attempts} (${elapsed}s)`);
    log(`      → summary=${JSON.stringify(run.body.summary)}`);
    assert(failures, run.body.status === "completed", "run.status === 'completed'");

    // ---- Step 3: audit trail ------------------------------------------------
    log(`[3/5] GET  /ingest/llm-runs/${runId}/tool-calls`);
    const toolCalls = await http(
      baseUrl,
      "GET",
      `/api/v1/ingest/llm-runs/${runId}/tool-calls?limit=100`
    );
    const tcItems: any[] = toolCalls.body?.items ?? toolCalls.body ?? [];
    log(`      → ${tcItems.length} tool-call rows recorded`);

    // ---- Step 4: graph readable over HTTP -----------------------------------
    log("[4/5] GET  /nodes  +  GET /search");
    const nodes = await http(baseUrl, "GET", "/api/v1/nodes?limit=100");
    assert(failures, nodes.status === 200, "GET /nodes → 200");
    const nodeItems: any[] = nodes.body?.items ?? [];
    log(`      → /nodes returned ${nodeItems.length} item(s), total=${nodes.body?.total}`);

    const search = await http(
      baseUrl,
      "GET",
      `/api/v1/search?query=${encodeURIComponent(SEARCH_TERM)}&layers=node&layers=fragment&layers=chunk`
    );
    if (search.status === 200) {
      const hits: any[] =
        search.body?.results ?? search.body?.items ?? search.body?.hits ?? [];
      log(`      → /search "${SEARCH_TERM}" returned ${hits.length} hit(s)`);
      if (hits.length === 0) {
        warnings.push(`search for "${SEARCH_TERM}" returned 0 hits`);
      }
    } else {
      warnings.push(`GET /search returned HTTP ${search.status}`);
    }

    // ---- Step 5: graph-growth deltas (the hard gate) ------------------------
    log("[5/5] DB deltas (this run's contribution to the graph)");
    const after = await snapshotCounts(pool);
    const delta = {} as Counts;
    for (const t of COUNTED_TABLES) {
      delta[t] = after[t] - before[t];
      log(`      → ${t.padEnd(20)} ${before[t]} → ${after[t]}  (Δ ${delta[t] >= 0 ? "+" : ""}${delta[t]})`);
    }

    // Hard gate: text actually became a traceable graph.
    assert(failures, delta.information_fragment > 0, "Δ information_fragment > 0");
    assert(failures, delta.knowledge_node > 0, "Δ knowledge_node > 0");
    assert(failures, delta.provenance > 0, "Δ provenance > 0 (anti-hallucination, §13)");
    assert(failures, delta.tool_call > 0, "Δ tool_call > 0 (audit, §3.5)");

    // Soft signals: the document implies a relation + an attribute, but LLM
    // output varies — surface as warnings, not failures.
    if (delta.knowledge_link <= 0) warnings.push("Δ knowledge_link == 0 (expected ≥1 relation)");
    if (delta.node_attribute <= 0) warnings.push("Δ node_attribute == 0 (expected ≥1 attribute)");
  } finally {
    if (app !== undefined && !appClosed) {
      appClosed = true;
      await app.close().catch(() => undefined);
    }
    await pool.end().catch(() => undefined);
  }

  // ---- Verdict --------------------------------------------------------------
  log("");
  log("─────────────────────────────────────────────────────────────────────");
  for (const w of warnings) log(`⚠  ${w}`);
  if (failures.length === 0) {
    log(`✓ E2E PASSED — ${warnings.length} warning(s).`);
    log("  Text → graph confirmed: nodes, fragments and provenance were created");
    log("  by the live Anthropic tool-use loop and the graph is queryable over HTTP.");
    process.exitCode = 0;
  } else {
    log(`✗ E2E FAILED — ${failures.length} assertion(s) failed:`);
    for (const f of failures) log(`    - ${f}`);
    process.exitCode = 1;
  }
}

function assert(failures: string[], cond: boolean, label: string): void {
  if (cond) {
    log(`      ✓ ${label}`);
  } else {
    log(`      ✗ ${label}`);
    failures.push(label);
  }
}

async function snapshotCounts(pool: import("pg").Pool): Promise<Counts> {
  const client = await pool.connect();
  try {
    const out = {} as Counts;
    for (const t of COUNTED_TABLES) {
      // Table names come from a fixed const list — never from input — so the
      // interpolation here is safe (no SQL injection surface).
      const r = await client.query<{ n: string }>(`SELECT count(*)::int AS n FROM ${t}`);
      out[t] = Number(r.rows[0]?.n ?? 0);
    }
    return out;
  } finally {
    client.release();
  }
}

main().catch((err) => {
  process.stderr.write(`\n✗ E2E CRASHED: ${err?.stack ?? String(err)}\n`);
  process.exit(3);
});
