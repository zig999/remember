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
  activeConversationId: string | undefined;
  className?: string;
}

export function HeaderConversationMenu({
  activeConversationId,
  className,
}: HeaderConversationMenuProps) {
  const navigate = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);

  const listQuery = useListConversations({ includeArchived });

  const createMutation = useCreateConversation();
  const updateMutation = useUpdateConversation();
  const deleteMutation = useDeleteConversation();

  const conversations = listQuery.data?.items ?? [];
  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title ?? null;

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
