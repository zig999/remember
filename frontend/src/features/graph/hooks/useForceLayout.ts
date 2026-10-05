import { useEffect, useRef } from "react";

import {
  forceCenter,
  forceCollide,
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

const SIM_TICKS = 100;

const NODE_FOOTPRINT = 270;

const COLLIDE_RADIUS = NODE_FOOTPRINT / 2;

const LINK_DISTANCE = NODE_FOOTPRINT;

const CHARGE_STRENGTH = -300;

const CENTER_X = 0;
const CENTER_Y = 0;

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string;
  target: string;
}

export function runForceLayout(
  nodeIds: readonly string[],
  linkPairs: readonly { readonly source: string; readonly target: string }[],
  pinnedPositions: ReadonlyMap<string, GraphPosition>,
): Map<string, GraphPosition> {
  const out = new Map<string, GraphPosition>();
  if (nodeIds.length === 0) {
    return out;
  }

  const simNodes: SimNode[] = nodeIds.map((id) => {
    const pinned = pinnedPositions.get(id);
    if (pinned !== undefined) {
      return { id, x: pinned.x, y: pinned.y, fx: pinned.x, fy: pinned.y };
    }
    return { id };
  });

  const nodeIdSet = new Set(nodeIds);
  const simLinks: SimLink[] = linkPairs
    .filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))
    .map((l) => ({ source: l.source, target: l.target }));

  const simulation: Simulation<SimNode, SimLink> = forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(LINK_DISTANCE),
    )
    .force("charge", forceManyBody<SimNode>().strength(CHARGE_STRENGTH))
    .force("collide", forceCollide<SimNode>(COLLIDE_RADIUS))
    .force("center", forceCenter<SimNode>(CENTER_X, CENTER_Y))
    .stop();

  simulation.tick(SIM_TICKS);

  for (const n of simNodes) {
    out.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
  }

  return out;
}

export function useForceLayout(): ReadonlyMap<string, GraphPosition> {
  const nodes = useGraphStore((s) => s.nodes);
  const links = useGraphStore((s) => s.links);
  const positions = useGraphStore((s) => s.positions);
  const layoutNonce = useGraphStore((s) => s.layoutNonce);
  const layoutAlgorithm = useGraphStore((s) => s.layoutAlgorithm);

  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const prevNonceRef = useRef(layoutNonce);

  useEffect(() => {
    const isReset = prevNonceRef.current !== layoutNonce;
    prevNonceRef.current = layoutNonce;

    const nodeIds = Array.from(nodes.keys());
    const linkPairs = Array.from(links.values(), (l) => ({
      source: l.source,
      target: l.target,
    }));
    const pinned = isReset
      ? new Map<string, GraphPosition>()
      : positionsRef.current;

    if (nodeIds.length === 0) {
      if (useGraphStore.getState().positions.size === 0) return;
      useGraphStore.setState({ positions: new Map<string, GraphPosition>() });
      return;
    }

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

    useGraphStore.setState({ positions: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, layoutNonce]);

  return positions;
}
