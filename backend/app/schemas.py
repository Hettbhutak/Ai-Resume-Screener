from datetime import datetime

from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = ""
    must_have_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    min_experience_years: int = 0
    location: str = ""


class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    must_have_skills: list[str]
    nice_to_have_skills: list[str]
    min_experience_years: int
    location: str
    created_at: datetime


class CandidateResponse(BaseModel):
    id: int
    job_id: int
    file_name: str
    status: str
    full_name: str
    email: str
    phone: str
    role: str
    skills: list[str]
    experience_years: float
    semantic_score: float
    must_have_score: float
    nice_to_have_score: float
    final_score: float
    recommendation: str
    match_reasons: list[str]


class CandidateUpdate(BaseModel):
    recommendation: str | None = None
    status: str | None = None


class UploadResponse(BaseModel):
    job_id: int
    accepted_files: int
    queued_resume_ids: list[int]


class ProcessingStatusResponse(BaseModel):
    job_id: int
    total: int
    queued: int
    processing: int
    completed: int
    failed: int
