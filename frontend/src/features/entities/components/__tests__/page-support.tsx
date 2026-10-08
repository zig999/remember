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
import { sessionToken } from "./session-token";

const WORKSPACE = '[data-testid="app-workspace"]';
const NODES_PATH = "/api/v1/nodes/";
const KEYS_PATH = "/api/v1/attribute-keys";
const PAGE_WAIT_MS = 10_000;

export const NODE_ID = "n-1";
export const NODE_NAME = "Apollo Mission";
export const NODE_TYPE = "Project";

export type Answer = (attempt: number) => Promise<Response>;

export interface EntityAnswers {
  readonly node: Answer;
  readonly keys: Answer;
}

export interface AttributeFixture {
  readonly key: string;
  readonly value: string;
}

export interface OpenedPage {
  readonly workspace: HTMLElement;
  readonly requests: RecordedRequest[];
}

export interface RequestCounts {
  readonly node: number;
  readonly keys: number;
}

export interface Observed {
  readonly loading: string | null;
  readonly alert: string | null;
  readonly actionLabel: string | null;
  readonly action: boolean;
  readonly form: boolean;
  readonly fields: number;
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly queryClient: QueryClient;
}

const placements: Placement[] = [];

export function neverAnswers(): Promise<Response> {
  return new Promise<Response>(() => undefined);
}

export function nodeAnswer(
  status: string,
  attributes: readonly AttributeFixture[] = [],
): Promise<Response> {
  return Promise.resolve(
    jsonResponse({
      ok: true,
      result: {
        node: {
          id: NODE_ID,
          node_type: NODE_TYPE,
          canonical_name: NODE_NAME,
          status,
        },
        aliases: [],
        attributes: attributes.map((attribute, index) => ({
          id: `at-${index + 1}`,
          attribute_key: attribute.key,
          value: attribute.value,
          valid_from: null,
          valid_to: null,
          status: "active",
          is_current: true,
        })),
      },
    }),
  );
}

export function keysAnswer(): Promise<Response> {
  return Promise.resolve(
    jsonResponse({
      ok: true,
      result: {
        total: 1,
        items: [
          {
            key: "status_text",
            value_type: "text",
            is_temporal: false,
            allows_multiple_current: false,
            description: null,
          },
        ],
      },
    }),
  );
}

export function refusal(
  httpStatus: number,
  code: string,
  message: string,
): Promise<Response> {
  return Promise.resolve(
    jsonResponse(
      { ok: false, error: { code, message, details: { cause: message } } },
      httpStatus,
    ),
  );
}

function entityResponder(answers: EntityAnswers): Responder {
  const seen = { node: 0, keys: 0 };
  return (request) => {
    const path = request.url.pathname;
    if (path.startsWith(NODES_PATH)) {
      seen.node += 1;
      return answers.node(seen.node);
    }
    if (path === KEYS_PATH) {
      seen.keys += 1;
      return answers.keys(seen.keys);
    }
    return neverAnswers();
  };
}

export async function openEntityPage(
  nodeId: string,
  answers: EntityAnswers,
): Promise<OpenedPage> {
  useAuthStore.getState().setToken(sessionToken());
  const requests = stubFetch(entityResponder(answers));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/entities/${nodeId}`] }),
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
  return { workspace, requests };
}

export function unmountPages(): void {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.queryClient.clear();
  }
  useAuthStore.getState().clear();
}

export function requestCounts(page: OpenedPage): RequestCounts {
  return {
    node: page.requests.filter(({ url }) => url.pathname.startsWith(NODES_PATH))
      .length,
    keys: page.requests.filter(({ url }) => url.pathname === KEYS_PATH).length,
  };
}

export async function flush(ms: number): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}

export async function waitForRequest(
  page: OpenedPage,
  which: keyof RequestCounts,
): Promise<void> {
  await waitUntil(() => requestCounts(page)[which] > 0, PAGE_WAIT_MS);
  await flush(20);
}

export async function waitForAlert(page: OpenedPage): Promise<void> {
  await waitUntil(
    () => page.workspace.querySelector('[role="alert"]') !== null,
    PAGE_WAIT_MS,
  );
}

export async function pageSettled(page: OpenedPage): Promise<void> {
  await waitUntil(
    () =>
      page.workspace.querySelector('[role="status"]') === null &&
      page.workspace.querySelector('h1, [role="alert"]') !== null,
    PAGE_WAIT_MS,
  );
}

export function observe(page: OpenedPage): Observed {
  const workspace = page.workspace;
  const alert = workspace.querySelector<HTMLElement>('[role="alert"]');
  const status = workspace.querySelector<HTMLElement>('[role="status"]');
  const control = workspace.querySelector(
    "button, a[href], [role='button']",
  );
  return {
    loading: status?.textContent ?? null,
    alert: alert?.textContent ?? null,
    actionLabel: alert?.querySelector("button")?.textContent ?? null,
    action: control !== null || /tentar/i.test(workspace.textContent ?? ""),
    form: workspace.querySelector("form") !== null,
    fields: workspace.querySelectorAll("input, select, textarea").length,
  };
}

export function retryButton(page: OpenedPage): HTMLElement {
  const button = page.workspace.querySelector<HTMLElement>(
    '[role="alert"] button',
  );
  if (button === null) {
    throw new Error("the alert offers no button");
  }
  return button;
}

export async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click();
  });
}

export function firstTextNodeContaining(
  root: Node,
  text: string,
): Node | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let next = walker.nextNode(); next !== null; next = walker.nextNode()) {
    if ((next.textContent ?? "").includes(text)) return next;
  }
  return null;
}
