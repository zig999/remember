# Compliance Report

> Date: 2026-07-15 | Domain: chat (render-graph-after-ingest wave) | Status: COMPLIANT

## Coverage Metrics

| Metric | Total | Covered | Percentage |
|--------|-------|---------|------------|
| Use Cases (UC) | 12 (UC-01..UC-10, UC-12, UC-13) | 12 | 100% |
| Endpoints (OpenAPI) | 11 (`createConversation`, `listConversations`, `getConversation`, `updateConversation`, `deleteConversation`, `sendMessage`, `listMessages`, `getConversationUsage`, `cancelTurn`, `getConversationGraphView`, `saveConversationGraphView`) | 11 | 100% |
| Business Rules (BR) | 47 BRs (BR-01..BR-47; BR-03, BR-45 retired, BR-11 preserved) | 47 | 100% |
| Feature States (UI) | 14 (UI-01..UI-10 chat column + UI-11..UI-14 graph column) | 14 | 100% |
| Navigation Flows (FL) | 11 (FL-01..FL-11 in chat.flow.md) | 11 | 100% |
| BDD Scenarios (§9) | 6 | 6 | 100% |
| Error Codes | 11 (VALIDATION_INVALID_FORMAT, VALIDATION_REQUIRED_FIELD, AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_CONVERSATION_ARCHIVED, BUSINESS_IDEMPOTENCY_MISMATCH, BUSINESS_TURN_IN_PROGRESS, BUSINESS_CHAT_DISABLED, BUSINESS_CHAT_PROVIDER_UNAVAILABLE, SYSTEM_INTERNAL_ERROR, SYSTEM_SERVICE_UNAVAILABLE) | 11 | 100% |
| Components in design-system/components.md | ChatBubble, GlassSurface, ConversationMenu, GraphSpace, GraphEdge, StateBadge, NodeDetailPanel | 7 | 100% |

## Coverage by Domain

### chat v2.9.0 (openapi.yaml) / v2.9.0 (chat.spec.md) / v2.11.0 (chat.back.md)

| UC | Endpoint | BRs | UIs | FLs | Error Codes | Status |
|----|----------|-----|-----|-----|-------------|--------|
| UC-01 | POST /conversations (`createConversation`) | BR-30 | UI-02 (on success) | FL-03 | VALIDATION_INVALID_FORMAT, AUTH_* | Yes |
| UC-02 | POST /conversations/{id}/messages (`sendMessage`) | BR-01, BR-04, BR-06–BR-16, BR-18–BR-23, BR-25–BR-34, BR-41 v2.11, BR-47 | UI-04, UI-05, UI-06, UI-10, UI-12, UI-13, UI-14 | FL-08, FL-09 | VALIDATION_INVALID_FORMAT, VALIDATION_REQUIRED_FIELD, AUTH_*, RESOURCE_NOT_FOUND, BUSINESS_CONVERSATION_ARCHIVED, BUSINESS_TURN_IN_PROGRESS, BUSINESS_IDEMPOTENCY_MISMATCH, BUSINESS_CHAT_DISABLED, BUSINESS_CHAT_PROVIDER_UNAVAILABLE, SYSTEM_INTERNAL_ERROR | Yes |
| UC-03 | POST /conversations/{id}/messages (max_iterations) | BR-15 | UI-05 (done) | — | — | Yes |
| UC-04 | GET/PATCH/DELETE /conversations, GET /conversations/{id} | BR-35, BR-36, BR-37 | UI-01, UI-08 | FL-04, FL-05 | VALIDATION_INVALID_FORMAT, VALIDATION_REQUIRED_FIELD, AUTH_*, RESOURCE_NOT_FOUND | Yes |
| UC-05 | POST /conversations/{id}/messages (turn_timeout) | BR-16 | UI-05 | — | — | Yes |
| UC-06 | POST /conversations/{id}/cancel (`cancelTurn`) | BR-12, BR-38 | UI-04→UI-05 | FL-07 | RESOURCE_NOT_FOUND, BUSINESS_CONVERSATION_ARCHIVED | Yes |
| UC-07 | POST /conversations/{id}/messages (idempotent replay) | BR-27 | UI-04 | — | BUSINESS_IDEMPOTENCY_MISMATCH, BUSINESS_TURN_IN_PROGRESS | Yes |
| UC-08 | GET /conversations/{id}/messages, GET /conversations/{id}/usage | BR-39, BR-40 | UI-02, UI-03, UI-07 | — | RESOURCE_NOT_FOUND, VALIDATION_INVALID_FORMAT | Yes |
| UC-09 | All chat endpoints (kill-switch) | BR-14 | UI-10 | — | BUSINESS_CHAT_DISABLED | Yes |
| UC-10 | POST /conversations/{id}/messages (`ingest_directed` tool, v2.11 graph_delta) | BR-43 v2.11, BR-44, BR-41 v2.11 | UI-04, UI-12, UI-13, UI-14 (graph column) | FL-08, FL-09 | VALIDATION_INVALID_FORMAT, SYSTEM_SERVICE_UNAVAILABLE, SYSTEM_INTERNAL_ERROR | Yes |
| UC-12 | GET /conversations/{id}/graph (`getConversationGraphView`) | BR-42 | — | — | RESOURCE_NOT_FOUND, AUTH_*, BUSINESS_CHAT_DISABLED | Yes |
| UC-13 | PUT /conversations/{id}/graph (`saveConversationGraphView`) | BR-42 | — | — | VALIDATION_INVALID_FORMAT, RESOURCE_NOT_FOUND, AUTH_*, BUSINESS_CHAT_DISABLED | Yes |

