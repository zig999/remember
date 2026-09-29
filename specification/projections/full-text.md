# Full text

Derived by spec.py from the specification files; never edited. Grep here to locate;
open the node file a match names before claiming anything about it.

=== constraints/llm-toolset-omits-fragment-listing
---
statement: The language model's query tool surface exposes search and the three provenance reads and does not expose the accepted-fragment listing.
scope: knowledge-base
---

## Description

None.

=== constraints/retrieval-is-read-only
---
statement: Every retrieval operation runs inside a read-only transaction.
scope: knowledge-base
fitness: each retrieval operation's database transaction is opened read-only
---

## Description

None.

=== constraints/retrieval-transports-answer-alike
---
statement: 'The REST and MCP transports answer every retrieval operation they both expose as `{ ok, result }` on success and as `{ ok: false, error: { code, message, details } }` on refusal, with the same error codes.'
scope: knowledge-base
---

## Description

None.

=== contracts/knowledge-base/retrieval
---
type: api
direction: published
operations:
- search
- read-link-provenance
- read-attribute-provenance
- read-fragment-provenance
- list-accepted-fragments
answers:
- operation: search
  accepted: '`{ ok: true, result }` carrying the page of ranked search items, each supporting fragment shown with its text, confidence, raw information, source type, reception time and chunk excerpt, and the total before pagination'
  refusals:
  - rule: rules/knowledge-base/search-query-must-parse
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_QUERY
  - rule: rules/knowledge-base/search-layer-outside-set-refused
    answer: HTTP 422, error code BUSINESS_INVALID_SEARCH_LAYER, naming the allowed layers
  - rule: rules/knowledge-base/unknown-link-type-refused
    answer: HTTP 422, error code BUSINESS_UNKNOWN_LINK_TYPE
- operation: read-link-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - when: No knowledge link is held at the requested identity.
    answer: HTTP 404 reporting not found
  - &id001
    rule: rules/knowledge-base/provenance-refused-after-compliance-deletion
    answer: HTTP 410, error code BUSINESS_RAW_INFORMATION_DELETED, naming the earliest compliance deletion
  - &id002
    rule: rules/knowledge-base/empty-provenance-chain-refused
    answer: HTTP 500, error code SYSTEM_INTERNAL_ERROR
- operation: read-attribute-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - when: No node attribute is held at the requested identity.
    answer: HTTP 404 reporting not found
  - *id001
  - *id002
- operation: read-fragment-provenance
  accepted: '`{ ok: true, result }` listing the provenance fragments, each with its text, confidence and status and the raw chunks it came from, each chunk with its index, offsets, excerpt, locator and raw information (source type, reception time, metadata, original input)'
  refusals:
  - when: No information fragment is held at the requested identity.
    answer: HTTP 404 reporting not found
  - rule: rules/knowledge-base/provenance-requires-accepted-fragment
    answer: HTTP 404, error code BUSINESS_FRAGMENT_NOT_ACCEPTED
  - *id001
  - *id002
- operation: list-accepted-fragments
  accepted: '`{ ok: true, result }` carrying the page of accepted fragments, each with its text, confidence, LLM run, creation time and source (raw information, chunk index, source type, reception time, document title)'
---

## Description

The owner's read surface over the knowledge base: search, the three provenance reads, and the accepted-fragment listing.

=== decision-log
---
entries:
- location: domain/knowledge-base/_context.md
  field: strategic
  unstated: The material does not say whether the knowledge base is core, supporting or generic.
  decided: core
  why: Tracing every answer back to its source is what the system exists for, and no off-the-shelf product does it.
- location: domain/knowledge-base/knowledge-node.md
  field: type
  unstated: The material leaves open whether the records the retrieval reads, written by other modules, are upstream contracts or elements of another context.
  decided: aggregate-root in the same knowledge-base context, as every other record the retrieval reads
  why: The retrieval reads those records under the same names and meanings the rest of the system writes them with, so no translation marks a context boundary.
- location: domain/knowledge-base/raw-information.md
  field: relationships.raw-chunk.cardinality
  unstated: The material does not say whether a raw information can hold no chunk.
  decided: 1..*
  why: Every fragment is attributed to a chunk of its raw information, so a raw information without a chunk would yield nothing to read.
