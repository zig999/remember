# standard-group-a — incluir no standard do backend as regras do grupo A

Plugin: siegard 4.21.1 (`$P=~/.claude/plugins/cache/siegard-generator/siegard/4.21.1`).
Fonte das regras: `git show 72ec07e:standards/backend-node-service.yaml`.

## Fase 1 — o standard (sem tocar em código)

### Estado de partida

- `standards/backend-node-service.yaml` no working tree já trazia a adaptação ao eternal, **não
  commitada** (503 linhas; HEAD guarda a cópia do servicedeskn1, 1112 linhas). A Fase 1 editou
  sobre o working tree. O diff *só da Fase 1* está em `phase1-standard.diff` (a base foi
  reconstruída removendo as adições e conferida: 503 linhas).
- Fonte conferida idêntica ao servicedeskn1:

```
$ diff <(git show 72ec07e:standards/backend-node-service.yaml) ~/projects/servicedeskn1/standards/backend-node-service.yaml && echo IDENTICAL
IDENTICAL
```

### Passo 1 — as 23 regras

Os 23 blocos foram copiados byte a byte da fonte por script (split nos `  - id:`), e inseridos
junto às regras irmãs, na ordem da fonte (ARC-02/03 antes de ARC-04; ARC-05 antes de DTO-01;
DTO-02..04, API-01, API-06 antes de API-05; COR-01 antes de COR-03; SEC-02/03 antes de SEC-04;
TYP-02..04, CON-01, MNT-01/02 antes de MNT-03; PRH-01..04 antes de TST-01; TST-04 antes de TST-07;
LAY-04 depois de TST-07). Contagem de regras: 31 → 54.

Mudanças em relação à fonte (todas as demais palavras são as da fonte):

| regra | mudança | por quê |
|---|---|---|
| todas as 23 | `decided_by: tool` + `tool: lint`/`secret-scan` → `decided_by: reading` | nenhum eslint.config.js / secretlint codifica essas regras no eternal ainda |
| ARC-02, ARC-03 | `seen_at: src/factories/order.factory.ts` removido | não há `src/factories/` no eternal |
| API-01 | `seen_at: src/types/pagination.ts` removido | não há `src/types/` no eternal |
| ARC-05, DTO-02 | `seen_at: src/dto/create-order.dto.ts` → `src/modules/compliance-audit/dto/compliance-delete.dto.ts` | DTO real sob `dto/`, com `z.object` + `z.infer` (conferido) |

Nenhum escopo foi alterado — ver "Pontos para você decidir".

### Passos 2–4 — dependências, comandos, pressupostos

- **Dependências**: `eslint`, `typescript-eslint`, `secretlint` acrescentadas.
  - `eslint` e `secretlint`: `why` da fonte; "twenty-three … are decided" → "twenty-one … are to be
    decided … as eslint.config.js encodes them" (o eternal não tem LAY-01/DOM-03, e nada decide
    ainda); `rules` da fonte sem LAY-01 e DOM-03. `secretlint`: "it decides" → "it is to decide".
  - `typescript-eslint`: **não existe na fonte** (o standard do servicedeskn1 não o lista; só o
    `src/package.json` de lá o declara). `why` e `rules` [TYP-02, TYP-03, CON-01] escritos por mim.
  - **Versão**: o schema (`schemas/standard.json`, `$defs.dependency`) tem
    `additionalProperties: false` e diz "No version is stated: a version fixed here would be a
    second home for what the project's lockfile already holds". Não há campo de versão; as versões
    pedidas (^9.0.0, ^8.0.0, ^8.0.0 — as do `servicedeskn1/src/package.json`) ficaram **dentro do
    `why`**. Decisão sua: manter ali ou tirar e deixar só para o critério da tarefa da Fase 2.
  - `typescript` (existente): `rules` volta a `[STK-01, TYP-01, TYP-02, TYP-03, TYP-04]`, como na
    fonte — o `why` já dizia "TYP-01 through TYP-04".
- **Comandos**: `lint` (`npm run lint`, 180s) e `secret-scan` (`npm run secret-scan`, 120s), sem
  `decides`, entre `typecheck` e `test`.
- **Pressupostos**:
  - `eslint.config.js`: `provides` da fonte, "twenty-three" → "twenty-one"; `rules` da fonte sem
    LAY-01/DOM-03.
  - campo `secretlint` do `package.json`: dobrado na entrada `package.json` existente, como a fonte
    faz (um pressuposto só verifica existência de caminho; uma segunda entrada `package.json` não
    acrescentaria verificação). `provides` = o da fonte, com "are decided by" → "are to be decided
    by"; `rules` ganhou as 23.

### Passo 5 — validação

