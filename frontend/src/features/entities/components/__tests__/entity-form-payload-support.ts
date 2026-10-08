import { vi } from "vitest";
import { ACCEPTED_WIRE, sentBody } from "../../api/__tests__/edit-support";
import {
  advance,
  answers,
  jsonResponse,
  stubFetch,
} from "../../api/__tests__/support";
import type { AttributeChangeWire } from "../../types";
import { PAYLOAD_KEYS, PAYLOAD_NODE } from "./entity-edit-payload-support";
import { removeValue } from "./entity-form-multi-support";
import { typeReason } from "./entity-form-reason-support";
import { openReviewIn, reviewedFieldsIn } from "./entity-form-review-support";
import { renderForm } from "./entity-form-support";
import { TYPED_REASON, pressSalvar } from "./entity-form-undo-support";
import { typeInto } from "./entity-form-value-type-support";
import {
  endInputOf,
  fixClockAt,
  releaseClock,
  setDate,
  startInputOf,
} from "./entity-form-validity-support";

export const TODAY = new Date(2026, 5, 15, 12, 0);
export const TODAY_TEXT = "2026-06-15";

const UNDO_WINDOW_MS = 5000;

export interface UnstatedStartOutcome {
  readonly shownStart: string;
  readonly change: AttributeChangeWire;
  readonly bodyText: string;
}

function stubAcceptedEdit(): void {
  stubFetch(answers(() => jsonResponse(ACCEPTED_WIRE)));
}

export function changesIn(
  body: Record<string, unknown>,
): AttributeChangeWire[] {
  const changes = body["changes"];
  if (!Array.isArray(changes)) throw new Error("the body carries no changes");
  return changes as AttributeChangeWire[];
}

export async function reviewedFormWithSeveralChanges(): Promise<HTMLElement> {
  stubAcceptedEdit();
  const container = await renderForm(PAYLOAD_NODE, PAYLOAD_KEYS);
  await typeInto(container, "title", "Alpha", "Beta");
  await typeInto(container, "role", "Open", "Closed");
  await setDate(startInputOf(container, "role"), "2026-06-14");
  await setDate(endInputOf(container, "role"), "2026-12-31");
  await removeValue(container, "tag", "Blue");
  await openReviewIn(container);
  await typeReason(container, TYPED_REASON);
  return container;
}

export async function bodySentOnceTheWindowPasses(
  container: HTMLElement,
): Promise<Record<string, unknown>> {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  await pressSalvar(container);
  await advance(UNDO_WINDOW_MS);
  return sentBody(0);
}

export async function deadlineChangedWithoutAStart(
  end: string,
): Promise<UnstatedStartOutcome> {
  stubAcceptedEdit();
  fixClockAt(TODAY);
  const container = await renderForm(PAYLOAD_NODE, PAYLOAD_KEYS);
  await typeInto(container, "deadline", "Q1", "Q2");
  if (end !== "") await setDate(endInputOf(container, "deadline"), end);
  const listed = await reviewedFieldsIn(container);
  const shownStart = listed.find(({ key }) => key === "deadline")?.start ?? "";
  await typeReason(container, TYPED_REASON);
  releaseClock();
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(TODAY);
  await pressSalvar(container);
  await advance(UNDO_WINDOW_MS);
  const body = sentBody(0);
  const change = changesIn(body).find(
    ({ attribute_key }) => attribute_key === "deadline",
  );
  if (change === undefined) throw new Error("the body carries no deadline change");
  return { shownStart, change, bodyText: JSON.stringify(body) };
}
