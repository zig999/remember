import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRoute,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { vi } from "vitest";
import { useNodeRead } from "../../api/node.hooks";
import { ACCEPTED_WIRE } from "../../api/__tests__/edit-support";
import {
  advance,
  jsonResponse,
  stubFetch,
  type RecordedRequest,
} from "../../api/__tests__/support";
import type { AttributeKey, NodeAttributeWire } from "../../types";
import { EntityForm } from "../EntityForm";
import { typeReason } from "./entity-form-reason-support";
import { openReviewIn } from "./entity-form-review-support";
import { catalogKey } from "./entity-form-support";
import {
  TYPED_REASON,
  editRequestsOf,
  pressSalvar,
} from "./entity-form-undo-support";
import { typeInto } from "./entity-form-value-type-support";

export const RELOAD_KEYS: readonly AttributeKey[] = [
  catalogKey("status_text"),
  catalogKey("title"),
];

export const HELD_STATUS = "Em andamento";
export const TYPED_STATUS = "Pausado";
export const RELOADED_STATUS = "Pausado (confirmado)";
export const NEXT_STATUS = "Concluído";
export const HELD_TITLE = "Alpha";
export const RELOADED_TITLE = "Alpha revisado";
export const SUPERSEDED_STATUS_ID = "at-status_text-1";
export const CURRENT_STATUS_ID = "at-status_text-2";

export type ServerAnswer = "values-now-current" | "same-node";

export interface ReloadedForm {
  readonly container: HTMLElement;
  readonly requests: RecordedRequest[];
}

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly queryClient: QueryClient;
}

const NODE_ID = "n-1";
const NODE_PATH = `/api/v1/nodes/${NODE_ID}`;
const UNDO_WINDOW_MS = 5000;
const ANSWER_TURNS = 20;
const RELOAD_TURNS = 60;

const placements: Placement[] = [];

function wireAttribute(
  id: string,
  key: string,
  value: string,
  current: boolean,
): NodeAttributeWire {
  return {
    id,
    attribute_key: key,
    value,
    valid_from: null,
    valid_to: null,
    status: current ? "active" : "superseded",
    is_current: current,
  };
}

const BEFORE_THE_SAVE: readonly NodeAttributeWire[] = [
  wireAttribute(SUPERSEDED_STATUS_ID, "status_text", HELD_STATUS, true),
  wireAttribute("at-title-1", "title", HELD_TITLE, true),
];

const AFTER_THE_SAVE: readonly NodeAttributeWire[] = [
  wireAttribute(SUPERSEDED_STATUS_ID, "status_text", HELD_STATUS, false),
  wireAttribute(CURRENT_STATUS_ID, "status_text", RELOADED_STATUS, true),
  wireAttribute("at-title-1", "title", HELD_TITLE, false),
  wireAttribute("at-title-2", "title", RELOADED_TITLE, true),
];

function nodeAnswer(attributes: readonly NodeAttributeWire[]): Response {
  return jsonResponse({
    ok: true,
    result: {
      node: {
        id: NODE_ID,
        node_type: "Project",
        canonical_name: "Apollo Mission",
        status: "active",
      },
      aliases: [],
      attributes,
    },
  });
}

function NodeForm(): ReactElement | null {
  const { data } = useNodeRead(NODE_ID);
  if (data === undefined) return null;
  return <EntityForm node={data} attributeKeys={RELOAD_KEYS} />;
}

function buildRouter() {
  const rootRoute = createRootRoute({ component: Outlet });
  const formRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <NodeForm />,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([formRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

async function mountNodeForm(): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const router = buildRouter();
  await router.load();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  });
  for (let turn = 0; turn < 3; turn += 1) {
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });
  }
  placements.push({ root, container, queryClient });
  return container;
}

export function unmountReloadedForms(): void {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.queryClient.clear();
  }
}

export async function reviewedEditAnswering(
  answer: ServerAnswer,
): Promise<ReloadedForm> {
  const saved = { accepted: false };
  const requests = stubFetch((request) => {
    if (request.method === "POST") {
      saved.accepted = true;
      return Promise.resolve(jsonResponse(ACCEPTED_WIRE));
    }
    const reloaded = saved.accepted && answer === "values-now-current";
    return Promise.resolve(
      nodeAnswer(reloaded ? AFTER_THE_SAVE : BEFORE_THE_SAVE),
    );
  });
  const container = await mountNodeForm();
  await typeInto(container, "status_text", HELD_STATUS, TYPED_STATUS);
  await openReviewIn(container);
  await typeReason(container, TYPED_REASON);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  return { container, requests };
}

function nodeReadsOf(requests: readonly RecordedRequest[]): number {
  return requests.filter(
    ({ method, url }) => method === "GET" && url.pathname === NODE_PATH,
  ).length;
}

async function letTheAnswerArrive(): Promise<void> {
  for (let turn = 0; turn < ANSWER_TURNS; turn += 1) {
    await advance(0);
  }
}

export async function confirmAndAwaitReload(
  form: ReloadedForm,
  savesSoFar: number,
): Promise<void> {
  await pressSalvar(form.container);
  await advance(UNDO_WINDOW_MS);
  for (
    let turn = 0;
    turn < RELOAD_TURNS && nodeReadsOf(form.requests) < savesSoFar + 1;
    turn += 1
  ) {
    await advance(0);
  }
  await letTheAnswerArrive();
  if (editRequestsOf(form.requests).length !== savesSoFar) {
    throw new Error("the edit was not sent exactly once per confirmation");
  }
}

export function callsOf(requests: readonly RecordedRequest[]): string[] {
  return requests.map(({ method, url }) => `${method} ${url.pathname}`);
}

export function sentEditBodies(): Record<string, unknown>[] {
  return vi.mocked(globalThis.fetch).mock.calls.flatMap(([input, init]) => {
    const body = init?.body;
    return String(input).endsWith("/edit") && typeof body === "string"
      ? [JSON.parse(body) as Record<string, unknown>]
      : [];
  });
}
