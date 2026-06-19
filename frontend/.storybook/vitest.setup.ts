/**
 * Storybook 9 — addon-vitest browser-mode setup (TC-07).
 *
 * Wires the Storybook test runner so that EVERY non-interactive story under
 * `src/**\/*.stories.tsx` runs as a Vitest component test in the browser
 * (via @vitest/browser + Playwright). Interactive stories are tested by
 * their `play` functions.
 *
 * Spec references:
 *  - front.md §1, §1.1 (vitest v4 pin coupled to addon-vitest browser mode).
 *  - front.back.md §7 (addon-vitest requires Playwright on the host).
 *
 * The named export from addon-vitest applies the project's preview config
 * (theme.css import, default decorators, parameters) to every story under
 * test so the rendering matches Storybook's preview frame exactly.
 */
import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as projectAnnotations from "./preview";

const project = setProjectAnnotations([projectAnnotations]);

// Run any global beforeAll hooks contributed by the project's preview.
beforeAll(project.beforeAll);
