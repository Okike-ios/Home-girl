'use strict';
// Home-screen-only prototype. No Nourishment or other OS business logic is modified.
const welcomeLines=[
  ['Welcome home, {name} ♡','What would you like to do today?'],
  ['A lovely day to begin, {name}.','One thoughtful step at a time.'],
  ['Good to have you home, {name}.','A little care makes a beautiful difference.'],
  ['Hello again, {name} ♡','Your home, your pace, your way.'],
  ['Here’s to today, {name}.','Progress can be quiet. It still counts.'],
  ['Welcome back, {name}.','Even small routines can make life feel lighter.'],
  ['Take your time, {name}.','There is room for rest and for getting things done.'],
  ['Home looks good on you, {name}.','What matters most today?']
];
const views={
 dashboard:{title:'Household Dashboard',desc:'Your household overview will connect information from the six operating systems. This is a reserved destination, not a completed dashboard.',icon:'grid'},
 shop:{title:'Shop',desc:'The future marketplace for registered and invited vendors is not part of this Home Screen milestone.',icon:'store'},
 shopping:{title:'Shopping List',desc:'Multiple named shopping lists are planned. Their item-entry and inventory workflows are outside this build.',icon:'list'},
 calendar:{title:'Calendar',desc:'Calendar will open My Tasks filtered to the selected date, with shortcuts for reminders and events. This feature is not implemented here.',icon:'calendar'},
 tasks:{title:'My Tasks',desc:'Tasks, completion history and overdue resolution belong to a later implementation milestone.',icon:'check'},
 reminders:{title:'Reminders',desc:'Reminders are user-configured alerts. Their scheduling and delivery are not implemented in this Home Screen prototype.',icon:'alarm'},
 notifications:{title:'Notifications',desc:'Your notification inbox is a planned workspace. No notification records are being generated in this prototype.',icon:'bell'},
 settings:{title:'Settings',desc:'Global appearance, sound, privacy and reminder preferences will be available here in a later milestone.',icon:'settings'},
 week:{title:'This Week',desc:'A household-wide weekly overview will summarize tasks, activities and events. It is distinct from Nourishment’s meal planner.',icon:'calendar'},
 'Nourishment OS':{title:'Nourishment OS',desc:'The existing Nourishment modules and Cart business rules are outside this Home Screen redesign.',icon:'chef'},
 'Home Care OS':{title:'Home Care OS',desc:'The Home Care workspace will be connected in a future development phase.',icon:'home'},
 'Personal & Well-being OS':{title:'Personal & Well-being OS',desc:'The Personal & Well-being workspace will be connected in a future development phase.',icon:'lotus'},
 'Home Improvement OS':{title:'Home Improvement OS',desc:'The Home Improvement workspace will be connected in a future development phase.',icon:'tools'},
 'Events OS':{title:'Events OS',desc:'The Events workspace will be connected in a future development phase.',icon:'calendar'},
 'Financial System':{title:'Financial System',desc:'The Financial System workspace will be connected in a future development phase.',icon:'coins'}
};
function getName(){try{return (localStorage.getItem('homegirl-preferred-name')||'Friend').trim().slice(0,32)||'Friend'}catch{return 'Friend'}}
function setWelcome(){let index=0;try{const prev=Number(sessionStorage.getItem('homegirl-last-welcome'));index=(Number.isInteger(prev)&&prev>=0&&prev<welcomeLines.length)?(prev+1+Math.floor(Math.random()*(welcomeLines.length-1)))%welcomeLines.length:Math.floor(Math.random()*welcomeLines.length);sessionStorage.setItem('homegirl-last-welcome',String(index))}catch{index=Math.floor(Math.random()*welcomeLines.length)}const [title,sub]=welcomeLines[index];document.querySelector('#welcome-title').textContent='Welcome back, '+getName()+'.';document.querySelector('#welcome-subtitle').textContent=sub}
// A history entry captures the previous screen and its exact planning state.
const navigationHistory=[];
let currentView=null;
function captureScreen(){
  return {view:currentView, scrollY:window.scrollY||0,
    planner:window.HomeGirlPlanner&&window.HomeGirlPlanner.snapshot?window.HomeGirlPlanner.snapshot():null};
}
function showView(view,options={}){
 const home=view==='home',detail=views[view];
 if(!home&&!detail)return;
 const goingBack=options.back===true;
 if(!goingBack&&currentView&&currentView!==view){
   navigationHistory.push(captureScreen());
   // A bounded history avoids unlimited growth during long phone sessions.
   if(navigationHistory.length>80)navigationHistory.shift();
 }
 currentView=view;
 const planner=['calendar','tasks','reminders','week'].includes(view);
 document.querySelector('#view-home').classList.toggle('is-active',home);
 document.querySelector('#view-planner').classList.toggle('is-active',planner);
 document.querySelector('#view-generic').classList.toggle('is-active',!home&&!planner);
 if(planner&&window.HomeGirlPlanner){
   if(goingBack&&options.restore&&options.restore.planner&&window.HomeGirlPlanner.restore){
     window.HomeGirlPlanner.restore(options.restore.planner);
   }
   window.HomeGirlPlanner.render(view);
 }
 if(!home&&!planner){
   document.querySelector('#placeholder-title').textContent=detail.title;
   document.querySelector('#placeholder-description').textContent=detail.desc;
   document.querySelector('#placeholder-overline').textContent=view.endsWith('OS')||view==='Financial System'?'OPERATING SYSTEM':'HOME GIRL WORKSPACE';
   document.querySelector('#placeholder-icon use').setAttribute('href','#i-'+detail.icon);
 }
 document.querySelectorAll('[data-view]').forEach(b=>{
   const active=b.dataset.view===view;
   b.classList.toggle('active',active&&b.classList.contains('nav-item'));
   b.classList.toggle('selected',active&&b.parentElement.classList.contains('mobile-bottom-nav'));
   if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
 const dots=document.querySelector('#mobile-page-dots');
 if(dots){
   dots.hidden=!['home','calendar','shopping'].includes(view);
   dots.querySelectorAll('.page-dot').forEach(b=>{
     const selected=b.dataset.view===view;
     b.classList.toggle('is-current',selected);
     if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
   });
 }
 document.title=(home?'Welcome Home':detail.title)+' · Home Girl';
 window.scrollTo({top:goingBack&&options.restore?options.restore.scrollY:0,behavior:'instant'});
}
function goBack(){
 while(navigationHistory.length){
   const entry=navigationHistory.pop();
   if(entry.view&&entry.view!==currentView){
     showView(entry.view,{back:true,restore:entry});
     return true;
   }
 }
 return false;
}
document.addEventListener('click',e=>{const nav=e.target.closest('[data-view]');if(nav){showView(nav.dataset.view);return}const os=e.target.closest('[data-os]');if(os)showView(os.dataset.os)});
// HG-NAV-003: predictable mobile gestures. Home is a fixed navigation hub:
// swipe right -> Calendar; swipe left -> Shopping List.
// Everywhere else, swipe right -> the actual previous screen.
let touchStart=null;
let suppressSwipeClickUntil=0;
function gestureBlocked(target){
 return !!(document.querySelector('#planner-dialog[open]') ||
   (target&&target.closest&&target.closest('input,textarea,select,[contenteditable],dialog,[data-gesture-ignore]')));
}
document.addEventListener('touchstart',e=>{
 touchStart=null;
 if(e.touches.length!==1||window.innerWidth>=760||gestureBlocked(e.target))return;
 touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
document.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
document.addEventListener('touchend',e=>{
 if(!touchStart||window.innerWidth>=760||e.changedTouches.length!==1){touchStart=null;return;}
 const dx=e.changedTouches[0].clientX-touchStart.x;
 const dy=e.changedTouches[0].clientY-touchStart.y;
 touchStart=null;
 // A 55px horizontal move is enough; reject vertical scrolls and diagonals.
 if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.2)return;
 // Avoid a synthesized post-touch click accidentally opening a card or page.
 suppressSwipeClickUntil=Date.now()+450;
 if(currentView==='home'){
   showView(dx>0?'calendar':'shopping');
 }else if(dx>0){
   goBack();
 }
},{passive:true});
document.addEventListener('click',e=>{
 if(window.innerWidth<760&&Date.now()<suppressSwipeClickUntil){
   suppressSwipeClickUntil=0;
   e.preventDefault();
   e.stopImmediatePropagation();
 }
},true);
// Desktop sidebar: visible toggle button and an edge-reveal chevron.
// Preserve the last choice locally and leave mobile navigation unchanged.
const shell=document.querySelector('.app-shell');
const sidebar=document.querySelector('#desktop-sidebar');
const sidebarToggles=[document.querySelector('#sidebar-edge-toggle')].filter(Boolean);
function setSidebarCollapsed(collapsed){
 shell.classList.toggle('sidebar-collapsed',collapsed);
 sidebarToggles.forEach(button=>{
  button.setAttribute('aria-expanded',String(!collapsed));
  button.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');
  button.title=collapsed?'Expand sidebar':'Collapse sidebar';
 });
 sidebar.querySelectorAll('.nav-item').forEach(button=>{
  const label=button.querySelector('.nav-text');
  if(label)button.title=collapsed?label.textContent.trim():'';
 });
 try{localStorage.setItem('homegirl-sidebar-collapsed',collapsed?'1':'0')}catch{}
}
let initialCollapse=false;try{initialCollapse=localStorage.getItem('homegirl-sidebar-collapsed')==='1'}catch{}
setSidebarCollapsed(initialCollapse);
sidebarToggles.forEach(button=>button.addEventListener('click',()=>setSidebarCollapsed(!shell.classList.contains('sidebar-collapsed'))));
setWelcome();showView('home');
