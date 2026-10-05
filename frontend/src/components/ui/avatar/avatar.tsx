import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { AvatarProps } from "./avatar.types";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export const SWATCHES = ["bg-primary", "bg-accent", "bg-data"] as const;

export function swatch(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return SWATCHES[Math.abs(h) % SWATCHES.length]!;
}

export const avatarVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold uppercase tracking-tight text-primary-foreground transition duration-200 ease-out hover:scale-105",
  {
    variants: {
      size: {
        sm: "size-7 text-xs",
        md: "size-9 text-xs",
        lg: "size-12 text-sm font-medium",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export function Avatar({ className, name, size, ref, ...props }: AvatarProps) {
  return (
    <span
      ref={ref}
      role="img"
      aria-label={name}
      className={cn(avatarVariants({ size }), swatch(name), className)}
      {...props}
    >
      {initials(name)}
    </span>
  );
}
