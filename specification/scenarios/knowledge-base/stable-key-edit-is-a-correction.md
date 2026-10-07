---
subject: rules/knowledge-base/entity-edit-correction
given:
- "an organization holds an active cnpj attribute with no validity"
when:
- "the owner edits the organization, setting a set change that names that attribute with another cnpj"
then:
- "the earlier attribute is superseded and keeps no validity end"
- "a new active attribute holds the other cnpj and names the earlier one as the one it supersedes"
- "the change is reported with the effect correction"
---

## Description

A key that is not temporal changes by correction, never by pretending the world changed.
