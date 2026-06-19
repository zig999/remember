/**
 * GlassSurface — unit tests (COMP-02).
 *
 * Why these tests exist (Golden Rule 9):
 *  - The Tailwind v4 dual-namespace border rule (CLAUDE.md "Known Gotchas",
 *    spec §10) is the single most error-prone part of the atom. If the
 *    `border` (width) class disappears from any accent variant, the border
 *    silently collapses to 0 with no runtime error. We pin BOTH halves for
 *    every accent.
 *  - The three-level composition (`ambient`/`panel`/`modal`) is the visible
 *    promise of the design system — silent renames break WCAG contrast.
 *    We pin the canonical class composition for every level.
 *  - The reduced-motion contract (§7.1) is the most subtle: `prefers-reduced-
 *    motion: reduce` MUST silence motion regardless of `animate=true`. We
 *    mock `useReducedMotion()` and assert that no Framer Motion variant
 *    attaches (no `data-motion-variant` attribute).
 *  - `accent="uncertain"` sets `data-glass-pulse="uncertain"` so the CSS
 *    keyframes in theme.css can drive the per-theme border-color pulse.
 *    The CSS `@media (prefers-reduced-motion: no-preference)` gate handles
 *    the reduced-motion case at the style layer — the data attribute is
 *    still set, the keyframes simply don't apply.
 *  - The React 19 ref-as-prop contract (§12) is enforced by types BUT could
 *    silently regress if someone wraps in `forwardRef`. Asserting that
 *    `ref.current` is the underlying `<div>` prevents that.
 *  - The `cn()` className merge contract (§11) is the only thing between
 *    consumers and string concat. We assert that an additive override
 *    (positioning + z-index) is appended without removing any glass class.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, useRef, useEffect, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GlassSurface } from "../GlassSurface";
import { glassSurface } from "../GlassSurface.variants";
import type { GlassAccent } from "../GlassSurface.types";

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

function render(element: ReactElement): void {
  act(() => {
    root.render(element);
  });
}

function getSurface(): HTMLDivElement {
  const el = container.querySelector("div[data-level]");
  if (!el) throw new Error("GlassSurface root <div> not found");
  return el as HTMLDivElement;
}

/* ---------- framer-motion useReducedMotion() mock ----------------------- */
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

/* ====================================================================== */
/*  §6.1 — Level ambient                                                  */
/* ====================================================================== */

describe("GlassSurface — level=ambient (§6.1)", () => {
  it("renders the canonical ambient composition + role='group'", () => {
    render(
      <GlassSurface level="ambient">
        <span>Header</span>
      </GlassSurface>,
    );
    const el = getSurface();
    // Canonical composition: "bg-surface-glass-ambient backdrop-blur-glass-sm
    // border border-border-glass shadow-sm rounded-none".
    expect(el.classList.contains("bg-surface-glass-ambient")).toBe(true);
    expect(el.classList.contains("backdrop-blur-glass-sm")).toBe(true);
    // Both halves of the border pair (CLAUDE.md "Known Gotchas").
    expect(el.classList.contains("border")).toBe(true);
    expect(el.classList.contains("border-border-glass")).toBe(true);
    expect(el.classList.contains("shadow-sm")).toBe(true);
    expect(el.classList.contains("rounded-none")).toBe(true);
    expect(el.getAttribute("role")).toBe("group");
    // Child is rendered as-is.
    expect(el.textContent).toBe("Header");
  });

  it("attaches NO motion variant even with animate=true (ambient is always static, §7)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<GlassSurface level="ambient" animate />);
    const el = getSurface();
    expect(el.getAttribute("data-motion-variant")).toBeNull();
  });
});

/* ====================================================================== */
/*  §6.2 — Level panel                                                     */
/* ====================================================================== */

