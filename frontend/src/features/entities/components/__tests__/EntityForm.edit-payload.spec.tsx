import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

const mocks = vi.hoisted(() => ({
  toast: Object.assign(vi.fn<(message: string) => string>(), {
    dismiss: vi.fn(),
  }),
}));

vi.mock("sonner", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toast: mocks.toast,
}));

import { useAuthStore } from "../../../../state/auth";
import {
  inAnyOrder,
  removeOf,
  setOf,
} from "./entity-edit-payload-support";
import {
  TODAY_TEXT,
  bodySentOnceTheWindowPasses,
  changesIn,
  deadlineChangedWithoutAStart,
  reviewedFormWithSeveralChanges,
} from "./entity-form-payload-support";
import { unmountForms } from "./entity-form-support";
import { TRIMMED_REASON } from "./entity-form-undo-support";
import { releaseClock } from "./entity-form-validity-support";

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.toast.dismiss.mockClear();
  useAuthStore.getState().clear();
});

afterEach(() => {
  unmountForms();
  releaseClock();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("entity form saving the reviewed edit", () => {
  it("sends the body { reason, changes } with the trimmed reason and one change for each changed field of the reviewed form", async () => {
    const container = await reviewedFormWithSeveralChanges();
    const body = await bodySentOnceTheWindowPasses(container);
    expect({ ...body, changes: inAnyOrder(changesIn(body)) }).toEqual({
      reason: TRIMMED_REASON,
      changes: inAnyOrder([
        setOf("title", "Beta", "at-title"),
        setOf("role", "Closed", "at-role", "2026-06-14", "2026-12-31"),
        removeOf("tag", "at-tag-blue"),
      ]),
    });
  });

  it("shows an unstated validity start as today in the review and sends the change with no validity start", async () => {
    const sent = await deadlineChangedWithoutAStart("");
    expect({
      reviewShowsToday: sent.shownStart.includes(TODAY_TEXT),
      validFrom: sent.change.valid_from,
      validTo: sent.change.valid_to,
      todayInBody: sent.bodyText.includes(TODAY_TEXT),
    }).toEqual({
      reviewShowsToday: true,
      validFrom: null,
      validTo: null,
      todayInBody: false,
    });
  });

  it("shows an unstated validity start as today in the review and sends it empty while the owner states a validity end", async () => {
    const sent = await deadlineChangedWithoutAStart("2026-12-31");
    expect({
      reviewShowsToday: sent.shownStart.includes(TODAY_TEXT),
      validFrom: sent.change.valid_from,
      validTo: sent.change.valid_to,
      todayInBody: sent.bodyText.includes(TODAY_TEXT),
    }).toEqual({
      reviewShowsToday: true,
      validFrom: null,
      validTo: "2026-12-31",
      todayInBody: false,
    });
  });
});
