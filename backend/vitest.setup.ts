// Test-only polyfill for the MCP SDK transport under Fastify's `inject()`.
//
// The MCP SDK's StreamableHTTPServerTransport bridges to Node HTTP via
// `@hono/node-server`, whose request-drain safety net schedules
// `setTimeout(forceClose, …)` and, if the request stream never emits `end`
// (which is the case under light-my-request's mock streams), eventually calls
// `incoming.socket.destroySoon()`. light-my-request's `MockSocket` is a bare
// `EventEmitter` with no `destroySoon`, so that (otherwise harmless, `.unref()`'d)
// timer throws an uncaught `TypeError` and pollutes the run. Real Node sockets
// implement `destroySoon`, so PRODUCTION is unaffected — this is purely a
// mock-socket gap in the test harness.
//
// We patch `MockSocket.prototype.destroySoon` to a safe no-op. The class is not
// exported, so we obtain an instance via a throwaway `inject` and patch its
// prototype once, before any suite runs.

import { inject } from "light-my-request";

const probe = await inject(
  (_req, res) => {
    res.end("ok");
  },
  { method: "GET", url: "/" }
);

const socket = (probe.raw.req as unknown as { socket?: object }).socket;
if (socket) {
  const proto = Object.getPrototypeOf(socket) as {
    destroySoon?: () => void;
    destroy?: () => void;
  };
  if (typeof proto.destroySoon !== "function") {
    proto.destroySoon = function destroySoon(this: { destroy?: () => void }) {
      this.destroy?.();
    };
  }
}
