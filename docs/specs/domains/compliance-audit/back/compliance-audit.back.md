# Compliance & Audit -- Back-end Spec

> Stack: Node.js 20 LTS + TypeScript strict + Fastify | DB: PostgreSQL 17 via Neon (managed Postgres, driver `pg` raw) | Version: 1.3.0 | Status: draft | Layer: permanent
> Business spec: `../compliance-audit.spec.md`
> REST contract: `../openapi.yaml`
> MCP contract: `remember-modelagem-v7.md` §14.4 (toolset `curation`, tool `compliance_delete` only — every other curation tool is owned by the `curation` domain). As of v1.2.0 the eight curation tools (the seven owned by `curation` + the `compliance_delete` owned here) are surfaced over the SAME MCP write-side transport `POST /api/v1/mcp/curation` (registered by `curation/mcp/curation-transport.ts`); this domain remains the sole owner of the `compliance_delete` HANDLER (`compliance-audit/mcp/compliance-toolset.ts`), which is admitted to that transport via the closed whitelist of 8 names (`curation.back.md` BR-29 / BR-31).
> Schema: `migrations/0001_schema.sql` lines 185-194 (`raw_information`), 197-212 (`raw_chunk`), 248-262 (`information_fragment`), 264-270 (`fragment_source`), 323-373 (`node_attribute`), 376-411 (`knowledge_link`), 415-432 (`provenance`), 452-462 (`curation_action`), 465-473 (`compliance_deletion`).

---

## 1. Stack and Patterns

> Declare only values that differ from or extend CLAUDE.md. Use `"CLAUDE.md default"` for aspects already covered there.

