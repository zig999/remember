# Chat -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: none (READ-ONLY tool delegation; no schema change) | Version: 1.1.1 | Status: draft | Layer: permanent
> Business spec: `../chat.spec.md`
> REST contract: `../openapi.yaml`
> Normative deviation: this domain is an ADDITIVE deviation from `/remember-modelagem-v7.md` (which does not specify a chat surface). The inegociable rule of v7 §2 holds: the LLM never reaches the database directly; every tool opens its own short `BEGIN READ ONLY` transaction. Reconcile via a future `/u-improve` pass that amends v7 §2 with the chat transport.

---

## 1. Stack and Patterns

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves the consolidated `openapi.root.yaml`; this domain adds a `$ref` to `domains/chat/openapi.yaml`) | CLAUDE.md default |
| Streaming transport | Server-Sent Events. Implementation: `reply.hijack()` followed by direct writes to `reply.raw` (the same Fastify-bridge pattern used by the MCP SDK transport `backend/src/mcp/sdk-http-transport.ts` at lines 172-173 — `reply.hijack()` + write to `reply.raw`). Required response headers set BEFORE the first write: `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`. Each frame is written as `event: <name>\ndata: <JSON>\n\n` (one event per frame, no batching — BR-08 of `.spec.md`). | New (this domain). |
| MCP integration | This domain does NOT register tools on the MCP server. It CONSUMES the in-process `McpServer` registry (`backend/src/mcp/server.ts` — `McpServer.getTool(toolset, name)`) as a read-only catalog. The registry was already populated at boot by `query-retrieval` and `knowledge-graph` (`knowledge-graph.back.md` BR-23). `buildChatToolCatalog(mcp)` is resolved lazily on the first chat request and the resolved catalog is cached for the process lifetime (BR-05). `registerChatRoutes(scoped, deps)` is mounted on the `/api/v1` scope ONLY when the resolved catalog is non-empty (`catalog !== undefined`); otherwise the route is not registered (defensive guard — a misconfigured boot must not silently expose an empty chat surface). | New (this domain). |
| ORM | None — tool calls go through the existing `*Service.*` layer of `query-retrieval` / `knowledge-graph`; that layer uses raw `pg` (A6, §2.2). This domain owns no SQL of its own. | CLAUDE.md default |
| Migration strategy | NONE. This domain owns ZERO migrations — v1 is STATELESS (no `chat_conversation`, no `chat_message`). Phase 2 may add migrations; they will follow CLAUDE.md "Safety Rule — Database Changes Require Explicit Approval". | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/chat/`. Layers: `routes` (Fastify handler + Zod schemas, SSE framing) -> `service` (`ChatAgentService.runTurn`: the agentic loop, returns `AsyncIterable<ChatEvent>`) -> `service` consumes the resolved tool catalog and the Anthropic client factory. No `repository` layer (read-only delegation). | Aligned with CLAUDE.md `folder_structure: modules`. |
| Validation library | Zod v4. `ChatTurnRequest` Zod schema mirrors the OpenAPI `components/schemas/ChatTurnRequest`: `messages: z.array(z.object({ role: z.enum(['user','assistant']), content: z.string().min(1) })).min(1).max(env.MAX_HISTORY_MESSAGES); model: z.string().min(1).optional()`. A custom `.refine` enforces `messages[0].role === 'user'` (BR-02 of `.spec.md` / BR-02 below). Failure -> 422 `VALIDATION_INVALID_FORMAT` BEFORE the SSE is opened. | CLAUDE.md default |
| Auth | `requireNeonAuth` preHandler inherited from the `/api/v1` scope (CLAUDE.md "Authentication"). No additional auth check inside the chat handler. The owner-only model (v7 §2.3 / ADR A20) holds. In development the carve-out `LOCAL_OPERATOR_TOKEN` works transparently because it is enforced by the inherited preHandler — chat does not re-check the JWT. | CLAUDE.md default |
| Logging | `pino` structured JSON. One INFO record per completed turn (`event: "chat.turn"`) with fields per BR-19 of `.spec.md` and §9 below. NEVER logs `messages[i].content`, raw tool inputs, raw tool result bodies, or `args_summary` raw values. DEBUG level may sample structural diagnostics but never PII. | CLAUDE.md default |
| Observability | `observability_required: true`. Counter `chat_turn_total{stop_reason}`. Histograms: `chat_turn_latency_ms`, `chat_turn_iterations`. No new metric backend — reuses the pino transport (parallel to the ingestion run metrics). | CLAUDE.md default |
| Transaction policy | NO transaction is owned by the chat route itself. Each tool invocation opens its OWN short read-only transaction via the existing `withReadOnly(pool, ...)` helper, inside the tool's service code (i.e. nothing is changed in the tool implementations; the chat domain only invokes them). This is the v7 §2 inegociable contract: the LLM never reaches the database directly. | New (this domain). |
| Concurrency | None internal. Multiple concurrent chat turns share the same `McpServer` registry instance and the same Anthropic client (instantiated once at first request via `defaultAnthropicFactory`). Tool calls inside a single turn are sequential (`tool_choice.disable_parallel_tool_use = true`). | New (this domain). |
| Time source | `Date.now()` for the wall-clock budgets (`TURN_TIMEOUT_MS`, `TOOL_TIMEOUT_MS`). Wall-clock is acceptable here because the budgets are sanity ceilings, not durable invariants. No `now()` SQL call is owned by this domain. | CLAUDE.md default |
| External integration | Anthropic Messages API (streaming). Reuses the `defaultAnthropicFactory` pattern from `modules/ingestion/service/extraction.service.ts` (lines 177-198): `type AnthropicFactory = (apiKey: string) => AnthropicLike` with default constructing the SDK client from `env.ANTHROPIC_API_KEY` using `timeout: 5 * 60 * 1000` and `maxRetries: 2`. Tool catalog: 13 read-only tools resolved via `mcp.getTool('query', name)` (see BR-05). | New (this domain). |
| Testing | Vitest unit tests on (i) `ChatTurnRequest` Zod schema (BR-01..BR-04), (ii) `buildChatToolCatalog` lazy resolution + caching (BR-05), (iii) the agentic-loop driver against a stub Anthropic client that yields scripted SDK events (covers UC-01..UC-05; in particular the `max_iterations`, `turn_timeout`, `cancelled` ceilings), (iv) the SSE framer (one frame per `event:` block, correct headers, no batching), (v) the redacted `args_summary` builder for each of the 13 tools (BR-09), (vi) the kill-switch short-circuit (BR-14), (vii) the tool-result truncation (BR-13), (viii) the output guard against system-prompt leakage (BR-20). No acceptance scenario from v7 §17 maps to this domain (deviation). | CLAUDE.md default |

### 1.1 File layout

```
backend/src/modules/chat/
  routes/
    chat.routes.ts             # registerChatRoutes(scoped, deps): Fastify handler.
                               #   - Parses ChatTurnRequest with Zod.
                               #   - Short-circuits on env.CHAT_ENABLED===false (BR-14).
                               #   - Invokes anthropicFactory; on throw -> 503 (BR-21).
                               #   - reply.hijack() + writes SSE headers.
                               #   - Wires req.raw 'close' -> AbortController.abort() (BR-12).
                               #   - Consumes the AsyncIterable<ChatEvent> from
                               #     chatAgentService.runTurn(...) and writes one
                               #     `event: ...\ndata: ...\n\n` frame per ChatEvent.
                               #   - On AsyncIterable throw, maps to ChatEvent.error frame.
                               #   - On loop end, emits the pino INFO turn record (BR-19).
    chat.schemas.ts            # Zod ChatTurnRequest + .refine(first=user).
  service/
    chat-agent.service.ts      # ChatAgentService factory returning { runTurn }.
                               #   runTurn(input): AsyncIterable<ChatEvent>.
                               #   Owns: the agentic loop, iteration counter,
                               #   turn-timeout timer, abort propagation, tool
                               #   dispatch, tool-result truncation (BR-13),
                               #   args_summary builder (BR-09), output guard
                               #   (BR-20), token accounting (sum across iterations).
    tool-catalog.ts            # buildChatToolCatalog(mcp): resolves the 13 names
                               #   once and memoizes in module scope.
                               #   Returns ResolvedChatToolCatalog | undefined.
    args-summary.ts            # Per-tool switch -> short, redacted, <=200 chars.
    truncate-tool-result.ts    # Unicode-codepoint-bounded JSON truncation +
                               #   "\n[truncated: <n> chars]" marker (BR-13).
    output-guard.ts            # System-prompt marker scrubber (BR-20).
    errors.ts                  # ChatDisabledError, ChatProviderUnavailableError +
                               #   mapping to the standard ErrorEnvelope
                               #   (consumed by error-mapping.ts at the route edge).
    types.ts                   # ChatEvent (discriminated union), ChatRunInput,
                               #   ChatRunStats (tokens_in/out, iterations,
                               #   tools_called[], stop_reason), AnthropicFactory
                               #   re-export from ingestion or a local copy.
  prompts/
    index.ts                   # selectChatPromptModule(version): resolves the
                               #   pt-BR system prompt module (BR-18). Parallel
                               #   pattern to modules/ingestion/prompts/index.ts.
                               #   Unknown version -> UnknownChatPromptVersionError
                               #   (boot-time fast failure).
    v1.ts                      # Initial pt-BR system prompt + opaque marker
                               #   token planted at the head (BR-20).
