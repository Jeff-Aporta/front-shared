import { bootHelperUrl, demoAppUrl } from "./cdn.mjs";

async function boot() {
  if (new URLSearchParams(location.search).has("isa_boot_hold")) return;

  const { importShared, assertStack, loadIsaFront, loadSharedUi } = await import(bootHelperUrl);

  const stackMod = await importShared("stack.mjs");
  await stackMod.stackReady;
  assertStack();

  const Babel = globalThis.Babel;
  if (!Babel?.transform) throw new Error("Babel standalone no cargó");

  await loadIsaFront();
  await loadSharedUi(Babel);

  window.ISAFront.registerApp({
    ns: "ISA",
    app: "front-shared-demo",
    theme: true,
    session: false,
    auth: false,
    toast: true,
    feedback: true,
  });

  await import(demoAppUrl());
}

boot().catch((err) => {
  const root = document.getElementById("root");
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  if (root) {
    root.innerHTML = `<pre style="color:#ff8a80;padding:24px;font-family:monospace">Error de arranque:\n${msg}</pre>`;
  }
  console.error(err);
});
