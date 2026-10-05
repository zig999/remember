---
contract_version: siegard-reconcile/8
title: Prose comments removed from the ingest frontend files
summary: Every comment that was not a tool directive was removed from these files, answering the restates
  findings the adoption left against them; the facts stay in their nodes and no behaviour changed.
target: frontend
files:
- path: src/features/ingest/api/_request.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/api/_transforms.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/api/useIngestGraphAssembly.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/api/useIngestRawInformation.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/api/useIngestRunStatus.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/api/useRunLlmExtraction.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestPanel/IngestPanel.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestPanel/IngestPanel.types.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestPanel/IngestSummary.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestWorkspace/_utils.ts
  change: Prose comments removed; behaviour unchanged.
- path: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  change: Prose comments removed; behaviour unchanged.
nodes:
- node: contracts/ingest-workspace/bff-ingestion
  conforms: false
  how: "src/features/ingest/api/_transforms.ts, IngestRawInformationRequestWire, line 24: export interface\
    \ IngestRawInformationRequestWire {\n  readonly source_type: SourceTypeWire;\n  readonly content:\
    \ string;\n  readonly storage_ref?: string | null;\n  readonly metadata?: Record<string, unknown>;\n\
    \  readonly model: string;\n  readonly prompt_version: string;\n} — The node lists the body of ingest-raw-information\
    \ as \"the JSON body of source_type, content, model, prompt_version and an optional metadata\". This\
    \ shape adds an optional storage_ref the intake request does not name. A reader looking for what the\
    \ screen may send would trust the node and miss the field. The sibling ingest-document operation records\
    \ no storage reference, and only the raw-information domain node holds storage_ref, as an attribute\
    \ of the stored record."
  observed_at:
  - src/features/ingest/api/_request.ts
  - src/features/ingest/api/_transforms.ts
  - src/features/ingest/api/useIngestRawInformation.ts
  - src/features/ingest/api/useIngestRunStatus.ts
  - src/features/ingest/api/useRunLlmExtraction.ts
- node: contracts/ingest-workspace/bff-traversal
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the queryFn in useQueries (lines 107-111)
    and the wire interfaces (lines 20-43) — `/api/v1/nodes/${encodeURIComponent(id)}/traverse?depth=1&direction=both`,
    { method: "GET", headers: authHeader() }; TraverseResultMinWire { starting_node_id, nodes, links };
    TraverseLinkMinWire { id, source_node_id, target_node_id, link_type, link_type_label, is_temporal,
    is_in_effect, status, flags }'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: contracts/knowledge-base/ingestion
  conforms: true
  how: 'src/features/ingest/api/_transforms.ts: held at IngestRawInformationResponseWire (lines 40-49),
    ChunkRefWire (lines 14-19), LlmRunWire (lines 63-75) and AffectedNodeWire (lines 34-38). This file
    only reads the published answers, and refusals are handled elsewhere. — readonly outcome: "created"
    | "noop_existing";

    readonly chunks: ReadonlyArray<ChunkRefWire>;

    readonly llm_run_id: string;

    readonly idempotency_key: string;

    readonly input_raw_information_id: string;'
  encoded_at:
  - src/features/ingest/api/_transforms.ts
