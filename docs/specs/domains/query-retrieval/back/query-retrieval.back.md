# Query / Retrieval -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 via Neon (driver `pg` raw, connection via `DATABASE_URL`) | Version: 1.3.0 | Status: draft | Layer: permanent
> Business spec: `../query-retrieval.spec.md`
> REST contract: `../openapi.yaml`
> MCP contract: `remember-modelagem-v7.md` §14.3 (toolset `query`, operations `search`, `get_provenance`)
> Schema: `migrations/0001_schema.sql` + `migrations/0002_seed.sql`

---

## 1. Stack and Patterns

> Declare only values that differ from or extend CLAUDE.md. Use `"CLAUDE.md default"` for aspects already covered there.

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves `openapi.yaml`) | CLAUDE.md default |
| MCP server | Same BFF process. This domain registers `search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment` on the **read-only MCP query transport** owned by `knowledge-graph` (`POST /api/v1/mcp/query` -- `knowledge-graph.back.md` BR-23). The two registrars (this domain + `knowledge-graph`) are composed at boot into one tool registry exposed by that single endpoint. Mirrored 1:1 in REST (`searchKnowledge`, `getProvenanceByLink` / `getProvenanceByAttribute` / `getProvenanceByFragment`); tool input Zod schemas are the same exports as the REST DTO Zod schemas. The pre-existing **ingest** transport `POST /api/v1/mcp` (owned by `ingestion`) is NOT used and NOT modified by this domain. | New (this domain). |
| ORM | None -- raw `pg` driver with parameterized queries (A6, §2.2). String concatenation of SQL is forbidden (CLAUDE.md "Security"). | CLAUDE.md default |
| Migration strategy | Versioned SQL files in `migrations/` (`0001_schema.sql`, `0002_seed.sql`). This domain owns **zero** migrations: full-text configurations (`pt_unaccent_v1`, `simple_unaccent_v1`), STORED `tsvector` columns and GIN indexes are all created by `0001_schema.sql`. Any future configuration change (e.g. `pt_unaccent_v2` with a synonym dictionary, ADR A4) lands as a new migration + full reindex; this domain never mutates schema at runtime. | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/query-retrieval/`. Three internal layers per module: `routes` (Fastify handlers + Zod request/response schemas) -> `service` (pipeline composition: query parse, layer fan-out, dedup, expansion, provenance assembly, ranking) -> `repository` (parameterized SQL against `information_fragment`, `node_alias`, `knowledge_node`, `raw_chunk`, `fragment_source`, `provenance`, `raw_information`, plus the views `knowledge_link_resolved` / `node_attribute_resolved`). Graph expansion (UC-01 step 6 / BR-06) delegates to the **shared service layer** of `knowledge-graph` (ADR A28 -- single core, two transports) rather than re-implementing BFS. | Aligned with CLAUDE.md `folder_structure: modules`. |
| Validation library | Zod v4 -- every REST DTO request/response has a Zod schema generated from the OpenAPI components. Failed Zod parse -> 422 with one of `VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE`. The Zod schemas for `query` (length, btrim non-empty), `layers[]` (enum), `expand_depth` (`int.min(1).max(3)`), `limit`/`offset` (range) front-stop the BFF before the DB call (BR-04 of this back spec / BR-15 of `.spec.md`). | CLAUDE.md default |
| Auth | Neon Auth (Stack Auth) JWT validated by a Fastify `preHandler` middleware (`requireNeonAuth`) on every route under `/api/v1/search` and `/api/v1/provenance/*`. JWKS fetched from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default) and cached in-process; TTL controlled by `NEON_AUTH_JWKS_TTL_S`. Single-owner -- no `User` entity, no role check (BR-16 of `.spec.md`, A20/A29). PostgreSQL RLS is not used; authorization is centralized in the BFF service layer. | CLAUDE.md default |
| Logging | `pino` structured JSON. Required fields per request: `request_id`, `route`, `actor = "owner"`, `outcome`, `latency_ms`. For `searchKnowledge`: also `query_length`, `parsed_tsquery_empty` (boolean), `layers_requested`, `expand`, `expand_depth`, `result_count`, `total`, `dedup_collapsed_count`, `expansion_hop_count`. For `getProvenanceBy*`: also `anchor_id`, `anchor_kind`, `fragment_count`, `tombstone_short_circuit` (boolean). The raw `query` string is **not** logged at INFO -- it can carry PII (operator-typed search terms). It is sampled at DEBUG only when explicitly enabled. The `value` and `text` columns of fragments / chunks are **never** logged. | CLAUDE.md default |
| Observability | `observability_required: true`. Per-route latency histograms emitted to the pino transport: `searchKnowledge` (separated by `expand=true`/`expand=false`), `getProvenanceByLink`, `getProvenanceByAttribute`, `getProvenanceByFragment`. p95 budgets per `.spec.md` BR-17 / CLAUDE.md "Performance Budgets / Backend". Counters: `parsed_tsquery_empty_total` (BR-15 / cenario C5 calibration), `tombstone_short_circuit_total` (compliance feedback loop), `expansion_hop_distribution` (histogram by hop). | CLAUDE.md default |
| Transaction policy | Read-only domain -- every route uses the existing `withReadOnly(pool, ...)` helper (`BEGIN READ ONLY` ... `COMMIT`), shared with `knowledge-graph`. `searchKnowledge` wraps in one transaction (a) the three full-text SQL queries, (b) the dedup join against `fragment_source`, (c) the graph-expansion call into `knowledge-graph`, (d) the provenance assembly join. The single transaction guarantees a stable `current_date` / `now()` snapshot across all derived fields (`is_current`, `is_in_effect`, `effective_status`). `getProvenanceBy*` runs one statement and does not need an explicit transaction. **MCP tool dispatch uses the same `withReadOnly` helper** -- each tool call opens its own short read-only transaction on a dedicated pool client and releases on completion (BR-23 of `knowledge-graph.back.md`; BR-23 below). MCP tool calls do NOT write `tool_call` audit rows -- audit is the ingest-side rule of `ingestion.back.md` BR-23 and is scoped to LLM writes. | New (this domain). |
| Concurrency | None of the endpoints write; no advisory locks, no `FOR UPDATE`. Concurrent calls are serialised only by the Postgres connection pool. The three full-text SQL queries of step 2 (UC-01) are issued **sequentially** on a single connection inside the transaction -- not in parallel across connections -- so the transaction snapshot remains intact. Sequential issue is acceptable because, at v1 scale (§16), each layer query lives in the single-digit milliseconds. | New (this domain). |
| Time source | `now()` and `current_date` are taken from PostgreSQL -- never `Date.now()` in business code. Derived fields (`is_current`, `is_in_effect`, `effective_status`) are computed inside the SQL views and surfaced as-read (BR-10 of `.spec.md`, A9). The `as_of` parameter is bound as a PostgreSQL `date` placeholder; the BFF never serialises it. | CLAUDE.md default |
| Catalog cache | Reuses the same in-process catalog map as `knowledge-graph` (`link_type.name -> id`). Lookup feeds BR-15's `expand_link_types[]` validation (`BUSINESS_UNKNOWN_LINK_TYPE` -- BR-03 of this back spec). Cache invalidated only by process restart (catalog mutates by migration, BR-10 of `knowledge-graph.back.md`). The `query-retrieval` module does NOT load its own catalog -- it imports the `knowledge-graph` catalog accessor (ADR A28 single-core). | New (this domain). |
| Pagination | Offset/limit only on `searchKnowledge` (per `openapi.yaml`). Default `limit = 20`, hard cap `limit = 100` (BR-18 of `.spec.md`). `total` is computed by a separate `count(*)` query inside the same transaction (no cursor; the result set is small at v1 scale per §16). `getProvenanceBy*` endpoints are unpaginated -- the chain is bounded by the number of fragments cited by a single link/attribute, which is small (consolidation cap by re-affirmation, §18). | New (this domain). |
| REST response envelope | Every 2xx success body served by this domain's REST surface is sent as `reply.status(200).send({ ok: true, result: <payload> })` -- the same literal style used by the chat module. The error path is **unchanged** (`mapErrorToHttpResponse` already wraps every 4xx/5xx as `{ ok: false, error: { code, message, details? } }`). A single discriminator `body.ok` covers both halves of the contract; the SPA's shared `lib/http.ts` parser requires `body.ok === true` on 2xx. Mirrors `.spec.md` BR-19 (envelope) and is enforced by BR-26 of this back spec. The **MCP query transport** path is out of scope -- it calls the service layer directly and renders outcomes as MCP 2025-06-18 `content` / `isError` per BR-23 / BR-24 of this back spec; the `{ ok, result }` wrap is REST-only. | New v1.3.0 (this domain). |
| Testing | Vitest unit tests on (i) the `parseSearchQuery` helper (BR-15: empty after btrim, length cap, empty parsed `tsquery`), (ii) the three-layer SQL builder (BR-01, BR-02 of `.spec.md`: layer weights are constants, not literals), (iii) the dedup collapse against `fragment_source` (BR-04 of `.spec.md`), (iv) the graph-expansion delegation contract to `knowledge-graph` (BR-06 of `.spec.md`), (v) the temporal-filter composition for `as_of` / `in_effect_only` (BR-09, BR-10 of `.spec.md`), (vi) the Unicode code-point excerpt slicer (BR-12 of `.spec.md`, A22), (vii) the tombstone short-circuit (BR-14 of `.spec.md`). Acceptance scenarios C1, C11, C12, C13 and C16 of v7 §17 run against the BFF. | CLAUDE.md default |

---

## 2. Data Model

> This domain **reads only**; it writes nothing. All tables, indexes, views and full-text configurations listed below are CREATEd by `migrations/0001_schema.sql`. The columns relevant to this domain are reproduced verbatim from the schema. Writes for these tables belong to `ingestion`, `curation` and `compliance`.

### Table: raw_information (READ-ONLY here)

> Owner: `ingestion` (writes), `compliance` (tombstone). This domain reads it as the leaf of every provenance chain (UC-07, UC-08, UC-09).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Surfaced inside `ProvenanceRawInformation.id`. |
| source_type | source_type (enum) | NOT NULL | One of `pdf`, `email`, `ata`, `chat`, `artigo`, `transcricao`, `outro`. Surfaced inside `ProvenanceRawInformation.source_type`. |
| content | text | NOT NULL | Full document body. **NOT surfaced** by this domain; only the chunk-level `excerpt` is returned. After `compliance_delete`, `content` is `''` and `status = 'deleted'` (tombstone). |
| storage_ref | text | NULL allowed | Reserved -- not used in v1. |
| content_hash | text | NOT NULL UNIQUE, CHECK `~ '^[0-9a-f]{64}$'` | SHA-256 hex of `content`. Idempotency anchor (§8). Not surfaced. |
| received_at | timestamptz | NOT NULL, DEFAULT `now()` | Surfaced inside `ProvenanceRawInformation.received_at` and in `SearchProvenanceEntry.received_at`. |
| metadata | jsonb | NOT NULL, DEFAULT `'{}'::jsonb` | Holds `title`, `author`, `document_date` (§6.5). Surfaced inside `ProvenanceRawInformation.metadata`. |
| status | (assumed -- see note below) | -- | The v7 normative source / `.spec.md` BR-14 reference a `RawInformation.status` of `'deleted'` set by `compliance_delete`. **Schema gap:** `migrations/0001_schema.sql` (lines 185-194) does **not** include a `status` column on `raw_information`. The tombstone is currently encoded by `compliance_deletion` row + `raw_information.content = ''`. The service layer of this domain MUST treat "tombstoned" as `EXISTS (SELECT 1 FROM compliance_deletion cd WHERE cd.raw_information_id = ri.id)` (see BR-14 of this back spec). A future migration may add `raw_information.status` to align with the spec; this back spec deliberately codes against the **current schema** to remain executable. |

> **Schema-vs-spec gap (audit trail):** the `.spec.md` (UC-07, BR-14) calls out `raw_information.status = 'deleted'`; the migration models the tombstone via the `compliance_deletion` table joined to a content-nulled `raw_information`. This back spec resolves the gap in favour of the migration -- BR-14 below uses `EXISTS compliance_deletion` as the short-circuit predicate. The single source of truth on resolution is the migration, per CLAUDE.md "Database / Safety Rule" (schema changes require explicit user approval).

### Table: raw_chunk (READ-ONLY here)

> Owner: `ingestion`. This domain reads it for direct full-text hits (UC-01 step 4 chunk layer) and for `excerpt` slicing inside every provenance walk.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Surfaced inside `ProvenanceChunk.id`. |
| raw_information_id | uuid | NOT NULL, FK -> `raw_information(id)` | Parent document. |
| chunk_index | int | NOT NULL, CHECK `>= 0` | 0-based position. Schema column **was renamed** from spec name `index` (SQL keyword -- CLAUDE.md "Known Gotchas"). Surfaced as `ProvenanceChunk.chunk_index`. |
| text | text | NOT NULL | Chunk body. The substring `text[offset_start:offset_end)` is the basis for every `excerpt` returned by this domain. Code-point indexed (BR-12 of `.spec.md`, A22). |
| offset_start | int | NOT NULL, CHECK `>= 0` | 0-based, inclusive. Surfaced as `ProvenanceChunk.offset_start`. |
| offset_end | int | NOT NULL, CHECK `offset_end > offset_start` | 0-based, **exclusive** (semi-open `[start, end)`, §5.2 / A7 / DB CHECK `raw_chunk_offsets_ck`). Surfaced as `ProvenanceChunk.offset_end`. |
| locator | jsonb | NULL allowed | Per-source-type citation hint (§A23): `{page}` for pdf, `{speaker, ts}` for transcricao. Surfaced as `ProvenanceChunk.locator`. |
| chunking_version | text | NOT NULL, DEFAULT `'v1'` | Versioning of the chunking strategy. Coupled to the offset convention -- changing it requires a coordinated read-path change (CLAUDE.md "Known Gotchas"). Not surfaced (only `v1` exists). |
| text_search | tsvector | GENERATED ALWAYS STORED `to_tsvector('pt_unaccent_v1', text)` | Stored tsvector for the chunk layer. Indexed by `raw_chunk_fts_idx` (GIN). Used by `searchKnowledge` chunk-layer SQL with score multiplier 0.6 (BR-02 of `.spec.md`). |

### Table: information_fragment (READ-ONLY here)

> Owner: `ingestion` (writes), `curation` (status transitions). This domain reads it as (a) the fragment layer of the search pipeline, (b) the leaf of every provenance entry, (c) the anchor of `getProvenanceByFragment`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Surfaced as `SearchItem.id` (when `kind = 'fragment'`) and `ProvenanceFragment.id`. |
| llm_run_id | uuid | NOT NULL, FK -> `llm_run(id)` | The LLMRun that proposed the fragment. Not surfaced here (auditing belongs to `compliance-audit`). |
| text | text | NOT NULL, CHECK `char_length <= 1000` | Fragment text. Surfaced as `ProvenanceFragment.text`, `SearchProvenanceEntry.fragment_text`, and `SearchItem.summary` when `kind = 'fragment'`. |
| confidence | numeric | NOT NULL, CHECK `[0, 1]` | LLM confidence. Surfaced as `ProvenanceFragment.confidence` and `SearchProvenanceEntry.confidence`. Drives the `low_confidence` flag (BR-08 of this back spec). |
| status | fragment_status (enum) | NOT NULL, DEFAULT `'proposed'` | One of `proposed`, `accepted`, `rejected`, `deleted`. **Only `accepted` is indexed by the partial GIN `information_fragment_fts_idx WHERE status = 'accepted'`** (BR-05 of `.spec.md`). |
| text_search | tsvector | GENERATED ALWAYS STORED `to_tsvector('pt_unaccent_v1', text)` | Stored tsvector for the fragment layer. Used by `searchKnowledge` fragment-layer SQL with score multiplier 1.0 (BR-02 of `.spec.md`). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Tie-breaker key for `searchKnowledge` (BR-07 of `.spec.md` -- `recorded_at` DESC; for fragments the analogue is `created_at`). |

### Table: fragment_source (READ-ONLY here)

> Owner: `ingestion`. Many-to-many link between fragments and their supporting chunks. This domain reads it for the dedup collapse (UC-01 step 5) and for the chunk chain of every provenance walk.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| fragment_id | uuid | NOT NULL, FK -> `information_fragment(id)`, **PART OF PK** `(fragment_id, raw_chunk_id)` | The fragment. |
| raw_chunk_id | uuid | NOT NULL, FK -> `raw_chunk(id)`, **PART OF PK** | The chunk that supports the fragment. By `propose_fragment` contract (§14.1) every accepted fragment has at least one row here. |

### Table: node_alias (READ-ONLY here)

> Owner: `ingestion` / `curation`. This domain reads it for the node-alias layer of the search pipeline (UC-01 step 4 node layer).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Not surfaced (the search returns the parent node's id, not the alias id). |
| node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | Owning node -- becomes `SearchItem.id` when `kind = 'node'`. |
| alias | text | NOT NULL, CHECK `btrim(alias) <> ''` | Surface form of the name. Tokenized at query time with `to_tsvector('simple_unaccent_v1', alias)` (no STORED tsvector -- the alias is small, BR-01 of `.spec.md`). |
| alias_norm | text | NOT NULL, GENERATED ALWAYS STORED `norm(alias)` | Normalized form (BR-01 of `.spec.md`). Used by `ingestion`'s entity resolver (BR-03 of `.spec.md`); the search pipeline does **not** issue trigram queries against it (BR-03 of `.spec.md`). |
| kind | alias_kind (enum) | NOT NULL, DEFAULT `'alias'` | `canonical` or `alias`. The search pipeline surfaces hits without distinguishing kind; the canonical name is fetched separately for `SearchItem.summary` (UC-01 step 7). |
| created_by_run_id | uuid | NULL allowed | Not surfaced. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Not surfaced. |

### Table: knowledge_node (READ-ONLY here)

> Owner: `ingestion` / `curation`. This domain reads it (a) to resolve a `node_alias` hit to its parent node, (b) to compute `SearchItem.summary` via `canonical_name`, (c) to drop merged/deleted endpoints (BR-12 of this back spec / step 4 of UC-01).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Surfaced as `SearchItem.id` for `kind = 'node'`. |
| node_type_id | uuid | NOT NULL, FK -> `node_type(id)` | Not surfaced by this domain. |
| canonical_name | text | NOT NULL | Surfaced as `SearchItem.summary` when `kind = 'node'`; appears inside the link summary template for `kind = 'link'`. |
| status | node_status (enum) | NOT NULL, DEFAULT `'active'` | One of `active`, `needs_review`, `merged`, `deleted` (BR-16 of `knowledge-graph.spec.md`). The node-alias layer SQL filters `status NOT IN ('merged', 'deleted')` (path compression handled by `knowledge_link_resolved` during expansion). |
| merged_into_node_id | uuid | NULL allowed, FK -> `knowledge_node(id)` | When `status = 'merged'`, the path-compressed survivor (CLAUDE.md "Known Gotchas" -- always ACTIVE). |
| created_at | timestamptz | NOT NULL | Not surfaced. |
| updated_at | timestamptz | NOT NULL | Not surfaced. |

### Table: provenance (READ-ONLY here)

> Owner: `ingestion`. This domain reads it as the spine of every `getProvenanceByLink` / `getProvenanceByAttribute` walk and as the source of `SearchProvenanceEntry` entries for `kind = 'link'`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Primary key. Not surfaced (the response groups by `fragment_id`). |
| link_id | uuid | NULL allowed, FK -> `knowledge_link(id)` | Exactly one of `link_id` / `attribute_id` is NOT NULL (DB CHECK `provenance_target_ck`). Read in `getProvenanceByLink`. |
| attribute_id | uuid | NULL allowed, FK -> `node_attribute(id)` | Read in `getProvenanceByAttribute`. |
| fragment_id | uuid | NOT NULL, FK -> `information_fragment(id)` | The fragment that justifies the link/attribute. Joined to surface the provenance entry. |
| created_at | timestamptz | NOT NULL | Not surfaced. |

### Table: knowledge_link (READ-ONLY here; surfaced via `knowledge_link_resolved`)

> Owner: `ingestion` / `curation`. This domain reads it only **transitively** -- (a) `getProvenanceByLink` checks the link exists by `id`, (b) the expansion step in `searchKnowledge` reads `knowledge_link_resolved` via the `knowledge-graph` shared service. The schema is reproduced in `knowledge-graph.back.md` and is not duplicated here. The fields touched by this domain are `id` (anchor for provenance), `recorded_at` (tie-breaker for ranking, BR-07 of `.spec.md`), and `status` (filter `status NOT IN ('superseded', 'deleted')` -- BR-08 of `.spec.md`).

### Table: node_attribute (READ-ONLY here; surfaced via `node_attribute_resolved`)

> Owner: `ingestion` / `curation`. This domain reads it only as the anchor of `getProvenanceByAttribute`; attributes are **not** a search-result `kind` (`SearchKind` enum: `node | link | fragment`; `attribute` is excluded -- see `.spec.md` glossary). Surfaced fields touched: `id` (anchor), `recorded_at` (informational, not currently exposed).

### View: knowledge_link_resolved (READ-ONLY)

> Shared with `knowledge-graph`. Used by the expansion step of `searchKnowledge` via the `knowledge-graph` shared service. Derived fields (`is_current`, `is_in_effect`, `effective_status`) drive the `as_of` / `in_effect_only` filters of UC-02 and UC-04. The view definition is the single source of truth (BR-10 of `.spec.md`, A9); this domain never recomputes the derivation in TypeScript.

### View: node_attribute_resolved (READ-ONLY)

> Same as above for attributes; surfaced only inside `getProvenanceByAttribute` joins (not as a direct search-result row).

### Table: compliance_deletion (READ-ONLY here)

> Owner: `compliance`. This domain reads it as the tombstone predicate for BR-14 of `.spec.md` (provenance walks return 410 when ANY underlying `raw_information` is referenced by a `compliance_deletion` row). The presence of a row here is the canonical "raw is tombstoned" signal under the current schema (see "Schema-vs-spec gap" note on `raw_information`).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | Primary key. Not surfaced. |
| raw_information_id | uuid | NOT NULL, FK -> `raw_information(id)` | The tombstoned document. Used in the EXISTS-predicate of BR-14. |
| performed_at | timestamptz | NOT NULL, DEFAULT `now()` | Surfaced as `details.deleted_at` of the 410 envelope (per OpenAPI examples). |
| reason | text | -- | Audit-only; not surfaced. |

### Indexes (read-side)

> Justify each index with the query it optimizes. All listed indexes are CREATEd by `migrations/0001_schema.sql`; this domain adds **no new indexes** (read-only by spec). Every FK on the surface has its own index (CLAUDE.md "Conventions").

| Table | Fields | Type | Justification |
|-------|--------|------|---------------|
| raw_chunk | `text_search` (`raw_chunk_fts_idx`) | GIN | UC-01 chunk-layer SQL: `WHERE text_search @@ websearch_to_tsquery('pt_unaccent_v1', $1)`. Layer-weighted score 0.6 (BR-02 of `.spec.md`). |
| information_fragment | `text_search WHERE status = 'accepted'` (`information_fragment_fts_idx`) | GIN partial | UC-01 fragment-layer SQL: `WHERE text_search @@ ...`. The partial WHERE enforces BR-05 of `.spec.md` at the index level -- non-accepted fragments are invisible. Layer weight 1.0 (BR-02 of `.spec.md`). |
| node_alias | `to_tsvector('simple_unaccent_v1', alias)` (`node_alias_fts_idx`) | GIN | UC-01 node-layer SQL: `WHERE to_tsvector('simple_unaccent_v1', alias) @@ websearch_to_tsquery('simple_unaccent_v1', $1)`. Layer weight 0.9 (BR-02 of `.spec.md`). |
| node_alias | `alias_norm gin_trgm_ops` (`node_alias_norm_trgm_idx`) | GIN trigram | **Not used by `searchKnowledge`** (BR-03 of `.spec.md` -- pg_trgm is scoped to entity resolution). Kept here for completeness; consumed by `ingestion`. |
| fragment_source | PK `(fragment_id, raw_chunk_id)` | btree | UC-01 step 5 dedup join (`SELECT fragment_id FROM fragment_source WHERE raw_chunk_id IN (...)`). |
| fragment_source | `raw_chunk_id` (`fragment_source_chunk_idx`) | btree | Reverse lookup for the chunk-anchored side of dedup. |
| provenance | `link_id` (`provenance_link_idx`) | btree | UC-07 anchor lookup; SearchItem provenance assembly for `kind = 'link'`. |
| provenance | `attribute_id` (`provenance_attr_idx`) | btree | UC-08 anchor lookup. |
| provenance | `fragment_id` (`provenance_fragment_idx`) | btree | Reverse-direction joins when assembling provenance for node hits (UC-01 step 7: union of provenances of matching aliases' supporting fragments). |
| knowledge_node | `merged_into_node_id` (`knowledge_node_merged_idx`, partial WHERE NOT NULL) | btree | Path compression at the node-layer SQL (`status NOT IN ('merged', 'deleted')`) and during expansion (delegated to `knowledge-graph`). |
| raw_chunk | (FK) `raw_information_id` | btree (FK index) | Join chunk -> raw_information in every provenance walk. |
| information_fragment | (FK) `llm_run_id` (`information_fragment_run_idx`) | btree | Not used by retrieval (used by audit). |
| compliance_deletion | `raw_information_id` (`compliance_deletion_raw_idx`) | btree | BR-14 EXISTS-predicate -- `WHERE cd.raw_information_id IN (<chain raws>)`. |

> No new indexes are created for v1.0.0. The pre-existing index set is sufficient for the read patterns surfaced by `openapi.yaml`. Adding any index requires a new migration (CLAUDE.md "Safety Rule").

### Relationships

> FK + on-delete strategy. Cross-domain: via ID only -- never nested objects. All FKs on tables read by this domain use `NO ACTION` -- the data model is immutable + tombstone-based (CLAUDE.md "Anti-patterns / Data": `RawInformation` is never altered or deleted except via `compliance_delete`; cascades would defeat audit).

| From | To | Type | FK | On Delete |
|------|----|------|----|-----------|
| raw_chunk.raw_information_id | raw_information.id | N : 1 | `raw_chunk_raw_information_id_fkey` | NO ACTION -- raws are tombstoned, not deleted. |
| fragment_source.fragment_id | information_fragment.id | N : 1 | `fragment_source_fragment_id_fkey` | NO ACTION -- fragments are never row-deleted; lifecycle is `proposed -> accepted | rejected | deleted` via `status`. |
| fragment_source.raw_chunk_id | raw_chunk.id | N : 1 | `fragment_source_raw_chunk_id_fkey` | NO ACTION. |
| information_fragment.llm_run_id | llm_run.id | N : 1 | `information_fragment_llm_run_id_fkey` | NO ACTION -- audit chain is immutable. |
| node_alias.node_id | knowledge_node.id | N : 1 | `node_alias_node_id_fkey` | NO ACTION -- tombstone semantics. |
| provenance.link_id | knowledge_link.id | N : 1 | `provenance_link_id_fkey` | NO ACTION. |
| provenance.attribute_id | node_attribute.id | N : 1 | `provenance_attribute_id_fkey` | NO ACTION. |
| provenance.fragment_id | information_fragment.id | N : 1 | `provenance_fragment_id_fkey` | NO ACTION. |
| compliance_deletion.raw_information_id | raw_information.id | N : 1 | `compliance_deletion_raw_information_id_fkey` | NO ACTION -- the deletion record itself outlives the content. |

**No CASCADE anywhere.** Lineage is immutable; cascades would silently destroy audit chains and contradict the §13 anti-hallucination guarantee.

---

## 3. Business Rules (BR)

> Every BR references at least one UC of `query-retrieval.spec.md`. The numbering here is independent from `.spec.md` (which carries its own BR-01..BR-18 expressing business invariants); this section translates the read-side concerns into the validation layer that enforces them and the error code returned on violation.

### BR-01 -- All endpoints require a valid Neon Auth JWT
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09
**Where to validate:** middleware -- the same `requireNeonAuth` Fastify `preHandler` used by `knowledge-graph` is mounted on `/api/v1/search` and `/api/v1/provenance/*`. JWKS fetched from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default) and cached in-process with TTL `NEON_AUTH_JWKS_TTL_S`; verification happens **before** any DB access (BR-16 of `.spec.md`, A29, cenario C16).
**Description:** Missing header -> `AUTH_UNAUTHORIZED`. Malformed/unsignable token -> `AUTH_TOKEN_INVALID`. Expired `exp` -> `AUTH_TOKEN_EXPIRED`. Database credentials (`DATABASE_URL`) and Neon Auth configuration never leave the BFF.
**Error returned:** HTTP 401 -- error.code: `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` (all registered, base catalog).

### BR-02 -- Path UUIDs are syntactically validated before DB lookup
**Related UC:** UC-07, UC-08, UC-09
**Where to validate:** routes -- Zod schema with `z.string().uuid()` on each path parameter (`{link_id}`, `{attribute_id}`, `{fragment_id}`). Failure surfaces before the controller runs.
**Description:** A path segment that does not parse as a UUID v4/v7 short-circuits to a 422; no SQL is issued.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT` (registered).

### BR-03 -- `expand_link_types[]` query elements must each exist in the catalog
**Related UC:** UC-01, UC-02, UC-03
**Where to validate:** service -- before expansion, the service iterates `expand_link_types[]` and resolves each to a `link_type_id` via the shared in-memory catalog cache (Stack section). The first miss aborts with 422 carrying the offending name in `details.link_type`. Ignored entirely when `expand=false`.
**Description:** Validation precedes the expansion call; an unknown name fails the request before any traversal SQL is issued.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_UNKNOWN_LINK_TYPE` (registered, Knowledge Graph table -- reused per `.spec.md` BR-15).

### BR-04 -- Search-input pre-conditions are clamped at the route layer
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06
**Where to validate:** routes -- Zod schema on `searchKnowledge` parameters:
- `query`: `z.string().min(1).max(1000).transform(s => s.trim()).refine(s => s.length > 0, { ... })`. Empty-after-trim -> 422 `BUSINESS_INVALID_SEARCH_QUERY`.
- `layers[]`: `z.array(z.enum(['fragment', 'node', 'chunk'])).optional()`. Non-enum value -> 422 `BUSINESS_INVALID_SEARCH_LAYER`.
- `as_of`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()`. Non-ISO -> 422 `VALIDATION_INVALID_FORMAT`.
- `in_effect_only`: `z.coerce.boolean().default(false)`.
- `include_uncertain`: `z.coerce.boolean().default(true)`.
- `expand`: `z.coerce.boolean().default(true)`.
- `expand_depth`: `z.coerce.number().int().min(1).max(3).default(1)`. Out-of-range -> 422 `BUSINESS_INVALID_TRAVERSE_DEPTH`.
- `expand_link_types[]`: `z.array(z.string()).optional()` (catalog check happens in service per BR-03).
- `limit`: `z.coerce.number().int().min(1).max(100).default(20)`. Out-of-range -> 422 `VALIDATION_OUT_OF_RANGE`.
- `offset`: `z.coerce.number().int().min(0).default(0)`. Out-of-range -> 422 `VALIDATION_OUT_OF_RANGE`.
**Description:** Pre-DB validation eliminates the entire class of "garbage query reached the engine"; the parameterized SQL never receives a value outside its declared bounds. Aligns with CLAUDE.md "Security / Forbidden patterns: SQL string concatenation".
**Error returned:** HTTP 422 -- error.codes: `BUSINESS_INVALID_SEARCH_QUERY`, `BUSINESS_INVALID_SEARCH_LAYER`, `BUSINESS_INVALID_TRAVERSE_DEPTH`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE` (all registered).

### BR-05 -- Parsed `tsquery` must be non-empty
**Related UC:** UC-01, UC-05
**Where to validate:** service -- the route-layer Zod check (BR-04) catches empty-after-trim and length cap; but `websearch_to_tsquery` can still produce an empty `tsquery` for inputs containing only stopwords (e.g., `"o a de"`) or only operators (e.g., `"OR -"`). The service issues `SELECT websearch_to_tsquery('pt_unaccent_v1', $1)::text AS q` against Postgres; when the result equals `''` the request short-circuits to 422 `BUSINESS_INVALID_SEARCH_QUERY` with `details = { query, parsed: '' }`.
**Description:** This is the second of the two anti-empty guards (BR-15 of `.spec.md`); needed because Zod cannot anticipate the stemmer's behaviour. The check is a single ~1ms statement and is run **before** the three-layer SQL fan-out to avoid issuing three zero-row queries.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_INVALID_SEARCH_QUERY` (registered).

### BR-06 -- Full-text uses two named, versioned configurations
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06
**Where to validate:** repository -- two named constants (`FTS_PROSE_CONFIG = 'pt_unaccent_v1'`, `FTS_NAME_CONFIG = 'simple_unaccent_v1'`) live in `modules/query-retrieval/repository/fts-config.ts`. Both SQL builders interpolate these as **identifier-safe literals** (the values are hardcoded compile-time strings, never request data). The fragment / chunk SQL use `pt_unaccent_v1`; the node-alias SQL uses `simple_unaccent_v1` (BR-01 of `.spec.md`, ADR A2 / A15).
**Description:** A future synonym dictionary (`pt_unaccent_v2`, ADR A4) is activated by changing these constants + running the migration; the code path is unaware. Zero runtime branching on config name.
**Error returned:** Not applicable (architectural invariant).

### BR-07 -- Layer weights are constants `LAYER_WEIGHT_FRAGMENT = 1.0`, `LAYER_WEIGHT_NODE = 0.9`, `LAYER_WEIGHT_CHUNK = 0.6`
**Related UC:** UC-01, UC-03
**Where to validate:** repository -- the three SQL builders multiply `ts_rank_cd(...)` by the respective constant **outside** the SQL string (the constant is a JS number bound as a query parameter `$2`/`$3`/...). Calibration = changing the three constants in `modules/query-retrieval/repository/scoring.ts`; no SQL rewrite (BR-02 of `.spec.md`, ADR A15).
**Description:** Constants are typed `as const`; tests assert they remain in the documented order (`fragment > node > chunk`).
**Error returned:** Not applicable.

### BR-08 -- `flags[]` are derived from row state, never queried
**Related UC:** UC-01, UC-06
**Where to validate:** service -- after the SQL returns, the service iterates each consolidated row and computes `flags[]`:
- `status = 'uncertain'` -> append `"uncertain"`.
- `status = 'disputed'` -> append `"disputed"` (independent of `include_uncertain`).
- `kind = 'fragment'` AND `confidence < 0.40` AND `status = 'accepted'` -> append `"low_confidence"` (cenario C13; the fragment was promoted by corroboration but the original confidence stayed low).
The `include_uncertain=false` filter is applied at the **SQL level** on the underlying `status` column (`AND status <> 'uncertain'`), never on the `flags` array (which is post-SQL). This mirrors `knowledge-graph` BR-21.
**Description:** Flags are cosmetic; the queryable predicate is `status`. Returning the same row with or without the `uncertain` flag depending on URL parameters would create a non-deterministic API.
**Error returned:** Not applicable.

### BR-09 -- Search returns only `status IN ('active', 'uncertain', 'disputed')` for graph rows and `'accepted'` for fragments
**Related UC:** UC-01, UC-06
**Where to validate:** repository -- the three layer SQLs and the expansion SQL all carry explicit `WHERE` clauses:
- fragment layer: implicit -- partial GIN index `WHERE status = 'accepted'` (DB schema BR-05 of `.spec.md`).
- node-alias layer: `AND kn.status NOT IN ('merged', 'deleted')` joined to `knowledge_node`.
- chunk layer: implicit -- chunks have no status; the dedup step (BR-10) elides chunks not anchoring an accepted fragment.
- expansion (delegated to `knowledge-graph`): `AND status NOT IN ('superseded', 'deleted')` on `knowledge_link` and `knowledge_node`.
**Description:** Rows with `status IN ('superseded', 'deleted')` are NEVER returned by `search`; the history is reachable only via `knowledge-graph` `getLinkHistory` / `getAttributeHistory` (BR-08 of `.spec.md`).
**Error returned:** Not applicable.

### BR-10 -- Fragment-chunk dedup is structural, not score-based
**Related UC:** UC-01, UC-03
**Where to validate:** service -- after the three layer queries return, the service builds:
- `F = Set<fragment_id>` from the fragment hits.
- `C = Set<raw_chunk_id>` from the chunk hits.
- one SQL: `SELECT fragment_id, raw_chunk_id FROM fragment_source WHERE raw_chunk_id = ANY($1) AND fragment_id = ANY($2)`.
For each row returned: the chunk is removed from the result set; the chunk's `(id, offset_start, offset_end, text)` is folded into the supporting fragment's `provenance[]` as a `SearchProvenanceEntry` (excerpt slice computed per BR-11). A chunk hit with no supporting fragment in `F` is **dropped** entirely (BR-04 of `.spec.md` -- never surface raw-chunk text without the fragment lens).
**Description:** Dedup is one batched SQL; no N+1. The collapse predates ranking, so the final list never carries a chunk row.
**Error returned:** Not applicable.

### BR-11 -- Excerpts use Unicode code-point indexing
**Related UC:** UC-01, UC-06, UC-07, UC-08, UC-09
**Where to validate:** repository -- `excerpt` is computed in **SQL** via `substring(rc.text from rc.offset_start + 1 for rc.offset_end - rc.offset_start)`. PostgreSQL's `substring(string FROM start FOR length)` is 1-based, character-indexed (it treats the string as a sequence of characters per the database collation, not bytes); the +1 adjusts from the spec's 0-based convention (CLAUDE.md "Known Gotchas" -- same correction as `knowledge-graph` BR-16). When the offsets are computed in TypeScript (e.g., a unit test), the equivalent is `[...rc.text].slice(offset_start, offset_end).join('')` (BR-12 of `.spec.md`, A22). The `chunking_version` is `'v1'`; future versions that change the indexing convention require a coordinated read-path change.
**Description:** Off-by-one in the +1 adjustment is the most likely failure mode; the unit test in `repository/excerpt.test.ts` covers a chunk whose offsets span multi-byte Unicode characters (e.g., accented Latin, em-dash).
**Error returned:** Not applicable.

### BR-12 -- Node-alias hits resolve to a single canonical node row
**Related UC:** UC-01, UC-03
**Where to validate:** repository -- the node-alias SQL is:
```sql
SELECT kn.id AS node_id,
       kn.canonical_name,
       kn.status,
       ts_rank_cd(to_tsvector('simple_unaccent_v1', na.alias), $1) AS rank,
       array_agg(na.id) AS matched_alias_ids
FROM node_alias na
JOIN knowledge_node kn ON kn.id = na.node_id
WHERE to_tsvector('simple_unaccent_v1', na.alias) @@ $1
  AND kn.status NOT IN ('merged', 'deleted')
GROUP BY kn.id, kn.canonical_name, kn.status
ORDER BY rank DESC
LIMIT $2;
```
Multiple alias hits collapse onto the same `node_id` via `GROUP BY`. The `rank` reported is the **maximum** across matching aliases (`max(ts_rank_cd(...))` would be equivalent; the `GROUP BY` already keeps one row per node and the implicit row of the highest rank is used). The `matched_alias_ids` is kept for the provenance-assembly step (UC-01 step 7).

> **Node-hit provenance assembly (spec ↔ schema gap).** A `node_alias` hit has **no direct `Provenance` row** -- the schema attaches `Provenance` only to `knowledge_link` / `node_attribute` / `information_fragment`, never to a node. The read path therefore *synthesizes* the node hit's provenance: it surfaces the **accepted** fragments whose `text_search` matches the node's `alias_norm`, via `plainto_tsquery('pt_unaccent_v1', alias_norm)`. `plainto_tsquery` (not bare `to_tsquery`) is mandatory because `alias_norm` is free text -- a multi-word alias such as `rodrigo isensee` fed to `to_tsquery` raises `syntax error in tsquery` (the lexemes need an operator between them). A node hit whose synthesis yields zero accepted fragments has empty provenance and is **dropped** (the OpenAPI requires `provenance` `minItems: 1`, and BR-19 forbids returning an empty array). Consequence: a node becomes searchable only once at least one fragment citing it has reached `status = 'accepted'` -- i.e., after consolidation creates `Provenance` and the ingestion ST-IF promotes the fragment `proposed -> accepted` (`ingestion.spec.md` §5.2). The match is lexical-by-text, not a join, because `node_alias` carries no FK to the fragments that mention it.

**Description:** One node, one row, no duplicates regardless of how many aliases matched.
**Error returned:** Not applicable.

### BR-13 -- Graph expansion delegates to the shared `knowledge-graph` service
**Related UC:** UC-01, UC-02, UC-04
**Where to validate:** service -- when `expand=true`, after the three layer queries and the dedup step, the service collects every `node_id` whose row is in the result set (i.e., `kind = 'node'` hits from the node-alias layer). It invokes `knowledge-graph` `traverseNodes(nodeIds, { depth, direction: 'both', linkTypeIds, asOf, inEffectOnly })` -- a NEW internal method on the shared service layer (per ADR A28 single-core, two-transports) that batches the BFS for a list of starting nodes (the existing `traverseNode` accepts one id; the batched variant is additive and lives in `knowledge-graph/service`). Each returned `(link, hop, source_node_id)` triple is folded into the search result with `kind = 'link'`, `layer = 'node'`, `hop` from the call, and `score = TRAVERSAL_DECAY ** hop * <source_node_score>` where `TRAVERSAL_DECAY = 0.5` is the same constant as `knowledge-graph` BR-14 (ADR A16). Merged endpoints are substituted by their survivor inside the `knowledge-graph` service (BR-13 of `knowledge-graph.back.md`); deleted endpoints are skipped.
**Description:** No traversal SQL lives inside `query-retrieval`. A regression in the `knowledge-graph` traversal automatically updates the search behaviour -- one source of truth.
**Error returned:** Not applicable (errors bubble up from `knowledge-graph`; the surface is the same `BUSINESS_INVALID_TRAVERSE_DEPTH` of BR-04 -- already validated by Zod before the call).

### BR-14 -- Temporal filters compose at the repository layer
**Related UC:** UC-02, UC-04
**Where to validate:** repository -- the same `applyTemporalFilter` SQL helper used by `knowledge-graph` (BR-07, BR-08 of `knowledge-graph.back.md`) is reused for the expansion step (`knowledge_link_resolved` reads). For direct full-text hits on `fragment` and `chunk`, the temporal axis does not apply (`information_fragment` and `raw_chunk` carry no `valid_from`/`valid_to` -- they are anchored to documents, not to validity intervals); the filter is a **no-op** for those layers (UC-02 step 4 / UC-04 step 4 of `.spec.md`). The `in_effect_only=true` flag relies on the view-derived `is_in_effect` and substitutes `current_date` with `as_of` when both parameters are supplied (BR-10 of `.spec.md`).
**Description:** Read-path consistency -- the same temporal-filter implementation feeds `knowledge-graph` and `query-retrieval`; no drift.
**Error returned:** Not applicable.

### BR-15 -- Ranking and tie-breakers are deterministic
**Related UC:** UC-01
**Where to validate:** service -- after dedup + expansion + flag computation, the in-memory result list is sorted by `score DESC, recordedAtTs DESC, id ASC` (the `id ASC` is the final defensive tie-breaker for two rows sharing identical score and timestamp, since UUIDs are unique). `recordedAtTs` is `recorded_at` for links / attributes and `created_at` for fragments (BR-07 of `.spec.md`). Pagination is applied after sort -- `limit` / `offset` slice the array, and `total` is the array length before slicing.
**Description:** Two identical requests against an unchanged corpus MUST return rows in the same order; tests assert this.
**Error returned:** Not applicable.

### BR-16 -- 404 vs 410 vs `BUSINESS_FRAGMENT_NOT_ACCEPTED` on provenance walks
**Related UC:** UC-07, UC-08, UC-09
**Where to validate:** service -- the precedence is:
1. Row absent (no `knowledge_link` / `node_attribute` / `information_fragment` with the path id) -> 404 `RESOURCE_NOT_FOUND`.
2. (`getProvenanceByFragment` only) Row present but `status != 'accepted'` -> 404 `BUSINESS_FRAGMENT_NOT_ACCEPTED` (the partial GIN index of BR-05 of `.spec.md` makes non-accepted fragments invisible to search; the point-read enforces the same invariant).
3. Row present, chain assembled, any underlying `raw_information` carries a `compliance_deletion` row -> 410 `BUSINESS_RAW_INFORMATION_DELETED` (BR-17 below).
**Description:** The precedence is precise -- 410 is never returned when the row is absent (we never confirm that an id "used to exist" through 410); 404 `BUSINESS_FRAGMENT_NOT_ACCEPTED` is preferred over `RESOURCE_NOT_FOUND` to give the operator the actionable distinction (the fragment is in `proposed` / `rejected` / `deleted`, lifecycle owned by `ingestion` / `curation`).
**Error returned:** HTTP 404 -- error.code: `RESOURCE_NOT_FOUND` (registered); HTTP 404 -- error.code: `BUSINESS_FRAGMENT_NOT_ACCEPTED` (registered, Query-Retrieval table); HTTP 410 -- error.code: `BUSINESS_RAW_INFORMATION_DELETED` (registered, Query-Retrieval table).

### BR-17 -- Tombstone short-circuit uses `EXISTS compliance_deletion`
**Related UC:** UC-07, UC-08, UC-09
**Where to validate:** repository -- inside the same SQL that joins the chain (BR-18 below), a CTE precomputes the set of `raw_information_id` reached, and the query then asserts `NOT EXISTS (SELECT 1 FROM compliance_deletion cd WHERE cd.raw_information_id IN (<set>))`. If the EXISTS is `true`, the SQL returns a single row with a sentinel `tombstoned = true` column carrying the offending `raw_information_id` and `compliance_deletion.performed_at`; the service maps it to the 410 response (`details = { raw_information_id, deleted_at }`).
**Description:** We do **not** return partial chains. The check is one EXISTS at the SQL level -- no second round trip. Rationale: §11 says tombstoned content MUST NOT recirculate, even partially, even as "this id is fine, that other one was deleted".
**Error returned:** HTTP 410 -- error.code: `BUSINESS_RAW_INFORMATION_DELETED` (registered).

### BR-18 -- Provenance chain is assembled in one SQL per request
**Related UC:** UC-07, UC-08, UC-09
**Where to validate:** repository -- one SQL per request:
- `getProvenanceByLink`: `SELECT ... FROM provenance p JOIN information_fragment f ON f.id = p.fragment_id JOIN fragment_source fs ON fs.fragment_id = f.id JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id JOIN raw_information ri ON ri.id = rc.raw_information_id WHERE p.link_id = $1` (plus the EXISTS-tombstone CTE per BR-17).
- `getProvenanceByAttribute`: same, with `WHERE p.attribute_id = $1`.
- `getProvenanceByFragment`: `SELECT ... FROM information_fragment f JOIN fragment_source fs ON fs.fragment_id = f.id JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id JOIN raw_information ri ON ri.id = rc.raw_information_id WHERE f.id = $1` -- no `provenance` table (the input IS the fragment).
The `ProvenanceFragment` rows are grouped in the service layer; each fragment has `chunks[] (>= 1)` per the schema invariant (every accepted fragment has at least one `fragment_source` row). `excerpt` is computed in SQL (BR-11).
**Description:** No N+1. The CHECK constraint `provenance_target_ck` (exactly one of `link_id` / `attribute_id` is NOT NULL) is honored by issuing exactly one of the three SQL variants per endpoint.
**Error returned:** Not applicable.

### BR-19 -- Empty provenance is logged as an operational alarm
**Related UC:** UC-07, UC-08
**Where to validate:** service -- after assembling the response, if `fragments.length === 0` AND the anchor row exists (i.e., 404 was not raised by BR-16), pino emits a structured WARN with `{ route, anchor_kind, anchor_id }` and the response shape is still **structurally valid** -- but the OpenAPI declares `fragments` as `minItems: 1`. The service therefore promotes this case to a 500 `SYSTEM_INTERNAL_ERROR` (BR-13 of `.spec.md`: empty provenance is a legacy-data inconsistency reported as 500 during reconciliation). The operational fix is in `ingestion` / `curation`; this domain refuses to lie about the contract by returning an empty array.
**Description:** This is the only place where the read path translates a consistency violation into a 500. The alternative -- returning `fragments: []` -- breaks the OpenAPI contract.
**Error returned:** HTTP 500 -- error.code: `SYSTEM_INTERNAL_ERROR` (registered); structured WARN emitted with details for operator triage.

### BR-20 -- Database errors are mapped to consistent HTTP responses
**Related UC:** all
**Where to validate:** middleware -- the same Fastify error handler used by `knowledge-graph` maps `pg` errors:
- Connection error (`ECONNREFUSED`, `ETIMEDOUT`, `57P03` (`cannot_connect_now`)) -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.
- Statement timeout (`57014`) -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.
- Any other unhandled `pg` exception -> 500 `SYSTEM_INTERNAL_ERROR`.
**Description:** Single point that the OpenAPI 503 / 500 responses correspond to.
**Error returned:** HTTP 500 -- error.code: `SYSTEM_INTERNAL_ERROR`; HTTP 503 -- error.code: `SYSTEM_SERVICE_UNAVAILABLE` (both registered).

### BR-21 -- Pagination defaults align with the MCP `search` tool contract
**Related UC:** UC-01
**Where to validate:** routes -- Zod schema on `limit` (`int().min(1).max(100).default(20)`) and `offset` (`int().min(0).default(0)`). The defaults mirror the MCP tool of §14.3 (BR-18 of `.spec.md`, ADR A16) and the `traverseNode` defaults of `knowledge-graph` BR-19 -- the read surface is uniform.
**Description:** Bumping the cap requires an OpenAPI update and an explicit BR amendment.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_OUT_OF_RANGE` (registered).

### BR-22 -- Lexical retrieval is the final form; no semantic fallback
**Related UC:** UC-05
**Where to validate:** repository -- the SQL builders issue **only** lexical primitives: `websearch_to_tsquery` (user-query parsing, all three layers), `ts_rank_cd` (scoring), `plainto_tsquery` (node-hit provenance assembly only -- see BR-12) and trigram (the latter only for `ingestion`, not invoked here); there is no code path that calls an embedding model, a vector store, or `pgvector` (BR-11 of `.spec.md`, ADR A24). Any PR introducing such a call must be rejected at code review. A lexical zero-result (cenario C11) is a **success path**, returned as `200` with `total = 0`, `items = []`.
**Description:** Enforced by absence -- this domain has no embedding-client dependency, no vector-column read, no ANN library. Aligned with CLAUDE.md "Anti-patterns / Data".
**Error returned:** Not applicable (architectural invariant; zero results is HTTP 200).

### BR-23 -- MCP query tools register on the shared read-only transport
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09
**Where to validate:** registration -- `registerQueryRetrievalToolset(deps)` is a NEW exported function in `backend/src/modules/query-retrieval/mcp/query-toolset.ts` (new file). It is invoked at boot by the same bootstrap that calls `registerQueryToolset(...)` of `knowledge-graph` (BR-25 of `knowledge-graph.back.md`); the two registrars share the same `McpServer` instance hosted on `POST /api/v1/mcp/query` (the read-only transport defined in `knowledge-graph.back.md` BR-23). The tools registered by THIS domain are:
- `search` (UC-01) -- wraps the `searchKnowledge` service.
- `get_provenance_link` (UC-07) -- wraps `getProvenanceByLink`.
- `get_provenance_attribute` (UC-08) -- wraps `getProvenanceByAttribute`.
- `get_provenance_fragment` (UC-09) -- wraps `getProvenanceByFragment`.

Each tool's input Zod schema is the EXACT same module export as the REST DTO Zod schema; the JSON Schema published over `tools/list` is `z.toJSONSchema(<the same schema>)` pinned at registration time. The output is the service-layer return value (same JSON as the REST handler) wrapped by the MCP envelope `{ ok: true, result: <payload> }`. Each tool dispatch opens its own `withReadOnly(pool, ...)` transaction and releases on completion -- the same helper used by the REST routes.

The read-only MCP transport endpoint URL, JWT `preHandler`, audit-row policy (none), and `X-LLM-Run-Id` policy (NOT required, NOT inspected) are owned by `knowledge-graph.back.md` BR-23 -- this BR does not re-define them; it only enumerates the tools this domain contributes.
**Description:** The two registrars (this domain + `knowledge-graph`) compose at boot into one tool registry on one endpoint; clients see a single MCP server publishing the full §14.3 `query` toolset. The wire framing on the MCP transport is **unchanged** by the v1.3.0 REST envelope alignment (BR-26): MCP tool dispatch continues to render outcomes as MCP 2025-06-18 `content` / `isError` (success payload as `content[0].text` JSON; errors via `isError: true` mapped by BR-24). The `{ ok, result }` REST wrap of BR-26 does NOT cross into the MCP wire -- the two transports diverge **only** in framing, never in payload shape (REST↔MCP parity per BR-25).
**Error returned:** N/A (registration-time invariant).

### BR-24 -- MCP error envelope uses the shared mapper from `knowledge-graph.back.md` BR-24
**Related UC:** all
**Where to validate:** service / shared util -- the shared error-envelope mapper extracted in `knowledge-graph.back.md` BR-24 (module `backend/src/modules/knowledge-graph/mcp/error-envelope.ts`) is reused by this domain's MCP transport path. It maps thrown errors to `{ ok: false, error: { code, message, details } }` for the codes this domain originates: `BUSINESS_INVALID_SEARCH_QUERY`, `BUSINESS_INVALID_SEARCH_LAYER`, `BUSINESS_INVALID_TRAVERSE_DEPTH`, `BUSINESS_UNKNOWN_LINK_TYPE`, `BUSINESS_FRAGMENT_NOT_ACCEPTED`, `BUSINESS_RAW_INFORMATION_DELETED`, `RESOURCE_NOT_FOUND`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_SERVICE_UNAVAILABLE`. The REST handlers of this domain (currently containing inline mappers) are refactored to call the same mapper -- behaviour-preserving (no new error codes; no change in HTTP status codes; only the call site moves), so REST and MCP surface the same code on the same condition (BR-25 below).
**Description:** A service throw of a known business condition NEVER collapses into a generic `SYSTEM_INTERNAL_ERROR` on either transport. The mapper is the single point of truth for both response shapes. Scope split (clarified in v1.3.0): this BR governs the **error envelope** on both transports (REST `{ ok: false, error }` via `mapErrorToHttpResponse`; MCP `isError: true` via the shared `error-envelope.ts`). The **success envelope** is split per transport -- REST wraps as `{ ok: true, result: <payload> }` (BR-26); MCP renders the same `<payload>` as `content[0].text` JSON without the `{ ok, result }` wrap. Payload shape is identical across transports (REST↔MCP parity, BR-25); only framing differs.
**Error returned:** Maps any thrown error to the envelope; never raises.

### BR-25 -- REST↔MCP parity tests for `search` and `get_provenance_*`
**Related UC:** UC-01, UC-07, UC-08, UC-09
**Where to validate:** tests -- integration tests in `backend/src/__tests__/integration/query-retrieval/mcp-query-*.spec.ts` MUST issue the same logical request twice (over REST `POST /api/v1/search` and `GET /api/v1/provenance/...`, then over MCP `POST /api/v1/mcp/query` with `tools/call name=<tool>`) against the same seeded fixture and assert: (a) on success, the response payload is byte-for-byte identical after stripping the transport envelope -- REST: unwrap `body.result` (the `{ ok: true, result }` wrap of BR-26); MCP: parse `content[0].text` as JSON; (b) on a forced-error case (e.g., empty `tsquery`, tombstoned raw, non-accepted fragment), the surfaced `code` matches between transports. The unit tests on the tools live alongside the toolset module (`mcp/query-toolset.spec.ts`). The functional E2E harness `temp/e2e/query-e2e.mts` is extended with a parity assertion: `search` via MCP against a seeded node returns the same items as `search` via REST (per task triage).
**Description:** Parity is the single guard against drift between REST and MCP. Failures are blocking in CI (CLAUDE.md "Rule 9 -- Tests Verify Intent").
**Error returned:** N/A (test-surface invariant).

### BR-26 -- REST success responses are wrapped in `{ ok: true, result: <payload> }`
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09
**Where to validate:** routes -- every Fastify handler under `/api/v1/search` and `/api/v1/provenance/*` sends success bodies as `reply.status(200).send({ ok: true, result: <payload> })`. The four affected sites are: `searchKnowledge` (UC-01..UC-06, `<payload> = SearchResponse`), `getProvenanceByLink` (UC-07, `<payload> = ProvenanceResponse`), `getProvenanceByAttribute` (UC-08, same shape), `getProvenanceByFragment` (UC-09, same shape). The literal-style `reply.status(200).send({ ok: true, result: body })` matches the chat module (the reference implementation cited by the spec). The error path is **unchanged** -- `mapErrorToHttpResponse` (consumed by BR-24 and the Fastify error handler of BR-20) continues to wrap every 4xx/5xx as `{ ok: false, error: { code, message, details? } }`; a single discriminator `body.ok` covers both halves.
**Description:** Mirrors `.spec.md` BR-19 (the spec-level wire rule) and aligns this domain with the CLAUDE.md "Architecture / Backend" wording (*"REST devolve esse envelope direto, com HTTP status"*) and with the chat / conversations / ingestion / knowledge-graph REST modules. Prior to v1.3.0 the four read paths of this domain returned the resource body BARE on success while already enveloping errors -- a documented asymmetry that broke the SPA's shared `lib/http.ts` parser (it requires `body.ok === true` on 2xx) and was fixed atomically with the matching `knowledge-graph.back.md` change and the frontend revert of the temporary `envelope:false` workaround (CLAUDE.md "Known Gotchas" / `kg-rest-bare-success-envelope` memory).

> **Scope -- REST only.** The MCP query transport is out of scope for this BR. MCP tool dispatch calls the same service layer (BR-23) and renders the same logical outcome as MCP 2025-06-18 `content` / `isError` via the shared mapper of BR-24 (`backend/src/modules/knowledge-graph/mcp/error-envelope.ts`); the `{ ok, result }` wrap does NOT cross into the MCP wire. The OpenAPI `description` blocks therefore reference this back-spec's MCP framing rules (BR-23 for registration on the read-only transport, BR-24 for the shared error envelope mapper) when documenting the REST-only scope of the wrap. The earlier OpenAPI wording that cited `back-spec BR-13, BR-14` for MCP framing was a stale citation -- BR-13 / BR-14 here are graph expansion and temporal filters, not MCP framing -- and is being aligned mechanically to BR-23 / BR-24 in the same atomic change as this BR (no contract change).

> **Atomic landing.** The frontend revert of the `envelope:false` workaround (5 files: `frontend/src/lib/http.ts`, its test, `frontend/src/features/graph/api/_request.ts`, `useNodeDetail.ts`, and its test) MUST land in the same change as this BR -- otherwise the SPA reads the inner payload field off the envelope and breaks every QR-driven view (search results, provenance walks). Reconciled with `knowledge-graph.spec.md` BR-21 and `knowledge-graph.back.md` (mirror BR), all in workflow `kg-rest-success-envelope`.
**Error returned:** Not applicable -- this BR specifies the success-path wire shape. Error responses are governed by BR-20 (HTTP mapping) and BR-24 (MCP envelope); the codes themselves are unchanged.

---

## 4. State Machine (ST)

> The retrieval domain is **stateless** (`.spec.md` §5). The lifecycle of every input row is owned by another domain (`ingestion`, `curation`, `compliance`) and surfaces here only as a filter predicate. No state machine is introduced by this back spec.

**N/A -- this domain is read-only with no server-side session, no cursor, no cache of result rows.** The relevant read-side projections are documented in `knowledge-graph.back.md` ST-01 / ST-02; the search pipeline reads the post-curation state and applies the filters of BR-08, BR-09 and BR-14.

---

## 5. Domain Events (EV)

> The Remember architecture does **not** include an event bus (CLAUDE.md "Architecture / Backend", `ingestion.back.md` §5 by precedent, `knowledge-graph.back.md` §5). Cross-domain coordination happens through synchronous service calls and through the database itself.

**N/A -- no domain events in this version.** This domain is READ-ONLY; it observes the writes performed by `ingestion`, `curation`, and `compliance` purely through the underlying tables and views. The §16 observability surface uses pino's structured logs (Stack / Logging section) emitted by this module's middleware, not events.

---

## 6. External Integrations

> Timeout and fallback required per integration. No fallback = operational risk -- document the decision.

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Neon Auth (Stack Auth) | REST (JWT verify via JWKS endpoint `${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA by default) | Validate the bearer token on every REST and MCP call (BR-01, A29). | 2 s per JWKS fetch; JWKS cached in-process with TTL `NEON_AUTH_JWKS_TTL_S` (default 600 s). | None -- without a verifiable JWT, the request is rejected with 401. Cache miss + network failure -> 503 `SYSTEM_SERVICE_UNAVAILABLE`. |
| PostgreSQL 17 (Neon) | TCP (`pg` pool over `DATABASE_URL`) | Read every full-text hit, the dedup join, the provenance chain, and the tombstone EXISTS check. | Statement timeout: 5 s on `searchKnowledge` without expansion; 10 s on `searchKnowledge` with `expand=true` AND `expand_depth=3` (inherits the `traverse(depth <= 3)` budget of §16, BR-17 of `.spec.md`); 5 s on `getProvenanceBy*` (the chain SQL is one statement). Pool: shared with the rest of the BFF (min 2, max 10 connections per BFF instance per `knowledge-graph.back.md`). | None -- PostgreSQL is the single store (§2.2). Outage -> 503 `SYSTEM_SERVICE_UNAVAILABLE`. Statement timeout (SQLSTATE 57014) -> 503 (BR-20). |
| `knowledge-graph` service layer | In-process function call | Graph expansion (BR-13). The shared service exposes `traverseNodes(nodeIds, opts)` over the same pool / transaction. | Inherits the 10 s `pg` statement-timeout of the parent transaction. | None -- this is an in-process dependency. A bug in `knowledge-graph` surfaces as either a 500 (unhandled exception caught by BR-20) or a 503 (statement timeout). |
| MCP query transport (owned by `knowledge-graph`; this domain registers tools onto it) | HTTP `POST /api/v1/mcp/query` (`knowledge-graph.back.md` BR-23). Same Fastify server as REST. | Register `search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment` (BR-23) on the shared read-only transport. | Per-tool-call hard ceiling: 10 s (same as REST `searchKnowledge` w/ expansion budget; inherited from the `pg` statement timeout on the read-only transaction). | None at this layer -- a slow tool call surfaces as MCP transport timeout to the LLM; the BFF nevertheless completes or aborts the SQL on its own deadline. The MCP **ingest** transport `POST /api/v1/mcp` is a separate integration owned by `ingestion`; this domain does not interact with it. |

**No LLM provider integration in this domain.** This domain is read-only and never originates LLM calls. The MCP transport surfaces *to* the LLM (the LLM is the caller); the deterministic tools are the only interface (§2, §13 -- conteúdo é dado, nunca instrução).

---

## 7. Known Technical Constraints

- **Read-only by spec.** This module owns no INSERT / UPDATE / DELETE statement. A PR introducing a write must be rejected. Writes for the tables this domain reads belong to `ingestion`, `curation` and `compliance`.
- **Schema gap on `raw_information.status`.** `.spec.md` (UC-07, BR-14) references a `status = 'deleted'` tombstone column; `migrations/0001_schema.sql` encodes the tombstone via `compliance_deletion` + content nulling. This back spec codes against the migration (BR-17). A future alignment migration would replace the EXISTS predicate with a column read; the change is BR-internal and OpenAPI-stable.
- **No row-level security.** Postgres RLS is not used on Neon for this BFF (A29); authorization is BFF-enforced via JWT (BR-01). The `DATABASE_URL` connection string and the Neon Auth configuration never leave the BFF process.
- **One transaction per `searchKnowledge` request.** Multi-statement reads (the three layer queries, dedup, expansion, provenance assembly) share one Postgres snapshot. Single-statement reads (`getProvenanceBy*`) do not need an explicit transaction.
- **The three layer queries are issued sequentially on one connection.** Issuing them in parallel across connections would break the transaction snapshot. At v1 scale (§16), sequential issue costs ~3x single-query latency in the worst case -- still inside the 500 ms p95 budget.
- **`unaccent()` is STABLE; STORED columns use `immutable_unaccent`.** The migration declares `pt_unaccent_v1` and `simple_unaccent_v1` with the standard `unaccent` dictionary; the STORED `text_search` columns on `raw_chunk` and `information_fragment` rely on this configuration being immutable per session (CLAUDE.md "Known Gotchas").
- **Provenance excerpt arithmetic: SQL `substring` is 1-based; offsets are 0-based.** BR-11 adds `+1`. Off-by-one regressions are the most likely failure mode; the unit test in `repository/excerpt.test.ts` covers multi-byte Unicode characters.
- **`expand_depth=3` could fan out broadly.** UC-01 with `expand=true` and `expand_depth=3` inherits the 10 s statement timeout (BR-20). No per-hop result cap exists; a future revision may add one if §16 metrics surface a real risk (same constraint as `knowledge-graph.back.md`).
- **`chunking_version` is `'v1'`.** Any new chunking strategy (`v2`...) would change the offset convention and require a coordinated read-path change -- excerpt arithmetic, provenance walks, and any future re-indexing must move together.
- **No in-process caching of search results.** Two identical requests issued seconds apart re-execute the full pipeline. Writes by `ingestion` / `curation` must be immediately visible (no stale-read window). Caching is out of scope per `.spec.md` §8 (only catalog is cached, shared with `knowledge-graph`).
- **No cursor pagination.** UC-01 uses offset/limit; at v1 scale the result set is small enough that `count(*)` + offset is cheap.
- **No background re-ranking.** Re-ranking is part of the same request transaction; "rebuild index" tasks belong to the migration that introduces a new FTS config.
- **`fragment_source` PK enforces dedup batching correctness.** A chunk supporting N fragments returns N rows from the dedup SQL; the service folds each chunk's excerpt into each supporting fragment's `provenance[]`. Tests cover the N=2 case.
- **MCP query tools are co-tenants on the `knowledge-graph` read-only transport.** This domain does NOT own a Fastify route for MCP; it only registers tools on the endpoint defined in `knowledge-graph.back.md` BR-23 (`POST /api/v1/mcp/query`). Composition happens at boot -- the bootstrap calls both `registerQueryToolset` (knowledge-graph) and `registerQueryRetrievalToolset` (this domain) on the same `McpServer` instance.
- **The pre-existing ingest transport is NOT modified.** `POST /api/v1/mcp` carries `X-LLM-Run-Id` and audit-row semantics that are out of scope for read tools (`ingestion.back.md` BR-21/BR-23). Co-tenanting read tools onto it is rejected at code review (CLAUDE.md "Rule 7 -- Surface Conflicts, Don't Average Them").
- **Refactoring the inline REST error mappers into the shared envelope mapper is part of TC-MCP-QUERY-1.** The current REST handlers of this domain contain inline mappers from `pg`/business throws to the REST envelope. BR-24 requires consuming the same mapper as MCP. The refactor is behaviour-preserving by spec (no error code added or removed; only the call site moves).

---

## 8. Out of Scope

- **Write endpoints.** All `searchKnowledge` and `getProvenanceBy*` operations are pure reads (`.spec.md` §8).
- **Embeddings / `pgvector` / semantic search / ANN.** PERMANENT non-goal (§20.1, ADR A24, CLAUDE.md "Anti-patterns"). The contract of cenario C11 is binding (BR-22).
- **Synonym dictionary plugged into the FTS configuration (ADR A4).** Documented escape valve; not implemented in v1.0.0. Activation = new migration (`pt_unaccent_v2` + full reindex), with this BFF unchanged beyond the two constants in BR-06.
- **System-time travel (query (c) of §5.3).** Permanently deferred per ADR A25 (`.spec.md` BR-09). `recorded_at` is stored on every row so the capability can be added later without migration or back-fill; this domain will not expose a `system_time_at` parameter in v1.0.0.
- **Dedicated review queues for `uncertain` / `low_confidence` / `disputed`.** Deferred per ADR A26 (`.spec.md` §8). Surfaced as `flags[]` only.
- **Point reads of single graph entities (`getNodeById`, `getLinkById`, `getAttributeById`, `traverseNode`, history walks).** Owned by `knowledge-graph` (`.spec.md` §8). This domain delegates expansion via the shared service layer but never exposes these endpoints under its own paths.
- **Curation operations.** Owned by `curation` (§10 + §14.4).
- **`compliance_delete` execution.** Owned by `compliance` (§11). This domain only reads the resulting 410 via `EXISTS compliance_deletion` (BR-17).
- **MCP `ingest` toolset.** MCP-only, exclusive to an open `LLMRun` (§14.1). Belongs to `ingestion`.
- **Cursor-based pagination, infinite scroll, streaming responses.** Offset/limit only (`.spec.md` §8).
- **Multi-user / role-based authorization (`User` entity, RBAC).** PERMANENT non-goal in v7 (ADR A20). `actor_context` is implicit (owner).
- **Event bus / message queue.** No Kafka / RabbitMQ. The database is the integration boundary (§2.2 "store único").
- **Rate limiting / quota.** Single-owner; no per-tenant quota. The 10-second statement timeout and the Postgres connection pool ceiling are the only back-pressure mechanisms.
- **Result caching.** Out of scope -- writes by `ingestion` / `curation` must be immediately visible.
- **Free-form regex / SQL passthrough.** The only query language accepted is `websearch_to_tsquery` (`.spec.md` §8). Raw SQL or regex from the user is rejected at the BFF input layer (BR-04).
- **Levenshtein / approximate matching at the search layer.** `pg_trgm` is the only fuzzy signal in the system and is scoped to entity resolution (BR-03 of `.spec.md`, ADR A3); `searchKnowledge` does not call it.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Back Spec Agent | initial | Initial back-end spec for the query-retrieval domain. Mirrors `query-retrieval.spec.md` v1.0.0 (9 UCs, 18 BRs) into a Fastify + raw-`pg` read-only implementation on PostgreSQL 17 (Supabase Cloud), aligned with CLAUDE.md and the v7 normative source. Tables read (no ownership of writes): `raw_information`, `raw_chunk`, `information_fragment`, `fragment_source`, `node_alias`, `knowledge_node`, `provenance`, `knowledge_link` (via `knowledge_link_resolved`), `node_attribute` (via `node_attribute_resolved`), `compliance_deletion`. Search pipeline: two FTS configs (`pt_unaccent_v1`, `simple_unaccent_v1`) parsed with `websearch_to_tsquery`, three layer queries scored 1.0 / 0.9 / 0.6 (ADR A15), one batched dedup against `fragment_source`, graph expansion delegated to `knowledge-graph` `traverseNodes(...)` with decay `0.5 ** hop` (ADR A16). Provenance walks issue one SQL each with an `EXISTS compliance_deletion` short-circuit (BR-17) producing 410 `BUSINESS_RAW_INFORMATION_DELETED`. MCP `query` toolset (`search`, `get_provenance`) is mirrored 1:1 by the REST surface (ADR A28). All error codes referenced (`AUTH_*`, `VALIDATION_*`, `RESOURCE_NOT_FOUND`, `BUSINESS_INVALID_SEARCH_QUERY`, `BUSINESS_INVALID_SEARCH_LAYER`, `BUSINESS_INVALID_TRAVERSE_DEPTH`, `BUSINESS_UNKNOWN_LINK_TYPE`, `BUSINESS_FRAGMENT_NOT_ACCEPTED`, `BUSINESS_RAW_INFORMATION_DELETED`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_SERVICE_UNAVAILABLE`) were already registered in `docs/specs/_global/error-codes.md` by the spec.md author; no new entries added by this revision. Documented schema-vs-spec gap on `raw_information.status` and resolved in favour of the migration via `EXISTS compliance_deletion` (BR-17). | -- |
| 1.1.0 | 2026-06-12 | Back Spec Agent | change | Infrastructure migration: PostgreSQL host moves from Supabase Cloud to Neon (managed Postgres); connection now via `DATABASE_URL`. Authentication moves from Supabase Auth to Neon Auth (Stack Auth) -- JWT validated by JWKS at `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default), TTL controlled by `NEON_AUTH_JWKS_TTL_S`. Middleware renamed `requireSupabaseJwt` -> `requireNeonAuth`. Removed references to `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWKS_TTL_S` and to Supabase RLS. Updated: header banner, Stack table (Auth row), BR-01 (heading + middleware name + JWKS source + env vars), §6 External Integrations (Auth and DB rows), §7 Known Technical Constraints (RLS + secret-locality bullet), §8 Out of Scope (event-bus bullet -- dropped stale `Supabase Realtime` example). Schema is unchanged (no new tables/columns/indexes); §2 Data Model is unaffected. No new error codes; no changes to BR/ST/EV catalog beyond BR-01 reword. Still single-owner; no `User` entity. | migrate-neon |
| 1.1.1 | 2026-06-14 | Maintainer | clarification | Documentation-accuracy fixes surfaced by the live ingestion→graph E2E; **no behavior, schema, contract, error-code or BR/ST catalog change** in this read-only domain. (1) BR-22: the lexical allow-list now lists `plainto_tsquery` explicitly -- it is issued by the node-hit provenance assembly; the prior wording over-stated "only websearch_to_tsquery". (2) BR-12: added a "node-hit provenance assembly (spec ↔ schema gap)" note -- a `node_alias` hit has no direct `Provenance` row, so the read path synthesizes provenance by matching **accepted** fragments against `alias_norm` via `plainto_tsquery` (a multi-word alias fed to bare `to_tsquery` raised `syntax error in tsquery`; this was the implementation bug fixed in `search.repository.ts`). Node hits with no accepted-fragment match are dropped (`provenance` `minItems: 1`, BR-19), so a node is searchable only after consolidation promotes a citing fragment `proposed -> accepted` (ingestion `ST-IF`, `ingestion.spec.md` §5.2). | search-tsquery-fix |
| 1.2.0 | 2026-06-14 | Back Spec Agent | change | Register the query-retrieval tools (`search`, `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`) on the new read-only **MCP query transport** owned by `knowledge-graph` (`POST /api/v1/mcp/query`; `knowledge-graph.back.md` BR-23). New module `query-retrieval/mcp/query-toolset.ts` with `registerQueryRetrievalToolset(deps)`; composed at boot with the `knowledge-graph` registrar on one `McpServer`. Tool input Zod schemas are the same module exports as the REST DTO Zod schemas; JSON Schemas published via `tools/list` are derived with `z.toJSONSchema(...)` and pinned at registration time. Each dispatch runs inside the existing `withReadOnly(pool, ...)` helper; no audit rows are written (read surface). New BR-23 (registration on the shared transport), BR-24 (consume the shared error-envelope mapper from `knowledge-graph.back.md` BR-24 -- behaviour-preserving refactor of inline REST mappers; no new error codes), BR-25 (REST↔MCP parity tests + extension of `temp/e2e/query-e2e.mts` with a parity assertion). The pre-existing ingest transport `POST /api/v1/mcp` is NOT used and NOT modified. Updated: Stack table (MCP server, Transaction policy), §6 External Integrations (MCP query transport row), §7 Known Technical Constraints (co-tenancy + ingest-transport-untouched + mapper-refactor bullets). No schema changes, no new error codes, no changes to data model, state machines or events. | expose-query-mcp-tools |
| 1.3.0 | 2026-06-22 | Back Spec Agent | change | **REST success-envelope alignment (new BR-26).** Documents the wire-shape change applied atomically across the `knowledge-graph` and `query-retrieval` REST surfaces -- every 2xx success body served by this domain's four REST handlers (`searchKnowledge`, `getProvenanceByLink`, `getProvenanceByAttribute`, `getProvenanceByFragment`) is now sent as `reply.status(200).send({ ok: true, result: <payload> })`, symmetric with the existing error envelope `{ ok: false, error: { code, message, details? } }` produced by `mapErrorToHttpResponse` (unchanged). Mirrors `query-retrieval.spec.md` BR-19 (the spec-level wire rule, also v1.2.0 in that file) and `knowledge-graph.back.md` (mirror BR introduced in the same atomic change). Added: new BR-26 in §3 (REST success envelope, REST-only scope, atomic landing contract with the SPA `lib/http.ts` revert of the temporary `envelope:false` workaround per CLAUDE.md "Known Gotchas" / `kg-rest-bare-success-envelope` memory). Updated: §1 Stack table -- new "REST response envelope" row documenting the `reply.status(200).send({ ok, result })` literal style and the explicit out-of-scope note for the MCP query transport; BR-23 (MCP registration) -- explicit note that the MCP wire framing `content` / `isError` is unchanged by the REST envelope alignment, the `{ ok, result }` wrap does NOT cross into the MCP wire; BR-24 (MCP error envelope mapper) -- scope split clarified, this BR governs the error envelope on both transports while the success envelope is split per transport (REST wraps via BR-26, MCP renders payload as `content[0].text` without wrap); BR-25 (REST↔MCP parity tests) -- the success-parity assertion now explicitly unwraps `body.result` on REST and parses `content[0].text` JSON on MCP. Cross-reference note for the Spec Validator: the companion `openapi.yaml` v1.2.0 lead-in note and `schemas` comment still cite *"back-spec BR-13, BR-14"* for MCP transport framing -- in this back.md BR-13 is "Graph expansion delegates to the shared `knowledge-graph` service" and BR-14 is "Temporal filters compose at the repository layer", neither of which is about MCP framing. The actual MCP framing rules in this back.md are BR-23 (registration on the shared read-only transport) and BR-24 (shared error-envelope mapper). The OpenAPI citation is a stale wording carried from the prior numbering; the openapi.yaml is being aligned mechanically to BR-23 / BR-24 in the same atomic change (no contract change). No schema change, no DDL, no new error code, no new state transition, no new use case, no new external integration. Behaviour-preserving wire-shape alignment surfaced through Zod response schemas + integration tests (the dev-side spec updates `query-retrieval/routes.spec.ts` to unwrap `.result` on success while leaving `.error.code` reads as-is). The `temp/e2e/query-e2e.mts` harness is updated alongside to expect the new wire shape (already covered by BR-25 parity). Coordinated with `knowledge-graph.back.md` v1.5.0 (mirror change). | kg-rest-success-envelope |
