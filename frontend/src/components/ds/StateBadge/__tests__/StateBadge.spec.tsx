/**
 * StateBadge — unit tests (COMP-01).
 *
 * Why these tests exist (Golden Rule 9):
 *  - The five-state vocabulary is the visible promise of "confiança explícita
 *    — incerteza nunca é escondida" (frontend-analise-funcional.md §1, §9).
 *    Each state's bg/text/border class triplet is the SPEC — a silent rename
 *    of a Tailwind utility breaks WCAG contrast and the design system
 *    simultaneously, and there is no upstream check that catches it.
 *  - The `aria-label` contract is the WCAG 2.2 AA gate (§9). The test pins
 *    the exact "Estado de confiança: <label>" string because screen-reader
 *    output is the primary discoverability path for non-sighted operators.
 *  - The reduced-motion contract (§7.2) is the most subtle one: motion is
 *    silenced AT THE COMPONENT LEVEL via useReducedMotion(), independently
 *    of the CSS @media gate. The test mocks useReducedMotion() to assert
 *    that the component honours the user-agent signal.
 *  - The React 19 ref-as-prop contract (§10) is enforced by the type system
 *    BUT can be silently lost if a future maintainer wraps with forwardRef.
 *    Asserting that ref.current is the root HTMLSpanElement prevents that.
 *  - The `cn()` className merge contract (§11) is the only thing standing
 *    between consumers and `className` string concat — we assert that a
 *    consumer override (`rounded-md`) wins via tailwind-merge while the
 *    state's bg/text classes are preserved.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useRef, useEffect } from "react";
import { StateBadge } from "../StateBadge";
import type { ConfidenceState } from "../StateBadge.types";

/* ---------- minimal render harness (no @testing-library/react needed) ---- */

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

function render(element: React.ReactElement): void {
  act(() => {
    root.render(element);
  });
}

function rerender(element: React.ReactElement): void {
  act(() => {
    root.render(element);
  });
}

function getBadge(): HTMLSpanElement {
  const el = container.querySelector("span[aria-label]");
  if (!el) throw new Error("StateBadge root <span> not found");
  return el as HTMLSpanElement;
}

/* ---------- framer-motion useReducedMotion() mock ----------------------- */
// Default: motion ALLOWED (returns false). Individual tests override.
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

import { useReducedMotion } from "framer-motion";
const useReducedMotionMock = vi.mocked(useReducedMotion);

beforeEach(() => {
  useReducedMotionMock.mockReturnValue(false);
});

/* ---------- state catalogue under test --------------------------------- */

const STATES: ReadonlyArray<{
  state: ConfidenceState;
  label: string;
  bgClass: string;
  fgClass: string;
  borderColorClass: string;
}> = [
  {
    state: "accepted",
    label: "Aceito",
    bgClass: "bg-state-accepted",
    fgClass: "text-state-accepted-fg",
    borderColorClass: "border-border-accepted",
  },
  {
    state: "uncertain",
    label: "Incerto",
    bgClass: "bg-state-uncertain",
    fgClass: "text-state-uncertain-fg",
    borderColorClass: "border-border-uncertain",
  },
  {
    state: "low-confidence",
    label: "Baixa confiança",
    bgClass: "bg-state-low-confidence",
    fgClass: "text-state-low-confidence-fg",
    // §6.3 — neutral default, intentionally no state-specific border colour.
    borderColorClass: "border-border",
  },
  {
    state: "disputed",
    label: "Em disputa",
    bgClass: "bg-state-disputed",
    fgClass: "text-state-disputed-fg",
    borderColorClass: "border-border-disputed",
  },
  {
    state: "superseded",
    label: "Superado",
    bgClass: "bg-state-superseded",
    fgClass: "text-state-superseded-fg",
    borderColorClass: "border-border-superseded",
  },
];

/* ====================================================================== */
/*  §6 — Per-state rendering                                              */
/* ====================================================================== */

