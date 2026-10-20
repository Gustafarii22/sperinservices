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
