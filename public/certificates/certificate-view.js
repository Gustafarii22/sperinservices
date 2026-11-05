/* Sperin Certificates v1.9.6: editable certificate-sheet workspace.
   The same cert.fields and cert.tables objects drive Quick Entry, this view and PDFs.
   Rendering is entirely offline; no photo or certificate data is uploaded here. */
(()=>{'use strict';
 const E= v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const LANDSCAPE_TYPES=new Set(['eic','eicr']);
 const METHOD={A1:'Single-core in conduit within insulated wall',A2:'Multicore in conduit within insulated wall',B:'Conduit/trunking on wall',C:'Clipped direct',D1:'In underground duct',D2:'Direct buried',E:'Multicore in free air',F:'Single-core touching, free air',G:'Single-core spaced, free air',100:'Above insulated ceiling, up to 100 mm',101:'Above insulated ceiling, over 100 mm',102:'Inside insulated stud wall, touching inner face',103:'Inside insulated stud wall, not touching inner face'};
 const isLandscape=type=>LANDSCAPE_TYPES.has(type);
 const persisted={page:0,zoom:1,showPages:false,fitMode:true};
 // The issued PDF renderer is the page-count authority; no artificial editor-only pages.
 const activePaperDimensions={landscape:[1122,794],portrait:[794,1122]};
 const rowsPerPage=12;
 function fieldInput(scope,key,value,field={},row=-1,kind=''){
   const id='cv-'+scope+'-'+row+'-'+key;
   const label=String(field.label||key),numeric=/^(zs|ze|zdb|ipf|r1|r2|rn|r1r2|r2only|irLL|irLE|irVoltage|rcdTime|rcdIdn|rcdRating|ocpdRating|breakingCapacity|maxZs|circuitNo|points|cpcCsa|liveCsa|mainRcdIdn|nominalVoltage|frequency|poleCount|mainSwitchCurrent)$/i.test(key);
   const text=String(value??'');
   const attr=' data-cv-scope="'+E(scope)+'" data-cv-key="'+E(key)+'" data-cv-index="'+row+'"'+(kind?' data-cv-table="'+E(kind)+'"':'');
   let control;
   if(field.type==='checkbox')control='<input id="'+E(id)+'" type="checkbox"'+attr+(value?' checked':'')+'>';
   else if(field.type==='select'||Array.isArray(field.options)){
     const opts=[...new Set(['',...(field.options||[]),text])];
     control='<select id="'+E(id)+'"'+attr+'><option value="">Select</option>'+opts.filter(Boolean).map(v=>'<option value="'+E(v)+'"'+(v===text?' selected':'')+'>'+E(v)+(key==='refMethod'&&METHOD[v]?' — '+E(METHOD[v]):'')+'</option>').join('')+'</select>';
   }else if(field.type==='textarea'||text.includes('\n')||label.length>70){
     control='<textarea id="'+E(id)+'"'+attr+' rows="1" placeholder="Tap to complete">'+E(text)+'</textarea>';
   }else{
     control='<input id="'+E(id)+'"'+attr+' value="'+E(text)+'" type="'+(field.type==='date'?'date':'text')+'" inputmode="'+(numeric?'decimal':'text')+'" autocomplete="off" placeholder="Tap to complete">';
   }
   return '<label class="cv-field'+(field.span==='full'?' cv-wide':'')+'"><span title="'+E(label)+'">'+E(label)+'</span>'+control+(numeric&&field.type!=='select'&&!Array.isArray(field.options)?'<button class="cv-keyboard-toggle" type="button" data-action="cv-keyboard" aria-label="Toggle numeric and text keyboard">ABC</button>':'')+(['refMethod','referenceMethod'].includes(key)?'<small>'+E(METHOD[text]||'Check Appendix 4 / Table 4A2')+'</small>':'')+'</label>';
 }
 function sectionPage(title,fields,cert,orientation,label){
   fields=fields.filter(f=>!f.showWhen||String(cert.fields?.[f.showWhen.key]||'')===String(f.showWhen.value));
   const max=orientation==='landscape'?18:13;
   const pages=[];
   for(let off=0;off<fields.length||off===0;off+=max){
     const chunk=fields.slice(off,off+max);
     pages.push({title:title+(off?' · continued':''),label:label||title,orientation,html:'<div class="cv-titleline">'+E(title)+'</div><div class="cv-fields">'+chunk.map(f=>fieldInput('field',f.key,f.key==='supplyDeviceBs'?[cert.fields?.supplyDeviceBs,cert.fields?.supplyDeviceType?'Type '+cert.fields.supplyDeviceType:''].filter(Boolean).join(' '):cert.fields?.[f.key],f)).join('')+'</div>'});
     if(!fields.length)break;
   }
   return pages;
 }
 function tablePages(title,key,columns,rows,orientation){
   const pages=[],batch=orientation==='landscape'?9:6;
   const items=Array.isArray(rows)?rows:[];
   for(let off=0;off<items.length||off===0;off+=batch){
     const list=items.slice(off,off+batch);
     const html='<div class="cv-titleline">'+E(title)+(off?' · continued':'')+'</div>'+
       '<div class="cv-row-cards">'+(list.length?list.map((r,j)=>'<section class="cv-row-card"><strong>Item '+(off+j+1)+'</strong><div class="cv-fields">'+columns.map(c=>fieldInput('table',c.key,r[c.key],c,off+j,key)).join('')+'</div></section>').join(''):'<p class="cv-empty">No entries yet. Add an item in Quick Entry.</p>')+'</div>';
     pages.push({title:title+(off?' · continued':''),label:title,orientation,html});
     if(!items.length)break;
   }
   return pages;
 }
 const deviceFields=[
  {key:'circuitNo',label:'Circuit number'},{key:'description',label:'Circuit description'},
  {key:'wiringType',label:'Wiring type'},{key:'refMethod',label:'Reference method',options:['A1','A2','B','C','D1','D2','E','F','G','100','101','102','103','Other']},
  {key:'liveCsa',label:'Live mm²'},{key:'cpcCsa',label:'CPC mm²'},
  {key:'deviceKind',label:'Device type',options:['MCB','RCBO','RCD','RCCB','Fuse','MCCB','AFDD','SPD','Main switch','Spare','Other']},
  {key:'ocpdBs',label:'OCPD BS (EN)'},{key:'ocpdType',label:'Type / curve'},
  {key:'ocpdRating',label:'Rating A'},{key:'breakingCapacity',label:'Breaking kA'},
  {key:'rcdBs',label:'RCD BS (EN)'},{key:'rcdType',label:'RCD type'},
  {key:'rcdIdn',label:'RCD mA'},{key:'poleCount',label:'Poles'},
  {key:'phaseAssociation',label:'Verified phase / line'}
 ];
 const testFields=[
  {key:'circuitNo',label:'Circuit number'},{key:'r1',label:'r1 Ω'},
  {key:'rn',label:'rn Ω'},{key:'r2',label:'r2 Ω'},
  {key:'r1r2',label:'R1+R2 Ω'},{key:'irVoltage',label:'IR V'},
  {key:'irLL',label:'IR L-L MΩ'},{key:'irLE',label:'IR L-E MΩ'},
  {key:'polarity',label:'Polarity',options:['Pass','Fail','N/A']},
  {key:'zs',label:'Measured Zs Ω'},{key:'rcdTime',label:'RCD ms'},
  {key:'rcdButton',label:'RCD test result',options:['Pass','Fail','N/A']},
  {key:'afddButton',label:'AFDD test result',options:['Pass','Fail','N/A']},
  {key:'remarks',label:'Remarks'}
 ];
 const boardFields=[
  {key:'location',label:'Location'}, {key:'suppliedFrom',label:'Supplied from'},
  {key:'distributionOcpdBs',label:'Distribution OCPD BS EN'},
  {key:'distributionOcpdType',label:'Distribution OCPD type'},
  {key:'distributionOcpdRating',label:'Distribution OCPD rating A'},
  {key:'zdb',label:'Zdb Ω'},{key:'ipf',label:'Ipf kA'},
  {key:'rcdBs',label:'RCD BS EN'},{key:'rcdType',label:'RCD type'},
  {key:'rcdRating',label:'RCD rating A'},{key:'rcdIdn',label:'RCD IΔn mA'},
  {key:'spd',label:'SPD type'}
 ];
 function boardPages(cert){
   const boards=cert.tables?.boards||[];
   const all=cert.tables?.circuits||[],tests=cert.tables?.tests||[];
   const pages=[];
   boards.forEach((board,bi)=>{
     const entries=all.map((r,i)=>({r,t:tests[i]||{},i})).filter(x=>x.r.boardRef===board.ref);
     const count=Math.max(1,Math.ceil(entries.length/rowsPerPage));
     for(let segment=0;segment<count;segment++){
       const chunk=entries.slice(segment*rowsPerPage,(segment+1)*rowsPerPage);
       const header='<div class="cv-titleline">Schedule of circuit details · '+E(board.ref)+' ('+(segment+1)+'/'+count+')</div>'+
         (segment===0?'<div class="cv-board-fields">'+boardFields.map(f=>fieldInput('board',f.key,board[f.key],f,bi)).join('')+'</div>':'');
       const row='<div class="cv-schedule"><div class="cv-schedule-header"><span>No.</span><span>Details</span><span>Device</span><span>BS (EN)</span><span>Rating</span><span>Method</span></div>'+
         chunk.map(item=>'<div class="cv-schedule-row"><span>'+E(item.r.circuitNo||'')+'</span>'+
           fieldInput('circuit','description',item.r.description,deviceFields[1],item.i)+
           fieldInput('circuit','deviceKind',item.r.deviceKind,deviceFields[6],item.i)+
           fieldInput('circuit','ocpdBs',item.r.ocpdBs,deviceFields[7],item.i)+
           fieldInput('circuit','ocpdRating',item.r.ocpdRating,deviceFields[9],item.i)+
           fieldInput('circuit','refMethod',item.r.refMethod,deviceFields[3],item.i)+'</div>').join('')+'</div>';
       pages.push({orientation:'landscape',label:board.ref+' · Circuit details',title:'Circuit details · '+board.ref,html:header+row+'<div class="cv-sheet-actions"><button class="btn primary" data-action="board-scan" data-board-ref="'+E(board.ref)+'">📷 Scan Consumer Unit</button><button class="btn" data-action="cv-circuit-list" data-board-ref="'+E(board.ref)+'">Edit complete circuit details</button></div>',category:'board',boardRef:board.ref});
       const testrow='<div class="cv-titleline">Schedule of test results · '+E(board.ref)+' ('+(segment+1)+'/'+count+')</div><div class="cv-schedule cv-test-schedule"><div class="cv-schedule-header"><span>No.</span><span>R1+R2</span><span>IR L-E</span><span>Zs</span><span>RCD ms</span><span>RCD test</span></div>'+
         chunk.map(item=>'<div class="cv-schedule-row"><span>'+E(item.r.circuitNo||'')+'</span>'+[
           ['r1r2','R1+R2 Ω'],['irLE','IR L-E MΩ'],['zs','Zs Ω'],['rcdTime','RCD ms'],['rcdButton','RCD test result']
         ].map(([key,label])=>fieldInput('test',key,item.t[key],{label,...(key==='rcdButton'?{options:['Pass','Fail','N/A']}:null)},item.i)).join('')+'</div>').join('')+'</div>';
       pages.push({orientation:'landscape',label:board.ref+' · Test results',title:'Test results · '+board.ref,html:testrow,category:'tests',boardRef:board.ref});
     }
   });
   return pages;
 }
 function compactPart(part,cert,orientation){
   if(part.type==='section'){
     const fields=(part.fields||[]).filter(f=>!f.showWhen||String(cert.fields?.[f.showWhen.key]||'')===String(f.showWhen.value));
     if(!fields.length)return '';
     return '<div class="cv-titleline">'+E(part.title)+'</div><div class="cv-fields">'+fields.map(f=>fieldInput('field',f.key,cert.fields?.[f.key],f)).join('')+'</div>';
   }
   if(part.key==='eicInspection'){
     const rows=cert.tables?.eicInspection||[];
     return '<div class="cv-titleline">'+E(part.title)+'</div><div class="cv-inspection-grid">'+
       rows.map((row,i)=>'<div class="cv-inspection-line"><span class="cv-inspection-code">'+E(row.item||'')+'</span><span class="cv-inspection-description">'+E(row.description||'')+'</span>'+
         fieldInput('table','outcome',row.outcome,{label:'Inspection outcome',options:['✓','✕','N/A']},i,'eicInspection')+'</div>').join('')+'</div>';
   }
   if(part.type==='table')return tablePages(part.title,part.key,part.columns||[],cert.tables?.[part.key],orientation).map(x=>x.html).join('');
   return '';
 }
 function pdfPageCount(cert,schema,settings){
   try{
     return window.SperinIetForms?.build({cert,schema,settings:settings||{},worksheet:false})?.getNumberOfPages()||0;
   }catch(err){
     console.warn('Could not determine PDF page count; keeping editable pages',err);
     return 0;
   }
 }
 function eicPages(cert,schema,settings){
   const parts=schema.sections||[],find=key=>parts.find(p=>p.title?.startsWith(key));
   const ab=[find('A ·'),find('B ·')].filter(Boolean),c=find('C ·'),d=find('D ·'),f=find('F ·'),g=find('G ·'),
     h=parts.find(p=>p.key==='eicInspection'),i=find('I ·'),j=find('J ·');
   const make=(title,list)=>({orientation:'landscape',title,label:title,html:list.filter(Boolean).map(p=>compactPart(p,cert,'landscape')).join('')});
   const schedules=boardPages(cert);
   const expected=pdfPageCount(cert,schema,settings);
   // PDFs may have extra pages when certification declarations or annotations expand.
   // Match their count without multiplying the number of data-entry screens.
   const mainCount=Math.max(3,expected-schedules.length||3);
   let groups;
   if(mainCount<=3)groups=[
     make('Client, installation and certification',[...ab,c]),
     make('Inspection interval, supply and installation',[d,f,g]),
     make('Inspection, comments and schedules',[h,i,j])
   ];
   else groups=[
     make('Client and installation details',ab),
     make('Certification and signatories',[c]),
     make('Inspection interval, supply and installation',[d,f,g]),
     make('Inspection, comments and schedules',[h,i,j])
   ];
   if(mainCount>4&&c){
     const fields=(c.fields||[]).filter(x=>!x.showWhen||String(cert.fields?.[x.showWhen.key]||'')===String(x.showWhen.value));
     const half=Math.max(1,Math.ceil(fields.length/2));
     const first={...c,fields:fields.slice(0,half)},second={...c,title:c.title+' · continued',fields:fields.slice(half)};
     groups.splice(1,1,make('Certification and signatories',[first]),make('Certification and signatories · continued',[second]));
   }
   if(mainCount>5&&g){
     const idx=groups.findIndex(p=>p.title==='Inspection interval, supply and installation');
     if(idx>=0)groups.splice(idx,1,make('Inspection interval and supply',[d,f]),make('Installation particulars',[g]));
   }
   // Extra PDF continuation sheets are representable, without dropping any editing fields.
   while(groups.length<mainCount){
     const idx=groups.findIndex(p=>p.title==='Inspection, comments and schedules');
     if(idx<0)break;
     groups.splice(idx,1,make('Inspection',[h]),make('Comments and schedules',[i,j]));
   }
   // Never advertise false page numbers if a document has exceptional continuation pages.
   return [...groups,...schedules];
 }
 function pages(cert,schema,settings={}){
   if(cert.type==='eic')return eicPages(cert,schema,settings);
   const orientation=isLandscape(cert.type)?'landscape':'portrait',out=[];
   const parts=schema?.sections||[];
   for(const part of parts){
     if(part.type==='section'){
       if((cert.type==='eic'||cert.type==='eicr') && /schedule details|circuit schedule header/i.test(part.title))continue;
       out.push(...sectionPage(part.title,part.fields||[],cert,orientation,part.title));
     }else if(part.type==='table' && !['boards','circuits','tests'].includes(part.key)){
       out.push(...tablePages(part.title,part.key,part.columns||[],cert.tables?.[part.key],orientation));
     }
   }
   if(isLandscape(cert.type))out.push(...boardPages(cert));
   return out.length?out:[{title:'Certificate details',label:'Details',orientation,html:'<p>No editable fields on this form.</p>'}];
 }
 function reset(){persisted.page=0;persisted.zoom=1;persisted.showPages=false;persisted.fitMode=true;}
 function scalePage(){
   const paper=document.querySelector('.cv-paper'),wrap=document.querySelector('.cv-paper-wrap');
   if(!paper||!wrap)return;
   const wide=paper.classList.contains('cv-landscape'),w=wide?1122:794,h=wide?794:1122;
   paper.style.transform='scale('+persisted.zoom+')';
   wrap.style.width=(w*persisted.zoom)+'px';
   wrap.style.height=(h*persisted.zoom)+'px';
   document.querySelectorAll('[data-cv-zoom-label]').forEach(el=>el.textContent=Math.round(persisted.zoom*100)+'%');
 }
 function setZoom(n,automatic=false){
   persisted.fitMode=automatic;
   persisted.zoom=Math.min(2.25,Math.max(.05,Number(n)||1));
   scalePage();
 }
 function applyViewport(){
   sizeViewport();
   if(persisted.fitMode)fit();else scalePage();
   const port=document.querySelector('.cv-viewport');
   if(port){port.scrollTop=0;port.scrollLeft=0;}
 }
 function render(cert,schema,settings={}){
   const sheets=pages(cert,schema,settings),p=Math.max(0,Math.min(persisted.page,sheets.length-1));
   persisted.page=p;
   const page=sheets[p],land=page.orientation==='landscape';
   const nav='<div class="cv-toolbar" role="toolbar" aria-label="Certificate page navigation">'+
     '<div class="cv-page-steps"><button class="btn" data-action="cv-page-prev" aria-label="Previous certificate page"'+(p===0?' disabled':'')+'>‹</button>'+
     '<span class="cv-page-count">Page '+(p+1)+' of '+sheets.length+'</span>'+
     '<button class="btn" data-action="cv-page-next" aria-label="Next certificate page"'+(p===sheets.length-1?' disabled':'')+'>›</button></div>'+
     '<details class="cv-menu"><summary aria-label="Certificate options" title="Certificate options">☰</summary>'+
     '<div class="cv-menu-panel" role="group" aria-label="Certificate actions">'+
     '<button class="btn" data-action="cv-pages">Select pages</button>'+
     '<button class="btn" data-action="cv-fit">Fit full page</button>'+
     '<button class="btn" data-action="cv-zoom-in" aria-label="Zoom in">Zoom in +</button>'+
     '<button class="btn" data-action="cv-zoom-out" aria-label="Zoom out">Zoom out −</button>'+
     '<span data-cv-zoom-label class="cv-menu-zoom">'+Math.round(persisted.zoom*100)+'%</span>'+
     '<button class="btn" data-action="cv-reset">Actual size (100%)</button>'+
     '<button class="btn" data-action="cv-next-empty">Next empty field</button>'+
     '<button class="btn" data-action="switch-entry">Quick Entry</button>'+
     '<button class="btn" data-action="edit-undo">Undo</button>'+
     '<button class="btn" data-action="edit-redo">Redo</button>'+
     '<button class="btn" data-action="certificate-review">Review</button>'+
     '<button class="btn primary" data-action="pdf">Save / open PDF</button>'+
     '<button class="btn" data-action="home">Home</button>'+
     '<button class="btn" data-action="open-new">New certificate</button>'+
     '<button class="btn" data-action="open-library">My Certificates</button></div></details></div>';
   const thumbs=persisted.showPages?'<div class="cv-page-picker" role="dialog" aria-label="Select certificate page"><div class="cv-picker-title"><strong>Select a page</strong><button class="btn" data-action="cv-pages">Close</button></div><div class="cv-page-grid">'+sheets.map((x,i)=>'<button class="cv-thumbnail'+(i===p?' active':'')+'" data-action="cv-select-page" data-cv-page="'+i+'" aria-label="Open page '+(i+1)+'"><div class="cv-mini-sheet '+(x.orientation==='landscape'?'landscape':'portrait')+'"><span>'+E(x.title)+'</span><i></i><i></i><i></i><i></i></div><strong>Page '+(i+1)+'</strong><small>'+E(x.label)+'</small></button>').join('')+'</div></div>':'';
   return '<section class="cv-shell cv-immersive" aria-label="Editable certificate view" data-cv-orientation="'+page.orientation+'">'+nav+thumbs+
     '<div class="cv-viewport" aria-label="Drag or swipe the certificate to pan; pinch to zoom" tabindex="0"><div class="cv-paper-wrap">'+
     '<article class="cv-paper '+(land?'cv-landscape':'cv-portrait')+'" aria-label="'+E(page.label)+'"><header class="cv-sheet-header"><strong>SPERIN SERVICES</strong><span>'+E(schema.name||'Certificate')+'</span><small>'+E(cert.number||'')+'</small></header>'+
     '<div class="cv-sheet-content">'+page.html+'</div><footer class="cv-sheet-footer">SPERIN CERTIFICATES · '+E(schema.standard||'')+' <span>Page '+(p+1)+' of '+sheets.length+'</span></footer></article></div></div></section>';
 }
 let gestureStart=null;
 function attachGestures(){
   const port=document.querySelector('.cv-viewport');
   if(!port)return;
   applyViewport();
   // One-finger drag on bare paper, two-finger pinch zoom; inputs retain normal touch interaction.
   port.addEventListener('pointerdown',e=>{
     if(e.target.closest('input,select,textarea,button,label'))return;
     gestureStart={x:e.clientX,y:e.clientY,left:port.scrollLeft,top:port.scrollTop,id:e.pointerId};
     port.setPointerCapture?.(e.pointerId);
   });
   port.addEventListener('pointermove',e=>{
     if(!gestureStart||e.pointerId!==gestureStart.id)return;
     if(e.pointerType==='mouse'&&!(e.buttons&1))return;
     port.scrollLeft=gestureStart.left+gestureStart.x-e.clientX;
     port.scrollTop=gestureStart.top+gestureStart.y-e.clientY;
   });
   port.addEventListener('pointerup',()=>{gestureStart=null;});
   port.addEventListener('pointercancel',()=>{gestureStart=null;});
   port.addEventListener('touchstart',e=>{
     if(e.touches.length===2){
       const [a,b]=e.touches;
       port._cvPinch={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),zoom:persisted.zoom};
     }
   },{passive:true});
   port.addEventListener('touchmove',e=>{
     if(e.touches.length===2&&port._cvPinch){
       const [a,b]=e.touches,dist=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
       setZoom(port._cvPinch.zoom*dist/Math.max(1,port._cvPinch.distance));
     }
   },{passive:true});
   port.addEventListener('touchend',e=>{if(e.touches.length<2)port._cvPinch=null;});
 }
 function switchPage(next){persisted.page=Math.max(0,Number(next)||0);persisted.showPages=false;persisted.fitMode=true;}
 function togglePages(){persisted.showPages=!persisted.showPages;}
 function sizeViewport(){
   const port=document.querySelector('.cv-viewport'),toolbar=document.querySelector('.cv-toolbar');
   if(!port)return;
   if(port.closest?.('.cv-immersive')){port.style.height='';return;}
   const dock=document.querySelector('.editor-dock');
   const dockTop=dock?.getBoundingClientRect().top;
   const bottomSpace=Number.isFinite(dockTop)?Math.max(0,window.innerHeight-dockTop):90;
   const reserved=(toolbar?.getBoundingClientRect().height||60)+bottomSpace+140;
   port.style.height=Math.max(100,window.innerHeight-reserved)+'px';
 }
 function fit(){
   const port=document.querySelector('.cv-viewport'),paper=document.querySelector('.cv-paper');
   if(!port||!paper)return;
   sizeViewport();
   const landscape=paper.classList.contains('cv-landscape'),w=landscape?1122:794,h=landscape?794:1122;
   // Include the paper's 12px margins on BOTH sides and fit both dimensions.
   setZoom(Math.min(Math.max(1,port.clientWidth-24)/w,Math.max(1,port.clientHeight-24)/h,1),true);
   port.scrollTop=0;port.scrollLeft=0;
 }
 window.addEventListener('resize',()=>{
   if(document.activeElement?.matches?.('input,textarea,select'))return;
   sizeViewport();if(persisted.fitMode)fit();
 });
 function nextEmpty(){const inputs=[...document.querySelectorAll('.cv-paper input:not([type=checkbox]),.cv-paper textarea,.cv-paper select')],target=inputs.find(x=>!x.value);if(target){target.scrollIntoView({block:'center',inline:'center'});target.focus();return true;}return false;}
 window.SperinCertificateView={isLandscape,pages,render,reset,attachGestures,switchPage,togglePages,setZoom,fit,nextEmpty,state:persisted};
})();