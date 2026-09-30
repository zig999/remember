---
contract_version: siegard-ledger/1
material:
- service.md
- boundary.md
entries:
- at: service.md:15
  node: domain/knowledge-base/compliance-deletion
- at: service.md:15
  node: contracts/knowledge-base/compliance-audit
- at: service.md:16
  node: rules/knowledge-base/compliance-deletion-check-order
- at: service.md:17
  node: rules/knowledge-base/compliance-deletion-check-order
- at: service.md:18
  node: rules/knowledge-base/compliance-deletion-tombstones
- at: service.md:18
  node: rules/knowledge-base/source-status-active-or-deleted
- at: service.md:19
  node: rules/knowledge-base/deleted-source-deletion-records-nothing
- at: service.md:19
  node: contracts/knowledge-base/compliance-audit
- at: service.md:20
  node: contracts/knowledge-base/compliance-audit
- at: service.md:21
  node: contracts/knowledge-base/compliance-audit
- at: service.md:22
  node: rules/knowledge-base/compliance-deletion-tombstones
- at: service.md:22
  node: rules/knowledge-base/compliance-deletion-propagates
- at: service.md:23
  node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
- at: service.md:23
  node: domain/knowledge-base/affected-counts
- at: service.md:24
  node: domain/knowledge-base/compliance-deletion
- at: service.md:25
  node: rules/knowledge-base/compliance-deletion-records-curation-action
- at: service.md:33
  node: contracts/knowledge-base/compliance-audit
- at: service.md:34
  node: rules/knowledge-base/deleted-source-deletion-records-nothing
- at: service.md:34
  node: constraints/compliance-deletion-is-atomic
- at: service.md:35
  outside: 'Implementation knowledge: the service runs on a transaction its caller opens.'
- at: service.md:36
  node: rules/knowledge-base/compliance-deletion-redacts-content
- at: service.md:39
  node: contracts/knowledge-base/compliance-audit
- at: service.md:47
  outside: 'Implementation knowledge: a defensive reading of stored counts that this system only ever writes as non-negative integers.'
- at: service.md:55
  node: domain/knowledge-base/compliance-deletion-filter
- at: service.md:56
  node: contracts/knowledge-base/compliance-audit
- at: service.md:59
  node: contracts/knowledge-base/compliance-audit
- at: service.md:62
  node: domain/knowledge-base/curation-action-filter
- at: service.md:63
  node: contracts/knowledge-base/compliance-audit
- at: service.md:66
  node: contracts/knowledge-base/compliance-audit
- at: service.md:67
  node: contracts/knowledge-base/compliance-audit
- at: service.md:67
  node: domain/knowledge-base/curation-action
- at: service.md:68
  node: contracts/knowledge-base/compliance-audit
- at: service.md:71
  node: contracts/knowledge-base/compliance-audit
- at: service.md:72
  outside: No operation in this context raises the service's validation refusal, so no caller reads this answer.
- at: service.md:73
  node: contracts/knowledge-base/compliance-audit
- at: service.md:74
  outside: Every refusal raised in this context carries details, so no caller reads an empty details object.
- at: service.md:77
  node: contracts/knowledge-base/compliance-audit
- at: service.md:78
  node: contracts/knowledge-base/compliance-audit
- at: service.md:78
  node: rules/knowledge-base/deleted-source-deletion-records-nothing
- at: service.md:79
  node: contracts/knowledge-base/compliance-audit
- at: service.md:80
  node: contracts/knowledge-base/compliance-audit
- at: service.md:81
  node: contracts/knowledge-base/compliance-audit
- at: service.md:82
  node: contracts/knowledge-base/compliance-audit
- at: service.md:83
  node: contracts/knowledge-base/compliance-audit
- at: service.md:84
  outside: No operation in this context raises the service's validation refusal, so no caller reads this answer.
- at: service.md:87
  node: domain/knowledge-base/compliance-deletion-outcome
- at: service.md:88
  node: contracts/knowledge-base/compliance-audit
- at: service.md:89
  outside: Internal failure reasons reach the log and not the caller.
- at: service.md:90
  node: contracts/knowledge-base/compliance-audit
- at: service.md:91
  node: domain/knowledge-base/affected-counts
- at: service.md:94
  node: domain/knowledge-base/raw-information
- at: service.md:94
  node: rules/knowledge-base/source-status-active-or-deleted
- at: service.md:95
  outside: 'Implementation knowledge: where in the module the request and answer shapes are declared.'
- at: service.md:101
  node: domain/knowledge-base/curation-action-kind
- at: service.md:101
  node: rules/knowledge-base/compliance-deletion-records-curation-action
- at: boundary.md:21
  node: domain/knowledge-base/compliance-deletion
- at: boundary.md:21
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:22
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:23
  node: rules/knowledge-base/compliance-deletion-reason-length
- at: boundary.md:24
  node: rules/knowledge-base/compliance-deletion-reason-trimmed
- at: boundary.md:25
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:26
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:27
  node: constraints/compliance-deletion-is-atomic
- at: boundary.md:28
  node: rules/knowledge-base/compliance-deletion-check-order
- at: boundary.md:31
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:32
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:32
  node: domain/knowledge-base/compliance-deletion
- at: boundary.md:33
  node: domain/knowledge-base/affected-counts
- at: boundary.md:34
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:35
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:35
  node: rules/knowledge-base/deleted-source-deletion-records-nothing
- at: boundary.md:36
  node: constraints/llm-toolset-omits-audit-reads
- at: boundary.md:37
  outside: 'Implementation knowledge: the MCP tool declares its input by reusing the request schema.'
