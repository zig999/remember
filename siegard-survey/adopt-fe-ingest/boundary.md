---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/ingest/api/_request.ts
  - src/features/ingest/api/_transforms.ts
  - src/features/ingest/api/index.ts
  - src/features/ingest/api/keys.ts
  - src/features/ingest/api/useIngestGraphAssembly.ts
  - src/features/ingest/api/useIngestRawInformation.ts
  - src/features/ingest/api/useIngestRunStatus.ts
  - src/features/ingest/api/useRetryLlmRun.ts
  - src/features/ingest/api/useRunLlmExtraction.ts
read_outside_area:
  - "src/lib/http.ts — opened to understand EnvelopeError, the failure every request of the area throws, and the envelope helper http that the graph assembly's traversal goes through; read, not surveyed"
  - "specification/contracts/knowledge-base/ingestion.md (project root, outside the target root) — opened to name the four ingestion operations and their codes as the specification does; read, not surveyed"
  - "specification/contracts/owner-access/identity-provider.md (project root, outside the target root) — opened to name the identity provider's obtain-access-token as the specification does; read, not surveyed"
  - "specification/scenarios/owner-access/expired-session-notice-stays-beside-a-failure.md (project root, outside the target root) — opened to name the expired-session notice; read, not surveyed"
  - "specification/constraints/failures-answer-one-envelope.md (project root, outside the target root) — opened to name the failure envelope; read, not surveyed"
  - "specification/domain/knowledge-base/run-status.md, source-type.md, run-summary.md, node-status.md, assertion-flag.md, traversal-direction.md, llm-run.md (project root, outside the target root) — opened to name the vocabularies and the run as the specification does; read, not surveyed"
---

## Facts
### Requests to the BFF (shared by the four ingestion requests)
- Each ingestion request goes to the BFF address `VITE_BFF_URL`. A trailing `/` on the address is removed before the path is joined. `src/features/ingest/api/_request.ts` (`httpIngest`, `joinUrl`).
- Each request of the area carries `Authorization: Bearer <access token>` when the SPA's auth store holds the owner's access token. When the store holds none, the request carries no `Authorization` header at all. `src/features/ingest/api/_request.ts` (`authHeader`), `src/features/ingest/api/useIngestRawInformation.ts`, `src/features/ingest/api/useIngestRunStatus.ts`, `src/features/ingest/api/useRunLlmExtraction.ts`, `src/features/ingest/api/useRetryLlmRun.ts`, `src/features/ingest/api/useIngestGraphAssembly.ts` (`headers: authHeader()`).
- Four requests are read by `httpIngest`: ingest raw information, read LLM run, run extraction and retry LLM run. On a 2xx answer, `httpIngest` takes the JSON body as the answer itself and never unwraps `{ ok, result }`. `src/features/ingest/api/_request.ts` (`httpIngest` 2xx branch).
- A 204 answer to an ingestion request gives no value. `src/features/ingest/api/_request.ts` (`response.status === 204`).
- On a non-2xx answer, `httpIngest` looks for an `error` object `{ code, message, details }` in the body and fails with that code, message and details plus the HTTP status. It never reads `ok`. `src/features/ingest/api/_request.ts` (`httpIngest` error branch, `errObj`).
- The client cuts off every ingestion request after 30 seconds, except run extraction. `src/features/ingest/api/_request.ts` (`DEFAULT_TIMEOUT_MS = 30_000`, `ingestMode === true`), `src/features/ingest/api/useRunLlmExtraction.ts` (`ingest: true`).
- Ingest raw information, read LLM run and retry LLM run are under the 30-second cutoff. `src/features/ingest/api/useIngestRawInformation.ts`, `src/features/ingest/api/useIngestRunStatus.ts`, `src/features/ingest/api/useRetryLlmRun.ts` (no `ingest` option).
- `httpIngest` checks in this order. `src/features/ingest/api/_request.ts` (`httpIngest`):
  - a request that gets no answer is a transport failure;
  - then the first 401 starts a token refresh;
  - then a 2xx is a success;
  - then anything else is read as a failure body.
- The area maps no error code to a screen, a message or an action. Each failure is thrown to the hook's caller, which is outside the area. `src/features/ingest/api/_request.ts` (`throw new EnvelopeError`), `src/features/ingest/api/useIngestRawInformation.ts`, `src/features/ingest/api/useRunLlmExtraction.ts`, `src/features/ingest/api/useRetryLlmRun.ts`, `src/features/ingest/api/useIngestRunStatus.ts`.

