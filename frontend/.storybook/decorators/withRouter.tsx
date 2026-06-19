/**
 * withRouter — Storybook decorator that mounts a TanStack Router memory router
 * so components using <Link>/useLocation (e.g. the shell Header) render in
 * isolation. The story is rendered as the root route's component; the five area
 * paths exist as navigation targets so active state + navigation work.
 */
import type { Decorator } from "@storybook/react-vite";
import { useMemo } from "react";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
} from "@tanstack/react-router";

const PATHS = ["/graph", "/search", "/ingest", "/curation", "/history"];

export function withRouter(initialPath = "/graph"): Decorator {
  return function RouterDecorator(Story) {
    const router = useMemo(() => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const children = PATHS.map((path) =>
        createRoute({ getParentRoute: () => rootRoute, path, component: () => null }),
      );
      rootRoute.addChildren(children);
      return createRouter({
        routeTree: rootRoute,
        history: createMemoryHistory({ initialEntries: [initialPath] }),
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Story, initialPath]);
    // Story-only memory router — its type differs from the app's registered
    // router, so the provider prop is cast locally.
    return <RouterProvider router={router as never} />;
  };
}
