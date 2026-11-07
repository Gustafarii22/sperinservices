/* Local-first certificate UI cache; never cache customer handovers or API data. */
const CACHE="sperin-certificates-v1-9-9-exact-pdf";
const SHELL=[
 "./","./index.html","./styles.css?v=1.9.9",
 "./vendor/jspdf.umd.min.js?v=1.9.9",
 "./vendor/jspdf.plugin.autotable.min.js?v=1.9.9",
 "./iet-forms.js?v=1.9.9","./scan-core.js?v=1.9.9",
 "./board-scan.js?v=1.9.9",
 "./team-workspace.js?v=1.9.9","./ai-assistance.js?v=1.9.9",
 "./instrument-import.js?v=1.9.9","./vendor/qrcode.min.js?v=1.9.9",
 "./job-centre.js?v=1.9.9","./speed-suite.js?v=1.9.9",
 "./live-editing.js?v=1.9.9","./certificate-view.js?v=1.9.9","./app.js?v=1.9.9",
 "./pdf-edit-map.js?v=1.9.9","./vendor/pdf.min.mjs","./vendor/pdf.worker.min.mjs",
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
