---
contract_version: siegard-ledger/1
material:
- logic.md
- boundary.md
- ui.md
entries:
- at: boundary.md:27
  node: constraints/every-operation-requires-owner-authentication
- at: boundary.md:29
  node: rules/graph-explorer/graph-view-requests-carry-the-same-token-header-as-chat
- at: boundary.md:32
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:33
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- at: boundary.md:34
  node: rules/graph-explorer/a-read-stays-fresh-five-minutes
- at: boundary.md:35
  node: rules/graph-explorer/a-read-stays-fresh-five-minutes
- at: boundary.md:36
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:37
  node: rules/graph-explorer/node-detail-has-no-merged-into-by-default
- at: boundary.md:38
  node: rules/graph-explorer/node-detail-has-no-merged-into-by-default
- at: boundary.md:39
  node: rules/graph-explorer/node-badge-follows-the-node-status
- at: boundary.md:42
  node: rules/graph-explorer/an-attribute-hides-its-bookkeeping-fields
- at: boundary.md:43
  node: rules/graph-explorer/attribute-badge-follows-a-fixed-precedence
- at: boundary.md:44
  node: rules/graph-explorer/attributes-in-effect-come-first-by-key
- at: boundary.md:45
  node: rules/graph-explorer/an-attribute-without-provenance-has-an-empty-list
- at: boundary.md:46
  node: rules/graph-explorer/an-attribute-hides-its-bookkeeping-fields
- at: boundary.md:49
  node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
- at: boundary.md:50
  node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
- at: boundary.md:51
  node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
- at: boundary.md:54
  node: rules/graph-explorer/an-inline-entry-hides-what-it-lacks
- at: boundary.md:55
  node: rules/graph-explorer/confidence-is-a-rounded-percentage
- at: boundary.md:56
  node: rules/graph-explorer/an-inline-entry-hides-what-it-lacks
- at: boundary.md:57
  node: rules/graph-explorer/an-inline-entry-hides-what-it-lacks
- at: boundary.md:58
  node: rules/graph-explorer/an-inline-entry-shows-its-date-only
- at: boundary.md:61
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:62
  node: rules/graph-explorer/relationships-are-read-at-depth-one-both-ways
- at: boundary.md:63
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- at: boundary.md:64
  node: rules/graph-explorer/a-read-stays-fresh-five-minutes
- at: boundary.md:65
  node: rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node
- at: boundary.md:67
  node: rules/graph-explorer/direction-picks-the-link-wording
- at: boundary.md:68
  node: rules/graph-explorer/the-neighbour-is-the-other-end
- at: boundary.md:69
  node: rules/graph-explorer/a-relationship-shows-fixed-fields
- at: boundary.md:70
  node: rules/graph-explorer/an-unformatted-confidence-shows-zero-percent
- at: boundary.md:71
  node: rules/graph-explorer/missing-flags-and-provenance-are-empty-lists
- at: boundary.md:72
  node: rules/graph-explorer/lists-keep-the-answered-order
- at: boundary.md:73
  node: rules/graph-explorer/a-relationship-shows-fixed-fields
- at: boundary.md:76
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:77
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- at: boundary.md:78
  node: rules/graph-explorer/a-read-stays-fresh-five-minutes
- at: boundary.md:79
  node: rules/graph-explorer/a-provenance-answer-is-a-list-of-fragments
- at: boundary.md:80
  node: rules/graph-explorer/an-unformatted-confidence-shows-zero-percent
- at: boundary.md:81
  node: rules/graph-explorer/a-fragment-status-is-free-text
- at: boundary.md:82
  node: rules/graph-explorer/a-chunk-offset-window-is-shown-as-chars
- at: boundary.md:83
  node: rules/graph-explorer/a-chunk-without-locator-has-an-empty-one
- at: boundary.md:84
  node: rules/graph-explorer/a-source-shows-its-id-type-dates-and-title
- at: boundary.md:85
  node: rules/graph-explorer/a-source-date-time-is-short-pt-br
- at: boundary.md:86
  node: rules/graph-explorer/title-and-document-date-come-from-metadata
