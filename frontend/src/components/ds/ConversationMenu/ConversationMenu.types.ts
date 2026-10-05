import type { Ref } from "react";
import type { Conversation } from "@/features/chat/types";

export interface ConversationMenuProps {
  activeConversationId?: string | null;

  activeTitle?: string | null;

  conversations: ReadonlyArray<Conversation>;

  isLoading?: boolean;

  includeArchived?: boolean;

  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, newTitle: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;

  className?: string;

  ref?: Ref<HTMLButtonElement>;
}
