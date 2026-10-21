import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../../public/certificates/scan-core.js';

const core=globalThis.SperinBoardScan;
const line=(text,x,y)=>({text,left:x-22,right:x+22,top:y-11,bottom:y+11});
const value=(device,key)=>device.fields.find(f=>f.key===key)?.value;

test('dual-row scanner keeps standards, device models and RCD types on their own DIN rail',()=>{
  const photo={width:1400,height:1000,lines:[
    line('B32',1050,260),line('RTA063232B',1050,290),
    line('BS EN 61009-1',1050,315),line('TYPE A',1050,340),line('30mA',1050,365),
    line('B16',1050,650),line('MT0616',1050,680),
    line('BS EN 60898-1',1050,715),line('6000',1050,740)
  ]};
  const out=core.localOcrCandidates([photo],{mainSide:'right'});
  assert.equal(out.devices.length,2);
  assert.deepEqual(out.devices.map(d=>value(d,'ocpdRating')),['32','16']);
  assert.equal(value(out.devices[0],'deviceKind'),'RCBO');
  assert.equal(value(out.devices[0],'rcdType'),'A');
  assert.equal(value(out.devices[0],'ocpdBs'),'BS EN 61009-1');
  assert.equal(value(out.devices[0],'deviceModel'),'RTA063232B');
  assert.equal(value(out.devices[1],'deviceKind'),'MCB');
  assert.equal(value(out.devices[1],'ocpdBs'),'BS EN 60898-1');
  assert.equal(value(out.devices[1],'deviceModel'),'MT0616');
  assert.equal(value(out.devices[1],'rcdType'),undefined);
  assert.equal(value(out.devices[1],'rcdBs'),undefined);
  assert.ok(out.devices.every(d=>d.fields.every(f=>f.accepted===false)));
});

test('unpositioned OCR must not invent blank spaces or a confirmed physical order',()=>{
 const out=core.localOcrCandidates([{fullText:'B32\\nBS EN 61009-1\\n30mA'}],{mainSide:'right'});
 assert.equal(out.physicalOrderKnown,false);
 assert.equal(out.devices.length,1);
 assert.equal(out.devices.some(d=>value(d,'deviceKind')==='Spare'),false);
});
