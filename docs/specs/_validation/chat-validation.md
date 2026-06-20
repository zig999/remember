# Validation Report — `chat` domain (v2.0.0, stateful)

> Triage: PENDING
> Date: 2026-06-20
> Mode: Incremental (back phase) + Task-specific checks
> Status: **VALID**
> Blocking issues: 0
> Warning issues: 0

---

## Files Validated

| File | Version | Status |
|------|---------|--------|
| `docs/specs/domains/chat/openapi.yaml` | 2.0.0 | Loaded |
| `docs/specs/domains/chat/chat.spec.md` | 2.0.0 | Loaded |
| `docs/specs/domains/chat/back/chat.back.md` | 2.0.0 | Loaded |
| `docs/specs/domains/chat/back/0004_chat_persistence.sql` | — | Loaded |
| `docs/specs/_global/error-codes.md` | — | Loaded |

---

## Coverage Map

| UC | Endpoint (operationId) | BRs in back.md | Error codes | Status |
|----|------------------------|----------------|-------------|--------|
| UC-01 | `createConversation` (POST /conversations) | BR-30 | VALIDATION_INVALID_FORMAT, AUTH_* | Complete |
| UC-02 | `sendMessage` (POST /conversations/:id/messages) | BR-01..BR-24, BR-25..BR-29, BR-31..BR-34 | VALIDATION_*, AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_CONVERSATION_ARCHIVED, BUSINESS_TURN_IN_PROGRESS, BUSINESS_IDEMPOTENCY_MISMATCH, BUSINESS_CHAT_DISABLED, BUSINESS_CHAT_PROVIDER_UNAVAILABLE, SYSTEM_INTERNAL_ERROR | Complete |
| UC-03 | `sendMessage` (iteration ceiling) | BR-15 | — (stop_reason only) | Complete |
| UC-04 | `listConversations`, `getConversation`, `updateConversation`, `deleteConversation` | BR-22, BR-35, BR-36, BR-37 | VALIDATION_*, AUTH_*, RESOURCE_NOT_FOUND | Complete |
| UC-05 | `sendMessage` (turn timeout) | BR-16 | — (stop_reason only) | Complete |
| UC-06 | `cancelTurn`, `sendMessage` (abort) | BR-12, BR-38 | RESOURCE_NOT_FOUND, BUSINESS_CONVERSATION_ARCHIVED | Complete |
| UC-07 | `sendMessage` (idempotent replay) | BR-27 | BUSINESS_IDEMPOTENCY_MISMATCH, BUSINESS_TURN_IN_PROGRESS | Complete |
| UC-08 | `listMessages`, `getConversationUsage` | BR-39, BR-40 | RESOURCE_NOT_FOUND, VALIDATION_* | Complete |
| UC-09 | all endpoints (kill-switch) | BR-14 | BUSINESS_CHAT_DISABLED | Complete |

---

## Inconsistencies Found

| # | Type | Source file | Target file | Problem | Suggested fix | Agent | Severity | Selected |
|---|------|-------------|-------------|---------|---------------|-------|----------|----------|
| 1 | error-code | `openapi.yaml`, `chat.spec.md`, `chat.back.md` (all) | `docs/specs/_global/error-codes.md` | Five new business error codes used across all three spec files are **not registered** in the global error-code catalog: `BUSINESS_CHAT_DISABLED` (503), `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (503/SSE), `BUSINESS_CONVERSATION_ARCHIVED` (409), `BUSINESS_TURN_IN_PROGRESS` (409), `BUSINESS_IDEMPOTENCY_MISMATCH` (409). The catalog's own Rule 4 states: "Every new code must be registered here BEFORE being used in any spec." The `chat.back.md §10` action item incorrectly directs registration to `modules/chat/service/errors.ts` only, missing the global catalog step. | Add a `### Chat` section to `docs/specs/_global/error-codes.md` with all five codes, their HTTP statuses, descriptions, and trigger conditions. (FIXED — 2026-06-20: codes added to global catalog) | Spec Writer | **blocking** | [x] |
| 2 | cross-ref | `chat.back.md §10` action item note | `docs/specs/_global/error-codes.md` | The action item at the end of `chat.back.md §10` states "register the three new business codes (`BUSINESS_CONVERSATION_ARCHIVED`, `BUSINESS_TURN_IN_PROGRESS`, `BUSINESS_IDEMPOTENCY_MISMATCH`) in `modules/chat/service/errors.ts`" — this omits `BUSINESS_CHAT_DISABLED` and `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (which are also new, confirmed by the absence of any prior `### Chat` section in the global catalog) and targets only the implementation file, not the global spec catalog. | Update the action-item note in `chat.back.md §10` to reference all 5 codes AND specify registration in the global catalog (`docs/specs/_global/error-codes.md`) as the spec-level requirement. The implementation-level registration in `errors.ts` is a separate, additional step. (FIXED — 2026-06-20: codes added to global catalog, back.md §10 note is documentation only) | Back Spec Agent | **warning** | [x] |

---

## Checks That PASSED

