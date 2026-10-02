---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/curation/components/CorrectionForm/CorrectionFields.tsx
  - src/features/curation/components/CorrectionForm/CorrectionForm.tsx
  - src/features/curation/components/CorrectionForm/CorrectionForm.types.ts
  - src/features/curation/components/CorrectionForm/DateJustification.tsx
  - src/features/curation/components/CorrectionForm/correction-schema.ts
  - src/features/curation/components/CorrectionForm/index.ts
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx
  - src/features/curation/components/ProvenanceTrail/ProvenanceTrail.types.ts
  - src/features/curation/components/ProvenanceTrail/index.ts
read_outside_area:
  - "src/features/curation/api/provenance.hooks.ts - opened to see which reads the trail and the fragment picker issue (GET /api/v1/provenance/links/{id}, GET /api/v1/provenance/attributes/{id}, GET /api/v1/fragments/accepted with llm_run_id and/or raw_information_id, default limit 20 offset 0, disabled until a filter is given)"
  - "src/features/curation/types.ts - opened to confirm the ItemKind (link, attribute) and ValidFromSource (stated, document, received) unions and the CorrectItemRequest / CorrectedValues wire shape the form submits"
---

## Facts
### Assertion correction — which value field the owner fills
- When the item kind is attribute, the owner fills a new value ("Novo valor"). When it is link, the owner fills the target node's id ("Nó-alvo (ID)"). Only one of the two fields is shown. `src/features/curation/components/CorrectionForm/CorrectionFields.tsx` (`itemKind === "attribute"` branch).
- Every field starts with the current item's values. If the caller gives no basis for the start date, the valid-from basis starts as `document`. The reason always starts empty. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`useForm` `defaultValues`); `src/features/curation/components/CorrectionForm/correction-schema.ts` (`buildDefaults`).
- An empty value, target node id, start date, end date or fragment id counts as not provided and is sent as null. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`optionalString`, `dateString`).
- For an attribute correction, the value must be non-empty. Its content is not checked against the attribute's value type. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`superRefine`, `itemKind === "attribute"`).
- For a link correction, the target node id must be non-empty. No UUID or other format check is applied to it. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`superRefine`, `itemKind === "link"`).
- The validity start ("Vigência — início") and end ("Vigência — fim") are both optional date inputs. A date the owner gives must match the shape `AAAA-MM-DD` (`^\d{4}-\d{2}-\d{2}$`). Only the shape is checked, not whether it is a real calendar date. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`ISO_DATE_RE`, `dateString`); `src/features/curation/components/CorrectionForm/CorrectionFields.tsx` (`type="date"`).
- When both dates are given, the start must be strictly earlier than the end. An equal start and end is refused, and the message is shown on the end field. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`data.validFrom >= data.validTo`).
- When the date basis is `stated`, a fragment id is required. Under `document` or `received`, no fragment is required. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`validFromSource === "stated" && validFromFragmentId === null`).
- The reason ("Motivo") is required. It is trimmed, must keep at least one character after trimming, and is submitted trimmed. It has no maximum length. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`reason: z.string().trim().min(1)`).
- Field messages appear when a field loses focus and when the owner submits. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`mode: "onBlur"`).
- The client checks run in this order: value or target node id for the item kind, then start before end, then a fragment required under `stated`. Each message lands on its own field. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`superRefine` body order).
- While the date basis is `stated` and no fragment id is filled, "Salvar correção" is disabled. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`disabled={validFromSource === "stated" && …length === 0}`).
- While a submission is in flight, "Cancelar" is disabled and "Salvar correção" shows a loading state. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`disabled={submitting}`, `loading={submitting}`).
- On submit, the form sends a correction request with `item_kind`, `item_id`, `corrected` and `reason`. `corrected` carries `value` for an attribute or `target_node_id` for a link, plus `valid_from`, `valid_to`, `valid_from_source` and `valid_from_fragment_id`. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`buildCorrectItemRequest`).
  - `valid_from_fragment_id` is sent whatever the date basis is. A fragment id left in the field after switching away from `stated` is still sent. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`buildCorrectItemRequest`).
  - The client does not detect an unchanged correction. Every field is sent, and "no change" comes only from the server's answer. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`buildCorrectItemRequest`); `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`formLevelError`).
