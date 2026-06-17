# Plano de execução — Item 5: Eixo temporal / TKG / timeline

> Detalhamento e plano das **3 frentes** para resolver o Item 5 do parecer
> (`temp/parecer-recomendacoes.md`). Aterrado no código real do BFF e na fonte
> normativa `remember-modelagem-v7.md`. Escrito para ser executável sem voltar a
> investigar.

---

## 0. Correção do diagnóstico (confirmada no código)

O parecer sugeria que "datar o go-live" poderia exigir mudança de schema. **Não
exige.** O catálogo já tem os AttributeKeys de data, todos **temporais,
funcionais e `requires_valid_from = true`**:

| NodeType | key | value_type | functional? | confirmado em |
|----------|-----|-----------|-------------|---------------|
| `Event` | `event_date` | date | sim (`multi=false`) | `migrations/0001_seed.sql:147` |
| `Event` | `end_date` | date | sim | `migrations/0001_seed.sql:149` |
| `Project` | `deadline` | date | sim | `0001_seed.sql:139` |
| `Project` | `start_date` | date | sim | `0001_seed.sql:141` |
| `Task` | `due_date` | date | sim | `0002_ontology_status_task.sql:72` |
| `Task` | `status` | text (domínio fechado) | sim | `0002_ontology_status_task.sql:68` |

> **Conclusão:** o "go-live veio sem data" foi **lacuna de prompt** (a LLM não
> foi dirigida a propor `event_date` ao criar um `Event`), não falta de modelo.
> Isso é a Frente 2.

---

## 1. Mapa do código relevante

| Arquivo | Papel | Pontos-chave |
|---------|-------|-------------|
| `backend/src/modules/ingestion/service/propose-attribute.service.ts` | Validação 5 camadas do `propose_attribute` | delega a `consolidateAttribute` (L188) |
| `backend/src/modules/ingestion/service/graph-consolidation.service.ts` | Decisão §6.5 (consolida/sucede/corrige/disputa) | `consolidateAttributeOnce` L736; **sucessão** L796-820; `closeVigentForSuccession` L285-305 |
| `backend/src/modules/ingestion/validation/temporal.ts` | Camada 3 (datas) | invariante `valid_from < valid_to`; cadeia `stated→document→received` |
| `backend/src/modules/knowledge-graph/repository/temporal-filter.ts` | **Filtro temporal único** das leituras | consulta (a) L77-86; consulta (b) `as_of` L65-73 |
| `backend/src/modules/knowledge-graph/mcp/query-toolset.ts` | Tools `get_node` (as_of), `get_history_attribute_key` | L289-377 |
| `backend/src/modules/ingestion/prompts/extraction.v1.ts` | Prompt de extração (SYSTEM/USER) | `## Dates` L159-166; exemplo L197-216; `PROMPT_VERSION` L45 |
| `backend/src/modules/ingestion/service/extraction.service.ts` | Orquestrador in-process | **import estático** do prompt v1 L69-74 |
| `backend/src/modules/ingestion/hash.ts` | `idempotency_key` | `sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)` L23 |

---

## 2. Frente 1 — Comprovar o eixo de validade (PRIORIDADE)

### 2.1 Objetivo

Sair do "no papel verde": exercitar a **sucessão de atributo funcional**
ponta-a-ponta de forma **determinística (sem LLM)**, via os `propose_*` reais,
e medir o que o eixo de validade efetivamente devolve em `as_of`. Este é o eixo
que a spec marca como "construído e ativo" (§5, linha 26) mas que **nunca foi
exercitado por um teste de sucessão real** (o E2E que rodou green só cobriu
extração inicial, não mudança no tempo).

### 2.2 O experimento (determinístico)

Cenário concreto — `Task.status` (funcional, domínio fechado, `requires_valid_from`):

```
t1 = 2026-01-01:  propose_attribute(node=T, key="status", value="a fazer",
                    valid_from=2026-01-01, valid_from_basis="stated",
                    change_hint="none")            → outcome "accepted"  (R1)

t2 = 2026-03-01:  propose_attribute(node=T, key="status", value="em andamento",
                    valid_from=2026-03-01, valid_from_basis="stated",
                    change_hint="succession")       → outcome "superseded_previous" (R2)
```

