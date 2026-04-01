---
name: create-issue
description: Create a GitHub Issue with milestone and labels for the WhoIsIn project
user_invocable: true
---

# Create GitHub Issue

When the user invokes `/create-issue`, create a GitHub Issue in the ivanlardis/WhoIsIn repository.

## Instructions

1. Ask the user for:
   - **Title** (if not provided as argument)
   - **Description**
   - **Labels** (one or more of: spec, backend, frontend, ml, deploy, dx)
   - **Milestone** (Phase 0-6)

2. Run the gh CLI command:
```bash
gh issue create \
  --repo ivanlardis/WhoIsIn \
  --title "{title}" \
  --body "{description}" \
  --label "{labels}" \
  --milestone "Phase {N}: {name}"
```

3. Report the created issue URL back to the user.

## Available Labels
- `spec` — Specification and documentation
- `backend` — Backend Python/FastAPI
- `frontend` — Frontend React/TypeScript
- `ml` — Machine Learning pipeline
- `deploy` — Docker, VPS deployment
- `dx` — Developer experience, tooling

## Available Milestones
- Phase 0: Environment Setup
- Phase 1: Specifications
- Phase 2: Backend Core
- Phase 3: Frontend
- Phase 4: Features & Benchmark
- Phase 5: Deploy
- Phase 6: Documentation
