// @vitest-environment node
/**
 * Tests for `lib/motion.ts` — the six canonical Framer Motion variants
 * (tokens.md §11.2, front.md §9, front.back.md BR-10).
 *
 * Why these tests exist (Golden Rule 9):
 *  - StateBadge, GlassSurface and the graph layer all consume these
 *    variants — a silent rename or a dropped variant means the consuming
 *    component runs with `undefined` and Framer Motion logs a warning then
 *    no-ops. The visible state change is gone, but the test suite would
 *    pass. These tests pin the contract.
 *  - Framer Motion drives animation in JS (WAAPI), which requires a NUMERIC
 *    `duration` (seconds) and a cubic-bezier tuple for `ease`. A CSS
 *    `var(--…)` string makes `duration` non-numeric and throws
 *    "duration must be non-negative" in a real browser — a path jsdom does
 *    NOT exercise. So these tests assert every `duration` is a finite number
 *    >= 0 and every `ease` is a 4-number tuple, mirroring `tokens.md §11.1`.
 *    That is the regression guard that the prior (var-string) tests lacked.
 *  - The reduced-motion gate is the WCAG 2.2 AA gate — when reducedMotion
 *    is true, every variant MUST collapse to a zero-duration transition.
 */
import { describe, it, expect } from "vitest";
import {
  motion,
  pulseUncertain,
  transitionPromote,
  transitionSupersede,
  transitionMerge,
  transitionGlassPanel,
  transitionGlassModal,
} from "../motion";

/* ---------- canonical token mirror (tokens.md §11.1, in seconds) ---------- */

const D = {
  fast: 0.2,
  moderate: 0.3,
  entrance: 0.5,
  instant: 0.1,
  pulse: 2.4,
} as const;
const E = {
  out: [0.25, 1, 0.5, 1],
  in: [0.7, 0, 0.84, 0],
  inOut: [0.65, 0, 0.35, 1],
  outQuint: [0.22, 1, 0.36, 1],
  outExpo: [0.16, 1, 0.3, 1],
} as const;

/* ---------- helpers ---------- */

/**
 * Walk the whole variant tree and assert every `duration` / `ease` is in the
 * shape Framer Motion's WAAPI path accepts. This is the guard that fails fast
 * in jsdom for the bug that otherwise only throws in a real browser:
 *  - `duration` MUST be a finite number >= 0 (never a string like
 *    "var(--duration-pulse)" or "200ms", never NaN).
 *  - `ease`, when present, MUST be a 4-number cubic-bezier tuple (never a
 *    CSS var string).
 */
function assertFramerNumeric(variantTree: unknown): void {
  function walk(o: unknown): void {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (k === "duration") {
        expect(typeof v, `duration must be a number, got ${typeof v}: ${String(v)}`).toBe("number");
        expect(Number.isFinite(v as number)).toBe(true);
        expect(v as number).toBeGreaterThanOrEqual(0);
      } else if (k === "ease") {
        expect(Array.isArray(v), `ease must be a bezier tuple, got ${String(v)}`).toBe(true);
        const arr = v as unknown[];
        expect(arr).toHaveLength(4);
        for (const n of arr) expect(typeof n).toBe("number");
      } else {
        walk(v);
      }
    }
  }
  walk(variantTree);
}

/* ---------- index ---------- */

describe("motion (canonical-name index)", () => {
  it("exposes all six variants by their tokens.md §11.2 names", () => {
    expect(motion.pulse.uncertain).toBe(pulseUncertain);
    expect(motion.transition.promote).toBe(transitionPromote);
    expect(motion.transition.supersede).toBe(transitionSupersede);
    expect(motion.transition.merge).toBe(transitionMerge);
    expect(motion.transition["glass-panel"]).toBe(transitionGlassPanel);
    expect(motion.transition["glass-modal"]).toBe(transitionGlassModal);
  });

  it("every named variant is a function (factory)", () => {
    const factories: unknown[] = [
      motion.pulse.uncertain,
      motion.transition.promote,
      motion.transition.supersede,
      motion.transition.merge,
      motion.transition["glass-panel"],
      motion.transition["glass-modal"],
    ];
    for (const f of factories) expect(typeof f).toBe("function");
  });
});

/* ---------- pulseUncertain ---------- */

describe("pulseUncertain()", () => {
  it("loops infinitely when motion is allowed", () => {
    const v = pulseUncertain(false);
    const visible = v.visible as Record<string, unknown>;
    const transition = visible.transition as Record<string, unknown>;
    expect(transition.repeat).toBe(Infinity);
    // Opacity keyframes 1 → 0.55 → 1.
    expect(visible.opacity).toEqual([1, 0.55, 1]);
  });

  it("uses a numeric duration + bezier ease mirroring tokens (Framer-safe)", () => {
    const v = pulseUncertain(false);
    const transition = (v.visible as Record<string, unknown>).transition as Record<string, unknown>;
    expect(transition.duration).toBe(D.pulse);
    expect(transition.ease).toEqual(E.inOut);
    assertFramerNumeric(v);
  });

  it("collapses to a static visible state under reduced motion", () => {
    const v = pulseUncertain(true);
    const visible = v.visible as Record<string, unknown>;
    expect(visible.opacity).toBe(1);
    expect((visible.transition as { duration?: unknown }).duration).toBe(0);
  });
});

/* ---------- transitionPromote ---------- */

