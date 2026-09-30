# Decisions by node

Derived by spec.py from decision-log.md; never edited. The log is the authority —
this groups its entries by the file each one located.

## constraints/ingestion-transports-answer-alike.md
- statement — decided: The two transports carry the same result and the same error code for every ingestion operation both expose, so MCP answers such a refusal as a refusal.
  unstated: The material has an MCP proposal whose service answered a refusal without raising it return that refusal wrapped in a success, while REST returns the refusal itself.
  why: Nothing in the material makes the ingestion transports differ in what they answer, only in how they frame it.

## constraints/retrieval-transports-answer-alike.md
- statement — decided: The two transports carry the same result and the same error code, and the constraint no longer fixes the framing.
  unstated: The standing node had MCP answer in the REST envelope, while the documentation has MCP answer in its own content and error framing with the same payload and the same error codes; the two decide differently for the shape of an MCP success.
  why: The documentation states repeatedly that the envelope is REST-only and that only the payload and the codes must match.

## contracts/knowledge-base/ingestion.md
- answers — decided: Held content answers HTTP 200 with outcome noop_existing and the run the held raw information already has, whatever model or prompt version the request names.
  unstated: The material has re-ingesting held content under another model or prompt version look for a run by the new idempotency key and fail with an internal error when none exists.
  why: Intake is idempotent by content hash, and a request that records nothing has nothing to fail on.
- answers — decided: A validation refusal of a REST proposal answers HTTP 200 carrying `{ ok: false, error }` with the refusal's code.
  unstated: The material has a REST proposal refused by validation answer HTTP 200 carrying the refusal, while the shared error registry maps the same codes to 4xx statuses.
  why: A validation refusal of a proposal is a result its run records, not a failure of the request that carried it.
- answers — decided: A malformed LLM run identity is refused with VALIDATION_INVALID_FORMAT on both transports.
  unstated: The material has the MCP proposals accept any non-empty text as the LLM run's identity while REST and the MCP run read demand a UUID; the two decide differently for a malformed run identity over MCP.
  why: An LLM run's identity is a UUID everywhere else the material names one.

## domain/chat/_context.md
- strategic — decided: supporting
  unstated: The material does not say whether the chat is core, supporting or generic.
  why: Keeping conversations with the assistant serves reading the knowledge base but is not what the system exists for.

## domain/chat/conversation.md
- relationships.message.cardinality — decided: 0..*
  unstated: The material does not say whether a conversation may hold no message.
  why: Nothing in the material requires a message before a conversation exists.
- relationships.tool-call.cardinality — decided: 0..*
  unstated: The material does not say how many tool calls a conversation holds.
  why: A conversation need not call any tool.

## domain/chat/graph-view.md
- attributes.snapshot.type — decided: string
  unstated: The material holds a graph view's snapshot as a structured document without giving its shape.
  why: Nothing in the material reads inside it, so it is carried whole as text.

## domain/chat/message.md
- attributes.content.type — decided: string
  unstated: The material holds a message's content as a structured document without giving its shape.
  why: Nothing in the material reads inside it, so it is carried whole as text.

## domain/chat/tool-call.md
- type — decided: entity of a separate chat context
  unstated: The material leaves open whether the conversation records belong to the knowledge-base context or to a context of their own.
  why: A tool call in a conversation is any tool the assistant used, while a knowledge-base tool call is the audit of one proposal, so the same term carries two meanings.
- attributes.arguments.type — decided: string
  unstated: The material holds a chat tool call's arguments as a structured document without giving its shape.
  why: Nothing in the material reads inside it, so it is carried whole as text.
- attributes.result.type — decided: string
  unstated: The material holds a chat tool call's result as a structured document without giving its shape.
  why: Nothing in the material reads inside it, so it is carried whole as text.

## domain/knowledge-base/_context.md
- strategic — decided: core
  unstated: The material does not say whether the knowledge base is core, supporting or generic.
  why: Tracing every answer back to its source is what the system exists for, and no off-the-shelf product does it.

## domain/knowledge-base/attribute-key.md
- type — decided: aggregate-root referencing its node type
  unstated: The material says an attribute key belongs to one node type without saying whether it changes together with it.
  why: Node attributes point at their key directly, and a reference only reaches an aggregate root.

