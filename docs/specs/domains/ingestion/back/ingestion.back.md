# Ingestion -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 via Neon (driver `pg` raw) | Version: 1.2.4 | Status: draft | Layer: permanent
> Business spec: `../ingestion.spec.md`
> REST contract: `../openapi.yaml`
> MCP contract: `remember-modelagem-v7.md` §14.1 (toolset `ingest`)
> Schema: `migrations/0001_init.sql` (single bootstrap; no DDL change required by this revision)

---

## 1. Stack and Patterns

> Declare only values that differ from or extend CLAUDE.md. Use `"CLAUDE.md default"` for aspects already covered there.

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves `openapi.yaml`) | CLAUDE.md default |
| MCP server | Same BFF process, second transport over the same service layer (CLAUDE.md "Architecture / MCP Server"). The `ingest` MCP endpoint (`POST /api/v1/mcp/ingest`) is mounted via the shared SDK kernel `mountMcpEndpoint` (`backend/src/mcp/sdk-http-transport.ts`) — low-level `@modelcontextprotocol/sdk` `Server`, Streamable HTTP **stateless** (no per-session state), MCP 2025-06-18 `content` / `isError`. Same kernel as the `query` and `curation` transports; no per-session model. Dual-transport (REST + MCP) for the four `ingest` tools — see BR-21 (revised) and BR-28. | Documented deviation from A28/§14 ("ingest is MCP-only") — confirmed by the owner; the same deviation is recorded in CLAUDE.md. |
| ORM | None — raw `pg` driver with parameterized queries (A6, §2.2 of v7). String concatenation of SQL is forbidden (CLAUDE.md "Security"). | CLAUDE.md default |
| Migration strategy | Versioned SQL files in `migrations/` (`0001_init.sql` consolidates schema + seed). New catalog entries require a new migration (§12). New chunking versions require a new migration (BR-03). **This revision adds NO migration** — the schema already supports entity-resolution and graph-consolidation (`node_alias.alias_norm` GENERATED, trigram index `node_alias_norm_trgm_idx`, `entity_match_review` table, partial dup-guard indexes, `knowledge_node.status`/`merged_into_node_id`, `norm()` / `immutable_unaccent()` functions). | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/ingestion/`. Internal layers per module: `routes` (Fastify route handlers + Zod request/response schemas) → `mcp` (MCP tool handlers — thin adapters over the same services, registered with the shared SDK kernel `mountMcpEndpoint` for a stateless single-shape endpoint; no per-session factory) → `service` (transport-agnostic business functions + the 5-layer validation of §13 + the extraction orchestrator) → `repository` (parameterized SQL against the tables owned by this domain). The four `propose_*` business functions live in `service/propose-fragment.service.ts`, `service/propose-node.service.ts`, `service/propose-link.service.ts`, `service/propose-attribute.service.ts`; the orchestrator in `service/extraction.service.ts`; the resolver in `service/entity-resolution.service.ts`; the consolidator in `service/graph-consolidation.service.ts`. The MCP handlers and REST mirrors are pure transport adapters that call those services with the same arguments and return the same envelope (BR-28). The per-session model (`backend/src/modules/ingestion/mcp/session-factory.ts`) is **retired** by this revision — the MCP endpoint is now stateless single-shape, exactly like `query` and `curation`. | Aligned with CLAUDE.md "folder_structure: modules". |
| Validation library | Zod v4 — every REST DTO and every MCP tool input has a Zod schema. The **business DTO** for each `propose_*` action is a single Zod schema (`ProposeFragmentInputSchema`, `ProposeNodeInputSchema`, `ProposeLinkInputSchema`, `ProposeAttributeInputSchema` under `modules/ingestion/dto/`); three transport-specific schemas are derived from it (BR-24, BR-28): (a) Fastify route validation for the REST mirrors uses the business DTO unchanged (the `llmRunId` comes from the URL path, not the body); (b) MCP tool input validation extends the business DTO with `llm_run_id: z.string().min(1)` (Option B — arg-based run binding, see BR-21); (c) the Anthropic tool-use `input_schema` uses the business DTO unchanged (the orchestrator injects `runContext` server-side; the LLM is never asked for `llm_run_id`) — and additionally strips `chunk_ids` from `propose_fragment` (the orchestrator injects the current chunk id at dispatch; see ingestion.spec.md UC-08/UC-12). All three transport-specific schemas are derived once at boot via `zod-to-json-schema`. Failed Zod parse on REST → 422 with one of `VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE`. Failed Zod parse on MCP → MCP 2025-06-18 `content` / `isError: true` carrying the business envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }` (HTTP `200` from the SDK kernel — business errors are NOT HTTP errors; see `backend/src/shared/error-mapping.ts`); a `tool_call` row is written with `validation_outcome = 'rejected'` (BR-13, BR-14, BR-23). The MCP-facing Zod schema of each `propose_*` tool extends the business DTO with `llm_run_id: z.string().min(1)`; the REST and in-process variants do NOT carry that field (BR-21, BR-24, BR-28). Failed Zod parse on tool-use (Anthropic) → same envelope shape, surfaced in-band as the `tool_result` block content (BR-26). | CLAUDE.md default |
| Auth | Neon Auth (Stack Auth) JWT validated by a Fastify `preHandler` middleware `requireNeonAuth` on every route under `/api/v1/ingest/*` (including the new `POST /llm-runs/:id/run` and the four `POST /llm-runs/:id/propose-*` mirrors) and on every MCP tool call. JWKS is fetched from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default) and cached in-process for `NEON_AUTH_JWKS_TTL_S` seconds. PostgreSQL RLS is disabled (A29). Single-owner — no `User` entity, no role check. | CLAUDE.md default (auth-as-gate, single-owner unchanged); provider Neon Auth. |
| Logging | `pino` structured JSON. Required fields per request/tool call: `request_id`, `route` or `tool_name`, `llm_run_id?`, `raw_information_id?`, `outcome`, `latency_ms`. Extraction orchestrator additionally logs per-turn: `turn_index`, `chunk_index`, `stop_reason`, `tool_use_count`, `tokens_in?`, `tokens_out?`. PII fields (`content`, `text`) are never logged at any level (CLAUDE.md "Security"). | CLAUDE.md default |
| Observability | `observability_required: true`. The §16 run metrics are derived at read time from `tool_call.validation_outcome` (BR-12); no separate metrics store. Orchestrator emits a single `run_completed` info log at the end of each run with the eight `validation_outcome` counts and `attempts`, `model`, `prompt_version` — same fields as `LlmRunSummary` (BR-26 closing path). | CLAUDE.md default |
| Transaction policy | Every state-mutating REST endpoint and every MCP `ingest` tool call runs inside a single PostgreSQL transaction opened by the service layer (BR-19, A19). The transport adapter (Fastify route handler or MCP handler) is the only place that calls `pool.connect()` / `client.query('BEGIN')`; the service receives the live `client` as its first argument. **The extraction orchestrator (`extraction.service.ts`) does NOT wrap the whole run in one transaction** — it opens one transaction per tool-use (BR-26, §9.4). | Extension of CLAUDE.md "Backend / pg raw". |
| Concurrency | `SELECT ... FOR UPDATE` for functional succession on `knowledge_link` / `node_attribute` (A11, used by graph-consolidation, BR-27), `pg_advisory_xact_lock(hashtextextended(...))` for entity creation (§4.5, BR-20). Both are issued from the service layer inside the open transaction. | Extension of CLAUDE.md "Conventions". |
| Time source | `now()` provided by PostgreSQL — never `Date.now()` in business code. State dependent on the clock is derived at read time, never written (CLAUDE.md "Conventions", §5.4, A9). | CLAUDE.md default |
| Idempotency primitive | `sha256(content)` as `content_hash`; `sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)` as `llm_run.idempotency_key`. Both UTF-8, hex lowercase, 64 chars (BR-01, BR-08, A18). | Unchanged in this revision. |
| Body limit | Fastify `bodyLimit` set to 11 MiB on the `ingestRawInformation` route to accommodate the 10 MiB `content` cap. The new `runLlmExtraction` endpoint and the four REST `propose-*` mirrors use the platform default (1 MiB) — their bodies are small JSON arguments. All other routes use the platform default. | Unchanged in this revision (new routes do not need a raised cap). |
| Chunker | Pure TypeScript module `modules/ingestion/chunker/v1.ts` exporting `chunkV1(content: string, sourceType: SourceType): RawChunkInput[]`. Constants `CHUNK_TARGET=[1500,2000]`, `CHUNK_HARD_MAX=4000`, `READING_TAIL=200` live in `modules/ingestion/chunker/config.ts` (BR-04, A22). Sentence split uses `Intl.Segmenter('pt', { granularity: 'sentence' })` (BR-07). | Unchanged in this revision. |
| Hashing | `node:crypto.createHash('sha256').update(...).digest('hex')`. UTF-8 encoding is explicit on every `.update()` call. | Unchanged in this revision. |
| Extraction orchestrator | Synchronous, in-process, single-threaded (no workers, no queue). Module: `modules/ingestion/service/extraction.service.ts`. Drives Anthropic via `@anthropic-ai/sdk` in a **manual** tool-use loop (NOT `client.beta.tools.runTool` / `tool-runner`). Per chunk, builds a fresh conversation: `SYSTEM = extraction contract + seeded catalog from CatalogSnapshot (§15)`; `USER = document metadata + chunk text (delimited as data, never instruction — §13) + prev_tail ≤ 200 chars from the previous chunk`. Tool defs from the 4 Zod schemas via `zod-to-json-schema`. Streaming per turn via `client.messages.stream({...}).finalMessage()`. Loop terminates at `stop_reason === "end_turn"`; handles `stop_reason === "pause_turn"` by issuing a continuation request; treats `stop_reason === "refusal"` as a fatal failure for the chunk. Each `tool_use` block produces an in-process call to the matching `propose*Service(client, args, runContext)` — same function used by REST/MCP — and a `tool_result` block is appended to the conversation with the verbatim envelope (`{ ok, result?, error? }`). The orchestrator never bypasses the service layer; every action is auditable via `tool_call`. (BR-24..BR-26) | New (this revision). |
| Anthropic client config | `model = llm_run.model` (default recommended `claude-opus-4-8`). `prompt_version = llm_run.prompt_version`, resolved to a prompt module by the registry `modules/ingestion/prompts/index.ts` (`selectPromptModule`); an unregistered version throws `UnknownPromptVersionError` → run `failed` + `500` (BR-26 step 2). This revision ships `extraction.v1.ts` and `extraction.v2.ts` (v2 = v1 + an Event-dating directive: propose `Event.event_date`/`end_date` when the document states it, distinguishing the date VALUE from `valid_from`; a postponement is `change_hint:"succession"` on `event_date`). `DEFAULT_PROMPT_VERSION = 'v2'` is the recommended version for new runs. `thinking: { type: "adaptive" }`. `max_tokens` set per turn from a per-prompt-version constant (default 8000). `temperature` not set (default). API key from env `ANTHROPIC_API_KEY` (single secret; never logged; only present in BFF process). | New (this revision). |
| Database connection | `pg` `Pool` instantiated from `DATABASE_URL` (Neon direct connection string). The Neon endpoint is the single store; schema is unchanged from the v7-aligned `migrations/0001_init.sql`. TLS is required by Neon (`sslmode=require` carried in the connection string). | Unchanged in this revision. |
| Testing | Vitest unit tests on: chunker determinism (BR-03); idempotency key composition (BR-08); 5-layer validation (BR-13..BR-18); entity-resolution thresholds with all four decision branches (BR-25); graph-consolidation outcomes — consolidated (including the multi-current cross-document re-affirmation case with divergent `valid_from`, BR-27) / superseded_previous / disputed (BR-27); the tool-def derivation `zod → JSON Schema` matches the four Zod schemas (BR-24); the orchestrator drives the loop correctly under a stubbed Anthropic client (BR-26). C1–C15 of v7 §17 are the acceptance suite at the BFF level. | CLAUDE.md default |

