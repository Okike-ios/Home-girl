'use strict';
/* HG-NOUR-002 — local dish catalogue and screen integration tests. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'../nourishment');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
function harness(seed={}){
 const storage=new Map(Object.entries(seed));
 const events=[];
 const localStorage={
  getItem:key=>storage.has(key)?storage.get(key):null,
  setItem:(key,value)=>storage.set(key,String(value))
 };
 const window={localStorage,dispatchEvent:e=>events.push(e.type)};
 window.window=window;
 window.crypto={randomUUID:()=> 'test-uuid'};
 const context={window,localStorage,Event:class Event{constructor(type){this.type=type}},crypto:window.crypto,console};
 vm.runInNewContext(read('dish-catalogue.js'),context);
 return {api:window.HomeGirlDishes,storage,events};
}
test('Seed dishes are loaded once and have stable IDs',()=>{
 const {api}=harness();
 const first=api.list(),second=api.list();
 assert.equal(first.length,10);
 assert.deepEqual(first.map(d=>d.id),second.map(d=>d.id));
 assert.ok(first.every(d=>d.id&&d.name));
});
test('Creating a dish is immediately visible across catalogue consumers',()=>{
 const {api,storage}=harness();
 const added=api.save({name:'New family dish',category:'Main Dishes',serves:3,ingredients:[{name:'Rice',quantity:'2',unit:'cups'}]});
 assert.equal(api.get(added.id).name,'New family dish');
 const restarted=harness(Object.fromEntries(storage));
 assert.equal(restarted.api.get(added.id).ingredients[0].name,'Rice');
 assert.equal(restarted.api.list().length,11);
});
test('Edit retains dish ID and does not duplicate catalogue records',()=>{
 const {api}=harness();
 const original=api.list()[0];
 const saved=api.save({...original,name:'Updated egusi'});
 assert.equal(saved.id,original.id);
 assert.equal(api.list().length,10);
 assert.equal(api.get(original.id).name,'Updated egusi');
});
test('Delete only removes the chosen dish',()=>{
 const {api}=harness();
 const first=api.list()[0],second=api.list()[1];
 assert.equal(api.remove(first.id),true);
 assert.equal(api.get(first.id),null);
 assert.ok(api.get(second.id));
 assert.equal(api.list().length,9);
});
test('Existing demo edits and deletes migrate into browser catalogue',()=>{
 const initial={
  'hg-menu-demo-edits-v1':JSON.stringify({'Egusi Soup':{name:'Family Egusi',category:'Soups & Stews',serves:8}}),
  'hg-menu-demo-deleted-v1':JSON.stringify(['Akara'])
 };
 const {api}=harness(initial);
 assert.ok(api.list().some(d=>d.name==='Family Egusi'&&d.serves===8));
 assert.ok(!api.list().some(d=>d.originalName==='Akara'));
});
test('No database scripts are loaded by the four active Menu and meal screens',()=>{
 for(const file of ['the-menu.html','menu-form.html','cook-ahead.html','this-week.html','quick-meals.html']){
  const source=read(file);
  assert.match(source,/dish-catalogue\.js/);
  assert.doesNotMatch(source,/src="supabase\.js"/);
  assert.doesNotMatch(source,/src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase/);
  if(file!=='the-menu.html'&&file!=='menu-form.html')assert.match(source,/dish-picker\.js/);
 }
});
test('Dish catalogue and form implementation are syntactically valid',()=>{
 for(const file of ['dish-catalogue.js','dish-picker.js','the-menu-cards.js','menu-form.js','quick-meals.js','cook-ahead.js','this-week.js'])assert.doesNotThrow(()=>new Function(read(file)),file);
 assert.doesNotMatch(read('menu-form.js'),/homeGirlSupabase/);
});
