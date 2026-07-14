/**
 * Foundations / Typography — specimen das variações de tipografia disponíveis.
 *
 * Após a adoção do UI-Kit (TUI), a tipografia do eternal é:
 *  - família MONO única (`--font-mono`, JetBrains Mono) em todo o app;
 *  - escala de tamanhos = utilitários built-in do Tailwind (base 16px);
 *  - peso/tracking aplicados por classe explícita (a escala nomeada antiga
 *    `text-heading`/`text-body-sm`/… foi removida na migração).
 *
 * Esta página é documentação viva (renderiza sob o tema selecionado no toolbar).
 */
import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const SAMPLE = "Memória viva — Águas de março 0123456789";

/* ---------- escala de tamanhos (Tailwind, base 16px) ---------------------- */
const SIZES: ReadonlyArray<{ cls: string; rem: string; px: string }> = [
  { cls: "text-xs", rem: "0.75rem", px: "12px" },
  { cls: "text-sm", rem: "0.875rem", px: "14px" },
  { cls: "text-base", rem: "1rem", px: "16px" },
  { cls: "text-lg", rem: "1.125rem", px: "18px" },
  { cls: "text-xl", rem: "1.25rem", px: "20px" },
  { cls: "text-2xl", rem: "1.5rem", px: "24px" },
  { cls: "text-3xl", rem: "1.875rem", px: "30px" },
  { cls: "text-4xl", rem: "2.25rem", px: "36px" },
];

/* ---------- pesos --------------------------------------------------------- */
const WEIGHTS: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: "font-normal", label: "Normal (400)" },
  { cls: "font-medium", label: "Medium (500)" },
  { cls: "font-semibold", label: "Semibold (600)" },
  { cls: "font-bold", label: "Bold (700)" },
];

/* ---------- papéis semânticos (mapa: antigo nome → classes atuais) -------- */
const ROLES: ReadonlyArray<{ role: string; cls: string; note: string }> = [
  { role: "Display", cls: "text-4xl font-bold tracking-tight", note: "títulos de destaque" },
  { role: "Heading", cls: "text-lg font-semibold tracking-tight", note: "h2 / seções" },
  { role: "Subheading", cls: "text-sm font-medium", note: "subtítulos" },
  { role: "Body (lg)", cls: "text-base", note: "corpo maior" },
  { role: "Body", cls: "text-sm", note: "corpo padrão" },
  { role: "Body (sm) / Caption", cls: "text-xs", note: "metadados, legendas" },
  { role: "Label", cls: "text-xs font-medium", note: "rótulos de campo" },
  { role: "Badge", cls: "text-xs font-bold", note: "selos / tags" },
  { role: "Code", cls: "text-xs", note: "trechos de código (mono)" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-md">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="flex flex-col divide-y divide-border border border-border">
        {children}
      </div>
    </section>
  );
}

function Row({ meta, children }: { meta: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-md sm:flex-row sm:items-baseline sm:gap-lg">
      <div className="w-56 shrink-0 text-xs text-muted-foreground">{meta}</div>
      <div className="min-w-0 flex-1 truncate text-foreground">{children}</div>
    </div>
  );
}

function TypographySpecimen() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2xl p-xl">
      <header className="flex flex-col gap-sm">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Tipografia</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Família monoespaçada única (<code className="text-foreground">--font-mono</code>,
          JetBrains Mono), escala de tamanhos do Tailwind (base 16px) e pesos/tracking por
          classe. Use o seletor <strong className="text-foreground">Tema</strong> no toolbar
          para ver em Phosphor ou Default.
        </p>
      </header>

      <Section title="Papéis semânticos">
        {ROLES.map((r) => (
          <Row
            key={r.role}
            meta={
              <span className="flex flex-col gap-0.5">
                <span className="text-foreground">{r.role}</span>
                <code className="text-muted-foreground">{r.cls}</code>
                <span className="text-muted-foreground">{r.note}</span>
              </span>
            }
          >
            <span className={r.cls}>{SAMPLE}</span>
          </Row>
        ))}
      </Section>

      <Section title="Escala de tamanhos">
        {SIZES.map((s) => (
          <Row
            key={s.cls}
            meta={
              <span className="flex flex-col gap-0.5">
                <code className="text-foreground">{s.cls}</code>
                <span className="text-muted-foreground">
                  {s.rem} · {s.px}
                </span>
              </span>
            }
          >
            <span className={s.cls}>{SAMPLE}</span>
          </Row>
        ))}
      </Section>

      <Section title="Pesos">
        {WEIGHTS.map((w) => (
          <Row key={w.cls} meta={<code className="text-foreground">{w.cls}</code>}>
            <span className={`text-lg ${w.cls}`}>{w.label} — {SAMPLE}</span>
          </Row>
        ))}
      </Section>

      <Section title="Tracking (espaçamento entre letras)">
        {["tracking-tight", "tracking-normal", "tracking-wide"].map((t) => (
          <Row key={t} meta={<code className="text-foreground">{t}</code>}>
            <span className={`text-lg ${t}`}>{SAMPLE}</span>
          </Row>
        ))}
      </Section>
    </div>
  );
}

const meta: Meta<typeof TypographySpecimen> = {
  title: "Eternal/Foundations/Typography",
  component: TypographySpecimen,
  parameters: {
    layout: "fullscreen",
    a11y: { element: "#storybook-root" },
  },
};
export default meta;

type Story = StoryObj<typeof TypographySpecimen>;

export const Overview: Story = {
  name: "Variações de tipografia",
};
