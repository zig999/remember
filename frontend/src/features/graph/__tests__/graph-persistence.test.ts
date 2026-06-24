/**
 * Unit tests for graph view persistence (BR-42).
 *
 * TC-002 acceptance criteria:
 *  - hydrate() sets nodes/links/positions/userPinned correctly
 *  - hydrate() sets revealedIds to all node ids
 *  - hydrate() sets status = "ready", revealQueue = []
 *  - getSnapshot() serializes current store state to wire shape
 *  - hook: does NOT save when nodes.size === 0
 *  - hook: calls GET on conversationId mount (restore path)
 *  - hook: calls PUT after node change with non-empty graph
 *
 * Strategy:
 *  - Store tests: direct Zustand store calls — no React needed.
 *  - Hook tests: createRoot + act.
 *    vi.mock path uses BOTH the @/ alias AND the relative path form, so
 *    Vitest matches by resolved id regardless of import form
 *    (same technique as ChatWorkspace.spec.tsx L57-L62).
 */

// @ts-expect-error — global set for test environment only (enables async act)
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createRef, useImperativeHandle } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as React from "react";
import type { GraphNodeData, GraphLinkData } from "../types";
import { useGraphStore } from "../state/graph-store";
import { useGraphPersistence } from "../api/use-graph-persistence";

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted + BOTH alias and relative path forms.
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  http: vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(),
}));

// Mock both alias and relative form so Vitest resolves the right module.
vi.mock("@/lib/http", () => ({
  http: mocks.http,
  EnvelopeError: class EnvelopeError extends Error {
    code: string;
    httpStatus: number;
    constructor(p: { code: string; httpStatus: number; message: string }) {
      super(p.message);
      this.code = p.code;
      this.httpStatus = p.httpStatus;
    }
  },
}));
vi.mock("../../../lib/http", () => ({
  http: mocks.http,
  EnvelopeError: class EnvelopeError extends Error {
    code: string;
    httpStatus: number;
    constructor(p: { code: string; httpStatus: number; message: string }) {
      super(p.message);
      this.code = p.code;
      this.httpStatus = p.httpStatus;
    }
  },
}));

