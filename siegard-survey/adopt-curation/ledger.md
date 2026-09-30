---
contract_version: siegard-ledger/1
material:
- service.md
- boundary.md
entries:
- at: service.md:23
  node: constraints/curation-is-atomic
- at: service.md:23
  node: rules/knowledge-base/refused-curation-records-nothing
- at: service.md:24
  node: rules/knowledge-base/entity-match-resolution-records-curation-action
- at: service.md:24
  node: rules/knowledge-base/node-merge-records-curation-action
- at: service.md:24
  node: rules/knowledge-base/dispute-resolution-records-curation-action
- at: service.md:24
  node: rules/knowledge-base/assertion-review-records-curation-action
- at: service.md:24
  node: rules/knowledge-base/correction-records-curation-action
- at: service.md:24
  node: contracts/knowledge-base/curation
- at: service.md:25
  node: contracts/knowledge-base/curation
- at: service.md:28
  node: domain/knowledge-base/entity-match-resolution
- at: service.md:28
  node: domain/knowledge-base/entity-match-decision
- at: service.md:29
  node: rules/knowledge-base/entity-match-resolution-check-order
- at: service.md:29
  node: rules/knowledge-base/node-never-merged-into-itself
- at: service.md:30
  node: rules/knowledge-base/entity-match-resolution-check-order
- at: service.md:31
  node: rules/knowledge-base/keep-separate-activates-node
- at: service.md:31
  node: rules/knowledge-base/entity-match-resolution-clears-reviews
- at: service.md:31
  node: rules/knowledge-base/entity-match-resolution-records-curation-action
- at: service.md:32
  node: contracts/knowledge-base/curation
- at: service.md:33
  node: rules/knowledge-base/unused-resolution-fields-ignored
- at: service.md:34
  node: rules/knowledge-base/merge-into-requires-target
- at: service.md:35
  node: rules/knowledge-base/entity-match-resolution-requires-pending-review
- at: service.md:35
  node: rules/knowledge-base/merge-marks-absorbed-merged
- at: service.md:35
  node: rules/knowledge-base/entity-match-resolution-clears-reviews
- at: service.md:35
  node: rules/knowledge-base/entity-match-resolution-records-curation-action
- at: service.md:36
  node: contracts/knowledge-base/curation
- at: service.md:36
  node: domain/knowledge-base/merge-counts
- at: service.md:39
  node: domain/knowledge-base/node-merge
- at: service.md:39
  node: rules/knowledge-base/node-merge-absorbs-active-node
- at: service.md:39
  node: rules/knowledge-base/node-merge-records-curation-action
- at: service.md:39
  node: rules/knowledge-base/curation-reason-required
- at: service.md:40
  node: contracts/knowledge-base/curation
- at: service.md:43
  node: rules/knowledge-base/merge-check-order
- at: service.md:44
  node: rules/knowledge-base/merge-check-order
- at: service.md:44
  node: rules/knowledge-base/curation-refuses-deleted-node
- at: service.md:45
  node: rules/knowledge-base/merge-survivor-active
- at: service.md:46
  node: rules/knowledge-base/merge-requires-same-node-type
- at: service.md:47
  node: rules/knowledge-base/merge-marks-absorbed-merged
- at: service.md:47
  node: rules/knowledge-base/merge-compresses-paths
- at: service.md:47
  node: rules/knowledge-base/merge-copies-aliases
- at: service.md:47
  node: rules/knowledge-base/merge-repoints-assertions
- at: service.md:48
  node: domain/knowledge-base/merge-counts
- at: service.md:48
  node: rules/knowledge-base/merge-counts-what-it-changed
- at: service.md:51
  node: domain/knowledge-base/dispute-resolution
- at: service.md:51
  node: domain/knowledge-base/dispute-decision
- at: service.md:52
  node: rules/knowledge-base/dispute-resolution-check-order
- at: service.md:53
  node: contracts/knowledge-base/curation
- at: service.md:54
  node: rules/knowledge-base/dispute-scope
- at: service.md:55
  node: rules/knowledge-base/keep-disputed-changes-nothing
- at: service.md:55
  node: rules/knowledge-base/dispute-resolution-records-curation-action
- at: service.md:56
  node: contracts/knowledge-base/curation
