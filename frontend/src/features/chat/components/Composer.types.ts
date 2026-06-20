/**
 * Composer — public type contract (TC-09).
 *
 * Spec references:
 *  - TC-09 task contract — `Composer` props: `conversationId` (string),
 *    `isArchived` (boolean), `onUnarchive` (() => void), `className?` (string,
 *    merged via cn()).
 *  - docs/specs/domains/chat/chat.spec.md §UC-02 — Composer hosts the textarea
 *    that drives `POST /api/v1/conversations/:id/messages`.
 *  - docs/specs/domains/chat/chat.spec.md §BR-25 — archived conversations
 *    refuse writes; the Composer renders an archived banner with a 'Reativar'
 *    action that calls `onUnarchive`.
 */
import type { CSSProperties } from "react";

export interface ComposerProps {
  /** Active conversation id — passed verbatim to `useSendMessage`. */
  readonly conversationId: string;
  /**
   * True when the conversation is archived (`archived_at IS NOT NULL`). In
   * archived mode the entire Composer input area is replaced by an inline
   * banner with a 'Reativar' button (BR-25).
   */
  readonly isArchived: boolean;
  /**
   * Callback invoked when the owner clicks 'Reativar' in the archived banner.
   * The owner of this prop wires the un-archive mutation
   * (`updateConversation { archived_at: null }`, BR-36).
   */
  readonly onUnarchive: () => void;
  /**
   * Optional className — merged onto the outermost GlassSurface band via cn()
   * (front.md §6.4 component contract).
   */
  readonly className?: string;
  /** Optional inline style passthrough — kept for parity with other DS bands. */
  readonly style?: CSSProperties;
}
