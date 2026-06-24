/**
 * Curation — TanStack Query key factories.
 *
 * Spec references:
 *  - docs/specs/front/features/curadoria.feature.spec.md §4 (Cache keys —
 *    `curationKeys`, `provenanceKeys`, `nodeKeys`, `historyKeys` shapes are
 *    normative).
 *  - front.md §4.1 (centralised key factories per feature; mutation
 *    invalidation references the factory entries).
 *
 * Conventions:
 *  - All entries are `as const` tuples — TanStack Query uses array equality;
 *    `as const` gives literal types so mutation `invalidateQueries` can
 *    select prefixes safely (e.g., `invalidateQueries({ queryKey:
 *    curationKeys.all })` wipes both queue + metrics).
 *  - These factories MUST be the only source of truth for query keys in the
 *    curation feature wave (TC-04 through TC-07 import them).
 */

/* ------------------------------------------------------------------ *
 * curationKeys — fila + métricas                                      *
 * ------------------------------------------------------------------ */

export const curationKeys = {
  /** Root prefix — invalidates ALL curation-scoped queries. */
  all: ["curation"] as const,

  /**
   * Review queue listing — filtered by `kind` (entity_match / disputed /
   * undefined for both) and page offset. Filters are folded into a single
   * object segment so two distinct filter combinations occupy distinct
   * cache entries (e.g., kind=entity_match page 0 vs. kind=disputed page 0).
   */
  queue: (kind?: string, page?: number) =>
    ["curation", "queue", { kind, page }] as const,

  /** Calibration metrics (§16). */
  metrics: () => ["curation", "metrics"] as const,
} as const;

/* ------------------------------------------------------------------ *
 * provenanceKeys — trilha de evidência                                *
 * ------------------------------------------------------------------ */

export const provenanceKeys = {
  /** Provenance for a `KnowledgeLink`. */
  link: (id: string) => ["provenance", "link", id] as const,
  /** Provenance for a `NodeAttribute`. */
  attribute: (id: string) => ["provenance", "attribute", id] as const,
  /** Provenance for an `InformationFragment` (leaf — no Provenance row). */
  fragment: (id: string) => ["provenance", "fragment", id] as const,
} as const;

/* ------------------------------------------------------------------ *
 * nodeKeys — detalhe de nó (KG)                                       *
 * ------------------------------------------------------------------ */

export const nodeKeys = {
  /** Node detail (aliases + attributes) for entity_match diff / disputed target name. */
  detail: (id: string) => ["nodes", id, "detail"] as const,
} as const;

/* ------------------------------------------------------------------ *
 * historyKeys — linhagem de link / atributo (errata context)          *
 * ------------------------------------------------------------------ */

export const historyKeys = {
  /** Link lineage chain (`supersedes_link_id`). */
  link: (id: string) => ["history", "link", id] as const,
  /** Attribute lineage chain (`supersedes_attribute_id`). */
  attribute: (id: string) => ["history", "attribute", id] as const,
} as const;
