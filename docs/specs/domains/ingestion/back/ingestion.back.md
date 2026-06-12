# Ingestion -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 via Neon (driver `pg` raw) | Version: 1.1.0 | Status: draft | Layer: permanent
> Business spec: `../ingestion.spec.md`
> REST contract: `../openapi.yaml`
> MCP contract: `segundo-cerebro-modelagem-v7.md` §14.1 (toolset `ingest`)
> Schema: `migrations/0001_schema.sql` + `migrations/0002_seed.sql`

---

## 1. Stack and Patterns

> Declare only values that differ from or extend CLAUDE.md. Use `"CLAUDE.md default"` for aspects already covered there.

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves `openapi.yaml`) | CLAUDE.md default |
| MCP server | Same BFF process, second transport over the same service layer (CLAUDE.md "Architecture / MCP Server"). The `ingest` toolset is MCP-only (UC-08..UC-11); `query` / `curation` are mirrored in REST (out of scope here). | CLAUDE.md default |
| ORM | None — raw `pg` driver with parameterized queries (A6, §2.2 of v7). String concatenation of SQL is forbidden (CLAUDE.md "Security"). | CLAUDE.md default |
| Migration strategy | Versioned SQL files in `migrations/` (`0001_schema.sql`, `0002_seed.sql`). New catalog entries require a new migration (§12). New chunking versions require a new migration (BR-03). | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/ingestion/`. Three internal layers per module: `routes` (Fastify route handlers + Zod request/response schemas) → `service` (transactional orchestration + the 5-layer validation of §13) → `repository` (parameterized SQL against the tables owned by this domain). | Aligned with CLAUDE.md "folder_structure: modules". |
| Validation library | Zod v4 — every REST DTO and every MCP tool input (UC-08..UC-11) has a Zod schema. Failed Zod parse on REST → 422 with one of `VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE`. Failed Zod parse on MCP → envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }` and a `tool_call` row with `validation_outcome = 'rejected'` (BR-13, BR-14). | CLAUDE.md default |
| Auth | Neon Auth (Stack Auth) JWT validated by a Fastify `preHandler` middleware `requireNeonAuth` on every route under `/api/v1/ingest/*` and on every MCP tool call. JWKS is fetched from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default) and cached in-process for `NEON_AUTH_JWKS_TTL_S` seconds. PostgreSQL RLS is disabled (A29). Single-owner — no `User` entity, no role check. The legacy env vars `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_JWKS_TTL_S` are removed; the BFF now reads `NEON_AUTH_URL` and `NEON_AUTH_JWKS_TTL_S` only. | CLAUDE.md default (auth-as-gate, single-owner unchanged); provider swapped from Supabase Auth to Neon Auth. |
| Logging | `pino` structured JSON. Required fields per request/tool call: `request_id`, `route` or `tool_name`, `llm_run_id?`, `raw_information_id?`, `outcome`, `latency_ms`. PII fields (`content`, `text`) are never logged at any level (CLAUDE.md "Security"). | CLAUDE.md default |
| Observability | `observability_required: true`. The §16 run metrics (acceptance rate, consolidations, `needs_review`, `disputed`, `uncertain`/`low_confidence`, per-layer rejections) are derived at read time from `tool_call.validation_outcome` (BR-12); no separate metrics store. | CLAUDE.md default |
| Transaction policy | Every state-mutating REST endpoint and every MCP `ingest` tool call runs inside a single PostgreSQL transaction opened by the service layer (BR-19, A19). The Fastify route handler is the only place that calls `pool.connect()` / `client.query('BEGIN')`; the service receives the live `client` as its first argument. | Extension of CLAUDE.md "Backend / pg raw". |
| Concurrency | `SELECT ... FOR UPDATE` for functional succession (A11), `pg_advisory_xact_lock(hashtextextended(...))` for entity creation (§4.5). Both are issued from the service layer inside the open transaction. | Extension of CLAUDE.md "Conventions". |
| Time source | `now()` provided by PostgreSQL — never `Date.now()` in business code. State dependent on the clock is derived at read time, never written (CLAUDE.md "Conventions", §5.4, A9). | CLAUDE.md default |
| Idempotency primitive | `sha256(content)` as `content_hash`; `sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)` as `llm_run.idempotency_key`. Both UTF-8, hex lowercase, 64 chars (BR-01, BR-08, A18). | New (this domain). |
| Body limit | Fastify `bodyLimit` set to 11 MiB on the `ingestRawInformation` route to accommodate the 10 MiB `content` cap (UC-01 alt 1c, BR-04 cross-ref) plus JSON envelope overhead. All other routes use the platform default (1 MiB). | New (this domain). |
| Chunker | Pure TypeScript module `modules/ingestion/chunker/v1.ts` exporting `chunkV1(content: string, sourceType: SourceType): RawChunkInput[]`. Constants `CHUNK_TARGET=[1500,2000]`, `CHUNK_HARD_MAX=4000`, `READING_TAIL=200` live in `modules/ingestion/chunker/config.ts` (BR-04, A22). Sentence split uses `Intl.Segmenter('pt', { granularity: 'sentence' })` (BR-07). | New (this domain). |
| Hashing | `node:crypto.createHash('sha256').update(...).digest('hex')`. UTF-8 encoding is explicit on every `.update()` call. | New (this domain). |
| Database connection | `pg` `Pool` instantiated from `DATABASE_URL` (Neon direct connection string). The Neon endpoint is the single store; schema is unchanged from the v7-aligned `migrations/0001_schema.sql` + `migrations/0002_seed.sql`. TLS is required by Neon (`sslmode=require` carried in the connection string). | Provider swapped from Supabase Cloud to Neon; driver, schema and pooling semantics unchanged. |
| Testing | Vitest unit tests on the chunker (BR-03 determinism), on the idempotency key composition (BR-08), and on the 5-layer validation per UC (BR-13..BR-18). C1–C15 of v7 §17 are the acceptance suite at the BFF level. | CLAUDE.md default |

