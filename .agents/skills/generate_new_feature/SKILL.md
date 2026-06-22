---
name: generating-new-features
description: >-
  Guides the selection, generation, and posting of new feature polls to Firestore for user voting. Use when preparing the next iteration's design options or seeding feature polls into Firestore. Don't use for general database operations or coding/debugging.
---

# Generating New Features Skill

Use this skill when you need to decide, formulate, and post the next iteration's design questions and feature choices to Firestore.

## Selection Rules

1. **Keep Features Simple & Incremental**: Design feature additions that fit the current Google Tasks structure and can be built cleanly.
2. **List of Preferable Features**:
   - **Calendar View**: Plotted timeline showing tasks on calendar dates.
   - **Export Tasks**: Download list of tasks as CSV, JSON, or Google Sheets format.
   - **Recurring Tasks**: Schedule repeating tasks (Daily, Weekly, Monthly).
   - **Task Search**: Filter tasks instantly with a text search bar.
   - **Category Tags**: Tag hierarchy or nested tag collections.
   - **Task Notes**: Rich text descriptions or checklists inside a task.
   - **Shared Collaboration**: Real-time list sharing and invitations.
3. **Fallback to Custom Features**: If all of the above preferable features are already implemented in the application, propose custom innovative suggestions based on current application workflows and requirements.

---

## Operations Guide

### 1. Seeding / Posting Next Poll to Firestore
To post the next poll questions to the database:

1. Identify the next Question Version suffix (e.g., if the last processed question was `feature_selection_v5`, your next ID will be `feature_selection_v6`).
2. Run the helper script with the target ID, question title, and selectable option strings:

```bash
python3 .agents/skills/generate_new_feature/scripts/post_next_feature.py \
  --id {question_id} \
  --question "{question_text}" \
  --options "{option_1}" "{option_2}" "{option_3}"
```

#### Example Usage:
```bash
python3 .agents/skills/generate_new_feature/scripts/post_next_feature.py \
  --id feature_selection_v6 \
  --question "What productivity feature would you like Antigravity to build next?" \
  --options "Calendar view integration" "Export tasks to CSV / Google Sheets" "Recurring tasks (Daily, Weekly)"
```
