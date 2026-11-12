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
