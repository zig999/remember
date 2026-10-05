# Achados do reconcile restates-fe, para /analyse

Fonte: `siegard-reconcile/restates-fe-*.returns/`. 21 contradicts + 29 unstated = 50 achados. Nada aqui foi decidido.


## contradicts

### `contracts/curation-workspace/bff-curation-reads`

- **src/features/curation/api/_transforms.ts** — toNodeSummary, toNodeAlias, toAttributeDetail, toNodeDetail, toLinkDetail, toLinkHistoryResponse, toAttributeHistoryResponse, toProvenanceRawInformation, toProvenanceChunk, toProvenanceFragment, toProvenanceResponse, toAcceptedFragmentSourceRef, toAcceptedFragmentItem, toAcceptedFragmentList, and OkEnvelope/unwrapOk (lines 46-53 and 153-312)
  - custo: About half of this file reads the node, history, provenance and accepted-fragment answers, and none of the nodes bound to it holds those fields. They are held by contracts/curation-workspace/bff-curation-reads, which the candidate index does not bind to this file. When that node changes, `--check` does not reach this file. The next reader of this file looks for these shapes in bff-curation and finds nothing.
  - correção indicada: Bind contracts/curation-workspace/bff-curation-reads to this file. The code already implements it, and its shapes match what the code reads. This finding does not come from a disagreement in the values.

- **src/features/curation/types.ts** — the evidence and history read shapes, lines 254-495: Provenance*Wire, AcceptedFragment*Wire, NodeSummaryWire, NodeAliasWire, AttributeDetailWire, NodeDetailWire, LinkDetailWire and the history responses
  - custo: What each read of the knowledge base answers is held by a consumed contract that the trace does not bind to this file. These fields are declared here as their own authority, so when the contract moves, `--check` does not reach this file.
  - correção indicada: Bind this file to the contract. The fields I compared match it: read-node, the link and attribute history, the three provenance reads and list-accepted-fragments.

### `contracts/ingest-workspace/bff-ingestion`

- **src/features/ingest/api/_transforms.ts** — IngestRawInformationRequestWire, line 24
  - custo: The node lists the body of ingest-raw-information as "the JSON body of source_type, content, model, prompt_version and an optional metadata". This shape adds an optional storage_ref the intake request does not name. A reader looking for what the screen may send would trust the node and miss the field. The sibling ingest-document operation records no storage reference, and only the raw-information domain node holds storage_ref, as an attribute of the stored record.
  - correção indicada: Either the node gains storage_ref in the intake request body through the analysis route, or the field leaves this declaration.

### `domain/chat-workspace/chat-status`

- **src/features/chat/state/chat-turn.ts** — the `ChatStatus` type, lines 4-9
  - custo: The chat-status enumeration is declared here as its own authority, in a file that node is not bound to. The node spells the fourth value `tool-running` and this file spells it `tool_running`. When the node's values move, `--check` does not reach this file. Nobody can then tell which spelling was decided. The same literal `tool_running` is also compared in `ChatStatusIndicator.tsx`, so the divergence spreads from this declaration.
  - correção indicada: The enumeration is the node's fact, and its shape is declared in this file. Code does not read the specification, so the correction is to bind `domain/chat-workspace/chat-status` to this file. The value `tool_running` against the node's `tool-running` then needs a decision on which spelling is the business's.

### `domain/chat/graph-delta-node`

- **src/features/graph/types.ts** — line 31, the type GraphNodeWireStatus, used by GraphNodeWire.status at line 39
  - custo: The enumeration spells the second value with a hyphen and the file declares it with an underscore. A reader who takes the enumeration as the vocabulary will not find the value the code compares against. The specification does not record which spelling the stream carries. The prose of rules/graph-explorer/node-state-follows-its-status-alone.md also uses the underscore ("status needs_review"). The two spellings coexist in the specification and nothing says which one is the wire spelling.
  - correção indicada: Either the node-status enumeration records the spelling the stream carries, or this declaration takes the node's spelling. That decision belongs to the specification. The code cannot read the node to settle it.

### `domain/knowledge-base/assertion-flag`

