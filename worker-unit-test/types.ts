/** Catálogo y protocolo de tests unitarios por worker (sincronizado con GET /). */

export const TEST_IDS = {
  user: "ZZZZZZZZZTEST",
  conversation: 99999990,
  ticket: "TK-99999990",
  entity: "ZZZZZZZZZTEST",
} as const;

export type OmitKind = "health" | "options" | "meta" | "docs" | "websocket";

export type UnitTestPathEntry = {
  id: string;
  method: string;
  path: string;
  nombre: string;
  descripcion: string;
  omit?: OmitKind;
  omitReason?: string;
};

export type UnitTestStep = {
  id: string;
  pathId: string;
  nombre: string;
  /** Cuerpo JSON (placeholders {{TEST_USER}} etc.) */
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  expectStatus?: number[];
  extract?: Record<string, string>;
  skipUnless?: "jwt";
};

export type UnitTestSequence = {
  id: string;
  nombre: string;
  descripcion: string;
  steps: UnitTestStep[];
};

export type UnitTestProtocol = {
  service: string;
  serviceName: string;
  version: string;
  testIds: typeof TEST_IDS;
  paths: UnitTestPathEntry[];
  sequences: UnitTestSequence[];
};

export type UnitTestStreamEvent =
  | { type: "context"; md: string }
  | { type: "step"; md: string; stepId: string; ok: boolean }
  | { type: "summary"; md: string; ok: boolean; passed: number; failed: number; skipped: number }
  | { type: "error"; md: string };

export type UnitTestRootSummary = {
  run: string;
  catalog: string;
  pathCount: number;
  testableCount: number;
  omitCount: number;
  sequenceCount: number;
  inSync: boolean;
  missingInCatalog: string[];
  extraInCatalog: string[];
};
