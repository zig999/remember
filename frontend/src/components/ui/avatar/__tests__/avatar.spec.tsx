/**
 * Avatar — unit tests (Golden Rule 9).
 *
 * The two pure functions ARE the spec:
 *  - initials(): the rule (first+last word, single-word fallback, empty -> "?")
 *    is what users see; a regression here mislabels people.
 *  - swatch(): MUST be deterministic — the same name always maps to the same
 *    color, otherwise an avatar's color flickers between renders/sessions and
 *    loses its identity-recall value. We pin determinism + palette membership.
 *  - role="img" + aria-label=name is the AT contract (initials alone are not
 *    announced meaningfully).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Avatar, initials, swatch, SWATCHES } from "../avatar";

describe("Avatar — initials()", () => {
  it("first + last word initials, uppercased", () => {
    expect(initials("Rodrigo Alves")).toBe("RA");
    expect(initials("Maria da Silva Santos")).toBe("MS");
  });
  it("single word -> first two letters", () => {
    expect(initials("Ana")).toBe("AN");
  });
  it("empty / whitespace -> '?'", () => {
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});

describe("Avatar — swatch()", () => {
  it("is deterministic for a given name", () => {
    expect(swatch("Rodrigo Alves")).toBe(swatch("Rodrigo Alves"));
  });
  it("always returns a member of the token palette", () => {
    for (const n of ["Ana", "João", "Z", "Maria Santos", ""]) {
      expect(SWATCHES).toContain(swatch(n) as (typeof SWATCHES)[number]);
    }
  });
});

describe("Avatar — render contract", () => {
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

  it("exposes role=img + aria-label=name and renders initials", () => {
    act(() => root.render(<Avatar name="Rodrigo Alves" />));
    const el = container.querySelector("span") as HTMLSpanElement;
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Rodrigo Alves");
    expect(el.textContent).toBe("RA");
  });
});
