# Sistema de Segundo Cérebro — Modelagem v7 (Grafo + Full-text, léxico, single-owner autenticado — especificação fechada)

> **O que é este documento.** Especificação completa, autocontida e **fechada para
> desenvolvimento** do "segundo cérebro": um repositório de **conhecimento pessoal** que recebe
> informação não estruturada, preserva o original, extrai conhecimento estruturado com uma LLM,
> organiza esse conhecimento como um **grafo temporal rastreável** e permite consultá-lo por
> **busca textual (full-text) + travessia de grafo**.
>
> **Projeto pessoal, single-owner por especificação** (seção 2.3, A20): um único **dono de
> dados**, sem multiusuário nem autorização por papel. O dono **autentica-se** (Supabase Auth)
> porque a interface gráfica (SPA) acessa o backend pela rede — autenticação é **porta de acesso,
> não modelo de domínio**: não existe entidade `User`, e as trilhas de auditoria têm ator
> **implícito** (seções 2.3, 2.5).
>
> **Plataforma (seção 2):** uma **SPA** (React) e uma **LLM** consomem o mesmo **BFF** (Node.js /
> Fastify / TypeScript) — a SPA por **REST**, a LLM por **ferramentas MCP**; o BFF valida e
> persiste em **PostgreSQL 17 (Supabase Cloud)**, store único.
>
> **Três posturas de custo × benefício, fechadas:**
>
> 1. **Embeddings/busca vetorial são um não-objetivo permanente** (seção 20, A24). A recuperação
>    é **léxica + grafo**, e assim permanece. Não há "fase 2" de embeddings; **não existem colunas
>    vetoriais**. A consequência — sinônimos sem sobreposição léxica não casam automaticamente —
>    é **assumida como permanente**, e a curadoria é a sua válvula (seções 4.5, 7.3, 10, 20).
> 2. **Bitemporal com a metade cara diferida.** O eixo de **validade** (`valid_from`/`valid_to`)
>    é construído e ativo. O eixo de **transação** tem as colunas (`recorded_at`/`superseded_at`)
>    **preservadas** e `superseded_at` é usado de fato (correção 6.5-B, linhagem, versão corrente).
>    Mas a **consulta (c)** — reconstrução forense "o que o sistema sabia no instante T" — é
>    **diferida**: os dados ficam guardados (`recorded_at` é gravado em toda linha), mas o caminho
>    de time-travel **não é construído, testado nem mantido** até haver necessidade real
>    (seções 5.3, A25). Corta custo difuso sem perder informação.
> 3. **Duas filas de curadoria, não quatro.** Existem `entity_match` e `disputed` — as que pagam a
>    conta. `uncertain` e `low_confidence` **não** têm fila dedicada e são **flags de exibição**
>    (sinalizados nos resultados, promovidos por corroboração automática, tratados ad-hoc). Filas
>    dedicadas para eles ficam diferidas até o volume justificar (seções 10, A26).
>
> Onde este documento diz "**diferido**", refere-se a capability cujos **dados são preservados**
> mas cuja implementação espera necessidade real — a consulta (c) e as filas extras. **Nunca**
> se refere a embeddings, que são um não-objetivo permanente.
>
> Não há "ex.:" decisório neste documento: onde havia alternativas, há escolha única registrada.

---

## 1. Objetivo e escopo

Construir um repositório de conhecimento que:

1. **Recebe** informação não estruturada (PDFs, e-mails, atas, artigos, transcrições, chats).
2. **Preserva** o conteúdo original, sem nunca perdê-lo ou sobrescrevê-lo.
3. **Extrai** conhecimento estruturado a partir desse conteúdo, usando uma LLM.
4. **Relaciona** conceitos entre si, formando um grafo de conhecimento.
5. **Mantém histórico temporal** das mudanças: separa "verdade atual" de "histórico de validade".
   (O eixo de transação é gravado, mas a auditoria forense plena é diferida — seção 5.3.)
6. **Permite consultar** por busca textual e por grafo, sempre citando a fonte.

Dois princípios atravessam todo o sistema:

- **Rastreabilidade:** todo fato remonta à fonte original que o sustenta.
- **Confiança explícita:** extração por LLM é probabilística; a incerteza é registrada, nunca
  escondida. Conflito, mudança e **correção** são casos distintos; nada é descartado
  silenciosamente.

A recuperação é **puramente léxica** (full-text + fuzzy de trigramas) **mais grafo**. Não há
busca por significado (sinônimos/paráfrases sem sobreposição de caracteres); isso é um
**não-objetivo permanente** (seção 20), cuja válvula declarada é a curadoria (seção 10).

---

## 2. Arquitetura e plataforma

```
SPA (React)  ──REST──┐
                     ├─▶  BFF (Node.js · Fastify · TypeScript)  ──pg (SQL)──▶  PostgreSQL 17
LLM  ──MCP tools─────┘                                                         (Supabase Cloud)
                     ▲
                     └── JWT validado no middleware (emitido por Supabase Auth)
```

- A **SPA** (React) é a interface do dono para **leitura e curadoria**; consome o BFF por **REST**
  (seção 2.4).
- A **LLM** lê o conteúdo e **sugere** conhecimento estruturado chamando as ferramentas tipadas
  do catálogo da seção 14.
- O **BFF** é a **fronteira única**: nem a SPA nem a LLM tocam o banco. Ele expõe **a mesma
  camada de serviço/validação** por **dois transportes** (REST e MCP):
  - **REST** (documentado por OpenAPI via `@fastify/swagger`) — consumido pela **SPA**;
  - **MCP** — três toolsets `ingest`, `query`, `curation` (catálogo da seção 14) — consumido pela
    **LLM**, em **três rotas distintas**:
    - `POST /api/v1/mcp/ingest` — toolset `ingest` (escrita; **dual MCP+REST**; `llm_run_id` por
      argumento de ferramenta — ver Emenda v7.2);
    - `POST /api/v1/mcp/query` — toolset `query` (**dual MCP+REST**; somente leitura);
    - `POST /api/v1/mcp/curation` — toolset `curation` (**dual MCP+REST**; escrita auditada).

  Os três toolsets `ingest` (seção 14.1), `query` (seção 14.3) e `curation` (seção 14.4) são
  **duais**: expostos tanto como ferramentas MCP quanto como rotas REST — mesma camada de serviço,
  mesma validação (seção 13). REST e MCP são fachadas finas sobre a mesma lógica, **nunca** lógicas
  paralelas. O `ingest` opera sempre dentro de um `LLMRun`; na superfície MCP o `llm_run_id` é
  passado como **argumento de ferramenta** (não mais header ambiente) — ver Emenda v7.2.
- O **BFF** **valida** (estrutura, regras, existência, confiança, proveniência, regras temporais)
  e decide o que persistir.
- O **Banco** **persiste** tudo de forma durável e auditável.

> **Regra inegociável:** nem a LLM nem a SPA **acessam o banco diretamente** — só através do BFF.

### 2.1 Fluxo dividido em duas camadas

- **Camada de ingestão (escrita):** transforma informação bruta em conhecimento estruturado. A
  LLM participa aqui (seção 9 descreve o fluxo ponta-a-ponta), via toolset `ingest` (MCP).
- **Camada de consulta (leitura):** responde perguntas via full-text + grafo (seção 7). É
  consumida por dois clientes: a **SPA** (REST) para leitura/curadoria do dono, e a **LLM**
  quando presente como **orquestradora/redatora** (toolset `query`) — que chama as ferramentas
  determinísticas, recebe resultados + proveniência e compõe a resposta; ela **não** faz a
  recuperação "de cabeça".

### 2.2 Decisões de plataforma (fechadas — detalhes no Apêndice A)

| Aspecto | Decisão |
|---|---|
| Frontend | **SPA React 19 + TypeScript (strict)**, Vite 6; Tailwind v4 (CSS-first via `@theme`) + shadcn/ui (Radix); TanStack Router / Query v5 / Table; Zustand v5; React Hook Form v7 + Zod v4 — consome o BFF por REST (seção 2.4) |
| BFF | **Node.js 20 LTS + TypeScript (strict) + Fastify**; REST documentado por `@fastify/swagger` (SPA) + ferramentas MCP (LLM) sobre **uma** camada de serviço/validação; validação de DTO/env com **Zod v4**; logs **pino** |
| Banco | **PostgreSQL 17 via Supabase Cloud** — store único; nenhum outro serviço de busca/armazenamento; RLS desligado (segurança no BFF) |
| Autenticação | **Supabase Auth** — JWT validado no middleware do BFF; **service key só no BFF** (seção 2.5) |
| Full-text | `tsvector` + índices GIN, duas configurações (seção 7.1) |
| Fuzzy léxico | `pg_trgm` (trigramas) |
| Conteúdo original | **Inline no banco** (`RawInformation.content`); `storage_ref` reservado nulável para externalização futura sem migração |
| Acesso a dados | **Driver `pg` raw, queries parametrizadas** + migrações SQL puras versionadas no repositório |
| Embeddings / vetores | **Fora de escopo — permanente.** Recuperação é léxica + grafo; sem `pgvector`, sem banco vetorial, sem colunas de embedding (seção 20, A24) |

### 2.3 Operação single-owner (projeto pessoal)

O sistema é **single-owner por especificação — um projeto pessoal**. Há **um único dono de
dados**; não existe entidade `User` no domínio de conhecimento:

- Todas as ações de curadoria e de apagamento são, por definição, do **operador-dono**.
- As trilhas de auditoria (`CurationAction`, `ComplianceDeletion`) registram **o quê, quando e
  por quê** — o "quem" é implícito.
- **Não há autorização por papel** (um único dono ⇒ um único papel, implícito).
- **Há autenticação** (seção 2.5): o dono se autentica via Supabase Auth porque a SPA acessa o
  BFF **pela rede**. Autenticação é **porta de acesso**, não modelo de domínio — não acrescenta
  entidade nem coluna de ator.
- Multiusuário futuro, se algum dia existir, é **aditivo**: acrescenta-se entidade de ator e
  coluna de autoria às trilhas existentes, sem alterar a semântica de nada. **Não é objetivo**
  desta especificação.

### 2.4 Frontend (SPA)

Interface do dono para **leitura, navegação do grafo e curadoria** — não participa da ingestão
(isso é da LLM, seção 9). Consome **exclusivamente** o BFF por REST; nunca toca o banco nem usa a
service key.

- **Stack:** React 19 + TypeScript (strict), Vite 6; Tailwind CSS v4 (config CSS-first via
  `@theme`) + shadcn/ui (Radix UI); TanStack Router / Query v5 / Table; Zustand v5 (estado
  cliente); React Hook Form v7 + Zod v4 (forms); Framer Motion, sonner, lucide-react.
- **Dados:** toda chamada ao servidor é um hook em `features/<x>/api/` sobre TanStack Query
  (consome as rotas REST que espelham os toolsets `query`/`curation`). Estado de servidor mora no
  Query; estado de cliente, no Zustand.
- **Testes:** Vitest (unit), Playwright (E2E), MSW (mock de API — intercepta no nível de rede).

### 2.5 Autenticação e fronteira de acesso

Diferente de um transporte puramente local, a SPA acessa o BFF **pela rede** — logo **há
superfície de rede**, fechada por **autenticação**:

- **Supabase Auth** emite o JWT; **todo acesso REST e MCP exige JWT válido**, verificado no
  **middleware do BFF**.
- A **service key** do Supabase vive **somente no BFF** — nunca na SPA, nunca na LLM.
- O **RLS do Postgres está desligado**: a autorização é **centralizada na camada de serviço do
  BFF**, coerente com o modelo single-owner (um único dono, sem papéis).
- Consultas ao banco usam o driver `pg` com **parâmetros** — nunca concatenação de SQL.

---

## 3. Entidades

Convenções: nomes de entidade em PascalCase, campos em snake_case. Tipos temporais conforme
seção 5.1. Todo campo FK tem índice.

### 3.1 Camada de origem (a verdade bruta)

#### RawInformation
A informação original, exatamente como recebida. **Nunca é alterada nem apagada** (exceção
controlada na seção 11).

- `id` (uuid)
- `source_type` — pdf | email | ata | chat | artigo | transcricao | outro
- `content` (text) — conteúdo original inline
- `storage_ref` (text, nulável) — **reservado**; não usado nesta versão
- `content_hash` (sha-256, **UNIQUE**) — base da idempotência (seção 8)
- `received_at` (timestamptz)
- `metadata` (jsonb) — autor, origem, título e, quando existir, **`document_date`** (usada na
  cadeia de justificativa de datas, seção 6.5)

#### RawChunk
Pedaço físico da `RawInformation` (parágrafo(s), página, mensagem). Fatia documentos para a LLM
e ancora a proveniência em um trecho específico.

- `id`, `raw_information_id` (FK), `index`, `text`
- `offset_start`, `offset_end` — posição no `content` original; **0-based, semiaberto
  `[start, end)`, em code points Unicode** (seção 9.2)
- `locator` (jsonb, nulável) — âncora legível para citação: `{ page?, line?, speaker?, ts? }`
  (ex.: página de PDF, locutor de transcrição). Preenchido quando o `source_type` expõe o dado;
  enriquece a proveniência sem alterar offsets
- `chunking_version` (text) — `'v1'` nesta versão (estratégia na seção 9.2)
- `text_search` — tsvector **gerado** com a configuração `pt_unaccent_v1` + índice GIN

> **RawInformation 1:N RawChunk.**

### 3.2 Camada de extração (o que a LLM propôs)

#### InformationFragment
Afirmação **atômica** extraída pela LLM a partir de um ou mais `RawChunk`. É a evidência que
sustenta qualquer link ou atributo aceito. Fragmento é **frase com sentido completo**
("O go-live do Projeto Apollo ocorrerá em 15/07/2026"), nunca uma entidade solta.

- `id`, `llm_run_id` (FK), `text`, `confidence` (0–1)
- `status` — `proposed` | `accepted` | `rejected` | `superseded` | `deleted`
- `text_search` — tsvector **gerado** (`pt_unaccent_v1`) + índice GIN parcial
  `WHERE status = 'accepted'`
- `created_at`

#### FragmentSource *(associação N:N)*
- `fragment_id` (FK), `raw_chunk_id` (FK)

### 3.3 Camada de conhecimento consolidado (o grafo)

#### KnowledgeNode
Conceito consolidado (pessoa, projeto, organização, cargo, evento…).

- `id`, `node_type_id` (FK)
- `canonical_name`
- `status` — `active` | `needs_review` | `merged` | `deleted`
- `merged_into_node_id` (FK → KnowledgeNode, nulável) — **CHECK:** preenchido **sse**
  `status = 'merged'`. Invariante de cadeia curta: sempre aponta para nó **ativo**
  (compressão de caminho na escrita — seção 4.4)
- `created_at`, `updated_at`

