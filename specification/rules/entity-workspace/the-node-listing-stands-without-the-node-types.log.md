---
entries:
- field: type
  unstated: No node and no material names this rule. None says what the entity listing screen shows while the node-type listing is being fetched or after it has failed, whether the node listing is still offered without a node-type choice meanwhile, or whether that failure comes with an action to try again.
  decided: invariant
  why: The node type is only an optional narrowing of the node listing, so a pending or failed node-type listing removes the type choice but not the listing by name prefix, as the curation picker falls back to a manual input when its listing fails. The failure gets a retry action and the fixed "Não foi possível <ação>. Tente novamente." wording that the curation, chat, graph and entity-save alerts use, with no code or message of its own.
---