- at: service.md:57
  node: rules/knowledge-base/prefer-one-requires-winner
- at: service.md:58
  node: rules/knowledge-base/prefer-one-outcome
- at: service.md:59
  node: rules/knowledge-base/dispute-resolution-records-curation-action
- at: service.md:60
  node: rules/knowledge-base/adjust-periods-one-per-item
- at: service.md:61
  node: rules/knowledge-base/adjusted-periods-single-open
- at: service.md:62
  outside: 'observed and not decided: every link and attribute names a link type or attribute key the catalog holds, so the case of a scope type missing from the catalog does not arise in the domain'
- at: service.md:63
  node: rules/knowledge-base/adjust-periods-outcome
- at: service.md:63
  node: domain/knowledge-base/adjusted-period
- at: service.md:64
  node: rules/knowledge-base/dispute-resolution-records-curation-action
- at: service.md:65
  node: contracts/knowledge-base/curation
- at: service.md:66
  node: contracts/knowledge-base/curation
- at: service.md:69
  node: domain/knowledge-base/assertion-review
- at: service.md:69
  node: rules/knowledge-base/assertion-review-check-order
- at: service.md:69
  node: rules/knowledge-base/confirmation-requires-uncertain
- at: service.md:70
  node: rules/knowledge-base/confirmation-activates
- at: service.md:70
  node: rules/knowledge-base/assertion-review-records-curation-action
- at: service.md:71
  node: contracts/knowledge-base/curation
- at: service.md:74
  node: rules/knowledge-base/assertion-review-check-order
- at: service.md:74
  node: rules/knowledge-base/rejection-and-correction-require-live-item
- at: service.md:74
  node: rules/knowledge-base/curation-reason-required
- at: service.md:75
  node: rules/knowledge-base/rejection-and-correction-require-live-item
- at: service.md:75
  node: rules/knowledge-base/rejection-deletes
- at: service.md:75
  node: rules/knowledge-base/assertion-review-records-curation-action
- at: service.md:76
  node: contracts/knowledge-base/curation
- at: service.md:79
  node: domain/knowledge-base/assertion-correction
- at: service.md:79
  node: domain/knowledge-base/corrected-values
- at: service.md:80
  node: rules/knowledge-base/correction-check-order
- at: service.md:81
  node: rules/knowledge-base/correction-check-order
- at: service.md:81
  node: rules/knowledge-base/attribute-value-parses
- at: service.md:82
  node: rules/knowledge-base/correction-check-order
- at: service.md:82
  node: constraints/curation-is-atomic
- at: service.md:83
  node: contracts/knowledge-base/curation
- at: service.md:84
  node: rules/knowledge-base/correction-supersedes-item
- at: service.md:84
  node: rules/knowledge-base/corrected-item-values
- at: service.md:84
  node: rules/knowledge-base/corrected-item-provenance
- at: service.md:84
  node: rules/knowledge-base/correction-records-curation-action
- at: service.md:85
  node: rules/knowledge-base/corrected-item-values
- at: service.md:86
  node: rules/knowledge-base/correction-records-curation-action
- at: service.md:87
  node: contracts/knowledge-base/curation
- at: service.md:90
  node: domain/knowledge-base/review-queue-filter
- at: service.md:90
  node: rules/knowledge-base/review-queue-kinds
- at: service.md:91
  node: constraints/curation-reads-are-consistent
- at: service.md:92
  node: rules/knowledge-base/review-queue-page-windows-entries
- at: service.md:93
  node: rules/knowledge-base/review-queue-total-before-pagination
- at: service.md:94
  node: contracts/knowledge-base/curation
- at: service.md:95
  node: rules/knowledge-base/review-queue-order
- at: service.md:96
  node: rules/knowledge-base/review-queue-page-windows-entries
- at: service.md:97
  node: rules/knowledge-base/entity-match-queue-entry
- at: service.md:97
  node: contracts/knowledge-base/curation
- at: service.md:98
  node: rules/knowledge-base/entity-match-queue-entry
- at: service.md:98
  node: contracts/knowledge-base/curation
- at: service.md:99
  node: contracts/knowledge-base/curation
- at: service.md:99
  node: domain/knowledge-base/dispute-scope
