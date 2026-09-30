---
contract_version: siegard-ledger/1
material:
- transport.md
entries:
- at: transport.md:18
  node: constraints/failures-answer-one-envelope
- at: transport.md:18
  node: contracts/knowledge-base/access
- at: transport.md:19
  node: constraints/failures-answer-one-envelope
- at: transport.md:20
  outside: a lookup the implementation chose; each code's status is held by the answers of the contracts whose operations raise it
- at: transport.md:21
  node: constraints/failures-answer-one-envelope
- at: transport.md:22
  node: constraints/mcp-failure-is-tool-error
- at: transport.md:23
  node: constraints/ingestion-transports-answer-alike
- at: transport.md:23
  node: constraints/retrieval-transports-answer-alike
- at: transport.md:23
  node: constraints/curation-transports-answer-alike
- at: transport.md:24
  node: constraints/internal-failure-withholds-cause
- at: transport.md:27
  node: contracts/knowledge-base/access
- at: transport.md:28
  node: contracts/knowledge-base/access
- at: transport.md:37
  node: contracts/knowledge-base/access
- at: transport.md:38
  node: constraints/unreachable-store-answers-unavailable
- at: transport.md:38
  node: contracts/knowledge-base/access
- at: transport.md:39
  node: contracts/knowledge-base/access
- at: transport.md:40
  node: contracts/knowledge-base/access
- at: transport.md:41
  node: contracts/knowledge-base/access
- at: transport.md:42
  node: contracts/knowledge-base/access
- at: transport.md:49
  node: constraints/every-operation-requires-owner-authentication
- at: transport.md:49
  node: contracts/knowledge-base/access
- at: transport.md:56
  node: contracts/knowledge-base/access
- at: transport.md:63
  node: constraints/every-operation-requires-owner-authentication
- at: transport.md:63
  node: contracts/knowledge-base/access
- at: transport.md:64
  node: constraints/local-operator-token-development-only
- at: transport.md:64
  node: contracts/knowledge-base/access
- at: transport.md:70
  node: constraints/local-operator-token-development-only
- at: transport.md:71
  node: constraints/local-operator-token-development-only
- at: transport.md:72
  node: contracts/knowledge-base/access
- at: transport.md:75
  node: domain/knowledge-base/health-report
- at: transport.md:75
  node: contracts/knowledge-base/access
- at: transport.md:76
  node: contracts/knowledge-base/access
- at: transport.md:77
  node: rules/knowledge-base/health-checked-at-probe-start
- at: transport.md:78
  node: rules/knowledge-base/health-probe-never-fails
- at: transport.md:78
  node: contracts/knowledge-base/access
- at: transport.md:79
  node: rules/knowledge-base/health-probe-never-fails
- at: transport.md:80
  node: contracts/knowledge-base/access
- at: transport.md:83
  node: contracts/knowledge-base/access
- at: transport.md:84
  node: contracts/knowledge-base/access
- at: transport.md:85
  node: contracts/knowledge-base/access
- at: transport.md:86
  node: contracts/knowledge-base/access
- at: transport.md:87
  node: contracts/knowledge-base/access
- at: transport.md:88
  node: contracts/knowledge-base/access
- at: transport.md:89
  node: contracts/knowledge-base/access
- at: transport.md:90
  node: contracts/knowledge-base/access
- at: transport.md:90
  node: constraints/unreachable-store-answers-unavailable
- at: transport.md:91
  node: contracts/knowledge-base/access
- at: transport.md:92
  node: contracts/knowledge-base/access
- at: transport.md:93
  node: contracts/knowledge-base/access
- at: transport.md:94
  node: contracts/knowledge-base/access
- at: transport.md:95
  node: contracts/knowledge-base/access
- at: transport.md:96
  node: contracts/knowledge-base/access
- at: transport.md:97
  node: contracts/knowledge-base/access
- at: transport.md:98
  node: contracts/knowledge-base/access
- at: transport.md:98
  node: constraints/internal-failure-withholds-cause
- at: transport.md:99
  node: contracts/knowledge-base/access
- at: transport.md:99
  node: constraints/internal-failure-withholds-cause
- at: transport.md:100
  outside: a fallback of the implementation for a code it never raises; every code raised is held by a contract answer
- at: transport.md:101
  node: constraints/mcp-failure-is-tool-error
- at: transport.md:101
  node: contracts/knowledge-base/access
- at: transport.md:104
  outside: each code's status is held by the answers of the contract whose operation raises it; the registry itself is the implementation's lookup
- at: transport.md:116
  node: contracts/knowledge-base/access
- at: transport.md:117
  node: contracts/knowledge-base/access
- at: transport.md:118
  node: domain/knowledge-base/database-status
- at: transport.md:119
  node: contracts/knowledge-base/access
- at: transport.md:120
  node: constraints/mcp-failure-is-tool-error
- at: transport.md:123
  node: constraints/unreachable-store-answers-unavailable
- at: transport.md:124
  node: constraints/unreachable-store-answers-unavailable
- at: transport.md:125
  outside: a store signal other modules read; each uniqueness it signals is held by its own rule
- at: transport.md:126
  outside: the auth provider's key-set location is a vendor boundary; the specification names no third-party vendor
- at: transport.md:127
  node: constraints/every-operation-requires-owner-authentication
- at: transport.md:128
  outside: configuration names, not facts of the domain; the development-only token is held by constraints/local-operator-token-development-only
- at: transport.md:129
  outside: the web framework's error shapes; implementation
---
