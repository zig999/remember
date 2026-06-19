/**
 * GlassSurface — Storybook stories (TC-07).
 *
 * Mirrors docs/specs/front/components/GlassSurface.component.spec.md §9 (14
 * stories). All stories use the `withAmbientBackdrop` decorator so the
 * frosted-glass composition (translucency + blur + top-edge highlight) is
 * visible — glass over an empty white background is meaningless (§9 note).
 *
 * Story families (matching the spec table):
 *  - Ambient    — Ambient/Dark, Ambient/Light
 *  - Panel      — Panel/Dark, Panel/Light, Panel/AccentUncertain,
 *                 Panel/AccentFocus, Panel/AccentDisputed
 *  - Modal      — Modal/Dark, Modal/Light, Modal/AccentError
 *  - Motion     — Motion/PanelEnter, Motion/ModalEnter (interactive),
 *                 Motion/ReducedMotion (static via parameter)
 *  - A11y       — A11y/ContrastSmoke (3 levels × 2 themes)
 *
 * Non-interactive stories run as Vitest component tests via addon-vitest.
 * addon-a11y runs against every story for WCAG 2.2 AA verification.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactElement } from "react";
import { expect, userEvent, within } from "storybook/test";
import { GlassSurface } from "./GlassSurface";
import { withAmbientBackdrop } from "../../../../.storybook/decorators/withAmbientBackdrop";

const meta: Meta<typeof GlassSurface> = {
  title: "Components/GlassSurface",
  component: GlassSurface,
  parameters: {
    a11y: { element: "#storybook-root" },
  },
  args: {
    level: "panel",
    accent: "none",
    animate: true,
  },
  argTypes: {
    level: { control: "inline-radio", options: ["ambient", "panel", "modal"] },
    accent: {
      control: "select",
      options: [
        "none",
        "accepted",
        "uncertain",
        "disputed",
        "superseded",
        "focus",
        "error",
      ],
    },
    animate: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof GlassSurface>;

/** Common in-surface content for visual stories. */
const SampleContent = (): ReactElement => (
  <div className="flex flex-col gap-sm">
    <p className="text-content text-body-lg">Superfície de vidro</p>
    <p className="text-body text-body-sm">
      Camada com translucidez, desfoque e borda fina sobre o fundo tratado.
    </p>
  </div>
);

/* ---------- Ambient ---------------------------------------------------- */
export const AmbientDark: Story = {
  name: "Ambient/Dark",
  args: { level: "ambient" },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <GlassSurface {...args} className="p-lg">
      <SampleContent />
    </GlassSurface>
  ),
};

export const AmbientLight: Story = {
  name: "Ambient/Light",
  args: { level: "ambient" },
  decorators: [withAmbientBackdrop({ theme: "light" })],
  render: (args) => (
    <GlassSurface {...args} className="p-lg">
      <SampleContent />
    </GlassSurface>
  ),
};

/* ---------- Panel ------------------------------------------------------ */
export const PanelDark: Story = {
  name: "Panel/Dark",
  args: { level: "panel" },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <GlassSurface {...args} className="p-lg">
      <SampleContent />
    </GlassSurface>
  ),
};

export const PanelLight: Story = {
  name: "Panel/Light",
  args: { level: "panel" },
  decorators: [withAmbientBackdrop({ theme: "light" })],
  render: (args) => (
    <GlassSurface {...args} className="p-lg">
      <SampleContent />
    </GlassSurface>
  ),
};

export const PanelAccentUncertain: Story = {
  name: "Panel/AccentUncertain",
  args: { level: "panel", accent: "uncertain" },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <GlassSurface {...args} className="p-lg">
      <SampleContent />
    </GlassSurface>
  ),
};

export const PanelAccentFocus: Story = {
  name: "Panel/AccentFocus",
  args: { level: "panel", accent: "focus" },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <GlassSurface {...args} className="p-lg">
      <SampleContent />
    </GlassSurface>
  ),
};

export const PanelAccentDisputed: Story = {
  name: "Panel/AccentDisputed",
  args: { level: "panel", accent: "disputed" },
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: (args) => (
    <GlassSurface {...args} className="p-lg">
      <SampleContent />
    </GlassSurface>
  ),
};

/* ---------- Modal ------------------------------------------------------ */
export const ModalDark: Story = {
  name: "Modal/Dark",
  args: { level: "modal" },
  decorators: [withAmbientBackdrop({ theme: "dark", padding: "lg" })],
  render: (args) => (
    <GlassSurface {...args} className="p-xl">
      <SampleContent />
    </GlassSurface>
  ),
};

