/**
 * CorrectionForm — schema + render tests (TC-05).
 *
 * Strategy (mirrors features/auth/components/__tests__/SignInForm.spec.tsx):
 *  - The Zod schema is tested DIRECTLY (sync, hermetic) — this is where
 *    the §5 input validations live. Testing the schema avoids the async-
 *    act + unhandled-rejection noise that arises when submitting through
 *    RHF + zodResolver under vitest's jsdom.
 *  - The component is tested at its visible surface: cancel button calls
 *    `onCancel`; serverError BUSINESS_CORRECTION_NO_CHANGES renders an
 *    inline form-level message; date radio group is rendered.
 *
 * Why each test (Rule 9 — encode the WHY):
 *  - Reason empty -> error (§5 ReasonField requirement; if this regresses
 *    the curator can dispatch destructive actions with no audit trail).
 *  - Value empty for attribute kind -> error (§5; UI-11 attribute correction
 *    needs a new value or the request is a no-op).
 *  - validFrom >= validTo -> error (§5; BUSINESS_TEMPORAL_INCOHERENT mirror).
 *  - validFromSource=stated without fragment id -> error (§5 BR-15 mirror).
 *  - validFromSource=document/received always pass (closed enum sanity).
 *  - Server error BUSINESS_CORRECTION_NO_CHANGES renders inline (§6).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CorrectionForm } from "../CorrectionForm";
import { buildCorrectItemRequest, correctionSchema } from "../correction-schema";

// jsdom doesn't ship ResizeObserver — Radix Radio Group / Popover rely on
// it for their size measurement. Polyfill to a no-op so the component
// mounts.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

/* ---------- Schema — direct, hermetic ---------- */

