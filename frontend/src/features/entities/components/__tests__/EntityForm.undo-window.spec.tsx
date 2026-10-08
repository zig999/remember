import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

interface NoticeAction {
  readonly label: string;
  readonly onClick: () => void;
}

interface NoticeOptions {
  readonly id?: string;
  readonly duration?: number;
  readonly action?: NoticeAction;
}

const mocks = vi.hoisted(() => ({
  toast: Object.assign(
    vi.fn<(message: string, options?: NoticeOptions) => string>(),
    { dismiss: vi.fn() },
  ),
}));

vi.mock("sonner", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toast: mocks.toast,
}));

import { act } from "react";
import { useAuthStore } from "../../../../state/auth";
import { sentBody } from "../../api/__tests__/edit-support";
import { advance } from "../../api/__tests__/support";
import { reasonControlIn } from "./entity-form-reason-support";
import { reviewPanelOf } from "./entity-form-review-support";
import { unmountForms, valuesByKey } from "./entity-form-support";
import {
  TITLE_KEYS,
  TRIMMED_REASON,
  TYPED_REASON,
  editRequestsOf,
  pressSalvar,
  pressSalvarIfOffered,
  reviewedEditOfTitle,
  type ReviewedEdit,
} from "./entity-form-undo-support";

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.toast.dismiss.mockClear();
  useAuthStore.getState().clear();
});

afterEach(() => {
  unmountForms();
  vi.useRealTimers();
  vi.restoreAllMocks();
  useAuthStore.getState().clear();
});

async function reviewedEdit(): Promise<ReviewedEdit> {
  const reviewed = await reviewedEditOfTitle();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  return reviewed;
}

function shownNotice(): NoticeOptions {
  const call = mocks.toast.mock.calls.at(-1);
  if (call === undefined) throw new Error("no notice was shown");
  return call[1] ?? {};
}

async function undoTheEdit(): Promise<void> {
  const onClick = shownNotice().action?.onClick;
  if (onClick === undefined) throw new Error("the notice offers no undo");
  await act(async () => {
    onClick();
  });
}

function formOf(container: HTMLElement): {
  readonly values: Record<string, string | undefined>;
  readonly reason: string | undefined;
  readonly reviewOpen: boolean;
} {
  return {
    values: valuesByKey(container, TITLE_KEYS),
    reason: reasonControlIn(container)?.value,
    reviewOpen: reviewPanelOf(container) !== null,
  };
}

describe("entity form saving with an undo window", () => {
  it("shows the notice 'Edição registrada.' once Salvar confirms the review", async () => {
    const { container } = await reviewedEdit();
    await pressSalvar(container);
    expect(mocks.toast.mock.calls.map(([message]) => message)).toEqual([
      "Edição registrada.",
    ]);
  });

  it("offers the undo action labelled 'Desfazer' with the notice", async () => {
    const { container } = await reviewedEdit();
    await pressSalvar(container);
    expect(shownNotice().action?.label).toBe("Desfazer");
  });

  it("offers the undo for five seconds", async () => {
    const { container } = await reviewedEdit();
    await pressSalvar(container);
    expect(shownNotice().duration).toBe(5000);
  });

  it("sends no edit before five seconds have passed", async () => {
    const { container, requests } = await reviewedEdit();
    await pressSalvar(container);
    await advance(4999);
    expect(editRequestsOf(requests)).toHaveLength(0);
  });

  it("sends the edit once, as a POST to the node's edit address, when five seconds pass without an undo", async () => {
    const { container, requests } = await reviewedEdit();
    await pressSalvar(container);
    await advance(5000);
    expect(
      editRequestsOf(requests).map(({ method, url }) => [method, url.pathname]),
    ).toEqual([["POST", "/api/v1/nodes/n-1/edit"]]);
  });

  it("sends the confirmed edit: the trimmed reason and one change for the changed field", async () => {
    const { container } = await reviewedEdit();
    await pressSalvar(container);
    await advance(5000);
    expect(sentBody(0)).toMatchObject({
      reason: TRIMMED_REASON,
      changes: [expect.objectContaining({ attribute_key: "title" })],
    });
  });

  it("schedules no second send when Salvar is pressed again during the window", async () => {
    const { container, requests } = await reviewedEdit();
    await pressSalvar(container);
    await advance(2000);
    await pressSalvarIfOffered(container);
    await advance(10_000);
    expect(editRequestsOf(requests)).toHaveLength(1);
  });

  it("sends nothing and leaves the typed values when the owner undoes three seconds after confirming", async () => {
    const { container, requests } = await reviewedEdit();
    await pressSalvar(container);
    await advance(3000);
    await undoTheEdit();
    await advance(10_000);
    expect({
      editsSent: editRequestsOf(requests).length,
      values: valuesByKey(container, TITLE_KEYS),
    }).toEqual({ editsSent: 0, values: { title: "Beta" } });
  });

  it("leaves the reason as typed and the review open after an undo", async () => {
    const { container } = await reviewedEdit();
    await pressSalvar(container);
    await advance(3000);
    await undoTheEdit();
    expect({
      reason: reasonControlIn(container)?.value,
      reviewOpen: reviewPanelOf(container) !== null,
    }).toEqual({ reason: TYPED_REASON, reviewOpen: true });
  });

  it("lets the owner press Salvar again after an undo, and sends that edit once its own five seconds pass", async () => {
    const { container, requests } = await reviewedEdit();
    await pressSalvar(container);
    await advance(3000);
    await undoTheEdit();
    await pressSalvar(container);
    await advance(5000);
    expect(editRequestsOf(requests)).toHaveLength(1);
  });

  it("sends the edit only after five seconds without an undo, and an undo sends nothing and leaves the form as it was", async () => {
    const { container, requests } = await reviewedEdit();
    const before = formOf(container);
    await pressSalvar(container);
    await advance(4999);
    const sentWithinTheFirstWindow = editRequestsOf(requests).length;
    await undoTheEdit();
    await advance(10_000);
    const sentAfterTheUndo = editRequestsOf(requests).length;
    const afterTheUndo = formOf(container);
    await pressSalvar(container);
    await advance(4999);
    const sentWithinTheSecondWindow = editRequestsOf(requests).length;
    await advance(1);
    const sentOnceTheSecondWindowPassed = editRequestsOf(requests).length;
    expect({
      sentWithinTheFirstWindow,
      sentAfterTheUndo,
      formAfterTheUndo: afterTheUndo,
      sentWithinTheSecondWindow,
      sentOnceTheSecondWindowPassed,
    }).toEqual({
      sentWithinTheFirstWindow: 0,
      sentAfterTheUndo: 0,
      formAfterTheUndo: before,
      sentWithinTheSecondWindow: 0,
      sentOnceTheSecondWindowPassed: 1,
    });
  });
});
