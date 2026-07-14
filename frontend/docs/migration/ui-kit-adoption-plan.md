# Plano de Migração — Adoção do UI Kit compartilhado (tui) no eternal

> **Status:** draft · **Autor:** planejamento assistido · **Data:** 2026-07-14
> **Objetivo:** ao final, o Storybook do **eternal** compartilha os **mesmos
> componentes e temas** do projeto **tui**. Toda diferenciação/customização
> permanece **exclusiva do eternal**.
> **Distribuição escolhida:** repositórios separados + **git submodule**
> (consumo do código-fonte direto, sem build de biblioteca).

---

## 0. Sumário executivo

- **Compatibilidade de stack:** alta. React 19, Vite 6, Tailwind v4, TS strict,
  Storybook 9 + addon-vitest + vitest 4, Radix, CVA, lucide, sonner, zustand,
  TanStack, xyflow, d3 — praticamente idênticos. **Nenhum bloqueio técnico.**
- **O custo real NÃO é a distribuição** (submodule é barato). É a
  **reconciliação de duas linguagens de design**:
  1. **Tokens** — vocabulários diferentes, com **inversões semânticas perigosas**.
  2. **APIs de componente** — o kit usa APIs simples; o eternal usa compostas.
- **Superfície afetada no eternal:** ~85 arquivos importam o design system atual;
  300+ usos diretos de tokens.

---

## 1. Arquitetura-alvo

```
Repo tui  ──(git submodule)──►  eternal/frontend/vendor/ui-kit
   │  fonte única, versionada por commit-hash
   │
   ├─ src/shared/components/ui/*   ← COMPARTILHADO (25 componentes)
   ├─ src/theme.css                ← COMPARTILHADO (contrato + temas phosphor/default)
   └─ src/shared/lib/cn.ts         ← COMPARTILHADO

eternal/frontend
   ├─ importa componentes + temas do submodule (alias @kit/*)
   ├─ src/components/ds/*          ← EXCLUSIVO (GlassSurface, StateBadge, GraphNode, …)
   ├─ src/styles/theme.eternal.css ← EXCLUSIVO (state-*, node-*, link-*, glass-*, tipografia, motion, z-index)
   └─ src/lib/cn.ts               ← EXCLUSIVO (grupos de token próprios)
```

### Linha divisória (o que compartilha × o que fica exclusivo)

| Compartilhado (vem do kit) | Exclusivo do eternal (fica local) |
|---|---|
| 25 primitivos do kit | `ds/GlassSurface`, `ds/StateBadge`, `ds/GraphNode`, `ds/ChatBubble`, `ds/ConversationMenu` |
| Contrato de tokens semânticos | Tokens de domínio: `state-*` (5), `node-*` (10), `link-*` (13), `glass-*`, `scrim-glass` |
| Temas `phosphor` + `default` (troca via `data-theme`) | Escala tipográfica nomeada (`text-display/heading/body-sm/…`), spacing 4-pt, radius iOS, motion, z-index |
| `cn.ts` do kit (grupo `max-w`) | `cn.ts` do eternal (grupos `rounded-pill`, tipografia, spacing) |

---

## 2. Distribuição — mecânica do submodule

1. **Adicionar o submodule** apontando para o repo tui:
   `git submodule add <url-tui> vendor/ui-kit` (dentro de `eternal/frontend`).
2. **Alias de consumo** (evita colisão com o `@` do eternal, que aponta p/ `src`):
   - `tsconfig.json` → `"paths": { "@kit/*": ["vendor/ui-kit/frontend/src/shared/*"] }`
   - `vite.config` → alias equivalente (o eternal usa `vite-tsconfig-paths`, então
     o `paths` do tsconfig já é lido; confirmar que cobre `@kit`).
3. **Tailwind v4 — escanear o source do submodule** (senão os componentes
   renderizam **sem classes**). O eternal usa `@tailwindcss/postcss`; adicionar no
   CSS de entrada: `@source "../vendor/ui-kit/frontend/src";`
4. **Dependência faltante:** o `date-picker` do kit importa `motion/react`; o
   eternal só tem `framer-motion`. **Adicionar `motion`** ao `package.json` do
   eternal, ou não portar o `date-picker`. Todo o resto o eternal já possui
   (Radix é superconjunto, cva, clsx, tailwind-merge, lucide, sonner, TanStack,
   xyflow, d3).
