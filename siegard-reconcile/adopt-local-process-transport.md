---
contract_version: siegard-reconcile/8
title: Adopt the local process transport entry point against its new constraint
summary: The source is adopted as it stands and did not change; constraints/local-process-transport-needs-no-authentication
  was written by /analyse (commit 5996c48) from the owner's decision to amend the authentication constraint.
target: backend
files:
- path: src/mcp-stdio.ts
  change: unchanged; adopted against the constraint that the local process transport runs without authentication.
nodes:
- node: constraints/local-process-transport-needs-no-authentication
  conforms: true
  how: "src/mcp-stdio.ts: held at Step 8, lines 250 to 253. The stdio transport is constructed and connected\
    \ to the tool server with no authentication step anywhere in main(). — const transport = new StdioServerTransport();\
    \ try {\n  await server.connect(transport);"
  encoded_at:
  - src/mcp-stdio.ts
unstated:
- file: src/mcp-stdio.ts
  where: Step 6, the toolCoordinates array, lines 226 to 232, with the Step 5 comment "no curation toolset
    is registered"
  evidence: "const toolCoordinates: readonly ToolCoordinate[] = [\n  ...QUERY_TOOL_NAMES.map((name) =>\
    \ ({ toolset: \"query\" as const, name })),\n  ...QUERY_RETRIEVAL_TOOL_NAMES.map((name) => ({ toolset:\
    \ \"query\" as const, name })),\n  ...INGEST_TOOL_NAMES.map((name) => ({ toolset: \"ingest\" as const,\
    \ name })),\n  { toolset: \"ingest\" as const, name: \"ingest_document\" },\n  { toolset: \"ingest\"\
    \ as const, name: \"ingest_directed\" },\n];"
  cost: 'Which operations are open over the local process transport is decided only here: the query and
    ingest toolsets, and no curation toolset. The only place the specification touches this is a decision-log
    line, "the local process transport serves the query and ingest toolsets", and no node states it. A
    reader looking in the specification for what a desktop client can reach over stdio finds nothing.
    Someone adding a curation tool here would change the owner''s surface with no node to disagree with.
    The header comment also says 18 tools while this array and the Step 6 comment say 19. That comment
    drift is prose and not a separate finding.'
restates:
- file: src/mcp-stdio.ts
  where: the file-header comment, lines 8 to 13 ("Spec carve-outs"), first bullet
  evidence: //   - NO auth gate (no NeonAuth, no JWT) — the operating model is "one local //     client
    per process", spawned by the desktop binary on the owner's box.
  cost: 'The trust model of the local process transport is written a second time in a comment that cites
    back-spec versions (knowledge-graph.back.md v1.4.0 BR-01/BR-23) as its source. The next reader can
    take that comment for the place the decision lives, and it does not change when the node does. The
    code conforms: the file builds the transport and connects it with no authentication call. Only the
    prose is owed removal.'
  node: constraints/local-process-transport-needs-no-authentication
adopted: true
pairs_omitted:
- node: constraints/ingest-toolset-offers-no-async-ingestion
  file: src/mcp-stdio.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 1 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/adopt-local-process-transport.returns/.\nStaged as an adoption of source no\
  \ delivery wrote: 1 candidate node(s) were read on every file, and each cleared one is bound to the\
  \ files whose judgment holds its fact.\nA finding in src/mcp-stdio.ts names constraints/logs-redact-text-fields,\
  \ which no file of this set is bound to: the REDACT_PATHS constant and the docstring above it, lines\
  \ 70 to 94, and its use in buildStderrLogger at line 113: * PII redaction paths — kept in sync with\
  \ `backend/src/config/logger.ts` * REDACT_PATHS. We intentionally do NOT call `buildLogger()` here ...\
  \ * Duplicating the small list of * paths is preferred over leaking a `destination` parameter through\
  \ the * shared logger factory just for this entry point. const REDACT_PATHS: readonly string[] = [\n\
  \  \"content\",\n  \"text\",\n  \"value\",\n  \"*.content\",\n  ...\n  \"req.headers.authorization\"\
  ,\n  \"*.req.headers.authorization\",\n  \"headers.authorization\",\n]; — The rule of which log fields\
  \ show as [REDACTED] is implemented here a second time. The file's own docstring says the list is duplicated\
  \ and relies on someone remembering to keep it in sync with config/logger.ts. When the node moves, or\
  \ logger.ts changes, nothing reads this copy. The stdio process can then log a field in the clear that\
  \ the HTTP process redacts, and nobody can tell which list was decided.. It blocks nothing here; it\
  \ is owed a route of its own.\nCandidates: 1 opened across 1 of 1 delegation(s); each return lists its\
  \ own under `candidates_opened`.\nUnstated: 1 fact(s) the source states that no node holds, over 1 file(s),\
  \ listed under `unstated`. They block no binding here and no rebind closes them — the route is the analysis\
  \ that gives each fact a node.\nRestates: 1 place(s) where text in the source restates a node's fact\
  \ the code holds, over 1 file(s), listed under `restates`. The pair conforms, so none blocks a binding\
  \ — the route is removing the text, and reconciling the file after."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-local-process-transport.returns/`, which are the evidence behind every entry above.
