/**
 * Button — unit tests (Golden Rule 9).
 *
 * Why these exist:
 *  - `loading` is the one piece of real logic: it MUST both disable the button
 *    (no double-submit) AND expose aria-busy for AT. A regression that shows the
 *    spinner but leaves the button clickable is a silent data-integrity bug.
 *  - `aria-busy` must be ABSENT (not "false") when idle — `aria-busy="false"`
 *    is read by some screen readers as a live-region hint. We pin omission.
 *  - React 19 ref-as-prop (§6.4) is lost silently if someone reintroduces
 *    forwardRef; asserting ref.current is the <button> guards it.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createRef } from "react";
import { Button } from "../button";

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

function btn(): HTMLButtonElement {
  return container.querySelector("button") as HTMLButtonElement;
}

describe("Button — loading contract", () => {
  it("disables the button and sets aria-busy when loading", () => {
    act(() => root.render(<Button loading>Salvar</Button>));
    expect(btn().disabled).toBe(true);
    expect(btn().getAttribute("aria-busy")).toBe("true");
    // spinner present (lucide renders an <svg> marked aria-hidden)
    expect(btn().querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("omits aria-busy entirely when not loading (never 'false')", () => {
    act(() => root.render(<Button>Salvar</Button>));
    expect(btn().hasAttribute("aria-busy")).toBe(false);
    expect(btn().disabled).toBe(false);
  });

  it("stays disabled if either disabled OR loading is set", () => {
    act(() => root.render(<Button disabled>x</Button>));
    expect(btn().disabled).toBe(true);
  });
});

describe("Button — contract", () => {
  it("forwards ref to the <button> (React 19 ref-as-prop, no forwardRef)", () => {
    const ref = createRef<HTMLButtonElement>();
    act(() => root.render(<Button ref={ref}>x</Button>));
    expect(ref.current).toBe(btn());
  });

  it("merges consumer className via cn() without dropping variant classes", () => {
    act(() => root.render(<Button className="w-full">x</Button>));
    expect(btn().className).toContain("w-full");
    expect(btn().className).toContain("bg-action"); // default variant preserved
  });
});
