---
contract_version: siegard-reconcile/8
title: Adoption of the query-retrieval module source (context query-retrieval)
summary: The query-retrieval source under backend/src/modules/query-retrieval is adopted as it stands
  and did not change. No delivery wrote it; the human names these 15 files and the 84 nodes /analyse wrote
  from material read from them as the candidates, and asserts the source as the premise the judgment is
  read against.
target: backend
files:
- path: src/modules/query-retrieval/dto/fragment.dto.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/dto/response.dto.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/dto/search.dto.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/index.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/mcp/query-toolset.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/repository/fts-config.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/repository/provenance.repository.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/repository/scoring.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/repository/search.repository.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/routes/query-retrieval.routes.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/service/accepted-fragments.service.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/service/errors.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/service/provenance.service.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
- path: src/modules/query-retrieval/service/search.service.ts
  change: Unchanged — adopted as it stands; no delivery wrote it and nothing was edited for this reconciliation.
nodes:
- node: constraints/llm-toolset-omits-fragment-listing
  conforms: false
  how: 'src/modules/query-retrieval/index.ts, lines 7-9, the comment above the `query-toolset.js` re-export:
    // MCP toolset registration — registers the four query-retrieval read tools

    // onto the shared `query` MCP server instance owned by `knowledge-graph`

    // (BR-23 of `query-retrieval.back.md`). — The size of the language model''s query tool surface (four
    tools, which leaves out the accepted-fragment listing) appears in this file only as a count in prose,
    and it cites a back-spec rule as the authority. No code in this file states which tools exist or that
    the listing is absent. A reader of this file would take the comment as where the surface is decided.
    The constraint node decides it.'
  observed_at:
  - src/modules/query-retrieval/index.ts
