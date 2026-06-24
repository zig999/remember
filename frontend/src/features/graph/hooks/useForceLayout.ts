/**
 * useForceLayout — d3-force subgraph layout with pin of existing nodes (TC-FE-05).
 *
 * Reads the live `nodes` / `links` Maps from `useGraphStore`, runs a synchronous
 * d3-force simulation, and writes the computed `{x, y}` positions back into the
 * store's `positions` Map. Returns the same Map so `GraphCanvas` can read it.
 *
 * Spec references:
 *  - temp/chat-graphspace-plan.md Rev. 2026-06-21 §5 D5 (d3-force with pin of
 *    existing nodes), §6.1 (hooks tree), §6.4 (positions Map).
 *  - docs/specs/front/components/GraphSpace.component.spec.md v1.0.0 §1
 *    ("pin existing node positions"), §5 (BDD Scenario 4 — "existing nodes do
 *    not jump"), §7 AC-F.12 (pin invariant).
 *
 * Invariants pinned here:
 *  - D5 / AC-F.12 — **nodes that already have a position in the store are
 *    pinned via `fx`/`fy`**. After the simulation runs, their `x`/`y` are
 *    snapped back to the pinned values by d3-force on every tick. New nodes
 *    receive freshly computed positions from the force field.
 *  - The hook is **headless** — no import of `@xyflow/react`. It only reads
 *    primitive `id`s and writes primitive `{x, y}` pairs. React Flow consumes
 *    the positions Map via `GraphCanvas`.
 *  - **Re-affirmation consolidates** (project principle) — a node that arrives
 *    again with the same id already has a position, so it gets pinned, and
 *    the d3-force pass leaves it exactly where it was. No layout jump.
 *  - **No animated simulation.** d3-force's internal timer is stopped
 *    immediately; we run `SIM_TICKS` ticks synchronously inside the effect
 *    so the positions are ready before the next render. Animating the
 *    simulation across frames would burn CPU on a panel that doesn't need
 *    a "physical settle" feel.
 *
 * Why this seam (not a top-level effect in GraphSpace):
 *  - The simulation depends on the live `nodes` / `links` Maps owned by the
 *    store (single writer — D2). The hook is the bridge between that store
 *    and React Flow positions; GraphSpace stays a thin orchestrator that
 *    consumes both.
 *  - Pure d3-force computation here means it is unit-testable without a DOM
 *    (jsdom is enough — no React Flow / canvas needed).
 *
 * Tailwind v4 note:
 *  - Coordinates are runtime numeric values that flow into React Flow's
 *    `position={{x,y}}` prop. They are NOT styled via utility classes —
 *    there is no "Tailwind arbitrary value" question for layout coordinates.
 */
import { useEffect, useRef } from "react";

import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import { useGraphStore, type GraphPosition } from "../state/graph-store";
import { runTreeLayout } from "../lib/layout-tree";
import { runRadialLayout } from "../lib/layout-radial";

/* -------------------------------------------------------------------------
 * Tunables
 * ------------------------------------------------------------------------- */

/** Number of synchronous ticks per simulation run. d3-force's default natural
 *  ticks count is ~300 (alpha from 1 → 0.001 with default decay). 100 ticks
 *  is short enough to not block the main thread on the small subgraphs the
 *  GraphSpace draws (tens of nodes per turn) while still producing a
 *  visually settled layout. */
const SIM_TICKS = 100;

/** Distance the link force tries to keep between connected nodes. Picked to
 *  match the visual node size in `ds/GraphNode` (≈ 140px wide) plus margin. */
const LINK_DISTANCE = 180;

/** Charge (repulsion) strength. Negative → repulsion. Calibrated against the
 *  link distance so nodes don't bunch up and don't fly off-canvas. */
const CHARGE_STRENGTH = -300;

/** Center of the simulation field. Coordinates are in canvas units; React
 *  Flow's `defaultViewport` is configured to fit. (0, 0) keeps the math
 *  symmetric — the canvas auto-fits once positions are written. */
const CENTER_X = 0;
const CENTER_Y = 0;

