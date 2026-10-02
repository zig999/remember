---
entries:
- field: statement
  unstated: The material lists the codes that end in the error phase and says any other failure envelope that is not a conflict is silently polled, which includes codes the same screen lists as retryable.
  decided: A failure envelope counts as a connection drop unless its status is 409 or 422 or its code is one of the three named, whatever else it carries.
  why: The code treats the three named codes and the two statuses as the only exceptions, so the exceptions are what the rule names.
---
