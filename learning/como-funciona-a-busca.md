# A Arte de Reencontrar

### Como o *Remember* busca informação sem nunca usar *embeddings* — uma travessia, etapa por etapa, pelo pipeline de recuperação léxica + grafo

---

> *"A recuperação é puramente léxica (full-text + fuzzy de trigramas) mais grafo. Não há busca por significado — isso é um não-objetivo permanente."* — `remember-modelagem-v7.md`, §1

Guardar conhecimento é metade do problema. A outra metade — a que decide se um repositório é útil ou é
um cemitério bem-organizado — é **reencontrá-lo**. Você digita "Apollo" três meses depois de ter
ingerido uma ata, e o sistema precisa devolver não só a frase onde "Apollo" aparece, mas a teia ao
redor dela: quem participa do projeto, qual o seu *deadline*, qual reunião o decidiu, e — crucialmente
— o trecho exato do documento que sustenta cada uma dessas afirmações.

No artigo anterior seguimos um documento da porta de entrada até virar nó, aresta e atributo num grafo
temporal. Agora fazemos o caminho inverso: seguimos uma **pergunta** da sua chegada até a resposta
ranqueada, com proveniência. E vamos parar, como antes, para entender **por que** cada etapa é como é —
e em que tradição de recuperação de informação ela se apoia.

Há aqui uma decisão de projeto tão radical que precisa ser dita logo na primeira página: o *Remember*
**não usa, e nunca usará, *embeddings*, `pgvector` nem banco vetorial** (§20). Numa época em que "busca"
virou sinônimo de "busca semântica por vetores", esta é uma aposta contracorrente — e deliberada. Este
artigo é, em boa medida, a defesa dessa aposta.

---

## Parte I — A aposta: léxico + grafo, e o que isso significa

A recuperação por significado — aquela que entende que "Iniciativa Lunar" e "Projeto Apollo" são a
mesma coisa, mesmo sem compartilhar uma única letra — depende de *embeddings*: vetores densos num
espaço de centenas de dimensões, onde proximidade geométrica aproxima sentido. É poderosa. E o
*Remember* abre mão dela de propósito.

Por quê? A especificação é explícita sobre o custo-benefício (§20.1):

> *"Não há, e não haverá, embeddings, `pgvector` nem banco vetorial. A recuperação é léxica (full-text
> + trigram) + grafo, e essa é a forma final, não uma fase 1."*

O que essa escolha **compra**: determinismo (a mesma busca devolve sempre o mesmo resultado, sem deriva
de modelo), transparência (todo *hit* é explicável — "casou este token"), zero custo de inferência por
busca, e a ausência de um índice opaco que ninguém audita. Num projeto pessoal *single-owner*, à escala
de centenas de documentos, isso é uma troca excelente.

O que ela **abre mão**, e o sistema admite sem rodeios (§20.1):

> *"Consequência assumida (permanente): sinônimos/paráfrases sem sobreposição de caracteres ('Iniciativa
> Lunar' vs. 'Projeto Apollo') não casam automaticamente — nem na busca nem na resolução de entidade.
> Esses casos vão para a curadoria, que é a válvula declarada e permanente dessa escolha."*

Buscar "Iniciativa Lunar" e não achar "Projeto Apollo" não é um *bug* — é comportamento **esperado e
testado** (cenário C11). A lacuna que o léxico deixa não é varrida para baixo do tapete: vira trabalho
humano de curadoria, com fila própria (`entity_match`). O sistema prefere uma limitação honesta e
visível a uma mágica que às vezes erra em silêncio.

> **Uma nuance de implementação, para ser preciso.** A especificação descreve a *caixa de ferramentas
> léxica* do sistema como "full-text + trigrama". Na prática, os dois sinais agem em momentos
> diferentes: o **trigrama** (similaridade difusa de caracteres) trabalha na **ingestão**, na resolução
> de entidade — é ele que une "Apolo" a "Apollo" *antes* de o fato entrar no grafo (vimos isso no artigo
> anterior). Já a ferramenta `search`, a que você chama na leitura, é movida a **full-text puro** —
> `websearch_to_tsquery` + `ts_rank_cd`. A "fuzziness" de grafia, portanto, já está *assada* no grafo no
> momento em que você o consulta. É a mesma família léxica, atuando em dois tempos.

---

## Parte II — O que se pode perguntar