- at: service.md:100
  node: rules/knowledge-base/dispute-scope
- at: service.md:100
  node: contracts/knowledge-base/curation
- at: service.md:101
  node: contracts/knowledge-base/curation
- at: service.md:102
  node: rules/knowledge-base/dispute-scope
- at: service.md:102
  node: contracts/knowledge-base/curation
- at: service.md:103
  node: contracts/knowledge-base/curation
- at: service.md:104
  node: rules/knowledge-base/dispute-entry-time
- at: service.md:107
  node: domain/knowledge-base/curation-metrics
- at: service.md:107
  node: contracts/knowledge-base/curation
- at: service.md:108
  node: constraints/curation-reads-are-consistent
- at: service.md:109
  node: contracts/knowledge-base/curation
- at: service.md:112
  node: contracts/knowledge-base/curation
- at: service.md:115
  node: rules/knowledge-base/node-never-merged-into-itself
- at: service.md:115
  node: contracts/knowledge-base/curation
- at: service.md:116
  node: contracts/knowledge-base/curation
- at: service.md:117
  node: rules/knowledge-base/curation-refuses-deleted-node
- at: service.md:117
  node: contracts/knowledge-base/curation
- at: service.md:118
  node: rules/knowledge-base/entity-match-resolution-requires-pending-review
- at: service.md:118
  node: contracts/knowledge-base/curation
- at: service.md:119
  node: contracts/knowledge-base/curation
- at: service.md:120
  node: rules/knowledge-base/merge-into-requires-target
- at: service.md:120
  node: contracts/knowledge-base/curation
- at: service.md:121
  node: rules/knowledge-base/node-never-merged-into-itself
- at: service.md:121
  node: contracts/knowledge-base/curation
- at: service.md:122
  node: contracts/knowledge-base/curation
- at: service.md:123
  node: rules/knowledge-base/curation-refuses-deleted-node
- at: service.md:123
  node: contracts/knowledge-base/curation
- at: service.md:124
  node: rules/knowledge-base/merge-survivor-active
- at: service.md:124
  node: contracts/knowledge-base/curation
- at: service.md:125
  node: rules/knowledge-base/entity-match-resolution-requires-pending-review
- at: service.md:125
  node: contracts/knowledge-base/curation
- at: service.md:126
  node: rules/knowledge-base/node-merge-absorbs-active-node
- at: service.md:126
  node: contracts/knowledge-base/curation
- at: service.md:127
  node: rules/knowledge-base/merge-requires-same-node-type
- at: service.md:127
  node: contracts/knowledge-base/curation
- at: service.md:128
  node: contracts/knowledge-base/curation
- at: service.md:129
  node: contracts/knowledge-base/curation
- at: service.md:130
  node: rules/knowledge-base/dispute-resolution-requires-disputed-items
- at: service.md:130
  node: contracts/knowledge-base/curation
- at: service.md:131
  node: rules/knowledge-base/dispute-resolution-single-scope
- at: service.md:131
  node: contracts/knowledge-base/curation
- at: service.md:132
  node: rules/knowledge-base/prefer-one-requires-winner
- at: service.md:132
  node: contracts/knowledge-base/curation
- at: service.md:133
  node: contracts/knowledge-base/curation
- at: service.md:134
  node: contracts/knowledge-base/curation
- at: service.md:135
  node: rules/knowledge-base/adjust-periods-one-per-item
- at: service.md:135
  node: contracts/knowledge-base/curation
- at: service.md:136
  node: rules/knowledge-base/adjusted-periods-single-open
- at: service.md:136
  node: contracts/knowledge-base/curation
- at: service.md:137
  node: contracts/knowledge-base/curation
- at: service.md:138
  node: contracts/knowledge-base/curation
- at: service.md:139
  node: rules/knowledge-base/confirmation-requires-uncertain
- at: service.md:139
  node: contracts/knowledge-base/curation
- at: service.md:140
  node: contracts/knowledge-base/curation
- at: service.md:141
  node: rules/knowledge-base/rejection-and-correction-require-live-item
- at: service.md:141
  node: contracts/knowledge-base/curation
- at: service.md:142
  node: contracts/knowledge-base/curation
