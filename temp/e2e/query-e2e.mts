/**
 * Content-query functional E2E (deterministic seed → retrieval surface).
 *
 * Sibling of `ingestion-e2e-apollo.mts`. That one closes the loop with the REAL
 * LLM and therefore can only make SOFT assertions about retrieval (LLM output
 * varies). THIS one removes the LLM entirely: it seeds a small, KNOWN
 * knowledge-graph through the REAL write path (the same `propose_*` MCP handlers
 * the extraction loop calls — minus Anthropic) and then exercises the WHOLE
 * query-retrieval surface over real HTTP with EXACT assertions.
 *
 * Why seed through the handlers and not raw SQL? Because the handlers run the
 * real layered validation (§13), entity resolution (§4) and consolidation
 * (§6.5) — so the seeded rows are shaped EXACTLY like production rows, and the
 * fragment→accepted promotion (§6.6) happens for real. Raw INSERTs would not
 * exercise any of that and could produce out-of-shape rows.
 *
 *   seed (no LLM): propose_fragment ×5 → propose_node ×4 → propose_link ×3 → propose_attribute ×2
 *     → GET /search                         (full-text, fuzzy, graph expansion — UC-01)
 *     → GET /nodes/:id/traverse             (graph traversal + temporal filter — UC-06)
 *     → GET /provenance/links/:id           (cross-layer provenance walk — UC-07)
 *     → GET /provenance/fragments/:id       (accepted=200, proposed-only=404 — UC-09)
 *     → negative gates                      (422 empty/bad-layer, 404 unknown node)
 *     → DB count deltas                     (deterministic: +4 nodes, +3 links, +2 attrs, +5 fragments)
 *
 * It is NOT part of `vitest run`: it boots the real BFF against a real Neon DB
 * and writes durable, IMMUTABLE rows. Run it deliberately. See ./README.md.
 *
 * Determinism: unlike the ingestion E2E, every count here is exact — there is
 * no model in the loop. Each entity name carries a per-run nonce token so the
 * seed never collides with pre-existing data and every hit is attributable to
 * THIS execution.
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

const OPERATOR_ID = "query-e2e-operator";
const MODEL = process.env.E2E_MODEL ?? "claude-opus-4-8";
const PROMPT_VERSION = process.env.E2E_PROMPT_VERSION ?? "query-e2e.seed.v1";
const DOC_DATE = "2026-06-12"; // justifies valid_from with basis 'document'

// Tables whose growth we attribute to this run (exact deltas — no LLM variance).
const COUNTED_TABLES = [
  "information_fragment",
  "knowledge_node",
  "knowledge_link",
  "node_attribute",
  "provenance",
] as const;
type CountedTable = (typeof COUNTED_TABLES)[number];
type Counts = Record<CountedTable, number>;

// --------------------------------------------------------------------------
// Tiny .env loader (no dotenv dependency — keep this script self-sufficient).
// Existing process.env wins, so callers can override DATABASE_URL on the CLI.
// --------------------------------------------------------------------------

function loadEnvFile(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    fail(
      `Could not read env file at ${path}. Point BACKEND_ENV_FILE at backend/.env ` +
        `or export DATABASE_URL / NEON_AUTH_URL yourself.`
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
  process.stderr.write(`\n✗ QUERY E2E ABORTED: ${msg}\n`);
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
// HTTP helper (over the real listening socket)
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
    authorization: "Bearer query-e2e-stub-token",
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
// Assertions
// --------------------------------------------------------------------------

const failures: string[] = [];
const warnings: string[] = [];

function assert(cond: boolean, label: string): void {
  if (cond) {
    log(`      ✓ ${label}`);
  } else {
    log(`      ✗ ${label}`);
    failures.push(label);
  }
}

function soft(cond: boolean, label: string): void {
  if (cond) {
    log(`      ✓ ${label}`);
  } else {
    log(`      ⚠ ${label} (soft)`);
    warnings.push(label);
  }
}

async function snapshotCounts(pool: import("pg").Pool): Promise<Counts> {
  const client = await pool.connect();
  try {
    const out = {} as Counts;
    for (const t of COUNTED_TABLES) {
      // Names come from a fixed const list — never input — so interpolation is safe.
      const r = await client.query<{ n: string }>(
        `SELECT count(*)::int AS n FROM ${t}`
      );
      out[t] = Number(r.rows[0]?.n ?? 0);
    }
    return out;
  } finally {
    client.release();
  }
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main(): Promise<void> {
  log("── Content-query functional E2E (deterministic seed → retrieval) ─────");

  if (process.env.E2E_CONFIRM !== "1") {
    fail(
      "refusing to run without E2E_CONFIRM=1.\n" +
        "  This test writes durable, IMMUTABLE rows to the real database.\n" +
        "  RawInformation has no normal delete — prefer a Neon ephemeral branch.\n" +
        "  See temp/e2e/README.md, then re-run with E2E_CONFIRM=1."
    );
  }

  loadEnvFile(ENV_FILE);

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
  // Real `propose_*` MCP handlers (the extraction loop calls these exact fns).
  const { proposeFragmentHandler } = await import(
    "../../backend/src/modules/ingestion/mcp/propose-fragment.handler.ts"
  );
  const { proposeNodeHandler } = await import(
    "../../backend/src/modules/ingestion/mcp/propose-node.handler.ts"
  );
  const { proposeLinkHandler } = await import(
    "../../backend/src/modules/ingestion/mcp/propose-link.handler.ts"
  );
  const { proposeAttributeHandler } = await import(
    "../../backend/src/modules/ingestion/mcp/propose-attribute.handler.ts"
  );
  const { closeLlmRun } = await import(
    "../../backend/src/modules/ingestion/service/llm-run.service.ts"
  );

  const env = loadEnv();
  log(`• Target DB : ${redactDbHost(env.DATABASE_URL)}`);
  log("");

  const logger = buildLogger({
    LOG_LEVEL: (process.env.LOG_LEVEL as any) ?? "warn",
    NODE_ENV: env.NODE_ENV,
  });
  const pool = buildPool(env);

  // Auth seam: single-owner stub. Everything below is the real pipeline.
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

    // Per-run nonce → unique, attributable, collision-free entity names.
    const nonce = `${Date.now().toString(36)}${Math.floor(
      Math.random() * 1e6
    ).toString(36)}`.replace(/[^a-z0-9]/g, "");
    const MARK = `qe2e${nonce}`;
    const tag = (role: string) => `n${role}${MARK}`; // single FTS token per node
    log(`• Nonce     : ${MARK}`);
    log("");

    const before = await snapshotCounts(pool);

    // ---- Step 1: intake (creates RawInformation + RawChunk + running LLMRun) ----
    log("[1/8] POST /ingest/raw-information  (seed container)");
    const content = [
      `Notas de teste de consulta (${MARK}).`,
      `Marina Closs ${tag("mar")} reporta-se a Gabriel Amancio ${tag("gab")}.`,
      `Marina Closs ${tag("mar")} é responsável pela tarefa Migracao do faturamento ${tag("task")}.`,
      `A tarefa Migracao do faturamento ${tag("task")} faz parte do Projeto Helios ${tag("hel")}.`,
      `A tarefa está em andamento, prioridade alta.`,
      `Observação solta sem entidade referenciada (${MARK}).`,
    ].join("\n");
    const intake = await http(baseUrl, "POST", "/api/v1/ingest/raw-information", {
      body: {
        source_type: "chat",
        content,
        metadata: { title: `Query E2E seed ${MARK}`, document_date: DOC_DATE },
        model: MODEL,
        prompt_version: PROMPT_VERSION,
      },
    });
    if (intake.status !== 201 && intake.status !== 200) {
      fail(`intake HTTP ${intake.status}: ${JSON.stringify(intake.body)}`);
    }
    const rawId: string = intake.body.raw_information_id;
    const runId: string = intake.body.llm_run_id;
    log(`      → raw=${rawId} run=${runId} chunks=${intake.body.chunk_count}`);

    // The fragment handler needs an explicit chunk id (the LLM loop injects the
    // "current" chunk; here we are the orchestrator, so we read it ourselves).
    const chunkClient = await pool.connect();
    let chunkId: string;
    try {
      const r = await chunkClient.query<{ id: string }>(
        `SELECT id FROM raw_chunk WHERE raw_information_id = $1 ORDER BY chunk_index ASC LIMIT 1`,
        [rawId]
      );
      if (r.rowCount === 0) fail(`no raw_chunk for raw_information ${rawId}`);
      chunkId = r.rows[0].id;
    } finally {
      chunkClient.release();
    }

    // ---- Step 2: deterministic seed through the real propose_* handlers ----
    log("[2/8] seed graph via propose_* handlers (no LLM)");
    // The propose_* handlers live in the ingestion module and require the
    // INGESTION catalog snapshot (it carries attributeValidValuesByKeyId for the
    // closed-domain check). The HTTP query routes use the knowledge-graph
    // `catalog`; both were handed to buildApp above.
    const fragDeps = { pool, logger, llm_run_id: runId };
    const nodeDeps = { pool, logger, llm_run_id: runId, catalog: ingestionCatalog };
    const wDeps = {
      pool,
      logger,
      llm_run_id: runId,
      catalog: ingestionCatalog,
      now: () => new Date(),
    };

    const unwrap = <T,>(envelope: any, label: string): T => {
      if (!envelope?.ok) fail(`${label} failed: ${JSON.stringify(envelope?.error)}`);
      return envelope.result as T;
    };

    // Fragments: F0..F3 are cited by links/attrs (→ promoted to accepted);
    // F4 is never cited (→ stays 'proposed', drives the negative provenance test).
    const fragTexts = [
      `Marina Closs reporta-se a Gabriel Amancio.`,
      `Marina Closs é responsável pela tarefa Migracao do faturamento.`,
      `A tarefa Migracao do faturamento faz parte do Projeto Helios.`,
      `A tarefa está em andamento com prioridade alta.`,
      `Observação solta, não citada por nenhum link ou atributo.`,
    ];
    const fragmentIds: string[] = [];
    for (const text of fragTexts) {
      const r = unwrap<{ fragment_id: string }>(
        await proposeFragmentHandler(
          { text, confidence: 0.95, chunk_ids: [chunkId] },
          fragDeps
        ),
        "propose_fragment"
      );
      fragmentIds.push(r.fragment_id);
    }

    const node = async (node_type: string, name: string) =>
      unwrap<{ node_id: string }>(
        await proposeNodeHandler({ node_type, name }, nodeDeps),
        `propose_node(${name})`
      ).node_id;

    const marinaId = await node("Person", `Marina Closs ${tag("mar")}`);
    const gabrielId = await node("Person", `Gabriel Amancio ${tag("gab")}`);
    const heliosId = await node("Project", `Projeto Helios ${tag("hel")}`);
    const taskId = await node("Task", `Migracao do faturamento ${tag("task")}`);

    const link = async (
      source_node_id: string,
      link_type: string,
      target_node_id: string,
      fragIdx: number
    ) =>
      unwrap<{ link_id: string | null; outcome: string }>(
        await proposeLinkHandler(
          {
            source_node_id,
            link_type,
            target_node_id,
            confidence: 0.95,
            fragment_ids: [fragmentIds[fragIdx]],
            valid_from: DOC_DATE,
            valid_from_basis: "document",
            change_hint: "none",
          },
          wDeps
        ),
        `propose_link(${link_type})`
      );

    const reportsTo = await link(marinaId, "reports_to", gabrielId, 0);
    const responsibleFor = await link(marinaId, "responsible_for", taskId, 1);
    const partOf = await link(taskId, "part_of", heliosId, 2);

    const attribute = async (key: string, value: string, fragIdx: number) =>
      unwrap<{ attribute_id: string | null; outcome: string }>(
        await proposeAttributeHandler(
          {
            node_id: taskId,
            key,
            value,
            confidence: 0.95,
            fragment_ids: [fragmentIds[fragIdx]],
            valid_from: DOC_DATE,
            valid_from_basis: "document",
            change_hint: "none",
          },
          wDeps
        ),
        `propose_attribute(${key})`
      );

    const statusAttr = await attribute("status", "em andamento", 3);
    const priorityAttr = await attribute("priority", "alta", 3);

    // Close the run cleanly so it is not left dangling as 'running'.
    const closeClient = await pool.connect();
    try {
      await closeLlmRun(closeClient, { llm_run_id: runId, outcome: "completed" });
    } finally {
      closeClient.release();
    }

    log(
      `      → nodes: marina=${marinaId.slice(0, 8)} gabriel=${gabrielId.slice(
        0,
        8
      )} helios=${heliosId.slice(0, 8)} task=${taskId.slice(0, 8)}`
    );
    log(
      `      → links: reports_to=${reportsTo.outcome} responsible_for=${responsibleFor.outcome} part_of=${partOf.outcome}`
    );
    log(`      → attrs: status=${statusAttr.outcome} priority=${priorityAttr.outcome}`);
    assert(reportsTo.link_id !== null, "reports_to link consolidated (link_id != null)");
    assert(partOf.link_id !== null, "part_of link consolidated (link_id != null)");

    // ---- Step 3: full-text node search (UC-01) ----
    log("[3/8] GET /search  (full-text, layer=node)");
    const searchNode = async (q: string, extra = "") =>
      http(
        baseUrl,
        "GET",
        `/api/v1/search?query=${encodeURIComponent(q)}&layers=node&expand=false${extra}`
      );

    const helHit = await searchNode(tag("hel"));
    assert(helHit.status === 200, "GET /search → 200");
    const helItems: any[] = helHit.body?.items ?? [];
    assert(
      helItems.some((i) => i.id === heliosId),
      "search(unique helios token) returns the seeded Helios node"
    );
    const helProv = helItems.find((i) => i.id === heliosId)?.provenance ?? [];
    assert(helProv.length > 0, "Helios search hit carries provenance (§13)");

    const marHit = await searchNode(tag("mar"));
    assert(
      (marHit.body?.items ?? []).some((i: any) => i.id === marinaId),
      "search(unique marina token) returns the seeded Marina node"
    );

    // Fuzzy / trigram (pg_trgm): a typo'd token should still surface the node.
    const fuzzy = await searchNode(tag("hel").replace("hel", "hle")); // transposed
    soft(
      (fuzzy.body?.items ?? []).some((i: any) => i.id === heliosId),
      "fuzzy (trigram) search with a typo still finds Helios"
    );

    // ---- Step 3b: REST↔MCP parity for `search` (TC-04, BR-26 / BR-25) ----
    //
    // Same logical request issued twice: once over REST GET /search, once
    // over MCP POST /api/v1/mcp/query `tools/call name=search`. The seeded
    // graph is identical (Step 1/2 above wrote it once via the ingest path),
    // so any divergence between the two payloads is a transport-layer bug.
    // The parity assertion compares the item ids — the only thing the LLM
    // caller actually consumes; the rest of the payload is asserted equal
    // under the integration suite where determinism is guaranteed.
    log("[3b] MCP↔REST parity: tools/call search");
    const restQ = tag("hel");
    const restParity = await searchNode(restQ);
    const restIds = (restParity.body?.items ?? [])
      .map((i: any) => i.id as string)
      .sort();
    const mcpParity = await http(baseUrl, "POST", `/api/v1/mcp/query`, {
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "search",
          arguments: { query: restQ, layers: ["node"], expand: false },
        },
      },
    });
    assert(
      mcpParity.status === 200 && mcpParity.body?.result?.ok === true,
      "MCP tools/call search → JSON-RPC 200 + ok=true"
    );
    const mcpIds = ((mcpParity.body?.result?.result?.items ?? []) as any[])
      .map((i) => i.id as string)
      .sort();
    assert(
      JSON.stringify(mcpIds) === JSON.stringify(restIds),
      `MCP search items match REST items for query '${restQ}' (REST=${restIds.length} MCP=${mcpIds.length})`
    );
    assert(
      mcpIds.includes(heliosId),
      "MCP search returns the seeded Helios node (parity hit)"
    );

    // ---- Step 4: graph expansion from a search hit (UC-01, expand) ----
    log("[4/8] GET /search  (expand=true, depth=2)");
    const expanded = await http(
      baseUrl,
      "GET",
      `/api/v1/search?query=${encodeURIComponent(
        tag("hel")
      )}&layers=node&expand=true&expand_depth=2`
    );
    const expItems: any[] = expanded.body?.items ?? [];
    const taskViaExpand = expItems.find((i) => i.id === taskId);
    assert(
      taskViaExpand !== undefined && taskViaExpand.hop > 0,
      "expansion reaches Task (part_of Helios) at hop > 0"
    );
    soft(
      expItems.some((i) => i.id === marinaId && i.hop >= 1),
      "expansion reaches Marina (responsible_for Task) at depth 2"
    );

    // ---- Step 5: traversal + temporal filter (UC-06) ----
    log("[5/8] GET /nodes/:id/traverse  (direction=out, depth=2 + temporal)");
    const traverse = await http(
      baseUrl,
      "GET",
      `/api/v1/nodes/${marinaId}/traverse?direction=out&depth=2`
    );
    assert(traverse.status === 200, "GET /traverse → 200");
    const tLinks: any[] = traverse.body?.links ?? [];
    assert(
      tLinks.some((l) => l.id === reportsTo.link_id),
      "traverse(out) returns reports_to (Marina→Gabriel) at depth 1"
    );
    assert(
      tLinks.some((l) => l.id === partOf.link_id),
      "traverse(out) reaches part_of (Task→Helios) at depth 2"
    );

    const tPast = await http(
      baseUrl,
      "GET",
      `/api/v1/nodes/${marinaId}/traverse?direction=out&depth=2&as_of=2020-01-01&in_effect_only=true`
    );
    const pastSeeded = (tPast.body?.links ?? []).filter((l: any) =>
      [reportsTo.link_id, responsibleFor.link_id, partOf.link_id].includes(l.id)
    );
    assert(
      pastSeeded.length === 0,
      "traverse as_of=2020 + in_effect_only → seeded links NOT in effect (temporal, §5)"
    );
    const tNow = await http(
      baseUrl,
      "GET",
      `/api/v1/nodes/${marinaId}/traverse?direction=out&depth=2&as_of=2026-06-13&in_effect_only=true`
    );
    assert(
      (tNow.body?.links ?? []).some((l: any) => l.id === reportsTo.link_id),
      "traverse as_of=2026-06-13 + in_effect_only → seeded links ARE in effect"
    );

    // ---- Step 6: provenance walk (UC-07 / UC-09) ----
    log("[6/8] GET /provenance/*  (cross-layer walk back to source)");
    const linkProv = await http(
      baseUrl,
      "GET",
      `/api/v1/provenance/links/${reportsTo.link_id}`
    );
    assert(linkProv.status === 200, "GET /provenance/links/:id → 200");
    const walkedRawIds = (linkProv.body?.fragments ?? []).flatMap((f: any) =>
      (f.chunks ?? []).map((c: any) => c.raw_information?.id)
    );
    assert(
      walkedRawIds.includes(rawId),
      "link provenance walks back to the seeded RawInformation (anti-hallucination, §13)"
    );

    const accFrag = await http(
      baseUrl,
      "GET",
      `/api/v1/provenance/fragments/${fragmentIds[0]}`
    );
    assert(
      accFrag.status === 200,
      "GET /provenance/fragments/:id (accepted, cited) → 200"
    );

    // F4 (index 4) was never cited → stays 'proposed' → must 404.
    const propFrag = await http(
      baseUrl,
      "GET",
      `/api/v1/provenance/fragments/${fragmentIds[4]}`
    );
    assert(
      propFrag.status === 404 &&
        propFrag.body?.error?.code?.includes("FRAGMENT_NOT_ACCEPTED"),
      "GET /provenance/fragments/:id (proposed-only) → 404 FRAGMENT_NOT_ACCEPTED"
    );

    // ---- Step 7: negative / validation gates ----
    log("[7/8] negative gates  (422 / 404)");
    const emptyQ = await http(baseUrl, "GET", `/api/v1/search?query=`);
    assert(emptyQ.status === 422, "GET /search?query= (empty) → 422");

    const badLayer = await http(
      baseUrl,
      "GET",
      `/api/v1/search?query=${encodeURIComponent(tag("hel"))}&layers=bogus`
    );
    assert(badLayer.status === 422, "GET /search?layers=bogus → 422");

    const missing = await http(
      baseUrl,
      "GET",
      `/api/v1/nodes/00000000-0000-0000-0000-000000000000`
    );
    assert(missing.status === 404, "GET /nodes/<unknown uuid> → 404");

    // ---- Step 8: deterministic DB deltas (the hard gate — no LLM variance) ----
    log("[8/8] DB deltas (exact — this run's contribution)");
    const after = await snapshotCounts(pool);
    const delta = {} as Counts;
    for (const t of COUNTED_TABLES) {
      delta[t] = after[t] - before[t];
      log(
        `      → ${t.padEnd(20)} ${before[t]} → ${after[t]}  (Δ ${
          delta[t] >= 0 ? "+" : ""
        }${delta[t]})`
      );
    }
    assert(delta.knowledge_node === 4, "Δ knowledge_node === 4");
    assert(delta.knowledge_link === 3, "Δ knowledge_link === 3");
    assert(delta.node_attribute === 2, "Δ node_attribute === 2");
    assert(delta.information_fragment === 5, "Δ information_fragment === 5");
    assert(delta.provenance >= 5, "Δ provenance >= 5 (one per accepted link/attr)");
  } finally {
    if (app !== undefined) await app.close().catch(() => undefined);
    await pool.end().catch(() => undefined);
  }

  // ---- Verdict --------------------------------------------------------------
  log("");
  log("─────────────────────────────────────────────────────────────────────");
  for (const w of warnings) log(`⚠  ${w}`);
  if (failures.length === 0) {
    log(`✓ QUERY E2E PASSED — ${warnings.length} warning(s).`);
    log("  Deterministic graph seeded via the real write path and the whole");
    log("  retrieval surface (search, fuzzy, expansion, traversal, temporal,");
    log("  provenance, validation gates) verified over HTTP with exact assertions.");
    process.exitCode = 0;
  } else {
    log(`✗ QUERY E2E FAILED — ${failures.length} assertion(s) failed:`);
    for (const f of failures) log(`    - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`\n✗ QUERY E2E CRASHED: ${err?.stack ?? String(err)}\n`);
  process.exit(3);
});