describe("GlassSurface — level=panel (§6.2)", () => {
  it("renders the canonical panel composition + role='group'", () => {
    render(
      <GlassSurface level="panel">
        <p>Olá</p>
      </GlassSurface>,
    );
    const el = getSurface();
    expect(el.classList.contains("bg-surface-glass-panel")).toBe(true);
    expect(el.classList.contains("backdrop-blur-glass-md")).toBe(true);
    expect(el.classList.contains("border")).toBe(true);
    expect(el.classList.contains("border-border-glass")).toBe(true);
    expect(el.classList.contains("shadow-md")).toBe(true);
    expect(el.classList.contains("shadow-glass")).toBe(true);
    expect(el.classList.contains("rounded-lg")).toBe(true);
    expect(el.getAttribute("role")).toBe("group");
    expect(el.querySelector("p")?.textContent).toBe("Olá");
  });

  it("plays the glass-panel enter variant when animate=true + motion allowed (§6.2 motion BDD)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<GlassSurface level="panel" animate />);
    expect(getSurface().getAttribute("data-motion-variant")).toBe("glass-panel");
  });

  it("attaches NO motion variant when animate=false (§7)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<GlassSurface level="panel" animate={false} />);
    expect(getSurface().getAttribute("data-motion-variant")).toBeNull();
  });
});

/* ====================================================================== */
/*  §6.3 — Level modal                                                     */
/* ====================================================================== */

describe("GlassSurface — level=modal (§6.3)", () => {
  it("renders the canonical modal composition and forwards aria-labelledby", () => {
    render(
      <GlassSurface level="modal" aria-labelledby="dialog-title">
        <p>Body</p>
      </GlassSurface>,
    );
    const el = getSurface();
    expect(el.classList.contains("bg-surface-glass-modal")).toBe(true);
    expect(el.classList.contains("backdrop-blur-glass-lg")).toBe(true);
    expect(el.classList.contains("border")).toBe(true);
    expect(el.classList.contains("border-border-glass")).toBe(true);
    expect(el.classList.contains("shadow-lg")).toBe(true);
    expect(el.classList.contains("shadow-glass")).toBe(true);
    expect(el.classList.contains("rounded-xl")).toBe(true);
    expect(el.getAttribute("aria-labelledby")).toBe("dialog-title");
  });

  it("plays the glass-modal enter variant when animate=true + motion allowed (§6.3 motion BDD)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<GlassSurface level="modal" animate />);
    expect(getSurface().getAttribute("data-motion-variant")).toBe("glass-modal");
  });
});

/* ====================================================================== */
/*  §7.2 — Reduced motion                                                  */
/* ====================================================================== */

describe("GlassSurface — reduced-motion contract (§7.2)", () => {
  it("prefers-reduced-motion=reduce silences motion for level=modal regardless of animate=true", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(<GlassSurface level="modal" animate />);
    expect(getSurface().getAttribute("data-motion-variant")).toBeNull();
  });

  it("prefers-reduced-motion=reduce silences motion for level=panel regardless of animate=true", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(<GlassSurface level="panel" animate />);
    expect(getSurface().getAttribute("data-motion-variant")).toBeNull();
  });

  it("accent=uncertain + reduce → border-border-uncertain renders, CSS keyframes are silenced by @media gate", () => {
    useReducedMotionMock.mockReturnValue(true);
    render(<GlassSurface level="panel" accent="uncertain" animate />);
    const el = getSurface();
    // Border color class is present (static color).
    expect(el.classList.contains("border-border-uncertain")).toBe(true);
    expect(el.classList.contains("border")).toBe(true);
    // No Framer Motion enter variant for the panel itself.
    expect(el.getAttribute("data-motion-variant")).toBeNull();
    // The data-glass-pulse attribute IS still set; the CSS gate
    // `@media (prefers-reduced-motion: no-preference)` in theme.css is what
    // disables the keyframes when reduce is requested. The spec accepts this
    // because the CSS gate is the source of truth at the style layer.
    expect(el.getAttribute("data-glass-pulse")).toBe("uncertain");
  });
});

