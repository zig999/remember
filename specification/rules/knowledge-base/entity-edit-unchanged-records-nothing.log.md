---
entries:
- field: statement
  unstated: The material says an equal value writes nothing and also that reaffirming does not duplicate, which differ about provenance.
  decided: An equal value is reported unchanged and records nothing, not even provenance.
  why: The owner who types a value already held asserts nothing new, and adding the note as provenance would claim a source for a fact the note never stated.
- field: statement
  unstated: No node and no material says whether a set change's value counts as one an attribute already holds by its literal text or by a canonical form for the key's value type, such as numeric value for a number or the system's normalization for text.
  decided: Values are compared as literal text, character for character, so a value differing from the held one only in case, accents, spacing or numeric notation is not unchanged.
  why: A value differing from the held one only in case, accents, spacing or notation is what the owner types to correct how the held value is written, and comparing canonical forms would report that correction as unchanged and refuse the edit as changing nothing.
- field: statement
  unstated: No node and no material says whether a set change that names a superseded or deleted attribute and states that attribute's own value is reported unchanged or refused as a conflict. This rule put no status condition on a named attribute, while rules/knowledge-base/entity-edit-names-a-live-attribute refuses every change naming an attribute that is not live, and no node orders an effect against that check.
  decided: The unchanged effect applies to a named attribute only when its status is a live status, so a change naming a superseded or deleted attribute is refused as a conflict whatever value it states.
  why: A superseded or deleted value is no longer held by the node, so a change that repeats it comes from a form opened before another change replaced it, and that is what the conflict tells the owner to reload.
---
