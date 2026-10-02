---
contract_version: siegard-ledger/1
material:
- boundary.md
- logic.md
- widgets.md
- correction-provenance.md
- decision-panel.md
- page-queue.md
entries:
- at: boundary.md:18
  node: rules/curation-workspace/curation-request-carries-the-access-token
- at: boundary.md:19
  node: rules/curation-workspace/curation-request-times-out-after-thirty-seconds
- at: boundary.md:20
  node: rules/curation-workspace/reading-the-answer-body-has-no-cutoff
- at: boundary.md:21
  node: rules/curation-workspace/caller-cancellation-ends-the-request
- at: boundary.md:22
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:23
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:24
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:25
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:26
  outside: "the four conditions are mutually exclusive, so the order in which the helper checks them changes no answer"
- at: boundary.md:27
  node: rules/curation-workspace/first-unauthorized-curation-answer-refreshes-the-token-once
- at: boundary.md:28
  node: rules/curation-workspace/resent-curation-request-never-refreshes-again
- at: boundary.md:29
  node: rules/curation-workspace/resent-curation-request-never-refreshes-again
- at: boundary.md:30
  node: rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in
- at: boundary.md:30
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:33
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:34
  node: rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
- at: boundary.md:35
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: boundary.md:36
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: boundary.md:37
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:38
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:39
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:40
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:41
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:42
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:43
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:46
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:47
  node: rules/curation-workspace/metrics-stay-fresh-for-thirty-seconds
- at: boundary.md:48
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:48
  node: domain/knowledge-base/curation-metrics
- at: boundary.md:51
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:52
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:53
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:54
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:55
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:56
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:57
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:58
  node: rules/curation-workspace/successful-action-refreshes-the-queue-and-the-metrics
- at: boundary.md:59
  node: rules/curation-workspace/entity-match-resolution-refreshes-the-node-details
- at: boundary.md:60
  node: rules/curation-workspace/merge-refreshes-both-node-details
- at: boundary.md:61
  node: rules/curation-workspace/dispute-resolution-refreshes-the-provenance-of-its-items
- at: boundary.md:62
  node: rules/curation-workspace/confirmation-or-rejection-refreshes-the-provenance-of-the-item
- at: boundary.md:63
  node: rules/curation-workspace/correction-refreshes-the-provenance-and-the-history
- at: boundary.md:64
  node: rules/curation-workspace/link-items-use-link-reads-and-others-attribute-reads
- at: boundary.md:65
  outside: "an absence: which cached reads an action leaves alone is the consequence of the invalidation rules, not a separate obligation"
- at: boundary.md:71
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:72
  node: rules/curation-workspace/node-detail-sends-its-options-only-when-asked
- at: boundary.md:72
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:73
  node: rules/curation-workspace/read-without-an-identifier-is-not-requested
- at: boundary.md:74
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: boundary.md:75
  node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
- at: boundary.md:76
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:77
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:78
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:79
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:81
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:82
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:83
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:86
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:87
  node: rules/curation-workspace/read-without-an-identifier-is-not-requested
- at: boundary.md:87
  node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
- at: boundary.md:88
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:89
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:90
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:91
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:92
  node: rules/curation-workspace/read-without-an-identifier-is-not-requested
- at: boundary.md:93
  outside: "wire detail of how an empty filter parameter is sent, which changes nothing the owner reads"
- at: boundary.md:94
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: boundary.md:95
  node: rules/curation-workspace/stable-reads-stay-fresh-for-five-minutes
- at: boundary.md:96
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:97
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:98
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:101
  node: rules/curation-workspace/invalid-date-in-an-answer-fails-the-read
- at: boundary.md:102
  node: rules/curation-workspace/invalid-date-in-an-answer-fails-the-read
- at: boundary.md:105
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: boundary.md:106
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: boundary.md:107
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: boundary.md:110
  node: rules/curation-workspace/curation-request-times-out-after-thirty-seconds
- at: boundary.md:110
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:111
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:112
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:113
  node: rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in
- at: boundary.md:113
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:114
  node: rules/curation-workspace/first-unauthorized-curation-answer-refreshes-the-token-once
- at: boundary.md:115
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:116
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:117
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:118
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:119
  node: rules/curation-workspace/invalid-date-in-an-answer-fails-the-read
- at: boundary.md:122
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:123
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:124
  node: rules/curation-workspace/link-items-use-link-reads-and-others-attribute-reads
- at: boundary.md:125
  node: rules/curation-workspace/unrefreshable-curation-session-ends-at-sign-in
- at: boundary.md:128
  node: contracts/curation-workspace/bff-curation
- at: boundary.md:129
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:130
  node: contracts/curation-workspace/bff-curation-reads
- at: boundary.md:131
  outside: "the identity provider's token mint is held by the owner-access contract and reached through the auth feature, which is wiring here"
- at: boundary.md:132
  outside: "the store that holds the token belongs to the increment that adopts the shared state"
- at: boundary.md:133
  outside: "the application's own configuration of the back end address belongs to the increment that adopts the shared configuration"
- at: logic.md:18
  node: rules/curation-workspace/shortcuts-listen-on-the-whole-window
- at: logic.md:19
  node: rules/curation-workspace/keyboard-shortcuts-act-only-while-enabled
