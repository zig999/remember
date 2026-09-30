---
contract_version: siegard-reconcile/8
title: Adoption of the knowledge-graph context of the backend
summary: The owner adopts the knowledge-graph module as it stands; the source did not change and is taken
  as the running system's behavior, surveyed in siegard-survey/adopt-knowledge-graph and analysed into
  the knowledge-base specification.
target: backend
files:
- path: src/modules/knowledge-graph/catalog/catalog.ts
  change: Unchanged; loads the catalog snapshot the reads check filter names against.
- path: src/modules/knowledge-graph/dto/attribute.dto.ts
  change: Unchanged; declares the attribute detail a graph read answers.
- path: src/modules/knowledge-graph/dto/catalog.dto.ts
  change: Unchanged; declares the catalog listing answers.
- path: src/modules/knowledge-graph/dto/enums.dto.ts
  change: Unchanged; declares the closed vocabularies of the graph reads.
- path: src/modules/knowledge-graph/dto/history.dto.ts
  change: Unchanged; declares the history answers.
- path: src/modules/knowledge-graph/dto/link.dto.ts
  change: Unchanged; declares the link detail a graph read answers.
- path: src/modules/knowledge-graph/dto/node.dto.ts
  change: Unchanged; declares the node listing and node read answers.
- path: src/modules/knowledge-graph/dto/provenance.dto.ts
  change: Unchanged; declares the provenance entry a graph read answers.
- path: src/modules/knowledge-graph/dto/queries.dto.ts
  change: Unchanged; declares and validates the parameters of the catalog, node and graph reads.
- path: src/modules/knowledge-graph/dto/traversal.dto.ts
  change: Unchanged; declares the traversal answer.
- path: src/modules/knowledge-graph/index.ts
  change: Unchanged; exports the module surface, the traversal and its constants.
- path: src/modules/knowledge-graph/mcp/error-envelope.ts
  change: Unchanged; maps the read refusals to their answers.
- path: src/modules/knowledge-graph/mcp/query-toolset.ts
  change: Unchanged; offers the graph reads as MCP query tools.
- path: src/modules/knowledge-graph/mcp/query-transport.ts
  change: Unchanged; mounts the MCP query endpoint.
- path: src/modules/knowledge-graph/repository/catalog.repository.ts
  change: Unchanged; reads the stored catalog for the listings.
- path: src/modules/knowledge-graph/repository/graph.repository.ts
  change: Unchanged; reads nodes, aliases, attributes, links, provenance, traversal hops and histories.
- path: src/modules/knowledge-graph/repository/temporal-filter.ts
  change: Unchanged; builds the current, as-of and in-effect view filters.
- path: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  change: Unchanged; exposes the catalog, node and graph reads over REST.
- path: src/modules/knowledge-graph/service/attribute.service.ts
  change: Unchanged; serves the attribute point read.
- path: src/modules/knowledge-graph/service/catalog.service.ts
  change: Unchanged; serves the catalog listings.
- path: src/modules/knowledge-graph/service/errors.ts
  change: Unchanged; declares the read refusals.
- path: src/modules/knowledge-graph/service/formatters.ts
  change: Unchanged; shapes the answers of the graph reads.
- path: src/modules/knowledge-graph/service/history.service.ts
  change: Unchanged; serves the three histories.
- path: src/modules/knowledge-graph/service/link.service.ts
  change: Unchanged; serves the link point read.
- path: src/modules/knowledge-graph/service/node.service.ts
  change: Unchanged; serves the node listing and the node read.
- path: src/modules/knowledge-graph/service/norm.ts
  change: Unchanged; normalizes names for comparison.
- path: src/modules/knowledge-graph/service/traversal.service.ts
  change: Unchanged; serves the traversal and the search expansion.
- path: src/modules/knowledge-graph/traversal/config.ts
  change: Unchanged; fixes the traversal depth bounds, default depth and decay.
nodes:
- node: constraints/llm-toolset-omits-graph-point-reads
  conforms: true
  how: "src/modules/knowledge-graph/mcp/query-toolset.ts: held at `QUERY_TOOL_NAMES` and `QueryToolInputJsonSchemas`\
    \ (lines 136-171), and the nine `mcp.registerTool` calls in `registerQueryToolset`. They register\
    \ the node read, the traversal, the three histories, the node listing and the three catalog listings.\
    \ No tool reads one link or one attribute by identity. — export const QUERY_TOOL_NAMES: readonly QueryToolName[]\
    \ = [\n  \"get_node\",\n  \"traverse\",\n  \"get_history_link\",\n  \"get_history_attribute\",\n \
    \ \"get_history_attribute_key\",\n  \"list_nodes\",\n  \"list_node_types\",\n  \"list_link_types\"\
    ,\n  \"list_attribute_keys\",\n];"
  encoded_at:
  - src/modules/knowledge-graph/mcp/query-toolset.ts
- node: constraints/retrieval-is-read-only
  conforms: true
  how: 'src/modules/knowledge-graph/mcp/query-toolset.ts: held at `makeHandler`, lines 237-253. Every
    tool runs its service call inside `withReadOnly`. `withReadOnly` itself is declared in shared/pg-transaction.ts,
    outside this file. — const result = await withReadOnly(pool, (client) => run(parsed, client));

    src/modules/knowledge-graph/routes/knowledge-graph.routes.ts: held at Every handler body in registerKnowledgeGraphRoutes:
    each service call runs inside withReadOnly(deps.pool, ...). — `withReadOnly(deps.pool, async (client)
    => { const body = await listNodeTypesService(client); ... })`. The same wrapper opens the link-types,
    attribute-keys, nodes, node, link, attribute, traverse and the three history handlers.'
  encoded_at:
  - src/modules/knowledge-graph/mcp/query-toolset.ts
  - src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
- node: constraints/retrieval-transports-answer-alike
  conforms: true
  how: "src/modules/knowledge-graph/mcp/query-toolset.ts: held at `makeHandler`, lines 237-253. Success\
    \ is `{ ok: true, result }` from the same service functions the REST routes call. Every throw goes\
    \ through the shared `mapErrorToEnvelope`, declared in ./error-envelope.js outside this file. — return\
    \ { ok: true, result };\n    } catch (err) {\n      return mapErrorToEnvelope(err);\n    }\nsrc/modules/knowledge-graph/routes/knowledge-graph.routes.ts:\
    \ held at The REST side only. Service errors are rendered by the shared mapper `mapErrorToHttpResponse`,\
    \ imported from ../mcp/error-envelope.js and called in the catch paths and in handleReadError, handleTraversalError\
    \ and handleAttributeKeyHistoryError. This file does not show the MCP side. — `const { statusCode,\
    \ envelope } = mapErrorToHttpResponse(err, details); return reply.status(statusCode).send(envelope);`.\
    \ Successes are sent as `reply.status(200).send({ ok: true, result: body })`."
  encoded_at:
  - src/modules/knowledge-graph/mcp/query-toolset.ts
  - src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
- node: contracts/knowledge-base/retrieval
  conforms: false
  how: "src/modules/knowledge-graph/dto/queries.dto.ts, IsoDateOnly, lines 78-80, used as as_of in GetNodeByIdQuerySchema\
    \ (line 84) and TraverseQuerySchema (line 157): const IsoDateOnly = z\n  .string()\n  .regex(/^\\\
    d{4}-\\d{2}-\\d{2}$/, \"must be YYYY-MM-DD\"); — The contract refuses an as-of date that is \"not\
    \ a calendar date written as year-month-day\". This schema checks only the digit shape, so a value\
    \ such as 2024-02-30 or 2024-13-45 passes the request DTO. A grep of routes/knowledge-graph.routes.ts,\
    \ mcp/query-toolset.ts and service/ found no other calendar check. Those files pass `query.as_of`\
    \ and `input.as_of` straight to the service as `asOf`. The owner gets no VALIDATION_INVALID_FORMAT\
    \ for such a date. What happens to it depends on whatever consumes the string downstream, which no\
    \ node decided."
  observed_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
- node: domain/knowledge-base/alias-kind
  conforms: true
  how: 'src/modules/knowledge-graph/dto/enums.dto.ts: held at AliasKindSchema, line 66 — export const
    AliasKindSchema = z.enum(["canonical", "alias"]);

    src/modules/knowledge-graph/repository/graph.repository.ts: held at NodeAliasRow.kind, line 140 —
    readonly kind: "canonical" | "alias";'
  encoded_at:
  - src/modules/knowledge-graph/dto/enums.dto.ts
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: domain/knowledge-base/allowed-value
  conforms: true
  how: "src/modules/knowledge-graph/catalog/catalog.ts: held at interface AttributeValidValueRow, lines\
    \ 63-66, which declares only `attribute_key_id` and `value`. It is held in part, and the rest of the\
    \ shape is declared elsewhere. — export interface AttributeValidValueRow {\n  readonly attribute_key_id:\
    \ string;\n  readonly value: string;\n}"
  encoded_at:
  - src/modules/knowledge-graph/catalog/catalog.ts
- node: domain/knowledge-base/assertion-flag
  conforms: true
  how: "src/modules/knowledge-graph/dto/enums.dto.ts: held at AssertionFlagSchema, lines 45-49. The third\
    \ value is spelled `low_confidence`, where the node has `low-confidence`. — export const AssertionFlagSchema\
    \ = z.enum([\n  \"uncertain\",\n  \"disputed\",\n  \"low_confidence\",\n]);"
  encoded_at:
  - src/modules/knowledge-graph/dto/enums.dto.ts
- node: domain/knowledge-base/assertion-status
  conforms: true
  how: "src/modules/knowledge-graph/dto/enums.dto.ts: held at AssertionStatusSchema, lines 21-27 — export\
    \ const AssertionStatusSchema = z.enum([\n  \"active\",\n  \"uncertain\",\n  \"disputed\",\n  \"superseded\"\
    ,\n  \"deleted\",\n]);\nsrc/modules/knowledge-graph/repository/graph.repository.ts: held at the status\
    \ field of AttributeResolvedRow (line 172) and of LinkResolvedRow (line 250) — readonly status: \"\
    active\" | \"uncertain\" | \"disputed\" | \"superseded\" | \"deleted\";\nsrc/modules/knowledge-graph/service/formatters.ts:\
    \ held at the ASSERTION_STATUS set, lines 26-32, and toAssertionStatus, which throws InvariantError\
    \ outside the set — const ASSERTION_STATUS: ReadonlySet<AssertionStatus> = new Set([ \"active\", \"\
    uncertain\", \"disputed\", \"superseded\", \"deleted\", ]);"
  encoded_at:
  - src/modules/knowledge-graph/dto/enums.dto.ts
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/service/formatters.ts
- node: domain/knowledge-base/attribute-key
  conforms: true
  how: "src/modules/knowledge-graph/catalog/catalog.ts: held at interface AttributeKeyRow, lines 50-60.\
    \ — export interface AttributeKeyRow {\n  readonly id: string;\n  readonly node_type_id: string;\n\
    \  readonly key: string;\n  readonly value_type: \"date\" | \"number\" | \"text\" | \"bool\";\n  readonly\
    \ is_temporal: boolean;\n  readonly allows_multiple_current: boolean;\n  readonly requires_valid_from:\
    \ boolean;\n  readonly description: string;\n  readonly version: number;\n}\nsrc/modules/knowledge-graph/dto/catalog.dto.ts:\
    \ held at AttributeKeyResponseSchema (lines 70-87). It declares id, node_type, key, value_type, is_temporal,\
    \ allows_multiple_current, requires_valid_from, description, version and valid_values. — export const\
    \ AttributeKeyResponseSchema = z.object({\n  id: z.string().uuid(),\n  node_type: z.string(),\n  key:\
    \ z.string(),\n  value_type: AttributeValueTypeSchema,"
  encoded_at:
  - src/modules/knowledge-graph/catalog/catalog.ts
  - src/modules/knowledge-graph/dto/catalog.dto.ts
