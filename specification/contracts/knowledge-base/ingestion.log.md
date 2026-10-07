---
entries:
- field: answers
  unstated: The material has re-ingesting held content under another model or prompt version look for a run by the new idempotency key and fail with an internal error when none exists.
  decided: Held content answers HTTP 200 with outcome noop_existing and the run the held raw information already has, whatever model or prompt version the request names.
  why: Intake is idempotent by content hash, and a request that records nothing has nothing to fail on.
- field: answers
  unstated: The material has a REST proposal refused by validation answer HTTP 200 carrying the refusal, while the shared error registry maps the same codes to 4xx statuses.
  decided: 'A validation refusal of a REST proposal answers HTTP 200 carrying `{ ok: false, error }` with the refusal''s code.'
  why: A validation refusal of a proposal is a result its run records, not a failure of the request that carried it.
- field: answers
  unstated: The material has the MCP proposals accept any non-empty text as the LLM run's identity while REST and the MCP run read demand a UUID; the two decide differently for a malformed run identity over MCP.
  decided: A malformed LLM run identity is refused with VALIDATION_INVALID_FORMAT on both transports.
  why: An LLM run's identity is a UUID everywhere else the material names one.
- field: answers
  unstated: The earlier decision had held content sent under another model or prompt version answer HTTP 200 noop_existing with the run it already has, while the code looks the run up by the request's own key and fails with an internal error when none exists.
  decided: Held content sent under a model or prompt version for which no run was opened answers HTTP 500 with SYSTEM_INTERNAL_ERROR, and records nothing.
  why: The owner holds the code as the truth over the earlier decision, which had named this behavior as the one to correct.
- field: answers
  unstated: The material does not say what ingest-document answers when persisting the document fails for a cause other than an unreachable store, or when the extraction fails for a cause no other refusal names.
  decided: Persisting failure answers SYSTEM_INTERNAL_ERROR with the message "Failed to persist the document before extraction." and no run; any other extraction failure answers SYSTEM_INTERNAL_ERROR with the message "Unexpected error during document ingestion." and the run's and the raw information's identities.
  why: The owner holds the code as the truth, and the code answers exactly these two on those conditions.
- field: answers
  unstated: The material does not say what ingest-document tells a caller whose content is already held beyond the identities, the chunk count and the run's status.
  decided: The already_ingested answer also carries a message, one wording for a completed run and one naming the status for any other, and a status of null where the run's status cannot be read.
  why: The owner holds the code as the truth, and callers act on that message to recover a run that did not finish.
- field: answers
  unstated: The material does not say what message ingest-directed answers when its arguments fail validation, while other contracts fix "Request payload failed validation." for the same code.
  decided: Every validation refusal of ingest-directed answers the message "ingest_directed arguments failed validation." with the failing fields.
  why: The owner holds the code as the truth, and the directed tool's handler answers exactly that message on a failed parse.
- field: answers
  unstated: The material does not say what ingest-directed answers when persisting its payload fails, finds its content already held, produces no chunk or fails for any other cause.
  decided: Each of these answers SYSTEM_INTERNAL_ERROR with its own fixed message and no cause, and an unreachable store answers SYSTEM_SERVICE_UNAVAILABLE.
  why: The owner holds the code as the truth, and the directed service and handler answer exactly these on those conditions.
- field: answers
  unstated: The material does not say what a directed ingestion reports for a node whose pinned identity names no node or an inactive one.
  decided: The node is reported rejected, with RESOURCE_NOT_FOUND for an absent node and VALIDATION_INVALID_FORMAT for an inactive one, each with its message and details.
  why: The owner holds the code as the truth, and the pin check reports exactly these inside an accepted ingestion.
- field: answers
  unstated: The material does not say what message a proposal refused for its shape answers over MCP.
  decided: Over MCP the message is "Input failed Zod parse." for all four proposals, while REST answers HTTP 422.
  why: The owner holds the code as the truth, and the four MCP proposal handlers answer exactly that message.
