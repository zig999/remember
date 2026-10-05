import { create } from "zustand";
import type {
  GraphDelta,
  GraphLinkData,
  GraphNodeData,
  GraphStatus,
} from "../types";

export interface GraphPosition {
  readonly x: number;
  readonly y: number;
}

export type GraphLayoutAlgorithm = "force" | "tree" | "radial";

export interface GraphState {
  nodes: Map<string, GraphNodeData>;
  links: Map<string, GraphLinkData>;
  positions: Map<string, GraphPosition>;
  revealQueue: string[];
  revealedIds: Set<string>;
  status: GraphStatus;
  errorMessage: string | undefined;
  receivedDeltaThisTurn: boolean;
  userPinned: Set<string>;
  layoutNonce: number;
  layoutAlgorithm: GraphLayoutAlgorithm;

  addNodes: (delta: GraphDelta) => void;
  replaceNodes: (delta: GraphDelta) => void;
  removeNodes: (ids: readonly string[]) => void;
  setNodePosition: (id: string, position: GraphPosition) => void;
  resetLayout: () => void;
  setLayoutAlgorithm: (algo: GraphLayoutAlgorithm) => void;
  clear: () => void;
  setStatus: (status: GraphStatus, errorMessage?: string) => void;
  dequeueReveal: () => string | undefined;
  settleTurn: (frame: "done" | "error") => void;

  getSnapshot: () => GraphSnapshotV2;

  hydrate: (snapshot: GraphSnapshotV1 | GraphSnapshotV2) => void;
}

export interface GraphSnapshotV1 {
  version: 1;
  nodes: GraphNodeData[];
  links: GraphLinkData[];
  positions: Record<string, { x: number; y: number }>;
  user_pinned: string[];
}

export interface GraphSnapshotV2 {
  version: 2;
  nodes: GraphNodeData[];
  links: GraphLinkData[];
  positions: Record<string, { x: number; y: number }>;
  user_pinned: string[];
  layout_algorithm: GraphLayoutAlgorithm;
}

function graphToolInFlight(status: GraphStatus): boolean {
  return status === "loading" || status === "revealing";
}

function makeInitialState(): Pick<
  GraphState,
  | "nodes"
  | "links"
  | "positions"
  | "revealQueue"
  | "revealedIds"
  | "status"
  | "errorMessage"
  | "receivedDeltaThisTurn"
  | "userPinned"
  | "layoutNonce"
  | "layoutAlgorithm"
> {
  return {
    nodes: new Map<string, GraphNodeData>(),
    links: new Map<string, GraphLinkData>(),
    positions: new Map<string, GraphPosition>(),
    revealQueue: [],
    revealedIds: new Set<string>(),
    status: "empty",
    errorMessage: undefined,
    receivedDeltaThisTurn: false,
    userPinned: new Set<string>(),
    layoutNonce: 0,
    layoutAlgorithm: "force",
  };
}