- at: logic.md:20
  node: rules/curation-workspace/keys-typed-into-a-field-are-no-shortcut
- at: logic.md:21
  node: rules/curation-workspace/keys-typed-into-a-field-are-no-shortcut
- at: logic.md:22
  node: rules/curation-workspace/modified-keys-are-no-shortcut
- at: logic.md:23
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:24
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:25
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:26
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:27
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:28
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:29
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:30
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:31
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:32
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:33
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:34
  node: rules/curation-workspace/shortcut-letters-act-in-lower-case-only
- at: logic.md:35
  node: rules/curation-workspace/unwired-shortcut-does-nothing
- at: logic.md:36
  node: rules/curation-workspace/wired-shortcuts-stop-the-default-except-help
- at: logic.md:39
  node: contracts/curation-workspace/bff-curation
- at: logic.md:39
  node: rules/curation-workspace/curation-request-carries-the-access-token
- at: logic.md:40
  node: rules/curation-workspace/queue-kind-is-sent-only-when-chosen
- at: logic.md:41
  node: rules/curation-workspace/queue-read-asks-the-first-page-of-twenty
- at: logic.md:42
  node: rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
- at: logic.md:43
  node: rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
- at: logic.md:44
  node: rules/curation-workspace/queue-is-read-again-on-every-read-poll-and-focus
- at: logic.md:45
  node: rules/curation-workspace/queue-keeps-the-answered-order
- at: logic.md:48
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: logic.md:49
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: logic.md:50
  node: rules/curation-workspace/each-decision-uses-the-action-of-its-kind
- at: logic.md:51
  node: rules/curation-workspace/each-decision-uses-the-action-of-its-kind
- at: logic.md:52
  node: rules/curation-workspace/each-decision-uses-the-action-of-its-kind
- at: logic.md:55
  node: rules/curation-workspace/destructive-decision-removes-the-item-at-once
- at: logic.md:56
  node: rules/curation-workspace/destructive-decision-opens-the-undo-toast
- at: logic.md:57
  node: rules/curation-workspace/undo-window-is-five-seconds
- at: logic.md:58
  node: rules/curation-workspace/undo-restores-the-item-and-sends-nothing
- at: logic.md:58
  node: rules/curation-workspace/undo-keeps-the-selection-and-the-count
- at: logic.md:60
  node: rules/curation-workspace/one-destructive-decision-waits-at-a-time
- at: logic.md:61
  node: rules/curation-workspace/leaving-sends-the-pending-decision-at-once
- at: logic.md:62
  node: rules/curation-workspace/pending-decision-lives-in-memory-only
- at: logic.md:63
  node: rules/curation-workspace/decision-removes-its-item-by-its-identifier
- at: logic.md:66
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: logic.md:67
  node: rules/curation-workspace/immediate-success-confirms-and-moves-on
- at: logic.md:68
  node: rules/curation-workspace/destructive-success-shows-no-notice-and-moves-on
- at: logic.md:69
  node: rules/curation-workspace/decision-removes-its-item-by-its-identifier
- at: logic.md:75
  node: rules/curation-workspace/moving-on-selects-the-next-item-and-counts-it
- at: logic.md:76
  node: rules/curation-workspace/destructive-decision-moves-on-twice
- at: logic.md:77
  node: rules/curation-workspace/sending-a-decision-clears-the-previous-failure
- at: logic.md:78
  node: rules/curation-workspace/decision-shows-as-sending-until-answered
- at: logic.md:81
  node: rules/curation-workspace/failed-decision-is-read-in-order
- at: logic.md:88
  node: rules/curation-workspace/field-code-wins-over-the-server-status
- at: logic.md:89
  node: rules/curation-workspace/refused-destructive-decision-restores-its-item
- at: logic.md:90
  node: rules/curation-workspace/vanished-item-is-not-restored
- at: logic.md:93
  node: rules/curation-workspace/display-mode-is-decided-from-the-entry-alone
- at: logic.md:94
  node: rules/curation-workspace/entity-match-shows-summary-for-one-high-similarity-candidate
- at: logic.md:95
  node: rules/curation-workspace/dispute-shows-summary-for-two-sides-with-an-end
- at: logic.md:98
  node: domain/curation-workspace/selected-item
- at: logic.md:99
  node: rules/curation-workspace/selecting-another-item-clears-the-evidence-mark
- at: logic.md:100
  node: rules/curation-workspace/selecting-the-same-item-changes-nothing
- at: logic.md:101
  node: rules/curation-workspace/selecting-another-item-clears-the-evidence-mark
- at: logic.md:102
  node: rules/curation-workspace/resolved-count-starts-at-zero
- at: logic.md:102
  node: rules/curation-workspace/moving-on-selects-the-next-item-and-counts-it
- at: logic.md:103
  node: rules/curation-workspace/last-seen-total-starts-empty-and-follows-changes
- at: logic.md:104
  node: rules/curation-workspace/checked-set-starts-empty-and-is-replaced-whole
- at: logic.md:105
  node: rules/curation-workspace/reset-restores-the-starting-values
- at: logic.md:106
  node: rules/curation-workspace/session-state-is-not-persisted
- at: logic.md:109
  node: rules/curation-workspace/selected-item-is-carried-in-the-address
