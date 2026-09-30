# Decisions by node

Derived by spec.py from decision-log.md; never edited. The log is the authority —
this groups its entries by the file each one located.

## constraints/every-operation-requires-owner-authentication.md
- statement — decided: One system constraint for every operation; constraints/retrieval-requires-owner-authentication is removed, as it held no binding and no log entry.
  unstated: The specification held owner authentication only for retrieval, while the material authenticates the owner the same way before every operation.
  why: The same gate over every operation is one fact, and two constraints stating it for overlapping scopes would be two homes.

## constraints/ingestion-transports-answer-alike.md
- statement — decided: The two transports carry the same result and the same error code for every ingestion operation both expose, so MCP answers such a refusal as a refusal.
  unstated: The material has an MCP proposal whose service answered a refusal without raising it return that refusal wrapped in a success, while REST returns the refusal itself.
  why: Nothing in the material makes the ingestion transports differ in what they answer, only in how they frame it.

## constraints/retrieval-transports-answer-alike.md
- statement — decided: The two transports carry the same result and the same error code, and the constraint no longer fixes the framing.
  unstated: The standing node had MCP answer in the REST envelope, while the documentation has MCP answer in its own content and error framing with the same payload and the same error codes; the two decide differently for the shape of an MCP success.
  why: The documentation states repeatedly that the envelope is REST-only and that only the payload and the codes must match.

## contracts/chat/conversations.md
- answers — decided: Every update naming neither field answers HTTP 422 VALIDATION_REQUIRED_FIELD with message "at least one of title or archived_at must be present".
  unstated: The material answers an update naming neither a title nor an archiving time with VALIDATION_REQUIRED_FIELD when the body is empty and with VALIDATION_INVALID_FORMAT when the body holds only other keys.
  why: One condition gets one answer, and unknown keys are ignored everywhere else on this surface.
- answers — decided: Every cursor that does not decode to a creation time and a well-formed identity answers HTTP 422 VALIDATION_INVALID_FORMAT with `details: { param: "cursor" }`.
  unstated: The material answers a conversation cursor with the right shape but a creation time that is not a timestamp or an identity that is not an identifier with an internal error, and any other malformed cursor with VALIDATION_INVALID_FORMAT.
  why: A malformed cursor is the caller's error, never the system's.

## contracts/knowledge-base/access.md
- operations — decided: One published api, knowledge-base access, with authenticate-owner, route-request and read-health.
  unstated: The material gives the authentication refusals, the framework's routing and validation answers and the health probe without saying which contract holds these answers, since they come before or apart from any operation.
  why: They are what a caller of every operation reads, and they belong to no single operation's contract.
- answers — decided: Every SYSTEM_SERVICE_UNAVAILABLE answers "A backing service is temporarily unavailable."
  unstated: The material answers SYSTEM_SERVICE_UNAVAILABLE with "A backing service is temporarily unavailable." for an unreachable store and with "Internal server error." for a framework 503.
  why: One code carries one message, and a 503 is never an internal failure.
- answers — decided: Every validation failure answers "Request payload failed validation." with `details` a bare list of `{ path, message }`.
  unstated: The material answers a failed validation with `details` a list of `{ path, message }` and a fixed message for one validator, and with the framework's raw validation array and its own message for the other.
  why: The operations' contracts already promise that shape, and a caller cannot tell which validator ran.
- answers — decided: A key set that cannot be fetched answers HTTP 503 SYSTEM_SERVICE_UNAVAILABLE.
  unstated: The material answers a failure to fetch the auth provider's key set as an invalid token, while an unreachable store answers that a backing service is unavailable.
  why: The owner's token was not found invalid, and reporting it so hides an outage behind a refusal.
- answers — decided: Such a refusal keeps its status, with SYSTEM_INTERNAL_ERROR and the framework's message.
  unstated: The material answers a framework refusal with a status below 500 other than 401, 403, 404, 409 and 422 with that status and SYSTEM_INTERNAL_ERROR, which the code registry otherwise maps to 500.
  why: The status tells the caller the request was theirs to fix, and no domain code names those framework refusals.

## contracts/knowledge-base/curation.md
- answers — decided: The rule stands for every curation action, and each curation decision refuses a longer reason with VALIDATION_INVALID_FORMAT, HTTP 422 over REST, as it refuses any other malformed field.
  unstated: The standing rule limits every curation action's reason to 1000 characters, while the material's curation requests accept a reason of any length; the two decide differently for a rejection whose reason holds 1500 characters.
  why: The audit record carries one reason whichever operation wrote it, and a malformed field of these requests is answered that way.

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

## contracts/knowledge-base/retrieval.md
- answers — decided: The node-type listing refuses an unknown parameter on both transports, like every other graph read.
  unstated: The material has the REST node-type listing ignore unknown parameters while the MCP one refuses them, so the two transports answer the same request with a success and a refusal.
  why: Every other catalog and graph read refuses an unknown parameter, and the transports answer each shared operation alike.
