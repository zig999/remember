---
contract_version: siegard-survey/0-pilot
target: backend
files:
  - src/modules/query-retrieval/index.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/dto/fragment.dto.ts
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/search.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/repository/fts-config.ts
  - src/modules/query-retrieval/repository/scoring.ts
  - src/modules/query-retrieval/mcp/query-toolset.ts
read_outside_context:
  - src/modules/knowledge-graph/traversal/config.ts
  - src/modules/knowledge-graph/service/errors.ts
read_outside_target:
  - ../migrations/0001_init.sql
  - ../migrations/0006_original_input.sql
---

Pilot survey, hand-written, read from source alone. No documentation was read, and every code
comment was ignored as evidence: several cite requirement ids of an earlier specification
(`BR-nn`, `UC-nn`), and a comment is not what the code does. Paths are relative to the backend
target unless marked `../`. Tests were not read for facts; they are the certification candidates
of a later step.

## Facts

### Search

- The owner searches the knowledge base with a text query and receives ranked items. `routes/query-retrieval.routes.ts` (`GET /search`), `mcp/query-toolset.ts` (tool `search`).
- A query is between 1 and 1000 characters, and is refused when it is empty after trimming whitespace. `dto/search.dto.ts` (`QueryString`).
- A query whose lexical parse yields nothing (for example, stop words only) is refused as an invalid search query. `service/search.service.ts` (`parsed === ""` → `InvalidSearchQueryError("empty_after_parse")`).
- A search reads three layers: fragment, node, and chunk. A request may name any subset; naming none reads all three; naming a value outside the three is refused as an invalid search layer. `dto/search.dto.ts` (`ALLOWED_LAYERS`), `service/search.service.ts` (`resolveLayers`).
- The fragment layer matches only accepted information fragments. `repository/search.repository.ts` (`searchFragmentLayer`: `f.status = 'accepted'`).
- The node layer matches a knowledge node through any of its aliases, and never matches a node that is merged or deleted. `repository/search.repository.ts` (`searchNodeAliasLayer`: `kn.status NOT IN ('merged','deleted')`).
- The chunk layer matches only raw chunks that are not superseded. `repository/search.repository.ts` (`searchChunkLayer`: `rc.superseded_at IS NULL`).
- A chunk never surfaces as a result item: chunk matches only count how many chunks a matched fragment already covers. `service/search.service.ts` (chunk hits never pushed to `items`; `dedupCollapsedCount`).
- A node surfaces only when at least one accepted fragment mentions one of its aliases; a node with no such fragment is dropped. `service/search.service.ts` (`if (provenance.length === 0) continue`), `repository/search.repository.ts` (`listProvenanceForNodes`).
- Each layer's match strength is weighted: fragment 1.0, node 0.9, chunk 0.6. `repository/scoring.ts`.
- Prose (fragments, chunks, provenance of nodes) is matched with a Portuguese, accent-insensitive configuration; aliases are matched with a language-neutral, accent-insensitive configuration. `repository/fts-config.ts`, `../migrations/0001_init.sql` (`pt_unaccent_v1`, `simple_unaccent_v1`).
- Search expands through the knowledge graph from matched nodes by default, to depth 1, with depth allowed from 1 to 3; expansion can be turned off. `dto/search.dto.ts` (`expand` default `true`, `expand_depth` 1..3 default 1), `service/search.service.ts`.
- Expansion may be restricted to named link types; a link type name the catalog does not hold is refused as an unknown link type. Link type names are ignored when expansion is off. `service/search.service.ts` (`resolveLinkTypeIds`), `src/modules/knowledge-graph/service/errors.ts` (`BUSINESS_UNKNOWN_LINK_TYPE`).
- Expansion follows links in both directions and surfaces each link reached as a result item. `service/search.service.ts` (`direction: "both"`).
- A link reached at hop h scores 0.5^h times the score of the matched node it was reached from. `service/search.service.ts` (`Math.pow(TRAVERSAL_DECAY, hop) * sourceScore`), `src/modules/knowledge-graph/traversal/config.ts` (`TRAVERSAL_DECAY = 0.5`).
- A link with no provenance is dropped from the results. `service/search.service.ts` (`provenance.length === 0` → `continue`).
- `as_of` (a calendar date) and `in_effect_only` (default false) apply only to graph expansion, not to the fragment, node, or chunk layers. `service/search.service.ts` (passed only to `traverseNodes`), `dto/search.dto.ts`.
- `include_uncertain` defaults to true; when false, items whose status is `uncertain` are excluded. `dto/search.dto.ts`, `service/search.service.ts` (steps g and h).
- Each item carries flags: `uncertain` when its status is uncertain, `disputed` when its status is disputed, and `low_confidence` when it is an accepted fragment with confidence below 0.4. `service/search.service.ts` (`computeFlags`, `LOW_CONFIDENCE_THRESHOLD = 0.4`).
- Items are ranked by score descending, then by recording time descending, then by identifier ascending; nodes carry no recording time. `service/search.service.ts` (sort; `recordedAtTs: 0` for nodes).
- Results are paginated with `limit` from 1 to 100 (default 20) and `offset` of at least 0 (default 0); `total` counts the items before pagination. `dto/search.dto.ts`, `service/search.service.ts`.
- Each item carries its kind (node, link, fragment), its layer, its score, its hop, a summary, its flags, and its provenance entries; a link's summary reads `source -[link type]-> target` with canonical names. `dto/response.dto.ts` (`SearchItem`), `service/search.service.ts`.
- A search item's provenance entry names the fragment, its text and confidence, the raw information it came from, the source type, the reception time, and the excerpt of the chunk. `dto/response.dto.ts` (`SearchProvenanceEntry`).
- Search does not exclude fragments whose raw information was deleted for compliance. `repository/search.repository.ts` (no `compliance_deletion` check in any search layer or in `listProvenanceFor*`).

