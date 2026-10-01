---
entries:
- field: statement
  unstated: The material checks a disabled chat first on every conversation operation except sending a message, where the idempotency key, conversation identity and content are checked first; the two decide differently for a malformed message sent while the chat is disabled.
  decided: A sent message is checked for a disabled chat first, as every other conversation operation is.
  why: A disabled surface answers that it is disabled whatever the request holds.
---
