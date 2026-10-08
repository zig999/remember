import { useEffect, useMemo, type FC, type FormEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AttributeKey, NodeRead } from "../types";
import { EntityFieldGroup } from "./entity-field-group";
import {
  buildFieldGroups,
  buildFormValues,
  emptyField,
  entityFormSchema,
  type EntityFormValues,
} from "./entity-form-schema";

export interface EntityFormProps {
  readonly node: NodeRead;
  readonly attributeKeys: readonly AttributeKey[];
}

function holdSubmission(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

export const EntityForm: FC<EntityFormProps> = ({ node, attributeKeys }) => {
  const values = useMemo(
    () => buildFormValues(node, attributeKeys),
    [node, attributeKeys],
  );

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: values,
    mode: "onBlur",
  });
  const { control, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });
  const groups = useMemo(
    () => buildFieldGroups(node, attributeKeys, fields),
    [node, attributeKeys, fields],
  );

  useEffect(() => {
    reset(values);
  }, [reset, values]);

  return (
    <form
      aria-label="Formulário de edição"
      noValidate
      onSubmit={holdSubmission}
      data-testid="entity-form"
      className="flex flex-col gap-md"
    >
      {groups.map((group) => (
        <EntityFieldGroup
          key={group.attributeKey.key}
          attributeKey={group.attributeKey}
          disputed={group.disputed}
          fields={group.fields}
          control={control}
          onAdd={() => append(emptyField(group.attributeKey.key))}
          onRemove={remove}
        />
      ))}
    </form>
  );
};
