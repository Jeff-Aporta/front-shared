/**
 * Penalización de login — parseo de respuesta API y cuenta regresiva en vivo.
 * El worker devuelve retryAfterSeconds + retryUntil (LOCKEDUNTIL del servidor).
 */

export function parseRetryAfterHeader(res) {
  const raw = res?.headers?.get?.("Retry-After");
  if (!raw) return 0;
  const n = parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Extrae penalización de cuerpo JSON y cabecera Retry-After. */
export function parseLoginPenaltyPayload(res, data = {}) {
  const fromBody = Number(data.retryAfterSeconds);
  const retryAfterSeconds = (Number.isFinite(fromBody) && fromBody > 0)
    ? Math.ceil(fromBody)
    : parseRetryAfterHeader(res);
  const retryUntil = data.retryUntil || data.penaltyUntil || data.lockedUntil || null;
  return {
    retryAfterSeconds: retryAfterSeconds > 0 ? retryAfterSeconds : 0,
    retryUntil: retryUntil ? String(retryUntil) : null,
  };
}

/** Normaliza a estado con deadline ISO para countdown estable (servidor o cliente). */
export function capturePenaltyState(input) {
  if (!input) return null;
  const retryUntil = input.retryUntil || input.lockedUntil || null;
  const retryAfterSeconds = Number(input.retryAfterSeconds) || 0;
  let deadlineMs = 0;
  if (retryUntil) {
    const t = new Date(retryUntil).getTime();
    if (Number.isFinite(t)) deadlineMs = t;
  }
  if (!deadlineMs && retryAfterSeconds > 0) {
    deadlineMs = Date.now() + retryAfterSeconds * 1000;
  }
  if (!deadlineMs || deadlineMs <= Date.now()) return null;
  const secondsLeft = Math.ceil((deadlineMs - Date.now()) / 1000);
  return {
    retryUntil: new Date(deadlineMs).toISOString(),
    retryAfterSeconds: secondsLeft,
    initialRetryAfterSeconds: secondsLeft,
  };
}

export function remainingPenaltySeconds(penalty) {
  const state = capturePenaltyState(penalty);
  return state?.retryAfterSeconds ?? 0;
}

export function formatLoginPenaltySuffix(seconds) {
  const s = Math.max(0, Math.ceil(Number(seconds) || 0));
  if (!s) return "";
  return ` — reintenta en ${s} s`;
}

export function formatLoginPenaltyMessage(errText, seconds) {
  const base = String(errText || "").trim();
  const suffix = formatLoginPenaltySuffix(seconds);
  if (!base) return suffix.trim().replace(/^ — /, "");
  if (!suffix) return base;
  return base + suffix;
}

/** Adjunta retryAfterSeconds, retryUntil y penalty al Error de login. */
export function applyLoginPenaltyToError(err, res, data = {}) {
  const payload = parseLoginPenaltyPayload(res, data);
  const penalty = capturePenaltyState(payload);
  if (payload.retryAfterSeconds) err.retryAfterSeconds = payload.retryAfterSeconds;
  if (payload.retryUntil) err.retryUntil = payload.retryUntil;
  if (penalty) err.penalty = penalty;
  return err;
}

export function penaltyBlocksSubmit(penalty) {
  return remainingPenaltySeconds(penalty) > 0;
}

/** Hook: cuenta regresiva 1 s; progress 0–100 para barra. */
export function createUseLoginPenaltyCountdown(React) {
  return function useLoginPenaltyCountdown(penalty) {
    const [state, setState] = React.useState(() => capturePenaltyState(penalty));

    React.useEffect(() => {
      setState(capturePenaltyState(penalty));
    }, [penalty?.retryUntil, penalty?.retryAfterSeconds, penalty?.initialRetryAfterSeconds]);

    const [secondsLeft, setSecondsLeft] = React.useState(() => remainingPenaltySeconds(state));
    const [progress, setProgress] = React.useState(() => {
      const init = state?.initialRetryAfterSeconds || state?.retryAfterSeconds || 0;
      return init > 0 ? 100 : 0;
    });

    React.useEffect(() => {
      const captured = capturePenaltyState(state);
      if (!captured) {
        setSecondsLeft(0);
        setProgress(0);
        return undefined;
      }
      const total = captured.initialRetryAfterSeconds || captured.retryAfterSeconds || 1;
      const tick = () => {
        const left = remainingPenaltySeconds(captured);
        setSecondsLeft(left);
        setProgress(total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0);
        return left;
      };
      tick();
      const id = setInterval(() => {
        if (tick() <= 0) clearInterval(id);
      }, 1000);
      return () => clearInterval(id);
    }, [state?.retryUntil, state?.initialRetryAfterSeconds]);

    const active = secondsLeft > 0;
    return { secondsLeft, active, progress, penalty: state };
  };
}

/** Alert MUI con mensaje + segundos en vivo y barra de progreso. */
export function createLoginPenaltyAlert(React, MUI) {
  const useLoginPenaltyCountdown = createUseLoginPenaltyCountdown(React);
  const { Alert, LinearProgress, Box } = MUI;

  return function LoginPenaltyAlert({ err, penalty, severity = "error" }) {
    const { secondsLeft, active, progress } = useLoginPenaltyCountdown(penalty);
    if (!err) return null;
    const base = String(err).trim();
    const content = active
      ? React.createElement(
        React.Fragment,
        null,
        base,
        " — reintenta en ",
        React.createElement("span", { className: "isa-login-penalty-countdown" }, String(secondsLeft)),
        " s",
      )
      : base;
    return React.createElement(
      Alert,
      {
        severity,
        className: "isa-login-penalty-alert",
        sx: { "& .isa-login-penalty-countdown": { fontVariantNumeric: "tabular-nums", fontWeight: 700, display: "inline-block", minWidth: "1.5ch", textAlign: "center" } },
      },
      React.createElement(Box, { component: "span" }, content),
      active
        ? React.createElement(LinearProgress, {
          variant: "determinate",
          value: progress,
          sx: { mt: 1, height: 4, borderRadius: 2 },
          "aria-hidden": true,
        })
        : null,
    );
  };
}
