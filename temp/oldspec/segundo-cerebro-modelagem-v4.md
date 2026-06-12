# Sistema de Segundo Cérebro — Modelagem v4 (Grafo + Full-text, bitemporal)

> **O que é este documento.** Especificação completa e autocontida do "segundo cérebro":
> um repositório de conhecimento pessoal/organizacional que recebe informação não
> estruturada, preserva o original, extrai conhecimento estruturado com uma LLM, organiza
> esse conhecimento como um **grafo temporal rastreável** e permite consultá-lo por **busca
> textual (full-text) + travessia de grafo**.
>
> Esta versão não depende de embeddings nem de banco vetorial: a LLM atua **apenas na
> ingestão** (extração) e a **consulta é 100% determinística**. O modelo foi desenhado para
> ser evoluível — adicionar busca semântica vetorial no futuro é uma operação **aditiva e
> não-disruptiva** (seção 14).

---

## 1. Objetivo

Construir um repositório de conhecimento que:

1. **Recebe** informação não estruturada (PDFs, e-mails, atas, artigos, transcrições,
   mensagens de chat etc.).
2. **Preserva** o conteúdo original, sem nunca perdê-lo ou sobrescrevê-lo.
3. **Extrai** conhecimento estruturado a partir desse conteúdo, usando uma LLM.
4. **Relaciona** conceitos entre si, formando um grafo de conhecimento.
5. **Mantém histórico temporal** das mudanças (bitemporal): separa "verdade atual" de
   "histórico de validade".
6. **Permite consultar** esse conhecimento por **busca textual e por grafo**, sempre citando
   a fonte.

Dois princípios atravessam todo o sistema:

- **Rastreabilidade:** todo fato remonta à fonte original que o sustenta.
- **Confiança explícita:** extração por LLM é probabilística; a incerteza é registrada, nunca
  escondida. Conflito e mudança são tratados como casos distintos; nada é descartado
  silenciosamente.

---

## 2. Arquitetura

```
LLM  ->  MCP Server  ->  Backend (Node.js / TypeScript)  ->  Banco de Dados
```

- A **LLM** lê o conteúdo e **sugere** conhecimento estruturado (nós, relações, atributos,
  fragmentos) chamando ferramentas tipadas.
- O **MCP Server** é a fronteira: a LLM só age através das ferramentas dele.
- O **Backend** **valida** (estrutura, regras, existência, confiança, proveniência, regras
  temporais) e decide o que persistir.
- O **Banco de Dados** **persiste** tudo de forma durável e auditável.

> **Regra inegociável:** a LLM **nunca** acessa o banco diretamente.

> **Nota de dependências:** o sistema **não depende de nenhum modelo de embedding** nem de
> banco vetorial. A LLM é usada **apenas na ingestão**. A consulta é determinística (full-text
> + grafo).

### 2.1 Fluxo dividido em duas camadas

- **Camada de ingestão (escrita):** transforma informação bruta em conhecimento estruturado.
  A LLM participa aqui.
- **Camada de consulta (leitura/retrieval):** responde perguntas via full-text + grafo. A LLM,
  quando presente, atua como **orquestradora/redatora**: chama ferramentas determinísticas de
  busca, recebe resultados + proveniência e compõe a resposta — ela **não** faz a recuperação
  "de cabeça".

---

## 3. Entidades

### 3.1 Camada de origem (a verdade bruta)

#### RawInformation
A informação original, exatamente como recebida. **Nunca é alterada nem apagada** (exceção
controlada na seção 9).

Campos:
- `id`
- `source_type` — tipo da origem (pdf, email, ata, chat, artigo, transcrição…)
- `content` **ou** `storage_ref` — o conteúdo inline ou referência ao blob armazenado
- `content_hash` — hash do conteúdo, base da idempotência (seção 8)
- `received_at` — quando o sistema recebeu
- `metadata` — JSON livre (autor, origem, título, etc.)