---

## 2. Data Model

> Exact database types as defined in `migrations/0001_init.sql`. This revision **introduces no new tables, no new columns and no new indexes**. The ingestion domain still owns six tables: `raw_information`, `raw_chunk`, `llm_run`, `tool_call`, `information_fragment`, `fragment_source`. The new behavior introduced by this revision (entity-resolution at write time, graph consolidation at write time) reads and writes the existing tables of the graph layer (`knowledge_node`, `node_alias`, `node_attribute`, `knowledge_link`, `provenance`, `entity_match_review`) — those rows are written from inside the ingestion transaction; the tables themselves are owned by the future `graph-consolidation` and `entity-resolution` domains (§7 of `ingestion.spec.md`).

### Tables owned by this domain

The six tables (`raw_information`, `raw_chunk`, `llm_run`, `tool_call`, `information_fragment`, `fragment_source`) are unchanged from the previous version of this spec. Full schemas are in `migrations/0001_init.sql`; the prior revision of this document (v1.1.0) listed them column by column — none of those columns is modified or extended by this revision.

### Tables read/written across the domain boundary (cross-domain)

The following tables are read and written from the ingestion service layer in service of UC-09 (entity resolution) and UC-10/UC-11 (graph consolidation). Schemas live in `migrations/0001_init.sql`; this domain is **not** the owner — it only emits rows under the invariants documented below.

| Table | Read | Write | Reason |
|-------|------|-------|--------|
| `knowledge_node` | YES — by id (resolution candidate join), by `(node_type_id, status='active')` filtered by trigram on `node_alias.alias_norm` | YES — INSERT a new node row (`status='active'` for "created_new", `status='needs_review'` for ambiguous), under `pg_advisory_xact_lock` (BR-20, BR-25) | UC-09 |
| `node_alias` | YES — exact `alias_norm` match (1.0 score); trigram `%` candidates via `node_alias_norm_trgm_idx` | YES — INSERT a `(node_id, alias_text)` row whenever the LLM proposes an alias the node does not yet carry. UNIQUE `(node_id, alias_norm)` is the dup guard. | UC-09 |
| `entity_match_review` | NO (read by the future curation domain) | YES — INSERT 1 row **per ambiguous candidate** when entity resolution returns the `needs_review` decision; the new node and these rows are inserted in the same transaction (BR-25). | UC-09 |
| `knowledge_link` | YES — `SELECT ... FOR UPDATE` of the vigent row for `(source_node_id, link_type_id, target_node_id)` under A11 | YES — INSERT a new row on the consolidation flows of §6.5 (new active assertion / succession). For consolidation (re-affirmation) NO INSERT — only the `provenance` row is added. For succession, UPDATE the previous row to set `valid_to`, `superseded_at`, `status='superseded'` and INSERT the new row with `supersedes_link_id` set. (BR-27) | UC-10 |
| `node_attribute` | YES — `SELECT ... FOR UPDATE` of the vigent row for `(node_id, attribute_key_id)` | YES — mirror of `knowledge_link` (consolidation / succession / dispute / correction). (BR-27) | UC-11 |
| `provenance` | YES — anti-hallucination check (BR-18) | YES — INSERT one row per cited fragment, attached to either the new `knowledge_link.id` / `node_attribute.id` (new assertion) or the existing one (consolidation, re-affirmation accumulates provenance — §18). (BR-18, BR-27) | UC-10, UC-11 |
| `node_type`, `link_type`, `link_type_rule`, `attribute_key` | YES — catalog cache loaded at boot from the seed §15 (BR-15) | NO — catalog is migration-only (§12). | UC-09, UC-10, UC-11 |

### Indexes (unchanged in this revision)

All indexes consumed by the new resolver/consolidator already exist in `migrations/0001_init.sql`:

| Table | Fields | Type | Used by |
|-------|--------|------|---------|
| node_alias | alias_norm | btree `node_alias_norm_idx` | Step 1 of resolver: exact `alias_norm = norm($1)` match. |
| node_alias | alias_norm | GIN `node_alias_norm_trgm_idx` (`gin_trgm_ops`) | Step 2 of resolver: `alias_norm % norm($1)` candidate retrieval. |
| node_alias | (node_id, alias_norm) | UNIQUE btree | Idempotent alias add — second INSERT with the same `(node_id, alias_norm)` is a silent no-op via `ON CONFLICT DO NOTHING`. |
| knowledge_node | (status='needs_review') | partial btree `knowledge_node_needs_review_idx` | Curation queue read (downstream); written when resolver returns "ambiguous". |
| knowledge_link | (source_node_id, link_type_id, target_node_id) WHERE vigent | partial UNIQUE `knowledge_link_current_dup_guard` | **The dup-guard is scoped by `(source, link_type, target)` — `valid_from` is NOT part of the key.** Without consolidation, a second identical assertion would hit this constraint. BR-27 turns that case into `consolidated` instead, including the multi-current branch where the second assertion's `valid_from` differs from the vigent row (typically because the new assertion's basis is the `received` fallback of a later document — see BR-27 Re-affirmation sub-cases). |
| node_attribute | (node_id, attribute_key_id, value) WHERE vigent | partial UNIQUE `node_attribute_current_dup_guard` | Same as above for attributes. |

### Relationships (unchanged in this revision)

The FK + on-delete table from v1.1.0 stands. **No CASCADE anywhere.** Cross-domain inserts (`knowledge_node`, `node_alias`, `entity_match_review`, `knowledge_link`, `node_attribute`, `provenance`) happen in the same transaction as the `tool_call` row that audits them; on rollback every cross-domain row is also rolled back, except the `tool_call` audit which is then re-issued in a separate short transaction (BR-23, unchanged).

---

## 3. Business Rules (BR)

> Every BR references at least one UC of `ingestion.spec.md`. This section translates each business rule into the validation layer that enforces it and the error code returned on violation. Rule wording is condensed; canonical wording lives in `ingestion.spec.md` §4.

### BR-01 -- Content hash is the idempotency anchor
**Related UC:** UC-01
**Where to validate:** service (`ingestion.service.ingestRawInformation`) computes `sha256(content)` after the Zod parse and before the transaction opens. Format constraint (`^[0-9a-f]{64}$`) is enforced by the DB `CHECK` on `raw_information.content_hash`.
**Description:** `content_hash = sha256(content)`, hex, lowercase, 64 chars. The DB `UNIQUE (content_hash)` is what UC-01 alt 4a turns into `outcome = "noop_existing"`.
**Error returned:** No direct error — collision is a business outcome (`200 noop_existing`), not a 409.

### BR-02 -- Source content is immutable
**Related UC:** UC-01, UC-02
**Where to validate:** repository — the ingestion module exposes no `UPDATE raw_information ...` query at all. The only writer that exists in the whole system targeting `raw_information.content` belongs to the future compliance module (`compliance_delete`).
**Description:** After insert, `raw_information.{content, metadata, received_at}` is never modified by any code path of this domain.
**Error returned:** Not applicable — enforced by absence of code (no error path needed).

### BR-03 -- Chunking is deterministic and versioned
**Related UC:** UC-01
**Where to validate:** Vitest unit test on `chunkV1` — running `chunkV1(content, sourceType)` twice produces strictly equal outputs. `chunking_version` is hardcoded to `'v1'`.
**Description:** Same `(content, chunking_version)` → same chunks.
**Error returned:** Not applicable at request time.

### BR-04 -- Chunk algorithm constants are fixed
**Related UC:** UC-01
**Where to validate:** `modules/ingestion/chunker/config.ts` — `CHUNK_TARGET=[1500,2000]`, `CHUNK_HARD_MAX=4000`, `READING_TAIL=200` (A22).
**Description:** The three constants are not configurable per request.
**Error returned:** Not applicable.

### BR-05 -- Chunk offsets are 0-based, semi-open, in Unicode code points
**Related UC:** UC-01, UC-03
**Where to validate:** chunker implementation — iterate via `[...str]`. DB `CHECK (offset_end > offset_start)` is the safety net.
**Description:** `offset_start >= 0`, `offset_end > offset_start`, both in code points of the original `content`.
**Error returned:** DB `CHECK` violation → `500 SYSTEM_INTERNAL_ERROR`.

### BR-06 -- Hard boundaries close the current chunk
**Related UC:** UC-01
**Where to validate:** chunker — per-`source_type` dispatch table.
**Description:** Hard boundaries are mandatory closures; the chunker never overlaps chunks; `READING_TAIL` is not persisted.
**Error returned:** Not applicable.

### BR-07 -- Oversize blocks fall back to sentence split
**Related UC:** UC-01
**Where to validate:** chunker — `Intl.Segmenter('pt', { granularity: 'sentence' })`. Code blocks and tables are exempt.
**Description:** Sentence-level split is a last-resort fallback; structural blocks are preserved intact.
**Error returned:** Not applicable.

### BR-08 -- Run idempotency key composition
**Related UC:** UC-01
**Where to validate:** service — `idempotencyKey = sha256(utf8(content_hash) ∥ utf8(prompt_version) ∥ utf8(model) ∥ utf8(chunking_version))`, no separator. Hex lowercase 64 chars.
**Description:** Bumping any of the four operands yields a different key.
**Error returned:** Not applicable — collisions translate into `200 noop_existing`.

