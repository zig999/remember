/**
 * StateBadge — Storybook stories (TC-07).
 *
 * Mirrors docs/specs/front/components/StateBadge.component.spec.md §8 (14
 * stories). Every non-interactive story doubles as a Vitest component test
 * via addon-vitest browser mode. addon-a11y runs on every story per the
 * Storybook 9 preview config (.storybook/preview.tsx).
 *
 * Story families:
 *  - Default            — all 5 confidence states side-by-side at size sm
 *  - Single states      — Accepted, Uncertain, LowConfidence, Disputed, Superseded
 *  - Variants           — Sizes (5 × 2 grid), IconOnly, CustomLabel
 *  - Motion             — ReducedMotionStatic (static), PromoteTransition,
 *                         SupersedeTransition, MergeTransition (all 3
 *                         interactive with play functions)
 *  - Context            — OnGlassPanel, LightTheme
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { StateBadge } from "./StateBadge";
import type { ConfidenceState } from "./StateBadge.types";

const ALL_STATES: ConfidenceState[] = [
  "accepted",
  "uncertain",
  "low-confidence",
  "disputed",
  "superseded",
];

const meta: Meta<typeof StateBadge> = {
  title: "DS/StateBadge",
  component: StateBadge,
  parameters: {
    a11y: { element: "#storybook-root" },
  },
  args: {
    state: "accepted",
    animate: true,
    size: "sm",
    iconOnly: false,
  },
  argTypes: {
    state: { control: "select", options: ALL_STATES },
    size: { control: "inline-radio", options: ["sm", "md"] },
    animate: { control: "boolean" },
    iconOnly: { control: "boolean" },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof StateBadge>;

/* ---------- Default — five states in a row ----------------------------- */
export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-md p-md">
      {ALL_STATES.map((s) => (
        <StateBadge key={s} state={s} />
      ))}
    </div>
  ),
};

/* ---------- Single state stories --------------------------------------- */
export const Accepted: Story = {
  args: { state: "accepted" },
};

export const Uncertain: Story = {
  args: { state: "uncertain", animate: true },
};

export const LowConfidence: Story = {
  args: { state: "low-confidence" },
};

export const Disputed: Story = {
  args: { state: "disputed" },
};

export const Superseded: Story = {
  args: { state: "superseded" },
};

/* ---------- Sizes — 5 × 2 grid ----------------------------------------- */
export const Sizes: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-md p-md">
      {ALL_STATES.flatMap((s) =>
        (["sm", "md"] as const).map((sz) => (
          <StateBadge key={`${s}-${sz}`} state={s} size={sz} />
        )),
      )}
    </div>
  ),
};

/* ---------- IconOnly — dense / table-cell variant ---------------------- */
export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-md p-md">
      {ALL_STATES.map((s) => (
        <StateBadge key={s} state={s} iconOnly />
      ))}
    </div>
  ),
};

/* ---------- CustomLabel — label override ------------------------------- */
export const CustomLabel: Story = {
  args: { state: "accepted", label: "Validado" },
};

/* ---------- ReducedMotionStatic — global decorator simulates reduce ---- */
export const ReducedMotionStatic: Story = {
  args: { state: "uncertain", animate: true },
  parameters: {
    // Consumed by the global decorator in .storybook/preview.tsx — adds a
    // CSS override that nullifies CSS animations/transitions inside the
    // story tree, simulating prefers-reduced-motion: reduce in jsdom-free
    // environments.
    reducedMotion: "reduce",
  },
};

