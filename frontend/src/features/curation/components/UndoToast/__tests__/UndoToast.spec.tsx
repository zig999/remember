/**
 * UndoToast — render + countdown tests (TC-06).
 *
 * Why each test (Rule 9 — encode the WHY):
 *  - Initial render shows the label + the ceil(remaining/1000) value. If
 *    the renderer rounded the wrong way (floor), the user would see "4s"
 *    on a 4.999s-fresh toast — confusing for a 5-second-window UI.
 *  - The countdown decreases as wall-clock time advances. A static toast
 *    would mislead the user about how much time remained.
 *  - Clicking "Desfazer" invokes `onUndo` exactly once — the toast does
 *    NOT call sonner.dismiss itself (the controller owns that).
 *  - The aria-label on the countdown announces the seconds remaining for
 *    screen-reader users (§8 a11y).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { UndoToast, UNDO_WINDOW_MS } from "../UndoToast";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // The countdown reads Date.now() — pin it with fake timers so the test
  // is not flaky on slow CI runners.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-24T00:00:00.000Z"));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("UndoToast", () => {
  it("renders the label and the initial countdown", () => {
    const deadlineMs = Date.now() + UNDO_WINDOW_MS;
    act(() => {
      root.render(
        <UndoToast
          label="Item removido"
          deadlineMs={deadlineMs}
          onUndo={() => {}}
        />,
      );
    });
    expect(container.textContent).toContain("Item removido");
    // Initial render: exactly 5 seconds remaining (ceil of 5000ms / 1000).
    expect(container.textContent).toContain("5s");
  });

  it("decreases the countdown as time advances", () => {
    const deadlineMs = Date.now() + UNDO_WINDOW_MS;
    act(() => {
      root.render(
        <UndoToast
          label="Item removido"
          deadlineMs={deadlineMs}
          onUndo={() => {}}
        />,
      );
    });
    // Advance 1.2 seconds — ceil((5000 - 1200) / 1000) = 4.
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(container.textContent).toContain("4s");
    // Advance to within the last 0.5s — ceil((5000 - 4600) / 1000) = 1.
    act(() => {
      vi.advanceTimersByTime(3400);
    });
    expect(container.textContent).toContain("1s");
    // After deadline — clamps to 0, NOT negative.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.textContent).toContain("0s");
  });

  it("invokes onUndo exactly once when Desfazer is clicked", () => {
    const onUndo = vi.fn();
    act(() => {
      root.render(
        <UndoToast
          label="Item removido"
          deadlineMs={Date.now() + UNDO_WINDOW_MS}
          onUndo={onUndo}
        />,
      );
    });
    const button = container.querySelector(
      "button[aria-label='Desfazer ação']",
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    act(() => {
      button?.click();
    });
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("announces remaining seconds via aria-label on the countdown", () => {
    const deadlineMs = Date.now() + UNDO_WINDOW_MS;
    act(() => {
      root.render(
        <UndoToast
          label="Item removido"
          deadlineMs={deadlineMs}
          onUndo={() => {}}
        />,
      );
    });
    const countdown = container.querySelector(
      "[aria-label*='Tempo restante']",
    );
    expect(countdown).not.toBeNull();
    expect(countdown?.getAttribute("aria-label")).toContain("5 segundos");
  });
});
