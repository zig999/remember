# Chat -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 (Neon) — owns 3 tables (`chat_conversation`, `chat_message`, `chat_tool_call`) + 1 enum (`chat_message_role`) via migration `0004_chat_persistence.sql` | Version: 2.1.0 | Status: draft | Layer: permanent
> Business spec: `../chat.spec.md` (v2.0.0)
> REST contract: `../openapi.yaml` (v2.1.0)
> Migration spec artifact: `./0004_chat_persistence.sql`
> Normative deviation: this domain is an ADDITIVE deviation from `/remember-modelagem-v7.md` (which does not specify a chat surface). The inegociable rule of v7 §2 holds: the LLM never reaches the database directly; every tool opens its own short `BEGIN READ ONLY` transaction. The chat domain itself OWNS its own writes (conversation CRUD + message persistence) — those run via `withTransaction` on the BFF, NOT via tools. The v7 §11 compliance flow does NOT walk into chat tables (BR-37 of `.spec.md` / §6 of `.spec.md` "Compliance §11 note"). Reconcile via a future `/u-improve` pass that amends v7 §2 with the stateful chat transport.
>
> **v2.1 additive deviation (Chat-Graph projection).** The `sendMessage` SSE stream now emits a 7th frame, `graph_delta`, ONLY after a `tool_result` whose tool is one of the four graph-producing query tools (`traverse`, `get_node`, `list_nodes`, `search`). The frame carries a normalized subgraph projection (`{source_tool, nodes[], links[]}`) consumed by the SPA `GraphSpace`. The projection is route-owned (synthesised AFTER the `tool_result` event yielded by the agentic loop) — the agent service does NOT see this frame and the LLM is not aware of it. Frame is OBSERVATIONAL only — it carries no instructions and no new data beyond what the `tool_result` already produced. See BR-41. The `search` projector hydrates `items(kind=node).id` via `findNodesByIds` (one batched read; §4.1 G-A) to supply `node_type` + `canonical_name` — fields the `search` envelope itself does not carry. Source plan: `temp/chat-graphspace-plan.md` (rev. 2026-06-21) §4.1 / §9 Fase B / AC-B.7.

---

## 1. Stack and Patterns

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves the consolidated `openapi.root.yaml`; this domain adds a `$ref` to `domains/chat/openapi.yaml`) | CLAUDE.md default |
| Streaming transport | Server-Sent Events on `POST /api/v1/conversations/:id/messages`. Implementation: `reply.hijack()` followed by direct writes to `reply.raw` (the same Fastify-bridge pattern used by the MCP SDK transport `backend/src/mcp/sdk-http-transport.ts` at lines 172-173 — `reply.hijack()` + write to `reply.raw`). Required response headers set BEFORE the first write: `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`. Each frame is written as `event: <name>\ndata: <JSON>\n\n` (one event per frame, no batching — BR-08). | New (this domain). |
| MCP integration | This domain does NOT register tools on the MCP server. It CONSUMES the in-process `McpServer` registry (`backend/src/mcp/server.ts` — `McpServer.getTool(toolset, name)`) as a read-only catalog. The registry was already populated at boot by `query-retrieval` and `knowledge-graph` (`knowledge-graph.back.md` BR-23). `buildChatToolCatalog(mcp)` is resolved lazily on the first chat request and the resolved catalog is cached for the process lifetime (BR-05). `registerChatRoutes(scoped, deps)` is mounted on the `/api/v1` scope ONLY when the resolved catalog is non-empty (`catalog !== undefined`); otherwise the route family is not registered (defensive guard — a misconfigured boot must not silently expose an empty chat surface). | New (this domain). |
| ORM | None — raw `pg` parameterized queries (A6, §2.2). The chat domain OWNS three tables (see §2) and reads/writes them through a dedicated repository layer (`chat.repository.ts`). Tool calls (issued by the agentic loop into other domains) still go through the existing `*Service.*` layer of `query-retrieval` / `knowledge-graph`. | CLAUDE.md default |
| Migration strategy | ONE migration: `migrations/0004_chat_persistence.sql`. The spec artifact lives at `docs/specs/domains/chat/back/0004_chat_persistence.sql` — dev team copies/adapts under CLAUDE.md "Safety Rule — Database Changes Require Explicit Approval". The migration is additive (no edits to existing tables) and uses the existing `set_updated_at()` trigger function defined in `migrations/0001_init.sql` line 108 — DO NOT redefine. | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/chat/`. Layers: `routes` (Fastify handlers + Zod schemas, SSE framing) -> `service` (agentic loop, conversation service, context builder, distillation) -> `repository` (raw `pg` queries on chat tables). The agentic loop consumes the resolved tool catalog and the Anthropic client factory. | Aligned with CLAUDE.md `folder_structure: modules`. |
| Validation library | Zod v4. Body schemas mirror the OpenAPI v2.0.0 components: `CreateConversationRequest`, `UpdateConversationRequest`, `SendMessageRequest`. Header validators: `Idempotency-Key` is `z.string().uuid()` (BR-26 of `.spec.md`). Failure -> 422 BEFORE the SSE is opened (BR-23). | CLAUDE.md default |
| Auth | `requireNeonAuth` preHandler inherited from the `/api/v1` scope (CLAUDE.md "Authentication"). No additional auth check inside chat handlers. Owner-only model (v7 §2.3 / ADR A20) holds — no `user_id` column on any chat table. In development the carve-out `LOCAL_OPERATOR_TOKEN` works transparently because it is enforced by the inherited preHandler. | CLAUDE.md default |
| Logging | `pino` structured JSON. One INFO record per completed turn (`event: "chat.turn"`) with fields per BR-19 of `.spec.md` and §9 below. NEVER logs `messages[i].content`, raw tool inputs, raw tool result bodies, or `args_summary` raw values. Distillation jobs log `chat.summary_refresh_*` / `chat.title_distillation_*` at INFO on success and WARN on failure (BR-33 / BR-34). DEBUG level may sample structural diagnostics but never PII. | CLAUDE.md default |
| Observability | `observability_required: true`. Counters: `chat_turn_total{stop_reason}`, `chat_turn_idempotent_replay_total`, `chat_turn_in_progress_conflict_total`, `chat_summary_refresh_total{ok}`, `chat_title_distillation_total{ok}`. Histograms: `chat_turn_latency_ms`, `chat_turn_iterations`, `chat_summary_refresh_latency_ms`, `chat_title_distillation_latency_ms`. Reuses the pino transport (parallel to ingestion run metrics). | CLAUDE.md default |
| Transaction policy | Three distinct transaction shapes inside the chat domain. (i) Owned WRITES on chat tables (conversation CRUD, user-row insert, assistant-row insert, tool-call inserts) run via `withTransaction(pool, ...)` — the SAME helper already exported by `curation/service/transaction.ts` line 10. (ii) Owned READS on chat tables (`getConversation`, `listConversations`, `listMessages`, `getConversationUsage`, context-builder reads) run via `withReadOnly(pool, ...)` — line 32 of the same file. (iii) Tool invocations issued by the agentic loop are still v7 §2 inegociable: each tool opens its OWN short `BEGIN READ ONLY` inside its own service code (existing behaviour preserved from v1). The chat route never bundles a tool call into one of its own transactions — the transactional boundaries do NOT overlap. | New (this domain). |
| Concurrency | (a) Multiple concurrent chat turns share the same `McpServer` registry instance and a single Anthropic client (instantiated once at first request). (b) Tool calls INSIDE a single turn are sequential (`tool_choice.disable_parallel_tool_use = true`, BR-22 of `.spec.md`). (c) At most ONE in-flight turn per conversation is enforced by an in-process registry (`Map<conversation_id, AbortController>`), keyed by conversation id (BR-28 of `.spec.md`). The registry is process-local; v1 is single-instance BFF — see §7 constraint "Multi-instance BFF". (d) Distillation jobs (BR-33, BR-34) are fire-and-forget Promise chains scheduled AFTER the HTTP response has terminated; they hold no shared lock — overlap is acceptable (idempotent `UPDATE`). | New (this domain). |
| Time source | `Date.now()` for the wall-clock budgets (`TURN_TIMEOUT_MS`, `TOOL_TIMEOUT_MS`) and the per-turn `latency_ms`. SQL `now()` for `created_at` / `updated_at` defaults — server-clocked. No domain-owned use of `canonical_date` / `canonical_number` (those belong to v7 §6). | CLAUDE.md default |
| External integration | Anthropic Messages API (streaming). Reuses the `defaultAnthropicFactory` pattern from `modules/ingestion/service/extraction.service.ts` (lines 177-198): `type AnthropicFactory = (apiKey: string) => AnthropicLike` with default constructing the SDK client from `env.ANTHROPIC_API_KEY` using `timeout: 5 * 60 * 1000` and `maxRetries: 2`. TWO models used: the turn model `env.CHAT_MODEL` (default `claude-opus-4-8`) and the utility model `env.CHAT_UTILITY_MODEL` (default `claude-haiku-4-5`) for distillation jobs. Tool catalog: 13 read-only tools resolved via `mcp.getTool('query', name)` (BR-05). | New (this domain). |
| Testing | Vitest unit tests on (i) Zod schemas for the 4 body shapes + the `Idempotency-Key` header (BR-26), (ii) `conversation.service` CRUD + RESOURCE_NOT_FOUND mapping (BR-22), (iii) `context-builder.ts` reconstruction (BR-31: system prompt + summary block + recent window), (iv) `chat.repository` idempotency partial-index conflict path (BR-27), (v) `chat-agent.service.runTurn` agentic loop against a stub Anthropic client covering UC-02..UC-06 + UC-07 replay path, (vi) the per-turn registry that enforces BR-28, (vii) the persistence-sequencing sequencing in `chat.routes.ts` (user row BEFORE hijack, assistant row AFTER terminal frame, tool-call rows during the loop — BR-29 / BR-32), (viii) `distillation.service.ts` fire-and-forget rolling-summary + title jobs (BR-33 / BR-34) using stub utility model + assertion that the HTTP response is not awaiting the job, (ix) cascade behaviour of `deleteConversation` (BR-37), (x) `cancelTurn` registry interaction (BR-38), (xi) cursor pagination on `listConversations` (BR-35) + `before` pagination on `listMessages` (BR-39), (xii) compliance §11 exclusion is a NEGATIVE TEST: the compliance walker does not visit chat tables (sentinel row survives a `compliance_delete`). No acceptance scenario from v7 §17 maps to this domain (deviation). | CLAUDE.md default |

### 1.1 File layout

```
backend/src/modules/chat/
  routes/
    chat.routes.ts             # registerChatRoutes(scoped, deps): mounts the
                               #   9 endpoints of openapi.yaml v2.0.0.
                               #   - createConversation       (POST /conversations)
                               #   - listConversations        (GET  /conversations)
                               #   - getConversation          (GET  /conversations/:id)
                               #   - updateConversation       (PATCH /conversations/:id)
                               #   - deleteConversation       (DELETE /conversations/:id)
                               #   - sendMessage              (POST /conversations/:id/messages)
                               #   - listMessages             (GET  /conversations/:id/messages)
                               #   - getConversationUsage     (GET  /conversations/:id/usage)
                               #   - cancelTurn               (POST /conversations/:id/cancel)
                               #   `sendMessage` owns the SSE handler:
                               #     - Parses body + Idempotency-Key (Zod).
                               #     - Short-circuits on env.CHAT_ENABLED===false (BR-14).
                               #     - Invokes anthropicFactory; on throw -> 503 (BR-21).
                               #     - Loads conversation; 404/409 pre-stream checks
                               #       (BR-22, BR-25, BR-28, BR-27 — in this order).
                               #     - Inserts the user chat_message row (BR-29).
                               #     - Calls context-builder to assemble messages[]
                               #       (BR-31).
                               #     - Registers the AbortController in the
                               #       in-process turn registry (BR-28).
                               #     - reply.hijack() + writes SSE headers.
                               #     - Wires req.raw 'close' -> AbortController.abort() (BR-12).
                               #     - Consumes the AsyncIterable<ChatEvent> from
                               #       chatAgentService.runTurn(...) and writes one
                               #       `event: ...\ndata: ...\n\n` frame per ChatEvent.
                               #       Persists chat_tool_call rows as tool_result
                               #       events fire (BR-32).
                               #     - On terminal frame, deregisters the abort
                               #       controller and inserts the assistant
                               #       chat_message row (BR-29).
                               #     - Schedules distillation.service.maybeRefreshSummary()
                               #       and .maybeDistillTitle() fire-and-forget AFTER
                               #       the HTTP response has terminated (BR-33, BR-34).
                               #     - Emits the pino INFO turn record (BR-19).
    chat.schemas.ts            # Zod request schemas:
                               #   - CreateConversationRequest
                               #   - UpdateConversationRequest (with .refine: at
                               #     least one of title|archived_at present, BR-36)
                               #   - SendMessageRequest (content + optional model)
                               #   - ListConversationsQuery (limit, cursor,
                               #     include_archived; BR-35)
                               #   - ListMessagesQuery (limit, before; BR-39)
                               #   - IdempotencyKeyHeader (z.string().uuid(); BR-26)
                               #   - ConversationIdParam (z.string().uuid())
  repository/
    chat.repository.ts         # Raw pg parameterized queries on the 3 owned tables.
                               #   Functions are PoolClient-based so callers can
                               #   compose them inside withTransaction / withReadOnly.
                               #   See §3 for the full surface.
  service/
    conversation.service.ts    # Pure-business orchestration for the CRUD
                               #   endpoints. createConversation,
                               #   listConversations (cursor decode/encode,
                               #   BR-35), getConversation (RESOURCE_NOT_FOUND
                               #   mapping, BR-22), updateConversation
                               #   (PATCH semantics, BR-36), deleteConversation
                               #   (cascade, BR-37), getConversationUsage
                               #   (aggregate, BR-40). All run under
                               #   withTransaction OR withReadOnly as appropriate.
                               #   Absent conversation -> ConversationNotFoundError
                               #   (mapped to 404 RESOURCE_NOT_FOUND in errors.ts).
    context-builder.ts         # buildModelContext({pool, conversation, recentLimit}):
                               #   Reconstructs the Anthropic messages[] from the DB
                               #   (BR-31):
                               #     1. system prompt (selectChatPromptModule).
                               #     2. (optional) synthetic user block carrying the
                               #        rolling-summary header + summary_rolling,
                               #        ONLY when summary_rolling IS NOT NULL.
                               #     3. last CHAT_RECENT_WINDOW chat_message rows
                               #        on the conversation, ordered ASC.
                               #   Returns { system: string, messages: AnthropicMessage[] }.
                               #   Reads via repository.listRecentMessages under
                               #   withReadOnly. NEVER includes the row that has not
                               #   been inserted yet — by sequencing, the user row
                               #   inserted in step 6 of UC-02 IS the last item of
                               #   the result.
    distillation.service.ts    # Fire-and-forget IN-PROCESS distillation. NO QUEUE.
                               #   maybeRefreshSummary({pool, conversationId,
                               #                        anthropic, env, logger}):
                               #     - Reads the user-turn count under withReadOnly.
                               #     - If count > CHAT_SUMMARY_AFTER_TURNS AND
                               #       env.CHAT_SUMMARY_ENABLED, calls
                               #       anthropic.messages.create({model:
                               #       env.CHAT_UTILITY_MODEL, stream: false,
                               #       system: <summary-prompt>, messages: <older
                               #       slice excluding the recent window>}).
                               #     - UPDATE chat_conversation.summary_rolling
                               #       (under withTransaction); also bumps
                               #       updated_at via the trigger.
                               #     - Errors logged WARN chat.summary_refresh_failure;
                               #       NEVER thrown to the caller.
                               #   maybeDistillTitle({pool, conversationId,
                               #                      anthropic, env, logger}):
                               #     - Reads conversation; if title IS NOT NULL,
                               #       early return.
                               #     - If env.CHAT_TITLE_ENABLED, reads the first
                               #       user+assistant pair.
                               #     - Calls anthropic.messages.create(non-stream)
                               #       on env.CHAT_UTILITY_MODEL.
                               #     - On result: trims to <= 80 chars; if empty
                               #       or > 80 after trim, silently drop (BR-34).
                               #     - UPDATE chat_conversation.title.
                               #     - Errors logged WARN chat.title_distillation_failure.
                               #   BOTH functions return void Promise and the routes
                               #   layer schedules them as:
                               #     distillationService.maybeRefreshSummary(...)
                               #       .catch(err => logger.warn({err}, "chat.summary_refresh_failure"));
                               #   i.e. NO `await` from the request thread.
    chat-agent.service.ts      # ChatAgentService factory returning { runTurn }.
                               #   runTurn(input): AsyncIterable<ChatEvent>.
                               #   Owns: the agentic loop, iteration counter,
                               #   turn-timeout timer, abort propagation, tool
                               #   dispatch, tool-result truncation (BR-13),
                               #   args_summary builder (BR-09), output guard
                               #   (BR-20), token accounting. Receives the
                               #   pre-built messages[] and system prompt from
                               #   context-builder (the agent service does NOT
                               #   read the DB itself — separation of concerns).
                               #   Yields ChatEvent.tool_result with metadata
                               #   that the route handler consumes to persist
                               #   chat_tool_call rows (BR-32). v1 added a new
                               #   field to ChatEvent.tool_result: `{ arguments,
                               #   result, is_error, error_message, duration_ms }`
                               #   — see §1.2.
    tool-catalog.ts            # buildChatToolCatalog(mcp): resolves the 13 names
                               #   once and memoizes in module scope.
                               #   Returns ResolvedChatToolCatalog | undefined.
    args-summary.ts            # Per-tool switch -> short, redacted, <=200 chars.
    truncate-tool-result.ts    # Unicode-codepoint-bounded JSON truncation +
                               #   "\n[truncated: <n> chars]" marker (BR-13).
                               #   Applied ONLY to the body fed back into the
                               #   next Anthropic iteration. The persisted
                               #   chat_tool_call.result column carries the FULL
                               #   untruncated body (BR-32).
    graph-normalizer.ts        # v2.1 (NEW): pure projection from a graph-
                               #   producing tool_result envelope into
                               #   GraphDeltaWire ({source_tool, nodes[],
                               #   links[]}). Dispatches by tool name:
                               #     - traverse / get_node / list_nodes: direct
                               #       passthrough + is_temporal resolved via
                               #       the catalog snapshot (fallback false on
                               #       miss).
                               #     - search: hydrates items(kind=node).id via
                               #       findNodesByIds (ONE batched read, no N+1)
                               #       to supply node_type + canonical_name —
                               #       absent from the search envelope itself.
                               #       Fragment/link items are NOT projected.
                               #   Returns null for non-graph tools. Consumed
                               #   by the route drain loop (BR-41); NEVER by
                               #   the agent service. See `back-spec` boundary
                               #   widening note below.
    output-guard.ts            # System-prompt marker scrubber (BR-20).
    turn-registry.ts           # In-process Map<conversation_id, AbortController>.
                               #   register(convId, controller), get(convId),
                               #   release(convId). Used by sendMessage (register
                               #   on entry, release on terminal frame) and by
                               #   cancelTurn (lookup + abort). Single-process
                               #   only — BR-28 constraint.
    errors.ts                  # ChatDisabledError, ChatProviderUnavailableError,
                               #   ConversationNotFoundError,
                               #   ConversationArchivedError,
                               #   TurnInProgressError,
                               #   IdempotencyMismatchError + mapping to the
                               #   standard ErrorEnvelope (consumed by
                               #   error-mapping.ts at the route edge).
    types.ts                   # ChatEvent (discriminated union), ChatRunInput,
                               #   ChatRunStats (tokens_in/out, iterations,
                               #   tools_called[], stop_reason), AnthropicFactory
                               #   re-export from ingestion or a local copy.
                               #   ToolCallRecord (the per-call payload yielded
                               #   alongside ChatEvent.tool_result for
                               #   chat_tool_call persistence — BR-32).
  prompts/
    index.ts                   # selectChatPromptModule(version): resolves the
                               #   pt-BR system prompt module (BR-18). Parallel
                               #   pattern to modules/ingestion/prompts/index.ts.
                               #   Unknown version -> UnknownChatPromptVersionError
                               #   (boot-time fast failure).
                               #   Also exports selectSummaryPromptModule() and
                               #   selectTitlePromptModule() — short utility
                               #   prompts for the distillation jobs (BR-33, BR-34).
    v1.ts                      # Initial pt-BR system prompt + opaque marker
                               #   token planted at the head (BR-20). Also
                               #   carries the summary and title utility prompts.
