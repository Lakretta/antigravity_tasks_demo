---
description: >-
  Guides the selection, generation, and posting of new feature polls to Firestore for user voting. Use when preparing the next iteration's design options or seeding feature polls into Firestore. Don't use for general database operations or coding/debugging.
---

# Generating New Features Workflow

Use this workflow when you need to decide, formulate, and post the next iteration's design questions and feature choices to Firestore.

## Selection Rules

1. **Keep Features Simple & Incremental**: Design feature additions that fit the current Google Tasks structure and can be built cleanly.
2. **List of Preferable Features**:
   - **Task Search**: Filter tasks instantly with a text search bar.
   - **Task Notes**: Rich text descriptions or checklists inside a task.
   - **Calendar View**: Plotted timeline showing tasks on calendar dates.
   - **Export Tasks**: Download list of tasks as CSV, JSON
   - **Recurring Tasks**: Schedule repeating tasks (Daily, Weekly, Monthly).
   - **Category Tags**: Tag hierarchy or nested tag collections.
3. **Fallback to Custom Features**: If all of the above preferable features are already implemented in the application, propose custom innovative suggestions based on current application workflows and requirements.

---

## Operations Guide

### 1. Seeding / Replenishing Features in Firestore
To replenish the active features in the pool back to 3 items, run the helper script in **automated mode** (without any arguments):

```bash
python3 .agents/workflows/generate_new_feature/scripts/post_next_feature.py
```

The script will query the current active features (status `voting` or `implementing`) in the database. If there are fewer than 3 active features, it automatically selects the next un-implemented features from the preferable list (or custom pool) and adds them with status `voting` until the active pool size is exactly 3.

---

### 2. Posting a Specific Feature Document
To manually add a specific feature choice to the voting pool, run the helper script with the target ID and feature Name:

```bash
python3 .agents/workflows/generate_new_feature/scripts/post_next_feature.py \
  --id {feature_id} \
  --name "{feature_name}"
```

#### Example Usage:
```bash
python3 .agents/workflows/generate_new_feature/scripts/post_next_feature.py \
  --id calendar_view \
  --name "Calendar view"
```
