import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync('public/certificates/certificate-view.js','utf8');
function setup(width,height,landscape=true){
 const events={};
 const port={style:{},clientWidth:width,get clientHeight(){return parseFloat(this.style.height)||height;},scrollLeft:30,scrollTop:60,addEventListener(){}};
 const paper={style:{},classList:{contains:()=>landscape}};
 const wrap={style:{}};
 const doc={activeElement:null,querySelector:s=>({'.cv-viewport':port,'.cv-paper':paper,'.cv-paper-wrap':wrap,'.cv-toolbar':{getBoundingClientRect:()=>({height:90})},'.editor-dock':{getBoundingClientRect:()=>({top:ctx.window.innerHeight-140})}}[s]),querySelectorAll:()=>[]};
 const ctx=vm.createContext({document:doc,window:{innerHeight:height,addEventListener:(key,fn)=>events[key]=fn}});
 vm.runInContext(script,ctx);return {api:ctx.window.SperinCertificateView,port,ctx,events};
}
test('whole-page fit opens page one on small, portrait and landscape screens',()=>{
 for(const [width,height,landscape] of [[296,740,true],[390,844,false],[780,390,true],[1000,870,true]]){
  const {api,port}=setup(width,height,landscape);api.reset();api.attachGestures();
  assert.equal(api.state.page,0);assert.equal(api.state.fitMode,true);
  assert((landscape?1122:794)*api.state.zoom+24<=port.clientWidth+.01);
  assert((landscape?794:1122)*api.state.zoom+24<=port.clientHeight+.01);
  assert.equal(port.scrollTop,0);assert.equal(port.scrollLeft,0);
 }
});
test('manual zoom survives rerender and rotation; Fit Page restores overview',()=>{
 const {api,ctx,events}=setup(390,844);api.attachGestures();api.setZoom(1.2);api.attachGestures();assert.equal(api.state.zoom,1.2);
 ctx.window.innerHeight=390;events.resize();assert.equal(api.state.zoom,1.2);
 api.fit();assert(api.state.zoom<1);assert.equal(api.state.fitMode,true);
});
test('page changes re-fit; returning to Certificate View resets page one',()=>{
 const {api}=setup(390,844);api.setZoom(1.5);api.switchPage(4);assert.equal(api.state.fitMode,true);api.attachGestures();assert(api.state.zoom<1);assert.equal(api.state.page,4);
 api.reset();api.attachGestures();assert.equal(api.state.page,0);assert(api.state.zoom<1);
});
