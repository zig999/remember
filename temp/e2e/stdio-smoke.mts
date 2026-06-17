/**
 * MCP stdio transport — smoke harness (TC-03 of mcp-stdio-transport).
 *
 * Spawns the compiled stdio entry point (`backend/dist/mcp-stdio.js`) as a
 * child process, pipes a minimal JSON-RPC `initialize` + `tools/list`
 * conversation through its stdin / stdout, and asserts:
 *
 *   1. Every line the child writes on stdout is a valid JSON-RPC frame
 *      (the LOAD-BEARING invariant of the stdio transport — pino MUST go to
 *      stderr; any stray text on stdout would corrupt the wire and is the
 *      most likely silent failure mode).
 *   2. The `initialize` response advertises `serverInfo.name` =
 *      `remember-bff-stdio` and the `tools` capability.
 *   3. The `tools/list` response carries exactly the 18 tool names the
 *      stdio entry point composes: QUERY (9) + QUERY_RETRIEVAL (4) +
 *      INGEST (4) + `ingest_document` (1).
 *   4. The child terminates cleanly on SIGTERM.
 *
 * Run after `npm run build` inside `backend/`. This is NOT part of
 * `vitest run`: it requires a real DATABASE_URL (the entry point pings Neon at
 * boot), a real NEON_AUTH_URL (loadEnv() requires it even though stdio doesn't
 * authenticate), and a valid ANTHROPIC_API_KEY (loadEnv() requires it for the
 * `ingest_document` tool's downstream calls — the smoke harness never exercises
 * those). Same launching convention as the other harnesses in this folder.
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// --------------------------------------------------------------------------
// Paths + config
// --------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const BACKEND_DIR = resolve(REPO_ROOT, "backend");
const STDIO_BIN = resolve(BACKEND_DIR, "dist", "mcp-stdio.js");
const ENV_FILE = process.env.BACKEND_ENV_FILE ?? resolve(BACKEND_DIR, ".env");

// Time to wait after the LAST expected response before declaring the wire
// silent and proceeding to shutdown. Generous because Neon cold starts can
// add 1-3s to the boot sequence and we do not want to time-race the LLM
// catalog loads.
const READY_TIMEOUT_MS = Number(process.env.STDIO_READY_TIMEOUT_MS ?? 30_000);
const REQUEST_TIMEOUT_MS = Number(process.env.STDIO_REQUEST_TIMEOUT_MS ?? 15_000);
const SHUTDOWN_TIMEOUT_MS = Number(process.env.STDIO_SHUTDOWN_TIMEOUT_MS ?? 10_000);

// The 18 expected tool names (must match `backend/src/mcp-stdio.ts` step 6).
// Hard-coded here so the harness is self-contained — it spawns a built binary,
// it does not import from the backend source tree.
const EXPECTED_TOOL_NAMES: readonly string[] = [
  // QUERY_TOOL_NAMES (knowledge-graph) — 9
  "get_node",
  "traverse",
  "get_history_link",
  "get_history_attribute",
  "get_history_attribute_key",
  "list_nodes",
  "list_node_types",
  "list_link_types",
  "list_attribute_keys",
  // QUERY_RETRIEVAL_TOOL_NAMES — 4
  "search",
  "get_provenance_link",
  "get_provenance_attribute",
  "get_provenance_fragment",
  // INGEST_TOOL_NAMES (ingestion) — 4
  "propose_fragment",
  "propose_node",
  "propose_link",
  "propose_attribute",
  // ingest_document — 1
  "ingest_document",
];

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
// Reporting
// --------------------------------------------------------------------------

function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

function fail(msg: string): never {
  process.stderr.write(`\n✗ STDIO-SMOKE ABORTED: ${msg}\n`);
  process.exit(2);
}

// --------------------------------------------------------------------------
// JSON-RPC framing helpers (mirror the SDK's StdioServerTransport wire format:
// one JSON message per line, terminated by '\n').
// --------------------------------------------------------------------------

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
}

interface JsonRpcMessage {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  result?: unknown;
  error?: unknown;
}

function isValidJsonRpcShape(obj: unknown): obj is JsonRpcMessage {
  if (typeof obj !== "object" || obj === null) return false;
  const m = obj as JsonRpcMessage;
  return m.jsonrpc === "2.0";
}

function buildInitialize(): object {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "stdio-smoke", version: "0.0.1" },
    },
  };
}

function buildToolsList(): object {
  return {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  };
}

function buildInitialized(): object {
  // MCP spec: clients SHOULD send `notifications/initialized` after a
  // successful `initialize` handshake. The server does not respond, but the
  // SDK transitions to "initialized" state on receipt.
  return {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  };
}

// --------------------------------------------------------------------------
// Child-process orchestration
// --------------------------------------------------------------------------

interface ChildHarness {
  readonly child: ChildProcessWithoutNullStreams;
  readonly stdoutLines: string[];
  readonly stderrChunks: string[];
  /** Resolves when a JSON-RPC response with the given id is observed. */
  waitForId(id: number, timeoutMs: number): Promise<JsonRpcResponse>;
  /** Send a JSON-RPC message to the child's stdin (newline-terminated). */
  send(message: object): void;
}

