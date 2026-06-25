# Compliance Scan — LGPD
**Domain:** chat + ingestion (ingest_directed feature, v2.6.0 / v1.4.1)
**Regulations:** lgpd
**Verdict:** compliant_with_crs
**Findings:** 0 block_handoff · 1 create_spec_cr · 1 add_warning

---

## Finding 1

**id:** LGPD-001
**gap_type:** missing_data_retention_policy
**action:** create_spec_cr
**severity:** medium
**affected_spec:** docs/specs/domains/ingestion/back/ingestion.back.md (BR-34)
**affected_field:** raw_information.content (source_type='chat', metadata.directed=true)

**gap_description:** The `ingest_directed` path (BR-34) creates `RawInformation` rows with `source_type='chat'` and `metadata.directed=true` that may contain personal data (the chat LLM structures turn context into fragments/nodes/links payload), but no retention period BR exists for these directed-ingestion rows.

**required_spec_change:** Add a BR to `ingestion.back.md` (or reference the existing §11 `compliance_delete` mechanism) that declares an explicit retention policy or disposal period for `RawInformation` rows created by `ingest_directed` (source_type='chat', metadata.directed=true).

---

## Finding 2

**id:** LGPD-002
**gap_type:** hardcoded_pii_in_spec_example
**action:** add_warning
**severity:** low
**affected_spec:** docs/specs/domains/ingestion/openapi.yaml (IngestRawInformationRequest example)

**gap_description:** The `example:` value for `IngestRawInformationRequest` in `ingestion/openapi.yaml` contains real-looking personal names ("João Silva", "Maria Oliveira") in both the `content` field and the `metadata.author` field.

**required_spec_change:** Replace the real-looking personal names in the `example:` values with clearly synthetic placeholders (e.g., "Participante A", "Participante B", `author: "Autor Exemplo"`).

---

## Non-findings (structural elements verified present)

| LGPD requirement | Status | Evidence |
|---|---|---|
| `missing_audit_log` | PRESENT | `ingest_directed` (BR-34): every dispatched `propose_*` writes a `tool_call` row (BR-23 unchanged); `LLMRun` with `model='directed'` / `prompt_version='directed-v1'` is the per-run audit anchor; `chat_tool_call` records the `ingest_directed` invocation (chat.back.md BR-32). |
| `missing_right_to_erasure` | PRESENT | `compliance_delete` (§11) covers `raw_information` rows including those with `source_type='chat'`; tombstone columns (`status`, `superseded_at`) are in `0001_init.sql`; chat tables use `DELETE CASCADE` (outside §11 by design — no personal data anchored in `raw_information` via that path). |
| `missing_consent_mechanism` | N/A — single-owner system; no third-party data subjects triggering consent collection. |
| `pii_field_undeclared` | CLEAN — no field names matching known PII patterns (`email`, `name`, `phone`, `cpf`, `address`, `birth_date`, `ip_address`) in either openapi schema; `canonical_name` in `GraphNodeWire` is a KG entity label, not a user-profile field. |
| `missing_data_minimization` | CLEAN — `ingest_directed` schema fields (`fragments`, `nodes`, `attributes`, `links`, `source_label`) are all required for the declared ingestion purpose; no structurally excess fields. |
