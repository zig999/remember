/**
 * GraphNode — unit tests (Golden Rule 9).
 *
 * The type→(icon/color/pt-BR label) map and the aria-label are the contract:
 *  - the eye reads the NodeType first (color + icon), so the wrong icon/color
 *    mislabels the entity's kind — silently, with no error.
 *  - the aria-label ("Pessoa: João Silva") is the AT path; the icon is decorative.
 *  - the confidence StateBadge selo must appear only when `state` is set.
 *  - React 19 ref-as-prop reaches the GlassSurface root (no forwardRef).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createRef } from "react";
import { GraphNode } from "../GraphNode";

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

describe("GraphNode", () => {
  it("renders label + default subtitle = pt-BR type name, with role/aria-label", () => {
    act(() => root.render(<GraphNode type="project" label="Apollo" />));
    const el = container.querySelector('[role="group"]') as HTMLElement;
    expect(el.getAttribute("aria-label")).toBe("Projeto: Apollo");
    expect(el.textContent).toContain("Apollo");
    expect(el.textContent).toContain("Projeto"); // subtitle default
    // type color class is applied to the icon (full literal class kept by Tailwind)
    expect(container.innerHTML).toContain("text-node-project");
  });

  it("custom subtitle overrides the type name", () => {
    act(() => root.render(<GraphNode type="person" label="João" subtitle="a 2 saltos" />));
    const el = container.querySelector('[role="group"]') as HTMLElement;
    expect(el.textContent).toContain("a 2 saltos");
    expect(el.textContent).not.toContain("Pessoa");
  });

  it("shows the confidence StateBadge only when `state` is set", () => {
    act(() => root.render(<GraphNode type="person" label="João" />));
    expect(container.querySelector('[data-state]')).toBeNull();
    act(() => root.render(<GraphNode type="person" label="João" state="uncertain" />));
    const badge = container.querySelector('[data-state="uncertain"]');
    expect(badge).not.toBeNull();
  });

  it("default/accepted border is the GlassSurface panel glass edge (border-border-glass), not green/blue", () => {
    // no state and accepted both fall through to the panel's own border (front.md §5.1)
    act(() => root.render(<GraphNode type="person" label="x" />));
    expect(container.innerHTML).toContain("border-border-glass");
    expect(container.innerHTML).not.toContain("border-action/40");
    act(() => root.render(<GraphNode type="person" label="x" state="accepted" />));
    expect(container.innerHTML).toContain("border-border-glass");
  });

  it("forwards ref to the root (React 19 ref-as-prop)", () => {
    const ref = createRef<HTMLDivElement>();
    act(() => root.render(<GraphNode type="task" label="x" ref={ref} />));
    expect(ref.current).toBe(container.querySelector('[role="group"]'));
  });
});
