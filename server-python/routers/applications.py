import json
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _match_score(candidate_skills, job_skills, exp_years):
    if not job_skills: return 0
    c_lower = {s.lower() for s in candidate_skills}
    j_lower = [s.lower() for s in job_skills]
    matched = sum(1 for s in j_lower if s in c_lower)
    return round(matched / len(j_lower) * 70 + min((exp_years or 0) / 5 * 30, 30))


@router.get("/all")
async def all_apps(user: dict = Depends(require_role("admin", "administrator", "superadmin"))):
    rows = await query("""SELECT a.*, j.title, j.location, j.job_type,
        u_emp.org_name, u_emp.name as employer_name,
        u_can.name as candidate_name, u_can.email
        FROM applications a
        JOIN jobs j ON j.id=a.job_id
        JOIN users u_emp ON u_emp.id=j.employer_id
        JOIN users u_can ON u_can.id=a.candidate_id
        ORDER BY a.created_at DESC""")
    return [{**r, "employer_name": r.get("org_name") or r.get("employer_name")} for r in rows]


@router.get("/mine")
async def my_apps(user: dict = Depends(require_role("candidate"))):
    rows = await query("""SELECT a.*, j.title, j.location, j.job_type, u.org_name, u.name as employer_name
        FROM applications a
        JOIN jobs j ON j.id=a.job_id
        JOIN users u ON u.id=j.employer_id
        WHERE a.candidate_id=$1 ORDER BY a.created_at DESC""", [user["id"]])
    return [{**r, "employer_name": r.get("org_name") or r.get("employer_name")} for r in rows]


@router.get("/job/{job_id}")
async def apps_for_job(job_id: int, user: dict = Depends(require_role("employer", "admin"))):
    job = await query_one("SELECT * FROM jobs WHERE id=$1", [job_id])
    if not job: raise HTTPException(404, detail="Job not found")
    if user["role"] != "admin" and job["employer_id"] != user["id"]:
        raise HTTPException(403, detail="Not your job posting")
    rows = await query("""SELECT a.*, u.name as candidate_name, u.email, u.location, u.skills, u.experience_years
        FROM applications a JOIN users u ON u.id=a.candidate_id
        WHERE a.job_id=$1 ORDER BY a.match_score DESC""", [job_id])
    result = []
    for r in rows:
        s = r.get("skills")
        result.append({**r, "skills": json.loads(s) if isinstance(s, str) else (s or [])})
    return result


@router.post("", status_code=201)
async def apply(body: dict, user: dict = Depends(require_role("candidate", "administrator"))):
    job_id = body.get("job_id")
    job = await query_one("SELECT * FROM jobs WHERE id=$1", [job_id])
    if not job: raise HTTPException(404, detail="Job not found")
    existing = await query_one("SELECT id FROM applications WHERE job_id=$1 AND candidate_id=$2", [job_id, user["id"]])
    if existing: raise HTTPException(409, detail="Already applied to this job")
    me = await query_one("SELECT skills, experience_years FROM users WHERE id=$1", [user["id"]])
    raw = me.get("skills") if me else None
    c_skills = json.loads(raw) if isinstance(raw, str) else (raw or [])
    rs = job.get("required_skills")
    j_skills = json.loads(rs) if isinstance(rs, str) else (rs or [])
    score = _match_score(c_skills, j_skills, me.get("experience_years") or 0 if me else 0)
    row = await execute_returning(
        "INSERT INTO applications (job_id, candidate_id, match_score) VALUES ($1,$2,$3) RETURNING *",
        [job_id, user["id"], score],
    )
    return row


@router.put("/{aid}/status")
async def update_status(aid: int, body: dict, user: dict = Depends(require_role("employer", "admin"))):
    status = body.get("status")
    allowed = ["applied", "shortlisted", "interview", "rejected", "hired"]
    if status not in allowed: raise HTTPException(400, detail="Invalid status")
    app = await query_one("SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=$1", [aid])
    if not app: raise HTTPException(404, detail="Application not found")
    if user["role"] != "admin" and app["employer_id"] != user["id"]:
        raise HTTPException(403, detail="Not your job posting")
    await execute("UPDATE applications SET status=$1 WHERE id=$2", [status, aid])
    return {**app, "status": status}


@router.delete("/{aid}")
async def delete_app(aid: int, user: dict = Depends(auth_required)):
    app = await query_one("SELECT * FROM applications WHERE id=$1", [aid])
    if not app: raise HTTPException(404, detail="Application not found")
    is_admin = user["role"] in ["admin", "administrator"]
    is_owner = user["role"] == "candidate" and app["candidate_id"] == user["id"]
    if not is_admin and not is_owner: raise HTTPException(403, detail="Forbidden")
    await execute("DELETE FROM applications WHERE id=$1", [aid])
    return {"ok": True}