describe("transitionPromote()", () => {
  it("animates backgroundColor (uncertain → accepted) and scale 1→1.06→1", () => {
    const v = transitionPromote(false);
    const to = v.to as Record<string, unknown>;
    expect(to.backgroundColor).toBe("var(--color-state-accepted)");
    expect(to.scale).toEqual([1, 1.06, 1]);
    const transition = to.transition as Record<string, unknown>;
    expect(transition.duration).toBe(D.moderate);
    expect(transition.ease).toEqual(E.outQuint);
    assertFramerNumeric(v);
  });

  it("collapses under reduced motion (no animation, final color visible)", () => {
    const v = transitionPromote(true);
    const to = v.to as Record<string, unknown>;
    expect(to.backgroundColor).toBe("var(--color-state-accepted)");
    expect((to.transition as { duration?: unknown }).duration).toBe(0);
  });
});

/* ---------- transitionSupersede ---------- */

describe("transitionSupersede()", () => {
  it("animates opacity 1→0.45 and y 0→4 with entrance duration + ease-in", () => {
    const v = transitionSupersede(false);
    const to = v.to as Record<string, unknown>;
    expect(to.opacity).toBe(0.45);
    expect(to.y).toBe(4);
    const transition = to.transition as Record<string, unknown>;
    expect(transition.duration).toBe(D.entrance);
    expect(transition.ease).toEqual(E.in);
    assertFramerNumeric(v);
  });

  it("collapses under reduced motion", () => {
    const v = transitionSupersede(true);
    const to = v.to as Record<string, unknown>;
    expect((to.transition as { duration?: unknown }).duration).toBe(0);
  });
});

/* ---------- transitionMerge ---------- */

describe("transitionMerge()", () => {
  it("returns paired source + target variants", () => {
    const { source, target } = transitionMerge(false, { x: 120, y: -40 });
    expect(source).toBeTruthy();
    expect(target).toBeTruthy();
  });

  it("source translates toward target coords and fades to opacity 0", () => {
    const { source } = transitionMerge(false, { x: 120, y: -40 });
    const to = source.to as Record<string, unknown>;
    expect(to.x).toBe(120);
    expect(to.y).toBe(-40);
    expect(to.opacity).toBe(0);
    const transition = to.transition as Record<string, unknown>;
    expect(transition.duration).toBe(D.entrance);
    expect(transition.ease).toEqual(E.outExpo);
  });

  it("target plays the absorb halo scale 1→1.08→1", () => {
    const { target } = transitionMerge(false, { x: 0, y: 0 });
    const to = target.to as Record<string, unknown>;
    expect(to.scale).toEqual([1, 1.08, 1]);
  });

  it("collapses both source and target under reduced motion", () => {
    const { source, target } = transitionMerge(true, { x: 10, y: 10 });
    expect(((source.to as Record<string, unknown>).transition as { duration?: unknown }).duration).toBe(0);
    expect(((target.to as Record<string, unknown>).transition as { duration?: unknown }).duration).toBe(0);
  });

  it("durations/easings are Framer-safe (numeric seconds + bezier tuple)", () => {
    const v = transitionMerge(false, { x: 1, y: 2 });
    assertFramerNumeric(v);
  });
});

/* ---------- transitionGlassPanel ---------- */

describe("transitionGlassPanel()", () => {
  it("enter: opacity 0→1 + y 8→0 at fast / ease-out; exit at instant / ease-in", () => {
    const v = transitionGlassPanel(false);
    const visible = v.visible as Record<string, unknown>;
    expect(visible.opacity).toBe(1);
    expect(visible.y).toBe(0);
    const transition = visible.transition as Record<string, unknown>;
    expect(transition.duration).toBe(D.fast);
    expect(transition.ease).toEqual(E.out);
    // exit uses instant duration + ease-in
    const exit = v.exit as Record<string, unknown>;
    expect(exit.y).toBe(8);
    const exitTransition = exit.transition as Record<string, unknown>;
    expect(exitTransition.duration).toBe(D.instant);
    expect(exitTransition.ease).toEqual(E.in);
    assertFramerNumeric(v);
  });

  it("collapses under reduced motion (visible stays at final state, duration: 0)", () => {
    const v = transitionGlassPanel(true);
    const visible = v.visible as Record<string, unknown>;
    expect(visible.opacity).toBe(1);
    expect(visible.y).toBe(0);
    expect((visible.transition as { duration?: unknown }).duration).toBe(0);
  });
});

/* ---------- transitionGlassModal ---------- */

describe("transitionGlassModal()", () => {
  it("enter: opacity 0→1 + scale 0.96→1 at moderate / ease-out-quint", () => {
    const v = transitionGlassModal(false);
    const hidden = v.hidden as Record<string, unknown>;
    expect(hidden.scale).toBe(0.96);
    const visible = v.visible as Record<string, unknown>;
    expect(visible.scale).toBe(1);
    const transition = visible.transition as Record<string, unknown>;
    expect(transition.duration).toBe(D.moderate);
    expect(transition.ease).toEqual(E.outQuint);
    // exit reverses scale to 0.96
    const exit = v.exit as Record<string, unknown>;
    expect(exit.scale).toBe(0.96);
    assertFramerNumeric(v);
  });

  it("collapses under reduced motion", () => {
    const v = transitionGlassModal(true);
    expect(((v.visible as Record<string, unknown>).transition as { duration?: unknown }).duration).toBe(0);
  });
});
