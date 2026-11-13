/* HG-PANTRY-003 — initial responsive Master Food Inventory prototype.
 * Sample data is in-memory only. No Supabase, Cart or Shopping List writes.
 * 13 columns: Item, Category, Frequency, Standard Stock, Current Stock,
 * Unit, Last Purchase, Quantity Needed, Purchase Quantity, Supplier,
 * Last Updated, Add to Shopping List, Delete. Quantity Needed = max(standard-current,0).
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const tbody = $("pantryRows"), search = $("pantrySearchInput");
  const categoryFilter = $("pantryCategoryFilter"), stockFilter = $("pantryStockFilter");
  const panel = $("pantryFilterPanel"), filterButton = $("pantryFilterButton");
  const status = $("pantryStatus");
  const mobile = matchMedia("(max-width:759px)");
  if (!tbody) return;
  let nextId=0;
  const categories=[
    "Grains & Cereals","Beans & Legumes","Meat & Poultry",
    "Fish & Seafood","Vegetables","Fruits","Tubers & Roots",
    "Oils & Fats","Spices & Seasonings","Dairy & Eggs",
    "Baking & Dry Goods","Beverages","Other"
  ];
  const frequencies=["Weekly","Biweekly","Monthly","Seasonal","Bulk"];
  const source=[
    {name:"Rice",category:"Grains & Cereals",frequency:"Monthly",standard:10,current:6,unit:"kg",supplier:"Local market"},
    {name:"Egusi",category:"Other",frequency:"Monthly",standard:3,current:1,unit:"kg",supplier:"Local market"},
    {name:"Tomatoes",category:"Vegetables",frequency:"Weekly",standard:5,current:2,unit:"kg",supplier:"Produce vendor"},
    {name:"Palm Oil",category:"Oils & Fats",frequency:"Monthly",standard:4,current:3,unit:"L",supplier:"Local market"},
    {name:"Beans",category:"Beans & Legumes",frequency:"Monthly",standard:6,current:6,unit:"kg",supplier:"Local market"},
    {name:"Onions",category:"Vegetables",frequency:"Weekly",standard:3,current:1,unit:"kg",supplier:"Produce vendor"}
  ];
  const data=source.map(x=>({
    id:++nextId,cart:false,name:x.name,category:x.category,
    frequency:x.frequency,standard:x.standard,current:x.current,unit:x.unit,
    lastPurchase:"",purchaseQty:Math.max(0,x.standard-x.current),
    supplier:x.supplier,lastUpdated:"",expanded:false
  }));
  const fields=[
    {key:"name",label:"Item",type:"text"},
    {key:"category",label:"Category",type:"select",options:categories},
    {key:"frequency",label:"Purchase frequency",type:"select",options:frequencies},
    {key:"standard",label:"Standard stock",type:"number"},
    {key:"current",label:"Current stock",type:"number"},
    {key:"unit",label:"Unit",type:"text"},
    {key:"lastPurchase",label:"Last purchase",type:"date"},
    {key:"needed",label:"Quantity needed",type:"readonly"},
    {key:"purchaseQty",label:"Purchase quantity",type:"number"},
    {key:"supplier",label:"Supplier",type:"text"},
    {key:"lastUpdated",label:"Last updated",type:"readonlyDate"},
    {key:"cart",label:"Add to shopping list",type:"check"}
  ];
  const today=()=>{
    const date=new Date();
    const pad=n=>String(n).padStart(2,"0");
    return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());
  };
  // Keep the stored ISO-style value, but display dates like the native
  // Last Purchase date field: MM/DD/YYYY, without timezone conversion.
  const displayDate=value=>{
    if(!value)return "—";
    const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match?match[2]+"/"+match[3]+"/"+match[1]:value;
  };
  const needed=d=>Math.max(0,(Number(d.standard)||0)-(Number(d.current)||0));
  const displayNum=x=>Number.isFinite(Number(x))?String(x):"0";
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
  const positive=(value)=>Number.isFinite(Number(value))&&Number(value)>=0?Number(value):0;
  const filterMatches=d=>{
    const q=search.value.toLocaleLowerCase().trim();
    return (!q||[d.name,d.category,d.supplier,d.unit].some(x=>String(x).toLocaleLowerCase().includes(q))) &&
      (categoryFilter.value==="all"||d.category===categoryFilter.value) &&
      (stockFilter.value==="all"||(stockFilter.value==="low"&&needed(d)>0)||
       (stockFilter.value==="in-stock"&&needed(d)===0)||(stockFilter.value==="cart"&&d.cart));
  };
  function refreshCategories(){
    const previous=categoryFilter.value;
    categoryFilter.replaceChildren(new Option("All categories","all"));
    categories.forEach(c=>categoryFilter.add(new Option(c,c)));
    categoryFilter.value=[...categoryFilter.options].some(x=>x.value===previous)?previous:"all";
  }
  function createItem(d){
    const row=make("tr","pantry-item-row"+(d.expanded?" pantry-open":"")+(needed(d)>0?" pantry-low":"")+(d.cart?" pantry-shopping-selected":""));
    row.dataset.id=String(d.id);
    const nameCell=make("td","pantry-item-name pantry-sticky-item");
    const toggle=make("button","pantry-item-toggle");
    toggle.type="button";toggle.setAttribute("aria-expanded",String(d.expanded));
    toggle.setAttribute("aria-label",(d.expanded?"Collapse ":"Expand ")+(d.name||"new pantry item"));
    toggle.append(make("span","pantry-chevron","⌄"),make("span","pantry-item-title",d.name||"New item"));
    toggle.addEventListener("click",()=>{
      d.expanded=!d.expanded;
      const nowFocused=d.expanded;
      render(d.id,nowFocused);
    });
    nameCell.append(toggle);
    const topMeta=make("span","pantry-item-subtitle",displayNum(d.current)+" "+d.unit+" in stock");
    nameCell.append(topMeta);
    const neededMeta=make("span","pantry-needed-subtitle","Quantity needed: "+displayNum(needed(d))+" "+d.unit);
    nameCell.append(neededMeta);
    row.append(nameCell);

    const fieldGroup=make("div","pantry-edit-fields");
    fields.forEach(field=>{
      const cell=make("td","pantry-field pantry-field-"+field.key+(field.key==="cart"?" pantry-sticky-shopping":""));
      cell.dataset.label=field.label;
      let input;
      if(field.type==="readonly"||field.type==="readonlyDate"){
        input=make("output","pantry-value");
        input.textContent=field.key==="needed"?displayNum(needed(d)):displayDate(d.lastUpdated);
      }else if(field.type==="check"){
        const label=make("label","pantry-check-label");
        input=make("input");
        input.type="checkbox";input.checked=d.cart;input.setAttribute("aria-label","Add "+(d.name||"item")+" to shopping list");
        const caption=make("span",null,"Add to shopping list");
        label.append(input,caption);
        cell.append(label);
        input.addEventListener("change",()=>{
          d.cart=input.checked;
          row.classList.toggle("pantry-shopping-selected",d.cart);
        });
      }else if(field.type==="select"){
        input=make("select","pantry-input");
        field.options.forEach(option=>input.add(new Option(option,option)));
        input.value=d[field.key];
      }else{
        input=make("input","pantry-input");
        input.type=field.type;
        input.value=d[field.key]??"";
        if(field.type==="number"){input.min="0";input.step="any";}
      }
      if(input&&field.type!=="check"){
        if(field.type!=="readonly"&&field.type!=="readonlyDate"){
          input.setAttribute("aria-label",field.label+" for "+(d.name||"new item"));
          input.addEventListener("change",()=>{
            if(field.type==="number"){d[field.key]=positive(input.value);input.value=String(d[field.key]);}
            else d[field.key]=input.value;
            d.lastUpdated=today();
            if(field.key==="standard"||field.key==="current") {
              const quantity=row.querySelector(".pantry-field-needed output");
              if(quantity)quantity.textContent=displayNum(needed(d));
              row.classList.toggle("pantry-low",needed(d)>0);
              topMeta.textContent=displayNum(d.current)+" "+d.unit+" in stock";
              neededMeta.textContent="Quantity needed: "+displayNum(needed(d))+" "+d.unit;
            }
            if(field.key==="name"){
              toggle.querySelector(".pantry-item-title").textContent=d.name||"New item";
            }
            if(field.key==="unit"){
              topMeta.textContent=displayNum(d.current)+" "+d.unit+" in stock";
              neededMeta.textContent="Quantity needed: "+displayNum(needed(d))+" "+d.unit;
            }
            const updated=row.querySelector(".pantry-field-lastUpdated output");
            if(updated)updated.textContent=displayDate(d.lastUpdated);
            if(field.key==="name"||field.key==="category")refreshCategories();
          });
        }
        cell.append(input);
      }
      fieldGroup.append(cell);
    });
    // The editable item name belongs to the first column and expanded mobile form.
    const editName=make("input","pantry-input pantry-name-edit");
    editName.type="text";editName.placeholder="Item name";editName.maxLength=100;editName.value=d.name;
    editName.setAttribute("aria-label","Edit pantry item name");
    editName.addEventListener("input",()=>{
      d.name=editName.value;
      toggle.querySelector(".pantry-item-title").textContent=d.name||"New item";
      const other=fieldGroup.querySelector(".pantry-field-name .pantry-input");
      if(other)other.value=d.name;
    });
    nameCell.append(editName);
    // No duplicated name-column data in the 13-column table.
    const duplicateNameCell=fieldGroup.querySelector(".pantry-field-name");
    if(duplicateNameCell)duplicateNameCell.remove();
    while(fieldGroup.firstChild)row.append(fieldGroup.firstChild);

    const actionCell=make("td","pantry-row-actions pantry-sticky-delete");
    const remove=make("button","pantry-delete");
    remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg><span>Delete item</span>';
    remove.type="button";remove.setAttribute("aria-label","Delete "+(d.name||"this item"));
    remove.addEventListener("click",()=>{
      if(!confirm('Delete "'+(d.name||"this item")+'" from this sample inventory?'))return;
      const index=data.findIndex(x=>x.id===d.id);if(index>=0)data.splice(index,1);
      render();
    });
    actionCell.append(remove);row.append(actionCell);
    return {row,editName};
  }
  function render(focusId,focusName=false){
    refreshCategories();
    const matches=data.filter(filterMatches);
    const built=matches.map(createItem);
    tbody.replaceChildren(...built.map(x=>x.row));
    if(matches.length===0)status.textContent=data.length?"No pantry items match your search or filters.":"No items yet. Choose Add item to begin.";
    else status.textContent="";
    if(focusName&&focusId!=null){
      const item=built.find(x=>Number(x.row.dataset.id)===focusId);
      if(item){if(mobile.matches)item.row.scrollIntoView({block:"nearest"});item.editName.focus();}
    }
  }
  $("pantryAddItem").addEventListener("click",()=>{
    const d={id:++nextId,name:"",category:"Other",frequency:"Monthly",standard:0,current:0,unit:"pcs",lastPurchase:"",purchaseQty:0,supplier:"",lastUpdated:"",cart:false,expanded:true};
    data.unshift(d);search.value="";categoryFilter.value="all";stockFilter.value="all";
    render(d.id,true);
  });
  $("pantryClear").addEventListener("click",()=>{
    if(!data.length)return;
    if(!confirm("Delete all sample Pantry items? This does not alter actual stock records."))return;
    data.splice(0,data.length);render();
  });
  $("pantrySearchButton").addEventListener("click",()=>search.focus());
  $("pantryFilterButton").addEventListener("click",event=>{
    event.stopPropagation();
    panel.hidden=!panel.hidden;
    filterButton.setAttribute("aria-expanded",String(!panel.hidden));
  });
  panel.addEventListener("click",event=>event.stopPropagation());
  document.addEventListener("click",()=>{panel.hidden=true;filterButton.setAttribute("aria-expanded","false");});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"){panel.hidden=true;filterButton.setAttribute("aria-expanded","false");}});
  $("pantryClearFilters").addEventListener("click",()=>{search.value="";categoryFilter.value="all";stockFilter.value="all";render();});
  [search,categoryFilter,stockFilter].forEach(e=>e.addEventListener(e===search?"input":"change",()=>render()));
  let start=null;
  document.addEventListener("touchstart",event=>{
    if(!mobile.matches||event.touches.length!==1||event.target.closest("button,input,textarea,select,a")){start=null;return;}
    const p=event.touches[0];start={x:p.clientX,y:p.clientY,time:Date.now()};
  },{passive:true});
  document.addEventListener("touchend",event=>{
    if(!start||!mobile.matches||event.changedTouches.length!==1)return;
    const p=event.changedTouches[0],dx=p.clientX-start.x,dy=p.clientY-start.y,dt=Date.now()-start.time;start=null;
    if(dx>95&&Math.abs(dy)<55&&dx>Math.abs(dy)*1.7&&dt<850)location.href="nourishment-os.html";
  },{passive:true});
  render();
})();
