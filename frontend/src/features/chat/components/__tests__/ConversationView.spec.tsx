/**
 * ConversationView — unit tests (TC-07).
 *
 * Why these tests exist (Golden Rule 9):
 *  - UI-01 empty-state copy is normative ('Selecione ou crie uma conversa
 *    para começar.'). If a refactor silently rewords it, screen-reader users
 *    lose the documented entry hint and the QA gate fails. We pin the exact
 *    string.
 *  - The active vs. empty branch is the only behavioral fork in this
 *    component — both halves are asserted so the wrong branch never sneaks
 *    in undetected when MessageStream/Composer ship in TC-08/TC-09.
 *  - The component must NOT fetch data; this test indirectly confirms that
 *    by rendering without a QueryClientProvider — a future regression that
 *    adds a hook there would throw on mount.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ConversationView } from "../ConversationView";

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

describe("ConversationView", () => {
  it("renders UI-01 empty state with the normative pt-BR hint when no conversation is active", () => {
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

  it("renders the active conversation layout with MessageStream + Composer slots when a conversation id is present", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    act(() => {
      root.render(<ConversationView conversationId={id} />);
    });

    const view = container.querySelector('[data-testid="conversation-view"]');
    expect(view).not.toBeNull();
    expect(view?.getAttribute("data-conversation-id")).toBe(id);
    // Both slots must be present — TC-08 / TC-09 fill them in later.
    expect(
      container.querySelector('[data-testid="message-stream-slot"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="composer-slot"]'),
    ).not.toBeNull();
    // The empty branch must NOT render at the same time.
    expect(
      container.querySelector('[data-testid="conversation-view-empty"]'),
    ).toBeNull();
  });
});
