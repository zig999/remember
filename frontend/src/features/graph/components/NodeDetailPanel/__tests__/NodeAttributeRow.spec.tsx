// @vitest-environment jsdom
/**
 * NodeAttributeRow — unit tests (dev_tc_001, Phases A + C).
 *
 * Pins:
 *  - Phase A: when `attr.provenance[]` is non-empty, a "Proveniência (n entrada(s))"
 *    `<details>` renders inline; expanded body shows fragment_text + confidence
 *    + source_type + received_at WITHOUT any extra network call.
 *  - Phase A: when `attr.provenance[]` is empty, the disclosure is hidden
 *    (no empty "Proveniência (0)" UI noise).
 *  - Phase C: a separate "Ver origem completa" `<details>` is always rendered;
 *    `useProvenance` fires only after the user opens it (enabled gate).
 *
 * The Phase C network behaviour is exercised at the hook level in
 * `useProvenance.spec.tsx`; here we mock the hook so the component test
 * focuses on rendering + the open-then-fetch coupling.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

// Mock useProvenance so the row can be tested without a QueryClientProvider.
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
    // Track whether the hook saw `enabled: true` — proves lazy fetch
    // coupling in the row component.
    if (enabled) provenanceEnabled = true;
    return useProvenanceMock();
  },
}));

import { NodeAttributeRow } from "../NodeAttributeRow";
import { NODE_DETAIL_COPY } from "../NodeDetailPanel.copy";
import type { NodeAttributeView } from "../../../api";

let container: HTMLTableElement;
let root: Root;

beforeEach(() => {
  // Rows render as <tr> — must be mounted inside a table.
  const tableContainer = document.createElement("table");
  const tbody = document.createElement("tbody");
  tableContainer.appendChild(tbody);
  document.body.appendChild(tableContainer);
  container = tableContainer;
  root = createRoot(tbody);
  provenanceEnabled = false;
  useProvenanceMock.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

function makeAttr(overrides?: Partial<NodeAttributeView>): NodeAttributeView {
  return {
    id: "attr-1",
    key: "deadline",
    value: "2026-07-15",
    valueType: "date",
    effectiveStatus: "active",
    isInEffect: true,
    state: "accepted",
    validFromLabel: "10/01/2026",
    validToLabel: null,
    provenance: [],
    ...overrides,
  };
}

describe("NodeAttributeRow — Phase A inline provenance", () => {
  it("hides the 'Proveniência' disclosure when no entries are present", () => {
    act(() => root.render(<NodeAttributeRow attr={makeAttr()} />));
    expect(
      container.querySelector('[data-testid="attribute-inline-provenance"]'),
    ).toBeNull();
  });

  it("renders 'Proveniência (1 entrada)' summary with the right entry count", () => {
    const attr = makeAttr({
      provenance: [
        {
          fragmentId: "f1",
          fragmentText: "O prazo é 15/07/2026.",
          confidence: 0.92,
          confidenceLabel: "92%",
          rawInformationId: "raw-1",
          sourceType: "ata",
          receivedAtLabel: "11/06/2026",
          excerpt: null,
        },
      ],
    });
    act(() => root.render(<NodeAttributeRow attr={attr} />));
    const summary = container.querySelector(
      '[data-testid="attribute-inline-provenance"] summary',
    );
    expect(summary?.textContent).toBe(
      NODE_DETAIL_COPY.attributeProvenanceSummary(1),
    );
  });

  it("renders fragment_text + confidence + source_type + received_at inside the entry", () => {
    const attr = makeAttr({
      provenance: [
        {
          fragmentId: "f1",
          fragmentText: "O prazo é 15/07/2026.",
          confidence: 0.92,
          confidenceLabel: "92%",
          rawInformationId: "raw-1",
          sourceType: "ata",
          receivedAtLabel: "11/06/2026",
          excerpt: null,
        },
      ],
    });
    act(() => root.render(<NodeAttributeRow attr={attr} />));
    const entry = container.querySelector(
      '[data-testid="attribute-inline-provenance-entry"]',
    );
    expect(entry?.textContent).toContain("O prazo é 15/07/2026.");
    expect(entry?.textContent).toContain("92%");
    expect(entry?.textContent).toContain("ata");
    expect(entry?.textContent).toContain("11/06/2026");
  });
});

describe("NodeAttributeRow — Phase C lazy origin", () => {
  it("renders the 'Ver origem completa' disclosure (always)", () => {
    act(() => root.render(<NodeAttributeRow attr={makeAttr()} />));
    const summary = container.querySelector(
      '[data-testid="attribute-lazy-origin"] summary',
    );
    expect(summary?.textContent).toBe(NODE_DETAIL_COPY.originSummary);
  });

  it("does NOT pass enabled:true until the user opens the disclosure", () => {
    act(() => root.render(<NodeAttributeRow attr={makeAttr()} />));
    expect(provenanceEnabled).toBe(false);
  });

  it("passes enabled:true after the user opens the disclosure", () => {
    act(() => root.render(<NodeAttributeRow attr={makeAttr()} />));
    const details = container.querySelector<HTMLDetailsElement>(
      '[data-testid="attribute-lazy-origin"]',
    );
    expect(details).not.toBeNull();
    act(() => {
      details!.open = true;
      details!.dispatchEvent(new Event("toggle", { bubbles: false }));
    });
    expect(provenanceEnabled).toBe(true);
  });
});
