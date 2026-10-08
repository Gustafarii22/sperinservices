/* Scoped, versioned offline cache for the web PWA; Android uses bundled assets. */
const CACHE='sperin-certificates-v1-7-15';
const PREFIX='sperin-certificates-v';
const LOCAL=[
  './','./index.html','./styles.css?v=1.7.15',
  './iet-forms.js?v=1.7.15','./app.js?v=1.7.15',
  './manifest.webmanifest','./icon.svg',
  './vendor/jspdf.umd.min.js?v=1.7.15',
  './vendor/jspdf.plugin.autotable.min.js?v=1.7.15'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(LOCAL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith(
    fetch(request).then(response=>{
      if(response.ok){
        const clone=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,clone)).catch(()=>{}));
      }
      return response;
    }).catch(async()=>{
      const cached=await caches.match(request);
      if(cached)return cached;
      // Return the shell only for navigations, never for missing JS, CSS or PDF files.
      if(request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
      return Response.error();
    })
  );
});
