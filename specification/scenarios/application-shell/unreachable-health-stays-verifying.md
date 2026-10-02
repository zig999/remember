---
subject: rules/application-shell/health-is-judged-by-the-database-field
given:
- "the back end is unreachable and no health answer was ever parsed"
when:
- "the footer asks for the health"
then:
- "the footer reads verificando…"
---

## Description

An unreachable back end never reads as banco inacessível.
