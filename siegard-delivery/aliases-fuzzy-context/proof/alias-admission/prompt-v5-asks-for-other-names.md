---
target: backend
implementation: sha256:52b01ce1ad000fedb945ad6fc82619c064dc19244f36d14fb3c74afe10c5ede2
standard:
  at: ../standards/backend-node-service.yaml
  pin: sha256:8c38c4f11796188276d89c2c7ed1710a4eed05f701034f22c68af0a554142c77
run: run/prove-aliases-fuzzy-context-2
title: Proof for extraction prompt v5 asking for other names
summary: Tests that v5 is a held prompt version whose request to the model asks for every other name of an entity, that every held version from v5 on does the same, that every held version from v4 on names the relative-date words, that v5 keeps each v4 instruction line whole, that an extraction under an unheld version fails without asking the model, and that v1 to v4 ask for no other names.
tests:
- file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  name: holds exactly the prompt versions v1 to v5, each resolving to a module of its own version
  proves: 'Criterion "The prompt registry maps the version v5 to a prompt module." and the enumeration domain/knowledge-base/prompt-version: each of v1 to v5 resolves to a module carrying that version, and the versions the registry reports as known are exactly v1 to v5.'
  fails_when: v5 is not registered (selection throws UnknownPromptVersionError for v5), a module is registered under a version it does not carry, or the registry holds a version outside v1 to v5 or lacks one of them.
  demonstrates: domain/knowledge-base/prompt-version
- file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  name: refuses a prompt version the system does not hold instead of falling back to another one
  proves: 'Part of node rules/knowledge-base/prompt-version-known: selecting a version outside the held set throws UnknownPromptVersionError. The node is decided whole by the extraction-level test in extraction-prompt-held-versions.spec.ts, so this test carries no `demonstrates`.'
  fails_when: selection of a version outside the held set returns a module (a silent fallback to a default or to a nearby version) or throws something other than UnknownPromptVersionError.
- file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
  name: completes an extraction run whose prompt version is v5 instead of failing it as an unknown prompt version
  proves: Criterion "A run under prompt version v5 is extracted without failing as an unknown prompt version."
  fails_when: runLlmExtraction on a run whose prompt_version is v5 fails the run (ExtractionFatalError, status failed) because the orchestrator cannot resolve the version, or resolves it through some path other than the registry that does not know v5.
- file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  name: asks under v5 for every other name the text gives each entity, names an acronym, a short name and another spelling, and excludes a pronoun alone and a role alone
  proves: Criteria "The v5 system prompt asks the model to propose, with each node, every other name the text gives the same entity.", "The v5 system prompt names an acronym, a short name and another spelling as such other names.", "The v5 system prompt tells the model that a pronoun alone is not another name of the entity." and "The v5 system prompt tells the model that a role alone is not another name of the entity." The assertion is a map of six named checks over the v5 system prompt built directly, so a failure names the one that broke. The node rules/knowledge-base/extraction-asks-for-other-names is decided whole by the request-level test over every held version from v5 on in extraction-prompt-held-versions.spec.ts.
  fails_when: the v5 system prompt stops asking for every other name with each node, drops any of acronym, short name or another spelling, or stops saying that a pronoun alone or a role alone is not another name.
- file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  name: keeps every instruction line of the v4 system prompt in the v5 system prompt
  proves: 'Criterion "The v5 system prompt holds every instruction the v4 system prompt holds.": every non-blank line of the v4 system prompt (whitespace-normalised) occurs in the v5 system prompt, in any order and independent of how v5 is composed, over a catalog holding a node type only. The node rules/knowledge-base/extraction-prompt-v5-keeps-v4 is decided whole, as whole lines over a richer catalog, by the line-set test in extraction-prompt-held-versions.spec.ts.'
  fails_when: any line of the v4 system prompt is absent from the v5 system prompt (v5 built over v3 or v1, an instruction of v4 deleted or reworded, a v5 that replaces rather than extends v4).
- file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  name: names hoje, ontem and amanhã as relative-date words in the v4 and v5 system prompts
  proves: Criterion "The v5 system prompt names "hoje", "ontem" and "amanhã" as relative-date words." over v4 and v5, with the version list written by hand. The node rules/knowledge-base/extraction-prompt-names-relative-date-words is decided whole, over every held version from v4 on worked out from the registry, by the test in extraction-prompt-held-versions.spec.ts.
  fails_when: the v4 or the v5 system prompt stops naming all three of hoje, ontem and amanhã as relative-date words; the failure names which version.
- file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  name: asks in the v4 and v5 system prompts to resolve a relative date against the document date and, without one, against the reception date
  proves: Criteria "The v5 system prompt asks the model to resolve a relative date against the document date when the source has one." and "The v5 system prompt asks the model to resolve a relative date against the reception date when the source has no document date.", and node rules/knowledge-base/extraction-relative-date-falls-back-to-reception over v4 and v5. The assertion is a map of named checks per version, so a failure names the version and the half that broke.
  fails_when: the v4 or the v5 system prompt stops asking to resolve a relative date against the document date, or stops saying that without a document date the reception date (received_at) is the anchor.
  demonstrates: rules/knowledge-base/extraction-relative-date-falls-back-to-reception