Antes das etapas, o mapa do que é possível pedir. A recuperação do *Remember* se expõe por um
**toolset de consulta** com dois grupos de ferramentas, em dois transportes (REST para a SPA, MCP para
clientes LLM) sobre uma única camada de serviço. Toda leitura roda dentro de uma transação `BEGIN READ
ONLY` que termina em `ROLLBACK` — nunca *commit*: a leitura jamais escreve.

**O grupo da busca e da prova** (módulo `query-retrieval`):

| Ferramenta | O que faz |
|---|---|
| `search` | A busca propriamente dita — full-text em 3 camadas + expansão no grafo |
| `get_provenance_fragment` / `_link` / `_attribute` | A prova: devolve o trecho-fonte de um fato |

**O grupo do grafo** (módulo `knowledge-graph`):

| Ferramenta | O que faz |
|---|---|
| `get_node` | Um nó com seus aliases e atributos vigentes |
| `traverse` | Travessia temporal a partir de um nó |
| `list_nodes` | Lista nós por tipo / prefixo de nome |
| `get_history_link` / `_attribute` / `_attribute_key` | A linhagem completa de uma asserção no tempo |
| `list_node_types` / `list_link_types` / `list_attribute_keys` | O catálogo |

E sobre tudo isso paira um **segundo eixo de pergunta: o tempo**. Quase toda ferramenta aceita um
`as_of` (estado numa data passada) e um `in_effect_only` (só o que está em vigor *hoje*). Voltaremos a
isso na Etapa 5 — é uma das partes mais bonitas do sistema.

---

## Parte III — As etapas de uma busca

Vamos seguir uma pergunta — `search("Apollo deadline")` — da chamada à resposta.

### Etapa 0 — A porta de entrada

A pergunta chega pela ferramenta `search`, idêntica em REST e MCP. Os parâmetros são validados por Zod
(`query`, `layers[]`, `as_of`, `in_effect_only`, `include_uncertain`, `expand`, `expand_depth`,
`expand_link_types[]`, `limit`, `offset`) e a transação read-only é aberta. Daqui em diante, tudo é
leitura pura sobre o PostgreSQL.

### Etapa 1 — Parsing da pergunta (e as duas configurações de full-text)

A primeira coisa que o sistema faz é traduzir o texto livre da sua busca numa `tsquery` — a estrutura
que o PostgreSQL sabe casar contra um índice. Ele usa `websearch_to_tsquery`
(`search.repository.ts:39`), que entende a sintaxe que você já conhece de qualquer caixa de busca:
aspas para frases, `-` para excluir, `or` para alternativas. Se a query se reduz a nada — só *stopwords*
ou operadores —, o parse devolve vazio e o sistema **curto-circuita** com `InvalidSearchQueryError`, em
vez de varrer o banco inteiro à toa.

Aqui aparece a primeira decisão fina: **há duas configurações de full-text, não uma** (§7.1). Elas vivem
num ponto único do código (`fts-config.ts`), nomeadas e versionadas:

- **`pt_unaccent_v1`** — para **prosa** (fragmentos e chunks). Faz *stemming* em português **e** remove
  acentos. "Reuniões", "reunião" e "reunir" colapsam num radical comum, então a busca por uma acha as
  outras.
- **`simple_unaccent_v1`** — para **nomes de entidade** (os aliases dos nós). Remove acentos, mas **não**
  faz *stemming*.

Por que separar? Porque *stemming* é maravilhoso para prosa e desastroso para nomes próprios. A
especificação dá o exemplo perfeito (§7.1): *"'Silva' não é flexão de 'silvar'"*. Um *stemmer* ingênuo
reduziria o sobrenome "Silva" ao verbo "silvar" e arruinaria a busca por pessoas. Nomes querem
casamento exato (a menos do acento); prosa quer casamento por radical. Duas configurações, dois
comportamentos, uma decisão consciente.

### Etapa 2 — A varredura full-text em três camadas

Agora o coração da busca. Em vez de procurar num só lugar, o `search` varre **três camadas em paralelo**
(§7.2, `search.repository.ts`), cada uma com um peso que reflete sua autoridade:

| Camada | O que indexa | Configuração | Peso |
|---|---|---|---|
| **Fragmento** | `information_fragment` (só `status = 'accepted'`) | `pt_unaccent_v1` | **1.0** |
| **Nó (alias)** | `node_alias` | `simple_unaccent_v1` | **0.9** |
| **Chunk** | `raw_chunk` (não tombstoned) | `pt_unaccent_v1` | **0.6** |