- at: boundary.md:87
  node: rules/graph-explorer/title-and-document-date-come-from-metadata
- at: boundary.md:88
  node: rules/graph-explorer/original-input-is-carried-only-when-answered
- at: boundary.md:89
  node: rules/graph-explorer/lists-keep-the-answered-order
- at: boundary.md:92
  node: rules/graph-explorer/a-delta-carries-its-source-tool-unchanged
- at: boundary.md:93
  node: rules/graph-explorer/a-delta-without-state-for-a-node-leaves-it-off
- at: boundary.md:94
  node: rules/graph-explorer/a-delta-without-state-for-a-node-leaves-it-off
- at: boundary.md:95
  node: rules/graph-explorer/a-link-is-kept-only-with-visible-ends
- at: boundary.md:96
  node: rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
- at: boundary.md:97
  node: rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
- at: boundary.md:98
  node: rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
- at: boundary.md:99
  node: rules/graph-explorer/a-kept-link-carries-its-slug-label-and-state
- at: boundary.md:100
  node: rules/graph-explorer/lists-keep-the-answered-order
- at: boundary.md:103
  node: contracts/graph-explorer/bff-graph-view
- at: boundary.md:103
  node: rules/graph-explorer/restore-reads-the-saved-view-of-the-conversation
- at: boundary.md:104
  node: rules/graph-explorer/restore-reads-the-saved-view-of-the-conversation
- at: boundary.md:105
  node: rules/graph-explorer/restore-restores-the-layout-of-a-version-2-view
- at: boundary.md:106
  node: rules/graph-explorer/a-late-restore-answer-is-discarded
- at: boundary.md:107
  node: rules/graph-explorer/a-saved-view-holds-positions-and-pins
- at: boundary.md:108
  node: rules/graph-explorer/a-save-follows-a-graph-change
- at: boundary.md:109
  node: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
- at: boundary.md:111
  node: rules/graph-explorer/a-save-waits-800-milliseconds
- at: boundary.md:112
  node: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
- at: boundary.md:113
  node: rules/graph-explorer/a-save-is-a-put-of-json
- at: boundary.md:114
  node: rules/graph-explorer/a-pending-save-is-dropped-on-leaving
- at: boundary.md:115
  node: rules/graph-explorer/a-change-saves-only-with-a-conversation-and-nodes
- at: boundary.md:118
  node: rules/graph-explorer/node-detail-reads-share-a-key-by-node
- at: boundary.md:119
  node: rules/graph-explorer/node-detail-reads-share-a-key-by-node
- at: boundary.md:119
  node: rules/graph-explorer/the-first-node-id-key-is-a-placeholder
- at: boundary.md:120
  node: rules/graph-explorer/node-detail-reads-share-a-key-by-node
- at: boundary.md:121
  node: rules/graph-explorer/full-provenance-is-cached-by-kind-and-id
- at: boundary.md:122
  node: rules/graph-explorer/node-detail-reads-share-a-key-by-node
- at: boundary.md:123
  outside: "the graph view cache keys are declared and no code reads them, so there is nothing a node could hold"
- at: boundary.md:126
  node: rules/graph-explorer/read-failures-pass-through-unchanged
- at: boundary.md:127
  node: rules/graph-explorer/node-badge-follows-the-node-status
- at: boundary.md:128
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- at: boundary.md:129
  node: rules/graph-explorer/read-failures-pass-through-unchanged
- at: boundary.md:130
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- at: boundary.md:131
  node: rules/graph-explorer/read-failures-pass-through-unchanged
- at: boundary.md:132
  node: rules/graph-explorer/a-read-needs-a-non-empty-identity
- at: boundary.md:133
  node: rules/graph-explorer/view-failures-are-silent
- at: boundary.md:134
  node: rules/graph-explorer/view-failures-are-silent
- at: boundary.md:135
  node: rules/graph-explorer/a-validity-date-is-shown-day-month-year
- at: boundary.md:138
  node: domain/knowledge-base/node-status
