/**
 * IngestDropzone — keyboard accessibility tests (dev_tc_004_r1, BUG-03).
 *
 * Acceptance criterion (ingest.feature.spec.md §8): the dropzone is
 * keyboard accessible — Tab focusable when enabled (`tabIndex=0`), removed
 * from tab order when disabled (`tabIndex=-1`), Enter and Space trigger
 * the file picker, and a disabled dropzone ignores both keys. It also
 * exposes `role="button"` + `aria-label` for assistive tech.
 *
 * These tests render the dropzone directly and assert against the DOM —
 * jsdom does not actually open a file dialog, so we spy on the hidden
 * `<input type="file">.click()` to confirm activation.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { IngestDropzone } from "../IngestDropzone";

// @ts-expect-error — augment the jsdom global for the test run only.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function $(testid: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${testid}"]`) as HTMLElement | null;
}

function pressKey(el: HTMLElement, key: string): void {
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("IngestDropzone — keyboard accessibility (BUG-03)", () => {
  it("exposes role='button' and an aria-label on the drop zone", () => {
    const onContent = vi.fn();
    act(() => {
      root.render(<IngestDropzone onContent={onContent} />);
    });
    const zone = $("ingest-dropzone");
    expect(zone).not.toBeNull();
    expect(zone!.getAttribute("role")).toBe("button");
    // aria-label must be present and non-empty so screen readers announce
    // the affordance even with no visible heading.
    const label = zone!.getAttribute("aria-label");
    expect(label).not.toBeNull();
    expect(label!.length).toBeGreaterThan(0);
  });

  it("has tabIndex=0 when not disabled (Tab-focusable)", () => {
    act(() => {
      root.render(<IngestDropzone onContent={vi.fn()} />);
    });
    const zone = $("ingest-dropzone");
    expect(zone!.tabIndex).toBe(0);
  });

  it("has tabIndex=-1 when disabled (removed from tab order)", () => {
    act(() => {
      root.render(<IngestDropzone onContent={vi.fn()} disabled />);
    });
    const zone = $("ingest-dropzone");
    expect(zone!.tabIndex).toBe(-1);
  });

  it("Enter key triggers the hidden file input", () => {
    act(() => {
      root.render(<IngestDropzone onContent={vi.fn()} />);
    });
    const zone = $("ingest-dropzone")!;
    const input = $("ingest-dropzone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    pressKey(zone, "Enter");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("Space key triggers the hidden file input", () => {
    act(() => {
      root.render(<IngestDropzone onContent={vi.fn()} />);
    });
    const zone = $("ingest-dropzone")!;
    const input = $("ingest-dropzone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    pressKey(zone, " ");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("disabled dropzone ignores Enter and Space (no picker invocation)", () => {
    act(() => {
      root.render(<IngestDropzone onContent={vi.fn()} disabled />);
    });
    const zone = $("ingest-dropzone")!;
    const input = $("ingest-dropzone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    pressKey(zone, "Enter");
    pressKey(zone, " ");
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("disabled dropzone exposes aria-disabled='true'", () => {
    act(() => {
      root.render(<IngestDropzone onContent={vi.fn()} disabled />);
    });
    const zone = $("ingest-dropzone")!;
    expect(zone.getAttribute("aria-disabled")).toBe("true");
  });
});
