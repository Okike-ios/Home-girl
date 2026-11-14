/* HG-NOUR-002 — browser-only shared dish catalogue. No network or database requests. */
(function(global){
"use strict";
const KEY="hg-local-dishes-v1";
const samples=[
 ["Egusi Soup","Soups & Stews",4],["Jollof Rice","Rice Dishes",4],
 ["Tomato Stew","Soups & Stews",6],["Chicken Curry","Main Dishes",3],
 ["Beans & Plantain","Main Dishes",2],["Moi Moi","Sides & Snacks",4],
 ["Yam & Egg Sauce","Breakfast",2],["Pepper Soup","Soups & Stews",3],
 ["Fried Rice","Rice Dishes",4],["Akara","Breakfast",3]
];
function makeId(){return "local-"+(global.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2));}
function init(){
 const deleted=JSON.parse(localStorage.getItem("hg-menu-demo-deleted-v1")||"[]");
 const edits=JSON.parse(localStorage.getItem("hg-menu-demo-edits-v1")||"{}");
 return samples.filter(([name])=>!deleted.includes(name)).map(([name,category,serves])=>{
  const e=edits[name]||{};
  return {id:"sample-"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),name:e.name||name,category:e.category||category,serves:Number(e.serves)||serves,bestTime:e.bestTime||"",recipe:e.recipe||"",ingredients:Array.isArray(e.ingredients)?e.ingredients:[],originalName:name};
 });
}
function read(){
 const raw=localStorage.getItem(KEY);
 if(raw===null){const data=init();localStorage.setItem(KEY,JSON.stringify(data));return data;}
 const data=JSON.parse(raw);
 if(!Array.isArray(data))throw Error("Invalid local dish catalogue");
 return data;
}
function list(){return read().map(d=>({...d}));}
function get(id){return list().find(d=>d.id===id)||null;}
function save(value){
 const name=String(value.name||"").trim();
 if(!name)throw Error("Dish name is required");
 const data=read(),i=data.findIndex(d=>d.id===value.id);
 const id=i>=0?value.id:makeId();
 const dish={...(i>=0?data[i]:{}),...value,id,name,serves:Math.max(1,Number(value.serves)||1)};
 if(i>=0)data[i]=dish;else data.push(dish);
 localStorage.setItem(KEY,JSON.stringify(data));
 global.dispatchEvent(new Event("hg:dishes-changed"));
 return dish;
}
function remove(id){
 const data=read(),next=data.filter(d=>d.id!==id);
 if(data.length===next.length)return false;
 localStorage.setItem(KEY,JSON.stringify(next));
 global.dispatchEvent(new Event("hg:dishes-changed"));
 return true;
}
global.HomeGirlDishes=Object.freeze({list,get,save,remove});
})(window);
