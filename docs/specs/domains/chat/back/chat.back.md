# Chat -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 (Neon) — owns 4 tables (`chat_conversation`, `chat_message`, `chat_tool_call`, `chat_graph_view`) + 1 enum (`chat_message_role`) via migrations `0004_chat_persistence.sql` + `0005_chat_graph_view.sql` | Version: 2.5.0 | Status: draft | Layer: permanent
> Business spec: `../chat.spec.md` (v2.3.0)
> REST contract: `../openapi.yaml` (v2.3.0)
> Migration spec artifact: `./0004_chat_persistence.sql`
> Normative deviation: this domain is an ADDITIVE deviation from `/remember-modelagem-v7.md` (which does not specify a chat surface). The inegociable rule of v7 §2 holds: the LLM never reaches the database directly; every tool opens its own short `BEGIN READ ONLY` transaction. The chat domain itself OWNS its own writes (conversation CRUD + message persistence) — those run via `withTransaction` on the BFF, NOT via tools. The v7 §11 compliance flow does NOT walk into chat tables (BR-37 of `.spec.md` / §6 of `.spec.md` "Compliance §11 note"). Reconcile via a future `/u-improve` pass that amends v7 §2 with the stateful chat transport.
>
> **v2.1 additive deviation (Chat-Graph projection).** The `sendMessage` SSE stream now emits a 7th frame, `graph_delta`, ONLY after a `tool_result` whose tool is one of the four graph-producing query tools (`traverse`, `get_node`, `list_nodes`, `search`). The frame carries a normalized subgraph projection (`{source_tool, nodes[], links[]}`) consumed by the SPA `GraphSpace`. The projection is route-owned (synthesised AFTER the `tool_result` event yielded by the agentic loop) — the agent service does NOT see this frame and the LLM is not aware of it. Frame is OBSERVATIONAL only — it carries no instructions and no new data beyond what the `tool_result` already produced. See BR-41. The `search` projector hydrates `items(kind=node).id` via `findNodesByIds` (one batched read; §4.1 G-A) to supply `node_type` + `canonical_name` — fields the `search` envelope itself does not carry. Source plan: `temp/chat-graphspace-plan.md` (rev. 2026-06-21) §4.1 / §9 Fase B / AC-B.7.
>
> **v2.2 bugfix (Faithful multi-row persistence of the agentic turn).** Owner-approved 2026-06-21. v2.0 / v2.1 persisted an agentic turn as ONE assistant `chat_message` row whose `content` carried the accumulated text + raw `tool_use` blocks but NOT the matching `tool_result` blocks (those lived only in audit `chat_tool_call` rows). The `context-builder` (BR-31) maps each persisted row 1:1 to an Anthropic `MessageParam` with `content` passed verbatim — so on the NEXT turn the rebuilt history contained an assistant `tool_use` with no following `tool_result`, and Anthropic rejected the request with HTTP 400 (`tool_use ids were found without tool_result blocks immediately after`). The stream rejected mid-flight via BR-11 and the user saw `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. The same bug broke fire-and-forget title/summary distillation (BR-33 / BR-34) — identical 400 surfaced as `chat.title_distillation_failure`. The fix changes BR-29 sequencing: each agentic iteration now persists as the correct Anthropic message sequence ACROSS SEPARATE `chat_message` rows — assistant `[optional text, tool_use(s)]`, then user `[tool_result block(s)]`, repeated once per tool-bearing iteration, followed by a final assistant `[text]` row. Replaying rows 1:1 (BR-31) and slicing the older window for distillation (BR-33) now yield a VALID Anthropic sequence by construction. The model also sees its own tool-calling history on later turns. NO migration required — `chat_message.content jsonb` is already polymorphic enough to carry `tool_use` and `tool_result` content blocks; the `chat_message_role` enum stays `{user, assistant}` (BR-02). BR-32 (`chat_tool_call` audit trail) is preserved as-is — the audit row is no longer the SOLE persistence surface for tool calls but stays as the structured per-call payload (full input/result/timing) for `getConversationUsage` (BR-40) and audit dumps. Tests gap that let it ship: existing coverage was single-turn or text-only multi-turn; v2.2 mandates a multi-turn regression test where turn 1 invokes a tool and turn 2 then succeeds (§1 Testing row).

> **v2.3 additive deviation (Per-conversation graph-view snapshot).** The `GET/PUT /conversations/:id/graph` endpoints persist and restore the graph-view snapshot for each conversation. Snapshot is a **view memento** (last version shown to the user) — NOT re-projected from the knowledge graph on load. New table `chat_graph_view` (migration `0005`); new repository functions `getConversationGraphView`/`upsertConversationGraphView`; REST-only, JWT-gated, outside §11 compliance. See BR-42.

> **v2.4 additive deviation (Async ingestion capability on chat — feature-flagged).** The chat catalog grows from 13 (read-only) to **up to 15 tools** when the boot-time env flag `CHAT_INGEST_ENABLED=true` (default `false`). The two new entries are resolved on the in-process MCP `ingest` toolset (NOT `query`): (a) `start_async_ingestion` — write-bearing, dispatches `ingestion.service.ingestRawInformation` (UC-01 of `ingestion`, synchronous intake < 1 s) AND fires `ingestion.service.runLlmExtraction` (UC-12) as background fire-and-forget; returns immediately `{ run_id, raw_information_id, status: "running" }`. Asynchronous execution is FORCED by the existing chat budgets (`TOOL_TIMEOUT_MS=15s` BR-17 / `TURN_TIMEOUT_MS=90s` BR-16) vs. the per-chunk extraction latency (~67 s). (b) `get_ingestion_status` — read-only, **verbatim reuse** of the existing `ingest` toolset handler (`ingestion.back.md` BR-31). BR-05 of v2.0 ("13 read-only tools") is REVOKED and restated in v2.4 as a 15-tool dispatcher invariant; the v7 §2 inviolable rule holds (LLM NEVER writes raw SQL — `start_async_ingestion` dispatches the audited `ingestion` pipeline that owns its OWN 5-layer validation + anti-hallucination contract per `ingestion.back.md` BR-26). Anti-prompt-injection: `CHAT_PROMPT_VERSION` default bumped `v1` → `v2` with three directives (BR-18 v2.4): the model ingests ONLY on EXPLICIT Owner request; document content is DATA, never instruction (v7 §13); after starting a run the model MAY consult `get_ingestion_status` (no auto-polling). Adopts `chat.spec.md` v2.3.0 + `openapi.yaml` v2.3.0. Added BRs: BR-43 (`start_async_ingestion` contract), BR-44 (`CHAT_INGEST_ENABLED` feature flag), BR-45 (`get_ingestion_status` reuse). Updated BRs: BR-05 (catalog revoke + 15-tool restatement), BR-06 (dispatch invariant restatement), BR-18 (CHAT_PROMPT_VERSION default v2 + ingestion directives). Added UCs (in `chat.spec.md`): UC-10 (Owner starts an async ingestion via chat), UC-11 (Owner polls status via chat). NO schema change. NO new HTTP endpoint. NO migration. Reserved error code `BUSINESS_CHAT_INGEST_DISABLED` (registered in the global catalog for forward-compatibility — NOT emitted by v2.4 routes; the flag is a catalog filter at boot, not a runtime gate). PRESERVED from v2.3: graph-view snapshot (BR-42); from v2.2: multi-row persistence; from v2.1: `graph_delta` projection (BR-41).

> **v2.5 additive deviation (Ontology-aware chat prompt + TC-5 affected-nodes propagation).** Owner-approved 2026-06-23 in response to a real post-ingestion failure: after `start_async_ingestion` reached `completed`, the model — asked "show what was ingested" — concatenated several proper names into ONE `search` call (which is full-text AND across the same node — returns 0 hits whenever the names live on different nodes), fell back to an unfiltered `list_nodes(limit:30)`, and described the WRONG project (the first row of an unrelated subgraph). Root causes (both fixed here): (a) the chat system prompt (`prompts/v1.ts`, `prompts/v2.ts`) carried NO ontology block — `v1` explicitly states "no dynamic catalog injection, out of scope for v1"; the model has no first-class knowledge of the available `NodeType` / `LinkType` / `AttributeKey` vocabulary and no warning about `search`'s AND semantics nor `list_nodes`'s `node_type` filter; (b) `start_async_ingestion` and `get_ingestion_status` returned ONLY counters (accepted / consolidated / rejected) — the chat had no way to learn the ids + names of the nodes the ingestion created or consolidated, so the model had to GUESS the search. v2.5 lands `CHAT_PROMPT_VERSION=v3` (new; `v1`/`v2` preserved verbatim in the registry; default bumped `v2` → `v3`) — an ontology-aware turn prompt with three blocks: (4A) **ONTOLOGY BLOCK** rendered from the boot-time `CatalogSnapshot` (catalog of `NodeType` / `LinkType` / `AttributeKey` with their canonical names + one-line descriptions; today 10 NodeTypes / 13 LinkTypes / 19 AttributeKeys — fluid, data-driven per `ontology-extension-playbook` — adding new types is migration + restart with no code change here); (4B) **SEARCH DISCIPLINE** explicit directives (search is lexical AND — one specific name per call, NEVER concatenate multiple proper nouns; `list_nodes` MUST carry a `node_type` filter when used as "what exists in category X" — never as a blind enumeration; use `list_node_types` / `list_link_types` / `list_attribute_keys` to discover vocabulary on demand); (4C) **POST-INGESTION PLAYBOOK** explicit recipe — after `get_ingestion_status` returns `completed`, the model MUST use the TC-5 `affected_nodes` array (ids + canonical_name + node_type) returned by the ingestion tools to do DIRECT `get_node` / `traverse` lookups; if `affected_nodes` is empty or absent, fall back to one-name-per-`search`, with `list_nodes` filtered by a plausible `node_type`; cite provenance via `raw_information_id`; NEVER present the first row of an unfiltered `list_nodes` as "what was ingested". TC-5 is the matching contract change (cross-spec — see `ingestion.back.md`): `start_async_ingestion` and `get_ingestion_status` tool envelopes are extended with an OPTIONAL `affected_nodes` field — array of `{id: uuid, canonical_name: string, node_type: string}`. `start_async_ingestion` populates the field on `outcome: "ingested"` ONLY when intake is dedupe-no-op (rare; empty on the synchronous intake path because extraction has not yet run); the actual list is populated by `get_ingestion_status` once `LLMRun.status === 'completed'`. The `ingest-adapter` propagates the field VERBATIM from the `ingestion` service response to the chat tool envelope (no chat-side transformation). Signature change inside chat: `ChatPromptModule.system()` becomes `ChatPromptModule.system(catalog: CatalogSnapshot)`. The catalog is already threaded into `registerChatRoutes` (`ChatRouteDeps.catalog`, BR-41); it now ALSO flows into `context-builder.buildModelContext({pool, conversation, recentLimit, catalog})` and through into `selectChatPromptModule(env.CHAT_PROMPT_VERSION).system(catalog)`. **Cache-control invariant preserved:** the catalog snapshot is loaded once at boot (see `knowledge-graph.back.md` BR-23 — restart required to refresh after a migration), so the rendered ontology block is BYTE-STABLE for the process lifetime — `system` text is identical across every turn and every conversation — and the existing Anthropic `cache_control` header marking the system+tools prefix as cacheable (P0 of `llm-cost-audit` memory; "Configuration / Environment" / BR-21 default-factory) STAYS VALID. No new env var; no migration; no new HTTP surface. Added BR: none (re-uses BR-18 v3, BR-43 amendment for affected_nodes, BR-45 amendment for affected_nodes). Updated BRs: BR-18 (v3 ontology-aware prompt — three blocks 4A/4B/4C; `system(catalog)` signature; `CHAT_PROMPT_VERSION` default v2→v3); BR-43 (`start_async_ingestion` envelope extended with optional `affected_nodes[]` — empty on synchronous-intake path); BR-45 (`get_ingestion_status` envelope extended with optional `affected_nodes[]` — populated when `status === 'completed'`). PRESERVED from v2.4: catalog gating (BR-05 / BR-44 — `CHAT_INGEST_ENABLED`); dispatch invariant (BR-06); from v2.3: graph-view snapshot (BR-42); from v2.2: multi-row persistence; from v2.1: `graph_delta` projection (BR-41).

---

## 1. Stack and Patterns

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves the consolidated `openapi.root.yaml`; this domain adds a `$ref` to `domains/chat/openapi.yaml`) | CLAUDE.md default |
| Streaming transport | Server-Sent Events on `POST /api/v1/conversations/:id/messages`. Implementation: `reply.hijack()` followed by direct writes to `reply.raw` (the same Fastify-bridge pattern used by the MCP SDK transport `backend/src/mcp/sdk-http-transport.ts` at lines 172-173 — `reply.hijack()` + write to `reply.raw`). Required response headers set BEFORE the first write: `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`. Each frame is written as `event: <name>\ndata: <JSON>\n\n` (one event per frame, no batching — BR-08). | New (this domain). |
| MCP integration | This domain does NOT register tools on the MCP server. It CONSUMES the in-process `McpServer` registry (`backend/src/mcp/server.ts` — `McpServer.getTool(toolset, name)`) as a read-only catalog. The registry is populated at boot by `query-retrieval` and `knowledge-graph` (`knowledge-graph.back.md` BR-23) AND, from v2.4, by `ingestion` (the `ingest` toolset registers `start_async_ingestion` + `get_ingestion_status` among its other write tools). `buildChatToolCatalog(mcp, env)` is resolved lazily on the first chat request and the resolved catalog is cached for the process lifetime (BR-05 v2.4). When `env.CHAT_INGEST_ENABLED === true` the catalog resolves the 13 `query` names PLUS `start_async_ingestion` + `get_ingestion_status` from the `ingest` toolset (15 names total, BR-44); when `false` the catalog resolves the 13 `query` names only. `registerChatRoutes(scoped, deps)` is mounted on the `/api/v1` scope ONLY when the resolved query portion is non-empty (`catalog !== undefined`); when `CHAT_INGEST_ENABLED=true` but the `ingest` toolset does not expose the two names, the BFF logs ERROR at boot and mounts the chat routes with the 13-tool catalog only (defensive degradation — BR-05 v2.4). | New (this domain). | **v2.5 — ontology snapshot threading:** the `CatalogSnapshot` already forwarded to `registerChatRoutes` (via `ChatRouteDeps.catalog` — see BR-41 `graph_delta`) is now ALSO threaded into `context-builder.buildModelContext({..., catalog})` and into `selectChatPromptModule(env.CHAT_PROMPT_VERSION).system(catalog)` (BR-18 v3). The snapshot is boot-time stable (process lifetime; restart to refresh — `knowledge-graph.back.md` BR-23); the rendered ontology block in the system prompt is therefore byte-stable across all turns of the process and the Anthropic `cache_control` prefix stays valid. The catalog reference is the SAME object instance passed today to the `graph-normalizer`; no extra wiring at boot — only the `system()` signature widens. |
| ORM | None — raw `pg` parameterized queries (A6, §2.2). The chat domain OWNS three tables (see §2) and reads/writes them through a dedicated repository layer (`chat.repository.ts`). Tool calls (issued by the agentic loop into other domains) still go through the existing `*Service.*` layer of `query-retrieval` / `knowledge-graph`. | CLAUDE.md default |
| Migration strategy | ONE migration: `migrations/0004_chat_persistence.sql`. The spec artifact lives at `docs/specs/domains/chat/back/0004_chat_persistence.sql` — dev team copies/adapts under CLAUDE.md "Safety Rule — Database Changes Require Explicit Approval". The migration is additive (no edits to existing tables) and uses the existing `set_updated_at()` trigger function defined in `migrations/0001_init.sql` line 108 — DO NOT redefine. | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/chat/`. Layers: `routes` (Fastify handlers + Zod schemas, SSE framing) -> `service` (agentic loop, conversation service, context builder, distillation) -> `repository` (raw `pg` queries on chat tables). The agentic loop consumes the resolved tool catalog and the Anthropic client factory. | Aligned with CLAUDE.md `folder_structure: modules`. |
| Validation library | Zod v4. Body schemas mirror the OpenAPI v2.0.0 components: `CreateConversationRequest`, `UpdateConversationRequest`, `SendMessageRequest`. Header validators: `Idempotency-Key` is `z.string().uuid()` (BR-26 of `.spec.md`). Failure -> 422 BEFORE the SSE is opened (BR-23). | CLAUDE.md default |
| Auth | `requireNeonAuth` preHandler inherited from the `/api/v1` scope (CLAUDE.md "Authentication"). No additional auth check inside chat handlers. Owner-only model (v7 §2.3 / ADR A20) holds — no `user_id` column on any chat table. In development the carve-out `LOCAL_OPERATOR_TOKEN` works transparently because it is enforced by the inherited preHandler. | CLAUDE.md default |
| Logging | `pino` structured JSON. One INFO record per completed turn (`event: "chat.turn"`) with fields per BR-19 of `.spec.md` and §9 below. NEVER logs `messages[i].content`, raw tool inputs, raw tool result bodies, or `args_summary` raw values. Distillation jobs log `chat.summary_refresh_*` / `chat.title_distillation_*` at INFO on success and WARN on failure (BR-33 / BR-34). DEBUG level may sample structural diagnostics but never PII. | CLAUDE.md default |
| Observability | `observability_required: true`. Counters: `chat_turn_total{stop_reason}`, `chat_turn_idempotent_replay_total`, `chat_turn_in_progress_conflict_total`, `chat_summary_refresh_total{ok}`, `chat_title_distillation_total{ok}`. Histograms: `chat_turn_latency_ms`, `chat_turn_iterations`, `chat_summary_refresh_latency_ms`, `chat_title_distillation_latency_ms`. Reuses the pino transport (parallel to ingestion run metrics). | CLAUDE.md default |
| Transaction policy | FOUR distinct transaction shapes inside the chat domain (v2.2). (i) Owned WRITES on chat tables — conversation CRUD, user natural-language row insert, per-call `chat_tool_call` audit insert, final assistant row insert, summary/title updates — run via `withTransaction(pool, ...)` — the SAME helper already exported by `curation/service/transaction.ts` line 10. (ii) v2.2 NEW: per-iteration `(assistant, synthetic_user)` row pair inserts (BR-29 step 6.d) run inside their OWN dedicated short `withTransaction` so the pair is atomic — a half-persisted pair would re-introduce the next-turn bug. One `withTransaction` per iteration boundary, NOT one for the whole turn — committing between iterations bounds the rollback radius on a mid-turn failure. (iii) Owned READS on chat tables (`getConversation`, `listConversations`, `listMessages`, `getConversationUsage`, context-builder reads) run via `withReadOnly(pool, ...)` — line 32 of the same file. (iv) Tool invocations issued by the agentic loop are still v7 §2 inegociable: each tool opens its OWN short `BEGIN READ ONLY` inside its own service code (existing behaviour preserved from v1). The chat route never bundles a tool call into one of its own transactions — the transactional boundaries do NOT overlap. | New (this domain). |
| Concurrency | (a) Multiple concurrent chat turns share the same `McpServer` registry instance and a single Anthropic client (instantiated once at first request). (b) Tool calls INSIDE a single turn are sequential (`tool_choice.disable_parallel_tool_use = true`, BR-22 of `.spec.md`). (c) At most ONE in-flight turn per conversation is enforced by an in-process registry (`Map<conversation_id, AbortController>`), keyed by conversation id (BR-28 of `.spec.md`). The registry is process-local; v1 is single-instance BFF — see §7 constraint "Multi-instance BFF". (d) Distillation jobs (BR-33, BR-34) are fire-and-forget Promise chains scheduled AFTER the HTTP response has terminated; they hold no shared lock — overlap is acceptable (idempotent `UPDATE`). | New (this domain). |
| Time source | `Date.now()` for the wall-clock budgets (`TURN_TIMEOUT_MS`, `TOOL_TIMEOUT_MS`) and the per-turn `latency_ms`. SQL `now()` for `created_at` / `updated_at` defaults — server-clocked. No domain-owned use of `canonical_date` / `canonical_number` (those belong to v7 §6). | CLAUDE.md default |
| External integration | Anthropic Messages API (streaming). Reuses the `defaultAnthropicFactory` pattern from `modules/ingestion/service/extraction.service.ts` (lines 177-198): `type AnthropicFactory = (apiKey: string) => AnthropicLike` with default constructing the SDK client from `env.ANTHROPIC_API_KEY` using `timeout: 5 * 60 * 1000` and `maxRetries: 2`. TWO models used: the turn model `env.CHAT_MODEL` (default `claude-opus-4-8`) and the utility model `env.CHAT_UTILITY_MODEL` (default `claude-haiku-4-5`) for distillation jobs. Tool catalog: 13 read-only `query` tools resolved via `mcp.getTool('query', name)` ALWAYS, plus 2 `ingest` tools (`start_async_ingestion`, `get_ingestion_status`) resolved via `mcp.getTool('ingest', name)` when `env.CHAT_INGEST_ENABLED === true` (BR-05 v2.4 / BR-44). v2.4: SERVICE-LEVEL dependency on `ingestion` for `start_async_ingestion` (BR-43): the chat tool dispatcher invokes `ingestion.service.ingestRawInformation` (UC-01 of `ingestion`, synchronous intake) inside the tool-call wall-clock budget (BR-17), then schedules `ingestion.service.runLlmExtraction` (UC-12) as fire-and-forget — the chat turn does NOT await extraction. The independent ingestion model selection (`env.INGEST_MODEL`, default `claude-sonnet-4-6` per `ingestion.back.md`) is owned by `ingestion`'s extraction service; the chat turn forwards the tool-supplied `model?` argument as-is. | New (this domain). |
| Testing | Vitest unit tests on (i) Zod schemas for the 4 body shapes + the `Idempotency-Key` header (BR-26), (ii) `conversation.service` CRUD + RESOURCE_NOT_FOUND mapping (BR-22), (iii) `context-builder.ts` reconstruction (BR-31: system prompt + summary block + recent window), (iv) `chat.repository` idempotency partial-index conflict path (BR-27), (v) `chat-agent.service.runTurn` agentic loop against a stub Anthropic client covering UC-02..UC-06 + UC-07 replay path, (vi) the per-turn registry that enforces BR-28, (vii) the persistence-sequencing sequencing in `chat.routes.ts` (user natural-language row BEFORE hijack; per tool-bearing iteration one assistant row carrying text+tool_use blocks AND one user row carrying tool_result blocks AFTER the iteration completes; final assistant row carrying the closing text AFTER the terminal frame; `chat_tool_call` audit rows during the loop — BR-29 / BR-32), (viii) `distillation.service.ts` fire-and-forget rolling-summary + title jobs (BR-33 / BR-34) using stub utility model + assertion that the HTTP response is not awaiting the job, (ix) cascade behaviour of `deleteConversation` (BR-37), (x) `cancelTurn` registry interaction (BR-38), (xi) cursor pagination on `listConversations` (BR-35) + `before` pagination on `listMessages` (BR-39), (xii) compliance §11 exclusion is a NEGATIVE TEST: the compliance walker does not visit chat tables (sentinel row survives a `compliance_delete`), (xiii) **v2.2 mandatory regression (the coverage gap that let the multi-turn provider_error bug ship):** a multi-turn integration test where turn 1 invokes a tool (e.g. `list_node_types`) AND turn 2 then issues a follow-up `sendMessage` on the SAME conversation; the test MUST assert that turn 2 reaches `ChatEvent.done` (NO `ChatEvent.error`, NO `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`) AND that the Anthropic `messages[]` passed by the route to `runTurn` on turn 2 is a VALID sequence (every `tool_use` block is followed by a `user` message whose first content block is a matching `tool_result` with the same `tool_use_id`). A real-LLM 2-turn E2E is preferred where credentials are available (create conversation → turn 1 "quantos tipos de no existem?" → turn 2 follow-up → assert no `provider_error`); dev token + UUID `Idempotency-Key` header required; BFF running on `:3000`. (xiv) **v2.2 mandatory regression on distillation:** a unit test on `distillation.service.maybeRefreshSummary` / `.maybeDistillTitle` that runs against a conversation whose older slice contains a tool-bearing iteration; the stub utility-model client MUST assert the `messages[]` it receives is a VALID Anthropic sequence (no dangling `tool_use`). (xv) **v2.4 catalog gating tests (BR-05 / BR-44):** unit test on `buildChatToolCatalog(mcp, env)` asserting that `env.CHAT_INGEST_ENABLED=false` yields exactly 13 names (the 13 `query` entries) AND that `env.CHAT_INGEST_ENABLED=true` yields exactly 15 names with `start_async_ingestion` + `get_ingestion_status` resolved on the `ingest` toolset; defensive-degradation test asserting that `CHAT_INGEST_ENABLED=true` with `ingest` toolset missing the two names mounts the route with 13 names + boot ERROR log. (xvi) **v2.4 `start_async_ingestion` dispatch test (BR-43):** stub `ingestion.service.ingestRawInformation` returning `{ raw_information_id, llm_run_id, outcome: "ingested", chunk_count }` < 1 s; stub `ingestion.service.runLlmExtraction` capturing the scheduled call WITHOUT executing; assert the dispatcher (1) emits `tool_result{tool:"start_async_ingestion", ok:true}` with `result.status="running"`, (2) persists a `chat_tool_call` row with full arguments + result (BR-32), (3) does NOT await `runLlmExtraction` (the chat HTTP response terminates while the stub is still pending), (4) attaches a `.catch(...)` handler to the background promise that logs `chat.ingest_extraction_background_failure` on rejection (BR-43 step 6). Companion: dedupe test asserting that `outcome:"noop_existing"` from intake yields `tool_result.result.outcome="already_ingested"` AND DOES NOT schedule a second extraction. (xvii) **v2.4 `get_ingestion_status` reuse test (BR-45):** unit test asserting that `mcp.getTool('ingest', 'get_ingestion_status')` is invoked verbatim (same Zod schema, same `BEGIN READ ONLY`, same envelope) and that a `chat_tool_call` audit row is persisted (BR-32). (xviii) **v2.4 layered-validation error mapping test (BR-43 step 2):** stub `ingestRawInformation` rejecting with the ingestion layered-validation error; assert the dispatcher emits `tool_result{ok:false}` carrying envelope `{ error.code: "STRUCTURAL_INVALID" }` AND that the loop CONTINUES (the turn does NOT abort — failed tool_result block fed back to the model). No acceptance scenario from v7 §17 maps to this domain (deviation). (xix) **v2.5 ontology-block rendering test (BR-18 v3, block 4A):** unit test on `prompts/v3.ts:system(catalog)` asserting (a) the rendered system prompt is BYTE-STABLE across two invocations of `system(sameCatalogRef)` (cache-control invariant; same hash -> cache hit); (b) the rendered text contains the canonical name and description of EVERY `NodeType` in the supplied catalog (no truncation, no omission), every `LinkType` name+description, and every `AttributeKey` name; (c) adding a new `NodeType` to the catalog snapshot fixture causes the rendered text to change AND the hash to differ (sensitivity); (d) the rendered text does NOT contain hardcoded type names from the v2 / v1 prompts (no leftover stub list). (xx) **v2.5 search-discipline directive test (BR-18 v3, block 4B):** assertion-only — the rendered system prompt MUST contain the strings (regex-matched, in pt-BR) corresponding to: (1) `search` is lexical AND; (2) one specific name per call; (3) `list_nodes` MUST take `node_type` when used as enumeration of a category; (4) `list_node_types` / `list_link_types` / `list_attribute_keys` as discovery primitives. Failing any string is a build-time test failure (regression guard against accidental directive drops in future prompt revisions). (xxi) **v2.5 post-ingestion playbook test (BR-18 v3, block 4C):** rendered text MUST contain the directive that after `get_ingestion_status` returns `completed`, the model MUST use the `affected_nodes` field when present to do direct `get_node`/`traverse` lookups, falling back to one-name-per-`search` otherwise; assert presence by regex. (xxii) **v2.5 TC-5 propagation test (BR-43 / BR-45 affected_nodes):** stub `ingestion.service.getIngestionStatus(llm_run_id)` returning a payload with `affected_nodes: [{id, canonical_name, node_type}]`; assert the `ingest-adapter` (BR-43) AND the `get_ingestion_status` dispatch path (BR-45) propagate `affected_nodes` VERBATIM into the chat tool envelope `result.affected_nodes` — no transformation, no truncation, no enrichment. Companion: when the field is absent on the ingestion response, the chat tool envelope omits the key entirely (NOT set to `[]` or `null`). (xxiii) **v2.5 prompt-version registry test (`prompts/index.ts`):** `selectChatPromptModule(v3)` returns the v3 module; `v2` and `v1` continue to resolve (no regression); any other string throws `UnknownChatPromptVersionError`. Also assert `env.CHAT_PROMPT_VERSION` defaults to `v3` when unset. (xxiv) **v2.5 real-LLM regression on the original failing scenario (preferred when credentials available):** drive a 2-turn live BFF + SPA test where turn 1 ingests a small fixture document containing two unrelated proper nouns AND turn 2 asks what was just ingested — assert (a) turn 2 reaches `ChatEvent.done` with `stop_reason: end_turn`; (b) the model final text mentions BOTH proper nouns from the fixture (proof that the playbook of block 4C steered it past the v2.4 failure mode); (c) `tools_called[]` shows EITHER `get_node` calls keyed by the `affected_nodes` ids OR multiple single-name `search` calls — but NEVER a single multi-name concatenated `search`; (d) `tools_called[]` does NOT contain an unfiltered `list_nodes(limit:30)` immediately preceding the answer. This is the integration regression that proves the spec change closes the loop the v2.4 catalog gating opened. | CLAUDE.md default |

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
                               #       Persists chat_tool_call audit rows as
                               #       tool_result events fire (BR-32).
                               #     - v2.2: accumulates per-iteration content
                               #       (text + tool_use blocks) on the route side
                               #       and, AT EACH ITERATION BOUNDARY (when the
                               #       model hands control back for tool dispatch
                               #       and a new iteration is about to begin),
                               #       inserts ONE assistant chat_message row
                               #       carrying `text + tool_use` blocks AND ONE
                               #       synthetic user chat_message row carrying
                               #       the matching `tool_result` blocks — both
                               #       inside the SAME withTransaction (BR-29
                               #       step 6.d). Atomicity is non-negotiable.
                               #     - On terminal frame, deregisters the abort
                               #       controller and inserts the FINAL assistant
                               #       chat_message row (BR-29 step 8.a) carrying
                               #       the closing text + stop_reason + token
                               #       sums + latency_ms.
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
    context-builder.ts         # buildModelContext({pool, conversation, recentLimit, catalog}):
                               #   Reconstructs the Anthropic messages[] from the DB
                               #   (BR-31). v2.5: signature widens with REQUIRED
                               #   `catalog: CatalogSnapshot` — forwarded into the
                               #   prompt module's `system(catalog)` call (BR-18 v3,
                               #   block 4A). Same `CatalogSnapshot` reference
                               #   already passed to the route via ChatRouteDeps
                               #   (BR-41) — no extra wiring at boot. Steps:
                               #     1. system prompt
                               #        (selectChatPromptModule(env.CHAT_PROMPT_VERSION)
                               #         .system(catalog)).
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
                               #   the result. v2.5 invariant: the catalog is loaded
                               #   ONCE at boot — `system(catalog)` is byte-stable
                               #   per process; the Anthropic `cache_control` prefix
                               #   stays valid (P0 prompt-caching invariant).
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
                               #   v2.2: ALSO yields `tool_use_id` on BOTH
                               #   `tool_start` and `tool_result` AND yields
                               #   `iteration_end{iteration, assistant_content}`
                               #   at each agentic-loop iteration boundary so
                               #   the route can persist the per-iteration
                               #   assistant row + synthetic user tool_result
                               #   row pair (BR-29 step 6.d). `tool_use_id`
                               #   matches the Anthropic SDK's `tool_use.id`
                               #   verbatim; the synthetic user row uses it as
                               #   `tool_result.tool_use_id`. The agent service
                               #   itself does NOT touch the DB — it only emits
                               #   the events; the route is the single
                               #   persistence authority.
    tool-catalog.ts            # buildChatToolCatalog(mcp, env): resolves the
                               #   13 `query` names ALWAYS, plus 2 `ingest`
                               #   names when env.CHAT_INGEST_ENABLED===true
                               #   (start_async_ingestion, get_ingestion_status)
                               #   (BR-05 v2.4 / BR-44). Memoized in module
                               #   scope. Returns ResolvedChatToolCatalog
                               #   | undefined. Defensive degradation: when
                               #   the flag is true but the ingest toolset
                               #   does not expose the two names, returns
                               #   the 13-name catalog and emits a boot ERROR
                               #   log (BR-05 v2.4).
    ingest-adapter.ts          # v2.4 (NEW): dispatcher adapter for the
                               #   `start_async_ingestion` chat tool. Pure
                               #   composition over `ingestion.service`:
                               #     1. Zod-parse the model-supplied args
                               #        (identical shape to ingest_document,
                               #        `ingestion.back.md` BR-30) — fail ->
                               #        STRUCTURAL_INVALID envelope (BR-43
                               #        step 1 / BR-07).
                               #     2. Call ingestion.service.ingestRawInfo
                               #        rmation(content, source_type, meta,
                               #        model, prompt_version) SYNCHRONOUSLY
                               #        (UC-01 of ingestion; < 1 s; opens its
                               #        OWN withTransaction). Maps errors:
                               #        pg-down -> SYSTEM_SERVICE_UNAVAILABLE;
                               #        layered-validation -> STRUCTURAL_INVA
                               #        LID; other -> SYSTEM_INTERNAL_ERROR
                               #        with sanitised message (BR-43 step 2).
                               #     3. If outcome === "ingested", schedule
                               #        runLlmExtraction(llm_run_id) FIRE-AND-
                               #        FORGET (setImmediate or microtask;
                               #        NOT awaited). Attach top-level
                               #        .catch(err => logger.warn({err,
                               #        llm_run_id},
                               #        "chat.ingest_extraction_background_
                               #        failure")) — never throws into the
                               #        request handler (BR-43 step 3 / 6).
                               #     4. If outcome === "noop_existing",
                               #        return tool envelope with
                               #        outcome: "already_ingested";
                               #        DO NOT schedule a second extraction
                               #        (BR-43 step 2).
                               #     5. Return tool envelope
                               #        { ok: true, result: { outcome,
                               #          run_id, raw_information_id, status,
                               #          chunk_count,
                               #          affected_nodes?: Array<{id,
                               #            canonical_name, node_type}> } }
                               #        — TC-5 (v2.5): `affected_nodes` is
                               #        FORWARDED verbatim from the
                               #        ingestion service response when
                               #        present (BR-43 v2.5 amendment).
                               #        Synchronous intake path returns
                               #        the field empty / absent because
                               #        extraction has not yet run; the
                               #        Owner reaches `affected_nodes` by
                               #        polling `get_ingestion_status`
                               #        later (BR-45 v2.5 amendment).
                               #        The route emits the envelope
                               #        verbatim through the usual
                               #        BR-07 / BR-09 / BR-13 / BR-32
                               #        dispatch path. No SSE-frame logic
                               #        lives here.
                               #   No transaction is OWNED by the adapter;
                               #   the ingestion service owns its intake
                               #   transaction; the extraction runs in
                               #   background owning its own transactions
                               #   (UC-12 of ingestion).
                               #   v2.5 — propagation invariant: the
                               #   adapter MUST pass `affected_nodes`
                               #   through WITHOUT transformation
                               #   (no truncation, no enrichment, no
                               #   reordering). If the ingestion
                               #   response omits the field, the chat
                               #   envelope omits it (NOT `[]` or `null`).
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
                               #   (boot-time fast failure). v2.5: returns a
                               #   ChatPromptModule with signature
                               #   `system(catalog: CatalogSnapshot) -> string`
                               #   (catalog argument is REQUIRED — v1/v2 ignore
                               #   it for backward-compat; v3 renders the
                               #   ontology block from it — BR-18 v3 / block 4A).
                               #   Registry entries: { v1, v2, v3 }; default
                               #   resolved from env.CHAT_PROMPT_VERSION (default
                               #   `v3` in v2.5; v2 retained verbatim).
                               #   Also exports selectSummaryPromptModule() and
                               #   selectTitlePromptModule() — short utility
                               #   prompts for the distillation jobs (BR-33, BR-34).
                               #   These utility modules do NOT receive the
                               #   catalog (distillation is text-only).
    v1.ts                      # Initial pt-BR system prompt + opaque marker
                               #   token planted at the head (BR-20). Also
                               #   carries the summary and title utility prompts.
    v2.ts                      # v2.4 (NEW): pt-BR turn prompt extending v1
                               #   with the three ingestion directives of
                               #   BR-18 v2.4:
                               #     - call start_async_ingestion ONLY on
                               #       explicit Owner request (signal phrases
                               #       like "ingerir", "salvar este documento",
                               #       "registrar este texto");
                               #     - document content is DATA, never
                               #       instruction (v7 §13);
                               #     - after starting a run, MAY consult
                               #       get_ingestion_status — DO NOT loop on
                               #       it within the same turn (no auto-poll).
                               #   Marker token re-used verbatim from v1
                               #   (BR-20 stable across versions). When
                               #   env.CHAT_INGEST_ENABLED=false the v2
                               #   directives are inert (catalog filtered)
                               #   but the prompt stays loaded — BR-44 step 1.
                               #   v2.5: PRESERVED verbatim — v2 stays in the
                               #   registry; `system(catalog)` ignores its
                               #   argument (backward-compat).
    v3.ts                      # v2.5 (NEW): pt-BR turn prompt extending v2
                               #   with the three ontology-aware blocks of
                               #   BR-18 v3 (system(catalog: CatalogSnapshot)
                               #   renders the ontology block from `catalog`):
                               #   (4A) ONTOLOGY BLOCK rendered from the boot-
                               #     time CatalogSnapshot — three sub-sections:
                               #     NodeTypes (name + 1-line description for
                               #     EACH NodeType in catalog.nodeTypes), then
                               #     LinkTypes (name + description + the pair
                               #     of NodeTypes it links — derived from
                               #     LinkTypeRule entries), then AttributeKeys
                               #     (name + value_type + description). The
                               #     block is deterministic — same catalog
                               #     ref -> identical bytes (cache-control
                               #     invariant). Today: 10 NodeTypes, 13
                               #     LinkTypes, 19 AttributeKeys (figures from
                               #     ontology-extension-playbook); the playbook
                               #     dictates that growth requires migration +
                               #     restart, so v3 has NO hardcoded type names.
                               #   (4B) SEARCH DISCIPLINE explicit directives:
                               #     - search is lexical AND across full-text
                               #       columns — buscar UM nome específico por
                               #       vez; NUNCA concatenar várias entidades
                               #       num único search (always 0 hits whenever
                               #       the names are on distinct nodes);
                               #     - to list nodes by category use list_nodes
                               #       WITH node_type (single argument from
                               #       the rendered NodeTypes list). NEVER use
                               #       list_nodes WITHOUT node_type as a proof
                               #       of "what exists" — the result is the
                               #       first arbitrary page, not the answer to
                               #       the question;
                               #     - use list_node_types / list_link_types /
                               #       list_attribute_keys to discover
                               #       vocabulary when the rendered block does
                               #       not carry enough detail for the current
                               #       turn (e.g. an exhaustive `value_type`
                               #       list, examples, regex constraints).
                               #   (4C) POST-INGESTION PLAYBOOK explicit recipe:
                               #     - after `start_async_ingestion`, inform
                               #       the Owner the ingestion is running (v2
                               #       directive preserved);
                               #     - after `get_ingestion_status` returns
                               #       `completed`, BEFORE describing what was
                               #       ingested: (1) read `result.affected_nodes`
                               #       (TC-5 — BR-43 / BR-45 amendments): an
                               #       array of `{id, canonical_name, node_type}`.
                               #       When present, do DIRECT `get_node(id)`
                               #       and/or `traverse(start_node_id=id,
                               #       depth=2)` lookups on each id; describe
                               #       only what the lookups returned. (2)
                               #       When `affected_nodes` is empty or
                               #       absent, fall back to one-name-per-
                               #       `search` over the proper nouns the
                               #       Owner mentioned in the input, AND/OR
                               #       `list_nodes(node_type=<plausible>)` —
                               #       NEVER a multi-name concatenated search.
                               #       (3) Cite provenance via
                               #       `raw_information_id` returned by the
                               #       status tool. (4) NEVER present the
                               #       first row of an unfiltered `list_nodes`
                               #       as "what was ingested" — that is the
                               #       v2.4 failure mode v3 explicitly forbids.
                               #   Marker token re-used verbatim from v1
                               #   (BR-20 stable across versions; the marker
                               #   does NOT depend on the catalog).
                               #   IMPLEMENTATION NOTE: `system(catalog)`
                               #   constructs the string as
                               #     marker + persona + ontology_block(catalog)
                               #     + search_discipline + post_ingestion_play
                               #   where `persona`, `search_discipline`, and
                               #   `post_ingestion_play` are static module-
                               #   scope strings (no `Date.now()`, no random
                               #   ids — byte-stable per process). The catalog
                               #   block alone varies between processes (boot
                               #   snapshot diff).
