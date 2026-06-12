# Sistema de Segundo Cérebro — Modelagem v3 (Grafo + Full-text, sem embeddings)

> **O que é este documento.** Esta é a terceira versão da modelagem do "segundo cérebro".
> Ela **deriva diretamente da v2** ([[segundo-cerebro-modelagem-v2]]) e faz **uma única mudança
> de escopo**: remove a dependência de **embeddings / busca vetorial** do caminho crítico,
> entregando a recuperação por **busca textual (full-text) + travessia de grafo**.
>
> Tudo o que tornava a v2 robusta — preservação do bruto, proveniência executável,
> bitemporalidade, resolução de entidade, idempotência, LGPD, evolução de schema e validação
> em camadas — **permanece intacto**. A v3 foi desenhada para ser **evoluível**: adicionar
> embeddings no futuro é uma operação **aditiva e não-disruptiva** (ver seção 13).
>
> Marcações usadas no texto:
> - **(mantido da v2)** — sem alteração de design.
> - **(alterado)** — mudou por causa da remoção de embeddings.
> - **(reservado p/ futuro)** — encaixe deixado pronto para a fase de embeddings.

---

## 1. Objetivo

Construir um repositório de conhecimento pessoal/organizacional que:

1. **Recebe** informação não estruturada (PDFs, e-mails, atas, artigos, transcrições etc.).
2. **Preserva** o conteúdo original, sem nunca perdê-lo ou sobrescrevê-lo.
3. **Extrai** conhecimento estruturado a partir desse conteúdo, usando uma LLM.
4. **Relaciona** conceitos entre si, formando um grafo de conhecimento.
5. **Mantém histórico temporal** das mudanças (bitemporal).
6. **Permite consultar** esse conhecimento por **busca textual e por grafo** *(alterado — sem
   busca semântica vetorial nesta fase)*.

Os dois princípios atravessadores continuam valendo: **rastreabilidade** (todo fato remonta à
fonte) e **confiança explícita** (extração por LLM é probabilística; a incerteza é registrada).

---

## 2. Arquitetura *(mantido da v2)*

```
LLM  ->  MCP Server  ->  Backend (Node.js / TypeScript)  ->  Banco de Dados
```

- A **LLM** lê o conteúdo e **sugere** conhecimento estruturado (nós, relações, fragmentos).
- O **MCP Server** é a fronteira: a LLM só age através das ferramentas tipadas dele.
- O **Backend** **valida** (estrutura, regras, existência, confiança, proveniência) e decide o
  que persistir.
- O **Banco de Dados** **persiste** tudo de forma durável e auditável.

> **Regra inegociável:** a LLM **nunca** acessa o banco diretamente.

> **Nota de dependências (alterado):** nesta fase, o sistema **não depende de nenhum modelo de
> embedding** nem de banco vetorial. A LLM é usada **apenas na ingestão** (extração). A consulta
> é 100% determinística (full-text + grafo).

### 2.1 Fluxo dividido em duas camadas *(mantido da v2)*

- **Camada de ingestão (escrita):** transforma `RawInformation` em conhecimento estruturado.
- **Camada de consulta (leitura/retrieval):** responde perguntas via full-text + grafo.

---

## 3. Entidades

### 3.1 Camada de origem (a verdade bruta)

#### RawInformation *(mantido da v2)*
A informação original, exatamente como recebida. **Nunca é alterada nem apagada** (exceção
controlada na seção 8).

Campos: `id`, `source_type`, `content` ou `storage_ref`, `content_hash` (idempotência, seção 7),
`received_at`, `metadata`.

#### RawChunk *(alterado)*
Um pedaço físico da `RawInformation` (página, parágrafo, trecho). Existe para fatiar documentos
grandes para a LLM e para ancorar a proveniência em um **trecho específico**.

Campos:
- `id`, `raw_information_id` (FK), `index`, `text`, `offset_start`, `offset_end`
- `text_search` — **índice full-text** do `text` *(alterado — substitui o papel do embedding na
  recuperação; ex.: coluna `tsvector` + índice GIN no Postgres, ou indexação em
  Elasticsearch/OpenSearch)*
- `embedding` — **(reservado p/ futuro)** coluna/tabela deixada prevista, **não preenchida**
  nesta fase (ver seção 13).

> **RawInformation 1:N RawChunk.**

---

### 3.2 Camada de extração (o que a LLM propôs) *(mantido da v2)*

