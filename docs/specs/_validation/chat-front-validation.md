# Validation Report — Chat (front phase, async-ingestion wave v1.2.0)

> Triage: COMPLETED
> Domain: chat (front phase — async-ingestion wave v1.2.0)
> Version: chat.feature.spec.md v1.2.0 | chat.flow.md v1.1.0 | front.md v1.4.0 | openapi.yaml v2.3.0 | chat.spec.md v2.3.0 | chat.back.md v2.4.0
> Date: 2026-06-22
> Mode: Final Validation (front phase) — Mode 1b
> Scope: chat.feature.spec.md v1.2.0 (additive update for async ingestion capability)
> Reference: domains/chat/openapi.yaml v2.3.0, domains/knowledge-graph/openapi.yaml, _global/error-codes.md

---

## Result: VALID

No blocking inconsistencies. Five warnings noted (four pre-existing, one new).

---

## Coverage Map

### Domain: chat (v2.3.0)

| UC | Endpoint / Mechanism | BRs | UIs | FLs | Error Codes | Status |
|----|----------------------|-----|-----|-----|-------------|--------|
| UC-01 | POST /api/v1/conversations | BR-30 | UI-01, UI-09 | FL-03 | AUTH_*, VALIDATION_* | Yes |
| UC-02 | POST /api/v1/conversations/:id/messages | BR-01..BR-13, BR-16..BR-19 | UI-03..UI-06 | Sub-flow C | BUSINESS_CHAT_*, VALIDATION_*, AUTH_*, SYSTEM_* | Yes |
| UC-03 | sendMessage (max_iterations) | BR-15 | UI-04, UI-05 | Sub-flow C | — | Yes |
| UC-04 | GET/PATCH/DELETE /api/v1/conversations[/:id] | BR-35, BR-36, BR-37 | UI-01..UI-03, UI-08 | FL-02..FL-05 | RESOURCE_NOT_FOUND, VALIDATION_* | Yes |
| UC-05 | sendMessage (turn_timeout) | BR-16 | UI-04 | Sub-flow C | — | Yes |
| UC-06 | POST /api/v1/conversations/:id/cancel | BR-12, BR-38 | UI-04 | A4, Sub-flow C | RESOURCE_NOT_FOUND, BUSINESS_CONVERSATION_ARCHIVED | Yes |
| UC-07 | sendMessage (idempotent replay) | BR-27 | UI-04, UI-05 | Sub-flow C | BUSINESS_IDEMPOTENCY_MISMATCH, BUSINESS_TURN_IN_PROGRESS | Yes |
| UC-08 | GET /api/v1/conversations/:id/messages + /usage | BR-39, BR-40 | UI-02..UI-03, UI-09 | FL-02 | RESOURCE_NOT_FOUND, VALIDATION_* | Yes |
| UC-09 | Kill-switch (CHAT_ENABLED=false) | BR-14 | UI-10 | — | BUSINESS_CHAT_DISABLED | Yes |
| UC-10 | sendMessage (start_async_ingestion dispatch) | BR-43, BR-44, BR-05 v2.3 | UI-04 (ToolCallChip) | Sub-flow C | STRUCTURAL_INVALID, SYSTEM_SERVICE_UNAVAILABLE | Yes |
| UC-11 | sendMessage (get_ingestion_status dispatch) | BR-45 | UI-04 (ToolCallChip) | Sub-flow C | RESOURCE_NOT_FOUND | Yes |

---

## Validation Checks (Mode 1b)

### Check 1 — Cross-ref features vs domains (operationIds)

All operationIds in chat.feature.spec.md §1 are present in domains/chat/openapi.yaml:
- `listConversations` ✓
- `createConversation` ✓
- `getConversation` ✓
- `updateConversation` ✓
- `deleteConversation` ✓
- `listMessages` ✓
- `sendMessage` ✓
- `getConversationUsage` ✓
- `cancelTurn` ✓
- `getNodeById` (knowledge-graph) ✓ (verified in knowledge-graph/openapi.yaml)

