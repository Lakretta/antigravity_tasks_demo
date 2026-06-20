---
name: ai-feedback-sync
description: Syncs client choices from the Firestore database and posts next design questions for iterative code updates.
---

# AI Feedback Synchronization Skill

Use this skill to fetch client selections from the Firestore database and post the next iteration's design choices.

## Operations Guide

### 1. Automated Feedback Sync Workflow
Run the automated sync script from the root directory to query Firestore for new client feature choices, mark them as processed, create corresponding Jira issues under the `KAN` project, and post the next feature question:
```bash
python3 .agents/skills/ai-feedback-sync/scripts/sync_workflow.py
```

### 2. Manual Fetch User Choices
Run `python3 fetch_user_answers.py` from the root directory to manually view and process responses in the terminal.

### 3. Manual Update Question in Firestore
You can use `fetch_user_answers.py` import utilities to push the next question and its options manually:
```python
import sys
sys.path.append('.')
from fetch_user_answers import post_next_question, get_project_id

project_id = get_project_id()
post_next_question(
    project_id=project_id,
    question_id="next_step_feature",
    question_text="What layout style would you like to apply to the sidebar?",
    options=["Collapsible Sidebar", "Top Navigation Bar", "Floating Action Drawer"]
)
```

### 4. Post Walkthrough Comment & Close Jira Issue
Once a feature has been implemented, verified, and documented in `walkthrough.md`, add the walkthrough text as a comment on the Jira issue and transition it to Done using the helper script:
```bash
# Add walkthrough comment
python3 .agents/skills/jira-issue-creator/scripts/jira_helper.py --action comment --issue KAN-XXX --comment "$(cat walkthrough.md)"

# Transition issue to Done
python3 .agents/skills/jira-issue-creator/scripts/jira_helper.py --action transition --issue KAN-XXX --transition Done
```

## State Management Rules

1. Always mark an answer as `processed: true` in Firestore once you begin implementing it to avoid reading the same selection repeatedly.
2. Formulate only one active question at a time to prevent user confusion.
3. If no config variables are present, output local JSON mocks to test the integration state.
4. After feature implementation, the corresponding Jira task must be transitioned to 'Done' and the contents of `walkthrough.md` must be added as a comment to the task.