```

> The boundary is enforced by import direction: `routes/` imports `service/`
> and `repository/`; `service/` imports `repository/` and `prompts/`. Nothing
> inside `chat/` imports from `query-retrieval` directly. The only allowed
> `knowledge-graph` imports are READ-ONLY: the `CatalogSnapshot` type and the
> `findNodesByIds` repository helper — both required by `graph-normalizer.ts`
> (v2.1, BR-41) for catalog-driven `is_temporal` resolution and search
> hydration. The `McpServer` registry (passed via `deps`) and the resolved
> `McpTool` references it returns remain the only coupling to other domains
> for tool dispatch. The chat repository imports `pg` (PoolClient) only; it
> never invokes higher-level services.

### 1.2 ChatAgentService contract

```ts
// service/types.ts (illustrative — back-spec contract, NOT implementation)
export type ChatEvent =
  | { type: "llm_start";   iteration: number }
  | { type: "text_delta";  delta: string }
  | { type: "tool_start";  tool: string; args_summary: string }
  | { type: "tool_result"; tool: string; ok: boolean;
                            // NEW in v2: full per-call payload for BR-32 persistence.
                            arguments: unknown; result: unknown | null;
                            is_error: boolean; error_message: string | null;
                            duration_ms: number }
  // NEW in v2.1 — route-owned synthesis after a graph-producing tool_result
  // (BR-41). The agent service NEVER yields this variant; the route handler
  // synthesises it in-place from the prior `tool_result.result` and writes
  // it through the same `projectSseFrame` switch so the union stays
  // exhaustively typed. Persistence: NONE — graph_delta is NOT persisted
  // to chat_tool_call (that row is owned by the originating tool_result;
  // BR-32 is the audit trail).
  | { type: "graph_delta"; source_tool: string;
                           nodes: ReadonlyArray<GraphNodeWire>;
                           links: ReadonlyArray<GraphLinkWire> }
  | { type: "done";        stop_reason: DoneStopReason; model: string;
                           tokens_in: number; tokens_out: number;
                           // NEW in v2: assistant content blocks for BR-29 persistence.
                           content: ReadonlyArray<unknown> }
  | { type: "error";       code: string; message: string;
                           // NEW in v2: still need content + counts for the
                           // synthetic-stop-reason assistant row.
                           content: ReadonlyArray<unknown>;
                           tokens_in: number; tokens_out: number;
                           synthetic_stop_reason: "provider_error" | "internal_error" };

// NEW in v2.1 — wire shape of nodes/links carried inside the `graph_delta`
// SSE frame. snake_case to match the rest of the SSE envelope (BR-41 §4.1
// of `temp/chat-graphspace-plan.md`).
export interface GraphNodeWire {
  readonly id: string;                       // UUID
  readonly node_type: string;                // catalog slug ("person", "organization", …)
  readonly canonical_name: string;
  readonly status: "active" | "needs_review" | "merged" | "deleted";
}
export interface GraphLinkWire {
  readonly id: string;
  readonly source_node_id: string;
  readonly target_node_id: string;
  readonly link_type: string;                // catalog slug
  readonly is_temporal: boolean;             // resolved via the catalog snapshot
  readonly is_in_effect?: boolean;
  readonly status?: string;                  // assertion_status
  readonly flags?: ReadonlyArray<"uncertain" | "disputed" | "low_confidence">;
}

export type DoneStopReason =
  | "end_turn" | "max_tokens" | "stop_sequence"
  | "max_iterations" | "turn_timeout" | "cancelled";

export interface ChatRunInput {
  readonly system: string;                        // From context-builder.
  readonly messages: ReadonlyArray<AnthropicMessage>; // From context-builder.
  readonly model: string;                         // Resolved (override OR env.CHAT_MODEL).
  readonly abortSignal: AbortSignal;              // Bound to req.raw 'close' AND cancelTurn (BR-12, BR-38).
}

