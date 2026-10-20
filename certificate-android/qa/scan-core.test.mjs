import { test } from "node:test";
import assert from "node:assert/strict";
import "../../public/certificates/scan-core.js";
const core = globalThis.SperinBoardScan;
const f = (key, value, extra = {}) => ({
  key,
  value,
  confidence: "high",
  accepted: true,
  evidence: [{ image: 1, text: value }],
  ...extra,
});
const cert = () => ({
  type: "eic",
  fields: { clientName: "Keep me" },
  tables: {
    boards: [{ id: "b1", ref: "DB1", manufacturer: "Old" }],
    circuits: [
      {
        id: "c1",
        boardRef: "DB1",
        circuitNo: "1",
        description: "Old lights",
        ocpdRating: "6",
        liveCsa: "1.5",
      },
    ],
    tests: [{ boardRef: "DB1", circuitNo: "1", zs: ".44" }],
  },
});
const result = () => ({
  board: [f("manufacturer", "Wylex")],
  circuits: [{ target: "c1", fields: [f("description", "Lights"), f("ocpdRating", "10")] }],
});
test("proposals are unapproved; measured or invented fields rejected and evidence bounded", () => {
  const r = core.normalise(
    {
      board: [f("manufacturer", "Wylex"), f("ze", ".1")],
      circuits: [
        {
          fields: [
            f("ocpdRating", "32", { evidence: [{ image: 9, text: "B32" }] }),
            f("liveCsa", "2.5"),
          ],
        },
      ],
    },
    1,
  );
  assert.equal(r.board.length, 1);
  assert.equal(r.board[0].accepted, false);
  assert.equal(r.circuits[0].fields.length, 1);
  assert.equal(r.circuits[0].fields[0].confidence, "check");
});
test("transaction preserves original/customer/conductors/tests and shows overwrite diff", () => {
  const original = cert(),
    before = JSON.stringify(original);
  const r = core.propose(original, "DB1", result());
  assert.equal(JSON.stringify(original), before);
  assert.equal(r.certificate.fields.clientName, "Keep me");
  assert.equal(r.certificate.tables.circuits[0].liveCsa, "1.5");
  assert.deepEqual(r.certificate.tables.tests, original.tables.tests);
  assert.deepEqual(r.changes[2], {
    label: "Circuit 1 · Rating (A)",
    before: "6",
    after: "10",
    evidence: [{ image: 1, text: "10" }],
  });
});
test("unchecked values never apply", () => {
  const r = result();
  r.board[0].accepted = false;
  r.circuits[0].fields.forEach((f) => (f.accepted = false));
  assert.equal(core.propose(cert(), "DB1", r).changes.length, 0);
});
test("missing target, duplicate targets, duplicate numbers, incoming linked circuit fail atomically", () => {
  const r = result();
  r.circuits[0].target = "";
  assert.throws(() => core.propose(cert(), "DB1", r), /Choose/);
  r.circuits[0].target = "c1";
  r.circuits.push({ ...r.circuits[0] });
  assert.throws(() => core.propose(cert(), "DB1", r), /Two devices/);
  r.circuits.pop();
  r.circuits[0].target = "new";
  r.circuits[0].number = "1";
  assert.throws(() => core.propose(cert(), "DB1", r), /already exists/);
  r.circuits[0].target = "c1";
  const c = cert();
  c.tables.circuits[0]._incomingFeed = true;
  assert.throws(() => core.propose(c, "DB1", r), /linked/);
});
test("new circuit gets blank tests, never copied readings", () => {
  const r = result();
  r.circuits[0].target = "new";
  r.circuits[0].number = "2";
  const out = core.propose(cert(), "DB1", r).certificate;
  assert.deepEqual(out.tables.tests[1], { boardRef: "DB1", circuitNo: "2" });
});
test("tampered accepted board/circuit properties rejected", () => {
  assert.throws(
    () => core.propose(cert(), "DB1", { board: [f("liveCsa", "4")], circuits: [] }),
    /Unsupported/,
  );
  const r = result();
  r.circuits[0].fields.push(f("zs", ".2"));
  assert.throws(() => core.propose(cert(), "DB1", r), /Unsupported/);
});
test("Minor Works description maps to existing correct field with accurate before value", () => {
  const c = {
    type: "minor",
    fields: { circuitDescription: "Existing", circuitNo: "2", zs: ".5" },
    tables: {},
  };
  const r = {
    board: [],
    circuits: [{ target: "minor", fields: [f("description", "Lighting"), f("circuitNo", "4")] }],
  };
  const out = core.propose(c, "DB1", r);
  assert.equal(out.certificate.fields.circuitDescription, "Lighting");
  assert.equal(out.certificate.fields.circuitNo, "4");
  assert.equal(out.certificate.fields.zs, ".5");
  assert.equal(out.changes[0].before, "Existing");
});

