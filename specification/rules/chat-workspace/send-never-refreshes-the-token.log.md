---
entries:
- field: statement
  unstated: The material shows the send stream failing on a 401 with no refresh while the cancel request refreshes the token, and does not say why they differ.
  decided: A send answered 401 before the stream opens fails like any other refusal, with no token refresh and no redirect.
  why: The code calls the stream directly, so the refresh and the redirect belong only to requests that go through the shared helper.
---
