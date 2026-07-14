# Feature Spec — Curadoria Manual (`/curadoria`)

> ## ⚠ v2.0 — UI-Kit (TUI): superfícies flat, cores de estado remapeadas
> As `GlassSurface` (painéis/drawer/DecisionPanel/BatchBar) renderizam **flat** (opaco, sem blur); as cores
> de confiança do `StateBadge` foram **remapeadas** para os accents do kit (colisão low-confidence/superseded →
> distinção por ícone). Contrato de dados/estados inalterado. Autoridade: [`../design-system/tokens.md`](../design-system/tokens.md) §Migração.

> Route: `/curadoria` — protected layout route (guard via `protectedLayoutRoute`)
> Domains: curation (primary writes) · knowledge-graph (node reads, history) · query-retrieval (provenance, fragment lookup)
> Version: 1.0.0 | Status: draft | Layer: permanent
>
> Design reference: `temp/curate.md` (6 iterações, consolidado).
> Cross-references: `front.md`, `curadoria.flow.md`, `StateBadge.component.spec.md`,
> `GlassSurface.component.spec.md`, `NodeDetailPanel.component.spec.md`.

---

## §1 Consumed Endpoints

> Selection map only — Method+Path and Auth are in the respective domain `openapi.yaml`.
> This table is a cross-domain selection map; it does NOT duplicate Method, Path, or Auth.

| Domain | operationId | Purpose |
|---|---|---|
| curation | `listReviewQueue` | Load fila de triagem (entity_match + disputed); staleTime 0; contagem para header badge |
| curation | `resolveEntityMatch` | Ação `merge_into` ou `keep_separate` sobre nó `needs_review` |
| curation | `mergeNodes` | Fusão direta ad-hoc (fora da fila entity_match) |
| curation | `resolveDispute` | Ações `prefer_one`, `adjust_periods`, `keep_disputed` sobre disputa |
| curation | `confirmItem` | Promove `uncertain` → `active` (curadoria contextual) |
| curation | `rejectItem` | Rejeita link/atributo (destrutivo; UndoToast pré-commit) |
| curation | `correctItem` | Errata de link/atributo; requer `CorrectionForm` + `DateJustification` |
| knowledge-graph | `getNodeById` | Detalhe de nó proposto + candidatos (ComparePane entity_match); nome de target_node_id em disputa de link |
| knowledge-graph | `getLinkHistory` | Histórico de link para contexto de errata (ConversationTimeline) |
| knowledge-graph | `getAttributeHistory` | Histórico de atributo para contexto de errata |
| query-retrieval | `getProvenanceByLink` | ProvenanceTrail completo para KnowledgeLink selecionado |
| query-retrieval | `getProvenanceByAttribute` | ProvenanceTrail completo para NodeAttribute selecionado |
| query-retrieval | `getProvenanceByFragment` | Detalhe de fragmento para ProvenanceTrail (trecho exato, chunk, documento) |

> **R1 — Endpoint de métricas (MetricsStrip):** `GET /api/v1/curation/metrics` é um endpoint
> ADITIVO especificado nesta wave (backend: módulo curation). Retorna agregados duráveis de
> calibração §16: taxa de aceitação, rejeições por código, contagens de filas e flags. Enquanto
> não existir, `MetricsStrip` degrada para contagens derivadas de `listReviewQueue.total` (por kind).
> <!-- TO CONFIRM: endpoint /api/v1/curation/metrics ainda não existe em curation/openapi.yaml — deve ser adicionado pelo Back Spec Agent ou aceitar degradação R1 -->

> **R2 — Listagem de fragmentos accepted por fonte:** `GET /api/v1/query-retrieval/fragments`
> (ou parâmetro filtrado em endpoint existente) é um endpoint ADITIVO para o seletor de fragmento
> do `DateJustification` (BR-15, `valid_from_source=stated`). Enquanto não existir, o curador
> pode informar o `fragment_id` diretamente em modo "avançado" (degradação aceitável).
> <!-- TO CONFIRM: endpoint de listagem de fragments por raw_information_id/llm_run_id não está em query-retrieval/openapi.yaml — verificar se deve ser adicionado -->

---

## §2 Feature States (UI)

### UI-01 — idle (fila carregada, nenhum item selecionado)

**Entry condition:** `/curadoria` montado, `listReviewQueue` resolveu, `selectedItem === null`.

- Layout três colunas (`≥ xl`): FILA (esquerda) | PAINEL DE DECISÃO (centro, placeholder) | EVIDÊNCIA (direita, vazia).
- Abaixo de `xl`: duas colunas (fila + painel); abaixo de `md`: coluna única empilhada.
- FILA: `MetricsStrip` no topo com skeleton até métricas resolverem; `QueueTabs` (Tudo · Entidades · Disputas); `QueueList` virtualizada (`TanStack Virtual`); paginação; `BatchBar` oculta.
- PAINEL: placeholder glass — "Selecione um item da fila para começar."
- Header badge: total da fila (ambas as filas). Pill "N novos" visível se total cresceu desde a última visita (delta salvo em Zustand `curationStore.lastSeenTotal`).
- Deep-link `?item=<kind>:<id>`: pré-seleciona o item correspondente → entra em UI-02 diretamente.
- Sem `?item`: seleciona o primeiro da fila ao montar (auto-seleciona UI-02), salvo se fila vazia → UI-07.