**Note (v2.3):** `start_async_ingestion` and `get_ingestion_status` are correctly NOT listed in §1 — they are server-side tool dispatches within the SSE loop, not REST operationIds. §1 note documents this explicitly.

**Result: PASS**

### Check 2 — §1 structure (no Method+Path or Auth columns)

§1 has no `Method+Path` or `Auth` columns. **Result: PASS**

### Check 3 — Error codes in §6 vs global catalog and openapi.yaml

| error.code | In catalog | In openapi.yaml | Status |
|---|---|---|---|
| RESOURCE_NOT_FOUND | ✓ | ✓ | PASS |
| BUSINESS_CONVERSATION_ARCHIVED | ✓ | ✓ | PASS |
| BUSINESS_TURN_IN_PROGRESS | ✓ | ✓ | PASS |
| BUSINESS_IDEMPOTENCY_MISMATCH | ✓ | ✓ | PASS |
| BUSINESS_CHAT_DISABLED | ✓ | ✓ | PASS |
| BUSINESS_CHAT_PROVIDER_UNAVAILABLE | ✓ | ✓ | PASS |
| VALIDATION_REQUIRED_FIELD | ✓ | ✓ | PASS |
| VALIDATION_INVALID_FORMAT | ✓ | ✓ | PASS |
| AUTH_UNAUTHORIZED / AUTH_TOKEN_EXPIRED / AUTH_TOKEN_INVALID | ✓ | ✓ | PASS |
| SYSTEM_INTERNAL_ERROR | ✓ | ✓ | PASS |
| STRUCTURAL_INVALID | ✓ (MCP/Ingestion) | ✓ (via ingestion openapi) | PASS |
| SYSTEM_SERVICE_UNAVAILABLE | ✓ | ✓ | PASS |
| SYSTEM_NETWORK | ✗ | — | WARN-001 (pre-existing, client-generated) |
| SYSTEM_INVALID_RESPONSE | ✗ | — | WARN-002 (pre-existing, client-generated) |
| SYSTEM_UPSTREAM | ✗ | — | WARN-003 (pre-existing, client-generated) |

**Result: PASS (3 pre-existing warnings carried forward)**

### Check 4 — §5 field existence in openapi.yaml requestBody

`sendMessage` requestBody (`SendMessageRequest`) has `content` (required) and `model` (optional). Both match §5. §5 has no technical constraint columns. **Result: PASS**

### Check 5 — Minimum states (loading, success, error, empty)

- Loading: UI-02 ✓
- Success: UI-03 ✓
- Error: UI-07 ✓
- Empty: UI-09 ✓

**Result: PASS**

### Check 5b — UI control traceability (anti-invention)

No new interactive controls (filter, search input, sort, pagination, bulk action) were introduced in v1.2.0. The two new server-side tools (`start_async_ingestion`, `get_ingestion_status`) surface only as `ToolCallChip` elements via the existing generic chip rendering path — they are not interactive controls that could be auto-added from endpoint shape. Traceable origin: Requirement ("Expose ONE async one-shot ingestion capability in the agentic chat backend module") + chat.spec.md v2.3 / BR-43 / BR-44 / BR-45.

**Result: PASS**

### Check 6 — Flows reference features with corresponding specs

`chat.flow.md` references `features/chat.feature.spec.md` — file exists ✓. No orphan FL-NN references.

**Result: PASS**

### Check 6b — FL-NN vs §3 consistency

FL-01..FL-11 all correspond to states / side effects documented in chat.feature.spec.md §2/§3. No mismatches. The new Sub-flow C step noting ingestion tools is covered by the existing FL-08 / Sub-flow C structure.

**Result: PASS (no new FL entries required for v1.2.0 — ingestion dispatches are within the existing streaming sub-flow)**

### Check 7 — front.md stack consistency with CLAUDE.md

front.md v1.4.0 stack matches CLAUDE.md: React 19, Vite 6, Tailwind v4, TanStack Router/Query/Table, Zustand v5, React Hook Form v7 + Zod v4, Framer Motion, sonner, shadcn/ui, lucide-react, React Flow + d3-force, Vitest, Playwright, MSW, Storybook 9.

