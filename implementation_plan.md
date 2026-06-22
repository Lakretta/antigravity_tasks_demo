# Implementation Plan - Move feature_implementation_workflow Skill to Workflow

We will migrate the `feature_implementation_workflow` from a skill directory to a workflow directory, keeping all scripts organized under the workflow directory and updating all internal/external path references.

## Proposed Modifications

### 1. File and Directory Moves
- Create the target directory: `.agents/workflows/feature_implementation_workflow/`
- Move all scripts from `.agents/skills/feature_implementation_workflow/scripts/` to `.agents/workflows/feature_implementation_workflow/scripts/`
- Delete `.agents/skills/feature_implementation_workflow/SKILL.md`
- Remove the empty skill folder `.agents/skills/feature_implementation_workflow/`

### 2. Path & Reference Updates
- **Update Workflow Guide File**: `.agents/workflows/feature-implementation-workflow.md`
  - Clean up double frontmatter to be a single, descriptive block.
  - Update all script references from `.agents/skills/...` to `.agents/workflows/...`.
- **Update Dependent Scripts**: `.agents/skills/generate_new_feature/scripts/post_next_feature.py`
  - Update the Firestore client imports path search from `../../feature_implementation_workflow/scripts` to `../../../workflows/feature_implementation_workflow/scripts`.

## Validation Steps
1. Run a test run of `post_next_feature.py` (with `--help` or dry-run) to ensure python imports work correctly.
2. Verify file structure and confirm no broken references exist.