- location: domain/knowledge-base/knowledge-node.md
  field: relationships.node-alias.cardinality
  unstated: The material does not say whether a knowledge node can have no alias.
  decided: 1..*
  why: The node layer reaches a node only through its aliases, so a node without one could never be found.
- location: domain/knowledge-base/raw-information.md
  field: attributes.metadata.type
  unstated: The material names a raw information's metadata without giving its shape.
  decided: string
  why: The retrieval only passes the metadata through to the owner and reads nothing inside it.
- location: domain/knowledge-base/information-fragment.md
  field: attributes.llm_run.type
  unstated: The material names the LLM run a fragment came from only as a filter and a listed field.
  decided: string
  why: The retrieval uses the run only as an identifier to filter by and to show, and reads nothing else about it.
- location: domain/knowledge-base/raw-chunk.md
  field: attributes.locator.type
  unstated: The material names a chunk's locator without giving its shape.
  decided: string
  why: The retrieval only passes the locator through to the owner.
- location: rules/knowledge-base/listing-excludes-compliance-deleted.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/listing-one-entry-per-fragment.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/listing-order.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/node-surfaces-only-with-accepted-mention.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/prose-matching.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/search-keeps-compliance-deleted-sources.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
---

## Description

Decisions the analysis made where the material was silent.

=== domain/knowledge-base/_context
---
strategic: core
---

## Description

The knowledge base holds what the owner supplied, the knowledge a language model extracted from it, and the graph of entities and relations built from that extraction.
The owner reads it back by searching it, by asking where an assertion came from, and by listing accepted fragments.

## Responsibility

It lets the owner find what the system knows and trace every answer back to the source it came from.

=== domain/knowledge-base/accepted-fragment-filter
---
type: value-object
attributes:
- name: llm_run
  type: string
- name: page
  type: page
relationships:
- target: raw-information
  type: reference
  cardinality: 0..1
---

## Description

What the owner narrows an accepted-fragment listing to: an LLM run, a raw information, or both, and a page.

## Responsibility

None.

=== domain/knowledge-base/assertion-flag
---
type: enumeration
values:
- uncertain
- disputed
- low-confidence
---

## Description

A warning a search item carries about how far it can be trusted.

## Responsibility

It keeps uncertainty visible instead of hidden.

=== domain/knowledge-base/assertion-status
---
type: enumeration
values:
- active
- uncertain
- disputed
- superseded
- deleted
---

## Description

The state a knowledge link or a node attribute is in.

## Responsibility

None.

=== domain/knowledge-base/compliance-deletion
---
type: aggregate-root
attributes:
- name: executed_at
  type: datetime
  required: true
relationships:
- target: raw-information
  type: reference
  cardinality: '1'
---

## Description

The record that a raw information was deleted to honour a data-protection obligation, and when the deletion was executed.

## Responsibility

It keeps a deleted source's knowledge from being presented as still traceable.

=== domain/knowledge-base/fragment-status
---
type: enumeration
values:
- proposed
- accepted
- rejected
- superseded
- deleted
---

## Description

The state an information fragment is in.

## Responsibility

None.

=== domain/knowledge-base/information-fragment
---
type: aggregate-root
attributes:
- name: text
  type: string
  required: true
- name: confidence
  type: decimal
  required: true
- name: status
  type: fragment-status
  required: true
- name: created_at
  type: datetime
  required: true
- name: llm_run
  type: string
relationships:
- target: raw-chunk
  type: association
  cardinality: 1..*
  role: source
---

## Description

A piece of knowledge a language model proposed from the chunks of a raw information, with the confidence it gave it.

## Responsibility

It is the link between what a source says and the assertions the graph holds.

=== domain/knowledge-base/item-kind
---
type: enumeration
values:
- node
- link
- fragment
---

## Description

What a search item stands for.

## Responsibility

None.

=== domain/knowledge-base/knowledge-link
---
type: aggregate-root
attributes:
- name: status
  type: assertion-status
  required: true
- name: recorded_at
  type: datetime
- name: provenance
  type: provenance
  many: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: source
- target: knowledge-node
  type: reference
  cardinality: '1'
  role: target
- target: link-type
  type: reference
  cardinality: '1'
---

## Description

A relation of one link type asserted from a source knowledge node to a target knowledge node.

