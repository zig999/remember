import { act, createElement } from "react";
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
import { EntityForm } from "../EntityForm";
import type { AttributeKey, NodeRead } from "../../types";

function buildRouter(node: NodeRead, attributeKeys: readonly AttributeKey[]) {
  const rootRoute = createRootRoute({ component: Outlet });
  const formRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => createElement(EntityForm, { node, attributeKeys }),
  });
  const curationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/curation",
    component: () =>
      createElement("p", { "data-testid": "curation-page" }, "curation"),
  });
  return createRouter({
    routeTree: rootRoute.addChildren([formRoute, curationRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

export type FormRouter = ReturnType<typeof buildRouter>;

export interface MountedForm {
  readonly root: Root;
  readonly container: HTMLDivElement;
  readonly router: FormRouter;
}

export async function mountFormInRouter(
  node: NodeRead,
  attributeKeys: readonly AttributeKey[],
): Promise<MountedForm> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const router = buildRouter(node, attributeKeys);
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
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
  return { root, container, router };
}
