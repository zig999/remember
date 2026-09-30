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
- location: rules/knowledge-base/search-excludes-compliance-deleted-sources.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/search-excludes-compliance-deleted-sources.md
  field: statement
  unstated: 'The first increment''s material showed search surfacing an accepted fragment whose raw information has a compliance deletion, while the documentation says deleted content never recirculates and that compliance deletion marks the fragments deleted; the two decide differently for an accepted fragment of a compliance-deleted source.'
  decided: Search shows no information fragment whose raw information was deleted for compliance, as an item or as support, replacing the node that said search keeps such fragments.
  why: The documentation states the business's intent for deleted sources, and the first material only described what the code does.
- location: rules/knowledge-base/compliance-refusal-takes-precedence.md
  field: statement
  unstated: The standing node put the compliance refusal ahead of every other, while the documentation puts the refusal of a fragment that is not accepted ahead of it; the two decide differently for a fragment provenance read of a non-accepted fragment whose source was deleted for compliance.
  decided: The compliance refusal comes first except against the refusal of a fragment that is not accepted.
  why: The documentation states this precedence explicitly as the order of the three provenance refusals.
- location: constraints/retrieval-transports-answer-alike.md
  field: statement
  unstated: The standing node had MCP answer in the REST envelope, while the documentation has MCP answer in its own content and error framing with the same payload and the same error codes; the two decide differently for the shape of an MCP success.
  decided: The two transports carry the same result and the same error code, and the constraint no longer fixes the framing.
  why: The documentation states repeatedly that the envelope is REST-only and that only the payload and the codes must match.
- location: domain/knowledge-base/fragment-status.md
  field: values
  unstated: The documentation lists four fragment states and leaves out superseded, which the standing node holds; the two decide differently for a fragment that was superseded.
  decided: The five values stand, superseded included.
  why: The first increment's material is the newer reading of the states fragments are held in, and the documentation's list predates it.
- location: domain/knowledge-base/item-kind.md
  field: values
  unstated: The system specification lists attribute as a search item kind, while the domain documentation says an attribute is never a search item; the two decide differently for a node attribute matching a search.
  decided: node, link and fragment, with attribute not a kind.
  why: The domain documentation states the exclusion deliberately and the standing node already holds it.
- location: domain/knowledge-base/knowledge-link.md
  field: attributes.valid_from.type
  unstated: The material compares a link's validity start with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- location: domain/knowledge-base/knowledge-link.md
  field: attributes.valid_to.type
  unstated: The material compares a link's validity end with a date without naming its type.
  decided: date
  why: The as-of date it is compared with is a calendar date.
- location: rules/knowledge-base/compliance-deletion-propagates.md
  field: consistency
  unstated: The material does not say how this propagation holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: domain/knowledge-base/information-fragment.md
  field: attributes.llm_run.type
  retired: The fragment's LLM run is now the reference to domain/knowledge-base/llm-run in information-fragment's relationships.
- location: domain/knowledge-base/llm-run.md
  field: type
  unstated: The material does not say whether LLM runs and their tool calls belong to the knowledge base's context or to a context of their own.
  decided: aggregate-root in the knowledge-base context
  why: Ingestion writes the raw informations, fragments, nodes, links and attributes the retrieval reads under the same names and meanings, so no translation marks a boundary between them.
- location: domain/knowledge-base/tool-call.md
  field: attributes.arguments.type
  unstated: The material records a tool call's arguments as a free-form object without giving them a shape.
  decided: string
  why: Nothing in the material reads inside the arguments; they are kept and shown as recorded.
- location: domain/knowledge-base/tool-call.md
  field: attributes.result.type
  unstated: The material records a tool call's result as a free-form object without giving it a shape.
  decided: string
  why: Nothing in the material reads inside the result except the outcome, which the validation outcome already holds.
- location: domain/knowledge-base/raw-information.md
  field: attributes.document_date.type
  unstated: The material reads a document date from a raw information's metadata without naming its type.
  decided: date
  why: It is used as a validity start, which is a calendar date.
- location: domain/knowledge-base/attribute-key.md
  field: type
  unstated: The material says an attribute key belongs to one node type without saying whether it changes together with it.
  decided: aggregate-root referencing its node type
  why: Node attributes point at their key directly, and a reference only reaches an aggregate root.
