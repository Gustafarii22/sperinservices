/* Imported test results are untrusted until mapped and approved by the electrician.
   This supports manufacturer-exported CSV where column headers identify values.
   It does not pretend to implement Megger proprietary Bluetooth protocols. */
(()=>{"use strict";
let overlay=null,adapter=null,review=[];
const allowed={
  eic:new Set(["r1","rn","r2","r1r2","r2only","irVoltage","irLL","irLE","polarity","zs","rcdTime","rcdButton","afddButton","remarks"]),
  eicr:new Set(["r1","rn","r2","r1r2","r2only","irVoltage","irLL","irLE","polarity","zs","rcdTime","rcdButton","afddButton","remarks"]),
  pat:new Set(["visual","earth","insulation","leakage","polarity","functional","outcome","remarks"])
};
const aliases={
  board:"boardRef",db:"boardRef",boardref:"boardRef",distributionboard:"boardRef",
  circuit:"circuitNo",circuitno:"circuitNo",circuitnumber:"circuitNo",cct:"circuitNo",
  r1:"r1",rn:"rn",r2:"r2",r1r2:"r1r2",r2only:"r2only",
  insulationresistancell:"irLL",irll:"irLL",insulationresistancele:"irLE",irle:"irLE",irv:"irVoltage",
  insulationtestvoltage:"irVoltage",z:"zs",zs:"zs",loopimpedance:"zs",
  rcdtriptime:"rcdTime",rcdtime:"rcdTime",rcdtesttime:"rcdTime",
  rcdtestbutton:"rcdButton",afddtestbutton:"afddButton",polarity:"polarity",remarks:"remarks",notes:"remarks",
  asset:"asset",assetid:"asset",assetnumber:"asset",visualinspection:"visual",earthcontinuity:"earth",
  earthresistance:"earth",insulationresistance:"insulation",leakagecurrent:"leakage",outcome:"outcome",result:"outcome",functionaltest:"functional"
};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalise=x=>String(x??"").toLowerCase().replace(/[\sµμΩω()\-_.\/+]/g,"");
function csvRows(src){
  let rows=[],row=[],field="",quote=false;
  for(let i=0;i<src.length;i++){
    const c=src[i];
    if(c==='"'){
      if(quote&&src[i+1]==='"'){field+='"';i++;}else quote=!quote;
    }else if((c===','||c==='\t'||c===';')&&!quote){row.push(field);field="";}
    else if((c==='\r'||c==='\n')&&!quote){
      if(c==='\r'&&src[i+1]==='\n')i++;
      row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field="";
    }else field+=c;
  }
  if(quote)throw Error("Unmatched CSV quotation mark");
  row.push(field);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
function close(){overlay?.remove();overlay=null;review=[];}
function show(message){const el=overlay?.querySelector("[data-import-status]");if(el)el.textContent=message;}
function open(a){
 adapter=a;review=[];if(overlay)close();
 overlay=document.createElement("div");
 overlay.style.cssText="position:fixed;inset:0;z-index:11000;background:#061730bf;display:grid;place-items:center;padding:12px";
 overlay.innerHTML='<div style="background:#fff;color:#182c42;width:min(730px,100%);max-height:94vh;overflow:auto;padding:22px;border-radius:15px;font:14px system-ui" role="dialog" aria-modal="true">'+
 '<h2>Import test instrument measurements</h2><p>Open a CSV export from a compatible tester. Match exact board/circuit or PAT asset IDs, review each value, then confirm. This is a file import, NOT direct Bluetooth pairing.</p>'+
 '<p><input type="file" data-import-file accept=".csv,text/csv,text/plain"></p><p data-import-status>Nothing imported. Existing measurements are safe.</p>'+
 '<div data-import-preview></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin:15px 0"><button data-import="apply" disabled>Import checked measurements</button><button data-import="close">Close</button></div></div>';
 overlay.querySelectorAll("button").forEach(b=>{b.style.cssText="padding:11px 14px;border:0;border-radius:8px;background:#e4edf9;color:#123358;font-weight:600";});
 overlay.addEventListener("click",e=>{if(e.target===overlay)close();const cmd=e.target.closest("[data-import]")?.dataset.import;if(cmd==="close")close();if(cmd==="apply")apply();});
 overlay.querySelector("[data-import-file]").addEventListener("change",parseFile);
 document.body.appendChild(overlay);
}
async function parseFile(e){
 const file=e.target.files?.[0];review=[];
 if(!file)return;
 if(file.size>900000)return show("File over 900 kB. Split the export by job.");
 await reviewText(await file.text());
}
async function reviewText(text){
 const cert=adapter?.get?.();review=[];
 if(!cert)return show("Open a certificate first.");
 if(typeof text!=="string"||text.length>900000)return show("Serial/CSV data exceeds the safe import limit.");
 try{
  const rows=csvRows(text.replace(/^\uFEFF/,""));
  if(rows.length<2)throw Error("CSV has no test data");
  const headers=rows[0].map(x=>aliases[normalise(x)]||"");
  if(!headers.some(x=>x==="asset"||x==="circuitNo"))throw Error("No Asset ID or Circuit number column found.");
  const isPat=cert.type==="pat";
  const valid=allowed[cert.type];
  if(!valid)throw Error("Open an EIC, EICR or PAT record first.");
  const items=isPat?cert.tables?.appliances:cert.tables?.tests;
  if(!Array.isArray(items))throw Error("Target inspection schedule missing.");
  const circuits=cert.tables?.circuits||[];
  for(const r of rows.slice(1,600)){
    const row={};headers.forEach((key,i)=>{if(key&&r[i]?.trim())row[key]=r[i].trim();});
    let match=-1;
    if(isPat){
      const same=items.map((x,i)=>({x,i})).filter(y=>String(y.x.asset).trim()===String(row.asset||"").trim());
      if(same.length===1)match=same[0].i;
    }else{
      const same=circuits.map((x,i)=>({x,i})).filter(y=>{
        const no=String(y.x.circuitNo??"").trim();
        const board=String(y.x.boardRef||"DB1").trim().toUpperCase();
        return no===String(row.circuitNo||"").trim() && (!row.boardRef||board===String(row.boardRef).trim().toUpperCase());
      });
      if(same.length===1)match=same[0].i;
    }
    if(match<0)continue; // Never guess a circuit with duplicate numbers across boards.
    for(const [field,value] of Object.entries(row)){
      if(!valid.has(field)||value.length>100)continue;
      // Reject implausible numeric formats without making a safety judgement.
      if(!["polarity","remarks","outcome","rcdButton","afddButton","visual","functional"].includes(field) && !/^(?:[<>≥≤]\s*)?\d+(?:[.,]\d+)?$/.test(value))continue;
      const old=items[match]?.[field]??"";
      review.push({index:match,field,value,old,identity:isPat?row.asset:((row.boardRef||"DB")+" / "+row.circuitNo)});
    }
  }
  if(!review.length)throw Error("No unambiguous matching measurements. Check header labels, board references and asset numbers.");
  const host=overlay.querySelector("[data-import-preview]");
  host.innerHTML='<p>Identified '+review.length+' individual values. <strong>Every imported result needs your separate approval.</strong> Unknown or ambiguous circuits were skipped.</p>'+
    review.map((x,i)=>'<label style="display:flex;gap:10px;border-bottom:1px solid #e2e9f2;padding:10px"><input type="checkbox" data-measure="'+i+'"><span><strong>'+esc(x.identity)+' · '+esc(x.field)+'</strong><small style="display:block">Existing: '+esc(x.old||"(blank)")+' → Imported: '+esc(x.value)+'</small></span></label>').join("");
  overlay.querySelector('[data-import="apply"]').disabled=false;
  show("Review each proposed measurement against your tester and original certificate.");
 }catch(err){overlay.querySelector("[data-import-preview]").innerHTML="";show("Not imported: "+err.message);}
}
function apply(){
 const approved=Array.from(overlay.querySelectorAll("[data-measure]:checked")).map(n=>review[Number(n.dataset.measure)]).filter(Boolean);
 if(!approved.length)return show("Tick the individual readings you have checked.");
 if(!confirm("Apply "+approved.length+" manually checked readings to the open certificate? Verify original instrument test conditions and ensure suitable units."))return;
 adapter.apply(approved);
 close();
}
window.SperinInstrumentImport={open,csvRows,reviewText};
})();
