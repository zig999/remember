# Sistema de Segundo Cérebro Baseado em Grafo de Conhecimento (v2)

> **O que é este documento.** Esta é a segunda versão da modelagem do "segundo cérebro".
> Ela parte da versão inicial e incorpora correções e melhorias identificadas em revisão:
> resolução de entidade, proveniência explícita, lado de consulta (retrieval), tratamento
> de conflito vs. mudança, bitemporalidade, segurança e conformidade (LGPD), entre outras.
> O texto foi escrito para ser entendido por quem nunca viu o projeto antes — cada decisão
> de modelagem vem acompanhada do **porquê**.

---

## 1. Objetivo

Construir um repositório de conhecimento pessoal/organizacional que:

1. **Recebe** informação não estruturada (PDFs, e-mails, atas, artigos, transcrições etc.).
2. **Preserva** o conteúdo original, sem nunca perdê-lo ou sobrescrevê-lo.
3. **Extrai** conhecimento estruturado a partir desse conteúdo, usando uma LLM.
4. **Relaciona** conceitos entre si, formando um grafo de conhecimento.
5. **Mantém histórico temporal** das mudanças — é possível saber não só o que é verdade
   hoje, mas o que era verdade (e o que acreditávamos ser verdade) em qualquer momento.
6. **Permite consultar** esse conhecimento depois (busca semântica, textual e por grafo) —
   afinal, um "segundo cérebro" só tem valor se conseguimos recuperar o que ele guarda.

Dois princípios atravessam tudo: **rastreabilidade** (todo fato deve poder ser explicado pela
fonte que o originou) e **confiança explícita** (extração por LLM é probabilística, então o
sistema registra o quão confiável cada afirmação é, em vez de tratar tudo como verdade absoluta).

---

## 2. Arquitetura

```
LLM  ->  MCP Server  ->  Backend (Node.js / TypeScript)  ->  Banco de Dados
```

- A **LLM** lê o conteúdo e **sugere** conhecimento estruturado (nós, relações, fragmentos).
- O **MCP Server** é a fronteira: expõe ferramentas (tools) que a LLM pode chamar. A LLM só
  age através dessas ferramentas.
- O **Backend** recebe as sugestões, **valida** (estrutura, regras, existência, confiança) e
  decide o que persistir.
- O **Banco de Dados** **persiste** tudo de forma durável e auditável.

> **Regra inegociável:** a LLM **nunca** acessa o banco diretamente. Ela só enxerga as
> ferramentas do MCP. Isso garante que toda escrita passe pela validação do backend e fique
> registrada na trilha de auditoria.

### 2.1 Fluxo dividido em duas camadas

É útil pensar o sistema em duas grandes camadas:

- **Camada de ingestão (escrita):** transforma `RawInformation` em conhecimento estruturado.
- **Camada de consulta (leitura/retrieval):** responde perguntas usando esse conhecimento.

A versão inicial detalhava só a ingestão. Esta versão modela explicitamente também a consulta
(seção 6), porque ela é metade do propósito do sistema.

---

## 3. Entidades

As entidades estão agrupadas por papel. Para cada uma há a descrição, o motivo de existir e os
campos-chave. Cardinalidades estão indicadas (1:N, N:N) para remover ambiguidades da v1.

### 3.1 Camada de origem (a verdade bruta)

#### RawInformation
A informação original, exatamente como recebida. **Nunca é alterada nem apagada** (ver seção 8
sobre LGPD para a única exceção controlada).

Campos principais:
- `id`
- `source_type` (pdf, email, ata, artigo, transcrição, ...)
- `content` ou `storage_ref` (o conteúdo bruto, ou referência a object storage)
- `content_hash` — **hash do conteúdo**, usado para idempotência (ver seção 7).
- `received_at` — quando entrou no sistema.
- `metadata` (remetente, título, URL de origem etc.)

#### RawChunk *(novo)*
Um pedaço físico da `RawInformation` (página de PDF, parágrafo, trecho de transcrição).
Existe para dois motivos: documentos grandes precisam ser fatiados para a LLM processar, e a
proveniência precisa apontar para um **trecho específico**, não para o documento inteiro.

Campos: `id`, `raw_information_id` (FK), `index`, `text`, `offset_start`, `offset_end`,
`embedding` (opcional — ver seção 6).

> **RawInformation 1:N RawChunk.**

---

