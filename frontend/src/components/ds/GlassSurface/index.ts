/**
 * GlassSurface — per-component barrel (stack exception per front.md §6.4).
 * Re-exports only this component's public surface.
 */
export { GlassSurface } from "./GlassSurface";
export { glassSurface } from "./GlassSurface.variants";
export type { GlassSurfaceVariants } from "./GlassSurface.variants";
export type {
  GlassLevel,
  GlassAccent,
  GlassFill,
  GlassRadius,
  GlassRole,
  GlassSurfaceProps,
} from "./GlassSurface.types";
