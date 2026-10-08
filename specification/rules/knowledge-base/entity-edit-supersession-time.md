---
type: policy
statement: "An entity edit gives the attribute it supersedes the moment of the supersession as its supersession time, and leaves its supersession time unset only when the edit itself gives that attribute a validity end."
constrains:
- domain/knowledge-base/attribute-change
- domain/knowledge-base/node-attribute
consistency: eventual
---

## Description

It governs the supersession time of the attribute that an entity edit's correction or succession supersedes. Whether that attribute is given a validity end, and which one, is entity-edit-succession-closes-the-previous's. The supersession time of an attribute that a remove change rejects is entity-edit-removal's.
