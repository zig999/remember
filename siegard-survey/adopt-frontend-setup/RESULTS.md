# Adoção do frontend — configuração e consolidação

Início: 2026-10-02T10:00:39-03:00

## Etapa 0 — Pré-condições

T0.1 (saídas verbatim):

```
"version": "5.2.0"
git status --porcelain: (vazio)
specification sound: 92 element(s), 532 rule(s), 10 scenario(s), 6 contract(s), 39 constraint(s) across 2 context(s); 241 decision(s) disclosed, 2 location(s) retired
project.py: targets backend e database; tests backend: under src, suffix .spec.ts, nested; under src, suffix .test.ts, nested
```

T0.2 — classificação de todo arquivo rastreado de `frontend/` que não está em `src/features`:

| caminho | classe |
|---|---|
| `src/**/*.spec.ts`, `*.spec.tsx`, `*.test.ts`, `*.stories.tsx` | teste |
| `src/features/curation/api/__tests__/handlers.ts` | teste (fixture MSW, sem sufixo de teste) |
| `e2e/graph-reveal.e2e.spec.ts` | teste |
| `src/features/{auth,ingest,curation,chat,graph}/` (não-teste) | fonte do contexto homônimo |
| `src/features/{history,search}/` (1 arquivo vazio cada) | outside (contexto shared) |
| `src/lib/`, `src/shell/`, `src/router/`, `src/state/`, `src/components/{ds,ui}/`, `src/styles/` (não-teste) | fonte do contexto shared |
| `src/presentation/*.stories.tsx` | teste (stories) |
| `src/main.tsx`, `src/vite-env.d.ts` | outside |
| `.storybook/**`, `eslint-rules/**`, `docs/**`, `public/**` | outside |
| `.env.example`, `.gitignore`, `eslint.config.js`, `index.html`, `package.json`, `package-lock.json`, `playwright.config.ts`, `postcss.config.js`, `tsconfig.json`, `tsconfig.vendor.json`, `vite.config.ts`, `vitest.config.ts`, `vitest.setup.ts` | outside (configuração) |
| `vendor/ui-kit` (gitlink) | outside (submódulo de outro repositório) |

## Etapa 10 — Consolidação (2026-10-02)

### T10.1 — cobertura (`trace.py --untraced frontend`, verbatim)
```
377 tracked file(s) under frontend: 149 bound, 228 no binding names
  81 holds-nothing: judged by an adoption, which bound none of its candidates to it
  28 outside: kept outside an adoption's judgment
  118 uncertified: in the target's declared test scope, and no certification names it
  1 unsurveyed: no binding and no adoption names it
```
- O único `unsurveyed` é `vendor/ui-kit`, um gitlink (submódulo): `--outside` o recusa ("does not exist"), porque o caminho é lido como arquivo. Fica registrado aqui como fora do escopo (código de outro repositório).
- Os 28 `outside` estão em `siegard-reconcile/adopt-fe-outside.md` (configuração, tooling, `.storybook/`, `eslint-rules/`, `docs/`, `public/`, `src/main.tsx`, `src/vite-env.d.ts`, `.gitkeep` vazios). Para isso um arquivo foi julgado (`src/lib/cn.ts`) porque o staging exige ao menos um arquivo julgado: 1 `unstated` (as escalas de tokens de `cn.ts`).
- Os 118 `uncertified` são os testes declarados: nenhum foi certificado (decisão do plano: certificações none).

### T10.2 — resíduos por contexto (contagem dos retornos dos juízes e dos registros)
| contexto | nós vinculados | contradicts | unstated | restates | unheld |
|---|---|---|---|---|---|
| auth | 22 | 2 | 2 | 13 | 0 |
| ingest | 69 | 2 | 9 | 37 | 0 |
| curation | 219 | 15 | 26 | 106 | 1 |
| chat | 137 | 7 | 4 | 79 | 1 |
| graph | 185 | 6 | 8 | 168 | 4 |
| shared | 111 | 6 | 19 | 94 | 3 |
| outside (cn.ts) | 0 | 0 | 1 | 0 | 1 |
| **total** | **743** | **38** | **69** | **497** | **10** |

`trace.py --check frontend`: 0 orphaned, 0 moved, 2 proof, 0 code. `--owed frontend`: 34 findings que nenhum bind fechou, em 30 arquivos (inclui os de contradicts de nós que ficaram sem vínculo).

Rota de correção de cada classe (a tabela de rotas do Siegard; nada foi executado):
- **restates (497):** rota do comentário — remover a prosa do arquivo e rodar `/reconcile` sobre ele. Concentração: cabeçalhos de arquivo e docstrings.
- **contradicts (38):** código ou nó diz o contrário; é `/analyse` (se o nó está errado) ou `/plan-work` corretivo (se o código está errado) — decisão do dono por item.
- **unstated (69):** fato que o código tem e nenhum nó tem; `/analyse` decide se vira nó ou se é superfície (P1).
- **unheld (10):** nó que nenhum arquivo do conjunto sustenta (alguns existem só em outro contexto ou no backend); `/analyse` revisita.
- **proof (2):** certificação de testes, fora do escopo da adoção.

Contradicts que dependem de decisão do dono (exemplos, não exaustivo): grafias divergentes (`needs_review` × `needs-review` em node-status; assertion-status com `proposed`/`accepted`; effective-status sem `superseded`/`deleted`; `tool_running` × `tool-running`; `entity_match` × `entity-match`); título do painel de falha do nó que sempre diz "Nó não encontrado."; card do overlay do grafo que reativa o ponteiro; comentário de `as-of.ts` que afirma URL como fonte; `tokens.ts` e `ChatBubble.types.ts` que redeclaram vocabulários do catálogo.

Políticas pendentes de aprovação: P1 (texto de interface); duplicação das regras de transporte (30 s, refresh de 401, envelope) entre ingest, curation, chat e shared.

### T10.3 — documentação
`docs/specs/front/` (`front.md`, `features/`, `components/`, `_flows/`, `design-system/`) entra como material de um `/analyse` posterior à adoção, pela primeira rota. Nada dela foi usado como material de survey. Muitos comentários dos arquivos citam essas especificações; a rota do comentário os remove.

### Lições finais
- Teto de 20 delegações simultâneas: lançar juízes em lotes de 20.
- `--outside` aceita uma flag por arquivo; só vale para arquivos que o staging julga em outro conjunto (um arquivo julgado é obrigatório).
- Um juiz que devolve chave fora do contrato é recusado pelo fold e rodado de novo.

## Restates pass (2026-10-05)

- Route: comment route. All prose comments (tool directives kept) removed from 142 frontend files by a deterministic stripper (commits bff7400, 69dfafe); typecheck clean, lint 346 pre-existing errors unchanged, vitest 97 files / 1123 tests passed.
- Reconcile: 136 judges (one per file holding nodes), records `siegard-reconcile/restates-fe-{auth,ingest,curation,chat,graph,shared}.md`, all folded and bound.
- Findings in the new returns: 0 restates, 21 contradicts, 29 unstated (carried to the corrections phase; nothing decided here).
- `trace.py --check`: `code` drift suppressed under the freely-edited target fell from 862 to 26 (22 files); `proof` 1 (backend test, unrelated).
- `--untraced frontend`: 1 unsurveyed (`frontend/vendor`), 81 holds-nothing, 28 outside, 118 uncertified.
- Telemetry: siegard-telemetry/20261005T121440Z.json (136 agents, 386739 output tokens).
- Lesson: removing only the flagged comments does not converge (re-judging flags new ones); removing all prose then reconciling does.
