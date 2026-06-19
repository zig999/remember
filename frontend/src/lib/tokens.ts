/**
 * Remember design tokens — TypeScript index.
 *
 * Canonical source: docs/specs/front/design-system/tokens.md §2 (v1.0.2),
 * mirroring the YAML manifest in §13. Values are DARK defaults (the
 * [data-theme="light"] override resolves at runtime via the CSS cascade).
 *
 * This module is a pure, frozen-object index — no runtime logic. Components
 * consume tokens via Tailwind v4 utility classes (e.g. `bg-surface`,
 * `text-content`, `rounded-md`) declared from the same `@theme` block in
 * `frontend/src/styles/theme.css`. Use the `cssVar(...)` helper only for
 * dynamic inline values that have no Tailwind utility (e.g. a React Flow
 * node coordinate computed by d3-force).
 *
 * Naming rule (tokens.md §1.1): token suffix maps directly to the Tailwind
 * class — `--color-content` -> `text-content`; `--spacing-lg` -> `p-lg`; etc.
 *
 * Border namespaces (tokens.md §7.2, front.md §8.3): `borderColor` lives in
 * `--color-border-*` and `borderWidth` in `--border-*`. They are deliberately
 * kept apart in this file too so a TS consumer cannot collapse them.
 */

/* ---------- helper: build a `var(--token)` string ---------- */
export const cssVar = (name: string): string => `var(--${name})`;

/* ---------- color: surface / content ---------- */
export const color = Object.freeze({
  primary: "oklch(15% 0.012 250)",
  surface: "oklch(20% 0.014 250)",
  elevated: "oklch(24% 0.016 250)",
  content: "oklch(97% 0.008 250)",
  body: "oklch(85% 0.010 250)",
  muted: "oklch(65% 0.012 250)",
  action: "oklch(68% 0.16 240)",
  "action-hover": "oklch(72% 0.17 240)",
  "action-active": "oklch(63% 0.15 240)",
  data: "oklch(72% 0.14 200)",
  warning: "oklch(72% 0.15 75)",
  danger: "oklch(60% 0.20 25)",
} as const);
export type ColorToken = keyof typeof color;

/* ---------- color: confidence states (5 + 5 fg) ---------- */
export const state = Object.freeze({
  accepted: "oklch(70% 0.16 150)",
  uncertain: "oklch(75% 0.15 75)",
  "low-confidence": "oklch(55% 0.02 250)",
  disputed: "oklch(68% 0.17 45)",
  superseded: "oklch(45% 0.01 250)",
} as const);
export type StateToken = keyof typeof state;

export const stateFg = Object.freeze({
  accepted: "oklch(96% 0.05 150)",
  uncertain: "oklch(96% 0.05 75)",
  "low-confidence": "oklch(96% 0.005 250)",
  disputed: "oklch(96% 0.05 45)",
  superseded: "oklch(96% 0.005 250)",
} as const);

/* ---------- color: NodeType catalog (10) ---------- */
export const nodeType = Object.freeze({
  person: "oklch(75% 0.14 280)",
  organization: "oklch(68% 0.13 220)",
  project: "oklch(72% 0.15 175)",
  event: "oklch(73% 0.16 50)",
  role: "oklch(70% 0.14 320)",
  category: "oklch(70% 0.10 110)",
  concept: "oklch(75% 0.10 95)",
  location: "oklch(70% 0.12 145)",
  document: "oklch(70% 0.05 245)",
  task: "oklch(72% 0.16 25)",
} as const);
export type NodeTypeToken = keyof typeof nodeType;

/* ---------- color: LinkType catalog (13) ---------- */
export const linkType = Object.freeze({
  "participates-in": "oklch(70% 0.14 200)",
  "member-of": "oklch(68% 0.14 220)",
  "holds-role": "oklch(70% 0.14 280)",
  "responsible-for": "oklch(70% 0.16 25)",
  "reports-to": "oklch(70% 0.14 240)",
  "part-of": "oklch(65% 0.05 250)",
  "located-in": "oklch(68% 0.12 145)",
  organizes: "oklch(72% 0.13 175)",
  "belongs-to-category": "oklch(70% 0.10 110)",
  "related-to": "oklch(60% 0.02 250)",
  concerns: "oklch(72% 0.10 95)",
  "delivered-to": "oklch(72% 0.15 50)",
  sponsors: "oklch(72% 0.13 220)",
} as const);
export type LinkTypeToken = keyof typeof linkType;