### BR-09 -- Re-ingestion is a no-op on the live path
**Related UC:** UC-01 alt 4a
**Where to validate:** service. Catch SQLSTATE `23505` on `raw_information_content_hash_key`, re-read, recompute `idempotency_key`, look up the existing `llm_run`. If the run is found, return `200 noop_existing` regardless of its `status` (failed runs still surface via this 200 path; the caller is expected to invoke `retryLlmRun` next).
**Description:** No new rows are written in the no-op path.
**Error returned:** None — 200 success.

### BR-10 -- Retry reopens the same LLMRun row
**Related UC:** UC-06
**Where to validate:** service (`ingestion.service.retryLlmRun`). One transaction: `UPDATE llm_run SET status='running', attempts = attempts+1, finished_at = NULL WHERE id = $1 AND status = 'failed' RETURNING *`. In the same transaction, flip orphan `proposed` fragments to `rejected` (no row in `provenance`).
**Description:** A new `llm_run` row with the same `idempotency_key` is never created.
**Error returned:** `409 BUSINESS_RUN_NOT_RETRYABLE` if not failed.

### BR-11 -- Only failed runs are retryable
**Related UC:** UC-06
**Where to validate:** service — conditional `UPDATE ... WHERE status = 'failed'` plus a pre-read to distinguish 404 from 409.
**Description:** Re-running a `running` or `completed` run is rejected.
**Error returned:** HTTP 409 -- error.code: `BUSINESS_RUN_NOT_RETRYABLE`.

### BR-12 -- Run summary is derived, never stored
**Related UC:** UC-04
**Where to validate:** repository — aggregate `tool_call.validation_outcome` for the run.
**Description:** No `summary_*` columns on `llm_run`.
**Error returned:** None — read-only.

### BR-13 -- Layered validation order is fixed
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service. Each `propose_*` service function invokes the 5 layers in order: `structural → graph rules → temporal → confidence → anti-hallucination`. The handler catches `ValidationFailure` and returns the matching MCP error envelope; the `tool_call` row is persisted with `validation_outcome = 'rejected'`.
**Description:** Rejection is a business result, not an exception; layers must not short-circuit out of order.
**Error returned:** See BR-14..BR-17.

### BR-14 -- Structural failures map to STRUCTURAL_INVALID / UNKNOWN_TYPE / NOT_FOUND
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service / structural layer.
**Description:**
- Missing/typed fields, cross-table compatibility mismatch → `STRUCTURAL_INVALID`.
- Catalog miss → `UNKNOWN_TYPE`.
- Referenced row not found → `NOT_FOUND`.
**Error returned:** MCP envelope `{ ok: false, error: { code } }`. `tool_call.validation_outcome = 'rejected'`.

### BR-15 -- Graph-rule failures map to RULE_VIOLATION
**Related UC:** UC-10
**Where to validate:** service / graph-rule layer. Query the active `link_type_rule`.
**Description:** The 22 seeded rules of §15.2 (`migrations/0001_init.sql`) are the v1 authoritative set.
**Error returned:** MCP envelope `{ ok: false, error.code: "RULE_VIOLATION" }`.

### BR-16 -- Temporal failures map to TEMPORAL_INCOHERENT / DATE_UNJUSTIFIED
**Related UC:** UC-10, UC-11
**Where to validate:** service / temporal layer.
**Description:** Per `ingestion.spec.md` §4 BR-16. Unchanged.
**Error returned:** MCP envelope `{ ok: false, error.code: "TEMPORAL_INCOHERENT" | "DATE_UNJUSTIFIED" }`.

### BR-17 -- Confidence routing
**Related UC:** UC-10, UC-11
**Where to validate:** service / confidence layer (A13). Constants in `modules/ingestion/validation/confidence.ts`: `CONFIDENCE_FLOOR = 0.40`, `CONFIDENCE_UNCERTAIN_UPPER = 0.75`.
**Description:** `≥ 0.75 → 'active'`; `[0.40, 0.75) → 'uncertain'`; `< 0.40 → not created`.
**Error returned:** Below floor: MCP envelope `{ ok: true, result: { outcome: "rejected", reason: "BELOW_CONFIDENCE_FLOOR" } }` (business outcome, not error). The `tool_call.validation_outcome` is `'rejected'`.

### BR-18 -- Every accepted assertion has provenance
**Related UC:** UC-10, UC-11
**Where to validate:** service / anti-hallucination layer (§13.5). The service inserts one `provenance` row per cited fragment in the same transaction that creates / consolidates the link or attribute, and verifies (in the same transaction) that every fragment is anchored to a chunk of the current run's `input_raw_information_id`.
**Description:** No accepted (or consolidated) link/attribute exists without provenance to a real fragment of the current run's source.
**Error returned:** MCP envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }`.

### BR-19 -- One transaction per tool call
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service. Each `propose_*` service function opens exactly one transaction at entry, commits on success, rolls back on any thrown error. The `tool_call` row is the only row written even on rollback — opened in a separate short transaction after rollback (BR-23). **The extraction orchestrator never wraps multiple tool calls in one transaction (BR-26).**
**Description:** A run of N tool calls that fails on call K keeps the K-1 already-accepted units.
**Error returned:** Not applicable.

### BR-20 -- Entity creation is serialised by advisory lock
**Related UC:** UC-09
**Where to validate:** service (`entity-resolution.service.resolveOrCreateNode`). Before the resolve-or-create branch, issue `SELECT pg_advisory_xact_lock(hashtextextended(node_type_id::text || '\x1F' || norm(name), 0))` (§4.5). The lock is automatically released at commit/rollback.
**Description:** Two concurrent `propose_node` calls for the same `(node_type, normalized name)` cannot create duplicate nodes.
**Error returned:** Not applicable.

### BR-21 -- `ingest` toolset only operates inside an active LLMRun (transport-agnostic, arg-based run binding)
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service — every `propose_*` service function takes a `runContext = { llmRunId, rawInformationId }` argument and verifies at entry (`assertRunIsRunning`) that `llm_run.status = 'running'` (SQLSTATE-safe read; if not running, throws `ValidationFailure('STRUCTURAL_INVALID')`). The run-id binding is per-call — there is no ambient session header, no per-session factory, no transport-level toolset gating:
- **MCP transport (stateless single-shape, via `mountMcpEndpoint`):** the four `ingest` tools are **always listed** by the MCP `Server`'s `tools/list` handler, regardless of any per-call state. The MCP-facing Zod schema of each `propose_*` tool extends the business DTO with `llm_run_id: z.string().min(1)` (Option B — argument binding). The thin MCP handler (`modules/ingestion/mcp/propose-*.handler.ts`) reads `llm_run_id` from the tool **args**, builds the `runContext`, and calls the service. A call whose `llm_run_id` is missing, malformed, or does not point to a `running` `llm_run` returns the MCP 2025-06-18 `content` / `isError: true` shape carrying the business envelope `{ ok: false, error: { code: "STRUCTURAL_INVALID", message } }` (HTTP `200` from the SDK kernel — business errors are NOT HTTP errors). The handler is **always reached** — there is no pre-handler rejection path.
- **REST mirror:** the route is `POST /api/v1/ingest/llm-runs/:llmRunId/propose-{fragment,node,link,attribute}` — the run id is in the URL path, the REST request schema does NOT carry `llm_run_id` in the body, the service verifies the same invariant via `assertRunIsRunning`.
- **Extraction orchestrator (in-process):** the orchestrator carries the `runContext` of the run it is driving and calls the services directly (no transport in the middle, no Anthropic-facing `llm_run_id` argument — the orchestrator injects it server-side; the LLM is never asked for it).
**Description:** The single source of truth for the active-run invariant is the service layer (`assertRunIsRunning`). The MCP transport binds the run-id by tool argument (not by session); the REST mirror by URL path; the in-process orchestrator by injected `runContext`. The per-session model (`backend/src/modules/ingestion/mcp/session-factory.ts`) is **retired** — the MCP endpoint is stateless single-shape (same pattern as `query` and `curation`, all three mounted via the shared SDK kernel `mountMcpEndpoint`, `backend/src/mcp/sdk-http-transport.ts`). The "ingest is MCP-only" constraint (§14 / A28) remains **lifted** by v1.2.0 (documented deviation in CLAUDE.md).
**Error returned:** MCP envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }` surfaced as MCP 2025-06-18 `content` / `isError: true` (HTTP `200` from the SDK kernel). REST envelope same body shape, also `200 OK`. Auth/transport-level failures keep their normal HTTP error codes (`401` / `404` / `422`). **A `tool_call` row IS written on this path** — the previous "pre-handler exception" of BR-23 no longer applies (see BR-23).