- answers — decided: Each of these operations refuses an unauthenticated caller with the same answer as the other retrieval operations.
  unstated: The material for the catalog listings, the node listing and the graph reads does not show how they authenticate their caller.
  why: They are served on the same owner-only surface as search, including the one query tool endpoint they share with it.

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

## domain/chat/turn.md
- type — decided: value-object
  unstated: The material does not say whether a turn has an identity of its own or is a value carried by the messages it records.
  why: A turn is never stored or read as itself: what persists of it is its messages and tool calls.

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

## domain/knowledge-base/curation-metrics.md
- attributes.reject_rate_by_code.type — decided: reject-rate, many
  unstated: The material gives the reject rate by code as a map from error code to rate without a shape the model can name.
  why: Each entry of the map pairs one code with one rate.

## domain/knowledge-base/directed-ingestion.md
- type — decided: value-object
  unstated: The material describes a directed ingestion's request and report without saying whether it has an identity of its own.
  why: It is recorded only through the raw information and LLM run it produces.

## domain/knowledge-base/dispute-resolution.md
- attributes.item_ids.type — decided: string
  unstated: The material names the items a dispute resolution acts on by identity without saying what kind of identity that is.
  why: The items are knowledge links or node attributes by the resolution's kind, so no single element's identity fits them.

## domain/knowledge-base/entity-match-review.md
- type — decided: aggregate-root
  unstated: The material records entity match reviews without saying what owns them.
  why: Each review is worked on its own in the curation queue, apart from the nodes it pairs.

## domain/knowledge-base/fragment-status.md
- values — decided: The five values stand, superseded included.
  unstated: The documentation lists four fragment states and leaves out superseded, which the standing node holds; the two decide differently for a fragment that was superseded.
  why: The first increment's material is the newer reading of the states fragments are held in, and the documentation's list predates it.

## domain/knowledge-base/health-report.md
- type — decided: value-object in the knowledge-base context
  unstated: The material gives the health report's shape without saying whether it has an identity or which context it belongs to.
  why: Nothing identifies one report, and the system has no context of its own for operating it.

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
- relationships.llm-run.cardinality — decided: 0..1
  unstated: The standing node gives every knowledge link exactly one run, while the material's correction records the new link with no run; the two decide differently for a link a correction records.
  why: A correction is an owner's act outside any extraction run, and the material records its new link with the run left empty.

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

## domain/knowledge-base/node-attribute.md
- relationships.llm-run.cardinality — decided: 0..1
  unstated: The standing node gives every node attribute exactly one run, while the material's correction records the new attribute with no run; the two decide differently for an attribute a correction records.
  why: A correction is an owner's act outside any extraction run, and the material records its new attribute with the run left empty.

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

## rules/chat/archived-conversation-takes-no-turn.md
- statement — decided: Archiving stops turns only; an archived conversation can still be renamed, un-archived, deleted and have its graph view saved.
  unstated: The material refuses a turn and its cancellation on an archived conversation but lets its title, archiving time and graph view change and lets it be deleted, without saying which of these archiving is meant to stop.
  why: Archiving ends the conversation going on, not the owner's keeping of it.

## rules/chat/conversation-usage-counts.md
- statement — decided: Usage counts every message the conversation holds.
  unstated: The material counts every message of a conversation in its usage, the assistant's tool requests and the tool results included, while its message listing shows only the owner's messages and the answers that ended turns.
  why: Usage measures what the conversation consumed, and the model read every one of those messages.

## rules/chat/graph-delta-unreadable-result.md
- statement — decided: An unreadable result yields a graph delta with no nodes and no links, whatever the tool.
  unstated: The material answers a tool result the graph delta cannot read with an empty graph delta for the traversal, the node read, the node listing and search, and with no graph delta for directed ingestion.
  why: One condition gets one answer, and four of the five tools already give it.

## rules/chat/message-listing-pages-backwards.md
- statement — decided: A page holds the most recent messages before its moment, answered oldest first, and the next page ends before the oldest of them.
  unstated: The material answers a message page with the oldest messages and a next-page moment that selects messages older than that page, so following it from the first page finds nothing.
  why: Paging backwards from the newest message is the only reading in which following the next-page moment reaches every message.

## rules/chat/replay-reports-failure.md
- statement — decided: A replay of a failed turn ends in the error event the live turn ended in, never in done.
  unstated: The material replays a turn recorded as provider-error or internal-error as a done event with stop reason end_turn, while the live turn ended in an error event.
  why: A failure answer is an answer, and a replay exists to say again what the turn said.

## rules/chat/send-message-check-order.md
- statement — decided: A sent message is checked for a disabled chat first, as every other conversation operation is.
  unstated: The material checks a disabled chat first on every conversation operation except sending a message, where the idempotency key, conversation identity and content are checked first; the two decide differently for a malformed message sent while the chat is disabled.
  why: A disabled surface answers that it is disabled whatever the request holds.

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

## rules/knowledge-base/dispute-entry-time.md
- statement — decided: The earliest recording time among its items.
  unstated: The material dates a disputed queue entry by the first of its items met within the fetched page, which depends on where the page cut falls.
  why: The items are met in recording order, so the earliest is what the material yields whenever the whole entry is on the page.

