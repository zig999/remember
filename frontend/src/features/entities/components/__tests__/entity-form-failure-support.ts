import { vi } from "vitest";
import { refusalBody } from "../../api/__tests__/edit-support";
import {
  advance,
  jsonResponse,
  stubFetch,
  type Responder,
} from "../../api/__tests__/support";
import {
  STATUS_KEYS,
  TYPED_STATUS,
  acceptedAnswer,
  letTheAnswerArrive,
  reviewedEditOfStatus,
  type StatusEdit,
} from "./entity-form-conflict-support";
import { reasonControlIn } from "./entity-form-reason-support";
import { reviewPanelOf } from "./entity-form-review-support";
import { valuesByKey } from "./entity-form-support";
import { TYPED_REASON, editRequestsOf, pressSalvar } from "./entity-form-undo-support";

export const REFUSAL_MESSAGE = "Valor inválido ZX-77 relatado pelo servidor.";

const UNDO_WINDOW_MS = 5000;
const CUTOFF_MS = 30_000;

export const TYPED_FORM = {
  values: { status_text: TYPED_STATUS },
  reason: TYPED_REASON,
  reviewOpen: true,
} as const;

export function refusalAnswer(): Response {
  return jsonResponse(
    refusalBody("VALIDATION_INVALID_FORMAT", REFUSAL_MESSAGE, {
      field: "reason",
    }),
    422,
  );
}

export async function reviewedEditWith(
  responder: Responder,
): Promise<StatusEdit> {
  const edit = await reviewedEditOfStatus(acceptedAnswer);
  vi.restoreAllMocks();
  return { container: edit.container, requests: stubFetch(responder) };
}

export async function confirmAndAwaitCutoff(edit: StatusEdit): Promise<void> {
  await pressSalvar(edit.container);
  await advance(UNDO_WINDOW_MS);
  await letTheAnswerArrive();
  await advance(CUTOFF_MS);
  await letTheAnswerArrive();
  if (editRequestsOf(edit.requests).length !== 1) {
    throw new Error("the edit was not sent exactly once");
  }
}

export function heldFormOf(container: HTMLElement): {
  readonly values: Record<string, string | undefined>;
  readonly reason: string | undefined;
  readonly reviewOpen: boolean;
} {
  return {
    values: valuesByKey(container, STATUS_KEYS),
    reason: reasonControlIn(container)?.value,
    reviewOpen: reviewPanelOf(container) !== null,
  };
}
