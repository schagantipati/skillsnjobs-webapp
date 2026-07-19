from fastapi import APIRouter, Depends
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role

router = APIRouter(prefix="/api/csr", tags=["csr"])
_auth = require_role("csr_org", "superadmin", "admin")


def _is_admin(user: dict) -> bool:
    return user.get("role") in ("admin", "superadmin", "administrator")


@router.get("/stats")
async def csr_stats(user: dict = Depends(_auth)):
    async def n(sql, p=None):
        row = await query_one(sql, p or [])
        if not row: return 0
        return int(row.get("c") or row.get("s") or 0)
    async def f(sql, p=None):
        row = await query_one(sql, p or [])
        return float(row.get("s") or row.get("avg") or 0) if row else 0.0

    if _is_admin(user):
        return {
            "totalProjects":          await n("SELECT COUNT(*) c FROM csr_projects"),
            "activeProjects":         await n("SELECT COUNT(*) c FROM csr_projects WHERE status='active'"),
            "completedProjects":      await n("SELECT COUNT(*) c FROM csr_projects WHERE status='completed'"),
            "totalBeneficiaries":     await n("SELECT COUNT(*) c FROM csr_beneficiaries"),
            "placedBeneficiaries":    await n("SELECT COUNT(*) c FROM csr_beneficiaries WHERE placement_status='placed'"),
            "certifiedBeneficiaries": await n("SELECT COUNT(*) c FROM csr_beneficiaries WHERE training_status='completed'"),
            "totalDisbursed":         await f("SELECT COALESCE(SUM(amount),0) s FROM csr_disbursements WHERE status='disbursed'"),
            "pendingDisbursements":   await n("SELECT COUNT(*) c FROM csr_disbursements WHERE status='pending'"),
            "totalPartners":          await n("SELECT COUNT(*) c FROM csr_training_partners"),
            "activePartners":         await n("SELECT COUNT(*) c FROM csr_training_partners WHERE status='active'"),
            "totalBudget":            await f("SELECT COALESCE(SUM(budget),0) s FROM csr_projects"),
            "totalSpent":             await f("SELECT COALESCE(SUM(spent),0) s FROM csr_projects"),
            "totalFunds":             await f("SELECT COALESCE(SUM(budget),0) s FROM csr_projects"),
        }

    uid = user["id"]
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
        "totalFunds":             await f("SELECT COALESCE(SUM(budget),0) s FROM csr_projects WHERE csr_user_id=$1", [uid]),
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
    if _is_admin(user):
        return await query(
            "SELECT p.*, u.org_name FROM csr_projects p LEFT JOIN users u ON u.id=p.csr_user_id ORDER BY p.created_at DESC",
            [],
        )
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
    if _is_admin(user):
        return await query(
            """SELECT b.*, p.title project_title, u.org_name
               FROM csr_beneficiaries b
               LEFT JOIN csr_projects p ON p.id=b.project_id
               LEFT JOIN users u ON u.id=b.csr_user_id
               ORDER BY b.created_at DESC""",
            [],
        )
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
    if _is_admin(user):
        return await query(
            """SELECT d.*, p.title project_title, u.org_name
               FROM csr_disbursements d
               LEFT JOIN csr_projects p ON p.id=d.project_id
               LEFT JOIN users u ON u.id=d.csr_user_id
               ORDER BY d.created_at DESC""",
            [],
        )
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
    if _is_admin(user):
        return await query(
            """SELECT uf.*, u.org_name FROM csr_unspent_funds uf
               LEFT JOIN users u ON u.id=uf.csr_user_id
               ORDER BY uf.created_at DESC""",
            [],
        )
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


# ── Admin: CSR Orgs Summary ──────────────────────────────────────────────────

