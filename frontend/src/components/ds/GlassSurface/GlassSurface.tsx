/**
 * GlassSurface — frosted-glass container atom (COMP-02).
 *
 * Canonical spec: docs/specs/front/components/GlassSurface.component.spec.md@1.1.1
 *
 * The base material of every floating layer in the shell: header / footer
 * (level `ambient`), Graph panels / drawers / popovers (level `panel`), modals
 * and the command palette (level `modal`). Composes the four ingredients of a
 * glass surface from `tokens.md §9` — translucent background, top-edge
 * highlight (`--shadow-glass`), thin glass border, and `backdrop-filter:
 * blur(...)` — into one primitive so no consumer has to reinvent it (and trip
 * the Tailwind v4 dual-namespace border gotcha, `tokens.md §7.2`).
 *
 * Contract highlights enforced here:
 *  - §3   Props contract (level + accent + animate + radius + role + aria-* + ref).
 *  - §6.1 ambient — fixed composition, NO enter/exit motion.
 *  - §6.2 panel   — enters via `motion.transition.glass-panel`.
 *  - §6.3 modal   — enters via `motion.transition.glass-modal`.
 *  - §6.4 accent  — replaces ONLY the color half of the border pair; `focus`
 *                   additionally adds an inner `ring-2`.
 *  - §6.5 radius  — optional override, last-writer-wins via `cn()`.
 *  - §7   Motion  — variants imported from `@/lib/motion`; reduced-motion
 *                   ALWAYS wins over `animate=true`.
 *  - §8   Uncertain accent pulse is realized as a CSS `@keyframes`
 *         (`theme.css` `uncertain-border-pulse`), driven by the
 *         `data-glass-pulse="uncertain"` attribute — NOT a Framer Motion
 *         variant. The CSS `@media (prefers-reduced-motion: no-preference)`
 *         gate already silences the pulse for users who request reduce.
 *  - §11  `cn()` merges consumer className — overridable: positioning, size,
 *         z-index, padding. Forbidden (lint rule `no-glass-surface-opaque-override`):
 *         `bg-*` opaque tokens.
 *  - §12  React 19 ref-as-prop. No `forwardRef`.
 *  - §14  ARIA — `role` defaults to `group`; `aria-labelledby` / `aria-label`
 *         forwarded; the atom never sets `role="alert"`/`role="status"`.
 *
 * Out of scope (spec §1): positioning, z-index layer, focus trap, scrim,
 * content semantics, theming.
 */
import type { FC } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion as motionLib, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { transitionGlassPanel, transitionGlassModal } from "@/lib/motion";
import { glassSurface } from "./GlassSurface.variants";
import type { GlassSurfaceProps } from "./GlassSurface.types";

/**
 * Foundation atom: frosted-glass container. Non-interactive by default; the
 * consumer composes Radix primitives (`Dialog.Content`, `Popover.Content`,
 * etc.) ON TOP of `GlassSurface` for focus management and scrims.
 *
 * Root element is a `<motion.div>` so Framer Motion can drive the per-level
 * enter/exit variants without wrapping in `<AnimatePresence>` here — the
 * consumer wraps in `<AnimatePresence>` when an unmount exit is needed.
 */
export const GlassSurface: FC<GlassSurfaceProps> = ({
  level,
  accent = "none",
  fill = "none",
  animate = true,
  radius,
  role = "group",
  className,
  ref,
  children,
  ...rest
}) => {
  // useReducedMotion() returns true when the user prefers reduced motion.
  // null/undefined is treated as "motion allowed" (SSR default).
  const prefersReducedMotion = useReducedMotion() === true;
  const motionAllowed = animate && !prefersReducedMotion;

  // Spec §6.1, §7: ambient is ALWAYS static (no enter/exit). Panel/modal play
  // their named variant when motion is allowed; otherwise no variant attaches
  // and the surface renders statically at its final visible state.
  //
  // The motion variant factories return `undefined`-free Variants, but we
  // intentionally avoid attaching `initial/animate/exit/variants` for the
  // static case so jsdom-based tests can assert "no motion variant attached"
  // via the presence/absence of the `data-motion-variant` data attribute.
  const variants =
    !motionAllowed
      ? undefined
      : level === "panel"
        ? transitionGlassPanel(false)
        : level === "modal"
          ? transitionGlassModal(false)
          : undefined;

  // Spec §8: the uncertain accent border pulse is a CSS @keyframes animation
  // driven by `data-glass-pulse="uncertain"` in theme.css (not Framer Motion,
  // so the per-theme border color resolves through the [data-theme] cascade).
  // The CSS gate `@media (prefers-reduced-motion: no-preference)` silences
  // the animation when reduce is requested — we set the attribute
  // unconditionally; the gate handles the reduced-motion case.
  const glassPulseAttr = accent === "uncertain" ? "uncertain" : undefined;

  // Spec §15: surfaced for spec-driven tests — names the active motion
  // variant ("glass-panel"/"glass-modal"). Omitted when no variant runs.
  const dataMotionVariant =
    variants === undefined
      ? undefined
      : level === "panel"
        ? "glass-panel"
        : level === "modal"
          ? "glass-modal"
          : undefined;

  // Cast for spread: the public Props surface types `...rest` as
  // `ComponentPropsWithoutRef<'div'>` (spec §3) — required so consumers can
  // pass any standard div attribute (id, data-*, onClick, etc.). But
  // `motion.div` types its spread as `HTMLMotionProps<'div'>`, which narrows
  // a few overlapping attributes (e.g. `style: MotionStyle` excludes
  // `undefined`, `onAnimationStart`/`onDrag` are remapped). Both surfaces
  // degrade to the same DOM <div> at runtime — Framer Motion forwards
  // unknown props verbatim. The cast is local and audited.
  const restMotionSpread = rest as unknown as HTMLMotionProps<"div">;

  return (
    <motionLib.div
      ref={ref}
      role={role}
      // CVA composes base ("border border-border-glass") + per-level
      // background/blur/shadow/radius + per-accent border-color overrides +
      // per-fill background override (emitted after `level`, wins via merge).
      // `radius` (override prop) is applied AFTER the CVA output so
      // tailwind-merge picks it as the last writer for the radius group.
      // `className` (consumer override) wins last — see spec §11.
      className={cn(glassSurface({ level, accent, fill }), radius, className)}
      data-level={level}
      data-accent={accent}
      data-fill={fill}
      {...(glassPulseAttr !== undefined
        ? { "data-glass-pulse": glassPulseAttr }
        : {})}
      {...(dataMotionVariant !== undefined
        ? { "data-motion-variant": dataMotionVariant }
        : {})}
      {...(variants !== undefined
        ? {
            initial: "hidden",
            animate: "visible",
            exit: "exit",
            variants,
          }
        : {})}
      {...restMotionSpread}
    >
      {children}
    </motionLib.div>
  );
};
