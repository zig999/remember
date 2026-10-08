---
entries:
- field: subject
  unstated: No node and no material names such a scenario. None says whether an entity edit with an empty list of changes is malformed or well-formed but changing nothing. The domain element declares changes required and many with no minimum. The contract's format refusal lists a missing, null, wrongly typed, out-of-set or ill-formed field, and an empty list is none of these.
  decided: rules/knowledge-base/entity-edit-changes-something
  why: An empty list is present and of the declared type, so the request is well formed. An edit carrying no change records no change with an effect other than unchanged, so it is refused for changing nothing, with BUSINESS_ENTITY_EDIT_NO_CHANGES and HTTP 422, and not with VALIDATION_INVALID_FORMAT.
---
