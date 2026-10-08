---
entries:
- field: statement
  unstated: The material defaults the start to today for keys that require one without saying what a temporal key that does not require one gets.
  decided: Today with the basis received for every temporal key.
  why: The owner decided the start defaults to today when none is stated, and email, phone and website are temporal.
- field: statement
  unstated: No node and no material says which calendar day counts as today when an entity edit records an unstated validity start, or in which time zone the moment of the edit is read as a date. The owner's time zone is held only for chat turns (rules/chat/owner-time-zone-default), and the scope names none for the knowledge base.
  decided: Today is the UTC calendar date of the moment of the edit.
  why: The knowledge base reads the day it compares validity against as the UTC calendar date, so a start read in any other zone could fall after that day and leave a value just saved by the owner not yet in effect.
---
