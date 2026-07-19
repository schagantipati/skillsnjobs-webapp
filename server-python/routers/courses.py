import json
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role

router = APIRouter(prefix="/api/courses", tags=["courses"])


def _course_out(c: dict) -> dict:
    st = c.get("skill_tags")
    if isinstance(st, str):
        try: st = json.loads(st)
        except Exception: st = []
    return {
        "id": c["id"], "trainer_id": c.get("trainer_id"), "title": c["title"],
        "provider": c.get("provider"), "skill_tags": st or [],
        "duration_weeks": c.get("duration_weeks"), "level": c.get("level"),
        "rating": c.get("rating"), "created_at": c.get("created_at"),
    }


@router.get("/mine/enrollments")
async def my_enrollments(user: dict = Depends(require_role("candidate"))):
    rows = await query("""SELECT e.*, c.title, c.provider, c.duration_weeks, c.level
        FROM enrollments e JOIN courses c ON c.id=e.course_id
        WHERE e.candidate_id=$1 ORDER BY e.created_at DESC""", [user["id"]])
    return rows


@router.get("/mine/certificates")
async def my_certificates(user: dict = Depends(require_role("candidate"))):
    return await query("SELECT * FROM candidate_certificates WHERE candidate_id=$1 ORDER BY issued_date DESC", [user["id"]])


@router.get("/mine/grievances")
async def get_grievances(user: dict = Depends(require_role("candidate"))):
    return await query("SELECT * FROM candidate_grievances WHERE candidate_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/mine/grievances", status_code=201)
async def add_grievance(body: dict, user: dict = Depends(require_role("candidate"))):
    if not body.get("subject") or not body.get("description"):
        raise HTTPException(400, detail="subject and description are required")
    row = await execute_returning(
        "INSERT INTO candidate_grievances (candidate_id,category,subject,description) VALUES ($1,$2,$3,$4) RETURNING *",
        [user["id"], body.get("category", "Other"), body["subject"], body["description"]],
    )
    return row


@router.get("/recommendations/for-me")
async def recommendations(user: dict = Depends(require_role("candidate"))):
    me = await query_one("SELECT skills FROM users WHERE id=$1", [user["id"]])
    raw = me.get("skills") if me else None
    my_skills = {s.lower() for s in (json.loads(raw) if isinstance(raw, str) else (raw or []))}

    jobs = await query("SELECT required_skills FROM jobs WHERE status='open'")
    gap_count: dict = {}
    for j in jobs:
        rs = j.get("required_skills")
        if isinstance(rs, str): rs = json.loads(rs)
        for s in (rs or []):
            k = s.lower()
            if k not in my_skills:
                gap_count[k] = gap_count.get(k, 0) + 1

    top_gaps = [s for s, _ in sorted(gap_count.items(), key=lambda x: -x[1])]
    courses = await query("SELECT * FROM courses")
    scored = []
    for c in courses:
        st = c.get("skill_tags")
        if isinstance(st, str): st = json.loads(st)
        tags = [t.lower() for t in (st or [])]
        rel = sum(1 for t in tags if t in top_gaps)
        if rel > 0:
            scored.append({**_course_out(c), "relevance": rel})
    scored.sort(key=lambda x: -x["relevance"])
    return {"topSkillGaps": top_gaps[:6], "recommendedCourses": scored}


@router.get("")
async def list_courses(user: dict = Depends(auth_required)):
    rows = await query("SELECT * FROM courses ORDER BY created_at DESC")
    return [_course_out(r) for r in rows]


@router.post("", status_code=201)
async def create_course(body: dict, user: dict = Depends(require_role("trainer", "admin"))):
    if not body.get("title"): raise HTTPException(400, detail="title is required")
    row = await execute_returning(
        "INSERT INTO courses (trainer_id,title,provider,skill_tags,duration_weeks,level,rating) VALUES ($1,$2,$3,$4,$5,$6,4.5) RETURNING id",
        [user["id"], body["title"], body.get("provider") or user.get("name"),
         json.dumps(body.get("skill_tags") or []),
         body.get("duration_weeks", 4), body.get("level", "Beginner")],
    )
    c = await query_one("SELECT * FROM courses WHERE id=$1", [row["id"]])
    return _course_out(c)


@router.post("/{cid}/enroll", status_code=201)
async def enroll(cid: int, body: dict = None, user: dict = Depends(require_role("candidate"))):
    course = await query_one("SELECT * FROM courses WHERE id=$1", [cid])
    if not course: raise HTTPException(404, detail="Course not found")
    existing = await query_one("SELECT id FROM enrollments WHERE course_id=$1 AND candidate_id=$2", [cid, user["id"]])
    if existing: raise HTTPException(409, detail="Already enrolled")
    batch_id = (body or {}).get("batch_id")
    await execute("INSERT INTO enrollments (course_id, candidate_id, batch_id) VALUES ($1,$2,$3)", [cid, user["id"], batch_id])
    if batch_id:
        be = await query_one("SELECT id FROM batch_enrollments WHERE batch_id=$1 AND candidate_id=$2", [batch_id, user["id"]])
        if not be:
            await execute("INSERT INTO batch_enrollments (batch_id, candidate_id) VALUES ($1,$2)", [batch_id, user["id"]])
    return {"ok": True}
