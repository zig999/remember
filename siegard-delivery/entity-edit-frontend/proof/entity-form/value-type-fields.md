---
target: frontend
title: Proof that each entity-form field accepts only its key's value type
summary: The value-type grammar of date, number, bool and text is proved by table-driven boundary tests of valueTypeMessage, and the rule's exact wording, the per-field message, the per-entry check in multi-valued keys and the validity flag are proved through the real EntityForm.
implementation: sha256:6e372d2da23284c5ba82132827937276d531ea7f27c35ae9092dbb2fa5871e60
standard:
  at: ../standards/frontend-react.yaml
  pin: sha256:2b03615161995450265523de6bdd9c464b2ca633976e832e36586c1ab1aa2cf7
run: run/entity-form-value-type-fields-suite-2
tests:
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a date / refuses %j, which does not match the date pattern
  proves: A date field holding a non-empty value refuses it where it does not match ^\d{4}-\d{2}-\d{2}$. Sixteen rows cover wrong digit counts, separators, order, a leading space, a trailing space, a trailing newline, a time suffix and non-digits.
  fails_when: the date pattern is loosened (unanchored, trimmed, digit counts relaxed, or another separator allowed) so that any row stops being refused.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a date / refuses %j, which matches the date pattern but names no existing day
  proves: A date field holding a non-empty value refuses it where it matches the pattern but names no existing day. Rows are 2026-02-30 and 2026-02-31, non-leap February 29 (2025, 1900, 2100), month 00, 13 and 99, day 00 and 32, and day 31 in April, June, September and November.
  fails_when: the existing-day check is dropped, month lengths are wrong for any listed month, the leap-year rule mishandles the century years 1900 and 2100, or month and day 00 are accepted.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a date / does not refuse %j, which matches the date pattern and names an existing day
  proves: A date field does not refuse a value that matches the pattern and names an existing day. Rows are leap days 2024-02-29, 2000-02-29 and 2400-02-29, February 28 in a common year and in 1900, the last day of every 31-day month and of the four 30-day months, 2026-01-01 and 9999-12-31.
  fails_when: a real calendar day is refused, for example February 29 of a year divisible by 400 or by 4 and not by 100, a month's last day, or a boundary year.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a number / refuses %j, which does not match the number pattern
  proves: A number field holding a non-empty value refuses it where it does not match ^-?\d+(\.\d+)?$. Rows are a comma decimal, exponents, a leading plus, a bare or trailing point, a double minus, surrounding spaces, hex, Infinity, NaN, a lone minus, separators and letters.
  fails_when: the number pattern is loosened or the value is trimmed, so that a comma decimal, an exponent, a plus sign, a bare or trailing point, surrounding whitespace or a named non-finite value becomes accepted.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a number / refuses %s, which matches the number pattern but is not finite
  proves: 'A number field refuses a value that matches the pattern but does not read as a finite number: 400-digit integers (positive, negative, with a decimal part) and 1 followed by 309 zeros, the first power of ten past the double range.'
  fails_when: the finiteness check is removed, so a value that matches the pattern but reads as Infinity is accepted.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a number / does not refuse %s, which matches the number pattern and reads as a finite number
  proves: 'A number field does not refuse a value that matches the pattern and reads as a finite number: 0, -0, -12, 12.5, 0.0, 007, -0.5, long integers and decimals, and 1 followed by 308 zeros, the last finite power of ten, with its negative.'
  fails_when: a finite number is refused, for example zero, negative zero, leading zeros, a long but finite value, or the largest finite power of ten; finiteness is applied with an off-by-one cap.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a bool / refuses %j, which is not exactly true or exactly false
  proves: A bool field holding a non-empty value refuses it where it is other than exactly true or exactly false. Rows are True, TRUE, False, FALSE, leading or trailing space, trailing newline, 1, 0, yes, no, t, truefalse and a quoted true.
  fails_when: bool matching becomes case-insensitive, trimmed, accepts 1/0 or yes/no, or is unanchored.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a bool / does not refuse exactly %j
  proves: A bool field does not refuse exactly true, and does not refuse exactly false (one row each).
  fails_when: true or false is refused.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of a text / does not refuse the text %j
  proves: A text field refuses no text, including text that looks like an invalid date, a comma number, a bool, markup, a space and a newline-bearing string.
  fails_when: text starts to be checked against any grammar, trimmed into emptiness, or refused for any content.
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: value-type grammar of an empty value / does not refuse the empty value of a %s field
  proves: An empty field of any value type (date, number, bool, text) is not refused for its value type. The input used for empty is the empty string.
  fails_when: the empty string is refused for date, number or bool (for example because the pattern or the bool equality is applied before the emptiness check).
