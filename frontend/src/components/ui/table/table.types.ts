/**
 * Table — public type contract (DS port §4.14). HTML primitives, no state.
 * Sorting/pagination live in the consumer (TanStack Table in feature waves).
 */
import type { ComponentProps, Ref } from "react";

export interface TableProps extends ComponentProps<"table"> {
  ref?: Ref<HTMLTableElement>;
}
export interface TableSectionProps extends ComponentProps<"thead"> {
  ref?: Ref<HTMLTableSectionElement>;
}
export interface TableRowProps extends ComponentProps<"tr"> {
  ref?: Ref<HTMLTableRowElement>;
}
export interface TableHeadProps extends ComponentProps<"th"> {
  ref?: Ref<HTMLTableCellElement>;
}
export interface TableCellProps extends ComponentProps<"td"> {
  ref?: Ref<HTMLTableCellElement>;
}
export interface TableCaptionProps extends ComponentProps<"caption"> {
  ref?: Ref<HTMLTableCaptionElement>;
}
