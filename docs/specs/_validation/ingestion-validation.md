# Validation Report — Ingestion Domain

> Triage: COMPLETED
> Date: 2026-07-03
> Mode: FINAL_COMPLETE — repair cycle 2 (all three artifacts)
> Requirement: P2.1 — Unify the BFF error-code taxonomy to the single namespaced vocabulary
> Validator: u-spec-validator-sdd_ingestion_spec-validator-repair-2
> Task: sdd_ingestion_spec-validator-repair-2 / attempt 1
> Result: **VALID**

---

## Scope

| Artifact | Path | Version | Status |
|----------|------|---------|--------|
| `openapi.yaml` | `docs/specs/domains/ingestion/openapi.yaml` | 1.5.0 | draft |
| `ingestion.spec.md` | `docs/specs/domains/ingestion/ingestion.spec.md` | 1.5.1 | draft |
| `ingestion.back.md` | `docs/specs/domains/ingestion/back/ingestion.back.md` | 1.6.1 | draft |
| `error-codes.md` | `docs/specs/_global/error-codes.md` | — | canonical |

---

## Coverage Map

| UC | operationId / MCP tool | BRs | Error Codes | Status |
|----|------------------------|-----|-------------|--------|
| UC-01 | `ingestRawInformation` | BR-01..BR-09 | `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_OUT_OF_RANGE`, `AUTH_UNAUTHORIZED`, `SYSTEM_INTERNAL_ERROR` | Complete |
| UC-02 | `getRawInformationById` | BR-02 | `AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND` | Complete |
| UC-03 | `listRawChunksByRawInformation` | BR-05 | `AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND` | Complete |
| UC-04 | `getLlmRunById` | BR-12, BR-33 | `AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND` | Complete |
| UC-05 | `listToolCallsByLlmRun` | — | `AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND` | Complete |
| UC-06 | `retryLlmRun` | BR-10, BR-11 | `AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND`, `BUSINESS_RUN_NOT_RETRYABLE` | Complete |
| UC-07 | (internal — no endpoint) | — | — | Complete |
| UC-08 | `proposeFragment` / `propose_fragment` | BR-13, BR-14, BR-19, BR-21, BR-22, BR-23, BR-24, BR-28 | `BUSINESS_RUN_NOT_RUNNING`, `RESOURCE_NOT_FOUND`, `VALIDATION_*` | Complete |
| UC-09 | `proposeNode` / `propose_node` | BR-13, BR-14, BR-19, BR-20, BR-21, BR-23, BR-24, BR-25, BR-28 | `BUSINESS_UNKNOWN_NODE_TYPE`, `VALIDATION_*` | Complete |
| UC-10 | `proposeLink` / `propose_link` | BR-13..BR-21, BR-23, BR-24, BR-27, BR-28 | `BUSINESS_UNKNOWN_LINK_TYPE`, `BUSINESS_LINK_RULE_VIOLATION`, `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_DATE_UNJUSTIFIED`, `RESOURCE_NOT_FOUND`, `VALIDATION_*` | Complete |
| UC-11 | `proposeAttribute` / `propose_attribute` | BR-13..BR-21, BR-23, BR-24, BR-27, BR-28 | `BUSINESS_UNKNOWN_ATTRIBUTE_KEY`, `VALIDATION_INVALID_FORMAT`, `VALIDATION_*` | Complete |
| UC-12 | `runLlmExtraction` | BR-26, BR-29 | `AUTH_UNAUTHORIZED`, `RESOURCE_NOT_FOUND`, `BUSINESS_RUN_NOT_RUNNABLE`, `SYSTEM_LLM_PROVIDER_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR` | Complete |
| UC-13 | RETIRED | BR-32 (WITHDRAWN) | — | N/A |
| UC-14 | `ingest_directed` (MCP-only) | BR-34, BR-33 | `VALIDATION_*`, `SYSTEM_SERVICE_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR` | Complete |

---

## Error Code Audit — P2.1 Canonical Taxonomy

All error codes in every active normative position across the three artifacts.

