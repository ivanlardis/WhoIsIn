---
name: screenshot
description: Take a screenshot of the running UI and save to tmp/screenshots/
user_invocable: true
---

# Screenshot

When the user invokes `/screenshot`, capture the current state of the web application UI.

## Instructions

1. Ensure the application is running (check if localhost:5173 or localhost:3000 responds)
2. Use the Playwright MCP `browser_take_screenshot` tool to capture the page
3. Save to `tmp/screenshots/` with filename format: `{YYYY-MM-DD_HH-MM}_{description}.png`
4. If user provided a description as argument, use it. Otherwise ask for a brief description.
5. Report the saved file path.

## Example
```
/screenshot homepage with persons grid
→ Saved: tmp/screenshots/2026-04-01_14-30_homepage-with-persons-grid.png
```