- file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  name: asks for no other names of an entity in any v1 to v4 system prompt nor in the user prompt they share
  proves: 'Criterion "The v4 system prompt does not ask the model for other names of an entity." and the UNDERDETERMINED entry on rules/knowledge-base/extraction-before-v5-asks-for-no-other-names: none of the v1, v2, v3 and v4 system prompts, and the user prompt those versions share, carries any marker of a request for other names (alias, other names, acronym, short name, spelling, pronoun). The failure keys name the version and the prompt part.'
  fails_when: the other-names request is added to the user prompt shared by v1 to v4, or to the v1, v2 or v3 system prompt, or to the v4 system prompt, so that an extraction under v1 to v4 asks the model for other names.
- file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  name: sends every held prompt version from v5 on a request asking for every other name of each entity, naming an acronym, a short name and another spelling, and excluding a pronoun alone and a role alone
  proves: 'Node rules/knowledge-base/extraction-asks-for-other-names, whole: runLlmExtraction runs a run of each held version from v5 on (the list is worked out from the registry by probing selectPromptModule, so a later version is checked and not just counted) against a stubbed model client, and the system prompt of the captured request asks for every other name with each node, names an acronym, a short name and another spelling, and says a pronoun alone and a role alone are not other names. The result is a map of named checks per version, so a failure names the version and the check, and a guard key fails the test if v5 is not held.'
  fails_when: the request an extraction under v5, or under any later held version, sends to the model stops asking for every other name with each node, drops any of acronym, short name or another spelling, or stops excluding a pronoun alone or a role alone; or a later version is registered whose prompt lacks the instruction; or v5 stops being held.
  demonstrates: rules/knowledge-base/extraction-asks-for-other-names
- file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  name: names hoje, ontem and amanhã as relative-date words in the system prompt of every held version from v4 on
  proves: 'Node rules/knowledge-base/extraction-prompt-names-relative-date-words, whole: the versions from v4 on are worked out from the registry (not written by hand), and for each the system prompt names hoje, ontem and amanhã as relative-date words, one named check per version and word. A guard key fails the test if v4 is not held.'
  fails_when: the system prompt of v4, of v5 or of any later held version stops naming any one of hoje, ontem or amanhã as a relative-date word; a later version added without them makes this test fail, and the failure names the version and the word.
  demonstrates: rules/knowledge-base/extraction-prompt-names-relative-date-words
- file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  name: holds each instruction line of the v4 system prompt as a whole line of the v5 system prompt, over a catalog with a link type, a link type rule and an attribute key with valid values
  proves: 'Node rules/knowledge-base/extraction-prompt-v5-keeps-v4, whole: the v4 and v5 system prompts are built from one catalog snapshot holding two node types, a link type, a link type rule and an attribute key with valid values, and the list of v4 instruction lines (trimmed, non-blank) that are not a whole line of the v5 prompt is empty, so a v4 line surviving only inside a longer v5 line counts as missing.'
  fails_when: any v4 instruction line, catalog rendering included, is absent from the v5 system prompt as a line of its own (a v4 instruction deleted, reworded, merged into a longer line, or a v5 built over an earlier version).
  demonstrates: rules/knowledge-base/extraction-prompt-v5-keeps-v4
- file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  name: fails an extraction under a prompt version the system does not hold without asking the model, and runs every held version under its own prompt
  proves: 'Node rules/knowledge-base/prompt-version-known, whole: an extraction (runLlmExtraction over a run) under v99, a version the system does not hold, is refused as a failed run (ExtractionFatalError carrying a run with status failed) and sends no request to the model, paired with an extraction under each held version, which sends the system prompt of exactly that version. The held versions are worked out from the registry.'
  fails_when: an extraction under an unheld version completes, falls back to the default or another version and asks the model, or is refused without closing the run as failed; or an extraction under a held version runs under a prompt other than its own (a default taking the place of the recorded version).
  demonstrates: rules/knowledge-base/prompt-version-known
not_applicable:
- edge_case: empty or blank prompt version string at selection
  why: no criterion or node in this task states how an empty version is treated apart from the held-set rule, and an empty string falls in the same class (not held) as the version already refused; ingestion-side validation of the field belongs to other tasks.
- edge_case: catalog contents varying the rendered system prompt (no link types, many attribute keys)
  why: the other-names and relative-date obligations read only the instruction text, which does not depend on the catalog; the keep-v4 obligation names a catalog with a link type, a rule and an attribute key with valid values, and the line-set test uses exactly that one snapshot as the representative of the class.
- edge_case: a document with and without a document date in the user prompt
  why: this task changes only the system prompt; the user prompt is the v1 builder with the context block another task adds, and the obligations here about the document date concern what the system prompt asks.
