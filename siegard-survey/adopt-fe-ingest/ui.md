---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
  - src/features/ingest/components/IngestDropzone/IngestDropzone.types.ts
  - src/features/ingest/components/IngestDropzone/index.ts
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
  - src/features/ingest/components/IngestPanel/IngestPanel.types.ts
  - src/features/ingest/components/IngestPanel/IngestSummary.tsx
  - src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx
  - src/features/ingest/components/IngestPanel/_IngestNoopNotice.tsx
  - src/features/ingest/components/IngestPanel/index.ts
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.types.ts
  - src/features/ingest/components/IngestWorkspace/_utils.ts
  - src/features/ingest/components/IngestWorkspace/index.ts
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  - src/features/ingest/index.ts
read_outside_area:
  - "src/features/ingest/api/index.ts — to resolve the types and hooks the area imports (IngestSourceType, LlmRunSummary, IngestRawInformationResponse, LlmRun)"
  - "src/features/ingest/api/_transforms.ts — to learn the closed source types, the run statuses (running, completed, failed), the ingest outcome values (created, noop_existing) and the run summary fields the area renders"
  - "src/features/ingest/api/useIngestRawInformation.ts — the source-recording step calls POST /api/v1/ingest/raw-information"
  - "src/features/ingest/api/useRunLlmExtraction.ts — the extraction step calls POST /api/v1/ingest/llm-runs/{llmRunId}/run with an empty body and no client-side cutoff"
  - "src/features/ingest/api/useRetryLlmRun.ts — the retry step calls POST /api/v1/ingest/llm-runs/{llmRunId}/retry"
  - "src/features/ingest/api/useIngestRunStatus.ts — polling calls GET /api/v1/ingest/llm-runs/{llmRunId} every 5000 ms and stops on completed or failed"
  - "src/features/ingest/api/_request.ts — to learn where EnvelopeError codes SYSTEM_NETWORK, SYSTEM_TIMEOUT, SYSTEM_ABORTED, SYSTEM_UPSTREAM, SYSTEM_UNKNOWN and AUTH_SESSION_EXPIRED and their httpStatus come from"
  - "src/features/ingest/api/useIngestGraphAssembly.ts — to learn when the graph store reaches the status the workspace waits for (it sets revealing, or ready when there are no affected nodes)"
  - "src/lib/http.ts — to confirm EnvelopeError is the failure class classifyError tests for"
---

