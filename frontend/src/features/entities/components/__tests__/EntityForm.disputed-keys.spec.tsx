import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttributeKey, NodeAttribute } from "../../types";
import { allowed, closedKey } from "./entity-form-closed-support";
import { groupOf, multiKey } from "./entity-form-multi-support";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
  renderForm,
  renderRoutedForm,
  staleAttribute,
  unmountForms,
} from "./entity-form-support";

const KEY = "alpha";
const DISPUTED_VALUE = "Disputed-value";
const OTHER_VALUE = "Other-value";
const POINTER_TEXT = "Abrir na fila de curadoria";
const FIELDS = 'input, select, textarea, [role="combobox"]';
const CONTROLS = `${FIELDS}, button`;

interface StatusRow {
  readonly label: string;
  readonly attributes: readonly NodeAttribute[];
  readonly disputed: boolean;
}

interface KindRow {
  readonly label: string;
  readonly catalog: AttributeKey;
}

const DISPUTED = { status: "disputed" };
const DISPUTED_STALE = { status: "disputed", isCurrent: false };

const STATUS_ROWS: readonly StatusRow[] = [
  {
    label: "a disputed attribute that is current",
    attributes: [heldAttribute(KEY, DISPUTED_VALUE, DISPUTED)],
    disputed: true,
  },
  {
    label: "a disputed attribute that is not current",
    attributes: [heldAttribute(KEY, DISPUTED_VALUE, DISPUTED_STALE)],
    disputed: true,
  },
  {
    label: "a current disputed attribute whose validity has ended",
    attributes: [
      {
        ...heldAttribute(KEY, DISPUTED_VALUE, DISPUTED),
        validTo: "2000-01-01",
      },
    ],
    disputed: true,
  },
  {
    label: "a disputed attribute beside a current active one",
    attributes: [
      heldAttribute(KEY, OTHER_VALUE),
      heldAttribute(KEY, DISPUTED_VALUE, DISPUTED_STALE),
    ],
    disputed: true,
  },
  {
    label: "a current disputed attribute beside a superseded one",
    attributes: [
      staleAttribute(KEY, OTHER_VALUE),
      heldAttribute(KEY, DISPUTED_VALUE, DISPUTED),
    ],
    disputed: true,
  },
  {
    label: "an active current attribute",
    attributes: [heldAttribute(KEY, OTHER_VALUE)],
    disputed: false,
  },
  {
    label: "an uncertain current attribute",
    attributes: [heldAttribute(KEY, OTHER_VALUE, { status: "uncertain" })],
    disputed: false,
  },
  {
    label: "a superseded attribute",
    attributes: [staleAttribute(KEY, OTHER_VALUE)],
    disputed: false,
  },
  {
    label: "a deleted attribute",
    attributes: [
      heldAttribute(KEY, OTHER_VALUE, { status: "deleted", isCurrent: false }),
    ],
    disputed: false,
  },
];

const KIND_ROWS: readonly KindRow[] = [
  { label: "a text key", catalog: catalogKey(KEY) },
  {
    label: "a closed-choice key",
    catalog: closedKey(KEY, [allowed(DISPUTED_VALUE), allowed(OTHER_VALUE)]),
  },
  { label: "a multi-valued key", catalog: multiKey(KEY) },
];

function stateOf(group: HTMLElement) {
  return {
    fields: group.querySelectorAll(FIELDS).length,
    pointers: group.querySelectorAll("a[href]").length,
    valueShown: (group.textContent ?? "").includes(DISPUTED_VALUE),
  };
}

function pointerIn(group: HTMLElement): HTMLAnchorElement {
  const pointer = group.querySelector<HTMLAnchorElement>("a[href]");
  if (pointer === null) throw new Error("the group renders no link");
  return pointer;
}

const disputedNode = () =>
  nodeHolding([heldAttribute(KEY, DISPUTED_VALUE, DISPUTED)]);

afterEach(() => {
  unmountForms();
});

describe("entity form disputed keys", () => {
  it.each(STATUS_ROWS)(
    "decides a key's disputed state from the status of its attributes alone: $label",
    async ({ attributes, disputed }) => {
      const container = await renderForm(nodeHolding(attributes), [
        catalogKey(KEY),
      ]);
      const expected = disputed
        ? { fields: 0, pointers: 1, valueShown: true }
        : { fields: 1, pointers: 0 };
      expect(stateOf(groupOf(container, KEY))).toMatchObject(expected);
    },
  );

  it("shows every value a disputed key holds", async () => {
    const node = nodeHolding([
      heldAttribute("tag", "Value-One", DISPUTED),
      heldAttribute("tag", "Value-Two", DISPUTED),
    ]);
    const container = await renderForm(node, [multiKey("tag")]);
    const text = groupOf(container, "tag").textContent ?? "";
    const missing = ["Value-One", "Value-Two"].filter(
      (value) => !text.includes(value),
    );
    expect(missing).toEqual([]);
  });

  it.each(KIND_ROWS)(
    "shows no field and no add or remove control for a disputed key that is $label",
    async ({ catalog }) => {
      const container = await renderForm(disputedNode(), [catalog]);
      const controls = Array.from(
        groupOf(container, KEY).querySelectorAll(CONTROLS),
      ).map((control) => control.tagName.toLowerCase());
      expect(controls).toEqual([]);
    },
  );

  it("shows the pointer in the disputed key's group alone and keeps the field of a key beside it", async () => {
    const node = nodeHolding([
      heldAttribute("alpha", DISPUTED_VALUE, DISPUTED),
      heldAttribute("beta", "B-value"),
    ]);
    const container = await renderForm(node, [
      catalogKey("alpha"),
      catalogKey("beta"),
    ]);
    expect({
      alpha: stateOf(groupOf(container, "alpha")),
      beta: stateOf(groupOf(container, "beta")),
    }).toMatchObject({
      alpha: { fields: 0, pointers: 1 },
      beta: { fields: 1, pointers: 0 },
    });
  });

  it("leads to the curation address when the pointer is followed", async () => {
    const { container, router } = await renderRoutedForm(disputedNode(), [
      catalogKey(KEY),
    ]);
    const pointer = pointerIn(groupOf(container, KEY));
    await act(async () => {
      pointer.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
    });
    await act(async () => {
      await vi.waitFor(
        () => {
          if (router.state.location.pathname === "/") {
            throw new Error("the form is still the open address");
          }
        },
        { timeout: 5000 },
      );
    });
    expect(router.state.location.pathname).toBe("/curation");
  });

  it("makes the pointer a link to exactly /curation, with no search, reading exactly 'Abrir na fila de curadoria'", async () => {
    const container = await renderForm(disputedNode(), [catalogKey(KEY)]);
    const pointer = pointerIn(groupOf(container, KEY));
    expect({
      name: pointer.textContent,
      href: pointer.getAttribute("href"),
    }).toEqual({ name: POINTER_TEXT, href: "/curation" });
  });
});
