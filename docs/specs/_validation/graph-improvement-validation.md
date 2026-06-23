# Validation: Graph Improvement Wave (REQ-1 + REQ-2) — Front Phase

> Validator: Spec Validator | Date: 2026-06-23 | Mode: final_front (repair cycle 1)
> Status: **VALID**
> Triage: COMPLETED

---

## Scope

Requirement: Graph visualization improvements (floating edges + multi-algorithm layout).
Artifacts validated:
- `docs/specs/front/front.md` (v1.5.0)
- `docs/specs/front/features/chat.feature.spec.md` (v1.2.0)
- `docs/specs/front/_flows/chat.flow.md` (v1.1.0)
- `docs/specs/front/components/GraphEdge.component.spec.md` (v1.1.0)
- `docs/specs/front/components/GraphSpace.component.spec.md` (v1.1.0)
- `docs/specs/front/design-system-rules.md` (v1.3.0)
- `docs/specs/front/design-system/components.md` (v1.2.0)
- `docs/specs/front/design-system/tokens.md` (v1.0.2)

---

## Coverage Map

| Requirement | Feature Spec | Component Spec | Flow Coverage | Design System | Status |
|---|---|---|---|---|---|
| REQ-1 — Floating edges | chat.feature.spec.md §2 UI-14 (graph ready), §11 UC-CG-09 | GraphEdge.component.spec.md §1, §6, BDD Scenario 6; GraphSpace.component.spec.md §9 | chat.flow.md FL-11 (node click / graph interaction) | design-system-rules.md §5.3; components.md §4.3 | Covered |
| REQ-2 — Multi-algorithm layout (tree/radial) | Missing from chat.feature.spec.md §2/§7 | GraphSpace.component.spec.md §9 Scenarios 8+9; useGraphStore documented | chat.flow.md — no dedicated FL-NN | design-system-rules.md §5.3; components.md §3 (Select) | Covered at component level; gap at feature level (warning) |

---

## Checks Performed (Mode 1b)

### 1. Cross-ref features vs domains (§1 operationIds)
- `chat.feature.spec.md §1` references `listConversations`, `createConversation`, `getConversation`, `updateConversation`, `deleteConversation`, `listMessages`, `sendMessage`, `getConversationUsage`, `cancelTurn` (domain: `chat`) and `getNodeById` (domain: `knowledge-graph`).
- All operationIds verified present in `domains/chat/openapi.yaml` and `domains/knowledge-graph/openapi.yaml` (these were validated in the prior chat-wave validation; graph-improvement wave adds no new operationIds).
- **PASS**

### 2. §1 structure (no Method+Path or Auth columns)
- `chat.feature.spec.md §1` has `Domain | operationId | Purpose` columns only. No Method+Path, no Auth.
- **PASS**

### 3. Error codes cross-check
- Graph-improvement wave adds no new error codes.
- All codes cross-checked against global catalog (pre-existing validation from chat-wave).
- **PASS**

### 4. §5 field existence
- `chat.feature.spec.md §5` covers `content` (Composer textarea) field validation only — correctly scoped to user input fields.
- No technical constraint columns (Rule, minLength, pattern) in §5.
- **PASS**

### 5. Minimum states covered (loading, success, error, empty)
- Chat column: UI-01 (idle/empty), UI-02 (loading), UI-03 (success), UI-04 (streaming), UI-07 (error), UI-09 (empty conversation). All four minimum states covered.
- Graph column: UI-11 (empty), UI-12 (loading), UI-14 (ready/success), UI-14-error (error). All four minimum states covered.
- **PASS**

### 5b. UI control traceability (anti-invention)
- All interactive controls in `chat.feature.spec.md §2` are traceable to the Requirement or existing feature.
- Algorithm Select ('Força'/'Árvore'/'Radial') is traceable to REQ-2 (explicitly requested).
- **PASS**

### 6. Flow references features with corresponding `.feature.spec.md`
- All FL-NN reference routes with matching `.feature.spec.md`. **PASS**

