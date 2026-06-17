# Remember — Parecer técnico-funcional: itens priorizados e recomendações

> **Data:** 2026-06-16
> **Base:** testes executados em sessão contra dados reais — ingestão real (e-mail → grafo via
> LLM Opus 4.8, 178s, 66 aceitos / 5 rejeitados / 1 consolidado), recuperação (`search` léxico +
> `traverse` + `provenance`) pelas superfícies REST **e** MCP, consolidação e resolução de entidade,
> rodando contra um branch efêmero do Neon (prod intocado). Suíte: 667 testes verdes; TS strict.
> **Não exercitado** (logo, fora do escopo de evidência): SPA/frontend, auth JWT real ponta-a-ponta
> (usou-se stub), `compliance_delete`, filas de curadoria em operação, escala (base ~42 nós).
>
> **Veredito:** MVP funcional sólido em pré-produção. A tese central (KB rastreável, léxica+grafo,
> alimentada por extração LLM) está provada ponta-a-ponta. As lacunas são de **governança de
> qualidade do dado**, **calibragem de extração/resolução**, **ergonomia de busca** e
> **endurecimento operacional** — evolução, não reconstrução.

---

## Legenda de prioridade
- 🔴 **Crítico** — bloqueia uso confiável em volume; atacar antes de ingerir muito conteúdo.
- 🟠 **Alto** — necessário para produção; não bloqueia testes.
- 🟡 **Médio** — melhoria de qualidade/robustez; planejável.

---

## 1. 🔴 Ativar e comprovar a curadoria (`entity_match` / `disputed`)

**Evidência.** No run de ingestão, o resumo veio `needs_review: 0, disputed: 0, uncertain: 0`,
ainda que tenham surgido **dois casos que deveriam ter sido enfileirados**:
- nó duplicado: `"Renato"` **e** `"Renato Macedo"` (mesma pessoa, não resolvida) → deveria ir para
  `entity_match`;
- nó-lixo: `"Claudiomir Paveukievis Siegfried Kreutzfeld Neto"` (dois nomes concatenados) → deveria
  ser sinalizado para revisão.

**Risco.** Sem a fila de curadoria efetivamente populada e drenada, a base **acumula ruído
silenciosamente** — o oposto do princípio de "confiança explícita". Quanto mais conteúdo entrar,
pior a poluição do grafo. É o maior risco para uso real.

**Ação recomendada.**
1. Verificar por que `entity_match` não recebeu o caso "Renato/Renato Macedo": inspecionar
   `backend/src/modules/curation/` + `ingestion/service/entity-resolution.service.ts` — confirmar se
   o caminho de "candidato ambíguo → `needs_review` + fila" está realmente disparando (§10, A26).
2. Exercitar as 8 ferramentas de curadoria (`list_review_queue`, `resolve_entity_match`,
   `merge_nodes`, `resolve_dispute`, `confirm_item`, `reject_item`, `correct_item`) ponta-a-ponta
   contra o branch — provar que um operador consegue mesclar o Renato e rejeitar o nó-lixo.
3. Definir um **gatilho de revisão** para entidades de baixa qualidade estrutural (ver item 2).

**Esforço.** Médio (1-2 dias de investigação + testes; pode revelar bug no enfileiramento).

---

## 2. 🟠 Validação semântica + calibragem da resolução de entidade (§4)

### Diagnóstico (o que o código faz hoje)
`backend/src/modules/ingestion/service/entity-resolution.service.ts` decide sob advisory lock por
`(node_type, norm(name))` (BR-20/§4.5):
1. **match exato** por `alias_norm = norm(name)` → reusa (`matched_existing`, score 1.0);
2. senão, até 10 candidatos por **trigrama** (`pg_trgm`, GIN `%`), com `similarity`, e dois limiares
   **constantes** (BR-25):
   - `MATCH_STRONG = 0.85` → candidato único forte ⇒ **reusa**;
   - faixa `[MATCH_FLOOR = 0.55, 0.85)` ⇒ cria nó `status='needs_review'` + `entity_match_review` por
     candidato ⇒ vai para a **fila**;
   - `< 0.55` ⇒ **novo nó `active`** (`created_new`), **sem revisão**.

A validação de ingestão (`backend/src/modules/ingestion/validation/`: `structural.ts`, `graph-rules.ts`,
`temporal.ts`, `confidence.ts`) é **estrutural/regra** — não há sanidade **semântica** de nome.