## Responsibility

It is the edge the graph is traversed along.

=== domain/knowledge-base/knowledge-node
---
type: aggregate-root
attributes:
- name: canonical_name
  type: string
  required: true
- name: status
  type: node-status
  required: true
relationships:
- target: node-alias
  type: composition
  cardinality: 1..*
---

## Description

An entity the graph refers to, known by a canonical name and by its aliases.

## Responsibility

It is what links and attributes are asserted about.

=== domain/knowledge-base/link-type
---
type: aggregate-root
attributes:
- name: name
  type: string
  required: true
---

## Description

A named kind of relation the catalog holds.

## Responsibility

It fixes which relations a link may assert.

=== domain/knowledge-base/node-alias
---
type: entity
aggregate: knowledge-node
attributes:
- name: alias
  type: string
  required: true
---

## Description

One name a knowledge node is known by.

## Responsibility

It lets a node be found under any name a source used for it.

=== domain/knowledge-base/node-attribute
---
type: aggregate-root
attributes:
- name: status
  type: assertion-status
  required: true
- name: provenance
  type: provenance
  many: true
relationships:
- target: knowledge-node
  type: reference
  cardinality: '1'
---

## Description

A literal value asserted about a knowledge node.

## Responsibility

It holds what is known about a node that is not a relation to another node.

=== domain/knowledge-base/node-status
---
type: enumeration
values:
- active
- needs-review
- merged
- deleted
---

## Description

The state a knowledge node is in.

## Responsibility

None.

=== domain/knowledge-base/page
---
type: value-object
attributes:
- name: limit
  type: integer
- name: offset
  type: integer
---

## Description

A window over an ordered result: how many items to skip and how many to return.

## Responsibility

None.

=== domain/knowledge-base/provenance
---
type: value-object
attributes:
- name: recorded_at
  type: datetime
  required: true
relationships:
- target: information-fragment
  type: reference
  cardinality: '1'
---

## Description

The record that a link or an attribute was asserted on the strength of one information fragment, and when that was recorded.

## Responsibility

It lets every assertion be traced back to its source.

=== domain/knowledge-base/raw-chunk
---
type: entity
aggregate: raw-information
attributes:
- name: chunk_index
  type: integer
  required: true
- name: start_offset
  type: integer
- name: end_offset
  type: integer
- name: excerpt
  type: string
- name: locator
  type: string
- name: superseded_at
  type: datetime
---

## Description

One contiguous slice of a raw information's content, at a known position in it.
A chunk with a supersession time has been superseded and is no longer current.

## Responsibility

It anchors an information fragment to the exact place in the source it was read from.

=== domain/knowledge-base/raw-information
---
type: aggregate-root
attributes:
- name: source_type
  type: source-type
  required: true
- name: received_at
  type: datetime
  required: true
- name: title
  type: string
- name: metadata
  type: string
- name: original_input
  type: string
relationships:
- target: raw-chunk
  type: composition
  cardinality: 1..*
---

## Description

A piece of unstructured information the owner supplied, preserved as it was received.

## Responsibility

It is the source every extracted piece of knowledge traces back to.

=== domain/knowledge-base/search-item
---
type: value-object
attributes:
- name: kind
  type: item-kind
  required: true
- name: layer
  type: search-layer
- name: score
  type: decimal
  required: true
- name: hop
  type: integer
- name: summary
  type: string
- name: flags
  type: assertion-flag
  many: true
relationships:
- target: information-fragment
  type: association
  cardinality: 0..*
  role: provenance
---

## Description

One ranked answer of a search: a knowledge node, a knowledge link or an information fragment, with the fragments that support it.

## Responsibility

It tells the owner what matched, how strongly, and where it came from.

=== domain/knowledge-base/search-layer
---
type: enumeration
values:
- fragment
- node
- chunk
---

## Description

The kinds of knowledge a search matches its text against.

## Responsibility

None.

=== domain/knowledge-base/search-query
---
type: value-object
attributes:
- name: text
  type: string
  required: true
- name: layers
  type: search-layer
  many: true
- name: expand
  type: boolean
- name: expand_depth
  type: integer
- name: link_types
  type: string
  many: true
- name: as_of
  type: date
- name: in_effect_only
  type: boolean