/* ====================================================================== */
/*  §6.4 — Accents (border-color overrides; width stays `border`)          */
/* ====================================================================== */

describe("GlassSurface — accent variants (§6.4)", () => {
  const ACCENT_CASES: ReadonlyArray<{
    accent: GlassAccent;
    expectedColorClass: string | null;
  }> = [
    { accent: "none", expectedColorClass: null }, // keeps default border-border-glass
    { accent: "accepted", expectedColorClass: "border-border-accepted" },
    { accent: "uncertain", expectedColorClass: "border-border-uncertain" },
    { accent: "disputed", expectedColorClass: "border-border-disputed" },
    { accent: "superseded", expectedColorClass: "border-border-superseded" },
    { accent: "focus", expectedColorClass: "border-border-focus" },
    { accent: "error", expectedColorClass: "border-border-error" },
  ];

  for (const { accent, expectedColorClass } of ACCENT_CASES) {
    it(`accent="${accent}" always emits the 'border' width class`, () => {
      render(<GlassSurface level="panel" accent={accent} />);
      const el = getSurface();
      // Tailwind v4 dual-namespace: width class MUST be present in every accent.
      expect(el.classList.contains("border")).toBe(true);
      if (expectedColorClass !== null) {
        expect(el.classList.contains(expectedColorClass)).toBe(true);
      }
    });
  }

  it("accent='none' (default) keeps border-border-glass", () => {
    render(<GlassSurface level="panel" accent="none" />);
    const el = getSurface();
    expect(el.classList.contains("border-border-glass")).toBe(true);
    expect(el.classList.contains("border")).toBe(true);
  });

  it("accent='focus' adds the inner ring (composition: color + ring) — §6.4 / §15", () => {
    render(<GlassSurface level="panel" accent="focus" />);
    const el = getSurface();
    expect(el.classList.contains("border-border-focus")).toBe(true);
    expect(el.classList.contains("ring-2")).toBe(true);
    expect(el.classList.contains("ring-border-focus")).toBe(true);
    // Width class always present.
    expect(el.classList.contains("border")).toBe(true);
  });

  it("accent='uncertain' sets data-glass-pulse='uncertain' (CSS keyframes driver, §8)", () => {
    useReducedMotionMock.mockReturnValue(false);
    render(<GlassSurface level="panel" accent="uncertain" />);
    const el = getSurface();
    expect(el.getAttribute("data-glass-pulse")).toBe("uncertain");
    expect(el.classList.contains("border-border-uncertain")).toBe(true);
  });

  it("non-uncertain accents do NOT set data-glass-pulse", () => {
    render(<GlassSurface level="panel" accent="accepted" />);
    expect(getSurface().getAttribute("data-glass-pulse")).toBeNull();
  });
});

/* ====================================================================== */
/*  §6.5 — Radius override                                                 */
/* ====================================================================== */

describe("GlassSurface — radius override (§6.5)", () => {
  it("override 'rounded-xl' wins over the panel default 'rounded-lg' via tailwind-merge", () => {
    render(<GlassSurface level="panel" radius="rounded-xl" />);
    const el = getSurface();
    expect(el.classList.contains("rounded-xl")).toBe(true);
    expect(el.classList.contains("rounded-lg")).toBe(false);
  });

  it("no override → uses the per-level default radius", () => {
    render(<GlassSurface level="modal" />);
    expect(getSurface().classList.contains("rounded-xl")).toBe(true);
  });
});

/* ====================================================================== */
/*  §11 — cn() className merge contract                                    */
/* ====================================================================== */

