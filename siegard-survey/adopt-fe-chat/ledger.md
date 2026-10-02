---
contract_version: siegard-ledger/1
material:
- stream.md
- conversations.md
- ui.md
entries:
- at: stream.md:20
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:21
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:22
  node: rules/chat-workspace/content-is-sent-as-the-caller-gives-it
- at: stream.md:23
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:24
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:25
  node: rules/chat-workspace/send-carries-the-access-token-when-held
- at: stream.md:26
  node: rules/chat-workspace/send-carries-the-access-token-when-held
- at: stream.md:27
  node: rules/chat-workspace/every-send-has-a-new-idempotency-key
- at: stream.md:28
  node: rules/chat-workspace/a-turn-is-never-resent-by-the-screen
- at: stream.md:29
  node: rules/chat-workspace/send-stream-has-no-client-cutoff
- at: stream.md:30
  node: rules/chat-workspace/send-never-refreshes-the-token
- at: stream.md:31
  node: rules/chat-workspace/send-clears-the-previous-turn
- at: stream.md:32
  node: rules/chat-workspace/owner-message-is-appended-before-the-answer
- at: stream.md:33
  node: rules/chat-workspace/owner-message-is-appended-before-the-answer
- at: stream.md:34
  node: rules/chat-workspace/refused-send-keeps-the-owner-message-until-reread
- at: stream.md:35
  node: rules/chat-workspace/stream-end-clears-streaming-and-the-handle
- at: stream.md:36
  node: rules/chat-workspace/stream-end-reads-messages-and-usage-again
- at: stream.md:37
  node: rules/chat-workspace/turn-text-and-chips-stay-until-the-next-send
- at: stream.md:38
  node: rules/chat-workspace/send-resolves-with-the-turn-outcome
- at: stream.md:38
  node: domain/chat-workspace/send-outcome
- at: stream.md:39
  node: rules/chat-workspace/send-resolves-with-the-turn-outcome
- at: stream.md:40
  node: rules/chat-workspace/turn-without-a-terminal-frame-resolves-empty
- at: stream.md:41
  node: rules/chat-workspace/reading-continues-after-a-terminal-frame
- at: stream.md:42
  node: rules/chat-workspace/last-terminal-frame-sets-the-result
- at: stream.md:45
  node: rules/chat-workspace/stream-is-read-as-utf-8
- at: stream.md:46
  node: rules/chat-workspace/frames-end-at-a-blank-line
- at: stream.md:47
  node: rules/chat-workspace/unterminated-last-frame-is-read
- at: stream.md:48
  node: rules/chat-workspace/frame-lines-are-field-value-pairs
- at: stream.md:49
  node: rules/chat-workspace/comment-and-colonless-lines-are-ignored
- at: stream.md:50
  node: rules/chat-workspace/event-names-the-frame-and-data-carries-it
- at: stream.md:51
  node: rules/chat-workspace/malformed-frames-are-skipped-silently
- at: stream.md:51
  node: scenarios/chat-workspace/malformed-frame-is-skipped
- at: stream.md:52
  node: rules/chat-workspace/each-frame-kind-requires-its-fields
- at: stream.md:53
  node: rules/chat-workspace/each-frame-kind-requires-its-fields
- at: stream.md:54
  node: rules/chat-workspace/each-frame-kind-requires-its-fields
- at: stream.md:55
  node: rules/chat-workspace/each-frame-kind-requires-its-fields
- at: stream.md:56
  node: rules/chat-workspace/each-frame-kind-requires-its-fields
- at: stream.md:57
  node: rules/chat-workspace/each-frame-kind-requires-its-fields
- at: stream.md:58
  node: rules/chat-workspace/each-frame-kind-requires-its-fields
- at: stream.md:61
  node: rules/chat-workspace/llm-start-makes-the-status-thinking
- at: stream.md:62
  node: rules/chat-workspace/text-delta-appends-and-makes-the-status-streaming
