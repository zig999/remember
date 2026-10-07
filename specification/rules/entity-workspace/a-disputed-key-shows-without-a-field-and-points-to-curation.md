---
type: invariant
statement: "A key holding an attribute whose status, as the knowledge base's node read returns it, is disputed MUST show its values without a field and point the owner to the curation workspace, whether or not that attribute is current or in effect."
constrains:
- domain/entity-workspace/entity-edit-session
---

## Description

What makes a key of the entity form a disputed key: the status of one of its attributes, and not that attribute's effective status, its flags, or whether it is current or in effect. An attribute whose status is superseded or deleted is not disputed and never makes its key disputed. This rule does not decide whether the knowledge base accepts a change to a disputed attribute. rules/knowledge-base/entity-edit-leaves-disputes-to-curation decides that.