describe("GlassSurface — cn() className merge (§11)", () => {
  it("consumer className 'absolute inset-0 z-panel p-lg' is additive alongside glass classes (§11.1)", () => {
    render(<GlassSurface level="panel" className="absolute inset-0 z-panel p-lg" />);
    const el = getSurface();
    // Glass composition preserved.
    expect(el.classList.contains("bg-surface-glass-panel")).toBe(true);
    expect(el.classList.contains("backdrop-blur-glass-md")).toBe(true);
    expect(el.classList.contains("border")).toBe(true);
    expect(el.classList.contains("border-border-glass")).toBe(true);
    expect(el.classList.contains("shadow-md")).toBe(true);
    expect(el.classList.contains("shadow-glass")).toBe(true);
    expect(el.classList.contains("rounded-lg")).toBe(true);
    // Consumer additions present.
    expect(el.classList.contains("absolute")).toBe(true);
    expect(el.classList.contains("inset-0")).toBe(true);
    expect(el.classList.contains("z-panel")).toBe(true);
    expect(el.classList.contains("p-lg")).toBe(true);
  });
});

/* ====================================================================== */
/*  §12 — React 19 ref-as-prop                                             */
/* ====================================================================== */

describe("GlassSurface — React 19 ref-as-prop (§12)", () => {
  it("ref.current is the underlying HTMLDivElement (§12.1)", () => {
    let captured: HTMLDivElement | null = null;

    function Consumer(): ReactElement {
      const r = useRef<HTMLDivElement>(null);
      useEffect(() => {
        captured = r.current;
      }, []);
      return <GlassSurface level="panel" ref={r} />;
    }

    render(<Consumer />);

    expect(captured).not.toBeNull();
    expect(captured!.tagName).toBe("DIV");
    expect(captured!.getAttribute("data-level")).toBe("panel");
  });

  it("supports a callback ref", () => {
    let captured: HTMLDivElement | null = null;
    const cb = (node: HTMLDivElement | null): void => {
      captured = node;
    };
    render(<GlassSurface level="modal" ref={cb} />);
    expect(captured).not.toBeNull();
    expect(captured!.getAttribute("data-level")).toBe("modal");
  });
});

/* ====================================================================== */
/*  Spread / passthrough — id, data-*, onClick                             */
/* ====================================================================== */

describe("GlassSurface — props pass-through", () => {
  it("spreads ...rest onto the underlying <div> (id, data-* preserved)", () => {
    render(
      <GlassSurface level="panel" id="my-panel" data-testid="surface-x" />,
    );
    const el = getSurface();
    expect(el.id).toBe("my-panel");
    expect(el.getAttribute("data-testid")).toBe("surface-x");
  });

  it("forwards onClick to the underlying <div>", () => {
    const onClick = vi.fn();
    render(<GlassSurface level="panel" onClick={onClick} />);
    const el = getSurface();
    act(() => {
      el.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("accepts role override (e.g., role='region') — §14", () => {
    render(<GlassSurface level="panel" role="region" aria-label="Painel" />);
    const el = getSurface();
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Painel");
  });
});

/* ====================================================================== */
/*  CVA factory — pure-output sanity (regression guard for §10)            */
/* ====================================================================== */

describe("GlassSurface — CVA factory (regression guard, §10)", () => {
  // Pinning the CVA output (vs the DOM) ensures the base class never loses
  // the `border` width half — a silent regression that would only surface
  // as a "border disappeared" visual bug.
  it("always emits the 'border' width class regardless of accent", () => {
    const accents: GlassAccent[] = [
      "none",
      "accepted",
      "uncertain",
      "disputed",
      "superseded",
      "focus",
      "error",
    ];
    for (const accent of accents) {
      const out = glassSurface({ level: "panel", accent });
      expect(out.split(/\s+/)).toContain("border");
    }
  });

  it("accent='none' keeps border-border-glass in the output", () => {
    const out = glassSurface({ level: "panel", accent: "none" });
    expect(out.split(/\s+/)).toContain("border-border-glass");
  });

  it("accent='focus' includes both the color class and the inner ring", () => {
    const out = glassSurface({ level: "panel", accent: "focus" });
    const tokens = out.split(/\s+/);
    expect(tokens).toContain("border-border-focus");
    expect(tokens).toContain("ring-2");
    expect(tokens).toContain("ring-border-focus");
  });
});