#### InformationFragment
Uma afirmação atômica extraída pela LLM a partir de um ou mais `RawChunk`.

Campos: `id`, `llm_run_id` (FK), `text`, `confidence` (0–1), `status`
(`proposed` / `accepted` / `rejected` / `superseded`).

#### FragmentSource *(tabela de associação)*
Liga um `InformationFragment` aos `RawChunk` que o sustentam (N:N).
Campos: `fragment_id` (FK), `raw_chunk_id` (FK).

---

### 3.3 Camada de conhecimento consolidado (o grafo)

#### KnowledgeNode *(alterado)*
Um conceito consolidado (pessoa, projeto, organização, conceito).

Campos:
- `id`, `node_type_id` (FK)
- `canonical_name` — nome canônico/normalizado (resolução de entidade, seção 4)
- `aliases` — lista de nomes alternativos
- `name_search` — **índice full-text** sobre `canonical_name` + `aliases` *(alterado — apoia a
  resolução de entidade e a busca textual por nó, no lugar da similaridade de embedding)*
- `embedding` — **(reservado p/ futuro)** previsto, não preenchido nesta fase
- `status` — inclui `needs_review` (seção 4)
- `created_at`, `updated_at`

> **Distinção entidade vs. valor (mantido da v2):** entidades reais são `KnowledgeNode`; valores
> literais (datas, números, textos) são **atributos** (`NodeAttribute`), nunca nós.

#### NodeType *(mantido da v2)*
Categoria do nó (Person, Project, Organization, Concept, ...).
Campos: `id`, `name`, `description`, `version`.

#### NodeAttribute *(mantido da v2)*
Atributo **temporal** de um nó — onde moram os valores literais.
Campos: `id`, `node_id` (FK), `key`, `value`, mais os **campos temporais** (seção 5).

#### KnowledgeLink *(mantido da v2)*
Relação **direcionada** entre dois nós, temporal e com proveniência.
Campos: `id`, `source_node_id` (FK), `target_node_id` (FK), `link_type_id` (FK), `confidence`,
campos **temporais** (seção 5).

#### LinkProvenance *(tabela de associação — mantido da v2)*
Liga cada `KnowledgeLink` (e cada `NodeAttribute`) aos `InformationFragment` que o justificam.
Torna a rastreabilidade **executável**.
Campos: `link_id` (FK, ou `attribute_id`), `fragment_id` (FK).

#### LinkType *(mantido da v2)*
Campos: `id`, `name`, `description`, `version`, `inverse_name`, `cardinality` (funcional /
multi-valor).

#### LinkTypeRule *(mantido da v2)*
Regras de quais tipos de nó podem ser ligados por qual relação.
Campos: `id`, `link_type_id` (FK), `source_node_type_id` (FK), `target_node_type_id` (FK),
`cardinality`, `valid_from`, `valid_to`.

---

### 3.4 Camada de auditoria (o que aconteceu) *(mantido da v2)*

#### LLMRun
Campos: `id`, `model`, `prompt_version`, `started_at`, `finished_at`, `status`,
`input_raw_information_id` (FK), `idempotency_key`.

#### ToolCall
Campos: `id`, `llm_run_id` (FK), `tool_name`, `arguments`, `result`, `validation_outcome`,
`created_at`.

---

## 4. Resolução de Entidade *(alterado — sem o sinal de embedding)*

**Problema (mantido):** garantir que "Projeto Apollo" em dois documentos vire o **mesmo** nó.

**Como o sistema resolve (alterado):**

1. **Normalização** do nome (caixa, acentos, espaços) gera uma chave de comparação.
2. **Matching de candidatos** *(alterado)* — ao consolidar um fragmento, o backend procura nós
   existentes por:
   - (a) `canonical_name` (igualdade exata da chave normalizada);
   - (b) `aliases`;
   - (c) **similaridade textual aproximada** — *fuzzy matching* léxico: trigramas
     (`pg_trgm` / similaridade de Jaccard), distância de Levenshtein, ou busca full-text sobre
     `name_search`. *(substitui a similaridade de embedding da v2)*
3. **Decisão (mantido):**
   - Match forte → reaproveita o nó e adiciona alias se preciso.
   - Match ambíguo → cria com `status = needs_review` para curadoria humana.
   - Sem match → cria nó novo.
4. **Merge de nós (mantido):** reaponta `KnowledgeLink`/`NodeAttribute` do nó absorvido para o
   sobrevivente, registra aliases, mantém tombstone.

