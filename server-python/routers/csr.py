from fastapi import APIRouter, Depends
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role

router = APIRouter(prefix="/api/csr", tags=["csr"])
_auth = require_role("csr_org", "superadmin", "admin")


@router.get("/stats")
async def csr_stats(user: dict = Depends(_auth)):
    uid = user["id"]
    async def n(sql, p=None):
        row = await query_one(sql, p or [])
        if not row: return 0
        return int(row.get("c") or row.get("s") or 0)
    async def f(sql, p=None):
        row = await query_one(sql, p or [])
        return float(row.get("s") or row.get("avg") or 0) if row else 0.0

    return {
        "totalProjects":          await n("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=$1", [uid]),
        "activeProjects":         await n("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=$1 AND status='active'", [uid]),
        "completedProjects":      await n("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=$1 AND status='completed'", [uid]),
        "totalBeneficiaries":     await n("SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=$1", [uid]),
        "placedBeneficiaries":    await n("SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=$1 AND placement_status='placed'", [uid]),
        "certifiedBeneficiaries": await n("SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=$1 AND training_status='completed'", [uid]),
        "totalDisbursed":         await f("SELECT COALESCE(SUM(amount),0) s FROM csr_disbursements WHERE csr_user_id=$1 AND status='disbursed'", [uid]),
        "pendingDisbursements":   await n("SELECT COUNT(*) c FROM csr_disbursements WHERE csr_user_id=$1 AND status='pending'", [uid]),
        "totalPartners":          await n("SELECT COUNT(*) c FROM csr_training_partners WHERE csr_user_id=$1", [uid]),
        "activePartners":         await n("SELECT COUNT(*) c FROM csr_training_partners WHERE csr_user_id=$1 AND status='active'", [uid]),
        "totalBudget":            await f("SELECT COALESCE(SUM(budget),0) s FROM csr_projects WHERE csr_user_id=$1", [uid]),
        "totalSpent":             await f("SELECT COALESCE(SUM(spent),0) s FROM csr_projects WHERE csr_user_id=$1", [uid]),
    }


@router.get("/notifications")
async def csr_notifications(user: dict = Depends(_auth)):
    uid = user["id"]
    items = []
    rows = await query(
        "SELECT title, status, created_at FROM csr_projects WHERE csr_user_id=$1 ORDER BY created_at DESC LIMIT 5",
        [uid]
    )
    for r in rows:
        items.append({
            "type": "project",
            "title": f"Project '{r['title']}' — {r['status']}",
            "created_at": str(r.get("created_at", "")),
        })
    rows = await query(
        "SELECT amount, recipient, status, created_at FROM csr_disbursements WHERE csr_user_id=$1 ORDER BY created_at DESC LIMIT 5",
        [uid]
    )
    for r in rows:
        items.append({
            "type": "disbursement",
            "title": f"Disbursement ₹{r['amount']} to {r['recipient']} — {r['status']}",
            "created_at": str(r.get("created_at", "")),
        })
    pending_row = await query_one("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=$1 AND status='pending'", [uid])
    n_pend = int(pending_row.get("c") or 0) if pending_row else 0
    if n_pend > 0:
        items.append({"type": "alert", "title": f"{n_pend} project(s) awaiting approval", "created_at": ""})
    uf_row = await query_one("SELECT COUNT(*) c FROM csr_unspent_funds WHERE csr_user_id=$1 AND status='pending'", [uid])
    n_uf = int(uf_row.get("c") or 0) if uf_row else 0
    if n_uf > 0:
        items.append({"type": "warn", "title": f"{n_uf} unspent fund plan(s) need attention", "created_at": ""})
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


@router.get("/projects")
async def get_projects(user: dict = Depends(_auth)):
    return await query("SELECT * FROM csr_projects WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/projects", status_code=201)
