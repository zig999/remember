---
contract_version: siegard-ledger/1
material:
- service.md
- boundary.md
- prompts.md
entries:
- at: service.md:24
  node: constraints/chat-toolset
- at: service.md:25
  node: constraints/chat-toolset
- at: service.md:26
  node: rules/chat/chat-toolset-requires-every-query-tool
- at: service.md:27
  node: constraints/chat-toolset
- at: service.md:28
  outside: 'implementation knowledge: how the chat is wired or computed, not a fact of the domain'
- at: service.md:29
  outside: how tools are described to the model provider; implementation
- at: service.md:30
  outside: 'implementation knowledge: how the chat is wired or computed, not a fact of the domain'
- at: service.md:33
  node: domain/chat/turn
- at: service.md:33
  node: rules/chat/tool-invocation-carries-turn
- at: service.md:34
  node: contracts/chat/conversations
- at: service.md:35
  outside: 'implementation knowledge: how the chat is wired or computed, not a fact of the domain'
- at: service.md:36
  node: rules/chat/chat-prompt-version-known
- at: service.md:37
  node: rules/chat/turn-time-limit
- at: service.md:38
  node: rules/chat/turn-cancel
- at: service.md:39
  node: rules/chat/turn-model-call-limit
- at: service.md:40
  node: rules/chat/turn-limit-before-cancel
- at: service.md:41
  node: rules/chat/turn-one-tool-at-a-time
- at: service.md:42
  outside: 'implementation knowledge: how the chat is wired or computed, not a fact of the domain'
- at: service.md:43
  node: rules/chat/assistant-text-withholds-system-prompt
- at: service.md:43
  node: contracts/chat/conversations
- at: service.md:44
  node: rules/chat/turn-cancel
- at: service.md:44
  node: rules/chat/turn-time-limit
- at: service.md:45
  node: rules/chat/turn-tokens-summed
- at: service.md:46
  node: rules/chat/turn-reports-last-model
- at: service.md:47
  outside: the model provider's signal for a tool request; implementation of the loop
- at: service.md:48
  node: contracts/chat/conversations
- at: service.md:49
  node: rules/chat/tool-call-recorded
- at: service.md:49
  node: contracts/chat/conversations
- at: service.md:50
  node: rules/chat/tool-failure-continues-turn
- at: service.md:51
  node: rules/chat/tool-failure-continues-turn
- at: service.md:52
  outside: an adapter for tools that answer without the envelope; implementation
- at: service.md:53
  node: rules/chat/tool-invocation-carries-turn
- at: service.md:54
  node: rules/chat/tool-result-truncated
- at: service.md:55
  node: rules/chat/iteration-recorded
- at: service.md:56
  node: rules/chat/turn-model-stop-reason
- at: service.md:57
  node: contracts/chat/conversations
- at: service.md:58
  node: contracts/chat/conversations
- at: service.md:59
  node: rules/chat/turn-ends-once
- at: service.md:60
  outside: per-turn statistics kept for logging; observability, not domain
- at: service.md:61
  node: domain/chat/turn-event-kind
- at: service.md:64
  node: rules/chat/tool-start-summary-bounded
- at: service.md:65
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:66
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:67
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:68
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:69
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:70
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:71
  node: rules/chat/tool-start-summary-bounded
- at: service.md:72
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:73
  outside: display formatting of a progress label shown while a tool runs; the bound and the withheld content are held by rules/chat/tool-start-summary-bounded
- at: service.md:76
  node: rules/chat/assistant-text-withholds-system-prompt
- at: service.md:79
  node: rules/chat/tool-result-truncated
- at: service.md:80
  node: rules/chat/tool-result-truncated
- at: service.md:83
  node: rules/chat/model-context-owner-time
- at: service.md:84
  node: rules/chat/model-context-window
- at: service.md:84
  node: constraints/chat-reads-are-consistent
- at: service.md:85
  node: rules/chat/model-context-rolling-summary
- at: service.md:86
  node: rules/chat/model-context-well-formed
- at: service.md:87
  node: rules/chat/model-context-owner-time
- at: service.md:88
  outside: normalization of the offset the platform formatter prints; implementation
- at: service.md:91
  node: rules/chat/model-context-well-formed
