/**
 * Fuente canónica — copiar a {backend}/src/lib/unit-test.ts
 * Monta GET /unit-test-catalog.json y GET /run-unit-test (SSE).
 */
import type { Context, Env, Hono } from "hono";
import type { UnitTestProtocol } from "./types.js";
import { buildRootUnitTestSummary } from "./catalog-sync.js";
import { runUnitTestStream, sseFromStream } from "./runner.js";

export type MountUnitTestOpts = {
  catalogPath?: string;
  runPath?: string;
  apiPrefix?: string;
  getProtocol: (c: Context) => UnitTestProtocol;
  getOpenApiPaths: (c: Context) => Record<string, Record<string, unknown>>;
};

export function mountUnitTest<E extends Env = Env>(
  app: Hono<E>,
  opts: MountUnitTestOpts,
) {
  const catalogPath = opts.catalogPath ?? "/unit-test-catalog.json";
  const runPath = opts.runPath ?? "/run-unit-test";
  const apiPrefix = opts.apiPrefix ?? "/api";

  app.get(catalogPath, (c) => {
    const protocol = opts.getProtocol(c);
    const summary = buildRootUnitTestSummary(
      protocol,
      opts.getOpenApiPaths(c),
      apiPrefix,
    );
    return c.json({ ok: true, protocol, summary });
  });

  app.get(runPath, async (c) => {
    const origin = new URL(c.req.url).origin;
    const jwt = c.req.header("authorization")?.replace(/^Bearer\s+/i, "") || undefined;
    const protocol = opts.getProtocol(c);
    const stream = runUnitTestStream({
      protocol,
      openApiPaths: opts.getOpenApiPaths(c),
      origin,
      apiPrefix,
      jwt,
    });
    return new Response(sseFromStream(stream), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });
}

export function unitTestRootBlock(
  protocol: UnitTestProtocol,
  openApiPaths: Record<string, Record<string, unknown>>,
  apiPrefix = "/api",
) {
  return buildRootUnitTestSummary(protocol, openApiPaths, apiPrefix);
}