### Provenance

- The owner can ask for the provenance of a knowledge link, a node attribute, or an information fragment. `routes/query-retrieval.routes.ts`, `mcp/query-toolset.ts` (tools `get_provenance_link`, `get_provenance_attribute`, `get_provenance_fragment`).
- Provenance of a link or an attribute that does not exist is refused as not found. `service/provenance.service.ts` (`ResourceNotFoundError("KnowledgeLink" | "NodeAttribute")`).
- Provenance of a fragment that does not exist is refused as not found; of a fragment that exists and is not accepted, it is refused as fragment not accepted. `service/provenance.service.ts`.
- A provenance answer lists fragments, each with its text, confidence, status, and the chunks it came from; each chunk carries its index, offsets, excerpt, locator, and its raw information (source type, reception time, metadata, original input). `dto/response.dto.ts` (`ProvenanceFragment`, `ProvenanceChunk`, `ProvenanceRawInformation`), `service/provenance.service.ts` (`groupChain`).
- When any raw information in the chain was deleted for compliance, the whole provenance request is refused as raw information deleted, naming the earliest such deletion. `service/provenance.service.ts` (`findTombstone` before anything else), `repository/provenance.repository.ts` (`ORDER BY executed_at ASC LIMIT 1`).
- The compliance-deletion check precedes the empty-chain check. `service/provenance.service.ts` (`finalise`).
- An existing link, attribute, or fragment with an empty provenance chain is answered as an internal error. `service/provenance.service.ts` (`EmptyProvenanceError`), `service/errors.ts` (`SYSTEM_INTERNAL_ERROR`, 500).
- A link's or an attribute's provenance lists its fragments in the order the provenance was recorded. `repository/provenance.repository.ts` (`ORDER BY p.created_at ASC`).

### Accepted fragments

