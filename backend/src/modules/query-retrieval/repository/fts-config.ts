// Full-text search configuration constants (BR-06 of `query-retrieval.back.md`).
//
// Two named, versioned PostgreSQL FTS configurations created by
// `migrations/0001_schema.sql`:
//
//   - `pt_unaccent_v1`     — prose: stemming pt + unaccent.
//     Used by the fragment layer (`information_fragment.text_search`) and the
//     chunk layer (`raw_chunk.text_search`).
//   - `simple_unaccent_v1` — names: unaccent without stemming.
//     Used by the node-alias layer (`node_alias` `to_tsvector(...)`).
//
// Both values are HARDCODED compile-time strings — never request data. A
// future synonym dictionary (`pt_unaccent_v2`, ADR A4) is activated by
// changing the constant and running the migration; the code path is unaware.
// Zero runtime branching on config name.

/** FTS config for prose: stemming pt + unaccent (`pt_unaccent_v1`). */
export const FTS_PROSE_CONFIG = "pt_unaccent_v1" as const;

/** FTS config for entity names: unaccent without stemming (`simple_unaccent_v1`). */
export const FTS_NAME_CONFIG = "simple_unaccent_v1" as const;