- The form submits nothing itself. It hands the request to its caller, and the caller passes back a server error as a `code` plus a `message`. `src/features/curation/components/CorrectionForm/CorrectionForm.types.ts` (`onSubmit`, `serverError`).

### Date justification
- The "Justificativa da data" fieldset offers three bases for the start date, in this order: `stated`, `document`, `received`. Each has a label and a hint (see Vocabularies). `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`SOURCE_OPTIONS`).
- Under `stated`, if the caller gave an accepted fragment filter (a run id and/or a raw information id), the screen lists the accepted fragments for that filter so the owner can pick one. `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`hasFilter`, `useListAcceptedFragments(fragmentParams)`); `src/features/curation/components/CorrectionForm/CorrectionForm.types.ts` (`fragmentFilter`).
- Each choice in the fragment picker shows the first 80 characters of the fragment's text. Picking it fills in the fragment's id. `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`label: f.text.slice(0, 80)`, `value: f.fragmentId`).
- Under `stated`, the picker falls back to a manual fragment-id input in four cases: no filter was given, the listing failed, the listing returned no fragments, or the listing has not answered yet. The input shows "Listagem de fragmentos indisponível — informe o id manualmente." `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`showPicker`, `showManualFragment`).
- A manually entered fragment id is not checked for format on the client. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`validFromFragmentId: optionalString`).
- The fragment field and its message are shown only under `stated`. Under `document` or `received`, no fragment field is visible. `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`showPicker`, `showManualFragment`).

### Server refusals shown on the form
- A server refusal with a known code puts the server's message on the field that code maps to (see Answers). For `BUSINESS_CORRECTION_NO_CHANGES`, the form instead shows its own fixed message at the top. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode`, `formLevelError`).
- A server refusal whose code is not one of the five mapped codes shows nothing on the form. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode` `default: return null`).
- No element displays an error on the date-basis field. A server message mapped to that field is set, but the owner never sees it. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`setError("validFromSource", …)`); `src/features/curation/components/CorrectionForm/DateJustification.tsx` (no `errors.validFromSource` rendering).

### Provenance trail
- The trail reads provenance by link for a link item and by attribute for an attribute item. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`useProvenanceByLink`, `useProvenanceByAttribute`, `active`).
- While provenance loads, the trail shows a loading placeholder labelled "Carregando evidência". `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`isPending` branch).
- When the item's source was removed by compliance deletion, the trail shows "A fonte original foi excluída por conformidade. Sem proveniência disponível." `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`rawDeleted` branch).
- When provenance fails to load for any other reason, the trail shows "Não foi possível carregar a evidência." `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`isError` branch).
- When provenance loads with no fragments, the trail shows "Nenhuma proveniência disponível." `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`fragments.length === 0` branch).
- The trail lists fragments in the order the provenance answer gives them, and under each fragment its chunks in the order the answer gives them. The trail does not re-sort. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`fragments.map`, `frag.chunks.map`).
- Each fragment shows "Fragmento · confiança N%", where N is the fragment's confidence × 100, rounded to a whole number. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`(frag.confidence * 100).toFixed(0)`).
- A fragment's text is cut to 280 characters: if longer, it shows the first 279 characters, with trailing whitespace removed, followed by "…". `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`truncate(frag.text)`, `max = 280`).
- Each chunk shows its source document's source type label, the document's received date in pt-BR date format, and "trecho <start>–<end>" from the chunk's offsets. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`formatSourceType`, `formatDate(receivedAt)`, `offsetStart`/`offsetEnd`).
- A chunk's excerpt is cut the same way to 200 characters (199 characters plus "…"). `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`truncate(chunk.excerpt, 200)`).
- A source type with no label is shown as the raw source-type value. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`SOURCE_TYPE_LABELS[t] ?? t`).

### Evidence viewed
- The trail signals once per mount that its evidence was viewed. The signal fires the first time at least 25% of the trail is visible in the viewport, or the first time focus lands inside the trail. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`IO_THRESHOLD = 0.25`, `focusin`, `firedRef`).
- Where viewport observation is unavailable, only focus fires the signal. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`typeof IntersectionObserver !== "undefined"`).
- The signal never fires while loading, on a compliance-deleted source, or on a load failure. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`dataReady` guard).
- The signal can fire when provenance loaded with no fragments. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (empty branch carries `ref={sentinelRef}`; `dataReady` true).
- Once the signal has fired, it does not fire again on the same mount, even if the trail is given a different item. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`firedRef` never reset on `itemId` change).

