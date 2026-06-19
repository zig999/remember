/**
 * Storybook 9 — main config (TC-07).
 *
 * Spec references:
 *  - docs/specs/front/front.md §1 (Stack: Storybook 9 @storybook/react-vite +
 *    addon-a11y + addon-vitest)
 *  - docs/specs/front/front.md §1.1 (version pins — vitest v4 / vite v6)
 *  - docs/specs/front/front.back.md §1 (Storybook config lives in
 *    frontend/.storybook/: main.ts, preview.tsx, vitest.setup.ts)
 *
 * Framework: @storybook/react-vite. Addons:
 *  - @storybook/addon-a11y runs WCAG axe rules on every story.
 *  - @storybook/addon-vitest mounts each non-interactive story as a Vitest
 *    component test in a real browser (via @vitest/browser + Playwright).
 *
 * No `tailwind.config.ts` lookup needed — Tailwind v4 is CSS-first and the
 * styles enter via `src/styles/theme.css`, imported by preview.tsx.
 */
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.@(ts|tsx)",
  ],
  // Serve the app's public/ assets (e.g. the ambient backdrop photo at
  // /backdrop/cityscape-dusk.png) so shell stories render the real image.
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    // Avoid expensive react-docgen pass — props contracts live in
    // *.component.spec.md, not in extracted runtime metadata.
    check: false,
  },
};

export default config;
