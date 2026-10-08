import { act } from "react";
import { ACCEPTED_WIRE } from "../../api/__tests__/edit-support";
import {
  answers,
  jsonResponse,
  stubFetch,
  type RecordedRequest,
} from "../../api/__tests__/support";
import type { AttributeKey } from "../../types";
import { openReviewIn } from "./entity-form-review-support";
import { typeReason } from "./entity-form-reason-support";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
} from "./entity-form-support";
import { typeInto } from "./entity-form-value-type-support";

export const TITLE_KEYS: readonly AttributeKey[] = [catalogKey("title")];
export const TYPED_REASON = "  Corrigido após a auditoria  ";
export const TRIMMED_REASON = "Corrigido após a auditoria";

const EDIT_PATH = "/api/v1/nodes/n-1/edit";
const CONFIRM = '[data-testid="entity-review-confirm"]';

export interface ReviewedEdit {
  readonly container: HTMLElement;
  readonly requests: RecordedRequest[];
}

export async function reviewedEditOfTitle(): Promise<ReviewedEdit> {
  const requests = stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
  const container = await renderForm(
    nodeHolding([heldAttribute("title", "Alpha")]),
    TITLE_KEYS,
  );
  await typeInto(container, "title", "Alpha", "Beta");
  await openReviewIn(container);
  await typeReason(container, TYPED_REASON);
  return { container, requests };
}

export async function pressSalvar(container: HTMLElement): Promise<void> {
  const button = container.querySelector<HTMLButtonElement>(CONFIRM);
  if (button === null) throw new Error("Salvar is not offered");
  await act(async () => {
    button.click();
  });
}

export async function pressSalvarIfOffered(
  container: HTMLElement,
): Promise<void> {
  const button = container.querySelector<HTMLButtonElement>(CONFIRM);
  if (button === null) return;
  await act(async () => {
    button.click();
  });
}

export function editRequestsOf(
  requests: readonly RecordedRequest[],
): RecordedRequest[] {
  return requests.filter(
    ({ method, url }) => method === "POST" && url.pathname === EDIT_PATH,
  );
}
