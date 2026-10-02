---
contract_version: siegard-reconcile/8
title: Reconcile the review-findings delivery and the facts decided after it
summary: structural.ts was corrected by the delivery of task/value-type-named/refusal-names-value-type
  so the number and bool refusals name the value and its value type, and the specification then gained
  through /analyse (commit 20a62fd) nodes stating facts the source already holds; the human states the
  source is correct and did not change since.
target: backend
files:
- path: src/modules/ingestion/prompts/extraction.v1.ts
  change: unchanged; the specification gained a rule for how the user message shows the reception time
    and the document date.
- path: src/modules/ingestion/prompts/extraction.v3.ts
  change: unchanged; the specification gained a rule naming the relative-date words the system prompt
    carries.
- path: src/modules/ingestion/prompts/extraction.v4.ts
  change: unchanged; the version 4 system prompt inherits the relative-date words and the anchor-date
    directive that the new rules state.
- path: src/modules/ingestion/validation/structural.ts
  change: the number and bool refusals now name the value and its value type; the contract answer for
    a value outside the allowed values now states its message and detail names.
- path: src/modules/query-retrieval/service/search.service.ts
  change: unchanged; the specification gained rules for the hop of a matched item, the provenance of a
    matched node and the layer of an expanded link, and search-item now requires layer, hop and summary.
nodes:
- node: contracts/knowledge-base/ingestion
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at assertFound, assertKnownType and assertValueInDomain,
    which build the refusal codes and details the contract names. parseAttributeValue also throws VALIDATION_INVALID_FORMAT
    with the value and its value type in the details. — throw new ValidationFailure("RESOURCE_NOT_FOUND",
    `${args.entity} ${args.id} not found.`, { entity: args.entity, id: args.id }); the three code branches
    "BUSINESS_UNKNOWN_NODE_TYPE", "BUSINESS_UNKNOWN_LINK_TYPE", "BUSINESS_UNKNOWN_ATTRIBUTE_KEY" with
    details { kind: args.kind, name: args.name }; throw new ValidationFailure("VALIDATION_INVALID_FORMAT",
    "value does not parse as a bool (expected ''true'' or ''false'').", { value: v, value_type: args.value_type
    })'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: domain/knowledge-base/search-item
  conforms: true
  how: 'src/modules/query-retrieval/service/search.service.ts: held at The IntermediateItem interface
    (lines 57-70), which declares kind, layer, score, hop, summary, flags and provenance. toSearchItem
    (line 478) projects it onto the SearchItem shape that dto/response.dto.ts declares. The attribute
    values are assigned at the three build sites: the fragment push (lines 178-191), the node push (lines
    214-226) and toExpandedLinkItem (lines 387-399). — interface IntermediateItem { readonly key: string;
    readonly kind: "node" | "link" | "fragment"; readonly layer: SearchLayer; readonly id: string; score:
    number; readonly hop: number; ... summary: string; flags: AssertionFlag[]; provenance: SearchProvenanceEntry[];
    ... } and, for a link reached by expansion, `kind: "link", layer: "node", ... summary: `${meta.source_canonical_name}
    -[${meta.link_type}]-> ${meta.target_canonical_name}``'
  encoded_at:
  - src/modules/query-retrieval/service/search.service.ts
- node: rules/knowledge-base/attribute-value-in-allowed-values
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at assertValueInDomain, lines 73-86. The
    refusal is raised when the value is not in the domain set. — if (domain.has(value)) { return; } const
    allowed_values = [...domain].sort(); throw new ValidationFailure("VALIDATION_INVALID_FORMAT", "attribute
    value not in closed domain", { value, allowed_values });'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/node-type-in-catalog
  conforms: true
  how: 'src/modules/ingestion/validation/structural.ts: held at assertKnownType, lines 102-120, in the
    node_type branch. A node type the catalog does not hold is refused with BUSINESS_UNKNOWN_NODE_TYPE.
    — args.kind === "node_type" ? "BUSINESS_UNKNOWN_NODE_TYPE" : ... throw new ValidationFailure(code,
    `${args.kind} ''${args.name}'' is not in the seeded catalog.`, { kind: args.kind, name: args.name
    })'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: rules/knowledge-base/link-type-in-catalog
  conforms: true
  how: 'a certified test decides this node, and every step the registry named for it passed over the tree
    as these files stand — run/reconcile-review-findings: `test` passed (exit 0) over npm test. No judge
    read this pair, and the run is the whole of what answered it'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
- node: scenarios/knowledge-base/impossible-calendar-date-refused
  conforms: true
  how: 'a certified test decides this node, and every step the registry named for it passed over the tree
    as these files stand — run/reconcile-review-findings: `test` passed (exit 0) over npm test. No judge
    read this pair, and the run is the whole of what answered it'
  encoded_at:
  - src/modules/ingestion/validation/structural.ts
pairs_omitted:
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-prompt-lists-closed-values
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-prompt-values-ascending
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-prompt-values-verbatim
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-reads-chunks-in-order
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-stated-basis-needs-written-start
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-turn-token-ceiling
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-in-catalog
  file: src/modules/ingestion/prompts/extraction.v1.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/document-content-is-data
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: constraints/extraction-acts-only-through-proposals
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/prompt-version
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/extraction-dates-events
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-event-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-event-type-fallback
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-relative-date-needs-document-date
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/go-live-date-is-the-value
  file: src/modules/ingestion/prompts/extraction.v3.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-never-invents-a-date
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  file: src/modules/ingestion/prompts/extraction.v4.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-value-parses
  file: src/modules/ingestion/validation/structural.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: constraints/retrieval-is-lexical-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/item-kind
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/page
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: domain/knowledge-base/search-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/chunk-match-never-surfaces
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expanded-link-requires-provenance
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-as-of-view
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-decay
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/expansion-follows-both-directions
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-hop
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-in-effect-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-restricted-to-named-link-types
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/expansion-starts-from-matched-nodes
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/item-flags
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-types-ignored-without-expansion
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-item-summary
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-surfaces-only-with-accepted-mention
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/non-expanding-search-walks-no-graph
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-layer-candidate-cap
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-option-defaults
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-ranking
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/search-total-before-pagination
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: rules/knowledge-base/temporal-filters-apply-to-expansion-only
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/uncertain-items-excluded-on-request
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/unknown-link-type-refused
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
- node: scenarios/knowledge-base/stop-words-only-query
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: scenarios/knowledge-base/synonym-without-shared-characters-finds-nothing
  file: src/modules/query-retrieval/service/search.service.ts
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 2 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-review-findings.returns/.

  2 pair(s) over 2 node(s) were decided by run/reconcile-review-findings rather than by a judge — a registry
  step decides the constraint, or a certified test decides the node — with step(s) test. No delegation
  read them; the run''s own log is the evidence, and it sits beside these returns.

  Candidates: 21 opened across 2 of 2 delegation(s); each return lists its own under `candidates_opened`.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-review-findings.returns/`, which are the evidence behind every entry above.
