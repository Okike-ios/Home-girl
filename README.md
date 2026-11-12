# Home Girl — Soft Premium Home Screen (CSS refinement in progress)

This is the standalone Home Screen prototype selected as the initial GitHub foundation. It does not implement the operating-system modules.

## Preview
Open `index.html` in Chrome, Edge, Firefox, or Safari. Keep `assets/` alongside the HTML file.

## Included
- Approved Home Girl logo artwork (repository copy optimized for display; original high-resolution asset remains in the source archive)
- Real HTML/CSS cards and navigation, not a stretched screenshot
- Phone: top logo, notifications and settings; Dashboard / Home / Shop fixed bottom navigation; swipe right for Calendar placeholder, left for Shopping List placeholder
- Tablet/laptop: full-height sidebar with Home, Dashboard, Shop, Shopping List, Calendar, My Tasks, Notifications and Settings
- Six OS entry cards; household-wide This Week entry point; rotating personalized welcome lines
- Responsive two-column OS cards on phones and some tablets, three columns on wider screens
- Clearly identified placeholder destinations

## Not implemented
- Animations, changing room illustrations, page-turn effects, loading screen
- Nourishment OS, other OS modules, task and reminder workflows, Shop marketplace
- Data services, push notifications, native alarms

## Personalizing the preview
By default, the greeting says “Friend” because user accounts are not implemented.

In the browser console you can test a name:
`localStorage.setItem('homegirl-preferred-name','Laurel'); location.reload();`

## Review checklist
- Phone: all six cards readable, no horizontal overflow, bottom navigation accessible
- Tablet: sidebar, cards, welcome and This Week readable
- Laptop: sidebar fills height; responsive content does not stretch
- Links open clearly labeled placeholders; Home returns to the Home Screen

## Governance
Foundation upload: **HG-SETUP-001**. The Soft Premium visual direction is accepted as a working direction, but CSS polish and browser-level visual testing remain outstanding. This does not certify production readiness. Future work should use development branches and reviewed pull requests.

## HG-UX-003 — Soft Premium navigation and card refinement (2026-11-12)
The Product Owner explicitly authorized this revision directly on `main` (exception to the usual branch-and-PR development workflow).

- Desktop/tablet sidebar is organized into Your Space, Daily Life, and Preferences; Reminders now appears as a dedicated entry.
- Sidebar can collapse/expand from the always-visible inner minimize button or the chevron handle that appears near the outer sidebar edge on hover/focus. Its state persists in localStorage. All navigation destinations remain accessible as icons when collapsed.
- The page background is unchanged. This Week uses a flat pale-plum surface and the full card opens the existing placeholder destination.
- All six operating-system cards have distinct flat pastel backgrounds. The former tiny diagonal arrow glyphs were removed; the entire cards remain clickable.
- The introductory eyebrow text was removed; the main greeting now says `Welcome back, <preferred name>.` while the smaller encouragement rotates.
- Three tappable phone page dots indicate Calendar / Home / Shopping List. The existing swipe gesture is retained.
- All non-Home operating-system destinations remain placeholders; this is a visual/navigation refinement, not implementation of Calendar, Tasks, Reminders, or OS business logic.

Validation: connector readback confirmed the HTML, CSS, and JS files; JavaScript parsed successfully and targeted static checks passed. Live browser visual testing is **not yet verified**, so the updated layout needs Product Owner review.

## Proposed feature branch: Calendar, My Tasks & Reminders (HG-CAL-001 / HG-TASK-001 / HG-REM-001 / HG-INT-001)

**Branch:** `feature/calendar-tasks-reminders` (not merged into `main`). Design follows the established Soft Premium theme and retains the existing Home Screen and sidebar.

### Implemented in the review branch
- Responsive month calendar with month navigation, Today shortcut and task/reminder indicators; selecting a date **directly opens My Tasks filtered to that date** with Reminders and Events shortcuts.
- Select a Calendar date, then **View day’s tasks** to open My Tasks filtered to that date. Shortcuts for Reminders and Events are included; Events remains an existing placeholder.
- Task creation/editing, area assignment, notes, due date, completion/undo, deletion, Today/Upcoming/Overdue/Completed filters.
- Completed tasks remain visible on their completion day and can be found in Completed/history afterward. Overdue tasks offer explicit **Reschedule** and **Dismiss** actions; they are not silently erased.
- Standalone or task-linked reminders; one-time, daily, weekly or monthly recurrence; edit/delete; in-app due list and acknowledgement. Linked reminders stop alerting when their task is completed/dismissed.
- The household-wide This Week overview summarizes tasks and reminder schedules for the current Monday–Sunday week. It does **not** change the Nourishment meal-planning workflow.
- Data is saved only in this browser's localStorage under `homegirl-planner-v1`, not in Supabase. No sample household tasks or reminders are seeded automatically.

