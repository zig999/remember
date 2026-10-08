import { useEffect, useMemo } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import type { AttributeKey, NodeRead } from "../types";
import {
  buildEntityFormSchema,
  buildFormValues,
  type EntityFormValues,
} from "./entity-form-schema";
import { zodIssueResolver } from "./zod-issue-resolver";

export interface EntityEditForm {
  readonly form: UseFormReturn<EntityFormValues>;
  readonly valueTypesAccepted: boolean;
}

export function useEntityEditForm(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
): EntityEditForm {
  const values = useMemo(
    () => buildFormValues(node, attributeKeys),
    [node, attributeKeys],
  );
  const schema = useMemo(
    () => buildEntityFormSchema(attributeKeys),
    [attributeKeys],
  );

  const form = useForm<EntityFormValues>({
    resolver: zodIssueResolver<EntityFormValues>(schema),
    defaultValues: values,
    mode: "onChange",
  });
  const { control, reset } = form;

  useEffect(() => {
    reset(values);
  }, [reset, values]);

  const held = useWatch({ control, name: "fields" });
  const valueTypesAccepted = useMemo(
    () => schema.safeParse({ fields: held }).success,
    [schema, held],
  );

  return { form, valueTypesAccepted };
}
