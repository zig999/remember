# Backend conventions — servicedeskn1

Conventions in this project's own words, the optional input `/siegard-standard` takes by path to
extend `standards/backend-node-service.yaml`. Each states one condition a file can be held to, why
it holds, and which half of the registry decides it: **tool** names the step that already exists
(`lint` = `eslint .`, `typecheck` = `tsc --noEmit`, `test`), **reading** means the standard pass
judges it.

## Decisions taken before writing this

- **Business logic lives in a service (ARC-04 stands).** Conventions that move invariants into
  domain objects — no public setter, an object that refuses to be constructed invalid, a service
  holding no rule — are not adopted. Services hold the rules; domain modules hold the types.
- **A failure is a typed error class with one status map (COR-02, COR-03, COR-04, EDG-02 to
  EDG-04 stand).** The return-value convention is not adopted. Exhaustiveness of the status map is
  not required: `constraints/a-domain-error-unmapped-by-status-is-refused-generically` decides that
  an unmapped error answers 500 with a fixed message.
- **Not repeated here because the registry already holds them:** adapter, controller and
  repository roles (ARC-04); no domain type on the wire (ARC-05, DTO-01, DTO-02); stand-ins only for
  boundaries (TST-03).

## Directory vocabulary

- **Domain modules:** `src/case`, `src/glossary`, `src/capability-registry`,
  `src/connector-registry`, and `src/investigation` except its `*.adapter.ts` files.
- **Infrastructure:** `src/http`, `src/http-connector`, `src/persistence`, `src/factories`,
  `src/config`, and every `*.adapter.ts`.
- **Shared, importable from anywhere and importing nothing but each other:** `src/errors`,
  `src/types`.
- **Infrastructure packages:** `fastify`, `pg`, `@anthropic-ai/sdk`, `@modelcontextprotocol/sdk`,
  `jose`.
- `src/vitest-global-setup.ts` and everything under `src/__tests__` are outside every scope below;
  the registry's TST rules govern them.

## Layers, ports and adapters

1. Dependencies point inward: infrastructure imports domain modules; a domain module imports no
   infrastructure directory and no infrastructure package. — A domain that imports an adapter
   cannot be tested or replaced apart from it. — **tool** (`lint`, `no-restricted-imports` scoped to
   the domain modules). Decides `constraints/the-domain-depends-on-no-infrastructure`,
   `constraints/judgment-runs-behind-a-port` and `constraints/consolidation-runs-behind-a-port`.
   One file departs today: `src/connector-registry/connector-placeholder-declaration-check.ts`
   imports `src/http-connector/connector-request-resolver.js` for
   `subjectAttributePlaceholderNamesIn`. The lint block is written with that one path excluded
   until the function moves to a domain module or `connector-registry` is declared
   infrastructure; the exclusion is the disclosed departure, not the rule.
2. No two modules import each other, directly or through a chain. — A cycle makes every member
   change together. — **reading**, until the registry admits `eslint-plugin-import` in
   `dependencies`; then **tool** (`lint`, `import/no-cycle`). Two cycles stand today — `case` ↔
   `investigation` and `capability-registry` ↔ `connector-registry` — and every review reaching
   those modules reports them until one side of each is cut.
3. Every external dependency — the database, the model provider, an observation source, the
   clock — is reached through an interface named in domain terms, implemented in a `*.adapter.ts`
   file or under `src/persistence` — as `case/case-store.port.ts` and
   `investigation/hypothesis-evaluator.port.ts` already are. — The domain names what it needs; which technology answers
   is a detail it never sees. Extends ARC-01, which says a constructor receives interfaces and not
   what they are named for. — **reading**.
4. A service never imports another service. — Shared behavior descends into a domain module or
   ascends into a factory; a service calling a service hides a transaction boundary. — **tool**
   (`lint`, `no-restricted-imports` pattern over `*.service.ts`).

## The domain model

5. A domain type declares every field `readonly`, and a domain class exposes no field that is not
   `readonly` or `private`. — A value two callers hold is a value one of them can change unless the
   type forbids it. — **reading**; `@typescript-eslint/prefer-readonly` decides only the
   private-member half of a class, and the registry names it under `lint` for that half alone.
6. A public signature of a domain module uses a value object or an enumeration for a concept with
   a constraint — an identity, a version, a status, a deadline — never a bare primitive. — Every
   caller of a primitive re-learns what it means and what it admits. — **reading**.
7. A domain module performs no I/O: no HTTP, SQL, file system, system clock or environment read.
   What comes from outside arrives as a parameter or through a port. — A domain that reads the
   clock cannot be tested at a chosen instant. — **tool** (`lint`, the same `no-restricted-imports`
   block as rule 1, plus `node:fs`, `node:http`, `process.env`).

## Persistence and reads

8. One store per aggregate root: its port in the domain module (`case/case-store.port.ts`) and one
   relational implementation in `src/persistence` (`relational-case-store.repository.ts`), speaking
   in collection terms; no store per table, and no `pg` type crosses the port. — A store per table
   dissolves the consistency boundary the aggregate draws. — **reading**.
