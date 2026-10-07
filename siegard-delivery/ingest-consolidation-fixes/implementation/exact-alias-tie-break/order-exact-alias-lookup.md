---
target: backend
task: sha256:fca739f7ef92255560444613c0556a91f507070aede128f8a2d0653392380a86
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/exact-alias-tie-break-order-exact-alias-lookup-build
title: Ordem determinística no lookup de alias exato
summary: O lookup de alias exato (`findExactMatch`) ordena as linhas candidatas pelo instante de criação do alias casado, do mais antigo para o mais recente, e depois pela identidade do nó, antes de escolher a primeira.
files:
- path: src/modules/ingestion/service/entity-resolution.service.ts
  effect: A consulta de `findExactMatch` agora declara `ORDER BY na.created_at ASC NULLS LAST, na.node_id ASC` antes de `LIMIT 1`. Uma proposta cujo nome é igual a alias de vários nós ativos do mesmo tipo resolve sempre para o nó do alias mais antigo, e em empate para o menor `node_id`. Propostas com um único nó casado, ou nenhum, resolvem como antes. O arquivo não tinha comentários e nenhum foi introduzido.
criteria:
- criterion: Where two active nodes of the proposal's node type each hold an alias equal to the proposed name, the proposal resolves as matched-existing to the node whose matching alias has the earliest creation time.
  met: true
  how: A consulta filtra `na.alias_norm = norm($1)`, `kn.node_type_id = $2` e `kn.status = 'active'`, e ordena por `na.created_at ASC`. `LIMIT 1` fica com o alias casado mais antigo. `resolveWithAdmittedAliases` envia esse `node_id` a `matchExisting`, que devolve `matched_existing`. O alias `kn`/`na` está em `findExactMatch`.
- criterion: Where two active nodes of the proposal's node type hold matching aliases with equal creation times, the proposal resolves as matched-existing to the node with the lower node identity.
  met: true
  how: O segundo critério de ordenação é `na.node_id ASC`. Com `created_at` igual, vence o menor identificador, e o desempate não depende da ordem física das linhas.
- criterion: Repeating the same homonym proposal against an unchanged graph resolves to the same node on every repetition.
  met: true
  how: A ordenação `(created_at, node_id)` é total. `UNIQUE (node_id, alias_norm)` em `node_alias` garante no máximo um alias casado por nó, então dois nós nunca empatam nas duas chaves. O resultado não depende do plano de execução.
- criterion: A proposal whose name equals an alias of exactly one active node of its node type still resolves as matched-existing to that node.
  met: true
  how: O filtro e o `LIMIT 1` não mudaram. Com uma só linha, o `ORDER BY` não altera o resultado, e `findExactMatch` devolve o mesmo `node_id`.
- criterion: The change adds no file under migrations/.
  met: true
  how: Só `src/modules/ingestion/service/entity-resolution.service.ts` foi editado. `node_alias.created_at` e `node_alias.node_id` já existem em `migrations/0001_init.sql`.
nodes:
- node: rules/knowledge-base/exact-alias-earliest-alias-wins
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: 'A cláusula `ORDER BY na.created_at ASC NULLS LAST, na.node_id ASC` codifica a regra: o alias mais antigo vence, alias sem instante de criação conta como criado depois de todos os que têm um, e empate vai para a menor identidade de nó. `NULLS LAST` está escrito de forma explícita para que o trecho sobre alias sem instante de criação não dependa do padrão do Postgres. A coluna é `NOT NULL`, então esse ramo hoje não é alcançado.'
- node: rules/knowledge-base/exact-alias-resolves
  encoded_at:
  - src/modules/ingestion/service/entity-resolution.service.ts
  how: Respeitada sem mudança. Se o nome é igual a alias de nó ativo do tipo, a proposta continua resolvendo como matched-existing. A ordenação só escolhe entre os candidatos que o filtro já aceitava.
- node: domain/knowledge-base/node-resolution
  how: Os valores `matched-existing`, `created-new` e `needs-review` ficam intactos. O lookup exato continua produzindo apenas `matched_existing` ou ausência de casamento, que segue para o passo de trigramas.
- node: domain/knowledge-base/node-alias
  how: O atributo `created_at` do alias é lido como chave de ordenação. Nenhuma forma foi alterada nem declarada de novo.
- node: domain/knowledge-base/knowledge-node
  how: A identidade do nó (`node_id`) é a chave de desempate, e o filtro por `status = 'active'` e por tipo permanece. Nada foi declarado de novo.
- node: scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
  how: O cenário (um nó ativo com "CNPq" e uma proposta posterior do mesmo tipo com esse nome) tem um único nó casado, então continua resolvendo como matched-existing a esse nó.
inferences:
- inferred: O "creation time of the matching alias" é `node_alias.created_at`, e a "node identity" é `node_alias.node_id`, igual a `knowledge_node.id` pela chave estrangeira. O desempate usa `na.node_id` e não `kn.id`.
  from: '`migrations/0001_init.sql` (`node_alias.created_at`, `node_id REFERENCES knowledge_node (id)`) e a nota do inventário de que `created_at` e `id` estão disponíveis para o desempate.'
- inferred: '`NULLS LAST` fica explícito, apesar de `created_at` ser `NOT NULL` hoje, para cobrir a cláusula de alias sem instante de criação que nenhum critério alcança.'
  from: Texto da regra `exact-alias-earliest-alias-wins` e a nota UNDERDETERMINED da tarefa.
- inferred: A ordem entre identidades é a ordem nativa de `uuid` do Postgres, usada como "lower node identity".
  from: Os ids de nó são `uuid` e a especificação não define outra ordem.
preserved:
- Proposta com nome igual a alias de exatamente um nó ativo do tipo continua resolvendo como matched-existing a esse nó, com `attachAliases` para os aliases admitidos além do nome.
- Proposta sem alias exato continua seguindo para `findTrigramCandidates` e `decideFromCandidates` (strong_unique, ambiguous, novel).
- A assinatura, o retorno (`string | null`) e a parametrização (`$1`, `$2`) de `findExactMatch` não mudaram.
- A trava advisory por nome (`acquireNameLock`) e a admissão de aliases (`admitAliases`) não foram tocadas.
deferred:
- what: Os testes que simulam esta consulta ou afirmam seu texto SQL (`src/__tests__/unit/ingestion/entity-resolution.spec.ts`, `entity-resolution-alias-admission.spec.ts`) podem precisar de ajuste para a nova ordem.
  why: Testes são de outro juiz e esta tarefa não os escreve. Uma busca por `LIMIT 1` e `ORDER BY` nesses arquivos não achou afirmação sobre o texto SQL, mas não li os dois por inteiro.
- what: Três ou mais nós homônimos não têm critério de aceitação próprio.
  why: É o ADVISORY já registrado nas notas da tarefa. A ordenação total cobre qualquer quantidade, mas a verificação desse caso fica para o juiz de testes.
---

## What it is
The exact-alias lookup `findExactMatch` now orders its candidate rows by the matching alias's creation time and then by node identity before taking the first.
No other file was written.

## Notes
The build run installed, typechecked, linted and secret-scanned over the changed tree and passed.
The record's prose is in Portuguese because the implementer wrote it so; the criteria are quoted from the task as written.
