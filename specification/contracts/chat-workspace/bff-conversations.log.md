---
entries:
- field: answers
  unstated: The material does not say whether the send stream and the delete, which skip the shared request helper, are bound by the same transport behaviour as the other chat requests.
  decided: The consumed contract states the send stream and the no-body delete with the failures they report themselves, and the other requests as the shared request helper answers them.
  why: The code sends the stream and the delete without the shared helper, so only the shared helper's requests inherit its cutoff and refresh.
---
