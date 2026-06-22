/**
 * GlassSurface — public type contract (COMP-02).
 *
 * Canonical source: docs/specs/front/components/GlassSurface.component.spec.md §3.
 *
 * NOTE (TC-04 forward stub): only `level: 'ambient'` is implemented in this
 * wave to unblock TC-04's Header/Footer placeholders (per TC-04 task contract
 * constraint "must use GlassSurface level='ambient'"). The full atom (panels,
 * modals, accents, motion variants, CSS uncertain pulse) ships in TC-06.
 *
 * The TYPE surface is the full canonical contract so TC-06 can land without
 * any consumer-facing rename — only the implementation grows.
 */
import type { ComponentPropsWithoutRef, Ref } from "react";

export type GlassLevel = "ambient" | "panel" | "modal";

export type GlassAccent =
  | "none"
  | "accepted"
  | "uncertain"
  | "disputed"
  | "superseded"
  | "focus"
  | "error";

export type GlassRadius =
  | "rounded-sm"
  | "rounded-md"
  | "rounded-lg"
  | "rounded-xl";

/**
 * Background-fill override (spec §6.6). Independent of `level`: `none` keeps
 * the level's own `bg-surface-glass-<level>` tint; the other values swap ONLY
 * the background token (blur / shadow / radius / motion stay with `level`).
 *  - `ambient`        — the plain ambient glass fill on any level.
 *  - `ambient-accent` — ambient glass with a touch of accent mixed in.
 */
export type GlassFill = "none" | "ambient" | "ambient-accent";

export type GlassRole =
  | "group"
  | "region"
  | "dialog"
  | "complementary"
  | "navigation"
  | "contentinfo"
  | "banner";

export type GlassSurfaceProps = ComponentPropsWithoutRef<"div"> & {
  level: GlassLevel;
  accent?: GlassAccent;
  /** Background-fill override, independent of `level` (spec §6.6). */
  fill?: GlassFill;
  animate?: boolean;
  radius?: GlassRadius;
  role?: GlassRole;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};
