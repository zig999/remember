---
entries:
- field: statement
  unstated: 'The material names no such thing: it states that the pending read counts 0 without a total and is not retried, and nothing about an access token that is held but expired.'
  decided: A 401 on the pending curation read makes the shell ask the identity provider once for a fresh access token with the session cookie and ask the read once more with it.
  why: The owner decided the read renews the token silently and keeps being asked, and the helper's own refresh rule already fixes one renewal and one repeat for any 401.
---
