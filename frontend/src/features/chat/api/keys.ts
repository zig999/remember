/**
 * Chat — TanStack Query key factory.
 *
 * Spec references:
 *  - docs/specs/front/features/chat.feature.spec.md §"Data Layer Notes" —
 *    `conversationKeys` shape is normative.
 *  - front.md §4.1 (centralised key factories per feature; mutation
 *    invalidation references the factory entries).
 *
 * Conventions:
 *  - All entries are `as const` tuples — TanStack Query uses array equality;
 *    `as const` gives literal types so mutation `invalidateQueries` can
 *    select prefixes safely.
 *  - `messages` and `usage` are nested under the conversation `id` segment
 *    so invalidating `detail(id)` does NOT collaterally invalidate the
 *    nested children unless callers opt in via the `all` root.
 */

export const conversationKeys = {
  /** Root prefix — invalidates ALL conversation-scoped queries. */
  all: ["conversations"] as const,

  /**
   * List page (cursor-paginated). Filters object is part of the key so
   * `include_archived=true` and `=false` are distinct cache entries.
   */
  list: (filters: { includeArchived?: boolean }) =>
    ["conversations", "list", filters] as const,

  /** Single conversation metadata (title + archived_at). */
  detail: (id: string) => ["conversations", id] as const,

  /** Persisted messages for a conversation. */
  messages: (id: string) => ["conversations", id, "messages"] as const,

  /** Token + tool-call aggregates for a conversation. */
  usage: (id: string) => ["conversations", id, "usage"] as const,
} as const;