async def create_project(body: dict, user: dict = Depends(_auth)):
    activity = body.get("activity") or body.get("schedule7")
    bene_target = body.get("beneficiaries_target") or body.get("target_beneficiaries") or 0
    row = await execute_returning(
        """INSERT INTO csr_projects
           (csr_user_id,title,activity,sub_sector,state_name,district,start_date,end_date,
            budget,beneficiaries_target,implementing_agency,status,
            objectives,target_states,own_contribution,other_sources,agency_type,mou_signed)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id""",
        [user["id"], body.get("title"), activity, body.get("sub_sector"),
         body.get("state_name"), body.get("district"), body.get("start_date"), body.get("end_date"),
         body.get("budget", 0), bene_target,
         body.get("implementing_agency"), body.get("status", "draft"),
         body.get("objectives"), body.get("target_states"),
         body.get("own_contribution", 0), body.get("other_sources", 0),
         body.get("agency_type"), body.get("mou_signed")],
    )
    return {"id": row["id"]}


@router.put("/projects/{pid}")
async def update_project(pid: int, body: dict, user: dict = Depends(_auth)):
    activity = body.get("activity") or body.get("schedule7")
    bene_target = body.get("beneficiaries_target") or body.get("target_beneficiaries")
    await execute(
        """UPDATE csr_projects SET title=$1,activity=$2,sub_sector=$3,state_name=$4,district=$5,
           start_date=$6,end_date=$7,budget=$8,spent=$9,beneficiaries_target=$10,
           beneficiaries_actual=$11,implementing_agency=$12,status=$13,
           objectives=$16,target_states=$17,own_contribution=$18,other_sources=$19,agency_type=$20,mou_signed=$21
           WHERE id=$14 AND csr_user_id=$15""",
        [body.get("title"), activity, body.get("sub_sector"), body.get("state_name"),
         body.get("district"), body.get("start_date"), body.get("end_date"),
         body.get("budget"), body.get("spent"), bene_target,
         body.get("beneficiaries_actual"), body.get("implementing_agency"), body.get("status"),
         pid, user["id"],
         body.get("objectives"), body.get("target_states"),
         body.get("own_contribution", 0), body.get("other_sources", 0),
         body.get("agency_type"), body.get("mou_signed")],
    )
    return {"ok": True}


@router.delete("/projects/{pid}")
async def delete_project(pid: int, user: dict = Depends(_auth)):
    await execute("DELETE FROM csr_projects WHERE id=$1 AND csr_user_id=$2", [pid, user["id"]])
    return {"ok": True}


@router.get("/beneficiaries")
async def get_beneficiaries(project_id: int = None, status: str = None, user: dict = Depends(_auth)):
    sql = "SELECT b.*, p.title project_title FROM csr_beneficiaries b LEFT JOIN csr_projects p ON p.id=b.project_id WHERE b.csr_user_id=$1"
    params = [user["id"]]
    if project_id: params.append(project_id); sql += f" AND b.project_id=${len(params)}"
    if status:     params.append(status);     sql += f" AND b.training_status=${len(params)}"
    sql += " ORDER BY b.created_at DESC"
    return await query(sql, params)


@router.post("/beneficiaries", status_code=201)
async def add_beneficiary(body: dict, user: dict = Depends(_auth)):
    name = body.get("name") or body.get("full_name")
    age = body.get("age")
    if not age and body.get("dob"):
        try:
            from datetime import date
            dob = date.fromisoformat(body["dob"])
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except Exception:
            age = None
    row = await execute_returning(
        """INSERT INTO csr_beneficiaries
           (csr_user_id,project_id,name,gender,age,district,state_name,course,batch_code,
            enroll_date,training_status,placement_status,dob,aadhaar,mobile,email,category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id""",
        [user["id"], body.get("project_id"), name, body.get("gender"),
         age, body.get("district"), body.get("state_name"), body.get("course"),
         body.get("batch_code"), body.get("enroll_date") or body.get("enrollment_date"),
         body.get("training_status", "enrolled"), body.get("placement_status", "not_placed"),
         body.get("dob"), body.get("aadhaar"), body.get("mobile"), body.get("email"),
         body.get("category")],
    )
    return {"id": row["id"]}


@router.put("/beneficiaries/{bid}")
async def update_beneficiary(bid: int, body: dict, user: dict = Depends(_auth)):
    await execute(
        "UPDATE csr_beneficiaries SET training_status=$1,placement_status=$2 WHERE id=$3 AND csr_user_id=$4",
        [body.get("training_status"), body.get("placement_status"), bid, user["id"]],
    )
    return {"ok": True}