```

> The boundary is enforced by import direction: `routes/` imports `service/`
> and `repository/`; `service/` imports `repository/` and `prompts/`. Nothing
> inside `chat/` imports from `query-retrieval` directly. The allowed
> `knowledge-graph` imports are READ-ONLY: the `CatalogSnapshot` type and the
> `findNodesByIds` repository helper — both required by `graph-normalizer.ts`
> (v2.1, BR-41) for catalog-driven `is_temporal` resolution and search
> hydration. v2.4: `service/ingest-adapter.ts` imports two VALUES from
> `ingestion/service/ingestion.service.ts` (`ingestRawInformation`,
> `runLlmExtraction`) — a registered service-level dependency (BR-43;
> reverse declaration in `chat.spec.md` §7). The `ingestion` service owns
> its OWN transactions, its OWN validation pipeline (5-layer per
> `ingestion.back.md` BR-26), and its OWN error vocabulary; the chat
> adapter only composes the call and maps the result to the chat tool
> envelope. The `McpServer` registry (passed via `deps`) and the resolved
> `McpTool` references it returns remain the only coupling to other domains
> for tool dispatch — `get_ingestion_status` (BR-45) is resolved through
> the registry, NOT imported directly. The chat repository imports `pg`
> (PoolClient) only; it never invokes higher-level services.

### 1.2 ChatAgentService contract

```ts
// service/types.ts (illustrative — back-spec contract, NOT implementation)
export type ChatEvent =
  | { type: "llm_start";   iteration: number }
  | { type: "text_delta";  delta: string }
  // NEW in v2.2 — `tool_use_id` and the model's typed `input` are required so
  // the route can persist the per-iteration assistant row carrying the
  // matching `tool_use` content block (BR-29 step 6.d). The id is the
  // Anthropic SDK's `tool_use.id` verbatim.
  | { type: "tool_start";  tool: string; tool_use_id: string;
                            input: unknown; args_summary: string }
  | { type: "tool_result"; tool: string;
                            // NEW in v2.2 — `tool_use_id` matches the prior
                            // `tool_start.tool_use_id` so the route can
                            // persist the synthetic user row with
                            // `tool_result.tool_use_id` set correctly.
                            tool_use_id: string;
                            ok: boolean;
                            // NEW in v2: full per-call payload for BR-32 persistence.
                            arguments: unknown; result: unknown | null;
                            is_error: boolean; error_message: string | null;
                            // NEW in v2.2 — model-visible (post BR-13
                            // truncation) result body fed back to the next
                            // Anthropic iteration AND persisted as the
                            // synthetic user row's `tool_result.content`.
                            // Distinct from `result` (which is the full,
                            // untruncated audit body persisted on
                            // `chat_tool_call.result`).
                            model_visible_content: unknown;
                            duration_ms: number }
  // NEW in v2.2 — yielded exactly once per agentic-loop iteration that
  // invoked at least one tool, immediately BEFORE the next `llm_start{i+1}`.
  // Carries the iteration's accumulated assistant content (text blocks +
  // tool_use blocks) and the matching tool_result content blocks the route
  // assembled from the iteration's `tool_result` events. The route persists
  // ONE assistant + ONE synthetic user chat_message row atomically on this
  // event (BR-29 step 6.d). NOT written to the SSE wire (internal event;
  // the SDK transport filters it out).
  | { type: "iteration_end";
                            iteration: number;
                            assistant_content: ReadonlyArray<unknown>;
                            tool_results: ReadonlyArray<unknown> }
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