O que o consolidador faz (rastreado em `graph-consolidation.service.ts`):
`functional && !sameValue && change_hint==='succession'` → ramo (c), L796-820 →
`closeVigentForSuccession(R1, closeDate=2026-03-01)`:

```
R1: valid_from=2026-01-01  valid_to=2026-03-01  superseded_at=now()  status='superseded'
R2: valid_from=2026-03-01  valid_to=NULL        superseded_at=NULL    status='active'
    supersedes_attribute_id = R1
```

**Asserções:**
1. `get_node(T)` (visão atual) → `status = "em andamento"`.
2. `get_node(T, as_of=2026-02-01)` → **deveria** devolver `status = "a fazer"`.
3. `get_node(T, as_of=hoje)` → `status = "em andamento"`.
4. `get_history_attribute_key(T, "status")` → 2 versões encadeadas (R2→R1 via `supersedes_*`).

> **Atenção (já validada):** `Task.status` é funcional (`allows_multiple_current
> = false`, `0002_ontology_status_task.sql:68`). Com atributo **multi-valor** o
> ramo (c) nem é alcançado — coexistiria em vez de suceder. Este detalhe é
> exatamente o que torna o teste significativo.

### 2.3 Predição fundamentada (o que o código + spec dizem que vai acontecer)

Aplicando o **filtro da consulta (b)** (`temporal-filter.ts:65-73`):

```sql
AND superseded_at IS NULL
AND (valid_from IS NULL OR valid_from <= $asOf)
AND (valid_to   IS NULL OR valid_to   >  $asOf)
```

| Asserção | Resultado previsto | Por quê |
|----------|-------------------|---------|
| 1 (atual) | ✅ "em andamento" | consulta (a): só R2 (`valid_to IS NULL AND superseded_at IS NULL`) |
| 3 (as_of=hoje) | ✅ "em andamento" | R2 passa em (b); R1 barrado por `superseded_at IS NULL` |
| 4 (history) | ✅ 2 versões | `get_history` mostra linhas `superseded` (spec §5.3 L501-504) |
| **2 (as_of=2026-02-01)** | **❌ VAZIO** | R1 tem `superseded_at` setado → barrado por `superseded_at IS NULL`; R2 tem `valid_from=2026-03-01 > as_of` → barrado. **Nenhuma linha sobra.** |

**A Frente 1 vai ficar 3/4 verde e VERMELHA na asserção 2 — e isso não é bug do
teste. É uma inconsistência real entre 3 pontos da fonte normativa.**

### 2.4 A descoberta — contradição C4 ↔ consulta (b) ↔ C7

A spec se contradiz a si mesma:

- **C4 (Sucessão funcional)** — `remember-modelagem-v7.md:1434-1437` e exemplo
  `:658-663`: a sucessão grava `superseded_at = now()` **e** `status =
  superseded` na linha antiga.
- **Consulta (b)** — `:473-476`: valid-time travel filtra `superseded_at IS
  NULL` — explicitamente "exclui o que foi encerrado por sucessão (6.5-A) ou
  correção (6.5-B)" (`:479-481`).
- **C7 (Point-in-time)** — `:1448-1451`: "Dado C4; Quando consulto `deadline`
  com `as_of = 2026-06-15` (dentro da janela antiga); Então a resposta é
  **15/07/2026** (a versão **antiga**), via consulta (b)."

C7 exige ler de volta, por (b), a versão que C4 marcou `superseded_at` — e (b)
**exclui** linhas com `superseded_at`. **As três afirmações não podem ser
simultaneamente verdadeiras.** O código implementa C4 e (b) fielmente; logo C7
é inalcançável hoje. C7 é um dos cenários de aceitação normativos (C1–C15,
§17 / CLAUDE.md "Testing › Backend") — ou seja, **um critério de aceite que
nunca foi testado e que falha como escrito.**

Raiz conceitual: a sucessão (o **mundo mudou**) está misturando os dois eixos —
fecha no eixo de **validade** (`valid_to`, correto) **e** no eixo de
**transação** (`superseded_at`, indevido). O eixo de transação deveria marcar só
"o sistema deixou de acreditar" (= correção, §6.5-B), não "o fato deixou de
valer no mundo" (= sucessão, §6.5-A). É a própria distinção §5.6
("conflito ≠ mudança ≠ correção") que vaza.

### 2.5 Árvore de decisão pós-experimento

Quando a asserção 2 ficar vermelha (previsto), há duas saídas:

**Opção A — Sucessão só no eixo de validade (RECOMENDADA).**
`closeVigentForSuccession` passa a setar **apenas** `valid_to` na linha antiga e
deixa `superseded_at = NULL` (mantém `supersedes_*` para linhagem).
- Consulta (a) atual: R1 sai (tem `valid_to`), R2 fica → "em andamento" ✓
- Consulta (b) `as_of=2026-02-01`: R1 tem `superseded_at IS NULL` ✓ + janela
  contém a data → devolve "a fazer" ✓ — **C7 passa.**
- Dup-guard `UNIQUE(... ) WHERE valid_to IS NULL AND superseded_at IS NULL`:
  intacto (R1 tem `valid_to`). ✓
- Correção (§6.5-B) **continua** usando `superseded_at` sem tocar `valid_to`
  (C6 preservado) — a distinção dos dois casos fica **mais limpa**, não menos.
- **Custo:** é mudança que **toca a spec** (reescreve §6.5-A, o exemplo de
  `:658-663`, e C4 `:1434-1437`) → exige **aprovação do dono** + provavelmente
  rodar via `/u-improve`. Código: ~1 função (`closeVigentForSuccession`) +
  testes do consolidador. Sem migração de schema (só semântica de escrita).
  Linhas já gravadas com `superseded_at` por sucessão antiga precisariam de
  back-fill **se** houver dados de sucessão em prod (hoje: zero — nenhuma
  sucessão foi exercitada).

**Opção B — Consulta (b) atravessa sucessão.** Fazer (b) incluir linhas
`superseded` por sucessão mas não por correção. **Rejeitada:** a linha sozinha
não distingue os dois (ambos gravam `superseded_at`+`status='superseded'`);
distinguir exigiria caminhar a cadeia `supersedes_*` ou um discriminador — é
justamente a complexidade da **consulta (c)**, deliberadamente **diferida**
(A25). Reintroduzi-la contradiz a decisão arquitetural.

> **Recomendação:** A. É menos código, alinha o comportamento ao C7 que a
> própria spec exige, e reforça §5.6. Apresentar ao dono como emenda à v7 +
> ajuste de 1 função.

### 2.6 Como implementar o teste

Dois caminhos; recomendo o (B) por ser repetível em CI.

- **(A) Estender o harness `temp/e2e/`** com uma variante **sem LLM**: faz
  `POST /api/v1/ingest/raw-information` (cria raw+chunks+LLMRun), depois chama os
  **espelhos REST** `propose_fragment` e `propose_attribute` (2×) com o
  `llm_run_id`, e finalmente `GET /api/v1/nodes/:id?as_of=…`. Rápido de montar
  reutilizando `buildApp` + stub de auth já existentes no harness. Não roda em
  `vitest run` (escreve em DB real).
- **(B) Teste de integração Vitest** em
  `backend/src/__tests__/integration/ingestion/`, contra **branch efêmera Neon**:
  seeda `raw_information`+`raw_chunk`+`llm_run`(running)+`information_fragment`
  via SQL/repos, chama `proposeAttributeService` 2× direto, depois
  `getNodeByIdService({asOf})`. Determinístico, encadeável em CI.
  - **Pré-requisito a confirmar:** se a suíte de integração já roda contra um
    Postgres real (provisionar branch efêmera no setup) ou se hoje é mockada —
    isso decide o esforço de bootstrap.

### 2.7 Critérios de aceite

- Existe um teste de sucessão determinístico, versionado, repetível.
- Asserções 1, 3, 4 verdes.
- Asserção 2 ou (i) verde após a correção da Opção A aprovada+aplicada, **ou**
  (ii) documentada explicitamente como falha conhecida com link para a decisão
  do dono (se ele optar por não corrigir agora). **Não** deixar silenciosamente
  vermelha (Golden Rule 12 — Fail Loud).

### 2.8 Esforço

- Teste (caminho B): ~0,5 dia. Diagnóstico/escrita da descoberta: feito (este doc).
- Correção Opção A (se aprovada): ~0,5 dia código+testes + a emenda de spec.
- **Total Frente 1: ~1 dia** (alinha com a estimativa do parecer).

### 2.9 Resultado empírico (CONFIRMADO 2026-06-16)

