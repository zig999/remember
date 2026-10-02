---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/curation/components/DecisionPanel/CandidateCard.tsx
  - src/features/curation/components/DecisionPanel/ComparePane.tsx
  - src/features/curation/components/DecisionPanel/CorrectionSection.tsx
  - src/features/curation/components/DecisionPanel/DecisionBar.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts
  - src/features/curation/components/DecisionPanel/DecisionPanel.tsx
  - src/features/curation/components/DecisionPanel/DecisionPanel.types.ts
  - src/features/curation/components/DecisionPanel/DisputeSideCard.tsx
  - src/features/curation/components/DecisionPanel/EvidenceChip.tsx
  - src/features/curation/components/DecisionPanel/PeriodTimeline.tsx
  - src/features/curation/components/DecisionPanel/ReasonField.tsx
  - src/features/curation/components/DecisionPanel/StaleBanner.tsx
  - src/features/curation/components/DecisionPanel/index.ts
read_outside_area:
  - "src/features/curation/lib/display-mode.ts - opened to learn how ComparePane picks between the summary and full-diff presentations and where the high-similarity threshold it prints comes from"
  - "src/features/curation/types.ts - opened to read the queue item, side, request and enumeration shapes the panel consumes and composes"
  - "src/features/curation/api/node.hooks.ts - opened to learn which read useCurationNodeDetail performs when the panel resolves a subject or target node name"
---

## Facts
### Decision panel - which decisions each kind of item offers
- An entity-match review item offers exactly two decisions: merge into a candidate (`merge_into`) and keep separate (`keep_separate`). `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`buttons`, `item.kind === "entity_match"` branch).
- A disputed item offers exactly two decisions: prefer one side (`prefer_one`) and keep disputed (`keep_disputed`). The panel has no control that adjusts periods. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`buttons`, disputed branch).
- Merge into a candidate and prefer one side are marked as destructive decisions. Keep separate and keep disputed are not. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`destructive: true`).
- A correction ("Corrigir…") is offered only for a disputed item. It is never offered for an entity-match review item. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`canCorrect = item.kind === "disputed"`).
- The panel never takes confirm, reject or adjust-periods decisions. `dispatch` accepts those names, but they have no branch and no button, and the parent's confirm and reject callbacks are never called. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`dispatch`), `src/features/curation/components/DecisionPanel/DecisionPanel.types.ts` (`DecisionPanelActions.onConfirm`, `onReject`).

### Decision panel - the evidence gate
- Every decision button stays visible but blocked until the caller reports that the evidence was viewed. A click on a blocked button is suppressed and no decision is sent. `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`gated`, `aria-disabled={!evidenceViewed}`).
- The gate covers the non-destructive decisions too (keep separate, keep disputed), not only the destructive ones. `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`gated` applied to every button).
- The "Corrigir…" button is blocked by the same evidence gate. A blocked click does not open the correction form. `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`onClickCapture`, `aria-disabled`).
- A blocked button carries the hint "Veja a evidência antes de decidir." `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`blockedHintId` span), `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`aria-describedby`).
- Whether the evidence was viewed is supplied by the caller. The panel does not decide it. `src/features/curation/components/DecisionPanel/DecisionPanel.types.ts` (`evidenceViewed`).
- The header's evidence indicator reads "Ver evidência" and pulses until the evidence is viewed. After that it reads "Evidência vista", and its accessible text is "Veja a evidência antes de decidir" / "Evidência vista.". `src/features/curation/components/DecisionPanel/EvidenceChip.tsx` (`EvidenceChip`).
- While a decision is being submitted, every decision button shows the in-flight state. `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`loading={submitting}`).

### Decision panel - order of checks per decision
- Merge into a candidate checks in this order: the evidence gate, then that a candidate is selected, then that the reason is not blank. Failing the first suppresses the click. Failing the second silently does nothing. Failing the third shows the reason error. `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`gated`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`dispatch`, `merge_into` branch).
- Prefer one side checks in this order: the evidence gate, then that a side is selected (silent no-op if not), then that the reason is not blank. `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`gated`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`dispatch`, `prefer_one` branch).
- Keep separate and keep disputed check only the evidence gate. They are sent with no selection and no reason check. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`dispatch`, `keep_separate` and `keep_disputed` branches).

### Decision panel - the reason
- One reason field serves every decision on the panel. It is always rendered and always marked required: the label "Motivo" carries " *", and the placeholder reads "Explique brevemente a decisão (obrigatório).". `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`reasonRequired = true`), `src/features/curation/components/DecisionPanel/ReasonField.tsx` (`Label`, `placeholder`).
- A reason is blank when nothing is left after trimming whitespace. A blank reason on a destructive decision shows "Informe um motivo para continuar." under the field and moves focus to it. `src/features/curation/components/DecisionPanel/ReasonField.tsx` (`validateOnSubmit`).
- Typing in the reason field clears any error it shows. `src/features/curation/components/DecisionPanel/ReasonField.tsx` (`onChange`).
- The reason is sent as typed, untrimmed. An empty reason is sent as `null`. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`reason: reason || null`).
- The panel sets no minimum or maximum length on the reason. `src/features/curation/components/DecisionPanel/ReasonField.tsx` (`Textarea`, no bound).

