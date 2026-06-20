# Validation: chat v1.0.1 (back phase — REPAIR CYCLE 1)

> Validator: Spec Validator | Date: 2026-06-19
> Status: VALID
> Triage: COMPLETED

## Coverage Map

| UC | Endpoint | BRs (spec.md) | BRs (back.md) | Status |
|----|----------|---------------|---------------|--------|
| UC-01 | POST /api/v1/chat (chatTurn) | BR-01..BR-04, BR-08, BR-11, BR-12 | BR-01..BR-04, BR-07, BR-08, BR-11, BR-18..BR-21, BR-23, BR-24 | COVERED |
| UC-02 | POST /api/v1/chat (chatTurn) | BR-05..BR-07, BR-09, BR-10, BR-13 | BR-05..BR-10, BR-12, BR-13, BR-17, BR-22 | COVERED |
| UC-03 | POST /api/v1/chat (chatTurn) | BR-15 | BR-15 | COVERED |
| UC-04 | POST /api/v1/chat (chatTurn) | BR-16 | BR-16 | COVERED |
| UC-05 | POST /api/v1/chat (chatTurn) | BR-12 | BR-12 | COVERED |
| UC-06 | POST /api/v1/chat (chatTurn) | BR-14 | BR-14 | COVERED |

> Note: back.md BR-21..BR-24 are additional back-spec-only rules (not in spec.md) — acceptable;
> back.md may refine implementation details beyond the business spec.

## Inconsistencies

| # | Type | Source File | Target File | Description | Agent | Severity | Selected |
|---|------|------------|-------------|-------------|-------|----------|----------|
| 1 | ~~error-code HTTP mismatch~~ | ~~`openapi.yaml`~~ | ~~`error-codes.md`~~ | **RESOLVED (REPAIR-1):** `VALIDATION_INVALID_FORMAT` has been corrected from HTTP 400 to HTTP 422 across `openapi.yaml` (response key + inline description), `chat.spec.md` (UC-01 §3, BR-01..BR-04 §4, §5 state machine, §6 error table), and `chat.back.md` (§1 Validation library row, BR-01..BR-04). All three files are now aligned with the global catalog (HTTP 422). | Spec Writer | ~~blocking~~ resolved | [x] |
| 2 | dependency — missing reverse declaration | `query-retrieval/query-retrieval.spec.md` | `chat/chat.spec.md` §7 | `chat.spec.md` §7 consumes `query-retrieval` (4 read tools). The reverse declaration is absent from `query-retrieval.spec.md`. The chat spec acknowledges and defers to next revision. | Spec Writer | warning | [ ] |
| 3 | dependency — missing reverse declaration | `knowledge-graph/knowledge-graph.spec.md` | `chat/chat.spec.md` §7 | Same as #2 for `knowledge-graph` (9 read tools consumed by chat). The reverse declaration is absent from `knowledge-graph.spec.md`. | Spec Writer | warning | [ ] |
| 4 | dependency — draft status | `query-retrieval.spec.md` | `chat/chat.spec.md` §7 | `query-retrieval.spec.md` has `Status: draft`. Validation rules require consumed domains to have `approved` status. Systemic state — both domains are in the same SDD wave. | Spec Writer | warning | [ ] |
| 5 | dependency — draft status | `knowledge-graph.spec.md` | `chat/chat.spec.md` §7 | `knowledge-graph.spec.md` has `Status: draft`. Same concern as #4. | Spec Writer | warning | [ ] |

## Error Codes

| error.code | openapi.yaml | chat.spec.md | chat.back.md | Global catalog | Status |
|------------|-------------|-------------|-------------|---------------|--------|
| `VALIDATION_INVALID_FORMAT` | HTTP 422 | HTTP 422 | HTTP 422 | HTTP 422 | OK (fixed by REPAIR-1) |
| `AUTH_UNAUTHORIZED` | HTTP 401 | HTTP 401 | (inherited) | HTTP 401 | OK |
| `AUTH_TOKEN_EXPIRED` | HTTP 401 | HTTP 401 | (inherited) | HTTP 401 | OK |
| `AUTH_TOKEN_INVALID` | HTTP 401 | HTTP 401 | (inherited) | HTTP 401 | OK |
| `BUSINESS_CHAT_DISABLED` | HTTP 503 | HTTP 503 | HTTP 503 | HTTP 503 | OK |
| `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` | 503/SSE error | 503/SSE error | 503/SSE error | 503/n-a | OK |
| `SYSTEM_INTERNAL_ERROR` | HTTP 500 / SSE error | SSE error | SSE error | HTTP 500 | OK |
| `SYSTEM_SERVICE_UNAVAILABLE` | (not in HTTP responses; in-loop only) | (not in HTTP responses; in-loop only) | (BR-17, in-loop fed to model) | HTTP 503 | OK — not a terminal SSE or HTTP code; used correctly as model-facing tool error |

