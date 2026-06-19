/**
 * report-error — stub for client-side error forwarding.
 *
 * Spec references:
 *  - front.back.md §7 (Known Technical Constraints, item 6): "Single-owner
 *    = no telemetry / no error tracker. Client-side errors above SYSTEM_*
 *    route through the BFF (pino logs) — the foundation MUST provide a
 *    `lib/report-error.ts` that POSTs to a BFF endpoint
 *    (`/api/v1/system/client-error`) **only if that endpoint exists**;
 *    absent the endpoint, errors stay in `console.error`."
 *  - front.back.md §8 (Out of Scope): "Client-side error reporting endpoint
 *    — `lib/report-error.ts` is a stub; the BFF endpoint that would receive
 *    forwarded errors is out of scope."
 *
 * Behaviour this wave:
 *  - In dev (`import.meta.env.DEV === true`): `console.error` the error and
 *    context.
 *  - In production: no-op (the endpoint does not exist yet).
 *
 * No network call is made in either mode — wiring the BFF endpoint is a
 * later wave.
 */

export interface ReportErrorContext {
  readonly source?: string;
  readonly queryKey?: ReadonlyArray<unknown>;
  readonly extra?: Readonly<Record<string, unknown>>;
}

export function reportError(error: unknown, context: ReportErrorContext = {}): void {
  if (!import.meta.env.DEV) {
    // Production: stay silent until the BFF endpoint ships.
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
