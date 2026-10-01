---
entries:
- field: statement
  unstated: The material checks a disabled chat first on every conversation operation except sending a message, where the idempotency key, conversation identity and content are checked first; the two decide differently for a malformed message sent while the chat is disabled.
  decided: A sent message is checked for a disabled chat first, as every other conversation operation is.
  why: A disabled surface answers that it is disabled whatever the request holds.
- field: statement
  unstated: A judgment shows a sent message checked for its idempotency key, identity and content before the disabled chat.
  decided: A sent message is checked for key, identity and content, then for a disabled chat, then the rest in the stated order.
  why: The owner decided the source's behavior is the truth, and it checks the key and content before the kill switch.
---
