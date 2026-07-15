import json
import time as _time
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one, execute, execute_returning, log_audit
from auth import auth_required

router = APIRouter(prefix="/api/vendor", tags=["vendor"])


def _vendor_only(user: dict):
    if user["role"] != "training_vendor":
        raise HTTPException(403, detail="Training vendor only")


# ── Stats ─────────────────────────────────────────────────────────────────────
@router.get("/stats")
async def vendor_stats(user: dict = Depends(auth_required)):
    _vendor_only(user)
    vid = user["id"]
    async def n(sql, p): row = await query_one(sql, p); return int(row["c"] or 0) if row else 0
    return {
        "centres":      await n("SELECT COUNT(*) c FROM vendor_centres WHERE vendor_id=$1 AND status!='deleted'", [vid]),
        "trainers":     await n("SELECT COUNT(*) c FROM vendor_trainers WHERE vendor_id=$1 AND status='active'", [vid]),
        "batches":      await n("SELECT COUNT(*) c FROM batches WHERE vendor_id=$1 AND status IN ('active','upcoming')", [vid]),
        "candidates":   await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND status='active'", [vid]),
        "docs_pending": await n("SELECT COUNT(*) c FROM vendor_documents WHERE vendor_id=$1 AND status='expiring'", [vid]),
        "tickets_open": await n("SELECT COUNT(*) c FROM vendor_grievances WHERE vendor_id=$1 AND status='open'", [vid]),
    }


# ── Centres ───────────────────────────────────────────────────────────────────
@router.get("/centres/onboarding")
async def centres_onboarding(user: dict = Depends(auth_required)):
    _vendor_only(user)
    u = await query_one("SELECT vendor_profile FROM users WHERE id=$1", [user["id"]])
    vp = u.get("vendor_profile") if u else None
    if isinstance(vp, str):
        try: vp = json.loads(vp)
        except Exception: vp = {}
    step6_centres = (vp or {}).get("step6", {}).get("centres") or []
    imported = await query("SELECT step6_idx FROM vendor_centres WHERE vendor_id=$1 AND step6_idx IS NOT NULL AND status!='deleted'", [user["id"]])
    imported_idxs = {r["step6_idx"] for r in imported}
    return [{**c, "_idx": i, "_imported": i in imported_idxs} for i, c in enumerate(step6_centres)]


