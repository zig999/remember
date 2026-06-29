// @vitest-environment node
/**
 * Regression test for `src/styles/theme.css` — Tailwind v4 @theme block.
 *
 * Why these tests exist (rule 9 — tests verify intent):
 *  - `theme.css` is the single CSS source of truth for design tokens. Tailwind
 *    v4 silently drops unknown classes — if a token is removed (e.g. the
 *    border-color half of the dual namespace), borders DISAPPEAR with no
 *    runtime warning. We pin the structural invariants here.
 *  - The `@keyframes uncertain-border-pulse` rule MUST be wrapped in
 *    `@media (prefers-reduced-motion: no-preference)` — without that gate, an
 *    accessibility regression ships invisibly.
 *  - Entry directive: v4 uses `@import "tailwindcss"`. The v3 triplet
 *    (`@tailwind base/components/utilities`) would break the build entirely.
 *
 * We assert against the raw file contents (no DOM, no PostCSS) so this stays
 * a fast unit test runnable in jsdom without a browser.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const THEME_CSS_PATH = resolve(THIS_DIR, "..", "theme.css");

let css = "";
beforeAll(() => {
  css = readFileSync(THEME_CSS_PATH, "utf8");
});

describe("theme.css — Tailwind v4 entry directive (front.md §1.2)", () => {
  it("uses the v4 `@import 'tailwindcss';` directive", () => {
    expect(css).toMatch(/@import\s+"tailwindcss";/);
  });

  it("does NOT use the v3 `@tailwind` triplet (which would break v4)", () => {
    expect(css).not.toMatch(/@tailwind\s+(base|components|utilities)/);
  });
});

describe("theme.css — @theme block presence and shape (tokens.md §2)", () => {
  it("declares a single top-level `@theme { ... }` block", () => {
    // Loose check — only one `@theme {` appears.
    const matches = css.match(/@theme\s*\{/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBe(1);
  });

  it("declares the canonical confidence-state colors (5 + 5 fg)", () => {
    for (const state of ["accepted", "uncertain", "low-confidence", "disputed", "superseded"]) {
      expect(css).toMatch(new RegExp(`--color-state-${state}\\s*:`));
      expect(css).toMatch(new RegExp(`--color-state-${state}-fg\\s*:`));
    }
  });

  it("declares all 10 NodeType colors (catalog from 0001_seed.sql)", () => {
    const nodes = [
      "person",
      "organization",
      "project",
      "event",
      "role",
      "category",
      "concept",
      "location",
      "document",
      "task",
    ];
    for (const n of nodes) expect(css).toMatch(new RegExp(`--color-node-${n}\\s*:`));
  });

  it("declares all 13 LinkType colors (catalog from 0001_seed.sql)", () => {
    const links = [
      "participates-in",
      "member-of",
      "holds-role",
      "responsible-for",
      "reports-to",
      "part-of",
      "located-in",
      "organizes",
      "belongs-to-category",
      "related-to",
      "concerns",
      "delivered-to",
      "sponsors",
    ];
    for (const l of links) expect(css).toMatch(new RegExp(`--color-link-${l}\\s*:`));
  });

  it("declares BOTH border namespaces (color + width) — they are distinct", () => {
    // Color namespace
    expect(css).toMatch(/--color-border\s*:/);
    expect(css).toMatch(/--color-border-glass\s*:/);
    expect(css).toMatch(/--color-border-focus\s*:/);
    expect(css).toMatch(/--color-border-error\s*:/);
    expect(css).toMatch(/--color-border-accepted\s*:/);
    expect(css).toMatch(/--color-border-uncertain\s*:/);
    expect(css).toMatch(/--color-border-disputed\s*:/);
    expect(css).toMatch(/--color-border-superseded\s*:/);
    // Width namespace — distinct!
    expect(css).toMatch(/--border-thin\s*:\s*1px/);
    expect(css).toMatch(/--border-DEFAULT\s*:\s*1px/);
    expect(css).toMatch(/--border-2\s*:\s*2px/);
    expect(css).toMatch(/--border-thick\s*:\s*3px/);
  });

  it("declares the 3 glass-surface levels + 3 blur sizes", () => {
    // --color-* namespace is required so Tailwind v4 emits the bg-* utilities.
    for (const level of ["ambient", "panel", "modal"]) {
      expect(css).toMatch(new RegExp(`--color-surface-glass-${level}\\s*:`));
    }
    for (const size of ["sm", "md", "lg"]) {
      expect(css).toMatch(new RegExp(`--blur-glass-${size}\\s*:`));
    }
  });

  it("declares the accent-tinted ambient glass fill (ChatBubble assistant side)", () => {
    // --color-* namespace so Tailwind emits `bg-surface-glass-ambient-accent`,
    // consumed via GlassSurface fill="ambient-accent".
    expect(css).toMatch(/--color-surface-glass-ambient-accent\s*:/);
  });

  it("declares the 8-step z-index scale with the canonical values", () => {
    expect(css).toMatch(/--z-backdrop\s*:\s*-1\b/);
    expect(css).toMatch(/--z-base\s*:\s*0\b/);
    expect(css).toMatch(/--z-panel\s*:\s*10\b/);
    expect(css).toMatch(/--z-drawer\s*:\s*20\b/);
    expect(css).toMatch(/--z-popover\s*:\s*30\b/);
    expect(css).toMatch(/--z-frame\s*:\s*40\b/);
    expect(css).toMatch(/--z-modal\s*:\s*50\b/);
    expect(css).toMatch(/--z-toast\s*:\s*60\b/);
  });

  it("maps every z-index token to a real @utility (Tailwind v4 has no z-index namespace)", () => {
    // Declaring `--z-frame: 40` in @theme emits the CSS var but NO `z-frame`
    // utility — the class silently resolves to `z-index: auto`. Without these
    // @utility rules the fixed header is not elevated above the workspace and
    // header clicks are swallowed; popover/modal/toast stacking also collapses.
    for (const level of [
      "backdrop",
      "base",
      "panel",
      "drawer",
      "popover",
      "frame",
      "modal",
      "toast",
    ]) {
      expect(css).toMatch(
        new RegExp(`@utility\\s+z-${level}\\s*\\{[^}]*z-index:\\s*var\\(--z-${level}\\)`),
      );
    }
  });

  it("declares the 5 canonical motion durations — and none of the forbidden ones", () => {
    expect(css).toMatch(/--duration-instant\s*:\s*100ms/);
    expect(css).toMatch(/--duration-fast\s*:\s*200ms/);
    expect(css).toMatch(/--duration-moderate\s*:\s*300ms/);
    expect(css).toMatch(/--duration-entrance\s*:\s*500ms/);
    expect(css).toMatch(/--duration-pulse\s*:\s*2400ms/);
    // Forbidden durations must not appear as token VALUES. We anchor with a
    // boundary (whitespace or `:` to the left, end-of-value to the right) so
    // legitimate substrings such as `2400ms` (which contains `400ms`) are not
    // false positives.
    for (const forbidden of ["150ms", "250ms", "350ms", "400ms"]) {
      const re = new RegExp(`(^|[\\s:])${forbidden}\\b`);
      expect(re.test(css)).toBe(false);
    }
  });
});

describe("theme.css — dark-only (no light theme)", () => {
  it("declares NO `[data-theme=\"light\"]` override block", () => {
    // The app is dark-only: dark tokens live in the `@theme` (:root) default and
    // `data-theme="dark"` is fixed on <html>. A light override block must not
    // re-appear (it would resurrect the removed theme).
    expect(css).not.toMatch(/\[data-theme="light"\]/);
  });
});

describe("theme.css — uncertain border pulse keyframe (GlassSurface.back.md §7.2)", () => {
  it("declares `@keyframes uncertain-border-pulse`", () => {
    expect(css).toMatch(/@keyframes\s+uncertain-border-pulse\s*\{/);
  });

  it("animates between full border-color and a 55% transparent mix at the midpoint", () => {
    // Locate the keyframe body to confirm the canonical shape.
    const kfMatch = css.match(/@keyframes\s+uncertain-border-pulse\s*\{([\s\S]*?)\n\}/);
    expect(kfMatch).not.toBeNull();
    const body = kfMatch?.[1] ?? "";
    expect(body).toMatch(/border-color:\s*var\(--color-border-uncertain\)/);
    expect(body).toMatch(/color-mix\(\s*in\s+oklch\s*,\s*var\(--color-border-uncertain\)\s+55%/);
  });

  it("wraps the `[data-glass-pulse=\"uncertain\"]` selector in `prefers-reduced-motion: no-preference`", () => {
    // The animation declaration MUST live inside the no-preference media query
    // — without that, a reduced-motion user sees a pulse anyway (a11y bug).
    const mediaMatch = css.match(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(mediaMatch).not.toBeNull();
    const body = mediaMatch?.[1] ?? "";
    expect(body).toMatch(/\[data-glass-pulse="uncertain"\]/);
    expect(body).toMatch(/animation:\s*uncertain-border-pulse\s+var\(--duration-pulse\)/);
  });
});

describe("theme.css — does NOT use a tailwind.config.ts surface (front.md §1.2)", () => {
  it("declares no `content` array (v4 auto-detects)", () => {
    // Loose negative check: the `content:` directive shouldn't appear as a top-level @theme key.
    // (CSS `content:` for ::before/::after isn't used in this file.)
    expect(css).not.toMatch(/\n\s*content\s*:\s*\[/);
  });
});
