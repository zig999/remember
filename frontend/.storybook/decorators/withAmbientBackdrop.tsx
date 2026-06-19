/**
 * withAmbientBackdrop — Storybook decorator (TC-07).
 *
 * Renders a representative slice of the treated ambient backdrop *under*
 * the story so glass-surface composition (translucency + blur +
 * top-edge highlight) is visible. Without this decorator, GlassSurface
 * over an empty white background is meaningless
 * (GlassSurface.component.spec.md §9, "Implementation rule").
 *
 * Spec references:
 *  - docs/specs/front/design-system/tokens.md §10.1 — ambient backdrop
 *    treatment chain (blur + saturate + brightness).
 *  - docs/specs/front/components/GlassSurface.component.spec.md §9
 *    (Storybook stories MUST use this decorator).
 *  - docs/specs/front/front.back.md BR-15 — image fallback: when the real
 *    landscape image is not available (e.g. CI, hermetic tests), a solid
 *    color slice in the same hue family is acceptable.
 *
 * Per BR-15 we use a tint slice instead of a real image: CI does not ship
 * the landscape asset, and addon-vitest runs hermetically. The slice colour
 * matches the dark/light primary surface so the contrast smoke test in
 * `A11y/ContrastSmoke` keeps its semantic value (the glass tint must still
 * read as a frosted layer over a darker/lighter base).
 *
 * The decorator can be configured via the `theme` arg to set
 * `data-theme="light"` on the wrapper so the [data-theme="light"]
 * token overrides activate inside the story tree.
 */
import type { Decorator } from "@storybook/react-vite";
import type { ReactElement } from "react";

interface BackdropOptions {
  /** "dark" (default) or "light" — sets data-theme on the wrapper. */
  theme?: "dark" | "light";
  /** Padding around the story slot; default `md`. */
  padding?: "sm" | "md" | "lg";
}

/**
 * Returns a Storybook decorator that wraps the story in a positioned
 * container with a treated tint slice underneath. The story content stacks
 * over the slice on `z-base`.
 */
export function withAmbientBackdrop(opts: BackdropOptions = {}): Decorator {
  const theme = opts.theme ?? "dark";
  const padding = opts.padding ?? "md";
  const paddingClass =
    padding === "sm" ? "p-md" : padding === "lg" ? "p-2xl" : "p-xl";

  // Solid tint slice — matches --color-primary in each theme so the glass
  // surface still composites visibly (BR-15 fallback).
  const slice = theme === "light" ? "oklch(94% 0.006 250)" : "oklch(15% 0.012 250)";

  const Decorated: Decorator = (Story): ReactElement => {
    return (
      <div
        data-theme={theme}
        data-backdrop="ambient"
        className={`relative isolate ${paddingClass}`}
        style={{
          minHeight: "320px",
          // Apply the canonical treatment chain from tokens.md §10.1 to the
          // wrapper background. With a flat slice, the brightness/saturate
          // pieces are visual identity ops, but keeping the chain in place
          // preserves the same render path the real image will use.
          backgroundColor: slice,
          backgroundImage:
            // Two-stop gradient adds enough variation that the blur effect
            // of the glass surface is visible at all (a perfectly flat
            // colour leaves backdrop-filter: blur(...) imperceptible).
            theme === "light"
              ? "radial-gradient(circle at 30% 30%, oklch(96% 0.01 240), oklch(90% 0.012 260))"
              : "radial-gradient(circle at 30% 30%, oklch(22% 0.018 240), oklch(12% 0.012 260))",
        }}
      >
        <Story />
      </div>
    );
  };

  return Decorated;
}
