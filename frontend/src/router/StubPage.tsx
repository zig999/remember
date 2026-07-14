/**
 * StubPage — minimal centered placeholder shown by the foundation routes
 * (/graph, /search, /ingest, /curation, /history, /sign-in, /not-found).
 *
 * Per TC-04 assumptions_allowed: "Stub pages render a minimal centered text
 * placeholder on bg-surface (no GlassSurface usage in placeholder areas)".
 * Per front.md §12, area content is OUT OF SCOPE this wave.
 */

import type { ReactNode } from "react";

export interface StubPageProps {
  /** pt-BR title shown as h1. */
  title: string;
  /** Optional second line — defaults to an "em breve" hint. */
  hint?: ReactNode;
  /** Test id for unit/E2E selectors. */
  testId?: string;
}

export function StubPage({
  title,
  hint = "Conteúdo em breve.",
  testId,
}: StubPageProps) {
  return (
    <section
      className="flex min-h-[60vh] flex-col items-center justify-center gap-md px-lg text-foreground"
      data-testid={testId ?? "stub-page"}
    >
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-body text-body">{hint}</p>
    </section>
  );
}
