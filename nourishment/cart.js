/* HG-CART-004. Local-only editable Cart interface; no cross-module imports yet. */
(() => {
  "use strict";
  const KEY = "hg-carts-v1";
  const LEGACY_KEY = "hg-cart-items-v1";
  const cardsHost = document.getElementById("cartCards");
  const detail = document.getElementById("cartDetail");
  const collectionCount = document.getElementById("cartCollectionCount");
  const collectionEmpty = document.getElementById("cartCollectionsEmpty");
  const createButton = document.getElementById("cartCreate");
  const createForm = document.getElementById("cartCreateForm");
  const nameInput = document.getElementById("cartNameInput");
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
  const sampleItems = [
    {id:"demo-rice",name:"Rice",quantity:"5",unit:"kg",unitPrice:"1800",purchasedQuantity:"5",purchasedPrice:"9200",supplier:"Local market",purchased:true,date:"2026-11-14"},
    {id:"demo-tomatoes",name:"Tomatoes",quantity:"2",unit:"kg",unitPrice:"3500",purchasedQuantity:"",purchasedPrice:"",supplier:"Vegetable stall",purchased:false,date:""},
    {id:"demo-chicken",name:"Chicken",quantity:"1",unit:"kg",unitPrice:"8000",purchasedQuantity:"1",purchasedPrice:"7800",supplier:"Butcher",purchased:true,date:"2026-11-14"},
    {id:"demo-onions",name:"Onions",quantity:"1",unit:"kg",unitPrice:"2000",purchasedQuantity:"",purchasedPrice:"",supplier:"Local market",purchased:false,date:""}
  ];
  const freshId = () => window.crypto && crypto.randomUUID
    ? crypto.randomUUID() : "cart-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  const validItems = array => Array.isArray(array) ? array.filter(x=>x && typeof x==="object" && x.id).map(x=>({
    ...defaults,...Object.fromEntries(fields.filter(field=>field in x).map(field=>[field,x[field]])),id:String(x.id)
  })) : [];
  const createCart = (name,id,items=[]) => ({
    id, name, status:"active", createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
    items:validItems(items)
  });
  // Migration is non-destructive: never delete or overwrite the former
  // single-Cart key. An existing empty legacy Cart also remains empty.
  let canSave = true;
  function initialCarts(){
    try {
      const current=localStorage.getItem(KEY);
      if(current!==null){
        const decoded=JSON.parse(current);
        if(!Array.isArray(decoded))throw Error("Invalid saved carts");
        if(decoded.some(c=>!c || typeof c!=="object" || !c.id || !Array.isArray(c.items)))throw Error("Unrecognized saved carts");
        return decoded.map(c=>({
          ...c,id:String(c.id),name:String(c.name || "Untitled cart"),
          items:validItems(c.items)
        }));
      }
      const old=localStorage.getItem(LEGACY_KEY);
      let previous=null;
      if(old!==null){
        const parsed=JSON.parse(old);
        if(!Array.isArray(parsed))throw Error("Unrecognized previous Cart");
        previous=validItems(parsed);
      }
      const initial=[
        createCart("My Cart","CART-DEMO-001",previous===null?sampleItems:previous),
        createCart("Weekend shopping","CART-DEMO-002",[]),
        createCart("Household essentials","CART-DEMO-003",[])
      ];
      localStorage.setItem(KEY,JSON.stringify(initial));
      return initial;
    }catch(err){
      console.warn("Cart data could not be read safely",err);
      canSave=false;
      return [];
    }
  }
  let carts=initialCarts();
  let selectedId=carts.length?carts[0].id:null;
  const activeCart=()=>carts.find(c=>c.id===selectedId)||null;
  const itemsFor=c=>c?.items||[];
  let items=itemsFor(activeCart());
  function save(){
    if(!canSave)return;
    try{
      const now=new Date().toISOString();
      const current=activeCart();
      if(current)current.updatedAt=now;
      localStorage.setItem(KEY,JSON.stringify(carts));
    }catch(err){
      canSave=false;
      const status=document.getElementById("cartStatus");
      status.textContent="Changes could not be saved in this browser. Do not close the page.";
      console.warn(err);
    }
  }
  function showStatus(message){
    document.getElementById("cartStatus").textContent=message;
  }
  function total(item) {return num(item.quantity)*num(item.unitPrice);}
  function cartEstimate(cart){return itemsFor(cart).reduce((n,item)=>n+total(item),0);}
  function cartActual(cart){return itemsFor(cart).reduce((n,item)=>n+num(item.purchasedPrice),0);}
  function summaries() {
    const current=activeCart();
    estimate.textContent=money(cartEstimate(current));
    actual.textContent=money(cartActual(current));
    const bought=items.filter(x=>x.purchased).length;
    count.textContent=items.length+" item"+(items.length===1?"":"s")+" · "+bought+" purchased";
  }
  function renderCards(){
    cardsHost.replaceChildren();
    collectionCount.textContent=carts.length+" cart"+(carts.length===1?"":"s");
    collectionEmpty.hidden=carts.length!==0;
    carts.forEach(cart=>{
      const expanded=cart.id===selectedId;
      const card=document.createElement("article");
      card.className="cart-collection-card"+(expanded?" is-expanded":"");
      card.dataset.cartId=cart.id;
      const quantity=cart.items.length, bought=cart.items.filter(x=>x.purchased).length;
      card.innerHTML='<div class="cart-collection-card-header">'+
        '<button class="cart-collection-toggle" type="button" aria-expanded="'+expanded+'" aria-controls="cartDetail">'+
        '<span class="cart-collection-chevron" aria-hidden="true">⌄</span>'+
        '<span class="cart-collection-details"><strong>'+safe(cart.name)+'</strong>'+
        '<small>'+safe(cart.id)+' · '+quantity+' items · '+bought+' purchased</small></span>'+
        '<span class="cart-collection-cost">'+money(cartEstimate(cart))+'</span></button>'+
        '<button class="cart-rename" type="button" aria-label="Rename '+safe(cart.name)+'" title="Rename cart">Rename</button></div>';
      cardsHost.appendChild(card);
      if(expanded){
        card.appendChild(detail);
        detail.hidden=false;
      }
    });
    if(!activeCart()){
      detail.hidden=true;
      // Keep the same element available for reopening any card.
      cardsHost.appendChild(detail);
    }
  }
  function selectCart(id){
    selectedId=selectedId===id?null:id;
    items=itemsFor(activeCart());
    openCards.clear();
    search.value="";
    filter.value="all";
    draw();
  }
  cardsHost.addEventListener("click",event=>{
    const card=event.target.closest(".cart-collection-card");
    if(!card)return;
    const cart=carts.find(c=>c.id===card.dataset.cartId);
    if(!cart)return;
    if(event.target.closest(".cart-rename")){
      const updated=window.prompt("Rename this cart",cart.name);
      if(updated===null)return;
      const name=updated.trim();
      if(!name){window.alert("Please enter a Cart name.");return;}
      if(name.length>70){window.alert("Keep Cart names under 70 characters.");return;}
      cart.name=name;
      save();renderCards();return;
    }
    if(event.target.closest(".cart-collection-toggle"))selectCart(cart.id);
  });
  createButton.addEventListener("click",()=>{
    createForm.hidden=!createForm.hidden;
    if(!createForm.hidden)nameInput.focus();
  });
  document.getElementById("cartCancelCreate").addEventListener("click",()=>{
    createForm.hidden=true;
    nameInput.value="";
  });
  createForm.addEventListener("submit",event=>{
    event.preventDefault();
    if(!canSave){window.alert("Browser Cart storage is unavailable, so new Carts cannot be saved.");return;}
    const name=nameInput.value.trim();
    if(!name){nameInput.focus();return;}
    const cart=createCart(name,freshId());
    carts.unshift(cart);
    selectedId=cart.id;
    items=cart.items;
    openCards.clear();
    search.value="";filter.value="all";
    save();draw();
    createForm.hidden=true;nameInput.value="";
  });
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
    renderCards();
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
      activeCart().items=activeCart().items.filter(x=>x.id!==item.id);
      items=activeCart().items;
      openCards.delete(item.id);save();draw();return;
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
    // Do not recreate the open Cart while typing: that would detach a focused
    // input and interrupt editing on both phone and desktop.
    const cardHeader=cardsHost.querySelector('.cart-collection-card.is-expanded');
    if(cardHeader){
      const cart=activeCart();
      const summary=cardHeader.querySelector('.cart-collection-details small');
      const cost=cardHeader.querySelector('.cart-collection-cost');
      if(summary)summary.textContent=cart.id+" · "+cart.items.length+" items · "+cart.items.filter(x=>x.purchased).length+" purchased";
      if(cost)cost.textContent=money(cartEstimate(cart));
    }
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
  // Header actions follow Bulk Cooking's established archive/delete pattern.
  // Archiving must not erase the Cart until a real History destination exists.
  document.getElementById("cartArchiveReset").addEventListener("click",()=>{
    window.alert("Archive & Reset is not available yet. Cart History has not been implemented, so your items have NOT been cleared.");
  });
  document.getElementById("cartDeleteAll").addEventListener("click",()=>{
    if(!activeCart() || !items.length)return;
    if(!window.confirm('Delete all items from "'+activeCart().name+'" without archiving? This cannot be undone.'))return;
    activeCart().items=[];
    items=activeCart().items;
    openCards.clear();
    search.value="";
    filter.value="all";
    save();
    draw();
  });
  document.getElementById("cartSearchAction").addEventListener("click",()=>search.focus());
  document.getElementById("cartHeaderSearch").addEventListener("click",()=>{
    search.focus();
    search.scrollIntoView({block:"nearest"});
  });
  const filterButton=document.getElementById("cartFilterAction");
  const filterPanel=document.getElementById("cartFilterPanel");
  function setFilter(open){
    filterPanel.hidden=!open;
    filterButton.setAttribute("aria-expanded",String(open));
  }
  filterButton.addEventListener("click",event=>{
    event.stopPropagation();
    setFilter(filterPanel.hidden);
    if(!filterPanel.hidden)filter.focus();
  });
  filterPanel.addEventListener("click",event=>event.stopPropagation());
  document.addEventListener("click",event=>{
    if(!filterPanel.contains(event.target) && !filterButton.contains(event.target))setFilter(false);
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape" && !filterPanel.hidden){
      setFilter(false);
      filterButton.focus();
    }
  });
  search.addEventListener("input",draw);
  filter.addEventListener("change",draw);
  draw();
})();
