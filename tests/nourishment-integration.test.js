'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const n=path.join(root,'nourishment');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const screens=['nourishment-os.html','the-menu.html','menu-form.html','cook-ahead.html','this-week.html'];
const scripts=['supabase.js','the-menu.js','menu-form.js','cook-ahead.js','this-week.js'];
const styles=['nourishment-os.css','the-menu.css','menu-form.css','cook-ahead.css','this-week.css','homegirl-integration.css'];

test('Nourishment opens from existing Home Girl Home Screen',()=>{
 const home=read('index.html');
 assert.match(home,/href="nourishment\/nourishment-os\.html"/);
 assert.doesNotMatch(home,/data-os="Nourishment OS"/);
});
test('Five original screens load the unified Home Girl shell',()=>{
 for(const file of screens){
  const html=read('nourishment/'+file);
  assert.match(html,/class="hg-shell-nav"/);
  assert.match(html,/class="hg-mobile-shell"/);
  assert.match(html,/homegirl-integration\.css/);
  assert.match(html,/data-hg-section=/);
  assert.doesNotMatch(html,/href="nourishment\.html"/);
 }
});
test('Every local script, stylesheet and linked page exists',()=>{
 for(const file of screens){
  const html=read('nourishment/'+file);
  for(const [,target] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(target.startsWith('#')||/^(?:https?:|data:|mailto:)/i.test(target))continue;
   assert.ok(fs.existsSync(path.resolve(n,target.split('?')[0])),file+' → missing '+target);
  }
 }
});
test('Preserve original interactive JavaScript and valid syntax',()=>{
 for(const name of scripts){
  const code=read('nourishment/'+name);
  assert.ok(code.length>100,name+' looks empty');
  assert.doesNotThrow(()=>new Function(code),name+' invalid JavaScript');
 }
 assert.match(read('nourishment/cook-ahead.js'),/addDishButton/);
 assert.match(read('nourishment/this-week.js'),/createDayRow/);
 assert.match(read('nourishment/menu-form.js'),/ingredients-list|ingredientsList/);
});
test('Keep unique Nourishment accent identities within Rich Soft Premium',()=>{
 const css=read('nourishment/homegirl-integration.css');
 for(const c of ['.card.menu','.card.cook','.card.week','.card.maker','.card.shopping','.card.pantry','.card.history']){
  assert.ok(css.includes(c),'Missing '+c);
 }
 assert.match(css,/--hg-plum:/);
 assert.match(css,/\.hg-shell-nav/);
 assert.match(css,/\[data-hg-section="landing"\]/);
});
test('Nourishment meal week and household week remain distinct',()=>{
 assert.match(read('nourishment/nourishment-os.html'),/href="this-week\.html"/);
 assert.match(read('index.html'),/data-view="week"/);
});
