---
name: managing-jira-items
description: >-
  Decomposes user feature requests into detailed, structured work items (Stories, Tasks, Bugs) and registers them in Jira. Use when breaking down complex prompts, tracking task lifecycles, or transitioning issues to Done. Don't use for general project management discussion.
---

# Jira Issue Creator Skill

Use this skill when you need to decompose a complex, large-scale user feature request into smaller, manageable, and structured work items (Stories, Tasks, or Bugs) and create them directly inside the Jira issue tracker.

## Operations Guide

### 1. Decompose Complex Input
When given a large feature request (e.g. "Add user profile profiles and avatar upload"), decompose it into distinct, isolated, and highly actionable Jira issues. Each issue should address one logical part of the feature lifecycle:
1. **Design/Architecture**: E.g. "Database schema setup".
2. **Backend/API Implementation**: E.g. "Create upload endpoints".
3. **Frontend Component Creation**: E.g. "Avatar upload UI modal".
4. **Integration & Styling**: E.g. "Link avatar profile edit flow".
5. **Testing & Validation**: E.g. "Add file validation unit tests".

For each decomposed task, define:
- **Project Key**: E.g., `PROJ` (the Jira Project).
- **Summary**: Concise and action-oriented title (e.g. `feat(upload): implement avatar file uploading API`).
- **Description**: Background details, explicit technical checklist of steps, and concrete success criteria.
- **Issue Type**: `Story` (for user-facing features), `Task` (for technical sub-items), or `Bug` (for code fixes).
- **Priority**: `High`, `Medium`, or `Low` depending on critical path dependencies.

---

### 2. Method A: Via Jira MCP Server (Preferred)
If a Jira MCP server is registered in your environment (e.g. ServerName `jira` or `JiraMCP`), invoke the `create_issue` tool directly using:

- **ServerName**: `jira`
- **ToolName**: `create_issue`
- **Arguments**:
  ```json
  {
    "projectKey": "PROJ",
    "summary": "feat(auth): set up Firebase Auth integration",
    "description": "Initialize the Auth SDK inside src/firebase.js and implement hook states.",
    "issueType": "Task",
    "priority": "Medium"
  }
  ```

### 3. Method B: Fallback REST Helper Script
If the Jira MCP server is not registered, use the fallback Python script:

#### Create Issue:
```bash
python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --project PROJ --summary "Summary Title" --desc "Description text" --type "Task" --priority "Medium"
```

#### Post Comment:
```bash
python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --action comment --issue KAN-123 --comment "Your comment text"
```

#### Transition Issue (e.g. to Done):
```bash
python3 .agents/skills/jira_items_manager/scripts/jira_helper.py --action transition --issue KAN-123 --transition Done
```

#### Environment Variables Config
The python helper reads credential configurations from the root `.env` file:
- `JIRA_URL`: The Jira instance endpoint (e.g. `https://your-domain.atlassian.net`).
- `JIRA_EMAIL`: Your Atlassian login email address.
- `JIRA_API_TOKEN`: Your Jira Atlassian API token.
