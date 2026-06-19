/**
 * Storybook 9 — preview config (TC-07).
 *
 * - Imports `theme.css` so every story renders with the dark-default token
 *   set already in scope (tokens.md §2). The `[data-theme="light"]`
 *   overrides activate when a story (or its decorator) sets `data-theme`
 *   on its own root.
 * - Enables addon-a11y on every story by default (WCAG 2.2 AA — front.md
 *   §1, accessibility: wcag-2.2-aa in CLAUDE.md).
 * - Wires a `reducedMotion` parameter that, when set to `"reduce"`, adds a
 *   global CSS override that nullifies animations/transitions; consumed by
 *   the ReducedMotionStatic (StateBadge) and Motion/ReducedMotion
 *   (GlassSurface) stories.
 */
import type { Preview } from "@storybook/react-vite";
import "../src/styles/theme.css";

const preview: Preview = {
  parameters: {
    a11y: {
      // Run on every story; report violations in the addon-a11y panel.
      element: "#storybook-root",
      manual: false,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      // Stories that don't use the `withAmbientBackdrop` decorator render
      // over the canonical app background (matches `--color-primary`).
      default: "app",
      values: [
        { name: "app", value: "oklch(15% 0.012 250)" },
        { name: "transparent", value: "transparent" },
      ],
    },
  },
  // Decorators run from last to first; this one is intentionally global and
  // last in line so it can always wrap with the reduced-motion override when
  // requested at the story level.
  decorators: [
    (Story, ctx) => {
      const reduce =
        ctx.parameters?.reducedMotion === "reduce" ? "reduce" : "no-preference";
      return (
        <div data-reduced-motion={reduce} className="min-h-full">
          {reduce === "reduce" ? (
            <style>{`
              [data-reduced-motion="reduce"] *,
              [data-reduced-motion="reduce"] *::before,
              [data-reduced-motion="reduce"] *::after {
                animation-duration: 0.001ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.001ms !important;
              }
            `}</style>
          ) : null}
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