---

## 2. Data Model

> Exact database types as defined in `migrations/0001_schema.sql`. This domain owns six tables: `raw_information`, `raw_chunk`, `llm_run`, `tool_call`, `information_fragment`, `fragment_source`. Catalog and graph tables (`node_type`, `link_type`, `link_type_rule`, `attribute_key`, `knowledge_node`, `node_alias`, `node_attribute`, `knowledge_link`, `provenance`, `entity_match_review`) are read (UC-09, UC-10, UC-11) and written through the consolidation/entity-resolution service layer; their full ownership belongs to those future domains (§7 of `ingestion.spec.md`).

### Table: raw_information

> Immutable original document (§3.1 of v7). Only writer post-creation is `compliance_delete` (out of scope here).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| source_type | source_type (enum) | NOT NULL | One of `pdf`, `email`, `ata`, `chat`, `artigo`, `transcricao`, `outro` (§3.1). Drives chunker hard boundaries (BR-06). |
| content | text | NOT NULL | The original document, inline. Replaced with the literal string `"[REDACTED]"` by `compliance_delete` (§11). |
| storage_ref | text | NULL allowed | Reserved for future externalization. Always NULL in this version (A5). |
| content_hash | text | NOT NULL, UNIQUE, CHECK `~ '^[0-9a-f]{64}$'` | `sha256(content)` hex lowercase. Idempotency anchor (BR-01, §8). The UNIQUE constraint is what the `noop_existing` 200 path detects (UC-01 alt 4a). |
| received_at | timestamptz | NOT NULL, DEFAULT `now()` | Wall-clock time the BFF accepted the document. |
| metadata | jsonb | NOT NULL, DEFAULT `'{}'::jsonb` | Free-form bag. Reserved key `document_date` (ISO date) participates in the date-justification chain (A14, §6.5). Reserved key `compliance_deleted: true` is set by `compliance_delete`. |

### Table: raw_chunk

> Deterministic slice of `raw_information.content` (§3.1, §9.2). Offsets 0-based, semi-open `[offset_start, offset_end)`, in Unicode code points (BR-05, A22).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| raw_information_id | uuid | NOT NULL, FK → `raw_information(id)` | Owning document. |
| chunk_index | int | NOT NULL, CHECK `>= 0` | 0-based position. Spec name is `index`; renamed because `INDEX` is a SQL keyword (CLAUDE.md "Known Gotchas"). |
| text | text | NOT NULL | Verbatim slice. Stored, not derived (allows offsetting drift in future re-chunking). |
| offset_start | int | NOT NULL, CHECK `>= 0` | Start offset in code points. |
| offset_end | int | NOT NULL, CHECK `offset_end > offset_start` | End offset, exclusive (BR-05). |
| locator | jsonb | NULL allowed | Readable anchor for citation (page/line/speaker/ts) — shape depends on `source_type` (A23). |
| chunking_version | text | NOT NULL, DEFAULT `'v1'` | Identifier of the chunking strategy (BR-03). |
| text_search | tsvector | GENERATED ALWAYS, STORED | `to_tsvector('pt_unaccent_v1', text)` — backs full-text search (out of scope here; consumed by the future `retrieval` domain). |

**Composite UNIQUE:** `(raw_information_id, chunking_version, chunk_index)` — guarantees one chunk per slot per chunking version.

### Table: llm_run

> One row per extraction session against one `raw_information` (§3.5). Retry reopens the same row in place (BR-10).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| model | text | NOT NULL | LLM model identifier (e.g. `claude-opus-4-7`). Part of `idempotency_key`. |
| prompt_version | text | NOT NULL | Versioned extraction prompt id. Part of `idempotency_key`. |
| started_at | timestamptz | NOT NULL, DEFAULT `now()` | Set on first creation; never modified by retry (retry only flips `status` and bumps `attempts`). |
| finished_at | timestamptz | NULL allowed | Set by the close path (UC-07); reset to NULL by retry (UC-06, BR-10). |
| status | llm_run_status (enum) | NOT NULL, DEFAULT `'running'` | One of `running`, `completed`, `failed`. Drives ST-LR. |
| attempts | int | NOT NULL, DEFAULT 1, CHECK `>= 1` | Incremented by 1 on every retry (BR-10). |
| input_raw_information_id | uuid | NOT NULL, FK → `raw_information(id)` | The source document. |
| idempotency_key | text | NOT NULL, UNIQUE | `sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)` (BR-08, A18). |

**CHECK invariant:** `(status = 'running') = (finished_at IS NULL)` — ST-LR is the single source of truth (BR-11, §3.5).

### Table: tool_call

> Audit row of every MCP `ingest` tool invocation (§3.5). The §16 run summary (BR-12) is computed by aggregating `validation_outcome` of these rows.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| llm_run_id | uuid | NOT NULL, FK → `llm_run(id)` | The run the call belongs to. |
| tool_name | text | NOT NULL | One of `propose_fragment`, `propose_node`, `propose_link`, `propose_attribute` (§14.1). |
| arguments | jsonb | NOT NULL | Verbatim arguments received from the LLM. Stored as-is for audit. |
| result | jsonb | NULL allowed | Verbatim JSON envelope returned to the LLM (`{ ok: true, result }` or `{ ok: false, error }`). |
| validation_outcome | validation_outcome (enum) | NOT NULL | One of `accepted`, `consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`, `rejected`, `error` (§3.5). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Used for chronological pagination (UC-05). |

### Table: information_fragment

