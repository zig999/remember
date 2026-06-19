// @vitest-environment node
/**
 * Tests for `lib/cn.ts` — the Tailwind-aware className merger
 * (front.md §6.4, BR-11).
 *
 * Why these tests exist (Golden Rule 9): every shared component delegates
 * `className` merging to `cn()`. If the merge stops resolving conflicting
 * Tailwind utilities last-writer-wins, glass surfaces and state badges will
 * silently apply the wrong token (e.g., `bg-surface` instead of an override
 * `bg-state-uncertain`). These tests assert the contract the components
 * depend on.
 */
import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn()", () => {
  it("joins multiple inputs into a single space-separated class string", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("accepts falsy values without emitting empty tokens (clsx contract)", () => {
    expect(cn("a", false, null, undefined, 0, "b")).toBe("a b");
  });

  it("accepts conditional object form (clsx contract)", () => {
    expect(cn("a", { b: true, c: false, d: true })).toBe("a b d");
  });

  it("resolves conflicting Tailwind utilities last-writer-wins via tailwind-merge", () => {
    // The caller passes a base then an override — the override must win.
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("bg-surface", "bg-state-uncertain")).toBe("bg-state-uncertain");
    expect(cn("text-sm font-medium", "text-base")).toBe("font-medium text-base");
  });

  it("resolves arbitrary value vs token conflicts last-writer-wins", () => {
    // Even if arbitrary values are forbidden by spec, the merger must still
    // handle them — they may appear in third-party shadcn components.
    expect(cn("w-4", "w-8")).toBe("w-8");
  });

  it("preserves non-conflicting utilities from both inputs", () => {
    // Conflicts collapse; orthogonal utilities are kept.
    expect(cn("p-2 rounded-md", "p-4 shadow-sm")).toBe("rounded-md p-4 shadow-sm");
  });

  it("returns empty string when no inputs", () => {
    expect(cn()).toBe("");
  });
});
