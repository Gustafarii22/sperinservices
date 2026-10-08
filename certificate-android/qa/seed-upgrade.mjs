// Android WebView exposes the page CDP endpoint but not desktop browser-context APIs.
const prefix =
  process.env.CERT_UPGRADE_URL_PREFIX || "https://sperinservices.co.uk/certificates-app/";
let target;
for (let attempt = 0; attempt < 30; attempt++) {
  const pages = await (await fetch("http://127.0.0.1:9222/json/list")).json();
  target = pages.find((p) => p.type === "page" && p.url.startsWith(prefix));
  if (target) break;
  await new Promise((resolve) => setTimeout(resolve, 500));
}
if (!target) throw new Error("Old APK did not expose the stable certificate storage origin");
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
const seed = () => {
  if (sessionStorage.upgradeFixture) return;
  localStorage.setItem(
    "sperin-certificates-data-v1",
    JSON.stringify({
      certificates: [
        {
          id: "upgrade-check",
          type: "eic",
          number: "UPGRADE-QA",
          status: "Draft",
          fields: { clientName: "Upgrade preservation check", nominalVoltage: "230" },
          tables: {
            boards: [{ ref: "CU1", zdb: "0.18", spd: "Type 2" }],
            circuits: [{ boardRef: "CU1", circuitNo: 0, description: "Preserved incoming" }],
            tests: [{ boardRef: "CU1", circuitNo: 0, zs: "0.42" }],
          },
        },
      ],
    }),
  );
  localStorage.removeItem("sperin-certificates-view-v1");
  sessionStorage.upgradeFixture = "1";
};
await command("Page.enable");
await command("Page.addScriptToEvaluateOnNewDocument", { source: "(" + seed.toString() + ")()" });
await command("Page.reload", { ignoreCache: true });
let verified = false;
for (let attempt = 0; attempt < 60; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const result = await command("Runtime.evaluate", {
    expression: 'document.body?.innerText.includes("Upgrade preservation check")',
    returnByValue: true,
  });
  if (result.result?.value === true) {
    verified = true;
    break;
  }
}
socket.close();
if (!verified) throw new Error("Old APK did not display the saved upgrade fixture");
console.log("OLD_APK_DATA_SEEDED");