> An atomic extracted claim (§3.2). Carries `confidence`. Lives in ST-IF.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| llm_run_id | uuid | NOT NULL, FK → `llm_run(id)` | The run that produced this fragment. |
| text | text | NOT NULL, CHECK `char_length(text) <= 1000` | Subject–predicate–object sentence. The 1000-char cap is the contract of `propose_fragment` (BR-22, §14.1). |
| confidence | numeric | NOT NULL, CHECK `[0, 1]` | LLM-reported confidence. Drives routing (BR-17, A13). |
| status | fragment_status (enum) | NOT NULL, DEFAULT `'proposed'` | One of `proposed`, `accepted`, `rejected`, `superseded`, `deleted` (ST-IF). |
| text_search | tsvector | GENERATED ALWAYS, STORED | `to_tsvector('pt_unaccent_v1', text)` — out of scope here; consumed by retrieval. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Insertion timestamp. |

### Table: fragment_source

> Join table — every fragment anchors back to at least one `raw_chunk` of the same `raw_information_id`. Anti-hallucination invariant for fragments (BR-18 anchors links/attributes; this table anchors the fragments themselves).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| fragment_id | uuid | NOT NULL, FK → `information_fragment(id)` | The fragment. |
| raw_chunk_id | uuid | NOT NULL, FK → `raw_chunk(id)` | A chunk of the run's `input_raw_information_id`. Cross-run anchoring is forbidden (UC-08 alt 2c). |

**PK:** `(fragment_id, raw_chunk_id)` — no duplicate anchors.

### Indexes

> Justify each index with the query it optimizes. Every FK has its own index (CLAUDE.md "Conventions"). Index names and definitions are taken verbatim from `migrations/0001_schema.sql`.

| Table | Fields | Type | Justification |
|-------|--------|------|---------------|
| raw_information | content_hash | UNIQUE btree (from `UNIQUE` constraint) | UC-01 alt 4a: idempotent re-ingestion looks up by `content_hash` before deciding `created` vs `noop_existing`. |
| raw_chunk | (raw_information_id, chunking_version, chunk_index) | UNIQUE btree (composite) | UC-03 reads chunks of a `raw_information_id` ordered by `chunk_index`; the composite index serves both the uniqueness guard and the ordered range scan. |
| raw_chunk | text_search | GIN | Out of scope for ingestion routes (consumed by future retrieval); listed because the column is generated by the writes this domain performs (UC-01 step 5). |
| llm_run | input_raw_information_id | btree (`llm_run_input_idx`) | UC-01 alt 4a's `noop_existing` branch reads the existing `llm_run` row by `(input_raw_information_id, idempotency_key)`. Also used to confirm absence of a non-failed run before creating a new one. |
| llm_run | idempotency_key | UNIQUE btree (from `UNIQUE` constraint) | BR-08 guard against duplicate runs; UC-01 alt 4a lookup. |
| tool_call | llm_run_id | btree (`tool_call_run_idx`) | UC-04 (run summary aggregation, BR-12) and UC-05 (paginated audit list) both scan by `llm_run_id`. |
| information_fragment | llm_run_id | btree (`information_fragment_run_idx`) | UC-06 retry flips orphan `proposed` fragments of the run to `rejected`; the index supports the scan. Also used by anti-hallucination checks (BR-18) to confirm a fragment belongs to the current run. |
| information_fragment | text_search WHERE `status = 'accepted'` | partial GIN | Out of scope here (consumed by retrieval); listed because writes in this domain populate the column. |
| fragment_source | (fragment_id, raw_chunk_id) | PK btree | UC-08 inserts; BR-18 reverse lookup (chunk → fragments) via the secondary index below. |
| fragment_source | raw_chunk_id | btree (`fragment_source_chunk_idx`) | BR-18 needs to walk `fragment_id → raw_chunk_id → raw_information_id` to verify a fragment anchors a chunk of the run's source. The PK starts with `fragment_id`, so this secondary index serves the reverse direction. |

### Relationships

> FK + on-delete strategy. Cross-domain: via ID only — never nested objects.

| From | To | Type | FK | On Delete |
|------|----|------|----|-----------|
| raw_chunk.raw_information_id | raw_information.id | N : 1 | `raw_chunk_raw_information_id_fkey` | NO ACTION (default) — `raw_information` is immutable; compliance_delete tombstones it (overwriting `content` only) and does **not** delete the row, so cascade is unnecessary and would defeat audit (BR-02). |
| llm_run.input_raw_information_id | raw_information.id | N : 1 | `llm_run_input_raw_information_id_fkey` | NO ACTION — same reasoning. |
| tool_call.llm_run_id | llm_run.id | N : 1 | `tool_call_llm_run_id_fkey` | NO ACTION — `llm_run` is never deleted; retry reopens in place (BR-10). |
| information_fragment.llm_run_id | llm_run.id | N : 1 | `information_fragment_llm_run_id_fkey` | NO ACTION — same reasoning. Cleanup of orphan `proposed` fragments on retry is a status transition (`proposed → rejected`), never a row delete (BR-10). |
| fragment_source.fragment_id | information_fragment.id | N : 1 | `fragment_source_fragment_id_fkey` | NO ACTION — fragments are not deleted; status `deleted` is a tombstone applied by compliance (out of scope here). |
| fragment_source.raw_chunk_id | raw_chunk.id | N : 1 | `fragment_source_raw_chunk_id_fkey` | NO ACTION — chunks are not deleted in this domain. |

**No CASCADE anywhere in this domain.** Data is immutable by design (BR-02); the only post-creation mutations are status transitions and the compliance tombstone — neither requires cascade.

---

## 3. Business Rules (BR)

> Every BR references at least one UC of `ingestion.spec.md`. This section translates each business rule into the validation layer that enforces it and the error code returned on violation. Rule wording is condensed; canonical wording lives in `ingestion.spec.md` §4.

