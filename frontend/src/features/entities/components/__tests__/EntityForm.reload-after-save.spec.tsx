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
  CURRENT_STATUS_ID,
  HELD_STATUS,
  HELD_TITLE,
  NEXT_STATUS,
  RELOADED_STATUS,
  RELOADED_TITLE,
  RELOAD_KEYS,
  callsOf,
  confirmAndAwaitReload,
  reviewedEditAnswering,
  sentEditBodies,
  unmountReloadedForms,
} from "./entity-form-reload-support";
import {
  reasonControlIn,
  saveOfferedIn,
  typeReason,
} from "./entity-form-reason-support";
import {
  openReviewIn,
  reviewButtonOf,
  reviewPanelOf,
  reviewedFieldsIn,
} from "./entity-form-review-support";
import { valuesByKey } from "./entity-form-support";
import { TYPED_REASON } from "./entity-form-undo-support";
import { typeInto } from "./entity-form-value-type-support";

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.toast.dismiss.mockClear();
  useAuthStore.getState().clear();
});

afterEach(() => {
  unmountReloadedForms();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

describe("entity form after the knowledge base accepts the edit", () => {
  it("reads the node again after the edit and shows every field with the value now current", async () => {
    const form = await reviewedEditAnswering("values-now-current");
    await confirmAndAwaitReload(form, 1);
    expect({
      calls: callsOf(form.requests),
      fields: valuesByKey(form.container, RELOAD_KEYS),
    }).toEqual({
      calls: [
        "GET /api/v1/nodes/n-1",
        "POST /api/v1/nodes/n-1/edit",
        "GET /api/v1/nodes/n-1",
      ],
      fields: { status_text: RELOADED_STATUS, title: RELOADED_TITLE },
    });
  });

  it("names the attribute now current, not the superseded one, in the next edit it sends", async () => {
    const form = await reviewedEditAnswering("values-now-current");
    await confirmAndAwaitReload(form, 1);
    await typeInto(form.container, "status_text", RELOADED_STATUS, NEXT_STATUS);
    await openReviewIn(form.container);
    await typeReason(form.container, TYPED_REASON);
    await confirmAndAwaitReload(form, 2);
    expect(sentEditBodies()[1]).toMatchObject({
      changes: [{ attribute_key: "status_text", item_id: CURRENT_STATUS_ID }],
    });
  });

  it("lists the value now current as the previous value when the next edit is reviewed", async () => {
    const form = await reviewedEditAnswering("values-now-current");
    await confirmAndAwaitReload(form, 1);
    await typeInto(form.container, "status_text", RELOADED_STATUS, NEXT_STATUS);
    const listed = await reviewedFieldsIn(form.container);
    expect(
      listed.map(({ key, previous, next }) => ({ key, previous, next })),
    ).toEqual([
      { key: "status_text", previous: RELOADED_STATUS, next: NEXT_STATUS },
    ]);
  });

  it("closes the review, offering neither the open review nor the control to open it", async () => {
    const form = await reviewedEditAnswering("values-now-current");
    await confirmAndAwaitReload(form, 1);
    expect({
      reviewOpen: reviewPanelOf(form.container) !== null,
      reviewControlOffered: reviewButtonOf(form.container) !== null,
    }).toEqual({ reviewOpen: false, reviewControlOffered: false });
  });

  it("clears the reason, so the next review has an empty reason field and no Salvar", async () => {
    const form = await reviewedEditAnswering("values-now-current");
    await confirmAndAwaitReload(form, 1);
    await typeInto(form.container, "status_text", RELOADED_STATUS, NEXT_STATUS);
    await openReviewIn(form.container);
    expect({
      reason: reasonControlIn(form.container)?.value,
      saveOffered: saveOfferedIn(form.container),
    }).toEqual({ reason: "", saveOffered: false });
  });

  it("starts over from the held values, with the reason cleared and the review closed, when the node read again is the same node", async () => {
    const form = await reviewedEditAnswering("same-node");
    await confirmAndAwaitReload(form, 1);
    const afterTheSave = {
      fields: valuesByKey(form.container, RELOAD_KEYS),
      reviewOffered:
        reviewButtonOf(form.container) !== null ||
        reviewPanelOf(form.container) !== null,
    };
    await typeInto(form.container, "status_text", HELD_STATUS, NEXT_STATUS);
    await openReviewIn(form.container);
    expect({
      ...afterTheSave,
      reasonOfTheNextReview: reasonControlIn(form.container)?.value,
    }).toEqual({
      fields: { status_text: HELD_STATUS, title: HELD_TITLE },
      reviewOffered: false,
      reasonOfTheNextReview: "",
    });
  });
});