export interface ChatAgentService {
  // Single entry point. Yields ChatEvents in the order defined by §5.2 of
  // `.spec.md`. Always terminates with exactly one `done` OR `error` event.
  // Caller (route handler) is responsible for serialising each ChatEvent as
  // one SSE frame, for persisting tool_result events as chat_tool_call rows
  // (BR-32), and for writing the assistant chat_message row + final pino
  // record after the iterator returns/throws (BR-29 / BR-19).
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

The `AsyncIterable<ChatEvent>` contract decouples the route handler (SSE
framing, chat-table persistence, pino) from the loop (Anthropic streaming,
tool dispatch, ceilings). Tests drive `runTurn` directly against a stub
Anthropic client; route-level integration tests drive the full SSE wire
including DB writes.

---

## 2. Data Model

> **This domain owns 3 tables and 1 enum** introduced by migration
> `0004_chat_persistence.sql` (spec artifact: `./0004_chat_persistence.sql`).
> NO `user_id` column on any of the three — single-owner (v7 §2.3 / ADR A20).
> Chat tables are OUTSIDE the v7 §11 compliance flow — see `.spec.md` §6
> "Compliance §11 note" and BR-37.

### 2.1 Enum `chat_message_role`

```sql
CREATE TYPE chat_message_role AS ENUM ('user', 'assistant');
```

Only two roles are persisted (BR-02 of `.spec.md`). The transient
`assistant(tool_use)` / `user(tool_result)` blocks the loop synthesises during
an iteration are NEVER persisted as their own `chat_message` rows — they live
only inside the in-loop Anthropic history.

### 2.2 Table `chat_conversation` (aggregate root)

```sql
CREATE TABLE chat_conversation (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NULL,            -- Length 1..200 enforced at BFF; nullable until distillation runs (BR-34).
  summary_rolling text        NULL,            -- Rolling summary (BR-33). NULL until policy fires OR when CHAT_SUMMARY_ENABLED=false.
  archived_at     timestamptz NULL,            -- NULL = active; non-NULL = archived (BR-25).
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_chat_conversation_set_updated_at
  BEFORE UPDATE ON chat_conversation
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();   -- Defined in 0001_init.sql line 108.
```

**Indexes**:

| Index | Columns | Justification |
|-------|---------|---------------|
| `chat_conversation_pkey` | `(id)` | PK. Resolves every `:id` path lookup (BR-22 of `.spec.md`). |
| `idx_chat_conversation_created_at_id_desc` | `(created_at DESC, id DESC)` | `listConversations` cursor pagination (BR-35 of `.spec.md`). The composite DESC matches the query plan: `WHERE (created_at, id) < (cursor_ts, cursor_id) ORDER BY created_at DESC, id DESC LIMIT n`. `id` breaks ties deterministically. |

### 2.3 Table `chat_message`

```sql
CREATE TABLE chat_message (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid              NOT NULL REFERENCES chat_conversation(id) ON DELETE CASCADE,
  role            chat_message_role NOT NULL,
  content         jsonb             NOT NULL,    -- Anthropic-style content blocks (`[{type:"text", text:"..."}]` in v1).
  stop_reason     text              NULL,        -- Assistant rows only. Includes synthetic codes (`provider_error`, `internal_error`).
  idempotency_key uuid              NULL,        -- Non-null on user rows; null on assistant rows (BR-26 of `.spec.md`).
  model           text              NULL,        -- Resolved Anthropic model id.
  tokens_in       int               NULL,        -- Assistant rows only.
  tokens_out      int               NULL,        -- Assistant rows only.
  latency_ms      int               NULL,        -- Assistant rows only — first llm_start to terminal frame.
  created_at      timestamptz       NOT NULL DEFAULT now()
);
```

**Indexes**:

| Index | Columns | Justification |
|-------|---------|---------------|
| `chat_message_pkey` | `(id)` | PK. |
| `idx_chat_message_conversation_created_at` | `(conversation_id, created_at)` | (a) Context reconstruction reads the last N messages of one conversation in chronological order (BR-31). (b) `listMessages` walks the same index forward + backward (BR-39 — `before` filter). |
| `idx_chat_message_idempotency` (UNIQUE PARTIAL, `WHERE idempotency_key IS NOT NULL`) | `(conversation_id, idempotency_key)` | Enforces "at most one user row per (conversation_id, idempotency_key)" — the core of BR-27 of `.spec.md`. The PARTIAL clause keeps assistant rows (NULL key) out of the uniqueness check. Lookups on this index drive both the idempotent-replay path (UC-07) and the mismatch detection (`BUSINESS_IDEMPOTENCY_MISMATCH`). |

**Relationships**:

- `conversation_id -> chat_conversation(id) ON DELETE CASCADE` — cascade delete (BR-37 of `.spec.md`). No tombstone; permanent.

### 2.4 Table `chat_tool_call`

```sql
CREATE TABLE chat_tool_call (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES chat_conversation(id) ON DELETE CASCADE,
  message_id      uuid        NULL     REFERENCES chat_message(id)      ON DELETE SET NULL,
  tool_name       text        NOT NULL,           -- One of the 13 `query`-toolset names (BR-05 of `.spec.md`).
  arguments       jsonb       NOT NULL,           -- Full input — NOT truncated.
  result          jsonb       NULL,               -- Full success body — NOT truncated. NULL on error.
  is_error        boolean     NOT NULL DEFAULT false,
  error_message   text        NULL,               -- Tool envelope `error.message`. NULL on success.
  duration_ms     int         NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**Indexes**:

| Index | Columns | Justification |
|-------|---------|---------------|
| `chat_tool_call_pkey` | `(id)` | PK. |
| `idx_chat_tool_call_conversation` | `(conversation_id)` | `getConversationUsage` counts tool calls by conversation (BR-40 of `.spec.md`). Also serves any per-conversation audit dump. |

**Relationships**:

- `conversation_id -> chat_conversation(id) ON DELETE CASCADE` — cascade delete (BR-37).
- `message_id -> chat_message(id) ON DELETE SET NULL` — the assistant row id is only known AFTER the terminal SSE frame (BR-29). The route may either insert tool-call rows with `message_id = NULL` during the loop and patch them on assistant-row insert, OR batch-insert them after the assistant row exists. `ON DELETE SET NULL` keeps the audit trail intact even if the assistant row is later deleted in isolation.

> **No FK from `message_id` to a specific role.** A `chat_tool_call` row's
> `message_id` always points to an `assistant` row (tool calls only happen
> inside the agentic loop that produces an assistant message). The role check
> is enforced at the BFF layer; the DB does not add a check constraint because
> the join-and-check overhead is not justified at v1 scale.

### 2.5 Compliance §11 stance (intentional exclusion)

The chat tables carry NO `status` / `superseded_at` tombstone columns. The
v7 §11 `compliance_delete` walker does NOT visit `chat_conversation`,
`chat_message`, or `chat_tool_call`. Justification (`.spec.md` §6 / BR-37):
chat stores SYNTHESISED conversations between the Owner and the model;
it does NOT store facts anchored to `raw_information`. Any traceable fact in a
chat answer remains anchored to its source `raw_information` row through the
tool-result `Provenance`, which the `query` tools surface on demand — the chat
row itself carries no first-class facts.

The Owner's means of erasing chat content is `DELETE
/api/v1/conversations/:id`, which cascades via `ON DELETE CASCADE` (BR-37) and
is permanent. Reconcile in a future revision if compliance posture changes.

---

## 3. Repository Layer (`chat.repository.ts`)

> The repository is the ONLY surface that writes raw SQL against the chat
> tables. Every function takes a `PoolClient` so callers can compose them
> inside `withTransaction(pool, ...)` or `withReadOnly(pool, ...)` (curation
> helper). The repository owns NO transaction boundary itself.

```ts
// repository/chat.repository.ts (illustrative — back-spec contract)

export interface ChatRepository {
  // ---- Conversation CRUD ----------------------------------------------------
  insertConversation(
    client: PoolClient,
    input: { title: string | null }
  ): Promise<ConversationRow>;

  getConversationById(
    client: PoolClient, id: string
  ): Promise<ConversationRow | null>;

  // BR-35: cursor-paginated DESC list. `cursor` is the (created_at, id) pair
  // of the previous page's last row. `includeArchived=false` filters out
  // `archived_at IS NOT NULL` rows.
  listConversations(
    client: PoolClient,
    input: { limit: number; cursor: { createdAt: string; id: string } | null; includeArchived: boolean }
  ): Promise<{ items: ConversationRow[]; hasMore: boolean }>;

  // BR-36: PATCH with at-least-one-field; `title` and `archived_at` are both
  // optional. `undefined` means "do not change", `null` means "set to NULL".
  // Returns null when the row does not exist.
  updateConversation(
    client: PoolClient,
    id: string,
    patch: { title?: string | null; archived_at?: string | null }
  ): Promise<ConversationRow | null>;

  // BR-37: cascade. Returns the number of conversation rows deleted (0 or 1).
  deleteConversation(client: PoolClient, id: string): Promise<number>;

  // ---- Conversation summary maintenance -------------------------------------
  // BR-33: rolling summary refresh. Used by distillation.service.
  updateSummaryRolling(
    client: PoolClient, id: string, summary: string
  ): Promise<void>;

  // BR-34: title distillation. Idempotent: only sets when title IS NULL.
  // Returns the new title when written, NULL when skipped.
  setTitleIfNull(
    client: PoolClient, id: string, title: string
  ): Promise<string | null>;

  // ---- Message persistence --------------------------------------------------
  // BR-26 / BR-27: insert the user row with idempotency_key. Throws on the
  // UNIQUE PARTIAL conflict — callers (sendMessage handler) catch the
  // pg `23505` and translate via `findUserByIdempotencyKey` into either replay
  // (UC-07) or mismatch (`BUSINESS_IDEMPOTENCY_MISMATCH`).
  insertUserMessage(
    client: PoolClient,
    input: {
      conversation_id: string;
      content: unknown[];                 // [{ type:"text", text:<content> }]
      idempotency_key: string;
      model: string | null;
    }
  ): Promise<MessageRow>;

  // BR-27: lookup by (conversation_id, idempotency_key). Returns the existing
  // user row when found — caller compares `(content, model)` to decide between
  // replay vs mismatch.
  findUserByIdempotencyKey(
    client: PoolClient, conversation_id: string, idempotency_key: string
  ): Promise<MessageRow | null>;

  // BR-27 / UC-07: locates the immediate successor assistant row of a user
  // row — `created_at ASC, id ASC`, first match with role='assistant'. Returns
  // NULL when the original turn never persisted an assistant row (e.g. crash).
  findAssistantSuccessor(
    client: PoolClient, conversation_id: string, after_created_at: string
  ): Promise<MessageRow | null>;

  // BR-29: insert the assistant row AFTER the terminal frame. `stop_reason`
  // covers the full set (model + synthetic).
  insertAssistantMessage(
    client: PoolClient,
    input: {
      conversation_id: string;
      content: unknown[];                 // Anthropic content blocks streamed during the turn.
      stop_reason:
        | "end_turn" | "max_tokens" | "stop_sequence"
        | "max_iterations" | "turn_timeout" | "cancelled"
        | "provider_error" | "internal_error";
      model: string | null;
      tokens_in: number | null;
      tokens_out: number | null;
      latency_ms: number | null;
    }
  ): Promise<MessageRow>;

  // BR-31 / BR-39: chronological reads on a conversation.
  // - `recentLimit`: used by context-builder (BR-31) — read the last N rows ASC.
  //   The function returns them in the order needed by Anthropic
  //   (chronological ASC).
  listRecentMessages(
    client: PoolClient, conversation_id: string, limit: number
  ): Promise<MessageRow[]>;

  // `before`: optional `created_at < before` filter; the function walks
  // BACKWARDS in time so the SPA can lazy-load older context (BR-39).
  listMessagesPaginated(
    client: PoolClient,
    conversation_id: string,
    input: { limit: number; before: string | null }
  ): Promise<{ items: MessageRow[]; hasMore: boolean }>;

  // BR-33 input: read the "older slice" excluding the recent window for the
  // utility-model summarisation.
  listOlderMessagesForSummary(
    client: PoolClient, conversation_id: string, exclude_recent: number
  ): Promise<MessageRow[]>;

  // BR-33 trigger: how many user-role rows exist on this conversation.
  countUserTurns(
    client: PoolClient, conversation_id: string
  ): Promise<number>;

  // BR-34 trigger: first user + first assistant rows of the conversation.
  // Used by the title-distillation prompt.
  getFirstUserAndAssistant(
    client: PoolClient, conversation_id: string
  ): Promise<{ user: MessageRow | null; assistant: MessageRow | null }>;

  // ---- Tool-call persistence ------------------------------------------------
  // BR-32: persisted on every tool dispatch. `message_id` may be NULL at insert
  // time (BR-29 ordering: the assistant row id is unknown during the loop).
  insertToolCall(
    client: PoolClient,
    input: {
      conversation_id: string;
      message_id: string | null;
      tool_name: string;
      arguments: unknown;
      result: unknown | null;
      is_error: boolean;
      error_message: string | null;
      duration_ms: number;
    }
  ): Promise<ToolCallRow>;

  // Patches the NULL message_id on all tool-call rows produced during a single
  // turn AFTER the assistant row is inserted (BR-32). The caller scopes by
  // a set of tool-call ids it has just inserted.
  attachToolCallsToMessage(
    client: PoolClient, tool_call_ids: string[], message_id: string
  ): Promise<void>;

