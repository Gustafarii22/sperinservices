(async () => {
  try {
    const x = [0, 1, 2, 3].map((i) => window[`__SPERIN_APP_GZ_B64_${i}`] || "").join("");
    if (!x) throw new Error("Certificate payload missing");
    const b = atob(x),
      u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    let t = "";
    if ("DecompressionStream" in window) {
      const ds = new DecompressionStream("gzip");
      t = await new Response(new Blob([u]).stream().pipeThrough(ds)).text();
    } else if (window.pako && typeof window.pako.ungzip === "function") {
      t = window.pako.ungzip(u, { to: "string" });
    } else {
      throw new Error("No gzip decoder available");
    }
    (0, eval)(t);
  } catch (e) {
    console.error("Sperin Certificates startup failed:", e);
    document.getElementById("app").innerHTML =
      '<div style="max-width:720px;margin:40px auto;padding:24px;color:#fff;font-family:system-ui"><h1>Sperin Certificates</h1><p>The application could not start. Please install the latest Sperin Certificates build.</p><pre style="white-space:pre-wrap;color:#8fb7e6;font-size:12px">' +
      String((e && e.message) || e) +
      "</pre></div>";
  }
})();
