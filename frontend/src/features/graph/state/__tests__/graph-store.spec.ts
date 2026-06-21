/**
 * useGraphStore — Zustand v5 store behavior (TC-FE-02).
 *
 * Why these tests matter (per u-fe-standards "Tests verify intent, not just
 * behavior"):
 *  - I-7 is the centerpiece of the chat ↔ graph contract. A regression in
 *    `settleTurn` (e.g. flipping to `ready` on a chat-only `done`) would
 *    silently destroy the empty-state placeholder users see when they
 *    have not yet asked anything graph-shaped. The settleTurn matrix
 *    tests below pin every quadrant of the I-7 truth table.
 *  - Re-affirmation MUST consolidate, never duplicate (project
 *    principle, §6.4). If a re-affirmed id ever re-enters `revealQueue`,
 *    the reveal animation would fire twice for the same node, producing
 *    a visible flicker. The "no double-enqueue" tests pin this.
 *  - `removeNodes` must drop orphaned links — otherwise React Flow would
 *    render a stroke into nothing. The orphan test pins this.
 *  - `clear()` is called on conversation switch — leaking the prior
 *    conversation's nodes into a new one would be a privacy / coherence
 *    bug. The "fully empties" test pins this.
 */
import { beforeEach, describe, expect, it } from "vitest";

import type {
  GraphDelta,
  GraphLinkData,
  GraphNodeData,
} from "@/features/graph/types";
import { useGraphStore } from "../graph-store";

/** Helper — build a minimal GraphNodeData with sane defaults. */
function makeNode(id: string, label = `Node ${id}`): GraphNodeData {
  return {
    id,
    type: "concept",
    label,
    state: "accepted",
  };
}

/** Helper — build a minimal GraphLinkData between two node ids. */
function makeLink(
  id: string,
  source: string,
  target: string,
  isTemporal = false,
): GraphLinkData {
  return {
    id,
    source,
    target,
    label: "related_to",
    isTemporal,
  };
}

/** Helper — assemble a `GraphDelta` from nodes/links. */
function makeDelta(
  nodes: GraphNodeData[],
  links: GraphLinkData[] = [],
  sourceTool = "list_nodes",
): GraphDelta {
  return { sourceTool, nodes, links };
}

beforeEach(() => {
  // Reset the singleton between tests — `clear()` is the public reset
  // contract, so we use it to keep test code aligned with production code.
  useGraphStore.getState().clear();
});

describe("useGraphStore — initial state", () => {
  it("starts with empty maps, empty queue, status='empty'", () => {
    const s = useGraphStore.getState();
    expect(s.nodes.size).toBe(0);
    expect(s.links.size).toBe(0);
    expect(s.positions.size).toBe(0);
    expect(s.revealQueue).toEqual([]);
    expect(s.revealedIds.size).toBe(0);
    expect(s.status).toBe("empty");
    expect(s.errorMessage).toBeUndefined();
    expect(s.receivedDeltaThisTurn).toBe(false);
  });

  it("GraphStatus initial value is NOT 'idle' (I-4 — exactly 5 values)", () => {
    // Pins I-4 — see also graph/types.spec.ts. A regression here means
    // someone re-introduced the empty/idle ambiguity removed by the plan.
    expect(useGraphStore.getState().status).not.toBe("idle");
  });
});

describe("useGraphStore.addNodes — AC-F.1 (new ids enter queue)", () => {
  it("adds new nodes/links and enqueues exactly the new ids", () => {
    const delta = makeDelta(
      [makeNode("n1"), makeNode("n2")],
      [makeLink("l1", "n1", "n2")],
    );

    useGraphStore.getState().addNodes(delta);

    const s = useGraphStore.getState();
    expect(s.nodes.size).toBe(2);
    expect(s.links.size).toBe(1);
    expect(s.revealQueue).toEqual(["n1", "n2"]);
  });

  it("sets receivedDeltaThisTurn=true (I-7 — any delta arms 'ready')", () => {
    expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(false);
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(true);
  });

  it("preserves insertion order in the reveal queue", () => {
    // Order matters because `useGraphReveal` animates ids in queue order
    // — a Set-backed queue would lose this ordering silently.
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("a"), makeNode("b"), makeNode("c")]),
    );
    expect(useGraphStore.getState().revealQueue).toEqual(["a", "b", "c"]);
  });

  it("deduplicates ids WITHIN a single delta (no double-enqueue)", () => {
    // The wire payload should never contain duplicates, but if it ever
    // does (BFF bug, replay), a duplicate enqueue would animate the same
    // node twice — visible flicker.
    useGraphStore.getState().addNodes(
      makeDelta([makeNode("n1"), makeNode("n1", "alt label")]),
    );
    expect(useGraphStore.getState().revealQueue).toEqual(["n1"]);
    expect(useGraphStore.getState().nodes.size).toBe(1);
  });
});