| Aspect | Value | Note |
|--------|-------|------|
| Language | TypeScript 5.x strict | CLAUDE.md default |
| Runtime | Node.js 20 LTS | CLAUDE.md default |
| HTTP framework | Fastify + `@fastify/swagger` (serves `openapi.yaml`) | CLAUDE.md default |
| MCP server | Same BFF process. **Three MCP transports coexist** (ADR A28, single core / multiple transports; `curation.back.md` Stack row): (i) the **ingest** transport `POST /api/v1/mcp` owned by `ingestion` (write-side, audited, requires `X-LLM-Run-Id`); (ii) the read-only **query** transport `POST /api/v1/mcp/query` owned by `knowledge-graph` + `query-retrieval`; (iii) the write-side **curation** transport `POST /api/v1/mcp/curation` owned by `curation` (`curation.back.md` BR-29). This domain mounts exactly one MCP tool — `compliance_delete` of toolset `curation` (§14.4) — and it is admitted by the `curation` transport via the closed whitelist of 8 names. The handler lives here (`backend/src/modules/compliance-audit/mcp/compliance-toolset.ts`); the transport is OWNED by `curation`. The handler stays envelope-producing and keeps its §14 canonical-code mapping (`STRUCTURAL_INVALID` / `NOT_FOUND` / `INTERNAL` — BR-15) — it is the only tool on the curation transport that uses the §14 canonical code set instead of the rich REST taxonomy (`curation.back.md` BR-30 last paragraph; v7 §14 / A28 reconciliation). | CLAUDE.md default |
| ORM | None — raw `pg` driver with parameterized queries (A6, §2.2 of v7). String concatenation of SQL is forbidden (CLAUDE.md "Security"). | CLAUDE.md default |
| Migration strategy | Versioned SQL files in `migrations/`. No new migration is introduced by this domain — `compliance_deletion` and `curation_action` tables are already created by `0001_schema.sql` lines 452-473. The MCP curation transport is purely additive at the Fastify layer (`curation.back.md` Migration strategy row); no schema, index, view, function, trigger, enum, or seed mutation is required by v1.2.0 of this spec either. | CLAUDE.md default |
| Architecture pattern | Monolith modular: `backend/src/modules/compliance-audit/`. Three internal layers per module: `routes` (Fastify route handlers + Zod request/response schemas) → `service` (`complianceDelete`, `listComplianceDeletions`, `getComplianceDeletionById`, `listCurationActions`, `getCurationActionById`) → `repository` (parameterized SQL against the writable table `compliance_deletion` + the shared tables it cascades over — `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`, and the read-only `curation_action`). One thin `mcp/` sub-folder owns the `compliance_delete` MCP tool handler (`compliance-toolset.ts`) — it registers a tool under the `curation` toolset key on the shared `McpServer` registry; the `curation` domain owns the JSON-RPC transport (`POST /api/v1/mcp/curation`) that dispatches to it (BR-14, BR-15). | Aligned with CLAUDE.md "folder_structure: modules". |
| Cross-domain writes | This is the **only** module in the system permitted to issue `UPDATE` statements against `raw_information` (including the v1.3.0 `original_input` column — see BR-04), `raw_chunk`, `information_fragment`, `knowledge_link` and `node_attribute` rows that already exist. The other domains' repositories own `INSERT` and the status transitions that belong to their own lifecycle; this module owns the tombstone path of UC-01 (BR-02 carve-out of `ingestion.back.md`, BR-12 here). The `compliance-audit.repository` therefore co-owns these tables in a strictly write-after-tombstone capacity. The `curation_action` row that UC-01 writes (BR-08) is co-tenant with the `curation` domain's writes on the same table — both writers obey the schema's append-only contract (BR-13). | New (this domain). |
| Validation library | Zod v4 — every REST DTO and the MCP `compliance_delete` input has a Zod schema. Failed Zod parse on REST → 422 with one of `VALIDATION_REQUIRED_FIELD` / `VALIDATION_INVALID_FORMAT` / `VALIDATION_OUT_OF_RANGE`. Failed Zod parse on MCP → envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }` (BR-14, BR-15). The MCP envelope code stays §14-canonical for `compliance_delete` because the existing tool / spec / SDK clients depend on it and the handler is the only tool on the curation transport that uses the canonical code set (`curation.back.md` BR-30 last paragraph). | CLAUDE.md default |
| Auth | Neon Auth (Stack Auth) JWT validated by a Fastify `preHandler` middleware (`requireNeonAuth`) on every route under `/api/v1/compliance/*` and `/api/v1/audit/*` and on every call to the MCP `compliance_delete` tool. The middleware is the same singleton registered on `/api/v1/curation/*` (curation REST), on `/api/v1/mcp` (ingest), on `/api/v1/mcp/query` (query) and on `/api/v1/mcp/curation` (curation MCP) — single-owner is enforced uniformly across the BFF. Tokens are verified against the JWKS published at `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA by default); the JWKS is cached in-process for `NEON_AUTH_JWKS_TTL_S` seconds. No service key is held by the BFF — Neon Auth is purely an OIDC/JWT verifier. PostgreSQL RLS is disabled (A29). Single-owner — no `User` entity, no role check, no `actor_id` column on audit rows (BR-11). Auth failures (missing/invalid JWT) on the curation MCP transport surface as the standard REST 401 BEFORE tool dispatch — never as an MCP envelope error (consistent with BR-15 and `curation.back.md` BR-01). | CLAUDE.md default |
| Logging | `pino` structured JSON. Required fields per request/tool call: `request_id`, `route` or `tool_name`, `transport` (`rest` for the REST surface; `mcp.curation` for the MCP curation transport, matching `curation.back.md` Logging row), `raw_information_id?`, `compliance_deletion_id?`, `outcome` (`deleted` / `noop_already_deleted` / error code), `affected.{chunks,fragments,links,attributes}` on success, `latency_ms`. The `reason` text is logged at `info` level (audit-relevant); the `RawInformation.content` body is never logged at any level (CLAUDE.md "Security"). | CLAUDE.md default |
| Observability | `observability_required: true`. Two new operational alarms emitted as `pino` `error` log lines (no separate metrics store): (a) UC-01 alt `4c` "legacy tombstoned raw without ComplianceDeletion row" → alarm key `compliance.legacy_orphan_tombstone`; (b) UC-01 alt `9a` "cascade transaction rollback" → alarm key `compliance.cascade_rollback`. These are read off the structured log by the operator dashboard. The pino log line carries the `transport` label so REST and MCP curation paths can be calibrated independently (matches `curation.back.md` Observability row — `transport` label on every counter / histogram). | New (this domain). |
| Transaction policy | UC-01 (`complianceDeleteRawInformation`) runs the entire flow (load + tombstone + cascade + `compliance_deletion` insert + `curation_action` insert) in a **single** PostgreSQL transaction at READ COMMITTED isolation, opened by the route handler (REST) or by the MCP tool handler (MCP curation transport). The service layer receives the live `client` as its first argument; commit is reached only after BR-08 has written both audit rows. Both transports go through the SAME service function and produce the SAME pair of audit rows (ADR A28 single-core; BR-14). The four read endpoints (UC-02..UC-05) use the pool directly with no explicit `BEGIN` — every read is a single auto-committed `SELECT`. | Extension of CLAUDE.md "Backend / pg raw". |
| Concurrency | UC-01 holds `SELECT ... FOR UPDATE` on the target `raw_information` row from step 4 of the main flow until commit (BR-02). No advisory lock is needed — the row-level lock on the unique `raw_information.id` PK serializes concurrent `complianceDeleteRawInformation` calls against the same target. Concurrent calls against **different** targets proceed in parallel. The lock semantics are transport-invariant: a REST `complianceDeleteRawInformation` and an MCP `compliance_delete` against the same target race on the same row lock; the loser observes `status='deleted'` on its `FOR UPDATE` read and returns the idempotent `noop_already_deleted` (BR-03). | Extension of CLAUDE.md "Conventions". |
| Time source | `now()` provided by PostgreSQL — never `Date.now()` in business code. `compliance_deletion.executed_at` and the cascaded `superseded_at` columns are all assigned in a single SQL expression evaluated server-side, so all rows of one cascade share the same timestamp (CLAUDE.md "Conventions", §5.4, A9). | CLAUDE.md default |
| Idempotency primitive | Pre-write read of `raw_information.status` under `FOR UPDATE` (BR-02, BR-03). There is no DB UNIQUE on `compliance_deletion.raw_information_id` (schema lines 465-471 only declare an index for FK lookup); idempotency is enforced by the application after the `FOR UPDATE` read decides which branch (`deleted` vs `noop_already_deleted`) to take. The primitive is transport-invariant (BR-14). | New (this domain). |
| Body limit | All routes use the Fastify platform default `bodyLimit` (1 MiB). `ComplianceDeleteRequest` is bounded by `reason ≤ 1000 chars` plus a UUID — far below the default. The curation MCP transport inherits the BFF-wide 11 MiB body limit declared in `app.ts`; `compliance_delete` arguments are unaffected. | CLAUDE.md default |
| Hashing | None — this domain neither produces nor verifies `content_hash` (it preserves the value present on the row — BR-04). | CLAUDE.md default |
| Testing | Vitest unit tests on: (a) BR-03 idempotency (second call returns the same `ComplianceDeletion` row, no second `CurationAction` row); (b) BR-06 fragment cascade (cross-source fragments survive); (c) BR-07 link/attribute cascade (cross-source provenance survives); (d) BR-08 (one CurationAction row per `deleted` outcome, zero on `noop_already_deleted`); (e) BR-10 `action` filter enum; (f) BR-13 (no UPDATE/DELETE endpoint reaches audit tables); (g) BR-14 MCP envelope shape parity with REST; (h) BR-18 — `tombstoneRawInformation` redacts `original_input` together with `content` in the same UPDATE (non-null → `'[REDACTED]'`; null → null preserved). Acceptance suite scenario C15 of v7 §17 is the end-to-end test of UC-01. **REST↔MCP parity integration test** for `compliance_delete` (BR-14, mirroring `curation.back.md` BR-32 / `knowledge-graph` TC-04): one logical `complianceDeleteRawInformation` call is issued over REST `POST /api/v1/compliance/deletions` and over the curation MCP transport `POST /api/v1/mcp/curation` with `tools/call name=compliance_delete` against the same seeded fixture; assert (i) same `ComplianceDeletion` row materialised in DB; (ii) byte-identical `outcome` discriminated union (`deleted` / `noop_already_deleted`) after stripping the transport envelope; (iii) on forced-error cases (missing JWT pre-dispatch on MCP returns the standard REST 401, not an MCP envelope error; missing `raw_information_id` → REST 404 `RESOURCE_NOT_FOUND` / MCP envelope `NOT_FOUND`; legacy orphan tombstone → REST 500 `SYSTEM_INTERNAL_ERROR` / MCP envelope `INTERNAL`) the surfaced `error.code` matches the §14 canonical mapping documented in BR-15; (iv) one `curation_action` row written per `deleted` outcome on BOTH transports. | CLAUDE.md default |

---

## 2. Data Model

> Exact database types as defined in `migrations/0001_schema.sql`. This domain **owns** two tables for writes: `compliance_deletion` (INSERT only — BR-13) and `curation_action` (INSERT only by this domain for `action = 'compliance_delete'`; the `curation` domain INSERTs the other seven action types onto the same table). It **mutates by status transition** five tables owned by other domains: `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute` — all five mutations happen exclusively inside the UC-01 transaction (BR-12). It **reads** `provenance` and `fragment_source` to compute the cascade scope.

### Table: compliance_deletion

> Append-only audit of every `compliance_delete` execution that produced `outcome = "deleted"` (§11, BR-08, BR-13). Idempotent no-op (`outcome = "noop_already_deleted"`) does NOT write to this table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| raw_information_id | uuid | NOT NULL, FK → `raw_information(id)` | Target of the deletion. The corresponding `raw_information` row has `status = 'deleted'` (BR-05) and `content = '[REDACTED]'` (BR-04). |
| reason | text | NOT NULL | Free-text justification (≤ 1000 chars enforced by Zod at the API layer — BR-01). Source: `ComplianceDeleteRequest.reason`. |
| executed_at | timestamptz | NOT NULL, DEFAULT `now()` | Server-side `now()` at INSERT — equal to the `superseded_at` value cascaded to derived rows in the same transaction. |
| affected | jsonb | NOT NULL, DEFAULT `'{}'::jsonb` | Shape `{ chunks: int >= 0, fragments: int >= 0, links: int >= 0, attributes: int >= 0 }` — the four cascade counters computed inside the transaction (BR-06, BR-07). Stored verbatim; the API layer re-validates the shape with Zod on read. |

### Table: curation_action

> System-wide audit trail of every curation tool call (§3.5). This domain WRITES one row per `compliance_delete` (`outcome = "deleted"`) — BR-08; the `curation` domain WRITES one row per `resolve_entity_match` / `merge_nodes` / `resolve_dispute` / `confirm_item` / `reject_item` / `correct_item` (`curation.back.md` BR-24 / BR-25). This domain READS every row (UC-04, UC-05). Mono-user model — no actor column (BR-11).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, DEFAULT `gen_random_uuid()` | Primary key. |
| action | text | NOT NULL | Curation tool name. For this domain's writes: always the literal string `'compliance_delete'`. The column is plain `text` (no DB enum or CHECK — schema line 454), so the filter validation of UC-04 lives in the API layer (BR-10). The 7-name vocabulary written by the `curation` domain + the `'compliance_delete'` literal written here form the closed v1 list. |
| target_kind | text | NOT NULL | Kind of the targeted entity. For this domain's writes: always `'raw_information'`. The `curation` domain writes `'node'`, `'link'`, `'attribute'` per `curation.back.md` BR-25. |
| target_id | uuid | NULL allowed | UUID of the target. For this domain's writes: always the deleted `raw_information.id`. The column is nullable to support future actions that target multiple entities (e.g. `merge_nodes`) where the payload lists them (§3.5, schema comment line 456). |
| payload | jsonb | NOT NULL, DEFAULT `'{}'::jsonb` | Verbatim arguments of the call. For this domain: `{ reason: <same as ComplianceDeleteRequest.reason>, affected: { chunks, fragments, links, attributes } }`. The duplication of `reason` is intentional (BR-08) — the audit reader filtering by `action` must not have to join to `compliance_deletion`. |
| reason | text | NULL allowed | Free-text reason. NOT NULL for this domain's writes (`compliance_delete` is destructive, §10.2 — BR-01). May be null for non-destructive curation calls (e.g. `confirm_item`, per `curation.back.md` BR-11). |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Server-side `now()` at INSERT. In a UC-01 `deleted` transaction, equal to `compliance_deletion.executed_at` and to the cascaded `superseded_at` (single `now()` per transaction by Postgres semantics inside one statement, and the BFF issues both INSERTs back-to-back inside the same TX). |

### Tables mutated by status transition (owned by other domains)

> No new columns. This domain only writes `(status, superseded_at)` updates inside the UC-01 transaction. The full schema of these tables is documented in `ingestion.back.md` §2 and `knowledge-graph.back.md` §2.

| Table | Column written | Value | Triggered by | Owning BR |
|-------|----------------|-------|--------------|-----------|
| raw_information | content | `'[REDACTED]'` (10-char literal, UTF-8) | UC-01 step 5 | BR-04 |
| raw_information | metadata | jsonb-merged with `{"compliance_deleted": true}` | UC-01 step 5 | BR-04 |
| raw_information | original_input | `CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]' END` (null stays null; non-null becomes the literal `[REDACTED]`) | UC-01 step 5 | BR-04, BR-18 |
| raw_information | status | `'deleted'` (cast to node_status — schema lines 104-105) | UC-01 step 5 | BR-05 |
| raw_information | superseded_at | `now()` | UC-01 step 5 | BR-05 |
| raw_chunk | status | `'deleted'` | UC-01 step 6 (all chunks of the raw) | BR-06 |
| raw_chunk | superseded_at | `now()` | UC-01 step 6 | BR-06 |
| information_fragment | status | `'deleted'` (fragment_status enum — schema line 102) | UC-01 step 6 (only when ALL `fragment_source` rows of the fragment anchor chunks of the deleted raw) | BR-06 |
| information_fragment | superseded_at | `now()` | UC-01 step 6 | BR-06 |
| knowledge_link | status | `'deleted'` (assertion_status enum — schema line 110) | UC-01 step 6 (only when ALL `provenance` rows of the link reference fragments of the deleted raw) | BR-07 |
| knowledge_link | superseded_at | `now()` | UC-01 step 6 | BR-07 |
| node_attribute | status | `'deleted'` | UC-01 step 6 (same predicate as knowledge_link) | BR-07 |
| node_attribute | superseded_at | `now()` | UC-01 step 6 | BR-07 |

> **`raw_information.status`, `raw_information.superseded_at` and (v1.3.0) `raw_information.original_input` are NOT present in `migrations/0001_schema.sql` lines 185-194 as written today.** The schema today has only `id`, `source_type`, `content`, `storage_ref`, `content_hash`, `received_at`, `metadata`. The `status` and `superseded_at` columns of BR-05 are committed in `compliance-audit.spec.md` BR-05 (and in CLAUDE.md "Known Gotchas") but are not yet in the SQL. **This back-spec assumes those two columns will be added in a follow-up migration (see §7 Known Technical Constraints).** Until that migration ships, the implementation MUST add `ALTER TABLE raw_information ADD COLUMN status node_status NOT NULL DEFAULT 'active'; ALTER TABLE raw_information ADD COLUMN superseded_at timestamptz;` as part of the same migration that introduces this module. The v1.3.0 `original_input` column lands in a separate aditive migration (`migrations/0002_original_input.sql`, owned by `ingestion.back.md` BR-34) — `ALTER TABLE raw_information ADD COLUMN original_input text` (nullable, no default, no backfill). This domain DEPENDS on that migration: BR-18 cannot be implemented until the column exists. The two migrations are independent and may land in either order; UC-01 ships when BOTH are applied. The implementation group must not ship UC-01 without those columns.

### Tables read but not mutated

| Table | Reason it is read | Read by |
|-------|-------------------|---------|
| provenance | UC-01 BR-07 — walk `link_id` / `attribute_id` ↔ `fragment_id` to decide tombstone scope | UC-01 cascade |
| fragment_source | UC-01 BR-06 — walk `fragment_id` ↔ `raw_chunk_id` to decide which fragments lose ALL their anchors | UC-01 cascade |
| raw_information | UC-01 BR-02 — `FOR UPDATE` lock; BR-04 / BR-05 — UPDATE target. UC-02 — joined into the result via `raw_information_id` already on `compliance_deletion`; UC-04 — joined when `target_kind = 'raw_information'`. | UC-01, UC-02, UC-04 |

### Indexes

> Justify each index with the query it optimizes. Corresponds to predictable queries from the five endpoints. Every FK has its own index (CLAUDE.md "Conventions"). Index names and definitions are taken verbatim from `migrations/0001_schema.sql`.

| Table | Fields | Type | Justification |
|-------|--------|------|---------------|
| compliance_deletion | id | PK btree (implicit) | UC-03 `getComplianceDeletionById` lookup. |
| compliance_deletion | raw_information_id | btree (`compliance_deletion_raw_idx`, line 473) | (a) UC-01 BR-03 idempotency lookup: "given a `raw_information_id` whose status is `deleted`, find the existing `ComplianceDeletion` row to return verbatim". (b) UC-02 `raw_information_id` filter on `listComplianceDeletions`. By application invariant BR-03 there is at most one row per `raw_information_id`, but the index is plain (not UNIQUE) by schema decision — the BFF is the enforcer (UC-01 alt `4c` exists precisely to log+alarm when this invariant is broken in legacy data). |
| compliance_deletion | executed_at | (no dedicated index) | UC-02 default ordering is `executed_at DESC`. At the §16 scale (rare destructive operations — measured in tens per year), a sequential scan + sort is acceptable; no index is added in v1.0.0. **If the audit volume grows beyond a few hundred rows, add `CREATE INDEX compliance_deletion_executed_idx ON compliance_deletion (executed_at DESC)` in a follow-up migration.** Documented in §7. |
| curation_action | id | PK btree (implicit) | UC-05 `getCurationActionById` lookup. |
| curation_action | (target_kind, target_id) | composite btree (`curation_action_target_idx`, line 462) | UC-04 filter combination `(target_kind=..., target_id=...)` — also covers `(target_kind=...)` alone via prefix-matching. UC-04 alt `3b` / `3c` ranges over these columns; the composite index serves both. |
| curation_action | created_at | (no dedicated index) | UC-04 default ordering is `created_at DESC`. Same rationale as `compliance_deletion.executed_at` — index deferred until volume justifies it. Documented in §7. |
| curation_action | action | (no dedicated index) | UC-04 `action` filter is enum-validated at the API layer (BR-10) to one of 7 strings. At v1 scale a sequential scan filtering by `action = 'compliance_delete'` returns within the §16 budget. **If audit volume justifies it, add `CREATE INDEX curation_action_action_idx ON curation_action (action)`.** Documented in §7. |

### Relationships

> FK + on-delete strategy. Cross-domain: via ID only — never nested objects.

| From | To | Type | FK | On Delete |
|------|----|------|----|-----------|
| compliance_deletion.raw_information_id | raw_information.id | N : 1 | `compliance_deletion_raw_information_id_fkey` | NO ACTION (default) — `raw_information` is never physically deleted (BR-13 mirror of `ingestion.back.md` BR-02); the tombstone is a status transition, not a row delete. Cascade is unnecessary and would defeat audit (BR-13). |
| curation_action.target_id | (no FK) | — | none | The `curation_action.target_id` column is plain `uuid` with **no foreign key** — the column points to one of `node`, `link`, `attribute`, `fragment`, `raw_information` depending on `target_kind` (schema line 456). The integrity guarantee is BFF-enforced: the writer (this domain for `compliance_delete`; `curation` domain for the other six tools) populates `(target_kind, target_id)` only from a row it has just locked + verified. Read paths handle dangling `target_id` defensively (return the row as-is — the audit log MUST survive even when the targeted entity later changes status). |

**No CASCADE anywhere in this domain.** Audit data is immutable by design (BR-13); compliance deletion is a status transition (BR-04, BR-05, BR-06, BR-07), not a row delete.

---

## 3. Business Rules (BR)

> Every BR references at least one UC of `compliance-audit.spec.md`. This section translates each business rule into the validation layer that enforces it and the error code returned on violation. Rule wording is condensed; canonical wording lives in `compliance-audit.spec.md` §4.

### BR-01 -- Compliance delete requires a non-empty reason
**Related UC:** UC-01
**Where to validate:** controller (Zod schema on `ComplianceDeleteRequest`). `reason: z.string().trim().min(1).max(1000)`. After `btrim`, length must be in `[1, 1000]`. The DB column `compliance_deletion.reason` is `text NOT NULL` (schema line 468) and serves as the safety net.
**Description:** `reason` is required, non-empty after trim, ≤ 1000 chars (§10.2 — destructive operations require a justification).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_REQUIRED_FIELD` (when absent) or `VALIDATION_OUT_OF_RANGE` (when empty-after-trim or > 1000 chars). On MCP: envelope `{ ok: false, error.code: "STRUCTURAL_INVALID" }` (BR-14).

### BR-02 -- Compliance delete runs in a single transaction with FOR UPDATE
**Related UC:** UC-01
**Where to validate:** service (`complianceAudit.service.complianceDelete`). The Fastify route handler (REST) or the MCP tool handler (curation MCP transport — `compliance-audit/mcp/compliance-toolset.ts`) opens the transaction (`client.query('BEGIN')`); the service receives the live `client` as its first argument. First DB statement inside the TX: `SELECT id, status FROM raw_information WHERE id = $1 FOR UPDATE`. All subsequent statements of UC-01 steps 5-8 reuse the same `client`. The handler issues `COMMIT` on success and `ROLLBACK` on any thrown exception. Both transports use the SAME `withTransaction` helper (`compliance-audit/service/transaction.ts`), so the lifecycle is transport-invariant.
**Description:** Either the entire cascade and both audit rows commit together, or nothing commits. No partial cascade is observable.
**Error returned:** No direct error for the rule itself. A failure within the TX surfaces as UC-01 alt `9a` → HTTP 500 `SYSTEM_INTERNAL_ERROR` (REST) / MCP envelope `INTERNAL` (BR-15).

### BR-03 -- Compliance delete is idempotent on raw_information_id
**Related UC:** UC-01 alt `4b`
**Where to validate:** service. Right after the `FOR UPDATE` of BR-02, inspect `raw_information.status`. If `'deleted'`, run a `SELECT * FROM compliance_deletion WHERE raw_information_id = $1 LIMIT 1`. If exactly one row is found, ROLLBACK the (otherwise still-empty) transaction and return HTTP 200 `{ outcome: "noop_already_deleted", deletion: <row> }` (REST) / MCP envelope `{ ok: true, result: { outcome: "noop_already_deleted", deletion: <row> } }`. If zero rows are found, fall through to BR-04 (the legacy-inconsistency path of UC-01 alt `4c`). No new `compliance_deletion` row and no new `curation_action` row are written in the no-op path.
**Description:** The endpoint is safe to retry. There is **no DB UNIQUE** on `compliance_deletion.raw_information_id` — the application enforces "at most one" via the `FOR UPDATE` of BR-02 plus the status check. Idempotency is transport-invariant — a REST 200 and an MCP `ok:true` carry the same business outcome (`curation.back.md` BR-32 parity rule 1 / BR-14 here).
**Error returned:** None — this is the HTTP 200 / MCP success path.

### BR-04 -- Tombstoned content is the literal string `[REDACTED]`
**Related UC:** UC-01
**Where to validate:** service. The UPDATE statement is:
```sql
UPDATE raw_information
   SET content        = '[REDACTED]',
       metadata       = metadata || jsonb_build_object('compliance_deleted', true),
       status         = 'deleted',
       superseded_at  = now(),
       original_input = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]' END
 WHERE id = $1;
```
`content_hash` is **deliberately left untouched** — it stays as `sha256(<original content>)` so a future `ingestRawInformation` of the same bytes still resolves to this row by `content_hash` UNIQUE and the ingestion layer correctly returns `outcome = "noop_existing"` against the tombstoned row (`ingestion.back.md` BR-09).

`original_input` (v1.3.0; nullable column added by `migrations/0002_original_input.sql` to capture the verbatim user turn that triggered a directed chat ingestion — `ingestion.back.md` BR-34) IS redacted in the **same** UPDATE — see BR-18 for the full rule. The CASE expression preserves `NULL` for rows ingested outside the chat (where the column was never populated) and rewrites any non-null verbatim turn to the literal `[REDACTED]`. The redaction is atomic with the `content` redaction (single statement, single transaction — BR-02) so an outside reader can never observe a state where `content = '[REDACTED]'` but `original_input` still holds the verbatim turn.
**Description:** Exactly 10 UTF-8 characters (`[REDACTED]`), no surrounding whitespace, no quotes. `metadata.compliance_deleted = true` is set via JSON merge — preserves any other metadata keys. `original_input` follows the same 10-character literal when non-null (BR-18).
**Error returned:** None directly — failure of the UPDATE surfaces via BR-02 rollback and UC-01 alt `9a` → HTTP 500 / MCP `INTERNAL`.

### BR-05 -- The raw becomes status = 'deleted' with superseded_at = now()
**Related UC:** UC-01
**Where to validate:** service — included in the same UPDATE shown in BR-04. Aligns with CLAUDE.md "Known Gotchas": `reject_item` / `compliance_delete` MUST write `superseded_at = now()` to leave the partial-duplicate guard and the `is_current` filter — without it the row stays "current" per the `knowledge_link_resolved` / `node_attribute_resolved` views.
**Description:** After the UPDATE, the row is no longer eligible for `is_current = true` in any resolved view.
**Error returned:** None directly.

### BR-06 -- Fragment cascade ignores cross-source fragments
**Related UC:** UC-01
**Where to validate:** service. After UPDATE-ing `raw_information` and `raw_chunk`, the service issues a single statement to tombstone only the qualifying fragments:
```sql
UPDATE information_fragment AS f
   SET status        = 'deleted',
       superseded_at = now()
 WHERE EXISTS (
         SELECT 1 FROM fragment_source fs
           JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
          WHERE fs.fragment_id = f.id
            AND rc.raw_information_id = $1)
   AND NOT EXISTS (
         SELECT 1 FROM fragment_source fs
           JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
           JOIN raw_information ri ON ri.id = rc.raw_information_id
          WHERE fs.fragment_id = f.id
            AND ri.id <> $1
            AND ri.status <> 'deleted')
   AND f.status <> 'deleted'
RETURNING f.id;
```
The `count(RETURNING)` is the `affected.fragments` value of BR-08.
**Description:** A fragment is tombstoned only when **every** chunk in its `fragment_source` set belongs to the raw being deleted **and** no surviving chunk from a different non-deleted raw is anchored. Mirrors v7 §11.
**Error returned:** None directly.

### BR-07 -- Link/Attribute cascade ignores cross-source provenance
**Related UC:** UC-01
**Where to validate:** service. Two parallel UPDATEs against `knowledge_link` and `node_attribute` (executed sequentially on the same TX), with symmetric predicates:
```sql
UPDATE knowledge_link AS kl
   SET status        = 'deleted',
       superseded_at = now()
 WHERE EXISTS (SELECT 1 FROM provenance p
                 JOIN information_fragment f ON f.id = p.fragment_id
                 JOIN fragment_source fs ON fs.fragment_id = f.id
                 JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                WHERE p.link_id = kl.id
                  AND rc.raw_information_id = $1)
   AND NOT EXISTS (SELECT 1 FROM provenance p
                     JOIN information_fragment f ON f.id = p.fragment_id
                     JOIN fragment_source fs ON fs.fragment_id = f.id
                     JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id
                     JOIN raw_information ri ON ri.id = rc.raw_information_id
                    WHERE p.link_id = kl.id
                      AND ri.id <> $1
                      AND ri.status <> 'deleted')
   AND kl.status <> 'deleted'
RETURNING kl.id;
```
The same shape applies to `node_attribute` (replace `p.link_id = kl.id` with `p.attribute_id = na.id` and the target column accordingly). `RETURNING` counts feed `affected.links` and `affected.attributes`.
**Description:** A `knowledge_link` / `node_attribute` is tombstoned only when **every** provenance row attached to it points to a fragment whose chain anchors **only** chunks of the raw being deleted. Mirrors v7 §11 and acceptance scenario C15.
**Error returned:** None directly.

### BR-08 -- compliance_delete writes one ComplianceDeletion and one CurationAction
**Related UC:** UC-01
**Where to validate:** service. In the same TX, after BR-06 and BR-07 have produced the four counters, the service issues:
```sql
INSERT INTO compliance_deletion (raw_information_id, reason, affected)
VALUES ($1, $2, jsonb_build_object(
  'chunks', $3, 'fragments', $4, 'links', $5, 'attributes', $6))
RETURNING id, executed_at;
```
followed by:
```sql
INSERT INTO curation_action (action, target_kind, target_id, payload, reason)
VALUES ('compliance_delete', 'raw_information', $1, jsonb_build_object(
  'reason', $2,
  'affected', jsonb_build_object(
    'chunks', $3, 'fragments', $4, 'links', $5, 'attributes', $6)), $2);
```
**Description:** Exactly one row in each audit table per `outcome = "deleted"` response. Zero rows in either table per `outcome = "noop_already_deleted"` response (BR-03). Transport-invariant: BOTH transports write exactly one of each (mirrors `curation.back.md` BR-32 audit-parity rule).
**Error returned:** None directly. If either INSERT fails, the TX rolls back (BR-02) and UC-01 alt `9a` returns HTTP 500 / MCP `INTERNAL`.

### BR-09 -- Audit reads honor the semi-open time-range filters
**Related UC:** UC-02, UC-04
**Where to validate:** repository. `executed_from`/`created_from` is INCLUSIVE; `executed_to`/`created_to` is EXCLUSIVE — mirrors A7 (`[start, end)` project-wide convention).
- `listComplianceDeletions`: SQL fragment `AND executed_at >= $f AND executed_at < $t`, with each bound omitted when the corresponding parameter is `undefined`.
- `listCurationActions`: same shape on `created_at`.
**Description:** When only one bound is provided, the other side is unconstrained.
**Error returned:** None directly. If the API receives `from > to`, the Zod refinement rejects with HTTP 422 `VALIDATION_OUT_OF_RANGE` (UC-02 alt `3c`, UC-04 alt `3d`).

### BR-10 -- listCurationActions validates the action filter
**Related UC:** UC-04
**Where to validate:** controller. Zod schema for query parameter `action`: `z.enum(["resolve_entity_match","merge_nodes","resolve_dispute","confirm_item","reject_item","correct_item","compliance_delete"]).optional()`. Failed parse → HTTP 422 `VALIDATION_INVALID_FORMAT` (UC-04 alt `3a`). The DB column is `text` (schema line 454, no enum/CHECK), so this enum is enforced ONLY at the API layer of this endpoint — rows produced by future versions with new tool names are filtered out by this enum (acceptable, since the enum is the v1.0 contract for the SPA).
**Description:** Only the 7 curation tool names of §14.4 are accepted as filter values. The seven names are the exact union of the closed whitelist of 8 names on the curation MCP transport (`curation.back.md` BR-29 / BR-31) minus the read-only `list_review_queue` which does NOT audit (`curation.back.md` BR-25 has no entry for `list_review_queue`).
**Error returned:** HTTP 422 -- error.code: `VALIDATION_INVALID_FORMAT`.

### BR-11 -- Audit rows record no actor
**Related UC:** UC-01..UC-05
**Where to validate:** repository — `compliance_deletion` and `curation_action` schemas (schema lines 452-473) have no `actor_id` column. Single-owner model (§2.3, A20). The "who" of every audit row is the JWT subject of the request that produced it — and that subject is always the data owner. No INSERT path in this module reads `request.user.id` to populate any column.
**Description:** Multi-tenant support is a permanent non-goal (§20.3).
**Error returned:** Not applicable (schema invariant).

### BR-12 -- Only compliance-audit mutates raw_information after creation
**Related UC:** UC-01
**Where to validate:** code review + module boundary. The `compliance-audit.repository` is the only repository in the BFF that exposes a function emitting `UPDATE raw_information SET ...`. The `ingestion.repository` exposes only `INSERT INTO raw_information ...` (`ingestion.back.md` BR-02). A reviewer who finds an `UPDATE raw_information` in any other module must reject the PR — the BR-12 carve-out is exclusive to UC-01 of this domain. The carve-out applies equally to the REST and MCP transports — both go through the same service / repository (BR-02, BR-14).
**Description:** No code path of any other domain modifies `raw_information.{content, metadata, status, superseded_at}`. Mirrors `ingestion.back.md` BR-02 carve-out.
**Error returned:** Not applicable (architectural invariant).

### BR-13 -- Audit rows are append-only and immutable
**Related UC:** UC-01..UC-05
**Where to validate:** repository — `compliance-audit.repository` exposes no `UPDATE compliance_deletion` / `DELETE FROM compliance_deletion` / `UPDATE curation_action` / `DELETE FROM curation_action` function. The five endpoints of `openapi.yaml` are all GET or POST (`compliance_delete` only). No PATCH/PUT/DELETE route exists. There are no DB triggers on either audit table.
**Description:** Once written, an audit row is read-only forever — foundation of principle 1 of §18 ("the original information is never lost — except controlled, audited deletion") applied to the audit log itself.
**Error returned:** Not applicable (architectural invariant).

### BR-14 -- compliance_delete is mirrored as MCP tool with shared service layer
**Related UC:** UC-01
**Where to validate:** code structure. The REST handler `routes/compliance.deletions.post.ts` (mounted at `POST /api/v1/compliance/deletions`) and the MCP handler `mcp/compliance-toolset.ts` (registered as the eighth tool on the curation MCP transport `POST /api/v1/mcp/curation` — see `curation.back.md` BR-29 / BR-31) both call into the same `complianceAudit.service.complianceDelete(client, { rawInformationId, reason })` function. Inputs are validated with the same Zod schema (`ComplianceDeleteRequestSchema`). The service is transport-agnostic: it returns a discriminated union `{ outcome: 'deleted' | 'noop_already_deleted', deletion: ComplianceDeletion }`. The REST handler maps `'deleted'` to HTTP 201 and `'noop_already_deleted'` to HTTP 200. The MCP handler wraps both into `{ ok: true, result: <union> }`.

**Transport wiring (v1.2.0).** The MCP handler is REGISTERED by this domain on the shared `McpServer` registry under the `curation` toolset key (`registerComplianceToolset` in `app.ts` line 251, unchanged). The DISPATCH happens on the `curation` MCP transport — `backend/src/modules/curation/mcp/curation-transport.ts` mounts `POST /api/v1/mcp/curation`, builds its closed whitelist of 8 names from the union of `CURATION_TOOL_NAMES` (the seven curation tools, owned by `curation`) plus the singleton `'compliance_delete'` (owned here), and routes the `tools/call name=compliance_delete` to the handler this domain registered. The handler stays envelope-producing as written today (lines 53-128 of `compliance-toolset.ts` — Zod parse, `withTransaction`, `complianceDelete`, `{ ok: true, result }` / `{ ok: false, error }`); no rewrite is required by v1.2.0. The transport's `tools/list` advertises `compliance_delete` alongside the seven curation tools via the descriptor the `curation` transport receives at boot.

App-wiring: `registerComplianceToolset` (in `app.ts`, unchanged) registers the handler on the `McpServer`; the `curation` domain's bootstrap path (`registerCurationToolset` + the new `registerCurationMcpTransport`) intersects the closed whitelist of 8 names against the registry, so the transport only advertises and admits the eight names. The `ingestionCatalog` guard on the curation MCP transport (`curation.back.md` BR-29 last paragraph) means the curation MCP transport is skipped when the catalog is absent — when that happens, REST `complianceDeleteRawInformation` stays available (it does not depend on the catalog), but the MCP `compliance_delete` tool is unreachable. This is the same lock-step behaviour the curation REST mirror already exhibits.

**Description:** A single business outcome reaches both transports through identical validation, identical DB writes and identical audit rows (ADR A28). The MCP envelope shape is `{ ok: true, result: { outcome, deletion } }` on success / `{ ok: false, error: { code, message, details } }` on failure (§14). The MCP error-code set used by `compliance_delete` is the §14 canonical set (`STRUCTURAL_INVALID` / `NOT_FOUND` / `INTERNAL` — BR-15), NOT the rich REST taxonomy that the other seven tools on the curation transport surface (`curation.back.md` BR-30 last paragraph) — `compliance_delete` is the single intentional asymmetry, preserving the existing tool / spec / SDK contract.
**Error returned:** No direct error from the rule. See BR-15 for the MCP error code map.

### BR-15 -- MCP error codes for compliance_delete
**Related UC:** UC-01
**Where to validate:** MCP handler. The handler catches the `ValidationFailure` / `NotFoundFailure` / `InternalFailure` types thrown by the shared service and maps them onto the MCP envelope `{ ok: false, error.code }`:
- Zod parse failure on input → `STRUCTURAL_INVALID`.
- `raw_information_id` resolves to no row (UC-01 alt `4a`) → `NOT_FOUND`.
- UC-01 alt `4c` (legacy tombstoned raw without `ComplianceDeletion`) → `INTERNAL`.
- Any unhandled exception in service → `INTERNAL`.

Auth failures (missing/invalid JWT) are NOT MCP envelope errors — they are produced by the BFF middleware (`requireNeonAuth`) **before** the MCP tool dispatch on the curation MCP transport, and they surface to the MCP client as the standard REST 401 (`AUTH_UNAUTHORIZED`). The MCP envelope is only used for service-layer outcomes (cf. `ingestion.spec.md` §6.2, `curation.back.md` BR-01 last sentence, ADR A28).

**Asymmetry with the rest of the curation transport.** The other seven tools on the curation MCP transport (`list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`) surface the rich REST taxonomy on MCP via the shared envelope mapper of `curation.back.md` BR-30 (`RESOURCE_NOT_FOUND`, `BUSINESS_NODE_DELETED`, all `BUSINESS_*` codes, `VALIDATION_INVALID_FORMAT`, etc.). `compliance_delete` does NOT — it keeps the §14 canonical-code set documented above. The asymmetry is deliberate (`curation.back.md` BR-30 last paragraph, BR-31 second-to-last paragraph): the existing `compliance_delete` MCP contract has been published since v1.0.0 of this spec and downstream LLM-side / SDK clients depend on these specific codes; flipping to the rich REST set would be a breaking change. The MCP curation transport admits `compliance_delete` via the closed whitelist and dispatches to the handler as-written — the transport never re-maps `compliance_delete`'s envelope.

**Description:** Idempotent no-op is NOT an error — it surfaces as `{ ok: true, result: { outcome: "noop_already_deleted", deletion: ... } }` (the design rule of §14, "business outcomes are not errors").
**Error returned:** `STRUCTURAL_INVALID` | `NOT_FOUND` | `INTERNAL` (per the map above).

### BR-16 -- Cascade counters are computed by RETURNING, not by COUNT
**Related UC:** UC-01
**Where to validate:** service. The four `affected.*` counters of BR-08 are derived from the `RETURNING id` cardinality of the four UPDATE statements of BR-06 (fragments), BR-07 (links and attributes) and the corresponding `UPDATE raw_chunk ... RETURNING id` of step 6 (chunks). The service does NOT issue a separate `SELECT count(*)` — the counters are a byproduct of the same statements that mutate the rows, eliminating a race window between count and update.
**Description:** Counts and mutations are atomic — one statement, one cursor scan, one count.
**Error returned:** Not applicable (correctness invariant).

### BR-17 -- Legacy-inconsistency path emits an operational alarm
**Related UC:** UC-01 alt `4c`
**Where to validate:** service. When BR-03 finds `raw_information.status = 'deleted'` AND zero `compliance_deletion` rows for that `raw_information_id`, the service:
1. Rolls back the transaction.
2. Logs at `error` level with `pino` carrying the key `compliance.legacy_orphan_tombstone`, `raw_information_id`, `request_id`, `transport`.
3. Throws `InternalFailure('legacy_orphan_tombstone')`.
The route handler maps the throw to HTTP 500 `SYSTEM_INTERNAL_ERROR`. The MCP handler maps it to envelope `{ ok: false, error.code: "INTERNAL" }` (BR-15). The `transport` log field disambiguates REST vs MCP origin for the operator dashboard.
**Description:** Recovery from this state is a manual data-migration task, not an automated rollback — the spec is explicit (§4 BR-03 of `compliance-audit.spec.md`).
**Error returned:** HTTP 500 `SYSTEM_INTERNAL_ERROR` / MCP `INTERNAL`. Always accompanied by the structured log entry above.

### BR-18 -- compliance_delete also redacts raw_information.original_input
**Related UC:** UC-01
**Where to validate:** repository — `complianceAudit.repository.tombstoneRawInformation`. The function MUST include the `original_input` column in the same `UPDATE raw_information SET ...` statement shown in BR-04, using the expression:
```sql
original_input = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]' END
```
The expression is intentionally a `CASE` (not a blind assignment) so that the null/non-null distinction is preserved: rows ingested outside the directed-chat path (REST `ingestRawInformation`, MCP `ingest_document`, ingestion `propose_*` tools — i.e. the vast majority of `raw_information` rows) never populate `original_input` and stay `NULL` after the tombstone. Rows ingested via `ingest_directed` from the chat carry the verbatim user turn (`ingestion.back.md` BR-34) and become the 10-character literal `[REDACTED]`. The redaction is atomic with the `content` redaction (same `UPDATE`, same transaction — BR-02, BR-04).

**Why CASE and not a flat assignment.** A flat `original_input = '[REDACTED]'` would turn a NULL into the literal `[REDACTED]`, falsely suggesting that the row had a captured verbatim turn that was then redacted. The `CASE` expression keeps the audit trail honest: a tombstoned row with `original_input = NULL` truthfully means "this row never carried a captured chat turn"; a tombstoned row with `original_input = '[REDACTED]'` truthfully means "this row did carry a verbatim chat turn, which has been redacted under §11". The distinction is observable on the `query-retrieval` provenance walk (where the field is surfaced when non-null — `ingestion.back.md` BR-34 / `query-retrieval/openapi.yaml` `ProvenanceRawInformation.original_input`).

**Coverage scope.** This rule is the §11 `compliance_delete` coverage of the new `raw_information.original_input` column introduced by `migrations/0002_original_input.sql` (owned by `ingestion.back.md` BR-34). Without this rule, the verbatim user turn would survive a `compliance_delete` — violating §11 (irreversible coverage of personal data captured from the source) and the LGPD obligation that drives the compliance carve-out. The column is in scope of §11 by construction: it sits on `raw_information` and is therefore reachable by the same tombstone path that already covers `content` (BR-04).

**Description:** The `original_input` column joins `content` and `metadata` as fields that the compliance tombstone overwrites in place. Null values stay null (no false-positive redaction); non-null values become the same `[REDACTED]` literal used for `content`. The 10-character literal is fixed at the byte level (cf. §7 "The `[REDACTED]` literal is fixed at the byte level"). No change to `content_hash`, `superseded_at`, `status`, or any cascade predicate of BR-06 / BR-07 — the cascade walk does not depend on `original_input`.
**Error returned:** None directly — failure of the UPDATE surfaces via BR-02 rollback and UC-01 alt `9a` → HTTP 500 / MCP `INTERNAL`.

---

## 4. State Machine (ST)

> One state machine is owned by this domain: the `RawInformation` tombstone transition driven by `compliance_delete`. The remainder of the `RawInformation` lifecycle (initial INSERT) is owned by `ingestion`.

### ST-RI-DEL -- RawInformation tombstone transition (ST-RI-DEL of `compliance-audit.spec.md` §5.1)

```
       compliance_delete (REST POST /api/v1/compliance/deletions
                          OR MCP tools/call name=compliance_delete
                          on POST /api/v1/mcp/curation)
              |
              v
        [active] ---FOR UPDATE---> read status
              |                            |
              |                            +- 'active'  --tombstone + cascade + audit--> [deleted]
              |                            |
              |                            +- 'deleted' AND ComplianceDeletion exists ---> [deleted]  (no-op)
              |                            |
              |                            +- 'deleted' AND ComplianceDeletion missing ---> error 500 / MCP INTERNAL
              v
        [deleted]  (terminal — never restored, BR-13 of compliance-audit.spec.md / §8)
```

| From | To | Event | Guard | UC |
|------|----|-------|-------|----|
| (created by ingestion as `active`) | deleted | first `complianceDeleteRawInformation` (REST) or `compliance_delete` (MCP curation transport) | `reason` Zod-validated (BR-01); FOR UPDATE acquires the row; `raw_information.status = 'active'`; transaction commits | UC-01 main |
| deleted | deleted | repeated `complianceDeleteRawInformation` / `compliance_delete` (idempotent no-op) | FOR UPDATE acquires the row; `raw_information.status = 'deleted'` AND `EXISTS (SELECT 1 FROM compliance_deletion WHERE raw_information_id = $1)` | UC-01 alt `4b` |
| deleted | — | repeated `complianceDeleteRawInformation` / `compliance_delete` against legacy inconsistency | FOR UPDATE acquires the row; `raw_information.status = 'deleted'` AND `NOT EXISTS (... compliance_deletion ...)`; transaction rolled back; HTTP 500 `SYSTEM_INTERNAL_ERROR` / MCP envelope `INTERNAL` (BR-17) | UC-01 alt `4c` |

> Transitions are transport-invariant: a REST and an MCP `compliance_delete` against the same target traverse the same edges with the same guards (`curation.back.md` BR-29 "single-core" rule extended to this domain's tool).

**Invalid transitions:**
- `deleted → active` (restoration): permanently disallowed. There is no UPDATE path in the BFF that sets `raw_information.status` back to `active`. Confirmed by code review per BR-12 + BR-13 + §8 "Restoration / un-deletion ... permanently out of scope".
- `active → active` via `complianceDeleteRawInformation`: impossible — the only path that ends at `active` is the initial `ingestRawInformation` INSERT (owned by `ingestion`).

**This domain does NOT define state machines for `ComplianceDeletion` and `CurationAction`** because they are append-only and have no status column (BR-13). They have exactly one valid state: "written".

---

## 5. Domain Events (EV)

> The Remember architecture does **not** include an event bus. Cross-domain coordination happens through synchronous service calls and through the database (§2.2 "store único"; §13 "audit-first"). The audit substrate is `compliance_deletion` + `curation_action` for this domain (read off the DB by any consumer).

**N/A — no domain events in this version.**

The cross-domain effects of UC-01 (tombstone of `raw_information`, status cascade to `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`) are produced by **direct SQL writes** inside the UC-01 transaction (BR-04..BR-07), not by event dispatch. Consumers (e.g. `query-retrieval` BR-14 which short-circuits with HTTP 410 `BUSINESS_RAW_INFORMATION_DELETED` when it encounters a tombstoned raw) observe the new state by reading the DB in their own transactions — they neither subscribe to nor produce any event.

If a future operator surface (e.g. a Slack/SIEM notifier) needs to react to compliance deletions, it must poll `compliance_deletion` ordered by `executed_at DESC` — the database is the integration boundary, by spec (§2.2). Versioning is not a concern because no event payload exists.

---

## 6. External Integrations

> Timeout and fallback required per integration. No fallback = operational risk — document the decision.

| Service | Type | Purpose | Timeout | Fallback |
|---------|------|---------|---------|----------|
| Neon Auth (Stack Auth) | REST (JWT verify via JWKS) | Validate the bearer token on every REST call and on the MCP `compliance_delete` invocation via the curation MCP transport (§2.5, A29). The `requireNeonAuth` Fastify `preHandler` middleware fetches the JWKS from `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA signing by default) and caches it in-process for `NEON_AUTH_JWKS_TTL_S` seconds. Same middleware as `ingestion.back.md` §6, `curation.back.md` §6 and `knowledge-graph.back.md` §6 — one JWKS cache per BFF process. | 2 s per JWKS fetch; cached for `NEON_AUTH_JWKS_TTL_S` (default 600 s) in-process. | None — without a verifiable JWT, the request is rejected with HTTP 401 `AUTH_UNAUTHORIZED`. Cache miss + network failure → HTTP 503 `SYSTEM_SERVICE_UNAVAILABLE`. |
| PostgreSQL 17 (Neon) | TCP (`pg` pool) — connection string via `DATABASE_URL` | Single store of `compliance_deletion`, `curation_action`, and the mutated/read rows of `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`, `provenance`, `fragment_source`. Schema is identical to the prior Supabase Cloud deployment — Neon is a managed PostgreSQL 17 host, no driver or query change. | Statement timeout: 10 s default on read endpoints; 30 s on UC-01 (`complianceDeleteRawInformation`) — covers worst-case cascade size (low at §16 scale but bounded by the size of the document's provenance graph). Pool: shared with the rest of the BFF (min 2, max 10 connections per BFF instance). | None — PostgreSQL is the single store (§2.2). Outage → HTTP 500 `SYSTEM_INTERNAL_ERROR`. Deadlock (`40P01`) on UC-01 is retried up to 3 times with exponential backoff (50 ms / 100 ms / 200 ms); deadlocks should be rare because each transaction locks one `raw_information` row at a time. |
| MCP curation transport (owned by `curation`) | HTTP `POST /api/v1/mcp/curation` (JSON-RPC 2.0) | Surface the `compliance_delete` tool of toolset `curation` (§14.4) to the LLM as the eighth tool on the curation MCP transport (`curation.back.md` BR-29 / BR-31). This domain registers the HANDLER on the shared `McpServer` (`registerComplianceToolset` in `app.ts`); the `curation` domain OWNS the JSON-RPC transport that dispatches `tools/call name=compliance_delete` to it. The handler's envelope and error mapping (§14 canonical codes — BR-15) are unchanged from v1.1.0; only the URL path and the dispatch mechanism (curation transport instead of any standalone mount) are new in v1.2.0. The transport's closed whitelist of 8 names admits `compliance_delete` alongside the seven curation tools; any other name → MCP envelope `{ ok: false, error.code: "NOT_FOUND" }` (`curation.back.md` BR-29 rule 5). | Per-tool-call hard ceiling: 30 s (matches the PostgreSQL statement timeout for UC-01). The transport itself applies a 15 s ceiling to the seven curation tools (`curation.back.md` §6) — `compliance_delete` keeps its 30 s budget because the cascade can be larger than the merge/correction workload; the curation transport handler MUST honor this per-tool deadline (configured via the per-tool descriptor passed at transport boot). | None at this layer — a slow tool call surfaces as MCP transport timeout to the LLM; the BFF nevertheless commits or rolls back the UC-01 transaction on its own deadline. When the `ingestionCatalog` is absent at boot the curation MCP transport is skipped (`curation.back.md` BR-29 last paragraph); REST `complianceDeleteRawInformation` stays available. |

**No LLM provider integration in this domain.** The LLM lives upstream of the BFF — it calls the MCP `compliance_delete` tool on the curation transport, but the BFF never originates LLM calls (consistent with `ingestion.back.md` §6, `curation.back.md` §6).

**No external archival / SIEM / S3 integration.** §8 of `compliance-audit.spec.md` makes audit-log export out of scope for v1.0.0.

---

## 7. Known Technical Constraints

- **`raw_information.status` and `raw_information.superseded_at` columns are not yet in the schema as shipped.** `migrations/0001_schema.sql` lines 185-194 declare `raw_information` without those two columns. `compliance-audit.spec.md` BR-05 and CLAUDE.md "Known Gotchas" both commit to their existence. The implementation MUST land a migration `0003_compliance_status.sql` (numbering subject to repo state at the time) adding `status node_status NOT NULL DEFAULT 'active'` and `superseded_at timestamptz` to `raw_information` **before** UC-01 ships. Until that migration is in place, BR-04/BR-05 cannot be implemented. The same migration MUST backfill `status = 'active'` for every existing row.
- **No `compliance_deletion (raw_information_id) UNIQUE` constraint.** The schema declares only a non-UNIQUE index (`compliance_deletion_raw_idx`, line 473). Idempotency (BR-03) is enforced solely by the BFF after the `FOR UPDATE` read. UC-01 alt `4c` exists exactly for the case where this invariant is broken in legacy data. **Consider adding `CREATE UNIQUE INDEX compliance_deletion_raw_uq ON compliance_deletion (raw_information_id)` in a follow-up migration** once the legacy alarm `compliance.legacy_orphan_tombstone` (BR-17) has been silent for a defined retention period.
- **No `curation_action.action` CHECK or enum.** The column is plain `text` (schema line 454). The 7-name vocabulary of BR-10 is enforced only at the API layer of this domain; the `curation` domain enforces the same 7-name vocabulary at its own write sites (`curation.back.md` BR-25). Rows produced by future code paths with new tool names will not be returned by `listCurationActions` filtered by `action`, but they WILL be returned by the same endpoint without the filter. This is a deliberate v1 trade-off — flipping `action` to an enum requires coordinating with the `curation` domain owners and would be a coordinated migration.
- **`curation_action.target_id` has no foreign key.** The column is plain `uuid` (schema line 456). Dangling `target_id` references must be tolerated by all read paths — the audit log MUST survive even when the targeted entity later changes status. UC-04 / UC-05 return the row as-is; the SPA presents the row without joining to the target.
- **No dedicated index on `compliance_deletion.executed_at` or on `curation_action.created_at` or on `curation_action.action`.** At v1 scale (rare destructive operations) a sequential scan + sort is acceptable per the §16 budget (`get_*` < 200 ms, list endpoints < 1 s implicit). If the audit volume grows beyond a few thousand rows the indexes documented in §2 must be added in a follow-up migration.
- **READ COMMITTED isolation for UC-01.** PostgreSQL's default. With `SELECT ... FOR UPDATE` on `raw_information.id` and no other shared writer of `raw_information` (BR-12), READ COMMITTED is sufficient. Higher isolation (REPEATABLE READ / SERIALIZABLE) is unnecessary and would risk spurious serialization errors under no real contention.
- **`compliance_delete` is irreversible by schema.** Tombstoned `content` is unrecoverable from the DB — only `content_hash` survives (BR-04). The audit row documents the deletion but does not enable restoration. Restoration is permanently out of scope (`compliance-audit.spec.md` §8).
- **Single-instance assumption is unnecessary for this domain.** Unlike `ingestion.back.md` (advisory locks), UC-01 uses only row-level `FOR UPDATE` — multiple BFF instances can safely serve `complianceDeleteRawInformation` against the same DB.
- **The `[REDACTED]` literal is fixed at the byte level.** Any localization or rebranding of this token must be a coordinated migration (rewrite of all existing tombstoned `raw_information.content` values) — adding it as a config knob in v1.0.0 would silently fork audit semantics across deployments. v1.0.0 hardcodes the literal in `complianceAudit.service` and a Vitest unit test pins the value.
- **`metadata` JSON merge uses Postgres `||` operator.** This operator is shallow (top-level keys are overwritten, nested objects are NOT deep-merged). The merge `metadata || jsonb_build_object('compliance_deleted', true)` is safe because `compliance_deleted` is a top-level boolean key with no nested structure. If a future feature requires deep-merging into `metadata`, a `jsonb_set` chain or a `jsonb_strip_nulls` + recursive merge would be needed — out of scope here.
- **Neon Auth replaces Supabase Auth at the middleware boundary only.** The migration is a swap of the JWT verifier and the JWKS endpoint — issuer, `aud` and `sub` claim shapes are otherwise compatible with the prior Supabase token (`sub` carries the owner identity). No code path of this domain reads `request.user.id`, so the change is contained to the `requireNeonAuth` middleware (BR-11 single-owner invariant unchanged). Required env vars: `NEON_AUTH_URL`, `NEON_AUTH_JWKS_TTL_S`. Removed env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWKS_TTL_S`.
- **Neon connection uses a direct connection string (`DATABASE_URL`).** The `pg` pool is configured against the Neon endpoint exactly as it was against Supabase Cloud — same driver, same parameterized queries, same migrations apply unchanged. Neon's serverless compute scale-to-zero may add cold-start latency on the first query after idle; the 10 s / 30 s statement timeouts of §6 still apply to the steady-state path. No code change is required in this domain for the swap.
- **Three MCP transports coexist on the same BFF process; they MUST stay disjoint** (`curation.back.md` §7 same-named bullet). `POST /api/v1/mcp` is the **ingest** transport (owned by `ingestion`, write-side, audited, requires `X-LLM-Run-Id`). `POST /api/v1/mcp/query` is the **query** transport (owned by `knowledge-graph` + `query-retrieval`, read-only, no run header, no audit row). `POST /api/v1/mcp/curation` is the **curation** transport (owned by `curation` + co-tenant `compliance-audit`, write-side, audited via `curation_action` rows + `compliance_deletion` rows when `compliance_delete` is dispatched, no run header — `curation.back.md` BR-29). Modifying any transport to host the others' tools is rejected at code review. The three transports share only the `mcp/server.ts` core and the `requireNeonAuth` middleware.
- **`compliance_delete` is co-tenant on the MCP curation transport; the handler stays in `compliance-audit`.** The MCP catalog (§14.4) lists `compliance_delete` inside the `curation` toolset; the curation MCP transport admits it via the closed whitelist of 8 names (`curation.back.md` BR-31) and dispatches to `compliance-audit/mcp/compliance-toolset.ts`. The REST split is intentional for operational clarity (`compliance-audit` REST stays at `/api/v1/compliance/deletions`; the `curation` REST is at `/api/v1/curation/*`). The MCP toolset name `compliance_delete` and the §14 canonical-code mapping for it (BR-15) are unchanged.
- **`compliance_delete` keeps its §14 canonical code mapping on MCP; the other seven tools on the curation transport surface the rich REST taxonomy.** This is the deliberate asymmetry recorded in BR-15 and in `curation.back.md` BR-30: `compliance_delete` already publishes `STRUCTURAL_INVALID` / `NOT_FOUND` / `INTERNAL` and the existing tool / spec / SDK clients depend on it; changing those codes would be a breaking change. The other seven tools have no production MCP surface yet, so they inherit the richer REST taxonomy from the outset (`BUSINESS_*`, `VALIDATION_*`, `RESOURCE_NOT_FOUND`, `SYSTEM_*`). The shared envelope mapper of `curation.back.md` BR-30 is therefore NOT consumed by the `compliance_delete` handler — its mapping logic lives inline in `compliance-toolset.ts` (lines 53-128) as in v1.1.0.
- **Closed whitelist of 8 names on the curation transport.** The dispatcher rejects any other tool name with `{ ok: false, error.code: "NOT_FOUND" }` (`curation.back.md` BR-29 rule 5). The whitelist is built at transport startup from the union of `CURATION_TOOL_NAMES` (the seven curation tools) + the singleton `'compliance_delete'`. A query-side tool (`get_node`) or an ingest-side tool (`propose_node`) cannot reach `compliance_delete`'s handler even if it accidentally shares the underlying `McpServer` instance.

---

## 8. Out of Scope

- **Curation queue tool implementations** (`list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`). Owned by the `curation` domain (`curation.spec.md` / `curation.back.md`). This module WRITES `curation_action` rows for its own `compliance_delete` operation (BR-08) and READS the full audit log via UC-04 / UC-05. **The historical "future curation domain" wording of v1.1.0 is RESOLVED in v1.2.0** — the `curation` domain exists and owns the seven tools end-to-end on both REST and MCP; `compliance_delete` co-tenants their MCP transport as the eighth tool (BR-14), but the seven tools' handlers and routes live in `backend/src/modules/curation/`, not here.
- **LLM-extraction audit (`LLMRun`, `ToolCall`).** Owned by `ingestion.back.md`. Operations `getLlmRunById`, `listToolCallsByLlmRun`, `retryLlmRun` are not part of this domain.
- **EntityMatchReview rows.** Belong to the `curation` domain (`entity_match_review` table is cleared upon resolution per §10.1; `curation.back.md` BR-10).
- **System-time travel — query (c) of §5.3 ("what the system knew at instant T").** Permanently deferred (ADR A25, §20.2). This domain writes `executed_at` on `compliance_deletion` and `created_at` on `curation_action` (via DB defaults), but exposes no endpoint to query the audit log as-of an arbitrary instant.
- **Restoration / un-deletion of a tombstoned RawInformation.** Permanently out of scope. `compliance_delete` is irreversible by design (§11 of v7) — the redacted `content` is unrecoverable from the DB; only `content_hash` survives. The audit row (`ComplianceDeletion`) documents the deletion but does not enable restoration.
- **Hard-delete (physical DELETE) of any row.** Permanently out of scope. The schema preserves all rows; status transitions are the only path. This protects the audit chain (principle 1, §18).
- **Mutation of audit rows (UPDATE / DELETE on `compliance_deletion` or `curation_action`).** Permanently out of scope (BR-13). No endpoint exposes either, no DB trigger writes either after INSERT.
- **Multi-tenant / `User` entity / role-based authorization** (§2.3, §20.3, A20). Permanent non-goal. No `actor_id` column on either audit table (BR-11).
- **Export of the audit log to external systems** (S3, SIEM, etc.). Not in this version. The two list endpoints (UC-02, UC-04) and the two by-id endpoints (UC-03, UC-05) are the supported interface.
- **Embeddings / vector search.** Permanent non-goal (§20.1, A24, CLAUDE.md "Anti-patterns"). No embedding column, no `pgvector`, ever.
- **Event bus / message queue.** No Kafka, RabbitMQ, Supabase Realtime, etc. The database is the integration boundary (§2.2 "store único").
- **Rate limiting / quota.** Single-owner; no per-tenant quota required in v1.0.0. The 30 s PostgreSQL statement timeout is the only back-pressure mechanism on UC-01.
- **MCP `query` toolset.** Read-only, hosted on the separate query transport `POST /api/v1/mcp/query`. Belongs to `knowledge-graph` + `query-retrieval`.
- **MCP `ingest` toolset.** MCP-only, exclusive to an open `LLMRun` (§14.1). Belongs to `ingestion`.
- **Ownership of the MCP curation transport.** Owned by `curation/mcp/curation-transport.ts` (`curation.back.md` BR-29). This domain registers the `compliance_delete` HANDLER on the shared `McpServer` registry (`registerComplianceToolset` in `app.ts`); it does NOT own the JSON-RPC route, the `tools/list` advertisement, or the closed-whitelist enforcement — those belong to the curation domain's transport (BR-14).

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---------|------|--------|------|-------------|----|
| 1.0.0 | 2026-06-11 | Back Spec Agent | initial | Initial back-end spec for the compliance-and-audit domain. Mirrors `compliance-audit.spec.md` v1.0.0 (14 BRs, 5 UCs, 1 state machine) into a Fastify + raw-`pg` implementation on PostgreSQL 17 (Supabase Cloud), aligned with CLAUDE.md and the v7 normative source (§2.5, §3.5, §10.2, §11, §13, §14.4, §17 C15, §18 principle 1, ADRs A19, A20, A28, A29). Tables owned for write: `compliance_deletion`, `curation_action` (INSERT only — BR-13). Tables mutated by status transition under BR-12 carve-out: `raw_information`, `raw_chunk`, `information_fragment`, `knowledge_link`, `node_attribute`. Single state machine: ST-RI-DEL (`RawInformation` tombstone). No new BUSINESS_ error codes — this domain reuses existing global codes (`AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND`, `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `SYSTEM_INTERNAL_ERROR`) plus MCP envelope codes (`STRUCTURAL_INVALID`, `NOT_FOUND`, `INTERNAL`). Two new operational alarms documented (`compliance.legacy_orphan_tombstone`, `compliance.cascade_rollback`). One pending schema migration flagged in §7: add `raw_information.status` + `raw_information.superseded_at` before UC-01 ships. | -- |
| 1.1.0 | 2026-06-12 | Back Spec Agent | update | Infrastructure migration: replaced Supabase Cloud + Supabase Auth with Neon (managed PostgreSQL 17) + Neon Auth (Stack Auth). §1 Stack header now reads "PostgreSQL 17 via Neon". §1 Auth row replaced with `requireNeonAuth` middleware verifying JWTs against `${NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA), with TTL governed by `NEON_AUTH_JWKS_TTL_S`. §6 External Integrations: the auth row swapped from "Supabase Auth" to "Neon Auth (Stack Auth)", and the database row swapped from "PostgreSQL 17 (Supabase Cloud)" to "PostgreSQL 17 (Neon)" with connection via `DATABASE_URL`. §7 Known Technical Constraints gained two new bullets documenting the auth-middleware swap envelope and the Neon connection-string topology. BR-15 updated to name `requireNeonAuth` as the source of pre-dispatch 401 responses. No change to BRs, USCs, state machine, schema or business semantics — Neon is a managed PostgreSQL 17 host (same driver, same parameterized queries, same migrations) and Neon Auth retains the JWT-issuer / single-owner contract of A29 / §2.5. Env vars: `DATABASE_URL`, `NEON_AUTH_URL`, `NEON_AUTH_JWKS_TTL_S` added; `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWKS_TTL_S` removed. | migrate-neon |
| 1.2.0 | 2026-06-15 | Back Spec Agent | change | Reconcile this domain's MCP wiring with the new write-side **MCP curation transport** owned by `curation` (`curation.back.md` v1.2.0 BR-29 / BR-31). `compliance_delete` becomes the eighth tool admitted to the curation MCP transport `POST /api/v1/mcp/curation` via the closed whitelist of 8 names; the HANDLER stays in `compliance-audit/mcp/compliance-toolset.ts` (no code rewrite by this revision — the handler is already envelope-producing, lines 53-128, registered under the `curation` toolset key on the shared `McpServer` registry). The §14 canonical-code mapping for `compliance_delete` is preserved (BR-15 unchanged: `STRUCTURAL_INVALID` / `NOT_FOUND` / `INTERNAL`); the other seven tools on the curation transport surface the rich REST taxonomy via `curation.back.md` BR-30's shared mapper — `compliance_delete` is the single intentional asymmetry, documented in BR-15 and §7. Sections updated: header banner (MCP contract row now refers to the curation transport), §1 MCP server row (three-transport coexistence; `compliance_delete` co-tenant on the curation transport), §1 Architecture pattern row (handler lives here, transport owned by curation), §1 Auth row (curation MCP transport listed alongside the existing mounts), §1 Transaction policy row (transport-invariant via the shared `withTransaction` helper), §1 Concurrency row (transport-invariant `FOR UPDATE` race), §1 Logging row (`transport` field on every log line, matching `curation.back.md`), §1 Observability row (alarms carry `transport` label), §1 Idempotency primitive row (transport-invariant), §1 Testing row (new REST↔MCP parity integration test for `compliance_delete`, mirroring `curation.back.md` BR-32 and `knowledge-graph` TC-04), §1 Body limit row (BFF-wide 11 MiB ceiling), §1 Cross-domain writes row (curation co-tenant on `curation_action`), §2 `curation_action` row description (curation domain writes the other six action types), §2 relationships row (curation domain named as the writer of the other six target_kinds), §3 BR-02 (both transports use the shared `withTransaction`), §3 BR-03 (transport-invariant idempotency), §3 BR-08 (transport-invariant audit-row count), §3 BR-10 (vocabulary aligned with the curation-transport closed whitelist), §3 BR-12 (carve-out covers both transports), §3 BR-14 (rewritten to describe the curation MCP transport dispatch and the closed whitelist; `registerComplianceToolset` wiring unchanged), §3 BR-15 (asymmetry explicit: `compliance_delete` keeps §14 canonical codes, the other seven use the rich REST taxonomy), §3 BR-17 (alarm log line carries `transport`), §4 ST-RI-DEL header (event includes both REST and MCP triggers), §6 External Integrations (the standalone "MCP transport" row replaced by "MCP curation transport (owned by `curation`)" with the per-tool 30 s deadline contract and the `ingestionCatalog` guard behaviour), §7 Known Technical Constraints (three new bullets: three-transport coexistence, `compliance_delete` co-tenant on curation transport with REST split unchanged, §14-canonical-vs-rich-REST asymmetry, closed-whitelist-of-8-names enforcement), §8 Out of Scope (clarified curation queue tools are owned end-to-end by the `curation` domain — historical "future domain" wording resolved; added MCP query/ingest toolsets to OOS for explicitness; clarified ownership of the curation MCP transport stays in `curation/mcp/curation-transport.ts`). No schema changes; no data model changes; no state-machine changes; no new BUSINESS_/MCP error codes; no business-semantics change. Reconciles the v7 §14/A28/changelog asymmetry alongside `curation.back.md` v1.2.0: with this revision, `ingest` remains MCP-only (transport owned by `ingestion`), while `query` and `curation` are dual MCP+REST (transports owned by `knowledge-graph` and `curation` respectively); `compliance_delete` is the only cross-domain co-tenant on the curation transport. Supabase→Neon spec reconciliation remains out of scope. | mcp-curation-dual |
| 1.3.0 | 2026-06-27 | Back Spec Agent | change | Extend §11 `compliance_delete` coverage to the new `raw_information.original_input` column introduced by `migrations/0002_original_input.sql` (owned by `ingestion.back.md` BR-34 — verbatim capture of the user turn that triggered a directed chat ingestion). New **BR-18** documents that `complianceAudit.repository.tombstoneRawInformation` MUST include `original_input = CASE WHEN original_input IS NULL THEN NULL ELSE '[REDACTED]' END` in the same `UPDATE` that already redacts `content` and `metadata` (BR-04) — atomic, single statement, single transaction. Updated sections: §1 Cross-domain writes row (carve-out explicitly covers `original_input`); §1 Testing row (new unit test (h) for BR-18 — non-null → `[REDACTED]`, null → null preserved); §2 Tables mutated by status transition (new row `raw_information.original_input` with the CASE expression, triggered by UC-01 step 5, owning BR-04 + BR-18); §2 schema-pending paragraph (lists `original_input` alongside `status` / `superseded_at` as columns not yet in `0001_schema.sql`, names `0002_original_input.sql` as the dependency); §3 BR-04 (SQL extended to include `original_input` in the same UPDATE; new prose paragraph on the CASE expression rationale + the §11/LGPD coverage); §3 BR-18 (new rule, as above). No change to: state machine ST-RI-DEL, BR-03 idempotency semantics, BR-06/BR-07 cascade predicates, BR-08 audit-row count, BR-14/BR-15 MCP envelope shape and code mapping, `content_hash` behaviour (still untouched — BR-04), re-affirmation behaviour, `compliance_deletion` / `curation_action` row shape, or any external integration. No new BUSINESS_ / MCP error codes. No new state, no new event. Migration `0002_original_input.sql` is OWNED by `ingestion.back.md` (additive `ALTER TABLE raw_information ADD COLUMN original_input text`; nullable; no backfill; reversible) — this domain only consumes the column. Acceptance: integration test `compliance_delete` on a row with non-null `original_input` ⇒ column becomes `[REDACTED]`; on a row with null `original_input` ⇒ column stays null. | original-input-capture |
