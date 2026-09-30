---
contract_version: siegard-reconcile/8
title: Re-read of the core schema after naming the validity-start basis valid_from_source
summary: The migration did not change; the owner decided on 2026-09-30 that the basis attribute of a knowledge
  link and a node attribute is named valid_from_source, as the schema already names it, and the nodes
  were changed to say so. This reconciliation asks whether each bound node now holds what the DDL carries.
target: database
files:
- path: 0001_init.sql
  change: Unchanged; read again against the nodes that now name the validity-start basis valid_from_source.
nodes:
- node: domain/knowledge-base/compliance-deletion
  conforms: true
  how: "0001_init.sql: held at CREATE TABLE compliance_deletion, lines 518-524 — raw_information_id uuid\
    \ NOT NULL REFERENCES raw_information (id),\n  reason             text NOT NULL,\n  executed_at  \
    \      timestamptz NOT NULL DEFAULT now(),\n  affected           jsonb NOT NULL DEFAULT '{}'::jsonb"
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/knowledge-link
  conforms: true
  how: "0001_init.sql: held at CREATE TABLE knowledge_link, lines 429-451, together with the provenance\
    \ table, lines 468-476, and the assertion_status and valid_from_source enums, lines 134-139. These\
    \ match the nodes domain/knowledge-base/assertion-status and domain/knowledge-base/valid-from-basis.\
    \ The table holds the attributes and relationships. The duplicate guard at lines 454-456 is a separate\
    \ contradiction, reported above. — source_node_id     uuid NOT NULL REFERENCES knowledge_node (id),\n\
    \  target_node_id     uuid NOT NULL REFERENCES knowledge_node (id),\n  link_type_id       uuid NOT\
    \ NULL REFERENCES link_type (id),\n  status             assertion_status NOT NULL,\n  valid_from_source\
    \  valid_from_source,\n  created_by_run_id  uuid REFERENCES llm_run (id),\n  supersedes_link_id uuid\
    \ REFERENCES knowledge_link (id),\n  CONSTRAINT knowledge_link_interval_ck\n    CHECK (valid_from\
    \ IS NULL OR valid_to IS NULL OR valid_from < valid_to)"
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-attribute
  conforms: true
  how: "0001_init.sql: held at CREATE TABLE node_attribute, lines 376-407, together with the provenance\
    \ table, lines 468-476, and the assertion_status, valid_from_source and attribute_value_type enums.\
    \ These match the nodes domain/knowledge-base/assertion-status, domain/knowledge-base/valid-from-basis\
    \ and domain/knowledge-base/value-type. The table holds the attributes and relationships. The duplicate\
    \ guard at lines 411-413 is a separate contradiction, reported above. — node_id                 uuid\
    \ NOT NULL REFERENCES knowledge_node (id),\n  attribute_key_id        uuid NOT NULL,\n  value    \
    \               text NOT NULL,\n  status                  assertion_status NOT NULL,\n  valid_from_source\
    \       valid_from_source,\n  supersedes_attribute_id uuid REFERENCES node_attribute (id),\n  CONSTRAINT\
    \ node_attribute_basis_ck\n    CHECK (valid_from IS NULL OR valid_from_source IS NOT NULL)"
  encoded_at:
  - 0001_init.sql
pairs_omitted:
- node: domain/knowledge-base/alias-kind
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/allowed-value
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/assertion-status
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/attribute-key
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/curation-action
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/effective-status
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/entity-match-review
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/fragment-status
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/information-fragment
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/knowledge-node
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/link-type
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/link-type-rule
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-alias
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-status
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-type
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/provenance
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/raw-chunk
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/raw-information
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/run-status
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/source-type
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/tool-call
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/valid-from-basis
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/validation-outcome
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/value-type
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/allowed-value-unique-per-key
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-confidence-range
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-key-unique-per-node-type
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-never-supersedes-itself
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-provenance-once-per-fragment
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-start-has-basis
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/attribute-validity-ordered
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-offsets-ordered
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/chunk-position-unique
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/effective-status
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/fragment-confidence-range
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/in-effect-assertion
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-confidence-range
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-never-supersedes-itself
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-provenance-once-per-fragment
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-start-has-basis
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-name-unique
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-type-rule-window-ordered
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/link-validity-ordered
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/match-review-distinct-nodes
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/match-review-pair-unique
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/match-review-similarity-range
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/merged-node-names-survivor
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-never-merged-into-itself
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/node-type-name-unique
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/one-canonical-alias
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/run-finish-time-when-closed
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/run-opens-with-one-attempt
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/knowledge-base/run-start-is-opening-time
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 1 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/vfs-rename-migrations.returns/.\nA finding in 0001_init.sql names rules/knowledge-base/one-current-attribute-per-value,\
  \ which no file of this set is bound to: the CREATE UNIQUE INDEX node_attribute_current_dup_guard statement,\
  \ lines 409-413: CREATE UNIQUE INDEX node_attribute_current_dup_guard\n  ON node_attribute (node_id,\
  \ attribute_key_id, value)\n  WHERE valid_to IS NULL AND superseded_at IS NULL; — The rule says a node\
  \ holds at most one current node attribute that is not disputed of one key with one value, so disputed\
  \ assertions are exempt. The index has no status condition. It also counts a disputed row as current.\
  \ A dispute records a disputed assertion beside the current one, so the database can refuse that insert\
  \ with a unique violation when the key and value match. The guard then enforces a stricter rule than\
  \ the one the business decided. Whoever reads the specification would not expect this.. It blocks nothing\
  \ here; it is owed a route of its own.\nA finding in 0001_init.sql names rules/knowledge-base/one-current-link-per-target,\
  \ which no file of this set is bound to: the CREATE UNIQUE INDEX knowledge_link_current_dup_guard statement,\
  \ lines 453-456: CREATE UNIQUE INDEX knowledge_link_current_dup_guard\n  ON knowledge_link (source_node_id,\
  \ target_node_id, link_type_id)\n  WHERE valid_to IS NULL AND superseded_at IS NULL; — The rule says\
  \ a source node holds at most one current knowledge link that is not disputed of one link type to one\
  \ target node, so disputed links are exempt. The index has no status condition. A disputed link to the\
  \ same target, recorded beside the current one, collides with the guard. The guard refuses the dispute\
  \ state the specification provides for, and the file carries a stricter rule than the node states..\
  \ It blocks nothing here; it is owed a route of its own.\nCandidates: 2 opened across 1 of 1 delegation(s);\
  \ each return lists its own under `candidates_opened`."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/vfs-rename-migrations.returns/`, which are the evidence behind every entry above.