- at: boundary.md:139
  node: domain/knowledge-base/assertion-status
- at: boundary.md:140
  node: domain/knowledge-base/effective-status
- at: boundary.md:141
  node: domain/knowledge-base/alias-kind
- at: boundary.md:142
  node: domain/knowledge-base/value-type
- at: boundary.md:143
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:144
  node: rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node
- at: boundary.md:145
  node: domain/graph-explorer/confidence-state
- at: boundary.md:146
  node: domain/graph-explorer/graph-snapshot-version
- at: boundary.md:147
  node: domain/chat/graph-layout
- at: boundary.md:150
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:151
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:152
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:153
  node: contracts/graph-explorer/bff-node-reads
- at: boundary.md:154
  node: rules/graph-explorer/title-and-document-date-come-from-metadata
- at: boundary.md:155
  node: domain/chat/graph-delta
- at: boundary.md:156
  node: contracts/graph-explorer/bff-graph-view
- at: boundary.md:157
  node: constraints/every-operation-requires-owner-authentication
- at: boundary.md:158
  node: domain/graph-explorer/graph-pane
- at: logic.md:22
  node: domain/chat/graph-delta
- at: logic.md:23
  node: domain/chat/graph-delta-node
- at: logic.md:24
  node: domain/chat/graph-delta-link
- at: logic.md:25
  node: domain/graph-explorer/graph-pane
- at: logic.md:26
  node: domain/graph-explorer/graph-node-view
- at: logic.md:27
  node: domain/graph-explorer/graph-link-view
- at: logic.md:30
  node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
- at: logic.md:31
  node: rules/graph-explorer/node-state-follows-its-status-alone
- at: logic.md:32
  node: rules/graph-explorer/merged-or-deleted-node-has-no-state-and-is-left-off
- at: logic.md:33
  node: rules/graph-explorer/node-state-follows-its-status-alone
- at: logic.md:34
  node: rules/graph-explorer/link-state-follows-a-fixed-precedence
- at: logic.md:36
  node: rules/graph-explorer/link-state-follows-a-fixed-precedence
- at: logic.md:37
  node: rules/graph-explorer/link-text-is-the-catalog-label-or-the-spaced-slug
- at: logic.md:38
  node: rules/graph-explorer/link-text-is-the-catalog-label-or-the-spaced-slug
- at: logic.md:39
  node: rules/graph-explorer/link-type-slug-is-kept-apart-from-its-text
- at: logic.md:42
  node: domain/graph-explorer/graph-pane-status
- at: logic.md:43
  node: rules/graph-explorer/pane-starts-and-clears-empty
- at: logic.md:44
  node: rules/graph-explorer/setting-a-status-keeps-the-error-message-only-for-error
- at: logic.md:45
  node: rules/graph-explorer/turn-done-after-a-delta-makes-the-pane-ready
- at: logic.md:46
  node: rules/graph-explorer/turn-done-without-a-delta-leaves-the-status
- at: logic.md:47
  node: rules/graph-explorer/turn-error-ends-a-busy-pane-in-error
- at: logic.md:48
  node: rules/graph-explorer/turn-error-ends-a-busy-pane-in-error
- at: logic.md:49
  node: rules/graph-explorer/ending-a-turn-resets-the-delta-mark
- at: logic.md:50
  node: rules/graph-explorer/empty-reveal-queue-ends-revealing
- at: logic.md:53
  node: rules/graph-explorer/add-merges-by-identity
- at: logic.md:54
  node: rules/graph-explorer/add-queues-only-unseen-nodes
- at: logic.md:55
  node: rules/graph-explorer/add-marks-a-delta-received
- at: logic.md:56
  node: rules/graph-explorer/add-keeps-links-whose-nodes-are-missing
- at: logic.md:57
  node: rules/graph-explorer/replace-keeps-only-the-delta
- at: logic.md:62
  node: rules/graph-explorer/removing-nodes-removes-everything-about-them
- at: logic.md:63
  node: rules/chat-workspace/changing-conversation-clears-the-graph-and-the-detail