- **src/features/graph/types.ts** — line 33, the type GraphLinkWireFlag, used by GraphLinkWire.flags at line 51
  - custo: The enumeration's third value is hyphenated and the declaration is underscored. The log of domain/graph-explorer/confidence-state records that the back end's flag uses an underscore and the screen a hyphen. The assertion-flag node, which graph-delta-link names as the type of flags, holds the hyphenated form. Whoever changes the enumeration will not know this declaration carries a differently spelled copy of it.
  - correção indicada: Either the assertion-flag node records the spelling the stream carries, or this declaration takes the node's spelling. That decision belongs to the specification.

### `domain/knowledge-base/assertion-kind`

- **src/features/curation/types.ts** — the ItemKind type, line 2
  - custo: The two assertion kinds a curation request names are held by a node. They are declared here again in a file the node is not bound to, so a change to the node does not reach this file.
  - correção indicada: Bind this file to the node. The values agree.

### `domain/knowledge-base/assertion-status`

- **src/features/graph/api/node-detail.types.ts** — lines 5-10, the AttributeWireAssertionStatus union
  - custo: The file lists `proposed` and `accepted`, which the node does not hold, and omits `active` and `deleted`, which it does. The node is the business decision, and a reader of this type learns a different set of attribute states. The node is also not bound to this file, so it will not report when it changes.
  - correção indicada: The union has to carry the values of domain/knowledge-base/assertion-status. The node has to be bound to this file for as long as the file declares the enumeration.

### `domain/knowledge-base/corrected-values`

- **src/features/curation/types.ts** — the CorrectedValues interface, lines 231-238
  - custo: The shape of the values a correction puts in place of an assertion's is declared here, and the node that holds it is not bound to this file. If the node gains or loses a value, nothing reaches this file.
  - correção indicada: Bind this file to the node. The attributes agree with the node's value, valid_from, valid_to and valid_from_source, its target reference and its fragment reference.

### `domain/knowledge-base/effective-status`

- **src/features/curation/types.ts** — the EffectiveStatus type, lines 13-18
  - custo: The node holds six values, among them `inactive`, which is how an ended assertion reads without ever being stored. This file declares five. Typing `effective_status` in AttributeDetailWire and LinkDetailWire as this union says an ended assertion can never arrive as `inactive`. The next reader will take that vocabulary as the decided one, and no bind reaches the file when the node moves.
  - correção indicada: The vocabulary has to match the node's six values. The file also has to be bound to the node, because code never reads the specification and only a bind keeps the two together.

- **src/features/graph/api/node-detail.types.ts** — lines 12-16, the AttributeWireEffectiveStatus union
  - custo: The union drops `superseded` and `deleted`, which the node holds. NodeAttributeView.effectiveStatus takes its type from this union, so the view cannot represent the two values the node says an attribute can be read with. The node is not bound to this file, so a change to it never reaches this declaration.
  - correção indicada: The union has to carry the six values of domain/knowledge-base/effective-status. The node has to be bound to this file for as long as the file declares the enumeration.

### `domain/knowledge-base/merge-counts`

- **src/features/curation/types.ts** — the ResolveEntityMatchAffected interface, lines 154-159, and its reuse in MergeNodesResponse as Required<ResolveEntityMatchAffected>
  - custo: The four counts of a merge's reach are held by a node and declared here again, in a file the node is not bound to. The node's four counts are required, and this file makes them optional in the entity-match answer. A change to the node does not reach this file.
  - correção indicada: Bind this file to the node. In the entity-match answer the published contract has `affected` null for keep_separate and the four counts for merge_into, so the optionality here follows the answer and not the node.

### `domain/knowledge-base/node-status`

- **src/features/graph/api/node-detail.types.ts** — line 3, the NodeWireStatus union
  - custo: The file declares a second vocabulary for the node status that domain/knowledge-base/node-status does not reach. That node is not bound to this file, so a change to it never touches this union. The two spellings of the needs-review value (`needs-review` in the enumeration, `needs_review` here and in the graph-explorer rules) leave the next reader unsure which one the business decided.
  - correção indicada: The specification has to settle whether the wire value is `needs-review` or `needs_review`. It should also bind domain/knowledge-base/node-status to this file, or the union should be taken from the node that holds it. I found no node that says the wire spelling differs from the enumeration.

