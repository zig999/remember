---
contract_version: siegard-reconcile/8
title: Adoption of the frontend ingest context
summary: The ingest feature of the frontend is adopted as it stands and did not change; the owner states
  the source is the running system, and this reconciliation asks whether the specification written from
  its survey holds what each file carries.
target: frontend
files:
- path: src/features/ingest/api/_request.ts
  change: Sends the ingestion requests to the back end with the access token, a thirty-second cutoff except
    for extraction, a one-time token refresh on a 401, and its own failure codes.
- path: src/features/ingest/api/_transforms.ts
  change: Declares the wire shapes of the ingestion requests and answers and maps them to the run, the
    summary and the affected nodes.
- path: src/features/ingest/api/index.ts
  change: Re-exports the api surface of the feature.
- path: src/features/ingest/api/keys.ts
  change: Declares the query keys of the ingest feature.
- path: src/features/ingest/api/useIngestGraphAssembly.ts
  change: Assembles the graph of an ingestion from one depth-one traversal per affected node.
- path: src/features/ingest/api/useIngestRawInformation.ts
  change: Records the source through the ingest raw information request.
- path: src/features/ingest/api/useIngestRunStatus.ts
  change: Reads an LLM run and polls it every five seconds until it ends.
- path: src/features/ingest/api/useRetryLlmRun.ts
  change: Retries a failed run through the retry request.
- path: src/features/ingest/api/useRunLlmExtraction.ts
  change: Starts the extraction of a run, with no client cutoff.
- path: src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
  change: Takes a dropped or picked text file into the content and rejects any other.
- path: src/features/ingest/components/IngestDropzone/IngestDropzone.types.ts
  change: Declares the props of the file area.
- path: src/features/ingest/components/IngestDropzone/index.ts
  change: Re-exports the file area.
- path: src/features/ingest/components/IngestPanel/IngestPanel.tsx
  change: Renders the ingest form, progress, outcome, known-content notice and failure for the phase it
    is given.
- path: src/features/ingest/components/IngestPanel/IngestPanel.types.ts
  change: Declares the phases and the props of the ingest panel.
- path: src/features/ingest/components/IngestPanel/IngestSummary.tsx
  change: Shows the seven counts of a run summary.
- path: src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx
  change: Shows the failure of an ingestion with the retry and reset actions.
- path: src/features/ingest/components/IngestPanel/_IngestNoopNotice.tsx
  change: Tells the owner the content was already ingested and offers to view its graph.
- path: src/features/ingest/components/IngestPanel/index.ts
  change: Re-exports the ingest panel.
- path: src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  change: Lays out the ingest panel beside the graph or a selected node's detail.
- path: src/features/ingest/components/IngestWorkspace/IngestWorkspace.types.ts
  change: Declares the props of the ingest workspace.
- path: src/features/ingest/components/IngestWorkspace/_utils.ts
  change: Classifies a failure for the owner and decides whether an extraction failure is a connection
    drop.
- path: src/features/ingest/components/IngestWorkspace/index.ts
  change: Re-exports the ingest workspace.
- path: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  change: Runs the ingestion from submission to the graph, with the polling fallback and the retry paths.
- path: src/features/ingest/index.ts
  change: Re-exports the public surface of the ingest feature.
nodes:
- node: contracts/ingest-workspace/bff-ingestion
  conforms: true
  how: "src/features/ingest/api/_request.ts: held at httpIngest, the whole function (lines 149-275), for\
    \ the send-ingestion-request operation. The other operations (ingest-raw-information, run-extraction,\
    \ retry-llm-run, read-llm-run) are not stated in this file. — throw new EnvelopeError({\n  code:\n\
    \    typeof errObj?.code === \"string\"\n      ? errObj.code\n      : response.status >= 500\n   \
    \     ? \"SYSTEM_UPSTREAM\"\n        : \"SYSTEM_UNKNOWN\",\n...\nif (response.status === 204) return\
    \ undefined as unknown as T;\nreturn (await response.json()) as T;\nsrc/features/ingest/api/_transforms.ts:\
    \ held at parseIso and parseIsoOrNull (lines 178-189), toIngestRawInformationResult (lines 203-222),\
    \ toLlmRun (lines 238-254), and the request and response wire types (lines 51-62, 77-87, 101-115,\
    \ 117-123) — throw new Error(`Invalid ISO date string: ${value}`);\nstartedAt: parseIso(wire.started_at),\n\
    finishedAt: parseIsoOrNull(wire.finished_at),\nreadonly reason?: string;\nexport type RunLlmExtractionRequestWire\
    \ = Record<string, never>;\nsrc/features/ingest/api/useIngestRawInformation.ts: held at the `mutationFn`\
    \ of `useIngestRawInformation` and the `UseIngestRawInformationVariables` interface. The answer is\
    \ read in `toIngestRawInformationResult`, which is another file's. — \"/api/v1/ingest/raw-information\"\
    , { method: \"POST\", headers: { ...authHeader(), \"Content-Type\": \"application/json\" }, body:\
    \ JSON.stringify(vars) } with readonly source_type: SourceTypeWire; content: string; model: string;\
    \ prompt_version: string; metadata?: Record<string, unknown>\nsrc/features/ingest/api/useIngestRunStatus.ts:\
    \ held at the queryFn of useIngestRunStatus (lines 79-85) holds only the read-llm-run request. Everything\
    \ else in the contract is held in other files. — const wire = await httpIngest<LlmRunWire>(\n  `/api/v1/ingest/llm-runs/${encodeURIComponent(params.llmRunId\
    \ as string)}`,\n  { method: \"GET\", headers: authHeader() },\n);\nreturn toLlmRun(wire);\nsrc/features/ingest/api/useRetryLlmRun.ts:\
    \ held at the mutationFn of useRetryLlmRun, lines 51-65: the body choice (`reason` given or `{}`),\
    \ the POST to the retry path, and the read through toLlmRun. The extraction is not started in this\
    \ file. — const body: RetryLlmRunRequestWire =\n  reason !== undefined ? { reason } : {};\nconst wire\
    \ = await httpIngest<LlmRunWire>(\n  `/api/v1/ingest/llm-runs/${encodeURIComponent(llm_run_id)}/retry`,\n\
    \  {\n    method: \"POST\",\n    headers: { ...authHeader(), \"Content-Type\": \"application/json\"\
    \ },\n    body: JSON.stringify(body),\n  },\n);\nreturn toLlmRun(wire);\nsrc/features/ingest/api/useRunLlmExtraction.ts:\
    \ held at the run-extraction operation in mutationFn, lines 45-57. It issues POST to the llm-runs\
    \ run path and reads the answer through toLlmRun. — await httpIngest<LlmRunWire>(\n  `/api/v1/ingest/llm-runs/${encodeURIComponent(llm_run_id)}/run`,\n\
    \  { method: \"POST\", ... body: JSON.stringify({}), ingest: true }\n);\nreturn toLlmRun(wire);"
  encoded_at:
  - src/features/ingest/api/_request.ts
  - src/features/ingest/api/_transforms.ts
  - src/features/ingest/api/useIngestRawInformation.ts
  - src/features/ingest/api/useIngestRunStatus.ts
  - src/features/ingest/api/useRetryLlmRun.ts
  - src/features/ingest/api/useRunLlmExtraction.ts