test("scanned BS EN 61009-1 RCBO marks and Type A residual detection populate the correct existing circuit",()=>{
 const input=cert();
 const proposal={board:[],circuits:[{target:"c1",fields:[
  f("deviceManufacturer","FuseBox"),f("deviceModel","F32M"),
  f("deviceKind","RCBO"),f("ocpdBs","BS EN 61009-1"),
  f("ocpdType","B"),f("ocpdRating","32"),
  f("breakingCapacity","6"),f("rcdBs","BS EN 61009-1"),
  f("rcdType","A"),f("rcdIdn","30"),f("rcdRating","32")
 ]}]};
 const output=core.propose(input,"DB1",proposal).certificate;
 const row=output.tables.circuits[0];
 for(const [key,val] of Object.entries({deviceManufacturer:"FuseBox",deviceModel:"F32M",deviceKind:"RCBO",ocpdBs:"BS EN 61009-1",ocpdType:"B",ocpdRating:"32",breakingCapacity:"6",rcdBs:"BS EN 61009-1",rcdType:"A",rcdIdn:"30",rcdRating:"32"}))assert.equal(row[key],val,key);
 assert.equal(output.tables.tests[0].zs,".44");
 assert.equal(output.tables.circuits.length,1);
});
test("reviewed blank ways create numbered SPARE schedule entries, with no invented electrical ratings",()=>{
 const input=cert();
 const proposal={board:[],circuits:[2,3].map(n=>({
  target:"new",number:String(n),fields:[f("description","SPARE"),f("deviceKind","Spare")]
 }))};
 const {certificate:output,changes}=core.propose(input,"DB1",proposal);
 assert.deepEqual(output.tables.circuits.map(c=>c.circuitNo),["1","2","3"]);
 for(const n of ["2","3"]){
  const row=output.tables.circuits.find(c=>c.circuitNo===n);
  assert.equal(row.description,"SPARE");
  assert.equal(row.deviceKind,"Spare");
  assert.equal(row.ocpdBs,undefined);
  assert.equal(row.ocpdRating,undefined);
 }
 assert.deepEqual(output.tables.tests.slice(1),[{boardRef:"DB1",circuitNo:"2"},{boardRef:"DB1",circuitNo:"3"}]);
 assert.equal(changes.filter(c=>c.label.startsWith("New circuit")).length,2);
});

