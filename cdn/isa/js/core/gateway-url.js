/** Reescribe URLs de workers directos → base del gateway activo (Config.base). */
export function rewriteViaGateway(url, gatewayBase) {
  if (!url || typeof url !== "string" || !gatewayBase) return url;
  const bases = [
    "https://main-orchestrator.jeffaporta.workers.dev",
    "https://langlab.jeffaporta.workers.dev",
    "https://flsjeff.jeffaporta.workers.dev",
    "https://conversations.jeffaporta.workers.dev",
    "https://iatools.jeffaporta.workers.dev",
    "https://jagudeloe.jeffaporta.workers.dev",
    "https://system-login.jeffaporta.workers.dev",
    "http://localhost:8781",
    "http://localhost:8782",
    "http://localhost:8783",
    "http://localhost:8784",
    "http://localhost:8785",
  ];
  const gw = gatewayBase.replace(/\/$/, "");
  for (const origin of bases) {
    if (url.startsWith(origin + "/") || url === origin) {
      return gw + url.slice(origin.length);
    }
  }
  return url;
}

/** Normaliza item flsjeff (url, display_url, thumb, variants). */
export function rewriteFlsItem(item, gatewayBase) {
  if (!item || typeof item !== "object") return item;
  const rw = (u) => rewriteViaGateway(u, gatewayBase);
  const out = { ...item };
  if (out.url) out.url = rw(out.url);
  if (out.display_url) out.display_url = rw(out.display_url);
  if (out.delete_url) out.delete_url = rw(out.delete_url);
  if (out.thumb?.url) out.thumb = { ...out.thumb, url: rw(out.thumb.url) };
  if (out.small?.url) out.small = { ...out.small, url: rw(out.small.url) };
  if (out.medium?.url) out.medium = { ...out.medium, url: rw(out.medium.url) };
  return out;
}
