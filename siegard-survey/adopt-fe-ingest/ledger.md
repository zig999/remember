---
contract_version: siegard-ledger/1
material:
- boundary.md
- ui.md
entries:
- at: boundary.md:25
  outside: "the address of the back end is the application's own configuration, which belongs to the increment that adopts the shared configuration"
- at: boundary.md:26
  node: rules/ingest-workspace/ingestion-request-carries-the-access-token
- at: boundary.md:27
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:28
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:29
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:30
  node: rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
- at: boundary.md:30
  node: rules/ingest-workspace/extraction-has-no-client-cutoff
- at: boundary.md:31
  node: rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
- at: boundary.md:32
  outside: "the four conditions are mutually exclusive, so the order in which the client checks them changes no answer"
- at: boundary.md:37
  outside: "an absence in the code: where an error code leads is decided by the callers of the hooks, which the ui area states"
- at: boundary.md:40
  node: rules/ingest-workspace/first-unauthorized-answer-refreshes-the-token-once
- at: boundary.md:40
  node: scenarios/ingest-workspace/expired-token-is-refreshed-once-and-resent
- at: boundary.md:41
  node: rules/ingest-workspace/unrefreshable-session-ends-at-sign-in
- at: boundary.md:41
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:42
  node: rules/ingest-workspace/resent-request-never-refreshes-again
- at: boundary.md:42
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:45
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:46
  outside: "an absence in the hook's variables of an optional field no screen supplies; nothing the owner reads or does"
- at: boundary.md:47
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:48
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:53
  outside: "the internal representation of an optional list, which changes nothing the owner reads"
- at: boundary.md:54
  outside: "module wiring: what happens after an outcome is the ui area's fact"
- at: boundary.md:57
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:58
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:59
  node: rules/ingest-workspace/extraction-has-no-client-cutoff
- at: boundary.md:62
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:63
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:64
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:65
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:68
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:69
  node: rules/ingest-workspace/run-is-read-only-with-an-identity-and-the-gate
- at: boundary.md:70
  node: rules/ingest-workspace/run-is-polled-every-five-seconds
- at: boundary.md:73
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:79
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:79
  node: domain/knowledge-base/run-summary
- at: boundary.md:80
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:81
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:82
  outside: "the internal representation of the run status as received, which changes nothing the owner reads"
- at: boundary.md:85
  node: rules/ingest-workspace/assembly-traverses-each-affected-node
- at: boundary.md:85
  node: contracts/ingest-workspace/bff-traversal
- at: boundary.md:86
  node: contracts/ingest-workspace/bff-traversal
- at: boundary.md:87
  node: rules/ingest-workspace/assembly-replaces-the-graph-only-when-every-traversal-succeeds
- at: boundary.md:88
  node: rules/ingest-workspace/assembly-of-no-nodes-is-an-empty-ready-graph
- at: boundary.md:89
  node: rules/ingest-workspace/failed-traversal-leaves-the-graph-as-it-was
- at: boundary.md:89
  node: contracts/ingest-workspace/bff-traversal
- at: boundary.md:90
  outside: "hook progress counters, wiring the screen discards"
- at: boundary.md:91
  node: rules/ingest-workspace/assembled-node-is-labelled-by-its-canonical-name
- at: boundary.md:91
  node: rules/ingest-workspace/assembled-neighbour-state-comes-from-its-status
- at: boundary.md:92
  node: rules/ingest-workspace/assembled-node-is-labelled-by-its-canonical-name
- at: boundary.md:92
  node: rules/ingest-workspace/assembled-neighbour-state-comes-from-its-status
- at: boundary.md:93
  node: rules/ingest-workspace/assembled-node-keeps-the-entry-it-got-first
- at: boundary.md:94
  node: rules/ingest-workspace/assembled-link-is-kept-once-by-identity
- at: boundary.md:95
  node: rules/ingest-workspace/assembled-link-carries-only-what-the-bff-states
- at: boundary.md:102
  node: rules/ingest-workspace/ingestion-request-times-out-after-thirty-seconds
- at: boundary.md:102
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:103
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:104
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:105
  node: rules/ingest-workspace/unrefreshable-session-ends-at-sign-in
- at: boundary.md:105
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:106
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:107
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:108
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:109
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:110
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:111
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:112
  node: contracts/ingest-workspace/bff-traversal
- at: boundary.md:112
  node: rules/ingest-workspace/failed-traversal-leaves-the-graph-as-it-was
- at: boundary.md:115
  node: domain/knowledge-base/source-type
- at: boundary.md:116
  node: domain/knowledge-base/run-status
- at: boundary.md:117
  node: contracts/knowledge-base/ingestion
- at: boundary.md:118
  node: domain/knowledge-base/node-status
- at: boundary.md:119
  node: domain/knowledge-base/assertion-flag
