/**
 * correction-schema — Zod schema mirroring `CorrectItemRequest` (TC-05).
 *
 * Spec references:
 *  - curadoria.feature.spec.md §5 (client validations + pt-BR messages).
 *  - openapi.yaml CorrectItemRequest / CorrectedValues / ValidFromSource.
 *
 * Schema-first per CLAUDE.md "Forms — React Hook Form + Zod":
 *   schema -> z.infer<...> -> useForm<...>. Top-level `z.uuid()` (Zod v4).
 *
 * Single-owner pt-BR messages match §5 exactly:
 *  - "Informe o valor corrigido." (atributo)
 *  - "Selecione o nó-alvo da fusão." (link target — uuid validation)
 *  - "Data inválida. Use o formato AAAA-MM-DD."
 *  - "O início deve ser anterior ao fim."
 *  - "Selecione o fragmento que justifica a data."
 *  - "Informe um motivo para continuar."
 */
import { z } from "zod";
import type { CorrectItemRequest } from "../../types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Empty string is treated as "not provided" — RHF defaults always render
 *  a controlled string but the request DTO accepts null. */
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.length === 0 ? null : v));

const dateString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.length === 0 ? null : v))
  .superRefine((v, ctx) => {
    if (v !== null && !ISO_DATE_RE.test(v)) {
      ctx.addIssue({
        code: "custom",
        message: "Data inválida. Use o formato AAAA-MM-DD.",
      });
    }
  });

export const validFromSourceSchema = z.enum(["stated", "document", "received"]);

export const correctionSchema = z
  .object({
    itemKind: z.enum(["link", "attribute"]),
    itemId: z.string().min(1),
    value: optionalString,
    targetNodeId: optionalString,
    validFrom: dateString,
    validTo: dateString,
    validFromSource: validFromSourceSchema,
    validFromFragmentId: optionalString,
    reason: z
      .string()
      .trim()
      .min(1, { message: "Informe um motivo para continuar." }),
  })
  .superRefine((data, ctx) => {
    // Field requirement by kind — see openapi.yaml CorrectedValues "anyOf".
    if (data.itemKind === "attribute") {
      if (data.value === null) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Informe o valor corrigido.",
        });
      }
    } else if (data.itemKind === "link") {
      if (data.targetNodeId === null) {
        ctx.addIssue({
          code: "custom",
          path: ["targetNodeId"],
          message: "Selecione o nó-alvo da fusão.",
        });
      }
    }

    // Temporal coherence (§5).
    if (data.validFrom !== null && data.validTo !== null) {
      if (data.validFrom >= data.validTo) {
        ctx.addIssue({
          code: "custom",
          path: ["validTo"],
          message: "O início deve ser anterior ao fim.",
        });
      }
    }

    // valid_from_source=stated requires the fragment id (BR-15).
    if (
      data.validFromSource === "stated" &&
      data.validFromFragmentId === null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["validFromFragmentId"],
        message: "Selecione o fragmento que justifica a data.",
      });
    }
  });

export type CorrectionFormValues = z.infer<typeof correctionSchema>;

/**
 * Default starting values for `useForm({ defaultValues })`. Empty strings
 * (not undefined) — `Controller` + shadcn `Input` are controlled inputs.
 */
export interface CorrectionRawDefaults {
  readonly itemKind: "link" | "attribute";
  readonly itemId: string;
  readonly value?: string | null;
  readonly targetNodeId?: string | null;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly validFromSource?: "stated" | "document" | "received";
  readonly validFromFragmentId?: string | null;
}

export function buildDefaults(
  d: CorrectionRawDefaults,
): Record<string, string> {
  return {
    itemKind: d.itemKind,
    itemId: d.itemId,
    value: d.value ?? "",
    targetNodeId: d.targetNodeId ?? "",
    validFrom: d.validFrom ?? "",
    validTo: d.validTo ?? "",
    validFromSource: d.validFromSource ?? "document",
    validFromFragmentId: d.validFromFragmentId ?? "",
    reason: "",
  };
}

/**
 * Map validated form values to the `CorrectItemRequest` wire body — the
 * single source of the snake_case shape submitted by CorrectionForm
 * (openapi.yaml CorrectItemRequest / CorrectedValues). `itemKind` selects
 * `value` (attribute) vs `target_node_id` (link); the remaining fields are
 * passed through as the validated (possibly-null) values.
 */
export function buildCorrectItemRequest(
  itemKind: "link" | "attribute",
  itemId: string,
  values: CorrectionFormValues,
): CorrectItemRequest {
  return {
    item_kind: itemKind,
    item_id: itemId,
    corrected: {
      ...(itemKind === "attribute"
        ? { value: values.value }
        : { target_node_id: values.targetNodeId }),
      valid_from: values.validFrom,
      valid_to: values.validTo,
      valid_from_source: values.validFromSource,
      valid_from_fragment_id: values.validFromFragmentId,
    },
    reason: values.reason,
  };
}
