import time as _time
from fastapi import APIRouter, Depends, HTTPException, Request
from database import query, query_one, execute, execute_returning, log_audit
from auth import auth_required

router = APIRouter(prefix="/api/state-govt", tags=["state_govt"])


def _state_only(user: dict):
    if user["role"] not in ["state_government", "superadmin"]:
        raise HTTPException(403, detail="State government access required")


# ── Stats ─────────────────────────────────────────────────────────────────────
@router.get("/stats")
async def sg_stats(user: dict = Depends(auth_required)):
    _state_only(user)
    uid = user["id"]
    async def n(sql, p=None): row = await query_one(sql, p or []); return int(row["c"] or 0) if row else 0
    async def f(sql, p=None): row = await query_one(sql, p or []); return float(row["s"] or 0) if row else 0.0
    cand_total = await n("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1", [uid])
    cand_cert  = await n("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND certification_status='certified'", [uid])
    cand_placed= await n("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND placement_status='placed'", [uid])
    schemes    = await query("SELECT * FROM sg_schemes WHERE is_active=1")
    return {
        "tpCount":   await n("SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=$1", [uid]),
        "tpActive":  await n("SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=$1 AND status='verified'", [uid]),
        "tpPending": await n("SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=$1 AND status='pending'", [uid]),
        "candTotal":    cand_total,
        "candCertified":cand_cert,
        "candPlaced":   cand_placed,
        "candDropped":  await n("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND status='dropped'", [uid]),
        "disbTotal":  await f("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=$1 AND status='disbursed'", [uid]),
        "disbPending":await f("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=$1 AND status='pending'", [uid]),
        "grievOpen":  await n("SELECT COUNT(*) c FROM sg_grievances WHERE state_user_id=$1 AND status='open'", [uid]),
        "notifUnread":await n("SELECT COUNT(*) c FROM sg_notifications WHERE state_user_id=$1 AND is_read=0", [uid]),
        "schemes": schemes,
        "certRate": round(cand_cert / cand_total * 100) if cand_total else 0,
        "placementRate": round(cand_placed / cand_cert * 100) if cand_cert else 0,
    }


# ── Training Partners ─────────────────────────────────────────────────────────
@router.get("/training-partners")
async def get_sg_tps(status: str = None, scheme: str = None, q: str = None, user: dict = Depends(auth_required)):
    _state_only(user)
    sql, params = "SELECT * FROM sg_training_partners WHERE state_user_id=$1", [user["id"]]
    if status: params.append(status); sql += f" AND status=${len(params)}"
    if scheme: params.append(scheme); sql += f" AND scheme=${len(params)}"
    if q:      params.append(f"%{q}%"); sql += f" AND name ILIKE ${len(params)}"
    return await query(sql + " ORDER BY created_at DESC", params)