describe("StateBadge — per-state rendering (§6.1–§6.5)", () => {
  for (const { state, label, bgClass, fgClass, borderColorClass } of STATES) {
    it(`renders state="${state}" with the canonical bg/fg/border token classes and pt-BR label`, () => {
      render(<StateBadge state={state} />);
      const badge = getBadge();

      expect(badge.tagName).toBe("SPAN");
      // Both halves of the border pair MUST be present (CLAUDE.md Known Gotcha).
      expect(badge.classList.contains("border")).toBe(true);
      expect(badge.classList.contains(borderColorClass)).toBe(true);
      expect(badge.classList.contains(bgClass)).toBe(true);
      expect(badge.classList.contains(fgClass)).toBe(true);
      // Radius (§5) — both sizes use rounded-pill.
      expect(badge.classList.contains("rounded-pill")).toBe(true);
      // Visible label rendered as plain text node.
      expect(badge.textContent).toBe(label);
      // aria-label is the WCAG 2.2 AA gate (§9).
      expect(badge.getAttribute("aria-label")).toBe(`Estado de confiança: ${label}`);
    });
  }

  it("renders the size='sm' classes by default (text-xs p-xs gap-xs)", () => {
    render(<StateBadge state="accepted" />);
    const badge = getBadge();
    expect(badge.classList.contains("text-xs")).toBe(true);
    expect(badge.classList.contains("p-xs")).toBe(true);
    expect(badge.classList.contains("gap-xs")).toBe(true);
  });

  it("renders the size='md' classes (text-xs p-sm gap-sm) when size='md'", () => {
    render(<StateBadge state="accepted" size="md" />);
    const badge = getBadge();
    expect(badge.classList.contains("text-xs")).toBe(true);
    expect(badge.classList.contains("p-sm")).toBe(true);
    expect(badge.classList.contains("gap-sm")).toBe(true);
  });

  it("renders the lucide icon with aria-hidden='true' (§9 — decorative)", () => {
    render(<StateBadge state="accepted" />);
    const badge = getBadge();
    const icon = badge.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute("aria-hidden")).toBe("true");
  });

  it("hides the visible label when iconOnly=true but keeps the aria-label", () => {
    render(<StateBadge state="disputed" iconOnly />);
    const badge = getBadge();
    // The visible label <span> is omitted; the badge's textContent is empty
    // (the SVG icon contributes no text).
    expect(badge.textContent).toBe("");
    // aria-label still present — full label exposed to screen readers.
    expect(badge.getAttribute("aria-label")).toBe("Estado de confiança: Em disputa");
  });

  it("uses the consumer-supplied label when `label` prop is provided", () => {
    render(<StateBadge state="accepted" label="Validado" />);
    const badge = getBadge();
    expect(badge.textContent).toBe("Validado");
    expect(badge.getAttribute("aria-label")).toBe("Estado de confiança: Validado");
  });
});

/* ====================================================================== */
/*  §7 — Motion contract                                                  */
/* ====================================================================== */

