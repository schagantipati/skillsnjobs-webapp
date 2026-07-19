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


@router.get("/projects")
async def get_projects(user: dict = Depends(_auth)):
    return await query("SELECT * FROM csr_projects WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/projects", status_code=201)
async def create_project(body: dict, user: dict = Depends(_auth)):
    # Accept both "activity" and "schedule7" (legacy frontend key)
    activity = body.get("activity") or body.get("schedule7")
    # Accept both "beneficiaries_target" and "target_beneficiaries" (legacy frontend key)
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
    # Accept both "name" and "full_name" (frontend sends full_name)
    name = body.get("name") or body.get("full_name")
    # Derive age from dob if age not provided
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
    # Accept both "disbursed_date" and "payment_date" (frontend sends payment_date)
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
    return await query("SELECT * FROM csr_training_partners WHERE csr_user_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/training-partners", status_code=201)
async def add_training_partner(body: dict, user: dict = Depends(_auth)):
    row = await execute_returning(
        """INSERT INTO csr_training_partners
           (csr_user_id,name,type,state_name,district,contact_email,contact_mobile,mou_date,mou_expiry,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id""",
        [user["id"], body.get("name"), body.get("type"), body.get("state_name"), body.get("district"),
         body.get("contact_email"), body.get("contact_mobile"), body.get("mou_date"),
         body.get("mou_expiry"), body.get("status", "active")],
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
