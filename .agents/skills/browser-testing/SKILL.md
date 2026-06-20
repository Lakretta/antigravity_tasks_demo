---
name: browser-testing
description: Guides browser-based QA automation and visual/functional verification of web components.
---

# Browser Testing Skill

Use this skill when you need to verify newly implemented user interfaces, widgets, styles, or interactive elements inside a web browser environment. This ensures that features work correctly and do not produce visual regressions or uncaught JS console exceptions.

## Operations Guide

### 1. Host the Local Development Server
Before running any browser interactions, ensure your local Vite/React development server is running in the background:

```bash
npm run dev
```

Monitor stdout/logs to verify the server binds successfully (usually to `http://localhost:5173` or similar local port).

---

### 2. Method A: Via Chrome DevTools MCP (Preferred)
If the Chrome DevTools MCP server is loaded, automate the browser interactions directly using your tool calls:

1. **Navigate to the app**:
   - Invoke tool `mcp_chrome_devtools_navigate_page` or `navigate_page` with URL `http://localhost:5173`.
2. **Interact with the DOM**:
   - Locate components (inputs, list items, buttons).
   - Simulate clicks, keyboard inputs, and drag events using target selectors (e.g. `input[placeholder="Add a task"]`).
3. **Capture screenshots**:
   - Capture visual state snapshots using `mcp_chrome_devtools_capture_screenshot` to verify layout aesthetics (theme toggles, drop lines, search matches). Save the files to the artifacts directory.
4. **Monitor Console logs**:
   - Evaluate network logs or console warnings for any uncaught React state updates or Firebase auth/security rule rejections.

---

### 3. Method B: Puppeteer Fallback Test Script
If Chrome DevTools MCP is not present or if you want to run a script to watch browser actions, use the Node.js helper script:

```bash
# Run in visual (headful) mode (default: opens a browser window and runs visual tasks slowly)
node .agents/skills/browser-testing/scripts/test_runner.cjs --url http://localhost:5173

# Run in headless background mode (for silent automated background runs)
node .agents/skills/browser-testing/scripts/test_runner.cjs --url http://localhost:5173 --headless --screenshot artifacts/test_result.png
```

#### Prerequisite Installation
If Puppeteer is not installed globally or locally, install it as a development dependency first:
```bash
npm install --save-dev puppeteer
```
*(Use `--no-save` if you do not want to persist the dependency in the project's package.json.)*

The script will launch a headless Chromium instance, navigate to the target address, simulate task interactions, and save a verification screenshot to the specified path.