### Causa-raiz dos 2 defeitos observados
- **"Renato" vs "Renato Macedo" (duplicata não enfileirada):** `similarity("renato","renato macedo")`
  por trigrama cai **abaixo de 0.55** (o segundo nome tem muitos trigramas extras de "macedo"), então
  "Renato" foi tratado como **novel → `created_new`**, sem chegar à fila. **NÃO é problema de afinar o
  threshold** — baixar o FLOOR causaria over-merge generalizado. É o padrão de **nome parcial/
  abreviação**, que a similaridade trigrama subestima.
- **Nó-lixo "Claudiomir…Siegfried" (concatenação):** passou porque a validação é só **estrutural**
  (`structural.ts`: string não-vazia, tipo válido, FK) — sem sanidade de nome.

### O que fazer (concreto)
1. **Heurística de contenção de nome** na resolução (antes do ramo "novel"): se o nome proposto for
   **subconjunto de tokens** de um alias existente do mesmo `node_type` (ou vice-versa) — ex.:
   `{renato} ⊂ {renato, macedo}` — **rotear para `needs_review`** + `entity_match_review`, **mesmo
   com trigrama < FLOOR**. Pega abreviações/nomes parciais sem mexer no FLOOR global.
2. **Camada de sanidade estrutural-semântica** em `validation/` que **sinaliza (não rejeita)** →
   `needs_review`: Person com nº de tokens acima de um teto / múltiplos sobrenomes COLADOS em
   maiúscula; alias contendo e-mail/telefone/cabeçalho (`From:` / `@` / `<...>`); alias idêntico
   (pós-`norm`) a nó de **tipo diferente**.
3. **Manter os thresholds como constantes** (decisão de design, BR-25); usar os 2 casos acima como
   **fixtures de regressão** e calibrar pelas métricas §16 (`needs_review` rate, acceptance rate).

### Como validar
Re-ingerir o mesmo e-mail no branch e exigir: "Renato"→`entity_match` (não nó solto); nó concatenado→
`needs_review`; "Rodrigo Amorim" segue **não** fundido com "Isensee" (regressão do caso bom).

**Esforço:** médio. **Princípio inegociável:** sempre *sinalizar*, nunca descartar em silêncio.

---

## 3. 🟠 Endurecer o engine de orquestração (Siegard)

> ⚠️ Código **framework-owned** (`.claude/lib/orch_core.py`, `.claude/skills/orch-state/`) — pela
> CLAUDE.md, a mudança pertence ao repositório **siegard-code**, não edição in-place neste projeto.

### Diagnóstico (o que quebrou e por quê)
- `reduce.py` chama `reduce_all()` (orch_core), que **reproduz TODO o log** num **único `OrchState`
  global** via `apply_event`, e **estoura `IllegalTransition` no primeiro erro**. Logo, **um workflow
  encalhado bloqueia o estado de todos** (foi o que vimos: `mcp-curation-dual` travou a Fase 4).
- **Causa-raiz da transição ilegal:** um `task_completed` (tentativa 1) chegou **depois** de um
  `task_retried` já ter resetado a task para `READY` (tentativa 2). O `apply_event` de
  `task_completed` espera `RUNNING` → estourou. É uma **corrida de eventos tardios/fora de ordem**
  (hazard clássico de workers assíncronos).
- O reparo exigiu `verify_and_recover(from_seq, confirm=True)` (`orch_core.py:759`) — arquivar a cauda
  corrompida e re-emitir com hash-chain corrigida; **manual por design** ("never automatic").

### Trunfo: metade da solução já existe no código
- Já há **`reduce_all_tolerant()`** (`orch_core.py:1756`) que **coleta as violações em vez de parar**
  (retorna `(state, [Violation])`) — usado pelo monitor. O `reduce.py` que o orquestrador consome
  ainda usa o **estrito**.
- Já há **`read_events_filtered(...)`** (`orch_core.py:586`) — base para filtrar por `workflow_id`.

### O que fazer (concreto, em siegard-code)
1. **Tolerância a evento tardio na transição (causa-raiz):** em `apply_event`, ao processar
   `task_completed`/`task_failed`, **comparar o `attempt`**; se for de uma tentativa **já superada**
   por `task_retried`, **ignorar como no-op** (logar `stale_attempt`) em vez de `raise
   IllegalTransition`. Mata o defeito na origem.
