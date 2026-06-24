/**
 * Pure helper tests for CurationPage (TC-04).
 *
 * The CurationPage component itself integrates many side-effects
 * (TanStack Query + Router search) that are clumsy to assert through
 * RTL without standing up a memory router + QueryClient harness. We
 * extract the deep-link + auto-select rule as PURE functions so the
 * behavioural contract — "deep-link wins, else first item, else null"
 * — is locked by a fast unit test.
 *
 * Why each assertion exists (Rule 9):
 *  - The "deep-link points to a real item" branch is the user-visible
 *    contract of `?item=<kind>:<id>` (Sub-flow A step 5). A wrong
 *    implementation would silently auto-select the first item even
 *    when the deep-link matches — defeating link sharing.
 *  - The "deep-link missing → first item" branch is the cold-load
 *    auto-select (UI-08 → UI-01 transition table row 1). Without it
 *    the user would land in UI-01 with no item selected.
 *  - The "queue empty" branch is what drives UI-07.
 *  - The "deep-link present but not found" branch is row 3b: silent
 *    fallback to first item, NO error message.
 */
import { describe, expect, it } from "vitest";
import {
  deriveInitialSelection,
  findItemInQueue,
  indexOfSelected,
  neighbour,
  selectByIndex,
  toSelectedItem,
} from "../curation-page-helpers";
import type { ReviewQueueList } from "../../types";

function buildEntityItem(nodeId: string): ReviewQueueList["items"][number] {
  return {
    kind: "entity_match",
    nodeId,
    nodeType: "Person",
    canonicalName: `Item ${nodeId}`,
    candidates: [],
    createdAt: new Date("2026-06-24T00:00:00Z"),
  };
}

function buildDisputedItem(itemId: string): ReviewQueueList["items"][number] {
  return {
    kind: "disputed",
    itemKind: "link",
    scope: {
      sourceNodeId: "src",
      targetNodeId: "tgt",
      linkType: "owns",
      nodeId: null,
      attributeKey: null,
    },
    sides: [
      {
        itemId,
        value: null,
        targetNodeId: "tgt",
        validFrom: null,
        validTo: null,
        validFromSource: "stated",
        confidence: 0.9,
        status: "disputed",
      },
    ],
    createdAt: new Date("2026-06-24T00:00:00Z"),
  };
}

function buildList(
  items: ReadonlyArray<ReviewQueueList["items"][number]>,
): ReviewQueueList {
  return { total: items.length, limit: 20, offset: 0, items };
}

describe("findItemInQueue", () => {
  it("locates an entity_match item by node id", () => {
    const list = buildList([buildEntityItem("n1"), buildEntityItem("n2")]);
    const hit = findItemInQueue(list, { kind: "entity_match", id: "n2" });
    expect(hit?.kind).toBe("entity_match");
    expect((hit as { nodeId: string }).nodeId).toBe("n2");
  });

  it("locates a disputed item by side itemId", () => {
    const list = buildList([buildDisputedItem("side-a")]);
    const hit = findItemInQueue(list, { kind: "disputed", id: "side-a" });
    expect(hit?.kind).toBe("disputed");
  });

  it("returns null when not found", () => {
    const list = buildList([buildEntityItem("n1")]);
    expect(findItemInQueue(list, { kind: "entity_match", id: "miss" })).toBeNull();
  });

  it("returns null on undefined list (queue still loading)", () => {
    expect(findItemInQueue(undefined, { kind: "entity_match", id: "n1" })).toBeNull();
  });
});