### BR-01 -- Content hash is the idempotency anchor
**Related UC:** UC-01
**Where to validate:** service (`ingestion.service.ingestRawInformation`) computes `sha256(content)` after the Zod parse and before the transaction opens. Format constraint (`^[0-9a-f]{64}$`) is enforced by the DB `CHECK` on `raw_information.content_hash`.
**Description:** `content_hash = sha256(content)`, hex, lowercase, 64 chars. The DB `UNIQUE (content_hash)` is what UC-01 alt 4a turns into `outcome = "noop_existing"`.
**Error returned:** No direct error — collision is a business outcome (`200 noop_existing`), not a 409. A `UNIQUE` violation raised by `pg` is caught by the service and translated into the re-read path; an unexpected `unique_violation` SQLSTATE `23505` on any other index becomes `500 SYSTEM_INTERNAL_ERROR`.

### BR-02 -- Source content is immutable
**Related UC:** UC-01, UC-02
**Where to validate:** repository — the ingestion module exposes no `UPDATE raw_information ...` query at all. The only writer that exists in the whole system targeting `raw_information.content` belongs to the future compliance module (`compliance_delete`).
**Description:** After insert, `raw_information.{content, metadata, received_at}` is never modified by any code path of this domain.
**Error returned:** Not applicable — enforced by absence of code (no error path needed). A reviewer who finds an `UPDATE raw_information` in this module must reject the PR.

### BR-03 -- Chunking is deterministic and versioned
**Related UC:** UC-01
**Where to validate:** Vitest unit test on `chunkV1` — running `chunkV1(content, sourceType)` twice produces strictly equal outputs (same array length, same offsets, same text). `chunking_version` is hardcoded to `'v1'` in the constant module; bumping it requires a new migration plus a new chunker module (out of scope for 1.0.0).
**Description:** Same `(content, chunking_version)` → same chunks.
**Error returned:** Not applicable at request time — a non-deterministic chunker is a code-level bug surfaced by the unit test, not an API error.

### BR-04 -- Chunk algorithm constants are fixed
**Related UC:** UC-01
**Where to validate:** `modules/ingestion/chunker/config.ts` — single source of truth. `CHUNK_TARGET=[1500,2000]`, `CHUNK_HARD_MAX=4000`, `READING_TAIL=200` (A22). Changing any of them requires a new chunking version (BR-03).
**Description:** The three constants are not configurable per request.
**Error returned:** Not applicable.

### BR-05 -- Chunk offsets are 0-based, semi-open, in Unicode code points
**Related UC:** UC-01, UC-03
**Where to validate:** chunker implementation — iterate via `[...str]` (code-point iterator), never via `str[i]` (UTF-16 unit). DB `CHECK (offset_end > offset_start)` is the safety net.
**Description:** `offset_start >= 0`, `offset_end > offset_start`, both counted in code points of the original `content`.
**Error returned:** Chunker producing an invalid pair → DB `CHECK` violation → caught and surfaced as `500 SYSTEM_INTERNAL_ERROR` (UC-01 alt 5a). This is a bug, not a user-facing failure mode.

### BR-06 -- Hard boundaries close the current chunk
**Related UC:** UC-01
**Where to validate:** chunker — per-`source_type` dispatch table. `pdf`: form-feed / explicit page marker. `email`: header↔body delimiter (first blank line) plus every level of `^>+ ` quotation. `chat`, `transcricao`: speaker/turn delimiter, also forbids cross-speaker fusion. `ata`, `artigo`, `outro`: no hard boundary — `CHUNK_TARGET` / `CHUNK_HARD_MAX` only.
**Description:** Hard boundaries are mandatory closures; the chunker never overlaps chunks; `READING_TAIL` is not persisted.
**Error returned:** Not applicable (chunker correctness, covered by BR-03 unit tests).