@router.get("/disbursements")
async def get_disbursements(user: dict = Depends(_auth)):
    return await query(
        "SELECT d.*, p.title project_title FROM csr_disbursements d LEFT JOIN csr_projects p ON p.id=d.project_id WHERE d.csr_user_id=$1 ORDER BY d.created_at DESC",
        [user["id"]],
    )


@router.post("/disbursements", status_code=201)
async def add_disbursement(body: dict, user: dict = Depends(_auth)):
    disbursed_date = body.get("disbursed_date") or body.get("payment_date")
    row = await execute_returning(
        """INSERT INTO csr_disbursements
           (csr_user_id,project_id,amount,recipient,purpose,disbursed_date,reference_no,fy,status,mode)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id""",
        [user["id"], body.get("project_id"), body.get("amount"), body.get("recipient"),
         body.get("purpose"), disbursed_date, body.get("reference_no"),
         body.get("fy"), body.get("status", "pending"), body.get("mode")],
    )
    return {"id": row["id"]}


@router.get("/unspent-funds")
async def get_unspent_funds(user: dict = Depends(_auth)):
    return await query("SELECT * FROM csr_unspent_funds WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/unspent-funds", status_code=201)
async def create_unspent_fund(body: dict, user: dict = Depends(_auth)):
    row = await execute_returning(
        """INSERT INTO csr_unspent_funds
           (csr_user_id,financial_year,unspent_amount,reason,transfer_deadline,transfer_destination,remediation_plan,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id""",
        [user["id"], body.get("financial_year"), body.get("unspent_amount", 0),
         body.get("reason"), body.get("transfer_deadline"), body.get("transfer_destination"),
         body.get("remediation_plan"), body.get("status", "pending")],
    )
    return {"id": row["id"]}


@router.put("/unspent-funds/{uid}")
async def update_unspent_fund(uid: int, body: dict, user: dict = Depends(_auth)):
    await execute(
        """UPDATE csr_unspent_funds SET financial_year=$1,unspent_amount=$2,reason=$3,
           transfer_deadline=$4,transfer_destination=$5,remediation_plan=$6,status=$7
           WHERE id=$8 AND csr_user_id=$9""",
        [body.get("financial_year"), body.get("unspent_amount"), body.get("reason"),
         body.get("transfer_deadline"), body.get("transfer_destination"),
         body.get("remediation_plan"), body.get("status"), uid, user["id"]],
    )
    return {"ok": True}


@router.put("/disbursements/{did}/status")
async def update_disbursement_status(did: int, body: dict, user: dict = Depends(_auth)):
    await execute(
        "UPDATE csr_disbursements SET status=$1 WHERE id=$2 AND csr_user_id=$3",
        [body.get("status"), did, user["id"]],
    )
    return {"ok": True}


@router.get("/training-partners")
async def get_training_partners(user: dict = Depends(_auth)):
    for col, defn in [
        ("nsdc_reg", "TEXT"), ("contact_person", "TEXT"),
        ("num_trainers", "INTEGER DEFAULT 0"), ("max_batch_size", "INTEGER DEFAULT 30"),
    ]:
        try: await execute(f"ALTER TABLE csr_training_partners ADD COLUMN IF NOT EXISTS {col} {defn}")
        except Exception: pass
    return await query("SELECT * FROM csr_training_partners WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/training-partners", status_code=201)
async def add_training_partner(body: dict, user: dict = Depends(_auth)):
    for col, defn in [
        ("nsdc_reg", "TEXT"), ("contact_person", "TEXT"),
        ("num_trainers", "INTEGER DEFAULT 0"), ("max_batch_size", "INTEGER DEFAULT 30"),
    ]:
        try: await execute(f"ALTER TABLE csr_training_partners ADD COLUMN IF NOT EXISTS {col} {defn}")
        except Exception: pass
    row = await execute_returning(
        """INSERT INTO csr_training_partners
           (csr_user_id,name,type,state_name,district,contact_email,contact_mobile,mou_date,mou_expiry,status,nsdc_reg,contact_person,num_trainers,max_batch_size)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id""",
        [user["id"], body.get("name"), body.get("type"), body.get("state_name"), body.get("district"),
         body.get("contact_email") or body.get("email"), body.get("contact_mobile"),
         body.get("mou_date"), body.get("mou_expiry"), body.get("status", "active"),
         body.get("nsdc_reg"), body.get("contact_person"),
         int(body.get("num_trainers") or 0), int(body.get("max_batch_size") or 30)],
    )
    return {"id": row["id"]}