> **Encaixe p/ futuro (reservado):** o passo (c) é um **ponto de extensão**. Quando embeddings
> entrarem, a similaridade vetorial vira **mais um sinal somado** a (a)/(b)/(c) — o fluxo de
> decisão do passo 3 **não muda**. Ver seção 13.

> **Limitação assumida e honesta:** *fuzzy* léxico casa variações de grafia
> ("apollo"/"Apollo Project") mas **não** casa sinônimos sem sobreposição de caracteres
> ("Projeto Apollo" vs. "Iniciativa Lunar"). Esses casos caem em `needs_review` para curadoria —
> e são exatamente os que a fase de embeddings melhora.

---

## 5. Modelo Temporal (bitemporal) *(mantido da v2, sem alterações)*

### 5.1 Dois eixos de tempo
- **Tempo de validade** (`valid_from`, `valid_to`): quando o fato é/foi verdade **no mundo**.
- **Tempo de transação** (`recorded_at`, `superseded_at`): quando o sistema **soube/registrou**.

### 5.2 `is_current` é **derivado**, não armazenado
Derivado de `valid_to IS NULL AND superseded_at IS NULL`.

### 5.3 Sucessão depende da cardinalidade
- **Funcional** (ex.: `has_deadline`): registrar novo valor encerra o anterior.
- **Multi-valor** (ex.: `participates_in`): novos vínculos coexistem com os existentes.

### 5.4 Conflito ≠ Mudança
- Período **posterior** → sucessão (5.3).
- Mesmo período divergente → **conflito**: ambos registrados como `conflicting`; `confidence` +
  fonte ajudam a curadoria. Nada é descartado silenciosamente.

---

## 6. Camada de Consulta / Retrieval *(alterado — dois modos)*

Dois modos de recuperação, combináveis:

1. **Busca textual (full-text)** — sobre `RawChunk.text_search`, `KnowledgeNode.name_search` e
   `InformationFragment.text`. Resolve termos e expressões. *(é a base nesta fase)*
2. **Travessia de grafo** — a partir de um nó, percorrer `KnowledgeLink` (usando `inverse_name`
   para navegar nos dois sentidos), **filtrando pelo tempo** (campos da seção 5).

> **Recuperação por significado livre (sinônimos/paráfrases) NÃO está disponível nesta fase** —
> ela é o que a busca semântica vetorial adiciona (seção 13). Mitigações léxicas opcionais até
> lá: expansão de sinônimos / dicionário de termos no índice full-text.

Toda resposta pode citar a **proveniência** (`LinkProvenance` → `FragmentSource` → `RawChunk`),
então o usuário sempre vê *de onde* veio cada afirmação.

---

## 7. Idempotência e Reprocessamento *(mantido da v2)*

- **Ingestão idempotente:** `RawInformation.content_hash`.
- **Run idempotente:** `LLMRun.idempotency_key`.
- **Reprocessamento intencional** cria novo `LLMRun`; a resolução de entidade (seção 4) funde o
  resultado com o existente.

> **Nota (reservado p/ futuro):** quando embeddings entrarem, o **reprocessamento é o mecanismo
> natural de back-fill** — re-fatiar/re-embeddar documentos antigos sob um novo `LLMRun` sem
> tocar a verdade bruta.

---

## 8. Imutabilidade vs. LGPD *(mantido da v2)*

- **Imutabilidade é o padrão.**
- **Apagamento controlado** via crypto-shredding ou tombstone/redação.
- Apagamento **auditado** (quem, quando, por quê).

---

## 9. Evolução de Schema *(mantido da v2)*

- `NodeType`, `LinkType`, `LinkTypeRule` têm `version` e campos temporais.
- Mudar uma regra **não invalida** dados criados sob a regra antiga.
- A validação usa a regra **vigente no momento em que o link foi criado**.

---

## 10. Validação e Segurança no Backend *(mantido da v2)*

Validação em camadas: (1) **estrutural**, (2) **regras** (`LinkTypeRule`/cardinalidade),
(3) **confiança** (abaixo do mínimo → `proposed`/`needs_review`), (4) **anti-alucinação**
(todo link/atributo aceito tem `LinkProvenance` apontando para um fragmento real).

**Segurança contra prompt injection:** ferramentas restritas e tipadas no MCP; toda chamada é
validada; conteúdo do documento é tratado como **dado**, nunca como instrução.

---

## 11. Princípios (revisados) *(alterado apenas no item 11)*