- at: logic.md:66
  node: rules/graph-explorer/reveal-goes-one-node-at-a-time-in-queue-order
- at: logic.md:67
  node: rules/graph-explorer/a-gap-of-zero-or-less-is-zero
- at: logic.md:68
  node: rules/graph-explorer/a-gap-change-applies-from-the-next-reveal
- at: logic.md:69
  node: rules/graph-explorer/reduced-motion-reveals-everything-at-once
- at: logic.md:70
  node: rules/graph-explorer/revealing-a-revealed-node-changes-nothing
- at: logic.md:71
  node: rules/graph-explorer/stopping-the-reveal-keeps-what-it-reached
- at: logic.md:72
  node: rules/graph-explorer/reveal-marks-nodes-only
- at: logic.md:75
  node: rules/graph-explorer/layout-defaults-to-force
- at: logic.md:76
  node: rules/graph-explorer/layout-reruns-on-graph-or-counter-change
- at: logic.md:77
  node: rules/graph-explorer/a-graph-change-keeps-every-positioned-node-where-it-is
- at: logic.md:78
  node: rules/graph-explorer/a-counter-change-places-every-node-again
- at: logic.md:79
  node: rules/graph-explorer/an-empty-graph-has-no-positions
- at: logic.md:80
  node: rules/graph-explorer/links-with-a-missing-endpoint-are-left-out-of-layouts
- at: logic.md:81
  node: rules/graph-explorer/moving-a-node-pins-it
- at: logic.md:82
  node: rules/graph-explorer/reorganizing-releases-the-pins
- at: logic.md:83
  node: rules/graph-explorer/choosing-a-layout-releases-the-pins
- at: logic.md:86
  node: rules/graph-explorer/force-layout-runs-a-hundred-silent-ticks
- at: logic.md:87
  node: rules/graph-explorer/force-layout-keeps-nodes-270-apart
- at: logic.md:88
  node: rules/graph-explorer/force-layout-keeps-nodes-270-apart
- at: logic.md:89
  node: rules/graph-explorer/a-linkless-node-is-still-placed
- at: logic.md:92
  node: rules/graph-explorer/tree-and-radial-layouts-share-one-spanning-tree
- at: logic.md:97
  node: rules/graph-explorer/several-components-hang-under-a-virtual-root
- at: logic.md:98
  node: rules/graph-explorer/tree-layout-grows-left-to-right
- at: logic.md:100
  node: rules/graph-explorer/radial-layout-puts-the-root-at-the-centre
- at: logic.md:102
  node: rules/graph-explorer/radial-rings-take-the-largest-radius
- at: logic.md:105
  node: rules/graph-explorer/a-link-needs-both-measured-nodes-to-be-drawn
- at: logic.md:106
  node: rules/graph-explorer/a-link-meets-each-node-at-its-border
- at: logic.md:107
  node: rules/graph-explorer/a-link-meets-each-node-at-its-border
- at: logic.md:110
  node: rules/graph-explorer/a-snapshot-carries-its-version-and-fields
- at: logic.md:111
  node: rules/graph-explorer/a-snapshot-carries-its-version-and-fields
- at: logic.md:112
  node: rules/chat-workspace/graph-view-is-restored-and-saved-per-conversation
- at: logic.md:112
  node: rules/graph-explorer/restoring-shows-every-node-at-once
- at: logic.md:117
  node: rules/graph-explorer/only-a-version-2-view-restores-its-layout
- at: logic.md:118
  node: rules/graph-explorer/restoring-keeps-orphan-positions
- at: logic.md:121
  node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
- at: logic.md:122
  node: rules/graph-explorer/merged-or-deleted-node-has-no-state-and-is-left-off
- at: logic.md:123
  node: rules/graph-explorer/moving-a-node-pins-it
- at: logic.md:124
  node: rules/graph-explorer/choosing-a-layout-releases-the-pins
- at: logic.md:125
  node: rules/graph-explorer/removing-nodes-removes-everything-about-them
- at: logic.md:126
  node: rules/graph-explorer/only-a-version-2-view-restores-its-layout
