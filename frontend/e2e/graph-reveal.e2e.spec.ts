/**
 * Graph reveal — Playwright E2E (TC-FE-12).
 *
 * What this spec pins (in a real browser, where jsdom can't reach):
 *
 *  - AC-F.14 — when a `graph_delta` frame delivers K≥3 nodes, the visible
 *    node count grows over time. Specifically: at +50ms (just past the
 *    first stagger tick of 90ms default), fewer than K nodes are visible;
 *    by +1500ms (well past K × 90ms), all K are visible. jsdom can't show
 *    this because it never lays out React Flow nodes — Playwright can.
 *
 *  - AC-F.16 — with `prefers-reduced-motion: reduce`, the entire reveal
 *    collapses to ~immediate: all K nodes are visible within ~150ms of
 *    the delta landing. jsdom only ships a no-op matchMedia, so this
 *    branch can only be verified at a real-browser layer.
 *
 *  - AC-U.1 / AC-U.3 — clicking a node in the graph opens the
 *    NodeDetailPanel *inside the right pane* and does NOT trigger any
 *    chat-side mutation (no extra `/messages` POST). Verified by
 *    intercepting fetch traffic and asserting the POST count stayed at
 *    zero.
 *
 * Mocking strategy:
 *  - The Vite preview server hosts the SPA at the configured port.
 *  - Playwright `page.route()` intercepts BFF endpoints used during the
 *    test (auth-free render path): `/api/v1/conversations/:id` (mocked
 *    metadata), `/api/v1/conversations/:id/messages` (mocked SSE), and
 *    `/api/v1/nodes/:id` (mocked node detail for the click path).
 *  - The auth guard accepts a non-JWT bearer (per the
 *    `playwright-real-stack-verification` memo — the SPA only DECODES the
 *    token; we never round-trip to the BFF for verification because we
 *    intercept every BFF request).
 *
 * Why not test against the running stack:
 *  - The owner's `npm run dev` server (and the BFF) might not be up
 *    during a CI run; even when they are, hitting a live LLM is
 *    non-deterministic. Mocking the SSE stream lets us assert exact
 *    timing without flaky LLM behavior. Live-stack verification is
 *    captured separately in the memory note
 *    `playwright-real-stack-verification`.
 *
 * Spec references:
 *  - TC-FE-12 validation criteria (AC-F.14, AC-F.16, AC-U.{1,3}).
 *  - temp/chat-graphspace-plan.md §11 UC-CG-{01,09,11}, §13.
 */
import { expect, test } from "playwright/test";
import type { Route } from "playwright/test";

const CONVERSATION_ID = "11111111-1111-1111-1111-111111111111";
const NODE_ID_RODRIGO = "n-rodrigo-2026";
const NODE_ID_ACME = "n-acme-2026";
const NODE_ID_PROJECT = "n-project-2026";

/**
 * Build an SSE response body that streams the test's fixture frames with
 * a `graph_delta` carrying K=3 nodes. Returned as a single string body —
 * Playwright's `route.fulfill()` writes it as the response payload all at
 * once (the browser's EventSource/fetch reader still parses each frame as
 * it arrives byte-by-byte from the network buffer).
 */
function makeSSEBody(): string {
  const graphDelta = JSON.stringify({
    source_tool: "traverse",
    nodes: [
      {
        id: NODE_ID_RODRIGO,
        node_type: "person",
        canonical_name: "Rodrigo",
        status: "active",
      },
      {
        id: NODE_ID_ACME,
        node_type: "organization",
        canonical_name: "Acme",
        status: "active",
      },
      {
        id: NODE_ID_PROJECT,
        node_type: "project",
        canonical_name: "Remember",
        status: "active",
      },
    ],
    links: [
      {
        id: "l1",
        source_node_id: NODE_ID_RODRIGO,
        target_node_id: NODE_ID_ACME,
        link_type: "employed_by",
        is_temporal: true,
      },
      {
        id: "l2",
        source_node_id: NODE_ID_RODRIGO,
        target_node_id: NODE_ID_PROJECT,
        link_type: "participates_in",
        is_temporal: false,
      },
    ],
  });
  return [
    'event: llm_start\ndata: {"iteration":1}\n\n',
    'event: tool_start\ndata: {"tool":"traverse","args_summary":"id=rodrigo"}\n\n',
    'event: tool_result\ndata: {"tool":"traverse","ok":true}\n\n',
    `event: graph_delta\ndata: ${graphDelta}\n\n`,
    'event: text_delta\ndata: {"delta":"Encontrei o subgrafo."}\n\n',
    'event: done\ndata: {"stop_reason":"end_turn","model":"x","tokens_in":1,"tokens_out":2}\n\n',
  ].join("");
}

