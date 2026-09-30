---
contract_version: siegard-ledger/1
material:
- service.md
- boundary.md
- storage.md
entries:
- at: service.md:23
  node: contracts/knowledge-base/retrieval
- at: service.md:24
  node: contracts/knowledge-base/retrieval
- at: service.md:24
  node: domain/knowledge-base/node-type
- at: service.md:27
  node: contracts/knowledge-base/retrieval
- at: service.md:28
  node: contracts/knowledge-base/retrieval
- at: service.md:28
  node: domain/knowledge-base/link-type
- at: service.md:29
  node: rules/knowledge-base/link-type-rules-on-request
- at: service.md:29
  node: contracts/knowledge-base/retrieval
- at: service.md:30
  node: contracts/knowledge-base/retrieval
- at: service.md:30
  node: domain/knowledge-base/link-type-rule
- at: service.md:33
  node: rules/knowledge-base/attribute-key-listing-by-node-type
- at: service.md:34
  node: rules/knowledge-base/node-type-filter-in-catalog
- at: service.md:35
  node: rules/knowledge-base/attribute-key-listing-by-node-type
- at: service.md:36
  node: contracts/knowledge-base/retrieval
- at: service.md:37
  node: contracts/knowledge-base/retrieval
- at: service.md:37
  node: domain/knowledge-base/attribute-key
- at: service.md:38
  node: rules/knowledge-base/allowed-values-in-string-order
- at: service.md:38
  node: contracts/knowledge-base/retrieval
- at: service.md:41
  node: domain/knowledge-base/node-filter
- at: service.md:42
  node: rules/knowledge-base/node-type-filter-in-catalog
- at: service.md:43
  node: rules/knowledge-base/node-listing-by-status
- at: service.md:44
  node: rules/knowledge-base/node-listing-name-prefix
- at: service.md:44
  node: rules/knowledge-base/name-normalization
- at: service.md:45
  node: contracts/knowledge-base/retrieval
- at: service.md:48
  node: contracts/knowledge-base/retrieval
- at: service.md:49
  node: rules/knowledge-base/deleted-node-read-refused
- at: service.md:50
  node: rules/knowledge-base/merged-node-read-as-itself
- at: service.md:51
  node: contracts/knowledge-base/retrieval
- at: service.md:52
  node: domain/knowledge-base/node-view
- at: service.md:52
  node: rules/knowledge-base/graph-read-current-view
- at: service.md:52
  node: rules/knowledge-base/graph-read-as-of-view
- at: service.md:52
  node: rules/knowledge-base/graph-read-in-effect-only
- at: service.md:52
  node: rules/knowledge-base/node-read-excludes-uncertain-on-request
- at: service.md:53
  node: rules/knowledge-base/graph-read-shows-empty-provenance
- at: service.md:56
  node: contracts/knowledge-base/retrieval
- at: service.md:57
  node: rules/knowledge-base/point-reads-answer-any-status
- at: service.md:58
  node: rules/knowledge-base/graph-read-shows-empty-provenance
- at: service.md:61
  node: contracts/knowledge-base/retrieval
- at: service.md:62
  node: rules/knowledge-base/point-reads-answer-any-status
- at: service.md:63
  node: rules/knowledge-base/graph-read-shows-empty-provenance
- at: service.md:66
  node: rules/knowledge-base/lineage-history
- at: service.md:66
  node: contracts/knowledge-base/retrieval
- at: service.md:67
  node: contracts/knowledge-base/retrieval
- at: service.md:68
  node: rules/knowledge-base/lineage-history
- at: service.md:68
  node: contracts/knowledge-base/retrieval
- at: service.md:69
  node: contracts/knowledge-base/retrieval
- at: service.md:70
  node: rules/knowledge-base/attribute-key-history-check-order
- at: service.md:71
  node: rules/knowledge-base/merged-node-read-as-itself
- at: service.md:72
  node: rules/knowledge-base/attribute-key-history-requires-registered-key
- at: service.md:73
  node: contracts/knowledge-base/retrieval
- at: service.md:73
  node: rules/knowledge-base/attribute-key-history
- at: service.md:74
  node: rules/knowledge-base/graph-read-shows-empty-provenance
- at: service.md:77
  node: contracts/knowledge-base/retrieval