### BR-07 -- Oversize blocks fall back to sentence split
**Related UC:** UC-01
**Where to validate:** chunker — a block strictly larger than `CHUNK_HARD_MAX` is split with `Intl.Segmenter('pt', { granularity: 'sentence' })`. Code blocks (markdown ``` fences) and tables (markdown `|...|` rows) are exempt and remain one chunk.
**Description:** Sentence-level split is a last-resort fallback; structural blocks are preserved intact.
**Error returned:** Not applicable.

### BR-08 -- Run idempotency key composition
**Related UC:** UC-01
**Where to validate:** service — `idempotencyKey = sha256(utf8(content_hash) ∥ utf8(prompt_version) ∥ utf8(model) ∥ utf8(chunking_version))`, no separator. Hex lowercase 64 chars. DB `UNIQUE (llm_run.idempotency_key)` is the safety net.
**Description:** Bumping any of the four operands yields a different key, hence a new run on the same `raw_information` (UC-01 alt 4a is keyed by `(content_hash, idempotency_key)` jointly).
**Error returned:** Not applicable — collisions are translated into `200 noop_existing`; an unexpected `unique_violation` SQLSTATE `23505` on `llm_run_idempotency_key_key` is logged and re-raised as `500 SYSTEM_INTERNAL_ERROR`.

### BR-09 -- Re-ingestion is a no-op on the live path
**Related UC:** UC-01 alt 4a
**Where to validate:** service. On `INSERT INTO raw_information ... RETURNING id`, catch SQLSTATE `23505` on `raw_information_content_hash_key`. Then in the same transaction: re-read the existing `raw_information` by `content_hash`, recompute `idempotency_key`, look up the existing `llm_run` by `idempotency_key`. If the run is found and `status <> 'failed'`, return `200` with `outcome = "noop_existing"` (empty `chunks` array, existing identifiers). If the run is `failed`, still return `200 noop_existing` (the caller is expected to invoke `retryLlmRun` next).
**Description:** No new rows are written in the no-op path.
**Error returned:** None — this is a 200 success path.

### BR-10 -- Retry reopens the same LLMRun row
**Related UC:** UC-06
**Where to validate:** service (`ingestion.service.retryLlmRun`). One transaction does: `UPDATE llm_run SET status='running', attempts = attempts+1, finished_at = NULL WHERE id = $1 AND status = 'failed' RETURNING *`. If `rowCount = 0`, the run was not failed → return `409 BUSINESS_RUN_NOT_RETRYABLE`. In the same transaction, flip orphan `proposed` fragments to `rejected`:
```sql
UPDATE information_fragment
SET status = 'rejected'
WHERE llm_run_id = $1
  AND status = 'proposed'
  AND id NOT IN (SELECT fragment_id FROM provenance WHERE fragment_id IS NOT NULL);
```
**Description:** A new `llm_run` row with the same `idempotency_key` is never created; orphan cleanup is by status transition.
**Error returned:** `409 BUSINESS_RUN_NOT_RETRYABLE` if not failed.

### BR-11 -- Only failed runs are retryable
**Related UC:** UC-06
**Where to validate:** service — the conditional `UPDATE ... WHERE status = 'failed'` of BR-10 plus a pre-read to distinguish "not found" (404) from "wrong status" (409).
**Description:** Re-running a `running` or `completed` run is rejected.
**Error returned:** HTTP 409 -- error.code: `BUSINESS_RUN_NOT_RETRYABLE` (registered).

### BR-12 -- Run summary is derived, never stored
**Related UC:** UC-04
**Where to validate:** repository — `getLlmRunById` runs two queries: one for the run row, one aggregating `tool_call`:
```sql
SELECT validation_outcome, count(*)::int AS n
  FROM tool_call WHERE llm_run_id = $1 GROUP BY validation_outcome;
```
The service zips the result into the eight `LlmRunSummary` fields, defaulting absent outcomes to 0.
**Description:** No `summary_*` columns on `llm_run`. Aligns with §5.4 / A9 ("state dependent on downstream rows is derived").
**Error returned:** None — read-only.

### BR-13 -- Layered validation order is fixed
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service. Each MCP `ingest` tool handler invokes the 5 layers in this exact order — `structural → graph rules → temporal → confidence → anti-hallucination`. The handler is implemented as a sequence of `await validateStructural(...); await validateGraphRules(...); ...` calls; each layer throws a typed `ValidationFailure` with the matching MCP error code. The top-level handler catches `ValidationFailure`, persists the `tool_call` row with `validation_outcome = 'rejected'`, and returns the MCP error envelope.
**Description:** Rejection is a business result, not an exception; layers must not short-circuit out of order (e.g., temporal checks must not run before graph rules pass).
**Error returned:** See BR-14..BR-17 for the per-layer code map.

### BR-14 -- Structural failures map to STRUCTURAL_INVALID / UNKNOWN_TYPE / NOT_FOUND
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service / structural layer. Zod parse failures, wrong references inside the run, and value-type mismatches all surface here.
**Description:**
- Missing/typed fields, value not parseable as `value_type`, cross-table compatibility (`key.node_type_id <> node.node_type_id`, chunk not in run's source) → `STRUCTURAL_INVALID`.
- `node_type` / `link_type` / `key` not in the seeded catalog (joined miss in `node_type`, `link_type`, `attribute_key`) → `UNKNOWN_TYPE`.
- Referenced `chunk_id` / `fragment_id` / `node_id` that resolves to no row → `NOT_FOUND`.
**Error returned:** MCP envelope `{ ok: false, error: { code: "STRUCTURAL_INVALID" | "UNKNOWN_TYPE" | "NOT_FOUND" } }`. `tool_call.validation_outcome = 'rejected'`.

### BR-15 -- Graph-rule failures map to RULE_VIOLATION
**Related UC:** UC-10
**Where to validate:** service / graph-rule layer. Query the active `link_type_rule` (`valid_to IS NULL OR valid_to > current_date`) for the `(source_node_type_id, link_type_id, target_node_type_id)` triple.
**Description:** The 22 seeded rules of §15.2 (`migrations/0002_seed.sql`) are the v1 authoritative set.
**Error returned:** MCP envelope `{ ok: false, error.code: "RULE_VIOLATION" }`. `tool_call.validation_outcome = 'rejected'`.

### BR-16 -- Temporal failures map to TEMPORAL_INCOHERENT / DATE_UNJUSTIFIED
**Related UC:** UC-10, UC-11
**Where to validate:** service / temporal layer.
**Description:**
- `valid_from >= valid_to` (semi-open `[from, to)` violated) → `TEMPORAL_INCOHERENT`.
- `change_hint = 'correction'` without an errata signal in any cited fragment's `text` → `TEMPORAL_INCOHERENT`.
- `link_type.requires_valid_from = true` and none of `stated` (in fragment text) / `document` (`metadata.document_date`) supplies a date, and the BFF cannot fall back to `received` for this type → `DATE_UNJUSTIFIED`.
**Error returned:** MCP envelope `{ ok: false, error.code: "TEMPORAL_INCOHERENT" | "DATE_UNJUSTIFIED" }`. `tool_call.validation_outcome = 'rejected'`.

### BR-17 -- Confidence routing
**Related UC:** UC-10, UC-11
**Where to validate:** service / confidence layer (A13). Constants in `modules/ingestion/validation/confidence.ts`: `CONFIDENCE_FLOOR = 0.40`, `CONFIDENCE_UNCERTAIN_UPPER = 0.75`.
**Description:**
- `confidence >= 0.75` → assertion `status = 'active'`.
- `0.40 <= confidence < 0.75` → assertion `status = 'uncertain'`.
- `confidence < 0.40` → the link/attribute is **not** created; the supporting fragments stay `proposed` and the retrieval layer renders them with a `low_confidence` flag. The `tool_call` records `validation_outcome = 'rejected'` with `result.reason = "BELOW_CONFIDENCE_FLOOR"`.
**Error returned:** Below floor: MCP envelope `{ ok: true, result: { outcome: "rejected", reason: "BELOW_CONFIDENCE_FLOOR" } }` — note this is an `ok: true` envelope because it is a business outcome, not an error. The matching `tool_call.validation_outcome` is `'rejected'`.

### BR-18 -- Every accepted assertion has provenance
**Related UC:** UC-10, UC-11
**Where to validate:** service / anti-hallucination layer (§13.5). In the same transaction that inserts `knowledge_link` or `node_attribute`, the service must insert at least one `provenance` row pointing to an `information_fragment` whose `fragment_source` chain anchors a `raw_chunk` of the current run's `input_raw_information_id`. The check is implemented as:
```sql
SELECT count(*) FROM information_fragment f
JOIN fragment_source fs ON fs.fragment_id = f.id
JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
WHERE f.id = ANY($1::uuid[]) AND rc.raw_information_id = $2;
```
If the count is less than `length($1)`, the transaction is aborted with `STRUCTURAL_INVALID` and the `tool_call` is recorded with `validation_outcome = 'rejected'`.
**Description:** No accepted link/attribute exists without provenance to a real fragment of the current run's source.
**Error returned:** MCP envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }`. `tool_call.validation_outcome = 'rejected'`.

### BR-19 -- One transaction per tool call
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service. Each MCP `ingest` handler opens exactly one transaction at entry, commits at the end of the success path, and rolls back on any thrown error (including `ValidationFailure`). The `tool_call` row is the only row that must be written even on a rollback — the handler therefore opens a **separate** short transaction to insert it after the rollback (BR-23).
**Description:** A run of N chunks that fails on chunk K keeps the K-1 already-accepted units.
**Error returned:** Not applicable (transactional pattern).

### BR-20 -- Entity creation is serialised by advisory lock
**Related UC:** UC-09
**Where to validate:** service (`propose_node` handler). Before the resolve-or-create branch, issue `SELECT pg_advisory_xact_lock(hashtextextended(node_type_id::text || '\x1F' || norm(name), 0))` (§4.5). The lock is automatically released at commit/rollback.
**Description:** Two concurrent `propose_node` calls for the same `(node_type, normalized name)` cannot create duplicate nodes.
**Error returned:** Not applicable (concurrency primitive; correctness covered by an acceptance test).

### BR-21 -- MCP `ingest` toolset only operates inside an active LLMRun
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** MCP transport — the `ingest` toolset is registered against an MCP session that already carries an ambient `llm_run_id`; the transport refuses to expose `propose_*` if the session has none. Service layer additionally verifies `llm_run.status = 'running'` at handler entry.
**Description:** Calls without an ambient run are rejected by the transport before reaching the handler, so no `tool_call` row is written (the only case where BR-23 is bypassed).
**Error returned:** MCP envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }`. **No `tool_call` row** (BR-23 exception).

### BR-22 -- The fragment text is bounded to 1000 characters
**Related UC:** UC-08
**Where to validate:** Zod schema on `propose_fragment.text` (`.max(1000)`) and DB `CHECK (char_length(text) <= 1000)`.
**Description:** Longer assertions are split into multiple atomic fragments by the LLM.
**Error returned:** MCP envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }`. `tool_call.validation_outcome = 'rejected'`.

