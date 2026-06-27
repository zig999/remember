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

/**
 * Scenario 9 — original_input three branches (TC-04, NodeDetailPanel spec
 * v2.1). The display rule lives in `ChunkDetails` and is driven solely by
 * `chunk.rawInformation.originalInput`. Each branch is a distinct contract,
 * so each gets its own test:
 *
 *  1. non-null, non-`'[REDACTED]'` string → collapsible disclosure with
 *     verbatim text and NO interactive controls beyond the native summary.
 *  2. `'[REDACTED]'` sentinel → muted indicator with aria-label; the literal
 *     `'[REDACTED]'` must NEVER reach the user.
 *  3. `null` / `undefined` / absent → no block of any kind rendered.
 */
function makeDataWithOriginalInput(
  originalInput: string | null | undefined,
): ProvenanceResponseView {
  return {
    fragments: [
      {
        id: "frag-x",
        text: "Cria o projeto Acompanhar.",
        confidence: 0.9,
        confidenceLabel: "90%",
        status: "accepted",
        chunks: [
          {
            id: "chunk-x",
            chunkIndex: 0,
            offsetStart: 0,
            offsetEnd: 30,
            offsetRangeLabel: "chars 0–30",
            excerpt: "Cria o projeto Acompanhar.",
            locator: {},
            rawInformation: {
              id: "raw-x",
              sourceType: "chat",
              receivedAtLabel: "27/06/2026 14:00",
              title: null,
              documentDateLabel: null,
              originalInput,
            },
          },
        ],
      },
    ],
  };
}

describe("NodeProvenanceChain — original_input (Scenario 9 / v2.1)", () => {
  it("renders the disclosure with verbatim text when original_input is a non-null, non-'[REDACTED]' string", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError={false}
          error={null}
          data={makeDataWithOriginalInput("Cria o projeto Acompanahr")}
          onRetry={() => undefined}
        />,
      ),
    );
    const disclosure = container.querySelector<HTMLDetailsElement>(
      '[data-testid="node-provenance-original-input"]',
    );
    expect(disclosure).not.toBeNull();
    expect(disclosure!.tagName.toLowerCase()).toBe("details");
    // Summary text matches the frozen pt-BR copy.
    const summary = disclosure!.querySelector("summary");
    expect(summary?.textContent).toBe(NODE_DETAIL_COPY.originalInputSummary);
    // Verbatim text rendered in the body (with the typo intact — the WHOLE
    // point of capturing the user's original phrasing).
    const text = container.querySelector(
      '[data-testid="node-provenance-original-input-text"]',
    );
    expect(text?.textContent).toBe("Cria o projeto Acompanahr");
    // The redaction indicator must NOT appear in this branch.
    expect(
      container.querySelector(
        '[data-testid="node-provenance-original-input-redacted"]',
      ),
    ).toBeNull();
    // No interactive elements inside the disclosure body beyond the native
    // <summary> — no buttons, no inputs, no links (§6 Do/Don't: display-only).
    const interactiveInsideBody = disclosure!.querySelectorAll(
      "button, input, a, textarea, select",
    );
    expect(interactiveInsideBody).toHaveLength(0);
  });

  it("renders the muted redaction indicator (with aria-label) when original_input === '[REDACTED]'; the literal '[REDACTED]' is NEVER visible", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError={false}
          error={null}
          data={makeDataWithOriginalInput("[REDACTED]")}
          onRetry={() => undefined}
        />,
      ),
    );
    const indicator = container.querySelector(
      '[data-testid="node-provenance-original-input-redacted"]',
    );
    expect(indicator).not.toBeNull();
    expect(indicator?.textContent).toBe(NODE_DETAIL_COPY.originalInputRedacted);
    expect(indicator?.getAttribute("aria-label")).toBe(
      NODE_DETAIL_COPY.originalInputRedactedAria,
    );
    // The literal sentinel must never reach the rendered DOM text.
    const chunk = container.querySelector(
      '[data-testid="node-provenance-chunk"]',
    );
    expect(chunk?.textContent).not.toContain("[REDACTED]");
    // And the disclosure branch must NOT render in this case.
    expect(
      container.querySelector(
        '[data-testid="node-provenance-original-input"]',
      ),
    ).toBeNull();
  });

  it("renders nothing when original_input is null", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError={false}
          error={null}
          data={makeDataWithOriginalInput(null)}
          onRetry={() => undefined}
        />,
      ),
    );
    // Neither branch appears — silent omission.
    expect(
      container.querySelector(
        '[data-testid="node-provenance-original-input"]',
      ),
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="node-provenance-original-input-redacted"]',
      ),
    ).toBeNull();
    // Sanity: the surrounding chunk + fragment still render normally.
    expect(
      container.querySelector('[data-testid="node-provenance-chunk"]'),
    ).not.toBeNull();
  });

  it("renders nothing when original_input is undefined (field absent on the wire)", () => {
    act(() =>
      root.render(
        <NodeProvenanceChain
          isPending={false}
          isError={false}
          error={null}
          data={makeDataWithOriginalInput(undefined)}
          onRetry={() => undefined}
        />,
      ),
    );
    expect(
      container.querySelector(
        '[data-testid="node-provenance-original-input"]',
      ),
    ).toBeNull();
    expect(
      container.querySelector(
        '[data-testid="node-provenance-original-input-redacted"]',
      ),
    ).toBeNull();
  });
});