### 3.2 Camada de extração (o que a LLM propôs)

#### InformationFragment
Uma afirmação atômica extraída pela LLM a partir de um ou mais `RawChunk`
(ex.: *"O Projeto Apollo tem prazo final em 30/06/2026"*). É o elo entre o texto bruto e o
conhecimento estruturado.

Campos principais:
- `id`
- `llm_run_id` (FK) — qual execução da LLM produziu este fragmento.
- `text` — a afirmação em linguagem natural.
- `confidence` — **confiança da extração** (0–1), reportada/estimada pela LLM (seção 5).
- `status` — `proposed`, `accepted`, `rejected`, `superseded`.

> **Proveniência (correção importante da v1):** a v1 dizia "todo conhecimento é rastreável até
> a origem", mas não tinha como representar isso. Aqui há uma tabela de associação explícita:

#### FragmentSource *(novo — tabela de associação)*
Liga um `InformationFragment` aos `RawChunk` que o sustentam. É N:N porque um fragmento pode
se apoiar em vários trechos, e um trecho pode sustentar vários fragmentos.

Campos: `fragment_id` (FK), `raw_chunk_id` (FK).

---

### 3.3 Camada de conhecimento consolidado (o grafo)

#### KnowledgeNode
Um conceito consolidado da base (uma pessoa, um projeto, uma organização, um conceito).
É o resultado de **consolidar** fragmentos que falam da mesma coisa.

Campos principais:
- `id`
- `node_type_id` (FK)
- `canonical_name` — nome canônico/normalizado (ver resolução de entidade, seção 4).
- `aliases` — lista de nomes alternativos ("Projeto Apollo", "Apollo Project", "apollo").
- `created_at`, `updated_at`

> **Atenção — distinção entidade vs. valor (correção da v1):** na v1, `Project → has_deadline → Date`
> transformava uma *data* em um `KnowledgeNode`, o que explodiria o grafo com milhares de
> nós-valor (datas, números, strings). Aqui separamos:
> - `KnowledgeNode` = **entidades reais** (pessoas, projetos, conceitos).
> - **valores literais** (datas, números, textos) viram **atributos** (ver `NodeAttribute`),
>   não nós.

#### NodeType
A categoria de um nó (Person, Project, Organization, Concept, Date-as-entity quando fizer
sentido, ...). Define o vocabulário de tipos de entidade.

Campos: `id`, `name`, `description`, `version` (ver seção 9 — schema evolui no tempo).

#### NodeAttribute *(novo)*
Um atributo **temporal** de um nó — onde moram os valores literais (e-mail de uma pessoa,
status de um projeto). Resolve o item da v1 em que só relações eram temporais, mas atributos
de nó não tinham versionamento (contradizendo o princípio "toda informação mutável é temporal").

Campos: `id`, `node_id` (FK), `key` (ex.: `email`, `status`), `value`, mais os
**campos temporais** descritos na seção 5.

#### KnowledgeLink
Um relacionamento **direcionado** entre dois nós (ex.: `Person --participates_in--> Project`).
É temporal e tem proveniência.

Campos principais:
- `id`
- `source_node_id` (FK), `target_node_id` (FK)
- `link_type_id` (FK)
- `confidence` — confiança da relação (seção 5).
- campos **temporais** (seção 5).

#### LinkProvenance *(novo — tabela de associação)*
Liga cada `KnowledgeLink` (e cada `NodeAttribute`) aos `InformationFragment` que o
justificam. É o que torna o Princípio de Rastreabilidade **executável**: de qualquer aresta do
grafo, dá para navegar até o fragmento e daí até o trecho bruto original.

Campos: `link_id` (FK, ou `attribute_id`), `fragment_id` (FK).

#### LinkType
O tipo de relação (`participates_in`, `has_deadline`, `works_for`, ...).

Campos principais:
- `id`, `name`, `description`, `version`
- `inverse_name` — nome da relação inversa (`participates_in` ↔ `has_participant`), para
  navegação nos dois sentidos.
- `cardinality` — **funcional** (single-valued, ex.: um projeto tem *um* deadline atual) ou
  **multi-valor** (ex.: vários participantes). Isso determina a regra de sucessão temporal
  (seção 5.3).

#### LinkTypeRule
As regras que dizem **quais tipos de nó podem ser ligados por qual tipo de relação**, e com
qual cardinalidade/direção. Versão expandida em relação à v1 (que só validava o par origem→destino).