> Os antigos campos `aliases` e `name_search` **não existem**; foram normalizados para
> `NodeAlias` (abaixo).

#### NodeAlias
Nomes pelos quais um nó é conhecido — inclusive o canônico, espelhado. Tabela única consultada
pela resolução de entidade e pela busca de nomes (caminho único, indexável e auditável).

- `id`, `node_id` (FK)
- `alias` (text)
- `alias_norm` (text, **gerado**) — `norm(alias)`, onde
  `norm(x) = lower(unaccent(espaços_colapsados(trim(x))))`
- `kind` — `canonical` | `alias`
- `created_by_run_id` (FK → LLMRun, nulável — nulo quando criado por curadoria)
- `created_at`
- **UNIQUE** `(node_id, alias_norm)`
- Índices: GIN **trigram** sobre `alias_norm` (resolução de entidade); tsvector
  `simple_unaccent_v1` (busca de nomes pelo usuário)

#### NodeAttribute
Atributo **temporal** de um nó — onde moram os **valores literais** (datas, números, textos,
booleanos). Mesma maquinaria temporal e de linhagem dos links.

- `id`, `node_id` (FK)
- `attribute_key_id` (FK → AttributeKey) — a chave é **governada por registro** (seção 3.4);
  não existe chave livre
- `value` (text) — serialização canônica do valor
- `value_date` (date, **gerado** quando `value_type = date`) e `value_number` (numeric,
  **gerado** quando `value_type = number`) — permitem índices de faixa ("deadlines de julho")
- **Temporais** (seção 5): `valid_from` (date), `valid_to` (date), `recorded_at` (timestamptz),
  `superseded_at` (timestamptz)
- `status` — enum gravado da seção 6.4
- `confidence` (0–1)
- `valid_from_source` — `stated` | `document` | `received` (seção 6.5)
- `created_by_run_id` (FK → LLMRun)
- `supersedes_attribute_id` (FK → NodeAttribute, nulável) — linhagem explícita
- `created_at`, `updated_at`
- **Guarda de duplicata** (índice único parcial):
  `UNIQUE (node_id, attribute_key_id, value) WHERE valid_to IS NULL AND superseded_at IS NULL`

#### KnowledgeLink
Relação **direcionada** entre dois nós, temporal, com proveniência e linhagem.

- `id`, `source_node_id` (FK), `target_node_id` (FK), `link_type_id` (FK)
- **Temporais**: `valid_from` (date), `valid_to` (date), `recorded_at` (timestamptz),
  `superseded_at` (timestamptz)
- `status` — enum gravado da seção 6.4
- `confidence` (0–1)
- `valid_from_source` — `stated` | `document` | `received`
- `created_by_run_id` (FK → LLMRun)
- `supersedes_link_id` (FK → KnowledgeLink, nulável) — linhagem explícita
- `created_at`, `updated_at`
- **Guarda de duplicata** (índice único parcial):
  `UNIQUE (source_node_id, target_node_id, link_type_id) WHERE valid_to IS NULL AND superseded_at IS NULL`

> **`is_current`, `is_in_effect` e `effective_status` são derivados, nunca armazenados**
> (seção 5.4). Não existe coluna para nenhum dos três.

#### Provenance *(associação)*
Liga cada `KnowledgeLink` **e** cada `NodeAttribute` aos `InformationFragment` que o justificam.
Torna a rastreabilidade executável. **Acumula**: re-afirmações consolidadas adicionam linhas
aqui (seção 6.5, passo de consolidação).

- `id`, `link_id` (FK, nulável), `attribute_id` (FK, nulável), `fragment_id` (FK)
- **CHECK:** exatamente um entre `link_id`/`attribute_id` preenchido
- `created_at`

### 3.4 Camada de schema e regras

#### NodeType
- `id`, `name`, `description`, `version`

#### AttributeKey *(governa as chaves de atributo)*
Registro do vocabulário de atributos. `NodeAttribute` **só** referencia chaves daqui — elimina a
proliferação `deadline`/`prazo`/`go_live_date` e dá às chaves a mesma governança dos links.

- `id`, `node_type_id` (FK) — chave é escopada por tipo de nó
- `key` (text) — **UNIQUE** `(node_type_id, key)`
- `value_type` — `date` | `number` | `text` | `bool`
- `is_temporal` (bool) — chaves estáveis nunca recebem eixo de validade
- `allows_multiple_current` (bool) — funcional (ex.: `deadline`) vs. multi-valor (ex.: `email`)
- `requires_valid_from` (bool)
- `description`, `version`

#### LinkType
Define a semântica e as regras temporais de uma relação.

- `id`, `name`, `label`, `description`, `version`
- `inverse_name` — navegação nos dois sentidos
- `is_temporal` (bool)
- `allows_multiple_current` (bool) — **única fonte de verdade sobre multiplicidade**
- `requires_valid_from` (bool)
- `requires_valid_to_on_change` (bool)

#### LinkTypeRule
Validação **estrutural** do grafo: quais pares de tipos de nó uma relação aceita. Só isso —
multiplicidade mora em `LinkType.allows_multiple_current`; não há regra de precedência a resolver.

- `id`, `link_type_id` (FK), `source_node_type_id` (FK), `target_node_type_id` (FK)
- `valid_from`, `valid_to` — regras são versionadas no tempo (seção 12)

### 3.5 Camada de auditoria

#### LLMRun
- `id`, `model`, `prompt_version`, `started_at`, `finished_at`
- `status` — `running` | `completed` | `failed`
- `attempts` (int, default 1) — retry reabre o mesmo run (seção 8)
- `input_raw_information_id` (FK)
- `idempotency_key` (**UNIQUE**) — composição na seção 8

#### ToolCall
- `id`, `llm_run_id` (FK), `tool_name`, `arguments` (jsonb), `result` (jsonb)
- `validation_outcome` — `accepted` | `consolidated` | `superseded_previous` | `needs_review` |
  `uncertain` | `disputed` | `rejected` | `error`
- `created_at`

#### EntityMatchReview
Contexto para curadoria de matches ambíguos: sem isto, o curador recebe um nó `needs_review`
sem saber **com quem** ele se parece.

- `id`, `node_id` (FK — o nó criado em revisão), `candidate_node_id` (FK), `similarity`
  (numeric), `created_at`
- Linhas são removidas quando a revisão é resolvida (a decisão fica em `CurationAction`)

#### CurationAction
Trilha de auditoria de **toda** ação de curadoria (single-owner: ator implícito).

- `id`, `action` (text — nome da ferramenta de curadoria), `target_kind`, `target_id`,
  `payload` (jsonb), `reason` (text), `created_at`

#### ComplianceDeletion
Auditoria do apagamento controlado (seção 11).

- `id`, `raw_information_id` (FK), `reason` (text), `executed_at`,
  `affected` (jsonb — contagens por entidade afetada)

---

## 4. Resolução de Entidade

**Problema:** garantir que "Projeto Apollo" em dois documentos vire o **mesmo** `KnowledgeNode`.

### 4.1 Normalização

`norm(x) = lower(unaccent(espaços_colapsados(trim(x))))` — a **mesma** função em: chave de
comparação da resolução, `NodeAlias.alias_norm` e configurações de full-text. Uma política de
normalização no sistema inteiro.

### 4.2 Matching de candidatos — **sempre dentro do mesmo `node_type`**

"Apollo" pessoa **jamais** casa "Apollo" projeto. Índices compostos `(node_type_id, alias_norm)`.
Pipeline (estratégia de similaridade **isolada atrás de interface** — ponto de extensão **léxico**):

1. **Igualdade exata** de `alias_norm` (btree) → candidato com score 1.0.
2. **Similaridade trigram** (`pg_trgm`, operador `%`, índice GIN) sobre `NodeAlias.alias_norm`
   → candidatos com score = `similarity()`.

Usa-se **só trigram** como fuzzy (sinal único, um threshold a calibrar). A interface permite
adicionar **sinais léxicos** sem mexer no fluxo de decisão — Levenshtein fica documentado como
segundo sinal possível se nomes curtos (<6 chars, poucos trigramas) gerarem falsos negativos na
prática (A3). **Não há sinal vetorial/semântico** — é não-objetivo permanente (seção 20).

### 4.3 Decisão (thresholds no Apêndice A)

| Resultado | Condição | Ação |
|---|---|---|
| **Match forte** | igualdade exata, **ou** exatamente 1 candidato ≥ **0.85** e nenhum outro ≥ 0.55 | Reaproveita o nó; adiciona `NodeAlias` se o nome for novo |
| **Ambíguo** | qualquer candidato em **[0.55, 0.85)**, ou ≥ 2 candidatos ≥ 0.85 | Cria nó `needs_review` + grava candidatos em `EntityMatchReview` |
| **Sem match** | todos < **0.55** | Cria nó novo `active` |

### 4.4 Merge de nós

Reaponta `KnowledgeLink`/`NodeAttribute` do nó absorvido para o sobrevivente, copia os
`NodeAlias`, marca o absorvido `status = merged` com `merged_into_node_id` preenchido, e —
**compressão de caminho** — reaponta na mesma transação qualquer nó X com
`merged_into_node_id = absorvido` para o sobrevivente. `merged_into_node_id` sempre aponta para
nó ativo; leitura nunca percorre cadeia.

### 4.5 Concorrência

Resolve-ou-cria roda sob `pg_advisory_xact_lock(hash(node_type_id, norm(name)))` — dois runs
simultâneos propondo a mesma entidade nova não criam duplicatas.

> **Limitação assumida e permanente:** fuzzy léxico casa variações de grafia
> ("Apolo"/"Apollo Project") mas **não** casa sinônimos sem sobreposição de caracteres
> ("Projeto Apollo" vs. "Iniciativa Lunar"). Esses casos caem em `needs_review` (fila
> `entity_match`) e **assim permanecem** — sem embeddings (seção 20), a resolução desses casos é
> **trabalho de curadoria** (seção 10), não automação futura.

---

## 5. Modelo Temporal

O coração do modelo: separar **"verdade atual"** de **"histórico de validade"**. Regra principal:
**nada relevante é sobrescrito; o que muda no tempo é encerrado, e uma nova versão passa a valer.**
Vale igualmente para `KnowledgeLink` e `NodeAttribute`.

O eixo de **transação** (`recorded_at`/`superseded_at`) é **gravado em toda linha** e usado para
correção, linhagem e identificação da versão de transação corrente. A **reconstrução forense
plena** sobre esse eixo (consulta (c)) é **diferida** — seção 5.3.

### 5.1 Dois eixos, dois tipos

| Eixo | Campos | Tipo | Significado |
|---|---|---|---|
| **Validade** | `valid_from`, `valid_to` | **`date`** | Quando o fato é/foi verdade **no mundo real**. Fatos deste domínio são diários; timestamp fingiria precisão que as fontes não têm |
| **Transação** | `recorded_at`, `superseded_at` | **`timestamptz` (UTC)** | Quando o **sistema** registrou e quando deixou de considerar a versão corrente |

Fuso de exibição (`America/Sao_Paulo`) é problema **só** da camada de apresentação.

O eixo de **transação é universal** (toda linha o tem). O eixo de **validade** aplica-se a
tipos/chaves com `is_temporal = true`; nos estáveis, `valid_from`/`valid_to` ficam sempre nulos.

**Convenção de nulos no eixo de validade:** `valid_from NULL` = "desde sempre/desconhecido"
(−∞); `valid_to NULL` = "ainda vale" (+∞).

### 5.2 Convenção de intervalo: semiaberto `[início, fim)`

Início **inclusivo**, fim **exclusivo** — nos dois eixos (`[valid_from, valid_to)`,
`[recorded_at, superseded_at)`).

- Sucessão fica **sem sobreposição e sem lacuna**: `antigo.valid_to = novo.valid_from`,
  literalmente.
- É a convenção nativa dos ranges do Postgres (`daterange`, `tstzrange`) — e *exclusion
  constraints* (GiST) sobre `daterange` podem garantir não-sobreposição de períodos no nível do
  banco onde fizer sentido.
- Períodos declarados normalizam consistentemente: "desde março/2026" ⇒ `valid_from =
  2026-03-01`; "até março/2026" ⇒ `valid_to = 2026-04-01` (exclusivo).

### 5.3 Consultas canônicas — (a) e (b) construídas; (c) diferida

As duas consultas **construídas, testadas e mantidas** nesta versão:

```sql
-- (a) Vigente agora (visão atual)
WHERE valid_to IS NULL AND superseded_at IS NULL

-- (b) Estado na data D, na visão ATUAL do mundo (valid-time travel)
WHERE superseded_at IS NULL
  AND (valid_from IS NULL OR valid_from <= D)
  AND (valid_to   IS NULL OR valid_to   >  D)
```

O filtro `superseded_at IS NULL` em (a)/(b) exclui o que foi encerrado no **eixo de transação** —
correção (6.5-B) e o caso intra-day de sucessão. A **sucessão normal (6.5-A)** é encerrada no
**eixo de validade** (`valid_to`) e **permanece visível** à consulta (b) na sua janela `[valid_from,
valid_to)` — é o que torna **C7** satisfatível; a visão atual (a) ainda a exclui (tem `valid_to`).
Correção, portanto, **funciona plenamente** com (a)/(b): a versão errada some da visão atual sem
que o mundo tenha mudado. (Ver Emenda v7.3.)

**Consulta (c) — DIFERIDA (dados preservados, caminho não construído):**

```sql
-- (c) O que o sistema SABIA no instante T sobre a data D (auditoria forense plena)
-- NÃO IMPLEMENTADA nesta versão — ver decisão A25.
WHERE recorded_at <= T
  AND (superseded_at IS NULL OR superseded_at > T)
  AND (valid_from IS NULL OR valid_from <= D)
  AND (valid_to   IS NULL OR valid_to   >  D)
```

- **Por que diferida.** A reconstrução "o que o sistema sabia em T" é auditoria forense de alto
  custo difuso (atravessa toda query/teste/ferramenta) e benefício marginal num projeto pessoal
  single-owner. Não é construída, testada nem mantida agora.
- **Por que os dados ficam.** `recorded_at` é **gravado em toda linha** (custo: um timestamp no
  insert) e nenhuma linha é fisicamente apagada no curso normal. Logo, **nenhuma informação é
  perdida**: a consulta (c) pode ser ativada no futuro **sem migração e sem back-fill** — basta
  escrever a query e a ferramenta. É exatamente o "guardar os dados, adiar o caminho".
- **O que continua visível hoje.** A **linhagem** entre versões (`supersedes_*`) é navegável via
  `get_history` (seção 14.3), que ordena por `recorded_at` e mostra versões `superseded`
  (inclusive correções). Isso dá visibilidade do *encadeamento* de versões — o que falta, e está
  diferido, é só a reconstrução *point-in-time pela ótica do sistema* em um `T` arbitrário.

