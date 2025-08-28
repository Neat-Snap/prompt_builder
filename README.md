# Prompt Builder

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&labelColor=333333)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?logo=typescript&logoColor=white&labelColor=0b1021)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009485?logo=fastapi&logoColor=white&labelColor=2b2b2b)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white&labelColor=0b1021)](https://www.postgresql.org)

A full‑stack app for organizing, versioning, and testing AI prompts. It lets you:

- Create projects and prompts
- Track prompt versions and changes
- Run playground requests via OpenRouter models
- Manage user accounts with email verification and JWT auth

> 🚧 Currently in development: features may change, and parts of the app may be unstable or behave unexpectedly. Please report issues and check back for updates


## Repository Structure

- `backend/`
  - `app/main.py`: FastAPI app, routes, debug endpoints
  - `app/api/`: REST endpoints: `auth`, `users`, `llm`, `tests`
  - `app/middleware/auth.py`: JWT auth middleware (protects routes; allows `/health`, `/auth/signup`, `/auth/login`)
  - `app/db/models.py`: SQLAlchemy models (`User`, `Project`, `Prompt`, `PromptVersion`, `Run`, `TestSet`, `Action`)
  - `app/db/session.py`: DB engine + scoped sessions
  - `app/settings/settings.py`: loads env from `frontend/.env.local`; builds `DATABASE_URL`
  - `app/utils/`: helpers (`auth` for JWT/password, `openrouter` for API calls)
  - `builder.py`: runs Uvicorn in dev (`app.main:app`)
- `frontend/`
  - Next.js 15 app with Tailwind and UI components
  - API calls via Axios + React Query; state via Zustand


## Environment Variables

The backend reads environment variables from `frontend/.env.local` (see `backend/app/settings/settings.py`). Create `frontend/.env.local` (you can copy from `frontend/.env.example`) and fill:

- Database
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
- Auth
  - `SECRET_KEY` (JWT signing key)
  - `ALGORITHM` (e.g., `HS256`)
  - `ACCESS_TOKEN_EXPIRE_HOURS` (e.g., `24`)
  - `AUDIENCE` (JWT audience string)
- Email
  - `RESEND_API_KEY` (for verification emails)

OpenRouter API keys are stored per‑user in the database via the `/llm/openrouter_key` endpoint and are not read from env.

