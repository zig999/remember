/**
 * SignInPanel — Storybook stories (TC-02).
 *
 * Covers the four UI states from sign-in.feature.spec.md §2 plus the reduced-
 * motion path. Every story renders over the ambient backdrop via the shared
 * `withAmbientBackdrop` decorator so the glass-on-treated-base composition is
 * actually visible (otherwise the frosted-glass tint reads as a flat block).
 *
 * `addon-a11y` runs against every story by default (preview.tsx) — the panel
 * heading, labels, button and any role="alert" / role="status" landmarks are
 * verified for WCAG 2.2 AA conformance.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignInPanel } from "./SignInPanel";
import { withAmbientBackdrop } from "../../../../.storybook/decorators/withAmbientBackdrop";

/** Async no-op onSubmit so Storybook controls can drive each state without
 *  triggering React Hook Form's "missing handler" warning. */
const noopSubmit = async () => {
  // Intentionally empty — TC-03 wires the real mutation.
};

const meta: Meta<typeof SignInPanel> = {
  title: "Features/Auth/SignInPanel",
  component: SignInPanel,
  parameters: {
    a11y: { element: "#storybook-root" },
    layout: "fullscreen",
  },
  decorators: [withAmbientBackdrop({ theme: "dark", padding: "lg" })],
  args: {
    onSubmit: noopSubmit,
    isSubmitting: false,
    error: null,
    sessionExpired: false,
  },
};

export default meta;
type Story = StoryObj<typeof SignInPanel>;

/** UI-01 idle — cold load of /sign-in. */
export const Default: Story = {
  name: "Default (idle)",
};

/** UI-02 submitting — fields disabled, button shows spinner + "Entrando…". */
export const Submitting: Story = {
  args: { isSubmitting: true },
};

/** UI-03 error/credential — inline role="alert" "E-mail ou senha incorretos." */
export const ErrorCredential: Story = {
  args: { error: { type: "credential" } },
};

/** UI-03 error/network — inline role="alert" connection-error message. */
export const ErrorNetwork: Story = {
  args: { error: { type: "network" } },
};

/** UI-03 error/unknown — fallback message for unclassified SDK exceptions. */
export const ErrorUnknown: Story = {
  args: { error: { type: "unknown" } },
};

/** UI-01 conditional — session-expired info notice above the form. */
export const SessionExpired: Story = {
  args: { sessionExpired: true },
};

/**
 * ReducedMotion — same panel rendered under `prefers-reduced-motion: reduce`.
 * The preview decorator (preview.tsx) injects a CSS override that nullifies
 * Framer Motion durations; combined with the factory's reduced-motion branch
 * the CRT collapses to a fade-only entrance (WCAG 2.2 AA, §8).
 */
export const ReducedMotion: Story = {
  parameters: { reducedMotion: "reduce" },
};
