/**
 * ToolCallChip — props (TC-10).
 *
 * Spec references:
 *  - dev_tc_010 task contract — props `chip: ToolCallData`, optional `className`.
 *  - features/chat/types.ts — `ToolCallData = { tool, argsSummary, ok }`.
 */
import type { ToolCallData } from "../../types";

export interface ToolCallChipProps {
  readonly chip: ToolCallData;
  readonly className?: string;
}