| error.code | openapi.yaml | spec.md | back.md | catalog | HTTP consistent | Status |
|------------|:---:|:---:|:---:|:---:|:---:|--------|
| `AUTH_UNAUTHORIZED` | 401 | 401 | 401 | 401 | Yes | PASS |
| `VALIDATION_REQUIRED_FIELD` | 422 | 422 | 422 | 422 | Yes | PASS |
| `VALIDATION_INVALID_FORMAT` | 422 | 422 | 422 | 422 | Yes | PASS |
| `VALIDATION_OUT_OF_RANGE` | 422 | 422 | 422 | 422 | Yes | PASS |
| `RESOURCE_NOT_FOUND` | 404 | 404 | 404 | 404 | Yes | PASS |
| `BUSINESS_RUN_NOT_RETRYABLE` | 409 | 409 | 409 | 409 | Yes | PASS |
| `BUSINESS_RUN_NOT_RUNNABLE` | 409 | 409 | 409 | 409 | Yes | PASS |
| `BUSINESS_RUN_NOT_RUNNING` | 409 | 409 | 409 | 409 | Yes | PASS |
| `BUSINESS_LINK_RULE_VIOLATION` | env* | 422 | env* | 422 | Yes† | PASS |
| `BUSINESS_UNKNOWN_NODE_TYPE` | env* | 422 | 422 | 422 | Yes† | PASS |
| `BUSINESS_UNKNOWN_LINK_TYPE` | env* | 422 | 422 | 422 | Yes† | PASS |
| `BUSINESS_UNKNOWN_ATTRIBUTE_KEY` | env* | 422 | 422 | 422 | Yes† | PASS |
| `BUSINESS_TEMPORAL_INCOHERENT` | env* | 422 | 422 | 422 | Yes† | PASS |
| `BUSINESS_DATE_UNJUSTIFIED` | env* | 422 | 422 | 422 | Yes† | PASS |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 | 500 | 500 | Yes | PASS |
| `SYSTEM_LLM_PROVIDER_UNAVAILABLE` | 502 | 502 | 502 | 502 | Yes | PASS |
| `SYSTEM_SERVICE_UNAVAILABLE` | — | — | back BR-30/31 | 503 | Yes | PASS |

> `env*` — returned inside the `ProposeMcpEnvelope` (200 OK with `ok: false`) on the propose-* mirror path per the unified HTTP-semantics rule. The 422/404 HTTP status in the catalog applies to direct REST endpoints; the propose-* mirror wraps business errors in the envelope at HTTP 200 (documented deviation in openapi.yaml preamble, spec.md §3, and back.md BR-28). This is a design decision, not an inconsistency.
>
> `†` — HTTP 200 on the propose-* mirror path (envelope-wrapped); catalog HTTP 422/404 is the REST pre-handler surface. Both are explicitly documented and consistent across all three artifacts.

**Deprecated codes check — none of the seven §14 short codes appear in any active normative position:**

| Deprecated code | openapi.yaml | spec.md | back.md | Result |
|----------------|:---:|:---:|:---:|--------|
| `STRUCTURAL_INVALID` | Not active | Not active | Not active | PASS |
| `UNKNOWN_TYPE` | Not active | Not active | Not active | PASS |
| `RULE_VIOLATION` | Not active | Not active | Not active | PASS |
| `TEMPORAL_INCOHERENT` | Not active | Not active | Not active | PASS |
| `DATE_UNJUSTIFIED` | Not active | Not active | Not active | PASS |
| `NOT_FOUND` | Not active | Not active | Not active | PASS |
| `INTERNAL` | Not active | Not active | Not active | PASS |

> Note: the three files do reference deprecated codes in historical/context text (e.g. "replaces the pre-P2.1 short `INTERNAL`") but none appears as an active `error.code` value on any wire surface.

---

## UC-12 alt 4b — SYSTEM_INTERNAL_ERROR Fix Verification

The specific fix from repair cycle 2 — replacing the deprecated `INTERNAL` short code with `SYSTEM_INTERNAL_ERROR` in UC-12 alt 4b — is confirmed correct and consistent:

| Location | Text | Status |
|----------|------|--------|
| `ingestion.spec.md` v1.5.1, UC-12 alt 4b | `{ ok: false, error.code: "SYSTEM_INTERNAL_ERROR" }` | CORRECT |
| `ingestion.back.md` v1.6.1, BR-26 (per-tool-use uncaught-exception path) | `{ ok: false, error: { code: 'SYSTEM_INTERNAL_ERROR', ... } }` (P2.1 namespaced — replaces `INTERNAL`) | CONSISTENT |
| `openapi.yaml` v1.5.0, `InternalError` response | `code: "SYSTEM_INTERNAL_ERROR"` | CONSISTENT |
| `error-codes.md` catalog | `SYSTEM_INTERNAL_ERROR` registered under System codes, HTTP 500 | REGISTERED |

