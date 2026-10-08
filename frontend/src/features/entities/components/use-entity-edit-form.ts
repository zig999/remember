import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import type { AttributeKey, NodeRead } from "../types";
import { buildEntityEdit } from "./entity-edit-payload";
import { changedFlags } from "./entity-field-changed";
import {
  buildEntityFormSchema,
  buildFormValues,
  type EntityFormValues,
} from "./entity-form-schema";
import { validityOrderMessages } from "./entity-validity-order";
import { useEntityReview, type EntityReviewState } from "./use-entity-review";
import { useUndoableSave, type UndoableSave } from "./use-undoable-save";
import { zodIssueResolver } from "./zod-issue-resolver";

export interface EntityEditForm {
  readonly node: NodeRead;
  readonly form: UseFormReturn<EntityFormValues>;
  readonly valueTypesAccepted: boolean;
  readonly changed: readonly boolean[];
  readonly validityOrder: readonly (string | null)[];
  readonly validityOrderAccepted: boolean;
  readonly review: EntityReviewState;
  readonly save: UndoableSave;
}

export function useEntityEditForm(
  propNode: NodeRead,
  attributeKeys: readonly AttributeKey[],
): EntityEditForm {
  const [restarted, setRestarted] = useState<NodeRead | null>(null);
  const [seenPropNode, setSeenPropNode] = useState(propNode);
  if (seenPropNode !== propNode) {
    setSeenPropNode(propNode);
    setRestarted(null);
  }
  const node = restarted ?? propNode;

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

  const validityOrder = useMemo(
    () => validityOrderMessages(held, changed, attributeKeys),
    [held, changed, attributeKeys],
  );
  const validityOrderAccepted = useMemo(
    () => validityOrder.every((message) => message === null),
    [validityOrder],
  );

  const review = useEntityReview(
    held,
    changed,
    values,
    attributeKeys,
    node.attributes,
    valueTypesAccepted,
    validityOrderAccepted,
  );

  const save = useUndoableSave(
    node.node.id,
    review,
    () =>
      buildEntityEdit(
        review.reason,
        held,
        changed,
        values,
        attributeKeys,
        node.attributes,
      ),
    (reloaded) => {
      setRestarted(reloaded);
      reset(buildFormValues(reloaded, attributeKeys));
    },
  );

  return {
    node,
    form,
    valueTypesAccepted,
    changed,
    validityOrder,
    validityOrderAccepted,
    review,
    save,
  };
}