### `domain/knowledge-base/review-queue-kind`

- **src/features/curation/types.ts** — the ReviewQueueKind type, line 1
  - custo: The two review queues are an enumeration a node holds. Here it is declared a second time in a file the node is not bound to, so a change to the node does not reach this file and the two can drift without anyone knowing which was decided.
  - correção indicada: Bind this file to the node. The wire spelling `entity_match` comes from the published curation contract (`{ kind: "entity_match", ... }`), so the values agree.

### `domain/knowledge-base/source-type`

- **src/features/ingest/api/_transforms.ts** — SourceTypeWire, lines 1-8 (IngestSourceType, line 10, re-exports it)
  - custo: The closed set of source types is declared here as its own vocabulary. Its node, domain/knowledge-base/source-type, is not bound to this file, so a change to the node never reaches this declaration. The node lists pdf, email, meeting-minutes, chat, article, transcript and other, and gives ata, artigo, transcricao and outro as the material's own words for four of them. If the node moves, nobody can tell which spelling the business decided.
  - correção indicada: The vocabulary is held in this file's own declaration, and the code cannot read the specification. What closes it is a bind of domain/knowledge-base/source-type to this file, so that a change to the node reaches the declaration.

### `rules/curation-workspace/evidence-indicator-pulses-until-viewed`

- **src/features/curation/components/DecisionPanel/EvidenceChip.tsx** — the aria-label prop on the root span, lines 14-18
  - custo: The node says the indicator reads "Ver evidência" until the evidence is viewed, then "Evidência vista". The visible text does that. An aria-label replaces an element's accessible name, so a screen reader announces "Veja a evidência antes de decidir" for the unviewed state and "Evidência vista." with a trailing period for the viewed state. This is the hint wording that curation-screen carries on a blocked decision. Here it is a different string (no final period) used as the indicator's own name, and it is also the second place the hint is spelled. Anyone who changes the hint, or the indicator's wording, finds two spellings. What the owner hears and what the owner sees differ.
  - correção indicada: The accessible name of the indicator would have to be the node's wording ("Ver evidência" / "Evidência vista"), for example by dropping the aria-label so the visible text is the name. Where the hint "Veja a evidência antes de decidir." is meant to be announced, the contract that holds it is contracts/curation-workspace/curation-screen (operation read-decision-panel), and it belongs to the blocked decision, not to this indicator.

### `rules/curation-workspace/page-keeps-its-state-when-left`

- **src/features/curation/components/CurationPage.tsx** — The same mount effect, lines 50-54, read against the store's selectedItem.
  - custo: The store keeps selectedItem while the owner is away. When the page mounts again with no item in the address, the effect replaces the kept selection with the first entry of the queue. The kept selection is discarded on re-entry even though nothing cleared it on leaving. A reader who trusts that leaving keeps the selected item will not find where it is lost. Whether this counts as clearing it is the person's to decide; the evidence is that the stored selection is not consulted on re-entry.
  - correção indicada: Either the node states that the selection is rederived on entry from the address, or the page consults the stored selectedItem before deriving one. That choice is the person's.

### `rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node`

- **src/features/graph/api/traversal.types.ts** — the `LinkDirection` type, line 36
  - custo: The two direction values are decided by rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node, which the candidate index binds only to src/features/graph/api/traversal.transforms.ts. This file declares the enumeration as its own vocabulary. A change to the node does not reach this file through `--check`.
  - correção indicada: Bind rules/graph-explorer/a-link-is-outgoing-when-it-starts-at-the-node to this file, since it declares the shape of the direction value.

### `rules/graph-explorer/a-node-failure-reads-its-wording`

- **src/features/graph/components/NodeDetailPanel/NodeDetailPanel.shell.tsx** — ErrorView, the PanelHeader title prop (lines 118-122)
  - custo: Whatever the variant, the header of a failed panel reads "Nó não encontrado.". For a deleted node the alert reads "Este nó foi removido por conformidade." while the header above it says the node was not found. For a generic failure the header says not found while the alert asks for a retry. The owner is shown two messages that disagree, and the not-found wording is the one the specification reserves for RESOURCE_NOT_FOUND. No node says what the header shows in a failed state, so the code is where that decision now lives.
  - correção indicada: The candidate rule says each variant shows its own message and never another variant's. The header text of a failed panel needs a decision: either a node states what the failed header shows, or the header stops carrying another variant's message.

