// @vitest-environment jsdom
/**
 * NodeProvenanceChain — unit tests (dev_tc_001 Phase C body).
 *
 * Pins:
 *  - Loading → spinner + `aria-busy=true` + pt-BR copy.
 *  - Error → `role="alert"` + variant-aware message.
 *  - 410 BUSINESS_RAW_INFORMATION_DELETED is terminal (no retry button).
 *  - Success → fragment text + chunk index + offset range + RawInformation
 *    metadata (source_type, received_at, title, document_date).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  NodeProvenanceChain,
  classifyProvenanceError,
} from "../NodeProvenanceChain";
import { NODE_DETAIL_COPY } from "../NodeDetailPanel.copy";
import type { ProvenanceResponseView } from "../../../api";

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
  vi.clearAllMocks();
});

describe("classifyProvenanceError", () => {
  it("maps RESOURCE_NOT_FOUND to 'not-found'", () => {
    expect(classifyProvenanceError({ code: "RESOURCE_NOT_FOUND" })).toBe(
      "not-found",
    );
  });
  it("maps BUSINESS_RAW_INFORMATION_DELETED to 'deleted'", () => {
    expect(
      classifyProvenanceError({ code: "BUSINESS_RAW_INFORMATION_DELETED" }),
    ).toBe("deleted");
  });
  it("maps SYSTEM_* to 'generic'", () => {
    expect(classifyProvenanceError({ code: "SYSTEM_NETWORK" })).toBe("generic");
  });
  it("falls back to 'unknown' on null / unknown shapes", () => {
    expect(classifyProvenanceError(null)).toBe("unknown");
    expect(classifyProvenanceError({ code: "WHATEVER" })).toBe("unknown");
  });
});

const SUCCESS_DATA: ProvenanceResponseView = {
  fragments: [
    {
      id: "frag-1",
      text: "Maria coordena.",
      confidence: 0.91,
      confidenceLabel: "91%",
      status: "accepted",
      chunks: [
        {
          id: "chunk-1",
          chunkIndex: 3,
          offsetStart: 100,
          offsetEnd: 200,
          offsetRangeLabel: "chars 100–200",
          excerpt: "...trecho...",
          locator: { page: 1 },
          rawInformation: {
            id: "raw-1",
            sourceType: "ata",
            receivedAtLabel: "11/06/2026 18:30",
            title: "Ata 1",
            documentDateLabel: "11/06/2026",
          },
        },
      ],
    },
  ],
};

describe("NodeProvenanceChain — loading state", () => {
  it("renders spinner + aria-busy + pt-BR loading copy", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending
          isError={false}
          error={null}
          data={undefined}
          onRetry={() => undefined}
        />,
      ),
    );
    const el = container.querySelector(
      '[data-testid="node-provenance-loading"]',
    );
    expect(el?.getAttribute("aria-busy")).toBe("true");
    expect(el?.textContent).toContain(NODE_DETAIL_COPY.originLoading);
  });
});

describe("NodeProvenanceChain — error states", () => {
  it("404 → 'not-found' notice with retry", () => {
    const retry = vi.fn();
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError
          error={{ code: "RESOURCE_NOT_FOUND" }}
          data={undefined}
          onRetry={retry}
        />,
      ),
    );
    const err = container.querySelector(
      '[data-testid="node-provenance-error"]',
    );
    expect(err?.getAttribute("role")).toBe("alert");
    expect(err?.getAttribute("data-variant")).toBe("not-found");
    expect(err?.textContent).toContain(NODE_DETAIL_COPY.originNotFound);
    const button = container.querySelector<HTMLButtonElement>(
      '[data-testid="node-provenance-retry"]',
    );
    expect(button).not.toBeNull();
    button!.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("410 → 'deleted' notice, NO retry button (tombstone is permanent)", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError
          error={{ code: "BUSINESS_RAW_INFORMATION_DELETED" }}
          data={undefined}
          onRetry={() => undefined}
        />,
      ),
    );
    const err = container.querySelector(
      '[data-testid="node-provenance-error"]',
    );
    expect(err?.getAttribute("data-variant")).toBe("deleted");
    expect(err?.textContent).toContain(NODE_DETAIL_COPY.originDeleted);
    expect(
      container.querySelector('[data-testid="node-provenance-retry"]'),
    ).toBeNull();
  });

  it("SYSTEM_* → 'generic' notice with retry", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError
          error={{ code: "SYSTEM_NETWORK" }}
          data={undefined}
          onRetry={() => undefined}
        />,
      ),
    );
    const err = container.querySelector(
      '[data-testid="node-provenance-error"]',
    );
    expect(err?.getAttribute("data-variant")).toBe("generic");
    expect(err?.textContent).toContain(NODE_DETAIL_COPY.originError);
    expect(
      container.querySelector('[data-testid="node-provenance-retry"]'),
    ).not.toBeNull();
  });
});

describe("NodeProvenanceChain — success body", () => {
  it("renders fragment text + chunk index + offset range + raw info metadata", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError={false}
          error={null}
          data={SUCCESS_DATA}
          onRetry={() => undefined}
        />,
      ),
    );
    expect(
      container.querySelector('[data-testid="node-provenance-fragment-text"]')
        ?.textContent,
    ).toBe("Maria coordena.");
    expect(
      container.querySelector(
        '[data-testid="node-provenance-fragment-confidence"]',
      )?.textContent,
    ).toBe("91%");
    expect(
      container.querySelector('[data-testid="node-provenance-chunk-index"]')
        ?.textContent,
    ).toContain("3");
    expect(
      container.querySelector('[data-testid="node-provenance-offset"]')
        ?.textContent,
    ).toBe("chars 100–200");
    expect(
      container.querySelector('[data-testid="node-provenance-excerpt"]')
        ?.textContent,
    ).toContain("trecho");
    // Source metadata (sourceType, receivedAt, title, document_date) all in the chunk box.
    const chunk = container.querySelector(
      '[data-testid="node-provenance-chunk"]',
    );
    expect(chunk?.textContent).toContain("ata");
    expect(chunk?.textContent).toContain("11/06/2026 18:30");
    expect(chunk?.textContent).toContain("Ata 1");
  });

  it("renders the 'origem não encontrada' notice when fragments[] is empty", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError={false}
          error={null}
          data={{ fragments: [] }}
          onRetry={() => undefined}
        />,
      ),
    );
    expect(
      container.querySelector('[data-testid="node-provenance-empty"]')
        ?.textContent,
    ).toContain(NODE_DETAIL_COPY.originNotFound);
  });
});