- at: service.md:78
  node: contracts/knowledge-base/retrieval
- at: service.md:78
  node: domain/knowledge-base/node-alias
- at: service.md:79
  node: contracts/knowledge-base/retrieval
- at: service.md:80
  node: contracts/knowledge-base/retrieval
- at: service.md:81
  node: contracts/knowledge-base/retrieval
- at: service.md:82
  node: rules/knowledge-base/graph-provenance-order
- at: service.md:83
  node: contracts/knowledge-base/retrieval
- at: service.md:84
  node: contracts/knowledge-base/retrieval
- at: service.md:85
  outside: 'Implementation knowledge: a fallback for a timestamp the store always holds.'
- at: service.md:86
  node: contracts/knowledge-base/retrieval
- at: service.md:87
  node: rules/knowledge-base/graph-item-flags
- at: service.md:88
  node: contracts/knowledge-base/retrieval
- at: service.md:91
  node: rules/knowledge-base/name-normalization
- at: service.md:94
  node: rules/knowledge-base/expansion-depth-bounds
- at: service.md:95
  node: rules/knowledge-base/traversal-defaults
- at: service.md:96
  node: rules/knowledge-base/traversal-link-score
- at: service.md:97
  node: rules/knowledge-base/traversal-check-order
- at: service.md:98
  node: rules/knowledge-base/traversal-defaults
- at: service.md:98
  node: rules/knowledge-base/expansion-restricted-to-named-link-types
- at: service.md:99
  node: rules/knowledge-base/traversal-direction
- at: service.md:99
  node: domain/knowledge-base/traversal-direction
- at: service.md:100
  node: rules/knowledge-base/traversal-merged-start
- at: service.md:100
  node: contracts/knowledge-base/retrieval
- at: service.md:101
  node: rules/knowledge-base/graph-read-current-view
- at: service.md:101
  node: rules/knowledge-base/graph-read-as-of-view
- at: service.md:101
  node: rules/knowledge-base/graph-read-in-effect-only
- at: service.md:102
  outside: The expansion simply has nothing further to reach; no node states when its loop ends.
- at: service.md:103
  node: rules/knowledge-base/traversal-link-once
- at: service.md:103
  node: rules/knowledge-base/traversal-link-score
- at: service.md:104
  node: rules/knowledge-base/traversal-substitutes-merged-ends
- at: service.md:105
  node: rules/knowledge-base/traversal-drops-merge-self-loops
- at: service.md:106
  node: rules/knowledge-base/traversal-expands-live-nodes
- at: service.md:107
  node: rules/knowledge-base/traversal-lists-reached-nodes
- at: service.md:108
  node: rules/knowledge-base/traversal-order
- at: service.md:109
  node: contracts/knowledge-base/retrieval
- at: service.md:110
  node: contracts/knowledge-base/retrieval
- at: service.md:111
  node: rules/knowledge-base/expansion-depth-bounds
- at: service.md:114
  node: contracts/knowledge-base/retrieval
- at: service.md:115
  node: contracts/knowledge-base/retrieval
- at: service.md:116
  node: contracts/knowledge-base/retrieval
- at: service.md:117
  node: contracts/knowledge-base/retrieval
- at: service.md:118
  node: contracts/knowledge-base/retrieval
- at: service.md:119
  node: contracts/knowledge-base/retrieval
- at: service.md:120
  node: contracts/knowledge-base/retrieval
- at: service.md:121
  node: contracts/knowledge-base/retrieval
- at: service.md:122
  node: contracts/knowledge-base/retrieval
- at: service.md:125
  node: domain/knowledge-base/assertion-status
- at: service.md:126
  node: domain/knowledge-base/effective-status
- at: service.md:127
  node: domain/knowledge-base/source-type
- at: service.md:128
  node: rules/knowledge-base/graph-item-flags
- at: service.md:129
  node: domain/knowledge-base/traversal-direction
- at: service.md:130
  node: domain/knowledge-base/node-status
- at: service.md:131
  outside: 'Implementation knowledge: which item kind a batched provenance read is issued for.'
- at: service.md:134
  node: rules/knowledge-base/effective-status
- at: service.md:134
  node: rules/knowledge-base/current-assertion
