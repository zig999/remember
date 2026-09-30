---
type: invariant
statement: 'The catalog permits, each with no validity window, exactly these pairs of source and target node types: participates_in from Person to Project or Event; member_of from Person to Organization; holds_role from Person to Role; responsible_for from Person to Project, Event or Task; reports_to from Person to Person; part_of from Organization to Organization, from Project to Project, from Event to Project and from Task to Project; located_in from Organization or Event to Location; organizes from Organization or Person to Event; belongs_to_category from Person, Organization, Project, Event, Concept or Location to Category; related_to from Concept or Project to Concept; concerns from Document to Project, Event or Organization and from Event to Project; delivered_to from Document to Person; and sponsors from Organization to Project.'
constrains:
- domain/knowledge-base/link-type
- domain/knowledge-base/link-type-rule
---

## Description

None.
