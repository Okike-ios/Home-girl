'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function harness(){
  const nodes=new Map();
  const classes=()=>({values:new Set(),toggle(name,value){if(value)this.values.add(name);else this.values.delete(name)},contains(name){return this.values.has(name)}});
  function node(id){
    if(!nodes.has(id)){
      nodes.set(id,{id,innerHTML:'',textContent:'',classList:classes(),dataset:{},parentElement:{classList:classes()},
        listeners:{},hidden:false,attributes:{},title:'',
        addEventListener(name,fn){this.listeners[name]=fn},
        setAttribute(name,value){this.attributes[name]=value},
        removeAttribute(name){delete this.attributes[name]},
        querySelectorAll(){return []},querySelector(){return node('svg-use')},closest(){return null}});
    }
    return nodes.get(id);
  }
  const nav=['home','calendar','tasks','reminders','shopping'].map(view=>({dataset:{view},classList:classes(),parentElement:{classList:classes()},setAttribute(){},removeAttribute(){}}));
  const document={
    listeners:{},
    title:'',querySelector(selector){return selector==='#planner-dialog[open]'?null:node(selector)},
    querySelectorAll(selector){return selector==='[data-view]'?nav:[]},
    addEventListener(name,fn){this.listeners[name]=fn},getElementById:node};
  const window={
    scrollY:0,innerWidth:390,scrollTo({top}){this.scrollY=top},
    HomeGirlPlanner:{
      state:{calendarMonth:'2026-11-01',selectedDate:'2026-11-18',taskTab:'today',taskDateFilter:'',reminderTab:'upcoming',reminderDateFilter:''},
      snapshot(){return {...this.state}},restore(state){this.state={...state}},render(view){this.rendered=view}
    }
  };
  const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
  const context={document,window,localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null,setItem(){}},innerWidth:390,Math,console};
  vm.createContext(context);vm.runInContext(source,context);
  const swipe=(dx,dy=0,target={closest(){return null}})=>{
    document.listeners.touchstart({touches:[{clientX:180,clientY:100}],target});
    document.listeners.touchend({changedTouches:[{clientX:180+dx,clientY:100+dy}]});
  };
  return {context,window,document,node,swipe,view:()=>vm.runInContext('currentView',context)};
}

test('empty history does not navigate away from Home',()=>{
  const {context,swipe,view}=harness();
  assert.equal(view(),'home');
  swipe(120);
  assert.equal(view(),'home');
});
test('returns from date-filtered Tasks to exact Calendar month and scroll position',()=>{
  const {context,window,swipe,view}=harness();
  window.scrollY=140;
  context.showView('calendar');
  window.scrollY=320;
  context.showView('tasks');
  window.HomeGirlPlanner.state.selectedDate='2026-12-23';
  window.HomeGirlPlanner.state.calendarMonth='2026-12-01';
  swipe(130);
  assert.equal(view(),'calendar');
  assert.equal(window.HomeGirlPlanner.state.selectedDate,'2026-11-18');
  assert.equal(window.HomeGirlPlanner.state.calendarMonth,'2026-11-01');
  assert.equal(window.scrollY,320);
  swipe(110);
  assert.equal(view(),'home');
  assert.equal(window.scrollY,140);
});
test('left swipe from Home opens Shopping List; right swipe returns through history',()=>{
  const {context,swipe,view}=harness();
  swipe(-115);assert.equal(view(),'shopping');
  context.showView('reminders');
  swipe(110);assert.equal(view(),'shopping');
  swipe(110);assert.equal(view(),'home');
});
test('vertical movement and inputs do not trigger back',()=>{
  const {context,swipe,view}=harness();
  context.showView('calendar');
  swipe(120,170);
  assert.equal(view(),'calendar');
  swipe(130,0,{closest(){return {tagName:'INPUT'}}});
  assert.equal(view(),'calendar');
});
test('desktop touch gestures do not navigate',()=>{
  const {context,window,swipe,view}=harness();
  context.showView('calendar');
  window.innerWidth=1024;
  swipe(150);
  assert.equal(view(),'calendar');
});