A pontuação de cada *hit* é `ts_rank_cd(tsvector, tsquery) × peso_da_camada`. Os pesos contam uma
hierarquia de confiança: um **fragmento** aceito é uma afirmação que já passou pelas cinco camadas de
validação da ingestão — é a evidência de maior autoridade (1.0). Um **nome de nó** é quase tão bom
(0.9). E um **chunk** cru é o texto bruto, ainda não destilado em conhecimento — vale menos (0.6), e só
aparece sozinho quando nenhum fragmento o ancora.

A camada de fragmentos usa um índice GIN **parcial** (`WHERE status = 'accepted'`): só o conhecimento
consolidado é indexado, e o filtro de status é "de graça", embutido no próprio índice. A camada de
aliases agrega com `MAX(ts_rank_cd(...))` e `GROUP BY` no nó — vários aliases do mesmo nó casando a
query colapsam num único *hit*, com a melhor pontuação entre eles.

> **Sobre `ts_rank_cd`.** O sufixo `_cd` é *cover density* — densidade de cobertura. Não basta os termos
> aparecerem; importa o quão **próximos** eles estão no texto. "Apollo deadline" pontua mais alto num
> fragmento onde as duas palavras estão lado a lado do que num onde estão a parágrafos de distância. É
> uma noção de relevância que a literatura de recuperação de informação desenvolveu ao longo de décadas
> (voltaremos a ela na Parte IV).

### Etapa 3 — Dedup e colapso: o chunk se dissolve na prova

Há uma redundância óbvia nas três camadas: um fragmento foi *extraído de* um chunk, então uma busca que
casa o fragmento provavelmente também casa o chunk que o originou. Devolver os dois seria ruído.

Então o sistema faz um **colapso** (`findChunkFragmentLinks`, `search.repository.ts`). Ele cruza a
tabela `fragment_source` para descobrir quais chunks do resultado já estão ancorados por fragmentos
também presentes no resultado, **remove esses chunks da lista** e dobra o excerto deles para dentro da
proveniência do fragmento. O invariante é elegante: *a lista final nunca carrega uma linha de chunk
solta* — só fragmentos, carregando seus excertos via proveniência. O chunk não some; ele se dissolve na
prova do fato que ajudou a sustentar.

### Etapa 4 — A expansão pelo grafo

Até aqui, busca textual. Agora o "+ grafo" do slogan ganha vida.

Dos **nós** que a busca atingiu (e que têm proveniência), o sistema pode *expandir*: caminhar pelas
arestas de `KnowledgeLink` para trazer o conhecimento vizinho (§7.2, parâmetro `expand`). Buscar
"Apollo" não devolve só o nó Apollo — devolve, atenuado, quem participa dele, qual o seu *deadline*,
qual reunião o decidiu.

A expansão é uma **busca em largura** (BFS) com duas regras de ouro:

- **Profundidade limitada:** *default* 1 salto, **máximo 3** (`traversal/config.ts`,
  `TRAVERSAL_DEPTH_MAX = 3`). Pedir além de 3 é erro de validação. O limite não é arbitrário: o número
  de vizinhos cresce exponencialmente com a profundidade, e além de 3 saltos a relevância evapora.
- **Decaimento por salto:** o *score* de um item alcançado por travessia é
  `score_do_nó_origem × 0.5^salto` (`TRAVERSAL_DECAY = 0.5`). Cada passo para longe do *hit* original
  vale metade. Um vizinho direto herda 50% da relevância; um vizinho de vizinho, 25%.

A travessia é **materializada salto a salto** (não uma CTE recursiva): a cada nível, busca os vizinhos,
deduplica por `id` da aresta (o BFS garante que a primeira vez que você vê uma aresta é pelo caminho mais
curto), aplica a **substituição de nós fundidos** (se um vizinho foi *merged*, troca pelo sobrevivente
via `merged_into_node_id`, e descarta auto-arestas que isso possa criar), e monta a próxima fronteira só
com nós ainda não visitados. No fim, busca a proveniência de todas as arestas numa só ida ao banco.

> **Isto tem um nome lindo na ciência cognitiva.** O *score* que decai pela metade a cada salto a partir
> de um ponto de ativação inicial é, quase literalmente, **ativação espalhada** (*spreading activation*)
> — o modelo de como a memória humana recupera conceitos relacionados, propagando ativação por uma rede
> semântica com perda a cada elo. O *Remember* não buscou inspiração na psicologia; chegou ao mesmo
> mecanismo por necessidade de engenharia. Voltaremos a isso.

