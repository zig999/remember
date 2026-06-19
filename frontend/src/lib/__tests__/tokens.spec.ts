// @vitest-environment node
/**
 * Unit tests for `src/lib/tokens.ts` — the typed index of design tokens.
 *
 * Why these tests exist (rule 9 — tests verify intent):
 *  - The tokens module is the single source of truth used by typescript
 *    consumers (graph node renderer, motion module, etc.). If a category is
 *    silently dropped or a value drifts away from the canonical YAML manifest
 *    in `docs/specs/front/design-system/tokens.md §13`, downstream UI breaks
 *    in a way that does NOT throw — borders disappear, badges show wrong
 *    confidence color, etc. These tests catch that at compile-AND-runtime.
 *  - The frozen-object contract (`Object.freeze`) is part of the spec — the
 *    module exposes a pure, immutable index, not a runtime registry.
 *  - The two-border-namespace gotcha (color vs width) is load-bearing
 *    (tokens.md §7.2, front.md §8.3): we assert they stay structurally
 *    distinct in the TS surface as well.
 */
import { describe, it, expect } from "vitest";
import {
  backdrop,
  blurGlass,
  borderColor,
  borderWidth,
  color,
  cssVar,
  duration,
  ease,
  font,
  graph,
  linkType,
  nodeType,
  radius,
  shadow,
  spacing,
  state,
  stateFg,
  surfaceGlass,
  text,
  tokens,
  z,
} from "../tokens";

describe("tokens.ts — frozen-object contract", () => {
  it("freezes every category", () => {
    expect(Object.isFrozen(color)).toBe(true);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(stateFg)).toBe(true);
    expect(Object.isFrozen(nodeType)).toBe(true);
    expect(Object.isFrozen(linkType)).toBe(true);
    expect(Object.isFrozen(borderColor)).toBe(true);
    expect(Object.isFrozen(borderWidth)).toBe(true);
    expect(Object.isFrozen(spacing)).toBe(true);
    expect(Object.isFrozen(font)).toBe(true);
    expect(Object.isFrozen(text)).toBe(true);
    expect(Object.isFrozen(radius)).toBe(true);
    expect(Object.isFrozen(shadow)).toBe(true);
    expect(Object.isFrozen(surfaceGlass)).toBe(true);
    expect(Object.isFrozen(blurGlass)).toBe(true);
    expect(Object.isFrozen(backdrop)).toBe(true);
    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(duration)).toBe(true);
    expect(Object.isFrozen(ease)).toBe(true);
    expect(Object.isFrozen(z)).toBe(true);
    expect(Object.isFrozen(tokens)).toBe(true);
  });

  it("rejects mutation at runtime (strict mode would throw; loose mode silently no-ops)", () => {
    // We don't rely on TS to enforce this — the freeze guarantee is runtime.
    const before = color.primary;
    try {
      // @ts-expect-error — readonly per `as const`; runtime guard tested here.
      color.primary = "oklch(0% 0 0)";
    } catch {
      /* strict-mode throw is acceptable */
    }
    expect(color.primary).toBe(before);
  });
});

describe("tokens.ts — confidence-state catalog (tokens.md §6.1)", () => {
  it("declares exactly 5 confidence states", () => {
    expect(Object.keys(state).sort()).toEqual(
      ["accepted", "disputed", "low-confidence", "superseded", "uncertain"].sort(),
    );
  });

  it("declares the matching 5 foreground colors with the same keys", () => {
    expect(Object.keys(stateFg).sort()).toEqual(Object.keys(state).sort());
  });

  it("matches the YAML manifest dark values (tokens.md §13)", () => {
    // Spot-check the centerpiece values — diverging from these breaks every
    // confidence badge and graph node accent across the app.
    expect(state.accepted).toBe("oklch(72% 0.160 155)");
    expect(state.uncertain).toBe("oklch(76% 0.150 82)");
    expect(state.disputed).toBe("oklch(70% 0.180 45)");
    expect(state.superseded).toBe("oklch(46% 0.018 260)");
    expect(state["low-confidence"]).toBe("oklch(58% 0.025 260)");
  });
});

