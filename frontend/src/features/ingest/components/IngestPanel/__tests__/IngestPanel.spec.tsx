/**
 * IngestPanel — focused accessibility tests (dev_tc_004_r1, BUG-02 + BUG-04).
 *
 * The full UI flow is covered by `IngestWorkspace.spec.tsx`. These tests
 * render the panel in isolation to assert two ARIA contracts that are not
 * directly exercised from the workspace harness:
 *
 *  - BUG-02: `aria-busy="true"` on `data-testid="ingest-progress"` while the
 *    run is in flight (`sending` / `extracting`), and `aria-busy="false"`
 *    on terminal phases. `ingest.feature.spec.md §8`.
 *  - BUG-04: `aria-invalid="true"` on the textarea **and** select when
 *    `validationMessage` is non-empty; the validation paragraph is rendered
 *    with its testid. `ingest.feature.spec.md §8`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { IngestPanel } from "../IngestPanel";
import type { IngestPanelProps, IngestPhase } from "../IngestPanel.types";

// @ts-expect-error — augment the jsdom global for the test run only.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function $(testid: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${testid}"]`) as HTMLElement | null;
}

function baseProps(overrides: Partial<IngestPanelProps> = {}): IngestPanelProps {
  return {
    phase: "idle",
    content: "",
    sourceType: "",
    onContentChange: vi.fn(),
    onSourceTypeChange: vi.fn(),
    onSubmit: vi.fn(),
    onAssembleExisting: vi.fn(),
    onRetry: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("IngestPanel — progress region aria-busy (BUG-02)", () => {
  it.each<IngestPhase>(["sending", "extracting", "polling"])(
    "sets aria-busy='true' on the progress region during phase '%s'",
    (phase) => {
      act(() => {
        root.render(<IngestPanel {...baseProps({ phase })} />);
      });
      const progress = $("ingest-progress");
      expect(progress).not.toBeNull();
      expect(progress!.getAttribute("aria-busy")).toBe("true");
    },
  );

  it.each<IngestPhase>(["idle", "ready", "complete", "error", "noop"])(
    "sets aria-busy='false' on the progress region in terminal/idle phase '%s'",
    (phase) => {
      act(() => {
        root.render(<IngestPanel {...baseProps({ phase })} />);
      });
      const progress = $("ingest-progress");
      expect(progress).not.toBeNull();
      expect(progress!.getAttribute("aria-busy")).toBe("false");
    },
  );

  it("keeps aria-live='polite' on the progress region (announce on change)", () => {
    act(() => {
      root.render(<IngestPanel {...baseProps({ phase: "sending" })} />);
    });
    expect($("ingest-progress")!.getAttribute("aria-live")).toBe("polite");
  });
});

describe("IngestPanel — form validation aria-invalid (BUG-04)", () => {
  it("omits aria-invalid when no validationMessage is provided", () => {
    act(() => {
      root.render(
        <IngestPanel {...baseProps({ phase: "idle", content: "abc" })} />,
      );
    });
    const textarea = $("ingest-content") as HTMLTextAreaElement;
    const select = $("ingest-source-type") as HTMLSelectElement;
    // The shared Textarea / SelectTrigger emit `aria-invalid` only when
    // invalid (`invalid || undefined`); a valid field has no attribute,
    // which AT treats the same as "false".
    expect(textarea.getAttribute("aria-invalid")).toBeNull();
    expect(select.getAttribute("aria-invalid")).toBeNull();
    expect($("ingest-validation")).toBeNull();
  });

  it("sets aria-invalid='true' on textarea and select when validationMessage is non-empty", () => {
    act(() => {
      root.render(
        <IngestPanel
          {...baseProps({
            phase: "idle",
            content: "abc",
            validationMessage: "Selecione um tipo de fonte antes de ingerir.",
          })}
        />,
      );
    });
    const textarea = $("ingest-content") as HTMLTextAreaElement;
    const select = $("ingest-source-type") as HTMLSelectElement;
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(select.getAttribute("aria-invalid")).toBe("true");
  });

  it("renders the validation paragraph with the provided message", () => {
    act(() => {
      root.render(
        <IngestPanel
          {...baseProps({
            phase: "idle",
            validationMessage: "Conteúdo obrigatório.",
          })}
        />,
      );
    });
    const paragraph = $("ingest-validation");
    expect(paragraph).not.toBeNull();
    expect(paragraph!.textContent).toBe("Conteúdo obrigatório.");
  });
});