A predição da §2.3/§2.4 foi **confirmada contra Postgres real**. Harness
determinístico (sem LLM): `temp/e2e/succession-e2e.mts` — seeda via os
`propose_*` reais e lê pelos endpoints REST, contra uma **branch efêmera Neon**
(`frente1-succession-test`, `br-soft-term-actofu9r`; host swap só do host, sem
expor credenciais). Como rodar:

```bash
cd backend && E2E_CONFIRM=1 \
  FRENTE1_BRANCH_HOST=<ep-...branch-host> LOG_LEVEL=warn \
  npx tsx ../temp/e2e/succession-e2e.mts
```

Evidência (linhas `node_attribute` reais após a sucessão):

```
value='a fazer'      valid=[2026-01-01, 2026-03-01)  superseded_at=SET   status=superseded
value='em andamento' valid=[2026-03-01, ∞)           superseded_at=null  status=active  supersedes=→(a fazer)
```

| Leitura | Resultado | Veredito |
|---------|-----------|----------|
| `GET /nodes/:id` (atual) | `em andamento` | ✅ correto |
| `GET /nodes/:id?as_of=2026-06-16` (após) | `em andamento` | ✅ correto |
| `GET /nodes/:id/attributes/status/history` | 2 versões encadeadas | ✅ correto |
| **`GET /nodes/:id?as_of=2026-02-01` (dentro de [T1,T2))** | **(ausente)** | **❌ C7 violado** |

A escrita está fiel a C4/§6.5-A (fecha validade **e** transação); a leitura
`as_of` está fiel à consulta (b) (`superseded_at IS NULL`). **Justamente por
ambas estarem corretas isoladamente, C7 é inalcançável** — a versão antiga,
verdadeira em 2026-02-01, fica invisível à viagem no tempo de validade. Achado
confirmado, não teórico. → decisão da §2.5 (Opção A) agora é acionável.

### 2.10 STATUS — Opção A APLICADA (2026-06-16, direto)

Aprovada e aplicada direto (sem `/u-improve`). Detalhe revisado em
`temp/diff-frente1-opcaoA.md`. Entregue:
- **Código:** `closeVigentForSuccession` — `superseded_at` agora condicional
  (`CASE`: normal → permanece NULL; intra-day → `now()`). Uma função, cobre link
  e atributo.
- **Testes:** guardas de regressão nos unit tests do consolidador
  (`ELSE superseded_at`, `THEN now()`); harness `succession-e2e.mts` reescrito como
  regressão — cenários **A** (atributo normal → C7 verde), **B** (atributo
  intra-day → eixo de transação) e **C** (sucessão de **link** `reports_to` lida
  por `as_of` → C7 verde no ramo de link) **verdes contra Postgres real**. Suíte
  **676/676** + `tsc` limpo. (Cenário C adicionado 2026-06-16 — fecha a lacuna de
  cobertura e2e de link.)
- **Spec:** Emenda v7.3 aplicada (§6.5-A, exemplo, §5.3 nota, C4, C7 + Apêndice C).
- Achado de teste: nomes com nonce longo compartilhado fundem nós no resolver §4
  (trigram ≥ 0.85) — usar nonce independente por entidade.

**Tudo local, não pushado.** Branch Neon `frente1-succession-test` viva.
**Frente 1 concluída.** Próximo: Frente 2.

---

## 3. Frente 2 — Datar os Events (barato, sem schema)

### 3.1 Objetivo e causa

Fazer a LLM propor `event_date` (e `end_date` quando couber) ao criar um
`Event`. Hoje o prompt (`extraction.v1.ts`) tem a seção `## Dates` (L159-166)
explicando `valid_from` vs valor, mas **o exemplo trabalhado não inclui um Event
datado** e **não há diretiva explícita** "ao criar Event, proponha event_date".
Resultado observado nos testes: go-live extraído como `Event` **sem** data.

### 3.2 A diretiva a adicionar (no SYSTEM block)

Acrescentar uma regra curta e um item ao exemplo. Texto sugerido (a refinar):

```
## Events e datas de evento
- Ao criar um `Event` (reunião, go-live, workshop…), proponha SEMPRE seu
  `event_date` quando o documento indicar a data do acontecimento; use `end_date`
  se houver término distinto. Justifique `valid_from_basis`; NUNCA invente data.
- DISTINÇÃO: `event_date` é o VALOR (quando o evento ocorre). `valid_from` é
  quando essa data passou a valer/ser conhecida (ex.: a data do documento). Se o
  evento for remarcado, é `change_hint:"succession"` sobre `event_date`.
```

