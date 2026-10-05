---
type: invariant
statement: The extraction system prompt of prompt version v5 contains every instruction that the extraction system prompt of prompt version v4 contains.
constrains:
- domain/knowledge-base/llm-run
- domain/knowledge-base/prompt-version
---

## Description

Governs what the v5 extraction system prompt keeps from v4. It does not say which instructions v4 carries: the rules scoped to v4, or to an earlier version and later, decide that. It does not say what v5 adds either: rules/knowledge-base/extraction-asks-for-other-names and the document-context rules decide that.
