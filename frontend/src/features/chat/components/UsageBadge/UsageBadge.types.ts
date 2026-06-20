/**
 * UsageBadge — props (TC-10).
 *
 * Spec references:
 *  - dev_tc_010 task contract — props `conversationId: string`, optional
 *    `className`. The badge consumes `useGetConversationUsage(conversationId)`
 *    internally and self-hides while data is loading.
 */
export interface UsageBadgeProps {
  readonly conversationId: string;
  readonly className?: string;
}