describe("useGraphStore.addNodes — AC-F.2 (re-affirmation consolidates)", () => {
  it("does NOT duplicate an existing id in nodes Map", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1", "first")]));
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1", "second")]));

    const s = useGraphStore.getState();
    expect(s.nodes.size).toBe(1);
    // Merge keeps the latest payload — re-affirmation updates the
    // canonical_name / state in place.
    expect(s.nodes.get("n1")?.label).toBe("second");
  });

  it("does NOT re-enqueue an already-queued id", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    expect(useGraphStore.getState().revealQueue).toEqual(["n1"]);

    useGraphStore.getState().addNodes(makeDelta([makeNode("n1", "updated")]));
    expect(useGraphStore.getState().revealQueue).toEqual(["n1"]);
  });

  it("does NOT re-enqueue an already-revealed id", () => {
    // Simulate the reveal pipeline: enqueue → dequeue → mark revealed.
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    const head = useGraphStore.getState().dequeueReveal();
    expect(head).toBe("n1");
    // Manually move it to revealedIds — production code does this in
    // `useGraphReveal` after the entrance animation completes.
    useGraphStore.setState((s) => {
      const next = new Set(s.revealedIds);
      next.add("n1");
      return { revealedIds: next };
    });

    // Re-affirm — the id is already in revealedIds, so it must NOT
    // re-enter the queue.
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    expect(useGraphStore.getState().revealQueue).toEqual([]);
  });
});

describe("useGraphStore.removeNodes — AC-F.3 (orphan link cleanup)", () => {
  it("removes nodes and all links touching them", () => {
    useGraphStore.getState().addNodes(
      makeDelta(
        [makeNode("a"), makeNode("b"), makeNode("c")],
        [
          makeLink("ab", "a", "b"),
          makeLink("bc", "b", "c"),
          makeLink("ac", "a", "c"),
        ],
      ),
    );

    useGraphStore.getState().removeNodes(["b"]);

    const s = useGraphStore.getState();
    expect(s.nodes.has("b")).toBe(false);
    expect(s.nodes.size).toBe(2);
    // Both links that referenced "b" must be gone; "ac" survives.
    expect(s.links.has("ab")).toBe(false);
    expect(s.links.has("bc")).toBe(false);
    expect(s.links.has("ac")).toBe(true);
  });

  it("removes nodes when they appear as link source OR target", () => {
    // Pin the OR semantic — a node id in EITHER endpoint is enough to
    // orphan the link.
    useGraphStore.getState().addNodes(
      makeDelta(
        [makeNode("a"), makeNode("b")],
        [makeLink("ab", "a", "b"), makeLink("ba", "b", "a")],
      ),
    );

    useGraphStore.getState().removeNodes(["a"]);

    expect(useGraphStore.getState().links.size).toBe(0);
  });

  it("drops position entries for removed ids", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1"), makeNode("n2")]));
    // Simulate force-layout writing positions.
    useGraphStore.setState((s) => {
      const next = new Map(s.positions);
      next.set("n1", { x: 10, y: 20 });
      next.set("n2", { x: 30, y: 40 });
      return { positions: next };
    });

    useGraphStore.getState().removeNodes(["n1"]);

    const positions = useGraphStore.getState().positions;
    expect(positions.has("n1")).toBe(false);
    expect(positions.has("n2")).toBe(true);
  });

  it("drops queued reveal of a removed id", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1"), makeNode("n2")]));
    expect(useGraphStore.getState().revealQueue).toEqual(["n1", "n2"]);

    useGraphStore.getState().removeNodes(["n1"]);

    expect(useGraphStore.getState().revealQueue).toEqual(["n2"]);
  });

  it("is a no-op when ids list is empty", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    const before = useGraphStore.getState();
    useGraphStore.getState().removeNodes([]);
    const after = useGraphStore.getState();
    // Reference equality holds because no `set()` ran.
    expect(after.nodes).toBe(before.nodes);
    expect(after.links).toBe(before.links);
  });

  it("ignores ids that do not exist in the store", () => {
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    useGraphStore.getState().removeNodes(["ghost", "n1"]);
    expect(useGraphStore.getState().nodes.size).toBe(0);
  });
});

