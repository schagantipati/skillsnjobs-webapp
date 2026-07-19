from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import query, query_one, execute, execute_returning
from auth import auth_required

router = APIRouter(prefix="/api/candidate", tags=["candidate"])


def _require_candidate(user):
    if user["role"] != "candidate":
        raise HTTPException(403, "Candidates only")


# ── Saved Jobs ────────────────────────────────────────────────────────────────

@router.get("/saved-jobs")
async def get_saved_jobs(user: dict = Depends(auth_required)):
    _require_candidate(user)
    rows = await query(
        """SELECT sj.id, sj.saved_at, j.id AS job_id, j.title, j.company, j.location,
                  j.sector, j.salary_min, j.salary_max, j.employment_type, j.status
           FROM saved_jobs sj
           JOIN jobs j ON j.id = sj.job_id
           WHERE sj.candidate_id = $1
           ORDER BY sj.saved_at DESC""",
        [user["id"]],
    )
    return rows


@router.post("/saved-jobs/{job_id}", status_code=201)
async def save_job(job_id: int, user: dict = Depends(auth_required)):
    _require_candidate(user)
    job = await query_one("SELECT id FROM jobs WHERE id=$1", [job_id])
    if not job:
        raise HTTPException(404, "Job not found")
    try:
        row = await execute_returning(
            "INSERT INTO saved_jobs (candidate_id, job_id) VALUES ($1,$2) RETURNING id, saved_at",
            [user["id"], job_id],
        )
    except Exception:
        raise HTTPException(409, "Already saved")
    return {"id": row["id"], "job_id": job_id, "saved_at": str(row["saved_at"])}


@router.delete("/saved-jobs/{job_id}", status_code=204)
async def unsave_job(job_id: int, user: dict = Depends(auth_required)):
    _require_candidate(user)
    await execute(
        "DELETE FROM saved_jobs WHERE candidate_id=$1 AND job_id=$2",
        [user["id"], job_id],
    )


# ── Job Alerts ────────────────────────────────────────────────────────────────

class JobAlertPayload(BaseModel):
    preferred_role: Optional[str] = None
    preferred_sector: Optional[str] = None
    preferred_location: Optional[str] = None
    frequency: Optional[str] = "Daily"
    is_active: Optional[bool] = True


@router.get("/job-alerts")
async def get_job_alert(user: dict = Depends(auth_required)):
    _require_candidate(user)
    row = await query_one("SELECT * FROM job_alerts WHERE candidate_id=$1", [user["id"]])
    return row or {}


@router.put("/job-alerts")
async def upsert_job_alert(payload: JobAlertPayload, user: dict = Depends(auth_required)):
    _require_candidate(user)
    existing = await query_one("SELECT id FROM job_alerts WHERE candidate_id=$1", [user["id"]])
    if existing:
        row = await execute_returning(
            """UPDATE job_alerts SET preferred_role=$2, preferred_sector=$3,
               preferred_location=$4, frequency=$5, is_active=$6, updated_at=NOW()
               WHERE candidate_id=$1 RETURNING *""",
            [user["id"], payload.preferred_role, payload.preferred_sector,
             payload.preferred_location, payload.frequency, payload.is_active],
        )
    else:
        row = await execute_returning(
            """INSERT INTO job_alerts (candidate_id, preferred_role, preferred_sector,
               preferred_location, frequency, is_active)
               VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
            [user["id"], payload.preferred_role, payload.preferred_sector,
             payload.preferred_location, payload.frequency, payload.is_active],
        )
    return row


# ── Notifications ─────────────────────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications(user: dict = Depends(auth_required)):
    _require_candidate(user)
    rows = await query(
        "SELECT * FROM candidate_notifications WHERE candidate_id=$1 ORDER BY created_at DESC LIMIT 50",
        [user["id"]],
    )
    # Seed welcome notification if none exist
    if not rows:
        await execute(
            """INSERT INTO candidate_notifications (candidate_id, title, body, type)
               VALUES ($1, 'Welcome to SkillsNJobs! 🎉',
               'Start your skill-to-career journey. Complete your profile to unlock all features.', 'info')""",
            [user["id"]],
        )
        rows = await query(
            "SELECT * FROM candidate_notifications WHERE candidate_id=$1 ORDER BY created_at DESC",
            [user["id"]],
        )
    return rows


@router.put("/notifications/mark-read")
async def mark_all_read(user: dict = Depends(auth_required)):
    _require_candidate(user)
    await execute(
        "UPDATE candidate_notifications SET is_read=TRUE WHERE candidate_id=$1",
        [user["id"]],
    )
    return {"ok": True}


@router.put("/notifications/{notif_id}/read")
async def mark_one_read(notif_id: int, user: dict = Depends(auth_required)):
    _require_candidate(user)
    await execute(
        "UPDATE candidate_notifications SET is_read=TRUE WHERE id=$1 AND candidate_id=$2",
        [notif_id, user["id"]],
    )
    return {"ok": True}


# ── Resume ────────────────────────────────────────────────────────────────────

class ResumePayload(BaseModel):
    content: str


@router.get("/resume")
async def get_resume(user: dict = Depends(auth_required)):
    _require_candidate(user)
    row = await query_one(
        "SELECT * FROM candidate_resumes WHERE candidate_id=$1 ORDER BY version DESC LIMIT 1",
        [user["id"]],
    )
    return row or {}


@router.post("/resume")
async def save_resume(payload: ResumePayload, user: dict = Depends(auth_required)):
    _require_candidate(user)
    existing = await query_one(
        "SELECT id, version FROM candidate_resumes WHERE candidate_id=$1 ORDER BY version DESC LIMIT 1",
        [user["id"]],
    )
    if existing:
        row = await execute_returning(
            """UPDATE candidate_resumes SET content=$2, version=version+1, updated_at=NOW()
               WHERE id=$3 RETURNING *""",
            [user["id"], payload.content, existing["id"]],
        )
    else:
        row = await execute_returning(
            """INSERT INTO candidate_resumes (candidate_id, content, version)
               VALUES ($1,$2,1) RETURNING *""",
            [user["id"], payload.content],
        )
    # Fire notification
    await execute(
        """INSERT INTO candidate_notifications (candidate_id, title, body, type)
           VALUES ($1, 'Resume saved ✅',
           'Your resume has been saved successfully. You can download or update it anytime.', 'success')""",
        [user["id"]],
    )
    return row
