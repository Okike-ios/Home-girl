/* HG-NOUR-002 — one accessible searchable selector for all meal modules. */
(function(){
"use strict";
const api=window.HomeGirlDishes;
if(!api)return;
const targets=".dish-input, .component-input, .quick-name-input";
let active=null;
const dialog=document.createElement("dialog");
dialog.className="hg-dish-picker";
dialog.setAttribute("aria-label","Choose a dish from The Menu");
dialog.innerHTML='<div class="hg-picker-panel"><header><h2>Choose from The Menu</h2><button type="button" class="hg-picker-close" aria-label="Close dish selector">×</button></header><input type="search" class="hg-picker-search" placeholder="Search dishes" aria-label="Search Menu dishes"><div class="hg-picker-results"></div><p class="hg-picker-message" role="status"></p><a class="hg-picker-create" href="menu-form.html">+ Add a new dish to The Menu</a></div>';
document.body.appendChild(dialog);
const search=dialog.querySelector(".hg-picker-search"),results=dialog.querySelector(".hg-picker-results"),message=dialog.querySelector(".hg-picker-message");
const style=document.createElement("style");
style.textContent='.hg-dish-picker{border:0;border-radius:18px;padding:0;background:#f8f0e5;color:#4a2236;box-shadow:0 16px 60px #23101b66;max-width:min(92vw,480px);width:100%}.hg-dish-picker::backdrop{background:#24121ab0}.hg-picker-panel{padding:20px;display:grid;gap:12px}.hg-picker-panel header{display:flex;justify-content:space-between;align-items:center;gap:10px}.hg-picker-panel h2{margin:0;font-size:1.3rem}.hg-picker-close{background:transparent;border:0;font-size:2rem;color:inherit;cursor:pointer}.hg-picker-search{width:100%;padding:12px;border:1px solid #c7aab5;border-radius:9px;background:white;color:#321b27}.hg-picker-results{max-height:45vh;overflow:auto;display:grid;gap:6px}.hg-picker-option{background:#fffaf5;border:1px solid #e1d3d4;border-radius:10px;text-align:left;padding:10px 12px;color:#4a2236;cursor:pointer}.hg-picker-option small{display:block;opacity:.75;margin-top:3px}.hg-picker-create{color:#74264f;font-weight:700;text-decoration:underline}.hg-picker-message{margin:0;font-size:.9rem}.dish-input[readonly],.component-input[readonly],.quick-name-input[readonly]{cursor:pointer}';
document.head.appendChild(style);
function draw(){
 results.replaceChildren();
 try{
  const dishes=api.list().filter(d=>(d.name+" "+(d.category||"")).toLowerCase().includes(search.value.trim().toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  message.textContent=dishes.length?"":"No matching dishes. Add one to The Menu.";
  for(const dish of dishes){
   const btn=document.createElement("button");btn.type="button";btn.className="hg-picker-option";
   const name=document.createElement("strong");name.textContent=dish.name;
   const meta=document.createElement("small");meta.textContent=(dish.category||"Uncategorized")+" · Serves "+dish.serves;
   btn.append(name,meta);
   btn.addEventListener("click",()=>{
    if(!active||!active.isConnected)return;
    active.value=dish.name;active.dataset.dishId=dish.id;
    active.dispatchEvent(new Event("input",{bubbles:true}));
    active.dispatchEvent(new Event("change",{bubbles:true}));
    dialog.close();
   });
   results.append(btn);
  }
 }catch(e){message.textContent="Could not read locally saved dishes. Check your browser storage.";console.error(e);}
}
function open(input){
 active=input;search.value="";draw();
 if(!dialog.open)dialog.showModal();
 search.focus();
}
function attach(input){
 if(input.dataset.hgDishPicker)return;
 input.dataset.hgDishPicker="1";input.readOnly=true;
 input.setAttribute("aria-haspopup","dialog");
 input.title="Select a dish from The Menu";
 try{
  const match=api.list().find(d=>d.name.toLowerCase()===input.value.trim().toLowerCase());
  if(match)input.dataset.dishId=match.id;
 }catch(e){console.error(e);}
 input.addEventListener("click",()=>open(input));
 input.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "||e.key==="ArrowDown"){e.preventDefault();open(input);}});
}
function scan(){document.querySelectorAll(targets).forEach(attach);}
const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});
dialog.querySelector(".hg-picker-close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
dialog.addEventListener("close",()=>{if(active&&active.isConnected)active.focus();});
search.addEventListener("input",draw);
window.addEventListener("hg:dishes-changed",draw);
scan();
})();