- at: service.md:143
  node: rules/knowledge-base/rejection-and-correction-require-live-item
- at: service.md:143
  node: contracts/knowledge-base/curation
- at: service.md:144
  node: rules/knowledge-base/correction-fragment-accepted
- at: service.md:144
  node: contracts/knowledge-base/curation
- at: service.md:145
  node: contracts/knowledge-base/curation
- at: service.md:146
  node: contracts/knowledge-base/curation
- at: service.md:147
  node: rules/knowledge-base/attribute-value-parses
- at: service.md:147
  node: contracts/knowledge-base/curation
- at: service.md:148
  node: rules/knowledge-base/attribute-value-in-allowed-values
- at: service.md:148
  node: contracts/knowledge-base/curation
- at: service.md:149
  node: contracts/knowledge-base/curation
- at: service.md:150
  node: contracts/knowledge-base/curation
- at: service.md:151
  outside: 'observed and not decided: an error class no operation of the area raises answers nothing a caller reads'
- at: service.md:154
  node: domain/knowledge-base/curation-action-kind
- at: service.md:155
  node: domain/knowledge-base/curation-target-kind
- at: service.md:156
  node: domain/knowledge-base/dispute-decision
- at: service.md:157
  node: domain/knowledge-base/entity-match-decision
- at: service.md:158
  node: contracts/knowledge-base/curation
- at: service.md:159
  node: domain/knowledge-base/assertion-kind
- at: service.md:160
  node: domain/knowledge-base/review-queue-kind
- at: service.md:161
  node: domain/knowledge-base/valid-from-basis
- at: service.md:162
  node: rules/knowledge-base/merge-check-order
- at: service.md:163
  node: contracts/knowledge-base/curation
- at: service.md:164
  node: contracts/knowledge-base/curation
- at: service.md:167
  outside: a read of the catalog inside the same knowledge-base context, which the link-type and attribute-key nodes already hold, not a boundary another system imposes
- at: service.md:168
  outside: a read of the catalog inside the same knowledge-base context, which the attribute-key and allowed-value nodes already hold, not a boundary another system imposes
- at: service.md:169
  node: rules/knowledge-base/attribute-value-parses
- at: service.md:169
  node: rules/knowledge-base/attribute-value-in-allowed-values
- at: service.md:170
  node: rules/knowledge-base/entity-match-queue-entry
- at: service.md:170
  node: rules/knowledge-base/entity-match-resolution-clears-reviews
- at: service.md:171
  node: rules/knowledge-base/correction-fragment-accepted
- at: service.md:172
  outside: 'implementation knowledge: which query computes the aggregates the metrics rules define'
- at: boundary.md:25
  node: contracts/knowledge-base/curation
- at: boundary.md:26
  node: contracts/knowledge-base/curation
- at: boundary.md:27
  node: domain/knowledge-base/review-queue-filter
- at: boundary.md:28
  node: rules/knowledge-base/page-limit-bounds
- at: boundary.md:28
  node: rules/knowledge-base/page-defaults
- at: boundary.md:29
  node: rules/knowledge-base/page-offset-non-negative
- at: boundary.md:29
  node: rules/knowledge-base/page-defaults
- at: boundary.md:30
  node: rules/knowledge-base/entity-match-queue-entry
- at: boundary.md:30
  node: contracts/knowledge-base/curation
- at: boundary.md:31
  node: rules/knowledge-base/review-queue-order
- at: boundary.md:31
  node: rules/knowledge-base/entity-match-queue-entry
- at: boundary.md:32
  node: rules/knowledge-base/review-queue-total-before-pagination
- at: boundary.md:33
  node: rules/knowledge-base/dispute-queue-entry
- at: boundary.md:33
  node: contracts/knowledge-base/curation
- at: boundary.md:34
  node: rules/knowledge-base/dispute-queue-entry
- at: boundary.md:34
  node: contracts/knowledge-base/curation
- at: boundary.md:35
  node: rules/knowledge-base/review-queue-total-before-pagination
- at: boundary.md:36
  node: contracts/knowledge-base/curation
- at: boundary.md:39
  node: contracts/knowledge-base/curation
- at: boundary.md:40
  node: rules/knowledge-base/accept-rate
- at: boundary.md:41
  node: rules/knowledge-base/reject-rate-by-code
