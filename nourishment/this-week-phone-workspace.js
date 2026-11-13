/* HG-WEEK-M2 — phone header and planner tools matched to Bulk Cooking.
 * Only repositions EXISTING search/date inputs. No duplicate meal data.
 * The laptop workspace script retains control at widths >= 760px.
 */
(() => {
  "use strict";
  const phone = window.matchMedia("(max-width: 759px)");
  const get = id => document.getElementById(id);
  const searchTarget = get("weekPhoneSearch");
  const searchInput = get("mealSearch");
  const searchButton = get("searchToggle");
  const filterButton = get("filterToggle");
  const searchPanel = get("searchPanel");
  const filterPanel = get("filterPanel");
  const calendarWrap = get("weekCalendarControl");
  const calendarButton = get("weekCalendarButton");
  const datePopover = get("weekDatePopover");
  const dateFields = document.querySelector(".this-week-page .plan-section .date-fields");
  const weekDateChoice = get("weekDateChoice");
  if (!searchTarget || !searchInput || !searchButton || !filterButton ||
      !searchPanel || !filterPanel || !calendarWrap || !calendarButton ||
      !datePopover || !dateFields || !weekDateChoice) return;

  function closeCalendar() {
    datePopover.hidden = true;
    calendarButton.setAttribute("aria-expanded", "false");
  }

  function arrangePhone() {
    if (!phone.matches) {
      // The existing laptop workspace controller restores its own controls.
      closeCalendar();
      return;
    }
    searchTarget.append(searchInput, searchButton, filterButton);
    datePopover.append(dateFields);
    searchPanel.hidden = true;
    searchButton.setAttribute("aria-expanded", "false");
    closeCalendar();
  }

  // Source handlers are attached before this script. A capture-phase listener
  // prevents the old Search popup opening when search is already visible.
  searchButton.addEventListener("click", event => {
    if (!phone.matches) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    searchPanel.hidden = true;
    searchButton.setAttribute("aria-expanded", "false");
    searchInput.focus();
  }, true);

  // Keep the original filter menu logic, but prevent the original click-away
  // document listener from closing it in the very same interaction.
  searchTarget.addEventListener("click", event => {
    if (!phone.matches || !event.target.closest("#filterToggle")) return;
    event.stopPropagation();
    const rect = filterButton.getBoundingClientRect();
    filterPanel.style.top = Math.max(8, Math.min(window.innerHeight - 90, rect.bottom + 8)) + "px";
    filterPanel.style.right = Math.max(12, window.innerWidth - rect.right) + "px";
  });

  calendarButton.addEventListener("click", event => {
    if (!phone.matches) return;
    event.stopPropagation();
    const opening = datePopover.hidden;
    datePopover.hidden = !opening;
    calendarButton.setAttribute("aria-expanded", String(opening));
  });
  datePopover.addEventListener("click", event => {
    if (phone.matches) event.stopPropagation();
  });
  document.addEventListener("click", event => {
    if (phone.matches && !calendarWrap.contains(event.target)) closeCalendar();
  });
  document.addEventListener("keydown", event => {
    if (phone.matches && event.key === "Escape" && !datePopover.hidden) {
      closeCalendar();
      calendarButton.focus();
    }
  });

  arrangePhone();
  if (phone.addEventListener) phone.addEventListener("change", arrangePhone);
  else phone.addListener(arrangePhone);
})();
