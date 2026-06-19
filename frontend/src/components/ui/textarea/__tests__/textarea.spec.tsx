/**
 * Textarea — unit tests (Golden Rule 9). Same invalid/aria contract as Input.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Textarea } from "../textarea";

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
const ta = () => container.querySelector("textarea") as HTMLTextAreaElement;

describe("Textarea — invalid contract", () => {
  it("omits aria-invalid when valid", () => {
    act(() => root.render(<Textarea />));
    expect(ta().hasAttribute("aria-invalid")).toBe(false);
    expect(ta().className).not.toContain("border-border-error");
  });
  it("sets aria-invalid + error border when invalid", () => {
    act(() => root.render(<Textarea invalid />));
    expect(ta().getAttribute("aria-invalid")).toBe("true");
    expect(ta().className).toContain("border-border-error");
  });
});