### Decision panel - what each decision sends
- Merge into a candidate sends `decision: "merge_into"`, `target_node_id` (the selected candidate's node id) and `reason`. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`onResolveEntityMatch`).
- Keep separate sends `decision: "keep_separate"` and `reason`, with no target. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`onResolveEntityMatch`).
- Prefer one side sends `item_kind`, `item_ids` (the item ids of every side, in the order the item lists them), `decision: "prefer_one"`, `winner_id` (the selected side's item id) and `reason`. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`onResolveDispute`).
- Keep disputed sends `item_kind`, `item_ids` (every side's item id), `decision: "keep_disputed"` and `reason`, with no winner. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`onResolveDispute`).
- A correction is sent through the caller's correct callback with the body the correction form produces. `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`onSubmit`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`onCorrect`).

### Decision panel - selection and reset
- Nothing is preselected. That holds even when a single high-similarity candidate is shown, so the owner must pick a candidate or a side before a destructive decision can go out. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`useState<string | null>(null)`).
- When the item changes, the selected candidate, the selected side and the reason are cleared. An entity-match item is identified by its node id. A disputed item is identified by the joined item ids of its sides. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`useEffect` reset).
- When the item changes, the correction section closes and starts fresh. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`key={correctionItemId}`), `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`useState(false)`).

### Decision panel - header
- An entity-match review item's header badge reads "Para revisar". A disputed item's badge reads "Disputado". `src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts` (`headerBadge`).
- An entity-match review item's header names the proposed node by its canonical name. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`headerSubject`).
- A disputed item's header names its subject node: the link's source node, or the node that holds the attribute. The name is resolved through the curation node-detail read. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`subjectId`, `useCurationNodeDetail`).
- Until the subject name is available, a disputed header shows the link type, else the attribute key, else "Item em disputa". `src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts` (`describeScope`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`headerSubject`).
- Once the subject name is available, a disputed header adds "· <link type or attribute key>" after it. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`headerRelation`).
- The header shows how long ago the item entered its queue, measured from the item's creation time. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`relative(now, item.createdAt)`).
  - Under 1 minute it reads "agora", under 60 minutes "há N min", under 24 hours "há N h" and under 30 days "há N d". From 30 days on it shows the date in pt-BR format. A future time reads "agora". `src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts` (`relative`).
  - The reference time is taken when the item changes. It does not advance while the item stays open. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`now = useMemo(..., [item])`).

### Decision panel - entity-match candidates
- Each candidate shows its canonical name and its similarity as a whole percentage ("N%", "Similaridade N de 100"). `src/features/curation/components/DecisionPanel/CandidateCard.tsx` (`CandidateCard`).
- Similarity is multiplied by 100 and rounded. A value below 0 shows as 0, and a value above 1 shows as 100. `src/features/curation/components/DecisionPanel/CandidateCard.tsx` (`clampPct`).
- Selecting a candidate makes it the merge target. `src/features/curation/components/DecisionPanel/CandidateCard.tsx` (`onSelect(candidate.candidateNodeId)`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`target_node_id: selectedCandidate`).
- In summary presentation with exactly one candidate, the panel shows that candidate alone with "Candidato com alta similaridade (≥ N%): podemos fundir diretamente.". N is the high-similarity threshold rounded as a percentage. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`EntityMatchView`, summary branch, `HIGH_SIMILARITY_THRESHOLD`).
- Otherwise the panel lists every candidate under "Múltiplos candidatos — escolha qual representa a mesma entidade.". `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`EntityMatchView`, full branch).
- With no candidates, the panel reads "Nenhum candidato sugerido. Você pode manter separados ou fundir ad-hoc por busca.". `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`item.candidates.length === 0`).
- With no candidates, "Fundir neste" is still offered, and choosing it does nothing because no candidate can be selected. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`buttons`, `if (!selectedCandidate) return`).
- How the panel picks summary or full presentation is decided outside this area (`resolveDisplayMode`). `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`resolveDisplayMode(item)`).