### `rules/graph-explorer/direction-picks-the-link-wording`

- **src/features/graph/api/traversal.types.ts** — the `directionArrow` member of `TraversalLinkView`, line 43
  - custo: The rule that an outgoing link carries → and an incoming link ← is held by rules/graph-explorer/direction-picks-the-link-wording, whose candidate index entry binds only src/features/graph/api/traversal.transforms.ts. This file declares the two arrow characters as a vocabulary of its own. If the node moves, `--check` does not reach this file, and the two declarations can disagree with no way to tell which one was decided.
  - correção indicada: Bind rules/graph-explorer/direction-picks-the-link-wording to this file, since it is where the shape of the arrow is declared. Code cannot read the specification, so only the bind closes this.

### `rules/knowledge-base/page-defaults`

- **src/features/curation/api/provenance.hooks.ts** — useListAcceptedFragments, the queryKey object (lines 108-109)
  - custo: The server's page defaults (20 items, offset 0) are held by rules/knowledge-base/page-defaults, and this file applies them a second time to build the cache key. If the node's default moves, this file is not bound to that node, so the check never reaches it. The key would then treat an omitted limit as 20 while the server returns another size.
  - correção indicada: Key the cache on the params as given (undefined when omitted) so the hook stops carrying the server's default. Alternatively, bind rules/knowledge-base/page-defaults to this file.


## unstated

### `(sem nó nomeado)`

- **src/features/curation/components/DecisionPanel/DecisionPanel.types.ts** — the function itemKindOf, lines 43-48
  - custo: The rule that an entity match is treated as a link when an item kind is needed lives only in this function. No node holds it. The closest node says only that an item kind of link selects the link reads. The next reader will look in the specification for what kind an entity match carries and will not find it. Any change to that mapping would be made here, with no node to decide it.
  - correção indicada: Give the mapping a node. rules/curation-workspace/link-items-use-link-reads-and-others-attribute-reads is the closest and does not state it. Either that node or a sibling would have to say that an entity match item has the item kind of link.

- **src/features/graph/components/NodeDetailPanel/NodeDetailPanel.copy.ts** — line 9, the attributesHeading entry of NODE_DETAIL_COPY, rendered at NodeDetailPanel.success.tsx line 113
  - custo: The panel emits a heading, "Atributos", over the attributes table, and no node under the specification root states that text. The graph-explorer nodes name the table's columns (attribute, value, state), the list "Aliases" and the section "Relações". A reader who looks in the specification for what the attributes section is called will not find it. The label lives only in this file.
  - correção indicada: The analysis would give the attributes section's heading a node, most likely beside the "Aliases" and "Relações" headings in contracts/graph-explorer/graph-screen or in a rule like attributes-are-listed-as-received.

- **src/features/ingest/api/useIngestGraphAssembly.ts** — the two GraphDelta literals, lines 135-139 (empty assembly) and 174-178 (full assembly)
  - custo: The name an ingest assembly gives itself as the tool that showed the graph is a literal that appears only in code. The graph-delta node only requires a source_tool string, and no node in the specification names this value. The next reader will not find in the specification what source an ingest-assembled graph carries.
  - correção indicada: The analysis would have to state the source tool of an ingest assembly's delta in a node of the ingest-workspace, for example on the session or on the assembly rules.

- **src/components/ds/ConversationMenu/ConversationMenu.tsx** — the STRINGS vocabulary for the row actions, the rename field and the dialog buttons (lines 39-51), and the aria-labels built from it (lines 246, 255, 313, 327, 341, 355)
  - custo: The rules require rename, archive, reactivate, delete, confirm and cancel controls but name none of their labels, except that deleting-asks-first names the dialog title "Excluir conversa". The words the owner and assistive technology hear for these controls are decided only here. A relabelling or a translation has no node to answer to.
  - correção indicada: The nodes that require these controls (a-row-offers-its-actions, a-rename-sends-the-trimmed-title, only-the-confirmation-deletes) would have to name their labels if the business holds them as fact. If they are surface vocabulary only, the project's surface route covers them.

