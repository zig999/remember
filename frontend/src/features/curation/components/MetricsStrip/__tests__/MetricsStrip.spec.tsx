/**
 * MetricsStrip — render + R1 degradation tests (TC-06).
 *
 * Why each test (Rule 9):
 *  - Skeleton until settled — the page mounts MetricsStrip from the first
 *    render, well before the metrics query resolves. A non-skeleton state
 *    with stale defaults would suggest the metrics are zero when they are
 *    actually unknown.
 *  - Happy path: every prop renders as a labelled cell with the right
 *    value. accept_rate is a 0..1 number — formatPercent multiplies by
 *    100 and rounds; tests pin the rounding to avoid "33%" vs "33.0%"
 *    drift.
 *  - R1 degradation: when hasError && fallback is provided, the strip
 *    renders fallback queue counts and "—" for the rates so the operator
 *    knows the calibration figures are UNAVAILABLE (not zero).
 *  - hasError without fallback keeps the strip in skeleton — the page
 *    is responsible for providing fallbacks; we don't synthesize zeros
 *    that would mislead.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MetricsStrip } from "../MetricsStrip";
import type { CurationMetrics } from "../../../types";

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
});

const goodMetrics: CurationMetrics = {
  acceptRate: 0.83,
  rejectRateByCode: {},
  needsReviewCount: 12,
  uncertainCount: 4,
  disputedCount: 2,
  entityMatchQueueCount: 10,
  disputedQueueCount: 5,
  computedAt: new Date(),
};

describe("MetricsStrip", () => {
  it("renders skeleton while not settled", () => {
    act(() => {
      root.render(
        <MetricsStrip
          metrics={null}
          settled={false}
          hasError={false}
        />,
      );
    });
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
    // No metric labels yet.
    expect(container.textContent).not.toContain("Aceitação");
  });

  it("renders the resolved metrics", () => {
    act(() => {
      root.render(
        <MetricsStrip
          metrics={goodMetrics}
          settled
          hasError={false}
        />,
      );
    });
    expect(container.textContent).toContain("Aceitação");
    expect(container.textContent).toContain("83%");
    expect(container.textContent).toContain("Em revisão");
    expect(container.textContent).toContain("12");
    expect(container.textContent).toContain("Incertos");
    expect(container.textContent).toContain("4");
    expect(container.textContent).toContain("Disputados");
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("Fila entidades");
    expect(container.textContent).toContain("10");
  });

  it("R1 degrades to fallback queue counts with '—' on rates when hasError", () => {
    act(() => {
      root.render(
        <MetricsStrip
          metrics={null}
          settled
          hasError
          fallback={{ entityMatchQueueCount: 7, disputedQueueCount: 3 }}
        />,
      );
    });
    // Rates blanked with em-dash so the operator knows they're unavailable.
    expect(container.textContent).toContain("Aceitação");
    expect(container.textContent).toContain("—");
    // Queue totals derived from listReviewQueue per kind.
    expect(container.textContent).toContain("Fila entidades");
    expect(container.textContent).toContain("7");
    expect(container.textContent).toContain("Disputados");
    expect(container.textContent).toContain("3");
  });

  it("hasError without fallback stays in skeleton (advisory, never zeros)", () => {
    act(() => {
      root.render(
        <MetricsStrip
          metrics={null}
          settled
          hasError
        />,
      );
    });
    // No "0" labels misrepresenting unknown counts.
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull();
    expect(container.textContent).not.toContain("Aceitação");
  });
});
