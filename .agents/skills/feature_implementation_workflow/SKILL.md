---
name: syncing-feature-feedback
description: >-
  Synchronizes user feature feedback and design selections between Firestore and local development, posting new design questions. Use when pulling unprocessed choices, creating corresponding task tickets, or updating current iteration questions. Don't use for general database migrations.
---

# AI Feedback Synchronization Skill

Use this skill to fetch client selections from the Firestore database and coordinate their processing.

## Operations Guide

### 1. Automated Feedback Sync & Voting Aggregation
Run the automated sync script to query Firestore for the active question, aggregate all its votes, find the feature option with the maximum vote count, create a corresponding Jira task, mark the question's status as `implementing`, and mark all votes for it as processed:
```bash
# Start implementation of winning feature (aggregates votes)
python3 .agents/skills/feature_implementation_workflow/scripts/sync_workflow.py --action start
```

### 2. Complete Implementation & Replenish Poll Options
Once a feature has been implemented, verified, and deployed, mark the feature option as implemented in the active question document. This removes it from the UI voting choices, moves it into the implemented features array, and replenishes the voting options with a new choice to keep at least 3 active options:
```bash
python3 .agents/skills/feature_implementation_workflow/scripts/sync_workflow.py --action complete --question_id {question_id} --feature_text "{feature_text}"
```


### 3. Manual Fetch User Choices
Run `python3 .agents/skills/feature_implementation_workflow/scripts/fetch_user_answers.py` to manually view response documents in the terminal.

### 4. Post Walkthrough Comment & Close Jira Issue
Once a feature has been implemented, verified, and documented in `walkthrough.md`, add the walkthrough text as a comment on the Jira issue and transition it to Done using the helper script:
```bash
# Add walkthrough comment
python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --action comment --issue KAN-XXX --comment "$(cat walkthrough.md)"

# Transition issue to Done
python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --action transition --issue KAN-XXX --transition Done
```

## State Management Rules

1. Always mark an answer as `processed: true` in Firestore once you begin implementing it to avoid reading the same selection repeatedly.
2. Formulate only one active question at a time to prevent user confusion.
3. If no config variables are present, output local JSON mocks to test the integration state.
4. After feature implementation, the corresponding Jira task must be transitioned to 'Done' and the contents of `walkthrough.md` must be added as a comment to the task.
