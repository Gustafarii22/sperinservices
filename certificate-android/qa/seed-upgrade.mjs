// Seed the OLD debuggable release through its WebView, then verify the signed update retains it.
import { chromium } from "playwright";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];
if (!page) throw new Error("Old APK WebView not available");
const url = page.url();
if (!url.startsWith("https://sperinservices.co.uk/certificates-app/"))
  throw new Error("Wrong storage origin: " + url);
await page.addInitScript(() => {
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
});
await page.reload();
await page.getByText("Upgrade preservation check", { exact: false }).first().waitFor();
await browser.close();
console.log("OLD_APK_DATA_SEEDED");
