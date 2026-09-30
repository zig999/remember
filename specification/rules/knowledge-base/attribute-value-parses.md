---
type: invariant
statement: 'An attribute proposal''s value and an attribute correction''s value MUST read as its key''s value type: a real calendar date written as year-month-day for date, digits with an optional leading minus and an optional decimal part for number, exactly true or false for bool, and any text for text.'
expression: 'date: ^\d{4}-\d{2}-\d{2}$ naming an existing day; number: ^-?\d+(\.\d+)?$ and finite; bool: ^(true|false)$; text: any'
constrains:
- domain/knowledge-base/proposal
- domain/knowledge-base/attribute-key
- domain/knowledge-base/value-type
- domain/knowledge-base/corrected-values
---

## Description

None.