#### RawChunk
Um pedaço físico da `RawInformation` (página, parágrafo, trecho). Existe para fatiar documentos
grandes para a LLM e para ancorar a proveniência em um **trecho específico**.

Campos:
- `id`, `raw_information_id` (FK), `index`, `text`, `offset_start`, `offset_end`
- `chunking_version` — versão da estratégia de fatiamento usada (permite re-chunk coerente)
- `text_search` — **índice full-text** do `text` (ex.: coluna `tsvector` + índice GIN no
  Postgres, ou indexação em Elasticsearch/OpenSearch)
- `embedding` — **(reservado p/ futuro)** coluna/tabela prevista, **não preenchida** nesta fase
  (seção 14)

> **RawInformation 1:N RawChunk.**

---

### 3.2 Camada de extração (o que a LLM propôs)

#### InformationFragment
Uma afirmação atômica extraída pela LLM a partir de um ou mais `RawChunk`. É a **evidência** que
sustenta qualquer link ou atributo aceito.

Campos:
- `id`, `llm_run_id` (FK), `text`, `confidence` (0–1)
- `status` — `proposed` / `accepted` / `rejected` / `superseded`

#### FragmentSource *(tabela de associação)*
Liga um `InformationFragment` aos `RawChunk` que o sustentam (N:N).
Campos: `fragment_id` (FK), `raw_chunk_id` (FK).

---

### 3.3 Camada de conhecimento consolidado (o grafo)

#### KnowledgeNode
Um conceito consolidado (pessoa, projeto, organização, conceito, cargo, categoria…).

Campos:
- `id`, `node_type_id` (FK)
- `canonical_name` — nome canônico/normalizado (resolução de entidade, seção 4)
- `aliases` — lista de nomes alternativos
- `name_search` — **índice full-text** sobre `canonical_name` + `aliases` (apoia a resolução de
  entidade e a busca textual por nó)
- `embedding` — **(reservado p/ futuro)** previsto, não preenchido nesta fase
- `status` — `active` / `needs_review` / `merged` (seção 4) / `deleted`
- `created_at`, `updated_at`

#### NodeType
Categoria do nó (Person, Project, Organization, Concept, Role, Category, …).
Campos: `id`, `name`, `description`, `version`.

#### NodeAttribute
Atributo **temporal** de um nó — onde moram os **valores literais** (datas, números, textos,
booleanos). Carrega a mesma maquinaria temporal e de linhagem dos links (seções 5 e 6).

Campos:
- `id`, `node_id` (FK)
- `key` — nome do atributo (ex.: `deadline`, `status_text`, `budget`)
- `value` — o valor literal
- `value_type` — tipo do valor (`date`, `number`, `text`, `bool`)
- **campos temporais** (seção 5): `valid_from`, `valid_to`, `recorded_at`, `superseded_at`
- `status` — enum da seção 6.4
- `confidence` (0–1)
- `created_by_run_id` (FK → `LLMRun`)
- `supersedes_attribute_id` (FK → `NodeAttribute`, nullable) — linhagem explícita: aponta para a
  versão anterior que este atributo substituiu (seção 6.3)
- `created_at`, `updated_at`

#### KnowledgeLink
Relação **direcionada** entre dois nós, temporal, com proveniência e linhagem.

Campos:
- `id`, `source_node_id` (FK), `target_node_id` (FK), `link_type_id` (FK)
- **campos temporais** (seção 5): `valid_from`, `valid_to`, `recorded_at`, `superseded_at`
- `status` — enum da seção 6.4
- `confidence` (0–1)
- `created_by_run_id` (FK → `LLMRun`) — qual execução criou este link (auditoria direta)
- `supersedes_link_id` (FK → `KnowledgeLink`, nullable) — linhagem explícita: aponta para a
  versão anterior que este link substituiu (seção 6.3)
- `created_at`, `updated_at`

