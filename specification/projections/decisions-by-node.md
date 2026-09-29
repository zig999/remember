# Decisions by node

Derived by spec.py from decision-log.md; never edited. The log is the authority —
this groups its entries by the file each one located.

## domain/knowledge-base/_context.md
- strategic — decided: core
  unstated: The material does not say whether the knowledge base is core, supporting or generic.
  why: Tracing every answer back to its source is what the system exists for, and no off-the-shelf product does it.

## domain/knowledge-base/information-fragment.md
- attributes.llm_run.type — decided: string
  unstated: The material names the LLM run a fragment came from only as a filter and a listed field.
  why: The retrieval uses the run only as an identifier to filter by and to show, and reads nothing else about it.

## domain/knowledge-base/knowledge-node.md
- type — decided: aggregate-root in the same knowledge-base context, as every other record the retrieval reads
  unstated: The material leaves open whether the records the retrieval reads, written by other modules, are upstream contracts or elements of another context.
  why: The retrieval reads those records under the same names and meanings the rest of the system writes them with, so no translation marks a context boundary.
- relationships.node-alias.cardinality — decided: 1..*
  unstated: The material does not say whether a knowledge node can have no alias.
  why: The node layer reaches a node only through its aliases, so a node without one could never be found.

## domain/knowledge-base/raw-chunk.md
- attributes.locator.type — decided: string
  unstated: The material names a chunk's locator without giving its shape.
  why: The retrieval only passes the locator through to the owner.

## domain/knowledge-base/raw-information.md
- relationships.raw-chunk.cardinality — decided: 1..*
  unstated: The material does not say whether a raw information can hold no chunk.
  why: Every fragment is attributed to a chunk of its raw information, so a raw information without a chunk would yield nothing to read.
- attributes.metadata.type — decided: string
  unstated: The material names a raw information's metadata without giving its shape.
  why: The retrieval only passes the metadata through to the owner and reads nothing inside it.

## rules/knowledge-base/listing-excludes-compliance-deleted.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/listing-one-entry-per-fragment.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/listing-order.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/node-surfaces-only-with-accepted-mention.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/prose-matching.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/search-keeps-compliance-deleted-sources.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
