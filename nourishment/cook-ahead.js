/* Home Girl — Bulk Cooking prototype interactions. Data persistence will be added later. */
(() => {
  const body = document.getElementById("cookTableBody");
  const master = document.getElementById("masterShoppingCheck");
  const searchInput = document.getElementById("dishSearch");
  const filterSelect = document.getElementById("dishFilter");
  const emptyMessage = document.getElementById("emptyMessage");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const number = document.getElementById("countdownNumber");
  const label = document.getElementById("countdownLabel");
  
  const planName = document.getElementById("planName");

  function updatePlanName() {
    const hasName = planName.value.trim().length > 0;

    planName.classList.toggle("has-name", hasName);
    planName.setAttribute(
      "aria-label",
      hasName ? "Bulk Cooking name" : "Give your Bulk Cooking a name"
    );
  }

  planName.addEventListener("input", updatePlanName);
  updatePlanName();

  const panels = [
    [document.getElementById("searchToggle"), document.getElementById("searchPanel")],
    [document.getElementById("filterToggle"), document.getElementById("filterPanel")],
    [document.getElementById("moreToggle"), document.getElementById("morePanel")]
  ];

  function closePanels(except = null) {
    panels.forEach(([button, panel]) => {
      if (panel !== except) { panel.hidden = true; button.setAttribute("aria-expanded", "false"); }
    });
  }
  panels.forEach(([button, panel]) => button.addEventListener("click", () => {
    const open = panel.hidden; closePanels(panel); panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open && panel.id === "searchPanel") searchInput.focus();
  }));

  // HG-BULK-P3: One set of meal inputs for laptop table and phone detail cards.
  // Summary labels are read-only mirrors; the existing inputs are the only data source.
  const mobileCards = window.matchMedia("(max-width: 759px)");
  const rows = () => [...body.querySelectorAll("[data-dish-row]")];

  function prepareMobileCard(row) {
    if (row.querySelector(".meal-card-toggle")) return;
    const dishCell = row.cells[0];
    const servingCell = row.cells[2];
    const dishInput = row.querySelector(".dish-input");
    const servingInput = servingCell.querySelector("input");
    const shopInput = row.querySelector(".shopping-check");
    if (!dishCell || !servingCell || !dishInput || !servingInput || !shopInput) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "meal-card-toggle";
    button.setAttribute("aria-expanded", "false");
    const dishLabel = document.createElement("span");
    dishLabel.className = "meal-card-name";
    const arrow = document.createElement("span");
    arrow.className = "meal-card-chevron";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "⌄";
    button.append(arrow, dishLabel);
    dishCell.appendChild(button);

    // An individual removal action belongs to each meal's expanded phone form.
    // Keep it in the existing shopping cell so the desktop table gains no column.
    const deleteDish = document.createElement("button");
    deleteDish.type = "button";
    deleteDish.className = "meal-dish-delete";
    deleteDish.textContent = "Delete dish";
    deleteDish.setAttribute("aria-label", "Delete this dish");
    row.cells[6].appendChild(deleteDish);

    const servingLabel = document.createElement("span");
    servingLabel.className = "meal-card-serving";
    servingCell.appendChild(servingLabel);

    function updateSummary() {
      const name = dishInput.value.trim() || "New dish";
      dishLabel.textContent = name;
      servingLabel.textContent = servingInput.value === "" ? "—" : servingInput.value;
      button.setAttribute("aria-label", `Edit ${name} details`);
      shopInput.setAttribute("aria-label", `Add ${name} to shopping list`);
    }
    dishInput.addEventListener("input", updateSummary);
    servingInput.addEventListener("input", updateSummary);
    updateSummary();
  }

  function toggleMobileCard(row, force) {
    if (!mobileCards.matches) return;
    const button = row.querySelector(".meal-card-toggle");
    if (!button) return;
    const open = typeof force === "boolean" ? force : !row.classList.contains("meal-card-open");
    row.classList.toggle("meal-card-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", (open ? "Close " : "Edit ") + (row.querySelector(".dish-input").value.trim() || "new dish") + " details");
  }

  rows().forEach(prepareMobileCard);
  body.addEventListener("click", event => {
    const row = event.target.closest("[data-dish-row]");
    if (!row || !mobileCards.matches) return;
    const deleteButton = event.target.closest(".meal-dish-delete");
    if (deleteButton) {
      const dishName = row.querySelector(".dish-input").value.trim() || "this dish";
      if (!window.confirm(`Delete "${dishName}" from this cooking cycle? This will not archive it.`)) return;
      row.remove();
      applyFilters();
      return;
    }
    // Checkboxes and all form controls work without expanding/collapsing the card.
    if (event.target.closest(".shopping-check, input, select, textarea, label, button")) return;
    toggleMobileCard(row);
  });

  function syncMaster() {
    const visible = rows().filter(row => !row.hidden).map(row => row.querySelector(".shopping-check"));
    const checked = visible.filter(box => box.checked).length;
    master.checked = visible.length > 0 && checked === visible.length;
    master.indeterminate = checked > 0 && checked < visible.length;
    master.disabled = visible.length === 0;
  }
  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;
    let count = 0;
    rows().forEach(row => {
      const name = row.querySelector(".dish-input").value.trim().toLowerCase();
      const checked = row.querySelector(".shopping-check").checked;
      row.hidden = !(name.includes(query) && (filter === "all" || (filter === "selected" ? checked : !checked)));
      if (!row.hidden) count++;
    });
    emptyMessage.hidden = count > 0;
    syncMaster();
  }
  master.addEventListener("change", () => {
    rows().filter(row => !row.hidden).forEach(row => row.querySelector(".shopping-check").checked = master.checked);
    applyFilters();
  });
  body.addEventListener("change", event => {
    if (event.target.matches(".shopping-check,.dish-input")) applyFilters();
  });
  body.addEventListener("input", event => { if (event.target.matches(".dish-input")) applyFilters(); });
  searchInput.addEventListener("input", applyFilters);
  filterSelect.addEventListener("change", applyFilters);

  function inputCell(type, value, placeholder, labelText, className = "") {
    const input = document.createElement("input");
    input.type = type; input.className = `cell-input ${className}`.trim();
    if (value !== undefined) input.value = value;
    if (placeholder) input.placeholder = placeholder;
    input.setAttribute("aria-label", labelText);
    if (type === "number") { input.min = "0"; input.step = "1"; }
    return input;
  }
  function addDish() {
    const row = document.createElement("tr");
    row.dataset.dishRow = "";
    const cells = [
      ["dish-column sticky-dish", inputCell("text", "", "Dish name", "Dish name", "dish-input")],
      ["", inputCell("number", "4", "", "Planned servings")],
      ["", inputCell("number", "0", "", "Current serving")],
      ["", inputCell("number", "4", "", "To cook")],
      ["", inputCell("text", "", "—", "Last updated")],
      ["", inputCell("date", "", "", "Cooked on")]
    ];
    cells.forEach(([className, input]) => {
      const td = document.createElement("td"); if (className) td.className = className;
      td.appendChild(input); row.appendChild(td);
    });
    const td = document.createElement("td"); td.className = "shopping-column sticky-shopping";
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.className = "shopping-check";
    checkbox.setAttribute("aria-label", "Add dish to shopping list"); td.appendChild(checkbox); row.appendChild(td);
    // New dishes always appear first. Clear any active filtering so an empty
    // new dish cannot disappear immediately after being created.
    searchInput.value = "";
    filterSelect.value = "all";
    body.prepend(row);
    prepareMobileCard(row);
    toggleMobileCard(row, true);
    applyFilters();
    row.querySelector(".dish-input").focus();
    if (mobileCards.matches) row.scrollIntoView({block:"nearest"});
  }
  document.getElementById("addDishButton").addEventListener("click", addDish);
  document.getElementById("addDishFromMenu").addEventListener("click", () => { closePanels(); addDish(); });
  document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = ""; filterSelect.value = "all"; applyFilters(); closePanels();
  });

  function updateCountdown() {
    if (!endDate.value) { number.textContent = "—"; label.textContent = "DAYS LEFT"; return; }
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(`${endDate.value}T00:00:00`);
    const days = Math.ceil((target - today) / 86400000);
    if (days < 0) { number.textContent = "0"; label.textContent = "DAYS OVER"; }
    else { number.textContent = String(days); label.textContent = days === 1 ? "DAY LEFT" : "DAYS LEFT"; }
  }
  startDate.addEventListener("change", () => {
    if (startDate.value) {
      endDate.min = startDate.value;
      if (endDate.value && endDate.value < startDate.value) endDate.value = "";
    } else endDate.removeAttribute("min");
    updateCountdown();
  });
  endDate.addEventListener("change", () => {
    if (endDate.value) startDate.max = endDate.value;
    else startDate.removeAttribute("max");
    updateCountdown();
  });

  document.getElementById("resetButton").addEventListener("click", () => {
    if (!window.confirm("Reset this Bulk Cooking plan? This clears the name, dates, and selections. Dish rows will remain.")) return;
    document.getElementById("planName").value = "";
    updatePlanName();
    startDate.value = ""; endDate.value = "";
    startDate.removeAttribute("max"); endDate.removeAttribute("min");
    rows().forEach(row => row.querySelector(".shopping-check").checked = false);
    searchInput.value = ""; filterSelect.value = "all";
    applyFilters(); updateCountdown();
  });
  document.getElementById("archiveButton").addEventListener("click", () => {
    window.alert("Archive will be connected to saved Bulk Cooking plans when the app data layer is added.");
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".app-header") && !event.target.closest(".popover")) closePanels();
  });
  updateCountdown(); applyFilters();
})();