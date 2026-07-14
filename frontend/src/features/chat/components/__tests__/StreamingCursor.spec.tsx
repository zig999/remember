// @vitest-environment jsdom
/**
 * StreamingCursor — unit tests (TC-08).
 *
 * Why these tests exist (Golden Rule 9):
 *  - `aria-hidden='true'` is normative (TC-08 constraint). A regression that
 *    removes it leaks decorative animation into the AT tree on every delta.
 *  - The animation MUST come from the canonical CSS keyframe `cursor-blink`
 *    declared in `styles/theme.css` (TC-08 constraint: "must use a CSS
 *    @keyframes in theme.css OR lib/motion.ts"). We pin the class to catch
 *    a regression that swaps in an ad-hoc inline keyframe.
 *  - The class composition MUST go through `cn()` so any consumer-supplied
 *    `className` merges cleanly (front.md §6.4 component contract).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StreamingCursor } from "../StreamingCursor";

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

describe("StreamingCursor", () => {
  it("is aria-hidden so screen readers ignore the decorative caret", () => {
    act(() => root.render(<StreamingCursor />));
    const cursor = container.querySelector('[data-testid="streaming-cursor"]');
    expect(cursor).not.toBeNull();
    expect(cursor?.getAttribute("aria-hidden")).toBe("true");
  });

  it("references the canonical cursor-blink keyframe behind motion-safe (TC-08 constraint)", () => {
    act(() => root.render(<StreamingCursor />));
    const cursor = container.querySelector('[data-testid="streaming-cursor"]');
    // motion-safe:[animation:cursor-blink_...] — both the keyframe name and
    // the prefers-reduced-motion guard must be present.
    const cls = cursor?.className ?? "";
    expect(cls).toContain("motion-safe:");
    expect(cls).toContain("cursor-blink");
  });

  it("merges consumer className via cn() without losing the cursor's own classes", () => {
    act(() => root.render(<StreamingCursor className="ml-md" />));
    const cursor = container.querySelector('[data-testid="streaming-cursor"]');
    const cls = cursor?.className ?? "";
    // Consumer class lands…
    expect(cls).toContain("ml-md");
    // …without erasing the bg-foreground fill that gives the caret its body.
    expect(cls).toContain("bg-foreground");
  });
});