### Limitations and exclusions
- No Supabase persistence, accounts, cross-device sync, push notifications, native phone alarms, or background notifications when the app/browser is closed.
- No working Events OS integration; its existing placeholder is preserved.
- Browser-local data can disappear if site storage is cleared; do not treat this prototype as a durable records system.
- Due reminders are checked while the app is open or returns to the foreground; they are not guaranteed at exact minute resolution with suspended browser tabs.

### Review and tests
- Syntax and static integration checks completed using GitHub file readback.
- Interactions exercised with a mocked DOM: new task, completing tasks, overdue reschedule/dismiss, one-time and recurring reminder acknowledgements, calendar and weekly render.
- Repeatable Node tests: `node --test tests/planner.test.js` (requires Node.js; no packages/frameworks).
- **Pending:** visual and real-browser interaction tests on phone, tablet and laptop, keyboard/accessibility review, persistence tests with actual browser localStorage, and Product Owner acceptance. Do not merge until reviewed.

## HG-NAV-001 — Phone swipe-back history (proposed)
- On phone widths (below 760px), swipe **left** on the main workspace to return to the **actual previously visited screen**, rather than always going Home or opening Shopping List.
- Returning to Calendar retains its month and selected date; returning to filtered Tasks/Reminders retains the chosen filter; previous vertical scroll position is also restored.
- Back history is per open app session. At the first screen, swiping left does nothing.
- A right swipe from Home still opens Calendar; the three phone page dots still provide access to Calendar, Home and Shopping List.
- Vertical scrolls, form controls and open dialogs are not intended to activate swipe-back. Sidebar and other desktop/tablet navigation remain unchanged.
- Browser reload resets the in-app navigation stack; it does **not** delete locally saved task/reminder records.
- Regression tests: `node --test tests/navigation-history.test.js`.
- Requires real-device visual/touch testing and Product Owner review before acceptance.

## HG-NAV-001 direction correction (2026-11-12)
- On phones, **swiping right** returns to the previously visited page, restoring the saved planner filter/calendar state and scroll position.
- **Swiping left from Home** opens Shopping List; page dots remain available for direct navigation. A right swipe on Home when there is no prior page does nothing.
- The formerly described left-swipe Back and Home right-swipe Calendar behavior are superseded by this correction.
- Gesture regression tests were updated; actual-device testing remains pending.

## HG-NOUR-001 — Nourishment OS integration (merged baseline once accepted)

**Scope:** Connect the Home Screen Nourishment card to an integrated five-screen Nourishment workspace while keeping the current Rich Soft Premium Home Girl identity. Individual section accents remain: Menu blue, Cook Ahead wine, Nourishment This Week sage, Meal Maker ochre, Shopping coral, Pantry teal and History mauve.

**Source fidelity:** Imported the supplied HTML, CSS, and JavaScript for Nourishment landing, The Menu, Add New Dish, Cook Ahead, and Nourishment This Week. The original section JavaScript modules and section styles were preserved; an additional shared `nourishment/homegirl-integration.css` provides the Home Girl dark plum rail, compact mobile header, typography, background, cards and spacing. Missing legacy back links were corrected and the Nourishment card links to `nourishment/nourishment-os.html`.

**What works in the prototype:** Landing navigation to Menu/Cook Ahead/Nourishment This Week; existing form controls, Cook Ahead table and filtering, and weekly meal-plan controls. Each section remains separate from Home Girl's household-wide This Week.

**Not implemented in uploaded code:** Meal Maker, Nourishment Shopping List, Pantry, History destinations (shown as Coming Later); saved Cook Ahead and weekly plans. Do not mistake existing placeholders for functioning integrations.

**Data/security caveats:** Menu and Add Dish retain their existing Supabase client (publishable key, not a server secret). Live network access, authentication, row-level-security policies, ingredient persistence, image uploads, and multi-user data separation remain **unverified**. The original Menu source constructs HTML from returned dish data; sanitize/validate this before public multi-user release. The supplied image selector only previews an image; do not assume the image is uploaded.

**Validation evidence:** Original JS syntax checks passed. At 1280×900 and 390×844, local Chromium rendering showed no JavaScript exceptions when Supabase was mocked and all five sections had no horizontal document overflow. Cook Ahead Add Dish and search, This Week Add Meal Component and seven-day rows, and Add New Dish ingredient/category controls were exercised. A mock was used for Supabase, so no real database write/read was verified. Navigation relative links were checked locally. Repeatable static checks: `node --test tests/nourishment-integration.test.js`.

**Remaining acceptance:** Test all navigation and actual phone/tablet/laptop layouts on the deployed GitHub Pages site, verify live Supabase with safe test records and RLS, then obtain Product Owner feedback. The integration does not imply those tests have passed.
