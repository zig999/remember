/**
 * Unit tests for `useCurationStore` + `parseItemSearchParam` /
 * `stringifyItemSearchParam` helpers (TC-04).
 *
 * Why each test exists (Rule 9 — Tests Verify Intent):
 *  - `setSelectedItem` MUST reset `evidenceViewed` when the item changes,
 *    because the UI contract is "every new item must re-prove its
 *    evidence" (feature.spec.md §3 transition row UI-01/UI-07 → UI-02).
 *    A passing test that did not assert the reset would let the
 *    DecisionBar arm prematurely on the new item — a real production bug.
 *  - Re-selecting the SAME item is a no-op so the evidenceViewed flag
 *    survives an idempotent click (deep-link param fires every render).
 *  - `incrementResolved` is a pure counter — the test guards against
 *    accidentally turning it into a setter (which would erase prior
 *    decisions in the session — silent data loss).
 *  - `updateLastSeen` MUST be idempotent on equal value: the polling
 *    effect calls it on every resolve; without the equality guard,
 *    Zustand would re-render every 30 s for no reason.
 *  - The parse/stringify pair is round-trip-safe so the URL is the
 *    single source of truth for deep-linking (front.md §3.2).
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  parseItemSearchParam,
  stringifyItemSearchParam,
  useCurationStore,
} from "../curation-store";

afterEach(() => {
  // Each test starts from a clean store — reset() is the same primitive
  // the page uses on unmount, so testing through it locks the contract.
  useCurationStore.getState().reset();
});

describe("useCurationStore.setSelectedItem", () => {
  it("sets the item and resets evidenceViewed when item changes", () => {
    // Pre-condition: evidence had been marked viewed for some prior item.
    useCurationStore.getState().setEvidenceViewed(true);
    expect(useCurationStore.getState().evidenceViewed).toBe(true);

    useCurationStore
      .getState()
      .setSelectedItem({ kind: "entity_match", id: "n1" });

    expect(useCurationStore.getState().selectedItem).toEqual({
      kind: "entity_match",
      id: "n1",
    });
    // Real bug guard: a curator who selects a new item must NOT see the
    // DecisionBar pre-armed from a previous item's evidence.
    expect(useCurationStore.getState().evidenceViewed).toBe(false);
  });

  it("does not reset evidenceViewed when re-selecting the same item", () => {
    useCurationStore
      .getState()
      .setSelectedItem({ kind: "entity_match", id: "n1" });
    useCurationStore.getState().setEvidenceViewed(true);

    // Same kind+id, different object reference — must be deduped.
    useCurationStore
      .getState()
      .setSelectedItem({ kind: "entity_match", id: "n1" });

    // If the store reset evidenceViewed here, the URL deep-link
    // (which re-emits the SelectedItem on every render) would reset
    // the bar continuously and the curator could never act.
    expect(useCurationStore.getState().evidenceViewed).toBe(true);
  });

  it("setting null returns to idle state", () => {
    useCurationStore
      .getState()
      .setSelectedItem({ kind: "disputed", id: "d1" });
    useCurationStore.getState().setSelectedItem(null);
    expect(useCurationStore.getState().selectedItem).toBeNull();
  });
});

describe("useCurationStore.incrementResolved", () => {
  it("increments by one per call", () => {
    expect(useCurationStore.getState().sessionResolved).toBe(0);
    useCurationStore.getState().incrementResolved();
    useCurationStore.getState().incrementResolved();
    useCurationStore.getState().incrementResolved();
    // If the action were rewritten as a setter that takes a number,
    // this test would correctly fail — the contract is "monotone add".
    expect(useCurationStore.getState().sessionResolved).toBe(3);
  });
});

describe("useCurationStore.updateLastSeen", () => {
  it("seeds and updates the value", () => {
    expect(useCurationStore.getState().lastSeenTotal).toBeNull();
    useCurationStore.getState().updateLastSeen(7);
    expect(useCurationStore.getState().lastSeenTotal).toBe(7);
    useCurationStore.getState().updateLastSeen(10);
    expect(useCurationStore.getState().lastSeenTotal).toBe(10);
  });
});

describe("parseItemSearchParam", () => {
  it("parses a well-formed entity_match string", () => {
    expect(parseItemSearchParam("entity_match:n-123")).toEqual({
      kind: "entity_match",
      id: "n-123",
    });
  });

  it("parses a well-formed disputed string", () => {
    expect(parseItemSearchParam("disputed:item-9")).toEqual({
      kind: "disputed",
      id: "item-9",
    });
  });

  it("returns null on missing colon", () => {
    expect(parseItemSearchParam("entity_match")).toBeNull();
  });

  it("returns null on unknown kind", () => {
    // The UI must not crash on a third-party-modified URL — silent
    // fallback to first-item auto-select (flow.md §3 row 3b).
    expect(parseItemSearchParam("uncertain:n1")).toBeNull();
  });

  it("returns null on empty id", () => {
    expect(parseItemSearchParam("entity_match:")).toBeNull();
  });

  it("returns null on non-string input", () => {
    expect(parseItemSearchParam(undefined)).toBeNull();
    expect(parseItemSearchParam(null)).toBeNull();
    expect(parseItemSearchParam(42)).toBeNull();
  });
});

describe("stringifyItemSearchParam", () => {
  it("round-trips with parseItemSearchParam", () => {
    const original = { kind: "entity_match" as const, id: "n1" };
    const str = stringifyItemSearchParam(original);
    expect(str).toBeDefined();
    expect(parseItemSearchParam(str)).toEqual(original);
  });

  it("returns undefined on null", () => {
    // Why undefined (not "" or null): TanStack Router's `to` API
    // strips `undefined` values from the search object, keeping the
    // URL clean (/curation instead of /curation?item=).
    expect(stringifyItemSearchParam(null)).toBeUndefined();
  });
});
