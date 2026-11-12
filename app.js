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
function showView(view){const home=view==='home';const detail=views[view];if(!home&&!detail)return;document.querySelector('#view-home').classList.toggle('is-active',home);document.querySelector('#view-generic').classList.toggle('is-active',!home);if(!home){document.querySelector('#placeholder-title').textContent=detail.title;document.querySelector('#placeholder-description').textContent=detail.desc;document.querySelector('#placeholder-overline').textContent=view.endsWith('OS')||view==='Financial System'?'OPERATING SYSTEM':'HOME GIRL WORKSPACE';document.querySelector('#placeholder-icon use').setAttribute('href','#i-'+detail.icon)}document.querySelectorAll('[data-view]').forEach(b=>{const isActive=b.dataset.view===view;b.classList.toggle('active',isActive&&b.classList.contains('nav-item'));b.classList.toggle('selected',isActive&&b.parentElement.classList.contains('mobile-bottom-nav'));if(isActive)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});const dots=document.querySelector('#mobile-page-dots');if(dots){dots.hidden=!['home','calendar','shopping'].includes(view);dots.querySelectorAll('.page-dot').forEach(b=>{const selected=b.dataset.view===view;b.classList.toggle('is-current',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}document.title=(home?'Welcome Home':detail.title)+' · Home Girl';window.scrollTo({top:0,behavior:'instant'})}
document.addEventListener('click',e=>{const nav=e.target.closest('[data-view]');if(nav){showView(nav.dataset.view);return}const os=e.target.closest('[data-os]');if(os)showView(os.dataset.os)});
// Mobile swipe: Home center, Calendar to the left and Shopping List to the right.
// Swiping left from Home opens Shopping List; swiping right opens Calendar.
let startX=null,startY=null;const main=document.querySelector('#main-content');main.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;startX=e.touches[0].clientX;startY=e.touches[0].clientY},{passive:true});main.addEventListener('touchend',e=>{if(startX===null||innerWidth>=760)return;const dx=e.changedTouches[0].clientX-startX;const dy=e.changedTouches[0].clientY-startY;startX=null;startY=null;if(Math.abs(dx)<90||Math.abs(dy)>Math.abs(dx)*.65)return;if(document.querySelector('#view-home').classList.contains('is-active'))showView(dx>0?'calendar':'shopping');else if(document.querySelector('#view-generic').classList.contains('is-active'))showView('home')},{passive:true});
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
