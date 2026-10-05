---
title: Aliases admitted from the source
summary: 'Under v5, extraction asks for the other names of each entity, and a proposed alias is kept only where the source text of its run holds it.'
rationale: 'The epic follows the first section of the material. The v5 prompt module and the switch of the default version sit here because this section introduces v5, and the document-context epic builds its v5 behavior on that module.'
sources: [intake/scope.md, intake/material-aliases-fuzzy-contexto.md, intake/scope-2-remove-standing-task.md]
covers:
  - domain/knowledge-base/prompt-version
  - rules/knowledge-base/extraction-asks-for-other-names
  - rules/knowledge-base/extraction-prompt-names-relative-date-words
  - rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  - rules/knowledge-base/default-prompt-version
  - rules/knowledge-base/alias-admitted-only-from-source
  - rules/knowledge-base/new-node-aliases
  - rules/knowledge-base/matched-node-gains-only-aliases
  - rules/knowledge-base/name-normalization
  - contracts/knowledge-base/ingestion
  - scenarios/knowledge-base/acronym-in-source-is-admitted
  - scenarios/knowledge-base/admitted-acronym-resolves-later-proposal
  - scenarios/knowledge-base/alias-absent-from-source-not-admitted
  - scenarios/knowledge-base/directed-alias-admitted-without-source
  - rules/knowledge-base/extraction-prompt-v5-keeps-v4
  - rules/knowledge-base/extraction-before-v5-asks-for-no-other-names
  - rules/knowledge-base/extraction-answers-proposals-as-contract
  - rules/knowledge-base/exact-alias-resolves
  - rules/knowledge-base/every-proposal-audited
  - rules/knowledge-base/prompt-version-known
uncovered:
  - node: rules/knowledge-base/extraction-answers-proposals-as-contract
    why: 'task/alias-admission/admit-aliases-from-source already delivered the behavior this plan asked for here, and the one task left to implement it had no source to write, so it was retired. Proof is left to a /reconcile audit over propose-node.handler.ts, extraction.service.ts and handler-base.ts, followed by a proof increment.'
  - node: rules/knowledge-base/every-proposal-audited
    why: 'task/alias-admission/admit-aliases-from-source already delivered the behavior this plan asked for here, and the one task left to implement it had no source to write, so it was retired. Proof is left to a /reconcile audit over propose-node.handler.ts, extraction.service.ts and handler-base.ts, followed by a proof increment.'
---
## What it is
Prompt version v5 asks the model to propose, with each node, the other names the text uses for the same entity.
v5 becomes the version a document ingestion runs under when it names none.
A proposed alias is recorded only when its normalized form occurs in the normalized content of the raw information of its run, except within a directed ingestion.
The propose_node answer, over MCP and REST, lists each alias it did not admit, with its reason.

## Notes
Re-extracting documents already ingested is outside this scope.
Entity resolution keeps comparing only the proposed name, and this epic leaves it unchanged.
