import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { waitUntil } from "../../features/entities/api/__tests__/support";
import {
  WAIT_MS,
  WORKSPACE,
  buildApp,
  installShellMocks,
  removeShellMocks,
  settle,
  show,
} from "./route-support";

const LIST_PAGE = "../../features/entities/components/EntityListPage";
const FORM_PAGE = "../../features/entities/components/EntityPage";
const LIST_SENTINEL = '[data-testid="entity-list-sentinel"]';
const FORM_SENTINEL = '[data-testid="entity-page-sentinel"]';

const loads = { list: 0, form: 0 };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  loads.list = 0;
  loads.form = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  installShellMocks();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  removeShellMocks([LIST_PAGE, FORM_PAGE]);
});

function countListPageLoads(): void {
  vi.doMock(LIST_PAGE, () => {
    loads.list += 1;
    return {
      EntityListPage: () => <div data-testid="entity-list-sentinel">lista</div>,
    };
  });
}

function countFormPageLoads(): void {
  vi.doMock(FORM_PAGE, () => {
    loads.form += 1;
    return {
      EntityPage: () => <div data-testid="entity-page-sentinel">página</div>,
    };
  });
}

describe("/entities route", () => {
  it("redirects a visit without a session to /sign-in instead of showing the listing", async () => {
    const { router } = await buildApp("/entities", false);
    await router.load();
    expect(router.state.location.pathname).toBe("/sign-in");
  });

  it("renders the listing in the workspace of the application shell for a visit with a session", async () => {
    countListPageLoads();
    const { element } = await buildApp("/entities", true);
    await show(root, element);
    await waitUntil(
      () => container.querySelector(LIST_SENTINEL) !== null,
      WAIT_MS,
    );
    expect(
      container.querySelector(`${WORKSPACE} ${LIST_SENTINEL}`),
    ).not.toBeNull();
  });

  it("does not fetch the listing page's code with the initial load of the application", async () => {
    countListPageLoads();
    const { element } = await buildApp("/graph", true);
    await show(root, element);
    await waitUntil(
      () => container.querySelector('[data-testid="graph-page"]') !== null,
      WAIT_MS,
    );
    await settle(100);
    expect(loads.list).toBe(0);
  });

  it("does not fetch the listing page's code when its address is preloaded", async () => {
    countListPageLoads();
    const { router } = await buildApp("/graph", true);
    await router.load();
    await router.preloadRoute({ to: "/entities" });
    await settle(100);
    expect(loads.list).toBe(0);
  });
});

describe("the entity workspace's two addresses", () => {
  it("fetch the code of each page only when its address is first opened, never with the initial load or a preload, and open the listing at /entities and the form at /entities/{identity}", async () => {
    countListPageLoads();
    countFormPageLoads();
    const { router, element } = await buildApp("/graph", true);
    await show(root, element);
    await waitUntil(
      () => container.querySelector('[data-testid="graph-page"]') !== null,
      WAIT_MS,
    );
    await settle(100);
    const afterStart = { ...loads };

    await router.preloadRoute({ to: "/entities" });
    await router.preloadRoute({
      to: "/entities/$nodeId",
      params: { nodeId: "n-1" },
    });
    await settle(100);
    const afterPreload = { ...loads };

    await act(async () => {
      await router.navigate({ to: "/entities" });
    });
    await waitUntil(
      () => container.querySelector(`${WORKSPACE} ${LIST_SENTINEL}`) !== null,
      WAIT_MS,
    ).catch(() => undefined);
    const afterListing = {
      ...loads,
      path: router.state.location.pathname,
      listingShown: container.querySelector(LIST_SENTINEL) !== null,
    };

    await act(async () => {
      await router.navigate({
        to: "/entities/$nodeId",
        params: { nodeId: "n-1" },
      });
    });
    await waitUntil(
      () => container.querySelector(`${WORKSPACE} ${FORM_SENTINEL}`) !== null,
      WAIT_MS,
    ).catch(() => undefined);
    const afterForm = {
      ...loads,
      path: router.state.location.pathname,
      formShown: container.querySelector(FORM_SENTINEL) !== null,
    };

    expect({ afterStart, afterPreload, afterListing, afterForm }).toEqual({
      afterStart: { list: 0, form: 0 },
      afterPreload: { list: 0, form: 0 },
      afterListing: {
        list: 1,
        form: 0,
        path: "/entities",
        listingShown: true,
      },
      afterForm: {
        list: 1,
        form: 1,
        path: "/entities/n-1",
        formShown: true,
      },
    });
  });
});
