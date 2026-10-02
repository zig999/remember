---
contract_version: siegard-survey/1
target: frontend
files:
  - src/features/curation/api/_request.ts
  - src/features/curation/api/_transforms.ts
  - src/features/curation/api/curation.hooks.ts
  - src/features/curation/api/keys.ts
  - src/features/curation/api/node.hooks.ts
  - src/features/curation/api/provenance.hooks.ts
read_outside_area:
  - "src/lib/http.ts — the envelope-reading client that node.hooks.ts and provenance.hooks.ts call, and the source of the EnvelopeError the curation helper throws; opened to see how those reads are answered and retried"
  - "src/features/curation/types.ts — the request and answer shapes the hooks send and read (decisions, item kinds, request fields); opened to see the bodies the mutations serialize"
---

## Facts
### Curation requests to the BFF (shared behavior)
- Every curation request carries `Authorization: Bearer <access token>` when the auth store holds a token, and carries no Authorization header when it holds none. `src/features/curation/api/_request.ts` (`authHeader`).
- Every curation request goes to a path under the BFF base address and is cut off 30 seconds after it is sent. `src/features/curation/api/_request.ts` (`DEFAULT_TIMEOUT_MS = 30_000`, `httpCuration`).
- The 30-second cutoff runs only until the answer's status arrives. Reading the answer's body has no cutoff. `src/features/curation/api/_request.ts` (`clearTimeout(timer)` before `response.json()`).
- A cancellation from the caller is combined with the 30-second cutoff, so either one ends the request. `src/features/curation/api/_request.ts` (`composeSignals`).
- A successful curation answer (2xx) is read as the bare JSON body, with no `ok`/`result` envelope. `src/features/curation/api/_request.ts` (`httpCuration`, 2xx branch).
- A 204 curation answer is read as no value. `src/features/curation/api/_request.ts` (`response.status === 204`).
- A failed curation answer (any non-2xx status other than the first 401) is read from `error.code`, `error.message` and `error.details` in the body. No `ok` discriminator is checked. `src/features/curation/api/_request.ts` (`errObj`).
- The failure's code and message fall back independently of each other: a body with a string `error.code` and no string `error.message` keeps the BFF's code and gets the fallback message. `src/features/curation/api/_request.ts` (`httpCuration`, error branch).
- Order of checks in one curation request: first a request that got no answer at all (timeout before abort before network); then a first-attempt 401; then 2xx; then the error body. `src/features/curation/api/_request.ts` (`httpCuration`).
- On the first 401 of a request, the screen asks the identity provider for a fresh access token once. If that succeeds, it stores the token and resends the same request once, with Authorization set to the fresh token. `src/features/curation/api/_request.ts` (`trySilentRefresh`, `nextHeaders.set("Authorization", …)`).
- A resent request never refreshes again. A second 401 is read like any other failed answer. `src/features/curation/api/_request.ts` (`__retried`).
- The resent request gets its own 30-second cutoff. `src/features/curation/api/_request.ts` (recursive `httpCuration`).
- When the token refresh fails, the screen clears the held session, moves the owner to `/sign-in?reason=session_expired` (replacing the current history entry), and the request fails as an expired session. `src/features/curation/api/_request.ts` (`trySilentRefresh`, `redirectImpl`).