```
$ python3 -B $P/bin/deliver.py --standard standards/backend-node-service.yaml --against backend --specification specification
standard checked: standards/backend-node-service.yaml declares 54 rule(s) — 52 decided by reading, 2 by a tool
  pin sha256:d69c7338c00278bcd1597dd31d11197c98b07294cdf57827f7ca0596d7fdd9bf
  the rules a tool decides run as step(s) typecheck (2 rule(s)); a review reads only the 52 decided by reading
  what a step exits 0 over is the command exiting 0. Whether it is configured to decide the rule(s) resting on it is this registry's to know: nothing here reads a stack, and a step deciding nothing passes exactly like one deciding all of them
  it declares 5 command(s): install = npm ci (600s), typecheck = npm run typecheck (300s), lint = npm run lint (180s), secret-scan = npm run secret-scan (120s), test = npm test (2400s)
    prepares a fresh worktree with nothing, installs with install, proves with test, and the rest run as checks on both sides of the tests
  each delivery phase, composed for bin/run.py — the delivery root, --run <slug> and --cwd stay the caller's, and the captured run is held to exactly these steps:
    setup: --timeout-seconds 600 --step 'install=npm ci'
    build: --timeout-seconds 600 --step 'install=npm ci' --step 'typecheck=npm run typecheck' --step 'lint=npm run lint' --step 'secret-scan=npm run secret-scan'
    suite: --timeout-seconds 2400 --step 'install=npm ci' --step 'typecheck=npm run typecheck' --step 'lint=npm run lint' --step 'secret-scan=npm run secret-scan' --step 'test=npm test'
    a task declaring `produces` runs the setup line where build is named and nothing at the suite — the substrate exemption, stated once here
  against the specification at specification:
    no step decides constraints/llm-toolset-omits-fragment-listing, constraints/retrieval-is-lexical-only, constraints/retrieval-is-read-only, constraints/retrieval-requires-owner-authentication, constraints/retrieval-transports-answer-alike: held by reading alone
  it authorizes 12 direct dependency(ies): fastify, @modelcontextprotocol/sdk, pg, jose, zod, pino, @anthropic-ai/sdk, vitest, typescript, eslint, typescript-eslint, secretlint. What they pull in transitively is nobody's approval and the lockfile's record
  against backend:
  package.json: stands, and STK-01, STK-02, STK-03, STK-04, STK-05, STK-07, STK-08, STK-09, STK-10, STK-11, STK-12, ARC-02, ARC-03, ARC-05, DTO-02, DTO-03, DTO-04, API-01, API-06, COR-01, SEC-02, SEC-03, TYP-01, TYP-02, TYP-03, TYP-04, CON-01, MNT-01, MNT-02, PRH-01, PRH-02, PRH-03, PRH-04, TST-04, LAY-04 can be applied
  tsconfig.json: stands, and STK-01, TYP-01 can be applied
  eslint.config.js: ABSENT — The flat configuration the `lint` step reads its parser and its rule set from. Absent, eslint has not been told how to parse the TypeScript every scope below names, and the step fails on the first type annotation it meets; present but naming no rule, it exits 0 having decided none of the twenty-one below. A `lint` script in the manifest is a step that runs — this is what makes it a step that decides.
      unanswerable while it is: ARC-02, ARC-03, ARC-05, DTO-02, DTO-03, DTO-04, API-01, API-06, COR-01, TYP-02, TYP-03, TYP-04, CON-01, MNT-01, MNT-02, PRH-01, PRH-02, PRH-03, PRH-04, TST-04, LAY-04

1 presupposed artifact(s) absent. Source written now answers to a registry that cannot be applied to it: the rules above go unanswered, and the absence is found once per file in a review instead of once here. The artifact is built by a task that declares it in `produces`, planned through /plan-work — ready below, but for the two roots only the caller knows:

  /plan-work

  Scope: the registry at standards/backend-node-service.yaml presupposes eslint.config.js, absent from backend.
  One cut: the task that produces it, declared in `produces`, covering the rules named above.
  Work root: <the plan this initiative runs under>
  Specification root: <the specification that plan implements against>
  Target source root: backend
  Project standard: standards/backend-node-service.yaml
EXIT=1
```

Registrado: `eslint.config.js` ABSENT; a invocação do `/plan-work` entregue é a acima (Work root e
Specification root ficam para o chamador). **PARADA da Fase 1.**

### Pontos para você decidir (achados ao copiar)

1. **O secret-scan do servicedeskn1 não decide nada**: lá `package.json` tem
   `"secretlint": { "rules": [] }`. SEC-02/SEC-03 eram `tool: secret-scan` sem codificação. Além
   disso, SEC-02 (SQL parametrizado) não é algo que um scanner de segredos decide. Para SEC-03
   virar `tool` seria preciso um preset (ex. `@secretlint/secretlint-rule-preset-recommend`), que
   o standard ainda não autoriza. A Fase 2 (como escopada) não lista SEC-02/03 — elas ficam
   `reading`.
