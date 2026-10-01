---
entries:
- field: operations
  unstated: The material gives the authentication refusals, the framework's routing and validation answers and the health probe without saying which contract holds these answers, since they come before or apart from any operation.
  decided: One published api, knowledge-base access, with authenticate-owner, route-request and read-health.
  why: They are what a caller of every operation reads, and they belong to no single operation's contract.
- field: answers
  unstated: The material answers SYSTEM_SERVICE_UNAVAILABLE with "A backing service is temporarily unavailable." for an unreachable store and with "Internal server error." for a framework 503.
  decided: Every SYSTEM_SERVICE_UNAVAILABLE answers "A backing service is temporarily unavailable."
  why: One code carries one message, and a 503 is never an internal failure.
- field: answers
  unstated: The material answers a failed validation with `details` a list of `{ path, message }` and a fixed message for one validator, and with the framework's raw validation array and its own message for the other.
  decided: Every validation failure answers "Request payload failed validation." with `details` a bare list of `{ path, message }`.
  why: The operations' contracts already promise that shape, and a caller cannot tell which validator ran.
- field: answers
  unstated: The material answers a failure to fetch the auth provider's key set as an invalid token, while an unreachable store answers that a backing service is unavailable.
  decided: A key set that cannot be fetched answers HTTP 503 SYSTEM_SERVICE_UNAVAILABLE.
  why: The owner's token was not found invalid, and reporting it so hides an outage behind a refusal.
- field: answers
  unstated: The material answers a framework refusal with a status below 500 other than 401, 403, 404, 409 and 422 with that status and SYSTEM_INTERNAL_ERROR, which the code registry otherwise maps to 500.
  decided: Such a refusal keeps its status, with SYSTEM_INTERNAL_ERROR and the framework's message.
  why: The status tells the caller the request was theirs to fix, and no domain code names those framework refusals.
- field: answers
  unstated: A judgment shows a key set that cannot be fetched answered as an invalid token, and a framework 503 carrying the message Internal server error.
  decided: A key set that cannot be fetched answers AUTH_TOKEN_INVALID, and a framework 503 answers that message.
  why: The owner decided the source's behavior is the truth, and it answers those two that way.
---
