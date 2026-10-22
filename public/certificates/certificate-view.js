/* Sperin Certificates v1.9.6: editable certificate-sheet workspace.
   The same cert.fields and cert.tables objects drive Quick Entry, this view and PDFs.
   Rendering is entirely offline; no photo or certificate data is uploaded here. */
(()=>{'use strict';
 const E= v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const LANDSCAPE_TYPES=new Set(['eic','eicr']);
 const METHOD={A1:'Single-core in conduit within insulated wall',A2:'Multicore in conduit within insulated wall',B:'Conduit/trunking on wall',C:'Clipped direct',D1:'In underground duct',D2:'Direct buried',E:'Multicore in free air',F:'Single-core touching, free air',G:'Single-core spaced, free air',100:'Above insulated ceiling, up to 100 mm',101:'Above insulated ceiling, over 100 mm',102:'Inside insulated stud wall, touching inner face',103:'Inside insulated stud wall, not touching inner face'};
 const isLandscape=type=>LANDSCAPE_TYPES.has(type);
 const persisted={page:0,zoom:1,showPages:false};
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
   return '<label class="cv-field'+(field.span==='full'?' cv-wide':'')+'"><span title="'+E(label)+'">'+E(label)+'</span>'+control+(numeric&&field.type!=='select'&&!Array.isArray(field.options)?'<button class="cv-keyboard-toggle" type="button" data-action="cv-keyboard" aria-label="Toggle numeric and text keyboard">ABC</button>':'')+(key==='refMethod'?'<small>'+E(METHOD[text]||'Check Appendix 4 / Table 4A2')+'</small>':'')+'</label>';
 }
 function sectionPage(title,fields,cert,orientation,label){
   const max=orientation==='landscape'?18:13;
   const pages=[];
   for(let off=0;off<fields.length||off===0;off+=max){
     const chunk=fields.slice(off,off+max);
     pages.push({title:title+(off?' · continued':''),label:label||title,orientation,html:'<div class="cv-titleline">'+E(title)+'</div><div class="cv-fields">'+chunk.map(f=>fieldInput('field',f.key,cert.fields?.[f.key],f)).join('')+'</div>'});
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
  {key:'spd',label:'SPD type'},{key:'spdBs',label:'SPD standard'}
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
 function pages(cert,schema){
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
 function reset(){persisted.page=0;persisted.zoom=1;persisted.showPages=false;}
 function scalePage(){
   const paper=document.querySelector('.cv-paper'),wrap=document.querySelector('.cv-paper-wrap');
   if(!paper||!wrap)return;
   const wide=paper.classList.contains('cv-landscape'),w=wide?1122:794,h=wide?794:1122;
   paper.style.transform='scale('+persisted.zoom+')';
   wrap.style.width=(w*persisted.zoom)+'px';
   wrap.style.height=(h*persisted.zoom)+'px';
   document.querySelectorAll('[data-cv-zoom-label]').forEach(el=>el.textContent=Math.round(persisted.zoom*100)+'%');
 }
 function setZoom(n){
   persisted.zoom=Math.min(2.25,Math.max(.42,Number(n)||1));
   scalePage();
 }
 function applyViewport(){
   scalePage();
   const port=document.querySelector('.cv-viewport');
   if(port){port.scrollTop=0;port.scrollLeft=0;}
 }
 function render(cert,schema){
   const sheets=pages(cert,schema),p=Math.max(0,Math.min(persisted.page,sheets.length-1));
   persisted.page=p;
   const page=sheets[p],land=page.orientation==='landscape';
   const nav='<div class="cv-toolbar"><button class="btn" data-action="cv-pages">☷ Select Pages</button>'+
      '<button class="btn" data-action="cv-page-prev"'+(p===0?' disabled':'')+'>← Previous</button>'+
      '<strong>Page '+(p+1)+' / '+sheets.length+'</strong>'+
      '<button class="btn" data-action="cv-page-next"'+(p===sheets.length-1?' disabled':'')+'>Next →</button>'+
      '<button class="btn" data-action="cv-zoom-out" aria-label="Zoom out">−</button>'+
      '<span data-cv-zoom-label>'+Math.round(persisted.zoom*100)+'%</span>'+
      '<button class="btn" data-action="cv-zoom-in" aria-label="Zoom in">＋</button>'+
      '<button class="btn" data-action="cv-fit">Fit Page</button><button class="btn" data-action="cv-reset">Upper Left</button><button class="btn" data-action="cv-next-empty">Next Empty</button></div>';
   const thumbs=persisted.showPages?'<div class="cv-page-picker" role="dialog" aria-label="Select certificate page"><div class="cv-picker-title"><strong>Select Pages</strong><button class="btn" data-action="cv-pages">Close</button></div><div class="cv-page-grid">'+sheets.map((x,i)=>'<button class="cv-thumbnail'+(i===p?' active':'')+'" data-action="cv-select-page" data-cv-page="'+i+'" aria-label="Open page '+(i+1)+'"><div class="cv-mini-sheet '+(x.orientation==='landscape'?'landscape':'portrait')+'"><span>'+E(x.title)+'</span><i></i><i></i><i></i><i></i></div><strong>Page '+(i+1)+'</strong><small>'+E(x.label)+'</small></button>').join('')+'</div></div>':'';
   return '<section class="cv-shell" aria-label="Editable certificate view" data-cv-orientation="'+page.orientation+'">'+nav+thumbs+
     '<div class="cv-viewport" aria-label="Drag or swipe the certificate to pan; pinch to zoom" tabindex="0"><div class="cv-paper-wrap">'+
     '<article class="cv-paper '+(land?'cv-landscape':'cv-portrait')+'" aria-label="'+E(page.label)+'"><header class="cv-sheet-header"><strong>SPERIN SERVICES</strong><span>'+E(schema.name||'Certificate')+'</span><small>'+E(cert.number||'')+'</small></header>'+
     '<div class="cv-sheet-content">'+page.html+'</div><footer class="cv-sheet-footer">SPERIN CERTIFICATES · '+E(schema.standard||'')+' <span>Page '+(p+1)+' of '+sheets.length+'</span></footer></article></div></div>'+
     '<div class="cv-footnote">Editable certificate-layout workspace · every field autosaves · use the PDF button for the issued document</div></section>';
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
 function switchPage(next){persisted.page=Math.max(0,Number(next)||0);persisted.showPages=false;persisted.zoom=1;}
 function togglePages(){persisted.showPages=!persisted.showPages;}
 function fit(){const port=document.querySelector('.cv-viewport'),paper=document.querySelector('.cv-paper');if(!port||!paper)return;setZoom(Math.min((port.clientWidth-12)/(paper.classList.contains('cv-landscape')?1122:794),1.4));port.scrollTop=0;port.scrollLeft=0;}
 function nextEmpty(){const inputs=[...document.querySelectorAll('.cv-paper input:not([type=checkbox]),.cv-paper textarea,.cv-paper select')],target=inputs.find(x=>!x.value);if(target){target.scrollIntoView({block:'center',inline:'center'});target.focus();return true;}return false;}
 window.SperinCertificateView={isLandscape,pages,render,reset,attachGestures,switchPage,togglePages,setZoom,fit,nextEmpty,state:persisted};
})();