- at: logic.md:110
  node: rules/curation-workspace/unreadable-item-link-selects-nothing
- at: logic.md:114
  node: rules/curation-workspace/item-id-is-everything-after-the-first-colon
- at: logic.md:115
  node: rules/curation-workspace/no-selection-leaves-no-item-parameter
- at: logic.md:118
  node: contracts/curation-workspace/bff-curation
- at: logic.md:118
  node: domain/knowledge-base/entity-match-review
- at: logic.md:123
  node: contracts/curation-workspace/bff-curation
- at: logic.md:123
  node: domain/knowledge-base/dispute-scope
- at: logic.md:124
  node: contracts/curation-workspace/bff-curation
- at: logic.md:134
  node: contracts/curation-workspace/curation-screen
- at: logic.md:134
  node: rules/curation-workspace/failure-without-an-envelope-leaves-the-item-removed
- at: logic.md:135
  node: contracts/curation-workspace/curation-screen
- at: logic.md:136
  node: contracts/curation-workspace/curation-screen
- at: logic.md:137
  node: contracts/curation-workspace/curation-screen
- at: logic.md:138
  node: contracts/curation-workspace/curation-screen
- at: logic.md:139
  node: contracts/curation-workspace/curation-screen
- at: logic.md:140
  node: contracts/curation-workspace/curation-screen
- at: logic.md:141
  node: contracts/curation-workspace/curation-screen
- at: logic.md:142
  node: contracts/curation-workspace/curation-screen
- at: logic.md:153
  node: contracts/curation-workspace/curation-screen
- at: logic.md:154
  node: contracts/curation-workspace/curation-screen
- at: logic.md:155
  node: contracts/curation-workspace/curation-screen
- at: logic.md:158
  node: domain/curation-workspace/curation-shortcut
- at: logic.md:158
  node: rules/curation-workspace/shortcut-keys-have-fixed-meanings
- at: logic.md:159
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: logic.md:160
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: logic.md:161
  node: contracts/curation-workspace/curation-screen
- at: logic.md:162
  node: contracts/curation-workspace/curation-screen
- at: logic.md:163
  node: contracts/curation-workspace/curation-screen
- at: logic.md:164
  node: domain/curation-workspace/display-mode
- at: logic.md:165
  node: domain/curation-workspace/selected-item
- at: logic.md:166
  node: domain/knowledge-base/review-queue-kind
- at: logic.md:167
  node: domain/knowledge-base/item-kind
- at: logic.md:168
  node: domain/knowledge-base/entity-match-decision
- at: logic.md:169
  node: domain/knowledge-base/dispute-decision
- at: logic.md:170
  node: domain/knowledge-base/node-status
- at: logic.md:171
  node: domain/knowledge-base/assertion-status
- at: logic.md:172
  node: domain/knowledge-base/effective-status
- at: logic.md:173
  node: domain/knowledge-base/valid-from-basis
- at: logic.md:174
  node: domain/knowledge-base/assertion-flag
- at: logic.md:175
  node: domain/knowledge-base/value-type
- at: logic.md:176
  node: domain/knowledge-base/alias-kind
- at: logic.md:179
  node: contracts/curation-workspace/bff-curation
- at: logic.md:180
  node: contracts/curation-workspace/bff-curation
- at: logic.md:187
  node: contracts/curation-workspace/bff-curation
- at: logic.md:193
  node: contracts/curation-workspace/bff-curation
- at: logic.md:193
  node: domain/knowledge-base/curation-metrics
- at: logic.md:202
  node: contracts/curation-workspace/bff-curation
- at: logic.md:203
  node: contracts/curation-workspace/bff-curation
- at: logic.md:205
  node: contracts/curation-workspace/bff-curation
- at: logic.md:206
  node: contracts/curation-workspace/bff-curation
- at: logic.md:207
  node: contracts/curation-workspace/bff-curation
- at: logic.md:214
  node: contracts/curation-workspace/bff-curation
- at: logic.md:216
  node: contracts/curation-workspace/bff-curation
- at: logic.md:217
  node: contracts/curation-workspace/bff-curation
- at: logic.md:218
  node: contracts/curation-workspace/bff-curation
- at: logic.md:219
  node: contracts/curation-workspace/bff-curation
- at: logic.md:221
  node: contracts/curation-workspace/bff-curation
- at: logic.md:222
  node: contracts/curation-workspace/bff-curation-reads
- at: logic.md:225
  node: contracts/curation-workspace/bff-curation-reads
- at: logic.md:228
  node: contracts/curation-workspace/bff-curation-reads
- at: logic.md:233
  node: contracts/curation-workspace/bff-curation-reads
- at: logic.md:236
  node: contracts/curation-workspace/bff-curation-reads
- at: widgets.md:26
  node: rules/curation-workspace/batch-bar-needs-two-items
- at: widgets.md:27
  node: rules/curation-workspace/batch-bar-acts-on-one-kind
- at: widgets.md:27
  node: domain/curation-workspace/batch-kind
- at: widgets.md:28
  node: rules/curation-workspace/batch-bar-shows-the-count
- at: widgets.md:29
  node: rules/curation-workspace/batch-bar-offers-to-clear-the-selection