- at: service.md:134
  node: rules/knowledge-base/in-effect-assertion
- at: service.md:135
  outside: 'Implementation knowledge: which layer computes each read; what the read holds is stated by its own rules.'
- at: service.md:136
  outside: 'Implementation knowledge: the catalog is checked against a snapshot loaded at startup.'
- at: service.md:137
  outside: 'Implementation knowledge: the catalog listings read the stored catalog.'
- at: boundary.md:32
  node: constraints/retrieval-is-read-only
- at: boundary.md:33
  node: constraints/retrieval-transports-answer-alike
- at: boundary.md:34
  node: contracts/knowledge-base/retrieval
- at: boundary.md:35
  node: contracts/knowledge-base/retrieval
- at: boundary.md:36
  node: contracts/knowledge-base/retrieval
- at: boundary.md:37
  node: contracts/knowledge-base/retrieval
- at: boundary.md:38
  outside: 'Wiring: the MCP handler catches every thrown value; what each failure answers is the contract''s.'
- at: boundary.md:39
  node: contracts/knowledge-base/retrieval
- at: boundary.md:40
  node: contracts/knowledge-base/retrieval
- at: boundary.md:43
  node: contracts/knowledge-base/retrieval
- at: boundary.md:44
  node: contracts/knowledge-base/retrieval
- at: boundary.md:45
  node: contracts/knowledge-base/retrieval
- at: boundary.md:46
  outside: A coercion quirk of the parameter parser; an empty limit read as 0 is then refused by the page bound.
- at: boundary.md:47
  node: contracts/knowledge-base/retrieval
- at: boundary.md:48
  node: contracts/knowledge-base/retrieval
- at: boundary.md:49
  node: contracts/knowledge-base/retrieval
- at: boundary.md:50
  outside: 'Transport shape: how the MCP input spells the parameters REST splits between path and query.'
- at: boundary.md:53
  node: contracts/knowledge-base/retrieval
- at: boundary.md:54
  node: contracts/knowledge-base/retrieval
- at: boundary.md:55
  node: contracts/knowledge-base/retrieval
- at: boundary.md:55
  node: domain/knowledge-base/node-type
- at: boundary.md:58
  node: rules/knowledge-base/link-type-rules-on-request
- at: boundary.md:58
  node: contracts/knowledge-base/retrieval
- at: boundary.md:59
  node: contracts/knowledge-base/retrieval
- at: boundary.md:59
  node: domain/knowledge-base/link-type
- at: boundary.md:60
  node: contracts/knowledge-base/retrieval
- at: boundary.md:60
  node: domain/knowledge-base/link-type-rule
- at: boundary.md:63
  node: contracts/knowledge-base/retrieval
- at: boundary.md:64
  node: rules/knowledge-base/node-type-filter-in-catalog
- at: boundary.md:65
  node: contracts/knowledge-base/retrieval
- at: boundary.md:65
  node: domain/knowledge-base/attribute-key
- at: boundary.md:68
  node: domain/knowledge-base/node-filter
- at: boundary.md:68
  node: contracts/knowledge-base/retrieval
- at: boundary.md:69
  node: rules/knowledge-base/page-limit-bounds
- at: boundary.md:69
  node: rules/knowledge-base/page-defaults
- at: boundary.md:70
  node: rules/knowledge-base/page-offset-non-negative
- at: boundary.md:70
  node: rules/knowledge-base/page-defaults
- at: boundary.md:71
  node: rules/knowledge-base/node-type-filter-in-catalog
- at: boundary.md:72
  node: contracts/knowledge-base/retrieval
- at: boundary.md:73
  node: contracts/knowledge-base/retrieval
- at: boundary.md:76
  node: domain/knowledge-base/node-view
- at: boundary.md:76
  node: rules/knowledge-base/node-view-defaults
- at: boundary.md:77
  outside: Which issues one refusal lists follows each transport's parsing order; both transports answer the same code.
- at: boundary.md:78
  outside: Which issues one refusal lists follows each transport's parsing order; both transports answer the same code.
- at: boundary.md:79
  node: contracts/knowledge-base/retrieval
- at: boundary.md:80
  node: contracts/knowledge-base/retrieval
- at: boundary.md:80
  node: domain/knowledge-base/node-alias