**Result: PASS**

### Check 7b — Transform consistency

All 4 transforms in §4 (`listConversations`, `getConversation`, `listMessages`, `getConversationUsage`) have corresponding operationIds in §1. No orphan transforms.

**Result: PASS**

### Check 7c — Component adapter declaration completeness

§7 shared components:
- `GlassSurface`: used directly ✓
- `ChatBubble`: adapter block present ✓
- `ConversationMenu`: adapter block present ✓
- `Button`, `Textarea`, `Input`, `Switch`: "Direct" / "Direct prop mapping — no adapter needed" ✓

All components have either an adapter block or a `direct-map` declaration.

**Result: PASS**

### Check 8 — Component spec completeness (2+ features or complex logic)

- `ChatBubble` → `ChatBubble.component.spec.md` ✓
- `ConversationMenu` → `ConversationMenu.component.spec.md` ✓
- `GlassSurface` → `GlassSurface.component.spec.md` ✓
- `GraphSpace` → `GraphSpace.component.spec.md` ✓
- `GraphEdge` (via `GraphEdgeAdapter`) → `GraphEdge.component.spec.md` ✓
- `NodeDetailPanel` → `NodeDetailPanel.component.spec.md` ✓

**Result: PASS**

### Check 9 — BDD coverage (≥2 scenarios per feature spec)

chat.feature.spec.md §9 has 6 BDD scenarios:
1. Happy path streaming
2. Select conversation from menu
3. Archive active conversation
4. Provider unavailable disables Composer
5. Stop during streaming
6. Async ingestion via chat (CHAT_INGEST_ENABLED=true) — **NEW in v1.2.0**

**Result: PASS** (exceeds minimum of 2; Scenario 6 covers the new async-ingestion happy path)

### Check 10 — Design system files

All 5 required files exist:
- `front/design-system/_index.md` ✓
- `front/design-system/tokens.md` ✓
- `front/design-system/composition.md` ✓
- `front/design-system/components.md` ✓
- `front/design-system/implementation.md` ✓
- `front/design-system-rules.md` ✓

`tokens.md` has CSS block with real OKLCH values (non-placeholder) ✓
`tokens.md` has YAML `token-manifest` block (§13) ✓

**Result: PASS**

### Check 10b — Token manifest sync

CSS `@theme` block and YAML manifest §13 declare identical token sets. The `surface-glass-*` naming discrepancy (see WARN-005) is the only divergence — both blocks use the same `--surface-glass-*` convention so they are in sync with each other; the divergence is with the implemented code (which uses `--color-surface-glass-*`). Internal spec consistency: PASS. Code/spec divergence: WARN-005.

**Result: PASS (WARN-005 raised)**

### Check 11 — Design system coverage

Components from chat.feature.spec.md §7 in `components.md`:
- `GlassSurface` ✓ (§2.1)
- `ChatBubble` ✓ (§2.4)
- `ConversationMenu` ✓ (§2.5)
- `Button`, `Textarea`, `Input`, `Switch` — shadcn/ui primitives (§3 in components.md) ✓

Graph components (GraphSpace, GraphCanvas, GraphNodeAdapter, etc.) not listed in `components.md §4` — pre-existing WARN-004.

**Result: PASS (pre-existing WARN-004 carried forward)**

### Check 12 — Design system changelog

`_index.md` has Changelog with versions 1.0.0, 1.0.1, 1.1.0, 1.2.0 (populated).

**Result: PASS**

### Check 12b — Design system rules sync

`design-system-rules.md` v1.2.0 references token classes that match `tokens.md` v1.0.0 with one divergence: §1.3 states `bg-surface-glass-*` generates from `--color-surface-glass-*` tokens, but `tokens.md §2` and the YAML manifest use `--surface-glass-*` (no `--color-` prefix). The production code (per CLAUDE.md memory) uses `--color-surface-glass-*` which means `design-system-rules.md §1.3` is correct but `tokens.md §2` is stale relative to the implementation.

**Result: WARNING (WARN-005 — spec/implementation divergence on surface-glass token namespace)**

