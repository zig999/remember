# Curation -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 via Neon (driver `pg` raw, `DATABASE_URL`) | Version: 1.1.0 | Status: draft | Layer: permanent
> Business spec: `../curation.spec.md`
> REST contract: `../openapi.yaml`
> MCP contract: `segundo-cerebro-modelagem-v7.md` §14.4 (toolset `curation`, operations `list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`)
> Schema: `migrations/0001_schema.sql` + `migrations/0002_seed.sql`

---

## 1. Stack and Patterns

> Declare only values that differ from or extend CLAUDE.md. Use `"CLAUDE.md default"` for aspects already covered there.

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves `openapi.yaml`) | CLAUDE.md default |
| MCP server | Same BFF process, second transport over the same service layer (ADR A28). MCP operations `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`, `list_review_queue` are mirrored 1:1 in REST. The MCP catalog (§14.4) also lists `compliance_delete` -- that operation is implemented by the `compliance-audit` domain, not here (curation BR-18). | CLAUDE.md default |
| ORM | None -- raw `pg` driver with parameterized queries (A6, §2.2 of v7). SQL string concatenation is forbidden (CLAUDE.md "Security"). | CLAUDE.md default |
| Migration strategy | Versioned SQL files in `migrations/`. This domain runs at the `0001_schema.sql` / `0002_seed.sql` baseline; no new migration is required for v1.1.0 (every operation mutates existing rows in `knowledge_node`, `node_alias`, `knowledge_link`, `node_attribute`, `entity_match_review`, `provenance`, `curation_action`). Catalog mutations remain migration-only (knowledge-graph BR-10). | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/curation/`. Three internal layers per module: `routes` (Fastify handlers + Zod request/response schemas) -> `service` (transactional orchestration: locks, state-machine guards, merge/correction flows, audit-row insert) -> `repository` (parameterized SQL against the owned tables: `knowledge_node`, `node_alias`, `knowledge_link`, `node_attribute`, `entity_match_review`, `provenance`, `curation_action`; read-only on `information_fragment`, `link_type`, `attribute_key`). | Aligned with CLAUDE.md `folder_structure: modules`. |
| Validation library | Zod v4 -- every REST DTO request/response has a Zod schema generated from the OpenAPI components. Failed Zod parse -> 422 with one of `VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE`. Business validation is layered AFTER Zod and runs inside the open transaction (BR-13). | CLAUDE.md default |
| Auth | Neon Auth (Stack Auth) JWT validated by a Fastify `preHandler` middleware shared with `knowledge-graph` / `query-retrieval` / `ingestion` (single instance per BFF process, registered on `/api/v1/curation/*`). The middleware is named `requireNeonAuth` and fetches the JWKS from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default). Single-owner -- no `User` entity, no role check (curation BR-21, A20 / A29). No actor column on the audit row (curation BR-02). PostgreSQL RLS is disabled. | CLAUDE.md default (Neon-migrated). |
| Logging | `pino` structured JSON. Required fields per request: `request_id`, `route`, `operation` (one of `list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`), `decision?`, `item_kind?`, `node_id?`, `target_node_id?`, `action_id` (after commit), `outcome` (`200` / `4xx` / `500` / `503`), `latency_ms`, `rows_mutated` (counts from RETURNING). The `value` field of `node_attribute` rows and the free-text `reason` are NEVER logged (potential PII -- §16). | CLAUDE.md default |
| Observability | `observability_required: true`. Per-route latency histograms (UC-01..UC-10) are emitted to pino. Per-operation counters: `curation_actions_total{action, decision}` (one increment per successful commit), `curation_rejections_total{action, error_code}` for 4xx outcomes. These counters drive the §16 calibration loop alongside the ingestion-side metrics. | CLAUDE.md default |
| Transaction policy | Every UC-02 through UC-10 endpoint runs inside a single PostgreSQL transaction opened in the Fastify route handler (BR-19 of `.spec.md`, BR-24 here). The handler calls `pool.connect()` -> `client.query('BEGIN')`, hands the live `client` to the service, then `COMMIT` on success / `ROLLBACK` on any thrown error. UC-01 (queue listing) is read-only and uses `pool.query` directly. The `curation_action` row is INSERT'd inside the same business transaction (curation BR-17) -- audit only exists on commit. | New (this domain). |
| Concurrency | `SELECT ... FOR UPDATE` on every row mutated by UC-02 through UC-10 (BR-26, A11). For functional-scope dispute resolution (UC-06) the lock spans every row in `item_ids`. Two concurrent `correct_item` against the same predecessor serialize on the predecessor row lock; two concurrent `merge_nodes` against the same absorbed id serialize on the absorbed row lock. No advisory lock is used (entity creation -- which is the §4.5 advisory-lock site -- belongs to `ingestion`). | Extension of CLAUDE.md "Backend / pg raw". |
| Time source | `now()` for `superseded_at` and `curation_action.created_at` is taken from PostgreSQL inside the transaction, never `Date.now()` in business code. `current_date` (read-side) is not used by this domain -- the curation flows operate on the storage axis, not on derived `is_in_effect` projections (those live in `knowledge-graph`). | CLAUDE.md default |
| Catalog cache | Shared with `knowledge-graph` -- `link_type`, `attribute_key` in-memory map at BFF startup, invalidated by process restart only (catalogs mutate by migration, knowledge-graph BR-10). UC-06 (`adjust_periods` on functional scope) uses the cache to read `allows_multiple_current` for the predicate (BR-09 of `.spec.md`). | New (this domain). |
| Pagination | UC-01 only. Offset/limit per `openapi.yaml` (`limit` default 20, hard cap 100; `offset` default 0). `total` computed by a separate `count(*)` in the same logical request (no cursor; queues are small by spec -- the two queues are the human-review valve, not bulk data). | New (this domain). |
| Testing | Vitest unit tests on (i) the merge flow including path compression (BR-04, BR-07), (ii) the correction flow including `valid_to`-unchanged invariant and provenance copy (BR-07 of `.spec.md`, BR-16), (iii) functional-scope dispute resolution (BR-09 of `.spec.md`), (iv) reject/prefer-one with `superseded_at` pairing (BR-08 of `.spec.md`), (v) state-machine guards (UC-02/UC-03/UC-04 preconditions). Integration tests run the v7 acceptance scenarios C5 (merge), C9 (entity match), C13 (dispute), C14 (correction) end-to-end against a real Postgres instance (Neon ephemeral branch in CI). | CLAUDE.md default |

---

## 2. Data Model

> This domain WRITES to `knowledge_node`, `node_alias`, `knowledge_link`, `node_attribute`, `provenance`, `entity_match_review` (delete-only), and `curation_action` (insert-only). It READS `information_fragment` (BR-15 of `.spec.md`, fragment-id justification check), `link_type`, `attribute_key` (functional-scope predicate). It NEVER writes to `raw_information`, `raw_chunk`, `llm_run`, `tool_call`, `information_fragment`, `fragment_source`, `compliance_deletion`, or catalog tables. Types are taken verbatim from `migrations/0001_schema.sql`.

### Table: knowledge_node (graph -- WRITE on UC-02, UC-03, UC-04)

> Owner of the node lifecycle co-owned with `ingestion`. This domain mutates `status` and `merged_into_node_id`; trigger `trg_knowledge_node_updated_at` maintains `updated_at`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Path argument on `/api/v1/curation/entity-matches/{node_id}/resolve`. |
| node_type_id | uuid | NOT NULL, FK -> `node_type(id)` | Read by this domain for BR-03 (merge requires matching node_type_id). Never mutated here. |
| canonical_name | text | NOT NULL | Read for log enrichment. Never mutated by this domain. |
| status | node_status (enum: `active`, `needs_review`, `merged`, `deleted`) | NOT NULL, DEFAULT `'active'` | MUTATED by UC-02 (`needs_review` -> `merged`), UC-03 (`needs_review` -> `active`), UC-04 (`active` -> `merged` on the absorbed side). |
| merged_into_node_id | uuid | NULL allowed, FK -> `knowledge_node(id)`, DB CHECK `(status = 'merged') = (merged_into_node_id IS NOT NULL)`, DB CHECK `(merged_into_node_id IS DISTINCT FROM id)` | MUTATED by UC-02 / UC-04 (set to survivor on merge) AND by path compression (BR-04 / curation BR-07). Always points to an `active` node (invariant). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Read-only. |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | Maintained by `trg_knowledge_node_updated_at` on every UPDATE. |

### Table: node_alias (graph -- WRITE on UC-02, UC-04: copy aliases from absorbed to survivor)

> Mutated by INSERT (copy) on merge flows; never UPDATE / DELETE here.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. New rows allocated per copied alias. |
| node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | The survivor `node_id` for newly inserted rows. |
| alias | text | NOT NULL, CHECK `btrim(alias) <> ''` | Surface form copied verbatim from the absorbed node. |
| alias_norm | text | GENERATED ALWAYS STORED `norm(alias)` | Computed by DB. |
| kind | alias_kind (enum) | NOT NULL, DEFAULT `'alias'` | Copied aliases are written with `kind = 'alias'` (the survivor's `canonical` alias is preserved -- the absorbed node's canonical becomes an `alias` row on the survivor, BR-08). The DB partial unique index `node_alias_one_canonical_uq` enforces a single canonical alias per node. |
| created_by_run_id | uuid | NULL allowed, FK -> `llm_run(id)` | NULL when written by curation. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | DB default. |
| UNIQUE (node_id, alias_norm) | -- | -- | The DB rejects duplicates when the survivor already carries the same `alias_norm`; the service consumes `INSERT ... ON CONFLICT DO NOTHING` (BR-08). |

### Table: knowledge_link (graph -- WRITE on UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10)

> Mutated as the link side of dispute, item, and correction flows. On merge (UC-04), rows are repointed via UPDATE of `source_node_id` / `target_node_id`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Used as `item_id` for `item_kind = 'link'`. |
| source_node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | MUTATED on merge: `UPDATE ... SET source_node_id = $survivor WHERE source_node_id = $absorbed`. |
| target_node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | MUTATED on merge symmetrically. Also MUTATED by UC-10 when `corrected.target_node_id` is supplied (new row only; predecessor is untouched). |
| link_type_id | uuid | NOT NULL, FK -> `link_type(id)` | Read for functional-scope predicate (UC-06, BR-09). Never mutated here. |
| valid_from | date | NULL allowed | MUTATED by UC-06 (`adjust_periods`) and by UC-10 (new row only). DB CHECK `valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to` (semi-open invariant). |
| valid_to | date | NULL allowed | MUTATED by UC-06 (`adjust_periods`) and by UC-10 (new row only). On the predecessor of UC-10, **LEFT UNCHANGED** (BR-07 of `.spec.md`). |
| recorded_at | timestamptz | NOT NULL, DEFAULT `now()` | Read-only for this domain; the transaction axis is owned by the row's original writer. |
| superseded_at | timestamptz | NULL allowed | MUTATED by UC-05 (losers), UC-09 (`reject_item`), and UC-10 (predecessor) -- set to `now()` ALONGSIDE `status` change (BR-08 of `.spec.md`). |
| status | assertion_status (enum: `active`, `uncertain`, `disputed`, `superseded`, `deleted`) | NOT NULL | MUTATED by all link-touching curation operations. State transitions enumerated in ST-02. |
| confidence | numeric | NOT NULL, CHECK `[0, 1]` | NEVER mutated by this domain. UC-08 (`confirm_item`) preserves the row's recorded confidence (BR-13 of `.spec.md`). UC-10 copies the predecessor's confidence onto the new row. |
| valid_from_source | valid_from_source (enum: `stated`, `document`, `received`) | NULL allowed | MUTATED only by UC-10 when `corrected.valid_from` is supplied; for the new row, BR-15 of `.spec.md` mandates `valid_from_source` be set. DB CHECK `knowledge_link_basis_ck`: `valid_from IS NULL OR valid_from_source IS NOT NULL`. |
| created_by_run_id | uuid | NULL allowed, FK -> `llm_run(id)` | On UC-10 new row: `NULL` (curator origin -- knowledge-graph BR-19). On UC-06 / others: untouched on existing rows. |
| supersedes_link_id | uuid | NULL allowed, FK -> `knowledge_link(id)`, DB CHECK `supersedes_link_id IS DISTINCT FROM id` | MUTATED only on UC-10 new row: set to `predecessor_id`. NEVER mutated on existing rows. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | DB default. |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | Maintained by `trg_knowledge_link_updated_at`. |

### Table: node_attribute (graph -- WRITE on UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10)

> Mutated symmetrically to `knowledge_link`. Attribute-specific fields: `attribute_key_id`, `value`, `value_type` (denormalised), generated `value_date` / `value_number`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Used as `item_id` for `item_kind = 'attribute'`. |
| node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | MUTATED on merge: `UPDATE ... SET node_id = $survivor WHERE node_id = $absorbed`. |
| attribute_key_id | uuid | NOT NULL | Read for functional-scope predicate (UC-06, BR-09); composite FK `(attribute_key_id, value_type) -> attribute_key (id, value_type)`. Never mutated by this domain. |
| value_type | attribute_value_type (enum) | NOT NULL | Co-targeted by the composite FK; never mutated by this domain (UC-10 cannot change `value_type`; a true type change is a `reject_item` followed by a fresh ingest). |
| value | text | NOT NULL | MUTATED on UC-10 new row only. Canonical text serialisation per §3.3 (ISO YYYY-MM-DD for `date`, dot-decimal for `number`, lowercased for `bool`, raw for `text`). |
| value_date | date | GENERATED STORED `CASE WHEN value_type='date' THEN canonical_date(value) END` | DB-computed; the BFF never touches it. |
| value_number | numeric | GENERATED STORED `CASE WHEN value_type='number' THEN canonical_number(value) END` | DB-computed. |
| valid_from | date | NULL allowed | MUTATED by UC-06 / UC-10 (new row) -- same rules as `knowledge_link.valid_from`. |
| valid_to | date | NULL allowed | MUTATED by UC-06 / UC-10 (new row) -- same rules. On UC-10 predecessor, **LEFT UNCHANGED** (BR-07 of `.spec.md`). |
| recorded_at | timestamptz | NOT NULL, DEFAULT `now()` | Read-only here. |
| superseded_at | timestamptz | NULL allowed | MUTATED by UC-05 (losers), UC-09, UC-10 (predecessor) -- always paired with `status` (BR-08 of `.spec.md`). |
| status | assertion_status (enum) | NOT NULL | MUTATED by all attribute-touching curation operations (see ST-02). |
| confidence | numeric | NOT NULL, CHECK `[0, 1]` | NEVER mutated by this domain (same rule as links). |
| valid_from_source | valid_from_source (enum) | NULL allowed | MUTATED only on UC-10 new row when `corrected.valid_from` is supplied. DB CHECK `node_attribute_basis_ck`. |
| created_by_run_id | uuid | NULL allowed, FK -> `llm_run(id)` | `NULL` on UC-10 new row (curator origin). |
| supersedes_attribute_id | uuid | NULL allowed, FK -> `node_attribute(id)`, DB CHECK `supersedes_attribute_id IS DISTINCT FROM id` | Set on UC-10 new row: `predecessor_id`. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | DB default. |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | Maintained by `trg_node_attribute_updated_at`. |
| Partial UNIQUE `(node_id, attribute_key_id, value) WHERE valid_to IS NULL AND superseded_at IS NULL` (`node_attribute_current_dup_guard`) | -- | -- | Released when the loser/predecessor receives `superseded_at = now()` (CLAUDE.md "Known Gotchas"; BR-08 of `.spec.md`). |

### Table: provenance (graph -- WRITE on UC-10: copy predecessor rows to new row)

> Mutated by INSERT only on UC-10. Existing rows are NEVER updated or deleted by this domain (BR-16 of `.spec.md`, anti-hallucination §13).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | New id allocated per copy. |
| link_id | uuid | NULL allowed, FK -> `knowledge_link(id)` | On UC-10 with `item_kind='link'`: filled with `new_item_id`. NULL when `item_kind='attribute'`. DB CHECK `num_nonnulls(link_id, attribute_id) = 1`. |
| attribute_id | uuid | NULL allowed, FK -> `node_attribute(id)` | On UC-10 with `item_kind='attribute'`: filled with `new_item_id`. NULL when `item_kind='link'`. |
| fragment_id | uuid | NOT NULL, FK -> `information_fragment(id)` | Copied verbatim from the predecessor's provenance rows. Plus any new fragment ids supplied by the errata justification chain (BR-15 of `.spec.md`). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | DB default; reflects the moment of the curator's correction. |
| Partial UNIQUE `(link_id, fragment_id) WHERE link_id IS NOT NULL` and `(attribute_id, fragment_id) WHERE attribute_id IS NOT NULL` | -- | -- | Prevents accidental duplicate provenance rows for the same fragment. Service uses `INSERT ... ON CONFLICT DO NOTHING`. |

### Table: entity_match_review (curation -- WRITE on UC-02, UC-03: DELETE on resolution)

> Written by `ingestion` resolver (cross-domain producer); READ by UC-01 (queue listing); DELETED by UC-02 / UC-03 on resolution.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | The pending `needs_review` node. UC-01 joins this to assemble `EntityMatchQueueItem.candidates[]`. UC-02 / UC-03 DELETE all rows where `node_id = $1`. |
| candidate_node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | The candidate match. Exposed in `EntityMatchQueueItem.candidates[].candidate_node_id`. DB CHECK `node_id <> candidate_node_id`. |
| similarity | numeric | NOT NULL, CHECK `[0, 1]` | Trigram similarity (`pg_trgm`) at the moment ingestion wrote the row (§4.2 / A12). Exposed verbatim. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | UC-01 default ordering key. |
| UNIQUE (node_id, candidate_node_id) | -- | -- | Prevents accidental duplicate rows on the ingestion side. |

### Table: curation_action (audit -- WRITE on UC-02..UC-10: INSERT only)

> Written exclusively by this domain (curation BR-17). Read end-to-end by `compliance-audit` (`getCurationActionById`, `listCurationActions`).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | The `action_id` returned in every success response. |
| action | text | NOT NULL | One of: `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`. (`compliance_delete` is written by `compliance-audit`, not here.) |
| target_kind | text | NOT NULL | One of: `node` (for `resolve_entity_match`, `merge_nodes`), `link`, `attribute` (for the rest). The value passed in `item_kind` for item-level ops, hard-coded for node-level. |
| target_id | uuid | NULL allowed | Primary target id (curation BR-17 -- one action, one target). NULL is reserved for hypothetical multi-target actions; this domain always populates it. |
| payload | jsonb | NOT NULL, DEFAULT `'{}'::jsonb` | Operation-specific payload. Schema enumerated in BR-25. |
| reason | text | NULL allowed at the DB level | Mandatory by service layer for destructive operations (BR-10 of `.spec.md` / BR-11 here). NULL stored only for the non-destructive variants (`keep_separate`, `keep_disputed`, `adjust_periods`, `confirm_item`). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Inserted inside the business transaction (curation BR-19). |

### Read-only tables (no write here)

| Table | Used by | Purpose |
|-------|---------|---------|
| `information_fragment` | UC-10 | BR-15 of `.spec.md`: when `corrected.valid_from_source = 'stated'`, the service reads `information_fragment` by `valid_from_fragment_id` and asserts `status = 'accepted'`. |
| `link_type` | UC-06 | BR-09 of `.spec.md`: the functional-scope predicate `allows_multiple_current = false` is read for `item_kind = 'link'`. Sourced from the in-memory catalog cache. |
| `attribute_key` | UC-06 | BR-09 of `.spec.md`: same predicate for `item_kind = 'attribute'`. |
| `knowledge_node` (status read) | UC-02, UC-03, UC-04, UC-10 (via FK joins) | State-machine guards (BR-22 of `.spec.md` -- 410 on tombstoned target). |

### Indexes

> Justify each index with the query it optimizes. All indexes are CREATEd by `migrations/0001_schema.sql`; this domain adds NO new indexes. Every FK on the surface already has its own index (CLAUDE.md "Conventions").

| Table | Fields | Type | Justification |
|-------|--------|------|---------------|
| knowledge_node | partial btree `(created_at) WHERE status='needs_review'` (`knowledge_node_needs_review_idx`) | btree | UC-01 with `kind=entity_match`: scans `knowledge_node` filtered by `status = 'needs_review'` ordered by `created_at`. The partial index gives O(log N) page fetches even when only a tiny fraction of nodes is in the review queue. |
| knowledge_node | `merged_into_node_id` (`knowledge_node_merged_idx`, partial WHERE NOT NULL) | btree | UC-02 / UC-04 path compression: `UPDATE knowledge_node SET merged_into_node_id = $survivor WHERE merged_into_node_id = $absorbed`. The partial index is also read by `knowledge-graph` BR-13 (read-side substitution). |
| knowledge_node | `node_type_id` (`knowledge_node_type_idx`) | btree | Read by UC-02 / UC-04 for BR-03 (matching node_type predicate). |
| node_alias | UNIQUE `(node_id, alias_norm)` | UNIQUE btree | UC-02 / UC-04 `INSERT ... ON CONFLICT DO NOTHING` when copying aliases. The unique index is the conflict target. |
| node_alias | partial UNIQUE `(node_id) WHERE kind='canonical'` (`node_alias_one_canonical_uq`) | UNIQUE btree | BR-08 invariant on copy: the absorbed node's `canonical` alias is downgraded to `alias` before INSERT to preserve the survivor's single canonical row. |
| knowledge_link | `source_node_id` (`knowledge_link_source_idx`) | btree | UC-04 merge: `UPDATE ... SET source_node_id = $survivor WHERE source_node_id = $absorbed`. Same for `resolve_entity_match(merge_into)`. |
| knowledge_link | `target_node_id` (`knowledge_link_target_idx`) | btree | UC-04 merge: same `UPDATE` on `target_node_id`. |
| knowledge_link | partial btree `(recorded_at) WHERE status='disputed'` (`knowledge_link_disputed_idx`) | btree | UC-01 with `kind=disputed`: filtered by `status='disputed'` ordered by `recorded_at` for the link side. |
| knowledge_link | partial UNIQUE `(source_node_id, target_node_id, link_type_id) WHERE valid_to IS NULL AND superseded_at IS NULL` (`knowledge_link_current_dup_guard`) | UNIQUE btree | Functional duplicate guard. Active during UC-06 (`adjust_periods`); the service pre-checks BR-09 to fail fast with `BUSINESS_TEMPORAL_INCOHERENT` BEFORE the DB rejects. Released for losers (UC-05) / predecessor (UC-10) via `superseded_at = now()`. |
| knowledge_link | `supersedes_link_id` (`knowledge_link_supersedes_idx`) | btree | UC-10 INSERT path: not strictly read here, but kept consistent with `knowledge-graph` history walks downstream. |
| node_attribute | `node_id` (`node_attribute_node_idx`) | btree | UC-04 merge: `UPDATE ... SET node_id = $survivor WHERE node_id = $absorbed`. |
| node_attribute | `attribute_key_id` (`node_attribute_key_idx`) | btree | UC-06: identifying the `(node_id, attribute_key_id)` conflict scope during pre-check. |
| node_attribute | partial btree `(recorded_at) WHERE status='disputed'` (`node_attribute_disputed_idx`) | btree | UC-01 with `kind=disputed`: filtered by `status='disputed'` for the attribute side. |
| node_attribute | partial UNIQUE `(node_id, attribute_key_id, value) WHERE valid_to IS NULL AND superseded_at IS NULL` (`node_attribute_current_dup_guard`) | UNIQUE btree | Functional duplicate guard. Same role as the link variant. |
| entity_match_review | UNIQUE `(node_id, candidate_node_id)` | UNIQUE btree | UC-01 join (efficient join to `knowledge_node` rows in `needs_review`) and UC-02 / UC-03 DELETE WHERE `node_id = $1` (uses the leading column). |
| entity_match_review | `candidate_node_id` (`entity_match_review_candidate_idx`) | btree | Not read by this domain at v1; kept for future symmetric-candidate listing (e.g. "everything pointing at this active node"). |
| curation_action | `(target_kind, target_id)` (`curation_action_target_idx`) | btree | Read by `compliance-audit` (`listCurationActions?target=...`), not by this domain. Listed here because this domain is the writer; the index supports the consumer. |
| provenance | partial UNIQUE `(link_id, fragment_id) WHERE link_id IS NOT NULL` (`provenance_link_fragment_uq`) | UNIQUE btree | UC-10 provenance copy uses `INSERT ... ON CONFLICT DO NOTHING` -- the index is the conflict target. |
| provenance | partial UNIQUE `(attribute_id, fragment_id) WHERE attribute_id IS NOT NULL` (`provenance_attr_fragment_uq`) | UNIQUE btree | Same role for attribute provenance. |
| information_fragment | PK on `id` | UNIQUE btree | UC-10 BR-15 fragment-id existence + status check is a point lookup on the primary key. |

> No new indexes are created for v1.1.0. The pre-existing index set is sufficient for the curation write patterns. Adding any index requires a new migration (CLAUDE.md "Safety Rule").

### Relationships

> FK + on-delete strategy. Cross-domain: via ID only -- never nested objects. The system is immutable + tombstone-based; **no CASCADE anywhere** (knowledge-graph BR-02 of `.spec.md`, BR-14 of knowledge-graph `.spec.md`).

| From | To | Type | FK | On Delete |
|------|----|------|----|-----------|
| knowledge_node.merged_into_node_id | knowledge_node.id | N : 1 (self) | `knowledge_node_merged_into_node_id_fkey` | NO ACTION -- merges are non-destructive; the absorbed row keeps its row with `status='merged'`. |
| node_alias.node_id | knowledge_node.id | N : 1 | `node_alias_node_id_fkey` | NO ACTION -- nodes are never row-deleted (tombstone semantics). |
| knowledge_link.source_node_id | knowledge_node.id | N : 1 | `knowledge_link_source_node_id_fkey` | NO ACTION -- tombstone. |
| knowledge_link.target_node_id | knowledge_node.id | N : 1 | `knowledge_link_target_node_id_fkey` | NO ACTION. |
| knowledge_link.supersedes_link_id | knowledge_link.id | N : 1 (self) | `knowledge_link_supersedes_link_id_fkey` | NO ACTION -- lineage is immutable. |
| node_attribute.node_id | knowledge_node.id | N : 1 | `node_attribute_node_id_fkey` | NO ACTION. |
| node_attribute.supersedes_attribute_id | node_attribute.id | N : 1 (self) | `node_attribute_supersedes_attribute_id_fkey` | NO ACTION -- lineage immutable. |
| node_attribute.(attribute_key_id, value_type) | attribute_key.(id, value_type) | N : 1 (composite) | `node_attribute_attribute_key_id_value_type_fkey` | NO ACTION -- catalog mutation is migration-only. |
| provenance.link_id | knowledge_link.id | N : 1 | `provenance_link_id_fkey` | NO ACTION. |
| provenance.attribute_id | node_attribute.id | N : 1 | `provenance_attribute_id_fkey` | NO ACTION. |
| provenance.fragment_id | information_fragment.id | N : 1 | `provenance_fragment_id_fkey` | NO ACTION -- fragments are never row-deleted (compliance tombstones via `status='deleted'`). |
| entity_match_review.node_id | knowledge_node.id | N : 1 | `entity_match_review_node_id_fkey` | NO ACTION -- this domain DELETEs the row itself on resolution; FK cascade is unnecessary. |
| entity_match_review.candidate_node_id | knowledge_node.id | N : 1 | `entity_match_review_candidate_node_id_fkey` | NO ACTION. |
| curation_action.{target_id} | -- | implicit (no FK) | -- | -- (the column has no FK by design: a single column would have to multiplex across `knowledge_node`, `knowledge_link`, `node_attribute`; the read-side consumer uses `target_kind` to dispatch). |

---

## 3. Business Rules (BR)

> Every BR references at least one UC of `curation.spec.md`. The numbering here is independent from `.spec.md` (which carries BR-01..BR-22 expressing the business invariants); this section translates them into the validation layer, the SQL pattern, and the error code returned on violation. Where `.spec.md` already states a rule textually, the corresponding `BR-NN` here labels the implementation hook.

### BR-01 -- All endpoints require a valid Neon Auth JWT
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10
**Where to validate:** middleware -- the shared Fastify `preHandler` `requireNeonAuth` (registered on `/api/v1/curation/*`) fetches the JWKS from `${NEON_AUTH_URL}/.well-known/jwks.json` (cached in-process for `NEON_AUTH_JWKS_TTL_S` seconds, default 600), verifies the `Authorization: Bearer <jwt>` header (EdDSA by default), and rejects before any DB access (curation BR-21 of `.spec.md`, A29).
**Description:** Missing header -> `AUTH_UNAUTHORIZED`. Malformed/unsignable token -> `AUTH_TOKEN_INVALID`. Expired `exp` -> `AUTH_TOKEN_EXPIRED`. The Neon Auth project ID and secret never leave the BFF process; they live in `NEON_AUTH_URL` (and the associated Stack Auth credentials) -- a single environment-driven configuration shared with `knowledge-graph`, `query-retrieval`, `ingestion`, `compliance-audit`.
**Error returned:** HTTP 401 -- error.code: `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` (all registered).

### BR-02 -- Path UUIDs and body UUIDs are syntactically validated before DB lookup
**Related UC:** UC-02 (`{node_id}` in path; `target_node_id` in body), UC-04 (`survivor_id`, `absorbed_id`), UC-05, UC-06, UC-07 (`item_ids`, `winner_id?`), UC-08, UC-09, UC-10 (`item_id`, `corrected.target_node_id?`, `corrected.valid_from_fragment_id?`)
**Where to validate:** routes -- Zod schema with `z.string().uuid()` on each id field. Failure is surfaced before the controller runs.
**Description:** Non-UUID inputs short-circuit to 422; no DB query is issued.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT` (registered).

### BR-03 -- Pagination ranges are enforced at the route layer
**Related UC:** UC-01
**Where to validate:** routes -- Zod schema on `limit` (`int().min(1).max(100).default(20)`) and `offset` (`int().min(0).default(0)`). Out-of-range surfaces before the service runs.
**Description:** Bumping the cap requires both an OpenAPI update and a BR amendment.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_OUT_OF_RANGE` (registered).

### BR-04 -- `kind` query parameter is enum-validated
**Related UC:** UC-01
**Where to validate:** routes -- Zod schema `z.enum(['entity_match', 'disputed']).optional()` on `kind`. Out-of-enum -> 422 BEFORE any DB query (BR-01 of `.spec.md`).
**Description:** The `ReviewQueueKind` enum is exactly `[entity_match, disputed]`; new kinds are an additive future change (knowledge-graph BR-22 of `.spec.md`). `uncertain` / `low_confidence` are display flags, not queue kinds.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT` (registered).

### BR-05 -- Queue listing is the only read path; everything else writes
**Related UC:** UC-01 (read), UC-02..UC-10 (write)
**Where to validate:** routes -- the only `GET` registered by this module is `/api/v1/curation/queue`. All other endpoints are `POST` (no PUT/PATCH/DELETE -- curator semantics are explicit verbs over the audit trail, not REST CRUD over resources). Any PR adding `DELETE` to this module must be rejected -- deletion is `rejectItem` semantically, which uses `POST` and writes one `CurationAction` row.
**Description:** Absence-of-code invariant. Aligned with `knowledge-graph` BR-10 (catalog read-only).
**Error returned:** Not applicable.

### BR-06 -- Merge requires matching `node_type_id`
**Related UC:** UC-02, UC-04
**Where to validate:** service -- inside the transaction, after the rows are loaded with `SELECT ... FOR UPDATE` (BR-26): assert `survivor.node_type_id = absorbed.node_type_id`. The SQL fetch issues one statement returning both rows (`SELECT id, node_type_id, status FROM knowledge_node WHERE id IN ($1, $2) FOR UPDATE`).
**Description:** Per §4.2 / BR-03 of `.spec.md`: "Apollo" as Person MUST NOT match "Apollo" as Project. Both `resolveEntityMatch(merge_into)` and `mergeNodes` enforce this.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_INVALID_TARGET_NODE` (registered, with `details = { reason: "node_type mismatch" }`).

### BR-07 -- Path compression runs in the same transaction as the merge
**Related UC:** UC-02, UC-04
**Where to validate:** service -- one SQL inside the merge transaction:
```sql
UPDATE knowledge_node
   SET merged_into_node_id = $survivor_id
 WHERE merged_into_node_id = $absorbed_id
RETURNING id;
```
The `RETURNING id` count is surfaced as `affected.path_compressed_nodes` (per `openapi.yaml`).
**Description:** Implements the §4.4 invariant referenced by `.spec.md` BR-04: `merged_into_node_id` always points to an ACTIVE node. The survivor is `active` (preconditions UC-02 step 4, UC-04 step 4); after the update, every node pointing at the absorbed now points at the survivor.
**Error returned:** Not applicable (correctness invariant; covered by unit test).

### BR-08 -- Alias copy preserves the survivor's single canonical alias
**Related UC:** UC-02, UC-04
**Where to validate:** service -- two SQLs inside the merge transaction:
```sql
-- Copy aliases as 'alias' kind; drop the absorbed-side 'canonical' down to 'alias'
INSERT INTO node_alias (node_id, alias, kind, created_by_run_id, created_at)
SELECT $survivor_id, alias, 'alias', created_by_run_id, created_at
  FROM node_alias
 WHERE node_id = $absorbed_id
ON CONFLICT (node_id, alias_norm) DO NOTHING
RETURNING id;
```
The `RETURNING id` count is surfaced as `affected.aliases_copied`. The survivor's existing `canonical` alias (enforced by `node_alias_one_canonical_uq`) is not touched.
**Description:** Implements §4.4. The absorbed node's `canonical` alias becomes a regular `alias` on the survivor; duplicates with the survivor's existing aliases are skipped via the unique conflict target.
**Error returned:** Not applicable (correctness invariant).

### BR-09 -- Link/attribute repointing on merge uses the FK index
**Related UC:** UC-02, UC-04
**Where to validate:** service -- two SQLs:
```sql
UPDATE knowledge_link
   SET source_node_id = CASE WHEN source_node_id = $absorbed_id THEN $survivor_id ELSE source_node_id END,
       target_node_id = CASE WHEN target_node_id = $absorbed_id THEN $survivor_id ELSE target_node_id END
 WHERE source_node_id = $absorbed_id OR target_node_id = $absorbed_id
RETURNING id;

UPDATE node_attribute
   SET node_id = $survivor_id
 WHERE node_id = $absorbed_id
RETURNING id;
```
The `RETURNING id` counts feed `affected.links_repointed` and `affected.attributes_repointed`.
**Description:** Implements §4.4. The CASE expression on `knowledge_link` handles the rare self-loop case where both endpoints point at the absorbed.
**Error returned:** Not applicable.

### BR-10 -- Entity-match review rows are deleted on resolution
**Related UC:** UC-02, UC-03
**Where to validate:** service -- one SQL inside the resolution transaction:
```sql
DELETE FROM entity_match_review WHERE node_id = $1 RETURNING id;
```
The deletion runs AFTER the `knowledge_node` status mutation.
**Description:** The review-context rows have served their purpose; the resolution lives in `curation_action`. Aligned with UC-02 step 5 / UC-03 step 4.
**Error returned:** Not applicable.

### BR-11 -- `reason` is mandatory for destructive operations
**Related UC:** UC-02 (`merge_into`), UC-04, UC-05 (`prefer_one`), UC-09, UC-10
**Where to validate:** routes -- Zod schemas require `reason: z.string().trim().min(1)` on:
- `MergeNodesRequest`
- `ResolveEntityMatchRequest` when `decision = 'merge_into'` (conditional via `z.discriminatedUnion` on `decision`)
- `ResolveDisputeRequest` when `decision = 'prefer_one'` (conditional)
- `RejectItemRequest`
- `CorrectItemRequest`
`ConfirmItemRequest`, `ResolveDisputeRequest({adjust_periods,keep_disputed})`, and `ResolveEntityMatchRequest({keep_separate})` allow `reason: z.string().trim().min(1).optional()`.
**Description:** Implements `.spec.md` BR-10. The trim + min(1) check rejects whitespace-only strings BEFORE the controller runs.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_REASON_REQUIRED` (registered).

### BR-12 -- 410 on tombstoned nodes; 404 on absent ids
**Related UC:** UC-02, UC-03, UC-04 (target_node_id, survivor/absorbed)
**Where to validate:** service -- after `SELECT ... FOR UPDATE` (BR-26), inspect `status`:
- Row missing -> 404 `RESOURCE_NOT_FOUND` with `details.missing_id`.
- `status = 'deleted'` -> 410 `BUSINESS_NODE_DELETED` (tombstoned by `compliance-audit` cascade, §11). Aligned with knowledge-graph BR-11.
- `status IN ('active', 'needs_review', 'merged')` -> proceed (only `merged` is rejected per UC-04 step 4 -- maps to `BUSINESS_INVALID_TARGET_NODE`).
**Description:** The differentiator is "row exists but is tombstoned" vs "row absent". The 410 acknowledges past existence; the 404 does not.
**Error returned:** HTTP 404 -- `RESOURCE_NOT_FOUND`; HTTP 410 -- `BUSINESS_NODE_DELETED` (both registered).

### BR-13 -- Layered validation order is fixed
**Related UC:** UC-02 through UC-10
**Where to validate:** service -- every write endpoint runs the same ordered pipeline before mutating data (§13 of v7 applied to curation):
1. **Zod parse (route)** -- structural and format. Failure -> 422 (`VALIDATION_*`).
2. **Cross-field guard (route)** -- e.g. `winner_id IN item_ids` (UC-05), `periods.length === item_ids.length` (UC-06). Failure -> 422 with the appropriate `BUSINESS_DISPUTE_*` code.
3. **Lock + load (service)** -- `SELECT ... FOR UPDATE` on every row to be mutated. Missing -> 404; tombstoned -> 410.
4. **State-machine guard (service)** -- assert `status` matches the precondition (BR-22 here). Failure -> 409 (`BUSINESS_REVIEW_NOT_PENDING`, `BUSINESS_ITEM_NOT_DISPUTED`, `BUSINESS_ITEM_NOT_UNCERTAIN`, `BUSINESS_ITEM_NOT_DELETABLE`).
5. **Cross-table guard (service)** -- e.g. BR-06 (matching node_type), BR-14 (conflict scope), BR-17 (fragment status). Failure -> 422 / 409 per the rule.
6. **Mutate** -- one transaction (BR-24); writes are issued in the order documented per UC.
7. **Audit** -- `INSERT INTO curation_action ... RETURNING id` (BR-19); the returned id becomes `action_id`.

A failure at step N rolls back any step N-1 effect (BR-24); the only step that survives a rollback is the route-layer Zod / cross-field reject because no transaction was opened yet.
**Description:** A deterministic order makes the validation outcome a function of inputs + DB state, never of run order.
**Error returned:** Per-step, as enumerated.

### BR-14 -- Dispute scope check uses the duplicate-guard column tuple
**Related UC:** UC-05, UC-06, UC-07
**Where to validate:** service -- after locking all `item_ids` rows, assert:
- For `item_kind = 'link'`: every row shares the same `(source_node_id, target_node_id, link_type_id)`.
- For `item_kind = 'attribute'`: every row shares the same `(node_id, attribute_key_id)`.
SQL: `SELECT COUNT(DISTINCT (col1, col2[, col3])) FROM <table> WHERE id = ANY($1::uuid[])`. The count MUST be 1; otherwise reject with 409.
**Description:** Resolving items from different conflicts in one call is semantically incoherent -- `.spec.md` BR-05. The check uses the same column tuple as the partial unique index `(link|attribute)_current_dup_guard`.
**Error returned:** HTTP 409 -- error.code: `BUSINESS_ITEM_NOT_DISPUTED` with `details.scope_mismatch` (registered).

### BR-15 -- `decision = prefer_one` requires `winner_id` membership
**Related UC:** UC-05
**Where to validate:** route -- Zod schema on `ResolveDisputeRequest` uses a `superRefine` to assert `winner_id` is non-null AND present in `item_ids` when `decision = 'prefer_one'`.
**Description:** `.spec.md` UC-05 step 3 precondition. The check runs before the transaction opens.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_DISPUTE_WINNER_REQUIRED` (registered).

### BR-16 -- `decision = adjust_periods` requires one-to-one `periods[]` and semi-open invariant
**Related UC:** UC-06
**Where to validate:** route + service.
- Route: Zod `superRefine`: `periods` non-empty, `periods.length === item_ids.length`, every `period.item_id` is in `item_ids`, and for each entry where both `valid_from` and `valid_to` are non-null assert `valid_from < valid_to`. Missing/empty `periods` -> 422 `BUSINESS_DISPUTE_PERIODS_REQUIRED`; semi-open violation -> 422 `BUSINESS_TEMPORAL_INCOHERENT`.
- Service: after locking rows, also assert the FUNCTIONAL-SCOPE invariant (BR-09 of `.spec.md`): when the `link_type.allows_multiple_current = false` (or `attribute_key.allows_multiple_current = false`, via the catalog cache), at most one row in the adjusted set may end with `valid_to = NULL`. Two or more -> 422 `BUSINESS_TEMPORAL_INCOHERENT`.
**Description:** Implements `.spec.md` BR-06 and BR-09. The semi-open check is symmetric with the DB CHECK `(link|attribute)_interval_ck`; the functional-scope check pre-empts the partial unique index that would otherwise reject the second row at COMMIT time.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_DISPUTE_PERIODS_REQUIRED` / `BUSINESS_TEMPORAL_INCOHERENT` (both registered).

### BR-17 -- Date justification chain on `correct_item` reaches a real accepted fragment
**Related UC:** UC-10
**Where to validate:** route + service.
- Route: Zod `superRefine` on `CorrectItemRequest`:
  - `corrected` MUST have at least one of `value`, `target_node_id`, `valid_from`, `valid_to` (BR-18).
  - `value` MUST be absent when `item_kind = 'link'`; `target_node_id` MUST be absent when `item_kind = 'attribute'` (BR-12 of `.spec.md`).
  - When `corrected.valid_from` is supplied: `corrected.valid_from_source` MUST be supplied.
  - When `corrected.valid_from_source = 'stated'`: `corrected.valid_from_fragment_id` MUST be supplied.
  - When both `corrected.valid_from` and `corrected.valid_to` are supplied: `valid_from < valid_to`.
- Service: when `valid_from_fragment_id` is supplied, issue a point lookup:
```sql
SELECT id, status FROM information_fragment WHERE id = $1;
```
If missing OR `status <> 'accepted'`, reject with 422 `BUSINESS_DATE_UNJUSTIFIED`.
**Description:** Implements `.spec.md` BR-15 / ADR A14. The system NEVER invents dates -- every `valid_from` change has a verifiable justification.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_DATE_UNJUSTIFIED` (registered); `BUSINESS_CORRECTION_NO_CHANGES` if `corrected` is empty; `VALIDATION_INVALID_FORMAT` for the link/attribute cross-field mismatches; `BUSINESS_TEMPORAL_INCOHERENT` for the semi-open violation.

### BR-18 -- `correct_item` mutations preserve the predecessor's `valid_to`
**Related UC:** UC-10
**Where to validate:** service -- the predecessor UPDATE is templated to TOUCH exactly four columns and leave `valid_to` out of the SET list:
```sql
UPDATE knowledge_link
   SET status = 'superseded',
       superseded_at = now(),
       updated_at = now()  -- trigger handles, but listed for clarity
 WHERE id = $predecessor_id
   AND status IN ('active', 'uncertain', 'disputed')
RETURNING id;
```
(Same shape for `node_attribute`.) The new row is built by SELECT-then-INSERT:
```sql
INSERT INTO knowledge_link (id, source_node_id, target_node_id, link_type_id,
                            valid_from, valid_to, status, confidence,
                            valid_from_source, created_by_run_id,
                            supersedes_link_id, recorded_at)
SELECT gen_random_uuid(),
       COALESCE($corrected_target_source_node_id, source_node_id),  -- new row may inherit
       COALESCE($corrected_target_node_id, target_node_id),
       link_type_id,
       COALESCE($corrected_valid_from, valid_from),
       COALESCE($corrected_valid_to, valid_to),
       'active',
       confidence,
       COALESCE($corrected_valid_from_source, valid_from_source),
       NULL,                            -- curator origin (knowledge-graph BR-19)
       $predecessor_id,                 -- supersedes_link_id
       now()                            -- recorded_at: now
  FROM knowledge_link
 WHERE id = $predecessor_id
RETURNING id;
```
The DB CHECK `(link|attribute)_interval_ck` (`valid_from < valid_to`) is satisfied because the route already enforced it (BR-17).
**Description:** Implements `.spec.md` BR-07. Test predicate: after `correct_item` on row R, `R.valid_to == R.valid_to (before)`.
**Error returned:** Not applicable (correctness invariant; unit-tested).

### BR-19 -- `correct_item` copies provenance to the new row and appends new evidence
**Related UC:** UC-10
**Where to validate:** service -- inside the correction transaction:
```sql
INSERT INTO provenance (link_id, fragment_id, created_at)
SELECT $new_item_id, fragment_id, now()
  FROM provenance
 WHERE link_id = $predecessor_id
ON CONFLICT (link_id, fragment_id) DO NOTHING
RETURNING id;
```
(Symmetric for `attribute_id`.) When the curator supplied `corrected.valid_from_fragment_id`, the service issues one extra INSERT to append the errata fragment (ON CONFLICT DO NOTHING). Both writes happen in the same transaction.
**Description:** Implements `.spec.md` BR-16. The evidence chain is preserved across the correction; nothing is silently discarded (CLAUDE.md golden rule "Fail Loud" + §1 of v7).
**Error returned:** Not applicable.

### BR-20 -- `prefer_one` losers and `reject_item` pair `status='deleted'` with `superseded_at=now()` atomically
**Related UC:** UC-05 (losers), UC-09
**Where to validate:** service -- the loser UPDATE templates set both fields in ONE statement:
```sql
UPDATE knowledge_link
   SET status = 'deleted',
       superseded_at = now()
 WHERE id = ANY($loser_ids::uuid[])
   AND status = 'disputed'
RETURNING id;
```
(Same for `node_attribute`; same shape for `reject_item` with `id = $1` and `status IN ('active','uncertain','disputed')`.) The pairing is enforced by the SQL template, NOT by a DB CHECK -- the schema rationale (§5.4) and CLAUDE.md "Known Gotchas" both flag the trap.
**Description:** Implements `.spec.md` BR-08. Failing to set `superseded_at` would leave the row trapped in `(link|attribute)_current_dup_guard` partial unique index.
**Error returned:** Not applicable (correctness invariant; unit-tested with a regression case that asserts the partial index is released).

### BR-21 -- `confirm_item` flips `status` without touching `confidence`, `valid_from`, `valid_to`, `superseded_at`
**Related UC:** UC-08
**Where to validate:** service:
```sql
UPDATE knowledge_link
   SET status = 'active'
 WHERE id = $1 AND status = 'uncertain'
RETURNING id;
```
(Same for `node_attribute`.) `confidence` is preserved as-is (`.spec.md` BR-13). `valid_from`, `valid_to`, `superseded_at` are NEVER part of the SET list.
**Description:** Implements `.spec.md` BR-13. Corroboration (automatic; sets `confidence = max(sources)`) lives in `ingestion`; `confirm_item` is the human ad-hoc escape and only changes `status`.
**Error returned:** HTTP 409 -- error.code: `BUSINESS_ITEM_NOT_UNCERTAIN` when the WHERE clause's `status = 'uncertain'` predicate fails (`rowCount = 0` triggers the 409 after a follow-up SELECT to differentiate from 404).

### BR-22 -- State-machine guard rejects pre/post-condition mismatches with explicit codes
**Related UC:** UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10
**Where to validate:** service -- after `SELECT ... FOR UPDATE`, the service inspects `status` and dispatches:

| Operation | Expected `status` | Mismatch outcome (HTTP / code) |
|-----------|--------------------|--------------------------------|
| `resolveEntityMatch` (UC-02, UC-03) | `needs_review` | 409 `BUSINESS_REVIEW_NOT_PENDING`; if `deleted` -> 410 `BUSINESS_NODE_DELETED` |
| `mergeNodes` (UC-04) | `active` for BOTH `survivor` and `absorbed` | 422 `BUSINESS_INVALID_TARGET_NODE` with `details.id` and `details.current_status`; if either is `deleted` -> 410 `BUSINESS_NODE_DELETED`; if `survivor_id = absorbed_id` -> 409 `BUSINESS_SELF_MERGE_FORBIDDEN` |
| `resolveEntityMatch(merge_into)` target (UC-02) | `active` | 422 `BUSINESS_INVALID_TARGET_NODE`; if `deleted` -> 410 `BUSINESS_NODE_DELETED`; if `target_node_id = node_id` -> 409 `BUSINESS_SELF_MERGE_FORBIDDEN` |
| `resolveDispute` (UC-05, UC-06, UC-07) | `disputed` for ALL `item_ids` | 409 `BUSINESS_ITEM_NOT_DISPUTED` with `details.offending_id` and `details.current_status` |
| `confirmItem` (UC-08) | `uncertain` | 409 `BUSINESS_ITEM_NOT_UNCERTAIN` |
| `rejectItem` (UC-09), `correctItem` (UC-10) | `status NOT IN ('deleted','superseded')` | 409 `BUSINESS_ITEM_NOT_DELETABLE` |

**Description:** Implements `.spec.md` BR-22 plus the per-UC alternative-flow tables. Every mismatch surfaces a deterministic code; no ambiguous 409s.
**Error returned:** As enumerated.

### BR-23 -- Self-merge forbidden at request-shape level
**Related UC:** UC-02 (`target_node_id == node_id`), UC-04 (`survivor_id == absorbed_id`)
**Where to validate:** route -- Zod `superRefine` rejects equal ids at parse time; the service ALSO re-asserts inside the transaction (defence in depth).
**Description:** Implements `.spec.md` BR-04 (no self-merge). DB CHECK `knowledge_node_no_self_merge_ck` is the last line of defence but should never trigger.
**Error returned:** HTTP 409 -- error.code: `BUSINESS_SELF_MERGE_FORBIDDEN` (registered).

### BR-24 -- Every write UC runs inside one transaction; audit is part of it
**Related UC:** UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10
**Where to validate:** routes + service. The Fastify route handler is the sole holder of the `pool.connect()` / `BEGIN` / `COMMIT` / `ROLLBACK` lifecycle. The service is passed the live `pg.Client` as its first argument. The `curation_action` INSERT is the LAST SQL inside the transaction, so its `id` is deterministic per commit:
```sql
INSERT INTO curation_action (action, target_kind, target_id, payload, reason)
VALUES ($1, $2, $3, $4::jsonb, $5)
RETURNING id, created_at;
```
On any thrown error before COMMIT, the entire transaction rolls back -- no `curation_action` row is written. The response envelope's `action_id` exists only on success.
**Description:** Implements `.spec.md` BR-17 and BR-19. The audit row is transactional with the data mutation -- both or neither.
**Error returned:** Not applicable (transactional pattern).

### BR-25 -- `curation_action.payload` shape is operation-deterministic
**Related UC:** UC-02..UC-10
**Where to validate:** service -- one helper `buildPayload(operation, args)` produces the JSONB body. Shapes:

| Operation | `target_kind` | `target_id` | `payload` (JSONB) | `reason` |
|-----------|---------------|-------------|-------------------|----------|
| `resolve_entity_match` (merge_into) | `node` | `node_id` (path) | `{ "decision": "merge_into", "target_node_id": <uuid> }` | required |
| `resolve_entity_match` (keep_separate) | `node` | `node_id` | `{ "decision": "keep_separate" }` | optional |
| `merge_nodes` | `node` | `absorbed_id` | `{ "survivor_id": <uuid> }` | required |
| `resolve_dispute` (prefer_one) | `item_kind` | `winner_id` | `{ "decision": "prefer_one", "item_ids": [...], "winner_id": <uuid> }` | required |
| `resolve_dispute` (adjust_periods) | `item_kind` | `item_ids[0]` | `{ "decision": "adjust_periods", "item_ids": [...], "periods": [{item_id, valid_from, valid_to}, ...] }` | optional |
| `resolve_dispute` (keep_disputed) | `item_kind` | `item_ids[0]` | `{ "decision": "keep_disputed", "item_ids": [...] }` | optional |
| `confirm_item` | `item_kind` | `item_id` | `{}` | optional |
| `reject_item` | `item_kind` | `item_id` | `{}` | required |
| `correct_item` | `item_kind` | `predecessor_id` | `{ "corrected": <CorrectedValues>, "new_item_id": <uuid> }` | required |

`target_kind` values: `node`, `link`, `attribute`.
**Description:** A deterministic payload shape lets `compliance-audit` (`getCurationActionById`) render every action without per-operation branching beyond the `action` enum.
**Error returned:** Not applicable.

### BR-26 -- Row-level locks prevent concurrent merge / correction races
**Related UC:** UC-02, UC-04, UC-05, UC-06, UC-10
**Where to validate:** service -- every write UC issues `SELECT ... FOR UPDATE` on every row to be mutated at the START of the transaction:
- UC-02: `SELECT ... FROM knowledge_node WHERE id IN ($node_id, $target_node_id) FOR UPDATE`.
- UC-04: same shape with `(survivor_id, absorbed_id)`.
- UC-05/UC-06/UC-07: `SELECT ... FROM <table> WHERE id = ANY($item_ids::uuid[]) FOR UPDATE`.
- UC-10: `SELECT ... FROM <table> WHERE id = $predecessor_id FOR UPDATE`.

Path compression (BR-07) deliberately operates AFTER the lock; the UPDATE matches on `merged_into_node_id = $absorbed_id`, not on row ids the service knows up front. Concurrent path compressions against the same absorbed are serialised by the unique-row commit order (an UPDATE that finds no rows is a no-op).
**Description:** Implements `.spec.md` BR-20 / ADR A11. The duplicate-guard partial unique indexes detect collisions at commit; the service pre-empts them by locking. Two concurrent `correct_item` against the same predecessor serialise -- the second one's BR-22 guard rejects with 409 `BUSINESS_ITEM_NOT_DELETABLE` after the first commits.
**Error returned:** Not applicable (concurrency invariant; covered by integration tests).

### BR-27 -- `EntityMatchReview` is exposed in UC-01 but not directly mutated
**Related UC:** UC-01 (read), UC-02 / UC-03 (delete-on-resolution)
**Where to validate:** routes -- no POST/PUT/PATCH/DELETE endpoint is registered against `entity_match_review`. The DELETE inside UC-02 / UC-03 (BR-10) is internal-only.
**Description:** Implements `.spec.md` §8 ("Write endpoints for EntityMatchReview -- it is written by the ingestion resolver and READ + DELETED by curation"). Aligned with knowledge-graph BR-10 (catalog read-only) in spirit.
**Error returned:** Not applicable.

### BR-28 -- Database errors are mapped to consistent HTTP responses
**Related UC:** all
**Where to validate:** middleware -- the Fastify error handler shared with `knowledge-graph` BR-18 maps `pg` errors:
- Connection error (`ECONNREFUSED`, `ETIMEDOUT`, `57P03` `cannot_connect_now`) -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.
- Statement timeout (`57014`) -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.
- Unique violation (`23505`) on a duplicate-guard partial index -- should NEVER reach this layer (the service pre-checks BR-16). If it does, surface as 422 `BUSINESS_TEMPORAL_INCOHERENT` with the offending row id in `details` (defensive mapping).
- Foreign-key violation (`23503`) -- should NEVER reach this layer (BR-12 / BR-17 / BR-22 pre-check). If it does, surface as 500 (state inconsistency).
- Any other unhandled `pg` exception -> 500 `SYSTEM_INTERNAL_ERROR`.
**Description:** Single point of mapping; OpenAPI 422 / 500 / 503 declarations match this contract.
**Error returned:** HTTP 422 `BUSINESS_TEMPORAL_INCOHERENT` / 500 `SYSTEM_INTERNAL_ERROR` / 503 `SYSTEM_SERVICE_UNAVAILABLE` (all registered).

---

## 4. State Machine (ST)

> Mirrors `.spec.md` §5 with explicit technical guards: `FOR UPDATE` lock + status precondition + paired `superseded_at`. No new states are introduced.

### ST-01 -- KnowledgeNode (write side -- this domain)

```
                     resolveEntityMatch(keep_separate)
        +------------------------------------------+
        |   guard: locked + status='needs_review'  |
        |                                          v
   [needs_review] -- resolveEntityMatch(merge_into) -->  [merged]
        |                guard: locked + status='needs_review'
        |                       + target locked + target.status='active'
        |                       + node_type_id matches
        |                       + reason non-empty
        |
   [active] -----------+ mergeNodes (as absorbed_id)  --> [merged]
                       |        guard: both locked + both status='active'
                       |        + node_type_id matches
                       |        + survivor_id != absorbed_id
                       |        + reason non-empty
                       |
                       +--- (compliance-audit cascade) --> [deleted]
                            (NOT triggered by this domain;
                             curation returns 410 BUSINESS_NODE_DELETED)
```

| From | Event (curation) | To | Guard (technical) | UC |
|------|------------------|----|--------------------|----|
| needs_review | `resolveEntityMatch` decision=keep_separate | active | row locked `FOR UPDATE`; status='needs_review' (else 409); not 'deleted' (else 410) | UC-03 |
| needs_review | `resolveEntityMatch` decision=merge_into | merged | as above + target row locked; target.status='active' (else 422 INVALID_TARGET); target != self (else 409 SELF_MERGE); node_type matches (else 422 INVALID_TARGET); reason non-empty (else 422 REASON_REQUIRED) | UC-02 |
| active | `mergeNodes` (as absorbed_id) | merged | both rows locked; both status='active'; survivor != absorbed; node_type matches; reason non-empty | UC-04 |

> All transitions write `merged_into_node_id = $survivor` simultaneously with `status = 'merged'`. DB CHECK `(status='merged') = (merged_into_node_id IS NOT NULL)` is satisfied by construction. Path compression (BR-07) runs in the same transaction.

> The transition `(needs_review | active) -> deleted` is triggered by the `compliance-audit` cascade (`complianceDeleteRawInformation`), NOT by this domain. When curation encounters such a tombstoned row, it returns 410 `BUSINESS_NODE_DELETED` (BR-12 / `.spec.md` BR-22).

### ST-02 -- KnowledgeLink / NodeAttribute (write side -- this domain)

```
                                                                   correctItem (predecessor)
                       confirmItem                                 guard: locked + status IN
   [uncertain] -----------------------> [active] ---------------------> [superseded]
                guard: locked +              |  ^                       (superseded_at=now,
                status='uncertain'           |  | resolveDispute        valid_to UNCHANGED)
                                             |  | (prefer_one, winner)
                                             v  | resolveDispute
                                       [disputed]   (adjust_periods)
                                          |     guard: locked + all in disputed
                                          |     + scope match (BR-14)
                                          |     + periods one-to-one + semi-open
                                          |     + functional-scope <=1 open row
                                          |
                                          +--- resolveDispute(prefer_one, loser) ----> [deleted]
                                          |    (superseded_at=now)
                                          |
                                          +--- resolveDispute(keep_disputed) --> [disputed]
                                               (no row mutation)

   [active|uncertain|disputed] -- rejectItem --> [deleted]
                guard: locked + status NOT IN ('deleted','superseded')
                       + reason non-empty
                       (superseded_at=now)

   (new row)  -- correctItem (successor) --> [active]
                guard: predecessor mutation succeeded
                       + supersedes_X = predecessor_id
                       + valid_from / valid_to / valid_from_source per BR-17
                       + provenance copied (BR-19)
```

| From | Event (curation) | To | Guard (technical) | UC |
|------|------------------|----|--------------------|----|
| uncertain | `confirmItem` | active | row locked `FOR UPDATE`; status='uncertain' (else 409 ITEM_NOT_UNCERTAIN) | UC-08 |
| disputed | `resolveDispute` decision=prefer_one, winner | active | all item rows locked; all status='disputed' (else 409 ITEM_NOT_DISPUTED); scope match (else 409); winner in `item_ids` (else 422 WINNER_REQUIRED); reason non-empty | UC-05 |
| disputed | `resolveDispute` decision=prefer_one, loser | deleted | as above + status='deleted' AND superseded_at=now() in ONE statement (BR-20) | UC-05 |
| disputed | `resolveDispute` decision=adjust_periods | active | all locked; all disputed; scope match; `periods` one-to-one with item_ids (else 422 PERIODS_REQUIRED); `valid_from < valid_to` per entry (else 422 TEMPORAL_INCOHERENT); functional scope <=1 row with `valid_to=NULL` (else 422) | UC-06 |
| disputed | `resolveDispute` decision=keep_disputed | disputed | all locked; all disputed | UC-07 |
| active or uncertain or disputed | `rejectItem` | deleted | row locked; status NOT IN ('deleted','superseded') (else 409 ITEM_NOT_DELETABLE); reason non-empty; status='deleted' AND superseded_at=now() in ONE statement (BR-20) | UC-09 |
| active or uncertain or disputed | `correctItem` (predecessor) | superseded | row locked; status NOT IN ('deleted','superseded'); reason non-empty; corrected{} non-empty (BR-17); date justification supplied if `valid_from` changed; valid_to UNCHANGED on predecessor (BR-18) | UC-10 |
| (new) | `correctItem` (successor) | active | predecessor mutation succeeded; `supersedes_X = predecessor_id`; `valid_from / valid_to / valid_from_source` per BR-17; provenance copied (BR-19); confidence copied; `created_by_run_id = NULL` | UC-10 |

> The transition `(any) -> deleted` from the `compliance_delete` cascade is triggered by `compliance-audit`, NOT by this domain.

> No additional states are introduced. Derived fields (`is_current`, `is_in_effect`, `effective_status`) are read-side concerns owned by `knowledge-graph` (knowledge-graph BR-09); this domain operates on the storage axis only.

---

## 5. Domain Events (EV)

> The Segundo Cérebro architecture does **not** include an event bus (CLAUDE.md "Architecture / Backend", `knowledge-graph.back.md` §5, `ingestion.back.md` §5). Cross-domain coordination happens through synchronous service calls and through the database itself.

**N/A -- no domain events in this version.** Every write produces one `curation_action` row inside the same transaction; downstream surfaces that need to react (the SPA refresh, the LLM's follow-up action) pull the result via:

- `compliance-audit` (`getCurationActionById`, `listCurationActions`) for the audit-row read.
- `knowledge-graph` (`getNodeById`, `traverseNode`, `getLinkHistory`, `getAttributeKeyHistory`) for the post-curation node / link / attribute state.
- `query-retrieval` (`search`, `getProvenanceByFragment`) for full-text and provenance follow-up.

The §16 observability surface uses pino's structured logs (BR-28 mapping, plus the per-route counters declared in Stack section) -- not events.

A future addition of an event bus is out of scope; if introduced, the natural event payload would be `{ action_id, action, target_kind, target_id, decision?, payload, created_at }` -- exactly the `curation_action` row.

---

## 6. External Integrations

> Timeout and fallback required per integration. No fallback = operational risk -- document the decision.

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Neon Auth (Stack Auth) | REST (JWT verify via Neon Auth JWKS) | Validate the bearer token on every REST and MCP call (BR-01, A29). Shared with the other BFF modules; one JWKS cache per BFF process. JWKS endpoint: `${NEON_AUTH_URL}/.well-known/jwks.json`. Algorithm: EdDSA by default. | 2 s per JWKS fetch; JWKS cached in-process for `NEON_AUTH_JWKS_TTL_S` seconds (default 600). | None -- without a verifiable JWT, the request is rejected with 401. Cache miss + network failure -> 503 `SYSTEM_SERVICE_UNAVAILABLE`. |
| PostgreSQL 17 (Neon) | TCP (`pg` pool) | Read and write every row owned by this domain (`knowledge_node`, `node_alias`, `knowledge_link`, `node_attribute`, `provenance`, `entity_match_review`, `curation_action`) plus the read-only references (`information_fragment`, catalog tables). Connection string: `DATABASE_URL` (direct, non-pooled endpoint -- the BFF maintains its own `pg` pool). SSL required by Neon. | Statement timeout: 5 s on point reads / state-machine guards (UC-01..UC-03, UC-07..UC-09); 10 s on merge (UC-02, UC-04 -- repointing every link/attribute) and on UC-10 (provenance copy can fan out per fragment). Pool: shared with the rest of the BFF (min 2, max 10 connections per BFF instance). | None -- PostgreSQL is the single store (§2.2). Outage -> 503 `SYSTEM_SERVICE_UNAVAILABLE`. Statement timeout (SQLSTATE 57014) -> 503 (BR-28). |
| MCP transport | stdio / WebSocket (per MCP server config) | Mirror `curation` operations (`list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`) to the LLM (ADR A28). | Per-tool-call hard ceiling: 15 s (covers the §13 layered validation plus the merge/correction transaction). | None at this layer -- a slow MCP call surfaces as MCP transport timeout to the LLM; the BFF nevertheless commits or rolls back the transaction on its own deadline. |

**No LLM provider integration in this domain.** Curation is the human-in-the-loop valve; no proposal step is taken from this module. The MCP transport surfaces *to* the LLM; the LLM is the caller, not the callee.

**No cross-domain HTTP call.** Read of `information_fragment` (BR-17) is in-process SQL against the same `pg` pool, not an HTTP hop to the `ingestion` domain -- the modules share one BFF.

---

## 7. Known Technical Constraints

- **Catalog rows are read-only at runtime; mutation is migration-only.** `link_type.allows_multiple_current` and `attribute_key.allows_multiple_current` (read by BR-16 functional-scope predicate) are loaded into the in-memory catalog cache at startup; the cache is invalidated only by process restart. Catalog mutations require a migration (knowledge-graph BR-10) and a rolling restart -- there is no hot reload.
- **`unaccent()` is STABLE in Postgres.** Any normalised-text comparison in this domain uses the IMMUTABLE wrapper `immutable_unaccent` already configured by migration 0001 (CLAUDE.md "Known Gotchas"); however, this domain does not write `alias_norm` directly -- the column is `GENERATED ALWAYS STORED`, so the trap is avoided at the schema level.
- **`reject_item` and `prefer_one` losers MUST set `status='deleted'` AND `superseded_at=now()` in the same UPDATE** (BR-20). The SQL template enforces this; a future refactor that splits the UPDATE into two statements would silently re-introduce the duplicate-guard trap flagged by CLAUDE.md "Known Gotchas".
- **The `merged_into_node_id` invariant is application-enforced.** DB CHECK `knowledge_node_merged_ck` only requires `(status='merged') = (merged_into_node_id IS NOT NULL)`; it does NOT check that the target is `active`. BR-07 path compression is the only mechanism that keeps the invariant; a manual `UPDATE` outside the service layer would break it.
- **No CASCADE FK anywhere.** The data model is immutable + tombstone-based (BR-02 of `ingestion.back.md`, BR-14 of `knowledge-graph.spec.md`). Cascading deletes would defeat the audit trail; `curation_action.target_id` deliberately carries no FK because a single column would multiplex three target tables.
- **The audit row's `id` is observable only after COMMIT.** The Fastify handler issues `COMMIT` after the `INSERT INTO curation_action ... RETURNING id`, then surfaces the id as `action_id` in the response. A response with `action_id = X` guarantees the row was persisted.
- **No optimistic concurrency on rows.** Locking is pessimistic (`FOR UPDATE`); there is no `version` column or `If-Match` ETag. Single-owner usage means lock contention is rare; the only realistic conflict is between the human curator (SPA) and the LLM (MCP) acting concurrently, and the loser receives a 409 with the deterministic state-machine code.
- **The provenance copy on UC-10 can fan out.** A predecessor with N provenance rows produces N INSERTs (one statement via `INSERT ... SELECT`, but N rows). At v1 scale (§16: hundreds of fragments per node), this is bounded by the 10 s statement timeout. A pathological case (>1000 provenance rows per item) is not expected at v1; a future enhancement could batch with explicit pagination if it materialises in metrics.
- **`reason` is free-text and unbounded at the DB.** No length limit; the Zod schema accepts `z.string().trim().min(1)` and the route logs `reason.length` only (not the text -- PII / opinion). A future limit (e.g., 2000 chars) would be a non-breaking minor enhancement.
- **Merge does NOT delete the absorbed node.** The row remains with `status='merged'` and `merged_into_node_id=$survivor`; reads pass through `knowledge-graph` BR-13 (substitution). Reversal would itself be a new `mergeNodes` call going the other way (`.spec.md` §8 -- no undo).
- **`compliance_delete` belongs to `compliance-audit`.** The MCP catalog (§14.4) lists it inside the `curation` toolset; the REST split is intentional for operational clarity (`.spec.md` BR-18). The MCP toolset name is unchanged; only the REST owner differs.
- **The 10-second merge budget assumes the FK indexes of migration 0001** (`knowledge_link_source_idx`, `knowledge_link_target_idx`, `node_attribute_node_idx`, `knowledge_node_merged_idx`). Dropping or modifying any of these indexes would push UC-02 / UC-04 outside their budget; the indexes are load-bearing.
- **Neon connection lifecycle.** Neon is a managed Postgres with serverless compute; the `pg` pool keeps long-lived connections to the direct endpoint declared in `DATABASE_URL`. Cold-start latency on a scaled-to-zero Neon branch can push the first request past the 5 s budget; production deployments MUST run on a branch with min-compute > 0. CI uses an ephemeral Neon branch per pipeline run.
- **Neon Auth (Stack Auth) is the single identity provider.** `NEON_AUTH_URL` is the only origin trusted by `requireNeonAuth`; rotating the JWKS requires a process restart (the in-memory cache TTL is `NEON_AUTH_JWKS_TTL_S`, default 600 s). The legacy `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_JWKS_TTL_S` environment variables have been REMOVED; any code or deployment manifest still referencing them is a defect.

---

## 8. Out of Scope

- **Read of `CurationAction` / `ComplianceDeletion`.** Owned by `compliance-audit` (operationIds `listCurationActions`, `getCurationActionById`, `listComplianceDeletions`, `getComplianceDeletionById`). This domain WRITES the audit row but exposes no GET endpoint over it.
- **`compliance_delete` execution.** Owned by `compliance-audit` (operationId `complianceDeleteRawInformation`). The MCP catalog (§14.4) names the tool inside the `curation` toolset; on REST it lives in `compliance-audit` (`.spec.md` BR-18). This domain only observes the resulting 410 on tombstoned nodes (BR-12).
- **Read-side projections of nodes / links / attributes / history / traversal.** Owned by `knowledge-graph` (`getNodeById`, `traverseNode`, `getLinkHistory`, `getAttributeHistory`, `getAttributeKeyHistory`, `listNodes`, catalog reads). The SPA navigates via `knowledge-graph` and acts via THIS domain; no graph-read endpoints live here.
- **Full-text search and provenance walks.** Owned by `query-retrieval` (`search`, `getProvenanceByFragment`).
- **LLM-driven extraction proposals (`propose_node`, `propose_link`, `propose_attribute`).** Owned by `ingestion`. This domain disposes; it does not propose.
- **Entity-match resolver algorithm.** `EntityMatchReview` rows are WRITTEN by `ingestion` (§4.2 / A12 trigram thresholds); this domain reads and resolves them but does not own the proposal heuristic.
- **MCP `ingest` toolset.** MCP-only, exclusive to an open `LLMRun` (§14.1). Belongs to `ingestion`.
- **Embeddings / `pgvector` / semantic similarity for entity matching.** PERMANENT non-goal (§20.1, ADR A24, CLAUDE.md "Anti-patterns"). The valve for "Iniciativa Lunar" vs "Projeto Apollo" is the `entity_match` queue, not automation (`.spec.md` §8).
- **Dedicated review queues for `uncertain` / `low_confidence`.** Deferred per ADR A26 / §10.1. They remain display flags surfaced by `query-retrieval`. Promotion to a dedicated `ReviewQueueKind` is an additive future change (`.spec.md` BR-01).
- **Bulk curator operations** (multi-node merges, batch confirmations). Each endpoint acts on a single primary target. The MCP toolset (§14.4) follows the same one-call / one-action shape.
- **Reversal / undo of past curator actions.** There is no `unmerge`, `unreject`, `uncorrect`. Recovery is itself a new curator action (a counter-merge, a counter-correction); both audit rows persist (`.spec.md` §8).
- **Multi-user / role-based authorization** (`User` entity, RBAC). PERMANENT non-goal in v7 (ADR A20). The `actor_context` is implicit (owner).
- **Write endpoints for `EntityMatchReview` (CRUD).** It is written by `ingestion` and READ + DELETED here (BR-27). No direct mutation endpoint exists.
- **Event bus / message queue.** No Kafka / RabbitMQ / Supabase Realtime / Neon-native pub-sub. The database is the integration boundary (§2.2 "store único").
- **In-process caching of graph rows.** Only the catalog is cached (Stack section). `knowledge_node`, `knowledge_link`, `node_attribute`, `provenance` are read live every time -- the curator's view must reflect concurrent ingestion writes.
- **Cursor-based pagination for the queue.** UC-01 uses offset/limit only. The two queues are small by design (the human-review valve); cursors are a future enhancement.
- **Rate limiting / quota.** Single-owner; no per-tenant quota required. The 10 s statement timeout and the Postgres connection pool ceiling are the only back-pressure mechanisms.
- **Async / job-queued execution of merges or corrections.** Every write is synchronous; the 15 s MCP / 10 s SQL ceilings keep the curator's feedback loop tight.
- **Soft-delete reversal.** A row with `status='deleted'` and `superseded_at` set is terminal from this domain's perspective. A reversion would be a new ingest of the same fact (resurrecting it as a NEW row with a NEW `id`); the deleted row stays as audit evidence.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Back Spec Agent | initial | Initial back-end spec for the curation domain. Mirrors `curation.spec.md` v1.0.0 (10 UCs, 22 BRs, 2 state machines) into a Fastify + raw-`pg` write-heavy implementation on PostgreSQL 17 (Supabase Cloud), aligned with CLAUDE.md and the v7 normative source. Tables owned (write): `knowledge_node` (status / merged_into_node_id), `node_alias` (insert on merge), `knowledge_link` / `node_attribute` (status / superseded_at / lineage / new rows on correction), `provenance` (insert on correction), `entity_match_review` (delete on resolution), `curation_action` (insert one row per action). Read-only references: `information_fragment` (date justification), `link_type` / `attribute_key` (functional-scope predicate). MCP `curation` toolset (§14.4) mirrored 1:1 in REST except `compliance_delete`, which belongs to `compliance-audit` (BR-18 of `.spec.md`). All write UCs run in one transaction with `SELECT ... FOR UPDATE` locks (BR-24, BR-26); the `curation_action` row is the last SQL in the transaction so `action_id` is observable only after commit. Path compression on merge (BR-07), `valid_to` unchanged on correction predecessor (BR-18), `status='deleted' + superseded_at=now()` paired in one UPDATE (BR-20), provenance copied on correction (BR-19). Error codes consumed: AUTH_* (401), RESOURCE_NOT_FOUND (404), BUSINESS_NODE_DELETED (410), BUSINESS_REVIEW_NOT_PENDING / BUSINESS_SELF_MERGE_FORBIDDEN / BUSINESS_ITEM_NOT_DISPUTED / BUSINESS_ITEM_NOT_UNCERTAIN / BUSINESS_ITEM_NOT_DELETABLE (409), BUSINESS_TARGET_NODE_REQUIRED / BUSINESS_INVALID_TARGET_NODE / BUSINESS_DISPUTE_WINNER_REQUIRED / BUSINESS_DISPUTE_PERIODS_REQUIRED / BUSINESS_TEMPORAL_INCOHERENT / BUSINESS_CORRECTION_NO_CHANGES / BUSINESS_DATE_UNJUSTIFIED / BUSINESS_REASON_REQUIRED / VALIDATION_* (422), SYSTEM_INTERNAL_ERROR (500), SYSTEM_SERVICE_UNAVAILABLE (503) -- all were already registered in `docs/specs/_global/error-codes.md` by the spec.md author; no new entries added by this revision. | -- |
| 1.1.0 | 2026-06-12 | Back Spec Agent | update | Infrastructure migration: Supabase Cloud (Postgres + Auth) replaced by Neon (managed Postgres) + Neon Auth (Stack Auth). Schema unchanged; no migration required. Auth middleware renamed from `requireSupabaseJwt` to `requireNeonAuth`; JWKS endpoint moved to `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default). Env vars: `DATABASE_URL` replaces the Supabase Postgres connection; `NEON_AUTH_URL` replaces `SUPABASE_URL`; `NEON_AUTH_JWKS_TTL_S` replaces `SUPABASE_JWKS_TTL_S`; `SUPABASE_SERVICE_KEY` removed (Neon Auth uses JWKS-based verification, no service-key sharing required). All BR-01 references updated; §6 External Integrations rows for the JWT provider and the Postgres pool re-pointed to Neon; §7 Known Technical Constraints gained one entry for Neon connection lifecycle (cold-start risk on scaled-to-zero branches) and one entry on Neon Auth single-IDP scope. Still single-owner (ADR A20); no `User` entity introduced. No error codes added or changed. Header line and Stack table updated accordingly. | infra-migrate-neon |