```

> The boundary is enforced by import direction: `routes/` imports `service/`,
> `service/` imports `prompts/`. Nothing inside `chat/` imports from
> `query-retrieval` or `knowledge-graph` directly — the only coupling is the
> `McpServer` registry (passed via `deps`) and the resolved `McpTool` references
> it returns.

### 1.2 ChatAgentService contract

```ts
// service/types.ts (illustrative — back-spec contract, NOT implementation)
export type ChatEvent =
  | { type: "llm_start";   iteration: number }
  | { type: "text_delta";  delta: string }
  | { type: "tool_start";  tool: string; args_summary: string }
  | { type: "tool_result"; tool: string; ok: boolean }
  | { type: "done";        stop_reason: DoneStopReason; model: string;
                           tokens_in: number; tokens_out: number }
  | { type: "error";       code: string; message: string };

export type DoneStopReason =
  | "end_turn" | "max_tokens" | "stop_sequence"
  | "max_iterations" | "turn_timeout" | "cancelled";

export interface ChatRunInput {
  readonly messages: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
  readonly model: string;          // Resolved (override OR env.CHAT_MODEL).
  readonly abortSignal: AbortSignal; // Bound to req.raw 'close' (BR-12).
}

export interface ChatAgentService {
  // Single entry point. Yields ChatEvents in the order defined by the §5
  // state machine of `.spec.md`. Always terminates with exactly one
  // `done` OR `error` event. Caller (route handler) is responsible for
  // serialising each ChatEvent as one SSE frame and for writing the final
  // pino record after the iterator returns/throws.
  runTurn(input: ChatRunInput): AsyncIterable<ChatEvent>;
}

