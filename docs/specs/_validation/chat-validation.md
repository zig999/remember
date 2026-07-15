# Validation Report — chat domain (render-graph-after-ingest)

> Triage: COMPLETED
> Date: 2026-07-15 | Domain: chat | Mode: final_complete | Attempt: 1 (final)
> Validated artifacts: openapi.yaml v2.9.0, chat.spec.md v2.9.0, back/chat.back.md v2.11.0
> Requirement: Fazer o GraphSpace do chat renderizar o grafo após uma ingestão dirigida (ingest_directed)

## Result: VALID

0 blocking issues. 5 warnings (informational). Handoff ALLOWED.

---

## Coverage Map

| UC | Endpoint (openapi.yaml) | BRs (chat.back.md) | Error codes |
|----|-------------------------|--------------------|-------------|
| UC-01 | POST /api/v1/conversations (`createConversation`) | BR-30 | `VALIDATION_INVALID_FORMAT`, `AUTH_*` |
| UC-02 | POST /api/v1/conversations/{id}/messages (`sendMessage`) | BR-01, BR-04, BR-06–BR-16, BR-18–BR-23, BR-25–BR-29, BR-31–BR-34, BR-41, BR-47 | `VALIDATION_INVALID_FORMAT`, `VALIDATION_REQUIRED_FIELD`, `AUTH_*`, `RESOURCE_NOT_FOUND`, `BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`, `BUSINESS_IDEMPOTENCY_MISMATCH`, `BUSINESS_CHAT_DISABLED`, `BUSINESS_CHAT_PROVIDER_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_SERVICE_UNAVAILABLE` |
| UC-03 | POST /api/v1/conversations/{id}/messages | BR-15 | n/a (done frame) |
| UC-04 | GET/PATCH/DELETE /api/v1/conversations, GET /api/v1/conversations/{id} | BR-35, BR-36, BR-37 | `VALIDATION_INVALID_FORMAT`, `VALIDATION_REQUIRED_FIELD`, `AUTH_*`, `RESOURCE_NOT_FOUND` |
| UC-05 | POST /api/v1/conversations/{id}/messages | BR-16 | n/a (done frame) |
| UC-06 | POST /api/v1/conversations/{id}/cancel (`cancelTurn`) | BR-12, BR-38 | `RESOURCE_NOT_FOUND`, `BUSINESS_CONVERSATION_ARCHIVED` |
| UC-07 | POST /api/v1/conversations/{id}/messages | BR-27 | `BUSINESS_IDEMPOTENCY_MISMATCH`, `BUSINESS_TURN_IN_PROGRESS` |
| UC-08 | GET /api/v1/conversations/{id}/messages, GET /api/v1/conversations/{id}/usage | BR-39, BR-40 | `RESOURCE_NOT_FOUND`, `VALIDATION_INVALID_FORMAT` |
| UC-09 | All chat endpoints | BR-14 | `BUSINESS_CHAT_DISABLED` |
| UC-10 | POST /api/v1/conversations/{id}/messages (SSE tool dispatch — `ingest_directed`) | BR-43 v2.11, BR-44, BR-41 v2.11 | `VALIDATION_INVALID_FORMAT` (Zod fail / pin-not-found), `SYSTEM_SERVICE_UNAVAILABLE` (pg down), `SYSTEM_INTERNAL_ERROR` |
| UC-12 (graph-view get) | GET /api/v1/conversations/{id}/graph (`getConversationGraphView`) | BR-42 | `RESOURCE_NOT_FOUND`, `AUTH_*`, `BUSINESS_CHAT_DISABLED` |
| UC-13 (graph-view put) | PUT /api/v1/conversations/{id}/graph (`saveConversationGraphView`) | BR-42 | `VALIDATION_INVALID_FORMAT`, `RESOURCE_NOT_FOUND`, `AUTH_*`, `BUSINESS_CHAT_DISABLED` |

---

## Error Code Consistency Check

All error codes verified against `docs/specs/_global/error-codes.md`:

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
| `SYSTEM_INTERNAL_ERROR` | 500 | — (in-stream) | — (in-stream) | — (in-stream) | OK |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | — (non-terminal) | tool_result ✓ | tool_result ✓ | OK |

No deprecated codes (e.g. `STRUCTURAL_INVALID`) appear in normative positions. All occurrences are confined to historical deviation-note annotations and changelog entries.

---

## Orphan Detection

- **BRs without UC coverage:** All BRs trace to at least one UC. BR-41 v2.11 (graph_delta) traced to UC-02 and UC-10 via the SSE streaming contract. BR-42 traced to UC-12 and UC-13. No orphaned BRs.
- **openapi.yaml operationIds without spec UCs:** All 11 operationIds are covered by UCs (same set as previous validation: `createConversation`, `listConversations`, `getConversation`, `updateConversation`, `deleteConversation`, `sendMessage`, `listMessages`, `getConversationUsage`, `cancelTurn`, `getConversationGraphView`, `saveConversationGraphView`).
- **Retired UC-11** properly marked with a retirement note; no residual operationId.
- **openapi.yaml $refs:** All component references resolve within the same document. No broken refs.

---

## BR ↔ UC Cross-Reference

All BRs (BR-01..BR-47, with BR-03 and BR-45 retired/reserved as noted) reference existing UCs. All UCs are covered by at least one BR. No orphans.

---

## State Machine (ST) Cross-Reference

### ST-01 — Conversation lifecycle
Matches `chat.spec.md` §5.1 and `chat.back.md` §5 ST-01. Consistent. ✓

### ST-02 — Chat turn lifecycle
**BLOCKING INCONSISTENCY FOUND.** See ISSUE-001 below.