- node: domain/ingest-workspace/ingest-failure
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the return type of classifyError(),\
    \ lines 3-6, which declares the shape of the failure the owner is shown — export function classifyError(err:\
    \ unknown): {\n  readonly code: string;\n  readonly message: string;\n}"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: domain/ingest-workspace/ingest-phase
  conforms: true
  how: "src/features/ingest/components/IngestPanel/IngestPanel.types.ts: held at the `IngestPhase` union\
    \ type, lines 3-12 — export type IngestPhase =\n  | \"idle\"\n  | \"ready\"\n  | \"sending\"\n  |\
    \ \"noop\"\n  | \"extracting\"\n  | \"polling\"\n  | \"revealing\"\n  | \"complete\"\n  | \"error\"\
    ;"
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.types.ts
- node: domain/ingest-workspace/ingest-session
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx: held at The `useState` declarations
    for `content` and `sourceType` at lines 14-15 hold two of the session''s attributes in this file.
    `phase`, `summary`, `validationMessage` and the failure (`errorCode`, `errorMessage`) are destructured
    from `useIngestOrchestration` at lines 26-36 and passed to `IngestPanel`. The file does not declare
    the session''s own shape. The remaining session attributes (`llm_run_id`, `affected_node_ids`) and
    the operations are not visible in this file. — const [content, setContent] = useState<string>("");

    const [sourceType, setSourceType] = useState<IngestSourceType | "">("");

    ...

    } = useIngestOrchestration({ content, sourceType, resetForm });

    src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the state declared
    in useIngestOrchestration (lines 44-55) and the UseIngestOrchestrationResult interface (lines 27-37)
    — const [phase, setPhase] = useState<IngestPhase>("idle");

    const [llmRunId, setLlmRunId] = useState<string | null>(null);

    const [summary, setSummary] = useState<LlmRunSummary | null>(null);

    const [validationMessage, setValidationMessage] = useState<string | null>('
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: domain/knowledge-base/assertion-flag
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the flags field of TraverseLinkMinWire
    (line 36) — readonly flags?: ReadonlyArray<"uncertain" | "disputed" | "low_confidence">;'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the status field of TraverseNodeMinWire
    (line 24) — readonly status?: "active" | "needs_review" | "merged" | "deleted";'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: domain/knowledge-base/run-status
  conforms: true
  how: 'src/features/ingest/api/_transforms.ts: held at LlmRunStatusWire, line 12 — export type LlmRunStatusWire
    = "running" | "completed" | "failed";'
  encoded_at:
  - src/features/ingest/api/_transforms.ts
- node: domain/knowledge-base/run-summary
  conforms: true
  how: 'src/features/ingest/api/_transforms.ts: held at LlmRunSummaryWire (lines 51-61), LlmRunSummary
    (lines 100-110) and toLlmRunSummary (lines 165-177) — readonly superseded_previous: number;

    readonly needs_review: number;

    readonly orphaned_fragments: number;

    orphanedFragments: wire.orphaned_fragments,'
  encoded_at:
  - src/features/ingest/api/_transforms.ts
- node: rules/ingest-workspace/another-document-clears-the-session
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx: held at `resetForm` at lines\
    \ 20-24 clears `content`, `sourceType` and `selectedNode`. It is handed to `useIngestOrchestration`\
    \ at line 36, and `handleReset` (the reset handler) comes back from the same hook and is wired to\
    \ `onReset` at line 76. The clearing of the run identity, affected nodes, summary, failure and validation\
    \ message, and the return to idle, are not in this file. They sit in the hook, which is outside the\
    \ file set. — const resetForm = useCallback(() => {\n  setContent(\"\");\n  setSourceType(\"\");\n\
    \  setSelectedNode(null);\n}, []);\nsrc/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts:\
    \ held at handleReset, lines 179-191, together with the selected-node clearing in IngestWorkspace.tsx,\
    \ which this file does not hold — resetForm();\n    setLlmRunId(null);\n    setAffectedNodes(null);\n\
    \    setIsPolling(false);\n    setAssemblyEnabled(false);\n    setSummary(null);\n    setErrorCode(null);\n\
    \    setErrorMessage(null);\n    setValidationMessage(null);\n    setPhase(\"idle\");\n    useGraphStore.getState().clear();"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/assembled-link-carries-only-what-the-bff-states
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at mapTraverseLink, lines 57-80 — isTemporal:
    wire.is_temporal === true, ... if (wire.is_in_effect !== undefined && state !== undefined) { return
    { ...base, inEffect: wire.is_in_effect, state }; } ... wire.status !== undefined ? deriveLinkState(wire.status,
    wire.flags) : undefined'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-link-is-kept-once-by-identity
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the links loop in the effect, lines
    169-171 — for (const wl of wire.links ?? []) { linkMap.set(wl.id, mapTraverseLink(wl)); }'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-neighbour-state-comes-from-its-status
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at mapTraverseNode, lines 45-55, and the
    affected-node entry at lines 152-158, which carries no state — if (wire.status === undefined) return
    base; const state = deriveNodeState(wire.status); if (state === undefined) return base; return { ...base,
    state }; nodeMap.set(n.id, { id: n.id, type: mapNodeType(n.nodeType), label: n.canonicalName });'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-node-is-labelled-by-its-canonical-name
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at mapTraverseNode (lines 46-50) and the
    affected-node seeding (lines 152-158) — type: mapNodeType(wire.node_type), label: wire.canonical_name;
    type: mapNodeType(n.nodeType), label: n.canonicalName'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembled-node-keeps-the-entry-it-got-first
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at affected nodes seeded first (lines
    152-158) and the traversal nodes guarded at lines 164-168 — for (const wn of wire.nodes ?? []) { if
    (!nodeMap.has(wn.id)) { nodeMap.set(wn.id, mapTraverseNode(wn)); } }'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembly-of-no-nodes-is-an-empty-ready-graph
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the totalCount === 0 branch of the
    effect, lines 131-143 — sourceTool: "ingest_assembly", nodes: [], links: [] ... useGraphStore.getState().replaceNodes(delta);
    useGraphStore.getState().setStatus("ready");'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembly-replaces-the-graph-only-when-every-traversal-succeeds
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the success guard and the final replace,
    lines 144 and 179-180 — if (successCount !== totalCount) return; ... useGraphStore.getState().replaceNodes(delta);
    useGraphStore.getState().setStatus("revealing");'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/assembly-traverses-each-affected-node
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the useQueries call, lines 104-117
    — queries: ids.map((id) => ({ queryKey: ingestKeys.traverse(id), queryFn: ... `/traverse?depth=1&direction=both`
    ..., enabled, ...'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/_utils.ts: held at isConnectionDropError(), lines
    16-28, the EnvelopeError branch — if (err.httpStatus === 409 || err.httpStatus === 422) return false;

    ...

    if (err.code === "SYSTEM_LLM_PROVIDER_UNAVAILABLE") return false;

    if (err.code === "AUTH_SESSION_EXPIRED") return false;

    if (err.code === "SYSTEM_ABORTED") return false;

    return true;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/connection-drop-polls-the-run
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the onError\
    \ of runMutation in handleSubmit, lines 155-160, and the same branch in handleRetry — if (isConnectionDropError(err))\
    \ {\n            setIsPolling(true);\n            setPhase(\"polling\");\n            return;\n  \
    \        }"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/content-is-checked-before-source-type
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit,\
    \ lines 107-116, where the content check precedes the source type check — if (content.length < 1)\
    \ {\n      setValidationMessage(\n        \"Cole ou arraste o conteúdo do documento antes de ingerir.\"\
    ,\n      );\n      return;\n    }\n    if (sourceType === \"\") {"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/disabled-file-area-ignores-input
  conforms: true
  how: "src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at openPicker (line 38),\
    \ onZoneKeyDown (line 74) and onDrop (line 105), each opening with a disabled guard — const openPicker\
    \ = useCallback(() => {\n    if (disabled) return;\n    inputRef.current?.click();\nand onZoneKeyDown:\
    \ \"if (disabled) return;\" and onDrop: \"if (disabled) return;\" before \"handleFiles(e.dataTransfer.files);\""
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/editing-changes-the-phase-only-in-idle-and-ready
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the phase effect,
    lines 70-76 — if (current !== "idle" && current !== "ready") return current;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/existing-graph-is-assembled-on-request
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleAssembleExisting,\
    \ lines 193-196, over the affected nodes kept by the noop branch — setAssemblyEnabled(true);\n   \
    \ setPhase(\"revealing\");"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/extraction-answer-moves-to-revealing
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the onSuccess\
    \ of runMutation in handleSubmit, lines 144-154, and the same in handleRetry — setSummary(run.summary);\n\
    \                if (\n                  run.affectedNodes !== undefined &&\n                  run.affectedNodes.length\
    \ > 0\n                ) {\n                  setAffectedNodes(run.affectedNodes);\n             \
    \   }\n                setAssemblyEnabled(true);\n                setPhase(\"revealing\");"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/extraction-has-no-client-cutoff
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at The `ingestMode === true` branch of httpIngest, lines
    96-97. It sets no timer. — `if (ingestMode === true) { signal = userSignal; } else { const timeoutController
    = new AbortController(); ... }`

    src/features/ingest/api/useRunLlmExtraction.ts: held at the `ingest: true` option on the httpIngest
    call (line 23). The file sets no signal and no timer of its own. In _request.ts, `if (ingestMode ===
    true) { signal = userSignal;` skips the thirty-second timeout, so the request waits for as long as
    the BFF keeps the connection open. — ingest: true,'
  encoded_at:
  - src/features/ingest/api/_request.ts
  - src/features/ingest/api/useRunLlmExtraction.ts
- node: rules/ingest-workspace/failed-traversal-leaves-the-graph-as-it-was
  conforms: true
  how: 'src/features/ingest/api/useIngestGraphAssembly.ts: held at the hasError result (line 124) and
    the guard that skips every graph write unless all traversals succeeded (line 144) — const hasError
    = results.some((r) => r.status === "error"); ... if (successCount !== totalCount) return;'
  encoded_at:
  - src/features/ingest/api/useIngestGraphAssembly.ts
- node: rules/ingest-workspace/failure-envelope-shows-its-own-code-and-message
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the EnvelopeError branch of\
    \ classifyError(), lines 7-9 — if (err instanceof EnvelopeError) {\n  return { code: err.code, message:\
    \ err.message };\n}"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/failure-outside-an-envelope-is-no-connection-drop
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/_utils.ts: held at the final statement of isConnectionDropError(),
    line 27, reached by anything that is not an EnvelopeError — return false;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/failure-outside-an-envelope-shows-the-unknown-code
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/_utils.ts: held at the two non-envelope returns\
    \ of classifyError(), lines 10-13 — if (err instanceof Error) {\n  return { code: \"SYSTEM_UNKNOWN\"\
    , message: err.message };\n}\nreturn { code: \"SYSTEM_UNKNOWN\", message: \"Erro desconhecido.\" };"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: rules/ingest-workspace/fields-are-editable-outside-a-run
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at isInputDisabled(), lines 36-48,
    which feeds the disabled prop of IngestDropzone, Textarea and Select. — case "sending": case "extracting":
    case "polling": case "revealing": case "complete": case "noop": return true; default: return false;

    Idle, ready and error fall to the default, so the fields are editable only there.'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/file-area-shows-only-in-idle-and-ready
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the showDropzone constant,
    line 96, and its conditional render, lines 126-131. — const showDropzone = phase === "idle" || isReadyPhase;

    {showDropzone ? ( <IngestDropzone onContent={onContentChange} disabled={disabled} /> ) : null}'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/file-read-replaces-the-content
  conforms: true
  how: "src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at the reader.onload handler\
    \ inside handleFiles, lines 52-58 — reader.onload = () => {\n  const result = reader.result;\n  if\
    \ (typeof result !== \"string\") return;\n  setError(null);\n  onContent(result);"
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/first-unauthorized-answer-refreshes-the-token-once
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at The 401 branch of httpIngest, lines 137-152, and
    trySilentRefresh, lines 73-84. — `if (response.status === 401 && __retried !== true) { const refreshed
    = await trySilentRefresh(); if (refreshed) { ... nextHeaders.set("Authorization", `Bearer ${fresh}`);
    ... return httpIngest<T>(path, { ...opts, headers: ..., __retried: true }); }`

    trySilentRefresh does `const newJwt = await fetchAccessToken(); useAuthStore.getState().setToken(newJwt);`.'
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: rules/ingest-workspace/form-is-ready-with-content-and-source-type
  conforms: true
  how: "src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the canSubmit constant, line\
    \ 88. The form is ready when the content has at least one character, with no trimming, and a source\
    \ type is selected. — const canSubmit = isReadyPhase && content.length >= 1 && sourceType !== \"\"\
    ;\nsrc/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the phase effect,\
    \ lines 70-76 — const isReady = content.length >= 1 && sourceType !== \"\";\n      return isReady\
    \ ? \"ready\" : \"idle\";"
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/ingest-requires-content
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit,\
    \ lines 107-112, which returns before any mutation — if (content.length < 1) {\n      setValidationMessage(\n\
    \        \"Cole ou arraste o conteúdo do documento antes de ingerir.\",\n      );\n      return;\n\
    \    }"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/ingest-requires-source-type
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit,\
    \ lines 113-116, which returns before any mutation — if (sourceType === \"\") {\n      setValidationMessage(\"\
    Selecione o tipo de fonte antes de ingerir.\");\n      return;\n    }"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/ingestion-request-carries-the-access-token
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at authHeader, lines 6-9. The resend in the 401 branch
    also sets the Bearer header, lines 143-146. — `const token = useAuthStore.getState().accessToken;
    return token !== null ? { Authorization: `Bearer ${token}` } : {};`

    src/features/ingest/api/useIngestRawInformation.ts: held at The headers of the request in mutationFn
    (line 30). The file spreads authHeader() into the request headers and adds no Authorization of its
    own. The bearer-when-held and nothing-otherwise decision sits in authHeader, imported from ./_request,
    which is outside this file. — headers: { ...authHeader(), "Content-Type": "application/json" },

    src/features/ingest/api/useIngestRunStatus.ts: held at line 34, where the read passes the headers
    of authHeader(). The bearer-or-no-header logic itself is not declared here. — { method: "GET", headers:
    authHeader() },

    src/features/ingest/api/useRunLlmExtraction.ts: held at the headers of the httpIngest call (line 21).
    The file spreads authHeader() into the request headers. How authHeader() decides between a bearer
    and no Authorization header is held in _request.ts, which the node is also bound to. — headers: {
    ...authHeader(), "Content-Type": "application/json" },'
  encoded_at:
  - src/features/ingest/api/_request.ts
  - src/features/ingest/api/useIngestRawInformation.ts
  - src/features/ingest/api/useIngestRunStatus.ts
  - src/features/ingest/api/useRunLlmExtraction.ts
- node: rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at DEFAULT_TIMEOUT_MS (line 17) and the non-ingest branch
    of httpIngest, lines 98-107. The error mapping for it is at lines 118-131. — `const DEFAULT_TIMEOUT_MS
    = 30_000;`

    `setTimeout(() => { timeoutController.abort(new DOMException("Request timed out after 30s", "TimeoutError"));
    }, DEFAULT_TIMEOUT_MS);`'
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: rules/ingest-workspace/known-content-waits-for-the-owner
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the noop_existing\
    \ branch of ingestMutation onSuccess, lines 134-138, which returns before runMutation — if (data.outcome\
    \ === \"noop_existing\") {\n          setAffectedNodes(data.affectedNodes ?? []);\n          setPhase(\"\
    noop\");\n          return;\n        }"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/new-source-starts-extraction-at-once
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit,\
    \ lines 140-142, where any outcome other than noop_existing starts the extraction — setPhase(\"extracting\"\
    );\n          runMutation.mutate(\n            { llm_run_id: data.llmRunId },"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/noop-keeps-the-affected-nodes
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the noop branch,
    line 135 — setAffectedNodes(data.affectedNodes ?? []);'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/only-extraction-failures-count-as-connection-drops
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the onError\
    \ of ingestMutation, lines 169-174, and the onError of retryMutation, lines 238-243, which go to the\
    \ error phase with no connection-drop test — onError: (err) => {\n          const { code, message\
    \ } = classifyError(err);\n          setErrorCode(code);\n          setErrorMessage(message);\n  \
    \        setPhase(\"error\");\n        },"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/only-text-files-are-accepted
  conforms: true
  how: 'src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at isTxtFile (lines 18-22),
    called as the gate in handleFiles (line 47) — if (file.type === "text/plain") return true;

    if (file.type.startsWith("text/")) return true;

    return file.name.toLowerCase().endsWith(".txt");'
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/only-the-first-file-is-used
  conforms: true
  how: 'src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at handleFiles, lines 44-46
    — const file = files[0];

    if (!file) return;'
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/outcome-shows-the-seven-counts-in-order
  conforms: true
  how: "src/features/ingest/components/IngestPanel/IngestSummary.tsx: held at The ROWS constant (lines\
    \ 15-23), rendered by the ROWS.map in the IngestSummary component (lines 31-42). — const ROWS: ReadonlyArray<Row>\
    \ = [\n  { key: \"accepted\", label: \"Aceitos\" },\n  { key: \"consolidated\", label: \"Consolidados\"\
    \ },\n  { key: \"needsReview\", label: \"Aguardando revisão\" },\n  { key: \"uncertain\", label: \"\
    Incertos\" },\n  { key: \"disputed\", label: \"Em conflito\" },\n  { key: \"rejected\", label: \"\
    Rejeitados\" },\n  { key: \"error\", label: \"Erros\" },\n];"
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestSummary.tsx
- node: rules/ingest-workspace/polled-completed-run-moves-to-revealing
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the polling\
    \ effect, lines 84-104, completed branch — if (run.status === \"completed\") {\n      setIsPolling(false);\n\
    \      setSummary(run.summary);\n      if (run.affectedNodes !== undefined && run.affectedNodes.length\
    \ > 0) {\n        setAffectedNodes(run.affectedNodes);\n      }\n      setAssemblyEnabled(true);\n\
    \      setPhase(\"revealing\");"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/polled-failed-run-ends-in-run-failed
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the polling\
    \ effect, lines 96-103, failed branch — } else if (run.status === \"failed\") {\n      setIsPolling(false);\n\
    \      setErrorCode(\"RUN_FAILED\");\n      setErrorMessage(\n        \"A extração falhou. Reabra\
    \ a execução para tentar novamente.\",\n      );\n      setPhase(\"error\");"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/polled-running-run-keeps-the-screen-waiting
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the polling
    effect, lines 84-104, where a run that is neither completed nor failed changes no state and so leaves
    the polling phase in place — if (run.status === "completed") {

    } else if (run.status === "failed") {'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/recorded-source-keeps-the-run-identity
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the first statement
    of the ingestMutation onSuccess, line 131, before the outcome is read — setLlmRunId(data.llmRunId);'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/rejection-stays-until-a-file-is-read
  conforms: true
  how: "src/features/ingest/components/IngestDropzone/IngestDropzone.tsx: held at the error state (line\
    \ 35), set in handleFiles on rejection (line 48) and cleared only inside reader.onload (line 55) —\
    \ if (!isTxtFile(file)) {\n  setError(REJECT_MESSAGE);\n  return;\n}\n... reader.onload = () => {\
    \ ... setError(null);"
  encoded_at:
  - src/features/ingest/components/IngestDropzone/IngestDropzone.tsx
- node: rules/ingest-workspace/resent-request-never-refreshes-again
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at The `__retried` flag, which the 401 branch checks
    (line 137) and the resend sets (line 150). — `if (response.status === 401 && __retried !== true) {`
    ... `__retried: true,`'
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the RETRYABLE_ERROR_CODES
    set, lines 27-34, and isRetryable, line 90, which is passed to IngestErrorBand. — new Set(["SYSTEM_LLM_PROVIDER_UNAVAILABLE",
    "SYSTEM_INTERNAL_ERROR", "SYSTEM_UPSTREAM", "SYSTEM_TIMEOUT", "SYSTEM_NETWORK", "RUN_FAILED"]);

    const isRetryable = errorCode !== undefined && RETRYABLE_ERROR_CODES.has(errorCode);'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/retry-with-a-run-retries-then-extracts
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleRetry,\
    \ lines 203-237 — setErrorCode(null);\n    setErrorMessage(null);\n    setPhase(\"extracting\");\n\
    \    retryMutation.mutate(\n      { llm_run_id: llmRunId },\n      {\n        onSuccess: () => {\n\
    \          runMutation.mutate(\n            { llm_run_id: llmRunId },"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/retry-without-a-run-submits-again
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleRetry,\
    \ lines 199-202 — if (llmRunId === null) {\n      handleSubmit();\n      return;\n    }"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/revealing-completes-when-the-graph-is-ready
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the effect at\
    \ lines 78-82 — if (phase === \"revealing\" && graphStatus === \"ready\") {\n      setPhase(\"complete\"\
    );\n    }"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/review-count-points-to-curation
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the needsReview branch inside
    the ingest-complete block, lines 229-236. — {summary.needsReview > 0 ? ( <p data-testid="ingest-needs-review-notice"
    ...>Alguns nós aguardam revisão. Acesse Curadoria para detalhes.</p> ) : null}'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/run-is-polled-every-five-seconds
  conforms: true
  how: 'src/features/ingest/api/useIngestRunStatus.ts: held at INGEST_RUN_POLL_MS at line 12 and terminalAwareRefetchInterval
    at lines 14-20, wired as refetchInterval at line 41. — export const INGEST_RUN_POLL_MS = 5_000;

    if (status === "completed" || status === "failed") return false;

    return INGEST_RUN_POLL_MS;'
  encoded_at:
  - src/features/ingest/api/useIngestRunStatus.ts
- node: rules/ingest-workspace/run-is-read-only-with-an-identity-and-the-gate
  conforms: true
  how: "src/features/ingest/api/useIngestRunStatus.ts: held at the enabled computation at lines 25-27,\
    \ passed to useQuery at line 38. — const hasRunId =\n  typeof params.llmRunId === \"string\" && params.llmRunId.length\
    \ > 0;\nconst enabled = hasRunId && (params.enabled ?? true);"
  encoded_at:
  - src/features/ingest/api/useIngestRunStatus.ts
- node: rules/ingest-workspace/selected-node-detail-replaces-the-graph
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx: held at The ternary at lines\
    \ 84-103 renders `NodeDetailPanel` while `selectedNode !== null` and `GraphSpace` otherwise. `handleDetailClose`\
    \ (lines 52-54) sets `selectedNode` back to `null`, and selecting or closing touches only `selectedNode`.\
    \ `phase` is read from the orchestration hook and is not written by either handler. — {selectedNode\
    \ !== null ? (\n  <NodeDetailPanel\n    nodeId={selectedNode.id}\n    ...\n    onClose={handleDetailClose}\n\
    \  />\n) : (\n  <GraphSpace"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/IngestWorkspace.tsx
- node: rules/ingest-workspace/submission-clears-earlier-messages
  conforms: true
  how: "src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at handleSubmit,\
    \ lines 117-120, after both checks and before the phase moves to sending — setValidationMessage(null);\n\
    \    setErrorCode(null);\n    setErrorMessage(null);\n    setPhase(\"sending\");"
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
- node: rules/ingest-workspace/submit-control-shows-in-idle-ready-and-sending
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the showSubmit constant, line
    89, and the Button, lines 175-186. The button is disabled while sending. — const showSubmit = phase
    === "idle" || isReadyPhase || isSendingPhase;

    disabled={!canSubmit || isSendingPhase}'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/submit-needs-the-ready-phase
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the canSubmit constant, line
    88, and the form''s onSubmit guard, lines 120-123. — const canSubmit = isReadyPhase && content.length
    >= 1 && sourceType !== "";

    onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }}'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
- node: rules/ingest-workspace/unrefreshable-session-ends-at-sign-in
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at The catch block of trySilentRefresh, lines 78-83.
    — `useAuthStore.getState().clear(); redirectImpl("/sign-in?reason=session_expired"); return false;`,
    where redirectImpl defaults to `window.location.replace(url)`.'
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: scenarios/ingest-workspace/conflicting-extraction-shows-the-failure
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/_utils.ts: held at the 409 and 422 guard of isConnectionDropError(),
    line 18, together with the envelope branch of classifyError(), lines 7-9 — if (err.httpStatus ===
    409 || err.httpStatus === 422) return false;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: scenarios/ingest-workspace/expired-token-is-refreshed-once-and-resent
  conforms: true
  how: 'src/features/ingest/api/_request.ts: held at The 401 branch of httpIngest, lines 137-152. A refreshed
    token is stored by trySilentRefresh and the same request is sent again once. — `const refreshed =
    await trySilentRefresh(); if (refreshed) { ... return httpIngest<T>(path, { ...opts, headers: Object.fromEntries(nextHeaders.entries()),
    __retried: true }); }`'
  encoded_at:
  - src/features/ingest/api/_request.ts
- node: scenarios/ingest-workspace/internal-error-during-extraction-polls-the-run
  conforms: true
  how: 'src/features/ingest/components/IngestWorkspace/_utils.ts: held at the closing return of the envelope
    branch of isConnectionDropError(), line 25. A 500 with SYSTEM_INTERNAL_ERROR matches none of the exclusions,
    so it counts as a connection drop. — if (err.code === "SYSTEM_ABORTED") return false;

    return true;'
  encoded_at:
  - src/features/ingest/components/IngestWorkspace/_utils.ts
- node: scenarios/ingest-workspace/whitespace-only-content-is-ready
  conforms: true
  how: 'src/features/ingest/components/IngestPanel/IngestPanel.tsx: held at the canSubmit constant, line
    88. The check is on length, not on trimmed content, so spaces count as content. — const canSubmit
    = isReadyPhase && content.length >= 1 && sourceType !== "";

    src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts: held at the phase effect,
    lines 70-76, which tests content length and never trims — const isReady = content.length >= 1 && sourceType
    !== "";'
  encoded_at:
  - src/features/ingest/components/IngestPanel/IngestPanel.tsx
  - src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
unstated:
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: TRAVERSE_STALE_MS constant (line 18), used in the useQueries options at lines 114-115
  evidence: 'const TRAVERSE_STALE_MS = 5 * 60_000;

    ...

    staleTime: TRAVERSE_STALE_MS,

    refetchOnWindowFocus: false,'
  cost: How long a traversal counts as fresh, and that a regained window focus never rereads it, are decided
    only here. The node for the traversal request states depth, direction and parallelism but no freshness.
    A reader looking in the specification for how current the assembled graph is will not find it. Other
    ingest-workspace rules were found to state no freshness window.
- file: src/features/ingest/api/useIngestGraphAssembly.ts
  where: the two GraphDelta literals, lines 135-139 (empty assembly) and 174-178 (full assembly)
  evidence: "const delta: GraphDelta = {\n  sourceTool: \"ingest_assembly\",\n  nodes: [],\n  links: [],\n\
    };"
  cost: The name an ingest assembly gives itself as the tool that showed the graph is a literal that appears
    only in code. The graph-delta node only requires a source_tool string, and no node in the specification
    names this value. The next reader will not find in the specification what source an ingest-assembled
    graph carries.
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the constant INGEST_MODEL, line 18, sent as model in handleSubmit (line 126)
  evidence: const INGEST_MODEL = "claude-opus-4-8";
  cost: The model every ingestion from the screen runs under is decided only in this constant. The only
    node that names this model value is rules/chat/turn-model-default, and it governs the chat turn, not
    ingestion. rules/chat/turn-model-default was found by grep of the specification root and was not opened.
    bff-ingestion says only that model is "sent as given and checked by nothing in the client". The next
    reader looks in the specification for which model an ingestion uses and finds no answer, and the LLM
    run's recorded model becomes whatever this file says.
- file: src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts
  where: the constant INGEST_PROMPT_VERSION, line 19, sent as prompt_version in handleSubmit (line 127)
  evidence: const INGEST_PROMPT_VERSION = "v3";
  cost: The extraction prompt version every ingestion from the screen runs under is decided only here.
    The extraction rules are conditioned on prompt version, for example event-type-fallback from v3 on
    and relative-date from v3 alone, so this constant selects which extraction rules apply. The next reader
    finds no node saying the screen submits v3 and learns it only from the code.
unbound:
- src/features/ingest/components/IngestPanel/_IngestErrorBand.tsx
notes: "Judged by 13 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/restates-fe-ingest.returns/.\nA finding in src/features/ingest/api/_transforms.ts\
  \ names domain/knowledge-base/source-type, which no file of this set is bound to: SourceTypeWire, lines\
  \ 1-8 (IngestSourceType, line 10, re-exports it): export type SourceTypeWire =\n  | \"pdf\"\n  | \"\
  email\"\n  | \"ata\"\n  | \"chat\"\n  | \"artigo\"\n  | \"transcricao\"\n  | \"outro\"; — The closed\
  \ set of source types is declared here as its own vocabulary. Its node, domain/knowledge-base/source-type,\
  \ is not bound to this file, so a change to the node never reaches this declaration. The node lists\
  \ pdf, email, meeting-minutes, chat, article, transcript and other, and gives ata, artigo, transcricao\
  \ and outro as the material's own words for four of them. If the node moves, nobody can tell which spelling\
  \ the business decided.. It blocks nothing here; it is owed a route of its own.\nCandidates: 10 opened\
  \ across 6 of 13 delegation(s); each return lists its own under `candidates_opened`.\nUnstated: 4 fact(s)\
  \ the source states that no node holds, over 2 file(s), listed under `unstated`. They block no binding\
  \ here and no rebind closes them — the route is the analysis that gives each fact a node."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/restates-fe-ingest.returns/`, which are the evidence behind every entry above.