Campos principais:
- `id`, `link_type_id` (FK)
- `source_node_type_id` (FK), `target_node_type_id` (FK)
- `cardinality` (funcional / multi-valor) — herdada/refinada do `LinkType`.
- `valid_from`, `valid_to` — **as regras também são temporais** (seção 9): mudar uma regra não
  invalida o histórico criado sob a regra antiga.

Exemplos:
- Permitido: `Project --has_deadline--> Date` (funcional)
- Permitido: `Person --participates_in--> Project` (multi-valor)
- Não permitido: `Date --participates_in--> Person`

---

### 3.4 Camada de auditoria (o que aconteceu)

#### LLMRun
Uma execução da LLM. Toda extração é atribuível a um run, o que permite auditar, reprocessar
e medir qualidade.

Campos: `id`, `model`, `prompt_version`, `started_at`, `finished_at`, `status`,
`input_raw_information_id` (FK), `idempotency_key` (seção 7).

> **RawInformation 1:N LLMRun** (um documento pode ser reprocessado várias vezes, por exemplo
> com um modelo melhor). **LLMRun 1:N InformationFragment.**

#### ToolCall
Cada chamada de ferramenta feita pela LLM através do MCP durante um run. É o registro granular
de "o que a LLM tentou fazer".

Campos: `id`, `llm_run_id` (FK), `tool_name`, `arguments`, `result`,
`validation_outcome` (`accepted` / `rejected` + motivo), `created_at`.

> **LLMRun 1:N ToolCall.** Guardar o `validation_outcome` é o que registra *por que* o backend
> aceitou ou recusou cada sugestão da LLM.

---

## 4. Resolução de Entidade (Entity Resolution) *(novo — gap crítico da v1)*

**Problema:** quando a LLM extrai "Projeto Apollo" em dois documentos diferentes, como o
sistema sabe que é o **mesmo** `KnowledgeNode`, e não dois nós duplicados? Sem resolver isso,
o grafo vira um arquipélago de duplicatas e perde valor.

**Como o sistema resolve:**

1. **Normalização** do nome (caixa, acentos, espaços) gera uma chave de comparação.
2. **Matching de candidatos:** ao consolidar um fragmento, o backend procura nós existentes por
   (a) `canonical_name`, (b) `aliases`, e (c) similaridade de embedding (seção 6).
3. **Decisão:**
   - Match forte → reaproveita o nó existente e, se necessário, adiciona um novo alias.
   - Match ambíguo → cria o nó com `status = needs_review` para curadoria humana.
   - Sem match → cria nó novo.
4. **Merge de nós:** quando se descobre que dois nós são a mesma entidade, há uma operação de
   **merge** que reaponta todos os `KnowledgeLink` e `NodeAttribute` do nó absorvido para o nó
   sobrevivente, registra os aliases e mantém um tombstone do nó antigo (rastreabilidade).

---

## 5. Modelo Temporal (bitemporal) *(corrigido e expandido)*

A v1 marcava relações com `valid_from` / `valid_to` / `is_current`, mas misturava dois sentidos
de tempo e só cobria links. Aqui o modelo é **bitemporal** e cobre links **e** atributos.

### 5.1 Dois eixos de tempo

- **Tempo de validade** (`valid_from`, `valid_to`): quando o fato é/foi verdade **no mundo**.
- **Tempo de transação** (`recorded_at`, `superseded_at`): quando o sistema **soube/registrou**
  aquilo.

Por que ambos importam: permite distinguir **"o mundo mudou"** (o deadline foi de fato adiado)
de **"corrigimos um erro de ontem"** (tínhamos registrado a data errada). Com um eixo só, esses
dois casos ficam indistinguíveis — uma limitação real da v1.

Campos temporais padrão (usados em `KnowledgeLink` e `NodeAttribute`):
- `valid_from`, `valid_to` (tempo de validade)
- `recorded_at`, `superseded_at` (tempo de transação)

### 5.2 `is_current` deixa de ser campo armazenado *(correção)*

Na v1, `is_current` era um booleano gravado, redundante com `valid_to IS NULL` e sujeito a
ficar inconsistente. Aqui ele vira **derivado** (uma view/índice: `valid_to IS NULL AND
superseded_at IS NULL`), eliminando o risco de o booleano divergir da realidade.

### 5.3 Sucessão depende da cardinalidade *(correção importante)*

