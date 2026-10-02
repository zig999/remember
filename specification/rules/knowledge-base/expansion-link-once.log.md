---
entries:
- field: statement
  unstated: No node or material says whether a knowledge link reached by several expansion paths is listed once or once per path. None says which hop and which matched knowledge node's score set its score.
  decided: Listed once. Its score is the highest decayed score among the paths that reach it. Its hop is the lowest hop among the paths that give that score.
  why: A link's score measures how strongly the search's matches support it, and its strongest path is the best support it has. A weaker path must not lower a link that is close to a strong match. Choosing the lowest hop on a tie keeps the item's hop deterministic.
---
