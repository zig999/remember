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
// "v2" is the recommended version (Frente 2): the prompt registry dispatches it
// to the Event-dating prompt. ("extraction.v1" / unknown strings fall back to v1.)
const PROMPT_VERSION = process.env.E2E_PROMPT_VERSION ?? "v2";
const RUN_TIMEOUT_MS = Number(process.env.E2E_RUN_TIMEOUT_MS ?? 600_000);

// A distinctive term from the test document, used to prove lexical retrieval
// over HTTP. "Apollo" is the project all tasks belong to and should surface.
const SEARCH_TERM = "Apollo";

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
// The test document — a WhatsApp meeting-note dump (source_type 'chat').
// Dense and realistic: exercises the new ontology (Task node type + closed
// status/priority domains) alongside Person / Organization / Project. The
// framing states the bullets are Siegfried's responsibility, to be delivered
// to his boss Gabriel Amâncio, all part of project Apollo — so the LLM should
// produce Task nodes, reports_to (Siegfried→Gabriel), responsible_for
// (Siegfried→tasks) and part_of (tasks→Apollo). The nonce keeps content_hash
// unique per execution.
// --------------------------------------------------------------------------

function buildDocument(nonce: string): { content: string; title: string } {
  const title = `Pendências projeto Apollo — Siegfried (e2e ${nonce})`;
  const content = [
    `As tarefas abaixo são todas de minha responsabilidade (Siegfried Kreutzfeld Neto) e preciso entregá-las ao Gabriel Amâncio, meu chefe. Todas fazem parte do projeto Apollo.`,
    ``,
    `[6/12, 15:02] Siegfried Kreutzfeld Neto:`,
    `- Tratativa dos problemas do Aplicativo. Relatório gerado pela IFS a partir dos erros no grupo do Whatsapp.`,
    `- Troca de 300 aparelhos. Lista recebida ontem, 11/06. SC aberta, expectativa de chegar em 30 dias (Amorim apoiou e vou acompanhar até a entrega).`,
    `- IFS ETL - Réplica ou ETL das bases do Assyst, FSM e PSO para reports e insights.`,
    `- Lista de campos obrigatórios no Falcon`,
    `- Divergência do horário da venda X horário do agendamento X Cliente Ausente (Fernandes quem está fazendo a análise)`,
    `- Processo das exceções do agendamento automático. Quem é o suporte quando o agendamento pela Monique não for possível? Este processo não está comunicado, mas conforme conversamos, deverá ficar com o suporte (time do Aldo).`,
    `- Backlog do projeto Apollo - priorizar as melhorias para o segundo mês de operação assistida`,
    `- Garantir repasses para time interno (IFS -> Unifique)`,
    `- Problema de estoque - Atualização automática`,
    ``,
    `[6/12, 15:18] Siegfried Kreutzfeld Neto:`,
    `- Failed transaction - problema que sobrescreve as tarefas do técnico quando uma transação falha`,
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
        source_type: "chat",
        content,
        metadata: { title, document_date: "2026-06-12" },
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
    // This dense document can run well over 300s. A synchronous HTTP POST to
    // /run would hit undici's ~300s headersTimeout (not configurable here) and
    // tear down the in-process run mid-flight, wasting Anthropic credits. So we
    // invoke the orchestrator IN-PROCESS — the SAME runLlmExtraction the /run
    // route calls (real Anthropic tool-use loop) — with no client socket
    // timeout. Intake (step 1) and all reads (steps 3-4) still go over real HTTP.
    log(`[2/5] runLlmExtraction(${runId})  (real Anthropic loop, in-process — may take minutes)`);
    const { runLlmExtraction } = await import(
      "../../backend/src/modules/ingestion/service/extraction.service.ts"
    );
    const t0 = Date.now();
    let runResult: any;
    try {
      runResult = await runLlmExtraction(pool, runId, logger, ingestionCatalog as any, {
        env: { ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY },
      });
    } catch (err: any) {
      fail(`runLlmExtraction threw after ${((Date.now() - t0) / 1000).toFixed(1)}s: ${err?.message ?? String(err)}`);
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    log(`      → status=${runResult.status} attempts=${runResult.attempts} (${elapsed}s)`);
    log(`      → summary=${JSON.stringify(runResult.summary)}`);
    assert(failures, runResult.status === "completed", "run.status === 'completed'");

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
