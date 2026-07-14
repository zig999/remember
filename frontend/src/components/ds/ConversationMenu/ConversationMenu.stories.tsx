/**
 * ConversationMenu — Storybook stories (TC-06).
 *
 * Mirrors spec §6 (variants):
 *  - NoActive          (variant `no-active`)        — trigger shows "Nova conversa"
 *  - Active            (variant `active`)            — trigger shows the title
 *  - Loading           (variant `loading`)           — isLoading=true
 *  - ArchivedVisible   (variant `archived-visible`)  — archived items rendered with badge
 *
 * The stories also exercise §8 interactive flows via stateful render wrappers:
 *  the include_archived toggle, rename, and delete confirm — so a human can
 *  exercise the full UX in Storybook (addon-vitest browser mode picks the
 *  non-interactive stories up as component tests).
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ConversationMenu } from "./ConversationMenu";
import type { Conversation } from "@/features/chat/types";

/* ---------- fixture data ---------------------------------------------- */

const sampleConversations: Conversation[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Reuniao Apollo",
    archivedAt: null,
    createdAt: new Date("2026-06-19T10:00:00Z"),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Backlog do trimestre",
    archivedAt: null,
    createdAt: new Date("2026-06-18T10:00:00Z"),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: null,
    archivedAt: null,
    createdAt: new Date("2026-06-17T10:00:00Z"),
  },
];

const archivedConversation: Conversation = {
  id: "44444444-4444-4444-4444-444444444444",
  title: "Projeto antigo",
  archivedAt: new Date("2026-05-01T10:00:00Z"),
  createdAt: new Date("2026-05-01T10:00:00Z"),
};

/* ---------- meta ------------------------------------------------------ */

const meta: Meta<typeof ConversationMenu> = {
  title: "Eternal/Components/ConversationMenu",
  component: ConversationMenu,
  parameters: {
    a11y: { element: "#storybook-root" },
    layout: "padded",
  },
  args: {
    onSelect: (id: string) => console.warn("onSelect", id),
    onCreate: () => console.warn("onCreate"),
    onRename: (id: string, newTitle: string) =>
      console.warn("onRename", id, newTitle),
    onArchive: (id: string) => console.warn("onArchive", id),
    onUnarchive: (id: string) => console.warn("onUnarchive", id),
    onDelete: (id: string) => console.warn("onDelete", id),
    onIncludeArchivedChange: (v: boolean) =>
      console.warn("onIncludeArchivedChange", v),
  },
};

export default meta;
type Story = StoryObj<typeof ConversationMenu>;

/* ---------- variants (spec §6) ---------------------------------------- */

/** Variant `no-active` — trigger shows "Nova conversa". */
export const NoActive: Story = {
  args: {
    activeConversationId: null,
    activeTitle: null,
    conversations: sampleConversations,
    isLoading: false,
    includeArchived: false,
  },
};

/** Variant `active` — trigger shows the active conversation's title. */
export const Active: Story = {
  args: {
    activeConversationId: "11111111-1111-1111-1111-111111111111",
    activeTitle: "Reuniao Apollo",
    conversations: sampleConversations,
    isLoading: false,
    includeArchived: false,
  },
};

/** Variant `loading` — spinner in the trigger; menu shows skeleton when empty. */
export const Loading: Story = {
  args: {
    activeConversationId: null,
    activeTitle: null,
    conversations: [],
    isLoading: true,
    includeArchived: false,
  },
};

/** Variant `archived-visible` — archived items appear with the badge. */
export const ArchivedVisible: Story = {
  args: {
    activeConversationId: null,
    activeTitle: null,
    conversations: [...sampleConversations, archivedConversation],
    isLoading: false,
    includeArchived: true,
  },
};

/* ---------- interactive playgrounds ----------------------------------- */

/**
 * InteractiveToggle — wires the `includeArchived` toggle so the demo can
 * actually show the include_archived filter behaviour end-to-end.
 */
export const InteractiveToggle: Story = {
  render: (args) => {
    function Demo() {
      const [includeArchived, setIncludeArchived] = useState(false);
      const visible = includeArchived
        ? [...sampleConversations, archivedConversation]
        : sampleConversations;
      return (
        <ConversationMenu
          {...args}
          conversations={visible}
          includeArchived={includeArchived}
          onIncludeArchivedChange={setIncludeArchived}
        />
      );
    }
    return <Demo />;
  },
  args: {
    activeConversationId: null,
    activeTitle: null,
    isLoading: false,
  },
};

/**
 * InteractiveCrud — full local CRUD with an in-memory list. Lets a reviewer
 * exercise create / rename / archive / unarchive / delete with the actual
 * pt-BR copy from the spec without wiring TanStack Query.
 */
export const InteractiveCrud: Story = {
  render: (args) => {
    function Demo() {
      const [list, setList] = useState<Conversation[]>(sampleConversations);
      const [activeId, setActiveId] = useState<string | null>(null);
      const [includeArchived, setIncludeArchived] = useState(false);
      const visible = includeArchived
        ? list
        : list.filter((c) => c.archivedAt === null);
      const active = list.find((c) => c.id === activeId);
      return (
        <ConversationMenu
          {...args}
          activeConversationId={activeId}
          activeTitle={active?.title ?? null}
          conversations={visible}
          includeArchived={includeArchived}
          onIncludeArchivedChange={setIncludeArchived}
          onSelect={setActiveId}
          onCreate={() => {
            const id = crypto.randomUUID();
            setList((cs) => [
              {
                id,
                title: null,
                archivedAt: null,
                createdAt: new Date(),
              },
              ...cs,
            ]);
            setActiveId(id);
          }}
          onRename={(id, newTitle) =>
            setList((cs) =>
              cs.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
            )
          }
          onArchive={(id) =>
            setList((cs) =>
              cs.map((c) => (c.id === id ? { ...c, archivedAt: new Date() } : c)),
            )
          }
          onUnarchive={(id) =>
            setList((cs) =>
              cs.map((c) => (c.id === id ? { ...c, archivedAt: null } : c)),
            )
          }
          onDelete={(id) => {
            setList((cs) => cs.filter((c) => c.id !== id));
            if (activeId === id) setActiveId(null);
          }}
        />
      );
    }
    return <Demo />;
  },
  args: {
    isLoading: false,
  },
};