2. **Redução escopada por `workflow_id`:** expor `reduce_workflow(workflow_id)` (usando
   `read_events_filtered`) e o orquestrador derivar estado **só do seu workflow** — um workflow
   encalhado deixa de envenenar os demais.
3. **Caminho de leitura tolerante:** `reduce.py` / a derivação de estado do orquestrador passa a usar
   **`reduce_all_tolerant`** (estado utilizável + violações sinalizadas) em vez do estrito. O estrito
   fica para checagem de integridade.
4. **Auto-recuperação de `stale_orchestrator`:** o `last_error.json` **já diagnostica** (tasks de
   review pendentes, recomenda `/u-orchestrator`). Falta o passo automático — um hook de saúde que
   **re-despacha as tasks pendentes** (retoma a fase) ou, no mínimo, emita sinal acionável; sem
   depender de leitura manual. `verify_and_recover` segue **manual** (é destrutivo).

### Como validar
Reproduzir a corrida (emitir `task_retried` e depois o `task_completed` tardio da tentativa antiga) e
exigir: (a) `apply_event` trata como no-op, sem `IllegalTransition`; (b) `reduce_workflow(X)` de um
workflow são funciona mesmo com outro workflow corrompido no log; (c) stale detectado → retomada
automática.

**Esforço:** médio-alto. **Risco:** mexe no núcleo compartilhado entre projetos — exige testes de
regressão do framework.

---

## 4. 🟠 Validar autenticação real ponta-a-ponta

