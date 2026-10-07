---
entries:
- field: statement
  unstated: No node and no material says which property of the attribute the node read returns makes the entity form treat its key as disputed. The read returns status, effective status, flags, and whether the attribute is current and in effect. Nothing says whether a superseded or not-current attribute still makes its key disputed either.
  decided: An attribute makes its key disputed exactly when its status is disputed, whether or not it is current or in effect. Its effective status and flags are not consulted, and an attribute whose status is superseded or deleted never makes its key disputed.
  why: The knowledge base refuses to change any attribute whose status is disputed (rules/knowledge-base/entity-edit-leaves-disputes-to-curation), so testing the same property makes the form withhold a field exactly where a save would be refused. The effective status equals the status for a disputed attribute (rules/knowledge-base/effective-status). Disputed is a status of a held attribute, which is neither superseded nor deleted (domain/knowledge-base/live-assertion-status).
---
