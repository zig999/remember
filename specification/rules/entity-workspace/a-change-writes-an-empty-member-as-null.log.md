---
entries:
- field: type
  unstated: No node and no material has a rule for how the edit request writes a change member that holds nothing, or for what a remove change carries in its value, valid_from and valid_to. The intake (wire-facts.md) leaves open whether such a member is sent as null or left out, for the backend session to confirm.
  decided: invariant
  why: The knowledge base refuses a change member that is missing or is not a well-formed identifier or YYYY-MM-DD date, and accepts null where a member may be empty, so JSON null is the only empty form it takes in all three members. A remove carries null validity because a change to a stable key may state no validity and the removal looks at none.
---
