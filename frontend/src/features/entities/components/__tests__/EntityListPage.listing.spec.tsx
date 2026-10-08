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

import { click } from "./page-support";
import {
  APOLLO,
  APOSENTADORIA,
  MOON,
  TYPE_NAMES,
  UNNARROWED,
  ZEUS,
  lastListing,
  linkNamed,
  listItems,
  listingBy,
  namesOf,
  namesOnceShown,
  nodesListing,
  offeredTypeLabels,
  openListPage,
  paramsOf,
  pickAllTypes,
  pickType,
  typePrefix,
  typesListing,
  unmountListPages,
  waitForItems,
  waitForListings,
  waitForTypeChoice,
  type ListedFixture,
  type ListPage,
  type NodesAnswer,
} from "./list-support";
import { waitUntil } from "../../api/__tests__/support";

const WAIT_MS = 10_000;

afterEach(() => {
  unmountListPages();
  vi.restoreAllMocks();
});

async function openReady(nodes: NodesAnswer): Promise<ListPage> {
  const page = await openListPage({
    nodes,
    types: () => typesListing(TYPE_NAMES),
  });
  await waitForItems(page, UNNARROWED.length);
  await waitForTypeChoice(page);
  return page;
}

describe("each node of the entity listing", () => {
  it.each([
    { label: "name", field: (node: ListedFixture) => node.name },
    { label: "node type", field: (node: ListedFixture) => node.type },
    { label: "status", field: (node: ListedFixture) => node.status },
  ])("shows its $label", async ({ field }) => {
    const page = await openReady(() => nodesListing(UNNARROWED));
    const rows = listItems(page).map((item) => item.textContent ?? "");
    expect(
      UNNARROWED.map((node, index) => (rows[index] ?? "").includes(field(node))),
    ).toEqual(UNNARROWED.map(() => true));
  });
});

describe("the narrowings of the entity listing", () => {
  it("lists the nodes the knowledge base lists for the name prefix the owner types", async () => {
    const answered = [APOLLO, APOSENTADORIA];
    const page = await openReady(listingBy({ "Apo|": answered }));
    await typePrefix(page, "Apo");
    expect(await namesOnceShown(page, namesOf(answered))).toEqual(
      namesOf(answered),
    );
  });

  it("lists the nodes the knowledge base lists for the node type the owner picks", async () => {
    const answered = [APOLLO, ZEUS];
    const page = await openReady(listingBy({ "|Artefato": answered }));
    await pickType(page, "Artefato");
    expect(await namesOnceShown(page, namesOf(answered))).toEqual(
      namesOf(answered),
    );
  });

  it("offers as node types the node types the knowledge base lists", async () => {
    const page = await openReady(() => nodesListing(UNNARROWED));
    const labels = await offeredTypeLabels(page);
    expect({
      listed: labels.filter((label) => TYPE_NAMES.includes(label)),
      others: labels.filter((label) => !TYPE_NAMES.includes(label)).length,
    }).toEqual({ listed: TYPE_NAMES, others: 1 });
  });

  it("narrows by the name prefix and the node type together and opens /entities/{identity} of the node the owner picks", async () => {
    const together = [APOLLO, MOON];
    const page = await openReady(
      listingBy({
        "Apo|": [APOLLO, APOSENTADORIA],
        "|Artefato": [ZEUS],
        "Apo|Artefato": together,
      }),
    );
    await typePrefix(page, "Apo");
    await waitForListings(page, 2);
    await pickType(page, "Artefato");
    const shown = await namesOnceShown(page, namesOf(together));
    await click(linkNamed(page, MOON.name));
    await waitUntil(
      () => page.pathname() === `/entities/${MOON.id}`,
      WAIT_MS,
    ).catch(() => undefined);
    expect({ shown, path: page.pathname() }).toEqual({
      shown: namesOf(together),
      path: `/entities/${MOON.id}`,
    });
  });
});

describe("the requests of the entity listing", () => {
  it("carry the name prefix under name_prefix and the node type by its name under node_type, and carry neither before the owner gives it", async () => {
    const page = await openReady(() => nodesListing(UNNARROWED));
    const none = paramsOf(lastListing(page));
    await pickType(page, "Artefato");
    await waitForListings(page, 2);
    const typeOnly = paramsOf(lastListing(page));
    await typePrefix(page, "Apo");
    await waitForListings(page, 3);
    const both = paramsOf(lastListing(page));
    expect({ none, typeOnly, both }).toEqual({
      none: [],
      typeOnly: [["node_type", "Artefato"]],
      both: [
        ["name_prefix", "Apo"],
        ["node_type", "Artefato"],
      ],
    });
  });

  it("leave out an emptied name prefix and the all-types option instead of sending an empty value or a sentinel", async () => {
    const page = await openReady(() => nodesListing(UNNARROWED));
    await pickType(page, "Artefato");
    await waitForListings(page, 2);
    await typePrefix(page, "Apo");
    await waitForListings(page, 3);
    await pickAllTypes(page, TYPE_NAMES);
    await waitForListings(page, 4);
    const typeEmptied = paramsOf(lastListing(page));
    await pickType(page, "Equipe");
    await waitForListings(page, 5);
    await typePrefix(page, "");
    await waitForListings(page, 6);
    const prefixEmptied = paramsOf(lastListing(page));
    expect({ typeEmptied, prefixEmptied }).toEqual({
      typeEmptied: [["name_prefix", "Apo"]],
      prefixEmptied: [["node_type", "Equipe"]],
    });
  });
});