## domain/knowledge-base/compliance-deletion.md
- attributes.affected.type — decided: string
  unstated: The material holds a compliance deletion's record of what it affected as a structured document without giving its shape.
  why: Nothing in the material reads inside it, so it is carried whole as text.
- attributes.affected.type — retired: The material now states what a compliance deletion affected as four counts, held by domain/knowledge-base/affected-counts, which compliance-deletion's affected attribute is typed by.

## domain/knowledge-base/curation-action.md
- attributes.payload.type — decided: string
  unstated: The material holds a curation action's payload as a structured document without giving its shape.
  why: Nothing in the material reads inside it, so it is carried whole as text.
- attributes.target_id.type — decided: string
  unstated: The material names the item a curation action acted on without saying what kind of identity it is.
  why: The action targets items of several kinds, so no single element's identity fits it.
- type — decided: aggregate-root
  unstated: The material does not say whether a curation action has an identity of its own or belongs to what it acted on.
  why: Each action is recorded once and never changes, and nothing it acted on holds it.
- attributes.action.type — decided: curation-action-kind
  unstated: The material closes the action a curation-action listing filters by to seven kinds, while the recorded action and the value written take any text; the two decide differently for a curation action recorded under a kind outside the seven.
  why: An action recorded under a kind no listing can filter for is one the audit trail cannot find by its kind.
- attributes.target_kind.type — decided: curation-target-kind
  unstated: The material closes the target kind a curation-action listing filters by to five kinds, while the recorded target kind and the value written take any text; the two decide differently for a curation action recorded on a target kind outside the five.
  why: An action recorded on a target kind no listing can filter for is one the audit trail cannot find by what it acted on.

## domain/knowledge-base/directed-ingestion.md
- type — decided: value-object
  unstated: The material describes a directed ingestion's request and report without saying whether it has an identity of its own.
  why: It is recorded only through the raw information and LLM run it produces.

## domain/knowledge-base/entity-match-review.md
- type — decided: aggregate-root
  unstated: The material records entity match reviews without saying what owns them.
  why: Each review is worked on its own in the curation queue, apart from the nodes it pairs.

## domain/knowledge-base/fragment-status.md
- values — decided: The five values stand, superseded included.
  unstated: The documentation lists four fragment states and leaves out superseded, which the standing node holds; the two decide differently for a fragment that was superseded.
  why: The first increment's material is the newer reading of the states fragments are held in, and the documentation's list predates it.

## domain/knowledge-base/information-fragment.md
- attributes.llm_run.type — decided: string
  unstated: The material names the LLM run a fragment came from only as a filter and a listed field.
  why: The retrieval uses the run only as an identifier to filter by and to show, and reads nothing else about it.
- attributes.llm_run.type — retired: The fragment's LLM run is now the reference to domain/knowledge-base/llm-run in information-fragment's relationships.

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

## domain/knowledge-base/link-type-rule.md
- type — decided: entity inside the link-type aggregate
  unstated: The material holds link type rules without saying which record owns them.
  why: A rule is looked up by its link type and has no meaning apart from it.

## domain/knowledge-base/llm-run.md
- type — decided: aggregate-root in the knowledge-base context
  unstated: The material does not say whether LLM runs and their tool calls belong to the knowledge base's context or to a context of their own.
  why: Ingestion writes the raw informations, fragments, nodes, links and attributes the retrieval reads under the same names and meanings, so no translation marks a boundary between them.

## domain/knowledge-base/proposal.md
- type — decided: value-object, carrying the kind, confidence, change hint, validity dates and basis, the LLM run and what it cites
  unstated: The material names four proposal operations without naming what they carry as one concept.
  why: Every check and consolidation of the four operations is stated about what is proposed, and a proposal has no identity before it is taken.

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
- attributes.document_date.type — decided: date
  unstated: The material reads a document date from a raw information's metadata without naming its type.
  why: It is used as a validity start, which is a calendar date.

## domain/knowledge-base/tool-call.md
- attributes.arguments.type — decided: string
  unstated: The material records a tool call's arguments as a free-form object without giving them a shape.
  why: Nothing in the material reads inside the arguments; they are kept and shown as recorded.
- attributes.result.type — decided: string
  unstated: The material records a tool call's result as a free-form object without giving it a shape.
  why: Nothing in the material reads inside the result except the outcome, which the validation outcome already holds.