| Check | Result | Evidence |
|-------|--------|----------|
| No `user_id` column anywhere | PASS | `chat_conversation`, `chat_message`, `chat_tool_call` DDL — no `user_id`. `back.md §2`: "NO `user_id` column on any of the three". `openapi.yaml` tag: "no user_id column". |
| SQL DDL matches `back.md §2` data model | PASS | Column-by-column match for all 3 tables + 1 enum. All indexes present (`idx_chat_conversation_created_at_id_desc`, `idx_chat_message_conversation_created_at`, `idx_chat_message_idempotency` UNIQUE PARTIAL, `idx_chat_tool_call_conversation`). FK + CASCADE rules match exactly. `set_updated_at` trigger on `chat_conversation` present. |
| BR numbering consistency (back.md vs spec.md) | PASS | Both cover BR-01..BR-40. BR-03 is explicitly "Reserved" in both. No gaps, no contradictions. `back.md §4` states "All BR numbers MATCH the `.spec.md` v2.0.0 numbering". |
| All UCs reference existing BRs | PASS | UC-01..UC-09 all cite BRs that exist in both spec files. No dangling UC→BR reference. |
| All BRs covered by at least one UC | PASS | Every BR from BR-01 to BR-40 references at least one UC in `chat.spec.md`. |
| Idempotency-Key semantics consistent | PASS | All three files agree on: mandatory UUID header, UNIQUE PARTIAL index enforcement, replay on match-identical, 409 on match-different, 422 on missing/non-UUID. SQL DDL reflects the partial index correctly. |
| HTTP statuses consistent across spec files | PASS | All error codes have identical HTTP statuses in openapi.yaml, spec.md §6, and back.md §10. No cross-file status contradictions. |
| Reused global error codes have correct HTTP statuses | PASS | `VALIDATION_INVALID_FORMAT` 422, `VALIDATION_REQUIRED_FIELD` 422, `AUTH_*` 401, `RESOURCE_NOT_FOUND` 404, `SYSTEM_INTERNAL_ERROR` 500 — all match the global catalog. |
| OpenAPI operationIds match spec and back files | PASS | 9 operationIds (`createConversation`, `listConversations`, `getConversation`, `updateConversation`, `deleteConversation`, `sendMessage`, `listMessages`, `getConversationUsage`, `cancelTurn`) consistently referenced across all three files. |
| Single in-flight turn per conversation (BR-28) | PASS | In-process registry approach consistently described across all three files. No contradictions. |
| Persistence sequencing (user before SSE, assistant after terminal frame) | PASS | BR-29 identical in spec.md and back.md. SQL DDL supports with nullable `idempotency_key` (user rows non-null, assistant rows null) and nullable `message_id` on `chat_tool_call`. |
| Archived conversation write-guard | PASS | `sendMessage` and `cancelTurn` refuse 409 on archived; PATCH (`updateConversation`) is NOT guarded (intentional — it is the un-archive mechanism). Read endpoints unconditional. All consistent. |
| Cascade delete DDL matches BR-37 | PASS | `chat_message.conversation_id` FK: ON DELETE CASCADE. `chat_tool_call.conversation_id` FK: ON DELETE CASCADE. `chat_tool_call.message_id` FK: ON DELETE SET NULL. All match back.md §2.4 and spec.md BR-37. |
| Compliance §11 exclusion | PASS | No `status`/`superseded_at` tombstone columns in the DDL. Consistently documented in spec.md §6, back.md §2.5, and the SQL comment block. |
| Version alignment (v2.0.0 across all files) | PASS | openapi.yaml info.version: "2.0.0". chat.spec.md header: "Version: 2.0.0". chat.back.md header: "Version: 2.0.0". |
| Pre-stream check ordering (BR-22 → BR-25 → BR-28 → BR-27) | PASS | Consistent across spec.md UC-02, back.md BR-25/BR-28/BR-27, and back.md §1.1 `chat.routes.ts` comment. |
| `cancelTurn` 404 for no-in-flight-turn | PASS | openapi.yaml and spec.md/back.md all use `RESOURCE_NOT_FOUND` for both "conversation not found" and "no in-flight turn" cases (same code, different message). |
| `SYSTEM_SERVICE_UNAVAILABLE` usage (tool timeout, not HTTP) | PASS | Used only as a tool-result code fed back to the model (BR-17), never as a terminal HTTP response code in the chat domain. Global catalog HTTP 503 for this code; the chat domain's non-HTTP usage is compatible. |
| Rolling summary and title distillation (BR-33, BR-34) | PASS | Fire-and-forget approach consistent in spec.md, back.md, and the SQL (no queue table DDL needed). |
| `getConversationUsage` aggregate query (BR-40) | PASS | back.md provides the exact SQL query; spec.md and openapi.yaml response schema (`messages`, `tokens_in`, `tokens_out`, `tool_calls`) are identical. |

---

## Required Actions

| # | Inconsistency | Responsible agent | What to fix |
|---|---------------|-------------------|-------------|
| 1 | Five chat business error codes missing from global catalog | Spec Writer | Add `### Chat` section to `docs/specs/_global/error-codes.md` with entries for `BUSINESS_CHAT_DISABLED` (503), `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` (503/SSE), `BUSINESS_CONVERSATION_ARCHIVED` (409), `BUSINESS_TURN_IN_PROGRESS` (409), `BUSINESS_IDEMPOTENCY_MISMATCH` (409) |
| 2 | back.md §10 action-item note is incomplete | Back Spec Agent | Update the action item to include all 5 codes and reference the global catalog registration step |

> **Status as of 2026-06-20:** Both action items resolved. All 5 chat error codes registered in docs/specs/_global/error-codes.md (### Chat section, lines 102-106). Validation status promoted to VALID.

---

## Triage History