> **`is_current` é derivado, não armazenado** (seção 5.2). Não existe coluna `is_current` em
> `KnowledgeLink` nem em `NodeAttribute`.

#### Provenance *(tabela de associação)*
Liga cada `KnowledgeLink` **e** cada `NodeAttribute` aos `InformationFragment` que o justificam
(N:N). Torna a rastreabilidade **executável**.
Campos: `id`, `link_id` (FK, nullable), `attribute_id` (FK, nullable), `fragment_id` (FK).
*(Exatamente um entre `link_id`/`attribute_id` é preenchido por linha.)*

#### LinkType
Define a semântica e as **regras temporais** de uma relação.

Campos:
- `id`, `name`, `label`, `description`, `version`
- `inverse_name` — nome da relação no sentido inverso (para navegar o grafo nos dois sentidos)
- `is_temporal` — se relações deste tipo carregam ciclo de vida temporal (sucessão/encerramento).
  Tipos estáveis (ex.: `has_name`, `is_of_type`) têm `is_temporal = false`.
- `allows_multiple_current` — se pode haver **mais de uma** instância atual entre o mesmo par/
  origem (multi-valor) ou só **uma** (funcional)
- `requires_valid_from` — se `valid_from` é obrigatório na criação
- `requires_valid_to_on_change` — se, ao ser substituído, o link antigo precisa receber
  `valid_to` (e não só `superseded_at`)

#### LinkTypeRule
Regras de quais tipos de nó podem ser ligados por qual relação (validação estrutural do grafo).
Campos: `id`, `link_type_id` (FK), `source_node_type_id` (FK), `target_node_type_id` (FK),
`cardinality`, `valid_from`, `valid_to`.

---

### 3.4 Camada de auditoria (o que aconteceu)

#### LLMRun
Uma execução de extração da LLM.
Campos: `id`, `model`, `prompt_version`, `started_at`, `finished_at`, `status`,
`input_raw_information_id` (FK), `idempotency_key`.

#### ToolCall
Cada chamada de ferramenta MCP feita pela LLM, com seu resultado de validação.
Campos: `id`, `llm_run_id` (FK), `tool_name`, `arguments`, `result`, `validation_outcome`,
`created_at`.

---

## 4. Resolução de Entidade

**Problema:** garantir que "Projeto Apollo" em dois documentos vire o **mesmo** `KnowledgeNode`.

**Como o sistema resolve:**

1. **Normalização** do nome (caixa, acentos, espaços) gera uma chave de comparação.
2. **Matching de candidatos** — ao consolidar um fragmento, o backend procura nós existentes por:
   - (a) `canonical_name` (igualdade exata da chave normalizada);
   - (b) `aliases`;
   - (c) **similaridade textual aproximada** — *fuzzy matching* léxico: trigramas
     (`pg_trgm` / Jaccard), distância de Levenshtein, ou busca full-text sobre `name_search`.
3. **Decisão:**
   - Match forte → reaproveita o nó e adiciona alias se preciso.
   - Match ambíguo → cria com `status = needs_review` para curadoria humana.
   - Sem match → cria nó novo.
4. **Merge de nós:** reaponta `KnowledgeLink`/`NodeAttribute` do nó absorvido para o
   sobrevivente, registra aliases, marca o absorvido com `status = merged` (tombstone) e mantém
   referência ao sobrevivente.

> **Estratégia de similaridade isolada atrás de uma interface.** O passo (c) é um **ponto de
> extensão** ("estratégia de similaridade"). Permite trocar/empilhar implementações sem mexer no
> resto. Quando embeddings entrarem, a similaridade vetorial vira **mais um sinal somado** a
> (a)/(b)/(c) — o fluxo de decisão do passo 3 **não muda** (seção 14).