Exemplo clássico (por que (c) um dia pode valer a pena, e por que `recorded_at` é preservado):
João saiu do projeto em **01/05** (mundo), mas a ata só chegou em **10/05**. Registra-se
`valid_to = 2026-05-01`, `recorded_at = 2026-05-10`. Hoje, a consulta (b) com `D = 2026-05-05`
mostra que João **não** estava mais no projeto naquela data. A pergunta "em 05/05, o que o
sistema *achava* sobre 05/05?" (resposta: ainda achava que João estava) é a que a consulta (c)
responderia — e os dados para respondê-la já estão gravados.

### 5.4 Derivados — nunca armazenados

```sql
is_current        ≡  valid_to IS NULL AND superseded_at IS NULL
is_in_effect      ≡  is_current AND (valid_from IS NULL OR valid_from <= current_date)
effective_status  ≡  CASE WHEN status = 'active'
                          AND valid_to IS NOT NULL AND valid_to <= current_date
                     THEN 'inactive' ELSE status END
```

- `is_current` = "asserção atualmente sustentada" — inclui fatos **futuros** já conhecidos
  ("a próxima reunião é 01/07" é conhecimento atual legítimo).
- `is_in_effect` = sustentada **e** já em vigor. A API de consulta tem flag `in_effect_only`
  para perguntas tipo "quem participa **hoje**".
- `effective_status` deriva `inactive` (encerrado por validade) em leitura — estado dependente
  de relógio **nunca é gravado** (sem job, sem janela de status errado, sem anomalia).

Os três são expostos por **views** (`knowledge_link_resolved`, `node_attribute_resolved`), que
são o caminho padrão de leitura.

### 5.5 Sucessão depende da cardinalidade (`allows_multiple_current`)

- **Funcional** (`false`, ex.: `deadline`, `reports_to`): registrar novo valor/alvo **encerra**
  o anterior (sucessão, seção 6.5).
- **Multi-valor** (`true`, ex.: `participates_in`, `email`): novos vínculos **coexistem**.

### 5.6 Conflito ≠ Mudança ≠ Correção

| Caso | Sinal | Tratamento |
|---|---|---|
| **Mudança** | período posterior | Sucessão (6.5-A): encerra o antigo, cria o novo, liga por linhagem |
| **Conflito** | mesmo período, valores divergentes, **sem** sinal de correção | Ambos `disputed`; `confidence` + qualidade da data (`valid_from_source`) + fonte ajudam a curadoria. Nada descartado |
| **Correção** | sinal **explícito** (errata na fonte ou ação de curador) | Supersessão **só no eixo de transação** (6.5-B): o mundo nunca mudou, nós que registramos errado |

A correção usa `superseded_at` (eixo de transação) **sem** tocar `valid_to` — exatamente o uso do
eixo de transação que esta versão constrói, independente da consulta (c) diferida.

---

## 6. Ciclo de vida, status e linhagem

### 6.1 Literal vs. entidade — a regra de modelagem

- **Valor escalar/literal** (data, número, texto livre, booleano) → **`NodeAttribute`
  temporal**. Não vira nó. Ex.: Projeto Apollo tem atributo `deadline = 2026-07-15`.
- **Entidade referenciável** (algo que se aponta de vários lugares ou vem de vocabulário
  controlado — pessoa, cargo, categoria, evento) → **nó + `KnowledgeLink` temporal**.

> **Critério prático:** *"Vou querer ligar outras coisas a este valor, ou navegá-lo no grafo?"*
> Sim → nó + link. Não → atributo.
>
> **Por que não "tudo é link":** nó para cada data/número gera explosão de nós e "resolução de
> entidade" sem sentido para literais. A história é preservada igualmente bem em
> `NodeAttribute`, temporal por construção.

Eventos são o caso de fronteira resolvido pelo critério: uma **reunião** à qual se ligam
participantes e projeto é nó (`Event`) com a **data como atributo** (`event_date`) — nunca a
data como nó.

### 6.2 Quando algo é temporal

`LinkType.is_temporal` / `AttributeKey.is_temporal` declaram o ciclo de vida:

- **Temporais:** `participates_in`, `reports_to`, `deadline`, `status_text`…
- **Estáveis:** `belongs_to_category`, `related_to`, `birth_date`, `cnpj`… Não carregam eixo de
  validade (sempre nulo) — mas carregam eixo de **transação** e podem ser **corrigidos**
  (6.5-B): um typo em `cnpj` é corrigível sem fingir que o CNPJ "mudou no mundo".

### 6.3 Linhagem entre versões (`supersedes_*`)

`superseded_at` responde **quando** a versão deixou de valer; o ponteiro responde **qual**
versão a substituiu: `KnowledgeLink.supersedes_link_id`, `NodeAttribute.supersedes_attribute_id`.
A cadeia completa (`deadline 30/06 → 15/07 → 01/08`) é reconstruível navegando os ponteiros
(ferramenta `get_history`, seção 14).

### 6.4 Status — enum **gravado** (links e atributos)

| Status | Significado |
|---|---|
| `active` | Vigente e aceito |
| `uncertain` | Aceito provisoriamente (confiança 0.40–0.74); aguarda corroboração. **Sinalizado por flag**, não tem fila dedicada (seção 10) |
| `disputed` | Em conflito com outra versão no mesmo período. Tem fila de curadoria |
| `superseded` | Substituído por versão posterior (ver `supersedes_*`) |
| `deleted` | Removido por curadoria ou apagamento controlado (seção 11), auditado |

> `inactive` **não é gravado** — é o `effective_status` derivado de `active` + `valid_to` no
> passado (seção 5.4). Status gravado registra **eventos**; vigência temporal é derivada.

### 6.5 Regras de escrita no grafo (transacionais)

**Unicidade em dois níveis** — a base de tudo:

| Guarda | Escopo | Vale para | Enforcement |
|---|---|---|---|
| **Duplicata** | 1 vigente por `(source, target, link_type)` / `(node, key, value)` | **Todos** os tipos | Índice único parcial (seção 3.3) |
| **Sucessão funcional** | 1 vigente por `(source, link_type)` / `(node, key)` | Só `allows_multiple_current = false` | Transação do backend com `SELECT … FOR UPDATE` |

**Fluxo de escrita** quando a LLM propõe link/atributo (após validações da seção 13):

0. **Lock** da(s) versão(ões) vigente(s) equivalente(s) (`FOR UPDATE` — serializa sucessões
   concorrentes).
1. **Mesmo alvo/valor já vigente?** → **Consolidação**: nenhuma linha nova; **acumula
   `Provenance`** no item existente e aplica a regra de corroboração (abaixo). Re-afirmar nunca
   duplica.
2. **Tipo funcional com alvo/valor diferente?** → decide entre os fluxos A, B, C:

**A — Sucessão (mudança no mundo):**
1. Encerra o antigo **no eixo de validade**: `valid_to = data_da_mudança`,
   `status = superseded`. **`superseded_at` permanece NULL** — a versão antiga
   continua válida (e visível à consulta (b)) na janela `[valid_from, valid_to)`;
   ela só deixou de valer no MUNDO, não deixou de ser a crença do sistema sobre o
   passado. EXCEÇÃO (granularidade de dia, seção 5.1): se `valid_from ≥
   data_da_mudança` (sucessão no mesmo dia), `valid_to` colapsaria o intervalo —
   então encerra-se no eixo de TRANSAÇÃO (`superseded_at = now()`, `valid_to`
   intocado), como na correção. (Ver Emenda v7.3.)
2. Cria o novo: `valid_from = data_da_mudança`, status pela faixa de confiança.
3. Linhagem: `novo.supersedes_* = antigo.id`.
4. Proveniência do novo (fragmento real).

**B — Correção (registramos errado; exige sinal explícito — errata ou curadoria):**
1. Encerra o antigo **só no eixo de transação**: `superseded_at = now()`,
   `status = superseded`, **`valid_to` intocado**.
2. Cria o novo com o **período de validade corrigido** (pode ser idêntico ao do antigo).
3. Linhagem + proveniência normais.
4. Sem sinal explícito, ambiguidade **nunca** vira correção — cai no fluxo C.

**C — Conflito (mesmo período, valores divergentes, sem sinal):**
1. Nenhum é encerrado; ambos recebem `status = disputed`.
2. Item novo é criado já `disputed`; fila de curadoria `disputed` (seção 10).

Para tipos **multi-valor**, só existem consolidação (passo 1) e criação coexistente — sucessão
não se aplica; encerramentos vêm por validade (`valid_to`) declarada nas fontes.

**Datas — cadeia de justificativa** (a LLM **nunca inventa** `valid_from`):

1. **`stated`** — data declarada no texto para o fato ("a partir de 01/07"), exige fragmento;
2. **`document`** — `metadata.document_date` da fonte;
3. **`received`** — `received_at` da fonte.

O nível usado fica gravado em `valid_from_source` — na curadoria de conflito, `stated` vence
`received` como qualidade de evidência. `valid_from` sem justificativa em nenhum nível ⇒
proposta **rejeitada**. Período sem dia normaliza para o primeiro dia (seção 5.2); precisão não
é rastreada nesta versão (limitação documentada; coluna futura aditiva).

**Corroboração:** a mesma asserção vinda de `RawInformation` **independente** promove
`uncertain → active` **automaticamente**; proveniência acumulada; confiança exibida = máx. das
fontes. (Esta promoção automática é o principal caminho de saída de `uncertain` — já que
`uncertain` não tem fila proativa; seção 10.)

**Exemplo (atributo funcional — deadline), correto sob a convenção 5.2:**

```
NodeAttribute (antigo): node=Apollo  key=deadline  value=2026-06-30
  valid_from=2026-01-10  valid_to=2026-06-10  superseded_at=null              status=superseded
  (Emenda v7.3 — sucessão encerra só o eixo de validade; superseded_at fica NULL)
NodeAttribute (novo):   node=Apollo  key=deadline  value=2026-07-15
  valid_from=2026-06-10  valid_to=null         superseded_at=null              status=active
  supersedes_attribute_id=<antigo>  valid_from_source=document
```

**Exemplo (link multi-valor — participação):**

```
KnowledgeLink: João  --participates_in--> Apollo  valid_from=2026-01-10  valid_to=2026-05-30
               status=active   (effective_status na view: inactive — encerrado por validade)
KnowledgeLink: Maria --participates_in--> Apollo  valid_from=2026-06-01  valid_to=null
               status=active
```

(Coexistiram; João saiu por validade, não por sucessão — nenhum encerrou o outro.)

### 6.6 Máquinas de estado

**InformationFragment** (`proposed` inicial):

| De | Evento | Para |
|---|---|---|
| proposed | citado por consolidação aceita (`Provenance` criada) | accepted |
| proposed | curadoria rejeita / retry de run descarta proposta órfã | rejected |
| proposed | confiança < 0.40 e nunca citado | permanece proposed (**flag `low_confidence`; sem fila**) |
| accepted | re-extração o substitui | superseded |
| qualquer | apagamento controlado (seção 11) | deleted |

**KnowledgeLink / NodeAttribute** (criação → `active` se confiança ≥ 0.75; `uncertain` se
0.40–0.74; < 0.40 **não cria** — fragmento fica `proposed`, sinalizado `low_confidence`):

| De | Evento | Para |
|---|---|---|
| active | sucessão (6.5-A) ou correção (6.5-B) | superseded |
| active | conflito detectado (6.5-C) | disputed |
| active | curadoria rejeita / apagamento controlado | deleted |
| uncertain | corroboração (automática) ou `confirm_item` (ad-hoc) | active |
| uncertain | sucessão / conflito / rejeição | superseded / disputed / deleted |
| disputed | curadoria: `prefer_one` (vencedor) | active |
| disputed | curadoria: `prefer_one` (perdedor) | deleted |
| disputed | curadoria: `adjust_periods` | active (períodos ajustados; vira mudança) |
| disputed | curadoria: `keep_disputed` | disputed |

**KnowledgeNode** (criação → `active` ou `needs_review`, seção 4.3):

| De | Evento | Para |
|---|---|---|
| needs_review | curadoria: `keep_separate` | active |
| needs_review | curadoria: `merge_into` | merged |
| active | merge posterior (absorvido) | merged |
| qualquer | apagamento controlado | deleted |

**LLMRun:** `running → completed | failed`; `failed → running` (retry, `attempts + 1`).

---

## 7. Camada de Consulta / Retrieval

### 7.1 Configurações de full-text (duas — prosa e nomes têm necessidades opostas)

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- prosa (chunks, fragmentos): stemming pt + sem acento
CREATE TEXT SEARCH CONFIGURATION pt_unaccent_v1 (COPY = portuguese);
ALTER TEXT SEARCH CONFIGURATION pt_unaccent_v1
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, portuguese_stem;

-- nomes de entidade: sem stemming ("Silva" não é flexão de "silvar"), só unaccent
CREATE TEXT SEARCH CONFIGURATION simple_unaccent_v1 (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION simple_unaccent_v1
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
```

As configurações são **nomeadas e versionadas** (`_v1`) e referenciadas num ponto único do
código — trocar (ex.: plugar dicionário de sinônimos no futuro — A4) = nova config + reindex,
zero mudança de schema. **Sinônimos por dicionário** é a única porta de "casar significado"
prevista, e está **fora de escopo** nesta versão (A4); não há, e não haverá, embeddings (seção 20).

### 7.2 Pipeline determinístico de recuperação

```
1. ENTRADA — full-text em paralelo nos 3 índices
   parse da consulta: websearch_to_tsquery
   • fragmentos (status=accepted)  → score = ts_rank_cd × 1.0
   • nós (NodeAlias)               → score = ts_rank_cd × 0.9
   • chunks                        → score = ts_rank_cd × 0.6

2. DEDUP — chunk que sustenta fragmento já retornado colapsa nele
   (fragmento na frente, chunk vira citação)

3. EXPANSÃO — dos nós atingidos, travessia de KnowledgeLink
   com filtro temporal (consulta (a) por padrão; (b) se as_of=D)
   profundidade default 1, máx 3; score × 0.5 por salto
   navegação nos dois sentidos via inverse_name

4. PROVENIÊNCIA — todo item carrega a cadeia
   Provenance → InformationFragment → FragmentSource → RawChunk → RawInformation

5. RESPOSTA — lista única ranqueada, paginada (default 20)
```

Pesos de camada (1.0 / 0.9 / 0.6), decaimento por salto (0.5), profundidades (1/3) e página (20)
são **constantes nomeadas** (Apêndice A) — calibráveis sem mudar o algoritmo.

### 7.3 Parâmetros temporais e de confiança

**Toda** ferramenta de consulta aceita:

- `as_of` (date, opcional) — aplica a consulta (b) — **valid-time travel**; default = visão atual
  (a). (Não há parâmetro de "system-time travel" — consulta (c) é diferida, seção 5.3.)
- `in_effect_only` (bool, default false) — exige `is_in_effect` (seção 5.4);
- `include_uncertain` (bool, default true — itens `uncertain` vêm **sinalizados** com flag);
  `disputed` vem sempre sinalizado; `deleted`/`superseded` só via `get_history`.

As **flags** `uncertain` e `low_confidence` nos resultados são o mecanismo de exibição que
substitui as filas dedicadas desses dois casos (seção 10): o item aparece sinalizado quando é
relevante para a busca, e pode ser tratado ad-hoc — não há fila a "zerar".

> **Recuperação por significado livre (sinônimos/paráfrases) NÃO está disponível — e não estará
> (não-objetivo permanente, seção 20).** Buscar "Iniciativa Lunar" não encontra "Projeto Apollo":
> comportamento **esperado e testado** (cenário C11), não bug. A válvula da limitação é a
> curadoria (seção 10).

---

## 8. Idempotência e Reprocessamento

- **Ingestão idempotente:** `RawInformation.content_hash` (UNIQUE) — mesma entrada duas vezes é
  no-op que retorna o registro existente.
- **Run idempotente:**

  ```
  idempotency_key = sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)
  ```

  Mesma chave ⇒ segunda tentativa retorna o run existente (no-op).
- **Reprocessamento intencional** = bump de `prompt_version` (ou modelo/chunking) ⇒ chave nova
  ⇒ novo `LLMRun`. A resolução de entidade (seção 4) e as guardas de unicidade (seção 6.5)
  **fundem** o resultado com o existente: re-afirmações consolidam proveniência, não duplicam.
- **Retry de run falho:** reabre o **mesmo** registro (`failed → running`, `attempts + 1`).
  Fragmentos `proposed` **não consolidados** da tentativa anterior são marcados `rejected`
  (motivo: retry); conhecimento já consolidado permanece (re-propostas caem na consolidação
  idempotente). Nunca existe run duplicado com a mesma chave.

---

## 9. Fluxo de ingestão ponta-a-ponta

### 9.1 Passos

```
1. receive(source_type, content, metadata)
   → content_hash; já existe? → retorna existente (no-op)