- node: domain/knowledge-base/effective-status
  conforms: true
  how: "src/modules/knowledge-graph/dto/enums.dto.ts: held at EffectiveStatusSchema, lines 34-41 — export\
    \ const EffectiveStatusSchema = z.enum([\n  \"active\",\n  \"uncertain\",\n  \"disputed\",\n  \"superseded\"\
    ,\n  \"deleted\",\n  \"inactive\",\n]);\nsrc/modules/knowledge-graph/service/formatters.ts: held at\
    \ the EFFECTIVE_STATUS set, lines 34-41, and toEffectiveStatus — const EFFECTIVE_STATUS: ReadonlySet<EffectiveStatus>\
    \ = new Set([ \"active\", \"uncertain\", \"disputed\", \"superseded\", \"deleted\", \"inactive\",\
    \ ]);"
  encoded_at:
  - src/modules/knowledge-graph/dto/enums.dto.ts
  - src/modules/knowledge-graph/service/formatters.ts
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: 'src/modules/knowledge-graph/dto/link.dto.ts: held at LinkDetailResponseSchema (lines 14-33). It
    declares the link''s attributes and relationships in part: status, recorded_at, valid_from, valid_to,
    provenance, confidence, superseded_at, the source and target nodes, the link type and the superseded
    link. The LLM-run relationship is not declared here. — status: AssertionStatusSchema, recorded_at:
    z.string().datetime({ offset: true }), valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    confidence: z.number().min(0).max(1), superseded_at: z.string().datetime({ offset: true }).nullable().optional(),
    supersedes_link_id: z.string().uuid().nullable().optional(), provenance: z.array(ProvenanceEntryResponseSchema)'
  encoded_at:
  - src/modules/knowledge-graph/dto/link.dto.ts
- node: domain/knowledge-base/link-type
  conforms: true
  how: "src/modules/knowledge-graph/catalog/catalog.ts: held at interface LinkTypeRow, lines 26-37. —\
    \ export interface LinkTypeRow {\n  readonly id: string;\n  readonly name: string;\n  readonly label:\
    \ string;\n  readonly description: string;\n  readonly inverse_name: string;\n  readonly is_temporal:\
    \ boolean;\n  readonly allows_multiple_current: boolean;\n  readonly requires_valid_from: boolean;\n\
    \  readonly requires_valid_to_on_change: boolean;\n  readonly version: number;\n}\nsrc/modules/knowledge-graph/dto/catalog.dto.ts:\
    \ held at LinkTypeResponseSchema (lines 45-57). It declares name, label, inverse_name, description,\
    \ is_temporal, allows_multiple_current, requires_valid_from, requires_valid_to_on_change, version\
    \ and rules. — export const LinkTypeResponseSchema = z.object({\n  id: z.string().uuid(),\n  name:\
    \ z.string(),\n  label: z.string(),\n  description: z.string(),\n  inverse_name: z.string(),"
  encoded_at:
  - src/modules/knowledge-graph/catalog/catalog.ts
  - src/modules/knowledge-graph/dto/catalog.dto.ts
- node: domain/knowledge-base/link-type-rule
  conforms: true
  how: "src/modules/knowledge-graph/catalog/catalog.ts: held at interface LinkTypeRuleRow, lines 40-47.\
    \ — export interface LinkTypeRuleRow {\n  readonly id: string;\n  readonly link_type_id: string;\n\
    \  readonly source_node_type_id: string;\n  readonly target_node_type_id: string;\n  readonly valid_from:\
    \ Date | null;\n  readonly valid_to: Date | null;\n}\nsrc/modules/knowledge-graph/dto/catalog.dto.ts:\
    \ held at LinkTypeRuleResponseSchema (lines 36-42). It declares the source and target node-type names\
    \ and valid_from and valid_to as nullable dates. — source_node_type: z.string(),\n  target_node_type:\
    \ z.string(),\n  valid_from: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).nullable(),\n  valid_to: z.string().regex(/^\\\
    d{4}-\\d{2}-\\d{2}$/).nullable(),"
  encoded_at:
  - src/modules/knowledge-graph/catalog/catalog.ts
  - src/modules/knowledge-graph/dto/catalog.dto.ts
- node: domain/knowledge-base/node-alias
  conforms: true
  how: 'src/modules/knowledge-graph/dto/node.dto.ts: held at NodeAliasResponseSchema, lines 9-14. It declares
    alias, kind and created_at. The identity field is the one the read-node contract adds to each alias.
    The node''s llm-run reference is not exposed in this read shape. — export const NodeAliasResponseSchema
    = z.object({ id: z.string().uuid(), alias: z.string(), kind: AliasKindSchema, created_at: z.string().datetime({
    offset: true }), });

    src/modules/knowledge-graph/service/formatters.ts: held at toNodeAlias, which maps id, alias, kind
    and created_at. The shape is declared in dto/node.dto.ts, which is not in this file set. — return
    { id: row.id, alias: row.alias, kind: row.kind, created_at: formatTimestamptz(row.created_at) ?? new
    Date(0).toISOString(), };'
  encoded_at:
  - src/modules/knowledge-graph/dto/node.dto.ts
  - src/modules/knowledge-graph/service/formatters.ts
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: 'src/modules/knowledge-graph/dto/attribute.dto.ts: held at AttributeDetailResponseSchema (lines
    15-34). It declares the node''s attributes: value, status, recorded_at, provenance, valid_from, valid_to,
    the validity-start basis, confidence and superseded_at. It also declares the supersedes reference
    and the knowledge-node and attribute-key references, as node_id and attribute_key. — value: z.string(),

    status: AssertionStatusSchema,

    recorded_at: z.string().datetime({ offset: true }),

    superseded_at: z.string().datetime({ offset: true }).nullable().optional(),

    valid_from_source: ValidFromSourceSchema.nullable().optional(),

    supersedes_attribute_id: z.string().uuid().nullable().optional(),

    provenance: z.array(ProvenanceEntryResponseSchema),'
  encoded_at:
  - src/modules/knowledge-graph/dto/attribute.dto.ts
- node: domain/knowledge-base/node-filter
  conforms: true
  how: "src/modules/knowledge-graph/dto/queries.dto.ts: held at ListNodesQuerySchema, lines 61-71, which\
    \ declares the node_type, name_prefix, status, limit and offset attributes. — name_prefix: z.string().min(1).max(200).optional(),\n\
    \    status: NodeStatusSchema.optional(),\nsrc/modules/knowledge-graph/service/node.service.ts: held\
    \ at the ListNodesInput interface — export interface ListNodesInput {\n  readonly node_type?: string;\n\
    \  readonly name_prefix?: string;\n  readonly status?: NodeStatus;\n  readonly limit: number;\n  readonly\
    \ offset: number;\n}"
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: domain/knowledge-base/node-status
  conforms: true
  how: "src/modules/knowledge-graph/dto/enums.dto.ts: held at NodeStatusSchema, lines 12-17. The second\
    \ value is spelled `needs_review`, where the node has `needs-review`. — export const NodeStatusSchema\
    \ = z.enum([\n  \"active\",\n  \"needs_review\",\n  \"merged\",\n  \"deleted\",\n]);\nsrc/modules/knowledge-graph/repository/graph.repository.ts:\
    \ held at KnowledgeNodeRow.status, line 28, and ListNodesFilter.status, line 57 — readonly status:\
    \ \"active\" | \"needs_review\" | \"merged\" | \"deleted\";"
  encoded_at:
  - src/modules/knowledge-graph/dto/enums.dto.ts
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: domain/knowledge-base/node-type
  conforms: true
  how: "src/modules/knowledge-graph/catalog/catalog.ts: held at interface NodeTypeRow, lines 18-23. —\
    \ export interface NodeTypeRow {\n  readonly id: string;\n  readonly name: string;\n  readonly description:\
    \ string;\n  readonly version: number;\n}\nsrc/modules/knowledge-graph/dto/catalog.dto.ts: held at\
    \ NodeTypeResponseSchema (lines 18-23). It declares id, name, description and version. — export const\
    \ NodeTypeResponseSchema = z.object({\n  id: z.string().uuid(),\n  name: z.string(),\n  description:\
    \ z.string(),\n  version: z.number().int().min(1),"
  encoded_at:
  - src/modules/knowledge-graph/catalog/catalog.ts
  - src/modules/knowledge-graph/dto/catalog.dto.ts
- node: domain/knowledge-base/node-view
  conforms: true
  how: "src/modules/knowledge-graph/dto/queries.dto.ts: held at GetNodeByIdQuerySchema, lines 82-88, which\
    \ declares as_of, in_effect_only and include_uncertain. — as_of: IsoDateOnly.optional(),\n    in_effect_only:\
    \ BooleanQuery.optional().default(false),\n    include_uncertain: BooleanQuery.optional().default(true),\n\
    src/modules/knowledge-graph/service/node.service.ts: held at the GetNodeByIdInput interface — export\
    \ interface GetNodeByIdInput {\n  readonly nodeId: string;\n  readonly asOf?: string;\n  readonly\
    \ inEffectOnly: boolean;\n  readonly includeUncertain: boolean;\n}"
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: domain/knowledge-base/source-type
  conforms: false
  how: "src/modules/knowledge-graph/dto/enums.dto.ts, SourceTypeSchema, lines 69-78: export const SourceTypeSchema\
    \ = z.enum([\n  \"pdf\",\n  \"email\",\n  \"ata\",\n  \"chat\",\n  \"artigo\",\n  \"transcricao\"\
    ,\n  \"outro\",\n]); Node domain/knowledge-base/source-type lists the values: pdf, email, meeting-minutes,\
    \ chat, article, transcript, other. It adds: \"The material's own words for four of the values are\
    \ `ata` (meeting-minutes), `artigo` (article), `transcricao` (transcript) and `outro` (other).\" —\
    \ The source declares four values as the material's Portuguese words (ata, artigo, transcricao, outro).\
    \ The node holds meeting-minutes, article, transcript and other as the values, and names the Portuguese\
    \ words only as the material's own. No node says the Portuguese words are the stored or wire form,\
    \ so a reader who looks to the specification for the vocabulary will not find the one this file enumerates.\
    \ Changing either side would leave the two disagreeing with no record of which was decided."
  observed_at:
  - src/modules/knowledge-graph/dto/enums.dto.ts
