---
type: api
direction: consumed
upstream: contracts/knowledge-base/ingestion
operations:
- send-ingestion-request
- ingest-raw-information
- run-extraction
- retry-llm-run
- read-llm-run
answers:
- operation: send-ingestion-request
  accepted: "the 2xx JSON body of the answer is the answer itself and is never unwrapped from { ok, result }, and a 204 answer gives no value"
  refusals:
  - rule: "rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds"
    answer: "a failure SYSTEM_TIMEOUT reading \"Tempo limite excedido na requisição.\""
  - when: "The request is aborted by a signal of its caller."
    answer: "a failure SYSTEM_ABORTED reading \"Requisição cancelada.\""
  - when: "The request gets no answer for any other cause."
    answer: "a failure SYSTEM_NETWORK reading \"Falha de rede ao contactar o servidor.\""
  - rule: "rules/ingest-workspace/unrefreshable-session-ends-at-sign-in"
    answer: "HTTP 401 with the failure AUTH_SESSION_EXPIRED reading \"Sua sessão expirou. Faça login novamente.\""
  - when: "The answer is 2xx and its body is not JSON."
    answer: "that status with the failure SYSTEM_INVALID_RESPONSE reading \"Resposta do servidor não é JSON válido.\""
  - when: "The answer is not 2xx and its body carries an error object with a string code."
    answer: "that status with the code, the details and, when it is a string, the message of the error object, otherwise a message for the status"
  - when: "The answer has status 500 or above and its body carries no readable error code."
    answer: "that status with the failure SYSTEM_UPSTREAM reading \"Algo deu errado. Tente novamente.\""
  - when: "The answer is not 2xx, is below status 500 and its body carries no readable error code."
    answer: "that status with the failure SYSTEM_UNKNOWN reading \"Erro desconhecido do servidor.\""
- operation: ingest-raw-information
  accepted: "POST /api/v1/ingest/raw-information with the JSON body of source_type, content, model, prompt_version and an optional metadata sent as given and checked by nothing in the client, whose answer is read as outcome, raw_information_id, content_hash, chunk_count, chunks, llm_run_id, idempotency_key and an optional list of affected nodes, each with id, node_type and canonical_name"
- operation: run-extraction
  accepted: "POST /api/v1/ingest/llm-runs/{llm_run_id}/run with the JSON body {}, whose answer is read as an LLM run"
- operation: retry-llm-run
  accepted: "POST /api/v1/ingest/llm-runs/{llm_run_id}/retry with the JSON body { reason } when a reason is given and {} otherwise, with no bound on the reason, whose answer is read as an LLM run and starts no extraction"
- operation: read-llm-run
  accepted: "GET /api/v1/ingest/llm-runs/{llm_run_id}, whose answer is read as an LLM run with its identity, model, prompt version, status, started_at, finished_at, attempts, raw information identity, idempotency key, run summary of nine counts and an optional list of affected nodes, the status passed on as received"
  refusals:
  - when: The started_at or a non-null finished_at of the answer cannot be parsed as a date.
    answer: 'a failure with no code reading "Invalid ISO date string: <value>"'
---

## Description

The requests the ingest screen makes to the back end and how it reads the answers.
The upstream publishes what each answer carries, and this contract states only how the screen sends and reads it.