### Decision panel - dispute sides
- A link dispute explains itself as "Há N alvos conflitantes para o vínculo <link type>:", followed by "“<link type>” admite apenas um destino vigente por vez, e as vigências abaixo se sobrepõem. Escolha qual vale (os perdedores são arquivados) ou ajuste os períodos para que não se sobreponham.". `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`DisputeSubject`, link branch).
- An attribute dispute explains itself as "Há N valores conflitantes para <attribute key>:", followed by "Apenas um valor pode vigorar por vez no mesmo período. Escolha qual vale ou ajuste os períodos.". `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`DisputeSubject`, attribute branch).
- The dispute explanation reads the same in summary and full presentation. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`DisputeView`, `DisputeSubject` rendered unconditionally).
- The instruction line reads "Selecione qual lado prefere." in summary presentation and "Selecione qual lado prefere ou ajuste os períodos." in full presentation. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`DisputeView`).
- Every side is listed in both presentations. Selecting a side makes it the winner for prefer one side. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`item.sides.map`), `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`onSelect(side.itemId)`).
- A side with no value but a target node is read as a link side. It is named by the target node's canonical name, resolved through the curation node-detail read, with the target's node type in parentheses. `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`isLink`, `useCurationNodeDetail`, `targetType`).
  - While the target name loads, the side reads "Carregando…". If no name arrives, the side reads "nó <first 8 characters of the target node id>". `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`label`).
- Any other side is named by its value, or "—" when it has none. `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`label`).
- Every side shows "Vigência: <from> – <to> · Fonte: <valid-from basis label> · Confiança N%" and a disputed badge. `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`DisputeSideCard`).
  - Side dates are shown as pt-BR calendar dates in UTC. A missing date shows as "—". `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`fmt`).
  - Confidence is multiplied by 100 and shown with no decimals. `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`(side.confidence * 100).toFixed(0)`).

### Decision panel - period comparison
- Under the sides, the panel lists each side's period in words. Sides are lettered A, B, C… in the order the item lists them. `src/features/curation/components/DecisionPanel/PeriodTimeline.tsx` (`describeSide`, `String.fromCharCode(65 + i)`).
- A side with neither date reads "Lado X: sem datas registradas". A side with no end reads "Lado X: vigente de <from> em diante". A side with no start reads "Lado X: vigente até <to>". A side with both reads "Lado X: vigente de <from> a <to>". `src/features/curation/components/DecisionPanel/PeriodTimeline.tsx` (`describeSide`).
- Period dates are full pt-BR calendar dates in UTC, not years. `src/features/curation/components/DecisionPanel/PeriodTimeline.tsx` (`fmtDate`).
- The period list appears in both presentations of a dispute. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`<PeriodTimeline sides={item.sides} />`).

### Decision panel - correction
- A correction always targets the dispute's first side, whichever side the owner selected. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`correctionItemId = item.sides[0]?.itemId`).
- The correction form starts from the first side's values. `src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts` (`buildCorrectionDefaults`).
  - It starts with the side's value, target node, valid-from and valid-to as YYYY-MM-DD dates, the side's valid-from basis, and no supporting fragment. `src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts` (`buildCorrectionDefaults`).
  - A dispute with no sides starts the form with valid-from basis `document` and an empty item id. `src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts` (`buildCorrectionDefaults`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`correctionItemId`).
- The correction form opens inline in the panel. Cancelling closes it and returns focus to "Corrigir…". `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`open`, `close`).
- The caller may pass a run or source filter, which reaches the correction form's fragment picker. `src/features/curation/components/DecisionPanel/DecisionPanel.types.ts` (`fragmentFilter`), `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`fragmentFilter`).

