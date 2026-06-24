/**
 * useGraphReveal — staggered reveal queue consumer (TC-FE-09).
 *
 * Why these tests matter (per u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - AC-F.14 (one-by-one over time) — a regression that batches the queue
 *    under normal motion would make the "node pop-in" animation invisible:
 *    all nodes would appear in the same render, breaking the design
 *    invariant that the user can SEE memory crystallize. The "K=3 nodes
 *    reveal across ticks" test pins this.
 *  - AC-F.16 (prefers-reduced-motion) — WCAG 2.2 AA. If the matchMedia
 *    short-circuit ever regresses, users with vestibular disorders would
 *    sit through the full stagger they explicitly asked us not to run.
 *  - AC-F.15 (edge endpoint rule) — pinned at the consumer (GraphCanvas
 *    filter), but the hook is the source of truth for `revealedIds`. The
 *    "revealOne adds to Set" test guarantees the Set is the contract the
 *    consumer can trust.
 *  - Status transition `revealing → ready` — drives the overlay teardown.
 *    A regression here would leave the "Buscando na memória…" overlay
 *    visible even after the graph stabilized. The "queue drains → status
 *    transitions" tests pin every branch.
 *  - AC-E.3 (Stop during reveal) — cleanup must clear timers AND leave
 *    already-revealed ids alone. The unmount test pins this.
 *  - **No `@xyflow/react` import** — the hook must remain UI-framework-
 *    agnostic so the timing logic can be unit-tested without React Flow
 *    and so the cadence stays decoupled from the canvas. Structural test
 *    pins this.
 *
 * Strategy:
 *  - Drive the hook through a tiny `Host` component (`createRoot` + `act`
 *    + `useImperativeHandle`) that exposes the latest `revealedIds` —
 *    same pattern as `useForceLayout.spec.ts` (no @testing-library/react
 *    in this repo).
 *  - `vi.useFakeTimers()` to advance the stagger deterministically.
 *  - Mock `window.matchMedia` per test for the reduced-motion branch —
 *    jsdom only ships a no-op default.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createRef, useImperativeHandle, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as React from "react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import type {
  GraphDelta,
  GraphLinkData,
  GraphNodeData,
} from "@/features/graph/types";
import { useGraphStore } from "../../state/graph-store";
import {
  useGraphReveal,
  DEFAULT_REVEAL_STAGGER_MS,
} from "../useGraphReveal";

/* -------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function makeNode(id: string): GraphNodeData {
  return { id, type: "concept", label: `Node ${id}`, state: "accepted" };
}

function makeLink(id: string, source: string, target: string): GraphLinkData {
  return {
    id,
    source,
    target,
    label: "related_to",
    linkTypeLabel: "relacionado a",
    isTemporal: false,
  };
}

function makeDelta(
  nodes: GraphNodeData[],
  links: GraphLinkData[] = [],
): GraphDelta {
  return { sourceTool: "list_nodes", nodes, links };
}

interface Harness {
  /** Live `revealedIds` Set returned by the hook. */
  getRevealedIds: () => ReadonlySet<string>;
}

/** Inner host — calls the hook + exposes its return via an imperative handle. */
function Host({
  refObj,
  staggerMs,
}: {
  refObj: RefObject<Harness | null>;
  staggerMs?: number;
}): React.ReactElement {
  const revealedIds = useGraphReveal(staggerMs);
  useImperativeHandle(
    refObj,
    () => ({ getRevealedIds: () => revealedIds }),
    [revealedIds],
  );
  return React.createElement("div");
}

/**
 * Set `window.matchMedia` to a deterministic mock that returns `matches`
 * for the `(prefers-reduced-motion: reduce)` query.
 *
 * Returns a restore function so each test can reset the global to whatever
 * the previous test left in place.
 */