### UI-02 — item selecionado, evidência pendente

**Entry condition:** `selectedItem !== null`; `evidenceLoading === true` OU `evidenceViewed === false`.

- `QueueItem` selecionado recebe `aria-current="true"`, highlight de seleção (`bg-elevated`).
- `DecisionPanel` mostra cabeçalho imediato (dados vindos da fila): tipo de item (`StateBadge`), escopo/nome, timestamp relativo.
- `ComparePane` exibe skeleton próprio enquanto `getNodeById` (entity_match) ou dados da disputa carregam.
- `ProvenanceTrail` exibe skeleton próprio enquanto `getProvenanceBy*` carrega.
- `DecisionBar`: botões de decisão visíveis mas **desabilitados** (`aria-disabled="true"`); tooltip "Veja a evidência antes de decidir".
- `EvidenceChip` pulsa (`animate-pulse`) até `evidenceViewed === true`.
- Prefetch do próximo item da fila acontece em background (`queryClient.prefetchQuery`).

### UI-03 — item selecionado, evidência vista (botões armados)

**Entry condition:** `evidenceViewed === true`; nenhuma ação em andamento.

- `EvidenceChip` para de pulsar; muda para estado "visto" (`check` icon, `text-state-accepted`).
- `DecisionBar`: botões de decisão **habilitados** para interação.
- `ReasonField` exibida abaixo da `DecisionBar` (motivo obrigatório para ações destrutivas).
- `ComparePane` adaptativa (heurística determinística — §5.2 de `curate.md`):
  - **Modo resumo** (entity_match 1 candidato com `similarity ≥ 0.9` OU disputa 2 lados sem sobreposição temporal): resumo compacto + link "Ver candidatos/detalhes".
  - **Modo diff cheio** (entity_match múltiplos candidatos ou similaridade média; disputa ≥3 lados ou colisão temporal): tabela diff + `PeriodTimeline`.
- Rodapé do painel: "N resolvidos · M restantes · ⏱ Xs/decisão" (state da sessão em Zustand `curationStore`).

### UI-04 — ação destrutiva pendente (UndoToast ativo)

**Entry condition:** ação destrutiva (`reject`, `prefer_one`, `merge_into`, `merge_nodes`, `correct`) disparada; janela de desfazer (5s) ativa.

- Remove otimista do item da fila (item some de `QueueList`).
- `UndoToast` exibido via sonner: "Item removido · **Desfazer** (5s)".
- **Nenhum request** ao BFF durante a janela.
- Auto-avanço para o próximo item da fila (UI-02 do próximo item).
- Timer visível no toast (contagem regressiva).
- Ação "Desfazer": reverte o estado otimista, cancela o timer, remove o toast — sem custo de CurationAction.

### UI-05 — ação em commit (POST em andamento)

**Entry condition:** janela de desfazer expirou OU ação não-destrutiva (`confirm`, `keep_separate`, `keep_disputed`, `adjust_periods`) foi disparada diretamente.

- Loading spinner no botão de decisão; botões desabilitados.
- Para ações não-destrutivas: commit imediato (sem UndoToast).
- Para ações destrutivas: commit ao expirar o toast.
- Sucesso → UI-06. Erro → retorno ao UI-03 com mensagem inline.

### UI-06 — decisão concluída (auto-avanço)

**Entry condition:** POST de curation action retornou 200; `decision:succeeded` emitido.

- `invalidateQueries(curationKeys.all)` + chaves do nó/aresta afetados.
- Auto-avanço instantâneo para o próximo item da fila pré-carregado (< 50ms).
- Toast efêmero de confirmação (não-destrutivas): "Confirmado." (2s, `success`).
- `curationStore.sessionResolved++`; rodapé do painel atualiza contagem.

### UI-07 — fila vazia

**Entry condition:** `listReviewQueue` resolveu com `total = 0`.

- `EmptyQueue` centralizado no painel: ícone `check-circle`, "Nada pendente. A fila está limpa."
- `MetricsStrip` ainda visível no topo da coluna da fila.
- Header badge some (ou mostra 0).
- `BatchBar` oculta.

### UI-08 — loading inicial (fila carregando)

**Entry condition:** `listReviewQueue` em `isPending`.

- `QueueList` exibe skeleton de 5 linhas (`animate-pulse`).
- `MetricsStrip` exibe skeleton.
- `DecisionPanel` exibe placeholder.
- `aria-busy="true"` na região da fila.

### UI-09 — erro na fila

**Entry condition:** `listReviewQueue` em `isError`.

- Banner inline na coluna da fila: `AlertTriangle` icon + "Não foi possível carregar a fila. Tente novamente." + botão "Tentar novamente" (`refetch()`).
- `role="alert"` no banner.

### UI-10 — item stale / concorrência detectada