- edge_case: dependency failure, slow answer, concurrent use
  why: building a prompt is a pure in-memory function and the registry is a static table; the extraction-level tests stub the model client and the pool and assert only what is sent and how the run ends, and no obligation of this task states behavior under a failing or slow provider.
- edge_case: duplicate registration of a version
  why: the registry is a literal record keyed by version; no obligation states uniqueness behavior beyond the held set.
- edge_case: a document longer than one chunk, where a preliminary reading request precedes the extraction requests
  why: the other-names, relative-date and version obligations concern the extraction system prompt; the tests use a single-chunk document so the preliminary reading is skipped and the only requests captured are the extraction's, and the reading is another task's behavior.
untested:
- 'rules/knowledge-base/extraction-before-v5-asks-for-no-other-names: no finite test decides that the natural-language instructions of v1 to v4 ask for no other names. The one test over v1 to v4 detects the markers a request would carry and so excludes the implementation the UNDERDETERMINED entry names, but it approximates the absence and is not claimed as the node.'
- 'The behavior the implementation inferred, that the directive routes other names into the propose_node argument `aliases` and says to send no `aliases` when the text gives none: no criterion or node states which argument carries them, so no test pins it.'
- 'The pt-BR examples in the v5 directive ("PMO", "Zeus", "ele", "o gerente"): the implementation chose them and no node dictates the wording, so nothing pins them.'
- 'Whether a model given the v5 prompt actually proposes other names and omits pronouns and roles: only the instruction text of the request is observable here, and model behavior is not a finite test.'
- 'Which version is the default prompt version for an ingestion that names none: rules/knowledge-base/default-prompt-version belongs to the task that makes v5 the default, and a test of it here would claim another task''s clause.'
- 'The document-context instructions v5 is still to carry (the ADVISORY in the task Notes): no node of this task decides them, so no test exists.'
- 'A recorded LLMRun held under no unheld version (the remainder''s wording "no LLMRun recorded under that version"): no obligation of this task reaches the INSERT of the run, and the INSERT is a statement only a real Postgres evaluates, which this re-delivery does not connect to. The test asserts what the ingestion contract states, a failed run and no model request; see contested.'
contested:
- what: The remainder for rules/knowledge-base/prompt-version-known asks that a request under an unheld version leave "no LLMRun recorded under that version".
  why: The ingestion contract (contracts/knowledge-base/ingestion.md, operations run-extraction and ingest-document) answers the rule with SYSTEM_INTERNAL_ERROR carrying the failed run, so a run is held and closed as failed under that version. The implementation does the same, since ingestRawInformation inserts the run without consulting the registry and runLlmExtraction closes it as failed. The test states the contract (a failed run, no model request) and does not assert that no run is recorded.
divergences:
- cites: TST-04
  file: src/__tests__/unit/ingestion/extraction-prompt-v5.spec.ts
  departure: the file sits beside the existing extraction-prompt-v2/v3/v4 specs under src/__tests__/unit/ingestion/ rather than mirroring the unit's path src/modules/ingestion/prompts/.
  why: every neighbouring prompt spec sits there; mirroring the path for one file would split the prompt specs across two layouts.
- cites: TST-04
  file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
  departure: the file sits beside extraction-orchestrator.spec.ts under src/__tests__/unit/ingestion/ rather than mirroring src/modules/ingestion/service/.
  why: the existing orchestrator spec uses that layout and the new file follows its neighbour.
- cites: TYP-02
  file: src/__tests__/unit/ingestion/extraction-orchestrator-prompt-v5.spec.ts
  departure: the pg PoolClient, the Pool and the Anthropic Message stand-ins are built with `as unknown as` assertions that no guard narrows.
  why: a stand-in for a boundary cannot satisfy the full interface of the real client, and the existing orchestrator spec does the same for the same boundaries.
- cites: TST-04
  file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  departure: the file sits beside the existing prompt and orchestrator specs under src/__tests__/unit/ingestion/ rather than mirroring src/modules/ingestion/prompts/ and src/modules/ingestion/service/, and it spans both units.
  why: its four tests read the prompt registry and the orchestrator together over the held versions, and every neighbouring spec sits in that directory.
- cites: TYP-02
  file: src/__tests__/unit/ingestion/extraction-prompt-held-versions.spec.ts
  departure: the pg PoolClient, the Pool and the Anthropic Message stand-ins are built with `as unknown as` assertions that no guard narrows.
  why: a stand-in for the store and for the model provider cannot satisfy the full interface of the real client, and the neighbouring orchestrator spec does the same for the same boundaries.
---

## What it is

Tests that v5 is a held prompt version whose request to the model asks for every other name of an entity, that every held version from v5 on does the same, that every held version from v4 on names the relative-date words, that v5 keeps each v4 instruction line whole, that an extraction under an unheld version fails without asking the model, and that v1 to v4 ask for no other names.

## Notes

Proof-only re-delivery for the testable remainders the review aliases-fuzzy-context left; green on run/prove-aliases-fuzzy-context-2.