describe("useGraphStore.clear — AC-F.4 (full reset)", () => {
  it("empties every collection and restores status='empty'", () => {
    // Populate everything.
    useGraphStore.getState().addNodes(
      makeDelta(
        [makeNode("a"), makeNode("b")],
        [makeLink("ab", "a", "b")],
      ),
    );
    useGraphStore.getState().setStatus("revealing");
    useGraphStore.setState((s) => {
      const next = new Map(s.positions);
      next.set("a", { x: 0, y: 0 });
      return { positions: next };
    });

    useGraphStore.getState().clear();

    const s = useGraphStore.getState();
    expect(s.nodes.size).toBe(0);
    expect(s.links.size).toBe(0);
    expect(s.positions.size).toBe(0);
    expect(s.revealQueue).toEqual([]);
    expect(s.revealedIds.size).toBe(0);
    expect(s.status).toBe("empty");
    expect(s.errorMessage).toBeUndefined();
    expect(s.receivedDeltaThisTurn).toBe(false);
  });

  it("constructs fresh collection instances (no aliasing)", () => {
    const before = useGraphStore.getState().nodes;
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    useGraphStore.getState().clear();
    const after = useGraphStore.getState().nodes;
    // Distinct Map instances — otherwise a stale reference from a
    // previous render would still hold removed nodes.
    expect(after).not.toBe(before);
    expect(after.size).toBe(0);
  });
});

describe("useGraphStore.setStatus", () => {
  it("updates status and clears errorMessage on non-error transitions", () => {
    useGraphStore.getState().setStatus("error", "boom");
    expect(useGraphStore.getState().status).toBe("error");
    expect(useGraphStore.getState().errorMessage).toBe("boom");

    useGraphStore.getState().setStatus("loading");
    expect(useGraphStore.getState().status).toBe("loading");
    // Non-error transition wipes the stale blurb — otherwise the
    // GraphStatusOverlay would carry it forward.
    expect(useGraphStore.getState().errorMessage).toBeUndefined();
  });

  it("stores errorMessage when transitioning to 'error'", () => {
    useGraphStore.getState().setStatus("error", "network down");
    expect(useGraphStore.getState().errorMessage).toBe("network down");
  });
});

describe("useGraphStore.dequeueReveal", () => {
  it("returns the first queued id and removes it (shift semantics)", () => {
    useGraphStore
      .getState()
      .addNodes(makeDelta([makeNode("a"), makeNode("b"), makeNode("c")]));

    expect(useGraphStore.getState().dequeueReveal()).toBe("a");
    expect(useGraphStore.getState().revealQueue).toEqual(["b", "c"]);

    expect(useGraphStore.getState().dequeueReveal()).toBe("b");
    expect(useGraphStore.getState().revealQueue).toEqual(["c"]);
  });

  it("returns undefined when the queue is empty", () => {
    expect(useGraphStore.getState().dequeueReveal()).toBeUndefined();
    // Calling dequeue on an empty queue is a no-op — the reveal driver
    // must be safe to poll past the end.
    expect(useGraphStore.getState().revealQueue).toEqual([]);
  });

  it("does NOT add the id to revealedIds — the caller owns that step", () => {
    // The reveal pipeline marks an id as revealed AFTER the animation
    // finishes, not at dequeue time. If `dequeueReveal` auto-promoted to
    // `revealedIds`, the animation could land on a node that has been
    // removed mid-flight and we would never know.
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    useGraphStore.getState().dequeueReveal();
    expect(useGraphStore.getState().revealedIds.has("n1")).toBe(false);
  });
});