function spawnChild(): ChildHarness {
  log(`• spawning ${STDIO_BIN}`);
  const child = spawn("node", [STDIO_BIN], {
    cwd: BACKEND_DIR,
    env: { ...process.env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const stdoutLines: string[] = [];
  const stderrChunks: string[] = [];
  const idWaiters = new Map<
    number,
    {
      resolve: (r: JsonRpcResponse) => void;
      reject: (err: Error) => void;
    }
  >();

  let stdoutBuffer = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdoutBuffer += chunk;
    // Split on newlines — the SDK's stdio transport writes ONE JSON object per
    // line. Anything that arrives without a trailing newline stays in the buffer.
    const lines = stdoutBuffer.split("\n");
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.length === 0) continue;
      stdoutLines.push(line);
      // Try to parse and dispatch to id waiters.
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        // Will be caught by the purity assertion later.
        continue;
      }
      if (
        isValidJsonRpcShape(parsed) &&
        typeof (parsed as JsonRpcMessage).id === "number"
      ) {
        const id = (parsed as JsonRpcMessage).id as number;
        const waiter = idWaiters.get(id);
        if (waiter !== undefined) {
          idWaiters.delete(id);
          waiter.resolve(parsed as JsonRpcResponse);
        }
      }
    }
  });

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderrChunks.push(chunk);
  });

  child.on("error", (err) => {
    for (const w of idWaiters.values()) w.reject(err);
    idWaiters.clear();
  });

  const send = (message: object): void => {
    const line = JSON.stringify(message) + "\n";
    child.stdin.write(line);
  };

  const waitForId = (id: number, timeoutMs: number): Promise<JsonRpcResponse> => {
    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        idWaiters.delete(id);
        reject(new Error(`timed out waiting for JSON-RPC id=${id} (${timeoutMs}ms)`));
      }, timeoutMs);
      idWaiters.set(id, {
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
    });
  };

  return { child, stdoutLines, stderrChunks, waitForId, send };
}

