/* Local-first certificate UI cache; never cache customer handovers or API data. */
const CACHE="sperin-certificates-v1-9-3-team";
const SHELL=[
 "./","./index.html","./styles.css?v=1.8.6",
 "./vendor/jspdf.umd.min.js?v=1.8.6",
 "./vendor/jspdf.plugin.autotable.min.js?v=1.8.6",
 "./iet-forms.js?v=1.8.6","./scan-core.js?v=1.8.6",
 "./board-scan.js?v=1.8.6-scanfix1",
 "./team-workspace.js?v=1.9.0","./ai-assistance.js?v=1.9.0",
 "./instrument-import.js?v=1.9.0","./vendor/qrcode.min.js?v=1.9.1",
 "./job-centre.js?v=1.9.1","./speed-suite.js?v=1.9.2",
 "./live-editing.js?v=1.9.3","./app.js?v=1.9.2",
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
