/**
 * Ambient types for Cloudflare Workers backends.
 * Avoids compilerOptions.types = ["@cloudflare/workers-types"], which fails in the IDE
 * when node_modules is not installed. When @cloudflare/workers-types is present,
 * these minimal shapes are compatible with the real bindings used in Personal/apps.
 */

interface Fetcher {
  fetch(input: RequestInfo | URL | Request, init?: RequestInit): Promise<Response>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  props: unknown;
}

interface DurableObject {
  fetch?(request: Request): Response | Promise<Response>;
  alarm?(alarmInfo?: { scheduledTime: number; retryCount: number }): void | Promise<void>;
  webSocketMessage?(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void>;
  webSocketClose?(ws: WebSocket, code: number, reason: string, wasClean: boolean): void | Promise<void>;
  webSocketError?(ws: WebSocket, error: unknown): void | Promise<void>;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
  readonly name?: string;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteAll(): Promise<void>;
}

interface DurableObjectState {
  readonly id: DurableObjectId;
  readonly storage: DurableObjectStorage;
  acceptWebSocket(ws: WebSocket, tags?: string[]): void;
}

interface DurableObjectStub<T extends DurableObject | undefined = undefined> extends Fetcher {
  readonly id: DurableObjectId;
  readonly name?: string;
}

interface DurableObjectNamespace<T extends DurableObject | undefined = undefined> {
  newUniqueId(options?: { jurisdiction?: string }): DurableObjectId;
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub<T>;
}

interface WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

declare const WebSocketPair: {
  new (): WebSocketPair;
};

interface R2Bucket {
  head(key: string): Promise<unknown>;
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<unknown>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: unknown): Promise<unknown>;
}

interface ImagesBinding {
  input(stream: ReadableStream): {
    transform(options: Record<string, unknown>): unknown;
    output(options: Record<string, unknown>): Promise<{ response(): Response }>;
  };
}

interface Ai {
  run(model: string, inputs: unknown, options?: Record<string, unknown>): Promise<unknown>;
}

interface ResponseInit {
  webSocket?: WebSocket;
}
