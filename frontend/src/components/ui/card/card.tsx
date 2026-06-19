/**
 * Card — composable surface (DS port §4.4).
 *
 * Tokens remapped: title uses `font-sans` (Space Grotesk, the title family) —
 * was origin's `font-display`. No arbitrary tracking value: `tracking-tight`.
 */
import { cn } from "@/lib/cn";
import type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from "./card.types";

export function Card({ className, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg bg-surface text-body shadow-sm transition-shadow duration-200 ease-out hover:shadow-md", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-xs p-xl pb-md", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-sans text-subheading font-bold tracking-tight text-content",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ref,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      ref={ref}
      className={cn("text-body-sm text-body", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ref, ...props }: CardContentProps) {
  return <div ref={ref} className={cn("p-xl pt-0", className)} {...props} />;
}

export function CardFooter({ className, ref, ...props }: CardFooterProps) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-md p-xl pt-0", className)}
      {...props}
    />
  );
}