- at: logic.md:127
  node: rules/graph-explorer/a-link-needs-both-measured-nodes-to-be-drawn
- at: logic.md:128
  node: rules/graph-explorer/turn-error-ends-a-busy-pane-in-error
- at: logic.md:131
  node: domain/graph-explorer/graph-pane-status
- at: logic.md:132
  node: domain/chat/graph-layout
- at: logic.md:133
  node: domain/knowledge-base/node-status
- at: logic.md:134
  node: domain/knowledge-base/assertion-flag
- at: logic.md:135
  node: domain/graph-explorer/confidence-state
- at: logic.md:136
  node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
- at: logic.md:137
  node: domain/graph-explorer/turn-end
- at: logic.md:138
  node: domain/graph-explorer/graph-snapshot-version
- at: logic.md:138
  node: rules/graph-explorer/a-snapshot-carries-its-version-and-fields
- at: logic.md:141
  node: domain/chat/graph-delta
- at: logic.md:142
  node: domain/knowledge-base/node-status
- at: logic.md:143
  node: rules/graph-explorer/node-type-is-trimmed-lowercased-and-falls-back-to-concept
- at: logic.md:144
  node: rules/chat/graph-delta-link-label
- at: logic.md:145
  node: domain/chat/graph-view
- at: ui.md:43
  node: rules/graph-explorer/pane-is-a-region-named-after-the-graph
- at: ui.md:44
  node: rules/graph-explorer/pane-is-a-region-named-after-the-graph
- at: ui.md:45
  node: rules/graph-explorer/empty-status-without-nodes-shows-only-the-empty-state
- at: ui.md:46
  node: rules/graph-explorer/empty-state-tells-where-memory-will-appear
- at: ui.md:47
  node: rules/graph-explorer/loading-and-error-overlay-the-canvas
- at: ui.md:48
  node: rules/graph-explorer/pane-is-busy-only-while-loading-or-revealing
- at: ui.md:49
  node: rules/graph-explorer/the-canvas-stays-mounted-outside-the-empty-state
- at: ui.md:50
  node: rules/graph-explorer/the-pane-reveals-at-the-hooks-default-gap
- at: ui.md:51
  node: rules/graph-explorer/the-pane-wires-the-owner-s-arrangement-to-the-store
- at: ui.md:52
  node: rules/graph-explorer/a-node-click-only-reports-the-node-id
- at: ui.md:55
  node: rules/graph-explorer/loading-overlay-says-it-is-searching
- at: ui.md:56
  node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
- at: ui.md:57
  node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
- at: ui.md:58
  node: rules/graph-explorer/the-overlay-is-a-polite-status-region
- at: ui.md:59
  node: rules/graph-explorer/the-overlay-message-is-two-lines-at-most
- at: ui.md:60
  node: rules/graph-explorer/the-overlay-lets-the-pointer-through
- at: ui.md:63
  node: rules/graph-explorer/only-revealed-nodes-are-shown
- at: ui.md:64
  node: rules/graph-explorer/a-node-without-position-sits-at-the-origin
- at: ui.md:65
  node: rules/graph-explorer/the-canvas-opens-at-three-quarters-zoom
- at: ui.md:66
  node: rules/graph-explorer/nodes-drag-only-when-a-commit-is-wired
- at: ui.md:67
  node: rules/graph-explorer/the-owner-cannot-draw-links
- at: ui.md:68
  node: rules/graph-explorer/focusing-a-node-centres-it-at-zoom-one
- at: ui.md:69
  node: rules/graph-explorer/fit-and-recenter-take-300-milliseconds
- at: ui.md:70
  node: rules/graph-explorer/fit-and-recenter-take-300-milliseconds
- at: ui.md:71
  node: rules/graph-explorer/layout-controls-need-nodes-and-a-handler
- at: ui.md:72
  node: rules/graph-explorer/the-layout-picker-needs-the-algorithm-and-its-setter
- at: ui.md:73
  node: rules/graph-explorer/the-reorganize-control-needs-its-handler
