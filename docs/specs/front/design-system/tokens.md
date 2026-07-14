# Design System — Tokens (Remember)

> Part of: `docs/specs/front/design-system/` | Layer: permanent
> Index: [`_index.md`](./_index.md)
> Implementation file: `frontend/src/styles/theme.css` — importa o tema do **UI-Kit (TUI)** + suplemento exclusivo do eternal.
> Version: 2.0.0 | Status: draft

> ## ⚠ Migração — o design system base agora é o UI-Kit (TUI)
>
> O eternal **adotou integralmente o design system do TUI** (submodule read-only em
> `frontend/vendor/ui-kit`). O **contrato de tokens base** — cores semânticas, tipografia, fontes,
> radius, sombras — é **canônico no kit** (`vendor/ui-kit/frontend/src/theme.css`), consumido via
> `@import` no `frontend/src/styles/theme.css`. **Não** duplicamos nem reespecificamos esse contrato aqui.
>
> Este documento passa a cobrir:
> 1. **O contrato base herdado do kit** (nomes de token que os componentes usam) — em resumo, apontando para o kit.
> 2. **A camada EXCLUSIVA do eternal** — tokens de domínio (`state-*`, `node-*`, `link-*`), material glass, backdrop, motion, z-index — que o suplemento em `theme.css` declara **por cima** do contrato do kit.
>
> Identidade visual atual: **terminal / phosphor** — verde phosphor sobre near-black, **monoespaçada em tudo**, **cantos retos** (radius 0), **flat** (sem sombras, sem vidro fosco), overlay CRT. Dois temas via `data-theme`: `phosphor` (default) e `default` (Terminal.css/Dracula) — ambos definidos no kit.

### O que mudou (era → agora)

| Eixo | Antes (v1.x — Remember) | Agora (v2.0 — TUI) |
|---|---|---|
| Fontes | Space Grotesk (títulos) + Space Mono (corpo) | **JetBrains Mono única** (`--font-mono`; `--font-sans` aliasada p/ mono) |
| Base font-size | `html { 13px }` (escala rem @13px) | **16px** (padrão) |
| Escala tipográfica | nomeada (`text-heading`/`text-body-sm`/…) | **utilitários built-in do Tailwind** (`text-xs`…`text-4xl`) + peso/tracking por classe |
| Cores | oklch azul/violeta (`action`/`accent`) + tema light | **paleta phosphor** (kit); temas `phosphor`/`default` |
| Radius | iOS (6–20px) + `pill` | **0** (cantos retos); sem `pill` |
| Sombras | 4 níveis sutis | **none** (flat) |
| Glass | vidro fosco (translúcido + blur) | **flat** (superfície opaca do kit, blur 0) |
| `state-*`/`node-*`/`link-*` | cores oklch distintas | **remapeadas p/ os accents do TUI** (colisões aceitas — distinção por ícone) |

---

## 1. Contrato base (herdado do kit) — nomes de token que os componentes usam

Definidos no kit (`vendor/ui-kit/frontend/src/theme.css`), **não** re-declarados no eternal. Valores mudam por tema (`data-theme`); os componentes referenciam só os **nomes**:

| Grupo | Tokens (classe Tailwind) |
|---|---|
| Superfícies | `background`, `surface`, `elevated`, `muted` (fundo), `hover`, `zebra` |
| Texto | `foreground`, `muted-foreground`, `accent` |
| Ação/estado | `primary`, `primary-foreground`, `primary-hover`, `primary-active`, `destructive`, `destructive-foreground`, `warning`, `info`, `success` |
| Borda | `--color-border`, `--color-border-strong`, `--color-ring` (cor) · `--border-DEFAULT` (largura) |
| Fontes | `--font-mono` (JetBrains Mono) · `--font-sans` = `var(--font-mono)` |
| Radius | `--radius-{sm,md,lg,xl}` = **0** (cantos retos) |

> **Inversão importante (herança de nomes):** no vocabulário antigo do eternal `--color-primary` era o *fundo*; no contrato do kit `primary` é a **cor de ação (CTA)** e o fundo é `background`. Todo o markup foi migrado (`bg-primary`→`bg-background`, `bg-action`→`bg-primary`, `text-content`→`text-foreground`, `text-muted`→`text-muted-foreground`, `*-danger`→`*-destructive`).

---

## 2. Implementação (`frontend/src/styles/theme.css`)

Estrutura do arquivo (ordem carrega):

```css
@layer theme, base, components, utilities;         /* ordem de layers fixada */
@import "@xyflow/react/dist/base.css" layer(base); /* estrutural do grafo (arestas) */
@import "../../vendor/ui-kit/frontend/src/theme.css"; /* contrato + temas + fontes + CRT (do kit) */
@source "../../vendor/ui-kit/frontend/src";        /* Tailwind escaneia o submodule */

@theme {
  /* SUPLEMENTO EXCLUSIVO do eternal — só tokens sem equivalente no kit,
     ou remapeados p/ os accents do kit. Ver §3–§6. */
}
/* CSS estrutural funcional: @utility z-*, keyframes, .max-w-*/.min-w-*, autofill. */
```