---

## Inconsistency Table

| # | ID | Severity | Type | Source | Description | Agent | Fix | Selected |
|---|---|---|---|---|---|---|---|---|
| 1 | WARN-001 | warning | cross-ref | chat.feature.spec.md §6 | `SYSTEM_NETWORK` not in global error-codes.md (client-generated synthetic code) | u-spec-front | Register in error-codes.md as a client-only code, or add a note excluding client-generated codes from catalog requirement | [ ] |
| 2 | WARN-002 | warning | cross-ref | chat.feature.spec.md §6 | `SYSTEM_INVALID_RESPONSE` not in global error-codes.md (client-generated) | u-spec-front | Same as WARN-001 | [ ] |
| 3 | WARN-003 | warning | cross-ref | chat.feature.spec.md §6 | `SYSTEM_UPSTREAM` not in global error-codes.md (client-generated) | u-spec-front | Same as WARN-001 | [ ] |
| 4 | WARN-004 | warning | component-gap | design-system/components.md | Graph feature components not listed in §4 (orientation-only, pre-existing) | u-spec-front | Add graph feature-local components to components.md §4 for orientation | [ ] |
| 5 | WARN-005 | warning | design-system | design-system-rules.md §1.3 + tokens.md §2 | `design-system-rules.md §1.3` references `--color-surface-glass-*` but `tokens.md §2` declares `--surface-glass-*`. Implementation uses `--color-surface-glass-*` (code fix confirmed in CLAUDE.md). Spec not reconciled. | u-spec-front | Update tokens.md §2 CSS block and §13 YAML manifest to rename `--surface-glass-*` → `--color-surface-glass-*` to match implementation and align with Tailwind v4 `--color-*` namespace convention | [ ] |

---

## Approved Validations

- [x] All UCs (UC-01..UC-11) have corresponding endpoints or SSE dispatch mechanisms in openapi.yaml
- [x] All REST operationIds in §1 exist in domains/chat/openapi.yaml (and knowledge-graph for getNodeById)
- [x] `start_async_ingestion` and `get_ingestion_status` correctly omitted from §1 (SSE-only tool dispatches, not REST operationIds)
- [x] All error codes in §6 are in the global catalog or are pre-existing client-generated synthetic codes (WARN-001..003)
- [x] Cross-domain dependencies: chat → knowledge-graph (getNodeById) → verified; chat → ingestion (service-level, not REST) → documented in chat.spec.md §7
- [x] §5 fields exist in openapi.yaml requestBody schemas
- [x] Minimum states (loading, success, error, empty) covered: UI-02, UI-03, UI-07, UI-09
- [x] No auto-added interactive controls — new ingestion tools surface only as ToolCallChips via existing generic path (traceable to Requirement)
- [x] All flows reference features with corresponding `.feature.spec.md` files
- [x] front.md stack consistent with CLAUDE.md
- [x] Component adapters complete (adapter block OR direct-map for all §7 components)
- [x] All qualifying components (ChatBubble, ConversationMenu, GlassSurface, GraphSpace, GraphEdge, NodeDetailPanel) have component.spec.md files
- [x] BDD Scenarios ≥ 2 (6 scenarios, including new Scenario 6 for async ingestion happy path)
- [x] Design system: 5 required files + design-system-rules.md exist
- [x] tokens.md has CSS block with real values and YAML token-manifest block
- [x] design-system/_index.md has populated Changelog
- [x] New v1.2.0 additions (STRUCTURAL_INVALID + SYSTEM_SERVICE_UNAVAILABLE in §6, Scenario 6 in §9, ToolCallChip note in UI-04) are internally consistent with chat.spec.md v2.3 / chat.back.md v2.4 / openapi.yaml v2.3

---

## Triage History

| Date | Action | Notes |
|---|---|---|
| 2026-06-22 | VALID — final_front validation for async-ingestion wave (v1.2.0) | No blocking issues. 5 warnings (4 pre-existing carried from prior run, 1 new WARN-005 on surface-glass token namespace divergence). handoff_allowed: true. |
