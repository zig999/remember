---
entries:
- field: statement
  unstated: The material says a graph read shows an attribute without provenance with an empty list, and says nothing of whether the read reports such an attribute as an anomaly or which attributes it reports.
  decided: A node read logs a warning for each attribute that is not deleted and has no provenance; deleted attributes are not reported.
  why: The delivered read already warns only for attributes outside the deleted state, and an attribute without provenance is the anomaly the provenance requirement exists to prevent, so a read that shows one silently would hide it.
---
