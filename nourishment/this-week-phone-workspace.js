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

  // Match Bulk Cooking: a deliberate right-swipe navigates back on phones.
  // Do not intercept vertical scrolling or gestures inside editing controls.
  let swipeStart = null;
  document.addEventListener("touchstart", event => {
    if (!phone.matches || event.touches.length !== 1) {
      swipeStart = null;
      return;
    }
    if (event.target.closest("input,textarea,select,button,a,[contenteditable],.week-date-popover,.week-phone-days")) {
      swipeStart = null;
      return;
    }
    const point = event.touches[0];
    swipeStart = {x:point.clientX,y:point.clientY,time:Date.now()};
  },{passive:true});
  document.addEventListener("touchend", event => {
    if (!swipeStart || !phone.matches || event.changedTouches.length !== 1) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - swipeStart.x;
    const dy = point.clientY - swipeStart.y;
    const elapsed = Date.now() - swipeStart.time;
    swipeStart = null;
    if (dx > 95 && Math.abs(dy) < 55 && dx > Math.abs(dy)*1.7 && elapsed < 850) {
      window.location.href = "nourishment-os.html";
    }
  },{passive:true});
  document.addEventListener("touchcancel", () => {swipeStart = null;},{passive:true});

  arrangePhone();
  if (phone.addEventListener) phone.addEventListener("change", arrangePhone);
  else phone.addListener(arrangePhone);
})();