- at: boundary.md:83
  node: contracts/knowledge-base/retrieval
- at: boundary.md:84
  node: contracts/knowledge-base/retrieval
- at: boundary.md:84
  node: domain/knowledge-base/knowledge-link
- at: boundary.md:87
  node: contracts/knowledge-base/retrieval
- at: boundary.md:88
  node: contracts/knowledge-base/retrieval
- at: boundary.md:88
  node: domain/knowledge-base/node-attribute
- at: boundary.md:91
  node: contracts/knowledge-base/retrieval
- at: boundary.md:94
  node: domain/knowledge-base/traversal-request
- at: boundary.md:94
  node: rules/knowledge-base/traversal-defaults
- at: boundary.md:95
  node: contracts/knowledge-base/retrieval
- at: boundary.md:95
  node: domain/knowledge-base/traversal-request
- at: boundary.md:96
  node: contracts/knowledge-base/retrieval
- at: boundary.md:97
  node: rules/knowledge-base/expansion-depth-bounds
- at: boundary.md:97
  node: contracts/knowledge-base/retrieval
- at: boundary.md:98
  node: rules/knowledge-base/traversal-check-order
- at: boundary.md:99
  outside: 'Implementation knowledge: the catalog is checked against a snapshot loaded at startup.'
- at: boundary.md:100
  node: contracts/knowledge-base/retrieval
- at: boundary.md:101
  node: rules/knowledge-base/expansion-depth-bounds
- at: boundary.md:101
  node: rules/knowledge-base/traversal-defaults
- at: boundary.md:101
  node: rules/knowledge-base/traversal-link-score
- at: boundary.md:104
  node: contracts/knowledge-base/retrieval
- at: boundary.md:104
  node: rules/knowledge-base/lineage-history
- at: boundary.md:107
  node: contracts/knowledge-base/retrieval
- at: boundary.md:107
  node: rules/knowledge-base/lineage-history
- at: boundary.md:110
  node: contracts/knowledge-base/retrieval
- at: boundary.md:111
  outside: 'Implementation knowledge: the catalog is checked against a snapshot loaded at startup.'
- at: boundary.md:114
  node: constraints/llm-toolset-omits-graph-point-reads
- at: boundary.md:115
  outside: The answer is the shared MCP transport kernel's, which this context does not decide.
- at: boundary.md:116
  outside: Transport wording and schema derivation that introduce a tool to its caller, not a domain fact.
- at: boundary.md:119
  node: contracts/knowledge-base/retrieval
- at: boundary.md:120
  node: contracts/knowledge-base/retrieval
- at: boundary.md:121
  node: contracts/knowledge-base/retrieval
- at: boundary.md:122
  node: contracts/knowledge-base/retrieval
- at: boundary.md:123
  node: contracts/knowledge-base/retrieval
- at: boundary.md:124
  node: contracts/knowledge-base/retrieval
- at: boundary.md:125
  node: contracts/knowledge-base/retrieval
- at: boundary.md:126
  node: contracts/knowledge-base/retrieval
- at: boundary.md:127
  node: contracts/knowledge-base/retrieval
- at: boundary.md:128
  node: contracts/knowledge-base/retrieval
- at: boundary.md:129
  node: contracts/knowledge-base/retrieval
- at: boundary.md:130
  node: contracts/knowledge-base/retrieval
- at: boundary.md:131
  node: contracts/knowledge-base/retrieval
- at: boundary.md:132
  outside: The answer is the shared MCP transport kernel's, which this context does not decide.
- at: boundary.md:133
  outside: The answer is the shared MCP transport kernel's, which this context does not decide.
- at: boundary.md:134
  node: contracts/knowledge-base/retrieval
- at: boundary.md:135
  node: contracts/knowledge-base/retrieval
- at: boundary.md:136
  node: contracts/knowledge-base/retrieval
- at: boundary.md:137
  node: contracts/knowledge-base/retrieval
- at: boundary.md:138
  node: contracts/knowledge-base/retrieval
- at: boundary.md:141
  node: domain/knowledge-base/node-status
- at: boundary.md:142
  node: domain/knowledge-base/assertion-status
- at: boundary.md:143
  node: domain/knowledge-base/effective-status
- at: boundary.md:144
  node: domain/knowledge-base/assertion-flag