> **Nuance importante:** remarcar um evento (go-live adiado) é **exatamente** a
> sucessão de atributo funcional da Frente 1 — `event_date` é funcional. Então
> Frente 2 **depende semanticamente** de a Frente 1 estar correta para que
> "consultar o go-live em as_of=X" devolva a data certa. Por isso a sequência
> 1 → 2.

### 3.3 Bump de `prompt_version` — nuance de arquitetura

`idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥
chunking_version)` (`hash.ts:23`). Mudar o prompt **sem** mudar `prompt_version`
significa que re-ingerir o mesmo documento **dedupa para o run antigo** e
**não** re-extrai com o prompt melhorado — além de "v1" passar a significar dois
prompts diferentes (impureza de auditoria, inaceitável num sistema
rastreabilidade-first).

Mas há um detalhe: o módulo de prompt é **importado estaticamente**
(`extraction.service.ts:69-74` → `../prompts/extraction.v1.js`). **Não existe um
dispatch versão→módulo** — `llm_run.prompt_version` é gravado/auditado mas não
seleciona o módulo. Logo, "bump" tem duas formas:

- **(i) Editar `extraction.v1.ts` in-place, manter "v1".** Barato, mas
  audit-impuro (idempotency_key não muda; re-ingest dedupa; "v1" muda de
  sentido). **Não recomendado.**
- **(ii) Criar `extraction.v2.ts` (`PROMPT_VERSION="v2"`) + dispatch mínimo**
  em `extraction.service.ts` por `llm_run.prompt_version` (fallback v1), e novos
  runs default `prompt_version="v2"`. `idempotency_key` muda → re-ingest gera um
  run **novo e distinto** (audit-correto). **RECOMENDADO** — é o sentido da nota
  do parecer "Bump prompt_version (entra na idempotency_key/auditoria)".

### 3.4 Testes a tocar

- `backend/src/__tests__/unit/ingestion/extraction-prompt.spec.ts` — afirma
  conteúdo do prompt; precisa cobrir a nova diretiva (e o módulo v2, se (ii)).
- Idealmente um caso E2E (ou integração) provando que um doc com data de evento
  produz `Event.event_date`. Reusa o harness `temp/e2e/`.

### 3.5 Escopo e critérios de aceite

- **Escopo:** dev (enriquecimento de prompt + versionamento). Sem schema, sem
  contrato REST/MCP. Vale uma nota na back-spec (`ingestion.back.md`, BR-26).
  Rodável **direto** ou via `/u-improve`.
- **Aceite:** doc com data de evento → `Event` com `event_date` preenchido e
  `valid_from_basis` justificado; nenhuma data inventada; `prompt_version`
  refletido em `llm_run`/`tool_call`.
- **Esforço: ~0,5 dia.**

### 3.6 STATUS — Frente 2 APLICADA (2026-06-16, direto)

Opção (ii) aplicada (v2 + dispatch — não edição in-place). Entregue:
- **`extraction.v2.ts`** = v1 + `EVENT_DATING_DIRECTIVE` (propõe `event_date`/
  `end_date`; distingue o VALOR `event_date` de `valid_from`; remarcação =
  `change_hint:"succession"`). Estende v1 verbatim — sem duplicação.
- **`prompts/index.ts`** = registry `selectPromptModule`: `prompt_version` agora
  **dirige** o prompt (antes era gravado e ignorado — import estático de v1).
  Versão desconhecida → `UnknownPromptVersionError` → run `failed` + 500
  (alinha com BR-26 step 2; fail-loud, sem fallback silencioso). `DEFAULT_PROMPT_
  VERSION='v2'`.
- **`extraction.service.ts`**: seleção do módulo dentro do try run-scoped (flip
  para `failed` em versão inválida) + log `extraction_prompt_selected`.
- **Testes:** `extraction-prompt-v2.spec.ts` (9) — v2 estende v1, contém a
  diretiva, registry dispatch + throw. Suíte **676/676** + `tsc` limpo.
- **Spec:** back-spec `ingestion.back.md` BR-26 step 2 + linha "Anthropic client
  config" reconciliadas (registry + v2). (v7 não precisa de emenda — o prompt é
  realização, não norma.)
