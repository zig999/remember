---
entries:
- field: statement
  unstated: The material cuts a provenance entry's excerpt from the chunk's own text starting at the chunk's start offset, which gives a shifted or empty slice for any chunk that does not start at the beginning of its source.
  decided: A provenance entry shows the whole excerpt of the raw chunk it cites.
  why: A chunk's excerpt is already the content between its offsets, so offsetting it again cuts away the text the entry exists to show.
- field: statement
  unstated: A judgment shows the excerpt cut from the chunk's text starting at the chunk's start offset for the chunk's length.
  decided: The entry shows the part of the chunk's text from the chunk's start offset, as long as the chunk.
  why: The owner decided the source's behavior is the truth, and it cuts the excerpt by those offsets.
---