- at: service.md:92
  node: rules/chat/model-context-well-formed
- at: service.md:93
  node: rules/chat/model-context-well-formed
- at: service.md:94
  node: rules/chat/model-context-well-formed
- at: service.md:97
  node: contracts/chat/conversations
- at: service.md:97
  node: domain/chat/conversation
- at: service.md:98
  node: domain/chat/conversation-listing
- at: service.md:99
  node: rules/chat/conversation-request-check-order
- at: service.md:100
  node: contracts/chat/conversations
- at: service.md:100
  node: rules/chat/conversation-listing-order
- at: service.md:101
  outside: the encoding of a cursor the contract declares opaque; implementation
- at: service.md:102
  node: contracts/chat/conversations
- at: service.md:103
  node: rules/chat/conversation-update-partial
- at: service.md:104
  node: contracts/chat/conversations
- at: service.md:104
  node: domain/chat/conversation
- at: service.md:105
  node: contracts/chat/conversations
- at: service.md:105
  node: constraints/chat-reads-are-consistent
- at: service.md:108
  node: rules/chat/distillation-failure-changes-nothing
- at: service.md:109
  node: rules/chat/rolling-summary-refresh
- at: service.md:110
  outside: a configuration value declared and read nowhere; nothing of the domain
- at: service.md:111
  node: rules/chat/rolling-summary-overlap
- at: service.md:112
  node: rules/chat/rolling-summary-refresh
- at: service.md:112
  node: rules/chat/summary-prompt-version-known
- at: service.md:113
  node: rules/chat/rolling-summary-length
- at: service.md:114
  node: rules/chat/rolling-summary-length
- at: service.md:114
  node: rules/chat/distillation-failure-changes-nothing
- at: service.md:115
  node: rules/chat/rolling-summary-refresh
- at: service.md:118
  node: rules/chat/distillation-failure-changes-nothing
- at: service.md:119
  node: rules/chat/title-distillation
- at: service.md:119
  node: rules/chat/distilled-title-never-overwrites
- at: service.md:120
  node: rules/chat/title-distillation
- at: service.md:121
  node: rules/chat/distilled-title-length
- at: service.md:122
  node: rules/chat/distilled-title-never-overwrites
- at: service.md:125
  node: rules/chat/graph-delta-follows-tool-result
- at: service.md:126
  node: domain/chat/graph-delta
- at: service.md:127
  node: domain/chat/graph-delta-node
- at: service.md:127
  node: rules/chat/graph-delta-drops-incomplete
- at: service.md:128
  node: domain/chat/graph-delta-link
- at: service.md:129
  node: rules/chat/graph-delta-link-temporal
- at: service.md:130
  node: domain/chat/graph-delta-link
- at: service.md:131
  node: rules/chat/graph-delta-content
- at: service.md:131
  node: rules/chat/graph-delta-unreadable-result
- at: service.md:132
  node: rules/chat/graph-delta-content
- at: service.md:133
  node: rules/chat/graph-delta-content
- at: service.md:134
  node: rules/chat/graph-delta-content
- at: service.md:135
  node: rules/chat/graph-delta-content
- at: service.md:135
  node: rules/chat/graph-delta-directed-nodes-active
- at: service.md:136
  node: rules/chat/graph-delta-directed-links
- at: service.md:136
  node: rules/chat/graph-delta-unreadable-result
- at: service.md:137
  node: rules/chat/graph-delta-directed-links
- at: service.md:137
  node: rules/chat/graph-delta-drops-incomplete
- at: service.md:140
  node: rules/chat/one-turn-in-flight
- at: service.md:141
  outside: the mechanics of the in-process registry of turns in flight; implementation
- at: service.md:144
  node: contracts/chat/conversations
- at: service.md:145
  node: contracts/chat/conversations
- at: service.md:146
  node: contracts/chat/conversations
- at: service.md:146
  node: rules/chat/turn-failure-stop-reason
- at: service.md:147
  node: contracts/chat/conversations
- at: service.md:147
  node: rules/chat/turn-failure-stop-reason
- at: service.md:148
  node: contracts/chat/conversations
- at: service.md:148
  node: rules/chat/turn-failure-stop-reason
