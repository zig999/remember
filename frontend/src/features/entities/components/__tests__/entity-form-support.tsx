import { act } from "react";
import type { Root } from "react-dom/client";
import type { AttributeKey, NodeAttribute, NodeRead } from "../../types";
import { mountFormInRouter, type FormRouter } from "./entity-form-router-support";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

export interface HeldOptions {
  readonly id?: string;
  readonly status?: string;
  readonly isCurrent?: boolean;
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
}

const placements: Placement[] = [];

export function catalogKey(
  key: string,
  description: string | null = null,
): AttributeKey {
  return {
    key,
    valueType: "text",
    isTemporal: false,
    allowsMultiple: false,
    description,
    allowedValues: null,
  };
}

export function heldAttribute(
  key: string,
  value: string,
  options: HeldOptions = {},
): NodeAttribute {
  return {
    id: options.id ?? `at-${key}-${value}`,
    attributeKey: key,
    value,
    validFrom: null,
    validTo: null,
    status: options.status ?? "active",
    isCurrent: options.isCurrent ?? true,
  };
}

export function staleAttribute(key: string, value: string): NodeAttribute {
  return heldAttribute(key, value, { status: "superseded", isCurrent: false });
}

export function nodeHolding(attributes: readonly NodeAttribute[]): NodeRead {
  return {
    node: {
      id: "n-1",
      nodeType: "Project",
      canonicalName: "Apollo Mission",
      status: "active",
      mergedInto: null,
    },
    aliases: [],
    attributes,
  };
}

export interface RoutedForm {
  readonly container: HTMLElement;
  readonly router: FormRouter;
}

export async function renderRoutedForm(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
): Promise<RoutedForm> {
  const { root, container, router } = await mountFormInRouter(
    node,
    attributeKeys,
  );
  placements.push({ root, container });
  return { container, router };
}

export async function renderForm(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
): Promise<HTMLElement> {
  const { container } = await renderRoutedForm(node, attributeKeys);
  return container;
}

export function unmountForms(): void {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
  }
}

export function fieldsOf(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll("input"));
}

export function valuesOf(container: HTMLElement): string[] {
  return fieldsOf(container).map((field) => field.value);
}

export function valuesByKey(
  container: HTMLElement,
  attributeKeys: readonly AttributeKey[],
): Record<string, string | undefined> {
  const values = valuesOf(container);
  return Object.fromEntries(
    attributeKeys.map(({ key }, index) => [key, values[index]]),
  );
}

export function helpTextsOf(field: HTMLElement): string[] {
  const ids = (field.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter((id) => id.length > 0);
  return ids.map(
    (id) => field.ownerDocument.getElementById(id)?.textContent ?? "",
  );
}

export function helpTextsByKey(
  container: HTMLElement,
  attributeKeys: readonly AttributeKey[],
): Record<string, string[] | undefined> {
  const fields = fieldsOf(container);
  return Object.fromEntries(
    attributeKeys.map(({ key }, index) => {
      const field = fields[index];
      return [key, field === undefined ? undefined : helpTextsOf(field)];
    }),
  );
}
