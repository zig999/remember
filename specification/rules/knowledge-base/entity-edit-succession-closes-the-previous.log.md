---
entries:
- field: statement
  unstated: No node and no material says whether an entity edit's succession gives a validity end to a superseded attribute that holds no validity start. The standing statement leaves the superseded attribute with no validity end when the new start falls on or before the superseded attribute's start, and an attribute with no start gives that comparison nothing to compare against.
  decided: The superseded attribute is given a validity end at the new attribute's validity start. It is left with no validity end only when it holds a validity start and the new start falls on or before that start. Under entity-edit-supersession-time, an attribute given that end keeps its supersession time unset.
  why: The as-of reads already treat validity with no start as holding on every date before its end, so the new start always falls inside the superseded attribute's period. Closing it there keeps the period it held visible in an as-of read. Leaving it open would make it count as current next to its successor, or force a supersession time that hides it from that period.
---
