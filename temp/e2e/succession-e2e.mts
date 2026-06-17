/**
 * Frente 1 — Temporal validity-axis succession test (deterministic, no LLM).
 *
 * Regression test for Emenda v7.3 (Opção A): functional-attribute succession
 * (§6.5-A) closes the VALIDITY axis only (set `valid_to`, leave `superseded_at`
 * NULL) so the old version stays visible to valid-time travel within its window
 * — which is what makes acceptance scenario C7 pass. The intra-day EXCEPTION
 * (same effective date, where a day-granular `valid_to` would collapse the
 * interval) still closes on the TRANSACTION axis (`superseded_at`).
 *
 * It seeds through the SAME real `propose_*` handlers the extraction loop calls
 * (so the real consolidator §6.5-A write runs) and reads over real HTTP via the
 * query routes. No model in the loop → fully deterministic.
 *
 *   Scenario A (normal, T1 < T2):
 *     old row → superseded_at NULL, valid_to = T2, status 'superseded'
 *     GET ?as_of=<inside [T1,T2)> → OLD value         ← C7
 *     GET (current) / ?as_of=<after> → NEW value
 *     history → 2 versions, chained
 *   Scenario B (intra-day, T1 == T2):
 *     old row → superseded_at SET, valid_to NULL (transaction-axis fallback)
 *     GET (current) → NEW value
 *
 * History: this file began as a PROBE that confirmed the pre-fix C7 violation
 * (see temp/plano-item5-eixo-temporal.md §2.9). After Opção A it asserts the
 * corrected behavior.
 *
 * Safety:
 *   - NEVER runs against backend/.env as-is. REQUIRES FRENTE1_BRANCH_HOST (an
 *     `ep-...` ephemeral-branch endpoint host) and swaps ONLY the host in the
 *     @host/ segment — credentials read from .env into memory, never logged.
 *   - Requires E2E_CONFIRM=1 (writes durable, immutable rows).
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

const OPERATOR_ID = "succession-e2e-operator";
const MODEL = process.env.E2E_MODEL ?? "claude-opus-4-8";
const PROMPT_VERSION = process.env.E2E_PROMPT_VERSION ?? "frente1.succession.seed.v1";

// Scenario A — normal succession (distinct days). Half-open [from, to) per §5.2.
const A_T1 = "2026-01-01"; // old value starts
const A_T2 = "2026-03-01"; // succession; new value starts
const A_AS_OF_MID = "2026-02-01"; // inside [T1, T2) — C7 must return OLD value
const A_AS_OF_AFTER = "2026-06-16"; // after T2 — must return NEW value
// Scenario B — intra-day succession (same effective date).
const B_SAME = "2026-04-01";

const OLD_VALUE = "a fazer"; // valid Task.status closed-domain value
const NEW_VALUE = "em andamento"; // valid Task.status closed-domain value

// --------------------------------------------------------------------------
// Tiny .env loader (existing process.env wins).
// --------------------------------------------------------------------------

function loadEnvFile(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    fail(
      `Could not read env file at ${path}. Point BACKEND_ENV_FILE at backend/.env ` +
        `(it supplies NEON_AUTH_URL / ANTHROPIC_API_KEY / NODE_ENV; DATABASE_URL is host-swapped).`
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
  process.stderr.write(`\n✗ SUCCESSION E2E ABORTED: ${msg}\n`);
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

/**
 * Replace ONLY the host between the last '@' and the next '/' — credentials and
 * path/query are preserved verbatim and the password is never reconstructed by
 * a URL round-trip (which could re-encode it).
 */
function swapHost(dbUrl: string, host: string): string {
  const at = dbUrl.lastIndexOf("@");
  if (at < 0) fail("DATABASE_URL has no '@' — cannot swap host safely.");
  const slash = dbUrl.indexOf("/", at);
  if (slash < 0) fail("DATABASE_URL has no '/' after the host — cannot swap host safely.");
  return dbUrl.slice(0, at + 1) + host + dbUrl.slice(slash);
}

// --------------------------------------------------------------------------
// HTTP helper
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
    authorization: "Bearer succession-e2e-stub-token",
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

