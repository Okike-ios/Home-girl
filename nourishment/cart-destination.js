/* HG-CART-011 — destination picker shared by Nourishment modules.
   Local-only; never overwrites existing carts or fabricates ingredient totals. */
(() => {
 "use strict";
 const KEY="hg-carts-v1";
 const moduleId=document.body.dataset.hgSection || "nourishment";
 const titleByModule={cook:"Bulk Cooking",week:"This Week",quick:"Quick Meals",pantry:"Pantry"};
 const moduleLabel=titleByModule[moduleId] || moduleId;
 const safe=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const freshId=()=>window.crypto&&crypto.randomUUID?crypto.randomUUID():"cart-"+Date.now()+"-"+Math.random().toString(36).slice(2);
 const number=v=>Number.isFinite(Number(v))&&Number(v)>0?String(Number(v)):"";
 const picker=document.createElement("dialog");
 picker.className="hg-cart-destination";
 picker.setAttribute("aria-label","Choose destination Cart");
 picker.innerHTML='<form method="dialog" class="hg-cart-destination-panel">'+
  '<header><h2>Choose a Cart</h2><button type="button" class="hg-cart-destination-close" aria-label="Close">×</button></header>'+
  '<p class="hg-cart-destination-intro">Send these selections to an existing Cart or create a new one.</p>'+
  '<p class="hg-cart-destination-preview" id="hgCartPreview"></p>'+
  '<label for="hgCartTarget">Destination Cart</label>'+
  '<select id="hgCartTarget"></select>'+
  '<div class="hg-cart-destination-create"><label for="hgCartNewName">Or create a new Cart</label><input id="hgCartNewName" maxlength="70" placeholder="Name your cart" type="text"></div>'+
  '<p class="hg-cart-destination-hint">Dish entries are placeholders until recipe ingredients and unit conversions are connected.</p>'+
  '<p class="hg-cart-destination-error" role="alert" hidden></p>'+
  '<footer><button type="button" class="hg-cart-destination-cancel">Cancel</button><button type="submit" class="hg-cart-destination-save">Add to selected Cart</button></footer></form>';
 document.body.appendChild(picker);
 const select=picker.querySelector("#hgCartTarget"), newName=picker.querySelector("#hgCartNewName");
 const error=picker.querySelector(".hg-cart-destination-error"), preview=picker.querySelector("#hgCartPreview");
 let pending=[];
 const close=()=>{if(picker.open)picker.close();pending=[];};
 picker.querySelector(".hg-cart-destination-close").addEventListener("click",close);
 picker.querySelector(".hg-cart-destination-cancel").addEventListener("click",close);
 picker.addEventListener("close",()=>{pending=[];error.hidden=true;});
 function getCarts(){
   const raw=localStorage.getItem(KEY);
   if(raw===null)throw Error("Open the Cart page once to initialize your Cart collection.");
   const carts=JSON.parse(raw);
   if(!Array.isArray(carts)||carts.some(c=>!c||typeof c!=="object"||typeof c.id!=="string"||!Array.isArray(c.items)))
     throw Error("Saved Cart data is not recognized. No changes were made.");
   return carts;
 }
 function showError(message){error.textContent=message;error.hidden=false;}
 function begin(rows){
   pending=rows.filter(x=>x.name&&x.name.trim()).map(x=>({...x,name:x.name.trim()}));
   if(!pending.length){window.alert("Choose a named dish or item before adding to a Cart.");return;}
   error.hidden=true;newName.value="";
   try{
     const carts=getCarts();
     select.replaceChildren();
     if(!carts.length)select.add(new Option("Create a new Cart",""));
     carts.forEach(c=>select.add(new Option(c.name+" · "+c.id,c.id)));
     preview.textContent=pending.length+" "+(pending.length===1?"entry":"entries")+" from "+moduleLabel;
     picker.showModal();
   }catch(err){window.alert(err.message);}
 }
 function item(name,quantity,unit,key,supplier="",dishId=""){
   return {name,quantity,unit,unitPrice:"",purchasedQuantity:"",purchasedPrice:"",supplier,purchased:false,date:"",
     sourceModule:moduleId,sourceKey:moduleId+":"+key,sourceDishId:dishId};
 }
 function extract(row){
   if(moduleId==="cook"){
     const dish=row.querySelector(".dish-input");
     if(!dish)return [];
     const cols=row.querySelectorAll("td");
     const qty=cols[3]?.querySelector("input")?.value||"";
     return [item(dish.value,number(qty),"servings",dish.dataset.dishId||row.rowIndex,"",dish.dataset.dishId||"")];
   }
   if(moduleId==="week"){
     const day=row.querySelector(".day-name")?.textContent.trim()||"Day";
     const list=[];
     row.querySelectorAll("td[data-meal]").forEach(cell=>{
       const meal=cell.dataset.meal||"meal";
       cell.querySelectorAll(".component-input").forEach((input,index)=>{
         if(input.value.trim())list.push(item(input.value,"1","dish",day+":"+meal+":"+index,"",input.dataset.dishId||""));
       });
     });
     return list;
   }
   if(moduleId==="quick"){
     const dish=row.querySelector(".quick-name-input");
     return dish?[item(dish.value,number(row.querySelector(".quick-servings input")?.value),"servings",dish.dataset.dishId||row.dataset.dishId,"",dish.dataset.dishId||"")]:[];
   }
   if(moduleId==="pantry"){
     const name=row.querySelector(".pantry-field-name input")?.value||row.querySelector(".pantry-item-title")?.textContent||"";
     const quantity=row.querySelector(".pantry-field-purchaseQty input")?.value||"";
     const unit=row.querySelector(".pantry-field-unit input")?.value||"";
     const supplier=row.querySelector(".pantry-field-supplier input")?.value||"";
     return [item(name,number(quantity),unit||"pcs",row.dataset.id||name,supplier)];
   }
   return [];
 }
 function rowsInModule(){
   const selector={cook:"#cookTableBody tr[data-dish-row]",week:"#weekTableBody tr[data-day-row]",quick:"#quickRows tr.quick-dish-row",pantry:"#pantryRows tr.pantry-item-row"}[moduleId];
   return selector?[...document.querySelectorAll(selector)]:[];
 }
 // Capture selections before modules rerender their rows. For bulk selection,
 // defer extraction until the module has propagated the master state.
 document.addEventListener("change",event=>{
   const el=event.target;
   if(!(el instanceof HTMLInputElement)||el.type!=="checkbox"||!el.checked)return;
   const master=el.id==="masterShoppingCheck"||el.id==="quickSelectAll";
   if(master){
     queueMicrotask(()=>{
       const rows=rowsInModule().filter(row=>{
         const check=moduleId==="quick"?row.querySelector(".quick-pick input[type=checkbox]"):row.querySelector(".shopping-check");
         return check&&check.checked&&!row.hidden;
       });
       begin(rows.flatMap(extract));
     });
     return;
   }
   const row=el.closest("tr");
   if(!row)return;
   const valid=moduleId==="pantry"?el.closest(".pantry-field-cart"):
     moduleId==="quick"?el.closest(".quick-pick"):el.classList.contains("shopping-check");
   if(!valid)return;
   const entries=extract(row);
   queueMicrotask(()=>begin(entries));
 },true);
 picker.querySelector("form").addEventListener("submit",event=>{
   event.preventDefault();
   if(!pending.length)return;
   error.hidden=true;
   try{
     const carts=getCarts();
     const name=newName.value.trim();
     if(name.length>70)throw Error("Cart name is too long.");
     let selected=carts.find(c=>c.id===select.value);
     if(name){
       selected={id:freshId(),name,status:"active",createdAt:new Date().toISOString(),
         updatedAt:new Date().toISOString(),items:[]};
       carts.unshift(selected);
     }
     if(!selected)throw Error("Choose a Cart or give a new Cart a name.");
     const now=new Date().toISOString();
     for(const entry of pending){
       // Avoid duplicating an entry from the same source within the same Cart,
       // without merging unlike ingredient units or editing purchased records.
       const prior=selected.items.find(i=>i.sourceKey===entry.sourceKey&&!i.purchased);
       if(prior){
         prior.name=entry.name;prior.quantity=entry.quantity;prior.unit=entry.unit;
         if(entry.supplier)prior.supplier=entry.supplier;
       }else{
         selected.items.push({...entry,id:freshId()});
       }
     }
     selected.updatedAt=now;
     localStorage.setItem(KEY,JSON.stringify(carts));
     const addedCount=pending.length;
     close();
     window.alert(addedCount+" "+(addedCount===1?"entry":"entries")+" sent to "+selected.name+". Open Cart to review.");
   }catch(err){showError(err.message||"Could not save to Cart.");}
 });
})();
