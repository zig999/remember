# Knowledge Graph -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 via Supabase Cloud (driver `pg` raw) | Version: 1.0.0 | Status: draft | Layer: permanent
> Business spec: `../knowledge-graph.spec.md`
> REST contract: `../openapi.yaml`
> MCP contract: `segundo-cerebro-modelagem-v7.md` §14.3 (toolset `query`, operations `get_node`, `traverse`, `get_history`)
> Schema: `migrations/0001_schema.sql` + `migrations/0002_seed.sql`

---

## 1. Stack and Patterns

> Declare only values that differ from or extend CLAUDE.md. Use `"CLAUDE.md default"` for aspects already covered there.

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves `openapi.yaml`) | CLAUDE.md default |
| MCP server | Same BFF process, second transport over the same service layer (ADR A28). Operations `get_node`, `traverse`, `get_history` are mirrored 1:1 in REST (`getNodeById`, `traverseNode`, `getLinkHistory` / `getAttributeHistory` / `getAttributeKeyHistory`). | CLAUDE.md default |
| ORM | None -- raw `pg` driver with parameterized queries (A6, §2.2 of v7). String concatenation of SQL is forbidden (CLAUDE.md "Security"). | CLAUDE.md default |
| Migration strategy | Versioned SQL files in `migrations/` (`0001_schema.sql`, `0002_seed.sql`). New catalog entries (`NodeType`, `LinkType`, `LinkTypeRule`, `AttributeKey`) require a new migration (§12, BR-10). This domain never issues catalog mutations from runtime. | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/knowledge-graph/`. Three internal layers per module: `routes` (Fastify handlers + Zod request/response schemas) -> `service` (orchestration, temporal-filter composition, traversal BFS, history-chain walking) -> `repository` (parameterized SQL against the views `knowledge_link_resolved`, `node_attribute_resolved` and tables `knowledge_node`, `node_alias`, `node_attribute`, `knowledge_link`, `provenance`, `node_type`, `link_type`, `link_type_rule`, `attribute_key`). | Aligned with CLAUDE.md `folder_structure: modules`. |
| Validation library | Zod v4 -- every REST DTO request/response has a Zod schema generated from the OpenAPI components. Failed Zod parse -> 422 with one of `VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE`. | CLAUDE.md default |
| Auth | Supabase Auth JWT validated by a Fastify `preHandler` middleware on every route under `/api/v1/*` owned by this module. Single-owner -- no `User` entity, no role check (BR-20 of `knowledge-graph.spec.md`, A20/A29). The Supabase service key never leaves the BFF (CLAUDE.md "Security"). PostgreSQL RLS is disabled. | CLAUDE.md default |
| Logging | `pino` structured JSON. Required fields per request: `request_id`, `route`, `node_id?`, `link_id?`, `attribute_id?`, `outcome`, `latency_ms`, `result_count` (for list / traversal endpoints). The `value` field of `node_attribute` rows is never logged (potential PII -- birth dates, contact data). | CLAUDE.md default |
| Observability | `observability_required: true`. Per-route latency histograms are emitted to the pino transport: `getNodeById`, `traverseNode`, `getLinkHistory`, `getAttributeHistory`, `getAttributeKeyHistory`, `listNodes`, plus the three `Catalog` reads. p95 budgets per CLAUDE.md "Performance Budgets / Backend". | CLAUDE.md default |
| Transaction policy | Read-only domain -- every route runs with `pool.query` in `READ ONLY` mode (Fastify `preHandler` sets `SET LOCAL transaction_read_only = ON` on the connection it acquires, then runs the queries, then releases). No `BEGIN`/`COMMIT` is required for single-statement reads, but UC-06 (traverse) and UC-09/UC-10 (history) use one explicit transaction to guarantee a stable `current_date` for all derived fields across multiple queries. | New (this domain). |
| Concurrency | None of the endpoints write; no advisory locks, no `FOR UPDATE`. Concurrent calls are serialised only by the Postgres connection pool. | New (this domain). |
| Time source | `now()` and `current_date` are taken from PostgreSQL -- never `Date.now()` in business code. Derived fields (`is_current`, `is_in_effect`, `effective_status`) are computed inside the SQL views; the BFF surfaces them as-read (BR-09 of `knowledge-graph.spec.md`, A9). | CLAUDE.md default |
| Catalog cache | Catalog tables (`node_type`, `link_type`, `link_type_rule`, `attribute_key`) are loaded into an in-process map at BFF startup; cache is invalidated only by process restart (catalogs mutate by migration, BR-10). Lookup by name (`node_type.name`, `link_type.name`, `attribute_key.key`) becomes O(1). Read endpoints (UC-01, UC-02, UC-03) bypass the cache to surface the authoritative row identifiers, but UC-04 / UC-05 / UC-06 use it to validate filter values cheaply (BR-03, BR-04). | New (this domain). |
| Pagination | Offset/limit only (per `openapi.yaml` `listNodes`). Default `limit = 20`, hard cap `limit = 100` (UC-04 alt 3b). `total` is computed by a separate `count(*)` query in the same logical request (no cursor; the catalog is small enough at v1 scale per §16). | New (this domain). |
| Testing | Vitest unit tests on (i) temporal-filter SQL builders (BR-07, BR-08), (ii) traversal BFS termination and merged-node substitution (BR-13, BR-14), (iii) history-chain walking (BR-12, BR-13), (iv) catalog-name guards (BR-03, BR-04, BR-10). Acceptance scenarios C1-C15 of v7 §17 (the subset that exercises read paths) run against the BFF. | CLAUDE.md default |

---

## 2. Data Model

> This domain READS the tables and views below; it WRITES NONE of them. Writes for `knowledge_node`, `node_alias`, `node_attribute`, `knowledge_link`, `provenance` belong to the `ingestion` and `curation` domains; catalog rows enter exclusively by migration (BR-10). Types are taken verbatim from `migrations/0001_schema.sql`.

### Table: node_type (catalog -- READ-ONLY)

> 8 rows seeded by `migrations/0002_seed.sql` (§15.1). Surfaced by UC-01 (`listNodeTypes`).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Stable -- referenced by `attribute_key.node_type_id`, `link_type_rule.{source,target}_node_type_id`, `knowledge_node.node_type_id`. |
| name | text | NOT NULL, UNIQUE | Catalog name (e.g. `Person`, `Project`). UC-03/UC-04 filter by this. |
| description | text | NOT NULL | Human-readable description (returned by `listNodeTypes`). |
| version | int | NOT NULL, DEFAULT 1 | Incremented by migration when the row is mutated; rules tied to the previous version remain valid (§12, BR-10). |

### Table: link_type (catalog -- READ-ONLY)

> 10 rows seeded by `migrations/0002_seed.sql` (§15.2). Surfaced by UC-02 (`listLinkTypes`).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Referenced by `link_type_rule.link_type_id`, `knowledge_link.link_type_id`. |
| name | text | NOT NULL, UNIQUE | Catalog name (e.g. `participates_in`, `reports_to`). Used by UC-06 `link_types[]` filter and by `getLinkById`/`getLinkHistory` join. |
| label | text | NOT NULL | Pt-BR human label. |
| description | text | NOT NULL | Human-readable description. |
| inverse_name | text | NOT NULL | Inverse-direction name used by UC-06 when `direction = in` or `both`. |
| is_temporal | boolean | NOT NULL | When `false`, links of this type carry no validity axis (BR-08 of `knowledge-graph.spec.md`). |
| allows_multiple_current | boolean | NOT NULL | Single source of truth for multiplicity (BR-05; ADR A10). |
| requires_valid_from | boolean | NOT NULL | When `true`, `ingestion` is required to provide `valid_from` plus a justification. Read here only as a label. |
| requires_valid_to_on_change | boolean | NOT NULL | When `true`, a succession must close the previous interval explicitly. Read here only as a label. |
| version | int | NOT NULL, DEFAULT 1 | Incremented by migration on mutation (§12). |

### Table: link_type_rule (catalog -- READ-ONLY)

> 22 rows seeded by `migrations/0002_seed.sql` (§15.2). Surfaced by UC-02 only when `?include_rules=true`. Read joined to `node_type` for source/target naming.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| link_type_id | uuid | NOT NULL, FK -> `link_type(id)` | The LinkType this rule applies to. |
| source_node_type_id | uuid | NOT NULL, FK -> `node_type(id)` | Allowed source NodeType. |
| target_node_type_id | uuid | NOT NULL, FK -> `node_type(id)` | Allowed target NodeType. |
| valid_from | date | NULL allowed | Rule effective from this date (NULL = `-infinity`, BR-06). |
| valid_to | date | NULL allowed | Rule effective until this date (NULL = `+infinity`). DB CHECK `valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to`. |

### Table: attribute_key (catalog -- READ-ONLY)

> 10 rows seeded by `migrations/0002_seed.sql` (§15.3). Surfaced by UC-03 (`listAttributeKeys`).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Referenced by `node_attribute.attribute_key_id`. |
| node_type_id | uuid | NOT NULL, FK -> `node_type(id)` | Scope NodeType (the same `key` may be reused under different node_type_ids; UNIQUE `(node_type_id, key)`). |
| key | text | NOT NULL | Key name (e.g. `deadline`, `email`). |
| value_type | attribute_value_type (enum) | NOT NULL | One of `date`, `number`, `text`, `bool`. Co-targeted by FK composite from `node_attribute (attribute_key_id, value_type)` (DB note 3). |
| is_temporal | boolean | NOT NULL | When `false`, attributes of this key carry no validity axis (BR-08). |
| allows_multiple_current | boolean | NOT NULL | Single source of truth for multiplicity (BR-05; A10). |
| requires_valid_from | boolean | NOT NULL | When `true`, the ingestion domain must provide `valid_from` + justification. |
| description | text | NOT NULL | Human-readable description. |
| version | int | NOT NULL, DEFAULT 1 | Incremented by migration on mutation (§12). |

### Table: knowledge_node (graph -- READ-ONLY here)

> Owner of the node lifecycle. Written by `ingestion` (entity-resolution decision) and `curation` (merge, deletion). Surfaced by UC-04 (`listNodes`), UC-05 (`getNodeById`), UC-06 (`traverseNode`).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. Path argument on every `nodes/{node_id}/...` route. |
| node_type_id | uuid | NOT NULL, FK -> `node_type(id)` | Drives BR-02 (entity-resolution scope), UC-04 filter, UC-11 attribute-key lookup. |
| canonical_name | text | NOT NULL | The chosen display name (mirrored as `kind = 'canonical'` in `node_alias`). |
| status | node_status (enum) | NOT NULL, DEFAULT `'active'` | One of `active`, `needs_review`, `merged`, `deleted` (BR-16 of `.spec.md`). |
| merged_into_node_id | uuid | NULL allowed, FK -> `knowledge_node(id)` | NOT NULL iff `status = 'merged'` (DB CHECK). Always points to an ACTIVE node (BR-09, path-compression invariant). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | First-seen timestamp. |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | Maintained by trigger `set_updated_at` (touched by `curation` writes). |

### Table: node_alias (graph -- READ-ONLY here)

> Surfaced by UC-04 prefix search and UC-05 alias listing. Owns the only `tsvector` GIN used by this domain (`node_alias_fts_idx`, configuration `simple_unaccent_v1`).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | Owning node. |
| alias | text | NOT NULL, CHECK `btrim(alias) <> ''` | Surface form of the name. |
| alias_norm | text | NOT NULL, GENERATED ALWAYS STORED `norm(alias)` | The normalized form (BR-01 of `.spec.md`). Drives UC-04 prefix lookup. |
| kind | alias_kind (enum) | NOT NULL, DEFAULT `'alias'` | `canonical` (mirror of `knowledge_node.canonical_name`) or `alias`. |
| created_by_run_id | uuid | NULL allowed, FK -> `llm_run(id)` | NULL when written by curation; not exposed by this domain (`Provenance` covers source attribution at the link/attribute level). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Surfaced in UC-05 `NodeAlias` payload. |

### View: knowledge_link_resolved (read path -- READ-ONLY)

> The standard read path for every link surfaced by this domain (UC-06, UC-07, UC-09). Derived fields are computed in the view, never stored (BR-09 of `.spec.md`, ADR A9).

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| (all `knowledge_link.*`) | -- | `kl.*` | Verbatim. |
| link_type | text | `lt.name` | Joined from `link_type`. |
| link_inverse_name | text | `lt.inverse_name` | Joined from `link_type`. Used by UC-06 direction handling. |
| is_current | boolean | view expression | `valid_to IS NULL AND superseded_at IS NULL`. |
| is_in_effect | boolean | view expression | `is_current AND (valid_from IS NULL OR valid_from <= current_date)`. UC-06 `?in_effect_only=true` filters on this. |
| effective_status | text | view expression | `CASE WHEN status='active' AND valid_to IS NOT NULL AND valid_to <= current_date THEN 'inactive' ELSE status END`. `inactive` exists ONLY in this projection (BR-09 of `.spec.md`). |

### View: node_attribute_resolved (read path -- READ-ONLY)

> The standard read path for every attribute surfaced by this domain (UC-05, UC-08, UC-10, UC-11). Same derivation pattern as `knowledge_link_resolved`.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| (all `node_attribute.*`) | -- | `na.*` | Verbatim. |
| attribute_key | text | `ak.key` | Joined from `attribute_key`. |
| key_is_temporal | boolean | `ak.is_temporal` | Surfaced so the route handler can elide validity axis fields for stable keys (BR-08). |
| key_allows_multiple_current | boolean | `ak.allows_multiple_current` | Surfaced for the UI labelling layer. |
| is_current | boolean | view expression | `valid_to IS NULL AND superseded_at IS NULL`. |
| is_in_effect | boolean | view expression | `is_current AND (valid_from IS NULL OR valid_from <= current_date)`. |
| effective_status | text | view expression | Same `inactive`-promotion expression as the link view. |

### Table: knowledge_link (graph -- READ-ONLY here; surfaced via the view above)

> Underlying storage for the link view. Owned by `ingestion` and `curation`. This domain reads `knowledge_link_resolved`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Path argument on `links/{link_id}` routes. |
| source_node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | UC-06 BFS source. |
| target_node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | UC-06 BFS target. |
| link_type_id | uuid | NOT NULL, FK -> `link_type(id)` | Joined in the view. |
| valid_from | date | NULL allowed | Validity axis start (BR-06 / BR-07). DB CHECK `valid_from < valid_to`. |
| valid_to | date | NULL allowed | Validity axis end (semi-open). |
| recorded_at | timestamptz | NOT NULL, DEFAULT `now()` | Transaction axis; ordering key for UC-09 history. |
| superseded_at | timestamptz | NULL allowed | Marks the row as transaction-axis-not-current (BR-07, BR-12 of `.spec.md`). |
| status | assertion_status (enum) | NOT NULL | One of `active`, `uncertain`, `disputed`, `superseded`, `deleted` (BR-16 of `.spec.md`). |
| confidence | numeric | NOT NULL, CHECK `[0, 1]` | Surfaced verbatim in `LinkDetail.confidence`. |
| valid_from_source | valid_from_source (enum) | NULL allowed | `stated` / `document` / `received` (A14). Required when `valid_from IS NOT NULL`. |
| created_by_run_id | uuid | NULL allowed, FK -> `llm_run(id)` | NULL for curation-created rows; surfaces in `LinkDetail.provenance` indirectly. |
| supersedes_link_id | uuid | NULL allowed, FK -> `knowledge_link(id)` | Lineage backward pointer (BR-13 of `.spec.md`). UC-09 walks this. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Internal. |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | Trigger-maintained. |

### Table: node_attribute (graph -- READ-ONLY here; surfaced via the view above)

> Underlying storage for the attribute view.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Path argument on `attributes/{attribute_id}` routes. |
| node_id | uuid | NOT NULL, FK -> `knowledge_node(id)` | UC-05 `?node_id` scope. |
| attribute_key_id | uuid | NOT NULL | Composite FK `(attribute_key_id, value_type) -> attribute_key (id, value_type)` (DB note 3). |
| value_type | attribute_value_type (enum) | NOT NULL | Denormalised from `attribute_key.value_type` (DB note 3). |
| value | text | NOT NULL | Canonical serialisation (ISO YYYY-MM-DD for `date`, dot-decimal for `number`, etc.). |
| value_date | date | GENERATED STORED `CASE WHEN value_type='date' THEN canonical_date(value) END` | Indexed for range queries (out of scope here, used by retrieval). |
| value_number | numeric | GENERATED STORED `CASE WHEN value_type='number' THEN canonical_number(value) END` | Indexed for range queries (out of scope here). |
| valid_from | date | NULL allowed | Validity axis start (BR-06 / BR-07). |
| valid_to | date | NULL allowed | Validity axis end (semi-open). |
| recorded_at | timestamptz | NOT NULL, DEFAULT `now()` | Transaction axis; ordering key for UC-10 / UC-11 history. |
| superseded_at | timestamptz | NULL allowed | Same as for `knowledge_link`. |
| status | assertion_status (enum) | NOT NULL | Same enum as `knowledge_link.status`. |
| confidence | numeric | NOT NULL, CHECK `[0, 1]` | |
| valid_from_source | valid_from_source (enum) | NULL allowed | Required when `valid_from IS NOT NULL` (DB CHECK `node_attribute_basis_ck`). |
| created_by_run_id | uuid | NULL allowed, FK -> `llm_run(id)` | NULL for curation-created rows. |
| supersedes_attribute_id | uuid | NULL allowed, FK -> `node_attribute(id)` | UC-10 walks this. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Internal. |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | Trigger-maintained. |

### Table: provenance (graph -- READ-ONLY here)

> Surfaced inside `LinkDetail.provenance[]` and `AttributeDetail.provenance[]`. Always read joined down the chain `provenance -> information_fragment -> fragment_source -> raw_chunk -> raw_information`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| link_id | uuid | NULL allowed, FK -> `knowledge_link(id)` | Exactly one of `link_id` / `attribute_id` is NOT NULL (DB CHECK `provenance_target_ck`). |
| attribute_id | uuid | NULL allowed, FK -> `node_attribute(id)` | Exactly one of `link_id` / `attribute_id` is NOT NULL. |
| fragment_id | uuid | NOT NULL, FK -> `information_fragment(id)` | The fragment that justifies the link/attribute. |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Surfaced in the embedded provenance entry. |

### Indexes (read-side)

> Justify each index with the query it optimizes. All listed indexes are CREATEd by `migrations/0001_schema.sql`; this domain adds no new indexes (read-only by spec). Every FK on the surface has its own index (CLAUDE.md "Conventions").

| Table | Fields | Type | Justification |
|-------|--------|------|---------------|
| node_type | `name` | UNIQUE btree (from `UNIQUE`) | UC-03 / UC-04 filter by `node_type` name; resolved to id via `name -> id`. |
| link_type | `name` | UNIQUE btree (from `UNIQUE`) | UC-06 `link_types[]` element-wise resolution (BR-04). |
| link_type_rule | `link_type_id` (`link_type_rule_link_type_idx`) | btree | UC-02 `?include_rules=true` groups by `link_type_id`. |
| link_type_rule | `source_node_type_id` (`link_type_rule_source_idx`) | btree | Not used by this domain at read time; kept for the upstream `ingestion` rule lookup. |
| link_type_rule | `target_node_type_id` (`link_type_rule_target_idx`) | btree | Same as above. |
| attribute_key | `(node_type_id, key)` | UNIQUE btree (from composite `UNIQUE`) | UC-03 filter by node_type; UC-11 lookup by `(node_type_id, key)`. |
| attribute_key | `node_type_id` (`attribute_key_node_type_idx`) | btree | UC-03 GROUP BY node_type. |
| knowledge_node | `node_type_id` (`knowledge_node_type_idx`) | btree | UC-04 filter by NodeType (FK index, also serves `JOIN`). |
| knowledge_node | `merged_into_node_id` (`knowledge_node_merged_idx`, partial WHERE NOT NULL) | btree | UC-06 path-compression substitution on read (BR-13 of `.spec.md`). |
| node_alias | `alias_norm` (`node_alias_norm_idx`) | btree | UC-04 `name_prefix` matches via `alias_norm LIKE norm($prefix) || '%'` (BR-01 of `.spec.md`); the btree supports left-anchored `LIKE`. |
| node_alias | `alias_norm` (`node_alias_norm_trgm_idx`) | GIN `gin_trgm_ops` | Not used by `listNodes` in v1 (BR-03 of `.spec.md`); kept for the upstream entity resolver. |
| node_alias | `to_tsvector('simple_unaccent_v1', alias)` (`node_alias_fts_idx`) | GIN | Not used by `listNodes`; the route uses `alias_norm LIKE ...` for predictable behaviour. Reserved for future name-tokenized search. |
| node_alias | partial UNIQUE `(node_id) WHERE kind='canonical'` (`node_alias_one_canonical_uq`) | UNIQUE btree | Read-side invariant: every node has at most one canonical alias; the route picks the canonical alias deterministically. |
| node_attribute | `node_id` (`node_attribute_node_idx`) | btree | UC-05 attribute listing per node; UC-11 history scope. |
| node_attribute | `attribute_key_id` (`node_attribute_key_idx`) | btree | UC-11 history filter by `(node_id, attribute_key_id)`. |
| node_attribute | `supersedes_attribute_id` (`node_attribute_supersedes_idx`) | btree | UC-10 history walk down the chain (rows where `supersedes_attribute_id = $current`). |
| knowledge_link | `source_node_id` (`knowledge_link_source_idx`) | btree | UC-06 BFS outbound edge expansion. |
| knowledge_link | `target_node_id` (`knowledge_link_target_idx`) | btree | UC-06 BFS inbound edge expansion (when `direction = in` or `both`). |
| knowledge_link | `link_type_id` (`knowledge_link_type_idx`) | btree | UC-06 `link_types[]` filter joins against `link_type_id`. |
| knowledge_link | `supersedes_link_id` (`knowledge_link_supersedes_idx`) | btree | UC-09 history walk down the chain. |
| provenance | `link_id` (`provenance_link_idx`) | btree | UC-07 / UC-09 provenance lookup by link. |
| provenance | `attribute_id` (`provenance_attr_idx`) | btree | UC-08 / UC-10 / UC-11 provenance lookup by attribute. |
| provenance | `fragment_id` (`provenance_fragment_idx`) | btree | Reverse lookup (fragment -> facts justified by it); used by retrieval, not by this domain. |

> No new indexes are created for v1.0.0. The pre-existing index set (migration `0001_schema.sql`) is sufficient for the read patterns surfaced by `openapi.yaml`. Adding any index requires a new migration (CLAUDE.md "Safety Rule").

### Relationships

> FK + on-delete strategy. Cross-domain: via ID only -- never nested objects.

| From | To | Type | FK | On Delete |
|------|----|------|----|-----------|
| node_alias.node_id | knowledge_node.id | N : 1 | `node_alias_node_id_fkey` | NO ACTION (default) -- nodes are never row-deleted; `compliance_delete` sets `status = 'deleted'` (tombstone). Cascade would defeat audit. |
| node_attribute.node_id | knowledge_node.id | N : 1 | `node_attribute_node_id_fkey` | NO ACTION -- same reasoning. |
| node_attribute.(attribute_key_id, value_type) | attribute_key.(id, value_type) | N : 1 (composite) | `node_attribute_attribute_key_id_value_type_fkey` | NO ACTION -- catalog mutation is migration-only (BR-10); no runtime delete of catalog rows. |
| node_attribute.supersedes_attribute_id | node_attribute.id | N : 1 (self) | `node_attribute_supersedes_attribute_id_fkey` | NO ACTION -- lineage is immutable. |
| knowledge_link.source_node_id | knowledge_node.id | N : 1 | `knowledge_link_source_node_id_fkey` | NO ACTION -- tombstone semantics. |
| knowledge_link.target_node_id | knowledge_node.id | N : 1 | `knowledge_link_target_node_id_fkey` | NO ACTION -- tombstone semantics. |
| knowledge_link.link_type_id | link_type.id | N : 1 | `knowledge_link_link_type_id_fkey` | NO ACTION -- catalog mutation is migration-only (BR-10). |
| knowledge_link.supersedes_link_id | knowledge_link.id | N : 1 (self) | `knowledge_link_supersedes_link_id_fkey` | NO ACTION -- lineage immutable. |
| knowledge_node.merged_into_node_id | knowledge_node.id | N : 1 (self) | `knowledge_node_merged_into_node_id_fkey` | NO ACTION -- merge is non-destructive; the loser keeps its row. |
| provenance.link_id | knowledge_link.id | N : 1 | `provenance_link_id_fkey` | NO ACTION -- links are never row-deleted. |
| provenance.attribute_id | node_attribute.id | N : 1 | `provenance_attribute_id_fkey` | NO ACTION -- attributes are never row-deleted. |
| provenance.fragment_id | information_fragment.id | N : 1 | `provenance_fragment_id_fkey` | NO ACTION -- fragments are never row-deleted. |
| attribute_key.node_type_id | node_type.id | N : 1 | `attribute_key_node_type_id_fkey` | NO ACTION -- catalog mutation is migration-only. |
| link_type_rule.link_type_id | link_type.id | N : 1 | `link_type_rule_link_type_id_fkey` | NO ACTION -- catalog mutation is migration-only. |
| link_type_rule.source_node_type_id | node_type.id | N : 1 | `link_type_rule_source_node_type_id_fkey` | NO ACTION -- catalog mutation is migration-only. |
| link_type_rule.target_node_type_id | node_type.id | N : 1 | `link_type_rule_target_node_type_id_fkey` | NO ACTION -- catalog mutation is migration-only. |
| knowledge_node.node_type_id | node_type.id | N : 1 | `knowledge_node_node_type_id_fkey` | NO ACTION -- catalog mutation is migration-only. |

**No CASCADE anywhere.** The data model is immutable + tombstone-based (BR-02 of `ingestion.back.md`, BR-14 of `.spec.md`); cascading deletes would silently destroy audit lineage and contradict the §13 anti-hallucination guarantee.

---

## 3. Business Rules (BR)

> Every BR references at least one UC of `knowledge-graph.spec.md`. The numbering here is independent from `.spec.md` (which carries its own BR-01..BR-20 expressing business invariants); this section translates the read-side concerns into the validation layer that enforces them and the error code returned on violation.

### BR-01 -- All endpoints require a valid Supabase JWT
**Related UC:** UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11
**Where to validate:** middleware -- a single Fastify `preHandler` (`requireSupabaseJwt`) is registered on the `/api/v1/*` scope owned by this module. The hook fetches the JWKS from Supabase (cached 10 min), verifies the `Authorization: Bearer <jwt>` header, and rejects before any DB access (BR-20 of `.spec.md`, A29).
**Description:** Missing header -> `AUTH_UNAUTHORIZED`. Malformed/unsignable token -> `AUTH_TOKEN_INVALID`. Expired `exp` -> `AUTH_TOKEN_EXPIRED`. The Supabase service key never leaves the BFF.
**Error returned:** HTTP 401 -- error.code: `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` (all registered).

### BR-02 -- Path UUIDs are syntactically validated before DB lookup
**Related UC:** UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11
**Where to validate:** routes -- Zod schema with `z.string().uuid()` on each path parameter (`{node_id}`, `{link_id}`, `{attribute_id}`). Failure is surfaced before the controller runs.
**Description:** A path segment that does not parse as a UUID v4 short-circuits to a 422 (no DB query is issued).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT` (registered).

### BR-03 -- `node_type` query parameter must exist in the catalog
**Related UC:** UC-03, UC-04
**Where to validate:** service -- before SQL, the service looks the value up in the in-memory catalog cache (Stack section). Cache miss -> 422.
**Description:** A non-existent NodeType name fails fast; the route never JOINs `node_type` blindly.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_UNKNOWN_NODE_TYPE` (registered, Knowledge Graph table).

### BR-04 -- `link_types[]` query elements must each exist in the catalog
**Related UC:** UC-06
**Where to validate:** service -- the route iterates `link_types[]` (Fastify `style: form, explode: true`) and resolves each to a UUID via the catalog cache. The first miss aborts with 422 carrying the offending name in `details.link_type`.
**Description:** Validation precedes BFS; an unknown name fails the request before any traversal is started.
**Error returned:** HTTP 422 -- error.code: `BUSINESS_UNKNOWN_LINK_TYPE` (registered).

### BR-05 -- Traversal depth is bounded [1, 3]
**Related UC:** UC-06
**Where to validate:** routes -- Zod schema `z.number().int().min(1).max(3).default(1)` on `depth`. Service additionally re-asserts the range immediately before the BFS scheduler is built (defence in depth against future refactors).
**Description:** Out-of-range -> 422 (BR-18 of `.spec.md`, ADR A16).
**Error returned:** HTTP 422 -- error.code: `BUSINESS_INVALID_TRAVERSE_DEPTH` (registered).

### BR-06 -- `as_of` query parameter must be an ISO calendar date
**Related UC:** UC-05, UC-06
**Where to validate:** routes -- Zod schema `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).pipe(z.coerce.date())`. Failure -> 422.
**Description:** The service passes the parsed value as a PostgreSQL `date` parameter; format is fixed at YYYY-MM-DD (no offsets, no times).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT` (registered).

### BR-07 -- Default read filter is query (a): current view
**Related UC:** UC-05, UC-06, UC-07, UC-08
**Where to validate:** repository -- a single SQL helper `applyTemporalFilter(qb, { asOf?, inEffectOnly? })` is the only place that composes the WHERE clause. When `asOf` is undefined, the helper appends `AND valid_to IS NULL AND superseded_at IS NULL` (BR-07 of `.spec.md`). When `inEffectOnly = true`, it additionally requires `(valid_from IS NULL OR valid_from <= ${currentDate})`.
**Description:** Every read path that surfaces a list of `node_attribute` or `knowledge_link` rows uses this helper; ad-hoc WHERE clauses are forbidden.
**Error returned:** Not applicable (read-path consistency).

### BR-08 -- `as_of` activates query (b): valid-time travel
**Related UC:** UC-05, UC-06
**Where to validate:** repository -- when `asOf` is provided, `applyTemporalFilter` appends `AND superseded_at IS NULL AND (valid_from IS NULL OR valid_from <= $asOf) AND (valid_to IS NULL OR valid_to > $asOf)` (BR-08 of `.spec.md`).
**Description:** Query (c) (system-time travel) is NEVER composed by this domain (BR-09 of `.spec.md`, ADR A25 -- permanently deferred).
**Error returned:** Not applicable.

### BR-09 -- Derived fields are read from the resolved views only
**Related UC:** UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11
**Where to validate:** repository -- every SQL that selects `is_current`, `is_in_effect`, `effective_status` reads from `knowledge_link_resolved` / `node_attribute_resolved` (never recomputes them in the BFF). The view expressions are the single source of truth (BR-09 of `.spec.md`, A9).
**Description:** Recomputation in TypeScript would drift from the view as `current_date` changes; the view is the boundary.
**Error returned:** Not applicable (architectural invariant).

### BR-10 -- Catalog is read-only at the API surface
**Related UC:** UC-01, UC-02, UC-03
**Where to validate:** routes -- no `POST` / `PATCH` / `PUT` / `DELETE` is registered for the catalog paths (`/api/v1/node-types`, `/api/v1/link-types`, `/api/v1/attribute-keys`). The OpenAPI file documents only `GET` operations (BR-17 of `.spec.md`).
**Description:** New catalog rows enter exclusively via versioned SQL migrations (§12). Any PR introducing a catalog mutation endpoint must be rejected.
**Error returned:** Not applicable (absence-of-code invariant).

### BR-11 -- 404 vs 410 for deleted nodes
**Related UC:** UC-05, UC-11
**Where to validate:** service -- when reading a `knowledge_node` row, the service inspects `status` after the row is found. `status = 'deleted'` -> 410. `status IN ('active', 'needs_review', 'merged')` -> proceed (UC-05 returns `merged_into_node_id` in that case). Row not found (no row) -> 404.
**Description:** The differentiator is "row exists but is tombstoned" vs "row absent". The two are not interchangeable -- a 404 implies the id never existed; a 410 acknowledges past existence and explains its removal.
**Error returned:** HTTP 404 -- error.code: `RESOURCE_NOT_FOUND`; HTTP 410 -- error.code: `BUSINESS_NODE_DELETED` (registered).

### BR-12 -- History chain walking is fully bidirectional
**Related UC:** UC-09, UC-10, UC-11
**Where to validate:** repository -- the `walkLineage(table, anchorId)` helper issues a recursive CTE that, starting from `anchorId`, follows both directions:
```sql
WITH RECURSIVE up AS (
  SELECT * FROM <view> WHERE id = $1
  UNION
  SELECT t.* FROM <view> t JOIN up ON t.id = up.supersedes_<kind>_id
), down AS (
  SELECT * FROM <view> WHERE id = $1
  UNION
  SELECT t.* FROM <view> t JOIN down ON t.supersedes_<kind>_id = down.id
)
SELECT * FROM up UNION SELECT * FROM down ORDER BY recorded_at ASC;
```
The helper is parameterised by `<view>` (`knowledge_link_resolved` or `node_attribute_resolved`) and `<kind>` (`link` or `attribute`).
**Description:** A consumer that anchors mid-chain still receives the full chain (BR-13 of `.spec.md`).
**Error returned:** Not applicable (read-path correctness; covered by unit tests).

### BR-13 -- Traversal substitutes merged nodes with their survivor
**Related UC:** UC-06
**Where to validate:** service -- after each BFS hop's result set is materialised, the service joins the candidate endpoints with `knowledge_node` and, for each row where `status = 'merged'`, swaps the id by `merged_into_node_id` (which is always ACTIVE by invariant, BR-14 of `.spec.md`). The traversal NEVER enqueues a `merged` node for further expansion.
**Description:** The substitution happens entirely in the service layer; the underlying `knowledge_link_resolved` view does not encode it. The substitution is **transparent** -- the response shows the survivor id and name as if the link had been written against it from the start.
**Error returned:** Not applicable (read-path semantics).

### BR-14 -- Traversal scores follow exponential decay
**Related UC:** UC-06
**Where to validate:** service -- each link returned by the BFS receives `score = 0.5 ** hop` where `hop` is the 1-based distance from the starting node. Constant `TRAVERSAL_DECAY = 0.5` lives in `modules/knowledge-graph/traversal/config.ts` (ADR A16). The score is a pure function of `hop`; this domain does not compute textual scores (those live in retrieval).
**Description:** A hop-1 link has score `0.5`, hop-2 `0.25`, hop-3 `0.125`. Same constant is used by retrieval's graph-expansion step (cross-domain contract).
**Error returned:** Not applicable.

### BR-15 -- Listing nodes excludes deleted nodes by default
**Related UC:** UC-04
**Where to validate:** service -- when `status` query parameter is absent, the service appends `AND status = 'active'` to the WHERE clause. The caller can opt into other statuses by passing `?status=needs_review|merged|deleted` (Zod enum on the route).
**Description:** The default is `active`; explicitly passing `?status=deleted` is a legitimate audit query and is allowed.
**Error returned:** Not applicable.

### BR-16 -- Provenance chain is assembled in one SQL query per item
**Related UC:** UC-07, UC-08, UC-09, UC-10, UC-11
**Where to validate:** repository -- a single SQL per item (or one batched SQL per request when multiple items are present) joins `provenance -> information_fragment -> fragment_source -> raw_chunk -> raw_information`. The shape returned is `ProvenanceEntry` (per `openapi.yaml`). The `excerpt` field is computed in SQL via `substring(rc.text from rc.offset_start + 1 for rc.offset_end - rc.offset_start)` -- offsets are 0-based, semi-open, so the 1-based PostgreSQL `substring` is offset by +1 (CLAUDE.md "Known Gotchas" / A22).
**Description:** No N+1 queries; provenance is always batched.
**Error returned:** Not applicable.

### BR-17 -- Empty provenance is logged as an operational alarm
**Related UC:** UC-07, UC-08, UC-09, UC-10, UC-11
**Where to validate:** service -- after assembling the response, the service iterates the result items. For each `LinkDetail` / `AttributeDetail` whose `provenance` array is empty AND whose `status` is not `deleted` (a deleted row is allowed to have lost its provenance to compliance), pino emits a structured WARN entry with `{ route, item_id, status }`. The response itself is returned as-is (200) -- this is an observability concern, not a client-facing error.
**Description:** Empty provenance on a non-deleted row indicates legacy-data inconsistency (per BR-19 of `.spec.md`); the read path stays unbroken for the owner while the alarm flags the inconsistency for operator triage.
**Error returned:** Not applicable (logged, not returned to client).

### BR-18 -- Database errors are mapped to consistent HTTP responses
**Related UC:** all
**Where to validate:** middleware -- a single Fastify error handler maps `pg` errors:
- Connection error (`ECONNREFUSED`, `ETIMEDOUT`, `57P03` (`cannot_connect_now`)) -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.
- Statement timeout (`57014`) -> 503 `SYSTEM_SERVICE_UNAVAILABLE`.
- Any other unhandled `pg` exception -> 500 `SYSTEM_INTERNAL_ERROR`.
**Description:** The mapping is the single point that the OpenAPI 503 / 500 responses correspond to.
**Error returned:** HTTP 500 -- error.code: `SYSTEM_INTERNAL_ERROR`; HTTP 503 -- error.code: `SYSTEM_SERVICE_UNAVAILABLE` (both registered).

### BR-19 -- Pagination ranges are enforced at the route layer
**Related UC:** UC-04
**Where to validate:** routes -- Zod schema on `limit` (`int().min(1).max(100).default(20)`) and `offset` (`int().min(0).default(0)`). Out-of-range surfaces before the service runs.
**Description:** The default and bounds match the OpenAPI declaration; bumping the cap requires an OpenAPI update and an explicit BR amendment.
**Error returned:** HTTP 422 -- error.code: `VALIDATION_OUT_OF_RANGE` (registered).

### BR-20 -- `key` path segment is resolved against the node's NodeType
**Related UC:** UC-11
**Where to validate:** service -- on `getAttributeKeyHistory`, the service first reads `knowledge_node` by `node_id` (404 / 410 per BR-11), then resolves `(node_type_id, key)` via the catalog cache. Cache miss -> 404 `BUSINESS_UNKNOWN_ATTRIBUTE_KEY`.
**Description:** The 404 (not 422) is by spec -- the segment is a resource identifier in the URL hierarchy, not a free query parameter (`knowledge-graph.spec.md` UC-11 alt 3c).
**Error returned:** HTTP 404 -- error.code: `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` (registered).

### BR-21 -- `include_uncertain=false` filters by `status`, never by flag
**Related UC:** UC-05
**Where to validate:** repository -- when the query parameter resolves to `false`, the SQL appends `AND status <> 'uncertain'`. The route never inspects the `flags` array for this filter -- `flags` is a derived display marker, not a queryable predicate.
**Description:** `uncertain` is a real `assertion_status` value (BR-16 of `.spec.md`); excluding it relies on the storage column, not on the cosmetic flag. The `flags` array on the response always reflects the row's actual state regardless of the filter.
**Error returned:** Not applicable.

### BR-22 -- `direction = both` issues two BFS halves and dedupes
**Related UC:** UC-06
**Where to validate:** service -- `direction = both` is implemented as two independent BFS scans: one outbound (`source_node_id = current`) and one inbound (`target_node_id = current`). Results are merged by `link.id`; if a link appears in both halves it is kept once (no double counting). Node deduping uses `node.id` after merged-node substitution (BR-13).
**Description:** This is a single decomposed traversal -- the OpenAPI envelope is one `TraversalResult`, not two.
**Error returned:** Not applicable.

---

## 4. State Machine (ST)

> The state machines below are owned by the writers (`ingestion`, `curation`, `compliance`); this domain is READ-ONLY. The tables here are reproduced verbatim from `knowledge-graph.spec.md` §5 to make the read-side payload mapping explicit. No additional technical guards are introduced.

### ST-01 -- KnowledgeNode (read-side projection)

| From | To | Event (external) | Guard | UC (read-side) |
|------|----|------------------|-------|----------------|
| (new) | active | `ingestion` resolver: no match | confidence < 0.55 against all candidates | UC-04, UC-05 (returns `status='active'`, `merged_into_node_id=NULL`) |
| (new) | needs_review | `ingestion` resolver: ambiguous | candidate in `[0.55, 0.85)` or >=2 candidates >=0.85 | UC-04 (default filter excludes; explicit `?status=needs_review` includes), UC-05 (returns `status='needs_review'`) |
| needs_review | active | `curation.resolve_entity_match` (`keep_separate`) | curation guard | UC-05 (returns `status='active'`) |
| needs_review | merged | `curation.resolve_entity_match` (`merge_into`) | curation guard; `merged_into_node_id` set to ACTIVE node (path compression) | UC-05 (returns `status='merged'` + `merged_into_node_id`), UC-06 (substitutes survivor, BR-13) |
| active | merged | `curation.merge_nodes` | merged loser; `merged_into_node_id` set to ACTIVE survivor | UC-05, UC-06 |
| any | deleted | `compliance.compliance_delete` | only fact-rows traced exclusively to the deleted `raw_information` | UC-05 / UC-11 return 410 `BUSINESS_NODE_DELETED` (BR-11) |

**Read-side terminal:** none -- a `deleted` node still has an id that can be looked up (returns 410); a `merged` node is reachable (returns 200 with the pointer).

### ST-02 -- KnowledgeLink / NodeAttribute (read-side projection)

| From | To | Event (external) | Guard | UC (read-side) |
|------|----|------------------|-------|----------------|
| (new) | active | `ingestion.propose_link` / `propose_attribute` | `confidence >= 0.75` | UC-07, UC-08 |
| (new) | uncertain | `ingestion.propose_*` | `0.40 <= confidence < 0.75` | UC-07, UC-08 (rows returned with `status='uncertain'` and `flags=['uncertain']`) |
| active | superseded | `ingestion` succession (6.5-A) | new row created with `valid_from = change_date`; predecessor `valid_to = change_date`, `superseded_at = now()` | UC-09, UC-10 (history shows both versions ordered ASC by `recorded_at`) |
| active | superseded | `ingestion` / `curation` correction (6.5-B) | predecessor `valid_to` UNCHANGED, `superseded_at = now()`; successor has corrected period | UC-09, UC-10 (history shows the correction) |
| active | disputed | `ingestion` conflict (6.5-C) | overlapping functional values | UC-07, UC-08 (rows returned with `status='disputed'`, `flags=['disputed']`) |
| active / uncertain | deleted | `curation.reject_item` or `compliance.compliance_delete` | row marked with `superseded_at = now()` AND `status='deleted'` (CLAUDE.md "Known Gotchas") | UC-07, UC-08 (the deleted row is still returned -- `effective_status = 'deleted'`) |
| uncertain | active | `ingestion` corroboration or `curation.confirm_item` | additional provenance crosses the 0.75 floor | UC-07, UC-08 |
| disputed | active | `curation.prefer_one` (winner) or `adjust_periods` | curation chooses | UC-07, UC-08 |
| disputed | deleted | `curation.prefer_one` (loser) | curation chooses | UC-07, UC-08 |
| disputed | disputed | `curation.keep_disputed` | curation chooses | UC-07, UC-08 |

**Derived state on read (already in `.spec.md` §5, repeated here for completeness):**

| Derived field | Formula | Stored? |
|---------------|---------|---------|
| `is_current` | `valid_to IS NULL AND superseded_at IS NULL` | NO (view) |
| `is_in_effect` | `is_current AND (valid_from IS NULL OR valid_from <= current_date)` | NO (view) |
| `effective_status` | `CASE WHEN status='active' AND valid_to IS NOT NULL AND valid_to <= current_date THEN 'inactive' ELSE status END` | NO (view) |

**Read-side invariants:**
- A `deleted` row is still readable; the client decides whether to surface it. `compliance.compliance_delete` is the only path that produces it (besides curation `reject_item`).
- A `superseded` row's `superseded_at` is the marker that excludes it from query (a); query (b) (`as_of`) ignores `superseded_at`.

---

## 5. Domain Events (EV)

> The Segundo Cérebro architecture does **not** include an event bus (CLAUDE.md "Architecture / Backend", `ingestion.back.md` §5). Cross-domain coordination happens through synchronous service calls and through the database itself.

**N/A -- no domain events in this version.** This domain is READ-ONLY; it observes the writes performed by `ingestion`, `curation`, and `compliance` purely through the underlying tables and views. Any downstream surface that needs to react to graph changes (cache invalidation, dashboard refresh) polls or re-reads via the endpoints documented in `openapi.yaml`.

The §16 observability surface uses pino's structured logs (BR-17, BR-18) emitted by this module's middleware, not events.

---

## 6. External Integrations

> Timeout and fallback required per integration. No fallback = operational risk -- document the decision.

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Supabase Auth | REST (JWT verify via Supabase JWKS) | Validate the bearer token on every REST and MCP call (BR-01, A29). | 2 s per JWKS fetch; JWKS cached in-process for 10 min. | None -- without a verifiable JWT, the request is rejected with 401. Cache miss + network failure -> 503 `SYSTEM_SERVICE_UNAVAILABLE`. |
| PostgreSQL 17 (Supabase Cloud) | TCP (`pg` pool) | Read all rows surfaced by this domain (catalog + graph + provenance + raw chain). | Statement timeout: 5 s on point reads (UC-05, UC-07, UC-08); 10 s on traversal (UC-06) and history (UC-09, UC-10, UC-11); 5 s on listings (UC-04). Pool: min 2, max 10 connections per BFF instance (shared with the rest of the BFF). | None -- PostgreSQL is the single store (§2.2). Outage -> 503 `SYSTEM_SERVICE_UNAVAILABLE`. Statement timeout (SQLSTATE 57014) -> 503 (BR-18). |
| MCP transport | stdio / WebSocket (per MCP server config) | Mirror `query` operations (`get_node`, `traverse`, `get_history`) to the LLM (ADR A28). | Per-tool-call hard ceiling: 10 s (same as the REST traversal budget). | None at this layer -- a slow MCP call surfaces as MCP transport timeout to the LLM; the BFF nevertheless completes or aborts the SQL on its own deadline. |

**No LLM provider integration in this domain.** This domain is read-only and never originates LLM calls. The MCP transport surfaces *to* the LLM; the LLM is the caller, not the callee.

---

## 7. Known Technical Constraints

- **Read-only by spec.** This module owns no INSERT / UPDATE / DELETE statement. A PR introducing a write against any owned table must be rejected (BR-10). Writes for these tables live in `ingestion`, `curation`, and `compliance`.
- **No row-level security.** Supabase RLS is disabled (A29); authorization is BFF-enforced via JWT (BR-01). The service key never leaves the BFF process.
- **Derived fields are tied to `current_date` of the Postgres session.** For multi-statement traversal (UC-06) and history (UC-09, UC-10, UC-11), the service opens a single explicit transaction so all SQL inside the request observes the same `current_date`. Single-statement reads (UC-05 point read, UC-07, UC-08) do not need this -- one statement implies one snapshot.
- **Catalog cache is invalidated only by process restart.** Catalog tables mutate by migration (BR-10), so the rolling-restart accompanying every catalog migration is the canonical cache invalidation. Hot-reloading the catalog at runtime is out of scope.
- **`unaccent()` is STABLE in Postgres.** UC-04 prefix lookups call `norm(name_prefix)` via the IMMUTABLE wrapper `immutable_unaccent` already configured by migration 0001 (CLAUDE.md "Known Gotchas").
- **Provenance excerpts use 1-based `substring`.** Postgres `substring(string FROM start FOR length)` is 1-based; the chunk's `offset_start` is 0-based (A22). The BR-16 SQL adds `+1` to compensate. A future re-chunking version that changes this convention requires a new chunking_version and a coordinated read-path change.
- **Traversal is BFS with explicit per-hop materialisation, not recursive SQL.** A recursive CTE would not allow the merged-node substitution + score assignment in the same pass; the service runs `depth` rounds of bounded SQL, deduping nodes between rounds. At v1 scale (hundreds of nodes per starting hop), this is well within the 1-second p95 budget.
- **No depth-3 fan-out cap.** UC-06 with `depth=3` could theoretically reach the entire connected component of a hub node. The 10-second statement timeout (BR-18) is the only hard safety net; a future revision may add a per-hop result cap (deferred until §16 metrics surface a real risk).
- **`Intl.Collator` is not used.** Sorting by `recorded_at` (UC-09, UC-10, UC-11) and `canonical_name` (UC-04) relies on Postgres' `ORDER BY` with the database default collation; the BFF does not re-sort in TypeScript.
- **`include_rules=true` of UC-02 is O(LinkType x LinkTypeRule).** At v1 (10 link types, 22 rules), the join returns at most 22 rows; no pagination is needed. A future catalog growth past hundreds of rules would warrant adding `?link_type=<name>` filter -- not in v1.0.0.
- **The 10-second traversal budget assumes the index set of migration 0001.** Dropping or modifying `knowledge_link_source_idx` / `knowledge_link_target_idx` would push UC-06 outside its p95 budget; the indexes are load-bearing.

---

## 8. Out of Scope

- **Write endpoints for `KnowledgeNode`, `NodeAlias`, `NodeAttribute`, `KnowledgeLink`, `Provenance`.** Belong to `ingestion` and `curation` domains.
- **Catalog mutation endpoints (NodeType, LinkType, LinkTypeRule, AttributeKey).** Migration-only (§12 of v7, BR-10).
- **Full-text retrieval (`search`).** Owned by the `retrieval` domain (§7.2 + 14.3 of v7). This domain exposes only point reads and graph traversal.
- **Compliance deletion execution (`compliance_delete`).** Owned by the `compliance` domain (§11). This domain only reads the resulting 410 for tombstoned nodes (BR-11).
- **Curation operations (`resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`).** Owned by the `curation` domain (§10 + 14.4).
- **MCP `ingest` toolset.** MCP-only, exclusive to an open `LLMRun` (§14.1). Belongs to `ingestion`.
- **Embeddings / `pgvector` / semantic search.** PERMANENT non-goal (§20.1, ADR A24, CLAUDE.md "Anti-patterns").
- **System-time travel (query (c) of §5.3).** Permanently deferred per ADR A25. `recorded_at` is stored on every row so the capability can be added later without migration or back-fill; this domain will not expose a `system_time_at` parameter in v1.0.0.
- **Levenshtein / synonym dictionaries / paraphrase matching.** Deliberately excluded -- trigram (`pg_trgm`) is the only fuzzy signal in the system (BR-03 of `.spec.md`, ADR A3). `listNodes` v1 exposes only exact / prefix lookups (BR-03 of `.spec.md`).
- **Dedicated review queues for `uncertain` / `low_confidence`.** Deferred per ADR A26. These appear as `flags` in `AttributeDetail` / `LinkDetail`, not as a separate listing endpoint.
- **Multi-user / role-based authorization (`User` entity, RBAC).** PERMANENT non-goal in v7 (ADR A20). `actor_context` is implicit (owner).
- **Event bus / message queue.** No Kafka / RabbitMQ / Supabase Realtime. The database is the integration boundary (§2.2 "store único").
- **Rate limiting / quota.** Single-owner; no per-tenant quota required. The 10-second statement timeout and the Postgres connection pool ceiling are the only back-pressure mechanisms.
- **Async / job-queued traversal.** UC-06 is synchronous; depth is capped at 3 to keep latency inside the 1-second p95 budget.
- **In-process caching of node / link / attribute rows.** Only the catalog is cached (Stack section). Graph rows are read live every time -- writes by `ingestion` / `curation` must be immediately visible (no stale-read window).
- **Cursor-based pagination.** UC-04 uses offset/limit only. At v1 scale (hundreds of nodes per filter), offset pagination is adequate; cursors are a future enhancement.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Back Spec Agent | initial | Initial back-end spec for the knowledge-graph domain. Mirrors `knowledge-graph.spec.md` v1.0.0 (11 UCs, 20 BRs, 2 state machines) into a Fastify + raw-`pg` read-only implementation on PostgreSQL 17 (Supabase Cloud), aligned with CLAUDE.md and the v7 normative source. Tables read (no ownership of writes): `node_type`, `link_type`, `link_type_rule`, `attribute_key`, `knowledge_node`, `node_alias`, `node_attribute`, `knowledge_link`, `provenance`. Read paths route through the resolved views `knowledge_link_resolved` and `node_attribute_resolved` to derive `is_current` / `is_in_effect` / `effective_status` (ADR A9). MCP `query` toolset (`get_node`, `traverse`, `get_history`) is mirrored 1:1 by the REST surface (ADR A28). All error codes referenced (`AUTH_*`, `VALIDATION_*`, `RESOURCE_NOT_FOUND`, `BUSINESS_NODE_DELETED`, `BUSINESS_UNKNOWN_NODE_TYPE`, `BUSINESS_UNKNOWN_LINK_TYPE`, `BUSINESS_INVALID_TRAVERSE_DEPTH`, `BUSINESS_UNKNOWN_ATTRIBUTE_KEY`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_SERVICE_UNAVAILABLE`) were already registered in `docs/specs/_global/error-codes.md` by the spec.md author; no new entries added by this revision. | -- |