@router.post("/training-partners", status_code=201)
async def add_sg_tp(body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    if not body.get("name"): raise HTTPException(400, detail="Name is required")
    row = await execute_returning("""INSERT INTO sg_training_partners
        (state_user_id,name,type,district,state_name,nsdc_code,email,mobile,scheme,accreditation,accreditation_expiry,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending') RETURNING id""",
        [user["id"], body["name"], body.get("type"), body.get("district"), body.get("state_name"), body.get("nsdc_code"),
         body.get("email"), body.get("mobile"), body.get("scheme"), body.get("accreditation"), body.get("accreditation_expiry")])
    await log_audit(user, "TP Created", "sg_training_partners", row["id"], body["name"])
    return {"id": row["id"]}


@router.put("/training-partners/{tid}")
async def update_sg_tp(tid: int, body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    await execute("""UPDATE sg_training_partners SET status=COALESCE($1,status),name=COALESCE($2,name),
        type=COALESCE($3,type),district=COALESCE($4,district),scheme=COALESCE($5,scheme),
        accreditation=COALESCE($6,accreditation),accreditation_expiry=COALESCE($7,accreditation_expiry),
        centre_count=COALESCE($8,centre_count),trainee_count=COALESCE($9,trainee_count)
        WHERE id=$10 AND state_user_id=$11""",
        [body.get("status"), body.get("name"), body.get("type"), body.get("district"), body.get("scheme"),
         body.get("accreditation"), body.get("accreditation_expiry"), body.get("centre_count"), body.get("trainee_count"),
         tid, user["id"]])
    await log_audit(user, "TP Updated", "sg_training_partners", tid)
    return {"ok": True}


# ── Candidates ────────────────────────────────────────────────────────────────
@router.get("/candidates")
async def get_sg_candidates(scheme: str = None, district: str = None, status: str = None, q: str = None, user: dict = Depends(auth_required)):
    _state_only(user)
    sql, params = "SELECT c.*,t.name as tp_name FROM sg_candidates c LEFT JOIN sg_training_partners t ON t.id=c.tp_id WHERE c.state_user_id=$1", [user["id"]]
    if scheme:   params.append(scheme);   sql += f" AND c.scheme=${len(params)}"
    if district: params.append(district); sql += f" AND c.district=${len(params)}"
    if status:   params.append(status);   sql += f" AND c.status=${len(params)}"
    if q:
        params.extend([f"%{q}%", f"%{q}%"])
        sql += f" AND (c.name ILIKE ${len(params)-1} OR c.candidate_ref ILIKE ${len(params)})"
    return await query(sql + " ORDER BY c.created_at DESC LIMIT 200", params)


@router.post("/candidates", status_code=201)
async def add_sg_candidate(body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    if not body.get("name"): raise HTTPException(400, detail="Name is required")
    from datetime import date
    state_abbr = (user.get("state_name") or "ST")[:2].upper()
    ref = f"SKL-{state_abbr}-{str(int(_time.time() * 1000))[-6:]}"
    resolved_batch = body.get("batch_id")
    if not resolved_batch and body.get("batch_code"):
        b = await query_one("SELECT id FROM batches WHERE LOWER(TRIM(batch_code))=LOWER(TRIM($1))", [body["batch_code"]])
        if b: resolved_batch = b["id"]
    row = await execute_returning("""INSERT INTO sg_candidates
        (state_user_id,candidate_ref,name,gender,dob,district,state_name,mobile,aadhaar_masked,scheme,course,tp_id,batch_code,batch_id,enroll_date)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id""",
        [user["id"], ref, body["name"], body.get("gender"), body.get("dob"), body.get("district"), body.get("state_name"),
         body.get("mobile"), body.get("aadhaar_masked"), body.get("scheme"), body.get("course"),
         body.get("tp_id"), body.get("batch_code"), resolved_batch,
         body.get("enroll_date") or date.today().isoformat()])
    await log_audit(user, "Candidate Enrolled", "sg_candidates", row["id"], body["name"])
    return {"id": row["id"], "candidate_ref": ref}


@router.put("/candidates/{cid}")
async def update_sg_candidate(cid: int, body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    await execute("""UPDATE sg_candidates SET status=COALESCE($1,status),assessment_status=COALESCE($2,assessment_status),
        certification_status=COALESCE($3,certification_status),placement_status=COALESCE($4,placement_status),
        employer_name=COALESCE($5,employer_name),salary=COALESCE($6,salary),dropout_reason=COALESCE($7,dropout_reason)
        WHERE id=$8 AND state_user_id=$9""",
        [body.get("status"), body.get("assessment_status"), body.get("certification_status"),
         body.get("placement_status"), body.get("employer_name"), body.get("salary"), body.get("dropout_reason"),
         cid, user["id"]])
    await log_audit(user, "Candidate Updated", "sg_candidates", cid)
    return {"ok": True}


# ── Targets ───────────────────────────────────────────────────────────────────
@router.get("/targets")
async def get_targets(fy: str = None, user: dict = Depends(auth_required)):
    _state_only(user)
    sql, params = "SELECT t.*,s.code,s.name as scheme_name FROM sg_targets t JOIN sg_schemes s ON s.id=t.scheme_id WHERE t.state_user_id=$1", [user["id"]]
    if fy: params.append(fy); sql += f" AND t.fy=${len(params)}"
    return await query(sql, params)


@router.post("/targets", status_code=201)
async def set_target(body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    row = await execute_returning("""INSERT INTO sg_targets (state_user_id,scheme_id,fy,annual_target,q1_target,q2_target,q3_target,q4_target)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT(state_user_id,scheme_id,fy) DO UPDATE SET
          annual_target=EXCLUDED.annual_target,q1_target=EXCLUDED.q1_target,
          q2_target=EXCLUDED.q2_target,q3_target=EXCLUDED.q3_target,q4_target=EXCLUDED.q4_target
        RETURNING id""",
        [user["id"], body["scheme_id"], body["fy"], body["annual_target"],
         body.get("q1_target", 0), body.get("q2_target", 0), body.get("q3_target", 0), body.get("q4_target", 0)])
    return {"id": row["id"]}


@router.put("/targets/{tid}/achievement")
async def update_achievement(tid: int, body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    await execute("""UPDATE sg_targets SET q1_achieved=COALESCE($1,q1_achieved),q2_achieved=COALESCE($2,q2_achieved),
        q3_achieved=COALESCE($3,q3_achieved),q4_achieved=COALESCE($4,q4_achieved) WHERE id=$5 AND state_user_id=$6""",
        [body.get("q1_achieved"), body.get("q2_achieved"), body.get("q3_achieved"), body.get("q4_achieved"), tid, user["id"]])
    return {"ok": True}


# ── Disbursements ─────────────────────────────────────────────────────────────
@router.get("/disbursements")
async def get_disbursements(user: dict = Depends(auth_required)):
    _state_only(user)
    rows = await query("""SELECT d.*,t.name as tp_name FROM sg_disbursements d
        LEFT JOIN sg_training_partners t ON t.id=d.tp_id
        WHERE d.state_user_id=$1 ORDER BY d.created_at DESC LIMIT 100""", [user["id"]])
    summary = await query("SELECT status, COALESCE(SUM(amount),0) total FROM sg_disbursements WHERE state_user_id=$1 GROUP BY status", [user["id"]])
    return {"disbursements": rows, "summary": summary}


@router.post("/disbursements", status_code=201)
async def add_disbursement(body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    if not body.get("amount"): raise HTTPException(400, detail="Amount is required")
    row = await execute_returning("""INSERT INTO sg_disbursements
        (state_user_id,tp_id,scheme,amount,tranche,fy,disbursed_date,reference_no,remarks,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING id""",
        [user["id"], body.get("tp_id"), body.get("scheme"), body["amount"], body.get("tranche"),
         body.get("fy"), body.get("disbursed_date"), body.get("reference_no"), body.get("remarks")])
    await log_audit(user, "Disbursement Initiated", "sg_disbursements", row["id"], f"₹{body['amount']}")
    return {"id": row["id"]}


@router.put("/disbursements/{did}/status")
async def update_disbursement(did: int, body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    await execute("UPDATE sg_disbursements SET status=$1 WHERE id=$2 AND state_user_id=$3", [body["status"], did, user["id"]])
    return {"ok": True}


# ── Grievances ────────────────────────────────────────────────────────────────
@router.get("/grievances")
async def get_grievances(status: str = None, user: dict = Depends(auth_required)):
    _state_only(user)
    sql, params = "SELECT * FROM sg_grievances WHERE state_user_id=$1", [user["id"]]
    if status: params.append(status); sql += f" AND status=${len(params)}"
    return await query(sql + " ORDER BY created_at DESC", params)


@router.post("/grievances", status_code=201)
async def add_grievance(body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    state_abbr = (user.get("state_name") or "ST")[:2].upper()
    ticket_no = f"GRV-{state_abbr}-{str(int(_time.time() * 1000))[-4:]}"
    row = await execute_returning("""INSERT INTO sg_grievances
        (state_user_id,ticket_no,filed_by,filer_type,category,district,description,priority)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id""",
        [user["id"], ticket_no, body.get("filed_by"), body.get("filer_type"),
         body.get("category"), body.get("district"), body.get("description"), body.get("priority", "medium")])
    return {"id": row["id"], "ticket_no": ticket_no}


@router.put("/grievances/{gid}")
async def update_grievance(gid: int, body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    from datetime import datetime
    resolved_at = datetime.utcnow().isoformat() if body.get("status") == "resolved" else None
    await execute("""UPDATE sg_grievances SET status=COALESCE($1,status),resolution=COALESCE($2,resolution),
        resolved_at=COALESCE($3,resolved_at) WHERE id=$4 AND state_user_id=$5""",
        [body.get("status"), body.get("resolution"), resolved_at, gid, user["id"]])
    await log_audit(user, "Grievance Updated", "sg_grievances", gid, body.get("status"))
    return {"ok": True}


# ── Certificates ──────────────────────────────────────────────────────────────
@router.get("/certificates")
async def get_certs(q: str = None, user: dict = Depends(auth_required)):
    _state_only(user)
    sql, params = "SELECT * FROM sg_certificates WHERE state_user_id=$1", [user["id"]]
    if q:
        params.extend([f"%{q}%", f"%{q}%"])
        sql += f" AND (cert_no ILIKE ${len(params)-1} OR candidate_name ILIKE ${len(params)})"
    return await query(sql + " ORDER BY created_at DESC LIMIT 100", params)


@router.post("/certificates/verify")
async def verify_cert(body: dict, user: dict = Depends(auth_required)):
    _state_only(user)
    cert = await query_one("SELECT * FROM sg_certificates WHERE cert_no=$1", [body.get("cert_no")])
    if not cert: raise HTTPException(404, detail="Certificate not found")
    return cert


# ── Notifications ─────────────────────────────────────────────────────────────
@router.get("/notifications")
async def get_notifications(user: dict = Depends(auth_required)):
    _state_only(user)
    return await query("SELECT * FROM sg_notifications WHERE state_user_id=$1 ORDER BY created_at DESC LIMIT 50", [user["id"]])


@router.put("/notifications/mark-read")
async def mark_read(user: dict = Depends(auth_required)):
    _state_only(user)
    await execute("UPDATE sg_notifications SET is_read=1 WHERE state_user_id=$1", [user["id"]])
    return {"ok": True}


# ── Schemes ───────────────────────────────────────────────────────────────────
@router.get("/schemes")
async def get_schemes(user: dict = Depends(auth_required)):
    _state_only(user)
    return await query("SELECT * FROM sg_schemes WHERE is_active=1 ORDER BY id")


# ── MIS ───────────────────────────────────────────────────────────────────────
@router.get("/mis")
async def mis(user: dict = Depends(auth_required)):
    _state_only(user)
    uid = user["id"]
    schemes = await query("SELECT * FROM sg_schemes WHERE is_active=1")
    result = []
    for s in schemes:
        enrolled  = int((await query_one("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND scheme=$2", [uid, s["code"]]) or {}).get("c") or 0)
        certified = int((await query_one("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND scheme=$2 AND certification_status='certified'", [uid, s["code"]]) or {}).get("c") or 0)
        placed    = int((await query_one("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND scheme=$2 AND placement_status='placed'", [uid, s["code"]]) or {}).get("c") or 0)
        disb_row  = await query_one("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=$1 AND scheme=$2 AND status='disbursed'", [uid, s["code"]])
        result.append({**s, "enrolled": enrolled, "certified": certified, "placed": placed,
                        "disbursed": float(disb_row["s"] or 0) if disb_row else 0,
                        "certRate": round(certified / enrolled * 100) if enrolled else 0})
    return result


# ── Profile ───────────────────────────────────────────────────────────────────
@router.get("/profile")
async def profile(user: dict = Depends(auth_required)):
    _state_only(user)
    u = await query_one("SELECT id,name,email,role,org_name,location,state_name,phone FROM users WHERE id=$1", [user["id"]])
    return u or {}