- at: widgets.md:30
  node: rules/curation-workspace/batch-bar-actions-follow-the-kind
- at: widgets.md:31
  node: rules/curation-workspace/batch-bar-actions-follow-the-kind
- at: widgets.md:32
  node: rules/curation-workspace/batch-bar-actions-follow-the-kind
- at: widgets.md:32
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:33
  node: rules/curation-workspace/rejecting-five-or-more-asks-first
- at: widgets.md:35
  node: rules/curation-workspace/rejecting-five-or-more-asks-first
- at: widgets.md:36
  node: rules/curation-workspace/inline-confirmation-confirms-or-cancels
- at: widgets.md:37
  node: rules/curation-workspace/pending-confirmation-survives-a-selection-change
- at: widgets.md:38
  node: rules/curation-workspace/submitting-batch-shows-busy-buttons
- at: widgets.md:41
  node: rules/curation-workspace/drawer-holds-one-queue-item
- at: widgets.md:42
  node: rules/curation-workspace/drawer-closes-on-esc-close-backdrop-or-removal
- at: widgets.md:43
  node: rules/curation-workspace/drawer-shows-the-callers-label
- at: widgets.md:44
  node: rules/curation-workspace/drawer-reads-the-queue-only-while-open
- at: widgets.md:45
  node: rules/curation-workspace/drawer-finds-its-item-in-the-queue-listing
- at: widgets.md:46
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:47
  node: rules/curation-workspace/drawer-never-changes-the-address
- at: widgets.md:47
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:48
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: widgets.md:49
  node: rules/curation-workspace/drawer-has-no-next-item
- at: widgets.md:50
  node: rules/curation-workspace/undo-keeps-the-drawer-open
- at: widgets.md:51
  node: rules/curation-workspace/drawer-entity-match-decisions-are-enabled-at-once
- at: widgets.md:52
  node: rules/curation-workspace/drawer-dispute-decisions-wait-for-the-evidence
- at: widgets.md:53
  node: rules/curation-workspace/drawer-shares-the-evidence-flag
- at: widgets.md:54
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: widgets.md:54
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: widgets.md:55
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: widgets.md:55
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: widgets.md:55
  node: rules/curation-workspace/preference-removes-its-item-by-the-first-id
- at: widgets.md:56
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: widgets.md:57
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: widgets.md:57
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: widgets.md:57
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: widgets.md:60
  node: rules/curation-workspace/metrics-strip-shows-five-metrics-in-order
- at: widgets.md:61
  node: rules/curation-workspace/acceptance-rate-shows-as-a-whole-percentage
- at: widgets.md:62
  node: rules/curation-workspace/metrics-strip-hides-the-reject-rate-and-the-time
- at: widgets.md:63
  node: rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals
- at: widgets.md:64
  node: rules/curation-workspace/failed-metrics-never-fail-the-strip
- at: widgets.md:65
  node: rules/curation-workspace/metrics-strip-shows-placeholders-until-settled
- at: widgets.md:68
  node: rules/curation-workspace/stale-banner-says-the-item-changed
- at: widgets.md:68
  node: rules/curation-workspace/stale-item-shows-the-notice-with-a-reload
- at: widgets.md:69
  node: rules/curation-workspace/stale-banner-is-a-non-blocking-alert
- at: widgets.md:72
  node: rules/curation-workspace/undo-window-is-five-seconds
- at: widgets.md:73
  node: rules/curation-workspace/undo-toast-counts-down-in-whole-seconds
- at: widgets.md:74
  node: rules/curation-workspace/undo-toast-only-reports-the-undo
- at: widgets.md:77
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:78
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:79
  outside: "loading, a failed read and a missing item are mutually exclusive states, so the order in which the drawer checks them changes no answer"
- at: widgets.md:80
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:80
  node: rules/curation-workspace/batch-bar-actions-follow-the-kind
- at: widgets.md:81
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:81
  node: rules/curation-workspace/rejecting-five-or-more-asks-first
- at: widgets.md:82
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:82
  node: rules/curation-workspace/failed-metrics-fall-back-to-the-queue-totals
- at: widgets.md:85
  node: domain/curation-workspace/batch-kind
- at: widgets.md:86
  node: rules/curation-workspace/batch-bar-actions-follow-the-kind
- at: widgets.md:87
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:88
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: widgets.md:88
  node: contracts/curation-workspace/curation-screen
- at: widgets.md:89
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: widgets.md:89
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: widgets.md:90
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: widgets.md:93
  node: contracts/curation-workspace/bff-curation
- at: widgets.md:94
  node: rules/curation-workspace/drawer-finds-its-item-in-the-queue-listing
- at: widgets.md:95
  node: contracts/curation-workspace/bff-curation
- at: widgets.md:96
  node: rules/curation-workspace/drawer-never-changes-the-address
- at: correction-provenance.md:21
  node: rules/curation-workspace/correction-asks-for-a-value-or-a-target
- at: correction-provenance.md:22
  node: rules/curation-workspace/correction-fields-start-from-the-item
- at: correction-provenance.md:23
  node: rules/curation-workspace/empty-correction-field-is-sent-as-null
- at: correction-provenance.md:24
  node: rules/curation-workspace/attribute-correction-needs-a-value
