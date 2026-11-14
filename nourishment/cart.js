/* HG-CART-004. Local-only editable Cart interface; no cross-module imports yet. */
(() => {
  "use strict";
  const KEY = "hg-cart-items-v1";
  const tbody = document.getElementById("cartRows");
  const search = document.getElementById("cartSearch");
  const filter = document.getElementById("cartFilter");
  const estimate = document.getElementById("estimatedTotal");
  const actual = document.getElementById("actualTotal");
  const count = document.getElementById("cartCount");
  const empty = document.getElementById("cartEmpty");
  const openCards = new Set();
  const fields = ["name","quantity","unit","unitPrice","purchasedQuantity","purchasedPrice","supplier","purchased","date"];
  const numeric = new Set(["quantity","unitPrice","purchasedQuantity","purchasedPrice"]);
  const defaults = {name:"",quantity:"",unit:"",unitPrice:"",purchasedQuantity:"",purchasedPrice:"",supplier:"",purchased:false,date:""};
  const money = value => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:2}).format(value);
  const safe = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num = value => {
    const n = Number(value);
    return value === "" || !Number.isFinite(n) || n < 0 ? 0 : n;
  };
  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored.filter(x=>x && typeof x==="object" && x.id).map(x=>({
        ...defaults,...Object.fromEntries(fields.filter(f=>f in x).map(f=>[f,x[f]])),
        id:String(x.id)
      }));
    } catch(err) {
      console.warn("Cart storage unavailable",err);
      return [];
    }
  }
  // Demo rows are inserted only for a brand-new browser Cart.
  // An existing saved array (even []) is never replaced or re-seeded.
  const sampleItems = [
    {id:"demo-rice",name:"Rice",quantity:"5",unit:"kg",unitPrice:"1800",purchasedQuantity:"5",purchasedPrice:"9200",supplier:"Local market",purchased:true,date:"2026-11-14"},
    {id:"demo-tomatoes",name:"Tomatoes",quantity:"2",unit:"kg",unitPrice:"3500",purchasedQuantity:"",purchasedPrice:"",supplier:"Vegetable stall",purchased:false,date:""},
    {id:"demo-chicken",name:"Chicken",quantity:"1",unit:"kg",unitPrice:"8000",purchasedQuantity:"1",purchasedPrice:"7800",supplier:"Butcher",purchased:true,date:"2026-11-14"},
    {id:"demo-onions",name:"Onions",quantity:"1",unit:"kg",unitPrice:"2000",purchasedQuantity:"",purchasedPrice:"",supplier:"Local market",purchased:false,date:""}
  ];
  let items = load();
  let firstVisit = false;
  try { firstVisit = localStorage.getItem(KEY) === null; }
  catch(err) { console.warn("Cart storage unavailable",err); }

  function save() {
    try {localStorage.setItem(KEY,JSON.stringify(items));}
    catch(err) { document.getElementById("cartStatus").textContent="Changes could not be saved in this browser."; console.warn(err); }
  }
  if(firstVisit){
    items=sampleItems.map(item=>({...defaults,...item}));
    save();
  }
  function total(item) {return num(item.quantity)*num(item.unitPrice);}
  function summaries() {
    estimate.textContent=money(items.reduce((n,item)=>n+total(item),0));
    actual.textContent=money(items.reduce((n,item)=>n+num(item.purchasedPrice),0));
    const bought=items.filter(x=>x.purchased).length;
    count.textContent=items.length+" item"+(items.length===1?"":"s")+" · "+bought+" purchased";
  }
  function input(item,field,label,type="text") {
    const isNum=type==="number";
    const attrs=isNum?' min="0" step="any" inputmode="decimal"':"";
    return '<input class="cart-input" data-field="'+field+'" aria-label="'+label+'" type="'+type+'"'+attrs+' value="'+safe(item[field])+'">';
  }
  function row(item) {
    const tr=document.createElement("tr");
    tr.dataset.id=item.id;
    tr.classList.toggle("cart-open",openCards.has(item.id));
    const title=item.name.trim() || "New item";
    const line=(item.quantity || "—")+" "+(item.unit || "")+" · "+money(total(item));
    tr.innerHTML=
      '<td data-label="Item"><button type="button" class="cart-card-toggle" aria-expanded="'+openCards.has(item.id)+'" aria-label="Toggle '+safe(title)+' details"><span class="cart-arrow" aria-hidden="true">⌄</span><span class="cart-card-name">'+safe(title)+'</span></button><span class="cart-card-summary">'+safe(line)+'</span>'+input(item,"name","Item name")+'</td>'+
      '<td data-label="Quantity">'+input(item,"quantity","Quantity","number")+'</td>'+
      '<td data-label="Unit">'+input(item,"unit","Unit")+'</td>'+
      '<td data-label="Unit price">'+input(item,"unitPrice","Unit price","number")+'</td>'+
      '<td data-label="Total price"><output class="cart-output" data-total>'+money(total(item))+'</output></td>'+
      '<td data-label="Purchased quantity">'+input(item,"purchasedQuantity","Purchased quantity","number")+'</td>'+
      '<td data-label="Purchased price">'+input(item,"purchasedPrice","Purchased price","number")+'</td>'+
      '<td data-label="Supplier">'+input(item,"supplier","Supplier")+'</td>'+
      '<td data-label="Purchased"><input type="checkbox" class="cart-checkbox" data-field="purchased" aria-label="Purchased '+safe(title)+'" '+(item.purchased?"checked":"")+'></td>'+
      '<td data-label="Date">'+input(item,"date","Purchase date","date")+'</td>'+
      '<td data-label="Actions"><button type="button" class="cart-delete" aria-label="Delete '+safe(title)+'" title="Delete item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button></td>';
    return tr;
  }
  function visibleItems() {
    const query=search.value.trim().toLowerCase();
    return items.filter(item=>(filter.value==="all" || (filter.value==="purchased"?item.purchased:!item.purchased)) &&
      [item.name,item.unit,item.supplier].some(v=>String(v).toLowerCase().includes(query)));
  }
  function draw() {
    tbody.replaceChildren();
    const visible=visibleItems();
    visible.forEach(item=>tbody.appendChild(row(item)));
    empty.hidden=visible.length!==0;
    empty.textContent=items.length?"No items match your search or filter.":"Your Cart is empty. Add an item to get started.";
    summaries();
  }
  document.getElementById("cartAdd").addEventListener("click",()=>{
    const id=(window.crypto && crypto.randomUUID)?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2);
    items.unshift({...defaults,id});
    openCards.add(id);
    search.value="";
    filter.value="all";
    save();draw();
    const newInput=tbody.querySelector('[data-id="'+id+'"] [data-field="name"]');
    if(newInput){newInput.focus();newInput.scrollIntoView({block:"nearest"});}
  });
  tbody.addEventListener("click",event=>{
    const tr=event.target.closest("tr[data-id]");
    if(!tr)return;
    const item=items.find(x=>x.id===tr.dataset.id);
    if(!item)return;
    if(event.target.closest(".cart-delete")){
      if(!window.confirm('Delete "'+(item.name.trim()||"this item")+'" from Cart?'))return;
      items=items.filter(x=>x.id!==item.id);openCards.delete(item.id);save();draw();return;
    }
    if(event.target.closest(".cart-card-toggle")){
      if(openCards.has(item.id))openCards.delete(item.id);else openCards.add(item.id);
      tr.classList.toggle("cart-open",openCards.has(item.id));
      tr.querySelector(".cart-card-toggle").setAttribute("aria-expanded",String(openCards.has(item.id)));
      return;
    }
    if(window.matchMedia("(max-width:759px)").matches && !event.target.closest("input,select,button,a,label")){
      if(openCards.has(item.id))openCards.delete(item.id);else openCards.add(item.id);
      tr.classList.toggle("cart-open",openCards.has(item.id));
      tr.querySelector(".cart-card-toggle").setAttribute("aria-expanded",String(openCards.has(item.id)));
    }
  });
  tbody.addEventListener("input",event=>{
    const el=event.target,field=el.dataset.field;
    if(!field || field==="purchased")return;
    const tr=el.closest("tr[data-id]");
    const item=items.find(x=>x.id===tr.dataset.id);
    if(!item)return;
    // Store numeric input as typed, allowing intermediate decimals.
    if(numeric.has(field) && el.value!=="" && (!Number.isFinite(Number(el.value)) || Number(el.value)<0)) return;
    item[field]=el.value;
    tr.querySelector("[data-total]").textContent=money(total(item));
    tr.querySelector(".cart-card-name").textContent=item.name.trim()||"New item";
    tr.querySelector(".cart-card-summary").textContent=(item.quantity||"—")+" "+(item.unit||"")+" · "+money(total(item));
    save();summaries();
  });
  tbody.addEventListener("change",event=>{
    const el=event.target,field=el.dataset.field;
    if(!field)return;
    const tr=el.closest("tr[data-id]");
    const item=items.find(x=>x.id===tr.dataset.id);
    if(!item)return;
    if(field==="purchased"){
      item.purchased=el.checked;
    }else if(numeric.has(field) && el.value!=="" && num(el.value)===0 && Number(el.value)<0){
      item[field]="0";
    }
    save();draw();
  });
  const moreButton=document.getElementById("cartHeaderMore");
  const morePanel=document.getElementById("cartMorePanel");
  function setMore(open){
    morePanel.hidden=!open;
    moreButton.setAttribute("aria-expanded",String(open));
  }
  document.getElementById("cartSearchAction").addEventListener("click",()=>search.focus());
  document.getElementById("cartHeaderSearch").addEventListener("click",()=>{
    setMore(false);search.focus();search.scrollIntoView({block:"nearest"});
  });
  const filterButton=document.getElementById("cartFilterAction");
  const filterPanel=document.getElementById("cartFilterPanel");
  function setFilter(open){
    filterPanel.hidden=!open;
    filterButton.setAttribute("aria-expanded",String(open));
  }
  function toggleFilter(){
    setMore(false);
    setFilter(filterPanel.hidden);
    if(!filterPanel.hidden)filter.focus();
  }
  filterButton.addEventListener("click",event=>{
    event.stopPropagation();
    toggleFilter();
  });
  document.getElementById("cartHeaderFilter").addEventListener("click",event=>{
    event.stopPropagation();
    toggleFilter();
    if(!filterPanel.hidden)filterButton.scrollIntoView({block:"nearest"});
  });
  filterPanel.addEventListener("click",event=>event.stopPropagation());
  moreButton.addEventListener("click",event=>{
    event.stopPropagation();setMore(morePanel.hidden);
  });
  morePanel.addEventListener("click",event=>event.stopPropagation());
  document.getElementById("cartMoreAdd").addEventListener("click",()=>{
    setMore(false);document.getElementById("cartAdd").click();
  });
  document.getElementById("cartClearFilters").addEventListener("click",()=>{
    setMore(false);search.value="";filter.value="all";draw();
  });
  document.addEventListener("click",event=>{
    if(!morePanel.contains(event.target) && !moreButton.contains(event.target))setMore(false);
    if(!filterPanel.contains(event.target) && !filterButton.contains(event.target) && !document.getElementById("cartHeaderFilter").contains(event.target))setFilter(false);
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape" && !filterPanel.hidden){
      setFilter(false);filterButton.focus();
    }else if(event.key==="Escape" && !morePanel.hidden){
      setMore(false);moreButton.focus();
    }
  });
  search.addEventListener("input",draw);
  filter.addEventListener("change",draw);
  draw();
})();
