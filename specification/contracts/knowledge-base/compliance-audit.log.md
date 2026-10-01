---
entries:
- field: answers
  unstated: The contract did not say how a validation failure lists its fields or the MCP tool name.
  decided: Validation answers carry details { issues }, and the MCP operation is the compliance_delete tool of the curation toolset.
  why: The REST handler and the MCP tool both wrap the list under issues, and the tool registers in the curation toolset.
---
