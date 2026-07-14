/**
 * Storybook 9 — preview config (TC-07).
 *
 * - Imports `theme.css` so every story renders with the (dark-only) token
 *   set already in scope (tokens.md §2).
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
      // Stories que não usam `withAmbientBackdrop` renderizam sobre o fundo do
      // TUI (o decorator global também aplica `bg-background`).
      default: "app",
      values: [
        { name: "app", value: "var(--color-background)" },
        { name: "transparent", value: "transparent" },
      ],
    },
    // Ordena a sidebar: seções funcionais do kit primeiro, exclusivos por último.
    options: {
      storySort: {
        order: [
          "Actions",
          "Forms",
          "Data Display",
          "Feedback",
          "Navigation",
          "Overlays",
          "*",
          "Eternal",
        ],
      },
    },
  },
  // Decorators run from last to first; this one is intentionally global and
  // last in line so it can always wrap with the reduced-motion override when
  // requested at the story level.
  decorators: [
    (Story, ctx) => {
      // Aplica o tema selecionado no toolbar (phosphor | default) ao vivo.
      document.documentElement.dataset.theme = String(
        ctx.globals.theme ?? "phosphor",
      );
      const reduce =
        ctx.parameters?.reducedMotion === "reduce" ? "reduce" : "no-preference";
      return (
        <div
          data-reduced-motion={reduce}
          className="min-h-full bg-background text-foreground"
        >
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

// Seletor de tema no toolbar (mesmos temas do TUI). "phosphor" é o default
// (cai no @theme base do kit); "default" ativa o :root[data-theme="default"].
export const globalTypes = {
  theme: {
    description: "Tema de cores (TUI)",
    defaultValue: "phosphor",
    toolbar: {
      title: "Tema",
      icon: "paintbrush",
      items: [
        { value: "phosphor", title: "Phosphor (verde)" },
        { value: "default", title: "Default (Terminal.css)" },
      ],
      dynamicTitle: true,
    },
  },
};

export default preview;