- at: boundary.md:42
  node: rules/knowledge-base/metrics-review-counts
- at: boundary.md:43
  node: rules/knowledge-base/metrics-assertion-counts
- at: boundary.md:44
  node: rules/knowledge-base/metrics-assertion-counts
- at: boundary.md:45
  node: rules/knowledge-base/metrics-disputed-queue-count
- at: boundary.md:48
  node: contracts/knowledge-base/curation
- at: boundary.md:49
  node: domain/knowledge-base/entity-match-resolution
- at: boundary.md:49
  node: rules/knowledge-base/curation-reason-not-blank
- at: boundary.md:50
  node: rules/knowledge-base/merge-into-requires-target
- at: boundary.md:50
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:51
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:52
  node: contracts/knowledge-base/curation
- at: boundary.md:53
  node: rules/knowledge-base/keep-separate-activates-node
- at: boundary.md:54
  node: rules/knowledge-base/entity-match-resolution-clears-reviews
- at: boundary.md:57
  node: domain/knowledge-base/node-merge
- at: boundary.md:57
  node: contracts/knowledge-base/curation
- at: boundary.md:58
  node: rules/knowledge-base/node-never-merged-into-itself
- at: boundary.md:59
  node: contracts/knowledge-base/curation
- at: boundary.md:60
  node: rules/knowledge-base/merge-marks-absorbed-merged
- at: boundary.md:60
  node: rules/knowledge-base/merge-check-order
- at: boundary.md:61
  node: rules/knowledge-base/merge-compresses-paths
- at: boundary.md:62
  node: rules/knowledge-base/merge-copies-aliases
- at: boundary.md:63
  node: rules/knowledge-base/merge-repoints-assertions
- at: boundary.md:64
  node: rules/knowledge-base/merge-repoints-assertions
- at: boundary.md:67
  node: contracts/knowledge-base/curation
- at: boundary.md:68
  node: domain/knowledge-base/dispute-resolution
- at: boundary.md:68
  node: rules/knowledge-base/dispute-resolution-distinct-items
- at: boundary.md:69
  node: domain/knowledge-base/adjusted-period
- at: boundary.md:70
  node: rules/knowledge-base/dispute-resolution-distinct-items
- at: boundary.md:71
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:71
  node: rules/knowledge-base/prefer-one-requires-winner
- at: boundary.md:72
  node: rules/knowledge-base/adjust-periods-one-per-item
- at: boundary.md:73
  node: rules/knowledge-base/adjust-periods-one-per-item
- at: boundary.md:74
  node: rules/knowledge-base/validity-start-before-end
- at: boundary.md:75
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:76
  node: rules/knowledge-base/unused-resolution-fields-ignored
- at: boundary.md:77
  node: rules/knowledge-base/prefer-one-outcome
- at: boundary.md:78
  node: rules/knowledge-base/prefer-one-outcome
- at: boundary.md:79
  node: rules/knowledge-base/adjust-periods-outcome
- at: boundary.md:82
  node: domain/knowledge-base/assertion-review
- at: boundary.md:82
  node: contracts/knowledge-base/curation
- at: boundary.md:83
  node: rules/knowledge-base/confirmation-activates
- at: boundary.md:83
  node: rules/knowledge-base/confirmation-requires-uncertain
- at: boundary.md:86
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:86
  node: contracts/knowledge-base/curation
- at: boundary.md:87
  node: rules/knowledge-base/rejection-deletes
- at: boundary.md:87
  node: rules/knowledge-base/rejection-and-correction-require-live-item
- at: boundary.md:90
  node: domain/knowledge-base/assertion-correction
- at: boundary.md:90
  node: contracts/knowledge-base/curation
- at: boundary.md:91
  node: domain/knowledge-base/corrected-values
- at: boundary.md:92
  node: rules/knowledge-base/correction-changes-something
- at: boundary.md:93
  node: rules/knowledge-base/correction-fits-assertion-kind
- at: boundary.md:94
  node: rules/knowledge-base/stated-start-requires-basis
- at: boundary.md:94
  node: rules/knowledge-base/corrected-stated-start-cites-fragment
- at: boundary.md:95
  node: domain/knowledge-base/corrected-values