### BR-23 -- ToolCall always records the call
**Related UC:** UC-08, UC-09, UC-10, UC-11
**Where to validate:** service — the MCP handler wraps the business transaction in a `try/finally`. The `finally` block opens a separate short transaction to insert the `tool_call` row with the verbatim arguments, the verbatim result envelope, and the `validation_outcome` produced by the handler (or `'error'` on uncaught exception). The only exception is BR-21 (no ambient run), where there is no `llm_run_id` to associate.
**Description:** Every reachable `ingest` invocation produces exactly one `tool_call` row.
**Error returned:** Not applicable (audit invariant).

---

## 4. State Machine (ST)

### ST-01 -- LLMRun lifecycle (ST-LR of `ingestion.spec.md` §5.1)

```
            ingestRawInformation
                    |
                    v
               [running] --close ok-----> [completed]   (terminal)
                    |
                    +--close err--> [failed]
                                       |
                                       +-- retryLlmRun (status='failed' AND advisory check) --> [running]
                                              (attempts += 1, finished_at -> NULL,
                                               orphan proposed fragments -> rejected)
```

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| (nothing) | running | `ingestRawInformation` creates a new run | `idempotency_key` is not already held by a `non-failed` run; advisory check before insert (§4.5 is for entity creation, not run creation — runs use the DB `UNIQUE` instead) | UC-01 |
| running | completed | close signal, no fatal error | service sets `finished_at = now()`, `status = 'completed'`; DB `CHECK (status='running') = (finished_at IS NULL)` enforces simultaneous update | UC-07 |
| running | failed | close signal, fatal error | service sets `finished_at = now()`, `status = 'failed'`; same DB CHECK | UC-07 |
| failed | running | `retryLlmRun` | atomic `UPDATE ... WHERE status = 'failed'`; in same TX orphan `proposed` fragments → `rejected` | UC-06 |
| completed | — | — | terminal — `retryLlmRun` returns `409 BUSINESS_RUN_NOT_RETRYABLE` (BR-11) | — |
| running | — | `retryLlmRun` while still running | rejected → `409 BUSINESS_RUN_NOT_RETRYABLE` (BR-11) | UC-06 alt 2b |