**Entry condition:** item foi revalidado ao focar o painel E mudou de estado; OU POST retornou 409 com `BUSINESS_REVIEW_NOT_PENDING` / `BUSINESS_ITEM_NOT_DISPUTED`.

- `StaleBanner` aparece sobre o `DecisionPanel` (não bloqueia, mas avisa): ícone `refresh-cw`, "Este item mudou desde que você o abriu. [Recarregar]" (`bg-warning`).
- 409 no POST: remove o item da fila otimisticamente + toast "Já resolvido em outro lugar." + auto-avanço.

### UI-11 — CorrectionForm aberto (errata UC-10)

**Entry condition:** botão "Corrigir…" clicado em item `active`/`uncertain`/`disputed` (não-terminal).

- `CorrectionForm` expande dentro do `DecisionPanel` (não é modal/drawer).
- Campos por `item_kind`: atributo → `value` + período + `DateJustification`; link → `target_node_id` + período.
- `DateJustification` com rádio `stated | document | received`; se `stated` → seletor de fragmento `accepted` (R2).
- Motivo obrigatório.
- Botões "Cancelar" / "Salvar correção" no rodapé (salva → UI-05 commit imediato).

### UI-12 — BatchBar ativa (multi-seleção)

**Entry condition:** ≥ 2 itens selecionados via checkbox (homogêneos — mesmo `kind`).

- `BatchBar` aparece na base da coluna da fila (acima da paginação).
- Ações disponíveis por kind: `entity_match` → "Manter separados N"; `disputed` → não suportado em lote (BatchBar desabilita + explica); `uncertain` (contextual) → "Confirmar N" / "Rejeitar N com motivo".
- Fusões e disputas individuais ficam desabilitadas no lote (explicação no tooltip).
- Rejeição em lote (≥ 5 itens): confirmação inline única do número antes de prosseguir.

---

## §3 State Transition Table

| From | Trigger | To | Side Effect |
|---|---|---|---|
| UI-08 | `listReviewQueue` resolve com items | UI-01 | Auto-seleciona o primeiro item se fila não-vazia; aplica deep-link `?item` se presente |
| UI-08 | `listReviewQueue` resolve com total=0 | UI-07 | Badge some do header |
| UI-08 | `listReviewQueue` rejeita | UI-09 | `role="alert"` banner |
| UI-01 | `?item=<kind>:<id>` presente no mount | UI-02 | `selectedItem` setado; prefetch de evidência inicia |
| UI-01/UI-07 | Usuário clica em `QueueItem` | UI-02 | `selectedItem` setado; `curationStore.evidenceViewed = false`; `getProvenanceBy*` + `getNodeById` disparam; prefetch do próximo |
| UI-02 | Evidência carregada E usuário scrollou/focou `ProvenanceTrail` | UI-03 | `curationStore.evidenceViewed = true`; `EvidenceChip` para de pulsar |
| UI-03 | Ação não-destrutiva (`confirm`, `keep_separate`, `keep_disputed`, `adjust_periods`) | UI-05 | POST imediato; spinner no botão |
| UI-03 | Ação destrutiva (`reject`, `prefer_one`, `merge_into`, `correct`) | UI-04 | Remoção otimista; UndoToast 5s; auto-avanço para próximo item |
| UI-04 | "Desfazer" clicado no toast | UI-03 | Reverte remoção otimista; cancela timer; nenhum request |
| UI-04 | Timer expira (5s) | UI-05 | POST para BFF; spinner no toast |
| UI-05 | POST retorna 200 | UI-06 | `invalidateQueries(curationKeys.all)` + chaves do nó/aresta; `sessionResolved++` |
| UI-05 | POST retorna 409 (`REVIEW_NOT_PENDING` / `ITEM_NOT_DISPUTED`) | UI-10 | Remove item da fila otimisticamente + toast "Já resolvido." + auto-avanço |
| UI-05 | POST retorna erro (outros) | UI-03 | Mensagem inline no `DecisionPanel`; item volta à fila |
| UI-06 | Auto-avanço — próximo item disponível | UI-02 | `selectedItem` = próximo pré-carregado; `evidenceViewed = false` |
| UI-06 | Auto-avanço — fila esgotada | UI-07 | `selectedItem = null`; badge some |
| UI-03 | Botão "Corrigir…" clicado | UI-11 | `CorrectionForm` expande; foco move para primeiro campo |
| UI-11 | "Cancelar" clicado | UI-03 | `CorrectionForm` fecha; foco retorna ao botão "Corrigir…" |
| UI-11 | "Salvar correção" clicado | UI-05 | POST `correctItem`; commit imediato (sem UndoToast) |
| UI-01/UI-03 | ≥2 checkboxes selecionados | UI-12 | `BatchBar` aparece; `selectedItems: string[]` atualizado |
| UI-12 | Deselecionar até <2 itens | UI-01 ou UI-03 | `BatchBar` some |
| UI-12 | Ação de lote disparada | UI-04/UI-05 (por ação) | Lote de remoções otimistas OU commit imediato |
| any | `?item` param na URL muda (deep-link externo) | UI-02 | `selectedItem` atualizado; `evidenceViewed = false` |
| any | `listReviewQueue` polling (30s) detecta `total` cresceu | UI-01 (pill "N novos") | `curationStore.lastSeenTotal` comparado; pill aparece se delta > 0 |
| UI-02/UI-03 | Foco retorna ao painel (window focus) | UI-10 (se stale) ou mantém | `revalidateOnWindowFocus` para o item selecionado; compara snapshot |
| any | `CurationDrawer` abre (contextual — do grafo/busca) | modal drawer UI (in-loco) | `CurationDrawer` monta DecisionPanel em drawer; contexto de origem preservado |
| CurationDrawer | Decisão concluída no drawer | drawer fecha | `invalidateQueries` para nó/aresta do contexto de origem; grafo/busca reflete a mudança |