- name: include_uncertain
  type: boolean
- name: page
  type: page
---

## Description

What the owner asks a search for: a text, the layers to read, how to expand through the graph, and which page of results to return.
Link types are named by their catalog name.

## Responsibility

It carries every choice the owner makes about one search.

=== domain/knowledge-base/source-type
---
type: enumeration
values:
- pdf
- email
- meeting-minutes
- chat
- article
- transcript
- other
---

## Description

The kind of source a raw information was received as.
The material's own words for four of the values are `ata` (meeting-minutes), `artigo` (article), `transcricao` (transcript) and `outro` (other).

## Responsibility

It tells the owner what kind of source a piece of knowledge came from.

=== rules/knowledge-base/alias-matching
---
type: invariant
statement: Aliases are matched without language stemming and without regard to accents.
constrains:
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/chunk-layer-matches-current-chunks
---
type: policy
statement: The chunk layer matches only raw chunks that are not superseded.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/raw-information
---

## Description

None.

=== rules/knowledge-base/chunk-match-never-surfaces
---
type: invariant
statement: A chunk-layer match never surfaces as a search item.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/compliance-refusal-takes-precedence
---
type: policy
statement: A provenance read whose chain reaches a compliance deletion is refused for that deletion ahead of any other refusal the read would meet.
constrains:
- domain/knowledge-base/provenance
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/empty-provenance-chain-refused
---
type: invariant
statement: A provenance read of an existing item whose provenance chain is empty is refused.
constrains:
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/expanded-link-requires-provenance
---
type: policy
statement: A knowledge link expansion reaches surfaces as a search item only when it holds provenance.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/expansion-decay
---
type: policy
statement: A knowledge link reached at hop h scores 0.5 raised to the power h times the score of the matched knowledge node it was reached from.
constrains:
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/expansion-depth-bounds
---
type: invariant
statement: A search query's expansion depth MUST be between 1 and 3 hops.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/expansion-follows-both-directions
---
type: invariant
statement: Expansion follows a knowledge link from either of its ends.
constrains:
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-restricted-to-named-link-types
---
type: policy
statement: Expansion under a query that names link types follows only links of those types.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/expansion-starts-from-matched-nodes
---
type: policy
statement: A search that expands does so through the knowledge graph from its matched knowledge nodes.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/fragment-layer-matches-accepted-only
---
type: policy
statement: The fragment layer matches only information fragments whose status is accepted.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/item-flags
---
type: invariant
statement: A search item is flagged uncertain when its status is uncertain, disputed when its status is disputed, and low-confidence when it is an accepted information fragment whose confidence is below 0.4.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/assertion-flag
---

## Description

None.

=== rules/knowledge-base/layer-weights
---
type: invariant
statement: A match's strength is weighted by 1.0 on the fragment layer, 0.9 on the node layer and 0.6 on the chunk layer.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/link-item-summary
---
type: policy
statement: A link search item's summary reads `source -[link type]-> target`, with the canonical names of its source and target knowledge nodes.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/link-types-ignored-without-expansion
---
type: invariant
statement: A search query that does not expand ignores the link types it names.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/listing-excludes-compliance-deleted
---
type: policy
statement: The accepted-fragment listing excludes information fragments whose raw information was deleted for compliance.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/compliance-deletion
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-holds-accepted-only
---
type: policy
statement: The accepted-fragment listing holds only information fragments whose status is accepted.
constrains:
- domain/knowledge-base/accepted-fragment-filter
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/listing-one-entry-per-fragment
---
type: policy
statement: The accepted-fragment listing shows each information fragment once, attributed to its lowest-index raw chunk.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-order
---
type: policy
statement: The accepted-fragment listing is ordered by source reception time descending, then fragment creation time descending, then fragment identifier ascending.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/listing-requires-a-filter
---
type: invariant
statement: An accepted-fragment listing MUST name an LLM run, a raw information, or both.
constrains:
- domain/knowledge-base/accepted-fragment-filter
---

## Description

None.

=== rules/knowledge-base/node-layer-matches-through-aliases
---
type: policy
statement: The node layer matches a knowledge node when the query text matches any one of its aliases.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-layer-skips-merged-and-deleted
---
type: policy
statement: The node layer never matches a knowledge node whose status is merged or deleted.
constrains:
- domain/knowledge-base/search-layer
- domain/knowledge-base/knowledge-node
---