**v2.2 persistence partnership.** The route is the SINGLE persistence
authority for `chat_message` rows. The agent service is the SINGLE source
of event ordering. Per iteration:

1. Agent yields `llm_start{i}`, then any number of `text_delta`, then any
   number of `tool_start` / `tool_result` pairs.
2. If the iteration invoked at least one tool, the agent yields
   `iteration_end{i, assistant_content, tool_results}` BEFORE yielding
   `llm_start{i+1}` — the route persists the per-iteration
   `(assistant, synthetic_user)` chat_message row pair atomically on this
   event (BR-29 step 6.d).
3. The terminal frame is `done` OR `error`. The route persists the FINAL
   assistant row on the terminal frame (BR-29 step 8).

The agent NEVER touches the DB. The route NEVER inspects the in-loop
Anthropic history.

---

## 2. Data Model

> **This domain owns 4 tables and 1 enum** introduced by migrations
> `0004_chat_persistence.sql` (spec artifact: `./0004_chat_persistence.sql`) and
> `migrations/0005_chat_graph_view.sql` (spec artifact: `migrations/0005_chat_graph_view.sql`).
> NO `user_id` column on any of the four — single-owner (v7 §2.3 / ADR A20).
> Chat tables are OUTSIDE the v7 §11 compliance flow — see `.spec.md` §6
> "Compliance §11 note" and BR-37.

### 2.1 Enum `chat_message_role`

```sql
CREATE TYPE chat_message_role AS ENUM ('user', 'assistant');
```

Only two roles are persisted (BR-02 of `.spec.md`); the same enum covers
the natural-language exchange AND the agentic-loop's tool-use / tool-result
exchange.

**v2.2 amendment (multi-row persistence).** Each agentic iteration that
invokes a tool persists as the correct Anthropic message sequence across
separate `chat_message` rows:

1. ONE `assistant` row whose `content` carries any text blocks emitted by the
   model during that iteration FOLLOWED BY one or more `tool_use` blocks.
2. ONE `user` row whose `content` carries the matching `tool_result` block(s)
   — the same `tool_use_id` value(s) in the same order as the preceding
   `assistant` row. This row's `idempotency_key`, `model`, `stop_reason`,
   `tokens_in`, `tokens_out`, `latency_ms` are ALL NULL (it is not a real
   user turn — it is the model's own tool-result delivery, persisted so the
   rebuilt history on the next turn is a valid Anthropic sequence).

The turn closes with ONE final `assistant` row carrying the closing text
blocks AND the terminal `stop_reason` / per-turn aggregates
(`tokens_in`/`tokens_out`/`latency_ms`/`model`). A text-only turn (no tool
call) still persists as ONE user row + ONE final assistant row, identical to
v2.0/v2.1.

The `chat_message.content jsonb` column is already polymorphic enough to
carry `text`, `tool_use`, and `tool_result` content blocks side-by-side
(BR-02 of `.spec.md`) — NO migration required. The route layer is
responsible for distinguishing "natural-language" rows from "synthetic"
rows when surfacing them on `listMessages` (BR-39) — the SPA inspects the
content block types and hides rows whose blocks are exclusively `tool_use`
(assistant) or `tool_result` (user). The audit trail (`chat_tool_call`,
BR-32) is preserved unchanged — it carries the FULL untruncated arguments
and result for `getConversationUsage` (BR-40) and audit dumps, separate from
the replay surface.

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
**Where to validate:** DB enum `chat_message_role` (§2.1) + repository (`insertUserMessage` / `insertAssistantMessage` / `insertSyntheticToolResultUserMessage` / `insertAssistantIterationMessage` choose role at insert time).
**Description:** The persisted role enum is `{user, assistant}` and covers BOTH the natural-language exchange AND the synthetic agentic-loop tool-use / tool-result exchange. v2.2 amendment: the agentic-loop's `tool_use` blocks are persisted on `assistant` rows (alongside any in-iteration text), and the `tool_result` blocks are persisted on `user` rows (synthetic, no `idempotency_key`, no `model`, no `stop_reason`, no token sums). `chat_message.content jsonb` is polymorphic enough to carry `text`, `tool_use`, and `tool_result` content blocks; no migration required. See §2.1 for the multi-row sequencing and the surface-filtering rule on `listMessages` (BR-39).
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

### BR-05 -- Chat tool catalog (v2.4 — 13 read tools + 2 ingestion tools, gated)
**Related UC:** UC-02, UC-10, UC-11
**Where to validate:** route registration + service (`buildChatToolCatalog(mcp, env)` in `service/tool-catalog.ts`)
**Description:** **Revokes** the v2.0 wording ("13 read-only tools"). The chat agentic loop exposes a FIXED 15-tool catalog when `env.CHAT_INGEST_ENABLED === true`, a 13-tool catalog otherwise:
1. 13 read-only `query`-toolset entries (UNCHANGED from v2.0): `get_node`, `traverse`, `get_history_link`, `get_history_attribute`, `get_history_attribute_key`, `list_nodes`, `list_node_types`, `list_link_types`, `list_attribute_keys`, `search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment` — resolved via `mcp.getTool('query', name)`.
2. **v2.4 (NEW)** — 2 ingestion entries, resolved via `mcp.getTool('ingest', name)` AND advertised in the chat catalog ONLY when `env.CHAT_INGEST_ENABLED === true` (BR-44):
   - `start_async_ingestion` — write-bearing chat tool (BR-43). Composes `ingestion` UC-01 + fires UC-12 as background fire-and-forget; returns `{ run_id, raw_information_id, status: "running", outcome, chunk_count }` in < 1 s.
   - `get_ingestion_status` — read-only operational tool reused verbatim from `ingestion.back.md` BR-31 (BR-45).

Resolution is lazy on the first chat request and the resolved catalog is cached for the process lifetime. `registerChatRoutes` is mounted on the `/api/v1` scope only when the `query` portion resolves to non-empty (13 names). When `env.CHAT_INGEST_ENABLED === true` but the `ingest` toolset does NOT expose the two names (registry race / bad rollout), the BFF logs ERROR at boot and mounts the chat routes with the 13-tool catalog only — defensive degradation; the Owner sees no ingestion offer from the model. The 15-tool catalog is the new invariant when the flag is on; no write or curation tool OTHER THAN `start_async_ingestion` is reachable from chat (the four `propose_*` tools require an explicit `llm_run_id` binding that the chat dispatcher does not produce — see BR-06).
**Error returned:** route family not registered (404 on all `/api/v1/conversations*` endpoints) when the query portion fails to resolve; otherwise the catalog gate is silent (no error code; the model simply cannot emit the ingestion tools when the flag is off — defensive BR-10 if the model tries).