- at: ui.md:76
  node: rules/graph-explorer/a-node-is-drawn-with-its-type-label-state-and-selection
- at: ui.md:77
  node: rules/graph-explorer/a-node-s-link-endpoints-are-inert
- at: ui.md:80
  node: rules/graph-explorer/a-link-shows-the-catalog-label
- at: ui.md:81
  node: rules/graph-explorer/a-link-is-coloured-by-its-type
- at: ui.md:82
  node: rules/graph-explorer/a-weak-state-overrides-the-type-colour
- at: ui.md:83
  node: rules/graph-explorer/a-link-is-dashed-unless-temporal-and-sure
- at: ui.md:84
  node: rules/graph-explorer/a-link-is-dimmed-when-out-of-effect
- at: ui.md:85
  node: rules/graph-explorer/a-link-is-hidden-from-assistive-technology
- at: ui.md:86
  node: rules/graph-explorer/a-link-needs-data-and-measured-nodes
- at: ui.md:89
  node: rules/graph-explorer/the-panel-reads-the-node-by-id
- at: ui.md:90
  node: rules/graph-explorer/the-panel-is-a-region-named-after-the-node
- at: ui.md:91
  node: rules/graph-explorer/the-panel-checks-pending-then-failure-then-data
- at: ui.md:92
  node: rules/graph-explorer/the-loading-view-says-it-is-loading
- at: ui.md:93
  node: rules/graph-explorer/the-close-button-takes-focus
- at: ui.md:94
  node: rules/graph-explorer/escape-closes-the-panel
- at: ui.md:95
  node: rules/graph-explorer/a-failed-node-read-is-an-alert
- at: ui.md:96
  node: rules/graph-explorer/a-node-failure-is-classified-by-its-code
- at: ui.md:97
  node: rules/graph-explorer/a-successful-detail-shows-the-node
- at: ui.md:98
  node: rules/graph-explorer/aliases-are-listed-as-received
- at: ui.md:99
  node: rules/graph-explorer/attributes-are-listed-as-received
- at: ui.md:100
  node: rules/graph-explorer/an-attribute-row-shows-key-value-state-and-validity
- at: ui.md:101
  node: rules/graph-explorer/an-attribute-without-provenance-has-an-empty-list
- at: ui.md:102
  node: rules/graph-explorer/inline-provenance-needs-an-entry
- at: ui.md:103
  node: rules/graph-explorer/inline-entries-show-text-and-what-they-have
- at: ui.md:104
  node: rules/graph-explorer/every-item-offers-its-full-origin
- at: ui.md:107
  node: rules/graph-explorer/curation-target-follows-the-node
- at: ui.md:108
  node: rules/graph-explorer/curar-needs-a-target
- at: ui.md:109
  node: rules/graph-explorer/curar-opens-the-drawer-for-the-target
- at: ui.md:110
  node: rules/graph-explorer/closing-the-drawer-returns-focus-to-curar
- at: ui.md:113
  node: rules/graph-explorer/relationships-are-a-named-busy-section
- at: ui.md:114
  node: rules/graph-explorer/relationships-are-a-named-busy-section
- at: ui.md:115
  node: rules/graph-explorer/relationships-say-loading-or-none
- at: ui.md:116
  node: rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry
- at: ui.md:117
  node: rules/graph-explorer/relationship-rows-keep-the-answered-order
- at: ui.md:118
  node: rules/graph-explorer/a-relationship-row-shows-arrow-type-neighbour-confidence-and-status
- at: ui.md:119
  node: rules/graph-explorer/screen-readers-hear-the-direction
- at: ui.md:120
  node: rules/graph-explorer/a-relationship-badge-follows-its-effective-status
- at: ui.md:121
  node: rules/graph-explorer/a-relationship-row-shows-its-validity
- at: ui.md:122
  node: rules/graph-explorer/inline-provenance-needs-an-entry
- at: ui.md:123
  node: rules/graph-explorer/every-item-offers-its-full-origin
- at: ui.md:126
  node: rules/graph-explorer/the-origin-body-checks-pending-failure-then-data