- at: boundary.md:120
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:124
  node: contracts/ingest-workspace/bff-ingestion
- at: boundary.md:125
  node: contracts/ingest-workspace/bff-traversal
- at: boundary.md:128
  outside: "the auth feature's token fetch is wiring the owner-access increment already holds as the identity provider contract"
- at: boundary.md:129
  outside: "the store that holds the token belongs to the increment that adopts the shared state"
- at: boundary.md:130
  outside: "the address of the back end is the application's own configuration, which belongs to the increment that adopts the shared configuration"
- at: boundary.md:131
  outside: "the shared failure class belongs to the increment that adopts the shared transport"
- at: boundary.md:132
  outside: "the graph display store and its mappings belong to the increment that adopts the graph feature"
- at: ui.md:34
  node: rules/ingest-workspace/selected-node-detail-replaces-the-graph
- at: ui.md:35
  node: rules/ingest-workspace/selected-node-detail-replaces-the-graph
- at: ui.md:36
  node: rules/ingest-workspace/ingest-requires-content
- at: ui.md:36
  node: rules/ingest-workspace/ingest-requires-source-type
- at: ui.md:36
  node: rules/ingest-workspace/content-is-checked-before-source-type
- at: ui.md:36
  node: rules/ingest-workspace/new-source-starts-extraction-at-once
- at: ui.md:36
  node: rules/ingest-workspace/known-content-waits-for-the-owner
- at: ui.md:37
  node: contracts/ingest-workspace/bff-ingestion
- at: ui.md:38
  node: rules/ingest-workspace/recorded-source-keeps-the-run-identity
- at: ui.md:38
  node: domain/ingest-workspace/ingest-session
- at: ui.md:39
  node: rules/ingest-workspace/known-content-waits-for-the-owner
- at: ui.md:39
  node: rules/ingest-workspace/noop-keeps-the-affected-nodes
- at: ui.md:40
  node: rules/ingest-workspace/new-source-starts-extraction-at-once
- at: ui.md:41
  node: rules/ingest-workspace/extraction-answer-moves-to-revealing
- at: ui.md:42
  node: rules/ingest-workspace/revealing-completes-when-the-graph-is-ready
- at: ui.md:43
  node: rules/ingest-workspace/existing-graph-is-assembled-on-request
- at: ui.md:44
  node: rules/ingest-workspace/another-document-clears-the-session
- at: ui.md:44
  node: domain/ingest-workspace/ingest-session
- at: ui.md:47
  node: rules/ingest-workspace/form-is-ready-with-content-and-source-type
- at: ui.md:47
  node: scenarios/ingest-workspace/whitespace-only-content-is-ready
- at: ui.md:48
  node: rules/ingest-workspace/editing-changes-the-phase-only-in-idle-and-ready
- at: ui.md:49
  node: rules/ingest-workspace/submit-needs-the-ready-phase
- at: ui.md:49
  node: rules/ingest-workspace/submit-control-shows-in-idle-ready-and-sending
- at: ui.md:50
  node: rules/ingest-workspace/submission-clears-earlier-messages
- at: ui.md:51
  node: rules/ingest-workspace/fields-are-editable-outside-a-run
- at: ui.md:52
  node: rules/ingest-workspace/fields-are-editable-outside-a-run
- at: ui.md:52
  node: rules/ingest-workspace/submit-control-shows-in-idle-ready-and-sending
- at: ui.md:52
  node: rules/ingest-workspace/retry-without-a-run-submits-again
- at: ui.md:55
  node: rules/ingest-workspace/file-area-shows-only-in-idle-and-ready
- at: ui.md:56
  node: rules/ingest-workspace/disabled-file-area-ignores-input
- at: ui.md:57
  node: rules/ingest-workspace/only-the-first-file-is-used
- at: ui.md:58
  node: rules/ingest-workspace/only-text-files-are-accepted
- at: ui.md:59
  outside: "the file picker's filter is the browser's hint and not what the screen accepts; the difference from the accepted types is a watch item"
- at: ui.md:60
  outside: "an absence of a size limit and the way the file is read are implementation, not something the owner is told"
- at: ui.md:61
  node: rules/ingest-workspace/file-read-replaces-the-content
- at: ui.md:61
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:62
  outside: "input reset wiring that lets the same file be picked twice"
- at: ui.md:63
  node: rules/ingest-workspace/rejection-stays-until-a-file-is-read
- at: ui.md:66
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:67
  outside: "accessibility attribute of the progress region, surface"
- at: ui.md:70
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:71
  node: rules/ingest-workspace/outcome-shows-the-seven-counts-in-order
- at: ui.md:71
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:72
  node: rules/ingest-workspace/review-count-points-to-curation
- at: ui.md:72
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:73
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:76
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:79
  node: rules/ingest-workspace/connection-drop-polls-the-run
