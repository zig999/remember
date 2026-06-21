/**
 * GraphStatusOverlay — unit tests (TC-FE-07).
 *
 * What these tests pin (Golden Rule 9 — verify intent):
 *  - LOADING: "Buscando na memória…" + spinner + `aria-live="polite"`
 *    (AC-F.13, GraphSpace.component.spec.md §8). Drifting any of these
 *    breaks the SR announcement contract or the visible cue.
 *  - ERROR (no message): default pt-BR sentence — exposes a meaningful
 *    blurb instead of an empty panel when the backend sends `error`
 *    without an attached message.
 *  - ERROR (with message): the supplied message wins — confirms the
 *    branching logic.
 *  - NO retry button (I-6): a button anywhere in the overlay would
 *    invite a chat write, violating REQ-6 / AC-U.3. We negate that.
 *  - GlassSurface composition: the overlay re-uses the design-system
 *    glass material, never reinvents it (project rule: prefer composition
 *    over reinvention).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  GraphStatusOverlay,
  GRAPH_STATUS_ERROR_DEFAULT_COPY,
  GRAPH_STATUS_LOADING_COPY,
} from "../GraphStatusOverlay";

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

describe("GraphStatusOverlay — loading variant", () => {
  it("renders 'Buscando na memória…' + spinner (AC-F.13 loading)", () => {
    act(() => root.render(<GraphStatusOverlay variant="loading" />));
    // Copy contract — pin the exact string + the exported constant link.
    expect(container.textContent).toContain(GRAPH_STATUS_LOADING_COPY);
    expect(GRAPH_STATUS_LOADING_COPY).toBe("Buscando na memória…");
    // Spinner — Loader2 from lucide gets `animate-spin`.
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("sets aria-live='polite' and role='status' for SR announcement (AC-A.1)", () => {
    act(() => root.render(<GraphStatusOverlay variant="loading" />));
    const overlay = container.querySelector(
      '[data-testid="graph-status-overlay"]',
    );
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute("aria-live")).toBe("polite");
    expect(overlay?.getAttribute("role")).toBe("status");
    expect(overlay?.getAttribute("data-variant")).toBe("loading");
  });

  it("does NOT render a retry button (I-6 — informational only)", () => {
    act(() => root.render(<GraphStatusOverlay variant="loading" />));
    expect(container.querySelector("button")).toBeNull();
  });
});

describe("GraphStatusOverlay — error variant", () => {
  it("renders the supplied errorMessage (AC-F.13 error)", () => {
    act(() =>
      root.render(
        <GraphStatusOverlay
          variant="error"
          errorMessage="Ferramenta falhou."
        />,
      ),
    );
    expect(container.textContent).toContain("Ferramenta falhou.");
    // Loading copy must NOT bleed through.
    expect(container.textContent).not.toContain(GRAPH_STATUS_LOADING_COPY);
  });

  it("falls back to default pt-BR sentence when errorMessage is undefined", () => {
    act(() => root.render(<GraphStatusOverlay variant="error" />));
    expect(container.textContent).toContain(GRAPH_STATUS_ERROR_DEFAULT_COPY);
  });

  it("does NOT render a retry button (I-6 — informational only)", () => {
    act(() =>
      root.render(
        <GraphStatusOverlay
          variant="error"
          errorMessage="Algo deu errado."
        />,
      ),
    );
    expect(container.querySelector("button")).toBeNull();
  });

  it("hides the spinner (spinner is loading-only)", () => {
    act(() =>
      root.render(<GraphStatusOverlay variant="error" errorMessage="x" />),
    );
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("sets the error glass accent for visual differentiation", () => {
    act(() =>
      root.render(<GraphStatusOverlay variant="error" errorMessage="x" />),
    );
    // GlassSurface emits `data-accent` from the `accent` prop (§3).
    const glass = container.querySelector('[data-level="panel"]');
    expect(glass?.getAttribute("data-accent")).toBe("error");
  });
});
