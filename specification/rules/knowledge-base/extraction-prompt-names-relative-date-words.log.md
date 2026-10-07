---
entries:
- field: statement
  unstated: No node said which relative-date words the v4 extraction system prompt names.
  decided: hoje, ontem and amanhã.
  why: The v4 system prompt carries those three words and its test fails when one goes missing.
- field: statement
  unstated: The material creates prompt version v5 without saying whether it keeps what v4 asks of the model about relative dates.
  decided: Under prompt version v4 and later.
  why: v5 is v4 plus the alias and document-context instructions; dropping v4 relative-date handling would make the new default regress on dates.
- field: statement
  unstated: The earlier entry settled three relative-date words, while the v4 system prompt also names "semana que vem" and "esta semana" and tells the model to treat similar pt-BR temporal deictics alike.
  decided: The named words are hoje, ontem, amanhã, semana que vem and esta semana; the open-ended instruction about similar deictics is not a word the prompt names and is not stated.
  why: A rule about what the prompt names is held to a closed list, and the two added phrases are named in the shipped prompt that v5 inherits.
---