### Decision panel - stale notice
- When the caller marks the item stale and supplies a reload, the panel shows "Este item mudou desde que você o abriu." with a "Recarregar" action that triggers the reload. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`stale && onRefetch`), `src/features/curation/components/DecisionPanel/StaleBanner.tsx` (`StaleBanner`).
- A stale item does not block any decision. The buttons are gated only by the evidence gate. `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`gated`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (no `stale` gate).
- The panel never detects staleness itself. `src/features/curation/components/DecisionPanel/DecisionPanel.types.ts` (`stale`).

## Answers
- Merge into a candidate - no candidate selected → nothing is sent and no message is shown. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`if (!selectedCandidate) return`).
- Prefer one side - no side selected → nothing is sent and no message is shown. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`if (!selectedSide) return`).
- Merge into a candidate / prefer one side - blank reason → nothing is sent, and the field shows "Informe um motivo para continuar." and takes focus. `src/features/curation/components/DecisionPanel/ReasonField.tsx` (`validateOnSubmit`).
- Any decision or "Corrigir…" - evidence not viewed → the click is suppressed and nothing is sent. The hint reads "Veja a evidência antes de decidir.". `src/features/curation/components/DecisionPanel/DecisionBar.tsx` (`gated`), `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`onClickCapture`).
- Any decision - server answers → `BUSINESS_REASON_REQUIRED` (the server's message is shown under the reason field, which takes focus). `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`setServerError`), `src/features/curation/components/DecisionPanel/ReasonField.tsx` (`setServerError`).
- Merge into a candidate - server answers → `BUSINESS_SELF_MERGE_FORBIDDEN` (a fixed alert "Não é possível fundir um nó com ele mesmo." replaces the server message, and the selected candidate is marked invalid). `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (SELF_MERGE `Alert`, `invalidCandidateId`), `src/features/curation/components/DecisionPanel/CandidateCard.tsx` (`invalid`).
- Merge into a candidate - server answers → `BUSINESS_INVALID_TARGET_NODE` (the selected candidate is marked invalid, and no message text is shown). `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`invalidCandidateId`, generic-banner exclusion list).
- Correction - server answers → `BUSINESS_TEMPORAL_INCOHERENT` or `BUSINESS_CORRECTION_NO_CHANGES` (passed to the correction form only, with no panel banner). `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`correctionServerError`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (generic-banner exclusion list).
- Correction - server answers → `BUSINESS_DATE_UNJUSTIFIED` or `BUSINESS_FRAGMENT_NOT_ACCEPTED` (passed to the correction form and also shown in the panel's generic alert). `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`correctionServerError`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (generic `Alert`).
- Any decision - server answers any other code → the server's message is shown in a destructive alert in the panel. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (generic `Alert`).

