---
entries:
- field: statement
  unstated: The material gives the document context a summary of up to 5 lines, and no node says what one line of that summary is. No node says which line-break sequences end a line, whether empty lines count, or whether a trailing line break starts a new line, and the same answer governs both counting against the limit and keeping the first 5 lines.
  decided: A line ends at a newline character or at the summary's end. A carriage return ends no line. An empty line counts as a line. A newline that ends the summary starts no further line.
  why: The specification already defines a line as ending at a newline character in rules/knowledge-base/chunker-lines-end-at-newline, so the same document text has one notion of line. Empty lines count because the summary is shown to the model as written, so every line it shows is a line of the summary. A trailing newline starts no line because otherwise a summary ending in a newline would count one line more than it shows.
---