### BR-22 -- The fragment text is bounded to 1000 characters
**Related UC:** UC-08
**Where to validate:** Zod schema on `propose_fragment.text` (`.max(1000)`) and DB `CHECK (char_length(text) <= 1000)`.
**Description:** Longer assertions are split into multiple atomic fragments by the LLM.
**Error returned:** MCP envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }`.

### BR-23 -- ToolCall always records the call (no transport exception)
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service — the `propose_*` service function wraps the business transaction in a `try/finally`. The `finally` block opens a separate short transaction to insert the `tool_call` row with the verbatim arguments, the verbatim result envelope, and the `validation_outcome` produced by the handler (or `'error'` on uncaught exception). With the arg-based run-id binding of BR-21 (revised), the MCP handler is **always reached** — even a call with a missing/invalid `llm_run_id` argument goes through the handler, which calls `assertRunIsRunning`, which throws `ValidationFailure('STRUCTURAL_INVALID')` and the `finally` block persists a `tool_call` row with `validation_outcome = 'rejected'`. The previous "MCP pre-handler rejects 'no ambient `llm_run_id`' → no `tool_call` row" exception of v1.2.x is **withdrawn** — there is no longer any reachable `propose_*` invocation that skips the audit row.
**Description:** Every reachable `propose_*` invocation produces exactly one `tool_call` row, on every transport.
**Error returned:** Not applicable.

### BR-24 -- Tool schemas have a single source: the Zod DTOs (per-transport derivation)
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** module-init code in `modules/ingestion/dto/`. The four **business** Zod schemas (`ProposeFragmentInputSchema`, `ProposeNodeInputSchema`, `ProposeLinkInputSchema`, `ProposeAttributeInputSchema`) are the single source of truth. From them, three transport-specific derivations are built once at boot via `zod-to-json-schema`:
  1. **REST mirror** — Fastify route validation uses the business DTO unchanged (`llmRunId` is read from the URL path; the body schema does NOT carry it).
  2. **MCP tool registration** — registered with the shared SDK kernel `mountMcpEndpoint` (low-level `@modelcontextprotocol/sdk` `Server`). The MCP-facing schema is the business DTO **extended** with `llm_run_id: z.string().min(1)` (Option B — arg-based run binding, see BR-21 / BR-28).
  3. **Anthropic tool-use call** (`client.messages.create({ tools: [...] })`) — uses the business DTO unchanged (no `llm_run_id`; the orchestrator injects `runContext` server-side). Additionally strips `chunk_ids` from `propose_fragment` (the orchestrator injects the current chunk id at dispatch — see ingestion.spec.md UC-08/UC-12).

A Vitest snapshot test asserts that each of the three derived JSON Schemas per tool (twelve total) has not drifted from a committed baseline; any change requires updating both the Zod source and the snapshot in the same PR.
**Description:** No hand-written JSON Schema duplicates the Zod source; transport contracts cannot diverge from the validated business DTO; the per-transport variants are mechanical derivations (REST = base; MCP = base + `llm_run_id`; Anthropic = base − `chunk_ids` for `propose_fragment`, otherwise = base).
**Error returned:** Not applicable (schema-derivation invariant; covered by unit test).

### BR-25 -- Entity resolution thresholds and decision branches
**Related UC:** UC-09
**Where to validate:** service (`entity-resolution.service.resolveOrCreateNode`), called by `propose-node.service` between the advisory lock acquisition (BR-20) and the INSERT (the previous code path's deferred extension point). Constants in `modules/ingestion/service/entity-resolution.service.ts`:
- `MATCH_STRONG = 0.85`
- `MATCH_FLOOR  = 0.55`

The procedure, in order:
1. **Exact match:** `SELECT node_id FROM node_alias WHERE alias_norm = norm($name) AND node_id IN (SELECT id FROM knowledge_node WHERE node_type_id = $ntid AND status = 'active')`. If any row, score is 1.0 → **reuse** that node; add any new aliases (`ON CONFLICT DO NOTHING` on `(node_id, alias_norm)`); resolution = `matched_existing`.
2. **Trigram candidates:** else
   ```sql
   SELECT na.node_id, MAX(similarity(na.alias_norm, norm($1))) AS sim
   FROM node_alias na
   JOIN knowledge_node kn ON kn.id = na.node_id
   WHERE kn.node_type_id = $2
     AND kn.status = 'active'
     AND na.alias_norm % norm($1)
   GROUP BY na.node_id
   ORDER BY sim DESC
   LIMIT 10;
   ```
   (uses `node_alias_norm_trgm_idx` GIN with `gin_trgm_ops`, filtered by FK index on `node_alias.node_id`).
3. **Decision (A12):**
   - **Strong unique:** exactly one candidate with `sim ≥ MATCH_STRONG` AND no other candidate has `sim ≥ MATCH_FLOOR` → **reuse** that node (add new aliases); resolution = `matched_existing`.
   - **Ambiguous:** any candidate has `sim ∈ [MATCH_FLOOR, MATCH_STRONG)` OR two-or-more candidates have `sim ≥ MATCH_STRONG` → create new node with `status = 'needs_review'`; for each ambiguous candidate (every row with `sim ≥ MATCH_FLOOR`), INSERT one row into `entity_match_review (proposed_node_id, candidate_node_id, similarity)`. The new node and the review rows are inserted in the same transaction (atomic). Resolution = `needs_review`.
   - **Novel:** every candidate has `sim < MATCH_FLOOR` (including the empty case) → create new node with `status = 'active'`. Resolution = `created_new`.
4. **Alias attachment:** in all three branches above, every alias supplied by the LLM that is not yet on the resolved/created node is INSERTed into `node_alias` (`ON CONFLICT (node_id, alias_norm) DO NOTHING`). The canonical name is inserted as the first alias for new nodes.

The propose-node service then records a `tool_call` row with `validation_outcome = 'accepted'` for `matched_existing` / `created_new`, or `'needs_review'` for the ambiguous case. The Zod result schema (`ProposeNodeOutputSchema`) already carries `resolution: 'matched_existing' | 'created_new' | 'needs_review'`.

**Description:** Resolution is deterministic given the catalog and the live graph; thresholds are not configurable per call. The `entity_match_review` rows feed the `entity_match` curation queue (consumed by the existing `resolveEntityMatchService` / `performMerge` in `curation/service/merge.service.ts` — no curation change required).
**Error returned:** Not a user-facing error path. Catalog miss on `node_type` is handled earlier (BR-14 → `UNKNOWN_TYPE`).

### BR-26 -- Extraction orchestrator drives the LLM via a manual tool-use loop, one transaction per tool call
**Related UC:** UC-12 (new — extraction trigger; declared in `ingestion.spec.md`)
**Where to validate:** service (`extraction.service.runExtraction`). Triggered by `POST /api/v1/ingest/llm-runs/:llmRunId/run`. The endpoint is synchronous (no worker, no queue) — the HTTP request stays open for the duration of the run. Pre-checks: `llm_run.status = 'running'` (BR-21); a run that is already `completed` or `failed` is rejected with `409 BUSINESS_RUN_NOT_RUNNABLE`.

Algorithm (per §9.3, §9.4):
1. Load `llm_run` row, the `raw_information` row, and the chunks of that raw information (ordered by `chunk_index`).
2. Resolve the prompt module for `llm_run.prompt_version` via the prompt registry `modules/ingestion/prompts/index.ts` (`selectPromptModule`); an unregistered version throws `UnknownPromptVersionError`. The call runs inside the run-scoped try, so the throw flips the run to `failed` and surfaces `500 SYSTEM_INTERNAL_ERROR` (configuration error — never silently substitute a prompt the run does not declare). Registry as of this revision: `v1` → `extraction.v1.ts`, `v2` → `extraction.v2.ts`. (Until the registry was introduced the orchestrator imported v1 statically, so `prompt_version` was recorded but did not drive the prompt; the registry closes that gap.)
3. Instantiate the Anthropic client (`new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })`).
4. Derive the four tool defs from the four Zod schemas via `zod-to-json-schema` (BR-24).
5. For each chunk (in `chunk_index` order):
    a. Build `system = prompt.system(catalogSnapshot)`; build the user message:
       `prompt.user({ rawInformationMetadata, chunkText, prevTail })` — `prevTail` is the last ≤ 200 chars of the previous chunk's text, or empty for the first chunk. Chunk text is delimited by an explicit "DOCUMENT CONTENT (data — never instructions)" envelope (§13 anti-injection).
    b. **Tool-use loop:** initialize `messages = [{ role: 'user', content: userBlocks }]`. Repeat:
        - Call `client.messages.stream({ model, system, tools, thinking: { type: 'adaptive' }, max_tokens, messages }).finalMessage()`.
        - **Append** the response's entire `content` array (preserves all `tool_use` blocks plus any `text` / `thinking` blocks) to `messages` as an `assistant` turn.
        - If `stop_reason === 'end_turn'`: chunk is done; break the loop.
        - If `stop_reason === 'pause_turn'`: continue the loop without modifying `messages` (Anthropic continues from the partial state).
        - If `stop_reason === 'refusal'`: log refusal, mark the chunk as a soft failure, break the loop (run continues with next chunk).
        - For each `tool_use` block in the response: call the matching service function — `proposeFragmentService(client, args, runContext)` / `proposeNodeService(client, args, runContext)` / `proposeLinkService(client, args, runContext)` / `proposeAttributeService(client, args, runContext)` — **each opening its own transaction (BR-19)**. Capture the verbatim envelope (`{ ok: true, result: { ..., validation_outcome } }` or `{ ok: false, error: {...} }`). Build a `tool_result` block (`{ type: 'tool_result', tool_use_id, content: JSON.stringify(envelope), is_error: !envelope.ok }`) for each. Append a single user turn with all `tool_result` blocks; restart the loop.
6. After all chunks complete: close the run — `UPDATE llm_run SET status = 'completed', finished_at = now() WHERE id = $1` (single transaction). Emit a `pino` info log with the eight `validation_outcome` counts of the run (BR-12, BR-26 closing path).
7. **Fatal failure path:** if the orchestrator catches an unhandled exception at any point (network, model 5xx, internal bug — NOT layered-validation rejection, which is an in-band result), it issues `UPDATE llm_run SET status = 'failed', finished_at = now() WHERE id = $1` in a fresh transaction, then re-throws. The HTTP response is `500 SYSTEM_INTERNAL_ERROR`. The owner re-runs by invoking `retryLlmRun` (BR-10) followed by `runLlmExtraction` again.

The orchestrator **never** wraps multiple `propose_*` calls in one transaction (§9.4): a single fragment / node / link / attribute persists or rolls back independently. The `tool_call` rows are the audit trail; the run summary (BR-12) is the human-facing aggregation.

**Description:** Synchronous orchestration is acceptable at the current scale (hundreds of documents, §16); a queue / worker offload is a future evolution. The orchestrator is the single in-process LLM caller of the BFF; no other code path calls Anthropic.
**Error returned:** `409 BUSINESS_RUN_NOT_RUNNABLE` if the run is not `running` at entry. `500 SYSTEM_INTERNAL_ERROR` on orchestrator fatal failure (after the run has been moved to `failed`). `200 OK` with a `RunExtractionResponse` body on success.

### BR-27 -- Graph consolidation on `propose_link` / `propose_attribute`
**Related UC:** UC-10, UC-11
**Where to validate:** service (`graph-consolidation.service`) invoked by `propose-link.service` and `propose-attribute.service` after the 5-layer validation (BR-13..BR-18) has passed and the new assertion has been pre-built (target `value`, `valid_from`, `valid_from_basis`, `change_hint`, etc.).

The consolidator implements §6.5 in this exact order, inside the same transaction as the `propose_*` call (BR-19):

1. **Scope identification:**
   - For `propose_link`: scope = `(source_node_id, link_type_id, target_node_id)`. Functional flag = `link_type.allows_multiple_current` (false → functional).
   - For `propose_attribute`: scope = `(node_id, attribute_key_id)`. Functional flag = `attribute_key.allows_multiple_current`.
2. **Vigent lookup (A11):**
   ```sql
   SELECT * FROM knowledge_link
   WHERE source_node_id = $1 AND link_type_id = $2 AND target_node_id = $3
     AND valid_to IS NULL AND superseded_at IS NULL
   FOR UPDATE;
   ```
   (mirror for `node_attribute`, scoped by `(node_id, attribute_key_id)`). Lock is held until commit/rollback. This is what closes the race that the partial dup-guard index would otherwise turn into an SQLSTATE `23505`.
3. **Decision tree (§6.5):**
   - **Re-affirmation (consolidation):** vigent row exists; same value (target node for link, parsed value for attribute); `change_hint = 'none'`. → Do **not** insert a new row. Instead, INSERT one `provenance` row per cited fragment, attached to the existing assertion's id (§18). `tool_call.validation_outcome = 'consolidated'`. Response: `{ ok: true, result: { outcome: 'consolidated', link_id | attribute_id: <existing id> } }`. The `valid_from` of the new proposal is **not** part of the re-affirmation identity in any of the three sub-cases below — `valid_from` is metadata of the witnessing document, not of the asserted fact (§6.5 evidence-basis precedence: `stated > document > received`). The vigent row's `valid_from` is preserved as-is on consolidation; this revision does NOT yet promote an existing `received`-basis `valid_from` to a `stated`-basis one when a later document asserts the same fact with a stronger basis — that promotion is a separate evolution under §6.5 and is **out of scope** for this fix (see §8). The three re-affirmation sub-cases are:
     - **Sub-case (i) — multi-current link / multi-valued attribute (`allows_multiple_current = true`):** the dup-guard partial UNIQUE is scoped by `(source, link_type, target)` (or `(node, attribute_key, value)`) **without** `valid_from`; therefore one and only one vigent row per scope is permitted by the schema, and re-affirmation MUST consolidate regardless of whether the new proposal's `valid_from` matches the vigent row's `valid_from`. Concretely: when `link_type.allows_multiple_current = true` (or `attribute_key.allows_multiple_current = true`), the consolidator takes this branch whenever the vigent row's target/value matches the new proposal's target/value and `change_hint = 'none'` — even when `vigent.valid_from <> new.valid_from`. This is the canonical case for the cross-document re-affirmation of an LLM-extracted fact whose `valid_from` comes from the per-document `received` fallback (FR-001 in `temporal.ts`): the second document is recorded on a different day, so its `received` basis yields a different date, but the fact is the same and §18 requires consolidation.
     - **Sub-case (ii) — functional link / single-valued attribute (`allows_multiple_current = false`) with identical `valid_from`:** the consolidator takes this branch when `vigent.target_node_id = new.target_node_id` (or `vigent.value = new.value` for attributes) AND `vigent.valid_from = new.valid_from` AND `change_hint = 'none'`. This preserves the previous v1.2.1 behaviour for functional scopes; the `valid_from` equality is required here because for functional types a divergent `valid_from` together with a different value carries semantic meaning (succession — sub-case (iii) and the succession branch below).
     - **Sub-case (iii) — functional link / single-valued attribute with same target/value but divergent `valid_from`, `change_hint = 'none'`, no textual succession or correction signal:** treat as re-affirmation (same fact, the divergent date is from a different basis of evidence). Consolidate as in sub-case (ii); the vigent row's `valid_from` is preserved. Rationale: a same-value functional assertion with a different `valid_from` and no succession signal is, by §6.5, the same fact re-asserted — `valid_from` of the new proposal is then informational only and does NOT trigger succession (succession requires a different target/value AND a textual signal — see the succession branch below).
   - **Succession (functional types only):** vigent row exists; functional scope; new value differs from old; the supporting fragment text contains a textual succession signal AND/OR `change_hint = 'succession'`. → UPDATE the vigent row to set `valid_to = $newValidFrom` (or `now()::date` if the new row has no `valid_from`), `superseded_at = now()`, `status = 'superseded'`. **Intra-day collapse guard:** the validity axis is `date` (day-granular, §5.1), so `valid_to = $newValidFrom` is applied ONLY when it is strictly after the vigent row's `valid_from`. When `vigent.valid_from >= $newValidFrom` (a same-day — or earlier-dated — change; typically both proposals resolving `valid_from` via the `received` fallback on the same day), setting `valid_to = $newValidFrom` would yield a degenerate `[D, D)` interval and violate the strict `valid_from < valid_to` CHECK (`knowledge_link_interval_ck` / `node_attribute_interval_ck`; also enforced in `temporal.ts`). In that case the vigent row is closed on the **transaction axis only** (`superseded_at = now()`, `status = 'superseded'`, `valid_to` left untouched) — identical to the Correction sub-case — so the new version becomes current via the `supersedes_*` lineage + the `timestamptz` transaction axis. The sub-day validity boundary is intentionally dropped: day-granular validity cannot encode two effective values on the same calendar day (the literal §6.5-A wording `valid_to = data_da_mudança` is unsatisfiable here). Implemented by `closeVigentForSuccession` in `graph-consolidation.service.ts` (a SQL `CASE`, evaluated against the row's own `valid_from` and the DB clock). INSERT the new row with `supersedes_link_id` / `supersedes_attribute_id` set to the old row's id. INSERT `provenance` rows attached to the new id. `tool_call.validation_outcome = 'superseded_previous'`. Response: `{ ok: true, result: { outcome: 'superseded_previous', link_id | attribute_id: <new>, superseded_id: <old> } }`.
   - **Correction (errata):** vigent row exists; `change_hint = 'correction'` with the textual errata signal verified by BR-16; same period. → Apply the §6.5 correction flow: close the vigent row (`status = 'corrected'`, `superseded_at = now()`, do NOT change `valid_from`/`valid_to` of the old row), INSERT a new row with the corrected value and `supersedes_*` set; `provenance` attached to the new id. `tool_call.validation_outcome = 'accepted'` (per spec.md BR-25: correction is an accepted write; the audit trail lives in the supersedes-* chain and in `tool_call.result.reason`).
   - **Conflict (dispute):** vigent row exists; same period (overlapping `[valid_from, valid_to)`); different value; no succession signal; no correction errata. → Two outcomes per §6.5 flow C: UPDATE the vigent row to `status = 'disputed'`; INSERT the new row also with `status = 'disputed'`; both rows now coexist as `disputed`; `provenance` attached to the new id. `tool_call.validation_outcome = 'disputed'`. Response: `{ ok: true, result: { outcome: 'disputed', link_id | attribute_id: <new>, conflicting_id: <old> } }`.
   - **New assertion (no vigent row, or non-functional scope with no overlap):** INSERT a new row with `status` derived from BR-17 (`active` / `uncertain` / `disputed`). INSERT `provenance` rows attached to the new id. `tool_call.validation_outcome = 'accepted'`. Response: `{ ok: true, result: { outcome: 'accepted', link_id | attribute_id: <new> } }`.

The consolidator never executes a plain INSERT against a vigent scope that already has a row — the `FOR UPDATE` lookup is mandatory. The pre-existing partial dup-guard indexes (`knowledge_link_current_dup_guard`, `node_attribute_current_dup_guard`) remain in place as a defence-in-depth safety net.

**Dup-guard catch path (`23505` SQLSTATE on the partial dup-guard).** When the consolidator's `INSERT` raises SQLSTATE `23505` on either of those two constraint names, the cause is one of two things, which the service MUST distinguish: (1) a **deterministic conflict** — the consolidator's decision tree above missed the vigent row (e.g. the vigent lookup ran before another transaction commit raced the lock; or a sub-case branch was not taken because of a stale field); the correct response is to **re-run the lookup-and-decide step** (`SELECT ... FOR UPDATE` plus the decision tree above), which will now observe the freshly-committed vigent row and route to consolidation (sub-case (i)/(ii)/(iii)) or to succession/correction/dispute; (2) a **real concurrent contention** — another transaction is sitting in `FOR UPDATE` on the same scope and only releases its lock after our retry. The service implements **one** retry of the lookup-and-decide step after a `23505` catch. If the second attempt also raises `23505`, this is a real-time race that cannot be resolved deterministically by retrying — the call is rejected with `STRUCTURAL_INVALID` and the error message MUST identify it as such (e.g. `"graph consolidation: real concurrent contention on <scope>; one of the racing transactions must be retried by the caller"`). The previous catch-all message (`"hit dup-guard twice; concurrent contention not resolvable"`) is forbidden — it conflates a deterministic miss of sub-case (i) (which the BR-27 revision above now resolves on the retry) with a real concurrent race (which the retry cannot resolve). On the retried path, the consolidator MUST take the re-affirmation branch above whenever the vigent row matches target/value and `change_hint = 'none'` — including the multi-current sub-case (i) with divergent `valid_from`. If the consolidator's decision tree is correctly implemented per the sub-cases above, the second dup-guard fire must be vanishingly rare (real concurrent writes to the same `(source, link_type, target)` within the few-ms window between the `FOR UPDATE` release and our INSERT — possible but improbable at v1's single-owner scale).

**Description:** Re-running an extraction over the same document re-affirms the existing graph rather than failing on dup-guard. Re-mentioning an existing entity in a second chunk reuses the existing node (via BR-25) and re-asserts its links by consolidation (via BR-27).
**Error returned:** Not a user-facing error path — every branch returns `{ ok: true, result }`. Programming-error fall-through (e.g. consolidator skipped) → SQLSTATE `23505` on the partial dup-guard → `500 SYSTEM_INTERNAL_ERROR`.

### BR-28 -- Dual-transport exposure of the `ingest` toolset (arg-based run binding on MCP only)
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** transport layer + service layer.

- The four `propose_*` functions live in `modules/ingestion/service/propose-{fragment,node,link,attribute}.service.ts`. Their signature is `(client: PoolClient, args: ParsedZodArgs, runContext: { llmRunId, rawInformationId }) → Promise<McpEnvelope>`. They are the canonical implementation. **`llm_run_id` is NOT part of `ParsedZodArgs`** — it is carried in `runContext`, which the transport adapter builds before calling the service.
- **MCP transport (stateless single-shape, via `mountMcpEndpoint`):** the four MCP handlers under `modules/ingestion/mcp/propose-*.handler.ts` are thin adapters that (a) read `llm_run_id` from the tool **args** (Zod-validated by the MCP-facing schema, which extends the business DTO with `llm_run_id: z.string().min(1)` — Option B), (b) build the `runContext`, (c) acquire a `pg` client, (d) call the matching service, (e) return the envelope. The MCP endpoint is mounted by the shared SDK kernel `mountMcpEndpoint` (`backend/src/mcp/sdk-http-transport.ts`) — low-level `@modelcontextprotocol/sdk` `Server`, Streamable HTTP **stateless**, MCP 2025-06-18 `content` / `isError`, business error codes preserved by `backend/src/shared/error-mapping.ts`. The per-session model (`backend/src/modules/ingestion/mcp/session-factory.ts`) is **retired** — there is no `X-LLM-Run-Id` header, no session state, no toolset gating; tools are always listed (BR-21).
- **REST mirror:** four routes under `modules/ingestion/routes/ingestion.routes.ts`:
  - `POST /api/v1/ingest/llm-runs/:llmRunId/propose-fragment`
  - `POST /api/v1/ingest/llm-runs/:llmRunId/propose-node`
  - `POST /api/v1/ingest/llm-runs/:llmRunId/propose-link`
  - `POST /api/v1/ingest/llm-runs/:llmRunId/propose-attribute`
  Each route: Zod-validates the body using the **business DTO** (without `llm_run_id` — the run id lives in the URL path), reads `llmRunId` from the path, builds the `runContext`, calls the matching service, returns the envelope verbatim. **HTTP semantics:** the response status is `200 OK` for any reachable handler — the envelope's `ok` field is the success indicator (consistent with MCP). Pre-handler-level errors (auth fail, unknown `llmRunId`, body not JSON) keep their normal HTTP error codes (`401 AUTH_UNAUTHORIZED`, `404 RESOURCE_NOT_FOUND`, `422 VALIDATION_*`).
- **In-process orchestrator:** calls the services directly with the run context it carries (BR-26). The Anthropic tool-use `input_schema` exposed to the LLM is the **business DTO** (NOT the MCP-extended schema) — the orchestrator injects `runContext` server-side; the LLM is never asked for `llm_run_id` and never sees it. The `propose_fragment` Anthropic schema additionally strips `chunk_ids` (the orchestrator injects the current chunk id at dispatch — see UC-08/UC-12).

This is the documented deviation from "ingest is MCP-only" (A28 / §14): confirmed by the owner; recorded in CLAUDE.md and in BR-21. The REST mirrors enable two things — (a) external HTTP clients to drive an extraction manually (for testing / replay), and (b) the orchestrator to be invoked without an MCP transport in the path.

**Description:** A single source of business logic (the service layer), three transports (MCP, REST, in-process). No transport-specific business code exists — the adapters only translate between transport envelopes and the run-id binding mechanism. The MCP variant is the only one that carries `llm_run_id` in the tool argument schema; REST carries it in the URL path; in-process injects it server-side. The MCP endpoint is stateless single-shape (same SDK-kernel pattern as `query` and `curation`); no per-session factory.
**Error returned:** Per-transport envelope (MCP `content` / `isError: true` with body `{ ok: false, error: {...} }` / REST same body shape with HTTP 200). Transport-level errors are HTTP-native.

### BR-29 -- Anthropic SDK is the sole LLM integration of the BFF
**Related UC:** UC-12
**Where to validate:** dependency manifest (`backend/package.json`); orchestrator (`extraction.service.ts`).
**Description:** `@anthropic-ai/sdk` is the only LLM client dependency. No alternative LLM provider is configured; switching providers requires a new BFF release. The API key (`ANTHROPIC_API_KEY`) is loaded once at boot via the Zod env schema in `backend/src/config/env.ts`; it is never read from the request context, never logged, never returned. The Anthropic client is instantiated once per orchestrator run (not memoized across runs — keeps the dependency narrow).
**Error returned:** Missing `ANTHROPIC_API_KEY` at boot → BFF refuses to start (Zod env parse failure). Network error / 5xx from Anthropic during a run → `BR-26` fatal-failure path (run flipped to `failed`; HTTP `500 SYSTEM_INTERNAL_ERROR`).

---

## 4. State Machine (ST)

### ST-01 -- LLMRun lifecycle (ST-LR of `ingestion.spec.md` §5.1)

```
            ingestRawInformation
                    |
                    v
               [running] --runLlmExtraction success---> [completed]   (terminal)
                    |        (BR-26 step 6)
                    |
                    +--runLlmExtraction fatal failure--> [failed]
                    |        (BR-26 step 7)
                    |
                    +--close err (legacy direct path)---> [failed]
                                       |
                                       +-- retryLlmRun --> [running]
                                              (BR-10)