- **src/components/ds/StateBadge/StateBadge.tsx** — decideTransition() (lines 75-86) and the animation selection in StateBadge (lines 122-146)
  - custo: The code decides which confidence-state changes the badge animates: uncertain to accepted is a promotion, any change into superseded is a supersession, a merge is signalled by a data attribute, and an uncertain badge pulses continuously. It also decides that reduced motion switches all of this off. No node in the specification holds any of it. Only the two badge nodes (five labelled states, always named) bind this file, and neither mentions motion or transitions. The next reader looks in the specification for which state changes the badge marks, finds nothing, and the code becomes the only place that decision lives.
  - correção indicada: Give the state-badge's confidence-state transition and pulse behaviour a node under domain/application-shell, or a rule constraining domain/application-shell/state-badge. Then this file can be bound to it.

### `contracts/application-shell/shell-screen`

- **src/shell/Header.tsx** — the brand block at the start of the header, lines 55-60
  - custo: The header shows the product name "Remember" as text the owner reads. No node holds that name or the fact that the header shows it. The shell-screen show-shell answer lists the banner's contents (the navigation, the palette toggle and the theme choice) and does not mention it. The wording lives only in the code, where nobody looks for it when the specification is read.
  - correção indicada: The analysis would have to give the product name shown in the header a node, most naturally contracts/application-shell/shell-screen under show-shell.

### `contracts/chat-workspace/chat-screen`

- **src/features/chat/components/Composer.tsx** — the Textarea in ComposerSendBand, line 262
  - custo: The composer shows this hint text inside the empty field, and no node holds it. The contract for compose-message names the field's label, the send and stop buttons and the band, but not a placeholder. The wording therefore lives only in this file, so a reader who looks in the specification for what the empty field says will not find it.
  - correção indicada: The accepted answer of compose-message in contracts/chat-workspace/chat-screen would have to state the placeholder, or a node would have to rule that the field carries none.

### `contracts/curation-workspace/bff-curation-reads`

- **src/features/curation/api/_transforms.ts** — toProvenanceRawInformation (metadata), toProvenanceChunk (locator) and toAttributeDetail (flags)
  - custo: The code decides that an absent metadata or locator is read as an empty object and that absent flags are read as an empty list. The node says only that these fields are optional. The empty-value default is a rule in code that no node states, so the next reader cannot learn it from the specification.
  - correção indicada: State in the node what an absent optional metadata, locator or flags reads as.

- **src/features/graph/api/provenance.types.ts** — line 1, the ProvenanceKind union
  - custo: The graph-explorer contract lists only read-link-provenance and read-attribute-provenance. The "fragments" kind is held by a node of the curation-workspace feature, so a reader of the graph-explorer nodes has no sign that this file also reads provenance by fragment. A change to that operation reaches this file only through a bind that does not exist.
  - correção indicada: The graph-explorer contract would have to state a read-fragment-provenance operation, or the "fragments" member would have to leave this file. Which of the two is the specification's decision to make.

- **src/features/graph/api/provenance.types.ts** — lines 3-27, the ProvenanceRawInformationWire, ProvenanceChunkWire and ProvenanceFragmentWire interfaces
  - custo: The graph-explorer nodes in this set name the chunk's index, offsets and raw information only in general terms. The wire attribute names are spelled out only in the curation-workspace contract, so the set holds no field name the file declares. A rename of those names would be decided in a node this file is not bound to.
  - correção indicada: The wire field names would have to be held by a node the graph-explorer contract answers to, or this file would have to be bound to the node that holds them.

### `contracts/curation-workspace/curation-screen`

- **src/features/curation/components/CorrectionForm/CorrectionForm.tsx** — the reason Textarea inside the Controller for "reason", line 138
  - custo: The form tells the owner this guidance sentence, and it is emitted text. A search of the specification root finds no node holding it. The curation-screen contract lists the other correction-form messages but not this one. If the wording changes, nobody reading the specification will know it was ever decided.
  - correção indicada: Either the correct-item operation of the curation-screen contract gains this placeholder text, or the specification names it as surface. The file cannot settle which.