- location: domain/knowledge-base/link-type-rule.md
  field: type
  unstated: The material holds link type rules without saying which record owns them.
  decided: entity inside the link-type aggregate
  why: A rule is looked up by its link type and has no meaning apart from it.
- location: domain/knowledge-base/entity-match-review.md
  field: type
  unstated: The material records entity match reviews without saying what owns them.
  decided: aggregate-root
  why: Each review is worked on its own in the curation queue, apart from the nodes it pairs.
- location: domain/knowledge-base/proposal.md
  field: type
  unstated: The material names four proposal operations without naming what they carry as one concept.
  decided: value-object, carrying the kind, confidence, change hint, validity dates and basis, the LLM run and what it cites
  why: Every check and consolidation of the four operations is stated about what is proposed, and a proposal has no identity before it is taken.
- location: domain/knowledge-base/directed-ingestion.md
  field: type
  unstated: The material describes a directed ingestion's request and report without saying whether it has an identity of its own.
  decided: value-object
  why: It is recorded only through the raw information and LLM run it produces.
- location: rules/knowledge-base/name-normalization.md
  field: statement
  unstated: The material says entity resolution compares normalized names without saying what normalizing does.
  decided: Lower-casing, removing accents, trimming and collapsing inner whitespace.
  why: The material names the normalization as the database's own, and one normalization for every name comparison keeps resolution and alias matching from disagreeing about the same name.
- location: rules/knowledge-base/affected-nodes-of-a-run.md
  field: statement
  unstated: The material collects a run's affected nodes from the nodes its link and attribute proposals join or describe on the directed path, while the extraction path and a rebuild from tool calls count only the nodes its node proposals resolved to; the two decide differently for the target node of a link an extraction accepted.
  decided: The nodes that landed link and attribute proposals join or describe are affected nodes on every path.
  why: The collector is built to take those nodes, and only the extraction's results fail to carry them.
- location: rules/knowledge-base/reaffirmation-consolidates.md
  field: statement
  unstated: The material has a multi-valued link re-affirm whatever its validity start while an attribute needs the same start, and a multi-valued proposal with change hint succession that meets a current assertion falls through to a duplicate and a system error; the two decide differently for a multi-valued attribute re-stated with another start.
  decided: For a type that allows multiple current assertions, a proposal with the same target or value that is not a correction re-affirms; for one that does not, it needs change hint none and the same validity start.
  why: A multi-valued type holds only one current assertion per target or value, so a second one with the same target or value can only consolidate into it.
- location: contracts/knowledge-base/ingestion.md
  field: answers
  unstated: The material has re-ingesting held content under another model or prompt version look for a run by the new idempotency key and fail with an internal error when none exists.
  decided: Held content answers HTTP 200 with outcome noop_existing and the run the held raw information already has, whatever model or prompt version the request names.
  why: Intake is idempotent by content hash, and a request that records nothing has nothing to fail on.
- location: rules/knowledge-base/every-proposal-audited.md
  field: statement
  unstated: The material has MCP proposals record a tool call on every outcome and REST proposals record none; the two decide differently for a proposal carried over REST.
  decided: Every proposal within a run records its tool call, whichever transport carried it.
  why: A run's summary is counted from its tool calls, so a proposal without one would vanish from its run's account.
- location: contracts/knowledge-base/ingestion.md
  field: answers
  unstated: The material has a REST proposal refused by validation answer HTTP 200 carrying the refusal, while the shared error registry maps the same codes to 4xx statuses.
  decided: 'A validation refusal of a REST proposal answers HTTP 200 carrying `{ ok: false, error }` with the refusal''s code.'
  why: A validation refusal of a proposal is a result its run records, not a failure of the request that carried it.
- location: contracts/knowledge-base/ingestion.md
  field: answers
  unstated: The material has the MCP proposals accept any non-empty text as the LLM run's identity while REST and the MCP run read demand a UUID; the two decide differently for a malformed run identity over MCP.
  decided: A malformed LLM run identity is refused with VALIDATION_INVALID_FORMAT on both transports.
  why: An LLM run's identity is a UUID everywhere else the material names one.
