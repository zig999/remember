---
subject: rules/graph-explorer/an-origin-failure-is-an-alert-with-a-retry-unless-deleted
given:
- "the origin read fails with BUSINESS_RAW_INFORMATION_DELETED"
when:
- "the panel shows the failure"
then:
- "the alert reads that the original document was removed for compliance"
- "no retry is offered"
---

## Description

A removed source is final.