> **Limitação assumida e honesta:** *fuzzy* léxico casa variações de grafia
> ("apollo"/"Apollo Project") mas **não** casa sinônimos sem sobreposição de caracteres
> ("Projeto Apollo" vs. "Iniciativa Lunar"). Esses casos caem em `needs_review` — e são
> exatamente os que a fase de embeddings melhora.

---

## 5. Modelo Temporal (bitemporal)

O coração do modelo: separar **"verdade atual"** de **"histórico de validade"**. A regra
principal é simples — **nada relevante é sobrescrito; o que muda no tempo é encerrado, e uma nova
versão passa a valer.** Vale igualmente para `KnowledgeLink` e `NodeAttribute`.

### 5.1 Dois eixos de tempo

- **Tempo de validade** (`valid_from`, `valid_to`): quando o fato é/foi verdade **no mundo real**.
- **Tempo de transação** (`recorded_at`, `superseded_at`): quando o sistema **soube/registrou** o
  fato e quando deixou de considerá-lo a versão corrente.

Exemplo clássico (por que os dois eixos importam):

> João saiu do projeto em **01/05** (verdade no mundo), mas a ata só chegou ao sistema em
> **10/05**. Registra-se `valid_to = 2026-05-01` e `recorded_at = 2026-05-10`. Sem os dois
> eixos, a auditoria não consegue reconstruir "o que o sistema sabia em 05/05".

### 5.2 `is_current` é **derivado**, não armazenado

```
is_current  ≡  valid_to IS NULL AND superseded_at IS NULL
```

Não há coluna `is_current`. Isso elimina a anomalia de atualização (dois registros marcados como
"atuais" por esquecimento). Consultas usam a expressão acima — exposta convenientemente por uma
*view* ou coluna gerada/índice parcial.

- **Consulta atual:** `WHERE valid_to IS NULL AND superseded_at IS NULL`
- **Consulta histórica (estado em uma data D, na visão atual do mundo):**
  `WHERE valid_from <= D AND (valid_to IS NULL OR valid_to >= D)`

### 5.3 Sucessão depende da cardinalidade (`allows_multiple_current`)

- **Funcional** (`allows_multiple_current = false`, ex.: `has_deadline`): registrar um novo valor
  **encerra** o anterior.
- **Multi-valor** (`allows_multiple_current = true`, ex.: `participates_in`): novos vínculos
  **coexistem** com os existentes.

### 5.4 Conflito ≠ Mudança

- Período **posterior** → **sucessão** (5.3): a informação mudou ao longo do tempo.
- Mesmo período, valores divergentes → **conflito**: ambos registrados com `status = disputed`;
  `confidence` + fonte ajudam a curadoria. **Nada é descartado silenciosamente.**

---

## 6. Ciclo de vida, status e linhagem

### 6.1 Literal vs. entidade — a regra de modelagem

Esta é a decisão que define onde cada informação mora:

- **Valor escalar/literal** (data, número, texto livre, booleano) → **`NodeAttribute` temporal**.
  Não vira nó. Ex.: `Projeto Apollo` tem atributo `deadline = 2026-06-30`.
- **Entidade referenciável** (algo que você quer apontar de vários lugares, ou que vem de um
  vocabulário controlado — pessoa, cargo, categoria, status canônico) → **nó + `KnowledgeLink`
  temporal**. Ex.: `Pessoa João` —`ocupa cargo`→ `Cargo Gerente`.

> **Por que não "tudo é link":** transformar todo valor em link exigiria criar um nó para cada
> data/número/texto, gerando explosão de nós e uma "resolução de entidade" sem sentido para
> literais. A história é preservada igualmente bem em `NodeAttribute`, que é **temporal por
> construção** (mesmos campos das seções 5 e 6).

> **Critério prático de decisão:** *"Eu vou querer ligar outras coisas a este valor, ou navegá-lo
> no grafo?"* — Sim → nó + link. Não → atributo.

### 6.2 Quando algo é temporal

