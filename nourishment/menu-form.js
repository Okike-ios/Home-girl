console.log("NEW MENU FORM JS IS LOADING");
// Browser-only prototype: Supabase is intentionally not loaded.

/* --------------------------------
   CATEGORY SELECTION
-------------------------------- */

const categoryButtons =
  document.querySelectorAll("#category-group .choice");

const categoryInput =
  document.getElementById("category");


categoryButtons.forEach(button => {

  button.addEventListener("click", () => {

    categoryButtons.forEach(item => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");

    categoryInput.value =
      button.dataset.value;

  });

});


/* --------------------------------
   BEST TIME SELECTION
-------------------------------- */

const timeButtons =
  document.querySelectorAll("#time-group .choice");

const timeInput =
  document.getElementById("best-time");


timeButtons.forEach(button => {

  button.addEventListener("click", () => {

    timeButtons.forEach(item => {
      item.classList.remove("selected");
    });

    button.classList.add("selected");

    timeInput.value =
      button.dataset.value;

  });

});


/* --------------------------------
   INGREDIENTS
-------------------------------- */

const ingredientsList =
  document.getElementById("ingredients-list");

const addIngredientButton =
  document.getElementById("add-ingredient");


function createIngredientRow() {

  const row =
    document.createElement("div");

  row.className =
    "ingredient-row";

  row.innerHTML = `
    <input
      type="text"
      class="ingredient-name"
      placeholder="Ingredient"
    >

    <input
      type="text"
      class="ingredient-quantity"
      placeholder="Quantity"
    >

    <input
      type="text"
      class="ingredient-unit"
      placeholder="Unit"
    >

    <button
      type="button"
      class="remove-ingredient"
      aria-label="Remove ingredient"
    >
      ×
    </button>
  `;

  ingredientsList.appendChild(row);

}


addIngredientButton.addEventListener(
  "click",
  createIngredientRow
);


/* Remove ingredient */

ingredientsList.addEventListener(
  "click",
  (event) => {

    if (
      event.target.classList.contains(
        "remove-ingredient"
      )
    ) {

      const rows =
        ingredientsList.querySelectorAll(
          ".ingredient-row"
        );

      /*
        Always keep at least one
        ingredient row available.
      */

      if (rows.length > 1) {
        event.target
          .closest(".ingredient-row")
          .remove();
      }

    }

  }
);


/* --------------------------------
   CANCEL
-------------------------------- */

const cancelButton =
  document.getElementById("cancel-button");


cancelButton.addEventListener("click", () => {

  window.location.href =
    "the-menu.html";

});


/* HG-MENU-004 — Preview-only dish edit mode.
 * Changes are saved in this browser, never inserted into Supabase.
 * New dishes and edits both save to the same browser catalogue.
 */
const demoEditMode=new URLSearchParams(window.location.search).get("demoEdit")==="1";
let demoEditPayload=null;
if(demoEditMode){
  try{demoEditPayload=JSON.parse(sessionStorage.getItem("hg-menu-demo-edit-payload")||"null");}
  catch{demoEditPayload=null;}
  if(demoEditPayload&&typeof demoEditPayload.key==="string"){
    document.title="Edit Dish | Home Girl";
    const heading=document.querySelector(".app-header .header-title");
    if(heading)heading.textContent="Edit Dish";
    const intro=document.querySelector(".form-intro h1");
    if(intro)intro.textContent="Let's make some changes.";
    const subtitle=document.querySelector(".form-intro p");
    if(subtitle)subtitle.textContent="Update your dish details below.";
    const submit=document.querySelector(".save-button");
    if(submit)submit.textContent="Save Changes";
    const note=document.querySelector(".save-section > p");
    if(note)note.textContent="Demo only — changes to sample dishes stay in this browser.";

    document.getElementById("dish-name").value=demoEditPayload.name||"";
    document.getElementById("servings").value=demoEditPayload.serves||4;
    document.getElementById("recipe").value=demoEditPayload.recipe||"";

    function selectChoice(groupId,hiddenId,value){
      if(!value)return;
      const group=document.getElementById(groupId);
      let button=[...group.querySelectorAll(".choice")].find(b=>b.dataset.value===value);
      if(!button){
        button=document.createElement("button");
        button.type="button";
        button.className="choice";
        button.dataset.value=value;
        button.textContent=value;
        group.appendChild(button);
        button.addEventListener("click",()=>{
          group.querySelectorAll(".choice").forEach(b=>b.classList.remove("selected"));
          button.classList.add("selected");
          document.getElementById(hiddenId).value=value;
        });
      }
      button.click();
    }
    selectChoice("category-group","category",demoEditPayload.category);
    selectChoice("time-group","best-time",demoEditPayload.bestTime);

    const existing=Array.isArray(demoEditPayload.ingredients)?demoEditPayload.ingredients:[];
    if(existing.length){
      ingredientsList.replaceChildren();
      for(const ingredient of existing){
        createIngredientRow();
        const row=ingredientsList.lastElementChild;
        row.querySelector(".ingredient-name").value=typeof ingredient==="string"?ingredient:(ingredient.name||"");
        row.querySelector(".ingredient-quantity").value=typeof ingredient==="string"?"":(ingredient.quantity||"");
        row.querySelector(".ingredient-unit").value=typeof ingredient==="string"?"":(ingredient.unit||"");
      }
    }
  }else{
    // Do not risk an accidental Supabase insert when edit context is missing.
    const form=document.getElementById("dish-form");
    form.addEventListener("submit",event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      alert("This sample dish could not be loaded. Return to The Menu and select Edit again.");
    },true);
  }
}