- at: stream.md:63
  node: rules/chat-workspace/tool-start-adds-a-chip-and-makes-the-status-tool-running
- at: stream.md:64
  node: rules/chat-workspace/graph-tool-start-puts-the-graph-pane-into-loading
- at: stream.md:65
  node: rules/chat-workspace/graph-tool-start-puts-the-graph-pane-into-loading
- at: stream.md:66
  node: rules/chat-workspace/tool-result-settles-the-last-chip
- at: stream.md:67
  node: rules/chat-workspace/graph-delta-with-no-nodes-leaves-the-graph
- at: stream.md:68
  node: rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
- at: stream.md:68
  node: scenarios/chat-workspace/second-graph-delta-adds-to-the-first
- at: stream.md:69
  node: rules/chat-workspace/first-graph-delta-replaces-and-later-ones-add
- at: stream.md:70
  node: rules/chat-workspace/done-settles-the-turn-and-makes-the-status-idle
- at: stream.md:71
  node: rules/chat-workspace/error-settles-the-turn-and-makes-the-status-error
- at: stream.md:72
  node: rules/chat-workspace/error-status-stays-until-the-next-send
- at: stream.md:73
  node: rules/chat-workspace/turn-without-a-terminal-frame-keeps-the-last-status
- at: stream.md:76
  node: rules/chat-workspace/turn-state-holds-the-abort-handle-while-the-stream-is-open
- at: stream.md:77
  node: rules/chat-workspace/aborting-ends-the-reading-quietly
- at: stream.md:78
  node: rules/chat-workspace/cancelling-a-turn-is-a-separate-request
- at: stream.md:79
  node: rules/chat-workspace/cancel-goes-through-the-back-end-request-helper
- at: stream.md:80
  node: rules/chat-workspace/cancelling-a-turn-is-a-separate-request
- at: stream.md:81
  node: rules/chat-workspace/cancel-targets-the-conversation-it-was-created-for
- at: stream.md:82
  node: rules/chat-workspace/successful-cancel-reads-the-usage-again
- at: stream.md:82
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:83
  node: rules/chat-workspace/aborting-and-cancelling-do-not-trigger-each-other
- at: stream.md:86
  node: rules/chat-workspace/no-body-request-succeeds-only-on-204
- at: stream.md:87
  node: rules/chat-workspace/no-body-request-has-no-cutoff-and-no-refresh
- at: stream.md:88
  outside: "which operation uses the no-body helper is not visible in the area; the delete, which does, is held by the conversations rules"
- at: stream.md:91
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:92
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:93
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:94
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:95
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:96
  node: rules/chat-workspace/unparseable-timestamp-becomes-an-invalid-date
- at: stream.md:99
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: stream.md:102
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:103
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:104
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:105
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:106
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:107
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:108
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:108
  node: rules/chat-workspace/send-never-refreshes-the-token
- at: stream.md:109
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:110
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:111
  node: rules/chat-workspace/error-settles-the-turn-and-makes-the-status-error
- at: stream.md:112
  node: rules/chat-workspace/send-resolves-with-the-turn-outcome
- at: stream.md:113
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:114
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:115
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:116
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:117
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:118
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:121
  node: domain/chat/turn-event-kind
- at: stream.md:122
  node: domain/chat-workspace/chat-status
- at: stream.md:123
  node: rules/chat-workspace/graph-tool-start-puts-the-graph-pane-into-loading
- at: stream.md:124
  node: rules/chat-workspace/done-settles-the-turn-and-makes-the-status-idle
- at: stream.md:124
  node: rules/chat-workspace/error-settles-the-turn-and-makes-the-status-error
- at: stream.md:125
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:128
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:129
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:130
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:131
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:132
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:133
  node: contracts/chat-workspace/bff-conversations
- at: stream.md:134
  outside: "the graph pane belongs to the graph feature, whose adoption holds its conversion and actions"
- at: stream.md:135
  outside: "the owner's access token belongs to the increment that adopts the shared state"
