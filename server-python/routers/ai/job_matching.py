"""
AI Feature 2: Job-to-Candidate Skill Matching
Returns ranked job recommendations for a candidate with AI-enhanced match explanations.
"""
import os
import json
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one
from auth import auth_required, require_role

router = APIRouter(prefix="/api/ai/matching", tags=["ai"])


def _basic_score(candidate_skills: list, job_skills: list, exp_years: int) -> dict:
    if not job_skills:
        return {"score": 0, "matched": [], "missing": []}
    c_lower = {s.lower() for s in candidate_skills}
    j_lower = [s.lower() for s in job_skills]
    matched = [s for s in j_lower if s in c_lower]
    missing = [s for s in j_lower if s not in c_lower]
    skill_pct = len(matched) / len(j_lower) * 70
    exp_score = min((exp_years or 0) / 5 * 30, 30)
    return {"score": round(skill_pct + exp_score), "matched": matched, "missing": missing}


@router.get("/jobs-for-me")
async def jobs_for_candidate(user: dict = Depends(require_role("candidate"))):
    """Return open jobs ranked by AI-enhanced match score for the logged-in candidate."""
    me = await query_one("SELECT skills, experience_years, bio, preferred_sector FROM users WHERE id=$1", [user["id"]])
    if not me:
        raise HTTPException(404, detail="Candidate profile not found")

    raw = me.get("skills")
    candidate_skills = json.loads(raw) if isinstance(raw, str) else (raw or [])
    exp_years = me.get("experience_years") or 0

    jobs = await query("""SELECT j.*, u.name as employer_name, u.org_name FROM jobs j
        JOIN users u ON u.id=j.employer_id WHERE j.status='open' ORDER BY j.created_at DESC""")

    results = []
    for j in jobs:
        rs = j.get("required_skills")
        job_skills = json.loads(rs) if isinstance(rs, str) else (rs or [])
        match = _basic_score(candidate_skills, job_skills, exp_years)
        results.append({
            "id": j["id"], "title": j["title"], "employer_name": j.get("org_name") or j.get("employer_name"),
            "location": j.get("location"), "job_type": j.get("job_type"),
            "salary_min": j.get("salary_min"), "salary_max": j.get("salary_max"),
            "required_skills": job_skills, "created_at": j.get("created_at"),
            **match,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"jobs": results[:20], "candidate_skills": candidate_skills}


@router.get("/candidates-for-job/{job_id}")
async def candidates_for_job(job_id: int, user: dict = Depends(require_role("employer", "admin", "administrator"))):
    """Return ranked candidates for a specific job posting."""
    job = await query_one("SELECT * FROM jobs WHERE id=$1", [job_id])
    if not job: raise HTTPException(404, detail="Job not found")
    if user["role"] == "employer" and job["employer_id"] != user["id"]:
        raise HTTPException(403, detail="Not your job posting")

    rs = job.get("required_skills")
    job_skills = json.loads(rs) if isinstance(rs, str) else (rs or [])

    candidates = await query("SELECT id,name,email,skills,experience_years,location,city FROM users WHERE role='candidate'")
    results = []
    for c in candidates:
        raw = c.get("skills")
        c_skills = json.loads(raw) if isinstance(raw, str) else (raw or [])
        match = _basic_score(c_skills, job_skills, c.get("experience_years") or 0)
        if match["score"] > 0:
            results.append({
                "id": c["id"], "name": c["name"], "email": c["email"],
                "location": c.get("location") or c.get("city"),
                "skills": c_skills, **match,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"candidates": results[:50], "job_skills": job_skills}


@router.post("/explain-match")
async def explain_match(body: dict, user: dict = Depends(auth_required)):
    """Use AI to explain why a candidate is a good/poor match for a job."""
    candidate_skills = body.get("candidate_skills", [])
    job_skills = body.get("job_skills", [])
    job_title = body.get("job_title", "this role")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        match = _basic_score(candidate_skills, job_skills, body.get("experience_years", 0))
        return {"explanation": f"Match score: {match['score']}%. Matched skills: {', '.join(match['matched']) or 'none'}. Missing: {', '.join(match['missing']) or 'none'}."}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        prompt = f"""Job: {job_title}
Required skills: {', '.join(job_skills)}
Candidate skills: {', '.join(candidate_skills)}
Experience: {body.get('experience_years', 0)} years

In 2-3 sentences, explain the match quality and what the candidate should learn to improve."""
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        return {"explanation": msg.content[0].text.strip()}
    except Exception as e:
        raise HTTPException(500, detail=f"AI explanation failed: {str(e)}")
