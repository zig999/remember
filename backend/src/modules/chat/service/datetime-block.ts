// Datetime BlockB renderer — chat.back.md BR-47 v2.9.
//
// Renders the dynamic, non-cached SECOND system block fed into the Anthropic
// `system` array on every chat turn. The output is a SHORT pt-BR string of
// the EXACT shape `"Data/hora atual do dono: <ISO-8601 with offset> (<tz-id>)"`
// (e.g. `"Data/hora atual do dono: 2026-06-26T11:00:00-03:00 (America/Sao_Paulo)"`).
//
// Why a separate file: the renderer is a pure utility (no DB, no env, no
// logger). Keeping it isolated lets the context-builder import it without
// circular deps and lets unit tests target a single 3-line function.
//
// Timezone handling. We use `Intl.DateTimeFormat` with `hourCycle: "h23"` and
// the requested IANA zone — Node 20's bundled ICU knows every standard zone
// including DST transitions. The offset is computed via the same formatter's
// `timeZoneName: "shortOffset"` part (e.g. `"GMT-03:00"`), which we trim to
// the strict ISO-8601 form `±HH:MM`. The renderer is panic-free by contract:
// `OWNER_TZ` is validated at boot (`loadEnv`), so an unknown zone never
// reaches this code path (BR-47 step 4).

const ISO_PREFIX = "Data/hora atual do dono: " as const;

/**
 * Render the BR-47 BlockB string for a given clock instant + IANA zone.
 *
 * @param now  Instant to render (`new Date()` captured ONCE at the start of
 *             the turn — BR-47 step 6).
 * @param tz   IANA zone id (e.g. `"America/Sao_Paulo"`). Trusted by contract:
 *             `loadEnv` validates `OWNER_TZ` at boot, so callers in the
 *             production path always pass a known-good zone. Tests may pass
 *             arbitrary strings — the `Intl` call throws `RangeError` then,
 *             which is the correct surface for a misuse.
 *
 * @returns    The exact-shape string per BR-47 step 2 example.
 */
export function renderDatetimeBlockB(now: Date, tz: string): string {
  const iso = formatIsoWithOffset(now, tz);
  return `${ISO_PREFIX}${iso} (${tz})`;
}

/**
 * Format `now` as `YYYY-MM-DDTHH:mm:ss±HH:MM` in the requested IANA zone.
 *
 * Internal helper — exported for unit-test introspection. Two `Intl` passes:
 *   1. Local date+time parts in the zone (`en-CA` -> ISO-friendly date format).
 *   2. The zone's short offset for that instant (DST-aware) -> the `±HH:MM` tail.
 *
 * We do NOT rely on `Date.prototype.toISOString` because that returns UTC and
 * we need the WALL-CLOCK time in `tz`. The two `Intl` passes are deterministic
 * for any (instant, zone) pair.
 */
export function formatIsoWithOffset(now: Date, tz: string): string {
  // Pass 1: extract the local-wall-clock parts in `tz`. `en-CA` is chosen
  // because its short-date format matches `YYYY-MM-DD` by default; combined
  // with `hourCycle: "h23"` we get a strictly numeric 24-hour clock with
  // zero-padded fields.
  const dtFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts: Record<string, string> = {};
  for (const part of dtFormatter.formatToParts(now)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  // `hour` with `hourCycle: "h23"` is `"00".."23"`. Defensive normalisation:
  // some ICU builds may emit `"24"` exactly at midnight — coerce to `"00"`.
  const hh = parts.hour === "24" ? "00" : parts.hour ?? "00";
  const datePart = `${parts.year}-${parts.month}-${parts.day}T${hh}:${parts.minute}:${parts.second}`;

  // Pass 2: the zone's offset at `now` (DST-aware). `timeZoneName:
  // "shortOffset"` emits strings like `"GMT-03:00"` / `"GMT+05:30"` /
  // `"GMT"` (== UTC). Strip the literal `"GMT"` prefix; normalize the bare
  // `"GMT"` case to `"+00:00"` so the output is always `±HH:MM`.
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    timeZoneName: "shortOffset",
    hourCycle: "h23",
  });
  let raw = "+00:00";
  for (const part of offsetFormatter.formatToParts(now)) {
    if (part.type === "timeZoneName") {
      raw = part.value;
      break;
    }
  }
  const offsetTail = normalizeShortOffset(raw);
  return `${datePart}${offsetTail}`;
}

/**
 * Convert an ICU `timeZoneName: "shortOffset"` part to a strict ISO-8601
 * offset (`±HH:MM`).
 *
 * Inputs we accept (the only shapes ICU emits for `shortOffset`):
 *   - `"GMT"`         -> `"+00:00"` (UTC)
 *   - `"GMT-3"`       -> `"-03:00"`
 *   - `"GMT-03"`      -> `"-03:00"`
 *   - `"GMT-03:00"`   -> `"-03:00"`
 *   - `"GMT+5:30"`    -> `"+05:30"`
 *   - `"UTC"`         -> `"+00:00"` (fallback — older ICU)
 *
 * Anything outside these shapes falls back to `"+00:00"`; the caller has no
 * better signal and BlockB is a HINT (BR-47 step 5), not a business decision.
 */
function normalizeShortOffset(raw: string): string {
  if (raw === "GMT" || raw === "UTC") return "+00:00";
  // Match `GMT[+-]HH(:MM)?` where the hours may be single or double-digit.
  const m = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(raw);
  if (m === null) return "+00:00";
  const sign = m[1];
  const hh = m[2]!.padStart(2, "0");
  const mm = m[3] ?? "00";
  return `${sign}${hh}:${mm}`;
}
