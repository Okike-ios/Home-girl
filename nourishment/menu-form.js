console.log("NEW MENU FORM JS IS LOADING");
console.log("Supabase connection loaded:", homeGirlSupabase);

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


  /* SAVE DISH TO SUPABASE */

  const { data, error } =
    await homeGirlSupabase
      .from("dishes")
      .insert([
        {
          dish_name: dishName,
          category: category,
          best_time: bestTime,
          serves: serves,
          recipe: recipe
        }
      ])
      .select()
      .single();


  /* HANDLE ERROR */

  if (error) {

    console.error("Could not save dish:", error);

    alert("Something went wrong while saving the dish.");

    return;
  }


  /* SUCCESS */

  console.log("Dish saved successfully:", data);

  alert("Dish added to your menu!");

});