## Answers
- assertion correction (client) — attribute value empty → message on the value field ("Informe o valor corrigido."). `src/features/curation/components/CorrectionForm/correction-schema.ts` (`superRefine`, path `value`).
- assertion correction (client) — link target node id empty → message on the target field ("Selecione o nó-alvo da fusão."). `src/features/curation/components/CorrectionForm/correction-schema.ts` (`superRefine`, path `targetNodeId`).
- assertion correction (client) — start or end date not shaped `AAAA-MM-DD` → message on that date field ("Data inválida. Use o formato AAAA-MM-DD."). `src/features/curation/components/CorrectionForm/correction-schema.ts` (`dateString`).
- assertion correction (client) — both dates given and start not earlier than end → message on the end field ("O início deve ser anterior ao fim."). `src/features/curation/components/CorrectionForm/correction-schema.ts` (`superRefine`, path `validTo`).
- assertion correction (client) — basis `stated` with no fragment id → message on the fragment field ("Selecione o fragmento que justifica a data."), and "Salvar correção" stays disabled. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`superRefine`, path `validFromFragmentId`); `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (submit `disabled`).
- assertion correction (client) — reason empty or only whitespace → message on the reason field ("Informe um motivo para continuar."). `src/features/curation/components/CorrectionForm/correction-schema.ts` (`reason` `.min(1)`).
- assertion correction (server) — answer carries `BUSINESS_CORRECTION_NO_CHANGES` → fixed message at the top of the form ("Nenhuma alteração detectada. Modifique pelo menos um campo."). `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`formLevelError`).
- assertion correction (server) — answer carries `BUSINESS_TEMPORAL_INCOHERENT` → server message on the end-date field. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode`).
- assertion correction (server) — answer carries `BUSINESS_DATE_UNJUSTIFIED` → server message set on the date-basis field, which shows no message. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode`); `src/features/curation/components/CorrectionForm/DateJustification.tsx`.
- assertion correction (server) — answer carries `BUSINESS_FRAGMENT_NOT_ACCEPTED` → server message under the fragment picker or manual fragment input, visible only under `stated`. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode`, `fragmentErrorMessage`); `src/features/curation/components/CorrectionForm/DateJustification.tsx`.
- assertion correction (server) — answer carries `BUSINESS_REASON_REQUIRED` → server message on the reason field. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode`).
- assertion correction (server) — any other code → nothing shown on the form. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode` `default`).
- provenance read — answer carries `BUSINESS_RAW_INFORMATION_DELETED` → "A fonte original foi excluída por conformidade. Sem proveniência disponível.", and evidence viewed is not signalled. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`rawDeleted`).
- provenance read — any other failure → "Não foi possível carregar a evidência.", and evidence viewed is not signalled. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`isError` branch).
- accepted fragment listing — failed, empty or not yet answered → manual fragment-id input with "Listagem de fragmentos indisponível — informe o id manualmente." `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`showManualFragment`).

## Vocabularies
- Valid-from basis, with the labels and hints the owner sees: `stated` "Declarada no fragmento" / "A própria fonte diz a data — selecione o fragmento."; `document` "Data do documento" / "Derivada da data do documento de origem."; `received` "Data de recebimento" / "Quando o sistema recebeu a informação.". `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`SOURCE_OPTIONS`); `src/features/curation/components/CorrectionForm/correction-schema.ts` (`validFromSourceSchema`).
- Item kind: `link`, `attribute`. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`itemKind: z.enum(["link", "attribute"])`).
- Source type labels: `document` "Documento", `email` "E-mail", `meeting` "Reunião", `chat` "Conversa", `article` "Artigo", `transcript` "Transcrição". Any other value is shown as is. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`SOURCE_TYPE_LABELS`).
- Server codes the correction form recognises: `BUSINESS_TEMPORAL_INCOHERENT`, `BUSINESS_DATE_UNJUSTIFIED`, `BUSINESS_FRAGMENT_NOT_ACCEPTED`, `BUSINESS_REASON_REQUIRED`, `BUSINESS_CORRECTION_NO_CHANGES`. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode`, `formLevelError`).
- Server code the provenance trail recognises: `BUSINESS_RAW_INFORMATION_DELETED`. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`rawDeleted`).