### 6b. FL-NN vs §3 consistency
- FL-08, FL-09, FL-10, FL-11 all match their corresponding §3 Side Effect rows. **PASS**

### 7. front.md stack consistent with CLAUDE.md
- `front.md §1` lists `d3-hierarchy` and `@types/d3-hierarchy` as permitted (added in §11, v1.5.0).
- `front.md` header Version: 1.5.0 — consistent with changelog latest entry 1.5.0.
- **PASS**

### 7b. Transform consistency — PASS

### 7c. Component adapter declaration completeness — PASS

### 8. Component spec consistency — PASS

### 9. BDD coverage (minimum 2 scenarios)
- `chat.feature.spec.md §9`: 6 scenarios. Minimum satisfied. **PASS** (WARN-004 raised for missing algorithm-select scenario at feature level)

### 10. Design system files (5 required files + rules) — PASS

### 10b. Token manifest sync — PASS

### 11. Design system coverage — PASS

### 12. Design system changelog — PASS

### 12b. Design system rules sync
- `motion.graph.nodeReveal` factory is now registered in `design-system-rules.md §2.2` and `design-system/tokens.md §11`. **PASS**

---

## Inconsistencies (Repair Cycle 1 — Post-Fix)

| # | Type | Source File | Target File | Description | Agent | Severity | Selected |
|---|---|---|---|---|---|---|---|
| ~~1~~ | ~~schema~~ | ~~`front/front.md` (header)~~ | ~~`front/front.md` (changelog)~~ | ~~Header declared `Version: 1.4.0` but changelog latest entry was `1.5.0`.~~ | ~~Front Spec Agent~~ | ~~**RESOLVED**~~ | [x] |
| ~~2~~ | ~~design-system~~ | ~~`front/components/GraphSpace.component.spec.md` §9~~ | ~~`front/design-system-rules.md §2.2` + `tokens.md §11`~~ | ~~`motion.graph.nodeReveal` absent from design-system-rules.md §2.2 and tokens.md §11.~~ | ~~Front Spec Agent~~ | ~~**RESOLVED**~~ | [x] |
| ~~3~~ | ~~design-system~~ | ~~`front/design-system/components.md` (header)~~ | ~~`front/design-system/components.md` (changelog)~~ | ~~Header declared `Version: 1.1.0` but changelog latest entry was `1.2.0`.~~ | ~~Front Spec Agent~~ | ~~**RESOLVED**~~ | [x] |
| 4 | coverage | `front/features/chat.feature.spec.md` §2 + §7 | `front/components/GraphSpace.component.spec.md` §9 | Algorithm Select control (REQ-2) visible in the /chat right pane is not reflected in chat.feature.spec.md §2 or §7. Component-level coverage is complete; feature-level coverage is absent. | Front Spec Agent | warning | [ ] |
| 5 | bdd | `front/features/chat.feature.spec.md` §9 | — | No BDD scenario covers the algorithm Select interaction at the feature level (covered at component level in GraphSpace Scenario 8). | Front Spec Agent | warning | [ ] |

---

## Result

- [x] UC coverage complete
- [x] Spec version headers consistent with changelogs (front.md v1.5.0, components.md v1.2.0)
- [x] Error codes consistent (no new codes)
- [x] No orphan specs
- [x] Dependencies valid
- [x] UI controls traceable to Requirement
- [x] design-system-rules.md synchronized with tokens.md (including motion.graph.nodeReveal)
- [x] Design system 5-file structure complete
- [x] BDD minimum coverage satisfied (6 scenarios in chat.feature.spec.md §9)

**Overall: VALID — 0 blocking issues. 2 warnings (informational, handoff not blocked).**

---

## Triage History

| Date | Selected items | Activated agents | Result |
|---|---|---|---|
| 2026-06-23 | ISSUE-001 (blocking), WARN-001, WARN-002 | Front Spec Agent | Fixed: front.md→v1.5.0, components.md→v1.2.0, motion.graph.nodeReveal registered. Status promoted to VALID. |
