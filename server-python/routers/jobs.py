import json
import re
from fastapi import APIRouter, Depends
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _strip(s):
    return re.sub(r"<[^>]*>", "", s).strip() if isinstance(s, str) else s


def _match_score(candidate_skills, job_skills, exp_years):
    if not job_skills: return 0
    c_lower = {s.lower() for s in candidate_skills}
    j_lower = [s.lower() for s in job_skills]
    matched = sum(1 for s in j_lower if s in c_lower)
    skill_score = matched / len(j_lower) * 70
    exp_score = min(exp_years / 5 * 30, 30) if exp_years else 0
    return round(skill_score + exp_score)


def _job_out(j: dict, extra: dict = None) -> dict:
    rs = j.get("required_skills")
    if isinstance(rs, str):
        try: rs = json.loads(rs)
        except Exception: rs = []
    return {
        "id": j["id"], "employer_id": j["employer_id"], "title": j["title"],
        "description": j.get("description"), "required_skills": rs or [],
        "location": j.get("location"), "job_type": j.get("job_type"),
        "salary_min": j.get("salary_min"), "salary_max": j.get("salary_max"),
        "status": j.get("status"), "created_at": j.get("created_at"),
        **(extra or {}),
    }


@router.get("/mine/list")
async def my_jobs(user: dict = Depends(require_role("employer", "admin", "placement_agency"))):
    rows = await query("SELECT * FROM jobs WHERE employer_id=$1 ORDER BY created_at DESC", [user["id"]])
    return [_job_out(r) for r in rows]


@router.get("")
async def list_jobs(q: str = None, location: str = None, skill: str = None,
                    user: dict = Depends(auth_required)):
    rows = await query("""SELECT j.*, u.name as employer_name, u.org_name FROM jobs j
        JOIN users u ON u.id=j.employer_id WHERE j.status='open' ORDER BY j.created_at DESC""")

    if q:
        needle = q.lower()
        rows = [r for r in rows if needle in (r.get("title") or "").lower() or needle in (r.get("description") or "").lower()]
    if location:
        rows = [r for r in rows if location.lower() in (r.get("location") or "").lower()]
    if skill:
        def has_skill(r):
            rs = r.get("required_skills") or "[]"
            if isinstance(rs, str): rs = json.loads(rs)
            return any(skill.lower() in s.lower() for s in rs)
        rows = [r for r in rows if has_skill(r)]

    candidate_skills, candidate_exp = [], 0
    if user["role"] == "candidate":
        me = await query_one("SELECT skills, experience_years FROM users WHERE id=$1", [user["id"]])
        if me:
            s = me.get("skills")
            candidate_skills = json.loads(s) if isinstance(s, str) else (s or [])
            candidate_exp = me.get("experience_years") or 0

    out = []
    for j in rows:
        extra = {"employer_name": j.get("org_name") or j.get("employer_name")}
        if user["role"] == "candidate":
            rs = j.get("required_skills")
            if isinstance(rs, str): rs = json.loads(rs)
            extra["match_score"] = _match_score(candidate_skills, rs or [], candidate_exp)
        out.append(_job_out(j, extra))

    if user["role"] == "candidate":
        out.sort(key=lambda x: x.get("match_score") or 0, reverse=True)
    return out


@router.get("/{jid}")
async def get_job(jid: int, user: dict = Depends(auth_required)):
    j = await query_one("""SELECT j.*, u.name as employer_name, u.org_name FROM jobs j
        JOIN users u ON u.id=j.employer_id WHERE j.id=$1""", [jid])
    if not j: raise Exception("Not found")
    from fastapi import HTTPException
    if not j: raise HTTPException(404, detail="Job not found")
    return _job_out(j, {"employer_name": j.get("org_name") or j.get("employer_name")})


@router.post("", status_code=201)
async def create_job(body: dict, user: dict = Depends(require_role("employer", "admin", "placement_agency"))):
    from fastapi import HTTPException
    if not body.get("title"): raise HTTPException(400, detail="title is required")
    row = await execute_returning(
        """INSERT INTO jobs (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id""",
        [user["id"], _strip(body["title"]), _strip(body.get("description", "")),
         json.dumps(body.get("required_skills") or []),
         _strip(body.get("location", "")), body.get("job_type", "Full-time"),
         body.get("salary_min"), body.get("salary_max")],
    )
    j = await query_one("SELECT * FROM jobs WHERE id=$1", [row["id"]])
    return _job_out(j)


@router.put("/{jid}")
async def update_job(jid: int, body: dict, user: dict = Depends(require_role("employer", "admin", "placement_agency"))):
    from fastapi import HTTPException
    job = await query_one("SELECT * FROM jobs WHERE id=$1", [jid])
    if not job: raise HTTPException(404, detail="Job not found")
    if user["role"] != "admin" and job["employer_id"] != user["id"]:
        raise HTTPException(403, detail="Not your job posting")
    rs = body.get("required_skills")
    if rs is None:
        rs_raw = job.get("required_skills")
        rs = json.loads(rs_raw) if isinstance(rs_raw, str) else (rs_raw or [])
    await execute(
        "UPDATE jobs SET title=$1,description=$2,required_skills=$3,location=$4,job_type=$5,salary_min=$6,salary_max=$7,status=$8 WHERE id=$9",
        [_strip(body.get("title") or job["title"]), _strip(body.get("description") or job.get("description")),
         json.dumps(rs), body.get("location") or job.get("location"),
         body.get("job_type") or job.get("job_type"),
         body.get("salary_min") if "salary_min" in body else job.get("salary_min"),
         body.get("salary_max") if "salary_max" in body else job.get("salary_max"),
         body.get("status") or job.get("status"), jid],
    )
    return _job_out(await query_one("SELECT * FROM jobs WHERE id=$1", [jid]))


@router.delete("/{jid}", status_code=204)
async def delete_job(jid: int, user: dict = Depends(require_role("employer", "admin", "placement_agency"))):
    from fastapi import HTTPException
    job = await query_one("SELECT * FROM jobs WHERE id=$1", [jid])
    if not job: raise HTTPException(404, detail="Job not found")
    if user["role"] != "admin" and job["employer_id"] != user["id"]:
        raise HTTPException(403, detail="Not your job posting")
    await execute("DELETE FROM jobs WHERE id=$1", [jid])
