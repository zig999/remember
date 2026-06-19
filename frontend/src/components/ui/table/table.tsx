/**
 * Table — composable data table (DS port §4.14).
 *
 * Tokens remapped: `border-subtle` -> `border-border`; row/footer fill -> `bg-primary`.
 * No arbitrary tracking value: header uses `tracking-wider`. `Table` is wrapped
 * in an overflow-x-auto div so wide tables scroll inside their own container.
 */
import { cn } from "@/lib/cn";
import type {
  TableProps,
  TableSectionProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
} from "./table.types";

export function Table({ className, ref, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom border-collapse text-body-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ref, ...props }: TableSectionProps) {
  return <thead ref={ref} className={cn(className)} {...props} />;
}

export function TableBody({ className, ref, ...props }: TableSectionProps) {
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

export function TableFooter({ className, ref, ...props }: TableSectionProps) {
  return (
    <tfoot
      ref={ref}
      className={cn("border-t border-border bg-primary font-semibold", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ref, ...props }: TableRowProps) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors hover:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ref, ...props }: TableHeadProps) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-md text-left align-middle text-label font-semibold uppercase tracking-wider text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ref, ...props }: TableCellProps) {
  return (
    <td
      ref={ref}
      className={cn("px-md py-3 align-middle text-body", className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ref, ...props }: TableCaptionProps) {
  return (
    <caption
      ref={ref}
      className={cn("mt-md text-body-sm text-muted", className)}
      {...props}
    />
  );
}