- at: service.md:149
  node: rules/chat/turn-time-limit
- at: service.md:150
  node: rules/chat/turn-cancel
- at: service.md:151
  node: rules/chat/turn-model-call-limit
- at: service.md:152
  node: rules/chat/tool-failure-continues-turn
- at: service.md:153
  node: rules/chat/tool-failure-continues-turn
- at: service.md:154
  node: rules/chat/tool-failure-continues-turn
- at: service.md:155
  node: contracts/chat/conversations
- at: service.md:156
  node: contracts/chat/conversations
- at: service.md:157
  node: contracts/chat/conversations
- at: service.md:158
  node: contracts/chat/conversations
- at: service.md:159
  node: contracts/chat/conversations
- at: service.md:160
  node: contracts/chat/conversations
- at: service.md:161
  node: contracts/chat/conversations
- at: service.md:162
  node: contracts/chat/conversations
- at: service.md:163
  node: contracts/chat/conversations
- at: service.md:164
  node: contracts/chat/conversations
- at: service.md:165
  node: contracts/chat/conversations
- at: service.md:166
  outside: a programming error of an internal call, not reachable by any caller; implementation
- at: service.md:167
  node: rules/chat/distillation-failure-changes-nothing
- at: service.md:168
  node: rules/chat/distillation-failure-changes-nothing
- at: service.md:168
  node: rules/chat/distilled-title-length
- at: service.md:171
  node: domain/chat/turn-event-kind
- at: service.md:172
  node: domain/chat/assistant-stop-reason
- at: service.md:173
  node: domain/chat/assistant-stop-reason
- at: service.md:174
  node: domain/chat/assistant-stop-reason
- at: service.md:175
  node: constraints/chat-toolset
- at: service.md:176
  node: constraints/chat-toolset
- at: service.md:177
  node: constraints/chat-toolset
- at: service.md:178
  node: rules/chat/graph-delta-follows-tool-result
- at: service.md:179
  node: domain/chat/graph-delta-node
- at: service.md:180
  node: domain/chat/graph-delta-link
- at: service.md:181
  node: rules/chat/graph-delta-directed-links
- at: service.md:182
  node: contracts/chat/conversations
- at: service.md:183
  node: contracts/chat/conversations
- at: service.md:184
  node: domain/chat/message-role
- at: service.md:185
  node: rules/chat/tool-invocation-carries-turn
- at: service.md:188
  outside: the model provider SDK is a vendor boundary; the specification names no third-party vendor
- at: service.md:189
  outside: the model provider SDK is a vendor boundary; the specification names no third-party vendor
- at: service.md:190
  outside: the registry other modules put their tools in; wiring
- at: service.md:191
  outside: 'a shape another increment owns: the retrieval and ingestion contracts hold the tool envelopes and results'
- at: service.md:192
  outside: 'a shape another increment owns: the retrieval and ingestion contracts hold the tool envelopes and results'
- at: service.md:193
  node: domain/knowledge-base/link-type
- at: service.md:194
  outside: 'a shape another increment owns: the retrieval and ingestion contracts hold the tool envelopes and results'
- at: service.md:195
  outside: the repository's call surface; implementation
- at: service.md:196
  outside: the prompt modules the service imports; wiring
- at: service.md:197
  outside: configuration names, not facts of the domain; the limits they set are held by the rules that name the configured values
- at: boundary.md:22
  node: contracts/chat/conversations
- at: boundary.md:23
  node: contracts/chat/conversations
- at: boundary.md:24
  node: contracts/chat/conversations
- at: boundary.md:24
  node: rules/chat/conversation-request-check-order
- at: boundary.md:25
  node: contracts/chat/conversations
- at: boundary.md:26
  node: contracts/chat/conversations
- at: boundary.md:26
  node: domain/chat/conversation
- at: boundary.md:27
  node: rules/chat/conversation-archived
- at: boundary.md:30
  node: contracts/chat/conversations
- at: boundary.md:31
  node: rules/chat/conversation-title-length
- at: boundary.md:31
  node: contracts/chat/conversations
- at: boundary.md:32
  node: contracts/chat/conversations
- at: boundary.md:33
  node: domain/chat/conversation
