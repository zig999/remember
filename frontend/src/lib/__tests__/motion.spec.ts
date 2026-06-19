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
 *  - The "no bare ms in variants" rule (BR-10, tokens.md §11.3) is the
 *    only thing that prevents the design-system tokens from being bypassed
 *    by a quick local edit. We assert the variants reference CSS variables
 *    by name.
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

/* ---------- helpers ---------- */

function flattenStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) flattenStrings(v, acc);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) flattenStrings(v, acc);
  }
  return acc;
}

function assertNoBareMs(variantTree: unknown): void {
  // No string ending in "ms" and no plain number passed as a duration.
  const strings = flattenStrings(variantTree);
  for (const s of strings) {
    expect(s, `bare ms found: ${s}`).not.toMatch(/^\d+ms$/);
    expect(s, `bare ms found: ${s}`).not.toMatch(/\b\d+ms\b/);
  }
  // Walk for numeric `duration` keys (the format Framer Motion would accept).
  function walk(o: unknown): void {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (k === "duration" && typeof v === "number") {
        // A numeric duration is allowed ONLY when it equals 0 (the
        // reduced-motion collapse path explicitly uses { duration: 0 }).
        expect(v).toBe(0);
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

  it("references CSS variables for duration and easing — never bare ms", () => {
    const v = pulseUncertain(false);
    const transition = (v.visible as Record<string, unknown>).transition as Record<string, unknown>;
    expect(transition.duration).toBe("var(--duration-pulse)");
    expect(transition.ease).toBe("var(--ease-in-out)");
    assertNoBareMs(v);
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
    expect(transition.duration).toBe("var(--duration-moderate)");
    expect(transition.ease).toBe("var(--ease-out-quint)");
    assertNoBareMs(v);
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
  it("animates opacity 1→0.45 and y 0→4 with --duration-entrance + ease-in", () => {
    const v = transitionSupersede(false);
    const to = v.to as Record<string, unknown>;
    expect(to.opacity).toBe(0.45);
    expect(to.y).toBe(4);
    const transition = to.transition as Record<string, unknown>;
    expect(transition.duration).toBe("var(--duration-entrance)");
    expect(transition.ease).toBe("var(--ease-in)");
    assertNoBareMs(v);
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
    expect(transition.duration).toBe("var(--duration-entrance)");
    expect(transition.ease).toBe("var(--ease-out-expo)");
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

  it("variants reference only CSS variables (no bare ms)", () => {
    const v = transitionMerge(false, { x: 1, y: 2 });
    assertNoBareMs(v);
  });
});

/* ---------- transitionGlassPanel ---------- */

describe("transitionGlassPanel()", () => {
  it("enter: opacity 0→1 + y 8→0 at duration-fast / ease-out", () => {
    const v = transitionGlassPanel(false);
    const visible = v.visible as Record<string, unknown>;
    expect(visible.opacity).toBe(1);
    expect(visible.y).toBe(0);
    const transition = visible.transition as Record<string, unknown>;
    expect(transition.duration).toBe("var(--duration-fast)");
    expect(transition.ease).toBe("var(--ease-out)");
    // exit uses --duration-instant + --ease-in
    const exit = v.exit as Record<string, unknown>;
    expect(exit.y).toBe(8);
    const exitTransition = exit.transition as Record<string, unknown>;
    expect(exitTransition.duration).toBe("var(--duration-instant)");
    expect(exitTransition.ease).toBe("var(--ease-in)");
    assertNoBareMs(v);
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
  it("enter: opacity 0→1 + scale 0.96→1 at duration-moderate / ease-out-quint", () => {
    const v = transitionGlassModal(false);
    const hidden = v.hidden as Record<string, unknown>;
    expect(hidden.scale).toBe(0.96);
    const visible = v.visible as Record<string, unknown>;
    expect(visible.scale).toBe(1);
    const transition = visible.transition as Record<string, unknown>;
    expect(transition.duration).toBe("var(--duration-moderate)");
    expect(transition.ease).toBe("var(--ease-out-quint)");
    // exit reverses scale to 0.96
    const exit = v.exit as Record<string, unknown>;
    expect(exit.scale).toBe(0.96);
    assertNoBareMs(v);
  });

  it("collapses under reduced motion", () => {
    const v = transitionGlassModal(true);
    expect(((v.visible as Record<string, unknown>).transition as { duration?: unknown }).duration).toBe(0);
  });
});