- at: correction-provenance.md:25
  node: rules/curation-workspace/link-correction-needs-a-target
- at: correction-provenance.md:26
  node: rules/curation-workspace/correction-dates-have-the-iso-shape
- at: correction-provenance.md:27
  node: rules/curation-workspace/correction-start-precedes-the-end
- at: correction-provenance.md:28
  node: rules/curation-workspace/stated-basis-needs-a-fragment
- at: correction-provenance.md:29
  node: rules/curation-workspace/correction-reason-is-required-and-trimmed
- at: correction-provenance.md:30
  node: rules/curation-workspace/field-messages-appear-on-blur-and-submit
- at: correction-provenance.md:31
  node: rules/curation-workspace/correction-checks-run-in-order
- at: correction-provenance.md:32
  node: rules/curation-workspace/save-is-disabled-without-a-stated-fragment
- at: correction-provenance.md:33
  node: rules/curation-workspace/correction-shows-submitting
- at: correction-provenance.md:34
  node: rules/curation-workspace/correction-sends-the-item-the-values-and-the-reason
- at: correction-provenance.md:34
  node: rules/curation-workspace/fragment-id-is-sent-whatever-the-basis
- at: correction-provenance.md:34
  node: rules/curation-workspace/client-detects-no-unchanged-correction
- at: correction-provenance.md:37
  node: rules/curation-workspace/form-hands-the-request-to-its-caller
- at: correction-provenance.md:40
  node: rules/curation-workspace/date-justification-offers-three-bases
- at: correction-provenance.md:40
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:41
  node: rules/curation-workspace/stated-basis-lists-the-accepted-fragments
- at: correction-provenance.md:42
  node: rules/curation-workspace/picker-choice-shows-eighty-characters
- at: correction-provenance.md:43
  node: rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id
- at: correction-provenance.md:44
  node: rules/curation-workspace/manual-fragment-id-is-not-checked
- at: correction-provenance.md:45
  node: rules/curation-workspace/fragment-field-shows-only-under-stated
- at: correction-provenance.md:48
  node: rules/curation-workspace/server-refusal-lands-on-its-field
- at: correction-provenance.md:49
  node: rules/curation-workspace/unmapped-refusal-shows-nothing-on-the-form
- at: correction-provenance.md:50
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:53
  node: rules/curation-workspace/trail-reads-by-link-or-by-attribute
- at: correction-provenance.md:54
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:55
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:56
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:57
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:58
  node: rules/curation-workspace/trail-keeps-the-answered-order
- at: correction-provenance.md:59
  node: rules/curation-workspace/fragment-shows-its-confidence-as-a-percentage
- at: correction-provenance.md:60
  node: rules/curation-workspace/fragment-text-is-cut-to-280-characters
- at: correction-provenance.md:61
  node: rules/curation-workspace/chunk-shows-its-source-date-and-offsets
- at: correction-provenance.md:62
  node: rules/curation-workspace/chunk-excerpt-is-cut-to-200-characters
- at: correction-provenance.md:63
  node: rules/curation-workspace/unlabelled-source-type-shows-as-it-is
- at: correction-provenance.md:66
  node: rules/curation-workspace/trail-signals-that-the-evidence-was-viewed-once
- at: correction-provenance.md:67
  node: rules/curation-workspace/trail-signals-that-the-evidence-was-viewed-once
- at: correction-provenance.md:68
  node: rules/curation-workspace/viewed-signal-never-fires-on-a-failed-trail
- at: correction-provenance.md:69
  node: rules/curation-workspace/viewed-signal-may-fire-on-an-empty-trail
- at: correction-provenance.md:70
  node: rules/curation-workspace/viewed-signal-fires-once-per-mount
- at: correction-provenance.md:73
  node: rules/curation-workspace/attribute-correction-needs-a-value
- at: correction-provenance.md:73
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:74
  node: rules/curation-workspace/link-correction-needs-a-target
- at: correction-provenance.md:74
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:75
  node: rules/curation-workspace/correction-dates-have-the-iso-shape
- at: correction-provenance.md:75
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:76
  node: rules/curation-workspace/correction-start-precedes-the-end
- at: correction-provenance.md:76
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:77
  node: rules/curation-workspace/stated-basis-needs-a-fragment
- at: correction-provenance.md:77
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:78
  node: rules/curation-workspace/correction-reason-is-required-and-trimmed
- at: correction-provenance.md:78
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:79
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:80
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:81
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:82
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:83
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:84
  node: rules/curation-workspace/unmapped-refusal-shows-nothing-on-the-form
- at: correction-provenance.md:85
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:86
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:87
  node: rules/curation-workspace/picker-falls-back-to-a-manual-fragment-id
- at: correction-provenance.md:87
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:90
  node: rules/curation-workspace/date-justification-offers-three-bases
- at: correction-provenance.md:90
  node: domain/knowledge-base/valid-from-basis
- at: correction-provenance.md:91
  node: domain/knowledge-base/item-kind
- at: correction-provenance.md:92
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:93
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:94
  node: contracts/curation-workspace/curation-screen
- at: correction-provenance.md:97
  node: contracts/curation-workspace/bff-curation
- at: correction-provenance.md:98
  node: contracts/curation-workspace/bff-curation