**Invalid transitions:** any transition from `completed` or `running` triggered by `retryLlmRun` is rejected at the service layer with `409 BUSINESS_RUN_NOT_RETRYABLE`. The DB `CHECK (status = 'running') = (finished_at IS NULL)` rejects any UPDATE that desyncs the two columns.

### ST-02 -- InformationFragment lifecycle (ST-IF of `ingestion.spec.md` §5.2)

```
   propose_fragment
         |
         v
   [proposed]  --provenance row written (consolidation cites fragment)--> [accepted]
         |
         +-- retry orphan / curation reject --> [rejected]
         |
         +-- never cited AND confidence < 0.40 -----> [proposed]  (stays, flagged low_confidence)
                                                        ^
                                                        +-- not a transition; surface-only flag

   [accepted] --re-extraction supersedes (out of scope here)--> [superseded]
   [any]      --compliance_delete (out of scope here)----------> [deleted]
```

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| (nothing) | proposed | `propose_fragment` (structural layer passes) | row + at least one `fragment_source` row written in the same TX | UC-08 |
| proposed | accepted | `propose_link` / `propose_attribute` consolidated/accepted with this fragment in its `fragment_ids` | a `provenance` row referencing this fragment is committed | UC-10, UC-11 |
| proposed | rejected | retry orphan cleanup (BR-10) OR curation reject (out of scope here) | for retry: status='proposed' AND no row in `provenance` for this fragment; reason recorded in `tool_call.result` (for retry it is implicit) or `curation_action` (curation) | UC-06 |
| proposed | proposed | `confidence < 0.40` AND never cited | stays `proposed`; retrieval surfaces it with `low_confidence` flag (BR-17). Not a state transition. | UC-10, UC-11 |
| accepted | superseded | newer run supersedes | out of scope here (graph-consolidation domain) | — |
| any | deleted | `compliance_delete` of the raw source | out of scope here (compliance domain) | — |

**Invalid transitions:** `proposed → superseded` (must go through `accepted` first), `rejected → accepted` (rejection is sticky; re-evaluation requires a new fragment). Both are enforced by the service layer; the DB does not encode a fragment status DAG.

---

## 5. Domain Events (EV)

> The Segundo Cérebro architecture does **not** include an event bus. Cross-domain coordination happens through synchronous service calls and through the database (the §16 observability surface is queried, not pushed). The single audit substrate is `tool_call` for MCP calls and (for future consolidation/curation domains) `curation_action`.

**N/A — no domain events in this version.** The four observability outcomes the §16 dashboard cares about (acceptance rate, consolidations, `needs_review`, `disputed`, `uncertain` / `low_confidence`, per-layer rejections) are all derived from `tool_call.validation_outcome` at read time (BR-12).

If a future domain (e.g. a notification surface) needs to react to ingestion outcomes, it must poll `tool_call` and `llm_run.status` — the database is the integration boundary, by spec (§2.2 "store único"; §13 "audit-first").

---

## 6. External Integrations

> Timeout and fallback required per integration. No fallback = operational risk — document the decision.

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Neon Auth (Stack Auth) | REST (JWT verify via JWKS) | Validate the bearer token on every REST and MCP call. The middleware `requireNeonAuth` fetches the JWKS from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA keys by default) and verifies the token signature; auth-as-gate semantics preserved (§2.5 of v7, A29). | 2 s per JWKS fetch, JWKS cached in-process for `NEON_AUTH_JWKS_TTL_S` seconds (default 600). | None — without a verifiable JWT, the request is rejected with `401 AUTH_UNAUTHORIZED`. Cache miss + network failure → `503 SYSTEM_SERVICE_UNAVAILABLE`. |
| PostgreSQL 17 (Neon) | TCP (`pg` pool, connection string `DATABASE_URL`, `sslmode=require`) | Store all rows of this domain; only state of the system (§2.2 of v7). Schema is unchanged from `migrations/0001_schema.sql` + `migrations/0002_seed.sql`. | Statement timeout: 10 s (default); 30 s on the `ingestRawInformation` route (long chunker runs on large content). Pool: min 2, max 10 connections per BFF instance. | None — PostgreSQL is the single store (§2.2). Outage → `500 SYSTEM_INTERNAL_ERROR` after retry-on-deadlock budget exhausted. Deadlock (`40P01`) is retried up to 3 times with exponential backoff (50 ms / 100 ms / 200 ms). |
| MCP transport | stdio / WebSocket (per MCP server config) | Surface the `ingest` toolset to the LLM (CLAUDE.md "MCP Server"). | Per-tool-call hard ceiling: 30 s (covers the §13 validation pipeline plus the consolidation transaction). | None at this layer — a slow tool call surfaces as MCP transport timeout to the LLM; the BFF nevertheless commits or rolls back the transaction on its own deadline. |

**No LLM provider integration in this domain.** The LLM lives upstream of the BFF (it calls the MCP tools); the BFF never originates LLM calls.

---

## 7. Known Technical Constraints