Regras:
- **Nunca editar `vendor/`** (submodule read-only). Mudanças no contrato base = PR no repo do TUI.
- O suplemento vem **depois** do import do kit → para os tokens que redeclara, o eternal vence (é assim que o remap de domínio se aplica).
- Um único `@import "tailwindcss"` (vem de dentro do tema do kit).

---

## 3. Cores de domínio — estados de confiança (5)

Semântica normativa (inalterada — `remember-modelagem-v7.md §3.5/§6.6`); apenas as **cores** foram remapeadas para os accents do TUI.

> Thresholds (BFF): `accepted` ⇐ `confidence ≥ 0.75` · `uncertain` ⇐ `0.40 ≤ x < 0.75` · `low-confidence` ⇐ `< 0.40` (não consolida) · `disputed` ⇐ conflito no mesmo período · `superseded` ⇐ substituído por versão mais nova.

| Estado | Token (classe) | Remap → accent TUI | FG | Lucide | Motion |
|---|---|---|---|---|---|
| `accepted` | `bg-state-accepted` | `success` (verde) | `state-accepted-fg` → `primary-foreground` | `check-circle-2` | none |
| `uncertain` | `bg-state-uncertain` | `warning` (âmbar) | idem | `help-circle` | `motion.pulse.uncertain` (§7) |
| `low-confidence` | `bg-state-low-confidence` | `muted-foreground` (dim) | idem | `circle-dashed` | none |
| `disputed` | `bg-state-disputed` | `destructive` (vermelho) | idem | `git-fork` | none |
| `superseded` | `bg-state-superseded` | `muted-foreground` (dim) | idem | `archive` | `motion.transition.supersede` |

> ⚠ **Colisão aceita:** `low-confidence` e `superseded` compartilham o mesmo tom (dim). A distinção entre estados é reforçada por **ícone** + rótulo. Fronteiras (`--color-border-accepted/uncertain/disputed/superseded`) espelham os accents acima.

### 3.1 Transições (StateBadge)

| De → Para | Variante | Token |
|---|---|---|
| `uncertain` → `accepted` | color morph + halo | `motion.transition.promote` |
| qualquer → `superseded` | fade cinza + slide Y | `motion.transition.supersede` |
| dois nós → um (merge) | colapso de badges | `motion.transition.merge` |

---

## 4. Cores de domínio — NodeType (10) e LinkType (13)

Catálogo/ícones/semântica **inalterados**; cores **remapeadas** para os poucos accents do TUI (`primary`/`info`/`warning`/`destructive`/`accent`/`muted-foreground`) → **múltiplos tipos compartilham cor**. Distinção primária passa a ser o **ícone** (nós) e o **estilo de traço** (links).

### 4.1 NodeType — cor + lucide-react

| NodeType | Classe (bg/border) | Remap → accent | lucide | Significado |
|---|---|---|---|---|
| Person | `*-node-person` | `accent` | `user` | Pessoa física |
| Organization | `*-node-organization` | `info` | `building-2` | Empresa/instituição/time |
| Project | `*-node-project` | `warning` | `rocket` | Iniciativa com prazo |
| Event | `*-node-event` | `destructive` | `calendar-clock` | Acontecimento datado |
| Role | `*-node-role` | `accent` | `id-badge` | Papel de uma pessoa |
| Category | `*-node-category` | `primary` | `tag` | Categoria taxonômica |
| Concept | `*-node-concept` | `info` | `lightbulb` | Conceito abstrato |
| Location | `*-node-location` | `success` | `map-pin` | Lugar |
| Document | `*-node-document` | `muted-foreground` | `file-text` | Documento (seeded 0001) |
| Task | `*-node-task` | `destructive` | `square-check` | Tarefa |

> **Regra de implementação (inalterada):** o mapa `nodeType → (colorToken, lucideIcon)` vive num único módulo (`frontend/src/features/graph/types/node-type-map.ts`). Inlining por consumidor é proibido.

### 4.2 LinkType — cor + traço temporal/estável

`is_temporal` dirige o **estilo do traço** (temporal = sólido; estável = tracejado) — **inalterado**. As 13 cores foram remapeadas (ciclo sobre os accents do TUI); a distinção confiável entre links é o **traço** + o rótulo, não a cor.

| Traço | LinkTypes |
|---|---|
| **Sólido** (temporal) | participates_in, member_of, holds_role, responsible_for, reports_to, organizes, delivered_to, sponsors |
| **Tracejado** (estável) | part_of, located_in, belongs_to_category, related_to, concerns |