- at: boundary.md:34
  node: contracts/chat/conversations
- at: boundary.md:35
  node: rules/chat/conversation-request-check-order
- at: boundary.md:38
  node: rules/chat/conversation-listing-limit
- at: boundary.md:39
  node: domain/chat/conversation-listing
- at: boundary.md:40
  node: domain/chat/conversation-listing
- at: boundary.md:40
  node: rules/chat/conversation-listing-excludes-archived
- at: boundary.md:41
  node: rules/chat/conversation-listing-excludes-archived
- at: boundary.md:42
  node: rules/chat/conversation-listing-order
- at: boundary.md:43
  node: rules/chat/conversation-listing-order
- at: boundary.md:44
  node: contracts/chat/conversations
- at: boundary.md:45
  node: rules/chat/conversation-request-check-order
- at: boundary.md:48
  node: contracts/chat/conversations
- at: boundary.md:51
  node: rules/chat/conversation-title-length
- at: boundary.md:51
  node: rules/chat/conversation-update-partial
- at: boundary.md:52
  node: rules/chat/conversation-update-partial
- at: boundary.md:53
  node: rules/chat/conversation-update-partial
- at: boundary.md:54
  node: rules/chat/conversation-update-names-a-field
- at: boundary.md:55
  node: rules/chat/archived-conversation-takes-no-turn
- at: boundary.md:56
  node: contracts/chat/conversations
- at: boundary.md:57
  node: rules/chat/conversation-request-check-order
- at: boundary.md:60
  node: contracts/chat/conversations
- at: boundary.md:60
  node: domain/chat/conversation
- at: boundary.md:61
  node: rules/chat/archived-conversation-takes-no-turn
- at: boundary.md:62
  node: rules/chat/conversation-request-check-order
- at: boundary.md:65
  node: rules/chat/message-listing-limit
- at: boundary.md:66
  node: domain/chat/message-listing
- at: boundary.md:66
  node: rules/chat/message-listing-pages-backwards
- at: boundary.md:67
  node: rules/chat/message-listing-shows-exchanges
- at: boundary.md:68
  node: rules/chat/message-listing-shows-exchanges
- at: boundary.md:69
  node: contracts/chat/conversations
- at: boundary.md:69
  node: domain/chat/message
- at: boundary.md:70
  node: contracts/chat/conversations
- at: boundary.md:70
  node: rules/chat/message-listing-pages-backwards
- at: boundary.md:71
  node: rules/chat/conversation-request-check-order
- at: boundary.md:74
  node: contracts/chat/conversations
- at: boundary.md:74
  node: domain/chat/conversation-usage
- at: boundary.md:75
  node: rules/chat/conversation-usage-counts
- at: boundary.md:76
  node: rules/chat/conversation-usage-counts
- at: boundary.md:77
  node: rules/chat/conversation-usage-counts
- at: boundary.md:78
  node: contracts/chat/conversations
- at: boundary.md:81
  node: contracts/chat/conversations
- at: boundary.md:82
  node: rules/chat/graph-view-replaced-on-save
- at: boundary.md:82
  node: domain/chat/conversation
- at: boundary.md:83
  node: contracts/chat/conversations
- at: boundary.md:84
  node: contracts/chat/conversations
- at: boundary.md:84
  node: rules/chat/graph-view-snapshot-bounds
- at: boundary.md:88
  node: contracts/chat/conversations
- at: boundary.md:88
  node: domain/chat/graph-view
- at: boundary.md:89
  node: contracts/chat/conversations
- at: boundary.md:90
  node: contracts/chat/conversations
- at: boundary.md:91
  node: rules/chat/archived-conversation-takes-no-turn
- at: boundary.md:92
  node: rules/chat/conversation-request-check-order
- at: boundary.md:92
  node: contracts/chat/conversations
- at: boundary.md:95
  node: contracts/chat/conversations
- at: boundary.md:95
  node: rules/chat/turn-cancel
- at: boundary.md:96
  node: contracts/chat/conversations
- at: boundary.md:96
  node: rules/chat/conversation-request-check-order
- at: boundary.md:99
  node: contracts/chat/conversations
- at: boundary.md:99
  node: domain/chat/turn
