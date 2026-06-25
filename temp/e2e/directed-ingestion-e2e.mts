/**
 * Directed-ingestion functional E2E (deterministic command → graph, NO LLM).
 *
 * Sibling of `query-e2e.mts`. Exercises the `ingest_directed` tool end-to-end
 * over the REAL MCP transport (`POST /api/v1/mcp/ingest`, SDK Streamable HTTP)
 * against a REAL Neon DB. `ingest_directed` is deterministic — there is NO
 * Anthropic call — so every assertion here is EXACT.
 *
 * Why this exists: the vitest integration suite for the MCP endpoint
 * (`__tests__/integration/ingestion/mcp-endpoint.spec.ts`) runs against a
 * MOCK pool, so it covers `tools/list` advertisement and the dispatch/envelope
 * round-trip but NOT the real write path. This closes that gap: real entity
 * resolution (§4), real LinkTypeRule enforcement (§13 layer 2), real
 * consolidation on re-affirmation (§18), real provenance (§13 layer 5).
 *
 *   tools/list                         → ingest_directed present; start_async_ingestion GONE
 *   tools/call ingest_directed (happy) → Event + Project + Person + 2 links, all active
 *   re-affirm same command             → 2nd RawInformation, SAME node ids (matched_existing)
 *   illegal link (LinkTypeRule)        → that item rejected; siblings persist; run completed
 *   pin recovery (node_id)             → the failed link re-created against pinned ids
 *   confidence                         → no item lands 'uncertain' (forced 1.0/stated)
 *
 * NOT part of `vitest run`. Boots the real BFF in-process and writes durable,
 * IMMUTABLE rows. Run deliberately against a Neon EPHEMERAL BRANCH. See
 * ./README.md "⚠️ Segurança".
 *
 * Run (from backend/):
 *   E2E_CONFIRM=1 DATABASE_URL='postgresql://…<BRANCH>…/neondb?sslmode=require' \
 *     ./node_modules/.bin/tsx ../temp/e2e/directed-ingestion-e2e.mts
 *
 * Exit codes: 0 passed · 1 assertion failed · 2 aborted · 3 crash.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AddressInfo } from "node:net";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const BACKEND_DIR = resolve(REPO_ROOT, "backend");
const ENV_FILE = process.env.BACKEND_ENV_FILE ?? resolve(BACKEND_DIR, ".env");

const OPERATOR_ID = "directed-e2e-operator";
const MCP_PATH = "/api/v1/mcp/ingest";
/** SDK Streamable HTTP requires the client to Accept both JSON and SSE. */
const MCP_ACCEPT = "application/json, text/event-stream";
const DOC_DATE = "2026-06-12";

const COUNTED_TABLES = [
  "raw_information",
  "information_fragment",
  "knowledge_node",
  "knowledge_link",
  "provenance",
] as const;
type CountedTable = (typeof COUNTED_TABLES)[number];
type Counts = Record<CountedTable, number>;

// --------------------------------------------------------------------------
// .env loader (existing process.env wins → CLI DATABASE_URL override works)
// --------------------------------------------------------------------------

