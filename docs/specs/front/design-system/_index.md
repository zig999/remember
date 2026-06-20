# Design System — Remember

> Path: `docs/specs/front/design-system/`
> Implementation: `frontend/src/styles/theme.css` (Tailwind v4 `@theme` block, single source of CSS tokens)
> Version: 1.1.0 | Layer: permanent

---

## 1. System principles

| Principle | Description |
|---|---|
| Confidence is legible at a glance | Every fact's state — `accepted` / `uncertain` / `low-confidence` / `disputed` / `superseded` — is encoded in a dedicated semantic token (color + icon). Color carries information, never decoration. |
| Type carries meaning | The 10 NodeTypes and 13 LinkTypes each have a dedicated color + icon (nodes) or stroke style (links). The eye reads the type first. |
| Glass over a treated backdrop | Frosted-glass surfaces float over a single ambient landscape backdrop. The backdrop is always treated (darkened + desaturated + blurred) so glass + text clear WCAG 2.2 AA contrast in both themes. |
| iOS aesthetic, with substance | Soft corners, subtle layered shadows, a clean typographic scale — expressed only through semantic tokens. No raw values. |
| Motion explains state change | Animation is semantic (explains state) and decorative (reinforces the technological aesthetic). All motion variants are canonical factories in `lib/motion.ts` — no component inlines its own. |
| Dark by default, light available | Dark is the natural mode for a dense visual exploration tool. Both themes ship a treated backdrop and a full token set. |

---

## 2. Visual context

- **Color mode:** both (dark is the default — `front.md §8`).
- **Aesthetic constraints:**
  - iOS-flavored visual language — soft corners, subtle layered shadows, clean typography (`frontend-analise-funcional.md §9`).
  - **WCAG 2.2 AA** contrast over glass and over the treated backdrop in both themes.
  - Single-owner pt-BR — strings live in the source (`CLAUDE.md` `i18n: false`).
  - Lexical-only retrieval surfaces no "semantic" promises — UI never implies meaning search.

```yaml
visual_personality:
  direction: minimal
  intensity: 4
```

Rationale: Remember is a personal workstation — data-dense exploration with the Graph as the centerpiece. `minimal` direction at intensity `4` maximizes clarity and information density while permitting the deliberate visual accents (state colors, glass, motion) that are load-bearing.

---

## 3. File summary

| File | Content | When to load |
|---|---|---|
| [`tokens.md`](./tokens.md) | Colors (incl. confidence states, NodeType colors, LinkType colors + temporal/stable stroke), spacing, typography, radius, shadow, glass-surface (3 levels), ambient-backdrop treatment, graph-depth overlay, 7 motion variants (4 state-change + 2 glass surface enter/exit + 1 CRT power-on), z-index scale | Whenever implementing visual styles |
| [`composition.md`](./composition.md) | Glass effects, hierarchy, ChatWorkspace layout, density, motion composition | Building layouts or understanding component z-layer relationships |
| [`components.md`](./components.md) | Component catalog — DS atoms (GlassSurface, StateBadge, GraphNode, ChatBubble, ConversationMenu), shadcn/ui primitives, feature-local reference tables (chat, auth) | Implementing or invoking any shared component |
| [`implementation.md`](./implementation.md) | Accessibility QA checklist (global + chat + sign-in), motion factory table + `transitionCrtPowerOn` spec, known gotchas, QA viewports | QA review, implementing animations or a11y requirements |
| [`../components/StateBadge.component.spec.md`](../components/StateBadge.component.spec.md) | Confidence-state badge atom | Implementing or invoking the state badge |
| [`../components/GlassSurface.component.spec.md`](../components/GlassSurface.component.spec.md) | Frosted-glass container atom | Building any floating layer or theme-aware glass region |

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-18 | Spec Writer | initial | Foundation wave: tokens + StateBadge + GlassSurface | -- |
| 1.0.1 | 2026-06-19 | Front Spec Agent | patch | Cross-domain review: updated tokens.md file summary to reflect 6 motion variants (2 GlassSurface enter/exit variants added). | sdd_front |
| 1.1.0 | 2026-06-20 | Front Spec Agent | minor | Auth/sign-in wave: file summary updated (7 motion variants — `transitionCrtPowerOn` added; composition.md + components.md + implementation.md added to table). `components.md` now catalogs auth feature-local components (SignInPanel, SignInForm) + shadcn/ui Label. `implementation.md` adds §1.3 sign-in a11y checklist + `transitionCrtPowerOn` spec (§2.2) + Stack Auth gotchas (§3.7, §3.8). | sdd_front |