### Expired access token (refresh and resend)
- On the first 401 answer to an ingestion request, the client asks the identity provider once for a new owner's access token and stores it. It then resends the same request once with `Authorization: Bearer <new token>`. `src/features/ingest/api/_request.ts` (`trySilentRefresh`, `fetchAccessToken`, `setToken`, `nextHeaders.set("Authorization", …)`, `__retried: true`).
- If no new token can be obtained, the client clears the auth store and replaces the current address with `/sign-in?reason=session_expired`. The request then fails with `AUTH_SESSION_EXPIRED`. `src/features/ingest/api/_request.ts` (`trySilentRefresh` catch, `window.location.replace`, `AUTH_SESSION_EXPIRED`).
- The resent request never starts a second refresh. A 401 answer to it is read like any other non-2xx answer. `src/features/ingest/api/_request.ts` (`__retried !== true`).

### Ingest raw information
- The request is `POST /api/v1/ingest/raw-information` with a JSON body. The caller's `source_type`, `content`, `model`, `prompt_version` and optional `metadata` are sent exactly as given. `src/features/ingest/api/useIngestRawInformation.ts` (`UseIngestRawInformationVariables`, `JSON.stringify(vars)`).
- The hook's variables have no `storage_ref`, although the request wire type declares one as optional. `src/features/ingest/api/useIngestRawInformation.ts` (`UseIngestRawInformationVariables`), `src/features/ingest/api/_transforms.ts` (`IngestRawInformationRequestWire.storage_ref`).
- The client checks nothing about the body before sending it: no length, no format and no required-field check. `src/features/ingest/api/useIngestRawInformation.ts` (`mutationFn`).
- The answer is read as these fields. `src/features/ingest/api/_transforms.ts` (`IngestRawInformationResponseWire`, `toIngestRawInformationResult`):
  - `outcome`, `raw_information_id`, `content_hash` and `chunk_count`;
  - `chunks`, each with `id`, `chunk_index`, `offset_start` and `offset_end`;
  - `llm_run_id` and `idempotency_key`;
  - optional `affected_nodes`, each with `id`, `node_type` and `canonical_name`.
- Absent `affected_nodes` stays absent, and an empty list stays an empty list. `src/features/ingest/api/_transforms.ts` (`toIngestRawInformationResult`, `wire.affected_nodes !== undefined`).
- The hook only returns the answer. What follows a `created` or a `noop_existing` outcome is decided by its caller, outside the area. `src/features/ingest/api/useIngestRawInformation.ts` (`useIngestRawInformation`).

### Run extraction
- The request is `POST /api/v1/ingest/llm-runs/{llm_run_id}/run` with the JSON body `{}`. `src/features/ingest/api/useRunLlmExtraction.ts` (`body: JSON.stringify({})`).
- The answer is read as an LLM run. `src/features/ingest/api/useRunLlmExtraction.ts` (`toLlmRun`).
- The request has no client cutoff, so it waits as long as the BFF keeps the connection open. `src/features/ingest/api/useRunLlmExtraction.ts` (`ingest: true`), `src/features/ingest/api/_request.ts` (`signal = userSignal`).

### Retry LLM run
- The request is `POST /api/v1/ingest/llm-runs/{llm_run_id}/retry`. Its JSON body is `{ reason }` when the caller gives a reason, otherwise `{}`. `src/features/ingest/api/useRetryLlmRun.ts` (`reason !== undefined ? { reason } : {}`).
- The client puts no bound on `reason`. `src/features/ingest/api/useRetryLlmRun.ts` (`UseRetryLlmRunVariables`).
- The answer is read as an LLM run. `src/features/ingest/api/useRetryLlmRun.ts` (`toLlmRun`).
- The hook does not start extraction after a retry. `src/features/ingest/api/useRetryLlmRun.ts` (`mutationFn` returns after one request).

### Read LLM run (run-status polling)
- The request is `GET /api/v1/ingest/llm-runs/{llmRunId}`. `src/features/ingest/api/useIngestRunStatus.ts` (`queryFn`).
- The run is read only when its identity is a non-empty string and the caller has not set `enabled` to false. `enabled` defaults to true. `src/features/ingest/api/useIngestRunStatus.ts` (`hasRunId && (params.enabled ?? true)`).
- The run is read again every 5 seconds until the last run read is `completed` or `failed`, and then polling stops. Before any run has been read, the interval is also 5 seconds. `src/features/ingest/api/useIngestRunStatus.ts` (`INGEST_RUN_POLL_MS = 5_000`, `terminalAwareRefetchInterval`).

