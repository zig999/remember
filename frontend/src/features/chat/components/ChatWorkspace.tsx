/**
 * ChatWorkspace — primary /chat workspace component (TC-07).
 *
 * Layout (front.md §3.1 + chat.feature.spec.md UI-01):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  ConversationView (40%)  │  Graph stub (60%)                 │
 *   │  MessageStream + Composer│  'Grafo em breve' (later wave)    │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Split rule: 40% / 60% via Tailwind v4 CONTAINER QUERY (`@container`
 * + `@lg:` modifier) — never a CSS @media query (forbidden by
 * front.md §10.2 / project conventions). Below the container's `lg`
 * breakpoint the columns stack vertically (mobile/narrow workstation
 * window); at `@lg` and above they sit side-by-side at 2/5 + 3/5.
 *
 * Search state: reads `?conversation=<uuid>` from the chatRoute search
 * (TC-01 owns the validator). The URL is the single source of truth
 * for the active conversation id (front.md §3.2).
 *
 * Out of scope:
 *  - MessageStream rendering (TC-08, lives inside ConversationView)
 *  - Composer (TC-09, lives inside ConversationView)
 *  - Graph rendering (later wave — placeholder only here)
 */
import { useEffect, type FC } from "react";
import { chatRoute } from "@/router/routes";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { useGraphStore } from "@/features/graph";
import { ConversationView } from "./ConversationView";

export const ChatWorkspace: FC = () => {
  // TC-01 chatRoute.validateSearch returns `{ conversation?: string }`. When
  // the param is absent or empty, the validator yields `{}` — destructuring
  // gives `undefined`, which drives the UI-01 empty state in ConversationView.
  const { conversation } = chatRoute.useSearch();

  // EV-CG-05 (plan §8.2 / TC-FE-04): when the active conversation changes —
  // including the `undefined → uuid` transition on first selection and the
  // `uuid → undefined` transition on leaving — the subgraph must be cleared.
  // Leaking the previous conversation's nodes into a new one would be a
  // coherence (and privacy) bug. We call `getState().clear()` directly to
  // avoid subscribing the workspace to the entire store (re-renders would
  // dwarf the actual mutation cost).
  useEffect(() => {
    useGraphStore.getState().clear();
  }, [conversation]);

  return (
    // `@container` marks the workspace as the query container and `flex-1`
    // makes it fill the workspace region (AppShell's <main> is a flex column).
    // The `@lg:` split MUST live on a DESCENDANT, never on this element: a
    // container-query variant resolves against an ANCESTOR container, so an
    // element cannot query its own inline-size.
    <div
      className="@container min-h-0 w-full flex-1"
      data-testid="chat-workspace"
    >
      {/* `flex-col` is the narrow/stacked default; `@lg:flex-row` flips to the
          two-column layout once the WORKSPACE container (not the viewport)
          crosses the `lg` container breakpoint. */}
      <div className="flex h-full w-full flex-col @lg:flex-row">
        {/* Left column — chat, 40% of the workspace at @lg+ (w-2/5 = 40%).
            Stacked above the graph column below @lg (full width). */}
        <div className="min-h-0 flex-1 @lg:w-2/5 @lg:flex-none">
          <ConversationView conversationId={conversation} />
        </div>

        {/* Right column — graph, 60% at @lg+ (w-3/5 = 60%), to the right.
            Graph rendering is out of scope for this wave; a glass panel
            with the 'em breve' hint stands in. */}
        <div
          className="min-h-0 flex-1 p-lg @lg:w-3/5 @lg:flex-none"
          data-testid="chat-graph-stub"
        >
          <GlassSurface
            level="panel"
            animate={false}
            className="flex h-full w-full items-center justify-center text-content"
            aria-label="Grafo da conversa"
          >
            <p className="text-body text-body">Grafo em breve</p>
          </GlassSurface>
        </div>
      </div>
    </div>
  );
};
