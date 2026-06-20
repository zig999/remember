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
import type { FC } from "react";
import { chatRoute } from "@/router/routes";
import { GlassSurface } from "@/components/ds/GlassSurface";
import { ConversationView } from "./ConversationView";

export const ChatWorkspace: FC = () => {
  // TC-01 chatRoute.validateSearch returns `{ conversation?: string }`. When
  // the param is absent or empty, the validator yields `{}` — destructuring
  // gives `undefined`, which drives the UI-01 empty state in ConversationView.
  const { conversation } = chatRoute.useSearch();

  return (
    <div
      // `@container` enables container-query modifiers (`@lg:` etc.) on
      // descendants — replaces a media query (forbidden). `flex flex-col`
      // is the narrow/stacked default; `@lg:flex-row` flips to the two-
      // column layout when the WORKSPACE container (not the viewport)
      // crosses Tailwind's `lg` container breakpoint.
      className="@container flex h-full w-full flex-col @lg:flex-row"
      data-testid="chat-workspace"
    >
      {/* Left column — 40% of the workspace at @lg+ (w-2/5 = 40%).
          Stacked above the graph column below @lg (full width). */}
      <div className="flex-1 @lg:w-2/5 @lg:flex-none">
        <ConversationView conversationId={conversation} />
      </div>

      {/* Right column — 60% of the workspace at @lg+ (w-3/5 = 60%).
          Graph rendering is out of scope for this wave; a glass panel
          with the 'em breve' hint stands in. */}
      <div
        className="flex-1 p-lg @lg:w-3/5 @lg:flex-none"
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
  );
};