/* ---------- border: COLOR namespace (--color-border-*) ---------- */
export const borderColor = Object.freeze({
  border: "oklch(35% 0.012 250)",
  glass: "oklch(95% 0.005 250 / 0.18)",
  focus: "oklch(68% 0.16 240)",
  error: "oklch(60% 0.20 25)",
  accepted: "oklch(70% 0.16 150)",
  uncertain: "oklch(75% 0.15 75)",
  disputed: "oklch(68% 0.17 45)",
  superseded: "oklch(45% 0.01 250)",
} as const);
export type BorderColorToken = keyof typeof borderColor;

/* ---------- border: WIDTH namespace (--border-*) — distinct from color! ---------- */
export const borderWidth = Object.freeze({
  thin: "1px",
  DEFAULT: "1px",
  "2": "2px",
  thick: "3px",
} as const);
export type BorderWidthToken = keyof typeof borderWidth;

/* ---------- spacing: 4-pt grid (6 tokens) ---------- */
export const spacing = Object.freeze({
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
} as const);
export type SpacingToken = keyof typeof spacing;

/* ---------- font ---------- */
export const font = Object.freeze({
  sans: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
} as const);

/* ---------- text: 1.25× Major Third scale (8 tokens / 6 sizes) ---------- */
export const text = Object.freeze({
  display: "30px",
  heading: "24px",
  subheading: "20px",
  "body-lg": "16px",
  "body-sm": "14px",
  label: "14px",
  caption: "12px",
  code: "14px",
} as const);
export type TextToken = keyof typeof text;

/* ---------- radius: iOS-flavored soft corners (5 steps) ---------- */
export const radius = Object.freeze({
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "20px",
  pill: "9999px",
} as const);
export type RadiusToken = keyof typeof radius;

/* ---------- shadow: layered elevation (4 steps) ---------- */
export const shadow = Object.freeze({
  sm: "0 1px 2px 0 rgba(0,0,0,0.18)",
  md: "0 4px 12px -2px rgba(0,0,0,0.25), 0 2px 4px -2px rgba(0,0,0,0.18)",
  lg: "0 12px 32px -6px rgba(0,0,0,0.35), 0 4px 8px -4px rgba(0,0,0,0.22)",
  glass: "0 8px 24px -6px rgba(0,0,0,0.40), inset 0 1px 0 0 rgba(255,255,255,0.06)",
} as const);
export type ShadowToken = keyof typeof shadow;

/* ---------- glass: surface (3 levels) ---------- */
export const surfaceGlass = Object.freeze({
  ambient: "oklch(22% 0.012 250 / 0.55)",
  panel: "oklch(22% 0.012 250 / 0.65)",
  modal: "oklch(22% 0.012 250 / 0.78)",
} as const);
export type GlassLevel = keyof typeof surfaceGlass;

/* ---------- glass: blur (3 sizes) ---------- */
export const blurGlass = Object.freeze({
  sm: "8px",
  md: "16px",
  lg: "24px",
} as const);
export type BlurGlassToken = keyof typeof blurGlass;

/* ---------- backdrop: ambient treatment (3 scalars) ---------- */
export const backdrop = Object.freeze({
  darken: "0.55",
  desaturate: "0.30",
  blur: "12px",
} as const);

/* ---------- graph: depth overlay ---------- */
export const graph = Object.freeze({
  "depth-overlay": "oklch(12% 0.012 250 / 0.92)",
} as const);

/* ---------- motion: duration ---------- */
export const duration = Object.freeze({
  instant: "100ms",
  fast: "200ms",
  moderate: "300ms",
  entrance: "500ms",
  pulse: "2400ms",
} as const);
export type DurationToken = keyof typeof duration;

/* ---------- motion: easing ---------- */
export const ease = Object.freeze({
  out: "cubic-bezier(0.25, 1, 0.5, 1)",
  in: "cubic-bezier(0.7, 0, 0.84, 0)",
  "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
  "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
} as const);
export type EaseToken = keyof typeof ease;

/* ---------- z-index scale ---------- */
export const z = Object.freeze({
  backdrop: -1,
  base: 0,
  panel: 10,
  drawer: 20,
  popover: 30,
  frame: 40,
  modal: 50,
  toast: 60,
} as const);
export type ZToken = keyof typeof z;

/* ---------- aggregate export ---------- */
/**
 * Aggregate frozen view of every token category. Prefer using the per-category
 * exports above when only one category is needed — the aggregate is convenient
 * for documentation, design-system tools, or static manifest diffing.
 */
export const tokens = Object.freeze({
  color,
  state,
  stateFg,
  nodeType,
  linkType,
  borderColor,
  borderWidth,
  spacing,
  font,
  text,
  radius,
  shadow,
  surfaceGlass,
  blurGlass,
  backdrop,
  graph,
  duration,
  ease,
  z,
} as const);
export type Tokens = typeof tokens;