describe("deriveInitialSelection", () => {
  it("picks the deep-link item when it exists", () => {
    const list = buildList([buildEntityItem("n1"), buildEntityItem("n2")]);
    const selection = deriveInitialSelection(list, {
      kind: "entity_match",
      id: "n2",
    });
    // The deep-link wins over the first-item default — this is the
    // contract that lets curators share a URL pointing to a specific
    // item.
    expect(selection).toEqual({ kind: "entity_match", id: "n2" });
  });

  it("falls back to the first item when the deep-link points to a missing item", () => {
    const list = buildList([buildEntityItem("n1")]);
    const selection = deriveInitialSelection(list, {
      kind: "entity_match",
      id: "missing",
    });
    // flow.md §3 row 3b — silent fallback, no error surface.
    expect(selection).toEqual({ kind: "entity_match", id: "n1" });
  });

  it("falls back to the first item when no deep-link is supplied", () => {
    const list = buildList([buildEntityItem("n1"), buildEntityItem("n2")]);
    expect(deriveInitialSelection(list, null)).toEqual({
      kind: "entity_match",
      id: "n1",
    });
  });

  it("returns null when the queue is empty (UI-07)", () => {
    expect(deriveInitialSelection(buildList([]), null)).toBeNull();
  });

  it("returns null when the queue is still loading", () => {
    expect(deriveInitialSelection(undefined, null)).toBeNull();
  });

  it("derives a disputed selection from the first dispute's side id", () => {
    const list = buildList([buildDisputedItem("side-x")]);
    expect(deriveInitialSelection(list, null)).toEqual({
      kind: "disputed",
      id: "side-x",
    });
  });
});

/* ------------------------------------------------------------------ *
 * TC-07 — neighbour / selectByIndex / toSelectedItem                  *
 * ------------------------------------------------------------------ */

describe("toSelectedItem", () => {
  it("maps an entity_match item to its (kind, nodeId) selection", () => {
    expect(toSelectedItem(buildEntityItem("n1"))).toEqual({
      kind: "entity_match",
      id: "n1",
    });
  });

  it("maps a disputed item to its first side's itemId", () => {
    expect(toSelectedItem(buildDisputedItem("side-1"))).toEqual({
      kind: "disputed",
      id: "side-1",
    });
  });
});

describe("indexOfSelected", () => {
  it("returns the index of the matching item", () => {
    const list = buildList([buildEntityItem("n1"), buildEntityItem("n2")]);
    expect(indexOfSelected(list, { kind: "entity_match", id: "n2" })).toBe(1);
  });

  it("returns -1 when not found", () => {
    const list = buildList([buildEntityItem("n1")]);
    expect(indexOfSelected(list, { kind: "entity_match", id: "miss" })).toBe(-1);
  });
});

describe("neighbour", () => {
  it("advances to the next item on `next`", () => {
    const list = buildList([
      buildEntityItem("n1"),
      buildEntityItem("n2"),
      buildEntityItem("n3"),
    ]);
    expect(
      neighbour(list, { kind: "entity_match", id: "n1" }, "next"),
    ).toEqual({ kind: "entity_match", id: "n2" });
  });

  it("wraps from last back to first on `next`", () => {
    const list = buildList([buildEntityItem("n1"), buildEntityItem("n2")]);
    expect(
      neighbour(list, { kind: "entity_match", id: "n2" }, "next"),
    ).toEqual({ kind: "entity_match", id: "n1" });
  });

  it("wraps from first to last on `prev`", () => {
    const list = buildList([buildEntityItem("n1"), buildEntityItem("n2")]);
    expect(
      neighbour(list, { kind: "entity_match", id: "n1" }, "prev"),
    ).toEqual({ kind: "entity_match", id: "n2" });
  });

  it("returns null on empty queue", () => {
    expect(neighbour(buildList([]), null, "next")).toBeNull();
  });

  it("returns the first item when no selection (j on a fresh page)", () => {
    const list = buildList([buildEntityItem("n1"), buildEntityItem("n2")]);
    expect(neighbour(list, null, "next")).toEqual({
      kind: "entity_match",
      id: "n1",
    });
  });
});

describe("selectByIndex", () => {
  it("returns the (1-indexed) Nth item", () => {
    const list = buildList([
      buildEntityItem("n1"),
      buildEntityItem("n2"),
      buildEntityItem("n3"),
    ]);
    expect(selectByIndex(list, 1)).toEqual({ kind: "entity_match", id: "n1" });
    expect(selectByIndex(list, 3)).toEqual({ kind: "entity_match", id: "n3" });
  });

  it("returns null when the index is out of range or invalid", () => {
    const list = buildList([buildEntityItem("n1")]);
    expect(selectByIndex(list, 0)).toBeNull();
    expect(selectByIndex(list, 5)).toBeNull();
    expect(selectByIndex(list, 10)).toBeNull(); // > 9 cap
  });
});
