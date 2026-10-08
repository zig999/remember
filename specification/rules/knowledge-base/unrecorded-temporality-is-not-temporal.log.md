---
entries:
- field: type
  unstated: No node and no material says how to read an attribute key whose temporality is not recorded. The intake scope does not mention it. The attribute key element declares is_temporal as a boolean without marking it required, and rules/knowledge-base/temporal-attribute-keys lists the temporal catalog keys without covering a key that records no value.
  decided: invariant
  why: An attribute key whose temporality is not recorded is not temporal, because a temporal key gets a validity start the owner never stated (today, with the basis received), so reading a missing flag as temporal would invent a date, and dates are never invented.
---
