---
entries:
- field: statement
  unstated: The contract holds the MCP wording for malformed arguments, not the extraction loop's.
  decided: The loop hands back VALIDATION_INVALID_FORMAT with "Input failed Zod parse.".
  why: The loop is a different path from MCP, and the contract's log only retired the wording for MCP.
---