- location: constraints/ingestion-transports-answer-alike.md
  field: statement
  unstated: The material has an MCP proposal whose service answered a refusal without raising it return that refusal wrapped in a success, while REST returns the refusal itself.
  decided: The two transports carry the same result and the same error code for every ingestion operation both expose, so MCP answers such a refusal as a refusal.
  why: Nothing in the material makes the ingestion transports differ in what they answer, only in how they frame it.
- location: rules/knowledge-base/required-start-fallback.md
  field: statement
  unstated: The material lets a proposal that needs a validity start pass with no start and no basis when its source has a document date, while one whose source has only a reception date takes that date with basis received; the two decide differently for whether a required start may stay empty.
  decided: It takes the document date with basis document or, failing that, the reception date with basis received.
  why: A type that requires a validity start is never left without one, and every start carries its justification.
- location: rules/knowledge-base/attribute-value-parses.md
  field: statement
  unstated: The material leaves to the runtime's date parser whether a well-formed but impossible date such as 2024-02-30 is refused.
  decided: Only a real calendar date is a date value.
  why: A date attribute names a day, and no such day exists.
- location: rules/knowledge-base/directed-defaults.md
  field: statement
  unstated: The material's directed service accepts a change hint and a validity end for attributes and links, while the directed tool's own schema declares neither, so they never arrive.
  decided: A directed attribute or link is proposed with change hint none.
  why: The directed tool is the only way a directed ingestion is made, and it carries no change hint.
- location: rules/knowledge-base/page-defaults.md
  field: statement
  unstated: The standing node gives every page a default limit of 20, while the material's tool-call listing defaults its page to 50; the two decide differently for a tool-call listing that omits its limit.
  decided: The default of 20 holds for search and the accepted-fragment listing, and the tool-call listing defaults to 50.
  why: The tool-call listing's default is stated in its own request schema.
- location: rules/knowledge-base/affected-nodes-of-a-run.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/affected-nodes-follow-merges.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/summary-counts-orphaned-fragments.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/recent-ingestion-latest-run.md
  field: consistency
  unstated: The material does not say how this read holds across the separate records it combines.
  decided: eventual
  why: The records it combines are written independently and never change in one transaction, so a read reflects each as last committed.
- location: rules/knowledge-base/ingestion-records-chunks-and-run.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/retry-rejects-orphaned-fragments.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/ambiguous-candidates-need-review.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/document-ingestion-extracts-new-content.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- location: rules/knowledge-base/current-assertion.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/proposal-meets-current-assertion.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/consolidation-precedence.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/reaffirmation-consolidates.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/correction-replaces.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/succession-closes-previous.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/succession-before-previous-start.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/conflict-disputes.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/new-assertion.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/new-assertion-status-from-confidence.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/consolidation-records-provenance.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/succession-closing-date.md
  field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: Each case of this rule concerns one knowledge link or one node attribute and never both, so no reader depends on the two changing together.
- location: rules/knowledge-base/one-current-link-per-functional-type.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: rules/knowledge-base/one-current-link-per-target.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: rules/knowledge-base/one-current-attribute-per-functional-key.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: rules/knowledge-base/one-current-attribute-per-value.md
  field: statement
  unstated: The material has a dispute record a second current assertion beside the one it disputes while a duplicate guard keeps one current assertion per node and type, without saying whether the guard spares disputed assertions; the two decide differently for the new assertion of a dispute.
  decided: At most one current assertion that is not disputed; disputed assertions are exempt.
  why: A dispute exists to hold both conflicting assertions until curation settles it.
- location: domain/chat/_context.md
  field: strategic
  unstated: The material does not say whether the chat is core, supporting or generic.
  decided: supporting
  why: Keeping conversations with the assistant serves reading the knowledge base but is not what the system exists for.
- location: domain/chat/tool-call.md
  field: type
  unstated: The material leaves open whether the conversation records belong to the knowledge-base context or to a context of their own.
  decided: entity of a separate chat context
  why: A tool call in a conversation is any tool the assistant used, while a knowledge-base tool call is the audit of one proposal, so the same term carries two meanings.
