/**
 * withAmbientBackdrop — Storybook decorator (TC-07).
 *
 * Renders the SAME ambient backdrop the application uses, so glass-surface
 * composition (translucency + blur + top-edge highlight) is visible exactly as
 * in-app. Without a real backdrop under it, a GlassSurface over an empty white
 * background is meaningless (GlassSurface.component.spec.md §9).
 *
 * Fidelity — reuses the real `<AmbientBackdrop/>` shell component instead of a
 * hand-rolled slice. That component is the app's single source of truth for the
 * backdrop treatment: the committed cityscape photo
 * (`public/backdrop/cityscape-dusk.png`, served in Storybook via
 * `staticDirs: ["../public"]`) rendered `object-cover object-center` at
 * `opacity-60` over `bg-primary` (`--color-primary`), fixed at `z-backdrop`.
 * The transparency is therefore identical to production — including the
 * BR-15 graceful fallback (on image error the src is cleared and the flat
 * `bg-primary` shows through, e.g. in a hermetic addon-vitest run).
 *
 * Layout mirrors the app (`__root` → AppShell workspace): the fixed backdrop
 * sits behind, the story stacks over it on `z-base` inside a padded wrapper.
 *
 * Spec references:
 *  - docs/specs/front/design-system/tokens.md §10.1 — ambient backdrop treatment.
 *  - docs/specs/front/components/GlassSurface.component.spec.md §9 (stories MUST
 *    use this decorator).
 *  - docs/specs/front/front.md §2.3 (ambient backdrop rules) + front.back.md
 *    BR-15 (lazy src, flat-color fallback).
 */
import type { Decorator } from "@storybook/react-vite";
import type { ReactElement } from "react";

// Relative import (not the `@` alias): this file lives under `.storybook/`,
// outside the tsconfig `include`, so vite-tsconfig-paths does not rewrite `@`
// here.
import { AmbientBackdrop } from "../../src/shell/AmbientBackdrop";

interface BackdropOptions {
  /** Padding around the story slot; default `md`. */
  padding?: "sm" | "md" | "lg";
}

/**
 * Returns a Storybook decorator that renders the real ambient backdrop behind
 * the story. The story content stacks over the backdrop on `z-base`, in a
 * padded wrapper — the same layering the app uses between the fixed backdrop
 * and the workspace region.
 */
export function withAmbientBackdrop(opts: BackdropOptions = {}): Decorator {
  const padding = opts.padding ?? "md";
  const paddingClass =
    padding === "sm" ? "p-md" : padding === "lg" ? "p-2xl" : "p-xl";

  const Decorated: Decorator = (Story): ReactElement => {
    return (
      // Dark-only app: pin the theme so the token set matches production even
      // if a story overrides `data-theme` on an inner node.
      <div data-theme="dark" className="min-h-full">
        <AmbientBackdrop />
        <div
          data-backdrop="ambient"
          className={`relative z-base ${paddingClass}`}
        >
          <Story />
        </div>
      </div>
    );
  };

  return Decorated;
}
