/**
 * GraphEmptyState — unit tests (TC-FE-07).
 *
 * What these tests pin (Golden Rule 9 — verify intent):
 *  - The pt-BR copy is the literal contract from
 *    `GraphSpace.component.spec.md §3` and the plan §6.7. A regression
 *    that drifts the wording would silently change the user-visible
 *    state.
 *  - The component is text-only — no spinner, no overlay, no role
 *    pollution. We confirm the visual signal AND its absence.
 *  - `className` is forwarded so the parent can override layout (AC-F.13
 *    relies on the surrounding section, but the empty state itself must
 *    not fight inherited layout).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  GraphEmptyState,
  GRAPH_EMPTY_STATE_COPY,
} from "../GraphEmptyState";

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

describe("GraphEmptyState", () => {
  it("renders the spec-defined pt-BR copy (AC-F.13 — empty state)", () => {
    act(() => root.render(<GraphEmptyState />));
    // Pin the EXACT string — a refactor that drifts the wording loses
    // the spec contract.
    expect(container.textContent).toContain(GRAPH_EMPTY_STATE_COPY);
    // Sanity: the copy itself matches the canonical literal (catches a
    // regression where the exported constant is changed without
    // updating the spec).
    expect(GRAPH_EMPTY_STATE_COPY).toBe(
      "A memória aparecerá aqui conforme você conversa.",
    );
  });

  it("does NOT render a spinner or overlay status (Scenario 1 negative)", () => {
    act(() => root.render(<GraphEmptyState />));
    // No status role (those are owned by GraphStatusOverlay).
    expect(container.querySelector("[role=status]")).toBeNull();
    // No animate-spin class (the only spinner pattern in the codebase
    // uses lucide Loader2 + animate-spin — see ConversationMenu).
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("forwards `className` so parent layouts can override", () => {
    act(() =>
      root.render(<GraphEmptyState className="custom-empty-marker" />),
    );
    expect(
      container.querySelector(".custom-empty-marker"),
    ).not.toBeNull();
  });
});
