import { REALTIME_STATUS_EVENT, realtimeStatusTip, realtimeDotTone } from "../core/realtime.js";

/** UI compartida — indicador de conexión WebSocket del orquestador (CF Realtime). */
export function createRealtimeStatusUI(React, MUI, ns) {
  const { useState, useEffect, useCallback } = React;
  const { Tooltip, IconButton } = MUI;

  function useRealtimeStatus() {
    const [state, setState] = useState("disconnected");

    useEffect(() => {
      const rt = () => window[ns]?.Realtime;
      const sync = () => setState(rt()?.getConnectionStatus?.() || "disconnected");
      sync();

      function onStatus(e) {
        const detail = e.detail || {};
        if (detail.ns && detail.ns !== ns) return;
        setState(detail.status || "disconnected");
      }

      window.addEventListener(REALTIME_STATUS_EVENT, onStatus);
      const id = setInterval(sync, 2000);
      return () => {
        window.removeEventListener(REALTIME_STATUS_EVENT, onStatus);
        clearInterval(id);
      };
    }, []);

    const reconnect = useCallback(() => {
      const rt = window[ns]?.Realtime;
      if (!rt) return;
      rt.disconnect?.();
      rt.start?.();
    }, []);

    return {
      state,
      tip: realtimeStatusTip(state),
      tone: realtimeDotTone(state),
      reconnect,
    };
  }

  function RealtimeStatusDot({ tone, tip, onReconnect }) {
    function onClick(e) {
      e.stopPropagation();
      onReconnect?.();
    }

    return React.createElement(
      Tooltip,
      { title: tip, arrow: true },
      React.createElement(
        IconButton,
        {
          size: "small",
          color: "inherit",
          className: "status-dot-trigger",
          onClick,
          "aria-label": tip,
          sx: { width: 32, height: 32, flexShrink: 0, p: 0 },
        },
        React.createElement("span", {
          className: `status-dot status-dot--inline status-dot--${tone}`,
          "aria-hidden": true,
        }),
      ),
    );
  }

  return { useRealtimeStatus, RealtimeStatusDot };
}

/** Hook/componente seguros cuando la app no registra realtime (evita crash en LoginButton). */
export function createNoopRealtimeStatusUI(React) {
  function useRealtimeStatus() {
    return {
      state: "disconnected",
      tip: "Realtime no configurado",
      tone: "disconnected",
      reconnect: () => {},
    };
  }

  function RealtimeStatusDot() {
    return null;
  }

  return { useRealtimeStatus, RealtimeStatusDot };
}
