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
---
