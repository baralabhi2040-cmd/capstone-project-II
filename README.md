# PhishGuard

PhishGuard is a phishing-detection platform with:

- hybrid phishing analysis for URL, email, SMS, and social messages
- account signup and email verification
- personal scan history
- snapshot delivery back to the verified user mailbox

## Local Development

Backend:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
venv\Scripts\python.exe run.py
```

Frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Local connection defaults:

- frontend dev server runs on `http://localhost:5173`
- backend API runs on `http://127.0.0.1:8000`
- `SERVE_FRONTEND=false` keeps the backend acting like an API during local development
- the frontend falls back to same-origin automatically in production builds, so deployed one-service hosting still works

## Production Path

This repo now supports a one-service deployment flow:

- the Vite frontend is built into static assets
- FastAPI serves the built frontend in production
- PostgreSQL is supported through SQLAlchemy
- SMTP works with providers such as Resend

For production, set `SERVE_FRONTEND=true` on the backend service if FastAPI should serve the built frontend.

Deployment files included:

- [Dockerfile](/D:/BIT(2k26)/ICT%20311/Final%20Project/Dockerfile)
- [render.yaml](/D:/BIT(2k26)/ICT%20311/Final%20Project/render.yaml)
- [backend/.env.example](/D:/BIT(2k26)/ICT%20311/Final%20Project/backend/.env.example)
- [frontend/.env.example](/D:/BIT(2k26)/ICT%20311/Final%20Project/frontend/.env.example)

## Deployment Guide

Use the full deployment checklist in [docs/README.md](/D:/BIT(2k26)/ICT%20311/Final%20Project/docs/README.md).
