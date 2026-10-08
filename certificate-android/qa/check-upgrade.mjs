// Read-only Android CDP check after a signed in-place APK upgrade.
// Never seed or mutate data here: the old APK was already seeded separately.
const prefix =
  process.env.CERT_UPGRADE_URL_PREFIX || "https://sperinservices.co.uk/certificates-app/";
let target;
for (let attempt = 0; attempt < 45; attempt++) {
  try {
    const pages = await (await fetch("http://127.0.0.1:9222/json/list")).json();
    target = pages.find((page) => page.type === "page" && page.url.startsWith(prefix));
    if (target) break;
  } catch {
    // Devtools remote socket may still be starting.
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
if (!target) throw new Error("Upgraded APK did not expose the certificate WebView origin");
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const reply = JSON.parse(event.data);
  const item = pending.get(reply.id);
  if (!item) return;
  pending.delete(reply.id);
  clearTimeout(item.timer);
  if (reply.error) item.reject(new Error(JSON.stringify(reply.error)));
  else item.resolve(reply.result);
});
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
let last = null;
try {
  await command("Runtime.enable");
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await command("Runtime.evaluate", {
      expression: `(() => {
        const raw=localStorage.getItem("sperin-certificates-data-v1");
        let data=null;
        try { data=raw?JSON.parse(raw):null; } catch {}
        return JSON.stringify({
          origin:location.origin,
          path:location.pathname,
          hasStorage:!!raw,
          certificateIds:Array.isArray(data?.certificates)
            ? data.certificates.map(c=>c?.id).slice(0,15) : [],
          savedCount:Array.isArray(data?.certificates)?data.certificates.length:null,
          visible:document.body?.innerText.includes("Upgrade preservation check")===true
        });
      })()`,
      returnByValue: true,
    });
    const value = response?.result?.value;
    if (value) last = JSON.parse(value);
    if (last?.certificateIds?.includes("upgrade-check") && last.visible) {
      console.log("UPGRADED_WEBVIEW_STORAGE_PRESERVED " + JSON.stringify(last));
      process.exitCode = 0;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!last?.certificateIds?.includes("upgrade-check") || !last.visible) {
    console.error("UPGRADED_WEBVIEW_STORAGE_CHECK_FAILED " + JSON.stringify(last));
    process.exitCode = 1;
  }
} finally {
  socket.close();
}
