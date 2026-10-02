---
contract_version: siegard-reconcile/8
title: Adoption of the frontend curation context
summary: The curation feature of the frontend is adopted as it stands and did not change; the owner states
  the source is the running system, and this reconciliation asks whether the specification written from
  its survey holds what each file carries.
target: frontend
files:
- path: src/features/curation/api/_request.ts
  change: Sends the curation requests to the back end with the access token, a thirty-second cutoff, a
    one-time token refresh on a 401 and its own failure codes.
- path: src/features/curation/api/_transforms.ts
  change: Declares the wire-to-domain mapping of the curation answers and the date parsing.
- path: src/features/curation/api/curation.hooks.ts
  change: Reads the review queue and the metrics and sends each curation action, refreshing the cached
    reads after a success.
- path: src/features/curation/api/keys.ts
  change: Declares the query keys of the curation, provenance, node and history reads.
- path: src/features/curation/api/node.hooks.ts
  change: Reads node detail and lineage history for the curation screen.
- path: src/features/curation/api/provenance.hooks.ts
  change: Reads provenance by link, attribute and fragment, and the accepted-fragment listing.
- path: src/features/curation/components/BatchBar/BatchBar.tsx
  change: Shows the batch bar with the actions of the selected kind and the inline confirmation of a large
    rejection.
- path: src/features/curation/components/BatchBar/index.ts
  change: Re-exports the batch bar and its types.
- path: src/features/curation/components/CorrectionForm/CorrectionFields.tsx
  change: Renders the value or target field, the validity dates and the reason of the correction form.
- path: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  change: Hosts the correction form, its checks, its submit and the placement of server refusals.
- path: src/features/curation/components/CorrectionForm/CorrectionForm.types.ts
  change: Declares the props of the correction form.
- path: src/features/curation/components/CorrectionForm/DateJustification.tsx
  change: Offers the valid-from bases and the accepted-fragment picker with its manual fallback.
- path: src/features/curation/components/CorrectionForm/correction-schema.ts
  change: Declares the correction form's checks, its defaults and the request it builds.
- path: src/features/curation/components/CorrectionForm/index.ts
  change: Re-exports the correction form.
- path: src/features/curation/components/CurationDecision.tsx
  change: Hosts the decision panel for the selected item and sends each decision through the dispatcher.
- path: src/features/curation/components/CurationDrawer/CurationDrawer.tsx
  change: Shows one queue item and its decision panel in an overlay opened from another screen.
- path: src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
  change: Declares the props of the curation drawer.
- path: src/features/curation/components/CurationDrawer/index.ts
  change: Re-exports the curation drawer.
- path: src/features/curation/components/CurationPage.tsx
  change: 'Lays out the curation page: the queue column with its tabs, metrics and pill, and the decision
    column.'
- path: src/features/curation/components/DecisionPanel/CandidateCard.tsx
  change: Shows one merge candidate with its similarity and lets the owner select it.
- path: src/features/curation/components/DecisionPanel/ComparePane.tsx
  change: Shows the candidates of an entity match or the sides of a dispute in summary or full presentation.
- path: src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  change: Opens the correction form inline under the evidence gate and returns focus on cancel.
- path: src/features/curation/components/DecisionPanel/DecisionBar.tsx
  change: Renders the decision buttons blocked until the evidence is viewed.
- path: src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts
  change: Computes the header badge, the scope label, the item age and the correction defaults.
- path: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  change: 'Hosts the decision panel: its header, comparison, reason, decisions and refusals.'
- path: src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
  change: Declares the props, actions and server error of the decision panel.
- path: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  change: Shows one side of a dispute and lets the owner select it as the winner.
- path: src/features/curation/components/DecisionPanel/EvidenceChip.tsx
  change: Shows whether the evidence was viewed.
- path: src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
  change: Lists the period of each dispute side in words.
- path: src/features/curation/components/DecisionPanel/ReasonField.tsx
  change: Renders the required reason field with its error and focus handling.
- path: src/features/curation/components/DecisionPanel/StaleBanner.tsx
  change: Shows the stale notice with its reload action on the decision panel.
- path: src/features/curation/components/DecisionPanel/index.ts
  change: Re-exports the decision panel.
- path: src/features/curation/components/MetricsStrip/MetricsStrip.tsx
  change: Shows the five curation metrics with their fallback and placeholders.
- path: src/features/curation/components/MetricsStrip/index.ts
  change: Re-exports the metrics strip.
- path: src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
  change: Shows the provenance of an item and signals once that its evidence was viewed.
- path: src/features/curation/components/ProvenanceTrail/ProvenanceTrail.types.ts
  change: Declares the props of the provenance trail.
- path: src/features/curation/components/ProvenanceTrail/index.ts
  change: Re-exports the provenance trail.
- path: src/features/curation/components/QueueItem.tsx
  change: Shows one queue entry with its badge, age and scope line.
- path: src/features/curation/components/QueueList.tsx
  change: Lists the queue entries as a virtualised list with their identifiers.
- path: src/features/curation/components/QueueTabs.tsx
  change: Offers the three queue tabs.
- path: src/features/curation/components/StaleBanner/StaleBanner.tsx
  change: Shows the stale notice with a reload action.
- path: src/features/curation/components/StaleBanner/index.ts
  change: Re-exports the stale banner.
- path: src/features/curation/components/UndoToast/UndoToast.tsx
  change: Shows the undo toast with its caption and countdown.
- path: src/features/curation/components/UndoToast/index.ts
  change: Re-exports the undo toast and its window.
- path: src/features/curation/components/curation-page-helpers.ts
  change: Computes the initial selection, the ring neighbour and the selection by number on the page.
- path: src/features/curation/components/curation-page-parts.tsx
  change: Renders the page's error banner, empty state and new-item pill.
- path: src/features/curation/hooks/useCurationKeyboard.ts
  change: Maps the curation keys to actions and listens for them.
- path: src/features/curation/hooks/useCurationQueue.ts
  change: Reads the review queue for the page with polling.
- path: src/features/curation/hooks/useDecisionDispatch.tsx
  change: Sends each curation decision, holds the undo window and reads each failure.
- path: src/features/curation/lib/display-mode.ts
  change: Decides between the summary and the full presentation of a queue entry.
- path: src/features/curation/state/curation-store.ts
  change: Holds the selected item, the evidence mark, the resolved count and the checked set.
- path: src/features/curation/types.ts
  change: Declares the curation answers and requests in wire and domain shapes.
nodes:
- node: contracts/curation-workspace/bff-curation
  conforms: true
  how: "src/features/curation/api/_request.ts: held at httpCuration(), lines 149-271, for the send-curation-request\
    \ operation only. The other eight operations (list-review-queue, read-curation-metrics, resolve-entity-match,\
    \ merge-nodes, resolve-dispute, confirm-item, reject-item, correct-item) are not in this file. — `return\
    \ (await response.json()) as T;`, `if (response.status === 204) return undefined as unknown as T;`,\
    \ \"Tempo limite excedido na requisição.\", \"Requisição cancelada.\", \"Falha de rede ao contactar\
    \ o servidor.\", \"Sua sessão expirou. Faça login novamente.\", \"Resposta do servidor não é JSON\
    \ válido.\", \"Algo deu errado. Tente novamente.\", \"Erro desconhecido do servidor.\". The code and\
    \ message selection (`typeof errObj?.code === \"string\" ? errObj.code : response.status >= 500 ?\
    \ \"SYSTEM_UPSTREAM\" : \"SYSTEM_UNKNOWN\"`) and the 401 and 204 branches agree with the contract.\n\
    src/features/curation/api/_transforms.ts: held at toEntityMatchCandidate, toEntityMatchQueueItem,\
    \ toDisputedItemSide, toDisputeQueueItem, toReviewQueueItem, toReviewQueueList and toCurationMetrics\
    \ (lines 115-202). These cover the read side of list-review-queue and read-curation-metrics. The request-sending\
    \ operations are not in this file. — export function toReviewQueueItem(wire: ReviewQueueItemWire):\
    \ ReviewQueueItem {\n  if (wire.kind === \"entity_match\") {\n    return toEntityMatchQueueItem(wire);\n\
    \  }\n  return toDisputeQueueItem(wire);\n}\n... acceptRate: wire.accept_rate, rejectRateByCode: wire.reject_rate_by_code,\
    \ ... entityMatchQueueCount: wire.entity_match_queue_count, disputedQueueCount: wire.disputed_queue_count,\
    \ computedAt: parseIso(wire.computed_at)\nsrc/features/curation/api/curation.hooks.ts: held at useListReviewQueue\
    \ and buildQueueQs (queue read), useCurationMetrics, and the mutationFn of the six mutation hooks\
    \ (lines 90-130, 140-156, 201-350). The answer-reading side (timeouts, 401, error mapping) is in other\
    \ files. — `/api/v1/curation/queue${buildQueueQs(params)}` with `if (params.kind !== undefined) search.set(\"\
    kind\", params.kind)` and the same guard for limit and offset;\n\"/api/v1/curation/metrics\";\n`/api/v1/curation/entity-matches/${encodeURIComponent(node_id)}/resolve`;\n\
    \"/api/v1/curation/nodes/merge\";\n\"/api/v1/curation/disputes/resolve\";\n\"/api/v1/curation/items/confirm\"\
    ;\n\"/api/v1/curation/items/reject\";\n\"/api/v1/curation/items/correct\", each with `method: \"POST\"\
    ` and `body: JSON.stringify(body)`\nsrc/features/curation/components/CorrectionForm/correction-schema.ts:\
    \ held at the object returned by `buildCorrectItemRequest`, lines 150-163 — item_kind: itemKind,\n\
    \    item_id: itemId,\n    corrected: {\n      ...(itemKind === \"attribute\"\n        ? { value:\
    \ values.value }\n        : { target_node_id: values.targetNodeId }),\n      valid_from: values.validFrom,\n\
    \      valid_to: values.validTo,\n      valid_from_source: values.validFromSource,\n      valid_from_fragment_id:\
    \ values.validFromFragmentId,\n    },\n    reason: values.reason,\nsrc/features/curation/hooks/useCurationQueue.ts:\
    \ held at the queryFn of useCurationQueue (lines 29-39), for the list-review-queue operation. The\
    \ send-curation-request failures belong to httpCuration in api/_request.ts, which this file only calls.\
    \ — const qs = new URLSearchParams();\nif (kind !== undefined) qs.set(\"kind\", kind);\nqs.set(\"\
    limit\", String(QUEUE_LIMIT));\nqs.set(\"offset\", \"0\");\nconst wire = await httpCuration<ReviewQueueListWire>(\n\
    \  `/api/v1/curation/queue?${qs.toString()}`,\n  { method: \"GET\", headers: authHeader() },\n);\n\
    return toReviewQueueList(wire);\nsrc/features/curation/types.ts: held at the Wire interfaces ReviewQueueListWire,\
    \ EntityMatchQueueItemWire, DisputeQueueItemWire, CurationMetricsWire (lines 51-113) and the request\
    \ and response DTOs (lines 185-289) — export interface ReviewQueueListWire {\n  readonly total: number;\n\
    \  readonly limit: number;\n  readonly offset: number;\n  readonly items: ReadonlyArray<ReviewQueueItemWire>;\n\
    }\nand export interface CorrectItemResponse { readonly item_kind: ItemKind; readonly predecessor_id:\
    \ string; readonly new_item_id: string; readonly action_id: string; }"
  encoded_at:
  - src/features/curation/api/_request.ts
  - src/features/curation/api/_transforms.ts
  - src/features/curation/api/curation.hooks.ts
  - src/features/curation/components/CorrectionForm/correction-schema.ts
  - src/features/curation/hooks/useCurationQueue.ts
  - src/features/curation/types.ts
- node: contracts/curation-workspace/bff-curation-reads
  conforms: false
  how: "src/features/curation/api/_transforms.ts, OkEnvelope and unwrapOk, lines 77-90: export interface\
    \ OkEnvelope<T> {\n  readonly ok: true;\n  readonly result: T;\n}\n\nexport function unwrapOk<T>(env:\
    \ OkEnvelope<T>): T {\n  return env.result;\n} — The `{ ok, result }` envelope that the reads contract\
    \ says the curation reads go through is parsed in src/lib/http.ts, which has `return body.result as\
    \ T;`. This file implements the unwrap a second time. The only callers are `__tests__/transforms.spec.ts`\
    \ (and the comment above it, which claims `lib/http.ts` already does it); nothing in production reads\
    \ it. If the envelope shape changes, `lib/http.ts` is the file that moves and this copy stays behind.\
    \ Its tests would go on passing against the old shape."
  observed_at:
  - src/features/curation/api/_transforms.ts
- node: contracts/curation-workspace/curation-screen
  conforms: false
  how: "src/features/curation/components/CurationPage.tsx, the header docblock, lines 35-36 (Deferred),\
    \ against the render tree at lines 168-265: * Deferred (not yet wired here): BatchBar multi-select\
    \ dispatch (the queue\n* checkbox state exists; the batch action bar is a follow-up). — The node says\
    \ the screen offers the batch bar (\"N selecionados\" with \"Manter separados N\", \"Confirmar N\"\
    \ and \"Rejeitar N\"). The page builds its checked set (`onToggleCheck` calls `setSelectedItems(next)`)\
    \ but mounts no BatchBar. In the whole non-test tree under src/features/curation, BatchBar appears\
    \ only in its own files and in comments, and nothing renders it. The owner can check items, but nothing\
    \ on the screen acts on the checked set. The comment says as much, yet the node reads as if the capability\
    \ exists. Which of the two is the decision is not stated anywhere.\nsrc/features/curation/components/DecisionPanel/ComparePane.tsx,\
    \ EntityMatchView, the radiogroup branch (lines 68-93). It renders the \"Múltiplos candidatos\" line\
    \ before the empty-candidates check, and it is also the branch taken by a single candidate outside\
    \ summary presentation.: <p className=\"text-xs text-foreground\">\n  Múltiplos candidatos — escolha\
    \ qual representa a mesma entidade.\n</p>\n{item.candidates.length === 0 ? (\n  <p className=\"text-xs\
    \ text-body\">\n    Nenhum candidato sugerido. Você pode manter separados ou fundir — The node gives\
    \ each hint its own case: \"for several candidates 'Múltiplos candidatos — escolha qual representa\
    \ a mesma entidade.', for none 'Nenhum candidato sugerido. Você pode manter separados ou fundir ad-hoc\
    \ por busca.'\". The code shows both hints when there are no candidates. It also shows \"Múltiplos\
    \ candidatos\" for a single candidate in full presentation. The owner is told to choose among several\
    \ candidates when there are none or only one, and the node does not say that is intended.\nsrc/features/curation/components/DecisionPanel/CorrectionSection.tsx,\
    \ correctionServerError, lines 36-46 (the filter that decides which server errors the correction form\
    \ receives): return serverError.code === \"BUSINESS_TEMPORAL_INCOHERENT\" ||\n    serverError.code\
    \ === \"BUSINESS_CORRECTION_NO_CHANGES\" ||\n    serverError.code === \"BUSINESS_DATE_UNJUSTIFIED\"\
    \ ||\n    serverError.code === \"BUSINESS_FRAGMENT_NOT_ACCEPTED\"\n    ? serverError\n    : null;\
    \ — The contract's correct-item operation says a BUSINESS_REASON_REQUIRED answer from the server shows\
    \ \"the server's message on the reason field\" of the correction. This filter turns that code into\
    \ `null` before it reaches CorrectionForm. CorrectionForm.tsx, line 50, has `case \"BUSINESS_REASON_REQUIRED\"\
    :`, so it can handle the code but is never given it from this caller. DecisionPanel.tsx instead sends\
    \ the code to the panel's own ReasonField. So the code reaches only the panel's reason field, never\
    \ the correction form's reason field, which is where the contract places it. Whether the contract's\
    \ \"reason field\" means the form's field or the panel's is not settled by either node, so the owner\
    \ has to decide it."
  observed_at:
  - src/features/curation/components/CurationPage.tsx
  - src/features/curation/components/DecisionPanel/ComparePane.tsx
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
- node: domain/curation-workspace/batch-kind
  conforms: false
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx, the BatchKind type alias, line 36: export
    type BatchKind = "entity_match" | "disputed" | "uncertain"; — The node spells the first value `entity-match`,
    and this declaration spells it `entity_match`. Other nodes in the specification already use `entity_match`
    as a kind literal, for example in unreadable-item-link-selects-nothing. A reader who looks up the
    batch kinds in the specification finds one spelling and the code that declares the shape uses another,
    so nobody can tell which spelling was decided.'
  observed_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: domain/curation-workspace/curation-shortcut
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at the `CurationShortcut` type declaration,\
    \ lines 106-117 — export type CurationShortcut =\n  | \"next\"\n  | \"prev\"\n  | \"toggleCheck\"\n\
    \  | \"evidence\"\n  | \"merge\"\n  | \"keepSeparate\"\n  | \"confirm\"\n  | \"reject\"\n  | \"undo\"\
    \n  | \"toggleHelp\"\n  | { readonly kind: \"selectIndex\"; readonly n: number };"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: domain/curation-workspace/display-mode
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/ComparePane.tsx: held at the inline union `readonly
    mode: "summary" | "full-diff";` in the props of EntityMatchView (line 45) and DisputeView (line 134),
    with the value from `const mode = resolveDisplayMode(item);` (line 172) — readonly mode: "summary"
    | "full-diff";

    const mode = resolveDisplayMode(item);

    src/features/curation/lib/display-mode.ts: held at the `DisplayMode` type alias, line 25, and the
    return statements of resolveDisplayMode — export type DisplayMode = "summary" | "full-diff";'
  encoded_at:
  - src/features/curation/components/DecisionPanel/ComparePane.tsx
  - src/features/curation/lib/display-mode.ts
- node: domain/curation-workspace/queue-tab
  conforms: false
  how: 'src/features/curation/components/QueueTabs.tsx, the TABS table, lines 40-44, with ALL_SENTINEL
    at line 32 and the data-tab-key attribute at line 70: const ALL_SENTINEL = "all";

    { id: undefined, label: "Tudo", key: ALL_SENTINEL },

    { id: "entity_match", label: "Entidades", key: "entity_match" },

    { id: "disputed", label: "Disputas", key: "disputed" },

    <TabsTrigger key={tab.key} value={tab.key} data-tab-key={tab.key}> — The node enumerates the tab values
    as all, entities and disputes. The file''s tab identifiers, which are also what it emits to the DOM
    as data-tab-key, are all, entity_match and disputed. The queue-kind names stand in for the tab values.
    A reader who looks in the specification for the tab vocabulary finds names the code never uses. A
    change to either spelling will not reach the other.'
  observed_at:
  - src/features/curation/components/QueueTabs.tsx
- node: domain/curation-workspace/selected-item
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at the SelectedItem interface, lines 46-49\
    \ — export interface SelectedItem {\n  readonly kind: SelectedItemKind;\n  readonly id: string;\n}"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: domain/knowledge-base/alias-kind
  conforms: true
  how: 'src/features/curation/types.ts: held at the kind field of NodeAliasWire (line 418) and NodeAlias
    (line 460) — readonly kind: "canonical" | "alias";'
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/assertion-flag
  conforms: true
  how: 'src/features/curation/types.ts: held at the AssertionFlag type, line 44 — export type AssertionFlag
    = "uncertain" | "disputed" | "low_confidence";'
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/assertion-status
  conforms: true
  how: "src/features/curation/types.ts: held at the AssertionStatus type, lines 31-36 — export type AssertionStatus\
    \ =\n  | \"active\"\n  | \"uncertain\"\n  | \"disputed\"\n  | \"superseded\"\n  | \"deleted\";"
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/curation-metrics
  conforms: true
  how: "src/features/curation/api/_transforms.ts: held at toCurationMetrics, lines 191-202. The shape\
    \ of the metrics value is declared in ../types, so this file only maps its fields. — acceptRate: wire.accept_rate,\n\
    rejectRateByCode: wire.reject_rate_by_code,\nneedsReviewCount: wire.needs_review_count,\nuncertainCount:\
    \ wire.uncertain_count,\ndisputedCount: wire.disputed_count,\nentityMatchQueueCount: wire.entity_match_queue_count,\n\
    disputedQueueCount: wire.disputed_queue_count,\ncomputedAt: parseIso(wire.computed_at),\nsrc/features/curation/types.ts:\
    \ held at CurationMetricsWire (lines 104-113) and CurationMetrics (lines 170-179) — readonly accept_rate:\
    \ number;\n  readonly reject_rate_by_code: Readonly<Record<string, number>>;\n  readonly needs_review_count:\
    \ number;"
  encoded_at:
  - src/features/curation/api/_transforms.ts
  - src/features/curation/types.ts
- node: domain/knowledge-base/dispute-decision
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the `decision` values
    sent in `dispatch`, lines 150 and 159 (`prefer_one`, `keep_disputed`). The enumeration itself is declared
    elsewhere. — decision: "prefer_one", ... decision: "keep_disputed",

    src/features/curation/types.ts: held at the DisputeDecision type, line 29 — export type DisputeDecision
    = "prefer_one" | "adjust_periods" | "keep_disputed";'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/types.ts
- node: domain/knowledge-base/dispute-scope
  conforms: true
  how: "src/features/curation/types.ts: held at DisputeScopeWire (lines 77-83) and DisputeScope (lines\
    \ 145-151) — export interface DisputeScopeWire {\n  readonly source_node_id: string | null;\n  readonly\
    \ target_node_id: string | null;\n  readonly link_type: string | null;\n  readonly node_id: string\
    \ | null;\n  readonly attribute_key: string | null;\n}"
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/effective-status
  conforms: false
  how: "src/features/curation/types.ts, line 38-43, the EffectiveStatus type: export type EffectiveStatus\
    \ =\n  | \"active\"\n  | \"uncertain\"\n  | \"disputed\"\n  | \"superseded\"\n  | \"deleted\"; — The\
    \ node declares six values, including inactive, which is how an ended assertion reads. This type has\
    \ five. The inactive value that the node defines for an ended assertion cannot be typed on AttributeDetailWire.effective_status,\
    \ LinkDetailWire.effective_status, AttributeDetail or LinkDetail. A reader of this file would conclude\
    \ that inactive is not a status the screen can receive.\nno file of the set holds this fact beside\
    \ what was found against it"
  observed_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/entity-match-decision
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the `decision` values
    sent in `dispatch`, lines 128 and 137 (`merge_into`, `keep_separate`). The enumeration itself is declared
    elsewhere. — decision: "merge_into", ... decision: "keep_separate",

    src/features/curation/types.ts: held at the EntityMatchDecision type, line 28 — export type EntityMatchDecision
    = "merge_into" | "keep_separate";'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/types.ts
- node: domain/knowledge-base/entity-match-review
  conforms: true
  how: "src/features/curation/types.ts: held at EntityMatchQueueItemWire and EntityMatchCandidateWire\
    \ (lines 51-64), with EntityMatchCandidate and EntityMatchQueueItem (lines 119-132) — export interface\
    \ EntityMatchCandidateWire {\n  readonly candidate_node_id: string;\n  readonly canonical_name: string;\n\
    \  readonly similarity: number;\n}"
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/features/curation/types.ts: held at the NodeStatus type, line 30 — export type NodeStatus
    = "active" | "needs_review" | "merged" | "deleted";'
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/review-queue-kind
  conforms: false
  how: 'src/features/curation/state/curation-store.ts, line 44, the type SelectedItemKind, and line 181,
    the kind check in parseItemSearchParam: export type SelectedItemKind = "entity_match" | "disputed";

    ...

    if (kind !== "entity_match" && kind !== "disputed") return null; — The review queue vocabulary is
    declared a second time here, and the check repeats the literals inline. The node domain/knowledge-base/review-queue-kind
    is bound to src/features/curation/types.ts, where `ReviewQueueKind = "entity_match" | "disputed"`
    is declared. When the node changes, `--check` reaches types.ts and never reaches this file. The two
    lists can then diverge with nothing saying which one was decided. The node lists `entity-match` with
    a hyphen, while both files use the underscore form, so a reader comparing them cannot tell which spelling
    is authoritative.'
  observed_at:
  - src/features/curation/state/curation-store.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the inline union
    type of the `value` field in SOURCE_OPTIONS, line 21 — readonly value: "stated" | "document" | "received";

    src/features/curation/components/CorrectionForm/correction-schema.ts: held at `validFromSourceSchema`,
    line 44 — export const validFromSourceSchema = z.enum(["stated", "document", "received"]);

    src/features/curation/types.ts: held at the ValidFromSource type, line 37 — export type ValidFromSource
    = "stated" | "document" | "received";'
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
  - src/features/curation/components/CorrectionForm/correction-schema.ts
  - src/features/curation/types.ts