  // ---- Aggregates -----------------------------------------------------------
  // BR-40: getConversationUsage. Reads aggregates in a single query; NULL
  // token columns are treated as 0.
  getConversationUsage(
    client: PoolClient, conversation_id: string
  ): Promise<{ messages: number; tokens_in: number; tokens_out: number; tool_calls: number }>;
}
```

> Row shapes (`ConversationRow`, `MessageRow`, `ToolCallRow`) mirror the
> table columns 1:1 (snake_case in the row type as well, to keep the
> repository surface boring). Service layer maps them to camelCase API shapes
> at the edge.

> **Reuse, not redefine.** The repository imports `withTransaction` and
> `withReadOnly` from `modules/curation/service/transaction.ts` (already in
> the codebase — lines 10 and 32). A future cleanup may promote these to a
> `shared/` helper, but v2 does not.

---

## 4. Business Rules (BR)

> BR-01..BR-24 preserve the v1 turn semantics with `sendMessage` substituted
> for the old `chatTurn` route. BR-25..BR-40 are new in v2.0 and cover
> persistence, the conversation aggregate, idempotency, context
> reconstruction, distillation, and compliance. All BR numbers MATCH the
> `.spec.md` v2.0.0 numbering — back-spec amendments live in the "Where to
> validate" / "Error returned" columns.

### BR-01 -- Turn body has exactly one user `content` field (no client-side history)
**Related UC:** UC-02, UC-07, UC-08
**Where to validate:** route (Zod `SendMessageRequest` on `POST /conversations/:id/messages`)
**Description:** `content.length >= 1 AND content.length <= MAX_CONTENT_LENGTH` (default 32768). Out of range -> 422. No `messages[]` is accepted from the client; the server reconstructs context server-side (BR-31).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-02 -- Persisted role enum is exactly `{user, assistant}`
**Related UC:** UC-02
**Where to validate:** DB enum `chat_message_role` (§2.1) + repository (`insertUserMessage` / `insertAssistantMessage` choose role at insert time).
**Description:** Transient `assistant(tool_use)` / `user(tool_result)` blocks during an iteration live only in the in-loop history and are NOT persisted.
**Error returned:** n/a (architectural invariant).

### BR-03 -- Reserved (was "Roles in client body" in v1.x — superseded)
**Related UC:** UC-02
**Where to validate:** route (no `role` field on `SendMessageRequest`).
**Description:** The wire body has no `role` field. The server assigns roles at insert time.
**Error returned:** n/a (architectural invariant).

### BR-04 -- `content` is a non-empty string (turn body)
**Related UC:** UC-02
**Where to validate:** route (Zod `z.string().min(1).max(MAX_CONTENT_LENGTH)`)
**Description:** `sendMessage` request `content` is a string >= 1 char; the persisted column is jsonb (`[{type:"text", text:<content>}]`).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-05 -- Tool catalog is the read-only `query` toolset, resolved lazily
**Related UC:** UC-02
**Where to validate:** route registration + service (`buildChatToolCatalog(mcp)` in `service/tool-catalog.ts`)
**Description:** Unchanged from v1. 13 names; `mcp.getTool('query', name)`; cached after first request; route family not mounted when resolution fails (404 on all chat endpoints in that degraded state — boot ERROR with the missing names).
**Error returned:** route family not registered (404 on all `/api/v1/conversations*` endpoints).

### BR-06 -- Tools are READ-ONLY (v7 §2 inegociable)
**Related UC:** UC-02
**Where to validate:** service (the `tools[]` passed to `anthropic.messages.stream(...)` is exactly the resolved 13 names)
**Description:** Unchanged from v1. Each tool invocation opens its own `BEGIN READ ONLY` (`withReadOnly` helper inside the tool's own service). The chat domain's owned writes (conversation CRUD, message persistence) run under `withTransaction` — those are NOT tool calls; the LLM never reaches them.
**Error returned:** n/a (architectural invariant).

### BR-07 -- Tool result envelope is the standard business envelope
**Related UC:** UC-02
**Where to validate:** service (tool dispatcher in `chat-agent.service.ts`)
**Description:** Unchanged from v1. `{ok:true,result}` / `{ok:false,error:{code,message,details?}}`. The dispatcher maps `ok` to the SSE `tool_result` frame AND yields the full envelope to the route via `ChatEvent.tool_result.{arguments,result,is_error,error_message,duration_ms}` so the route can persist a `chat_tool_call` row (BR-32).
**Error returned:** n/a (mapping rule).

### BR-08 -- `text_delta` frames are emitted as the Anthropic SDK yields them
**Related UC:** UC-02
**Where to validate:** service (SDK event handler)
**Description:** Unchanged from v1. Each non-empty delta is yielded immediately; the route writes synchronously to `reply.raw`.
**Error returned:** n/a.

### BR-09 -- `tool_start.args_summary` is a redacted, bounded summary
**Related UC:** UC-02
**Where to validate:** service (per-tool summariser in `service/args-summary.ts`)
**Description:** Unchanged from v1. <= 200 chars, never raw `value`/`text`/full bodies. Per-tool formats listed in v1 §1.2 still apply.
**Error returned:** n/a (cosmetic). On builder failure -> fallback `"<n keys>"`.

### BR-10 -- Unknown tool name returns an error tool_result without aborting the turn
**Related UC:** UC-02
**Where to validate:** service (tool dispatcher)
**Description:** Unchanged from v1. Dispatcher emits `tool_result{tool, ok:false}` + feeds `VALIDATION_INVALID_FORMAT` back to the model; persists a `chat_tool_call` row with `is_error=true` (BR-32).
**Error returned:** n/a (loop continuation).

### BR-11 -- Mid-stream provider failure surfaces as one SSE `error` frame, then close
**Related UC:** UC-02 (`10a`)
**Where to validate:** service (SDK error handler) + route (assistant-row persistence on error path, BR-29).
**Description:** Service yields exactly ONE `ChatEvent.error` with code `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, `synthetic_stop_reason="provider_error"`, the accumulated `content` blocks, and the running token sums. Route writes the SSE error frame, closes the stream, AND inserts the assistant row with `stop_reason = "provider_error"` + accumulated text (BR-29).
**Error returned:** SSE `error{code: "BUSINESS_CHAT_PROVIDER_UNAVAILABLE"}` + persisted assistant row.

### BR-12 -- Client disconnect triggers `stream.abort()`
**Related UC:** UC-06
**Where to validate:** route handler (`req.raw.on('close')` -> `AbortController.abort()`) + service (observes `input.abortSignal`) + route (assistant-row persistence on abort path, BR-29).
**Description:** On socket close, route aborts the controller; service calls `stream.abort()`, yields `done{stop_reason:"cancelled", content, tokens_in, tokens_out}`. Route attempts to write the frame (best-effort), then ALWAYS inserts the assistant row with `stop_reason = "cancelled"` and the partial accumulated text. The persistence is unconditional even when the SSE frame write failed — the user must be able to see the partial answer on subsequent `listMessages`.
**Error returned:** SSE `done{stop_reason:"cancelled"}` when achievable; persisted assistant row in either case.

### BR-13 -- Tool results sent back to the model are truncated to `TOOL_RESULT_MAX_CHARS`
**Related UC:** UC-02
**Where to validate:** service (tool dispatcher, before feeding `tool_result` block to the next iteration)
**Description:** Unchanged from v1. Truncation applies ONLY to the body fed back into the next Anthropic iteration. The `chat_tool_call.result` jsonb column receives the FULL UNTRUNCATED body (BR-32) — truncation is a context-window concern, not a persistence concern.
**Error returned:** n/a.

### BR-14 -- Kill-switch returns 503 BEFORE opening the SSE / before any write
**Related UC:** UC-09
**Where to validate:** every chat route handler (first executable line after Zod parse).
**Description:** `if (env.CHAT_ENABLED === false) return reply.code(503).send({ok:false, error:{code:"BUSINESS_CHAT_DISABLED", message:"chat surface is disabled by CHAT_ENABLED=false"}})`. No SSE frame is emitted; no chat-table write occurs. Applies to all 9 endpoints, not just `sendMessage`.
**Error returned:** HTTP 503 -- error.code: `BUSINESS_CHAT_DISABLED`.

### BR-15 -- `MAX_ITERATIONS` ceiling closes the turn with `stop_reason: "max_iterations"`
**Related UC:** UC-03
**Where to validate:** service (loop guard) + route (assistant-row persistence, BR-29).
**Description:** Unchanged from v1 semantics. The assistant row is persisted with `stop_reason="max_iterations"` and accumulated text.
**Error returned:** SSE `done{stop_reason: "max_iterations"}` + persisted assistant row.

### BR-16 -- `TURN_TIMEOUT_MS` ceiling aborts the active stream
**Related UC:** UC-05
**Where to validate:** service (wall-clock timer started at first `llm_start`) + route (assistant-row persistence).
**Description:** Unchanged from v1 semantics. `clearTimeout` on any terminal state. Assistant row persisted with `stop_reason="turn_timeout"`.
**Error returned:** SSE `done{stop_reason: "turn_timeout"}` + persisted assistant row.

### BR-17 -- `TOOL_TIMEOUT_MS` aborts a single tool call without ending the turn
**Related UC:** UC-02 (timeout variant)
**Where to validate:** service (per-tool wall-clock wrapper) + route (BR-32 persists the timed-out tool call with `is_error=true`).
**Description:** Unchanged from v1. The `chat_tool_call` row is persisted with `result=NULL`, `is_error=true`, `error_message="tool timeout"`, `duration_ms ≈ TOOL_TIMEOUT_MS`.
**Error returned:** SSE `tool_result{tool, ok:false}` (NOT terminal); model receives `{code:"SYSTEM_SERVICE_UNAVAILABLE"}`.

### BR-18 -- System prompt persona, language, and safety
**Related UC:** UC-02 + utility-prompt UC implicit in BR-33/BR-34
**Where to validate:** service (`selectChatPromptModule(env.CHAT_PROMPT_VERSION)` in `prompts/index.ts`). The chat-turn prompt is pt-BR. The DISTILLATION prompts (summary, title) are pt-BR utility prompts loaded from the same versioned module — `selectSummaryPromptModule()` and `selectTitlePromptModule()`. Distillation prompts have a stripped persona ("compactador" / "geração de título"), no tool catalog, no marker token.
**Description:** Unchanged content for the chat-turn prompt. `UnknownChatPromptVersionError` thrown at boot on unknown version.
**Error returned:** boot failure if `CHAT_PROMPT_VERSION` is unknown.

### BR-19 -- Observability per turn (no PII)
**Related UC:** all
**Where to validate:** route handler (emits the pino INFO record AFTER the iterator returns or throws AND AFTER the assistant row insert).
**Description:** v2 schema (§9 below) adds `conversation_id`, `message_id` (assistant row id), and `idempotent_replay` boolean. NEVER logs `content`, `args_summary` raw values, raw tool inputs, raw tool result bodies, `summary_rolling`, or the system prompt.
**Error returned:** n/a.

### BR-20 -- Output guard (minimal) against system-prompt leakage
**Related UC:** UC-02
**Where to validate:** service (`text_delta` yield site).
**Description:** Unchanged from v1. Marker token exported from the prompt module; `String.prototype.includes` check; drop on hit; WARN log `chat.output_guard_drop`.
**Error returned:** n/a (silent drop).

### BR-21 -- Anthropic factory is injectable; defaults from env
**Related UC:** UC-02
**Where to validate:** module wiring (`registerChatRoutes(scoped, {pool, mcp, logger, env, anthropicFactory?})`).
**Description:** Unchanged from v1. Factory throw -> 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` BEFORE any chat-table write (i.e. before `insertUserMessage`).
**Error returned:** HTTP 503 -- error.code: `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`.

### BR-22 -- Conversation lookup by id
**Related UC:** UC-02..UC-08
**Where to validate:** every nested operation (route handler -> `conversation.service.getConversation(id)` -> `repository.getConversationById`).
**Description:** Absent -> `ConversationNotFoundError` -> mapped to 404 `RESOURCE_NOT_FOUND`. The `:id` is parsed as `z.string().uuid()` at the path-parameter Zod layer; malformed UUIDs already reject with 422 `VALIDATION_INVALID_FORMAT` BEFORE this lookup.
**Error returned:** HTTP 404 -- error.code: `RESOURCE_NOT_FOUND`.

### BR-23 -- Pre-stream error envelope vs in-stream error frame
**Related UC:** UC-02, UC-06, UC-09
**Where to validate:** route handler (the boundary between the synchronous prelude and the `reply.hijack()` call inside `sendMessage`).
**Description:** Pre-stream codes (`VALIDATION_*`, `AUTH_*`, `RESOURCE_NOT_FOUND`, `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, `BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`, `BUSINESS_IDEMPOTENCY_MISMATCH`) are returned as REST envelope. In-stream codes are restricted to `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` and `SYSTEM_INTERNAL_ERROR`.
**Error returned:** depends on phase (REST envelope OR SSE `error` frame).

### BR-24 -- One terminal frame per turn
**Related UC:** all turn UCs
**Where to validate:** service (the `runTurn` AsyncIterable contract). The iterator always yields exactly one terminal event before returning.
**Description:** Route MUST close `reply.raw.end()` after the terminal frame is written and MUST NOT write further frames. Idempotent-replay (UC-07) opens its own SSE that emits `llm_start{1}` + replay `text_delta` + `done{stored}` — still exactly one terminal frame.
**Error returned:** n/a (state-machine invariant).

### BR-25 -- Writes are forbidden on archived conversations
**Related UC:** UC-02 (`4b`), UC-06 (`2b`)
**Where to validate:** route handler (`sendMessage`, `cancelTurn`) — checked AFTER the conversation lookup (BR-22) and BEFORE the turn-in-progress check (BR-28).
**Description:** `archived_at IS NOT NULL` -> 409 `BUSINESS_CONVERSATION_ARCHIVED`. The check is on the loaded `ConversationRow` (no extra query). Read endpoints (`getConversation`, `listMessages`, `getConversationUsage`) ignore the flag (they return archived rows unconditionally). `listConversations` filters via `include_archived` (BR-35).
**Error returned:** HTTP 409 -- error.code: `BUSINESS_CONVERSATION_ARCHIVED`.

