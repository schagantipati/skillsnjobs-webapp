import json
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from typing import Any, List
from passlib.context import CryptContext
from database import query, query_one, execute, execute_returning, log_audit
from auth import auth_required, require_role

router = APIRouter(prefix="/api/users", tags=["users"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _parse_skills(val):
    if isinstance(val, list): return val
    if isinstance(val, str):
        try: return json.loads(val)
        except Exception: return []
    return []


def public_user(u: dict) -> dict:
    vp = u.get("vendor_profile")
    if isinstance(vp, str):
        try: vp = json.loads(vp)
        except Exception: vp = None
    return {
        "id": u["id"], "name": u["name"], "email": u["email"], "role": u["role"],
        "org_name": u.get("org_name"), "location": u.get("location"), "bio": u.get("bio"),
        "skills": _parse_skills(u.get("skills")), "experience_years": u.get("experience_years"),
        "first_name": u.get("first_name"), "middle_name": u.get("middle_name"), "last_name": u.get("last_name"),
        "dob": str(u["dob"]) if u.get("dob") else None, "gender": u.get("gender"),
        "phone": u.get("phone"), "photo": u.get("photo"),
        "address_line1": u.get("address_line1"), "address_line2": u.get("address_line2"),
        "city": u.get("city"), "state_name": u.get("state_name"), "country": u.get("country"), "pincode": u.get("pincode"),
        "category": u.get("category"), "qualification": u.get("qualification"), "year_passed": u.get("year_passed"),
        "board": u.get("board"), "university": u.get("university"), "percentage": u.get("percentage"),
        "employment_status": u.get("employment_status"), "interests": u.get("interests"),
        "preferred_sector": u.get("preferred_sector"),
        "lang_english": u.get("lang_english"), "lang_hindi": u.get("lang_hindi"), "lang_regional": u.get("lang_regional"),
        "certificates": u.get("certificates"), "resume": u.get("resume"),
        "cin": u.get("cin"), "website": u.get("website"), "tan": u.get("tan"),
        "registration_number": u.get("registration_number"), "pan": u.get("pan"), "gstin": u.get("gstin"),
        "year_established": u.get("year_established"), "head_office": u.get("head_office"),
        "branch_offices": u.get("branch_offices"),
        "ceo_name": u.get("ceo_name"), "spoc_name": u.get("spoc_name"), "ops_head": u.get("ops_head"),
        "finance_contact": u.get("finance_contact"), "placement_officer": u.get("placement_officer"),
        "bank_account_name": u.get("bank_account_name"), "bank_ifsc": u.get("bank_ifsc"),
        "bank_account_number": u.get("bank_account_number"), "account_type": u.get("account_type"),
        "bank_name": u.get("bank_name"), "bank_branch": u.get("bank_branch"),
        "designation": u.get("designation"),
        "avg_net_profit": u.get("avg_net_profit"), "csr_obligation": u.get("csr_obligation"),
        "csr_total_spend": u.get("csr_total_spend"),
        "training_centres": u.get("training_centres"), "centre_photos": u.get("centre_photos"),
        "vendor_profile": vp,
        "notifications_pref": u.get("notifications_pref"),
        "is_active": u.get("is_active"), "verification_status": u.get("verification_status"),
    }


@router.get("/me")
async def get_me(user: dict = Depends(auth_required)):
    u = await query_one("SELECT * FROM users WHERE id=$1", [user["id"]])
    if not u: raise HTTPException(404, detail="User not found")
    return public_user(u)


@router.put("/me")
async def update_me(body: dict, request: Request, user: dict = Depends(auth_required)):
    e = await query_one("SELECT * FROM users WHERE id=$1", [user["id"]])
    # Duplicate check for training_vendor
    email = body.get("email")
    org_name = body.get("org_name")
    if e["role"] == "training_vendor":
        if email and email != e["email"]:
            dup = await query_one("SELECT id FROM users WHERE email=$1 AND id!=$2", [email, e["id"]])
            if dup: raise HTTPException(409, detail={"error": "This email is already registered with another account.", "field": "email"})
        if org_name and org_name.strip().lower() != (e.get("org_name") or "").strip().lower():
            dup = await query_one("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(org_name))=LOWER(TRIM($1)) AND id!=$2", [org_name.strip(), e["id"]])
            if dup: raise HTTPException(409, detail={"error": f"Organisation \"{org_name.strip()}\" is already registered.", "field": "org_name"})

    def v(key, fallback=None):
        return body[key] if key in body else (e.get(key) if fallback is None else fallback)

    vp = body.get("vendor_profile")
    notifications_pref = body.get("notifications_pref", e.get("notifications_pref"))

    await execute(
        """UPDATE users SET
          name=$1, location=$2, bio=$3, skills=$4, experience_years=$5, org_name=$6,
          first_name=$7, middle_name=$8, last_name=$9, dob=$10, gender=$11, phone=$12, photo=$13,
          address_line1=$14, address_line2=$15, city=$16, state_name=$17, country=$18, pincode=$19,
          category=$20, qualification=$21, year_passed=$22, board=$23, university=$24, percentage=$25,
          employment_status=$26, interests=$27, preferred_sector=$28,
          lang_english=$29, lang_hindi=$30, lang_regional=$31,
          certificates=$32, resume=$33,
          email=$34, tan=$35, cin=$36, website=$37,
          registration_number=$38, pan=$39, gstin=$40, year_established=$41, head_office=$42, branch_offices=$43,
          ceo_name=$44, spoc_name=$45, ops_head=$46, finance_contact=$47, placement_officer=$48,
          bank_account_name=$49, bank_ifsc=$50, bank_account_number=$51, bank_name=$62, bank_branch=$63,
          training_centres=$52, centre_photos=$53, vendor_profile=$54,
          notifications_pref=$55, designation=$57, account_type=$58,
          avg_net_profit=$59, csr_obligation=$60, csr_total_spend=$61
          WHERE id=$56""",
        [
            v("name"), v("location"), v("bio"),
            json.dumps(v("skills", _parse_skills(e.get("skills")))),
            v("experience_years"), v("org_name"),
            v("first_name"), v("middle_name"), v("last_name"),
            v("dob"), v("gender"), v("phone"), v("photo"),
            v("address_line1"), v("address_line2"), v("city"), v("state_name"), v("country"), v("pincode"),
            v("category"), v("qualification"), v("year_passed"), v("board"), v("university"), v("percentage"),
            v("employment_status"), v("interests"), v("preferred_sector"),
            v("lang_english"), v("lang_hindi"), v("lang_regional"),
            v("certificates"), v("resume"),
            email or e["email"], v("tan"), v("cin"), v("website"),
            v("registration_number"), v("pan"), v("gstin"), v("year_established"), v("head_office"), v("branch_offices"),
            v("ceo_name"), v("spoc_name"), v("ops_head"), v("finance_contact"), v("placement_officer"),
            v("bank_account_name"), v("bank_ifsc"), v("bank_account_number"),
            v("training_centres"), v("centre_photos"),
            json.dumps(vp) if vp is not None else e.get("vendor_profile"),
            notifications_pref,
            user["id"],
            v("designation"), v("account_type"),
            v("avg_net_profit"), v("csr_obligation"), v("csr_total_spend"),
            v("bank_name"), v("bank_branch"),
        ],
    )
    updated = await query_one("SELECT * FROM users WHERE id=$1", [user["id"]])
    await log_audit(user, "Profile updated", "user", user["id"], ip=request.client.host)
    return public_user(updated)


@router.post("/me/change-password")
async def change_password(body: dict, request: Request, user: dict = Depends(auth_required)):
    current = body.get("current_password", "")
    new = body.get("new_password", "")
    if not current or not new: raise HTTPException(400, detail="current_password and new_password are required")
    if len(new) < 6: raise HTTPException(400, detail="New password must be at least 6 characters")
    u = await query_one("SELECT * FROM users WHERE id=$1", [user["id"]])
    if not pwd.verify(current, u["password_hash"]): raise HTTPException(400, detail="Current password is incorrect")
    await execute("UPDATE users SET password_hash=$1 WHERE id=$2", [pwd.hash(new), user["id"]])
    await log_audit(user, "Password changed", "user", user["id"], ip=request.client.host)
    return {"message": "Password updated successfully"}


@router.delete("/me")
async def delete_me(request: Request, user: dict = Depends(auth_required)):
    await log_audit(user, "Account deleted", "user", user["id"], ip=request.client.host)
    await execute("DELETE FROM users WHERE id=$1", [user["id"]])
    return {"message": "Account deleted successfully"}


@router.get("/candidates")
async def get_candidates(user: dict = Depends(auth_required)):
    allowed = ["employer", "admin", "administrator", "superadmin", "state_government", "central_government"]
    if user["role"] not in allowed: raise HTTPException(403, detail="Forbidden")
    rows = await query("SELECT * FROM users WHERE role='candidate' ORDER BY created_at DESC")
    return [public_user(r) for r in rows]


@router.get("/by-role/{role}")
async def by_role(role: str, user: dict = Depends(require_role("superadmin", "administrator"))):
    allowed = ["candidate","employer","trainer","placement_agency","csr_org","training_vendor",
               "state_government","central_government","administrator","admin"]
    if role not in allowed: raise HTTPException(400, detail="Invalid role")
    rows = await query("SELECT * FROM users WHERE role=$1 ORDER BY created_at DESC", [role])
    return [public_user(r) for r in rows]


@router.get("/all")
async def all_users(role: str = None, search: str = None, status: str = None,
                    user: dict = Depends(require_role("superadmin"))):
    sql = "SELECT * FROM users WHERE 1=1"
    params, idx = [], 1
    if role:   sql += f" AND role=${idx}"; params.append(role); idx += 1
    if status: sql += f" AND (is_active=${idx} OR is_active IS NULL)"; params.append(1 if status == "active" else 0); idx += 1
    if search:
        q = f"%{search}%"
        sql += f" AND (name ILIKE ${idx} OR email ILIKE ${idx+1} OR org_name ILIKE ${idx+2})"
        params.extend([q, q, q]); idx += 3
    sql += " ORDER BY created_at DESC"
    rows = await query(sql, params)
    return [public_user(r) for r in rows]


@router.get("/audit-logs")
async def audit_logs(limit: int = 100, offset: int = 0, action: str = None,
                     user: dict = Depends(require_role("superadmin", "administrator", "admin"))):
    limit = min(limit, 500)
    if action:
        rows = await query("SELECT * FROM audit_logs WHERE action=$1 ORDER BY id DESC LIMIT $2 OFFSET $3", [action, limit, offset])
        total_row = await query_one("SELECT COUNT(*) c FROM audit_logs WHERE action=$1", [action])
    else:
        rows = await query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT $1 OFFSET $2", [limit, offset])
        total_row = await query_one("SELECT COUNT(*) c FROM audit_logs")
    return {"rows": rows, "total": int(total_row["c"])}


@router.get("/stats")
async def user_stats(user: dict = Depends(require_role("superadmin"))):
    async def n(sql, p=None): row = await query_one(sql, p or []); return int(row["c"] if row else 0)
    stats = {}
    for r in ["candidate","training_vendor","trainer","csr_org","placement_agency","employer"]:
        stats[r] = await n("SELECT COUNT(*) c FROM users WHERE role=$1", [r])
    stats["total_users"] = await n("SELECT COUNT(*) c FROM users")
    stats["open_jobs"] = await n("SELECT COUNT(*) c FROM jobs WHERE status='open'")
    stats["total_jobs"] = await n("SELECT COUNT(*) c FROM jobs")
    stats["total_courses"] = await n("SELECT COUNT(*) c FROM courses")
    stats["applications"] = await n("SELECT COUNT(*) c FROM applications")
    stats["hired"] = await n("SELECT COUNT(*) c FROM applications WHERE status='hired'")
    stats["shortlisted"] = await n("SELECT COUNT(*) c FROM applications WHERE status='shortlisted'")
    stats["enrollments"] = await n("SELECT COUNT(*) c FROM enrollments")
    return stats


@router.get("/admin/role-permissions")
async def get_role_permissions(user: dict = Depends(auth_required)):
    rows = await query("SELECT role, menu_key, enabled FROM role_permissions ORDER BY role, menu_key")
    result: dict = {}
    for r in rows:
        if r["role"] not in result: result[r["role"]] = {}
        result[r["role"]][r["menu_key"]] = r["enabled"]
    return result


@router.put("/admin/role-permissions/{role}")
async def save_role_permissions(role: str, body: dict, user: dict = Depends(require_role("superadmin"))):
    for menu_key, enabled in body.items():
        await execute(
            """INSERT INTO role_permissions (role, menu_key, enabled, updated_at)
               VALUES ($1,$2,$3,NOW()) ON CONFLICT (role, menu_key)
               DO UPDATE SET enabled=EXCLUDED.enabled, updated_at=NOW()""",
            [role, menu_key, bool(enabled)],
        )
    return {"ok": True}


@router.get("/admin/sessions")
async def admin_sessions(user: dict = Depends(require_role("superadmin"))):
    return await query("""
        SELECT ts.id, ts.topic, ts.session_date, ts.start_time, ts.duration_hrs,
               ts.venue, ts.mode, ts.status, ts.created_at,
               u.name AS trainer_name, u.email AS trainer_email,
               b.batch_code, b.batch_name, b.course_name
        FROM trainer_sessions ts
        JOIN users u ON u.id=ts.trainer_id
        LEFT JOIN batches b ON b.id=ts.batch_id
        ORDER BY ts.session_date DESC, ts.start_time
    """)


@router.put("/{uid}/status")
async def update_status(uid: int, body: dict, request: Request, user: dict = Depends(require_role("superadmin"))):
    u = await query_one("SELECT * FROM users WHERE id=$1", [uid])
    if not u: raise HTTPException(404, detail="User not found")
    is_active = 1 if body.get("is_active") else 0
    await execute("UPDATE users SET is_active=$1 WHERE id=$2", [is_active, uid])
    action = "User activated" if is_active else "User deactivated"
    await log_audit(user, action, "user", uid, ip=request.client.host)
    return {"success": True, "is_active": bool(is_active)}


@router.put("/{uid}")
async def update_user(uid: int, body: dict, request: Request, user: dict = Depends(require_role("superadmin", "administrator"))):
    u = await query_one("SELECT * FROM users WHERE id=$1", [uid])
    if not u: raise HTTPException(404, detail="User not found")
    vp = body.get("vendor_profile")
    await execute(
        """UPDATE users SET
          org_name=COALESCE($1,org_name), location=COALESCE($2,location), bio=COALESCE($3,bio),
          phone=COALESCE($4,phone), gender=COALESCE($5,gender),
          registration_number=COALESCE($6,registration_number), pan=COALESCE($7,pan),
          gstin=COALESCE($8,gstin), year_established=COALESCE($9,year_established),
          dob=COALESCE($10,dob), verification_status=COALESCE($11,verification_status),
          ceo_name=COALESCE($12,ceo_name), spoc_name=COALESCE($13,spoc_name),
          ops_head=COALESCE($14,ops_head), finance_contact=COALESCE($15,finance_contact),
          placement_officer=COALESCE($16,placement_officer),
          bank_account_name=COALESCE($17,bank_account_name), bank_ifsc=COALESCE($18,bank_ifsc),
          bank_account_number=COALESCE($19,bank_account_number),
          head_office=COALESCE($20,head_office), branch_offices=COALESCE($21,branch_offices),
          address_line1=COALESCE($22,address_line1), address_line2=COALESCE($23,address_line2),
          city=COALESCE($24,city), state_name=COALESCE($25,state_name), pincode=COALESCE($26,pincode),
          vendor_profile=CASE WHEN $27 IS NOT NULL THEN $27 ELSE vendor_profile END
          WHERE id=$28""",
        [body.get("org_name"), body.get("location"), body.get("bio"), body.get("phone"), body.get("gender"),
         body.get("registration_number"), body.get("pan"), body.get("gstin"), body.get("year_established"),
         body.get("dob"), body.get("verification_status"),
         body.get("ceo_name"), body.get("spoc_name"), body.get("ops_head"), body.get("finance_contact"), body.get("placement_officer"),
         body.get("bank_account_name"), body.get("bank_ifsc"), body.get("bank_account_number"),
         body.get("head_office"), body.get("branch_offices"),
         body.get("address_line1"), body.get("address_line2"), body.get("city"), body.get("state_name"), body.get("pincode"),
         json.dumps(vp) if vp is not None else None,
         uid],
    )
    updated = await query_one("SELECT * FROM users WHERE id=$1", [uid])
    await log_audit(user, "User profile updated", "user", uid, ip=request.client.host)
    return public_user(updated)


@router.delete("/{uid}")
async def delete_user(uid: int, request: Request, user: dict = Depends(require_role("superadmin"))):
    u = await query_one("SELECT * FROM users WHERE id=$1", [uid])
    if not u: raise HTTPException(404, detail="User not found")
    if u["id"] == user["id"]: raise HTTPException(400, detail="Cannot delete yourself")
    await execute("DELETE FROM users WHERE id=$1", [uid])
    await log_audit(user, "User deleted", "user", uid, ip=request.client.host)
    return {"success": True}


# ── Trainer sub-profile endpoints ────────────────────────────────────────────
@router.get("/me/qualifications")
async def get_qualifications(user: dict = Depends(require_role("trainer"))):
    return await query("SELECT * FROM trainer_qualifications WHERE trainer_id=$1 ORDER BY id", [user["id"]])

@router.post("/me/qualifications")
async def add_qualification(body: dict, user: dict = Depends(require_role("trainer"))):
    row = await execute_returning(
        "INSERT INTO trainer_qualifications (trainer_id,degree,institution,year,score) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [user["id"], body["degree"], body["institution"], body.get("year"), body.get("score")]
    )
    return row

@router.delete("/me/qualifications/{qid}")
async def del_qualification(qid: int, user: dict = Depends(require_role("trainer"))):
    await execute("DELETE FROM trainer_qualifications WHERE id=$1 AND trainer_id=$2", [qid, user["id"]])
    return {"ok": True}


@router.get("/me/experience")
async def get_experience(user: dict = Depends(require_role("trainer"))):
    return await query("SELECT * FROM trainer_experience WHERE trainer_id=$1 ORDER BY id", [user["id"]])

@router.post("/me/experience")
async def add_experience(body: dict, user: dict = Depends(require_role("trainer"))):
    row = await execute_returning(
        "INSERT INTO trainer_experience (trainer_id,org,role,from_date,to_date,sector) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
        [user["id"], body["org"], body["role"], body.get("from_date"), body.get("to_date"), body.get("sector")]
    )
    return row

@router.delete("/me/experience/{eid}")
async def del_experience(eid: int, user: dict = Depends(require_role("trainer"))):
    await execute("DELETE FROM trainer_experience WHERE id=$1 AND trainer_id=$2", [eid, user["id"]])
    return {"ok": True}


@router.get("/me/skills")
async def get_skills(user: dict = Depends(require_role("trainer"))):
    return await query("SELECT * FROM trainer_skills WHERE trainer_id=$1 ORDER BY id", [user["id"]])

@router.post("/me/skills")
async def add_skill(body: dict, user: dict = Depends(require_role("trainer"))):
    row = await execute_returning(
        "INSERT INTO trainer_skills (trainer_id,domain,courses,ssc,nsqf_level,years_exp) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
        [user["id"], body["domain"], body.get("courses"), body.get("ssc"), body.get("nsqf_level"), body.get("years_exp")]
    )
    return row

@router.delete("/me/skills/{sid}")
async def del_skill(sid: int, user: dict = Depends(require_role("trainer"))):
    await execute("DELETE FROM trainer_skills WHERE id=$1 AND trainer_id=$2", [sid, user["id"]])
    return {"ok": True}


# ── Bulk Import ─────────────────────────────────────────────────
BULK_ROLES = {
    "candidates": "candidate",
    "training_partners": "training_vendor",
    "trainers": "trainer",
    "employers": "employer",
    "csr_orgs": "csr_org",
    "placement_agencies": "placement_agency",
}

USER_REQUIRED = ["name", "email", "password"]
USER_OPTIONAL = ["org_name", "location", "phone", "gender", "bio"]

@router.post("/bulk-import/{entity}")
async def bulk_import(entity: str, file: UploadFile = File(...),
                      user: dict = Depends(require_role("superadmin", "administrator"))):
    if entity not in BULK_ROLES and entity not in ("courses", "jobs"):
        raise HTTPException(400, detail="Invalid entity type")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except Exception:
        raise HTTPException(400, detail="File must be UTF-8 encoded CSV")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(400, detail="CSV file is empty")

    inserted, errors = 0, []

    if entity in BULK_ROLES:
        role = BULK_ROLES[entity]
        for i, row in enumerate(rows, 2):
            row = {k.strip().lower().replace(" ", "_"): (v or "").strip() for k, v in row.items()}
            missing = [f for f in USER_REQUIRED if not row.get(f)]
            if missing:
                errors.append({"row": i, "error": f"Missing: {', '.join(missing)}", "email": row.get("email", "")})
                continue
            existing = await query_one("SELECT id FROM users WHERE email=$1", [row["email"].lower()])
            if existing:
                errors.append({"row": i, "error": "Email already exists", "email": row["email"]})
                continue
            try:
                pw_hash = pwd.hash(row["password"])
                await execute(
                    """INSERT INTO users (name,email,password_hash,role,org_name,location,phone,gender,bio,is_active)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1)""",
                    [row["name"], row["email"].lower(), pw_hash, role,
                     row.get("org_name") or None, row.get("location") or None,
                     row.get("phone") or None, row.get("gender") or None, row.get("bio") or None]
                )
                inserted += 1
            except Exception as e:
                errors.append({"row": i, "error": str(e)[:120], "email": row.get("email", "")})

    elif entity == "courses":
        for i, row in enumerate(rows, 2):
            row = {k.strip().lower().replace(" ", "_"): (v or "").strip() for k, v in row.items()}
            if not row.get("title"):
                errors.append({"row": i, "error": "Missing: title", "email": ""})
                continue
            try:
                skills = [s.strip() for s in (row.get("skill_tags") or "").split(",") if s.strip()]
                await execute(
                    """INSERT INTO courses (title,provider,skill_tags,duration_weeks,level,fee,nsqf_level,description)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
                    [row["title"], row.get("provider") or None, json.dumps(skills),
                     int(row["duration_weeks"]) if row.get("duration_weeks","").isdigit() else None,
                     row.get("level") or "Beginner",
                     float(row["fee"]) if row.get("fee","").replace(".","").isdigit() else 0,
                     int(row["nsqf_level"]) if row.get("nsqf_level","").isdigit() else None,
                     row.get("description") or None]
                )
                inserted += 1
            except Exception as e:
                errors.append({"row": i, "error": str(e)[:120], "email": row.get("title", "")})

    elif entity == "jobs":
        for i, row in enumerate(rows, 2):
            row = {k.strip().lower().replace(" ", "_"): (v or "").strip() for k, v in row.items()}
            if not row.get("title"):
                errors.append({"row": i, "error": "Missing: title", "email": ""})
                continue
            try:
                skills = [s.strip() for s in (row.get("required_skills") or "").split(",") if s.strip()]
                employers = await query("SELECT id FROM users WHERE role='employer' ORDER BY id LIMIT 1")
                emp_id = employers[0]["id"] if employers else None
                await execute(
                    """INSERT INTO jobs (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max,status)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open')""",
                    [emp_id, row["title"], row.get("description") or "",
                     json.dumps(skills), row.get("location") or "",
                     row.get("job_type") or "Full-time",
                     int(row["salary_min"]) if row.get("salary_min","").isdigit() else None,
                     int(row["salary_max"]) if row.get("salary_max","").isdigit() else None]
                )
                inserted += 1
            except Exception as e:
                errors.append({"row": i, "error": str(e)[:120], "email": row.get("title", "")})

    return {"inserted": inserted, "errors": errors, "total_rows": len(rows)}
