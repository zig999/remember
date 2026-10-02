
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