## Description

None.

=== rules/knowledge-base/node-surfaces-only-with-accepted-mention
---
type: policy
statement: A matched knowledge node surfaces only when at least one accepted information fragment mentions one of its aliases.
constrains:
- domain/knowledge-base/knowledge-node
- domain/knowledge-base/information-fragment
- domain/knowledge-base/search-item
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/page-defaults
---
type: invariant
statement: A page that omits its limit returns 20 items and one that omits its offset starts at 0.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/page-limit-bounds
---
type: invariant
statement: A page's limit MUST be between 1 and 100.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/page-offset-non-negative
---
type: invariant
statement: A page's offset MUST be at least 0.
constrains:
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/prose-matching
---
type: policy
statement: Fragment text, chunk excerpts and the fragments that mention a node are matched with Portuguese stemming and without regard to accents.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/raw-information
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/provenance-in-recording-order
---
type: invariant
statement: A link's or an attribute's provenance lists its fragments in the order that provenance was recorded.
constrains:
- domain/knowledge-base/provenance
---

## Description

None.

=== rules/knowledge-base/provenance-refused-after-compliance-deletion
---
type: policy
statement: A provenance read whose chain reaches any raw information deleted for compliance is refused.
constrains:
- domain/knowledge-base/provenance
- domain/knowledge-base/compliance-deletion
---

## Description

None.

=== rules/knowledge-base/provenance-requires-accepted-fragment
---
type: invariant
statement: A fragment's provenance is read only when the fragment's status is accepted.
constrains:
- domain/knowledge-base/information-fragment
---

## Description

None.

=== rules/knowledge-base/search-keeps-compliance-deleted-sources
---
type: policy
statement: Search matches and surfaces information fragments whether or not their raw information was deleted for compliance.
constrains:
- domain/knowledge-base/information-fragment
- domain/knowledge-base/compliance-deletion
consistency: eventual
---

## Description

None.

=== rules/knowledge-base/search-layer-outside-set-refused
---
type: invariant
statement: A search query naming a layer that is not a search layer is refused.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/search-layer
---

## Description

None.

=== rules/knowledge-base/search-option-defaults
---
type: invariant
statement: 'A search option the query omits takes its default: every search layer, expansion on at depth 1, uncertain items included, and in-effect-only off.'
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-length
---
type: invariant
statement: A search query's text MUST NOT exceed 1000 characters.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-must-parse
---
type: invariant
statement: A search query whose lexical parse yields no search term is refused.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-query-not-blank
---
type: invariant
statement: A search query's text MUST NOT be empty once surrounding whitespace is trimmed.
constrains:
- domain/knowledge-base/search-query
---

## Description

None.

=== rules/knowledge-base/search-ranking
---
type: invariant
statement: Search items are ranked by score descending, then by recording time descending with a knowledge node counting as never recorded, then by identifier ascending.
constrains:
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/search-total-before-pagination
---
type: invariant
statement: A search's total counts every search item before the page is cut.
constrains:
- domain/knowledge-base/search-item
- domain/knowledge-base/page
---

## Description

None.

=== rules/knowledge-base/temporal-filters-apply-to-expansion-only
---
type: policy
statement: The as-of date and the in-effect-only switch filter the knowledge links expansion reaches and never the fragment, node or chunk layers.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/knowledge-link
---

## Description

None.

=== rules/knowledge-base/uncertain-items-excluded-on-request
---
type: invariant
statement: A search query that does not include uncertain items surfaces no search item whose status is uncertain.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/search-item
---

## Description

None.

=== rules/knowledge-base/unknown-link-type-refused
---
type: policy
statement: A search query that expands and names a link type the catalog does not hold is refused.
constrains:
- domain/knowledge-base/search-query
- domain/knowledge-base/link-type
---

## Description

None.

=== scenarios/knowledge-base/stop-words-only-query
---
subject: rules/knowledge-base/search-query-must-parse
given:
- the owner writes a search query made only of stop words
when:
- the owner searches with it
then:
- the search is refused
- no search item is returned
---

## Description

The query has characters, so it passes the length and blank checks, and still yields no search term.
