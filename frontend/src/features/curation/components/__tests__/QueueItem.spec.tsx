/**
 * QueueItem render tests (TC-04).
 *
 * Uses the project's standard test harness — `react-dom/client` directly
 * (no `@testing-library/react`, which is not in the project's deps; see
 * `GlassSurface.spec.tsx` for the canonical pattern).
 *
 * Why each test exists (Rule 9 — encode the WHY):
 *  - role="option" + aria-selected: §8 accessibility — QA gate. Without
 *    those attributes the listbox does not announce selection to AT;
 *    a curator using a screen reader would lose orientation.
 *  - aria-current ONLY when selected: the spec distinguishes "in list"
 *    (option) from "currently in DecisionPanel" (current). Marking
 *    every row current would be useless to AT.
 *  - click dispatches onSelect with the correct composite key: this is
 *    the integration point between QueueList and the page-level
 *    selection action — wrong key = wrong item selected on deep-link.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueueItem } from "../QueueItem";
import type { EntityMatchQueueItem } from "../../types";

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

function getOption(): HTMLButtonElement {
  const el = container.querySelector("[role=option]");
  if (!el) throw new Error("QueueItem option button not found");
  return el as HTMLButtonElement;
}

function buildEntityItem(): EntityMatchQueueItem {
  return {
    kind: "entity_match",
    nodeId: "n1",
    nodeType: "Person",
    canonicalName: "Maria Silva",
    candidates: [],
    createdAt: new Date(Date.now() - 5 * 60_000),
  };
}

describe("QueueItem", () => {
  it("renders as role=option with canonical name", () => {
    render(
      <QueueItem
        item={buildEntityItem()}
        itemKey={{ kind: "entity_match", id: "n1" }}
        selected={false}
        onSelect={() => undefined}
      />,
    );
    const option = getOption();
    expect(option.getAttribute("aria-selected")).toBe("false");
    expect(option.getAttribute("aria-current")).toBeNull();
    expect(container.textContent).toContain("Maria Silva");
  });

  it("sets aria-selected and aria-current when selected", () => {
    render(
      <QueueItem
        item={buildEntityItem()}
        itemKey={{ kind: "entity_match", id: "n1" }}
        selected
        onSelect={() => undefined}
      />,
    );
    const option = getOption();
    expect(option.getAttribute("aria-selected")).toBe("true");
    // aria-current is what AT announces as "this is the item being
    // worked on now" — without this the spec §8 a11y requirement fails.
    expect(option.getAttribute("aria-current")).toBe("true");
  });

  it("invokes onSelect with the composite key on click", () => {
    const onSelect = vi.fn();
    render(
      <QueueItem
        item={buildEntityItem()}
        itemKey={{ kind: "entity_match", id: "n1" }}
        selected={false}
        onSelect={onSelect}
      />,
    );
    act(() => {
      getOption().click();
    });
    // Wrong key here would silently navigate to the wrong item on
    // deep-link share — exactly the kind of regression Rule 9 targets.
    expect(onSelect).toHaveBeenCalledWith({ kind: "entity_match", id: "n1" });
  });
});