### BR-26 -- `Idempotency-Key` is REQUIRED on `sendMessage`
**Related UC:** UC-02 (`3b`/`3c`), UC-07
**Where to validate:** route handler (`sendMessage`) — Zod header validator `z.string().uuid()` applied to `Idempotency-Key` BEFORE body parsing.
**Description:** Missing header -> 422 `VALIDATION_REQUIRED_FIELD` with `details.header = "Idempotency-Key"`. Non-UUID -> 422 `VALIDATION_INVALID_FORMAT` with `details.header = "Idempotency-Key", details.received = <value>`. The check is BEFORE the conversation lookup so a missing header on a deleted conversation surfaces consistently as 422 (not 404).
**Error returned:** HTTP 422 -- `VALIDATION_REQUIRED_FIELD` (missing) or `VALIDATION_INVALID_FORMAT` (non-UUID).

### BR-27 -- Idempotent replay returns the original assistant message
**Related UC:** UC-02 (`5a`/`5b`), UC-07
**Where to validate:** route handler (`sendMessage`) inside ONE `withTransaction` block, in this order:
1. `repository.findUserByIdempotencyKey(client, conversation_id, idempotency_key)`.
2. No match -> proceed to step (4) of UC-02; `repository.insertUserMessage` may raise pg `23505` (UNIQUE PARTIAL conflict) if a concurrent request inserted first — caught and reduced to a `findUserByIdempotencyKey` re-read inside the same transaction.
3. Match with `(content, model)` IDENTICAL -> idempotent replay path (UC-07): `repository.findAssistantSuccessor(client, conversation_id, user_row.created_at)`.
   - When the assistant row exists, open SSE, emit `llm_start{1}` + `text_delta(<stored>)` + `done{stored}`, close — no new rows; no Anthropic call.
   - When the assistant row is missing AND a turn is in-flight (BR-28) -> 409 `BUSINESS_TURN_IN_PROGRESS`.
   - When the assistant row is missing AND no turn is in-flight -> recovery path: reuse the existing user row (no insert) and run UC-02 from step 7.
4. Match with `(content, model)` DIFFERENT -> 409 `BUSINESS_IDEMPOTENCY_MISMATCH`.

`(content, model)` comparison: `content` is compared as the JSON-canonical form of the persisted jsonb (which the BFF wrote as `[{type:"text", text:<request content>}]` — so the comparator unwraps the single-text-block shape and compares the unwrapped string). `model` compared as the literal column value (NULL == NULL).
**Error returned:** HTTP 409 `BUSINESS_IDEMPOTENCY_MISMATCH` (on conflict); replay SSE (on match); proceed otherwise.

### BR-28 -- Single in-flight turn per conversation
**Related UC:** UC-02 (`4c`), UC-06
**Where to validate:** route handler (`sendMessage`) — checks the in-process `turn-registry.ts` `Map<conversation_id, AbortController>` AFTER BR-25 (archived check) and BEFORE BR-27 (idempotency check). The check + registration must be atomic within the route's single Node event-loop turn (the registry is a plain Map; reads/writes are synchronous, no race inside one process).
**Description:** Present in the registry -> 409 `BUSINESS_TURN_IN_PROGRESS`. Otherwise register `(conversation_id, controller)` BEFORE inserting the user row; release on terminal frame OR on iterator throw (try/finally). `cancelTurn` looks up the same registry (BR-38).
**Error returned:** HTTP 409 -- error.code: `BUSINESS_TURN_IN_PROGRESS`.

### BR-29 -- Persistence sequencing: user row BEFORE SSE, assistant row AFTER terminal frame, tool-call rows during the loop
**Related UC:** UC-02..UC-06
**Where to validate:** route handler (`sendMessage`).
**Description:** Authoritative sequencing:
1. (pre-stream) Validate body + header (BR-01/BR-04/BR-26).
2. (pre-stream) Resolve conversation (BR-22), check archived (BR-25), check turn-in-progress + register controller (BR-28), check idempotency (BR-27).
3. (pre-stream) Open `withTransaction`. Inside: insert user row via `repository.insertUserMessage`. Commit. Now the user's question is durable on any later failure.
4. (pre-stream) Build messages[] via `context-builder.buildModelContext` (under `withReadOnly`).
5. (open SSE) `reply.hijack()`, write headers.
6. (in-loop) Consume `chatAgentService.runTurn(...)`:
   - On each `ChatEvent.tool_result`, persist a `chat_tool_call` row via `repository.insertToolCall` (in its OWN `withTransaction` — short, single-statement) with `message_id = NULL`. Collect the inserted ids for step (8).
   - On each `ChatEvent.text_delta`, write the SSE frame.
   - On `ChatEvent.done` OR `ChatEvent.error`, write the terminal frame.
7. (post-stream) `reply.raw.end()`. Release the in-process turn registry entry.
8. (post-stream) Open a new `withTransaction`:
   - Insert the assistant row via `repository.insertAssistantMessage` with `stop_reason` resolved from the terminal event (including synthetic `provider_error` / `internal_error`).
   - `repository.attachToolCallsToMessage(toolCallIds, assistantRow.id)`.
   - Commit.
9. Emit the pino INFO turn record (BR-19).
10. Schedule fire-and-forget `distillationService.maybeRefreshSummary(...)` + `.maybeDistillTitle(...)` (BR-33 / BR-34).

If step 8 fails (DB error), the SSE has already closed — emit WARN `chat.assistant_row_persist_failure` with `request_id` and the error; the failure does NOT propagate to the client. Tool-call rows inserted in step 6 will keep `message_id = NULL` — auditable, no orphan cleanup needed.

**Error returned:** n/a (sequencing invariant).

### BR-30 -- `Conversation` create body invariants
**Related UC:** UC-01
**Where to validate:** route (Zod `CreateConversationRequest`)
**Description:** Body schema is `{ title?: z.string().min(1).max(200) }`. Empty body `{}` is accepted (title defaults to NULL). The server assigns `id`, `created_at`, `updated_at`; `archived_at`, `summary_rolling` are initialised to NULL.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-31 -- Context reconstruction: system prompt + summary_rolling + recent window
**Related UC:** UC-02
**Where to validate:** service (`context-builder.buildModelContext`)
**Description:** Step-by-step:
1. `system` = `selectChatPromptModule(env.CHAT_PROMPT_VERSION).systemPrompt`.
2. Read conversation by id (caller passed it, or read fresh from `repository.getConversationById`).
3. `summary_rolling`-block: when `conversation.summary_rolling IS NOT NULL`, prepend a synthetic message `{role:"user", content:[{type:"text", text: "[contexto da conversa anterior, sintetizado]\n\n" + summary_rolling}]}`. The opening header tells the model this block is a recap, not a user instruction.
4. Read the last `env.CHAT_RECENT_WINDOW` messages via `repository.listRecentMessages(client, conversation_id, env.CHAT_RECENT_WINDOW)`. Map them 1:1 to Anthropic `messages[]` (`role` -> `role`; jsonb `content` -> Anthropic `content`).
5. The user row inserted in step 3 of BR-29 IS the last element of the result by construction (the BFF inserts it BEFORE calling `buildModelContext`).

Client-side history is NEITHER required NOR accepted.
**Error returned:** n/a.

### BR-32 -- Tool calls are persisted with full input and result
**Related UC:** UC-02
**Where to validate:** route handler (`sendMessage`) — inserts via `repository.insertToolCall` on each `ChatEvent.tool_result` consumed from `runTurn`. The agent service yields the full envelope (arguments, result, is_error, error_message, duration_ms) via the v2 enriched `ChatEvent.tool_result` shape (§1.2).
**Description:**
- `arguments`: full jsonb input — NOT truncated by BR-13.
- `result`: full success body — NOT truncated. NULL on error.
- `is_error`: true when the tool envelope was `{ok:false}` OR on tool timeout (BR-17).
- `error_message`: short string from the tool envelope's `error.message`.
- `duration_ms`: wall-clock per tool call (start = `tool_start` yield, end = `tool_result` yield).
- `message_id`: NULL at insert time; patched in step 8 of BR-29 via `attachToolCallsToMessage`.
**Error returned:** n/a (audit trail).

### BR-33 -- Rolling summary refresh policy
**Related UC:** UC-02
**Where to validate:** service (`distillation.service.maybeRefreshSummary`) — scheduled fire-and-forget by the route AFTER the HTTP response has terminated.
**Description:**
1. Read `repository.countUserTurns(client, conversation_id)` under `withReadOnly`.
2. If `count > env.CHAT_SUMMARY_AFTER_TURNS` AND `env.CHAT_SUMMARY_ENABLED === true`, proceed; otherwise return.
3. Read `repository.listOlderMessagesForSummary(client, conversation_id, env.CHAT_RECENT_WINDOW)` under `withReadOnly` — returns messages OLDER than the last `CHAT_RECENT_WINDOW`.
4. Call `anthropic.messages.create({ model: env.CHAT_UTILITY_MODEL, stream: false, system: <summary prompt>, messages: <older slice> })`.
5. `repository.updateSummaryRolling(client, conversation_id, summary)` under `withTransaction`. The `set_updated_at` trigger bumps `updated_at` automatically.

Errors logged WARN `chat.summary_refresh_failure` with `conversation_id` + error class; NEVER thrown to the caller. The route already returned to the client. Counter `chat_summary_refresh_total{ok=false}` incremented; on success `{ok=true}` + histogram `chat_summary_refresh_latency_ms`.

When `env.CHAT_SUMMARY_ENABLED=false`, the function early-returns; `summary_rolling` stays NULL permanently for new turns.
**Error returned:** n/a (background).

### BR-34 -- Title distillation policy
**Related UC:** UC-02
**Where to validate:** service (`distillation.service.maybeDistillTitle`) — scheduled fire-and-forget by the route AFTER the HTTP response has terminated.
**Description:**
1. Read `repository.getConversationById(client, conversation_id)` under `withReadOnly`; early return if `title IS NOT NULL`.
2. If `env.CHAT_TITLE_ENABLED === false`, return.
3. Read `repository.getFirstUserAndAssistant(client, conversation_id)` under `withReadOnly`.
4. Call `anthropic.messages.create({ model: env.CHAT_UTILITY_MODEL, stream: false, system: <title prompt>, messages: [<user>, <assistant>] })`.
5. Trim result; if empty after trim OR `length > 80`, drop silently. Otherwise `repository.setTitleIfNull(client, conversation_id, title)` under `withTransaction` — the `IF NULL` guard makes the operation idempotent (a concurrent set wins; ours becomes a no-op).

Errors logged WARN `chat.title_distillation_failure`; NEVER thrown. Counter `chat_title_distillation_total{ok}` + histogram `chat_title_distillation_latency_ms`.

The Owner may always set the title manually via `updateConversation { title: "..." }` (BR-36); the distillation respects an existing title via the `IF NULL` guard.
**Error returned:** n/a (background).