- location: rules/knowledge-base/source-status-active-or-deleted.md
  field: statement
  unstated: The material types a raw information's and a raw chunk's status with all four node statuses and gives needs-review and merged no meaning for either.
  decided: A raw information and its raw chunks are only ever active or deleted.
  why: Nothing reviews or merges a source, and the only change a source undergoes is its deletion for compliance.
- location: rules/knowledge-base/compliance-deletion-tombstones.md
  field: statement
  unstated: The material gives raw informations, raw chunks and information fragments a supersession time and shows a deleted assertion with no supersession time staying current and blocking an equal new one, without saying what sets these on a compliance deletion.
  decided: A compliance deletion marks its raw information and raw chunks deleted and stamps the moment of the deletion as the supersession time of them, their fragments and every assertion it marks deleted.
  why: A deleted item left without a supersession time keeps counting as current, which is what a deletion exists to end.
- location: domain/knowledge-base/compliance-deletion.md
  field: attributes.affected.type
  unstated: The material holds a compliance deletion's record of what it affected as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/knowledge-base/curation-action.md
  field: attributes.payload.type
  unstated: The material holds a curation action's payload as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/message.md
  field: attributes.content.type
  unstated: The material holds a message's content as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/tool-call.md
  field: attributes.arguments.type
  unstated: The material holds a chat tool call's arguments as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/tool-call.md
  field: attributes.result.type
  unstated: The material holds a chat tool call's result as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/chat/graph-view.md
  field: attributes.snapshot.type
  unstated: The material holds a graph view's snapshot as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- location: domain/knowledge-base/curation-action.md
  field: attributes.target_id.type
  unstated: The material names the item a curation action acted on without saying what kind of identity it is.
  decided: string
  why: The action targets items of several kinds, so no single element's identity fits it.
- location: domain/knowledge-base/curation-action.md
  field: type
  unstated: The material does not say whether a curation action has an identity of its own or belongs to what it acted on.
  decided: aggregate-root
  why: Each action is recorded once and never changes, and nothing it acted on holds it.
- location: domain/chat/conversation.md
  field: relationships.message.cardinality
  unstated: The material does not say whether a conversation may hold no message.
  decided: 0..*
  why: Nothing in the material requires a message before a conversation exists.
- location: domain/chat/conversation.md
  field: relationships.tool-call.cardinality
  unstated: The material does not say how many tool calls a conversation holds.
  decided: 0..*
  why: A conversation need not call any tool.
- location: rules/knowledge-base/alias-not-blank.md
  field: statement
  unstated: The material refuses a blank alias while a new node holds its proposed name as its canonical alias and the name checks bound only its length; the two decide differently for a node proposal whose name is only whitespace.
  decided: 'The alias rule stands: a node proposal whose name or alias is blank once trimmed records no node or alias.'
  why: The store refuses a blank alias whatever the proposal passed, so no reading in which one is recorded can hold.
- location: rules/knowledge-base/alias-unique-per-node.md
  field: statement
  unstated: The material keeps one alias per normalized form on a node while a node proposal adds each of its proposed aliases; the two decide differently for a proposed alias that differs from one the node holds only in case, accents or spacing.
  decided: 'The uniqueness stands: a proposed name or alias whose normalized form the node already holds is held once.'
  why: Two aliases with one normalized form find the node under the same searches, so the second adds nothing a reader can use.
- location: rules/knowledge-base/alias-unique-per-node.md
  field: statement
  unstated: The material's normalization trims only spaces before collapsing whitespace, so a leading or trailing tab or line break survives as a space, while entity resolution trims every surrounding whitespace; the two give different normalized forms for such a name.
  decided: The normalized form is the one name-normalization states, with every surrounding whitespace trimmed.
  why: A name that differs only by surrounding whitespace names the same entity, so the stricter trim is the one the domain means.
- location: rules/knowledge-base/link-provenance-once-per-fragment.md
  field: statement
  unstated: The material keeps one provenance per fragment on a knowledge link while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the knowledge link already holds.
  decided: 'The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.'
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.
- location: rules/knowledge-base/attribute-provenance-once-per-fragment.md
  field: statement
  unstated: The material keeps one provenance per fragment on a node attribute while a re-affirmation adds a provenance for each fragment it cites; the two decide differently for a re-affirmation citing a fragment the node attribute already holds.
  decided: 'The uniqueness stands: a re-affirmation citing a fragment the assertion already holds adds no second provenance for it.'
  why: A second provenance to the same fragment traces the assertion to no source it was not already traced to.