- file: src/features/entities/components/__tests__/entity-value-types.spec.ts
  name: wording of a refused value / writes the rule's own text for a %s value that does not read as its type (%s)
  proves: 'UNDERDETERMINED entry: The message criterion asks only for a message naming the value type, while the rule writes the exact text for date, number and bool. Passes: a date field showing Formato inválido: esperado uma data instead of Data inválida. Use o formato AAAA-MM-DD. Each row asserts verbatim the texts of rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording (Data inválida. Use o formato AAAA-MM-DD. / Número inválido. Use dígitos, com sinal de menos e ponto decimal opcionais. / Valor booleano inválido. Use true ou false.), and that every way of failing a type, including the date shape, the date''s missing day and the non-finite number, gives that type''s one text.'
  fails_when: 'any of the three messages is reworded, shortened or replaced by a generic one that merely names the type (for example Formato inválido: esperado uma data), or a value that fails by a second route (no existing day, non-finite) is given a different text.'
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form message of a value its key's type refuses / writes the rule's message for each of date, number and bool on the field that holds the refused value, none on a text field or on a field emptied again
  proves: A field holding a value its key's value type refuses shows, on that field, the message the rule writes for that type (observed through the field's aria-describedby); a text field holding a date-shaped invalid value shows none; a date, number and bool field that was refused and then emptied shows none. This is the fact of the wording rule over its declared set of types, plus the field's no-refusal-for-no-value clause.
  fails_when: the form shows a wrong or generic text for a type, shows a message on a field other than the one holding the value, shows one on a text field, or keeps a message on a field that was emptied.
  demonstrates: rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form message of a value its key's type refuses / marks only the field holding the refused value as invalid
  proves: The field holding the refused value carries aria-invalid true and a sibling field of the same type holding no value carries none; the accessible marking the implementation recorded as an inference, pinned because the delegation asked for it.
  fails_when: aria-invalid is absent on the field in error, or present on a field not in error.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form message of a value its key's type refuses / announces the message once as an alert when a field holds a refused value
  proves: The refused value's message is exposed as the single role=alert element of the form, carrying the date wording; pinned because the delegation asked for it, the implementation recorded role alert as an inference.
  fails_when: the message is not an alert, is duplicated, or an alert appears for a field not in error.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form message of a value its key's type refuses / clears the message and the invalid mark once the owner fixes the value
  proves: Typing a refused date and then an existing day leaves the field with no message, no invalid mark and no alert.
  fails_when: the message persists after the value is corrected, because validation does not re-run on change or the error is never cleared.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form message of a value its key's type refuses / validates each entry of a multi-valued key by its own key's value type
  proves: 'In a multi-valued date key and a multi-valued number key, every entry is checked against its own key: 12 refused in the date key with the date wording, 2026-02-03 accepted there and refused in the number key with the number wording, 12 accepted there.'
  fails_when: entries are checked by the wrong key (a first-entry-only check, a form-wide type, or a swap of types between keys), or an entry of a multi-valued key is not validated.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form value-type validity flag / is true while every field holds a value that reads as its key's type, a text field holding anything
  proves: data-value-types-accepted is true on the form when a date, number and bool field hold values of their type and a text field holds a date-shaped invalid value, so text is never refused and accepted values do not withhold the gate.
  fails_when: the flag is false while all non-empty values read as their types, or text content is treated as refusable.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form value-type validity flag / is true while every field of a date, a number and a bool key is empty
  proves: 'An empty field of any value type does not withhold the review: the gate flag is true on mount with every field empty. The input used for empty is the empty string.'
  fails_when: emptiness is treated as a cause for the flag to be false, including before any field is touched.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form value-type validity flag / is false while one field holds a value its key's type refuses and the others are fine
  proves: The form exposes data-value-types-accepted false while a refused value is held, even when other fields are accepted or empty, so the review gate stays closed.
  fails_when: the flag stays true while a field holds a refused value, or is computed over only some fields.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form value-type validity flag / returns to true once the refused value is fixed
  proves: Fixing a refused number to a finite one returns data-value-types-accepted to true, so the gate reopens.
  fails_when: the flag stays false after the value is corrected, or is not recomputed from the live fields.
- file: src/features/entities/components/__tests__/EntityForm.value-types.spec.tsx
  name: entity form value-type validity flag / returns to true once the field holding the refused value is emptied
  proves: 'Emptying a field that held a refused value returns the flag to true: an empty field never withholds the review, including from a state that was refused.'
  fails_when: a field emptied after being refused still keeps the flag false.
files:
- path: src/features/entities/components/__tests__/value-type-wording.ts
  effect: holds the three messages written verbatim from rules/entity-workspace/a-value-of-the-wrong-type-reads-its-wording as the tests' own literals, so the tests assert the rule's text and never the implementation's constants.