- **src/features/curation/components/CurationPage.tsx** — The text the page emits at lines 128, 139 and 179: the region aria-label values and the heading.
  - custo: This is text the screen tells the owner and assistive technology: the two region names and the page heading. No node holds it. The screen contract holds only the idle line "Selecione um item da fila para começar.", the tab names and the drawer title "Curadoria". A later change to the wording will not be seen as a change to a specified fact.
  - correção indicada: Add the queue region name, the decision region name and the page heading to the screen contract's accepted answers. The contract is the node that should hold them.

- **src/features/curation/components/DecisionPanel/DecisionPanel.tsx** — the GlassSurface branch and the plain-section branch at the end of the component (lines 262-281)
  - custo: The panel's accessible name is announced to screen-reader users, and it lives only in this file. No node holds "Painel de decisão": the contract's read-decision-panel operation lists the panel's labels, hints and messages and does not list it. A change to the name would be made here, and the next reader looks in the specification and finds nothing.
  - correção indicada: Add the region's accessible name to the read-decision-panel operation of contracts/curation-workspace/curation-screen. That is the analysis route. The code is not asked to change.

- **src/features/curation/components/QueueTabs.tsx** — line 43, the aria-label on TabsList
  - custo: The accessible name read to screen-reader users is text the running system emits, and no node holds it. The tab labels Tudo, Entidades and Disputas are held by the show-queue answer in contracts/curation-workspace/curation-screen, which does not mention this name. A reader looking for what the tab group announces will not find it in the specification, and the wording can change without any node moving.
  - correção indicada: Either the show-queue answer of contracts/curation-workspace/curation-screen states the accessible name of the tab group, or the specification declares this text outside what it holds. Which one applies is a decision for a person.

- **src/features/curation/components/UndoToast/UndoToast.tsx** — line 56, the aria-label of the Button that carries onUndo
  - custo: The button's accessible name is "Desfazer ação", while the specification says the toast "offers Desfazer". The announced wording is a string the specification does not hold. A screen-reader user hears text that a reader of the specification will not find. The visible label "Desfazer" is held; only this aria-label is not.
  - correção indicada: Give the announced name of the undo button a home in the node that holds the undo-decision operation's text, or drop the aria-label so the visible "Desfazer" is the name.

### `contracts/ingest-workspace/bff-ingestion`

- **src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts** — the constant INGEST_MODEL, line 18, sent as model in handleSubmit (line 126)
  - custo: The model every ingestion from the screen runs under is decided only in this constant. The only node that names this model value is rules/chat/turn-model-default, and it governs the chat turn, not ingestion. rules/chat/turn-model-default was found by grep of the specification root and was not opened. bff-ingestion says only that model is "sent as given and checked by nothing in the client". The next reader looks in the specification for which model an ingestion uses and finds no answer, and the LLM run's recorded model becomes whatever this file says.
  - correção indicada: A node must hold which model the ingest screen names when it records a source, most naturally contracts/ingest-workspace/bff-ingestion at its ingest-raw-information operation. Until it does, this value has no home in the specification.

- **src/features/ingest/components/IngestWorkspace/useIngestOrchestration.ts** — the constant INGEST_PROMPT_VERSION, line 19, sent as prompt_version in handleSubmit (line 127)
  - custo: The extraction prompt version every ingestion from the screen runs under is decided only here. The extraction rules are conditioned on prompt version, for example event-type-fallback from v3 on and relative-date from v3 alone, so this constant selects which extraction rules apply. The next reader finds no node saying the screen submits v3 and learns it only from the code.
  - correção indicada: A node must hold which prompt version the ingest screen names when it records a source, most naturally contracts/ingest-workspace/bff-ingestion at its ingest-raw-information operation.

### `domain/application-shell/application-shell`

- **src/router/routes.tsx** — the path declarations of graphRoute, searchRoute, ingestRoute, historyRoute and notFoundRoute (lines 102, 108, 114, 161, 167)
  - custo: The literal addresses for the graph, search, ingest, history and not-found areas are decided only in this file. The rules name them as "the graph, search and history addresses" and "the not-found address" and never state the path. The next reader looks for these paths in the specification and does not find them. Other nodes do state `/chat`, `/curation` and `/sign-in`, so these five are the ones left to the code.
  - correção indicada: Give the address vocabulary of the application shell a node. `domain/application-shell/application-shell` already carries an `address` attribute and is the natural home for the path of each area.

