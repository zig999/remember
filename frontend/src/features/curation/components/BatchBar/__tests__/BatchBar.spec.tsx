/**
 * BatchBar — render + per-kind action availability tests (TC-06).
 *
 * Why each test (Rule 9):
 *  - Self-occults below 2 items because the spec UI-12 entry condition is
 *    "≥2 itens selecionados via checkbox (homogêneos)". Rendering with 1
 *    item would expose batch actions that don't match the contract.
 *  - entity_match kind only shows "Manter separados N". A regression that
 *    showed Confirmar / Rejeitar here would call mutations that the BFF
 *    rejects (BUSINESS_INVALID for the wrong endpoint).
 *  - uncertain kind shows Confirmar + Rejeitar. Reject below the 5-item
 *    threshold dispatches immediately; at ≥5 items it enters inline
 *    confirmation per §5 (NOT a modal — modal would block the queue).
 *  - disputed kind disables every action with a visible tooltip — spec
 *    says batch resolution of disputes is not supported.
 *  - Clear button calls onClear so the parent can drop the selection set.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BatchBar, BATCH_REJECT_CONFIRM_THRESHOLD } from "../BatchBar";

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

function getButtonByAriaLabel(label: string): HTMLButtonElement | null {
  return container.querySelector(
    `button[aria-label='${label}']`,
  ) as HTMLButtonElement | null;
}

describe("BatchBar", () => {
  it("renders nothing when count < 2", () => {
    act(() => {
      root.render(
        <BatchBar
          count={1}
          kind="uncertain"
          onClear={() => {}}
        />,
      );
    });
    expect(container.textContent).toBe("");
  });

  it("entity_match shows only 'Manter separados N'", () => {
    act(() => {
      root.render(
        <BatchBar
          count={3}
          kind="entity_match"
          onKeepSeparate={() => {}}
          onClear={() => {}}
        />,
      );
    });
    expect(getButtonByAriaLabel("Manter separados 3")).not.toBeNull();
    expect(getButtonByAriaLabel("Confirmar 3")).toBeNull();
    expect(getButtonByAriaLabel("Rejeitar 3")).toBeNull();
  });

  it("uncertain shows Confirmar + Rejeitar (immediate at <5)", () => {
    const onConfirm = vi.fn();
    const onReject = vi.fn();
    act(() => {
      root.render(
        <BatchBar
          count={3}
          kind="uncertain"
          onConfirm={onConfirm}
          onReject={onReject}
          onClear={() => {}}
        />,
      );
    });
    const confirmBtn = getButtonByAriaLabel("Confirmar 3");
    const rejectBtn = getButtonByAriaLabel("Rejeitar 3");
    expect(confirmBtn).not.toBeNull();
    expect(rejectBtn).not.toBeNull();
    act(() => {
      confirmBtn?.click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    act(() => {
      rejectBtn?.click();
    });
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("uncertain reject ≥5 items requires inline confirmation", () => {
    const onReject = vi.fn();
    const N = BATCH_REJECT_CONFIRM_THRESHOLD;
    act(() => {
      root.render(
        <BatchBar
          count={N}
          kind="uncertain"
          onReject={onReject}
          onClear={() => {}}
        />,
      );
    });
    // First click on Rejeitar: opens inline confirmation, does NOT call onReject.
    act(() => {
      getButtonByAriaLabel(`Rejeitar ${N}`)?.click();
    });
    expect(onReject).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      `Você está rejeitando ${N} itens. Confirmar?`,
    );
    // Click Cancelar — onReject still not called.
    const cancel = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Cancelar",
    );
    expect(cancel).not.toBeUndefined();
    act(() => {
      cancel?.click();
    });
    expect(onReject).not.toHaveBeenCalled();
    // Re-trigger the flow and confirm.
    act(() => {
      getButtonByAriaLabel(`Rejeitar ${N}`)?.click();
    });
    const confirm = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Confirmar",
    );
    act(() => {
      confirm?.click();
    });
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("disputed kind disables every action with tooltip", () => {
    act(() => {
      root.render(
        <BatchBar
          count={3}
          kind="disputed"
          onConfirm={() => {}}
          onReject={() => {}}
          onKeepSeparate={() => {}}
          onClear={() => {}}
        />,
      );
    });
    // Disputed kind has none of the per-kind buttons rendered (showConfirm /
    // showReject / showKeepSeparate are all false).
    expect(getButtonByAriaLabel("Confirmar 3")).toBeNull();
    expect(getButtonByAriaLabel("Rejeitar 3")).toBeNull();
    expect(getButtonByAriaLabel("Manter separados 3")).toBeNull();
    // The note role explains why.
    const note = container.querySelector("[role='note']");
    expect(note?.textContent).toContain(
      "Disputas devem ser resolvidas individualmente.",
    );
  });

  it("clear button invokes onClear", () => {
    const onClear = vi.fn();
    act(() => {
      root.render(
        <BatchBar count={2} kind="uncertain" onClear={onClear} />,
      );
    });
    act(() => {
      getButtonByAriaLabel("Limpar seleção")?.click();
    });
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