@router.get("/admin/orgs-summary")
async def csr_admin_orgs_summary(user: dict = Depends(_auth)):
    """Return per-org CSR statistics for Superadmin CSR Management panel."""
    if not _is_admin(user):
        return []
    return await query("""
        SELECT
            u.id, u.org_name AS name, u.email, u.phone, u.location,
            (SELECT COUNT(*) FROM csr_projects p WHERE p.csr_user_id=u.id) AS total_projects,
            (SELECT COUNT(*) FROM csr_projects p WHERE p.csr_user_id=u.id AND p.status='active') AS active_projects,
            (SELECT COALESCE(SUM(budget),0) FROM csr_projects p WHERE p.csr_user_id=u.id) AS total_budget,
            (SELECT COALESCE(SUM(spent),0) FROM csr_projects p WHERE p.csr_user_id=u.id) AS total_spent,
            (SELECT COUNT(*) FROM csr_beneficiaries b WHERE b.csr_user_id=u.id) AS total_beneficiaries,
            (SELECT COUNT(*) FROM csr_beneficiaries b WHERE b.csr_user_id=u.id AND b.placement_status='placed') AS placed_beneficiaries,
            (SELECT COUNT(*) FROM csr_disbursements d WHERE d.csr_user_id=u.id AND d.status='disbursed') AS disbursements_count,
            (SELECT COALESCE(SUM(amount),0) FROM csr_disbursements d WHERE d.csr_user_id=u.id AND d.status='disbursed') AS total_disbursed
        FROM users u
        WHERE u.role = 'csr_org'
        ORDER BY u.org_name
    """, [])


# ── Training Vendor List (system-registered vendors) ─────────────────────────

@router.get("/vendor-list")
async def get_vendor_list(user: dict = Depends(_auth)):
    """Return all registered Training Vendors with aggregated stats for CSR empanelment view."""
    vendors = await query("""
        SELECT
            u.id, u.org_name AS name, u.email, u.phone, u.location,
            u.bio, u.created_at,
            (SELECT COUNT(*) FROM vendor_trainers vt WHERE vt.vendor_id=u.id AND vt.status='active') AS num_trainers,
            (SELECT COUNT(*) FROM vendor_candidates vc WHERE vc.vendor_id=u.id AND vc.status='active') AS beneficiaries_trained,
            (SELECT COUNT(*) FROM vendor_courses vco WHERE vco.vendor_id=u.id AND COALESCE(vco.status,'active')='active') AS num_courses,
            (SELECT COUNT(*) FROM vendor_centres vcen WHERE vcen.vendor_id=u.id AND vcen.status!='deleted') AS num_centres,
            (SELECT vcen.state_name FROM vendor_centres vcen WHERE vcen.vendor_id=u.id AND vcen.status!='deleted' ORDER BY vcen.created_at LIMIT 1) AS state_name,
            (SELECT vcen.district FROM vendor_centres vcen WHERE vcen.vendor_id=u.id AND vcen.status!='deleted' ORDER BY vcen.created_at LIMIT 1) AS district,
            (SELECT vcen.city FROM vendor_centres vcen WHERE vcen.vendor_id=u.id AND vcen.status!='deleted' ORDER BY vcen.created_at LIMIT 1) AS city,
            (SELECT STRING_AGG(DISTINCT vco.title, ', ' ORDER BY vco.title) FROM vendor_courses vco
             WHERE vco.vendor_id=u.id AND COALESCE(vco.status,'active')='active' LIMIT 3) AS courses_offered
        FROM users u
        WHERE u.role = 'training_vendor'
        ORDER BY u.org_name
    """, [])
    result = []
    for v in vendors:
        result.append({
            "id":                  v["id"],
            "name":                v["name"] or "—",
            "email":               v["email"] or "—",
            "phone":               v["phone"] or "—",
            "location":            v["location"] or "—",
            "bio":                 v["bio"] or "",
            "type":                "Training Vendor",
            "status":              "active",
            "state_name":          v["state_name"] or "—",
            "district":            v["district"] or "—",
            "city":                v["city"] or "—",
            "num_trainers":        int(v["num_trainers"] or 0),
            "beneficiaries_trained": int(v["beneficiaries_trained"] or 0),
            "num_courses":         int(v["num_courses"] or 0),
            "num_centres":         int(v["num_centres"] or 0),
            "courses_offered":     v["courses_offered"] or "—",
            "created_at":          str(v["created_at"]) if v["created_at"] else "",
        })
    return result


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


# ── CSR Campaigns ─────────────────────────────────────────────────────────────

