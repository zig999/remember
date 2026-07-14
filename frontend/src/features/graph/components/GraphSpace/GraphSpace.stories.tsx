/**
 * GraphSpace — Storybook stories (TC-FE-12).
 *
 * Why these stories matter (per u-fe-standards "Tests verify intent"):
 *  - Each story doubles as a Vitest component test under addon-vitest's
 *    browser mode — they pin the visual contract of GraphSpace at the
 *    composition level (empty / loading / error / ready / revealing), one
 *    of the four artifact deliverables of TC-FE-12.
 *  - The story for `isTemporal` edges (AC-F.11) renders a tiny mixed
 *    subgraph (one temporal, one stable) so the addon-a11y panel verifies
 *    the contrast of both stroke variants on the depth overlay.
 *  - The reduced-motion variant pins UC-CG-11 visually: when the global
 *    `prefers-reduced-motion` is set to `reduce`, the staggered reveal
 *    collapses to a near-instant show (see preview.tsx — the global
 *    decorator nullifies animation/transition durations).
 *
 * Spec references:
 *  - docs/specs/front/components/GraphSpace.component.spec.md §3 (states
 *    matrix), §7 (BDD scenarios 1–5), §8 (a11y).
 *  - temp/chat-graphspace-plan.md §6.2 (props), §11 UC-CG-{01,03,05,06,11},
 *    §13 AC-F.{10,11,13,14,16}.
 *
 * Implementation notes:
 *  - GraphSpace subscribes to `useGraphStore` indirectly via
 *    `useForceLayout` / `useGraphReveal` (the canvas region reads
 *    positions and revealed-ids from the live store). Each story therefore
 *    seeds the store with the same nodes/links it passes as props — this
 *    mirrors how `ChatWorkspace` wires the component in production (the
 *    parent reads the store, derives the prop arrays, and forwards them).
 *  - Reset is performed inside a `useEffect` so that re-rendering a story
 *    (e.g., addon-vitest's reload between args) always starts from a clean
 *    store state — otherwise a stale `revealedIds` Set from a prior story
 *    would leak across boundaries.
 *  - We do NOT install a fake `ResizeObserver` here — Storybook runs in a
 *    real browser context via @vitest/browser + Playwright, which provides
 *    the real DOM API. (Contrast with the unit tests where jsdom requires
 *    a no-op shim.)
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, type ReactElement, type ReactNode } from "react";
import { GraphSpace } from "./GraphSpace";
import { useGraphStore } from "../../state/graph-store";
import type {
  GraphDelta,
  GraphLinkData,
  GraphNodeData,
} from "../../types";
import { withAmbientBackdrop } from "../../../../../.storybook/decorators/withAmbientBackdrop";

/* ---------- Fixture helpers --------------------------------------------- */

function makeNode(
  id: string,
  type: GraphNodeData["type"],
  label: string,
  state: GraphNodeData["state"] = "accepted",
): GraphNodeData {
  return { id, type, label, state };
}

function makeLink(
  id: string,
  source: string,
  target: string,
  label: string,
  isTemporal: boolean,
): GraphLinkData {
  // Storybook fixtures: humanize the slug so each story shows a non-empty
  // visible label without hand-curating a pt-BR string per link.
  return {
    id,
    source,
    target,
    label,
    linkTypeLabel: label.replace(/_/g, " "),
    isTemporal,
  };
}

const SAMPLE_NODES: readonly GraphNodeData[] = [
  makeNode("p-rodrigo", "person", "Rodrigo"),
  makeNode("o-acme", "organization", "Acme"),
  makeNode("prj-remember", "project", "Remember"),
  makeNode("e-launch", "event", "Lançamento"),
];

const SAMPLE_LINKS: readonly GraphLinkData[] = [
  // Temporal — solid stroke (tokens.md §7).
  makeLink("l-pr-emp", "p-rodrigo", "o-acme", "employed_by", true),
  // Stable — dashed stroke (tokens.md §7).
  makeLink("l-pr-part", "p-rodrigo", "prj-remember", "participates_in", false),
  // Temporal again — mixed subgraph proves the AC-F.11 distinction visually.
  makeLink("l-pr-led", "p-rodrigo", "e-launch", "led", true),
];

