export const DATE_VALUE_MESSAGE = "Data inválida. Use o formato AAAA-MM-DD.";
export const NUMBER_VALUE_MESSAGE =
  "Número inválido. Use dígitos, com sinal de menos e ponto decimal opcionais.";
export const BOOL_VALUE_MESSAGE = "Valor booleano inválido. Use true ou false.";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

const MONTH_LENGTHS: readonly number[] = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function namesExistingDay(value: string): boolean {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (month < 1 || month > 12) return false;
  const length =
    month === 2 && isLeapYear(year) ? 29 : (MONTH_LENGTHS[month - 1] ?? 0);
  return day >= 1 && day <= length;
}

function readsAsDate(value: string): boolean {
  return DATE_PATTERN.test(value) && namesExistingDay(value);
}

function readsAsNumber(value: string): boolean {
  return NUMBER_PATTERN.test(value) && Number.isFinite(Number(value));
}

function readsAsBool(value: string): boolean {
  return value === "true" || value === "false";
}

export function valueTypeMessage(
  valueType: string,
  value: string,
): string | null {
  if (value === "") return null;
  switch (valueType) {
    case "date":
      return readsAsDate(value) ? null : DATE_VALUE_MESSAGE;
    case "number":
      return readsAsNumber(value) ? null : NUMBER_VALUE_MESSAGE;
    case "bool":
      return readsAsBool(value) ? null : BOOL_VALUE_MESSAGE;
    default:
      return null;
  }
}
