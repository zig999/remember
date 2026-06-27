/**
 * IngestWorkspace — public type contract (dev_tc_005).
 *
 * Feature-local page component, mounted by the router at `/ingest`. The
 * workspace has no public props in v1 — the route mounts it without
 * arguments, all state lives internally (single-screen, no
 * router-search-param dependency).
 */
export interface IngestWorkspaceProps {
  /** Additional Tailwind classes — merged via `cn()`. */
  readonly className?: string;
}
