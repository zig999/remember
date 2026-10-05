---
contract_version: siegard-reconcile/8
title: Prose comments removed from the curation frontend files
summary: Every comment that was not a tool directive was removed from these files, answering the restates
  findings the adoption left against them; the facts stay in their nodes and no behaviour changed.
target: frontend
files:
- path: src/features/curation/api/_request.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/api/_transforms.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/api/curation.hooks.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/api/node.hooks.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/api/provenance.hooks.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/BatchBar/BatchBar.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/CorrectionForm/CorrectionForm.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/CorrectionForm/DateJustification.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/CorrectionForm/correction-schema.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/CurationDecision.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/CurationPage.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/CandidateCard.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/DecisionBar.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/EvidenceChip.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/ReasonField.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/DecisionPanel/StaleBanner.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/MetricsStrip/MetricsStrip.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/QueueItem.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/QueueList.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/QueueTabs.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/StaleBanner/StaleBanner.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/UndoToast/UndoToast.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/curation-page-helpers.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/components/curation-page-parts.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/hooks/useCurationKeyboard.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/hooks/useCurationQueue.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/hooks/useDecisionDispatch.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/lib/display-mode.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/state/curation-store.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/curation/types.ts
  change: Prose comments removed; behaviour unchanged.
nodes:
- node: contracts/curation-workspace/bff-curation
  conforms: true
  how: "src/features/curation/api/_request.ts: held at httpCuration(), lines 85-199, for the send-curation-request\
    \ operation. The other operations of the contract (queue, metrics, resolve and so on) are outside\
    \ this file. — A 2xx answer returns the body unwrapped, and a 204 gives no value:\n  if (response.status\
    \ === 204) return undefined as unknown as T;\n  return (await response.json()) as T;\nThe failures\
    \ carry the codes and messages the contract names:\n  code: isTimeout ? \"SYSTEM_TIMEOUT\" : isAbort\
    \ ? \"SYSTEM_ABORTED\" : \"SYSTEM_NETWORK\"\n  \"Tempo limite excedido na requisição.\" / \"Requisição\
    \ cancelada.\" / \"Falha de rede ao contactar o servidor.\"\n  code: \"SYSTEM_INVALID_RESPONSE\",\
    \ message: \"Resposta do servidor não é JSON válido.\"\n  code: \"AUTH_SESSION_EXPIRED\", httpStatus:\
    \ 401, message: \"Sua sessão expirou. Faça login novamente.\"\nA non-2xx answer takes the error object's\
    \ string code, its details and its message when that is a string. Otherwise it falls back by status:\n\
    \  typeof errObj?.code === \"string\" ? errObj.code : response.status >= 500 ? \"SYSTEM_UPSTREAM\"\
    \ : \"SYSTEM_UNKNOWN\"\n  \"Algo deu errado. Tente novamente.\" / \"Erro desconhecido do servidor.\"\
    \nA second 401 skips the refresh branch (`response.status === 401 && __retried !== true`) and goes\
    \ to that same fallback, which gives SYSTEM_UNKNOWN when the body has no code.\nsrc/features/curation/api/_transforms.ts:\
    \ held at toReviewQueueList, toReviewQueueItem, toEntityMatchQueueItem, toEntityMatchCandidate, toDisputeQueueItem,\
    \ toDisputedItemSide and toCurationMetrics (lines 68-151) — if (wire.kind === \"entity_match\") {\n\
    \  return toEntityMatchQueueItem(wire);\n}\nreturn toDisputeQueueItem(wire);\n...\nscope: {\n  sourceNodeId:\
    \ wire.scope.source_node_id,\n  targetNodeId: wire.scope.target_node_id,\n  linkType: wire.scope.link_type,\n\
    \  nodeId: wire.scope.node_id,\n  attributeKey: wire.scope.attribute_key,\n},\nsrc/features/curation/api/curation.hooks.ts:\
    \ held at buildQueueQs() and useListReviewQueue() for list-review-queue and read-curation-metrics,\
    \ and the mutationFn of each of the six mutation hooks for resolve-entity-match, merge-nodes, resolve-dispute,\
    \ confirm-item, reject-item and correct-item. — if (params.kind !== undefined) search.set(\"kind\"\
    , params.kind);\nif (params.limit !== undefined) search.set(\"limit\", String(params.limit));\nif\
    \ (params.offset !== undefined) search.set(\"offset\", String(params.offset));\n`/api/v1/curation/queue${buildQueueQs(params)}`\n\
    \"/api/v1/curation/metrics\"\n`/api/v1/curation/entity-matches/${encodeURIComponent(node_id)}/resolve`\n\
    \"/api/v1/curation/nodes/merge\"\n\"/api/v1/curation/disputes/resolve\"\n\"/api/v1/curation/items/confirm\"\
    \n\"/api/v1/curation/items/reject\"\n\"/api/v1/curation/items/correct\"\nmethod: \"POST\", body: JSON.stringify(body)\n\
    src/features/curation/components/CorrectionForm/correction-schema.ts: held at buildCorrectItemRequest,\
    \ lines 111-130, which builds the correct-item body. — item_kind: itemKind,\n    item_id: itemId,\n\
    \    corrected: {\n      ...(itemKind === \"attribute\"\n        ? { value: values.value }\n     \
    \   : { target_node_id: values.targetNodeId }),\n      valid_from: values.validFrom,\n      valid_to:\
    \ values.validTo,\n      valid_from_source: values.validFromSource,\n      valid_from_fragment_id:\
    \ values.validFromFragmentId,\n    },\n    reason: values.reason,\nsrc/features/curation/hooks/useCurationQueue.ts:\
    \ held at the queryFn of useCurationQueue(), lines 14-24. It builds the list-review-queue request\
    \ and reads the answer through toReviewQueueList. — if (kind !== undefined) qs.set(\"kind\", kind);\n\
    qs.set(\"limit\", String(QUEUE_LIMIT));\nqs.set(\"offset\", \"0\");\nconst wire = await httpCuration<ReviewQueueListWire>(\n\
    \  `/api/v1/curation/queue?${qs.toString()}`,\n  { method: \"GET\", headers: authHeader() },\n);\n\
    return toReviewQueueList(wire);\nsrc/features/curation/types.ts: held at the Wire and request/response\
    \ interfaces, lines 22-84 and 148-252 — export interface ReviewQueueListWire {\n  readonly total:\
    \ number;\n  readonly limit: number;\n  readonly offset: number;\n  readonly items: ReadonlyArray<ReviewQueueItemWire>;\n\
    }\nexport interface MergeNodesRequest {\n  readonly survivor_id: string;\n  readonly absorbed_id:\
    \ string;\n  readonly reason: string;\n}\nexport interface CorrectItemRequest {\n  readonly item_kind:\
    \ ItemKind;\n  readonly item_id: string;\n  readonly corrected: CorrectedValues;\n  readonly reason:\
    \ string;\n}"
  encoded_at:
  - src/features/curation/api/_request.ts
  - src/features/curation/api/_transforms.ts
  - src/features/curation/api/curation.hooks.ts
  - src/features/curation/components/CorrectionForm/correction-schema.ts
  - src/features/curation/hooks/useCurationQueue.ts
  - src/features/curation/types.ts
- node: domain/curation-workspace/curation-shortcut
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at the CurationShortcut union type (lines\
    \ 34-45), produced by mapKey (lines 47-64) — export type CurationShortcut =\n  | \"next\"\n  | \"\
    prev\"\n  | \"toggleCheck\"\n  | \"evidence\"\n  | \"merge\"\n  | \"keepSeparate\"\n  | \"confirm\"\
    \n  | \"reject\"\n  | \"undo\"\n  | \"toggleHelp\"\n  | { readonly kind: \"selectIndex\"; readonly\
    \ n: number };"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: domain/curation-workspace/display-mode
  conforms: true
  how: 'src/features/curation/lib/display-mode.ts: held at Line 3, the `DisplayMode` type declaration.
    — export type DisplayMode = "summary" | "full-diff";'
  encoded_at:
  - src/features/curation/lib/display-mode.ts
- node: domain/curation-workspace/selected-item
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at the SelectedItem interface, lines 5-8 —\
    \ export interface SelectedItem {\n  readonly kind: SelectedItemKind;\n  readonly id: string;\n}"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: domain/knowledge-base/alias-kind
  conforms: true
  how: 'src/features/curation/types.ts: held at the inline union on `kind` in NodeAliasWire (line 371)
    and NodeAlias (line 413) — readonly kind: "canonical" | "alias";'
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/assertion-flag
  conforms: true
  how: 'src/features/curation/types.ts: held at the AssertionFlag type, line 19 — export type AssertionFlag
    = "uncertain" | "disputed" | "low_confidence";'
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/assertion-status
  conforms: true
  how: "src/features/curation/types.ts: held at the AssertionStatus type, lines 6-11 — export type AssertionStatus\
    \ =\n  | \"active\"\n  | \"uncertain\"\n  | \"disputed\"\n  | \"superseded\"\n  | \"deleted\";"
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/curation-metrics
  conforms: true
  how: "src/features/curation/api/_transforms.ts: held at toCurationMetrics, lines 140-151 — acceptRate:\
    \ wire.accept_rate,\nrejectRateByCode: wire.reject_rate_by_code,\nneedsReviewCount: wire.needs_review_count,\n\
    uncertainCount: wire.uncertain_count,\ndisputedCount: wire.disputed_count,\nentityMatchQueueCount:\
    \ wire.entity_match_queue_count,\ndisputedQueueCount: wire.disputed_queue_count,\ncomputedAt: parseIso(wire.computed_at),\n\
    src/features/curation/types.ts: held at CurationMetricsWire, lines 75-84, and CurationMetrics, lines\
    \ 137-146 — export interface CurationMetricsWire {\n  readonly accept_rate: number;\n  readonly reject_rate_by_code:\
    \ Readonly<Record<string, number>>;\n  readonly needs_review_count: number;\n  readonly uncertain_count:\
    \ number;\n  readonly disputed_count: number;\n  readonly entity_match_queue_count: number;\n  readonly\
    \ disputed_queue_count: number;\n  readonly computed_at: string;\n}"
  encoded_at:
  - src/features/curation/api/_transforms.ts
  - src/features/curation/types.ts
- node: domain/knowledge-base/dispute-decision
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the dispute branch of
    dispatch() (lines 101-123) and the dispute buttons array (lines 143-157). The name union at line 82
    also lists adjust_periods. — decision: "prefer_one", ... decision: "keep_disputed", ... id: "prefer_one"
    ... id: "keep_disputed" ... name: "merge_into" | "keep_separate" | "prefer_one" | "adjust_periods"
    | "keep_disputed" | "confirm" | "reject"

    src/features/curation/types.ts: held at the DisputeDecision type, line 4 — export type DisputeDecision
    = "prefer_one" | "adjust_periods" | "keep_disputed";'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/types.ts
- node: domain/knowledge-base/dispute-scope
  conforms: true
  how: "src/features/curation/types.ts: held at DisputeScopeWire, lines 48-54, and DisputeScope, lines\
    \ 112-118, with the kind of assertion in `item_kind` of DisputeQueueItemWire — export interface DisputeScopeWire\
    \ {\n  readonly source_node_id: string | null;\n  readonly target_node_id: string | null;\n  readonly\
    \ link_type: string | null;\n  readonly node_id: string | null;\n  readonly attribute_key: string\
    \ | null;\n}"
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/entity-match-decision
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the entity_match branch
    of dispatch() (lines 83-100) and the entity-match buttons array (lines 128-142) — decision: "merge_into",
    ... decision: "keep_separate"

    src/features/curation/types.ts: held at the EntityMatchDecision type, line 3 — export type EntityMatchDecision
    = "merge_into" | "keep_separate";'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/types.ts
- node: domain/knowledge-base/entity-match-review
  conforms: true
  how: "src/features/curation/types.ts: held at EntityMatchQueueItemWire, lines 28-35, and EntityMatchCandidateWire,\
    \ lines 22-26 — export interface EntityMatchCandidateWire {\n  readonly candidate_node_id: string;\n\
    \  readonly canonical_name: string;\n  readonly similarity: number;\n}"
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/features/curation/types.ts: held at the NodeStatus type, line 5 — export type NodeStatus =
    "active" | "needs_review" | "merged" | "deleted";'
  encoded_at:
  - src/features/curation/types.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the inline union
    on the `value` member of SOURCE_OPTIONS, lines 11-14, and the three `value` entries at lines 17, 22
    and 27 — readonly value: "stated" | "document" | "received";

    src/features/curation/components/CorrectionForm/correction-schema.ts: held at validFromSourceSchema,
    line 24, which declares the enumeration. — export const validFromSourceSchema = z.enum(["stated",
    "document", "received"]);

    src/features/curation/types.ts: held at the ValidFromSource type, line 12 — export type ValidFromSource
    = "stated" | "document" | "received";'
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
  - src/features/curation/components/CorrectionForm/correction-schema.ts
  - src/features/curation/types.ts
- node: domain/knowledge-base/value-type
  conforms: true
  how: 'src/features/curation/types.ts: held at the AttributeValueType type, line 20 — export type AttributeValueType
    = "text" | "date" | "number" | "bool";'
  encoded_at:
  - src/features/curation/types.ts
