---
contract_version: siegard-reconcile/8
title: Reconciliation after the raw-chunk attribute rename, database target
summary: 'The source did not change; the specification moved: the owner states the code is the truth and
  the analysis renamed the raw-chunk attributes to text, offset_start and offset_end and followed the
  rename in chunk-offsets-ordered. This reconciliation reads the two migrations bound to the moved nodes
  against them.'
target: database
files:
- path: 0001_init.sql
  change: Unchanged; creates the raw_information and raw_chunk tables with the offset_start, offset_end
    and text columns.
- path: 0006_original_input.sql
  change: Unchanged; adds the nullable original_input column to raw_information.
nodes:
- node: domain/knowledge-base/raw-chunk
  conforms: false
  how: '0001_init.sql, CREATE TABLE raw_chunk, lines 248-249, the offset_start and offset_end column definitions:
    offset_start       int  NOT NULL CHECK (offset_start >= 0), offset_end         int  NOT NULL, — The
    node declares offset_start and offset_end without required: true, so a chunk may carry no offsets.
    The schema forbids that. A reader who trusts the node will build a producer or reader that expects
    absent offsets and will be refused by the database. A reader who trusts the DDL will not see that
    the node leaves the two optional. Which of the two was decided is not recoverable from either place.'
  observed_at:
  - 0001_init.sql
- node: rules/knowledge-base/chunk-offsets-ordered
  conforms: true
  how: '0001_init.sql: held at CREATE TABLE raw_chunk, line 248 (the inline CHECK on offset_start) and
    line 256 (the table CHECK raw_chunk_offsets_ck) — offset_start       int  NOT NULL CHECK (offset_start
    >= 0), CONSTRAINT raw_chunk_offsets_ck CHECK (offset_end > offset_start),'
  encoded_at:
  - 0001_init.sql
unstated:
- file: 0001_init.sql
  where: CREATE TABLE raw_chunk, line 252, the default on the status column
  evidence: status             node_status NOT NULL DEFAULT 'active', -- cascata UC-01 passo 6 (decisão
    8)
  cost: The schema applies the rule that a raw chunk is recorded active unless told otherwise. No node
    holds it. The node rules.source-status-active-or-deleted limits the values to active or deleted and
    says nothing about the initial one. The default is therefore a business decision that lives only in
    the DDL, where a reader of the specification will not look for it.
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
- node: domain/knowledge-base/raw-information
  file: 0006_original_input.sql
  reason: the binding computes at the file's content and at the node's text as both stand, and no finding
    stands open against the pair
notes: 'Judged by 1 delegation(s), one per file; folded mechanically by trace.py --fold from the returns
  under siegard-reconcile/reconcile-raw-chunk-rename-database.returns/.

  Candidates: 0 opened across 0 of 1 delegation(s); each return lists its own under `candidates_opened`.

  Unstated: 1 fact(s) the source states that no node holds, over 1 file(s), listed under `unstated`. They
  block no binding here and no rebind closes them — the route is the analysis that gives each fact a node.'
---

## Folded
This record was folded by `trace.py --fold` from the delegation returns under `siegard-reconcile/reconcile-raw-chunk-rename-database.returns/`, which are the evidence behind every entry above.
