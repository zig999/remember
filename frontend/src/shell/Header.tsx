/**
 * Header — fixed top region (z-frame). Foundation: placeholder.
 *
 * Spec references:
 *  - front.md §2 (region rules — fixed, thin, never scrolls)
 *  - front.md §2.2 (Layer scale: z-frame == 40)
 *  - front.md §12 (header content is OUT OF SCOPE this wave)
 *
 * Foundation contract: render an empty GlassSurface level="ambient" frame
 * the height of one row (`h-12` ≈ 48 px) so the workspace can compute its
 * available space. Navigation tabs, ⌘K trigger, settings ship in later waves
 * per front.md §12 and front.back.md §8.
 */

import { GlassSurface } from "@/components/ds/GlassSurface";
import { cn } from "@/lib/cn";

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <GlassSurface
      level="ambient"
      role="banner"
      aria-label="Cabeçalho"
      className={cn(
        "fixed inset-x-0 top-0 z-frame flex h-12 items-center px-lg",
        className,
      )}
    />
  );
}