## rules/knowledge-base/affected-nodes-follow-merges.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/affected-nodes-of-a-run.md
- statement — decided: The nodes that landed link and attribute proposals join or describe are affected nodes on every path.
  unstated: The material collects a run's affected nodes from the nodes its link and attribute proposals join or describe on the directed path, while the extraction path and a rebuild from tool calls count only the nodes its node proposals resolved to; the two decide differently for the target node of a link an extraction accepted.
  why: The collector is built to take those nodes, and only the extraction's results fail to carry them.
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/alias-not-blank.md
- statement — decided: The alias rule stands: a node proposal whose name or alias is blank once trimmed records no node or alias.
  unstated: The material refuses a blank alias while a new node holds its proposed name as its canonical alias and the name checks bound only its length; the two decide differently for a node proposal whose name is only whitespace.
  why: The store refuses a blank alias whatever the proposal passed, so no reading in which one is recorded can hold.

## rules/knowledge-base/alias-unique-per-node.md
- statement — decided: The uniqueness stands: a proposed name or alias whose normalized form the node already holds is held once.
  unstated: The material keeps one alias per normalized form on a node while a node proposal adds each of its proposed aliases; the two decide differently for a proposed alias that differs from one the node holds only in case, accents or spacing.
  why: Two aliases with one normalized form find the node under the same searches, so the second adds nothing a reader can use.
- statement — decided: The normalized form is the one name-normalization states, with every surrounding whitespace trimmed.
  unstated: The material's normalization trims only spaces before collapsing whitespace, so a leading or trailing tab or line break survives as a space, while entity resolution trims every surrounding whitespace; the two give different normalized forms for such a name.
  why: A name that differs only by surrounding whitespace names the same entity, so the stricter trim is the one the domain means.

## rules/knowledge-base/ambiguous-candidates-need-review.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.

## rules/knowledge-base/attribute-provenance-once-per-fragment.md
- statement — decided: The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.
  unstated: The material keeps one provenance per fragment on a node attribute while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the node attribute already holds.
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.

## rules/knowledge-base/attribute-value-parses.md
- statement — decided: Only a real calendar date is a date value.
  unstated: The material leaves to the runtime's date parser whether a well-formed but impossible date such as 2024-02-30 is refused.
  why: A date attribute names a day, and no such day exists.

## rules/knowledge-base/compliance-deletion-propagates.md
- consistency — decided: eventual
  unstated: The material does not say how this propagation holds across the separate records it changes.
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- statement — decided: A compliance deletion marks deleted only the fragments, links and attributes that rest on no other raw information that is not deleted.
  unstated: The standing node marks deleted every fragment of the raw information and every link and attribute whose only provenance is one of them, while the material spares any fragment, link or attribute that also rests on another raw information not deleted; the two decide differently for a fragment whose source chunks belong to two raw informations of which only one is deleted.
  why: Knowledge another source that is not deleted still attests is held by that source, so deleting one source does not take it away.

## rules/knowledge-base/compliance-deletion-tombstones.md
- statement — decided: A compliance deletion marks its raw information and raw chunks deleted and stamps the moment of the deletion as the supersession time of them, their fragments and every assertion it marks deleted.
  unstated: The material gives raw informations, raw chunks and information fragments a supersession time and shows a deleted assertion with no supersession time staying current and blocking an equal new one, without saying what sets these on a compliance deletion.
  why: A deleted item left without a supersession time keeps counting as current, which is what a deletion exists to end.

## rules/knowledge-base/compliance-refusal-takes-precedence.md
- statement — decided: The compliance refusal comes first except against the refusal of a fragment that is not accepted.
  unstated: The standing node put the compliance refusal ahead of every other, while the documentation puts the refusal of a fragment that is not accepted ahead of it; the two decide differently for a fragment provenance read of a non-accepted fragment whose source was deleted for compliance.
  why: The documentation states this precedence explicitly as the order of the three provenance refusals.

## rules/knowledge-base/conflict-disputes.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/consolidation-precedence.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/consolidation-records-provenance.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/correction-replaces.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/current-assertion.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/directed-defaults.md
- statement — decided: A directed attribute or link is proposed with change hint none.
  unstated: The material's directed service accepts a change hint and a validity end for attributes and links, while the directed tool's own schema declares neither, so they never arrive.
  why: The directed tool is the only way a directed ingestion is made, and it carries no change hint.

## rules/knowledge-base/document-ingestion-extracts-new-content.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.