- at: stream.md:136
  outside: "the application's own configuration of the back end address belongs to the increment that adopts the shared configuration"
- at: stream.md:137
  outside: "the back end request helper's own behaviour belongs to the increment that adopts the shared transport"
- at: conversations.md:23
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:24
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:25
  node: rules/chat-workspace/title-is-sent-as-given
- at: conversations.md:26
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:27
  node: rules/chat-workspace/create-refreshes-every-conversation-read
- at: conversations.md:28
  node: rules/chat-workspace/create-and-delete-do-not-navigate
- at: conversations.md:31
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:32
  node: rules/chat-workspace/delete-uses-the-no-body-helper
- at: conversations.md:33
  node: rules/chat-workspace/delete-uses-the-no-body-helper
- at: conversations.md:33
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:34
  node: rules/chat-workspace/delete-removes-the-conversations-reads
- at: conversations.md:35
  node: rules/chat-workspace/create-and-delete-do-not-navigate
- at: conversations.md:38
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:39
  node: rules/chat-workspace/update-sends-only-the-fields-supplied
- at: conversations.md:39
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:40
  node: rules/chat-workspace/update-sends-only-the-fields-supplied
- at: conversations.md:40
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:41
  node: rules/chat-workspace/update-sends-only-the-fields-supplied
- at: conversations.md:42
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:43
  node: rules/chat-workspace/update-refreshes-the-details-and-every-read
- at: conversations.md:46
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:47
  node: rules/chat-workspace/reads-need-a-conversation-id
- at: conversations.md:48
  node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
- at: conversations.md:49
  node: rules/chat-workspace/details-and-listing-are-read-again-on-focus
- at: conversations.md:52
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:53
  node: rules/chat-workspace/listing-sends-its-options-only-when-asked
- at: conversations.md:54
  node: rules/chat-workspace/no-page-size-is-fixed-by-the-screen
- at: conversations.md:55
  node: rules/chat-workspace/listing-excludes-archived-by-default
- at: conversations.md:55
  node: rules/chat/conversation-listing-excludes-archived
- at: conversations.md:56
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: conversations.md:57
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:58
  node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
- at: conversations.md:58
  node: rules/chat-workspace/details-and-listing-are-read-again-on-focus
- at: conversations.md:61
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:62
  node: rules/chat-workspace/listing-sends-its-options-only-when-asked
- at: conversations.md:63
  node: rules/chat-workspace/no-page-size-is-fixed-by-the-screen
- at: conversations.md:64
  outside: "cache wiring (the identity of a cached read) that no rule the owner can observe rests on; the freshness the owner sees is held by the freshness rules"
- at: conversations.md:65
  node: rules/chat-workspace/reads-need-a-conversation-id
- at: conversations.md:66
  node: rules/chat-workspace/messages-are-stale-as-soon-as-they-are-read
- at: conversations.md:66
  node: rules/chat-workspace/messages-and-usage-are-not-read-again-on-focus
- at: conversations.md:67
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:70
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:71
  node: rules/chat-workspace/reads-need-a-conversation-id
- at: conversations.md:72
  node: rules/chat-workspace/conversation-reads-stay-fresh-for-thirty-seconds
- at: conversations.md:72
  node: rules/chat-workspace/messages-and-usage-are-not-read-again-on-focus
- at: conversations.md:73
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:76
  node: domain/chat/conversation
- at: conversations.md:77
  node: domain/chat/message
- at: conversations.md:78
  node: domain/chat/message
- at: conversations.md:79
  node: domain/chat/tool-call
- at: conversations.md:79
  node: domain/chat-workspace/tool-chip
- at: conversations.md:80
  node: domain/chat/conversation-usage
- at: conversations.md:81
  outside: "the active conversation as the screen composes it is a type assembling reads that other nodes already hold"
- at: conversations.md:84
  node: rules/chat-workspace/turn-starts-empty-and-idle
- at: conversations.md:85
  node: rules/chat-workspace/reset-restores-every-field-at-once
