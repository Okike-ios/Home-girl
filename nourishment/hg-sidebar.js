/* HG-NOUR-002: same saved collapse control as the Home Girl desktop sidebar. */
(()=>{
 'use strict';
 const sidebar=document.getElementById('desktop-sidebar');
 const toggle=document.getElementById('sidebar-edge-toggle');
 if(!sidebar||!toggle)return;
 const storeKey='homegirl-sidebar-collapsed';
 function setCollapsed(collapsed){
   document.body.classList.toggle('sidebar-collapsed',collapsed);
   toggle.setAttribute('aria-expanded',String(!collapsed));
   toggle.setAttribute('aria-label',collapsed?'Expand sidebar':'Collapse sidebar');
   toggle.title=collapsed?'Expand sidebar':'Collapse sidebar';
   sidebar.querySelectorAll('.nav-item').forEach(link=>{
     const label=link.querySelector('.nav-text');
     if(label)link.title=collapsed?label.textContent.trim():'';
   });
   try{localStorage.setItem(storeKey,collapsed?'1':'0')}catch{}
 }
 let collapsed=false;
 try{collapsed=localStorage.getItem(storeKey)==='1'}catch{}
 setCollapsed(collapsed);
 toggle.addEventListener('click',()=>setCollapsed(!document.body.classList.contains('sidebar-collapsed')));
})();
