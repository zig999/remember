import type { ReactNode } from "react";

export interface StubPageProps {
  title: string;
  hint?: ReactNode;
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
