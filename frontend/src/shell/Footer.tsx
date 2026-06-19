/**
 * Footer — fixed bottom region (z-frame). Foundation: placeholder.
 *
 * Spec references:
 *  - front.md §2 (region rules — fixed, thin, never scrolls)
 *  - front.md §2.2 (Layer scale: z-frame == 40)
 *  - front.md §12 (footer content is OUT OF SCOPE this wave)
 *
 * Foundation contract: render an empty GlassSurface level="ambient" frame
 * the height of one row (`h-8` ≈ 32 px). Health indicator, `as_of` segment,
 * curation counter, run progress all ship in later waves per front.md §12
 * and front.back.md §8.
 */

import { GlassSurface } from "@/components/ds/GlassSurface";
import { cn } from "@/lib/cn";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <GlassSurface
      level="ambient"
      role="contentinfo"
      aria-label="Rodapé"
      className={cn(
        "fixed inset-x-0 bottom-0 z-frame flex h-8 items-center px-lg",
        className,
      )}
    />
  );
}