### Review queue (listing)
- The review queue is read with `GET /api/v1/curation/queue`. `kind`, `limit` and `offset` are sent as query parameters only when the caller gives them, and no default is sent. `src/features/curation/api/curation.hooks.ts` (`useListReviewQueue`, `buildQueueQs`).
- The review queue counts as stale as soon as it is read, is re-read every 30 seconds, and is re-read when the window regains focus. `src/features/curation/api/curation.hooks.ts` (`QUEUE_STALE_MS = 0`, `QUEUE_POLL_MS = 30_000`, `refetchOnWindowFocus: true`).
- A cached queue page is identified by the queue kind and a page number. Without an offset there is no page number. With an offset the page is `floor(offset / limit)`, with limit taken as 20 when not given, and as 0 when the limit is not positive. `src/features/curation/api/curation.hooks.ts` (`useListReviewQueue`, `page`).
- The page size is not part of a queue page's cache identity. Two reads with different limits that land on the same page number share one cached page. `src/features/curation/api/curation.hooks.ts` (`curationKeys.queue(params.kind, page)`); `src/features/curation/api/keys.ts` (`queue`).
- The queue answer is read as `total`, `limit`, `offset` and `items`. `src/features/curation/api/_transforms.ts` (`toReviewQueueList`).
- A queue item whose `kind` is `entity_match` is read as an entity-match queue item: `node_id`, `node_type`, `canonical_name`, `candidates`, `created_at`. `src/features/curation/api/_transforms.ts` (`toReviewQueueItem`, `toEntityMatchQueueItem`).
- Each entity-match candidate is read as `candidate_node_id`, `canonical_name` and `similarity`. `src/features/curation/api/_transforms.ts` (`toEntityMatchCandidate`).
- A queue item of any other kind is read as a dispute queue item: `item_kind`, `scope`, `sides`, `created_at`. `src/features/curation/api/_transforms.ts` (`toReviewQueueItem`, `toDisputeQueueItem`).
- A dispute's scope is read as `source_node_id`, `target_node_id`, `link_type`, `node_id` and `attribute_key`. `src/features/curation/api/_transforms.ts` (`toDisputeQueueItem`).
- Each side of a dispute is read as `item_id`, `value`, `target_node_id` (absent means none), `valid_from`, `valid_to`, `valid_from_source`, `confidence` and `status`. `src/features/curation/api/_transforms.ts` (`toDisputedItemSide`).
- `valid_from` and `valid_to` are read as dates when present. Null or absent means no date. `src/features/curation/api/_transforms.ts` (`parseIsoOrNull`).

### Curation metrics
- Curation metrics are read with `GET /api/v1/curation/metrics`. `src/features/curation/api/curation.hooks.ts` (`useCurationMetrics`).
- Curation metrics stay fresh for 30 seconds, are re-read when the window regains focus, are not polled, and a failed read is retried once. `src/features/curation/api/curation.hooks.ts` (`METRICS_STALE_MS = 30_000`, `refetchOnWindowFocus: true`, `retry: 1`).
- The metrics answer is read as `accept_rate`, `reject_rate_by_code`, `needs_review_count`, `uncertain_count`, `disputed_count`, `entity_match_queue_count`, `disputed_queue_count` and `computed_at`. `src/features/curation/api/_transforms.ts` (`toCurationMetrics`).

### Curation actions (writes)
- Every curation action is a `POST` with a JSON body (`Content-Type: application/json`) and the access token. The answer goes back to the caller as the bare body, without transformation. `src/features/curation/api/curation.hooks.ts` (`useResolveEntityMatch` … `useCorrectItem`).
- Resolving an entity match is `POST /api/v1/curation/entity-matches/{node_id}/resolve`, with the node id path-encoded and the resolution as the body. `src/features/curation/api/curation.hooks.ts` (`useResolveEntityMatch`).
- Merging nodes is `POST /api/v1/curation/nodes/merge`, and the body carries `survivor_id` and `absorbed_id`. `src/features/curation/api/curation.hooks.ts` (`useMergeNodes`).
- Resolving a dispute is `POST /api/v1/curation/disputes/resolve`, and the body carries `item_kind` and `item_ids`. `src/features/curation/api/curation.hooks.ts` (`useResolveDispute`).
- Confirming an item is `POST /api/v1/curation/items/confirm`, and the body carries `item_kind` and `item_id`. `src/features/curation/api/curation.hooks.ts` (`useConfirmItem`).
- Rejecting an item is `POST /api/v1/curation/items/reject`, and the body carries `item_kind` and `item_id`. `src/features/curation/api/curation.hooks.ts` (`useRejectItem`).
- Correcting an item is `POST /api/v1/curation/items/correct`, and the body carries `item_kind` and `item_id`. The answer's `new_item_id` is read. `src/features/curation/api/curation.hooks.ts` (`useCorrectItem`).
- After any successful curation action, the review queue and curation metrics are marked stale and read again. A failed action marks nothing stale. `src/features/curation/api/curation.hooks.ts` (`invalidateCurationAndAffected`, `onSuccess`).
- After a successful entity-match resolution, the detail of the resolved node is marked stale, and so is the detail of the body's `target_node_id` when one is given. `src/features/curation/api/curation.hooks.ts` (`useResolveEntityMatch`, `onSuccess`).
- After a successful merge, the details of the survivor node and the absorbed node are marked stale. `src/features/curation/api/curation.hooks.ts` (`useMergeNodes`, `onSuccess`).
- After a successful dispute resolution, the provenance of every item in `item_ids` is marked stale. `src/features/curation/api/curation.hooks.ts` (`useResolveDispute`, `onSuccess`).
- After a successful confirmation or rejection, the provenance of that item is marked stale. `src/features/curation/api/curation.hooks.ts` (`useConfirmItem`, `useRejectItem`).
- After a successful correction, the provenance of the corrected item and of the new item is marked stale, and so is the lineage history of the corrected item. `src/features/curation/api/curation.hooks.ts` (`useCorrectItem`, `historyKey`).
- An item kind of `link` selects the link provenance and link history. Any other item kind selects the attribute ones. `src/features/curation/api/curation.hooks.ts` (`invalidateCurationAndAffected`, `useCorrectItem`).
- Some actions do not touch some cached reads:
  - A correction, confirmation, rejection or dispute resolution does not mark any node detail stale.
  - An entity-match resolution or merge does not mark any provenance or history stale.
  `src/features/curation/api/curation.hooks.ts` (`invalidateCurationAndAffected` overlays).

