---
name: modifying-web-applications
description: >-
  Guides the design-compliant, modular refactoring and modification of the Vite/React application. Use when adding features, refactoring layout/components, applying design system tokens, or decomposing App.jsx. Don't use for backend-only database schema updates.
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

- `src/App.jsx`: Main entry point containing application layout and orchestrating root state.
- `src/components/`: Subdirectory for modular, segregated UI components (e.g., `Sidebar.jsx`, `TaskList.jsx`, `TaskItem.jsx`, `ListSelector.jsx`).
- `src/firebase.js`: Storage layer and database interaction logic.
- `src/index.css`: Style variables and base element guidelines.

## React & Architecture Best Practices

1. **Module Segregation (Decompose App.jsx)**: Avoid adding new features directly to the monolithic `src/App.jsx`. Extract UI blocks and functional areas into dedicated components in `src/components/`. Keep components small, focused on a single responsibility, and reusable.
2. **State Scoping & Colocation**: Lift state only as high as necessary. Keep local UI states (like editing modes, dropdown open states, hover states) within their respective child components rather than polluting the global or app-level state in `App.jsx`.
3. **Hook Safety & Dependency Arrays**: 
   - Always specify complete dependency arrays for `useEffect`, `useCallback`, and `useMemo`.
   - Never leave out variables accessed inside the hook, as this leads to stale closures, but also be careful not to introduce values that trigger infinite re-render loops.
4. **Stable Keys for Lists**: Always use unique, stable IDs (like `task.id` or `list.id`) as React `key` props when rendering lists. Avoid using array index (`index`) as keys, especially since tasks can be filtered, sorted, or reordered.
5. **Component Purity**: Separate presentation from data-fetching or state-saving where possible. Pass callback functions (`onSave`, `onDelete`) down to child components rather than invoking Firebase/Firestore calls directly inside deep UI nodes.

## Code Editing Best Practices

1. **Keep Fallbacks Intact**: Ensure that if the database is running in mock mode (i.e. `dbMode === 'local'`), the application does not crash.
2. **Reuse Lucide Icons**: Import icons from `lucide-react`. Use existing icon style guidelines (`size`, `color`).
3. **Responsive Grids**: Use flexible container elements (Flexbox or Grid) to ensure the interface renders beautifully on mobile, tablet, and widescreen.
4. **Implementation Plan Approval**: Always write or update the implementation plan (`implementation_plan.md`) and obtain explicit user approval before modifying any files or beginning implementation on a new feature.

## E2E Testing Compatibility

To ensure automated E2E testing (Puppeteer) remains fully functional, you must preserve the exact `data-testid` attributes on interactive UI elements:
- `data-testid="task-row"`: The container for each parent task and subtask row.
- `data-testid="add-subtask-btn"`: The button that triggers the subtask input tray.
- `data-testid="edit-details-btn"`: The button that expands the task details form.
- `data-testid="delete-task-btn"`: The button to delete a task.
- `data-testid="due-date-input"`: The `<input type="date">` field inside the details form.
- `data-testid="due-time-input"`: The `<input type="time">` field inside the details form.
- `data-testid="tag-input"`: The `<input type="text">` for adding new tags.
- `data-testid="tag-filter-All"`: The tag filtering reset button.
- `data-testid="tag-filter-[tag-name]"`: Specific tag filter buttons (e.g., `tag-filter-Urgent`).
- `data-testid="reminder-popup"`: The floating due date reminder dialog.
- `data-testid="dismiss-reminder-btn"`: The button to dismiss the reminder.
- `data-testid="blocker-warning"`: The alert warning for parent tasks blocked by subtasks.

## Build & Deployment Troubleshooting

1. **Vite CLI Module Resolution**:
   - If running `npm run build` fails with `ERR_MODULE_NOT_FOUND` on `/node_modules/.bin/vite`, the bin script may have been copied as a flat file instead of a symbolic link.
   - **Resolution**: Recreate the symbolic link:
     ```bash
     rm node_modules/.bin/vite && ln -s ../vite/bin/vite.js node_modules/.bin/vite
     ```
2. **Firebase Deploy Authentication**:
   - If deploying via the headless environment results in credential errors, authenticate using local Application Default Credentials (ADC) after setting the quota project:
     ```bash
     gcloud auth application-default set-quota-project <project_id>
     npx firebase-tools logout # Clear stale cached credentials
     npx firebase-tools deploy --only hosting
     ```