2. persiste RawInformation                       [transação 1]
3. chunking determinístico v1 → RawChunks        [mesma transação]
4. cria LLMRun (idempotency_key; existente não-falho? → retorna)
5. loop de extração: para cada chunk, sessão LLM com toolset `ingest`
   • prompt recebe o chunk + cauda (~200 chars) do chunk anterior
     como contexto de leitura (não persistido)
   • cada chamada de ferramenta → validações (seção 13) → persistência
   • toda chamada registrada em ToolCall com validation_outcome
6. fechamento: status = completed + sumário (aceitos, consolidados,
   precisam-revisão, disputados, rejeitados)
```

### 9.2 Estratégia de chunking `v1`

Processo **determinístico, sem LLM** (mesmo `content` + mesmo `chunking_version` ⇒ chunks
idênticos — base da idempotência, seção 8). Roda no backend, **antes** do run. Cinco estágios:

```
content bruto → [1] extrair texto → [2] normalizar → [3] segmentar em BLOCOS
              → [4] empacotar em CHUNKS → [5] persistir com offsets + locator
```

**[1] Extração de texto + fronteiras estruturais por `source_type`.** O documento vira texto
linear com fronteiras marcadas:

| `source_type` | Fronteira **dura** (sempre fecha chunk) | Bloco atômico (unidade fina) |
|---|---|---|
| `ata`, `artigo`, `txt`, `outro` | — | parágrafo (linha em branco) |
| `pdf` | **página** | parágrafo dentro da página |
| `email` | cabeçalho ↔ corpo; cada nível de citação (`>`) | parágrafo; assinatura é bloco |
| `chat`, `transcricao` | — | **mensagem/turno de fala** (autor + texto); não se funde fala de locutores diferentes num bloco |

A fronteira dura garante citação honesta ("página 7", não "este PDF") e alimenta o `locator`.

**[2] Normalização.** Colapsa espaços/quebras redundantes preservando um mapa para os offsets
do `content` **original**, que é imutável (seção 11). O texto bruto nunca é alterado.

**[3] Segmentação em blocos.** O **bloco é atômico** — nunca é partido, exceto o caso oversize
do passo 4. Parágrafo, mensagem, célula de tabela, bloco de código = um bloco.

**[4] Empacotamento (greedy, janela-alvo).** Constantes em A22:

```
CHUNK_TARGET   = 1500–2000 chars   (alvo — fecha aqui)
CHUNK_HARD_MAX = 4000 chars        (nunca ultrapassa)
READING_TAIL   = 200 chars         (contexto de leitura, §9.3 — não persistido)
```

```
cur = []; curLen = 0; out = []
for b in blocos:
  if b.fronteiraDuraAntes and cur ≠ []:           # página/seção nova
      out.push(flush(cur)); cur = []; curLen = 0
  if len(b) > CHUNK_HARD_MAX:                      # bloco gigante (log colado, parágrafo monstro)
      if cur ≠ []: out.push(flush(cur)); cur = []; curLen = 0
      for piece in sentenceSplit(b): out.push(flush([piece]))   # fallback: corta em frases
      continue
  if curLen + len(b) > CHUNK_HARD_MAX:             # estouraria → fecha antes
      out.push(flush(cur)); cur = [b]; curLen = len(b)
  else:
      cur.push(b); curLen += len(b)
      if curLen >= CHUNK_TARGET: out.push(flush(cur)); cur = []; curLen = 0
if cur ≠ []: out.push(flush(cur))
```

- `sentenceSplit` (só no oversize): `Intl.Segmenter('pt', {granularity:'sentence'})` — sem
  dependência externa, trata abreviações pt-BR via ICU. **Nunca** parte bloco de código/tabela:
  esses ficam como chunk único mesmo > HARD_MAX (partir destruiria a estrutura).
- **Sem overlap.** Overlap só mitigaria perda de fronteira de *embeddings* — que **não existem
  neste sistema e não existirão** (seção 20). Aqui só atrapalharia a proveniência (mesma frase em
  dois chunks = âncora ambígua) e o FTS (Postgres busca todos os chunks). Contexto de vizinhança
  vai no prompt (§9.3), não no banco.

**[5] Persistência.** Cada chunk → linha `RawChunk` com `index` (0..N), `text`,
`offset_start`/`offset_end` e `locator`.

> **Convenção de offset:** **0-based, semiaberto `[start, end)`, em code points Unicode** (não
> bytes, não unidades UTF-16) — casa com a convenção de intervalos da §5.2 e evita bugs de
> surrogate-pair. O splitter e o extrator de excerpt (`get_provenance`, §14.3) **usam a mesma
> indexação por code point** (em JS, iterar com `[...str]`, não `str[i]`).

Documento pequeno (a ata Apollo, < 2000 chars) degenera para **1 chunk** — o chunking custa zero
quando o doc é pequeno; só "aparece" quando o doc é grande, que é justamente quando é necessário.
Re-chunk futuro = bump de `chunking_version` + novo run (seção 8).

### 9.3 Protocolo de extração de fragmentos

A extração (passo 5 da §9.1) roda **por chunk**. A robustez vem da validação (seção 13): a LLM
propõe livremente, o backend aceita/recusa, e o resultado de cada chamada volta para a LLM se
autocorrigir.

**Contexto montado por chunk:**

```
SYSTEM:  contrato de extração + regra literal-vs-entidade (§6.1)
         + semântica de confiança (§6.4) + cadeia de datas (§6.5)
         + CATÁLOGO SEED (§15: 8 NodeTypes, 10 LinkTypes, 10 AttributeKeys)
USER:    metadata do doc { source_type, title, document_date }   ← habilita basis="document"
         chunk atual:    { chunk_id, index, text }
         contexto:       { prev_chunk_id, prev_tail (≤ READING_TAIL) }   ← lookback de 1 chunk
