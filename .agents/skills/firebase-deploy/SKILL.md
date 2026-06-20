---
name: firebase-deploy
description: Compiles the frontend assets and deploys them to Firebase Hosting.
---

# Firebase Deployment Skill

Use this skill when deploying updates to Firebase Hosting.

## Operations Guide

### 1. Automated Deployment Script (Preferred)
To compile the production bundle and deploy it to hosting in a single command:

```bash
node .agents/skills/firebase-deploy/scripts/deploy.cjs
```

The script automatically executes compilation verification builds and deploys static assets.

---

### 2. Manual Verification & Deployment
If you need to execute verification manually:

1. **Compile producing assets**:
   ```bash
   npm run build
   ```
2. **Deploy via Firebase CLI**:
   ```bash
   npx firebase-tools deploy --only hosting
   ```

*Note: If authentication is required or credentials are not present, prompt the user to run `npx firebase-tools login` in their local terminal.*

## Troubleshooting

- **Error: Project not set**: Ensure that `.firebaserc` exists or select the target project via:
  ```bash
  npx firebase-tools use --add <project_id>
  ```
- **Syntax / Build Failures**: Re-read the lint output or run `npm run lint` to spot unused variables, missing imports, or incorrect JSX tag closings before deploying.