## Facts
### Ingest screen layout and sequence
- The ingest screen has two columns: on the left the ingest panel (form, progress, outcome), on the right either the graph of this ingest or the detail of one selected node. `src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx` (`IngestWorkspace`).
- Selecting a node in the graph replaces the graph with that node's detail panel, labelled with the node's graph label. Closing the detail brings the graph back. The left column's phase does not change. `src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx` (`handleNodeSelect`, `handleDetailClose`).
- An ingest runs these steps in order: the owner submits, the content check runs, then the source-type check, then the source is recorded. If the source is new, extraction is started at once. If the content is already known, the screen stops and waits for the owner to ask for the existing graph. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleSubmit`).
- Recording the source sends `content`, `source_type`, `model` and `prompt_version` through `useIngestRawInformation`. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`ingestMutation.mutate`).
- When the source is recorded, the screen keeps the answer's run id (`llmRunId`) and sets the graph to loading, whatever the outcome. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`onSuccess`, `setStatus("loading")`).
- An answer with outcome `noop_existing` (already-known content, `rules/knowledge-base/content-hash-unique`) moves the screen to the noop phase. It keeps the answer's affected nodes, or an empty list when the answer has none. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`data.outcome === "noop_existing"`).
- Any other outcome counts as a newly created source. The screen moves to extracting and starts extraction on that run through `useRunLlmExtraction` with `llm_run_id`. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`runMutation.mutate`).
- When extraction answers, the screen keeps the run summary (`domain/knowledge-base/run-summary`). It keeps the run's affected nodes only if the list is present and non-empty. It then enables graph assembly and moves to revealing. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`onSuccess: (run)`).
- The revealing phase becomes complete only when the graph reports the status `ready`. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`phase === "revealing" && graphStatus === "ready"`).
- In the noop phase, the "view existing graph" action enables graph assembly over the kept affected nodes and moves to revealing. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleAssembleExisting`).
- The "ingest another document" action clears all of these: the content, the source type, the selected node, the run id, the affected nodes, polling, the summary, the error and the validation message. It returns to idle and clears the graph. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleReset`), `src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx` (`resetForm`).

### Form readiness and submission
- The form is ready when the content has at least one character and a source type is selected. Content is not trimmed, so content made only of whitespace counts as present. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`content.length >= 1 && sourceType !== ""`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`canSubmit`).
- Editing moves the phase between idle and ready only while the phase is idle or ready. In every other phase, edits leave the phase as it is. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`form → phase syncing`).
- The panel submits only in the ready phase with a ready form. The submit control shows only in idle, ready and sending, and is disabled while sending. `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`showSubmit`, `canSubmit`).
- When submission passes both checks, the screen clears any validation message and any earlier error before it moves to sending. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleSubmit`).
- The content and source-type fields are disabled in sending, extracting, polling, revealing, complete and noop. They are editable in idle, ready and error. `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`isInputDisabled`).
- In the error phase the fields can be edited but there is no submit control. Retrying with no run id re-submits whatever content and source type are held at that moment. `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`isInputDisabled`, `showSubmit`), `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleRetry`).

### File drop and pick
- The file area shows only in idle and ready. `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`showDropzone`).
- Opening the file picker by click, Enter or Space, and dropping a file, are all ignored while the area is disabled. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`openPicker`, `onZoneKeyDown`, `onDrop`).
- When several files are dropped or picked, only the first is used. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`handleFiles`, `files[0]`).
- A file is accepted when its MIME type is `text/plain`, when it is any other `text/*` type, or when its name ends in `.txt` (case-insensitive). `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`isTxtFile`).
- The file picker offers `.txt` and `text/plain`. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`ACCEPT`).
- The code sets no limit on file size. The accepted file is read whole as text on the client. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`FileReader.readAsText`).
- A file that is read successfully replaces the whole content field and clears the area's rejection message. A read that does not produce text does nothing. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`reader.onload`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`onContent={onContentChange}`).
- Picking the same file twice still loads it again. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`e.target.value = ""`).
- The rejection message stays until a file is read successfully. Typing or pasting content does not clear it. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`setError`).

### Progress notices
- Each in-flight phase shows a progress notice: sending shows "Enviando documento…", extracting shows "Extraindo conhecimento… (pode levar alguns minutos)", polling shows "Verificando extração…" and revealing shows "Compondo o grafo…". `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`progressCopy`).
- The progress region is marked busy in sending, extracting and polling. `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`isProgressBusy`).

### Extraction outcome shown to the owner
- The outcome block shows in revealing and complete, and only when a run summary is held. It reads "Extração concluída", lists the summary counts, and offers "ingest another document". `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`showSummary`).
- The summary shows seven counts in this order: accepted, consolidated, needs review, uncertain, disputed, rejected, error. The run summary's superseded-previous and orphaned-fragment counts are not shown. `src/features/ingest/components/IngestPanel/IngestSummary.tsx` (`ROWS`).
- When the needs-review count is above zero, the outcome adds "Alguns nós aguardam revisão. Acesse Curadoria para detalhes.". `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`summary.needsReview > 0`).
- The already-known path never holds a run summary. After the owner asks for the existing graph, revealing and complete show no outcome block, and so no "ingest another document" action. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleAssembleExisting`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`showSummary`).

### Already-known content notice
- The noop phase shows "Documento já ingerido" and "Este conteúdo já foi processado anteriormente. O grafo abaixo mostra os nós extraídos.". It offers two actions: "view existing graph" and "ingest another document". `src/features/ingest/components/IngestPanel/_IngestNoopNotice.tsx` (`IngestNoopNotice`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`showNoopNotice`).