```

Injetar o catálogo seed no system prompt faz a LLM propor **tipos válidos desde a primeira
tentativa** (minimiza `UNKNOWN_TYPE`) e resolve a maior parte da decisão literal-vs-entidade: se
casa um `AttributeKey` → atributo; se casa um `NodeType` → nó + link.

**Protocolo ordenado** (o prompt orienta a ordem; o backend a **força** via validação — chamada
fora de ordem retorna `NOT_FOUND` e a LLM corrige):

```
1. propose_fragment ×N   → cada afirmação atômica do chunk → fragment_id
2. propose_node ×M       → toda entidade mencionada → backend RESOLVE (§4) → node_id
3. propose_link / propose_attribute ×K  → referencia fragment_ids e node_ids dos passos 1–2
```

Cada chamada é validada na hora (§13) e gravada como `ToolCall` com `validation_outcome` — a
recusa é **resultado, não exceção**: a LLM vê o erro e ajusta a próxima chamada (ciclo fechado
"LLM sugere, backend valida").

**Quatro sub-regras:**

- **(a) Atomicidade.** Uma proposição sujeito-predicado-objeto = um fragmento. Frase composta
  ("João e Maria participam do Apollo") gera **vários**, cada um citando o mesmo chunk via
  `FragmentSource` — mantém a `Provenance` precisa.
- **(b) Literal vs. entidade (§6.1).** Decidida pelo catálogo: escalar que casa `AttributeKey`
  → `propose_attribute`; entidade que casa `NodeType` → `propose_node` + `propose_link`. Data
  **nunca** vira nó.
- **(c) Datas (§6.5 / A14).** `valid_from_basis = stated` só se a data está no texto para aquele
  fato (e cita o fragmento que a contém); `document` usa `metadata.document_date`; o backend
  preenche `received` por último. **Data sem justificativa → rejeitada** (§13.3); a LLM não
  inventa datas.
- **(d) `change_hint` (§6.5).** `succession`/`correction` só com pista textual explícita
  ("adiado para…", "corrigindo: era…"); default `none`. É **consultivo** — o backend ainda busca
  a versão vigente e decide o fluxo real (A/B/C); correção exige errata explícita.

**Identidade de entidade entre chunks — está no resolver, não na memória da LLM.** João aparece
nos chunks 1 e 5; em cada um a LLM chama `propose_node("Person","João Silva")` do zero. No chunk
1 o backend **cria** o nó; no chunk 5 **casa por alias** e retorna o **mesmo** nó (§4). O loop
per-chunk funciona sem estado global — é para isso que a resolução de entidade existe.

**Retry (seção 8).** Os chunks já existem; o run reabre (`failed → running`); fragmentos
`proposed` não consolidados da tentativa anterior viram `rejected`; re-propostas caem na
consolidação idempotente (§6.5). Nunca há run duplicado.

**Limitação declarada:** anáfora além do lookback de 1 chunk ("conforme decidido acima", 3 chunks
atrás) pode não resolver — a LLM baixa a confiança ou omite. Aceito: ampliar o contexto infla
custo e degrada recall em contexto longo (a razão central do chunking).

### 9.4 Transacionalidade e concorrência

- **Granularidade: uma transação por chamada de ferramenta**, não por run. Um run de 50 chunks
  que falha no chunk 49 não desfaz 48 chunks de conhecimento válido — cada item aceito é
  independentemente validado e proveniente. O retry consolida o resto idempotentemente.
- **Sucessões concorrentes:** `SELECT … FOR UPDATE` na(s) versão(ões) vigente(s) (seção 6.5,
  passo 0) serializa dois runs alterando o mesmo fato.
- **Criação concorrente de entidade:** advisory lock por `(node_type, norm(name))` (seção 4.5).
- **Falha de run:** marca `failed`; retry conforme seção 8.

---

## 10. Curadoria

O sistema é **léxico por decisão** (sem embeddings — seção 20): sinônimos, ambiguidades e
conflitos **caem em filas/flags por design**. A curadoria não é acessório: é a **válvula
permanente** da escolha léxica. Single-owner: o curador é o dono; toda ação audita em
`CurationAction` (sem coluna de ator — seção 2.3).

**Por que a curadoria existe — e por que só duas filas.** A curadoria nasce do princípio de
**confiança explícita** (§1): a extração por LLM é probabilística, *a incerteza é registrada,
nunca escondida*, e *nada é descartado silenciosamente*. Esse princípio **proíbe duas saídas
automáticas** para qualquer coisa que o pipeline não consiga decidir com confiança:

1. **chutar** (resolver sozinho, arriscando afirmar errado) — **proibido**;
2. **descartar em silêncio** (jogar fora o duvidoso) — **proibido**.

O que o princípio **não** exige, porém, é *parar e perguntar a um humano*. Ele veta apenas a
resolução **destrutiva**; **preservar-e-sinalizar** honra os dois vetos tão bem quanto uma fila
— sem cobrar atenção do dono. Por isso a incerteza tem **quatro destinos**, não três:

| Destino | Natureza | Quem vai para lá |
|---|---|---|
| chutar | proibido | ninguém |
| descartar em silêncio | proibido | ninguém |
| **fila** — exige decisão humana | parar e perguntar | só o que **só** humano resolve: `entity_match`, `disputed` |
| **flag** — preserva sem exigir humano | registrar, sinalizar, resolver sozinho se possível | `uncertain`, `low_confidence` |

É essa distinção que sustenta **duas** filas (e não quatro) **sem violar o princípio**: mantêm-se
os vetos e relaxa-se a *consequência*. `entity_match` e `disputed` só se resolvem com julgamento
humano — são fila de verdade. `uncertain` tem **saída automática** (corroboração promove
`uncertain → active`, §6.5) e `low_confidence` é ruído de baixa prioridade que fica `proposed` e
sinalizado — ambos preservados, ambos visíveis, **nenhum** descartado ou chutado, e **nenhum**
exigindo uma "caixa de entrada" a zerar.

### 10.1 Filas e flags

**Duas filas dedicadas** (as que pagam a conta — exigem decisão humana ativa):

| Fila | Conteúdo | Origem |
|---|---|---|
| `entity_match` | Nós `needs_review` + candidatos (`EntityMatchReview`) | seção 4.3 |
| `disputed` | Links/atributos em conflito | seção 6.5-C |

**Dois sinais como flags de exibição** (sem fila dedicada — A26):

| Flag | Conteúdo | Tratamento |
|---|---|---|
| `uncertain` | Aceitos provisórios (faixa 0.40–0.74) | Promovidos a `active` por **corroboração automática** (§6.5); sinalizados nos resultados de busca (§7.3); `confirm_item` disponível ad-hoc |
| `low_confidence` | Fragmentos `proposed` nunca consolidados (faixa < 0.40) | Permanecem `proposed`, sinalizados quando aparecem em resultados; sem ação proativa exigida |

> **Por que 2 e não 4** (raciocínio completo no preâmbulo desta seção): os dois vetos do princípio
> de §1 não obrigam fila humana — só proíbem chutar e descartar em silêncio. `uncertain`/`low_confidence`
> são **preservados como flags** (honram os vetos sem cobrar atenção); só `entity_match`/`disputed`
> exigem julgamento humano. Promover `uncertain`/`low_confidence` a fila dedicada é **aditivo**
> (basta um `kind` a mais em `list_review_queue`) e fica **diferido** até o volume justificar (A26).

### 10.2 Operações (ferramentas do toolset `curation`, seção 14.4)

| Operação | Efeito |
|---|---|
| `resolve_entity_match` | `keep_separate` → nó vira `active`; `merge_into` → fluxo de merge (4.4) |
| `merge_nodes` | Merge direto entre dois nós quaisquer (4.4) |
| `resolve_dispute` | `prefer_one` → vencedor `active`, perdedor `deleted`; `adjust_periods` → ajusta validades e reativa; `keep_disputed` → mantém |
| `confirm_item` | `uncertain → active` (ad-hoc; não há fila proativa — uso quando se encontra o item) |
| `reject_item` | item → `deleted` (auditado, com motivo) |
| `correct_item` | dispara fluxo de **Correção** (6.5-B) com os valores corrigidos |
| `compliance_delete` | apagamento controlado (seção 11) |

Toda operação exige `reason` quando destrutiva (`reject_item`, `prefer_one`,
`compliance_delete`).

As operações de curadoria são expostas **tanto** como ferramentas MCP (toolset `curation`, para a
LLM orquestradora) **quanto** como rotas REST (para a SPA do dono) — mesma camada de serviço,
mesma auditoria (`CurationAction`).

---

## 11. Imutabilidade vs. LGPD

- **Imutabilidade é o padrão.** `RawInformation` não é alterada nem apagada no curso normal.
- **Apagamento controlado** (`compliance_delete`) quando exigido por lei/direito do titular:
  o `content` é **redigido/tombstoned** (hash preservado para idempotência), e `status = deleted`
  propaga aos derivados afetados: chunks, fragmentos e os links/atributos cuja **única**
  proveniência dependia da fonte apagada (itens com proveniência remanescente de outras fontes
  permanecem).
- **Apagamento auditado:** `ComplianceDeletion` registra o quê, quando, por quê e contagens
  afetadas. O "quem" é o operador-dono (seção 2.3).

---

## 12. Evolução de Schema

- `NodeType`, `LinkType`, `LinkTypeRule`, `AttributeKey` têm `version` e/ou campos temporais.
- Mudar uma regra **não invalida** dados criados sob a regra antiga; a validação usa a regra
  **vigente no momento da criação** do link/atributo.
- São igualmente versionados: configurações de full-text (`pt_unaccent_v1`,
  `simple_unaccent_v1`), estratégia de chunking (`chunking_version`) e prompt de extração
  (`prompt_version`) — os três participam da chave de idempotência ou do mecanismo de
  reprocessamento (seção 8).

---

## 13. Validação e Segurança no Backend

Validação em camadas, na ordem — falha em qualquer camada retorna `rejected` com motivo (vira
`validation_outcome` no `ToolCall`; recusa de validação **não é exceção**, é resultado):

1. **Estrutural** — campos obrigatórios, tipos, FKs existentes; `value` parseável como
   `value_type` do `AttributeKey`; nó compatível com o `node_type` da chave.
2. **Regras de grafo** — `LinkTypeRule` vigente (par de tipos permitido).
3. **Regras temporais** — `requires_valid_from`, `requires_valid_to_on_change`,
   `valid_from < valid_to` (semiaberto), **justificativa de data** (cadeia
   `stated`/`document`/`received` — data inventada é rejeitada), e aplicação correta de
   consolidação/sucessão/correção/conflito conforme seção 6.5.
4. **Confiança** — roteamento pelas faixas (≥ 0.75 aceito; 0.40–0.74 `uncertain`; < 0.40 não
   consolida).
5. **Anti-alucinação** — todo link/atributo aceito **tem** `Provenance` apontando para
   `InformationFragment` real, ancorado em `RawChunk` real da fonte do run corrente.

**Segurança contra prompt injection:** ferramentas restritas e tipadas (schemas validados com
**Zod** nos limites REST e MCP); toda chamada validada; conteúdo de documento é **dado**, nunca
instrução.

**Fronteira de acesso (seção 2.5):** a SPA acessa o BFF **pela rede** — logo **há superfície de
rede**, fechada por **autenticação**. Todo acesso REST e MCP exige **JWT válido (Supabase Auth)
verificado no middleware do BFF**. A **service key** do Supabase vive **somente no BFF** (nunca na
SPA, nunca na LLM); o **RLS do Postgres está desligado** — a autorização é **centralizada na
camada de serviço do BFF**, coerente com o modelo single-owner (um único dono, sem papéis).
Consultas ao banco usam o driver `pg` com **parâmetros** — nunca concatenação de SQL.

---

## 14. Catálogo de Ferramentas MCP

Envelope **lógico** de resposta (contrato de negócio comum aos dois transportes; a renderização
no fio difere por transporte — ver nota abaixo e Emenda v7.2):

```jsonc
// sucesso                          // falha
{ "ok": true,  "result": { … } }    { "ok": false, "error": { "code": "…", "message": "…", "details": { } } }
```

Códigos de erro: `STRUCTURAL_INVALID`, `UNKNOWN_TYPE` (node_type/link_type/key fora do
registro), `RULE_VIOLATION` (par de tipos ilegal), `TEMPORAL_INCOHERENT`, `DATE_UNJUSTIFIED`,
`NOT_FOUND`, `INTERNAL`. Resultados de negócio (consolidado, disputado, em revisão…) **não são
erros** — voltam em `result.outcome`.

> **Renderização por transporte (Emenda v7.2).** O envelope lógico acima é o contrato de negócio.
> As rotas **REST** o devolvem diretamente (com o HTTP status correspondente). As rotas **MCP** o
> renderizam no formato **MCP 2025-06-18**: sucesso → o `result` num bloco de conteúdo `text` (JSON);
> falha → `isError: true` com `{ code, message, details }` no bloco `text`. Mapeamento único em
> `backend/src/shared/error-mapping.ts`. Erros de **protocolo** (JSON-RPC malformado, método
> desconhecido) ficam no campo `error` do JSON-RPC, não no resultado.

> **Transporte e topologia de rotas.** Três transportes MCP coexistem no mesmo processo BFF
> (ADR A28 — núcleo único, transportes disjuntos):
>
> | Toolset | Rota MCP | REST equivalente | Modo |
> |---|---|---|---|
> | `ingest` (14.1) | `POST /api/v1/mcp/ingest` | `POST /api/v1/ingest/llm-runs/:id/propose-*` · `POST .../llm-runs/:id/run` | escrita; dual; 4 `propose_*` (`llm_run_id` por argumento, v7.2) + `ingest_document` one-shot (v7.4) |
> | `query` (14.3) | `POST /api/v1/mcp/query` | `GET /api/v1/...` | somente leitura; dual |
> | `curation` (14.4) | `POST /api/v1/mcp/curation` | `POST /api/v1/curation/...` | escrita auditada; dual |
>
> A camada de serviço e as validações (seção 13) são **únicas** — REST e MCP são fachadas finas
> sobre elas, nunca lógicas paralelas. Os três transportes compartilham o mesmo núcleo `McpServer`
> mas têm registros de ferramentas disjuntos (lista fechada por transporte).
>
> **Códigos de erro por transporte.** O conjunto canônico acima (`STRUCTURAL_INVALID` …
> `INTERNAL`) aplica-se ao toolset `ingest` e ao toolset `curation` / ferramenta
> `compliance_delete` (que mantém o mapeamento canônico original — ADR A28). O toolset `query` e
> as demais sete ferramentas do toolset `curation` (`list_review_queue`, `resolve_entity_match`,
> `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`) usam o conjunto
> **estendido** da taxonomia REST: `RESOURCE_NOT_FOUND`, `BUSINESS_NODE_DELETED`, `BUSINESS_*`
> (e.g. `BUSINESS_REASON_REQUIRED`, `BUSINESS_TEMPORAL_INCOHERENT`, …),
> `VALIDATION_INVALID_FORMAT`, além dos códigos canônicos. O conjunto canônico é a **base**; o
> conjunto estendido adiciona os códigos específicos do domínio.

### 14.1 Toolset `ingest` (escrita; dual MCP+REST)

O toolset tem dois níveis:

- **`propose_*` (4 ferramentas)** — `propose_fragment`, `propose_node`, `propose_link`,
  `propose_attribute`. Operam **dentro de um `LLMRun` ativo** (o run é contexto; `llm_run_id` por
  **argumento de ferramenta** — Emenda v7.2). São chamadas pelo orquestrador interno (seção 9.4) ou
  por um cliente externo que já tenha um run em `running` (BR-21 da `ingestion.back.md`).
- **`ingest_document` (1 ferramenta — Emenda v7.4)** — entrada **one-shot** para um cliente MCP
  externo (ex.: Claude Desktop): recebe o documento inteiro, **cria** o `RawInformation` + chunks +
  `LLMRun` e **dispara a extração server-side** (o mesmo orquestrador interno da seção 9.4),
  devolvendo o resumo do run. Quem extrai é o LLM do **servidor** (chave Anthropic do BFF — A28 /
  BR-29 da `ingestion.back.md`); o cliente apenas entrega o conteúdo, de modo que a regra
  inegociável (a LLM nunca toca no banco — seção 2) é preservada. **Idempotente**: reenviar o mesmo
  conteúdo é no-op (devolve o run existente sem re-extrair; `content_hash` UNIQUE — seção 8).

**`propose_fragment`** — registra uma afirmação atômica como evidência.

```
in:  { text: string (frase completa, ≤ 1000 chars),
       confidence: number (0–1),
       chunk_ids: uuid[] (≥ 1, chunks do RawInformation do run) }
out: { fragment_id: uuid, status: "proposed" }
```

**`propose_node`** — propõe uma entidade; o backend resolve (seção 4).

```
in:  { node_type: string, name: string, aliases?: string[] }
out: { node_id: uuid,
       resolution: "matched_existing" | "created_new" | "needs_review" }
```

**`propose_link`** — propõe relação entre nós já resolvidos.

```
in:  { source_node_id: uuid, link_type: string, target_node_id: uuid,
       confidence: number (0–1),
       fragment_ids: uuid[] (≥ 1),
       valid_from?: date,
       valid_from_basis?: "stated" | "document",   // "received" é fallback do backend
       change_hint?: "none" | "succession" | "correction" }  // correction exige errata citada
out: { link_id: uuid,
       outcome: "created" | "consolidated" | "superseded_previous"
              | "uncertain_created" | "disputed" | "rejected",
       superseded_link_id?: uuid, reason?: string }
```

**`propose_attribute`** — propõe valor literal de um nó.

```
in:  { node_id: uuid, key: string, value: string,
       confidence: number (0–1), fragment_ids: uuid[] (≥ 1),
       valid_from?: date, valid_from_basis?: "stated" | "document",
       change_hint?: "none" | "succession" | "correction" }
out: { attribute_id: uuid, outcome: (idem propose_link), superseded_attribute_id?: uuid }
```

**`ingest_document`** (Emenda v7.4) — ingestão one-shot: cria o run e dispara a extração
server-side. Não recebe `llm_run_id` (ele é **criado** aqui).

```
in:  { content: string (texto do documento, 1–10 MiB),
       source_type: "pdf"|"email"|"ata"|"chat"|"artigo"|"transcricao"|"outro",
       metadata?: object (livre; `document_date` ISO-8601 justifica validade temporal, §6.5),
       model?: string (modelo Anthropic da extração; default recomendado do servidor),
       prompt_version?: string (default do servidor) }
out: { outcome: "ingested" | "already_ingested",
       raw_information_id: uuid, llm_run_id: uuid, chunk_count: number,
       run?: LlmRunSummary }    // `run` presente quando outcome = "ingested"
```

### 14.2 Schema JSON normativo (exemplo completo — `propose_link`; os demais seguem o padrão)

```json
{
  "name": "propose_link",
  "description": "Propõe uma relação direcionada entre dois nós existentes, sustentada por fragmentos.",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["source_node_id", "link_type", "target_node_id", "confidence", "fragment_ids"],
    "properties": {
      "source_node_id": { "type": "string", "format": "uuid" },
      "link_type":      { "type": "string" },
      "target_node_id": { "type": "string", "format": "uuid" },
      "confidence":     { "type": "number", "minimum": 0, "maximum": 1 },
      "fragment_ids":   { "type": "array", "minItems": 1,
                          "items": { "type": "string", "format": "uuid" } },
      "valid_from":       { "type": "string", "format": "date" },
      "valid_from_basis": { "type": "string", "enum": ["stated", "document"] },
      "change_hint":      { "type": "string", "enum": ["none", "succession", "correction"],
                            "default": "none" }
    }
  }
}
```

### 14.3 Toolset `query` (determinístico; usado pela LLM orquestradora, pela SPA via REST, ou diretamente)

**`search`** — pipeline da seção 7.2.

```
in:  { query: string,
       layers?: ("node" | "fragment" | "chunk")[],   // default: as três
       as_of?: date, in_effect_only?: boolean, include_uncertain?: boolean,
       limit?: int (default 20, máx 100), offset?: int }
out: { total: int,
       items: [ { kind: "node" | "link" | "attribute" | "fragment",
                  id: uuid, score: number, hop?: int,
                  summary: string,                    // representação legível
                  flags?: ("uncertain" | "disputed" | "low_confidence")[],
                  provenance: [ { fragment_id, fragment_text,
                                  raw_information_id, source_type,
                                  excerpt, received_at } ] } ] }
```

**`get_node`** — nó + atributos vigentes + aliases.

```
in:  { node_id: uuid, as_of?: date, in_effect_only?: boolean }
out: { node: { id, node_type, canonical_name, status },
       aliases: string[],
       attributes: [ { key, value, value_type, valid_from, valid_to,
                       status, effective_status, confidence, provenance: […] } ] }
```

**`traverse`** — travessia temporal do grafo.

```
in:  { node_id: uuid, direction?: "out" | "in" | "both" (default "both"),
       link_types?: string[], depth?: int (1–3, default 1),
       as_of?: date, in_effect_only?: boolean }
out: { nodes: [ … ], links: [ { id, source_node_id, link_type, inverse_name,
                                target_node_id, valid_from, valid_to, status,
                                effective_status, confidence, hop } ] }
```

**`get_history`** — cadeia de versões pela linhagem (visibilidade de encadeamento; independe da
consulta (c), seção 5.3).

```
in:  { link_id?: uuid, attribute_id?: uuid }            // exatamente um
     | { node_id: uuid, key: string }                   // histórico de uma chave
out: { versions: [ { id, value_or_target, valid_from, valid_to,
                     recorded_at, superseded_at, status, valid_from_source,
                     supersedes_id, provenance: […] } ] }   // ordenado por recorded_at
