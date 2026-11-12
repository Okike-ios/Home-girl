# Home Girl — Soft Premium Home Screen v0.1

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
