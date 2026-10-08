import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { routeTree } from "../../../../router/routes";
import { useAuthStore } from "../../../../state/auth";
import {
  jsonResponse,
  stubFetch,
  waitUntil,
  type RecordedRequest,
  type Responder,
} from "../../api/__tests__/support";
import { click, neverAnswers } from "./page-support";
import { sessionToken } from "./session-token";

const WORKSPACE = '[data-testid="app-workspace"]';
const NODES_PATH = "/api/v1/nodes";
const TYPES_PATH = "/api/v1/node-types";
const PAGE_WAIT_MS = 10_000;
const SOFT_WAIT_MS = 3_000;

export const FAILURE_CODE = "SYSTEM_CODIGO_PROPRIO_DA_FALHA";
export const FAILURE_MESSAGE = "mensagem-propria-da-falha-do-servidor";

export const TYPE_NAMES: readonly string[] = ["Artefato", "Equipe", "Marco"];

export interface ListedFixture {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly status: string;
}

export const APOLLO: ListedFixture = {
  id: "n-11",
  type: "Artefato",
  name: "Apollo Mission",
  status: "active",
};
export const MARIA: ListedFixture = {
  id: "n-12",
  type: "Equipe",
  name: "Maria Oliveira",
  status: "needs_review",
};
export const KICKOFF: ListedFixture = {
  id: "n-13",
  type: "Marco",
  name: "Kickoff Meeting",
  status: "merged",
};
export const APOSENTADORIA: ListedFixture = {
  id: "n-14",
  type: "Marco",
  name: "Aposentadoria Plan",
  status: "active",
};
export const ZEUS: ListedFixture = {
  id: "n-15",
  type: "Artefato",
  name: "Zeus Gateway",
  status: "active",
};
export const MOON: ListedFixture = {
  id: "n-22",
  type: "Artefato",
  name: "Apollo Moon",
  status: "active",
};

export const UNNARROWED: readonly ListedFixture[] = [APOLLO, MARIA, KICKOFF];

export type NodesAnswer = (url: URL, attempt: number) => Promise<Response>;
export type TypesAnswer = (attempt: number) => Promise<Response>;
export type Params = ReadonlyArray<readonly [string, string]>;

export interface ListAnswers {
  readonly nodes: NodesAnswer;
  readonly types: TypesAnswer;
}

export interface ListPage {
  readonly workspace: HTMLElement;
  readonly requests: RecordedRequest[];
  readonly pathname: () => string;
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly queryClient: QueryClient;
}

const placements: Placement[] = [];

export function namesOf(items: readonly ListedFixture[]): string[] {
  return items.map((item) => item.name);
}

export function nodesListing(
  items: readonly ListedFixture[],
): Promise<Response> {
  return Promise.resolve(
    jsonResponse({
      ok: true,
      result: {
        total: items.length,
        limit: 20,
        offset: 0,
        items: items.map((item) => ({
          id: item.id,
          node_type: item.type,
          canonical_name: item.name,
          status: item.status,
          merged_into_node_id: null,
        })),
      },
    }),
  );
}

export function typesListing(names: readonly string[]): Promise<Response> {
  return Promise.resolve(
    jsonResponse({
      ok: true,
      result: {
        total: names.length,
        items: names.map((name, index) => ({
          id: `type-id-${name}`,
          name,
          description: `descrição de ${name}`,
          version: index + 1,
        })),
      },
    }),
  );
}

export function listingBy(
  narrowed: Readonly<Record<string, readonly ListedFixture[]>>,
): NodesAnswer {
  return (url) => {
    const prefix = url.searchParams.get("name_prefix") ?? "";
    const type = url.searchParams.get("node_type") ?? "";
    return nodesListing(narrowed[`${prefix}|${type}`] ?? UNNARROWED);
  };
}

function listResponder(answers: ListAnswers): Responder {
  const seen = { nodes: 0, types: 0 };
  return (request) => {
    const path = request.url.pathname;
    if (path === NODES_PATH) {
      seen.nodes += 1;
      return answers.nodes(request.url, seen.nodes);
    }
    if (path === TYPES_PATH) {
      seen.types += 1;
      return answers.types(seen.types);
    }
    return neverAnswers();
  };
}

export async function openListPage(answers: ListAnswers): Promise<ListPage> {
  useAuthStore.getState().setToken(sessionToken());
  const requests = stubFetch(listResponder(answers));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/entities"] }),
  });
  const root = createRoot(container);
  placements.push({ root, container, queryClient });
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  });
  await waitUntil(
    () => container.querySelector(WORKSPACE) !== null,
    PAGE_WAIT_MS,
  );
  const workspace = container.querySelector<HTMLElement>(WORKSPACE);
  if (workspace === null) {
    throw new Error("the application shell did not render");
  }
  return {
    workspace,
    requests,
    pathname: () => router.state.location.pathname,
  };
}

export function unmountListPages(): void {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.queryClient.clear();
  }
  useAuthStore.getState().clear();
}

export function listingRequests(page: ListPage): URL[] {
  return page.requests
    .filter(({ url }) => url.pathname === NODES_PATH)
    .map(({ url }) => url);
}

