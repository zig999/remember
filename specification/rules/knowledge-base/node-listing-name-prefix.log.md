---
entries:
- field: statement
  unstated: The material shows a percent sign or an underscore in a node listing's name prefix acting as a wildcard, without saying whether a prefix is read literally.
  decided: A name prefix is read literally.
  why: A name prefix is the start of a name the owner types, and its characters mean themselves.
- field: statement
  unstated: A judgment shows a node listing's name prefix compared with a pattern match in which a percent sign and an underscore are wildcards.
  decided: The prefix matches as a name followed by any text, a percent sign standing for any text and an underscore for any one character.
  why: The owner decided the source's behavior is the truth, and it reads those two characters as wildcards.
---
