import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const load = async file => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(readFileSync(new URL(`../src/lib/${file}.ts`,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString("base64")}`);
const {analyticsApi} = await load("analytics.server");
const req=(body,origin="https://sperinservices.co.uk")=>new Request("https://sperinservices.co.uk/api/events",{method:"POST",headers:{origin},body:JSON.stringify(body)});
test("measurement accepts only fixed event names and no personal data",async()=>{
 assert.equal((await analyticsApi(req({event:"phone_click"}))).status,204);
 assert.equal((await analyticsApi(req({event:"phone_click",email:"test@example.com"}))).status,400);
 assert.equal((await analyticsApi(req({event:"unknown"}))).status,400);
 assert.equal((await analyticsApi(req({event:"phone_click"},"https://other.test"))).status,403);
 assert.equal((await analyticsApi(req({event:"x".repeat(101)}))).status,413);
});
const {readDraft,saveDraft,clearDraft}=await load("drafts");
test("drafts survive navigation, expire after a day, and tolerate denied storage",()=>{
 const memory=new Map();globalThis.sessionStorage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 saveDraft("test",{selection:{switch:3}});assert.deepEqual(readDraft("test"),{selection:{switch:3}});
 memory.set("old",JSON.stringify({at:Date.now()-86400001,value:"private"}));assert.equal(readDraft("old"),null);
 clearDraft("test");assert.equal(readDraft("test"),null);
 globalThis.sessionStorage={getItem:()=>{throw Error("denied")},setItem:()=>{throw Error("denied")},removeItem:()=>{throw Error("denied")}};
 assert.equal(readDraft("test"),null);assert.doesNotThrow(()=>saveDraft("test",{}));assert.doesNotThrow(()=>clearDraft("test"));delete globalThis.sessionStorage;
});