describe("correctionSchema — §5 validations", () => {
  function base(over: Partial<Record<string, unknown>> = {}) {
    return {
      itemKind: "attribute" as const,
      itemId: "attr-1",
      value: "Presidente",
      targetNodeId: "",
      validFrom: "",
      validTo: "",
      validFromSource: "document" as const,
      validFromFragmentId: "",
      reason: "promoção registrada",
      ...over,
    };
  }

  it("rejects empty reason with the canonical pt-BR message", () => {
    const result = correctionSchema.safeParse(base({ reason: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "reason");
      expect(issue?.message).toBe("Informe um motivo para continuar.");
    }
  });

  it("rejects empty value for attribute kind", () => {
    const result = correctionSchema.safeParse(base({ value: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "value");
      expect(issue?.message).toBe("Informe o valor corrigido.");
    }
  });

  it("rejects empty targetNodeId for link kind", () => {
    const result = correctionSchema.safeParse(
      base({ itemKind: "link", value: "", targetNodeId: "" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "targetNodeId",
      );
      expect(issue?.message).toBe("Selecione o nó-alvo da fusão.");
    }
  });

  it("rejects invalid date format", () => {
    const result = correctionSchema.safeParse(
      base({ validFrom: "01/02/2024" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "validFrom",
      );
      expect(issue?.message).toBe("Data inválida. Use o formato AAAA-MM-DD.");
    }
  });

  it("rejects validFrom >= validTo", () => {
    const result = correctionSchema.safeParse(
      base({ validFrom: "2024-01-01", validTo: "2023-01-01" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "validTo",
      );
      expect(issue?.message).toBe("O início deve ser anterior ao fim.");
    }
  });

  it("rejects validFromSource=stated without fragment id (BR-15 mirror)", () => {
    const result = correctionSchema.safeParse(
      base({ validFromSource: "stated", validFromFragmentId: "" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "validFromFragmentId",
      );
      expect(issue?.message).toBe(
        "Selecione o fragmento que justifica a data.",
      );
    }
  });

  it("accepts a fully valid attribute correction", () => {
    const result = correctionSchema.safeParse(base());
    expect(result.success).toBe(true);
  });

  it("accepts validFromSource=document or received without fragment id", () => {
    expect(
      correctionSchema.safeParse(base({ validFromSource: "received" }))
        .success,
    ).toBe(true);
    expect(
      correctionSchema.safeParse(base({ validFromSource: "document" }))
        .success,
    ).toBe(true);
  });
});

/* ---------- Wire shape — buildCorrectItemRequest (CorrectItemRequest) ----------
 *
 * Why: this is the exact body CorrectionForm.submit() sends to the curation
 * `correct` endpoint. The form fields are camelCase; the wire is snake_case
 * (openapi.yaml CorrectItemRequest). If this mapping silently drifts — a
 * dropped field, a wrong key, or `value` leaking into a link correction —
 * the server rejects the errata (or, worse, applies the wrong field) and the
 * curator's correction is lost. Tested via the same hermetic schema-parse
 * path the §5 tests use (no RHF/jsdom submission). */
describe("buildCorrectItemRequest — wire shape", () => {
  function parsed(over: Partial<Record<string, unknown>> = {}) {
    const result = correctionSchema.safeParse({
      itemKind: "attribute" as const,
      itemId: "attr-1",
      value: "Presidente",
      targetNodeId: "",
      validFrom: "2023-03-01",
      validTo: "",
      validFromSource: "document" as const,
      validFromFragmentId: "",
      reason: "promoção registrada",
      ...over,
    });
    if (!result.success) throw new Error("fixture must parse");
    return result.data;
  }

  it("maps an attribute correction to snake_case with `value` (no target_node_id)", () => {
    const body = buildCorrectItemRequest("attribute", "attr-1", parsed());
    expect(body).toEqual({
      item_kind: "attribute",
      item_id: "attr-1",
      corrected: {
        value: "Presidente",
        valid_from: "2023-03-01",
        valid_to: null,
        valid_from_source: "document",
        valid_from_fragment_id: null,
      },
      reason: "promoção registrada",
    });
    expect("target_node_id" in body.corrected).toBe(false);
  });

  it("maps a link correction to `target_node_id` (no value key)", () => {
    const values = parsed({ itemKind: "link", value: "", targetNodeId: "node-9" });
    const body = buildCorrectItemRequest("link", "link-1", values);
    expect(body.item_kind).toBe("link");
    expect(body.item_id).toBe("link-1");
    expect(body.corrected).toMatchObject({ target_node_id: "node-9" });
    expect("value" in body.corrected).toBe(false);
  });

  it("forwards the fragment id when valid_from_source=stated (BR-15)", () => {
    const values = parsed({
      validFromSource: "stated",
      validFromFragmentId: "frag-7",
    });
    const body = buildCorrectItemRequest("attribute", "attr-1", values);
    expect(body.corrected.valid_from_source).toBe("stated");
    expect(body.corrected.valid_from_fragment_id).toBe("frag-7");
  });
});

/* ---------- Render — visible surface ---------- */

let container: HTMLDivElement;
let root: Root;

function renderWithClient(ui: ReactElement): void {
  const qc = new QueryClient();
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
});

describe("CorrectionForm — visible surface", () => {
  it("renders attribute fields when itemKind=attribute", () => {
    renderWithClient(
      <CorrectionForm
        itemKind="attribute"
        itemId="attr-1"
        defaults={{ value: "Diretor" }}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(container.querySelector("#cf-value")).not.toBeNull();
    expect(container.querySelector("#cf-target")).toBeNull();
  });

  it("renders target-node-id input when itemKind=link", () => {
    renderWithClient(
      <CorrectionForm
        itemKind="link"
        itemId="link-1"
        defaults={{}}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(container.querySelector("#cf-target")).not.toBeNull();
    expect(container.querySelector("#cf-value")).toBeNull();
  });

  it("renders the three DateJustification radio options", () => {
    renderWithClient(
      <CorrectionForm
        itemKind="attribute"
        itemId="attr-1"
        defaults={{ value: "Diretor" }}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(container.textContent).toContain("Declarada no fragmento");
    expect(container.textContent).toContain("Data do documento");
    expect(container.textContent).toContain("Data de recebimento");
  });

  it("renders BUSINESS_CORRECTION_NO_CHANGES inline form-level message (§6)", () => {
    renderWithClient(
      <CorrectionForm
        itemKind="attribute"
        itemId="attr-1"
        defaults={{ value: "Diretor" }}
        onSubmit={() => undefined}
        onCancel={() => undefined}
        serverError={{
          code: "BUSINESS_CORRECTION_NO_CHANGES",
          message: "nada mudou (ignored — UI string takes precedence)",
        }}
      />,
    );
    expect(container.textContent).toContain(
      "Nenhuma alteração detectada. Modifique pelo menos um campo.",
    );
  });

  it("clicking Cancelar calls onCancel", () => {
    const onCancel = vi.fn();
    renderWithClient(
      <CorrectionForm
        itemKind="attribute"
        itemId="attr-1"
        defaults={{ value: "Diretor" }}
        onSubmit={() => undefined}
        onCancel={onCancel}
      />,
    );
    const cancel = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").includes("Cancelar"),
    );
    act(() => {
      cancel!.click();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
