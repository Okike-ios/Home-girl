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
- Responsive month calendar with month navigation, Today shortcut and task/reminder indicators; selecting a date gives daily details.
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
