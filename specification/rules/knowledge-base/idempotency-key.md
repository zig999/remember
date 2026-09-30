---
type: invariant
statement: An LLM run's idempotency key is the SHA-256 digest, as 64 lowercase hexadecimal characters, of its raw information's content hash, its prompt version, its model and the chunking version joined in that order without separator.
constrains:
- domain/knowledge-base/llm-run
---

## Description

None.
