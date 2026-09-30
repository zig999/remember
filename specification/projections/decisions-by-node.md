# Decisions by node

Derived by spec.py from decision-log.md; never edited. The log is the authority —
this groups its entries by the file each one located.

## constraints/retrieval-transports-answer-alike.md
- statement — decided: The two transports carry the same result and the same error code, and the constraint no longer fixes the framing.
  unstated: The standing node had MCP answer in the REST envelope, while the documentation has MCP answer in its own content and error framing with the same payload and the same error codes; the two decide differently for the shape of an MCP success.
  why: The documentation states repeatedly that the envelope is REST-only and that only the payload and the codes must match.

## domain/knowledge-base/_context.md
- strategic — decided: core
  unstated: The material does not say whether the knowledge base is core, supporting or generic.
  why: Tracing every answer back to its source is what the system exists for, and no off-the-shelf product does it.

## domain/knowledge-base/fragment-status.md
- values — decided: The five values stand, superseded included.
  unstated: The documentation lists four fragment states and leaves out superseded, which the standing node holds; the two decide differently for a fragment that was superseded.
  why: The first increment's material is the newer reading of the states fragments are held in, and the documentation's list predates it.

## domain/knowledge-base/information-fragment.md
- attributes.llm_run.type — decided: string
  unstated: The material names the LLM run a fragment came from only as a filter and a listed field.
  why: The retrieval uses the run only as an identifier to filter by and to show, and reads nothing else about it.

## domain/knowledge-base/item-kind.md
- values — decided: node, link and fragment, with attribute not a kind.
  unstated: The system specification lists attribute as a search item kind, while the domain documentation says an attribute is never a search item; the two decide differently for a node attribute matching a search.
  why: The domain documentation states the exclusion deliberately and the standing node already holds it.

## domain/knowledge-base/knowledge-link.md
- attributes.valid_from.type — decided: date
  unstated: The material compares a link's validity start with a date without naming its type.
  why: The as-of date it is compared with is a calendar date.
- attributes.valid_to.type — decided: date
  unstated: The material compares a link's validity end with a date without naming its type.
  why: The as-of date it is compared with is a calendar date.

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

## rules/knowledge-base/compliance-deletion-propagates.md
- consistency — decided: eventual
  unstated: The material does not say how this propagation holds across the separate records it changes.
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.

## rules/knowledge-base/compliance-refusal-takes-precedence.md
- statement — decided: The compliance refusal comes first except against the refusal of a fragment that is not accepted.
  unstated: The standing node put the compliance refusal ahead of every other, while the documentation puts the refusal of a fragment that is not accepted ahead of it; the two decide differently for a fragment provenance read of a non-accepted fragment whose source was deleted for compliance.
  why: The documentation states this precedence explicitly as the order of the three provenance refusals.

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

## rules/knowledge-base/search-excludes-compliance-deleted-sources.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- statement — decided: Search shows no information fragment whose raw information was deleted for compliance, as an item or as support, replacing the node that said search keeps such fragments.
  unstated: The first increment's material showed search surfacing an accepted fragment whose raw information has a compliance deletion, while the documentation says deleted content never recirculates and that compliance deletion marks the fragments deleted; the two decide differently for an accepted fragment of a compliance-deleted source.
  why: The documentation states the business's intent for deleted sources, and the first material only described what the code does.