### BR-06 -- Tool dispatch obeys the v7 §2 inviolable rule (LLM never writes raw SQL) — v2.4 dispatch invariant
**Related UC:** UC-02, UC-10, UC-11
**Where to validate:** service (the `tools[]` passed to `anthropic.messages.stream(...)` is exactly the resolved chat catalog — 13 names when `CHAT_INGEST_ENABLED=false`; 15 names when `true`, BR-05) + adapter dispatch.
**Description:** v2.4 amends the v2.0 wording ("tools are READ-ONLY"). The v7 §2 inviolable rule is now restated as a **dispatch invariant**, not a catalog invariant:
1. The Anthropic `tools[]` sent on each iteration is exactly the resolved chat catalog (BR-05).
2. Each `query`-toolset invocation opens its own short `BEGIN READ ONLY` transaction (`withReadOnly`); the dispatch path is unchanged from v2.0.
3. The `get_ingestion_status` invocation also opens `BEGIN READ ONLY` (it reuses the `ingestion` read-only handler verbatim — `ingestion.back.md` BR-31; BR-45).
4. The `start_async_ingestion` invocation (BR-43) does NOT open a chat-owned write transaction. It invokes the `ingestion` service (`ingestRawInformation` — `ingestion` UC-01 — opens its OWN write transaction and runs the 5-layer validation + anti-hallucination contract of `ingestion.back.md` BR-26), then schedules `runLlmExtraction` in background (which owns its own transactions per `ingestion` UC-12). The LLM NEVER reaches the database directly; every byte that gets written to `raw_information` / `raw_chunk` / `llm_run` flows through `ingestion`'s audited surface.
5. NO `propose_*` ingestion tool is on the chat catalog. The four `propose_*` operations are reachable ONLY via their dedicated MCP / REST surfaces of the `ingestion` domain (`ingestion.back.md` BR-21/BR-28), which require an `llm_run_id` binding the chat agent does not produce. Defensive BR-10 fires if the model somehow emits one.
6. The chat domain's OWNED writes (conversation CRUD, `chat_message` / `chat_tool_call` / `chat_graph_view` persistence) run under `withTransaction` on the chat repository surface — these are NOT tool calls; the LLM never reaches them.

**Error returned:** n/a (architectural invariant; layered-validation failures from `ingestRawInformation` map to `STRUCTURAL_INVALID` per BR-43 step 2, fed back to the model as a failed `tool_result` block, NOT as a terminal SSE error).

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

### BR-18 -- System prompt persona, language, and safety (v2.5 bumps default to `v3` — ontology-aware)
**Related UC:** UC-02, UC-10, UC-11 + utility-prompt UC implicit in BR-33/BR-34
**Where to validate:** service (`selectChatPromptModule(env.CHAT_PROMPT_VERSION).system(catalog)` in `prompts/index.ts`; the catalog is forwarded by `context-builder.buildModelContext({pool, conversation, recentLimit, catalog})` — see §1.1). The chat-turn prompt is pt-BR. The DISTILLATION prompts (summary, title) are pt-BR utility prompts loaded from the same versioned module — `selectSummaryPromptModule()` and `selectTitlePromptModule()`. Distillation prompts have a stripped persona ("compactador" / "geração de título"), no tool catalog, no ontology block, no marker token.

**Description:** v2.5 bumps the default chat-turn prompt version from `v2` to `v3`. `v1` and `v2` are preserved verbatim for backward-compatibility (`CHAT_PROMPT_VERSION=v1|v2` continues to resolve). `ChatPromptModule.system` signature WIDENS to `system(catalog: CatalogSnapshot) -> string`; `v1` and `v2` ignore the argument; `v3` renders the ontology block from it.

`v3` is built on top of `v2` (persona, language pt-BR, citation policy, output-stripping discipline, marker token from BR-20, AND the three v2.4 ingestion directives — Owner-explicit-request gate, document-as-data, no auto-polling — ALL preserved) AND ADDS three blocks:

**Block 4A — ONTOLOGY (rendered from `catalog: CatalogSnapshot`).** A compact, deterministic catalog dump of the knowledge-graph vocabulary, injected at a fixed location in the system prompt. Three sub-sections:

1. **NodeTypes** — for each entry in `catalog.nodeTypes` (sorted by canonical name): `<name>: <description>` (one line per type). Today: 10 entries; growth is data-driven (migration + restart per the `ontology-extension-playbook`).
2. **LinkTypes** — for each entry in `catalog.linkTypes` (sorted by canonical name): `<name>: <description>` + the allowed `(source_node_type -> target_node_type)` pairs derived from `LinkTypeRule` (so the model knows which links are legal for which types). Today: 13 entries / 22+ rules.
3. **AttributeKeys** — for each entry in `catalog.attributeKeys` (sorted by canonical name): `<name> (value_type=<...>): <description>`. Today: 19 entries.

The block is deterministic: same `CatalogSnapshot` reference -> identical bytes. The catalog is loaded ONCE at boot (`knowledge-graph.back.md` BR-23 — restart required after a migration); the rendered block is therefore byte-stable per process. This stability is the precondition for keeping the Anthropic `cache_control` prefix valid across turns (P0 prompt-cache invariant, per the project memory; same property leveraged today by the ingestion extraction prompt — see `ingestion.back.md`). The renderer does NOT hardcode any type name — adding a new `NodeType` is a migration + BFF restart with NO change to `prompts/v3.ts`.

**Block 4B — SEARCH DISCIPLINE.** Explicit directives the model MUST follow when choosing tools. Three directives:

1. `search` is **lexical** (full-text `tsquery`) with **AND semantics** across terms — every term in the query must appear on the SAME node. Concatenating multiple proper nouns from different entities into one `search` call returns 0 hits whenever the names live on distinct nodes. The model MUST issue ONE search per specific name; combine results with subsequent tool calls if needed.
2. `list_nodes` MUST be invoked WITH a `node_type` filter when used as the answer to "what exists in category X". The model MUST NOT issue an unfiltered `list_nodes(limit:30)` and present its first row as "what was just ingested" or "what the database has on X" — that is the v2.4 failure mode v3 explicitly forbids.
3. When the ontology block of 4A is insufficient (e.g. the model needs the exhaustive `value_type` list of an `AttributeKey`, regex constraints, or examples), use `list_node_types` / `list_link_types` / `list_attribute_keys` as the discovery primitives. The block is a starting catalog, not the full schema.

**Block 4C — POST-INGESTION PLAYBOOK.** Explicit recipe for the "show what was ingested" intent. Steps:

1. After `start_async_ingestion`, inform the Owner that the ingestion was started and offer to consult `get_ingestion_status` later (v2 directive 2, preserved).
2. After `get_ingestion_status` returns `status === "completed"`, BEFORE describing what was ingested, read `result.affected_nodes` (TC-5; BR-43 / BR-45 v2.5 amendments): an array of `{id, canonical_name, node_type}`. When PRESENT and non-empty, the model MUST do DIRECT `get_node(id)` AND/OR `traverse(start_node_id=id, depth=2)` lookups on each id; describe ONLY what those lookups returned. The `affected_nodes` field is the primary source of truth for "what was ingested" — search is the FALLBACK.
3. When `affected_nodes` is absent or empty (legacy run-ids; non-completed status; degraded ingestion path), the model falls back to one-name-per-`search` over the proper nouns the OWNER mentioned in the input, AND/OR `list_nodes(node_type=<plausible>)` from the ontology block of 4A — NEVER a multi-name concatenated search (block 4B directive 1), NEVER an unfiltered `list_nodes` (block 4B directive 2).
4. Cite provenance via `raw_information_id` returned by the status tool.
5. NEVER present the first row of an unfiltered `list_nodes` as "what was ingested" — the row may belong to a completely different subgraph. This is the v2.4 failure mode v3 explicitly forbids; the model MUST refuse the answer and re-plan via blocks 4B/4C steps 2-3.

**Backward-compat (v1, v2).** `selectChatPromptModule('v1').system(catalog)` and `selectChatPromptModule('v2').system(catalog)` ignore the catalog and return the existing v1/v2 strings byte-stable across versions. `UnknownChatPromptVersionError` is thrown at boot when `CHAT_PROMPT_VERSION` is none of `{v1, v2, v3}`.

**Other invariants preserved from v2.** The model MUST NOT include the `content` argument of `start_async_ingestion` in its natural-language response (audit-only). Marker token (BR-20) is re-used verbatim from v1 (stable across versions).

**Cache-control invariant (v2.5).** The rendered `system(catalog)` string is byte-stable for the entire process lifetime as long as the `CatalogSnapshot` reference is unchanged (boot-time load — `knowledge-graph.back.md` BR-23). The Anthropic `cache_control` header marking the system+tools prefix as cacheable (P0 of `llm-cost-audit`) STAYS VALID. A future hot-reload of the catalog would invalidate the cache; v2.5 explicitly defers hot-reload (§13 out of scope).

**Error returned:** boot failure if `CHAT_PROMPT_VERSION` is unknown (`UnknownChatPromptVersionError`).

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

### BR-29 -- Persistence sequencing: faithful multi-row replay surface (v2.2)
**Related UC:** UC-02..UC-06
**Where to validate:** route handler (`sendMessage`).
**Description:** Authoritative sequencing. v2.2 changes how the agentic turn is persisted so that on subsequent turns `context-builder` (BR-31) rebuilds a VALID Anthropic message sequence by replaying rows 1:1.

