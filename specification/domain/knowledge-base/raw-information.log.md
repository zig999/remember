---
entries:
- field: relationships.raw-chunk.cardinality
  unstated: The material does not say whether a raw information can hold no chunk.
  decided: 1..*
  why: Every fragment is attributed to a chunk of its raw information, so a raw information without a chunk would yield nothing to read.
- field: attributes.metadata.type
  unstated: The material names a raw information's metadata without giving its shape.
  decided: string
  why: The retrieval only passes the metadata through to the owner and reads nothing inside it.
- field: attributes.document_date.type
  unstated: The material reads a document date from a raw information's metadata without naming its type.
  decided: date
  why: It is used as a validity start, which is a calendar date.
- field: attributes.metadata.type
  unstated: The earlier decision read metadata as an opaque string, while the code carries it as an object of named values of any kind.
  decided: string
  why: The type vocabulary has no free-form set of named values, so the type stays string as it does for a tool call's arguments, and the node's description states the shape.
---