- node: domain/knowledge-base/traversal-direction
  conforms: true
  how: 'src/modules/knowledge-graph/dto/queries.dto.ts: held at TraverseDirectionSchema, line 118. — export
    const TraverseDirectionSchema = z.enum(["out", "in", "both"]);

    src/modules/knowledge-graph/service/traversal.service.ts: held at the inline union on TraverseInput.direction
    and TraverseNodesInput.direction — readonly direction: "out" | "in" | "both";'
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: domain/knowledge-base/traversal-request
  conforms: true
  how: "src/modules/knowledge-graph/dto/queries.dto.ts: held at TraverseQuerySchema, lines 152-160, which\
    \ declares direction, link_types, depth, as_of and in_effect_only. — direction: TraverseDirectionSchema.optional().default(\"\
    both\"),\n    link_types: LinkTypesArray.optional(),\n    depth: TraverseDepthCoercer.optional().default(TRAVERSAL_DEPTH_DEFAULT),"
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
- node: domain/knowledge-base/valid-from-basis
  conforms: true
  how: 'src/modules/knowledge-graph/dto/enums.dto.ts: held at ValidFromSourceSchema, line 53 — export
    const ValidFromSourceSchema = z.enum(["stated", "document", "received"]);

    src/modules/knowledge-graph/repository/graph.repository.ts: held at valid_from_source in AttributeResolvedRow
    (line 174) and LinkResolvedRow (line 252) — readonly valid_from_source: "stated" | "document" | "received"
    | null;'
  encoded_at:
  - src/modules/knowledge-graph/dto/enums.dto.ts
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: domain/knowledge-base/value-type
  conforms: true
  how: "src/modules/knowledge-graph/catalog/catalog.ts: held at the string-literal union on AttributeKeyRow.value_type,\
    \ line 54. The file declares no named enumeration. — readonly value_type: \"date\" | \"number\" |\
    \ \"text\" | \"bool\";\nsrc/modules/knowledge-graph/dto/enums.dto.ts: held at AttributeValueTypeSchema,\
    \ lines 57-62 — export const AttributeValueTypeSchema = z.enum([\n  \"date\",\n  \"number\",\n  \"\
    text\",\n  \"bool\",\n]);\nsrc/modules/knowledge-graph/repository/catalog.repository.ts: held at The\
    \ value_type member of the AttributeKeyJoined interface, which declares the four-member union inline.\
    \ — readonly value_type: \"date\" | \"number\" | \"text\" | \"bool\";\nsrc/modules/knowledge-graph/repository/graph.repository.ts:\
    \ held at AttributeResolvedRow.value_type, line 166 — readonly value_type: \"date\" | \"number\" |\
    \ \"text\" | \"bool\";"
  encoded_at:
  - src/modules/knowledge-graph/catalog/catalog.ts
  - src/modules/knowledge-graph/dto/enums.dto.ts
  - src/modules/knowledge-graph/repository/catalog.repository.ts
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/allowed-value-unique-per-key
  conforms: true
  how: 'src/modules/knowledge-graph/catalog/catalog.ts: held at the per-key `Set` accumulation in buildSnapshot(),
    lines 176-184. — bucket = new Set<string>(); attributeValidValuesByKeyId.set(r.attribute_key_id, bucket);
    ... bucket.add(r.value);'
  encoded_at:
  - src/modules/knowledge-graph/catalog/catalog.ts
- node: rules/knowledge-base/allowed-values-in-string-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/catalog.repository.ts: held at The ORDER BY of both queries
    in listAttributeValidValues, the filtered one and the unfiltered one. — ORDER BY avv.attribute_key_id,
    avv.value ASC

    src/modules/knowledge-graph/service/catalog.service.ts: held at the `valid_values` expression in listAttributeKeysService,
    line 142 — { ...base, valid_values: [...values].sort() }'
  encoded_at:
  - src/modules/knowledge-graph/repository/catalog.repository.ts
  - src/modules/knowledge-graph/service/catalog.service.ts
- node: rules/knowledge-base/attribute-key-history
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listAttributeHistoryByNodeKey,\
    \ lines 529-543 — WHERE na.node_id = $1\n  AND na.attribute_key_id = $2\nORDER BY na.recorded_at ASC,\
    \ na.id ASC No status predicate is applied.\nsrc/modules/knowledge-graph/service/history.service.ts:\
    \ held at the call to listAttributeHistoryByNodeKey at lines 115-119, in getAttributeKeyHistoryService.\
    \ The service applies no status filter of its own. — const rows = await listAttributeHistoryByNodeKey(\n\
    \    client,\n    input.nodeId,\n    attributeKeyRow.id\n  );"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/service/history.service.ts
- node: rules/knowledge-base/attribute-key-history-check-order
  conforms: true
  how: 'src/modules/knowledge-graph/service/history.service.ts: held at the sequential branches in getAttributeKeyHistoryService
    at lines 97-113. They check for an existing node, then for one not deleted, then for a catalog key.
    — if (node === null) { throw new ResourceNotFoundError("KnowledgeNode", input.nodeId); } if (node.status
    === "deleted") { throw new NodeDeletedError(input.nodeId); } ... if (attributeKeyRow === undefined)
    { throw new UnknownAttributeKeyError(node.node_type, input.key); }'
  encoded_at:
  - src/modules/knowledge-graph/service/history.service.ts
