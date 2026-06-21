/**
 * Graph — TanStack Query key factory (TC-FE-08).
 *
 * Spec references:
 *  - docs/specs/front/components/NodeDetailPanel.component.spec.md §9 (Data
 *    Layer Notes — `useNodeDetail` query key).
 *  - front.md §4.1 (centralised key factories per feature; mutation
 *    invalidation references the factory entries).
 *  - CLAUDE.md "Data layer — TanStack Query" — typed, centralised query keys.
 *
 * Conventions:
 *  - All entries are `as const` tuples — TanStack Query uses array equality;
 *    `as const` gives literal types so consumers can match prefixes safely.
 *  - The root `all` prefix is the catch-all invalidator (e.g. for a future
 *    "refresh entire graph subview"). `detail(id)` is the only entry used by
 *    `useNodeDetail` in v1.
 */

export const graphNodeKeys = {
  /** Root prefix — invalidates ALL graph-node-scoped queries. */
  all: ["nodes"] as const,

  /** Single node detail (canonical name + aliases + attributes). */
  detail: (id: string) => ["nodes", id] as const,
} as const;
