---
entries:
- field: statement
  unstated: The material ranks a knowledge node matched only approximately below every knowledge node matched exactly, but says nothing of fragments, of other items, or of links expansion reaches from it.
  decided: Every item the search reached only through approximately matched knowledge nodes ranks after all the others, then by score within each group.
  why: A link reached from a misspelled name would otherwise outrank an exact match whenever its decayed similarity beat a low full-text rank.
- field: statement
  unstated: The statement counts a knowledge node as never recorded in a most-recent-first order, but no node and no intake material says whether a never-recorded item comes after or before every knowledge link and information fragment with the same score.
  decided: A knowledge node comes after every knowledge link and information fragment with the same score.
  why: An item with no recording time is never more recent than an item that has one, so in a most-recent-first order it comes last. The delivered search service already ranks nodes this way, because it gives a node a recording time of zero before sorting most recent first.
- field: statement
  unstated: The ranking breaks ties of equal score by recording time, but an information fragment declares no recording time, only a creation time and a supersession time, so no node says which time a fragment item is ordered by.
  decided: An information fragment search item counts as recorded at its information fragment's creation time.
  why: The creation time is the only required time an information fragment declares and the moment the fragment entered the store, so it plays the part a knowledge link's recording time plays. The search service already orders fragment items by it, through f.created_at in search.repository.ts and recordedAtTs from created_at in search.service.ts.
---