### BR-35 -- Conversation listing: cursor pagination ordered by `created_at DESC, id DESC`
**Related UC:** UC-04
**Where to validate:** route (`listConversations`) + repository (`listConversations`).
**Description:**
- `limit` bounded `[1, 100]`, default 20.
- `cursor` is opaque, base64-url-encoded JSON `{ created_at: <iso8601>, id: <uuid> }`. On decode failure -> 422 `VALIDATION_INVALID_FORMAT` with `details.param = "cursor"`.
- Query: `SELECT ... FROM chat_conversation WHERE (created_at, id) < ($cursor_ts, $cursor_id) [AND archived_at IS NULL] ORDER BY created_at DESC, id DESC LIMIT $limit + 1`. The extra row tells the BFF whether to emit `next_cursor` (the `(created_at, id)` of the LAST row of the returned page) or `null`.
- `include_archived` defaults `false`.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT` on malformed cursor; otherwise 200.

### BR-36 -- `updateConversation` accepts `title` and/or `archived_at`; at least one MUST be present
**Related UC:** UC-04
**Where to validate:** route (Zod `UpdateConversationRequest` with `.refine(body => body.title !== undefined || body.archived_at !== undefined, "VALIDATION_REQUIRED_FIELD")`).
**Description:**
- `title`: `z.union([z.string().min(1).max(200), z.null()]).optional()` — `null` clears, `string` sets.
- `archived_at`: `z.union([z.string().datetime(), z.null()]).optional()` — `null` un-archives.
- Empty body -> 422 `VALIDATION_REQUIRED_FIELD` with `details.body = "PATCH /conversations/:id"`.
- The repository's `updateConversation` interprets `undefined` as "do not change", `null` as "set NULL". The `set_updated_at` trigger bumps `updated_at`.
**Error returned:** HTTP 422 -- `VALIDATION_REQUIRED_FIELD` (empty body) or `VALIDATION_INVALID_FORMAT` (shape failure).

### BR-37 -- Cascade delete on `deleteConversation` + compliance §11 exclusion
**Related UC:** UC-04
**Where to validate:** route (`deleteConversation`) + DDL (ON DELETE CASCADE on `chat_message.conversation_id` and `chat_tool_call.conversation_id`).
**Description:** Single `DELETE FROM chat_conversation WHERE id = $1` inside `withTransaction`. Affected rows = 0 -> 404 `RESOURCE_NOT_FOUND`. Affected rows = 1 -> 204. Cascade is enforced by DDL — no application-side iteration. The `compliance_delete` walker (v7 §11) does NOT visit chat tables (`.spec.md` §6 / BR-37). A negative test in §1 testing list confirms the exclusion (a sentinel chat row survives a `compliance_delete` on its source raw row).
**Error returned:** HTTP 204 on success; 404 `RESOURCE_NOT_FOUND` when absent.

### BR-38 -- `cancelTurn` requires a live in-flight turn on the conversation
**Related UC:** UC-06
**Where to validate:** route (`cancelTurn`) — lookup in the in-process `turn-registry.ts`.
**Description:**
1. Resolve conversation (BR-22) -> 404 if absent.
2. Check archived (BR-25) -> 409 `BUSINESS_CONVERSATION_ARCHIVED`.
3. Look up the `AbortController` for `conversation_id` in the registry; absent -> 404 `RESOURCE_NOT_FOUND` with `message = "no in-flight turn for this conversation"` (the same `RESOURCE_NOT_FOUND` code as step 1 — the API surface is deliberately uniform).
4. Call `controller.abort(reason="cancelled")`. Return 202 `{ ok: true, result: { cancelled: true } }`.

The actual SSE termination happens on the original `sendMessage` request (BR-12). The registry entry is released by the `sendMessage` finally-block, not by `cancelTurn`.
**Error returned:** HTTP 202 on success; 404 `RESOURCE_NOT_FOUND` (no conversation OR no in-flight turn); 409 `BUSINESS_CONVERSATION_ARCHIVED` (archived).

### BR-39 -- Message listing: ascending order, `before` cursor
**Related UC:** UC-08
**Where to validate:** route (`listMessages`) + repository (`listMessagesPaginated`).
**Description:**
- `limit` bounded `[1, 200]`, default 50.
- `before`: optional `z.string().datetime()` (RFC3339); query is `... WHERE conversation_id = $1 [AND created_at < $before] ORDER BY created_at ASC, id ASC LIMIT $limit + 1`.
- The pagination walks BACKWARDS in time so the SPA can lazy-load older messages above the visible window. `next_before` = the `created_at` of the OLDEST item of the page (`items[0].created_at`) when there are more pages; null otherwise.
- Conversation absence -> 404 `RESOURCE_NOT_FOUND` (BR-22) BEFORE the message query.
**Error returned:** HTTP 422 on shape failure; 404 when conversation absent.

### BR-40 -- `getConversationUsage` aggregates over assistant rows + tool calls
**Related UC:** UC-08
**Where to validate:** route (`getConversationUsage`) -> repository (`getConversationUsage`).
**Description:** Single aggregation query under `withReadOnly`:
```sql
SELECT
  (SELECT count(*)::int FROM chat_message    WHERE conversation_id = $1)                                AS messages,
  (SELECT coalesce(sum(tokens_in),  0)::int FROM chat_message    WHERE conversation_id = $1 AND role = 'assistant') AS tokens_in,
  (SELECT coalesce(sum(tokens_out), 0)::int FROM chat_message    WHERE conversation_id = $1 AND role = 'assistant') AS tokens_out,
  (SELECT count(*)::int FROM chat_tool_call WHERE conversation_id = $1)                                AS tool_calls;
```
Conversation absence (BR-22) -> 404 BEFORE the query.
**Error returned:** HTTP 404 (absent); 200 otherwise.

### BR-41 -- `graph_delta` SSE frame projection (Chat-Graph)
**Related UC:** UC-02 (variant: a graph-producing tool is invoked) — referenced as **UC-CG-01..UC-CG-04** in the front-side feature plan (`temp/chat-graphspace-plan.md` §11).
**Where to validate:** route handler (`sendMessage`) — inside the drain loop, immediately AFTER writing the SSE `tool_result` frame for the current `ChatEvent.tool_result`. The projection is route-owned; the agent service does NOT yield this variant (the `graph_delta` arm of the `ChatEvent` union exists ONLY so the `projectSseFrame` switch stays exhaustive at compile time — §1.2).
**Description:**

1. **Trigger.** The drain loop receives a `ChatEvent.tool_result` with `ok === true`. If `evt.tool` is one of `{traverse, get_node, list_nodes, search}` AND a `CatalogSnapshot` is available on `ChatRouteDeps`, the route invokes `normalizeToolResult(evt.tool, evt.result, catalog, client?)` from `service/graph-normalizer.ts`. Failed tool calls (`ok === false`) NEVER produce a `graph_delta` — by construction, `evt.result` is `null` on failure and the projector is gated behind `evt.ok` to avoid surfacing a misleading "graph data arrived" signal (consistent with `chat-graphspace-plan.md` §8.2 EV-CG-03 / UC-CG-06).
2. **Normalization (per tool).**
   - `traverse`: `{starting_node_id, nodes[], links[]}` -> `{source_tool:"traverse", nodes: nodes.map(pickNodeWire), links: links.map(pickLinkWire)}`. `is_temporal` for each link is resolved by looking up `link_type` in the `CatalogSnapshot.linkTypeByName`; a catalog miss falls back to `is_temporal: false` (defensive default; never throws).
   - `get_node`: `{node, aliases[], attributes[]}` -> `{source_tool:"get_node", nodes:[pickNodeWire(node)], links:[]}`.
   - `list_nodes`: `{nodes[]} (paginated)` -> `{source_tool:"list_nodes", nodes: nodes.map(pickNodeWire), links:[]}`.
   - `search` (G-A, hydration): `{items[]} (kind in {node, link, fragment})`. Step (a) collect `items.filter(i => i.kind === "node").map(i => i.id)` deduped, in first-seen order. Step (b) if non-empty, call `findNodesByIds(client, ids)` ONCE (no N+1; the function uses `WHERE id = ANY($1::uuid[])` per `backend/src/modules/knowledge-graph/repository/graph.repository.ts:346`). Step (c) hydrate ids -> `NodeSummary` and emit `{source_tool:"search", nodes: hydrated, links: []}`. Items of `kind in {link, fragment}` are NOT projected — they remain visible only in the assistant text-channel. Node ids absent from the hydration result (rare race: deleted between `search` and the hydration) are dropped silently. With zero `kind:node` items the projector issues NO SQL (early return) and emits an empty delta.
3. **Wire emission.** The projector returns `GraphDeltaWire | null`. When non-null AND the catalog snapshot is available, the route synthesises a `ChatEvent.graph_delta` and writes it through `projectSseFrame` as `event: graph_delta\ndata: <JSON>\n\n`. Frame ordering is contractual: the `graph_delta` ALWAYS follows its originating `tool_result` in the SAME drain-loop iteration. When the catalog snapshot is absent (degraded mode — e.g. boot raced ahead of the catalog), the path is silently skipped; `tool_result` still emits normally.
4. **Defensive guard.** The route wraps `normalizeToolResult` in a `try/catch` and logs WARN `chat.graph_delta_normalize_failure` on exception (e.g. `findNodesByIds` rejection); the SSE stream is NOT terminated — only the optional projection is dropped. Rationale: the `tool_result` already emitted (the user has the answer in the text channel); aborting the entire turn because the optional graph projection failed would be disproportionate.
5. **Persistence.** `graph_delta` is NOT persisted to `chat_tool_call`. The audit trail for the underlying tool invocation lives on the originating `chat_tool_call` row inserted in step 6 of BR-29 — BR-32 is the single source of truth for tool-call persistence. Re-running the same conversation cannot reproduce the `graph_delta` (no replay path for it). Refresh requires re-issuing the tool call.
6. **Idempotent replay (UC-07).** The replay path described in BR-27 emits `llm_start{1}` + `text_delta(<stored>)` + `done{stored}` and closes — NO `tool_result`, NO `graph_delta`. The SPA's `useGraphStore` is responsible for ignoring the replay path (no tool_start signal), per `chat-graphspace-plan.md` §8 sequence.

**Error returned:** none (observational frame). Projector exceptions are absorbed (WARN); the SSE stream remains healthy.

> **Search hydration deviation (G-A).** The `search` tool envelope does NOT carry `node_type` / `canonical_name` per the existing query-retrieval contract. Surfacing those fields on a `graph_delta` would otherwise require changing the `search` envelope schema (a breaking change touching every existing client of `query-retrieval`). The chosen alternative — hydrating `search` ids server-side INSIDE the chat domain — is a controlled deviation from the chat-module boundary rule (cf. §1.1 boundary note above): `chat/service/graph-normalizer.ts` imports `findNodesByIds` from `knowledge-graph/repository/graph.repository.ts`. The deviation is approved (`temp/chat-graphspace-plan.md` §10 G-A) and explicitly preserves the `query-retrieval` boundary (no imports from there); it should be revisited if/when `search` evolves to carry `NodeSummary` natively.

---

## 5. State Machine (ST)

### ST-01 -- Conversation lifecycle

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| `null` | `active` | `POST /conversations` | Zod parse OK; `INSERT chat_conversation` (BR-30) | UC-01 |
| `active` | `archived` | `PATCH /conversations/:id {archived_at:<ts>}` | BR-36 | UC-04 |
| `archived` | `active` | `PATCH /conversations/:id {archived_at:null}` | BR-36 | UC-04 |
| `active` \| `archived` | `deleted` (row removed) | `DELETE /conversations/:id` | BR-37 cascade | UC-04 |
| `archived` | `archived` (refused) | `POST /conversations/:id/messages` | 409 `BUSINESS_CONVERSATION_ARCHIVED` (BR-25) | UC-02 (`4b`) |
| `archived` | `archived` (refused) | `POST /conversations/:id/cancel` | 409 `BUSINESS_CONVERSATION_ARCHIVED` (BR-25) | UC-06 (`2b`) |

### ST-02 -- Chat turn lifecycle (nested under an `active` conversation)

Mirrors the business state machine of `.spec.md` §5.2. Technical guards added below.

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| `idle` | `validating` | `POST /conversations/:id/messages` arrives | -- | UC-02 |
| `validating` | `closed_pre_stream` | Idempotency-Key header missing/non-UUID | 422 (BR-26) | UC-02 (`3b`/`3c`) |
| `validating` | `closed_pre_stream` | JWT invalid | 401 inherited | UC-02 |
| `validating` | `closed_pre_stream` | Zod body parse fails | 422 (BR-01/BR-04) | UC-02 (`3a`) |
| `validating` | `closed_pre_stream` | conversation not found | 404 (BR-22) | UC-02 (`4a`) |
| `validating` | `closed_pre_stream` | conversation archived | 409 `BUSINESS_CONVERSATION_ARCHIVED` (BR-25) | UC-02 (`4b`) |
| `validating` | `closed_pre_stream` | turn in-flight | 409 `BUSINESS_TURN_IN_PROGRESS` (BR-28) | UC-02 (`4c`) |
| `validating` | `closed_pre_stream` | idempotency mismatch | 409 `BUSINESS_IDEMPOTENCY_MISMATCH` (BR-27) | UC-02 (`5a`) |
| `validating` | `replay_open` | idempotency match identical AND assistant row present | (BR-27) | UC-07 |
| `replay_open` | `closed` | emit `llm_start{1}` + `text_delta(<stored>)` + `done{stored}`; `reply.raw.end()` | (BR-24) | UC-07 |
| `validating` | `closed_pre_stream` | kill-switch on | 503 `BUSINESS_CHAT_DISABLED` (BR-14) | UC-09 |
| `validating` | `closed_pre_stream` | Anthropic factory throws | 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (BR-21) | UC-02 |
| `validating` | `user_row_persisted` | all checks pass | `INSERT chat_message (role='user')` inside `withTransaction` (BR-29 step 3) | UC-02 |
| `user_row_persisted` | `streaming_open` | `reply.hijack()` + headers | -- | UC-02 |
| `streaming_open` | `llm_streaming(1)` | service yields `llm_start{1}` | start wall-clock timer (BR-16) | UC-02 |
| `llm_streaming(i)` | `llm_streaming(i)` | SDK `text_delta` | `delta.length >= 1` (BR-08), passes BR-20 guard | UC-02 |
| `llm_streaming(i)` | `tool_pending(i,t)` | SDK stop = `tool_use` | tool name in resolved catalog (BR-05) | UC-02 |
| `tool_pending(i,t)` | `tool_running(i,t)` | service yields `tool_start{t}` | redacted summary (BR-09) | UC-02 |
| `tool_running(i,t)` | `iteration_completed(i)` | tool returns `{ok}` | `INSERT chat_tool_call` (BR-32); if `t in {traverse,get_node,list_nodes,search}` and `ok=true` and catalog available, emit `graph_delta` AFTER `tool_result` (BR-41) | UC-02 |
| `tool_running(i,t)` | `iteration_completed(i)` | tool timeout | wall-clock > `TOOL_TIMEOUT_MS` (BR-17); persist with `is_error=true` (BR-32); NO `graph_delta` (BR-41) | UC-02 |
| `iteration_completed(i)` | `llm_streaming(i+1)` | next iteration begins | `i+1 <= MAX_ITERATIONS` (BR-15); truncate prior result (BR-13) | UC-02 |
| `iteration_completed(i)` | `done_max_iterations` | ceiling hit | `i+1 > MAX_ITERATIONS` (BR-15) | UC-03 |
| any active | `done_error` | SDK error / loop exception | error mapped to `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` / `SYSTEM_INTERNAL_ERROR` (BR-11, BR-23) | UC-02 (`10a`/`12a`) |
| any active | `aborting` | `req.raw.on('close')` OR `cancelTurn` | `AbortController.abort()`, `stream.abort()` (BR-12, BR-38) | UC-05/UC-06 |
| any active | `aborting_timeout` | wall-clock > `TURN_TIMEOUT_MS` | abort + reason="turn_timeout" (BR-16) | UC-05 |
| `aborting` | `done_cancelled` | abort acknowledged | socket may not be writable; persist regardless | UC-06 |
| `aborting_timeout` | `done_timeout` | abort acknowledged | -- | UC-05 |
| any `done_*` | `assistant_row_persisted` | `INSERT chat_message (role='assistant')` + `attachToolCallsToMessage` (BR-29 step 8) | inside `withTransaction` | -- |
| `done_error` | `assistant_row_persisted` | `INSERT chat_message (role='assistant')` with `stop_reason in {provider_error, internal_error}` | (BR-29) | UC-02 (`10a`/`12a`) |
| `assistant_row_persisted` | `closed` | `reply.raw.end()`; release turn registry; pino INFO; schedule distillation (BR-33/BR-34) | (BR-24) | -- |

---

## 6. Domain Events (EV)

> v2 is STATEFUL but still does NOT publish or consume any cross-service event bus. The pino log records emitted at the end of each turn and each distillation job are observability, not events. No event broker is configured for the Remember BFF (CLAUDE.md "Architecture / Backend").

`No events in this version.`

---

## 7. External Integrations

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Anthropic Messages API (streaming, **turn**) | LLM provider | Drive the agentic tool-use loop on `sendMessage`. Reuses `defaultAnthropicFactory` (BR-21). Model `env.CHAT_MODEL` default `claude-opus-4-8`. | Per-turn wall-clock: `TURN_TIMEOUT_MS` (default 90s, BR-16). | Pre-stream factory failure -> 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. Mid-stream failure -> SSE `error{code:"BUSINESS_CHAT_PROVIDER_UNAVAILABLE"}` + persisted assistant row with `stop_reason="provider_error"` (BR-11). Wall-clock expiry -> SSE `done{stop_reason:"turn_timeout"}` (BR-16). No retry inside the turn — the client may re-POST (idempotency-keyed, BR-27). |
| Anthropic Messages API (non-streaming, **utility**) | LLM provider | Distillation jobs — rolling summary (BR-33) and title (BR-34). Model `env.CHAT_UTILITY_MODEL` default `claude-haiku-4-5`. | Per-call SDK `timeout: 5*60*1000` (inherited from `defaultAnthropicFactory`). No per-job wall-clock from this domain. | Best-effort. Errors logged WARN, never thrown. `summary_rolling` / `title` stay at their previous value (NULL on first failure). |
| Neon (PostgreSQL 17) — chat tables | Owned datastore | Conversation CRUD, message persistence, tool-call persistence, summary/title updates. Uses the existing BFF `pg` pool (`min=2, max=10`, `sslmode=require`). | pg statement timeout: process-wide default (none set today). | Repository errors propagate to the route; routes map known pg `23505` (UNIQUE PARTIAL conflict on idempotency_key) into the BR-27 recovery path. Other DB errors -> 500 `SYSTEM_INTERNAL_ERROR` (REST envelope pre-stream; SSE `error` in-stream when already hijacked). |
| In-process `McpServer` registry (consumed) | Tool catalog source | Resolve the 13 read-only `query`-toolset tools (BR-05). | n/a (in-process). | Resolution failure -> route family not mounted; ERROR log at boot. |
| `query-retrieval` + `knowledge-graph` services (consumed) | DB read via existing tool handlers | Each agentic tool invocation calls into the existing service code, which opens its OWN `BEGIN READ ONLY` transaction (`withReadOnly`). | Per-tool wall-clock: `TOOL_TIMEOUT_MS` (default 15s, BR-17). | On timeout -> failed `tool_result` fed back + persisted as `chat_tool_call` with `is_error=true`. Underlying SQL is NOT cancelled in v2 (limitation carried from v1). |
| `knowledge-graph.repository.findNodesByIds` (consumed, v2.1 — BR-41) | DB read for `graph_delta` `search` hydration (G-A) | After a successful `search` `tool_result`, the route's drain loop calls `withReadOnly(pool, client => normalizeToolResult("search", evt.result, catalog, client))` — a SINGLE batched `SELECT ... WHERE id = ANY($1::uuid[])` to hydrate `items(kind=node).id` into `NodeSummary` so the wire frame can carry `node_type` + `canonical_name`. No N+1; zero `kind:node` items -> NO SQL. | Inherits the per-turn wall-clock (BR-16); no dedicated timeout. | Hydration failure -> WARN `chat.graph_delta_normalize_failure`, `graph_delta` frame skipped, SSE stream stays healthy (BR-41 step 4). |

---

## 8. Configuration / Environment

All values read once at boot from `process.env` via `loadEnv()` (the same loader that owns `LOCAL_OPERATOR_TOKEN`). The five new env vars (`CHAT_UTILITY_MODEL`, `CHAT_SUMMARY_AFTER_TURNS`, `CHAT_RECENT_WINDOW`, `CHAT_TITLE_ENABLED`, `CHAT_SUMMARY_ENABLED`) are all ADDITIVE and OPTIONAL — defaults preserve a reasonable single-owner experience without configuration.

| Env var | Type | Default | Required | Purpose |
|---------|------|---------|----------|---------|
| `CHAT_ENABLED` | boolean (`"true"`/`"false"`) | `true` | no | Kill-switch (BR-14). When `false`, every chat endpoint returns 503 `BUSINESS_CHAT_DISABLED`. |
| `CHAT_MODEL` | string | `claude-opus-4-8` | no | Default Anthropic model id for the turn (overridable per request via `model` body field). |
| `CHAT_UTILITY_MODEL` | string | `claude-haiku-4-5` | no (NEW) | Anthropic model id for distillation jobs (BR-33 / BR-34). Smaller / cheaper than the turn model. |
| `CHAT_PROMPT_VERSION` | string | `v1` | no | Chat system-prompt module version (BR-18). Unknown -> boot fails. |
| `MAX_CONTENT_LENGTH` | integer | `32768` | no | Upper bound on `sendMessage.content` length (BR-01). |
| `MAX_ITERATIONS` | integer | `8` | no | Upper bound on agentic-loop iterations (BR-15). |
| `TURN_TIMEOUT_MS` | integer | `90000` (90s) | no | Per-turn wall-clock budget (BR-16). |
| `TOOL_TIMEOUT_MS` | integer | `15000` (15s) | no | Per-tool-call wall-clock budget (BR-17). |
| `TOOL_RESULT_MAX_CHARS` | integer | `8000` | no | Truncation ceiling for tool results fed back to the model (BR-13). Does NOT affect persistence (BR-32). |
| `CHAT_RECENT_WINDOW` | integer | `10` | no (NEW) | Number of recent messages used by the context builder (BR-31). Older messages are summarised (BR-33). |
| `CHAT_SUMMARY_AFTER_TURNS` | integer | `20` | no (NEW) | After this many USER turns on a conversation, the rolling-summary policy fires (BR-33). |
| `CHAT_TITLE_ENABLED` | boolean | `true` | no (NEW) | When `false`, the title-distillation job (BR-34) is skipped. |
| `CHAT_SUMMARY_ENABLED` | boolean | `true` | no (NEW) | When `false`, the rolling-summary job (BR-33) is skipped — `summary_rolling` stays NULL permanently. |
| `ANTHROPIC_API_KEY` | string | -- | YES (when `CHAT_ENABLED=true`) | Anthropic API key. Reuses the same env already required by `ingestion`. Missing -> factory throws -> 503 `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. |
| `DATABASE_URL` | string | -- | YES | Neon Postgres connection string. Consumed via the existing process-wide BFF pool (CLAUDE.md "Database"). Used by `withTransaction` / `withReadOnly` on the chat domain. |