## State Machine Coverage

| State (spec.md §5) | State (back.md ST-01) | Match |
|--------------------|-----------------------|-------|
| `idle` | `idle` | ✓ |
| `validating` | `validating` | ✓ |
| `closed_pre_stream` | `closed_pre_stream` | ✓ |
| `streaming_open` | `streaming_open` | ✓ |
| `llm_streaming(i)` | `llm_streaming(i)` | ✓ |
| `tool_pending(i,t)` | `tool_pending(i,t)` | ✓ |
| `tool_running(i,t)` | `tool_running(i,t)` | ✓ |
| `iteration_completed(i)` | `iteration_completed(i)` | ✓ |
| `done_end` | (implicit via any `done_*`) | ✓ |
| `done_max_iterations` | `done_max_iterations` | ✓ |
| `done_cancelled` | `done_cancelled` | ✓ |
| `done_timeout` | `done_timeout` | ✓ |
| `done_error` | `done_error` | ✓ |
| `aborting` | `aborting` | ✓ |
| `aborting_timeout` | `aborting_timeout` | ✓ |
| `closed` | `closed` | ✓ |

All states align. Technical guards in back.md (abort signal inspection, socket writability check, timer clearTimeout) are additive detail — consistent, not contradictory.

## Dependencies

| Domain | Exists | Status | Bidirectional | Notes |
|--------|--------|--------|---------------|-------|
| `query-retrieval` | YES | draft | NO (missing reverse) | chat.spec.md §7 acknowledges; fix in next revision |
| `knowledge-graph` | YES | draft | NO (missing reverse) | same |
| `ingestion` | YES | — | N/A | pattern-only coupling; spec explicitly states no bidirectional declaration needed |

## Additional Checks Passed

- **UC → Endpoint**: all 6 UCs reference operationId `chatTurn` which exists in `openapi.yaml` ✓
- **BR → UC**: all 24 back.md BRs reference existing UCs (UC-01..UC-06) ✓
- **BR alignment**: all 20 spec.md BRs have a corresponding back.md BR with consistent semantics ✓
- **No orphan BRs**: back.md BR-21..BR-24 are implementation refinements, not orphaned ✓
- **openapi.yaml $ref integrity**: all `$ref` values resolve to named components defined in the same file ✓ (ErrorResponse, ChatTurnRequest, ChatRole, ChatMessage, SSEStream, and all SSE event schemas)
- **Event domain (EV)**: back.md §5 correctly declares no domain events for a stateless v1 ✓
- **New error codes registered**: `BUSINESS_CHAT_DISABLED` and `BUSINESS_CHAT_PROVIDER_UNAVAILABLE` are present in the global catalog ✓
- **Stack consistency**: Node.js 20 / TypeScript strict / Fastify / Zod v4 / pino — all match CLAUDE.md ✓
- **No migration**: domain correctly declares zero migrations for stateless v1 ✓
- **Tool list consistency**: 13 tools enumerated consistently across openapi.yaml description, spec.md BR-05, and back.md BR-05 ✓
- **Version consistency**: chat.spec.md 1.0.1 (patched), back.md 1.1.1 (patched) — changelogs correctly record REPAIR-1 ✓
- **BR-10 in-loop VALIDATION_INVALID_FORMAT**: correctly noted as "fed back to model, not emitted as SSE error" — not a catalog HTTP status violation ✓
- **REPAIR-1 verification**: all three files (openapi.yaml, chat.spec.md, chat.back.md) consistently use HTTP 422 for VALIDATION_INVALID_FORMAT — matches global catalog ✓

## Result

- [x] UC coverage complete ✓
- [x] Error codes consistent ✓ (VALIDATION_INVALID_FORMAT: all files now use HTTP 422 — REPAIR-1 applied)
- [x] No orphan specs ✓
- [ ] Dependencies valid — warnings only (draft status of consumed domains; missing reverse declarations, acknowledged by spec)

**Blocking issues: 0**
**Warning issues: 4** (inconsistencies #2..#5 — pre-existing, acknowledged by spec)

**FINAL RESULT: VALID** — no blocking inconsistencies; 4 pre-existing warnings (dependency-level, acknowledged). Handoff allowed.

## Triage History

| Date | Selected items | Activated agents | Result |
|------|---------------|-----------------|--------|
| 2026-06-19 | #1 (VALIDATION_INVALID_FORMAT HTTP 400→422) | Spec Writer | RESOLVED — all three files corrected (openapi.yaml v1.0.0, chat.spec.md v1.0.1, chat.back.md v1.1.1) |
| 2026-06-19 (REPAIR-1) | — | Spec Validator | Re-validation confirms blocking issue #1 resolved; status upgraded to VALID |
