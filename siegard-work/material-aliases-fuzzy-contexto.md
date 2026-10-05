# Material para /analyse — aliases na extração, busca aproximada de nomes, contexto do documento

Contexto: `knowledge-base`. Três mudanças de comportamento, pedidas pelo dono, sobre a extração
e a busca. Nenhuma reverte a restrição `constraints/retrieval-is-lexical-only` — as três são
léxicas. Cada seção diz o que o sistema faz hoje (com o nó que o registra), o que passa a fazer,
os limites, os cenários e as decisões tomadas pelo dono.

Estado medido no banco em 2026-10-05: 4 documentos, 4 chunks (nenhum documento passou de um
chunk), 16 nós, 16 aliases — todo nó tem só o alias canônico; nenhuma extração propôs um alias
adicional.

---

## 1. A extração propõe os outros nomes de cada entidade (aliases)

### Hoje
- `rules/knowledge-base/new-node-aliases` e `matched-node-gains-only-aliases`: os aliases
  propostos são gravados no nó.
- Nenhuma versão do prompt de extração (v1 a v4) menciona aliases. O único lugar que os cita é a
  descrição do campo na ferramenta: "Optional alternative names or spellings for the same
  entity; attached without duplicating." O campo é opcional e nunca foi usado.
- `rules/knowledge-base/candidate-similarity`: a resolução compara só o **nome** da proposta com
  os aliases dos nós existentes. Isso não muda neste incremento.
- Uma proposta de nó **não carrega referência a chunk nem a fragmento**: só tem `node_type`,
  `name` e `aliases`. Só o orquestrador de extração sabe qual chunk está lendo. Os outros
  caminhos que chamam `propose_node` dentro de um run (o espelho REST, um cliente MCP externo, a
  ingestão dirigida) não têm "chunk lido".
- O resultado de `propose_node` é `{ node_id, resolution }`. Não há onde dizer que um alias foi
  recusado.

### Passa a ser
- A extração instrui o modelo a propor, junto de cada nó, **todo outro nome que o texto usa
  para a mesma entidade**: sigla, forma por extenso, nome curto, apelido, grafia alternativa.
- Só são aliases os nomes que aparecem no texto. Pronomes e referências só por papel ("ele",
  "o diretor", "a empresa") não são aliases.
- Um alias proposto cuja forma normalizada (`rules/knowledge-base/name-normalization`) não
  aparece no texto normalizado **da informação bruta do run** **não é gravado**. A verificação é
  contra a informação bruta, e não contra o chunk, porque a proposta de nó não identifica um
  chunk e a regra precisa valer em todo caminho que propõe nós dentro de um run.
- O nó é aceito normalmente. O resultado de `propose_node` passa a listar cada alias não gravado
  e o motivo — nada é descartado em silêncio. Isso muda o contrato de `propose_node` (MCP e o
  espelho REST).
- A ingestão dirigida fica **fora** da verificação: nela o dono fornece os itens já estruturados,
  com confiança 1,0, e a informação bruta é sintetizada a partir deles.
- A mudança entra numa nova versão de prompt, **v5**, que passa a ser a versão padrão
  (`rules/knowledge-base/default-prompt-version` muda de v4 para v5).

### Fora do escopo
- Reextrair os documentos já ingeridos.
- Usar os aliases da proposta na resolução de entidade (a resolução continua comparando só o
  nome).

### Cenários
- Um chunk diz "o Conselho Nacional de Desenvolvimento Científico (CNPq) aprovou…": o nó criado
  tem o alias canônico "Conselho Nacional de Desenvolvimento Científico" e o alias "CNPq".
- Num documento posterior, uma proposta de nó com o nome "CNPq" resolve por alias exato
  (`rules/knowledge-base/exact-alias-resolves`) para o mesmo nó.
- O modelo propõe o alias "Petrobras" para um nó cujo documento só diz "a estatal": o nó é
  aceito, o alias não é gravado, e o resultado de `propose_node` lista o alias e o motivo.