- at: correction-provenance.md:99
  node: contracts/curation-workspace/bff-curation-reads
- at: correction-provenance.md:100
  node: contracts/curation-workspace/bff-curation-reads
- at: correction-provenance.md:101
  outside: "the shared failure class belongs to the increment that adopts the shared transport"
- at: decision-panel.md:26
  node: rules/curation-workspace/entity-match-offers-merge-and-keep-separate
- at: decision-panel.md:27
  node: rules/curation-workspace/dispute-offers-prefer-one-and-keep-disputed
- at: decision-panel.md:28
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: decision-panel.md:29
  node: rules/curation-workspace/correction-is-offered-only-for-a-dispute
- at: decision-panel.md:30
  node: rules/curation-workspace/panel-takes-no-confirm-reject-or-adjust
- at: decision-panel.md:33
  node: rules/curation-workspace/every-decision-waits-for-the-evidence
- at: decision-panel.md:34
  node: rules/curation-workspace/every-decision-waits-for-the-evidence
- at: decision-panel.md:35
  node: rules/curation-workspace/every-decision-waits-for-the-evidence
- at: decision-panel.md:36
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:36
  node: rules/curation-workspace/every-decision-waits-for-the-evidence
- at: decision-panel.md:37
  node: rules/curation-workspace/evidence-viewed-is-supplied-by-the-caller
- at: decision-panel.md:38
  node: rules/curation-workspace/evidence-indicator-pulses-until-viewed
- at: decision-panel.md:38
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:39
  node: rules/curation-workspace/decision-shows-as-sending-until-answered
- at: decision-panel.md:42
  node: rules/curation-workspace/merge-checks-the-gate-then-a-candidate-then-the-reason
- at: decision-panel.md:43
  node: rules/curation-workspace/prefer-checks-the-gate-then-a-side-then-the-reason
- at: decision-panel.md:44
  node: rules/curation-workspace/keep-decisions-check-only-the-gate
- at: decision-panel.md:47
  node: rules/curation-workspace/reason-field-always-shows-as-required
- at: decision-panel.md:48
  node: rules/curation-workspace/blank-reason-blocks-a-destructive-decision
- at: decision-panel.md:49
  node: rules/curation-workspace/typing-clears-the-reason-error
- at: decision-panel.md:50
  node: rules/curation-workspace/reason-is-sent-as-typed-and-empty-as-null
- at: decision-panel.md:51
  outside: "an absence: the panel sets no bound on the reason, which the reason rules leave open"
- at: decision-panel.md:54
  node: rules/curation-workspace/merge-sends-the-decision-the-target-and-the-reason
- at: decision-panel.md:55
  node: rules/curation-workspace/keep-separate-sends-the-decision-and-the-reason
- at: decision-panel.md:56
  node: rules/curation-workspace/preference-sends-the-items-the-decision-the-winner-and-the-reason
- at: decision-panel.md:57
  node: rules/curation-workspace/keep-disputed-sends-the-items-the-decision-and-the-reason
- at: decision-panel.md:58
  node: rules/curation-workspace/form-hands-the-request-to-its-caller
- at: decision-panel.md:61
  node: rules/curation-workspace/nothing-is-preselected
- at: decision-panel.md:62
  node: rules/curation-workspace/changing-the-item-clears-the-draft
- at: decision-panel.md:63
  node: rules/curation-workspace/changing-the-item-restarts-the-correction
- at: decision-panel.md:66
  node: rules/curation-workspace/header-badge-names-the-queue-kind
- at: decision-panel.md:67
  node: rules/curation-workspace/entity-match-header-names-the-proposed-node
- at: decision-panel.md:68
  node: rules/curation-workspace/dispute-header-names-its-subject-node
- at: decision-panel.md:69
  node: rules/curation-workspace/dispute-header-falls-back-until-the-name-arrives
- at: decision-panel.md:70
  node: rules/curation-workspace/dispute-header-adds-the-relation
- at: decision-panel.md:71
  node: rules/curation-workspace/item-age-reads-in-minutes-hours-and-days
- at: decision-panel.md:71
  node: rules/curation-workspace/item-age-is-measured-from-a-fixed-reference
- at: decision-panel.md:76
  node: rules/curation-workspace/candidate-shows-its-similarity-as-a-percentage
- at: decision-panel.md:77
  node: rules/curation-workspace/candidate-shows-its-similarity-as-a-percentage
- at: decision-panel.md:78
  node: rules/curation-workspace/selecting-a-candidate-makes-it-the-merge-target
- at: decision-panel.md:79
  node: rules/curation-workspace/summary-shows-the-single-candidate-alone
- at: decision-panel.md:79
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:80
  node: rules/curation-workspace/full-presentation-lists-every-candidate
- at: decision-panel.md:80
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:81
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:82
  node: rules/curation-workspace/merge-stays-offered-without-a-candidate
- at: decision-panel.md:83
  outside: "how the panel picks between the summary and the full presentation is held by the display-mode rules"
- at: decision-panel.md:86
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:87
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:88
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:89
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:90
  node: rules/curation-workspace/every-side-is-listed-and-selectable
- at: decision-panel.md:91
  node: rules/curation-workspace/link-side-is-named-by-its-target
