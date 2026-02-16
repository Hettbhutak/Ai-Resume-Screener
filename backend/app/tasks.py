from pathlib import Path

from sqlalchemy.orm import Session  # type: ignore

from . import models
from .parsing import extract_text
from .scoring import (
    join_db_list,
    parse_contact_fields,
    parse_experience_years,
    parse_skills,
    score_resume,
    split_db_list,
)


def process_resume(db: Session, resume_id: int) -> None:
    resume = db.query(models.CandidateResume).filter(models.CandidateResume.id == resume_id).first()
    if not resume:
        return

    job = db.query(models.Job).filter(models.Job.id == resume.job_id).first()
    if not job:
        resume.status = "failed"
        db.commit()
        return

    try:
        resume.status = "processing"
        db.commit()

        path = Path(resume.file_path)
        text = extract_text(path)
        full_name, email, phone = parse_contact_fields(text)

        must_have = split_db_list(job.must_have_skills)
        nice_to_have = split_db_list(job.nice_to_have_skills)
        known = must_have + nice_to_have

        skills = parse_skills(text, known)
        experience_years = parse_experience_years(text)

        scores = score_resume(
            job_description=job.description,
            must_have=must_have,
            nice_to_have=nice_to_have,
            min_years=job.min_experience_years,
            resume_text=text,
            extracted_skills=skills,
            resume_years=experience_years,
        )

        resume.full_name = full_name
        resume.email = email
        resume.phone = phone
        resume.role = job.title
        resume.skills = join_db_list(skills)
        resume.experience_years = experience_years
        resume.semantic_score = scores["semantic_score"]
        resume.must_have_score = scores["must_have_score"]
        resume.nice_to_have_score = scores["nice_to_have_score"]
        resume.final_score = scores["final_score"]
        resume.recommendation = scores["recommendation"]
        resume.match_reasons = join_db_list(scores["reasons"])
        resume.extracted_text = text[:40000]
        resume.status = "completed"

        db.commit()
    except Exception:
        resume.status = "failed"
        db.commit()


def process_many(db: Session, resume_ids: list[int]) -> None:
    for resume_id in resume_ids:
        process_resume(db, resume_id)
