---
entries:
- field: consistency
  unstated: The material does not say how this rule holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- field: statement
  unstated: How many candidates a review pairs with the new node
  decided: The ten most similar nodes at or above the floor
  why: The resolver fetches ten candidates by similarity before filtering by the floor, so no more are ever paired.
---