2. **CON-01** exige "database tables snake_case plural" e "routes kebab-case plural". As tabelas do
   eternal são singulares (`raw_information`, `knowledge_node`, …) e as rotas vêm da spec
   (`/api/v1/mcp/ingest`, `/curation`, …). Copiei verbatim; ligar CON-01 como `tool` na Fase 2
   (naming-convention) não pega tabelas/rotas, mas a leitura as reportaria. Recomendo reescrever
   essas duas cláusulas para o que o eternal adota — é mudança de enunciado, por isso não fiz.
3. **Escopos `.controller.ts`** (ARC-02, ARC-05, API-01): o eternal não tem controllers; a camada
   de transporte é `*.routes.ts` / `mcp/*.handler.ts`. Mantive como a adaptação anterior fez em
   ARC-04/API-05 (consistência), mas nesses escopos a regra não alcança nada.
4. **PRH-04** tem escopo `src/migrations` + `.ts`; as migrações do eternal são `.sql` em
   `migrations/`, fora do target. Mantido verbatim — o passo 9h já prevê a pergunta.
5. **Sobreposições herdadas da fonte**: PRH-01 ≈ STK-09 (console); SEC-02 ≈ STK-05 (SQL
   concatenado). Não mexi.
6. **Efeito colateral do commit**: com `lint` e `secret-scan` declarados, a fase *build* de toda
   entrega no backend roda `npm run lint`/`npm run secret-scan`, scripts que ainda não existem —
   qualquer `/implement-task` no backend falha no build até a tarefa da Fase 2 (que declara
   `produces` e roda só o setup) entregar.
7. **Preexistente, não tocado**: DTO-01 `seen_at: src/routes/order.routes.ts` não existe no
   eternal; PER-02 está logo abaixo do comentário do `elsewhere` e tem escopo `persistence/`.

### Rodada 2 — decisões do dono sobre os pontos da parada

Instrução do dono: "1. mantem. De 2 a 7, execute o que for o mais recomendado para o projeto
eternal." Diff desta rodada: `phase1b-decisions.diff`; `phase1-standard.diff` foi regenerado e
cobre a Fase 1 inteira.

| ponto | decisão executada |
|---|---|
| 1 versões | mantidas dentro do `why` (decisão do dono) |
| 2 `typescript-eslint` | mantido como escrito — sem ele o `lint` não lê TypeScript |
| 3 secret-scan | `secretlint` passa a nomear só SEC-03 (`why`: SEC-02 não é de scanner de segredos e fica `reading`); SEC-02 sai de `rules` do pressuposto `package.json`; autorizado `@secretlint/secretlint-rule-preset-recommend` (^8.0.0, conferido: 8.4.0/8.5.0 publicados) para que o `secret-scan` decida algo. SEC-03 **não** está no escopo da Fase 2 como você o escreveu — recomendação: acrescentá-la ao passo 6 (o `secretlint` field com o preset) |
| 4 CON-01 | "database tables snake_case plural and columns snake_case, routes kebab-case plural" → "database tables and columns snake_case, routes kebab-case" (tabelas do eternal são singulares por §3; rotas como `/search`, `/ingest`, `/curation` vêm da spec) |
| 5 escopos de controller | todo `{src, .controller.ts}` → `{src, .routes.ts}` + `{src, .handler.ts}` (ARC-02, ARC-04, ARC-05, DTO-01, API-01, API-05, EDG-02); frase no cabeçalho dizendo que os controllers deste backend são `*.routes.ts` (Fastify) e `*.handler.ts` (MCP). Sobreposições PRH-01≈STK-09 e SEC-02≈STK-05 mantidas: ambas vêm verbatim da fonte e estão na sua lista; quando a Fase 2 ligar PRH-01 como `tool`, o `console` passa a ser decidido pelo lint e STK-09 fica só com o resto |
| 6 build falha até a Fase 2 | nada a mudar no standard; restrição operacional: não rodar `/implement-task` no backend entre o commit da Fase 1 e a entrega da tarefa da Fase 2 (a tarefa declara `produces` e roda só o setup) |
| 7 preexistentes | DTO-01 `seen_at` → `src/modules/query-retrieval/routes/query-retrieval.routes.ts` (faz `SearchQuerySchema.parse(request.query)` na borda); PER-02: comentário do `elsewhere` volta para logo antes de `elsewhere:` (sem a frase sobre `backend-node-stack`, que o cabeçalho não sustenta), `because` perde a frase sobre `constraints/a-case-is-read-whole` (constraint do servicedeskn1), escopo `persistence/` → `{src, .repository.ts, nested}` |

