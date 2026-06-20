/**
 * ToolCallChip — unit tests (TC-10).
 *
 * Why these tests exist (Golden Rule 9):
 *  - The chip's three states (pending / ok / error) are the ONLY observable
 *    contract callers depend on — a regression that lands the wrong icon or
 *    wrong aria-label silently misinforms the operator about a tool call's
 *    outcome. A snapshot would not catch a swapped aria-label; we assert each
 *    label verbatim instead.
 *  - The aria-label format ('{tool} — {status}' in pt-BR) is a WCAG 2.2 AA
 *    promise (TC-10 §Constraints). A typo or stripped accent silently
 *    degrades screen-reader output and is invisible to typecheck.
 *  - argsSummary is optional in spirit (empty string suppresses the span);
 *    keeping it pinned avoids a regression that always shows an empty
 *    metadata field next to the tool name.
 *
 * Test strategy:
 *  Direct `createRoot()` + `act()` render — same pattern as Composer.spec.tsx
 *  to stay vitest-only (no React Testing Library dependency). Component is a
 *  pure leaf (no hooks, no providers) so the harness stays minimal.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ToolCallChip } from "../ToolCallChip";

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

function find<T extends Element = Element>(testId: string): T {
  const el = container.querySelector(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`testId not found: ${testId}`);
  return el as T;
}

describe("ToolCallChip — pending state (ok === null)", () => {
  it("renders the spinning loader and the 'em andamento' aria-label", () => {
    act(() =>
      root.render(
        <ToolCallChip
          chip={{ tool: "search", argsSummary: "q='rodrigo'", ok: null }}
        />,
      ),
    );

    const chip = find("tool-call-chip");
    expect(chip.getAttribute("aria-label")).toBe("search — em andamento");
    expect(chip.getAttribute("data-state")).toBe("pending");

    // lucide-react Loader2 renders an SVG with `lucide-loader2` class and the
    // `animate-spin` utility — pin both to catch icon swaps.
    const svg = chip.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.classList.contains("animate-spin")).toBe(true);
  });
});

describe("ToolCallChip — success state (ok === true)", () => {
  it("renders the check-circle icon and the 'concluído' aria-label", () => {
    act(() =>
      root.render(
        <ToolCallChip
          chip={{ tool: "search", argsSummary: "", ok: true }}
        />,
      ),
    );

    const chip = find("tool-call-chip");
    expect(chip.getAttribute("aria-label")).toBe("search — concluído");
    expect(chip.getAttribute("data-state")).toBe("ok");

    const svg = chip.querySelector("svg");
    expect(svg).not.toBeNull();
    // Success uses the accepted state token (green).
    expect(svg?.classList.contains("text-state-accepted")).toBe(true);
    // Pending spinner must NOT be present.
    expect(svg?.classList.contains("animate-spin")).toBe(false);
  });

  it("omits the argsSummary span when argsSummary is empty", () => {
    act(() =>
      root.render(
        <ToolCallChip
          chip={{ tool: "search", argsSummary: "", ok: true }}
        />,
      ),
    );
    const chip = find("tool-call-chip");
    // Two visible children: icon + tool name span. No third span for args.
    const spans = chip.querySelectorAll("span");
    // chip itself is a span -> querySelectorAll picks the nested ones only.
    // Tool name span = 1 (the args span is omitted).
    expect(spans.length).toBe(1);
    expect(spans[0]?.textContent).toBe("search");
  });
});

describe("ToolCallChip — error state (ok === false)", () => {
  it("renders the x-circle icon and the 'erro' aria-label", () => {
    act(() =>
      root.render(
        <ToolCallChip
          chip={{ tool: "search", argsSummary: "q='rodrigo'", ok: false }}
        />,
      ),
    );

    const chip = find("tool-call-chip");
    expect(chip.getAttribute("aria-label")).toBe("search — erro");
    expect(chip.getAttribute("data-state")).toBe("error");

    const svg = chip.querySelector("svg");
    expect(svg).not.toBeNull();
    // Error uses the disputed state token (orange — distinct from amber).
    expect(svg?.classList.contains("text-state-disputed")).toBe(true);
  });

  it("renders the argsSummary span when argsSummary is non-empty", () => {
    act(() =>
      root.render(
        <ToolCallChip
          chip={{ tool: "search", argsSummary: "q='rodrigo'", ok: false }}
        />,
      ),
    );
    const chip = find("tool-call-chip");
    // textContent of the chip joins tool name + argsSummary; assert both
    // tokens are present (the wrapping is whitespace-insensitive in jsdom).
    expect(chip.textContent).toContain("search");
    expect(chip.textContent).toContain("q='rodrigo'");
  });
});

describe("ToolCallChip — className composition", () => {
  it("merges a consumer-provided className with the base classes", () => {
    act(() =>
      root.render(
        <ToolCallChip
          chip={{ tool: "search", argsSummary: "", ok: true }}
          className="extra-class"
        />,
      ),
    );
    const chip = find("tool-call-chip");
    expect(chip.classList.contains("extra-class")).toBe(true);
    // Base class still present (rounded-pill is part of the chip base).
    expect(chip.classList.contains("rounded-pill")).toBe(true);
  });
});