- at: ui.md:80
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- at: ui.md:81
  node: rules/ingest-workspace/failure-outside-an-envelope-is-no-connection-drop
- at: ui.md:82
  node: rules/ingest-workspace/polled-completed-run-moves-to-revealing
- at: ui.md:83
  node: rules/ingest-workspace/polled-failed-run-ends-in-run-failed
- at: ui.md:84
  node: rules/ingest-workspace/polled-running-run-keeps-the-screen-waiting
- at: ui.md:85
  node: rules/ingest-workspace/only-extraction-failures-count-as-connection-drops
- at: ui.md:88
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:89
  node: rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
- at: ui.md:90
  node: rules/ingest-workspace/failure-envelope-shows-its-own-code-and-message
- at: ui.md:90
  node: rules/ingest-workspace/failure-outside-an-envelope-shows-the-unknown-code
- at: ui.md:90
  node: domain/ingest-workspace/ingest-failure
- at: ui.md:91
  node: rules/ingest-workspace/retry-without-a-run-submits-again
- at: ui.md:92
  node: rules/ingest-workspace/retry-with-a-run-retries-then-extracts
- at: ui.md:95
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:95
  node: rules/ingest-workspace/only-text-files-are-accepted
- at: ui.md:96
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:96
  node: rules/ingest-workspace/ingest-requires-content
- at: ui.md:97
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:97
  node: rules/ingest-workspace/ingest-requires-source-type
- at: ui.md:97
  node: rules/ingest-workspace/content-is-checked-before-source-type
- at: ui.md:98
  node: rules/ingest-workspace/only-extraction-failures-count-as-connection-drops
- at: ui.md:98
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:99
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- at: ui.md:99
  node: scenarios/ingest-workspace/conflicting-extraction-shows-the-failure
- at: ui.md:100
  node: rules/ingest-workspace/connection-drop-polls-the-run
- at: ui.md:100
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- at: ui.md:100
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:101
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- at: ui.md:101
  node: rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
- at: ui.md:102
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- at: ui.md:103
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- at: ui.md:104
  node: rules/ingest-workspace/connection-drop-is-an-unconflicting-envelope
- at: ui.md:104
  node: scenarios/ingest-workspace/internal-error-during-extraction-polls-the-run
- at: ui.md:105
  node: rules/ingest-workspace/failure-outside-an-envelope-shows-the-unknown-code
- at: ui.md:105
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:106
  node: rules/ingest-workspace/polled-failed-run-ends-in-run-failed
- at: ui.md:106
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:107
  node: rules/ingest-workspace/only-extraction-failures-count-as-connection-drops
- at: ui.md:108
  node: rules/ingest-workspace/retry-with-a-run-retries-then-extracts
- at: ui.md:108
  node: rules/ingest-workspace/connection-drop-polls-the-run
- at: ui.md:109
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:112
  node: domain/ingest-workspace/ingest-phase
- at: ui.md:113
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:113
  node: domain/knowledge-base/source-type
- at: ui.md:114
  node: contracts/ingest-workspace/ingest-screen
- at: ui.md:114
  node: rules/ingest-workspace/outcome-shows-the-seven-counts-in-order
- at: ui.md:115
  node: rules/ingest-workspace/retry-is-offered-only-for-retryable-codes
- at: ui.md:116
  node: rules/ingest-workspace/polled-failed-run-ends-in-run-failed
- at: ui.md:116
  node: rules/ingest-workspace/failure-outside-an-envelope-shows-the-unknown-code
- at: ui.md:117
  node: domain/knowledge-base/run-status
- at: ui.md:117
  node: rules/ingest-workspace/polled-completed-run-moves-to-revealing
- at: ui.md:117
  node: rules/ingest-workspace/polled-failed-run-ends-in-run-failed
- at: ui.md:118
  node: rules/ingest-workspace/known-content-waits-for-the-owner
- at: ui.md:118
  node: rules/ingest-workspace/new-source-starts-extraction-at-once
- at: ui.md:118
  node: contracts/knowledge-base/ingestion
- at: ui.md:121
  node: contracts/ingest-workspace/bff-ingestion
- at: ui.md:122
  node: contracts/ingest-workspace/bff-ingestion
- at: ui.md:123
  node: contracts/ingest-workspace/bff-ingestion
- at: ui.md:124
  node: contracts/ingest-workspace/bff-ingestion
- at: ui.md:125
  node: contracts/ingest-workspace/bff-traversal
- at: ui.md:126
  outside: "the shared failure class belongs to the increment that adopts the shared transport"
- at: ui.md:127
  outside: "the graph feature's store belongs to the increment that adopts the graph feature"
- at: ui.md:128
  node: domain/knowledge-base/run-summary
- at: ui.md:128
  node: rules/ingest-workspace/outcome-shows-the-seven-counts-in-order
---
