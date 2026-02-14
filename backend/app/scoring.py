import re
from collections import Counter


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}")
YEARS_RE = re.compile(r"(\d{1,2})(?:\+)?\s*(?:years|year|yrs|yr)", re.IGNORECASE)
WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z+#\.]{1,}")

COMMON_SKILLS = {
    "python", "django", "fastapi", "flask", "java", "spring", "node", "nodejs", "react", "angular", "vue",
    "typescript", "javascript", "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "sql", "postgresql",
    "mysql", "mongodb", "redis", "graphql", "rest", "ci/cd", "jenkins", "git", "linux", "pandas", "numpy",
}


def _normalize(skill: str) -> str:
    return skill.strip().lower()


def _split_csv_string(value: str) -> list[str]:
    if not value:
        return []
    return [x.strip() for x in value.split(",") if x.strip()]


def parse_contact_fields(text: str) -> tuple[str, str, str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    full_name = lines[0] if lines else ""
    email_match = EMAIL_RE.search(text)
    phone_match = PHONE_RE.search(text)
    return full_name, (email_match.group(0) if email_match else ""), (phone_match.group(0) if phone_match else "")


def parse_experience_years(text: str) -> float:
    matches = YEARS_RE.findall(text)
    if not matches:
        return 0.0
    values = [float(m) for m in matches]
    return max(values)


def parse_skills(text: str, known_job_skills: list[str]) -> list[str]:
    lowered = text.lower()
    found = []

    all_targets = {_normalize(s) for s in known_job_skills if s.strip()} | COMMON_SKILLS
    for skill in sorted(all_targets):
        if len(skill) <= 2:
            continue
        if skill in lowered:
            found.append(skill)

    # Add top repeated technology-like tokens
    words = [w.lower() for w in WORD_RE.findall(text)]
    counts = Counter(words)
    for token, count in counts.most_common(20):
        if token in COMMON_SKILLS and token not in found and count >= 2:
            found.append(token)

    return found[:25]


def score_resume(job_description: str, must_have: list[str], nice_to_have: list[str], min_years: int, resume_text: str, extracted_skills: list[str], resume_years: float) -> dict:
    text = resume_text.lower()
    words_job = set(WORD_RE.findall(job_description.lower())) if job_description else set()
    words_resume = set(WORD_RE.findall(text))

    # Simple token overlap until you plug sentence embeddings.
    semantic_score = (len(words_job & words_resume) / len(words_job) * 100) if words_job else 50.0

    def match_pct(targets: list[str]) -> float:
        if not targets:
            return 100.0
        targets_norm = [_normalize(x) for x in targets if x.strip()]
        resume_skills = {_normalize(x) for x in extracted_skills}
        matched = sum(1 for t in targets_norm if t in resume_skills or t in text)
        return matched / len(targets_norm) * 100

    must_pct = match_pct(must_have)
    nice_pct = match_pct(nice_to_have)

    exp_penalty = 0.0
    if min_years > 0 and resume_years < min_years:
        exp_penalty = min(20.0, (min_years - resume_years) * 5)

    final_score = (0.5 * semantic_score) + (0.3 * must_pct) + (0.2 * nice_pct) - exp_penalty
    final_score = max(0.0, min(100.0, round(final_score, 2)))

    reasons = []
    if must_have:
        reasons.append(f"Must-have match: {must_pct:.1f}%")
    if nice_to_have:
        reasons.append(f"Nice-to-have match: {nice_pct:.1f}%")
    reasons.append(f"Experience detected: {resume_years:.1f} years")
    reasons.append(f"Semantic overlap: {semantic_score:.1f}%")
    if exp_penalty > 0:
        reasons.append(f"Experience penalty: -{exp_penalty:.1f}")

    if final_score >= 85:
        recommendation = "Shortlist"
    elif final_score >= 70:
        recommendation = "Consider"
    else:
        recommendation = "Reject"

    return {
        "semantic_score": round(semantic_score, 2),
        "must_have_score": round(must_pct, 2),
        "nice_to_have_score": round(nice_pct, 2),
        "final_score": final_score,
        "recommendation": recommendation,
        "reasons": reasons,
    }


def split_db_list(value: str) -> list[str]:
    return _split_csv_string(value)


def join_db_list(items: list[str]) -> str:
    return ", ".join([x.strip() for x in items if x and x.strip()])
