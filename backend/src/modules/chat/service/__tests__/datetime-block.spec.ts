// Unit tests for renderDatetimeBlockB — chat.back.md BR-47 v2.9.
//
// What's verified:
//   - The exact-shape contract (BR-47 step 2 example).
//   - Timezone offset is rendered DST-aware via Intl.DateTimeFormat.
//   - UTC zones render `+00:00`.
//   - An unknown zone surfaces as RangeError (the boot path catches this at
//     `loadEnv`; this is a defensive regression).

import { describe, expect, it } from "vitest";

import {
  formatIsoWithOffset,
  renderDatetimeBlockB,
} from "../datetime-block.js";

describe("renderDatetimeBlockB (BR-47 v2.9)", () => {
  it("matches the BR-47 step 2 example verbatim (America/Sao_Paulo)", () => {
    // BR-47 example: now=2026-06-26T14:00:00Z (UTC), tz=America/Sao_Paulo
    //   -> local wall-clock 11:00:00, offset -03:00 (no DST in 2026).
    const out = renderDatetimeBlockB(
      new Date("2026-06-26T14:00:00Z"),
      "America/Sao_Paulo"
    );
    expect(out).toBe(
      "Data/hora atual do dono: 2026-06-26T11:00:00-03:00 (America/Sao_Paulo)"
    );
  });

  it("renders UTC as +00:00", () => {
    // BR-47 step 3 — UTC handled via the `GMT`/`UTC` short-offset
    // normalisation. The wall-clock equals the input instant.
    const out = renderDatetimeBlockB(new Date("2026-01-15T08:30:00Z"), "UTC");
    expect(out).toBe(
      "Data/hora atual do dono: 2026-01-15T08:30:00+00:00 (UTC)"
    );
  });

  it("renders a DST-bearing zone correctly (Europe/Lisbon summer time)", () => {
    // 2026-07-15 12:00:00Z falls within WEST (UTC+1) in Lisbon — DST is on.
    // Local wall-clock: 13:00:00; offset +01:00.
    const out = renderDatetimeBlockB(
      new Date("2026-07-15T12:00:00Z"),
      "Europe/Lisbon"
    );
    expect(out).toBe(
      "Data/hora atual do dono: 2026-07-15T13:00:00+01:00 (Europe/Lisbon)"
    );
  });

  it("renders a fractional-hour offset zone (Asia/Kolkata, UTC+5:30)", () => {
    // India: fixed offset of +05:30. Tests the `mm` non-zero branch of the
    // short-offset normaliser.
    const out = renderDatetimeBlockB(
      new Date("2026-03-10T06:00:00Z"),
      "Asia/Kolkata"
    );
    expect(out).toBe(
      "Data/hora atual do dono: 2026-03-10T11:30:00+05:30 (Asia/Kolkata)"
    );
  });

  it("uses the literal prefix 'Data/hora atual do dono: ' (pt-BR)", () => {
    // BR-47 step 2 explicitly fixes the prefix string — any drift breaks
    // model recognition. Asserted as a stable contract.
    const out = renderDatetimeBlockB(new Date(0), "UTC");
    expect(out.startsWith("Data/hora atual do dono: ")).toBe(true);
  });

  it("throws RangeError for an unknown IANA zone (defensive — boot catches this)", () => {
    // `loadEnv` validates `OWNER_TZ` at boot, so production traffic never
    // hits this branch. The defensive throw still belongs in the contract:
    // any caller that misuses the renderer surfaces the failure clearly.
    expect(() =>
      renderDatetimeBlockB(new Date("2026-06-26T14:00:00Z"), "Invalid/Zone")
    ).toThrowError(RangeError);
  });

  it("formatIsoWithOffset returns just the ISO portion (no prefix)", () => {
    // Helper introspection — useful as a regression on the date-formatting
    // path independent of the wrapping prefix.
    const iso = formatIsoWithOffset(
      new Date("2026-06-26T14:00:00Z"),
      "America/Sao_Paulo"
    );
    expect(iso).toBe("2026-06-26T11:00:00-03:00");
  });
});
