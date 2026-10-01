---
entries:
- field: consistency
  unstated: The material does not say how this propagation holds across the separate records it changes.
  decided: eventual
  why: The records it changes are separate aggregates, and no reader in the material depends on seeing them change together.
- field: statement
  unstated: The standing node marks deleted every fragment of the raw information and every link and attribute whose only provenance is one of them, while the material spares any fragment, link or attribute that also rests on another raw information not deleted; the two decide differently for a fragment whose source chunks belong to two raw informations of which only one is deleted.
  decided: A compliance deletion marks deleted only the fragments, links and attributes that rest on no other raw information that is not deleted.
  why: Knowledge another source that is not deleted still attests is held by that source, so deleting one source does not take it away.
---