---

## §4 Requests, Order and Cache

### Execution order

**Ao montar `/curadoria`:**

1. **Paralelo (on mount):**
   - `listReviewQueue` (sem kind, limit=20, offset=0) — staleTime: **0** (volátil); priority: critical; `refetchOnWindowFocus: true`; polling interval: 30s (só com aba visível)
   - `getCurationMetrics` (se endpoint existir — ver R1) — staleTime: 30s; priority: normal

2. **Ao selecionar item:**
   - `getNodeById(node_id)` — para entity_match: proposto + cada candidato (paralelo); staleTime: 5min
   - `getNodeById(target_node_id)` — para disputa de link (nome do alvo); staleTime: 5min
   - `getProvenanceByLink(item_id)` OU `getProvenanceByAttribute(item_id)` — por item_kind; staleTime: 5min
   - Prefetch do próximo item em background (mesmo set acima para o próximo na fila)

3. **Ao abrir CorrectionForm com `valid_from_source=stated`:**
   - `listAcceptedFragmentsBySource(raw_information_id)` — R2; staleTime: 5min (se endpoint existir)

4. **Ao clicar em "Ver histórico" (errata context):**
   - `getLinkHistory(item_id)` OU `getAttributeHistory(item_id)` — staleTime: 5min

### Cache keys

```ts
export const curationKeys = {
  all: ["curation"] as const,
  queue: (kind?: string, page?: number) =>
    ["curation", "queue", { kind, page }] as const,
  metrics: () => ["curation", "metrics"] as const,
};

export const provenanceKeys = {
  link:      (id: string) => ["provenance", "link",      id] as const,
  attribute: (id: string) => ["provenance", "attribute", id] as const,
  fragment:  (id: string) => ["provenance", "fragment",  id] as const,
};

export const nodeKeys = {
  detail: (id: string) => ["nodes", id, "detail"] as const,
};

export const historyKeys = {
  link:      (id: string) => ["history", "link",      id] as const,
  attribute: (id: string) => ["history", "attribute", id] as const,
};
```

**Invalidação pós-mutação:** toda mutação de curadoria invoca `invalidateQueries(curationKeys.all)` + `invalidateQueries(nodeKeys.detail(affectedNodeId))` + chaves de proveniência do item afetado. Isso força recarregamento da fila, métricas e do nó/aresta no grafo/busca.

### TTL / revalidation summary

| Query | staleTime | refetchOnWindowFocus | Observação |
|---|---|---|---|
| `listReviewQueue` | 0 | true | Volátil — LLM pode escrever a qualquer momento |
| `getCurationMetrics` | 30s | true | Degradação: derivado da fila se endpoint ausente |
| `getNodeById` (candidato/alvo) | 5min | false | Fato estável enquanto pendente |
| `getProvenanceBy*` | 5min | false | Proveniência não muda enquanto item pendente |
| `getLinkHistory` / `getAttributeHistory` | 5min | false | Histórico append-only |

### Response transforms

Aplicados em `features/curation/api/_transforms.ts`:

| operationId | Transform |
|---|---|
| `listReviewQueue` | `created_at: string` → `createdAt: Date`; `similarity: number` mantido; `sides[].valid_from/valid_to: string\|null` → `Date\|null` |
| `getNodeById` | `{ ok: true, result }` → unwrap `result`; `attributes[].valid_from/valid_to` → `Date\|null`; `links[]` → tipados como `KnowledgeLink` |
| `getProvenanceByLink` / `getProvenanceByAttribute` / `getProvenanceByFragment` | `{ ok: true, result }` → unwrap `result`; `received_at: string` → `Date` |

### Composed models

`SelectedItemContext` (definido em `features/curation/types.ts`) compõe:
- `QueueItem` (da fila) — metadados de identificação imediatos
- `getNodeById` (entity_match: proposto + candidatos; disputed: target node se link) — detalhes para diff
- `getProvenanceBy*` (por item_kind) — evidência para ProvenanceTrail
- `getLinkHistory` / `getAttributeHistory` (lazy, ao abrir contexto de errata)

---

## §5 Input Validations

> Technical constraints (required, minLength, maxLength, enum) são em `openapi.yaml`. Esta seção cobre mensagens de usuário e timing apenas.

