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
  const catalog=window.HomeGirlDishes;
  // Dishes now come from a single browser-only catalogue.
  let samples=catalog.list();
  // Demonstration-only ingredients and descriptions, not user records.
  const previewDetails={
    "Egusi Soup":{time:"Lunch or Dinner",ingredients:["Ground egusi","Leafy vegetables","Palm oil","Stock or water","Seasoning"],preparation:"Prepare a seasoned stock, stir in egusi and simmer gently, then add vegetables near the end."},
    "Jollof Rice":{time:"Lunch or Dinner",ingredients:["Rice","Tomatoes and pepper","Onion","Oil","Stock and seasonings"],preparation:"Cook a seasoned tomato base, add rice and stock, then steam until the rice is tender."},
    "Tomato Stew":{time:"Lunch or Dinner",ingredients:["Tomatoes","Red bell pepper","Onions","Oil","Salt and seasoning"],preparation:"Blend and reduce the vegetables, then fry in oil and season to preference."},
    "Chicken Curry":{time:"Lunch or Dinner",ingredients:["Chicken","Curry seasoning","Onion","Mixed vegetables","Stock"],preparation:"Season the chicken, simmer with vegetables and stock, and adjust the curry sauce to taste."},
    "Beans & Plantain":{time:"Lunch or Dinner",ingredients:["Beans","Plantain","Onion","Palm oil","Seasoning"],preparation:"Cook the beans until tender, season, and serve with fried or roasted plantain."},
    "Moi Moi":{time:"Breakfast or Side",ingredients:["Peeled beans","Red pepper","Onion","Oil","Seasoning"],preparation:"Blend the beans with pepper and aromatics, pour into containers and steam until set."},
    "Yam & Egg Sauce":{time:"Breakfast",ingredients:["Yam","Eggs","Tomatoes","Onion","Pepper"],preparation:"Boil yam until tender and serve alongside eggs cooked with a seasoned tomato-pepper sauce."},
    "Pepper Soup":{time:"Lunch or Dinner",ingredients:["Protein of choice","Pepper soup spices","Fresh pepper","Scent leaves","Stock or water"],preparation:"Simmer the chosen protein with spices and stock until cooked, then finish with herbs."},
    "Fried Rice":{time:"Lunch or Dinner",ingredients:["Rice","Mixed vegetables","Stock","Curry seasoning","Oil"],preparation:"Part-cook rice in seasoned stock, then stir-fry with vegetables and aromatics."},
    "Akara":{time:"Breakfast or Snack",ingredients:["Peeled beans","Onion","Pepper","Salt","Frying oil"],preparation:"Blend beans with aromatics into a thick batter and fry spoonfuls until golden."}
  };
  const preview=$("menuDishPreview");
  const closePreview=$("menuPreviewClose");
  let previewTrigger=null;
  let activeDish=null;
  const editButton=$("menuPreviewEdit");
  const deleteButton=$("menuPreviewDelete");
  if(deleteButton){
    deleteButton.addEventListener("click",()=>{
      if(!activeDish)return;
      if(!window.confirm('Delete "'+activeDish.name+'" from The Menu?'))return;
      try{catalog.remove(activeDish.id);}
      catch(error){console.error(error);alert("Could not delete this dish from browser storage.");return;}
      if(preview.open)preview.close();
      activeDish=null;previewTrigger=null;samples=catalog.list();draw();
    });
  }
  if(editButton){
    editButton.addEventListener("click",()=>{
      if(!activeDish)return;
      const base=previewDetails[activeDish.originalName]||{};
      const payload={
        key:activeDish.id,
        name:activeDish.name,
        category:activeDish.category,
        bestTime:activeDish.bestTime||base?.time||"",
        serves:activeDish.serves,
        recipe:activeDish.recipe||base?.preparation||"",
        ingredients:(activeDish.ingredients?.length?activeDish.ingredients:(base?.ingredients||[]).map(name=>({name,quantity:"",unit:""})))
      };
      sessionStorage.setItem("hg-menu-demo-edit-payload",JSON.stringify(payload));
      window.location.href="menu-form.html?demoEdit=1";
    });
  }
  function openPreview(dish,trigger){
    if(!preview)return;
    previewTrigger=trigger;
    activeDish=dish;
    const detail=previewDetails[dish.originalName]||{time:"",ingredients:[],preparation:""};
    $("menuPreviewTitle").textContent=dish.name;
    $("menuPreviewMeta").textContent=dish.category+" · Serves "+dish.serves+" · "+(dish.bestTime||detail.time);
    const ingredients=$("menuPreviewIngredients");
    const ingredientNames=dish.ingredients?.length?dish.ingredients.map(item=>typeof item==="string"?item:item.name).filter(Boolean):detail.ingredients;
    ingredients.replaceChildren(...ingredientNames.map(name=>{
      const item=document.createElement("li");item.textContent=name;return item;
    }));
    $("menuPreviewPreparation").textContent=dish.recipe||detail.preparation;
    if(typeof preview.showModal==="function")preview.showModal();
    else preview.setAttribute("open","");
    closePreview?.focus();
  }
  if(preview&&closePreview){
    closePreview.addEventListener("click",()=>preview.close());
    preview.addEventListener("click",event=>{
      if(event.target===preview)preview.close();
    });
    preview.addEventListener("close",()=>{
      previewTrigger?.focus();
      previewTrigger=null;
    });
  }
  const dishIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h18M5 13c0 5 3 8 7 8s7-3 7-8M8 9c-1.5-2 0-4 1.5-5M13 10c-1.5-2 0-4 1.5-5M17 9c-1.5-2 0-4 1.5-5"/></svg>';
  for(const name of [...new Set(samples.map(d=>d.category))].sort()){
    category.add(new Option(name,name));
  }
  function draw(){
    samples=catalog.list();
    category.replaceChildren(new Option("All categories","all"));
    for(const name of [...new Set(samples.map(d=>d.category).filter(Boolean))].sort())category.add(new Option(name,name));
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
      row.tabIndex=0;
      row.setAttribute("role","button");
      row.setAttribute("aria-label","Preview "+dish.name+" information");
      row.addEventListener("click",()=>openPreview(dish,row));
      row.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          openPreview(dish,row);
        }
      });
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
  window.addEventListener("hg:dishes-changed",draw);
  draw();
})();
