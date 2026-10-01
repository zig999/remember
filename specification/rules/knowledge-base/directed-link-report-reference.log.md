---
entries:
- field: statement
  unstated: The report entry's reference is held only as a string.
  decided: A link entry's reference is source reference, link type and target reference joined by "->".
  why: The chat graph delta parses this form, so a change to it would silently drop links.
---