@router.put("/training-partners/{tid}")
async def update_training_partner(tid: int, body: dict, user: dict = Depends(_auth)):
    await execute(
        "UPDATE csr_training_partners SET status=$1,beneficiaries_trained=$2 WHERE id=$3 AND csr_user_id=$4",
        [body.get("status"), body.get("beneficiaries_trained"), tid, user["id"]],
    )
    return {"ok": True}


@router.delete("/training-partners/{tid}")
async def delete_training_partner(tid: int, user: dict = Depends(_auth)):
    await execute("DELETE FROM csr_training_partners WHERE id=$1 AND csr_user_id=$2", [tid, user["id"]])
    return {"ok": True}


# ── Helpdesk Tickets ─────────────────────────────────────────────────────────

async def _ensure_tickets_table():
    await execute("""CREATE TABLE IF NOT EXISTS csr_tickets (
        id SERIAL PRIMARY KEY,
        csr_user_id INTEGER NOT NULL,
        category TEXT,
        priority TEXT DEFAULT 'Medium',
        subject TEXT,
        description TEXT,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
    )""")


@router.get("/tickets")
async def get_tickets(user: dict = Depends(_auth)):
    await _ensure_tickets_table()
    return await query("SELECT * FROM csr_tickets WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/tickets", status_code=201)
async def create_ticket(body: dict, user: dict = Depends(_auth)):
    await _ensure_tickets_table()
    row = await execute_returning(
        """INSERT INTO csr_tickets (csr_user_id,category,priority,subject,description,status)
           VALUES ($1,$2,$3,$4,$5,'open') RETURNING id""",
        [user["id"], body.get("category"), body.get("priority", "Medium"),
         body.get("subject"), body.get("description")],
    )
    return {"id": row["id"]}


@router.put("/tickets/{tid}")
async def update_ticket(tid: int, body: dict, user: dict = Depends(_auth)):
    await execute(
        "UPDATE csr_tickets SET status=$1 WHERE id=$2 AND csr_user_id=$3",
        [body.get("status"), tid, user["id"]],
    )
    return {"ok": True}


# ── Grievances ───────────────────────────────────────────────────────────────

async def _ensure_grievances_table():
    await execute("""CREATE TABLE IF NOT EXISTS csr_grievances (
        id SERIAL PRIMARY KEY,
        csr_user_id INTEGER NOT NULL,
        type TEXT,
        against TEXT,
        description TEXT,
        status TEXT DEFAULT 'submitted',
        resolution TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")


@router.get("/grievances")
async def get_grievances(user: dict = Depends(_auth)):
    await _ensure_grievances_table()
    return await query("SELECT * FROM csr_grievances WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/grievances", status_code=201)
async def create_grievance(body: dict, user: dict = Depends(_auth)):
    await _ensure_grievances_table()
    row = await execute_returning(
        """INSERT INTO csr_grievances (csr_user_id,type,against,description,status)
           VALUES ($1,$2,$3,$4,'submitted') RETURNING id""",
        [user["id"], body.get("type"), body.get("against"), body.get("description")],
    )
    return {"id": row["id"]}


@router.put("/grievances/{gid}")
async def update_grievance(gid: int, body: dict, user: dict = Depends(_auth)):
    await execute(
        "UPDATE csr_grievances SET status=$1,resolution=$2 WHERE id=$3 AND csr_user_id=$4",
        [body.get("status"), body.get("resolution"), gid, user["id"]],
    )
    return {"ok": True}


# ── Audit Trail (user's own audit log entries) ───────────────────────────────

@router.get("/audit-trail")
async def csr_audit_trail(user: dict = Depends(_auth)):
    try:
        rows = await query(
            "SELECT * FROM audit_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",
            [user["id"]],
        )
        return rows
    except Exception:
        pass
    try:
        rows = await query(
            "SELECT * FROM user_audit_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",
            [user["id"]],
        )
        return rows
    except Exception:
        return []
