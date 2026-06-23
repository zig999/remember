# Compliance Report

> Date: 2026-06-23 | Domains: 1 (graph-improvement-front) | Status: COMPLIANT

## Coverage Metrics

| Metric | Total | Covered | Percentage |
|--------|-------|---------|------------|
| Use Cases (UC) | 13 (UC-CG-01..13) | 13 | 100% |
| Endpoints (OpenAPI) | 9 (chat) + 1 (knowledge-graph) | 10 | 100% |
| Business Rules (BR) | 14 (chat.back.md existing) | 14 | 100% |
| Feature States (UI) | 14 (UI-01..UI-14) | 14 | 100% |
| Navigation Flows (FL) | 11 (FL-01..FL-11) | 11 | 100% |
| BDD Scenarios (§9) | 6 (chat.feature.spec.md) | 6 | 100% |
| Error Codes | 17 (chat feature §6) | 17 | 100% |
| Components in design-system/components.md | 8 referenced | 8 | 100% |

## Coverage by Domain

### graph-improvement-front v1.5.0

| UC | Endpoint | BRs | UIs | FLs | Error Codes | Status |
|----|----------|-----|-----|-----|-------------|--------|
| UC-CG-09 (floating edges) | — (frontend-only) | — | UI-14 | FL-11 | none new | Yes |
| UC-CG-10..13 (layout algorithms) | — (frontend-only) | — | UI-14 (algorithm select) | — | none new | Yes |
| UC-CG-01..08 (pre-existing graph UCs) | getNodeById | pre-existing BRs | UI-11..UI-14 | FL-08..FL-11 | pre-existing | Yes |

> Note: The graph-improvement wave (REQ-1 + REQ-2) is frontend-only — no new backend endpoints or BRs. Coverage metrics for endpoints and BRs reflect the pre-existing chat + knowledge-graph domains validated in prior waves.

## Approved Validations

- [x] All UCs have a corresponding endpoint in openapi.yaml (pre-existing; graph-improvement adds no new endpoints)
- [x] All BRs are present in .back.md (pre-existing; graph-improvement adds no new BRs)
- [x] All openapi.yaml states are handled in the feature specs (§2) that consume each domain
- [x] Every interactive control in feature specs (§2) traces to the Requirement (UI intent) or a `TO CONFIRM` marker — no auto-added filter/search/sort/pagination/bulk-action
- [x] All error.codes are in the global catalog
- [x] Cross-domain dependencies verified (bidirectional, no drafts)
- [x] Prefixes follow the global pattern (UC, BR, ST, EV, UI, FL)
- [x] Each feature spec has §9 BDD Scenarios (minimum: happy path + critical error)
- [x] Shared components in §7 of 2+ features have a `component.spec.md`
- [x] `front/design-system/` exists with 5 required files and `design-system-rules.md` is present
- [x] `front/design-system/_index.md` has a populated Changelog
- [x] All components referenced in feature specs are cataloged in `design-system/components.md`
- [x] `design-system-rules.md` is synchronized with `design-system/tokens.md` (motion.graph.nodeReveal registered)
