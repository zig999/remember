import { useEffect, useMemo } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import type { AttributeKey, NodeRead } from "../types";
import { changedFlags } from "./entity-field-changed";
import {
  buildEntityFormSchema,
  buildFormValues,
  type EntityFormValues,
} from "./entity-form-schema";
import { useEntityReview, type EntityReviewState } from "./use-entity-review";
import { zodIssueResolver } from "./zod-issue-resolver";

export interface EntityEditForm {
  readonly form: UseFormReturn<EntityFormValues>;
  readonly valueTypesAccepted: boolean;
  readonly changed: readonly boolean[];
  readonly review: EntityReviewState;
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

  const changed = useMemo(
    () => changedFlags(held, attributeKeys, node.attributes),
    [held, attributeKeys, node.attributes],
  );

  const review = useEntityReview(
    held,
    changed,
    values,
    attributeKeys,
    node.attributes,
    valueTypesAccepted,
  );

  return { form, valueTypesAccepted, changed, review };
}
