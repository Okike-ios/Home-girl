/* HOME GIRL — THIS WEEK
   Front-end prototype. Database persistence will be connected later.
*/

(() => {
  const body = document.getElementById("weekTableBody");
  const master = document.getElementById("masterShoppingCheck");
  const searchInput = document.getElementById("mealSearch");
  const filterSelect = document.getElementById("mealFilter");
  const emptyMessage = document.getElementById("emptyMessage");
  const weekName = document.getElementById("weekName");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const number = document.getElementById("countdownNumber");
  const countdownLabel = document.getElementById("countdownLabel");

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const meals = [
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "brunch", label: "Brunch" },
    { key: "dinner", label: "Dinner" }
  ];

  const panels = [
    [
      document.getElementById("searchToggle"),
      document.getElementById("searchPanel")
    ],
    [
      document.getElementById("filterToggle"),
      document.getElementById("filterPanel")
    ],
    [
      document.getElementById("moreToggle"),
      document.getElementById("morePanel")
    ]
  ];

  /* HEADER PANELS */

  function closePanels(except = null) {
    panels.forEach(([button, panel]) => {
      if (panel !== except) {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  panels.forEach(([button, panel]) => {
    button.addEventListener("click", () => {
      const shouldOpen = panel.hidden;

      closePanels(panel);
      panel.hidden = !shouldOpen;
      button.setAttribute("aria-expanded", String(shouldOpen));

      if (shouldOpen && panel.id === "searchPanel") {
        searchInput.focus();
      }
    });
  });

  /* WEEK NAME */

  function updateWeekName() {
    const hasName = weekName.value.trim().length > 0;

    weekName.classList.toggle("has-name", hasName);
    weekName.setAttribute(
      "aria-label",
      hasName ? "Week name" : "Give your week a name"
    );
  }

  weekName.addEventListener("input", updateWeekName);

  /* CREATE COMPONENT INPUTS */

  function createComponent(value = "") {
    const item = document.createElement("div");
    item.className = "component-item";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "component-input";
    input.value = value;
    input.placeholder = "Meal component";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Meal component");

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-component";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Remove meal component");
    remove.title = "Remove component";

    item.append(input, remove);
    return item;
  }

  function addComponent(list, value = "", focus = true) {
    const item = createComponent(value);
    list.appendChild(item);

    if (focus) {
      item.querySelector("input").focus();
    }

    applyFilters();
    return item;
  }

  /* BUILD THE SEVEN PERMANENT DAYS */

  function createDayRow(day, index) {
    const row = document.createElement("tr");
    row.dataset.dayRow = "";
    row.dataset.dayIndex = String(index);

    // Fixed date/day column
    const dateCell = document.createElement("td");
    dateCell.className = "date-column sticky-date";

    const dayName = document.createElement("span");
    dayName.className = "day-name";
    dayName.textContent = day.toUpperCase();

    const dateLabel = document.createElement("span");
    dateLabel.className = "day-date";
    dateLabel.textContent = "—";

    dateCell.append(dayName, dateLabel);
    row.appendChild(dateCell);

    // Four editable meal columns
    meals.forEach(meal => {
      const cell = document.createElement("td");
      cell.className = "meal-column";
      cell.dataset.meal = meal.key;

      const list = document.createElement("div");
      list.className = "component-list";

      list.appendChild(createComponent());

      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "add-component";
      addButton.innerHTML = "<span aria-hidden=\"true\">+</span> Add another";
      addButton.setAttribute(
        "aria-label",
        `Add another component to ${day} ${meal.label}`
      );

      addButton.addEventListener("click", () => {
        addComponent(list);
      });

      cell.append(list, addButton);
      row.appendChild(cell);
    });

    // Fixed shopping-list column
    const shoppingCell = document.createElement("td");
    shoppingCell.className = "shopping-column sticky-shopping";

    const shoppingLabel = document.createElement("label");
    shoppingLabel.className = "day-shopping-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "shopping-check";
    checkbox.setAttribute(
      "aria-label",
      `Add ${day} meals to shopping list`
    );

    shoppingLabel.appendChild(checkbox);
    shoppingCell.appendChild(shoppingLabel);
    row.appendChild(shoppingCell);

    return row;
  }

  days.forEach((day, index) => {
    body.appendChild(createDayRow(day, index));
  });

  const rows = () => [...body.querySelectorAll("[data-day-row]")];

  /* SHOW THE DATE FOR EACH DAY */

  function updateDayDates() {
    const startValue = startDate.value;

    rows().forEach((row, index) => {
      const dateLabel = row.querySelector(".day-date");

      if (!startValue) {
        dateLabel.textContent = "—";
        return;
      }

      const date = new Date(`${startValue}T12:00:00`);
      date.setDate(date.getDate() + index);

      dateLabel.textContent = new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short"
      }).format(date);
    });
  }

  /* MASTER SHOPPING-LIST CHECKBOX */

  function syncMaster() {
    const visibleCheckboxes = rows()
      .filter(row => !row.hidden)
      .map(row => row.querySelector(".shopping-check"));

    const checkedCount = visibleCheckboxes.filter(box => box.checked).length;

    master.checked =
      visibleCheckboxes.length > 0 &&
      checkedCount === visibleCheckboxes.length;

    master.indeterminate =
      checkedCount > 0 &&
      checkedCount < visibleCheckboxes.length;

    master.disabled = visibleCheckboxes.length === 0;
  }

  master.addEventListener("change", () => {
    rows()
      .filter(row => !row.hidden)
      .forEach(row => {
        row.querySelector(".shopping-check").checked = master.checked;
      });

    applyFilters();
  });

  /* SEARCH AND FILTER */

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;
    let visibleCount = 0;

    rows().forEach(row => {
      const day = row.querySelector(".day-name").textContent.toLowerCase();

      const componentNames = [
        ...row.querySelectorAll(".component-input")
      ].map(input => input.value.trim().toLowerCase());

      const matchesSearch =
        !query ||
        day.includes(query) ||
        componentNames.some(name => name.includes(query));

      const isSelected = row.querySelector(".shopping-check").checked;

      const matchesFilter =
        filter === "all" ||
        (filter === "selected" && isSelected) ||
        (filter === "unselected" && !isSelected);

      row.hidden = !(matchesSearch && matchesFilter);

      if (!row.hidden) visibleCount++;
    });

    emptyMessage.hidden = visibleCount > 0;
    syncMaster();
  }

  body.addEventListener("change", event => {
    if (
      event.target.matches(".shopping-check") ||
      event.target.matches(".component-input")
    ) {
      applyFilters();
    }
  });

  body.addEventListener("input", event => {
    if (event.target.matches(".component-input")) {
      applyFilters();
    }
  });

  body.addEventListener("click", event => {
    const removeButton = event.target.closest(".remove-component");

    if (!removeButton) return;

    const item = removeButton.closest(".component-item");
    const list = item.closest(".component-list");

    // Always leave at least one component field in each meal.
    if (list.querySelectorAll(".component-item").length === 1) {
      const input = item.querySelector(".component-input");
      input.value = "";
      input.focus();
    } else {
      const nextItem =
        item.nextElementSibling || item.previousElementSibling;

      item.remove();

      if (nextItem) {
        nextItem.querySelector(".component-input").focus();
      }
    }

    applyFilters();
  });

  searchInput.addEventListener("input", applyFilters);
  filterSelect.addEventListener("change", applyFilters);

  document.getElementById("clearSearch").addEventListener("click", () => {
    searchInput.value = "";
    applyFilters();
    searchInput.focus();
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = "";
    filterSelect.value = "all";
    applyFilters();
    closePanels();
  });

  /* HG-WEEK-002 — Fixed ISO Monday-Sunday planning windows.
     An arbitrary selected date maps to its Monday and following Sunday.
     ISO week number uses Thursday's year, including year boundaries. */
  const chosenWeekDate = document.getElementById("weekDateChoice");
  const isoWeekYear = document.getElementById("weekCalendarYear");
  const endDateInput = endDate;
  endDateInput.readOnly = true;
  endDateInput.setAttribute("aria-label", "Calculated Sunday (read only)");

  function dateFromISO(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const result = new Date(Date.UTC(year, month - 1, day));
    return result.getUTCFullYear() === year && result.getUTCMonth() === month - 1 && result.getUTCDate() === day ? result : null;
  }
  function dateString(date) {
    return date.toISOString().slice(0, 10);
  }
  function weekForDate(value) {
    const selected = dateFromISO(value);
    if (!selected) return null;
    const monday = new Date(selected);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    const thursday = new Date(monday);
    thursday.setUTCDate(thursday.getUTCDate() + 3);
    const weekYear = thursday.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
    firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7));
    const week = Math.round((monday.getTime() - firstThursday.getTime()) / 604800000) + 1;
    return { monday: dateString(monday), sunday: dateString(sunday), week, year: weekYear };
  }

  function syncWeekNumber() {
    const week = weekForDate(startDate.value);
    number.textContent = week ? String(week.week) : "0";
    countdownLabel.textContent = week ? `ISO WEEK ${week.year}` : "ISO WEEK";
    if (isoWeekYear) isoWeekYear.textContent = week ? String(week.year) : "";
  }
  function chooseWeek(value) {
    const week = weekForDate(value);
    if (!week) {
      startDate.value = "";
      endDate.value = "";
      if (chosenWeekDate) chosenWeekDate.value = "";
    } else {
      startDate.value = week.monday;
      endDate.value = week.sunday;
      if (chosenWeekDate) chosenWeekDate.value = value;
    }
    updateDayDates();
    syncWeekNumber();
    // Inform the desktop calendar display of programmatic changes.
    startDate.dispatchEvent(new Event("weekwindowchange", { bubbles: true }));
  }

  startDate.addEventListener("change", () => {
    // On narrow screens this remains the date selector; the selected date
    // is normalized to Monday before calculating the seven day labels.
    chooseWeek(startDate.value);
  });
  if (chosenWeekDate) {
    chosenWeekDate.addEventListener("change", () => chooseWeek(chosenWeekDate.value));
  }
  // No direct To editing: Sunday is always computed.
  endDate.addEventListener("change", () => {
    if (startDate.value) chooseWeek(startDate.value);
    else endDate.value = "";
  });
  // Existing reset logic calls updateCountdown; preserve the function name.
  function updateCountdown() {
    syncWeekNumber();
  }

  /* ARCHIVE PLACEHOLDER */

  function archiveWeek() {
    window.alert(
      "Archiving will be connected to saved weekly meal plans when the app data layer is added."
    );
  }

  document.getElementById("archiveButton").addEventListener("click", archiveWeek);
  document.getElementById("archiveButtonMain").addEventListener("click", archiveWeek);

  /* RESET */

  function resetWeek() {
    const confirmed = window.confirm(
      "Reset this week? This clears the week name, dates, meal components, and shopping selections."
    );

    if (!confirmed) return;

    weekName.value = "";
    updateWeekName();

    startDate.value = "";
    endDate.value = "";
    if (chosenWeekDate) chosenWeekDate.value = "";
    startDate.removeAttribute("max");
    endDate.removeAttribute("min");

    rows().forEach(row => {
      row.querySelector(".shopping-check").checked = false;

      row.querySelectorAll(".component-list").forEach(list => {
        list.replaceChildren(createComponent());
      });
    });

    searchInput.value = "";
    filterSelect.value = "all";

    updateDayDates();
    updateCountdown();
    applyFilters();
    closePanels();
  }

  document.getElementById("resetButton").addEventListener("click", resetWeek);
  document.getElementById("resetButtonBottom").addEventListener("click", resetWeek);
  document.getElementById("resetMenuButton").addEventListener("click", resetWeek);

  /* CLOSE MENUS WHEN CLICKING OUTSIDE */

  document.addEventListener("click", event => {
    if (
      !event.target.closest(".app-header") &&
      !event.target.closest(".popover")
    ) {
      closePanels();
    }
  });

  /* INITIAL STATE */

  updateWeekName();
  updateDayDates();
  updateCountdown();
  applyFilters();
})();