"""
AI Feature 3: Dropout Risk Prediction
Predicts which enrolled candidates are at risk of dropping out based on attendance patterns.
"""
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one
from auth import auth_required, require_role

router = APIRouter(prefix="/api/ai/dropout", tags=["ai"])

# Risk thresholds
HIGH_RISK_ATT = 60      # below 60% attendance → high risk
MEDIUM_RISK_ATT = 75    # 60-75% → medium risk


def _risk_level(att_pct: float) -> str:
    if att_pct < HIGH_RISK_ATT:   return "high"
    if att_pct < MEDIUM_RISK_ATT: return "medium"
    return "low"


def _risk_factors(row: dict) -> list:
    factors = []
    att = row.get("att_pct") or 0
    if att < HIGH_RISK_ATT:
        factors.append(f"Attendance critically low at {att:.1f}%")
    elif att < MEDIUM_RISK_ATT:
        factors.append(f"Attendance below recommended 75% (currently {att:.1f}%)")
    if row.get("consecutive_absences", 0) >= 3:
        factors.append(f"{row['consecutive_absences']} consecutive absences")
    if row.get("assessment_score") is not None and row.get("assessment_score", 100) < 40:
        factors.append(f"Low assessment score: {row['assessment_score']}")
    return factors or ["No major risk factors detected"]


@router.get("/batch/{batch_id}")
async def dropout_risk_for_batch(batch_id: int, user: dict = Depends(require_role("trainer", "admin", "administrator"))):
    """Return dropout risk assessment for all learners in a batch."""
    batch = await query_one("SELECT * FROM batches WHERE id=$1", [batch_id])
    if not batch: raise HTTPException(404, detail="Batch not found")
    if user["role"] == "trainer" and batch.get("trainer_id") != user["id"]:
        raise HTTPException(403, detail="Not your batch")

    learners = await query("""
        SELECT be.candidate_id, be.status, be.assessment_score, be.passed,
               u.name, u.email,
               ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END), 1) AS att_pct,
               COUNT(a.id) AS total_sessions
        FROM batch_enrollments be
        JOIN users u ON u.id=be.candidate_id
        LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
        WHERE be.batch_id=$1 AND be.status='enrolled'
        GROUP BY be.candidate_id, be.status, be.assessment_score, be.passed, u.name, u.email
        ORDER BY att_pct ASC
    """, [batch_id])

    results = []
    for l in learners:
        att = float(l.get("att_pct") or 0)
        risk = _risk_level(att)
        results.append({
            "candidate_id": l["candidate_id"],
            "name": l["name"],
            "email": l["email"],
            "att_pct": att,
            "assessment_score": l.get("assessment_score"),
            "total_sessions": l.get("total_sessions") or 0,
            "risk_level": risk,
            "risk_factors": _risk_factors(l),
        })

    high = [r for r in results if r["risk_level"] == "high"]
    medium = [r for r in results if r["risk_level"] == "medium"]
    low = [r for r in results if r["risk_level"] == "low"]

    return {
        "batch_id": batch_id,
        "batch_code": batch.get("batch_code"),
        "total_learners": len(results),
        "high_risk": len(high),
        "medium_risk": len(medium),
        "low_risk": len(low),
        "learners": results,
    }


@router.get("/trainer-summary")
async def trainer_dropout_summary(user: dict = Depends(require_role("trainer"))):
    """Return at-risk candidates across all of a trainer's active batches."""
    at_risk = await query("""
        SELECT be.candidate_id, u.name, u.email, b.batch_code, b.id AS batch_id,
               ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END), 1) AS att_pct
        FROM batch_enrollments be
        JOIN users u ON u.id=be.candidate_id
        JOIN batches b ON b.id=be.batch_id
        LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
        WHERE b.trainer_id=$1 AND be.status='enrolled'
        GROUP BY be.candidate_id, u.name, u.email, b.batch_code, b.id
        HAVING ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END), 1) < 75
        ORDER BY att_pct ASC
        LIMIT 50
    """, [user["id"]])

    return {
        "at_risk_count": len(at_risk),
        "learners": [{**r, "risk_level": _risk_level(float(r.get("att_pct") or 0))} for r in at_risk],
    }


@router.get("/vendor-summary")
async def vendor_dropout_summary(user: dict = Depends(require_role("training_vendor"))):
    """Return dropout risk across all vendor batches."""
    at_risk = await query("""
        SELECT vc.name, vc.mobile, b.batch_code,
               COALESCE(vc.attendance_pct, 0) AS att_pct,
               vc.status
        FROM vendor_candidates vc
        JOIN batches b ON b.id=vc.unified_batch_id
        WHERE b.vendor_id=$1 AND vc.status='active' AND COALESCE(vc.attendance_pct, 0) < 75
        ORDER BY vc.attendance_pct ASC
        LIMIT 50
    """, [user["id"]])

    return {
        "at_risk_count": len(at_risk),
        "learners": [{**r, "risk_level": _risk_level(float(r.get("att_pct") or 0))} for r in at_risk],
    }