`LinkType.is_temporal` declara se relações daquele tipo têm ciclo de vida temporal:

- **Temporais** (`is_temporal = true`): `participates_in`, `has_deadline`, `has_status`,
  `holds_role`, `reports_to`, `assigned_to`…
- **Estáveis** (`is_temporal = false`): `has_name`, `is_of_type`, `belongs_to_category`… Na
  prática, um link estável é apenas um que nunca é encerrado; declará-lo evita maquinaria e ruído
  desnecessários e permite validação específica.

Atributos seguem o mesmo espírito: a maioria é temporal; os imutáveis simplesmente nunca recebem
sucessor.

### 6.3 Linhagem entre versões (`supersedes_*`)

`superseded_at` responde *quando* uma versão deixou de valer; o ponteiro de linhagem responde
*qual* versão a substituiu. Ambos existem:

- `KnowledgeLink.supersedes_link_id` → aponta para o link anterior.
- `NodeAttribute.supersedes_attribute_id` → aponta para o atributo anterior.

Isso permite reconstruir a cadeia completa (`deadline 30/06 → 15/07 → 01/08`) navegando os
ponteiros.

### 6.4 Status (enum compartilhado por links e atributos)

| Status | Significado |
|--------|-------------|
| `active` | Vigente e aceito. |
| `inactive` | Encerrado por validade (`valid_to` no passado), sem sucessor explícito. |
| `superseded` | Substituído por uma versão posterior (ver `supersedes_*`). |
| `disputed` | Em conflito com outra versão no **mesmo** período (seção 5.4). |
| `uncertain` | Aceito provisoriamente com confiança abaixo do ideal; aguarda corroboração. |
| `deleted` | Removido por apagamento controlado e auditado (seção 9). |

> Alinhado ao `status` de `InformationFragment` (`proposed`/`accepted`/`rejected`/`superseded`) e
> ao de `KnowledgeNode` (`active`/`needs_review`/`merged`/`deleted`) — um único vocabulário
> coerente em todo o sistema.

### 6.5 Regra de negócio para substituição

Quando a LLM identifica uma relação/atributo que substitui um anterior, o **backend** executa de
forma transacional:

1. **Buscar** o registro atual equivalente (mesma origem/tipo, `is_current` verdadeiro).
2. **Encerrar** o antigo: define `valid_to = data_da_mudança` (se
   `requires_valid_to_on_change`), `superseded_at = now`, `status = superseded`.
3. **Criar** o novo: `valid_from = data_da_mudança`, `status = active`.
4. **Ligar** os dois: `novo.supersedes_link_id = antigo.id` (ou `supersedes_attribute_id`).
5. **Registrar proveniência** do novo (`Provenance` → fragmento real).

> Para tipos **multi-valor** (`allows_multiple_current = true`), o passo 2 **não** ocorre: o novo
> vínculo coexiste com os existentes.

**Exemplo (atributo funcional — deadline):**

```
NodeAttribute (antigo):  node=Projeto Apollo  key=deadline  value=2026-06-30
  valid_from=2026-01-10  valid_to=2026-06-10  superseded_at=2026-06-10  status=superseded
NodeAttribute (novo):    node=Projeto Apollo  key=deadline  value=2026-07-15
  valid_from=2026-06-10  valid_to=null        superseded_at=null        status=active
  supersedes_attribute_id = <id do antigo>
```

**Exemplo (link multi-valor — participação):**

```
KnowledgeLink:  João --participates_in--> Apollo   valid_from=2026-01-10  valid_to=2026-05-30  status=inactive
KnowledgeLink:  Maria --participates_in--> Apollo  valid_from=2026-06-01  valid_to=null        status=active
```

(Os dois coexistiram entre 01/06 e nenhum encerrou o outro; João saiu por validade, não por
sucessão.)

---

## 7. Camada de Consulta / Retrieval

Dois modos de recuperação, combináveis:

