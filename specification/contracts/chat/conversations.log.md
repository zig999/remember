---
entries:
- field: answers
  unstated: The material answers an update naming neither a title nor an archiving time with VALIDATION_REQUIRED_FIELD when the body is empty and with VALIDATION_INVALID_FORMAT when the body holds only other keys.
  decided: Every update naming neither field answers HTTP 422 VALIDATION_REQUIRED_FIELD with message "at least one of title or archived_at must be present".
  why: One condition gets one answer, and unknown keys are ignored everywhere else on this surface.
- field: answers
  unstated: The material answers a conversation cursor with the right shape but a creation time that is not a timestamp or an identity that is not an identifier with an internal error, and any other malformed cursor with VALIDATION_INVALID_FORMAT.
  decided: 'Every cursor that does not decode to a creation time and a well-formed identity answers HTTP 422 VALIDATION_INVALID_FORMAT with `details: { param: "cursor" }`.'
  why: A malformed cursor is the caller's error, never the system's.
- field: answers
  unstated: A judgment shows a cursor accepted when it decodes to two strings, an update body of other keys answered as invalid format, and the disabled chat checked after the key on a sent message.
  decided: The cursor needs a creation time and an identity as text, a body of other keys answers VALIDATION_INVALID_FORMAT, and a sent message is not disabled-first.
  why: The owner decided the source's behavior is the truth, and it answers those three that way.
- field: answers
  unstated: The material's replay sentence says a turn recorded as provider-error or internal-error replays as the error frame that turn closed with, while the source replays it as done with stop reason end_turn.
  decided: A replay of a turn recorded as provider-error or internal-error closes with done carrying stop reason end_turn, never an error frame.
  why: The owner decided the source's behavior is the truth, and rules/chat/replay-reports-failure already states the same end.
---