### Etapa 5 — O filtro temporal: viajar no tempo da verdade

Aqui está, talvez, a parte mais sofisticada da recuperação. O *Remember* é **bitemporal** (vimos na
ingestão): cada aresta e atributo sabem *quando foram verdade no mundo* (`valid_from`/`valid_to`) e
*quando o sistema os considerou correntes* (`recorded_at`/`superseded_at`). A consulta colhe os frutos
disso (§5.3, `temporal-filter.ts`):

- **Visão atual** (sem `as_of`): devolve o que vale agora —
  `valid_to IS NULL AND superseded_at IS NULL`.
- **Viagem no tempo de validade** (`as_of = D`): devolve *o que era verdade na data D, na visão atual do
  mundo* — `superseded_at IS NULL AND (valid_from <= D) AND (valid_to > D)`. Você pergunta "qual era o
  *deadline* do Apollo em março?" e o sistema responde com a versão que valia em março, mesmo que ela já
  tenha sido sucedida desde então.
- **Só em vigor** (`in_effect_only = true`): estreita ainda mais, exigindo que o fato já tenha começado a
  valer (`valid_from <= current_date`). É a diferença entre "quem está escalado para o projeto" (inclui
  futuros já conhecidos) e "quem está no projeto **hoje**".

E o princípio de ferro que torna tudo isso barato: **estado dependente de relógio nunca é gravado**
(§5.4). `is_current`, `is_in_effect`, `effective_status` são *derivados na leitura*, calculados pelas
views resolvidas (`knowledge_link_resolved`, `node_attribute_resolved`) — nunca persistidos. Não há
*job* noturno marcando coisas como "inativas", logo não há janela em que o banco esteja errado. O
estado é sempre calculado contra o relógio do instante da pergunta.

Há uma terceira viagem no tempo, mais ambiciosa, que o sistema **deliberadamente não construiu** mas
**preservou os dados para**: a consulta forense (c), *"o que o sistema sabia no instante T"* (§5.3, A25).
Reconstruir a crença histórica do sistema é auditoria de alto custo difuso e benefício marginal num
projeto pessoal — então a query e a ferramenta não foram escritas. Mas como `recorded_at` é gravado em
*toda* linha e nada é fisicamente apagado, a consulta (c) pode ser ligada no futuro **sem migração e sem
*back-fill***. Os dados estão lá, esperando. (Note que o filtro temporal não se aplica a *hits* diretos
em fragmentos e chunks: eles não têm eixo de validade — estão ancorados a documentos, não a intervalos
de verdade. Para essas camadas, o filtro é um *no-op*.)

### Etapa 6 — As flags: a dúvida que viaja com a resposta

Lembra da "confiança explícita"? Ela reaparece na leitura. Um resultado nunca esconde a sua incerteza.
Depois que o SQL volta, o serviço calcula, para cada item, um conjunto de **flags** (§7.3,
`search.service.ts`):

- `status = 'uncertain'` → flag **`uncertain`** (confiança foi 0.40–0.74 na ingestão)
- `status = 'disputed'` → flag **`disputed`** (há conflito não resolvido sobre este fato)
- fragmento `accepted` com confiança `< 0.40` → flag **`low_confidence`**

Essas flags são *o mecanismo de exibição que substitui as filas dedicadas* (§7.3): `uncertain` e
`low_confidence` não têm fila a "zerar" — aparecem sinalizados quando relevantes, e o dono trata
ad-hoc. A dúvida viaja junto com a resposta, visível, nunca apagada.

Há uma sutileza importante de implementação: as flags são *derivadas do estado da linha, nunca
consultadas*. Mas quando você pede `include_uncertain = false`, o filtro é aplicado **no nível do SQL**
(`AND status <> 'uncertain'`), sobre a coluna de status — não sobre o array de flags, que é
pós-SQL. Filtrar e sinalizar são coisas diferentes, e o sistema as mantém separadas.

### Etapa 7 — Ranking e paginação: a ordem é determinística