```

**`get_provenance`** — cadeia completa até a origem.

```
in:  { link_id?: uuid, attribute_id?: uuid, fragment_id?: uuid }   // exatamente um
out: { fragments: [ { id, text, confidence, status,
                      chunks: [ { id, excerpt, offset_start, offset_end,
                                  raw_information: { id, source_type, metadata,
                                                     received_at } } ] } ] }
```

### 14.4 Toolset `curation` (operador-dono; tudo audita em `CurationAction`; espelhado em REST para a SPA)

```
list_review_queue   { kind?: "entity_match"|"disputed",      // só as duas filas dedicadas (§10)
                      limit?, offset? }
                    → itens da fila com contexto (candidatos, lados do conflito, fontes)

resolve_entity_match{ node_id, decision: "merge_into"|"keep_separate",
                      target_node_id?, reason? }
merge_nodes         { survivor_id, absorbed_id, reason }
resolve_dispute     { item_kind: "link"|"attribute", item_ids: uuid[],
                      decision: "prefer_one"|"adjust_periods"|"keep_disputed",
                      winner_id?, periods?: [{id, valid_from, valid_to}], reason }
confirm_item        { item_kind, item_id }                       // uncertain → active (ad-hoc)
reject_item         { item_kind, item_id, reason }               // → deleted (auditado)
correct_item        { item_kind, item_id, reason,
                      corrected: { value? | target_node_id? | valid_from? | valid_to? } }
                                                                 // fluxo 6.5-B