5. **Atualizar o kit:** `git submodule update --remote` + commit do novo SHA.

### Pré-requisito no repo tui (Frente 1 — portabilizar)

Os 25 componentes do kit importam **uma única coisa** via alias: `@/shared/lib/cn`.
Trocar por **import relativo** (`../../lib/cn`) torna o kit alias-agnóstico e
portável para qualquer consumidor. Replace mecânico, baixo risco, valida com
`tsc -b` + Storybook do tui.

---

## 3. Reconciliação de tokens (a frente PESADA)

O kit define um **contrato semântico fixo** que os componentes referenciam. Para
compartilhar os componentes, o eternal precisa **fornecer esses nomes**. O eternal
importa o `theme.css` do kit (que já traz o contrato + temas phosphor/default) e
mantém seus tokens exclusivos num arquivo próprio sobreposto.

### 3.1 Mapa: contrato do kit → equivalente atual no eternal

| Token do kit (classe) | Papel no kit | Equivalente atual no eternal | Ação | ⚠ |
|---|---|---|---|---|
| `--color-background` (`bg-background`) | fundo do app | `--color-primary` (fundo raiz) | eternal passa a usar `bg-background` | **INVERSÃO** |
| `--color-surface` | superfície base | `--color-surface` | nome coincide | ok |
| `--color-elevated` | painel elevado | `--color-elevated` | nome coincide | ok |
| `--color-foreground` (`text-foreground`) | texto corpo | `--color-content` / `--color-body` | migrar `text-content`→`text-foreground` | |
| `--color-muted` | **fundo** muted | — (eternal não tem fundo muted) | criar/derivar | **INVERSÃO** |
| `--color-muted-foreground` | **texto** dim | `--color-muted` (texto) | migrar `text-muted`→`text-muted-foreground` | **INVERSÃO** |
| `--color-primary` (`bg-primary`) | **ação/CTA** | `--color-action` | migrar `bg-action`→`bg-primary` | **INVERSÃO** (`primary` do eternal = fundo!) |
| `--color-primary-foreground` | texto sobre CTA | `--color-content-inverse` | mapear | |
| `--color-primary-hover/active` | estados CTA | `--color-action-hover/active` | mapear | |
| `--color-accent` | destaque | `--color-accent` (violeta) | nome coincide, valor difere | ok |
| `--color-destructive` | erro | `--color-danger` | migrar `*-danger`→`*-destructive` | |
| `--color-destructive-foreground` | texto sobre erro | `--color-content-inverse` | mapear | |
| `--color-warning` | atenção | `--color-warning` | coincide | ok |
| `--color-info` | info | `--color-data` | mapear | |
| `--color-success` | sucesso | `--color-state-accepted` | mapear | |
| `--color-border` | régua padrão | `--color-border` | coincide, valor difere | ok |
| `--color-border-strong` | régua hover | — (eternal tem `-focus/-error/…`) | derivar | |
| `--color-ring` | anel de foco | `--color-border-focus` | mapear | |

> **As 4 inversões (`background`/`primary`/`muted`/`muted-foreground`) são a maior
> fonte de bug.** Em especial: qualquer uso ATUAL de `bg-primary`/`text-primary`
> no markup do eternal significa **fundo**; após adotar o contrato do kit,
> `primary` vira **verde de ação**. **Auditar e remapear todos os
> `*-primary` do eternal para `*-background` ANTES de importar o tema do kit.**

### 3.2 O que NÃO precisa migrar (fica exclusivo — de-risk importante)

- **Escala tipográfica nomeada** (`text-display/heading/subheading/body-lg/body-sm/
  label/badge/caption/code`) é **font-size**, não cor. Os componentes do kit usam
  `text-sm`/`text-xs`/`text-base` (built-ins do Tailwind, que o eternal **não**
  sobrescreve). Logo, **coexistem** — a escala do eternal permanece exclusiva.
- **Spacing 4-pt** (`p-md`, `gap-lg`…), **radius iOS**, **motion**, **z-index**,
  **glass/scrim**, **state/node/link** → todos exclusivos, ficam em
  `theme.eternal.css`.
- ⚠ **Radius:** o tema phosphor do kit zera o radius (`--radius-*: 0px`). Se o
  eternal adotar o phosphor globalmente, os componentes exclusivos (glass) também
  perdem o arredondamento. Decisão por-tema: aceitar (CRT consistente) ou os
  componentes exclusivos fixarem o próprio radius.