- at: ui.md:127
  node: rules/graph-explorer/the-origin-body-checks-pending-failure-then-data
- at: ui.md:128
  node: rules/graph-explorer/an-origin-failure-is-classified-by-its-code
- at: ui.md:129
  node: rules/graph-explorer/an-origin-failure-is-an-alert-with-a-retry-unless-deleted
- at: ui.md:130
  node: rules/graph-explorer/an-origin-without-fragments-says-not-found
- at: ui.md:131
  node: rules/graph-explorer/a-fragment-shows-confidence-status-text-and-chunks
- at: ui.md:132
  node: rules/graph-explorer/a-chunk-shows-its-index-offsets-and-excerpt
- at: ui.md:133
  node: rules/graph-explorer/a-chunk-shows-its-source
- at: ui.md:134
  node: rules/graph-explorer/an-original-input-is-shown-verbatim
- at: ui.md:135
  node: rules/graph-explorer/a-redacted-original-input-is-never-shown
- at: ui.md:136
  node: rules/graph-explorer/an-absent-original-input-shows-nothing
- at: ui.md:139
  node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
- at: ui.md:140
  node: rules/graph-explorer/error-overlay-shows-the-message-or-the-default
- at: ui.md:141
  node: contracts/graph-explorer/graph-screen
- at: ui.md:141
  node: rules/graph-explorer/a-node-failure-reads-its-wording
- at: ui.md:142
  node: contracts/graph-explorer/graph-screen
- at: ui.md:142
  node: rules/graph-explorer/a-node-failure-reads-its-wording
- at: ui.md:143
  node: contracts/graph-explorer/graph-screen
- at: ui.md:143
  node: rules/graph-explorer/a-node-failure-reads-its-wording
- at: ui.md:144
  node: rules/graph-explorer/a-failed-relationships-read-always-offers-a-retry
- at: ui.md:145
  node: rules/graph-explorer/an-origin-failure-reads-its-wording
- at: ui.md:146
  node: rules/graph-explorer/an-origin-failure-reads-its-wording
- at: ui.md:147
  node: rules/graph-explorer/an-origin-failure-reads-its-wording
- at: ui.md:148
  node: rules/graph-explorer/an-origin-failure-reads-its-wording
- at: ui.md:151
  node: domain/graph-explorer/graph-pane-status
- at: ui.md:152
  node: domain/graph-explorer/graph-pane-status
- at: ui.md:153
  node: rules/graph-explorer/the-layout-picker-needs-the-algorithm-and-its-setter
- at: ui.md:154
  node: rules/graph-explorer/a-link-is-coloured-by-its-type
- at: ui.md:155
  node: domain/graph-explorer/confidence-state
- at: ui.md:156
  node: domain/graph-explorer/node-detail-failure
- at: ui.md:157
  node: domain/graph-explorer/origin-failure
- at: ui.md:158
  node: rules/graph-explorer/curation-target-follows-the-node
- at: ui.md:159
  node: rules/graph-explorer/every-item-offers-its-full-origin
- at: ui.md:160
  node: rules/graph-explorer/screen-readers-hear-the-direction
- at: ui.md:163
  node: rules/graph-explorer/a-node-failure-is-classified-by-its-code
- at: ui.md:164
  node: rules/graph-explorer/an-origin-failure-is-classified-by-its-code
- at: ui.md:165
  node: rules/graph-explorer/a-redacted-original-input-is-never-shown
- at: ui.md:166
  node: contracts/graph-explorer/graph-screen
- at: ui.md:167
  node: contracts/graph-explorer/graph-screen
- at: ui.md:168
  node: contracts/graph-explorer/graph-screen
- at: ui.md:169
  node: contracts/graph-explorer/graph-screen
- at: ui.md:170
  node: rules/graph-explorer/curar-opens-the-drawer-for-the-target
- at: ui.md:171
  node: rules/graph-explorer/the-pane-wires-the-owner-s-arrangement-to-the-store
- at: ui.md:172
  node: rules/graph-explorer/a-relationship-badge-follows-its-effective-status
---