Coletados os *hits* das três camadas, deduplicados, expandidos pelo grafo e sinalizados, resta ordenar.
A regra é **determinística** (§7.2, BR-15): ordena por `score DESC`, depois `recorded_at DESC`, depois
`id ASC`. Os dois critérios de desempate (mais recente primeiro; depois o id, estável) garantem que a
mesma busca devolve sempre a mesma ordem — sem o "tremor" que assola rankings que dependem de estado
mutável. A paginação é por `offset`/`limit` (limite de 1 a 100), e a resposta carrega o `total`
pré-paginação para a UI saber quantas páginas existem.

### Etapa 8 — Proveniência: a recompensa

E chegamos ao que dá sentido a tudo. Cada item do resultado carrega — ou pode buscar, via
`get_provenance_*` — a sua **proveniência**: a cadeia executável de volta à fonte (§14.3).

```
fato (link / atributo / fragmento)
  → InformationFragment (a frase extraída)
    → RawChunk (o trecho do documento)
      → RawInformation (o documento original, preservado)
```

A ferramenta devolve, para cada fragmento que sustenta o fato, o **excerto literal** do chunk — e aqui
volta uma decisão que parecia mero detalhe na ingestão. O excerto é recortado em SQL com
`substring(rc.text FROM rc.offset_start + 1 FOR rc.offset_end - rc.offset_start)`. O `+1` ajusta a
indexação 0-based, semiaberta `[start, end)` e em **code points Unicode** do sistema para a indexação
1-based, baseada em caractere, do PostgreSQL. É porque o *chunker* gravou offsets em code points (não em
bytes, não em unidades UTF-16) que esse recorte devolve exatamente o texto certo, sem cortar um emoji ao
meio.

Isto é a **rastreabilidade tornada executável**, e é a guarda anti-alucinação aplicada à leitura: todo
fato consolidado *tem* proveniência apontando para um fragmento real, ancorado num chunk real. Você
nunca precisa *confiar* que o sistema não inventou — você pode pedir a prova, e ela é o texto original.
Numa era em que LLMs alucinam com confiança serena, esta é a diferença entre um repositório de
conhecimento e um gerador de plausibilidades.

---

## Parte III-b — Além da busca: lendo o grafo direto

`search` é a porta larga, mas nem toda pergunta é uma busca textual. Às vezes você já sabe *qual* nó
quer e deseja explorá-lo. Para isso há as leituras diretas do módulo `knowledge-graph`:

- **`get_node`** devolve um nó com seus aliases e atributos vigentes (com proveniência), respeitando
  `as_of` e `in_effect_only`.
- **`traverse`** é a expansão da Etapa 4 exposta como ferramenta de primeira classe: a partir de um nó,
  caminha `out`/`in`/`both`, filtra por tipos de aresta, até profundidade 3, no tempo que você pedir.
  Devolve `nodes[]` e `links[]`, cada aresta com o seu `hop`.
- **`get_history_*`** é a máquina do tempo da *linhagem*: percorre a cadeia `supersedes_*` (via CTE
  recursiva) e devolve **todas** as versões de uma asserção em ordem cronológica — o *deadline* que era
  30/06, depois virou 15/07, com as datas e justificativas de cada mudança. É aqui que "conflito ≠
  mudança ≠ correção" da ingestão se torna legível.
- **`list_nodes`** lista por tipo e **prefixo de nome** — e note: o prefixo usa um `LIKE` ancorado à
  esquerda sobre `alias_norm`, apoiado num índice btree. É busca por prefixo, não fuzzy; rápida e exata.
- **`list_node_types` / `list_link_types` / `list_attribute_keys`** expõem o catálogo — o vocabulário do
  grafo, o mesmo que guiou a LLM na extração.

Todas seguem o mesmo padrão: Zod valida a entrada, abre transação read-only, chama a camada de serviço,
embrulha em `{ ok, result }` ou `{ ok, error }`, e dá `ROLLBACK`. E todas evitam o problema N+1: a
proveniência de múltiplos alvos vem numa só consulta com `= ANY($1::uuid[])`.

> **Orçamentos de latência (§16).** Tetos de sanidade, não metas apertadas: `search` < 500 ms,
> `traverse` (profundidade ≤ 3) < 1 s, `get_*` < 200 ms. À escala de centenas de documentos — a base
> inteira em cache, índices sobrando — a latência real fica na casa de poucos milissegundos. Há ainda
> *statement timeouts* de 5 s (busca simples, `get_provenance`) e 10 s (busca com expansão a
> profundidade 3) como rede de segurança.

---

## Parte IV — Conceitos e embasamento bibliográfico

