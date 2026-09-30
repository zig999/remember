---
subject: rules/knowledge-base/email-quote-blocks
given:
- an email with no blank line, whose later lines are quoted
when:
- it is ingested
then:
- its header block never ends
- no quotation change starts a new block
- the whole email is one block
involves:
- rules/knowledge-base/email-header-block
---

## Description

None.