- at: boundary.md:145
  node: domain/knowledge-base/valid-from-basis
- at: boundary.md:146
  node: domain/knowledge-base/value-type
- at: boundary.md:147
  node: domain/knowledge-base/alias-kind
- at: boundary.md:148
  node: domain/knowledge-base/source-type
- at: boundary.md:149
  node: domain/knowledge-base/traversal-direction
- at: boundary.md:150
  node: contracts/knowledge-base/retrieval
- at: boundary.md:151
  node: constraints/llm-toolset-omits-graph-point-reads
- at: boundary.md:152
  node: domain/knowledge-base/search-layer
- at: boundary.md:155
  outside: 'Implementation knowledge: the catalog is checked against a snapshot loaded at startup.'
- at: boundary.md:156
  node: contracts/knowledge-base/retrieval
- at: boundary.md:157
  outside: Shared error mapping, which this context does not decide.
- at: boundary.md:158
  outside: The answer is the shared MCP transport kernel's, which this context does not decide.
- at: boundary.md:159
  outside: 'Wiring: the shared tool registry.'
- at: boundary.md:160
  outside: 'Wiring: the traversal is exported for the search expansion to reuse.'
- at: storage.md:16
  node: domain/knowledge-base/node-type
- at: storage.md:17
  node: domain/knowledge-base/link-type
- at: storage.md:18
  node: domain/knowledge-base/link-type-rule
- at: storage.md:19
  outside: 'Implementation knowledge: how the snapshot holds the rules in memory.'
- at: storage.md:20
  node: domain/knowledge-base/attribute-key
- at: storage.md:21
  node: domain/knowledge-base/allowed-value
- at: storage.md:22
  node: rules/knowledge-base/node-type-name-unique
- at: storage.md:22
  node: rules/knowledge-base/link-type-name-unique
- at: storage.md:23
  node: rules/knowledge-base/attribute-key-unique-per-node-type
- at: storage.md:24
  node: rules/knowledge-base/allowed-value-unique-per-key
- at: storage.md:27
  node: rules/knowledge-base/node-type-listing-order
- at: storage.md:27
  node: contracts/knowledge-base/retrieval
- at: storage.md:28
  node: rules/knowledge-base/link-type-listing-order
- at: storage.md:28
  node: contracts/knowledge-base/retrieval
- at: storage.md:29
  node: rules/knowledge-base/link-type-rules-on-request
- at: storage.md:29
  node: contracts/knowledge-base/retrieval
- at: storage.md:30
  node: rules/knowledge-base/link-type-listing-order
- at: storage.md:31
  node: contracts/knowledge-base/retrieval
- at: storage.md:32
  node: rules/knowledge-base/attribute-key-listing-by-node-type
- at: storage.md:32
  node: rules/knowledge-base/attribute-key-listing-order
- at: storage.md:33
  node: rules/knowledge-base/allowed-values-in-string-order
- at: storage.md:33
  node: rules/knowledge-base/attribute-key-listing-by-node-type
- at: storage.md:36
  node: contracts/knowledge-base/retrieval
- at: storage.md:37
  outside: 'Implementation knowledge: a repository read; what each operation does with what it reads is held by that operation''s rules.'
- at: storage.md:38
  outside: 'Implementation knowledge: a batched read issued once per operation.'
- at: storage.md:39
  node: rules/knowledge-base/node-listing-by-status
- at: storage.md:40
  node: rules/knowledge-base/node-listing-name-prefix
- at: storage.md:41
  node: rules/knowledge-base/node-listing-name-prefix
- at: storage.md:42
  node: rules/knowledge-base/node-listing-one-entry-per-node
- at: storage.md:43
  node: rules/knowledge-base/node-listing-total-before-pagination
- at: storage.md:43
  node: contracts/knowledge-base/retrieval
- at: storage.md:44
  node: rules/knowledge-base/node-listing-order
- at: storage.md:47
  node: rules/knowledge-base/node-read-alias-order
- at: storage.md:47
  node: contracts/knowledge-base/retrieval
- at: storage.md:50
  node: contracts/knowledge-base/retrieval
- at: storage.md:52
  node: rules/knowledge-base/graph-read-current-view
- at: storage.md:52
  node: rules/knowledge-base/graph-read-as-of-view
