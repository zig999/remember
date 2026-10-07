---
entries:
- field: type
  unstated: The material names no such thing.
  decided: api
  why: The form needs one synchronous surface that takes the whole edit and answers it, accepted or refused.
- field: answers
  unstated: The material says an edit is refused on conflict without naming the codes or statuses of any refusal.
  decided: HTTP 409 for BUSINESS_NODE_NOT_ACTIVE, BUSINESS_ENTITY_EDIT_CONFLICT and BUSINESS_ENTITY_EDIT_DISPUTED, HTTP 422 for BUSINESS_ENTITY_EDIT_NO_CHANGES and the validation codes the curation surface already uses
  why: A conflict is a state of the store that the owner can retry and so takes 409 as the curation surface does for a lost race, while a request that is wrong in itself takes 422.
---