### Node detail and lineage history (graph reads from the curation screen)
- Node detail is read with `GET /api/v1/nodes/{id}`, with the id path-encoded, through the envelope-reading client. `src/features/curation/api/node.hooks.ts` (`useCurationNodeDetail`).
- Node detail sends optional query parameters only in these cases: `as_of` when given, `in_effect_only=true` only when asked for, and `include_uncertain=false` only when uncertain attributes are excluded. `src/features/curation/api/node.hooks.ts` (`buildNodeQs`).
- Node detail is not requested while there is no node id or the node id is empty. `src/features/curation/api/node.hooks.ts` (`enabled`).
- A cached node detail is identified by the node id alone. Reads of the same node with a different `as_of`, in-effect or uncertain option share one cached entry. `src/features/curation/api/node.hooks.ts` (`nodeKeys.detail(nodeId ?? "")`); `src/features/curation/api/keys.ts` (`nodeKeys.detail`).
- Node detail, link history and attribute history stay fresh for 5 minutes and are not re-read on window focus. `src/features/curation/api/node.hooks.ts` (`STABLE_STALE_MS = 5 * 60_000`, `refetchOnWindowFocus: false`).
- The node detail answer is read as `node`, `aliases` and `attributes`. `src/features/curation/api/_transforms.ts` (`toNodeDetail`).
- The node part is read as `id`, `node_type`, `canonical_name`, `status` and `merged_into_node_id` (absent means none). `src/features/curation/api/_transforms.ts` (`toNodeSummary`).
- Each alias is read as `id`, `alias`, `kind` and `created_at` (absent means none). `src/features/curation/api/_transforms.ts` (`toNodeAlias`).
- Each attribute version is read as `id`, `node_id`, `attribute_key`, `value_type`, `value`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `effective_status`, `is_current`, `is_in_effect`, `confidence`, `valid_from_source`, `flags` and `supersedes_attribute_id`. `src/features/curation/api/_transforms.ts` (`toAttributeDetail`).
  - Absent fields have defaults: an absent `valid_from_source` means none, absent `flags` means no flags, and an absent `supersedes_attribute_id` means none.
