---
contract_version: siegard-ledger/1
material:
- auth.md
entries:
- at: auth.md:18
  node: domain/owner-access/sign-in-credentials
- at: auth.md:18
  node: contracts/owner-access/sign-in
- at: auth.md:19
  node: rules/owner-access/sign-in-requires-valid-email
- at: auth.md:19
  node: contracts/owner-access/sign-in
- at: auth.md:20
  node: rules/owner-access/sign-in-requires-password
- at: auth.md:20
  node: scenarios/owner-access/whitespace-only-password-is-sent
- at: auth.md:21
  outside: "UI interaction timing of the form library: it changes when a message appears, not what is refused or said"
- at: auth.md:22
  node: rules/owner-access/sign-in-requires-valid-email
- at: auth.md:22
  node: rules/owner-access/sign-in-requires-password
- at: auth.md:23
  node: rules/owner-access/sign-in-attempt-in-flight-accepts-no-second-submission
- at: auth.md:24
  node: contracts/owner-access/sign-in
- at: auth.md:25
  node: contracts/owner-access/sign-in
- at: auth.md:27
  node: scenarios/owner-access/expired-session-notice-stays-beside-a-failure
- at: auth.md:27
  node: contracts/owner-access/sign-in
- at: auth.md:28
  outside: "implementation knowledge: how the screen's components are composed, not a fact of the domain"
- at: auth.md:31
  node: contracts/owner-access/identity-provider
- at: auth.md:31
  node: domain/owner-access/sign-in-credentials
- at: auth.md:32
  node: contracts/owner-access/identity-provider
- at: auth.md:33
  node: contracts/owner-access/identity-provider
- at: auth.md:34
  node: contracts/owner-access/identity-provider
- at: auth.md:35
  node: rules/owner-access/token-is-requested-after-credentials-accepted
- at: auth.md:36
  node: contracts/owner-access/identity-provider
- at: auth.md:36
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- at: auth.md:37
  node: rules/owner-access/access-token-is-held-before-the-owner-moves-on
- at: auth.md:38
  node: rules/owner-access/sign-in-failure-stays-until-the-next-attempt
- at: auth.md:38
  node: rules/owner-access/sign-in-attempt-in-flight-accepts-no-second-submission
- at: auth.md:39
  node: contracts/owner-access/sign-in
- at: auth.md:40
  node: contracts/owner-access/sign-in
- at: auth.md:41
  node: rules/owner-access/sign-in-failure-shows-only-its-kind-message
- at: auth.md:42
  node: rules/owner-access/sign-in-failure-stays-until-the-next-attempt
- at: auth.md:43
  outside: "implementation knowledge: whether the code waits for the navigation to finish is not a fact the owner reads or does"
- at: auth.md:46
  node: rules/owner-access/sign-in-destination-defaults-to-chat
- at: auth.md:47
  node: rules/owner-access/sign-in-destination-defaults-to-chat
- at: auth.md:48
  node: rules/owner-access/sign-in-destination-is-a-local-path
- at: auth.md:48
  node: rules/owner-access/sign-in-destination-defaults-to-chat
- at: auth.md:54
  node: rules/owner-access/sign-in-destination-defaults-to-chat
- at: auth.md:57
  node: rules/owner-access/rejected-credentials-are-a-credential-failure
- at: auth.md:57
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- at: auth.md:57
  node: rules/owner-access/unreachable-provider-is-a-network-failure
- at: auth.md:57
  node: rules/owner-access/network-looking-failure-is-a-network-failure
- at: auth.md:57
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- at: auth.md:62
  node: rules/owner-access/network-looking-failure-is-a-network-failure
- at: auth.md:62
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- at: auth.md:63
  node: rules/owner-access/unreachable-provider-is-a-network-failure
- at: auth.md:63
  node: contracts/owner-access/identity-provider
- at: auth.md:64
  node: contracts/owner-access/identity-provider