- at: boundary.md:96
  node: rules/knowledge-base/validity-start-before-end
- at: boundary.md:97
  node: rules/knowledge-base/correction-supersedes-item
- at: boundary.md:97
  node: rules/knowledge-base/rejection-and-correction-require-live-item
- at: boundary.md:98
  node: rules/knowledge-base/corrected-item-values
- at: boundary.md:98
  node: rules/knowledge-base/correction-supersedes-item
- at: boundary.md:98
  node: domain/knowledge-base/knowledge-link
- at: boundary.md:99
  node: rules/knowledge-base/corrected-item-values
- at: boundary.md:99
  node: rules/knowledge-base/correction-supersedes-item
- at: boundary.md:99
  node: domain/knowledge-base/node-attribute
- at: boundary.md:100
  node: rules/knowledge-base/corrected-item-values
- at: boundary.md:101
  node: rules/knowledge-base/corrected-item-provenance
- at: boundary.md:102
  node: rules/knowledge-base/corrected-item-provenance
- at: boundary.md:103
  node: rules/knowledge-base/correction-fragment-accepted
- at: boundary.md:106
  node: domain/knowledge-base/curation-action
- at: boundary.md:106
  node: domain/knowledge-base/curation-target-kind
- at: boundary.md:109
  node: contracts/knowledge-base/curation
- at: boundary.md:110
  node: contracts/knowledge-base/curation
- at: boundary.md:111
  node: rules/knowledge-base/curation-reason-not-blank
- at: boundary.md:114
  node: constraints/curation-transports-answer-alike
- at: boundary.md:114
  node: contracts/knowledge-base/curation
- at: boundary.md:115
  node: constraints/llm-toolset-omits-curation-metrics
- at: boundary.md:116
  outside: 'implementation knowledge: the route this system chose for its own MCP endpoint, which a published surface keeps out of the specification'
- at: boundary.md:117
  outside: 'implementation knowledge: how the MCP endpoint is wired to the tool registry, which answers nothing a caller of an operation reads'
- at: boundary.md:118
  node: constraints/curation-transports-answer-alike
- at: boundary.md:118
  node: contracts/knowledge-base/curation
- at: boundary.md:119
  node: contracts/knowledge-base/curation
- at: boundary.md:120
  outside: 'implementation knowledge: the descriptions published to the language model are emitted text of the tool surface, not a domain fact'
- at: boundary.md:123
  node: contracts/knowledge-base/curation
- at: boundary.md:124
  node: contracts/knowledge-base/curation
- at: boundary.md:125
  node: rules/knowledge-base/curation-request-checked-first
- at: boundary.md:126
  node: rules/knowledge-base/curation-request-check-order
- at: boundary.md:127
  node: rules/knowledge-base/curation-request-check-order
- at: boundary.md:128
  node: rules/knowledge-base/curation-request-check-order
- at: boundary.md:129
  node: rules/knowledge-base/curation-request-check-order
- at: boundary.md:130
  node: rules/knowledge-base/curation-request-check-order
- at: boundary.md:131
  node: rules/knowledge-base/curation-request-check-order
- at: boundary.md:132
  node: contracts/knowledge-base/curation
- at: boundary.md:135
  node: rules/knowledge-base/merge-into-requires-target
- at: boundary.md:135
  node: contracts/knowledge-base/curation
- at: boundary.md:136
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:136
  node: rules/knowledge-base/curation-reason-not-blank
- at: boundary.md:136
  node: contracts/knowledge-base/curation
- at: boundary.md:137
  node: contracts/knowledge-base/curation
- at: boundary.md:138
  node: rules/knowledge-base/node-never-merged-into-itself
- at: boundary.md:138
  node: contracts/knowledge-base/curation
- at: boundary.md:139
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:139
  node: contracts/knowledge-base/curation
- at: boundary.md:140
  node: rules/knowledge-base/dispute-resolution-distinct-items
- at: boundary.md:140
  node: contracts/knowledge-base/curation
- at: boundary.md:141
  node: rules/knowledge-base/dispute-resolution-distinct-items
- at: boundary.md:141
  node: contracts/knowledge-base/curation
- at: boundary.md:142
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:142
  node: contracts/knowledge-base/curation