## rules/knowledge-base/dispute-scope.md
- statement — decided: Links of a link type that does not allow multiple current links share a dispute scope by source node and link type, whatever their targets.
  unstated: The material's review queue groups disputed links of a link type that allows a single current link by source node and link type, while its dispute resolution requires the same target node; the two decide differently for two disputed reports_to links from one node to different targets.
  why: A dispute on such a link type arises precisely between links to different targets, so requiring one target leaves every such dispute unresolvable.

## rules/knowledge-base/document-ingestion-extracts-new-content.md
- consistency — decided: eventual
  unstated: The material does not say how this rule holds across the separate records it changes.
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.

## rules/knowledge-base/every-proposal-audited.md
- statement — decided: Every proposal within a run records its tool call, whichever transport carried it.
  unstated: The material has MCP proposals record a tool call on every outcome and REST proposals record none; the two decide differently for a proposal carried over REST.
  why: A run's summary is counted from its tool calls, so a proposal without one would vanish from its run's account.

## rules/knowledge-base/expansion-follows-both-directions.md
- statement — decided: The standing node governs a search's expansion, and a traversal follows the direction it names.
  unstated: The standing node says expansion follows a knowledge link from either end, while the material's traversal follows links only from their source or only from their target when its direction is out or in; the two decide differently for an outgoing traversal from a node that is only a link's target.
  why: The standing node was read from the search's expansion, which names no direction.

## rules/knowledge-base/expansion-skips-deleted-nodes.md
- statement — decided: The standing node governs a search's expansion, and a traversal lists the deleted nodes it reaches.
  unstated: The standing node says expansion never reaches a deleted knowledge node, while the material's traversal lists a deleted node it reaches as a link's end without expanding it; the two decide differently for a traversal whose link ends at a deleted node.
  why: The standing node was read from the search's expansion, and the traversal shows each reached link together with both of its ends.

## rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt.md
- statement — decided: A provenance entry shows the whole excerpt of the raw chunk it cites.
  unstated: The material cuts a provenance entry's excerpt from the chunk's own text starting at the chunk's start offset, which gives a shifted or empty slice for any chunk that does not start at the beginning of its source.
  why: A chunk's excerpt is already the content between its offsets, so offsetting it again cuts away the text the entry exists to show.

## rules/knowledge-base/graph-provenance-hides-compliance-deleted.md
- statement — decided: A graph read shows no provenance entry whose raw information was deleted for compliance.
  unstated: The material reads a graph read's provenance with no filter on whether the fragment's raw information was deleted for compliance, and says nothing about whether such entries may be shown.
  why: A compliance deletion exists to keep a deleted source's knowledge from being presented as still traceable, and a provenance entry presents exactly that trace.

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

## rules/knowledge-base/metrics-disputed-queue-count.md
- statement — decided: The disputed queue count is the number of entries the disputed queue holds.
  unstated: The material counts the disputed queue for the metrics by source, target and link type whatever the link type, while its queue lists one entry per dispute scope; the two differ for a dispute between links to different targets.
  why: The count is named after the queue, and the owner reads it as how many disputes await a decision.

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

## rules/knowledge-base/node-listing-name-prefix.md
- statement — decided: A name prefix is read literally.
  unstated: The material shows a percent sign or an underscore in a node listing's name prefix acting as a wildcard, without saying whether a prefix is read literally.
  why: A name prefix is the start of a name the owner types, and its characters mean themselves.

## rules/knowledge-base/node-read-alias-order.md
- statement — decided: The canonical alias comes first, followed by the other aliases in alphabetical order.
  unstated: The material orders a node's aliases by kind and then by alias without settling which kind comes first, since the order follows how the kinds are declared rather than their spelling.
  why: The canonical alias is the name the node is known by, so it heads the list of its names.

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

## rules/knowledge-base/review-queue-page-windows-entries.md
- statement — decided: The page skips and returns whole entries in listing order.
  unstated: The material applies the page's limit and offset separately to three listings and, for the entity-match queue, to node-candidate rows, so a page can hold more entries than its limit and split one node's candidates across pages.
  why: The owner reads the queue as a list of entries, and a limit that does not bound the entries returned does not page it.

## rules/knowledge-base/review-queue-total-before-pagination.md
- statement — decided: The total counts every entry the listing holds before the page is cut.
  unstated: The material totals the queue as the count of needs-review nodes plus the count of disputed links and of disputed attributes, which is not the number of entries the queue lists when a dispute holds several items.
  why: A total over a paged list counts what the pages hold, as every other listing of this specification does.

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

## rules/knowledge-base/traversal-lists-reached-nodes.md
- statement — decided: A traversal always lists its starting knowledge node.
  unstated: The material leaves a merged starting node whose survivor is missing or deleted out of a traversal's nodes while its starting node identity still names it.
  why: The starting node identity a traversal answers must resolve within the nodes that same answer lists.
