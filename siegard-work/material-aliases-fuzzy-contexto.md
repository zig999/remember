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
- Nenhuma versão do prompt de extração pede aliases; o campo `aliases` de `propose_node` é
  opcional e nunca foi usado.
- `rules/knowledge-base/candidate-similarity`: a resolução compara só o **nome** da proposta com
  os aliases dos nós existentes. Isso não muda neste incremento.

### Passa a ser
- A extração instrui o modelo a propor, junto de cada nó, **todo outro nome que o texto do chunk
  lido usa para a mesma entidade**: sigla, forma por extenso, nome curto, apelido, grafia
  alternativa.
- Só são aliases os nomes que aparecem no texto. Pronomes e referências só por papel ("ele",
  "o diretor", "a empresa") não são aliases.
- Um alias proposto cuja forma normalizada (`rules/knowledge-base/name-normalization`) não
  aparece no texto normalizado do chunk lido **não é gravado**. O nó é aceito normalmente. O
  resultado da chamada registra cada alias não gravado e o motivo — nada é descartado em
  silêncio.
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
- O modelo propõe o alias "Petrobras" para um nó cujo chunk só diz "a estatal": o nó é aceito,
  o alias não é gravado, e o resultado da chamada registra o alias e o motivo.

---

## 2. A busca encontra um nó por um nome digitado com erro

### Hoje
- `rules/knowledge-base/node-layer-matches-through-aliases`: a camada de nós casa um nó quando o
  texto da consulta casa um dos seus aliases, por full-text (`simple_unaccent_v1`, sem stemming,
  sem acento — `rules/knowledge-base/alias-matching`).
- "Petrobaz" ou "Petrobrass" não encontram o nó "Petrobras". A v7 (§7.2) não prevê similaridade
  de trigrama na busca; ela existe só na resolução de entidade (§4.2).

### Passa a ser
- A camada de nós **também** casa um nó quando um trecho da consulta tem similaridade de
  trigrama de pelo menos **0,55** com um dos seus aliases, comparando as formas normalizadas.
  0,55 é o mesmo piso da resolução de entidade, e fica como constante nomeada calibrável.
- O casamento aproximado só vale para a **camada de nós**. As camadas de fragmentos e de chunks
  continuam só full-text.
- A via aproximada só se aplica a consultas com pelo menos **4 caracteres** depois da
  normalização.
- Um nó que casa pelas duas vias aparece uma vez.
- **Um nó casado só pela via aproximada fica sempre abaixo de qualquer nó casado pela via
  full-text** na mesma busca.
- Todo item da camada de nós informa **como casou**: `exact` (full-text) ou `approximate`
  (trigrama). O item aproximado informa também a similaridade. A incerteza do casamento fica
  explícita para quem lê o resultado.
- O teto de 200 candidatos por camada (`rules/knowledge-base/search-layer-candidate-cap`) vale
  para a camada de nós já com as duas vias somadas.

### Cenários
- O grafo tem o nó "Petrobras". A busca "Petrobaz" o retorna como item `approximate`, com a
  similaridade.
- O grafo tem "Petrobras" e "Petrobrás Distribuidora". A busca "petrobras" retorna os dois por
  full-text; nenhum vem como `approximate`.
- A busca "ab" não usa a via aproximada.
- A busca "contrato Petrobaz" retorna o nó "Petrobras" como `approximate`.

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
  - um alias continua exigindo aparecer no texto do chunk lido (seção 1).
- Se a leitura preliminar falhar, **a extração não falha**. Ela segue sem contexto, e o run
  registra que o contexto não foi produzido e por quê.
- O contexto produzido fica **gravado junto do run**, para auditoria. As propostas do run foram
  feitas com ele à vista, e a rastreabilidade exige que se possa ver o que o modelo recebeu.
  Isso exige uma mudança de schema, que segue a regra de aprovação explícita do projeto.
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
