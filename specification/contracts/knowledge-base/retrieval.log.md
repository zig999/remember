---
entries:
- field: answers
  unstated: The material has the REST node-type listing ignore unknown parameters while the MCP one refuses them, so the two transports answer the same request with a success and a refusal.
  decided: The node-type listing refuses an unknown parameter on both transports, like every other graph read.
  why: Every other catalog and graph read refuses an unknown parameter, and the transports answer each shared operation alike.
- field: answers
  unstated: The material for the catalog listings, the node listing and the graph reads does not show how they authenticate their caller.
  decided: Each of these operations refuses an unauthenticated caller with the same answer as the other retrieval operations.
  why: They are served on the same owner-only surface as search, including the one query tool endpoint they share with it.
- field: answers
  unstated: The material says a listing of accepted fragments naming an unknown query parameter is refused by strict validation, and does not say what the surface answers.
  decided: 'The refusal answers as every other malformed parameter of the surface does: HTTP 422, error code VALIDATION_INVALID_FORMAT, listing each failing field with its path and message.'
  why: The surface answers a strict-validation refusal one way, and nothing in the material gives this one a different answer.
- field: answers
  unstated: A judgment shows search and the accepted-fragment listing refusing a blank or long query, a depth or a page bound with VALIDATION_INVALID_FORMAT, and six reads accepting an undefined parameter over REST.
  decided: Those refusals answer VALIDATION_INVALID_FORMAT, and the six reads refuse an undefined parameter over MCP only.
  why: The owner decided the source's behavior is the truth, and the global handler maps every schema failure to that code.
- field: answers
  unstated: The search operation listed no refusal for an undefined parameter.
  decided: It adds HTTP 422 with VALIDATION_INVALID_FORMAT for an undefined parameter.
  why: The search schema is strict and serves both transports.
---