- Na ingestão dirigida, o dono envia um nó com um alias que não aparece em texto nenhum: o alias
  é gravado.

---

## 2. A busca encontra um nó por um nome digitado com erro

### Hoje
- `rules/knowledge-base/node-layer-matches-through-aliases`: a camada de nós casa um nó quando o
  texto da consulta casa um dos seus aliases, por full-text (`simple_unaccent_v1`, sem stemming,
  sem acento — `rules/knowledge-base/alias-matching`).
- "Petrobaz" ou "Petrobrass" não encontram o nó "Petrobras". A v7 (§7.2) não prevê similaridade
  de trigrama na busca; ela existe só na resolução de entidade (§4.2).
- A consulta é interpretada com todos os termos obrigatórios. Por isso "contrato Petrobras" não
  casa o nó "Petrobras" na camada de nós, mesmo com o nome escrito certo.
- O item de busca tem `kind`, `layer`, `id`, `score`, `hop`, `summary`, `flags` e `provenance`.
  `flags` só carrega sinais da asserção (`uncertain`, `low_confidence`), não de como a busca
  casou.

### Medições (Postgres do projeto, 2026-10-05)

| Alias | Consulta | `similarity` | `word_similarity` |
|---|---|---|---|
| petrobras | petrobaz | 0,46 | 0,60 |
| petrobras | petrobrass | 0,75 | 0,90 |
| petrobras | contrato petrobaz | 0,27 | 0,60 |
| petrobras | contrato petrobrass | — | 0,90 |
| cnpq | cnpj | 0,43 | 0,60 |
| ana | banana | — | 0,50 |
| conselho nacional | conselo nacional | — | 0,75 |

`similarity` compara a consulta inteira com o alias, e cai muito quando a consulta tem outras
palavras. `word_similarity` compara o alias com o trecho da consulta que mais se parece com ele.
Siglas curtas ("cnpq" × "cnpj") ficam acima de qualquer limiar útil, e erros de uma letra num nome
de 8 a 9 letras ("petrobaz") ficam na fronteira.

### Passa a ser
- A camada de nós **também** casa um nó quando a similaridade entre um dos seus aliases e o
  trecho da consulta que mais se parece com ele (`word_similarity`) é de pelo menos **0,6**,
  comparando as formas normalizadas. 0,6 é constante nomeada e calibrável.
- A via aproximada **só considera aliases com pelo menos 5 caracteres** depois da normalização.
  Siglas e nomes curtos ("CNPq", "Ana") só casam pela via full-text.
- O casamento aproximado só vale para a **camada de nós**. As camadas de fragmentos e de chunks
  continuam só full-text.
- Um nó que casa pelas duas vias aparece uma vez, como `exact`.
- **Um nó casado só pela via aproximada fica sempre abaixo de qualquer nó casado pela via
  full-text** na mesma busca.
- Todo item da camada de nós informa **como casou**: `exact` (full-text) ou `approximate`
  (trigrama). O item aproximado informa também a similaridade. A incerteza do casamento fica
  explícita para quem lê o resultado. É um campo novo no item de busca, e não um valor de
  `flags`, porque `flags` descreve a asserção e não a busca. Isso muda o contrato de busca (REST e
  a ferramenta MCP `search`) e a tela de busca do frontend.
- Um nó casado pela via aproximada **inicia a expansão pelo grafo** como qualquer nó casado. Os
  itens alcançados herdam o score menor do nó de origem e não recebem marcação própria.
- O teto de 200 candidatos por camada (`rules/knowledge-base/search-layer-candidate-cap`) vale
  para a camada de nós já com as duas vias somadas.

### Cenários
- O grafo tem o nó "Petrobras". A busca "Petrobrass" o retorna como item `approximate`, com a
  similaridade.
