'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

function fixture() {
  const elMap = new Map();
  const storage = new Map();
  function el(id) {
    if(!elMap.has(id)) elMap.set(id,{
      id,value:'',textContent:'',innerHTML:'',hidden:false,open:false,listeners:{},
      addEventListener(event,fn){this.listeners[event]=fn;},
      setAttribute(){},removeAttribute(){},focus(){},reset(){},reportValidity(){return true;},
      showModal(){this.open=true;},close(){this.open=false;},remove(){}
    });
    return elMap.get(id);
  }
  const document = {
    getElementById:el,querySelectorAll:()=>[],addEventListener(){},
    createElement:()=>({setAttribute(){},remove(){}}),body:{appendChild(){}}
  };
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
  const win={addEventListener(){},showView(view){win.HomeGirlPlanner.render(view)}};
  const sandbox={document,localStorage,window:win,setInterval:()=>0,setTimeout:()=>0,confirm:()=>true,crypto:{randomUUID:()=>String(Math.random())},Date,Intl,console};
  const source=fs.readFileSync(path.join(__dirname,'..','planner.js'),'utf8');
  vm.runInNewContext(source,sandbox,{filename:'planner.js'});
  const api=win.HomeGirlPlanner;
  function action(name,id='',more={}) {
    const target={dataset:{planAction:name,id,...more}};
    el('planner-content').listeners.click({target:{closest:()=>target}});
  }
  function submit(values) {
    el('planner-new').listeners.click();
    for(const [id,value] of Object.entries(values))el(id).value=value;
    el('planner-form').listeners.submit({preventDefault(){}});
  }
  const saved=()=>JSON.parse(storage.get('homegirl-planner-v1')||'{"tasks":[],"reminders":[]}');
  return {el,storage,api,action,submit,saved};
}
function localDate(date=new Date()) {
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
test('calendar renders and its date tiles open day details',()=>{
  const f=fixture();f.api.render('calendar');
  assert.match(f.el('planner-content').innerHTML,/planner-calendar-grid/);
  f.action('select-date','',{date:'2026-11-18'});
  assert.match(f.el('planner-content').innerHTML,/Showing .*Nov 18.* from Calendar/);
  assert.match(f.el('planner-content').innerHTML,/data-plan-action="date-reminders"/);
});
test('new tasks persist, complete and remain in history',()=>{
  const f=fixture();f.api.render('tasks');
  f.submit({'planner-title':'Sort pantry','planner-date':localDate(),'planner-area':'Home Care','planner-notes':'Check shelves'});
  assert.equal(f.saved().tasks.length,1);
  const id=f.saved().tasks[0].id;
  f.el('planner-content').listeners.change({target:{closest:()=>({dataset:{planAction:'toggle-task',id}})}});
  assert.equal(f.saved().tasks[0].status,'completed');
  f.action('task-tab','',{tab:'completed'});
  assert.match(f.el('planner-content').innerHTML,/Sort pantry/);
});
test('overdue tasks can be rescheduled or dismissed, without deleting history',()=>{
  const f=fixture();
  f.api.render('tasks');f.submit({'planner-title':'Old task','planner-date':'2020-01-02'});
  const id=f.saved().tasks[0].id;
  assert.match(f.el('planner-content').innerHTML,/Overdue \(1\)/);
  f.action('reschedule-task',id);assert.equal(f.el('planner-dialog').open,true);
  f.el('planner-dialog').close();
  f.action('dismiss-task',id);
  assert.equal(f.saved().tasks[0].status,'dismissed');
});
test('one-time and repeating reminders persist and can be acknowledged',()=>{
  const f=fixture();f.api.render('reminders');
  f.submit({'planner-title':'Water herbs','planner-date':'2020-01-02','planner-time':'06:00','planner-repeat':'daily'});
  const item=f.saved().reminders[0];
  assert.equal(item.repeat,'daily');
  f.action('ack-reminder',item.id);
  const updated=f.saved().reminders[0];
  assert.match(updated.acknowledged,new RegExp('^'+localDate()+'T06:00'));
  assert.equal(updated.date,'2020-01-02');
});
test('weekly overview is distinct from nourishment planning',()=>{
  const f=fixture();f.api.render('week');
  assert.match(f.el('planner-content').innerHTML,/household-wide overview/i);
  assert.match(f.el('planner-content').innerHTML,/planner-week-grid/);
});
