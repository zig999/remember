// Application-side mirror of the DB `norm()` function:
//
//   norm(x) = lower(unaccent(collapseSpaces(trim(x))))
//
// This is the SINGLE normalization policy of the system (CLAUDE.md
// "Conventions"). The DB stores `node_alias.alias_norm` as a STORED
// generated column using the same function — for read-side prefix lookups
// we re-apply the policy in the BFF and pass the result as a bound
// parameter so the index on `alias_norm` is still used.
//
// `immutable_unaccent` exists in the DB precisely because `unaccent()` is
// STABLE (CLAUDE.md "Known Gotchas"). On the BFF side we strip combining
// diacritics via Unicode NFD + range removal, which yields the same
// canonical output for the ASCII / Latin-1 characters the catalog uses.

/** Collapse internal whitespace runs to a single SPACE. */
function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ");
}

/** NFD + strip combining marks U+0300..U+036F. */
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Apply the project-wide normalization policy. */
export function norm(input: string): string {
  return collapseSpaces(stripDiacritics(input.trim())).toLowerCase();
}