### 4.3 Larguras de traço (namespace `--border-*`)

| Token | Uso |
|---|---|
| `--border-thin` (1px) | aresta padrão |
| `--border-2` (2px) | corroborada (≥2 fontes) |
| `--border-thick` (3px) | aresta selecionada |

### 4.4 Gotcha de border (duas namespaces) — ainda vale

`--color-border-*` (cor) e `--border-*` (largura) são **distintas**; sempre declare o par: `border border-border-glass` (largura + cor). Omitir a largura faz a borda **sumir silenciosamente**.

---

## 5. Tipografia

- **Família única mono:** `--font-mono` (JetBrains Mono + fallbacks); `--font-sans` = `var(--font-mono)`. Uma webfont carregada (JetBrains Mono, no `index.html`). Base `16px`.
- **Escala = utilitários built-in do Tailwind**; peso/tracking por classe explícita. A escala nomeada antiga foi **removida**.

Mapa dos papéis (referência — ver a página `Eternal/Foundations/Typography` no Storybook):

| Papel | Classes |
|---|---|
| Display | `text-4xl font-bold tracking-tight` |
| Heading | `text-lg font-semibold tracking-tight` |
| Subheading | `text-sm font-medium` |
| Body (lg) | `text-base` |
| Body | `text-sm` |
| Body (sm) / Caption | `text-xs` |
| Label | `text-xs font-medium` |
| Badge | `text-xs font-bold` |
| Code | `text-xs` (mono) |

Cores de texto: `text-foreground` (primário), `text-muted-foreground` (secundário/meta). Hierarquia por peso/cor, não por hue.

---

## 6. Superfícies, radius, sombra, glass, backdrop

- **Radius:** `--radius-*` = **0** (cantos retos, identidade terminal). Sem `pill` (badges são retos).
- **Sombra:** `--shadow-{sm,md,lg,glass}` = **none** (flat).
- **Glass (flat):** os tokens `surface-glass-{ambient,panel,modal}` foram remapeados p/ superfícies **opacas** do kit (`surface`/`elevated`); `--blur-glass-*` = **0**; `--color-scrim-glass` = `background`; `--color-border-glass` = `--color-border`. O componente `GlassSurface` renderiza como painel sólido de borda (sem translucidez/blur).
- **Spacing (funcional, mantido):** grade 4-pt `--spacing-{xs..2xl}` (`p-md`, `gap-lg`…).
- **Container (funcional, mantido):** `--container-3xs..7xl` (`max-w-*`/`min-w-*`) com override não-layered em `theme.css`.
- **Backdrop/overlay (mantidos):** `--backdrop-*`, `--graph-depth-overlay`, `--color-overlay`.

---

## 7. Motion (mantido)

Tokens `--duration-*` (instant/fast/moderate/entrance/pulse) e `--ease-*` (out/in/in-out/out-quint/out-expo/back) permanecem, além das variantes semânticas consumidas via keyframes (`animate-*`) e `lib/motion.ts` (`pulse.uncertain`, `transition.promote/supersede/merge`, `glass-panel/glass-modal`, `graph.nodeReveal`). Regra: componentes consomem variantes, não inventam inline. Gate de reduced-motion é opcional (não é regra).

---

## 8. Z-index (mantido)

Escala `--z-*` mapeada por `@utility z-*` em `theme.css`: `backdrop < base < panel < drawer < popover < frame < modal < toast`. Superfícies opacas vivem em `z-base`.

---

## 9. Regras semânticas canônicas

- Referenciar tokens via classes Tailwind; `style={{}}` só para valores dinâmicos sem utilitário (ex.: coordenada de nó do React Flow).
- Toda borda declara **cor + largura** (§4.4).
- `--color-ring`/`border-focus` exclusivos de foco/seleção.
- Texto sobre superfície usa `text-foreground`/`text-muted-foreground` — nunca uma cor de estado/nó.
- Mudanças no contrato base (cores/tipografia/fontes/radius) → **PR no repo do TUI**, nunca editar `vendor/`.

---

## Changelog

| Version | Date | Author | Type | Description |
|---|---|---|---|---|
| 1.0.0–1.1.0 | 2026-06-18/19 | Spec/Owner | — | Design system original do Remember (azul/glass/dual-font/oklch; dark+light). Ver histórico do git. |
| 2.0.0 | 2026-07-14 | Migração TUI | major | Adoção integral do design system do TUI via submodule. Contrato base (cores/tipografia/fontes/radius/sombra) passa a ser canônico no kit; este doc vira ponteiro + camada exclusiva. Tipografia → mono única + escala built-in do Tailwind (base 16px). Radius 0, flat, glass achatado. `state-*`/`node-*`/`link-*` remapeados p/ accents do TUI (colisões aceitas; distinção por ícone/traço). Tema light removido; temas `phosphor`/`default` do kit. |