- at: storage.md:53
  node: rules/knowledge-base/node-read-excludes-uncertain-on-request
- at: storage.md:54
  outside: The listing's only guard against deleted attributes is the supersession time, which the current and as-of views already require.
- at: storage.md:55
  node: rules/knowledge-base/node-read-attribute-order
- at: storage.md:56
  node: rules/knowledge-base/point-reads-answer-any-status
- at: storage.md:59
  node: rules/knowledge-base/point-reads-answer-any-status
- at: storage.md:59
  node: contracts/knowledge-base/retrieval
- at: storage.md:62
  node: rules/knowledge-base/graph-read-current-view
- at: storage.md:62
  node: rules/knowledge-base/current-assertion
- at: storage.md:63
  node: rules/knowledge-base/graph-read-in-effect-only
- at: storage.md:63
  node: rules/knowledge-base/in-effect-assertion
- at: storage.md:64
  node: rules/knowledge-base/graph-read-as-of-view
- at: storage.md:65
  node: rules/knowledge-base/graph-read-as-of-view
- at: storage.md:66
  node: rules/knowledge-base/graph-read-in-effect-only
- at: storage.md:67
  node: contracts/knowledge-base/retrieval
- at: storage.md:70
  outside: 'Implementation knowledge: a batched read issued once per operation.'
- at: storage.md:71
  node: contracts/knowledge-base/retrieval
- at: storage.md:72
  node: rules/knowledge-base/graph-provenance-one-entry-per-chunk
- at: storage.md:73
  node: rules/knowledge-base/graph-provenance-excerpt-is-chunk-excerpt
- at: storage.md:74
  node: rules/knowledge-base/graph-provenance-hides-compliance-deleted
- at: storage.md:75
  node: rules/knowledge-base/graph-provenance-order
- at: storage.md:78
  node: rules/knowledge-base/traversal-direction
- at: storage.md:79
  node: rules/knowledge-base/expansion-restricted-to-named-link-types
- at: storage.md:79
  node: rules/knowledge-base/traversal-defaults
- at: storage.md:80
  node: rules/knowledge-base/traversal-skips-deleted-links
- at: storage.md:81
  node: rules/knowledge-base/traversal-lists-reached-nodes
- at: storage.md:82
  outside: The expansion simply has nothing further to reach; no node states when its loop ends.
- at: storage.md:85
  node: rules/knowledge-base/lineage-history
- at: storage.md:86
  node: rules/knowledge-base/lineage-history
- at: storage.md:87
  node: rules/knowledge-base/lineage-history
- at: storage.md:87
  node: rules/knowledge-base/history-order
- at: storage.md:87
  node: contracts/knowledge-base/retrieval
- at: storage.md:88
  node: rules/knowledge-base/lineage-history
- at: storage.md:89
  node: rules/knowledge-base/attribute-key-history
- at: storage.md:89
  node: rules/knowledge-base/history-order
- at: storage.md:92
  outside: 'Security: the filter''s guard against an unsafe table qualifier, which no caller reaches.'
- at: storage.md:95
  node: domain/knowledge-base/node-status
- at: storage.md:96
  node: domain/knowledge-base/alias-kind
- at: storage.md:97
  node: domain/knowledge-base/assertion-status
- at: storage.md:98
  node: domain/knowledge-base/valid-from-basis
- at: storage.md:99
  node: domain/knowledge-base/value-type
- at: storage.md:100
  outside: 'Implementation knowledge: which item kind a batched provenance read is issued for.'
- at: storage.md:103
  node: rules/knowledge-base/effective-status
- at: storage.md:103
  node: rules/knowledge-base/current-assertion
- at: storage.md:103
  node: rules/knowledge-base/in-effect-assertion
- at: storage.md:104
  node: rules/knowledge-base/effective-status
- at: storage.md:104
  node: rules/knowledge-base/current-assertion
- at: storage.md:104
  node: rules/knowledge-base/in-effect-assertion
- at: storage.md:105
  outside: This system's own storage, which its implementation chose.
- at: storage.md:106
  node: rules/knowledge-base/name-normalization
- at: storage.md:107
  outside: This system's own storage, which its implementation chose.
---

## Description

Where every fact line of the knowledge-graph survey landed.
