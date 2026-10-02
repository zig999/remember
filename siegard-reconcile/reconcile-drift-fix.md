---
contract_version: siegard-reconcile/8
title: Restamp the three files corrected by the drift-corrections delivery
summary: The three files were changed by the delivery of the drift-corrections plan, which restamped them
  under its own nodes. The owner states the behavior is correct.
target: backend
files:
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: corrected by the drift-corrections delivery; read against every node bound to it
- path: src/modules/ingestion/validation/structural.ts
  change: corrected by the drift-corrections delivery; read against every node bound to it
- path: src/modules/query-retrieval/service/search.service.ts
  change: corrected by the drift-corrections delivery; read against every node bound to it
nodes:
- node: constraints/retrieval-is-lexical-only
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the layer calls (lines 116-136)
    and the `parseTsQuery` call (line 104), which use only the lexical repository functions — `fragmentHits
    = await searchFragmentLayer(client, input.query, PER_LAYER_FETCH_LIMIT);` with no embedding or similarity
    call anywhere in the file'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/information-fragment
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/search.service.ts read
    `nowhere` — The file reads `f.text`, `f.confidence` and `f.created_at` from `FragmentHitRow`. It declares
    no shape for the fragment.'
  observed_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/item-kind
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `kind` field of `IntermediateItem`
    (line 59) — `readonly kind: "node" | "link" | "fragment";`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/page
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `limit` and `offset` of `SearchServiceInput`
    (lines 53-54) — `readonly limit: number; readonly offset: number;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/prompt-version
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/prompts/extraction.v4.ts read `nowhere`
    — The file declares no enumeration, type or table of versions. It only exports one value of the vocabulary:
    `export const PROMPT_VERSION = "v4" as const;`. That passes the value along and does not declare the
    shape.'
  observed_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
- node: domain/knowledge-base/search-layer
  conforms: false
  how: 'no named file holds this fact now: src/modules/query-retrieval/service/search.service.ts read
    `nowhere` — The file only imports `ALLOWED_LAYERS, type SearchLayer` from "../dto/search.dto.js",
    where `export const ALLOWED_LAYERS = ["fragment", "node", "chunk"] as const;` is declared.'
  observed_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/search-query
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `SearchServiceInput` (lines 44-55)
    — `readonly query: string; readonly layers?: readonly string[]; readonly asOf?: string; readonly inEffectOnly:
    boolean; readonly includeUncertain: boolean; readonly expand: boolean; readonly expandDepth: number;
    readonly expandLinkTypes?: readonly string[];`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/attribute-value-in-allowed-values
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at assertValueInDomain, lines 73-86 — if
    (domain.has(value)) { return; } ... throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "attribute
    value not in closed domain", { value, allowed_values }) with allowed_values = [...domain].sort().
    Membership is an exact string match, and the refusal names the value and the allowed values in sorted
    order, as the ingestion contract answers.'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/attribute-value-parses
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at parseAttributeValue, lines 16-71, with
    DATE_SHAPE and namesExistingDay — DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/ followed by namesExistingDay(...);
    number is /^-?\d+(?:\.\d+)?$/ followed by Number.isFinite(n); bool is v !== "true" && v !== "false";
    the text case is `case "text": return;`.'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/caller-never-states-received
  conforms: false
  how: 'no named file holds this fact now: src/modules/ingestion/prompts/extraction.v4.ts read `nowhere`
    — No construct in the file states the basis `received`, forbids it, or validates it. The fallback
    directive says only "fall back to the date portion of received_at (the `YYYY-MM-DD` prefix of the
    ISO-8601 string)", and names no basis for that case. The only bases it names are `"document"` (a relative
    date resolved against `document_date`) and `"stated"` (absolute dates). The prompt does not ask the
    model to state `received`, so it does not conflict with the node.'
  observed_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
- node: rules/knowledge-base/chunk-match-cites-its-fragment
  conforms: false
  how: 'src/modules/query-retrieval/service/search.service.ts, the dedup block (lines 138-155) and the
    fragment item built in the `fragmentHits` loop (lines 159-193): `for (const link of dedupLinks) {
    if (!chunksById.has(link.raw_chunk_id)) continue; dedupCollapsedCount += 1; }` and the fragment item
    takes `summary: f.text` and `provenance` from `listProvenanceForFragments`; nothing ever reads a matched
    chunk''s text or excerpt into the fragment item. — The chunk-to-fragment link is looked up and only
    counted for the `dedup_collapsed_count` log field. The rule says the chunk match is shown as the fragment''s
    excerpt, but no code in this file does it. A reader who trusts the node will assume the matched passage
    reaches the fragment''s search item. In this file it does not.'
  observed_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/chunk-match-never-surfaces
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `items` assembly (lines 157-228)
    — `chunkHits` is fetched but only `fragmentHits` and `nodeHits` are pushed into `items`. The only
    `items.push` calls build `key: \`fragment:${f.id}\``, `key: \`node:${n.node_id}\`` and expanded link
    items.'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expanded-link-requires-provenance
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `toExpandedLinkItem` (lines 368-381)
    — `if (provenance.length === 0) { context.logger.warn(... "query_retrieval_search_empty_link_provenance");
    return undefined; }`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-as-of-view
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `traverseNodes` call in `collectExpandedLinks`
    (lines 313-324), which forwards the as-of date. The validity comparison itself is in the knowledge-graph
    traversal, not this file. — `asOf: context.input.asOf,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-decay
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `collectExpandedLinks` (lines 325-331)
    — `score: Math.pow(TRAVERSAL_DECAY, link.hop) * startScore,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-follows-both-directions
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `traverseNodes` call (line
    315) — `direction: "both",`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-in-effect-only
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `traverseNodes` call in `collectExpandedLinks`
    (lines 313-324), which forwards the switch. The in-effect comparison is in the knowledge-graph traversal,
    not this file. — `inEffectOnly: context.input.inEffectOnly,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `resolveLinkTypeIds` (lines 418-432)
    and the `linkTypeIds` passed to `traverseNodes` (line 318) — `linkTypeIds: context.linkTypeIds,` where
    `linkTypeIds = input.expand ? resolveLinkTypeIds(catalog, input.expandLinkTypes) : undefined`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-starts-from-matched-nodes
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the expansion branch (lines 230-239)
    and `collectExpandedLinks` (lines 312-313) — `if (input.expand && nodeHits.length > 0) {` and `for
    (const [startId, startScore] of matchedNodeScores) {` with `startingNodeIds: [startId],`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/extraction-never-invents-a-date
  conforms: true
  how: 'src/modules/ingestion/prompts/extraction.v4.ts: held at the last line of the RECEIVED_AT_ANCHOR_DIRECTIVE
    array, which is the text `system()` appends to the prompt (line 30) — "  text remain `\"stated\"`;
    never invent a date.", This is appended to the system prompt by `return `${systemV3(catalog)}\n${RECEIVED_AT_ANCHOR_DIRECTIVE}`;`'
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v4.ts
- node: rules/knowledge-base/fragment-item-summary
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the fragment item (line 186) —
    `summary: f.text,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/item-flags
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `computeFlags` (lines 460-476)
    and `LOW_CONFIDENCE_THRESHOLD` (line 42) — `if (args.status === "uncertain") flags.push("uncertain");
    if (args.status === "disputed") flags.push("disputed"); if (args.kind === "fragment" && args.status
    === "accepted" && args.confidence < LOW_CONFIDENCE_THRESHOLD)` with `const LOW_CONFIDENCE_THRESHOLD
    = 0.4;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/link-item-summary
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `toExpandedLinkItem` (line 395)
    — `summary: \`${meta.source_canonical_name} -[${meta.link_type}]-> ${meta.target_canonical_name}\`,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/link-types-ignored-without-expansion
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `linkTypeIds` computation (lines
    100-102) — `const linkTypeIds = input.expand ? resolveLinkTypeIds(catalog, input.expandLinkTypes)
    : undefined;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/node-item-summary
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the node item (line 222) — `summary:
    n.canonical_name,`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the provenance guard in the `nodeHits`
    loop (line 207). The accepted-fragment condition itself sits in the repository query (`JOIN information_fragment
    f ON f.status = ''accepted''`), not this file. — `if (provenance.length === 0) continue;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/node-type-in-catalog
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at assertKnownType, lines 102-120, the node_type
    branch — if (!args.found) { const code = args.kind === "node_type" ? "BUSINESS_UNKNOWN_NODE_TYPE"
    : ... } throw new ValidationFailure(code, `${args.kind} ''${args.name}'' is not in the seeded catalog.`,
    { kind: args.kind, name: args.name }). The refusal names the node type with the code the contract
    gives. The catalog lookup that sets found is done by the caller.'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/non-expanding-search-walks-no-graph
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the expansion guard (line 231)
    — `if (input.expand && nodeHits.length > 0) {`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/search-layer-candidate-cap
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `PER_LAYER_FETCH_LIMIT` (line 40)
    and `total` (line 252) — `const PER_LAYER_FETCH_LIMIT = 200;` and `const total = filtered.length;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/search-option-defaults
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the `resolveLayers` branch for
    an absent layer list (lines 405-407). The expand, depth, uncertain and in-effect-only defaults are
    declared in search.dto.ts, not this file. — `if (layers === undefined || layers.length === 0) { return
    new Set(ALLOWED_LAYERS); }`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/search-ranking
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the sort comparator (lines 245-250)
    and the node item''s `recordedAtTs: 0` — `if (b.score !== a.score) return b.score - a.score; if (b.recordedAtTs
    !== a.recordedAtTs) return b.recordedAtTs - a.recordedAtTs; return a.id < b.id ? -1 : a.id > b.id
    ? 1 : 0;`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/search-total-before-pagination
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at lines 252-253 — `const total =
    filtered.length; const sliced = filtered.slice(input.offset, input.offset + input.limit);`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/temporal-filters-apply-to-expansion-only
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `asOf` and `inEffectOnly` are used
    only in the `traverseNodes` call (lines 320-321). The fragment and node hits are fetched without them.
    — `fragmentHits = await searchFragmentLayer(client, input.query, PER_LAYER_FETCH_LIMIT);` takes no
    date argument.'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/uncertain-items-excluded-on-request
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at lines 241-243, and the same guard
    for expanded links at lines 383-385 — `const filtered = input.includeUncertain ? items : items.filter((it)
    => it.status !== "uncertain");`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/unknown-link-type-refused
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at `resolveLinkTypeIds` (lines 425-428),
    reached only when `input.expand` is true — `if (row === undefined) { throw new UnknownLinkTypeError(name);
    }`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: scenarios/knowledge-base/impossible-calendar-date-refused
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at parseAttributeValue date branch and namesExistingDay,
    lines 6-14 and 24-41 — candidate.setUTCFullYear(year, month - MONTH_INDEX_OFFSET, day); return (candidate.getUTCFullYear()
    === year && candidate.getUTCMonth() === month - MONTH_INDEX_OFFSET && candidate.getUTCDate() === day);
    2024-02-30 rolls over to March 1, so the check fails and a ValidationFailure is thrown before any
    attribute is recorded.'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: scenarios/knowledge-base/stop-words-only-query
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the parse guard (lines 104-110)
    — `const parsed = await parseTsQuery(client, input.query); if (parsed === "") { throw new InvalidSearchQueryError("empty_after_parse",
    {`'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the lexical layer calls (lines
    116-136) with an empty result flowing to `total = filtered.length` — `const total = filtered.length;`
    over items built only from `fragmentHits`, `nodeHits` and graph expansion from matched nodes'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/link-type-in-catalog
  conforms: true
  how: 'a certified test decides this node, and every step the registry named for it passed over the tree
    as these files stand — run/reconcile-drift-fix: `test` passed (exit 0) over npm test. No judge read
    this pair, and the run is the whole of what answered it'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
unstated:
- file: src/modules/query-retrieval/service/search.service.ts
  where: '`toExpandedLinkItem`, the returned object (lines 387-399)'
  evidence: '`kind: "link", layer: "node",`'
  cost: The search-item node types `layer` as a search-layer and never says which layer an expanded link
    item carries. The code decides `node`, and the next reader will look in the specification for it and
    not find it.
pairs_omitted:
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: contracts/knowledge-base/ingestion
  file: src/modules/ingestion/validation/structural.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/search-item
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-hop
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-drift-fix.returns/.

  1 pair(s) over 1 node(s) were decided by run/reconcile-drift-fix rather than by a judge — a registry
  step decides the constraint, or a certified test decides the node — with step(s) test. No delegation
  read them; the run''s own log is the evidence, and it sits beside these returns.

  A finding in src/modules/ingestion/validation/structural.ts names contracts/knowledge-base/ingestion,
  which no file of this set is bound to: parseAttributeValue, the number branch''s finiteness check (lines
  51-57) and the bool branch (lines 60-68): throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "value
  is not a finite number.", { value: v }); and throw new ValidationFailure("VALIDATION_INVALID_FORMAT",
  "value does not parse as a bool (expected ''true'' or ''false'').", { value: v }). The date and number-shape
  refusals carry { value: v, value_type: args.value_type }. — The ingestion contract says a value that
  fails to parse is refused "naming the value and its value type". Two of the four parse refusals name
  only the value. A caller that reads the refusal details for the value type finds it for date and for
  a malformed number, and does not find it for a bool or a non-finite number. The same rule is answered
  in two shapes.. It blocks nothing here; it is owed a route of its own.

  Candidates: 3 opened across 1 of 3 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-drift-fix.returns/`, which are the evidence behind every entry above.