## Vocabularies
- Decisions on an entity-match review item, with the labels the owner sees: `merge_into` "Fundir neste", `keep_separate` "Manter separados". `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`buttons`).
- Decisions on a disputed item, with the labels the owner sees: `prefer_one` "Preferir este", `keep_disputed` "Manter em disputa". `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`buttons`).
- Header badge per queue kind: `entity_match` "Para revisar" (badge state `uncertain`), `disputed` "Disputado" (badge state `disputed`). `src/features/curation/components/DecisionPanel/DecisionPanel.helpers.ts` (`headerBadge`).
- Valid-from basis labels on a dispute side: `stated` "Declarada", `document` "Doc.", `received` "Receb.". `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`SOURCE_LABEL`).
- Presentation of a queue item: `summary`, `full-diff`. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`mode: "summary" | "full-diff"`).
- Evidence indicator states: not viewed "Ver evidência", viewed "Evidência vista". `src/features/curation/components/DecisionPanel/EvidenceChip.tsx` (`EvidenceChip`).
- Server codes the panel projects to a specific place: `BUSINESS_REASON_REQUIRED`, `BUSINESS_SELF_MERGE_FORBIDDEN`, `BUSINESS_INVALID_TARGET_NODE`, `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_CORRECTION_NO_CHANGES`, `BUSINESS_DATE_UNJUSTIFIED`, `BUSINESS_FRAGMENT_NOT_ACCEPTED`. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (exclusion list, `invalidCandidateId`), `src/features/curation/components/DecisionPanel/CorrectionSection.tsx` (`correctionServerError`).

## Upstream artifacts
- An entity-match review item, as the curation contract publishes it: node id, node type, canonical name, candidates (each with candidate node id, canonical name and similarity) and creation time. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`EntityMatchQueueItem`), `src/features/curation/components/DecisionPanel/CandidateCard.tsx` (`EntityMatchCandidate`).
- A disputed item, as the curation contract publishes it: item kind (link or attribute), dispute scope (source node, link type, node, attribute key), sides and creation time. `src/features/curation/components/DecisionPanel/ComparePane.tsx` (`DisputeQueueItem`), `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`item.scope`).
- A dispute side, as the curation contract publishes it: item id, value, target node id, valid-from, valid-to, valid-from basis and confidence. `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`DisputedItemSide`), `src/features/curation/components/DecisionPanel/PeriodTimeline.tsx` (`DisputedItemSide`).
- The entity-match resolution body the panel composes: `decision`, `target_node_id`, `reason`. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`onResolveEntityMatch`).
- The dispute resolution body the panel composes: `item_kind`, `item_ids`, `decision`, `winner_id`, `reason`. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`onResolveDispute`).
- A node's canonical name and node type, read from the knowledge base's node detail to name a dispute's subject node and a link side's target. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx` (`subjectQ.data?.node.canonicalName`), `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx` (`nodeQ.data?.node`).
- The server's refusal code and message from the most recent decision, supplied by the caller. `src/features/curation/components/DecisionPanel/DecisionPanel.types.ts` (`DecisionPanelServerError`).