- at: boundary.md:100
  node: rules/chat/turn-model-default
- at: boundary.md:101
  node: contracts/chat/conversations
- at: boundary.md:101
  node: domain/chat/turn
- at: boundary.md:102
  node: rules/chat/send-message-check-order
- at: boundary.md:103
  node: rules/chat/one-turn-in-flight
- at: boundary.md:104
  node: rules/chat/owner-message-recorded-first
- at: boundary.md:105
  node: rules/chat/idempotency-match
- at: boundary.md:106
  node: rules/chat/idempotent-replay
- at: boundary.md:106
  node: rules/chat/replay-reports-failure
- at: boundary.md:106
  node: contracts/chat/conversations
- at: boundary.md:110
  node: rules/chat/idempotent-recovery
- at: boundary.md:111
  node: contracts/chat/conversations
- at: boundary.md:111
  node: rules/chat/message-idempotency-key-unique
- at: boundary.md:112
  node: rules/chat/owner-message-recorded-first
- at: boundary.md:113
  node: contracts/chat/conversations
- at: boundary.md:114
  node: contracts/chat/conversations
- at: boundary.md:114
  node: domain/chat/turn-event-kind
- at: boundary.md:115
  node: rules/chat/graph-delta-follows-tool-result
- at: boundary.md:116
  node: contracts/chat/conversations
- at: boundary.md:116
  node: rules/chat/turn-failure-stop-reason
- at: boundary.md:117
  node: rules/chat/tool-call-recorded
- at: boundary.md:118
  node: rules/chat/iteration-recorded
- at: boundary.md:121
  node: rules/chat/assistant-answer-recorded
- at: boundary.md:122
  node: rules/chat/turn-failure-stop-reason
- at: boundary.md:122
  node: rules/chat/turn-model-stop-reason
- at: boundary.md:126
  node: rules/chat/recording-failure-keeps-stream
- at: boundary.md:127
  node: rules/chat/turn-cancel
- at: boundary.md:128
  node: rules/chat/distillation-follows-live-turn
- at: boundary.md:129
  node: rules/chat/model-context-window
- at: boundary.md:129
  node: rules/chat/model-context-owner-time
- at: boundary.md:132
  node: rules/chat/owner-written-message
- at: boundary.md:133
  node: rules/chat/turn-ending-message
- at: boundary.md:134
  node: rules/chat/model-context-window
- at: boundary.md:135
  node: rules/chat/rolling-summary-refresh
- at: boundary.md:136
  node: rules/chat/rolling-summary-overlap
- at: boundary.md:140
  node: rules/chat/rolling-summary-refresh
- at: boundary.md:141
  node: rules/chat/distilled-title-never-overwrites
- at: boundary.md:142
  node: rules/chat/title-distillation
- at: boundary.md:143
  node: rules/chat/owner-written-message
- at: boundary.md:144
  node: rules/chat/tool-call-recorded
- at: boundary.md:144
  node: domain/chat/tool-call
- at: boundary.md:145
  node: domain/chat/tool-call
- at: boundary.md:148
  node: contracts/chat/conversations
- at: boundary.md:149
  node: rules/chat/send-message-check-order
- at: boundary.md:149
  node: contracts/chat/conversations
- at: boundary.md:150
  node: contracts/chat/conversations
- at: boundary.md:151
  node: contracts/chat/conversations
- at: boundary.md:152
  node: contracts/chat/conversations
- at: boundary.md:152
  node: rules/chat/conversation-title-length
- at: boundary.md:153
  node: contracts/chat/conversations
- at: boundary.md:153
  node: rules/chat/conversation-listing-limit
- at: boundary.md:154
  node: contracts/chat/conversations
- at: boundary.md:155
  node: contracts/chat/conversations
- at: boundary.md:156
  node: contracts/chat/conversations
- at: boundary.md:156
  node: rules/chat/conversation-update-names-a-field
- at: boundary.md:157
  node: contracts/chat/conversations
- at: boundary.md:157
  node: rules/chat/conversation-update-names-a-field
- at: boundary.md:158
  node: contracts/chat/conversations
- at: boundary.md:158
  node: rules/chat/conversation-title-length