---

## 9. Observability — pino turn record (BR-19)

Emitted exactly once per turn (after the iterator returns or throws AND after the assistant row is persisted), at INFO level. Schema (v2 — additions over v1 are commented):

```jsonc
{
  "event":            "chat.turn",
  "request_id":       "req_01F8Z...",          // Fastify request id.
  "actor":            "owner",                 // Always "owner" (single-owner).
  "route":            "POST /api/v1/conversations/:id/messages", // v2.
  "conversation_id":  "11111111-...",          // v2 (NEW).
  "message_id":       "bbbbbbbb-...",          // v2 (NEW) — assistant chat_message.id; null on persist failure.
  "model":            "claude-opus-4-8",       // Resolved model.
  "iterations":       3,
  "tools_called":     ["search", "get_node"],  // Tool NAMES only, in call order.
  "tokens_in":        1234,
  "tokens_out":       567,
  "stop_reason":      "end_turn",              // end_turn|max_tokens|stop_sequence
                                               //  |max_iterations|turn_timeout|cancelled
                                               //  |provider_error|internal_error
  "latency_ms":       3210,
  "aborted":          false,                   // true when stop_reason in {cancelled, turn_timeout}.
  "idempotent_replay": false                   // v2 (NEW) — true when UC-07 replay short-circuited.
}
```

NEVER logged: `content` (request OR persisted), `args_summary` raw values, tool result bodies, the system prompt, the marker token, `summary_rolling`.

Counters:

- `chat_turn_total{stop_reason}` -- counter, one increment per terminal frame.
- `chat_turn_latency_ms` -- histogram.
- `chat_turn_iterations` -- histogram.
- `chat_output_guard_drops_total{marker_version}` -- counter, per BR-20 drop.
- `chat_turn_idempotent_replay_total` -- counter, per UC-07 hit. (NEW.)
- `chat_turn_in_progress_conflict_total` -- counter, per BR-28 409. (NEW.)
- `chat_summary_refresh_total{ok}` + `chat_summary_refresh_latency_ms` -- BR-33. (NEW.)
- `chat_title_distillation_total{ok}` + `chat_title_distillation_latency_ms` -- BR-34. (NEW.)

WARN log shapes:

- `chat.assistant_row_persist_failure` (BR-29 step 8 failed).
- `chat.summary_refresh_failure` (BR-33 background failure).
- `chat.title_distillation_failure` (BR-34 background failure).
- `chat.output_guard_drop` (BR-20).
- `chat.graph_delta_normalize_failure` (BR-41 — projector or `search` hydration failed; the SSE stream is NOT terminated, only the optional `graph_delta` is dropped).

---

## 10. Error Catalog (codes introduced + reused by this domain)

Five new business codes (three new in v2, two preserved from v1) live in
`backend/src/modules/chat/service/errors.ts`. The `errors.ts` module ALSO
exports the per-error mapper class consumed by `backend/src/shared/error-mapping.ts`.

| Code | HTTP / Channel | Class | When |
|------|----------------|-------|------|
| `BUSINESS_CHAT_DISABLED` | 503 (REST envelope only — every endpoint) | `ChatDisabledError` | `env.CHAT_ENABLED === false` (BR-14). |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503 (pre-stream REST) OR SSE `error` frame (in-stream) | `ChatProviderUnavailableError` | Pre-stream: Anthropic factory throws (BR-21). In-stream: SDK error / `messages.stream()` rejection (BR-11). |
| `BUSINESS_CONVERSATION_ARCHIVED` | 409 (REST envelope only) | `ConversationArchivedError` | `archived_at IS NOT NULL` on a write endpoint (BR-25). NEW in v2. |
| `BUSINESS_TURN_IN_PROGRESS` | 409 (REST envelope only) | `TurnInProgressError` | Another turn registered for this conversation (BR-28). NEW in v2. |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | 409 (REST envelope only) | `IdempotencyMismatchError` | Idempotency-Key matches with different `(content, model)` (BR-27). NEW in v2. |

Reused codes (already registered in the global catalog — no new code needed):

- `VALIDATION_INVALID_FORMAT` -- pre-stream body / query / cursor parse failures (BR-01/BR-04/BR-26/BR-35); in-stream defensive guard for unknown tool name (BR-10).
- `VALIDATION_REQUIRED_FIELD` -- missing `Idempotency-Key` header (BR-26); empty PATCH body (BR-36).
- `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` -- inherited from `requireNeonAuth`.
- `RESOURCE_NOT_FOUND` -- conversation absent (BR-22); cancel-with-no-inflight (BR-38).
- `SYSTEM_INTERNAL_ERROR` -- pre-stream unexpected exception (REST envelope); in-stream unhandled exception in the agentic loop (SSE `error` frame).
- `SYSTEM_SERVICE_UNAVAILABLE` -- in-loop tool timeout (BR-17), fed back to the model; NEVER emitted as a terminal SSE `error` frame.

> Action item for implementation: register the three new business codes
> (`BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`,
> `BUSINESS_IDEMPOTENCY_MISMATCH`) in `modules/chat/service/errors.ts`. The
> error-code registry is per-module today (`modules/*/service/errors.ts`); no
> global-file edit is required.

---

## 11. Performance Budgets