```

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| (nothing) | running | `ingestRawInformation` creates a new run | `idempotency_key` is not already held by a `non-failed` run; UNIQUE constraint | UC-01 |
| running | completed | `runLlmExtraction` finishes all chunks without fatal failure | BR-26 step 6 — single UPDATE setting `status='completed'`, `finished_at=now()` | UC-12 |
| running | failed | `runLlmExtraction` catches unhandled exception | BR-26 step 7 — single UPDATE setting `status='failed'`, `finished_at=now()` | UC-12 |
| running | failed | legacy close path (close-from-MCP, retained for backward compat) | service sets `finished_at = now()`, `status = 'failed'`; DB `CHECK (status='running') = (finished_at IS NULL)` enforces simultaneous update | UC-07 |
| failed | running | `retryLlmRun` | atomic `UPDATE ... WHERE status = 'failed'`; in same TX orphan `proposed` fragments → `rejected` | UC-06 |
| completed | — | — | terminal — `retryLlmRun` returns `409 BUSINESS_RUN_NOT_RETRYABLE`; `runLlmExtraction` returns `409 BUSINESS_RUN_NOT_RUNNABLE` | — |
| running | — | `retryLlmRun` while still running | rejected → `409 BUSINESS_RUN_NOT_RETRYABLE` (BR-11) | UC-06 alt 2b |
| running | — | `runLlmExtraction` while already running | rejected → `409 BUSINESS_RUN_NOT_RUNNABLE` (BR-26 pre-check) | UC-12 |

**Invalid transitions:** any transition from `completed` triggered by `retryLlmRun` or `runLlmExtraction` is rejected at the service layer. The DB `CHECK (status = 'running') = (finished_at IS NULL)` rejects any UPDATE that desyncs the two columns.

### ST-02 -- InformationFragment lifecycle (ST-IF of `ingestion.spec.md` §5.2)

Unchanged from v1.1.0. The new orchestrator (BR-26) drives the same `proposed → accepted | rejected` transitions through the same service functions; consolidation (BR-27) is the path that promotes `proposed → accepted` via the cited fragments accumulating provenance.

---

## 5. Domain Events (EV)

> The Remember architecture does **not** include an event bus. The single audit substrate is `tool_call` for MCP calls and (for future consolidation/curation domains) `curation_action`.

**N/A — no domain events in this version.** The orchestrator (BR-26) emits a single `pino` `info` log line at run completion with the eight `validation_outcome` counts — this is observability, not an event-bus message; consumers (a future dashboard) read it from the log pipeline, not from a queue.

If a future domain needs to react to ingestion outcomes (e.g. notify on `disputed` count > 0), it polls `tool_call` and `llm_run.status`.

---

## 6. External Integrations

> Timeout and fallback required per integration.

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Neon Auth (Stack Auth) | REST (JWT verify via JWKS) | Validate the bearer token on every REST and MCP call. The middleware `requireNeonAuth` fetches the JWKS from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA keys by default) and verifies the token signature; auth-as-gate semantics preserved (§2.5 of v7, A29). | 2 s per JWKS fetch, JWKS cached in-process for `NEON_AUTH_JWKS_TTL_S` seconds (default 600). | None — without a verifiable JWT, the request is rejected with `401 AUTH_UNAUTHORIZED`. Cache miss + network failure → `503 SYSTEM_SERVICE_UNAVAILABLE`. |
| PostgreSQL 17 (Neon) | TCP (`pg` pool, connection string `DATABASE_URL`, `sslmode=require`) | Store all rows of this domain; only state of the system (§2.2 of v7). Schema unchanged from `migrations/0001_init.sql`. | Statement timeout: 10 s (default); 30 s on the `ingestRawInformation` route. The `runLlmExtraction` route has **no statement-level timeout override** — it manages many short transactions (BR-26 / BR-19); each tool-call transaction respects the 10 s default. Pool: min 2, max 10 connections per BFF instance; the orchestrator does NOT hold a connection across tool calls — it acquires per call. | None — PostgreSQL is the single store (§2.2). Outage → `500 SYSTEM_INTERNAL_ERROR` after retry-on-deadlock budget exhausted. Deadlock (`40P01`) retried up to 3 times with exponential backoff (50 ms / 100 ms / 200 ms). |
| MCP transport | Streamable HTTP **stateless** (`POST /api/v1/mcp/ingest`), low-level `@modelcontextprotocol/sdk` `Server` mounted via the shared SDK kernel `mountMcpEndpoint` (`backend/src/mcp/sdk-http-transport.ts`) | Surface the `ingest` toolset to external MCP clients. Tools are always listed (`tools/list`); `llm_run_id` is bound per-call as a tool argument on the MCP-facing Zod schema (BR-21 / BR-28). MCP 2025-06-18 `content` / `isError` shape; business error codes preserved by `backend/src/shared/error-mapping.ts`. | Per-tool-call hard ceiling: 30 s. | None at this layer. The MCP transport is **optional** from the orchestrator's perspective — the orchestrator uses the in-process path (BR-26) and does not depend on MCP availability. |
| Anthropic API (`@anthropic-ai/sdk`) | HTTPS (Anthropic's hosted API), via the official Node SDK | Drive the extraction loop (BR-26). The BFF is an Anthropic API client; the LLM never calls back into the BFF except indirectly via the in-process service calls inside the orchestrator. **Endpoint:** `client.messages.stream({...}).finalMessage()` per turn (streaming avoids the SDK's default request-level timeout on long completions). **Auth:** `ANTHROPIC_API_KEY` from BFF env; the key never leaves the BFF, never logged. **Tools:** the four `propose_*` schemas (BR-24); `thinking: { type: 'adaptive' }`. **Default model:** `claude-opus-4-8` (carried in `llm_run.model`; idempotency-key participant per BR-08). | Per-turn SDK default (governs the connection lifecycle, not the model latency — streaming keeps the connection alive). Orchestrator-level deadline: the HTTP request to `runLlmExtraction` stays open for the entire run; the BFF does not enforce a per-run wall-clock cap in v1 (acceptable at v1 scale per §16). | None — Anthropic is the sole LLM provider (BR-29). Network error / 5xx → the orchestrator's fatal-failure path (BR-26 step 7): run → `failed`; HTTP `500 SYSTEM_INTERNAL_ERROR`; owner re-invokes `retryLlmRun` then `runLlmExtraction`. `429` Anthropic rate-limit: SDK exposes `Retry-After`; the orchestrator honours it with at most 1 retry per turn (cap 60 s); a second 429 falls through to the fatal-failure path. `refusal` stop reason is **not** a fatal failure — it is a soft per-chunk skip (BR-26 step 5b bullet 4). |

**No alternative LLM provider** — `@anthropic-ai/sdk` is the only integration (BR-29).

---

## 7. Known Technical Constraints

- **Single-instance assumption for advisory locks.** Unchanged — see v1.1.0.
- **No row-level security.** Unchanged.
- **10 MiB body cap is per request, not per document.** Unchanged.
- **Chunker is in-process, synchronous, single-threaded.** Unchanged.
- **`Intl.Segmenter('pt')` requires Node.js built with full ICU.** Unchanged.
- **Catalog data (`NodeType`, `LinkType`, `AttributeKey`, `LinkTypeRule`) is read-only at runtime.** Unchanged; cached in `CatalogSnapshot` at boot; consumed by both the validators (BR-13..BR-17) and the prompt builder (BR-26 step 5a). A migration that adds catalog rows requires a BFF restart to surface them.
- **`tool_call.arguments` and `tool_call.result` are stored verbatim.** Unchanged — but the new in-process orchestrator (BR-26) routinely produces tool-call counts in the tens-to-low-hundreds per run, which fits comfortably within the §16 ceiling.
- **PostgreSQL `UNIQUE` violation detection relies on SQLSTATE `23505` and constraint name.** Unchanged; this revision adds awareness of `knowledge_link_current_dup_guard` and `node_attribute_current_dup_guard` — those should now only fire on a programming error (consolidator skipped, BR-27) **or** on a real concurrent race against the `FOR UPDATE` lock release. The consolidator's `23505` catch path runs the lookup-and-decide step **once** more before giving up — see BR-27 Dup-guard catch path. The error returned on a second `23505` MUST distinguish a real race from a deterministic miss; the legacy message (`"hit dup-guard twice; concurrent contention not resolvable"`) is forbidden because it conflated the two.
- **Re-affirmation of a multi-current link / attribute does NOT require matching `valid_from`.** For `allows_multiple_current = true` link types (e.g. `holds_role`) and `allows_multiple_current = true` attribute keys, the schema's partial UNIQUE dup-guard is scoped by `(source, link_type, target)` / `(node, attribute_key, value)` — `valid_from` is deliberately NOT part of the key. The consolidator (BR-27 sub-case (i)) treats a re-asserted link / attribute with the same target / value as `consolidated` regardless of whether the new proposal's `valid_from` matches the vigent row's `valid_from`. The typical trigger is the per-document `received` fallback (FR-001 in `temporal.ts`): two documents received on different days re-assert the same fact, the LLM provides no `valid_from`, the fallback yields a different `valid_from` per document, and §18 still requires consolidation. The vigent row's `valid_from` is preserved; promotion of a stronger evidence basis (e.g. `received → stated`) is **out of scope** for this revision (§8).
- **`unaccent()` is STABLE in Postgres.** Unchanged.
- **Neon Auth JWKS keys are EdDSA by default.** Unchanged.
- **Anthropic API is the only LLM provider (BR-29).** Switching providers requires a code change and a new release. The `ANTHROPIC_API_KEY` is the only LLM-side secret; it is loaded once at boot and never propagated to the request context.
- **`runLlmExtraction` is synchronous; the HTTP request stays open for the full run.** v1 acceptable per §16 (LLM-bound, minutes per document is fine at the v1 scale of hundreds of documents). Frontend / external callers MUST set their own client timeout to at least the expected per-document budget. A future evolution is a job queue; out of scope for v1.
- **Anthropic `stop_reason = 'pause_turn'` requires loop continuation without modifying messages.** The orchestrator implementation must handle this verbatim per BR-26 step 5b; failure to do so would silently truncate extractions. Covered by the orchestrator unit test (stubbed Anthropic client emitting a `pause_turn` then an `end_turn`).
- **No DDL change in this revision.** The schema (`migrations/0001_init.sql`) already supports entity resolution (`node_alias.alias_norm` GENERATED, `node_alias_norm_trgm_idx` GIN, `entity_match_review` table, `knowledge_node.status` / `merged_into_node_id`, `norm()` / `immutable_unaccent()` functions, partial dup-guard indexes). If a future tweak to thresholds or indexes requires DDL, it follows the "Database Changes Require Explicit Approval" rule of CLAUDE.md.
- **Entity-resolution thresholds (`MATCH_STRONG = 0.85`, `MATCH_FLOOR = 0.55`) are not configurable per call** (BR-25). They live in `entity-resolution.service.ts`; tuning requires a code change. The §16 metrics (acceptance rate, `needs_review` rate) are the calibration input.
- **`merged_into_node_id` path compression must happen on write** (CLAUDE.md "Known Gotchas"). The resolver hits `knowledge_node` filtered by `status = 'active'`, so merged nodes are naturally excluded from candidates; the merge service (`curation/service/merge.service.ts`) is responsible for repointing inbound edges to active survivors — no change in this revision.
- **The orchestrator does NOT hold a `pg` connection across turns.** Each tool-use invocation calls the corresponding service which acquires its own connection (BR-19). Otherwise the pool of `max=10` would be exhausted by a single long run.

---

## 8. Out of Scope

- **Embeddings / vector search.** Permanent non-goal (§20.1, A24, CLAUDE.md "Anti-patterns").
- **System-time travel** (§5.3 query c, A25) — permanently deferred.
- **Multi-tenant / `User` entity** (§2.3, §20.3, A20) — permanent non-goal.
- **Catalog mutation API.** Migration-only (§12).
- **Event bus / message queue.** Database is the integration boundary (§2.2 "store único").
- **Rate limiting / quota.** Single-owner; no per-tenant quota required in v1.0.0.
- **Async / queued ingestion or extraction.** `ingestRawInformation` and `runLlmExtraction` are both synchronous in v1; future worker offload is out of scope.
- **Re-chunking of existing documents.** Bumping `chunking_version` requires a new migration; not exposed in v1.
- **Retrieval (§7)** — owned by future `retrieval` domain.
- **Curation (§10)** — owned by future `curation` domain. The `entity_match` queue produced by BR-25 is consumed by the **existing** `resolveEntityMatchService` / `performMerge` (`curation/service/merge.service.ts`), with zero curation-side change required by this revision.
- **Compliance deletion (§11)** — owned by future `compliance` domain.
- **Alternative LLM providers.** Anthropic is the sole integration (BR-29); switching providers is a code-level change, not configuration.
- **Per-run wall-clock cap or cost cap on the Anthropic call.** v1 trusts the LLM to terminate the loop at `stop_reason='end_turn'`; the orchestrator is otherwise patient. A future evolution may add a `max_turns_per_chunk` cap or a per-run token-budget; out of scope for v1.
- **Re-running an extraction from a partial state.** Retry (`retryLlmRun` + `runLlmExtraction`) starts the extraction from the first chunk again; the consolidation flow (BR-27) absorbs the re-runs by `consolidated` outcomes. A future evolution may add a "resume from chunk N" mode using the existing `tool_call` history; out of scope for v1.
- **Schema migration in this revision.** No DDL; if any future entity-resolution/consolidation tweak requires DDL, it is handled in its own change (subject to CLAUDE.md's "Database Changes Require Explicit Approval" rule).
- **Promotion of `valid_from_basis` on consolidation.** §6.5 declares an evidence-basis precedence (`stated > document > received`). A future evolution may, on consolidation of a vigent row whose `valid_from_basis = 'received'` with a new proposal whose `valid_from_basis = 'stated'`, update the vigent row's `valid_from` and `valid_from_basis` to the stronger basis (instead of merely accumulating provenance). This revision does **not** implement that promotion — re-affirmation preserves the vigent row's `valid_from` and `valid_from_basis` as-is in every sub-case of BR-27. The bug closed by this revision is strictly the deterministic mis-rejection of multi-current re-affirmation; the basis promotion is a separate change.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Back Spec Agent | initial | Initial back-end spec for the ingestion domain. Mirrors `ingestion.spec.md` v1.0.0 (23 BRs, 11 UCs, 2 state machines) into a Fastify + raw-`pg` implementation on PostgreSQL 17 (Supabase Cloud). Tables owned: `raw_information`, `raw_chunk`, `llm_run`, `tool_call`, `information_fragment`, `fragment_source`. MCP `ingest` toolset documented at the contract level; UC-08..UC-11 delegate consolidation/entity-resolution to future domains. Error code `BUSINESS_RUN_NOT_RETRYABLE` registered. | -- |
| 1.1.0 | 2026-06-12 | Back Spec Agent | update | Infrastructure swap: Supabase Cloud → Neon (driver `pg` raw, `DATABASE_URL`, `sslmode=require`); Supabase Auth JWT → Neon Auth (Stack Auth) JWT via `requireNeonAuth` + JWKS (EdDSA), cached `NEON_AUTH_JWKS_TTL_S` s. Env vars renamed. Schema unchanged; single-owner unchanged; auth-as-gate unchanged. No BR / UC / ST changes. | migrate-neon |
| 1.2.0 | 2026-06-12 | Back Spec Agent | update | **Extraction pipeline + entity resolution + graph consolidation + dual-transport `ingest`.** Adds the in-process extraction orchestrator (`extraction.service.ts`) driven by `@anthropic-ai/sdk` in a manual tool-use loop (BR-26) and triggered by the new `POST /api/v1/ingest/llm-runs/:id/run` endpoint (UC-12, declared in `ingestion.spec.md` v1.2.0). Promotes entity resolution and graph consolidation from out-of-scope to in-scope at the service layer: new `entity-resolution.service.ts` implements §4 thresholds `MATCH_STRONG=0.85` / `MATCH_FLOOR=0.55` and writes `entity_match_review` rows for the ambiguous decision branch (BR-25); new `graph-consolidation.service.ts` implements §6.5 consolidate / supersede / dispute / correct decisions under `SELECT ... FOR UPDATE` (BR-27). Removes the "MCP-only" constraint from BR-21 (now transport-agnostic); adds BR-28 (dual-transport REST + MCP + in-process, single Zod source via `zod-to-json-schema`, documented A28 deviation) and BR-29 (`@anthropic-ai/sdk` is the sole LLM integration). Adds Anthropic API as a new external integration row in §6. **No schema change** — the existing `migrations/0001_init.sql` already supports every new behaviour (`node_alias.alias_norm` GENERATED, `node_alias_norm_trgm_idx` GIN, `entity_match_review`, partial dup-guards, `knowledge_node.status` / `merged_into_node_id`). New env var: `ANTHROPIC_API_KEY` (BFF-only secret). No new BUSINESS_ error codes — `BUSINESS_RUN_NOT_RETRYABLE` is reused by `runLlmExtraction` against a non-`running` run (BR-26 pre-check), and all extraction outcomes flow through the existing MCP envelope codes (`STRUCTURAL_INVALID`, `UNKNOWN_TYPE`, `RULE_VIOLATION`, `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`, `NOT_FOUND`, `INTERNAL`) or the `tool_call.validation_outcome` values (`accepted`, `consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`, `rejected`, `error`). Updated §1 (architecture, validation, observability, extraction orchestrator, Anthropic client rows), §2 (cross-domain tables / indexes used by the new services), §3 (BR-21 rewritten transport-agnostic; new BR-24..BR-29), §4 (ST-LR adds `runLlmExtraction` transitions), §6 (Anthropic row), §7 (new constraints), §8 (out-of-scope refresh). | ingestion-extraction |
| 1.2.1 | 2026-06-12 | Back Spec Agent | correction | Three error-code corrections and an OpenAPI surface alignment. (1) BR-26: pre-check for `runLlmExtraction` against a non-`running` run now returns `409 BUSINESS_RUN_NOT_RUNNABLE` (was `BUSINESS_RUN_NOT_RETRYABLE`, which is reserved for `retryLlmRun` per BR-11). (2) ST-LR table updated: completed→runLlmExtraction returns `BUSINESS_RUN_NOT_RUNNABLE`; completed→retryLlmRun returns `BUSINESS_RUN_NOT_RETRYABLE` (split row). (3) BR-27 correction branch: `tool_call.validation_outcome = 'accepted'` (was `'superseded_previous'`) and the closed vigent row's status is `'corrected'` (was `'superseded'`) — both align with `ingestion.spec.md` BR-25 correction flow. (4) OpenAPI surface (`openapi.yaml`) updated to expose the five new endpoints corresponding to v1.2.0 of the spec: `POST /llm-runs/{llmRunId}/run` (operationId `runLlmExtraction`), `POST /llm-runs/{llmRunId}/propose-fragment` (operationId `proposeFragment`), `POST /llm-runs/{llmRunId}/propose-node` (operationId `proposeNode`), `POST /llm-runs/{llmRunId}/propose-link` (operationId `proposeLink`), `POST /llm-runs/{llmRunId}/propose-attribute` (operationId `proposeAttribute`); plus new shared response `LlmProviderUnavailable` (502 `SYSTEM_LLM_PROVIDER_UNAVAILABLE` per UC-12 alt 4a), new shared response `RunNotRunning` (409 `BUSINESS_RUN_NOT_RUNNING` per UC-08..UC-11 alt 1a REST branch), and DTO schemas `ProposeMcpEnvelope`, `ProposeFragmentInput`, `ProposeNodeInput`, `ProposeLinkInput`, `ProposeAttributeInput`, `RunLlmExtractionRequest`, `ValidFromBasis`, `ChangeHint`. Root aggregator (`docs/specs/openapi.root.yaml`) extended with the five new paths. Error catalog (`docs/specs/_global/error-codes.md`) already registers `BUSINESS_RUN_NOT_RUNNABLE`, `BUSINESS_RUN_NOT_RUNNING`, and `SYSTEM_LLM_PROVIDER_UNAVAILABLE` (registered upstream by spec-back task 1). No schema change. | ingestion-extraction |
| 1.2.2 | 2026-06-14 | Back Spec Agent | correction | BR-27 graph-consolidation Re-affirmation branch rewritten to fix the deterministic mis-rejection of cross-document re-affirmation for multi-current link types and multi-valued attribute keys (`allows_multiple_current = true`). Root cause closed: the previous rule required identical `valid_from` between the vigent row and the new proposal in every sub-case, which broke §18 "re-affirmation consolidates, never duplicates" whenever the second document's `valid_from_basis = 'received'` fallback (FR-001 in `temporal.ts`) yielded a different per-document date than the vigent row. The branch is now split into three sub-cases: (i) multi-current — `same target/value + change_hint='none'` is sufficient, `valid_from` divergence is ignored; (ii) functional with identical `valid_from` — previous v1.2.1 behaviour preserved; (iii) functional with same target/value but divergent `valid_from` AND no succession/correction signal — also consolidated (the divergent date is treated as informational, succession requires a different value AND a textual signal). The consolidator's `23505` (dup-guard) catch path is now documented with an explicit two-attempt protocol: re-run the lookup-and-decide step once after a `23505` (resolves deterministic misses); on a second `23505`, return `STRUCTURAL_INVALID` with a message that identifies a real concurrent race (the legacy message `"hit dup-guard twice; concurrent contention not resolvable"` is forbidden — it conflated a deterministic miss with a real race). Updated §1 Testing row (new unit test: multi-current cross-document re-affirmation with divergent `valid_from` returns `outcome=consolidated` and accumulates provenance, no second vigent row inserted, no dup-guard fire). Updated §2 indexes table note on `knowledge_link_current_dup_guard` to clarify that `valid_from` is deliberately not part of the partial-UNIQUE key. Added two §7 Known Technical Constraints bullets (dup-guard catch path; multi-current re-affirmation rule). Added one §8 Out-of-Scope bullet (`valid_from_basis` promotion on consolidation — not implemented in this revision). No new BR introduced; no change to BR-25 (entity resolution), BR-26 (orchestrator), BR-28 (dual-transport), BR-29 (Anthropic). No schema change. No DDL. No OpenAPI surface change — the `consolidated` outcome and `validation_outcome` enum already cover the corrected behaviour; the error codes in the catalog are unchanged. No new BUSINESS_ error code. Vigent row's `valid_from` / `valid_from_basis` are preserved as-is on consolidation in all sub-cases. | fix-link-reaffirmation-consolidation |
| 1.2.3 | 2026-06-14 | Maintainer | correction | BR-27 Succession sub-case gains an **intra-day collapse guard**. Bug: a functional succession whose new `valid_from` equals (or precedes) the vigent row's `valid_from` — a same-day change, typically both via the `received` fallback — set `valid_to = $newValidFrom` on the vigent row, producing a degenerate `[D, D)` interval that violates the strict `valid_from < valid_to` CHECK (`knowledge_link_interval_ck` / `node_attribute_interval_ck`, also `temporal.ts`); the 2nd same-day change errored (`INTERNAL`) and was dropped. Fix: when `vigent.valid_from >= closeDate` the vigent row is closed on the **transaction axis only** (`superseded_at` / `status='superseded'`, `valid_to` untouched — same shape as the Correction sub-case); otherwise the normal `valid_to = closeDate` close applies. Implemented as a SQL `CASE` in the shared `closeVigentForSuccession` helper (`graph-consolidation.service.ts`), used by both `consolidateLink` and `consolidateAttribute`. Rationale for keeping `date` (not promoting validity to `timestamp`): a timestamp validity would fabricate sub-day precision the sources lack (violates §1 / §6.5 / A14) and conflate the validity × transaction axes — the intra-day ordering already lives on the `timestamptz` transaction axis. Regression test added in `graph-consolidation.spec.ts`; verified empirically on an ephemeral Neon branch (old SQL → CHECK violation; new `CASE` → `valid_to` stays NULL on a same-day close, sets `valid_to = today` on a past-dated close). No schema change, no DDL, no new BR, no error-code or OpenAPI change. | fix-intraday-succession |
| 1.2.4 | 2026-06-15 | Back Spec Agent | update | **MCP `ingest` transport migrated to the shared SDK kernel (`mountMcpEndpoint`); `llm_run_id` rebound from ambient session header to per-call tool argument (Option B); per-session factory retired.** BR-21 rewritten: the MCP-facing Zod schema of each `propose_*` tool now extends the business DTO with `llm_run_id: z.string().min(1)`; tools are **always listed** by the MCP `Server`'s `tools/list` handler regardless of state; a call with a missing/invalid `llm_run_id` arg (or one that does not point to a `running` `llm_run`) is handled by the MCP handler, calls `assertRunIsRunning`, and returns MCP 2025-06-18 `content` / `isError: true` with body `{ ok: false, error: { code: "STRUCTURAL_INVALID" } }` (HTTP `200` from the SDK kernel — business errors are NOT HTTP errors; preserved via `backend/src/shared/error-mapping.ts`). The per-session model (`backend/src/modules/ingestion/mcp/session-factory.ts`) and the `X-LLM-Run-Id` ambient header are **retired** — the `ingest` MCP endpoint is now stateless single-shape, mounted via the shared SDK kernel `mountMcpEndpoint` (`backend/src/mcp/sdk-http-transport.ts`), exactly like the `query` and `curation` transports (Fases 2-3 of the MCP→SDK migration). BR-23 updated: the previous "MCP pre-handler rejects 'no ambient `llm_run_id`' → no `tool_call` row" exception is **withdrawn** — the handler is now always reached, so the rejection path is in-handler and a `tool_call` row with `validation_outcome = 'rejected'` IS persisted. Every reachable `propose_*` invocation produces exactly one `tool_call` row on every transport (no exception). BR-28 updated: MCP bullet rewritten to describe the arg-based run-id binding and the SDK-kernel mounting; the REST bullet still binds `llm_run_id` via the URL path (the REST body schema does NOT carry `llm_run_id`); the in-process orchestrator bullet clarifies that the Anthropic tool-use `input_schema` is the **business DTO** (no `llm_run_id` argument — the orchestrator injects `runContext` server-side; the LLM is never asked for it). BR-24 / §1 Validation library row updated to note the per-transport Zod variants (MCP-extended vs. business DTO vs. Anthropic schema with `chunk_ids` also stripped for `propose_fragment`). §1 MCP-server row updated to mention `mountMcpEndpoint` and the retirement of the session factory; §1 Architecture-pattern row updated to mention the retired session factory. §6 External integrations: MCP transport row updated — Streamable HTTP stateless, low-level `@modelcontextprotocol/sdk` `Server`, mounted via the shared SDK kernel; tools always listed; `llm_run_id` bound per-call as a tool argument. Unchanged: in-process orchestrator paths (`extraction.service.ts`) — the Anthropic / in-process schemas continue to carry no `llm_run_id`; REST propose-* mirror routes — body schema unchanged (no `llm_run_id`); the 5-layer validation logic; `runIngestHandler` / `assertRunIsRunning` / `tool_call` audit logic; BR-22, BR-25, BR-26, BR-27, BR-29; ST-01, ST-02; data model (no schema change, no DDL); error-code catalog (no new BUSINESS_ codes); REST OpenAPI surface. Migration notes for the implementation group: drop `backend/src/modules/ingestion/mcp/session-factory.ts` and its spec (`mcp-session-factory.spec.ts`); migrate the MCP integration tests (`mcp-endpoint.spec`, `mcp-transport.spec`) to the MCP wire shape (`Accept: application/json, text/event-stream`; assert on `content` / `isError`) and to arg-based `llm_run_id`. | mcp-ingest-sdk |