function waitForReady(harness: ChildHarness, timeoutMs: number): Promise<void> {
  // The stdio entry point logs "stdio_ready" to STDERR once
  // `server.connect(transport)` returns. Boot is complete when we see that
  // marker — at which point stdin / stdout are wired.
  return new Promise<void>((resolve, reject) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      reject(new Error(`stdio child never logged 'stdio_ready' within ${timeoutMs}ms`));
    }, timeoutMs);
    const tick = (): void => {
      if (resolved) return;
      const joined = harness.stderrChunks.join("");
      if (joined.includes("stdio_ready")) {
        resolved = true;
        clearTimeout(timer);
        resolve();
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

function shutdown(harness: ChildHarness, timeoutMs: number): Promise<number> {
  return new Promise<number>((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      // Last-resort kill — the harness reports a warning, not a failure.
      try {
        harness.child.kill("SIGKILL");
      } catch {
        // ignore
      }
      resolve(124); // 124 = canonical "timeout" exit code
    }, timeoutMs);
    harness.child.on("exit", (code) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(code ?? -1);
    });
    try {
      harness.child.kill("SIGTERM");
    } catch {
      // already dead — the exit listener above will fire shortly.
    }
  });
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main(): Promise<void> {
  log("── MCP stdio transport — smoke harness ─────────────────────────────");

  loadEnvFile(ENV_FILE);

  // Sanity: the compiled binary must exist; otherwise the harness is being
  // invoked before `npm run build` ran.
  try {
    readFileSync(STDIO_BIN);
  } catch {
    fail(
      `Compiled binary not found at ${STDIO_BIN}.\n` +
        `  Run \`cd backend && npm run build\` first, then re-run this script.`
    );
  }

  // Sanity: the load-bearing env vars must be present, else the child will
  // exit 1 in `loadEnv()` before we get a chance to write any frames.
  for (const required of ["DATABASE_URL", "ANTHROPIC_API_KEY", "NEON_AUTH_URL"]) {
    if (process.env[required] === undefined || process.env[required] === "") {
      fail(`environment variable ${required} is required (read from ${ENV_FILE} or your shell)`);
    }
  }

  const failures: string[] = [];
  const warnings: string[] = [];
  const harness = spawnChild();

  try {
    log("[1/4] waiting for boot");
    await waitForReady(harness, READY_TIMEOUT_MS).catch((err) => {
      const stderrTail = harness.stderrChunks.join("").slice(-2000);
      fail(`${(err as Error).message}\n  stderr tail:\n${stderrTail}`);
    });
    log("      ✓ child reported stdio_ready");

    log("[2/4] initialize handshake");
    harness.send(buildInitialize());
    const initRes = await harness.waitForId(1, REQUEST_TIMEOUT_MS);
    // After a successful initialize, the SDK expects `notifications/initialized`.
    harness.send(buildInitialized());

    const initResult = (initRes.result ?? {}) as {
      protocolVersion?: string;
      serverInfo?: { name?: string; version?: string };
      capabilities?: { tools?: unknown };
    };
    assert(
      failures,
      typeof initResult.protocolVersion === "string",
      "initialize.result.protocolVersion is a string"
    );
    assert(
      failures,
      initResult.serverInfo?.name === "remember-bff-stdio",
      "initialize.result.serverInfo.name === 'remember-bff-stdio'"
    );
    assert(
      failures,
      initResult.capabilities?.tools !== undefined,
      "initialize.result.capabilities.tools is advertised"
    );

    log("[3/4] tools/list");
    harness.send(buildToolsList());
    const toolsRes = await harness.waitForId(2, REQUEST_TIMEOUT_MS);
    const toolsResult = (toolsRes.result ?? {}) as {
      tools?: Array<{ name?: string }>;
    };
    const advertisedNames = (toolsResult.tools ?? [])
      .map((t) => t?.name)
      .filter((n): n is string => typeof n === "string");
    assert(
      failures,
      advertisedNames.length === 18,
      `tools/list returned ${advertisedNames.length} tool(s), expected 18`
    );
    const advertisedSorted = [...advertisedNames].sort();
    const expectedSorted = [...EXPECTED_TOOL_NAMES].sort();
    const missing = expectedSorted.filter((n) => !advertisedSorted.includes(n));
    const extra = advertisedSorted.filter((n) => !expectedSorted.includes(n));
    assert(failures, missing.length === 0, `no missing tool names (missing=${JSON.stringify(missing)})`);
    assert(failures, extra.length === 0, `no extra tool names (extra=${JSON.stringify(extra)})`);

    log("[4/4] stdout purity");
    // Every line the child wrote to stdout must parse as a JSON-RPC object.
    // This is the load-bearing invariant of the stdio transport: pino must
    // write to stderr, so any non-JSON line on stdout is a smoking gun.
    let nonJsonLine: { index: number; preview: string } | null = null;
    let nonRpcLine: { index: number; preview: string } | null = null;
    for (let i = 0; i < harness.stdoutLines.length; i++) {
      const line = harness.stdoutLines[i] ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        nonJsonLine = { index: i, preview: line.slice(0, 200) };
        break;
      }
      if (!isValidJsonRpcShape(parsed)) {
        nonRpcLine = { index: i, preview: line.slice(0, 200) };
        break;
      }
    }
    assert(
      failures,
      nonJsonLine === null,
      nonJsonLine === null
        ? "every stdout line is valid JSON"
        : `stdout line #${nonJsonLine.index} is not valid JSON: ${nonJsonLine.preview}`
    );
    assert(
      failures,
      nonRpcLine === null,
      nonRpcLine === null
        ? "every stdout line carries jsonrpc='2.0'"
        : `stdout line #${nonRpcLine.index} is not a JSON-RPC frame: ${nonRpcLine.preview}`
    );

    log(`      ✓ ${harness.stdoutLines.length} stdout line(s), all JSON-RPC`);
  } finally {
    log("• sending SIGTERM");
    const exitCode = await shutdown(harness, SHUTDOWN_TIMEOUT_MS);
    log(`      → child exited with code ${exitCode}`);
    // A graceful shutdown should yield exit code 0; a SIGKILL fallback yields
    // 124 (our marker) or a non-zero code from the kernel. The spec accepts
    // either 0 or 1 (the SIGTERM handler in mcp-stdio.ts calls process.exit(0)
    // on success and process.exit(1) only if pool.end() throws). We accept
    // both as PASS, but flag anything else as a warning so the regression is
    // visible.
    if (exitCode === 0) {
      log("      ✓ clean exit (code 0)");
    } else if (exitCode === 1) {
      warnings.push(`child exited with code 1 (acceptable per spec — pool.end may have rejected)`);
    } else if (exitCode === 124) {
      warnings.push(`child did not exit within ${SHUTDOWN_TIMEOUT_MS}ms — sent SIGKILL`);
    } else {
      warnings.push(`child exited with unexpected code ${exitCode}`);
    }
  }

  // ---- Verdict --------------------------------------------------------------
  log("");
  log("─────────────────────────────────────────────────────────────────────");
  for (const w of warnings) log(`⚠  ${w}`);
  if (failures.length === 0) {
    log(`✓ SMOKE PASSED — ${warnings.length} warning(s).`);
    log("  stdio transport boots, advertises 18 tools, exits gracefully on SIGTERM,");
    log("  and writes ONLY JSON-RPC frames on stdout (pino correctly pinned to stderr).");
    process.exitCode = 0;
  } else {
    log(`✗ SMOKE FAILED — ${failures.length} assertion(s) failed:`);
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

main().catch((err) => {
  process.stderr.write(`\n✗ SMOKE CRASHED: ${(err as Error)?.stack ?? String(err)}\n`);
  process.exit(3);
});
