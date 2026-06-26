/**
 * NodeDetailPanel — per-component barrel (TC-FE-08).
 *
 * The per-component barrel is allowed as the Tailwind-v4/React-19 stack
 * exception in `CLAUDE.md "Component contract"`: a single-component
 * `index.ts` re-exporting that component's public surface (no `export *`).
 */
export {
  NodeDetailPanel,
  NODE_DETAIL_COPY,
  deriveCurationTarget,
} from "./NodeDetailPanel";
export type { NodeCurationTarget } from "./NodeDetailPanel";
export type { NodeDetailPanelProps } from "./NodeDetailPanel.types";