function loadEnvFile(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    fail(`Could not read env file at ${path}. Set BACKEND_ENV_FILE or export DATABASE_URL.`);
    return;
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (t === "" || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
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
// Reporting
// --------------------------------------------------------------------------

function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}
function fail(msg: string): never {
  process.stderr.write(`\n✗ DIRECTED E2E ABORTED: ${msg}\n`);
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

// --------------------------------------------------------------------------
// MCP-over-HTTP helper (SDK Streamable HTTP, stateless, JSON response)
// --------------------------------------------------------------------------

interface McpCall {
  raw: any;
  /** Parsed tool result (success → result.content[0].text JSON; tools/list → result.tools). */
  result: any;
  isError: boolean;
}

function makeMcp(baseUrl: string) {
  return async function mcp(method: string, params?: unknown): Promise<McpCall> {
    const res = await fetch(`${baseUrl}${MCP_PATH}`, {
      method: "POST",
      headers: {
        authorization: "Bearer directed-e2e-stub-token",
        accept: MCP_ACCEPT,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        ...(params !== undefined ? { params } : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* keep raw */
    }
    const r = body?.result ?? {};
    const isError = r?.isError === true;
    let result: any = r;
    if (Array.isArray(r?.content) && r.content[0]?.type === "text") {
      try {
        result = JSON.parse(r.content[0].text);
      } catch {
        result = r.content[0].text;
      }
    }
    return { raw: body, result, isError };
  };
}

async function snapshotCounts(pool: import("pg").Pool): Promise<Counts> {
  const client = await pool.connect();
  try {
    const out = {} as Counts;
    for (const t of COUNTED_TABLES) {
      const r = await client.query<{ n: string }>(`SELECT count(*)::int AS n FROM ${t}`);
      out[t] = Number(r.rows[0]?.n ?? 0);
    }
    return out;
  } finally {
    client.release();
  }
}

// --------------------------------------------------------------------------
// Catalog introspection — pick valid / invalid link types for a node pair.
// --------------------------------------------------------------------------

function activeRule(rule: any): boolean {
  const now = Date.now();
  const from = rule.valid_from ? new Date(rule.valid_from).getTime() : -Infinity;
  const to = rule.valid_to ? new Date(rule.valid_to).getTime() : Infinity;
  return from <= now && now < to;
}

/** A link_type name allowed for (srcName → tgtName) by an active LinkTypeRule, or null. */
function validLinkType(catalog: any, srcName: string, tgtName: string): string | null {
  const src = catalog.nodeTypeByName.get(srcName);
  const tgt = catalog.nodeTypeByName.get(tgtName);
  if (!src || !tgt) return null;
  for (const rule of catalog.linkTypeRules) {
    if (
      rule.source_node_type_id === src.id &&
      rule.target_node_type_id === tgt.id &&
      activeRule(rule)
    ) {
      const lt = catalog.linkTypeById.get(rule.link_type_id);
      if (lt) return lt.name;
    }
  }
  return null;
}

/** A link_type name that has NO active rule for (srcName → tgtName) — drives RULE_VIOLATION. */
function invalidLinkType(catalog: any, srcName: string, tgtName: string): string | null {
  const src = catalog.nodeTypeByName.get(srcName);
  const tgt = catalog.nodeTypeByName.get(tgtName);
  if (!src || !tgt) return null;
  for (const [name, lt] of catalog.linkTypeByName as Map<string, any>) {
    const allowed = catalog.linkTypeRules.some(
      (r: any) =>
        r.link_type_id === lt.id &&
        r.source_node_type_id === src.id &&
        r.target_node_type_id === tgt.id &&
        activeRule(r)
    );
    if (!allowed) return name;
  }
  return null;
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main(): Promise<void> {
  log("── Directed-ingestion functional E2E (command → graph, NO LLM) ───────");

  if (process.env.E2E_CONFIRM !== "1") {
    fail(
      "refusing to run without E2E_CONFIRM=1.\n" +
        "  Writes durable, IMMUTABLE rows. Prefer a Neon ephemeral branch.\n" +
        "  See temp/e2e/README.md, then re-run with E2E_CONFIRM=1."
    );
  }

  // ingest_directed is registered on the ingest toolset regardless of this flag;
  // we set it so the run is representative of the chat-enabled deployment.
  if (process.env.CHAT_INGEST_ENABLED === undefined) {
    process.env.CHAT_INGEST_ENABLED = "true";
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

  const env = loadEnv();
  log(`• Target DB : ${redactDbHost(env.DATABASE_URL)}`);

  const logger = buildLogger({
    LOG_LEVEL: (process.env.LOG_LEVEL as any) ?? "warn",
    NODE_ENV: env.NODE_ENV,
  });
  const pool = buildPool(env);

  const auth = {
    preHandler: async (req: any) => {
      req.user = { id: OPERATOR_ID, claims: { sub: OPERATOR_ID } };
    },
  };

  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  try {
    const catClient = await pool.connect();
    let catalog: any;
    let ingestionCatalog: any;
    try {
      catalog = await loadCatalog(catClient);
      ingestionCatalog = await loadIngestionCatalog(catClient);
    } finally {
      catClient.release();
    }
    log(
      `• Catalog   : ${ingestionCatalog.nodeTypeById.size} node types, ` +
        `${ingestionCatalog.linkTypeById.size} link types, ` +
        `${ingestionCatalog.linkTypeRules.length} link rules`
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
    const mcp = makeMcp(baseUrl);
    log(`• BFF up    : ${baseUrl}`);

    const nonce = `de2e${Date.now().toString(36)}${Math.floor(
      Math.random() * 1e6
    ).toString(36)}`.replace(/[^a-z0-9]/g, "");
    log(`• Nonce     : ${nonce}`);
    log("");

    // Resolve valid + invalid link types from the live catalog (robust to seed).
    const evProjValid = validLinkType(ingestionCatalog, "Event", "Project");
    const persEvValid = validLinkType(ingestionCatalog, "Person", "Event");
    const evPersInvalid = invalidLinkType(ingestionCatalog, "Event", "Person");
    log(
      `• Links     : Event→Project='${evProjValid}' Person→Event='${persEvValid}' ` +
        `invalid(Event→Person)='${evPersInvalid}'`
    );
    if (!evProjValid || !persEvValid) {
      fail(
        "catalog has no active LinkTypeRule for Event→Project and/or Person→Event — " +
          "cannot run the happy path. Check the seeded catalog (0001_seed + 0002_catalog_tier1)."
      );
    }
    log("");

    const before = await snapshotCounts(pool);

    // ---- [1/6] tools/list — registration + retirement ----
    log("[1/6] tools/list  (ingest_directed present; start_async retired)");
    const list = await mcp("tools/list");
    const names: string[] = (list.result?.tools ?? []).map((t: any) => t.name);
    assert(names.includes("ingest_directed"), "tools/list advertises ingest_directed");
    assert(
      !names.includes("start_async_ingestion"),
      "tools/list does NOT advertise start_async_ingestion (retired)"
    );
    assert(names.includes("ingest_document"), "ingest_document still advertised");
    assert(
      names.includes("get_ingestion_status"),
      "get_ingestion_status still advertised on the endpoint (Claude Desktop)"
    );

    const evName = `Alinhamento ${nonce}`;
    const apName = `Apollo ${nonce}`;
    const anName = `Antonio ${nonce}`;
    const happyPayload = {
      source_label: `directed-e2e ${nonce}`,
      fragments: [
        { ref: "f1", text: `Foi feito um alinhamento com ${anName} sobre o projeto ${apName}.` },
      ],
      nodes: [
        { ref: "ev", node_type: "Event", name: evName },
        { ref: "ap", node_type: "Project", name: apName },
        { ref: "an", node_type: "Person", name: anName },
      ],
      links: [
        {
          source_ref: "ev",
          target_ref: "ap",
          link_type: evProjValid,
          evidence_ref: "f1",
          valid_from: DOC_DATE,
          valid_from_basis: "stated",
        },
        {
          source_ref: "an",
          target_ref: "ev",
          link_type: persEvValid,
          evidence_ref: "f1",
          valid_from: DOC_DATE,
          valid_from_basis: "stated",
        },
      ],
    };

    // ---- [2/6] happy path ----
    log("[2/6] tools/call ingest_directed  (happy path)");
    const happy = await mcp("tools/call", { name: "ingest_directed", arguments: happyPayload });
    assert(!happy.isError, "happy call is not an MCP error");
    const hr = happy.result;
    assert(hr?.outcome === "ingested", "result.outcome === 'ingested'");
    assert(hr?.run?.model === "directed", "run.model === 'directed' (sentinel)");
    assert(hr?.run?.prompt_version === "directed-v1", "run.prompt_version === 'directed-v1'");
    assert(hr?.run?.status === "completed", "run.status === 'completed'");
    const report: any[] = hr?.report ?? [];
    const byRef = (ref: string) => report.find((i) => i.ref === ref);
    assert(byRef("ev")?.node_id != null, "Event node created (ev → node_id)");
    assert(byRef("ap")?.node_id != null, "Project Apollo node created (ap → node_id)");
    assert(byRef("an")?.node_id != null, "Person Antonio node created (an → node_id)");
    const evId: string = byRef("ev")?.node_id;
    const apId: string = byRef("ap")?.node_id;
    const linkItems = report.filter((i) => i.kind === "link");
    assert(linkItems.length === 2, "two link items in report");
    assert(
      linkItems.every((i) => i.status === "accepted" || i.status === "consolidated"),
      "both links accepted/consolidated (LinkTypeRule satisfied)"
    );
    // confidence forced → never uncertain
    assert(
      report.every((i) => i.status !== "uncertain"),
      "no item is 'uncertain' (confidence forced 1.0/stated)"
    );

    // DB: source_type='chat' + metadata.directed=true on the new raw row
    const dbc = await pool.connect();
    try {
      const r = await dbc.query<{ source_type: string; metadata: any }>(
        `SELECT source_type, metadata FROM raw_information WHERE id = $1`,
        [hr.raw_information_id]
      );
      assert(r.rows[0]?.source_type === "chat", "RawInformation.source_type === 'chat'");
      assert(
        r.rows[0]?.metadata?.directed === true,
        "RawInformation.metadata.directed === true"
      );
      // provenance exists for an accepted link (anti-hallucination §13)
      const linkId = linkItems.find((i) => i.link_id)?.link_id;
      if (linkId) {
        const p = await dbc.query<{ n: string }>(
          `SELECT count(*)::int AS n FROM provenance WHERE link_id = $1`,
          [linkId]
        );
        assert(Number(p.rows[0]?.n ?? 0) > 0, "accepted link has provenance (§13)");
      }
    } finally {
      dbc.release();
    }
    log(`      → raw=${hr.raw_information_id.slice(0, 8)} run=${hr.llm_run_id.slice(0, 8)} ev=${evId?.slice(0, 8)} ap=${apId?.slice(0, 8)}`);

    // ---- [3/6] re-affirmation: same command → 2nd raw, SAME node ids ----
    log("[3/6] re-affirm same command  (consolidate, not duplicate)");
    const again = await mcp("tools/call", { name: "ingest_directed", arguments: happyPayload });
    const ar = again.result;
    assert(
      ar?.raw_information_id && ar.raw_information_id !== hr.raw_information_id,
      "re-affirm creates a DISTINCT RawInformation (timestamped content)"
    );
    const ar2 = (ref: string) => (ar?.report ?? []).find((i: any) => i.ref === ref);
    assert(ar2("ap")?.node_id === apId, "Apollo resolves to the SAME node (matched_existing)");
    assert(
      ar2("ap")?.resolution === "matched_existing",
      "Apollo resolution === 'matched_existing' on re-affirm"
    );
    assert(ar2("ev")?.node_id === evId, "Event resolves to the SAME node on re-affirm");

    // ---- [4/6] illegal link → rejected; siblings persist; run completed ----
    log("[4/6] illegal link (LinkTypeRule)  (partial failure)");
    if (!evPersInvalid) {
      soft(false, "no invalid link type found to test RULE_VIOLATION — skipped");
    } else {
      const bad = await mcp("tools/call", {
        name: "ingest_directed",
        arguments: {
          source_label: `directed-e2e-bad ${nonce}`,
          fragments: [{ ref: "f1", text: `Vínculo inválido de teste ${nonce}.` }],
          nodes: [
            { ref: "ev", node_type: "Event", name: evName, node_id: evId },
            { ref: "an", node_type: "Person", name: anName },
          ],
          links: [
            {
              source_ref: "ev",
              target_ref: "an",
              link_type: evPersInvalid,
              evidence_ref: "f1",
              valid_from: DOC_DATE,
              valid_from_basis: "stated",
            },
          ],
        },
      });
      const br = bad.result;
      assert(br?.run?.status === "completed", "run still completed despite a rejected item");
      const badLink = (br?.report ?? []).find((i: any) => i.kind === "link");
      assert(badLink?.status === "rejected", "illegal link item status === 'rejected'");
      assert(
        typeof badLink?.error?.code === "string",
        `illegal link carries an error code (${badLink?.error?.code})`
      );
      assert(
        (br?.report ?? []).find((i: any) => i.ref === "ev")?.status === "accepted",
        "Event (pinned) still accepted in the same partial-failure call"
      );
    }

    // ---- [5/6] pin recovery: re-create the link against pinned ids ----
    log("[5/6] pin recovery  (node_id pin re-creates the link)");
    const recover = await mcp("tools/call", {
      name: "ingest_directed",
      arguments: {
        source_label: `directed-e2e-recover ${nonce}`,
        fragments: [{ ref: "f1", text: `Correção: liga o alinhamento ao ${apName}.` }],
        nodes: [
          { ref: "ev", node_type: "Event", name: evName, node_id: evId },
          { ref: "ap", node_type: "Project", name: apName, node_id: apId },
        ],
        links: [
          {
            source_ref: "ev",
            target_ref: "ap",
            link_type: evProjValid,
            evidence_ref: "f1",
            valid_from: DOC_DATE,
            valid_from_basis: "stated",
          },
        ],
      },
    });
    const rr = recover.result;
    const evPin = (rr?.report ?? []).find((i: any) => i.ref === "ev");
    assert(evPin?.node_id === evId, "pinned Event id bound directly (node_id pin)");
    assert(
      evPin?.resolution === "matched_existing",
      "pinned Event resolution === 'matched_existing'"
    );
    const recLink = (rr?.report ?? []).find((i: any) => i.kind === "link");
    assert(
      recLink?.status === "accepted" || recLink?.status === "consolidated",
      "recovery link accepted/consolidated against pinned ids"
    );

    // ---- [6/6] DB deltas ----
    log("[6/6] DB deltas");
    const after = await snapshotCounts(pool);
    for (const t of COUNTED_TABLES) {
      const d = after[t] - before[t];
      log(`      → ${t.padEnd(22)} ${before[t]} → ${after[t]}  (Δ ${d >= 0 ? "+" : ""}${d})`);
    }
    assert(after.raw_information - before.raw_information >= 3, "Δ raw_information >= 3 (happy + re-affirm + recover)");
    assert(after.knowledge_node - before.knowledge_node === 3, "Δ knowledge_node === 3 (Event+Apollo+Antonio, NOT duplicated on re-affirm)");
    assert(after.knowledge_link - before.knowledge_link >= 2, "Δ knowledge_link >= 2 (the two valid links)");
    assert(after.provenance - before.provenance > 0, "Δ provenance > 0 (anti-hallucination §13)");
  } finally {
    if (app !== undefined) await app.close().catch(() => undefined);
    await pool.end().catch(() => undefined);
  }

  log("");
  log("─────────────────────────────────────────────────────────────────────");
  for (const w of warnings) log(`⚠  ${w}`);
  if (failures.length === 0) {
    log(`✓ DIRECTED E2E PASSED — ${warnings.length} warning(s).`);
    log("  ingest_directed verified end-to-end over the real MCP transport +");
    log("  real Neon: registration, entity resolution, LinkTypeRule, re-affirmation");
    log("  consolidation, node_id pin recovery, forced confidence, provenance.");
    process.exitCode = 0;
  } else {
    log(`✗ DIRECTED E2E FAILED — ${failures.length} assertion(s):`);
    for (const f of failures) log(`    - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`\n✗ DIRECTED E2E CRASHED: ${err?.stack ?? String(err)}\n`);
  process.exit(3);
});