9. A listing reads through a dedicated query and never hydrates an aggregate to discard it. —
   Loading a boundary to read one column pays for every invariant it will not check.
   `constraints/a-case-is-read-whole` governs the case read and is not this rule's. — **reading**.

## Design patterns

10. A class is named for its role in the domain, never for the pattern it implements —
    `HypothesisEvaluator`, not `EvaluationStrategyImpl` — except where the pattern is the concept
    itself (`CaseRepository`). — A pattern's name says how; a reader wants what. — **reading**.
11. An interface exists only with two implementations already in the tree, or one implementation
    and a test double that exercises the interface; one with neither is removed. — An abstraction
    over one thing is an indirection with a name. — **reading**.
12. A design pattern enters for a variation that already exists in the code, never for one
    imagined; the trigger and what the pattern costs are stated in the implementation record's
    inferences. — A pattern without a trigger is structure nobody can remove because nobody knows
    what it was for. — **reading**.
13. The same pattern is not applied uniformly across modules. Rules 1 to 12 are scoped to the
    domain modules above; `src/http`, `src/http-connector`, `src/persistence`, `src/factories` and
    `src/config` answer to the registry's ARC, DTO and API rules and to nothing here; `src/errors`
    and `src/types` answer to rule 1's shared clause alone. Only the `knowledge` context is classified core;
    whether `glossary` and `investigation` (supporting) carry rules 6, 8 and 11 is decided when the
    registry is written, by scope. — Structure where no invariant lives is cost without a rule to
    pay for it. — **reading**.

### Pattern triggers

What rule 12 holds a pattern to, per pattern: the variation that authorizes it, and the shape
that says it was applied without one. A pattern absent from the table is judged by the same
question — what already varies, and what does the pattern cost.

| pattern | trigger that authorizes it | sign of misuse |
|---|---|---|
| Factory / Factory Method | constructing the aggregate has an invariant or more than one step | a factory that only calls the constructor |
| Builder | an object with many valid combinations and partial construction | a builder for two required fields |
| Strategy / Policy | two or more variants **already present**, chosen at runtime | an interface with one implementation; an enumeration of one case |
| Specification | a selection or validation criterion reused in two or more places and testable alone | a wrapper over one `where` used once |
| Repository | one aggregate root with its own lifecycle | a repository per table; a generic repository leaking the driver's query type |
| Unit of Work | one use case, one aggregate, one transaction | a unit of work committing several aggregates together |
| Ports & Adapters | an external dependency that is replaceable or must be stood in for under test | a port for code that will never have a second implementation nor a test |
| Domain Event | another aggregate or context reacts to the fact | an event nobody consumes |
| Anticorruption Layer | an external or legacy model that cannot be changed | a layer over the project's own context that was only a mapping |
| Decorator / Chain | cross-cutting behaviors composed at runtime | five layers for one log line |
| Observer / internal Pub-Sub | a reaction that is decoupled and optional | an essential coupling hidden behind an event, so the flow cannot be read |
| Singleton | a genuinely unique resource with no mutable state | mutable global state; a test that cannot isolate it |

Transactional Outbox, Saga, CQRS and Event Sourcing are absent from the table on purpose: this
service answers synchronously, persists to one relational database and introduces no queue
(`constraints/diagnosis-answers-synchronously`,
`constraints/the-system-persists-to-one-relational-database`, STK-12), so none of them has a
trigger here.

## Tests

14. Every adapter has one integration test against the real technology — PostgreSQL for a
    `*-store.repository.ts`, the recorded provider answers the `fake-*.adapter.ts` files replay for
    an Anthropic adapter — verifying the port it implements. — An adapter tested only
    against a stand-in is proven against nothing it will meet. — **reading**.
15. A service test runs with in-memory adapters and covers the transaction boundary and every
    error the service raises. — Those are what the service owns; authentication is none of it
    (`constraints/no-route-enforces-authentication`). — **reading**.
16. Every invariant a rule of the specification states has a test that violates it and expects the
    refusal. — An invariant without a violating test is a sentence. — **reading**.

## Not this registry's — Architecture Constraints for `/analyse`

The standard's contract excludes any rule stating an integration or architecture strategy that
constrains the solution as a whole. These are written into `knowledge/constraints/` with
`scope: system`, and the step that checks each one names it in the registry's `commands[].decides`.

Enter:

- One transaction persists one aggregate; a rule that reaches across aggregates converges
  eventually. EDG-05 holds a multi-statement write to one transaction and says nothing about how
  many aggregates it may touch.
- No network call — the model provider, an observation source — happens inside an open database
  transaction; the order is transaction, commit, then effect.

Decide from the material before writing:

- Every aggregate root carries a version, and a write on a stale version is refused, never
  overwritten. Case versions and released hypothesis revisions already carry versions; whether
  concurrent writers exist is the question.
- A write route carries a client-supplied idempotency key and answers a repeat with the first
  answer. There is no message consumer; the question is whether HTTP clients retry.

Left out, with the constraint that already decides against each: transactional outbox and saga
(`diagnosis-answers-synchronously`, STK-12: no queue); separate read and write models and an
event store (`the-system-persists-to-one-relational-database`); reads bypassing the domain
(`a-case-is-read-whole` decides the case read, and rule 9 covers listings).