### An LLM run as the client reads it
- An LLM run is read with these fields. `src/features/ingest/api/_transforms.ts` (`LlmRunWire`, `toLlmRun`):
  - `id`, `model`, `prompt_version` and `status`;
  - `started_at`, and `finished_at`, which may be null;
  - `attempts`, `input_raw_information_id` and `idempotency_key`;
  - `summary`;
  - optional `affected_nodes`, each with `id`, `node_type` and `canonical_name`.
- The run summary is read as nine counts: `accepted`, `consolidated`, `superseded_previous`, `needs_review`, `uncertain`, `disputed`, `rejected`, `error` and `orphaned_fragments`. `src/features/ingest/api/_transforms.ts` (`LlmRunSummaryWire`, `toLlmRunSummary`).
- `started_at` and a non-null `finished_at` are parsed as dates, and one that does not parse fails the read. `src/features/ingest/api/_transforms.ts` (`parseIso`, `parseIsoOrNull`).
- At run time the client does not check that the run status is one of its three values. It passes the status on as received. `src/features/ingest/api/_transforms.ts` (`toLlmRun` `status: wire.status`).
- Absent affected nodes on a run stay absent. `src/features/ingest/api/_transforms.ts` (`toLlmRun`, `wire.affected_nodes !== undefined`).

### Graph assembly after an ingestion
- For each affected node the caller passes, the client sends one `GET /api/v1/nodes/{id}/traverse?depth=1&direction=both`. All the traversals run in parallel and only while the caller's `enabled` gate is on. `src/features/ingest/api/useIngestGraphAssembly.ts` (`useQueries`, `enabled`).
- The traversal answer is read through the `{ ok, result }` envelope helper, not through `httpIngest`. `src/features/ingest/api/useIngestGraphAssembly.ts` (`http<TraverseResultMinWire>`).
- The graph is replaced only after every traversal has succeeded. It then shows the affected nodes, their depth-1 neighbours and the links between them. The previous graph is replaced, not added to, and the graph's status becomes `revealing`. `src/features/ingest/api/useIngestGraphAssembly.ts` (`successCount !== totalCount`, `replaceNodes(delta)`, `setStatus("revealing")`).
- When the gate is on and there are no affected nodes, the graph is replaced with an empty one and its status becomes `ready`. `src/features/ingest/api/useIngestGraphAssembly.ts` (`totalCount === 0`, `setStatus("ready")`).
- If any traversal fails, the graph is left as it was. The hook reports an error and no longer reports that it is assembling. `src/features/ingest/api/useIngestGraphAssembly.ts` (`hasError`, `isAssembling … && !hasError`).
- The hook reports how many traversals were sent and how many have settled. A failed traversal counts as settled. `src/features/ingest/api/useIngestGraphAssembly.ts` (`totalCount`, `settledCount`).
- An affected node enters the graph with its canonical name as label and its node type, and with no state. `src/features/ingest/api/useIngestGraphAssembly.ts` (`nodeMap.set(n.id, …)`).
- A neighbour enters the graph with its canonical name, its node type, and a state derived from its node status when it has one. `src/features/ingest/api/useIngestGraphAssembly.ts` (`mapTraverseNode`, `deriveNodeState`).
- A traversal entry never replaces an affected node. A neighbour reached by several traversals keeps the entry it got first. `src/features/ingest/api/useIngestGraphAssembly.ts` (`!nodeMap.has(wn.id)`).
- Each link enters the graph once by its identity, and a later traversal's copy replaces an earlier one. `src/features/ingest/api/useIngestGraphAssembly.ts` (`linkMap.set(wl.id, …)`).
- A link's fields are set like this. `src/features/ingest/api/useIngestGraphAssembly.ts` (`mapTraverseLink`, `mapLinkTypeLabel`, `deriveLinkState`):
  - its label is `link_type`, and its type label comes from `link_type` and `link_type_label`;
  - it is temporal only when `is_temporal` is true;
  - it carries in-effect when `is_in_effect` is given;
  - it carries a state derived from `status` and `flags` when `status` is given.

