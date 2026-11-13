/* HG-MENU-002 — sample-only Menu card renderer.
 * No Supabase requests, dish writes, or production record mutations.
 * Original the-menu.js and menu-form.html remain in the repo untouched.
 */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const list=$("menuCards"), input=$("menuSearch");
  const category=$("menuCategoryFilter"), panel=$("menuFilterPanel");
  const filterButton=$("menuFilterButton");
  if(!list||!input||!category||!filterButton)return;
  const samples=[
    {name:"Egusi Soup",category:"Soups & Stews",serves:4},
    {name:"Jollof Rice",category:"Rice Dishes",serves:4},
    {name:"Tomato Stew",category:"Soups & Stews",serves:6},
    {name:"Chicken Curry",category:"Main Dishes",serves:3},
    {name:"Beans & Plantain",category:"Main Dishes",serves:2},
    {name:"Moi Moi",category:"Sides & Snacks",serves:4},
    {name:"Yam & Egg Sauce",category:"Breakfast",serves:2},
    {name:"Pepper Soup",category:"Soups & Stews",serves:3},
    {name:"Fried Rice",category:"Rice Dishes",serves:4},
    {name:"Akara",category:"Breakfast",serves:3}
  ];
  const dishIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h18M5 13c0 5 3 8 7 8s7-3 7-8M8 9c-1.5-2 0-4 1.5-5M13 10c-1.5-2 0-4 1.5-5M17 9c-1.5-2 0-4 1.5-5"/></svg>';
  for(const name of [...new Set(samples.map(d=>d.category))].sort()){
    category.add(new Option(name,name));
  }
  function draw(){
    const query=input.value.trim().toLocaleLowerCase();
    const selected=category.value;
    const visible=samples.filter(d=>
      (selected==="all"||d.category===selected)&&
      (!query||(d.name+" "+d.category).toLocaleLowerCase().includes(query))
    );
    const fragment=document.createDocumentFragment();
    for(const dish of visible){
      const row=document.createElement("article");
      row.className="menu-card";
      const icon=document.createElement("div");
      icon.className="menu-card-visual";
      icon.innerHTML=dishIcon;
      const info=document.createElement("div");
      info.className="menu-card-info";
      const title=document.createElement("h3");
      title.textContent=dish.name;
      const details=document.createElement("p");
      details.textContent=dish.category+" · Serves "+dish.serves;
      info.append(title,details);
      const badge=document.createElement("span");
      badge.className="menu-card-category";
      badge.textContent=dish.category;
      row.append(icon,info,badge);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    $("menuEmpty").hidden=visible.length!==0;
    $("menuCount").textContent=visible.length+" "+(visible.length===1?"dish":"dishes");
  }
  function closePanel(){panel.hidden=true;filterButton.setAttribute("aria-expanded","false");}
  input.addEventListener("input",draw);
  category.addEventListener("change",draw);
  $("menuSearchButton").addEventListener("click",()=>input.focus());
  filterButton.addEventListener("click",event=>{
    event.stopPropagation();
    panel.hidden=!panel.hidden;
    filterButton.setAttribute("aria-expanded",String(!panel.hidden));
  });
  panel.addEventListener("click",event=>event.stopPropagation());
  document.addEventListener("click",closePanel);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closePanel();});
  $("menuResetFilters").addEventListener("click",()=>{
    input.value="";
    category.value="all";
    closePanel();
    draw();
  });
  const mobile=window.matchMedia("(max-width:759px)");
  let swipe=null;
  document.addEventListener("touchstart",event=>{
    if(!mobile.matches||event.touches.length!==1||event.target.closest("input,button,a,select")){swipe=null;return;}
    const p=event.touches[0];swipe={x:p.clientX,y:p.clientY,t:Date.now()};
  },{passive:true});
  document.addEventListener("touchend",event=>{
    if(!swipe||!mobile.matches||event.changedTouches.length!==1)return;
    const p=event.changedTouches[0],dx=p.clientX-swipe.x,dy=p.clientY-swipe.y,dt=Date.now()-swipe.t;swipe=null;
    if(dx>95&&Math.abs(dy)<55&&dx>Math.abs(dy)*1.7&&dt<850)location.href="nourishment-os.html";
  },{passive:true});
  draw();
})();
