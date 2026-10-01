---
contract_version: siegard-reconcile/8
title: Reconciliation of raw-chunk and raw-information after the owner's code-as-truth analysis, database
  target
summary: 'The source did not change; the specification moved: the owner states the code is the truth and
  the analysis changed domain/knowledge-base/raw-chunk (locator is a chunk-locator) and domain/knowledge-base/raw-information
  (metadata is a free-form set of named values). This reconciliation reads the two migrations bound to
  the two nodes against them.'
target: database
files:
- path: 0001_init.sql
  change: Unchanged; creates the raw_information and raw_chunk tables, the locator and metadata as jsonb
    columns among them.
- path: 0006_original_input.sql
  change: Unchanged; adds the nullable original_input column to raw_information.
nodes:
- node: domain/knowledge-base/raw-chunk
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE raw_chunk (lines 243-258) and its partial GIN index raw_chunk_fts_idx
    (lines 262-263) — chunk_index        int  NOT NULL CHECK (chunk_index >= 0), "text"             text
    NOT NULL, offset_start       int  NOT NULL CHECK (offset_start >= 0), offset_end         int  NOT
    NULL, locator            jsonb, chunking_version   text NOT NULL DEFAULT ''v1'', status             node_status
    NOT NULL DEFAULT ''active'', superseded_at      timestamptz,'
  encoded_at:
  - 0001_init.sql
- node: domain/knowledge-base/raw-information
  conforms: true
  how: "0001_init.sql: held at CREATE TABLE raw_information (lines 229-240). The node's `title` and `document_date`\
    \ have no column of their own; they sit inside the free-form `metadata` jsonb, and `original_input`\
    \ is added by 0006_original_input.sql, outside this file set. — source_type   source_type NOT NULL,\
    \ content       text NOT NULL, storage_ref   text, content_hash  text NOT NULL UNIQUE\n  CHECK (content_hash\
    \ ~ '^[0-9a-f]{64}$'),\nreceived_at   timestamptz NOT NULL DEFAULT now(), metadata      jsonb NOT\
    \ NULL DEFAULT '{}'::jsonb, status        node_status NOT NULL DEFAULT 'active', superseded_at timestamptz\n\
    0006_original_input.sql: held at Line 16, the ALTER TABLE statement that adds the original_input column\
    \ to raw_information. — ALTER TABLE raw_information ADD COLUMN original_input text; The node declares\
    \ original_input as an optional string, with no `required: true`. The column is a nullable text with\
    \ no default and no NOT NULL, so it matches. This file adds only that attribute. The other attributes\
    \ are declared in 0001_init.sql, which is outside this file set."
  encoded_at:
  - 0001_init.sql
  - 0006_original_input.sql
restates:
- file: 0001_init.sql
  where: Comment above CREATE TABLE raw_chunk, line 242
  evidence: '"-- Offsets: 0-based, semiaberto [start, end), em CODE POINTS Unicode (§9.2/A22)."'
  cost: The unit and interval convention of chunk offsets is restated as prose in the DDL. The DDL itself
    checks only `CHECK (offset_start >= 0)` and `CHECK (offset_end > offset_start)`. The counting in code
    points is held by backend/src/modules/ingestion/chunker/v1.ts (`const codePoints = Array.from(content);`).
    Someone changing the rule may edit the comment, which constrains nothing, and believe the rule moved.
  node: rules/knowledge-base/chunk-offsets-count-code-points
- file: 0001_init.sql
  where: Comment above CREATE TABLE raw_information, lines 226-228
  evidence: '"compliance_delete (§11), que redige `content` preservando `content_hash`"'
  cost: The redaction of a deleted raw information's content is described in prose in the migration. Running
    code holds it in compliance-audit.repository.ts (`SET content        = '[REDACTED]'`). The migration
    is not where that rule lives, but a reader looking at the DDL will take it as the place.
  node: rules/knowledge-base/compliance-deletion-redacts-content
- file: 0001_init.sql
  where: Header comment, lines 58-60 (INVARIANTES DE APLICAÇÃO), and the comment above CREATE TABLE raw_information,
    lines 226-228
  evidence: '"reject_item / compliance_delete devem gravar superseded_at = now() ao marcar status = ''deleted''
    — caso contrário a linha continuaria presa na guarda de duplicata parcial e em is_current (§5.4, §6.4)."
    and "grava status = ''deleted'' + superseded_at = now() (BR-04/BR-05; decisão 8)."'
  cost: The tombstone rule is stated in prose inside the migration as well as in the node. Running code
    holds it in backend/src/modules/compliance-audit/repository/compliance-audit.repository.ts (`superseded_at  =
    now()` on the raw_information update). The node can move, for example by changing which chunks are
    marked, and this comment will not follow. The next reader then finds two statements of the rule and
    cannot tell which one was decided.
  node: rules/knowledge-base/compliance-deletion-tombstones
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
- node: domain/knowledge-base/compliance-deletion
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: domain/knowledge-base/knowledge-link
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
- node: domain/knowledge-base/node-attribute
  file: 0001_init.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair — the corpus answers it both ways, and a clearance closes a finding here
    as it does in `--owed`
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
notes: 'Judged by 2 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-raw-chunk-info-database.returns/.

  Candidates: 4 opened across 2 of 2 delegation(s); each return lists its own under `candidates_opened`.

  Restates: 3 place(s) where text in the source restates a node''s fact the code holds, over 1 file(s),
  listed under `restates`. The pair conforms, so none blocks a binding — the route is removing the text,
  and reconciling the file after.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-raw-chunk-info-database.returns/`, which are the evidence behind every entry above.
