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
 * Dark theme renders the real cityscape backdrop
 * (`/backdrop/cityscape-dusk.png`, committed under `public/`) so the glass
 * blur/refraction is actually visible. A gradient tint slice is layered UNDER
 * the photo as the BR-15 fallback — shown if the asset is missing (e.g. a
 * hermetic CI). Light theme has no photo asset yet, so it uses the gradient
 * slice alone. The slice colour matches the dark/light primary surface so the
 * contrast smoke test in `A11y/ContrastSmoke` keeps its semantic value (the
 * glass tint must still read as a frosted layer over a darker/lighter base).
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
 *
 * Implementation note: theme-dependent backdrop colors and the radial
 * gradient are written to scoped CSS rules via an inline `<style>` tag (one
 * per theme/padding combination) instead of using inline `style={{}}` on
 * the wrapper div. This honors the no-inline-CSS rule from u-fe-standards
 * while preserving the BR-15 fallback (these values intentionally live
 * outside the token system because addon-vitest runs hermetically and the
 * CSS-variable layer may not be loaded at decorator-render time).
 */
export function withAmbientBackdrop(opts: BackdropOptions = {}): Decorator {
  const theme = opts.theme ?? "dark";
  const padding = opts.padding ?? "md";
  const paddingClass =
    padding === "sm" ? "p-md" : padding === "lg" ? "p-2xl" : "p-xl";

  // Scoped class — distinct per theme so the `<style>` rules below stay
  // hermetic and addon-a11y still sees a single, deterministic backdrop.
  const scopeClass = `sb-ambient-backdrop-${theme}`;

  // Solid tint slice — matches --color-primary in each theme so the glass
  // surface still composites visibly (BR-15 fallback). Two-stop gradient
  // adds enough variation that the blur effect of the glass surface is
  // visible (a perfectly flat colour leaves backdrop-filter imperceptible).
  const slice = theme === "light" ? "oklch(94% 0.006 250)" : "oklch(15% 0.012 250)";
  const gradient =
    theme === "light"
      ? "radial-gradient(circle at 30% 30%, oklch(96% 0.01 240), oklch(90% 0.012 260))"
      : "radial-gradient(circle at 30% 30%, oklch(22% 0.018 240), oklch(12% 0.012 260))";

  // Dark theme stacks the real photo ON TOP of the gradient (first layer wins);
  // if the photo 404s the gradient shows through (BR-15 fallback). Light theme
  // has no photo asset, so it uses the gradient slice alone.
  const darkPhoto = "url('/backdrop/cityscape-dusk.png')";
  const bgImage = theme === "light" ? gradient : `${darkPhoto}, ${gradient}`;

  const css = `.${scopeClass}{min-height:320px;background-color:${slice};background-image:${bgImage};background-size:cover;background-position:center;}`;

  const Decorated: Decorator = (Story): ReactElement => {
    return (
      <div
        data-theme={theme}
        data-backdrop="ambient"
        className={`relative isolate ${paddingClass} ${scopeClass}`}
      >
        <style>{css}</style>
        <Story />
      </div>
    );
  };

  return Decorated;
}
