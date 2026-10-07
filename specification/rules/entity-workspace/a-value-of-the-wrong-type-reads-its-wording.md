---
type: invariant
statement: "A field holding a value that does not read as its key's value type MUST show the message the description writes for that value type, and a field holding no value MUST NOT be refused for its value type."
constrains:
- domain/entity-workspace/attribute-field
---

## Description

The message for a date key reads "Data inválida. Use o formato AAAA-MM-DD.", the message for a number key reads "Número inválido. Use dígitos, com sinal de menos e ponto decimal opcionais." and the message for a bool key reads "Valor booleano inválido. Use true ou false.", each ending as written. The messages name the value types data, número and booleano.
A text key has no message, because any text reads as text.
A field holding no value carries no value to read, so it is never refused for its type. An empty field counts as a removal or as no change.
rules/knowledge-base/attribute-value-parses decides what reads as each value type.
rules/entity-workspace/a-field-accepts-only-its-value-type decides that a value of the wrong type is refused.
contracts/entity-workspace/entity-screen decides where the message stands and that no review is offered while the value stands.
rules/entity-workspace/save-sends-one-change-per-changed-field decides what an emptied field sends.