/* ---------- PromoteTransition — interactive (play fn) ------------------ */
export const PromoteTransition: Story = {
  render: () => {
    function Demo() {
      const [state, setState] = useState<ConfidenceState>("uncertain");
      const toggle = () =>
        setState((s) => (s === "uncertain" ? "accepted" : "uncertain"));
      return (
        <div className="flex flex-col items-start gap-md p-md">
          <StateBadge state={state} animate />
          <button
            type="button"
            onClick={toggle}
            className="rounded-md border border-border bg-surface px-md py-sm text-body-sm text-content"
            data-testid="promote-toggle"
          >
            Alternar uncertain ↔ accepted
          </button>
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByTestId("promote-toggle");
    // First click: uncertain -> accepted (plays promote variant).
    await userEvent.click(btn);
    const badgeAccepted = await canvas.findByLabelText(/Aceito/);
    expect(badgeAccepted).toBeTruthy();
    // Second click: accepted -> uncertain (returns to ambient pulse).
    await userEvent.click(btn);
    const badgeUncertain = await canvas.findByLabelText(/Incerto/);
    expect(badgeUncertain).toBeTruthy();
  },
};

/* ---------- SupersedeTransition — interactive (play fn) ---------------- */
export const SupersedeTransition: Story = {
  render: () => {
    function Demo() {
      const [state, setState] = useState<ConfidenceState>("accepted");
      const toggle = () =>
        setState((s) => (s === "accepted" ? "superseded" : "accepted"));
      return (
        <div className="flex flex-col items-start gap-md p-md">
          <StateBadge state={state} animate />
          <button
            type="button"
            onClick={toggle}
            className="rounded-md border border-border bg-surface px-md py-sm text-body-sm text-content"
            data-testid="supersede-toggle"
          >
            Alternar accepted ↔ superseded
          </button>
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByTestId("supersede-toggle");
    await userEvent.click(btn);
    const badgeSuper = await canvas.findByLabelText(/Superado/);
    expect(badgeSuper).toBeTruthy();
    await userEvent.click(btn);
    const badgeAccepted = await canvas.findByLabelText(/Aceito/);
    expect(badgeAccepted).toBeTruthy();
  },
};

/* ---------- MergeTransition — two badges, data-state-transition=merge -- */
export const MergeTransition: Story = {
  render: () => {
    function Demo() {
      const [merging, setMerging] = useState(false);
      const ref1 = (el: HTMLSpanElement | null) => {
        if (el) {
          if (merging) el.dataset.stateTransition = "merge";
          else delete el.dataset.stateTransition;
        }
      };
      const ref2 = (el: HTMLSpanElement | null) => {
        if (el) {
          if (merging) el.dataset.stateTransition = "merge";
          else delete el.dataset.stateTransition;
        }
      };
      return (
        <div className="flex flex-col items-start gap-md p-md">
          <div className="flex items-center gap-lg">
            <StateBadge state="accepted" animate ref={ref1} />
            <StateBadge state="accepted" animate ref={ref2} />
          </div>
          <button
            type="button"
            onClick={() => setMerging((m) => !m)}
            className="rounded-md border border-border bg-surface px-md py-sm text-body-sm text-content"
            data-testid="merge-toggle"
          >
            Acionar merge
          </button>
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByTestId("merge-toggle");
    await userEvent.click(btn);
    // After the click both badges still render (merge does not unmount —
    // the consumer-driven coordinate move is out of scope for this atom).
    const badges = await canvas.findAllByLabelText(/Aceito/);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  },
};

/* ---------- OnGlassPanel — over the typical surface backdrop ----------- */
export const OnGlassPanel: Story = {
  render: () => (
    <div className="p-xl">
      <div className="flex flex-wrap items-center gap-md rounded-lg bg-surface-glass-panel p-lg shadow-glass backdrop-blur-glass-md">
        {ALL_STATES.map((s) => (
          <StateBadge key={s} state={s} />
        ))}
      </div>
    </div>
  ),
};

/* ---------- LightTheme — data-theme="light" wrapper -------------------- */
export const LightTheme: Story = {
  render: () => (
    <div data-theme="light" className="bg-primary p-md">
      <div className="flex flex-wrap items-center gap-md">
        {ALL_STATES.map((s) => (
          <StateBadge key={s} state={s} />
        ))}
      </div>
    </div>
  ),
};