- at: conversations.md:86
  node: rules/chat-workspace/streamed-text-accumulates-at-the-end
- at: conversations.md:87
  node: rules/chat-workspace/started-tool-calls-accumulate-at-the-end
- at: conversations.md:88
  node: rules/chat-workspace/an-outcome-settles-the-most-recent-chip
- at: conversations.md:89
  node: rules/chat-workspace/turn-holds-one-abort-handle
- at: conversations.md:90
  node: rules/chat-workspace/turn-holds-the-idempotency-key
- at: conversations.md:91
  node: rules/chat-workspace/streaming-flag-is-separate-from-the-status
- at: conversations.md:92
  node: rules/chat-workspace/any-status-may-follow-any-status
- at: conversations.md:93
  node: rules/chat-workspace/turn-state-lives-in-memory-only
- at: conversations.md:96
  node: rules/chat-workspace/read-and-write-failures-surface-unchanged
- at: conversations.md:97
  node: rules/chat-workspace/read-and-write-failures-surface-unchanged
- at: conversations.md:98
  node: rules/chat-workspace/update-sends-only-the-fields-supplied
- at: conversations.md:99
  node: rules/chat-workspace/read-and-write-failures-surface-unchanged
- at: conversations.md:100
  node: rules/chat-workspace/read-and-write-failures-surface-unchanged
- at: conversations.md:101
  node: rules/chat-workspace/reads-need-a-conversation-id
- at: conversations.md:104
  node: domain/chat-workspace/chat-status
- at: conversations.md:105
  node: domain/chat/message-role
- at: conversations.md:106
  node: domain/chat/assistant-stop-reason
- at: conversations.md:107
  node: domain/chat-workspace/tool-chip-outcome
- at: conversations.md:110
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:111
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:112
  node: contracts/chat-workspace/bff-conversations
- at: conversations.md:113
  node: rules/chat-workspace/send-carries-the-access-token-when-held
- at: ui.md:27
  node: rules/chat-workspace/active-conversation-is-named-by-the-address
- at: ui.md:28
  node: contracts/chat-workspace/chat-screen
- at: ui.md:29
  node: rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail
- at: ui.md:30
  node: rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation
- at: ui.md:31
  node: rules/chat-workspace/clicking-a-node-swaps-the-pane-to-its-detail
- at: ui.md:32
  node: rules/chat-workspace/node-detail-receives-the-clicked-label
- at: ui.md:33
  node: rules/chat-workspace/selecting-a-node-sends-nothing
- at: ui.md:34
  node: rules/chat-workspace/graph-pane-receives-the-status-and-the-error
- at: ui.md:35
  node: rules/chat-workspace/changing-conversation-does-not-stop-the-turn
- at: ui.md:38
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: ui.md:39
  node: rules/chat-workspace/conversation-is-archived-when-its-detail-says-so
- at: ui.md:40
  node: rules/chat-workspace/reactivating-sends-an-unarchive-update
- at: ui.md:41
  node: contracts/chat-workspace/chat-screen
- at: ui.md:42
  node: contracts/chat-workspace/chat-screen
- at: ui.md:43
  node: contracts/chat-workspace/chat-screen
- at: ui.md:46
  node: rules/chat-workspace/archived-conversation-offers-no-input
- at: ui.md:47
  node: contracts/chat-workspace/chat-screen
- at: ui.md:48
  node: contracts/chat-workspace/chat-screen
- at: ui.md:49
  node: contracts/chat-workspace/chat-screen
- at: ui.md:50
  node: rules/chat-workspace/composer-send-carries-the-identifier-and-the-content
- at: ui.md:51
  node: rules/chat-workspace/content-needs-a-character
- at: ui.md:52
  node: rules/chat-workspace/content-has-at-most-32768-characters
- at: ui.md:53
  node: rules/chat-workspace/whitespace-only-content-passes
- at: ui.md:54
  node: rules/chat-workspace/content-is-checked-on-every-change