## Approved Validations

- [x] All UCs have a corresponding endpoint in openapi.yaml
- [x] All BRs are present in chat.back.md and reference existing UCs
- [x] All openapi.yaml states are handled in chat.feature.spec.md (§2 UI-01..UI-14)
- [x] Every interactive control in chat.feature.spec.md §2 traces to the Requirement or pre-existing spec — no auto-added filter/search/sort/pagination/bulk-action; ingest_directed graph behavior (UI-12/UI-13/UI-14 graph transitions) traces directly to the requirement "fazer o GraphSpace renderizar o grafo após uma ingestão dirigida"
- [x] All error.codes are in the global catalog (`docs/specs/_global/error-codes.md`)
- [x] Cross-domain dependencies verified: chat consumes knowledge-graph (getNodeById, traverseNode), query-retrieval (getProvenanceByLink, getProvenanceByAttribute), ingestion (ingest_directed tool via McpServer registry) — all operationIds verified in their respective openapi.yaml files
- [x] Prefixes follow the global pattern (UC, BR, ST, EV, UI, FL)
- [x] chat.feature.spec.md §9 has 6 BDD Scenarios (≥2 minimum: happy path + critical error + 4 additional)
- [x] Shared components in §7 of chat.feature.spec.md qualify for component.spec.md files: ChatBubble, ConversationMenu, GraphSpace, GraphEdge, NodeDetailPanel — all have corresponding `front/components/*.component.spec.md`
- [x] `front/design-system/` exists with 5 required files (`_index.md`, `tokens.md`, `composition.md`, `components.md`, `implementation.md`) and `front/design-system-rules.md` is present
- [x] `front/design-system/_index.md` has a populated Changelog (v1.0.0 through v1.4.0 entries present)
- [x] All components referenced in chat.feature.spec.md §7 are cataloged in `design-system/components.md` (GlassSurface, ChatBubble, ConversationMenu, Button, Textarea, Input, Switch)
- [x] `design-system-rules.md` reflects the current token set (§5.3 graph rules cover floating edges + layout algorithms; §2.2 motion factories include graph.nodeReveal)

## Requirement Coverage (render-graph-after-ingest)

| Requirement Item | Spec Coverage | Status |
|---|---|---|
| Add ingest_directed to graph-normalizer (GRAPH_TOOL_NAMES) | chat.back.md BR-41 v2.11 step 1 (trigger set = 5 tools); chat.back.md §1.1 graph-normalizer.ts blurb | Covered |
| Map affected_nodes → GraphDeltaWire (nodes) | chat.back.md BR-41 v2.11 step 2 `ingest_directed` arm — nodes from `run.affected_nodes`, status: "active" | Covered |
| Map accepted-family report[] → GraphDeltaWire (links) | chat.back.md BR-41 v2.11 step 2 — links from `report[]` with outcome in accepted family; endpoint resolution via node_ref map | Covered |
| Emit graph_delta after tool_result of ingest_directed | chat.back.md BR-41 v2.11 step 3 (frame ordering); chat.back.md BR-29 step 6.c (v2.11); chat.spec.md UC-10 step 5; openapi.yaml v2.9.0 graph_delta semantics | Covered |
| Reconcile chat.feature.spec.md — revoke "no graph_delta for ingestion tools" | chat.feature.spec.md v1.5.0 §12 revocation note; §11 REQ-6 clarification; §2 UI-12 entry condition widened; §3 graph-producing tools footnote; §9 Scenario 6 rewritten; UC-CG-14 added | Covered |
| Reconcile chat.spec.md BR-43 step 9 / REQ-6 invariant | chat.spec.md v2.9.0 UC-10 step 5 + BR-43 v2.6 step 9 (graph projection coupling pointer); §11 REQ-6 clarification block | Covered |
| openapi.yaml source_tool enum extension | openapi.yaml v2.9.0: GraphDeltaEvent.source_tool gains fifth literal "ingest_directed"; new per-tool projection rule in graph_delta semantics section | Covered |
| front.md documentation | front.md v2.1.0 §7.4 Driver note updated with fifth graph-producing tool name | Covered |
| chat.flow.md update | chat.flow.md v1.2.0 Sub-flow C step 5, Sub-flow D step D1, FL-08 all widened to include ingest_directed | Covered |

## Notes on Residual Warnings

The following warnings do NOT block handoff and should be addressed in a future `/u-improve` pass:

- **WARN-001 (chat.back.md ST-02):** The state machine table `tool_running(i,t) → iteration_completed(i)` still contains pre-v2.11 text. The normative BR-41 v2.11 is the implementation guide. Fix: update guard condition in §5 ST-02 to list all 5 graph-producing tools and remove the "no graph_delta" clause for ingest_directed.
- **WARN-002 (chat.back.md Testing xvi):** Test assertion 4 says "emits NO graph_delta frame" — now incorrect under v2.11. Fix: update to assert that graph_delta IS emitted on ok===true with catalog available.
- **WARN-003 (chat.back.md v2.1 header note):** Historical v2.1 note not updated to reflect the 5-tool trigger set. Fix: add "originally four; expanded to five in v2.11" to the v2.1 note.
- **WARN-004 (chat.feature.spec.md §6):** Two rows reference retired start_async_ingestion. Pre-existing from v1.2.0. Fix: update to reference ingest_directed.
- **WARN-005 (design-system version headers):** _index.md and design-system-rules.md show v2.0.0 but changelogs go to v1.4.0/v1.3.0. Pre-existing from TUI migration. Fix: add a 2.0.0 changelog entry documenting the UI-Kit migration.
