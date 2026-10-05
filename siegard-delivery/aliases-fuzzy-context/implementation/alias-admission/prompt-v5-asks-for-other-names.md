---
target: backend
task: sha256:7bbbd853fe3932b40326aca8a116e22e6e73abb92f7a9d5d5fad82b85778f2f5
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/alias-admission-prompt-v5-asks-for-other-names-build
title: Extraction prompt v5 asks for other names
summary: Registers a v5 extraction prompt module composed over v4 that adds an instruction to propose every other name the text gives each entity, and leaves v1 to v4 and the default version untouched.
files:
- path: src/modules/ingestion/prompts/extraction.v5.ts
  effect: New prompt module v5. It exports PROMPT_VERSION "v5", MAX_TOKENS and user() re-exported from v1, and system(catalog), which returns v4's system prompt followed by OTHER_NAMES_DIRECTIVE. The directive asks the model to send, in `aliases` on each propose_node, every other name the text gives the entity (an acronym, a short name, another spelling). It says a pronoun alone and a role alone are not other names. It says to send no `aliases` when the text gives none.
- path: src/modules/ingestion/prompts/index.ts
  effect: Imports the v5 module, defines the V5 PromptModule entry and registers it in REGISTRY. selectPromptModule("v5") now resolves instead of throwing UnknownPromptVersionError, and the "Known versions" list in that error now includes v5. DEFAULT_PROMPT_VERSION is unchanged and still v4. The file's header comment and two doc comments were removed under the no-comments rule, with no behavior change.
criteria:
- criterion: The prompt registry maps the version v5 to a prompt module.
  met: true
  how: 'REGISTRY in src/modules/ingestion/prompts/index.ts holds [v5.PROMPT_VERSION]: V5, where V5 is a PromptModule built from extraction.v5.ts.'
- criterion: A run under prompt version v5 is extracted without failing as an unknown prompt version.
  met: true
  how: selectPromptModule reads REGISTRY["v5"], which is now defined, so UnknownPromptVersionError is not thrown for "v5". The orchestrator reaches the module through the same selection path as before.
- criterion: The v5 system prompt asks the model to propose, with each node, every other name the text gives the same entity.
  met: true
  how: OTHER_NAMES_DIRECTIVE in extraction.v5.ts tells the model that with each `propose_node` it must also send in `aliases` every other name the text itself gives that entity. system() in the same file appends it to the v4 system prompt.
- criterion: The v5 system prompt names an acronym, a short name and another spelling as such other names.
  met: true
  how: The first bullet of OTHER_NAMES_DIRECTIVE lists "an acronym", "a short name" and "another spelling of the name", with a pt-BR example for the first two.
- criterion: The v5 system prompt tells the model that a pronoun alone is not another name of the entity.
  met: true
  how: The second bullet of OTHER_NAMES_DIRECTIVE says a pronoun alone ("ele", "ela", "isso") is NOT another name of the entity and must not be proposed.
- criterion: The v5 system prompt tells the model that a role alone is not another name of the entity.
  met: true
  how: The third bullet of OTHER_NAMES_DIRECTIVE says a role alone ("o gerente", "o cliente", "a diretora") is NOT another name of the entity and must not be proposed.
- criterion: The v5 system prompt holds every instruction the v4 system prompt holds.
  met: true
  how: system() in extraction.v5.ts is `${systemV4(catalog)}\n${OTHER_NAMES_DIRECTIVE}`. It is the v4 output, unchanged, with text appended, so every v4 instruction is a literal prefix of the v5 prompt.
- criterion: The v5 system prompt names "hoje", "ontem" and "amanhã" as relative-date words.
  met: true
  how: The v5 prompt contains v4's RECEIVED_AT_ANCHOR_DIRECTIVE, which lists "hoje", "ontem" and "amanhã" as relative-date words. v3's directive, also inside it, names them too.
- criterion: The v5 system prompt asks the model to resolve a relative date against the document date when the source has one.
  met: true
  how: v4's RECEIVED_AT_ANCHOR_DIRECTIVE, inside the v5 prompt, says to resolve a relative date against `document_date` if it is present, with basis "document".
- criterion: The v5 system prompt asks the model to resolve a relative date against the reception date when the source has no document date.
  met: true
  how: The same v4 directive says that when `document_date` is `(unknown)` the model falls back to the date portion of `received_at`.
- criterion: The v4 system prompt does not ask the model for other names of an entity.
  met: true
  how: extraction.v4.ts and v1 to v3 were not edited. The directive exists only in extraction.v5.ts, and v4's system() does not import it. A grep of the prompts directory found no earlier mention of aliases.
