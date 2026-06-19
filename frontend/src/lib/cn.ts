import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Tailwind-aware className merger (front.md §6.4, BR-11).
 * Required by every shared component; replaces string concatenation.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