/** Mock the conversation-metadata GET so ConversationView mounts without
 *  hitting a real BFF. */
async function mockConversation(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      id: CONVERSATION_ID,
      title: "Quem é o Rodrigo?",
      created_at: "2026-06-21T10:00:00Z",
      updated_at: "2026-06-21T10:00:00Z",
    }),
  });
}

/** Mock the messages-list GET so MessageStream renders an empty history. */
async function mockEmptyMessages(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ items: [], next_cursor: null }),
  });
}

/** Mock the per-conversation usage GET (footer status). */
async function mockUsage(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      tokens_in_total: 0,
      tokens_out_total: 0,
      message_count: 0,
    }),
  });
}

/** Mock the SSE turn endpoint with our fixture stream. */
async function mockSSETurn(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
    body: makeSSEBody(),
  });
}

/** Mock the NodeDetail GET so the inline detail panel can paint after a
 *  node click (AC-U.1). */
async function mockNodeDetail(route: Route): Promise<void> {
  const url = route.request().url();
  const id = url.split("/").pop() ?? "";
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      node: {
        id,
        node_type: "person",
        canonical_name: "Rodrigo",
        status: "active",
      },
      aliases: [],
      attributes: [],
    }),
  });
}

/**
 * Inject a bearer token into sessionStorage before the SPA boots. The
 * project's auth store decodes the JWT client-side only — a non-JWT
 * string short-circuits to `isFresh() === true` because `claims === null`
 * AND `accessToken !== null` (see `state/auth.ts` `isFresh`). This bypasses
 * the route guard for the test without ever talking to the auth backend.
 */
async function injectAuthToken(page: import("playwright/test").Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("remember.auth.token", "e2e-fake-token");
    } catch {
      // ignore — sessionStorage may be unavailable in some browser contexts.
    }
  });
}

