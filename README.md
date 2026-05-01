# AutoDoc.ai
Senior Project– AI-powered document processing and template management system.

# Structure
- backend/  : FastAPI backend
- frontend/ : React frontend

# Status
Phase 2 – Core Business Logic (includes preparation, ground rules, and ongoing feature work)

## UI Interfaces
- Public
- Business client dashboard
- Enterprise client dashboard
- Super admin dashboard

## Branching Strategy

- main: stable, production-ready code
- dev: integration branch for ongoing development
- feature/*: feature-specific branches
- frontend_public
- front_test
- frontend-enterprise
- back_to_front
- ai

Rules:
- All development is done on feature/* branches
- feature/* branches are merged into dev using Pull Requests
- Only tested and stable code is merged from dev into main