1. (pre-stream) Validate body + header (BR-01/BR-04/BR-26).
2. (pre-stream) Resolve conversation (BR-22), check archived (BR-25), check turn-in-progress + register controller (BR-28), check idempotency (BR-27).
3. (pre-stream) Open `withTransaction`. Inside: insert the user natural-language row via `repository.insertUserMessage` — content is `[{type:"text", text:<request content>}]`, `idempotency_key` is the request header, `model` is the resolved model id. Commit. Now the user's question is durable on any later failure.
4. (pre-stream) Build `messages[]` via `context-builder.buildModelContext` (under `withReadOnly`). The just-inserted natural-language user row IS the last element of the result by construction.
5. (open SSE) `reply.hijack()`, write headers.
6. (in-loop) Consume `chatAgentService.runTurn(...)`. The route layer is responsible for assembling the iteration-by-iteration persistence sequence in tandem with the SSE drain. Per iteration `i`:
   a. As each `ChatEvent.text_delta` arrives, write the SSE frame AND accumulate the delta into `currentIterationTextBlocks`.
   b. On each `ChatEvent.tool_start{tool_use_id, name, args_summary}`, write the SSE frame AND append a `tool_use` block to `currentIterationContent` (carrying `tool_use_id`, `name`, and the model's typed `input`).
   c. On each `ChatEvent.tool_result{tool_use_id, tool, ok, arguments, result, is_error, error_message, duration_ms}`:
      - Persist a `chat_tool_call` audit row via `repository.insertToolCall` (in its OWN short `withTransaction`) with `message_id = NULL`. Collect the inserted id for step 8.b. (BR-32 audit trail — unchanged.)
      - Append a `tool_result` block to `currentIterationToolResults` carrying `tool_use_id` (matching the `tool_use` block of step (b)) and the (possibly truncated, BR-13) content fed back to the model. Failure tool_results carry `is_error: true` and the truncated error envelope.
      - Write the SSE `tool_result` frame.
      - (v2.1) If `evt.tool` is one of `{traverse, get_node, list_nodes, search}` AND `ok===true` AND a `CatalogSnapshot` is available, synthesise + write the `graph_delta` frame (BR-41).
   d. When the iteration ENDS with a `tool_use` stop (i.e. the model handed control back for tool dispatch and a new iteration `i+1` is about to begin), open a SHORT `withTransaction`:
      - Insert ONE assistant row via `repository.insertAssistantIterationMessage` with `content = currentIterationTextBlocks ∪ currentIterationContent` (text blocks first, then tool_use blocks, preserving the order they were yielded), `stop_reason = NULL`, `idempotency_key = NULL`, `model = NULL`, `tokens_in = NULL`, `tokens_out = NULL`, `latency_ms = NULL`. The row's `id` is captured for step 8.b. attachment.
      - Insert ONE synthetic user row via `repository.insertSyntheticToolResultUserMessage` with `content = currentIterationToolResults`, `idempotency_key = NULL`, `model = NULL` (all assistant-only metadata stays NULL because role is `user`). The row's `created_at` MUST be strictly greater than the assistant iteration row's `created_at` (server-clocked `now()` guarantees this within a transaction; if the two writes share the same microsecond, the `id` UUID tie-breaks ordering in `(created_at, id)` index reads).
      - Commit.
      - Reset `currentIterationTextBlocks`, `currentIterationContent`, `currentIterationToolResults`. Increment `i`.
   e. On `ChatEvent.done` OR `ChatEvent.error` (the terminal frame), write the terminal frame.
7. (post-stream) `reply.raw.end()`. Release the in-process turn registry entry.
8. (post-stream) Open a new `withTransaction`:
   a. Insert the FINAL assistant row via `repository.insertAssistantMessage` with:
      - `content = currentIterationTextBlocks ∪ currentIterationContent` (in practice for the terminal iteration `currentIterationContent` is empty — no more tool_use blocks emitted after the terminal frame; only the closing text blocks remain).
      - `stop_reason` resolved from the terminal event (including synthetic `provider_error` / `internal_error`).
      - `model` = resolved model id.
      - `tokens_in` / `tokens_out` = per-turn aggregates from the terminal event.
      - `latency_ms` = first `llm_start` to terminal frame (whole-turn).
   b. `repository.attachToolCallsToMessage(toolCallIds, finalAssistantRow.id)` — attach ALL `chat_tool_call` rows from step 6.c (across every iteration) to the final assistant row. (Per-iteration assistant rows from step 6.d are NEVER attached to tool-call rows; the audit trail is anchored to the turn's terminal assistant row to keep `getConversationUsage` joins simple.)
   c. Commit.
9. Emit the pino INFO turn record (BR-19).
10. Schedule fire-and-forget `distillationService.maybeRefreshSummary(...)` + `.maybeDistillTitle(...)` (BR-33 / BR-34).

**Atomicity of iteration boundaries.** Each per-iteration `(assistant, synthetic_user)` pair in step 6.d MUST be inserted in the SAME `withTransaction` — a partial pair (assistant tool_use row persisted without the matching synthetic user tool_result row, OR vice versa) would re-introduce the original bug on the next turn. If step 6.d throws mid-pair, the transaction rolls back; the route layer logs WARN `chat.iteration_persist_failure`, emits the terminal `error` frame with `code: SYSTEM_INTERNAL_ERROR`, closes the stream, and proceeds to step 7 / step 8 — the final assistant row in step 8 still inserts with `stop_reason = "internal_error"`, leaving an interpretable conversation tail (no dangling `tool_use` blocks because the failed iteration was rolled back atomically).

**Crash recovery (process loss between step 6.d and step 8).** Per-iteration `(assistant, synthetic_user)` pairs from completed iterations remain in the DB; the final assistant row is missing. On the NEXT turn the `context-builder` (BR-31) rebuilds a sequence whose last message is the synthetic user `tool_result` row — an Anthropic-valid sequence ending on a user turn. Anthropic accepts that shape (a user turn awaiting an assistant response); the new turn's natural-language user message is appended after the recovered synthetic user row by step 4. There is no orphan-cleanup task — the audit trail (`chat_tool_call`, BR-32) keeps `message_id = NULL` for the dangling tool-call rows of the missing terminal iteration; auditable, no first-class recovery surface in v2.2.

**Step 8 failure (DB error).** The SSE has already closed — emit WARN `chat.assistant_row_persist_failure` with `request_id` + error; the failure does NOT propagate to the client. Tool-call rows inserted in step 6.c will keep `message_id = NULL` — auditable, no orphan cleanup needed. Per-iteration `(assistant, synthetic_user)` pairs from step 6.d remain in the DB; the same crash-recovery rationale applies.

**Error returned:** n/a (sequencing invariant).

### BR-30 -- `Conversation` create body invariants
**Related UC:** UC-01
**Where to validate:** route (Zod `CreateConversationRequest`)
**Description:** Body schema is `{ title?: z.string().min(1).max(200) }`. Empty body `{}` is accepted (title defaults to NULL). The server assigns `id`, `created_at`, `updated_at`; `archived_at`, `summary_rolling` are initialised to NULL.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-31 -- Context reconstruction: system prompt + summary_rolling + recent window (faithful 1:1 replay, v2.2)
**Related UC:** UC-02
**Where to validate:** service (`context-builder.buildModelContext`)
**Description:** Step-by-step:
1. `system` = `selectChatPromptModule(env.CHAT_PROMPT_VERSION).systemPrompt`.
2. Read conversation by id (caller passed it, or read fresh from `repository.getConversationById`).
3. `summary_rolling`-block: when `conversation.summary_rolling IS NOT NULL`, prepend a synthetic message `{role:"user", content:[{type:"text", text: "[contexto da conversa anterior, sintetizado]\n\n" + summary_rolling}]}`. The opening header tells the model this block is a recap, not a user instruction.
4. Read the last `env.CHAT_RECENT_WINDOW` messages via `repository.listRecentMessages(client, conversation_id, env.CHAT_RECENT_WINDOW)`. Map them 1:1 to Anthropic `messages[]` (`role` -> `role`; jsonb `content` -> Anthropic `content`, passed VERBATIM).
5. The user natural-language row inserted in step 3 of BR-29 IS the last element of the result by construction (the BFF inserts it BEFORE calling `buildModelContext`).

**Why 1:1 is now safe (v2.2).** Because BR-29 v2.2 persists each tool-bearing iteration as the correct Anthropic sequence (`assistant [text, tool_use]` + `user [tool_result]`) across separate rows in chronological order, the verbatim 1:1 mapping in step 4 yields a VALID Anthropic `messages[]` by construction: every `tool_use` block emitted by an assistant row is followed by a `user` row whose first content block is a `tool_result` with the matching `tool_use_id`. The v2.0 / v2.1 bug — assistant row carrying a `tool_use` block with no matching `tool_result` row, causing Anthropic 400 `tool_use ids were found without tool_result blocks immediately after` on the next turn — is removed at the persistence layer (BR-29) without changing the replay logic (BR-31 stays 1:1 verbatim).

**Row classification (for downstream consumers — informative).** Rows in the recent window fall into three categories that share the `(user, assistant)` role enum:
- **Natural-language `user` row:** `role='user'`, `content[*].type === "text"` only, `idempotency_key IS NOT NULL`. Surfaced to the SPA on `listMessages` (BR-39).
- **Synthetic tool_result `user` row:** `role='user'`, `content[*].type === "tool_result"` exclusively, `idempotency_key IS NULL`. NOT surfaced to the SPA (BR-39 filtering rule).
- **Assistant row:** `role='assistant'`. May carry any mix of `text` and `tool_use` blocks. ALL assistant rows are surfaced to the SPA on `listMessages` (BR-39) — the SPA renders only `text` blocks; `tool_use` blocks remain invisible to the user but are necessary in the replay sequence.

The context-builder itself does NOT filter — all three categories enter `messages[]` verbatim; categorisation matters only at the SPA boundary (BR-39).

Client-side history is NEITHER required NOR accepted.
**Error returned:** n/a.

### BR-32 -- Tool calls are persisted with full input and result (audit-only; not the replay surface, v2.2)
**Related UC:** UC-02
**Where to validate:** route handler (`sendMessage`) — inserts via `repository.insertToolCall` on each `ChatEvent.tool_result` consumed from `runTurn`. The agent service yields the full envelope (arguments, result, is_error, error_message, duration_ms) via the v2 enriched `ChatEvent.tool_result` shape (§1.2).
**Description:**
- `arguments`: full jsonb input — NOT truncated by BR-13.
- `result`: full success body — NOT truncated. NULL on error.
- `is_error`: true when the tool envelope was `{ok:false}` OR on tool timeout (BR-17).
- `error_message`: short string from the tool envelope's `error.message`.
- `duration_ms`: wall-clock per tool call (start = `tool_start` yield, end = `tool_result` yield).
- `message_id`: NULL at insert time; patched in step 8.b of BR-29 via `attachToolCallsToMessage`. Attachment anchors EVERY tool-call row of the turn to the turn's TERMINAL assistant row (not to the per-iteration assistant rows persisted by step 6.d of BR-29) — keeps the `getConversationUsage` join one-step and the audit dump uniform.

**v2.2 audit-vs-replay separation.** `chat_tool_call` rows are the AUDIT trail — they carry the FULL untruncated arguments, full untruncated result, error envelope, and wall-clock duration for `getConversationUsage` (BR-40) and audit dumps. They are NO LONGER the sole persistence surface for the tool exchange: BR-29 v2.2 ALSO persists the model-visible `tool_use` blocks on the per-iteration assistant rows and the (possibly truncated, BR-13) `tool_result` blocks on the synthetic user rows. The two surfaces serve different purposes:

- `chat_tool_call` (audit): full input/result, decoupled from the replay shape. Read by `getConversationUsage` (BR-40) and any per-conversation audit dump.
- `chat_message` per-iteration rows (replay): the Anthropic-shaped tool_use / tool_result pair, sized to fit the next-turn context window (BR-13 truncation applies to the `tool_result` content blocks of the synthetic user row — NOT to the `chat_tool_call.result` audit jsonb).

A tool call ALWAYS produces both surfaces in lock-step within the same iteration; a `chat_tool_call` row with no matching `tool_result` block on a synthetic user row is a sequencing bug (the `chat.iteration_persist_failure` WARN in BR-29 surfaces it).
**Error returned:** n/a (audit trail).

### BR-33 -- Rolling summary refresh policy
**Related UC:** UC-02
**Where to validate:** service (`distillation.service.maybeRefreshSummary`) — scheduled fire-and-forget by the route AFTER the HTTP response has terminated.
**Description:**
1. Read `repository.countUserTurns(client, conversation_id)` under `withReadOnly`. Only NATURAL-LANGUAGE user rows count (i.e. `role='user' AND idempotency_key IS NOT NULL`) — synthetic tool_result user rows (BR-02 / §2.1 v2.2 amendment) are NOT user turns from the policy's perspective. The repository query MUST filter accordingly.
2. If `count > env.CHAT_SUMMARY_AFTER_TURNS` AND `env.CHAT_SUMMARY_ENABLED === true`, proceed; otherwise return.
3. Read `repository.listOlderMessagesForSummary(client, conversation_id, env.CHAT_RECENT_WINDOW)` under `withReadOnly` — returns messages OLDER than the last `CHAT_RECENT_WINDOW` rows. **v2.2 boundary safety:** the older slice MUST be sliced on TURN boundaries, not on arbitrary row indices — splitting between an assistant `tool_use` row and its matching synthetic user `tool_result` row would yield an invalid Anthropic sequence and Anthropic would reject the distillation request with the same 400 that the v2.0 / v2.1 next-turn bug surfaced (`tool_use ids were found without tool_result blocks immediately after`). The repository's slicer rounds the cut backward until it lands on a natural-language user row OR the start of the conversation; same forward at the recent-window boundary.
4. Call `anthropic.messages.create({ model: env.CHAT_UTILITY_MODEL, stream: false, system: <summary prompt>, messages: <older slice> })`. The older slice carries the same row shapes as the recent window (text + tool_use + tool_result blocks per BR-02 v2.2); the utility model is expected to summarise across them — the summary prompt instructs it to treat tool exchanges as evidence-gathering steps, not user instructions.
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
3. Read `repository.getFirstUserAndAssistant(client, conversation_id)` under `withReadOnly`. **v2.2 boundary safety:** `<user>` MUST be the conversation's FIRST natural-language user row (`role='user' AND idempotency_key IS NOT NULL` — see BR-02 v2.2 amendment), NOT a synthetic tool_result user row. `<assistant>` MUST be the FIRST assistant row whose content has at least one `text` block — skipping any leading per-iteration assistant rows that carry only `tool_use` blocks. The repository implementation `getFirstUserAndAssistant` MUST apply both filters; v2.0 / v2.1 implementations that returned the raw chronologically-first rows would, after the v2.2 multi-row persistence change, sometimes return an assistant row carrying ONLY `tool_use` blocks — Anthropic would reject the request with the same 400 the next-turn bug surfaced.
4. Call `anthropic.messages.create({ model: env.CHAT_UTILITY_MODEL, stream: false, system: <title prompt>, messages: [<user>, <assistant>] })`. The pair is, by construction (step 3 filters), a VALID Anthropic exchange — no dangling `tool_use`.
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
- **v2.2 surface filtering.** The route returns ALL `chat_message` rows AS-IS — including the per-iteration assistant rows whose `content` carries `tool_use` blocks AND the synthetic user rows whose `content` carries `tool_result` blocks (BR-02 / §2.1 v2.2 amendment). The SPA is responsible for HIDING rows whose blocks are exclusively of the synthetic kinds (assistant rows with NO `text` block; user rows with NO `text` block) — this keeps the surface uniform with the replay model (BR-31) and avoids a server-side filter that would need to keep state in sync with future content-block taxonomy changes. `getConversationUsage` (BR-40) `messages` count is the raw count of all rows (synthetic + natural) — the conversation's underlying token + tool-call audit costs ARE produced by those rows even when the SPA hides them.
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


### BR-42 -- Per-conversation graph-view snapshot (persistence)

**Related UC:** none in the existing catalog — this is a SPA view-state feature, not an agentic or curation flow.  
**Where to validate:** route handler (`GET /conversations/:id/graph`, `PUT /conversations/:id/graph`) — Zod parse of `SaveGraphViewRequest` body + `getConversationById` existence check before any DB write.  
**Description:**

The SPA maintains a visual graph of knowledge nodes for each conversation. This graph is built up turn by turn (via `graph_delta` SSE frames, BR-41) and can be rearranged by the user (drag, Reorganizar). To avoid losing that work on page reload, the SPA saves and restores the graph state per conversation.

**Snapshot contract:**

The persisted snapshot records the **last version presented to the user** — it is a **view memento**, NOT a re-projection of the knowledge graph. On restore, the SPA uses it as-is; any knowledge-graph change (node rename / deletion) since the last save will appear stale until the next turn refreshes it. This is intentional.

Snapshot shape (JSON / `chat_graph_view.snapshot`):
```json
{
  "version": 1,
  "nodes":      [<GraphNodeWire>],
  "links":      [<GraphLinkWire>],
  "positions":  { "<node_id>": { "x": <number>, "y": <number> } },
  "user_pinned": ["<uuid>", ...]
}
```

**DB table:**

```sql
CREATE TABLE chat_graph_view (
  conversation_id uuid        PRIMARY KEY
                              REFERENCES chat_conversation(id) ON DELETE CASCADE,
  snapshot        jsonb       NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

One row per conversation, cascade-deleted with the conversation (`ON DELETE CASCADE`). The PK `conversation_id` is the only index needed — all access is by exact conversation. Outside §11 compliance (cascade-only erasure path, same as the other chat tables; BR-37).

**Migration:** `migrations/0005_chat_graph_view.sql`. DB Safety Rule — NOT applied at spec time; owner applies via the one-off `pg` script after approval, then restarts the BFF.

**Repository additions (`repository/chat.repository.ts`):**

```typescript
// New types
type GraphViewRow = { snapshot: unknown; updated_at: Date }

// New functions added to the existing ChatRepository interface
getConversationGraphView(client: PoolClient, conversationId: string): Promise<GraphViewRow | null>
upsertConversationGraphView(client: PoolClient, conversationId: string, snapshot: unknown): Promise<{ updated_at: Date }>
```

- `getConversationGraphView`: `SELECT snapshot, updated_at FROM chat_graph_view WHERE conversation_id = $1`.
- `upsertConversationGraphView`: `INSERT INTO chat_graph_view (...) VALUES (...) ON CONFLICT (conversation_id) DO UPDATE SET snapshot = $2::jsonb, updated_at = now()`.

**Route contract (`routes/conversations.routes.ts`):**

| Method | Path | Success | 404 | 422 | Description |
|--------|------|---------|-----|-----|-------------|
| `GET` | `/conversations/:id/graph` | 200 `{ok:true, result: <snapshot \| null>}` | conversation absent | — | Returns snapshot or `result:null` (no snapshot yet — null is NOT an error) |
| `PUT` | `/conversations/:id/graph` | 200 `{ok:true, result:{updated_at}}` | conversation absent | snapshot Zod invalid or `nodes/links.length > 2000` | Upserts snapshot |

Both routes:
1. Check kill-switch (BR-14).
2. Verify `ConversationIdParam` (Zod UUID).
3. Call `getConversationById` — 404 via `sendNotFound` if absent.
4. GET: `withReadOnly` → `getConversationGraphView`.
5. PUT: validate `SaveGraphViewRequest` (Zod, size cap 2000 per array) → `withTransaction` → `upsertConversationGraphView`.
6. Return `{ok: true, result: ...}`.

No service file is needed (CRUD-only, like conversation CRUD — route calls repo directly).

**Zod schema (`routes/chat.schemas.ts`):**

```typescript
export const SaveGraphViewRequest = z.object({
  version: z.literal(1),
  nodes:   z.array(GraphNodeWireSchema).max(2000),
  links:   z.array(GraphLinkWireSchema).max(2000),
  positions: z.record(z.string().uuid(), z.object({ x: z.number(), y: z.number() })),
  user_pinned: z.array(z.string().uuid()),
});
```

Size cap (2000) bounds the JSONB blob to the regime of dozens of nodes with substantial headroom. No new error codes — reuses `RESOURCE_NOT_FOUND` (404) and `VALIDATION_INVALID_FORMAT` (422).

**Error returned:** 404 (`RESOURCE_NOT_FOUND`) when conversation is absent; 422 (`VALIDATION_INVALID_FORMAT`) for malformed body or size cap exceeded. Both via the standard REST envelope.

### BR-43 -- `start_async_ingestion` is one-shot intake + background extraction (v2.4)

**Related UC:** UC-10 (of `chat.spec.md`).
**Where to validate:** service (`service/ingest-adapter.ts`) — the chat tool dispatcher (`chat-agent.service.ts`) routes the `start_async_ingestion` `tool_use` block to the adapter. The adapter composes `ingestion.service.ingestRawInformation` (UC-01 of `ingestion`) + a fire-and-forget scheduler for `ingestion.service.runLlmExtraction` (UC-12 of `ingestion`). NO chat-owned write transaction is opened — the ingestion service owns its OWN intake transaction (and extraction owns its own).
**Description:**

`start_async_ingestion` is the chat-facing entry point to the ingestion pipeline. Step-by-step:

1. **Inputs (Anthropic tool schema, Zod-parsed by the adapter).** `{ content: string (>=1, <= 10 MiB), source_type: string (catalog-driven), metadata?: object, model?: string (default `claude-opus-4-8` — the SERVER ingestion model selected by `env.INGEST_MODEL` in `ingestion`; this argument is FORWARDED to `ingestion.service.ingestRawInformation` and ultimately used for `runLlmExtraction`'s tool-use loop), prompt_version?: string (default `DEFAULT_PROMPT_VERSION` per `ingestion.back.md` BR-26) }`. Schema identical to the existing `ingest_document` MCP tool (`ingestion.back.md` BR-30) modulo the tool name. Zod-parse failure -> envelope `{ ok: false, error: { code: "STRUCTURAL_INVALID", message, details } }` (BR-07).

2. **Intake (synchronous, < 1 s).** The adapter calls `ingestion.service.ingestRawInformation(content, source_type, metadata, model, prompt_version)` (UC-01 of `ingestion`). One transaction persists `RawInformation` + `RawChunk` rows + a `running` `LLMRun`. Idempotent via `content_hash` UNIQUE (`ingestion.back.md` BR-08): when the content is a duplicate the service returns `{ outcome: "noop_existing", raw_information_id, llm_run_id, ... }` and the adapter returns `{ outcome: "already_ingested" }` WITHOUT scheduling a second extraction. The adapter catches `ingestRawInformation` errors and maps them to the standard envelope (BR-07):
   - pg-down / connection reset -> `{ ok: false, error: { code: "SYSTEM_SERVICE_UNAVAILABLE", message: "ingestion service unavailable" } }`;
   - layered-validation failure (content too large, source_type not in catalog, structural Zod failure inside `ingestion`) -> `{ ok: false, error: { code: "STRUCTURAL_INVALID", message, details } }`;
   - any other unexpected error -> `{ ok: false, error: { code: "SYSTEM_INTERNAL_ERROR", message: <sanitised>, details: { request_id } } }` — the message is a sanitised constant, NEVER the raw `err.message` (BR-23 spirit; the chat domain MUST NOT leak ingestion internals).

3. **Extraction (asynchronous, fire-and-forget).** On a fresh `outcome: "ingested"`, the adapter schedules `ingestion.service.runLlmExtraction(llm_run_id)` (UC-12 of `ingestion`) on a `setImmediate` / microtask boundary. The chat turn does NOT hold the HTTP connection open for the extraction (which can take minutes per chunk; the chat budgets `TOOL_TIMEOUT_MS = 15s` BR-17 / `TURN_TIMEOUT_MS = 90s` BR-16 would otherwise abort the turn). The background task lifecycle is owned by the `ingestion` service; on failure it writes `llm_run.status = 'failed'` per UC-12 fatal-failure path; the chat domain is NOT notified out-of-band.

4. **Tool envelope returned (synchronous, < 1 s).** `{ ok: true, result: { outcome: "ingested" | "already_ingested", run_id: uuid, raw_information_id: uuid, status: "running" | "failed" | "completed", chunk_count: integer >= 1, affected_nodes?: Array<{ id: uuid, canonical_name: string, node_type: string }> } }`. `status` reflects `LLMRun.status` at the moment intake completed; on a fresh `outcome: "ingested"` the status is always `"running"`. The model receives this envelope as the `tool_result` block (BR-07); BR-13 truncation does NOT apply because the envelope is small (~200 bytes — `affected_nodes` is empty / absent on the synchronous path; see step 4a).

   **4a. `affected_nodes` (TC-5, v2.5).** The optional `affected_nodes` field is FORWARDED VERBATIM from the `ingestion` service response. On the synchronous-intake path, extraction has not yet run; `ingestRawInformation` SHOULD return `affected_nodes` empty / absent (no consolidation has happened yet) — and the chat adapter passes it through. On `outcome: "already_ingested"` (dedupe — content_hash UNIQUE hit), `ingestRawInformation` MAY return the previously-consolidated nodes for the existing `raw_information_id`; the chat adapter passes that through. The Owner learns the consolidation set of a FRESH ingestion by polling `get_ingestion_status` (BR-45 v2.5 amendment) after `status === "completed"`. The adapter MUST NOT transform the field (no truncation, no enrichment, no reordering); when the ingestion response omits the key, the chat envelope omits it (not `[]`, not `null`).

5. **Audit (`chat_tool_call`).** Persisted per BR-32 with `tool_name = "start_async_ingestion"`, full `arguments` jsonb INCLUDING the `content` field (the Owner accepted that chat content is auditable — same as the existing `chat_message.content` policy), full `result` jsonb (run id + status + outcome), `is_error = false` on success / `true` on the STRUCTURAL_INVALID / SYSTEM_* paths. The audit row is anchored to the FINAL assistant row per BR-29 step 8.b — UNCHANGED from v2.2 (the per-iteration assistant row carrying the `tool_use` block + the synthetic user row carrying the `tool_result` block are also persisted per BR-29 step 6.d; the `tool_result.content` block content is `model_visible_content`, the small envelope, NOT the full `chat_tool_call.result` body).

6. **Background-task safety.** The fire-and-forget scheduler MUST NOT throw into the chat HTTP request handler. The pattern is:
   ```ts
   const extractionPromise = ingestion.service.runLlmExtraction(llm_run_id);
   extractionPromise.catch((err) => logger.warn(
     { err, llm_run_id, conversation_id, request_id },
     "chat.ingest_extraction_background_failure"
   ));
   ```
   The chat HTTP response has already terminated; the failure does NOT propagate to the SSE. Counter `chat_ingest_start_total{ok}` is incremented on intake; `chat_ingest_extraction_failure_total` is incremented on the WARN path. The background promise is intentionally NOT tracked by any in-process registry — the chat domain has no responsibility for the extraction's lifecycle; UC-12 of `ingestion` is self-contained.

**Sequence inside the agentic loop (covered by BR-29 step 6 — UNCHANGED by v2.4 because the dispatch surface is the existing `chat-agent.service` tool-dispatch path):**
- Agent yields `ChatEvent.tool_start{tool:"start_async_ingestion", tool_use_id, input, args_summary}` — `args_summary` redacts to `source_type=<...> content_len=<n>` (BR-09; NEVER includes the raw `content`).
- Adapter resolves; agent yields `ChatEvent.tool_result{tool:"start_async_ingestion", tool_use_id, ok:true, arguments, result, is_error:false, error_message:null, model_visible_content: <envelope>, duration_ms}`.
- Route writes the SSE frames, persists the `chat_tool_call` audit row (BR-32), and continues the loop. NO `graph_delta` emission (the tool is NOT in `{traverse, get_node, list_nodes, search}` — BR-41 trigger gate).

**Error returned:** never as a terminal SSE error; envelope errors flow back to the model as failed `tool_result` blocks (BR-07 / BR-10 path). The codes are documented in §10.

### BR-44 -- `CHAT_INGEST_ENABLED` feature flag — boot-time catalog gate (v2.4)

**Related UC:** UC-10, UC-11 (of `chat.spec.md`).
**Where to validate:** module wiring (`registerChatRoutes` reads `env.CHAT_INGEST_ENABLED`; `buildChatToolCatalog(mcp, env)` filters the two ingestion entries when the flag is `false`).
**Description:**

The boot-time env `CHAT_INGEST_ENABLED` (boolean, default `false`; type `z.coerce.boolean()` on the env loader) gates the v2.4 ingestion capability:

1. When `false`: the chat catalog resolves to exactly the 13 read-only `query` tools (the v2.0 catalog). `start_async_ingestion` and `get_ingestion_status` are NOT advertised in the Anthropic `tools[]` array; the model CANNOT emit them. The `CHAT_PROMPT_VERSION` continues to default to `v2`, but the v2 directives that reference the ingestion tools are inert because the tools are absent (the model is told the tools exist; their absence on the wire is observed by the model as "tool not available" if it tries — defensive BR-10 path).
2. When `true`: the chat catalog includes the 13 + 2 entries (15 total, BR-05). Catalog construction order is FIXED: first the 13 `query` names (preserving the v2.0 order), then `start_async_ingestion`, then `get_ingestion_status`. The order is deterministic so the Anthropic `tools[]` array hash is stable across reloads (relevant for prompt-cache hits per the `cache_control` rollout in `ingestion.back.md`).
3. The flag does NOT introduce a 503 endpoint path: the gate is on catalog construction, not on a runtime check inside `sendMessage`. There is therefore NO `BUSINESS_CHAT_INGEST_DISABLED` runtime error path in v2.4 (the error code is registered in the global catalog for forward-compatibility — see §10 — but is NOT emitted by the chat routes; future revisions that introduce a runtime gate may use it).
4. Toggling the flag requires a BFF restart (boot-time read; no hot-reload). The toggle is recorded in the structured boot log `chat.boot{chat_ingest_enabled, tool_count}` so the rollout state is auditable.
5. The flag is INDEPENDENT of `CHAT_ENABLED` (BR-14). With `CHAT_ENABLED=false`, every chat endpoint is 503 regardless of `CHAT_INGEST_ENABLED`. With `CHAT_ENABLED=true` and `CHAT_INGEST_ENABLED=false`, the chat works in its v2.0 read-only catalog.
6. Defensive degradation: when `CHAT_INGEST_ENABLED=true` AND `mcp.getTool('ingest', 'start_async_ingestion')` OR `mcp.getTool('ingest', 'get_ingestion_status')` is undefined (registry race / bad rollout / `ingestion` toolset rolled back), `buildChatToolCatalog` logs ERROR `chat.tool_catalog_partial_resolution{requested, resolved}` AND falls back to the 13-tool catalog. The chat routes still mount; the model has NO ingestion offer. The route family is NOT registered as 404 — only the optional ingestion offer is removed. The Owner is expected to inspect the boot log to discover the misconfiguration.

**Error returned:** none — the gate is silent at boot when the flag is consistent with the registry; ERROR log on the defensive-degradation path.

### BR-45 -- `get_ingestion_status` is read-only and reused verbatim from the `ingest` toolset (v2.4)

**Related UC:** UC-11 (of `chat.spec.md`).
**Where to validate:** chat tool dispatcher (`chat-agent.service.ts`) — resolves via `mcp.getTool('ingest', 'get_ingestion_status')` and invokes the EXISTING read-only handler registered by `ingestion`. The chat domain adds NO new handler.
**Description:**

The chat catalog reuses verbatim the read-only handler registered by the `ingestion` MCP toolset (`ingestion.back.md` BR-31): `{ llm_run_id: uuid } -> { llm_run_id, status, started_at, finished_at|null, summary, model, prompt_version, affected_nodes?: Array<{ id: uuid, canonical_name: string, node_type: string }> }`. **v2.5 TC-5 amendment:** the `affected_nodes` field is added to the response envelope when `status === "completed"` — see `ingestion.back.md` BR-31 v2.5 amendment for the population contract on the ingestion side. The field is the union of nodes CREATED (`outcome: "consolidated"` on a fresh fragment) and nodes RE-CONFIRMED (`outcome: "reaffirmed"` on an existing fragment) by the run, deduplicated by id. When `status !== "completed"` (e.g. `running`, `failed`), `affected_nodes` is empty / absent. The chat dispatcher passes the field through verbatim (no transformation; identical contract to BR-43 step 4a). The system prompt block 4C (BR-18 v3) is the consumer that drives the model to use this field as the primary source of truth for "what was ingested". Reuse implies:

1. The Zod schema, the `BEGIN READ ONLY` transaction (`withReadOnly`), the error mapping (`VALIDATION_INVALID_FORMAT` for non-UUID input / `RESOURCE_NOT_FOUND` for unknown run id / `SYSTEM_SERVICE_UNAVAILABLE` for pg-down), and the envelope shape are inherited verbatim from `ingestion.back.md` BR-31. The chat dispatcher does NOT wrap the handler — it invokes it directly.
2. The chat dispatcher persists the call in `chat_tool_call` (BR-32). The full `result` envelope (run status + summary) is recorded for audit. `arguments` carries the `llm_run_id` only (small).
3. The tool is on the catalog ONLY when `CHAT_INGEST_ENABLED=true` AND the `ingest` toolset has it registered (BR-05 / BR-44). When the flag is `true` but `ingestion.back.md` BR-31 is rolled back, BR-44 step 6 defensive degradation removes BOTH ingestion entries (the chat route still mounts).
4. The chat domain does NOT mirror the other two operational `ingest` tools (`health`, `list_recent_ingestions`) — they are intentionally OUT of scope for v2.4 (single-owner; the Owner can call them via the MCP endpoint directly).
5. The dispatch path is identical to a `query` tool — the agent yields `tool_start{tool:"get_ingestion_status", tool_use_id, input:{llm_run_id}, args_summary}` (`args_summary` is `llm_run_id=<uuid>`) and `tool_result{tool:"get_ingestion_status", tool_use_id, ok, arguments, result, is_error, error_message, model_visible_content, duration_ms}`. No `graph_delta` emission (not in the graph-tool set).

**Error returned:** never as a terminal SSE error; the `ingestion` handler's own envelope errors flow back to the model as failed `tool_result` blocks (BR-07 / BR-10 path).

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
| `tool_running(i,t)` | `iteration_completed(i)` | tool returns `{ok}` | `INSERT chat_tool_call` audit (BR-32); if `t in {traverse,get_node,list_nodes,search}` and `ok=true` and catalog available, emit `graph_delta` AFTER `tool_result` (BR-41); if `t === "start_async_ingestion"` then dispatch went through `service/ingest-adapter.ts` (BR-43) — synchronous intake + fire-and-forget extraction; envelope `{ok:true, result:{outcome, run_id, status:"running"}}` fed back to the model (no graph_delta — not in the graph-tool set); if `t === "get_ingestion_status"` then handler was reused verbatim from `ingest` toolset (BR-45) | UC-02 / UC-10 / UC-11 |
| `tool_running(i,t)` | `iteration_completed(i)` | tool timeout | wall-clock > `TOOL_TIMEOUT_MS` (BR-17); persist with `is_error=true` (BR-32); NO `graph_delta` (BR-41) | UC-02 |
| `iteration_completed(i)` | `iteration_persisted(i)` | agent yields `iteration_end{i}` | route opens `withTransaction`, inserts ONE assistant row `[text + tool_use]` + ONE synthetic user row `[tool_result]` atomically (BR-29 step 6.d). v2.2. | UC-02 |
| `iteration_persisted(i)` | `llm_streaming(i+1)` | next iteration begins | `i+1 <= MAX_ITERATIONS` (BR-15); truncate prior result (BR-13) | UC-02 |
| `iteration_completed(i)` | `done_internal_error` | per-iteration `withTransaction` fails | rollback; WARN `chat.iteration_persist_failure`; emit terminal `error{code:SYSTEM_INTERNAL_ERROR}` (BR-29 atomicity). v2.2. | UC-02 (`12a`) |
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
| `ingestion.service.ingestRawInformation` (consumed, v2.4 — BR-43) | Service-level dispatch for `start_async_ingestion` (intake) | The chat tool dispatcher (`service/ingest-adapter.ts`) invokes this synchronously inside the per-tool wall-clock budget (BR-17, default 15s — intake completes in < 1s). The ingestion service opens its OWN `withTransaction` and persists `RawInformation` + `RawChunk` + a `running` `LLMRun` atomically; idempotent via `content_hash` UNIQUE (`ingestion.back.md` BR-08). | Per-tool wall-clock `TOOL_TIMEOUT_MS` (BR-17, 15s). Intake is short by design; a 15s expiry signals an actual ingestion outage. | On layered-validation rejection -> failed `tool_result{ok:false}` with `STRUCTURAL_INVALID` envelope (BR-43 step 2); on pg-down -> `SYSTEM_SERVICE_UNAVAILABLE`; the turn does NOT abort — failed tool_result block fed back to the model (BR-07 / BR-10 path). |
| `ingestion.service.runLlmExtraction` (consumed, v2.4 — BR-43) | Fire-and-forget extraction for `start_async_ingestion` | Scheduled by `service/ingest-adapter.ts` on a `setImmediate` / microtask boundary AFTER intake completed with `outcome: "ingested"`. NOT awaited. The chat HTTP response terminates while the extraction is still running. The promise carries a top-level `.catch(...)` that logs WARN `chat.ingest_extraction_background_failure` on rejection; UC-12 of `ingestion` writes `llm_run.status = 'failed'` on its own fatal-failure path. | n/a (background — owned by `ingestion`'s extraction lifecycle; ~minutes per chunk, far beyond the chat budgets — that is WHY the dispatch is fire-and-forget). | Failure is observability-only on the chat side; the Owner discovers it via a subsequent `get_ingestion_status` call (BR-45 / UC-11). |
| `ingestion` MCP toolset registry (consumed, v2.4 — BR-05 / BR-45) | Read-only tool resolution for `get_ingestion_status` | The chat dispatcher resolves the handler via `mcp.getTool('ingest', 'get_ingestion_status')` (BR-45). The handler runs verbatim — same Zod schema, same `withReadOnly`, same envelope. | n/a (in-process registry lookup). | When the flag is on but the handler is not registered, BR-44 step 6 defensive degradation removes both ingestion entries from the chat catalog at boot. |
| `ingestion` service response shape (consumed, v2.5 — BR-43 / BR-45 `affected_nodes`) | Cross-domain envelope contract | `ingestion.service.ingestRawInformation` AND `ingestion.service.getIngestionStatus` MAY return an optional `affected_nodes: Array<{id, canonical_name, node_type}>` (TC-5; see `ingestion.back.md` BR-31 v2.5 amendment). The chat adapter (`service/ingest-adapter.ts`) and the `get_ingestion_status` dispatch path forward the field verbatim into the chat tool envelope's `result.affected_nodes`. NO transformation; absent on the ingestion side -> absent on the chat side (NOT `[]`/`null`). | n/a (in-process). | Failure mode: ingestion service rolled back before TC-5 lands -> envelope omits the field -> system prompt block 4C falls back to the search/list_nodes path (BR-18 v3) — the model still operates correctly, just less efficiently. |
| `knowledge-graph` `CatalogSnapshot` (consumed, v2.5 — BR-18 v3 block 4A) | Boot-time ontology rendering | The same `CatalogSnapshot` already passed to `registerChatRoutes` (via `ChatRouteDeps.catalog`, BR-41 for `graph_delta`) is threaded into `context-builder.buildModelContext({..., catalog})` and into `selectChatPromptModule(env.CHAT_PROMPT_VERSION).system(catalog)`. No extra wiring at boot. | n/a (in-process; loaded once at boot per `knowledge-graph.back.md` BR-23). | When the snapshot is unavailable (degraded boot — e.g. catalog loader failed), the route family is NOT mounted (same constraint as the v2.1 `graph_delta` projection); the chat is unavailable. The BFF logs ERROR at boot. |

---

## 8. Configuration / Environment

All values read once at boot from `process.env` via `loadEnv()` (the same loader that owns `LOCAL_OPERATOR_TOKEN`). The five new env vars (`CHAT_UTILITY_MODEL`, `CHAT_SUMMARY_AFTER_TURNS`, `CHAT_RECENT_WINDOW`, `CHAT_TITLE_ENABLED`, `CHAT_SUMMARY_ENABLED`) are all ADDITIVE and OPTIONAL — defaults preserve a reasonable single-owner experience without configuration.

| Env var | Type | Default | Required | Purpose |
|---------|------|---------|----------|---------|
| `CHAT_ENABLED` | boolean (`"true"`/`"false"`) | `true` | no | Kill-switch (BR-14). When `false`, every chat endpoint returns 503 `BUSINESS_CHAT_DISABLED`. |
| `CHAT_INGEST_ENABLED` | boolean (`"true"`/`"false"`) | `false` | no (NEW v2.4) | Feature flag gating the v2.4 async-ingestion capability on chat (BR-44). When `true`, the chat catalog includes `start_async_ingestion` + `get_ingestion_status` (15 tools total — BR-05); when `false`, the catalog is the v2.0 13-tool set. Toggle requires a BFF restart (boot-time read). Independent of `CHAT_ENABLED` (BR-44 step 5). |
| `CHAT_MODEL` | string | `claude-opus-4-8` | no | Default Anthropic model id for the turn (overridable per request via `model` body field). |
| `CHAT_UTILITY_MODEL` | string | `claude-haiku-4-5` | no (NEW) | Anthropic model id for distillation jobs (BR-33 / BR-34). Smaller / cheaper than the turn model. |
| `CHAT_PROMPT_VERSION` | string | `v3` | no | Chat system-prompt module version (BR-18 v3). **Default bumped from `v2` to `v3` in v2.5** — v3 is ontology-aware (renders the boot `CatalogSnapshot` into the system prompt) and carries the search-discipline + post-ingestion playbook directives (blocks 4A/4B/4C). `v1` and `v2` continue to resolve verbatim for backward-compatibility (they ignore the catalog argument of the widened `system(catalog)` signature). Unknown values -> boot fails (`UnknownChatPromptVersionError`). |
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
- `chat_ingest_start_total{ok, outcome}` -- counter, one increment per `start_async_ingestion` intake (BR-43). `outcome` in `{ingested, already_ingested}` on success; `ok=false` increments cover the `STRUCTURAL_INVALID` / `SYSTEM_*` paths. (NEW v2.4.)
- `chat_ingest_extraction_failure_total` -- counter, one increment per background-extraction WARN (BR-43 step 6). (NEW v2.4.)
- `chat_ingest_status_total{ok}` -- counter, one increment per `get_ingestion_status` invocation (BR-45). (NEW v2.4.)

WARN log shapes:

- `chat.assistant_row_persist_failure` (BR-29 step 8 failed).
- `chat.summary_refresh_failure` (BR-33 background failure).
- `chat.title_distillation_failure` (BR-34 background failure).
- `chat.output_guard_drop` (BR-20).
- `chat.graph_delta_normalize_failure` (BR-41 — projector or `search` hydration failed; the SSE stream is NOT terminated, only the optional `graph_delta` is dropped).
- `chat.ingest_extraction_background_failure` (BR-43 step 6 — fire-and-forget `runLlmExtraction` rejected after the chat HTTP response terminated; the chat domain does NOT propagate the failure to the SSE; `llm_run.status` is set to `failed` by `ingestion` UC-12; the Owner discovers it via a subsequent `get_ingestion_status` call).
- `chat.tool_catalog_partial_resolution` (BR-44 step 6 — boot ERROR; `CHAT_INGEST_ENABLED=true` but the `ingest` toolset did not expose one or both ingestion names; chat routes still mount with the 13-tool catalog).

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
| `BUSINESS_CHAT_INGEST_DISABLED` | 503 (REST envelope only — RESERVED, NOT emitted in v2.4) | `ChatIngestDisabledError` (NOT exported in v2.4 — class reserved) | Reserved for a future revision that introduces a runtime gate inside `sendMessage`. v2.4 implements `CHAT_INGEST_ENABLED` as a CATALOG FILTER at boot (BR-44), not a runtime check; this code is registered in the global catalog for forward-compatibility only. NEW v2.4. |
| `STRUCTURAL_INVALID` | n/a (in-stream — fed back to the model as a failed `tool_result` block; NEVER a terminal SSE `error` frame) | reused from `ingestion` envelope codes | Layered-validation rejection of `start_async_ingestion` inputs / intake call (BR-43 step 1 / step 2). The chat domain does NOT define a class — the code originates from `ingestion.service.ingestRawInformation` and the adapter forwards it verbatim. Reserved in the global catalog under "MCP / Ingestion envelope codes". NEW v2.4 usage from chat. |

Reused codes (already registered in the global catalog — no new code needed):

- `VALIDATION_INVALID_FORMAT` -- pre-stream body / query / cursor parse failures (BR-01/BR-04/BR-26/BR-35); in-stream defensive guard for unknown tool name (BR-10).
- `VALIDATION_REQUIRED_FIELD` -- missing `Idempotency-Key` header (BR-26); empty PATCH body (BR-36).
- `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` -- inherited from `requireNeonAuth`.
- `RESOURCE_NOT_FOUND` -- conversation absent (BR-22); cancel-with-no-inflight (BR-38).
- `SYSTEM_INTERNAL_ERROR` -- pre-stream unexpected exception (REST envelope); in-stream unhandled exception in the agentic loop (SSE `error` frame).
- `SYSTEM_SERVICE_UNAVAILABLE` -- in-loop tool timeout (BR-17), fed back to the model; NEVER emitted as a terminal SSE `error` frame.
- `SYSTEM_SERVICE_UNAVAILABLE` -- v2.4 ALSO used inside the `start_async_ingestion` adapter when intake fails because pg is unavailable (BR-43 step 2). Same in-stream contract: fed back to the model as a failed `tool_result`; NEVER terminal.

> Action item for implementation: register the three new business codes
> (`BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`,
> `BUSINESS_IDEMPOTENCY_MISMATCH`) in `modules/chat/service/errors.ts`. The
> error-code registry is per-module today (`modules/*/service/errors.ts`); no
> global-file edit is required.

> Action item for v2.4 implementation: `service/ingest-adapter.ts` MUST map
> `ingestion`'s layered-validation errors to the `STRUCTURAL_INVALID` envelope
> code (BR-43 step 2). `BUSINESS_CHAT_INGEST_DISABLED` stays UNREGISTERED in
> `modules/chat/service/errors.ts` until a future revision introduces a
> runtime gate (the global catalog reservation is enough — no class is emitted
> from v2.4 routes).

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
- **Per-iteration persistence cost (v2.2, BR-29):** each tool-bearing iteration adds ONE `withTransaction` round-trip (two INSERTs: assistant iteration row + synthetic user tool_result row) on top of the per-call `chat_tool_call` audit insert (BR-32). p95 budget per pair: < 30 ms on Neon's direct connection. With `MAX_ITERATIONS=8` worst case, the per-turn DB work is bounded by `1 + 8×(2 INSERTs + 1 audit INSERT) + 1 final assistant + 1 attach = 28 round-trips`, still small compared to the per-turn LLM wall-clock (`TURN_TIMEOUT_MS=90s`). The cost is spread across the turn — each per-iteration pair commits between iterations, so a failure in iteration `i+1` does NOT roll back the persisted rows of iteration `i`.

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
- **Multi-row persistence per iteration (v2.2, BR-29 / BR-02 / §2.1).** Each tool-bearing iteration now inserts TWO `chat_message` rows (one assistant `[text + tool_use]`, one synthetic user `[tool_result]`) atomically inside the same `withTransaction`; the final assistant row inserts in the post-stream transaction (step 8). A turn with `MAX_ITERATIONS=8` worst case persists 17 rows (1 user natural-language + 8 × 2 iteration pair + 1 final assistant + 8 `chat_tool_call` audit) — still well within the chat tables' performance budget (§11). The atomicity of each iteration pair is non-negotiable: a half-persisted pair would re-introduce the v2.0 / v2.1 next-turn bug. If the iteration transaction fails mid-pair, the route surfaces a terminal `SYSTEM_INTERNAL_ERROR` SSE frame and writes the final assistant row with `stop_reason="internal_error"` — see BR-29 "Atomicity of iteration boundaries".
- **`chat_message.content` jsonb is polymorphic (v2.2).** v2.0 / v2.1 implicitly assumed `chat_message.content` carried `[{type:"text", text:string}]` blocks only. v2.2 generalises the column to ANY Anthropic content-block taxonomy (`text`, `tool_use`, `tool_result`). The column type is unchanged (`jsonb`); the change is conceptual + at the repository / context-builder layers. The BR-27 idempotency comparator unwraps `content[0].text` on the user natural-language row only (the row carrying the `idempotency_key`) — synthetic user rows carry `idempotency_key=NULL` and are excluded from the partial unique index, so the comparator never sees a `tool_result` block.
- **Surface filtering at the SPA boundary (v2.2, BR-39).** `listMessages` returns all `chat_message` rows verbatim — including synthetic rows used for replay. The SPA filters synthetic rows by content-block inspection (assistant rows with NO `text` block; user rows with NO `text` block). A future server-side filter is possible but explicitly deferred — keeping the surface uniform with the replay model (BR-31) avoids divergence between the model's view of history and the user's view that surfaced the v2.0 / v2.1 bug in the first place.
- **Service-level dependency on `ingestion` (v2.4, BR-43).** `service/ingest-adapter.ts` imports `ingestRawInformation` + `runLlmExtraction` from `modules/ingestion/service/ingestion.service.ts`. This is a registered cross-module value import (in addition to the existing `defaultAnthropicFactory` pattern reuse) and is documented as a reverse declaration in `chat.spec.md` §7. A future cleanup may promote the two functions to a `shared/` surface; v2.4 keeps the direct import to minimise wiring churn. The boundary rule (§1.1) is extended accordingly.
- **Fire-and-forget extraction has no chat-side lifecycle (v2.4, BR-43 step 6).** The background `runLlmExtraction` promise is intentionally NOT tracked in any chat-domain registry. The chat HTTP response terminates while extraction is still running; the `.catch(...)` handler is the only chat-side safety net (WARN log). Failure observability lives in `ingestion` (`llm_run.status = 'failed'`); the Owner discovers it via `get_ingestion_status` (BR-45 / UC-11). A future "active ingestion runs" dashboard would query `llm_run` directly, not the chat domain.
- **`CHAT_INGEST_ENABLED` is a boot-time gate, not a per-request check (v2.4, BR-44).** Toggling the flag requires a BFF restart. Hot-reload is intentionally out of scope; the catalog-construction cache (BR-05) is keyed on the process lifetime. The reserved error code `BUSINESS_CHAT_INGEST_DISABLED` is NOT emitted by any v2.4 route — it is only registered in the global catalog so a future revision can use it for a per-request gate without coining a new code.
- **Independent ingestion model (v2.4).** `start_async_ingestion` forwards the optional `model?` argument to `ingestion.service.ingestRawInformation`. When omitted, `ingestion` uses its own default `env.INGEST_MODEL` (default `claude-sonnet-4-6` per `ingestion.back.md`). The chat-turn model (`env.CHAT_MODEL`, default `claude-opus-4-8`) is DIFFERENT and NOT propagated to extraction — they are independent dimensions (the chat turn that requested the ingestion may use Opus while the per-chunk extraction uses Sonnet).
- **Ontology snapshot is boot-time stable (v2.5, BR-18 v3 block 4A).** The `CatalogSnapshot` is loaded ONCE at boot by `knowledge-graph` (per `knowledge-graph.back.md` BR-23). The rendered ontology block in the system prompt is therefore byte-stable for the entire process lifetime — same `system(catalog)` text across every turn and every conversation. This stability is the precondition for the Anthropic `cache_control` prefix to stay valid (P0 prompt-caching invariant from the `llm-cost-audit` memory; same property leveraged by the ingestion extraction prompt). Hot-reload of the catalog is intentionally out of scope (§13); adding a new `NodeType`/`LinkType`/`AttributeKey` requires a BFF restart per the `ontology-extension-playbook` — the prompt cache effectively resets on the same restart, so the two cadences are aligned by design.
- **TC-5 `affected_nodes` propagation is a soft contract (v2.5, BR-43 / BR-45).** The chat adapter forwards `affected_nodes` verbatim from the ingestion service response. The system prompt block 4C (BR-18 v3) treats the field as OPTIONAL — when absent or empty, the model falls back to one-name-per-`search` / `list_nodes(node_type=<...>)` per block 4B. A future ingestion-side rollback that drops the field does NOT break chat (it degrades the post-ingestion narration to the slower lexical path). The chat adapter MUST NOT synthesise the field (no enrichment); doing so would couple chat to a re-implementation of the consolidation logic — a forbidden coupling per the §1.1 boundary rule.
- **Cache-control invariant is sensitive to system-prompt drift (v2.5).** The Anthropic `cache_control` prefix marking the system+tools block as cacheable hashes the EXACT system text. Any unintended variation (e.g. a `Date.now()` interpolation, a non-deterministic sort, a Map iteration order) silently invalidates the cache on every turn. v3's `system(catalog)` is required to be deterministic (BR-18 v3 implementation note); the v2.5 regression tests (xix) assert byte-stability across two calls with the same catalog reference. If a future revision needs to add a per-turn dynamic field, it MUST live OUTSIDE the cached system prefix (e.g. as the first user-message turn instead).

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
- **The four `propose_*` ingestion tools (`propose_fragment` / `propose_node` / `propose_link` / `propose_attribute`) from chat** — intentionally NOT on the chat catalog (they require an explicit `llm_run_id` binding that the chat dispatcher does not produce; see BR-06 v2.4 step 5).
- **The other `ingest`-toolset operational tools (`health`, `list_recent_ingestions`) on chat** — single-owner; the Owner can call them via the MCP endpoint directly (BR-45 step 4).
- **A `BUSINESS_CHAT_INGEST_DISABLED` runtime gate inside `sendMessage`** — v2.4 implements `CHAT_INGEST_ENABLED` as a catalog filter at boot (BR-44), not as a per-request 503. The code is registered for forward-compatibility but is NOT emitted by v2.4 routes.
- **Auto-polling of `get_ingestion_status` inside the same turn** — the system prompt (BR-18 v2.4) explicitly forbids the model from looping on the status tool; status is reported once on explicit Owner request (UC-11 of `chat.spec.md`).
- **Out-of-band notification of background-extraction completion** — v2.4 does NOT push status updates to an active SSE stream; the Owner discovers status on the next `get_ingestion_status` call.
- **Idempotent replay (BR-27) re-execution of turns that invoked `start_async_ingestion`** — v2.4 replays the persisted assistant text verbatim (existing UC-07 contract). The replay does NOT re-execute the tool dispatch; the background extraction it triggered is unaffected. Re-running ingestion on replay would either double-ingest (if content hash differs) or no-op (if it does not), and the original turn already produced the durable run-id.
- **Multi-tool ingestion (e.g. `propose_node` directly from chat)** — v2.4 limits the LLM's write authority to the single `start_async_ingestion` entry point; finer-grained graph editing from chat is a future, owner-approved evolution.
- **Hot-reload of `CHAT_INGEST_ENABLED`** — boot-time read only; restart required to toggle.
- **Hot-reload of `CatalogSnapshot` into the system prompt (v2.5)** — the ontology block of BR-18 v3 block 4A is built from the boot-time snapshot. Refreshing the catalog at runtime would invalidate the Anthropic `cache_control` prefix (P0 invariant); the cadence of restart-on-migration (`ontology-extension-playbook`) already aligns with the cache reset, so v2.5 defers hot-reload to a future revision.
- **Chat-side synthesis of `affected_nodes` from the consolidation outcome (v2.5)** — the chat adapter ONLY propagates the field as provided by `ingestion`. Re-deriving the field from `ConsolidationOutcome` events or by scanning the LLMRun's `ToolCall` rows is intentionally NOT done here; that derivation belongs in the `ingestion` service (TC-5), keeping the §1.1 boundary intact.
- **Per-turn variation of the rendered ontology block** — v3 renders the block deterministically from the SAME catalog reference. Tailoring the block per-conversation (e.g. only the NodeTypes relevant to the current topic) is a future optimisation; v2.5 explicitly opts for byte-stability over targeted rendering to preserve the prompt cache.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-19 | Back Spec Agent | initial | Initial version — new `chat` backend spec. Stateless v1, READ-ONLY agentic loop over the 13 `query`-toolset tools. | -- |
| 1.1.0 | 2026-06-19 | Back Spec Agent | refine | Added §1.1 file layout, §1.2 `ChatAgentService` contract; added BR-23/BR-24 invariants; added §8 env table, §9 pino schema, §10 error catalog, §11 budgets. | -- |
| 1.1.1 | 2026-06-19 | Back Spec Agent | patch | Corrected `VALIDATION_INVALID_FORMAT` pre-stream HTTP status from 400 to 422. | REPAIR-1 |
| 2.0.0 | 2026-06-20 | Back Spec Agent | major (breaking) | **Stateful conversations.** Adopts `.spec.md` v2.0.0 / `openapi.yaml` v2.0.0. (a) §2 Data Model is no longer empty: 3 owned tables (`chat_conversation`, `chat_message`, `chat_tool_call`) + 1 enum (`chat_message_role`) via migration `0004_chat_persistence.sql` (spec artifact at `./0004_chat_persistence.sql`; DB Safety Rule — NOT applied at spec time). NO `user_id` column anywhere (single-owner). Compliance §11 exclusion is intentional (BR-37). (b) NEW §3 Repository Layer documenting the `chat.repository.ts` contract (raw `pg` parameterized, `PoolClient`-based, reusing `withTransaction`/`withReadOnly` from `modules/curation/service/transaction.ts`). (c) §1.1 file layout extended: added `repository/chat.repository.ts`, `service/conversation.service.ts`, `service/context-builder.ts`, `service/distillation.service.ts`, `service/turn-registry.ts`; the existing `chat-agent.service.ts` keeps its scope (agentic loop only — DB reads now come from `context-builder`). (d) §1.2 `ChatEvent.tool_result` enriched with full per-call payload (arguments, result, is_error, error_message, duration_ms) and `ChatEvent.done` / `ChatEvent.error` carry the `content` blocks + token sums for BR-29 persistence. (e) §4 Business Rules: BR-01..BR-24 preserved (turn semantics unchanged) with edits to "Where to validate" reflecting the new repository + service split; added BR-25..BR-40 (archived = no-write, Idempotency-Key required, idempotent replay, single in-flight turn, persistence sequencing, conversation create body, context reconstruction, tool-call persistence, rolling summary, title distillation, conversation listing pagination, patch body, cascade delete + compliance exclusion, cancel endpoint, message listing pagination, usage aggregation). (f) §5 State machine extended: added ST-01 conversation lifecycle; ST-02 turn lifecycle now includes the `user_row_persisted`, `replay_open`, and `assistant_row_persisted` states. (g) §7 External Integrations: added the utility-model call (`CHAT_UTILITY_MODEL` for distillation jobs) and the chat-owned Neon writes. (h) §8 env table adds five additive optional vars (`CHAT_UTILITY_MODEL`, `CHAT_SUMMARY_AFTER_TURNS`, `CHAT_RECENT_WINDOW`, `CHAT_TITLE_ENABLED`, `CHAT_SUMMARY_ENABLED`). (i) §9 pino schema gains `conversation_id`, `message_id`, `idempotent_replay`; new counters/histograms for replay, in-progress conflict, summary refresh, title distillation. (j) §10 error catalog: 3 new business codes (`BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`, `BUSINESS_IDEMPOTENCY_MISMATCH`) registered in `service/errors.ts`. (k) §11 budgets refined with the chat-table DB cost; §12 constraints add the in-process turn registry, distillation fire-and-forget model, `(content, model)` comparator caveat; §13 out-of-scope reaffirms the BACKEND-ONLY scope and the migration-not-applied stance. (l) PRESERVED from v1: agentic loop semantics, READ-ONLY tool catalog, SSE framing, sanity ceilings, abort semantics, pino observability shape (extended). | -- |
| 2.1.0 | 2026-06-21 | Back Spec Agent | minor (additive) | **Chat-Graph projection (additive 7th SSE frame).** Adopts `openapi.yaml` v2.1.0. Source: `temp/chat-graphspace-plan.md` (rev. 2026-06-21) §4.1 wire format + §9 Fase B + AC-B.7. (a) Header amended with the v2.1 additive deviation paragraph documenting the route-owned `graph_delta` projection. (b) §1.1 file layout extended with `service/graph-normalizer.ts` (pure projection + dispatcher; consumes `CatalogSnapshot.linkTypeByName` and `findNodesByIds` from `knowledge-graph`). (c) §1.1 boundary note rewritten: the chat module is now permitted READ-ONLY imports of `CatalogSnapshot` (type) and `findNodesByIds` (value) from `knowledge-graph`; the `query-retrieval` boundary remains intact. (d) §1.2 `ChatEvent` union extended with a `graph_delta` variant (route-owned synthesis — the agent service NEVER yields it); new wire types `GraphNodeWire` / `GraphLinkWire` (snake_case). (e) NEW §4 BR-41 documents the projection contract end-to-end: trigger (`ok=true` + graph tool name), per-tool normalization (traverse / get_node / list_nodes / search-with-hydration), wire emission ordering (always AFTER the originating `tool_result`), defensive WARN-and-skip on exception, non-persistence, and non-replay. (f) §5 ST-02 transition row `tool_running -> iteration_completed (ok)` annotated with the `graph_delta` emission contract. (g) §7 External Integrations: new row for `findNodesByIds` consumption (search hydration / G-A); same Neon pool, no new connection. (h) §9 WARN log shapes: added `chat.graph_delta_normalize_failure`. (i) §11 budgets: new `graph_delta projection p95 < 50 ms` line. (j) §12 known constraints: catalog-snapshot dependency, non-persistence, non-replay. (k) Search hydration G-A deviation registered as a normative note inline in BR-41 (chat module imports `findNodesByIds`; `query-retrieval` boundary preserved). PRESERVED from v2.0: all existing BRs (no renumbering, no removals), data model unchanged, no new env var, no migration. | -- |
| 2.2.0 | 2026-06-21 | Back Spec Agent | patch (bugfix) | **Faithful multi-row persistence of the agentic turn.** Owner-approved fix for the multi-turn provider_error bug: turn 1 succeeds, turn 2 fails with `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` whenever turn 1 invoked a tool. Root cause: the agentic turn persisted as ONE assistant `chat_message` row whose `content` carried raw `tool_use` blocks but NOT the matching `tool_result` blocks (those lived only in audit `chat_tool_call` rows); BR-31 mapped each row 1:1 to an Anthropic `MessageParam` verbatim, so the rebuilt history on turn 2 contained an assistant `tool_use` with no following `tool_result` — Anthropic 400 `tool_use ids were found without tool_result blocks immediately after` surfaced via BR-11 as `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`. Same bug broke title/summary distillation (BR-33 / BR-34). Changes: (a) Header amended with the v2.2 bugfix paragraph. (b) §1 Testing row: added regression items (xiii) multi-turn test where turn 1 invokes a tool and turn 2 succeeds (the coverage gap that let it ship) + (xiv) distillation regression on tool-bearing older slices. (c) §1 Transaction policy row: added a fourth shape — per-iteration `(assistant, synthetic_user)` pair `withTransaction`. (d) §1.1 chat.routes.ts blurb: replaced the SSE-drain persistence pseudocode with the per-iteration pair logic. (e) §1.1 chat-agent.service.ts blurb: agent now yields `tool_use_id` on `tool_start` + `tool_result` AND a new `iteration_end{iteration, assistant_content, tool_results}` event at each iteration boundary. (f) §1.2 `ChatEvent` union extended: `tool_start` carries `tool_use_id` + `input`; `tool_result` carries `tool_use_id` + `model_visible_content`; NEW `iteration_end` variant yielded by the agent and consumed by the route to drive BR-29 step 6.d persistence (internal event — NOT written to the SSE wire). (g) §1.2 contract narrative gained a v2.2 "persistence partnership" subsection. (h) §2.1 enum prose: replaced the v2.0 / v2.1 "transient tool_use / tool_result blocks NEVER persisted as their own rows" wording with the v2.2 multi-row sequencing rule: each tool-bearing iteration persists ONE assistant `[text + tool_use]` row + ONE synthetic user `[tool_result]` row, plus a final assistant `[text]` row at turn end. (i) BR-02 rewritten to reflect persisted `tool_use` / `tool_result` content blocks on the existing `{user, assistant}` enum; `chat_message.content jsonb` is already polymorphic — NO migration. (j) BR-29 rewritten end-to-end: pre-stream insert of the user natural-language row (unchanged); per-iteration `(assistant, synthetic_user)` pair atomically inserted in step 6.d INSIDE the same `withTransaction`; final assistant row inserted in the post-stream transaction (step 8.a) carrying the closing text + `stop_reason` + token sums + latency; ALL `chat_tool_call` audit rows attached to the FINAL assistant row in step 8.b. Atomicity of each iteration pair is non-negotiable; crash recovery is documented. (k) BR-31 rewritten to note that the 1:1 verbatim replay now yields a VALID Anthropic sequence by construction (because BR-29 v2.2 persists the matching `tool_result` row in lock-step); added a row-classification table (natural-language user / synthetic tool_result user / assistant). (l) BR-32 rewritten to clarify the audit-only role of `chat_tool_call` (no longer the SOLE persistence surface for tool calls); attachment now anchors to the FINAL assistant row, not the per-iteration ones. (m) BR-33 amended: `countUserTurns` filters to natural-language user rows only (`idempotency_key IS NOT NULL`); `listOlderMessagesForSummary` cuts on TURN boundaries to avoid splitting tool_use / tool_result pairs (otherwise the distillation request hits the same Anthropic 400). (n) BR-34 amended: `getFirstUserAndAssistant` filters to the first natural-language user row + the first text-bearing assistant row (skipping leading per-iteration assistant rows that carry only `tool_use` blocks). (o) BR-39 amended: route returns ALL `chat_message` rows verbatim; SPA filters synthetic rows (assistant rows with no `text` block; user rows with no `text` block) by content-block inspection. (p) §5 ST-02 updated: new `iteration_persisted(i)` state between `iteration_completed(i)` and `llm_streaming(i+1)`; new `done_internal_error` transition on per-iteration transaction failure. (q) §11 budgets: new bullet on per-iteration persistence cost (< 30 ms per pair on Neon). (r) §12 known constraints: three new entries (multi-row persistence per iteration with atomicity caveat; `chat_message.content` jsonb polymorphism; surface filtering at the SPA boundary). NO migration. NO new env var. NO new error code. PRESERVED from v2.1: `graph_delta` projection (BR-41) — unaffected by the fix (lives on `tool_result` events, which still arrive in the same order). PRESERVED from v2.0: all CRUD endpoints, all error codes, OpenAPI v2.1.0 (no wire changes for the SPA). | sdd_improve_1_spec-back |
| 2.3.0 | 2026-06-22 | Back Spec Agent | minor (additive) | **Per-conversation graph-view snapshot (view memento).** Adopts `openapi.yaml` v2.2.0. (a) §2 header amended: domain now owns 4 tables; new `migrations/0005_chat_graph_view.sql` (DDL only — DB Safety Rule, NOT applied at spec time). (b) NEW §4 BR-42 documents the graph-view snapshot contract end-to-end: `chat_graph_view` DDL (PK = `conversation_id`, JSONB `snapshot`, cascade-delete, outside §11), `SaveGraphViewRequest` Zod schema (size cap 2000/array), `getConversationGraphView` / `upsertConversationGraphView` repository functions, `GET` 200+null / `PUT` 200 route contract. Snapshot is a VIEW MEMENTO (not a KG re-projection). (c) Header amended with the v2.3 additive deviation paragraph. PRESERVED from v2.2: all existing BRs (no renumbering, no removals); multi-row persistence semantics; `graph_delta` projection (BR-41). NO new env var. NO new error code. | sdd_improve_2_spec-back |
| 2.4.0 | 2026-06-22 | Back Spec Agent | minor (additive, feature-flagged) | **Async ingestion capability on chat (BACKEND + SPEC contract change).** Adopts `chat.spec.md` v2.3.0 + `openapi.yaml` v2.3.0. Revokes the v2.0 BR-05 invariant ("13 read-only tools"); the chat catalog now carries a FIXED 15-tool list when `CHAT_INGEST_ENABLED=true` (BR-44, default `false`): the 13 read `query` tools (preserved) + `start_async_ingestion` (BR-43, write-bearing, dispatches `ingestion.service.ingestRawInformation` (UC-01) + fires `ingestion.service.runLlmExtraction` (UC-12) as background fire-and-forget) + `get_ingestion_status` (BR-45, read-only, verbatim reuse of `ingestion.back.md` BR-31). The asynchronous execution is FORCED by the existing chat budgets (`TOOL_TIMEOUT_MS=15s`, `TURN_TIMEOUT_MS=90s`) vs. the per-chunk extraction latency (~67s). Added BRs: BR-43 (`start_async_ingestion` contract — intake sync via service-level dispatch, fire-and-forget extraction, audit, layered-validation error mapping to `STRUCTURAL_INVALID`, background-task safety with WARN catch), BR-44 (`CHAT_INGEST_ENABLED` feature flag — catalog filter at boot, no runtime 503, defensive degradation when registry partial), BR-45 (`get_ingestion_status` verbatim reuse via `mcp.getTool('ingest', name)`). Updated BRs: BR-05 (catalog revoke + 15-tool restatement, lazy gated resolution), BR-06 (dispatch invariant restatement — LLM never writes raw SQL; every byte flows through `ingestion`'s 5-layer validation; no `propose_*` reachable from chat), BR-18 (CHAT_PROMPT_VERSION default bumped `v1` → `v2` with three ingestion directives: explicit Owner request required; document-as-data; no auto-polling). §1.1 file layout adds `service/ingest-adapter.ts` (dispatcher composition over `ingestion.service`) and `prompts/v2.ts` (pt-BR turn prompt with ingestion directives — v1 preserved for backward-compat). §1.1 boundary note extended: chat now imports two VALUES from `ingestion/service/ingestion.service.ts` (`ingestRawInformation`, `runLlmExtraction`) as a registered service-level dependency. §5 ST-02 row `tool_running -> iteration_completed` annotated with the v2.4 ingestion-tool dispatch behaviour. §7 External Integrations: three new rows (`ingestion.service.ingestRawInformation` consumed sync; `ingestion.service.runLlmExtraction` consumed fire-and-forget; `ingestion` MCP toolset registry consumed for `get_ingestion_status` resolution). §8 env: NEW `CHAT_INGEST_ENABLED` (boolean, default `false`); `CHAT_PROMPT_VERSION` default bumped `v1`→`v2`. §9 observability: new counters `chat_ingest_start_total{ok, outcome}`, `chat_ingest_extraction_failure_total`, `chat_ingest_status_total{ok}`; new WARN log shapes `chat.ingest_extraction_background_failure`, `chat.tool_catalog_partial_resolution`. §10 error catalog: `BUSINESS_CHAT_INGEST_DISABLED` (RESERVED — registered in the global catalog for forward-compatibility, NOT emitted by v2.4 routes), `STRUCTURAL_INVALID` (in-stream tool_result code from the `start_async_ingestion` adapter, originating from `ingestion`'s layered validation). §12 constraints: four new entries (service-level dependency on `ingestion`; fire-and-forget extraction lifecycle owned by `ingestion`; `CHAT_INGEST_ENABLED` is boot-time only; independent ingestion model dimension). §13 out of scope: eight v2.4 bullets (no `propose_*` from chat; no `health`/`list_recent_ingestions`; no runtime 503 for the flag; no auto-polling; no out-of-band push; no replay re-execution of ingestion tools; no multi-tool ingestion; no hot-reload of the flag). Reviewer feedback addressed in tandem (chat.spec.md): §1 Objective + Bounded context updated for 15-tool catalog + graph-view sub-resource; Changelog re-ordered + missing v2.1.0 + v2.2.0 entries added. Global error-codes.md gains a new "MCP / Ingestion envelope codes" section registering `STRUCTURAL_INVALID`. NO schema change. NO new HTTP endpoint. NO migration. PRESERVED from v2.3: graph-view snapshot (BR-42); from v2.2: faithful multi-row persistence (BR-29 / BR-31 / BR-32); from v2.1: `graph_delta` projection (BR-41); from v2.0: all CRUD endpoints, all v2.x business codes. | sdd_chat_spec-back |
| 2.5.0 | 2026-06-23 | Back Spec Agent | minor (additive) | **Ontology-aware chat prompt (`v3`) + TC-5 `affected_nodes` propagation.** Owner-approved 2026-06-23 in response to a real post-ingestion failure (the model concatenated multiple proper nouns into one `search` -> 0 hits, fell back to an unfiltered `list_nodes(limit:30)`, and described the WRONG project). Root causes (both fixed): (a) `prompts/v1.ts` + `prompts/v2.ts` carried NO ontology block — the model lacked first-class knowledge of NodeType/LinkType/AttributeKey vocabulary AND lacked warnings about `search` AND-semantics + `list_nodes` `node_type` filter; (b) `start_async_ingestion` and `get_ingestion_status` returned only counters, forcing the chat to GUESS the search after ingestion. Changes: (a) Header amended with the v2.5 additive deviation paragraph documenting the ontology-aware prompt + TC-5 propagation contract. (b) §1 Stack: MCP integration row notes that the `CatalogSnapshot` already in `ChatRouteDeps` (BR-41) now ALSO threads into `context-builder.buildModelContext({..., catalog})` and into `selectChatPromptModule(...).system(catalog)`; cache-control invariant explicitly preserved. (c) §1 Testing row: added regression items (xix) ontology-block rendering test (byte-stability, sensitivity to catalog changes, no hardcoded types), (xx) search-discipline directive regex test (block 4B), (xxi) post-ingestion playbook regex test (block 4C), (xxii) TC-5 propagation test (verbatim forwarding through `ingest-adapter` and `get_ingestion_status` dispatch; absent-key invariant), (xxiii) prompt-version registry test (`v1`/`v2`/`v3` resolve, default `v3`, unknown throws), (xxiv) real-LLM 2-turn regression on the original failing scenario (turn 2 mentions BOTH ingested proper nouns; no multi-name concatenated `search`; no unfiltered `list_nodes` enumeration). (d) §1.1 file layout: `prompts/index.ts` returns `ChatPromptModule` with widened signature `system(catalog: CatalogSnapshot)`; `prompts/v2.ts` preserved verbatim (now ignores the catalog argument); NEW `prompts/v3.ts` blurb documenting the implementation contract end-to-end (4A ontology renderer; 4B search discipline; 4C post-ingestion playbook; deterministic byte-stable). `context-builder.ts` blurb widens to receive `catalog` and forward it into `system(catalog)`. `ingest-adapter.ts` blurb extends the tool envelope shape with optional `affected_nodes?: Array<{id, canonical_name, node_type}>` propagated verbatim from the `ingestion` service response (no transformation; absent on ingestion -> absent on chat; never `[]`/`null`). (e) BR-18 rewritten end-to-end as v3: signature change `system(catalog)`; v1/v2 preserved verbatim (catalog ignored); v3 adds three blocks (4A ONTOLOGY rendered from `catalog.nodeTypes` / `catalog.linkTypes` + LinkTypeRules / `catalog.attributeKeys`; 4B SEARCH DISCIPLINE — search is lexical AND, one name per call, `list_nodes` MUST take `node_type` for category enumeration, use `list_*_types` for discovery; 4C POST-INGESTION PLAYBOOK — use `affected_nodes` for direct `get_node`/`traverse`, fall back to one-name-per-`search` if absent, NEVER unfiltered `list_nodes` as "what was ingested"). v2 ingestion directives (Owner-explicit-request gate, document-as-data, no auto-polling) preserved in v3. Cache-control invariant preserved (boot-stable catalog -> byte-stable system text). (f) BR-43 step 4 amended: tool envelope extended with optional `affected_nodes`; new step 4a documenting the TC-5 propagation contract (synchronous-intake path returns the field empty/absent; `outcome:"already_ingested"` MAY surface previously-consolidated nodes; adapter MUST NOT transform). (g) BR-45 amended: `get_ingestion_status` response shape extended with optional `affected_nodes` populated when `status === "completed"` (union of CREATED + RE-CONFIRMED nodes deduplicated; absent when status is not completed); chat dispatcher forwards verbatim. (h) §7 External Integrations: two new rows (TC-5 `ingestion` service response shape contract; `knowledge-graph` `CatalogSnapshot` consumption for the ontology block). (i) §8 env: `CHAT_PROMPT_VERSION` default bumped `v2` -> `v3`. (j) §12 known constraints: three new entries (ontology snapshot is boot-time stable + cache-aligned with `ontology-extension-playbook`; TC-5 `affected_nodes` is a soft contract — degrades gracefully when absent; cache-control invariant is sensitive to system-prompt drift, v3 byte-stability is regression-guarded). (k) §13 out of scope: three v2.5 bullets (no hot-reload of `CatalogSnapshot` into the prompt; no chat-side synthesis of `affected_nodes`; no per-turn variation of the rendered ontology block). NO migration. NO new HTTP endpoint. NO new error code. NO new env var (re-uses existing `CHAT_PROMPT_VERSION`). PRESERVED from v2.4: catalog gating (BR-05 / BR-44 `CHAT_INGEST_ENABLED`); dispatch invariant (BR-06); ingestion directives of v2 (now part of v3). PRESERVED from v2.3: graph-view snapshot (BR-42). PRESERVED from v2.2: multi-row persistence (BR-29 / BR-31 / BR-32). PRESERVED from v2.1: `graph_delta` projection (BR-41). | sdd_improve_1_spec-back |
