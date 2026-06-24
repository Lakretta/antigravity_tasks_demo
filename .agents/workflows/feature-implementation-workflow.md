---
description: >-
  Synchronizes user feature feedback and design selections between Firestore and local development, posting new design questions. Use when pulling unprocessed choices, creating corresponding task tickets, or updating current iteration questions. Don't use for general database migrations.
---

# AI Feedback Synchronization Workflow

Use this workflow to fetch client selections from the Firestore database and coordinate their processing.

## Operations Guide

### 1. Automated Feedback Sync & Voting Aggregation
Run the automated sync script to query Firestore for the active question, aggregate all its votes, find the feature option with the maximum vote count, mark the question's status as `implementing`, and mark all votes for it as processed:
```bash
# Start implementation of winning feature (aggregates votes)
python3 .agents/workflows/feature_implementation_workflow/scripts/sync_workflow.py --action start
```

### 2. Complete Implementation & Replenish Poll Options
Once a feature has been implemented, verified, and deployed, mark the feature option as implemented in the active question document. This removes it from the UI voting choices, moves it into the implemented features array, and replenishes the voting options with a new choice to keep at least 3 active options:
```bash
python3 .agents/workflows/feature_implementation_workflow/scripts/sync_workflow.py --action complete --question_id {question_id} --feature_text "{feature_text}"
```


### 3. Manual Fetch User Choices
Run `python3 .agents/workflows/feature_implementation_workflow/scripts/fetch_user_answers.py` to manually view response documents in the terminal.

### 4. Post Walkthrough Comment & Close Jira Issue
Once a feature has been implemented, verified, and documented in `walkthrough.md`, add the walkthrough text as a comment on the Jira issue and transition it to Done using the helper script:
```bash
# Add walkthrough comment
python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --action comment --issue AGENT-XXX --comment "$(cat walkthrough.md)"

# Transition issue to Done
python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --action transition --issue AGENT-XXX --transition Done
```

## State Management & Implementation Rules

1. **Always plan and obtain approval**: Do not implement a selected feature immediately. Instead, first create/update `implementation_plan.md` detailing the design, file modifications, and validation steps. Wait for explicit user review and approval before writing code.
2. **Create Jira task AFTER approval**: Once the implementation plan has been approved by the user, create a corresponding Jira task using:
   ```bash
   python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --action create --project {PROJECT_KEY} --summary "Implement feature: {Feature Name}" --desc "Implement the user-selected feature: '{Feature Name}'" --type Task --priority Medium
   ```
3. **Execute and test in visible browser**: After implementing the feature, run the E2E test in a visible browser view (non-headless mode) so that the user can see the UI:
   ```bash
   node .agents/skills/end_to_end_testing/scripts/test_runner.cjs --url http://localhost:5173
   ```
4. **Fix failures and re-test**: If the test fails, debug the issues, fix the code, and run the test again until it passes successfully.
5. **Deploy after successful implementation**: Once the feature is successfully implemented and local E2E tests pass (from step 3), deploy the application using the firebase_deployment skill (do not re-run E2E tests):
   ```bash
   node .agents/skills/firebase_deployment/scripts/deploy.cjs
   ```
6. **Mark implemented and close Jira task**: Once deployed to Firebase Hosting, transition the corresponding Jira task to Done, post the walkthrough contents as a comment, and complete the sync (do not run E2E tests on the deployed URL):
   ```bash
   python3 .agents/workflows/feature_implementation_workflow/scripts/sync_workflow.py --action complete --question_id {question_id} --feature_text "{feature_text}"
   ```
7. **Do not clean the database**: Do not run database cleanup scripts (such as `cleanup_firestore.py`) or perform any bulk task deletions during the workflow, as we must preserve the user's active lists and tasks.