- **Harness:** `ingestion-e2e.mts` e `ingestion-e2e-apollo.mts` agora default
  `PROMPT_VERSION="v2"`.

**Verificação com LLM real — RODADA e PASSOU (2026-06-16).** Harness
`temp/e2e/event-dating-e2e.mts` (Anthropic real, prompt v2, branch efêmera via
host-swap). Doc com 3 eventos datados → o modelo criou **os 3** com `event_date`
correto e a distinção valor-vs-`valid_from` honrada: reunião `event_date`=
2026-05-20, workshop=2026-09-15, go-live=2026-11-01 — todos com `valid_from`=
2026-05-20 (basis `document`) e `event_type` certo no domínio fechado. 16
propostas aceitas, run `completed` em ~34s. **Frente 2 verificada ponta-a-ponta.**
(Harness commitável; teve um bug de query — `knowledge_node` não tem
`created_by_run_id` — já corrigido.)

---

## 4. Frente 3 — Timeline narrativa (DECISÃO DE PRODUTO)

### 4.1 O gap

O teste "qual o histórico do bloqueio de troca de celular?" mostrou que o
sistema não tem **timeline narrativa** de primeira classe — ele responde por
proveniência/grafo, não por uma linha do tempo ordenada de eventos de
comunicação/decisão.

### 4.2 Branch SIM (modela a timeline)

- Extrair **Events de comunicação/decisão datados** (`event_date`) ligados ao
  tópico via `concerns` / `part_of` (LinkTypes já no catálogo:
  `0001_seed.sql:100,114,116`).
- O cliente LLM monta a timeline com as ferramentas **existentes**:
  `search` → `traverse` (do Project/Task para os Events) → `get_node(Event)`,
  ordenando por `event_date`. **Sem novo endpoint.**
- **Opcionais (diferíveis, exigem aprovação):**
  - LinkType de ordenação explícita (ex.: `precedes`) via **migração aditiva**
    → Safety Rule de DB (aprovação do dono). O playbook de ontologia já cobre
    o padrão (additivo + restart do BFF).
  - Ferramenta `timeline` dedicada → **toca §14** (catálogo normativo de tools)
    → `/u-improve`.

### 4.3 Branch NÃO (encerra com 1+2)

Documentar formalmente que **cronologia = derivada da proveniência + `event_date`
dos Events** (não há objeto "timeline"), e encerrar o Item 5 com as Frentes 1+2.
Consistente com o espírito "guardar dados, adiar caminho" (A25).

### 4.4 Natureza

É **gate de decisão do dono**, a ser tomado **depois** de Frente 1→2 (a Frente 2
já entrega Events datados, que são o insumo da timeline — então a decisão fica
mais informada após vê-los funcionando). Não força mudança até a decisão.

### 4.5 DECISÃO — NÃO (2026-06-16): cronologia é derivada; timeline diferida

Decidido pelo dono: **NÃO construir** a timeline narrativa agora. Encerra-se o
Item 5 com as Frentes 1+2.