/**
 * `StoreSeeder` hydrates the singleton store with the given delta on mount
 * and clears it on unmount. Stories use this so the underlying hooks
 * (`useForceLayout`, `useGraphReveal`) have data to consume when the
 * canvas mounts. Without it, props would render zero nodes (the canvas
 * reads `revealedIds` from the store, not from props).
 */
function StoreSeeder({
  delta,
  preReveal,
  status,
}: {
  readonly delta: GraphDelta;
  /** When `true`, mark every node as already revealed so the canvas paints
   *  them immediately (use for `ready` stories — skips the stagger). */
  readonly preReveal: boolean;
  /** Optional initial GraphStatus to set after seeding. Matches the prop
   *  passed to `<GraphSpace status=…>`. */
  readonly status?: GraphNodeData[] extends infer _ ? string : never;
}): null {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot
  useEffect(() => {
    const store = useGraphStore.getState();
    store.clear();
    store.addNodes(delta);
    if (preReveal) {
      // Drain the entire reveal queue and mark every id as revealed so the
      // canvas paints all nodes immediately. Matches the post-`useGraphReveal`
      // steady state when a turn has settled to `ready`.
      useGraphStore.setState((s) => {
        const next = new Set(s.revealedIds);
        for (const id of s.revealQueue) next.add(id);
        return { revealQueue: [], revealedIds: next };
      });
    }
    if (status) {
      store.setStatus(status as Parameters<typeof store.setStatus>[0]);
    }
    return () => {
      useGraphStore.getState().clear();
    };
    // We intentionally re-run on every prop change so switching stories via
    // addon-controls reseeds the store.
  }, [delta, preReveal, status]);
  return null;
}

/** Common frame so the section has a measurable height — matches the
 *  right pane geometry in ChatWorkspace (60% of viewport at `@lg`). */
function PaneFrame({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="flex h-[560px] w-[760px] flex-col p-md">{children}</div>
  );
}

const meta: Meta<typeof GraphSpace> = {
  title: "Eternal/Features/Graph/GraphSpace",
  component: GraphSpace,
  parameters: {
    a11y: { element: "#storybook-root" },
    layout: "fullscreen",
  },
  decorators: [withAmbientBackdrop({ padding: "md" })],
  argTypes: {
    status: {
      control: "select",
      options: ["empty", "loading", "revealing", "ready", "error"],
    },
    errorMessage: { control: "text" },
    revealStaggerMs: { control: "number" },
  },
};
export default meta;
type Story = StoryObj<typeof GraphSpace>;

/* ----------------------------------------------------------------------- *
 * Story 1 — Empty state (status="empty")                                  *
 * Pins AC-F.13 (status='empty' → GraphEmptyState) and Scenario 1 (BDD).    *
 * ----------------------------------------------------------------------- */
export const Empty: Story = {
  name: "State/Empty",
  args: {
    nodes: [],
    links: [],
    status: "empty",
  },
  render: (args) => (
    <PaneFrame>
      <GraphSpace {...args} />
    </PaneFrame>
  ),
};

/* ----------------------------------------------------------------------- *
 * Story 2 — Loading overlay (status="loading")                            *
 * Pins AC-F.13 (status='loading' → overlay "Buscando na memória…") and    *
 * BDD Scenario 2 (overlay over existing nodes — pre-revealed sample).      *
 * ----------------------------------------------------------------------- */
export const Loading: Story = {
  name: "State/Loading",
  args: {
    nodes: SAMPLE_NODES,
    links: SAMPLE_LINKS,
    status: "loading",
  },
  render: (args) => (
    <PaneFrame>
      <StoreSeeder
        delta={{
          sourceTool: "stub",
          nodes: SAMPLE_NODES,
          links: SAMPLE_LINKS,
        }}
        preReveal
      />
      <GraphSpace {...args} />
    </PaneFrame>
  ),
};

