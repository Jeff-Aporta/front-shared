/** Evento global: `window.addEventListener("isa:realtime", (e) => e.detail)` */
export const REALTIME_EVENT = "isa:realtime";

/** Tipos de mensaje realtime del orquestador (Jeff-Aporta). */
export const REALTIME = {
  CHECKS_UPDATED: "checks.updated",
};

/** http(s)://host → wss://host/api/ws */
export function wsUrlFromHttpBase(httpBase) {
  const base = String(httpBase || "").replace(/\/$/, "");
  if (!base) return "";
  if (base.startsWith("https://")) return "wss://" + base.slice(8) + "/api/ws";
  if (base.startsWith("http://")) return "ws://" + base.slice(7) + "/api/ws";
  if (base.startsWith("wss://") || base.startsWith("ws://")) {
    return base.includes("/api/ws") ? base : base.replace(/\/?$/, "") + "/api/ws";
  }
  return "wss://" + base + "/api/ws";
}

/**
 * Cliente WebSocket con reconexión exponencial.
 * @param {{ getUrl: () => string, onMessage?: (data: unknown) => void, onStatus?: (status: string) => void, enabled?: () => boolean }} opts
 */
export function createRealtime(opts = {}) {
  const getUrl = opts.getUrl || (() => "");
  const onMessage = opts.onMessage;
  const onStatus = opts.onStatus;
  const enabled = opts.enabled || (() => true);

  /** @type {WebSocket | null} */
  let socket = null;
  let stopped = false;
  let attempt = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  function setStatus(status) {
    if (onStatus) onStatus(status);
  }

  function scheduleReconnect() {
    if (stopped || !enabled()) return;
    const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
    attempt += 1;
    setStatus("reconnecting");
    timer = setTimeout(connect, delay);
  }

  function connect() {
    if (stopped || !enabled()) {
      setStatus("disconnected");
      return;
    }
    const url = getUrl();
    if (!url) {
      setStatus("disconnected");
      return;
    }
    try {
      setStatus("connecting");
      socket = new WebSocket(url);
    } catch {
      setStatus("error");
      scheduleReconnect();
      return;
    }

    socket.addEventListener("open", () => {
      attempt = 0;
      setStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      let data = event.data;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        /* texto plano */
      }
      if (onMessage) onMessage(data);
      try {
        window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: data }));
      } catch {
        /* ignore */
      }
    });

    socket.addEventListener("close", () => {
      socket = null;
      if (!stopped) scheduleReconnect();
      else setStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setStatus("error");
    });
  }

  function disconnect() {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
    if (socket) {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      socket = null;
    }
    setStatus("disconnected");
  }

  function start() {
    stopped = false;
    attempt = 0;
    connect();
  }

  function ping() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));
    }
  }

  return { start, disconnect, ping, getStatus: () => (socket && socket.readyState === WebSocket.OPEN ? "connected" : "disconnected") };
}

export function registerRealtime(ns, opts = {}) {
  const getBase = opts.getBase || (() => {
    const cfg = window[ns] && window[ns].Config;
    return cfg && cfg.base ? cfg.base() : "";
  });
  const enabled = opts.enabled || (() => true);
  const rt = createRealtime({
    getUrl: () => wsUrlFromHttpBase(getBase()),
    enabled,
    onMessage: opts.onMessage,
    onStatus: opts.onStatus,
  });
  window[ns].Realtime = rt;
  if (opts.autoStart !== false) rt.start();
  return rt;
}