## Answers
- every ingestion request — no answer came within the 30-second cutoff → 0 `SYSTEM_TIMEOUT` ("Tempo limite excedido na requisição.", `details.cause`). `src/features/ingest/api/_request.ts` (`httpIngest` catch, `TimeoutError`).
- every ingestion request — the request was aborted by a caller's signal → 0 `SYSTEM_ABORTED` ("Requisição cancelada.", `details.cause`). `src/features/ingest/api/_request.ts` (`httpIngest` catch, `AbortError`).
- every ingestion request — any other failure to get an answer → 0 `SYSTEM_NETWORK` ("Falha de rede ao contactar o servidor.", `details.cause`). `src/features/ingest/api/_request.ts` (`httpIngest` catch).
- every ingestion request — first 401 and no new access token could be obtained → 401 `AUTH_SESSION_EXPIRED` ("Sua sessão expirou. Faça login novamente."). The auth store is cleared and the address replaced with `/sign-in?reason=session_expired` first. `src/features/ingest/api/_request.ts` (`trySilentRefresh`, 401 branch).
- every ingestion request — 401 to the resent request → read as the non-2xx answers below: the body's code, otherwise `SYSTEM_UNKNOWN`. `src/features/ingest/api/_request.ts` (`__retried`, error branch).
- every ingestion request — 2xx whose body is not JSON → that status `SYSTEM_INVALID_RESPONSE` ("Resposta do servidor não é JSON válido.", `details.cause`). `src/features/ingest/api/_request.ts` (2xx branch catch).
- every ingestion request — non-2xx whose body carries a string `error.code` → that status with the BFF's code, the BFF's `details`, and the BFF's `message` when it is a string, otherwise the fallback message for the status. `src/features/ingest/api/_request.ts` (`errObj`, `EnvelopeError`).
- every ingestion request — status 500 or above with no readable `error.code` → that status `SYSTEM_UPSTREAM` ("Algo deu errado. Tente novamente."). `src/features/ingest/api/_request.ts` (`response.status >= 500`).
- every ingestion request — any other non-2xx status with no readable `error.code` → that status `SYSTEM_UNKNOWN` ("Erro desconhecido do servidor."). `src/features/ingest/api/_request.ts` (error branch).
- read LLM run, run extraction, retry LLM run — the run's `started_at` or a non-null `finished_at` is not a parseable date → a plain error with no code ("Invalid ISO date string: <value>"). `src/features/ingest/api/_transforms.ts` (`parseIso`).
- graph assembly — any traversal fails → the graph is not replaced, and the hook reports `hasError`. `src/features/ingest/api/useIngestGraphAssembly.ts` (`hasError`, `successCount !== totalCount`).

## Vocabularies
- Source type, as sent: `pdf`, `email`, `ata`, `chat`, `artigo`, `transcricao`, `outro`. `src/features/ingest/api/_transforms.ts` (`SourceTypeWire`).
- Run status: `running`, `completed`, `failed`. `src/features/ingest/api/_transforms.ts` (`LlmRunStatusWire`).
- Outcome of ingest raw information: `created`, `noop_existing`. `src/features/ingest/api/_transforms.ts` (`IngestRawInformationResponseWire.outcome`, `IngestOutcome`).
- Node status, as read from a traversal: `active`, `needs_review`, `merged`, `deleted`. `src/features/ingest/api/useIngestGraphAssembly.ts` (`TraverseNodeMinWire.status`).
- Assertion flag, as read from a traversal link: `uncertain`, `disputed`, `low_confidence`. `src/features/ingest/api/useIngestGraphAssembly.ts` (`TraverseLinkMinWire.flags`).
- Failure codes the client mints itself: `SYSTEM_TIMEOUT`, `SYSTEM_ABORTED`, `SYSTEM_NETWORK`, `SYSTEM_INVALID_RESPONSE`, `SYSTEM_UPSTREAM`, `SYSTEM_UNKNOWN`, `AUTH_SESSION_EXPIRED`.
  - The failure's code is an open string, so it can also carry a code from the BFF's body. `src/features/ingest/api/_request.ts` (`httpIngest`, `EnvelopeError({ code })`).

## Upstream artifacts
- The BFF's ingestion answers are taken to send the answer itself on 2xx, and `{ error: { code, message, details } }` on failure. `src/features/ingest/api/_request.ts` (`httpIngest`).
- The BFF's traversal answer is taken to be `{ ok, result }`. Its `result` is read as `starting_node_id`, `nodes` and `links`. `src/features/ingest/api/useIngestGraphAssembly.ts` (`TraverseResultMinWire`, `http`):
  - each node has `id`, `node_type`, `canonical_name` and `status`;
  - each link has `id`, `source_node_id`, `target_node_id`, `link_type`, `link_type_label`, `is_temporal`, `is_in_effect`, `status` and `flags`.
