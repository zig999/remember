---
subject: rules/curation-workspace/vanished-item-is-not-restored
given:
- "a preference was sent after its undo window and the item was resolved elsewhere"
when:
- "the server answers BUSINESS_REVIEW_NOT_PENDING"
then:
- "the owner reads \"Já resolvido em outro lugar.\""
- "the item is not put back and the stale signal is raised"
---

## Description

An item someone else already resolved stays gone.