- at: ui.md:55
  node: rules/chat-workspace/invalid-content-sends-nothing
- at: ui.md:56
  node: rules/chat-workspace/one-validation-message-per-field
- at: ui.md:57
  node: rules/chat-workspace/enter-sends-and-shift-enter-breaks-the-line
- at: ui.md:58
  node: rules/chat-workspace/successful-send-empties-the-field
- at: ui.md:58
  node: scenarios/chat-workspace/failed-send-keeps-the-typed-text
- at: ui.md:59
  node: rules/chat-workspace/streaming-disables-the-field-and-swaps-the-button
- at: ui.md:60
  node: rules/chat-workspace/stop-button-aborts-the-turn
- at: ui.md:61
  node: rules/chat-workspace/escape-aborts-the-turn-from-anywhere
- at: ui.md:61
  node: scenarios/chat-workspace/escape-stops-a-streaming-turn
- at: ui.md:62
  node: rules/chat-workspace/disabling-codes-lock-the-composer
- at: ui.md:63
  node: rules/chat-workspace/composer-never-clears-the-last-outcome
- at: ui.md:64
  node: rules/chat-workspace/any-other-code-leaves-the-composer-usable
- at: ui.md:65
  node: rules/chat-workspace/one-message-line-under-the-field
- at: ui.md:66
  node: rules/chat-workspace/validation-message-is-an-alert
- at: ui.md:67
  node: rules/chat-workspace/invalid-field-is-marked-and-described
- at: ui.md:68
  node: contracts/chat-workspace/chat-screen
- at: ui.md:69
  node: contracts/chat-workspace/chat-screen
- at: ui.md:70
  node: contracts/chat-workspace/chat-screen
- at: ui.md:71
  node: contracts/chat-workspace/chat-screen
- at: ui.md:72
  node: rules/chat-workspace/composer-footer-is-empty
- at: ui.md:75
  node: rules/chat-workspace/loading-history-shows-three-placeholders
- at: ui.md:76
  node: contracts/chat-workspace/chat-screen
- at: ui.md:77
  node: rules/chat-workspace/history-failure-offers-a-retry
- at: ui.md:77
  node: contracts/chat-workspace/chat-screen
- at: ui.md:78
  node: contracts/chat-workspace/chat-screen
- at: ui.md:79
  node: rules/chat-workspace/history-keeps-the-listed-order
- at: ui.md:80
  node: rules/chat-workspace/message-is-a-bubble-styled-by-its-role
- at: ui.md:81
  node: rules/chat-workspace/message-text-joins-its-blocks
- at: ui.md:82
  node: rules/chat-workspace/message-passes-its-stop-reason-to-its-bubble
- at: ui.md:83
  node: rules/chat-workspace/streaming-adds-an-in-flight-assistant-bubble
- at: ui.md:84
  node: rules/chat-workspace/in-flight-bubble-is-removed-when-streaming-ends
- at: ui.md:85
  node: rules/chat-workspace/failed-turn-gets-no-wording-from-the-list
- at: ui.md:86
  node: rules/chat-workspace/waiting-hint-sits-below-the-last-bubble
- at: ui.md:87
  node: rules/chat-workspace/message-list-is-a-polite-live-region
- at: ui.md:87
  node: contracts/chat-workspace/chat-screen
- at: ui.md:88
  node: rules/chat-workspace/first-load-jumps-to-the-bottom
- at: ui.md:89
  node: rules/chat-workspace/first-jump-happens-once
- at: ui.md:90
  node: rules/chat-workspace/streamed-text-growth-scrolls-to-the-bottom
- at: ui.md:91
  node: rules/chat-workspace/leaving-the-list-aborts-the-turn
- at: ui.md:94
  node: contracts/chat-workspace/chat-screen
- at: ui.md:95
  node: rules/chat-workspace/tool-hint-names-the-waiting-tool
- at: ui.md:95
  node: contracts/chat-workspace/chat-screen
