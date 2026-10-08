---
entries:
- field: statement
  unstated: The material asks for a raw information of manual origin without saying which source type holds it.
  decided: Source type other, with the metadata recording an operator note and the edited node.
  why: Source type is a closed set stored as an enumeration, and a directed ingestion already marks its origin in metadata instead of widening it.
- field: statement
  unstated: The rule says the metadata records that the raw information is an operator note and the edited node's identity, but no node and no material names the metadata keys or the value that marks an operator note.
  decided: The key operator_note set to true marks the operator note, and the key node_id holds the edited knowledge node's identity.
  why: The one metadata mark the specification already names, compliance_deleted set to true, is a snake_case key set to true, and the edit operation already carries the edited node's identity as node_id in its path and its answer.
---
