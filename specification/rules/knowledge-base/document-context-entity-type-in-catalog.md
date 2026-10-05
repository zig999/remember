---
type: invariant
statement: A preliminary reading that lists an entity under a node type the catalog does not hold yields a document context without that entity.
constrains:
- domain/knowledge-base/document-context
---

## Description

This rule covers which entities from a preliminary reading's entity list the extraction keeps in the document context. It does not decide which document context status the run records. rules/knowledge-base/document-context-status-recorded decides that.