- node: contracts/ingest-workspace/bff-traversal
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the `queryFn` request in `useIngestGraphAssembly`
    (lines 157-161), and the `TraverseNodeMinWire`, `TraverseLinkMinWire` and `TraverseResultMinWire`
    interfaces (lines 56-79) — `/api/v1/nodes/${encodeURIComponent(id)}/traverse?depth=1&direction=both`,
    { method: "GET", headers: authHeader() }

    interface TraverseResultMinWire { readonly starting_node_id?: string; readonly nodes?: ...; readonly
    links?: ... }'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: contracts/ingest-workspace/ingest-screen
  conforms: false
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts, the second branch of classifyError(),\
    \ lines 23-25: if (err instanceof Error) {\n    return { code: \"SYSTEM_UNKNOWN\", message: err.message\
    \ };\n  } — The contract gives the fallback \"Erro desconhecido.\" for a failure that has no message\
    \ of its own. Here the fallback applies only to a thrown value that is not an Error. An Error with\
    \ an empty message goes through with message \"\", so the owner sees \"Erro na ingestão\" with a blank\
    \ body. The fallback text the specification names is not shown in that case."
  observed_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: contracts/knowledge-base/ingestion
  conforms: true
  how: 'src/features/ingest/api/_transforms.ts: held at the wire types IngestRawInformationResponseWire,
    ChunkRefWire, LlmRunWire and AffectedNodeWire (lines 44-49, 71-87, 101-115) — readonly outcome: "created"
    | "noop_existing";

    readonly chunks: ReadonlyArray<ChunkRefWire>;

    readonly idempotency_key: string;

    readonly affected_nodes?: ReadonlyArray<AffectedNodeWire>;'
  encoded_at:
  - src/features/ingest/api/_transforms.ts
- node: domain/ingest-workspace/ingest-failure
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the inline return type of classifyError(),\
    \ lines 16-19 — {\n  readonly code: string;\n  readonly message: string;\n}"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: domain/ingest-workspace/ingest-phase
  conforms: true
  how: "src/features/ingest/components/IngestPanel/IngestPanel.types.ts: held at the exported union type\
    \ IngestPhase, lines 18-27 — export type IngestPhase =\n  | \"idle\" | \"ready\" | \"sending\" | \"\
    noop\" | \"extracting\" | \"polling\" | \"revealing\" | \"complete\" | \"error\";\n(each member sits\
    \ on its own line in the source)"
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.types.ts
- node: domain/ingest-workspace/ingest-session
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx: held at Only in part. The\
    \ form-state `useState` declarations for `content` and `sourceType` (lines 46-47), and the destructuring\
    \ of `phase`, `summary`, `errorCode`, `errorMessage` and `validationMessage` from `useIngestOrchestration`\
    \ (lines 59-69). The session's shape is not declared in this file, and the run identity and the affected\
    \ nodes do not appear here at all. Both live in useIngestOrchestration.ts, which is outside this file\
    \ set. — const [content, setContent] = useState<string>(\"\");\nconst [sourceType, setSourceType]\
    \ = useState<IngestSourceType | \"\">(\"\");\n...\nconst {\n  phase,\n  summary,\n  errorCode,\n \
    \ errorMessage,\n  validationMessage,\nsrc/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts:\
    \ held at the useState declarations (lines 61-72) and the UseIngestOrchestrationResult interface (lines\
    \ 44-54) — const [phase, setPhase] = useState<IngestPhase>(\"idle\"); const [llmRunId, setLlmRunId]\
    \ = useState<string | null>(null); const [affectedNodes, setAffectedNodes] = ...; const [summary,\
    \ setSummary] = ...; const [errorCode, setErrorCode] ...; const [validationMessage, setValidationMessage]\
    \ ..."
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: domain/knowledge-base/assertion-flag
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the `flags` field of `TraverseLinkMinWire`,
    line 72 — readonly flags?: ReadonlyArray<"uncertain" | "disputed" | "low_confidence">;'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the `status` field of `TraverseNodeMinWire`,
    line 60 — readonly status?: "active" | "needs_review" | "merged" | "deleted";'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: domain/knowledge-base/run-status
  conforms: true
  how: 'src/features/ingest/api/_transforms.ts: held at LlmRunStatusWire, line 42 — export type LlmRunStatusWire
    = "running" | "completed" | "failed";'
  encoded_at:
  - src/features/ingest/api/_transforms.ts
- node: domain/knowledge-base/run-summary
  conforms: true
  how: 'src/features/ingest/api/_transforms.ts: held at LlmRunSummaryWire, lines 89-99, with toLlmRunSummary
    and the LlmRunSummary type mirroring it — readonly accepted: number;

    readonly consolidated: number;

    readonly superseded_previous: number;

    readonly needs_review: number;

    readonly uncertain: number;

    readonly disputed: number;

    readonly rejected: number;

    readonly error: number;

    readonly orphaned_fragments: number;'
  encoded_at:
  - src/features/ingest/api/_transforms.ts
- node: domain/knowledge-base/source-type
  conforms: false
  how: "src/features/ingest/api/_transforms.ts, the SourceTypeWire declaration, lines 29-36 (also aliased\
    \ as IngestSourceType, line 40): export type SourceTypeWire =\n  | \"pdf\"\n  | \"email\"\n  | \"\
    ata\"\n  | \"chat\"\n  | \"artigo\"\n  | \"transcricao\"\n  | \"outro\";\nThe node's enumeration reads:\n\
    values:\n- pdf\n- email\n- meeting-minutes\n- chat\n- article\n- transcript\n- other — The file declares\
    \ the source-type vocabulary with four values spelled differently from the node that governs it (ata,\
    \ artigo, transcricao and outro against meeting-minutes, article, transcript and other). The node's\
    \ own description says ata, artigo, transcricao and outro are \"the material's own words\" for those\
    \ values, so it does not make them wire values. The candidate node contracts/ingest-workspace/ingest-screen\
    \ does hold \"the source types pdf, email, ata, chat, artigo, transcricao and outro\". The two nodes\
    \ disagree, and this file follows the second. When the node changes, nobody can tell which spelling\
    \ was decided.\nno file of the set holds this fact beside what was found against it"
  observed_at:
  - src/features/ingest/api/_transforms.ts
- node: rules/ingest-workspace/another-document-clears-the-session
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx: held at Only in part. `resetForm`\
    \ (lines 52-56) clears three of the node's items: the content, the source type and the selected node.\
    \ The run identity, the affected nodes, the summary, the failure, the validation message and the return\
    \ to idle are not in this file. They sit behind `handleReset`, which comes from useIngestOrchestration.ts\
    \ and is outside this file set. — const resetForm = useCallback(() => {\n  setContent(\"\");\n  setSourceType(\"\
    \");\n  setSelectedNode(null);\n}, []);\nsrc/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts:\
    \ held at handleReset, lines 205-217 — resetForm(); setLlmRunId(null); setAffectedNodes(null); setIsPolling(false);\
    \ setAssemblyEnabled(false); setSummary(null); setErrorCode(null); setErrorMessage(null); setValidationMessage(null);\
    \ setPhase(\"idle\"); useGraphStore.getState().clear();"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/assembled-link-carries-only-what-the-bff-states
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at `mapTraverseLink`, lines 93-118 — isTemporal:
    wire.is_temporal === true,

    const state = wire.status !== undefined ? deriveLinkState(wire.status, wire.flags) : undefined;

    if (wire.is_in_effect !== undefined && state !== undefined) { return { ...base, inEffect: wire.is_in_effect,
    state }; }'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-link-is-kept-once-by-identity
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the link merge in the effect, line
    236 — linkMap.set(wl.id, mapTraverseLink(wl));'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-neighbour-state-comes-from-its-status
  conforms: true
  how: "src/features/ingest/api/useIngestGraphAssembly.ts: held at `mapTraverseNode`, lines 87-90, and\
    \ the affected-node seeding loop, lines 213-219 — if (wire.status === undefined) return base;\n  const\
    \ state = deriveNodeState(wire.status);\n...\nnodeMap.set(n.id, { id: n.id, type: mapNodeType(n.nodeType),\
    \ label: n.canonicalName, });"
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-node-is-labelled-by-its-canonical-name
  conforms: true
  how: "src/features/ingest/api/useIngestGraphAssembly.ts: held at `mapTraverseNode` (lines 82-86) and\
    \ the seeding loop (lines 214-218) — type: mapNodeType(wire.node_type),\n    label: wire.canonical_name,"
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-node-keeps-the-entry-it-got-first
  conforms: true
  how: "src/features/ingest/api/useIngestGraphAssembly.ts: held at the seeding loop before the merge and\
    \ the guard at lines 231-233 — if (!nodeMap.has(wn.id)) {\n    nodeMap.set(wn.id, mapTraverseNode(wn));\n\
    \  }"
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembly-of-no-nodes-is-an-empty-ready-graph
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the `totalCount === 0` branch of the
    effect, lines 185-199 — const delta: GraphDelta = { sourceTool: "ingest_assembly", nodes: [], links:
    [], };

    useGraphStore.getState().replaceNodes(delta);

    useGraphStore.getState().setStatus("ready");'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembly-replaces-the-graph-only-when-every-traversal-succeeds
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the completion gate and the end of
    the effect, lines 200 and 245-246 — if (successCount !== totalCount) return; // wait for all to settle

    ...

    useGraphStore.getState().replaceNodes(delta);

    useGraphStore.getState().setStatus("revealing");'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembly-traverses-each-affected-node
  conforms: true
  how: "src/features/ingest/api/useIngestGraphAssembly.ts: held at the `useQueries` call, lines 154-167\
    \ — queries: ids.map((id) => ({ queryKey: ingestKeys.traverse(id), queryFn: async () => { return http<TraverseResultMinWire>(`/api/v1/nodes/${encodeURIComponent(id)}/traverse?depth=1&direction=both`,\
    \ ...\n      enabled,"
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the EnvelopeError branch of\
    \ isConnectionDropError(), lines 33-47 — if (err.httpStatus === 409 || err.httpStatus === 422) return\
    \ false;\n    if (err.code === \"SYSTEM_LLM_PROVIDER_UNAVAILABLE\") return false;\n    if (err.code\
    \ === \"AUTH_SESSION_EXPIRED\") return false; // handled globally\n    if (err.code === \"SYSTEM_ABORTED\"\
    ) return false; // user-driven, no UI\n    // Any other code → treat as drop (graceful degradation\
    \ per spec §4).\n    return true;"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/connection-drop-polls-the-run
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the runMutation
    onError branches in handleSubmit (lines 179-185) and handleRetry (lines 253-258) — if (isConnectionDropError(err))
    { setIsPolling(true); setPhase("polling"); return; }'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/content-is-checked-before-source-type
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the order of
    the two guards in handleSubmit, lines 130-139 — if (content.length < 1) { setValidationMessage("Cole
    ou arraste o conteúdo do documento antes de ingerir."); return; } if (sourceType === "") {'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/disabled-file-area-ignores-input
  conforms: true
  how: 'src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at the early returns in
    openPicker (line 58, reached by onClick), onZoneKeyDown (line 97) and onDrop (line 128) — const openPicker
    = useCallback(() => { if (disabled) return; inputRef.current?.click(); }

    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {

    if (disabled) return;

    e.preventDefault(); ... handleFiles(e.dataTransfer.files);'
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/editing-changes-the-phase-only-in-idle-and-ready
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the form-to-phase
    effect, lines 90-96 — if (current !== "idle" && current !== "ready") return current;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/existing-graph-is-assembled-on-request
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleAssembleExisting,
    lines 220-223 — setAssemblyEnabled(true); setPhase("revealing");'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/extraction-answer-moves-to-revealing
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the runMutation
    onSuccess in handleSubmit (lines 168-178) and in handleRetry (lines 242-252) — setSummary(run.summary);
    if (run.affectedNodes !== undefined && run.affectedNodes.length > 0) { setAffectedNodes(run.affectedNodes);
    } setAssemblyEnabled(true); setPhase("revealing");'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/extraction-has-no-client-cutoff
  conforms: true
  how: "src/features/ingest/api/_request.ts: held at the ingestMode === true branch of httpIngest, lines\
    \ 160-162 — if (ingestMode === true) {\n  signal = userSignal;\n} else {\nsrc/features/ingest/api/useRunLlmExtraction.ts:\
    \ held at the `ingest: true` option passed to httpIngest, line 54. The code that skips the cutoff\
    \ in response sits in _request.ts, outside this file set. — ingest: true,"
  encoded_at:
  - src/features/ingest/api/_request.ts
  - src/features/ingest/api/useRunLlmExtraction.ts
- node: rules/ingest-workspace/failed-traversal-leaves-the-graph-as-it-was
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the `hasError` computation (line 176),
    returned at line 249, and the early return that skips replacement unless every traversal has succeeded
    (line 200) — const hasError = results.some((r) => r.status === "error");

    ...

    if (successCount !== totalCount) return; // wait for all to settle'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/failure-envelope-shows-its-own-code-and-message
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the EnvelopeError branch of\
    \ classifyError(), lines 20-22 — if (err instanceof EnvelopeError) {\n    return { code: err.code,\
    \ message: err.message };\n  }"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/failure-outside-an-envelope-is-no-connection-drop
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/_utils.ts: held at the final return of isConnectionDropError(),
    line 50 — return false;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/failure-outside-an-envelope-shows-the-unknown-code
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the two non-envelope returns\
    \ of classifyError(), lines 23-26 — return { code: \"SYSTEM_UNKNOWN\", message: err.message };\n \
    \ }\n  return { code: \"SYSTEM_UNKNOWN\", message: \"Erro desconhecido.\" };"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/fields-are-editable-outside-a-run
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at isInputDisabled, lines 59-71,
    with its result passed as `disabled` to the Textarea and the Select — case "sending": case "extracting":
    case "polling": case "revealing": case "complete": case "noop": return true; default: return false;'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/file-area-shows-only-in-idle-and-ready
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the showDropzone constant,
    line 119, and its conditional render, lines 149-154 — const showDropzone = phase === "idle" || isReadyPhase;'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/file-read-replaces-the-content
  conforms: true
  how: "src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at the reader.onload callback\
    \ in handleFiles, lines 74-80 — reader.onload = () => {\n  const result = reader.result;\n  if (typeof\
    \ result !== \"string\") return;\n  setError(null);\n  onContent(result);"
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/first-unauthorized-answer-refreshes-the-token-once
  conforms: true
  how: "src/features/ingest/api/_request.ts: held at the 401 branch of httpIngest, lines 202-218, and\
    \ trySilentRefresh, lines 122-133 — if (response.status === 401 && __retried !== true) {\n  const\
    \ refreshed = await trySilentRefresh();\n...\nconst newJwt = await fetchAccessToken();\nuseAuthStore.getState().setToken(newJwt);"
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: rules/ingest-workspace/form-is-ready-with-content-and-source-type
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the canSubmit constant, line
    111. Its content and source-type conjuncts are this rule, and the phase conjunct belongs to the submit
    rule. The condition has no trim, so whitespace-only content counts as content. — const canSubmit =
    isReadyPhase && content.length >= 1 && sourceType !== "";

    src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the form-to-phase
    effect, lines 90-96 — const isReady = content.length >= 1 && sourceType !== ""; return isReady ? "ready"
    : "idle";'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/ingest-requires-content
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the first guard
    of handleSubmit, lines 130-135 — if (content.length < 1) { setValidationMessage("Cole ou arraste o
    conteúdo do documento antes de ingerir."); return; }'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/ingest-requires-source-type
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the second guard
    of handleSubmit, lines 136-139 — if (sourceType === "") { setValidationMessage("Selecione o tipo de
    fonte antes de ingerir."); return; }'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/ingestion-request-carries-the-access-token
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at authHeader(), lines 43-46, and the Authorization
    header set on the resend, lines 209-212 — return token !== null ? { Authorization: `Bearer ${token}`
    } : {};

    src/features/ingest/api/useIngestRawInformation.ts: held at the headers of the request in `mutationFn`.
    The file applies `authHeader()` to the request; whether it yields a bearer or no header is decided
    where `authHeader` is defined, in "./_request", which was not read. — headers: { ...authHeader(),
    "Content-Type": "application/json" }

    src/features/ingest/api/useIngestRunStatus.ts: held at the `headers: authHeader()` argument of the
    request in the queryFn (line 82). The file only delegates to authHeader and httpIngest, imported from
    ./_request, so the bearer logic itself is not in this file. — { method: "GET", headers: authHeader()
    },

    src/features/ingest/api/useRunLlmExtraction.ts: held at the `authHeader()` spread in the request headers,
    line 49. authHeader itself is declared in _request.ts, outside this file set. — headers: { ...authHeader(),
    "Content-Type": "application/json" },'
  encoded_at:
  - src/features/ingest/api/_request.ts
  - src/features/ingest/api/useIngestRawInformation.ts
  - src/features/ingest/api/useIngestRunStatus.ts
  - src/features/ingest/api/useRunLlmExtraction.ts
- node: rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
  conforms: true
  how: "src/features/ingest/api/_request.ts: held at the else branch of the signal composition in httpIngest,\
    \ lines 163-170, with DEFAULT_TIMEOUT_MS at line 64 — const DEFAULT_TIMEOUT_MS = 30_000;\n...\nconst\
    \ timer = setTimeout(() => {\n  timeoutController.abort(\n    new DOMException(\"Request timed out\
    \ after 30s\", \"TimeoutError\"),\n  );\n}, DEFAULT_TIMEOUT_MS);"
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: rules/ingest-workspace/known-content-waits-for-the-owner
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the noop branch
    of handleSubmit''s onSuccess, lines 157-161 — if (data.outcome === "noop_existing") { setAffectedNodes(data.affectedNodes
    ?? []); setPhase("noop"); return; }'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/new-source-starts-extraction-at-once
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit''s
    onSuccess after the noop return, lines 164-166 — setPhase("extracting"); runMutation.mutate( { llm_run_id:
    data.llmRunId },'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/noop-keeps-the-affected-nodes
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at line 158 — setAffectedNodes(data.affectedNodes
    ?? []);'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/only-extraction-failures-count-as-connection-drops
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the onError
    handlers of ingestMutation (lines 194-199) and retryMutation (lines 267-272), neither of which calls
    isConnectionDropError — onError: (err) => { const { code, message } = classifyError(err); setErrorCode(code);
    setErrorMessage(message); setPhase("error"); },'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/only-text-files-are-accepted
  conforms: true
  how: 'src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at isTxtFile, lines 38-42,
    used by the guard at line 67 — if (file.type === "text/plain") return true;

    if (file.type.startsWith("text/")) return true;

    return file.name.toLowerCase().endsWith(".txt");'
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/only-the-first-file-is-used
  conforms: true
  how: 'src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at handleFiles, lines 64-66
    — const file = files[0];

    if (!file) return;'
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/outcome-shows-the-seven-counts-in-order
  conforms: true
  how: "src/features/ingest/components/IngestPanel/IngestSummary.tsx: held at the ROWS array, lines 27-35,\
    \ rendered in array order by `ROWS.map` at line 43. It has exactly seven rows and omits superseded_previous\
    \ and orphaned_fragments. — const ROWS: ReadonlyArray<Row> = [\n  { key: \"accepted\", label: \"Aceitos\"\
    \ },\n...\n  { key: \"error\", label: \"Erros\" },\n];\n{ROWS.map(({ key, label }) => ("
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestSummary.tsx
- node: rules/ingest-workspace/polled-completed-run-moves-to-revealing
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the polling
    effect, completed branch, lines 110-117 — if (run.status === "completed") { setIsPolling(false); setSummary(run.summary);
    if (run.affectedNodes !== undefined && run.affectedNodes.length > 0) { setAffectedNodes(run.affectedNodes);
    } setAssemblyEnabled(true); setPhase("revealing");'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/polled-failed-run-ends-in-run-failed
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the polling
    effect, failed branch, lines 118-125 — } else if (run.status === "failed") { setIsPolling(false);
    setErrorCode("RUN_FAILED"); setErrorMessage( "A extração falhou. Reabra a execução para tentar novamente.",
    ); setPhase("error");'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/polled-running-run-keeps-the-screen-waiting
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the polling
    effect, which has no branch for a run that is neither completed nor failed, so the phase stays polling
    and polling continues, lines 106-126 — if (run.status === "completed") { ... } else if (run.status
    === "failed") { ... }'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/recorded-source-keeps-the-run-identity
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit''s
    onSuccess, before the outcome branch, line 154 — setLlmRunId(data.llmRunId);'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/rejection-stays-until-a-file-is-read
  conforms: true
  how: 'src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at the single place that
    clears the error, setError(null) inside reader.onload (line 77). The rejection branch sets it (line
    70). No other handler clears it. — setError(REJECT_MESSAGE);

    return;

    ...

    setError(null);

    onContent(result);'
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/resent-request-never-refreshes-again
  conforms: true
  how: "src/features/ingest/api/_request.ts: held at the `__retried !== true` guard at line 202, and `__retried:\
    \ true` on the recursive call at line 216 — if (response.status === 401 && __retried !== true) {\n\
    ...\nreturn httpIngest<T>(path, {\n  ...opts,\n  headers: Object.fromEntries(nextHeaders.entries()),\n\
    \  __retried: true,\n});"
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the RETRYABLE_ERROR_CODES
    Set, lines 48-57, and isRetryable, line 113. The six codes match the node''s list exactly. — new Set(["SYSTEM_LLM_PROVIDER_UNAVAILABLE",
    "SYSTEM_INTERNAL_ERROR", "SYSTEM_UPSTREAM", "SYSTEM_TIMEOUT", "SYSTEM_NETWORK", "RUN_FAILED"]);

    const isRetryable = errorCode !== undefined && RETRYABLE_ERROR_CODES.has(errorCode);'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/retry-with-a-run-retries-then-extracts
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleRetry,
    lines 232-274 — setErrorCode(null); setErrorMessage(null); setPhase("extracting"); retryMutation.mutate(
    { llm_run_id: llmRunId }, { onSuccess: () => { runMutation.mutate( { llm_run_id: llmRunId },'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/retry-without-a-run-submits-again
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleRetry,
    lines 227-231 — if (llmRunId === null) { ... handleSubmit(); return; }'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/revealing-completes-when-the-graph-is-ready
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the revealing-to-complete
    effect, lines 99-103 — if (phase === "revealing" && graphStatus === "ready") { setPhase("complete");
    }'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/review-count-points-to-curation
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the needs-review notice inside
    the outcome block, lines 252-259 — {summary.needsReview > 0 ? ( <p data-testid="ingest-needs-review-notice"
    ...> Alguns nós aguardam revisão. Acesse Curadoria para detalhes. </p> ) : null}'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/run-is-polled-every-five-seconds
  conforms: true
  how: 'src/features/ingest/api/useIngestRunStatus.ts: held at INGEST_RUN_POLL_MS and terminalAwareRefetchInterval
    (lines 58-68), wired in as `refetchInterval` (line 92) — export const INGEST_RUN_POLL_MS = 5_000;

    const status = query.state.data?.status;

    if (status === "completed" || status === "failed") return false;

    return INGEST_RUN_POLL_MS;'
  encoded_at:
  - src/features/ingest/api/useIngestRunStatus.ts
- node: rules/ingest-workspace/run-is-read-only-with-an-identity-and-the-gate
  conforms: true
  how: "src/features/ingest/api/useIngestRunStatus.ts: held at the `hasRunId` and `enabled` constants\
    \ of useIngestRunStatus (lines 73-75), passed as `enabled` to useQuery (line 86) — const hasRunId\
    \ =\n  typeof params.llmRunId === \"string\" && params.llmRunId.length > 0;\nconst enabled = hasRunId\
    \ && (params.enabled ?? true);"
  encoded_at:
  - src/features/ingest/api/useIngestRunStatus.ts
- node: rules/ingest-workspace/selected-node-detail-replaces-the-graph
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx: held at The conditional render\
    \ in the right column, lines 121-140. `handleNodeSelect` and `handleDetailClose` (lines 80-89) set\
    \ and clear only `selectedNode`, so `phase` is never changed by them. — {selectedNode !== null ? (\n\
    \  <NodeDetailPanel\n    nodeId={selectedNode.id}\n    ...\n    onClose={handleDetailClose}\n  />\n\
    ) : (\n  <GraphSpace"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
- node: rules/ingest-workspace/submission-clears-earlier-messages
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit,
    lines 140-143, after both guards and before the phase moves to sending — setValidationMessage(null);
    setErrorCode(null); setErrorMessage(null); setPhase("sending");'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/submit-control-shows-in-idle-ready-and-sending
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the showSubmit constant, line
    112, and the Button''s disabled prop, line 202 — const showSubmit = phase === "idle" || isReadyPhase
    || isSendingPhase;

    disabled={!canSubmit || isSendingPhase}'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/submit-needs-the-ready-phase
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the canSubmit constant, line
    111, and the guard in the form''s onSubmit handler, line 145 — const canSubmit = isReadyPhase && content.length
    >= 1 && sourceType !== "";

    if (canSubmit) onSubmit();'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/unrefreshable-session-ends-at-sign-in
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at the catch of trySilentRefresh, lines 127-132 — useAuthStore.getState().clear();

    redirectImpl("/sign-in?reason=session_expired");

    return false;'
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: scenarios/ingest-workspace/conflicting-extraction-shows-the-failure
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/_utils.ts: held at the 409 and 422 guard in isConnectionDropError(),
    line 36, together with the envelope return of classifyError(), lines 20-22 — if (err.httpStatus ===
    409 || err.httpStatus === 422) return false;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: scenarios/ingest-workspace/expired-token-is-refreshed-once-and-resent
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at the 401 branch of httpIngest, lines 202-218, which
    stores the new token and recurses once — useAuthStore.getState().setToken(newJwt);

    ...

    nextHeaders.set("Authorization", `Bearer ${fresh}`);

    ...

    __retried: true,'
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: scenarios/ingest-workspace/internal-error-during-extraction-polls-the-run
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the fall-through return true\
    \ of isConnectionDropError(), line 46, reached by SYSTEM_INTERNAL_ERROR at status 500 — // Any other\
    \ code → treat as drop (graceful degradation per spec §4).\n  return true;"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: scenarios/ingest-workspace/whitespace-only-content-is-ready
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the canSubmit constant, line
    111. The length check is not trimmed, so a content of only spaces satisfies it. — const canSubmit
    = isReadyPhase && content.length >= 1 && sourceType !== "";

    src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the form-to-phase
    effect, lines 90-96, which tests length only and does not trim — const isReady = content.length >=
    1 && sourceType !== "";'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
unstated:
- file: src/features/ingest/api/_request.ts
  where: the SYSTEM_TIMEOUT / SYSTEM_ABORTED / SYSTEM_NETWORK EnvelopeError (lines 184-197) and the SYSTEM_INVALID_RESPONSE
    EnvelopeError (lines 232-237)
  evidence: 'httpStatus: 0,

    message: isTimeout

    ...

    details: { cause: String(err) }

    ...

    code: "SYSTEM_INVALID_RESPONSE",

    httpStatus: response.status,

    message: "Resposta do servidor não é JSON válido.",

    details: { cause: String(err) },'
  cost: The node gives these failures a code and a message only. The code also decides that a request
    that never got an answer carries status 0, and that these failures carry a details object holding
    the stringified cause. A reader looking for what a failure carries finds it only here.
- file: src/features/ingest/api/_transforms.ts
  where: IngestRawInformationRequestWire, line 54
  evidence: 'readonly storage_ref?: string | null;'
  cost: The request shape lets the caller send a storage reference. The consumed contract names the ingest-raw-information
    body as "source_type, content, model, prompt_version and an optional metadata", with no storage reference.
    The published ingestion contract states no request fields, so no node says that the screen may send
    one. The field exists only in the code, and the next reader of the specification will not find it.
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: 'line 49 (`TRAVERSE_STALE_MS`) and its use in the `useQueries` options, with `refetchOnWindowFocus:
    false`'
  evidence: "const TRAVERSE_STALE_MS = 5 * 60_000;\n...\n      staleTime: TRAVERSE_STALE_MS,\n      refetchOnWindowFocus:\
    \ false,"
  cost: A traversal answer is reused without a new request for five minutes and is never refetched on
    window focus. No node holds either figure; the only node that mentions five minutes is the extraction-call
    cutoff, which is a different fact. The freshness the ingest screen shows after a repeated ingestion
    therefore depends on a number found only in the code.
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: the `lastAppliedRef` guard in the effect, lines 182-206 (both the "empty" key and the sorted-id
    key)
  evidence: "const key = ids.slice().sort().join(\"|\");\n    if (lastAppliedRef.current === key) return;\n\
    \    lastAppliedRef.current = key;"
  cost: 'The code skips replacing the graph when the same set of affected node ids is assembled again,
    and it also skips the empty case after a first empty assembly. The comment names the case: "if the
    caller re-runs the assembly with the same affected nodes (e.g. user clicks "Ver grafo existente" twice)
    we don''t redundantly replace". No node holds this skip, and the node that governs replacement says
    the graph is replaced once every traversal has succeeded, with no exception for a repeat. The behaviour
    lives only in this ref, so the next reader looks for it in the specification and does not find it.'
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: 'the `sourceTool: "ingest_assembly"` literal on both `GraphDelta` values (lines 192 and 241)'
  evidence: 'sourceTool: "ingest_assembly",'
  cost: The code stamps every assembled delta with this name. No node in the set or in the specification
    names it, so the vocabulary of delta origins has no home a reader could consult.
- file: src/features/ingest/api/useIngestRunStatus.ts
  where: '`retry: 2` in the useQuery options (line 95), with its comment on lines 93-94'
  evidence: '// Polling is resilient — one extra retry helps small blips not kill

    // the loop. The global default is 1; we bump to 2 to be defensive.

    retry: 2,'
  cost: The code makes a failed run read be attempted again twice before the failure surfaces. That decides
    how long the owner waits before a failure shows and how often the BFF is hit. No node holds it. I
    searched projections/full-text.md for retry, poll, stale and focus and found no rule that fixes the
    retry count of a run read. The value lives only here, so the next reader looks in the specification
    and does not find it. The rule on the five-second read says nothing about retries.
- file: src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
  where: the constants ZONE_LABEL and HELPER_TEXT (lines 27-28) and the paragraph rendered at line 170
  evidence: "const ZONE_LABEL = \"Área para arrastar ou carregar arquivo .txt\";\nconst HELPER_TEXT =\
    \ \"Arraste um .txt ou cole o texto abaixo.\";\n<p className=\"text-xs text-foreground\">\n  Arraste\
    \ um arquivo .txt ou clique para selecionar\n</p>"
  cost: 'These three strings are what the file area tells the owner: the accessible label, the helper
    line and the visible prompt. No node holds them. The specification covers only the rejection message
    under load-file, so the wording lives only in this component. Whoever looks in the specification for
    what the area says will not find it.'
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the INGEST_MODEL constant, line 35, sent as `model` in handleSubmit (line 149)
  evidence: const INGEST_MODEL = "claude-opus-4-8";
  cost: The model that every ingestion started from the screen runs under, and that is recorded on the
    LLM run, is chosen only here. No node of the ingest screen states it. The bff-ingestion contract says
    only that `model` is sent as given. The one extraction-model default the specification holds, rules/knowledge-base/default-extraction-model,
    names claude-sonnet-4-6 and governs a document ingestion that names no model, whereas this screen
    always names one. A reader looking for which model the owner's ingestions use will not find it in
    the specification, and a change of model is a code edit nobody decided.
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the INGEST_PROMPT_VERSION constant, line 36, sent as `prompt_version` in handleSubmit (line 150)
  evidence: const INGEST_PROMPT_VERSION = "v3";
  cost: The prompt version every screen ingestion runs under is chosen only here, and it decides which
    extraction instructions apply. The specification states instructions per prompt version (v2, v3, v4),
    and a document ingestion that names no prompt version runs under v4. This screen pins v3 with no node
    stating it. A reader checking the screen against the specification will see v4 as the default and
    will not learn that the screen differs.
restates:
- file: src/features/ingest/api/_request.ts
  where: the JSDoc of httpIngest, lines 145-146
  evidence: '*    On failure, clears the auth store + redirects to

    *    `/sign-in?reason=session_expired` and throws `AUTH_SESSION_EXPIRED`.'
  cost: The sign-in redirect address and the clearing of the token are restated in a docstring. The code
    holds both in the catch of trySilentRefresh, in useAuthStore.getState().clear() and redirectImpl("/sign-in?reason=session_expired").
  node: rules/ingest-workspace/unrefreshable-session-ends-at-sign-in
- file: src/features/ingest/api/_request.ts
  where: the comment on authHeader, line 42
  evidence: '/** Build the `Authorization: Bearer <jwt>` header when a token is present. */'
  cost: The bearer-when-held rule is restated in a comment above the code that implements it in authHeader().
    The comment is a second statement of the rule.
  node: rules/ingest-workspace/ingestion-request-carries-the-access-token
- file: src/features/ingest/api/_request.ts
  where: the header docstring, lines 27-31 and 32-34; the "ingest" option docstring, lines 52-56; the
    comment on DEFAULT_TIMEOUT_MS, line 63; the comment on the timeout branch, line 157
  evidence: '* - On HTTP 401: same DC silent-refresh story as `lib/http.ts` —

    mint a new JWT once via `fetchAccessToken()` and retry the

    ...

    /** Non-ingest cutoff. Mirrors `lib/http.ts` DEFAULT_TIMEOUT_MS. */'
  cost: The thirty-second cutoff is described again in prose, in several places. The code holds it in
    DEFAULT_TIMEOUT_MS and the setTimeout branch of httpIngest. When the node moves, these comments do
    not follow, and they are a second home for the rule that nothing reads.
  node: rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
- file: src/features/ingest/api/_request.ts
  where: the header docstring, lines 27-31; the JSDoc of httpIngest, lines 143-146; the comment on line
    201
  evidence: '*  - HTTP 401 → attempts DC silent refresh once via `fetchAccessToken()`;

    *    on success, retries the original request once with the new JWT.'
  cost: The refresh-once-and-resend rule is restated in three prose passages. The code holds it in the
    response.status === 401 branch, which calls trySilentRefresh and recurses. Prose and node can drift
    apart without anything noticing.
  node: rules/ingest-workspace/first-unauthorized-answer-refreshes-the-token-once
- file: src/features/ingest/api/_request.ts
  where: the header docstring, lines 30-31; the comment on __retried, lines 58-59
  evidence: "/** INTERNAL — set by the 401 retry path so the second attempt cannot\n *  re-enter the silent-refresh\
    \ branch. Callers MUST NOT set this. */"
  cost: 'The rule that a resent request never refreshes again is restated in comments. The code holds
    it in the `__retried !== true` guard and in the `__retried: true` passed on the recursive call.'
  node: rules/ingest-workspace/resent-request-never-refreshes-again
- file: src/features/ingest/api/_request.ts
  where: the header docstring, lines 32-34; the "ingest" option docstring, lines 52-56; the JSDoc of httpIngest,
    line 147; the comment on line 157
  evidence: '* - The `ingest` option, when true, **skips the client-side 30s cutoff**

    *    — required for `runLlmExtraction` per CLAUDE.md "ingest_document

    *    client timeout ≠ failure". The caller''s `signal` is forwarded as-is.'
  cost: The rule that running extraction has no client cutoff is stated in prose that cites CLAUDE.md
    as its authority. The code holds it in the ingestMode === true branch, where signal = userSignal.
    A reader is sent to CLAUDE.md instead of to the node.
  node: rules/ingest-workspace/extraction-has-no-client-cutoff
- file: src/features/ingest/api/_request.ts
  where: the header docstring, lines 7-16 and 22-26; the JSDoc of httpIngest, lines 138-142; the comments
    on lines 226 and 241
  evidence: 'every 2xx response sends

    the response schema as a **bare body** (no `{ ok, result }` wrapper);

    every 4xx/5xx sends the standard envelope `{ error: { code, message,

    details? } }`.'
  cost: How an answer is read, namely a bare 2xx body and an error object on failures, is described again
    in prose. The code holds it in the 2xx branch and in the errObj extraction. The prose also asserts
    what the back end sends, which is the upstream's fact and not this screen's.
  node: contracts/ingest-workspace/bff-ingestion
- file: src/features/ingest/api/_transforms.ts
  where: the header comment, lines 16-17 ("Design" bullet on date parsing)
  evidence: 'Dates are parsed with `new Date(iso)` and validated via `getTime()`

    NaN check to fail loudly on malformed wire data.'
  cost: The date-refusal rule is stated in the node, in the code of parseIso (line 178) and again in this
    comment. When the node moves, the comment is outside what the bind covers and nothing reads it, so
    a reader can take it as the rule.
  node: contracts/ingest-workspace/bff-ingestion
- file: src/features/ingest/api/_transforms.ts
  where: the header comment, lines 18-22, and the field comments at lines 67-70, 85, 112-113, 143 and
    170
  evidence: "The spec's `affected_nodes?` field is NOT in the current\n *    `IngestRawInformationResponse`\
    \ openapi schema; treated as optional\n *    forward-compat (`undefined` if absent)."
  cost: 'The comments say the optional affected-nodes list is a forward-compat guess the back end may
    not emit. The nodes hold it as part of the answers: ingest-raw-information is read with "an optional
    list of affected nodes", and read-llm-run carries them when the run is completed. A reader who trusts
    the comment will think the fact is unsettled and will look for a decision in the spec divergences,
    not in the nodes. The code already holds it as optional `affected_nodes` in IngestRawInformationResponseWire
    and LlmRunWire.'
  node: contracts/ingest-workspace/bff-ingestion
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: the comment at lines 186-187 in the `totalCount === 0` branch of the effect
  evidence: "// Nothing to traverse — emit an empty delta so the graph clears and\n      // we can move\
    \ out of \"loading\" cleanly."
  cost: The empty-and-ready rule is restated in prose. The "loading" it mentions is not a phase the node
    names.
  node: rules/ingest-workspace/assembly-of-no-nodes-is-an-empty-ready-graph
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: the comment at lines 229-230 inside the traverse-node merge loop
  evidence: "// Don't overwrite the affected-node entry with a thinner traverse\n        // node (the\
    \ affected list is the source of truth for the label)."
  cost: The first-entry-wins rule is restated in prose and gains a rationale ("the source of truth for
    the label") that the node does not state.
  node: rules/ingest-workspace/assembled-node-keeps-the-entry-it-got-first
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: the header docstring, lines 11-16 ("Why `replaceNodes` (not `addNodes`)")
  evidence: "* Why `replaceNodes` (not `addNodes`):\n *  - Each ingest is its own \"session\" — the spec\
    \ explicitly says (UI-07 +\n *    UI-08) the graph reflects ONLY this ingest's affected nodes. The\n\
    \ *    non-cumulative replace is the right primitive"
  cost: A second statement of the replace-not-add rule sits in prose next to the code that holds it. It
    cites UI-07 and UI-08 by an older numbering, so a reader who follows the citation lands somewhere
    other than the node. If the node moves, nothing reaches this prose.
  node: rules/ingest-workspace/assembly-replaces-the-graph-only-when-every-traversal-succeeds
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: the header docstring, lines 18-20 ("Link deduplication")
  evidence: "* The same `KnowledgeLink` row may appear in multiple traversals (when\n *    both endpoints\
    \ are in `affectedNodes`). We dedupe by `id` while merging\n *    — last-write-wins is fine because\
    \ every traverse returns the same row."
  cost: The identity-keyed, later-copy-wins rule is restated in prose, together with a justification ("every
    traverse returns the same row"). A reader may take that justification for part of the rule, but the
    node does not hold it.
  node: rules/ingest-workspace/assembled-link-is-kept-once-by-identity
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: the header docstring, lines 22-27 ("Wire → surface mapping")
  evidence: "* `affectedNodes` already carry id/canonical_name/node_type → mapped to\n *    `GraphNodeData`\
    \ directly (status defaults to `active` since there is no\n *    confidence state in the affected_nodes\
    \ payload).\n *  - Traverse `nodes` add depth-1 neighbours; their wire status is mapped via\n *  \
    \  `deriveNodeState`."
  cost: 'The prose says an affected node''s status "defaults to `active`", but the code seeds affected
    nodes with no `state` at all: `nodeMap.set(n.id, { id: n.id, type: mapNodeType(n.nodeType), label:
    n.canonicalName })`. The node holds the code''s version, "an affected node MUST carry none". A reader
    who trusts the comment learns a default the system does not apply.'
  node: rules/ingest-workspace/assembled-neighbour-state-comes-from-its-status
- file: src/features/ingest/api/useIngestRawInformation.ts
  where: the header docstring, lines 14-16 ("Calls the ingest-feature carve-out `httpIngest<T>()` because
    ingest REST returns bare body on 2xx (no envelope unwrap ...)") and lines 8-10 (the POST path and
    its 201/200 outcomes)
  evidence: "Calls the ingest-feature carve-out `httpIngest<T>()` because ingest\n *    REST returns bare\
    \ body on 2xx (no envelope unwrap — see `_request.ts`\n *    header)."
  cost: The docstring states how the answer is read, which the contract holds as "the 2xx JSON body of
    the answer is the answer itself and is never unwrapped from { ok, result }". The behavior is carried
    by `httpIngest`, imported from "./_request" and not read in this pass, and by the `POST /api/v1/ingest/raw-information`
    call in this file. When the contract moves, nothing reaches this prose, so a reader may take it as
    a second statement of the rule.
  node: contracts/ingest-workspace/bff-ingestion
- file: src/features/ingest/api/useIngestRawInformation.ts
  where: 'the header docstring, lines 17-20 (the "No `ingest: true`" bullet)'
  evidence: "**No `ingest: true`** on this call: `ingestRawInformation` is fast\n *    (chunking + insert,\
    \ no LLM call). The 30s cutoff is appropriate; the\n *    LLM-bound exception applies to `runLlmExtraction`\
    \ (the next step)."
  cost: The docstring restates the thirty-second cutoff and its extraction exception, which the rule "ingestion-request-times-out-after-thirty-seconds"
    holds. The cutoff itself is applied by `httpIngest`, imported from "./_request" and not read in this
    pass. The thirty seconds and the exception therefore sit in prose beside this call as well as in the
    node, and a change to the node will not reach this comment.
  node: rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
- file: src/features/ingest/api/useIngestRunStatus.ts
  where: the docstring's `enabled` bullet (lines 24-28) and the `llmRunId` and `enabled` property comments
    (lines 41-44, 46-52)
  evidence: '* The hook also auto-disables when null/empty

    *    `llmRunId` is passed.

    * Target run identifier (UUID). `null` / `undefined` / `""` disables

    * the hook (no fetch fires).'
  cost: The rule that a run is read only with a non-empty identity and an enabled reading is stated again
    in prose. The prose also states a default for `enabled` ("Default is `false`") that the code does
    not apply. A reader who trusts the comment learns something other than what the code does. The code
    holds the rule in this file (`hasRunId && (params.enabled ?? true)`).
  node: rules/ingest-workspace/run-is-read-only-with-an-identity-and-the-gate
- file: src/features/ingest/api/useIngestRunStatus.ts
  where: 'the module docstring (lines 14-20, "refetchInterval: 5000" and "Stop polling automatically"),
    and the comment above INGEST_RUN_POLL_MS (lines 56-57)'
  evidence: '* - **`refetchInterval: 5000`** while `enabled` is true; the spec calls

    *    for 5s polling cadence (§4).

    *  - **Stop polling automatically** when `status === "completed" |

    *    "failed"`

    /** Polling cadence — spec §4 TTL table. Exported so tests can pin the'
  cost: The five-second cadence and the stop on completed or failed are written a second time in prose,
    citing a spec section that is not the node. When the node moves, this prose is not bound to follow
    it and goes stale. The running code (INGEST_RUN_POLL_MS and terminalAwareRefetchInterval) holds the
    fact in this same file.
  node: rules/ingest-workspace/run-is-polled-every-five-seconds
- file: src/features/ingest/api/useRunLlmExtraction.ts
  where: the file's leading docstring (lines 1-26), the "Design" bullets on the no-cutoff rule and the
    empty body
  evidence: "**`ingest: true`** on `httpIngest` → skips the 30s client-side\n *    cutoff.\n...\n *  -\
    \ Empty body sent as `{}` (openapi declares `additionalProperties: false`)."
  cost: 'The docstring states the no-cutoff rule and the `{}` body a second time in prose. The code holds
    both: this file passes `ingest: true` and `body: JSON.stringify({})`, and `_request.ts` branches on
    `ingestMode === true` to skip the 30-second cutoff. When the node moves, nothing reads the prose,
    so it keeps stating a rule nobody decided. The prose also cites `docs/specs/...` and `CLAUDE.md` as
    its authority instead of the nodes.'
  node: rules/ingest-workspace/extraction-has-no-client-cutoff
- file: src/features/ingest/api/useRunLlmExtraction.ts
  where: 'the inline comment above `ingest: true` in the `httpIngest` options (lines 51-53)'
  evidence: '// LLM-bound — no client-side cutoff. Server stays connected for

    // the duration of extraction (minutes). If the network drops,

    // the caller switches to polling via `useIngestRunStatus`.'
  cost: 'The comment restates the no-cutoff rule beside the code that holds it (`ingest: true`, honoured
    in `_request.ts`). The next reader can take it for the place the rule was decided and edit it there.
    It is prose no running system emits, so removing it changes no behavior.'
  node: rules/ingest-workspace/extraction-has-no-client-cutoff
- file: src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
  where: the docstring above isTxtFile, lines 33-37
  evidence: '* Validate that a file is a text file by extension or MIME type. We do not

    * trust the OS-reported MIME alone (Windows sometimes reports

    * `application/octet-stream` for `.txt`) — extension wins as a fallback.'
  cost: The docstring states the acceptance rule (text type or .txt name) in prose. The function below
    it holds the same rule in code. The rule therefore has a second home that no check reads, and it can
    diverge from the code unnoticed.
  node: rules/ingest-workspace/only-text-files-are-accepted
- file: src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
  where: the file header comment, lines 11-14 ("Out of scope")
  evidence: '* - Binary / PDF parsing — only `.txt` files are accepted (text/* MIME also

    *    accepted as a fallback).'
  cost: The accepted-types rule is written a second time as prose beside the code that holds it. The next
    reader can take the comment for the rule. When the rule changes, the comment keeps saying the old
    one and nothing flags it.
  node: rules/ingest-workspace/only-text-files-are-accepted
- file: src/features/ingest/components/IngestPanel/IngestPanel.tsx
  where: the doc comment above RETRYABLE_ERROR_CODES, line 47
  evidence: /** Codes that map to "retryable" errors — show the "Tentar novamente" CTA. */
  cost: The comment restates the rule that a retry is offered only for retryable codes, next to the Set
    that holds it in code. When the node's code list changes, the comment still claims to say which codes
    are retryable.
  node: rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
- file: src/features/ingest/components/IngestPanel/IngestPanel.tsx
  where: the file's header docstring, line 19 (the Accessibility list)
  evidence: '* - All form controls disabled while the run is in flight'
  cost: The docstring states, a second time and in different words, which phases lock the fields. The
    node says the fields are editable only in idle, ready and error, and isInputDisabled holds that in
    code. If the node moves, this sentence stays behind and reads as a rule that is still decided. "While
    the run is in flight" does not say whether complete and noop are locked, and the node and the code
    do.
  node: rules/ingest-workspace/fields-are-editable-outside-a-run
- file: src/features/ingest/components/IngestPanel/IngestPanel.types.ts
  where: the doc comment on the errorCode prop of IngestPanelProps (lines 42-43)
  evidence: "/** Optional error code — used by the panel to gate the \"Tentar novamente\"\n *  CTA (only\
    \ for retryable codes). */\nreadonly errorCode?: string;"
  cost: 'The comment states that retry is offered only for retryable codes, a fact the candidate rule
    holds. The code that enforces it lives in another file, where RETRYABLE_ERROR_CODES is declared in
    IngestPanel.tsx. A reader of this contract sees a second statement of the rule that nothing reads.
    If the rule''s code list moves, the comment stays behind with no signal that it is stale. This file''s
    own `held_at` for the rule is nowhere, because it declares only `errorCode?: string`.'
  node: rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
- file: src/features/ingest/components/IngestPanel/IngestSummary.tsx
  where: the header doc comment, lines 1-12, which restates the seven counts and the two hidden ones
  evidence: '* Spec: `ingest.feature.spec.md §2 UI-07` — display

    * `accepted/consolidated/needs_review/uncertain/disputed/rejected/error`

    * (the spec intentionally hides `superseded_previous` and

    * `orphaned_fragments` from v1).'
  cost: The set of counts and their order are written a second time in prose, next to the ROWS array that
    holds them. The comment cites a spec file, not the node. If the node moves, `--check` does not reach
    this comment, and a reader can take it for the place the decision is recorded. The comment also gives
    a reason for the hiding ("intentionally ... from v1"). The node states no such reason.
  node: rules/ingest-workspace/outcome-shows-the-seven-counts-in-order
- file: src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx
  where: the JSDoc on the `errorMessage` prop, lines 16-17
  evidence: "/** Error message — displayed under the heading. Falls back to a generic\n   *  copy when\
    \ `undefined`. */"
  cost: The fallback rule ("Algo deu errado. Tente novamente." when the failure has no message) is held
    by the node and by the `??` expression in this file. The comment says it a third time, so a reader
    may take it as a place where the rule lives. If the node changes, the comment goes stale without anything
    flagging it.
  node: contracts/ingest-workspace/ingest-screen
- file: src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx
  where: the JSDoc on the `isRetryable` prop, lines 19-20
  evidence: "/** Whether the \"Tentar novamente\" CTA is shown. Computed by IngestPanel\n   *  from the\
    \ error code. */"
  cost: 'The rule that "Tentar novamente" shows only for a retryable code is held by the node and by the
    `isRetryable ? (...) : null` branch in this file. The comment also says which component derives retryability
    from the code, but the derivation is not in this file. A reader may treat the comment as where the
    rule is decided, and it will go stale if that derivation moves.'
  node: contracts/ingest-workspace/ingest-screen
- file: src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  where: the header doc comment, lines 15-21, the state machine paragraph (`ingest.feature.spec.md §3`)
  evidence: "* State machine (`ingest.feature.spec.md §3`):\n *\n *   idle → ready → sending → { extracting\
    \ | polling | noop | error } →\n *   { complete | revealing → complete | error }"
  cost: The nine phases and the order the screen moves through them are written out a second time in prose
    inside a component that does not drive them. When the phase set or its transitions change, this comment
    still reads as the machine, and a reader of the layout file is sent to it instead of to the specification.
  node: domain/ingest-workspace/ingest-phase
- file: src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  where: the header doc comment, lines 19-21, the `node_selected` side-mode sentence
  evidence: "*   plus the side-mode `node_selected` (right column swap; left column\n *   unaffected,\
    \ hence the panel phase is unchanged)."
  cost: 'The rule that the node detail replaces the graph and leaves the phase alone is stated a second
    time in prose. The code holds it (the `selectedNode !== null ? <NodeDetailPanel .../> : <GraphSpace
    .../>` branch, with `phase` never touched by `setSelectedNode`), so the comment is a second home that
    can drift from the node without anything noticing.'
  node: rules/ingest-workspace/selected-node-detail-replaces-the-graph
- file: src/features/ingest/components/IngestWorkspace/_utils.ts
  where: the comment before the final return of isConnectionDropError(), lines 48-50
  evidence: "// Non-Envelope errors are unknown ground — be conservative and surface\n  // as error so\
    \ they don't hide silently behind a polling spinner.\n  return false;"
  cost: The comment gives a rationale and restates in prose that a failure outside an envelope is no connection
    drop. The `return false` already holds that fact, so the prose is a second home outside behavior.
  node: rules/ingest-workspace/failure-outside-an-envelope-is-no-connection-drop
- file: src/features/ingest/components/IngestWorkspace/_utils.ts
  where: the docstring of isConnectionDropError(), lines 29-32
  evidence: "Per the TC contract: anything other than 409/422 is treated as a\n *  drop."
  cost: The docstring states in prose the rule that the code at lines 36-46 already implements. If the
    node moves, nothing binds this prose to follow it, so a reader could take the comment as the decision.
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- file: src/features/ingest/components/IngestWorkspace/_utils.ts
  where: the inline comments inside the EnvelopeError branch of isConnectionDropError(), lines 35-45
  evidence: "// Definite server-side rejections — surface as error.\n    if (err.httpStatus === 409 ||\
    \ err.httpStatus === 422) return false;\n    // Network/timeout — definitely a drop.\n    // 5xx with\
    \ an LLM_PROVIDER_UNAVAILABLE is a real error band per spec §6.\n    // Any other code → treat as\
    \ drop (graceful degradation per spec §4)."
  cost: These comments restate the node's exclusions and cite "spec §6" and "spec §4" of the old specification
    document as their authority. The code holds the facts, and the comment about "5xx" says more than
    the code checks. A reader may take the prose as the home of the rule.
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the comment at line 163, inside handleSubmit's onSuccess
  evidence: // outcome === "created" — fire extraction immediately.
  cost: The comment restates, as prose, the rule that a newly created source starts its extraction at
    once. The code below it (`setPhase("extracting"); runMutation.mutate(`) holds the same rule. A second
    home outside behavior.
  node: rules/ingest-workspace/new-source-starts-extraction-at-once
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the comment at line 181, inside the runMutation onError of handleSubmit
  evidence: // Silent fallback to polling — copy changes; no error band.
  cost: The comment restates, as prose, the rule that an extraction failure counting as a connection drop
    starts polling instead of showing a failure. The `setIsPolling(true); setPhase("polling");` that follows
    holds it. A second home outside behavior.
  node: rules/ingest-workspace/connection-drop-polls-the-run
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the comment at line 228, in handleRetry
  evidence: // Re-submit from the form — same content+source still in state.
  cost: The comment restates, as prose, the rule that a retry with no run identity held submits the form
    again. The `handleSubmit();` call beside it holds it. A second home outside behavior.
  node: rules/ingest-workspace/retry-without-a-run-submits-again
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the file header docstring, lines 1-17
  evidence: "* - the phase machine (idle → ready → sending → … → complete | error)\n *   - the mutation\
    \ orchestration (ingest → run → assembly)\n *   - the polling fallback when the LLM connection drops\n\
    \ *   - the retry path\n *   - the noop \"Ver grafo existente\" CTA wiring\n *\n * The hook is intentionally\
    \ not generic — it mirrors `ingest.feature.spec.md\n * §3` one-to-one."
  cost: The docstring restates, as prose, the phase machine and the retry and polling behavior that the
    ingest-session node holds. The code in this same file holds them too. A second home outside behavior
    means a reader may take the docstring's list of phases and paths as the decision. It also cites a
    feature spec section as the source of truth instead of the node.
  node: domain/ingest-workspace/ingest-session
unbound:
- src/features/ingest/api/index.ts
- src/features/ingest/api/keys.ts
- src/features/ingest/components/IngestDropzone/IngestDropzone.types.ts
- src/features/ingest/components/IngestDropzone/index.ts
- src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx
- src/features/ingest/components/IngestPanel/_IngestNoopNotice.tsx
- src/features/ingest/components/IngestPanel/index.ts
- src/features/ingest/components/IngestWorkspace/IngestWorkspace.types.ts
- src/features/ingest/components/IngestWorkspace/index.ts
- src/features/ingest/index.ts
adopted: true
notes: 'Judged by 16 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-fe-ingest.returns/.

  Staged as an adoption of source no delivery wrote: 71 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 4 opened across 3 of 16 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 9 fact(s) the source states that no node holds, over 6 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.

  Restates: 37 place(s) where text in the source restates a node''s fact the code holds, over 14 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-fe-ingest.returns/`, which are the evidence behind every entry above.