| Campo | Trigger | Mensagem ao usuário |
|---|---|---|
| `reason` (ReasonField) — vazio em ação destrutiva | submit (botão de decisão) | "Informe um motivo para continuar." |
| `reason` — vazio em `merge_into` | submit | "Informe um motivo para continuar." |
| `corrected.value` — vazio em atributo | blur + submit | "Informe o valor corrigido." |
| `corrected.valid_from` — inválido (não-data) | blur | "Data inválida. Use o formato AAAA-MM-DD." |
| `corrected.valid_from` ≥ `corrected.valid_to` (ambos preenchidos) | blur + submit | "O início deve ser anterior ao fim." |
| `corrected.valid_from_fragment_id` — ausente quando `valid_from_source=stated` | submit | "Selecione o fragmento que justifica a data." |
| Seleção de `winner_id` (`prefer_one`) — nenhum lado selecionado | submit | "Selecione qual lado preferir." |
| `periods` (`adjust_periods`) — `from ≥ to` em qualquer entrada | blur + submit | "O início deve ser anterior ao fim." |
| Rejeição em lote ≥ 5 itens — confirmação inline | click | "Você está rejeitando N itens. Confirmar?" (confirmação única, não diálogo modal) |

---

## §6 API Error → UI Mapping

> Curation domain não usa envelope `{ ok, result }` — retorna body direto em 2xx, error envelope em 4xx/5xx.
> Knowledge-graph e query-retrieval usam envelope `{ ok: true/false, result/error }`.

| error.code | HTTP | Domínio | Display | Mensagem ao usuário | Ação |
|---|---|---|---|---|---|
| `BUSINESS_REVIEW_NOT_PENDING` | 409 | curation | Toast `warning` + remove item da fila | "Já resolvido em outro lugar." | Auto-avanço para próximo item |
| `BUSINESS_ITEM_NOT_DISPUTED` | 409 | curation | Toast `warning` + remove item da fila | "Já resolvido em outro lugar." | Auto-avanço para próximo item |
| `BUSINESS_ITEM_NOT_UNCERTAIN` | 409 | curation | Toast `warning` + remove item da fila | "Este item já não está incerto." | Auto-avanço |
| `BUSINESS_ITEM_NOT_DELETABLE` | 409 | curation | Toast `warning` + remove item da fila | "Este item já foi rejeitado ou substituído." | Auto-avanço |
| `BUSINESS_SELF_MERGE_FORBIDDEN` | 409 | curation | Inline no `DecisionPanel` | "Não é possível fundir um nó com ele mesmo." | Usuário escolhe outro candidato |
| `BUSINESS_TARGET_NODE_REQUIRED` | 422 | curation | Inline no `CandidateCard` / `ReasonField` | "Selecione o nó-alvo da fusão." | Usuário seleciona candidato |
| `BUSINESS_INVALID_TARGET_NODE` | 422 | curation | Inline no `CandidateCard` | "Nó-alvo inválido ou inativo." | Usuário escolhe outro candidato |
| `BUSINESS_REASON_REQUIRED` | 422 | curation | Realça `ReasonField` (ring `--color-border-error`) | "Informe um motivo para continuar." | Foco move para o campo |
| `BUSINESS_DISPUTE_WINNER_REQUIRED` | 422 | curation | Realça seleção de lado | "Selecione qual lado preferir." | Foco move para os rádios |
| `BUSINESS_DISPUTE_PERIODS_REQUIRED` | 422 | curation | Realça campos de período | "Preencha os períodos de cada lado." | Foco move para primeiro campo vazio |
| `BUSINESS_TEMPORAL_INCOHERENT` | 422 | curation | Realça campo de período inválido | "O início deve ser anterior ao fim." | `aria-invalid` no campo |
| `BUSINESS_DATE_UNJUSTIFIED` | 422 | curation | Realça `DateJustification` | "A data precisa ter uma justificativa. Escolha a fonte." | Foco move para rádio de fonte |
| `BUSINESS_CORRECTION_NO_CHANGES` | 422 | curation | Inline no `CorrectionForm` | "Nenhuma alteração detectada. Modifique pelo menos um campo." | — |
| `BUSINESS_NODE_DELETED` | 410 | curation / knowledge-graph | Toast `warning` + remove item da fila | "Este nó foi excluído por conformidade." | Auto-avanço |
| `RESOURCE_NOT_FOUND` | 404 | qualquer | Toast `warning` + remove item da fila | "Item não encontrado." | Auto-avanço |
| `BUSINESS_RAW_INFORMATION_DELETED` | 410 | query-retrieval | Inline no `ProvenanceTrail` (bg-warning) | "A fonte original foi excluída por conformidade. Sem proveniência disponível." | Botões de decisão permanecem bloqueados (sem evidência) |
| `BUSINESS_FRAGMENT_NOT_ACCEPTED` | 404 | query-retrieval | Inline no seletor de fragmento | "Fragmento não disponível." | — |
| `AUTH_UNAUTHORIZED` / `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` | 401 | qualquer | Global: limpar token + redirect `/sign-in?reason=session_expired` | — | Tratado por `QueryCache.onError` (ver `front.md §5`) |
| `VALIDATION_OUT_OF_RANGE` | 422 | curation | Toast `warning` | "Parâmetro fora do intervalo permitido." | — |
| `SYSTEM_INTERNAL_ERROR` | 500 | qualquer | Toast `danger` + banner+retry no painel afetado | "Algo deu errado. Tente novamente." | Botão "Tentar novamente" |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | qualquer | Toast `danger` | "Serviço temporariamente indisponível. Tente novamente em instantes." | — |