### `domain/curation-workspace/curation-session`

- **src/features/curation/components/CurationPage.tsx** — The mount effect at lines 50-54, together with deriveInitialSelection in curation-page-helpers.ts.
  - custo: The screen picks an item by itself: the address's item if it is in the queue, otherwise the first entry. It does this again whenever the loaded queue or the tab changes. No node states this selection rule. The next reader will look for it in the specification and will not find it there. It also decides when the idle panel can appear: with entries loaded, the idle state of the contract's "Nothing is selected or the selection is not in the loaded queue" never shows, because the first entry is selected instead.
  - correção indicada: Give the initial-selection rule a home in a node. domain/curation-workspace/curation-session holds select-item and selected_item, and is where it would belong. The rule is: deep link if it is in the loaded queue, otherwise the first entry, re-derived when the queue or the tab changes.

### `rules/application-shell/a-graph-node-names-its-type`

- **src/components/ds/GraphNode/GraphNode.tsx** — NODE_STYLE, lines 26-37 (the `label` of each of the ten entries)
  - custo: The node says each type has "a fixed pt-BR name" but does not state the ten names. The only place they are written is this table, so the code is where the business wording lives, and the next reader who looks in the specification for what a Role or a Location node is called will not find it. The catalog node (rules/knowledge-base/catalog-node-types) holds the types and their English descriptions, not these display names.
  - correção indicada: The ten pt-BR names have to be stated in a node, most naturally the one that holds the rule that a graph node takes one of ten types with a fixed pt-BR name, so that the names this file carries have a node that holds them.

### `rules/application-shell/a-server-error-is-always-a-failure`

- **src/lib/http.ts** — the status >= 500 branch of http(), lines 177-192, the fallback message passed to EnvelopeError
  - custo: When a 5xx body carries no readable message, this helper tells the owner "Algo deu errado. Tente novamente.". The only node in this file's set about a 5xx answer, a-server-error-is-always-a-failure, gives the code (SYSTEM_UPSTREAM) but states no fallback message. The same wording is held only in the contracts of other request helpers (contracts/curation-workspace/bff-curation, for example). The next reader of this helper's 5xx contract will not find the wording in the rule that governs it, and the code is the only place it is stated for this helper.
  - correção indicada: Give the message used when a 5xx answer has no readable message a home in rules/application-shell/a-server-error-is-always-a-failure, or in the node that holds this helper's wordings.

### `rules/application-shell/deleting-asks-first`

