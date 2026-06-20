---
name: google-tasks-modifier
description: Guides the safe, design-compliant modification of the Google Tasks custom web application codebase (React/Vite).
---

# Google Tasks Code Modifier Skill

Use this skill when modifying the user interface or adding features to the Google Tasks custom web app.

## Design System Guidelines

- **Typography**: Always use `font-family: var(--font-sans)` ('Google Sans', 'Roboto') for visual consistency.
- **Colors**: Never use hardcoded color codes (like `#1a73e8` or `#f0f4f9`) in React inline styles or component styles. Instead, use standard CSS design tokens defined in `src/index.css`:
  - Accent/Primary Brand color: `var(--color-brand)`
  - Active background color: `var(--color-brand-light)`
  - Primary text: `var(--text-primary)`
  - Secondary text: `var(--text-secondary)`
  - Borders: `var(--border-color)`
  - Surfaces: `var(--bg-primary)` (for white/dark grey surfaces) or `var(--bg-secondary)` (for off-white/light grey containers)
- **Transitions**: Apply `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` or add `className="transition-all"` for interactive component hovers and checkbox transitions.

## Folder Organization

- `src/App.jsx`: Main entry point containing application layout and board details.
- `src/firebase.js`: Storage layer initialization.
- `src/index.css`: Style variables and base element guidelines.

## Code Editing Best Practices

1. **Keep Fallbacks Intact**: Ensure that if the database is running in mock mode (i.e. `dbMode === 'local'`), the application does not crash.
2. **Reuse Lucide Icons**: Import icons from `lucide-react`. Use existing icon style guidelines (`size`, `color`).
3. **Responsive Grids**: Use flexible container elements (Flexbox or Grid) to ensure the interface renders beautifully on mobile, tablet, and widescreen.
4. **Implementation Plan Approval**: Always write or update the implementation plan (`implementation_plan.md`) and obtain explicit user approval before modifying any files or beginning implementation on a new feature.
