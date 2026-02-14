# Dutient HR Resume Screening System

End-to-end HR screening system with:
- Frontend dashboard (`dutient-hrs (1).html` + modular JS)
- Python backend API (FastAPI)
- Bulk resume upload, parsing, scoring, ranking, shortlist workflow
- SQLite persistence + resume file storage

## Project Structure

```text
Dutient.ai/
  dutient-hrs (1).html          # Main UI
  backend/
    app/
      main.py                   # FastAPI routes
      models.py                 # DB models
      schemas.py                # API schemas
      parsing.py                # Resume text extraction
      scoring.py                # Match scoring logic
      tasks.py                  # Background processing pipeline
      database.py               # SQLAlchemy engine/session
      config.py                 # Environment config
    requirements.txt
    .env.example
    README.md
  frontend/
    js/
      01-state.js               # Global state, sample data, templates
      02-core-ui.js             # Navigation, modal, shared helpers
      03-candidates.js          # Candidates page + status chips + shortlist/reject
      04-bulk-screening.js      # Upload, screening, polling, CSV export
      05-search-tabs.js         # AI search, JD upload, profile tabs
      06-email-init.js          # Email actions + app bootstrap
    README.md
```

## Core Features

- Bulk upload 50+ resumes per job
- Background processing and screening status tracking
- Resume parsing (PDF, DOCX, TXT, MD)
- Candidate scoring:
  - semantic score
  - must-have score
  - nice-to-have score
  - final score + recommendation
- Ranked candidates list from database
- Open uploaded resume directly from UI
- One-click candidate actions from UI:
  - Shortlist
  - Consider
  - Reject
- Candidate status chips for fast filtering
- Admin DB preview endpoints

## Architecture

### 1. Frontend Layer
- Single-page HR dashboard (`dutient-hrs (1).html`)
- Modular JS under `frontend/js`
- Calls backend REST APIs directly via `fetch`

### 2. API Layer (FastAPI)
- Job management
- Bulk file upload
- Candidate retrieval and ranking
- Candidate recommendation update (shortlist/reject)
- Resume file serving
- Admin DB preview

### 3. Processing Layer
- Upload stores files under `backend/storage/job_<job_id>/`
- Background task processes each resume:
  1. Extract text
  2. Parse details (name/email/phone/skills/experience)
  3. Score against job requirements
  4. Save to DB

### 4. Data Layer
- SQLite database: `backend/dutient.db`
- Main tables:
  - `jobs`
  - `candidate_resumes`

## API Endpoints (Primary)

- `GET /health`
- `POST /jobs`
- `GET /jobs`
- `POST /jobs/{job_id}/resumes/bulk-upload`
- `GET /jobs/{job_id}/processing-status`
- `GET /jobs/{job_id}/candidates?sort=score_desc`
- `GET /jobs/{job_id}/candidates/{candidate_id}`
- `PATCH /jobs/{job_id}/candidates/{candidate_id}`
- `GET /jobs/{job_id}/candidates/{candidate_id}/resume`
- `GET /admin/db-preview`
- `GET /admin/db-preview/{job_id}`

## Setup and Launch

## Prerequisites
- Python 3.10+
- Windows CMD or PowerShell
- A local static server for HTML (e.g., VS Code Live Server)

## Backend Setup

### CMD
```bat
cd C:\Internships\Dutient.ai\backend
python -m venv .venv
.\.venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### PowerShell
```powershell
cd C:\Internships\Dutient.ai\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

API Docs:
- `http://127.0.0.1:8000/docs`

## Frontend Launch

- Serve project via local web server (recommended: Live Server)
- Open: `dutient-hrs (1).html`
- Ensure backend is running at: `http://127.0.0.1:8000`

## Typical User Flow

1. Open `Bulk Upload` page
2. Upload resumes
3. Provide role, skills, JD, min experience
4. Start AI screening
5. Wait for processing status updates
6. View ranked results with score breakdown
7. Shortlist/Reject from frontend
8. Open resumes directly from candidate cards
9. Use `Candidates` page + status chips for fast filtering

## Data Locations

- Resume files:
  - `backend/storage/job_<job_id>/...`
- SQLite DB:
  - `backend/dutient.db`

## Troubleshooting

- `activate is not recognized`
  - Use `\.venv\Scripts\activate.bat` in CMD
  - Use `\.venv\Scripts\Activate.ps1` in PowerShell

- Frontend cannot call API
  - Ensure backend running on port 8000
  - Open HTML via HTTP server (not `file://`)

- No candidates visible
  - Select a job from `Job (Backend)` dropdown
  - Click `Sync Jobs`

## Security Notes (Current MVP)

- Admin endpoints are open (no auth)
- Resume download endpoint is open for local development
- Add authentication and role-based access control before production use

## Future Improvements

- Celery + Redis for robust background workers
- Semantic embeddings with pgvector for better ranking quality
- Authentication/authorization
- Multi-tenant org support
- Audit logs and activity tracking

## Author

- Primary Author: @Het Bhutak(https://github.com/Hettbhutak)
- Project: Dutient HR Resume Screening System

