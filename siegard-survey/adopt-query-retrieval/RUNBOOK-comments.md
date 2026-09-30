# Runbook — the comment route, then a second adoption over the files it touched

After the re-fold (`adopt-query-retrieval-r2`), 21 candidates stay unbound because a
`contradicts` finding stands against each. Many of those findings cite a comment restating the
node's fact. Comments leave the tree by the comment route: the source changed directly, removal
never refresh, and the file reconciled after. From 4.21.0 on, a judge files text restating a
fact the code holds as `restates`, which blocks no binding, so what remains `contradicts` after
this runbook is a real difference between code and node.

Plugin: siegard **4.21.0** or later. `P` is its installed root. Append every command and its
verbatim output to `siegard-survey/adopt-query-retrieval/RESULTS.md` under
`## Comment route and second adoption`. Stop where this runbook says stop.

## Step 1 — precondition

The re-fold must be committed. `git status --porcelain -- siegard-trace.json siegard-reconcile
backend specification` must print nothing. Otherwise stop and ask the human to commit it.

## Step 2 — classify every finding

From `siegard-reconcile/adopt-query-retrieval-r2.md`, list every `contradicts` finding (each
non-cleared node's `how`) in a table: file, where, node, and what the evidence is —

- **comment** — a `//` or `/* */` comment or a docstring;
- **emitted text** — a string the running system sends someone: a tool description, an error
  message, a log line;
- **code** — anything else.

Record the table. Only the first class takes the comment route.

## Step 3 — remove the comments

For every file with at least one **comment** finding, deliver the file whole under the session
rule: remove every comment in it — not only the one the finding cites — keeping only a directive
a named tool consumes (for example `// @ts-expect-error`, `/* eslint-disable ... */`). Removal,
never refresh: no comment is rewritten, moved or shortened. Change nothing else: no code, no
emitted text, no formatting beyond deleting the comment lines and blank lines they leave.

Record the list of files changed and `git diff --stat -- backend`. Then stop and ask the human
to review the diff and commit it, with pathspec those files only. Record the commit id.

## Step 4 — the second adoption

Invoke `/siegard:reconcile` as an adoption:

- **slug:** `adopt-query-retrieval-r3`
- **file set:** the files changed in step 3
- **candidates:** the 21 nodes that carry `conforms: false` in
  `siegard-reconcile/adopt-query-retrieval-r2.md`
- **outside:** none; **certifications:** none

These files are already bound by r2, so their standing bindings drift (the content changed) and
are judged too; that is the skill's ordinary behavior. Record the report verbatim, the number of
judges run, and every return the fold refused.

## Step 5 — what changed

```
python3 -B $P/bin/trace.py --reconciliation siegard-reconcile/adopt-query-retrieval-r3.md
python3 -B $P/bin/trace.py --owed backend
python3 -B $P/bin/trace.py --untraced backend
python3 -B $P/bin/trace.py --convergence backend specification siegard-work
python3 -B $P/bin/trace.py --check backend
```

Record, from the r3 record: candidates cleared now; `restates` findings; `contradicts` that
remain, each with one line saying what the difference is. Compare with step 2's table: every
**comment** finding should be gone, every **emitted text** finding should now be `restates`
where the code holds the fact, and what is left should be **code**.

Tokens: `telemetry.py --probe --since <step 4 start>`, announce, then run; record per judge and
the total.

## Step 6 — stop

Stop and ask the human to review and commit, with pathspec
`siegard-trace.json siegard-reconcile siegard-survey/adopt-query-retrieval siegard-telemetry`.