**Evidência.** Todos os testes de consulta/ingestão usaram um **stub de auth** (preHandler injetando
o operador single-owner). O caminho real (JWT Neon Auth validado via JWKS em
`backend/src/middleware/auth.ts`, `${NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA) **não foi
exercido**.

**Risco.** É a fronteira de acesso de toda a aplicação (REST e MCP). Um defeito aqui só aparece em
integração real — e é exatamente o que um cliente MCP externo (Claude web) vai atravessar.

**Ação recomendada.**
1. Teste de integração com um JWT real (ou assinado contra um JWKS de teste servido localmente),
   batendo num endpoint protegido → 200 com token válido, 401 sem/expirado/assinatura errada.
2. Documentar o fluxo de obtenção do token para o conector MCP externo (como o Claude web injeta o
   `Authorization: Bearer`).

**Esforço.** Médio.

---

## 5. ✅ Eixo temporal / linha do tempo — CONCLUÍDO (2026-06-16)

> **RESOLVIDO.** Plano e execução em `temp/plano-item5-eixo-temporal.md`.
> F1: bug C7 confirmado vs Postgres real + corrigido (Opção A / Emenda v7.3 —
> sucessão fecha só o eixo de validade). F2: Events datáveis (`extraction.v2.ts`
> + registry de prompt). F3: **decidido NÃO** — cronologia é derivada
> (`event_date` + datas da fonte + proveniência); timeline dedicada diferida,
> SIM-base aditivo pré-aprovado. Suíte 676/676. Diagnóstico original abaixo,
> mantido para histórico.

### Diagnóstico — há DOIS sentidos de "histórico"; o sistema cobre um, não o outro

**(A) Histórico de VALIDADE de fato — CONSTRUÍDO e consultável (forte, porém sub-testado):**
- Todo link/atributo temporal recebe `valid_from` com base justificada na cadeia
  **`stated → document → received`** (`validation/temporal.ts`, A14/§6.5) — **datas nunca
  inventadas** (rejeição `DATE_UNJUSTIFIED`).
- Consulta ponto-no-tempo: **`as_of`** (YYYY-MM-DD) em `get_node`/`traverse` → "o que estava em vigor
  em T". Derivados `is_in_effect`/`is_current`/`effective_status` em leitura (§5.4, nunca gravados).
- Revisão de um fato ao longo do tempo: **`get_history_link` / `get_history_attribute` /
  `get_history_attribute_key`** → linhagem de versões (sucessão, `supersedes_*`).
- Ontologia já suporta: NodeType **`Event`** (e `Workshop`); LinkTypes/AttributeKeys com
  `is_temporal` / `requires_valid_from` / `requires_valid_to_on_change`.
- ⚠️ **Sub-testado:** exercitei **uma** ingestão (um doc) → **sem cadeias de sucessão
  multi-documento**, que é exatamente onde o eixo de validade brilha (ex.: "X responsável até jun,
  depois Y"). O poder real do TKG **não foi demonstrado**. (O eixo de **transação** —
  `recorded_at`/`superseded_at`, a consulta forense "o que o sistema sabia em T" — está **diferido**,
  §5.3/A25, por decisão de spec.)

**(B) Histórico NARRATIVO de eventos — NÃO modelado:**
- A cronologia do e-mail (27/mai pedido → reativação no go-live → cobranças jun → trade-off 15/jun)
  **não virou estrutura**: só `go-live do Apollo` virou `Event` — e **sem atributo de data**.
- Não há tipos de link de **ordenação** (precede / segue / aconteceu_durante) no catálogo padrão
  (os 13 LinkTypes são relacionais: `responsible_for`, `part_of`, `concerns`, `reports_to`,
  `holds_role`, `member_of`, `related_to`, …).
- O "histórico" foi **reconstruído pelo LLM relendo os trechos via proveniência** — funciona, mas
  não é consulta nativa.

### O ponto
O eixo temporal do produto é sobre **validade/revisão de FATO** ("o que era verdade quando", "como o
fato mudou") — forte e correto. A pergunta do teste ("histórico do PROBLEMA") é sobre **sequência de
eventos/comunicações** — outra coisa, não modelada. Confundir os dois leva a **sub-aproveitar o que
existe** E a **não cobrir o que se pediu**.

### Plano de solução — 3 frentes

> **Fatos do código que ancoram o plano:** o catálogo **já tem** `Event.event_date` + `Event.end_date`
> (`date`, `requires_valid_from`), `Task.due_date`, `Project.deadline`/`start_date` — datar é 1ª
> classe. O prompt `extraction.v1.ts` já trata `valid_from`/`valid_from_basis` (`stated→document→
> received`, "nunca invente"), mas **não** orienta datar `Event`s. A sucessão
> (`graph-consolidation.service.ts`): para escopo **funcional** (`allows_multiple_current=false`) +
> `change_hint='succession'`, fecha a linha vigente (`valid_to`, `superseded_at`,
> `status='superseded'`) e encadeia a nova via `supersedes_*` (§6.5 flow A).

#### Frente 1 — Comprovar o eixo de validade (alta prioridade, baixo custo)
Objetivo: provar `as_of` + `get_history_*` + sucessão de ponta a ponta (a capacidade central
**não comprovada**). Teste **determinístico, sem LLM** (via os handlers `propose_*` reais, padrão
`query-e2e`), num branch:
1. raw1/run1 (data `t1`): `propose_node` Task "T" + `propose_attribute` num atributo **FUNCIONAL**
   (`allows_multiple_current=false` — ex.: `Task.status`) valor `v1`, `valid_from=t1`,
   `valid_from_basis='document'`.
2. raw2/run2 (data `t2 > t1`): `propose_attribute` no **mesmo** `(node, key)` com valor `v2`,
   `change_hint='succession'` → o consolidator deve **fechar** a linha de `v1` (`valid_to=t2`,
   `status='superseded'`) e **encadear** `v2` via `supersedes_*`.
3. Asserções: `get_node(T, as_of=t1).attributes[status] == v1`; `as_of=hoje == v2`;
   `get_history_attribute_key(T,'status')` → 2 versões encadeadas com `valid_from/to` + `supersedes`.
- **Atenção:** usar escopo **funcional** — num atributo/link multi-valor, `v2` **coexiste** com `v1`
  (não supersede), e o teste não exercita a sucessão.
- **Resultado:** confirma o TKG **ou** revela bug. **Esforço:** ~1 dia.

#### Frente 2 — Datar os `Event`s extraídos (ganho barato, sem schema)
- Causa: o gap NÃO é de catálogo (`Event.event_date` existe) — é o **prompt** não orientar.
- Ação: adicionar diretiva em `backend/src/modules/ingestion/prompts/extraction.v1.ts`: *"ao criar um
  `Event`, proponha `event_date` (e `end_date` se houver) quando o documento indicar quando ocorreu;
  justifique `valid_from_basis`; nunca invente"*. **Bump de `prompt_version`** (extraction.v1.1 /
  v2) — ele entra na `idempotency_key` e na auditoria do `LLMRun`.
- Validar: re-ingerir doc com evento datado → o `Event` passa a carregar `event_date`.
- **Esforço:** ~0,5 dia. **Sem migração de DB.**

#### Frente 3 — Linha do tempo NARRATIVA (decisão de produto → maior)
- **Decisão primeiro:** cronologia narrativa de eventos é objetivo de 1ª classe?
  - **SIM:**
    - *Ontologia:* pode **dispensar** novo link de ordenação se usar `Event.event_date` para ordenar
      (mais simples). Opcional: LinkType `precedes`/`happened_during` por **migração aditiva**
      (playbook: migração + restart do BFF + LinkTypeRules → **DB Safety Rule: exige aprovação**).
    - *Prompt:* orientar a extração de `Event`s de comunicação/decisão datados (pedido 27/mai,
      reativação no go-live, trade-off 15/jun) com `event_date` + link `concerns`/`related_to` ao
      tópico.
    - *Consulta:* o cliente LLM **já monta** a timeline via `search(tópico)` → `traverse` →
      `get_node(Event)` ordenados por `event_date` — **sem novo endpoint**. Opcional: tool/endpoint
      de timeline dedicado (toca **§14** → spec).
  - **NÃO:** documentar explicitamente que cronologia = **derivada da proveniência** (o LLM
    reconstrói, como demonstrado) e encerrar o item 5 com as Frentes 1+2.
- **Implicações:** WS3-SIM toca **ontologia** (migração aditiva + aprovação) e possivelmente **spec**
  (§14/§6); é distinto — e independente — do eixo de validade.

### Sequência recomendada
**Frente 1** (valida o que existe — prioridade) → **Frente 2** (barato, melhora os dados já) →
**decisão de produto** sobre a Frente 3. O eixo de **transação** (forense "o que o sistema sabia em
T") permanece **diferido** (§5.3/A25) — fora do escopo deste item.

---

## 6. 🟡 Teste de escala (recuperação e ingestão)

**Evidência.** Toda a avaliação foi com base **minúscula** (27 → 42 nós, 41 fragments). Latências
observadas (search/traverse em poucos ms; ingestão LLM-bound ~178s/e-mail) são ótimas, mas
**não representativas de volume**.

**Risco.** `search` (FTS GIN + expansão de grafo) e `traverse` (depth ≤ 3) têm tetos de sanidade na
spec (§16: search < 500ms, traverse < 1s), mas não validados sob centenas/milhares de nós/links —
nem o comportamento do `pg_trgm`/GIN com volume, nem travessias densas.

**Ação recomendada.** Semear um branch com volume sintético realista (centenas de docs / milhares de
nós e links) e medir p95 de `search`/`traverse`/`get_*` contra os orçamentos do §16; observar planos
de query (`EXPLAIN`) nos hot paths.

**Esforço.** Médio.

---

## Aresta adicional (não-bloqueante): ergonomia de busca

A busca usa **AND** (`websearch_to_tsquery`): `"bloqueio troca de celular"` retornou **0**, termos
isolados acertaram; a camada de alias de nó não trouxe o conceito "Bloqueio" para a query `bloqueio`.
Para o caso de uso alvo (LLM no loop, fazendo várias chamadas) é tolerável — o cliente contorna
variando termos. **Sem busca semântica/embeddings** (não-objetivo permanente, §20), o recall depende
de sobreposição léxica + grafo. **Recomendação leve:** considerar `OR`/fuzzy como fallback quando o
`AND` retorna 0, e revisar por que o alias de nó não casou em termo isolado.

---

## Resumo executivo

| # | Item | Prio | Esforço | Bloqueia produção? |
|---|------|------|---------|--------------------|
| 1 | Ativar/comprovar curadoria | 🔴 | Médio | **Sim** |
| 2 | Validação semântica + calibrar resolução §4 | 🟠 | Médio | Sim (qualidade) |
| 3 | Endurecer engine de orquestração | 🟠 | Médio-alto | Não (mas trava esteira) |
| 4 | Auth real ponta-a-ponta | 🟠 | Médio | **Sim** |
| 5 | Eixo temporal / timeline | ✅ CONCLUÍDO | Alto | Feito (F1+F2 código/spec; F3 decidido = NÃO) |
| 6 | Teste de escala | 🟡 | Médio | Sim (antes de volume) |
| — | Ergonomia de busca (AND/fallback) | 🟡 | Baixo | Não |

**Em uma frase:** a fundação está certa e os diferenciais (rastreabilidade + honestidade) funcionam;
o que separa isto de "produção" é **governança de qualidade do dado (curadoria ativa) + calibragem
de extração/resolução + endurecimento operacional (auth, engine, escala)**.