- at: boundary.md:159
  node: contracts/chat/conversations
- at: boundary.md:159
  node: rules/chat/message-listing-limit
- at: boundary.md:160
  node: contracts/chat/conversations
- at: boundary.md:160
  node: rules/chat/graph-view-snapshot-bounds
- at: boundary.md:161
  node: contracts/chat/conversations
- at: boundary.md:161
  node: rules/chat/archived-conversation-takes-no-turn
- at: boundary.md:162
  node: contracts/chat/conversations
- at: boundary.md:162
  node: rules/chat/cancel-requires-turn-in-flight
- at: boundary.md:163
  node: contracts/chat/conversations
- at: boundary.md:164
  node: contracts/chat/conversations
- at: boundary.md:165
  node: contracts/chat/conversations
- at: boundary.md:166
  node: contracts/chat/conversations
- at: boundary.md:166
  node: rules/chat/archived-conversation-takes-no-turn
- at: boundary.md:167
  node: contracts/chat/conversations
- at: boundary.md:167
  node: rules/chat/one-turn-in-flight
- at: boundary.md:168
  node: contracts/chat/conversations
- at: boundary.md:168
  node: rules/chat/idempotency-match
- at: boundary.md:169
  node: contracts/chat/conversations
- at: boundary.md:169
  node: rules/chat/one-turn-in-flight
- at: boundary.md:170
  node: contracts/chat/conversations
- at: boundary.md:170
  node: rules/chat/chat-toolset-requires-every-query-tool
- at: boundary.md:171
  node: contracts/chat/conversations
- at: boundary.md:172
  node: contracts/chat/conversations
- at: boundary.md:173
  node: contracts/chat/conversations
- at: boundary.md:173
  node: rules/chat/turn-failure-stop-reason
- at: boundary.md:174
  node: contracts/chat/conversations
- at: boundary.md:175
  node: contracts/chat/conversations
- at: boundary.md:178
  node: domain/chat/message-role
- at: boundary.md:179
  node: domain/chat/assistant-stop-reason
- at: boundary.md:180
  node: contracts/chat/conversations
- at: boundary.md:181
  node: domain/chat/assistant-stop-reason
- at: boundary.md:182
  node: domain/chat/turn-event-kind
- at: boundary.md:183
  node: contracts/chat/conversations
- at: boundary.md:184
  node: domain/chat/graph-layout
- at: boundary.md:185
  node: contracts/chat/conversations
- at: boundary.md:186
  node: contracts/chat/conversations
- at: boundary.md:189
  outside: this system's own store layout, which its implementation chose; persistence is not domain knowledge
- at: boundary.md:190
  outside: this system's own store layout, which its implementation chose; persistence is not domain knowledge
- at: boundary.md:191
  outside: this system's own store layout, which its implementation chose; persistence is not domain knowledge
- at: boundary.md:192
  outside: this system's own store layout, which its implementation chose; persistence is not domain knowledge
- at: boundary.md:193
  outside: the store signal for a reused key; the uniqueness is held by rules/chat/message-idempotency-key-unique
- at: boundary.md:194
  outside: the model provider's content-block shape, carried whole as a message's content text
- at: boundary.md:195
  node: constraints/chat-toolset
- at: boundary.md:196
  outside: configuration names, not facts of the domain; the limits they set are held by the rules that name the configured values
- at: boundary.md:197
  node: rules/chat/graph-delta-link-temporal
- at: prompts.md:21
  node: domain/chat/chat-prompt-version
- at: prompts.md:21
  node: rules/chat/chat-prompt-version-known
- at: prompts.md:22
  node: rules/chat/default-chat-prompt-version
- at: prompts.md:23
  node: rules/chat/chat-prompt-version-known
- at: prompts.md:24
  node: rules/chat/chat-prompt-presents-catalog
- at: prompts.md:27
  node: rules/chat/chat-prompt-carries-marker
- at: prompts.md:28
  node: rules/chat/chat-prompt-carries-marker
- at: prompts.md:31
  node: constraints/chat-toolset
- at: prompts.md:32
  node: rules/chat/assistant-answers-in-portuguese
- at: prompts.md:33
  node: constraints/chat-content-is-data
