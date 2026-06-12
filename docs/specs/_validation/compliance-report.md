# Compliance Report: LGPD

regulation: LGPD
status: COMPLIANT
handoff_allowed: true

---

## Summary

All five domains of the Remember system have been scanned for LGPD structural compliance gaps. The system is a single-owner personal knowledge repository (§2.3, A20). No blocking gaps were found. Two advisory warnings are raised for real-looking personal names appearing in OpenAPI `example:` values; these are stylistic and do not affect handoff.

---

## Compliance Checks

### 1. Personal Data Identification

PASS. The system ingests owner-provided unstructured documents (`RawInformation`) that may contain personal data about third parties (names, references to real people). These are intentionally treated as opaque document content — no PII fields are modelled as typed attributes in the schema. The `metadata` field of `IngestRawInformationRequest` / `RawInformation` is a free-form JSONB bag; no PII-typed columns exist in the openapi schemas of any domain. The `KnowledgeNode` entity stores named entities extracted by the LLM (e.g., persons via `node_type = 'Person'`), which may indirectly encode personal data — this is the core function of the personal knowledge repository and within single-owner scope. No undeclared PII columns were detected.

### 2. Right to Erasure (Art. 18 LGPD)

PASS. The `compliance-audit` domain provides a complete right-to-erasure mechanism via `complianceDeleteRawInformation` (REST) and `compliance_delete` (MCP tool, §14.4). The mechanism (§11): tombstones `RawInformation.content` to `"[REDACTED]"`, cascades `status = 'deleted'` to all dependent `RawChunk`, `InformationFragment`, `KnowledgeLink`, and `NodeAttribute` rows whose only provenance was the deleted source. Rows with surviving provenance from other non-deleted sources are preserved. The operation is transactional (BR-02), idempotent (BR-03), and requires a non-empty `reason` (BR-01). `content_hash` is preserved for idempotency only — no content is recoverable from the DB after tombstone (§8 out-of-scope note). This satisfies the LGPD right to erasure in the single-owner context.

### 3. Data Minimization

PASS. The system stores only what is structurally necessary: raw documents as received, their deterministic chunks, LLM-extracted fragments, and the resulting knowledge graph entities/relations. No user profile, behavioural, or marketing data is collected. The `metadata` bag in `RawInformation` is owner-supplied and free-form — the spec imposes no mandatory personal-data fields. The `propose_fragment` / `propose_node` / `propose_link` / `propose_attribute` MCP tools accept only the minimum structural inputs needed to persist an extraction result. No excess data collection was identified.

### 4. Audit Trail

PASS. All compliance-relevant operations are audited by two mechanisms:

- `ComplianceDeletion` table: one immutable row per executed `compliance_delete`, with `raw_information_id`, `reason`, `executed_at`, and `affected` counters. Exposed via `listComplianceDeletions` / `getComplianceDeletionById`.
- `CurationAction` table: one immutable row per compliance_delete (and per curation operation), with `action = 'compliance_delete'`, `target_kind`, `target_id`, `reason`, and `payload`. Exposed via `listCurationActions` / `getCurationActionById`.

Both tables are append-only with no UPDATE/DELETE endpoints (BR-13). The LLM extraction audit (`LLMRun`, `ToolCall`) is owned by the `ingestion` domain and provides a complete, per-call trail of every LLM action (§3.5). All audit rows are written in the same transaction as the operation they audit.

### 5. Consent / Lawful Basis

PASS (with contextual note). The system is a single-owner personal knowledge repository. The data controller and the sole data subject are the same person: the system owner (§2.3, A20). There is no multi-user or third-party data subject in scope. Lawful basis is the owner's legitimate interest in maintaining their own personal knowledge base. No consent mechanism is required for single-owner personal-use processing. Third-party personal data appearing inside ingested documents (e.g., names of meeting participants in an `ata`) is processed as document content in service of the owner's lawful personal-use purpose; erasure is available via `compliance_delete`. The spec explicitly calls out this model in §2.3, A20, and A29.

### 6. Data Retention

PASS. The spec establishes a clear retention model:

- `RawInformation` and all derived rows are immutable after creation and are retained indefinitely as the single-owner's personal knowledge base — this is the explicit design intent (§18 principle 1: "the original information is never lost").
- The controlled erasure path (`compliance_delete`, §11) is the documented mechanism for removing personal data when erasure is required.
- Database backup: dump lógico diário + retenção 30 dias; teste de restore mensal (CLAUDE.md Database section). This is documented in the project architecture, not in individual domain specs; it is an infrastructure-level retention policy.
- No domain spec establishes an automatic data expiry policy — this is appropriate for a single-owner knowledge repository where the owner controls retention through explicit deletion.

### 7. Access Control

PASS. Supabase Auth JWT is required on every REST and MCP endpoint across all five domains (§2.5, A29). The BFF middleware validates the JWT before any DB access (confirmed in all alternative flows: `401 AUTH_UNAUTHORIZED` for missing/invalid JWT). The Supabase service key never leaves the BFF; PostgreSQL RLS is disabled — security is centralised in the BFF service layer. Single-owner means no role-based authorization is needed; the access gate is authentication-only, which is correct and sufficient for the declared model.

---

## Findings

### Blocking (prevent handoff)

None.

### Non-blocking (recommendations)

**W-01 — `add_warning` — `hardcoded_pii_in_spec_example` — ingestion/openapi.yaml**
The `example:` values in `IngestRawInformationRequest` and `RawInformation` schemas contain real-looking personal names (`"Maria Oliveira"` as `metadata.author`, `"João Silva e Maria Oliveira"` in the `content` field example). These are illustrative examples in the spec artifact, not runtime data, but the LGPD detection taxonomy flags them as a style gap.
Required spec change: replace real-looking personal names in `example:` values with clearly fictional or placeholder values (e.g., `"Pessoa A"`, `"[Nome do autor]"`).

**W-02 — `add_warning` — `hardcoded_pii_in_spec_example` — compliance-audit/openapi.yaml**
The `example:` value for the `reason` field in `ComplianceDeleteRequest` and related response schemas contains a real-looking personal name: `"LGPD right-to-erasure request from data subject João Silva on 2026-06-11."`. This is illustrative documentation, but the name is real-looking PII in a spec example.
Required spec change: replace the example name with a clearly placeholder value (e.g., `"LGPD right-to-erasure request from data subject [Nome] on 2026-06-11."`).

---

## Conclusion

The Remember system spec is **COMPLIANT** with LGPD for the declared single-owner personal knowledge repository model. The right-to-erasure mechanism (§11, `compliance_delete`) is fully specified and covers the cascade to all derived data. Authentication is enforced on every endpoint. The audit trail is append-only and immutable. All five domains were scanned; no blocking structural gaps were found. The two warnings are advisory style issues in spec example values and do not affect handoff.

**Handoff allowed: true.**
