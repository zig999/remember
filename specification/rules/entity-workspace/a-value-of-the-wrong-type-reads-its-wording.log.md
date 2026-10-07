---
entries:
- field: type
  unstated: No node and no material names this rule. None gives the pt-BR text of the message the entity screen shows on a field whose value does not read as its key's value type, or the word that message uses for date, number and bool. None says whether a field holding no value is refused for its value type.
  decided: invariant
  why: The date message repeats the curation screen's "Data inválida. Use o formato AAAA-MM-DD.", so the owner sees the same words for a badly written date on both screens. The number and bool messages follow the same pattern of the type named as invalid, then how to write it, taking the accepted forms from rules/knowledge-base/attribute-value-parses. An empty field holds no value to read, and fields-start-from-the-current-values, a-field-added-to-a-multi-valued-key-starts-empty and save-sends-one-change-per-changed-field all need empty fields to exist and to be saved as a removal or as no change.
---