compliance_delete   { raw_information_id, reason }               // seção 11
```

---

## 15. Catálogo Seed

Carga inicial obrigatória (migração de seed). É o vocabulário concreto desta versão — novos tipos
entram por migração versionada (seção 12).

### 15.1 NodeTypes

| name | descrição |
|---|---|
| `Person` | Pessoa física |
| `Organization` | Empresa, órgão, time formal |
| `Project` | Projeto/iniciativa com objetivo e ciclo de vida |
| `Event` | Acontecimento pontual (reunião, go-live, workshop) |
| `Role` | Cargo/função (vocabulário controlado) |
| `Category` | Rótulo taxonômico para classificação |
| `Concept` | Conceito/tema referenciável |
| `Location` | Lugar físico ou lógico |

### 15.2 LinkTypes (com todas as flags) e suas regras

| name | inverse_name | temporal | multi | req. valid_from | valid_to on change | pares permitidos (LinkTypeRule) |
|---|---|---|---|---|---|---|
| `participates_in` | `has_participant` | ✓ | ✓ | ✓ | — | Person→Project, Person→Event |
| `member_of` | `has_member` | ✓ | ✓ | ✓ | — | Person→Organization |
| `holds_role` | `role_held_by` | ✓ | ✓ | ✓ | — | Person→Role |
| `responsible_for` | `under_responsibility_of` | ✓ | ✓ | ✓ | — | Person→Project, Person→Event |
| `reports_to` | `manages` | ✓ | ✗ funcional | ✓ | ✓ | Person→Person |
| `part_of` | `has_part` | ✓ | ✗ funcional | ✓ | ✓ | Organization→Organization, Project→Project, Event→Project |
| `located_in` | `location_of` | ✓ | ✗ funcional | ✓ | ✓ | Organization→Location, Event→Location |
| `organizes` | `organized_by` | ✓ | ✓ | ✓ | — | Organization→Event, Person→Event |
| `belongs_to_category` | `contains` | ✗ estável | ✓ | ✗ | — | {Person, Organization, Project, Event, Concept, Location}→Category |
| `related_to` | `related_to` (simétrica) | ✗ estável | ✓ | ✗ | — | Concept→Concept, Project→Concept |

### 15.3 AttributeKeys

| node_type | key | value_type | temporal | multi | req. valid_from |
|---|---|---|---|---|---|
| Project | `deadline` | date | ✓ | ✗ funcional | ✓ |
| Project | `start_date` | date | ✓ | ✗ funcional | ✓ |
| Project | `status_text` | text | ✓ | ✗ funcional | ✓ |
| Project | `budget` | number | ✓ | ✗ funcional | ✓ |
| Event | `event_date` | date | ✓ | ✗ funcional | ✓ |
| Person | `email` | text | ✓ | ✓ multi | ✗ |
| Person | `phone` | text | ✓ | ✓ multi | ✗ |
| Person | `birth_date` | date | ✗ estável | ✗ | ✗ |
| Organization | `cnpj` | text | ✗ estável | ✗ | ✗ |
| Organization | `website` | text | ✓ | ✗ funcional | ✗ |

O conjunto cobre todas as combinações de flags (temporal-funcional, temporal-multi, estável) —
serve de gabarito para novas chaves.

---

## 16. Requisitos não-funcionais

**Premissas de volume — corpus enxuto de um único dono (centenas de documentos):**

| Métrica | Ordem de grandeza (pessoal, enxuto) |
|---|---|
| `RawInformation` | **centenas** (~10²–10³) de documentos — um dono, ao longo de anos |
| `RawChunk` | ~10³–10⁴ |
| `InformationFragment` | ~10³–10⁴ |
| `KnowledgeNode` | ~10²–10³ — o universo de entidades de **uma pessoa** é pequeno e limitado |
| `KnowledgeLink` + `NodeAttribute` | ~10³–10⁴ |

São **duas a três ordens de grandeza abaixo** de um corpus organizacional. O banco inteiro —
incluindo o `content` inline — fica na casa de **alguns a dezenas de MB**: cabe por completo em
cache. Postgres single-instance **sobra com folga absurda**; sharding/réplica/tuning sequer
entram na conversa.

> **O que muda nesta escala — e o que deixa de importar.**
> - **Índices viram conforto, não necessidade.** GIN (full-text) e trigram continuam no schema —
>   são baratos e à prova de futuro — mas, a esta cardinalidade, um seq scan já responde em poucos
>   ms; eles deixam de ser *load-bearing*. Nada a remover; apenas deixam de ser críticos.
> - **As metas de latência são cumpridas com ~100× de margem.** `search`/`traverse`/`get_*` caem
>   para poucos ms, dominados por overhead de planejamento, não por volume.
> - **A calibração (A21) enfraquece.** ~100 documentos é uma **fração grande** do corpus inteiro —
>   pode não haver volume estatístico para recalibrar thresholds; na prática os seeds tendem a
>   ficar como estão. Calibração vira **oportunística**, não um marco planejado.
> - **A promoção de filas (A26) tende a nunca disparar.** `uncertain`/`low_confidence`
>   dificilmente acumulam o bastante para justificar fila dedicada — o diferimento vira, na
>   prática, **permanente**.
>
> O gargalo, já único, fica ainda mais nítido: **ingestão por LLM + atenção de curadoria do
> dono**. O banco é detalhe de implementação. É por isso que o sistema economiza no recurso caro
> (atenção humana — consulta (c) diferida §5.3, duas filas §10), não no barato (armazenamento).

**Latência-alvo (p95):** `search` < 500 ms; `traverse` (depth ≤ 3) < 1 s; `get_*` < 200 ms —
**tetos de sanidade**: à escala de centenas de documentos, a latência real fica na casa de poucos
ms (base inteira em cache, índices sobrando). Ingestão é LLM-bound — minutos por documento são
aceitáveis.

**Backup:** dump lógico diário + retenção 30 dias; teste de restore mensal. O banco é o único
estado do sistema (decisão 2.2 — store único).

**Observabilidade:** logs estruturados (JSON, via `pino`) e métricas por run — taxa de aceitação,
consolidações, `needs_review`, `disputed`, `uncertain`/`low_confidence` sinalizados, rejeições
por camada de validação. Essas métricas são o **insumo de calibração** dos thresholds (Apêndice
A): revisão **oportunística** quando houver volume — a centenas de documentos, ~100 docs já é
fração grande do corpus, então os seeds tendem a permanecer (ver nota de dimensionamento acima).
São também o sinal que diz **se/quando** promover `uncertain`/`low_confidence` a filas dedicadas
(A26) — promoção que, nesta escala, dificilmente dispara.

**Migrações:** SQL puro, versionadas no repositório, aplicadas por ferramenta de migração; seed
da seção 15 é a migração 0002 (0001 = schema).

---

## 17. Cenários de aceitação

Formato Dado/Quando/Então — base da suíte de testes de integração. "Ata Apollo" = ata com
participantes João e Maria, go-live 15/07/2026, Maria coordenadora, reunião 01/07/2026.

**C1 — Ingestão básica.** Dado o sistema vazio com seeds; Quando a ata Apollo (datada
2026-06-11) é ingerida; Então existem: nós `Project Apollo`, `Person João Silva`,
`Person Maria Oliveira`, `Role Coordenador de Implantação`, `Event Reunião Projeto Apollo`;
links `participates_in` ×2, `holds_role` (Maria→Coordenador), `responsible_for`
(Maria→Apollo), `part_of` (Reunião→Apollo); atributos `Apollo.deadline = 2026-07-15` e
`Reunião.event_date = 2026-07-01` — todos com `Provenance` → fragmento → chunk → ata, e
`valid_from_source` registrado.

**C2 — Idempotência.** Quando a mesma ata é enviada de novo; Então nenhuma linha nova é criada
(mesmo `content_hash`, mesmo `idempotency_key`) e a resposta referencia os registros existentes.

**C3 — Consolidação por re-afirmação.** Dado C1; Quando outra ata diz "João segue no projeto
Apollo"; Então **nenhum** link novo: o `participates_in` existente ganha segunda linha de
`Provenance`.

**C4 — Sucessão funcional.** Dado C1; Quando ata datada 2026-06-20 diz "go-live adiado para
01/08/2026"; Então o atributo antigo fica `superseded` (`valid_to = 2026-06-20`,
**`superseded_at` permanece NULL** — encerramento no eixo de validade, Emenda v7.3), o novo fica
`active` (`valid_from = 2026-06-20`, `value = 2026-08-01`, `valid_from_source = document`), com
`supersedes_attribute_id` ligando os dois.

**C5 — Conflito.** Dado C1; Quando fonte independente do **mesmo período** afirma go-live em
20/07; Então ambos os atributos ficam `disputed`, nada é descartado, e a fila `disputed` os
lista com fontes e `valid_from_source` de cada lado.

**C6 — Correção (errata).** Dado C1; Quando chega errata "onde se lê 15/07, leia-se 16/07"
(`change_hint = correction`); Então o antigo recebe `superseded_at = now` com **`valid_to`
intocado**, e o novo carrega `value = 2026-07-16` com o **mesmo `valid_from`** original. (Usa o
eixo de transação construído nesta versão — independe da consulta (c).)

**C7 — Point-in-time (valid-time).** Dado C4; Quando consulto `deadline` com `as_of = 2026-06-15`;
Então a resposta é 15/07/2026 (consulta (b)) — **satisfeito pela Emenda v7.3** (a sucessão encerra a
versão antiga só no eixo de validade, mantendo-a visível à consulta (b); verificado por teste
determinístico em `temp/e2e/succession-e2e.mts`). *(A reconstrução "o que o sistema sabia em T"
— consulta (c) — é diferida (seção 5.3, A25); `recorded_at` é gravado, mas não há cenário/teste
de (c) nesta versão. O cenário será adicionado quando (c) for construída.)*

**C8 — Match forte fuzzy.** Dado C1; Quando outro documento menciona "Projeto Apolo" (typo);
Então nenhum nó novo: trigram ≥ 0.85 único → mesmo nó, e "Projeto Apolo" entra como
`NodeAlias`.

**C9 — Match ambíguo.** Dado nós "Projeto Apollo" e "Apollo Phase 2"; Quando documento menciona
só "Apollo"; Então nó novo `needs_review` com 2 linhas em `EntityMatchReview`, e a fila
`entity_match` o exibe com os candidatos.

**C10 — Busca sem acento/com flexão.** Dado C1; Quando busco `"reuniao implantacao"`; Então o
fragmento da coordenação retorna (unaccent + stemming pt), citando a cadeia completa até a ata.

**C11 — Limitação léxica permanente.** Dado C1; Quando busco "Iniciativa Lunar"; Então **zero**
resultados do Apollo — comportamento esperado e permanente (sem embeddings; seções 7.3, 20).

**C12 — `in_effect_only`.** Dado participação de novo membro com `valid_from = 2026-07-01`
(futura); Quando consulto participantes em 2026-06-15 com `in_effect_only = true`; Então o novo
membro **não** aparece; sem a flag, aparece (conhecimento atual, ainda não em vigor).

**C13 — Confiança baixa (flag, sem fila).** Quando a LLM propõe link com `confidence = 0.30`;
Então nada consolida; o fragmento fica `proposed`, **sinalizado `low_confidence`** (sem fila
dedicada — §10); o `ToolCall` registra `rejected` com motivo de faixa. Numa busca que o atinja,
o item retorna com a flag `low_confidence`.

**C14 — Corroboração (saída automática de `uncertain`).** Dado atributo `uncertain` (0.60);
Quando fonte independente afirma o mesmo valor; Então o atributo vira `active`
**automaticamente**, com proveniência das **duas** fontes — sem passar por fila.

**C15 — Apagamento controlado.** Dado C1; Quando `compliance_delete` da ata (com `reason`);
Então `content` é tombstoned, chunks/fragmentos viram `deleted`, links/atributos **cuja única
proveniência era a ata** viram `deleted`, itens com outras fontes permanecem, e
`ComplianceDeletion` registra contagens.

**C16 — Acesso autenticado (fronteira).** Dado o BFF no ar; Quando uma requisição REST ou MCP
chega **sem JWT válido** (Supabase Auth); Então é **rejeitada no middleware** antes de qualquer
acesso ao banco; com JWT válido do dono, a mesma requisição prossegue. (Fronteira de acesso —
seção 2.5.)

---

## 18. Princípios

1. A informação original nunca é perdida — exceto apagamento controlado e auditado (seção 11).
2. A LLM **sugere**.
3. O backend **valida** (estrutura, regras de grafo, regras temporais, confiança, proveniência).
4. O banco **persiste** — e é **um só** (Postgres).
5. **Entidades referenciáveis** são `KnowledgeNode`; **valores literais** são `NodeAttribute`.
6. **Relações entre entidades** são `KnowledgeLink`.
7. Toda informação mutável é **temporal** no eixo de validade, em links **e** atributos; o eixo
   de transação é gravado, com a auditoria forense plena (consulta (c)) diferida (seção 5.3).
8. **Estado dependente de relógio é derivado, nunca gravado** (`is_current`, `is_in_effect`,
   `effective_status`).
9. Toda versão substituída mantém **linhagem explícita** ao sucessor (`supersedes_*`).
10. Todo conhecimento é **rastreável até a origem** (`Provenance` → fragmento → chunk → raw).
11. Toda afirmação carrega **confiança explícita**; **conflito**, **mudança** e **correção** são
    casos distintos.
12. **Datas nunca são inventadas** — todo `valid_from` tem justificativa em
    `stated`/`document`/`received`, registrada.
13. **Re-afirmação consolida, nunca duplica** — proveniência acumula no item existente.
14. A mesma entidade no mundo real corresponde a **um único** `KnowledgeNode`.
15. O sistema responde por **busca textual e grafo**, sempre citando a fonte — e declara
    abertamente o que **não** sabe responder, **por decisão permanente**: significado livre
    (sinônimos sem sobreposição léxica), porque não há embeddings (seção 20). A válvula é a
    curadoria.
16. **O BFF é a fronteira única**: nem a SPA nem a LLM tocam o banco; o acesso é autenticado
    (Supabase Auth), com a service key só no BFF e a autorização centralizada nele (seções 2, 2.5).

---

## 19. Resumo do modelo de dados

| Entidade | Papel | Temporal? | Proveniência? |
|---|---|---|---|
| `RawInformation` | Fonte original imutável | — | é a origem |
| `RawChunk` | Pedaço fatiado + full-text | — | é a âncora |
| `InformationFragment` | Afirmação atômica (evidência) + full-text | status | liga a `RawChunk` |
| `KnowledgeNode` | Entidade/conceito | created/updated | — |
| `NodeAlias` | Nomes do nó (inclui canônico) + trigram | — | run que criou |
| `NodeAttribute` | **Valor literal temporal** | **sim** + linhagem | sim |
| `KnowledgeLink` | **Relação temporal** entre nós | **sim** + linhagem | sim |
| `NodeType` / `LinkType` / `LinkTypeRule` | Schema e regras | versionado | — |
| `AttributeKey` | Vocabulário governado de atributos | versionado | — |
| `LLMRun` / `ToolCall` | Auditoria da extração | timestamps | — |
| `EntityMatchReview` | Contexto de revisão de matches | — | — |
| `CurationAction` | Auditoria de curadoria | timestamps | — |
| `ComplianceDeletion` | Auditoria de apagamento | timestamps | — |

Regra de ouro: **valor literal → `NodeAttribute` temporal; entidade → nó + `KnowledgeLink`
temporal.** Mudança = encerrar + criar + ligar por linhagem; correção = superseder só no eixo de
transação; re-afirmação = consolidar proveniência. Nada é sobrescrito.

---

## 20. Não-objetivos e limites permanentes (sem embeddings)

Esta seção registra, de forma explícita e fechada, **o que o sistema não faz por decisão** — não
por falta de tempo, mas por escolha de relação custo × benefício para um projeto pessoal
single-owner.

### 20.1 Embeddings / busca semântica — **não-objetivo permanente**

- **Não há, e não haverá, embeddings, `pgvector` nem banco vetorial.** A recuperação é **léxica
  (full-text + trigram) + grafo**, e essa é a forma final, não uma fase 1.
- **Não existem colunas de embedding** em `RawChunk` nem em `KnowledgeNode`. Não se carrega peso
  de schema por uma capability que não será usada.
- **Consequência assumida (permanente):** sinônimos/paráfrases sem sobreposição de caracteres
  ("Iniciativa Lunar" vs. "Projeto Apollo") **não casam automaticamente** — nem na busca (§7.3,
  C11) nem na resolução de entidade (§4.5). Esses casos vão para a **curadoria** (`entity_match`),
  que é a **válvula declarada e permanente** dessa escolha (§10).
- **Única porta de "casar significado" prevista** (e mesmo assim fora de escopo agora):
  dicionário de **sinônimos** plugado na configuração de full-text (A4) — nova config versionada
  + reindex, zero mudança de schema. É léxico-assistido, não semântico, e não está implementado.
- **Se um dia for revertido** (não é o plano): reintroduzir embeddings custaria adicionar as
  colunas (migração), um índice ANN e uma camada no pipeline — um trabalho real e consciente,
  não um "preencher reservado". Este documento não otimiza para essa reversão.

### 20.2 O que é **diferido** (≠ não-objetivo) — dados preservados, caminho adiado

Diferente de embeddings (que não voltam), estas capabilities têm os **dados já preservados** e
podem ser ligadas no futuro **sem migração nem perda**, quando o uso real justificar:

| Capability diferida | Dado já preservado | Como ativar depois | Decisão |
|---|---|---|---|
| **Consulta (c)** — "o que o sistema sabia em T" (auditoria forense) | `recorded_at` gravado em toda linha; nada é apagado fisicamente | Escrever a query (c) e expor parâmetro de system-time nas ferramentas | A25 |
| **Filas dedicadas** para `uncertain` / `low_confidence` | `status`/`confidence` já gravados; flags já expostas | Adicionar os `kind` em `list_review_queue` | A26 |

**Por que diferir e não cortar:** o custo dessas duas é de **construção/manutenção** (queries,
ferramentas, testes, atenção humana), não de **dados**. Como os dados ficam, adiar não fecha
nenhuma porta — apenas evita pagar por garantias que um único usuário raramente cobra, até que
as métricas (§16) mostrem necessidade.

### 20.3 Multiusuário e autorização por papel — **não-objetivo**

O sistema é single-owner (seção 2.3): há **autenticação** (uma porta de acesso para o dono), mas
**não há** entidade `User`, papéis, nem autorização por papel. Multiusuário, se um dia existir, é
**aditivo** (ator + coluna de autoria nas trilhas) e **não é objetivo** desta especificação (A20).

---

## Apêndice A — Decisões fechadas (ADRs)

Constantes nomeadas vivem num módulo único de configuração; alterá-las é mudança de
configuração, não de arquitetura.

| # | Decisão | Valor |
|---|---|---|
| A1 | Banco / store único | PostgreSQL **17 via Supabase Cloud** — nenhum outro serviço de dados; **RLS desligado** (segurança centralizada no BFF) |
| A2 | Full-text | `tsvector` + GIN; configs `pt_unaccent_v1` (prosa) e `simple_unaccent_v1` (nomes), versionadas |
| A3 | Fuzzy léxico (resolução de entidade) | `pg_trgm`, **sinal único**, atrás de interface; Levenshtein documentado como extensão **léxica** — sem sinal vetorial |
| A4 | Sinônimos no índice | **Fora de escopo**; única porta de "casar significado", via dicionário na config versionada — não implementada |
| A5 | Blob do original | Inline (`content`); `storage_ref` reservado nulável |
| A6 | Acesso a dados | Driver **`pg` raw, queries parametrizadas** + migrações SQL puras versionadas no repositório |
| A7 | Convenção de intervalo | Semiaberto `[início, fim)` nos dois eixos |
| A8 | Tipos temporais | Validade = `date`; transação = `timestamptz` UTC; exibição São Paulo só na apresentação |
| A9 | Estado derivado | `is_current`, `is_in_effect`, `effective_status` em views; `inactive` nunca gravado |
| A10 | Multiplicidade | Só `allows_multiple_current` (LinkType/AttributeKey); `LinkTypeRule.cardinality` removido |
| A11 | Unicidade | Guarda de duplicata por índice parcial (todos os tipos); guarda funcional na transação com `FOR UPDATE` |
| A12 | Thresholds de matching | forte ≥ **0.85** (único, sem segundo ≥ 0.55); ambíguo **[0.55, 0.85)**; novo < 0.55; escopo por `node_type` |
| A13 | Faixas de confiança | aceito ≥ **0.75**; `uncertain` **0.40–0.74**; < 0.40 não consolida; corroboração promove |
| A14 | Cadeia de datas | `stated` → `document` → `received`; nível gravado em `valid_from_source`; data sem justificativa = rejeição |
| A15 | Pesos de busca | fragmento **1.0** / nó **0.9** / chunk **0.6**; `ts_rank_cd`; `websearch_to_tsquery` |
| A16 | Travessia | profundidade default **1**, máx **3**; decaimento **0.5**/salto; página default **20** |
| A17 | Chunking `v1` | estrutura-primeiro; alvo 1.500–2.000 chars; máx 4.000; **sem overlap**; contexto de vizinhança via prompt |
| A18 | Idempotência de run | `sha256(content_hash ∥ prompt_version ∥ model ∥ chunking_version)`; retry reabre o mesmo run |
| A19 | Transacionalidade | Uma transação por chamada de ferramenta; locks: `FOR UPDATE` (sucessão) + advisory (criação de entidade) |
| A20 | Operação | **Single-owner autenticado, projeto pessoal, sem entidade `User`** nem autorização por papel; **autenticação via Supabase Auth (JWT no middleware do BFF)** porque a SPA acessa o BFF pela rede; auditoria sem coluna de ator (ator = dono, implícito); multiusuário não é objetivo |
| A21 | Calibração | Thresholds A12/A13 e pesos A15/A16 revisados após ~100 documentos, guiados pelas métricas da seção 16 |
| A22 | Chunking — algoritmo & offset | 5 estágios determinísticos (§9.2); greedy `CHUNK_TARGET` 1500–2000 / `CHUNK_HARD_MAX` 4000 / `READING_TAIL` 200; oversize → `Intl.Segmenter('pt')`; offsets **0-based, semiaberto, code points Unicode** |
| A23 | Citação granular | `RawChunk.locator` (jsonb nulável: page/line/speaker/ts) preenchido conforme `source_type` |
| A24 | **Embeddings / busca vetorial** | **Não-objetivo permanente** — sem `pgvector`, sem banco vetorial, sem colunas de embedding; recuperação é léxica + grafo; válvula da limitação é a curadoria (seção 20.1) |
| A25 | **Eixo de transação — consulta (c)** | Colunas `recorded_at`/`superseded_at` **mantidas**; `superseded_at` usado (correção, linhagem, versão corrente); **consulta (c)** (system-time travel) **diferida** — dados preservados via `recorded_at`, caminho não construído/testado/mantido até necessidade real (seção 5.3, 20.2) |
| A26 | **Filas de curadoria** | **Duas** filas dedicadas: `entity_match`, `disputed`. `uncertain` e `low_confidence` são **flags de exibição**, sem fila; promoção a fila dedicada é aditiva e diferida até o volume justificar (seção 10, 20.2) |
| A27 | **Frontend / SPA** | React 19 + TypeScript (strict) + Vite 6; Tailwind v4 (CSS-first via `@theme`) + shadcn/ui (Radix); TanStack Router/Query v5/Table; Zustand v5; React Hook Form v7 + Zod v4; Framer Motion, sonner, lucide-react; testes Vitest + Playwright + MSW. Consome o BFF **só por REST** (seção 2.4) |
| A28 | **BFF — framework e transporte** | Node.js 20 LTS + TypeScript (strict) + Fastify; REST documentado por `@fastify/swagger` (SPA) e ferramentas MCP (LLM) sobre **uma** camada de serviço/validação. Três transportes MCP disjuntos: `POST /api/v1/mcp/ingest` (`ingest`, **dual MCP+REST**, `llm_run_id` por argumento de ferramenta; inclui a ferramenta `ingest_document` one-shot que cria o run e dispara a extração — Emenda v7.4); `POST /api/v1/mcp/query` (`query`, **dual MCP+REST**, somente leitura); `POST /api/v1/mcp/curation` (`curation`, **dual MCP+REST**, escrita auditada, 8 ferramentas: 7 owned by `curation` + `compliance_delete` owned by `compliance-audit`). Os três são montados pelo **kernel SDK único** `mountMcpEndpoint` (`@modelcontextprotocol/sdk`, low-level `Server`, Streamable HTTP stateless, **MCP 2025-06-18** `content`/`isError`); conjunto de ferramentas fechado por construção (cada endpoint registra só as suas). Ver Emenda v7.2. Logs `pino`; validação de DTO/env com Zod v4 (seção 2, 14) |
| A29 | **Autenticação e fronteira de acesso** | **Supabase Auth** — JWT validado no middleware do BFF; **service key só no BFF**; **RLS desligado** (autorização centralizada no BFF); há superfície de rede, fechada por autenticação (seção 2.5) |

## Apêndice B — Changelog v6 → v7

> A v7 **preserva integralmente** o modelo de dados, o modelo temporal, a curadoria, a validação
> de negócio, o catálogo de ferramentas, o catálogo seed e os cenários de aceitação da v6. As
> mudanças são de **plataforma, transporte e fronteira de acesso** — o schema do banco (migrações
> 0001/0002) **não muda**.

| Mudança | Onde na v7 |
|---|---|
| **Frontend SPA (React)** adicionado como cliente de leitura/curadoria do BFF | 2, 2.4, A27 |
| **BFF formalizado** (Fastify): REST (SPA) + MCP (LLM) como **dois transportes sobre uma única camada de serviço/validação**; os três toolsets (`ingest`/`query`/`curation`) duais REST+MCP (ver Emendas v7.1 e v7.2) | 2, 14, A28 |
| Plataforma de dados passa a **PostgreSQL 17 via Supabase Cloud** | 2.2, A1 |
| Acesso a dados passa de query builder (Kysely/Drizzle) para **driver `pg` raw, queries parametrizadas** | 2.2, A6 |
| **Autenticação** introduzida: Supabase Auth, JWT validado no middleware; service key só no BFF; RLS desligado; há superfície de rede, fechada por auth | 2.5, 13, A29 |
| Operação reconciliada para **single-owner autenticado** (antes: mono-usuário sem autenticação): mantém ausência de `User`/papéis e ator implícito; acrescenta a porta de autenticação | 2.3, 20.3, A20 |
| Princípio 16 adicionado (BFF como fronteira única, acesso autenticado) | 18 |
| Cenário C16 adicionado (rejeição de acesso sem JWT válido) | 17 |
| Logs estruturados atribuídos a `pino` | 16 |

## Apêndice C — Emenda v7.1 (2026-06-15): transporte MCP curation

> Emenda aditiva à v7: reconcilia o modelo de transporte para um modelo **simétrico** em que os
> três toolsets têm topologias explícitas e consistentes. Não altera o modelo de dados, o schema,
> os cenários de aceitação, nem as validações de negócio. Fora do escopo desta emenda:
> reconciliação Supabase→Neon (registrada no CLAUDE.md como desvio de infraestrutura).

| Mudança | Seções afetadas |
|---|---|
| **Transporte MCP curation adicionado** (`POST /api/v1/mcp/curation`): o toolset `curation` passa a ser **dual MCP+REST**, simetricamente ao toolset `query`. 8 ferramentas na whitelist fechada: 7 owned by `curation` (`list_review_queue`, `resolve_entity_match`, `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`) + `compliance_delete` owned by `compliance-audit`. | 2, 14, A28 |
| **Topologia de três transportes documentada explicitamente** no §2 e §14 (antes implícita): rota, modo (MCP-only / dual), tipo (leitura / escrita auditada). | 2, 14, A28 |
| **Conjunto de códigos de erro por transporte esclarecido** no §14: `ingest` e `compliance_delete` usam o conjunto canônico; `query` e as outras 7 ferramentas de `curation` usam o conjunto estendido com a taxonomia REST completa (`RESOURCE_NOT_FOUND`, `BUSINESS_*`, `VALIDATION_INVALID_FORMAT`). | 14 |
| **A28 atualizado** para espelhar os três transportes com rotas, modos e ownership de ferramentas. | A28 |
| **Back-specs correspondentes aprovadas**: `domains/curation/back/curation.back.md` v1.2.0 (BR-29 a BR-32) e `domains/compliance-audit/back/compliance-audit.back.md` v1.2.0 (BR-14, BR-15) — fontes normativas do detalhe de implementação. | — |

## Apêndice C — Emenda v7.2 (2026-06-15): transportes MCP sobre o SDK oficial

> Emenda aditiva à v7. Reconcilia o **mecanismo de transporte** MCP para o SDK oficial e ajusta a
> topologia do `ingest`. **Não altera** o modelo de dados, o schema, os cenários de aceitação, nem
> as validações de negócio (seção 13) — apenas a fachada de transporte e a fronteira de acesso.

| Mudança | Seções afetadas |
|---|---|
| **Kernel SDK único.** Os três transportes MCP passam a ser montados por um kernel compartilhado, `mountMcpEndpoint` (`backend/src/mcp/sdk-http-transport.ts`), sobre o **`@modelcontextprotocol/sdk`** oficial (low-level `Server`, **Streamable HTTP stateless**). Substitui o JSON-RPC artesanal das fases anteriores. Consumível por qualquer cliente MCP padrão. | 2, 14, A28 |
| **Formato de fio = MCP 2025-06-18.** `tools/call` devolve `content` + `isError`. O envelope lógico `{ ok, result, error }` continua sendo o contrato de negócio, **renderizado por transporte**: REST devolve o envelope direto (com HTTP status); MCP renderiza sucesso → `result` num bloco `text` (JSON) e falha → `isError: true` com `{ code, message, details }`. Mapeamento único em `backend/src/shared/error-mapping.ts`. Validação fica nos handlers, preservando `VALIDATION_INVALID_FORMAT` e os códigos `BUSINESS_*`. Erros de **protocolo** (JSON-RPC) ficam no campo `error` do JSON-RPC. | 14 |
| **`ingest` reposicionado.** Rota movida de `POST /api/v1/mcp` para **`POST /api/v1/mcp/ingest`** (simétrico a `query`/`curation`). O `llm_run_id` deixa de ser **header ambiente** (`X-LLM-Run-Id`) e passa a ser **argumento de ferramenta** no schema MCP de cada `propose_*` (Opção B); o modelo per-session (`session-factory.ts`) é **aposentado** (endpoint stateless single-shape). O `ingest` é reconhecido como **dual** (espelhos REST `propose-*`), revogando o rótulo "exclusivo MCP / MCP-only" do §2/§14/A28. | 2, 14, A28 |
| **BR-21/23/24/28 reconciliadas** na back-spec `domains/ingestion/back/ingestion.back.md` (v1.2.4): tools sempre listadas; chamada sem `llm_run_id` válido (apontando a um `LLMRun` `running`) → `STRUCTURAL_INVALID` `isError`; um `tool_call` é gravado em todo caminho alcançável (a exceção "pré-handler sem run" foi retirada). | 14 |
| **Sequência da migração** (fases 1-4, todas em `main`): unificação dos mappers de erro + `toMcpToolResult`; `query`, `curation` e `ingest` migrados ao kernel. Suíte verde; `@modelcontextprotocol/sdk` adicionado ao `backend`. CLAUDE.md atualizado em paralelo. | 2, 14, A28 |

## Apêndice C — Emenda v7.3 (2026-06-16): sucessão encerra só o eixo de validade

> Emenda aditiva à v7. Corrige uma **inconsistência interna** entre C4, a consulta (b) (seção 5.3)
> e C7: a sucessão funcional (§6.5-A) gravava `superseded_at = now()` na versão antiga, mas a
> consulta (b) filtra `superseded_at IS NULL` — então a versão antiga, verdadeira na sua janela,
> ficava **invisível** à viagem no tempo de validade, tornando **C7 inalcançável**. Confirmado por
> teste determinístico contra Postgres real (`temp/e2e/succession-e2e.mts`). **Não altera** o
> schema, o catálogo, nem as outras validações (seção 13) — apenas a semântica de **escrita** da
> sucessão e o texto que a descrevia. Restaura a distinção da seção 5.6 (conflito ≠ mudança ≠
> correção): **sucessão = eixo de validade; correção = eixo de transação**.

| Mudança | Seções afetadas |
|---|---|
| **Sucessão fecha o eixo de validade.** A versão antiga recebe `valid_to = data_da_mudança` e `status = superseded`, mas **`superseded_at` permanece NULL** — permanece visível à consulta (b) em `[valid_from, valid_to)` (satisfaz C7) e fora da visão atual (a) (tem `valid_to`). A correção (§6.5-B) segue **inalterada** (eixo de transação, `valid_to` intocado). | 5.3, 5.6, 6.5-A, C4, C7 |
| **Exceção intra-day.** Quando `valid_from ≥ data_da_mudança` (sucessão no mesmo dia, granularidade de dia da seção 5.1), um `valid_to` colapsaria o intervalo `[D, D)` (viola o CHECK `valid_from < valid_to`); só nesse caso a linha antiga é encerrada no eixo de **transação** (`superseded_at = now()`, `valid_to` intocado), como na correção. C7 é inalcançável para sucessão sub-dia (limitação documentada); a linhagem `supersedes_*` ainda ordena as versões. | 5.1, 6.5-A |
| **Realização.** Uma única função `closeVigentForSuccession` (`backend/src/modules/ingestion/service/graph-consolidation.service.ts`), compartilhada por link e atributo: `superseded_at` passa a ser condicional (`CASE`: intra-day → `now()`; normal → permanece NULL). Sem migração de schema (dup-guard, CHECKs e `is_current`/`effective_status` preservados). Verificado: suíte 667/667 + `tsc` limpo; cenários A (normal, C7 verde) e B (intra-day, eixo de transação) verdes contra Postgres real. | 6.5-A |

## Apêndice C — Emenda v7.4 (2026-06-17): ferramenta `ingest_document` (ingestão one-shot via MCP)

> Emenda aditiva à v7. Adiciona **uma** ferramenta ao toolset `ingest` para que um cliente MCP
> externo (ex.: Claude Desktop) ingira um documento inteiro numa única chamada. **Não altera** o
> modelo de dados, o schema, os cenários de aceitação, nem as validações de negócio (seção 13): a
> nova ferramenta **compõe** duas capacidades já existentes — intake (UC-01) + extração (UC-12) —
> sobre o mesmo orquestrador e a mesma camada de serviço. Fora do escopo: o carve-out de
> autenticação `LOCAL_OPERATOR_TOKEN` (dev-only), registrado na back-spec `knowledge-graph.back.md`
> (BR-01) e no CLAUDE.md — **não** altera o contrato de produção do §2.5 (JWT continua obrigatório
> em produção).

| Mudança | Seções afetadas |
|---|---|
| **`ingest_document` adicionada ao toolset `ingest`** (§14.1): ferramenta one-shot que recebe `{ content, source_type, metadata?, model?, prompt_version? }`, **cria** `RawInformation` + chunks + `LLMRun` (UC-01) e **dispara a extração server-side** (o orquestrador interno, UC-12 / BR-26), devolvendo `{ outcome: "ingested" \| "already_ingested", raw_information_id, llm_run_id, chunk_count, run? }`. Quem extrai é o LLM do **servidor** (chave Anthropic do BFF — A28 / BR-29); o cliente só entrega o conteúdo, preservando a regra inegociável (seção 2). Idempotente via `content_hash` UNIQUE (seção 8): conteúdo já ingerido → `already_ingested`, sem re-extração. Distinta das 4 `propose_*` (que operam **dentro** de um run — BR-21): é uma ferramenta de **ciclo-de-vida**, sem `llm_run_id` de entrada. | 14, A28 |
| **§14.1 reescrito em dois níveis** (`propose_*` × `ingest_document`); tabela de topologia do §14 e A28 atualizadas para listar a nova ferramenta. | 2, 14, A28 |
| **Back-spec correspondente**: `domains/ingestion/back/ingestion.back.md` v1.2.5 — novo **BR-30** (`ingest_document`: composição UC-01+UC-12, idempotência `noop_existing`, defaults de `model`/`prompt_version`, mapeamento de erro provider/extraction → envelope `ok:false`); nota na UC-12 da `ingestion.spec.md`. Síncrono e LLM-bound (mesma nota de latência da UC-12: a conexão HTTP fica aberta durante toda a extração — minutos para documentos longos). | 14 |

## Apêndice C — Emenda v7.5 (2026-06-17): transporte MCP local via stdio (terceiro transporte)

> Emenda aditiva à v7. Adiciona um **terceiro transporte MCP** — local, sobre stdio — que expõe
> os toolsets `query` e `ingest` ao cliente MCP local (ex.: Claude Desktop) sem passar pelo
> Fastify e sem porta de rede. **Não altera** o modelo de dados, o schema, o catálogo de
> ferramentas (§14), os cenários de aceitação, nem as validações de negócio (§13) — apenas a
> **topologia de transportes** (§2, §14) e a **fronteira de acesso** para o caso local (§2.5,
> A29). Reconcilia o §2 (transportes: dois HTTP MCP → **três**, sendo o terceiro local stdio), o
> §14 (topologia / catálogo) e o §2.5 / A29 (auth-as-gate **não se aplica** a um processo local
> sobre stdio — o dono do processo do SO local **é** a fronteira de confiança, mesmo modelo de
> uma ferramenta local sobre stdio como `psql`).

> **Regra inegociável preservada.** A LLM continua agindo **somente** através das ferramentas MCP
> validadas — nunca tocando o banco diretamente (§2). O carve-out cobre apenas a **porta de
> acesso de rede** (que é inexistente no caso stdio); a pilha de validação (`assertRunIsRunning`,
> validação em 5 camadas, proveniência) é idêntica à dos transportes HTTP.

| Mudança | Seções afetadas |
|---|---|
| **Terceiro transporte MCP — local stdio.** Adicionado um novo ponto de entrada `backend/src/mcp-stdio.ts`: carrega env + pool `pg` + ambos os catálogos (`knowledge-graph` + `ingestion`), registra os toolsets `query` (`QUERY_TOOL_NAMES` + `QUERY_RETRIEVAL_TOOL_NAMES`) e `ingest` (`INGEST_TOOL_NAMES` + `ingest_document`) num registro `McpServer` fresco, e conecta um `Server` low-level do `@modelcontextprotocol/sdk` a `StdioServerTransport`. Escopo: somente os toolsets `query` e `ingest` (o toolset `curation` permanece HTTP-only nesta emenda — diferido). | 2, 14, A28 |
| **Topologia de §14 atualizada (informacional).** Os toolsets `query` e `ingest` continuam expostos em suas rotas HTTP (`POST /api/v1/mcp/query`, `POST /api/v1/mcp/ingest`) e passam a ser **adicionalmente** alcançáveis pelo transporte local stdio. Mesma camada de serviço, mesmos handlers, mesmo envelope (§14 — "REST e MCP são fachadas finas sobre a mesma lógica, nunca lógicas paralelas"; agora o stdio é a terceira fachada fina sobre essa mesma lógica). Conjunto fechado por construção por endpoint — o `mcp-stdio.ts` registra somente `query` + `ingest`. | 14, A28 |
| **`ListTools`/`CallTool` extraídos para um construtor compartilhado.** O *wiring* `ListTools`/`CallTool` + o mapeamento de envelope que vivia em `mountMcpEndpoint` (`backend/src/mcp/sdk-http-transport.ts`) é extraído para um construtor compartilhado consumido pelos **dois** transportes (HTTP e stdio) — refator preservador de comportamento; os testes MCP HTTP existentes permanecem verdes. Nenhuma duplicação de lógica de fio entre os dois transportes. | A28 |
| **Fronteira de acesso — §2.5 / A29 com carve-out local.** O contrato `Supabase Auth → Neon Auth` (JWT validado no middleware do BFF) **continua sendo o único portão** para os transportes HTTP — REST e os dois MCP HTTP (`/mcp/ingest`, `/mcp/query`, `/mcp/curation`). O transporte **stdio** é LOCAL-ONLY: não tem superfície HTTP, não tem header `Authorization`, não tem JWT para validar; o middleware `requireNeonAuth` **nunca é alcançado** porque o transporte não passa pelo Fastify. A fronteira de confiança é o **dono do processo do SO local** (mesmo modelo de uma ferramenta local sobre stdio como `psql`). Este carve-out é **estritamente local**: não enfraquece nem altera o §2.5 / A29 para a superfície de rede. O carve-out dev-only `LOCAL_OPERATOR_TOKEN` (registrado na back-spec `knowledge-graph.back.md` BR-01 desde v1.3.0) permanece **válido e independente** — ele é o mecanismo de carve-out **HTTP** (bearer estático em `NODE_ENV=development`); o carve-out de Emenda v7.5 é o mecanismo de carve-out **stdio** (sem HTTP, sem bearer). | 2.5, A28, A29 |
| **Invariante de implementação — logger no STDERR.** O ponto de entrada stdio **deve** afixar o `pino` em `process.stderr` antes de emitir qualquer log. `stdout` é o canal do protocolo MCP (frames JSON-RPC); um log do `pino` despejado em `stdout` corromperia o stream de frames (falha silenciosa no cliente). Esta é uma invariante load-bearing do transporte stdio, registrada como restrição técnica nas back-specs (`knowledge-graph.back.md` §7, `ingestion.back.md` BR-21/BR-28). | 14 |
| **Back-specs correspondentes.** `domains/knowledge-graph/back/knowledge-graph.back.md` v1.4.0 (atualiza §1 Stack table — três transportes MCP; BR-01 com dois caminhos isentos de auth — `LOCAL_OPERATOR_TOKEN` HTTP + stdio local; BR-23 com bullet stdio listando os dois toolsets `query` + `ingest`; §6 External Integrations com nova linha "MCP local stdio transport"; §7 com nova invariante stdio→stderr). `domains/ingestion/back/ingestion.back.md` v1.2.6 (atualiza §1 MCP-server e Auth rows; BR-21 / BR-28 / BR-30 com bullet stdio; §6 External Integrations divide a antiga linha "MCP transport" em "MCP HTTP transport" + "MCP local stdio transport"). **Sem mudança de schema, sem DDL, sem novo código de erro, sem mudança na superfície OpenAPI** — o stdio consome o mesmo mapeamento de envelope (`backend/src/shared/error-mapping.ts`) e os mesmos códigos de erro verbatim. | — |