- at: decision-panel.md:93
  node: rules/curation-workspace/value-side-is-named-by-its-value
- at: decision-panel.md:94
  node: rules/curation-workspace/side-shows-its-validity-basis-and-confidence
- at: decision-panel.md:94
  node: rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
- at: decision-panel.md:99
  node: rules/curation-workspace/periods-are-listed-in-words-under-the-sides
- at: decision-panel.md:100
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:101
  node: rules/curation-workspace/dates-show-as-pt-br-calendar-dates-in-utc
- at: decision-panel.md:102
  node: rules/curation-workspace/periods-are-listed-in-words-under-the-sides
- at: decision-panel.md:105
  node: rules/curation-workspace/correction-targets-the-first-side
- at: decision-panel.md:106
  node: rules/curation-workspace/correction-starts-from-the-first-sides-values
- at: decision-panel.md:109
  node: rules/curation-workspace/correction-opens-inline-and-returns-focus
- at: decision-panel.md:110
  node: rules/curation-workspace/fragment-filter-reaches-the-picker
- at: decision-panel.md:113
  node: rules/curation-workspace/stale-item-shows-the-notice-with-a-reload
- at: decision-panel.md:113
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:114
  node: rules/curation-workspace/stale-item-blocks-no-decision
- at: decision-panel.md:115
  node: rules/curation-workspace/staleness-is-never-detected-by-the-panel
- at: decision-panel.md:118
  node: rules/curation-workspace/merge-checks-the-gate-then-a-candidate-then-the-reason
- at: decision-panel.md:119
  node: rules/curation-workspace/prefer-checks-the-gate-then-a-side-then-the-reason
- at: decision-panel.md:120
  node: rules/curation-workspace/blank-reason-blocks-a-destructive-decision
- at: decision-panel.md:120
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:121
  node: rules/curation-workspace/every-decision-waits-for-the-evidence
- at: decision-panel.md:121
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:122
  node: rules/curation-workspace/reason-required-refusal-shows-under-the-reason
- at: decision-panel.md:123
  node: rules/curation-workspace/self-merge-refusal-shows-the-fixed-text
- at: decision-panel.md:123
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:124
  node: rules/curation-workspace/invalid-target-refusal-marks-the-candidate
- at: decision-panel.md:125
  node: rules/curation-workspace/correction-refusals-reach-the-form
- at: decision-panel.md:126
  node: rules/curation-workspace/correction-refusals-reach-the-form
- at: decision-panel.md:127
  node: rules/curation-workspace/any-other-refusal-shows-in-the-panel-alert
- at: decision-panel.md:130
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:130
  node: domain/knowledge-base/entity-match-decision
- at: decision-panel.md:131
  node: contracts/curation-workspace/curation-screen
- at: decision-panel.md:131
  node: domain/knowledge-base/dispute-decision
- at: decision-panel.md:132
  node: rules/curation-workspace/header-badge-names-the-queue-kind
- at: decision-panel.md:133
  node: rules/curation-workspace/side-shows-its-validity-basis-and-confidence
- at: decision-panel.md:133
  node: domain/knowledge-base/valid-from-basis
- at: decision-panel.md:134
  node: domain/curation-workspace/display-mode
- at: decision-panel.md:135
  node: rules/curation-workspace/evidence-indicator-pulses-until-viewed
- at: decision-panel.md:136
  node: rules/curation-workspace/reason-required-refusal-shows-under-the-reason
- at: decision-panel.md:136
  node: rules/curation-workspace/self-merge-refusal-shows-the-fixed-text
- at: decision-panel.md:136
  node: rules/curation-workspace/invalid-target-refusal-marks-the-candidate
- at: decision-panel.md:136
  node: rules/curation-workspace/correction-refusals-reach-the-form
- at: decision-panel.md:139
  node: contracts/curation-workspace/bff-curation
- at: decision-panel.md:139
  node: domain/knowledge-base/entity-match-review
- at: decision-panel.md:140
  node: contracts/curation-workspace/bff-curation
- at: decision-panel.md:140
  node: domain/knowledge-base/dispute-scope
- at: decision-panel.md:141
  node: contracts/curation-workspace/bff-curation
- at: decision-panel.md:142
  node: rules/curation-workspace/merge-sends-the-decision-the-target-and-the-reason
- at: decision-panel.md:143
  node: rules/curation-workspace/preference-sends-the-items-the-decision-the-winner-and-the-reason
- at: decision-panel.md:144
  node: contracts/curation-workspace/bff-curation-reads
- at: decision-panel.md:145
  outside: "the refusal supplied by the caller is wiring: how it is read is held by the decision failure rules"
- at: page-queue.md:22
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: page-queue.md:23
  node: rules/curation-workspace/tabs-choose-the-queue-kind
- at: page-queue.md:23
  node: rules/curation-workspace/queue-kind-is-sent-only-when-chosen
- at: page-queue.md:24
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: page-queue.md:25
  node: rules/curation-workspace/page-counts-loaded-entries-as-the-metrics-fallback
- at: page-queue.md:26
  node: rules/curation-workspace/page-lists-only-one-queue-page
- at: page-queue.md:27
  node: rules/curation-workspace/page-keeps-its-state-when-left
- at: page-queue.md:30
  node: rules/curation-workspace/tabs-choose-the-queue-kind