1. **Busca textual (full-text)** — sobre `RawChunk.text_search`, `KnowledgeNode.name_search` e
   `InformationFragment.text`. Resolve termos e expressões.
2. **Travessia de grafo** — a partir de um nó, percorrer `KnowledgeLink` (usando `inverse_name`
   para navegar nos dois sentidos), **filtrando pelo tempo** (seção 5): estado atual
   (`valid_to IS NULL AND superseded_at IS NULL`) ou estado histórico em uma data.

Toda resposta pode citar a **proveniência** (`Provenance` → `FragmentSource` → `RawChunk` →
`RawInformation`), então o usuário sempre vê *de onde* veio cada afirmação.

> **Recuperação por significado livre (sinônimos/paráfrases) NÃO está disponível nesta fase** —
> é o que a busca semântica vetorial adiciona (seção 14). Mitigação léxica opcional até lá:
> expansão de sinônimos / dicionário de termos no índice full-text.

---

## 8. Idempotência e Reprocessamento

- **Ingestão idempotente:** `RawInformation.content_hash` impede duplicar a mesma entrada.
- **Run idempotente:** `LLMRun.idempotency_key` impede reexecutar a mesma extração.
- **Reprocessamento intencional** cria um novo `LLMRun`; a resolução de entidade (seção 4) funde
  o resultado com o existente em vez de duplicar.

> **Back-fill futuro:** quando embeddings entrarem, o reprocessamento é o mecanismo natural de
> back-fill — re-fatiar/re-embeddar documentos antigos sob um novo `LLMRun`, **sem tocar a
> verdade bruta** (seção 14).

---

## 9. Imutabilidade vs. LGPD

- **Imutabilidade é o padrão.** `RawInformation` não é alterada nem apagada no curso normal.
- **Apagamento controlado** quando exigido por lei/direito do titular: via *crypto-shredding*
  (descarte da chave) ou *tombstone/redação* do conteúdo, propagando `status = deleted` aos
  derivados afetados.
- **Apagamento auditado:** registra quem, quando e por quê.

---

## 10. Evolução de Schema

- `NodeType`, `LinkType`, `LinkTypeRule` têm `version` e/ou campos temporais.
- Mudar uma regra **não invalida** dados criados sob a regra antiga.
- A validação usa a regra **vigente no momento em que o link/atributo foi criado**.

---

## 11. Validação e Segurança no Backend

Validação em camadas, na ordem:

1. **Estrutural** — campos obrigatórios, tipos, FKs existentes.
2. **Regras de grafo** — `LinkTypeRule` (tipos de nó compatíveis) e `cardinality`.
3. **Regras temporais** — `requires_valid_from`, `requires_valid_to_on_change`, coerência de
   `valid_from <= valid_to`, e aplicação da sucessão conforme `allows_multiple_current`
   (seção 6.5).
4. **Confiança** — abaixo do mínimo → `proposed`/`needs_review`/`uncertain`.
5. **Anti-alucinação** — todo link/atributo aceito **tem** `Provenance` apontando para um
   `InformationFragment` real, ancorado em `RawChunk` real.

**Segurança contra prompt injection:** ferramentas restritas e tipadas no MCP; toda chamada é
validada; o conteúdo de qualquer documento é tratado como **dado**, nunca como instrução.

---

## 12. Princípios

1. A informação original nunca é perdida — exceto apagamento controlado e auditado (seção 9).
2. A LLM **sugere**.
3. O backend **valida** (estrutura, regras de grafo, regras temporais, confiança, proveniência).
4. O banco **persiste**.
5. **Entidades referenciáveis** são `KnowledgeNode`; **valores literais** são `NodeAttribute`
   (seção 6.1).
6. **Relações entre entidades** são `KnowledgeLink`.
7. Toda informação mutável é **bitemporal**, em links **e** atributos; **`is_current` é derivado**.
8. Toda versão substituída mantém **linhagem explícita** ao sucessor (`supersedes_*`).
9. Todo conhecimento é **rastreável até a origem** (`Provenance` → `FragmentSource` → `RawChunk`
   → `RawInformation`).