nodes:
- node: domain/knowledge-base/prompt-version
  encoded_at:
  - src/modules/ingestion/prompts/index.ts
  - src/modules/ingestion/prompts/extraction.v5.ts
  how: The enumeration's value v5 is now held in the code. extraction.v5.ts declares PROMPT_VERSION "v5", and index.ts registers it beside v1 to v4.
- node: rules/knowledge-base/prompt-version-known
  encoded_at:
  - src/modules/ingestion/prompts/index.ts
  how: The registry is the set of versions the system holds, and selectPromptModule fails with UnknownPromptVersionError outside it. Registering v5 makes v5 a known version. No second selection path was added.
- node: rules/knowledge-base/extraction-asks-for-other-names
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v5.ts
  how: OTHER_NAMES_DIRECTIVE asks for every other name the text gives the entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone. It is appended only in v5's system().
- node: rules/knowledge-base/extraction-prompt-v5-keeps-v4
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v5.ts
  how: v5's system prompt is v4's system prompt output with the directive appended, so none of v4's instructions can be lost. The task covers only the other-names addition. The document-context instructions the node mentions are not part of this task.
- node: rules/knowledge-base/extraction-prompt-names-relative-date-words
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v5.ts
  how: The words "hoje", "ontem" and "amanhã" are in v4's RECEIVED_AT_ANCHOR_DIRECTIVE. v5 inherits them by composing systemV4, and v4 itself was not touched.
- node: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
  encoded_at:
  - src/modules/ingestion/prompts/extraction.v5.ts
  how: The document-date-then-reception-date fallback is in v4's RECEIVED_AT_ANCHOR_DIRECTIVE. v5 inherits it by composing systemV4.
- node: rules/knowledge-base/extraction-before-v5-asks-for-no-other-names
  how: Honored by leaving v1 to v4 alone. extraction.v1.ts to extraction.v4.ts and the user() prompt they share were not edited, so no alias request reaches those versions. The alias request exists only inside v5's own system().
inferences:
- inferred: The directive refers to the propose_node argument by its name, `aliases`, and tells the model to send no `aliases` when the text gives no other name.
  from: ProposeNodeSchema in src/modules/ingestion/dto/propose-node.dto.ts declares an optional `aliases` array of strings, which is the only field that carries other names to the node.
- inferred: The directive's examples are pt-BR ("PMO" for "Escritório de Projetos", "Zeus" for "Projeto Zeus", "ele/ela/isso", "o gerente/o cliente/a diretora").
  from: The existing prompts use pt-BR examples and pt-BR deictics (the Zeus and Caio examples in v1 and v3, the "hoje/ontem/amanhã" list in v4). No node dictates the example wording.
- inferred: The v5 module follows the shape of v4, with MAX_TOKENS and user() re-exported from v1 and only system() composed.
  from: extraction.v4.ts, which the inventory names as the composition convention (v4 wraps v3's system and reuses v1's user).
- inferred: The comments in index.ts were removed as part of this edit.
  from: The project rule that source carries no comments, applied to a file this delivery edits. This is not widening.
preserved:
- selectPromptModule resolves "v1" to "v4" to the same modules as before, and UnknownPromptVersionError is still thrown for any unregistered version.
- DEFAULT_PROMPT_VERSION remains v4.PROMPT_VERSION, so a document ingestion that names no version still runs under v4.
- The v1 to v4 system() output and the shared user() output are byte-identical, since none of those files was edited.
- The PromptModule interface and the exported names of index.ts are unchanged.
deferred:
- what: Making v5 the default prompt version (rules/knowledge-base/default-prompt-version). DEFAULT_PROMPT_VERSION still points at v4.
  why: The task's notes assign it to another task, and no criterion here covers it.
- what: The document-context instructions and the rendering of context in v5's user prompt.
  why: The task's rationale leaves them to the document-context epic. Another task must add them to the v5 prompt for v5 to be complete.
- what: v1 to v3 system prompts and the shared user prompt were not checked by any test for the absence of other-names requests, and the v4 relative-date instructions have no criterion here.
  why: The task's notes record these as underdetermined or as remainders that belong to other deliveries. The tree already satisfies them, because those files were not edited. Their proof is the test author's.
- what: The comments still present in extraction.v1.ts to extraction.v4.ts.
  why: This task does not write those files, and the comment route lands separately.
---

## What it is

Registers a v5 extraction prompt module composed over v4 that adds an instruction to propose every other name the text gives each entity, and leaves v1 to v4 and the default version untouched.

## Notes

The index.ts edit also removed that file's header comment and two doc comments under the project's no-comments rule, with no behavior change.
