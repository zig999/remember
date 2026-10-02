---
entries:
- field: statement
  unstated: The material does not say whether a failure that did not come out of the exchange with the identity provider is read by its message or only by its type.
  decided: It is a network failure when it is a type error or its message mentions a failed fetch or the network, and a failure the exchange raised is never read by its message.
  why: The code reads the message only after every recognised failure of the exchange has been classified by its cause, so the message reading applies to the remainder and nothing else.
---