export function typesRequestCount(page: ListPage): number {
  return page.requests.filter(({ url }) => url.pathname === TYPES_PATH).length;
}

export function lastListing(page: ListPage): URL {
  const urls = listingRequests(page);
  const last = urls[urls.length - 1];
  if (last === undefined) throw new Error("no listing request was sent");
  return last;
}

export function paramsOf(url: URL): Params {
  return [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export async function waitForListings(
  page: ListPage,
  count: number,
): Promise<void> {
  await waitUntil(() => listingRequests(page).length >= count, PAGE_WAIT_MS);
}

export function listItems(page: ListPage): HTMLElement[] {
  return [...page.workspace.querySelectorAll<HTMLElement>("li:not([role])")];
}

export function listedNames(page: ListPage): string[] {
  return listItems(page).map((item) =>
    (item.querySelector("a")?.textContent ?? "").trim(),
  );
}

export async function waitForItems(
  page: ListPage,
  count: number,
): Promise<void> {
  await waitUntil(() => listItems(page).length === count, PAGE_WAIT_MS);
}

export async function namesOnceShown(
  page: ListPage,
  expected: readonly string[],
): Promise<string[]> {
  await waitUntil(
    () => listedNames(page).join("|") === expected.join("|"),
    SOFT_WAIT_MS,
  ).catch(() => undefined);
  return listedNames(page);
}

export async function textOnceShown(
  page: ListPage,
  text: string,
): Promise<string> {
  await waitUntil(
    () => (page.workspace.textContent ?? "").includes(text),
    SOFT_WAIT_MS,
  ).catch(() => undefined);
  return page.workspace.textContent ?? "";
}

export function linkNamed(page: ListPage, name: string): HTMLElement {
  const link = [...page.workspace.querySelectorAll<HTMLElement>("a")].find(
    (anchor) => (anchor.textContent ?? "").trim() === name,
  );
  if (link === undefined) throw new Error(`no link is named ${name}`);
  return link;
}

export function prefixField(page: ListPage): HTMLInputElement | null {
  return page.workspace.querySelector<HTMLInputElement>("input");
}

export async function typePrefix(page: ListPage, text: string): Promise<void> {
  const field = prefixField(page);
  if (field === null) throw new Error("the page offers no name prefix field");
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (setter === undefined) throw new Error("the input has no value setter");
  await act(async () => {
    setter.call(field, text);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

export function typeChoice(page: ListPage): HTMLElement | null {
  return page.workspace.querySelector<HTMLElement>('[role="combobox"]');
}

export async function waitForTypeChoice(page: ListPage): Promise<void> {
  await waitUntil(() => typeChoice(page) !== null, PAGE_WAIT_MS);
}

function optionElements(page: ListPage): HTMLElement[] {
  return [
    ...page.workspace.querySelectorAll<HTMLElement>('[role="option"]'),
  ];
}

async function openTypeChoice(page: ListPage): Promise<void> {
  const trigger = typeChoice(page);
  if (trigger === null) throw new Error("the page offers no node-type choice");
  await click(trigger);
}

async function chooseOption(
  page: ListPage,
  wanted: (label: string) => boolean,
): Promise<void> {
  await openTypeChoice(page);
  const option = optionElements(page).find((element) =>
    wanted((element.textContent ?? "").trim()),
  );
  if (option === undefined) {
    throw new Error("the node-type choice offers no such option");
  }
  await act(async () => {
    option.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
  });
}

export function pickType(page: ListPage, name: string): Promise<void> {
  return chooseOption(page, (label) => label === name);
}

export function pickAllTypes(
  page: ListPage,
  typeNames: readonly string[],
): Promise<void> {
  return chooseOption(page, (label) => !typeNames.includes(label));
}

export async function offeredTypeLabels(page: ListPage): Promise<string[]> {
  await openTypeChoice(page);
  return optionElements(page).map((element) =>
    (element.textContent ?? "").trim(),
  );
}

function textOutsideButtons(root: HTMLElement): string {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text = "";
  for (let next = walker.nextNode(); next !== null; next = walker.nextNode()) {
    const holder = next.parentElement;
    if (holder !== null && holder.closest("button") === null) {
      text += next.textContent ?? "";
    }
  }
  return text.trim();
}

function alertElements(page: ListPage): HTMLElement[] {
  return [...page.workspace.querySelectorAll<HTMLElement>('[role="alert"]')];
}

export function alertMessages(page: ListPage): string[] {
  return alertElements(page).map(textOutsideButtons);
}

export function alertActions(page: ListPage): string[] {
  return alertElements(page).flatMap((alert) =>
    [...alert.querySelectorAll("button")].map((button) =>
      (button.textContent ?? "").trim(),
    ),
  );
}

export function alertButton(page: ListPage): HTMLElement {
  const button = alertElements(page)
    .map((alert) => alert.querySelector<HTMLElement>("button"))
    .find((candidate) => candidate !== null);
  if (button === undefined || button === null) {
    throw new Error("the alert offers no button");
  }
  return button;
}

export function loadingTexts(page: ListPage): string[] {
  return [
    ...page.workspace.querySelectorAll<HTMLElement>('[role="status"]'),
  ].map((element) => (element.textContent ?? "").trim());
}