/* ----------------------------------------------------------------------- *
 * Story 3 — Ready with nodes + mixed isTemporal edges (status="ready")    *
 * Pins AC-F.10 (one adapter per node/link), AC-F.11 (isTemporal           *
 * solid/dashed), BDD Scenario 4 (pin invariant — see also reveal story).  *
 * ----------------------------------------------------------------------- */
export const ReadyWithNodes: Story = {
  name: "State/Ready (with nodes)",
  args: {
    nodes: SAMPLE_NODES,
    links: SAMPLE_LINKS,
    status: "ready",
  },
  render: (args) => (
    <PaneFrame>
      <StoreSeeder
        delta={{
          sourceTool: "stub",
          nodes: SAMPLE_NODES,
          links: SAMPLE_LINKS,
        }}
        preReveal
      />
      <GraphSpace {...args} />
    </PaneFrame>
  ),
};

/* ----------------------------------------------------------------------- *
 * Story 4 — Revealing (status="revealing")                                *
 * Pins AC-F.14 visually — when the story mounts, useGraphReveal animates  *
 * nodes one-by-one. The browser-mode addon-vitest snapshot captures the   *
 * mid-reveal state. The story-level `revealStaggerMs` can be increased to *
 * make the cadence obvious in the Storybook UI.                            *
 * ----------------------------------------------------------------------- */
export const Revealing: Story = {
  name: "Motion/Revealing",
  args: {
    nodes: SAMPLE_NODES,
    links: SAMPLE_LINKS,
    status: "revealing",
    // Slower than production to make the cadence visible in the addon UI.
    revealStaggerMs: 220,
  },
  render: (args) => (
    <PaneFrame>
      {/* Seed without pre-revealing so useGraphReveal has work to do. */}
      <StoreSeeder
        delta={{
          sourceTool: "stub",
          nodes: SAMPLE_NODES,
          links: SAMPLE_LINKS,
        }}
        preReveal={false}
      />
      <GraphSpace {...args} />
    </PaneFrame>
  ),
};

/* ----------------------------------------------------------------------- *
 * Story 5 — Reduced motion (UC-CG-11, AC-F.16)                            *
 * Visually proves that with `prefers-reduced-motion: reduce`, the         *
 * staggered reveal collapses to near-instant (the preview.tsx global       *
 * decorator zeros animation durations when this param is set). Doubles    *
 * as accessibility regression — addon-a11y still passes.                   *
 * ----------------------------------------------------------------------- */
export const ReducedMotion: Story = {
  name: "Motion/ReducedMotion",
  parameters: { reducedMotion: "reduce" },
  args: {
    nodes: SAMPLE_NODES,
    links: SAMPLE_LINKS,
    status: "revealing",
    revealStaggerMs: 90,
  },
  render: (args) => (
    <PaneFrame>
      <StoreSeeder
        delta={{
          sourceTool: "stub",
          nodes: SAMPLE_NODES,
          links: SAMPLE_LINKS,
        }}
        preReveal={false}
      />
      <GraphSpace {...args} />
    </PaneFrame>
  ),
};

/* ----------------------------------------------------------------------- *
 * Story 6 — Error overlay (status="error")                                *
 * Pins AC-F.13 (status='error' → error overlay), BDD Scenario 5           *
 * (existing nodes survive an error) and I-6 (no retry button).             *
 * ----------------------------------------------------------------------- */
export const Error: Story = {
  name: "State/Error",
  args: {
    nodes: SAMPLE_NODES,
    links: SAMPLE_LINKS,
    status: "error",
    errorMessage: "Ferramenta falhou ao buscar dados.",
  },
  render: (args) => (
    <PaneFrame>
      <StoreSeeder
        delta={{
          sourceTool: "stub",
          nodes: SAMPLE_NODES,
          links: SAMPLE_LINKS,
        }}
        preReveal
      />
      <GraphSpace {...args} />
    </PaneFrame>
  ),
};
