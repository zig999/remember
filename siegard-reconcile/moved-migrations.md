---
contract_version: siegard-reconcile/8
title: Re-read of three migrations stamped against earlier node text
summary: The migrations did not change; the nodes bound to them moved in the specification since they
  were stamped, or were restamped on sibling files by a later bind. The owner states the schema is correct;
  this reconciliation asks whether each bound node still holds what the DDL carries as the node now reads.
target: database
files:
- path: 0001_init.sql
  change: Unchanged; declares the core schema as when bound, read again against the current text of the
    nodes bound to it.
- path: 0004_chat_persistence.sql
  change: Unchanged; declares the chat persistence tables as when bound, read again against the current
    text of the nodes bound to it.
- path: 0005_chat_graph_view.sql
  change: Unchanged; declares the chat graph-view snapshot table as when bound, read again against the
    current text of the nodes bound to it.
nodes:
- node: domain/chat/graph-view
  conforms: true
  how: "0005_chat_graph_view.sql: held at the CREATE TABLE chat_graph_view statement, lines 6-11. It declares\
    \ the shape's two required attributes as columns, `snapshot` and `updated_at`. `conversation_id`,\
    \ the primary key, is the 0..1 composition with the conversation aggregate. The optional `layout_algorithm`\
    \ has no column of its own. It is carried inside the `snapshot` jsonb, in the version-2 snapshot that\
    \ contracts/chat/conversations.md describes. — CREATE TABLE chat_graph_view (\n  conversation_id uuid\
    \        PRIMARY KEY\n                              REFERENCES chat_conversation(id) ON DELETE CASCADE,\n\
    \  snapshot        jsonb       NOT NULL,\n  updated_at      timestamptz NOT NULL DEFAULT now()\n);"
  encoded_at:
  - 0005_chat_graph_view.sql
- node: domain/chat/message
  conforms: true
  how: "0004_chat_persistence.sql: held at CREATE TABLE chat_message (lines 95-109), with the enum chat_message_role\
    \ (line 33) declaring the role values. — CREATE TYPE chat_message_role AS ENUM ('user', 'assistant');\n\
    CREATE TABLE chat_message (\n  id              uuid               PRIMARY KEY DEFAULT gen_random_uuid(),\n\
    \  conversation_id uuid               NOT NULL REFERENCES chat_conversation(id) ON DELETE CASCADE,\n\
    \  role            chat_message_role  NOT NULL,\n  content         jsonb              NOT NULL,\n\
    \  stop_reason     text               NULL,\n  idempotency_key uuid               NULL,\n  model \
    \          text               NULL,\n  tokens_in       int                NULL,\n  tokens_out    \
    \  int                NULL,\n  latency_ms      int                NULL,\n  created_at      timestamptz\
    \        NOT NULL DEFAULT now()\n);"
  encoded_at:
  - 0004_chat_persistence.sql
- node: domain/knowledge-base/attribute-key
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE attribute_key, lines 189-201, and CREATE TABLE attribute_valid_value,
    lines 210-219 — key                     text NOT NULL, value_type              attribute_value_type
    NOT NULL, is_temporal, allows_multiple_current, requires_valid_from, description, version ... and
    attribute_valid_value (attribute_key_id, value, label, sort_order, description, version)'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/compliance-deletion
  conforms: false
  how: '0001_init.sql, compliance_deletion.affected, line 523: affected           jsonb NOT NULL DEFAULT
    ''{}''::jsonb  -- contagens por entidade afetada — The node requires affected to hold four required
    counts: chunks, fragments, links and attributes. The column declares no such shape, and its default
    is an empty object, which a row can carry and which holds none of the four. The deletion audit trail
    can then record a compliance deletion whose reach is unstated. Nothing in this file says the counts
    are required.'
  observed_at:
  - 0001_init.sql
- node: domain/knowledge-base/curation-action
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE curation_action, lines 505-513 — action      text NOT NULL,
    target_kind text NOT NULL, target_id   uuid, payload     jsonb NOT NULL DEFAULT ''{}''::jsonb, reason      text,
    created_at  timestamptz NOT NULL DEFAULT now()'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/knowledge-link
  conforms: false
  how: '0001_init.sql, knowledge_link column at line 440, and the enum declared at line 139: valid_from_source  valid_from_source,
    — The node names this attribute valid_from_basis, typed by the valid-from-basis enumeration. The table
    declares it as valid_from_source. A reader following the node to this file finds no such column, and
    a change to the node''s name never reaches the DDL.'
  observed_at:
  - 0001_init.sql