---

## §7 Shared Components Used

> Apenas componentes globais de `src/components/` (nunca feature-local).

| Component | File | Used by | Notes |
|---|---|---|---|
| `GlassSurface` | `components/ds/GlassSurface/` | `CurationPage` (painéis), `CurationDrawer`, `DecisionPanel`, `ProvenanceTrail`, `BatchBar` | |
| `StateBadge` | `components/ds/StateBadge/` | `QueueItem` (kind/state badge), `DecisionPanel` (cabeçalho), `DisputeSideCard` | Ver adapter abaixo |
| `Button` | `components/ui/button/` | `DecisionBar`, `BatchBar`, `CorrectionForm`, `UndoToast`, `StaleBanner`, `EmptyQueue` | Mapeamento direto |
| `Input` | `components/ui/input/` | `ReasonField`, `CorrectionForm` (campos de valor e data) | Direto |
| `Textarea` | `components/ui/textarea/` | `ReasonField` (campo motivo, multi-linha) | Direto |
| `Select` | `components/ui/select/` | `DateJustification` (fonte da data), `QueueTabs` (filtro kind em mobile) | Direto |

### Component adapters

**StateBadge adapter (em `QueueItem` e `DecisionPanel`):**

`QueueItem` e `DecisionPanel` consomem dados da fila e mapeiam para `StateBadge`:

| StateBadge prop | Source / derivation |
|---|---|
| `state` | `kind === "entity_match"` → `"needs-review"`; `kind === "disputed"` → `"disputed"`; item contextual `uncertain` → `"uncertain"` |
| `label` | `kind === "entity_match"` → `"Para revisar"`; `kind === "disputed"` → `"Disputado"`; `uncertain` → `"Incerto"` |
| `size` | `"sm"` em `QueueItem`; `"md"` em `DecisionPanel` cabeçalho |

> Nota: `StateBadge.component.spec.md §2` deve incluir `state: "needs-review"` se não incluir ainda.
> <!-- TO CONFIRM: needs-review não está na lista de states do StateBadge (accepted/uncertain/low-confidence/disputed/superseded) — verificar se deve ser adicionado ou se QueueItem usa badge customizado -->

---

## §8 Feature Accessibility

> Baseline: WCAG 2.2 AA. Teclado completo declarado em `curate.md §8.5`.

| Requisito | Implementação |
|---|---|
| Atalhos de teclado (`j/k`, `x`, `e`, `m/s`, `1..9`, `c/r/u`, `?`) | Document-level `keydown` listener no `CurationPage`; desabilitado quando foco em input/textarea/select; não colide com leitores de tela (testado com NVDA/VoiceOver) |
| Fila com role de lista | `QueueList` como `role="listbox"`; cada `QueueItem` como `role="option"` com `aria-selected` e `aria-current` |
| `DecisionBar` sempre visível | Âncora ao rodapé do painel (não rola); `aria-label` em cada botão de decisão |
| Botões desabilitados antes da evidência | `aria-disabled="true"` + tooltip via `aria-describedby`; não `disabled` puro (mantém foco tabulável) |
| `EvidenceChip` pulsando | `aria-label="Veja a evidência antes de decidir"` + `aria-live="polite"` ao mudar estado |
| Formulários RHF | `label` + `aria-invalid` + `aria-describedby` em todos os campos do `CorrectionForm` e `ReasonField` |
| `PeriodTimeline` | Descrição textual alternativa via `aria-label` ou `aria-describedby` (ex: "Lado A vigente de 2021 a 2023; Lado B vigente de 2023 em diante") |
| `aria-live` para decisão / desfazer | `aria-live="polite"` na região de status da decisão; `UndoToast` anunciado como status |
| `aria-live` para fila nova | Pill "N novos" tem `role="status"` e anuncia ao aparecer |
| `StaleBanner` | `role="alert"` para anuncio imediato |
| `ProvenanceTrail` sem proveniência | Inline warning com `role="alert"`: "Nenhuma proveniência disponível." |
| Foco após decisão (auto-avanço) | Foco move para o cabeçalho do novo item selecionado no `DecisionPanel` |
| Foco ao abrir/fechar `CorrectionForm` | Abre → foco move para primeiro campo; fecha → foco retorna ao botão "Corrigir…" |
| `CurationDrawer` (contextual) | `role="dialog"` com `aria-modal="true"`, `aria-label="Curadoria"`, trap de foco, `Esc` fecha |
| Target size mínimo | Todos os elementos interativos ≥ 32px (mínimo do projeto: `front.md §10`) |
| Viewports QA | 320 · 768 · 1024 · 1440 px |