- location: domain/knowledge-base/compliance-deletion.md
  field: attributes.affected.type
  retired: The material now states what a compliance deletion affected as four counts, held by domain/knowledge-base/affected-counts, which compliance-deletion's affected attribute is typed by.
- location: domain/knowledge-base/curation-action.md
  field: attributes.action.type
  unstated: The material closes the action a curation-action listing filters by to seven kinds, while the recorded action and the value written take any text; the two decide differently for a curation action recorded under a kind outside the seven.
  decided: curation-action-kind
  why: An action recorded under a kind no listing can filter for is one the audit trail cannot find by its kind.
- location: domain/knowledge-base/curation-action.md
  field: attributes.target_kind.type
  unstated: The material closes the target kind a curation-action listing filters by to five kinds, while the recorded target kind and the value written take any text; the two decide differently for a curation action recorded on a target kind outside the five.
  decided: curation-target-kind
  why: An action recorded on a target kind no listing can filter for is one the audit trail cannot find by what it acted on.
- location: rules/knowledge-base/compliance-deletion-propagates.md
  field: statement
  unstated: The standing node marks deleted every fragment of the raw information and every link and attribute whose only provenance is one of them, while the material spares any fragment, link or attribute that also rests on another raw information not deleted; the two decide differently for a fragment whose source chunks belong to two raw informations of which only one is deleted.
  decided: A compliance deletion marks deleted only the fragments, links and attributes that rest on no other raw information that is not deleted.
  why: Knowledge another source that is not deleted still attests is held by that source, so deleting one source does not take it away.
- location: rules/knowledge-base/node-listing-name-prefix.md
  field: statement
  unstated: The material shows a percent sign or an underscore in a node listing's name prefix acting as a wildcard, without saying whether a prefix is read literally.
  decided: A name prefix is read literally.
  why: A name prefix is the start of a name the owner types, and its characters mean themselves.
- location: rules/knowledge-base/node-read-alias-order.md
  field: statement
  unstated: The material orders a node's aliases by kind and then by alias without settling which kind comes first, since the order follows how the kinds are declared rather than their spelling.
  decided: The canonical alias comes first, followed by the other aliases in alphabetical order.
  why: The canonical alias is the name the node is known by, so it heads the list of its names.
- location: rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt.md
  field: statement
  unstated: The material cuts a provenance entry's excerpt from the chunk's own text starting at the chunk's start offset, which gives a shifted or empty slice for any chunk that does not start at the beginning of its source.
  decided: A provenance entry shows the whole excerpt of the raw chunk it cites.
  why: A chunk's excerpt is already the content between its offsets, so offsetting it again cuts away the text the entry exists to show.
- location: rules/knowledge-base/graph-provenance-hides-compliance-deleted.md
  field: statement
  unstated: The material reads a graph read's provenance with no filter on whether the fragment's raw information was deleted for compliance, and says nothing about whether such entries may be shown.
  decided: A graph read shows no provenance entry whose raw information was deleted for compliance.
  why: A compliance deletion exists to keep a deleted source's knowledge from being presented as still traceable, and a provenance entry presents exactly that trace.
- location: rules/knowledge-base/traversal-lists-reached-nodes.md
  field: statement
  unstated: The material leaves a merged starting node whose survivor is missing or deleted out of a traversal's nodes while its starting node identity still names it.
  decided: A traversal always lists its starting knowledge node.
  why: The starting node identity a traversal answers must resolve within the nodes that same answer lists.
- location: contracts/knowledge-base/retrieval.md
  field: answers
  unstated: The material has the REST node-type listing ignore unknown parameters while the MCP one refuses them, so the two transports answer the same request with a success and a refusal.
  decided: The node-type listing refuses an unknown parameter on both transports, like every other graph read.
  why: Every other catalog and graph read refuses an unknown parameter, and the transports answer each shared operation alike.
- location: contracts/knowledge-base/retrieval.md
  field: answers
  unstated: The material for the catalog listings, the node listing and the graph reads does not show how they authenticate their caller.
  decided: Each of these operations refuses an unauthenticated caller with the same answer as the other retrieval operations.
  why: They are served on the same owner-only surface as search, including the one query tool endpoint they share with it.
