---
title: Prompt v5 asks for other names
summary: A v5 extraction prompt, registered beside v1 to v4, that asks for every other name the text gives each entity and keeps every instruction of v4.
rationale: The v5 module is cut apart from the default switch because which version runs by default changes for a different reason than what a version says. The context rendering of v5 is left to the document-context epic for the same reason.
sources:
- intake/scope.md
- intake/material-aliases-fuzzy-contexto.md
objective: An extraction run under prompt version v5 is shown a system prompt that asks for the other names of each entity and keeps every v4 instruction.
criteria:
- The prompt registry maps the version v5 to a prompt module.
- A run under prompt version v5 is extracted without failing as an unknown prompt version.
- The v5 system prompt asks the model to propose, with each node, every other name the text gives the same entity.
- The v5 system prompt names an acronym, a short name and another spelling as such other names.
- The v5 system prompt tells the model that a pronoun alone is not another name of the entity.
- The v5 system prompt tells the model that a role alone is not another name of the entity.
- The v5 system prompt holds every instruction the v4 system prompt holds.
- The v5 system prompt names "hoje", "ontem" and "amanhã" as relative-date words.
- The v5 system prompt asks the model to resolve a relative date against the document date when the source has one.
- The v5 system prompt asks the model to resolve a relative date against the reception date when the source has no document date.
- The v4 system prompt does not ask the model for other names of an entity.
implements:
- domain/knowledge-base/prompt-version
- rules/knowledge-base/prompt-version-known
- rules/knowledge-base/extraction-asks-for-other-names
- rules/knowledge-base/extraction-prompt-v5-keeps-v4
- rules/knowledge-base/extraction-prompt-names-relative-date-words
- rules/knowledge-base/extraction-relative-date-falls-back-to-reception
- rules/knowledge-base/extraction-before-v5-asks-for-no-other-names
---
## What it is
A new prompt module, v5, is registered in the prompt registry and composed from v4.
It adds the instruction to propose the other names the text uses for each entity.

## Notes

The registry and the composition by chaining in src/modules/ingestion/prompts/index.ts are reused, and v5 does not get a second selection path.
UNDERDETERMINED, from the specification — rules/knowledge-base/extraction-before-v5-asks-for-no-other-names states "Under prompt versions v1 to v4, an extraction does not ask the model to propose other names of an entity with each node." It covers all four versions and the whole extraction. The only criterion that answers it is "The v4 system prompt does not ask the model for other names of an entity." That criterion checks v4 alone, and only v4's system prompt. Nothing checks v1 to v3, and nothing checks the user prompt those versions share. Passes: The v5 system prompt asks for other names, as the criteria require. The same request is also added to the user prompt that v1 to v4 share, or to the v1, v2 or v3 system prompt in a way that does not reach v4's system prompt. Every criterion still passes, but extractions under v1 to v4 now ask the model for other names.
REMAINDER, from the specification — rules/knowledge-base/extraction-prompt-names-relative-date-words and rules/knowledge-base/extraction-relative-date-falls-back-to-reception both apply "Under prompt version v4 and later". This task's criteria answer only the v5 part. The v4 part reaches no criterion here: criterion "The v5 system prompt holds every instruction the v4 system prompt holds" would still pass if v4 itself lost those instructions. Belongs: The already delivered v4 extraction prompt and its own tests. That delivery holds the v4 part of both rules.
REMAINDER, from the specification — rules/knowledge-base/default-prompt-version states "A document ingestion that names no prompt version runs under v5." No criterion of this task makes v5 the default. Belongs: The task that makes v5 the default prompt version for a document ingestion that names none.
ADVISORY, from the specification — The description of rules/knowledge-base/extraction-prompt-v5-keeps-v4 says what v5 adds is decided by rules/knowledge-base/extraction-asks-for-other-names "and the document-context rules". None of the document-context rules is among this task's candidates. This task's v5 prompt carries only the other-names addition and the v4 instructions. Some other task must add the document-context instructions to the same v5 prompt, or v5 will not be complete.
