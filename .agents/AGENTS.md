# Workspace Customization Rules

These rules apply universally to all agent operations within this workspace.

## 1. Design System Guidelines

- **Typography**: Always use `font-family: var(--font-sans)` ('Google Sans', 'Roboto') for visual consistency.
- **Colors**: Never use hardcoded color codes (like `#1a73e8` or `#f0f4f9`) in React inline styles or component styles. Instead, use standard CSS design tokens defined in `src/index.css`:
  - Accent/Primary Brand color: `var(--color-brand)`
  - Active background color: `var(--color-brand-light)`
  - Primary text: `var(--text-primary)`
  - Secondary text: `var(--text-secondary)`
  - Borders: `var(--border-color)`
  - Surfaces: `var(--bg-primary)` (for white/dark grey surfaces) or `var(--bg-secondary)` (for off-white/light grey containers)
- **Transitions**: Apply `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` or add `className="transition-all"` for interactive component hovers and checkbox transitions.

## 2. React & Architecture Best Practices

1. **Module Segregation (Decompose App.jsx)**: Avoid adding new features directly to the monolithic `src/App.jsx`. Extract UI blocks and functional areas into dedicated components in `src/components/`. Keep components small, focused on a single responsibility, and reusable.
2. **State Scoping & Colocation**: Lift state only as high as necessary. Keep local UI states (like editing modes, dropdown open states, hover states) within their respective child components rather than polluting the global or app-level state in `App.jsx`.
3. **Hook Safety & Dependency Arrays**: 
   - Always specify complete dependency arrays for `useEffect`, `useCallback`, and `useMemo`.
   - Never leave out variables accessed inside the hook, as this leads to stale closures.
4. **Stable Keys for Lists**: Always use unique, stable IDs (like `task.id` or `list.id`) as React `key` props when rendering lists. Avoid using array index (`index`) as keys, especially since tasks can be filtered, sorted, or reordered.
5. **Component Purity**: Separate presentation from data-fetching or state-saving where possible. Pass callback functions (`onSave`, `onDelete`) down to child components rather than invoking Firebase/Firestore calls directly inside deep UI nodes.

## 3. E2E Testing Compatibility

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

## 4. State Management & Implementation Rules

1. **Always plan and obtain approval**: Do not implement a selected feature immediately. Instead, first create/update `implementation_plan.md` detailing the design, file modifications, and validation steps. Wait for explicit user review and approval before writing code.
2. **Create Jira task AFTER approval**: Once the implementation plan has been approved by the user, create a corresponding Jira task using `jira_helper.py`.
3. **Execute and test in visible browser**: After implementing the feature, run the E2E test in a visible browser view (non-headless mode) so that the user can see the UI:
   ```bash
   node .agents/skills/end_to_end_testing/scripts/test_runner.cjs --url http://localhost:5173
   ```
4. **Fix failures and re-test**: If the test fails, debug the issues, fix the code, and run the test again until it passes successfully.
5. **Deploy after successful implementation**: Once the feature is successfully implemented and E2E tests pass, deploy the application using the `firebase_deployment` skill.
6. **Mark implemented and close Jira task**: Once verified and deployed to Firebase Hosting, transition the corresponding Jira task to Done, post the walkthrough contents as a comment, and complete the sync.
