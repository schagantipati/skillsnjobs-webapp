from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role
import time

router = APIRouter(prefix="/api/batches", tags=["batches"])


@router.get("/my-assessments")
async def my_assessments(user: dict = Depends(require_role("candidate"))):
    rows = await query("SELECT batch_id FROM batch_enrollments WHERE candidate_id=$1", [user["id"]])
    my_batch_ids = [r["batch_id"] for r in rows]
    if not my_batch_ids:
        return {"upcoming": [], "completed": []}

    placeholders = ",".join(f"${i+1}" for i in range(len(my_batch_ids)))
    ta = await query(f"""SELECT ta.*, b.batch_code, COALESCE(c.title, vc.title) AS course_title,
        'trainer' AS source, ta.date AS assess_date
        FROM trainer_assessments ta
        JOIN batches b ON b.id=ta.batch_id
        LEFT JOIN courses c ON c.id=b.course_id AND b.vendor_id IS NULL
        LEFT JOIN vendor_courses vc ON vc.id=b.vendor_course_id
        WHERE ta.batch_id IN ({placeholders})
        ORDER BY ta.date ASC""", my_batch_ids)
    va = await query(f"""SELECT va.*, b.batch_code, vc.title AS course_title,
        'vendor' AS source, va.scheduled_date AS assess_date
        FROM vendor_assessments va
        JOIN batches b ON b.id=va.unified_batch_id
        LEFT JOIN vendor_courses vc ON vc.id=b.vendor_course_id
        WHERE va.unified_batch_id IN ({placeholders})
          AND COALESCE(va.status,'scheduled') != 'cancelled'
        ORDER BY va.scheduled_date ASC""", my_batch_ids)

    from datetime import date
    today = date.today().isoformat()
    all_items = sorted(ta + va, key=lambda x: str(x.get("assess_date") or ""))
    return {
        "upcoming": [a for a in all_items if str(a.get("assess_date") or "") >= today and a.get("status") != "completed"],
        "completed": [a for a in all_items if a.get("status") == "completed" or str(a.get("assess_date") or "") < today],
    }


@router.get("/mine")
async def my_batches(user: dict = Depends(require_role("trainer", "admin"))):
    for col, defn in [("mode", "TEXT DEFAULT 'Classroom'"), ("venue", "TEXT")]:
        try: await execute(f"ALTER TABLE batches ADD COLUMN IF NOT EXISTS {col} {defn}")
        except Exception: pass
    return await query("""SELECT b.*, c.title as course_title,
        (SELECT COUNT(*) FROM batch_enrollments WHERE batch_id=b.id) as learner_count,
        (SELECT AVG(CASE WHEN present=1 THEN 100.0 ELSE 0 END) FROM attendance WHERE batch_id=b.id) as avg_attendance
        FROM batches b
        LEFT JOIN courses c ON c.id=b.course_id
        WHERE b.trainer_id=$1
        ORDER BY b.start_date DESC""", [user["id"]])


@router.get("")
async def all_batches(user: dict = Depends(require_role("admin"))):
    return await query("""SELECT b.*,
        COALESCE(c.title, vco.title) AS course_title,
        u.name AS trainer_name, vu.name AS vendor_name,
        vc_centre.name AS centre_name, vt.name AS vendor_trainer_name,
        (SELECT COUNT(*) FROM batch_enrollments WHERE batch_id=b.id) AS learner_count,
        CASE WHEN b.vendor_id IS NOT NULL THEN 'vendor' ELSE 'trainer' END AS source
        FROM batches b
        LEFT JOIN courses c ON c.id=b.course_id AND b.vendor_id IS NULL
        LEFT JOIN vendor_courses vco ON vco.id=b.vendor_course_id
        LEFT JOIN users u ON u.id=b.trainer_id
        LEFT JOIN users vu ON vu.id=b.vendor_id
        LEFT JOIN vendor_centres vc_centre ON vc_centre.id=b.centre_id
        LEFT JOIN vendor_trainers vt ON vt.id=b.vendor_trainer_id
        WHERE COALESCE(b.status,'upcoming') != 'cancelled'
        ORDER BY b.created_at DESC""")


@router.post("", status_code=201)
async def create_batch(body: dict, user: dict = Depends(require_role("trainer", "admin"))):
    if not body.get("name"): raise HTTPException(400, detail="name is required")
    code = body.get("batch_code") or f"BATCH-{int(time.time() * 1000)}"
    try:
        row = await execute_returning("""INSERT INTO batches
            (trainer_id,course_id,batch_code,name,start_date,end_date,capacity,status,scheme_type,mode,venue)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *""",
            [user["id"], body.get("course_id"), code, body["name"],
             body.get("start_date"), body.get("end_date"),
             body.get("capacity", 30), body.get("status", "upcoming"), body.get("scheme_type", "None"),
             body.get("mode", "Classroom"), body.get("venue")])
        return row
    except Exception as e:
        if "unique" in str(e).lower(): raise HTTPException(409, detail="Batch code already exists")
        raise