export const useGraphStore = create<GraphState>((set, get) => ({
  ...makeInitialState(),

  addNodes: (delta) => {
    set((state) => {
      const nextNodes = new Map(state.nodes);
      const nextLinks = new Map(state.links);
      const nextRevealQueue = state.revealQueue.slice();

      for (const node of delta.nodes) {
        if (!state.revealedIds.has(node.id) && !nextNodes.has(node.id)) {
          nextRevealQueue.push(node.id);
        }
        nextNodes.set(node.id, node);
      }

      for (const link of delta.links) {
        nextLinks.set(link.id, link);
      }

      return {
        nodes: nextNodes,
        links: nextLinks,
        revealQueue: nextRevealQueue,
        receivedDeltaThisTurn: true,
      };
    });
  },

  replaceNodes: (delta) => {
    set(() => {
      const nextNodes = new Map<string, GraphNodeData>();
      const nextLinks = new Map<string, GraphLinkData>();
      const revealQueue: string[] = [];

      for (const node of delta.nodes) {
        nextNodes.set(node.id, node);
        revealQueue.push(node.id);
      }
      for (const link of delta.links) {
        if (nextNodes.has(link.source) && nextNodes.has(link.target)) {
          nextLinks.set(link.id, link);
        }
      }

      return {
        nodes: nextNodes,
        links: nextLinks,
        positions: new Map<string, GraphPosition>(),
        userPinned: new Set<string>(),
        revealedIds: new Set<string>(),
        revealQueue,
        receivedDeltaThisTurn: true,
      };
    });
  },

  removeNodes: (ids) => {
    if (ids.length === 0) return;

    set((state) => {
      const idSet = new Set(ids);
      const nextNodes = new Map(state.nodes);
      const nextLinks = new Map(state.links);
      const nextPositions = new Map(state.positions);
      const nextRevealedIds = new Set(state.revealedIds);
      const nextUserPinned = new Set(state.userPinned);

      for (const id of idSet) {
        nextNodes.delete(id);
        nextPositions.delete(id);
        nextRevealedIds.delete(id);
        nextUserPinned.delete(id);
      }

      for (const [linkId, link] of state.links) {
        if (idSet.has(link.source) || idSet.has(link.target)) {
          nextLinks.delete(linkId);
        }
      }

      const nextRevealQueue = state.revealQueue.filter((id) => !idSet.has(id));

      void nextLinks;

      return {
        nodes: nextNodes,
        links: nextLinks,
        positions: nextPositions,
        revealedIds: nextRevealedIds,
        revealQueue: nextRevealQueue,
        userPinned: nextUserPinned,
      };
    });
  },

  setNodePosition: (id, position) => {
    set((state) => {
      if (!state.nodes.has(id)) return {};
      const nextPositions = new Map(state.positions);
      nextPositions.set(id, position);
      const nextUserPinned = new Set(state.userPinned);
      nextUserPinned.add(id);
      return { positions: nextPositions, userPinned: nextUserPinned };
    });
  },

  resetLayout: () => {
    set((state) => ({
      userPinned: new Set<string>(),
      layoutNonce: state.layoutNonce + 1,
    }));
  },

  setLayoutAlgorithm: (algo) => {
    set((state) => {
      if (state.layoutAlgorithm === algo) return {};
      return {
        layoutAlgorithm: algo,
        userPinned: new Set<string>(),
        layoutNonce: state.layoutNonce + 1,
      };
    });
  },

  clear: () => {
    set(makeInitialState());
  },

  setStatus: (status, errorMessage) => {
    set({
      status,
      errorMessage: status === "error" ? errorMessage : undefined,
    });
  },

  dequeueReveal: () => {
    const queue = get().revealQueue;
    if (queue.length === 0) return undefined;

    const [head, ...rest] = queue;
    set({ revealQueue: rest });
    return head;
  },

  settleTurn: (frame) => {
    const { status, receivedDeltaThisTurn } = get();

    if (frame === "done") {
      if (receivedDeltaThisTurn) {
        set({ status: "ready", errorMessage: undefined, receivedDeltaThisTurn: false });
      } else {
        set({ receivedDeltaThisTurn: false });
      }
      return;
    }

    if (graphToolInFlight(status)) {
      set({ status: "error", receivedDeltaThisTurn: false });
    } else {
      set({ receivedDeltaThisTurn: false });
    }
  },

  getSnapshot: () => {
    const { nodes, links, positions, userPinned, layoutAlgorithm } = get();
    const posObj: Record<string, { x: number; y: number }> = {};
    for (const [id, pos] of positions) {
      posObj[id] = { x: pos.x, y: pos.y };
    }
    return {
      version: 2 as const,
      nodes: Array.from(nodes.values()),
      links: Array.from(links.values()),
      positions: posObj,
      user_pinned: Array.from(userPinned),
      layout_algorithm: layoutAlgorithm,
    };
  },

  hydrate: (snapshot) => {
    const nextNodes = new Map<string, GraphNodeData>();
    const nextLinks = new Map<string, GraphLinkData>();
    const nextPositions = new Map<string, GraphPosition>();
    const allNodeIds: string[] = [];

    for (const node of snapshot.nodes) {
      nextNodes.set(node.id, node);
      allNodeIds.push(node.id);
    }
    for (const link of snapshot.links) {
      nextLinks.set(link.id, link);
    }
    for (const [id, pos] of Object.entries(snapshot.positions)) {
      nextPositions.set(id, { x: pos.x, y: pos.y });
    }

    const layoutAlgorithm: GraphLayoutAlgorithm =
      snapshot.version === 2 && "layout_algorithm" in snapshot
        ? snapshot.layout_algorithm
        : "force";

    set({
      nodes: nextNodes,
      links: nextLinks,
      positions: nextPositions,
      userPinned: new Set<string>(snapshot.user_pinned),
      revealedIds: new Set<string>(allNodeIds),
      revealQueue: [],
      status: "ready",
      receivedDeltaThisTurn: false,
      errorMessage: undefined,
      layoutAlgorithm,
    });
  },
}));
