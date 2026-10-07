---
title: A field accepts only its key's value type
summary: Each field refuses a value that does not read as its key's value type of date, number, bool or text.
rationale: I cut value-type acceptance apart from closed keys because it changes when the value-type grammar changes, not when a key's allowed values change.
sources:
- intake/scope.md
objective: Each field accepts only a value that reads as its key's value type.
criteria:
- A date field holding a non-empty value refuses it where it does not match ^\d{4}-\d{2}-\d{2}$.
- A date field holding a non-empty value refuses it where it matches ^\d{4}-\d{2}-\d{2}$ but names no existing day.
- A date field does not refuse a value that matches ^\d{4}-\d{2}-\d{2}$ and names an existing day.
- A number field holding a non-empty value refuses it where it does not match ^-?\d+(\.\d+)?$.
- A number field holding a non-empty value refuses it where it matches ^-?\d+(\.\d+)?$ but does not read as a finite number.
- A number field does not refuse a value that matches ^-?\d+(\.\d+)?$ and reads as a finite number.
- A bool field holding a non-empty value refuses it where it is other than exactly true or exactly false.
- A bool field does not refuse exactly true.
- A bool field does not refuse exactly false.
- A text field refuses no text.
- An empty field of any value type is not refused for its value type.
- An empty field of any value type does not withhold the review.
- A field holding a value its key's value type refuses shows a message on that field naming the value type it expects.
- The form does not offer the review while a field holds a value its key's value type refuses.
depends_on:
- task/entity-form/field-groups
implements:
- rules/entity-workspace/a-field-accepts-only-its-value-type
- rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording
- rules/knowledge-base/attribute-value-parses
- domain/entity-workspace/attribute-field
- contracts/entity-workspace/entity-screen
---
## What it is
The value-type check on every field, read from the grammar the knowledge base states.

## Notes
The grammar for each value type is the one stated by rules/knowledge-base/attribute-value-parses, which the epic covers for that reason.
No node states how a refused value is presented to the owner.
UNDERDETERMINED, from the specification — The message criterion asks only for a message naming the value type, while the rule writes the exact text for date, number and bool. Passes: a date field showing Formato inválido: esperado uma data instead of Data inválida. Use o formato AAAA-MM-DD.
REMAINDER, from the specification — The clauses of the value-parse rule that bind the knowledge base's validation of proposals, corrections and set changes belong to the backend.
ADVISORY, from the specification — No node says whether a field holding only whitespace counts as empty, and the tests should state which input they use for empty.
ADVISORY, from the specification — The criterion that an empty field does not withhold the review is read as emptiness never being a cause for withholding it, since the review is also withheld while no field differs from its start.