- at: boundary.md:38
  outside: Transport wording that introduces the tool to its caller, not a domain fact.
- at: boundary.md:41
  outside: 'Implementation knowledge: the row lock that serializes concurrent compliance deletions of one raw information.'
- at: boundary.md:42
  node: rules/knowledge-base/compliance-deletion-redacts-content
- at: boundary.md:43
  node: rules/knowledge-base/compliance-deletion-redacts-content
- at: boundary.md:44
  node: rules/knowledge-base/compliance-deletion-flags-metadata
- at: boundary.md:45
  node: rules/knowledge-base/compliance-deletion-tombstones
- at: boundary.md:46
  node: rules/knowledge-base/compliance-deletion-keeps-content-hash
- at: boundary.md:47
  node: constraints/compliance-deletion-is-atomic
- at: boundary.md:50
  node: rules/knowledge-base/compliance-deletion-tombstones
- at: boundary.md:50
  node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
- at: boundary.md:51
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:52
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:53
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:53
  node: rules/knowledge-base/compliance-deletion-tombstones
- at: boundary.md:53
  node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
- at: boundary.md:54
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:55
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:55
  node: rules/knowledge-base/compliance-deletion-tombstones
- at: boundary.md:55
  node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
- at: boundary.md:56
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:57
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:57
  node: rules/knowledge-base/compliance-deletion-tombstones
- at: boundary.md:57
  node: rules/knowledge-base/compliance-deletion-counts-what-it-marked
- at: boundary.md:58
  node: rules/knowledge-base/compliance-deletion-propagates
- at: boundary.md:61
  node: domain/knowledge-base/compliance-deletion
- at: boundary.md:61
  node: rules/knowledge-base/deletion-execution-time-is-recording-time
- at: boundary.md:62
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:63
  node: domain/knowledge-base/curation-action
- at: boundary.md:63
  node: rules/knowledge-base/curation-action-time-is-recording-time
- at: boundary.md:66
  node: domain/knowledge-base/compliance-deletion-filter
- at: boundary.md:66
  node: rules/knowledge-base/audit-filters-match-exactly
- at: boundary.md:67
  node: rules/knowledge-base/audit-listing-window-half-open
- at: boundary.md:68
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:69
  node: rules/knowledge-base/audit-window-ordered
- at: boundary.md:70
  node: rules/knowledge-base/page-limit-bounds
- at: boundary.md:70
  node: rules/knowledge-base/page-offset-non-negative
- at: boundary.md:70
  node: rules/knowledge-base/audit-page-defaults
- at: boundary.md:70
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:71
  node: rules/knowledge-base/audit-listing-order
- at: boundary.md:72
  node: rules/knowledge-base/audit-listing-total-before-pagination
- at: boundary.md:73
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:74
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:75
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:78
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:79
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:82
  node: domain/knowledge-base/curation-action-filter
- at: boundary.md:82
  node: rules/knowledge-base/audit-filters-match-exactly
- at: boundary.md:82
  node: domain/knowledge-base/curation-action-kind
- at: boundary.md:82
  node: domain/knowledge-base/curation-target-kind
- at: boundary.md:83
  node: rules/knowledge-base/audit-listing-window-half-open
- at: boundary.md:83
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:84
  node: rules/knowledge-base/audit-window-ordered
- at: boundary.md:85
  node: rules/knowledge-base/page-limit-bounds
- at: boundary.md:85
  node: rules/knowledge-base/page-offset-non-negative
- at: boundary.md:85
  node: rules/knowledge-base/audit-page-defaults
- at: boundary.md:86
  node: rules/knowledge-base/audit-listing-order
- at: boundary.md:86
  node: rules/knowledge-base/audit-listing-total-before-pagination
- at: boundary.md:87
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:87
  node: rules/knowledge-base/curation-action-reason-length
- at: boundary.md:88
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:91
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:94
  outside: Which operations write is no fact apart from the rules that govern what each operation does.
- at: boundary.md:95
  node: constraints/llm-toolset-omits-audit-reads
- at: boundary.md:98
  node: rules/knowledge-base/audit-filter-checks-order
- at: boundary.md:99
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:100
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:103
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:104
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:105
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:106
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:107
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:108
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:109
  outside: No operation in this context raises the service's validation refusal, so no caller reads this answer.
- at: boundary.md:110
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:111
  outside: The answer is the shared REST error handler's, which this context does not decide.
- at: boundary.md:112
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:113
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:114
  outside: The answer is the MCP transport kernel's, which this context does not decide.
- at: boundary.md:115
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:118
  node: domain/knowledge-base/compliance-deletion-outcome
- at: boundary.md:119
  node: domain/knowledge-base/curation-action-kind
- at: boundary.md:120
  node: domain/knowledge-base/curation-target-kind
- at: boundary.md:121
  node: domain/knowledge-base/node-status
- at: boundary.md:121
  node: rules/knowledge-base/source-status-active-or-deleted
- at: boundary.md:122
  node: domain/knowledge-base/affected-counts
- at: boundary.md:123
  node: contracts/knowledge-base/compliance-audit
- at: boundary.md:126
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:127
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:128
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:129
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:130
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:131
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:132
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:133
  outside: This system's own storage, which its implementation chose.
- at: boundary.md:134
  node: constraints/llm-toolset-omits-audit-reads
- at: boundary.md:135
  outside: 'Implementation knowledge: a shared helper that renders failure answers.'
- at: boundary.md:136
  outside: 'Wiring: which layer the transports call.'
---

## Description

Where every fact line of the compliance-audit survey landed.
