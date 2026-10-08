import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRoute,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { vi } from "vitest";
import { entityKeys } from "../../api/keys";
import { ACCEPTED_WIRE, refusalBody } from "../../api/__tests__/edit-support";
import {
  advance,
  answers,
  jsonResponse,
  stubFetch,
  type RecordedRequest,
} from "../../api/__tests__/support";
import type { AttributeKey, NodeRead } from "../../types";
import { EntityForm } from "../EntityForm";
import { typeReason } from "./entity-form-reason-support";
import { openReviewIn } from "./entity-form-review-support";
import {
  catalogKey,
  heldAttribute,
  nodeHolding,
} from "./entity-form-support";
import {
  TYPED_REASON,
  editRequestsOf,
  pressSalvar,
} from "./entity-form-undo-support";
import { typeInto } from "./entity-form-value-type-support";

export const STATUS_KEYS: readonly AttributeKey[] = [catalogKey("status_text")];
export const HELD_STATUS = "Em andamento";
export const TYPED_STATUS = "Pausado";
export const SUPERSEDING_STATUS = "Concluído";

const UNDO_WINDOW_MS = 5000;
const ANSWER_TURNS = 20;

interface Placement {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly queryClient: QueryClient;
}

const placements: Placement[] = [];

export interface StatusEdit {
  readonly container: HTMLElement;
  readonly requests: RecordedRequest[];
}

export function conflictAnswer(): Response {
  return jsonResponse(
    refusalBody(
      "BUSINESS_ENTITY_EDIT_CONFLICT",
      "Conflito de edição ZX-41 relatado pelo servidor.",
      { attribute_key: "status_text", item_id: "at-status_text-Em andamento" },
    ),
    409,
  );
}

export function acceptedAnswer(): Response {
  return jsonResponse(ACCEPTED_WIRE);
}

function NodeForm(props: {
  readonly read: () => Promise<NodeRead>;
}): ReactElement | null {
  const { data } = useQuery({
    queryKey: entityKeys.node("n-1"),
    queryFn: props.read,
    staleTime: Infinity,
  });
  if (data === undefined) return null;
  return <EntityForm node={data} attributeKeys={STATUS_KEYS} />;
}

function buildRouter(read: () => Promise<NodeRead>) {
  const rootRoute = createRootRoute({ component: Outlet });
  const formRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <NodeForm read={read} />,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([formRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

async function mountStatusForm(
  read: () => Promise<NodeRead>,
): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const router = buildRouter(read);
  await router.load();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

export function unmountStatusForms(): void {
  for (const placement of placements.splice(0)) {
    act(() => {
      placement.root.unmount();
    });
    placement.container.remove();
    placement.queryClient.clear();
  }
}

export async function reviewedEditOfStatus(
  answer: () => Response,
): Promise<StatusEdit> {
  const requests = stubFetch(answers(answer));
  const reads = { count: 0 };
  const read = (): Promise<NodeRead> => {
    reads.count += 1;
    const status = reads.count === 1 ? HELD_STATUS : SUPERSEDING_STATUS;
    return Promise.resolve(nodeHolding([heldAttribute("status_text", status)]));
  };
  const container = await mountStatusForm(read);
  await typeInto(container, "status_text", HELD_STATUS, TYPED_STATUS);
  await openReviewIn(container);
  await typeReason(container, TYPED_REASON);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  return { container, requests };
}

export async function letTheAnswerArrive(): Promise<void> {
  for (let turn = 0; turn < ANSWER_TURNS; turn += 1) {
    await advance(0);
  }
}

export async function confirmAndAwaitAnswer(
  edit: StatusEdit,
): Promise<void> {
  await pressSalvar(edit.container);
  await advance(UNDO_WINDOW_MS);
  await letTheAnswerArrive();
  if (editRequestsOf(edit.requests).length !== 1) {
    throw new Error("the edit was not sent exactly once");
  }
}

export async function confirmAndStayInsideTheWindow(
  edit: StatusEdit,
): Promise<void> {
  await pressSalvar(edit.container);
  await advance(UNDO_WINDOW_MS - 1);
  await letTheAnswerArrive();
}