- Link history is read with `GET /api/v1/links/{id}/history` and attribute history with `GET /api/v1/attributes/{id}/history`. Each is not requested without an id. `src/features/curation/api/node.hooks.ts` (`useLinkHistory`, `useAttributeHistory`).
- A history answer is read as `versions`. `src/features/curation/api/_transforms.ts` (`toLinkHistoryResponse`, `toAttributeHistoryResponse`).
- Each link version is read as `id`, `source_node_id`, `target_node_id`, `link_type`, `link_inverse_name`, `valid_from`, `valid_to`, `recorded_at`, `superseded_at`, `status`, `effective_status`, `is_current`, `is_in_effect`, `confidence`, `valid_from_source` (absent means none) and `supersedes_link_id` (absent means none). `src/features/curation/api/_transforms.ts` (`toLinkDetail`).

### Provenance and accepted fragments
- Provenance is read with three requests, each with the id path-encoded and sent through the envelope-reading client: `GET /api/v1/provenance/links/{id}` for a link, `GET /api/v1/provenance/attributes/{id}` for an attribute, and `GET /api/v1/provenance/fragments/{id}` for a fragment. `src/features/curation/api/provenance.hooks.ts` (`useProvenanceByLink`, `useProvenanceByAttribute`, `useProvenanceByFragment`).
- A provenance read is not requested without an id. It stays fresh for 5 minutes and is not re-read on window focus. `src/features/curation/api/provenance.hooks.ts` (`enabled`, `STABLE_STALE_MS = 5 * 60_000`).
- A provenance answer is read as `fragments`. Each fragment is read as `id`, `text`, `confidence`, `status` and `chunks`. `src/features/curation/api/_transforms.ts` (`toProvenanceResponse`, `toProvenanceFragment`).
- Each chunk of a provenance fragment is read as `id`, `chunk_index`, `offset_start`, `offset_end`, `excerpt`, `locator` (absent means empty) and `raw_information`. `src/features/curation/api/_transforms.ts` (`toProvenanceChunk`).
- The source of a provenance chunk is read as `id`, `source_type`, `received_at` and `metadata` (absent means empty). `src/features/curation/api/_transforms.ts` (`toProvenanceRawInformation`).
- Accepted fragments are read with `GET /api/v1/fragments/accepted`. `llm_run_id`, `raw_information_id`, `limit` and `offset` are sent as query parameters only when given. `src/features/curation/api/provenance.hooks.ts` (`useListAcceptedFragments`, `buildFragmentsQs`).
- Accepted fragments are not requested until a non-empty run id or a non-empty raw information id is given. `src/features/curation/api/provenance.hooks.ts` (`enabled`).
- When one accepted-fragment filter is non-empty and the other is given as an empty string, the empty one is still sent as an empty query parameter. `src/features/curation/api/provenance.hooks.ts` (`buildFragmentsQs`, `!== undefined`).
- A cached accepted-fragment page is identified by run id, raw information id, limit (20 when not given) and offset (0 when not given). The request itself sends no limit or offset when they are not given. `src/features/curation/api/provenance.hooks.ts` (`queryKey`, `buildFragmentsQs`).
- Accepted fragments stay fresh for 5 minutes and are not re-read on window focus. `src/features/curation/api/provenance.hooks.ts` (`useListAcceptedFragments`).
- The accepted-fragment answer is read as `total`, `limit`, `offset` and `items`. `src/features/curation/api/_transforms.ts` (`toAcceptedFragmentList`).
- Each item is read as `fragment_id`, `text`, `confidence`, `llm_run_id`, `created_at` and `source`. `src/features/curation/api/_transforms.ts` (`toAcceptedFragmentItem`).
- The source of an accepted fragment is read as `raw_information_id`, `chunk_index`, `source_type`, `received_at` and `document_title` (absent means none). `src/features/curation/api/_transforms.ts` (`toAcceptedFragmentSourceRef`).

### Dates read from answers
- Timestamps (`created_at`, `computed_at`, `received_at`, `recorded_at`) are required. Each is read as a date, and a value that is not a valid date fails the read. `src/features/curation/api/_transforms.ts` (`parseIso`).
- Validity and supersession dates (`valid_from`, `valid_to`, `superseded_at`) and an alias's `created_at` may be null or absent, which reads as no date. A present value that is not a valid date fails the read. `src/features/curation/api/_transforms.ts` (`parseIsoOrNull`).

