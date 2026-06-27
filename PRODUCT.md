# Product

## Register

product

## Users

Single owner, no multi-user and no role-based authorization (single-owner by spec). The owner is also the operator and the audience: they ingest unstructured information (PDFs, emails, meeting notes, articles, transcripts, chats) and later query a temporal, traceable knowledge graph. Authentication exists only as an access gate; there is no `User` entity in the domain. On any given screen the owner is in one of two tasks: feeding information in, or interrogating what was captured — and, on `/curation`, adjudicating what the extraction proposed.

## Product Purpose

Remember is a personal knowledge repository. It preserves original information verbatim, extracts structured knowledge with an LLM, organizes it as a temporal, traceable graph, and lets the owner retrieve it by lexical search + graph traversal (no embeddings — a permanent non-goal). Two principles cut across everything: **traceability** (every fact traces back to its original source) and **explicit confidence** (uncertainty is recorded, never hidden; conflict, change, and correction are distinct cases; nothing is discarded silently). Success is the owner trusting the graph: able to see where a fact came from, how sure the system is, and what changed.

## Brand Personality

Calm and precise; technical, instrument-like. A quiet tool that surfaces uncertainty plainly rather than smoothing it over. The visual base is already committed: dark surfaces, glass/ambient depth, monospace-leaning type, restrained motion (the CRT power-on at sign-in is the one indulgence). It should feel like a piece of engineering equipment for thinking — read like a console, not a consumer app.

## Anti-references

- **Generic SaaS dashboard**: identical card grids, the hero-metric template (big number + label + gradient), uppercase tracked eyebrows above every section.
- **Saturated / cheerful palettes**: decorative gradients, color-for-color's-sake. Here color carries meaning (node types, link types, confidence states) and nothing else.
- **Spreadsheet density**: everything cramped, no breathing room, flat tabular rows with no hierarchy. Density is welcome, but with rhythm and air where decisions happen.
- **Playful / childish**: cute illustrations, oversized radii, casual tone. This is a serious personal-knowledge instrument.

## Design Principles

- **Uncertainty is visible, never hidden.** Confidence, conflict, change, and correction are distinct and legible states — the UI's job is to expose them, not flatten them.
- **Traceability is always one step away.** Any fact can be followed back to fragment → chunk → raw source; the path is a first-class affordance, not buried.
- **The tool disappears into the task.** Earned familiarity over novelty: standard affordances, consistent vocabulary screen to screen, the operator never pauses at a strange control.
- **Density with rhythm.** Information-dense by nature, but spacing groups related things tightly and separates decisions generously; air is placed where judgment happens.
- **Restraint is the default.** Color, motion, and emphasis are spent only where they carry information.

## Accessibility & Inclusion

WCAG 2.2 AA (project-declared). Associated labels, `aria-invalid` + `aria-describedby` on form errors, visible focus, sufficient contrast (body ≥ 4.5:1), keyboard operability for the curation queue (keyboard-driven decisions already exist). Every animation needs a `prefers-reduced-motion` alternative.
