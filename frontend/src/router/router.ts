/**
 * router — the single Router instance built from `routeTree`.
 *
 * Spec references:
 *  - front.md §3 (routing)
 *  - front.back.md §7 constraint 4 (code-based, not file-based, this wave)
 *
 * `Register` declaration makes route IDs type-safe across the app (e.g.,
 * `<Link to="/graph">` autocompletes and refuses unknown paths).
 */

import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routes";

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  // Per front.md §3 fallback: unknown paths land in the root notFound surface
  // (header + footer remain visible).
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