- The identity provider's obtain-access-token is reached through the auth feature's `fetchAccessToken`, which is outside the area. `src/features/ingest/api/_request.ts` (`import { fetchAccessToken }`).
- The owner's access token is read from and written to the SPA's auth store, which is outside the area. `src/features/ingest/api/_request.ts` (`useAuthStore.getState().accessToken`, `setToken`, `clear`).
- The BFF address `VITE_BFF_URL` comes from the env module, which is outside the area. `src/features/ingest/api/_request.ts` (`getEnv`).
- The failure every request throws is the shared `EnvelopeError`, which is outside the area. `src/features/ingest/api/_request.ts` (`import { EnvelopeError } from "@/lib/http"`).
- The graph's display store and the graph feature's mappings live outside the area: node type, node state, link type label and link state. `src/features/ingest/api/useIngestGraphAssembly.ts` (`useGraphStore`, `mapNodeType`, `deriveNodeState`, `mapLinkTypeLabel`, `deriveLinkState`).

## Outside the domain
- The query-key factory `["ingest"]`, `["ingest","run",id]`, `["ingest","traverse",nodeId]` is cache wiring. `src/features/ingest/api/keys.ts`.
- The mutations take no cache slot and invalidate no cache entry. This is cache wiring. `src/features/ingest/api/useIngestRawInformation.ts`, `src/features/ingest/api/useRunLlmExtraction.ts`, `src/features/ingest/api/useRetryLlmRun.ts`.
- The run read's `staleTime: 0`, `refetchOnWindowFocus: false` and `retry: 2` are cache and retry wiring. `src/features/ingest/api/useIngestRunStatus.ts`.
- The traversal's `staleTime` of 5 minutes and `refetchOnWindowFocus: false` are cache wiring. `src/features/ingest/api/useIngestGraphAssembly.ts`.
- The re-application guard keyed on the sorted ids, the memoized id list and the delta tag `ingest_assembly` are rendering wiring. `src/features/ingest/api/useIngestGraphAssembly.ts`.
- The public re-exports and type aliases (`IngestRawInformationResponse`, `LlmRunStatus`) are module wiring. `src/features/ingest/api/index.ts`.
- The snake_case to camelCase mapping of answers is an internal representation. `src/features/ingest/api/_transforms.ts`.
- The URL join, abort-signal composition, `encodeURIComponent` of path identities and the test seam `__setIngestRedirectForTests` are transport wiring. `src/features/ingest/api/_request.ts`, `src/features/ingest/api/useIngestRunStatus.ts`, `src/features/ingest/api/useRunLlmExtraction.ts`, `src/features/ingest/api/useRetryLlmRun.ts`, `src/features/ingest/api/useIngestGraphAssembly.ts`.
- Header comments citing spec sections, the openapi file and CLAUDE.md are text, not evidence. `src/features/ingest/api/_request.ts`, `src/features/ingest/api/_transforms.ts`, `src/features/ingest/api/index.ts`, `src/features/ingest/api/keys.ts`, `src/features/ingest/api/useIngestGraphAssembly.ts`, `src/features/ingest/api/useIngestRawInformation.ts`, `src/features/ingest/api/useIngestRunStatus.ts`, `src/features/ingest/api/useRetryLlmRun.ts`, `src/features/ingest/api/useRunLlmExtraction.ts`.

## Observed and not decided here
- The area reads the same BFF's success answers in two shapes:
  - `src/features/ingest/api/_request.ts` (`httpIngest`) takes the 2xx body of ingest raw information, read LLM run, run extraction and retry LLM run as the answer itself, with no `{ ok, result }`;
  - `src/features/ingest/api/useIngestGraphAssembly.ts` (`http<TraverseResultMinWire>`) reads the traversal's success through the `{ ok, result }` envelope helper.
- The area handles a refreshed token in two ways:
  - `src/features/ingest/api/_request.ts` (`nextHeaders.set("Authorization", …)`) resends an ingestion request with the new token's bearer after a refresh;
  - `src/features/ingest/api/useIngestGraphAssembly.ts` (`headers: authHeader()`) builds the traversal's bearer once, when the request is built, and hands it to the shared `http` helper. On that path the area does not put the refreshed token back into the request.
