export interface ReportErrorContext {
  readonly source?: string;
  readonly queryKey?: ReadonlyArray<unknown>;
  readonly extra?: Readonly<Record<string, unknown>>;
}

export function reportError(error: unknown, context: ReportErrorContext = {}): void {
  if (!import.meta.env.DEV) {
    return;
  }
  // eslint-disable-next-line no-console
  console.error("[report-error]", {
    error,
    source: context.source,
    queryKey: context.queryKey,
    extra: context.extra,
  });
}
