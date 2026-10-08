---
entries:
- field: type
  unstated: No node and no material names a rule that sets the supersession time of the attribute an entity edit supersedes. Each standing rule says only whether that attribute gets a validity end.
  decided: policy
  why: A superseded attribute with no validity end needs a supersession time to stop counting as current. One closed with a validity end must stay unstamped, because the as-of view would otherwise hide it during the period it held.
- field: statement
  unstated: No node and no material says what supersession time an entity edit gives an attribute that already had a validity end when the edit superseded it by correction. The edit neither leaves that attribute without a validity end nor gives it one, so neither case of the standing statement reaches it.
  decided: The edit gives that attribute the moment of the supersession as its supersession time. Only an attribute that the edit itself gives a validity end keeps its supersession time unset.
  why: A correction declares the old value wrong for the period it held. An unstamped attribute would still show as that period's value in an as-of read, beside or instead of the value that corrected it.
---
