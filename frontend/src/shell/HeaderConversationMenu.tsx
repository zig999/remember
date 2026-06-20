/**
 * HeaderConversationMenu — consumer adapter that wires the pure-UI
 * `ConversationMenu` (TC-06) to the chat data layer (TC-03).
 *
 * Spec references:
 *  - docs/specs/front/components/ConversationMenu.component.spec.md §3 (props)
 *    §5 (events) — the seven callbacks fired by the menu.
 *  - docs/specs/front/features/chat.feature.spec.md §1 (consumed endpoints),
 *    §3 (state transitions — what to invalidate / where to navigate on
 *    create / archive / delete / rename success).
 *  - docs/specs/front/front.md §2.2 — the menu lives in the Header (z-frame);
 *    this adapter is mounted by `Header.tsx` only when `pathname.startsWith("/chat")`.
 *
 * Why a separate adapter (not inline in Header.tsx):
 *  - The chat hooks (`useListConversations`, mutations) must only run when the
 *    user is on `/chat`. Inlining them in Header would force them to run on
 *    every route. Extracting into a child that Header mounts conditionally
 *    keeps the rest of the shell free of chat-feature traffic.
 *
 * Constraints honoured (from TC-02 task contract):
 *  - Mutations invalidate `conversationKeys.all` on success — the existing
 *    `useCreate/Update/DeleteConversation` hooks already do this; no extra
 *    invalidation is needed here.
 *  - On create success → navigate to `/chat?conversation=<new-id>`.
 *  - On archive of the ACTIVE conversation → navigate to `/chat` (no id).
 *  - On delete of the ACTIVE conversation → navigate to `/chat` (no id).
 *  - `includeArchived` is the local UI filter — owned here, mirrored into the
 *    list query so the cache key stays aligned with what the menu shows.
 *
 * Out of scope: rename does NOT navigate (the active id stays the same);
 *               unarchive does NOT navigate (the conversation stays active).
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ConversationMenu } from "@/components/ds/ConversationMenu";
import {
  useListConversations,
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
} from "@/features/chat/api";

export interface HeaderConversationMenuProps {
  /**
   * The conversation id read from the URL search param `?conversation=<id>`.
   * `undefined` when the user is on bare `/chat` (no selection yet).
   */
  activeConversationId: string | undefined;
  /** Extra classes merged onto the trigger button via cn() inside the menu. */
  className?: string;
}

export function HeaderConversationMenu({
  activeConversationId,
  className,
}: HeaderConversationMenuProps) {
  const navigate = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);

  // Data: the list query — `includeArchived` is part of the query key so
  // toggling it swaps to a separate cache entry (chat.feature.spec.md §4).
  const listQuery = useListConversations({ includeArchived });

  // Mutations: each one's `onSuccess` already invalidates
  // `conversationKeys.all` (see useCreate/Update/DeleteConversation).
  const createMutation = useCreateConversation();
  const updateMutation = useUpdateConversation();
  const deleteMutation = useDeleteConversation();

  const conversations = listQuery.data?.items ?? [];
  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title ?? null;

  // `exactOptionalPropertyTypes`: omit `className` when undefined rather than
  // passing `className: undefined` (which the type rejects).
  const classNameProp = className !== undefined ? { className } : {};

  return (
    <ConversationMenu
      activeConversationId={activeConversationId ?? null}
      activeTitle={activeTitle}
      conversations={conversations}
      isLoading={listQuery.isLoading}
      includeArchived={includeArchived}
      {...classNameProp}
      onSelect={(id) => {
        void navigate({ to: "/chat", search: { conversation: id } });
      }}
      onCreate={() => {
        createMutation.mutate(undefined, {
          onSuccess: (created) => {
            void navigate({
              to: "/chat",
              search: { conversation: created.id },
            });
          },
        });
      }}
      onRename={(id, newTitle) => {
        updateMutation.mutate({ id, title: newTitle });
      }}
      onArchive={(id) => {
        updateMutation.mutate(
          { id, archivedAt: new Date().toISOString() },
          {
            onSuccess: () => {
              // If the archived conversation was the active one, drop the
              // `?conversation` param so the workspace falls back to the
              // empty-state per chat.feature.spec.md §3.
              if (id === activeConversationId) {
                void navigate({ to: "/chat", search: {} });
              }
            },
          },
        );
      }}
      onUnarchive={(id) => {
        updateMutation.mutate({ id, archivedAt: null });
      }}
      onDelete={(id) => {
        deleteMutation.mutate(
          { id },
          {
            onSuccess: () => {
              if (id === activeConversationId) {
                void navigate({ to: "/chat", search: {} });
              }
            },
          },
        );
      }}
      onIncludeArchivedChange={(value) => {
        setIncludeArchived(value);
      }}
    />
  );
}