## rules/knowledge-base/every-proposal-audited.md
- statement — decided: Every proposal within a run records its tool call, whichever transport carried it.
  unstated: The material has MCP proposals record a tool call on every outcome and REST proposals record none; the two decide differently for a proposal carried over REST.
  why: A run's summary is counted from its tool calls, so a proposal without one would vanish from its run's account.

## rules/knowledge-base/ingestion-records-chunks-and-run.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.

## rules/knowledge-base/link-provenance-once-per-fragment.md
- statement — decided: The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.
  unstated: The material keeps one provenance per fragment on a knowledge link while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the knowledge link already holds.
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.

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

## rules/knowledge-base/name-normalization.md
- statement — decided: Lower-casing, removing accents, trimming and collapsing inner whitespace.
  unstated: The material says entity resolution compares normalized names without saying what normalizing does.
  why: The material names the normalization as the database's own, and one normalization for every name comparison keeps resolution and alias matching from disagreeing about the same name.

## rules/knowledge-base/new-assertion-status-from-confidence.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/new-assertion.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/node-surfaces-only-with-accepted-mention.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/one-current-attribute-per-functional-key.md
- statement — decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  why: A dispute exists to hold both conflicting assertions until curation settles it.

## rules/knowledge-base/one-current-attribute-per-value.md
- statement — decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  why: A dispute exists to hold both conflicting assertions until curation settles it.

## rules/knowledge-base/one-current-link-per-functional-type.md
- statement — decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  why: A dispute exists to hold both conflicting assertions until curation settles it.

## rules/knowledge-base/one-current-link-per-target.md
- statement — decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  why: A dispute exists to hold both conflicting assertions until curation settles it.

## rules/knowledge-base/page-defaults.md
- statement — decided: The default of 20 holds for search and the accepted-fragment listing, and the tool-call listing defaults to 50.
  unstated: The standing node gives every page a default limit of 20, while the material's tool-call listing defaults its page to 50; the two decide differently for a tool-call listing that omits its limit.
  why: The tool-call listing's default is stated in its own request schema.

## rules/knowledge-base/proposal-meets-current-assertion.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/prose-matching.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/reaffirmation-consolidates.md
- statement — decided: For a type that allows multiple current assertions, a proposal with the same target or value that is not a correction re-affirms; for one that does not, it needs change hint none and the same validity start.
  unstated: The material has a multi-valued link re-affirm whatever its validity start while an attribute needs the same start, and a multi-valued proposal with change hint succession that meets a current assertion falls through to a duplicate and a system error; the two decide differently for a multi-valued attribute re-stated with another start.
  why: A multi-valued type holds only one current assertion per target or value, so a second one with the same target or value can only consolidate into it.
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/recent-ingestion-latest-run.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.

## rules/knowledge-base/required-start-fallback.md
- statement — decided: It takes the document date with basis document or, failing that, the reception date with basis received.
  unstated: The material lets a proposal that needs a validity start pass with no start and no basis when its source has a document date, while one whose source has only a reception date takes that date with basis received; the two decide differently for whether a required start may stay empty.
  why: A type that requires a validity start is never left without one, and every start carries its justification.

## rules/knowledge-base/retry-rejects-orphaned-fragments.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.

## rules/knowledge-base/search-excludes-compliance-deleted-sources.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- statement — decided: Search shows no information fragment whose raw information was deleted for compliance, as an item or as support, replacing the node that said search keeps such fragments.
  unstated: The first increment's material showed search surfacing an accepted fragment whose raw information has a compliance deletion, while the documentation says deleted content never recirculates and that compliance deletion marks the fragments deleted; the two decide differently for an accepted fragment of a compliance-deleted source.
  why: The documentation states the business's intent for deleted sources, and the first material only described what the code does.

## rules/knowledge-base/source-status-active-or-deleted.md
- statement — decided: A raw information and its raw chunks are only ever active or deleted.
  unstated: The material types a raw information's and a raw chunk's status with all four node statuses and gives needs-review and merged no meaning for either.
  why: Nothing reviews or merges a source, and the only change a source undergoes is its deletion for compliance.

## rules/knowledge-base/succession-before-previous-start.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/succession-closes-previous.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/succession-closing-date.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.

## rules/knowledge-base/summary-counts-orphaned-fragments.md
- consistency — decided: eventual
  unstated: The material does not say how this read holds across the separate records it combines.
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