1. A informação original nunca é perdida — exceto apagamento controlado e auditado (seção 8).
2. A LLM **sugere**.
3. O backend **valida** (estrutura, regras, confiança, proveniência).
4. O banco **persiste**.
5. Toda **entidade** é um `KnowledgeNode`; **valores literais** são `NodeAttribute`.
6. Toda **relação** é um `KnowledgeLink`.
7. Toda informação mutável é **temporal** (bitemporal — links e atributos).
8. Todo conhecimento é **rastreável até a origem** (`LinkProvenance` → `FragmentSource` →
   `RawChunk` → `RawInformation`).
9. Toda afirmação carrega **confiança explícita**; conflito e mudança são tratados como casos
   distintos.
10. A mesma entidade no mundo real corresponde a **um único** `KnowledgeNode`.
11. O sistema **responde consultas por busca textual e por grafo**, sempre citando a fonte
    *(alterado — sem o modo semântico vetorial nesta fase)*.

---

## 12. O que muda em relação à v2

| # | Tema | Mudança na v3 |
|---|------|---------------|
| 1 | Busca semântica vetorial | **Removida desta fase** (seção 6) |
| 2 | `RawChunk.embedding` | **Reservado, não preenchido**; papel de recuperação assumido por `text_search` (full-text) |
| 3 | `KnowledgeNode.embedding` | **Reservado, não preenchido**; resolução de entidade usa fuzzy léxico + `name_search` |
| 4 | Resolução de entidade (§4) | Passo de similaridade de embedding → **fuzzy léxico** (trigram/Levenshtein/full-text); fluxo de decisão inalterado |
| 5 | Consulta (§6) | De três modos para **dois**: full-text + grafo |
| 6 | Dependências (§2) | **Nenhum** modelo de embedding ou banco vetorial necessário |
| 7 | Todo o resto | **Inalterado** (bruto, proveniência, bitemporalidade, idempotência, LGPD, schema, validação, segurança) |

---

## 13. Caminho de evolução para embeddings *(novo — responde "dá para avançar depois?")*

**Sim, e de forma aditiva.** Embedding é um **dado derivado**, não uma entidade nova — então
ele se *pendura* no modelo sem reescrevê-lo. Plano de migração, em ordem:

1. **Escolher e plugar um modelo de embedding** (pode ser local/gratuito — ex.: Sentence-
   Transformers — ou API como Voyage AI). Não exige LLM generativa.
2. **Preencher os campos já reservados:** popular `RawChunk.embedding` e `KnowledgeNode.embedding`.
   - Para o acervo já existente, isso é um **back-fill via reprocessamento** (seção 7): um novo
     `LLMRun`/job percorre chunks e nós antigos e calcula os vetores. **A verdade bruta não é
     tocada.**
3. **Adicionar o índice vetorial** (ex.: `pgvector`, ou um índice ANN dedicado) ao lado dos
   índices full-text — **sem remover** os existentes.
4. **Ligar o 3º modo de consulta (§6.1 da v2):** busca semântica vetorial passa a coexistir com
   full-text e grafo. Consultas podem combinar os três (busca híbrida).
5. **Ativar o sinal vetorial na resolução de entidade (§4, passo c):** a similaridade de
   embedding entra como **mais um sinal** no matching — o fluxo de decisão (match forte /
   ambíguo / sem match) **não muda**. Ganho direto: casar sinônimos sem sobreposição léxica que
   hoje caem em `needs_review`.

**Por que isso não quebra nada:**
- Nenhum campo existente muda de tipo ou semântica; só se **preenche** o que estava reservado.
- Os modos full-text e grafo continuam funcionando — embedding **soma**, não substitui.
- Proveniência, bitemporalidade e validação são ortogonais a embeddings — intactas.
- A reingestão idempotente garante que o back-fill funda o resultado em vez de duplicar.

**Recomendações para já deixar o terreno preparado nesta fase:**
- Manter as colunas `embedding` previstas (nuláveis) em `RawChunk` e `KnowledgeNode`.
- Manter a resolução de entidade com o passo (c) **isolado atrás de uma interface** ("estratégia
  de similaridade"), para trocar/empilhar implementações depois sem mexer no resto.
- Versionar a estratégia de fatiamento (`chunking`) para permitir re-chunk + re-embed coerentes.

> Em resumo: **comece com grafo + full-text (custo zero de IA na consulta) e evolua para busca
> híbrida quando precisar de significado livre — sem refazer o modelo.**