export const ModalLight: Story = {
  name: "Modal/Light",
  args: { level: "modal" },
  decorators: [withAmbientBackdrop({ theme: "light", padding: "lg" })],
  render: (args) => (
    <GlassSurface {...args} className="p-xl">
      <SampleContent />
    </GlassSurface>
  ),
};

export const ModalAccentError: Story = {
  name: "Modal/AccentError",
  args: { level: "modal", accent: "error" },
  decorators: [withAmbientBackdrop({ theme: "dark", padding: "lg" })],
  render: (args) => (
    <GlassSurface {...args} className="p-xl">
      <SampleContent />
    </GlassSurface>
  ),
};

/* ---------- Motion ----------------------------------------------------- */

/**
 * Motion/PanelEnter — interactive: a button toggles mount of the panel so
 * the enter variant plays once on each mount. addon-vitest captures the
 * play-function interaction as a browser-mode test.
 */
export const MotionPanelEnter: Story = {
  name: "Motion/PanelEnter",
  decorators: [withAmbientBackdrop({ theme: "dark" })],
  render: () => {
    function Demo() {
      const [mounted, setMounted] = useState(false);
      return (
        <div className="flex flex-col items-start gap-md">
          <button
            type="button"
            onClick={() => setMounted((m) => !m)}
            className="rounded-md border border-border bg-surface px-md py-sm text-body-sm text-content"
            data-testid="panel-toggle"
          >
            {mounted ? "Desmontar painel" : "Montar painel"}
          </button>
          {mounted ? (
            <GlassSurface level="panel" className="p-lg" data-testid="motion-panel">
              <SampleContent />
            </GlassSurface>
          ) : null}
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByTestId("panel-toggle");
    await userEvent.click(btn);
    const panel = await canvas.findByTestId("motion-panel");
    expect(panel).toBeTruthy();
    expect(panel.getAttribute("data-motion-variant")).toBe("glass-panel");
  },
};

/**
 * Motion/ModalEnter — same shape as PanelEnter but for the modal level.
 */
export const MotionModalEnter: Story = {
  name: "Motion/ModalEnter",
  decorators: [withAmbientBackdrop({ theme: "dark", padding: "lg" })],
  render: () => {
    function Demo() {
      const [mounted, setMounted] = useState(false);
      return (
        <div className="flex flex-col items-start gap-md">
          <button
            type="button"
            onClick={() => setMounted((m) => !m)}
            className="rounded-md border border-border bg-surface px-md py-sm text-body-sm text-content"
            data-testid="modal-toggle"
          >
            {mounted ? "Fechar modal" : "Abrir modal"}
          </button>
          {mounted ? (
            <GlassSurface level="modal" className="p-xl" data-testid="motion-modal">
              <SampleContent />
            </GlassSurface>
          ) : null}
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByTestId("modal-toggle");
    await userEvent.click(btn);
    const modal = await canvas.findByTestId("motion-modal");
    expect(modal).toBeTruthy();
    expect(modal.getAttribute("data-motion-variant")).toBe("glass-modal");
  },
};

/**
 * Motion/ReducedMotion — modal rendered with a story-level parameter
 * simulating prefers-reduced-motion: reduce. The global decorator in
 * preview.tsx injects a CSS override that nullifies animations.
 */
export const MotionReducedMotion: Story = {
  name: "Motion/ReducedMotion",
  args: { level: "modal" },
  decorators: [withAmbientBackdrop({ theme: "dark", padding: "lg" })],
  parameters: { reducedMotion: "reduce" },
  render: (args) => (
    <GlassSurface {...args} className="p-xl">
      <SampleContent />
    </GlassSurface>
  ),
};
/**
 * A11y/ContrastSmoke — 3 levels × content text. Renders the 3 glass levels
 * side by side, each with `text-content` placeholder text. addon-a11y
 * verifies WCAG 2.2 AA contrast on every combination. The dark-themed slice
 * is the default; the light slice is verified by AmbientLight/PanelLight/
 * ModalLight stories above.
 */
export const A11yContrastSmoke: Story = {
  name: "A11y/ContrastSmoke",
  decorators: [withAmbientBackdrop({ theme: "dark", padding: "lg" })],
  render: () => (
    <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
      {(["ambient", "panel", "modal"] as const).map((lvl) => (
        <GlassSurface key={lvl} level={lvl} className="p-lg">
          <p className="text-content text-body-lg">Texto de exemplo</p>
          <p className="text-body text-body-sm">Camada {lvl}</p>
        </GlassSurface>
      ))}
    </div>
  ),
};
