/**
 * ConversationMenu — public type contract.
 *
 * Spec source: docs/specs/front/components/ConversationMenu.component.spec.md
 * §3 (props contract) + §3.1 (data contract, Conversation comes from
 * features/chat/types.ts).
 *
 * Naming/policy:
 *  - The component is PURE UI. None of these callbacks may perform IO inside
 *    the component — the consumer (the chat feature hook layer) wires each one
 *    to the appropriate TanStack Query mutation. The component just emits.
 *  - `ref` is intentionally typed `Ref<HTMLButtonElement>` because the React
 *    19 ref-as-prop is forwarded to the trigger <button> element (not the
 *    DropdownMenu root, which is logical-only).
 */
import type { Ref } from "react";
import type { Conversation } from "@/features/chat/types";

export interface ConversationMenuProps {
  /**
   * UUID of the active conversation; null when no conversation is selected
   * (the trigger then shows the "Nova conversa" fallback per spec §3).
   */
  activeConversationId?: string | null;

  /**
   * Title of the active conversation for the trigger. Null falls back to
   * "Conversa sem título" (spec §3 — "Falls back to 'Conversa sem título' if
   * null"). When `activeConversationId` is also null the trigger shows
   * "Nova conversa" instead.
   */
  activeTitle?: string | null;

  /** Recent conversations from `listConversations`. Required (spec §3). */
  conversations: ReadonlyArray<Conversation>;

  /** True while `listConversations` is fetching — spinner on trigger. */
  isLoading?: boolean;

  /**
   * Local-feeling controlled toggle for the `include_archived` server filter.
   * The consumer owns the boolean (so the request param stays in sync); the
   * component reflects it in the menu footer Switch.
   */
  includeArchived?: boolean;

  /* ----- callbacks (spec §5) -------------------------------------------- */
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, newTitle: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;

  /** Extra classes merged onto the trigger <button> via cn(). */
  className?: string;

  /** React 19 ref-as-prop — forwarded to the trigger <button>. */
  ref?: Ref<HTMLButtonElement>;
}