## Outside the domain
- The panel's outer surface choice (`ambient` glass or `plain` section) and the "Painel de decisão" region label. Wiring. `src/features/curation/components/DecisionPanel/DecisionPanel.tsx`, `src/features/curation/components/DecisionPanel/DecisionPanel.types.ts`.
- Radio, radiogroup, toolbar, progressbar, `aria-live`, `aria-invalid` and `aria-describedby` wiring, and focus restore through `requestAnimationFrame`. Accessibility mechanics. `src/features/curation/components/DecisionPanel/CandidateCard.tsx`, `src/features/curation/components/DecisionPanel/ComparePane.tsx`, `src/features/curation/components/DecisionPanel/DecisionBar.tsx`, `src/features/curation/components/DecisionPanel/CorrectionSection.tsx`, `src/features/curation/components/DecisionPanel/EvidenceChip.tsx`, `src/features/curation/components/DecisionPanel/PeriodTimeline.tsx`.
- Button variants, borders, scrims, the pulse animation and icons. Surface. `src/features/curation/components/DecisionPanel/CandidateCard.tsx`, `src/features/curation/components/DecisionPanel/DisputeSideCard.tsx`, `src/features/curation/components/DecisionPanel/EvidenceChip.tsx`, `src/features/curation/components/DecisionPanel/StaleBanner.tsx`, `src/features/curation/components/DecisionPanel/DecisionBar.tsx`.
- The unused `hidden` button flag. Wiring. `src/features/curation/components/DecisionPanel/DecisionBar.tsx`.
- The `itemKindOf` helper, which defaults to `link` for entity-match items and is not used by the panel. Internal helper. `src/features/curation/components/DecisionPanel/DecisionPanel.types.ts`.
- The per-component export barrel. Wiring. `src/features/curation/components/DecisionPanel/index.ts`.
- The default reason-field id `reason-field` and the error id suffix. Wiring. `src/features/curation/components/DecisionPanel/ReasonField.tsx`.

## Observed and not decided here
- The reason field is always marked required: "Motivo *" and "(obrigatório)", from `reasonRequired = true` (`src/features/curation/components/DecisionPanel/DecisionPanel.tsx`, `src/features/curation/components/DecisionPanel/ReasonField.tsx`). Yet keep separate and keep disputed are sent without any reason check, as `reason: reason || null` (`src/features/curation/components/DecisionPanel/DecisionPanel.tsx`, `dispatch`).
- The dispute text tells the owner to adjust periods: "ou ajuste os períodos" (`src/features/curation/components/DecisionPanel/ComparePane.tsx`, `DisputeSubject`, and the full-presentation instruction). The panel offers only "Preferir este" and "Manter em disputa", with no adjust-periods control (`src/features/curation/components/DecisionPanel/DecisionPanel.tsx`, `buttons`).
- In summary presentation, the instruction reads "Selecione qual lado prefere." with no mention of periods (`src/features/curation/components/DecisionPanel/ComparePane.tsx`, `DisputeView`). The explanation above it, shown in both presentations, still says "as vigências abaixo se sobrepõem" and "ou ajuste os períodos" (`src/features/curation/components/DecisionPanel/ComparePane.tsx`, `DisputeSubject`).
- The full candidate list is headed "Múltiplos candidatos — escolha qual representa a mesma entidade." (`src/features/curation/components/DecisionPanel/ComparePane.tsx`, `EntityMatchView` full branch). The same heading appears when there is a single candidate outside summary presentation, and when there are none.
- With no candidates, the text offers "fundir ad-hoc por busca" (`src/features/curation/components/DecisionPanel/ComparePane.tsx`). This area has no search or ad-hoc merge control, and "Fundir neste" stays offered but does nothing without a selected candidate (`src/features/curation/components/DecisionPanel/DecisionPanel.tsx`, `dispatch`).
- Some correction refusals appear in two places and others in one. `BUSINESS_DATE_UNJUSTIFIED` and `BUSINESS_FRAGMENT_NOT_ACCEPTED` reach the correction form (`src/features/curation/components/DecisionPanel/CorrectionSection.tsx`, `correctionServerError`) and the panel's generic alert, because they are missing from its exclusion list (`src/features/curation/components/DecisionPanel/DecisionPanel.tsx`). `BUSINESS_TEMPORAL_INCOHERENT` and `BUSINESS_CORRECTION_NO_CHANGES` reach only the correction form.
- For a self-merge refusal, the panel shows its own fixed text "Não é possível fundir um nó com ele mesmo." in place of the server's message (`src/features/curation/components/DecisionPanel/DecisionPanel.tsx`, SELF_MERGE `Alert`). For an invalid-target refusal, the server's message is shown nowhere (`src/features/curation/components/DecisionPanel/DecisionPanel.tsx`, exclusion list, `invalidCandidateId`).