function mockReducedMotion(matches: boolean): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => {
    const result = {
      matches: query.includes("reduce") ? matches : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
    return result as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

/* -------------------------------------------------------------------------
 * Test rig — fresh store + DOM root per test
 * ------------------------------------------------------------------------- */

let container: HTMLDivElement;
let root: Root;
let restoreMatchMedia: (() => void) | null = null;

beforeEach(() => {
  // Always start from a clean store — leak from a prior test would skew
  // queue state.
  useGraphStore.getState().clear();
  // Fake timers for deterministic stagger control.
  vi.useFakeTimers();
  // Default to "no preference" — explicit reduced-motion tests opt in.
  restoreMatchMedia = mockReducedMotion(false);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.useRealTimers();
  if (restoreMatchMedia) restoreMatchMedia();
  restoreMatchMedia = null;
  useGraphStore.getState().clear();
});

function mount(staggerMs?: number): RefObject<Harness | null> {
  const ref = createRef<Harness | null>();
  act(() => {
    root.render(
      React.createElement(Host, { refObj: ref, ...(staggerMs !== undefined ? { staggerMs } : {}) }),
    );
  });
  return ref;
}

/* -------------------------------------------------------------------------
 * AC-F.14 — staggered reveal (one-by-one over time)
 * ------------------------------------------------------------------------- */

describe("useGraphReveal — staggered reveal (AC-F.14)", () => {
  it("reveals queued ids one-by-one across stagger ticks (K=3)", () => {
    // Seed the store with 3 queued ids BEFORE mounting so the hook's
    // first effect sees a non-empty queue.
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b"), makeNode("c")]),
    );
    expect(useGraphStore.getState().revealQueue).toEqual(["a", "b", "c"]);

    const ref = mount(50);

    // No ticks have advanced — nothing should be revealed yet.
    expect(ref.current!.getRevealedIds().size).toBe(0);

    // Tick 1 — first id moves from queue → revealedIds.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(ref.current!.getRevealedIds().has("a")).toBe(true);
    expect(ref.current!.getRevealedIds().size).toBe(1);
    expect(useGraphStore.getState().revealQueue).toEqual(["b", "c"]);

    // Tick 2 — second id.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(ref.current!.getRevealedIds().has("b")).toBe(true);
    expect(ref.current!.getRevealedIds().size).toBe(2);

    // Tick 3 — last id.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(ref.current!.getRevealedIds().has("c")).toBe(true);
    expect(ref.current!.getRevealedIds().size).toBe(3);
    // Queue drained.
    expect(useGraphStore.getState().revealQueue).toEqual([]);
  });

  it("uses DEFAULT_REVEAL_STAGGER_MS (90) when staggerMs is not provided", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("a"), makeNode("b")]));
    const ref = mount();

    // After 89ms — not yet revealed.
    act(() => {
      vi.advanceTimersByTime(DEFAULT_REVEAL_STAGGER_MS - 1);
    });
    expect(ref.current!.getRevealedIds().size).toBe(0);

    // After the 90th ms — first reveal lands.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(ref.current!.getRevealedIds().has("a")).toBe(true);
  });

  it("reveals newly-enqueued ids when addNodes runs mid-flight", () => {
    // Seed one node — kicks off the chain.
    useGraphStore.getState().addNodes(makeDelta([makeNode("a")]));
    const ref = mount(50);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(ref.current!.getRevealedIds().has("a")).toBe(true);
    expect(ref.current!.getRevealedIds().size).toBe(1);

    // Mid-flight: another delta arrives.
    act(() => {
      useGraphStore.getState().addNodes(makeDelta([makeNode("b"), makeNode("c")]));
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(ref.current!.getRevealedIds().has("b")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(ref.current!.getRevealedIds().has("c")).toBe(true);
    expect(ref.current!.getRevealedIds().size).toBe(3);
  });

  it("does not re-reveal an id already in revealedIds (Set semantics)", () => {
    // Pre-populate revealedIds with 'a' via setState so the hook should
    // not re-add it. Then enqueue 'a' again (the store guard usually
    // prevents this, but the hook must also be idempotent).
    useGraphStore.setState({ revealedIds: new Set(["a"]) });
    useGraphStore.setState({ revealQueue: ["a"] });

    const ref = mount(50);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    // Still exactly one id — no duplicate, no thrown error.
    expect(ref.current!.getRevealedIds().size).toBe(1);
    expect(ref.current!.getRevealedIds().has("a")).toBe(true);
  });
});

/* -------------------------------------------------------------------------
 * AC-F.16 — prefers-reduced-motion (instant batch, no stagger)
 * ------------------------------------------------------------------------- */

describe("useGraphReveal — prefers-reduced-motion (AC-F.16)", () => {
  beforeEach(() => {
    if (restoreMatchMedia) restoreMatchMedia();
    restoreMatchMedia = mockReducedMotion(true);
  });

  it("reveals all queued ids in one batch with no stagger", () => {
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b"), makeNode("c"), makeNode("d")]),
    );

    const ref = mount(90);
    // No timers advanced — the reduced-motion branch is synchronous on
    // first effect run.
    expect(ref.current!.getRevealedIds().size).toBe(4);
    expect(ref.current!.getRevealedIds().has("a")).toBe(true);
    expect(ref.current!.getRevealedIds().has("d")).toBe(true);
    // Queue cleared.
    expect(useGraphStore.getState().revealQueue).toEqual([]);
  });

  it("schedules no setTimeout when reduced-motion is on (no stagger)", () => {
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b")]),
    );

    mount(50);

    // Even an enormous timer advance should have no further effect: the
    // queue was drained instantly, so there is nothing to schedule.
    const beforeRevealed = useGraphStore.getState().revealedIds;
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    const afterRevealed = useGraphStore.getState().revealedIds;
    // No new reveals — both must reference the same id set.
    expect(afterRevealed.size).toBe(beforeRevealed.size);
  });

  it("transitions status revealing → ready in the same batch (reduced-motion)", () => {
    useGraphStore.setState({ status: "revealing" });
    useGraphStore.getState().addNodes(makeDelta([makeNode("a"), makeNode("b")]));
    expect(useGraphStore.getState().status).toBe("revealing");

    mount(50);

    // The batch drain ALSO triggers the status transition.
    expect(useGraphStore.getState().status).toBe("ready");
  });
});