Não tocados (fora dos pontos, anotados): escopos `.middleware.ts` (o eternal tem
`src/middleware/auth.ts`, sem esse sufixo) e `src/clients` (EDG-08) não alcançam nenhum arquivo.

Revalidação:

```
$ python3 -B $P/bin/deliver.py --standard standards/backend-node-service.yaml --against backend --specification specification
standard checked: standards/backend-node-service.yaml declares 54 rule(s) — 52 decided by reading, 2 by a tool
  pin sha256:dfe0499b9c4a51598f6c96324600e1ee75d2bafb83ce55f0988b98700209b81a
  the rules a tool decides run as step(s) typecheck (2 rule(s)); a review reads only the 52 decided by reading
  what a step exits 0 over is the command exiting 0. Whether it is configured to decide the rule(s) resting on it is this registry's to know: nothing here reads a stack, and a step deciding nothing passes exactly like one deciding all of them
  it declares 5 command(s): install = npm ci (600s), typecheck = npm run typecheck (300s), lint = npm run lint (180s), secret-scan = npm run secret-scan (120s), test = npm test (2400s)
    prepares a fresh worktree with nothing, installs with install, proves with test, and the rest run as checks on both sides of the tests
  each delivery phase, composed for bin/run.py — the delivery root, --run <slug> and --cwd stay the caller's, and the captured run is held to exactly these steps:
    setup: --timeout-seconds 600 --step 'install=npm ci'
    build: --timeout-seconds 600 --step 'install=npm ci' --step 'typecheck=npm run typecheck' --step 'lint=npm run lint' --step 'secret-scan=npm run secret-scan'
    suite: --timeout-seconds 2400 --step 'install=npm ci' --step 'typecheck=npm run typecheck' --step 'lint=npm run lint' --step 'secret-scan=npm run secret-scan' --step 'test=npm test'
    a task declaring `produces` runs the setup line where build is named and nothing at the suite — the substrate exemption, stated once here
  against the specification at specification:
    no step decides constraints/llm-toolset-omits-fragment-listing, constraints/retrieval-is-lexical-only, constraints/retrieval-is-read-only, constraints/retrieval-requires-owner-authentication, constraints/retrieval-transports-answer-alike: held by reading alone
  it authorizes 13 direct dependency(ies): fastify, @modelcontextprotocol/sdk, pg, jose, zod, pino, @anthropic-ai/sdk, vitest, typescript, eslint, typescript-eslint, secretlint, @secretlint/secretlint-rule-preset-recommend. What they pull in transitively is nobody's approval and the lockfile's record
  against backend:
  package.json: stands, and STK-01, STK-02, STK-03, STK-04, STK-05, STK-07, STK-08, STK-09, STK-10, STK-11, STK-12, ARC-02, ARC-03, ARC-05, DTO-02, DTO-03, DTO-04, API-01, API-06, COR-01, SEC-03, TYP-01, TYP-02, TYP-03, TYP-04, CON-01, MNT-01, MNT-02, PRH-01, PRH-02, PRH-03, PRH-04, TST-04, LAY-04 can be applied
  tsconfig.json: stands, and STK-01, TYP-01 can be applied
  eslint.config.js: ABSENT — The flat configuration the `lint` step reads its parser and its rule set from. Absent, eslint has not been told how to parse the TypeScript every scope below names, and the step fails on the first type annotation it meets; present but naming no rule, it exits 0 having decided none of the twenty-one below. A `lint` script in the manifest is a step that runs — this is what makes it a step that decides.
      unanswerable while it is: ARC-02, ARC-03, ARC-05, DTO-02, DTO-03, DTO-04, API-01, API-06, COR-01, TYP-02, TYP-03, TYP-04, CON-01, MNT-01, MNT-02, PRH-01, PRH-02, PRH-03, PRH-04, TST-04, LAY-04

1 presupposed artifact(s) absent. Source written now answers to a registry that cannot be applied to it: the rules above go unanswered, and the absence is found once per file in a review instead of once here. The artifact is built by a task that declares it in `produces`, planned through /plan-work — ready below, but for the two roots only the caller knows:

  /plan-work

  Scope: the registry at standards/backend-node-service.yaml presupposes eslint.config.js, absent from backend.
  One cut: the task that produces it, declared in `produces`, covering the rules named above.
  Work root: <the plan this initiative runs under>
  Specification root: <the specification that plan implements against>
  Target source root: backend
  Project standard: standards/backend-node-service.yaml
EXIT=1
```

**PARADA da Fase 1** (rodada 2).