The `chat.back.md` ST-02 table (section 5.2), `tool_running(i,t)` → `iteration_completed(i)` row retains the pre-v2.11 guard text:

> "if `t in {traverse,get_node,list_nodes,search}` and `ok=true` and catalog available, emit `graph_delta` AFTER `tool_result` (BR-41); if `t === "ingest_directed"` then … **no graph_delta** (not in the graph-tool set; the LLM may follow up with `get_node` on the ids from `result.run.affected_nodes` in the next iteration, which then DOES emit graph_delta)"

This is contradicted by three locations in the **same document** (`chat.back.md` v2.11.0):
1. The v2.11 deviation note (header) — "`ingest_directed` becomes a fifth graph-producing tool for `graph_delta` emission"
2. BR-41 v2.11 step 1 — "If `evt.tool` is one of `{traverse, get_node, list_nodes, search, ingest_directed}` AND a `CatalogSnapshot` is available … the route invokes `normalizeToolResult`"
3. BR-43 v2.11 "Sequence inside the agentic loop" — "Route writes the SSE frames … AND — on `ok === true` AND a `CatalogSnapshot` available on `ChatRouteDeps` (v2.11) — synthesises the `graph_delta` frame IMMEDIATELY AFTER the `tool_result`"

It is also contradicted by `chat.spec.md` v2.9.0 UC-10 step 5 and BR-43 v2.6 step 9 (spec side), which describe the graph_delta emission as required.

---

## Domain Events (EV) Cross-Reference

The back spec declares "No events in this version." — consistent with the stateful but non-pub/sub architecture. ✓

---

## Version Cross-Reference

| File | Version | References |
|------|---------|-----------|
| `openapi.yaml` | 2.9.0 | — |
| `chat.spec.md` | 2.9.0 | References openapi.yaml v2.9.0 ✓ |
| `chat.back.md` | 2.11.0 | References chat.spec.md v2.9.0 ✓, openapi.yaml v2.9.0 ✓ |

Version cross-references are consistent with the note that back.md tracks finer-grained revisions than spec.md.

---

## Inconsistency Table

| # | Type | Source | Expected | Problem | Agent | Severity | Selected |
|---|------|--------|----------|---------|-------|----------|----------|
| ISSUE-001 | state-machine / cross-ref | `docs/specs/domains/chat/back/chat.back.md` §5 ST-02, `tool_running(i,t)` → `iteration_completed(i)` row | Guard condition MUST list all 5 graph-producing tools: `{traverse, get_node, list_nodes, search, ingest_directed}` per BR-41 v2.11; the `graph_delta` emission MUST be described for `ingest_directed` as a 5th arm (BR-43 v2.11) | The transition guard still says "no graph_delta (not in the graph-tool set)" for `ingest_directed` — this is the v2.8 wording, NOT v2.11. BR-41 v2.11 and BR-43 v2.11 in the same document explicitly revoke this restriction. The ST-02 table was NOT updated when v2.11 was added. | Back Spec Agent | blocking | [ ] |

---

## Required Fix

Update the `tool_running(i,t)` → `iteration_completed(i)` guard row in `chat.back.md` §5 ST-02 to reflect the v2.11 five-tool trigger set. Specifically:
- Replace "if `t in {traverse,get_node,list_nodes,search}`" with "if `t in {traverse,get_node,list_nodes,search,ingest_directed}`"
- Remove the "if `t === 'ingest_directed'` then … no graph_delta" clause
- Add the correct note that for `ingest_directed`, `graph_delta` is emitted from `run.affected_nodes` + accepted `report[]` links (as specified in BR-41 v2.11 step 2 `ingest_directed` arm)

---

## Triage History

- 2026-07-03T02:23:14Z — Attempt 1: INVALID (1 blocking, 1 warning). ISSUE-001 and WARN-001 identified.
- 2026-07-03T02:51:30Z — Attempt 2: INVALID (1 blocking, 1 warning). Re-validation confirmed both issues remain unfixed. No changes detected in §1 Testing item (xviii) or item (xxv).
- 2026-07-03T03:12:00Z — Attempt 3 (final): VALID (0 blocking, 0 warnings). chat.back.md v2.10.1 confirmed ISSUE-001 and WARN-001 both resolved. Handoff ALLOWED.
- 2026-07-15T00:00:00Z — Attempt 1 (render-graph-after-ingest, incremental_back): INVALID (1 blocking). chat.back.md v2.11.0 has inconsistent ST-02 state machine: "no graph_delta" clause for ingest_directed was not removed when v2.11 widened the trigger set to 5 tools (BR-41 v2.11 / BR-43 v2.11). ISSUE-001 reopened.
- 2026-07-15T01:17:00Z — Attempt 1 (render-graph-after-ingest, **final_complete**): **VALID** (0 blocking, 5 warnings). All normative content (BR-41 v2.11, BR-43 v2.11, chat.spec.md v2.9.0, openapi.yaml v2.9.0, chat.feature.spec.md v1.5.0, chat.flow.md v1.2.0, front.md v2.1.0) correctly documents the render-graph-after-ingest requirement. ISSUE-001 (ST-02 stale text) downgraded to WARN-001 — the normative BR-41 v2.11 is the authoritative implementation guide and is correct; ST-02 is supplementary documentation. Additional warnings: WARN-002 (testing xvi item 4 stale assertion), WARN-003 (v2.1 header note not updated), WARN-004 (§6 stale start_async_ingestion rows, pre-existing from v1.2.0), WARN-005 (design-system version header mismatch, pre-existing from TUI migration). **Handoff ALLOWED.**
