/**
 * ConversationView — unit tests (TC-07).
 *
 * Why these tests exist (Golden Rule 9):
 *  - UI-01 empty-state copy is normative ('Selecione ou crie uma conversa
 *    para começar.'). If a refactor silently rewords it, screen-reader users
 *    lose the documented entry hint and the QA gate fails. We pin the exact
 *    string.
 *  - The active branch must actually mount the MessageStream AND the Composer
 *    (its textarea) — a regression that leaves either slot empty means the
 *    operator cannot read or send messages (the exact bug this guards). We
 *    render the REAL components inside a QueryClientProvider with the network
 *    stubbed (queries stay pending → MessageStream shows its skeleton, the
 *    Composer shows its send band + textarea) so no real fetch fires.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConversationView } from "../ConversationView";

// Keep every real export of the HTTP layer (EnvelopeError, authHeader, …) but
// replace the network call with a promise that never settles, so the mounted
// queries (history, conversation detail) stay in their pending state and no
// real request leaves jsdom.
vi.mock("@/lib/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/http")>();
  return { ...actual, http: () => new Promise(() => {}) };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderWithClient(node: React.ReactNode): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  act(() => {
    root.render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
  });
}

describe("ConversationView", () => {
  it("renders UI-01 empty state with the normative pt-BR hint when no conversation is active", () => {
    // Empty branch takes no hooks, so it renders fine without a client.
    act(() => {
      root.render(<ConversationView conversationId={undefined} />);
    });

    const empty = container.querySelector(
      '[data-testid="conversation-view-empty"]',
    );
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe(
      "Selecione ou crie uma conversa para começar.",
    );
    // The active branch must NOT render in the empty state — guards against
    // both branches accidentally mounting at once.
    expect(
      container.querySelector('[data-testid="conversation-view"]'),
    ).toBeNull();
  });

  it("mounts MessageStream + the Composer textarea when a conversation id is present", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    renderWithClient(<ConversationView conversationId={id} />);

    const view = container.querySelector('[data-testid="conversation-view"]');
    expect(view).not.toBeNull();
    expect(view?.getAttribute("data-conversation-id")).toBe(id);

    // Both slots present...
    expect(
      container.querySelector('[data-testid="message-stream-slot"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="composer-slot"]'),
    ).not.toBeNull();

    // ...and the REAL children mounted inside them: the message stream region
    // and the composer's textarea (the operator can type a message).
    expect(
      container.querySelector('[data-testid="message-stream"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="composer-textarea"]'),
    ).not.toBeNull();

    // The empty branch must NOT render at the same time.
    expect(
      container.querySelector('[data-testid="conversation-view-empty"]'),
    ).toBeNull();
  });
});