10. Toda afirmação carrega **confiança explícita**; **conflito** e **mudança** são casos
    distintos.
11. A mesma entidade no mundo real corresponde a **um único** `KnowledgeNode`.
12. O sistema **responde consultas por busca textual e por grafo**, sempre citando a fonte.

---

## 13. Resumo do modelo de dados

| Entidade | Papel | Temporal? | Proveniência? |
|----------|-------|-----------|---------------|
| `RawInformation` | Fonte original imutável | — | é a origem |
| `RawChunk` | Pedaço fatiado + índice full-text | — | é a âncora |
| `InformationFragment` | Afirmação atômica (evidência) | status | liga a `RawChunk` |
| `KnowledgeNode` | Entidade/conceito | `created/updated` | — |
| `NodeAttribute` | **Valor literal temporal** de um nó | **sim** + linhagem | sim |
| `KnowledgeLink` | **Relação temporal** entre nós | **sim** + linhagem | sim |
| `NodeType` / `LinkType` / `LinkTypeRule` | Schema e regras (inclui `is_temporal`, cardinalidade) | versionado | — |
| `LLMRun` / `ToolCall` | Auditoria da extração | timestamps | — |

Regra de ouro: **valor literal → `NodeAttribute` temporal; entidade → nó + `KnowledgeLink`
temporal.** Em ambos os casos, mudança = encerrar + criar novo + ligar por linhagem; nada é
sobrescrito.

---

## 14. Caminho de evolução para embeddings

**Sim, e de forma aditiva.** Embedding é um **dado derivado**, não uma entidade nova — então se
*pendura* no modelo sem reescrevê-lo. Plano de migração, em ordem:

1. **Escolher e plugar um modelo de embedding** (local/gratuito — ex.: Sentence-Transformers — ou
   API como Voyage AI). Não exige LLM generativa.
2. **Preencher os campos já reservados:** popular `RawChunk.embedding` e `KnowledgeNode.embedding`.
   Para o acervo existente, é um **back-fill via reprocessamento** (seção 8): um novo
   `LLMRun`/job percorre chunks e nós antigos e calcula os vetores. **A verdade bruta não é
   tocada.**
3. **Adicionar o índice vetorial** (ex.: `pgvector` ou índice ANN dedicado) **ao lado** dos
   índices full-text — sem remover os existentes.
4. **Ligar o 3º modo de consulta:** busca semântica vetorial passa a coexistir com full-text e
   grafo; consultas podem combinar os três (busca híbrida).
5. **Ativar o sinal vetorial na resolução de entidade (§4, passo c):** a similaridade de
   embedding entra como **mais um sinal** — o fluxo de decisão **não muda**. Ganho direto: casar
   sinônimos sem sobreposição léxica que hoje caem em `needs_review`.

**Por que não quebra nada:**
- Nenhum campo existente muda de tipo ou semântica; só se **preenche** o que estava reservado.
- Full-text e grafo continuam funcionando — embedding **soma**, não substitui.
- Proveniência, bitemporalidade, linhagem e validação são ortogonais a embeddings — intactas.
- A reingestão idempotente garante que o back-fill funda o resultado em vez de duplicar.

**Terreno já preparado nesta fase:**
- Colunas `embedding` previstas (nuláveis) em `RawChunk` e `KnowledgeNode`.
- Resolução de entidade com o passo (c) **isolado atrás de uma interface** ("estratégia de
  similaridade").
- `chunking_version` em `RawChunk` para permitir re-chunk + re-embed coerentes.

> Em resumo: **comece com grafo + full-text (custo zero de IA na consulta) e evolua para busca
> híbrida quando precisar de significado livre — sem refazer o modelo.**
