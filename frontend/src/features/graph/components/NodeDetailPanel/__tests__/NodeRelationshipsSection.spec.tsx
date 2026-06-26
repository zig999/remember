// @vitest-environment jsdom
/**
 * NodeRelationshipsSection — unit tests (dev_tc_001 Phase B).
 *
 * Pins the four states the spec mandates:
 *  - loading  → spinner + aria-busy + live copy
 *  - empty    → "Nenhuma relação encontrada."
 *  - error    → "Não foi possível carregar as relações." + retry button
 *  - success  → `<ul>` with one row per link
 *
 * useNodeRelationships is mocked so the test doesn't stand up a real
 * QueryClient + fetch — the network contract is exercised in
 * `useNodeRelationships.spec.tsx`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { TraversalResultView } from "../../../api";

interface MockState {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: TraversalResultView | undefined;
  error: unknown;
  refetch: ReturnType<typeof vi.fn>;
}

const state: MockState = {
  isPending: true,
  isError: false,
  isSuccess: false,
  data: undefined,
  error: null,
  refetch: vi.fn(),
};

vi.mock("../../../api/useNodeRelationships", () => ({
  useNodeRelationships: () => state,
}));

// Phase C provenance hook is invoked by NodeRelationshipRow children — mock
// to a disabled-idle state.
vi.mock("../../../api/useProvenance", () => ({
  useProvenance: () => ({
    isPending: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: null,
    refetch: vi.fn(),
  }),
}));

import { NodeRelationshipsSection } from "../NodeRelationshipsSection";
import { NODE_DETAIL_COPY } from "../NodeDetailPanel.copy";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  state.isPending = true;
  state.isError = false;
  state.isSuccess = false;
  state.data = undefined;
  state.error = null;
  state.refetch = vi.fn();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

describe("NodeRelationshipsSection — states", () => {
  it("loading: shows spinner + aria-busy + live region", () => {
    state.isPending = true;
    act(() => root.render(<NodeRelationshipsSection nodeId="node-1" />));
    const section = container.querySelector(
      '[data-testid="node-detail-relationships"]',
    );
    expect(section?.getAttribute("aria-busy")).toBe("true");
    expect(
      container.querySelector(
        '[data-testid="node-detail-relationships-loading"]',
      )?.textContent,
    ).toContain(NODE_DETAIL_COPY.relationshipsLoading);
  });

  it("empty: shows 'Nenhuma relação encontrada.'", () => {
    state.isPending = false;
    state.isSuccess = true;
    state.data = { startingNodeId: "node-1", links: [] };
    act(() => root.render(<NodeRelationshipsSection nodeId="node-1" />));
    expect(
      container.querySelector(
        '[data-testid="node-detail-relationships-empty"]',
      )?.textContent,
    ).toContain(NODE_DETAIL_COPY.relationshipsEmpty);
  });

  it("error: shows alert + retry, fires refetch on click", () => {
    state.isPending = false;
    state.isError = true;
    state.error = { code: "SYSTEM_NETWORK" };
    state.refetch = vi.fn();
    act(() => root.render(<NodeRelationshipsSection nodeId="node-1" />));
    const err = container.querySelector(
      '[data-testid="node-detail-relationships-error"]',
    );
    expect(err?.getAttribute("role")).toBe("alert");
    expect(err?.textContent).toContain(NODE_DETAIL_COPY.relationshipsError);
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="node-detail-relationships-retry"]',
    );
    btn!.click();
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });

  it("success: renders one <li> per link", () => {
    state.isPending = false;
    state.isSuccess = true;
    state.data = {
      startingNodeId: "node-1",
      links: [
        {
          id: "L1",
          linkType: "participates_in",
          directionLabel: "participates_in",
          direction: "outgoing",
          directionArrow: "→",
          neighborName: "Apollo",
          neighborNodeId: "node-B",
          neighborNodeType: "Project",
          effectiveStatus: "active",
          isInEffect: true,
          confidence: 0.92,
          confidenceLabel: "92%",
          validFromLabel: null,
          validToLabel: null,
          flags: [],
          provenance: [],
        },
        {
          id: "L2",
          linkType: "owns",
          directionLabel: "is_owned_by",
          direction: "incoming",
          directionArrow: "←",
          neighborName: "Foo",
          neighborNodeId: "node-C",
          neighborNodeType: "Project",
          effectiveStatus: "uncertain",
          isInEffect: true,
          confidence: 0.55,
          confidenceLabel: "55%",
          validFromLabel: null,
          validToLabel: null,
          flags: [],
          provenance: [],
        },
      ],
    };
    act(() => root.render(<NodeRelationshipsSection nodeId="node-1" />));
    const list = container.querySelector(
      '[data-testid="node-detail-relationships-list"]',
    );
    expect(list).not.toBeNull();
    const rows = container.querySelectorAll(
      '[data-testid="node-detail-relationship-row"]',
    );
    expect(rows).toHaveLength(2);
  });
});