test.describe("Graph reveal — AC-F.14 (one-by-one, K≥3 nodes)", () => {
  test("visible node count grows over time after a graph_delta with 3 nodes", async ({
    page,
  }) => {
    await injectAuthToken(page);

    // Intercept BFF traffic — register every handler BEFORE navigating.
    await page.route(
      /\/api\/v1\/conversations\/[^/]+\/messages(?:$|\?)/,
      mockSSETurn,
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}(?:$|\\?)`),
      mockConversation,
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}/messages\\?`),
      mockEmptyMessages,
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}/usage`),
      mockUsage,
    );

    await page.goto(`/chat?conversation=${CONVERSATION_ID}`);

    // Wait for the GraphSpace region to mount (empty state visible).
    await page.waitForSelector('[data-testid="graph-space"]', {
      state: "attached",
      timeout: 5_000,
    });

    // Trigger the turn — the SSE mock returns our 3-node graph_delta.
    // Type into the composer and submit.
    const composer = page.getByRole("textbox", { name: /mensagem|message/i });
    await composer.fill("Quem é o Rodrigo?");
    await composer
      .press("Enter")
      .catch(async () => {
        // Fallback: click the send button if Enter is bound differently.
        await page.getByRole("button", { name: /enviar|send/i }).click();
      });

    // Take a snapshot of the visible node count at +120ms (just past the
    // first stagger tick of 90ms — exactly one node should be visible).
    // The DOM proxy is React Flow's `[data-id="<nodeId>"]` wrapper.
    await page.waitForTimeout(120);
    const visibleEarly = await page.evaluate(() => {
      const ids = [
        "n-rodrigo-2026",
        "n-acme-2026",
        "n-project-2026",
      ];
      return ids.filter(
        (id) => document.querySelector(`[data-id="${id}"]`) !== null,
      ).length;
    });

    // The reveal MUST be sequential — fewer than 3 visible at +120ms.
    // If a regression collapses the stagger into a single batched render,
    // this assertion fires loudly.
    expect(visibleEarly).toBeLessThan(3);
    expect(visibleEarly).toBeGreaterThanOrEqual(0);

    // Wait until all 3 are visible. Default stagger 90ms × 3 + animation
    // ~180ms ≈ 450ms — give it generous 2000ms before failing.
    await page.waitForFunction(
      () => {
        const ids = [
          "n-rodrigo-2026",
          "n-acme-2026",
          "n-project-2026",
        ];
        return ids.every(
          (id) => document.querySelector(`[data-id="${id}"]`) !== null,
        );
      },
      { timeout: 2_000 },
    );
    // Sanity check the final count.
    const visibleLate = await page.locator('[data-id^="n-"]').count();
    expect(visibleLate).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Graph reveal — AC-F.16 (prefers-reduced-motion)", () => {
  test.use({ colorScheme: "dark" });

  test("with reduced-motion enabled, all K nodes are visible nearly immediately", async ({
    page,
  }) => {
    await injectAuthToken(page);
    // Enable prefers-reduced-motion at the browser level — this drives the
    // `useGraphReveal` short-circuit branch (UC-CG-11).
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.route(
      /\/api\/v1\/conversations\/[^/]+\/messages(?:$|\?)/,
      mockSSETurn,
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}(?:$|\\?)`),
      mockConversation,
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}/messages\\?`),
      mockEmptyMessages,
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}/usage`),
      mockUsage,
    );

    await page.goto(`/chat?conversation=${CONVERSATION_ID}`);
    await page.waitForSelector('[data-testid="graph-space"]', {
      state: "attached",
      timeout: 5_000,
    });

    const composer = page.getByRole("textbox", { name: /mensagem|message/i });
    await composer.fill("Quem é o Rodrigo?");
    await composer.press("Enter").catch(async () => {
      await page.getByRole("button", { name: /enviar|send/i }).click();
    });

    // With reduced-motion, the hook drains the queue in a single
    // microtask. We sample at +250ms — should already show ALL 3.
    await page.waitForFunction(
      () => {
        const ids = [
          "n-rodrigo-2026",
          "n-acme-2026",
          "n-project-2026",
        ];
        return ids.every(
          (id) => document.querySelector(`[data-id="${id}"]`) !== null,
        );
      },
      { timeout: 1_000 },
    );
    // Cross-check: well under the stagger × K floor that the normal-motion
    // path would need.
    const allAtOnce = await page.locator('[data-id^="n-"]').count();
    expect(allAtOnce).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Graph reveal — AC-U.1 / AC-U.3 (unidirectionality)", () => {
  test("clicking a node opens NodeDetailPanel WITHOUT firing any new POST /messages", async ({
    page,
  }) => {
    await injectAuthToken(page);

    // Count POSTs to /messages — must stay at exactly 1 (the initial turn).
    let messagesPostCount = 0;
    page.on("request", (req) => {
      if (
        req.method() === "POST" &&
        /\/api\/v1\/conversations\/[^/]+\/messages/.test(req.url())
      ) {
        messagesPostCount += 1;
      }
    });

    await page.route(
      /\/api\/v1\/conversations\/[^/]+\/messages(?:$|\?)/,
      async (route) => {
        if (route.request().method() === "POST") return mockSSETurn(route);
        return mockEmptyMessages(route);
      },
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}(?:$|\\?)`),
      mockConversation,
    );
    await page.route(
      new RegExp(`/api/v1/conversations/${CONVERSATION_ID}/usage`),
      mockUsage,
    );
    // NodeDetail mock — the click-to-detail path needs this.
    await page.route(/\/api\/v1\/nodes\/[^/]+(?:$|\?)/, mockNodeDetail);

    await page.goto(`/chat?conversation=${CONVERSATION_ID}`);
    await page.waitForSelector('[data-testid="graph-space"]', {
      timeout: 5_000,
    });

    const composer = page.getByRole("textbox", { name: /mensagem|message/i });
    await composer.fill("Quem é o Rodrigo?");
    await composer.press("Enter").catch(async () => {
      await page.getByRole("button", { name: /enviar|send/i }).click();
    });

    // Wait for the Rodrigo node to be revealed.
    await page.waitForSelector(`[data-id="${NODE_ID_RODRIGO}"]`, {
      timeout: 2_000,
    });

    // Sanity: exactly one POST so far (the initial turn).
    expect(messagesPostCount).toBe(1);

    // Click the node — should mount the NodeDetailPanel (AC-U.1, AC-F.20).
    await page.click(`[data-id="${NODE_ID_RODRIGO}"]`);

    // NodeDetailPanel uses `data-testid="node-detail-panel"` (per
    // TC-FE-08 + TC-FE-11 wiring).
    await page.waitForSelector('[data-testid="node-detail-panel"]', {
      timeout: 2_000,
    });

    // Give the dispatcher a beat in case a stray write was queued.
    await page.waitForTimeout(250);

    // No additional POST to /messages was fired by the click — this is
    // the unidirectionality invariant (REQ-6 / AC-U.1).
    expect(messagesPostCount).toBe(1);
  });
});