A v1 encerrava o link anterior ao criar um novo — mas isso só é correto para relações
**funcionais**. A regra agora:

- **Relação funcional** (ex.: `has_deadline`): ao registrar um novo valor, o anterior é
  encerrado (`valid_to` preenchido) e o novo passa a ser o atual.

  ```
  Projeto Apollo --has_deadline--> 30/06/2026   (encerrado)
  Projeto Apollo --has_deadline--> 15/07/2026   (atual)
  ```

- **Relação multi-valor** (ex.: `participates_in`): novos vínculos **coexistem** com os
  existentes — adicionar um participante não encerra os outros.

A cardinalidade que decide isso vem do `LinkType` / `LinkTypeRule` (seção 3.3).

### 5.4 Conflito ≠ Mudança *(novo — gap crítico da v1)*

A temporalidade resolve **sucessão** (o valor mudou ao longo do tempo). Ela **não** resolve
**contradição** (duas fontes afirmam coisas diferentes para o *mesmo* instante).

O sistema trata os dois casos separadamente:

- Se a nova informação se refere a um período **posterior** → é sucessão (seção 5.3).
- Se duas afirmações valem para o **mesmo** período e divergem → é **conflito**: ambas são
  registradas, marcadas como `conflicting`, e a `confidence` + a fonte de cada uma ajudam a
  curadoria humana (ou uma política automática) a decidir qual prevalece. Nada é silenciosamente
  descartado.

---

## 6. Camada de Consulta / Retrieval *(novo — metade do propósito, ausente na v1)*

Um segundo cérebro precisa **responder perguntas**. Três modos de recuperação, combináveis:

1. **Busca semântica (vetorial):** `RawChunk` e `KnowledgeNode` têm `embedding`. Perguntas em
   linguagem natural são respondidas por similaridade ("o que eu sei sobre prazos do Apollo?").
