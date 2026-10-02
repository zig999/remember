---
entries:
- field: attributes.layer.required
  unstated: The material does not say whether every search item carries a layer.
  decided: A search item always carries a layer.
  why: The search service assigns a layer to every node, link and fragment item it returns.
- field: attributes.hop.required
  unstated: The material does not say whether every search item carries a hop.
  decided: A search item always carries a hop, 0 for an item matched directly.
  why: The search service gives every item a hop and its tests assert one on node, link and fragment items alike.
- field: attributes.summary.required
  unstated: The material does not say whether every search item carries a summary.
  decided: A search item always carries a summary.
  why: The search service builds a summary for every node, link and fragment item it returns.
---
