function twoDigits(part: number): string {
  return String(part).padStart(2, "0");
}

export function localCalendarDate(moment: Date): string {
  const year = String(moment.getFullYear()).padStart(4, "0");
  return `${year}-${twoDigits(moment.getMonth() + 1)}-${twoDigits(moment.getDate())}`;
}

export function todayLocalDate(): string {
  return localCalendarDate(new Date());
}