- **src/components/ds/ConversationMenu/ConversationMenu.tsx** — STRINGS.deleteBody, rendered in the delete dialog's DialogDescription (lines 49 and 403-405)
  - custo: The dialog tells the owner that deleting a conversation is irreversible. No node holds that claim. deleting-asks-first holds only the dialog's title, and only-the-confirmation-deletes holds who sends the delete. The statement about what deletion does therefore lives only in this file. The next reader looks for it in the specification and does not find it. If deletion semantics change, nothing flags this text.
  - correção indicada: deleting-asks-first (or a node for the dialog's content) would have to state the dialog's body text, or the irreversibility of deleting a conversation. Alternatively the body would have to stop asserting it.

### `rules/application-shell/the-header-lists-six-areas`

- **src/shell/Header.tsx** — the NAV constant, lines 23-30 (the `to` value of each of the six entries)
  - custo: The node fixes the six area names, their order and the "equals or begins" test for the current area. It does not give the address each area is at. The mapping from Chat, Grafo, Buscar, Ingerir, Curar and Histórico to "/chat", "/graph", "/search", "/ingest", "/curation" and "/history" lives only in this array. A reader who looks in the specification for where each area lives finds no address. If an address changes, no node says which was decided.
  - correção indicada: The analysis would have to give the area-to-address mapping a node, most naturally rules/application-shell/the-header-lists-six-areas or the application-shell domain node.

### `rules/application-shell/the-palette-offers-five-destinations`

- **src/shell/CommandPalette.tsx** — line 52, the placeholder prop of CommandInput
  - custo: The palette's search-field wording is shown to the owner on every opening, and no node holds it. The palette node fixes only the group label, the destination labels and the empty reading "Nada encontrado.". The next reader who looks in the specification for what the field says will not find it, and the text can change with no node moving. The text also promises "ações", although the node offers one group of five destinations and no actions.
  - correção indicada: The analysis would have to give this text a node, either by extending rules/application-shell/the-palette-offers-five-destinations or by a node of its own. Alternatively it would have to be decided out of the field.

- **src/shell/CommandPalette.tsx** — lines 20-26, the AREAS table, the `to` member of each entry
  - custo: Which address each destination leads to is decided only in this table. The node names the five destinations by label and order and never says where they lead. The addresses are also declared in src/router/routes.tsx. Moving or renaming an address there leaves this table unreached by any node, and nothing says which of the two was decided.
  - correção indicada: The analysis would have to state the address of each palette destination in a node, in the-palette-offers-five-destinations or in the node that holds the declared addresses.

### `rules/curation-workspace/side-shows-its-validity-basis-and-confidence`

- **src/features/curation/components/DecisionPanel/DisputeSideCard.tsx** — SOURCE_LABEL (lines 14-20) and the caption line of the returned button (lines 69-73)
  - custo: The node requires "the label of its valid-from basis" but gives no wording. The abbreviations "Doc." and "Receb." and the captions "Vigência:", "Fonte:" and "Confiança" are shown to the curator, and no node holds them. A grep of the specification, outside the projection, finds none of them. The only nearby wording is in contracts/curation-workspace/curation-screen, which names the date-justification bases "Declarada no fragmento", "Data do documento" and "Data de recebimento". That wording is for a different surface and differs from this card's. The next reader looking for what a dispute side calls its basis will not find it in the specification, and the two surfaces can drift apart without anything noticing.
  - correção indicada: The node rules/curation-workspace/side-shows-its-validity-basis-and-confidence would have to state the label shown for each of stated, document and received, and the captions of the validity, basis and confidence fields, or state that the labels of the justification bases are reused.

### `rules/graph-explorer/the-reorganize-control-needs-its-handler`

- **src/features/graph/components/GraphCanvas/GraphCanvas.tsx** — the visible label inside the reorganize Button, line 207
  - custo: The text a person reads on the control is "Reorganizar". The only node that speaks of it, rules/graph-explorer/the-reorganize-control-needs-its-handler, fixes the control's name as "Reorganizar o layout do grafo", which the aria-label carries. A search of the specification finds no node holding the visible text. Anyone changing the control's wording looks in the specification, finds only the accessible name, and has no node that decides what is displayed.
  - correção indicada: The visible text of the reorganize control would need a node to hold it, most naturally by extending rules/graph-explorer/the-reorganize-control-needs-its-handler or the graph-screen contract. That is a change to the specification, not to this file.

### `rules/ingest-workspace/assembly-traverses-each-affected-node`

- **src/features/ingest/api/useIngestGraphAssembly.ts** — TRAVERSE_STALE_MS constant (line 18), used in the useQueries options at lines 114-115
  - custo: How long a traversal counts as fresh, and that a regained window focus never rereads it, are decided only here. The node for the traversal request states depth, direction and parallelism but no freshness. A reader looking in the specification for how current the assembled graph is will not find it. Other ingest-workspace rules were found to state no freshness window.
  - correção indicada: The analysis would have to give the traversal's freshness window (five minutes) and its no-reread-on-focus behaviour a node, most naturally the rule on the traversal request.

### `rules/owner-access/sign-in-destination-defaults-to-chat`

- **src/features/auth/api/useSignIn.ts** — readRedirectParam(), lines 16-24
  - custo: The name of the query parameter that carries the requested destination is a fact about the sign-in address, and it lives only in this function. The node says only that the owner goes to "the destination the address requested" and never names the parameter. Anything that builds a sign-in address with a destination has to match the string "redirect", and the next reader will look for it in the specification and not find it.
  - correção indicada: The analysis would have to give the parameter name a node. The natural home is rules/owner-access/sign-in-destination-defaults-to-chat, or the sign-in-destination value object, or the sign-in contract's open-sign-in operation.