- at: boundary.md:143
  node: rules/knowledge-base/prefer-one-requires-winner
- at: boundary.md:143
  node: contracts/knowledge-base/curation
- at: boundary.md:144
  node: rules/knowledge-base/adjust-periods-one-per-item
- at: boundary.md:144
  node: contracts/knowledge-base/curation
- at: boundary.md:145
  node: rules/knowledge-base/validity-start-before-end
- at: boundary.md:145
  node: contracts/knowledge-base/curation
- at: boundary.md:146
  node: contracts/knowledge-base/curation
- at: boundary.md:147
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:147
  node: contracts/knowledge-base/curation
- at: boundary.md:148
  node: rules/knowledge-base/correction-changes-something
- at: boundary.md:148
  node: contracts/knowledge-base/curation
- at: boundary.md:149
  node: rules/knowledge-base/correction-fits-assertion-kind
- at: boundary.md:149
  node: contracts/knowledge-base/curation
- at: boundary.md:150
  node: rules/knowledge-base/stated-start-requires-basis
- at: boundary.md:150
  node: rules/knowledge-base/corrected-stated-start-cites-fragment
- at: boundary.md:150
  node: contracts/knowledge-base/curation
- at: boundary.md:151
  node: rules/knowledge-base/validity-start-before-end
- at: boundary.md:151
  node: contracts/knowledge-base/curation
- at: boundary.md:152
  node: rules/knowledge-base/curation-reason-required
- at: boundary.md:152
  node: contracts/knowledge-base/curation
- at: boundary.md:153
  node: contracts/knowledge-base/curation
- at: boundary.md:154
  node: contracts/knowledge-base/curation
- at: boundary.md:155
  node: contracts/knowledge-base/curation
- at: boundary.md:156
  node: contracts/knowledge-base/curation
- at: boundary.md:157
  node: contracts/knowledge-base/curation
- at: boundary.md:158
  node: contracts/knowledge-base/curation
- at: boundary.md:159
  node: contracts/knowledge-base/curation
- at: boundary.md:160
  node: contracts/knowledge-base/curation
- at: boundary.md:163
  node: domain/knowledge-base/assertion-kind
- at: boundary.md:164
  node: domain/knowledge-base/review-queue-kind
- at: boundary.md:165
  node: domain/knowledge-base/entity-match-decision
- at: boundary.md:166
  node: domain/knowledge-base/dispute-decision
- at: boundary.md:167
  node: domain/knowledge-base/node-status
- at: boundary.md:168
  node: domain/knowledge-base/assertion-status
- at: boundary.md:169
  node: domain/knowledge-base/valid-from-basis
- at: boundary.md:170
  node: domain/knowledge-base/curation-target-kind
- at: boundary.md:171
  node: constraints/llm-toolset-omits-curation-metrics
- at: boundary.md:172
  node: rules/knowledge-base/accept-rate
- at: boundary.md:173
  node: domain/knowledge-base/value-type
- at: boundary.md:174
  node: rules/knowledge-base/curation-request-check-order
- at: boundary.md:177
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:178
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:179
  node: rules/knowledge-base/alias-unique-per-node
- at: boundary.md:179
  node: rules/knowledge-base/merge-copies-aliases
- at: boundary.md:180
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:181
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:182
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:183
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:184
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:185
  node: rules/knowledge-base/link-provenance-once-per-fragment
- at: boundary.md:185
  node: rules/knowledge-base/attribute-provenance-once-per-fragment
- at: boundary.md:186
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:187
  node: domain/knowledge-base/curation-action
- at: boundary.md:187
  node: rules/knowledge-base/curation-action-time-is-recording-time
- at: boundary.md:188
  node: rules/knowledge-base/metrics-assertion-counts
- at: boundary.md:189
  outside: 'implementation knowledge: the storage or locking mechanism, not a fact of the domain'
- at: boundary.md:190
  node: contracts/knowledge-base/curation
- at: boundary.md:191
  outside: a read of the catalog inside the same knowledge-base context, not a boundary another system imposes
- at: boundary.md:192
  node: constraints/llm-toolset-omits-audit-reads
---

# Ledger — adopt-curation

Where every fact line of `service.md` and `boundary.md` went.
