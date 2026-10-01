---
entries:
- field: answers
  unstated: The standing rule limits every curation action's reason to 1000 characters, while the material's curation requests accept a reason of any length; the two decide differently for a rejection whose reason holds 1500 characters.
  decided: The rule stands for every curation action, and each curation decision refuses a longer reason with VALIDATION_INVALID_FORMAT, HTTP 422 over REST, as it refuses any other malformed field.
  why: The audit record carries one reason whichever operation wrote it, and a malformed field of these requests is answered that way.
---