- O grafo tem "Petrobras" e "Petrobrás Distribuidora". A busca "petrobras" retorna os dois por
  full-text; nenhum vem como `approximate`.
- A busca "contrato Petrobrass" retorna o nó "Petrobras" como `approximate`.
- O grafo tem o nó "CNPq". A busca "CNPJ" não o retorna: o alias tem menos de 5 caracteres.
- A busca "contrato Petrobras" retorna o nó "Petrobras" como `approximate`: a via full-text não o
  casa, porque exige o termo "contrato" também no alias.

---

## 3. A extração conhece o documento inteiro antes de ler cada chunk

### Hoje
- `rules/knowledge-base/extraction-reads-chunks-in-order`: cada chunk é lido isolado, com os
  metadados do documento e os últimos 200 caracteres do chunk anterior.
- Uma entidade apresentada no chunk 1 ("o Diretor João Silva") e referida só como "o Diretor"
  no chunk 7 não é reconhecida como a mesma no chunk 7.

### Passa a ser
- Quando a informação bruta tem **mais de um chunk**, a extração faz, antes do primeiro chunk,
  **uma** leitura preliminar do documento inteiro. Essa leitura produz o **contexto do
  documento**:
  - um resumo de até 5 linhas;
  - a lista das entidades do documento, cada uma com o tipo de nó e os nomes que o documento usa
    para ela.
- Documento de um chunk só não tem leitura preliminar. Hoje isso cobre todos os 4 documentos.
- A leitura preliminar usa um modelo configurado próprio, cujo padrão é `claude-haiku-4-5`.
- Documento com mais de **100.000 caracteres** não tem leitura preliminar. A extração segue como
  hoje, e o run registra que o contexto não foi produzido e por quê.
- O contexto do documento é mostrado ao modelo na leitura de **cada** chunk, junto do que já é
  mostrado hoje. Os 200 caracteres do chunk anterior continuam.
- O contexto do documento é **só uma dica de leitura**:
  - ele nunca cria fragmento, nó, link ou atributo;
  - toda proposta continua ancorada no chunk lido (`rules/knowledge-base/extraction-anchors-to-read-chunk`);
  - um alias continua exigindo aparecer no texto da informação bruta (seção 1), e nunca só no
    contexto.
- Se a leitura preliminar falhar, **a extração não falha**. Ela segue sem contexto, e o run
  registra que o contexto não foi produzido e por quê.
- O contexto produzido fica **gravado junto do run**, para auditoria. As propostas do run foram
  feitas com ele à vista, e a rastreabilidade exige que se possa ver o que o modelo recebeu.
  Isso exige uma mudança de schema, que segue a regra de aprovação explícita do projeto.
- Uma nova tentativa do mesmo run reabre o run, com uma tentativa a mais. Ela **reusa o contexto
  gravado** quando há um, e só faz a leitura preliminar quando a tentativa anterior não chegou a
  produzi-lo.
- O disparo pela rota REST de execução de um run usa o mesmo orquestrador, e a regra vale igual.
  A ingestão dirigida não lê chunks nem chama modelo, e fica de fora.
- Se entrar junto com a seção 1, as duas mudanças formam **uma** versão de prompt, a v5.

### Cenários
- Documento de 3 chunks. O chunk 1 diz "o Diretor Financeiro, João Silva". O chunk 3 diz "o
  Diretor aprovou o orçamento". Com o contexto, a proposta de nó do chunk 3 tem o nome "João
  Silva" e resolve para o nó criado no chunk 1. O fragmento continua ancorado no chunk 3.
- Documento de 1 chunk: nenhuma leitura preliminar. O run registra que o contexto não se
  aplicou.
- A leitura preliminar devolve erro do provedor: os chunks são extraídos normalmente, e o run
  termina como hoje, com o registro da falha do contexto.
- O contexto lista uma entidade que nenhum chunk menciona: nenhum nó é criado para ela.