---

## Cross-Reference Verification

| Check | Result |
|-------|--------|
| All BRs reference valid UCs (UC-01..UC-14, with UC-13 RETIRED) | PASS |
| All UC-referenced operationIds exist in openapi.yaml | PASS |
| BR-14 VALIDATION_* codes match openapi.yaml UnprocessableEntity + ProposeMcpEnvelope enum | PASS |
| BR-15 BUSINESS_LINK_RULE_VIOLATION matches openapi.yaml ProposeMcpEnvelope + proposeLink 200 example | PASS |
| BR-16 temporal codes match openapi.yaml ProposeMcpEnvelope enum | PASS |
| BR-21 run-state error codes match openapi.yaml RunNotRunning + NotFound responses | PASS |
| BR-26 fatal-path SYSTEM_INTERNAL_ERROR matches openapi.yaml InternalError response | PASS |
| BR-30 error codes all registered in catalog | PASS |
| ProposeMcpEnvelope.error.code enum is the complete set of business-layer codes — no extra, no missing | PASS |

---

## Inconsistencies

| # | Type | Source File | Target File | Description | Agent | Severity | Selected |
|---|------|------------|-------------|-------------|-------|----------|----------|
| W-01 | cross-ref | `ingestion.back.md` §1 Anthropic client config | `openapi.yaml` info.description | DEFAULT_PROMPT_VERSION is 'v2' in back.md but openapi.yaml info description names extraction.v3 as the registry default since v1.4.0. Pre-existing editorial drift; does not affect error-code taxonomy. Known, non-blocking for P2.1 repair cycle. | Back Spec Agent | warning | [ ] |
| W-02 | cross-ref | `openapi.yaml` info.description | `ingestion.back.md` §1 | openapi.yaml info.description section attributes the received_at date-baseline feature to v1.4.2 and extraction.v3, while back.md does not yet ship v3 or declare DEFAULT_PROMPT_VERSION = 'v3'. Stale description text; does not affect any endpoint, schema, or error code. Known, non-blocking for P2.1 repair cycle. | Back Spec Agent | warning | [ ] |

---

## Result

- [x] All UCs have a corresponding endpoint or MCP tool declared
- [x] All BRs reference existing UCs
- [x] All error.codes in all three artifacts are canonical namespaced codes (P2.1)
- [x] No deprecated §14 short codes appear in any active normative position
- [x] UC-12 alt 4b SYSTEM_INTERNAL_ERROR fix is correct and consistent with BR-26
- [x] HTTP status codes are consistent across all three artifacts and the global catalog
- [x] ProposeMcpEnvelope.error.code enum is complete and contains only registered codes
- [x] All error.codes are present in the global error-codes.md catalog
- [x] 0 blocking inconsistencies — handoff allowed
- [ ] W-01: DEFAULT_PROMPT_VERSION drift (back.md 'v2' vs openapi.yaml 'v3' in description) — non-blocking, carry-over
- [ ] W-02: openapi.yaml description stale for extraction.v3 — non-blocking, carry-over

**Final validation: VALID — handoff_allowed: true**

---

## Triage History

| Date | By | Action | Notes |
|------|----|--------|-------|
| 2026-06-26 | u-spec-validator-sdd_ingestion_spec-validator | Initial validation pass for v1.4.2 | VALID with 1 warning (stale §1 doc, non-blocking) |
| 2026-07-02 | u-spec-validator-sdd_ingestion_spec-validator | P2.1 validation pass for v1.5.0 / back v1.6.1 | INVALID — 1 blocking (B-01: deprecated `INTERNAL` code in spec.md UC-12 alt 4b, missed in P2.1 landing), 2 warnings (W-01 carry-over + W-02 stale schema description) |
| 2026-07-03 | u-spec-validator-sdd_ingestion_spec-validator-repair-2 | Final complete validation for v1.5.1 / back v1.6.1 | VALID — B-01 resolved (UC-12 alt 4b now uses SYSTEM_INTERNAL_ERROR, consistent with BR-26); 2 pre-existing warnings carry over (W-01, W-02); 0 blocking issues; handoff_allowed: true |