describe("StateBadge — motion contract (§7)", () => {
  it("uncertain + animate=true + motion allowed → exposes data-motion-variant='pulse.uncertain'", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<StateBadge state="uncertain" animate />);
    const badge = getBadge();
    expect(badge.getAttribute("data-motion-variant")).toBe("pulse.uncertain");
  });

  it("uncertain + prefers-reduced-motion=reduce → no motion variant attached", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(<StateBadge state="uncertain" animate />);
    const badge = getBadge();
    expect(badge.getAttribute("data-motion-variant")).toBeNull();
  });

  it("uncertain + animate=false → no motion variant attached (animate is necessary but not sufficient)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<StateBadge state="uncertain" animate={false} />);
    const badge = getBadge();
    expect(badge.getAttribute("data-motion-variant")).toBeNull();
  });

  it("uncertain → accepted transition exposes data-motion-variant='promote' (one-shot, §7.3)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<StateBadge state="uncertain" animate />);
    // First render = ambient pulse (no transition).
    expect(getBadge().getAttribute("data-motion-variant")).toBe("pulse.uncertain");
    rerender(<StateBadge state="accepted" animate />);
    expect(getBadge().getAttribute("data-motion-variant")).toBe("promote");
  });

  it("any → superseded transition exposes data-motion-variant='supersede' (one-shot)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<StateBadge state="accepted" animate />);
    expect(getBadge().getAttribute("data-motion-variant")).toBeNull(); // accepted is static
    rerender(<StateBadge state="superseded" animate />);
    expect(getBadge().getAttribute("data-motion-variant")).toBe("supersede");
  });

  it("animate=true + prefers-reduced-motion=reduce on a state change → no transition variant runs", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(<StateBadge state="uncertain" animate />);
    rerender(<StateBadge state="accepted" animate />);
    expect(getBadge().getAttribute("data-motion-variant")).toBeNull();
  });

  it("accepted state (resting) has no motion variant attached", () => {
    render(<StateBadge state="accepted" />);
    expect(getBadge().getAttribute("data-motion-variant")).toBeNull();
  });

  it("low-confidence and disputed states have no motion variant attached (§6.3, §6.4)", () => {
    render(<StateBadge state="low-confidence" />);
    expect(getBadge().getAttribute("data-motion-variant")).toBeNull();
    rerender(<StateBadge state="disputed" />);
    expect(getBadge().getAttribute("data-motion-variant")).toBeNull();
  });
});

/* ====================================================================== */
/*  §10 — React 19 ref-as-prop                                            */
/* ====================================================================== */

describe("StateBadge — React 19 ref-as-prop (§10)", () => {
  it("forwards ref to the root <span> element", () => {
    let captured: HTMLSpanElement | null = null;

    function Consumer(): React.ReactElement {
      const r = useRef<HTMLSpanElement>(null);
      useEffect(() => {
        captured = r.current;
      }, []);
      return <StateBadge state="accepted" ref={r} />;
    }

    render(<Consumer />);

    expect(captured).not.toBeNull();
    expect(captured!.tagName).toBe("SPAN");
    // The captured node IS the root badge (carries aria-label).
    expect(captured!.getAttribute("aria-label")).toBe("Estado de confiança: Aceito");
  });

  it("supports a callback ref", () => {
    let captured: HTMLSpanElement | null = null;
    const cb = (node: HTMLSpanElement | null): void => {
      captured = node;
    };
    render(<StateBadge state="disputed" ref={cb} />);
    expect(captured).not.toBeNull();
    expect(captured!.getAttribute("aria-label")).toBe("Estado de confiança: Em disputa");
  });
});

/* ====================================================================== */
/*  §11 — cn() className merge contract                                   */
/* ====================================================================== */

describe("StateBadge — cn() className merge (§11)", () => {
  it("consumer className='rounded-md shadow-md' overrides rounded-pill but retains state bg", () => {
    render(<StateBadge state="accepted" className="rounded-md shadow-md" />);
    const badge = getBadge();
    // tailwind-merge resolves the radius conflict in favour of the consumer's class.
    expect(badge.classList.contains("rounded-md")).toBe(true);
    expect(badge.classList.contains("rounded-pill")).toBe(false);
    // Non-conflicting additive class is preserved.
    expect(badge.classList.contains("shadow-md")).toBe(true);
    // Underlying state tokens unchanged (no conflict).
    expect(badge.classList.contains("bg-state-accepted")).toBe(true);
    expect(badge.classList.contains("text-state-accepted-fg")).toBe(true);
  });

  it("supports undefined className (no-op merge)", () => {
    render(<StateBadge state="accepted" />);
    const badge = getBadge();
    // Default rounded-pill survives when no consumer className is provided.
    expect(badge.classList.contains("rounded-pill")).toBe(true);
  });
});
