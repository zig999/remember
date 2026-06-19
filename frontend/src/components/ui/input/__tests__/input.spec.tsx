/**
 * Input — unit tests (Golden Rule 9).
 *
 * The `invalid` -> `aria-invalid` mapping is the AT contract: an invalid field
 * MUST announce as invalid, and a valid field MUST NOT emit aria-invalid="false"
 * (which some screen readers mis-announce). The border-token swap is the visual
 * half of the same contract.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Input } from "../input";

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
const input = () => container.querySelector("input") as HTMLInputElement;

describe("Input — invalid contract", () => {
  it("omits aria-invalid and uses the neutral border when valid", () => {
    act(() => root.render(<Input />));
    expect(input().hasAttribute("aria-invalid")).toBe(false);
    expect(input().className).toContain("border-border");
    expect(input().className).not.toContain("border-border-error");
  });

  it("sets aria-invalid=true and the error border when invalid", () => {
    act(() => root.render(<Input invalid />));
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().className).toContain("border-border-error");
  });
});
