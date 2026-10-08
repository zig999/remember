---
entries:
- field: statement
  unstated: No node and no material gives the form of an edit-entity curation action's payload. Four things are open. Is it a bare list or an object holding the list under a named field? Which field names does each applied change carry? Is an effect written with hyphens or underscores? Is a missing item or predecessor identity written as null or left out?
  decided: An object whose `applied` field lists one `{ attribute_key, effect, item_id, predecessor_id }` per applied change in the order given. Each effect is written with an underscore for each hyphen. `item_id` and `predecessor_id` are null where the effect has none.
  why: The payload keeps the same `applied` list, with the same field names and nulls, that the edit-entity answer already gives the owner. It is written as an object of named fields, with each enumeration value's hyphens as underscores, because that is the form every other curation action kind records its payload in.
---