- **Pre-stream prelude p95 (sendMessage):** < 100 ms — Zod parse + conversation read (BR-22, single-row PK lookup, expected 1-2 ms) + archived check + turn-registry check + idempotency read (BR-27) + user-row INSERT (single statement under `withTransaction`) + context-builder reads (last 10 messages on the `(conversation_id, created_at)` index, 1-3 ms) + `reply.hijack()`. Two short DB round-trips dominate; under Neon's direct-connection latency this stays comfortably under 100 ms.
- **Time-to-first-byte (first `llm_start` frame) p95:** < 800 ms after request hits route (dominated by the first Anthropic stream `accept` round-trip).
- **Per-turn wall-clock budget:** `TURN_TIMEOUT_MS` (default 90s). Typical conversational turns complete in 2-15s.
- **Per-tool-call latency:** delegated to existing per-tool budgets (`search < 500ms`, `traverse <= depth 3 < 1s`, `get_* < 200ms` per CLAUDE.md).
- **Memory:** in-loop history grows by one `assistant(tool_use)` + one `user(tool_result)` block per iteration. With `MAX_ITERATIONS=8` and `TOOL_RESULT_MAX_CHARS=8000`, the worst-case in-loop history payload is ~64 kB on top of the reconstructed context (`CHAT_RECENT_WINDOW=10` messages + `summary_rolling` <= a few kB).
- **Conversation listing p95:** < 50 ms — single index range scan on `idx_chat_conversation_created_at_id_desc` with `LIMIT 21`.
- **Message listing p95:** < 80 ms — index scan on `(conversation_id, created_at)` with `LIMIT 51`.
- **Distillation latency (background):** off the request path; budget governed by the utility model's response time + a single `UPDATE`. Failures logged WARN, do not block the next turn.
- **`graph_delta` projection (v2.1, BR-41) p95:** < 50 ms — `traverse`/`get_node`/`list_nodes` are pure passthrough + catalog lookup (in-process map). `search` adds ONE batched `findNodesByIds` round-trip (single index scan on `node_pkey`, expected 1-3 ms on Neon). The projection runs inline in the drain loop AFTER the `tool_result` is on the wire; the user-visible latency cost is added to the inter-frame gap between `tool_result` and the subsequent `text_delta` of the next iteration.

---

## 12. Known Technical Constraints

- **In-process turn registry (BR-28).** Single-process semantics. A multi-instance BFF would split the registry; v1 is single-instance (CLAUDE.md "Architecture / Backend"). Out-of-scope until multi-instance is on the roadmap.
- **`message_id` is nullable on `chat_tool_call`.** Required by the persistence sequencing (BR-29 / BR-32): the assistant row id is unknown during the loop. The route patches the column post-terminal-frame via `attachToolCallsToMessage`. If the post-stream transaction fails, the tool-call rows keep `message_id = NULL` — auditable, no orphan cleanup needed.
- **Tool registry is mutable in principle.** Carried from v1: the `McpServer` registry is in-process and could be re-registered after boot by another module. Mitigated by the first-request cache; restart on registry mutation.
- **SSE behind proxies.** `X-Accel-Buffering: no` required (carry-over from v1).
- **Anthropic SDK concurrency.** Single client instance shared across concurrent turns (carry-over from v1). Single-owner -> at most a handful of concurrent turns.
- **No pre-flight model allow-list.** `model` is a free string; unknown model -> mid-stream provider error (BR-11) -> persisted assistant row with `stop_reason="provider_error"`.
- **`disable_parallel_tool_use: true` is unconditional.** Re-enabling would require multi-`tool_result` rebuild + a redesign of the `tool_start`/`tool_result` SSE pairing AND of the `chat_tool_call` insertion order (BR-32 expects strict sequencing).
- **`compliance_delete` exclusion is by design.** The walker does NOT visit chat tables (BR-37, `.spec.md` §6). Erasure of chat content is `DELETE /conversations/:id` (cascade). Reconcile in a future revision if compliance posture changes.
- **No `pg` statement timeout configured.** The BFF pool today does not set `statement_timeout`. Chat queries on the owned tables are short (single-row PK lookups, bounded LIMITs) and not at risk. Tool-internal queries already have their own per-tool wall-clock at the dispatcher level (BR-17).
- **Distillation jobs are fire-and-forget IN-PROCESS.** No queue, no retry, no persistence of failed attempts. Acceptable in v1: single-owner, low-throughput. If the BFF crashes between the terminal frame and the distillation kickoff, the summary/title is simply not refreshed for that turn — the next turn re-checks the conditions (BR-33 step 1, BR-34 step 1) and runs the job again.
- **`(content, model)` comparison for idempotent replay.** BR-27 compares the persisted single-text-block jsonb to the incoming string by unwrapping `content[0].text` and comparing the strings literally. The model-side `model` column is compared as the literal value (NULL == NULL). Any future change to the persisted shape (e.g. multi-block user messages) requires this comparator to evolve.
- **Boot diagnostic for missing tools.** Carried from v1: when `buildChatToolCatalog(mcp)` fails to resolve, the entire chat route family is not mounted — all 9 endpoints return 404. The BFF logs ERROR with the resolved-vs-expected diff at boot.
- **`graph_delta` requires the catalog snapshot (v2.1, BR-41).** The route reads the `CatalogSnapshot` from `ChatRouteDeps` (forwarded by `app.ts` at boot). When the snapshot is unavailable (degraded mode — e.g. boot raced ahead of the catalog loader), the route silently SKIPS `graph_delta` emission while keeping `tool_result` intact. This is a degraded UX, NOT a turn failure. There is no automatic recovery path other than restart; the BFF should log ERROR at boot if the catalog fails to load (existing `knowledge-graph` invariant).
- **`graph_delta` is not persisted; not replayable.** Per BR-41 step 5, the frame is observational only — the audit trail for the originating tool call lives on the existing `chat_tool_call` row (BR-32). The idempotent-replay path (UC-07, BR-27) does NOT re-emit `graph_delta`; clients reconstructing the visual graph from a replay must re-issue the tool call (out of scope for v2.1).

---

## 13. Out of Scope

- **Frontend / SPA components** -- BACKEND-ONLY change.
- **Cost / USD accounting at the API level** -- only `tokens_in`/`tokens_out` aggregates (BR-40). No price catalog, no `cost_usd` column.
- **Citations attached to assistant messages** -- Owner inspects provenance on demand via the `query` tools.
- **`guardrail_events` table / pending tool-confirmation flow** -- write/curation tools are not exposed.
- **`pending_confirmations` table** -- not introduced (read-only tool catalog).
- **Write or curation tools in the agentic loop.**
- **Embeddings-based retrieval** -- permanent non-goal (v7 §20.1 / ADR A24).
- **Heavy input regex / prompt-injection scrubbing** -- single-owner; minimal output guard only (BR-20).
- **Rate-limit / backpressure middleware** -- single-owner.
- **Compliance-delete integration for chat rows** -- §2.5 / BR-37; cascade DELETE is the only erasure path.
- **Multi-instance BFF coordination of in-flight turns** -- BR-28 relies on the single-process registry.
- **Streaming of historical message reads** -- `listMessages` returns JSON, not SSE.
- **Background job queue (BullMQ / SQS / pg-boss).** Distillation is fire-and-forget in-process.
- **Migration `0004` applied at spec time.** Per CLAUDE.md "Safety Rule — Database Changes Require Explicit Approval", the DDL is only authored as a spec artifact at `./0004_chat_persistence.sql`. Dev team copies/adapts into `migrations/0004_chat_persistence.sql` and applies under owner approval.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-19 | Back Spec Agent | initial | Initial version — new `chat` backend spec. Stateless v1, READ-ONLY agentic loop over the 13 `query`-toolset tools. | -- |
| 1.1.0 | 2026-06-19 | Back Spec Agent | refine | Added §1.1 file layout, §1.2 `ChatAgentService` contract; added BR-23/BR-24 invariants; added §8 env table, §9 pino schema, §10 error catalog, §11 budgets. | -- |
| 1.1.1 | 2026-06-19 | Back Spec Agent | patch | Corrected `VALIDATION_INVALID_FORMAT` pre-stream HTTP status from 400 to 422. | REPAIR-1 |
| 2.0.0 | 2026-06-20 | Back Spec Agent | major (breaking) | **Stateful conversations.** Adopts `.spec.md` v2.0.0 / `openapi.yaml` v2.0.0. (a) §2 Data Model is no longer empty: 3 owned tables (`chat_conversation`, `chat_message`, `chat_tool_call`) + 1 enum (`chat_message_role`) via migration `0004_chat_persistence.sql` (spec artifact at `./0004_chat_persistence.sql`; DB Safety Rule — NOT applied at spec time). NO `user_id` column anywhere (single-owner). Compliance §11 exclusion is intentional (BR-37). (b) NEW §3 Repository Layer documenting the `chat.repository.ts` contract (raw `pg` parameterized, `PoolClient`-based, reusing `withTransaction`/`withReadOnly` from `modules/curation/service/transaction.ts`). (c) §1.1 file layout extended: added `repository/chat.repository.ts`, `service/conversation.service.ts`, `service/context-builder.ts`, `service/distillation.service.ts`, `service/turn-registry.ts`; the existing `chat-agent.service.ts` keeps its scope (agentic loop only — DB reads now come from `context-builder`). (d) §1.2 `ChatEvent.tool_result` enriched with full per-call payload (arguments, result, is_error, error_message, duration_ms) and `ChatEvent.done` / `ChatEvent.error` carry the `content` blocks + token sums for BR-29 persistence. (e) §4 Business Rules: BR-01..BR-24 preserved (turn semantics unchanged) with edits to "Where to validate" reflecting the new repository + service split; added BR-25..BR-40 (archived = no-write, Idempotency-Key required, idempotent replay, single in-flight turn, persistence sequencing, conversation create body, context reconstruction, tool-call persistence, rolling summary, title distillation, conversation listing pagination, patch body, cascade delete + compliance exclusion, cancel endpoint, message listing pagination, usage aggregation). (f) §5 State machine extended: added ST-01 conversation lifecycle; ST-02 turn lifecycle now includes the `user_row_persisted`, `replay_open`, and `assistant_row_persisted` states. (g) §7 External Integrations: added the utility-model call (`CHAT_UTILITY_MODEL` for distillation jobs) and the chat-owned Neon writes. (h) §8 env table adds five additive optional vars (`CHAT_UTILITY_MODEL`, `CHAT_SUMMARY_AFTER_TURNS`, `CHAT_RECENT_WINDOW`, `CHAT_TITLE_ENABLED`, `CHAT_SUMMARY_ENABLED`). (i) §9 pino schema gains `conversation_id`, `message_id`, `idempotent_replay`; new counters/histograms for replay, in-progress conflict, summary refresh, title distillation. (j) §10 error catalog: 3 new business codes (`BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`, `BUSINESS_IDEMPOTENCY_MISMATCH`) registered in `service/errors.ts`. (k) §11 budgets refined with the chat-table DB cost; §12 constraints add the in-process turn registry, distillation fire-and-forget model, `(content, model)` comparator caveat; §13 out-of-scope reaffirms the BACKEND-ONLY scope and the migration-not-applied stance. (l) PRESERVED from v1: agentic loop semantics, READ-ONLY tool catalog, SSE framing, sanity ceilings, abort semantics, pino observability shape (extended). | -- |
| 2.1.0 | 2026-06-21 | Back Spec Agent | minor (additive) | **Chat-Graph projection (additive 7th SSE frame).** Adopts `openapi.yaml` v2.1.0. Source: `temp/chat-graphspace-plan.md` (rev. 2026-06-21) §4.1 wire format + §9 Fase B + AC-B.7. (a) Header amended with the v2.1 additive deviation paragraph documenting the route-owned `graph_delta` projection. (b) §1.1 file layout extended with `service/graph-normalizer.ts` (pure projection + dispatcher; consumes `CatalogSnapshot.linkTypeByName` and `findNodesByIds` from `knowledge-graph`). (c) §1.1 boundary note rewritten: the chat module is now permitted READ-ONLY imports of `CatalogSnapshot` (type) and `findNodesByIds` (value) from `knowledge-graph`; the `query-retrieval` boundary remains intact. (d) §1.2 `ChatEvent` union extended with a `graph_delta` variant (route-owned synthesis — the agent service NEVER yields it); new wire types `GraphNodeWire` / `GraphLinkWire` (snake_case). (e) NEW §4 BR-41 documents the projection contract end-to-end: trigger (`ok=true` + graph tool name), per-tool normalization (traverse / get_node / list_nodes / search-with-hydration), wire emission ordering (always AFTER the originating `tool_result`), defensive WARN-and-skip on exception, non-persistence, and non-replay. (f) §5 ST-02 transition row `tool_running -> iteration_completed (ok)` annotated with the `graph_delta` emission contract. (g) §7 External Integrations: new row for `findNodesByIds` consumption (search hydration / G-A); same Neon pool, no new connection. (h) §9 WARN log shapes: added `chat.graph_delta_normalize_failure`. (i) §11 budgets: new `graph_delta projection p95 < 50 ms` line. (j) §12 known constraints: catalog-snapshot dependency, non-persistence, non-replay. (k) Search hydration G-A deviation registered as a normative note inline in BR-41 (chat module imports `findNodesByIds`; `query-retrieval` boundary preserved). PRESERVED from v2.0: all existing BRs (no renumbering, no removals), data model unchanged, no new env var, no migration. | -- |
