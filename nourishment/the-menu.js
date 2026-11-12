const addDishButtons = document.querySelectorAll(
  ".add-dish-button, .primary-action"
);

addDishButtons.forEach(button => {
  button.addEventListener("click", () => {
    console.log("Open Add New Dish");
  });
});


const searchButton = document.querySelector(".icon-button");

searchButton.addEventListener("click", () => {
  console.log("Open Search");
});


const filterButton = document.querySelector(".filter-button");

filterButton.addEventListener("click", () => {
  console.log("Open Filters");
});


const utilityButton = document.querySelector(".utility-button");

utilityButton.addEventListener("click", () => {
  console.log("Open Menu Options");
});

/* --------------------------------
   LOAD DISHES FROM SUPABASE
-------------------------------- */

async function loadDishes() {

  const { data, error } =
    await homeGirlSupabase
      .from("dishes")
      .select("*")
      .order("created_at", { ascending: false });


  if (error) {

    console.error("Could not load dishes:", error);

    return;
  }


  console.log("Dishes loaded:", data);


  /* --------------------------------
     DISPLAY DISHES
  -------------------------------- */

  const dishList =
    document.getElementById("dish-list");

  const emptyMenu =
    document.getElementById("empty-menu");


  if (data.length === 0) {

    emptyMenu.style.display = "flex";

    return;
  }


  emptyMenu.style.display = "none";


  data.forEach(dish => {

    const dishRow =
      document.createElement("article");

    dishRow.className =
      "dish-row";
  
   dishRow.addEventListener("click", () => {
      console.log("Open dish:", dish.dish_name);
});

   dishRow.innerHTML = `

  <div class="dish-image-placeholder">
    ${
      dish.image_url
        ? `<img src="${dish.image_url}" alt="${dish.dish_name}">`
        : `<span>✦</span>`
    }
  </div>

  <div class="dish-info">

        <h2>${dish.dish_name}</h2>

        <p>
          ${dish.category || ""}
          ${dish.best_time ? " · " + dish.best_time : ""}
          ${dish.serves ? " · Serves " + dish.serves : ""}
        </p>

      </div>

    `;


    dishList.appendChild(dishRow);

  });

}


loadDishes();