### Connection drop and polling
- When an extraction call fails and the failure counts as a connection drop, the screen shows no error. It switches to polling the run (`useIngestRunStatus` with the run id and `enabled`) and moves to the polling phase. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`isConnectionDropError(err)`, `setIsPolling(true)`).
- A failure counts as a connection drop when all of these hold, checked in this order. (1) It is a failure envelope. (2) Its HTTP status is not 409 and not 422. (3) Its code is `SYSTEM_NETWORK` or `SYSTEM_TIMEOUT`, or it is any code other than `SYSTEM_LLM_PROVIDER_UNAVAILABLE`, `AUTH_SESSION_EXPIRED` and `SYSTEM_ABORTED`. `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`).
- A failure that is not a failure envelope never counts as a connection drop. `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`, `return false`).
- While polling, a run (`domain/knowledge-base/llm-run`) with status `completed` stops polling, keeps the summary and any non-empty affected nodes, enables graph assembly and moves to revealing. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`run.status === "completed"`).
- While polling, a run with status `failed` stops polling and moves to the error phase with the code `RUN_FAILED`, which the client creates itself. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`run.status === "failed"`).
- While polling, any other run status keeps the screen waiting in the polling phase. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`polling settled`).
- The connection-drop classification is applied only to extraction calls. A failure while recording the source or on the retry call always goes to the error phase. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleSubmit`, `handleRetry`).

### Error band and retry
- The error phase shows "Erro na ingestão" and the failure's message. It always offers "ingest another document", and offers "Tentar novamente" only when the failure's code is retryable. `src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx` (`IngestErrorBand`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`isRetryable`).
- The retryable codes are `SYSTEM_LLM_PROVIDER_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_UPSTREAM`, `SYSTEM_TIMEOUT`, `SYSTEM_NETWORK` and `RUN_FAILED`. Every other code gets no retry. `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`RETRYABLE_ERROR_CODES`).
- The code and message shown come from the failure envelope's `code` and `message` (`constraints/failures-answer-one-envelope`). Any other error gets the code `SYSTEM_UNKNOWN` with its own message. A value that is not an error gets `SYSTEM_UNKNOWN` with "Erro desconhecido.". `src/features/ingest/components/IngestWorkspace/_utils.ts` (`classifyError`).
- Retrying with no run id held re-runs the whole submission. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleRetry`, `llmRunId === null`).
- Retrying with a run id held clears the error and moves to extracting. It calls the run retry (`useRetryLlmRun` with `llm_run_id`) and, if that answers, starts extraction on the same run again. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleRetry`).