/* -------------------------------------------------------------------------
 * Status transition — revealing → ready when queue empties
 * ------------------------------------------------------------------------- */

describe("useGraphReveal — status transition revealing → ready", () => {
  it("transitions status to 'ready' when the queue drains and status was 'revealing'", () => {
    useGraphStore.setState({ status: "revealing" });
    useGraphStore.getState().addNodes(makeDelta([makeNode("a"), makeNode("b")]));

    mount(50);

    // Drain by advancing the timers through both reveals.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(useGraphStore.getState().revealQueue).toEqual([]);
    expect(useGraphStore.getState().status).toBe("ready");
  });

  it("does NOT transition status if current status is not 'revealing'", () => {
    // Status starts as "loading" — the hook must not promote it to "ready"
    // just because the queue drained (only "revealing" → "ready" is owned
    // by the hook; other transitions are the dispatcher's job).
    useGraphStore.setState({ status: "loading" });
    useGraphStore.getState().addNodes(makeDelta([makeNode("a")]));

    mount(50);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(useGraphStore.getState().revealQueue).toEqual([]);
    expect(useGraphStore.getState().status).toBe("loading");
  });

  it("does NOT touch status when the queue is empty on mount AND status is not 'revealing'", () => {
    useGraphStore.setState({ status: "empty" });
    mount(50);
    expect(useGraphStore.getState().status).toBe("empty");
  });

  it("transitions status to 'ready' when the queue is already empty on mount AND status is 'revealing'", () => {
    // Edge case: dispatcher set status='revealing' but the delta carried
    // ZERO new ids (e.g. all re-affirmations). The hook should still
    // close the loop.
    useGraphStore.setState({ status: "revealing" });
    useGraphStore.setState({ revealQueue: [] });
    mount(50);
    expect(useGraphStore.getState().status).toBe("ready");
  });
});

/* -------------------------------------------------------------------------
 * AC-E.3 — cleanup on unmount (Stop during revealing)
 * ------------------------------------------------------------------------- */

describe("useGraphReveal — cleanup (AC-E.3)", () => {
  it("clears the pending timer on unmount — UI does not freeze", () => {
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b"), makeNode("c")]),
    );

    mount(50);
    // First reveal lands.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(useGraphStore.getState().revealedIds.has("a")).toBe(true);

    // Unmount mid-flight.
    act(() => {
      root.unmount();
    });

    // Advancing timers after unmount must not throw and must not reveal
    // any further ids — the timer chain has been cancelled.
    const revealedBefore = useGraphStore.getState().revealedIds;
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    const revealedAfter = useGraphStore.getState().revealedIds;
    expect(revealedAfter.size).toBe(revealedBefore.size);
    // The unrevealed ids are still queued — a re-mount could resume.
    expect(useGraphStore.getState().revealQueue.length).toBeGreaterThan(0);
  });

  it("preserves already-revealed ids on unmount (AC-E.3 explicit)", () => {
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b"), makeNode("c")]),
    );

    mount(50);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(useGraphStore.getState().revealedIds.size).toBe(2);

    act(() => {
      root.unmount();
    });

    // The two ids already revealed must remain in the store — they are
    // "things the user already saw" and AC-E.3 promises they stay.
    expect(useGraphStore.getState().revealedIds.has("a")).toBe(true);
    expect(useGraphStore.getState().revealedIds.has("b")).toBe(true);
  });
});

/* -------------------------------------------------------------------------
 * Structural — no @xyflow/react import; hook signature
 * ------------------------------------------------------------------------- */

describe("useGraphReveal — structural constraints", () => {
  it("returns the live revealedIds Set from the store", () => {
    useGraphStore.setState({ revealedIds: new Set(["seed"]) });
    const ref = mount(50);
    expect(ref.current!.getRevealedIds().has("seed")).toBe(true);
  });

  it("the hook file does not import @xyflow/react (UI-framework-agnostic)", () => {
    // Pure timing + store logic — must not couple to React Flow.
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const sourcePath = resolve(__dirname, "..", "useGraphReveal.ts");
    const source = readFileSync(sourcePath, "utf8");
    expect(source).not.toMatch(/from\s+["']@xyflow\/react["']/);
    expect(source).not.toMatch(/require\(\s*["']@xyflow\/react["']\s*\)/);
  });

  it("the hook file does not import framer-motion (timing logic only)", () => {
    // The hook controls WHEN ids enter revealedIds — the visual animation
    // is the consumer's responsibility (motion.div in GraphNodeAdapter).
    // Pinning this keeps the hook pure (testable without WAAPI / animate).
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const sourcePath = resolve(__dirname, "..", "useGraphReveal.ts");
    const source = readFileSync(sourcePath, "utf8");
    expect(source).not.toMatch(/from\s+["']framer-motion["']/);
  });
});