### 3.3 Ordem segura

1. Auditar usos de `*-primary` no markup do eternal → remapear p/ `*-background`.
2. Importar `@kit/theme.css` (contrato + temas) no entry CSS do eternal.
3. Mover tokens exclusivos p/ `theme.eternal.css`, importado **depois** do do kit.
4. Migrar usos diretos de cor: `text-content`→`text-foreground`,
   `text-muted`→`text-muted-foreground`, `bg-action`→`bg-primary`,
   `*-danger`→`*-destructive`, etc. (find-replace auditado, arquivo a arquivo).

---

## 4. Reconciliação de componentes (13 que colidem)

Padrão descoberto: **kit = API simples; eternal = API composta (Radix/shadcn)**.
Para cada componente, escolher uma estratégia:
- **(A) Adotar o do kit** → reescrever call-sites do eternal.
- **(P) Promover o do eternal p/ o kit** → substitui a versão simples do kit; tui
  adapta (enriquece o compartilhado).
- **(E) Manter exclusivo** → não compartilha esse componente.

| Componente | API kit | API eternal | Divergência | Estratégia sugerida |
|---|---|---|---|---|
| **button** | `variant`: primary/secondary/ghost/destructive/outline · `size`: sm/md/lg/icon · `asChild` · `loading` | `variant`: default/secondary/destructive/outline/ghost · mesmas sizes · `loading` (sem `asChild`) | `primary`↔`default`; kit tem `asChild` | **A** — renomear `default`→`primary` nos ~18 call-sites; manter `asChild` |
| **card** | único, `tone`: default/elevated/interactive/data/warning/danger | **composto**: Card+Header/Title/Description/Content/Footer | estrutural | **P** — promover o composto do eternal p/ o kit (padrão shadcn) |
| **checkbox** | `Checkbox` + estados | `Checkbox` | alinhado | **A** |
| **dialog** | exporta Overlay+Portal | sem Overlay/Portal; tem EntranceVariants | sub-exports | **A** com harmonização de sub-exports |
| **input** | `Input` | `Input` | alinhado | **A** |
| **label** | `Label` | `Label` | alinhado | **A** |
| **radio-group** | RadioGroup+Item | RadioGroup+Item | alinhado | **A** |
| **select** | **único** `Select` (`SelectProps`) | **composto** Trigger/Content/Item/Label/Group/Value | estrutural | **P** — promover o composto do eternal |
| **switch** | `Switch` | `Switch` | alinhado | **A** |
| **table** | Table+Body/Head/Header/Row/Cell | +Caption+Footer | eternal mais rico | **P** — promover versão rica |
| **tabs** | Tabs+List/Trigger/Content | idem | alinhado | **A** |
| **textarea** | `Textarea` | `Textarea` | alinhado | **A** |
| **tooltip** | **único** `Tooltip`+Provider | **composto** Tooltip/Trigger/Content/Provider | estrutural | **P** — promover o composto |

> **Regra geral:** onde a API difere só em nomes/props (button, dialog) → **A**.
> Onde difere em ESTRUTURA (card, select, tooltip, table) → **P**: o kit
> compartilhado adota a API mais completa/padrão para que ambos usem — o tui
> adapta suas stories. Assim o eternal não reescreve dezenas de call-sites
> compostos e o kit fica mais robusto.

---

## 5. Componentes ausentes no kit → promover

Genéricos que o eternal tem e o kit não. São shadcn comuns → **promover para o
kit compartilhado** (não deixar exclusivos):

| Componente | Uso no eternal | Ação |
|---|---|---|
| `command` | 1 | Promover ao kit |
| `form` | 2 | Promover ao kit |
| `popover` | 1 | Promover ao kit |
| `badge` | 2 | Promover ao kit |
| `dropdown-menu` | 1 | Promover ao kit |
| `avatar` | 0 | Promover ao kit (ou descartar — sem uso) |

Do kit para o eternal (bônus, já vêm no compartilhado): `alert`, `breadcrumb`,
`date-picker`, `divider`, `empty`, `kbd`, `link`, `multi-combobox`,
`person-picker`, `progress`, `sheet`, `skeleton`.

---

## 6. Componentes `ds/*` — exclusivos do eternal

Ficam locais (identidade/domínio do eternal). Só precisam consumir o **contrato
compartilhado** após a Frente 3:

| Componente | Uso | Observação |
|---|---|---|
| `ds/GlassSurface` | 14 | Glassmorphism — conceitualmente oposto ao CRT. Decisão de design: manter vidro como diferenciação, ou variar por tema |
| `ds/StateBadge` | 14 | Depende de `state-*` (exclusivo) |
| `ds/GraphNode` | 3 | Depende de `node-*`/`link-*` (exclusivo) |
| `ds/ChatBubble` | 1 | Usa `surface-glass-*` |
| `ds/ConversationMenu` | 1 | — |

---

## 7. `cn.ts` — duas camadas (correto)

- Componentes **compartilhados** usam o `cn` do kit (grupo `max-w`).
- Componentes **exclusivos** do eternal usam o `cn` do eternal (grupos
  `rounded-pill`, tipografia nomeada, spacing 4-pt).
- Cada `cn` conhece só os próprios tokens → sem vazamento. Não unificar.

---

## 8. Storybook compartilhado

`eternal/.storybook/main.ts`:

```ts
stories: [
  "../vendor/ui-kit/frontend/src/**/*.stories.tsx", // componentes COMPARTILHADOS
  "../src/**/*.stories.tsx",                          // stories EXCLUSIVAS (ds/*)
]
```

- Copiar do SB do tui o **toolbar `data-theme` + `data-crt`** e o import dos temas
  no `preview`, para as stories compartilhadas renderizarem sob phosphor/default.
- Resultado: um único Storybook do eternal mostrando **os mesmos componentes e
  temas do tui** + as stories exclusivas. Atende ao objetivo.

---

## 9. Plano de execução (fases + sequência)

| Fase | Escopo | Repo | Peso | Risco |
|---|---|---|---|---|
| **F1** | Portabilizar imports do kit (`@/shared/lib/cn`→relativo) | tui | trivial | baixo |
| **F2** | Plugar submodule + alias + `@source` Tailwind + dep `motion` | eternal | baixo | baixo |
| **F3a** | Piloto walking-skeleton: só `button` renderizando via submodule | eternal | baixo | baixo — **prova o pipeline** |
| **F3b** | Reconciliação de tokens (contrato + migração dos 300+ usos + camada exclusiva) | eternal | **ALTO** | **alto** — inversões semânticas |
| **F4** | Reconciliação de componentes (A/P por componente da §4) | tui+eternal | médio-alto | médio |
| **F5** | Promover ausentes (§5) para o kit | tui | médio | baixo |
| **F6** | Storybook compartilhado (glob + toolbar temas) | eternal | baixo | baixo |
| **F7** | QA: a11y, visual nos 4 viewports, regressão dos 85 arquivos | eternal | médio | médio |

**Sequência recomendada:** F1 → F2 → F3a (valida ponta-a-ponta) → F3b (a grande,
incremental) → F4/F5 em paralelo → F6 → F7.

---

## 10. Riscos e decisões em aberto

1. **Inversões semânticas de token** (`primary`/`background`/`muted`) — maior
   fonte de bug silencioso. Mitigar com auditoria de `*-primary` **antes** de
   importar o tema do kit (§3.3).
2. **API simples × composta** (card/select/tooltip/table) — decidir A vs P por
   componente (§4). Recomendação: **P** para os estruturais.
3. **Granularidade do submodule** — submodular o repo tui inteiro (zero extração,
   recomendado p/ começar) vs extrair um repo `ui-kit` dedicado (fronteira mais
   limpa, custo upfront). Decisão adiável.
4. **Radius no tema phosphor** (0px) afeta componentes exclusivos glass (§3.2).
5. **DX do submodule** — atualização manual por SHA; combinar cadência de
   `submodule update --remote`.
6. **GlassSurface × CRT** — vidro é oposto do terminal. Definir se permanece como
   diferenciação sempre-ativa ou condicionada a tema.

---

## 11. Critérios de sucesso

- [ ] Storybook do eternal renderiza os 25+ componentes compartilhados **e** as
      stories exclusivas, num só build.
- [ ] Troca de tema (`data-theme` phosphor/default) funciona nos componentes
      compartilhados dentro do eternal.
- [ ] Os 85 arquivos consumidores continuam compilando (`tsc`) e passando nos
      testes (vitest/addon-vitest).
- [ ] Nenhum token exclusivo do eternal (`state-*`, `node-*`, `glass-*`) vazou
      para o kit compartilhado.
- [ ] `git submodule update --remote` traz mudanças do kit sem quebrar o eternal.
```