export interface ChatAgentServiceDeps {
  readonly mcp: McpServer;                 // Tool registry (read-only).
  readonly logger: Logger;                 // pino.
  readonly env: ChatEnv;                   // See §8 env table.
  readonly anthropicFactory?: AnthropicFactory; // Optional injection (tests).
  readonly now?: () => number;             // Optional injection (tests).
}
```

The `AsyncIterable<ChatEvent>` contract decouples the route handler (SSE framing,
pino) from the loop (Anthropic streaming, tool dispatch, ceilings). Tests drive
`runTurn` directly against a stub Anthropic client and assert on the yielded
sequence; integration tests drive the full route and assert on the SSE wire
bytes.

---

## 2. Data Model

> **This domain owns no tables, no columns, no indexes.** v1 is STATELESS — no
> `chat_conversation`, no `chat_message`. The only persistent footprint of the
> chat surface is the pino log records (CLAUDE.md "Logging" / BR-19 of `.spec.md`).

### Tables (read, through delegation only)

Every tool call ultimately reads tables already owned by other domains
(`information_fragment`, `node_alias`, `knowledge_node`, `raw_chunk`,
`fragment_source`, `provenance`, `raw_information`, `knowledge_link`,
`node_attribute`, ...). The chat domain delegates to the tool implementations;
it does NOT issue SQL itself. See the data models in
`query-retrieval/back/query-retrieval.back.md` §2 and
`knowledge-graph/back/knowledge-graph.back.md` §2.

### Indexes

None owned by this domain.

### Relationships

None owned by this domain.

---

## 3. Business Rules (BR)

### BR-01 -- `messages` is non-empty and bounded
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06
**Where to validate:** route (Zod `ChatTurnRequest`)
**Description:** `messages.length >= 1 AND messages.length <= env.MAX_HISTORY_MESSAGES` (default 40). The cap is a sanity ceiling, not a hard product limit; clients exceeding it must trim before sending.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-02 -- First message MUST have `role=user`
**Related UC:** UC-01
**Where to validate:** route (Zod `.refine` on `ChatTurnRequest`)
**Description:** `messages[0].role === "user"`. Enforced before any LLM call. Required because the Anthropic API rejects histories that do not start with a user turn.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-03 -- Roles are exactly `user` or `assistant`
**Related UC:** UC-01
**Where to validate:** route (Zod `z.enum(['user','assistant'])`)
**Description:** No other role value is accepted on the public history. The transient `assistant(tool_use)` / `user(tool_result)` blocks the loop synthesises during an iteration are NOT serialised back to the client (they live only inside the in-loop history fed to Anthropic).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-04 -- `content` is a non-empty string
**Related UC:** UC-01
**Where to validate:** route (Zod `z.string().min(1)`)
**Description:** Empty / non-string content fails parse.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-05 -- Tool catalog is the read-only `query` toolset, resolved lazily
**Related UC:** UC-02
**Where to validate:** route registration + service (`buildChatToolCatalog(mcp)`)
**Description:** The catalog is the 13 names listed in `.spec.md` BR-05 (9 of `knowledge-graph`: `get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types`, `list_attribute_keys`; 4 of `query-retrieval`: `search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`). Resolution is `mcp.getTool('query', name)` for each name (`backend/src/mcp/server.ts` line 98). The resolution is performed lazily on the first chat request and cached in module scope; subsequent requests reuse the cached catalog. `registerChatRoutes(scoped, deps)` is mounted on the `/api/v1` scope ONLY when the resolved catalog is non-empty. If any of the 13 names is missing at resolution time, the resolver returns `undefined` and the route is not registered — the BFF logs a single ERROR with the missing names and continues to boot.
**Error returned:** route not registered (404 on `POST /api/v1/chat`) — no specific code; see §7 for the boot diagnostic.

### BR-06 -- Tools are READ-ONLY (v7 §2 inegociable)
**Related UC:** UC-02
**Where to validate:** service (the `tools[]` passed to `anthropic.messages.stream(...)` is exactly the resolved 13 names; the Anthropic API will only emit `tool_use` blocks with names from that list)
**Description:** No write or curation tool name MUST appear in the `tools[]` array sent to Anthropic. Each tool call opens its own short read-only transaction inside its own service code (existing `withReadOnly(pool, ...)` helper used by both `query-retrieval/routes/query-retrieval.routes.ts` line 206 and `knowledge-graph/routes/knowledge-graph.routes.ts` line 409). The LLM never reaches the database directly.
**Error returned:** n/a (architectural invariant).

### BR-07 -- Tool result envelope is the standard business envelope
**Related UC:** UC-02
**Where to validate:** service (tool dispatcher)
**Description:** Each tool returns `{ ok: true, result }` or `{ ok: false, error: { code, message, details? } }`. The dispatcher maps this 1:1 to (a) the SSE `tool_result{tool, ok}` frame and (b) the `user(tool_result)` block fed back to Anthropic on the next iteration. The tool's `error.code` (e.g. `BUSINESS_INVALID_SEARCH_QUERY`, `BUSINESS_NODE_DELETED`) flows back to the model as part of the JSON payload of the `tool_result` block; the SSE channel only surfaces the `ok` boolean.
**Error returned:** n/a (mapping rule).

### BR-08 -- `text_delta` frames are emitted as the Anthropic SDK yields them
**Related UC:** UC-01
**Where to validate:** service (SDK event handler)
**Description:** The handler subscribes to the SDK's text-delta event and immediately yields a `ChatEvent.text_delta` for any non-empty delta. Empty deltas are dropped (the schema requires `delta.length >= 1`). The route handler MUST call `reply.raw.write(frame)` synchronously per yielded event (no microtask batching) so that proxy buffers cannot coalesce frames.
**Error returned:** n/a.

### BR-09 -- `tool_start.args_summary` is a redacted, bounded summary
**Related UC:** UC-02
**Where to validate:** service (per-tool summariser, dispatched on tool name)
**Description:** A switch-case in `args-summary.ts` produces a tool-specific summary string, length <= 200 chars, never containing raw `value` / `text` columns or full document bodies. Concrete formats:
- `search`: `query="<first 60 chars of query>"` (+ optional `layers=...`, `expand_depth=<n>`)
- `get_node` / `traverse`: `id=<uuid>` (+ `depth=<n>` for `traverse`)
- `get_history_link` / `get_history_attribute`: `id=<uuid>`
- `get_history_attribute_key`: `node_id=<uuid> key=<key>`
- `list_nodes`: `node_type=<name> limit=<n>`
- `list_node_types` / `list_link_types` / `list_attribute_keys`: `""` (no args)
- `get_provenance_link` / `get_provenance_attribute` / `get_provenance_fragment`: `id=<uuid>`
Fallback when input shape is unexpected: `"<n keys>"`.
**Error returned:** n/a (cosmetic / UI). On builder error the dispatcher falls back to `"<n keys>"`.

### BR-10 -- Unknown tool name returns an error tool_result without aborting the turn
**Related UC:** UC-02
**Where to validate:** service (tool dispatcher)
**Description:** Defensive guard. If the resolved catalog (BR-05) does not contain `block.name` at dispatch time (cannot occur after BR-05 catalog resolution unless the registry is mutated; structurally guarded), the dispatcher emits `tool_result{tool: block.name, ok: false}` and feeds back `{ ok: false, error: { code: "VALIDATION_INVALID_FORMAT", message: "unknown tool name" } }` as the `tool_result` block of the next Anthropic iteration. The loop continues.
**Error returned:** n/a (loop continuation).

### BR-11 -- Mid-stream provider failure surfaces as one SSE `error` frame, then close
**Related UC:** UC-01 (`7a`)
**Where to validate:** service (SDK error handler)
**Description:** When the Anthropic SDK emits a stream error event, OR when `messages.stream(...)` rejects mid-flight (and the cause is NOT an `AbortError` raised by `BR-12` or `BR-16`), the service yields exactly ONE `ChatEvent.error` with `{ code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE", message: <sanitised> }` and the iterator returns. The route writes the frame and closes the SSE. NO `done` frame follows. The sanitised message MUST NOT include the raw upstream error string (provider strings may leak credentials or internal endpoints). Mapping: any non-`AbortError` provider error -> `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (the existing global catalog code `SYSTEM_SERVICE_UNAVAILABLE` remains reserved for the tool-timeout case BR-17).
**Error returned:** SSE `error{code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE"}`.

### BR-12 -- Client disconnect triggers `stream.abort()`
**Related UC:** UC-05
**Where to validate:** route handler (`req.raw.on('close')` -> `AbortController.abort()`) + service (observes `input.abortSignal`)
**Description:** On socket close, the route handler invokes `AbortController.abort()`. The service observes the signal, calls `stream.abort()` on the in-flight Anthropic stream, and yields `done{stop_reason: "cancelled", model, tokens_in, tokens_out}`. The route handler attempts to write the frame; if the socket is no longer writable, the write is best-effort and the frame is silently dropped. In either case the iterator returns and the loop terminates.
**Error returned:** SSE `done{stop_reason: "cancelled"}` when achievable; otherwise none.

### BR-13 -- Tool results sent back to the model are truncated to `toolResultMaxChars`
**Related UC:** UC-02
**Where to validate:** service (tool dispatcher, after the tool returns and before serialising the `tool_result` block fed to the next iteration)
**Description:** The JSON-serialised tool result body is truncated to `env.TOOL_RESULT_MAX_CHARS` Unicode code points (default 8000). Truncation appends an explicit marker `"\n[truncated: <total_chars> chars]"`. The SSE `tool_result{tool, ok}` frame is NOT affected by truncation (it carries no body). Truncation is applied to the `result` field on success and to the `error` field on failure. Implementation lives in `service/truncate-tool-result.ts`.
**Error returned:** n/a (transparent truncation).

### BR-14 -- Kill-switch returns 503 BEFORE opening the SSE
**Related UC:** UC-06
**Where to validate:** route handler (first executable line after Zod parse, before any factory or hijack call)
**Description:** `if (env.CHAT_ENABLED === false) return reply.code(503).send({ ok: false, error: { code: "BUSINESS_CHAT_DISABLED", message: "chat surface is disabled by CHAT_ENABLED=false" } });`. No SSE frame is emitted; the standard REST envelope is used so the SPA can render the disabled state uniformly with other 503 responses.
**Error returned:** HTTP 503 -- error.code: `BUSINESS_CHAT_DISABLED`.

### BR-15 -- `maxIterations` ceiling closes the turn with `stop_reason: "max_iterations"`
**Related UC:** UC-03
**Where to validate:** service (loop guard, evaluated before opening iteration `N+1`)
**Description:** `if (iteration > env.MAX_ITERATIONS) { yield done({stop_reason: "max_iterations"}); return; }`. Default `MAX_ITERATIONS = 8`. The ceiling is checked AFTER the last `tool_result` frame is yielded so the SSE sequence remains `... tool_result -> done`.
**Error returned:** SSE `done{stop_reason: "max_iterations"}`.

### BR-16 -- `turnTimeoutMs` ceiling aborts the active stream
**Related UC:** UC-04
**Where to validate:** service (wall-clock timer started at first `llm_start`)
**Description:** `setTimeout(() => abortController.abort(reason="turn_timeout"), env.TURN_TIMEOUT_MS)`. The service distinguishes the timeout abort from the client-cancel abort by inspecting the abort reason. On timeout, the service emits `done{stop_reason: "turn_timeout"}`. Default `TURN_TIMEOUT_MS = 90_000`. The timer is `clearTimeout`'d on any terminal state to avoid orphaned timers.
**Error returned:** SSE `done{stop_reason: "turn_timeout"}`.

### BR-17 -- `toolTimeoutMs` aborts a single tool call without ending the turn
**Related UC:** UC-02 (timeout variant)
**Where to validate:** service (per-tool wall-clock wrapper)
**Description:** Each tool invocation is wrapped in `Promise.race([toolPromise, sleep(env.TOOL_TIMEOUT_MS).then(() => ({ ok: false, error: { code: "SYSTEM_SERVICE_UNAVAILABLE", message: "tool timeout" } }))])`. On timeout, the dispatcher yields `tool_result{tool, ok:false}` and feeds the timeout error back to the model. Default `TOOL_TIMEOUT_MS = 15_000`. Note: this does NOT cancel the underlying SQL — the tool's own `withReadOnly` runs to completion. v1 accepts that orphaned work; phase 2 may plumb the abort signal through.
**Error returned:** SSE `tool_result{tool, ok:false}` (NOT terminal); model receives `{code:"SYSTEM_SERVICE_UNAVAILABLE"}` as the failed tool_result body.

### BR-18 -- System prompt persona, language, and safety
**Related UC:** UC-01, UC-02
**Where to validate:** service (system prompt is loaded from a versioned module — parallel pattern to `modules/ingestion/prompts/index.ts`)
**Description:** The system prompt is pt-BR. Persona: "assistente de consulta ao grafo de conhecimento". Required content per `.spec.md` BR-18 (entities, temporal axes, confidence flag, resolve-before-call rule, never-invent-ids rule, citation rule, pt-BR response rule, data-not-instruction rule (v7 §13), no-stack-trace rule). The prompt module is versioned (`v1`, `v2`, ...); the active version is selected by `env.CHAT_PROMPT_VERSION` (default `v1`). Resolution: `selectChatPromptModule(env.CHAT_PROMPT_VERSION)` in `prompts/index.ts`; unknown version -> `UnknownChatPromptVersionError` thrown at boot (parallel to the `ingestion` prompt registry behaviour — see CLAUDE.md memory `[[prompt-version-registry]]`). The opaque marker token planted at the head of each prompt module (BR-20) MUST be exported as a named constant from the module so `output-guard.ts` can import it without reading the prompt body.
**Error returned:** boot failure if `CHAT_PROMPT_VERSION` is unknown.

### BR-19 -- Observability per turn (no PII)
**Related UC:** all
**Where to validate:** route handler (single pino INFO record emitted on stream close, AFTER consuming the entire `AsyncIterable<ChatEvent>`)
**Description:** Fields per §9 below. The `messages[i].content`, raw tool inputs, raw tool result bodies, and `args_summary` raw values are NEVER logged. Counter `chat_turn_total{stop_reason}` is incremented at the same point. The record is emitted exactly once per turn, regardless of terminal state (`done` or `error`).
**Error returned:** n/a.

### BR-20 -- Output guard (minimal) against system-prompt leakage
**Related UC:** all
**Where to validate:** service (`text_delta` yield site, before the event leaves the iterator)
**Description:** Before yielding a `ChatEvent.text_delta`, the service checks the delta against the registered opaque system-prompt marker token (a string planted in the system prompt, e.g. `__REMEMBER_SYS_MARKER_V1__`). If the marker appears in the delta, the delta is dropped (not yielded; not aggregated into the assistant turn fed back on the next iteration). The check is a single `String.prototype.includes` call — O(|delta|). The marker token is exported as a named constant from the prompt module to keep the check independent of the prompt body.
**Error returned:** n/a (silent drop). A WARN log is emitted on drop with `{ event: "chat.output_guard_drop", marker_version: "v1" }` and never the delta content.

### BR-21 -- Anthropic factory is injectable; defaults from env
**Related UC:** UC-01
**Where to validate:** module wiring (`registerChatRoutes(scoped, {mcp, logger, env, anthropicFactory?})`)
**Description:** The `anthropicFactory` parameter is the SAME type as `defaultAnthropicFactory` in `modules/ingestion/service/extraction.service.ts` (line 177: `type AnthropicFactory = (apiKey: string) => AnthropicLike`; line 193: `defaultAnthropicFactory` constructs `new AnthropicClient({ apiKey, timeout: 5*60*1000, maxRetries: 2 })`). When omitted, the chat route uses `defaultAnthropicFactory` and reads `env.ANTHROPIC_API_KEY` (which already exists per CLAUDE.md "Ingestion extraction architecture"). When the factory throws (missing key, malformed config), the route handler returns 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` BEFORE opening the SSE. The client instance is constructed once on the first request and cached in module scope.
**Error returned:** HTTP 503 -- error.code: `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`.

### BR-22 -- `tool_choice` policy
**Related UC:** UC-02
**Where to validate:** service (Anthropic call site)
**Description:** Every `messages.stream(...)` call uses `tool_choice: { type: "auto", disable_parallel_tool_use: true }`. Disabling parallel tool use enforces strict sequential dispatch inside the loop, which simplifies the iteration accounting (one `tool_use` block per iteration when present) and prevents accidental fan-out against the read-only services.
**Error returned:** n/a.

### BR-23 -- Pre-stream error envelope vs in-stream error frame
**Related UC:** UC-01, UC-06
**Where to validate:** route handler (decision happens at the boundary between the synchronous prelude and the call to `reply.hijack()`)
**Description:** Any error raised BEFORE `reply.hijack()` is rendered via the standard `error-mapping.ts` -> HTTP status + REST envelope (`VALIDATION_INVALID_FORMAT`, `AUTH_*`, `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`). Any error raised AFTER `reply.hijack()` is rendered as ONE SSE `error` frame (only `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` and `SYSTEM_INTERNAL_ERROR` are valid in-stream codes — see `.spec.md` §6). Pre-stream codes (`VALIDATION_*`, `AUTH_*`, `BUSINESS_CHAT_DISABLED`) MUST NEVER appear inside an SSE `error` frame. The route handler's try/catch boundary is the structural enforcement point.
**Error returned:** depends on phase — see above.

### BR-24 -- One terminal frame per turn
**Related UC:** all (state-machine invariant)
**Where to validate:** service (the `runTurn` AsyncIterable contract)
**Description:** Every successfully opened SSE stream terminates with EXACTLY ONE of `{done, error}`. The `AsyncIterable<ChatEvent>` enforces this by construction: the loop's `return` path always yields either `done(...)` or `error(...)` immediately before returning, and never both. The route handler MUST close `reply.raw.end()` after the terminal frame is written and MUST NOT write further frames.
**Error returned:** n/a (state-machine invariant).

---

## 4. State Machine (ST)

### ST-01 -- Chat turn lifecycle

Mirrors the business state machine of `.spec.md` §5. The technical guards below are not visible in the business spec.

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| `idle` | `validating` | `POST /api/v1/chat` arrives | -- | UC-01 |
| `validating` | `closed_pre_stream` | Zod parse fails | -- | UC-01 |
| `validating` | `closed_pre_stream` | JWT invalid | preHandler short-circuit | UC-01 |
| `validating` | `closed_pre_stream` | kill-switch on | `env.CHAT_ENABLED === false` (BR-14) | UC-06 |
| `validating` | `closed_pre_stream` | Anthropic factory throws | `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (BR-21) | UC-01 |
| `validating` | `streaming_open` | route opens SSE | `reply.hijack()` + headers written | UC-01 |
| `streaming_open` | `llm_streaming(1)` | service yields `llm_start{1}` | start wall-clock timer (BR-16) | UC-01 |
| `llm_streaming(i)` | `llm_streaming(i)` | SDK `text_delta` | `delta.length >= 1` (BR-08), passes BR-20 guard | UC-01 |
| `llm_streaming(i)` | `tool_pending(i,t)` | SDK stop = `tool_use` | tool name in resolved catalog (BR-05) | UC-02 |
| `tool_pending(i,t)` | `tool_running(i,t)` | service yields `tool_start{t}` | redacted summary (BR-09) | UC-02 |
| `tool_running(i,t)` | `iteration_completed(i)` | tool returns `{ok}` | -- | UC-02 |
| `tool_running(i,t)` | `iteration_completed(i)` | tool timeout | wall-clock > `TOOL_TIMEOUT_MS` (BR-17) | UC-02 |
| `iteration_completed(i)` | `llm_streaming(i+1)` | next iteration begins | `i+1 <= MAX_ITERATIONS` (BR-15); truncate prior result (BR-13) | UC-02 |
| `iteration_completed(i)` | `done_max_iterations` | ceiling hit | `i+1 > MAX_ITERATIONS` (BR-15) | UC-03 |
| any active | `done_error` | SDK error / loop exception | error mapped to `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` or `SYSTEM_INTERNAL_ERROR` (BR-11, BR-23) | UC-01 |
| any active | `aborting` | `req.raw.on('close')` fires | `AbortController.abort()`, `stream.abort()` (BR-12) | UC-05 |
| any active | `aborting_timeout` | wall-clock > `TURN_TIMEOUT_MS` | `AbortController.abort(reason="turn_timeout")` (BR-16) | UC-04 |
| `aborting` | `done_cancelled` | abort acknowledged | socket still writable; otherwise frame silently dropped | UC-05 |
| `aborting_timeout` | `done_timeout` | abort acknowledged | -- | UC-04 |
| any `done_*` | `closed` | `done` frame written | `reply.raw.end()` (BR-24) | -- |
| `done_error` | `closed` | `error` frame written | `reply.raw.end()` (BR-24) | UC-01 |

---

## 5. Domain Events (EV)

> v1 is STATELESS — this domain does NOT publish or consume any cross-service
> event bus. The pino log record emitted on stream close (BR-19) is
> observability, not an event. No event broker is configured for the Remember
> BFF (CLAUDE.md "Architecture / Backend").

`No events in this version.`

---

## 6. External Integrations

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Anthropic Messages API (streaming) | LLM provider | Drive the agentic tool-use loop and emit text deltas. Reuses `defaultAnthropicFactory` from `modules/ingestion/service/extraction.service.ts` (BR-21). | Per-turn wall-clock: `TURN_TIMEOUT_MS` (default 90s, BR-16). Per-Anthropic-call: the SDK's `timeout: 5*60*1000` from `defaultAnthropicFactory`. The per-turn ceiling is strictly tighter and is the binding budget. | On factory failure (pre-stream) -> 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. On mid-stream failure -> SSE `error{code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE"}` then close (BR-11). On wall-clock expiry -> SSE `done{stop_reason: "turn_timeout"}` (BR-16). No retry inside the turn (the client may re-POST). |
| In-process `McpServer` registry (consumed, not registered) | Tool catalog source | Resolve the 13 read-only `query`-toolset tools via `mcp.getTool('query', name)` (`backend/src/mcp/server.ts` line 98). | n/a (in-process, synchronous lookup). | If the registry returns `undefined` for any of the 13 names at first-request resolution time, `registerChatRoutes` is not mounted and the route returns 404 (BR-05). |
| `query-retrieval` + `knowledge-graph` services (consumed, not registered) | DB read via existing tool handlers | Each tool invocation calls into the existing service code, which opens its own `BEGIN READ ONLY` transaction (`withReadOnly` helper — `query-retrieval/routes/query-retrieval.routes.ts` line 206, `knowledge-graph/routes/knowledge-graph.routes.ts` line 409). | Per-tool wall-clock: `TOOL_TIMEOUT_MS` (default 15s, BR-17). | On timeout -> failed `tool_result` fed back to the model; the turn continues. On underlying pg failure -> the tool's own mapper returns its standard envelope; the dispatcher mirrors `ok=false` and feeds the envelope back. |

---

## 7. Known Technical Constraints

- **No DB schema change.** v1 owns zero migrations. The pino log record (BR-19) is the only persistent footprint.
- **Tool registry is mutable in principle.** The `McpServer` registry is in-process and could be re-registered after boot by another module. The chat domain mitigates this by caching the resolved catalog after the first request and by trusting the `query`-toolset semantics (no domain currently mutates the registry post-boot). If a future domain does mutate the registry, the cached catalog will go stale until process restart.
- **SSE behind proxies.** The `X-Accel-Buffering: no` header is required to disable nginx-style buffering. Any new edge proxy must respect this header or be configured to disable buffering for `text/event-stream`.
- **Anthropic SDK concurrency.** A single Anthropic client instance is shared across concurrent turns. The SDK is concurrency-safe per session, but a global rate-limit can starve concurrent turns; not a v1 concern (single-owner -> at most a handful of concurrent turns).
- **No pre-stream backpressure on long histories.** The 40-message cap (`MAX_HISTORY_MESSAGES`) and the Anthropic input-token limit are the only bounds. Very large `content` strings inside the cap may still exceed the model's context window — the failure surfaces as a provider error (BR-11) post-stream.
- **`disable_parallel_tool_use: true` is unconditional.** Parallel tool use is intentionally disabled to keep the iteration accounting clean. Re-enabling it later would require multi-`tool_result` rebuild on the next iteration and a redesign of the `tool_start` / `tool_result` SSE pairing.
- **Boot diagnostic for missing tools.** When `buildChatToolCatalog(mcp)` cannot resolve any of the 13 names at first request, the route returns 404. The BFF logs a single ERROR with the resolved-vs-expected diff at boot. There is no dedicated error code surfaced over HTTP for this case (the route literally does not exist).
- **Tool timeout does not cancel the SQL.** `BR-17` races the tool promise against a `setTimeout`, but the underlying `pg` query continues until the SQL completes or the pool times it out. v1 accepts that orphaned work; phase 2 may plumb `AbortSignal` through `withReadOnly`.
- **No pre-flight model allow-list.** `model` is a free string; an unknown model surfaces as `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` mid-stream (the Anthropic SDK rejects). Single-owner -> acceptable.

---

## 8. Configuration / Environment

All values are read once at boot from `process.env` via `loadEnv()` (the same loader that owns `LOCAL_OPERATOR_TOKEN` per CLAUDE.md). All ceilings are sanity ceilings, not hard product limits.

| Env var | Type | Default | Required | Purpose |
|---------|------|---------|----------|---------|
| `CHAT_ENABLED` | boolean (`"true"`/`"false"`) | `true` | no | Kill-switch (BR-14). When `false`, route returns 503 `BUSINESS_CHAT_DISABLED`. |
| `CHAT_MODEL` | string | `claude-opus-4-8` | no | Default Anthropic model id (overridable per request via `model` body field). |
| `CHAT_PROMPT_VERSION` | string | `v1` | no | System prompt module version (BR-18). Unknown value -> boot fails. |
| `MAX_HISTORY_MESSAGES` | integer | `40` | no | Upper bound on `messages.length` (BR-01). |
| `MAX_ITERATIONS` | integer | `8` | no | Upper bound on agentic-loop iterations (BR-15). |
| `TURN_TIMEOUT_MS` | integer | `90000` (90s) | no | Per-turn wall-clock budget (BR-16). |
| `TOOL_TIMEOUT_MS` | integer | `15000` (15s) | no | Per-tool-call wall-clock budget (BR-17). |
| `TOOL_RESULT_MAX_CHARS` | integer | `8000` | no | Truncation ceiling for tool results fed back to the model (BR-13). |
| `ANTHROPIC_API_KEY` | string | -- | YES (when `CHAT_ENABLED=true`) | Anthropic API key. Reuses the same env already required by `ingestion` (BR-21). Missing -> factory throws -> 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. |

> The chat domain does NOT introduce its own DB connection env; it consumes the
> existing `DATABASE_URL` (Neon) indirectly through the tool services.

---

## 9. Observability — pino turn record (BR-19)

Emitted exactly once per turn (after the iterator returns or throws), at INFO level. Schema:

```jsonc
{
  "event":       "chat.turn",
  "request_id":  "req_01F8Z...",       // Fastify request id.
  "actor":       "owner",              // Always "owner" (single-owner).
  "route":       "POST /api/v1/chat",  // Constant.
  "model":       "claude-opus-4-8",    // Resolved model.
  "iterations":  3,                    // Total Anthropic calls made.
  "tools_called": ["search", "get_node"], // Tool NAMES only, in call order. Empty list if none.
  "tokens_in":   1234,                 // Sum of input_tokens across iterations.
  "tokens_out":  567,                  // Sum of output_tokens across iterations.
  "stop_reason": "end_turn",           // One of: end_turn | max_tokens | stop_sequence |
                                       //         max_iterations | turn_timeout | cancelled |
                                       //         provider_error | internal_error
  "latency_ms":  3210,                 // Wall-clock from first llm_start to terminal frame.
  "aborted":     false                 // true when stop_reason in {cancelled, turn_timeout}.
}
```

NEVER logged: `messages[i].content`, `args_summary` raw values, tool result bodies, the system prompt, the marker token. Tool ARG inputs are also never logged.

Counters (incremented at the same point):

- `chat_turn_total{stop_reason}` -- counter, one increment per terminal frame.
- `chat_turn_latency_ms` -- histogram, observation = `latency_ms`.
- `chat_turn_iterations` -- histogram, observation = `iterations`.
- `chat_output_guard_drops_total{marker_version}` -- counter, incremented per BR-20 drop.

---

## 10. Error Catalog (new codes introduced by this domain)

Two new business codes are introduced. They live in `backend/src/modules/chat/service/errors.ts`, alongside the standard mapper that lifts them to the canonical `ErrorEnvelope` consumed by `backend/src/shared/error-mapping.ts`.

| Code | HTTP / Channel | Class | When |
|------|----------------|-------|------|
| `BUSINESS_CHAT_DISABLED` | 503 (pre-stream REST envelope only) | `ChatDisabledError` | `env.CHAT_ENABLED === false` (BR-14). |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503 (pre-stream) OR SSE `error` frame (in-stream) | `ChatProviderUnavailableError` | Pre-stream: Anthropic factory throws (BR-21). In-stream: SDK error / `messages.stream()` rejection (BR-11). |

Reused codes (already registered in the global catalog — no new code needed):

- `VALIDATION_INVALID_FORMAT` -- pre-stream body parse failures (BR-01..BR-04); in-stream defensive guard for unknown tool name (BR-10, fed back to the model, not emitted on SSE).
- `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` -- inherited from `requireNeonAuth` preHandler.
- `SYSTEM_INTERNAL_ERROR` -- in-stream unhandled exception in the agentic loop (BR-23).
- `SYSTEM_SERVICE_UNAVAILABLE` -- in-loop tool timeout (BR-17), fed back to the model as the failed tool_result body; NEVER emitted as a terminal SSE `error` frame.

> Action item for implementation: add the two new codes to whatever error-code
> registry exists in the project. Today the catalog is per-module (see
> `modules/*/service/errors.ts`); `modules/chat/service/errors.ts` is the home
> for these two and the only place that needs to register them.

---

## 11. Performance Budgets

Per CLAUDE.md "Performance Budgets / Backend", chat falls under the same "tetos de sanidade" regime as ingestion (LLM-bound). Concrete v1 targets:

- **Pre-stream prelude p95:** < 50 ms (Zod parse + kill-switch check + factory cache hit + `reply.hijack()`).
- **Time-to-first-byte (first `llm_start` frame) p95:** < 800 ms after the request hits the route (dominated by the first Anthropic stream `accept` round-trip).
- **Per-turn wall-clock budget:** `TURN_TIMEOUT_MS` (default 90s). Typical conversational turns complete in 2-15s.
- **Per-tool-call latency:** delegated to the existing per-tool budgets (`search < 500ms`, `traverse <= depth 3 < 1s`, `get_* < 200ms` per CLAUDE.md).
- **Memory:** the in-loop history grows by one `assistant(tool_use)` + one `user(tool_result)` block per iteration. With `MAX_ITERATIONS=8` and `TOOL_RESULT_MAX_CHARS=8000`, the worst-case in-loop history payload is ~64 kB on top of the client-supplied history.

---

## 12. Out of Scope

- Conversation persistence (`chat_conversation` / `chat_message` tables, migration, history retrieval endpoint).
- Idempotency by `Idempotency-Key` header (no replay protection in v1).
- Cost / token accounting at the API level (only pino observability).
- Title / summary background jobs.
- Write or curation tools in the agentic loop (read-only by design).
- Embeddings-based retrieval (permanent non-goal, v7 §20.1 / ADR A24).
- Heavy regex-based input scrubbing / prompt-injection middleware (single-owner; minimal output guard only, BR-20).
- Rate-limit / backpressure middleware (single-owner).
- Per-call Anthropic timeout override (relies on `defaultAnthropicFactory` SDK timeout at v1; per-turn wall-clock is the binding budget).
- Plumbing `AbortSignal` into the underlying SQL of timed-out tool calls (BR-17 limitation).
- Pre-flight model allow-list (any string accepted; unknown model -> mid-stream provider error).
- Frontend / SPA components (BACKEND-ONLY; no `front/` work).

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-19 | Back Spec Agent | initial | Initial version — new `chat` backend spec. Stateless v1, READ-ONLY agentic loop over the 13 `query`-toolset tools. | -- |
| 1.1.0 | 2026-06-19 | Back Spec Agent | refine | Added §1.1 file layout, §1.2 `ChatAgentService` contract (`runTurn -> AsyncIterable<ChatEvent>`); added BR-23 (pre-stream vs in-stream error boundary) and BR-24 (one terminal frame per turn) as explicit invariants; added §8 env table, §9 pino turn record schema, §10 error catalog (introduces `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` -- live in `modules/chat/service/errors.ts`), §11 performance budgets. Reinforced concrete cross-references to `extraction.service.ts` lines 177-198 (`defaultAnthropicFactory`), `sdk-http-transport.ts` lines 172-173 (`reply.hijack()` pattern), `mcp/server.ts` line 98 (`McpServer.getTool`), `withReadOnly` helpers in routes files. No business semantics changed. | -- |
| 1.1.1 | 2026-06-19 | Back Spec Agent | patch | Corrected `VALIDATION_INVALID_FORMAT` pre-stream HTTP status from 400 to 422 across BR-01..BR-04 and the Validation library stack row, aligning with the global error-code catalog (`.claude/skills/u-spec-globals/error-codes.md`) and all other domains. No business semantics changed; contract-alignment fix flagged by the spec validator. | REPAIR-1 |
