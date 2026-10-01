---
entries:
- field: statement
  unstated: No node says what a line and a blank line are for the chunker.
  decided: A line ends at a newline and a blank line has no characters.
  why: It decides where an email header ends, and a CRLF email never closes its header block.
---
