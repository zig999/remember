import { type FC } from "react";
import { Controller, type Control } from "react-hook-form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { AttributeKey } from "../types";
import type { EntityFormValues } from "./entity-form-schema";

export interface EntityFieldGroupProps {
  readonly attributeKey: AttributeKey;
  readonly fieldIndexes: readonly number[];
  readonly control: Control<EntityFormValues>;
}

export const EntityFieldGroup: FC<EntityFieldGroupProps> = ({
  attributeKey,
  fieldIndexes,
  control,
}) => {
  const titleId = `entity-title-${attributeKey.key}`;
  const helpId = `entity-help-${attributeKey.key}`;
  const description = attributeKey.description;
  const hasHelp = description !== null && description.length > 0;
  const firstIndex = fieldIndexes[0];

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-testid={`entity-group-${attributeKey.key}`}
      className="flex flex-col gap-xs"
    >
      {firstIndex === undefined ? (
        <p id={titleId} className="text-sm font-medium text-foreground">
          {attributeKey.key}
        </p>
      ) : (
        <Label id={titleId} htmlFor={`entity-field-${firstIndex}`}>
          {attributeKey.key}
        </Label>
      )}
      {fieldIndexes.map((index) => (
        <Controller
          key={index}
          control={control}
          name={`fields.${index}.value`}
          render={({ field }) => (
            <Input
              {...field}
              id={`entity-field-${index}`}
              type="text"
              aria-describedby={hasHelp ? helpId : undefined}
              data-testid={`entity-field-${attributeKey.key}`}
            />
          )}
        />
      ))}
      {hasHelp ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
};
