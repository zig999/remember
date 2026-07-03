# Validation Report — chat domain (P2.1 final complete)

> Triage: COMPLETED
> Date: 2026-07-03 | Domain: chat | Mode: final_complete | Attempt: 3
> Validated artifacts: openapi.yaml v2.8.0, chat.spec.md v2.8.2, back/chat.back.md v2.10.1
> Requirement: P2.1 — Unify BFF error-code taxonomy under canonical NAMESPACED vocabulary

## Result: VALID

0 blocking inconsistencies. 0 warnings.
Handoff is ALLOWED.

**Repair summary (attempt 3 — final pass):**
Both previously known issues are confirmed RESOLVED in chat.back.md v2.10.1:
- ISSUE-001 (chat.back.md §1 Testing item (xviii) used `STRUCTURAL_INVALID`): FIXED — item (xviii) now uses `VALIDATION_INVALID_FORMAT` as the canonical code throughout; `STRUCTURAL_INVALID` appears only in the historical parenthetical note "(P2.1 canonical; pre-P2.1 short-form was `STRUCTURAL_INVALID`)" which is contextual, not normative.
- WARN-001 (item (xxv) had a stale positive assertion on `start_async_ingestion`): FIXED — item (xxv) now carries an explicit **negative assertion** that `start_async_ingestion` MUST NOT appear as a key in the resolved catalog on EITHER branch of `CHAT_INGEST_ENABLED`, labelled as "WARN-001 of chat-validation.md 2026-07-03".

---

## Coverage Map

| UC | Endpoint (openapi.yaml) | BRs (chat.back.md) | Error codes |
|----|-------------------------|--------------------|-------------|
| UC-01 | POST /api/v1/conversations (`createConversation`) | BR-30 | `VALIDATION_INVALID_FORMAT`, `AUTH_*` |
| UC-02 | POST /api/v1/conversations/{id}/messages (`sendMessage`) | BR-01, BR-04, BR-06–BR-16, BR-18–BR-23, BR-25–BR-29, BR-31–BR-33, BR-43, BR-47 | `VALIDATION_INVALID_FORMAT`, `VALIDATION_REQUIRED_FIELD`, `AUTH_*`, `RESOURCE_NOT_FOUND`, `BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`, `BUSINESS_IDEMPOTENCY_MISMATCH`, `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_SERVICE_UNAVAILABLE`, `VALIDATION_INVALID_FORMAT` (ingest_directed) |
| UC-03 | POST /api/v1/conversations/{id}/messages | BR-15 | n/a (done frame) |
| UC-04 | GET/PATCH/DELETE /api/v1/conversations, GET /api/v1/conversations/{id} | BR-35, BR-36, BR-37 | `VALIDATION_INVALID_FORMAT`, `VALIDATION_REQUIRED_FIELD`, `AUTH_*`, `RESOURCE_NOT_FOUND` |
| UC-05 | POST /api/v1/conversations/{id}/messages | BR-16 | n/a (done frame) |
| UC-06 | POST /api/v1/conversations/{id}/cancel (`cancelTurn`) | BR-12, BR-38 | `RESOURCE_NOT_FOUND`, `BUSINESS_CONVERSATION_ARCHIVED` |
| UC-07 | POST /api/v1/conversations/{id}/messages | BR-27 | `BUSINESS_IDEMPOTENCY_MISMATCH`, `BUSINESS_TURN_IN_PROGRESS` |
| UC-08 | GET /api/v1/conversations/{id}/messages, GET /api/v1/conversations/{id}/usage | BR-39, BR-40 | `RESOURCE_NOT_FOUND`, `VALIDATION_INVALID_FORMAT` |
| UC-09 | All chat endpoints | BR-14 | `BUSINESS_CHAT_DISABLED` |
| UC-10 | POST /api/v1/conversations/{id}/messages (SSE tool dispatch — `ingest_directed`) | BR-43, BR-44 | `VALIDATION_INVALID_FORMAT` (ingest_directed Zod fail / pin-not-found), `SYSTEM_SERVICE_UNAVAILABLE` (pg down), `SYSTEM_INTERNAL_ERROR` |
| UC-12 (graph-view get) | GET /api/v1/conversations/{id}/graph (`getConversationGraphView`) | BR-42 | `RESOURCE_NOT_FOUND`, `AUTH_*`, `BUSINESS_CHAT_DISABLED` |
| UC-13 (graph-view put) | PUT /api/v1/conversations/{id}/graph (`saveConversationGraphView`) | BR-42 | `VALIDATION_INVALID_FORMAT`, `RESOURCE_NOT_FOUND`, `AUTH_*`, `BUSINESS_CHAT_DISABLED` |

---

## Error Code Consistency Check

All error codes used in the three files were verified against `docs/specs/_global/error-codes.md`:

| error.code | Catalog HTTP | openapi.yaml | chat.spec.md | chat.back.md | Status |
|------------|-------------|--------------|--------------|--------------|--------|
| `VALIDATION_INVALID_FORMAT` | 422 | 422 ✓ | 422 ✓ | 422 ✓ | OK |
| `VALIDATION_REQUIRED_FIELD` | 422 | 422 ✓ | 422 ✓ | 422 ✓ | OK |
| `AUTH_UNAUTHORIZED` | 401 | 401 ✓ | 401 ✓ | 401 ✓ | OK |
| `AUTH_TOKEN_EXPIRED` | 401 | 401 ✓ | 401 ✓ | 401 ✓ | OK |
| `AUTH_TOKEN_INVALID` | 401 | 401 ✓ | 401 ✓ | 401 ✓ | OK |
| `RESOURCE_NOT_FOUND` | 404 | 404 ✓ | 404 ✓ | 404 ✓ | OK |
| `BUSINESS_CONVERSATION_ARCHIVED` | 409 | 409 ✓ | 409 ✓ | 409 ✓ | OK |
| `BUSINESS_IDEMPOTENCY_MISMATCH` | 409 | 409 ✓ | 409 ✓ | 409 ✓ | OK |
| `BUSINESS_TURN_IN_PROGRESS` | 409 | 409 ✓ | 409 ✓ | 409 ✓ | OK |
| `BUSINESS_CHAT_DISABLED` | 503 | 503 ✓ | 503 ✓ | 503 ✓ | OK |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503 | 503 ✓ | 503 ✓ | 503 ✓ | OK |
| `BUSINESS_CHAT_INGEST_DISABLED` | 503 | 503 ✓ | — | 503 ✓ | OK (reserved, not emitted at runtime) |
| `SYSTEM_INTERNAL_ERROR` | 500 | 500 ✓ | — (in-stream) | — (in-stream) | OK |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | — (not a terminal SSE code) | tool_result ✓ | tool_result ✓ | OK (non-terminal, correct) |

**Deprecated codes in active normative positions:** None detected.

All occurrences of `STRUCTURAL_INVALID` in the three files are confined to:
- Historical annotations in deviation notes (chat.back.md lines 19, 24, 1672) explaining pre-fix behaviour
- Parenthetical "pre-P2.1 short-form was `STRUCTURAL_INVALID`" contextual notes in BRs and test items
- Changelog entries describing what changed in v2.8.0/v2.10.0/v2.10.1
- The informational v2.8.0 description block in openapi.yaml (lines 32–33, 49)

None of these constitute normative wire positions or test assertions. All normative positions use `VALIDATION_INVALID_FORMAT` or other canonical namespaced codes exclusively.

---

## Orphan Detection

- **BRs without UC coverage:** All BRs traced to at least one UC. BR-41 (graph_delta) traced to UC-02 through the SSE streaming contract; BR-42 (graph-view snapshot) traced to UC-12 and UC-13. No orphaned BRs found.
- **openapi.yaml operationIds without spec UCs:** All 11 operationIds (`createConversation`, `listConversations`, `getConversation`, `updateConversation`, `deleteConversation`, `sendMessage`, `listMessages`, `getConversationUsage`, `cancelTurn`, `getConversationGraphView`, `saveConversationGraphView`) are covered by UCs.
- **Retired UC-11** properly retired in v2.4.0 with a retirement marker; no residual operationId.
- **openapi.yaml $refs:** All 29 component references (schemas + responses + parameters) resolve within the same document. No broken or external $refs.

---

## Cross-Reference Validation

### BR ↔ UC
All BRs reference existing UCs. All UCs are covered by at least one BR. No orphaned BRs or UCs.

### Error codes ↔ openapi.yaml
All error codes used in §6 of chat.spec.md and §10 of chat.back.md are present in the corresponding HTTP responses in openapi.yaml with matching HTTP status codes.

---

## Version Cross-Reference

| File | Version | References |
|------|---------|-----------|
| `openapi.yaml` | 2.8.0 | — |
| `chat.spec.md` | 2.8.2 | References openapi.yaml v2.8.0 ✓ |
| `chat.back.md` | 2.10.1 | References chat.spec.md v2.8.2 ✓, openapi.yaml v2.8.0 ✓ |

All version cross-references are consistent.

---

## Inconsistency Table

No inconsistencies found.

| # | Type | Source | Expected | Problem | Agent | Severity | Selected |
|---|------|--------|----------|---------|-------|----------|----------|
| (none) | | | | | | | |

---

## Triage History

- 2026-07-03T02:23:14Z — Attempt 1: INVALID (1 blocking, 1 warning). ISSUE-001 and WARN-001 identified.
- 2026-07-03T02:51:30Z — Attempt 2: INVALID (1 blocking, 1 warning). Re-validation confirmed both issues remain unfixed. No changes detected in §1 Testing item (xviii) or item (xxv).
- 2026-07-03T03:12:00Z — Attempt 3 (final): VALID (0 blocking, 0 warnings). chat.back.md v2.10.1 confirmed ISSUE-001 and WARN-001 both resolved. Handoff ALLOWED.