- at: prompts.md:34
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:35
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:36
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:37
  node: rules/chat/assistant-states-uncertainty
- at: prompts.md:38
  node: rules/chat/assistant-withholds-internals
- at: prompts.md:39
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:42
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:43
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:44
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:45
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:46
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:47
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:50
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:51
  node: rules/chat/chat-prompt-presents-catalog
- at: prompts.md:52
  node: rules/chat/chat-prompt-presents-catalog
- at: prompts.md:53
  node: rules/chat/chat-prompt-presents-catalog
- at: prompts.md:54
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:55
  node: rules/chat/chat-prompt-presents-catalog
- at: prompts.md:56
  node: rules/chat/chat-prompt-presents-catalog
- at: prompts.md:57
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:58
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:59
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:60
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:61
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:62
  outside: guidance for the asynchronous-ingestion tools, which the chat toolset does not hold; prompt text, not held
- at: prompts.md:65
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:66
  node: rules/chat/assistant-writes-only-on-owner-request
- at: prompts.md:67
  outside: restates the directed ingestion payload the ingestion contract holds; prompt text
- at: prompts.md:68
  outside: restates the directed ingestion payload the ingestion contract holds; prompt text
- at: prompts.md:69
  outside: restates directed node pinning, which rules/knowledge-base/directed-pinned-node holds; prompt text
- at: prompts.md:70
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:71
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:72
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:73
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:74
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:75
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:76
  node: constraints/chat-content-is-data
- at: prompts.md:77
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:78
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:81
  node: domain/chat/summary-prompt-version
- at: prompts.md:81
  node: rules/chat/summary-prompt-version-known
- at: prompts.md:82
  node: rules/chat/default-summary-prompt-version
- at: prompts.md:83
  node: rules/chat/summary-prompt-version-known
- at: prompts.md:84
  node: rules/chat/rolling-summary-refresh
- at: prompts.md:87
  outside: the v1 summary text, which the default version does not use; prompt text, not held
- at: prompts.md:88
  outside: the v1 summary text, which the default version does not use; prompt text, not held
- at: prompts.md:89
  outside: the v1 composer, which the default version does not use; implementation
- at: prompts.md:92
  node: rules/chat/rolling-summary-folds
- at: prompts.md:93
  node: rules/chat/rolling-summary-folds
- at: prompts.md:94
  node: rules/chat/rolling-summary-folds
- at: prompts.md:94
  node: rules/chat/rolling-summary-length
- at: prompts.md:95
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:96
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:97
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:98
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:99
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:105
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:106
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:109
  outside: 'observed and not decided: a second summary text kept beside the registry; prompt text, not held'
- at: prompts.md:110
  node: rules/chat/distilled-title-length
- at: prompts.md:111
  outside: prompt guidance addressed to the model, not a fact of the domain; prompt text is not held, as in the ingestion adoption
- at: prompts.md:112
  outside: the utility prompts are not chat prompt versions, which alone carry the marker; prompt text
- at: prompts.md:115
  node: rules/chat/chat-prompt-version-known
- at: prompts.md:116
  node: rules/chat/summary-prompt-version-known
- at: prompts.md:119
  node: domain/chat/chat-prompt-version
- at: prompts.md:120
  node: domain/chat/summary-prompt-version
- at: prompts.md:121
  outside: restates the directed item statuses domain/knowledge-base/directed-item-status holds; prompt text
- at: prompts.md:122
  outside: restates the start-date bases domain/knowledge-base/valid-from-basis holds; prompt text
- at: prompts.md:123
  outside: layout of a prompt text, not a fact of the domain
- at: prompts.md:126
  node: rules/chat/chat-prompt-presents-catalog
- at: prompts.md:127
  outside: the model provider SDK is a vendor boundary; the specification names no third-party vendor
- at: prompts.md:128
  node: constraints/chat-toolset
- at: prompts.md:129
  outside: tools the chat toolset does not hold, named by prompt text
- at: prompts.md:130
  outside: restates the directed ingestion payload and envelope the ingestion contract holds
- at: prompts.md:131
  outside: catalog flags domain/knowledge-base/link-type holds, named by prompt text
- at: prompts.md:132
  node: domain/chat/tool-call
---