A recuperação do *Remember* parece simples — e é, propositalmente. Mas cada peça repousa sobre décadas
de pesquisa em recuperação de informação, bancos de dados e ciência cognitiva. Vale nomear as
tradições.

### Recuperação de informação: o índice invertido e a relevância

A fundação de toda busca textual é o **índice invertido** — a estrutura que mapeia cada termo para os
documentos que o contêm — e o cânone do campo é Manning, Raghavan & Schütze, *Introduction to
Information Retrieval* (Cambridge University Press, 2008). A ideia de que termos raros são mais
informativos que termos comuns, que sustenta qualquer ranqueamento, é a *inverse document frequency* de
Spärck Jones, *"A statistical interpretation of term specificity and its application in retrieval"*
(Journal of Documentation, 1972). O modelo probabilístico de relevância que reina na busca léxica
moderna é o **BM25** de Robertson & Zaragoza, *"The Probabilistic Relevance Framework: BM25 and Beyond"*
(Foundations and Trends in IR, 2009) — a régua contra a qual qualquer recuperador é medido. O índice GIN
do PostgreSQL e o operador `@@` são a realização industrial dessas ideias.

### Densidade de cobertura: por que proximidade importa

O ranqueamento específico que o *Remember* usa, `ts_rank_cd`, implementa **cover density ranking** —
relevância que premia termos da consulta aparecendo *próximos* no texto. A formulação é de Clarke,
Cormack & Tudhope, *"Relevance ranking for one to three term queries"* (Information Processing &
Management, 2000). É a intuição de que "Apollo deadline" lado a lado vale mais que as duas palavras
perdidas em parágrafos distantes — capturada matematicamente.

### Léxico vs. denso: a aposta declarada

A decisão de recusar *embeddings* é uma escolha consciente num espectro bem mapeado. O contraponto que o
*Remember* **deliberadamente não adota** é a recuperação densa — vetores aprendidos —, cujo marco moderno
é Karpukhin et al., *"Dense Passage Retrieval for Open-Domain Question Answering"* (EMNLP, 2020), e cuja
aplicação a sistemas generativos é a **Retrieval-Augmented Generation** de Lewis et al. (NeurIPS, 2020).
A literatura é clara sobre a troca: a recuperação densa ganha em *recall* semântico (acha paráfrases) e
perde em interpretabilidade e determinismo. O *Remember* faz a aposta inversa, e a justifica pela escala
e pela natureza *single-owner* do problema — com a curadoria como válvula explícita para os casos que o
léxico não cobre.

### *Stemming*: reduzir prosa, preservar nomes

A escolha de duas configurações de full-text — uma com *stemming*, outra sem — repousa sobre a longa
tradição de **redução morfológica** em IR, cujo algoritmo canônico é o *stemmer* de Porter (*"An
algorithm for suffix stripping"*, Program, 1980), hoje generalizado pelo projeto **Snowball** (do mesmo
Martin Porter), que fornece o *stemmer* de português que o `pt_unaccent_v1` usa. A decisão de **não**
fazer *stemming* em nomes próprios ("Silva" ≠ "silvar") reflete um princípio bem conhecido da área: a
normalização que ajuda na prosa atrapalha em entidades nomeadas — um cuidado que a literatura de
*named-entity* há muito documenta.

### Similaridade de trigramas: a fuzziness do nome

O casamento difuso de grafia que, no *Remember*, age na ingestão (resolução de entidade), vem de Angell,
Freund & Willett, *"Automatic spelling correction using a trigram similarity measure"* (Information
Processing & Management, 1983) — a base da extensão `pg_trgm`. Vale lembrar que, neste sistema, o
trigrama trabalha no *write path*: ele funde variações de grafia *antes* de o conhecimento entrar no
grafo, de modo que a busca por leitura colhe um grafo já "des-duplicado".

### Travessia de grafo e ativação espalhada

A expansão pelo grafo é uma **busca em largura** (BFS), o algoritmo de livro-texto de Cormen, Leiserson,
Rivest & Stein, *Introduction to Algorithms* (MIT Press). Mas o detalhe do *score* que decai por salto
tem uma ascendência mais profunda e mais bonita: é a **ativação espalhada** (*spreading activation*) da
psicologia cognitiva, formalizada por Collins & Loftus, *"A spreading-activation theory of semantic
processing"* (Psychological Review, 1975) — o modelo de como a memória humana recupera conceitos
ativando uma rede semântica e propagando essa ativação, com perda, pelos elos. O decaimento de 0.5 por
salto do *Remember* é uma versão de engenharia exatamente desse fenômeno. A literatura mais ampla sobre
consultar grafos de conhecimento está consolidada em Hogan et al., *"Knowledge Graphs"* (ACM Computing
Surveys, 2021).

