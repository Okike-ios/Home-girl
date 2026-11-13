/* HG-QUICK-002 — temporary sample-dish interface.
 * No database writes or real Shopping List / Pantry integration.
 * Rows and selection have one shared DOM across laptop and phone.
 */
(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const rows = el("quickRows");
  const search = el("quickSearch");
  const filterSelect = el("quickCategory");
  const filterToggle = el("quickFilterButton");
  const filterPanel = el("quickFilterPanel");
  const status = el("quickStatus");
  const selectAll = el("quickSelectAll");
  const add = el("quickAddDish");
  const mobile = window.matchMedia("(max-width:759px)");
  if (!rows || !search || !selectAll || !add) return;

  const examples = [
    {name:"Egusi Soup",servings:2},
    {name:"Tomato Stew",servings:1},
    {name:"Chicken Curry",servings:3},
    {name:"Jollof Rice",servings:4},
    {name:"Beans & Plantain",servings:2},
    {name:"Moi Moi",servings:3}
  ];
  let nextId = 0;
  const dishes = examples.map(d => ({id:++nextId,name:d.name,servings:d.servings,selected:false,expanded:false}));
  const selectedCount = () => dishes.filter(d => d.selected).length;
  function showStatus(message) {status.textContent = message || "";}

  function matching(d) {
    const query = search.value.trim().toLowerCase();
    const filter = filterSelect.value;
    return (!query || d.name.toLowerCase().includes(query)) &&
      (filter === "all" || (filter === "selected" && d.selected) || (filter === "unselected" && !d.selected));
  }
  function updateMaster() {
    const shown = dishes.filter(matching);
    const selected = shown.filter(d => d.selected).length;
    selectAll.checked = shown.length > 0 && selected === shown.length;
    selectAll.indeterminate = selected > 0 && selected < shown.length;
    selectAll.disabled = shown.length === 0;
    const ingredientButton = el("quickCheck");
    if(ingredientButton) {
      ingredientButton.disabled = selectedCount() === 0;
      ingredientButton.textContent = "Check ingredients" + (selectedCount() ? " (" + selectedCount() + ")" : "");
    }
  }
  function createRow(d) {
    const row = document.createElement("tr");
    row.className = "quick-dish-row";
    if(d.expanded) row.classList.add("quick-open");
    row.dataset.dishId = String(d.id);
    if(d.selected) row.classList.add("quick-selected");

    const dishCell = document.createElement("td");
    dishCell.className = "quick-dish";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "quick-dish-toggle";
    toggle.setAttribute("aria-expanded",String(d.expanded));
    const arrow = document.createElement("span");
    arrow.className = "quick-arrow";
    arrow.setAttribute("aria-hidden","true");
    arrow.textContent = "⌄";
    const title = document.createElement("span");
    title.className = "quick-dish-name";
    title.textContent = d.name || "New dish";
    toggle.setAttribute("aria-label",(d.expanded?"Close ":"Edit ") + (d.name || "new dish") + " details");
    toggle.append(arrow,title);
    const nameField = document.createElement("input");
    nameField.className = "quick-name-input";
    nameField.type = "text";
    nameField.placeholder = "Dish name";
    nameField.maxLength = 100;
    nameField.value = d.name;
    nameField.setAttribute("aria-label","Dish name");
    nameField.addEventListener("input",() => {
      d.name = nameField.value;
      title.textContent = d.name || "New dish";
      toggle.setAttribute("aria-label",(d.expanded?"Close ":"Edit ") + (d.name || "new dish") + " details");
    });
    toggle.addEventListener("click",() => {
      if(!mobile.matches){nameField.focus();return}
      d.expanded = !d.expanded;
      row.classList.toggle("quick-open",d.expanded);
      toggle.setAttribute("aria-expanded",String(d.expanded));
      toggle.setAttribute("aria-label",(d.expanded?"Close ":"Edit ") + (d.name || "new dish") + " details");
      if(d.expanded) nameField.focus();
    });
    dishCell.append(toggle,nameField);

    const servingCell = document.createElement("td");
    servingCell.className = "quick-servings";
    servingCell.dataset.label = "Serving";
    const servingCopy = document.createElement("span");
    servingCopy.className = "quick-serving-copy";
    const updateServingCopy = () => {servingCopy.textContent = "Serving: " + (d.servings || "—");};
    updateServingCopy();
    const servingInput = document.createElement("input");
    servingInput.type = "number";
    servingInput.min = "1";
    servingInput.step = "1";
    servingInput.value = String(d.servings);
    servingInput.setAttribute("aria-label","Serving for " + (d.name || "new dish"));
    servingInput.addEventListener("input",() => {
      const numeric = Number(servingInput.value);
      d.servings = servingInput.value === "" ? "" : numeric;
      updateServingCopy();
    });
    servingInput.addEventListener("change",() => {
      if(!Number.isFinite(d.servings) || d.servings < 1 || !Number.isInteger(d.servings)){
        d.servings = 1; servingInput.value = "1";updateServingCopy();
      }
    });
    servingCell.append(servingCopy,servingInput);

    const shoppingCell = document.createElement("td");
    shoppingCell.className = "quick-pick";
    const shopLabel = document.createElement("label");
    shopLabel.className = "quick-pick-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = d.selected;
    checkbox.setAttribute("aria-label","Add " + (d.name || "new dish") + " to shopping list");
    const labelText = document.createElement("span");
    labelText.textContent = "Add to shopping list";
    checkbox.addEventListener("change",() => {
      d.selected = checkbox.checked;
      row.classList.toggle("quick-selected",d.selected);
      updateMaster();
      if(filterSelect.value !== "all") render();
    });
    shopLabel.append(checkbox,labelText);
    shoppingCell.append(shopLabel);

    const deleteCell = document.createElement("td");
    deleteCell.className = "quick-delete";
    const deleteButton = document.createElement("button");
    deleteButton.className = "quick-delete-button";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label","Delete " + (d.name || "this dish"));
    deleteButton.title = "Delete dish";
    deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg><span>Delete dish</span>';
    deleteButton.addEventListener("click",() => {
      if(!window.confirm("Delete " + (d.name || "this dish") + " from Quick Meals?"))return;
      const at = dishes.findIndex(item => item.id===d.id);
      if(at>=0)dishes.splice(at,1);
      showStatus("");
      render();
    });
    deleteCell.append(deleteButton);
    row.append(dishCell,servingCell,shoppingCell,deleteCell);
    return {row,nameField};
  }
  function render(focusId) {
    const matches = dishes.filter(matching);
    const rowsBuilt = matches.map(createRow);
    rows.replaceChildren(...rowsBuilt.map(item => item.row));
    updateMaster();
    if(!matches.length) {
      showStatus(dishes.length ? "No dishes match your search or filter." : "No dishes yet. Tap Add dish to start.");
    }else showStatus("");
    if(focusId != null) {
      const index = matches.findIndex(d => d.id===focusId);
      if(index>=0) {
        const item=rowsBuilt[index];
        if(mobile.matches)item.row.scrollIntoView({block:"nearest"});
        item.nameField.focus();
      }
    }
  }

  add.addEventListener("click",() => {
    const d={id:++nextId,name:"",servings:1,selected:false,expanded:true};
    dishes.unshift(d);
    search.value = "";
    filterSelect.value = "all";
    render(d.id);
  });
  selectAll.addEventListener("change",() => {
    const checked = selectAll.checked;
    dishes.filter(matching).forEach(d => {d.selected=checked});
    render();
  });
  search.addEventListener("input",() => render());
  filterSelect.addEventListener("change",() => render());
  el("quickSearchAction").addEventListener("click",() => search.focus());
  filterToggle.addEventListener("click",event => {
    event.stopPropagation();
    filterPanel.hidden = !filterPanel.hidden;
    filterToggle.setAttribute("aria-expanded",String(!filterPanel.hidden));
  });
  filterPanel.addEventListener("click",event => event.stopPropagation());
  document.addEventListener("click",() => {
    filterPanel.hidden = true;
    filterToggle.setAttribute("aria-expanded","false");
  });
  document.addEventListener("keydown",event => {
    if(event.key==="Escape") {
      filterPanel.hidden = true;
      filterToggle.setAttribute("aria-expanded","false");
    }
  });
  el("quickClear").addEventListener("click",() => {
    if(!dishes.length)return;
    if(!window.confirm("Clear all Quick Meals dishes? This will not archive them."))return;
    dishes.splice(0,dishes.length);
    search.value="";
    filterSelect.value="all";
    render();
  });

  let swipe=null;
  document.addEventListener("touchstart",event=>{
    if(!mobile.matches || event.touches.length!==1 || event.target.closest("input,button,a,select")){swipe=null;return}
    const p=event.touches[0];swipe={x:p.clientX,y:p.clientY,t:Date.now()};
  },{passive:true});
  document.addEventListener("touchend",event=>{
    if(!swipe||!mobile.matches||event.changedTouches.length!==1)return;
    const p=event.changedTouches[0],dx=p.clientX-swipe.x,dy=p.clientY-swipe.y,dt=Date.now()-swipe.t;swipe=null;
    if(dx>95&&Math.abs(dy)<55&&dx>Math.abs(dy)*1.7&&dt<850)window.location.href="nourishment-os.html";
  },{passive:true});
  render();
})();