// Same dual-form for authHeader
vi.mock("@/features/chat/api/_request", () => ({
  authHeader: vi.fn().mockReturnValue({}),
}));
vi.mock("../../../features/chat/api/_request", () => ({
  authHeader: vi.fn().mockReturnValue({}),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(id: string): GraphNodeData {
  return {
    id,
    label: `Node ${id}`,
    type: "person",
    status: "accepted",
    is_uncertain: false,
    is_low_confidence: false,
  };
}

function makeLink(id: string, source: string, target: string): GraphLinkData {
  return {
    id,
    source,
    target,
    link_type: "knows",
    is_temporal: false,
    is_uncertain: false,
    is_low_confidence: false,
    status: "accepted",
  };
}

const CONV_ID = "11111111-1111-4111-8111-111111111111";

/** Flush microtasks (Promise callbacks) — does NOT advance fake timers. */
const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve());

// ---------------------------------------------------------------------------
// Store unit tests (no React)
// ---------------------------------------------------------------------------

describe("useGraphStore.hydrate()", () => {
  beforeEach(() => {
    useGraphStore.getState().clear();
  });

  it("sets nodes from snapshot", () => {
    const node1 = makeNode("n1");
    useGraphStore.getState().hydrate({
      version: 1,
      nodes: [node1],
      links: [],
      positions: {},
      user_pinned: [],
    });
    expect(useGraphStore.getState().nodes.get("n1")).toEqual(node1);
  });

  it("sets links from snapshot", () => {
    const node1 = makeNode("n1");
    const node2 = makeNode("n2");
    const link = makeLink("l1", "n1", "n2");
    useGraphStore.getState().hydrate({
      version: 1,
      nodes: [node1, node2],
      links: [link],
      positions: {},
      user_pinned: [],
    });
    expect(useGraphStore.getState().links.get("l1")).toEqual(link);
  });

  it("sets positions from snapshot", () => {
    const node1 = makeNode("n1");
    useGraphStore.getState().hydrate({
      version: 1,
      nodes: [node1],
      links: [],
      positions: { n1: { x: 100, y: 200 } },
      user_pinned: [],
    });
    expect(useGraphStore.getState().positions.get("n1")).toEqual({ x: 100, y: 200 });
  });

  it("sets userPinned from snapshot", () => {
    const node1 = makeNode("n1");
    useGraphStore.getState().hydrate({
      version: 1,
      nodes: [node1],
      links: [],
      positions: {},
      user_pinned: ["n1"],
    });
    expect(useGraphStore.getState().userPinned.has("n1")).toBe(true);
  });

  it("sets revealedIds to ALL node ids (instant reveal)", () => {
    const node1 = makeNode("n1");
    const node2 = makeNode("n2");
    useGraphStore.getState().hydrate({
      version: 1,
      nodes: [node1, node2],
      links: [],
      positions: {},
      user_pinned: [],
    });
    expect(useGraphStore.getState().revealedIds.has("n1")).toBe(true);
    expect(useGraphStore.getState().revealedIds.has("n2")).toBe(true);
  });

  it("sets revealQueue = [], status = ready, receivedDeltaThisTurn = false", () => {
    useGraphStore.getState().hydrate({
      version: 1,
      nodes: [makeNode("n1")],
      links: [],
      positions: {},
      user_pinned: [],
    });
    expect(useGraphStore.getState().revealQueue).toEqual([]);
    expect(useGraphStore.getState().status).toBe("ready");
    expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(false);
  });
});

describe("useGraphStore.getSnapshot()", () => {
  beforeEach(() => {
    useGraphStore.getState().clear();
  });

  it("serializes current store state to wire shape with version 2 (TC-02)", () => {
    useGraphStore.getState().addNodes({ nodes: [makeNode("n1")], links: [] });
    useGraphStore.getState().setNodePosition("n1", { x: 50, y: 60 });

    const snap = useGraphStore.getState().getSnapshot();
    // TC-02 bumped the snapshot schema to v2 with an additive
    // `layout_algorithm` field. The v1 shape (no layout_algorithm) is still
    // accepted by `hydrate` — see graph-store-layout-algorithm.spec.ts.
    expect(snap.version).toBe(2);
    expect(snap.layout_algorithm).toBe("force");
    expect(snap.nodes.some((n: GraphNodeData) => n.id === "n1")).toBe(true);
    expect(snap.positions["n1"]).toEqual({ x: 50, y: 60 });
    expect(snap.user_pinned).toContain("n1");
  });

  it("returns empty collections when store is empty", () => {
    const snap = useGraphStore.getState().getSnapshot();
    expect(snap.nodes).toHaveLength(0);
    expect(snap.links).toHaveLength(0);
    expect(snap.positions).toEqual({});
    expect(snap.user_pinned).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Hook tests via createRoot + act
// ---------------------------------------------------------------------------

type HostRef = { readonly mounted: boolean };

function buildHostComponent(
  conversationId: string | undefined,
  ref: React.Ref<HostRef>,
) {
  return function HostInner() {
    useGraphPersistence(conversationId);
    useImperativeHandle(ref, () => ({ mounted: true }));
    return null;
  };
}

describe("useGraphPersistence hook (via createRoot)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.http.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: false });
    useGraphStore.getState().clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  it("calls GET on mount when conversationId is provided (restore path)", async () => {
    mocks.http.mockResolvedValue(null);
    const ref = createRef<HostRef>();
    const Host = buildHostComponent(CONV_ID, ref);

    act(() => { root.render(React.createElement(Host)); });
    // Flush microtasks — useEffect fires, restoreSnapshot() runs,
    // http() is called, the mock Promise resolves.
    await flushMicrotasks();
    await flushMicrotasks();

    const getCalls = mocks.http.mock.calls.filter(
      ([, init]) => !init?.method || init.method === "GET",
    );
    expect(getCalls.length).toBeGreaterThan(0);
    expect(getCalls[0]![0]).toContain(`/api/v1/conversations/${CONV_ID}/graph`);
  });

  it("does NOT send PUT when nodes.size === 0 (guard a)", async () => {
    mocks.http.mockResolvedValue(null);
    const ref = createRef<HostRef>();
    const Host = buildHostComponent(CONV_ID, ref);

    act(() => { root.render(React.createElement(Host)); });
    await flushMicrotasks();
    await flushMicrotasks();

    // Trigger a store mutation with empty nodes
    act(() => { useGraphStore.getState().clear(); });

    // Advance fake timers past debounce window
    act(() => { vi.advanceTimersByTime(1000); });
    await flushMicrotasks();

    const putCalls = mocks.http.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(putCalls).toHaveLength(0);
  });

  it("calls PUT after addNodes with non-empty graph (debounced)", async () => {
    mocks.http.mockResolvedValue(null);
    const ref = createRef<HostRef>();
    const Host = buildHostComponent(CONV_ID, ref);

    act(() => { root.render(React.createElement(Host)); });
    await flushMicrotasks();
    await flushMicrotasks();

    // Reset calls after the initial GET
    mocks.http.mockClear();

    // Simulate a graph_delta
    act(() => {
      useGraphStore.getState().addNodes({ nodes: [makeNode("n1")], links: [] });
    });

    // Advance past the 800ms debounce
    act(() => { vi.advanceTimersByTime(900); });
    await flushMicrotasks();

    const putCalls = mocks.http.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(putCalls.length).toBeGreaterThan(0);
    expect(putCalls[0]![0]).toContain(`/api/v1/conversations/${CONV_ID}/graph`);
  });
});
