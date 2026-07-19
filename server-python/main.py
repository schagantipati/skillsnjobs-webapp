import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import init_db, query, query_one
from auth import auth_required

from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.jobs import router as jobs_router
from routers.applications import router as applications_router
from routers.courses import router as courses_router
from routers.batches import router as batches_router
from routers.placements import router as placements_router
from routers.csr import router as csr_router
from routers.collaboration import router as collaboration_router
from routers.vendor import router as vendor_router
from routers.state_govt import router as state_govt_router
from routers.trainer import router as trainer_router
from routers.candidate import router as candidate_router
from routers.ai.resume_parser import router as ai_resume_router
from routers.ai.job_matching import router as ai_matching_router
from routers.ai.dropout_predictor import router as ai_dropout_router
from routers.ai.analytics import router as ai_analytics_router
from routers.ai.chatbot import router as ai_chatbot_router
from routers.org_classifications import router as org_classifications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print(f"SkillsNJobs Python API starting on port {os.getenv('PORT', '4000')}")
    yield


app = FastAPI(title="SkillsNJobs API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(courses_router)
app.include_router(batches_router)
app.include_router(placements_router)
app.include_router(csr_router)
app.include_router(collaboration_router)
app.include_router(vendor_router)
app.include_router(state_govt_router)
app.include_router(trainer_router)
app.include_router(candidate_router)
app.include_router(ai_resume_router)
app.include_router(ai_matching_router)
app.include_router(ai_dropout_router)
app.include_router(ai_analytics_router)
app.include_router(ai_chatbot_router)
app.include_router(org_classifications_router)


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "skillsnjobs-python-api"}


@app.get("/api/stats/summary")
async def stats_summary(user: dict = Depends(auth_required)):
    async def n(sql, p=None):
        row = await query_one(sql, p or [])
        return int(row["c"] or 0) if row else 0

    out = {
        "openJobs":     await n("SELECT COUNT(*) c FROM jobs WHERE status='open'"),
        "candidates":   await n("SELECT COUNT(*) c FROM users WHERE role='candidate'"),
        "employers":    await n("SELECT COUNT(*) c FROM users WHERE role='employer'"),
        "courses":      await n("SELECT COUNT(*) c FROM courses"),
        "applications": await n("SELECT COUNT(*) c FROM applications"),
        "hired":        await n("SELECT COUNT(*) c FROM applications WHERE status='hired'"),
    }
    uid = user["id"]
    role = user["role"]

    if role == "candidate":
        out["myApplications"] = await n("SELECT COUNT(*) c FROM applications WHERE candidate_id=$1", [uid])
        out["myEnrollments"]  = await n("SELECT COUNT(*) c FROM enrollments WHERE candidate_id=$1", [uid])
        out["myCertificates"] = await n("SELECT COUNT(*) c FROM candidate_certificates WHERE candidate_id=$1", [uid])
        out["myShortlisted"]  = await n("SELECT COUNT(*) c FROM applications WHERE candidate_id=$1 AND status='shortlisted'", [uid])

    if role == "employer":
        out["myJobs"]        = await n("SELECT COUNT(*) c FROM jobs WHERE employer_id=$1", [uid])
        out["myOpenJobs"]    = await n("SELECT COUNT(*) c FROM jobs WHERE employer_id=$1 AND status='open'", [uid])
        out["myApplicants"]  = await n("SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=$1", [uid])
        out["myShortlisted"] = await n("SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=$1 AND a.status='shortlisted'", [uid])
        out["myHired"]       = await n("SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=$1 AND a.status='hired'", [uid])

    if role == "trainer":
        out["myBatches"]       = await n("SELECT COUNT(*) c FROM batches WHERE trainer_id=$1", [uid])
        out["myActiveBatches"] = await n("SELECT COUNT(*) c FROM batches WHERE trainer_id=$1 AND status='active'", [uid])
        out["myLearners"]      = await n("SELECT COUNT(*) c FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=$1", [uid])
        att_row = await query_one("SELECT AVG(present::int)*100 pct FROM attendance a JOIN batches b ON b.id=a.batch_id WHERE b.trainer_id=$1", [uid])
        out["avgAttendance"]   = round(float(att_row["pct"])) if att_row and att_row.get("pct") else 0
        pass_row = await query_one("SELECT AVG(passed::int)*100 pct FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=$1 AND be.assessment_score IS NOT NULL", [uid])
        out["assessmentPassRate"] = round(float(pass_row["pct"])) if pass_row and pass_row.get("pct") else 0

    if role == "placement_agency":
        out["totalPlacements"] = await n("SELECT COUNT(*) c FROM placements WHERE agency_id=$1", [uid])
        out["placedThisYear"]  = await n("SELECT COUNT(*) c FROM placements WHERE agency_id=$1 AND LEFT(placement_date::text,4)=TO_CHAR(CURRENT_DATE,'YYYY')", [uid])
        out["joinedCount"]     = await n("SELECT COUNT(*) c FROM placements WHERE agency_id=$1 AND status='joined'", [uid])
        ctc = await query_one("SELECT AVG(ctc) avg FROM placements WHERE agency_id=$1 AND status IN ('placed','joined')", [uid])
        out["avgCTC"] = round(float(ctc["avg"]) / 100000 * 10) / 10 if ctc and ctc.get("avg") else 0

    if role in ["superadmin", "admin", "administrator"]:
        out["totalBatches"]      = await n("SELECT COUNT(*) c FROM batches")
        out["totalPlacements"]   = await n("SELECT COUNT(*) c FROM placements")
        out["totalCertificates"] = await n("SELECT COUNT(*) c FROM candidate_certificates")
        out["trainers"]          = await n("SELECT COUNT(*) c FROM users WHERE role='trainer'")
        out["placementAgencies"] = await n("SELECT COUNT(*) c FROM users WHERE role='placement_agency'")
        out["csrOrgs"]           = await n("SELECT COUNT(*) c FROM users WHERE role='csr_org'")
        out["trainingVendors"]   = await n("SELECT COUNT(*) c FROM users WHERE role='training_vendor'")
        out["placedCandidates"]  = await n("SELECT COUNT(*) c FROM placements WHERE status IN ('placed','joined')")
        out["activeBatches"]     = await n("SELECT COUNT(*) c FROM batches WHERE status='active'")
        out["totalUsers"]        = await n("SELECT COUNT(*) c FROM users WHERE is_active=1")

    return out


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 4000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
