import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("../../../../lib/env", () => ({
  getEnv: () => ({
    VITE_BFF_URL: "https://bff.test",
    VITE_NEON_AUTH_URL: "https://auth.test",
  }),
}));

import {
  click,
  flush,
  neverAnswers,
  refusal,
  waitForAlert,
} from "./page-support";
import {
  APOLLO,
  APOSENTADORIA,
  FAILURE_CODE,
  FAILURE_MESSAGE,
  TYPE_NAMES,
  UNNARROWED,
  alertActions,
  alertButton,
  alertMessages,
  lastListing,
  listedNames,
  listItems,
  listingBy,
  listingRequests,
  loadingTexts,
  namesOf,
  namesOnceShown,
  nodesListing,
  openListPage,
  paramsOf,
  prefixField,
  textOnceShown,
  typeChoice,
  typePrefix,
  typesListing,
  typesRequestCount,
  unmountListPages,
  waitForListings,
  waitForTypeChoice,
  type ListPage,
  type Params,
  type TypesAnswer,
} from "./list-support";
import { waitUntil } from "../../api/__tests__/support";

const WAIT_MS = 10_000;
const LOADING_NODES = "Carregando nós…";
const COULD_NOT_LOAD_NODES =
  "Não foi possível carregar os nós. Tente novamente.";
const COULD_NOT_LOAD_TYPES =
  "Não foi possível carregar os tipos de nó. Tente novamente.";
const NO_NODE_FOUND = "Nenhum nó encontrado.";
const TRY_AGAIN = "Tentar novamente";

const NARROWED = [APOLLO, APOSENTADORIA];

afterEach(() => {
  unmountListPages();
  vi.restoreAllMocks();
});

function serverFailure(): Promise<Response> {
  return refusal(500, FAILURE_CODE, FAILURE_MESSAGE);
}

function allTypes(): Promise<Response> {
  return typesListing(TYPE_NAMES);
}

describe("the entity listing while it is fetched, when it fails and when it holds no node", () => {
  it("stands the loading indication Carregando nós… in place of the list while the listing is being fetched", async () => {
    const page = await openListPage({
      nodes: () => neverAnswers(),
      types: allTypes,
    });
    await waitForListings(page, 1);
    await waitForTypeChoice(page);
    expect({
      loading: loadingTexts(page),
      items: listItems(page).length,
      alerts: alertMessages(page),
      noNodeStatement: (page.workspace.textContent ?? "").includes(
        NO_NODE_FOUND,
      ),
    }).toEqual({
      loading: [LOADING_NODES],
      items: 0,
      alerts: [],
      noNodeStatement: false,
    });
  });

  it("shows in place of the list the alert Não foi possível carregar os nós. Tente novamente. with the action Tentar novamente, carrying no code or message of the failure", async () => {
    const page = await openListPage({
      nodes: serverFailure,
      types: allTypes,
    });
    await waitForAlert(page);
    await waitForTypeChoice(page);
    expect({
      alerts: alertMessages(page),
      actions: alertActions(page),
      items: listItems(page).length,
      loading: loadingTexts(page),
    }).toEqual({
      alerts: [COULD_NOT_LOAD_NODES],
      actions: [TRY_AGAIN],
      items: 0,
      loading: [],
    });
  });

  it("fetches the listing again when the action of the failed-listing alert is used", async () => {
    const page = await openListPage({
      nodes: (_url, attempt) =>
        attempt === 1 ? serverFailure() : nodesListing(UNNARROWED),
      types: allTypes,
    });
    await waitForAlert(page);
    await click(alertButton(page));
    await waitForListings(page, 2);
    await flush(40);
    expect(listingRequests(page).map((url) => url.search)).toEqual(["", ""]);
  });

  it("states Nenhum nó encontrado. when the listing holds no node", async () => {
    const page = await openListPage({
      nodes: () => nodesListing([]),
      types: allTypes,
    });
    expect(await textOnceShown(page, NO_NODE_FOUND)).toContain(NO_NODE_FOUND);
  });
});

interface WithoutTypes {
  readonly prefixFieldOffered: boolean;
  readonly listed: readonly string[];
  readonly typeChoiceOffered: boolean;
  readonly loadingIndicated: boolean;
  readonly alerts: readonly string[];
  readonly narrowedListing: readonly string[];
  readonly narrowedParams: Params;
}

async function observeWithoutTypes(
  page: ListPage,
  ready: () => boolean,
): Promise<WithoutTypes> {
  await waitUntil(
    () => listedNames(page).length === UNNARROWED.length && ready(),
    WAIT_MS,
  ).catch(() => undefined);
  const before = {
    prefixFieldOffered: prefixField(page) !== null,
    listed: listedNames(page),
    typeChoiceOffered: typeChoice(page) !== null,
    loadingIndicated: loadingTexts(page).length > 0,
    alerts: alertMessages(page),
  };
  if (!before.prefixFieldOffered) {
    return { ...before, narrowedListing: [], narrowedParams: [] };
  }
  await typePrefix(page, "Apo");
  return {
    ...before,
    narrowedListing: await namesOnceShown(page, namesOf(NARROWED)),
    narrowedParams: paramsOf(lastListing(page)),
  };
}

function openWithTypes(types: TypesAnswer): Promise<ListPage> {
  return openListPage({
    nodes: listingBy({ "Apo|": NARROWED }),
    types,
  });
}

describe("the entity listing while the node types are pending or after they failed", () => {
  it("keeps offering the name prefix and the node listing with no node-type narrowing, stands a loading indication and then the could-not-load-types alert in place of the type choice, and fetches the types again on the alert's action", async () => {
    const pendingPage = await openWithTypes(() => neverAnswers());
    const pending = await observeWithoutTypes(
      pendingPage,
      () => loadingTexts(pendingPage).length > 0,
    );
    unmountListPages();
    vi.restoreAllMocks();

    const failedPage = await openWithTypes((attempt) =>
      attempt === 1 ? serverFailure() : allTypes(),
    );
    const failed = await observeWithoutTypes(
      failedPage,
      () => alertMessages(failedPage).length > 0,
    );
    await click(alertButton(failedPage));
    await waitUntil(() => typesRequestCount(failedPage) >= 2, WAIT_MS).catch(
      () => undefined,
    );
    await flush(40);

    const withoutTypeChoice = {
      prefixFieldOffered: true,
      listed: namesOf(UNNARROWED),
      typeChoiceOffered: false,
      narrowedListing: namesOf(NARROWED),
      narrowedParams: [["name_prefix", "Apo"]],
    };
    expect({
      pending,
      failed,
      typesRequestsAfterTheAction: typesRequestCount(failedPage),
    }).toEqual({
      pending: {
        ...withoutTypeChoice,
        loadingIndicated: true,
        alerts: [],
      },
      failed: {
        ...withoutTypeChoice,
        loadingIndicated: false,
        alerts: [COULD_NOT_LOAD_TYPES],
      },
      typesRequestsAfterTheAction: 2,
    });
  });
});