- node: constraints/retrieval-is-lexical-only
  conforms: true
  how: 'src/modules/query-retrieval/repository/search.repository.ts: held at the layer queries, which
    match only through full-text operators (searchFragmentLayer, searchNodeAliasLayer, searchChunkLayer)
    — f.text_search @@ websearch_to_tsquery($1::regconfig, $2)

    src/modules/query-retrieval/service/search.service.ts: held at the layer calls at lines 128-148, which
    are the file''s only matching paths — fragmentHits = await searchFragmentLayer(client, input.query,
    PER_LAYER_FETCH_LIMIT); nodeHits = await searchNodeAliasLayer(...); chunkHits = await searchChunkLayer(...);
    parseTsQuery(client, input.query). No embedding or similarity call appears.'
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: constraints/retrieval-is-read-only
  conforms: true
  how: 'src/modules/query-retrieval/mcp/query-toolset.ts: held at makeHandler, line 192 — const result
    = await withReadOnly(pool, (client) => run(parsed, client));

    src/modules/query-retrieval/routes/query-retrieval.routes.ts: held at each of the five handlers, which
    run their service call inside withReadOnly (lines 62, 95, 117, 141, 169) — return await withReadOnly(deps.pool,
    async (client) => {'
  encoded_at:
  - src/modules/query-retrieval/mcp/query-toolset.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
- node: constraints/retrieval-transports-answer-alike
  conforms: true
  how: 'src/modules/query-retrieval/mcp/query-toolset.ts: held at makeHandler lines 189-199 and the four
    service calls. The MCP half calls the same services and maps every throw through the shared mapper.
    — return { ok: true, result }; } catch (err) { return mapErrorToEnvelope(err); }

    src/modules/query-retrieval/routes/query-retrieval.routes.ts: held at handleSearchError and handleProvenanceError,
    which delegate to the mapper shared with the MCP transport — const { statusCode, envelope } = mapErrorToHttpResponse(err);
    (mapErrorToHttpResponse is imported from "../../knowledge-graph/mcp/error-envelope.js")'
  encoded_at:
  - src/modules/query-retrieval/mcp/query-toolset.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
- node: contracts/knowledge-base/retrieval
  conforms: false
  how: "src/modules/query-retrieval/dto/search.dto.ts, IsoDateOnly, lines 16-18, used by SearchQuerySchema.as_of\
    \ at line 61: const IsoDateOnly = z\n  .string()\n  .regex(/^\\d{4}-\\d{2}-\\d{2}$/, \"must be YYYY-MM-DD\"\
    ); — The contract refuses an as-of that \"is not a calendar date written as year-month-day\". This\
    \ declaration only checks the digit shape, so a value such as 2026-13-45 passes the DTO. If no later\
    \ layer refuses it, the calendar-date rule is not held anywhere in this file. The next reader who\
    \ looks here for the as_of format rule finds a weaker one than the contract states.\nsrc/modules/query-retrieval/service/errors.ts,\
    \ header comment, lines 1-5: // Typed sentinel errors emitted by the query-retrieval services. The\
    \ route // layer maps each one to its HTTP status + `error.code` envelope. [...] // All error codes\
    \ registered in `docs/specs/_global/error-codes.md`. — The comment names a document outside the specification\
    \ as the registry of these error codes. The retrieval contract node holds those codes and statuses.\
    \ A reader who follows the comment goes to a registry that is not the authority, and the two can move\
    \ apart without anything noticing."
  observed_at:
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/service/errors.ts
- node: domain/knowledge-base/accepted-fragment-filter
  conforms: true
  how: "src/modules/query-retrieval/dto/fragment.dto.ts: held at ListAcceptedFragmentsQuerySchema fields\
    \ llm_run_id, raw_information_id, limit and offset — llm_run_id: z.string().uuid().optional(), raw_information_id:\
    \ z.string().uuid().optional(),\nsrc/modules/query-retrieval/repository/accepted-fragments.repository.ts:\
    \ held at The nullable `llmRunId` and `rawInformationId` parameters, the `limit` and `offset` parameters,\
    \ and the `FILTER_WHERE` constant. — ($1::uuid IS NULL OR f.llm_run_id = $1::uuid)\n   AND ($2::uuid\
    \ IS NULL OR r.id = $2::uuid)\nsrc/modules/query-retrieval/routes/query-retrieval.routes.ts: held\
    \ at the filter object built in the /fragments/accepted handler — { llm_run_id: query.llm_run_id,\
    \ raw_information_id: query.raw_information_id, limit: query.limit, offset: query.offset }\nsrc/modules/query-retrieval/service/accepted-fragments.service.ts:\
    \ held at ListAcceptedFragmentsInput, lines 29-34, and the filter passing at lines 41-44 — readonly\
    \ llm_run_id?: string;\n  readonly raw_information_id?: string;\n  readonly limit: number;\n  readonly\
    \ offset: number;"
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: domain/knowledge-base/assertion-flag
  conforms: false
  how: 'src/modules/query-retrieval/service/search.service.ts, line 499, computeFlags: flags.push("low_confidence");
    — The assertion-flag node declares the value `low-confidence`. The code emits `low_confidence`, and
    the assertion-flag node records no other spelling. The source-type node does record the material''s
    own words for its values, so here the wire spelling exists only in code.'
  observed_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "src/modules/query-retrieval/repository/accepted-fragments.repository.ts: held at the `NOT EXISTS`\
    \ subselect in `FILTER_WHERE` — AND NOT EXISTS (\n         SELECT 1 FROM compliance_deletion cd\n\
    \          WHERE cd.raw_information_id = r.id\n       )\nsrc/modules/query-retrieval/repository/provenance.repository.ts:\
    \ held at findTombstone — SELECT raw_information_id, executed_at AS performed_at FROM compliance_deletion\
    \ WHERE raw_information_id = ANY($1::uuid[]) ORDER BY executed_at ASC LIMIT 1\nsrc/modules/query-retrieval/service/provenance.service.ts:\
    \ held at finalise, step (a), the tombstone lookup and the throw — const tombstone = await findTombstone(client,\
    \ rawIds); ... throw new RawInformationDeletedError(tombstone.raw_information_id, tombstone.performed_at);"
  encoded_at:
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/fragment-status
  conforms: false
  how: 'src/modules/query-retrieval/dto/response.dto.ts, ProvenanceFragment.status, line 102: readonly
    status: "accepted" | "proposed" | "rejected" | "deleted"; — The fragment-status node holds five values
    and the decision log decided "The five values stand, superseded included." The DTO''s union leaves
    out superseded. A provenance read that lists a superseded fragment has no legal value for its status,
    and clients narrow on four states while the business defined five.

    src/modules/query-retrieval/repository/provenance.repository.ts, FragmentStatusRow.status (line 42)
    and ProvenanceChainRow.fragment_status (line 65): readonly status: "accepted" | "proposed" | "rejected"
    | "deleted"; — The file declares its own fragment-status vocabulary with four values. The node has
    five, and `superseded` is missing. The database enum also has `superseded`, so a superseded fragment
    would come back through a type that says it cannot exist. The next reader takes this union as the
    list of fragment states and never looks for the fifth in the specification.'
  observed_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
- node: domain/knowledge-base/information-fragment
  conforms: true
  how: "src/modules/query-retrieval/dto/fragment.dto.ts: held at AcceptedFragmentItem fields text, confidence,\
    \ created_at and llm_run_id — readonly text: string; readonly confidence: number; readonly llm_run_id:\
    \ string; readonly created_at: string; // ISO-8601\nsrc/modules/query-retrieval/dto/response.dto.ts:\
    \ held at ProvenanceFragment (lines 98-104) and SearchProvenanceEntry (lines 43-51). They carry text,\
    \ confidence and status. They do not carry created_at or llm_run. — export interface ProvenanceFragment\
    \ { readonly id: string; readonly text: string; readonly confidence: number;\nsrc/modules/query-retrieval/repository/accepted-fragments.repository.ts:\
    \ held at the `deduped` CTE select list and the `AcceptedFragmentRow` interface — f.id AS fragment_id,\
    \ f.text AS fragment_text, f.confidence AS fragment_confidence, f.llm_run_id AS fragment_llm_run_id,\
    \ f.created_at AS fragment_created_at; sourced through `JOIN fragment_source fs ON fs.fragment_id\
    \ = f.id JOIN raw_chunk rc ON rc.id = fs.raw_chunk_id`\nsrc/modules/query-retrieval/repository/provenance.repository.ts:\
    \ held at the fragment columns selected by both chain queries in runChainSql — f.id AS fragment_id,\
    \ f.text AS fragment_text, f.confidence AS fragment_confidence, f.status::text AS fragment_status\n\
    src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the row-to-item mapping,\
    \ lines 60-65 — text: row.fragment_text,\n    confidence: Number(row.fragment_confidence),\n    llm_run_id:\
    \ row.fragment_llm_run_id,\n    created_at: row.fragment_created_at.toISOString(),\nsrc/modules/query-retrieval/service/provenance.service.ts:\
    \ held at groupChain, fragment mapping — fragments.push({ id: fragment.fragment_id, text: fragment.fragment_text,\
    \ confidence: Number(fragment.fragment_confidence), status: fragment.fragment_status, chunks: provChunks\
    \ });\nsrc/modules/query-retrieval/service/search.service.ts: held at the fragment item construction,\
    \ lines 199-225 — const confidence = Number(f.confidence); ... recordedAtTs: f.created_at.getTime(),\
    \ summary: f.text, ... confidence, The aggregate itself is defined in the repository row type. This\
    \ file only consumes text, confidence and created_at."
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/item-kind
  conforms: true
  how: 'src/modules/query-retrieval/dto/response.dto.ts: held at SearchKind type, line 10 — export type
    SearchKind = "node" | "link" | "fragment";

    src/modules/query-retrieval/service/search.service.ts: held at the `kind` field of IntermediateItem,
    line 75 — readonly kind: "node" | "link" | "fragment";'
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: 'src/modules/query-retrieval/repository/provenance.repository.ts: held at linkExists, and the `p.link_id`
    anchor of chainByLink — SELECT EXISTS(SELECT 1 FROM knowledge_link WHERE id = $1) AS exists

    src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByLinkService — const
    exists = await linkExists(client, linkId); if (!exists) throw new ResourceNotFoundError("KnowledgeLink",
    linkId); const rows = await chainByLink(client, linkId);'
  encoded_at:
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: 'src/modules/query-retrieval/repository/provenance.repository.ts: held at attributeExists, and
    the `p.attribute_id` anchor of chainByAttribute — SELECT EXISTS(SELECT 1 FROM node_attribute WHERE
    id = $1) AS exists

    src/modules/query-retrieval/service/provenance.service.ts: held at getProvenanceByAttributeService
    — const exists = await attributeExists(client, attributeId); if (!exists) throw new ResourceNotFoundError("NodeAttribute",
    attributeId); const rows = await chainByAttribute(client, attributeId);'
  encoded_at:
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: 'src/modules/query-retrieval/repository/search.repository.ts: held at NodeAliasHitRow.status and
    the node-layer WHERE clause, which carry the statuses active, needs_review, merged and deleted — readonly
    status: "active" | "needs_review";'
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
- node: domain/knowledge-base/page
  conforms: true
  how: "src/modules/query-retrieval/dto/fragment.dto.ts: held at limit and offset in ListAcceptedFragmentsQuerySchema,\
    \ echoed in AcceptedFragmentList — limit: IntegerQuery.pipe(z.number().int().min(1).max(100)).optional().default(20),\
    \ offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),\nsrc/modules/query-retrieval/dto/response.dto.ts:\
    \ held at SearchResponse.limit and SearchResponse.offset, lines 67-68 — readonly limit: number; readonly\
    \ offset: number;\nsrc/modules/query-retrieval/dto/search.dto.ts: held at the limit and offset fields\
    \ of SearchQuerySchema — limit: IntegerQuery.pipe(z.number().int().min(1).max(100)).optional().default(20),\n\
    offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),\nsrc/modules/query-retrieval/mcp/query-toolset.ts:\
    \ held at the limit and offset passthrough in the search handler, lines 238-239 — limit: input.limit,\
    \ offset: input.offset,\nsrc/modules/query-retrieval/repository/accepted-fragments.repository.ts:\
    \ held at the `limit` and `offset` parameters of `selectAcceptedFragments`, bound as `$3` and `$4`\
    \ — LIMIT $3\n    OFFSET $4\nsrc/modules/query-retrieval/service/accepted-fragments.service.ts: held\
    \ at the limit and offset fields of the input (lines 32-33) and the returned page window (lines 93-94)\
    \ — readonly limit: number;\n  readonly offset: number;\n...\n  limit: input.limit,\n  offset: input.offset,\n\
    src/modules/query-retrieval/service/search.service.ts: held at SearchServiceInput.limit/offset (lines\
    \ 69-70) and the slice at line 392 — const sliced = filtered.slice(input.offset, input.offset + input.limit);"
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/mcp/query-toolset.ts
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/provenance
  conforms: true
  how: 'src/modules/query-retrieval/dto/response.dto.ts: held at ProvenanceResponse.fragments, line 107.
    The fragment is carried; recorded_at is not. — export interface ProvenanceResponse { readonly fragments:
    readonly ProvenanceFragment[]; }

    src/modules/query-retrieval/repository/provenance.repository.ts: held at the `FROM provenance p JOIN
    information_fragment f ON f.id = p.fragment_id` chain in runChainSql — FROM provenance p JOIN information_fragment
    f ON f.id = p.fragment_id JOIN fragment_source fs ON fs.fragment_id = f.id ... WHERE ${anchorCol}
    = $1

    src/modules/query-retrieval/service/provenance.service.ts: held at finalise and groupChain, which
    assemble the chain of fragments and chunks — const fragments = groupChain(rows); ... return { fragments
    };

    src/modules/query-retrieval/service/search.service.ts: held at toProvenanceEntry, lines 474-484 —
    return { fragment_id: row.fragment_id, fragment_text: row.fragment_text, confidence: Number(row.fragment_confidence),
    raw_information_id: row.raw_information_id, source_type: toSourceType(row.source_type), received_at:
    row.received_at.toISOString(), excerpt: row.excerpt };'
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/provenance.service.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/raw-chunk
  conforms: false
  how: 'src/modules/query-retrieval/dto/response.dto.ts, ProvenanceChunk.locator, line 94: readonly locator:
    Record<string, unknown> | null; — The specification decided the locator to be a string, because the
    material gave it no shape and the retrieval only passes it through. The DTO states a structured object
    that can be null. A reader who takes the shape from the node will expect a string. A client written
    to this type will expect an object.'
  observed_at:
  - src/modules/query-retrieval/dto/response.dto.ts
- node: domain/knowledge-base/raw-information
  conforms: false
  how: 'src/modules/query-retrieval/dto/response.dto.ts, ProvenanceRawInformation.metadata, line 80: readonly
    metadata: Record<string, unknown>; — The specification decided the metadata to be a string, because
    the material gave it no shape and the retrieval only passes it through. The DTO states a structured
    JSON object. A reader who takes the shape from the node will expect a string. A client written to
    this type will expect an object.'
  observed_at:
  - src/modules/query-retrieval/dto/response.dto.ts
- node: domain/knowledge-base/search-item
  conforms: true
  how: 'src/modules/query-retrieval/dto/response.dto.ts: held at SearchItem interface, lines 53-62 — readonly
    kind: SearchKind; readonly layer: SearchLayer; readonly id: string; readonly score: number; readonly
    hop: number; readonly summary: string; readonly flags: readonly AssertionFlag[]; readonly provenance:
    readonly SearchProvenanceEntry[];

    src/modules/query-retrieval/service/search.service.ts: held at toSearchItem, lines 504-515 — return
    { kind: it.kind, layer: it.layer, id: it.id, score: it.score, hop: it.hop, summary: it.summary, flags:
    it.flags, provenance: it.provenance };'
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/search-layer
  conforms: true
  how: 'src/modules/query-retrieval/dto/response.dto.ts: held at SearchLayer type, line 11 — export type
    SearchLayer = "fragment" | "node" | "chunk";

    src/modules/query-retrieval/dto/search.dto.ts: held at ALLOWED_LAYERS, line 101 — export const ALLOWED_LAYERS
    = ["fragment", "node", "chunk"] as const;

    export type SearchLayer = (typeof ALLOWED_LAYERS)[number];

    src/modules/query-retrieval/service/errors.ts: held at allowed property of InvalidSearchLayerError,
    line 36 — public readonly allowed = ["fragment", "node", "chunk"] as const;

    src/modules/query-retrieval/service/search.service.ts: held at resolveLayers, lines 428-442, over
    ALLOWED_LAYERS and SearchLayer, which are imported from ../dto/search.dto.js — if (!(ALLOWED_LAYERS
    as readonly string[]).includes(layer)) { throw new InvalidSearchLayerError(layer); } The enumeration
    is declared outside this file.'
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/search-query
  conforms: true
  how: 'src/modules/query-retrieval/dto/search.dto.ts: held at SearchQuerySchema, lines 57-74. Wire names
    are query, expand_link_types, limit and offset, against the node''s text, link_types and page. — query:
    QueryString,

    layers: LayersArray.optional(),

    as_of: IsoDateOnly.optional(),

    in_effect_only: BooleanQuery.optional().default(false),

    include_uncertain: BooleanQuery.optional().default(true),

    expand: BooleanQuery.optional().default(true),

    expand_depth: ..., expand_link_types: ExpandLinkTypesArray.optional(),

    src/modules/query-retrieval/mcp/query-toolset.ts: held at the search handler''s input-to-service mapping,
    lines 226-241, which carries every choice: text, layers, expansion, link types, as-of, in-effect-only,
    uncertain inclusion and page — query: input.query, layers: input.layers, asOf: input.as_of, inEffectOnly:
    input.in_effect_only, includeUncertain: input.include_uncertain, expand: input.expand, expandDepth:
    input.expand_depth, expandLinkTypes: input.expand_link_types

    src/modules/query-retrieval/routes/query-retrieval.routes.ts: held at the search input object built
    in the /search handler — { query: query.query, layers: query.layers, asOf: query.as_of, inEffectOnly:
    query.in_effect_only, includeUncertain: query.include_uncertain, expand: query.expand, expandDepth:
    query.expand_depth, expandLinkTypes: query.expand_link_types, limit: query.limit, offset: query.offset
    }

    src/modules/query-retrieval/service/search.service.ts: held at SearchServiceInput, lines 60-71 — readonly
    query: string; readonly layers?: readonly string[]; readonly asOf?: string; readonly inEffectOnly:
    boolean; readonly includeUncertain: boolean; readonly expand: boolean; readonly expandDepth: number;
    readonly expandLinkTypes?: readonly string[]; readonly limit: number; readonly offset: number;'
  encoded_at:
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/mcp/query-toolset.ts
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: domain/knowledge-base/source-type
  conforms: true
  how: 'src/modules/query-retrieval/dto/response.dto.ts: held at SourceType type (lines 13-20), SOURCE_TYPES
    (lines 22-30) and toSourceType (lines 38-41), using the material''s own words — | "pdf" | "email"
    | "ata" | "chat" | "artigo" | "transcricao" | "outro";

    src/modules/query-retrieval/repository/accepted-fragments.repository.ts: held at the `r.source_type::text
    AS source_type` column in `deduped` — r.source_type::text AS source_type

    src/modules/query-retrieval/repository/provenance.repository.ts: held at the source_type column in
    the chain queries, passed through as text and not enumerated — ri.source_type::text AS source_type

    src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the source_type mapping,
    line 69 — source_type: toSourceType(row.source_type),

    src/modules/query-retrieval/service/provenance.service.ts: held at groupChain, through the toSourceType
    call — source_type: toSourceType(c.source_type),'
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/alias-matching
  conforms: true
  how: 'src/modules/query-retrieval/repository/fts-config.ts: held at the `FTS_NAME_CONFIG` constant,
    line 21. It names the configuration applied to alias matching, and the configuration''s definition
    (stemming, accent handling) is in the migration, outside this file. — export const FTS_NAME_CONFIG
    = "simple_unaccent_v1" as const;

    src/modules/query-retrieval/repository/search.repository.ts: held at searchNodeAliasLayer, which binds
    the name configuration to both sides of the match — WHERE to_tsvector($1::regconfig, na.alias) @@
    websearch_to_tsquery($1::regconfig, $2)

    ...

    FTS_NAME_CONFIG,'
  encoded_at:
  - src/modules/query-retrieval/repository/fts-config.ts
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/chunk-layer-matches-current-chunks
  conforms: true
  how: 'src/modules/query-retrieval/repository/search.repository.ts: held at searchChunkLayer WHERE clause
    — AND rc.superseded_at IS NULL'
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/chunk-match-cites-its-fragment
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at toProvenanceEntry''s `excerpt:
    row.excerpt` on a fragment item, lines 200-202 and 482 — const provenance = (provByFragment.get(f.id)
    ?? []).map(toProvenanceEntry); excerpt: row.excerpt. The chunk/fragment dedup result (dedupLinks)
    only feeds `dedupCollapsedCount`; the excerpt comes from the fragment''s own provenance rows.'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/chunk-match-never-surfaces
  conforms: false
  how: 'src/modules/query-retrieval/repository/scoring.ts, the doc comment above LAYER_WEIGHT_CHUNK, line
    15: /** Layer weight for raw `raw_chunk` hits (only surfaced when no fragment anchors them). */ export
    const LAYER_WEIGHT_CHUNK = 0.6 as const; — The comment says a chunk hit is surfaced when no fragment
    anchors it. The node says a chunk-layer match never surfaces as a search item. This is prose next
    to the constant, not code, but it gives the next reader a second, opposite account of what a chunk
    match does. The two disagree, and nothing tells the reader which was decided.'
  observed_at:
  - src/modules/query-retrieval/repository/scoring.ts
- node: rules/knowledge-base/chunk-offsets-count-code-points
  conforms: true
  how: "src/modules/query-retrieval/repository/provenance.repository.ts: held at the excerpt expression\
    \ in both chain queries in runChainSql — substring(rc.\"text\" FROM rc.offset_start + 1 FOR rc.offset_end\
    \ - rc.offset_start) AS excerpt\nsrc/modules/query-retrieval/repository/search.repository.ts: held\
    \ at the substring expressions in searchChunkLayer and in the three provenance lookups — substring(rc.\"\
    text\" FROM rc.offset_start + 1\n               FOR rc.offset_end - rc.offset_start) AS excerpt"
  encoded_at:
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/compliance-refusal-takes-precedence
  conforms: false
  how: 'src/modules/query-retrieval/service/provenance.service.ts, header comment, lines 3-8: // Precedence:

    //   1. anchor row missing             -> RESOURCE_NOT_FOUND (404)

    //   2. fragment anchor with status != ''accepted'' -> BUSINESS_FRAGMENT_NOT_ACCEPTED (404)

    //   3. chain reaches a tombstoned raw -> BUSINESS_RAW_INFORMATION_DELETED (410)

    //   4. chain assembled but empty      -> SYSTEM_INTERNAL_ERROR (500) + WARN log — The order in which
    refusals win, with their codes and HTTP statuses, is written out again as the file''s own authority.
    The node holds this order: a compliance deletion is refused ahead of every other refusal except a
    fragment that is not accepted. If the node moves, the file is the place a reader finds a second answer,
    and the code can no longer be told apart from the decision.'
  observed_at:
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/empty-provenance-chain-refused
  conforms: false
  how: 'src/modules/query-retrieval/service/errors.ts, comment above EmptyProvenanceError, line 77: /**
    BR-19 — empty provenance on an existing anchor (legacy-data inconsistency). */ — The comment restates
    the empty-chain refusal, citing a back-spec rule number. The node holds that rule, so this prose is
    a second home for it.

    src/modules/query-retrieval/service/provenance.service.ts, comment inside finalise, step (b), lines
    108-111: // (b) Empty-chain alarm — BR-19. The anchor exists (step 1 already

    //     established that); zero chain rows means we have a legacy data

    //     inconsistency. The OpenAPI contract requires `fragments[] minItems: 1`,

    //     so we surface a 500 with a structured WARN — never an empty array. — The refusal of an empty
    provenance chain is justified by a back-spec rule number and an OpenAPI constraint, not by the node
    that holds it. The comment also gives a reason, "a legacy data inconsistency", that no node states.
    A reader who looks for why the read is refused finds the code''s own account rather than the specification''s.'
  observed_at:
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/provenance.service.ts
- node: rules/knowledge-base/expanded-link-requires-provenance
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the link loop, lines 327-342 —
    if (provenance.length === 0) { logger.warn({ ... }, "query_retrieval_search_empty_link_provenance");
    continue; }'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-as-of-view
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the as-of date is passed to the
    traversal (line 287); the reach filter itself lives in traverseNodes — asOf: input.asOf,'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-decay
  conforms: false
  how: 'src/modules/query-retrieval/service/search.service.ts, lines 296-298 and 318-322, the scoring
    of an expanded link: for (const it of items) { if (it.kind === "node") nodeScoreById.set(it.id, it.score);
    } ... const sourceScore = nodeScoreById.get(link.source_node_id) ?? nodeScoreById.get(link.target_node_id)
    ?? 0; const score = Math.pow(TRAVERSAL_DECAY, hop) * sourceScore; — The node scores a link at hop
    h as 0.5^h times the score of the matched node it was reached from. The map holds only matched nodes,
    and the code looks up the link''s own two endpoints. A link at hop 2 or 3 whose endpoints are both
    unmatched gets `?? 0`, so its score is 0 and it ranks last, where the node gives it a decayed score.
    The comment on lines 316-317 says "fall back to the highest source score", but the code falls back
    to 0. The 0 is a value no node holds, and depth above 1 is where it shows.'
  observed_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-depth-bounds
  conforms: false
  how: 'src/modules/query-retrieval/mcp/query-toolset.ts, QueryRetrievalToolDescriptions.search, line
    134: `expand`, `expand_depth` (1..3), — The depth bound is restated as a string served over tools/list,
    in a file the rule is not bound to. If the node''s bound moves, `--check` never reaches this text
    and nobody can tell which of the two was decided.'
  observed_at:
  - src/modules/query-retrieval/mcp/query-toolset.ts
- node: rules/knowledge-base/expansion-follows-both-directions
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the traverseNodes call, line 284
    — direction: "both",'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-in-effect-only
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the flag is passed to the traversal
    (line 288); the filtering itself lives in traverseNodes — inEffectOnly: input.inEffectOnly,'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the linkTypeIds argument of traverseNodes,
    line 285, resolved by resolveLinkTypeIds at lines 106-108 — linkTypeIds, ... const row = catalog.linkTypeByName.get(name);
    ids.push(row.id);'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/expansion-starts-from-matched-nodes
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at startingIds and the traverseNodes
    call, lines 271-291 — if (input.expand && nodeHits.length > 0) { const startingIds = nodeHits.filter((n)
    => items.some((it) => it.kind === "node" && it.id === n.node_id)).map((n) => n.node_id); ... startingNodeIds:
    startingIds,'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/fragment-item-summary
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at line 219 — summary: f.text,'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/fragment-layer-matches-accepted-only
  conforms: true
  how: "src/modules/query-retrieval/repository/search.repository.ts: held at searchFragmentLayer WHERE\
    \ clause — WHERE f.status = 'accepted'\n       AND f.text_search @@ websearch_to_tsquery($1::regconfig,\
    \ $2)"
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/item-flags
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at computeFlags and LOW_CONFIDENCE_THRESHOLD,
    lines 58 and 486-502 — const LOW_CONFIDENCE_THRESHOLD = 0.4; if (args.kind === "fragment" && args.status
    === "accepted" && args.confidence < LOW_CONFIDENCE_THRESHOLD) { flags.push("low_confidence"); }'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/layer-weights
  conforms: true
  how: 'src/modules/query-retrieval/repository/scoring.ts: held at The three exported constants LAYER_WEIGHT_FRAGMENT,
    LAYER_WEIGHT_NODE and LAYER_WEIGHT_CHUNK, lines 10, 13 and 16. — export const LAYER_WEIGHT_FRAGMENT
    = 1.0 as const; export const LAYER_WEIGHT_NODE = 0.9 as const; export const LAYER_WEIGHT_CHUNK = 0.6
    as const;

    src/modules/query-retrieval/repository/search.repository.ts: held at the weight multiplications in
    the three layer queries, with weights bound as parameters from the imported LAYER_WEIGHT_* constants
    — * $3::float)::float AS score

    ...

    LAYER_WEIGHT_FRAGMENT,

    LAYER_WEIGHT_NODE,

    LAYER_WEIGHT_CHUNK,'
  encoded_at:
  - src/modules/query-retrieval/repository/scoring.ts
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/link-item-summary
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at line 344 — const summary = `${meta.source_canonical_name}
    -[${meta.link_type}]-> ${meta.target_canonical_name}`;'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/link-types-ignored-without-expansion
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at lines 106-108 — const linkTypeIds
    = input.expand ? resolveLinkTypeIds(catalog, input.expandLinkTypes) : undefined;'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/listing-excludes-compliance-deleted
  conforms: false
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts, header comment, lines 12-13
    (tombstone short-circuit): // short-circuit is in the repository SQL (`NOT EXISTS compliance_deletion`),

    // per back-spec BR-14: tombstoned RawInformation rows are silently omitted. — The comment restates
    the compliance-exclusion rule and cites a back-spec rule as its authority. Nothing in this file holds
    the exclusion. A reader of the service finds the claim here, not the node listing-excludes-compliance-deleted,
    so it becomes a second home for a decided rule.'
  observed_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: rules/knowledge-base/listing-holds-accepted-only
  conforms: true
  how: 'src/modules/query-retrieval/repository/accepted-fragments.repository.ts: held at the `f.status
    = ''accepted''` predicate in `FILTER_WHERE`, shared by the count and select queries — f.status = ''accepted'''
  encoded_at:
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
- node: rules/knowledge-base/listing-one-entry-per-fragment
  conforms: true
  how: 'src/modules/query-retrieval/repository/accepted-fragments.repository.ts: held at the `DISTINCT
    ON (f.id)` in `deduped` with its `ORDER BY`, and `COUNT(DISTINCT f.id)` in the count query — SELECT
    DISTINCT ON (f.id) ... ORDER BY f.id, rc.chunk_index ASC, rc.id ASC'
  encoded_at:
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
- node: rules/knowledge-base/listing-order
  conforms: false
  how: 'src/modules/query-retrieval/service/accepted-fragments.service.ts, header comment, lines 6-8 (step
    2 of the service description): //   2. Runs the page query (deduped per fragment_id, ordered by

    //      `r.received_at DESC NULLS LAST, f.created_at DESC, f.id ASC`). — The comment states the listing
    order, and adds a null-placement clause ("NULLS LAST") that the node does not hold. The ordering and
    the once-per-fragment dedup are not implemented in this file. The next reader takes the comment as
    the decided order and never opens listing-order or listing-one-entry-per-fragment. When either node
    moves, `--check` does not reach this prose.'
  observed_at:
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: rules/knowledge-base/listing-requires-a-filter
  conforms: true
  how: 'src/modules/query-retrieval/dto/fragment.dto.ts: held at the `.refine` on ListAcceptedFragmentsQuerySchema
    — (v) => v.llm_run_id !== undefined || v.raw_information_id !== undefined, { message: "at least one
    of llm_run_id / raw_information_id is required", params: { requires_one_of: ["llm_run_id", "raw_information_id"]
    } }'
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
- node: rules/knowledge-base/listing-total-before-pagination
  conforms: true
  how: "src/modules/query-retrieval/repository/accepted-fragments.repository.ts: held at the separate\
    \ `countAcceptedFragments` query, which has no LIMIT or OFFSET and shares `FILTER_WHERE` — SELECT\
    \ COUNT(DISTINCT f.id)::bigint AS total\n      FROM information_fragment f ...\n     WHERE ${FILTER_WHERE}\n\
    src/modules/query-retrieval/service/accepted-fragments.service.ts: held at the count call, line 44,\
    \ and the returned total, line 92 — const total = await countAcceptedFragments(client, llmRunId, rawInformationId);\n\
    ...\n  return {\n    total,"
  encoded_at:
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: rules/knowledge-base/node-item-summary
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at line 259 — summary: n.canonical_name,'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/node-layer-matches-through-aliases
  conforms: true
  how: "src/modules/query-retrieval/repository/search.repository.ts: held at searchNodeAliasLayer, the\
    \ join from node_alias to knowledge_node grouped by node — FROM node_alias na\n      JOIN knowledge_node\
    \ kn ON kn.id = na.node_id\n WHERE to_tsvector($1::regconfig, na.alias) @@ websearch_to_tsquery($1::regconfig,\
    \ $2)"
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/node-layer-skips-merged-and-deleted
  conforms: true
  how: 'src/modules/query-retrieval/repository/search.repository.ts: held at searchNodeAliasLayer WHERE
    clause — AND kn.status NOT IN (''merged'', ''deleted'')'
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  conforms: true
  how: "src/modules/query-retrieval/repository/search.repository.ts: held at listProvenanceForNodes, the\
    \ inner join to accepted fragments that mention an alias — JOIN information_fragment f ON f.status\
    \ = 'accepted'\n                            AND f.text_search @@ plainto_tsquery($1::regconfig, na.alias_norm)\n\
    src/modules/query-retrieval/service/search.service.ts: held at line 244, over the rows of listProvenanceForNodes\
    \ — if (provenance.length === 0) continue;"
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/page-defaults
  conforms: true
  how: 'src/modules/query-retrieval/dto/fragment.dto.ts: held at limit and offset defaults in ListAcceptedFragmentsQuerySchema
    — .optional().default(20) .optional().default(0)

    src/modules/query-retrieval/dto/search.dto.ts: held at limit and offset fields of SearchQuerySchema,
    lines 69-72 — .optional()

    .default(20),

    offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),'
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
  - src/modules/query-retrieval/dto/search.dto.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: false
  how: 'src/modules/query-retrieval/mcp/query-toolset.ts, QueryRetrievalToolDescriptions.search, line
    135: Pagination via `limit` (max 100) and `offset`. — The page limit ceiling is restated in a tool
    description, so it now has a second home in a file the node is not bound to. A change to the ceiling
    leaves this text stale with nothing to flag it.'
  observed_at:
  - src/modules/query-retrieval/mcp/query-toolset.ts
- node: rules/knowledge-base/page-offset-non-negative
  conforms: true
  how: 'src/modules/query-retrieval/dto/fragment.dto.ts: held at offset field of ListAcceptedFragmentsQuerySchema
    — offset: IntegerQuery.pipe(z.number().int().min(0))

    src/modules/query-retrieval/dto/search.dto.ts: held at offset field of SearchQuerySchema, line 72
    — offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),'
  encoded_at:
  - src/modules/query-retrieval/dto/fragment.dto.ts
  - src/modules/query-retrieval/dto/search.dto.ts
- node: rules/knowledge-base/prose-matching
  conforms: true
  how: 'src/modules/query-retrieval/repository/fts-config.ts: held at the `FTS_PROSE_CONFIG` constant,
    line 18. It names the configuration applied to prose matching, and the configuration''s definition
    (Portuguese stemming, accent handling) is in the migration, outside this file. — export const FTS_PROSE_CONFIG
    = "pt_unaccent_v1" as const;

    src/modules/query-retrieval/repository/search.repository.ts: held at the fragment layer, the chunk
    layer and the node-mention join in listProvenanceForNodes, each bound to the prose configuration —
    FTS_PROSE_CONFIG,

    query,

    LAYER_WEIGHT_FRAGMENT,'
  encoded_at:
  - src/modules/query-retrieval/repository/fts-config.ts
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/provenance-in-recording-order
  conforms: true
  how: 'src/modules/query-retrieval/repository/provenance.repository.ts: held at the ORDER BY of the provenance-anchored
    chain query in runChainSql — ORDER BY p.created_at ASC, f.id, rc.chunk_index ASC, rc.id ASC

    src/modules/query-retrieval/repository/search.repository.ts: held at listProvenanceForLinks ORDER
    BY — ORDER BY p.link_id, p.created_at ASC, f.id ASC'
  encoded_at:
  - src/modules/query-retrieval/repository/provenance.repository.ts
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/provenance-refused-after-compliance-deletion
  conforms: false
  how: 'src/modules/query-retrieval/mcp/query-toolset.ts, get_provenance_link, get_provenance_attribute
    and get_provenance_fragment descriptions, lines 138-147: 404 if missing; 410 if any underlying raw
    is tombstoned by a compliance delete. — The compliance-deletion refusal, with its status number, is
    restated as tool documentation in a file the rule is not bound to. The wording ("tombstoned") also
    differs from the node''s, so the two can drift without either being wrong on its face.

    src/modules/query-retrieval/service/errors.ts, comment above RawInformationDeletedError, line 60:
    /** BR-17 — any underlying `raw_information` is tombstoned by `compliance_delete`. */ — The comment
    restates the refusal after a compliance deletion, citing a back-spec rule number. The node holds that
    rule, so this prose is a second home for it.'
  observed_at:
  - src/modules/query-retrieval/mcp/query-toolset.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/provenance-requires-accepted-fragment
  conforms: false
  how: 'src/modules/query-retrieval/mcp/query-toolset.ts, get_provenance_fragment description, lines 146-147:
    404 if missing or if the fragment is not in status=''accepted'' — The accepted-only condition for
    a fragment''s provenance is stated again in a description served to clients, in a file the rule is
    not bound to. A change to the rule leaves the served text saying the old one.

    src/modules/query-retrieval/service/errors.ts, comment above FragmentNotAcceptedError, line 45: /**
    BR-16 / partial-GIN — fragment exists but `status != ''accepted''`. */ — The comment restates the
    rule that a fragment''s provenance is read only when it is accepted, citing a back-spec rule number.
    It also mentions an index detail that no node holds.'
  observed_at:
  - src/modules/query-retrieval/mcp/query-toolset.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-excludes-compliance-deleted-sources
  conforms: false
  how: "src/modules/query-retrieval/repository/search.repository.ts, listProvenanceForLinks, the FROM/JOIN\
    \ and WHERE clauses (lines 306-311): FROM provenance p\n      JOIN information_fragment f ON f.id\
    \ = p.fragment_id\n      JOIN fragment_source fs     ON fs.fragment_id = f.id\n      JOIN raw_chunk\
    \ rc           ON rc.id = fs.raw_chunk_id\n      JOIN raw_information ri     ON ri.id = rc.raw_information_id\n\
    \ WHERE p.link_id = ANY($1::uuid[]) — The rule says search shows no fragment from a compliance-deleted\
    \ source, neither as an item nor as the support of one. This lookup takes every fragment attached\
    \ to a link and applies no filter on fragment status, chunk supersession or the raw information's\
    \ deletion. A link that keeps other provenance after a compliance deletion (propagation only deletes\
    \ links whose sole provenance is the deleted fragments) would still show the deleted source's fragment\
    \ text and excerpt as its support. Deleted content would come back through retrieval.\nno file of\
    \ the set holds this fact beside what was found against it"
  observed_at:
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/search-layer-outside-set-refused
  conforms: false
  how: 'src/modules/query-retrieval/service/errors.ts, comment above InvalidSearchLayerError, line 31:
    /** BR-04 — `layers[]` element outside `{fragment, node, chunk}`. */ — The comment restates the layer-outside-set
    refusal and re-lists the layer set, citing a back-spec rule number. The specification holds both the
    rule and the set, so this prose is a second home for them.'
  observed_at:
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-option-defaults
  conforms: true
  how: 'src/modules/query-retrieval/dto/search.dto.ts: held at the .default() calls on in_effect_only,
    include_uncertain, expand and expand_depth. The default of every search layer is not held here, because
    `layers` is `LayersArray.optional()` with no default. — in_effect_only: BooleanQuery.optional().default(false),

    include_uncertain: BooleanQuery.optional().default(true),

    expand: BooleanQuery.optional().default(true),

    expand_depth: IntegerQuery.pipe(z.number().int().min(1).max(3)).optional().default(1),

    src/modules/query-retrieval/service/search.service.ts: held at the layers default only, in resolveLayers,
    lines 431-433; the other defaults are not in this file — if (layers === undefined || layers.length
    === 0) { return new Set(ALLOWED_LAYERS); }'
  encoded_at:
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/search-query-length
  conforms: false
  how: 'src/modules/query-retrieval/service/errors.ts, message of InvalidSearchQueryError, line 23: :
    "query exceeds 1000 characters" — The number 1000 is the search-query-length node''s value, and it
    is written a second time as a literal in a string. If the node''s limit moves, this message still
    says 1000, and nothing ties the string to the node.'
  observed_at:
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-query-must-parse
  conforms: false
  how: 'src/modules/query-retrieval/service/errors.ts, comment above InvalidSearchQueryError, line 7:
    /** BR-05 — parsed tsquery is empty (Zod cap on length, but stopword-only also lands here). */ — The
    comment restates the refusal of a query that yields no search term, and cites a back-spec rule number
    as its authority. The specification holds that rule in the must-parse node, so this prose is a second
    home for it.'
  observed_at:
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-query-not-blank
  conforms: true
  how: "src/modules/query-retrieval/dto/search.dto.ts: held at QueryString, lines 48-55 — .transform((s)\
    \ => s.trim())\n.refine((s) => s.length > 0, {\n  message: \"query is empty after trim\",\n});\nsrc/modules/query-retrieval/service/errors.ts:\
    \ held at empty_after_trim reason of InvalidSearchQueryError, lines 11 and 21-22 — reason === \"empty_after_trim\"\
    \ ? \"query is empty after trim\""
  encoded_at:
  - src/modules/query-retrieval/dto/search.dto.ts
  - src/modules/query-retrieval/service/errors.ts
- node: rules/knowledge-base/search-ranking
  conforms: false
  how: "src/modules/query-retrieval/repository/search.repository.ts, searchNodeAliasLayer, the ORDER BY\
    \ and LIMIT clauses (lines 130-131): ORDER BY score DESC, kn.canonical_name ASC, kn.id ASC\n     LIMIT\
    \ $4 — Search-ranking orders items by score, then by recording time with a node counting as never\
    \ recorded, then by identifier. Here the pre-cut order for nodes puts canonical name ahead of identifier.\
    \ When more nodes tie than the limit admits, the alphabetical name decides which nodes reach the ranking\
    \ stage. That is a tie-break the specification does not hold, and it differs from the rule that governs\
    \ it."
  observed_at:
  - src/modules/query-retrieval/repository/search.repository.ts
- node: rules/knowledge-base/search-total-before-pagination
  conforms: true
  how: 'src/modules/query-retrieval/dto/response.dto.ts: held at SearchResponse.total, line 66. It carries
    the field only; the count is computed elsewhere. — readonly total: number;

    src/modules/query-retrieval/service/search.service.ts: held at lines 391-392, with the cap reported
    in the finding on line 56 — const total = filtered.length; const sliced = filtered.slice(input.offset,
    input.offset + input.limit);'
  encoded_at:
  - src/modules/query-retrieval/dto/response.dto.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/temporal-filters-apply-to-expansion-only
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at the layer calls at lines 129-147
    take no as-of or in-effect argument; only the traverseNodes call at lines 287-288 takes them — searchFragmentLayer(client,
    input.query, PER_LAYER_FETCH_LIMIT) versus traverseNodes(... asOf: input.asOf, inEffectOnly: input.inEffectOnly,
    ...)'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/uncertain-items-excluded-on-request
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at lines 352 and 377-379 — if (!input.includeUncertain
    && meta.status === "uncertain") continue; const filtered = input.includeUncertain ? items : items.filter((it)
    => it.status !== "uncertain");'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/unknown-link-type-refused
  conforms: true
  how: 'src/modules/query-retrieval/routes/query-retrieval.routes.ts: held at isMappableSearchError and
    handleSearchError, which answer the refusal. The refusal is raised in the search service or the catalog.
    — err instanceof UnknownLinkTypeError

    src/modules/query-retrieval/service/search.service.ts: held at resolveLinkTypeIds, lines 444-458 —
    const row = catalog.linkTypeByName.get(name); if (row === undefined) { throw new UnknownLinkTypeError(name);
    }'
  encoded_at:
  - src/modules/query-retrieval/routes/query-retrieval.routes.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: scenarios/knowledge-base/listing-for-unknown-source-is-empty
  conforms: true
  how: "src/modules/query-retrieval/repository/accepted-fragments.repository.ts: held at The behavior\
    \ of both queries when no fragment matches: the count coalesces to 0 and the select returns an empty\
    \ row list. — const raw = res.rows[0]?.total ?? 0;\nsrc/modules/query-retrieval/service/accepted-fragments.service.ts:\
    \ held at the total-zero short-circuit and the returned empty list, lines 46-58 and 91-96 — let rows:\
    \ readonly AcceptedFragmentRow[] = [];\n  if (total > 0) {\n...\n  return {\n    total,\n    limit:\
    \ input.limit,\n    offset: input.offset,\n    items,"
  encoded_at:
  - src/modules/query-retrieval/repository/accepted-fragments.repository.ts
  - src/modules/query-retrieval/service/accepted-fragments.service.ts
- node: scenarios/knowledge-base/stop-words-only-query
  conforms: true
  how: 'src/modules/query-retrieval/service/errors.ts: held at empty_after_parse reason of InvalidSearchQueryError,
    lines 11 and 19-20 — reason === "empty_after_parse" ? "query parsed by websearch_to_tsquery is empty"

    src/modules/query-retrieval/service/search.service.ts: held at lines 113-119 — if (parsed === "")
    { throw new InvalidSearchQueryError("empty_after_parse", { query: input.query, parsed: "", }); }'
  encoded_at:
  - src/modules/query-retrieval/service/errors.ts
  - src/modules/query-retrieval/service/search.service.ts
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  conforms: true
  how: 'src/modules/query-retrieval/repository/search.repository.ts: held at the lexical-only matching
    in the three layer queries, which would return no rows for a query sharing no characters — f.text_search
    @@ websearch_to_tsquery($1::regconfig, $2)

    src/modules/query-retrieval/service/search.service.ts: held at total = filtered.length at line 391,
    where the lexical-only layer calls yield no hit — const total = filtered.length; the items list is
    built only from fragmentHits and nodeHits returned by the lexical layer functions.'
  encoded_at:
  - src/modules/query-retrieval/repository/search.repository.ts
  - src/modules/query-retrieval/service/search.service.ts
unstated:
- file: src/modules/query-retrieval/dto/fragment.dto.ts
  where: ListAcceptedFragmentsQuerySchema, the `.strict()` call on the query object (line 38)
  evidence: .strict()
  cost: A request carrying any query parameter outside llm_run_id, raw_information_id, limit and offset
    is refused here. The contract's refusals for the listing name only a missing filter, a malformed identifier
    and out-of-range paging, so this refusal is decided in the DTO. The next reader looks for it in the
    specification and does not find it.
- file: src/modules/query-retrieval/dto/response.dto.ts
  where: comment above ProvenanceRawInformation.original_input, lines 81-84
  evidence: // `null` (or omitted) for non-chat sources and for rows that predate the // feature; `'[REDACTED]'`
    after compliance_delete (BR-18 of // compliance-audit).
  cost: The literal value a compliance-deleted source's original input takes is stated only in this prose.
    I searched the whole specification root, including the decision log, for REDACTED and found no node
    that holds it. It reads as a decision the business made, but the next reader will look for it in the
    specification and not find it.
- file: src/modules/query-retrieval/dto/response.dto.ts
  where: comment above ProvenanceRawInformation.original_input, lines 83-84
  evidence: NOT part of the content_hash; NOT searchable.
  cost: The comment states that the original input is excluded from the content hash. I searched the specification
    for content_hash and content hash and found no node that holds this. It is a rule of the idempotency
    identity that lives only in prose here.
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: QUERY_RETRIEVAL_TOOL_NAMES and the four registerTool calls, lines 118-123 and 219-284
  evidence: '"search", "get_provenance_link", "get_provenance_attribute", "get_provenance_fragment", ...
    mcp.registerTool<SearchInput, unknown>("query", {'
  cost: The retrieval contract names its operations search, read-link-provenance, read-attribute-provenance
    and read-fragment-provenance. The names an MCP client actually calls (get_provenance_link and the
    others) and the toolset key "query" live only in this file. The next reader who looks in the specification
    for what the owner's language model calls will not find them.
- file: src/modules/query-retrieval/mcp/query-toolset.ts
  where: search handler input mapping, lines 226-241, and the search description, lines 130-135
  evidence: 'query: input.query, layers: input.layers, asOf: input.as_of, inEffectOnly: input.in_effect_only,
    ... expandLinkTypes: input.expand_link_types'
  cost: The search-query node names its choices text and link_types, and the contract gives no wire names.
    The input names `query` and `expand_link_types`, and the id parameters `link_id`, `attribute_id` and
    `fragment_id`, are fixed only in code. A reader comparing the node with the tool sees two vocabularies
    and no node saying which one the client must send.
- file: src/modules/query-retrieval/repository/provenance.repository.ts
  where: the ORDER BY clauses of the two chain queries in runChainSql (lines 154 and 179)
  evidence: ORDER BY p.created_at ASC, f.id, rc.chunk_index ASC, rc.id ASC
  cost: The order of the chunks inside each fragment (chunk index ascending, then chunk id) and the fragment
    tie-break by fragment id decide what the owner reads first in a provenance answer. The specification
    holds only that fragments come in recording order. The chunk order lives only in this SQL, so the
    next reader looks for it in the specification and does not find it.
- file: src/modules/query-retrieval/repository/search.repository.ts
  where: listProvenanceForNodes, the ORDER BY clause (line 373)
  evidence: ORDER BY kn.id, f.created_at DESC, f.id ASC
  cost: The order in which the fragments that support a node hit are presented is decided here, newest
    first, and no node states it. Provenance-in-recording-order covers only links and attributes. A reader
    looking for how a node's supporting fragments are ordered finds no rule.
- file: src/modules/query-retrieval/repository/search.repository.ts
  where: searchNodeAliasLayer, the SELECT score expression (line 123)
  evidence: (max(ts_rank_cd(to_tsvector($1::regconfig, na.alias), websearch_to_tsquery($1::regconfig,
    $2))) * $3::float)::float AS score,
  cost: A knowledge node's score is decided as the highest rank among its matching aliases, and the specification
    does not say how a node reached through several aliases is scored. Code becomes the only home of that
    choice. The next reader who wants to know why a node ranks where it does looks in layer-weights or
    search-item and finds nothing.
- file: src/modules/query-retrieval/service/errors.ts
  where: message of EmptyProvenanceError, lines 85-87
  evidence: '`provenance chain is empty for ${anchorKind} ${anchorId} (legacy-data inconsistency).`'
  cost: The message tells the owner that an empty provenance chain means legacy data. The node only says
    that a read of an existing item with an empty chain is refused, and states no cause. The owner is
    given a diagnosis that lives only in this string.
- file: src/modules/query-retrieval/service/search.service.ts
  where: line 357, the `layer` of a link search item
  evidence: 'items.push({ key: `link:${link.id}`, kind: "link", layer: "node", id: link.id,'
  cost: The search-item node types `layer` as a search-layer (fragment, node, chunk) and no node says
    which layer a link item reports. The code decides it is "node". A consumer filtering or grouping by
    layer inherits that decision, and the next reader will look for it in the specification and find nothing.
- file: src/modules/query-retrieval/service/search.service.ts
  where: line 56, the constant PER_LAYER_FETCH_LIMIT, passed to searchFragmentLayer, searchNodeAliasLayer
    and searchChunkLayer at lines 129-147
  evidence: const PER_LAYER_FETCH_LIMIT = 200; and the comment "We pull a generous slice from each layer
    so the global ranking has enough candidates"
  cost: The number 200 is a cap on what a search can ever rank, and no node states it. Matches beyond
    the 200th on a layer are dropped before ranking. The reported `total` is `filtered.length` (line 391),
    so it counts only what survived the cap. A reader who trusts search-total-before-pagination ("counts
    every search item before the page is cut") would not look here for the reason a total stops at some
    number.
adopted: true
unheld:
- node: constraints/retrieval-requires-owner-authentication
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/assertion-status
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/knowledge-node
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/link-type
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: domain/knowledge-base/node-alias
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/compliance-deletion-propagates
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/expansion-current-view
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/expansion-reaches-merged-node-survivor
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/expansion-skips-deleted-nodes
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/expansion-skips-superseded-and-deleted-links
  how: 'read on 15 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 15 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-query-retrieval-r2.returns/.

  Staged as an adoption of source no delivery wrote: 84 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 0 opened across 0 of 15 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 11 fact(s) the source states that no node holds, over 7 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-query-retrieval-r2.returns/`, which are the evidence behind every entry above.
