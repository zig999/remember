/**
 * ProvenanceTrail — render + evidence-viewed tracking (TC-05).
 *
 * Why each test (Rule 9 — encode the WHY):
 *  - Skeleton while loading (UI-02 — keeps the panel composable, never
 *    blanks).
 *  - Tab focus fires onEvidenceViewed exactly once — gate for SR users
 *    who cannot rely on scroll (§8 / UI-02).
 *  - BUSINESS_RAW_INFORMATION_DELETED renders a role=alert warning AND
 *    keeps onEvidenceViewed un-called — without provenance the
 *    DecisionBar gate MUST stay closed (§6 row, spec §10 ProvenanceTrail).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EnvelopeError } from "../../../../../lib/http";

// Mock the provenance hooks so we can synthesize loading / error / data
// states deterministically without driving them through the real fetch.
// (Same pattern used by features/chat/components/__tests__/*.spec.tsx.)
const linkMock = vi.fn();
const attrMock = vi.fn();
vi.mock("../../../api/provenance.hooks", () => ({
  useProvenanceByLink: (id: string | null | undefined) => linkMock(id),
  useProvenanceByAttribute: (id: string | null | undefined) => attrMock(id),
  useProvenanceByFragment: () => ({ isPending: true }),
  useListAcceptedFragments: () => ({ isPending: true }),
}));

import { ProvenanceTrail } from "../ProvenanceTrail";

let container: HTMLDivElement;
let root: Root;

function renderWithClient(client: QueryClient, ui: ReactElement): void {
  act(() => {
    root.render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
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

describe("ProvenanceTrail — initial skeleton", () => {
  it("renders aria-busy=true while loading", () => {
    linkMock.mockReturnValue({ isPending: true, isError: false, data: undefined });
    const qc = new QueryClient();
    renderWithClient(
      qc,
      <ProvenanceTrail
        itemKind="link"
        itemId="link-1"
        onEvidenceViewed={() => undefined}
      />,
    );
    const sec = container.querySelector("[aria-busy=true]");
    expect(sec).not.toBeNull();
  });
});

describe("ProvenanceTrail — fragments visible", () => {
  it("renders fragment text + chunk excerpt + arms onEvidenceViewed on focus", () => {
    linkMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        fragments: [
          {
            id: "f1",
            text: "Maria assumiu a diretoria em 2023.",
            confidence: 0.92,
            status: "accepted",
            chunks: [
              {
                id: "ch1",
                chunkIndex: 0,
                offsetStart: 0,
                offsetEnd: 40,
                excerpt: "Maria assumiu a diretoria em 2023.",
                locator: {},
                rawInformation: {
                  id: "r1",
                  sourceType: "email",
                  receivedAt: new Date("2023-02-01"),
                  metadata: {},
                },
              },
            ],
          },
        ],
      },
    });
    const onView = vi.fn();
    const qc = new QueryClient();
    renderWithClient(
      qc,
      <ProvenanceTrail
        itemKind="link"
        itemId="link-1"
        onEvidenceViewed={onView}
      />,
    );
    expect(container.textContent).toContain("Maria assumiu");
    const sentinel = container.querySelector("[tabindex='0']") as HTMLElement;
    expect(sentinel).not.toBeNull();
    act(() => {
      sentinel.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onEvidenceViewed twice if focus fires twice (idempotent gate)", () => {
    linkMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { fragments: [
        {
          id: "f1", text: "x", confidence: 0.8, status: "accepted",
          chunks: [{
            id: "c", chunkIndex: 0, offsetStart: 0, offsetEnd: 1,
            excerpt: "x", locator: {},
            rawInformation: { id: "r", sourceType: "email", receivedAt: new Date(), metadata: {} },
          }],
        },
      ] },
    });
    const onView = vi.fn();
    const qc = new QueryClient();
    renderWithClient(
      qc,
      <ProvenanceTrail
        itemKind="link"
        itemId="link-1"
        onEvidenceViewed={onView}
      />,
    );
    const sentinel = container.querySelector("[tabindex='0']") as HTMLElement;
    act(() => {
      sentinel.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      sentinel.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(onView).toHaveBeenCalledTimes(1);
  });
});

describe("ProvenanceTrail — BUSINESS_RAW_INFORMATION_DELETED (§6)", () => {
  it("renders role=alert warning AND keeps gate closed", () => {
    linkMock.mockReturnValue({
      isPending: false,
      isError: true,
      error: new EnvelopeError({
        code: "BUSINESS_RAW_INFORMATION_DELETED",
        httpStatus: 410,
        message: "raw deleted",
      }),
      data: undefined,
    });
    const onView = vi.fn();
    const qc = new QueryClient();
    renderWithClient(
      qc,
      <ProvenanceTrail
        itemKind="link"
        itemId="link-rip"
        onEvidenceViewed={onView}
      />,
    );
    const alert = container.querySelector("[role=alert]");
    expect(alert).not.toBeNull();
    expect(alert!.textContent).toContain("excluída por conformidade");
    expect(onView).not.toHaveBeenCalled();
  });
});
