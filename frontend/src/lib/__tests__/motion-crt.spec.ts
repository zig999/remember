// @vitest-environment node
/**
 * transitionCrtPowerOn — unit tests (TC-02).
 *
 * Pins the contract documented in `motion.ts` `transitionCrtPowerOn`:
 *  1. Normal motion: 4-phase scale (point → line → panel) — `hidden` has
 *     `scaleX/Y < 1`; `visible.scaleX/Y` are keyframe arrays of length 3
 *     ending at 1 (last frame is the visible state).
 *  2. Reduced motion (WCAG 2.2 AA, front.md §9.1, BR-10): NO scale anywhere,
 *     only opacity 0 → 1. This is the gate that protects users with
 *     vestibular disorders — a regression here violates accessibility.
 *  3. Framer Motion WAAPI shape: every `duration` is a finite number ≥ 0;
 *     every `ease` is a 4-number bezier tuple. Mirrors the existing
 *     `assertFramerNumeric` guard from `motion.spec.ts`.
 *  4. Index registration: `motion.entrance["crt-power-on"]` exists and IS
 *     the same factory exported by name.
 *
 * Why these tests exist (Golden Rule 9): a silent drop of `scaleX/Y` or a
 * string `duration` (e.g. "var(--duration-entrance)") would render the panel
 * as a flat fade — the test suite would still pass under jsdom because the
 * WAAPI path is browser-only. This is the regression guard.
 */
import { describe, it, expect } from "vitest";
import { motion, transitionCrtPowerOn } from "../motion";

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
        expect(arr.length).toBe(4);
        for (const n of arr) expect(typeof n).toBe("number");
      } else if (v && typeof v === "object") {
        walk(v);
      }
    }
  }
  walk(variantTree);
}

describe("transitionCrtPowerOn — normal motion", () => {
  const variants = transitionCrtPowerOn(false);

  it("hidden state starts as a near-zero point with reduced opacity", () => {
    const hidden = variants.hidden as Record<string, unknown>;
    expect(typeof hidden.scaleX).toBe("number");
    expect(typeof hidden.scaleY).toBe("number");
    expect(hidden.scaleX as number).toBeLessThan(1);
    expect(hidden.scaleY as number).toBeLessThan(1);
    expect(hidden.scaleX as number).toBeGreaterThan(0);
    expect(hidden.scaleY as number).toBeGreaterThan(0);
    expect(hidden.opacity).toBeDefined();
  });

  it("visible state animates scaleX/Y through keyframe arrays ending at 1", () => {
    const visible = variants.visible as Record<string, unknown>;
    expect(Array.isArray(visible.scaleX)).toBe(true);
    expect(Array.isArray(visible.scaleY)).toBe(true);
    const sx = visible.scaleX as number[];
    const sy = visible.scaleY as number[];
    expect(sx.length).toBe(3); // ignition → H-sweep → full panel
    expect(sy.length).toBe(3);
    // Last frame is the visible (rest) state — panel at full size.
    expect(sx[sx.length - 1]).toBe(1);
    expect(sy[sy.length - 1]).toBe(1);
    // Phase 2 (H-sweep): scaleX already at 1 while scaleY still <1.
    expect(sx[1]).toBe(1);
    expect(sy[1]).toBeLessThan(1);
    // Opacity terminates at 1 — the panel is visible at the end.
    expect(visible.opacity).toBe(1);
  });

  it("transition uses numeric duration + bezier ease (Framer WAAPI shape)", () => {
    assertFramerNumeric(variants);
  });
});

describe("transitionCrtPowerOn — reduced motion (WCAG 2.2 AA)", () => {
  const variants = transitionCrtPowerOn(true);

  it("hidden state has NO scale, only opacity 0", () => {
    const hidden = variants.hidden as Record<string, unknown>;
    expect(hidden.scaleX).toBeUndefined();
    expect(hidden.scaleY).toBeUndefined();
    expect(hidden.opacity).toBe(0);
  });

  it("visible state has NO scale anywhere — fade-only", () => {
    const visible = variants.visible as Record<string, unknown>;
    expect(visible.scaleX).toBeUndefined();
    expect(visible.scaleY).toBeUndefined();
    expect(visible.opacity).toBe(1);
  });

  it("transition keeps numeric Framer shape (no var() strings)", () => {
    assertFramerNumeric(variants);
  });
});

describe("transitionCrtPowerOn — registration in motion index", () => {
  it('is registered as motion.entrance["crt-power-on"]', () => {
    expect(motion.entrance["crt-power-on"]).toBe(transitionCrtPowerOn);
  });
});
