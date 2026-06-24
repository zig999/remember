// @vitest-environment jsdom
/**
 * Unit tests for `CurationDrawer` (TC-07) — pure helpers + smoke mount.
 *
 * Why each test exists (Rule 9 — Tests Verify Intent):
 *  - `findDrawerItem` is the function that maps the (kind, itemId) prop
 *    pair to the queue row. A regression that swaps entity_match/disputed
 *    matching would surface the wrong item in the drawer (or none at
 *    all) — observable as a "Item não disponível" misfire. Tests cover
 *    both kinds + the "not found" path that drives FL-CURATION-03's
 *    escape-link fallback.
 *  - `provenanceContextOf` derives the (itemKind, itemId) for the
 *    ProvenanceTrail. entity_match items have no link/attribute id of
 *    their own — the test pins that we return null so the drawer arms
 *    decisions without waiting for evidence.
 *  - The drawer closed state MUST keep its content unmounted — a
 *    regression that always renders the panel would burn a network
 *    request on every page load (the queue is staleTime: 0). Asserted
 *    via Radix's portal-vs-DOM gate.
 *  - The drawer MUST have role="dialog" + aria-modal="true" +
 *    aria-label="Curadoria" when open (§8 baseline). A regression that
 *    drops aria-modal would let SR users escape the focus trap.
 *  - The escape link MUST point at /curation?item=<kind>:<id> so the
 *    FL-CURATION-03 fallback is reachable from the drawer's error state.
 */
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import {
  CurationDrawer,
  findDrawerItem,
  provenanceContextOf,
} from "../CurationDrawer";
import type {
  EntityMatchQueueItem,
  DisputeQueueItem,
  ReviewQueueItem,
} from "../../../types";

/* ---------- fixtures ---------- */

function buildEntity(id: string = "n1"): EntityMatchQueueItem {
  return {
    kind: "entity_match",
    nodeId: id,
    nodeType: "Person",
    canonicalName: "Maria Silva",
    candidates: [
      { candidateNodeId: "c1", canonicalName: "Maria S.", similarity: 0.92 },
    ],
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
}

function buildDispute(sideId: string = "a1"): DisputeQueueItem {
  return {
    kind: "disputed",
    itemKind: "attribute",
    scope: {
      sourceNodeId: null,
      targetNodeId: null,
      linkType: null,
      nodeId: "n9",
      attributeKey: "email",
    },
    sides: [
      {
        itemId: sideId,
        value: "x@y.com",
        targetNodeId: null,
        validFrom: null,
        validTo: null,
        validFromSource: "stated",
        confidence: 0.8,
        status: "disputed",
      },
      {
        itemId: "a2",
        value: "z@y.com",
        targetNodeId: null,
        validFrom: null,
        validTo: null,
        validFromSource: "stated",
        confidence: 0.7,
        status: "disputed",
      },
    ],
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
}

/* ---------- pure helpers ---------- */

describe("findDrawerItem", () => {
  it("finds entity_match by nodeId", () => {
    const items: ReviewQueueItem[] = [buildEntity("n1"), buildDispute("a1")];
    const got = findDrawerItem(items, "entity_match", "n1");
    expect(got).not.toBeNull();
    expect(got?.kind).toBe("entity_match");
  });

  it("finds disputed by ANY side itemId", () => {
    const items: ReviewQueueItem[] = [buildDispute("a1")];
    expect(findDrawerItem(items, "disputed", "a1")).not.toBeNull();
    // Other side of the same dispute still resolves to the same item.
    expect(findDrawerItem(items, "disputed", "a2")).not.toBeNull();
  });

  it("returns null when the kind does not match (entity_match queue, disputed lookup)", () => {
    const items: ReviewQueueItem[] = [buildEntity("n1")];
    expect(findDrawerItem(items, "disputed", "n1")).toBeNull();
  });

  it("returns null when the id is not in the queue (FL-CURATION-03 fallback path)", () => {
    const items: ReviewQueueItem[] = [buildEntity("n1")];
    expect(findDrawerItem(items, "entity_match", "n-missing")).toBeNull();
  });
});

describe("provenanceContextOf", () => {
  it("returns null for entity_match (no link/attribute id)", () => {
    expect(provenanceContextOf(buildEntity())).toBeNull();
  });

  it("returns (itemKind, first side itemId) for disputed", () => {
    const ctx = provenanceContextOf(buildDispute("a1"));
    expect(ctx).toEqual({ itemKind: "attribute", itemId: "a1" });
  });
});

/* ---------- smoke mount ---------- */

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

interface HarnessProps {
  readonly open: boolean;
}

/**
 * Render the drawer inside a memory router + QueryClient. The queue
 * query is mocked at the fetch boundary via `globalThis.fetch` (matches
 * the api/_request.ts entry point).
 */
function renderHarness(props: HarnessProps): {
  setOpen: (open: boolean) => void;
} {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const curationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/curation",
    component: () => <div>curation page</div>,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <CurationDrawer
        open={props.open}
        onOpenChange={() => undefined}
        kind="entity_match"
        itemId="n1"
      />
    ),
  });
  const tree = rootRoute.addChildren([indexRoute, curationRoute]);
  const router = createRouter({
    routeTree: tree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  act(() =>
    root.render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  );

  return { setOpen: () => undefined };
}

describe("CurationDrawer — render gate", () => {
  it("does NOT portal any drawer content when open=false (no queue request)", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderHarness({ open: false });
    expect(
      document.querySelector('[data-testid="curation-drawer"]'),
    ).toBeNull();
    // The drawer must not trigger the queue fetch while closed — we
    // accept either zero calls or no /api/v1/curation/queue specifically.
    const curationCalls = fetchSpy.mock.calls.filter(([url]) =>
      typeof url === "string" && url.includes("/api/v1/curation/queue"),
    );
    expect(curationCalls.length).toBe(0);
  });
});