## Answers
- Load a file into the form — the first file is neither a `text/*` MIME type nor named `*.txt` → inline alert, no content loaded ("Formato não suportado: envie um arquivo .txt (ou cole o texto abaixo)."). `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx` (`isTxtFile`, `REJECT_MESSAGE`).
- Submit an ingest — content is empty (checked first) → validation message, nothing sent ("Cole ou arraste o conteúdo do documento antes de ingerir."). `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleSubmit`).
- Submit an ingest — content present and no source type selected (checked second) → validation message, nothing sent ("Selecione o tipo de fonte antes de ingerir."). `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleSubmit`).
- Record the source — the call fails with any code → error band with that code (the failure's message, plus "Tentar novamente" only for a retryable code). `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`ingestMutation onError`, `classifyError`).
- Run extraction — the failure envelope has HTTP status 409 or 422 → error band with the failure's code (the failure's message; no retry unless the code is retryable). `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`).
- Run extraction — code `SYSTEM_NETWORK` or `SYSTEM_TIMEOUT` (status neither 409 nor 422) → no error band; polling phase ("Verificando extração…"). `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`), `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`setPhase("polling")`).
- Run extraction — code `SYSTEM_LLM_PROVIDER_UNAVAILABLE` → error band with that code (the failure's message; "Tentar novamente" offered). `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`RETRYABLE_ERROR_CODES`).
- Run extraction — code `AUTH_SESSION_EXPIRED` → error band with that code (the failure's message; no retry). `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`RETRYABLE_ERROR_CODES`).
- Run extraction — code `SYSTEM_ABORTED` → error band with that code (the failure's message; no retry). `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`), `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`RETRYABLE_ERROR_CODES`).
- Run extraction — any other code in a failure envelope with status neither 409 nor 422, including `SYSTEM_INTERNAL_ERROR` and `SYSTEM_UPSTREAM` → no error band; polling phase. `src/features/ingest/components/IngestWorkspace/_utils.ts` (`isConnectionDropError`, `return true`).
- Run extraction — a failure that is not a failure envelope → error band `SYSTEM_UNKNOWN` (the error's own message, or "Erro desconhecido."; no retry). `src/features/ingest/components/IngestWorkspace/_utils.ts` (`classifyError`, `isConnectionDropError`).
- Poll the run — run status `failed` → error band `RUN_FAILED` ("A extração falhou. Reabra a execução para tentar novamente."; "Tentar novamente" offered). `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`run.status === "failed"`).
- Retry the run — the retry call fails with any code → error band with that code (the failure's message; never polling). `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`retryMutation onError`).
- Retry the run — the extraction started after a successful retry fails → the same classification as running extraction (polling for a connection drop, the error band otherwise). `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`handleRetry`, `runMutation onError`).
- Show an error — the error band receives no message → "Algo deu errado. Tente novamente.". `src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx` (`errorMessage ??`).

## Vocabularies
- Ingest screen phase: `idle`, `ready`, `sending`, `noop`, `extracting`, `polling`, `revealing`, `complete`, `error`. `src/features/ingest/components/IngestPanel/IngestPanel.types.ts` (`IngestPhase`).
- Source type (`domain/knowledge-base/source-type`), value and label as offered to the owner: `pdf` "PDF", `email` "E-mail", `ata` "Ata", `chat` "Chat", `artigo` "Artigo", `transcricao` "Transcrição", `outro` "Outro". `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`SOURCE_TYPE_OPTIONS`).
- Run summary counts shown, with their labels: `accepted` "Aceitos", `consolidated` "Consolidados", `needsReview` "Aguardando revisão", `uncertain` "Incertos", `disputed` "Em conflito", `rejected` "Rejeitados", `error` "Erros". `src/features/ingest/components/IngestPanel/IngestSummary.tsx` (`ROWS`).
- Retryable failure codes: `SYSTEM_LLM_PROVIDER_UNAVAILABLE`, `SYSTEM_INTERNAL_ERROR`, `SYSTEM_UPSTREAM`, `SYSTEM_TIMEOUT`, `SYSTEM_NETWORK`, `RUN_FAILED`. `src/features/ingest/components/IngestPanel/IngestPanel.tsx` (`RETRYABLE_ERROR_CODES`).
- Failure codes the client creates itself: `RUN_FAILED` (a polled run that failed) and `SYSTEM_UNKNOWN` (a failure that is not a failure envelope). `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`setErrorCode("RUN_FAILED")`), `src/features/ingest/components/IngestWorkspace/_utils.ts` (`classifyError`).
- Run statuses (`domain/knowledge-base/run-status`) the screen acts on: `completed`, `failed`. Any other status keeps polling. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`run.status`).
- Ingest outcome the screen branches on: `noop_existing`. Every other outcome is treated as a new source. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`data.outcome`).

## Upstream artifacts
- Recording a source (`contracts/knowledge-base/ingestion`) through `useIngestRawInformation`. The request has `content`, `source_type`, `model` and `prompt_version`. The screen reads the answer's `outcome`, `llmRunId` and `affectedNodes`. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`ingestMutation`).
- Running extraction on a run through `useRunLlmExtraction` with `llm_run_id`. The screen reads the answer's `summary` and `affectedNodes`. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`runMutation`).
- Retrying a run through `useRetryLlmRun` with `llm_run_id`. The answer is not read. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`retryMutation`).
- Reading a run through `useIngestRunStatus` with `llmRunId` and `enabled`. The screen reads `status`, `summary` and `affectedNodes`. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`runStatus`).
- Graph assembly over the affected nodes through `useIngestGraphAssembly` with `affectedNodes` and `enabled`. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`assembly`).
- The failure envelope as the frontend carries it, `EnvelopeError` with `code`, `message` and `httpStatus`. `src/features/ingest/components/IngestWorkspace/_utils.ts` (`EnvelopeError`).
- The graph feature's store: `status`, `errorMessage`, `nodes`, `links`, `setStatus` and `clear`. Also its `GraphSpace` and `NodeDetailPanel` views. `src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx` (`useGraphStore`), `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts` (`useGraphStore.getState()`).
- The run summary fields the screen reads: `accepted`, `consolidated`, `needsReview`, `uncertain`, `disputed`, `rejected`, `error`. `src/features/ingest/components/IngestPanel/IngestSummary.tsx` (`LlmRunSummary`).

## Outside the domain
- The extraction model `claude-opus-4-8` and prompt version `v3` sent with every source recording. These are defaults this implementation chose. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts`.
- The two-column 40%/60% split, the container-query breakpoint and the 90 ms reveal stagger. Layout. `src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx`.
- The workspace's only prop, `className`. Wiring. `src/features/ingest/components/IngestWorkspace/IngestWorkspace.types.ts`.
- The dropzone's optional `onFile` callback (file name and size). It is declared but the panel never passes it. Wiring. `src/features/ingest/components/IngestDropzone/IngestDropzone.types.ts`.
- ARIA roles, `aria-live`, `aria-busy`, `tabIndex` and drag-over styling. Accessibility surface. `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx`.
- Control labels, placeholders, the headings "Ingerir documento" and "Conteúdo do documento", helper text and icons. Surface. `src/features/ingest/components/IngestPanel/IngestPanel.tsx`.
- `data-testid` attributes and styling classes. Test hooks and surface. `src/features/ingest/components/IngestPanel/_IngestNoopNotice.tsx`.
- The exposed status of graph assembly, which the screen discards. Wiring. `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts`.
- Re-export barrels. Module wiring. `src/features/ingest/components/IngestDropzone/index.ts`.
- Re-export barrels. Module wiring. `src/features/ingest/components/IngestPanel/index.ts`.
- Re-export barrels. Module wiring. `src/features/ingest/components/IngestWorkspace/index.ts`.
- Re-export barrels. Module wiring. `src/features/ingest/index.ts`.

## Observed and not decided here
- The file picker offers only `.txt` and `text/plain` (`ACCEPT = ".txt,text/plain"`, `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx`). The drop check accepts any `text/*` MIME type (`file.type.startsWith("text/")`, `src/features/ingest/components/IngestDropzone/IngestDropzone.tsx`).
- The noop notice says "O grafo abaixo mostra os nós extraídos." (`src/features/ingest/components/IngestPanel/_IngestNoopNotice.tsx`). The code only sets the graph to loading on that path and assembles it when the owner asks for the existing graph (`setStatus("loading")`, `handleAssembleExisting`, `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts`).
- `SYSTEM_INTERNAL_ERROR` and `SYSTEM_UPSTREAM` are listed as retryable for the error band (`RETRYABLE_ERROR_CODES`, `src/features/ingest/components/IngestPanel/IngestPanel.tsx`). On the extraction step the same codes never reach the error band and go to silent polling instead (`isConnectionDropError`, `return true`, `src/features/ingest/components/IngestWorkspace/_utils.ts`).
- After a new source's extraction completes, the outcome block offers "ingest another document" (`showSummary`, `src/features/ingest/components/IngestPanel/IngestPanel.tsx`). After the already-known path reaches complete, there is no summary, so no reset action shows (`handleAssembleExisting` sets no summary, `src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts`).
