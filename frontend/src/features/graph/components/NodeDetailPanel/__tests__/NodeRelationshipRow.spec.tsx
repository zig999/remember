// @vitest-environment jsdom
/**
 * NodeRelationshipRow — unit tests (dev_tc_001, Phase B inline + C lazy).
 *
 * Pins:
 *  - Direction arrow + label render based on `link.direction`.
 *  - Inline `link.provenance[]` (Phase B) opens as a `<details>` with the
 *    "Proveniência do link (n entrada(s))" summary — same shape as Phase A
 *    but a different label so the user knows the level (attribute vs link).
 *  - "Ver origem completa" lazy disclosure (Phase C) — fetch fires only
 *    after the disclosure is opened.
 *  - Accessibility: sr-only direction copy is present.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let provenanceEnabled = false;
const useProvenanceMock = vi.fn(() => ({
  isPending: false,
  isError: false,
  isSuccess: false,
  data: undefined,
  error: null,
  refetch: vi.fn(),
}));

vi.mock("../../../api/useProvenance", () => ({
  useProvenance: (kind: string, id: string, enabled: boolean) => {
    if (enabled) provenanceEnabled = true;
    return useProvenanceMock();
  },
}));

import { NodeRelationshipRow } from "../NodeRelationshipRow";
import { NODE_DETAIL_COPY } from "../NodeDetailPanel.copy";
import type { TraversalLinkView } from "../../../api";

let listContainer: HTMLUListElement;
let root: Root;

beforeEach(() => {
  // Row renders as <li> — must be mounted inside a <ul>.
  const wrap = document.createElement("div");
  const ul = document.createElement("ul");
  wrap.appendChild(ul);
  document.body.appendChild(wrap);
  listContainer = ul;
  root = createRoot(ul);
  provenanceEnabled = false;
  useProvenanceMock.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  listContainer.parentElement?.remove();
  vi.clearAllMocks();
});

function makeLink(overrides?: Partial<TraversalLinkView>): TraversalLinkView {
  return {
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
    ...overrides,
  };
}

describe("NodeRelationshipRow — header", () => {
  it("shows direction arrow + linkType label + neighbor + confidence + status", () => {
    act(() => root.render(<NodeRelationshipRow link={makeLink()} />));
    expect(
      listContainer.querySelector(
        '[data-testid="node-detail-relationship-arrow"]',
      )?.textContent,
    ).toBe("→");
    expect(
      listContainer.querySelector(
        '[data-testid="node-detail-relationship-type"]',
      )?.textContent,
    ).toBe("participates_in");
    expect(
      listContainer.querySelector(
        '[data-testid="node-detail-relationship-neighbor"]',
      )?.textContent,
    ).toBe("Apollo");
    expect(
      listContainer.querySelector(
        '[data-testid="node-detail-relationship-confidence"]',
      )?.textContent,
    ).toBe("92%");
    expect(
      listContainer.querySelector(
        '[data-testid="node-detail-relationship-status"]',
      ),
    ).not.toBeNull();
  });

  it("flips arrow + uses inverse label on incoming links", () => {
    act(() =>
      root.render(
        <NodeRelationshipRow
          link={makeLink({
            direction: "incoming",
            directionArrow: "←",
            directionLabel: "has_participant",
          })}
        />,
      ),
    );
    expect(
      listContainer.querySelector(
        '[data-testid="node-detail-relationship-arrow"]',
      )?.textContent,
    ).toBe("←");
    expect(
      listContainer.querySelector(
        '[data-testid="node-detail-relationship-type"]',
      )?.textContent,
    ).toBe("has_participant");
    // sr-only copy reflects direction (a11y §8).
    expect(listContainer.textContent).toContain(
      NODE_DETAIL_COPY.directionIncomingSr,
    );
  });
});

describe("NodeRelationshipRow — Phase B inline link provenance", () => {
  it("hides the inline 'Proveniência do link' disclosure when no entries", () => {
    act(() => root.render(<NodeRelationshipRow link={makeLink()} />));
    expect(
      listContainer.querySelector(
        '[data-testid="link-inline-provenance"]',
      ),
    ).toBeNull();
  });

  it("renders the disclosure summary with the correct count", () => {
    const link = makeLink({
      provenance: [
        {
          fragmentId: "f1",
          fragmentText: "Maria coordena.",
          confidence: 0.9,
          confidenceLabel: "90%",
          rawInformationId: "raw-1",
          sourceType: "ata",
          receivedAtLabel: "11/06/2026",
          excerpt: null,
        },
        {
          fragmentId: "f2",
          fragmentText: "Maria é responsável.",
          confidence: 0.8,
          confidenceLabel: "80%",
          rawInformationId: "raw-2",
          sourceType: "email",
          receivedAtLabel: "10/06/2026",
          excerpt: null,
        },
      ],
    });
    act(() => root.render(<NodeRelationshipRow link={link} />));
    const summary = listContainer.querySelector(
      '[data-testid="link-inline-provenance"] summary',
    );
    expect(summary?.textContent).toBe(
      NODE_DETAIL_COPY.linkProvenanceSummary(2),
    );
  });
});

describe("NodeRelationshipRow — Phase C lazy origin", () => {
  it("renders 'Ver origem completa' but does not fetch until opened", () => {
    act(() => root.render(<NodeRelationshipRow link={makeLink()} />));
    const summary = listContainer.querySelector(
      '[data-testid="link-lazy-origin"] summary',
    );
    expect(summary?.textContent).toBe(NODE_DETAIL_COPY.originSummary);
    expect(provenanceEnabled).toBe(false);
  });

  it("fires the fetch after the user opens the disclosure", () => {
    act(() => root.render(<NodeRelationshipRow link={makeLink()} />));
    const details = listContainer.querySelector<HTMLDetailsElement>(
      '[data-testid="link-lazy-origin"]',
    );
    act(() => {
      details!.open = true;
      details!.dispatchEvent(new Event("toggle", { bubbles: false }));
    });
    expect(provenanceEnabled).toBe(true);
  });
});