describe("tokens.ts — NodeType + LinkType catalogs (tokens.md §6.3 / §7)", () => {
  it("declares exactly 10 node types (matching 0001_seed.sql)", () => {
    expect(Object.keys(nodeType)).toHaveLength(10);
    // The Document NodeType (Tier-1, seeded in 0001_seed) must be present.
    expect(nodeType.document).toBeDefined();
    expect(nodeType.task).toBeDefined();
  });

  it("declares exactly 13 link types (matching 0001_seed.sql)", () => {
    expect(Object.keys(linkType)).toHaveLength(13);
    // The three Tier-1 additions must be present.
    expect(linkType.concerns).toBeDefined();
    expect(linkType["delivered-to"]).toBeDefined();
    expect(linkType.sponsors).toBeDefined();
  });
});

describe("tokens.ts — border namespaces are STRUCTURALLY distinct (tokens.md §7.2)", () => {
  it("color and width namespaces have disjoint key sets", () => {
    const colorKeys = new Set(Object.keys(borderColor));
    const widthKeys = new Set(Object.keys(borderWidth));
    // No overlap — mixing them silently hides borders in Tailwind v4.
    for (const k of colorKeys) expect(widthKeys.has(k)).toBe(false);
  });

  it("declares all 5 confidence-state border colors", () => {
    expect(borderColor.accepted).toBeDefined();
    expect(borderColor.uncertain).toBeDefined();
    expect(borderColor.disputed).toBeDefined();
    expect(borderColor.superseded).toBeDefined();
    expect(borderColor.error).toBeDefined();
  });

  it("width namespace uses the v4 'DEFAULT' key for the 1px class `border`", () => {
    expect(borderWidth.DEFAULT).toBe("1px");
    expect(borderWidth.thin).toBe("1px");
    expect(borderWidth["2"]).toBe("2px");
    expect(borderWidth.thick).toBe("3px");
  });
});

describe("tokens.ts — spacing follows the 4-pt grid (tokens.md §4)", () => {
  it("declares 6 spacing tokens, all multiples of 4 px", () => {
    const px = Object.values(spacing).map((v) => Number(v.replace("px", "")));
    expect(px).toEqual([4, 8, 12, 16, 24, 32]);
    for (const v of px) expect(v % 4).toBe(0);
  });
});

describe("tokens.ts — typography scale (\"Terminal Native\" — tokens.md §5)", () => {
  it("declares the 9 named tokens in scale order", () => {
    expect(Object.keys(text)).toEqual([
      "display",
      "heading",
      "subheading",
      "body-lg",
      "body-sm",
      "label",
      "badge",
      "caption",
      "code",
    ]);
  });

  it("sizes are rem against the 13px base — body-lg is the 1rem anchor", () => {
    // rem (not px): the 13px <html> base is what makes 1rem ≈ 13px. A px value
    // here would silently decouple the scale from the base.
    for (const v of Object.values(text)) expect(v).toMatch(/^\d+(\.\d+)?rem$/);
    expect(text["body-lg"]).toBe("1rem");
  });

  it("display is the largest step and caption the smallest", () => {
    const rem = (v: string) => Number(v.replace("rem", ""));
    const sizes = Object.values(text).map(rem);
    expect(rem(text.display)).toBe(Math.max(...sizes));
    expect(rem(text.caption)).toBe(Math.min(...sizes));
  });
});

describe("tokens.ts — radius, shadow, glass (tokens.md §8, §9)", () => {
  it("declares the 5-step radius scale ending in pill", () => {
    expect(radius.sm).toBe("6px");
    expect(radius.md).toBe("10px");
    expect(radius.lg).toBe("14px");
    expect(radius.xl).toBe("20px");
    expect(radius.pill).toBe("9999px");
  });

  it("declares the 4-step shadow scale including the dedicated glass shadow", () => {
    expect(Object.keys(shadow)).toEqual(["sm", "md", "lg", "glass"]);
  });

  it("declares 3 glass surface levels with matching blur sizes", () => {
    expect(Object.keys(surfaceGlass)).toEqual(["ambient", "panel", "modal"]);
    expect(Object.keys(blurGlass)).toEqual(["sm", "md", "lg"]);
  });
});