### Cache identities other code reads
- Curation reads are cached under these keys: `["curation"]` for all curation reads, `["curation","queue",{kind,page}]` for a queue page, and `["curation","metrics"]` for metrics. `src/features/curation/api/keys.ts` (`curationKeys`).
- Provenance reads are cached under `["provenance","link",id]`, `["provenance","attribute",id]`, `["provenance","fragment",id]`, and `["provenance","accepted_fragments",{llmRunId,rawInformationId,limit,offset}]` for accepted fragments. `src/features/curation/api/keys.ts` (`provenanceKeys`); `src/features/curation/api/provenance.hooks.ts` (`queryKey`).
- Node detail is cached under `["nodes",id,"detail"]`, and lineage history under `["history","link",id]` and `["history","attribute",id]`. `src/features/curation/api/keys.ts` (`nodeKeys`, `historyKeys`); `src/features/curation/api/curation.hooks.ts` (`historyKey`).

## Answers
- Any curation request — no answer within 30 seconds of sending → 0 `SYSTEM_TIMEOUT` (message "Tempo limite excedido na requisição."; details `cause`). `src/features/curation/api/_request.ts` (`httpCuration`, `isTimeout`).
- Any curation request — cancelled by the caller before an answer → 0 `SYSTEM_ABORTED` (message "Requisição cancelada."; details `cause`). `src/features/curation/api/_request.ts` (`isAbort`).
- Any curation request — no answer for any other reason → 0 `SYSTEM_NETWORK` (message "Falha de rede ao contactar o servidor."; details `cause`). `src/features/curation/api/_request.ts` (`httpCuration`, catch).
- Any curation request — first 401 and the token refresh fails → 401 `AUTH_SESSION_EXPIRED` (message "Sua sessão expirou. Faça login novamente."; the session is cleared and the owner is moved to `/sign-in?reason=session_expired`). `src/features/curation/api/_request.ts` (`trySilentRefresh`, `httpCuration`).
- Any curation request — first 401 and the token refresh succeeds → the request is resent once with the fresh token, and its answer is the result. `src/features/curation/api/_request.ts` (`httpCuration`, `__retried: true`).
- Any curation request — 2xx whose body is not JSON → the answer's status `SYSTEM_INVALID_RESPONSE` (message "Resposta do servidor não é JSON válido."; details `cause`). `src/features/curation/api/_request.ts` (2xx branch).
- Any curation request — non-2xx with a string `error.code` in the body → the answer's status, with the BFF's own code, its `error.message` when that is a string, and its `error.details`. `src/features/curation/api/_request.ts` (error branch).
- Any curation request — status 500 or above with no string `error.code` → the answer's status `SYSTEM_UPSTREAM` (message "Algo deu errado. Tente novamente." unless the body carries a string message). `src/features/curation/api/_request.ts` (error branch).
- Any curation request — non-2xx status below 500 with no string `error.code`, including a resent request's second 401 → the answer's status `SYSTEM_UNKNOWN` (message "Erro desconhecido do servidor." unless the body carries a string message). `src/features/curation/api/_request.ts` (error branch).
- Any read in the area — a required timestamp, or a present optional date, that is not a valid date → the read fails with a plain error that carries no code (message "Invalid ISO date string: <value>"). `src/features/curation/api/_transforms.ts` (`parseIso`).

## Vocabularies
- Failure codes this screen makes up itself for curation requests: `SYSTEM_TIMEOUT`, `SYSTEM_ABORTED`, `SYSTEM_NETWORK`, `AUTH_SESSION_EXPIRED`, `SYSTEM_INVALID_RESPONSE`, `SYSTEM_UPSTREAM`, `SYSTEM_UNKNOWN`. `src/features/curation/api/_request.ts` (`httpCuration`).
- Review queue item kinds as read: `entity_match`, with every other value read as `disputed`. `src/features/curation/api/_transforms.ts` (`toReviewQueueItem`).
- Item kinds as used for provenance and history: `link`, with every other value treated as `attribute`. `src/features/curation/api/curation.hooks.ts` (`invalidateCurationAndAffected`, `useCorrectItem`).
- Sign-in reason sent when a session cannot be refreshed: `session_expired`. `src/features/curation/api/_request.ts` (`trySilentRefresh`).

