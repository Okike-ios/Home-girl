/* HG-WEEK-D3 — laptop/desktop meal-column visibility and shared Select All.
   Keep all four meal inputs in the DOM, preserving their contents when hidden.
   The weekly table's width and its seven day rows are never changed.
*/
(() => {
  "use strict";
  const desktop = window.matchMedia("(min-width: 760px)");
  const table = document.querySelector(".this-week-page .week-table");
  const tbody = document.getElementById("weekTableBody");
  const actionButton = document.getElementById("weekEditTableButton");
  const popover = document.getElementById("weekEditTablePopover");
  const popoverWrap = document.querySelector(".week-table-edit-wrap");
  const desktopSelect = document.getElementById("weekDesktopShopSelect");
  const master = document.getElementById("masterShoppingCheck");
  const phoneEdit = document.getElementById("weekPhoneEditButton");
  const phoneActionArea = document.querySelector(".this-week-page .bottom-actions");
  if (!table || !tbody || !actionButton || !popover || !desktopSelect || !master) return;

  const mealNames = ["breakfast", "lunch", "brunch", "dinner"];
  const mealHeaders = Array.from(table.tHead.rows[0].cells).slice(1,5);
  const choices = Array.from(popover.querySelectorAll('input[type="checkbox"]'));
  const masterLabel = master.closest(".master-label");
  const pickerLocation = document.createComment("Original table edit popover position");
  popover.parentNode.insertBefore(pickerLocation, popover);
  const originalLocation = document.createComment("Original shopping select position");
  masterLabel.parentNode.insertBefore(originalLocation, masterLabel);

  function closePicker() {
    popover.hidden = true;
    actionButton.setAttribute("aria-expanded", "false");
    if (phoneEdit) phoneEdit.setAttribute("aria-expanded", "false");
  }
  function selectedNames() {
    return new Set(choices.filter(choice => choice.checked).map(choice => choice.value));
  }
  function applyColumns() {
    const selected = selectedNames();
    const desktopMode = desktop.matches;
    const visibleCount = desktopMode ? selected.size : mealNames.length;
    table.style.setProperty("--visible-week-meals", String(visibleCount));
    mealNames.forEach((meal, index) => {
      const hidden = !selected.has(meal);
      mealHeaders[index].classList.toggle("week-meal-hidden", hidden);
      tbody.querySelectorAll('td[data-meal="' + meal + '"]').forEach(cell => {
        cell.classList.toggle("week-meal-hidden", hidden);
        cell.classList.toggle("week-phone-meal-hidden", !desktopMode && hidden);
      });
    });
  }
  function arrange() {
    if (desktop.matches) {
      desktopSelect.append(masterLabel);
      pickerLocation.after(popover);
    } else {
      originalLocation.after(masterLabel);
      if (phoneActionArea) phoneActionArea.append(popover);
    }
    applyColumns();
    closePicker();
  }

  choices.forEach(choice => choice.addEventListener("change", () => {
    if (selectedNames().size === 0) {
      // Always leave at least one meal column visible.
      choice.checked = true;
      choice.focus();
    }
    applyColumns();
  }));
  actionButton.addEventListener("click", event => {
    if (!desktop.matches) return;
    event.stopPropagation();
    const opening = popover.hidden;
    popover.hidden = !opening;
    actionButton.setAttribute("aria-expanded", String(opening));
  });
  if (phoneEdit) phoneEdit.addEventListener("click", event => {
    if (desktop.matches) return;
    event.stopPropagation();
    const opening = popover.hidden;
    popover.hidden = !opening;
    phoneEdit.setAttribute("aria-expanded", String(opening));
  });
  popover.addEventListener("click", event => event.stopPropagation());
  document.addEventListener("click", event => {
    if (desktop.matches && !popoverWrap.contains(event.target)) closePicker();
    if (!desktop.matches && !event.target.closest(".this-week-page .bottom-actions")) closePicker();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !popover.hidden) {
      closePicker();
      if (desktop.matches) actionButton.focus();
      else phoneEdit?.focus();
    }
  });

  arrange();
  if (desktop.addEventListener) desktop.addEventListener("change", arrange);
  else desktop.addListener(arrange);
})();
