import { toNestErrors } from "@hookform/resolvers";
import type { FieldError, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

export function zodIssueResolver<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues>,
): Resolver<TFieldValues> {
  return (values, _context, options) => {
    const parsed = schema.safeParse(values);
    if (parsed.success) {
      return { values: parsed.data, errors: {} };
    }
    const flat: Record<string, FieldError> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.map(String).join(".");
      if (flat[path] === undefined) {
        flat[path] = { type: issue.code, message: issue.message };
      }
    }
    return { values: {}, errors: toNestErrors<TFieldValues>(flat, options) };
  };
}
