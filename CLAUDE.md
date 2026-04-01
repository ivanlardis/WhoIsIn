# WhoIsIn — Project Instructions

## Overview
WhoIsIn is an intelligent face-sorting photo organizer for events. It detects faces, groups photos by person, and provides a modern web interface for browsing, searching, and managing results.

## Tech Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Alembic
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **ML:** InsightFace (ArcFace embeddings), HDBSCAN clustering
- **DB:** PostgreSQL 16 + pgvector (vector similarity search)
- **Deploy:** Docker + docker-compose
- **API descriptions:** OpenRouter (gemini-flash-2.0)

## Key Commands
```bash
# Development
docker-compose up              # Start all services
cd backend && uvicorn app.main:app --reload  # Backend dev
cd frontend && npm run dev     # Frontend dev

# Code generation
npx orval --input docs/openapi.yaml --output frontend/src/api/  # Generate API client
```

## Project Structure
- `docs/openapi.yaml` — **Source of truth** for API contract
- `docs/PRD.md` — Product requirements
- `docs/ADR/` — Architecture decision records
- `docs/DECISION_LOG.md` — Engineering decision journal
- `docs/PROCESS.md` — Development process documentation
- `backend/app/` — FastAPI application
- `frontend/src/` — React application

## Development Rules
1. **Spec-first:** Always update `docs/openapi.yaml` before implementing API changes
2. **Decision logging:** Record architectural decisions in `docs/DECISION_LOG.md` with date, rationale, and alternatives
3. **Type safety:** All Python code must have type hints. All TypeScript must be strictly typed.
4. **API traceability:** Every endpoint handler docstring must reference its OpenAPI operationId
5. **GitHub tracking:** Create GitHub Issues for tasks (`gh issue create`), close when done (`gh issue close`)

## Methodology
BMAD-METHOD with spec-driven development:
- PRD → ADR → OpenAPI → Code generation → Tests
- Each phase documented in `docs/PROCESS.md`

## MCP Servers
- **Playwright** — UI testing and screenshots
- **PostgreSQL** — Direct DB queries for debugging
