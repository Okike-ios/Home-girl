/* HG-BULK-P6 — mobile-only workspace arrangement.
 * Reparents EXISTING inputs/controls; never duplicates cycle state.
 * Desktop elements are returned to their original positions on resize.
 */
(() => {
  "use strict";
  const mobile = window.matchMedia("(max-width: 759px)");
  const page = document.querySelector('body[data-hg-section="cook"]');
  if (!page) return;
  const one = selector => document.querySelector(selector);
  const intro = one(".bulk-intro-copy");
  const bulkIntro = one(".bulk-intro");
  const nameField = one(".plan-section .name-field");
  const dates = one(".plan-section .date-fields");
  const searchInput = one("#dishSearch");
  const searchButton = one("#searchToggle");
  const filterButton = one("#filterToggle");
  const searchBar = one("#mobileBulkSearch");
  const calendarBox = one(".mobile-cycle-calendar");
  const datePopup = one("#mobileDatePopover");
  const calendarButton = one("#mobileCycleCalendar");
  const calendarNumber = one("#mobileCalendarNumber");
  const originalCount = one("#countdownNumber");
  const archiveReset = one("#mobileArchiveReset");
  const deleteButton = one("#mobileDeleteDishes");
  const tableBody = one("#cookTableBody");
  const filterPanel = one("#filterPanel");
  const searchPanel = one("#searchPanel");
  const originalName = one("#planName");
  const originalTitle = one(".bulk-intro-copy h1");
  const mobileHeaderLeft = one(".app-header .header-side");
  const desktopNamePlaceholder = originalName.placeholder;
  const nodes = [nameField, dates, searchInput, searchButton, filterButton, calendarBox];
  if (nodes.some(node => !node) || !datePopup || !intro || !searchBar || !bulkIntro) return;

  const placeholders = new Map();
  nodes.forEach(node => {
    const marker = document.createComment("Home Girl original position");
    node.parentNode.insertBefore(marker, node);
    placeholders.set(node, marker);
  });
  function returnToOriginal(node) {
    const marker = placeholders.get(node);
    marker.parentNode.insertBefore(node, marker.nextSibling);
  }
  function showDatePopover(show) {
    datePopup.hidden = !show;
    calendarButton.setAttribute("aria-expanded", String(show));
  }
  function syncCalendar() {
    const raw = originalCount.textContent.trim();
    calendarNumber.textContent = /^\d+$/.test(raw) ? raw : "0";
    const start = one("#startDate").value;
    const end = one("#endDate").value;
    const detail = start || end ? `From ${start || "not set"} to ${end || "not set"}` : "No cooking dates selected";
    calendarButton.setAttribute("aria-label", `Cooking cycle calendar: ${calendarNumber.textContent} days. ${detail}. Tap to set dates.`);
  }
  new MutationObserver(syncCalendar).observe(originalCount, {childList:true,characterData:true,subtree:true});
  one("#startDate").addEventListener("change", syncCalendar);
  one("#endDate").addEventListener("change", syncCalendar);

  // The same cycle controls power phone and laptop layouts. Move the actual
  // inputs, never copies, into the unified workspace at either screen size.
  function arrangeWorkspace() {
    intro.insertBefore(nameField, originalTitle);
    originalName.placeholder = "Give this cycle a name";
    originalName.setAttribute("aria-label", "Cycle name");
    searchBar.append(searchInput, searchButton, filterButton);
    datePopup.append(dates);
    mobileHeaderLeft.append(calendarBox);
    searchPanel.hidden = true;
    searchButton.setAttribute("aria-expanded", "false");
    showDatePopover(false);
    syncCalendar();
  }
  arrangeWorkspace();

  // In phone layout, Search is an always-visible field; the icon focuses it.
  searchButton.addEventListener("click", event => {
    event.stopImmediatePropagation();
    event.preventDefault();
    searchPanel.hidden = true;
    searchButton.setAttribute("aria-expanded", "false");
    searchInput.focus();
  }, true);

  // The original filter-popover handler remains intact; prevent the existing
  // document-level click-away handler closing it in the same click.
  filterButton.addEventListener("click", event => {
    event.stopPropagation();
    const bounds = filterButton.getBoundingClientRect();
    filterPanel.style.top = Math.min(window.innerHeight - 90, bounds.bottom + 8) + "px";
    filterPanel.style.right = Math.max(12, window.innerWidth - bounds.right) + "px";
  });
  calendarButton.addEventListener("click", event => {
    event.stopPropagation();
    showDatePopover(datePopup.hidden);
  });
  datePopup.addEventListener("click", event => event.stopPropagation());
  document.addEventListener("click", event => {
    if (!calendarBox.contains(event.target)) showDatePopover(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !datePopup.hidden) {
      showDatePopover(false);
      calendarButton.focus();
    }
  });

  // Archive has no storage/History implementation in the current prototype.
  // Do not reset/delete unsaved dishes under the label "Archive & reset".
  archiveReset.addEventListener("click", () => {
    window.alert("Archive & Reset is not available yet. Bulk Cooking cycles are not currently saved to History, so your dishes have NOT been cleared.");
  });
  deleteButton.addEventListener("click", () => {
    if (!tableBody.querySelector("[data-dish-row]")) return;
    if (!window.confirm("Delete all dishes in this cycle without archiving? This cannot be undone.")) return;
    tableBody.replaceChildren();
    searchInput.value = "";
    one("#dishFilter").value = "all";
    searchInput.dispatchEvent(new Event("input", {bubbles:true}));
  });
  syncCalendar();

  // Phone: right-swipe back, without interfering with card selection, editing,
  // inputs, the calendar popover, or browser vertical scrolling.
  let touchStart = null;
  document.addEventListener("touchstart", event => {
    if (!mobile.matches || event.touches.length !== 1) { touchStart = null; return; }
    const target = event.target;
    if (target.closest("input,textarea,select,button,a,[contenteditable],.mobile-date-popover")) {
      touchStart = null;
      return;
    }
    const p = event.touches[0];
    touchStart = {x:p.clientX,y:p.clientY,time:Date.now()};
  }, {passive:true});
  document.addEventListener("touchend", event => {
    if (!touchStart || !mobile.matches || !event.changedTouches.length) return;
    const p = event.changedTouches[0];
    const dx = p.clientX-touchStart.x, dy = p.clientY-touchStart.y;
    const elapsed = Date.now()-touchStart.time;
    touchStart = null;
    if (dx > 95 && Math.abs(dy) < 55 && dx > Math.abs(dy)*1.7 && elapsed < 850) {
      window.location.href = "nourishment-os.html";
    }
  }, {passive:true});
  document.addEventListener("touchcancel", () => {touchStart=null}, {passive:true});
})();
