---
type: invariant
statement: "An edit effect MUST cross the wire with each hyphen of its enumeration value written as an underscore."
constrains:
- domain/knowledge-base/edit-effect
---

## Description

How the effect of each applied change is spelled in the answer to an entity edit, so first-value is written first_value. This rule does not decide which effect a change records. The rules that record each change decide that, and the contract contracts/knowledge-base/entity-editing decides the shape of the answer.