/* --------------------------------
   FORM SUBMISSION
-------------------------------- */

const dishForm =
  document.getElementById("dish-form");


dishForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  /* GET BASIC DISH INFORMATION */

  const dishName =
    document.getElementById("dish-name").value.trim();

  const category =
    document.getElementById("category").value;

  const bestTime =
    document.getElementById("best-time").value;

  const serves =
    Number(document.getElementById("servings").value);

  const recipe =
    document.getElementById("recipe").value.trim();


  if(demoEditMode){
    if(!demoEditPayload)return;
    if(!dishName){alert("Please enter a dish name.");return;}
    if(!Number.isFinite(serves)||serves<1){alert("Please enter a valid serving count.");return;}
    const ingredients=[...ingredientsList.querySelectorAll(".ingredient-row")].map(row=>({
      name:row.querySelector(".ingredient-name")?.value.trim()||"",
      quantity:row.querySelector(".ingredient-quantity")?.value.trim()||"",
      unit:row.querySelector(".ingredient-unit")?.value.trim()||""
    })).filter(item=>item.name);
    try{
      const existing=window.HomeGirlDishes.get(demoEditPayload.key);
      if(!existing)throw Error("Dish no longer exists");
      window.HomeGirlDishes.save({...existing,name:dishName,category,bestTime,serves,recipe,ingredients});
    }catch(error){console.error(error);alert("Could not save dish changes in this browser.");return;}
    sessionStorage.removeItem("hg-menu-demo-edit-payload");
    window.location.href="the-menu.html";
    return;
  }

  /* SAVE DISH LOCALLY — NO SUPABASE REQUESTS */

  if(!dishName){alert("Please enter a dish name.");return;}
  if(!Number.isFinite(serves)||serves<1){alert("Please enter a valid serving count.");return;}
  const ingredients=[...ingredientsList.querySelectorAll(".ingredient-row")].map(row=>({
    name:row.querySelector(".ingredient-name")?.value.trim()||"",
    quantity:row.querySelector(".ingredient-quantity")?.value.trim()||"",
    unit:row.querySelector(".ingredient-unit")?.value.trim()||""
  })).filter(item=>item.name);
  try{
    window.HomeGirlDishes.save({name:dishName,category,bestTime,serves,recipe,ingredients});
  }catch(error){
    console.error(error);
    alert("Could not save this dish in this browser. Please check local storage availability.");
    return;
  }
  window.location.href="the-menu.html";

});