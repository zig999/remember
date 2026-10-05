import { z } from "zod";
import type { CorrectItemRequest } from "../../types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

    if (data.validFrom !== null && data.validTo !== null) {
      if (data.validFrom >= data.validTo) {
        ctx.addIssue({
          code: "custom",
          path: ["validTo"],
          message: "O início deve ser anterior ao fim.",
        });
      }
    }

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