@router.get("/campaigns")
async def get_campaigns(user: dict = Depends(_auth)):
    if _is_admin(user):
        return await query("SELECT c.*, u.org_name FROM csr_campaigns c LEFT JOIN users u ON u.id=c.csr_user_id ORDER BY c.created_at DESC", [])
    return await query("SELECT * FROM csr_campaigns WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])

@router.post("/campaigns")
async def create_campaign(body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        """INSERT INTO csr_campaigns (csr_user_id,title,theme,description,total_budget,financial_year,target_states,open_date,close_date,eligibility_criteria,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *""",
        [user["id"], body.get("title"), body.get("theme","Skill Development"), body.get("description"),
         int(body.get("total_budget",0)), body.get("financial_year"), body.get("target_states"),
         body.get("open_date"), body.get("close_date"), body.get("eligibility_criteria"), body.get("status","draft")]
    )

@router.put("/campaigns/{cid}")
async def update_campaign(cid: int, body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        """UPDATE csr_campaigns SET title=$1,theme=$2,description=$3,total_budget=$4,financial_year=$5,
           target_states=$6,open_date=$7,close_date=$8,eligibility_criteria=$9,status=$10
           WHERE id=$11 AND csr_user_id=$12 RETURNING *""",
        [body.get("title"), body.get("theme"), body.get("description"), int(body.get("total_budget",0)),
         body.get("financial_year"), body.get("target_states"), body.get("open_date"), body.get("close_date"),
         body.get("eligibility_criteria"), body.get("status","draft"), cid, user["id"]]
    )

@router.delete("/campaigns/{cid}")
async def delete_campaign(cid: int, user: dict = Depends(_auth)):
    await execute("DELETE FROM csr_campaigns WHERE id=$1 AND csr_user_id=$2", [cid, user["id"]])
    return {"ok": True}


# ── CSR Applications (NGO proposals received against campaigns) ───────────────

@router.get("/applications")
async def get_applications(user: dict = Depends(_auth)):
    if _is_admin(user):
        return await query("SELECT a.*, c.title AS campaign_title FROM csr_applications a LEFT JOIN csr_campaigns c ON c.id=a.campaign_id ORDER BY a.submitted_at DESC", [])
    return await query(
        "SELECT a.*, c.title AS campaign_title FROM csr_applications a LEFT JOIN csr_campaigns c ON c.id=a.campaign_id WHERE a.csr_user_id=$1 ORDER BY a.submitted_at DESC",
        [user["id"]]
    )

@router.post("/applications")
async def create_application(body: dict, user: dict = Depends(_auth)):
    import random
    ai_score = random.randint(45, 95)
    return await execute_returning(
        """INSERT INTO csr_applications (campaign_id,csr_user_id,org_name,reg_no,contact_person,email,phone,proposed_budget,project_title,proposal_summary,target_beneficiaries,target_states,ai_score,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'submitted') RETURNING *""",
        [body.get("campaign_id"), user["id"], body.get("org_name"), body.get("reg_no"), body.get("contact_person"),
         body.get("email"), body.get("phone"), int(body.get("proposed_budget",0)), body.get("project_title"),
         body.get("proposal_summary"), int(body.get("target_beneficiaries",0)), body.get("target_states"), ai_score]
    )

@router.put("/applications/{aid}/status")
async def update_application_status(aid: int, body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        "UPDATE csr_applications SET status=$1,rejection_reason=$2,reviewed_at=NOW(),reviewed_by=$3 WHERE id=$4 AND csr_user_id=$5 RETURNING *",
        [body.get("status"), body.get("rejection_reason"), user["id"], aid, user["id"]]
    )


# ── CSR Approvals (multi-stage committee workflow) ────────────────────────────

@router.get("/approvals/{aid}")
async def get_approvals(aid: int, user: dict = Depends(_auth)):
    return await query("SELECT * FROM csr_approvals WHERE application_id=$1 ORDER BY created_at", [aid])

@router.post("/approvals")
async def create_approval(body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        "INSERT INTO csr_approvals (application_id,stage,reviewer_id,decision,remarks,decided_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
        [body.get("application_id"), body.get("stage"), user["id"], body.get("decision","pending"), body.get("remarks")]
    )

@router.put("/approvals/{apid}")
async def update_approval(apid: int, body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        "UPDATE csr_approvals SET decision=$1,remarks=$2,decided_at=NOW() WHERE id=$3 RETURNING *",
        [body.get("decision"), body.get("remarks"), apid]
    )


# ── CSR Progress Reports ──────────────────────────────────────────────────────

@router.get("/progress-reports")
async def get_progress_reports(user: dict = Depends(_auth)):
    if _is_admin(user):
        return await query("SELECT r.*, p.title AS project_title, u.org_name FROM csr_progress_reports r LEFT JOIN csr_projects p ON p.id=r.project_id LEFT JOIN users u ON u.id=r.csr_user_id ORDER BY r.submitted_at DESC", [])
    return await query(
        "SELECT r.*, p.title AS project_title FROM csr_progress_reports r LEFT JOIN csr_projects p ON p.id=r.project_id WHERE r.csr_user_id=$1 ORDER BY r.submitted_at DESC",
        [user["id"]]
    )

@router.post("/progress-reports")
async def create_progress_report(body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        """INSERT INTO csr_progress_reports (project_id,csr_user_id,report_month,bene_count,spend_amount,train_pct,issues,highlights,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'submitted') RETURNING *""",
        [body.get("project_id"), user["id"], body.get("report_month"), int(body.get("bene_count",0)),
         int(body.get("spend_amount",0)), int(body.get("train_pct",0)), body.get("issues"), body.get("highlights")]
    )

@router.put("/progress-reports/{rid}/acknowledge")
async def acknowledge_progress_report(rid: int, user: dict = Depends(_auth)):
    return await execute_returning(
        "UPDATE csr_progress_reports SET status='acknowledged',acknowledged_by=$1,ack_at=NOW() WHERE id=$2 AND csr_user_id=$3 RETURNING *",
        [user["id"], rid, user["id"]]
    )


# ── CSR Field Audits ──────────────────────────────────────────────────────────

@router.get("/field-audits")
async def get_field_audits(user: dict = Depends(_auth)):
    if _is_admin(user):
        return await query("SELECT a.*, p.title AS project_title, u.org_name FROM csr_field_audits a LEFT JOIN csr_projects p ON p.id=a.project_id LEFT JOIN users u ON u.id=a.csr_user_id ORDER BY a.created_at DESC", [])
    return await query(
        "SELECT a.*, p.title AS project_title FROM csr_field_audits a LEFT JOIN csr_projects p ON p.id=a.project_id WHERE a.csr_user_id=$1 ORDER BY a.created_at DESC",
        [user["id"]]
    )

@router.post("/field-audits")
async def create_field_audit(body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        """INSERT INTO csr_field_audits (project_id,csr_user_id,auditor_name,visit_date,location,bene_verified,funds_verified,compliance_score,findings,recommendations,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *""",
        [body.get("project_id"), user["id"], body.get("auditor_name"), body.get("visit_date"), body.get("location"),
         int(body.get("bene_verified",0)), int(body.get("funds_verified",0)), int(body.get("compliance_score",0)),
         body.get("findings"), body.get("recommendations"), body.get("status","scheduled")]
    )

@router.put("/field-audits/{aid}")
async def update_field_audit(aid: int, body: dict, user: dict = Depends(_auth)):
    return await execute_returning(
        """UPDATE csr_field_audits SET auditor_name=$1,visit_date=$2,location=$3,bene_verified=$4,funds_verified=$5,
           compliance_score=$6,findings=$7,recommendations=$8,status=$9 WHERE id=$10 AND csr_user_id=$11 RETURNING *""",
        [body.get("auditor_name"), body.get("visit_date"), body.get("location"), int(body.get("bene_verified",0)),
         int(body.get("funds_verified",0)), int(body.get("compliance_score",0)), body.get("findings"),
         body.get("recommendations"), body.get("status","scheduled"), aid, user["id"]]
    )

# ── CSR Forms (CSR-1, CSR-2, etc.) ──────────────────────────────────────────

@router.get("/forms/{form_type}")
async def get_form(form_type: str, fy: str = "2025-26", user: dict = Depends(_auth)):
    row = await query_one(
        "SELECT * FROM csr_forms WHERE csr_user_id=$1 AND form_type=$2 AND financial_year=$3",
        [user["id"], form_type, fy]
    )
    return row or {}

@router.post("/forms/{form_type}")
async def save_form(form_type: str, body: dict, user: dict = Depends(_auth)):
    import json as _json
    fy = body.get("financial_year", "2025-26")
    data = body.get("data", {})
    status = body.get("status", "draft")
    submitted_at = "NOW()" if status == "submitted" else None
    existing = await query_one(
        "SELECT id FROM csr_forms WHERE csr_user_id=$1 AND form_type=$2 AND financial_year=$3",
        [user["id"], form_type, fy]
    )
    if existing:
        return await execute_returning(
            """UPDATE csr_forms SET data=$1, status=$2, updated_at=NOW(),
               submitted_at=CASE WHEN $3='submitted' THEN NOW() ELSE submitted_at END
               WHERE id=$4 RETURNING *""",
            [_json.dumps(data), status, status, existing["id"]]
        )
    return await execute_returning(
        """INSERT INTO csr_forms (csr_user_id, form_type, financial_year, data, status,
           submitted_at) VALUES ($1,$2,$3,$4,$5, CASE WHEN $6='submitted' THEN NOW() ELSE NULL END) RETURNING *""",
        [user["id"], form_type, fy, _json.dumps(data), status, status]
    )
