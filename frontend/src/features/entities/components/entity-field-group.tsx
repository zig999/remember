import { useRef, type FC } from "react";
import { Controller, type Control } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { AttributeKey, NodeAttribute } from "../types";
import { ClosedChoice } from "./entity-closed-choice";
import { DisputedValues } from "./entity-disputed-values";
import type { EntityFormValues, GroupField } from "./entity-form-schema";
import { ValidityFields } from "./entity-validity-fields";

export interface EntityFieldGroupProps {
  readonly attributeKey: AttributeKey;
  readonly disputed: boolean;
  readonly heldValues: readonly NodeAttribute[];
  readonly fields: readonly GroupField[];
  readonly changed: readonly boolean[];
  readonly control: Control<EntityFormValues>;
  readonly onAdd: () => void;
  readonly onRemove: (index: number) => void;
}

export const EntityFieldGroup: FC<EntityFieldGroupProps> = ({
  attributeKey,
  disputed,
  heldValues,
  fields,
  changed,
  control,
  onAdd,
  onRemove,
}) => {
  const addRef = useRef<HTMLButtonElement>(null);
  const key = attributeKey.key;
  const titleId = `entity-title-${key}`;
  const helpId = `entity-help-${key}`;
  const description = attributeKey.description;
  const hasHelp = description !== null && description.length > 0;
  const first = fields[0];
  const listed = attributeKey.allowsMultiple;
  const numbered = listed && fields.length > 1;
  const allowedValues = attributeKey.allowedValues;

  const removeField = (index: number): void => {
    onRemove(index);
    addRef.current?.focus();
  };

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-testid={`entity-group-${key}`}
      className="flex flex-col gap-xs"
    >
      {first === undefined || allowedValues !== null ? (
        <p id={titleId} className="text-sm font-medium text-foreground">
          {key}
        </p>
      ) : (
        <Label id={titleId} htmlFor={`entity-field-${first.id}`}>
          {key}
        </Label>
      )}
      {disputed ? (
        <DisputedValues attributeKey={key} values={heldValues} />
      ) : null}
      {fields.map(({ index, id }, position) => (
        <div key={id} className="flex items-start gap-xs">
          <div className="flex min-w-0 flex-1 flex-col gap-xs">
            <Controller
              control={control}
              name={`fields.${index}.value`}
              render={({ field, fieldState }) => {
                const message = fieldState.error?.message;
                const errorId = `entity-error-${id}`;
                const described = [
                  hasHelp ? helpId : null,
                  message === undefined ? null : errorId,
                ]
                  .filter((reference) => reference !== null)
                  .join(" ");
                return (
                  <div className="flex min-w-0 flex-col gap-xs">
                    {allowedValues === null ? (
                      <Input
                        {...field}
                        id={`entity-field-${id}`}
                        type="text"
                        aria-label={
                          numbered
                            ? `${key} (valor ${position + 1})`
                            : undefined
                        }
                        aria-invalid={message === undefined ? undefined : true}
                        aria-describedby={
                          described === "" ? undefined : described
                        }
                        data-testid={`entity-field-${key}`}
                      />
                    ) : (
                      <ClosedChoice
                        name={numbered ? `${key} (valor ${position + 1})` : key}
                        fieldId={`entity-field-${id}`}
                        testId={`entity-field-${key}`}
                        value={field.value}
                        allowedValues={allowedValues}
                        describedBy={described}
                        onChange={field.onChange}
                      />
                    )}
                    {message === undefined ? null : (
                      <p
                        id={errorId}
                        role="alert"
                        data-testid={`entity-error-${key}`}
                        className="text-xs text-destructive"
                      >
                        {message}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            {attributeKey.isTemporal && changed[index] === true ? (
              <ValidityFields
                attributeKey={key}
                name={numbered ? `${key} (valor ${position + 1})` : key}
                id={id}
                index={index}
                control={control}
              />
            ) : null}
          </div>
          {listed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remover valor ${position + 1} de ${key}`}
              onClick={() => removeField(index)}
              data-testid={`entity-remove-${key}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ))}
      {listed && !disputed ? (
        <Button
          ref={addRef}
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Adicionar valor a ${key}`}
          onClick={onAdd}
          data-testid={`entity-add-${key}`}
          className="self-start"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar valor
        </Button>
      ) : null}
      {hasHelp ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
};