describe("tokens.ts — motion (tokens.md §11)", () => {
  it("declares only the 5 canonical durations — no 150/250/350/400 ms", () => {
    const ms = Object.values(duration);
    expect(ms.sort()).toEqual(["100ms", "200ms", "2400ms", "300ms", "500ms"].sort());
    // None of the forbidden values must leak in.
    for (const forbidden of ["150ms", "250ms", "350ms", "400ms"]) {
      expect(ms.includes(forbidden)).toBe(false);
    }
  });

  it("declares 5 named easings — valid cubic-beziers (bounce/elastic now ALLOWED, front.md §9.1 v1.1.0)", () => {
    expect(Object.keys(ease)).toEqual(["out", "in", "in-out", "out-quint", "out-expo", "back"]);
    // Structural/validity check: every easing is a cubic-bezier with 4 numbers, and the
    // x control points (indices 0, 2) stay within [0, 1] as CSS requires. The y control
    // points (indices 1, 3) are intentionally UNBOUNDED now — the anti-bounce restriction
    // was dropped (motion may be decorative; overshoot/bounce curves are permitted).
    for (const curve of Object.values(ease)) {
      expect(curve.startsWith("cubic-bezier(")).toBe(true);
      const nums = curve
        .replace("cubic-bezier(", "")
        .replace(")", "")
        .split(",")
        .map((s) => Number(s.trim()));
      expect(nums).toHaveLength(4);
      // x control points must remain within [0, 1] (CSS cubic-bezier validity).
      expect(nums[0]).toBeGreaterThanOrEqual(0);
      expect(nums[0]).toBeLessThanOrEqual(1);
      expect(nums[2]).toBeGreaterThanOrEqual(0);
      expect(nums[2]).toBeLessThanOrEqual(1);
    }
  });
});

describe("tokens.ts — z-index scale matches tokens.md §12", () => {
  it("declares the 8 canonical layers with their canonical values", () => {
    expect(z.backdrop).toBe(-1);
    expect(z.base).toBe(0);
    expect(z.panel).toBe(10);
    expect(z.drawer).toBe(20);
    expect(z.popover).toBe(30);
    expect(z.frame).toBe(40);
    expect(z.modal).toBe(50);
    expect(z.toast).toBe(60);
  });

  it("declares exactly 8 layers — nothing more, nothing less", () => {
    expect(Object.keys(z)).toHaveLength(8);
  });
});

describe("tokens.ts — surface / content / backdrop spot checks (tokens.md §13 YAML)", () => {
  it("matches root-background and text-content dark values", () => {
    expect(color.primary).toBe("oklch(15% 0.012 250)");
    expect(color.content).toBe("oklch(97% 0.008 250)");
    expect(color.muted).toBe("oklch(65% 0.012 250)");
  });

  it("declares content-inverse (text on saturated fills) and overlay (modal veil)", () => {
    // These two are consumed by the components/ui/ layer (Button fg, Dialog veil).
    // Missing tokens fall back to currentColor / transparent and break silently.
    expect(color["content-inverse"]).toBe("oklch(98% 0.005 250)");
    expect(color.overlay).toBe("oklch(12% 0.012 250 / 0.60)");
  });

  it("declares the 3 backdrop scalars used by the ambient backdrop filter", () => {
    expect(backdrop.darken).toBe("0.55");
    expect(backdrop.desaturate).toBe("0.30");
    expect(backdrop.blur).toBe("12px");
  });

  it("declares the graph depth overlay used in the Graph route", () => {
    expect(graph["depth-overlay"]).toBe("oklch(12% 0.012 250 / 0.92)");
  });
});

describe("tokens.ts — cssVar helper", () => {
  it("builds the canonical `var(--token)` string", () => {
    expect(cssVar("color-primary")).toBe("var(--color-primary)");
    expect(cssVar("z-toast")).toBe("var(--z-toast)");
  });
});

describe("tokens.ts — aggregate `tokens` export", () => {
  it("exposes every category under a single frozen surface", () => {
    expect(Object.keys(tokens).sort()).toEqual(
      [
        "color",
        "state",
        "stateFg",
        "nodeType",
        "linkType",
        "borderColor",
        "borderWidth",
        "spacing",
        "font",
        "text",
        "radius",
        "shadow",
        "surfaceGlass",
        "blurGlass",
        "backdrop",
        "graph",
        "duration",
        "ease",
        "z",
      ].sort(),
    );
  });
});
