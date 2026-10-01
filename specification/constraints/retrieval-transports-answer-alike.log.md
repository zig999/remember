---
entries:
- field: statement
  unstated: The standing node had MCP answer in the REST envelope, while the documentation has MCP answer in its own content and error framing with the same payload and the same error codes; the two decide differently for the shape of an MCP success.
  decided: The two transports carry the same result and the same error code, and the constraint no longer fixes the framing.
  why: The documentation states repeatedly that the envelope is REST-only and that only the payload and the codes must match.
- field: statement
  unstated: A judgment shows REST not refusing an undefined parameter on six retrieval reads that MCP refuses.
  decided: The transports answer alike, the six reads' undefined parameter excepted, which only MCP refuses.
  why: The owner decided the source's behavior is the truth, and REST does not parse a query for those six reads.
---