@router.get("/centres")
async def get_centres(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("SELECT * FROM vendor_centres WHERE vendor_id=$1 AND status!='deleted' ORDER BY created_at DESC", [user["id"]])


@router.post("/centres", status_code=201)
async def add_centre(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    name = body.get("name")
    if not name: raise HTTPException(400, detail="Centre name required")
    dup = await query_one("SELECT id FROM vendor_centres WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted'", [user["id"], name])
    if dup: raise HTTPException(409, detail={"error": f'A training centre named "{name.strip()}" already exists.', "field": "name"})
    row = await execute_returning("""INSERT INTO vendor_centres
        (vendor_id,name,address,state_name,district,city,pincode,geo,classrooms,labs,
         seating_capacity,internet,power_backup,accessibility,equipment,
         centre_code,centre_type,centre_status,ownership,year_started,area_sqft,step6_idx)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id""",
        [user["id"], name, body.get("address"), body.get("state_name"), body.get("district"), body.get("city"), body.get("pincode"), body.get("geo"),
         body.get("classrooms", 0), body.get("labs", 0), body.get("seating_capacity", 0),
         body.get("internet"), body.get("power_backup"), body.get("accessibility"), body.get("equipment"),
         body.get("centre_code"), body.get("centre_type"), body.get("centre_status"), body.get("ownership"),
         body.get("year_started"), body.get("area_sqft"),
         body["step6_idx"] if "step6_idx" in body and body["step6_idx"] is not None else None])
    await log_audit(user, "centre_created", "vendor_centre", row["id"] if row else None)
    return {"id": row["id"]}


@router.put("/centres/{cid}")
async def update_centre(cid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    name = body.get("name")
    if name:
        dup = await query_one("SELECT id FROM vendor_centres WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted' AND id!=$3", [user["id"], name, cid])
        if dup: raise HTTPException(409, detail={"error": f'A training centre named "{name.strip()}" already exists.', "field": "name"})
    await execute("""UPDATE vendor_centres SET
        name=COALESCE($1,name),address=COALESCE($2,address),state_name=COALESCE($3,state_name),
        district=COALESCE($4,district),city=COALESCE($5,city),pincode=COALESCE($6,pincode),
        geo=COALESCE($7,geo),classrooms=COALESCE($8,classrooms),labs=COALESCE($9,labs),
        seating_capacity=COALESCE($10,seating_capacity),internet=COALESCE($11,internet),
        power_backup=COALESCE($12,power_backup),accessibility=COALESCE($13,accessibility),
        equipment=COALESCE($14,equipment),status=COALESCE($15,status),
        centre_code=COALESCE($16,centre_code),centre_type=COALESCE($17,centre_type),
        centre_status=COALESCE($18,centre_status),ownership=COALESCE($19,ownership),
        year_started=COALESCE($20,year_started),area_sqft=COALESCE($21,area_sqft)
        WHERE id=$22 AND vendor_id=$23""",
        [name, body.get("address"), body.get("state_name"), body.get("district"), body.get("city"), body.get("pincode"), body.get("geo"),
         body.get("classrooms"), body.get("labs"), body.get("seating_capacity"), body.get("internet"), body.get("power_backup"),
         body.get("accessibility"), body.get("equipment"), body.get("status"),
         body.get("centre_code"), body.get("centre_type"), body.get("centre_status"), body.get("ownership"),
         body.get("year_started"), body.get("area_sqft"), cid, user["id"]])
    return {"ok": True}


@router.delete("/centres/{cid}")
async def delete_centre(cid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("UPDATE vendor_centres SET status='deleted' WHERE id=$1 AND vendor_id=$2", [cid, user["id"]])
    return {"ok": True}


# ── Trainers ──────────────────────────────────────────────────────────────────
@router.get("/trainers/lookup")
async def lookup_trainer(email: str, user: dict = Depends(auth_required)):
    _vendor_only(user)
    if not email: raise HTTPException(400, detail="email required")
    u = await query_one("SELECT id,name,email,phone,gender,dob,category,pan,preferred_sector,qualification FROM users WHERE LOWER(email)=LOWER($1) AND role='trainer'", [email])
    if not u: raise HTTPException(404, detail="No registered trainer found with this email.")
    return u


@router.get("/trainers")
async def get_trainers(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("""SELECT t.*,c.name AS centre_name,u.name AS linked_name,u.email AS linked_email,
        u.phone AS linked_phone,u.gender AS linked_gender,u.dob AS linked_dob,u.category AS linked_category,
        u.pan AS linked_pan,u.preferred_sector AS linked_sector,u.qualification AS linked_qualification
        FROM vendor_trainers t
        LEFT JOIN vendor_centres c ON c.id=t.centre_id
        LEFT JOIN users u ON u.id=t.user_id
        WHERE t.vendor_id=$1 AND t.status!='deleted' ORDER BY t.created_at DESC""", [user["id"]])


@router.post("/trainers", status_code=201)
async def add_trainer(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    name = body.get("name")
    if not name: raise HTTPException(400, detail="Trainer name required")
    dup = await query_one("SELECT id FROM vendor_trainers WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted'", [user["id"], name])
    if dup: raise HTTPException(409, detail={"error": f'A trainer named "{name.strip()}" already exists.', "field": "name"})
    resolved_uid = body.get("user_id")
    if not resolved_uid and body.get("email"):
        u = await query_one("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='trainer'", [body["email"]])
        if u: resolved_uid = u["id"]
    row = await execute_returning("""INSERT INTO vendor_trainers
        (vendor_id,centre_id,name,email,mobile,qualification,sector,experience_years,nsqf_level,dob,gender,category,aadhaar,pan,user_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id""",
        [user["id"], body.get("centre_id"), name, body.get("email"), body.get("mobile"), body.get("qualification"),
         body.get("sector"), body.get("experience_years", 0), body.get("nsqf_level"),
         body.get("dob"), body.get("gender"), body.get("category"), body.get("aadhaar"), body.get("pan"), resolved_uid])
    return {"id": row["id"]}


@router.put("/trainers/{tid}")
async def update_trainer(tid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    name = body.get("name")
    if name:
        dup = await query_one("SELECT id FROM vendor_trainers WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted' AND id!=$3", [user["id"], name, tid])
        if dup: raise HTTPException(409, detail={"error": f'A trainer named "{name.strip()}" already exists.', "field": "name"})
    resolved_uid = body.get("user_id") if "user_id" in body else None
    if resolved_uid is None and body.get("email"):
        existing = await query_one("SELECT user_id FROM vendor_trainers WHERE id=$1", [tid])
        if not (existing and existing.get("user_id")):
            u = await query_one("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='trainer'", [body["email"]])
            if u: resolved_uid = u["id"]
    await execute("""UPDATE vendor_trainers SET
        name=COALESCE($1,name),email=COALESCE($2,email),mobile=COALESCE($3,mobile),
        qualification=COALESCE($4,qualification),sector=COALESCE($5,sector),
        experience_years=COALESCE($6,experience_years),nsqf_level=COALESCE($7,nsqf_level),
        centre_id=COALESCE($8,centre_id),status=COALESCE($9,status),
        dob=COALESCE($10,dob),gender=COALESCE($11,gender),category=COALESCE($12,category),
        aadhaar=COALESCE($13,aadhaar),pan=COALESCE($14,pan),
        user_id=COALESCE($15::integer,user_id) WHERE id=$16 AND vendor_id=$17""",
        [name, body.get("email"), body.get("mobile"), body.get("qualification"), body.get("sector"),
         body.get("experience_years"), body.get("nsqf_level"), body.get("centre_id"), body.get("status"),
         body.get("dob"), body.get("gender"), body.get("category"), body.get("aadhaar"), body.get("pan"),
         resolved_uid, tid, user["id"]])
    return {"ok": True}


@router.delete("/trainers/{tid}")
async def delete_trainer(tid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("UPDATE vendor_trainers SET status='deleted' WHERE id=$1 AND vendor_id=$2", [tid, user["id"]])
    return {"ok": True}


# ── Courses ───────────────────────────────────────────────────────────────────
@router.get("/courses")
async def get_vendor_courses(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("SELECT * FROM vendor_courses WHERE vendor_id=$1 AND status!='deleted' ORDER BY created_at DESC", [user["id"]])


@router.post("/courses", status_code=201)
async def add_vendor_course(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    title = body.get("title")
    if not title: raise HTTPException(400, detail="Course title required")
    dup = await query_one("SELECT id FROM vendor_courses WHERE vendor_id=$1 AND LOWER(TRIM(title))=LOWER(TRIM($2)) AND status!='deleted'", [user["id"], title])
    if dup: raise HTTPException(409, detail={"error": f'A course titled "{title.strip()}" already exists.', "field": "title"})
    row = await execute_returning("""INSERT INTO vendor_courses
        (vendor_id,title,sector,qp_code,nos_code,nsqf_level,duration_hours,fee_type,fee_amount,scheme)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id""",
        [user["id"], title, body.get("sector"), body.get("qp_code"), body.get("nos_code"), body.get("nsqf_level"),
         body.get("duration_hours", 0), body.get("fee_type", "fee-based"), body.get("fee_amount", 0), body.get("scheme")])
    return {"id": row["id"]}


@router.put("/courses/{cid}")
async def update_vendor_course(cid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    title = body.get("title")
    if title:
        dup = await query_one("SELECT id FROM vendor_courses WHERE vendor_id=$1 AND LOWER(TRIM(title))=LOWER(TRIM($2)) AND status!='deleted' AND id!=$3", [user["id"], title, cid])
        if dup: raise HTTPException(409, detail={"error": f'A course titled "{title.strip()}" already exists.', "field": "title"})
    await execute("""UPDATE vendor_courses SET title=$1,sector=$2,qp_code=$3,nos_code=$4,nsqf_level=$5,
        duration_hours=$6,fee_type=$7,fee_amount=$8,scheme=$9,status=COALESCE($10,status) WHERE id=$11 AND vendor_id=$12""",
        [title, body.get("sector"), body.get("qp_code"), body.get("nos_code"), body.get("nsqf_level"),
         body.get("duration_hours", 0), body.get("fee_type"), body.get("fee_amount", 0),
         body.get("scheme"), body.get("status"), cid, user["id"]])
    return {"ok": True}


@router.delete("/courses/{cid}")
async def delete_vendor_course(cid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("UPDATE vendor_courses SET status='deleted' WHERE id=$1 AND vendor_id=$2", [cid, user["id"]])
    return {"ok": True}


# ── Batches ───────────────────────────────────────────────────────────────────
@router.get("/batches")
async def get_vendor_batches(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("""SELECT b.*,vc.name AS centre_name,vco.title AS course_title,t.name AS trainer_name
        FROM batches b
        LEFT JOIN vendor_centres vc ON vc.id=b.centre_id
        LEFT JOIN vendor_courses vco ON vco.id=b.vendor_course_id
        LEFT JOIN vendor_trainers t ON t.id=b.vendor_trainer_id
        WHERE b.vendor_id=$1 AND COALESCE(b.status,'upcoming')!='cancelled'
        ORDER BY b.created_at DESC""", [user["id"]])


@router.post("/batches", status_code=201)
async def add_vendor_batch(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    code = body.get("batch_code") or f"BT-{str(int(_time.time() * 1000))[-6:]}"
    dup = await query_one("SELECT id FROM batches WHERE vendor_id=$1 AND LOWER(TRIM(batch_code))=LOWER(TRIM($2))", [user["id"], code])
    if dup: raise HTTPException(409, detail={"error": f'A batch with code "{code.strip()}" already exists.', "field": "batch_code"})
    row = await execute_returning("""INSERT INTO batches
        (vendor_id,centre_id,vendor_course_id,batch_code,start_date,end_date,capacity,vendor_trainer_id,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id""",
        [user["id"], body.get("centre_id"), body.get("course_id"), code,
         body.get("start_date"), body.get("end_date"), body.get("capacity", 30), body.get("trainer_id"), "upcoming"])
    return {"id": row["id"], "batch_code": code}


@router.put("/batches/{bid}")
async def update_vendor_batch(bid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    batch_code = body.get("batch_code")
    if batch_code:
        dup = await query_one("SELECT id FROM batches WHERE vendor_id=$1 AND LOWER(TRIM(batch_code))=LOWER(TRIM($2)) AND id!=$3", [user["id"], batch_code, bid])
        if dup: raise HTTPException(409, detail={"error": f'A batch with code "{batch_code.strip()}" already exists.', "field": "batch_code"})
    await execute("""UPDATE batches SET centre_id=$1,vendor_course_id=$2,batch_code=$3,start_date=$4,end_date=$5,
        capacity=$6,vendor_trainer_id=$7,status=COALESCE($8,status) WHERE id=$9 AND vendor_id=$10""",
        [body.get("centre_id"), body.get("course_id"), batch_code, body.get("start_date"), body.get("end_date"),
         body.get("capacity", 30), body.get("trainer_id"), body.get("status"), bid, user["id"]])
    return {"ok": True}


@router.delete("/batches/{bid}")
async def delete_vendor_batch(bid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("UPDATE batches SET status='cancelled' WHERE id=$1 AND vendor_id=$2", [bid, user["id"]])
    return {"ok": True}


# ── Candidates ────────────────────────────────────────────────────────────────
@router.get("/candidates")
async def get_vendor_candidates(batch_id: int = None, user: dict = Depends(auth_required)):
    _vendor_only(user)
    sql = """SELECT vc.*,b.batch_code,vco.title AS course_title
        FROM vendor_candidates vc
        LEFT JOIN batches b ON b.id=vc.unified_batch_id
        LEFT JOIN vendor_courses vco ON vco.id=b.vendor_course_id
        WHERE vc.vendor_id=$1"""
    params = [user["id"]]
    if batch_id: params.append(batch_id); sql += f" AND vc.unified_batch_id=${len(params)}"
    sql += " ORDER BY vc.created_at DESC"
    return await query(sql, params)


@router.post("/candidates", status_code=201)
async def add_vendor_candidate(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    if not body.get("name"): raise HTTPException(400, detail="Candidate name required")
    uid = None
    if body.get("email"):
        u = await query_one("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='candidate'", [body["email"]])
        if u: uid = u["id"]
    if not uid and body.get("mobile"):
        u = await query_one("SELECT id FROM users WHERE phone=$1 AND role='candidate'", [body["mobile"]])
        if u: uid = u["id"]
    row = await execute_returning("""INSERT INTO vendor_candidates
        (vendor_id,unified_batch_id,user_id,name,mobile,aadhaar_masked,dob,gender,category,scheme)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id""",
        [user["id"], body.get("batch_id"), uid, body["name"], body.get("mobile"), body.get("aadhaar_masked"),
         body.get("dob"), body.get("gender"), body.get("category"), body.get("scheme")])
    if body.get("batch_id"):
        await execute("UPDATE batches SET enrolled=enrolled+1 WHERE id=$1 AND vendor_id=$2", [body["batch_id"], user["id"]])
    return {"id": row["id"], "user_id": uid}


@router.put("/candidates/{cid}")
async def update_vendor_candidate(cid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    existing = await query_one("SELECT user_id FROM vendor_candidates WHERE id=$1", [cid])
    uid = existing["user_id"] if existing else None
    if not uid and body.get("email"):
        u = await query_one("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='candidate'", [body["email"]])
        if u: uid = u["id"]
    if not uid and body.get("mobile"):
        u = await query_one("SELECT id FROM users WHERE phone=$1 AND role='candidate'", [body["mobile"]])
        if u: uid = u["id"]
    await execute("""UPDATE vendor_candidates SET
        name=COALESCE($1,name),mobile=COALESCE($2,mobile),aadhaar_masked=COALESCE($3,aadhaar_masked),
        dob=COALESCE($4,dob),gender=COALESCE($5,gender),category=COALESCE($6,category),
        scheme=COALESCE($7,scheme),unified_batch_id=COALESCE($8,unified_batch_id),
        status=COALESCE($9,status),attendance_pct=COALESCE($10,attendance_pct),
        placement_status=COALESCE($11,placement_status),user_id=COALESCE($12,user_id)
        WHERE id=$13 AND vendor_id=$14""",
        [body.get("name"), body.get("mobile"), body.get("aadhaar_masked"), body.get("dob"), body.get("gender"), body.get("category"),
         body.get("scheme"), body.get("batch_id"), body.get("status"), body.get("attendance_pct"),
         body.get("placement_status"), uid, cid, user["id"]])
    return {"ok": True}


@router.delete("/candidates/{cid}")
async def delete_vendor_candidate(cid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("UPDATE vendor_candidates SET status='withdrawn' WHERE id=$1 AND vendor_id=$2", [cid, user["id"]])
    return {"ok": True}


# ── Assessments ───────────────────────────────────────────────────────────────
@router.get("/assessments")
async def get_vendor_assessments(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("""SELECT a.*,b.batch_code,vc.title AS course_title FROM vendor_assessments a
        LEFT JOIN batches b ON b.id=a.unified_batch_id
        LEFT JOIN vendor_courses vc ON vc.id=b.vendor_course_id
        WHERE a.vendor_id=$1 ORDER BY a.created_at DESC""", [user["id"]])


@router.post("/assessments", status_code=201)
async def add_vendor_assessment(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    row = await execute_returning("""INSERT INTO vendor_assessments
        (vendor_id,unified_batch_id,agency,scheduled_date,time_slot,candidate_count,type,total_marks,passing_marks,assessor,duration_hrs)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id""",
        [user["id"], body.get("batch_id"), body.get("agency"), body.get("scheduled_date"), body.get("time_slot"),
         body.get("candidate_count", 0), body.get("type", "Final"), body.get("total_marks", 100),
         body.get("passing_marks", 50), body.get("assessor"), body.get("duration_hrs")])
    return {"id": row["id"]}


@router.put("/assessments/{aid}")
async def update_vendor_assessment(aid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    results = body.get("results")
    await execute("""UPDATE vendor_assessments SET agency=$1,scheduled_date=$2,time_slot=$3,candidate_count=$4,
        results=COALESCE($5,results),status=COALESCE($6,status),type=COALESCE($7,type),
        total_marks=COALESCE($8,total_marks),passing_marks=COALESCE($9,passing_marks),
        assessor=COALESCE($10,assessor),duration_hrs=COALESCE($11,duration_hrs) WHERE id=$12 AND vendor_id=$13""",
        [body.get("agency"), body.get("scheduled_date"), body.get("time_slot"), body.get("candidate_count", 0),
         json.dumps(results) if results is not None else None, body.get("status"), body.get("type"),
         body.get("total_marks"), body.get("passing_marks"), body.get("assessor"), body.get("duration_hrs"),
         aid, user["id"]])
    return {"ok": True}


@router.delete("/assessments/{aid}")
async def delete_vendor_assessment(aid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("UPDATE vendor_assessments SET status='cancelled' WHERE id=$1 AND vendor_id=$2", [aid, user["id"]])
    return {"ok": True}


# ── Documents ─────────────────────────────────────────────────────────────────
@router.get("/documents")
async def get_vendor_docs(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("SELECT id,doc_type,filename,expiry_date,status,created_at FROM vendor_documents WHERE vendor_id=$1 ORDER BY doc_type", [user["id"]])


@router.post("/documents", status_code=201)
async def add_vendor_doc(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    doc_type = body.get("doc_type")
    existing = await query_one("SELECT id FROM vendor_documents WHERE vendor_id=$1 AND doc_type=$2", [user["id"], doc_type])
    if existing:
        await execute("UPDATE vendor_documents SET filename=$1,file_data=$2,expiry_date=$3,status='uploaded',created_at=NOW() WHERE id=$4",
            [body.get("filename"), body.get("file_data"), body.get("expiry_date"), existing["id"]])
        return {"id": existing["id"], "updated": True}
    row = await execute_returning("INSERT INTO vendor_documents (vendor_id,doc_type,filename,file_data,expiry_date,status) VALUES ($1,$2,$3,$4,$5,'uploaded') RETURNING id",
        [user["id"], doc_type, body.get("filename"), body.get("file_data"), body.get("expiry_date")])
    return {"id": row["id"]}


@router.delete("/documents/{did}")
async def delete_vendor_doc(did: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("DELETE FROM vendor_documents WHERE id=$1 AND vendor_id=$2", [did, user["id"]])
    return {"ok": True}


# ── Grievances ────────────────────────────────────────────────────────────────
@router.get("/grievances")
async def get_vendor_grievances(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("SELECT * FROM vendor_grievances WHERE vendor_id=$1 ORDER BY created_at DESC", [user["id"]])


@router.post("/grievances", status_code=201)
async def add_vendor_grievance(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    if not body.get("subject"): raise HTTPException(400, detail="Subject required")
    ticket_no = f"TK-{str(int(_time.time() * 1000))[-6:]}"
    row = await execute_returning("INSERT INTO vendor_grievances (vendor_id,ticket_no,category,priority,subject,details) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
        [user["id"], ticket_no, body.get("category"), body.get("priority", "normal"), body["subject"], body.get("details")])
    return {"id": row["id"], "ticket_no": ticket_no}


@router.put("/grievances/{gid}")
async def update_vendor_grievance(gid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    await execute("UPDATE vendor_grievances SET status=$1 WHERE id=$2 AND vendor_id=$3", [body.get("status"), gid, user["id"]])
    return {"ok": True}


# ── Certifications ──────────────────────────────────────────────────────────

@router.get("/certifications")
async def get_vendor_certifications(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("""
        SELECT vc.id, vc.name, vc.mobile, vc.status as candidate_status,
               vc.placement_status, vc.enroll_date,
               u.email,
               c.title as course_title, c.nsqf_level, c.sector,
               b.batch_code as batch_name, b.end_date,
               CASE WHEN vc.status='completed' THEN true ELSE false END as certificate_issued
        FROM vendor_candidates vc
        LEFT JOIN batches b ON b.id = vc.unified_batch_id
        LEFT JOIN vendor_courses c ON c.id = b.vendor_course_id
        LEFT JOIN users u ON u.id = vc.user_id
        WHERE vc.vendor_id=$1 AND vc.status IN ('completed','active','enrolled')
        ORDER BY vc.enroll_date DESC""", [user["id"]])


# ── Placements ───────────────────────────────────────────────────────────────

@router.get("/placements")
async def get_vendor_placements(user: dict = Depends(auth_required)):
    _vendor_only(user)
    return await query("""
        SELECT vc.id, vc.name, vc.mobile,
               vc.placement_status, vc.status as candidate_status,
               u.email,
               c.title as course_title, c.sector,
               b.batch_code as batch_name,
               p.job_title, p.company, p.location, p.ctc, p.placement_date, p.status as placement_status_detail,
               a.name as agency_name
        FROM vendor_candidates vc
        LEFT JOIN batches b ON b.id = vc.unified_batch_id
        LEFT JOIN vendor_courses c ON c.id = b.vendor_course_id
        LEFT JOIN users u ON u.id = vc.user_id
        LEFT JOIN placements p ON p.candidate_id = vc.user_id
        LEFT JOIN users a ON a.id = p.agency_id
        WHERE vc.vendor_id=$1
        ORDER BY vc.enroll_date DESC""", [user["id"]])


# ── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics")
async def get_vendor_analytics(user: dict = Depends(auth_required)):
    _vendor_only(user)
    vid = user["id"]
    async def n(sql, p=None): row = await query_one(sql, p or []); return int(row["c"] or 0) if row else 0

    total_students   = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1", [vid])
    active_students  = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND status='active'", [vid])
    completed        = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND status='completed'", [vid])
    placed           = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND placement_status='placed'", [vid])
    total_courses    = await n("SELECT COUNT(*) c FROM vendor_courses WHERE vendor_id=$1 AND status='active'", [vid])
    total_batches    = await n("SELECT COUNT(*) c FROM batches WHERE vendor_id=$1", [vid])
    active_batches   = await n("SELECT COUNT(*) c FROM batches WHERE vendor_id=$1 AND status='active'", [vid])
    total_trainers   = await n("SELECT COUNT(*) c FROM vendor_trainers WHERE vendor_id=$1 AND status='active'", [vid])
    total_centres    = await n("SELECT COUNT(*) c FROM vendor_centres WHERE vendor_id=$1 AND status!='deleted'", [vid])

    placement_rate = round((placed / total_students * 100)) if total_students else 0
    completion_rate = round((completed / total_students * 100)) if total_students else 0

    monthly = await query("""
        SELECT TO_CHAR(enroll_date::date, 'Mon YY') as month, COUNT(*) c
        FROM vendor_candidates WHERE vendor_id=$1 AND enroll_date IS NOT NULL
        GROUP BY 1 ORDER BY MIN(enroll_date::date) DESC LIMIT 6""", [vid])

    sector_breakdown = await query("""
        SELECT COALESCE(c.sector,'Other') as sector, COUNT(*) c
        FROM vendor_candidates vc
        LEFT JOIN batches b ON b.id=vc.unified_batch_id
        LEFT JOIN vendor_courses c ON c.id=b.vendor_course_id
        WHERE vc.vendor_id=$1
        GROUP BY 1 ORDER BY 2 DESC LIMIT 5""", [vid])

    return {
        "total_students": total_students, "active_students": active_students,
        "completed": completed, "placed": placed,
        "total_courses": total_courses, "total_batches": total_batches,
        "active_batches": active_batches, "total_trainers": total_trainers,
        "total_centres": total_centres, "placement_rate": placement_rate,
        "completion_rate": completion_rate,
        "monthly_enrollments": list(reversed(monthly)),
        "sector_breakdown": sector_breakdown,
    }


# ── Revenue ──────────────────────────────────────────────────────────────────

@router.get("/revenue")
async def get_vendor_revenue(user: dict = Depends(auth_required)):
    _vendor_only(user)
    vid = user["id"]
    courses = await query("""
        SELECT c.title, c.fee_type, COALESCE(c.fee_amount,0) as fee_amount,
               COUNT(vc.id) as enrolled_count,
               COALESCE(c.fee_amount,0) * COUNT(vc.id) as revenue
        FROM vendor_courses c
        LEFT JOIN batches b ON b.vendor_course_id=c.id AND b.vendor_id=$1
        LEFT JOIN vendor_candidates vc ON vc.unified_batch_id=b.id AND vc.status NOT IN ('withdrawn','deleted')
        WHERE c.vendor_id=$1
        GROUP BY c.id, c.title, c.fee_type, c.fee_amount
        ORDER BY revenue DESC""", [vid])

    total_revenue = sum(int(r.get("revenue") or 0) for r in courses)
    total_enrolled = sum(int(r.get("enrolled_count") or 0) for r in courses)

    monthly = await query("""
        SELECT TO_CHAR(vc.enroll_date::date,'Mon YY') as month,
               SUM(COALESCE(c.fee_amount,0)) as revenue, COUNT(vc.id) as count
        FROM vendor_candidates vc
        LEFT JOIN batches b ON b.id=vc.unified_batch_id
        LEFT JOIN vendor_courses c ON c.id=b.vendor_course_id
        WHERE vc.vendor_id=$1 AND vc.enroll_date IS NOT NULL AND vc.status NOT IN ('withdrawn','deleted')
        GROUP BY 1 ORDER BY MIN(vc.enroll_date::date) DESC LIMIT 6""", [vid])

    return {
        "total_revenue": total_revenue,
        "total_enrolled": total_enrolled,
        "courses": courses,
        "monthly": list(reversed(monthly)),
    }


# ── AI Insights ──────────────────────────────────────────────────────────────

@router.get("/ai-insights")
async def get_vendor_ai_insights(user: dict = Depends(auth_required)):
    _vendor_only(user)
    vid = user["id"]
    async def n(sql, p=None): row = await query_one(sql, p or []); return int(row["c"] or 0) if row else 0

    total    = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1", [vid])
    placed   = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND placement_status='placed'", [vid])
    completed= await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND status='completed'", [vid])
    courses  = await n("SELECT COUNT(*) c FROM vendor_courses WHERE vendor_id=$1 AND status='active'", [vid])
    trainers = await n("SELECT COUNT(*) c FROM vendor_trainers WHERE vendor_id=$1 AND status='active'", [vid])

    top_sectors = await query("""
        SELECT COALESCE(c.sector,'Other') as sector, COUNT(*) c
        FROM vendor_candidates vc
        LEFT JOIN batches b ON b.id=vc.unified_batch_id
        LEFT JOIN vendor_courses c ON c.id=b.vendor_course_id
        WHERE vc.vendor_id=$1
        GROUP BY 1 ORDER BY 2 DESC LIMIT 3""", [vid])

    placement_rate = round(placed/total*100) if total else 0
    completion_rate = round(completed/total*100) if total else 0

    insights = []
    if placement_rate < 50:
        insights.append({"type":"warning","title":"Low Placement Rate","detail":f"Only {placement_rate}% of your students are placed. Consider partnering with more employers.","action":"View Placements"})
    else:
        insights.append({"type":"success","title":"Strong Placement Rate","detail":f"{placement_rate}% placement rate — above industry average of 45%.","action":"View Analytics"})
    if trainers < 2:
        insights.append({"type":"warning","title":"Trainer Shortage","detail":"You have fewer than 2 active trainers. Add more to scale capacity.","action":"Add Trainer"})
    if courses < 3:
        insights.append({"type":"info","title":"Expand Course Catalogue","detail":f"You have {courses} active course(s). Adding more courses can attract more students.","action":"Add Course"})
    if top_sectors:
        s = top_sectors[0]["sector"]
        insights.append({"type":"info","title":f"Top Sector: {s}","detail":f"Most of your students are enrolled in {s} courses. High demand sector.","action":"View Courses"})
    insights.append({"type":"success","title":"Completion Rate","detail":f"{completion_rate}% of enrolled students complete their courses.","action":"View Students"})

    return {"insights": insights, "stats": {"total": total, "placed": placed, "completed": completed, "placement_rate": placement_rate, "completion_rate": completion_rate}}


# ── Marketing ────────────────────────────────────────────────────────────────

@router.get("/marketing")
async def get_vendor_marketing(user: dict = Depends(auth_required)):
    _vendor_only(user)
    vid = user["id"]
    async def n(sql, p=None): row = await query_one(sql, p or []); return int(row["c"] or 0) if row else 0

    total_students = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1", [vid])
    total_courses  = await n("SELECT COUNT(*) c FROM vendor_courses WHERE vendor_id=$1 AND status='active'", [vid])
    total_centres  = await n("SELECT COUNT(*) c FROM vendor_centres WHERE vendor_id=$1 AND status!='deleted'", [vid])
    total_batches  = await n("SELECT COUNT(*) c FROM batches WHERE vendor_id=$1", [vid])

    courses = await query("SELECT title, sector, nsqf_level FROM vendor_courses WHERE vendor_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 5", [vid])

    return {
        "reach": {"students": total_students, "courses": total_courses, "centres": total_centres, "batches": total_batches},
        "top_courses": courses,
    }


# ── Reviews & Feedback ───────────────────────────────────────────────────────

@router.get("/reviews")
async def get_vendor_reviews(user: dict = Depends(auth_required)):
    _vendor_only(user)
    vid = user["id"]
    grievances = await query("""
        SELECT vg.id, vg.subject, vg.details as description, vg.status, vg.created_at,
               vg.category, vg.priority, vg.ticket_no
        FROM vendor_grievances vg
        WHERE vg.vendor_id=$1
        ORDER BY vg.created_at DESC""", [vid])

    total = len(grievances)
    open_count = sum(1 for g in grievances if g.get("status") == "open")
    resolved   = sum(1 for g in grievances if g.get("status") == "resolved")

    return {"grievances": grievances, "summary": {"total": total, "open": open_count, "resolved": resolved}}
