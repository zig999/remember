---
subject: rules/curation-workspace/baseline-ignores-tab-changes
given:
- "the owner sees 3 entries on Tudo and the baseline is 3"
when:
- "the owner moves to a tab whose total is 5"
then:
- "the pill reads \"2 novos\""
---

## Description

The baseline does not follow the tab, so the pill can overstate.
