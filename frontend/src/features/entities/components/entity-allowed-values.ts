import type { AllowedValue } from "../types";

export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
}

export function allowedValueLabel(allowed: AllowedValue): string {
  const label = allowed.label;
  return label === null || label.trim().length === 0 ? allowed.value : label;
}

export function allowedValueOptions(
  allowedValues: readonly AllowedValue[],
): ChoiceOption[] {
  return allowedValues.map((allowed) => ({
    value: allowed.value,
    label: allowedValueLabel(allowed),
  }));
}

export function isAllowedValue(
  allowedValues: readonly AllowedValue[],
  value: string,
): boolean {
  return allowedValues.some((allowed) => allowed.value === value);
}