- location: rules/knowledge-base/expansion-follows-both-directions.md
  field: statement
  unstated: The standing node says expansion follows a knowledge link from either end, while the material's traversal follows links only from their source or only from their target when its direction is out or in; the two decide differently for an outgoing traversal from a node that is only a link's target.
  decided: The standing node governs a search's expansion, and a traversal follows the direction it names.
  why: The standing node was read from the search's expansion, which names no direction.
- location: rules/knowledge-base/expansion-skips-deleted-nodes.md
  field: statement
  unstated: The standing node says expansion never reaches a deleted knowledge node, while the material's traversal lists a deleted node it reaches as a link's end without expanding it; the two decide differently for a traversal whose link ends at a deleted node.
  decided: The standing node governs a search's expansion, and a traversal lists the deleted nodes it reaches.
  why: The standing node was read from the search's expansion, and the traversal shows each reached link together with both of its ends.
- location: domain/knowledge-base/knowledge-link.md
  field: relationships.llm-run.cardinality
  unstated: The standing node gives every knowledge link exactly one run, while the material's correction records the new link with no run; the two decide differently for a link a correction records.
  decided: 0..1
  why: A correction is an owner's act outside any extraction run, and the material records its new link with the run left empty.
- location: domain/knowledge-base/node-attribute.md
  field: relationships.llm-run.cardinality
  unstated: The standing node gives every node attribute exactly one run, while the material's correction records the new attribute with no run; the two decide differently for an attribute a correction records.
  decided: 0..1
  why: A correction is an owner's act outside any extraction run, and the material records its new attribute with the run left empty.
- location: rules/knowledge-base/dispute-scope.md
  field: statement
  unstated: The material's review queue groups disputed links of a link type that allows a single current link by source node and link type, while its dispute resolution requires the same target node; the two decide differently for two disputed reports_to links from one node to different targets.
  decided: Links of a link type that does not allow multiple current links share a dispute scope by source node and link type, whatever their targets.
  why: A dispute on such a link type arises precisely between links to different targets, so requiring one target leaves every such dispute unresolvable.
- location: rules/knowledge-base/metrics-disputed-queue-count.md
  field: statement
  unstated: The material counts the disputed queue for the metrics by source, target and link type whatever the link type, while its queue lists one entry per dispute scope; the two differ for a dispute between links to different targets.
  decided: The disputed queue count is the number of entries the disputed queue holds.
  why: The count is named after the queue, and the owner reads it as how many disputes await a decision.
- location: rules/knowledge-base/review-queue-page-windows-entries.md
  field: statement
  unstated: The material applies the page's limit and offset separately to three listings and, for the entity-match queue, to node-candidate rows, so a page can hold more entries than its limit and split one node's candidates across pages.
  decided: The page skips and returns whole entries in listing order.
  why: The owner reads the queue as a list of entries, and a limit that does not bound the entries returned does not page it.
- location: rules/knowledge-base/review-queue-total-before-pagination.md
  field: statement
  unstated: The material totals the queue as the count of needs-review nodes plus the count of disputed links and of disputed attributes, which is not the number of entries the queue lists when a dispute holds several items.
  decided: The total counts every entry the listing holds before the page is cut.
  why: A total over a paged list counts what the pages hold, as every other listing of this specification does.
- location: rules/knowledge-base/dispute-entry-time.md
  field: statement
  unstated: The material dates a disputed queue entry by the first of its items met within the fetched page, which depends on where the page cut falls.
  decided: The earliest recording time among its items.
  why: The items are met in recording order, so the earliest is what the material yields whenever the whole entry is on the page.
- location: contracts/knowledge-base/curation.md
  field: answers
  unstated: The standing rule limits every curation action's reason to 1000 characters, while the material's curation requests accept a reason of any length; the two decide differently for a rejection whose reason holds 1500 characters.
  decided: The rule stands for every curation action, and each curation decision refuses a longer reason with VALIDATION_INVALID_FORMAT, HTTP 422 over REST, as it refuses any other malformed field.
  why: The audit record carries one reason whichever operation wrote it, and a malformed field of these requests is answered that way.