### Consulta bitemporal: viajar no tempo da verdade

A capacidade de perguntar "o que era verdade em D" (`as_of`) é **consulta de tempo de validade**
(*valid-time query*), do cânone das bases de dados temporais: Snodgrass, *Developing Time-Oriented
Database Applications in SQL* (Morgan Kaufmann, 1999), e Date, Darwen & Lorentzos, *Temporal Data and
the Relational Model* (Morgan Kaufmann, 2002). A separação rigorosa entre o tempo do mundo e o tempo do
sistema — e a decisão de *derivar* estado dependente de relógio na leitura em vez de gravá-lo — segue
diretamente dessa tradição.

### Proveniência e *grounding*: a prova de que não se inventou

Por fim, a obsessão com a cadeia de volta à fonte realiza a **proveniência de dados** de Buneman, Khanna
& Tan, *"Why and Where: A Characterization of Data Provenance"* (ICDT, 2001) — note que o *Remember*
entrega tanto o *why* (o fragmento) quanto o *where* (os offsets do chunk) —, formalizada pelo **W3C
PROV** (PROV-DM, 2013). E essa é, ao mesmo tempo, a resposta de leitura ao problema central de gerar com
LLMs, mapeado por Ji et al., *"Survey of Hallucination in Natural Language Generation"* (ACM Computing
Surveys, 2023): o *grounding* levado ao extremo, onde toda resposta pode ser apontada de volta a um texto
verificável. O detalhe técnico que faz o recorte de excerto funcionar — offsets em *code points*, não em
unidades UTF-16 — segue o **Unicode Text Segmentation** (Unicode Standard Annex #29).

---

## Síntese — o que o desenho compra

Recapitulando a travessia, da pergunta à prova:

```
pergunta  →  [0] porta (search / get_* / traverse, REST≡MCP, read-only)
          →  [1] parse (websearch_to_tsquery; duas configs: prosa vs nome)
          →  [2] varredura full-text em 3 camadas (fragmento 1.0 / nó 0.9 / chunk 0.6, ts_rank_cd)
          →  [3] dedup + colapso (o chunk se dissolve na proveniência do fragmento)
          →  [4] expansão no grafo (BFS, decaimento 0.5/salto, profundidade ≤ 3)
          →  [5] filtro temporal (agora / as_of D / in_effect_only; estado derivado, nunca gravado)
          →  [6] flags (uncertain / disputed / low_confidence — a dúvida viaja junto)
          →  [7] ranking determinístico (score DESC, recorded_at DESC, id ASC) + paginação
          →  [8] proveniência (excerto literal via offsets em code points — a prova)
```

O que toda essa contenção compra? Justamente o que a busca semântica, na sua exuberância, às vezes
sacrifica:

1. **Determinismo e explicabilidade.** Todo *hit* tem uma razão dizível — "casou este token, neste
   campo, com este peso". Nada de "o vetor estava perto". A busca é auditável de ponta a ponta.
2. **Honestidade temporal e de confiança.** Você pergunta não só "o que é verdade", mas "o que *era*
   verdade", e cada resposta carrega a sua dúvida visível. O sistema sabe o que não sabe — e diz.
3. **Prova, não promessa.** Toda resposta remonta, por uma *query*, ao trecho exato do documento
   original. A rastreabilidade não é um recurso; é a espinha dorsal.

E o que ela abre mão — casar "Iniciativa Lunar" com "Projeto Apollo" — não é escondido: é uma limitação
declarada, testada, e com uma válvula humana (a curadoria) à espera. É um sistema construído sobre uma
convicção simples e exigente: **preferimos uma busca que sabe os seus limites a uma que os esconde — e
nunca devolvemos um fato sem poder provar de onde ele veio.**

---

*Este artigo descreve o estado do código em `backend/src/modules/query-retrieval/` e
`backend/src/modules/knowledge-graph/`, e a fonte normativa `remember-modelagem-v7.md`. Onde o texto
cita "§N" ou "AN", refere-se a seções e ADRs desse documento. É o segundo de uma série; o primeiro,
`como-funciona-a-ingestao.md`, percorre o caminho inverso — do documento bruto ao grafo.*