- path: src/features/entities/components/__tests__/entity-form-value-type-support.ts
  effect: 'shared helpers of the form spec, built on entity-form-support and entity-form-multi-support: a typed catalog key, typing into a field and letting the resolver settle, reading a field''s message through its aria-describedby, its aria-invalid mark, the form''s alerts, per-entry messages of a key by value, and the form''s data-value-types-accepted attribute.'
not_applicable:
- edge_case: absent input (undefined, null value)
  why: every value reaching a field is a string by the attribute-field shape and the form always holds a string; no criterion or node states a behavior for a missing value, as opposed to the empty string.
- edge_case: an empty collection (a node with no attribute, a key with no entry)
  why: a node with no attribute is the all-empty case that the flag test and the wording test already start from; a form with no catalog key has no field to validate, and no criterion of this task treats it.
- edge_case: a duplicate where uniqueness is claimed
  why: no criterion or node implemented here claims uniqueness of values; two entries of one multi-valued key holding the same value are each validated alone.
- edge_case: an operation against state that forbids it (a disputed key, an inactive node)
  why: a disputed key renders no field and an inactive node no form, which sibling tasks and nodes decide; this task has no field to validate there.
- edge_case: a dependency that fails or answers slowly, two operations on one subject at once
  why: validation is synchronous and local to the form; no network, store or concurrency is touched by these criteria; the knowledge base's own validation of proposals, corrections and set changes is the backend's, per the REMAINDER note.
- edge_case: closed keys, validity fields, the review's reason and the save
  why: owned by sibling tasks; none of this task's criteria reaches them.
untested:
- 'The review criteria "An empty field of any value type does not withhold the review." and "The form does not offer the review while a field holds a value its key''s value type refuses." are not tested as stated: the review control does not exist yet and belongs to a later task; only the seam the implementation recorded, the data-value-types-accepted attribute on the form, is tested, and that attribute is the implementation''s own seam rather than a fact of any node; the later review task owns proof that the control reads it.'
- 'rules/knowledge-base/attribute-value-parses is not claimed by any test: its fact covers a proposal''s, a correction''s and a set change''s value, which are the knowledge base''s backend to validate (the REMAINDER note), and its grammar ranges over all strings; the form-side grammar is held by boundary tables, which are a sample and not the whole, so no test is offered as deciding it.'
- 'rules/entity-workspace/a-field-accepts-only-its-value-type is not claimed by any test: its fact ranges over every string a field could hold, and no finite test decides it whole; its criteria are held by the tables and form tests, and claiming the node on a part of it would approximate it.'
- domain/entity-workspace/attribute-field is a value object whose fact is its shape, which was already proved by earlier tasks and which this task leaves unchanged; no test of this task decides it.
- contracts/entity-workspace/entity-screen is a contract over four operations; this task reaches only the wrong-type refusal of show-review, and the review's half of that refusal does not exist yet, so no finite test decides the contract and none is claimed.
- The implementation inferred that only the empty string counts as empty, so a whitespace-only value is refused for date, number and bool and accepted for text; no node decides it (the task's ADVISORY), so no test pins it; the tests use the empty string for empty and no refused table holds a whitespace-only value.
- The implementation inferred that a key whose value type is not date, number or bool, or an entry whose key is absent from the catalog, is not refused; no node states it, so no test pins it.
- The implementation inferred that year 0000 is an existing day, and no node decides it; the date tables hold no year 0000.
- The implementation inferred that a node starting with a value its key's type refuses shows no message until the owner edits the field, although the flag is false from the start; no node states it, so no test pins either half.
- The implementation inferred role alert, the entity-error id and testid, and aria-invalid only while in error; the two tests on aria-invalid and role alert pin the behavior half of that inference only because the delegation asked for them; no node of this task states them, so a later change of the accessible markup edits those two tests, and the entity-error ids and testids are not asserted.
- The implementation inferred mode onChange; the tests observe only that the message appears after a typed change and clears after a fix, not the mode or that the message appears per keystroke rather than on leaving the field.
- The local resolver zodIssueResolver that replaces zodResolver (divergence FRM-01) is exercised only through the form tests; no test pins its output shape beyond the messages reaching the fields.
---
## What it is
This record proves task/entity-form/value-type-fields.
It holds table-driven boundary tests of valueTypeMessage with the rule's exact wording, form tests through the real EntityForm for the per-field message, the invalid and alert markup, the per-entry check of multi-valued keys and the data-value-types-accepted flag, and two helper files.

## Notes
The first suite run, run/entity-form-value-type-fields-suite, was red with the diagnosis cause code (zodResolver of the installed @hookform/resolvers 3.10.0 rethrows Zod 4 issues, 4 failed tests and 19 unhandled errors); the tests were left as written and the implementation was revised; run/entity-form-value-type-fields-suite-2 passed.