## Upstream artifacts
- The correction request body defined by the backend curation contract: `item_kind`, `item_id`, `reason`, and `corrected` with `value` | `target_node_id`, `valid_from`, `valid_to`, `valid_from_source`, `valid_from_fragment_id`. `src/features/curation/components/CorrectionForm/correction-schema.ts` (`buildCorrectItemRequest`); `src/features/curation/components/CorrectionForm/CorrectionForm.types.ts` (`CorrectItemRequest`).
- The backend's correction refusal codes, received as `{ code, message }` from the caller's mutation. `src/features/curation/components/CorrectionForm/CorrectionForm.types.ts` (`serverError`); `src/features/curation/components/CorrectionForm/CorrectionForm.tsx` (`fieldForServerCode`).
- The provenance answer, as the trail reads it: `fragments[]` with `id`, `confidence`, `text` and `chunks[]`; each chunk has `id`, `offsetStart`, `offsetEnd`, `excerpt`, and `rawInformation` with `sourceType` and `receivedAt`. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (render body).
- The accepted fragment listing, filtered by run id and/or raw information id, whose items the picker reads as `fragmentId` and `text`. `src/features/curation/components/CorrectionForm/DateJustification.tsx` (`useListAcceptedFragments`, `fragmentQ.data.items`).
- The failure envelope's `code`, read from the HTTP layer's error. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx` (`error instanceof EnvelopeError`, `error.code`).

## Outside the domain
- Moving focus to the first field on mount (a direct DOM ref), and the ARIA wiring (`aria-invalid`, `aria-describedby`, `role="alert"`, element ids) — accessibility wiring. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx`, `src/features/curation/components/CorrectionForm/CorrectionFields.tsx`, `src/features/curation/components/CorrectionForm/DateJustification.tsx`.
- React Hook Form `Controller`/`zodResolver` wiring and the `unknown` double cast on the defaults — framework. `src/features/curation/components/CorrectionForm/CorrectionForm.tsx`.
- Placeholders ("UUID do nó destino", "UUID do fragmento accepted", "Selecione um fragmento…", "Explique brevemente por que a correção é necessária."), headings, control labels, `rows={3}`, icons, colours and spacing — surface. `src/features/curation/components/CorrectionForm/CorrectionFields.tsx`, `src/features/curation/components/CorrectionForm/CorrectionForm.tsx`, `src/features/curation/components/CorrectionForm/DateJustification.tsx`.
- The skeleton's shape, the `GlassSurface` container and its `level`, `tabIndex` and region labels — surface. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx`.
- Both hooks called unconditionally, with the inactive one disabled — framework. `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx`.
- Per-component barrel exports — wiring. `src/features/curation/components/CorrectionForm/index.ts`, `src/features/curation/components/ProvenanceTrail/index.ts`.
- Prop type declarations whose behavior is surveyed where it is used; their comments cite spec ids and a link "Abrir no documento" that no code renders — text. `src/features/curation/components/CorrectionForm/CorrectionForm.types.ts`, `src/features/curation/components/ProvenanceTrail/ProvenanceTrail.types.ts`.

## Observed and not decided here
- When provenance is missing because the source was compliance-deleted, the trail never signals evidence viewed (`src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx`, `dataReady` false on `rawDeleted`). When provenance loads with no fragments ("Nenhuma proveniência disponível."), the trail can signal it (`src/features/curation/components/ProvenanceTrail/ProvenanceTrail.tsx`, empty branch carries `sentinelRef` with `dataReady` true).
- `BUSINESS_DATE_UNJUSTIFIED` is projected onto the date-basis field (`src/features/curation/components/CorrectionForm/CorrectionForm.tsx`, `fieldForServerCode` → `validFromSource`), but the date-justification fieldset renders no message for that field (`src/features/curation/components/CorrectionForm/DateJustification.tsx`, no `errors.validFromSource`). The owner is shown nothing for that refusal.
- For `BUSINESS_CORRECTION_NO_CHANGES`, the owner reads a fixed client-side message (`src/features/curation/components/CorrectionForm/CorrectionForm.tsx`, `formLevelError`). For every other mapped code, the owner reads the server's own message (`src/features/curation/components/CorrectionForm/CorrectionForm.tsx`, `setError(field, { message: serverError.message })`).
