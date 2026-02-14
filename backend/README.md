# Dutient Resume Screening Backend (Python + FastAPI)

This backend gives you an MVP for:
- Creating jobs with required skills.
- Uploading 50+ resumes in bulk for a specific job.
- Background processing (parse + score + rank).
- Listing candidates sorted by best fit.

## Quick start

1. Create venv and install dependencies

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Configure environment

```powershell
Copy-Item .env.example .env
```

3. Run server

```powershell
uvicorn app.main:app --reload --port 8000
```

4. Open API docs

- http://127.0.0.1:8000/docs

## Core endpoints

- `POST /jobs`
- `GET /jobs`
- `POST /jobs/{job_id}/resumes/bulk-upload`
- `GET /jobs/{job_id}/processing-status`
- `GET /jobs/{job_id}/candidates?sort=score_desc`
- `GET /jobs/{job_id}/candidates/{candidate_id}`
- `PATCH /jobs/{job_id}/candidates/{candidate_id}` (update recommendation/status, e.g. shortlist)
- `GET /jobs/{job_id}/candidates/{candidate_id}/resume` (open uploaded resume file)
- `GET /admin/db-preview`
- `GET /admin/db-preview/{job_id}`

## Example: create job

```bash
curl -X POST "http://127.0.0.1:8000/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Python Backend Engineer",
    "description":"Need Python FastAPI PostgreSQL experience",
    "must_have_skills":["python","fastapi","postgresql"],
    "nice_to_have_skills":["docker","aws"],
    "min_experience_years":3,
    "location":"Remote"
  }'
```

## Example: bulk upload resumes

Use Swagger UI (`/docs`) for easiest multi-file upload.

Or with curl:

```bash
curl -X POST "http://127.0.0.1:8000/jobs/1/resumes/bulk-upload" \
  -F "files=@resume1.pdf" \
  -F "files=@resume2.docx" \
  -F "files=@resume3.pdf"
```

## Notes

- Current scoring uses rule-based + keyword overlap (fast to ship).
- Next upgrade: move background worker to Celery + Redis and semantic embeddings model for stronger ranking.
