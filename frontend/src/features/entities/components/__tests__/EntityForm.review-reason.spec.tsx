import { afterEach, describe, expect, it } from "vitest";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  unmountForms,
} from "./entity-form-support";
import { typeInto } from "./entity-form-value-type-support";
import {
  openReviewIn,
  reviewOfferedIn,
} from "./entity-form-review-support";
import {
  reasonControlIn,
  saveOfferedIn,
  typeReason,
} from "./entity-form-reason-support";

afterEach(() => {
  unmountForms();
});

interface ReasonCase {
  readonly label: string;
  readonly reason: string;
}

const ASTRAL = "\u{1F600}";

async function reviewOfAChangedField(): Promise<HTMLElement> {
  const container = await renderForm(
    nodeHolding([heldAttribute("title", "Alpha")]),
    [catalogKey("title")],
  );
  await typeInto(container, "title", "Alpha", "Beta");
  await openReviewIn(container);
  return container;
}

describe("entity form review holding a reason", () => {
  it("holds a labelled text control for the reason in the open review", async () => {
    const container = await reviewOfAChangedField();
    expect(reasonControlIn(container)).not.toBeNull();
  });

  it("does not offer the save while no reason has been typed", async () => {
    const container = await reviewOfAChangedField();
    expect(saveOfferedIn(container)).toBe(false);
  });

  it.each<ReasonCase>([
    { label: "only spaces", reason: "     " },
    { label: "only tabs", reason: "\t\t\t" },
    { label: "only newlines", reason: "\n\n\n" },
    { label: "1001 characters outside the supplementary planes", reason: "a".repeat(1001) },
    { label: "1000 characters outside the Basic Multilingual Plane, which are 2000 UTF-16 code units", reason: ASTRAL.repeat(1000) },
    { label: "1001 characters once the padding around them is trimmed", reason: ` \t${"a".repeat(1001)}\n ` },
  ])("does not offer the save for a reason of $label", async ({ reason }) => {
    const container = await reviewOfAChangedField();
    await typeReason(container, reason);
    expect(saveOfferedIn(container)).toBe(false);
  });

  it.each<ReasonCase>([
    { label: "exactly 1 character", reason: "a" },
    { label: "exactly 1000 characters", reason: "a".repeat(1000) },
    { label: "500 characters outside the Basic Multilingual Plane, which are 1000 UTF-16 code units", reason: ASTRAL.repeat(500) },
    { label: "1000 characters padded so that the untrimmed text is longer than 1000", reason: `  \n${"a".repeat(1000)}\t  ` },
  ])("offers the save for a reason of $label", async ({ reason }) => {
    const container = await reviewOfAChangedField();
    await typeReason(container, reason);
    expect(saveOfferedIn(container)).toBe(true);
  });

  it("offers the save only while the reason stands within the limits, withdrawing and offering it again as the reason changes", async () => {
    const container = await reviewOfAChangedField();
    await typeReason(container, "Corrected after the audit");
    const withReason = saveOfferedIn(container);
    await typeReason(container, "a".repeat(1001));
    const overTheLimit = saveOfferedIn(container);
    await typeReason(container, "a".repeat(1000));
    const backWithinTheLimit = saveOfferedIn(container);
    await typeReason(container, "  \t ");
    const emptied = saveOfferedIn(container);
    expect({ withReason, overTheLimit, backWithinTheLimit, emptied }).toEqual({
      withReason: true,
      overTheLimit: false,
      backWithinTheLimit: true,
      emptied: false,
    });
  });

  it("offers no save and no reason field once the changed field returns to its starting value, whatever reason was typed", async () => {
    const container = await reviewOfAChangedField();
    await typeReason(container, "Corrected after the audit");
    await typeInto(container, "title", "Beta", "Alpha");
    expect({
      reviewOffered: reviewOfferedIn(container),
      saveOffered: saveOfferedIn(container),
      reasonField: reasonControlIn(container) !== null,
    }).toEqual({
      reviewOffered: false,
      saveOffered: false,
      reasonField: false,
    });
  });
});
