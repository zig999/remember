export const REASON_MAX_CODE_UNITS = 1000;

export function trimmedReason(reason: string): string {
  return reason.trim();
}

export function isReasonTooLong(reason: string): boolean {
  return trimmedReason(reason).length > REASON_MAX_CODE_UNITS;
}

export function isReasonAccepted(reason: string): boolean {
  const length = trimmedReason(reason).length;
  return length >= 1 && length <= REASON_MAX_CODE_UNITS;
}
