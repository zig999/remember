---
entries:
- field: type
  unstated: No node and no material names this rule. The shell's refresh-and-repeat rules bind only requests that go through the shell request helper, and the entity workspace's edit request does not read its answer through that helper. No node and no material says whether the edit, or the reads, refresh the token and repeat once after a 401.
  decided: invariant
  why: The edit carries the same bearer token as the four reads, and its contract already answers a failed refresh with AUTH_SESSION_EXPIRED and reports a second 401 the way the reads do, so the edit already assumes that a first 401 starts one refresh and one repeat.
---