- at: auth.md:64
  node: rules/owner-access/rejected-credentials-are-a-credential-failure
- at: auth.md:65
  node: contracts/owner-access/identity-provider
- at: auth.md:65
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- at: auth.md:71
  node: contracts/owner-access/identity-provider
- at: auth.md:74
  node: contracts/owner-access/sign-in
- at: auth.md:74
  node: rules/owner-access/sign-in-requires-valid-email
- at: auth.md:75
  node: contracts/owner-access/sign-in
- at: auth.md:75
  node: rules/owner-access/sign-in-requires-password
- at: auth.md:76
  node: contracts/owner-access/sign-in
- at: auth.md:76
  node: rules/owner-access/rejected-credentials-are-a-credential-failure
- at: auth.md:77
  node: contracts/owner-access/sign-in
- at: auth.md:77
  node: rules/owner-access/unreachable-provider-is-a-network-failure
- at: auth.md:77
  node: rules/owner-access/network-looking-failure-is-a-network-failure
- at: auth.md:78
  node: contracts/owner-access/sign-in
- at: auth.md:78
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- at: auth.md:79
  node: contracts/owner-access/sign-in
- at: auth.md:79
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- at: auth.md:80
  node: contracts/owner-access/identity-provider
- at: auth.md:80
  node: rules/owner-access/rejected-credentials-are-a-credential-failure
- at: auth.md:81
  node: contracts/owner-access/identity-provider
- at: auth.md:81
  node: rules/owner-access/rejected-credentials-are-a-credential-failure
- at: auth.md:82
  node: contracts/owner-access/identity-provider
- at: auth.md:82
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- at: auth.md:83
  node: contracts/owner-access/identity-provider
- at: auth.md:83
  node: rules/owner-access/unreachable-provider-is-a-network-failure
- at: auth.md:84
  node: contracts/owner-access/identity-provider
- at: auth.md:84
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- at: auth.md:85
  node: contracts/owner-access/identity-provider
- at: auth.md:85
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- at: auth.md:86
  node: contracts/owner-access/identity-provider
- at: auth.md:86
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- at: auth.md:87
  node: contracts/owner-access/identity-provider
- at: auth.md:87
  node: rules/owner-access/missing-session-or-token-is-a-session-failure
- at: auth.md:88
  node: rules/owner-access/network-looking-failure-is-a-network-failure
- at: auth.md:88
  node: rules/owner-access/any-other-sign-in-failure-is-unknown
- at: auth.md:91
  node: domain/owner-access/sign-in-failure-kind
- at: auth.md:92
  outside: "implementation knowledge: the codes the application's own client mints are an artifact of this system's code, and their effect is held by the classification rules"
- at: auth.md:94
  node: domain/owner-access/sign-in-credentials
- at: auth.md:97
  outside: "the application's own configuration of the provider address belongs to the increment that adopts the shared configuration, not to the owner's sign-in"
- at: auth.md:98
  node: contracts/owner-access/identity-provider
- at: auth.md:99
  node: contracts/owner-access/identity-provider
- at: auth.md:100
  node: contracts/owner-access/identity-provider
- at: auth.md:101
  node: contracts/owner-access/identity-provider
- at: auth.md:102
  outside: "the store that holds the token lives outside this area and belongs to the increment that adopts the shared state; the ordering before navigation is held by the access-token rule"
- at: auth.md:38
  node: domain/owner-access/sign-in-attempt
- at: auth.md:23
  node: domain/owner-access/sign-in-attempt
- at: auth.md:46
  node: domain/owner-access/sign-in-destination
- at: auth.md:48
  node: domain/owner-access/sign-in-destination
- at: auth.md:48
  node: scenarios/owner-access/external-destination-falls-back-to-chat
- at: auth.md:88
  node: scenarios/owner-access/offline-fetch-error-is-a-network-failure
- at: auth.md:91
  node: domain/owner-access/sign-in-attempt
---
