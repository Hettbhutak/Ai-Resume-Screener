import shutil
import os
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, SessionLocal, engine, get_db
from .models import CandidateResume, Job
from .scoring import join_db_list, split_db_list
from .schemas import CandidateResponse, CandidateUpdate, JobCreate, JobResponse, ProcessingStatusResponse, UploadResponse
from .tasks import process_many

app = FastAPI(title=settings.app_name)

origins = [x.strip() for x in settings.cors_origins.split(",")] if settings.cors_origins else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


def _to_job_response(job: Job) -> JobResponse:
    return JobResponse(
        id=job.id,
        title=job.title,
        description=job.description,
        must_have_skills=split_db_list(job.must_have_skills),
        nice_to_have_skills=split_db_list(job.nice_to_have_skills),
        min_experience_years=job.min_experience_years,
        location=job.location,
        created_at=job.created_at,
    )


def _to_candidate_response(candidate: CandidateResume) -> CandidateResponse:
    return CandidateResponse(
        id=candidate.id,
        job_id=candidate.job_id,
        file_name=candidate.file_name,
        status=candidate.status,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        role=candidate.role,
        skills=split_db_list(candidate.skills),
        experience_years=candidate.experience_years,
        semantic_score=candidate.semantic_score,
        must_have_score=candidate.must_have_score,
        nice_to_have_score=candidate.nice_to_have_score,
        final_score=candidate.final_score,
        recommendation=candidate.recommendation,
        match_reasons=split_db_list(candidate.match_reasons),
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/jobs", response_model=JobResponse)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    job = Job(
        title=payload.title,
        description=payload.description,
        must_have_skills=join_db_list(payload.must_have_skills),
        nice_to_have_skills=join_db_list(payload.nice_to_have_skills),
        min_experience_years=payload.min_experience_years,
        location=payload.location,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_job_response(job)


@app.get("/jobs", response_model=list[JobResponse])
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return [_to_job_response(j) for j in jobs]


@app.post("/jobs/{job_id}/resumes/bulk-upload", response_model=UploadResponse)
def bulk_upload_resumes(
    job_id: int,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided")

    job_dir = Path(settings.upload_dir) / f"job_{job_id}"
    job_dir.mkdir(parents=True, exist_ok=True)

    allowed_suffixes = {".pdf", ".docx", ".txt", ".md"}
    queued_ids = []

    for upload in files:
        suffix = Path(upload.filename or "").suffix.lower()
        if suffix not in allowed_suffixes:
            continue

        safe_name = Path(upload.filename).name
        target = job_dir / safe_name

        with target.open("wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)

        resume = CandidateResume(
            job_id=job_id,
            file_name=safe_name,
            file_path=str(target),
            status="queued",
        )
        db.add(resume)
        db.flush()
        queued_ids.append(resume.id)

    db.commit()

    if not queued_ids:
        raise HTTPException(status_code=400, detail="No supported files uploaded. Use PDF, DOCX, TXT, MD")

    # Vercel Python functions are serverless. Background tasks may not continue
    # after the response returns, so process inline there.
    if os.getenv("VERCEL"):
        process_many(db, queued_ids)
    else:
        # Open fresh DB session in background to avoid stale request session.
        def _runner(ids: list[int]) -> None:
            worker_db = SessionLocal()
            try:
                process_many(worker_db, ids)
            finally:
                worker_db.close()

        background_tasks.add_task(_runner, queued_ids)

    return UploadResponse(job_id=job_id, accepted_files=len(queued_ids), queued_resume_ids=queued_ids)


@app.get("/jobs/{job_id}/processing-status", response_model=ProcessingStatusResponse)
def processing_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    rows = (
        db.query(CandidateResume.status, func.count(CandidateResume.id))
        .filter(CandidateResume.job_id == job_id)
        .group_by(CandidateResume.status)
        .all()
    )

    stats = {"queued": 0, "processing": 0, "completed": 0, "failed": 0}
    for status, count in rows:
        if status in stats:
            stats[status] = count

    total = sum(stats.values())
    return ProcessingStatusResponse(job_id=job_id, total=total, **stats)


@app.get("/jobs/{job_id}/candidates", response_model=list[CandidateResponse])
def list_candidates(
    job_id: int,
    sort: str = Query(default="score_desc"),
    recommendation: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    query = db.query(CandidateResume).filter(CandidateResume.job_id == job_id)

    if recommendation:
        query = query.filter(CandidateResume.recommendation.ilike(recommendation))

    if sort == "score_desc":
        query = query.order_by(CandidateResume.final_score.desc(), CandidateResume.id.desc())
    elif sort == "score_asc":
        query = query.order_by(CandidateResume.final_score.asc(), CandidateResume.id.desc())
    elif sort == "latest":
        query = query.order_by(CandidateResume.id.desc())

    candidates = query.all()
    return [_to_candidate_response(c) for c in candidates]


@app.get("/jobs/{job_id}/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(job_id: int, candidate_id: int, db: Session = Depends(get_db)):
    candidate = (
        db.query(CandidateResume)
        .filter(CandidateResume.job_id == job_id, CandidateResume.id == candidate_id)
        .first()
    )
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return _to_candidate_response(candidate)


@app.patch("/jobs/{job_id}/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    job_id: int,
    candidate_id: int,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(CandidateResume)
        .filter(CandidateResume.job_id == job_id, CandidateResume.id == candidate_id)
        .first()
    )
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if payload.recommendation is not None:
        candidate.recommendation = payload.recommendation
    if payload.status is not None:
        candidate.status = payload.status

    db.commit()
    db.refresh(candidate)
    return _to_candidate_response(candidate)


@app.get("/jobs/{job_id}/candidates/{candidate_id}/resume")
def get_candidate_resume(job_id: int, candidate_id: int, db: Session = Depends(get_db)):
    candidate = (
        db.query(CandidateResume)
        .filter(CandidateResume.job_id == job_id, CandidateResume.id == candidate_id)
        .first()
    )
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    resume_path = Path(candidate.file_path)
    if not resume_path.exists():
        raise HTTPException(status_code=404, detail="Resume file not found")

    return FileResponse(path=resume_path, filename=candidate.file_name, media_type="application/octet-stream")


@app.get("/admin/db-preview")
def db_preview(
    limit_jobs: int = Query(default=10, ge=1, le=100),
    limit_candidates: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    jobs = db.query(Job).order_by(Job.id.desc()).limit(limit_jobs).all()
    candidates = (
        db.query(CandidateResume)
        .order_by(CandidateResume.final_score.desc(), CandidateResume.id.desc())
        .limit(limit_candidates)
        .all()
    )

    return {
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "min_experience_years": j.min_experience_years,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            }
            for j in jobs
        ],
        "candidates": [
            {
                "id": c.id,
                "job_id": c.job_id,
                "file_name": c.file_name,
                "status": c.status,
                "full_name": c.full_name,
                "email": c.email,
                "experience_years": c.experience_years,
                "final_score": c.final_score,
                "recommendation": c.recommendation,
            }
            for c in candidates
        ],
    }


@app.get("/admin/db-preview/{job_id}")
def db_preview_for_job(
    job_id: int,
    limit_candidates: int = Query(default=100, ge=1, le=1000),
    sort: str = Query(default="score_desc"),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    query = db.query(CandidateResume).filter(CandidateResume.job_id == job_id)
    if sort == "score_desc":
        query = query.order_by(CandidateResume.final_score.desc(), CandidateResume.id.desc())
    elif sort == "score_asc":
        query = query.order_by(CandidateResume.final_score.asc(), CandidateResume.id.desc())
    elif sort == "latest":
        query = query.order_by(CandidateResume.id.desc())

    candidates = query.limit(limit_candidates).all()

    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "must_have_skills": split_db_list(job.must_have_skills),
            "nice_to_have_skills": split_db_list(job.nice_to_have_skills),
            "min_experience_years": job.min_experience_years,
            "location": job.location,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        },
        "counts": {
            "total": len(candidates),
            "completed": sum(1 for c in candidates if c.status == "completed"),
            "failed": sum(1 for c in candidates if c.status == "failed"),
            "processing": sum(1 for c in candidates if c.status == "processing"),
            "queued": sum(1 for c in candidates if c.status == "queued"),
        },
        "candidates": [
            {
                "id": c.id,
                "file_name": c.file_name,
                "status": c.status,
                "full_name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "role": c.role,
                "skills": split_db_list(c.skills),
                "experience_years": c.experience_years,
                "semantic_score": c.semantic_score,
                "must_have_score": c.must_have_score,
                "nice_to_have_score": c.nice_to_have_score,
                "final_score": c.final_score,
                "recommendation": c.recommendation,
                "match_reasons": split_db_list(c.match_reasons),
            }
            for c in candidates
        ],
    }
