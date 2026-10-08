---
entries:
- field: type
  unstated: No node and no material names an order for the checks of one change of an entity edit. The intake scope is silent on it, and every other operation with refusals that can overlap has a check-order rule of its own. So a change with an unknown key that also names an attribute that is not live could answer either BUSINESS_UNKNOWN_ATTRIBUTE_KEY or BUSINESS_ENTITY_EDIT_CONFLICT.
  decided: invariant
  why: A change whose key, value or validity is wrong is wrong in itself, and reloading the form cannot make it acceptable. So it is refused for that before it is held against the node's attributes, whose conflict invites the owner to reload and retry. The key comes first among those checks because the value and validity checks read the key's value type, allowed values and temporality, as an attribute proposal's checks already do.
- field: statement
  unstated: No node and no material says which check comes first when a change's value for a key that has allowed values both fails to read as the key's value type and is none of the allowed values. The rule put both checks in one step, so the change could be refused with BUSINESS_INVALID_ATTRIBUTE_VALUE naming the value type and the value, or with BUSINESS_INVALID_ATTRIBUTE_VALUE naming the attribute key, the value and the allowed values.
  decided: The value-type check comes first, and the allowed-values check comes right after it, before the validity check.
  why: A key's allowed values are themselves values of its value type. A value that does not read as that type fails before it can be compared with them.
---
