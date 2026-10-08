---
title: Record the provenance of attributes and links once per fragment
summary: A correction of the way the knowledge base records the provenance of an attribute or a link, observed when an entity edit that records a new attribute answered HTTP 500.
rationale: 'A corrective increment named by the person: the wrong behavior was observed in the running system and answers to no criterion of the epics already delivered.'
sources:
- intake/scope.md
covers:
- rules/knowledge-base/attribute-provenance-once-per-fragment
- rules/knowledge-base/link-provenance-once-per-fragment
- rules/knowledge-base/entity-edit-provenance
- rules/knowledge-base/corrected-item-provenance
- domain/knowledge-base/provenance
- domain/knowledge-base/node-attribute
- domain/knowledge-base/knowledge-link
- domain/knowledge-base/entity-edit
- domain/knowledge-base/information-fragment
- domain/knowledge-base/assertion-correction
---
## What it is
The recording of the provenance of an attribute or a link, the part of the knowledge base that holds a fragment once per item.

## Notes
The epic exists apart from the delivered entity-edit-backend epic so that the correction claims exactly what it answers to and re-opens no delivered task.