- at: page-queue.md:31
  node: rules/curation-workspace/active-tab-lives-only-on-the-page
- at: page-queue.md:34
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:34
  node: rules/curation-workspace/queue-failure-is-checked-before-empty
- at: page-queue.md:35
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:36
  node: rules/curation-workspace/queue-failure-is-checked-before-empty
- at: page-queue.md:37
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:38
  outside: "the number of placeholder rows is presentation of a loading state"
- at: page-queue.md:39
  node: rules/curation-workspace/queue-keeps-the-answered-order
- at: page-queue.md:42
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:43
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:43
  node: rules/curation-workspace/header-badge-names-the-queue-kind
- at: page-queue.md:44
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:45
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:46
  node: rules/curation-workspace/item-age-reads-in-minutes-hours-and-days
- at: page-queue.md:54
  node: rules/curation-workspace/item-age-is-measured-from-a-fixed-reference
- at: page-queue.md:57
  node: rules/curation-workspace/queue-entries-are-identified-by-node-or-first-side
- at: page-queue.md:58
  node: rules/curation-workspace/selection-matches-a-dispute-by-any-side
- at: page-queue.md:59
  node: rules/curation-workspace/owner-selects-by-click-enter-or-space
- at: page-queue.md:60
  node: rules/curation-workspace/selecting-writes-the-item-to-the-address
- at: page-queue.md:61
  node: rules/curation-workspace/queue-answer-chooses-the-selection-again
- at: page-queue.md:67
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:70
  node: rules/curation-workspace/page-wires-four-shortcuts
- at: page-queue.md:71
  node: rules/curation-workspace/next-and-previous-move-through-the-queue-as-a-ring
- at: page-queue.md:72
  node: rules/curation-workspace/select-by-number-picks-the-nth-loaded-item
- at: page-queue.md:73
  node: rules/curation-workspace/keyboard-moves-follow-the-click-path
- at: page-queue.md:74
  node: rules/curation-workspace/check-toggles-the-item-in-the-checked-set
- at: page-queue.md:77
  node: rules/curation-workspace/new-item-count-is-the-total-minus-the-baseline
- at: page-queue.md:78
  node: rules/curation-workspace/baseline-ignores-tab-changes
- at: page-queue.md:79
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:82
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: page-queue.md:83
  node: rules/curation-workspace/entity-match-evidence-counts-as-viewed-at-once
- at: page-queue.md:84
  node: rules/curation-workspace/dispute-evidence-counts-as-viewed-when-its-trail-says-so
- at: page-queue.md:85
  node: rules/curation-workspace/dispute-evidence-counts-as-viewed-when-its-trail-says-so
- at: page-queue.md:86
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: page-queue.md:90
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: page-queue.md:90
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: page-queue.md:91
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: page-queue.md:91
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: page-queue.md:92
  node: rules/curation-workspace/preference-removes-its-item-by-the-first-id
- at: page-queue.md:93
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: page-queue.md:94
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: page-queue.md:94
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: page-queue.md:95
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: page-queue.md:96
  node: rules/curation-workspace/decision-moves-to-the-ring-neighbour
- at: page-queue.md:97
  node: rules/curation-workspace/page-does-not-remove-a-decided-item-itself
- at: page-queue.md:100
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:101
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:102
  node: rules/curation-workspace/unknown-item-in-the-address-selects-the-first-item
- at: page-queue.md:103
  node: rules/curation-workspace/select-by-number-picks-the-nth-loaded-item
- at: page-queue.md:104
  node: rules/curation-workspace/decision-on-the-wrong-kind-sends-nothing
- at: page-queue.md:105
  node: rules/curation-workspace/decision-on-the-wrong-kind-sends-nothing
- at: page-queue.md:106
  outside: "the page forwards the server error and the stale flag to the panel, which reads them by the decision failure rules"
- at: page-queue.md:109
  node: rules/curation-workspace/tabs-choose-the-queue-kind
- at: page-queue.md:109
  node: domain/curation-workspace/queue-tab
- at: page-queue.md:110
  node: rules/curation-workspace/header-badge-names-the-queue-kind
- at: page-queue.md:111
  node: domain/curation-workspace/selected-item
- at: page-queue.md:112
  node: contracts/curation-workspace/curation-screen
- at: page-queue.md:113
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: page-queue.md:114
  node: rules/curation-workspace/destructive-decisions-wait-for-undo
- at: page-queue.md:114
  node: rules/curation-workspace/immediate-decisions-are-sent-at-once
- at: page-queue.md:115
  node: rules/curation-workspace/destructive-decisions-carry-a-caption
- at: page-queue.md:116
  node: rules/curation-workspace/item-age-reads-in-minutes-hours-and-days
- at: page-queue.md:119
  node: contracts/curation-workspace/bff-curation
- at: page-queue.md:120
  node: contracts/curation-workspace/bff-curation
- at: page-queue.md:121
  node: contracts/curation-workspace/bff-curation
- at: page-queue.md:122
  node: contracts/curation-workspace/bff-curation
- at: page-queue.md:123
  node: contracts/curation-workspace/bff-curation
- at: page-queue.md:124
  node: rules/curation-workspace/selected-item-is-carried-in-the-address
---
