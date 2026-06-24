/**
 * DecisionPanel — render + interaction tests (TC-05).
 *
 * Why each test (Rule 9 — encode the WHY):
 *  - Header shows StateBadge + scope + EvidenceChip immediately on mount,
 *    BEFORE evidence loads (UI-02). A regression hiding the header would
 *    break the curator's anchor: "which item am I looking at?".
 *  - DecisionBar buttons are aria-disabled=true (NOT disabled attr) when
 *    evidenceViewed=false — §8 keeps them focusable so SR users hear the
 *    "Veja a evidência antes de decidir" tooltip.
 *  - DecisionBar buttons drop aria-disabled when evidenceViewed=true —
 *    UI-03 arming.
 *  - Click on a destructive button while evidenceViewed=false MUST NOT
 *    dispatch — BDD Scenario 2 ("nenhuma ação é disparada").
 *  - StaleBanner overlays only when stale=true with role=alert (UI-10).
 *  - BUSINESS_SELF_MERGE_FORBIDDEN renders inline in the panel (§6).
 *  - resolveDisplayMode picks summary vs full-diff via ComparePane —
 *    indirect test for §11 integration.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DecisionPanel } from "../DecisionPanel";
import type {
  EntityMatchQueueItem,
  DisputeQueueItem,
} from "../../../types";

let container: HTMLDivElement;
let root: Root;

function buildEntity(): EntityMatchQueueItem {
  return {
    kind: "entity_match",
    nodeId: "n1",
    nodeType: "Person",
    canonicalName: "Maria Silva",
    candidates: [
      {
        candidateNodeId: "c1",
        canonicalName: "Maria Silva",
        similarity: 0.95,
      },
    ],
    createdAt: new Date(Date.now() - 5 * 60_000),
  };
}

function buildDispute(): DisputeQueueItem {
  return {
    kind: "disputed",
    itemKind: "attribute",
    scope: {
      sourceNodeId: null,
      targetNodeId: null,
      linkType: null,
      nodeId: "n1",
      attributeKey: "role",
    },
    sides: [
      {
        itemId: "s1",
        value: "Diretor",
        targetNodeId: null,
        validFrom: new Date("2021-01-01"),
        validTo: new Date("2023-01-01"),
        validFromSource: "stated",
        confidence: 0.8,
        status: "disputed",
      },
      {
        itemId: "s2",
        value: "Presidente",
        targetNodeId: null,
        validFrom: new Date("2023-01-01"),
        validTo: null,
        validFromSource: "document",
        confidence: 0.8,
        status: "disputed",
      },
    ],
    createdAt: new Date(),
  };
}

function renderWithClient(ui: ReactElement): void {
  const qc = new QueryClient();
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

describe("DecisionPanel — header + state", () => {
  it("renders StateBadge + scope + EvidenceChip immediately on mount", () => {
    renderWithClient(
      <DecisionPanel item={buildEntity()} evidenceViewed={false} />,
    );
    expect(container.textContent).toContain("Maria Silva");
    expect(container.textContent).toContain("Para revisar");
    expect(container.textContent).toContain("Ver evidência");
  });

  it("shows 'Evidência vista' when evidenceViewed=true", () => {
    renderWithClient(
      <DecisionPanel item={buildEntity()} evidenceViewed />,
    );
    expect(container.textContent).toContain("Evidência vista");
  });
});

describe("DecisionPanel — DecisionBar gate (§8 + BDD 2)", () => {
  it("marks decision buttons aria-disabled=true when evidenceViewed=false", () => {
    renderWithClient(
      <DecisionPanel item={buildEntity()} evidenceViewed={false} />,
    );
    const merge = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").includes("Fundir neste"),
    );
    expect(merge).toBeDefined();
    expect(merge!.getAttribute("aria-disabled")).toBe("true");
    // NOT disabled attr — button must be focusable per §8.
    expect(merge!.hasAttribute("disabled")).toBe(false);
  });

  it("removes aria-disabled when evidenceViewed=true", () => {
    renderWithClient(<DecisionPanel item={buildEntity()} evidenceViewed />);
    const merge = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").includes("Fundir neste"),
    );
    expect(merge!.getAttribute("aria-disabled")).toBeNull();
  });

  it("click on aria-disabled button DOES NOT call action (BDD 2)", () => {
    const onResolveEntityMatch = vi.fn();
    renderWithClient(
      <DecisionPanel
        item={buildEntity()}
        evidenceViewed={false}
        actions={{ onResolveEntityMatch }}
      />,
    );
    const merge = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").includes("Fundir neste"),
    );
    act(() => {
      merge!.click();
    });
    expect(onResolveEntityMatch).not.toHaveBeenCalled();
  });
});

describe("DecisionPanel — stale (UI-10)", () => {
  it("renders StaleBanner with role=alert when stale=true", () => {
    renderWithClient(
      <DecisionPanel
        item={buildEntity()}
        evidenceViewed={false}
        stale
        onRefetch={() => undefined}
      />,
    );
    const alert = container.querySelector("[role=alert]");
    expect(alert).not.toBeNull();
    expect(alert!.textContent).toContain("Este item mudou");
  });

  it("does not render StaleBanner when stale=false", () => {
    renderWithClient(
      <DecisionPanel item={buildEntity()} evidenceViewed={false} />,
    );
    expect(container.textContent).not.toContain("Este item mudou");
  });
});

describe("DecisionPanel — server error projection (§6)", () => {
  it("shows SELF_MERGE_FORBIDDEN inline in the panel", () => {
    renderWithClient(
      <DecisionPanel
        item={buildEntity()}
        evidenceViewed
        serverError={{
          code: "BUSINESS_SELF_MERGE_FORBIDDEN",
          message: "ignored — UI string takes precedence",
        }}
      />,
    );
    expect(container.textContent).toContain(
      "Não é possível fundir um nó com ele mesmo.",
    );
  });

  it("renders a generic banner for unknown codes", () => {
    renderWithClient(
      <DecisionPanel
        item={buildEntity()}
        evidenceViewed
        serverError={{ code: "SYSTEM_INTERNAL_ERROR", message: "boom" }}
      />,
    );
    expect(container.textContent).toContain("boom");
  });
});

describe("DecisionPanel — disputed item (§11 full-diff)", () => {
  it("renders prefer/keep buttons and lists sides", () => {
    renderWithClient(
      <DecisionPanel item={buildDispute()} evidenceViewed />,
    );
    expect(container.textContent).toContain("Preferir este");
    expect(container.textContent).toContain("Manter em disputa");
    expect(container.textContent).toContain("Diretor");
    expect(container.textContent).toContain("Presidente");
  });
});