- location: domain/knowledge-base/dispute-resolution.md
  field: attributes.item_ids.type
  unstated: The material names the items a dispute resolution acts on by identity without saying what kind of identity that is.
  decided: string
  why: The items are knowledge links or node attributes by the resolution's kind, so no single element's identity fits them.
- location: domain/knowledge-base/curation-metrics.md
  field: attributes.reject_rate_by_code.type
  unstated: The material gives the reject rate by code as a map from error code to rate without a shape the model can name.
  decided: reject-rate, many
  why: Each entry of the map pairs one code with one rate.
- location: domain/chat/turn.md
  field: type
  unstated: The material does not say whether a turn has an identity of its own or is a value carried by the messages it records.
  decided: value-object
  why: 'A turn is never stored or read as itself: what persists of it is its messages and tool calls.'
- location: rules/chat/send-message-check-order.md
  field: statement
  unstated: The material checks a disabled chat first on every conversation operation except sending a message, where the idempotency key, conversation identity and content are checked first; the two decide differently for a malformed message sent while the chat is disabled.
  decided: A sent message is checked for a disabled chat first, as every other conversation operation is.
  why: A disabled surface answers that it is disabled whatever the request holds.
- location: contracts/chat/conversations.md
  field: answers
  unstated: The material answers an update naming neither a title nor an archiving time with VALIDATION_REQUIRED_FIELD when the body is empty and with VALIDATION_INVALID_FORMAT when the body holds only other keys.
  decided: Every update naming neither field answers HTTP 422 VALIDATION_REQUIRED_FIELD with message "at least one of title or archived_at must be present".
  why: One condition gets one answer, and unknown keys are ignored everywhere else on this surface.
- location: contracts/chat/conversations.md
  field: answers
  unstated: The material answers a conversation cursor with the right shape but a creation time that is not a timestamp or an identity that is not an identifier with an internal error, and any other malformed cursor with VALIDATION_INVALID_FORMAT.
  decided: 'Every cursor that does not decode to a creation time and a well-formed identity answers HTTP 422 VALIDATION_INVALID_FORMAT with `details: { param: "cursor" }`.'
  why: A malformed cursor is the caller's error, never the system's.
- location: rules/chat/replay-reports-failure.md
  field: statement
  unstated: The material replays a turn recorded as provider-error or internal-error as a done event with stop reason end_turn, while the live turn ended in an error event.
  decided: A replay of a failed turn ends in the error event the live turn ended in, never in done.
  why: A failure answer is an answer, and a replay exists to say again what the turn said.
- location: rules/chat/message-listing-pages-backwards.md
  field: statement
  unstated: The material answers a message page with the oldest messages and a next-page moment that selects messages older than that page, so following it from the first page finds nothing.
  decided: A page holds the most recent messages before its moment, answered oldest first, and the next page ends before the oldest of them.
  why: Paging backwards from the newest message is the only reading in which following the next-page moment reaches every message.
- location: rules/chat/graph-delta-unreadable-result.md
  field: statement
  unstated: The material answers a tool result the graph delta cannot read with an empty graph delta for the traversal, the node read, the node listing and search, and with no graph delta for directed ingestion.
  decided: An unreadable result yields a graph delta with no nodes and no links, whatever the tool.
  why: One condition gets one answer, and four of the five tools already give it.
- location: rules/chat/archived-conversation-takes-no-turn.md
  field: statement
  unstated: The material refuses a turn and its cancellation on an archived conversation but lets its title, archiving time and graph view change and lets it be deleted, without saying which of these archiving is meant to stop.
  decided: Archiving stops turns only; an archived conversation can still be renamed, un-archived, deleted and have its graph view saved.
  why: Archiving ends the conversation going on, not the owner's keeping of it.
- location: rules/chat/conversation-usage-counts.md
  field: statement
  unstated: The material counts every message of a conversation in its usage, the assistant's tool requests and the tool results included, while its message listing shows only the owner's messages and the answers that ended turns.
  decided: Usage counts every message the conversation holds.
  why: Usage measures what the conversation consumed, and the model read every one of those messages.
---

## Description

Decisions the analysis made where the material was silent.
