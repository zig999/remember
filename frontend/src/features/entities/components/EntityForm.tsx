import { useMemo, type FC, type FormEvent } from "react";
import { useFieldArray } from "react-hook-form";
import type { AttributeKey, NodeRead } from "../types";
import { EntityFieldGroup } from "./entity-field-group";
import {
  buildFieldGroups,
  emptyField,
  outsideCatalogGroupsOf,
} from "./entity-form-schema";
import { OutsideCatalogValues } from "./entity-outside-catalog-values";
import { EntityReview } from "./entity-review";
import { useEntityEditForm } from "./use-entity-edit-form";

export interface EntityFormProps {
  readonly node: NodeRead;
  readonly attributeKeys: readonly AttributeKey[];
}

function holdSubmission(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

export const EntityForm: FC<EntityFormProps> = ({ node, attributeKeys }) => {
  const { form, valueTypesAccepted, changed, validityOrder, review, save } =
    useEntityEditForm(node, attributeKeys);
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });
  const groups = useMemo(
    () => buildFieldGroups(node, attributeKeys, fields),
    [node, attributeKeys, fields],
  );
  const outsideCatalog = useMemo(
    () => outsideCatalogGroupsOf(node.attributes, attributeKeys),
    [node, attributeKeys],
  );

  return (
    <form
      aria-label="Formulário de edição"
      noValidate
      onSubmit={holdSubmission}
      data-testid="entity-form"
      data-value-types-accepted={valueTypesAccepted}
      className="flex flex-col gap-md"
    >
      {groups.map((group) => (
        <EntityFieldGroup
          key={group.attributeKey.key}
          attributeKey={group.attributeKey}
          disputed={group.disputed}
          heldValues={group.heldValues}
          fields={group.fields}
          changed={changed}
          validityOrder={validityOrder}
          control={control}
          onAdd={() => append(emptyField(group.attributeKey.key))}
          onRemove={remove}
        />
      ))}
      <OutsideCatalogValues groups={outsideCatalog} />
      <EntityReview review={review} onConfirm={save.confirm} />
    </form>
  );
};