describe("useGraphStore.settleTurn — AC-F.21 + I-7 matrix", () => {
  describe("frame='done'", () => {
    it("advances status to 'ready' when receivedDeltaThisTurn=true", () => {
      // Graph tool ran, delta landed — `done` advances to ready.
      useGraphStore.getState().setStatus("loading");
      useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
      // Sanity check on the precondition.
      expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(true);

      useGraphStore.getState().settleTurn("done");

      expect(useGraphStore.getState().status).toBe("ready");
    });

    it("leaves status unchanged when receivedDeltaThisTurn=false (AC-F.21)", () => {
      // Chat-only turn: no graph tool, status remains 'empty'.
      // The plan §13.4 wording: "in `done` o GraphStatus permanece `empty`".
      const before = useGraphStore.getState().status;
      expect(before).toBe("empty");

      useGraphStore.getState().settleTurn("done");

      expect(useGraphStore.getState().status).toBe("empty");
    });

    it("leaves a populated graph in its prior status when no delta this turn", () => {
      // Prior turn left status='ready' with a populated graph; this
      // turn was chat-only (no delta). `done` must NOT regress to
      // 'empty' nor leap to 'ready' for the wrong reason — the prior
      // status must survive.
      useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
      useGraphStore.getState().settleTurn("done"); // prior turn settles → ready
      expect(useGraphStore.getState().status).toBe("ready");
      // Now the per-turn flag has been reset; simulate a chat-only
      // turn ending.
      expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(false);

      useGraphStore.getState().settleTurn("done");

      expect(useGraphStore.getState().status).toBe("ready");
    });

    it("resets receivedDeltaThisTurn back to false (turn boundary)", () => {
      useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
      expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(true);

      useGraphStore.getState().settleTurn("done");

      // The next turn starts fresh.
      expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(false);
    });

    it("clears errorMessage when advancing to 'ready'", () => {
      // Prior failure left an error blurb; this turn recovered.
      useGraphStore.getState().setStatus("error", "stale");
      useGraphStore.getState().setStatus("loading"); // tool restarted
      useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
      useGraphStore.getState().settleTurn("done");

      expect(useGraphStore.getState().status).toBe("ready");
      expect(useGraphStore.getState().errorMessage).toBeUndefined();
    });
  });

  describe("frame='error'", () => {
    it("paints the pane red when status was 'loading' (graph tool in flight)", () => {
      useGraphStore.getState().setStatus("loading");

      useGraphStore.getState().settleTurn("error");

      expect(useGraphStore.getState().status).toBe("error");
    });

    it("paints the pane red when status was 'revealing'", () => {
      useGraphStore.getState().setStatus("revealing");

      useGraphStore.getState().settleTurn("error");

      expect(useGraphStore.getState().status).toBe("error");
    });

    it("leaves status unchanged when status was 'empty' (no graph tool — I-7)", () => {
      // The chat side blew up but no graph tool was in flight — the
      // empty pane must stay empty, NOT flip to error.
      useGraphStore.getState().settleTurn("error");

      expect(useGraphStore.getState().status).toBe("empty");
    });

    it("leaves status unchanged when status was 'ready' (prior turn data intact)", () => {
      // User had a populated graph from a prior turn; this turn was
      // chat-only and errored. The previously-rendered subgraph must
      // remain visible — destroying it would surprise the user.
      useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
      useGraphStore.getState().settleTurn("done");
      expect(useGraphStore.getState().status).toBe("ready");

      useGraphStore.getState().settleTurn("error");

      expect(useGraphStore.getState().status).toBe("ready");
    });

    it("resets receivedDeltaThisTurn even when status is unchanged", () => {
      // Even on a no-op error (chat-only failure), the per-turn flag
      // must reset so the next turn starts fresh.
      useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
      // Don't settle — just simulate the error mid-turn.
      useGraphStore.getState().setStatus("ready"); // arbitrary non-in-flight
      // Wait — setStatus to 'ready' simulates a settled prior turn;
      // for THIS test we want to assert the flag is cleared even when
      // settleTurn('error') does nothing else.
      expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(true);

      useGraphStore.getState().settleTurn("error");

      expect(useGraphStore.getState().receivedDeltaThisTurn).toBe(false);
    });
  });
});

describe("useGraphStore — persistence policy", () => {
  // Mirrors the chat-turn store invariant: ephemeral UI state is never
  // persisted. A reload mid-turn would leave us with stale positions
  // pointing at nodes the server no longer returns.
  it("does NOT mirror to localStorage", () => {
    const before = window.localStorage.length;
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    useGraphStore.getState().setStatus("loading");
    expect(window.localStorage.length).toBe(before);
  });

  it("does NOT mirror to sessionStorage", () => {
    const before = window.sessionStorage.length;
    useGraphStore.getState().addNodes(makeDelta([makeNode("n1")]));
    useGraphStore.getState().setStatus("loading");
    expect(window.sessionStorage.length).toBe(before);
  });
});

describe("useGraphStore — single-writer invariant (D2)", () => {
  it("exposes mutating actions only on the store object (no setters on data)", () => {
    // Smoke test: every mutating method is a function. If a future
    // refactor tries to expose `set` on the data fields directly,
    // GraphSpace consumers could mutate state and violate D2 (REQ-6).
    const s = useGraphStore.getState();
    expect(typeof s.addNodes).toBe("function");
    expect(typeof s.removeNodes).toBe("function");
    expect(typeof s.clear).toBe("function");
    expect(typeof s.setStatus).toBe("function");
    expect(typeof s.dequeueReveal).toBe("function");
    expect(typeof s.settleTurn).toBe("function");
  });
});
