import type { FC } from "react";
import { Controller, type Control } from "react-hook-form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { EntityFormValues } from "./entity-form-schema";
import { todayLocalDate } from "./entity-local-date";

export interface ValidityFieldsProps {
  readonly attributeKey: string;
  readonly name: string;
  readonly id: string;
  readonly index: number;
  readonly orderMessage: string | null;
  readonly control: Control<EntityFormValues>;
}

export const ValidityFields: FC<ValidityFieldsProps> = ({
  attributeKey,
  name,
  id,
  index,
  orderMessage,
  control,
}) => {
  const fromId = `entity-valid-from-${id}`;
  const fromNoteId = `${fromId}-note`;
  const toId = `entity-valid-to-${id}`;
  const toNoteId = `${toId}-note`;
  const toErrorId = `${toId}-error`;

  return (
    <div
      role="group"
      aria-label={`Validade de ${name}`}
      data-testid={`entity-validity-${attributeKey}`}
      className="flex flex-wrap items-start gap-xs"
    >
      <Controller
        control={control}
        name={`fields.${index}.validFrom`}
        render={({ field }) => {
          const unstated = field.value === "";
          return (
            <div className="flex min-w-0 flex-1 flex-col gap-xs">
              <Label htmlFor={fromId}>Início da validade</Label>
              <Input
                {...field}
                id={fromId}
                type="date"
                aria-label={`Início da validade de ${name}`}
                aria-describedby={unstated ? fromNoteId : undefined}
                data-testid={`entity-valid-from-${attributeKey}`}
              />
              {unstated ? (
                <p
                  id={fromNoteId}
                  data-testid={`entity-valid-from-today-${attributeKey}`}
                  className="text-xs text-muted-foreground"
                >
                  {`Início não informado: aparece como hoje, ${todayLocalDate()}.`}
                </p>
              ) : null}
            </div>
          );
        }}
      />
      <Controller
        control={control}
        name={`fields.${index}.validTo`}
        render={({ field }) => (
          <div className="flex min-w-0 flex-1 flex-col gap-xs">
            <Label htmlFor={toId}>Fim da validade</Label>
            <Input
              {...field}
              id={toId}
              type="date"
              aria-label={`Fim da validade de ${name}`}
              aria-invalid={orderMessage === null ? undefined : true}
              aria-describedby={
                orderMessage === null ? toNoteId : `${toNoteId} ${toErrorId}`
              }
              data-testid={`entity-valid-to-${attributeKey}`}
            />
            <p id={toNoteId} className="text-xs text-muted-foreground">
              Opcional: pode ficar vazio.
            </p>
            {orderMessage === null ? null : (
              <p
                id={toErrorId}
                role="alert"
                data-testid={`entity-valid-to-error-${attributeKey}`}
                className="text-xs text-destructive"
              >
                {orderMessage}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
};
