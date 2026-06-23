---
trigger: manual
---

# Clean Code Guidelines

To maintain code readability, clarity, and long-term maintainability in this codebase, all agent operations must follow these clean code principles:

## 1. Self-Documenting Code & Naming Conventions
- Choose descriptive, unambiguous, and intention-revealing names for variables, functions, components, and files (e.g., use `isTaskOverdue` instead of `overdue` or `temp`).
- Avoid arbitrary abbreviations (e.g., use `handleTaskDeletion` instead of `delFn`).
- Naming should describe *what* the code does and *why*, not *how*.

## 2. Single Responsibility & Function Focus
- Keep functions, hooks, and components small and focused on a single responsibility.
- As a rule of thumb, if a function or component exceeds 20-30 lines of active logic, consider decomposing it into smaller, logical sub-components or utility helper functions.

## 3. Dead Code Elimination
- Proactively clean up the code. Do not leave commented-out code blocks, unused imports, or debug statement remnants (such as `console.log` or temporary test code) in the final codebase.
- Ensure that the repository remains clean and ready for production at the end of every task.

## 4. Don't Repeat Yourself (DRY)
- Avoid logic duplication. If similar blocks of code or logic patterns are used in multiple places, extract them into pure, reusable utility helper functions or custom React hooks.
- Colocate utilities logically (e.g., inside `src/utils/` or adjacent to their usage if local).

## 5. Avoid Magic Values
- Do not hardcode magic numbers or strings directly inside the execution logic.
- Declare descriptive constants (e.g., `const MAX_SUBTASKS_LIMIT = 5;`) or configuration objects at the top of the file or in a shared constants file.