test("two photo banks of ONE FuseBox CU number main 0, SPD 1, B40 2, B32 3 and preserve both banks and blanks",()=>{
 const input=cert();
 input.tables.circuits=[];input.tables.tests=[];
 input.tables.boards[0].mainSwitch="100 A"; input.tables.boards[0].spd="Type 2 SPD";
 const make=(kind,rating,photo,position)=>{
   const device=core.draftDevice();
   device.position="Photo "+photo+" · "+position;
   for(const [key,value] of Object.entries({
    description:kind==="Spare"?"SPARE":rating?"FuseBox "+kind:"",deviceKind:kind,
    ...(rating?{ocpdType:"B",ocpdRating:String(rating),ocpdBs:kind==="RCBO"?"BS EN 61009-1":"BS EN 60898-1"}:{})
   })){device.fields.find(f=>f.key===key).value=value;}
   return device;
 };
 const raw={
  board:[f("mainSwitch","100 A"),f("spd","Type 2 SPD"),f("manufacturer","FuseBox")],
  circuits:[
   make("RCBO",40,1,"nearest SPD"),
   ...[32,32,32,32,32,16,16,16,16].map((r,i)=>make("RCBO",r,1,"bank 1 outgoing "+i)),
   ...Array.from({length:5},(_,i)=>make("Spare",null,1,"bank 1 blank "+i)),
   ...Array.from({length:10},(_,i)=>make(i===0?"MCB":"RCBO",6,2,"bank 2 outgoing "+i)),
   ...Array.from({length:6},(_,i)=>make("Spare",null,2,"bank 2 blank "+i))
  ],
  warnings:[]
 };
 core.numberFromMain(raw,input,"DB1");
 assert.equal(raw.circuits.length,33);
 assert.deepEqual(raw.circuits.map(d=>d.number),Array.from({length:33},(_,i)=>String(i)));
 assert.deepEqual(raw.circuits.slice(0,4).map(d=>d.fields.find(f=>f.key==="deviceKind")?.value),["Main switch","SPD","RCBO","RCBO"]);
 assert.equal(raw.circuits[2].fields.find(f=>f.key==="ocpdRating").value,"40");
 assert.equal(raw.circuits[3].fields.find(f=>f.key==="ocpdRating").value,"32");
 assert.equal(raw.circuits[17].fields.find(f=>f.key==="ocpdRating").value,"6");
 assert.equal(raw.circuits.filter(d=>d.fields.find(f=>f.key==="deviceKind")?.value==="Spare").length,11);
 for(const device of raw.circuits)device.fields.forEach(f=>{f.accepted=!!f.value;});
 const {certificate:output}=core.propose(input,"DB1",raw);
 assert.equal(output.tables.circuits.length,33);
 for(const [index,row] of output.tables.circuits.entries())assert.equal(row.circuitNo,String(index));
 assert.equal(output.tables.circuits[0].deviceKind,"Main switch");
 assert.equal(output.tables.circuits[1].deviceKind,"SPD");
 assert.equal(output.tables.circuits[2].ocpdRating,"40");
 assert.equal(output.tables.circuits[3].ocpdRating,"32");
 assert.equal(output.tables.circuits[17].ocpdRating,"6");
 assert.ok(output.tables.circuits.slice(27).every(r=>r.description==="SPARE"));
 assert.ok(output.tables.tests.every(r=>r.zs===undefined&&r.rcdTime===undefined));
 assert.ok(output.tables.circuits.filter(r=>r.deviceKind==="Spare").every(r=>r.ocpdRating===undefined&&r.ocpdBs===undefined));
 assert.equal(input.tables.circuits.length,0);
});
test("separate consumer units each own their photo groups and sequential number 0",()=>{
 const c=cert();c.tables.circuits=[];c.tables.tests=[];
 c.tables.boards=[{ref:"DB1",mainSwitch:"100 A",spd:"Type 2"},{ref:"DB2",mainSwitch:"63 A",spd:""}];
 const proposal=(rating)=>({board:[],circuits:[{fields:[f("description","Outlets"),f("deviceKind","MCB"),f("ocpdRating",rating)]}]});
 const p1=core.numberFromMain(proposal("32"),c,"DB1");
 for(const d of p1.circuits)d.fields.forEach(f=>f.accepted=!!f.value);
 const after1=core.propose(c,"DB1",p1).certificate;
 const p2=core.numberFromMain(proposal("6"),after1,"DB2");
 for(const d of p2.circuits)d.fields.forEach(f=>f.accepted=!!f.value);
 const after2=core.propose(after1,"DB2",p2).certificate;
 assert.deepEqual(after2.tables.circuits.filter(r=>r.boardRef==="DB1").map(r=>r.circuitNo),["0","1","2"]);
 assert.deepEqual(after2.tables.circuits.filter(r=>r.boardRef==="DB2").map(r=>r.circuitNo),["0","1"]);
 assert.equal(after2.tables.circuits.filter(r=>r.boardRef==="DB1"&&r.deviceKind==="SPD").length,1);
 assert.equal(after2.tables.circuits.filter(r=>r.boardRef==="DB2"&&r.deviceKind==="SPD").length,0);
 assert.equal(after2.tables.circuits.find(r=>r.boardRef==="DB2"&&r.ocpdRating).ocpdRating,"6");
});


test("actual ML Kit geometry is retained, duplicates grouped, and dual-bank ratings run away from main switch",()=>{
 const line=(txt,x,y=500)=>({text:txt,left:x-15,right:x+15,top:y-12,bottom:y+12});
 const photo1={width:1400,height:900,lines:[
   line("FuseBox MAIN SWITCH",1290,350),line("100A",1290,470),line("SPD T2",1195,450),
   line("B40",1110),line("30mA",1110,560),
   line("B32",1020),line("30mA",1020,560),line("B32",1020,530),
   line("B16",930),line("30mA",930,560)
 ]};
 const photo2={width:1400,height:900,lines:[
   line("B6",1160),line("30mA",1160,560),line("B6",1060),line("30mA",1060,560)
 ]};
 const candidates=core.localOcrCandidates([photo1,photo2]);
 assert.equal(candidates.physicalOrderKnown,true);
 assert.equal(candidates.direction,"right");
 assert.deepEqual(candidates.devices.map(d=>d.fields.find(f=>f.key==="ocpdRating").value),["40","32","16","6","6"]);
 assert.ok(candidates.devices.every(d=>d.fields.every(f=>f.accepted===false)));
 assert.equal(candidates.board.find(f=>f.key==="spd")?.value,"SPD (type and markings to confirm)");
 assert.equal(candidates.devices.filter(d=>d.fields.find(f=>f.key==="ocpdRating").value==="32").length,1);
 const c=cert();c.tables.circuits=[];c.tables.tests=[];
 core.numberFromMain({board:candidates.board,circuits:candidates.devices,warnings:candidates.warnings},c,"DB1");
 assert.equal(candidates.devices.length,5);
});
test("text-only OCR never invents physical device placement or blank-way counts",()=>{
 const q=core.localOcrCandidates([{fullText:"B32\nBS EN 61009-1\nType A"}]);
 assert.equal(q.physicalOrderKnown,false);
 assert.equal(q.devices.length,1);
 assert.equal(q.devices[0].fields.find(f=>f.key==="ocpdRating")?.value,"32");
 assert.equal(q.devices[0].fields.find(f=>f.key==="ocpdType")?.value,"B");
 assert.ok(q.warnings.some(w=>w.includes("blank covers")));
});
