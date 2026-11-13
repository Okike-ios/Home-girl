/* HG-QUICK-001 — interface prototype: Menu reading and local 1–4 meal selection.
 * Quick Meals has no cooking cycle, batch maths or date range.
 * Pantry availability, stock deductions, Shopping List and History intentionally
 * remain unconnected until approved shared-data workflows are implemented.
 */
(() => {
  "use strict";
  const get = id => document.getElementById(id);
  const rows = get("quickRows");
  const search = get("quickSearch");
  const category = get("quickCategory");
  const status = get("quickStatus");
  const counter = get("quickCounter");
  const check = get("quickCheck");
  const filter = get("quickFilterButton");
  const filterPanel = get("quickFilterPanel");
  if (!rows || !search || !category) return;
  const chosen = new Map();
  let menu = [];
  const mobile = window.matchMedia("(max-width:759px)");

  const safeString = value => typeof value === "string" ? value : "";
  function identity(dish, index) {
    return String(dish.id ?? dish.dish_id ?? ("menu-" + index));
  }
  function updateCount() {
    counter.textContent = chosen.size + " / 4 meals";
    check.disabled = chosen.size === 0;
    check.textContent = chosen.size ? "Check ingredients for " + chosen.size + (chosen.size === 1 ? " meal" : " meals") : "Check ingredients";
  }
  function buildRow(dish, index) {
    const id = identity(dish,index);
    const row = document.createElement("tr");
    row.className = "quick-dish-row";
    row.dataset.dishId = id;
    const name = safeString(dish.dish_name) || "Unnamed dish";
    const cat = safeString(dish.category) || "Uncategorised";
    const serves = Math.max(1,Number(dish.serves) || 1);

    const titleCell = document.createElement("td");
    titleCell.className = "quick-dish";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "quick-dish-toggle";
    toggle.setAttribute("aria-expanded","false");
    toggle.setAttribute("aria-label","Open " + name + " details");
    const arrow = document.createElement("span");
    arrow.className = "quick-arrow";
    arrow.setAttribute("aria-hidden","true");
    arrow.textContent = "⌄";
    const text = document.createElement("span");
    text.className = "quick-dish-name";
    text.textContent = name;
    toggle.append(arrow,text);
    titleCell.append(toggle);

    const catCell = document.createElement("td");
    catCell.className = "quick-category";
    catCell.dataset.label = "Category";
    catCell.textContent = cat;

    const servingsCell = document.createElement("td");
    servingsCell.className = "quick-servings";
    servingsCell.dataset.label = "Servings";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.max = "100";
    input.value = String(serves);
    input.setAttribute("aria-label","Servings for " + name);
    const servingCopy = document.createElement("span");
    servingCopy.className = "quick-serving-copy";
    servingCopy.textContent = "Servings: " + serves;
    input.addEventListener("input",() => {
      servingCopy.textContent = "Servings: " + (input.value || "—");
      if(chosen.has(id))chosen.get(id).servings = Number(input.value);
    });
    servingsCell.append(servingCopy,input);

    const ingredientCell = document.createElement("td");
    ingredientCell.className = "quick-ingredients";
    ingredientCell.dataset.label = "Ingredients";
    ingredientCell.textContent = "Check pending";

    const pickCell = document.createElement("td");
    pickCell.className = "quick-pick";
    const checkLabel = document.createElement("label");
    checkLabel.className = "quick-pick-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label","Select " + name + " for Quick Meals");
    const selectText = document.createElement("span");
    selectText.textContent = "Select meal";
    checkLabel.append(checkbox,selectText);
    pickCell.append(checkLabel);

    checkbox.addEventListener("change",() => {
      if(checkbox.checked) {
        if(chosen.size>=4) {
          checkbox.checked = false;
          status.textContent = "You can select a maximum of four quick meals.";
          return;
        }
        chosen.set(id,{dish,servings:Number(input.value)});
        row.classList.add("quick-selected");
      }else {
        chosen.delete(id);
        row.classList.remove("quick-selected");
      }
      status.textContent = "";
      updateCount();
      renderOrder();
    });
    toggle.addEventListener("click",() => {
      if(!mobile.matches)return;
      const open = !row.classList.contains("quick-open");
      row.classList.toggle("quick-open",open);
      toggle.setAttribute("aria-expanded",String(open));
      toggle.setAttribute("aria-label",(open?"Close ":"Open ") + name + " details");
    });

    row.append(titleCell,catCell,servingsCell,ingredientCell,pickCell);
    return row;
  }
  function renderOrder() {
    const q = search.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const shown = menu
      .map((dish,index) => ({dish,index,id:identity(dish,index)}))
      .filter(({dish}) => {
        const name = safeString(dish.dish_name).toLowerCase();
        const cat = safeString(dish.category).toLowerCase();
        return (!q || name.includes(q) || cat.includes(q)) &&
          (selectedCategory === "all" || cat === selectedCategory);
      })
      .sort((a,b) => Number(chosen.has(b.id))-Number(chosen.has(a.id)) || a.index-b.index);
    rows.replaceChildren(...shown.map(({dish,index}) => buildRow(dish,index)));
    // Restore selection and servings after reordering/filtering.
    rows.querySelectorAll("tr").forEach(row => {
      const selected = chosen.get(row.dataset.dishId);
      if(!selected)return;
      row.querySelector('input[type="checkbox"]').checked = true;
      row.querySelector('input[type="number"]').value = String(selected.servings);
      row.querySelector(".quick-serving-copy").textContent = "Servings: " + selected.servings;
      row.classList.add("quick-selected");
    });
    if(!shown.length)status.textContent = menu.length ? "No Menu dishes match your search or filter." : "No dishes are available in The Menu yet.";
    else if(!status.textContent.startsWith("You can select")) status.textContent = "";
  }
  filter.addEventListener("click",event => {
    event.stopPropagation();
    const open = filterPanel.hidden;
    filterPanel.hidden = !open;
    filter.setAttribute("aria-expanded",String(open));
  });
  filterPanel.addEventListener("click",event=>event.stopPropagation());
  document.addEventListener("click",()=>{filterPanel.hidden=true;filter.setAttribute("aria-expanded","false");});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"){filterPanel.hidden=true;filter.setAttribute("aria-expanded","false");}});
  get("quickSearchAction").addEventListener("click",()=>search.focus());
  search.addEventListener("input",renderOrder);
  category.addEventListener("change",renderOrder);
  get("quickClear").addEventListener("click",() => {
    if(!chosen.size)return;
    if(!window.confirm("Clear all selected Quick Meals?"))return;
    chosen.clear();
    status.textContent = "";
    updateCount();
    renderOrder();
  });
  check.addEventListener("click",() => {
    window.alert("Ingredient checking requires connected Menu recipe ingredients and Pantry stock. No stock was deducted and no shopping list was created.");
  });
  let swipe = null;
  document.addEventListener("touchstart",event => {
    if(!mobile.matches || event.touches.length!==1 || event.target.closest("input,button,a,select")) {swipe=null;return;}
    const p=event.touches[0];swipe={x:p.clientX,y:p.clientY,t:Date.now()};
  },{passive:true});
  document.addEventListener("touchend",event => {
    if(!swipe||!mobile.matches || event.changedTouches.length!==1)return;
    const p=event.changedTouches[0],dx=p.clientX-swipe.x,dy=p.clientY-swipe.y,dt=Date.now()-swipe.t;
    swipe=null;
    if(dx>95&&Math.abs(dy)<55&&dx>Math.abs(dy)*1.7&&dt<850)location.href="nourishment-os.html";
  },{passive:true});

  async function loadMenu() {
    try {
      if(!window.homeGirlSupabase)throw new Error("Menu connection is unavailable.");
      const {data,error} = await window.homeGirlSupabase.from("dishes").select("*").order("created_at",{ascending:false});
      if(error)throw error;
      menu = Array.isArray(data)?data:[];
      const cats = [...new Set(menu.map(d=>safeString(d.category).trim()).filter(Boolean))].sort();
      cats.forEach(cat => {
        const option=document.createElement("option");
        option.value=cat.toLowerCase();option.textContent=cat;
        category.append(option);
      });
      status.textContent = "";
      renderOrder();
    }catch(error){
      console.error("Quick Meals: Menu retrieval failed",error);
      status.textContent = "Could not load dishes from The Menu. Check your connection and try refreshing.";
    }
  }
  updateCount();
  loadMenu();
})();
