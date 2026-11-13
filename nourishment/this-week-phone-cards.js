/* HG-WEEK-M1 — mobile day-by-day view adapted from the Work source ZIP.
 * Seven-day selector and meal-slot cards are a presentation of the EXISTING
 * seven rows and components. No duplicate meal data, no new save mechanism.
 */
(() => {
  "use strict";
  const phone = window.matchMedia("(max-width: 759px)");
  const planner = document.getElementById("weekPhonePlanner");
  const strip = document.getElementById("weekPhoneDays");
  const body = document.getElementById("weekTableBody");
  const start = document.getElementById("startDate");
  const weekName = document.getElementById("weekName");
  const number = document.getElementById("countdownNumber");
  const choice = document.getElementById("weekPhoneDateChoice");
  const heading = document.getElementById("weekPhoneName");
  const range = document.getElementById("weekPhoneRange");
  const selectedDayHeading = document.getElementById("weekPhoneSelectedDay");
  const selectedDate = document.getElementById("weekPhoneSelectedDate");
  if (!planner || !strip || !body || !start || !choice) return;

  const labels = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const shortLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const rows = Array.from(body.querySelectorAll("[data-day-row]"));
  let active = 0;
  const buttons = labels.map((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "week-phone-day-button";
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    button.setAttribute("aria-label", "Plan " + day);
    const name = document.createElement("span");
    name.className = "week-phone-day-name";
    name.textContent = shortLabels[index];
    const date = document.createElement("span");
    date.className = "week-phone-day-date";
    date.textContent = "—";
    button.append(name,date);
    button.addEventListener("click", () => {
      active = index;
      showDay();
    });
    strip.append(button);
    return button;
  });

  const empty = document.createElement("p");
  empty.className = "week-phone-no-match";
  empty.hidden = true;
  empty.textContent = "This day is excluded by the current search or filter. Clear the filter to see its meals.";
  planner.append(empty);

  function parsedStart() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start.value)) return null;
    const [y,m,d] = start.value.split("-").map(Number);
    const value = new Date(Date.UTC(y,m-1,d));
    if (value.getUTCFullYear() !== y || value.getUTCMonth() !== m-1 || value.getUTCDate() !== d) return null;
    return value;
  }
  function dateAt(index) {
    const monday = parsedStart();
    if (!monday) return null;
    monday.setUTCDate(monday.getUTCDate() + index);
    return monday;
  }
  function fmt(value, options) {
    return new Intl.DateTimeFormat(undefined,{timeZone:"UTC",...options}).format(value);
  }
  function showDay() {
    rows.forEach((row,index) => row.classList.toggle("week-phone-selected",index===active));
    buttons.forEach((button,index) => button.setAttribute("aria-pressed",String(index===active)));
    selectedDayHeading.textContent = labels[active];
    const date = dateAt(active);
    selectedDate.textContent = date ? fmt(date,{weekday:"long",day:"numeric",month:"long"}) : "Select a planning week";
    empty.hidden = !phone.matches || !rows[active]?.hidden;
  }
  function syncWeek() {
    const monday = parsedStart();
    const name = weekName.value.trim();
    heading.textContent = name || "Weekly meal plan";
    choice.value = monday ? monday.toISOString().slice(0,10) : "";
    if (monday) {
      const sunday = dateAt(6);
      range.textContent = fmt(monday,{day:"numeric",month:"short"}) + " – " +
        fmt(sunday,{day:"numeric",month:"short",year:"numeric"}) +
        " · ISO Week " + number.textContent.trim();
    } else {
      range.textContent = "Choose your planning week";
    }
    buttons.forEach((button,index) => {
      const date = dateAt(index);
      button.querySelector(".week-phone-day-date").textContent = date ? String(date.getUTCDate()) : "—";
      button.setAttribute("aria-label",date ? labels[index] + ", " +
        fmt(date,{day:"numeric",month:"long",year:"numeric"}) : "Plan " + labels[index]);
    });
    showDay();
  }
  choice.addEventListener("change", () => {
    if (!choice.value) return;
    // Existing weekly logic normalises any chosen date to Monday and Sunday.
    start.value = choice.value;
    start.dispatchEvent(new Event("change",{bubbles:true}));
    active = 0;
    syncWeek();
  });
  weekName.addEventListener("input", syncWeek);
  start.addEventListener("change", syncWeek);
  start.addEventListener("weekwindowchange", syncWeek);
  new MutationObserver(syncWeek).observe(number,{childList:true,characterData:true,subtree:true});
  rows.forEach(row => new MutationObserver(showDay).observe(row,{attributes:true,attributeFilter:["hidden"]}));
  document.querySelectorAll("#mealSearch,#mealFilter").forEach(control => {
    control.addEventListener("input",showDay);
    control.addEventListener("change",showDay);
  });
  syncWeek();
})();