---

## §9 BDD Scenarios

> Invariantes de feature — âncoras de regressão. NÃO são acceptance criteria de Task Contract.

### Scenario 1 — Happy path: selecionar item, ver evidência, fundir (entity_match)

**Given** `/curadoria` montado com fila não-vazia (entity_match item)  
**When** o usuário seleciona o item  
**Then** cabeçalho do item aparece imediatamente com `StateBadge`  
**And** `ComparePane` exibe skeleton enquanto `getNodeById` carrega  
**And** botões de decisão estão desabilitados com tooltip "Veja a evidência antes de decidir"  
**When** a evidência carrega e o usuário scrolla a `ProvenanceTrail`  
**Then** `evidenceViewed` muda para `true`  
**And** botões de decisão ficam habilitados  
**When** o usuário clica "Fundir neste" + informa motivo  
**Then** remoção otimista do item; `UndoToast` aparece com timer de 5s  
**And** nenhum request é disparado durante a janela  
**When** timer expira  
**Then** `POST /api/v1/curation/entity-matches/:node_id/resolve` é disparado  
**And** sucesso → `invalidateQueries(curationKeys.all)` + auto-avanço para próximo item

### Scenario 2 — Evidência obrigatória antes de decidir

**Given** item selecionado, evidência ainda não vista  
**When** o usuário clica em um botão de decisão habilitado visualmente mas `aria-disabled`  
**Then** nenhuma ação é disparada  
**And** tooltip "Veja a evidência antes de decidir" é anunciado via `aria-live`

### Scenario 3 — Desfazer antes do commit

**Given** `UndoToast` ativo (janela de 5s)  
**When** o usuário clica "Desfazer"  
**Then** o item volta à fila (remoção otimista revertida)  
**And** nenhum request foi disparado ao BFF  
**And** `CurationAction` NÃO foi criado

### Scenario 4 — Concorrência 409 (item já resolvido)

**Given** item selecionado, decisão disparada  
**When** POST retorna 409 `BUSINESS_REVIEW_NOT_PENDING`  
**Then** toast "Já resolvido em outro lugar."  
**And** item é removido da fila  
**And** auto-avanço para próximo item

### Scenario 5 — CorrectionForm com DateJustification `stated`

**Given** item `attribute` ativo selecionado, `CorrectionForm` aberto  
**When** usuário altera `valid_from` e seleciona `stated` em `DateJustification`  
**Then** seletor de fragmento é exibido (R2)  
**And** "Salvar correção" permanece desabilitado até fragmento ser selecionado  
**When** fragmento selecionado + motivo preenchido + "Salvar correção"  
**Then** `POST /api/v1/curation/items/correct` disparado com `valid_from_fragment_id`  
**And** sucesso → `invalidateQueries` para nó/atributo + auto-avanço

### Scenario 6 — Curadoria contextual via CurationDrawer (do grafo)

**Given** usuário está no grafo (/chat), visualiza nó com flag `uncertain`  
**When** clica em "Curar"  
**Then** `CurationDrawer` abre como overlay (`role="dialog"`, `z-drawer`)  
**And** `DecisionPanel` está in-loco no drawer com o item `uncertain`  
**When** usuário confirma o item  
**Then** drawer fecha  
**And** `invalidateQueries` para nó afetado  
**And** `getNodeById` do grafo é refetchado → nó no grafo reflete a mudança

### Scenario 7 — Fila vazia após última decisão

**Given** fila com 1 item, usuário decide  
**When** POST retorna 200 e fila (após invalidation) retorna `total=0`  
**Then** UI entra em UI-07 (`EmptyQueue`)  
**And** badge do header some  
**And** `MetricsStrip` ainda visível com os contadores da sessão

### Scenario 8 — Teclado 100%: `j/k` navega, `e` abre evidência, `c` confirma

**Given** fila com itens, foco na `QueueList`  
**When** usuário pressiona `j`  
**Then** próximo item é selecionado (`aria-selected`)  
**When** usuário pressiona `e`  
**Then** evidência é marcada como vista (`evidenceViewed = true`)  
**When** usuário pressiona `c` (confirm)  
**Then** ação `confirmItem` é disparada (commit imediato, sem UndoToast)

---

## §10 Components to Create/Update