- node: domain/knowledge-base/value-type
  conforms: true
  how: 'src/features/curation/types.ts: held at the AttributeValueType type, line 45 — export type AttributeValueType
    = "text" | "date" | "number" | "bool";'
  encoded_at:
  - src/features/curation/types.ts
- node: rules/curation-workspace/acceptance-rate-shows-as-a-whole-percentage
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at formatPercent, line 61
    — return `${Math.round(rate * 100)}%`;'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/active-tab-lives-only-on-the-page
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at line 74 — const [kindFilter, setKindFilter]
    = useState<QueueKindFilter>(undefined);

    The state is page-local and starts at all (undefined) on each mount. The only address write is `search:
    next !== undefined ? { item: next } : {}`, which carries no tab.'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/any-other-refusal-shows-in-the-panel-alert
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the generic `Alert`,\
    \ lines 244-255 — <Alert variant=\"destructive\" role=\"alert\" className=\"mx-md\">\n  {serverError.message}\n\
    </Alert>"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/attribute-correction-needs-a-value
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the attribute branch\
    \ of the object-level `superRefine`, lines 63-70 — if (data.itemKind === \"attribute\") {\n      if\
    \ (data.value === null) {\n        ctx.addIssue({ code: \"custom\", path: [\"value\"], message: \"\
    Informe o valor corrigido.\" });\nThe `value` field is `optionalString`, with no check against a value\
    \ type."
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/baseline-ignores-tab-changes
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at lines 101-105 and 201 — useEffect(()\
    \ => {\n  if (lastSeenTotal === null && data !== undefined) {\n    updateLastSeen(total);\n  }\n},\
    \ [lastSeenTotal, total, data, updateLastSeen]);\nThe baseline is written only when null and from\
    \ the pill's `onAck={() => updateLastSeen(total)}`. `setKindFilter` triggers no call to `updateLastSeen`."
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/batch-bar-actions-follow-the-kind
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the per-kind flags, lines 84-86,
    and the conditional rendering of each action — const showConfirm = kind === "uncertain";

    const showReject = kind === "uncertain";

    const showKeepSeparate = kind === "entity_match";'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-acts-on-one-kind
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the single `kind: BatchKind` prop,
    which takes one value for the whole selection, and the flags derived from it — readonly kind: BatchKind;'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-needs-two-items
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the guard at line 77 — if (count
    < 2) return null;'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-offers-to-clear-the-selection
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the clear Button, lines 147-155,
    which only calls the `onClear` prop — aria-label="Limpar seleção"

    onClick={onClear}'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-shows-the-count
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the count span, line 146 — <span
    aria-live="polite">{count} selecionados</span>'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/blank-reason-blocks-a-destructive-decision
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ReasonField.tsx: held at validateOnSubmit, lines\
    \ 58-66: the trimmed-empty check, the error, the focus move and the return of false. Sending nothing\
    \ is the parent's act on that return value, and it is not in this file. — const trimmed = value.trim();\n\
    \        if (trimmed.length === 0) {\n          setError(\"Informe um motivo para continuar.\");\n\
    \          const el = document.getElementById(id) as HTMLTextAreaElement | null;\n          el?.focus();\n\
    \          return false;\n        }"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
- node: rules/curation-workspace/caller-cancellation-ends-the-request
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at httpCuration(), lines 153-168: the caller''s signal
    is composed with the cutoff signal and passed to fetch. — `const signal = composeSignals([timeoutController.signal,
    userSignal]);` and `if (signal !== undefined) fetchInit.signal = signal;`'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/candidate-shows-its-similarity-as-a-percentage
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CandidateCard.tsx: held at clampPct, lines 23-27,\
    \ and the render of the name and percentage at lines 60-61 — function clampPct(n: number): number\
    \ {\n  if (n < 0) return 0;\n  if (n > 1) return 100;\n  return Math.round(n * 100);\n}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CandidateCard.tsx
- node: rules/curation-workspace/changing-the-item-clears-the-draft
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the `useEffect` at lines
    99-103 — setSelectedCandidate(null);

    setSelectedSide(null);

    setReason("");'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/changing-the-item-restarts-the-correction
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at line 59, the initial\
    \ closed state. The restart on item change is forced by the caller's `key` (DecisionPanel.tsx), not\
    \ by this file. — const [open, setOpen] = useState(false);\nsrc/features/curation/components/DecisionPanel/DecisionPanel.tsx:\
    \ held at the `key` on `CorrectionSection`, line 300 — <CorrectionSection\n  key={correctionItemId}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/check-toggles-the-item-in-the-checked-set
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at lines 156-165, `onToggleCheck` — const\
    \ next = new Set(checkedIds);\nif (next.has(selectedItem.id)) {\n  next.delete(selectedItem.id);\n\
    } else {\n  next.add(selectedItem.id);\n}\nsetSelectedItems(next);"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/checked-set-starts-empty-and-is-replaced-whole
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at makeInitialState and setSelectedItems —
    selectedItems: new Set<string>(),

    ...

    set({ selectedItems: items });'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/chunk-excerpt-is-cut-to-200-characters
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at truncate() and its
    call on the chunk excerpt, lines 62-65 and 249 — {truncate(chunk.excerpt, 200)}'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/chunk-shows-its-source-date-and-offsets
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the chunk paragraph,
    lines 239-243, with formatSourceType and formatDate — {formatSourceType(chunk.rawInformation.sourceType)}
    ·{" "}

    {formatDate(chunk.rawInformation.receivedAt)} · trecho{" "}

    {chunk.offsetStart}–{chunk.offsetEnd}'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/client-detects-no-unchanged-correction
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at the whole schema,
    by absence. No branch compares the values against the current item, and the only comparisons are the
    date order and the required fields. — The `superRefine` at lines 61-103 holds three checks (value
    or target, start before end, fragment under stated) and no comparison with the item''s current values.'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/confirmation-or-rejection-refreshes-the-provenance-of-the-item
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at onSuccess of useConfirmItem (lines 289-293)\
    \ and of useRejectItem (lines 310-314), through invalidateCurationAndAffected — invalidateCurationAndAffected(queryClient,\
    \ {\n  items: [{ kind: variables.item_kind, id: variables.item_id }],\n});"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/correction-asks-for-a-value-or-a-target
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/CorrectionFields.tsx: held at the ternary at the
    top of the CorrectionFields render, `itemKind === "attribute" ? ( ... ) : ( ... )`, lines 32-85. —
    `{itemKind === "attribute" ? (` renders `<Label htmlFor="cf-value">Novo valor</Label>` bound to `name="value"`;
    the other branch renders `<Label htmlFor="cf-target">Nó-alvo (ID)</Label>` bound to `name="targetNodeId"`.
    Only one branch renders for a given item kind.'
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionFields.tsx
- node: rules/curation-workspace/correction-checks-run-in-order
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at the object-level
    `superRefine`, lines 61-103 — The `superRefine` runs the value or target check first (lines 63-79),
    then `data.validFrom >= data.validTo` on path ["validTo"] (lines 82-90), then the `stated` fragment
    check on path ["validFromFragmentId"] (lines 93-102).'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-dates-have-the-iso-shape
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at `ISO_DATE_RE` and
    `dateString`, lines 22 and 31-42 — const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/; ... if (v !== null &&
    !ISO_DATE_RE.test(v)) {'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-fields-start-from-the-item
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the defaultValues
    passed to useForm through buildDefaults (lines 68-85). The basis fallback is held here. The empty
    reason is not visible in this file and is presumably in buildDefaults. — value: defaults.value ??
    null,

    validFrom: defaults.validFrom ?? null,

    validFromSource: defaults.validFromSource ?? "document",

    src/features/curation/components/CorrectionForm/correction-schema.ts: held at `buildDefaults`, lines
    122-136 — value: d.value ?? "", ... validFromSource: d.validFromSource ?? "document", validFromFragmentId:
    d.validFromFragmentId ?? "", reason: "",'
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-is-offered-only-for-a-dispute
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at `canCorrect`, line 205,
    and the conditional render at line 298 — const canCorrect = item.kind === "disputed"; ... {canCorrect
    && ('
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/correction-opens-inline-and-returns-focus
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at the `open ? <CorrectionForm\
    \ ... onCancel={close} />` branch (lines 72-84) and close() (lines 62-68) — function close(): void\
    \ {\n    setOpen(false);\n    // Restore focus to the \"Corrigir…\" button per §8.\n    requestAnimationFrame(()\
    \ => {\n      correctButtonRef.current?.focus();\n    });\n  }"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
- node: rules/curation-workspace/correction-reason-is-required-and-trimmed
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the `reason` field\
    \ of `correctionSchema`, lines 56-59 — reason: z\n      .string()\n      .trim()\n      .min(1, {\
    \ message: \"Informe um motivo para continuar.\" }),"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-refreshes-the-provenance-and-the-history
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at onSuccess of useCorrectItem, lines 331-348\
    \ — items: [\n  { kind: variables.item_kind, id: variables.item_id },\n  { kind: variables.item_kind,\
    \ id: data.new_item_id },\n],\n...\nvoid queryClient.invalidateQueries({ queryKey: historyKey });"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/correction-refusals-reach-the-form
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at correctionServerError,
    lines 36-46, and its use at line 79. This file holds the form-side half. The panel''s alert half sits
    in DecisionPanel.tsx. — serverError={correctionServerError(serverError)}

    src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the exclusion list at lines
    245-251 and `serverError={serverError}` on `CorrectionSection`, line 306 — "BUSINESS_TEMPORAL_INCOHERENT",

    "BUSINESS_CORRECTION_NO_CHANGES",

    ].includes(serverError.code) && ('
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/correction-sends-the-item-the-values-and-the-reason
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the return object\
    \ of `buildCorrectItemRequest`, lines 150-163 — item_kind: itemKind,\n    item_id: itemId,\n    corrected:\
    \ { ... valid_from: values.validFrom, valid_to: values.validTo, valid_from_source: values.validFromSource,\
    \ valid_from_fragment_id: values.validFromFragmentId },\n    reason: values.reason,"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-shows-submitting
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the two Buttons in
    the footer (lines 185-207) — onClick={onCancel}

    disabled={submitting}

    ...

    loading={submitting}'
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/correction-start-precedes-the-end
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the temporal branch\
    \ of the object-level `superRefine`, lines 82-90 — if (data.validFrom !== null && data.validTo !==\
    \ null) {\n      if (data.validFrom >= data.validTo) {\n        ctx.addIssue({ code: \"custom\", path:\
    \ [\"validTo\"], message: \"O início deve ser anterior ao fim.\" });"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-starts-from-the-first-sides-values
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts: held at buildCorrectionDefaults(),\
    \ lines 43-58 — const first = item.sides[0];\n  if (!first) {\n    return { validFromSource: \"document\"\
    \ };\n  }\n  return {\n    value: first.value,\n    targetNodeId: first.targetNodeId,\n    validFrom:\
    \ first.validFrom ? first.validFrom.toISOString().slice(0, 10) : null,\n    validTo: first.validTo\
    \ ? first.validTo.toISOString().slice(0, 10) : null,\n    validFromSource: first.validFromSource,\n\
    \    validFromFragmentId: null,\n  };"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts
- node: rules/curation-workspace/correction-targets-the-first-side
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at `correctionItemId`,
    lines 208-209 — item.kind === "disputed" ? item.sides[0]?.itemId ?? "" : "";'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/curation-request-carries-the-access-token
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at authHeader(), lines 50-53. The function is exported
    and builds the header here. Attaching it to each request is done by the callers, outside this file,
    except on the resend path at lines 200-206. — `return token !== null ? { Authorization: `Bearer ${token}`
    } : {};`

    src/features/curation/hooks/useCurationQueue.ts: held at the `headers: authHeader()` argument of the
    httpCuration call (line 36). Whether the header is the bearer token or absent is decided by authHeader()
    in api/_request.ts, so this file only passes it along. — { method: "GET", headers: authHeader() }'
  encoded_at:
  - src/features/curation/api/_request.ts
  - src/features/curation/hooks/useCurationQueue.ts
- node: rules/curation-workspace/curation-request-times-out-after-thirty-seconds
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at the DEFAULT_TIMEOUT_MS constant, line 65, and the
    abort timer in httpCuration(), lines 159-165. — `const DEFAULT_TIMEOUT_MS = 30_000;` and `timeoutController.abort(new
    DOMException("Request timed out after 30s", "TimeoutError"))`, with `clearTimeout(timer)` once the
    status has arrived.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/date-justification-offers-three-bases
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/DateJustification.tsx: held at SOURCE_OPTIONS,
    lines 20 to 40, rendered by the RadioGroup map, lines 91 to 102 — { value: "stated", label: "Declarada
    no fragmento", hint: ... },

    { value: "document", label: "Data do documento", hint: ... },

    { value: "received", label: "Data de recebimento", hint: ... },

    {SOURCE_OPTIONS.map((opt) => (

    src/features/curation/components/CorrectionForm/correction-schema.ts: held at the order of `validFromSourceSchema`,
    line 44, in this file. The labels and hints are not declared here. — export const validFromSourceSchema
    = z.enum(["stated", "document", "received"]);'
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at fmt(), line 28 — return
    d === null ? "—" : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });

    src/features/curation/components/DecisionPanel/PeriodTimeline.tsx: held at the fmtDate function, line
    27 — return d === null ? "" : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  - src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
- node: rules/curation-workspace/decision-moves-to-the-ring-neighbour
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at the getNextItem callback passed\
    \ to useDecisionDispatch, lines 58-59 — getNextItem: () =>\n  neighbour(queue, useCurationStore.getState().selectedItem,\
    \ \"next\"),"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/decision-on-the-wrong-kind-sends-nothing
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the guards at the top of onResolveEntityMatch
    (line 80) and onResolveDispute (line 96) — if (item.kind !== "entity_match") return;

    if (item.kind !== "disputed") return;'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/decision-removes-its-item-by-its-identifier
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at optimisticIdOf (lines 537-551); for\
    \ a destructive decision the id comes from the caller's optimisticId argument — case \"resolve_entity_match_keep\"\
    :\n      return d.nodeId;\n    case \"resolve_dispute_keep\":\n    case \"resolve_dispute_adjust\"\
    :\n      return d.body.item_ids[0] ?? null;\n    case \"confirm_item\":\n      return d.body.item_id;\n\
    \    case \"correct_item\":\n      return d.body.item_id;"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/decision-shows-as-sending-until-answered
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionBar.tsx: held at the `loading={submitting}`\
    \ prop on each rendered Button, line 90. The parent decides when `submitting` is true. — submitting\
    \ = false,\nloading={submitting}\nsrc/features/curation/hooks/useDecisionDispatch.tsx: held at commit\
    \ (lines 364-404), the submitting state — setSubmitting(true);\n      try {\n        await runMutation(dispatch);\n\
    ...\n      } finally {\n        setSubmitting(false);\n      }"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionBar.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decision-moves-on-twice
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive calls advance()\
    \ when the decision is made (line 442), and commit calls advance() after a successful runMutation\
    \ (line 380) — onItemRemove(optimisticId);\n      advance();\n...\n        await runMutation(dispatch);\n\
    \        if (!isDestructive) {\n          toast.success(\"Confirmado.\", { duration: 2_000 });\n \
    \       }\n        advance();"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decision-opens-the-undo-toast
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive, the toast.custom\
    \ call (lines 448-463) rendering UndoToast with the caption and the deadline — <UndoToast\n      \
    \      label={label}\n            deadlineMs={deadlineMs}\n...\n      { id: toastIdValue, duration:\
    \ UNDO_WINDOW_MS },"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decision-removes-the-item-at-once
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive, lines 441-442,\
    \ before the timer is armed — onItemRemove(optimisticId);\n      advance();"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decisions-carry-a-caption
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the third argument of each dispatchDestructive
    call, lines 85, 102 and 123 — "Item fundido",

    "Lado preferido",

    "Item rejeitado",

    src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the captions passed to
    dispatchDestructive in DrawerPanel (lines 186, 203, 225) — dispatch.dispatchDestructive({ kind: "resolve_entity_match_merge",
    ... }, item.nodeId, "Item fundido"); ... "Lado preferido"); ... "Item rejeitado");'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/destructive-decisions-wait-for-undo
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at the routing to dispatchDestructive\
    \ for the entity-match merge (lines 81-86), the dispute preference (lines 98-103) and the rejection\
    \ (lines 119-124). The wait for undo itself is in the dispatch hook, outside this file. — dispatch.dispatchDestructive(\n\
    \  { kind: \"resolve_entity_match_merge\", nodeId: item.nodeId, body },\n  item.nodeId,\n  \"Item\
    \ fundido\",\n);\nsrc/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the\
    \ dispatchDestructive branches for the merge, the preference and the rejection in DrawerPanel actions\
    \ — const isDestructive = body.decision === \"merge_into\"; if (isDestructive) { dispatch.dispatchDestructive(...)\
    \ }; if (body.decision === \"prefer_one\") { dispatch.dispatchDestructive(...) }; onReject: (body)\
    \ => { dispatch.dispatchDestructive({ kind: \"reject_item\", body }, ...\nsrc/features/curation/hooks/useDecisionDispatch.tsx:\
    \ held at the DestructiveDispatch union (merge, prefer, reject) and dispatchDestructive, which arms\
    \ a timer before commit. NonDestructiveDispatch does not list those kinds. — | { readonly kind: \"\
    resolve_entity_match_merge\"; ...\n  | { readonly kind: \"resolve_dispute_prefer\"; ...\n  | { readonly\
    \ kind: \"reject_item\"; ...\nconst timeoutId = setTimeout(() => {"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-success-shows-no-notice-and-moves-on
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit, the success path (lines 374-380),\
    \ where the toast is guarded by !isDestructive and advance() runs unconditionally — if (!isDestructive)\
    \ {\n    toast.success(\"Confirmado.\", { duration: 2_000 });\n  }\n  advance();"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/display-mode-is-decided-from-the-entry-alone
  conforms: true
  how: 'src/features/curation/lib/display-mode.ts: held at the signature of resolveDisplayMode, line 31,
    which takes only the queue entry — export function resolveDisplayMode(item: ReviewQueueItem): DisplayMode
    {'
  encoded_at:
  - src/features/curation/lib/display-mode.ts
- node: rules/curation-workspace/dispute-evidence-counts-as-viewed-when-its-trail-says-so
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at provenanceContextOf (lines 39-41),\
    \ the armedImmediately and effectiveEvidenceViewed lines (68-69), and the ProvenanceTrail onEvidenceViewed\
    \ callback (lines 136-138) — const first = item.sides[0];\nif (first === undefined) return null;\n\
    return { itemKind: item.itemKind, itemId: first.itemId };\nconst effectiveEvidenceViewed = armedImmediately\
    \ || evidenceViewed;\nonEvidenceViewed={() => {\n  setEvidenceViewed(true);\n}}"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/dispute-header-adds-the-relation
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the `<span>` in the\
    \ header, lines 229-235 — {item.kind === \"disputed\" &&\n  subjectQ.data != null &&\n  headerRelation\
    \ && (\n    <span ...>· {headerRelation}</span>"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/dispute-header-falls-back-until-the-name-arrives
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts: held at describeScope(),\
    \ lines 36-39 — if (item.kind === \"entity_match\") return item.canonicalName;\n  return item.scope.linkType\
    \ ?? item.scope.attributeKey ?? \"Item em disputa\";"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts
- node: rules/curation-workspace/dispute-header-names-its-subject-node
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at `subjectId` and `useCurationNodeDetail`,\
    \ lines 73-79 — return item.itemKind === \"link\"\n  ? item.scope.sourceNodeId\n  : item.scope.nodeId;"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/dispute-offers-prefer-one-and-keep-disputed
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the dispute branch of
    `buttons`, lines 185-199 — id: "prefer_one", ... id: "keep_disputed",'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/dispute-resolution-refreshes-the-provenance-of-its-items
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at onSuccess of useResolveDispute, lines 265-272\
    \ — items: variables.item_ids.map((id) => ({\n  kind: variables.item_kind,\n  id,\n})),"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/dispute-shows-summary-for-two-sides-with-an-end
  conforms: true
  how: "src/features/curation/lib/display-mode.ts: held at the disputed branch of resolveDisplayMode,\
    \ lines 42-50 — if (item.sides.length === 2) {\n    const noOverlap = item.sides.some((s) => s.validTo\
    \ !== null);\n    if (noOverlap) return \"summary\";\n  }\n  return \"full-diff\";"
  encoded_at:
  - src/features/curation/lib/display-mode.ts
- node: rules/curation-workspace/drawer-closes-on-esc-close-backdrop-or-removal
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the Dialog Root''s
    onOpenChange and the onItemRemove closure in DrawerPanel — <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    ... <DialogPrimitive.Close aria-label="Fechar curadoria" ...> ... onItemRemove: () => { forceClose();
    } with close(): void { onOpenChange(false); }

    src/features/curation/components/CurationDrawer/CurationDrawer.types.ts: held at `CurationDrawerProps`,
    the `open` and `onOpenChange` members, lines 21 and 28 — readonly open: boolean;

    readonly onOpenChange: (open: boolean) => void;'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
  - src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
- node: rules/curation-workspace/drawer-dispute-decisions-wait-for-the-evidence
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at provenanceContextOf,
    and effectiveEvidenceViewed in DrawerPanel — const first = item.sides[0]; ... return { itemKind: item.itemKind,
    itemId: first.itemId }; const armedImmediately = provenance === null; const effectiveEvidenceViewed
    = armedImmediately || evidenceViewed; <ProvenanceTrail ... onEvidenceViewed={() => { setEvidenceViewed(true);
    }} />'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/drawer-entity-match-decisions-are-enabled-at-once
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at provenanceContextOf
    and armedImmediately — if (item.kind === "entity_match") return null; const armedImmediately = provenance
    === null; const effectiveEvidenceViewed = armedImmediately || evidenceViewed;'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/drawer-finds-its-item-in-the-queue-listing
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at findDrawerItem, and
    the no-argument useListReviewQueue() call in DrawerBody — if (it.nodeId === itemId) return it; ...
    if (it.sides.some((s) => s.itemId === itemId)) return it; const queueQuery = useListReviewQueue();'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/drawer-has-no-next-item
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the getNextItem and
    onItemRemove arguments of useDecisionDispatch in DrawerPanel — getNextItem: () => null, onItemRemove:
    () => { forceClose(); },'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/drawer-holds-one-queue-item
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at DrawerBodyProps (kind,
    itemId) and findDrawerItem. The CurationDrawerProps shape lives in CurationDrawer.types.ts, outside
    this file. — readonly kind: "entity_match" | "disputed"; readonly itemId: string; ... export function
    findDrawerItem(items, kind: "entity_match" | "disputed", itemId: string): ReviewQueueItem | null

    src/features/curation/components/CurationDrawer/CurationDrawer.types.ts: held at `CurationDrawerProps`,
    the `kind` and `itemId` members, lines 33 and 39 — readonly kind: SelectedItemKind;

    readonly itemId: string;'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
  - src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
- node: rules/curation-workspace/drawer-never-changes-the-address
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at DrawerInlineError,
    the only navigation, and the absence of any navigation call in the rest of the file — <Link to="/curation"
    search={{ item: escapeItemParam }} onClick={onClose} ...> with const escapeItemParam = `${kind}:${itemId}`;'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/drawer-reads-the-queue-only-while-open
  conforms: true
  how: "src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the body of CurationDrawer,\
    \ which mounts DrawerBody, the only caller of useListReviewQueue, only when open — {open ? (\n   \
    \             <DrawerBody kind={kind} itemId={itemId} close={close} />\n              ) : null}"
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/drawer-shares-the-evidence-flag
  conforms: true
  how: 'src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the store selectors
    at the top of DrawerPanel — const evidenceViewed = useCurationStore((s) => s.evidenceViewed); const
    setEvidenceViewed = useCurationStore((s) => s.setEvidenceViewed);'
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/drawer-shows-the-callers-label
  conforms: true
  how: "src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the Description inside\
    \ the header of CurationDrawer — {itemLabel !== undefined && itemLabel.length > 0 && (\n         \
    \         <DialogPrimitive.Description className=\"mt-xs text-xs text-muted-foreground truncate\"\
    >\n                    {itemLabel}"
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/each-decision-uses-the-action-of-its-kind
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at runMutation, the switch on dispatch.kind\
    \ (lines 272-294) — case \"resolve_entity_match_merge\":\ncase \"resolve_entity_match_keep\":\n  await\
    \ mEntityMatch.mutateAsync({\n...\ncase \"resolve_dispute_prefer\":\ncase \"resolve_dispute_keep\"\
    :\ncase \"resolve_dispute_adjust\":\n  await mDispute.mutateAsync(dispatch.body);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/empty-correction-field-is-sent-as-null
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at `optionalString`
    and `dateString`, lines 26-34 — .transform((v) => (v === undefined || v.length === 0 ? null : v))'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/entity-match-evidence-counts-as-viewed-at-once
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the entity_match branch of provenanceContextOf,
    line 38, and the armedImmediately and effectiveEvidenceViewed lines, 68-69 — if (item.kind === "entity_match")
    return null;

    const armedImmediately = provenance === null;

    const effectiveEvidenceViewed = armedImmediately || evidenceViewed;'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/entity-match-header-names-the-proposed-node
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at `headerSubject`, lines\
    \ 84-87 — item.kind === \"entity_match\"\n  ? item.canonicalName"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/entity-match-offers-merge-and-keep-separate
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the entity-match branch
    of `buttons`, lines 170-184 — id: "merge_into", ... id: "keep_separate",'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/entity-match-resolution-refreshes-the-node-details
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at onSuccess of useResolveEntityMatch, lines\
    \ 217-227 — const nodeIds: string[] = [variables.node_id];\nif (variables.body.target_node_id) {\n\
    \  nodeIds.push(variables.body.target_node_id);\n}\ninvalidateCurationAndAffected(queryClient, { nodeIds\
    \ });"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/entity-match-shows-summary-for-one-high-similarity-candidate
  conforms: true
  how: "src/features/curation/lib/display-mode.ts: held at the entity_match branch of resolveDisplayMode,\
    \ lines 32-40, and the constant on line 29 — export const HIGH_SIMILARITY_THRESHOLD = 0.9;\n  if (item.candidates.length\
    \ === 1) {\n    const top = item.candidates[0];\n    if (top !== undefined && top.similarity >= HIGH_SIMILARITY_THRESHOLD)\
    \ {\n      return \"summary\";"
  encoded_at:
  - src/features/curation/lib/display-mode.ts
- node: rules/curation-workspace/every-decision-waits-for-the-evidence
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at the Button's `aria-disabled`\
    \ and `onClickCapture` guard, lines 91-98 — onClickCapture={(e) => {\n            if (!evidenceViewed)\
    \ {\n              e.preventDefault();\n              e.stopPropagation();\n            }\n      \
    \    }}\nsrc/features/curation/components/DecisionPanel/DecisionBar.tsx: held at the gated() wrapper\
    \ (lines 54-66) and the aria-disabled attribute on each Button (line 86) — if (!evidenceViewed) {\n\
    \        e.preventDefault();\n        e.stopPropagation();\n        return;\n      }\n      handler();\n\
    aria-disabled={!evidenceViewed || undefined}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionBar.tsx
- node: rules/curation-workspace/every-side-is-listed-and-selectable
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ComparePane.tsx: held at the item.sides.map in\
    \ DisputeView (lines 150-157), wiring each card's onSelect to onSelectSide — {item.sides.map((s) =>\
    \ (\n  <DisputeSideCard\n    key={s.itemId}\n    side={s}\n    selected={selectedSide === s.itemId}\n\
    \    onSelect={onSelectSide}\n  />\nsrc/features/curation/components/DecisionPanel/DisputeSideCard.tsx:\
    \ held at the radio button and its onClick, lines 56-61. This file holds only selection. Listing every\
    \ side is in ComparePane.tsx. — role=\"radio\"\naria-checked={selected}\nonClick={() => onSelect(side.itemId)}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ComparePane.tsx
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/evidence-indicator-pulses-until-viewed
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/EvidenceChip.tsx: held at the `viewed` ternaries
    in the `className` (line 33 onward) and in the visible text (line 44) — "border-border-glass bg-surface-glass-panel
    text-foreground motion-safe:animate-pulse"'
  encoded_at:
  - src/features/curation/components/DecisionPanel/EvidenceChip.tsx
- node: rules/curation-workspace/evidence-viewed-is-supplied-by-the-caller
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.types.ts: held at The required `evidenceViewed`
    prop in `DecisionPanelProps`, line 54. The file declares no logic that computes it. — readonly evidenceViewed:
    boolean;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
- node: rules/curation-workspace/failed-decision-is-read-in-order
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at handleError, branch order (lines
    299-360): non-envelope, auth codes, VANISHED_CODES, INLINE_FIELD_CODES, httpStatus >= 500, fallback
    — if (!isEnvelopeError(err)) {

    ...

    if (VANISHED_CODES.has(code)) {

    ...

    if (INLINE_FIELD_CODES.has(code)) {

    ...

    if (httpStatus >= 500) {'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the `hasError && fallback`
    branch of buildCells, lines 77-92 — { label: "Aceitação", value: "—" },

    { label: "Em revisão", value: "—" },

    { label: "Incertos", value: "—" },

    { label: "Disputados", value: String(fallback.disputedQueueCount) },

    { label: "Fila entidades", value: String(fallback.entityMatchQueueCount) },'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/failed-metrics-never-fail-the-strip
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the final `return [];`
    of buildCells and the `skeleton` derivation in MetricsStrip, lines 93 and 99 — return [];

    const skeleton = !settled || cells.length === 0;'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/failure-without-an-envelope-leaves-the-item-removed
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit's catch block (lines 391-398);\
    \ the restore is conditioned on isEnvelopeError — if (\n          isDestructive &&\n          isEnvelopeError(err)\
    \ &&\n          !VANISHED_CODES.has(err.code) &&\n          optimisticId !== null\n        ) {\n \
    \         onItemRestore(optimisticId);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/field-code-wins-over-the-server-status
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at handleError, the INLINE_FIELD_CODES\
    \ branch (lines 340-343), which comes before the httpStatus >= 500 branch — if (INLINE_FIELD_CODES.has(code))\
    \ {\n        setServerError({ code, message, httpStatus });\n        return;\n      }"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/field-messages-appear-on-blur-and-submit
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the useForm options
    and the submit handler binding (lines 68-87 and 131) — mode: "onBlur",

    onSubmit={handleSubmit(submit)}'
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/first-unauthorized-curation-answer-refreshes-the-token-once
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at the 401 branch of httpCuration(), lines 196-212,
    with trySilentRefresh(), lines 123-134. — `const newJwt = await fetchAccessToken(); useAuthStore.getState().setToken(newJwt);`
    and `return httpCuration<T>(path, { ...opts, headers: Object.fromEntries(nextHeaders.entries()), __retried:
    true });`'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/form-hands-the-request-to-its-caller
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.types.ts: held at the `onSubmit`\
    \ and `serverError` members of CorrectionFormProps, lines 57-64 — readonly onSubmit: (body: CorrectItemRequest)\
    \ => void;\nreadonly serverError?: { readonly code: string; readonly message: string } | null;\nsrc/features/curation/components/DecisionPanel/CorrectionSection.tsx:\
    \ held at the `onSubmit` prop of CorrectionForm, lines 81-83, and the `serverError` prop it receives\
    \ — onSubmit={(body) => {\n          onCorrect(body);\n        }}\nsrc/features/curation/components/DecisionPanel/DecisionPanel.tsx:\
    \ held at the caller side, lines 306 and 309-311. The form's own behavior is in `CorrectionSection`\
    \ and `CorrectionForm`, not in this file. — serverError={serverError}\nonCorrect={(req) => {\n  actions?.onCorrect?.(req);\n\
    }}"
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.types.ts
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/fragment-field-shows-only-under-stated
  conforms: true
  how: "src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the conditions\
    \ of `showPicker` and `showManualFragment`, lines 70 to 75, which gate both fragment blocks and the\
    \ `fragmentErrorMessage` paragraphs inside them — const showPicker =\n  validFromSource === \"stated\"\
    \ &&\nconst showManualFragment = validFromSource === \"stated\" && !showPicker;"
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/fragment-filter-reaches-the-picker
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at the conditional\
    \ spread at line 77 — {...(fragmentFilter ? { fragmentFilter } : {})}\nsrc/features/curation/components/DecisionPanel/DecisionPanel.types.ts:\
    \ held at The optional `fragmentFilter` prop in `DecisionPanelProps`, lines 70-73. This file declares\
    \ the shape of the filter the caller hands in. The forwarding to the picker is in another file that\
    \ this pass did not read. — readonly fragmentFilter?: {\n  readonly llmRunId?: string;\n  readonly\
    \ rawInformationId?: string;\n};"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
- node: rules/curation-workspace/fragment-id-is-sent-whatever-the-basis
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at `buildCorrectItemRequest`,
    line 160 — valid_from_fragment_id: values.validFromFragmentId,'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/fragment-shows-its-confidence-as-a-percentage
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the fragment header,
    line 231 — <span>confiança {(frag.confidence * 100).toFixed(0)}%</span>'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/fragment-text-is-cut-to-280-characters
  conforms: true
  how: "src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at truncate() default\
    \ max and its call on the fragment text, lines 62-65 and 233 — function truncate(text: string, max\
    \ = 280): string {\n  if (text.length <= max) return text;\n  return `${text.slice(0, max - 1).trimEnd()}…`;\n\
    }"
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/full-presentation-lists-every-candidate
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ComparePane.tsx: held at the fall-through branch\
    \ of EntityMatchView, the item.candidates.map at lines 83-91 — item.candidates.map((c) => (\n  <CandidateCard\n\
    \    key={c.candidateNodeId}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ComparePane.tsx
- node: rules/curation-workspace/header-badge-names-the-queue-kind
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts: held at headerBadge(),\
    \ lines 25-33 — if (item.kind === \"entity_match\") {\n    return { state: \"uncertain\", label: \"\
    Para revisar\" };\n  }\n  return { state: \"disputed\", label: \"Disputado\" };\nsrc/features/curation/components/QueueItem.tsx:\
    \ held at the branches of mapKindToBadge, lines 61-69 — if (kind === \"entity_match\") {\n    return\
    \ { state: \"uncertain\", label: \"Para revisar\" };\n  }\n  return { state: \"disputed\", label:\
    \ \"Disputado\" };"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts
  - src/features/curation/components/QueueItem.tsx
- node: rules/curation-workspace/immediate-decisions-are-sent-at-once
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at the routing to dispatchNonDestructive\
    \ for the entity-match keep (lines 88-92), the dispute keep (lines 104-108) and period adjustment\
    \ (lines 109-113), the confirmation (line 117) and the correction (line 127). The sending itself is\
    \ in the dispatch hook, outside this file. — dispatch.dispatchNonDestructive({ kind: \"resolve_dispute_keep\"\
    , body });\ndispatch.dispatchNonDestructive({ kind: \"confirm_item\", body });\ndispatch.dispatchNonDestructive({\
    \ kind: \"correct_item\", body });\nsrc/features/curation/components/CurationDrawer/CurationDrawer.tsx:\
    \ held at the dispatchNonDestructive branches in DrawerPanel actions — dispatch.dispatchNonDestructive({\
    \ kind: \"resolve_entity_match_keep\", ... }); dispatch.dispatchNonDestructive({ kind: \"resolve_dispute_keep\"\
    , body }); dispatch.dispatchNonDestructive({ kind: \"resolve_dispute_adjust\", body }); onConfirm:\
    \ ... dispatchNonDestructive({ kind: \"confirm_item\", body }); onCorrect: ... dispatchNonDestructive({\
    \ kind: \"correct_item\", body });\nsrc/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchNonDestructive\
    \ (lines 485-492), which calls commit directly, and the NonDestructiveDispatch union — const optimisticId\
    \ = optimisticIdOf(dispatch);\n      void commit(dispatch, optimisticId, false);"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/immediate-success-confirms-and-moves-on
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at commit, the success path (lines 374-380)
    — toast.success("Confirmado.", { duration: 2_000 });

    }

    advance();'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/inline-confirmation-confirms-or-cancels
  conforms: true
  how: "src/features/curation/components/BatchBar/BatchBar.tsx: held at handleConfirmReject and handleCancelReject,\
    \ lines 96-103 — function handleConfirmReject(): void {\n  setPendingReject(false);\n  onReject?.();\n\
    }\n\nfunction handleCancelReject(): void {\n  setPendingReject(false);\n}"
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/invalid-date-in-an-answer-fails-the-read
  conforms: true
  how: "src/features/curation/api/_transforms.ts: held at parseIso and parseIsoOrNull, lines 96-109. Every\
    \ required timestamp goes through parseIso. Every optional date goes through parseIsoOrNull, which\
    \ parses it when it is present. — const d = new Date(value);\nif (Number.isNaN(d.getTime())) {\n \
    \ throw new Error(`Invalid ISO date string: ${value}`);\n}\nreturn d;"
  encoded_at:
  - src/features/curation/api/_transforms.ts
- node: rules/curation-workspace/invalid-target-refusal-marks-the-candidate
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at `invalidCandidateId`,\
    \ lines 106-110, and the alert exclusion list — serverError?.code === \"BUSINESS_SELF_MERGE_FORBIDDEN\"\
    \ ||\nserverError?.code === \"BUSINESS_INVALID_TARGET_NODE\"\n  ? selectedCandidate"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/item-age-is-measured-from-a-fixed-reference
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at line 66 — const now\
    \ = useMemo(() => new Date(), [item]);\nsrc/features/curation/components/QueueItem.tsx: held at the\
    \ useMemo call in QueueItem, lines 100-103 — const relative = useMemo(\n    () => formatRelative(item.createdAt),\n\
    \    [item.createdAt],\n  );"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/components/QueueItem.tsx
- node: rules/curation-workspace/item-age-reads-in-minutes-hours-and-days
  conforms: false
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts, relative(), lines 11-22:\
    \ if (min < 1) return \"agora\";\n  if (min < 60) return `há ${min} min`;\n  const hr = Math.floor(min\
    \ / 60);\n  if (hr < 24) return `há ${hr} h`;\n  const day = Math.floor(hr / 24);\n  if (day < 30)\
    \ return `há ${day} d`;\n  return then.toLocaleDateString(\"pt-BR\"); — The age wording and its thresholds\
    \ (under a minute, under an hour, under a day, under thirty days, then the pt-BR date) are held here\
    \ by code, but the node that states them is not in this file's node set, so a change to the node does\
    \ not reach this file through the trace. The same format string is also present in frontend/src/features/curation/components/QueueItem.tsx,\
    \ so two copies of one rule exist and nothing ties either to the node. The negative-diff clamp `Math.max(0,\
    \ ...)` is the node's \"future time reading agora\"."
  observed_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts
- node: rules/curation-workspace/item-id-is-everything-after-the-first-colon
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at parseItemSearchParam, lines 177-180 — const
    colon = raw.indexOf(":");

    ...

    const id = raw.slice(colon + 1);'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/keep-decisions-check-only-the-gate
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the `keep_separate`\
    \ and `keep_disputed` branches of `dispatch`, lines 134-141 and 156-163. The gate itself lies in `DecisionBar`.\
    \ — if (name === \"keep_separate\") {\n  ...\n  actions?.onResolveEntityMatch?.({\n    decision: \"\
    keep_separate\",\n    reason: reason || null,\n  });"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/keep-disputed-sends-the-items-the-decision-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at lines 156-163 — item_kind:
    item.itemKind,

    item_ids: item.sides.map((s) => s.itemId),

    decision: "keep_disputed",

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/keep-separate-sends-the-decision-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at lines 134-141 — decision:
    "keep_separate",

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/keyboard-moves-follow-the-click-path
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 144-155, `onNext`, `onPrev` and
    `onSelectIndex` — if (next !== null) handleSelect(next);

    The keyboard callbacks end in `handleSelect`, the same function passed as `onSelect={handleSelect}`
    to QueueList.'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/keyboard-shortcuts-act-only-while-enabled
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at the `enabled` default and the early
    return in useCurationKeyboard, lines 153 and 172 — const { enabled = true, target } = options;

    ...

    if (!enabled) return undefined;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/keys-typed-into-a-field-are-no-shortcut
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at isEditableTarget, lines 86-100, and
    its use in onKeyDown at line 178 — if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
    return true;

    if (target.isContentEditable) return true;

    ...

    if (role === "combobox" || role === "listbox" || role === "textbox") {

    ...

    if (isEditableTarget(event.target)) return;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/last-seen-total-starts-empty-and-follows-changes
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at makeInitialState and updateLastSeen — lastSeenTotal:
    null,

    ...

    if (state.lastSeenTotal === total) return {};

    return { lastSeenTotal: total };'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/leaving-sends-the-pending-decision-at-once
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at the useEffect cleanup (lines 496-518)\
    \ — if (pendingRef.current !== null) {\n        toast.info(\"Ação comprometida ao sair.\");\n    \
    \    const snapshot = pendingRef.current;\n        clearTimeout(snapshot.timeoutId);\n        toast.dismiss(snapshot.toastId);\n\
    \        pendingRef.current = null;\n        void commit(snapshot.dispatch, snapshot.optimisticId,\
    \ true);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/link-correction-needs-a-target
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the link branch\
    \ of the object-level `superRefine`, lines 71-79 — } else if (data.itemKind === \"link\") {\n    \
    \  if (data.targetNodeId === null) {\n        ctx.addIssue({ code: \"custom\", path: [\"targetNodeId\"\
    ], message: \"Selecione o nó-alvo da fusão.\" });\n`targetNodeId` is `optionalString`, with no format\
    \ check."
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/link-items-use-link-reads-and-others-attribute-reads
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at the item branch in invalidateCurationAndAffected\
    \ (lines 183-189) and the history branch in useCorrectItem (lines 343-346) — kind === \"link\"\n \
    \ ? provenanceKeys.link(id)\n  : provenanceKeys.attribute(id);\n...\nvariables.item_kind === \"link\"\
    \n  ? [\"history\", \"link\", variables.item_id]\n  : [\"history\", \"attribute\", variables.item_id];"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/link-side-is-named-by-its-target
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the isLink and label\
    \ expressions, lines 44-53 — const isLink = side.value === null && side.targetNodeId !== null;\n...\n\
    (targetName ??\n      (nodeQ.isPending\n        ? \"Carregando…\"\n        : `nó ${side.targetNodeId?.slice(0,\
    \ 8) ?? \"?\"}`))\n...\n{isLink && targetType && ("
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/manual-fragment-id-is-not-checked
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at the `validFromFragmentId`
    field, line 55 — validFromFragmentId: optionalString,'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/merge-checks-the-gate-then-a-candidate-then-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at lines 125-126. The evidence
    gate that comes first is applied by `DecisionBar`, not here. — if (!selectedCandidate) return;

    if (!reasonRef.current?.validateOnSubmit()) return;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/merge-refreshes-both-node-details
  conforms: true
  how: 'src/features/curation/api/curation.hooks.ts: held at onSuccess of useMergeNodes, lines 244-248
    — nodeIds: [variables.survivor_id, variables.absorbed_id],'
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/merge-sends-the-decision-the-target-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at lines 127-131 — decision:
    "merge_into",

    target_node_id: selectedCandidate,

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/merge-stays-offered-without-a-candidate
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the always-present merge
    button, lines 171-177, and the early return at line 125 — id: "merge_into", label: "Fundir neste",
    ... if (!selectedCandidate) return;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/metrics-stay-fresh-for-thirty-seconds
  conforms: true
  how: 'src/features/curation/api/curation.hooks.ts: held at the useQuery options of useCurationMetrics,
    lines 150-154, with the constant on line 75 — const METRICS_STALE_MS = 30_000;

    ...

    staleTime: METRICS_STALE_MS,

    refetchOnWindowFocus: true,

    retry: 1,

    (there is no refetchInterval)'
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/metrics-strip-hides-the-reject-rate-and-the-time
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at Held by absence. buildCells
    builds only five cells, and none reads `reject_rate_by_code` or `computed_at`. — { label: "Fila entidades",
    value: String(metrics.entityMatchQueueCount) },

    ];'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/metrics-strip-shows-five-metrics-in-order
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the metrics branch of
    buildCells, lines 69-75, and the lead and counts render, lines 134-153 — const [lead, ...counts] =
    cells;

    <span className="text-lg font-semibold tracking-tight tabular-nums text-foreground">'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/metrics-strip-shows-placeholders-until-settled
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the `skeleton` derivation,
    line 99, and the `aria-busy` attribute with the pulse cells, lines 112 and 119-131 — aria-busy={skeleton
    || undefined}

    {Array.from({ length: 5 }, (_unused, i) => ('
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/modified-keys-are-no-shortcut
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at the first guard in mapKey, line 121
    — if (event.ctrlKey || event.altKey || event.metaKey) return null;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/moving-on-selects-the-next-item-and-counts-it
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at advance (lines 261-265) — const next\
    \ = getNextItem();\n    setSelectedItem(next);\n    incrementResolved();\nsrc/features/curation/state/curation-store.ts:\
    \ held at incrementResolved holds the count half. Choosing the next item is not in this file. It is\
    \ done by whoever calls setSelectedItem. — incrementResolved: () => {\n  set((state) => ({ sessionResolved:\
    \ state.sessionResolved + 1 }));\n},"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/new-item-count-is-the-total-minus-the-baseline
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 99-105 and 201 — const delta
    = lastSeenTotal === null ? 0 : Math.max(0, total - lastSeenTotal);

    The baseline starts at the first total seen and moves only at `<PollingPill delta={delta} onAck={()
    => updateLastSeen(total)} />`.'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/next-and-previous-move-through-the-queue-as-a-ring
  conforms: true
  how: "src/features/curation/components/curation-page-helpers.ts: held at neighbour(), lines 89-109 —\
    \ const idx =\n    cur === -1\n      ? direction === \"next\"\n        ? 0\n        : len - 1\n  \
    \    : direction === \"next\"\n        ? (cur + 1) % len\n        : (cur - 1 + len) % len;"
  encoded_at:
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/no-selection-leaves-no-item-parameter
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at stringifyItemSearchParam, line 194 — if
    (item === null) return undefined;'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/node-detail-sends-its-options-only-when-asked
  conforms: true
  how: "src/features/curation/api/node.hooks.ts: held at the function buildNodeQs, lines 57-65 — if (params.asOf\
    \ !== undefined) search.set(\"as_of\", params.asOf);\nif (params.inEffectOnly === true) search.set(\"\
    in_effect_only\", \"true\");\nif (params.includeUncertain === false)\n  search.set(\"include_uncertain\"\
    , \"false\");"
  encoded_at:
  - src/features/curation/api/node.hooks.ts
- node: rules/curation-workspace/nothing-is-preselected
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at lines 90-93 — const\
    \ [selectedCandidate, setSelectedCandidate] = useState<string | null>(\n  null,\n);\nconst [selectedSide,\
    \ setSelectedSide] = useState<string | null>(null);"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/one-destructive-decision-waits-at-a-time
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive, lines 436-438,\
    \ which commits the pending decision; commitPending clears its timer and dismisses its toast — if\
    \ (pendingRef.current !== null) {\n        commitPending();\n      }\n...\n    clearTimeout(p.timeoutId);\n\
    \    toast.dismiss(p.toastId);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/owner-selects-by-click-enter-or-space
  conforms: true
  how: "src/features/curation/components/QueueItem.tsx: held at the onClick and onKeyDown handlers on\
    \ the button, lines 124-125, and handleKey, lines 105-114 — onClick={() => onSelect(itemKey)}\nonKeyDown={handleKey}\n\
    if (event.key === \"Enter\" || event.key === \" \") {\n      event.preventDefault();\n      onSelect(itemKey);\n\
    \    }"
  encoded_at:
  - src/features/curation/components/QueueItem.tsx
- node: rules/curation-workspace/page-counts-loaded-entries-as-the-metrics-fallback
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 130-138, `metricsFallback` —
    if (it.kind === "entity_match") em += 1;

    else dp += 1;'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/page-does-not-remove-a-decided-item-itself
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the two empty handlers passed to
    useDecisionDispatch, lines 62-63 — onItemRemove: () => {},

    onItemRestore: () => {},'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/page-keeps-its-state-when-left
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 77-80, the store slices, with
    no unmount cleanup in the file — const selectedItem = useCurationStore((s) => s.selectedItem);

    const lastSeenTotal = useCurationStore((s) => s.lastSeenTotal);

    The page has no cleanup effect. The store''s `reset` is called nowhere in the non-test tree under
    src/features/curation, so the selection, the checked set and the baseline outlive the page.'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/page-lists-only-one-queue-page
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 119-120 — const items = data?.items
    ?? [];

    The page lists only `data.items` of the single read, and no further pages are requested here.'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/page-wires-four-shortcuts
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 143-166 — useCurationKeyboard({
    onNext: ..., onPrev: ..., onSelectIndex: (n) => {...}, onToggleCheck: () => {...} });

    Exactly these four callbacks are wired.'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/panel-takes-no-confirm-reject-or-adjust
  conforms: false
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.types.ts, The `DecisionPanelActions`
    interface, lines 38-44, and the imports of `ConfirmItemRequest` and `RejectItemRequest`, lines 26-27.:
    readonly onConfirm?: (body: ConfirmItemRequest) => void;

    readonly onReject?: (body: RejectItemRequest) => void; — The node says the decision panel takes no
    confirm, reject or adjust-periods decision. This props contract has the panel accept callbacks for
    confirm and reject. Anyone who reads the specification will believe those decisions cannot reach the
    panel, while the contract here lets a caller supply them. The two sources now say opposite things
    about what the panel takes.'
  observed_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
- node: rules/curation-workspace/pending-confirmation-survives-a-selection-change
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the `pendingReject` state, line
    73. Nothing resets it when `count` or `kind` changes, and it is declared before the `count < 2` early
    return. — const [pendingReject, setPendingReject] = useState(false);'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/pending-decision-lives-in-memory-only
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at the pendingRef declaration (line
    248), a useRef that is not persisted — const pendingRef = useRef<PendingDestructive | null>(null);'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/periods-are-listed-in-words-under-the-sides
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ComparePane.tsx: held at the unconditional `<PeriodTimeline\
    \ sides={item.sides} />` in DisputeView (line 158), which is rendered in both modes. The wording and\
    \ the A, B, C lettering sit in PeriodTimeline, another file. — <PeriodTimeline sides={item.sides}\
    \ />\nsrc/features/curation/components/DecisionPanel/PeriodTimeline.tsx: held at describeSide, which\
    \ letters each side by its index, and the PeriodTimeline component, which renders one li per side\
    \ in the order given — const label = String.fromCharCode(65 + i);\n{sides.map((s, i) => (\n  <li key={s.itemId}\
    \ className=\"flex items-center gap-sm\">\n    ...\n    {describeSide(i, s)}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ComparePane.tsx
  - src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
- node: rules/curation-workspace/picker-choice-shows-eighty-characters
  conforms: true
  how: "src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the `options` mapping\
    \ of the Select, lines 121 to 124 — options={(fragmentQ.data?.items ?? []).map((f) => ({\n  value:\
    \ f.fragmentId,\n  label: f.text.slice(0, 80),\n}))}"
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id
  conforms: true
  how: "src/features/curation/components/CorrectionForm/DateJustification.tsx: held at `showPicker` and\
    \ `showManualFragment`, lines 70 to 75 — const showPicker =\n  validFromSource === \"stated\" &&\n\
    \  hasFilter &&\n  !fragmentQ.isError &&\n  (fragmentQ.data?.items.length ?? 0) > 0;\nconst showManualFragment\
    \ = validFromSource === \"stated\" && !showPicker;"
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/prefer-checks-the-gate-then-a-side-then-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at lines 145-146. The evidence
    gate that comes first is applied by `DecisionBar`, not here. — if (!selectedSide) return;

    if (!reasonRef.current?.validateOnSubmit()) return;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/preference-removes-its-item-by-the-first-id
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the optimisticId declaration in
    onResolveDispute, line 97, passed to the prefer_one dispatchDestructive call — const optimisticId
    = body.item_ids[0] ?? item.sides[0]?.itemId ?? "";

    src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at onResolveDispute in DrawerPanel
    — const optimisticId = body.item_ids[0] ?? item.sides[0]?.itemId ?? "";'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/preference-sends-the-items-the-decision-the-winner-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at lines 147-153 — item_kind:
    item.itemKind,

    item_ids: item.sides.map((s) => s.itemId),

    decision: "prefer_one",

    winner_id: selectedSide,

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/queue-entries-are-identified-by-node-or-first-side
  conforms: false
  how: "src/features/curation/components/curation-page-helpers.ts, toSelectedItem and deriveInitialSelection,\
    \ lines 53-60 and 146-151: const firstSide = item.sides[0];\n  if (firstSide === undefined) return\
    \ null;\n  return { kind: \"disputed\", id: firstSide.itemId }; — The candidate rule identifies a\
    \ dispute by its first side's item id, or by a key built from assertion kind, source node and link\
    \ type or attribute key when it has no sides. Here a dispute with no sides gets no selection identity\
    \ at all (`return null`), and the first-side rule is coded twice in this file. For a side-less dispute,\
    \ next, previous, select-by-number and the initial selection yield null where the specification gives\
    \ an identity. The \"no sides\" behavior is stated by the code and by no node of this file's set.\
    \ The next reader looks in the specification and finds a different rule."
  observed_at:
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/queue-failure-is-checked-before-empty
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 120 and 217-221 — const isEmpty
    = !isPending && !isError && items.length === 0;

    {isError ? (<QueueErrorBanner ... />) : isEmpty ? (<EmptyQueue />) : ('
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
  conforms: false
  how: 'src/features/curation/hooks/useCurationQueue.ts, `QUEUE_POLL_MS`, `staleTime`, `refetchInterval`
    and `refetchOnWindowFocus` in the useQuery options (lines 23, 40-43), a second copy of the hook in
    api/curation.hooks.ts: const QUEUE_POLL_MS = 30_000;

    ...

    staleTime: 0,

    refetchInterval: QUEUE_POLL_MS,

    refetchIntervalInBackground: false,

    refetchOnWindowFocus: true,

    // the other copy, src/features/curation/api/curation.hooks.ts line 74 and line 127:

    const QUEUE_POLL_MS = 30_000;

    refetchInterval: QUEUE_POLL_MS, — The queue refresh policy is implemented in two live hooks. This
    one is `useCurationQueue`. The other is `useListReviewQueue`, which CurationDrawer.tsx calls. Nothing
    makes either read the other. When the node''s thirty-second interval or its visibility behavior changes,
    one copy can move and the other stay, and nobody can tell which one was decided. The docstring itself
    says the two already differ on `refetchIntervalInBackground`.'
  observed_at:
  - src/features/curation/hooks/useCurationQueue.ts
- node: rules/curation-workspace/queue-keeps-the-answered-order
  conforms: true
  how: "src/features/curation/components/QueueList.tsx: held at the virtualItems.map in the render, lines\
    \ 162-193 — const virtualItems = virtualizer.getVirtualItems();\n...\n{virtualItems.map((v) => {\n\
    \  const item = items[v.index];\nThe component indexes `items` positionally and applies no sort, filter\
    \ or reorder.\nsrc/features/curation/hooks/useCurationQueue.ts: held at `return toReviewQueueList(wire);`\
    \ (line 38). The file applies no sort or reorder to the answer. The transform in api/_transforms.ts\
    \ maps `wire.items` in place with `items: wire.items.map(toReviewQueueItem)`. — return toReviewQueueList(wire);"
  encoded_at:
  - src/features/curation/components/QueueList.tsx
  - src/features/curation/hooks/useCurationQueue.ts
- node: rules/curation-workspace/queue-kind-is-sent-only-when-chosen
  conforms: true
  how: 'src/features/curation/hooks/useCurationQueue.ts: held at the kind branch of the queryFn (line
    31) — if (kind !== undefined) qs.set("kind", kind);'
  encoded_at:
  - src/features/curation/hooks/useCurationQueue.ts
- node: rules/curation-workspace/queue-read-asks-the-first-page-of-twenty
  conforms: false
  how: 'src/features/curation/api/curation.hooks.ts, useListReviewQueue, line 113: const limit = params.limit
    ?? 20; — The default page size of twenty is written a second time here, as the literal that derives
    the cache-key page. The node that holds it is a candidate bound to src/features/curation/hooks/useCurationQueue.ts,
    not to this file. If that default changes there, the cache pages derived here silently disagree. `--check`
    does not reach this file when the node moves.'
  observed_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/read-without-an-identifier-is-not-requested
  conforms: true
  how: "src/features/curation/api/node.hooks.ts: held at the `enabled` constant in each of the three hooks,\
    \ lines 79, 102 and 125. The accepted-fragments half of the rule is not in this file. — const enabled\
    \ = typeof nodeId === \"string\" && nodeId.length > 0;\nconst enabled = typeof linkId === \"string\"\
    \ && linkId.length > 0;\nconst enabled = typeof attributeId === \"string\" && attributeId.length >\
    \ 0;\nsrc/features/curation/api/provenance.hooks.ts: held at the `enabled` constants of the three\
    \ provenance hooks, and the `enabled` expression of useListAcceptedFragments — const enabled = typeof\
    \ linkId === \"string\" && linkId.length > 0;\nconst enabled =\n    (typeof params.llmRunId === \"\
    string\" && params.llmRunId.length > 0) ||\n    (typeof params.rawInformationId === \"string\" &&\n\
    \      params.rawInformationId.length > 0);"
  encoded_at:
  - src/features/curation/api/node.hooks.ts
  - src/features/curation/api/provenance.hooks.ts
- node: rules/curation-workspace/reading-the-answer-body-has-no-cutoff
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at httpCuration(), lines 193-226. The cutoff timer
    is cleared right after fetch resolves with the status, and the body is read afterwards. — `clearTimeout(timer);`
    followed by `return (await response.json()) as T;` and `raw = await response.json();`'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/reason-field-always-shows-as-required
  conforms: false
  how: "src/features/curation/components/DecisionPanel/ReasonField.tsx, The `required` prop and its default\
    \ (lines 38-39, 48), the conditional asterisk (line 89), and the placeholder branch (lines 100-104).:\
    \ /** Marks the field as required in the label rendering. */\n  readonly required?: boolean;\n...\n\
    \  required = false,\n...\n  {required ? <span aria-hidden=\"true\"> *</span> : null}\n...\n    required\n\
    \      ? \"Explique brevemente a decisão (obrigatório).\"\n      : \"Explique brevemente a decisão\
    \ (opcional).\" — The node says the reason field is always rendered and always marked as required.\
    \ This file makes the marking optional, defaults it to off, and has an \"(opcional)\" placeholder\
    \ that tells the owner the reason is optional. Any caller that omits `required` shows the owner an\
    \ unmarked field that is announced as optional. The rule is not held where the field is declared,\
    \ so a reader of the node cannot see that the code leaves room to break it."
  observed_at:
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
- node: rules/curation-workspace/reason-is-sent-as-typed-and-empty-as-null
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at every `reason` field
    sent in `dispatch`, lines 130, 138, 152 and 161 — reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/reason-required-refusal-shows-under-the-reason
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the `useEffect` at lines\
    \ 112-117, which hands the server's message to `ReasonField`. The focus part is not visible in this\
    \ file; it would sit in `ReasonField`. — if (serverError.code === \"BUSINESS_REASON_REQUIRED\") {\n\
    \  reasonRef.current?.setServerError(serverError.message);\n}\nsrc/features/curation/components/DecisionPanel/ReasonField.tsx:\
    \ held at setServerError, lines 70-76, and the error paragraph, lines 107-111. The message is set\
    \ under the textarea and focus moves to it when the message is not null. — setServerError(message)\
    \ {\n        setError(message);\n        if (message !== null) {\n          const el = document.getElementById(id)\
    \ as HTMLTextAreaElement | null;\n          el?.focus();\n        }\n      },"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
- node: rules/curation-workspace/refused-destructive-decision-restores-its-item
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit's catch block (lines 391-398)\
    \ — isDestructive &&\n          isEnvelopeError(err) &&\n          !VANISHED_CODES.has(err.code) &&\n\
    \          optimisticId !== null\n        ) {\n          onItemRestore(optimisticId);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/rejecting-five-or-more-asks-first
  conforms: true
  how: "src/features/curation/components/BatchBar/BatchBar.tsx: held at BATCH_REJECT_CONFIRM_THRESHOLD,\
    \ line 59, and handleRejectClick, lines 88-94 — export const BATCH_REJECT_CONFIRM_THRESHOLD = 5;\n\
    if (count >= BATCH_REJECT_CONFIRM_THRESHOLD) {\n  setPendingReject(true);\n  return;\n}\nonReject?.();"
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/resent-curation-request-never-refreshes-again
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at the `__retried` guard at line 196. The resend is
    a fresh httpCuration call, so it creates its own thirty-second timer at lines 159-165. — `if (response.status
    === 401 && __retried !== true) {` and `__retried: true,` in the recursive call.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/reset-restores-the-starting-values
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at reset and makeInitialState — reset: ()\
    \ => {\n  set(makeInitialState());\n},"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/resolved-count-starts-at-zero
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at makeInitialState — sessionResolved: 0,'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/save-is-disabled-without-a-stated-fragment
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the disabled prop
    of the "Salvar correção" Button (lines 197-203) — validFromSource === "stated" &&

    (watch("validFromFragmentId") ?? "").length === 0'
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/select-by-number-picks-the-nth-loaded-item
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at lines 152-155 (the page leaves the\
    \ selection when nothing is picked); the 1-to-9 range and the Nth pick are held in `selectByIndex`\
    \ in src/features/curation/components/curation-page-helpers.ts — onSelectIndex: (n) => {\n  const\
    \ picked = selectByIndex(data, n);\n  if (picked !== null) handleSelect(picked);\n},\nsrc/features/curation/components/curation-page-helpers.ts:\
    \ held at selectByIndex(), lines 116-125 — if (oneBasedIndex < 1 || oneBasedIndex > 9) return null;\n\
    \  const target = list.items[oneBasedIndex - 1];\n  if (target === undefined) return null;"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/selected-item-is-carried-in-the-address
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at lines 67-71 and 109-116 (the `item`
    parameter); the `kind:id` form is held in `parseItemSearchParam` and `stringifyItemSearchParam` in
    src/features/curation/state/curation-store.ts — const search = useSearch({ from: curationRoute.id
    }) as { item?: string };

    search: next !== undefined ? { item: next } : {},

    src/features/curation/state/curation-store.ts: held at stringifyItemSearchParam, line 195, and the
    parse inverse — return `${item.kind}:${item.id}`;'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/selecting-a-candidate-makes-it-the-merge-target
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/CandidateCard.tsx: held at the onClick handler,
    line 43, which hands the candidate id to the parent. The parent makes it the merge target, as `target_node_id:
    selectedCandidate` in DecisionPanel.tsx. — onClick={() => onSelect(candidate.candidateNodeId)}

    src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at line 271 and line 129 —
    onSelectCandidate={setSelectedCandidate} ... target_node_id: selectedCandidate,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/CandidateCard.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/selecting-another-item-clears-the-evidence-mark
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at setSelectedItem, line 136, and makeInitialState
    — return { selectedItem: item, evidenceViewed: false };

    ...

    evidenceViewed: false,'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/selecting-the-same-item-changes-nothing
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at setSelectedItem, lines 130-135 — const\
    \ same =\n  state.selectedItem !== null &&\n  item !== null &&\n  state.selectedItem.kind === item.kind\
    \ &&\n  state.selectedItem.id === item.id;\nif (same) return {};"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/selecting-writes-the-item-to-the-address
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at lines 109-117, `handleSelect` — void\
    \ navigate({\n  to: \"/curation\",\n  search: next !== undefined ? { item: next } : {},\n  replace:\
    \ true,\n});"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/selection-matches-a-dispute-by-any-side
  conforms: true
  how: 'src/features/curation/components/curation-page-helpers.ts: held at findItemInQueue() line 38 and
    indexOfSelected() line 77 — const matches = item.sides.some((s) => s.itemId === target.id);'
  encoded_at:
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/self-merge-refusal-shows-the-fixed-text
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CandidateCard.tsx: held at only the marking of\
    \ the candidate as invalid, here: the `invalid` prop rendered as aria-invalid and the error border,\
    \ lines 42 and 55. The fixed text is not in this file. — aria-invalid={invalid || undefined}\n...\n\
    invalid ? \"border-border-error\" : null,\nsrc/features/curation/components/DecisionPanel/DecisionPanel.tsx:\
    \ held at lines 260-264, plus `invalidCandidateId` and the alert exclusion list — {serverError?.code\
    \ === \"BUSINESS_SELF_MERGE_FORBIDDEN\" && (\n  <Alert variant=\"destructive\" role=\"alert\" className=\"\
    mx-md\">\n    Não é possível fundir um nó com ele mesmo.\n  </Alert>"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CandidateCard.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/sending-a-decision-clears-the-previous-failure
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit, lines 370-371, at the start\
    \ — setServerError(null);\n      setStale(false);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/server-refusal-lands-on-its-field
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at fieldForServerCode,
    the server-error effect (lines 112-118) and formLevelError — setError(field, { type: "server", message:
    serverError.message });

    serverError?.code === "BUSINESS_CORRECTION_NO_CHANGES"'
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/session-state-is-not-persisted
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at the store creation, line 122, a plain create
    with no persistence middleware — export const useCurationStore = create<CurationState>((set) => ({'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at mapKey, lines 123-136 — if (key ===\
    \ \"j\") return \"next\";\nif (key === \"k\") return \"prev\";\nif (key === \"x\") return \"toggleCheck\"\
    ;\nif (key === \"e\") return \"evidence\";\nif (key === \"m\") return \"merge\";\nif (key === \"s\"\
    ) return \"keepSeparate\";\nif (key === \"c\") return \"confirm\";\nif (key === \"r\") return \"reject\"\
    ;\nif (key === \"u\") return \"undo\";\nif (key === \"?\") return \"toggleHelp\";\nif (key.length\
    \ === 1 && key >= \"1\" && key <= \"9\") {\n  return { kind: \"selectIndex\", n: Number(key) };"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/shortcut-letters-act-in-lower-case-only
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at the strict equality comparisons against
    lower-case letters in mapKey, lines 123-131 — const key = event.key;

    if (key === "j") return "next";

    if (key === "k") return "prev";'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/shortcuts-listen-on-the-whole-window
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at the listener target resolution in
    the effect, line 173 — const el: EventTarget = targetRef?.current ?? window;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/side-shows-its-validity-basis-and-confidence
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the metadata span,
    lines 85-89 — Vigência: {fmt(side.validFrom)} – {fmt(side.validTo)} ·{" "}

    Fonte: {SOURCE_LABEL[side.validFromSource]} ·{" "}

    Confiança {(side.confidence * 100).toFixed(0)}%'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
  conforms: true
  how: "src/features/curation/api/node.hooks.ts: held at STABLE_STALE_MS at line 42, and the `staleTime`\
    \ and `refetchOnWindowFocus` options of the three useQuery calls for node detail and lineage history.\
    \ Provenance and accepted fragments are not in this file. — const STABLE_STALE_MS = 5 * 60_000; //\
    \ 5 min\nstaleTime: STABLE_STALE_MS,\nrefetchOnWindowFocus: false,\nsrc/features/curation/api/provenance.hooks.ts:\
    \ held at STABLE_STALE_MS (line 36), used as `staleTime` with `refetchOnWindowFocus: false` in all\
    \ four hooks — const STABLE_STALE_MS = 5 * 60_000; // 5 min\nstaleTime: STABLE_STALE_MS,\n    refetchOnWindowFocus:\
    \ false,"
  encoded_at:
  - src/features/curation/api/node.hooks.ts
  - src/features/curation/api/provenance.hooks.ts
- node: rules/curation-workspace/stale-banner-is-a-non-blocking-alert
  conforms: true
  how: "src/features/curation/components/StaleBanner/StaleBanner.tsx: held at The returned JSX, lines\
    \ 47-63: the `role=\"alert\"` container, the `onReload` prop, and the `Button` handler — <div\n  \
    \    role=\"alert\"\n...\n      <Button type=\"button\" size=\"sm\" variant=\"outline\" onClick={onReload}>\n\
    \        Recarregar\n      </Button>\nThe component has no visibility condition and takes no state\
    \ beyond its props."
  encoded_at:
  - src/features/curation/components/StaleBanner/StaleBanner.tsx
- node: rules/curation-workspace/stale-banner-says-the-item-changed
  conforms: true
  how: "src/features/curation/components/StaleBanner/StaleBanner.tsx: held at `DEFAULT_MESSAGE`, line\
    \ 40, and the optional `message` prop with its default, lines 36 and 44 — const DEFAULT_MESSAGE =\
    \ \"Este item mudou desde que você o abriu.\";\n...\n  message = DEFAULT_MESSAGE,"
  encoded_at:
  - src/features/curation/components/StaleBanner/StaleBanner.tsx
- node: rules/curation-workspace/stale-item-blocks-no-decision
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the `DecisionBar` call,\
    \ lines 290-295, which is passed `evidenceViewed` and no `stale` — <DecisionBar\n  evidenceViewed={evidenceViewed}\n\
    \  submitting={submitting}\n  buttons={buttons}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/stale-item-shows-the-notice-with-a-reload
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at line 220 — {stale &&\
    \ onRefetch && <StaleBanner onReload={onRefetch} className=\"m-md\" />}\nsrc/features/curation/components/DecisionPanel/StaleBanner.tsx:\
    \ held at the StaleBanner component, lines 18-34. The Recarregar Button's onClick is wired to the\
    \ onReload prop, and the notice text is rendered. Whether the banner is shown only for a stale item\
    \ is decided by the caller, not in this file. — <Button type=\"button\" size=\"sm\" variant=\"outline\"\
    \ onClick={onReload}>\n    <RefreshCw aria-hidden=\"true\" className=\"size-4\" />\n    Recarregar\n\
    \  </Button>\nsrc/features/curation/components/StaleBanner/StaleBanner.tsx: held at The rendered `<p>`\
    \ with `{message}` and the `Recarregar` button wired to `onClick={onReload}`, lines 55-61 — <Button\
    \ type=\"button\" size=\"sm\" variant=\"outline\" onClick={onReload}>\n        Recarregar\n      </Button>"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/components/DecisionPanel/StaleBanner.tsx
  - src/features/curation/components/StaleBanner/StaleBanner.tsx
- node: rules/curation-workspace/staleness-is-never-detected-by-the-panel
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.types.ts: held at The optional `stale`
    and `onRefetch` props in `DecisionPanelProps`, lines 56 and 58. The staleness flag is an input, and
    the file declares nothing that detects it. — readonly stale?: boolean;

    readonly onRefetch?: () => void;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
- node: rules/curation-workspace/stated-basis-lists-the-accepted-fragments
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the filter built
    into `fragmentParams`, lines 58 to 69, and the picker block, lines 107 to 138 — if (validFromSource
    === "stated" && hasFilter) {

    const fragmentQ = useListAcceptedFragments(fragmentParams);

    {showPicker && fragmentQ.data && ('
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/stated-basis-needs-a-fragment
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the last branch\
    \ of the object-level `superRefine`, lines 93-102 — if (\n      data.validFromSource === \"stated\"\
    \ &&\n      data.validFromFragmentId === null\n    ) {\n      ctx.addIssue({ code: \"custom\", path:\
    \ [\"validFromFragmentId\"], message: \"Selecione o fragmento que justifica a data.\" });"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/submitting-batch-shows-busy-buttons
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the `loading={submitting}` prop
    on the three action buttons and on the inline Confirmar. The Cancelar button and the clear button
    carry no `loading`. — variant="destructive"

    loading={submitting}

    onClick={handleConfirmReject}'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/successful-action-refreshes-the-queue-and-the-metrics
  conforms: true
  how: 'src/features/curation/api/curation.hooks.ts: held at invalidateCurationAndAffected (line 174),
    called only from the onSuccess handlers of the six mutations. keys.ts line 26 defines curationKeys.all
    as the root prefix that covers the queue and metrics keys. — void queryClient.invalidateQueries({
    queryKey: curationKeys.all });'
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/summary-shows-the-single-candidate-alone
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ComparePane.tsx: held at the first branch of EntityMatchView,\
    \ line 50 — if (mode === \"summary\" && item.candidates.length === 1) {\n  const top = item.candidates[0]!;"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ComparePane.tsx
- node: rules/curation-workspace/tabs-choose-the-queue-kind
  conforms: true
  how: 'src/features/curation/components/QueueTabs.tsx: held at the TABS array and keyToFilter, lines
    40-49. The tab maps to a filter that is undefined for all and the kind entity_match or disputed otherwise.
    The read of the queue from that filter happens in the parent, not here. — { id: undefined, label:
    "Tudo", key: ALL_SENTINEL },

    { id: "entity_match", label: "Entidades", key: "entity_match" },

    { id: "disputed", label: "Disputas", key: "disputed" },

    if (key === ALL_SENTINEL) return undefined;'
  encoded_at:
  - src/features/curation/components/QueueTabs.tsx
- node: rules/curation-workspace/trail-keeps-the-answered-order
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the nested maps
    over the fragments and over their chunks, lines 222 and 234 — {fragments.map((frag) => ( ... {frag.chunks.map((chunk)
    => ('
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/trail-reads-by-link-or-by-attribute
  conforms: true
  how: "src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the two hook calls\
    \ and the selection of the active query, lines 75-79 — const linkQ = useProvenanceByLink(itemKind\
    \ === \"link\" ? itemId : undefined);\nconst attrQ = useProvenanceByAttribute(\n  itemKind === \"\
    attribute\" ? itemId : undefined,\n);\nconst active = itemKind === \"link\" ? linkQ : attrQ;"
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/trail-signals-that-the-evidence-was-viewed-once
  conforms: true
  how: "src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the effect, lines\
    \ 93-136 — el.addEventListener(\"focusin\", onFocus);\nif (typeof IntersectionObserver !== \"undefined\"\
    ) {\n  observer = new IntersectionObserver(... { threshold: IO_THRESHOLD }); observer.observe(el);\
    \ }\nwith const IO_THRESHOLD = 0.25 and fire() guarded by firedRef"
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/typing-clears-the-reason-error
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ReasonField.tsx: held at The Textarea onChange\
    \ handler, lines 94-97. — onChange={(e) => {\n          onChange(e.currentTarget.value);\n       \
    \   if (error) setError(null);\n        }}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
- node: rules/curation-workspace/undo-keeps-the-drawer-open
  conforms: true
  how: "src/features/curation/components/CurationDrawer/CurationDrawer.tsx: held at the onItemRestore\
    \ handler in DrawerPanel, which does nothing and so leaves the drawer open on the same item — onItemRestore:\
    \ () => {\n      // No-op: the drawer state is already correct — the item is the\n      // current\
    \ `item` prop. Sonner has already restored the toast UI.\n    },"
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.tsx
- node: rules/curation-workspace/undo-keeps-the-selection-and-the-count
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at cancelPending (lines 408-415), which\
    \ calls neither setSelectedItem nor incrementResolved — clearTimeout(p.timeoutId);\n    toast.dismiss(p.toastId);\n\
    \    onItemRestore(p.optimisticId);\n    pendingRef.current = null;"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/undo-restores-the-item-and-sends-nothing
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at cancelPending (lines 408-415), which\
    \ restores the item and clears the timer without calling commit; it is wired to the Desfazer click\
    \ — clearTimeout(p.timeoutId);\n    toast.dismiss(p.toastId);\n    onItemRestore(p.optimisticId);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/undo-toast-counts-down-in-whole-seconds
  conforms: true
  how: 'src/features/curation/components/UndoToast/UndoToast.tsx: held at `secondsRemaining` (line 57-59)
    and the render of `{label}` and `{remaining}s` in UndoToast (lines 88-93) — return Math.max(0, Math.ceil((deadlineMs
    - nowMs) / 1000));

    <span>{label}</span>

    {remaining}s'
  encoded_at:
  - src/features/curation/components/UndoToast/UndoToast.tsx
- node: rules/curation-workspace/undo-toast-only-reports-the-undo
  conforms: true
  how: 'src/features/curation/components/UndoToast/UndoToast.tsx: held at the Desfazer Button''s handler,
    line 100 — onClick={onUndo}'
  encoded_at:
  - src/features/curation/components/UndoToast/UndoToast.tsx
- node: rules/curation-workspace/undo-window-is-five-seconds
  conforms: true
  how: "src/features/curation/components/UndoToast/UndoToast.tsx: held at the constant `UNDO_WINDOW_MS`\
    \ (line 54) in this file. The send-only-at-the-end half sits in the commit timer of src/features/curation/hooks/useDecisionDispatch.tsx,\
    \ not in this file. — export const UNDO_WINDOW_MS = 5_000;\nsrc/features/curation/hooks/useDecisionDispatch.tsx:\
    \ held at the commit timer in dispatchDestructive (lines 466-472) is armed with UNDO_WINDOW_MS, so\
    \ the send happens only when the window ends. The five-second value itself is declared in components/UndoToast\
    \ and imported here. — const timeoutId = setTimeout(() => {\n        const snapshot = pendingRef.current;\n\
    \        if (!snapshot) return;\n        toast.dismiss(snapshot.toastId);\n        pendingRef.current\
    \ = null;\n        void commit(snapshot.dispatch, snapshot.optimisticId, true);\n      }, UNDO_WINDOW_MS);"
  encoded_at:
  - src/features/curation/components/UndoToast/UndoToast.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/unknown-item-in-the-address-selects-the-first-item
  conforms: true
  how: "src/features/curation/components/curation-page-helpers.ts: held at deriveInitialSelection(), lines\
    \ 137-152 — if (list === undefined || list.items.length === 0) return null;\n  const found = findItemInQueue(list,\
    \ deepLink);\n  if (found !== null) return deepLink;\n  const first = list.items[0];"
  encoded_at:
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/unlabelled-source-type-shows-as-it-is
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at formatSourceType(),
    lines 52-54 — return SOURCE_TYPE_LABELS[t] ?? t;'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/unmapped-refusal-shows-nothing-on-the-form
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the default branch\
    \ of fieldForServerCode and the guard on formLevelError — default:\n      return null;\nif (field)\
    \ { setError(...) }"
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/unreadable-item-link-selects-nothing
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at parseItemSearchParam, lines 176-181 — if
    (typeof raw !== "string" || raw.length === 0) return null;

    ...

    if (colon < 1 || colon >= raw.length - 1) return null;

    ...

    if (kind !== "entity_match" && kind !== "disputed") return null;'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at the catch branch of trySilentRefresh(), lines 128-133,
    with the redirect seam at lines 69-76. — `useAuthStore.getState().clear(); redirectImpl("/sign-in?reason=session_expired");
    return false;` with `window.location.replace(url);`'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/unwired-shortcut-does-nothing
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at the per-case undefined guards in onKeyDown,\
    \ lines 189-257, where preventDefault sits inside the guard — case \"next\":\n  if (cb.onNext !==\
    \ undefined) {\n    event.preventDefault();\n    cb.onNext();\n  }\n  return;"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/value-side-is-named-by-its-value
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the final branch of
    the label expression, line 53 — : (side.value ?? "—");'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/vanished-item-is-not-restored
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit's catch block, where the restore\
    \ excludes VANISHED_CODES (line 394), and handleError, which is given a null optimisticId for destructive\
    \ decisions so nothing is re-removed (line 386) — handleError(err, isDestructive ? null : optimisticId);\n\
    ...\n          !VANISHED_CODES.has(err.code) &&"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/viewed-signal-fires-once-per-mount
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at firedRef, which
    is never reset, lines 90, 96 and 101-102 — const firedRef = useRef(false);

    if (!dataReady || firedRef.current) return;

    if (firedRef.current) return;

    firedRef.current = true;'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/viewed-signal-may-fire-on-an-empty-trail
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at dataReady and the
    sentinel on the empty-trail region, lines 91, 193-197 — const dataReady = !isPending && !isError &&
    data !== undefined;

    <GlassSurface level="ambient" role="region" ref={sentinelRef} aria-label="Sem proveniência" tabIndex={0}'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/viewed-signal-never-fires-on-a-failed-trail
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the dataReady gate
    on the effect, lines 91 and 96 — const dataReady = !isPending && !isError && data !== undefined;

    if (!dataReady || firedRef.current) return;'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/wired-shortcuts-stop-the-default-except-help
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at the preventDefault calls in each wired\
    \ case and the toggleHelp case without one, lines 189-257 — case \"undo\":\n  if (cb.onUndo !== undefined)\
    \ {\n    event.preventDefault();\n    cb.onUndo();\n  }\n  return;\ncase \"toggleHelp\":\n  if (cb.onToggleHelp\
    \ !== undefined) {\n    cb.onToggleHelp();\n  }"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
unstated:
- file: src/features/curation/components/BatchBar/BatchBar.tsx
  where: the "Limpar seleção" Button, line 151
  evidence: aria-label="Limpar seleção"
  cost: This is text the running system emits, announced to assistive technology as the name of the clear-selection
    control. No node holds this label, and the contract's use-batch-bar answer lists only "N selecionados"
    and the three actions. The label lives only in this file, so a reader looking for it in the specification
    does not find it.
- file: src/features/curation/components/BatchBar/BatchBar.tsx
  where: the GlassSurface wrapper, line 113
  evidence: aria-label="Ações em lote"
  cost: This is the accessible name of the bar's group, emitted to assistive technology. No node holds
    it, so the wording lives only in this file.
- file: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  where: the "Motivo" label (line 163), the reason Textarea placeholder (line 173) and the form's aria-label
    (line 133)
  evidence: '<Label htmlFor="cf-reason">Motivo</Label>

    placeholder="Explique brevemente por que a correção é necessária."

    aria-label="Formulário de correção"'
  cost: These are texts the running system shows or announces to the owner. The nodes in the set and the
    candidate index hold none of the three. Of the candidates I searched, only the "Informe um motivo
    para continuar." message (a refusal under the reason field) mentions the reason field's wording. The
    wording therefore lives only in the code.
- file: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  where: the effect at lines 104-109 (firstFieldRef and useEffect), under the comment "focus first field
    on mount (§8)"
  evidence: "useEffect(() => {\n    firstFieldRef.current?.focus();\n  }, [itemKind]);"
  cost: The form moves focus to its first field whenever it mounts or the item kind changes. No node states
    this. The nearest node, correction-opens-inline-and-returns-focus, covers only opening inline and
    returning focus on cancel. The next reader will look in the specification for where focus lands on
    open and find nothing, so the code becomes the only home of that behavior.
- file: src/features/curation/components/CorrectionForm/DateJustification.tsx
  where: the texts the form shows around the fragment field and the basis group, lines 80, 89, 109, 125,
    142 and 152
  evidence: 'Justificativa da data

    aria-label="Fonte da data de início"

    <Label htmlFor="cf-frag">Fragmento</Label>

    placeholder="Selecione um fragmento…"

    <Label htmlFor="cf-frag-manual">ID do fragmento</Label>

    placeholder="UUID do fragmento accepted"'
  cost: These are what the owner reads on the correction form, and no node states them. Among them is
    the claim that the manual input expects a UUID of a fragment with status accepted. The next reader
    looks for these texts in the specification, does not find them, and treats the code as where they
    were decided.
- file: src/features/curation/components/CorrectionForm/correction-schema.ts
  where: line 48, the `itemKind` field of `correctionSchema`; also the literal unions `"link" | "attribute"`
    in `CorrectionRawDefaults` (line 112) and `buildCorrectItemRequest` (line 146)
  evidence: 'itemKind: z.enum(["link", "attribute"]),'
  cost: The file declares which kinds of item can be corrected, link and attribute, and no node in the
    set or in the specification root holds that vocabulary as an enumeration. domain/knowledge-base/item-kind
    holds node, link and fragment, and its decision log excludes attribute as a kind. The next reader
    who looks in the specification for the kinds a correction accepts finds a different enumeration, and
    the real one lives only in this schema. The correction contract nodes name `item_kind` only as a body
    field and give it no values.
- file: src/features/curation/components/CurationDrawer/CurationDrawer.tsx
  where: line 376, the aria-label of DialogPrimitive.Close in CurationDrawer
  evidence: "<DialogPrimitive.Close\n                aria-label=\"Fechar curadoria\"\n               \
    \ data-testid=\"curation-drawer-close\""
  cost: The close button's accessible name is text the running system tells assistive-technology users.
    It is stated only in this file. The next reader who looks in the specification for what the drawer's
    close control is called will not find it, and a change of the wording will not reach any node.
- file: src/features/curation/components/CurationPage.tsx
  where: line 200, the page heading
  evidence: <h2 className="text-lg font-semibold tracking-tight text-foreground">Curadoria</h2>
  cost: The visible title of the queue column is emitted text. The only "Curadoria" the node holds is
    the title of the overlay (the open-drawer operation); the page heading is held by nothing. The next
    reader of the node cannot learn from it what the page titles itself.
- file: src/features/curation/components/CurationPage.tsx
  where: the region names at lines 185 and 247
  evidence: 'aria-label="Fila de curadoria"

    aria-label="Painel de decisão"'
  cost: These are the accessible names the screen announces for its two regions. They are text the running
    system emits, and no node holds them. The screen contract lists its other labels and messages exactly,
    so a reader looking in the specification for what the screen says will not find these two. A change
    to them would have to be made in code alone.
- file: src/features/curation/components/DecisionPanel/CandidateCard.tsx
  where: 'lines 63-72, the progressbar span: its aria-label and its visible text'
  evidence: 'aria-label="Similaridade com o nó proposto"

    ...

    Similaridade {pct} de 100'
  cost: This is text the screen emits to the owner and to assistive technology. It states the similarity
    as "Similaridade N de 100" and names the compared node "o nó proposto". No node holds either wording;
    the grep for "Similaridade" over the specification root returned nothing. The next reader looks in
    the specification for what the candidate card says and does not find it. The wording therefore lives
    only in this file, and no node's change reaches it.
- file: src/features/curation/components/DecisionPanel/ComparePane.tsx
  where: EntityMatchView, the radiogroup's aria-label (line 71); the same kind of text sits at the DisputeView
    radiogroup (line 141) and the ComparePane section (line 175)
  evidence: 'aria-label="Candidatos para fusão"

    aria-label="Lados em disputa"

    aria-label="Comparação"'
  cost: These are the accessible names announced for the comparison region and for the two selection groups.
    They are text the screen tells a person using assistive technology. No node states them, and a search
    of the specification root for these strings found nothing. The wording lives only in this file, so
    a reader who looks for what the panel announces will not find it in the specification.
- file: src/features/curation/components/DecisionPanel/DecisionBar.tsx
  where: the toolbar element's accessible name, line 71
  evidence: "role=\"toolbar\"\n      aria-label=\"Ações de decisão\""
  cost: This text is read aloud to screen-reader users, so the system tells someone this label. Neither
    the curation-screen contract nor any node under the specification root states it. A grep of the root
    for "Ações de decisão" and "toolbar" returned nothing. Anyone looking for the screen's wording in
    the specification will not find this string, and no node governs a change to it.
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the `aria-label` on the plain `<section>` (line 324) and on the `GlassSurface` (line 335)
  evidence: aria-label="Painel de decisão"
  cost: This is text the panel tells assistive-technology users, and neither the curation-screen contract's
    read-decision-panel answer nor any other node holds it. A grep of the specification for "Painel de
    decisão" finds nothing. The label would live only in this file, so a reader looking in the specification
    for what the panel announces would not find it.
- file: src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
  where: The `itemKindOf` function body, the `entity_match` branch, lines 91-98.
  evidence: "if (item.kind === \"entity_match\") {\n  ...\n  return \"link\";\n}"
  cost: The code maps every entity-match queue item to the item kind "link". No node holds that mapping.
    The comment above it calls the branch unused, so the value reads as a type-totality default. It is
    still a domain value that lives only in this file, and a later reader who relies on it will not find
    it in the specification.
- file: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  where: SOURCE_LABEL (lines 20-26), and the "Vigência:", "Fonte:" and "Confiança" captions in the metadata
    span (lines 85-89)
  evidence: "stated: \"Declarada\",\n  document: \"Doc.\",\n  received: \"Receb.\",\n...\nVigência: {fmt(side.validFrom)}\
    \ – {fmt(side.validTo)} ·{\" \"}\nFonte: {SOURCE_LABEL[side.validFromSource]} ·{\" \"}\nConfiança\
    \ {(side.confidence * 100).toFixed(0)}%"
  cost: The node requires "the label of its valid-from basis" but never states what the labels are. The
    three words "Declarada", "Doc." and "Receb." exist only in this file. The date-justification form
    is the only place the specification gives wording for the same three bases ("Data do documento", "Data
    de recebimento"), and that wording differs from these. The next reader who looks in the specification
    for what a person sees as the basis of a disputed side will not find it, and the two vocabularies
    can drift apart unnoticed. The captions "Vigência:", "Fonte:" and "Confiança" are likewise stated
    in no node.
- file: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  where: the StateBadge rendered inside each side (line 83)
  evidence: <StateBadge state="disputed" size="sm" />
  cost: Every side card carries a disputed state badge. The specification only states a header badge (Para
    revisar / Disputado) and says nothing about a badge on each side. The next reader who looks in the
    specification for what a side shows will not find this element, and what it displays lives only in
    the badge component and this call.
- file: src/features/curation/components/DecisionPanel/EvidenceChip.tsx
  where: lines 26-30, the `aria-label` attribute on the chip's span
  evidence: "aria-label={\n  viewed\n    ? \"Evidência vista.\"\n    : \"Veja a evidência antes de decidir\"\
    \n}"
  cost: The chip emits an accessible name that no node holds. It differs from the visible text, "Evidência
    vista" and "Ver evidência", which the node does hold. The node's hint "Veja a evidência antes de decidir."
    belongs to a blocked decision and ends with a period. Here the same sentence, without the period,
    is the chip's name. Because the chip's accessible name is code-only, the wording a screen-reader user
    hears lives only here. Someone changing the hint in the node would not know this second statement
    exists.
- file: src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
  where: line 50, the aria-label of the ol, built from `description` at line 47
  evidence: "const description = sides.map((s, i) => describeSide(i, s)).join(\"; \");\n  return (\n \
    \   <ol\n      aria-label={description}"
  cost: 'The screen reader announces a description of the whole timeline: every side''s period line joined
    with "; ". No node holds that this list carries an accessible label, or what the label says. The behavior
    lives only in this file. The next reader will look for it in the specification and will not find it
    there, and only a docstring citing the old curadoria.feature.spec.md §8 mentions it.'
- file: src/features/curation/components/DecisionPanel/ReasonField.tsx
  where: The label text (line 88) and the placeholder text (lines 100-104), which are rendered to the
    owner.
  evidence: "<Label htmlFor={id}>\n        Motivo\n...\n      ? \"Explique brevemente a decisão (obrigatório).\"\
    \n      : \"Explique brevemente a decisão (opcional).\""
  cost: 'The label "Motivo" and the placeholder wording are text the owner reads. No node in the set or
    in the full-text projection holds either one: the contract names only "Informe um motivo para continuar.".
    The code is the only place these strings are decided, and a reader looking in the specification will
    not find them.'
- file: src/features/curation/components/MetricsStrip/MetricsStrip.tsx
  where: the strip's root element, line 111, and the placeholder cell, line 124
  evidence: 'aria-label="Métricas de curadoria"

    aria-label="Carregando métrica"'
  cost: The region name and the placeholder name are text the running system gives a screen reader. No
    node holds either string. A change to them would be made in this file only, and the reader would not
    find them in the specification.
- file: src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
  where: the accessible names of the four render branches, lines 158, 177, 197 and 218
  evidence: 'aria-label="Proveniência indisponível"

    aria-label="Erro ao carregar proveniência"

    aria-label="Sem proveniência"

    aria-label="Trilha de evidência"'
  cost: These four labels are what a screen reader announces for the trail's compliance-deleted, failed,
    empty and loaded states. The specification holds only the visible texts and the loading label "Carregando
    evidência". A change to the wording is made here, and the next reader looks for it in the specification
    and does not find it.
- file: src/features/curation/components/QueueList.tsx
  where: the aria-label on the listbox root in the empty branch (line 140) and in the populated branch
    (line 154)
  evidence: aria-label="Fila de curadoria"
  cost: The accessible name a screen reader announces for the review queue is text the system emits to
    the owner, and it lives only in this file. The specification's full-text projection has no match for
    it, so the next reader who looks in the specification for what the queue is called will not find it.
- file: src/features/curation/components/QueueTabs.tsx
  where: the aria-label on TabsList, line 68
  evidence: <TabsList aria-label="Filtrar fila por tipo">
  cost: This is text the running system emits as the accessible name of the tab group. The curation-screen
    contract holds the tab labels Tudo, Entidades and Disputas, but I found no node in the specification
    root that holds "Filtrar fila por tipo". The wording lives only in this file, where a reader of the
    specification will not look for it.
- file: src/features/curation/components/UndoToast/UndoToast.tsx
  where: the Desfazer Button, line 101
  evidence: aria-label="Desfazer ação"
  cost: 'This is text the screen emits: it is the accessible name of the undo control. No node holds it.
    The contract only says the toast "offers Desfazer". The aria-label overrides the visible "Desfazer"
    with a different announced name that exists only in this file. A reader looking in the specification
    for what the control is called does not find it.'
- file: src/features/curation/components/curation-page-parts.tsx
  where: QueueErrorBanner, the Button inside the Alert's `action` prop (lines 69-77)
  evidence: "<Button\n  type=\"button\"\n  variant=\"outline\"\n  size=\"sm\"\n  onClick={onRetry}\n \
    \ data-testid=\"curation-queue-retry\"\n>\n  Tentar novamente\n</Button>"
  cost: The visible label of the retry control is text the system shows the owner, and it is stated only
    here. The show-queue node specifies the banner text and "a retry that reads the queue again" but gives
    the retry no label. A reader who looks in the specification for what the retry says will not find
    it. The label "Tentar novamente" appears in the specification only in an ingestion contract, as the
    retry label for a different screen's failure.
- file: src/features/curation/hooks/useDecisionDispatch.tsx
  where: handleError, the vanished-code branch (lines 323-335), the call to advance() at line 333
  evidence: "if (VANISHED_CODES.has(code)) {\n        if (optimisticId !== null) {\n          onItemRemove(optimisticId);\n\
    \        }\n        toast.warning(vanishedToastMessage(code));\n        setStale(code === \"BUSINESS_REVIEW_NOT_PENDING\"\
    \ ||\n          code === \"BUSINESS_ITEM_NOT_DISPUTED\");\n        advance();\n        return;\n \
    \     }"
  cost: A decision refused with a code meaning the item is gone moves the selection to the next item and
    adds one to the session's resolved count (advance() calls setSelectedItem and incrementResolved).
    For a destructive decision this is a second move on top of the one made when it was dispatched. No
    node says that a refusal moves on or counts as resolved. The curation-screen contract says only "with
    the item removed", and destructive-decision-moves-on-twice names two moves, at dispatch and on server
    acceptance. The resolved count therefore moves by a rule that lives only in this hook, and a reader
    looking in the specification will not find it.
restates:
- file: src/features/curation/api/_request.ts
  where: the constant comment, line 64, and the comment at lines 157-158 inside httpCuration
  evidence: '"/** Non-ingest cutoff. Mirrors `lib/http.ts` DEFAULT_TIMEOUT_MS. */" and "// Always wrap
    in a 30s cutoff (curation calls are sub-second p95 budget;"'
  cost: The thirty-second cutoff is restated in comments. The code that holds it is `const DEFAULT_TIMEOUT_MS
    = 30_000;` and the `setTimeout(..., DEFAULT_TIMEOUT_MS)` abort in this file. The comment "Mirrors
    `lib/http.ts` DEFAULT_TIMEOUT_MS" points a reader at another file as the source of the value, when
    the node is where it is decided.
  node: rules/curation-workspace/curation-request-times-out-after-thirty-seconds
- file: src/features/curation/api/_request.ts
  where: the doc comment on `authHeader`, line 49
  evidence: '"/** Build the `Authorization: Bearer <jwt>` header when a token is present. */"'
  cost: 'The bearer rule is stated in a doc comment above the function that implements it, `return token
    !== null ? { Authorization: `Bearer ${token}` } : {};`. The comment is a second home for the rule
    outside behavior.'
  node: rules/curation-workspace/curation-request-carries-the-access-token
- file: src/features/curation/api/_request.ts
  where: the field comment on `__retried`, lines 59-60, and the module docstring, lines 27-31
  evidence: "\"INTERNAL — set by the 401 retry path so the second attempt cannot\n   *  re-enter the silent-refresh\
    \ branch.\" and \"The `__retried` guard prevents\n *        infinite recursion on a second 401.\""
  cost: The rule that a resent request never refreshes again is stated in prose beside the code that enforces
    it with `if (response.status === 401 && __retried !== true)`. A reader may take the comment, rather
    than the node, as where that rule was decided.
  node: rules/curation-workspace/resent-curation-request-never-refreshes-again
- file: src/features/curation/api/_request.ts
  where: the module docstring, lines 27-31, and the httpCuration docstring, lines 144-146
  evidence: "\"HTTP 401 → attempts DC silent refresh once via `fetchAccessToken()`;\n *    on success,\
    \ retries the original request once with the new JWT.\""
  cost: 'The refresh-once rule is repeated in prose, and the prose adds the wording "DC silent refresh".
    The code that holds the rule is `trySilentRefresh()` (`fetchAccessToken()` then `setToken(newJwt)`)
    and the `__retried: true` resend in this file.'
  node: rules/curation-workspace/first-unauthorized-curation-answer-refreshes-the-token-once
- file: src/features/curation/api/_request.ts
  where: the module docstring, lines 29-30, and the httpCuration docstring, lines 146-148
  evidence: "\"On failure, clears the auth store + redirects to\n *    `/sign-in?reason=session_expired`\
    \ and throws `AUTH_SESSION_EXPIRED`.\""
  cost: The sign-in redirect target is written in prose a second time. The code that holds it is `useAuthStore.getState().clear();
    redirectImpl("/sign-in?reason=session_expired");` in `trySilentRefresh`. If the node's address changes,
    the comment would go on naming the old one.
  node: rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in
- file: src/features/curation/api/_request.ts
  where: the module docstring, lines 4-16 and 22-26, and the httpCuration docstring, lines 139-143
  evidence: "\" *  - On 2xx: parses the bare JSON body and returns it typed as `T`.\n *  - On 4xx/5xx:\
    \ parses the standard error envelope and throws\n *    `EnvelopeError`\" and \" *    the body is not\
    \ JSON (raw 5xx HTML), `SYSTEM_UPSTREAM` is used.\""
  cost: 'The bare-body rule and the SYSTEM_UPSTREAM fallback are written a second time in prose that no
    running system emits. If the contract moves, the docstring stays behind and reads as the decided rule.
    The code that holds both is `return (await response.json()) as T;` and `response.status >= 500 ? "SYSTEM_UPSTREAM"
    : "SYSTEM_UNKNOWN"` in this same file.'
  node: contracts/curation-workspace/bff-curation
- file: src/features/curation/api/_transforms.ts
  where: the header docblock "Design notes", lines 18-22
  evidence: '* - "Date-only" fields (`valid_from` / `valid_to`) are parsed as UTC

    *    midnight: the BFF stores DATE without a time component, so picking

    *    local-midnight would shift the displayed day for users west of UTC.

    *    The SPA renders these via `Intl.DateTimeFormat` with `timeZone: ''UTC''`'
  cost: 'This is prose, and it restates that dates show as calendar dates in UTC. Code holds that fact
    in other files, for example `d.toLocaleDateString("pt-BR", { timeZone: "UTC" })` in src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
    and PeriodTimeline.tsx. Nothing in this file parses at UTC midnight explicitly, because that follows
    from `new Date(value)`. The comment names `Intl.DateTimeFormat`, while the components call `toLocaleDateString`,
    so it is already out of step with the code it describes.'
  node: rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
- file: src/features/curation/api/_transforms.ts
  where: the header docblock, lines 8-10, "Curation REST is bare-body on 2xx (§6) — no unwrap needed on
    curation responses."
  evidence: '* - Curation REST is bare-body on 2xx (§6) — no unwrap needed on curation

    *    responses.'
  cost: This is prose that no running system emits, and it restates the contract fact that a 2xx curation
    body is the answer itself and is never unwrapped. The code that holds the fact is in src/features/curation/api/_request.ts,
    which has `return (await response.json()) as T;` under "// ---- 2xx — bare body". The comment cites
    a section of a document outside the specification as its authority. If the node moves, this comment
    goes on stating the old rule and nothing flags it.
  node: contracts/curation-workspace/bff-curation
- file: src/features/curation/api/curation.hooks.ts
  where: 'header docstring line 17, and the comment above `retry: 1` in useCurationMetrics, lines 152-153'
  evidence: '* `getCurationMetrics`: staleTime 30s, refetchOnWindowFocus true.

    ...

    // Retry once: metrics is advisory, a single transient failure shouldn''t

    // spam retries while the queue is being interacted with.'
  cost: 'The metrics freshness window, the focus refresh and the single retry are restated in prose, along
    with a rationale ("advisory") that no node holds. A reader can take the comment for the decision,
    and a change to the node does not reach it. The code that holds the fact is `staleTime: METRICS_STALE_MS,
    refetchOnWindowFocus: true, retry: 1`.'
  node: rules/curation-workspace/metrics-stay-fresh-for-thirty-seconds
- file: src/features/curation/api/curation.hooks.ts
  where: header docstring, lines 13-17, and the doc comment on useListReviewQueue, lines 99-103
  evidence: '* `listReviewQueue`: staleTime 0 (volatile), refetchInterval 30s,

    *      refetchOnWindowFocus true — spec §4.

    * `getCurationMetrics`: staleTime 30s, refetchOnWindowFocus true.

    ...

    * every 30s (only while tab is visible — TanStack Query honours

    * `document.visibilityState`). staleTime 0 (volátil).'
  cost: 'The queue''s refresh timings are written a second time in prose. If the node moves, `--check`
    never reaches these lines, and a reader can take the docstring for the rule. The code that holds the
    fact is `staleTime: QUEUE_STALE_MS, refetchInterval: QUEUE_POLL_MS, refetchOnWindowFocus: true` in
    the same file.'
  node: rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
- file: src/features/curation/api/curation.hooks.ts
  where: header docstring, lines 18-30, and the comments in invalidateCurationAndAffected, lines 173-182
  evidence: '* Every

    *    mutation on success invalidates:

    *      - `curationKeys.all` (queue + metrics refresh)

    ...

    // Queue + metrics (root prefix).'
  cost: 'The refresh-after-success rule is stated again in prose. That prose also claims node-detail invalidation
    for the "correct" flow, which the code does not perform, so the comment and the code now say different
    things. A reader of the docstring would look for behavior that is not there. The code that holds the
    fact is `void queryClient.invalidateQueries({ queryKey: curationKeys.all })`, called only from `onSuccess`.'
  node: rules/curation-workspace/successful-action-refreshes-the-queue-and-the-metrics
- file: src/features/curation/api/node.hooks.ts
  where: line 42, the trailing comment on STABLE_STALE_MS
  evidence: const STABLE_STALE_MS = 5 * 60_000; // 5 min
  cost: The window is stated twice on one line, as an expression and as prose. If the value changes, the
    comment can stay behind and disagree with the code.
  node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
- file: src/features/curation/api/node.hooks.ts
  where: the docstring of UseCurationNodeDetailParams, lines 49-54
  evidence: '/** When true, only attributes whose `is_in_effect` is true. */

    ...

    /** When false, `uncertain` attributes are omitted. Default true. */'
  cost: The conditions under which each option is sent are repeated in prose beside `buildNodeQs`, where
    code holds them. A reader may treat the comment as the rule, and it can drift from the node.
  node: rules/curation-workspace/node-detail-sends-its-options-only-when-asked
- file: src/features/curation/api/node.hooks.ts
  where: the docstring of useCurationNodeDetail, line 73
  evidence: Disabled when `nodeId` is null/undefined/empty.
  cost: The rule that a read is not requested without an identifier is restated as prose. The code holds
    it in `const enabled = typeof nodeId === "string" && nodeId.length > 0;`, so the comment is a second
    home for it.
  node: rules/curation-workspace/read-without-an-identifier-is-not-requested
- file: src/features/curation/api/node.hooks.ts
  where: the header docstring, lines 4-7 (Spec references, "§4 (staleTime 5min, no refetchOnWindowFocus)")
  evidence: "`§4 (staleTime\n *    5min, no refetchOnWindowFocus).`"
  cost: 'The five-minute freshness rule is also written as prose here, so a reader can take the comment
    for where the rule is decided. The behavior is held by `staleTime: STABLE_STALE_MS` and `refetchOnWindowFocus:
    false` in the three hooks of this same file. When the node moves, the comment keeps saying the old
    window and nothing flags it.'
  node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
- file: src/features/curation/api/provenance.hooks.ts
  where: the docblocks above useProvenanceByLink (line 44) and useListAcceptedFragments (lines 134-138),
    and the `At least one of llmRunId / rawInformationId MUST be set` comment on ListAcceptedFragmentsParams
    (line 116)
  evidence: '"Disabled when `linkId` is undefined/null/empty." and "Disabled until at least one filter
    is supplied" and "At least one of `llmRunId` / `rawInformationId` MUST be set."'
  cost: The rule that a read is not requested without an identifier is also stated in prose beside the
    `enabled` expressions that implement it. A change to the rule would have to be made in the prose and
    in the code, and nothing checks that the two agree.
  node: rules/curation-workspace/read-without-an-identifier-is-not-requested
- file: src/features/curation/api/provenance.hooks.ts
  where: the file's header docblock (lines 1-14, the `staleTime 5min, no refetchOnWindowFocus` clause)
    and the comments `// 5 min` and `Constants — spec §4 TTL` above STABLE_STALE_MS (lines 32-36)
  evidence: "the header says \"§4 (staleTime 5min, no\n *    refetchOnWindowFocus)\", and the constant\
    \ reads \"const STABLE_STALE_MS = 5 * 60_000; // 5 min\""
  cost: The five-minute window and the no-refetch-on-focus behaviour are written in prose as well as in
    code. The prose cites a document under docs/specs, not the node. Someone changing the window will
    find two statements and a pointer to a document that is not the specification.
  node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
- file: src/features/curation/api/provenance.hooks.ts
  where: the header docblock (lines 9-13) and the docblock above useProvenanceByLink (lines 42-45)
  evidence: "\"REST responses are\n *    enveloped (`{ ok: true, result: ProvenanceResponse }`). `lib/http.ts`\n\
    \ *    unwraps the envelope\" and \"Returns the provenance trail (fragment → chunk → raw_information)\
    \ for\n * a `KnowledgeLink`.\""
  cost: The read's envelope and the shape of its answer are described in prose that cites an openapi.yaml
    under docs/specs. The contract node is not cited. The prose can drift from the contract without anything
    noticing.
  node: contracts/curation-workspace/bff-curation-reads
- file: src/features/curation/components/BatchBar/BatchBar.tsx
  where: header docblock, lines 14-15 and the BatchBarProps comment on `count`, line 40
  evidence: 'Hidden when `count < 2` — the consumer can render the component

    unconditionally; the bar self-occults below the threshold.'
  cost: The rule is restated in prose while `if (count < 2) return null;` (line 77) already holds it.
    The comment is a second home outside behavior, and it must be kept in step with the node by hand.
  node: rules/curation-workspace/batch-bar-needs-two-items
- file: src/features/curation/components/BatchBar/BatchBar.tsx
  where: header docblock, lines 16-21
  evidence: "- Per-kind actions (homogeneous selection only):\n    - entity_match → \"Manter separados\
    \ N\" (non-destructive)\n    - uncertain    → \"Confirmar N\" (non-destructive) + \"Rejeitar N\" (destructive)\n\
    \    - disputed     → all batch actions disabled with tooltip"
  cost: The per-kind action map is restated in prose. The code holds it (`const showConfirm = kind ===
    "uncertain";` and the two lines after it), and the prose differs from that code. For disputed items
    it says the actions are "disabled with tooltip", but the code renders no action at all for them.
  node: rules/curation-workspace/batch-bar-actions-follow-the-kind
- file: src/features/curation/components/BatchBar/BatchBar.tsx
  where: header docblock, lines 22-23, and the BATCH_REJECT_CONFIRM_THRESHOLD comment, lines 55-58
  evidence: '* Threshold above which destructive batch actions require a one-step inline

    * confirmation (spec §5: "Você está rejeitando N itens. Confirmar?").'
  cost: The five-item rule is restated in prose, while `if (count >= BATCH_REJECT_CONFIRM_THRESHOLD)`
    with `BATCH_REJECT_CONFIRM_THRESHOLD = 5` already holds it. A second statement of the threshold sits
    outside behavior.
  node: rules/curation-workspace/rejecting-five-or-more-asks-first
- file: src/features/curation/components/BatchBar/BatchBar.tsx
  where: the BatchBarProps comment on `onClear`, line 48
  evidence: /** Fired by the "X" button — caller clears the selection set. */
  cost: The rule that the bar leaves the clearing to its caller is restated in prose. The code already
    holds it with `onClick={onClear}` and no state of its own, so the comment is a second home.
  node: rules/curation-workspace/batch-bar-offers-to-clear-the-selection
- file: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  where: the comment inside the disabled prop of the "Salvar correção" Button, lines 198-200
  evidence: '// Targeted requirement (spec UI-11 / BDD 5): when stated is

    // chosen, "Salvar permanece desabilitado até fragmento ser

    // selecionado". For other sources the schema gates submission.'
  cost: The comment restates the node's fact in prose beside the expression that already implements it.
    If the node moves, the comment is a second home that nothing reads, and the node's bind does not reach
    it.
  node: rules/curation-workspace/save-is-disabled-without-a-stated-fragment
- file: src/features/curation/components/CorrectionForm/CorrectionForm.types.ts
  where: the doc comment on `fragmentFilter` in CorrectionFormProps, lines 46-52
  evidence: '* When both are absent and `valid_from_source=stated`

    * is chosen, the picker degrades to a plain text input (R2 fallback,

    * flow spec 3o). When the picker is shown but returns no results, the

    * same fallback applies.'
  cost: The fallback rule is stated a second time in prose beside a prop that does not implement it. A
    node holds the fact, and DateJustification.tsx holds it in code (it derives the picker's availability
    from `!!fragmentFilter?.llmRunId || !!fragmentFilter?.rawInformationId`). A reader of the types file
    takes this comment as the rule, and it can drift from the node and the code.
  node: rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id
- file: src/features/curation/components/CorrectionForm/CorrectionForm.types.ts
  where: 'the header block comment, lines 17-22 ("Server errors: the parent supplies `serverError`...")'
  evidence: '* Server errors: the parent supplies `serverError` whenever the mutation

    * fails. We map the known codes to inline UI:

    *  - BUSINESS_CORRECTION_NO_CHANGES   -> form-level message

    *  - BUSINESS_TEMPORAL_INCOHERENT     -> validFrom/validTo aria-invalid

    *  - BUSINESS_DATE_UNJUSTIFIED        -> DateJustification radio focus

    *  - BUSINESS_FRAGMENT_NOT_ACCEPTED   -> fragment picker message'
  cost: The code-to-field mapping is written a second time in a types file. A node holds the fact, and
    the switch in CorrectionForm.tsx (`case "BUSINESS_TEMPORAL_INCOHERENT":`, `case "BUSINESS_DATE_UNJUSTIFIED":`,
    `case "BUSINESS_FRAGMENT_NOT_ACCEPTED":`, and the `serverError?.code === "BUSINESS_CORRECTION_NO_CHANGES"`
    test) holds it in code. If the mapping changes there, this prose keeps stating the old one and nothing
    reads it.
  node: rules/curation-workspace/server-refusal-lands-on-its-field
- file: src/features/curation/components/CorrectionForm/DateJustification.tsx
  where: the file's docstring, lines 5 to 8
  evidence: "* Owns the R2 accepted-fragment picker and its degradation (flow spec 3o):\n * when `valid_from_source=stated`\
    \ and a filter is available, it lists\n * accepted fragments; otherwise (no filter, or empty/errored\
    \ list) it falls\n * back to a plain text input for the fragment id."
  cost: The docstring states a second time the rule that the picker falls back to a manual fragment-id
    input. Code holds that rule in this same file, in `showPicker` and `showManualFragment`. If the rule
    moves in the node, the docstring still says the old condition, and no check reaches it.
  node: rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id
- file: src/features/curation/components/CorrectionForm/correction-schema.ts
  where: comment at line 81 above the start-before-end check
  evidence: // Temporal coherence (§5).
  cost: The comment cites a section of a document as the authority for the start-before-end rule. A reader
    may take that document as the home of the rule and not the node.
  node: rules/curation-workspace/correction-start-precedes-the-end
- file: src/features/curation/components/CorrectionForm/correction-schema.ts
  where: comment at line 92 above the stated-basis check
  evidence: // valid_from_source=stated requires the fragment id (BR-15).
  cost: The comment cites BR-15, a rule identifier from an outside document, as the owner of the fragment
    requirement. It points the reader away from the node that holds it.
  node: rules/curation-workspace/stated-basis-needs-a-fragment
- file: src/features/curation/components/CorrectionForm/correction-schema.ts
  where: comment at lines 24-25 above `optionalString`
  evidence: "/** Empty string is treated as \"not provided\" — RHF defaults always render\n *  a controlled\
    \ string but the request DTO accepts null. */"
  cost: The empty-means-null rule is stated in prose beside the code that implements it, so it has two
    homes.
  node: rules/curation-workspace/empty-correction-field-is-sent-as-null
- file: src/features/curation/components/CorrectionForm/correction-schema.ts
  where: docstring at lines 11-17, listing the pt-BR messages
  evidence: "* Single-owner pt-BR messages match §5 exactly:\n *  - \"Informe o valor corrigido.\" (atributo)\n\
    \ *  - \"Selecione o nó-alvo da fusão.\" (link target — uuid validation)\n *  - \"Data inválida. Use\
    \ o formato AAAA-MM-DD.\"\n *  - \"O início deve ser anterior ao fim.\"\n *  - \"Selecione o fragmento\
    \ que justifica a data.\"\n *  - \"Informe um motivo para continuar.\""
  cost: The same texts are held a second time in prose. If the node changes a message, this docstring
    keeps the old one, and nothing reads it. The code that emits these messages is in this same file,
    so only the prose needs removing.
  node: contracts/curation-workspace/curation-screen
- file: src/features/curation/components/CorrectionForm/correction-schema.ts
  where: docstring at lines 138-144 above `buildCorrectItemRequest`
  evidence: "* Map validated form values to the `CorrectItemRequest` wire body — the\n * single source\
    \ of the snake_case shape submitted by CorrectionForm\n * (openapi.yaml CorrectItemRequest / CorrectedValues).\
    \ `itemKind` selects\n * `value` (attribute) vs `target_node_id` (link); the remaining fields are\n\
    \ * passed through as the validated (possibly-null) values."
  cost: The docstring claims to be the single source of the request body shape, and it cites openapi.yaml
    as its authority. That is a second claim of authority over what the node holds, in prose no system
    reads.
  node: rules/curation-workspace/correction-sends-the-item-the-values-and-the-reason
- file: src/features/curation/components/CurationDecision.tsx
  where: the docstring of provenanceContextOf, lines 29-34, and the comment before armedImmediately, lines
    66-67
  evidence: '* Derive the `(itemKind, itemId)` for the ProvenanceTrail. `entity_match`

    * items carry no link/attribute id of their own (provenance lives on the

    * candidate nodes), so they get no trail — the ComparePane summary IS the

    * evidence and the panel arms immediately.

    // entity_match has no provenance hook → evidence is the ComparePane summary,

    // so arm immediately. Otherwise ProvenanceTrail.onEvidenceViewed flips it.'
  cost: The rule that an entity-match entry's evidence counts as viewed as soon as it opens is stated
    in prose. Code holds it in `const armedImmediately = provenance === null;` and `const effectiveEvidenceViewed
    = armedImmediately || evidenceViewed;`. The comments also give a reason, that provenance lives on
    the candidate nodes. The specification does not state that reason, so it reads as a decision made
    here.
  node: rules/curation-workspace/entity-match-evidence-counts-as-viewed-at-once
- file: src/features/curation/components/CurationDecision.tsx
  where: the file docstring, lines 11-14 ("Auto-advance"), and the comment inside getNextItem, lines 56-57
  evidence: '* Auto-advance: on a successful destructive commit the dispatch hook calls

    *    `getNextItem()` and advances the page selection (the drawer hosts a single

    *    item and has no "next"). We advance via the queue ring (`neighbour`).

    // Advance through the queue ring on a successful commit. We read the

    // live selection from the store so the lookup is never stale.'
  cost: The rule that the next item is the ring neighbour of the current selection, taken from the queue
    as last loaded, is stated a second time in prose. Code holds it in `neighbour(queue, useCurationStore.getState().selectedItem,
    "next")`. When the node moves, nothing reads these comments, so a reader may take them for the rule.
  node: rules/curation-workspace/decision-moves-to-the-ring-neighbour
- file: src/features/curation/components/CurationDecision.tsx
  where: the file docstring, lines 15-18 ("onItemRemove/onItemRestore are no-ops"), and the comment at
    lines 60-61
  evidence: '* `onItemRemove`/`onItemRestore` are no-ops: the page does not keep its own

    *    item list (the queue is server-cached and the mutation''s

    *    `invalidateQueries` refetches it); selection movement is handled by

    // The page has no local item list — the queue refetch (mutation

    // invalidateQueries) removes the row; selection moves via `advance`.'
  cost: 'The rule that the page never removes or restores a decided item, because the list changes only
    when the queue is read again, is restated in prose. Code holds it in `onItemRemove: () => {}` and
    `onItemRestore: () => {}`. The comments also describe the refetch mechanism, so a later change to
    that mechanism leaves them stating a fact nobody maintains.'
  node: rules/curation-workspace/page-does-not-remove-a-decided-item-itself
- file: src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
  where: the JSDoc on `onOpenChange`, lines 23-27, with the header JSDoc line 7 ("focus trap, `Esc` closes")
  evidence: "Called when the user dismisses the drawer (Esc, X button, click on the\n   backdrop, decision-success).\
    \ The parent moves focus back to the element\n   that triggered the drawer (per Sub-flow C step 7)."
  cost: The four closing triggers (Esc, close button, backdrop click, decision removing the item) are
    written as prose beside the type, so a second home for the rule sits where the next reader looks first.
    Code holds the rule in CurationDrawer.tsx, where `<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>`
    is wired and `close()` calls `onOpenChange(false)`. The prose can drift from that code without anything
    noticing. The node binds this file, so the prose owes only its removal.
  node: rules/curation-workspace/drawer-closes-on-esc-close-backdrop-or-removal
- file: src/features/curation/components/CurationPage.tsx
  where: the comment at lines 107-108 above `handleSelect`
  evidence: '// Selection callback — mirrors the choice into the URL (replace, no back-

    // stack pollution) so a reload / share-link reproduces the same view.'
  cost: 'The comment restates the rule that selecting writes the item to /curation replacing the history
    entry. The code holds it in the same file at `void navigate({ to: "/curation", ..., replace: true
    })`. The prose adds a rationale (reload and share-link) that no node states, so it is a second home
    for the fact outside behavior.'
  node: rules/curation-workspace/selecting-writes-the-item-to-the-address
- file: src/features/curation/components/CurationPage.tsx
  where: the comment at lines 128-129 above `metricsFallback`
  evidence: '// R1 fallback for MetricsStrip — best-effort per-kind counts from the

    // loaded page (≤20 items). Only consulted when metrics errors out.'
  cost: The comment restates the metrics fallback rule and states a page size of 20. The code holds the
    counting at lines 130-138. The page size of 20 is held in src/features/curation/hooks/useCurationQueue.ts
    (`const QUEUE_LIMIT = 20;`). The number in the comment can drift from that constant without anything
    noticing.
  node: rules/curation-workspace/page-counts-loaded-entries-as-the-metrics-fallback
- file: src/features/curation/components/CurationPage.tsx
  where: the header docblock, line 28 (Responsibilities owned HERE)
  evidence: '*  - Deep-link `?item=<kind>:<id>` resolution + auto-select-first.'
  cost: 'The docblock states the address format of the selected item a second time, outside any running
    behavior. The code holds that fact in `parseItemSearchParam` and `stringifyItemSearchParam` in src/features/curation/state/curation-store.ts,
    and the page itself uses the `item` key at `search: next !== undefined ? { item: next } : {}`. If
    the node moves, this prose is not reached and keeps saying the old format.'
  node: rules/curation-workspace/selected-item-is-carried-in-the-address
- file: src/features/curation/components/CurationPage.tsx
  where: the header docblock, line 29, and the comment at line 98
  evidence: '*  - Polling pill: when `data.total` grows above `lastSeenTotal`.'
  cost: The docblock restates the new-item count rule as prose. The code holds the rule at lines 99-105
    (`Math.max(0, total - lastSeenTotal)` and `updateLastSeen(total)` only while `lastSeenTotal === null`).
    The prose omits the clamp at zero and the baseline moving only on the pill click, so it would mislead
    a reader who trusts it over the code.
  node: rules/curation-workspace/new-item-count-is-the-total-minus-the-baseline
- file: src/features/curation/components/DecisionPanel/CandidateCard.tsx
  where: the comment on the `invalid` prop, lines 17-18
  evidence: "When the parent surfaces BUSINESS_INVALID_TARGET_NODE / SELF_MERGE\n   *  inline, the card\
    \ highlights with the error border."
  cost: Prose restates the self-merge refusal rule, which says to mark the selected candidate invalid.
    The code holds that marking in two places. DecisionPanel.tsx derives `invalidCandidateId` from `selectedCandidate`,
    and this file's `aria-invalid` and `border-border-error` classes render it. The comment adds a second
    home for the rule.
  node: rules/curation-workspace/self-merge-refusal-shows-the-fixed-text
- file: src/features/curation/components/DecisionPanel/CandidateCard.tsx
  where: the file docstring, lines 4-5
  evidence: Selecting a candidate sets the merge target_node_id.
  cost: 'Prose states the rule a node already holds. The code that holds it is in another file. DecisionPanel.tsx
    keeps `selectedCandidate` in state and sends it as `target_node_id: selectedCandidate`. This file
    only calls `onSelect(candidate.candidateNodeId)`. The docstring is a second home for the rule, and
    it can drift from the node unnoticed.'
  node: rules/curation-workspace/selecting-a-candidate-makes-it-the-merge-target
- file: src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  where: the comment inside close(), line 64
  evidence: // Restore focus to the "Corrigir…" button per §8.
  cost: The comment restates the node's focus-return rule, which the `requestAnimationFrame(() => { correctButtonRef.current?.focus();
    })` call below it already holds in this file. The comment is a second home for the rule outside behavior.
  node: rules/curation-workspace/correction-opens-inline-and-returns-focus
- file: src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  where: the doc comment above correctionServerError, lines 34-35
  evidence: "/** CorrectionForm only cares about these codes; everything else is handled\n *  by the DecisionPanel-level\
    \ banner. */"
  cost: The comment restates which refusals reach the correction form, which is the node's fact. The same
    function body already holds that fact as code (four `serverError.code ===` comparisons). A reader
    gets two statements of the code set, and only the code is bound to the node.
  node: rules/curation-workspace/correction-refusals-reach-the-form
- file: src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  where: the file's opening docstring, lines 6-9
  evidence: "The parent resets this section on item change by\n * giving it a `key` tied to the item id\
    \ (remount → fresh state), mirroring\n * the previous in-panel `setCorrectionOpen(false)` reset."
  cost: The docstring states the node's restart-on-item-change rule a second time, where nothing reads
    it. The behavior is held by code in both places. Here, `const [open, setOpen] = useState(false);`
    is the fresh state. In DecisionPanel.tsx, `key={correctionItemId}` on `<CorrectionSection` forces
    the remount. If the node moves, this prose is a second statement that `--check` never reaches.
  node: rules/curation-workspace/changing-the-item-restarts-the-correction
- file: src/features/curation/components/DecisionPanel/DecisionBar.tsx
  where: the file header comment, lines 1-17 (and the comment inside gated(), lines 57-59)
  evidence: "* Click handlers fire even when `evidenceViewed=false`? NO — aria-disabled\n * + a guard\
    \ in the click handler skips the dispatch. This matches BDD\n * Scenario 2 (\"nenhuma ação é disparada\"\
    )."
  cost: The evidence-gate rule (a blocked click sends nothing) is also written as prose in this file.
    When the node moves, a reader may take the comment for the decided rule. The comment is not bound
    to the node, so nothing signals that it has gone stale. The code already holds the rule in gated(),
    which returns before calling handler() when evidenceViewed is false, so only the prose is owed removal.
  node: rules/curation-workspace/every-decision-waits-for-the-evidence
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the JSX comment at lines 257-259, above the BUSINESS_SELF_MERGE_FORBIDDEN alert
  evidence: "{/* SELF_MERGE_FORBIDDEN inline (spec §6) — within the panel, not in\n    the toast — so\
    \ the user picks another candidate without losing\n    context. */}"
  cost: 'The comment restates that the self-merge refusal shows inside the panel, and gives a rationale.
    The code holds the rule: the `<Alert variant="destructive" role="alert">` with the fixed text, and
    `invalidCandidateId` for BUSINESS_SELF_MERGE_FORBIDDEN. The rationale and the "toast" mention appear
    in no node.'
  node: rules/curation-workspace/self-merge-refusal-shows-the-fixed-text
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the comment at line 135, inside the `keep_separate` branch of `dispatch`
  evidence: // Non-destructive — reason optional.
  cost: 'The comment restates that a keep decision has no reason check. The code holds it: the branch
    calls `onResolveEntityMatch` with no `validateOnSubmit()` and no selection check. The comment also
    calls the reason "optional", while the reason field is rendered as required, so the prose is a slightly
    different statement of the rule.'
  node: rules/curation-workspace/keep-decisions-check-only-the-gate
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the comment at line 205, on `canCorrect`
  evidence: const canCorrect = item.kind === "disputed"; // entity_match has no item id.
  cost: The comment gives a reason for the rule that the node does not state. The rule itself is held
    by the `item.kind === "disputed"` test and by `{canCorrect && <CorrectionSection .../>}`. A reader
    would take the comment's reason as the business rationale.
  node: rules/curation-workspace/correction-is-offered-only-for-a-dispute
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the comment at lines 68-72, above `subjectId`
  evidence: '// Header subject: for disputes, resolve the SUBJECT node name (the link''s

    // source, or the attribute''s node) so the title reads e.g. "Salvar

    // imagens… · part_of" instead of just the bare relation. entity_match

    // items already carry their canonical name.'
  cost: The comment states which node a dispute header names. The code holds this at lines 73-79, where
    `subjectId` is `item.scope.sourceNodeId` or `item.scope.nodeId` and is read with `useCurationNodeDetail(subjectId)`.
    A second statement of the rule in prose will drift from the node.
  node: rules/curation-workspace/dispute-header-names-its-subject-node
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the comment at lines 97-98, above the `useEffect` that resets the draft
  evidence: '// Reset selections / reason whenever the item changes. (The correction

    // sub-form resets independently via its `key` below.)'
  cost: 'The comment restates both draft-clearing rules. The code holds them: the `useEffect` at lines
    99-103 calls `setSelectedCandidate(null)`, `setSelectedSide(null)` and `setReason("")`. The correction
    restart is held by `key={correctionItemId}` on `CorrectionSection`.'
  node: rules/curation-workspace/changing-the-item-clears-the-draft
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the file docstring, "Server-error projection (§6)", lines 24-29
  evidence: '* Server-error projection (§6):

    *   - BUSINESS_TEMPORAL_INCOHERENT  -> forwarded to CorrectionForm.

    *   - BUSINESS_CORRECTION_NO_CHANGES -> forwarded to CorrectionForm.

    *   - Other codes              -> generic inline error banner.'
  cost: The prose routes the refusal codes a second time. The code that holds the routing is the exclusion
    list at lines 245-251 and `serverError={serverError}` passed to `CorrectionSection`. The prose omits
    BUSINESS_INVALID_TARGET_NODE, BUSINESS_DATE_UNJUSTIFIED and BUSINESS_FRAGMENT_NOT_ACCEPTED, so it
    already differs from the node. On the day the node moves, a reader would find two routing tables in
    this file.
  node: rules/curation-workspace/correction-refusals-reach-the-form
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the file docstring, line 14 ("ReasonField (always rendered for destructive actions)"), and the
    comment at lines 201-202 above `const reasonRequired = true;`
  evidence: "*   - ReasonField (always rendered for destructive actions)\n...\n  // Require reason if\
    \ any destructive button is going to fire.\n  const reasonRequired = true;"
  cost: Both comments describe the reason field as conditional on a destructive action. The code renders
    `<ReasonField ... required={reasonRequired} />` unconditionally, with `reasonRequired` fixed at `true`.
    A reader trusting the prose would look for a condition that does not exist. The rule is held by that
    code, so the comments are a second, slightly different statement of it.
  node: rules/curation-workspace/reason-field-always-shows-as-required
- file: src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
  where: Header docstring line 8 and the JSDoc on the `evidenceViewed` prop, lines 53-54.
  evidence: '* - `evidenceViewed`   — gates the DecisionBar (caller-managed).

    /** Set true after the curator scrolled/focused the ProvenanceTrail. */

    readonly evidenceViewed: boolean;'
  cost: 'The prose says in a second place that the caller owns the viewed-evidence flag. A reader who
    finds that comment may take it as the place the rule lives. The required `evidenceViewed: boolean`
    prop in this file already carries it, and the comment adds nothing the prop does not.'
  node: rules/curation-workspace/evidence-viewed-is-supplied-by-the-caller
- file: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  where: the comment above the useCurationNodeDetail call, lines 41-43
  evidence: "// LINK dispute sides carry a target node (no `value`); resolve its canonical\n  // name\
    \ so the side reads \"Apollo (Project)\" instead of \"—\" (R3). ATTRIBUTE\n  // sides carry `value`\
    \ and pass null here, so the query stays disabled."
  cost: The comment states again how a side with no value is named, including the example "Apollo (Project)"
    and the reference "(R3)". The code holds the same rule just below (`isLink`, `targetName`, `targetType`),
    so the comment is a second home that can drift from the node.
  node: rules/curation-workspace/link-side-is-named-by-its-target
- file: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  where: the comment inside fmt(), lines 29-31
  evidence: "// Format in UTC: valid_from/valid_to are DATE-ONLY values parsed to UTC\n  // midnight.\
    \ Formatting in local time (BR = UTC-3) would shift them back a\n  // day (2026-06-17 → 16/06). UTC\
    \ keeps the stored calendar date."
  cost: 'The comment states again the rule that dates show as pt-BR calendar dates in UTC. The code already
    holds it in this same function (`timeZone: "UTC"`), so the comment is a second home for the rule and
    would go stale on its own.'
  node: rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
- file: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  where: the file's header docstring, lines 1-6
  evidence: "Spec: curadoria.feature.spec.md §10 (feature-local), §11 (full-diff mode\n * lists all sides).\
    \ Selection sets the `winner_id` for `prefer_one`."
  cost: The docstring is a second home outside behavior for the rule that every side is listed and that
    selecting a side makes it the winner. It also cites a feature spec outside the specification root
    as authority, so a reader may take it for the decision rather than the node.
  node: rules/curation-workspace/every-side-is-listed-and-selectable
- file: src/features/curation/components/DecisionPanel/EvidenceChip.tsx
  where: lines 1-12, the file's leading docstring
  evidence: "* EvidenceChip — small \"Ver evidência / visto\" indicator (TC-05).\n *  - curadoria.feature.spec.md\
    \ §2 UI-02 (pulse while evidence pending),\n *    UI-03 (check icon when viewed), §8 (aria-live polite).\n\
    \ * Pulse via Tailwind `animate-pulse` — Framer Motion is not needed for"
  cost: The docstring restates the pulse-until-viewed rule and cites a feature spec outside the specification
    root as its authority. A reader who trusts it has a second place to look for the rule. If the node
    moves, the prose stays behind and disagrees. The behavior itself is correct, because the ternary on
    `viewed` applies `motion-safe:animate-pulse` and the two labels. What is owed is the prose's removal.
  node: rules/curation-workspace/evidence-indicator-pulses-until-viewed
- file: src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
  where: line 31, the trailing comment in describeSide
  evidence: const label = String.fromCharCode(65 + i); // A, B, C…
  cost: The trailing comment restates that the sides are lettered A, B, C in listing order. This is a
    second home for the rule outside behavior, while the code on the same line already holds it.
  node: rules/curation-workspace/periods-are-listed-in-words-under-the-sides
- file: src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
  where: lines 22-25, the comment above fmtDate
  evidence: '// Full calendar date in UTC — year-only granularity collapsed same-year

    // disputes into identical text ("de 2026 em diante" on both sides), hiding

    // the distinct start dates AND the overlap that IS the conflict. UTC keeps

    // the stored date-only value from shifting a day in BR local time.'
  cost: The comment is a second home outside behavior for the rule that side and period dates show as
    full pt-BR calendar dates in UTC. The same file holds the fact in code, in fmtDate. If the node moves,
    the comment keeps saying the old fact and nothing flags it.
  node: rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
- file: src/features/curation/components/DecisionPanel/ReasonField.tsx
  where: The JSDoc on setServerError (line 25) and the docstring's "§6 BUSINESS_REASON_REQUIRED (highlight
    + focus move)" (lines 5-6).
  evidence: "/** Surface a server error inline (BUSINESS_REASON_REQUIRED). */\n  setServerError(message:\
    \ string | null): void;"
  cost: The prose restates that a BUSINESS_REASON_REQUIRED refusal shows under the reason field. The code
    holds this in setServerError, which sets the error and focuses the textarea, so the prose is a second
    home for the node's fact. Because it is prose, it is not removed when the node moves.
  node: rules/curation-workspace/reason-required-refusal-shows-under-the-reason
- file: src/features/curation/components/DecisionPanel/ReasonField.tsx
  where: The file's header docstring (lines 1-14), the JSDoc on validateOnSubmit (lines 22-23) and the
    inline comment at line 62.
  evidence: "* Spec references:\n *  - curadoria.feature.spec.md §5 (\"Informe um motivo para continuar.\"\
    ),\n *    §6 BUSINESS_REASON_REQUIRED (highlight + focus move),\n...\n  /** Returns true when the\
    \ value is non-empty (trimmed). When false, sets\n   *  the inline error AND moves focus to the textarea\
    \ (spec §6). */\n...\n    // Move focus to the textarea — §6 BUSINESS_REASON_REQUIRED."
  cost: The trimmed-empty check and the move of focus are stated in prose as well as in code, and the
    prose cites a spec file and section numbers outside the node tree. A reader can take the comment as
    the rule's home and look there, and the next change to the node leaves the comment standing. The code
    that holds the fact is validateOnSubmit, lines 58-66. The prose adds a second place that says it.
  node: rules/curation-workspace/blank-reason-blocks-a-destructive-decision
- file: src/features/curation/components/DecisionPanel/StaleBanner.tsx
  where: the file's docstring, lines 1-7
  evidence: '* Spec: curadoria.feature.spec.md §2 UI-10 — "StaleBanner aparece sobre o

    * DecisionPanel (não bloqueia, mas avisa): ícone refresh-cw, ''Este item

    * mudou desde que você o abriu. [Recarregar]'' (bg-warning)." §8: role=alert.'
  cost: The docstring restates the stale notice text and the Recarregar action as though a document outside
    the specification governed them. The JSX below already holds both. When the node moves, the docstring
    still carries the old wording and cites a feature spec that the framework's check never reaches, so
    a reader can take it for the decided text.
  node: contracts/curation-workspace/curation-screen
- file: src/features/curation/components/MetricsStrip/MetricsStrip.tsx
  where: header docblock, lines 16-18 (the "Loading" paragraph)
  evidence: "Loading: skeleton row (5 cells of pulse-bg) until either:\n *   - the metrics query resolves\
    \ OR\n *   - the metrics query errors AND a fallback total is provided (R1)."
  cost: The placeholder rule is restated as prose. The code that holds it is `const skeleton = !settled
    || cells.length === 0` together with `aria-busy={skeleton || undefined}`, in this file.
  node: rules/curation-workspace/metrics-strip-shows-placeholders-until-settled
- file: src/features/curation/components/MetricsStrip/MetricsStrip.tsx
  where: header docblock, lines 20-26 (the "R1 degradation" paragraph)
  evidence: "R1 degradation: when `metrics === null && isMetricsError === true`, the\n * strip renders\
    \ fallback counts derived from the queue total + the\n * homogeneous-kind split. Only `entity_match_queue_count`\
    \ and\n * `disputed_queue_count` can be derived this way; the calibration rates\n * (`accept_rate`,\
    \ etc.) are blanked with `—`"
  cost: The fallback rule is written a second time as prose. The code that holds it is the `hasError &&
    fallback` branch of buildCells, in this file. If the node moves, this comment keeps stating the old
    rule.
  node: rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals
- file: src/features/curation/components/MetricsStrip/MetricsStrip.tsx
  where: header docblock, lines 27-29 (the "Spec constraint" paragraph)
  evidence: "Spec constraint: the strip MUST NOT cause the page to error. We accept\n * `isMetricsError`\
    \ as a boolean prop"
  cost: The never-fail rule is restated as prose. The code that holds it is that buildCells returns `[]`
    when there is no fallback, so the strip stays in its placeholders and never throws. If the node moves,
    the comment stays behind.
  node: rules/curation-workspace/failed-metrics-never-fail-the-strip
- file: src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
  where: the comments at lines 82-83 and 94-95
  evidence: "// Detect the compliance-tombstone case explicitly — keeps the\n  // decision-bar gate closed\
    \ (caller never sees onEvidenceViewed).\n// Only observe when there IS evidence to view (compliance\
    \ tombstone\n  // case must keep the gate closed — see spec §6 row)."
  cost: The rule that the viewed signal does not fire on a loading, failed or compliance-deleted trail
    is repeated in comments beside the code. The comments also name a "decision-bar gate" and a "spec
    §6 row" that no node of this set holds, so they point a reader to a second home. The code that holds
    the fact is `dataReady = !isPending && !isError && data !== undefined`, which gates the effect.
  node: rules/curation-workspace/viewed-signal-never-fires-on-a-failed-trail
- file: src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
  where: the header docstring, lines 12-19 ("Evidence-viewed tracking")
  evidence: "The trail fires `onEvidenceViewed()` exactly once per mount, the FIRST\n *   time either\
    \ of these happens:\n *     1. The root sentinel enters the viewport (IntersectionObserver,\n *  \
    \      threshold 0.25 — enough surface visible to count as \"viewing\").\n *     2. The root receives\
    \ keyboard focus (Tab navigation lands on it)."
  cost: The once-per-mount, quarter-visible and focus facts are stated in prose as well as in the node.
    When the node moves, the docstring keeps saying the old rule and nothing reads it. The code that holds
    the fact is IO_THRESHOLD, firedRef and the focusin listener in this file.
  node: rules/curation-workspace/trail-signals-that-the-evidence-was-viewed-once
- file: src/features/curation/components/QueueItem.tsx
  where: the comment above the useMemo call in QueueItem (lines 96-99)
  evidence: "// `formatRelative` is pure but the `now` it closes over would otherwise\n  // re-compute\
    \ on every render. Memoise against `createdAt` so the label\n  // is stable while the row is on screen"
  cost: This prose restates the rule that an item's age does not advance while the item is open. The code
    holds it in `useMemo(() => formatRelative(item.createdAt), [item.createdAt])`, so the comment is a
    second home for the rule. If the memoisation is later removed, the comment would keep claiming a rule
    the code no longer keeps.
  node: rules/curation-workspace/item-age-is-measured-from-a-fixed-reference
- file: src/features/curation/components/QueueItem.tsx
  where: the comment inside handleKey (lines 106-109), plus the docstring lines 14-17 and the `onSelect`
    prop doc (line 33)
  evidence: "// Enter and Space are the standard listbox-option activators. The\n    // browser already\
    \ fires `click` on these for <button>, but we keep\n    // an explicit handler so future migrations\
    \ to `<div role=\"option\">`\n    // do not lose the affordance."
  cost: The rule that the owner selects by click, Enter or Space is restated in prose while the code holds
    it in `onClick={() => onSelect(itemKey)}` and in `if (event.key === "Enter" || event.key === " ")`.
    The comment is a second home for the rule and adds a rationale (future migration to a div) that no
    node holds.
  node: rules/curation-workspace/owner-selects-by-click-enter-or-space
- file: src/features/curation/components/QueueItem.tsx
  where: the file header docstring (lines 1-19) and the docstring above formatRelative (lines 37-41)
  evidence: "relative \"Há Ns\" timestamp\n...\nPretty-print a Date into a coarse pt-BR \"Há …\" relative\
    \ label. Buckets\n * are intentionally coarse: the queue is volatile (refetches every 30s)"
  cost: The age wording is stated in prose as "Há Ns", while the code emits "agora", "há N min", "há N
    h", "há N d" and a pt-BR date. A reader who trusts the docstring learns a second, different age vocabulary
    outside the specification. No running system emits this prose, so removing it is the whole remedy.
  node: rules/curation-workspace/item-age-reads-in-minutes-hours-and-days
- file: src/features/curation/components/QueueList.tsx
  where: the doc comment above buildItemKey (lines 51-56) and the inline comment in its disputed branch
    (lines 61-64)
  evidence: "entity_match\n * uses `node_id`; disputed uses a synthesized\n * `<itemKind>:<scopeFingerprint>`\
    \ so two disputes on different scopes\n * never collide.\nand\n// Disputed: prefer item-id of the\
    \ first side (stable per dispute),\n// falling back to a deterministic scope-based id when sides is\
    \ empty"
  cost: The prose states the identification rule a second time, outside behavior. The `buildItemKey` code
    holds it, so the pair conforms. The comment is a second home that can drift from the node, and its
    wording ("scopeFingerprint") already differs from the node's "assertion kind, source node and link
    type or attribute key".
  node: rules/curation-workspace/queue-entries-are-identified-by-node-or-first-side
- file: src/features/curation/components/QueueTabs.tsx
  where: the file docstring, lines 1-12, and the comment at lines 17-18
  evidence: 'Three buttons: Tudo · Entidades · Disputas.

    so future changes do not introduce a fourth tab without a CR.'
  cost: The set of three tabs is stated a second time in prose, next to the TABS table that holds it.
    If the node's values move, this comment still names the old set. Nothing reads it, so nothing flags
    it.
  node: domain/curation-workspace/queue-tab
- file: src/features/curation/components/StaleBanner/StaleBanner.tsx
  where: Header docstring lines 4-8, and the `message` prop doc, lines 34-35
  evidence: "'Este item\n *    mudou desde que você o abriu. [Recarregar]' (bg-warning).\").\n...\n *\
    \  (e.g. queue moved while user was idle). Defaults to the spec UI-10 text. */"
  cost: The default notice wording and the replaceable-message rule are restated in comments while the
    code also holds them. A later change to the node's wording could then be chased in the comment rather
    than in `DEFAULT_MESSAGE` and the `message` prop. The comment cites a feature spec (`curadoria.feature.spec.md`
    UI-10) as the authority for the text, not the node.
  node: rules/curation-workspace/stale-banner-says-the-item-changed
- file: src/features/curation/components/StaleBanner/StaleBanner.tsx
  where: Header docstring, lines 21-23, and the `onReload` prop doc, lines 31-32
  evidence: "The component is intentionally trivial (icon + text + Recarregar button).\n * The \"should\
    \ I show this?\" decision lives one layer up, in the page or\n * useDecisionDispatch (which observes\
    \ 409 responses)."
  cost: The rule that the banner leaves the decision to appear and the reload to its caller is also written
    as prose in this file, so a reader can take the comment for where it is decided. The code holds it
    by having no visibility logic and by forwarding `onReload` untouched. The comment also names callers
    (`page`, `useDecisionDispatch`) that no node or code in this file establishes, so it can go stale
    without anything signalling it.
  node: rules/curation-workspace/stale-banner-is-a-non-blocking-alert
- file: src/features/curation/components/UndoToast/UndoToast.tsx
  where: JSDoc on `deadlineMs` in UndoToastProps, lines 43-44
  evidence: "/** Absolute deadline (ms since epoch) at which the destructive action\n *  commits. The\
    \ toast renders `ceil((deadline - now()) / 1000)`. */"
  cost: The rounding rule (whole seconds, rounded up from the deadline) is restated in a comment, alongside
    the code that holds it. The next reader has two places to compare.
  node: rules/curation-workspace/undo-toast-counts-down-in-whole-seconds
- file: src/features/curation/components/UndoToast/UndoToast.tsx
  where: header doc comment, lines 29-32
  evidence: '* `onUndo` is the only side-effect this component triggers — it does NOT

    * call `toast.dismiss()` itself.'
  cost: The rule that the undo action only reports to its caller is stated again in a comment. The code
    that holds it is `onClick={onUndo}`, a few lines below. The comment is a second home that will not
    follow a change to the node.
  node: rules/curation-workspace/undo-toast-only-reports-the-undo
- file: src/features/curation/components/UndoToast/UndoToast.tsx
  where: header doc comment, lines 9-10 (and line 6, "Item removido · Desfazer (5s)")
  evidence: '* - curadoria.flow.md FL-CURATION-05 — "no BFF request during the 5-second

    *    window".'
  cost: The five-second window and the rule that nothing is sent during it are written here a second time,
    in prose that no running system emits. The next reader may take this comment for the home of the rule.
    The comment will not follow the node if the window or the send rule changes.
  node: rules/curation-workspace/undo-window-is-five-seconds
- file: src/features/curation/components/curation-page-helpers.ts
  where: the docstring of deriveInitialSelection, lines 127-136, and the file header, lines 9-14
  evidence: "*   1. If `deepLink` matches an item in the queue → that item.\n *   2. Else if queue has\
    \ items → the first one.\n *   3. Else → null (UI-07 EmptyQueue)."
  cost: The fallback to the first loaded item, or to nothing when the queue is empty, is stated in prose
    beside the branches that implement it (lines 141-151). The prose cites a UI-07 label the node does
    not carry, so the next reader may not know which of the two homes to trust.
  node: rules/curation-workspace/unknown-item-in-the-address-selects-the-first-item
- file: src/features/curation/components/curation-page-helpers.ts
  where: the docstring of findItemInQueue, lines 20-28
  evidence: "* - disputed: matches when any `sides[].itemId` equals `target.id`.\n *   (A dispute item\
    \ carries multiple sides; the deep-link addresses\n *   a single side, so any-side match counts.)"
  cost: The any-side matching rule is written a second time in prose beside the code that implements it
    (line 38, `item.sides.some((s) => s.itemId === target.id)`). The next reader may take the comment,
    not the node, as the place the rule lives.
  node: rules/curation-workspace/selection-matches-a-dispute-by-any-side
- file: src/features/curation/components/curation-page-helpers.ts
  where: the docstring of neighbour and the comment inside it, lines 83-88 and 97
  evidence: "* Wraps around the queue boundaries so j on the last item lands back\n * on the first — matches\
    \ the spec's \"list is a ring\" feel (BDD §9\n * Scenario 8 implies wrap-around with `j` on the last\
    \ item).\n...\n  // When nothing is selected, j → first, k → last."
  cost: The ring behavior is stated in prose as well as in code (lines 98-105, the `(cur + 1) % len` and
    `(cur - 1 + len) % len` branches). The comment also cites a scenario section as the authority, which
    gives the reader a second place to look for a rule the node holds.
  node: rules/curation-workspace/next-and-previous-move-through-the-queue-as-a-ring
- file: src/features/curation/components/curation-page-helpers.ts
  where: the docstring of selectByIndex, lines 111-115
  evidence: "* 1-indexed item lookup (matches the spec's `1..9` shortcut: \"1 =\n * primeiro item\").\
    \ Returns null if the index is out of range or the\n * queue does not have that many items."
  cost: The 1 to 9 range and the "beyond the loaded items" outcome are restated in prose, while line 121
    (`if (oneBasedIndex < 1 || oneBasedIndex > 9) return null;`) and line 123 already hold them in code.
  node: rules/curation-workspace/select-by-number-picks-the-nth-loaded-item
- file: src/features/curation/components/curation-page-parts.tsx
  where: the docstring above PollingPill (lines 16-25)
  evidence: 'Polling pill — "N novos" when the queue grows. `role="status"` so AT

    announces the count. Clicking the pill acknowledges the delta

    (`updateLastSeen`) so it disappears.'
  cost: The docstring restates the fact that the pill reads "N novos" when entries arrive, which curation-screen
    show-queue holds. It also restates that the click acknowledges the delta, which the new-item-count
    rule holds as the baseline moving only on a click. The code in this file already holds the pill's
    text. The acknowledge behavior is carried by the onAck prop, which the caller supplies. If either
    fact changes, the prose becomes a second statement that nothing reads.
  node: contracts/curation-workspace/curation-screen
- file: src/features/curation/hooks/useCurationKeyboard.ts
  where: doc on CurationKeyboardCallbacks, lines 42-44
  evidence: "Every\n *  field is optional — missing callbacks are silently ignored (the\n *  shortcut\
    \ becomes a no-op for the page that doesn't support it)."
  cost: The rule that an unwired shortcut does nothing is restated in prose. The code holds it in each
    case's `if (cb.onNext !== undefined) { event.preventDefault(); ... }` guard, so the default is left
    alone when no callback is wired. The comment is a second home for the rule.
  node: rules/curation-workspace/unwired-shortcut-does-nothing
- file: src/features/curation/hooks/useCurationKeyboard.ts
  where: header docstring lines 10-15, the `target` option doc lines 66-73, and the hook docstring lines
    144-148
  evidence: 'a single listener attached to `window` (capture: false) keeps the

    routing in one place.

    ...

    listener is attached to that element (capture phase) instead of

    `window`.'
  cost: 'The listen-on-window-unless-a-target-is-given rule is restated in prose, and the prose is not
    accurate. The doc says "capture phase" for the target, but the code calls `el.addEventListener("keydown",
    onKeyDown)` with no capture option. A reader trusting the comment would be wrong about how the listener
    attaches. The code holds the rule in `const el: EventTarget = targetRef?.current ?? window;`.'
  node: rules/curation-workspace/shortcuts-listen-on-the-whole-window
- file: src/features/curation/hooks/useCurationKeyboard.ts
  where: header docstring lines 16-22, the isEditableTarget doc lines 80-85, and the comments inside it
    at lines 92-94
  evidence: 'The hook DISABLES itself when the active element is an editable

    surface (`<input>`, `<textarea>`, `<select>`, or `[contenteditable]`).'
  cost: The set of fields where keys are not shortcuts is written again in prose, and that version omits
    the role combobox, listbox and textbox cases the node includes. A reader of the comment would learn
    a narrower rule than the one the code applies. The code holds the rule in isEditableTarget (`if (tag
    === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;` and the `role === "combobox"
    || role === "listbox" || role === "textbox"` branch).
  node: rules/curation-workspace/keys-typed-into-a-field-are-no-shortcut
- file: src/features/curation/hooks/useCurationKeyboard.ts
  where: header docstring lines 23-25 and the comment at line 120 inside mapKey
  evidence: 'We also skip when a modifier is held (`Ctrl`, `Meta`, `Alt`) — those

    belong to browser/OS shortcuts (Ctrl+R reload, Cmd+S save, etc.).'
  cost: The modifier exclusion is restated in prose. The code already holds it in `if (event.ctrlKey ||
    event.altKey || event.metaKey) return null;`, so the comment is a second home that `--check` does
    not follow when the node moves.
  node: rules/curation-workspace/modified-keys-are-no-shortcut
- file: src/features/curation/hooks/useCurationKeyboard.ts
  where: header docstring, lines 4-7 (spec reference listing the keys), and the doc on onSelectIndex,
    lines 52-53
  evidence: "curadoria.feature.spec.md §8 \"Atalhos de teclado (j/k, x, e, m/s,\n1..9, c/r/u, ?)\n...\n\
    /** 1-9 selects the Nth visible queue item (1-indexed). `n` is in\n   `[1, 9]`."
  cost: 'The key-to-action table is written a second time in prose that no running system emits. If the
    node moves, `--check` does not reach this comment, and a reader can take the comment for the authority.
    The code already holds the mapping in mapKey (`if (key === "j") return "next";` ... `return { kind:
    "selectIndex", n: Number(key) };`).'
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- file: src/features/curation/hooks/useCurationKeyboard.ts
  where: the `enabled` option doc, lines 62-65
  evidence: "Master switch. When `false`, the listener is detached entirely (used\n   *  to disable shortcuts\
    \ when the drawer is open and consuming its own\n   *  key handling, for example). Defaults to `true`."
  cost: The enabled-by-default rule is restated in prose. The code already holds it in `const { enabled
    = true, target } = options;` and `if (!enabled) return undefined;`. The comment is a second home outside
    behavior.
  node: rules/curation-workspace/keyboard-shortcuts-act-only-while-enabled
- file: src/features/curation/hooks/useCurationKeyboard.ts
  where: the comment inside onKeyDown, lines 181-186
  evidence: 'shortcuts that would change the page state

    // call `preventDefault()` so a stray `c` does not also reach a

    // sibling listener ... We don''t

    // prevent default for `?` because some browsers may render a

    // search panel'
  cost: 'The rule that wired shortcuts stop the default except help is restated in prose, with a rationale
    of its own. The code already holds it: each wired case calls `event.preventDefault();` and the `toggleHelp`
    case does not. The comment is a second home that does not move with the node.'
  node: rules/curation-workspace/wired-shortcuts-stop-the-default-except-help
- file: src/features/curation/hooks/useCurationQueue.ts
  where: 'the file''s header docstring, lines 1-15, against `refetchIntervalInBackground: false` at line
    42'
  evidence: '* Local copy of `useListReviewQueue` that pins

    * `refetchIntervalInBackground: false` (TC-04 constraint #4).

    ...

    * The TC-04 contract requires the

    * stricter "only while tab visible" behaviour'
  cost: 'The docstring restates the node''s "read again every thirty seconds while the tab is visible"
    in prose that no running system emits. It cites a "TC-04 constraint #4" and a `spec_divergences` entry
    as the authority. A reader who trusts the docstring looks for the fact in those places and not in
    the node. Once the node moves, the docstring stays behind with no check reaching it.'
  node: rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
- file: src/features/curation/hooks/useDecisionDispatch.tsx
  where: header docstring contract 3 (lines 33-40) and the comments in handleError (lines 321-322, 337-339,
    345-348)
  evidence: "3. **§6 mapping is exhaustive.** Every error code in the spec table is\n     handled. Codes\
    \ we project into the DecisionPanel (REASON_REQUIRED,\n     SELF_MERGE_FORBIDDEN, TEMPORAL_INCOHERENT,\
    \ CORRECTION_NO_CHANGES,\n     INVALID_TARGET_NODE, DATE_UNJUSTIFIED, FRAGMENT_NOT_ACCEPTED) are\n\
    \     surfaced via the `serverError` field"
  cost: The prose lists field codes and failure handling a second time. The header's list is also shorter
    than the code's INLINE_FIELD_CODES, which adds BUSINESS_TARGET_NODE_REQUIRED, BUSINESS_DISPUTE_WINNER_REQUIRED
    and BUSINESS_DISPUTE_PERIODS_REQUIRED. The two homes already disagree, and a reader of the comment
    gets the wrong code set.
  node: rules/curation-workspace/failed-decision-is-read-in-order
- file: src/features/curation/hooks/useDecisionDispatch.tsx
  where: header docstring, contract 1 (lines 21-25), and the comment above the commit timer, "ZERO BFF
    requests in the 5-second window" (line 465)
  evidence: "1. **ZERO BFF traffic during the 5-second window.** The hook stores a\n     pending `PendingDestructive`\
    \ in memory (NOT in Zustand — pending\n     lifecycle does not survive re-mounts"
  cost: 'Prose states the five-second window and that the pending decision lives only in memory, and the
    facts also sit in the specification. The code holds them: `setTimeout(..., UNDO_WINDOW_MS)` here,
    the `UNDO_WINDOW_MS` value in components/UndoToast, and `pendingRef = useRef`. If the window changes,
    this comment keeps saying five seconds, and no tool reaches it.'
  node: rules/curation-workspace/undo-window-is-five-seconds
- file: src/features/curation/hooks/useDecisionDispatch.tsx
  where: the unmount cleanup comment (lines 500-502) and header docstring contract 4 (lines 42-47)
  evidence: "// Spec: pending destructive action is committed immediately on\n        // unmount; brief\
    \ \"Ação comprometida ao sair.\" toast fires before\n        // unmount."
  cost: Comments restate the leave-sends-at-once rule that the cleanup code (toast.info, then commit)
    already holds in this file. A reader may take the comment as the home of the rule, and it will drift
    if the rule changes.
  node: rules/curation-workspace/leaving-sends-the-pending-decision-at-once
- file: src/features/curation/lib/display-mode.ts
  where: the file's header docstring, lines 4-6 ("The decision MUST be derived from queue-item shape only;
    no LLM call, no async, no network")
  evidence: "The decision MUST be derived from\n * queue-item shape only; no LLM call, no async, no network."
  cost: 'The rule that the display mode comes from the queue entry alone is written a second time in prose.
    The code already holds it: the function''s only input is `item: ReviewQueueItem`. A later reader can
    take the comment as the place the rule is decided, and the comment will not follow the node if the
    node changes.'
  node: rules/curation-workspace/display-mode-is-decided-from-the-entry-alone
- file: src/features/curation/lib/display-mode.ts
  where: the header docstring's disputed mapping, lines 14-18, and the inline comment inside the `item.sides.length
    === 2` branch, lines 43-46
  evidence: "* exactly 2 sides AND any side has a closed window\n *      (`validTo !== null`) — i.e. no\
    \ temporal overlap -> \"summary\"\n// Any side that already closes its window means the two cannot\
    \ overlap\n    // any longer — the dispute is between \"old value\" and \"new value\", not"
  cost: The two-sides and ended-validity rule is restated in prose, together with a reading of why ("no
    temporal overlap") that no node states. The code already holds the rule in `item.sides.length ===
    2` and `item.sides.some((s) => s.validTo !== null)`. If the node changes, the comments keep claiming
    the old rule.
  node: rules/curation-workspace/dispute-shows-summary-for-two-sides-with-an-end
- file: src/features/curation/lib/display-mode.ts
  where: the header docstring's entity_match mapping, lines 11-13, and the comment above HIGH_SIMILARITY_THRESHOLD,
    lines 27-28
  evidence: "* exactly 1 candidate AND top similarity ≥ 0.9     -> \"summary\"\n *    * else (multiple\
    \ candidates or low similarity)     -> \"full-diff\"\n/** Similarity threshold above which a single\
    \ entity_match candidate is\n *  deemed \"obvious\" and the panel can collapse into summary mode (§11).\
    \ */"
  cost: The one-candidate and 0.9 rule is stated again in comments, and the 0.9 is stated twice. The code
    holds it in `HIGH_SIMILARITY_THRESHOLD = 0.9` and in `item.candidates.length === 1` with `top.similarity
    >= HIGH_SIMILARITY_THRESHOLD`. If the node's threshold moves, the comments go on saying 0.9 and a
    reader cannot tell which figure was decided.
  node: rules/curation-workspace/entity-match-shows-summary-for-one-high-similarity-candidate
- file: src/features/curation/state/curation-store.ts
  where: lines 126-128, the comment inside setSelectedItem
  evidence: '// Re-selecting the same item is a no-op (avoids spurious resets of

    // evidenceViewed). Comparing by kind+id, not by reference — the URL

    // search routine creates a fresh object every render.'
  cost: The prose restates a rule the node already holds, and the code holds it too (the `same` branch
    returning `{}`). Two readers will treat the comment as a second statement of the rule, and when the
    node moves the comment will not.
  node: rules/curation-workspace/selecting-the-same-item-changes-nothing
- file: src/features/curation/state/curation-store.ts
  where: lines 167-174, the docstring on parseItemSearchParam
  evidence: "Parse a `?item=<kind>:<id>` URL search param into a `SelectedItem`.\n * Returns `null` if\
    \ the string is malformed or the kind is unknown"
  cost: The docstring restates the unreadable-link rule, and the code holds it in this file (`typeof raw
    !== "string" || raw.length === 0`, `colon < 1 || colon >= raw.length - 1`, the kind check). The prose
    can drift from the code, and nothing reads it.
  node: rules/curation-workspace/unreadable-item-link-selects-nothing
- file: src/features/curation/state/curation-store.ts
  where: lines 37-43 and 185-190, the docstrings on SelectedItemKind and stringifyItemSearchParam
  evidence: "the URL deep-link encodes it as\n * `?item=<kind>:<id>`.\n...\nReturns `undefined` when `item\
    \ === null` so\n * callers can spread the result into a `to` search object without\n * polluting the\
    \ URL with empty values."
  cost: 'The prose states the address form and the no-item-parameter outcome. The code holds both in this
    file: `return `${item.kind}:${item.id}`` and `if (item === null) return undefined;`. The docstring
    is a second home for both facts. Neither rule is the only place the parameter name appears in code.
    The name `item` is not in this file''s code at all, only in these comments.'
  node: rules/curation-workspace/selected-item-is-carried-in-the-address
- file: src/features/curation/state/curation-store.ts
  where: lines 55-57 and 74-77, the docstrings on evidenceViewed and setSelectedItem
  evidence: "Reset to `false` whenever `selectedItem`\n   *  changes (every item starts with evidenceViewed=false).\
    \ */\n...\nResets\n   *  `evidenceViewed` to false because every new item must re-prove its\n   *\
    \  evidence. `null` returns to UI-01."
  cost: 'The docstrings restate the not-viewed mark rule, and the `return { selectedItem: item, evidenceViewed:
    false }` branch and `evidenceViewed: false` in makeInitialState hold it as code. The prose is a second
    home for the rule.'
  node: rules/curation-workspace/selecting-another-item-clears-the-evidence-mark
- file: src/features/curation/state/curation-store.ts
  where: lines 60-63 and 83-84, the docstrings on sessionResolved and incrementResolved
  evidence: "Number of items decided in the current page session. Persists across\n   *  refetches but\
    \ resets when the page unmounts."
  cost: 'The prose restates the start value and the counting rule. The code holds both: `sessionResolved:
    0` in makeInitialState and `sessionResolved: state.sessionResolved + 1`.'
  node: rules/curation-workspace/resolved-count-starts-at-zero
- file: src/features/curation/state/curation-store.ts
  where: lines 65-68, the docstring on lastSeenTotal
  evidence: "`null`\n *  before the first resolve so the pill never flashes on mount."
  cost: 'The docstring restates the empty-until-first-answer rule. The code holds it as `lastSeenTotal:
    null` and the `state.lastSeenTotal === total` guard in updateLastSeen.'
  node: rules/curation-workspace/last-seen-total-starts-empty-and-follows-changes
- file: src/features/curation/state/curation-store.ts
  where: lines 70-72 and 93-96, the docstrings on selectedItems and setSelectedItems
  evidence: "Replace the batch-selection set. The caller computes the new set\n   *  (toggle / clear /\
    \ select-all); the store just stores it."
  cost: 'The prose restates the replace-whole rule, and the code holds it as `set({ selectedItems: items
    })`. The start-empty half is held by `new Set<string>()` in makeInitialState.'
  node: rules/curation-workspace/checked-set-starts-empty-and-is-replaced-whole
- file: src/features/curation/state/curation-store.ts
  where: lines 8-9, the file header docstring on sessionResolved
  evidence: "resets\n *     when the page unmounts (not persisted)"
  cost: 'The prose restates the not-persisted rule, and the code holds it: the store is a plain `create<CurationState>(...)`
    with no persistence middleware. The comment is a second home for the rule.'
  node: rules/curation-workspace/session-state-is-not-persisted
- file: src/features/curation/state/curation-store.ts
  where: lines 98-102, the docstring on reset
  evidence: "Reset every field to the initial state. Called on route unmount so\n   *  the next visit\
    \ starts clean"
  cost: The docstring restates the reset rule. The code holds it as `set(makeInitialState())`. Whoever
    edits the starting values reads the comment as a second statement of the rule.
  node: rules/curation-workspace/reset-restores-the-starting-values
- file: src/features/curation/types.ts
  where: the header docstring, lines 1-20, the passage on bare-body answers and envelope unwrapping
  evidence: "KG/QR envelopes are unwrapped (the curation REST domain is bare-body on\n * 2xx — see curadoria.feature.spec.md\
    \ §6)."
  cost: The docstring is a second statement, outside any behavior, of how the screen reads the curation
    answers (the bare 2xx body, the unwrapping of the other answers). It cites a document under docs/specs
    as its authority and not a node. Code holds the fact too, so this prose is a second home that can
    drift from it.
  node: contracts/curation-workspace/bff-curation
unbound:
- src/features/curation/api/keys.ts
- src/features/curation/components/BatchBar/index.ts
- src/features/curation/components/CorrectionForm/index.ts
- src/features/curation/components/CurationDrawer/index.ts
- src/features/curation/components/DecisionPanel/index.ts
- src/features/curation/components/MetricsStrip/index.ts
- src/features/curation/components/ProvenanceTrail/ProvenanceTrail.types.ts
- src/features/curation/components/ProvenanceTrail/index.ts
- src/features/curation/components/StaleBanner/index.ts
- src/features/curation/components/UndoToast/index.ts
- src/features/curation/components/curation-page-parts.tsx
adopted: true
unheld:
- node: domain/knowledge-base/item-kind
  how: 'read on 2 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 44 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-fe-curation.returns/.

  Staged as an adoption of source no delivery wrote: 232 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  A finding in src/features/curation/types.ts names domain/knowledge-base/assertion-kind, which no file
  of this set is bound to: line 27, the ItemKind type: export type ItemKind = "link" | "attribute"; —
  The type is named ItemKind, the name of the node that holds "node | link | fragment" (what a search
  item stands for). It declares the values of a different node, assertion-kind ("link | attribute"). A
  reader who follows the name to the specification finds a different vocabulary. When assertion-kind moves,
  `--check` does not reach this file, because the trace binds this file to item-kind and not to assertion-kind..
  It blocks nothing here; it is owed a route of its own.

  Candidates: 22 opened across 15 of 44 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 26 fact(s) the source states that no node holds, over 22 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.

  Restates: 106 place(s) where text in the source restates a node''s fact the code holds, over 38 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-fe-curation.returns/`, which are the evidence behind every entry above.