@router.put("/{bid}")
async def update_batch(bid: int, body: dict, user: dict = Depends(require_role("trainer", "admin"))):
    batch = await query_one("SELECT * FROM batches WHERE id=$1", [bid])
    if not batch: raise HTTPException(404, detail="Batch not found")
    if user["role"] != "admin" and batch["trainer_id"] != user["id"]:
        raise HTTPException(403, detail="Not your batch")
    await execute("""UPDATE batches SET name=$1,course_id=$2,start_date=$3,end_date=$4,
        capacity=$5,status=$6,scheme_type=$7 WHERE id=$8""",
        [body.get("name") if "name" in body else batch["name"],
         body.get("course_id") if "course_id" in body else batch.get("course_id"),
         body.get("start_date") if "start_date" in body else batch.get("start_date"),
         body.get("end_date") if "end_date" in body else batch.get("end_date"),
         body.get("capacity") if "capacity" in body else batch.get("capacity"),
         body.get("status") if "status" in body else batch.get("status"),
         body.get("scheme_type") if "scheme_type" in body else (batch.get("scheme_type") or "None"),
         bid])
    return await query_one("SELECT * FROM batches WHERE id=$1", [bid])


@router.delete("/{bid}", status_code=204)
async def delete_batch(bid: int, user: dict = Depends(require_role("trainer", "admin"))):
    batch = await query_one("SELECT * FROM batches WHERE id=$1", [bid])
    if not batch: raise HTTPException(404, detail="Batch not found")
    if user["role"] != "admin" and batch["trainer_id"] != user["id"]:
        raise HTTPException(403, detail="Not your batch")
    await execute("DELETE FROM batches WHERE id=$1", [bid])


@router.post("/{bid}/learners", status_code=201)
async def add_learner(bid: int, body: dict, user: dict = Depends(require_role("trainer", "admin"))):
    cid = body.get("candidate_id")
    if not cid and body.get("email"):
        u = await query_one("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='candidate'", [body["email"]])
        if not u: raise HTTPException(404, detail="No candidate account found with that email")
        cid = u["id"]
    if not cid: raise HTTPException(400, detail="candidate_id or email required")
    existing = await query_one("SELECT id FROM batch_enrollments WHERE batch_id=$1 AND candidate_id=$2", [bid, cid])
    if existing: raise HTTPException(409, detail="Candidate already enrolled in this batch")
    await execute("INSERT INTO batch_enrollments (batch_id, candidate_id) VALUES ($1,$2)", [bid, cid])
    batch = await query_one("SELECT course_id FROM batches WHERE id=$1", [bid])
    if batch and batch.get("course_id"):
        already = await query_one("SELECT id FROM enrollments WHERE course_id=$1 AND candidate_id=$2", [batch["course_id"], cid])
        if not already:
            await execute("INSERT INTO enrollments (course_id, candidate_id, batch_id) VALUES ($1,$2,$3)", [batch["course_id"], cid, bid])
    return {"ok": True}


@router.get("/{bid}/learners")
async def batch_learners(bid: int, user: dict = Depends(require_role("trainer", "admin"))):
    return await query("""SELECT be.*, u.name, u.email, u.phone,
        (SELECT ROUND(AVG(CASE WHEN present=1 THEN 100.0 ELSE 0 END),1) FROM attendance
         WHERE batch_id=be.batch_id AND candidate_id=be.candidate_id) as attendance_pct
        FROM batch_enrollments be JOIN users u ON u.id=be.candidate_id
        WHERE be.batch_id=$1 ORDER BY u.name""", [bid])


@router.get("/{bid}/attendance")
async def get_attendance(bid: int, date: str = None, user: dict = Depends(require_role("trainer", "admin"))):
    if date:
        return await query("SELECT a.*, u.name FROM attendance a JOIN users u ON u.id=a.candidate_id WHERE a.batch_id=$1 AND a.date=$2", [bid, date])
    return await query("SELECT date, COUNT(*) total, SUM(present) present_count FROM attendance WHERE batch_id=$1 GROUP BY date ORDER BY date DESC", [bid])


@router.post("/{bid}/attendance")
async def mark_attendance(bid: int, body: dict, user: dict = Depends(require_role("trainer", "admin"))):
    date = body.get("date")
    records = body.get("records")
    if not date or not isinstance(records, list):
        raise HTTPException(400, detail="date and records[] required")
    for r in records:
        await execute("""INSERT INTO attendance (batch_id, candidate_id, date, present)
            VALUES ($1,$2,$3,$4)
            ON CONFLICT(batch_id, candidate_id, date) DO UPDATE SET present=EXCLUDED.present""",
            [bid, r["candidate_id"], date, 1 if r.get("present") else 0])
    return {"saved": len(records)}