- **Single-instance assumption for advisory locks.** `pg_advisory_xact_lock` is database-scoped; horizontal scaling of the BFF is safe because the lock lives in Postgres, not in the process. Multi-database deployments would break BR-20 — out of scope, a single Neon project is the v1 topology.
- **No row-level security.** PostgreSQL RLS is disabled (A29). All authorization is enforced in the BFF middleware via Neon Auth JWT verification (`requireNeonAuth`). Direct database access bypassing the BFF (e.g. `psql` with the Neon connection string) is **not** access-controlled and is therefore restricted to operator break-glass — the `DATABASE_URL` secret never leaves the BFF process (CLAUDE.md "Security").
- **10 MiB body cap is per request, not per document.** Larger documents must be pre-split externally; this domain does not offer multi-part ingestion in v1.0.0.
- **Chunker is in-process, synchronous, single-threaded.** A 10 MiB document with extreme content (very long lines, dense PDF) can occupy an event-loop tick. The Fastify route inherits the BFF process priority — no worker-thread offload in v1.0.0 (§16 acceptance: ingestion is LLM-bound; chunker latency is dwarfed by LLM latency).
- **`Intl.Segmenter('pt')` requires Node.js built with full ICU.** Node 20 LTS official Linux x64 binaries ship full ICU; verify if the deployment image uses `node-slim`. Documented because BR-07 depends on it.
- **Catalog data (NodeType, LinkType, AttributeKey, LinkTypeRule) is read-only at runtime.** The seed in `migrations/0002_seed.sql` is the authoritative v1 set. Adding/removing/modifying entries requires a versioned migration (§12). The ingestion service caches the seed in-process at startup; cache invalidation requires a BFF restart after a migration.
- **`tool_call.arguments` and `tool_call.result` are stored verbatim.** Storage cost is proportional to total MCP traffic. At the §16 scale (hundreds of documents), the per-row footprint is small (< 4 KiB typical). No compression is configured; Postgres TOAST handles oversized rows transparently.
- **PostgreSQL `UNIQUE` violation detection relies on SQLSTATE `23505` and constraint name.** The service distinguishes `raw_information_content_hash_key` (idempotent path, BR-09) from `llm_run_idempotency_key_key` (logged + 500, BR-08) by inspecting `err.constraint`. A constraint rename in a future migration must be paired with the matching code change.
- **`unaccent()` is STABLE in Postgres.** Wrappers in generated columns and expression indexes must use `immutable_unaccent` (CLAUDE.md "Known Gotchas"). This domain uses none of those generated columns directly, but read paths that join `node_alias.alias_norm` (UC-09 entity resolution) must.
- **Neon Auth JWKS keys are EdDSA by default.** The middleware must declare EdDSA in the accepted algorithm list (e.g. `jose`'s `algorithms: ['EdDSA']`); rejecting unsupported algorithms is required to keep token validation tight (no `alg = none` accepted).

---

## 8. Out of Scope

- **Embeddings / vector search.** Permanent non-goal (§20.1, A24, CLAUDE.md "Anti-patterns"). No embedding column, no `pgvector`, ever.
- **Consolidation rules into the graph** (§6.5: succession / correction / conflict). UC-10 and UC-11 call into a future `graph-consolidation` module; their write-graph rules are referenced here only as the contract that ingestion exposes to the LLM.
- **Entity resolution algorithm** (§4 of v7). UC-09 calls into a future `entity-resolution` module; thresholds (A12), trigram index management and advisory lock semantics belong there.
- **Retrieval** (§7) — `search`, `traverse`, `get_node`, `get_history`, `get_provenance` belong to a future `retrieval` domain.
- **Curation** (§10) — `list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item` belong to a future `curation` domain.
- **Compliance deletion** (§11) — `compliance_delete` belongs to a future `compliance` domain. It is the only writer permitted to mutate `raw_information` rows post-creation (BR-02 carve-out).
- **System-time travel** (§5.3 query c, A25) — permanently deferred at this layer.
- **Multi-tenant / `User` entity** (§2.3, §20.3, A20) — permanent non-goal.
- **Catalog mutation API.** New `NodeType` / `LinkType` / `AttributeKey` rows enter through versioned SQL migrations only (§12).
- **Event bus / message queue.** No Kafka, RabbitMQ, etc. The database is the integration boundary (§2.2 "store único").
- **Rate limiting / quota.** Single-owner; no per-tenant quota required in v1.0.0. The 10 MiB body cap and the Postgres pool ceiling are the only back-pressure mechanisms.
- **Async ingestion / job queue.** `ingestRawInformation` is synchronous — chunker plus run-open finish inside the request. The LLM-driven extraction runs asynchronously upstream (driven by the LLM orchestrator calling the MCP tools), not by a BFF-managed worker.
- **Re-chunking of existing documents.** Bumping `chunking_version` requires a new migration and is not exposed at the API in v1.0.0 (BR-03).

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Back Spec Agent | initial | Initial back-end spec for the ingestion domain. Mirrors `ingestion.spec.md` v1.0.0 (23 BRs, 11 UCs, 2 state machines) into a Fastify + raw-`pg` implementation on PostgreSQL 17 (Supabase Cloud), aligned with CLAUDE.md and the v7 normative source. Tables owned: `raw_information`, `raw_chunk`, `llm_run`, `tool_call`, `information_fragment`, `fragment_source`. MCP `ingest` toolset documented at the contract level; UC-08..UC-11 delegate consolidation/entity-resolution to future domains. Error code `BUSINESS_RUN_NOT_RETRYABLE` was already registered in `docs/specs/_global/error-codes.md` by the spec.md author; no new entries added by this revision. | -- |
| 1.1.0 | 2026-06-12 | Back Spec Agent | update | Infrastructure swap: PostgreSQL 17 via Supabase Cloud → PostgreSQL 17 via Neon (driver `pg` raw, `DATABASE_URL`, `sslmode=require`); Supabase Auth JWT middleware → Neon Auth (Stack Auth) JWT middleware `requireNeonAuth` using JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA), cached for `NEON_AUTH_JWKS_TTL_S` seconds. Env vars `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_JWKS_TTL_S` removed. Schema unchanged; single-owner model unchanged; auth-as-gate semantics unchanged. Updated §1 (Auth row + new Database connection row), §6 (External Integrations rows for Neon Auth and PostgreSQL on Neon) and §7 (no-RLS note + new EdDSA-algorithm note). No BR / UC / ST changes. No new error codes. | migrate-neon |
