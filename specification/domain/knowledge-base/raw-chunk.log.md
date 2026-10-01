---
entries:
- field: attributes.locator.type
  unstated: The material names a chunk's locator without giving its shape.
  decided: string
  why: The retrieval only passes the locator through to the owner.
- field: attributes.locator.type
  unstated: The earlier decision read a chunk's locator as an opaque string the retrieval passes through, while the code declares it as an object of the optional keys page, line, speaker and ts, the whole nullable.
  decided: chunk-locator
  why: The owner holds the code as the truth, and a plain string fails the object the code declares.
- field: attributes
  unstated: The earlier decision named the chunk's text and offsets excerpt, start_offset and end_offset, while the code names them text, offset_start and offset_end in every shape that carries a chunk.
  decided: The chunk's attributes are named text, offset_start and offset_end.
  why: The owner holds the code as the truth, and no shape in the code uses the earlier names.
---
