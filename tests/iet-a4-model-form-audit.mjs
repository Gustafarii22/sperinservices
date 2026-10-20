import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("public/certificates/app.js","utf8");
const pdf=fs.readFileSync("public/certificates/iet-forms.js","utf8");
const scan=pdf.slice(pdf.indexOf("function renderCircuitSchedules"),pdf.indexOf("function renderGeneric"));
const expectedCircuits=[
 "Circuit number","Circuit description","Type of wiring","Reference method",
 "Number of points served","Live (mm²)","CPC (mm²)","BS (EN)",
 "Type","Rating (A)","Breaking capacity (kA)","Maximum permitted Zs (Ω)",
 "BS (EN)","Type","IΔn (mA)","Rating (A)"
];
const expectedTests=[
 "Circuit number","r1 (line) Ω","rn (neutral) Ω","r2 (CPC) Ω",
 "(R1 + R2) Ω","R2 (Ω)","Test voltage (V)","Live - Live (MΩ)",
 "Live - Earth (MΩ)","Polarity","Maximum measured Zs (Ω)",
 "Disconnection time (ms)","Test button operation",
 "Manual test button operation","Remarks"
];
function cols(section){
 const label=section==="circuits"?"const cols=[":"const tcols=[";
 const i=scan.indexOf(label);
 assert.ok(i>=0,label);
 const end=scan.indexOf("];",i);
 return [...scan.slice(i,end).matchAll(/\['(\d+)','([^']+)','([^']+)'\]/g)]
 .map(m=>({number:Number(m[1]),label:m[2],key:m[3]}));
}
test("Issued circuit schedule has exactly the A4 16 fields in order",()=>{
 const columns=cols("circuits");
 assert.deepEqual(columns.map(x=>x.number),Array.from({length:16},(_,i)=>i+1));
 assert.deepEqual(columns.map(x=>x.label),expectedCircuits);
 for(const banned of ["deviceManufacturer","deviceModel","deviceKind"])
  assert.ok(!columns.some(c=>c.key===banned));
});
test("Issued results schedule has exactly the A4 15 test fields in order",()=>{
 const columns=cols("tests");
 assert.deepEqual(columns.map(x=>x.number),Array.from({length:15},(_,i)=>i+17));
 assert.deepEqual(columns.map(x=>x.label),expectedTests);
});
test("Board schedule header contains only the IET distribution, SPD and RCD particulars",()=>{
 assert.match(scan,/distributionOcpdBs/);
 assert.match(scan,/distributionOcpdType/);
 assert.match(scan,/distributionOcpdRating/);
 assert.match(scan,/spdCertified/);
 assert.match(scan,/board\.rcdBs/);
 assert.match(scan,/board\.rcdType/);
 assert.match(scan,/board\.rcdRating/);
 assert.match(scan,/board\.rcdIdn/);
 for(const banned of ["'Manufacturer: '","'Model: '","'Ways: '","'Populated: '","'Spare: '"])
  assert.ok(!scan.includes(banned));
});
test("EIC and EICR include required main switch and signatory information",()=>{
 for(const key of ["mainRcdBreaking","mainRcdTime","mainSwitchDeviceSetting"])
   assert.ok(pdf.includes("f."+key),key+" missing on PDF");
 for(const key of ["inspectedBy","inspectorSignature","inspectorCompany","inspectorPosition","inspectorAddress","inspectorDate",
                  "authorisedBy","authoriserSignature","authoriserCompany","authoriserPosition","authoriserAddress","authoriserDate"])
   assert.ok(pdf.includes("f."+key),key+" missing from EICR PDF");
 for(const key of ["designer2","designer2Signature","designer2Date","designer2Company","designer2Address","designer2Postcode","designer2Phone"])
  assert.ok(app.includes("'"+key+"'"),key+" missing EIC optional second designer");
});