- The owner can list accepted fragments filtered by LLM run, by raw information, or both; a request naming neither is refused. `dto/fragment.dto.ts` (`refine`, `requires_one_of`).
- The list excludes fragments whose raw information was deleted for compliance. `repository/accepted-fragments.repository.ts` (`NOT EXISTS ... compliance_deletion`).
- Each fragment appears once, attributed to its lowest-index chunk. `repository/accepted-fragments.repository.ts` (`DISTINCT ON (f.id) ... ORDER BY f.id, rc.chunk_index ASC`).
- The list is ordered by reception time of the source descending, then fragment creation time descending, then fragment identifier ascending; paginated as search is. `repository/accepted-fragments.repository.ts`, `dto/fragment.dto.ts`.
- Each listed fragment carries its text, confidence, LLM run, creation time, and its source (raw information, chunk index, source type, reception time, document title). `dto/fragment.dto.ts` (`AcceptedFragmentItem`).
- This list is offered over REST only; the MCP toolset exposes search and the three provenance reads. `mcp/query-toolset.ts` (`QUERY_RETRIEVAL_TOOL_NAMES` has four names).

### Shared answers

- Every read runs in a read-only transaction. `routes/query-retrieval.routes.ts`, `mcp/query-toolset.ts` (`withReadOnly`).
- Both transports answer `{ ok, result }` on success and `{ ok: false, error: { code, message, details } }` on refusal, with the same codes. `routes/query-retrieval.routes.ts` (`mapErrorToHttpResponse`), `mcp/query-toolset.ts` (`mapErrorToEnvelope`).
- Refusal codes and statuses: `BUSINESS_INVALID_SEARCH_QUERY` 422, `BUSINESS_INVALID_SEARCH_LAYER` 422 (naming the allowed layers), `BUSINESS_UNKNOWN_LINK_TYPE` 422, `BUSINESS_FRAGMENT_NOT_ACCEPTED` 404, `BUSINESS_RAW_INFORMATION_DELETED` 410, not found 404, `SYSTEM_INTERNAL_ERROR` 500 on an empty chain. `service/errors.ts`, `routes/query-retrieval.routes.ts`.

### Vocabularies read

- Source type: pdf, email, ata (meeting minutes), chat, artigo (article), transcricao (transcript), outro (other). `dto/response.dto.ts` (`SourceType`), `../migrations/0001_init.sql` (`source_type`).
- Fragment status: proposed, accepted, rejected, superseded, deleted. `../migrations/0001_init.sql` (`fragment_status`).
- Node status: active, needs_review, merged, deleted. `../migrations/0001_init.sql` (`node_status`).
- Assertion status (links and attributes): active, uncertain, disputed, superseded, deleted. `../migrations/0001_init.sql` (`assertion_status`).
- Assertion flag: uncertain, disputed, low_confidence. `dto/response.dto.ts` (`AssertionFlag`).
- Search layer: fragment, node, chunk. Search item kind: node, link, fragment. `dto/response.dto.ts`.

## Upstream artifacts

Every table this context reads is written by another module of the same system; this context
only reads. Whether those are upstream contracts or elements of other contexts is the analysis's
decision. Read here: `information_fragment`, `fragment_source`, `raw_chunk`, `raw_information`,
`knowledge_node`, `node_alias`, `knowledge_link`, `link_type`, `node_attribute`, `provenance`,
`compliance_deletion`. The graph traversal is the knowledge-graph module's `traverseNodes`.

## Outside the domain

- Transport and wiring: REST paths, MCP tool names and JSON schemas, Fastify registration, the
  shared `query` MCP server. `routes/`, `mcp/`, `index.ts`.
- Per-layer fetch cap of 200 before ranking. `service/search.service.ts` (`PER_LAYER_FETCH_LIMIT`).
- Log events and their fields. `service/*.ts`.
- Text-search configuration names and index shapes. `repository/fts-config.ts`, `../migrations/0001_init.sql`.

## Observed and not decided here

- The TypeScript fragment status in a provenance answer lists four values (no `superseded`),
  while the database enumeration has five. `dto/response.dto.ts` (`ProvenanceFragment.status`),
  `../migrations/0001_init.sql`.
- Search surfaces fragments of compliance-deleted sources, while the accepted-fragments list and
  the provenance reads exclude or refuse them. Both behaviors are in the code; which one the
  business holds is for the documentation increment to say.
