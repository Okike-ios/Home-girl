/* HG-WEEK-D2 — desktop presentation matches Bulk Cooking.
   The existing This Week form fields and table remain the only sources of truth.
   At phone widths the original markup is restored without changing mobile styling.
*/
(() => {
  "use strict";
  const desktop = window.matchMedia("(min-width: 760px)");
  const get = id => document.getElementById(id);
  const header = document.querySelector(".this-week-page > .app-header");
  const nameField = document.querySelector(".this-week-page .plan-section .name-field");
  const intro = document.querySelector(".this-week-page .plan-section .intro");
  const dates = document.querySelector(".this-week-page .plan-section .date-fields");
  const searchInput = get("mealSearch");
  const searchButton = get("searchToggle");
  const filterButton = get("filterToggle");
  const searchPanel = get("searchPanel");
  const filterPanel = get("filterPanel");
  const datePopover = get("weekDatePopover");
  const calendarWrap = get("weekCalendarControl");
  const calendarButton = get("weekCalendarButton");
  const calendarNumber = get("weekCalendarNumber");
  const originalCount = get("countdownNumber");
  const workspace = get("weekDesktopWorkspace");
  const introTarget = get("weekDesktopIntro");
  const searchTarget = get("weekDesktopSearch");
  const weekName = get("weekName");
  const mealFilter = get("mealFilter");
  const weekBody = get("weekTableBody");
  const archiveReset = get("weekArchiveReset");
  const deleteMeals = get("weekDeleteMeals");
  const originalNamePlaceholder = weekName.placeholder;
  if (!header || !nameField || !intro || !dates || !searchInput || !searchButton ||
      !filterButton || !calendarWrap || !originalCount || !datePopover || !workspace ||
      !weekBody) return;

  // Placeholders restore all actual form controls to their original phone positions.
  const movable = [nameField, intro, dates, searchInput, searchButton, filterButton];
  const originalPlaces = new Map();
  movable.forEach(node => {
    const marker = document.createComment("Original This Week field position");
    node.parentNode.insertBefore(marker, node);
    originalPlaces.set(node, marker);
  });
  function restore(node) {
    const marker = originalPlaces.get(node);
    marker.parentNode.insertBefore(node, marker.nextSibling);
  }
  function closeCalendar() {
    datePopover.hidden = true;
    calendarButton.setAttribute("aria-expanded", "false");
  }
  function syncCalendar() {
    const raw = originalCount.textContent.trim();
    const days = /^\d+$/.test(raw) ? raw : "0";
    calendarNumber.textContent = days;
    const start = get("startDate").value;
    const end = get("endDate").value;
    const year = get("weekCalendarYear").textContent.trim();
    calendarButton.setAttribute("aria-label",
      `ISO calendar week ${days}${year && year !== "—" ? " of " + year : ""}. Monday ${start || "not set"} through Sunday ${end || "not set"}. Choose a planning week.`);
  }
  function arrange() {
    if (desktop.matches) {
      introTarget.append(nameField, intro);
      searchTarget.append(searchInput, searchButton, filterButton);
      datePopover.append(dates);
      get("startDate").readOnly = true;
      get("endDate").readOnly = true;
      weekName.placeholder = "Give this week a name";
      weekName.setAttribute("aria-label", "Week name");
      searchPanel.hidden = true;
      searchButton.setAttribute("aria-expanded", "false");
      filterPanel.hidden = true;
      filterButton.setAttribute("aria-expanded", "false");
    } else {
      movable.forEach(restore);
      get("startDate").readOnly = false;
      get("endDate").readOnly = true;
      weekName.placeholder = originalNamePlaceholder;
      filterPanel.hidden = true;
      filterButton.setAttribute("aria-expanded", "false");
    }
    closeCalendar();
    syncCalendar();
  }
  arrange();
  if (desktop.addEventListener) desktop.addEventListener("change", arrange);
  else desktop.addListener(arrange);

  new MutationObserver(syncCalendar).observe(originalCount, {
    childList:true,characterData:true,subtree:true
  });
  get("startDate").addEventListener("change", syncCalendar);
  get("endDate").addEventListener("change", syncCalendar);
  get("startDate").addEventListener("weekwindowchange", syncCalendar);

  calendarButton.addEventListener("click", event => {
    if (!desktop.matches) return;
    event.stopPropagation();
    const opening = datePopover.hidden;
    datePopover.hidden = !opening;
    calendarButton.setAttribute("aria-expanded", String(opening));
  });
  datePopover.addEventListener("click", event => event.stopPropagation());
  document.addEventListener("click", event => {
    if (desktop.matches && !calendarWrap.contains(event.target)) closeCalendar();
  });
  document.addEventListener("keydown", event => {
    if (desktop.matches && event.key === "Escape" && !datePopover.hidden) {
      closeCalendar();
      calendarButton.focus();
    }
  });

  // The search field is already visible. Its existing search logic remains active.
  searchButton.addEventListener("click", event => {
    if (!desktop.matches) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    searchPanel.hidden = true;
    searchButton.setAttribute("aria-expanded", "false");
    searchInput.focus();
  }, true);

  // Let the original filter button handler toggle the existing filter panel,
  // without the document's click-away logic closing it immediately.
  searchTarget.addEventListener("click", event => {
    if (!desktop.matches) return;
    if (event.target.closest("#filterToggle")) {
      event.stopPropagation();
      const box = filterButton.getBoundingClientRect();
      filterPanel.style.top = Math.min(window.innerHeight - 95,box.bottom + 8) + "px";
      filterPanel.style.right = Math.max(12,window.innerWidth - box.right) + "px";
    }
  });

  archiveReset.addEventListener("click", () => {
    if (!desktop.matches) return;
    // Archiving is a placeholder. Do not reset anything without first saving it.
    get("archiveButtonMain").click();
  });

  deleteMeals.addEventListener("click", () => {
    if (!desktop.matches) return;
    const rows = [...weekBody.querySelectorAll("[data-day-row]")];
    const hasData = rows.some(row =>
      [...row.querySelectorAll(".component-input")].some(input => input.value.trim()) ||
      row.querySelector(".shopping-check").checked
    );
    if (!hasData) return;
    if (!window.confirm("Delete all meals and shopping selections from this week without archiving? The week name and dates will remain.")) return;
    // Keep seven days, four meals per day, and one editable component per meal.
    rows.forEach(row => {
      row.querySelector(".shopping-check").checked = false;
      row.querySelectorAll(".component-list").forEach(list => {
        const first = list.querySelector(".component-item");
        if (!first) return;
        first.querySelector(".component-input").value = "";
        list.replaceChildren(first);
      });
    });
    searchInput.value = "";
    mealFilter.value = "all";
    searchInput.dispatchEvent(new Event("input", {bubbles:true}));
  });
})();