- node: domain/knowledge-base/link-type
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE link_type, lines 159-170, and CREATE TABLE link_type_rule,
    lines 173-182 — name text NOT NULL UNIQUE, label, description, inverse_name, is_temporal, allows_multiple_current,
    requires_valid_from, requires_valid_to_on_change, version int NOT NULL DEFAULT 1'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-alias
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE node_alias, lines 352-361, and the enum alias_kind at line
    137 — alias text NOT NULL CHECK (btrim(alias) <> ''''), kind alias_kind NOT NULL DEFAULT ''alias'',
    created_by_run_id uuid REFERENCES llm_run (id), created_at timestamptz NOT NULL DEFAULT now()'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-attribute
  conforms: false
  how: '0001_init.sql, node_attribute column at line 392, and the enum declared at line 139: CREATE TYPE
    valid_from_source AS ENUM (''stated'', ''document'', ''received''); -- §6.5/A14 ... valid_from_source       valid_from_source,
    — The node names this attribute valid_from_basis, typed by the valid-from-basis enumeration. The table
    declares the same attribute as valid_from_source with an enum of that name. A reader who follows the
    node to this file finds no valid_from_basis column, and a rename in the node never reaches the DDL.
    The migration and the specification now name one fact two ways, and nothing says which name was decided.'
  observed_at:
  - 0001_init.sql
- node: domain/knowledge-base/node-type
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE node_type, lines 152-157 — name        text NOT NULL UNIQUE,
    description text NOT NULL, version     int  NOT NULL DEFAULT 1'
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
- node: domain/knowledge-base/link-type-rule
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/llm-run
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/knowledge-base/node-status
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
- node: domain/chat/message-role
  file: 0004_chat_persistence.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: domain/chat/tool-call
  file: 0004_chat_persistence.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/message-idempotency-key-unique
  file: 0004_chat_persistence.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
- node: rules/chat/tool-call-outlives-its-message
  file: 0004_chat_persistence.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: "Judged by 3 delegation(s), one per file; folded mechanically by trace.py --fold from the returns\
  \ under siegard-reconcile/moved-migrations.returns/.\nA finding in 0001_init.sql names rules/knowledge-base/one-current-attribute-per-value,\
  \ which no file of this set is bound to: node_attribute_current_dup_guard, lines 411-413: CREATE UNIQUE\
  \ INDEX node_attribute_current_dup_guard\n  ON node_attribute (node_id, attribute_key_id, value)\n \
  \ WHERE valid_to IS NULL AND superseded_at IS NULL; — The rule allows at most one current attribute\
  \ that is not disputed per node, key and value, so a dispute may hold a second current assertion beside\
  \ the one it disputes. This index has no status predicate, so it rejects that second assertion at the\
  \ database. Curation then refuses a dispute resolution with the duplicate-guard error that contracts/knowledge-base/curation\
  \ names. The DDL enforces a stricter rule than the one the business decided.. It blocks nothing here;\
  \ it is owed a route of its own.\nA finding in 0001_init.sql names rules/knowledge-base/one-current-link-per-target,\
  \ which no file of this set is bound to: knowledge_link_current_dup_guard, lines 454-456: CREATE UNIQUE\
  \ INDEX knowledge_link_current_dup_guard\n  ON knowledge_link (source_node_id, target_node_id, link_type_id)\n\
  \  WHERE valid_to IS NULL AND superseded_at IS NULL; — The rule allows at most one current link that\
  \ is not disputed per source, target and link type, so a dispute may hold a second current link beside\
  \ the disputed one. This index has no status predicate, so it rejects that second link at the database.\
  \ The DDL enforces a stricter rule than the one the business decided.. It blocks nothing here; it is\
  \ owed a route of its own.\nCandidates: 13 opened across 1 of 3 delegation(s); each return lists its\
  \ own under `candidates_opened`."
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/moved-migrations.returns/`, which are the evidence behind every entry above.
