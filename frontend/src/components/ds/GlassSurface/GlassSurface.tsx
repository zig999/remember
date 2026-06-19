/**
 * GlassSurface — frosted-glass container atom.
 *
 * Canonical spec: docs/specs/front/components/GlassSurface.component.spec.md
 *
 * **TC-04 FORWARD STUB.** TC-04 needs `level="ambient"` for the Header/Footer
 * placeholders (TC-04 task contract: "must use GlassSurface level='ambient'
 * as their container, not raw div with manual glass classes"). TC-06 ships
 * the full atom (panel, modal, accents, motion variants, CSS uncertain
 * pulse). Until then, this stub renders the canonical `ambient` composition
 * from spec §6.1 and throws for other levels so a premature consumer fails
 * loud rather than silently misrendering.
 *
 * Class composition (spec §6.1, dark + light tokens declared in theme.css):
 *   bg-surface-glass-ambient backdrop-blur-glass-sm
 *   border border-border-glass
 *   shadow-sm rounded-none
 *
 * Per spec §7, `ambient` has NO enter/exit motion (the frame is always
 * present from the first paint), so the `animate` prop is accepted but
 * intentionally ignored for this level.
 */

import { cn } from "@/lib/cn";
import type { GlassSurfaceProps } from "./GlassSurface.types";

const AMBIENT_CLASSES =
  "bg-surface-glass-ambient backdrop-blur-glass-sm border border-border-glass shadow-sm rounded-none";

export function GlassSurface(props: GlassSurfaceProps) {
  const {
    level,
    accent: _accent,
    animate: _animate,
    radius: _radius,
    role = "group",
    className,
    ref,
    children,
    ...rest
  } = props;

  // Forward stub: only ambient is implemented in TC-04.
  if (level !== "ambient") {
    throw new Error(
      `GlassSurface: level="${level}" is not implemented in TC-04 (forward stub). ` +
        "Full atom (panel/modal/accents/motion) ships in TC-06.",
    );
  }

  // Mark these as intentionally unused — they belong to the full spec
  // surface that TC-06 will implement.
  void _accent;
  void _animate;
  void _radius;

  return (
    <div ref={ref} role={role} className={cn(AMBIENT_CLASSES, className)} {...rest}>
      {children}
    </div>
  );
}
