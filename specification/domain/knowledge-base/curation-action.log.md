---
entries:
- field: attributes.payload.type
  unstated: The material holds a curation action's payload as a structured document without giving its shape.
  decided: string
  why: Nothing in the material reads inside it, so it is carried whole as text.
- field: attributes.target_id.type
  unstated: The material names the item a curation action acted on without saying what kind of identity it is.
  decided: string
  why: The action targets items of several kinds, so no single element's identity fits it.
- field: type
  unstated: The material does not say whether a curation action has an identity of its own or belongs to what it acted on.
  decided: aggregate-root
  why: Each action is recorded once and never changes, and nothing it acted on holds it.
- field: attributes.action.type
  unstated: The material closes the action a curation-action listing filters by to seven kinds, while the recorded action and the value written take any text; the two decide differently for a curation action recorded under a kind outside the seven.
  decided: curation-action-kind
  why: An action recorded under a kind no listing can filter for is one the audit trail cannot find by its kind.
- field: attributes.target_kind.type
  unstated: The material closes the target kind a curation-action listing filters by to five kinds, while the recorded target kind and the value written take any text; the two decide differently for a curation action recorded on a target kind outside the five.
  decided: curation-target-kind
  why: An action recorded on a target kind no listing can filter for is one the audit trail cannot find by what it acted on.
---