- field: answers
  unstated: The material does not say what a proposal answers when it fails for a cause no other refusal names.
  decided: It answers SYSTEM_INTERNAL_ERROR with no details, HTTP 500 and "Internal server error." over REST, and "Internal error in MCP handler." over MCP.
  why: The owner holds the code as the truth, and the shared handler and the global error handler answer exactly these.
- field: answers
  unstated: The material does not say what a link or attribute proposal answers when it meets a concurrently committed current assertion a second time.
  decided: It answers SYSTEM_INTERNAL_ERROR with a fixed message and the scope knowledge_link or node_attribute, HTTP 200 carrying the refusal over REST.
  why: The owner holds the code as the truth, and the consolidation answers exactly this after its second attempt.
- field: answers
  unstated: A fixed message that never names the cause is required of an unexpected failure, while the second-collision refusal's message names a concurrent commit.
  decided: A second collision is a named cause and not an unexpected one, so its message names it.
  why: The owner holds the code as the truth, and the consolidation refuses on a cause it recognises by name.
- field: answers
  unstated: The unreachable store answers unavailable and never an internal failure, while the shared proposal handler answers an internal failure for any cause it does not recognise.
  decided: The proposal's internal failure answer is stated for a cause other than an unreachable store.
  why: Stating it for an unreachable store would contradict a constraint no finding asked to change.
- field: answers
  unstated: A judgment of the source shows a proposal refused for its shape over MCP with the message "MCP tool args failed Zod parse." and not the "Input failed Zod parse." the contract held.
  decided: Over MCP the message is "MCP tool args failed Zod parse." for the four proposals.
  why: The owner decided the source's behavior is the truth, and callers read the message the source sends.
- field: answers
  unstated: The contract gave no message for ingest-document validation, no fallback when affected nodes or the run close fail, and no link reference form.
  decided: It adds the ingest-document message, the empty list, the completed report and the reference form.
  why: The code returns the run completed and the list empty on those failures and builds the reference as stated.
- field: answers
  unstated: The material did not state the message and the detail names of the propose-attribute refusal for a value outside the allowed values.
  decided: The message attribute value not in closed domain, with details value and allowed_values.
  why: The structural layer raises that message and those details, and the contract already states messages verbatim for other refusals.
- field: answers
  unstated: The material has propose_node list each alias it did not record and why, without naming the reason, and keeps the document context for audit without saying which answers show it.
  decided: A refused alias is answered with the reason ALIAS_NOT_IN_SOURCE; read-llm-run and run-extraction show the run's document context status and document context when it holds them.
  why: A below-floor link is already answered with a reason code, and the run reads are where an auditor looks at what the model was given.
- field: answers
  unstated: The material lets an extraction go on when its preliminary reading fails, while run-extraction and ingest-document answered a failed run whenever the language model provider failed; a provider error during the preliminary reading was decided both ways.
  decided: The provider-failure refusal of run-extraction and ingest-document applies only when the provider fails while a chunk is read.
  why: The material states that a failed preliminary reading never fails the extraction, so that failure cannot also answer a failed run.
- field: answers
  unstated: No node said in what order ingest-directed's accepted answer carries its summary, its completed run and its report. The contract only listed them, in the order run, report, summary.
  found: '/home/siegfriedneto/projects/eternal/siegard-work/ingest-consolidation-fixes/intake/scope.md, item (3): "the result envelope: the order is run, report, summary, and the chat truncates tool results at 8000 characters so the summary is lost. Expected: summary first."'
- field: answers
  unstated: The propose-link and propose-attribute answers list consolidated among the outcomes and carry the link's or the attribute's identity, but no node says that a proposal taken as a re-affirmation answers consolidated, or which assertion's identity that answer carries when no new assertion is recorded.
  decided: A link or attribute proposal taken as a re-affirmation answers outcome consolidated carrying the identity of the current link or attribute it re-affirms, whatever its change hint.
  why: A re-affirmation records no new assertion and only adds provenance to the one it meets, so the re-affirmed assertion is the only one whose identity the answer can carry.
---