/* -------------------------------------------------------------------------
 * Internal simulation shapes — distinct from store shapes
 *
 * d3-force mutates the node objects you hand it (it writes `x`/`y`/`vx`/`vy`
 * onto them during ticks). We therefore build a fresh per-run array of plain
 * objects rather than aliasing the readonly `GraphNodeData` values from the
 * store. The store's domain types remain `readonly`; this shadow array is
 * write-allowed for d3-force's benefit only.
 * ------------------------------------------------------------------------- */

interface SimNode extends SimulationNodeDatum {
  /** Mirror of `GraphNodeData.id` — also d3-force's identity for links. */
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  /** Source node id (resolved by forceLink to the SimNode object). */
  source: string;
  /** Target node id (resolved by forceLink to the SimNode object). */
  target: string;
}

/* -------------------------------------------------------------------------
 * Pure simulation runner — extracted so unit tests can exercise the d3-force
 * pass without a React renderer.
 * ------------------------------------------------------------------------- */

/**
 * Run a synchronous d3-force pass over `nodeIds` + `linkPairs`, pinning every
 * node whose id is in `pinnedPositions` to its existing `{x, y}`. Returns a
 * fresh `Map<string, {x, y}>` containing positions for every node id in
 * `nodeIds`.
 *
 * - Pinned nodes keep their exact pre-existing coordinates (d3-force snaps
 *   `x`/`vx` back to `fx` on every tick — that's the contract documented in
 *   `@types/d3-force` lines 137–143).
 * - New nodes (not in `pinnedPositions`) get their `{x, y}` computed by the
 *   forces (charge + link + center).
 * - Nodes with NO links still receive a position from charge + center, so an
 *   isolated subgraph fragment is still placed.
 * - An empty `nodeIds` short-circuits to an empty Map without instantiating
 *   the simulation.
 */
export function runForceLayout(
  nodeIds: readonly string[],
  linkPairs: readonly { readonly source: string; readonly target: string }[],
  pinnedPositions: ReadonlyMap<string, GraphPosition>,
): Map<string, GraphPosition> {
  const out = new Map<string, GraphPosition>();
  if (nodeIds.length === 0) {
    return out;
  }

  // Build the per-run shadow arrays. Pin existing nodes via fx/fy — d3-force
  // honors these every tick (snap-back), so the simulation may run, charge
  // may push, but the pinned node never moves. New nodes get undefined fx/fy
  // and are placed by the force field.
  const simNodes: SimNode[] = nodeIds.map((id) => {
    const pinned = pinnedPositions.get(id);
    if (pinned !== undefined) {
      // Seeding x/y in addition to fx/fy avoids the brief moment where a
      // tick reads `x === undefined` before the snap-back lands.
      return { id, x: pinned.x, y: pinned.y, fx: pinned.x, fy: pinned.y };
    }
    return { id };
  });

  // Drop links whose endpoints are not part of this nodeIds set — d3-force
  // would otherwise throw or create a phantom node. (`removeNodes` already
  // drops orphan links from the store, but the hook still defends the
  // contract — `useForceLayout` is the last layer before d3-force.)
  const nodeIdSet = new Set(nodeIds);
  const simLinks: SimLink[] = linkPairs
    .filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))
    .map((l) => ({ source: l.source, target: l.target }));

  // Construct the simulation, stop the internal animation timer immediately,
  // and run a fixed number of synchronous ticks. The `.stop()` call is the
  // d3-force contract for "I will tick manually" (@types/d3-force line 101).
  const simulation: Simulation<SimNode, SimLink> = forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(LINK_DISTANCE),
    )
    .force("charge", forceManyBody<SimNode>().strength(CHARGE_STRENGTH))
    .force("center", forceCenter<SimNode>(CENTER_X, CENTER_Y))
    .stop();

  simulation.tick(SIM_TICKS);

  // Collect results. `x`/`y` are defined after the first tick (the d3-force
  // initializer sets them in a phyllotaxis arrangement if absent — see the
  // module docs). We still guard with `?? 0` so a degenerate path never
  // writes `undefined` into the store's Map.
  for (const n of simNodes) {
    out.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
  }

  return out;
}

/* -------------------------------------------------------------------------
 * The hook
 * ------------------------------------------------------------------------- */

