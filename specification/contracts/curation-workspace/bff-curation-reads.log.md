---
entries:
- field: answers
  unstated: The node says metadata, locator and flags are optional and not what an absent one reads as.
  decided: An absent flags reads as an empty list and an absent locator or metadata as an empty object.
  why: The running reader normalises them that way so that every consumer sees a list or an object.
---
