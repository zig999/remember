---
entries:
- field: statement
  unstated: No node and no part of the material says what value the similarity carried by an approximately matched knowledge node takes. The material says only that the approximate item also reports the similarity, so that the uncertainty of the match is explicit. No node says whether that value is the raw word similarity or the strength after the node layer weight.
  decided: The similarity is the highest word similarity of the node's aliases to the query text, with no layer weight applied.
  why: The field exists to show the reader how uncertain the match is. The raw word similarity is the measure the 0.6 admission threshold is compared against, so only the unweighted value can be read against that threshold. The node layer weight already reaches the item through its score.
---