**Argumento decisivo:** SIM-base é **puramente aditivo** — a informação para
reconstruir cronologia já está preservada (`event_date` + `received_at`/
`document_date` da fonte + proveniência), então ligá-la depois é o **mesmo
trabalho** que ligá-la agora (sem migração, sem back-fill). Logo não há penalidade
por adiar e há custo por antecipar (ruído de nós Event de baixo valor,
dependência do julgamento da LLM, critério de curadoria a inventar, e a gravidade
para o SIM-plus que toca DB/§14). É o A25 do próprio sistema ("guardar dados,
adiar caminho") e a Golden Rule 2 (nada especulativo). A Frente 2 já captura os
eventos datados de maior valor (reuniões, go-lives, prazos); o gap residual é só
de micro-eventos puramente comunicativos.

**Contrato de cronologia (vigente):**
> A cronologia no Remember é **derivada**, não um objeto de primeira classe. Não
> existe entidade/endpoint "timeline". A ordem temporal de um assunto é
> reconstruída sob demanda a partir de: (a) `Event.event_date`/`end_date` dos
> Events datados (Frente 2); (b) `valid_from`/`valid_to` de links e atributos
> (eixo de validade, Frente 1); (c) `received_at`/`document_date` da fonte de cada
> fato, alcançáveis pela proveniência (fragmento→chunk→raw). O cliente LLM
> reconstrói a narrativa quando perguntado, ordenando esses sinais — sem caminho
> dedicado no BFF. Coerente com §20 (recuperação léxica+grafo) e A25 (eixo de
> transação/forense diferido).

**Próximo incremento PRÉ-APROVADO (se a necessidade aparecer):** **SIM-base** —
diretiva de extração para criar Events datados de comunicação/decisão ligados ao
tópico (mesma mecânica da Frente 2), e documentar o padrão `search→traverse→
get_node` ordenado por `event_date`. É aditivo e **não exige** migração nem tocar
§14. Só o **SIM-plus** (LinkType `precedes` por migração; tool `timeline` em §14)
exigiria aprovação de DB / `/u-improve`. Gatilho para reabrir: uso recorrente de
"me narre como X evoluiu no tempo" em que a reconstrução ad hoc se mostre
insuficiente.

---

## 5. Sequência, dependências e aprovações

```
Frente 1 ✅ (teste + descoberta → Opção A/Emenda v7.3 aplicada, C7 verde)
        │
        └─► Frente 2 ✅ (prompt v2: Events datados + registry)
                  │
                  └─► Frente 3 ✅ DECIDIDA → NÃO (cronologia derivada; SIM-base diferido)
```

| Etapa | Toca spec? | Toca DB? | Aprovação? | Esforço |
|-------|-----------|----------|-----------|---------|
| F1 — teste | não | escreve (branch efêmera) | não (branch efêmera) | ~0,5 d |
| F1 — correção Opção A | **sim** (§6.5-A, C4, exemplo) | não (semântica de escrita) | **dono + /u-improve** | ~0,5 d |
| F2 — prompt v2 | nota (BR-26) | não | não (dev) | ~0,5 d |
| F3 — SIM (base) | não | não | não | (uso do cliente) |
| F3 — SIM (opcionais) | §14 (tool) | migração (LinkType) | **dono** | maior |
| F3 — NÃO | doc | não | não | ~0,2 d |

> Eixo de **transação** / consulta forense (c) permanece **diferido** (§5.3 /
> A25) — **fora de escopo** deste item.

---

## 6. Restrições permanentes (não violar)

- **Nunca escrever em `neondb` (prod).** Frente 1 escreve só em **branch
  efêmera Neon**.
- **Mudança de DB/schema/seed e mudança de spec exigem aprovação explícita do
  dono** (CLAUDE.md › Safety Rule). A correção da Opção A (F1) e a migração
  opcional (F3-SIM) caem aqui.
- Código do framework (`.claude/**`, `lib/`) é **managed** — não tocar.
- A branch Neon `ingest-test-email-apollo` (`br-long-bird-ac41mwdn`, projeto
  `spring-wind-69847430`) **segue viva** aguardando autorização de exclusão; a
  Frente 1 deve criar a **sua própria** branch efêmera, não reusar prod.

---

## 7. STATUS FINAL — Item 5 CONCLUÍDO (2026-06-16)

| Frente | Resultado | Verificação |
|--------|-----------|-------------|
| **1 — Eixo de validade** | ✅ Bug C7 confirmado + corrigido (Opção A / Emenda v7.3): sucessão fecha só o eixo de validade. | Suíte 676/676 + `tsc`; harness `succession-e2e.mts` (A normal → C7 verde, B intra-day → eixo de transação) vs Postgres real. |
| **2 — Datar Events** | ✅ `extraction.v2.ts` (v1 + diretiva de event_date) + registry `selectPromptModule` (prompt_version agora dirige o prompt; desconhecido → falha). | Suíte 676/676 + `tsc`; `extraction-prompt-v2.spec.ts`. Verificação LLM-real disponível, não rodada. |
| **3 — Timeline narrativa** | ✅ DECIDIDA → **NÃO** (§4.5): cronologia é derivada; SIM-base é o próximo incremento pré-aprovado, aditivo, se a necessidade aparecer. | Decisão de produto; sem código. |

**Fora de escopo (permanece diferido):** eixo de **transação** / consulta
forense (c) — §5.3 / A25.

**Estado do repositório:** tudo **local, não pushado** (`main` à frente de
origin). Branches Neon `frente1-succession-test` e `ingest-test-email-apollo`
**vivas**, aguardando autorização de exclusão.

**Item 5 do parecer encerrado.**
