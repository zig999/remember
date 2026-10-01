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
---