## Upstream artifacts
- These curation endpoints of the BFF answer with a bare body on success: `/api/v1/curation/queue`, `/api/v1/curation/metrics`, `/api/v1/curation/entity-matches/{node_id}/resolve`, `/api/v1/curation/nodes/merge`, `/api/v1/curation/disputes/resolve`, `/api/v1/curation/items/confirm`, `/api/v1/curation/items/reject`, `/api/v1/curation/items/correct`. On failure they answer `{ error: { code, message, details } }`. `src/features/curation/api/curation.hooks.ts`; `src/features/curation/api/_request.ts`.
- These graph-read endpoints of the BFF are read through the envelope-reading client: `/api/v1/nodes/{id}`, `/api/v1/links/{id}/history`, `/api/v1/attributes/{id}/history`. `src/features/curation/api/node.hooks.ts`.
- These retrieval endpoints of the BFF are read through the envelope-reading client: `/api/v1/provenance/links/{id}`, `/api/v1/provenance/attributes/{id}`, `/api/v1/provenance/fragments/{id}`, `/api/v1/fragments/accepted`. `src/features/curation/api/provenance.hooks.ts`.
- The identity provider's token mint is called once on a first 401 to get a fresh access token. `src/features/curation/api/_request.ts` (`fetchAccessToken`).
- The owner-access session store supplies the access token, takes a refreshed token, and is cleared when refresh fails. `src/features/curation/api/_request.ts` (`useAuthStore`).
- The BFF base address comes from the environment. `src/features/curation/api/_request.ts` (`getEnv().VITE_BFF_URL`).

## Outside the domain
- Base-URL joining, and passing absolute `http(s)` paths through unchanged (URL wiring). `src/features/curation/api/_request.ts`.
- Combining several abort signals into one (framework plumbing). `src/features/curation/api/_request.ts`.
- The test-only redirect seam `__setCurationRedirectForTests` (testing). `src/features/curation/api/_request.ts`.
- The `__retried` flag carried through request options (internal recursion guard). `src/features/curation/api/_request.ts`.
- `unwrapOk` / `OkEnvelope`, an envelope helper no hook in the area calls (unused helper). `src/features/curation/api/_transforms.ts`.
- Renaming wire fields from snake_case to camelCase domain fields (internal representation). `src/features/curation/api/_transforms.ts`.
- TanStack Query hook wiring: `useQuery`, `useMutation`, `useQueryClient` (framework). `src/features/curation/api/curation.hooks.ts`; `src/features/curation/api/node.hooks.ts`; `src/features/curation/api/provenance.hooks.ts`.
- Path-encoding of ids with `encodeURIComponent` (transport). `src/features/curation/api/curation.hooks.ts`; `src/features/curation/api/node.hooks.ts`; `src/features/curation/api/provenance.hooks.ts`.
- The `as const` tuple form of the key factories (typing). `src/features/curation/api/keys.ts`.

## Observed and not decided here
- After a token refresh, the area's two request paths resend with different tokens.
  - The curation path resends with the fresh token: `src/features/curation/api/_request.ts` (`nextHeaders.set("Authorization", \`Bearer ${fresh}\`)`).
  - The graph and provenance reads build their headers once (`headers: authHeader()`) and hand them to the envelope-reading client: `src/features/curation/api/node.hooks.ts` (`useCurationNodeDetail`, `useLinkHistory`, `useAttributeHistory`) and `src/features/curation/api/provenance.hooks.ts` (all four hooks). That client (read outside the area) resends the same options (`{ ...opts, __retried: true }`), so the resent read carries the token from before the refresh.
- A non-JSON failed answer below 500 gets a different code depending on the path.
  - On the curation path it becomes `SYSTEM_UNKNOWN` "Erro desconhecido do servidor.": `src/features/curation/api/_request.ts` (error branch).
  - The graph and provenance reads go through the envelope-reading client (read outside the area), which turns the same answer into `SYSTEM_INVALID_RESPONSE`: `src/features/curation/api/node.hooks.ts`, `src/features/curation/api/provenance.hooks.ts` (`http<…>`).