/**
 * React binding around `runForceLayout`.
 *
 * - Re-runs the simulation whenever the store's `nodes` Map or `links` Map
 *   identity changes (i.e. when `addNodes` / `removeNodes` / `clear` run —
 *   each writes a fresh Map per the store's contract).
 * - Reads the latest `positions` snapshot inside the effect (NOT via a
 *   subscription) — depending on `positions` would cause the effect to
 *   re-fire on its own write and loop. Reading it once at effect entry is
 *   safe because the only meaningful drivers of a re-run are node/link
 *   changes, and pinned positions are stable across those.
 * - Returns the live `positions` Map (subscribed). Components that consume
 *   this hook re-render whenever positions change.
 */
export function useForceLayout(): ReadonlyMap<string, GraphPosition> {
  // Subscribe to the Maps. We pull each slice separately so re-renders are
  // narrow (any other store change — status, revealQueue — does not retrigger
  // this hook).
  const nodes = useGraphStore((s) => s.nodes);
  const links = useGraphStore((s) => s.links);
  const positions = useGraphStore((s) => s.positions);
  // `resetLayout` (Phase 2) bumps this. A change means "re-flow everything,
  // ignoring pins" — distinct from a delta-driven run, which honours pins.
  const layoutNonce = useGraphStore((s) => s.layoutNonce);
  // TC-02 — the dispatcher switches between the three runners. NOT a hook
  // dep (the effect already depends on `layoutNonce`, which `setLayoutAlgorithm`
  // bumps). Read inside the effect so the latest value wins without forcing
  // a second re-run.
  const layoutAlgorithm = useGraphStore((s) => s.layoutAlgorithm);

  // Latest-positions ref — used inside the effect to read the pin set without
  // making `positions` itself an effect dependency (that would loop on the
  // store write below).
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  // Tracks the last nonce the effect ran with, so we can tell a reset run
  // (nonce changed) from a delta run (nodes/links changed).
  const prevNonceRef = useRef(layoutNonce);

  useEffect(() => {
    // A "Reorganizar" reset run ignores the pin set so every node re-flows;
    // a normal (delta-driven) run pins existing/user-placed nodes (AC-F.12).
    const isReset = prevNonceRef.current !== layoutNonce;
    prevNonceRef.current = layoutNonce;

    // Snapshot the inputs at effect time.
    const nodeIds = Array.from(nodes.keys());
    const linkPairs = Array.from(links.values(), (l) => ({
      source: l.source,
      target: l.target,
    }));
    const pinned = isReset
      ? new Map<string, GraphPosition>()
      : positionsRef.current;

    if (nodeIds.length === 0) {
      // No nodes → ensure the store's positions Map is empty (it may carry
      // stale entries from a prior `clear()` path that did NOT touch
      // positions — defensive). Skip the write if it would be a no-op so we
      // don't churn the subscriber.
      if (useGraphStore.getState().positions.size === 0) return;
      useGraphStore.setState({ positions: new Map<string, GraphPosition>() });
      return;
    }

    // Dispatch to the correct runner. All three share the same signature so
    // the call site stays identical — only the function reference differs.
    // `runForceLayout` remains the default and the existing tests still
    // pin its pin-preserving behaviour.
    let next: Map<string, GraphPosition>;
    switch (layoutAlgorithm) {
      case "tree":
        next = runTreeLayout(nodeIds, linkPairs, pinned);
        break;
      case "radial":
        next = runRadialLayout(nodeIds, linkPairs, pinned);
        break;
      case "force":
      default:
        next = runForceLayout(nodeIds, linkPairs, pinned);
        break;
    }

    // Write back to the store. We always replace with a fresh Map so the
    // subscription's referential check fires — Zustand uses strict equality.
    useGraphStore.setState({ positions: next });
    // Intentionally NOT depending on `positions` — see the docstring above.
    // `layoutNonce` IS a dep: bumping it (resetLayout / setLayoutAlgorithm)
    // forces a re-flow. `layoutAlgorithm` is read fresh inside the effect
    // — switching algorithm always bumps `layoutNonce`, so it rides the
    // same trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, layoutNonce]);

  return positions;
}
