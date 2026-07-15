/**
 * curation-page-parts regression tests (TC-001 round 2 — BUG-02).
 *
 * These tests exist to lock in the accessibility / testability contract
 * that `curation-page-parts.tsx` promises to the parent `CurationPage`
 * and to E2E specs. Every assertion here is intentionally a **contract**
 * that would silently break if someone dropped the props (`data-testid`,
 * `role`) when swapping the ui-kit primitives (`Empty`, `Alert`).
 *
 * Why each test exists (Rule 9 — encode the WHY):
 *  - T-05: The E2E and integration flows locate the empty state via
 *    `data-testid="curation-empty-queue"`. If someone re-wires `EmptyQueue`
 *    to a different primitive that swallows the `data-testid` spread,
 *    the AT/E2E lookup breaks silently — this test catches that.
 *  - T-06: The QueueErrorBanner is the sole feedback channel for a failed
 *    queue load (spec §2 UI-09). AT users depend on `role="alert"` for the
 *    live announcement, and E2E depends on
 *    `data-testid="curation-queue-error"`. Dropping either turns a failure
 *    into a silent void.
 *  - T-07: The retry control is what turns the banner into a recovery
 *    surface (not just a dead-end error). If the button loses its click
 *    handler or `data-testid`, retry becomes impossible without noise.
 *
 * Test harness: `react-dom/client` directly — matches the project's
 * standard (see `QueueItem.spec.tsx`), since `@testing-library/react` is
 * not in the project's deps.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  EmptyQueue,
  QueueErrorBanner,
} from "../components/curation-page-parts";

let container: HTMLDivElement;
let root: Root;

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

function render(el: ReactElement): void {
  act(() => {
    root.render(el);
  });
}

describe("EmptyQueue", () => {
  // T-05
  it("renders with data-testid='curation-empty-queue' (UI-07 contract)", () => {
    render(<EmptyQueue />);
    const empty = container.querySelector(
      '[data-testid="curation-empty-queue"]',
    );
    // If this fails, the E2E/integration selector for "empty queue" is
    // gone — the whole UI-07 empty state becomes invisible to automation.
    expect(empty).not.toBeNull();
    // Assert the copy is preserved so a silent copy change is caught.
    expect(container.textContent).toContain("Nada pendente");
  });
});

describe("QueueErrorBanner", () => {
  // T-06
  it("renders with data-testid='curation-queue-error' and role='alert' (UI-09 contract)", () => {
    render(<QueueErrorBanner onRetry={() => undefined} />);
    const banner = container.querySelector(
      '[data-testid="curation-queue-error"]',
    );
    // Missing testid = no E2E locator. Missing role=alert = no AT live
    // announcement. Either regression is a UI-09 failure.
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute("role")).toBe("alert");
    // Spec §2 UI-09 (v1.0.1) — full message required.
    expect(container.textContent).toContain(
      "Não foi possível carregar a fila. Tente novamente.",
    );
  });

  // T-07
  it("invokes onRetry when the retry control is clicked", () => {
    const onRetry = vi.fn();
    render(<QueueErrorBanner onRetry={onRetry} />);
    const retry = container.querySelector(
      '[data-testid="curation-queue-retry"]',
    ) as HTMLButtonElement | null;
    // Missing button = no path to recovery from a failed load.
    expect(retry).not.toBeNull();
    act(() => {
      retry!.click();
    });
    // Wiring the handler is the whole point of the prop — if this test
    // passes with 0 calls, the callback is silently dropped.
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