- at: ui.md:96
  node: rules/chat-workspace/tool-call-waits-while-its-outcome-is-null
- at: ui.md:97
  node: rules/chat-workspace/hint-hides-in-every-other-phase
- at: ui.md:98
  node: rules/chat-workspace/hint-is-a-polite-atomic-status-region
- at: ui.md:101
  node: rules/chat-workspace/streaming-cursor-is-hidden-from-assistive-technology
- at: ui.md:104
  node: rules/chat-workspace/chip-shows-the-tool-and-its-summary
- at: ui.md:105
  node: contracts/chat-workspace/chat-screen
- at: ui.md:106
  node: rules/chat-workspace/chip-is-a-status-region-named-by-tool-and-status
- at: ui.md:106
  node: contracts/chat-workspace/chat-screen
- at: ui.md:107
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: ui.md:110
  node: rules/chat-workspace/usage-badge-shows-the-three-counts
- at: ui.md:111
  node: rules/chat-workspace/usage-badge-shows-nothing-until-usage-arrives
- at: ui.md:112
  node: contracts/chat-workspace/chat-screen
- at: ui.md:113
  outside: "composition and prop wiring of the screen's components, not a fact of the domain"
- at: ui.md:116
  node: contracts/chat-workspace/chat-screen
- at: ui.md:116
  node: rules/chat-workspace/content-needs-a-character
- at: ui.md:117
  node: contracts/chat-workspace/chat-screen
- at: ui.md:117
  node: rules/chat-workspace/content-has-at-most-32768-characters
- at: ui.md:118
  node: contracts/chat-workspace/chat-screen
- at: ui.md:118
  node: rules/chat-workspace/disabling-codes-lock-the-composer
- at: ui.md:119
  node: contracts/chat-workspace/chat-screen
- at: ui.md:119
  node: rules/chat-workspace/disabling-codes-lock-the-composer
- at: ui.md:120
  node: contracts/chat-workspace/chat-screen
- at: ui.md:120
  node: rules/chat-workspace/any-other-code-leaves-the-composer-usable
- at: ui.md:121
  node: contracts/chat-workspace/chat-screen
- at: ui.md:121
  node: rules/chat-workspace/archived-conversation-offers-no-input
- at: ui.md:122
  node: contracts/chat-workspace/chat-screen
- at: ui.md:123
  node: contracts/chat-workspace/chat-screen
- at: ui.md:123
  node: rules/chat-workspace/usage-badge-shows-nothing-until-usage-arrives
- at: ui.md:126
  node: domain/chat-workspace/chat-status
- at: ui.md:126
  node: rules/chat-workspace/hint-hides-in-every-other-phase
- at: ui.md:127
  node: domain/chat-workspace/tool-chip-outcome
- at: ui.md:128
  node: domain/chat-workspace/message-list-state
- at: ui.md:129
  node: rules/chat-workspace/disabling-codes-lock-the-composer
- at: ui.md:130
  node: rules/chat-workspace/loading-history-shows-three-placeholders
- at: ui.md:133
  node: rules/chat-workspace/active-conversation-is-named-by-the-address
- at: ui.md:134
  node: rules/chat-workspace/conversation-is-archived-when-its-detail-says-so
- at: ui.md:135
  node: rules/chat-workspace/reactivating-sends-an-unarchive-update
- at: ui.md:136
  node: rules/chat-workspace/composer-send-carries-the-identifier-and-the-content
- at: ui.md:136
  node: domain/chat-workspace/send-outcome
- at: ui.md:137
  node: domain/chat/message
- at: ui.md:138
  node: domain/chat/conversation-usage
- at: ui.md:139
  node: domain/chat/tool-call
- at: ui.md:139
  node: domain/chat-workspace/tool-chip
- at: ui.md:140
  outside: "the turn store belongs to the state the conversations rules already hold"
- at: ui.md:141
  outside: "the graph store and the graph pane belong to the graph feature"
---
