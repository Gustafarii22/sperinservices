/* Local-first certificate UI cache; never cache customer handovers or API data. */
const CACHE="sperin-certificates-section-pages-20261114-1";
const SHELL=[
 "./","./index.html","./styles.css?v=2026.11.14.1",
 "./vendor/jspdf.umd.min.js?v=2026.11.14.1",
 "./vendor/jspdf.plugin.autotable.min.js?v=2026.11.14.1",
 "./iet-forms.js?v=2026.11.14.1","./scan-core.js?v=2026.11.14.1",
 "./board-scan.js?v=2026.11.14.1",
 "./team-workspace.js?v=2026.11.14.1","./ai-assistance.js?v=2026.11.14.1",
 "./instrument-import.js?v=2026.11.14.1","./vendor/qrcode.min.js?v=2026.11.14.1",
 "./job-centre.js?v=2026.11.14.1","./speed-suite.js?v=2026.11.14.1",
 "./live-editing.js?v=2026.11.14.1","./certificate-view.js?v=2026.11.14.1","./app.js?v=2026.11.14.1",
 "./pdf-edit-map.js?v=2026.11.14.1","./vendor/pdf.min.mjs","./vendor/pdf.worker.min.mjs",
 "./manifest.webmanifest","./icon.svg"
];
self.addEventListener("install",e=>e.waitUntil(
 caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())
));
self.addEventListener("activate",e=>e.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("sperin-certificates-")&&k!==CACHE).map(k=>caches.delete(k))))
 .then(()=>self.clients.claim())
));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const url=new URL(e.request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;
 if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 e.respondWith(fetch(e.request).then(response=>{
   if(response.ok&&response.type==="basic")caches.open(CACHE).then(cache=>cache.put(e.request,response.clone())).catch(()=>{});
   return response;
 }).catch(()=>caches.match(e.request).then(hit=>hit||(
   e.request.mode==="navigate"?caches.match("./index.html"):Response.error()
 ))));
});