2. **Busca textual (full-text):** sobre `content` / `text`, para termos exatos.
3. **Travessia de grafo:** a partir de um nó, percorrer `KnowledgeLink` (usando `inverse_name`
   para navegar nos dois sentidos), filtrando pelo tempo (ex.: "quem participava do Apollo em
   janeiro/2026?" usa os campos temporais da seção 5).

Toda resposta de consulta pode citar a **proveniência** (via `LinkProvenance` → `FragmentSource`
→ `RawChunk`), então o usuário sempre vê *de onde* veio cada afirmação.

---

## 7. Idempotência e Reprocessamento *(novo)*

Para evitar duplicação ao reingerir o mesmo documento ou repetir uma execução:

- **Ingestão idempotente:** `RawInformation.content_hash` detecta conteúdo já recebido; reenviar
  o mesmo arquivo não cria duplicata.
- **Run idempotente:** `LLMRun.idempotency_key` evita que um retry (timeout, reprocessamento)
  gere fragmentos/links duplicados.
- **Reprocessamento intencional** (ex.: rodar um modelo melhor sobre documentos antigos) é
  permitido e cria um **novo** `LLMRun`; a resolução de entidade (seção 4) garante que o
  conhecimento resultante se funda com o existente em vez de duplicar.

---

## 8. Imutabilidade vs. LGPD / "direito ao esquecimento" *(novo — risco legal da v1)*

O princípio "a informação original nunca é perdida" entra em conflito com o direito ao
apagamento de dados pessoais (e-mails e atas contêm dados de pessoas). O sistema concilia os dois:

- **Imutabilidade é o padrão**: nada é sobrescrito no curso normal.
- **Apagamento controlado** é a exceção explícita, via um de:
  - **Criptografia com descarte de chave** (crypto-shredding): o conteúdo fica ilegível ao
    destruir a chave, preservando a integridade das referências.
  - **Tombstone / redação**: o conteúdo sensível é removido/mascarado, mantendo-se o registro de
    que existiu e de que foi apagado (e por qual base legal).
- O apagamento é **auditado** (quem, quando, por quê), satisfazendo tanto a LGPD quanto a
  rastreabilidade.

---

## 9. Evolução de Schema (tipos e regras mudam) *(novo)*

`NodeType`, `LinkType` e `LinkTypeRule` evoluem (renomear, criar, mudar regra). Para não
quebrar o histórico:

- Tipos e regras têm `version` e campos temporais (`valid_from` / `valid_to`).
- Mudar uma regra **não invalida** dados criados sob a regra antiga — eles continuam válidos
  no período em que aquela regra valia.
- A validação de um `KnowledgeLink` usa a regra **vigente no momento em que o link foi criado**.

---

## 10. Validação e Segurança no Backend *(expandido)*

A v1 dizia "o backend valida", mas validava essencialmente o par de tipos. Aqui o escopo da
validação é explícito, em camadas:

1. **Estrutural:** os nós referenciados existem; os tipos batem.
2. **Regras:** a combinação (tipo de nó origem, link, tipo de nó destino) é permitida pela
   `LinkTypeRule` vigente; cardinalidade respeitada.
3. **Confiança:** afirmações abaixo de um `confidence` mínimo entram como `proposed` /
   `needs_review` em vez de `accepted`.
4. **Anti-alucinação:** o backend confere que cada link/atributo aceito tem proveniência
   (`LinkProvenance`) apontando para um fragmento real — nada entra "do nada".

**Segurança contra prompt injection:** a LLM processa conteúdo **não confiável** (PDFs, e-mails).
Um documento malicioso pode tentar instruir a LLM a criar nós/links falsos ou disparar
`ToolCall` indevidos. Mitigações:
- O MCP expõe um conjunto **restrito e tipado** de ferramentas; a LLM não tem ações arbitrárias.
- O backend valida **toda** chamada (camadas 1–4 acima) — sugestão da LLM nunca é confiança cega.
- Conteúdo do documento é tratado como **dado**, nunca como instrução para o sistema.

---

## 11. Princípios (revisados)

1. A informação original nunca é perdida — exceto por **apagamento controlado e auditado**
   (LGPD, seção 8).
2. A LLM **sugere**.
3. O backend **valida** (estrutura, regras, confiança, proveniência — seção 10).
4. O banco **persiste**.
5. Todo **conceito** relevante (entidade) é um `KnowledgeNode`; **valores literais** são
   atributos (`NodeAttribute`), não nós.
6. Toda **relação** relevante é um `KnowledgeLink`.
7. Toda informação mutável é **temporal** — links **e** atributos, de forma **bitemporal**
   (seção 5).
8. Todo conhecimento é **rastreável até a origem**, e isso é **modelado explicitamente**
   (`LinkProvenance` → `FragmentSource` → `RawChunk` → `RawInformation`).
9. Toda afirmação carrega **confiança explícita**; conflito e mudança são tratados como casos
   distintos (seção 5.4).
10. A mesma entidade no mundo real corresponde a **um único** `KnowledgeNode` (resolução de
    entidade, seção 4).
11. O sistema **responde consultas** (semântica, textual e por grafo), sempre podendo citar a
    fonte (seção 6).

---

## 12. Resumo das mudanças em relação à v1

| # | Tema | O que mudou |
|---|------|-------------|
| 1 | Resolução de entidade | **Novo** — `aliases`, matching, merge de nós (seção 4) |
| 2 | Proveniência | **Novo** — `FragmentSource` e `LinkProvenance` tornam a rastreabilidade executável |
| 3 | Retrieval | **Novo** — busca semântica/textual/grafo + embeddings (seção 6) |
| 4 | Conflito vs. mudança | **Novo** — `confidence` + estado `conflicting` (seção 5.4) |
| 5 | Atributos temporais | **Novo** — `NodeAttribute` versiona valores de nó |
| 6 | Bitemporalidade | Tempo de validade **e** de transação (seção 5.1) |
| 7 | `is_current` | Vira **derivado**, não armazenado (seção 5.2) |
| 8 | Entidade vs. valor | Literais viram atributos, não nós (evita explosão do grafo) |
| 9 | `LinkType`/`LinkTypeRule` | Ganham `inverse_name`, `cardinality` e temporalidade |
| 10 | Cardinalidades do pipeline | FKs e 1:N/N:N explícitos em todas as entidades |
| 11 | Idempotência | **Novo** — `content_hash`, `idempotency_key` (seção 7) |
| 12 | LGPD | **Novo** — apagamento controlado vs. imutabilidade (seção 8) |
| 13 | Segurança | **Novo** — prompt injection e validação em camadas (seção 10) |
| 14 | Evolução de schema | **Novo** — versionamento temporal de tipos/regras (seção 9) |
| 15 | Escopo de validação | Explicitado em 4 camadas (seção 10) |
