import type { UnitTestProtocol, UnitTestStreamEvent, UnitTestStep } from "./types.js";
import { buildRootUnitTestSummary, contextMarkdown } from "./catalog-sync.js";

export type RunUnitTestOpts = {
  protocol: UnitTestProtocol;
  openApiPaths: Record<string, Record<string, unknown>>;
  origin: string;
  apiPrefix?: string;
  /** Bearer JWT para pasos skipUnless jwt */
  jwt?: string;
  /** Ejecutor HTTP (inyectable en tests) */
  fetchFn?: typeof fetch;
};

function interpolate(template: unknown, vars: Record<string, string>): unknown {
  if (typeof template === "string") {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
  }
  if (Array.isArray(template)) return template.map((v) => interpolate(v, vars));
  if (template && typeof template === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template as Record<string, unknown>)) {
      o[k] = interpolate(v, vars);
    }
    return o;
  }
  return template;
}

function stepMarkdown(
  step: UnitTestStep,
  pathLabel: string,
  ok: boolean,
  detail: string,
): string {
  const icon = ok ? "✅" : "❌";
  return `${icon} **${step.nombre}** — \`${pathLabel}\`\n\n${detail}`;
}

function isInfraUnavailable(status: number, bodyText: string): boolean {
  if (status !== 500 && status !== 503) return false;
  return /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|getaddrinfo|Failed to connect to|login timeout|socket hang up/i.test(
    bodyText,
  );
}

export async function* runUnitTestStream(opts: RunUnitTestOpts): AsyncGenerator<UnitTestStreamEvent> {
  const { protocol, openApiPaths, origin, apiPrefix = "/api", jwt } = opts;
  const fetchFn = opts.fetchFn ?? fetch;
  const base = origin.replace(/\/$/, "");
  const summary = buildRootUnitTestSummary(protocol, openApiPaths, apiPrefix);

  yield { type: "context", md: contextMarkdown(protocol, summary, { jwt: !!jwt }) };

  const pathById = new Map(protocol.paths.map((p) => [p.id, p]));
  const vars: Record<string, string> = {
    TEST_USER: protocol.testIds.user,
    TEST_CONV: String(protocol.testIds.conversation),
    TEST_TICKET: protocol.testIds.ticket,
    TEST_ENTITY: protocol.testIds.entity,
  };

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const sequence = protocol.sequences[0];
  if (!sequence) {
    yield { type: "error", md: "No hay secuencias definidas en el protocolo." };
    yield { type: "summary", md: "Sin secuencias.", ok: false, passed: 0, failed: 1, skipped: 0 };
    return;
  }

  for (const step of sequence.steps) {
    const entry = pathById.get(step.pathId);
    if (!entry) {
      failed++;
      yield {
        type: "step",
        stepId: step.id,
        ok: false,
        md: stepMarkdown(step, step.pathId, false, "Path no encontrado en catálogo."),
      };
      continue;
    }

    if (entry.omit) {
      skipped++;
      yield {
        type: "step",
        stepId: step.id,
        ok: true,
        md: `⏭️ **${step.nombre}** — omitido (${entry.omitReason || entry.omit})`,
      };
      continue;
    }

    if (step.skipUnless === "jwt" && !jwt) {
      skipped++;
      yield {
        type: "step",
        stepId: step.id,
        ok: true,
        md: `⏭️ **${step.nombre}** — requiere JWT (inicia sesión en el front).`,
      };
      continue;
    }

    const pathResolved = entry.path
      .replace(/\{id\}/g, vars.TEST_CONV)
      .replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
    const url = `${base}${pathResolved.startsWith("/") ? pathResolved : `/${pathResolved}`}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(step.headers || {}),
    };
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
    const method = entry.method.toUpperCase();
    const body =
      step.body && method !== "GET" && method !== "HEAD"
        ? JSON.stringify(interpolate(step.body, vars))
        : undefined;
    if (body) headers["Content-Type"] = "application/json";

    let res: Response;
    try {
      res = await fetchFn(url, { method, headers, body });
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      yield {
        type: "step",
        stepId: step.id,
        ok: false,
        md: stepMarkdown(step, `${method} ${entry.path}`, false, `Error de red: ${msg}`),
      };
      continue;
    }

    const expect = step.expectStatus || [200, 201, 204];
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      /* ignore */
    }

    if (isInfraUnavailable(res.status, bodyText)) {
      skipped++;
      yield {
        type: "step",
        stepId: step.id,
        ok: true,
        md: `⏭️ **${step.nombre}** — \`${method} ${entry.path}\`\n\nMSSQL/red no disponible (VPN o servidor). No es fallo de JWT.\n\n\`\`\`json\n${bodyText.slice(0, 380)}\n\`\`\``,
      };
      continue;
    }

    const ok = expect.includes(res.status);
    if (ok) passed++;
    else failed++;

    let detail = `HTTP **${res.status}** (esperado: ${expect.join("|")})`;
    try {
      if (bodyText && bodyText.length < 400) detail += `\n\n\`\`\`json\n${bodyText}\n\`\`\``;
      else if (bodyText) detail += `\n\n_${bodyText.length} bytes de respuesta_`;
      if (step.extract && bodyText) {
        const json = JSON.parse(bodyText) as Record<string, unknown>;
        for (const [varName, jsonKey] of Object.entries(step.extract)) {
          const val = json[jsonKey];
          if (val != null) vars[varName] = String(val);
        }
      }
    } catch {
      /* body no json */
    }

    yield {
      type: "step",
      stepId: step.id,
      ok,
      md: stepMarkdown(step, `${method} ${entry.path}`, ok, detail),
    };
  }

  const allOk = failed === 0;
  yield {
    type: "summary",
    md: [
      "## Resumen",
      "",
      allOk
        ? skipped > 0
          ? "✅ **Sin fallos funcionales** (algunos pasos omitidos por infraestructura)."
          : "✅ **Todos los pasos OK**"
        : "❌ **Hay fallos**",
      "",
      `- Pasaron: **${passed}**`,
      `- Fallaron: **${failed}**`,
      `- Omitidos: **${skipped}**`,
    ].join("\n"),
    ok: allOk,
    passed,
    failed,
    skipped,
  };
}

export function sseFromStream(events: AsyncIterable<UnitTestStreamEvent>): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of events) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          enc.encode(`data: ${JSON.stringify({ type: "error", md: msg })}\n\n`),
        );
      }
      controller.close();
    },
  });
}
