import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreLabelledCases} from './score-labelled-scans.mjs';

test('synthetic scorer reports false BS-standard, missing values and way mistakes separately',()=>{
 const cases=[{id:'SYNTHETIC ONLY — NOT REAL ACCURACY',truth:[
  {id:'a',wayId:'bank1/rail1/way1',fields:{deviceKind:'RCBO',ocpdBs:'BS EN 61009-1',ocpdRating:'32'}},
  {id:'b',wayId:'bank1/rail1/way2',fields:{deviceKind:'RCCB',rcdBs:'BS EN 61008-1'}}
 ],predicted:[
  {matchedTruthId:'a',wayId:'bank1/rail1/way2',fields:{deviceKind:'RCBO',ocpdBs:'BS EN 60898-1',ocpdRating:'32'}},
  {matchedTruthId:'b',wayId:'bank1/rail1/way2',fields:{deviceKind:'RCCB'}}
 ]}];
 const out=scoreLabelledCases(cases);
 assert.equal(out.wrongWay,1);
 assert.equal(out.deviceMappingErrors,1);
 assert.equal(out.perField.ocpdBs.incorrect,1);
 assert.equal(out.perField.ocpdRating.correct,1);
 assert.equal(out.perField.rcdBs.omissions,1);
 assert.equal(out.perField.deviceKind.correct,2);
 assert.equal(out.datasetCases,1);
});
test('synthetic scorer detects duplicate association and missing device',()=>{
 const out=scoreLabelledCases([{id:'synthetic',truth:[{id:'a',wayId:'1',fields:{deviceKind:'MCB'}},{id:'b',wayId:'2',fields:{deviceKind:'RCBO'}}],predicted:[
  {matchedTruthId:'a',wayId:'1',fields:{deviceKind:'MCB'}},{matchedTruthId:'a',wayId:'1',fields:{deviceKind:'MCB'}}
 ]}]);
 assert.equal(out.duplicateLinks,1);assert.equal(out.missingDevices,1);
 assert.equal(out.unmatchedPredictions,1);
});
test('empty data or synthetic-missing ground truth cannot claim real recognition accuracy',()=>{
 assert.throws(()=>scoreLabelledCases([]),/non-empty/);
 assert.throws(()=>scoreLabelledCases([{id:'x',truth:[{id:'way'}],predicted:[]}]),/truth needs/);
});
