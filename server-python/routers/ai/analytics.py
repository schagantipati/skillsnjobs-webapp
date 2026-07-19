"""
AI Feature 4: Training Outcome Analytics
Provides AI-generated insights about training effectiveness, placement rates, and trends.
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one
from auth import auth_required, require_role

router = APIRouter(prefix="/api/ai/analytics", tags=["ai"])


@router.get("/training-outcomes")
async def training_outcomes(user: dict = Depends(auth_required)):
    """Return computed training outcome metrics for the current user's context."""
    uid, role = user["id"], user["role"]

    if role == "trainer":
        batches = await query("""SELECT b.id, b.batch_code, b.name, b.status,
            COUNT(DISTINCT be.candidate_id) enrolled,
            COUNT(DISTINCT CASE WHEN be.status='completed' THEN be.candidate_id END) completed,
            COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) passed,
            ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END), 1) avg_attendance
            FROM batches b
            LEFT JOIN batch_enrollments be ON be.batch_id=b.id
            LEFT JOIN attendance a ON a.batch_id=b.id
            WHERE b.trainer_id=$1
            GROUP BY b.id ORDER BY b.start_date DESC""", [uid])

        total_enrolled = sum(int(b.get("enrolled") or 0) for b in batches)
        total_completed = sum(int(b.get("completed") or 0) for b in batches)
        total_passed = sum(int(b.get("passed") or 0) for b in batches)
        avg_att = round(sum(float(b.get("avg_attendance") or 0) for b in batches) / len(batches), 1) if batches else 0

        placed = await query_one("""SELECT COUNT(*) c FROM placements p
            JOIN batch_enrollments be ON be.candidate_id=p.candidate_id
            JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=$1""", [uid])

        return {
            "role": "trainer",
            "total_batches": len(batches),
            "total_enrolled": total_enrolled,
            "completion_rate": round(total_completed / total_enrolled * 100, 1) if total_enrolled else 0,
            "pass_rate": round(total_passed / total_enrolled * 100, 1) if total_enrolled else 0,
            "avg_attendance": avg_att,
            "total_placed": int(placed["c"] or 0) if placed else 0,
            "placement_rate": round(int(placed["c"] or 0) / total_completed * 100, 1) if total_completed else 0,
            "batches": batches,
        }

    if role == "training_vendor":
        stats = {
            "total_candidates": int((await query_one("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1", [uid]) or {}).get("c") or 0),
            "active_candidates": int((await query_one("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND status='active'", [uid]) or {}).get("c") or 0),
            "placed_candidates": int((await query_one("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND placement_status='placed'", [uid]) or {}).get("c") or 0),
            "total_batches": int((await query_one("SELECT COUNT(*) c FROM batches WHERE vendor_id=$1", [uid]) or {}).get("c") or 0),
            "active_batches": int((await query_one("SELECT COUNT(*) c FROM batches WHERE vendor_id=$1 AND status='active'", [uid]) or {}).get("c") or 0),
            "total_centres": int((await query_one("SELECT COUNT(*) c FROM vendor_centres WHERE vendor_id=$1 AND status!='deleted'", [uid]) or {}).get("c") or 0),
        }
        tc = stats["total_candidates"]
        stats["placement_rate"] = round(stats["placed_candidates"] / tc * 100, 1) if tc else 0
        return {"role": "training_vendor", **stats}

    if role in ["superadmin", "admin", "administrator"]:
        async def n(sql): row = await query_one(sql); return int(row["c"] or 0) if row else 0
        return {
            "role": "admin",
            "total_candidates": await n("SELECT COUNT(*) c FROM users WHERE role='candidate'"),
            "total_trainers": await n("SELECT COUNT(*) c FROM users WHERE role='trainer'"),
            "total_batches": await n("SELECT COUNT(*) c FROM batches"),
            "active_batches": await n("SELECT COUNT(*) c FROM batches WHERE status='active'"),
            "total_enrolled": await n("SELECT COUNT(*) c FROM batch_enrollments"),
            "total_placed": await n("SELECT COUNT(*) c FROM placements WHERE status IN ('placed','joined')"),
            "open_jobs": await n("SELECT COUNT(*) c FROM jobs WHERE status='open'"),
            "total_applications": await n("SELECT COUNT(*) c FROM applications"),
            "hired": await n("SELECT COUNT(*) c FROM applications WHERE status='hired'"),
        }

    raise HTTPException(403, detail="Analytics not available for this role")


@router.post("/ai-insights")
async def ai_insights(body: dict, user: dict = Depends(require_role("trainer", "training_vendor", "admin", "administrator", "superadmin"))):
    """Generate AI narrative insights from training metrics."""
    metrics = body.get("metrics", {})
    context = body.get("context", "training program")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"insights": "AI insights require ANTHROPIC_API_KEY to be configured in .env"}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        prompt = f"""You are a training analytics advisor. Analyze these metrics for {context}:
{metrics}

Provide 3 bullet-point insights:
1. What is working well
2. Main area of concern
3. One specific recommendation

Keep each point to one sentence."""
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return {"insights": msg.content[0].text.strip()}
    except Exception as e:
        raise HTTPException(500, detail=f"AI insights failed: {str(e)}")


@router.get("/skill-gap-analysis")
async def skill_gap_analysis(user: dict = Depends(require_role("admin", "administrator", "superadmin", "training_vendor"))):
    """Identify the most in-demand skills that candidates lack."""
    jobs = await query("SELECT required_skills FROM jobs WHERE status='open'")
    all_job_skills: dict = {}
    for j in jobs:
        rs = j.get("required_skills")
        import json
        skills = json.loads(rs) if isinstance(rs, str) else (rs or [])
        for s in skills:
            k = s.lower().strip()
            all_job_skills[k] = all_job_skills.get(k, 0) + 1

    candidates = await query("SELECT skills FROM users WHERE role='candidate'")
    all_candidate_skills: dict = {}
    for c in candidates:
        raw = c.get("skills")
        import json
        skills = json.loads(raw) if isinstance(raw, str) else (raw or [])
        for s in skills:
            k = s.lower().strip()
            all_candidate_skills[k] = all_candidate_skills.get(k, 0) + 1

    gaps = []
    for skill, demand in sorted(all_job_skills.items(), key=lambda x: -x[1]):
        supply = all_candidate_skills.get(skill, 0)
        gap = demand - supply
        if gap > 0:
            gaps.append({"skill": skill, "demand": demand, "supply": supply, "gap": gap})

    return {
        "total_open_jobs": len(jobs),
        "total_candidates": len(candidates),
        "skill_gaps": gaps[:20],
    }
