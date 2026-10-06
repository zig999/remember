---
entries:
- field: statement
  unstated: The material shows a document context to the model with every chunk without saying how it is presented.
  decided: The document context is presented to the model marked apart from its instructions as data, like the content it was read from.
  why: The context is a model reading of the document, so an instruction planted in the document can reach it.
- field: statement
  unstated: Nothing said where the document's content and the context read from it are carried in the call to the model, so a change that put them in the system prompt beside the instructions would still read as marked apart.
  decided: They are never carried in the system prompt, which holds the instructions alone. Which marks set the content apart inside the call (a data label, a closing delimiter) is how a project arranges its source and stays out of this node.
  why: The system prompt is the channel the model reads as instruction, so content placed there is no longer apart from the instructions whatever mark surrounds it; the label and the closing delimiter are one way to mark and a project's own arrangement.
---