- node: rules/knowledge-base/attribute-key-history-requires-registered-key
  conforms: true
  how: 'src/modules/knowledge-graph/service/history.service.ts: held at the catalog lookup and refusal
    at lines 109-113, in getAttributeKeyHistoryService — const cacheKey = attributeKeyCacheKey(node.node_type_id,
    input.key); const attributeKeyRow = catalog.attributeKeyByNodeTypeAndKey.get(cacheKey); if (attributeKeyRow
    === undefined) {'
  encoded_at:
  - src/modules/knowledge-graph/service/history.service.ts
- node: rules/knowledge-base/attribute-key-listing-by-node-type
  conforms: true
  how: 'src/modules/knowledge-graph/repository/catalog.repository.ts: held at The node_type_id branch
    of listAttributeKeys, and the matching branch of listAttributeValidValues. — WHERE ak.node_type_id
    = $1

    src/modules/knowledge-graph/service/catalog.service.ts: held at lines 98-108 of listAttributeKeysService.
    The file resolves the named node type to an id and forwards it as the listing filter. The predicate
    that restricts the rows sits in the repository function, outside this file. — nodeTypeId = row.id;
    ... const rows = await listAttributeKeys(client, { node_type_id: nodeTypeId });'
  encoded_at:
  - src/modules/knowledge-graph/repository/catalog.repository.ts
  - src/modules/knowledge-graph/service/catalog.service.ts
- node: rules/knowledge-base/attribute-key-listing-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/catalog.repository.ts: held at The ORDER BY of listAttributeKeys.
    The unfiltered query orders by node-type name and then key. The filtered query orders by key alone,
    which is the same order inside one node type. — ORDER BY nt.name ASC, ak.key ASC (unfiltered); ORDER
    BY ak.key ASC (filtered to one node_type_id)'
  encoded_at:
  - src/modules/knowledge-graph/repository/catalog.repository.ts
- node: rules/knowledge-base/current-assertion
  conforms: true
  how: "src/modules/knowledge-graph/repository/temporal-filter.ts: held at the current-view branch of\
    \ applyTemporalFilter, lines 79-82 — const lines = [\n    `AND ${alias}.valid_to IS NULL`,\n    `AND\
    \ ${alias}.superseded_at IS NULL`,\n  ];"
  encoded_at:
  - src/modules/knowledge-graph/repository/temporal-filter.ts
- node: rules/knowledge-base/deleted-node-read-refused
  conforms: true
  how: "src/modules/knowledge-graph/service/node.service.ts: held at the deleted-status branch in getNodeByIdService\
    \ — if (node.status === \"deleted\") {\n    throw new NodeDeletedError(input.nodeId);\n  }"
  encoded_at:
  - src/modules/knowledge-graph/service/node.service.ts
- node: rules/knowledge-base/expansion-depth-bounds
  conforms: true
  how: "src/modules/knowledge-graph/service/traversal.service.ts: held at assertDepth, lines 341-349,\
    \ with the bounds imported from traversal/config.ts — if (\n  !Number.isInteger(depth) ||\n  depth\
    \ < TRAVERSAL_DEPTH_MIN ||\n  depth > TRAVERSAL_DEPTH_MAX\n) {\n  throw new InvalidTraverseDepthError(depth,\
    \ TRAVERSAL_DEPTH_MAX);\n}\nsrc/modules/knowledge-graph/traversal/config.ts: held at the constants\
    \ TRAVERSAL_DEPTH_MIN and TRAVERSAL_DEPTH_MAX, lines 21 and 24. This file declares the bounds only.\
    \ The whole-number requirement and the search-query expansion depth are not stated here. — export\
    \ const TRAVERSAL_DEPTH_MIN = 1 as const; export const TRAVERSAL_DEPTH_MAX = 3 as const;"
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
  - src/modules/knowledge-graph/traversal/config.ts
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at fetchTraversalHop, lines 400-403\
    \ — if (filter.linkTypeIds !== undefined && filter.linkTypeIds.length > 0) {\n    params.push(filter.linkTypeIds);\n\
    \    where.push(`kl.link_type_id = ANY($${params.length}::uuid[])`);"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/graph-item-flags
  conforms: true
  how: "src/modules/knowledge-graph/service/formatters.ts: held at deriveFlags, lines 105-110 — if (status\
    \ === \"uncertain\") flags.push(\"uncertain\");\n  if (status === \"disputed\") flags.push(\"disputed\"\
    );"
  encoded_at:
  - src/modules/knowledge-graph/service/formatters.ts
- node: rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
  conforms: false
  how: "src/modules/knowledge-graph/repository/graph.repository.ts, listProvenanceByTargets, the excerpt\
    \ expression in the SELECT list (lines 322-323): substring(rc.\"text\" FROM rc.offset_start + 1\n\
    \                          FOR rc.offset_end - rc.offset_start) AS excerpt — rc.\"text\" is the chunk's\
    \ own text, while offset_start and offset_end are offsets into the source. The slice is therefore\
    \ shifted or empty for any chunk that does not start at offset 0, and the provenance entry loses the\
    \ text it exists to show. Every graph read (link, attribute, node, traversal, history) takes its excerpt\
    \ from this function.\nno file of the set holds this fact beside what was found against it"
  observed_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/graph-provenance-hides-compliance-deleted
  conforms: false
  how: "src/modules/knowledge-graph/repository/graph.repository.ts, listProvenanceByTargets, the join\
    \ chain and WHERE clause (lines 324-330): JOIN raw_information ri    ON ri.id = rc.raw_information_id\n\
    \          WHERE ${targetCol} = ANY($1::uuid[]) — No predicate on the raw information's compliance-deleted\
    \ state is applied here. A grep of the knowledge-graph services finds none for compliance, so a provenance\
    \ entry whose source was deleted for compliance can still be shown as traceable. A compliance deletion\
    \ exists to prevent exactly that.\nno file of the set holds this fact beside what was found against\
    \ it"
  observed_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/graph-provenance-one-entry-per-chunk
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listProvenanceByTargets, lines\
    \ 324-328 — FROM provenance p\n           JOIN information_fragment f ON f.id = p.fragment_id\n  \
    \         JOIN fragment_source fs    ON fs.fragment_id = f.id\n           JOIN raw_chunk rc      \
    \    ON rc.id = fs.raw_chunk_id\nThis yields one row per chunk cited by each provenance fragment."
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/graph-provenance-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at listProvenanceByTargets, line
    330 — ORDER BY ${targetCol}, p.created_at ASC, f.id ASC'
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/graph-read-as-of-view
  conforms: true
  how: 'src/modules/knowledge-graph/repository/temporal-filter.ts: held at the `opts.asOf !== undefined`
    branch of applyTemporalFilter, lines 67-76 — `AND ${alias}.superseded_at IS NULL`, `AND (${alias}.valid_from
    IS NULL OR ${alias}.valid_from <= $${p})`, `AND (${alias}.valid_to   IS NULL OR ${alias}.valid_to   >  $${p})`,'
  encoded_at:
  - src/modules/knowledge-graph/repository/temporal-filter.ts
- node: rules/knowledge-base/graph-read-current-view
  conforms: true
  how: "src/modules/knowledge-graph/repository/temporal-filter.ts: held at the fall-through after the\
    \ asOf branch, lines 78-82, which applies when no as-of date is given — // Query (a) — current view.\
    \ const lines = [\n    `AND ${alias}.valid_to IS NULL`,\n    `AND ${alias}.superseded_at IS NULL`,\n\
    \  ];"
  encoded_at:
  - src/modules/knowledge-graph/repository/temporal-filter.ts
- node: rules/knowledge-base/graph-read-in-effect-only
  conforms: true
  how: "src/modules/knowledge-graph/repository/temporal-filter.ts: held at the `if (opts.inEffectOnly)`\
    \ branch after the asOf early return, lines 83-87 — if (opts.inEffectOnly) {\n    lines.push(\n  \
    \    `AND (${alias}.valid_from IS NULL OR ${alias}.valid_from <= current_date)`\n    );\n  }"
  encoded_at:
  - src/modules/knowledge-graph/repository/temporal-filter.ts
- node: rules/knowledge-base/graph-read-shows-empty-provenance
  conforms: true
  how: 'src/modules/knowledge-graph/service/attribute.service.ts: held at line 28 and line 41. A missing
    provenance group falls back to an empty list, and that list is passed to the detail builder. — const
    provenance = provenanceByAttrId.get(row.id) ?? [];

    ...

    return toAttributeDetail(row, provenance);

    src/modules/knowledge-graph/service/history.service.ts: held at the empty-list defaults in assembleLinkHistory
    (line 149) and assembleAttributeHistory (line 173) — const provenance = provenanceByLinkId.get(row.id)
    ?? [];

    src/modules/knowledge-graph/service/link.service.ts: held at The nullish fallback to an empty list
    on line 33, which is returned through toLinkDetail on line 48. — const provenance = provenanceByLinkId.get(link.id)
    ?? [];

    src/modules/knowledge-graph/service/node.service.ts: held at the attribute mapping in the return of
    getNodeByIdService, where an attribute with no provenance gets an empty list — toAttributeDetail(r,
    provenanceByAttrId.get(r.id) ?? [])'
  encoded_at:
  - src/modules/knowledge-graph/service/attribute.service.ts
  - src/modules/knowledge-graph/service/history.service.ts
  - src/modules/knowledge-graph/service/link.service.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: rules/knowledge-base/history-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at walkLinkHistory (line 481),
    walkAttributeHistory (line 516) and listAttributeHistoryByNodeKey (line 539) — ORDER BY recorded_at
    ASC, id ASC'
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/in-effect-assertion
  conforms: true
  how: 'src/modules/knowledge-graph/repository/temporal-filter.ts: held at the in-effect clause at lines
    84-86, added on top of the current-view predicates — `AND (${alias}.valid_from IS NULL OR ${alias}.valid_from
    <= current_date)`'
  encoded_at:
  - src/modules/knowledge-graph/repository/temporal-filter.ts
- node: rules/knowledge-base/lineage-history
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at walkLinkHistory (lines 459-481)
    and walkAttributeHistory (lines 494-516) — up AS (... UNION SELECT kl.* FROM knowledge_link_resolved
    kl JOIN up ON kl.id = up.supersedes_link_id), down AS (... JOIN down ON kl.supersedes_link_id = down.id)
    Both walks apply no status or validity filter.'
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/link-type-listing-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/catalog.repository.ts: held at The ORDER BY of listLinkTypes,
    which orders link types by name, and the ORDER BY of listLinkTypeRules, which orders each link type''s
    rules by source and then target node-type name. — listLinkTypes: "ORDER BY name ASC". listLinkTypeRules:
    "ORDER BY r.link_type_id, src.name, tgt.name"'
  encoded_at:
  - src/modules/knowledge-graph/repository/catalog.repository.ts
- node: rules/knowledge-base/link-type-rules-on-request
  conforms: true
  how: 'src/modules/knowledge-graph/dto/queries.dto.ts: held at ListLinkTypesQuerySchema, line 28. It
    holds only the request switch, defaulting to false. The listing that carries the rules is not in this
    file. — include_rules: BooleanQuery.optional().default(false),

    src/modules/knowledge-graph/repository/catalog.repository.ts: held at listLinkTypeRules holds the
    "whatever their window" half: it selects every link_type_rule row and has no predicate on valid_from
    or valid_to. Whether rules are fetched only when the request asks for them is not decided in this
    file. It only exposes the function, and any caller decides whether to invoke it. — FROM link_type_rule
    r JOIN node_type src ON src.id = r.source_node_type_id JOIN node_type tgt ON tgt.id = r.target_node_type_id
    ORDER BY r.link_type_id, src.name, tgt.name

    src/modules/knowledge-graph/service/catalog.service.ts: held at the `options.include_rules` branch
    (lines 48-60) and the early return in the item mapper (line 77). Rules are fetched and attached only
    when asked for. No window filter is applied. — if (options.include_rules) { rulesByLinkType = new
    Map(); const rules = await listLinkTypeRules(client); ... } ... if (rulesByLinkType === null) return
    base;'
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
  - src/modules/knowledge-graph/repository/catalog.repository.ts
  - src/modules/knowledge-graph/service/catalog.service.ts
- node: rules/knowledge-base/merged-node-read-as-itself
  conforms: true
  how: "src/modules/knowledge-graph/service/history.service.ts: held at the node lookup in getAttributeKeyHistoryService\
    \ at lines 97-113. It reads the node by the requested id and uses that node's own `node_type_id` and\
    \ `node_type`, with no branch that follows a merge. — const node = await findNodeById(client, input.nodeId);\
    \ ... const cacheKey = attributeKeyCacheKey(node.node_type_id, input.key);\nsrc/modules/knowledge-graph/service/node.service.ts:\
    \ held at the status check in getNodeByIdService. Only \"deleted\" is refused, and a merged node is\
    \ returned through toNodeSummary without following its pointer. — if (node.status === \"deleted\"\
    ) {\n    throw new NodeDeletedError(input.nodeId);\n  }\n... node: toNodeSummary(node),"
  encoded_at:
  - src/modules/knowledge-graph/service/history.service.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: rules/knowledge-base/name-normalization
  conforms: true
  how: "src/modules/knowledge-graph/service/node.service.ts: held at the norm() call on the name prefix\
    \ in listNodesService. The norm implementation is in ./norm.js, which is not part of this file set.\
    \ — const name_prefix_norm =\n    input.name_prefix !== undefined ? norm(input.name_prefix) : undefined;\n\
    src/modules/knowledge-graph/service/norm.ts: held at the exported function norm() at line 27, with\
    \ collapseSpaces() at line 17 and stripDiacritics() at line 22 — export function norm(input: string):\
    \ string {\n  return collapseSpaces(stripDiacritics(input.trim())).toLowerCase();\n} with collapseSpaces:\
    \ `s.replace(/\\s+/g, \" \")` and stripDiacritics: `s.normalize(\"NFD\").replace(/[̀-ͯ]/g, \"\")`"
  encoded_at:
  - src/modules/knowledge-graph/service/node.service.ts
  - src/modules/knowledge-graph/service/norm.ts
- node: rules/knowledge-base/node-listing-by-status
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listNodes, lines 86-87 — const\
    \ where: string[] = [\"kn.status = $1\"];\n  params.push(filter.status);\nThe default to active is\
    \ applied by the caller. The field is required here: `readonly status: ...`.\nsrc/modules/knowledge-graph/service/node.service.ts:\
    \ held at the status default in listNodesService, passed on to the repository — const status: NodeStatus\
    \ = input.status ?? \"active\";"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: rules/knowledge-base/node-listing-name-prefix
  conforms: false
  how: "src/modules/knowledge-graph/repository/graph.repository.ts, listNodes, the optional alias join\
    \ built when name_prefix_norm is set (lines 98-102): aliasJoin = `JOIN node_alias na ON na.node_id\
    \ = kn.id\n                   AND na.alias_norm LIKE $${params.length} || '%'`; — The bound prefix\
    \ goes straight into a LIKE pattern, so a percent sign or underscore the owner types in a name prefix\
    \ acts as a wildcard and matches nodes whose names do not start with those characters. The service\
    \ only applies norm() (node.service.ts, `norm(input.name_prefix)`), and norm() escapes nothing, so\
    \ no code in the tree reads the prefix literally. The decision log records this same behavior as the\
    \ gap the rule closed."
  observed_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/node-listing-one-entry-per-node
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at listNodes, line 121 — SELECT
    DISTINCT kn.id, kn.node_type_id, nt.name AS node_type,'
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/node-listing-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at listNodes, line 125 — ORDER
    BY kn.canonical_name ASC, kn.id ASC'
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/node-listing-total-before-pagination
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listNodes, lines 110-113 —\
    \ const countSql = `SELECT count(DISTINCT kn.id)::int AS total\n                      ${baseFrom}`;\n\
    The count runs before the LIMIT and OFFSET parameters are pushed."
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/node-read-alias-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at listAliasesByNodeId, line
    152 — ORDER BY kind ASC, alias ASC The `alias_kind` enum is declared (''canonical'', ''alias'') in
    migrations/0001_init.sql, so canonical sorts first.'
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/node-read-attribute-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at listAttributesByNodeId, line
    218 — ORDER BY na.attribute_key ASC, na.recorded_at ASC, na.id ASC'
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/node-read-excludes-uncertain-on-request
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at listAttributesByNodeId, lines\
    \ 209-211 — if (!filter.includeUncertain) {\n    uncertainClause = \"AND na.status <> 'uncertain'\"\
    ;\n  }"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/node-type-filter-in-catalog
  conforms: true
  how: "src/modules/knowledge-graph/routes/knowledge-graph.routes.ts: held at The catch blocks of the\
    \ /attribute-keys and /nodes handlers, which render the refusal. The check itself sits in the services,\
    \ which receive `deps.catalog`. — `if (err instanceof UnknownNodeTypeError) { const { statusCode,\
    \ envelope } = mapErrorToHttpResponse(err); return reply.status(statusCode).send(envelope); }`\nsrc/modules/knowledge-graph/service/catalog.service.ts:\
    \ held at the node-type lookup branch in listAttributeKeysService, lines 99-106. The file does not\
    \ serve a node listing. — const row = catalog.nodeTypeByName.get(options.node_type); if (row === undefined)\
    \ { ... throw new UnknownNodeTypeError(options.node_type); }\nsrc/modules/knowledge-graph/service/node.service.ts:\
    \ held at the catalog lookup and throw in listNodesService — const row = catalog.nodeTypeByName.get(input.node_type);\n\
    \    if (row === undefined) {\n      throw new UnknownNodeTypeError(input.node_type);\n    }"
  encoded_at:
  - src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  - src/modules/knowledge-graph/service/catalog.service.ts
  - src/modules/knowledge-graph/service/node.service.ts
- node: rules/knowledge-base/node-type-listing-order
  conforms: true
  how: 'src/modules/knowledge-graph/repository/catalog.repository.ts: held at The ORDER BY of listNodeTypes.
    — SELECT id, name, description, version FROM node_type ORDER BY name ASC'
  encoded_at:
  - src/modules/knowledge-graph/repository/catalog.repository.ts
- node: rules/knowledge-base/node-view-defaults
  conforms: true
  how: "src/modules/knowledge-graph/dto/queries.dto.ts: held at GetNodeByIdQuerySchema, lines 84-86. —\
    \ as_of: IsoDateOnly.optional(),\n    in_effect_only: BooleanQuery.optional().default(false),\n  \
    \  include_uncertain: BooleanQuery.optional().default(true),"
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
- node: rules/knowledge-base/page-defaults
  conforms: true
  how: "src/modules/knowledge-graph/dto/queries.dto.ts: held at ListNodesQuerySchema, lines 66-69. The\
    \ other two page-defaults subjects, search and accepted-fragment listing, are not in this file. —\
    \ limit: IntegerQuery.pipe(z.number().int().min(1).max(100))\n      .optional()\n      .default(20),\n\
    \    offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),"
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
- node: rules/knowledge-base/page-limit-bounds
  conforms: false
  how: 'src/modules/knowledge-graph/dto/node.dto.ts, NodeListResponseSchema, the `limit` field (line 28):
    limit: z.number().int().min(1).max(100), — The page-limit bound of 1 to 100 is written a second time
    here, in a response schema, beside the request-side bound in queries.dto.ts. If the rule moves, this
    copy does not move with it. A list-nodes response that fell outside 1 to 100 would then fail response
    validation as an internal error rather than as the page-limit refusal the contract answers. The node
    is bound to queries.dto.ts, so a change to the node never reaches this file.'
  observed_at:
  - src/modules/knowledge-graph/dto/node.dto.ts
- node: rules/knowledge-base/page-offset-non-negative
  conforms: true
  how: 'src/modules/knowledge-graph/dto/queries.dto.ts: held at ListNodesQuerySchema offset, line 69.
    — offset: IntegerQuery.pipe(z.number().int().min(0)).optional().default(0),'
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
- node: rules/knowledge-base/point-reads-answer-any-status
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at findLinkById (lines 269-271)\
    \ and findAttributeById (lines 229-231) — SELECT kl.*\n   FROM knowledge_link_resolved kl\n   WHERE\
    \ kl.id = $1\nThe attribute read has the same shape, keyed on `na.id = $1`. Neither applies a status\
    \ or validity predicate.\nsrc/modules/knowledge-graph/service/attribute.service.ts: held at lines\
    \ 19-22 and 41. The service applies no status or validity gate and returns the found row whatever\
    \ its status. The lookup itself is findAttributeById in graph.repository.ts, which is outside this\
    \ file. — const row = await findAttributeById(client, attributeId);\nif (row === null) {\n  throw\
    \ new ResourceNotFoundError(\"NodeAttribute\", attributeId);\n}\nsrc/modules/knowledge-graph/service/link.service.ts:\
    \ held at The service treats a missing link as its only refusal. A link of any status is returned\
    \ through toLinkDetail. The status check at line 37 only decides whether to log, and does not withhold\
    \ the link. — const link = await findLinkById(client, linkId);\n  if (link === null) {\n    throw\
    \ new ResourceNotFoundError(\"KnowledgeLink\", linkId);\n  }"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/service/attribute.service.ts
  - src/modules/knowledge-graph/service/link.service.ts
- node: rules/knowledge-base/traversal-check-order
  conforms: true
  how: 'src/modules/knowledge-graph/service/traversal.service.ts: held at traverseNodeService, lines 86-97
    — assertDepth(input.depth); const linkTypeIds = resolveLinkTypeIds(catalog, input.linkTypeNames);
    const starting = await findNodeById(client, input.startingNodeId); if (starting === null) { throw
    new ResourceNotFoundError(...) } if (starting.status === "deleted") { throw new NodeDeletedError(...)
    }'
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-defaults
  conforms: true
  how: "src/modules/knowledge-graph/dto/queries.dto.ts: held at TraverseQuerySchema, lines 154-158. The\
    \ depth default is forwarded from traversal/config.ts as TRAVERSAL_DEPTH_DEFAULT. The omitted link_types\
    \ (follow every link type) and as_of (no date) defaults are the `.optional()` fields. — direction:\
    \ TraverseDirectionSchema.optional().default(\"both\"),\n    link_types: LinkTypesArray.optional(),\n\
    \    depth: TraverseDepthCoercer.optional().default(TRAVERSAL_DEPTH_DEFAULT),\n    as_of: IsoDateOnly.optional(),\n\
    \    in_effect_only: BooleanQuery.optional().default(false),\nsrc/modules/knowledge-graph/service/traversal.service.ts:\
    \ held at only the link-type part, in resolveLinkTypeIds (line 355). The direction and depth defaults\
    \ are not in this file, where TraverseInput declares direction, depth and inEffectOnly as required.\
    \ — if (names === undefined || names.length === 0) return undefined;\nsrc/modules/knowledge-graph/traversal/config.ts:\
    \ held at the constant TRAVERSAL_DEPTH_DEFAULT, line 27, which holds only the one-hop depth default.\
    \ The other omitted-option defaults are not stated in this file: either-end direction, no as-of date,\
    \ no in-effect-only request, and every link type. — export const TRAVERSAL_DEPTH_DEFAULT = 1 as const;"
  encoded_at:
  - src/modules/knowledge-graph/dto/queries.dto.ts
  - src/modules/knowledge-graph/service/traversal.service.ts
  - src/modules/knowledge-graph/traversal/config.ts
- node: rules/knowledge-base/traversal-direction
  conforms: true
  how: "src/modules/knowledge-graph/repository/graph.repository.ts: held at fetchTraversalHop, lines 394-395\
    \ — const sideCol =\n    filter.direction === \"out\" ? \"kl.source_node_id\" : \"kl.target_node_id\"\
    ;\nThe both case is left to the caller, which must call the function once for each side.\nsrc/modules/knowledge-graph/service/traversal.service.ts:\
    \ held at the two direction branches in traverseNodes, lines 190 and 200. The end each direction follows\
    \ is applied in fetchTraversalHop in the repository. — if (input.direction === \"out\" || input.direction\
    \ === \"both\") { ... if (input.direction === \"in\" || input.direction === \"both\") {"
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-drops-merge-self-loops
  conforms: true
  how: "src/modules/knowledge-graph/service/traversal.service.ts: held at isSubstitutionInducedSelfLoop,\
    \ lines 255-257 — const isSubstitutionInducedSelfLoop =\n  sourceId === targetId && row.source_node_id\
    \ !== row.target_node_id;\nif (isSubstitutionInducedSelfLoop) continue;"
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-expands-live-nodes
  conforms: false
  how: "src/modules/knowledge-graph/service/traversal.service.ts, traverseNodeService lines 102-111 together\
    \ with the frontier seed in traverseNodes at line 180: let startingResolved = starting; if (\n  starting.status\
    \ === \"merged\" &&\n  starting.merged_into_node_id !== null\n) {\n  const survivor = await findNodeById(client,\
    \ starting.merged_into_node_id);\n  if (survivor !== null && survivor.status !== \"deleted\") {\n\
    \    startingResolved = survivor;\n  }\n} ... let frontier: readonly string[] = input.startingNodeIds;\
    \ — When a starting node is merged and its survivor is absent or deleted, startingResolved stays the\
    \ merged node. traverseNodes then expands it at hop 1, because the frontier is seeded from the starting\
    \ ids with no status check. The rule says a traversal expands no merged or deleted node. The `nextFrontier`\
    \ loop applies the status filter; the seed does not. The same holds for any caller of traverseNodes\
    \ passing a merged or deleted id, such as the internal query-retrieval batch. The merged start is\
    \ also dropped from `nodes` by the `finalNodes` filter, while `starting_node_id` still names it."
  observed_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-link-once
  conforms: true
  how: 'src/modules/knowledge-graph/service/traversal.service.ts: held at the dedup guard in traverseNodes,
    line 262 — if (linksById.has(row.id)) continue;'
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-link-score
  conforms: true
  how: 'src/modules/knowledge-graph/service/traversal.service.ts: held at `const score = Math.pow(TRAVERSAL_DECAY,
    hop);` (line 245), with the value 0.5 in traversal/config.ts — const score = Math.pow(TRAVERSAL_DECAY,
    hop); ... linksById.set(row.id, { ...toLinkDetail(substitutedRow, []), hop, score });

    src/modules/knowledge-graph/traversal/config.ts: held at the constant TRAVERSAL_DECAY, line 18, which
    holds the 0.5 base. The exponentiation by hop count is applied outside this file. It appears here
    only in a comment. — export const TRAVERSAL_DECAY = 0.5 as const;'
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
  - src/modules/knowledge-graph/traversal/config.ts
- node: rules/knowledge-base/traversal-lists-reached-nodes
  conforms: true
  how: "src/modules/knowledge-graph/service/traversal.service.ts: held at the seed loop (lines 175-178)\
    \ and the finalNodes loop (lines 326-332) — for (const id of visitedNodeIds) {\n  const row = nodesById.get(id);\n\
    \  if (row === undefined) continue;\n  if (row.status === \"merged\") continue;\n  finalNodes.push(row);\n\
    }"
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-merged-start
  conforms: true
  how: "src/modules/knowledge-graph/service/traversal.service.ts: held at traverseNodeService, lines 102-111\
    \ — if (survivor !== null && survivor.status !== \"deleted\") {\n  startingResolved = survivor;\n}"
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-order
  conforms: true
  how: 'src/modules/knowledge-graph/service/traversal.service.ts: held at the insertion order of visitedNodeIds,
    linksById and hopLinks in traverseNodes. Starting ids are seeded first, and the out fetch is pushed
    before the in fetch within a hop. The order inside each fetch comes from the repository. — const visitedNodeIds
    = new Set<string>(input.startingNodeIds); ... hopLinks.push(...out); ... hopLinks.push(...inn);'
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
- node: rules/knowledge-base/traversal-skips-deleted-links
  conforms: true
  how: 'src/modules/knowledge-graph/repository/graph.repository.ts: held at fetchTraversalHop, line 417
    — AND kl.status <> ''deleted'''
  encoded_at:
  - src/modules/knowledge-graph/repository/graph.repository.ts
- node: rules/knowledge-base/traversal-substitutes-merged-ends
  conforms: true
  how: 'src/modules/knowledge-graph/service/traversal.service.ts: held at buildMergedSubstitution (lines
    376-404) and the substitutedRow construction (lines 247-268) — const sourceId = substitution.get(row.source_node_id)
    ?? row.source_node_id; const targetId = substitution.get(row.target_node_id) ?? row.target_node_id;'
  encoded_at:
  - src/modules/knowledge-graph/service/traversal.service.ts
unstated:
- file: src/modules/knowledge-graph/dto/catalog.dto.ts
  where: AttributeKeyResponseSchema, the `version` field (line 79)
  evidence: 'version: z.number().int().min(1),'
  cost: The lower bound of 1 on an attribute key's version is enforced only here. The node declares `version`
    as a required integer with no bound.
- file: src/modules/knowledge-graph/dto/catalog.dto.ts
  where: LinkTypeResponseSchema, the `version` field (line 55)
  evidence: 'version: z.number().int().min(1),'
  cost: The lower bound of 1 on a link type's version is enforced only here. The node declares `version`
    as a required integer with no bound.
- file: src/modules/knowledge-graph/dto/catalog.dto.ts
  where: NodeTypeResponseSchema, the `version` field (line 22)
  evidence: 'version: z.number().int().min(1),'
  cost: The lower bound of 1 on a node type's version is enforced only here. The node declares `version`
    as a required integer with no bound. The next reader who looks for the smallest valid version in the
    specification will not find it.
- file: src/modules/knowledge-graph/dto/traversal.dto.ts
  where: line 18, the `score` field of TraversalLinkResponseSchema
  evidence: 'score: z.number().min(0).max(1),'
  cost: The schema enforces a closed range of 0 to 1 on a traversal link's score. The only node that speaks
    of the score, rules/knowledge-base/traversal-link-score, says the score is "0.5 raised to the power
    h" and gives no range. A range of 0 to 1 would be decided by this line alone. The next reader looks
    in the specification for the range and does not find it. A change to the scoring would then fail response
    validation with no rule saying why.
- file: src/modules/knowledge-graph/mcp/query-toolset.ts
  where: QueryToolDescriptions.list_node_types, list_link_types and list_attribute_keys, lines 195-202
  evidence: "list_node_types:\n    \"List the active NodeType catalog entries (id, name, description,\
    \ version).\",\n  list_link_types:\n    \"List the active LinkType catalog entries. Pass `include_rules=true`\
    \ \" +\n  list_attribute_keys:\n    \"List the active AttributeKey catalog entries, optionally scoped\
    \ to one \" +"
  cost: The description is text the running system sends to the model. It says the catalog lists only
    "active" entries, which implies the catalog has an active state that filters the listings. The contract
    answers "every node type", "every link type" and "every attribute key". No node says a catalog entry
    can be inactive, so the next reader will look for that state in the specification and not find it.
- file: src/modules/knowledge-graph/service/attribute.service.ts
  where: lines 30-39, the warn branch in getAttributeByIdService
  evidence: "if (row.status !== \"deleted\" && provenance.length === 0) {\n  logger.warn(\n    {\n   \
    \   route: \"GET /api/v1/attributes/:attribute_id\",\n      attribute_id: row.id,\n      status: row.status,\n\
    \    },\n    \"knowledge_graph_empty_provenance\"\n  );\n}"
  cost: The code treats an attribute with no provenance as an anomaly worth a warning, unless its status
    is deleted. No node states that rule or the deleted exemption. The empty-provenance nodes only say
    that a graph read shows an empty list and that a provenance read is refused. A reader changing what
    counts as anomalous, or which statuses are exempt, has nowhere in the specification to look. The log
    event name and its fields also live only in this file.
- file: src/modules/knowledge-graph/service/formatters.ts
  where: the `?? new Date(0).toISOString()` fallbacks in toNodeAlias (created_at), toAttributeDetail and
    toLinkDetail (recorded_at), and toProvenanceEntry (received_at)
  evidence: "created_at: formatTimestamptz(row.created_at) ?? new Date(0).toISOString(), recorded_at:\
    \ formatTimestamptz(row.recorded_at) ?? new Date(0).toISOString(), received_at:\n      formatTimestamptz(row.received_at)\
    \ ?? new Date(0).toISOString(),"
  cost: When a creation, recording or reception time is null, the code answers 1970-01-01T00:00:00.000Z
    as if it were a real time. The contract lists these times as facts to show and says nothing about
    a missing one. node-alias does not even mark created_at as required. A reader of the API gets an invented
    date that looks like data. The choice of the epoch as the stand-in lives only in this file, where
    the next reader will not look for it in the specification.
- file: src/modules/knowledge-graph/service/history.service.ts
  where: the empty-provenance log in assembleLinkHistory (lines 150-155) and assembleAttributeHistory
    (lines 174-179)
  evidence: "if (row.status !== \"deleted\" && provenance.length === 0) {\n  logger.warn(\n    { route,\
    \ link_id: row.id, status: row.status },\n    \"knowledge_graph_empty_provenance\"\n  );\n}"
  cost: 'The code applies its own rule here: a history version that is not deleted and has no provenance
    raises a warning alarm, and a deleted one does not. The deleted exemption and the alarm''s existence
    are decisions no node records. The empty-provenance rule only says the read shows an empty list. A
    later reader looking for what an empty chain does in a history read will not find this in the specification.
    It is stated in code, and someone could change it without any node noticing.'
- file: src/modules/knowledge-graph/service/link.service.ts
  where: the BR-17 branch of getLinkByIdService, lines 35-46
  evidence: "if (link.status !== \"deleted\" && provenance.length === 0) {\n    logger.warn(\n      {\n\
    \        route: \"GET /api/v1/links/:link_id\",\n        link_id: link.id,\n        status: link.status,\n\
    \      },\n      \"knowledge_graph_empty_provenance\"\n    );\n  }"
  cost: The code treats a link with no provenance as an alarm worth a WARN, except when its status is
    deleted. No node states either half of that. The specification only says such a link is shown with
    an empty list. The alarm, its `deleted` exemption and the event name `knowledge_graph_empty_provenance`
    exist only in this file. Anyone who reads the specification to learn what the system reports about
    a link without provenance will not find them.
- file: src/modules/knowledge-graph/service/node.service.ts
  where: warnIfEmptyProvenance and its call in getNodeByIdService (lines 126-130 and 141-162)
  evidence: "if (r.status === \"deleted\") continue;\n    const arr = provenanceByAttrId.get(r.id);\n\
    \    if (arr === undefined || arr.length === 0) {\n      logger.warn(\n...\n        \"knowledge_graph_empty_provenance\""
  cost: The system emits a warning for every non-deleted attribute that has no provenance, and skips deleted
    ones. No node holds this. The grep of the full-text projection for empty provenance, WARN and log
    terms finds only the refusal on the provenance reads and the rule that a graph read shows an empty
    list. Because the warning exists only here, it reads as a decision the business made, and the next
    reader looks for it in the specification and does not find it.
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: the warning emitted in traverseNodes, lines 307-315
  evidence: "if (partial.status !== \"deleted\" && provenance.length === 0) {\n  logger.warn(\n    {\n\
    \      route: \"GET /api/v1/nodes/:node_id/traverse\",\n      link_id: linkId,\n      status: partial.status,\n\
    \    },\n    \"knowledge_graph_empty_provenance\"\n  );\n}"
  cost: The code treats a link that is not deleted and has no provenance as an anomaly worth a warning,
    and exempts deleted links. No node holds this alarm or its exemption. The candidate rules/knowledge-base/graph-read-shows-empty-provenance
    only says such a link is shown with an empty list, which the code also does. A reader looking in the
    specification for when the system raises this warning finds nothing, and the deleted exemption lives
    only here.
restates:
- file: src/modules/knowledge-graph/catalog/catalog.ts
  where: the comment above the accumulation loop in buildSnapshot(), lines 173-175
  evidence: // BR-30 — accumulate the closed value domain per attribute_key_id. The DB's // UNIQUE(attribute_key_id,
    value) constraint already guarantees uniqueness; // the `Set` deduplicates hand-built test fixtures
    too.
  cost: The comment states "no two allowed values of one attribute key hold the same value" a second time,
    in prose. The specification holds that rule in a node, and this file holds it in behavior, because
    the `Set` (`bucket.add(r.value)`) cannot hold two equal values. A reader looking for where the uniqueness
    lives finds the comment first and takes it for the decision. If the node moves, `--check` never reaches
    this prose.
  node: rules/knowledge-base/allowed-value-unique-per-key
- file: src/modules/knowledge-graph/dto/catalog.dto.ts
  where: the doc comment above `valid_values` in AttributeKeyResponseSchema (lines 80-85)
  evidence: "Present ONLY when the key\n   * has a closed domain; absent means OPEN (any literal parsing\
    \ against\n   * `value_type` is accepted)."
  cost: 'The comment is a second home for the rule that `valid_values` appears only for a key the catalog
    closes. The contract holds that rule. The code holds it in `valid_values: z.array(z.string()).optional()`.
    If the contract changes, the comment keeps saying the old rule and nothing flags it.'
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/dto/enums.dto.ts
  where: the comment above EffectiveStatusSchema, lines 30-33
  evidence: "/**\n * Derived `effective_status` computed inside the resolved views (§5.4 / A9).\n * Includes\
    \ the read-only `inactive` projection that is never stored.\n */"
  cost: 'The comment restates the effective-status node''s fact that `inactive` is derived and never stored.
    The code holds it too: `AssertionStatusSchema` omits `inactive` and `EffectiveStatusSchema` adds it.
    The pair conforms, but the prose is a second home for the fact and will drift from the node if the
    node moves.'
  node: domain/knowledge-base/effective-status
- file: src/modules/knowledge-graph/dto/queries.dto.ts
  where: the doc comment above TraverseDepthCoercer, lines 130-136
  evidence: "Out-of-range `depth` is detected here AND re-asserted in the service layer\n * (defence in\
    \ depth, BR-05 of back spec). Zod failure surfaces as Zod parse\n * error (422 VALIDATION_INVALID_FORMAT\
    \ through the global handler); the\n * service-layer assertion produces BUSINESS_INVALID_TRAVERSE_DEPTH\
    \ so the\n * route can distinguish the two paths."
  cost: The comment restates the depth bounds and the BUSINESS_INVALID_TRAVERSE_DEPTH refusal, which expansion-depth-bounds
    and the retrieval contract hold. It also misdescribes this file. TraverseDepthCoercer does no range
    check, so the claim that out-of-range depth is "detected here" is false. The bounds are held in traversal/config.ts
    (TRAVERSAL_DEPTH_MIN = 1, TRAVERSAL_DEPTH_MAX = 3) and enforced in service/traversal.service.ts lines
    344-347, which throws InvalidTraverseDepthError. A reader is misled about where the range is enforced.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/dto/queries.dto.ts
  where: the doc comment above TraverseDirectionSchema, lines 114-117
  evidence: "Direction enum mirrors `openapi.yaml` traverseNode `direction` parameter.\n * Default in\
    \ this schema is `both` (matches OpenAPI)."
  cost: 'The comment restates the direction set and the default-both rule, which nodes hold, and points
    at openapi.yaml as a second authority. The code holds both in this file: `z.enum(["out", "in", "both"])`
    and `.optional().default("both")`. A reader is sent to OpenAPI to learn a fact the specification already
    states.'
  node: rules/knowledge-base/traversal-defaults
- file: src/modules/knowledge-graph/dto/traversal.dto.ts
  where: lines 1-5, the header comment above the imports
  evidence: // Mirrors `openapi.yaml` components.schemas.TraversalLink and // components.schemas.TraversalResult.
    The `TraversalLink` is a // `LinkDetail` extended with `hop` and `score` (BR-14 of back spec).
  cost: The comment restates, as prose, the node's fact that each traversal link is a link detail carrying
    its hop and score. It also names `openapi.yaml` and "BR-14 of back spec" as the authority. A reader
    who follows the comment goes to those documents and not to the specification node. The comment cannot
    track the node, and the tooling never reaches it.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/mcp/error-envelope.ts
  where: the comment inside the EmptyProvenanceError branch, lines 153-156
  evidence: "Legacy-data inconsistency surfaces as a generic 500 — by design the\n    // class carries\
    \ no `details` at the wire (anchor info stays server-side\n    // for the operator's audit log only).\
    \ Distinct from the generic\n    // SYSTEM_INTERNAL_ERROR: keeps the class's own `code`."
  cost: The contract refuses an empty provenance chain with "HTTP 500, error code SYSTEM_INTERNAL_ERROR".
    The comment calls that code distinct from SYSTEM_INTERNAL_ERROR. The class's own code is in fact that
    same value, so a reader who trusts the comment will look for a separate error code that does not exist.
    The code is correct, because this branch emits `err.code` with no `details`, and the prose misdescribes
    it.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/mcp/error-envelope.ts
  where: the docstring above mapErrorToHttpResponse, lines 61-64
  evidence: "Unknown errors collapse to 500 SYSTEM_INTERNAL_ERROR with a generic message;\n * `err.message`\
    \ is NEVER leaked to the client (caller logs the original at\n * ERROR level — `logLevel` in the result\
    \ signals that)."
  cost: The contract holds the refusal, "error code SYSTEM_INTERNAL_ERROR with message "Internal server
    error." and no details, withholding the cause". The docstring says it again, so a reader may take
    this file for the place it is decided. The behavior is carried by `return internalError();` here,
    with the body in `src/shared/error-mapping.ts`. If the contract moves, this prose stays behind and
    no check reaches it.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/mcp/query-toolset.ts
  where: the file-level header comment, lines 1-24, in particular lines 4-9 and 10-13
  evidence: '// `BEGIN READ ONLY` transaction (BR-23 rule 4), and returns the canonical MCP // envelope:
    ... so REST and MCP surface byte-identical error codes for the same // thrown sentinel.'
  cost: The read-only transaction and the same-answer-on-both-transports guarantee are each stated a second
    time in prose. A reader who finds the comment takes it for the authority on the rule. The nodes stay
    where the code is, in `withReadOnly` and in the shared `mapErrorToEnvelope`. The comment also says
    "mirroring the REST surface 1:1", which the file's own nine-tool list does not do, because REST also
    reads a link and an attribute by identity.
  node: constraints/retrieval-is-read-only
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: header comment, lines 13-15, the "asOf undefined -> current view" mode (the same fact appears
    in the code at lines 79-82)
  evidence: '//   1. asOf undefined            -> "current view" (query (a), BR-07): //        AND <alias>.valid_to
    IS NULL //        AND <alias>.superseded_at IS NULL'
  cost: The comment is a second home for the current-view rule. The code in this file already holds it,
    so the comment adds nothing and can drift from the node. A reader who trusts it over the node would
    not know which one the business decided.
  node: rules/knowledge-base/graph-read-current-view
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: header comment, lines 16-17 and 24-25, the `inEffectOnly` clause (the same fact appears in the
    code at lines 83-87)
  evidence: '//        [AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= current_date)] //          (the
    bracketed clause is added when `inEffectOnly = true`) // Note: the `inEffectOnly` flag is meaningful
    only in mode 1 — when // `asOf` is provided, the valid_from check is already part of the filter.'
  cost: The comment states the in-effect-only rule and its interaction with the as-of date a second time,
    outside behavior. The code already enforces both, so the comment can only drift from the node.
  node: rules/knowledge-base/graph-read-in-effect-only
- file: src/modules/knowledge-graph/repository/temporal-filter.ts
  where: header comment, lines 19-22, the "asOf provided -> valid-time travel" mode (the same fact appears
    in the code at lines 67-76)
  evidence: '//   2. asOf provided             -> "valid-time travel" (query (b), BR-08): //        AND
    <alias>.superseded_at IS NULL //        AND (<alias>.valid_from IS NULL OR <alias>.valid_from <= $asOf)
    //        AND (<alias>.valid_to   IS NULL OR <alias>.valid_to   >  $asOf)'
  cost: The comment restates the as-of window, including which side of each bound is inclusive. The code
    already holds that, so the comment is a second home that the node's binding does not reach.
  node: rules/knowledge-base/graph-read-as-of-view
- file: src/modules/knowledge-graph/routes/knowledge-graph.routes.ts
  where: Header comment, lines 3-5.
  evidence: // Mounted under `/api/v1/*` by the bootstrap (`app.ts`). The parent scope // already enforces
    Neon Auth JWT (BR-01); individual handlers do NOT // re-check the token.
  cost: The contract's 401 refusal (no valid owner authentication) is also told in this prose, so the
    rule has a second home inside a route file. If the auth scope or its error codes change, this comment
    keeps asserting the old arrangement, and a reader looking for where authentication is enforced can
    stop here. Code holds the fact in backend/src/app.ts, where registerKnowledgeGraphRoutes is called
    on the auth-protected `scoped` instance ("await registerKnowledgeGraphRoutes(scoped, { pool, logger,
    catalog });"). The scope's own comments there say requireNeonAuth applies to every request in it.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/catalog.service.ts
  where: the comment above the valid-values grouping in listAttributeKeysService, lines 110-112
  evidence: // BR-30 — attach closed-domain values so REST/MCP clients see the allowed // set up-front
    (parity with the chat ontology block). Group per key id; // keys with no rows stay OPEN (no `valid_values`).
  cost: 'The comment restates that `valid_values` appears only for a key the catalog closes. The conditional
    `values !== undefined && values.length > 0 ? { ...base, valid_values: ... } : base` holds that fact
    too. The fact now has a prose home that drifts silently.'
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/catalog.service.ts
  where: the comment inside listAttributeKeysService's unknown-node-type branch, line 102
  evidence: // BR-03 — fail fast before SQL.
  cost: The comment states, in prose, the refusal of a node type the catalog does not hold. The branch
    that throws `UnknownNodeTypeError` already holds that refusal, so the fact now lives in a second place.
    A later change to the refusal has a comment to keep in step that no tool reaches.
  node: rules/knowledge-base/node-type-filter-in-catalog
- file: src/modules/knowledge-graph/service/catalog.service.ts
  where: the doc comment on formatDate, line 148
  evidence: /** Format `Date` as `YYYY-MM-DD` using UTC components (DB dates are TZ-less). */
  cost: The comment restates the year-month-day format of a rule's validity start and end. The body of
    `formatDate` builds that format from UTC components, so the code already holds it. The prose is a
    second home for the format.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/errors.ts
  where: the doc comment above InvalidTraverseDepthError (line 59)
  evidence: /** BR-05 — `depth` parameter is outside `[TRAVERSAL_DEPTH_MIN, TRAVERSAL_DEPTH_MAX]`. */
  cost: The comment restates the depth bound, which code holds elsewhere. It names constants that traversal.service.ts
    (lines 344-347) compares against before throwing this error, and that dto/queries.dto.ts and dto/traversal.dto.ts
    use. It cites a back-spec id, not a node.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/service/errors.ts
  where: the doc comment above NodeDeletedError (line 20)
  evidence: /** BR-11 — `KnowledgeNode.status = 'deleted'` returns HTTP 410. */
  cost: The comment restates a refusal the class already carries in code (`statusCode = 410`, `code =
    "BUSINESS_NODE_DELETED"`). It cites a back-spec rule id (BR-11) that no node in the specification
    answers to. A reader can take it as a second home for the fact, and it can go stale without anything
    failing.
  node: rules/knowledge-base/deleted-node-read-refused
- file: src/modules/knowledge-graph/service/errors.ts
  where: the doc comment above UnknownAttributeKeyError (line 74)
  evidence: /** BR-20 — `(node_type, key)` pair is not registered in the catalog. */
  cost: The comment restates the registered-key refusal that the class already holds in code (`statusCode
    = 404`, `code = "BUSINESS_UNKNOWN_ATTRIBUTE_KEY"`). It cites a back-spec id, not a node.
  node: rules/knowledge-base/attribute-key-history-requires-registered-key
- file: src/modules/knowledge-graph/service/errors.ts
  where: the doc comment above UnknownLinkTypeError (line 46)
  evidence: /** BR-04 — a `link_types[]` element is not registered in the catalog. */
  cost: The comment restates the unknown-link-type refusal that the class already holds in code (`statusCode
    = 422`, `code = "BUSINESS_UNKNOWN_LINK_TYPE"`). It cites a back-spec id, not a node.
  node: rules/knowledge-base/unknown-link-type-refused
- file: src/modules/knowledge-graph/service/errors.ts
  where: the doc comment above UnknownNodeTypeError (line 33)
  evidence: /** BR-03 — `node_type` filter does not match the catalog. */
  cost: The comment restates the catalog-membership refusal that the class already holds in code (`statusCode
    = 422`, `code = "BUSINESS_UNKNOWN_NODE_TYPE"`). It cites a back-spec id, not a node.
  node: rules/knowledge-base/node-type-filter-in-catalog
- file: src/modules/knowledge-graph/service/formatters.ts
  where: the docstring above deriveFlags
  evidence: "Today this mirrors the storage `status` for\n * `uncertain` / `disputed`; `low_confidence`\
    \ is reserved for a future\n * threshold-based flag."
  cost: The prose restates the flag rule that the code in deriveFlags already holds. It also says low_confidence
    is "reserved for a future threshold-based flag". The node says a graph read never flags low-confidence.
    A reader taking the comment's word would plan a flag the specification rules out.
  node: rules/knowledge-base/graph-item-flags
- file: src/modules/knowledge-graph/service/history.service.ts
  where: the "Note:" comment before the return in getAttributeKeyHistoryService, lines 121-123
  evidence: '// Note: an empty result is a valid response — the caller queried a key // that exists in
    the catalog but has no attributes recorded yet on this // node. Return `{ versions: [] }` rather than
    404.'
  cost: The contract's empty-list answer for a key with no attributes is restated as prose. The code already
    gives that answer, because an empty `rows` yields `{ versions }` with an empty array. The comment
    is a second home for that answer.
  node: contracts/knowledge-base/retrieval
- file: src/modules/knowledge-graph/service/history.service.ts
  where: the comment "BR-11" above the node lookup in getAttributeKeyHistoryService, lines 96-103
  evidence: // BR-11 — resolve the node first; 404 if absent, 410 if tombstoned.
  cost: The check order (existing node, then not deleted, then a registered key) is stated a second time
    as prose. The code beneath it already holds that order, so the comment is a second home. It can drift
    from the node without anything noticing.
  node: rules/knowledge-base/attribute-key-history-check-order
- file: src/modules/knowledge-graph/service/history.service.ts
  where: the comment "BR-20" above attributeKeyCacheKey in getAttributeKeyHistoryService, lines 105-108
  evidence: // BR-20 — resolve `(node_type_id, key)` via the catalog cache. The // attribute_key id is
    required to scope the history listing; a miss // surfaces as 404 (BUSINESS_UNKNOWN_ATTRIBUTE_KEY)
    because the segment // is part of the URL hierarchy, not a free query parameter.
  cost: The refusal and its code are restated as prose. The code already refuses with UnknownAttributeKeyError
    at line 112. If the status or error code moves in the node, this comment keeps claiming the old value.
  node: rules/knowledge-base/attribute-key-history-requires-registered-key
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the comment above the deleted check in getNodeByIdService (line 101)
  evidence: // BR-11 — deleted -> 410 (row exists but tombstoned).
  cost: The refusal of a deleted node and its 410 status are restated in prose. The status code belongs
    to the contract and the error mapping, so the comment is a second home that can go stale without anyone
    noticing.
  node: rules/knowledge-base/deleted-node-read-refused
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the comment above the status default in listNodesService (line 62)
  evidence: // BR-15 — default to active when caller omits status.
  cost: The active-by-default rule is stated in prose beside the code that applies it, so a second home
    exists outside behavior. If the node moves, the comment keeps claiming the old default and nothing
    flags it.
  node: rules/knowledge-base/node-listing-by-status
- file: src/modules/knowledge-graph/service/node.service.ts
  where: the comment after the deleted check in getNodeByIdService (line 105)
  evidence: // Merged nodes return 200 with the merged_into pointer; caller follows.
  cost: The rule that a merged node is answered as itself is stated in prose. The code holds it only by
    not following the pointer, so the comment is the one place a reader sees the rule named.
  node: rules/knowledge-base/merged-node-read-as-itself
- file: src/modules/knowledge-graph/service/norm.ts
  where: the header comment block, lines 1-14, above collapseSpaces()
  evidence: '// Application-side mirror of the DB `norm()` function: // //   norm(x) = lower(unaccent(collapseSpaces(trim(x))))
    // // This is the SINGLE normalization policy of the system (CLAUDE.md // "Conventions").'
  cost: The comment states the normalization policy (lower-case, strip accents, trim, collapse whitespace)
    in prose, and calls itself the single policy of the system. That is a second home outside behavior.
    If the node's policy changes, the comment keeps saying the old formula and nothing flags it. A reader
    can also take it for the place the policy was decided. The code in this file already holds the policy,
    in norm().
  node: rules/knowledge-base/name-normalization
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: comment above `if (linksById.has(row.id)) continue;`, lines 259-261
  evidence: // Dedup links by underlying knowledge_link.id (BR-22). Keep the // SMALLEST hop number seen
    so far (BFS guarantees the first sight is // the minimum hop), so we only insert on first encounter.
  cost: 'The show-once-at-first-hop rule is restated in prose. Code holds it in this file: the `linksById.has(row.id)`
    guard before the single `linksById.set`.'
  node: rules/knowledge-base/traversal-link-once
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: comment above isSubstitutionInducedSelfLoop, lines 250-254
  evidence: // Skip self-edges that emerged purely because of merged substitution // (both endpoints collapsed
    to the same survivor) — they convey no // graph information beyond what the survivor itself already
    provides.
  cost: The self-loop rule and its rationale are in prose beside the code that holds them. Code holds
    it in `sourceId === targetId && row.source_node_id !== row.target_node_id`. The rationale is held
    nowhere.
  node: rules/knowledge-base/traversal-drops-merge-self-loops
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: docstring of traverseNodeService, lines 71-75
  evidence: '*   - InvalidTraverseDepthError (BR-05) — depth outside [1, 3]. *   - UnknownLinkTypeError
    (BR-04) — element of `linkTypeNames` not in catalog. *   - ResourceNotFoundError — starting node id
    absent. *   - NodeDeletedError (BR-11) — starting node tombstoned.'
  cost: 'The order of the checks is restated in a docstring. Code holds it in the statement order of traverseNodeService:
    assertDepth, resolveLinkTypeIds, the null check, then the deleted check.'
  node: rules/knowledge-base/traversal-check-order
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: docstring of traverseNodeService, lines 77-78
  evidence: '* On a `merged` starting node, the result substitutes the survivor as * the starting node
    id (BR-13) — the response includes the survivor in `nodes`.'
  cost: 'The merged-start rule is restated in prose. Code holds it in this file: `if (survivor !== null
    && survivor.status !== "deleted") { startingResolved = survivor; }`.'
  node: rules/knowledge-base/traversal-merged-start
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, line 11
  evidence: //   - Score = `TRAVERSAL_DECAY ** hop` (BR-14).
  cost: The scoring formula is stated in prose beside the code that computes it. Code holds it at `const
    score = Math.pow(TRAVERSAL_DECAY, hop);` in this file, with the value `TRAVERSAL_DECAY = 0.5` in src/modules/knowledge-graph/traversal/config.ts.
  node: rules/knowledge-base/traversal-link-score
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, line 15, and the comment at lines 320-325 above finalNodes
  evidence: //   - The starting node is included in the result `nodes` list.
  cost: 'Which nodes the result lists is stated in prose twice. Code holds it in this file: the seed loop
    over `findNodesByIds(client, input.startingNodeIds)` and the `finalNodes` loop over `visitedNodeIds`
    that skips only `row.status === "merged"`.'
  node: rules/knowledge-base/traversal-lists-reached-nodes
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, lines 12-14, and the comment at lines 232-236
  evidence: //   - Merged endpoints are substituted to their survivor BEFORE being //     added to the
    response or enqueued for further expansion //     (BR-13).
  cost: 'The substitution rule is written in prose in two places. Code holds it in this file, in buildMergedSubstitution
    and in `const substitutedRow: LinkResolvedRow = { ...row, source_node_id: sourceId, target_node_id:
    targetId }`.'
  node: rules/knowledge-base/traversal-substitutes-merged-ends
- file: src/modules/knowledge-graph/service/traversal.service.ts
  where: header comment, lines 7-8 (and the docstring of traverseNodeService, line 72)
  evidence: // - `depth ∈ [1, 3]`; out-of-range -> `InvalidTraverseDepthError` // (BR-05).
  cost: The 1-to-3 bound is written in prose a second time. If the bound moves, this comment keeps saying
    3 while the code follows TRAVERSAL_DEPTH_MAX. Code holds the fact in assertDepth in this file, using
    TRAVERSAL_DEPTH_MIN and TRAVERSAL_DEPTH_MAX from src/modules/knowledge-graph/traversal/config.ts (`export
    const TRAVERSAL_DEPTH_MAX = 3 as const;`).
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/traversal/config.ts
  where: the doc comment above TRAVERSAL_DEPTH_DEFAULT, line 26
  evidence: /** Default depth when the caller does not specify one. */
  cost: The omitted-depth default is stated as prose beside `TRAVERSAL_DEPTH_DEFAULT = 1`. The comment
    adds nothing the constant does not already carry, and it is a second place that would need changing
    if the node's default moved.
  node: rules/knowledge-base/traversal-defaults
- file: src/modules/knowledge-graph/traversal/config.ts
  where: the doc comments above TRAVERSAL_DEPTH_MIN and TRAVERSAL_DEPTH_MAX, lines 20 and 23
  evidence: /** Lower bound on the depth parameter (BR-05 of `knowledge-graph.back.md`). */ /** Upper
    bound on the depth parameter (BR-05). */
  cost: The 1-to-3 depth bound is stated twice in this file, once as the constants and once as prose naming
    a back-spec rule. A reader who finds the comment first may take the back-spec rule, not the specification
    node, as the authority. Nothing keeps that rule in step with the node when the node moves.
  node: rules/knowledge-base/expansion-depth-bounds
- file: src/modules/knowledge-graph/traversal/config.ts
  where: the header comment and the doc comment above TRAVERSAL_DECAY, lines 3-5 and 17
  evidence: '`TRAVERSAL_DECAY` (BR-14 of `knowledge-graph.back.md`, ADR A16) is the // single source of
    truth for the per-hop score decay applied by the BFS // traversal engine. /** Per-hop score multiplier:
    `score(hop) = TRAVERSAL_DECAY ** hop`. */'
  cost: The hop-score formula and its claim to be the "single source of truth" exist as prose beside `export
    const TRAVERSAL_DECAY = 0.5 as const;`. A reader is sent to a back-spec rule and an ADR letter instead
    of the specification node. The comment also asserts which consumers must change together, and no node
    holds that.
  node: rules/knowledge-base/traversal-link-score
unbound:
- src/modules/knowledge-graph/dto/history.dto.ts
- src/modules/knowledge-graph/dto/provenance.dto.ts
- src/modules/knowledge-graph/dto/traversal.dto.ts
- src/modules/knowledge-graph/index.ts
- src/modules/knowledge-graph/mcp/error-envelope.ts
- src/modules/knowledge-graph/mcp/query-transport.ts
- src/modules/knowledge-graph/service/errors.ts
adopted: true
unheld:
- node: domain/knowledge-base/search-layer
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/attribute-key-unique-per-node-type
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/effective-status
  how: 'read on 2 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/link-type-name-unique
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
- node: rules/knowledge-base/node-type-name-unique
  how: 'read on 1 file(s), and every judge answered `nowhere`: no file of the set holds this fact'
notes: 'Judged by 27 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/adopt-knowledge-graph.returns/.

  Staged as an adoption of source no delivery wrote: 83 candidate node(s) were read on every file, and
  each cleared one is bound to the files whose judgment holds its fact.

  Candidates: 15 opened across 9 of 27 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 11 fact(s) the source states that no node holds, over 9 file(s), listed under `unstated`.
  They block no binding here and no rebind closes them — the route is the analysis that gives each fact
  a node.

  Restates: 40 place(s) where text in the source restates a node''s fact the code holds, over 17 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/adopt-knowledge-graph.returns/`, which are the evidence behind every entry above.
