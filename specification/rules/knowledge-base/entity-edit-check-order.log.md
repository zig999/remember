---
entries:
- field: type
  unstated: No node and no material orders the checks of an entity edit as a whole. The intake scope does not cover it, and rules/knowledge-base/entity-edit-change-check-order orders only the checks inside one change. So an edit naming an absent or non-active node that also has a malformed body, an out-of-bounds reason or a refused change could answer RESOURCE_NOT_FOUND, BUSINESS_NODE_NOT_ACTIVE, VALIDATION_INVALID_FORMAT or a change's own code. An edit whose changes fail different checks could also be refused for any of them.
  decided: invariant
  why: A malformed request is wrong whatever node it names, and the format refusal reports all its issues in one answer, while every later check reads first the edited node and then one change. So the node is checked between the form and the changes, and the changes are taken in the order given, which is the only order the edit carries.
---