- node: rules/curation-workspace/acceptance-rate-shows-as-a-whole-percentage
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at formatPercent(), lines
    23-25, used by the first cell in buildCells() — return `${Math.round(rate * 100)}%`;

    { label: "Aceitação", value: formatPercent(metrics.acceptRate) },'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/active-tab-lives-only-on-the-page
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at Line 35, the kindFilter state, which
    is passed to useCurationQueue(kindFilter) at line 42. handleSelect at lines 64-72 writes only item
    to the address. — const [kindFilter, setKindFilter] = useState<QueueKindFilter>(undefined);

    ...

    search: next !== undefined ? { item: next } : {},'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/any-other-refusal-shows-in-the-panel-alert
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the Alert rendered when\
    \ serverError.code is outside the five-code list (lines 197-208) — {serverError &&\n  ![\"BUSINESS_REASON_REQUIRED\"\
    , \"BUSINESS_SELF_MERGE_FORBIDDEN\", \"BUSINESS_INVALID_TARGET_NODE\", \"BUSINESS_TEMPORAL_INCOHERENT\"\
    , \"BUSINESS_CORRECTION_NO_CHANGES\"].includes(serverError.code) && (\n    <Alert variant=\"destructive\"\
    \ role=\"alert\" className=\"mx-md\">{serverError.message}</Alert>"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/attribute-correction-needs-a-value
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the attribute branch\
    \ of the correctionSchema superRefine, lines 42-49. — if (data.itemKind === \"attribute\") {\n   \
    \   if (data.value === null) {\n        ctx.addIssue({\n          code: \"custom\",\n          path:\
    \ [\"value\"],\n          message: \"Informe o valor corrigido.\",\n        });\n      }\n    }"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/baseline-ignores-tab-changes
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at Lines 58-62. The baseline is set only\
    \ when it is null, and the dependency list excludes kindFilter. The only other write is the pill acknowledgement\
    \ at line 140. — useEffect(() => {\n    if (lastSeenTotal === null && data !== undefined) {\n    \
    \  updateLastSeen(total);\n    }\n  }, [lastSeenTotal, total, data, updateLastSeen]);"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/batch-bar-actions-follow-the-kind
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the three flags at lines 40-42
    and the conditional renders at lines 110, 123 and 137. A disputed kind sets none of the flags, so
    it renders no action. — const showConfirm = kind === "uncertain";

    const showReject = kind === "uncertain";

    const showKeepSeparate = kind === "entity_match";'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-acts-on-one-kind
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the `BatchKind` type and the single
    `kind` prop (lines 7 and 11). The bar takes one count and one kind and derives every action from that
    kind. — export type BatchKind = "entity_match" | "disputed" | "uncertain";

    readonly count: number;

    readonly kind: BatchKind;'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-needs-two-items
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the early return at line 34 —
    if (count < 2) return null;'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-offers-to-clear-the-selection
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the clear button at lines 99-107.
    It calls the caller-supplied `onClear` and does nothing else, so the clearing stays with the caller.
    — aria-label="Limpar seleção"

    onClick={onClear}'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/batch-bar-shows-the-count
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at line 98 — <span aria-live="polite">{count}
    selecionados</span>'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/blank-reason-blocks-a-destructive-decision
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ReasonField.tsx: held at validateOnSubmit() in\
    \ the useImperativeHandle block of ReasonField (lines 37-47). It trims the value, and when nothing\
    \ is left it sets the error, focuses the field and returns false, which is the signal the caller needs\
    \ to send nothing. — const trimmed = value.trim();\nif (trimmed.length === 0) {\n  setError(\"Informe\
    \ um motivo para continuar.\");\n  const el = document.getElementById(id) as HTMLTextAreaElement |\
    \ null;\n  el?.focus();\n  return false;\n}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
- node: rules/curation-workspace/caller-cancellation-ends-the-request
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at composeSignals() and its use in httpCuration(),
    lines 49-70 and 99-102. — const signal = composeSignals([timeoutController.signal, userSignal]);

    ...

    if (signal !== undefined) fetchInit.signal = signal;

    The caller''s signal and the cutoff signal are merged, via AbortSignal.any or a controller fallback,
    so either one aborts the fetch.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/candidate-shows-its-similarity-as-a-percentage
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CandidateCard.tsx: held at The clampPct function\
    \ (lines 13-17) and its use at line 26. The canonical name is rendered at line 46 and the percentage\
    \ at line 47. — function clampPct(n: number): number {\n  if (n < 0) return 0;\n  if (n > 1) return\
    \ 100;\n  return Math.round(n * 100);\n}\n...\n<span className=\"font-medium text-foreground\">{candidate.canonicalName}</span>\n\
    <span className=\"text-xs text-body\">{pct}%</span>"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CandidateCard.tsx
- node: rules/curation-workspace/changing-the-item-clears-the-draft
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the useEffect keyed\
    \ on the item's identity (lines 61-65) — setSelectedCandidate(null);\n    setSelectedSide(null);\n\
    \    setReason(\"\");\n  }, [item.kind === \"entity_match\" ? item.nodeId : item.sides.map((s) =>\
    \ s.itemId).join(\":\")]);"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/changing-the-item-restarts-the-correction
  conforms: false
  how: 'the fact left part of its ground: still held in src/features/curation/components/DecisionPanel/DecisionPanel.tsx,
    and src/features/curation/components/DecisionPanel/CorrectionSection.tsx read `nowhere in this file.
    The file keeps its own `open` state and never resets it when `itemId` changes. The restart is held
    by the caller, `DecisionPanel.tsx` (outside the file set), which mounts the section as `<CorrectionSection
    key={correctionItemId}`.` — const [open, setOpen] = useState(false);

    (caller, DecisionPanel.tsx line 245: key={correctionItemId}) — a binding asserts the file answers
    for the node, so the pair that stopped holding it is released by `--bind ... --replace`, never restamped
    here'
  observed_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/check-toggles-the-item-in-the-checked-set
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at The onToggleCheck handler, lines 107-116.\
    \ — const next = new Set(checkedIds);\nif (next.has(selectedItem.id)) {\n  next.delete(selectedItem.id);\n\
    } else {\n  next.add(selectedItem.id);\n}\nsetSelectedItems(next);"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/checked-set-starts-empty-and-is-replaced-whole
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at makeInitialState() (selectedItems) and\
    \ setSelectedItems, lines 47 and 84-86 — selectedItems: new Set<string>(),\nsetSelectedItems: (items)\
    \ => {\n  set({ selectedItems: items });\n},"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/chunk-excerpt-is-cut-to-200-characters
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the chunk excerpt
    line in the chunk loop of the fragment list, calling the shared truncate helper — {truncate(chunk.excerpt,
    200)} with truncate defined as `if (text.length <= max) return text; return `${text.slice(0, max -
    1).trimEnd()}…`;`'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/chunk-shows-its-source-date-and-offsets
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the chunk metadata
    paragraph inside frags.chunks.map — {formatSourceType(chunk.rawInformation.sourceType)} ·{" "}

    {formatDate(chunk.rawInformation.receivedAt)} · trecho{" "}

    {chunk.offsetStart}–{chunk.offsetEnd}  with formatDate returning d.toLocaleDateString("pt-BR")'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/client-detects-no-unchanged-correction
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the correctionSchema\
    \ superRefine, lines 41-80. It holds only the value or target, the start before the end, and the stated\
    \ fragment. None of its branches compares a value with the starting values. — if (data.validFrom !==\
    \ null && data.validTo !== null) {\n      if (data.validFrom >= data.validTo) {"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/confirmation-or-rejection-refreshes-the-provenance-of-the-item
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at the onSuccess of useConfirmItem and of useRejectItem,\
    \ through invalidateCurationAndAffected(). — onSuccess: (_data, variables) => {\n  invalidateCurationAndAffected(queryClient,\
    \ {\n    items: [{ kind: variables.item_kind, id: variables.item_id }],\n  });\n}"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/correction-checks-run-in-order
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at the order of the
    three checks in the correctionSchema superRefine, lines 41-79. The checks run in the order the node
    states, and each message carries its own path. — path: ["value"], ... path: ["targetNodeId"], ...
    path: ["validTo"], ... path: ["validFromFragmentId"],'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-dates-have-the-iso-shape
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at ISO_DATE_RE at line\
    \ 4 and the dateString schema at lines 11-22. Only the shape is tested, with no calendar check. —\
    \ const ISO_DATE_RE = /^\\d{4}-\\d{2}-\\d{2}$/;\n... if (v !== null && !ISO_DATE_RE.test(v)) {\n \
    \     ctx.addIssue({ code: \"custom\", message: \"Data inválida. Use o formato AAAA-MM-DD.\", });"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-fields-start-from-the-item
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the defaultValues\
    \ argument of useForm (lines 47-56), which calls buildDefaults and falls back to \"document\" for\
    \ the basis — defaultValues: buildDefaults({\n      itemKind,\n      itemId,\n      value: defaults.value\
    \ ?? null,\n      targetNodeId: defaults.targetNodeId ?? null,\n      validFrom: defaults.validFrom\
    \ ?? null,\n      validTo: defaults.validTo ?? null,\n      validFromSource: defaults.validFromSource\
    \ ?? \"document\",\n      validFromFragmentId: defaults.validFromFragmentId ?? null,\n    })\nThe\
    \ reason starts empty in buildDefaults in correction-schema.ts, a different file (`reason: \"\",`).\
    \ This file passes no reason.\nsrc/features/curation/components/CorrectionForm/correction-schema.ts:\
    \ held at buildDefaults, lines 95-109. — validFromSource: d.validFromSource ?? \"document\",\n   \
    \ validFromFragmentId: d.validFromFragmentId ?? \"\",\n    reason: \"\","
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-is-offered-only-for-a-dispute
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the canEdit gate: canCorrect
    (line 161) and its conditional render (line 243) — const canCorrect = item.kind === "disputed";

    ... {canCorrect && ('
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/correction-opens-inline-and-returns-focus
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at the `open` state,\
    \ the `open ? (<CorrectionForm ... onCancel={close} />) : (<Button ref={correctButtonRef} ...>` branch,\
    \ and `close()` — function close(): void {\n    setOpen(false);\n    requestAnimationFrame(() => {\n\
    \      correctButtonRef.current?.focus();\n    });\n  }"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
- node: rules/curation-workspace/correction-reason-is-required-and-trimmed
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the reason field\
    \ of correctionSchema, lines 36-39. It trims, requires at least one character, and sets no maximum.\
    \ — reason: z\n      .string()\n      .trim()\n      .min(1, { message: \"Informe um motivo para continuar.\"\
    \ }),"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-refreshes-the-provenance-and-the-history
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at the onSuccess of useCorrectItem. — items:\
    \ [\n  { kind: variables.item_kind, id: variables.item_id },\n  { kind: variables.item_kind, id: data.new_item_id\
    \ },\n],\nconst historyKey =\n  variables.item_kind === \"link\"\n    ? [\"history\", \"link\", variables.item_id]\n\
    \    : [\"history\", \"attribute\", variables.item_id];\nvoid queryClient.invalidateQueries({ queryKey:\
    \ historyKey });"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/correction-refusals-reach-the-form
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at `correctionServerError()`\
    \ and the `serverError={correctionServerError(serverError)}` prop passed to `CorrectionForm`. The\
    \ panel's alert is outside this file. — return serverError.code === \"BUSINESS_TEMPORAL_INCOHERENT\"\
    \ ||\n    serverError.code === \"BUSINESS_CORRECTION_NO_CHANGES\" ||\n    serverError.code === \"\
    BUSINESS_DATE_UNJUSTIFIED\" ||\n    serverError.code === \"BUSINESS_FRAGMENT_NOT_ACCEPTED\"\n    ?\
    \ serverError\n    : null;\nsrc/features/curation/components/DecisionPanel/DecisionPanel.tsx: held\
    \ at the exclusion list of the panel alert (lines 197-204) and the serverError prop passed to CorrectionSection\
    \ (line 251) — \"BUSINESS_TEMPORAL_INCOHERENT\",\n    \"BUSINESS_CORRECTION_NO_CHANGES\",\n  ].includes(serverError.code)\
    \ ... serverError={serverError}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/correction-sends-the-item-the-values-and-the-reason
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at buildCorrectItemRequest,\
    \ lines 111-130. — item_kind: itemKind,\n    item_id: itemId,\n    corrected: {\n...\n    reason:\
    \ values.reason,"
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-shows-submitting
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the two Buttons in\
    \ the footer row, lines 151-168 — onClick={onCancel}\n          disabled={submitting}\n...\nloading={submitting}"
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/correction-start-precedes-the-end
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the date check in\
    \ the correctionSchema superRefine, lines 60-68. The comparison is strict and the message lands on\
    \ validTo. — if (data.validFrom >= data.validTo) {\n        ctx.addIssue({\n          code: \"custom\"\
    ,\n          path: [\"validTo\"],\n          message: \"O início deve ser anterior ao fim.\","
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/correction-targets-the-first-side
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at correctionItemId (lines
    164-165) — item.kind === "disputed" ? item.sides[0]?.itemId ?? "" : "";'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/curation-request-carries-the-access-token
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at authHeader(), lines 6-9, and the Authorization
    header set on the resent request, lines 132-138. — return token !== null ? { Authorization: `Bearer
    ${token}` } : {};

    nextHeaders.set("Authorization", `Bearer ${fresh}`);

    A bearer is sent when a token is held and no Authorization header is produced otherwise. httpCuration()
    itself does not call authHeader(), so callers supply it.

    src/features/curation/hooks/useCurationQueue.ts: held at the request options in the queryFn, line
    21. The call goes through authHeader(), and that function''s bearer-or-nothing behavior lives in another
    file. — { method: "GET", headers: authHeader() },'
  encoded_at:
  - src/features/curation/api/_request.ts
  - src/features/curation/hooks/useCurationQueue.ts
- node: rules/curation-workspace/curation-request-times-out-after-thirty-seconds
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at DEFAULT_TIMEOUT_MS and the timer in httpCuration(),
    lines 16 and 93-98. — const DEFAULT_TIMEOUT_MS = 30_000;

    timeoutController.abort(new DOMException("Request timed out after 30s", "TimeoutError"));

    The resulting failure is EnvelopeError with httpStatus: 0, so it carries no answer status.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/date-justification-offers-three-bases
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the frozen SOURCE_OPTIONS
    array (lines 11-31), rendered by SOURCE_OPTIONS.map inside the RadioGroup (lines 82-93) — value: "stated",
    label: "Declarada no fragmento", hint: "A própria fonte diz a data — selecione o fragmento." ... value:
    "document", label: "Data do documento" ... value: "received", label: "Data de recebimento"

    src/features/curation/components/CorrectionForm/correction-schema.ts: held at validFromSourceSchema,
    line 24, holds only the three bases in the order stated, document, received. The labels and hints
    are not in this file. — export const validFromSourceSchema = z.enum(["stated", "document", "received"]);'
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the fmt function (lines
    22-24), used for both validFrom and validTo on line 70 — return d === null ? "—" : d.toLocaleDateString("pt-BR",
    { timeZone: "UTC" });

    src/features/curation/components/DecisionPanel/PeriodTimeline.tsx: held at fmtDate(), line 11, called
    for every date in describeSide() — return d === null ? "" : d.toLocaleDateString("pt-BR", { timeZone:
    "UTC" });'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  - src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
- node: rules/curation-workspace/decision-moves-to-the-ring-neighbour
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at the getNextItem callback passed\
    \ to useDecisionDispatch, lines 30-31 — getNextItem: () =>\n      neighbour(queue, useCurationStore.getState().selectedItem,\
    \ \"next\"),"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/decision-on-the-wrong-kind-sends-nothing
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the early returns in onResolveEntityMatch
    (line 48) and onResolveDispute (line 64) — if (item.kind !== "entity_match") return;

    if (item.kind !== "disputed") return;'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/decision-removes-its-item-by-its-identifier
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at optimisticIdOf(), the last function\
    \ of the file — case \"resolve_entity_match_keep\":\n    return d.nodeId;\ncase \"resolve_dispute_keep\"\
    :\ncase \"resolve_dispute_adjust\":\n    return d.body.item_ids[0] ?? null;\ncase \"confirm_item\"\
    :\n    return d.body.item_id;\ncase \"correct_item\":\n    return d.body.item_id;"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/decision-shows-as-sending-until-answered
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionBar.tsx: held at the `loading={submitting}`\
    \ prop on each rendered `Button` in `DecisionBar`, driven by the `submitting` prop (default `false`)\
    \ — submitting = false,\n...\nloading={submitting}\nsrc/features/curation/hooks/useDecisionDispatch.tsx:\
    \ held at commit(): the submitting state is set true before runMutation and false in finally — setSubmitting(true);\n\
    try {\n  await runMutation(dispatch);\n...\n} finally {\n  setSubmitting(false);\n}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionBar.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decision-moves-on-twice
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive() calls advance()\
    \ when the decision is made, and commit() calls advance() after runMutation succeeds — onItemRemove(optimisticId);\n\
    advance();\n...\nawait runMutation(dispatch);\nif (!isDestructive) {\n  toast.success(\"Confirmado.\"\
    , { duration: 2_000 });\n}\nadvance();"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decision-opens-the-undo-toast
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive(), the toast.custom\
    \ call — toast.custom(\n  (sonnerId) => (\n    <UndoToast\n      label={label}\n      deadlineMs={deadlineMs}\n\
    ...\n  { id: toastIdValue, duration: UNDO_WINDOW_MS },"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decision-removes-the-item-at-once
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive(), before the
    toast and the timeout that sends it — onItemRemove(optimisticId);

    advance();


    const deadlineMs = Date.now() + UNDO_WINDOW_MS;'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-decisions-carry-a-caption
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the captions passed to dispatchDestructive
    for the merge (line 53), the preference (line 70) and the rejection (line 90) — "Item fundido",

    "Lado preferido",

    "Item rejeitado",'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/destructive-decisions-wait-for-undo
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at the three dispatchDestructive calls:\
    \ merge_into (line 50), prefer_one (line 67) and onReject (line 88) — dispatch.dispatchDestructive(\n\
    \              { kind: \"resolve_entity_match_merge\", nodeId: item.nodeId, body },\ndispatch.dispatchDestructive(\n\
    \              { kind: \"resolve_dispute_prefer\", body },\ndispatch.dispatchDestructive(\n      \
    \      { kind: \"reject_item\", body },\nsrc/features/curation/hooks/useDecisionDispatch.tsx: held\
    \ at The DestructiveDispatch union (merge, dispute prefer, reject_item) and dispatchDestructive(),\
    \ which sends only from the timeout, commitPending or the unmount cleanup — export type DestructiveDispatch\
    \ =\n  | { readonly kind: \"resolve_entity_match_merge\"; ...\n  | { readonly kind: \"resolve_dispute_prefer\"\
    ; ...\n  | { readonly kind: \"reject_item\"; ...\nconst timeoutId = setTimeout(() => {\n  ...\n  void\
    \ commit(snapshot.dispatch, snapshot.optimisticId, true);\n}, UNDO_WINDOW_MS);"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/destructive-success-shows-no-notice-and-moves-on
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit(): the success toast is guarded\
    \ by !isDestructive, and advance() runs either way — if (!isDestructive) {\n  toast.success(\"Confirmado.\"\
    , { duration: 2_000 });\n}\nadvance();"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/display-mode-is-decided-from-the-entry-alone
  conforms: true
  how: 'src/features/curation/lib/display-mode.ts: held at The signature of `resolveDisplayMode`, line
    7. It takes only the queue item and reads nothing else. — export function resolveDisplayMode(item:
    ReviewQueueItem): DisplayMode {'
  encoded_at:
  - src/features/curation/lib/display-mode.ts
- node: rules/curation-workspace/dispute-evidence-counts-as-viewed-when-its-trail-says-so
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at provenanceContextOf (lines 9-16),\
    \ the evidenceViewed store read set by ProvenanceTrail's onEvidenceViewed, and the effectiveEvidenceViewed\
    \ expression (line 37) — const first = item.sides[0];\n  if (first === undefined) return null;\nconst\
    \ effectiveEvidenceViewed = armedImmediately || evidenceViewed;\nonEvidenceViewed={() => {\n     \
    \         setEvidenceViewed(true);"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/dispute-header-adds-the-relation
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at headerRelation (lines
    45-48) and the span rendered once subjectQ.data is present (lines 183-189) — (item.itemKind === "link"
    ? item.scope.linkType : item.scope.attributeKey)

    ... {item.kind === "disputed" && subjectQ.data != null && headerRelation && ('
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/dispute-header-names-its-subject-node
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at subjectId (lines 38-43),
    the node-detail read (line 44) and headerSubject (lines 49-52) — return item.itemKind === "link" ?
    item.scope.sourceNodeId : item.scope.nodeId;

    const subjectQ = useCurationNodeDetail(subjectId);

    ... (subjectQ.data?.node.canonicalName ?? describeScope(item))'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/dispute-offers-prefer-one-and-keep-disputed
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the dispute buttons
    array (lines 143-157). It has two entries and none adjusts periods. — id: "prefer_one", label: "Preferir
    este" ... id: "keep_disputed", label: "Manter em disputa"'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/dispute-resolution-refreshes-the-provenance-of-its-items
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at the onSuccess of useResolveDispute. — items:\
    \ variables.item_ids.map((id) => ({\n  kind: variables.item_kind,\n  id,\n})),"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/dispute-shows-summary-for-two-sides-with-an-end
  conforms: true
  how: "src/features/curation/lib/display-mode.ts: held at Lines 17-21, the dispute branch of `resolveDisplayMode`.\
    \ — if (item.sides.length === 2) {\n    const noOverlap = item.sides.some((s) => s.validTo !== null);\n\
    \    if (noOverlap) return \"summary\";\n  }\n  return \"full-diff\";"
  encoded_at:
  - src/features/curation/lib/display-mode.ts
- node: rules/curation-workspace/drawer-closes-on-esc-close-backdrop-or-removal
  conforms: true
  how: "src/features/curation/components/CurationDrawer/CurationDrawer.types.ts: held at CurationDrawerProps,\
    \ lines 4-5: the `open` and `onOpenChange` members. The file only declares the props shape; the Esc,\
    \ close button, backdrop and removal triggers live in whatever implements the drawer. — readonly open:\
    \ boolean;\n  readonly onOpenChange: (open: boolean) => void;"
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
- node: rules/curation-workspace/drawer-holds-one-queue-item
  conforms: true
  how: "src/features/curation/components/CurationDrawer/CurationDrawer.types.ts: held at CurationDrawerProps,\
    \ lines 6-7: the `kind` and `itemId` members. The drawer takes exactly one item, identified by kind\
    \ and id. — readonly kind: SelectedItemKind;\n  readonly itemId: string;"
  encoded_at:
  - src/features/curation/components/CurationDrawer/CurationDrawer.types.ts
- node: rules/curation-workspace/each-decision-uses-the-action-of-its-kind
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at runMutation(), the switch on dispatch.kind\
    \ — case \"resolve_entity_match_merge\":\ncase \"resolve_entity_match_keep\":\n  await mEntityMatch.mutateAsync({\n\
    ...\ncase \"resolve_dispute_prefer\":\ncase \"resolve_dispute_keep\":\ncase \"resolve_dispute_adjust\"\
    :\n  await mDispute.mutateAsync(dispatch.body);\n...\ncase \"confirm_item\": await mConfirm.mutateAsync(dispatch.body);\n\
    case \"reject_item\": await mReject.mutateAsync(dispatch.body);\ncase \"correct_item\": await mCorrect.mutateAsync(dispatch.body);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/empty-correction-field-is-sent-as-null
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at the optionalString
    and dateString transforms, lines 6-14. They are applied to value, targetNodeId, validFrom, validTo
    and validFromFragmentId. — .transform((v) => (v === undefined || v.length === 0 ? null : v));'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/entity-match-evidence-counts-as-viewed-at-once
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the entity_match branch of provenanceContextOf
    (line 12) together with armedImmediately (line 36) — if (item.kind === "entity_match") return null;

    const armedImmediately = provenance === null;'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/entity-match-header-names-the-proposed-node
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at headerSubject (lines
    49-51) — item.kind === "entity_match" ? item.canonicalName'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/entity-match-offers-merge-and-keep-separate
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the entity-match buttons
    array (lines 128-142) — id: "merge_into", label: "Fundir neste" ... id: "keep_separate", label: "Manter
    separados"'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/entity-match-resolution-refreshes-the-node-details
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at the onSuccess of useResolveEntityMatch. —\
    \ const nodeIds: string[] = [variables.node_id];\nif (variables.body.target_node_id) {\n  nodeIds.push(variables.body.target_node_id);\n\
    }\ninvalidateCurationAndAffected(queryClient, { nodeIds });"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/entity-match-shows-summary-for-one-high-similarity-candidate
  conforms: true
  how: "src/features/curation/lib/display-mode.ts: held at Lines 5 and 8-15, the `entity_match` branch\
    \ and the `HIGH_SIMILARITY_THRESHOLD` constant. — export const HIGH_SIMILARITY_THRESHOLD = 0.9;\n\
    ...\n  if (item.kind === \"entity_match\") {\n    if (item.candidates.length === 1) {\n      const\
    \ top = item.candidates[0];\n      if (top !== undefined && top.similarity >= HIGH_SIMILARITY_THRESHOLD)\
    \ {\n        return \"summary\";"
  encoded_at:
  - src/features/curation/lib/display-mode.ts
- node: rules/curation-workspace/every-decision-waits-for-the-evidence
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at the correction `Button`'s\
    \ `aria-disabled` and `onClickCapture` handler — aria-disabled={!evidenceViewed || undefined}\nonClickCapture={(e)\
    \ => {\n  if (!evidenceViewed) {\n    e.preventDefault();\n    e.stopPropagation();\n  }\n}}\nsrc/features/curation/components/DecisionPanel/DecisionBar.tsx:\
    \ held at the `gated(handler)` wrapper, which every button's `onClick` passes through, together with\
    \ `aria-disabled={!evidenceViewed || undefined}` on each button — if (!evidenceViewed) {\n  e.preventDefault();\n\
    \  e.stopPropagation();\n  return;\n}\nhandler();\n...\naria-disabled={!evidenceViewed || undefined}\n\
    ...\nonClick={gated(b.onClick)}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionBar.tsx
- node: rules/curation-workspace/every-side-is-listed-and-selectable
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the button''s role="radio"
    and onClick (lines 44-49). This file renders one side and reports the selection through onSelect.
    Listing every side and recording the winner sit in the caller and are not read here. — role="radio"

    aria-checked={selected}

    aria-label={label}

    onClick={() => onSelect(side.itemId)}'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/evidence-indicator-pulses-until-viewed
  conforms: false
  how: "src/features/curation/components/DecisionPanel/EvidenceChip.tsx, the aria-label prop on the root\
    \ span, lines 14-18: aria-label={\n  viewed\n    ? \"Evidência vista.\"\n    : \"Veja a evidência\
    \ antes de decidir\"\n} — The node says the indicator reads \"Ver evidência\" until the evidence is\
    \ viewed, then \"Evidência vista\". The visible text does that. An aria-label replaces an element's\
    \ accessible name, so a screen reader announces \"Veja a evidência antes de decidir\" for the unviewed\
    \ state and \"Evidência vista.\" with a trailing period for the viewed state. This is the hint wording\
    \ that curation-screen carries on a blocked decision. Here it is a different string (no final period)\
    \ used as the indicator's own name, and it is also the second place the hint is spelled. Anyone who\
    \ changes the hint, or the indicator's wording, finds two spellings. What the owner hears and what\
    \ the owner sees differ."
  observed_at:
  - src/features/curation/components/DecisionPanel/EvidenceChip.tsx
- node: rules/curation-workspace/evidence-viewed-is-supplied-by-the-caller
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.types.ts: held at the evidenceViewed
    member of DecisionPanelProps, line 28 — readonly evidenceViewed: boolean;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
- node: rules/curation-workspace/failed-decision-is-read-in-order
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at handleError(): the branches run in
    this order. They are non-envelope, auth codes, VANISHED_CODES, INLINE_FIELD_CODES, httpStatus >= 500,
    then the fall-through. — if (!isEnvelopeError(err)) {

    ...

    if (code === "AUTH_UNAUTHORIZED" || ...

    if (VANISHED_CODES.has(code)) {

    ...

    if (INLINE_FIELD_CODES.has(code)) {

    ...

    if (httpStatus >= 500) {

    ...

    setServerError({ code, message, httpStatus });'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals
  conforms: true
  how: "src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the `hasError && fallback`\
    \ branch of buildCells(), lines 38-52 — if (hasError && fallback) {\n  return [\n    { label: \"Aceitação\"\
    , value: \"—\" },\n    { label: \"Em revisão\", value: \"—\" },\n    { label: \"Incertos\", value:\
    \ \"—\" },\n    { label: \"Disputados\", value: String(fallback.disputedQueueCount) },\n    { label:\
    \ \"Fila entidades\", value: String(fallback.entityMatchQueueCount) },\n  ];\n}"
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/failed-metrics-never-fail-the-strip
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the final `return [];`
    of buildCells(), line 53, together with `const skeleton = !settled || cells.length === 0;` on line
    59 — return [];

    const skeleton = !settled || cells.length === 0;

    The component takes `hasError` as a prop and never throws. With an error and no fallback, buildCells()
    returns no cells and the placeholder branch renders.'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/failure-without-an-envelope-leaves-the-item-removed
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit() catch block: the restore\
    \ is guarded by isEnvelopeError(err), and handleError for a non-envelope failure only toasts — if\
    \ (\n  isDestructive &&\n  isEnvelopeError(err) &&\n  !VANISHED_CODES.has(err.code) &&\n  optimisticId\
    \ !== null\n) {\n  onItemRestore(optimisticId);\n}"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/field-code-wins-over-the-server-status
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at handleError(): the INLINE_FIELD_CODES\
    \ branch comes before the httpStatus >= 500 branch — if (INLINE_FIELD_CODES.has(code)) {\n  setServerError({\
    \ code, message, httpStatus });\n  return;\n}\n\nif (httpStatus >= 500) {"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/field-messages-appear-on-blur-and-submit
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the useForm option
    `mode: "onBlur"` (line 57) together with `onSubmit={handleSubmit(submit)}` (line 96) and the error
    paragraph for the reason field — mode: "onBlur",

    ...

    onSubmit={handleSubmit(submit)}

    ...

    {errors.reason && ('
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/first-unauthorized-curation-answer-refreshes-the-token-once
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at trySilentRefresh() and the 401 branch of httpCuration(),
    lines 72-83 and 129-144. — const newJwt = await fetchAccessToken();

    useAuthStore.getState().setToken(newJwt);

    return httpCuration<T>(path, { ...opts, headers: Object.fromEntries(nextHeaders.entries()), __retried:
    true });

    A new token is obtained, stored, and the request is resent once.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/form-hands-the-request-to-its-caller
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.types.ts: held at CorrectionFormProps,\
    \ lines 20 and 23: the `onSubmit` callback and the `serverError` prop. — readonly onSubmit: (body:\
    \ CorrectItemRequest) => void;\nreadonly serverError?: { readonly code: string; readonly message:\
    \ string } | null;\nsrc/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at\
    \ the `onSubmit` prop passed to `CorrectionForm`, and the `onCorrect` prop. The file submits nothing\
    \ itself, and the server error comes back in as a prop carrying `code`. — onSubmit={(body) => {\n\
    \  onCorrect(body);\n}}\nsrc/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at\
    \ the onCorrect handler and the serverError prop passed to CorrectionSection (lines 251-256) — serverError={serverError}\n\
    ... onCorrect={(req) => { actions?.onCorrect?.(req); }}"
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.types.ts
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/fragment-field-shows-only-under-stated
  conforms: true
  how: "src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the showPicker\
    \ and showManualFragment conditions, lines 61-66, which gate the two fragment field blocks at lines\
    \ 98 and 127 — const showPicker =\n    validFromSource === \"stated\" &&\n    hasFilter && ...\n \
    \ const showManualFragment = validFromSource === \"stated\" && !showPicker;"
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/fragment-filter-reaches-the-picker
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CorrectionSection.tsx: held at the `fragmentFilter`\
    \ prop and its spread into `CorrectionForm` — {...(fragmentFilter ? { fragmentFilter } : {})}\nsrc/features/curation/components/DecisionPanel/DecisionPanel.types.ts:\
    \ held at the fragmentFilter member of DecisionPanelProps, lines 34-37. This file only declares the\
    \ prop's shape. The code that forwards it to the picker is not in this file. — readonly fragmentFilter?:\
    \ {\n    readonly llmRunId?: string;\n    readonly rawInformationId?: string;\n  };"
  encoded_at:
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
- node: rules/curation-workspace/fragment-id-is-sent-whatever-the-basis
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at the corrected object
    in buildCorrectItemRequest, line 126, which has no condition on the basis. — valid_from_fragment_id:
    values.validFromFragmentId,'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/fragment-shows-its-confidence-as-a-percentage
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the fragment header
    span — <span>confiança {(frag.confidence * 100).toFixed(0)}%</span>'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/fragment-text-is-cut-to-280-characters
  conforms: true
  how: "src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at truncate() with\
    \ its default max of 280, applied to the fragment text — function truncate(text: string, max = 280):\
    \ string {\n  if (text.length <= max) return text;\n  return `${text.slice(0, max - 1).trimEnd()}…`;\n\
    }  and  <p className=\"text-xs text-foreground\">{truncate(frag.text)}</p>"
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/header-badge-names-the-queue-kind
  conforms: true
  how: "src/features/curation/components/QueueItem.tsx: held at mapKindToBadge(), lines 26-34, rendered\
    \ by the StateBadge element at line 86 — if (kind === \"entity_match\") {\n    return { state: \"\
    uncertain\", label: \"Para revisar\" };\n  }\n  return { state: \"disputed\", label: \"Disputado\"\
    \ };"
  encoded_at:
  - src/features/curation/components/QueueItem.tsx
- node: rules/curation-workspace/immediate-decisions-are-sent-at-once
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the dispatchNonDestructive calls
    for the entity-match keep (line 56), dispute keep (line 73), adjust (line 78), confirm (line 85) and
    correct (line 95) — dispatch.dispatchNonDestructive({ kind: "resolve_dispute_keep",

    dispatch.dispatchNonDestructive({ kind: "confirm_item", body });

    dispatch.dispatchNonDestructive({ kind: "correct_item", body });

    src/features/curation/hooks/useDecisionDispatch.tsx: held at The NonDestructiveDispatch union and
    dispatchNonDestructive(), which calls commit() directly — const optimisticId = optimisticIdOf(dispatch);

    void commit(dispatch, optimisticId, false);'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/immediate-success-confirms-and-moves-on
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit(): success branch for a non-destructive\
    \ dispatch — if (!isDestructive) {\n  toast.success(\"Confirmado.\", { duration: 2_000 });\n}\nadvance();"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/inline-confirmation-confirms-or-cancels
  conforms: true
  how: "src/features/curation/components/BatchBar/BatchBar.tsx: held at handleConfirmReject and handleCancelReject\
    \ (lines 52-59), wired to the Confirmar and Cancelar buttons. Setting `pendingReject` to false brings\
    \ the action row back. — function handleConfirmReject(): void {\n  setPendingReject(false);\n  onReject?.();\n\
    }\nfunction handleCancelReject(): void {\n  setPendingReject(false);\n}"
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/invalid-date-in-an-answer-fails-the-read
  conforms: true
  how: "src/features/curation/api/_transforms.ts: held at parseIso and parseIsoOrNull, lines 55-66 — const\
    \ d = new Date(value);\nif (Number.isNaN(d.getTime())) {\n  throw new Error(`Invalid ISO date string:\
    \ ${value}`);\n}\nreturn d;"
  encoded_at:
  - src/features/curation/api/_transforms.ts
- node: rules/curation-workspace/invalid-target-refusal-marks-the-candidate
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at invalidCandidateId (lines
    67-71), passed to ComparePane (line 222). The code is left out of the alert (line 201), so no message
    text shows. — serverError?.code === "BUSINESS_INVALID_TARGET_NODE" ? selectedCandidate : null;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/item-age-is-measured-from-a-fixed-reference
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at now (line 36), used\
    \ at line 194 — const now = useMemo(() => new Date(), [item]);\n... {relative(now, item.createdAt)}\n\
    src/features/curation/components/QueueItem.tsx: held at the useMemo at lines 56-59, whose only dependency\
    \ is item.createdAt. The reference time (the default `now = new Date()` in formatRelative) is taken\
    \ when the memo is computed, so it is fixed again only when the item changes. — const relative = useMemo(\n\
    \    () => formatRelative(item.createdAt),\n    [item.createdAt],\n  );"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/components/QueueItem.tsx
- node: rules/curation-workspace/item-id-is-everything-after-the-first-colon
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at parseItemSearchParam, lines 95-100 — const
    colon = raw.indexOf(":");

    const kind = raw.slice(0, colon);

    const id = raw.slice(colon + 1);'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/keep-decisions-check-only-the-gate
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the keep_separate and\
    \ keep_disputed branches of dispatch() (lines 94-100 and 114-122). Neither checks a selection or the\
    \ reason. The gate is the evidenceViewed passed to DecisionBar (line 237). — if (name === \"keep_separate\"\
    ) {\n  actions?.onResolveEntityMatch?.({ decision: \"keep_separate\", reason: reason || null });\n\
    \  return;\n}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/keep-disputed-sends-the-items-the-decision-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the keep_disputed branch
    of dispatch() (lines 114-122) — item_kind: item.itemKind,

    item_ids: item.sides.map((s) => s.itemId),

    decision: "keep_disputed",

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/keep-separate-sends-the-decision-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the keep_separate branch
    of dispatch() (lines 94-100) — decision: "keep_separate",

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/keyboard-moves-follow-the-click-path
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at The onNext, onPrev and onSelectIndex
    handlers, lines 95-106. Each calls handleSelect, the same function QueueList receives as onSelect
    at line 162. — if (next !== null) handleSelect(next);

    ...

    onSelect={handleSelect}'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/keyboard-shortcuts-act-only-while-enabled
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at useCurationKeyboard, the options destructuring
    and the guard at the top of the effect (lines 70 and 80) — const { enabled = true, target } = options;

    ...

    if (!enabled) return undefined;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/keys-typed-into-a-field-are-no-shortcut
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at isEditableTarget (lines 22-32), called
    from onKeyDown (line 85) — if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;

    if (target.isContentEditable) return true;

    if (role === "combobox" || role === "listbox" || role === "textbox") {

    ...

    if (isEditableTarget(event.target)) return;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/last-seen-total-starts-empty-and-follows-changes
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at makeInitialState() (lastSeenTotal) and\
    \ updateLastSeen, lines 46 and 77-82 — lastSeenTotal: null,\nupdateLastSeen: (total) => {\n  set((state)\
    \ => {\n    if (state.lastSeenTotal === total) return {};\n    return { lastSeenTotal: total };\n\
    \  });\n},"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/leaving-sends-the-pending-decision-at-once
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at The unmount cleanup in the final\
    \ useEffect — if (pendingRef.current !== null) {\n  toast.info(\"Ação comprometida ao sair.\");\n\
    \  const snapshot = pendingRef.current;\n  clearTimeout(snapshot.timeoutId);\n  toast.dismiss(snapshot.toastId);\n\
    \  pendingRef.current = null;\n  void commit(snapshot.dispatch, snapshot.optimisticId, true);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/link-correction-needs-a-target
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the link branch\
    \ of the correctionSchema superRefine, lines 50-58. It checks emptiness only, with no format check.\
    \ — } else if (data.itemKind === \"link\") {\n      if (data.targetNodeId === null) {\n        ctx.addIssue({\n\
    \          code: \"custom\",\n          path: [\"targetNodeId\"],\n          message: \"Selecione\
    \ o nó-alvo da fusão.\","
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/link-items-use-link-reads-and-others-attribute-reads
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at invalidateCurationAndAffected(), and the\
    \ history key of useCorrectItem. — kind === \"link\"\n  ? provenanceKeys.link(id)\n  : provenanceKeys.attribute(id);\n\
    variables.item_kind === \"link\"\n  ? [\"history\", \"link\", variables.item_id]\n  : [\"history\"\
    , \"attribute\", variables.item_id];"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/link-side-is-named-by-its-target
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the isLink and label\
    \ computation (lines 32-41), with the node type shown on lines 63-65 — const isLink = side.value ===\
    \ null && side.targetNodeId !== null;\n...\n? (targetName ??\n  (nodeQ.isPending\n    ? \"Carregando…\"\
    \n    : `nó ${side.targetNodeId?.slice(0, 8) ?? \"?\"}`))"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/manual-fragment-id-is-not-checked
  conforms: true
  how: 'src/features/curation/components/CorrectionForm/correction-schema.ts: held at validFromFragmentId,
    line 35, is an optionalString with no format test. — validFromFragmentId: optionalString,'
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/merge-checks-the-gate-then-a-candidate-then-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the merge_into branch
    of dispatch() (lines 84-86). The candidate is checked, then the reason. The gate is the evidenceViewed
    passed to DecisionBar (line 237). — if (!selectedCandidate) return;

    if (!reasonRef.current?.validateOnSubmit()) return;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/merge-refreshes-both-node-details
  conforms: true
  how: "src/features/curation/api/curation.hooks.ts: held at the onSuccess of useMergeNodes. — invalidateCurationAndAffected(queryClient,\
    \ {\n  nodeIds: [variables.survivor_id, variables.absorbed_id],\n});"
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/merge-sends-the-decision-the-target-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the merge_into branch
    of dispatch() (lines 87-91) — decision: "merge_into",

    target_node_id: selectedCandidate,

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/merge-stays-offered-without-a-candidate
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the merge button, always
    in the entity-match array (lines 129-135), and the early return in dispatch (line 85) — onClick: ()
    => dispatch("merge_into") ... if (!selectedCandidate) return;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/metrics-stay-fresh-for-thirty-seconds
  conforms: true
  how: 'src/features/curation/api/curation.hooks.ts: held at the useCurationMetrics() query options, with
    no refetchInterval. — const METRICS_STALE_MS = 30_000;

    staleTime: METRICS_STALE_MS,

    refetchOnWindowFocus: true,

    retry: 1,'
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/metrics-strip-hides-the-reject-rate-and-the-time
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the cell lists in buildCells(),
    lines 29-52, which carry only the five metrics — { label: "Aceitação", ... }, { label: "Em revisão",
    ... }, { label: "Incertos", ... }, { label: "Disputados", ... }, { label: "Fila entidades", ... }

    No cell, label or element in the file shows a reject rate or a computed-at time.'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/metrics-strip-shows-five-metrics-in-order
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the metrics branch of
    buildCells(), lines 29-37, and the lead/counts rendering, lines 60 and 85-100 — { label: "Aceitação",
    value: formatPercent(metrics.acceptRate) },

    { label: "Em revisão", value: String(metrics.needsReviewCount) },

    { label: "Incertos", value: String(metrics.uncertainCount) },

    { label: "Disputados", value: String(metrics.disputedCount) },

    { label: "Fila entidades", value: String(metrics.entityMatchQueueCount) },

    const [lead, ...counts] = cells;

    <span className="text-lg font-semibold tracking-tight tabular-nums text-foreground">'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/metrics-strip-shows-placeholders-until-settled
  conforms: true
  how: 'src/features/curation/components/MetricsStrip/MetricsStrip.tsx: held at the `skeleton` flag, line
    59, the `aria-busy` attribute on the root, line 66, and the placeholder branch, lines 69-82 — const
    skeleton = !settled || cells.length === 0;

    aria-busy={skeleton || undefined}

    role="status"

    aria-label="Carregando métrica"'
  encoded_at:
  - src/features/curation/components/MetricsStrip/MetricsStrip.tsx
- node: rules/curation-workspace/modified-keys-are-no-shortcut
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at the first line of mapKey (line 48)
    — if (event.ctrlKey || event.altKey || event.metaKey) return null;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/moving-on-selects-the-next-item-and-counts-it
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at advance() — const next = getNextItem();\n\
    setSelectedItem(next);\nincrementResolved();\nsrc/features/curation/state/curation-store.ts: held\
    \ at incrementResolved, lines 73-75, together with the generic setSelectedItem (lines 54-64). The\
    \ store has no single move-on operation. The count half is held here, and the choice of which item\
    \ is next is made by the caller outside this file. — incrementResolved: () => {\n  set((state) =>\
    \ ({ sessionResolved: state.sessionResolved + 1 }));\n},"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/new-item-count-is-the-total-minus-the-baseline
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at Lines 56-62 and 140. The count is clamped
    at zero, the baseline starts at the first total seen, and it moves only through onAck on the pill.
    — const delta = lastSeenTotal === null ? 0 : Math.max(0, total - lastSeenTotal);

    ...

    <PollingPill delta={delta} onAck={() => updateLastSeen(total)} />'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/next-and-previous-move-through-the-queue-as-a-ring
  conforms: true
  how: "src/features/curation/components/curation-page-helpers.ts: held at neighbour(), lines 46-65 —\
    \ const idx =\n  cur === -1\n    ? direction === \"next\"\n      ? 0\n      : len - 1\n    : direction\
    \ === \"next\"\n      ? (cur + 1) % len\n      : (cur - 1 + len) % len;"
  encoded_at:
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/no-selection-leaves-no-item-parameter
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at stringifyItemSearchParam, lines 103-108
    — if (item === null) return undefined;

    return `${item.kind}:${item.id}`;'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/node-detail-sends-its-options-only-when-asked
  conforms: true
  how: "src/features/curation/api/node.hooks.ts: held at buildNodeQs(), lines 28-36, called from the queryFn\
    \ of useCurationNodeDetail(). — if (params.asOf !== undefined) search.set(\"as_of\", params.asOf);\n\
    if (params.inEffectOnly === true) search.set(\"in_effect_only\", \"true\");\nif (params.includeUncertain\
    \ === false)\n  search.set(\"include_uncertain\", \"false\");"
  encoded_at:
  - src/features/curation/api/node.hooks.ts
- node: rules/curation-workspace/nothing-is-preselected
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the initial state of\
    \ the two selections (lines 54-57) — useState<string | null>(\n    null,\n  );\n  const [selectedSide,\
    \ setSelectedSide] = useState<string | null>(null);"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/one-destructive-decision-waits-at-a-time
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at dispatchDestructive() opening guard,\
    \ together with commitPending() — if (pendingRef.current !== null) {\n  commitPending();\n}\n...\n\
    clearTimeout(p.timeoutId);\ntoast.dismiss(p.toastId);"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/owner-selects-by-click-enter-or-space
  conforms: true
  how: "src/features/curation/components/QueueItem.tsx: held at the onClick handler at line 74 and handleKey,\
    \ lines 61-66, attached at line 75 on a native button element — onClick={() => onSelect(itemKey)}\n\
    onKeyDown={handleKey}\nif (event.key === \"Enter\" || event.key === \" \") {\n    event.preventDefault();\n\
    \    onSelect(itemKey);\n  }"
  encoded_at:
  - src/features/curation/components/QueueItem.tsx
- node: rules/curation-workspace/page-counts-loaded-entries-as-the-metrics-fallback
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at The metricsFallback memo, lines 82-90.
    — if (it.kind === "entity_match") em += 1;

    else dp += 1;

    ...

    return { entityMatchQueueCount: em, disputedQueueCount: dp };'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/page-does-not-remove-a-decided-item-itself
  conforms: true
  how: "src/features/curation/components/CurationDecision.tsx: held at the no-op removal and restore callbacks\
    \ passed to useDecisionDispatch, lines 32-33 — onItemRemove: () => {},\n    onItemRestore: () => {},"
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/page-keeps-its-state-when-left
  conforms: false
  how: 'src/features/curation/components/CurationPage.tsx, The same mount effect, lines 50-54, read against
    the store''s selectedItem.: const selectedItem = useCurationStore((s) => s.selectedItem);

    ...

    const initial = deriveInitialSelection(data, deepLink);

    setSelectedItem(initial); — The store keeps selectedItem while the owner is away. When the page mounts
    again with no item in the address, the effect replaces the kept selection with the first entry of
    the queue. The kept selection is discarded on re-entry even though nothing cleared it on leaving.
    A reader who trusts that leaving keeps the selected item will not find where it is lost. Whether this
    counts as clearing it is the person''s to decide; the evidence is that the stored selection is not
    consulted on re-entry.'
  observed_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/page-lists-only-one-queue-page
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at Lines 42 and 74. There is a single
    useCurationQueue read, and the list is built from its items alone. — const queueQuery = useCurationQueue(kindFilter);

    ...

    const items = data?.items ?? [];'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/page-wires-four-shortcuts
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at The useCurationKeyboard call, lines\
    \ 94-117. It receives exactly four handlers. — useCurationKeyboard({\n    onNext: () => {\n    onPrev:\
    \ () => {\n    onSelectIndex: (n) => {\n    onToggleCheck: () => {"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/pending-confirmation-survives-a-selection-change
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the `pendingReject` state (line
    32). Only the confirm and cancel handlers reset it. No effect or branch on `count` or `kind` clears
    it, and the `count < 2` early return only skips rendering. — const [pendingReject, setPendingReject]
    = useState(false);

    {pendingReject ? ('
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/pending-decision-lives-in-memory-only
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at The pending decision is held only
    in a useRef, never in the store or any storage — const pendingRef = useRef<PendingDestructive | null>(null);'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/periods-are-listed-in-words-under-the-sides
  conforms: true
  how: "src/features/curation/components/DecisionPanel/PeriodTimeline.tsx: held at describeSide() (lines\
    \ 14-28) and the PeriodTimeline render (lines 30-48), which maps over sides in item order — const\
    \ label = String.fromCharCode(65 + i);\n...\nreturn `Lado ${label}: vigente de ${fmtDate(s.validFrom)}\
    \ a ${fmtDate(\n    s.validTo,\n  )}`;\n...\n{sides.map((s, i) => (\n        <li key={s.itemId} className=\"\
    flex items-center gap-sm\">"
  encoded_at:
  - src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
- node: rules/curation-workspace/picker-choice-shows-eighty-characters
  conforms: true
  how: "src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the options mapping\
    \ of the Select, lines 108-111 — options={(fragmentQ.data?.items ?? []).map((f) => ({\n          \
    \    value: f.fragmentId,\n              label: f.text.slice(0, 80),\n            }))}"
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id
  conforms: true
  how: "src/features/curation/components/CorrectionForm/DateJustification.tsx: held at showPicker and\
    \ showManualFragment, lines 61-66, and the manual Input block at lines 127-153 — const showPicker\
    \ =\n    validFromSource === \"stated\" &&\n    hasFilter &&\n    !fragmentQ.isError &&\n    (fragmentQ.data?.items.length\
    \ ?? 0) > 0;\n  const showManualFragment = validFromSource === \"stated\" && !showPicker;"
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/prefer-checks-the-gate-then-a-side-then-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the prefer_one branch
    of dispatch() (lines 102-104). The gate is the evidenceViewed passed to DecisionBar (line 237). —
    if (!selectedSide) return;

    if (!reasonRef.current?.validateOnSubmit()) return;'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/preference-removes-its-item-by-the-first-id
  conforms: true
  how: 'src/features/curation/components/CurationDecision.tsx: held at the optimisticId expression in
    onResolveDispute, line 65 — const optimisticId = body.item_ids[0] ?? item.sides[0]?.itemId ?? "";'
  encoded_at:
  - src/features/curation/components/CurationDecision.tsx
- node: rules/curation-workspace/preference-sends-the-items-the-decision-the-winner-and-the-reason
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the prefer_one branch
    of dispatch() (lines 105-111) — item_kind: item.itemKind,

    item_ids: item.sides.map((s) => s.itemId),

    decision: "prefer_one",

    winner_id: selectedSide,

    reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/queue-failure-is-checked-before-empty
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at Line 75 (isEmpty excludes isError)\
    \ and the branch order at lines 154-158. — const isEmpty = !isPending && !isError && items.length\
    \ === 0;\n...\n{isError ? (\n  <QueueErrorBanner onRetry={() => void queueQuery.refetch()} />\n) :\
    \ isEmpty ? (\n  <EmptyQueue />"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/queue-keeps-the-answered-order
  conforms: true
  how: "src/features/curation/components/QueueList.tsx: held at The virtualized render loop in QueueList\
    \ (lines 90-136). It walks the virtual items and reads `items[v.index]` at each position, so the rows\
    \ keep the order of the `items` prop. — const virtualItems = virtualizer.getVirtualItems();\n...\n\
    {virtualItems.map((v) => {\n          const item = items[v.index];\n...\ntransform: `translateY(${v.start}px)`\n\
    The file applies no sort, filter, reverse or regrouping to `items`.\nsrc/features/curation/hooks/useCurationQueue.ts:\
    \ held at the return of the queryFn, line 23. This file applies no sort, filter or reorder to the\
    \ answer. toReviewQueueList in api/_transforms.ts maps items with `wire.items.map(toReviewQueueItem)`,\
    \ which keeps the order. — return toReviewQueueList(wire);"
  encoded_at:
  - src/features/curation/components/QueueList.tsx
  - src/features/curation/hooks/useCurationQueue.ts
- node: rules/curation-workspace/queue-kind-is-sent-only-when-chosen
  conforms: true
  how: 'src/features/curation/hooks/useCurationQueue.ts: held at the guard on the kind parameter in the
    queryFn, line 16. — if (kind !== undefined) qs.set("kind", kind);'
  encoded_at:
  - src/features/curation/hooks/useCurationQueue.ts
- node: rules/curation-workspace/read-without-an-identifier-is-not-requested
  conforms: true
  how: "src/features/curation/api/node.hooks.ts: held at The `enabled` guard in useCurationNodeDetail()\
    \ (line 42), useLinkHistory() (line 61) and useAttributeHistory() (line 80), each passed to useQuery.\
    \ The accepted-fragments half of the node is not in this file and is nowhere here. — const enabled\
    \ = typeof nodeId === \"string\" && nodeId.length > 0;\nconst enabled = typeof linkId === \"string\"\
    \ && linkId.length > 0;\nconst enabled = typeof attributeId === \"string\" && attributeId.length >\
    \ 0;\nsrc/features/curation/api/provenance.hooks.ts: held at the `enabled` expressions of useProvenanceByLink,\
    \ useProvenanceByAttribute and useProvenanceByFragment (lines 22, 41, 60), and of useListAcceptedFragments\
    \ (lines 97-100) — const enabled = typeof linkId === \"string\" && linkId.length > 0;\n...\nconst\
    \ enabled =\n    (typeof params.llmRunId === \"string\" && params.llmRunId.length > 0) ||\n    (typeof\
    \ params.rawInformationId === \"string\" &&\n      params.rawInformationId.length > 0);"
  encoded_at:
  - src/features/curation/api/node.hooks.ts
  - src/features/curation/api/provenance.hooks.ts
- node: rules/curation-workspace/reading-the-answer-body-has-no-cutoff
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at clearTimeout(timer) immediately after the fetch
    resolves, line 127. — clearTimeout(timer);


    if (response.status === 401 && __retried !== true) {

    The timer is cleared before the body is read, in both the 2xx branch (`response.json()`) and the error
    branch, so reading the body is never cut off.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/reason-is-sent-as-typed-and-empty-as-null
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at every decision payload
    built in dispatch() — reason: reason || null,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/reason-required-refusal-shows-under-the-reason
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the useEffect that forwards\
    \ the message to ReasonField (lines 73-78). The code is left out of the panel alert (line 199). The\
    \ focusing is ReasonField's own and is outside this file. — if (serverError.code === \"BUSINESS_REASON_REQUIRED\"\
    ) {\n    reasonRef.current?.setServerError(serverError.message);\n  }\nsrc/features/curation/components/DecisionPanel/ReasonField.tsx:\
    \ held at setServerError() in the useImperativeHandle block (lines 48-54), together with the error\
    \ paragraph rendered under the Textarea (lines 85-89). It stores the server's message, focuses the\
    \ field, and the message shows beneath it. — setServerError(message) {\n  setError(message);\n  if\
    \ (message !== null) {\n    const el = document.getElementById(id) as HTMLTextAreaElement | null;\n\
    \    el?.focus();\n  }\n},\n...\n{error && (\n  <p id={errorId} role=\"alert\" className=\"text-xs\
    \ text-destructive\">"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
- node: rules/curation-workspace/refused-destructive-decision-restores-its-item
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at commit() catch block — if (\n  isDestructive\
    \ &&\n  isEnvelopeError(err) &&\n  !VANISHED_CODES.has(err.code) &&\n  optimisticId !== null\n) {\n\
    \  onItemRestore(optimisticId);\n}"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/rejecting-five-or-more-asks-first
  conforms: true
  how: "src/features/curation/components/BatchBar/BatchBar.tsx: held at BATCH_REJECT_CONFIRM_THRESHOLD\
    \ (line 20) and handleRejectClick (lines 44-50) — export const BATCH_REJECT_CONFIRM_THRESHOLD = 5;\n\
    if (count >= BATCH_REJECT_CONFIRM_THRESHOLD) {\n  setPendingReject(true);\n  return;\n}\nonReject?.();"
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/resent-curation-request-never-refreshes-again
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at The __retried flag and the recursive call in httpCuration(),
    lines 89, 129 and 139-143. — const { signal: userSignal, __retried, ...init } = opts;

    if (response.status === 401 && __retried !== true) {

    return httpCuration<T>(path, { ...opts, headers: ..., __retried: true });

    The resent call skips the 401 branch, so it starts no second refresh. It enters httpCuration() again
    and creates its own 30-second timer.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/reset-restores-the-starting-values
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at reset and makeInitialState, lines 34-49\
    \ and 88-90 — reset: () => {\n  set(makeInitialState());\n},\nwith makeInitialState returning selectedItem:\
    \ null, evidenceViewed: false, sessionResolved: 0, lastSeenTotal: null, selectedItems: new Set<string>()"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/resolved-count-starts-at-zero
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at makeInitialState() (sessionResolved), line
    45 — sessionResolved: 0,'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/save-is-disabled-without-a-stated-fragment
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the disabled prop\
    \ of the submit Button, lines 162-165 — disabled={\n            validFromSource === \"stated\" &&\n\
    \            (watch(\"validFromFragmentId\") ?? \"\").length === 0\n          }"
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/select-by-number-picks-the-nth-loaded-item
  conforms: true
  how: 'src/features/curation/components/CurationPage.tsx: held at The onSelectIndex handler, lines 103-106.
    Its null branch leaves the selection. The 1-to-9 range and the Nth-item pick sit in selectByIndex
    in curation-page-helpers.ts. — const picked = selectByIndex(data, n);

    if (picked !== null) handleSelect(picked);

    src/features/curation/components/curation-page-helpers.ts: held at selectByIndex(), lines 67-76 —
    if (oneBasedIndex < 1 || oneBasedIndex > 9) return null;

    const target = list.items[oneBasedIndex - 1];

    if (target === undefined) return null;'
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/selected-item-is-carried-in-the-address
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at Lines 29-33 read the address's item\
    \ through parseItemSearchParam. Lines 66-70 write it through stringifyItemSearchParam. The item=kind:id\
    \ format is declared in state/curation-store.ts, which this file only calls. — const deepLink = useMemo(\n\
    \    () => parseItemSearchParam(search.item),\n    [search.item],\n  );\n...\nconst next = stringifyItemSearchParam(item);\n\
    src/features/curation/state/curation-store.ts: held at stringifyItemSearchParam and parseItemSearchParam,\
    \ lines 93-108 — return `${item.kind}:${item.id}`;"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/selecting-a-candidate-makes-it-the-merge-target
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/CandidateCard.tsx: held at The onClick handler
    of the button (line 33). It reports the chosen candidate''s id to the parent through onSelect. The
    merge-target state itself is not declared in this file. — onClick={() => onSelect(candidate.candidateNodeId)}

    src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the onSelectCandidate setter
    passed to ComparePane (line 220), read as the merge target in dispatch (line 89) — onSelectCandidate={setSelectedCandidate}
    ... target_node_id: selectedCandidate,'
  encoded_at:
  - src/features/curation/components/DecisionPanel/CandidateCard.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/selecting-another-item-clears-the-evidence-mark
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at setSelectedItem, lines 54-64, and the initial
    evidenceViewed, line 44 — if (same) return {};

    return { selectedItem: item, evidenceViewed: false };

    evidenceViewed: false,'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/selecting-the-same-item-changes-nothing
  conforms: true
  how: "src/features/curation/state/curation-store.ts: held at the same branch of setSelectedItem, lines\
    \ 56-61 — const same =\n  state.selectedItem !== null &&\n  item !== null &&\n  state.selectedItem.kind\
    \ === item.kind &&\n  state.selectedItem.id === item.id;\nif (same) return {};"
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/selecting-writes-the-item-to-the-address
  conforms: true
  how: "src/features/curation/components/CurationPage.tsx: held at The handleSelect navigate call, lines\
    \ 64-72. — void navigate({\n    to: \"/curation\",\n    search: next !== undefined ? { item: next\
    \ } : {},\n    replace: true,\n  });"
  encoded_at:
  - src/features/curation/components/CurationPage.tsx
- node: rules/curation-workspace/selection-matches-a-dispute-by-any-side
  conforms: true
  how: 'src/features/curation/components/curation-page-helpers.ts: held at findItemInQueue() line 13 and
    indexOfSelected() line 40 — const matches = item.sides.some((s) => s.itemId === target.id);

    if (item.sides.some((s) => s.itemId === selected.id)) return i;'
  encoded_at:
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/self-merge-refusal-shows-the-fixed-text
  conforms: true
  how: "src/features/curation/components/DecisionPanel/CandidateCard.tsx: held at Only the \"mark the\
    \ selected candidate invalid\" half is here, in the optional invalid prop (line 9) and in its two\
    \ uses, aria-invalid (line 32) and the error border (line 41). The fixed refusal text is not in this\
    \ file. Substituting that text for the server's message is not this file's to hold. — readonly invalid?:\
    \ boolean;\n...\naria-invalid={invalid || undefined}\n...\ninvalid ? \"border-border-error\" : null,\n\
    src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the dedicated Alert (lines\
    \ 210-214) and invalidCandidateId (lines 67-71). The code is left out of the generic alert (line 200).\
    \ — {serverError?.code === \"BUSINESS_SELF_MERGE_FORBIDDEN\" && (\n  <Alert variant=\"destructive\"\
    \ role=\"alert\" className=\"mx-md\">\n    Não é possível fundir um nó com ele mesmo."
  encoded_at:
  - src/features/curation/components/DecisionPanel/CandidateCard.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/sending-a-decision-clears-the-previous-failure
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at Start of commit() — setServerError(null);

    setStale(false);

    setSubmitting(true);'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/server-refusal-lands-on-its-field
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at fieldForServerCode\
    \ (lines 19-32), the useEffect that calls setError (lines 77-83), and formLevelError (lines 89-92)\
    \ — case \"BUSINESS_TEMPORAL_INCOHERENT\":\n      return \"validTo\";\n...\nsetError(field, { type:\
    \ \"server\", message: serverError.message });\n...\nserverError?.code === \"BUSINESS_CORRECTION_NO_CHANGES\"\
    \n      ? \"Nenhuma alteração detectada. Modifique pelo menos um campo.\"\nThe code-to-field mapping\
    \ and the fixed message agree with the curation-screen contract's correct-item refusals."
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/session-state-is-not-persisted
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at the useCurationStore declaration, line
    51, a plain zustand store with no persistence middleware — export const useCurationStore = create<CurationState>((set)
    => ({'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at the key comparisons in mapKey (lines\
    \ 50-62) — if (key === \"j\") return \"next\";\nif (key === \"k\") return \"prev\";\nif (key === \"\
    x\") return \"toggleCheck\";\nif (key === \"e\") return \"evidence\";\nif (key === \"m\") return \"\
    merge\";\nif (key === \"s\") return \"keepSeparate\";\nif (key === \"c\") return \"confirm\";\nif\
    \ (key === \"r\") return \"reject\";\nif (key === \"u\") return \"undo\";\nif (key === \"?\") return\
    \ \"toggleHelp\";\nif (key.length === 1 && key >= \"1\" && key <= \"9\") {\n  return { kind: \"selectIndex\"\
    , n: Number(key) };"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/shortcut-letters-act-in-lower-case-only
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at the strict-equality comparisons against
    lower-case letters in mapKey (lines 50-58) — if (key === "j") return "next";

    if (key === "c") return "confirm";'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/shortcuts-listen-on-the-whole-window
  conforms: true
  how: 'src/features/curation/hooks/useCurationKeyboard.ts: held at the listener target selection in the
    effect (line 81) — const el: EventTarget = targetRef?.current ?? window;'
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/side-shows-its-validity-basis-and-confidence
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the caption span (lines
    69-73). Validity dates, the basis label and the confidence percentage are all rendered; a missing
    date shows as — through fmt. The wording of the labels is the unstated finding above. — Vigência:
    {fmt(side.validFrom)} – {fmt(side.validTo)} ·{" "}

    Fonte: {SOURCE_LABEL[side.validFromSource]} ·{" "}

    Confiança {(side.confidence * 100).toFixed(0)}%'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
  conforms: true
  how: 'src/features/curation/api/node.hooks.ts: held at STABLE_STALE_MS (line 20), applied as staleTime
    with refetchOnWindowFocus false in useCurationNodeDetail(), useLinkHistory() and useAttributeHistory().
    Provenance and accepted fragments are not read in this file. — const STABLE_STALE_MS = 5 * 60_000;

    staleTime: STABLE_STALE_MS,

    refetchOnWindowFocus: false,

    src/features/curation/api/provenance.hooks.ts: held at the STABLE_STALE_MS constant (line 17) and
    the `staleTime` and `refetchOnWindowFocus` options of the four hooks — const STABLE_STALE_MS = 5 *
    60_000;

    ...

    staleTime: STABLE_STALE_MS,

    refetchOnWindowFocus: false,'
  encoded_at:
  - src/features/curation/api/node.hooks.ts
  - src/features/curation/api/provenance.hooks.ts
- node: rules/curation-workspace/stale-banner-is-a-non-blocking-alert
  conforms: true
  how: "src/features/curation/components/StaleBanner/StaleBanner.tsx: held at the StaleBanner component\
    \ body, lines 14-36: a div with role=\"alert\" holding an onReload-driven Button, with no condition\
    \ on whether it renders — <div\n      role=\"alert\"\n...\n<Button type=\"button\" size=\"sm\" variant=\"\
    outline\" onClick={onReload}>"
  encoded_at:
  - src/features/curation/components/StaleBanner/StaleBanner.tsx
- node: rules/curation-workspace/stale-banner-says-the-item-changed
  conforms: true
  how: 'src/features/curation/components/StaleBanner/StaleBanner.tsx: held at DEFAULT_MESSAGE (line 12)
    and the message prop default (line 16) — const DEFAULT_MESSAGE = "Este item mudou desde que você o
    abriu.";

    ...

    message = DEFAULT_MESSAGE,'
  encoded_at:
  - src/features/curation/components/StaleBanner/StaleBanner.tsx
- node: rules/curation-workspace/stale-item-blocks-no-decision
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at DecisionBar receives\
    \ only evidenceViewed and submitting (lines 236-241). stale is not passed to it. — <DecisionBar\n\
    \    evidenceViewed={evidenceViewed}\n    submitting={submitting}\n    buttons={buttons}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
- node: rules/curation-workspace/stale-item-shows-the-notice-with-a-reload
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.tsx: held at the StaleBanner render\
    \ (line 175). The Recarregar text is the banner's own, in another file. — {stale && onRefetch && <StaleBanner\
    \ onReload={onRefetch} className=\"m-md\" />}\nsrc/features/curation/components/DecisionPanel/StaleBanner.tsx:\
    \ held at The StaleBanner component's JSX (lines 11-27): the Alert's `action` prop renders the Recarregar\
    \ button wired to the `onReload` prop, and the Alert body carries the stale notice. — <Button type=\"\
    button\" size=\"sm\" variant=\"outline\" onClick={onReload}>\n  <RefreshCw aria-hidden=\"true\" className=\"\
    size-4\" />\n  Recarregar\n</Button>\n...\nEste item mudou desde que você o abriu.\nsrc/features/curation/components/StaleBanner/StaleBanner.tsx:\
    \ held at the Button in StaleBanner (lines 31-33), labelled Recarregar and wired to the onReload prop\
    \ — <Button type=\"button\" size=\"sm\" variant=\"outline\" onClick={onReload}>\n        Recarregar\n\
    \      </Button>"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/components/DecisionPanel/StaleBanner.tsx
  - src/features/curation/components/StaleBanner/StaleBanner.tsx
- node: rules/curation-workspace/staleness-is-never-detected-by-the-panel
  conforms: true
  how: "src/features/curation/components/DecisionPanel/DecisionPanel.types.ts: held at the stale and onRefetch\
    \ members of DecisionPanelProps, lines 29-30 — readonly stale?: boolean;\n  readonly onRefetch?: ()\
    \ => void;"
  encoded_at:
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
- node: rules/curation-workspace/stated-basis-lists-the-accepted-fragments
  conforms: true
  how: "src/features/curation/components/CorrectionForm/DateJustification.tsx: held at the fragmentParams\
    \ construction (lines 51-59), the useListAcceptedFragments call (line 60), and the picker block (lines\
    \ 98-125) — if (validFromSource === \"stated\" && hasFilter) { ... fragmentParams.llmRunId = fragmentFilter.llmRunId;\
    \ ... }\n  const fragmentQ = useListAcceptedFragments(fragmentParams);"
  encoded_at:
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
- node: rules/curation-workspace/stated-basis-needs-a-fragment
  conforms: true
  how: "src/features/curation/components/CorrectionForm/correction-schema.ts: held at the last check of\
    \ the correctionSchema superRefine, lines 70-79. It requires the fragment only under stated. — data.validFromSource\
    \ === \"stated\" &&\n    data.validFromFragmentId === null\n... message: \"Selecione o fragmento que\
    \ justifica a data.\","
  encoded_at:
  - src/features/curation/components/CorrectionForm/correction-schema.ts
- node: rules/curation-workspace/submitting-batch-shows-busy-buttons
  conforms: true
  how: 'src/features/curation/components/BatchBar/BatchBar.tsx: held at the `loading={submitting}` prop
    on the Confirmar button of the inline confirmation (line 80) and on the three action buttons (lines
    115, 128 and 141). The Cancelar button and the clear button carry no `loading` prop. — <Button type="button"
    size="sm" variant="destructive" loading={submitting} onClick={handleConfirmReject}>

    <Button type="button" size="sm" variant="outline" onClick={handleCancelReject}>'
  encoded_at:
  - src/features/curation/components/BatchBar/BatchBar.tsx
- node: rules/curation-workspace/successful-action-refreshes-the-queue-and-the-metrics
  conforms: true
  how: 'src/features/curation/api/curation.hooks.ts: held at invalidateCurationAndAffected(), called only
    from the onSuccess of each mutation hook. No onError or onSettled handler exists, so a failed action
    refreshes nothing. — void queryClient.invalidateQueries({ queryKey: curationKeys.all });'
  encoded_at:
  - src/features/curation/api/curation.hooks.ts
- node: rules/curation-workspace/tabs-choose-the-queue-kind
  conforms: true
  how: "src/features/curation/components/QueueTabs.tsx: held at the TABS array (lines 20-24) with keyToFilter,\
    \ and the onValueChange wiring at line 40 — { id: undefined, label: \"Tudo\", key: ALL_SENTINEL },\n\
    \  { id: \"entity_match\", label: \"Entidades\", key: \"entity_match\" },\n  { id: \"disputed\", label:\
    \ \"Disputas\", key: \"disputed\" },\nand onValueChange={(next) => onChange(keyToFilter(next))}. The\
    \ filter is undefined for Tudo (both queues), entity_match for Entidades and disputed for Disputas.\
    \ The file only emits the chosen filter. Which queue is then read is decided by whatever consumes\
    \ onChange, in another file."
  encoded_at:
  - src/features/curation/components/QueueTabs.tsx
- node: rules/curation-workspace/trail-keeps-the-answered-order
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the nested maps
    over the answer''s fragments and their chunks, with no sorting — {fragments.map((frag) => ( <article
    key={frag.id} ...> ... {frag.chunks.map((chunk) => ('
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/trail-reads-by-link-or-by-attribute
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the two provenance
    hook calls and the choice of the active query — const linkQ = useProvenanceByLink(itemKind === "link"
    ? itemId : undefined);

    const attrQ = useProvenanceByAttribute(itemKind === "attribute" ? itemId : undefined);

    const active = itemKind === "link" ? linkQ : attrQ;'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/trail-signals-that-the-evidence-was-viewed-once
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the useEffect holding
    the focusin listener and the IntersectionObserver — const IO_THRESHOLD = 0.25;  el.addEventListener("focusin",
    onFocus);  if (typeof IntersectionObserver !== "undefined") { observer = new IntersectionObserver(...,
    { threshold: IO_THRESHOLD }); observer.observe(el); }  with the sentinel region carrying tabIndex={0}'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/typing-clears-the-reason-error
  conforms: true
  how: "src/features/curation/components/DecisionPanel/ReasonField.tsx: held at the onChange handler of\
    \ the Textarea (lines 72-75). It forwards the new value and clears the error when one is showing.\
    \ — onChange={(e) => {\n  onChange(e.currentTarget.value);\n  if (error) setError(null);\n}}"
  encoded_at:
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
- node: rules/curation-workspace/undo-keeps-the-selection-and-the-count
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at cancelPending() calls only onItemRestore
    and never advance, setSelectedItem or incrementResolved — clearTimeout(p.timeoutId);

    toast.dismiss(p.toastId);

    onItemRestore(p.optimisticId);

    pendingRef.current = null;'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/undo-restores-the-item-and-sends-nothing
  conforms: true
  how: 'src/features/curation/hooks/useDecisionDispatch.tsx: held at cancelPending() — clearTimeout(p.timeoutId);

    toast.dismiss(p.toastId);

    onItemRestore(p.optimisticId);

    pendingRef.current = null;'
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/undo-toast-counts-down-in-whole-seconds
  conforms: true
  how: 'src/features/curation/components/UndoToast/UndoToast.tsx: held at secondsRemaining() and its use
    in the UndoToast body, lines 16-18 and 33-49 — return Math.max(0, Math.ceil((deadlineMs - nowMs) /
    1000)); ... <span>{label}</span> ... {remaining}s'
  encoded_at:
  - src/features/curation/components/UndoToast/UndoToast.tsx
- node: rules/curation-workspace/undo-toast-only-reports-the-undo
  conforms: true
  how: 'src/features/curation/components/UndoToast/UndoToast.tsx: held at the Button onClick, line 55
    — onClick={onUndo}'
  encoded_at:
  - src/features/curation/components/UndoToast/UndoToast.tsx
- node: rules/curation-workspace/undo-window-is-five-seconds
  conforms: true
  how: "src/features/curation/components/UndoToast/UndoToast.tsx: held at the UNDO_WINDOW_MS constant,\
    \ line 13. The \"decision sent only when it ends\" half is not held in this file, which only receives\
    \ deadlineMs and onUndo. — export const UNDO_WINDOW_MS = 5_000;\nsrc/features/curation/hooks/useDecisionDispatch.tsx:\
    \ held at dispatchDestructive(): the window is UNDO_WINDOW_MS, a constant imported from ../components/UndoToast\
    \ and declared there as `export const UNDO_WINDOW_MS = 5_000;`. This file sends only when its setTimeout\
    \ of that length fires. — import { UndoToast, UNDO_WINDOW_MS } from \"../components/UndoToast\";\n\
    ...\nconst timeoutId = setTimeout(() => {\n  ...\n  void commit(snapshot.dispatch, snapshot.optimisticId,\
    \ true);\n}, UNDO_WINDOW_MS);"
  encoded_at:
  - src/features/curation/components/UndoToast/UndoToast.tsx
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/unknown-item-in-the-address-selects-the-first-item
  conforms: true
  how: 'src/features/curation/components/curation-page-helpers.ts: held at deriveInitialSelection(), lines
    78-93 — if (list === undefined || list.items.length === 0) return null;

    const found = findItemInQueue(list, deepLink);

    if (found !== null) return deepLink;

    const first = list.items[0];'
  encoded_at:
  - src/features/curation/components/curation-page-helpers.ts
- node: rules/curation-workspace/unlabelled-source-type-shows-as-it-is
  conforms: true
  how: "src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at formatSourceType()\
    \ — function formatSourceType(t: string): string {\n  return SOURCE_TYPE_LABELS[t] ?? t;\n}"
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/unmapped-refusal-shows-nothing-on-the-form
  conforms: true
  how: "src/features/curation/components/CorrectionForm/CorrectionForm.tsx: held at the default branch\
    \ of fieldForServerCode, line 29, which the useEffect guards with `if (field)` — default:\n      return\
    \ null;\n...\nif (field) {\n      setError(field, { type: \"server\", message: serverError.message\
    \ });\n    }\nOnly BUSINESS_CORRECTION_NO_CHANGES sets formLevelError; any other code leaves the form\
    \ unchanged."
  encoded_at:
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
- node: rules/curation-workspace/unreadable-item-link-selects-nothing
  conforms: true
  how: 'src/features/curation/state/curation-store.ts: held at parseItemSearchParam guards, lines 94-99
    — if (typeof raw !== "string" || raw.length === 0) return null;

    if (colon < 1 || colon >= raw.length - 1) return null;

    if (kind !== "entity_match" && kind !== "disputed") return null;'
  encoded_at:
  - src/features/curation/state/curation-store.ts
- node: rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in
  conforms: true
  how: 'src/features/curation/api/_request.ts: held at the catch of trySilentRefresh(), lines 77-82. —
    useAuthStore.getState().clear();

    redirectImpl("/sign-in?reason=session_expired");

    return false;

    The stored token is cleared and the address is replaced through window.location.replace in redirectImpl.'
  encoded_at:
  - src/features/curation/api/_request.ts
- node: rules/curation-workspace/unwired-shortcut-does-nothing
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at the undefined-callback guards in onKeyDown\
    \ (lines 91-95 and the switch cases), where preventDefault sits inside the guard — if (cb.onNext !==\
    \ undefined) {\n  event.preventDefault();\n  cb.onNext();\n}\nreturn;"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
- node: rules/curation-workspace/value-side-is-named-by-its-value
  conforms: true
  how: 'src/features/curation/components/DecisionPanel/DisputeSideCard.tsx: held at the non-link branch
    of the label expression (line 41) — : (side.value ?? "—");'
  encoded_at:
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
- node: rules/curation-workspace/vanished-item-is-not-restored
  conforms: true
  how: "src/features/curation/hooks/useDecisionDispatch.tsx: held at handleError() VANISHED_CODES branch,\
    \ plus the commit() catch guard that skips the restore for those codes — if (VANISHED_CODES.has(code))\
    \ {\n  if (optimisticId !== null) {\n    onItemRemove(optimisticId);\n  }\n  toast.warning(vanishedToastMessage(code));\n\
    \  setStale(code === \"BUSINESS_REVIEW_NOT_PENDING\" ||\n    code === \"BUSINESS_ITEM_NOT_DISPUTED\"\
    );"
  encoded_at:
  - src/features/curation/hooks/useDecisionDispatch.tsx
- node: rules/curation-workspace/viewed-signal-fires-once-per-mount
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at firedRef, a ref
    that is never reset and is checked in both the effect guard and fire() — const firedRef = useRef(false);  if
    (!dataReady || firedRef.current) return;  function fire(): void { if (firedRef.current) return; firedRef.current
    = true; onEvidenceViewed(); }'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/viewed-signal-may-fire-on-an-empty-trail
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the empty-fragments
    branch, which attaches the sentinel ref to a focusable region — if (fragments.length === 0) { return
    ( <GlassSurface level="ambient" role="region" ref={sentinelRef} aria-label="Sem proveniência" tabIndex={0}
    ...'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/viewed-signal-never-fires-on-a-failed-trail
  conforms: true
  how: 'src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx: held at the dataReady gate
    on the effect, and the loading, compliance-deleted and error branches, which never attach sentinelRef
    — const dataReady = !isPending && !isError && data !== undefined;  if (!dataReady || firedRef.current)
    return;  with rawDeleted tested on `error.code === "BUSINESS_RAW_INFORMATION_DELETED"`'
  encoded_at:
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
- node: rules/curation-workspace/wired-shortcuts-stop-the-default-except-help
  conforms: true
  how: "src/features/curation/hooks/useCurationKeyboard.ts: held at the switch cases in onKeyDown (lines\
    \ 98-158); every wired case calls preventDefault and the toggleHelp case does not — case \"toggleHelp\"\
    :\n  if (cb.onToggleHelp !== undefined) {\n    cb.onToggleHelp();\n  }\n  return;"
  encoded_at:
  - src/features/curation/hooks/useCurationKeyboard.ts
unstated:
- file: src/features/curation/api/_transforms.ts
  where: toProvenanceRawInformation (metadata), toProvenanceChunk (locator) and toAttributeDetail (flags)
  evidence: 'metadata: wire.metadata ?? {},

    locator: wire.locator ?? {},

    flags: wire.flags ?? [],'
  cost: The code decides that an absent metadata or locator is read as an empty object and that absent
    flags are read as an empty list. The node says only that these fields are optional. The empty-value
    default is a rule in code that no node states, so the next reader cannot learn it from the specification.
- file: src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  where: the reason Textarea inside the Controller for "reason", line 138
  evidence: placeholder="Explique brevemente por que a correção é necessária."
  cost: The form tells the owner this guidance sentence, and it is emitted text. A search of the specification
    root finds no node holding it. The curation-screen contract lists the other correction-form messages
    but not this one. If the wording changes, nobody reading the specification will know it was ever decided.
- file: src/features/curation/components/CurationPage.tsx
  where: The mount effect at lines 50-54, together with deriveInitialSelection in curation-page-helpers.ts.
  evidence: "useEffect(() => {\n    if (isPending || data === undefined) return;\n    const initial =\
    \ deriveInitialSelection(data, deepLink);\n    setSelectedItem(initial);\n  }, [isPending, data, deepLink,\
    \ kindFilter, setSelectedItem]);\nand, in curation-page-helpers.ts, deriveInitialSelection returns\
    \ the address's item when it is in the queue, otherwise the first entry of the queue. It never returns\
    \ the item already in the store."
  cost: 'The screen picks an item by itself: the address''s item if it is in the queue, otherwise the
    first entry. It does this again whenever the loaded queue or the tab changes. No node states this
    selection rule. The next reader will look for it in the specification and will not find it there.
    It also decides when the idle panel can appear: with entries loaded, the idle state of the contract''s
    "Nothing is selected or the selection is not in the loaded queue" never shows, because the first entry
    is selected instead.'
- file: src/features/curation/components/CurationPage.tsx
  where: 'The text the page emits at lines 128, 139 and 179: the region aria-label values and the heading.'
  evidence: 'aria-label="Fila de curadoria"

    <h2 className="text-lg font-semibold tracking-tight text-foreground">Curadoria</h2>

    aria-label="Painel de decisão"'
  cost: 'This is text the screen tells the owner and assistive technology: the two region names and the
    page heading. No node holds it. The screen contract holds only the idle line "Selecione um item da
    fila para começar.", the tab names and the drawer title "Curadoria". A later change to the wording
    will not be seen as a change to a specified fact.'
- file: src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  where: the GlassSurface branch and the plain-section branch at the end of the component (lines 262-281)
  evidence: aria-label="Painel de decisão"
  cost: 'The panel''s accessible name is announced to screen-reader users, and it lives only in this file.
    No node holds "Painel de decisão": the contract''s read-decision-panel operation lists the panel''s
    labels, hints and messages and does not list it. A change to the name would be made here, and the
    next reader looks in the specification and finds nothing.'
- file: src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
  where: the function itemKindOf, lines 43-48
  evidence: "export function itemKindOf(item: ReviewQueueItem): ItemKind {\n  if (item.kind === \"entity_match\"\
    ) {\n    return \"link\";\n  }\n  return item.itemKind;\n}"
  cost: The rule that an entity match is treated as a link when an item kind is needed lives only in this
    function. No node holds it. The closest node says only that an item kind of link selects the link
    reads. The next reader will look in the specification for what kind an entity match carries and will
    not find it. Any change to that mapping would be made here, with no node to decide it.
- file: src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  where: SOURCE_LABEL (lines 14-20) and the caption line of the returned button (lines 69-73)
  evidence: "const SOURCE_LABEL: Readonly<\n  Record<DisputedItemSide[\"validFromSource\"], string>\n\
    > = Object.freeze({\n  stated: \"Declarada\",\n  document: \"Doc.\",\n  received: \"Receb.\",\n});\n\
    ...\nVigência: {fmt(side.validFrom)} – {fmt(side.validTo)} ·{\" \"}\nFonte: {SOURCE_LABEL[side.validFromSource]}\
    \ ·{\" \"}\nConfiança {(side.confidence * 100).toFixed(0)}%"
  cost: The node requires "the label of its valid-from basis" but gives no wording. The abbreviations
    "Doc." and "Receb." and the captions "Vigência:", "Fonte:" and "Confiança" are shown to the curator,
    and no node holds them. A grep of the specification, outside the projection, finds none of them. The
    only nearby wording is in contracts/curation-workspace/curation-screen, which names the date-justification
    bases "Declarada no fragmento", "Data do documento" and "Data de recebimento". That wording is for
    a different surface and differs from this card's. The next reader looking for what a dispute side
    calls its basis will not find it in the specification, and the two surfaces can drift apart without
    anything noticing.
- file: src/features/curation/components/QueueTabs.tsx
  where: line 43, the aria-label on TabsList
  evidence: <TabsList aria-label="Filtrar fila por tipo">
  cost: The accessible name read to screen-reader users is text the running system emits, and no node
    holds it. The tab labels Tudo, Entidades and Disputas are held by the show-queue answer in contracts/curation-workspace/curation-screen,
    which does not mention this name. A reader looking for what the tab group announces will not find
    it in the specification, and the wording can change without any node moving.
- file: src/features/curation/components/UndoToast/UndoToast.tsx
  where: line 56, the aria-label of the Button that carries onUndo
  evidence: aria-label="Desfazer ação"
  cost: The button's accessible name is "Desfazer ação", while the specification says the toast "offers
    Desfazer". The announced wording is a string the specification does not hold. A screen-reader user
    hears text that a reader of the specification will not find. The visible label "Desfazer" is held;
    only this aria-label is not.
unbound:
- src/features/curation/components/curation-page-parts.tsx
notes: "Judged by 37 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/restates-fe-curation.returns/.\nA finding in src/features/curation/api/_transforms.ts\
  \ names contracts/curation-workspace/bff-curation-reads, which no file of this set is bound to: toNodeSummary,\
  \ toNodeAlias, toAttributeDetail, toNodeDetail, toLinkDetail, toLinkHistoryResponse, toAttributeHistoryResponse,\
  \ toProvenanceRawInformation, toProvenanceChunk, toProvenanceFragment, toProvenanceResponse, toAcceptedFragmentSourceRef,\
  \ toAcceptedFragmentItem, toAcceptedFragmentList, and OkEnvelope/unwrapOk (lines 46-53 and 153-312):\
  \ export function unwrapOk<T>(env: OkEnvelope<T>): T {\n  return env.result;\n}\n...\nlinkInverseName:\
  \ wire.link_inverse_name,\n...\ndocumentTitle: wire.document_title ?? null, — About half of this file\
  \ reads the node, history, provenance and accepted-fragment answers, and none of the nodes bound to\
  \ it holds those fields. They are held by contracts/curation-workspace/bff-curation-reads, which the\
  \ candidate index does not bind to this file. When that node changes, `--check` does not reach this\
  \ file. The next reader of this file looks for these shapes in bff-curation and finds nothing.. It blocks\
  \ nothing here; it is owed a route of its own.\nA finding in src/features/curation/api/provenance.hooks.ts\
  \ names rules/knowledge-base/page-defaults, which no file of this set is bound to: useListAcceptedFragments,\
  \ the queryKey object (lines 108-109): limit: params.limit ?? 20,\n        offset: params.offset ??\
  \ 0, — The server's page defaults (20 items, offset 0) are held by rules/knowledge-base/page-defaults,\
  \ and this file applies them a second time to build the cache key. If the node's default moves, this\
  \ file is not bound to that node, so the check never reaches it. The key would then treat an omitted\
  \ limit as 20 while the server returns another size.. It blocks nothing here; it is owed a route of\
  \ its own.\nA finding in src/features/curation/types.ts names domain/knowledge-base/effective-status,\
  \ which no file of this set is bound to: the EffectiveStatus type, lines 13-18: export type EffectiveStatus\
  \ =\n  | \"active\"\n  | \"uncertain\"\n  | \"disputed\"\n  | \"superseded\"\n  | \"deleted\"; — The\
  \ node holds six values, among them `inactive`, which is how an ended assertion reads without ever being\
  \ stored. This file declares five. Typing `effective_status` in AttributeDetailWire and LinkDetailWire\
  \ as this union says an ended assertion can never arrive as `inactive`. The next reader will take that\
  \ vocabulary as the decided one, and no bind reaches the file when the node moves.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in src/features/curation/types.ts names domain/knowledge-base/review-queue-kind,\
  \ which no file of this set is bound to: the ReviewQueueKind type, line 1: export type ReviewQueueKind\
  \ = \"entity_match\" | \"disputed\"; — The two review queues are an enumeration a node holds. Here it\
  \ is declared a second time in a file the node is not bound to, so a change to the node does not reach\
  \ this file and the two can drift without anyone knowing which was decided.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in src/features/curation/types.ts names domain/knowledge-base/assertion-kind,\
  \ which no file of this set is bound to: the ItemKind type, line 2: export type ItemKind = \"link\"\
  \ | \"attribute\"; — The two assertion kinds a curation request names are held by a node. They are declared\
  \ here again in a file the node is not bound to, so a change to the node does not reach this file..\
  \ It blocks nothing here; it is owed a route of its own.\nA finding in src/features/curation/types.ts\
  \ names domain/knowledge-base/corrected-values, which no file of this set is bound to: the CorrectedValues\
  \ interface, lines 231-238: export interface CorrectedValues {\n  readonly value?: string | null;\n\
  \  readonly target_node_id?: string | null;\n  readonly valid_from?: string | null;\n  readonly valid_to?:\
  \ string | null;\n  readonly valid_from_source?: ValidFromSource;\n  readonly valid_from_fragment_id?:\
  \ string | null;\n} — The shape of the values a correction puts in place of an assertion's is declared\
  \ here, and the node that holds it is not bound to this file. If the node gains or loses a value, nothing\
  \ reaches this file.. It blocks nothing here; it is owed a route of its own.\nA finding in src/features/curation/types.ts\
  \ names domain/knowledge-base/merge-counts, which no file of this set is bound to: the ResolveEntityMatchAffected\
  \ interface, lines 154-159, and its reuse in MergeNodesResponse as Required<ResolveEntityMatchAffected>:\
  \ export interface ResolveEntityMatchAffected {\n  readonly links_repointed?: number;\n  readonly attributes_repointed?:\
  \ number;\n  readonly aliases_copied?: number;\n  readonly path_compressed_nodes?: number;\n} — The\
  \ four counts of a merge's reach are held by a node and declared here again, in a file the node is not\
  \ bound to. The node's four counts are required, and this file makes them optional in the entity-match\
  \ answer. A change to the node does not reach this file.. It blocks nothing here; it is owed a route\
  \ of its own.\nA finding in src/features/curation/types.ts names contracts/curation-workspace/bff-curation-reads,\
  \ which no file of this set is bound to: the evidence and history read shapes, lines 254-495: Provenance*Wire,\
  \ AcceptedFragment*Wire, NodeSummaryWire, NodeAliasWire, AttributeDetailWire, NodeDetailWire, LinkDetailWire\
  \ and the history responses: export interface AcceptedFragmentItemWire {\n  readonly fragment_id: string;\n\
  \  readonly text: string;\n  readonly confidence: number;\n  readonly llm_run_id: string;\n  readonly\
  \ created_at: string;\n  readonly source: AcceptedFragmentSourceRefWire;\n} — What each read of the\
  \ knowledge base answers is held by a consumed contract that the trace does not bind to this file. These\
  \ fields are declared here as their own authority, so when the contract moves, `--check` does not reach\
  \ this file.. It blocks nothing here; it is owed a route of its own.\nCandidates: 29 opened across 16\
  \ of 37 delegation(s); each return lists its own under `candidates_opened`.\nUnstated: 9 fact(s) the\
  \ source states that no node holds, over 8 file(s), listed under `unstated`. They block no binding here\
  \ and no rebind closes them — the route is the analysis that gives each fact a node."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/restates-fe-curation.returns/`, which are the evidence behind every entry above.
