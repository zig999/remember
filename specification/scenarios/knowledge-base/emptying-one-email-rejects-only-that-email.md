---
subject: rules/knowledge-base/entity-edit-removal
given:
- "a person holds two active email attributes"
when:
- "the owner edits the person, setting a remove change that names one of them"
then:
- "that email is marked deleted"
- "the other email stays active"
- "the change is reported with the effect removal"
---

## Description

A remove change reaches only the attribute it names.
