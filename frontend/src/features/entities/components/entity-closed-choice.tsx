import { useMemo, useRef, type FC } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import type { AllowedValue } from "../types";
import { allowedValueOptions, isAllowedValue } from "./entity-allowed-values";

export interface ClosedChoiceProps {
  readonly name: string;
  readonly fieldId: string;
  readonly testId: string;
  readonly value: string;
  readonly allowedValues: readonly AllowedValue[];
  readonly describedBy: string;
  readonly onChange: (value: string) => void;
}

export const ClosedChoice: FC<ClosedChoiceProps> = ({
  name,
  fieldId,
  testId,
  value,
  allowedValues,
  describedBy,
  onChange,
}) => {
  const selectRef = useRef<HTMLDivElement>(null);
  const options = useMemo(
    () => allowedValueOptions(allowedValues),
    [allowedValues],
  );
  const heldOutside = value !== "" && !isAllowedValue(allowedValues, value);
  const outsideId = `${fieldId}-outside`;
  const described = [describedBy, heldOutside ? outsideId : ""]
    .filter((reference) => reference !== "")
    .join(" ");

  const clear = (): void => {
    onChange("");
    selectRef.current
      ?.querySelector<HTMLButtonElement>('[role="combobox"]')
      ?.focus();
  };

  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <div className="flex items-start gap-xs">
        <div className="min-w-0 flex-1">
          <Select
            ref={selectRef}
            role="group"
            aria-label={name}
            aria-describedby={described === "" ? undefined : described}
            value={value}
            onChange={onChange}
            options={options}
            placeholder="Selecionar valor"
            data-testid={testId}
          />
        </div>
        {value === "" ? null : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Limpar ${name}`}
            onClick={clear}
            data-testid={`${testId}-clear`}
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {heldOutside ? (
        <p
          id={outsideId}
          data-testid={`${testId}-outside`}
          className="text-xs text-muted-foreground"
        >
          {`Valor atual fora dos valores permitidos: ${value}`}
        </p>
      ) : null}
    </div>
  );
};