| Component Name | Action | Feature | Rationale |
|---|---|---|---|
| `CurationPage` | create | curadoria | Container de página — layout 3 colunas com container queries; monta `QueuePanel`, `DecisionPanel`, `EvidencePanel`; gerencia `?item` deep-link |
| `CurationDrawer` | create | curadoria | Wrapper contextual para curadoria in-loco (do grafo/busca); `role="dialog"`, `z-drawer`, trap de foco; reutiliza `DecisionPanel` |
| `MetricsStrip` | create | curadoria | Faixa de métricas de calibração (§16); lê `getCurationMetrics`; degrada para contagens da fila; feature-local mas documentado aqui pois é crítico para observabilidade |
| `QueueTabs` | create | curadoria | Abas Tudo · Entidades · Disputas; controla filtro `kind` em `listReviewQueue`; feature-local |
| `QueueList` | create | curadoria | Lista virtualizada (TanStack Virtual); renderiza `QueueItem`; suporte a multi-seleção; feature-local |
| `QueueItem` | create | curadoria | Item de fila com checkbox, `StateBadge`, escopo/nome, data relativa; feature-local |
| `BatchBar` | create | curadoria | Barra de ações em lote; aparece na base da fila quando ≥2 selecionados; feature-local |
| `DecisionPanel` | create | curadoria | Painel herói — compõe `ComparePane` + `DecisionBar` + `ReasonField` + `StaleBanner`; reutilizado em `CurationDrawer`; usado em 2+ contextos → qualifica para `component.spec.md` |
| `ComparePane` | create | curadoria | Exibe diff adaptativo (resumo/diff cheio) para entity_match e disputa; feature-local |
| `CandidateCard` | create | curadoria | Card de candidato com barra de similaridade, atributos comuns/divergentes; feature-local |
| `DisputeSideCard` | create | curadoria | Card de lado de disputa com valor, confiança, fonte, período; feature-local |
| `PeriodTimeline` | create | curadoria | Timeline visual de períodos sobrepostos/adjacentes; descrição textual acessível; feature-local |
| `ProvenanceTrail` | create | curadoria | Trilha de evidência: fragmento → chunk → documento; "Abrir no documento" deep-link; rastreia `evidenceViewed` quando visible; qualifica para `component.spec.md` |
| `EvidenceChip` | create | curadoria | Chip pulsante "Ver evidência" que desaparece ao `evidenceViewed`; feature-local |
| `DecisionBar` | create | curadoria | Barra de botões de decisão ancorada no rodapé do painel; feature-local |
| `ReasonField` | create | curadoria | Textarea controlada para motivo da decisão; integrada com RHF; feature-local |
| `CorrectionForm` | create | curadoria | Formulário RHF+Zod espelhando `CorrectItemBodySchema`; campos por `item_kind`; integra `DateJustification`; qualifica para `component.spec.md` |
| `DateJustification` | create | curadoria | Sub-formulário de justificativa de data; rádio `stated|document|received`; seletor de fragmento (R2); feature-local |
| `UndoToast` | create | curadoria | Toast sonner customizado com timer de desfazer e callback; feature-local |
| `StaleBanner` | create | curadoria | Banner de aviso de stale sobre o `DecisionPanel`; `role="alert"`; feature-local |
| `EmptyQueue` | create | curadoria | Estado vazio da fila; ícone + copy + `MetricsStrip` visível; feature-local |

> `DecisionPanel`, `ProvenanceTrail` e `CorrectionForm` qualificam para `component.spec.md` (usados em 2+ contextos OU lógica interna complexa). Os demais são feature-local e documentados aqui.

---

## §11 Heurística de Disclosure Progressivo (determinística — Regra 5)

> Implementada em código, **não** via modelo. Decisão derivada dos dados da fila — sem chamada LLM.

```ts
function resolveDisplayMode(item: ReviewQueueItem): "summary" | "full-diff" {
  if (item.kind === "entity_match") {
    const topCandidate = item.candidates[0];
    if (item.candidates.length === 1 && topCandidate?.similarity >= 0.9) {
      return "summary";
    }
    return "full-diff";
  }
  if (item.kind === "disputed") {
    if (item.sides.length === 2) {
      const [a, b] = item.sides;
      // Sem sobreposição temporal = um dos lados tem valid_to não-null
      const noOverlap = item.sides.some(s => s.valid_to !== null);
      if (noOverlap) return "summary";
    }
    return "full-diff"; // ≥3 lados ou colisão
  }
  return "full-diff";
}
```

---

## §12 Out of Scope

- **`compliance_delete`** — domínio `compliance-audit`, fora desta wave.
- **Filas para `uncertain`/`low_confidence`** — não são filas dedicadas (BR-01/14); curadoria dessas flags é apenas contextual (via `CurationDrawer` do grafo/busca).
- **Permissões por papel** — single-owner; sem RBAC.
- **Busca semântica** — não-objetivo permanente.
- **Histórico de `CurationAction`** — exposto pelo domínio `compliance-audit` (`listCurationActions`); não é escopo desta feature.

---

## Changelog

| Version | Date | Author | Type | Description | CR |
|---|---|---|---|---|---|
| 1.0.0 | 2026-06-24 | Front Spec Agent | initial | Spec inicial da tela de Curadoria Manual (`/curadoria`). Cobre fila entity_match + disputed, DecisionPanel adaptativo (resumo/diff), ProvenanceTrail + lei da decisão informada, CorrectionForm (RHF+Zod, BR-06/11/12/15), UndoToast pré-commit, BatchBar, StaleBanner, MetricsStrip, CurationDrawer contextual, teclado/a11y WCAG 2.2 AA, deep-link `?item=<kind>:<id>`. Nota R1 (endpoint de métricas aditivo) e R2 (listagem de fragmentos aditiva) pendentes de confirmação. | sdd_improve_2 |