function assert(cond: boolean, label: string): void {
  if (cond) {
    log(`      ✓ ${label}`);
  } else {
    log(`      ✗ ${label}`);
    failures.push(label);
  }
}

function statusOf(body: any): any {
  return (body?.attributes ?? []).find((a: any) => a.attribute_key === "status");
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main(): Promise<void> {
  log("── Frente 1 — validity-axis succession (Emenda v7.3 regression) ──────");

  if (process.env.E2E_CONFIRM !== "1") {
    fail(
      "refusing to run without E2E_CONFIRM=1.\n" +
        "  This writes durable, IMMUTABLE rows. Use the ephemeral Neon branch only."
    );
  }
  const BRANCH_HOST = process.env.FRENTE1_BRANCH_HOST;
  if (!BRANCH_HOST || !BRANCH_HOST.startsWith("ep-")) {
    fail(
      "FRENTE1_BRANCH_HOST must be set to the ephemeral branch endpoint host (ep-...).\n" +
        "  This guard prevents the test from ever running against the default backend/.env host."
    );
  }

  loadEnvFile(ENV_FILE);
  if (process.env.DATABASE_URL === undefined) {
    fail("DATABASE_URL not found in backend/.env — nothing to host-swap.");
  }
  process.env.DATABASE_URL = swapHost(process.env.DATABASE_URL!, BRANCH_HOST!);

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
  const { proposeFragmentHandler } = await import(
    "../../backend/src/modules/ingestion/mcp/propose-fragment.handler.ts"
  );
  const { proposeNodeHandler } = await import(
    "../../backend/src/modules/ingestion/mcp/propose-node.handler.ts"
  );
  const { proposeAttributeHandler } = await import(
    "../../backend/src/modules/ingestion/mcp/propose-attribute.handler.ts"
  );
  const { closeLlmRun } = await import(
    "../../backend/src/modules/ingestion/service/llm-run.service.ts"
  );

  const env = loadEnv();
  log(`• Target DB : ${redactDbHost(env.DATABASE_URL)}`);
  log(`• (host swapped to the ephemeral branch; credentials never logged)`);
  log("");

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

    const token = () =>
      `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`.replace(
        /[^a-z0-9]/g,
        ""
      );
    const MARK = `se2e${token()}`;
    // Each scenario gets an INDEPENDENT nonce AND a distinct base name so the two
    // Tasks do not trigram-match into one node (§4 entity resolution, MATCH_STRONG
    // 0.85): a shared long nonce alone is enough to merge them.
    const A_NAME = `Migrar WMS ${token()}`;
    const B_NAME = `Indexar catalogo de produtos ${token()}`;
    log(`• Nonce     : ${MARK}  (taskA='${A_NAME}', taskB='${B_NAME}')`);
    log("");

    // ---- Intake (one RawInformation + RawChunk + running LLMRun for both scenarios) ----
    log("[setup] POST /ingest/raw-information");
    const content = [
      `Acompanhamento de tarefas (${MARK}).`,
      `Em ${A_T1} a tarefa A entrou na situacao "a fazer"; em ${A_T2} passou a "em andamento".`,
      `Em ${B_SAME} a tarefa B foi aberta como "a fazer" e no mesmo dia passou a "em andamento".`,
    ].join("\n");
    const intake = await http(baseUrl, "POST", "/api/v1/ingest/raw-information", {
      body: {
        source_type: "ata",
        content,
        metadata: { title: `Frente1 succession seed ${MARK}`, document_date: A_T2 },
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

    // Seed a Task with status=OLD@t1 (none) then status=NEW@t2 (succession).
    async function seedSuccession(
      label: string,
      taskName: string,
      t1: string,
      t2: string
    ): Promise<{ taskId: string; r1: any; r2: any }> {
      const f1 = unwrap<{ fragment_id: string }>(
        await proposeFragmentHandler(
          { text: `${label}: em ${t1} a tarefa entrou na situacao "${OLD_VALUE}".`, confidence: 0.95, chunk_ids: [chunkId] },
          fragDeps
        ),
        `${label} propose_fragment(old)`
      );
      const f2 = unwrap<{ fragment_id: string }>(
        await proposeFragmentHandler(
          { text: `${label}: em ${t2} a tarefa passou a "${NEW_VALUE}".`, confidence: 0.95, chunk_ids: [chunkId] },
          fragDeps
        ),
        `${label} propose_fragment(new)`
      );
      const taskId = unwrap<{ node_id: string }>(
        await proposeNodeHandler({ node_type: "Task", name: taskName }, nodeDeps),
        `${label} propose_node(Task)`
      ).node_id;
      const r1 = unwrap<any>(
        await proposeAttributeHandler(
          {
            node_id: taskId, key: "status", value: OLD_VALUE, confidence: 0.95,
            fragment_ids: [f1.fragment_id], valid_from: t1, valid_from_basis: "stated", change_hint: "none",
          },
          wDeps
        ),
        `${label} propose_attribute(${OLD_VALUE})`
      );
      const r2 = unwrap<any>(
        await proposeAttributeHandler(
          {
            node_id: taskId, key: "status", value: NEW_VALUE, confidence: 0.95,
            fragment_ids: [f2.fragment_id], valid_from: t2, valid_from_basis: "stated", change_hint: "succession",
          },
          wDeps
        ),
        `${label} propose_attribute(${NEW_VALUE})`
      );
      return { taskId, r1, r2 };
    }

    // Raw status rows for (task, 'status'), ordered by recorded_at.
    async function statusRows(taskId: string): Promise<any[]> {
      const c = await pool.connect();
      try {
        const r = await c.query(
          `SELECT na.id, na.value,
                  to_char(na.valid_from, 'YYYY-MM-DD') AS valid_from,
                  to_char(na.valid_to,   'YYYY-MM-DD') AS valid_to,
                  na.superseded_at, na.status, na.supersedes_attribute_id
             FROM node_attribute na
             JOIN attribute_key ak ON ak.id = na.attribute_key_id
            WHERE na.node_id = $1 AND ak.key = 'status'
            ORDER BY na.recorded_at ASC`,
          [taskId]
        );
        return r.rows;
      } finally {
        c.release();
      }
    }

    function logRows(rows: any[]): void {
      for (const row of rows) {
        log(
          `      • value='${row.value}' valid=[${row.valid_from}, ${row.valid_to ?? "∞"}) ` +
            `superseded_at=${row.superseded_at ? "SET" : "null"} status=${row.status} ` +
            `supersedes=${row.supersedes_attribute_id ? "→" + String(row.supersedes_attribute_id).slice(0, 8) : "—"}`
        );
      }
    }

    // ======================================================================
    // Scenario A — normal succession (T1 < T2): the C7 case.
    // ======================================================================
    log("");
    log("[A] normal succession (distinct days) — the C7 case");
    const A = await seedSuccession("A", A_NAME, A_T1, A_T2);
    assert(A.r1.outcome === "accepted", "A: R1 (a fazer) outcome === 'accepted'");
    assert(A.r2.outcome === "superseded_previous", "A: R2 (succession) outcome === 'superseded_previous'");

    const aRows = await statusRows(A.taskId);
    logRows(aRows);
    const aOld = aRows.find((r) => r.value === OLD_VALUE);
    const aNew = aRows.find((r) => r.value === NEW_VALUE);
    assert(aRows.length === 2, "A: exactly 2 status rows");
    assert(
      aOld && aOld.superseded_at === null && aOld.status === "superseded" && aOld.valid_to === A_T2,
      `A: old row closed on VALIDITY axis only — superseded_at NULL, valid_to=${A_T2}, status='superseded'`
    );
    assert(
      aNew && aNew.superseded_at === null && aNew.valid_to === null && aNew.status === "active",
      "A: new row is current — superseded_at null, valid_to null, status='active'"
    );
    assert(aNew && aOld && aNew.supersedes_attribute_id === aOld.id, "A: new chains to old via supersedes_*");

    const aCur = await http(baseUrl, "GET", `/api/v1/nodes/${A.taskId}`);
    assert(statusOf(aCur.body)?.value === NEW_VALUE, `A: current view status === '${NEW_VALUE}'`);
    const aAfter = await http(baseUrl, "GET", `/api/v1/nodes/${A.taskId}?as_of=${A_AS_OF_AFTER}`);
    assert(statusOf(aAfter.body)?.value === NEW_VALUE, `A: as_of=${A_AS_OF_AFTER} status === '${NEW_VALUE}'`);

    // THE C7 ASSERTION — as_of inside [T1,T2) must return the OLD value.
    const aMid = await http(baseUrl, "GET", `/api/v1/nodes/${A.taskId}?as_of=${A_AS_OF_MID}`);
    const aMidStatus = statusOf(aMid.body);
    log(`      → C7: as_of=${A_AS_OF_MID} → status='${aMidStatus?.value ?? "(absent)"}'`);
    assert(
      aMidStatus?.value === OLD_VALUE,
      `A: C7 SATISFIED — as_of inside [T1,T2) returns the old value '${OLD_VALUE}'`
    );

    const aHist = await http(baseUrl, "GET", `/api/v1/nodes/${A.taskId}/attributes/status/history`);
    const aVers: any[] = aHist.body?.versions ?? [];
    assert(aHist.status === 200 && aVers.length === 2, "A: history has 2 versions");
    assert(
      JSON.stringify(aVers).includes(OLD_VALUE) && JSON.stringify(aVers).includes(NEW_VALUE),
      "A: history shows both values"
    );
    assert(aVers.some((v) => v.supersedes_attribute_id != null), "A: history exposes supersedes_* chain");

    // ======================================================================
    // Scenario B — intra-day succession (same day): the exception.
    // ======================================================================
    log("");
    log("[B] intra-day succession (same day) — the transaction-axis exception");
    const B = await seedSuccession("B", B_NAME, B_SAME, B_SAME);
    assert(B.r2.outcome === "superseded_previous", "B: R2 (same-day succession) outcome === 'superseded_previous'");

    const bRows = await statusRows(B.taskId);
    logRows(bRows);
    const bOld = bRows.find((r) => r.value === OLD_VALUE);
    const bNew = bRows.find((r) => r.value === NEW_VALUE);
    assert(
      bOld && bOld.superseded_at !== null && bOld.valid_to === null && bOld.status === "superseded",
      "B: old row closed on TRANSACTION axis — superseded_at SET, valid_to untouched (NULL) (day-granularity exception)"
    );
    assert(
      bNew && bNew.superseded_at === null && bNew.status === "active",
      "B: new row is current — superseded_at null, status='active'"
    );
    const bCur = await http(baseUrl, "GET", `/api/v1/nodes/${B.taskId}`);
    assert(statusOf(bCur.body)?.value === NEW_VALUE, `B: current view status === '${NEW_VALUE}'`);

    // Close the run so it is not left 'running'.
    const closeClient = await pool.connect();
    try {
      await closeLlmRun(closeClient, { llm_run_id: runId, outcome: "completed" });
    } finally {
      closeClient.release();
    }
  } finally {
    if (app !== undefined) await app.close().catch(() => undefined);
    await pool.end().catch(() => undefined);
  }

  // ---- Verdict --------------------------------------------------------------
  log("");
  log("─────────────────────────────────────────────────────────────────────");
  if (failures.length === 0) {
    log("✓ SUCCESSION E2E PASSED — Emenda v7.3 behavior verified vs real Postgres:");
    log("  • normal succession closes the validity axis only (superseded_at NULL)");
    log("  • C7 holds — as_of inside the old window returns the old value");
    log("  • current view / as_of-after return the new value; history chains both");
    log("  • intra-day succession still closes on the transaction axis (exception)");
    process.exitCode = 0;
  } else {
    log(`✗ SUCCESSION E2E FAILED — ${failures.length} assertion(s):`);
    for (const f of failures) log(`    - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`\n✗ SUCCESSION E2E CRASHED: ${err?.stack ?? String(err)}\n`);
  process.exit(3);
});
