import time as _time
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role

router = APIRouter(prefix="/api/trainer", tags=["trainer"])


def _trainer_only(user: dict):
    if user["role"] != "trainer":
        raise HTTPException(403, detail="Forbidden")


# ── Certifications ─────────────────────────────────────────────────────────────
@router.get("/certifications")
async def get_certs(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("SELECT * FROM trainer_certifications WHERE trainer_id=$1 ORDER BY id", [user["id"]])


@router.post("/certifications", status_code=201)
async def add_cert(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("cert_name") or not body.get("issuing_body"):
        raise HTTPException(400, detail="cert_name and issuing_body are required")
    row = await execute_returning("INSERT INTO trainer_certifications (trainer_id,cert_name,issuing_body,year,valid_until) VALUES ($1,$2,$3,$4,$5) RETURNING id",
        [user["id"], body["cert_name"], body["issuing_body"], body.get("year"), body.get("valid_until")])
    return {"id": row["id"], "trainer_id": user["id"], **body}


@router.delete("/certifications/{cid}")
async def del_cert(cid: int, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("DELETE FROM trainer_certifications WHERE id=$1 AND trainer_id=$2", [cid, user["id"]])
    return {"ok": True}


# ── Documents ─────────────────────────────────────────────────────────────────
@router.get("/documents")
async def get_docs(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("SELECT * FROM trainer_documents WHERE trainer_id=$1 ORDER BY id", [user["id"]])


@router.post("/documents", status_code=201)
async def add_doc(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("doc_type"): raise HTTPException(400, detail="doc_type is required")
    row = await execute_returning("INSERT INTO trainer_documents (trainer_id,doc_type,status,file_name,file_path) VALUES ($1,$2,'Submitted',$3,$4) RETURNING id",
        [user["id"], body["doc_type"], body.get("file_name"), body.get("file_path")])
    return {"id": row["id"], "trainer_id": user["id"], "doc_type": body["doc_type"], "status": "Submitted"}


@router.put("/documents/{did}")
async def update_doc(did: int, body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("UPDATE trainer_documents SET status=$1 WHERE id=$2 AND trainer_id=$3", [body.get("status"), did, user["id"]])
    return {"ok": True}


@router.delete("/documents/{did}")
async def del_doc(did: int, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("DELETE FROM trainer_documents WHERE id=$1 AND trainer_id=$2", [did, user["id"]])
    return {"ok": True}


# ── Sessions ──────────────────────────────────────────────────────────────────
@router.get("/sessions")
async def get_sessions(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("SELECT * FROM trainer_sessions WHERE trainer_id=$1 ORDER BY session_date DESC, start_time", [user["id"]])


@router.post("/sessions", status_code=201)
async def add_session(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("topic") or not body.get("session_date"):
        raise HTTPException(400, detail="topic and session_date are required")
    row = await execute_returning("""INSERT INTO trainer_sessions
        (trainer_id,batch_id,topic,session_date,start_time,duration_hrs,venue,mode,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id""",
        [user["id"], body.get("batch_id"), body["topic"], body["session_date"],
         body.get("start_time"), body.get("duration_hrs"), body.get("venue"),
         body.get("mode", "Classroom"), body.get("status", "scheduled")])
    return {"id": row["id"], "trainer_id": user["id"], **body}


@router.put("/sessions/{sid}")
async def update_session(sid: int, body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("""UPDATE trainer_sessions SET topic=$1,session_date=$2,start_time=$3,duration_hrs=$4,
        venue=$5,mode=$6,status=$7 WHERE id=$8 AND trainer_id=$9""",
        [body.get("topic"), body.get("session_date"), body.get("start_time"), body.get("duration_hrs"),
         body.get("venue"), body.get("mode"), body.get("status"), sid, user["id"]])
    return {"ok": True}


@router.delete("/sessions/{sid}")
async def del_session(sid: int, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("DELETE FROM trainer_sessions WHERE id=$1 AND trainer_id=$2", [sid, user["id"]])
    return {"ok": True}


# ── Assessments ───────────────────────────────────────────────────────────────
@router.get("/assessments")
async def get_assessments(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT ta.*,b.batch_code FROM trainer_assessments ta
        LEFT JOIN batches b ON b.id=ta.batch_id
        WHERE ta.trainer_id=$1 ORDER BY ta.date DESC""", [user["id"]])


@router.post("/assessments", status_code=201)
async def add_assessment(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("date"): raise HTTPException(400, detail="date is required")
    row = await execute_returning("""INSERT INTO trainer_assessments
        (trainer_id,batch_id,type,date,duration_hrs,total_marks,passing_marks,assessor,status,agency,candidate_count,time_slot)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id""",
        [user["id"], body.get("batch_id"), body.get("type", "Final"), body["date"],
         body.get("duration_hrs"), body.get("total_marks", 100), body.get("passing_marks", 50),
         body.get("assessor"), body.get("status", "scheduled"), body.get("agency"),
         body.get("candidate_count", 0), body.get("time_slot")])
    return {"id": row["id"]}


@router.put("/assessments/{aid}")
async def update_assessment(aid: int, body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("""UPDATE trainer_assessments SET type=$1,date=$2,duration_hrs=$3,total_marks=$4,
        passing_marks=$5,assessor=$6,status=$7,agency=COALESCE($8,agency),
        candidate_count=COALESCE($9,candidate_count),time_slot=COALESCE($10,time_slot)
        WHERE id=$11 AND trainer_id=$12""",
        [body.get("type"), body.get("date"), body.get("duration_hrs"), body.get("total_marks"),
         body.get("passing_marks"), body.get("assessor"), body.get("status"),
         body.get("agency"), body.get("candidate_count"), body.get("time_slot"), aid, user["id"]])
    return {"ok": True}


@router.delete("/assessments/{aid}")
async def del_assessment(aid: int, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("DELETE FROM trainer_assessments WHERE id=$1 AND trainer_id=$2", [aid, user["id"]])
    return {"ok": True}


# ── Mock Tests ────────────────────────────────────────────────────────────────
async def _ensure_mock_test_cols():
    for col, defn in [("total_marks","INTEGER DEFAULT 100"),("passing_marks","INTEGER DEFAULT 40"),("mode","TEXT DEFAULT 'Online'"),("time_slot","TEXT")]:
        try: await execute(f"ALTER TABLE trainer_mock_tests ADD COLUMN IF NOT EXISTS {col} {defn}")
        except Exception: pass

@router.get("/mock-tests")
async def get_mock_tests(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await _ensure_mock_test_cols()
    return await query("SELECT * FROM trainer_mock_tests WHERE trainer_id=$1 ORDER BY date DESC", [user["id"]])


@router.post("/mock-tests", status_code=201)
async def add_mock_test(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("subject") or not body.get("date"):
        raise HTTPException(400, detail="subject and date are required")
    row = await execute_returning("""INSERT INTO trainer_mock_tests
        (trainer_id,batch_id,subject,date,duration_min,questions,total_marks,passing_marks,mode,time_slot)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id""",
        [user["id"], body.get("batch_id"), body["subject"], body["date"],
         body.get("duration_min", 60), body.get("questions", 50),
         body.get("total_marks", 100), body.get("passing_marks", 40),
         body.get("mode", "Online"), body.get("time_slot")])
    return {"id": row["id"], "trainer_id": user["id"], **body}


@router.delete("/mock-tests/{mid}")
async def del_mock_test(mid: int, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("DELETE FROM trainer_mock_tests WHERE id=$1 AND trainer_id=$2", [mid, user["id"]])
    return {"ok": True}


# ── Content ───────────────────────────────────────────────────────────────────
@router.get("/content")
async def get_content(user: dict = Depends(auth_required)):
    _trainer_only(user)
    try: await execute("ALTER TABLE trainer_content ADD COLUMN IF NOT EXISTS url TEXT")
    except Exception: pass
    return await query("SELECT * FROM trainer_content WHERE trainer_id=$1 ORDER BY id DESC", [user["id"]])


@router.post("/content", status_code=201)
async def add_content(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("title") or not body.get("type"):
        raise HTTPException(400, detail="title and type are required")
    row = await execute_returning("INSERT INTO trainer_content (trainer_id,type,title,description,batch_targets,file_name,url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
        [user["id"], body["type"], body["title"], body.get("description"), body.get("batch_targets", "All"), body.get("file_name"), body.get("url")])
    return {"id": row["id"], "trainer_id": user["id"], **body, "views": 0}


@router.delete("/content/{cid}")
async def del_content(cid: int, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("DELETE FROM trainer_content WHERE id=$1 AND trainer_id=$2", [cid, user["id"]])
    return {"ok": True}


# ── Support Tickets ───────────────────────────────────────────────────────────
@router.get("/tickets")
async def get_tickets(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("SELECT * FROM trainer_support_tickets WHERE trainer_id=$1 ORDER BY id DESC", [user["id"]])


@router.post("/tickets", status_code=201)
async def add_ticket(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("subject") or not body.get("details"):
        raise HTTPException(400, detail="subject and details are required")
    ticket_id = "TKT-" + str(int(_time.time() * 1000))[-5:]
    row = await execute_returning("INSERT INTO trainer_support_tickets (trainer_id,ticket_id,category,priority,subject,details,status) VALUES ($1,$2,$3,$4,$5,$6,'Open') RETURNING id",
        [user["id"], ticket_id, body.get("category", "Other"), body.get("priority", "Medium"), body["subject"], body["details"]])
    return {"id": row["id"], "ticket_id": ticket_id, **body, "status": "Open"}


@router.put("/tickets/{tid}")
async def update_ticket(tid: int, body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("UPDATE trainer_support_tickets SET status=$1 WHERE id=$2 AND trainer_id=$3", [body.get("status"), tid, user["id"]])
    return {"ok": True}


# ── Grievances ────────────────────────────────────────────────────────────────
@router.get("/grievances")
async def get_grievances(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("SELECT * FROM trainer_grievances WHERE trainer_id=$1 ORDER BY id DESC", [user["id"]])


@router.post("/grievances", status_code=201)
async def add_grievance(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not body.get("details"): raise HTTPException(400, detail="details are required")
    from datetime import date
    ref_id = f"GRV-{date.today().year}-{str(int(_time.time() * 1000))[-4:]}"
    row = await execute_returning("INSERT INTO trainer_grievances (trainer_id,ref_id,grievance_type,against_whom,details,status) VALUES ($1,$2,$3,$4,$5,'Submitted') RETURNING id",
        [user["id"], ref_id, body.get("grievance_type", "Other"), body.get("against_whom"), body["details"]])
    return {"id": row["id"], "ref_id": ref_id, **body, "status": "Submitted"}


# ── Reports ───────────────────────────────────────────────────────────────────
@router.get("/reports/attendance")
async def report_attendance(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT b.id,b.batch_code,b.name,
        COUNT(DISTINCT a.date) sessions,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) avg_att,
        COUNT(DISTINCT CASE WHEN (
          SELECT AVG(CASE WHEN a2.present=1 THEN 100.0 ELSE 0 END)
          FROM attendance a2 WHERE a2.batch_id=b.id AND a2.candidate_id=a.candidate_id
        ) < 60 THEN a.candidate_id END) below60
        FROM batches b LEFT JOIN attendance a ON a.batch_id=b.id
        WHERE b.trainer_id=$1 GROUP BY b.id""", [user["id"]])


@router.get("/reports/batch")
async def report_batch(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT b.id,b.batch_code,b.name,b.status,
        COUNT(DISTINCT be.candidate_id) enrolled,
        COUNT(DISTINCT CASE WHEN be.status='completed' THEN be.candidate_id END) completed_count,
        COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) passed_count,
        COUNT(DISTINCT CASE WHEN be.status='dropped' THEN be.candidate_id END) dropout_count
        FROM batches b LEFT JOIN batch_enrollments be ON be.batch_id=b.id
        WHERE b.trainer_id=$1 GROUP BY b.id""", [user["id"]])


@router.get("/reports/dropout")
async def report_dropout(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT u.name,u.email,b.batch_code,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) att_pct,be.status
        FROM batch_enrollments be
        JOIN users u ON u.id=be.candidate_id JOIN batches b ON b.id=be.batch_id
        LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
        WHERE b.trainer_id=$1 AND be.status='enrolled'
        GROUP BY be.id,u.name,u.email,b.batch_code,be.status
        HAVING ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) < 70
        ORDER BY att_pct ASC LIMIT 20""", [user["id"]])


@router.get("/reports/assessment")
async def report_assessment(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT b.batch_code,b.name,
        COUNT(DISTINCT be.candidate_id) appeared,
        COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) pass_count,
        COUNT(DISTINCT CASE WHEN be.passed=0 THEN be.candidate_id END) fail_count,
        ROUND(AVG(be.assessment_score),1) avg_score
        FROM batches b JOIN batch_enrollments be ON be.batch_id=b.id
        WHERE b.trainer_id=$1 AND be.assessment_score IS NOT NULL
        GROUP BY b.id,b.batch_code,b.name""", [user["id"]])


@router.get("/reports/placement")
async def report_placement(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT u.name,b.batch_code,
        p.company AS company_name,p.job_title,p.location,p.ctc,p.status,
        p.placement_date AS placed_date
        FROM placements p JOIN users u ON u.id=p.candidate_id
        LEFT JOIN batch_enrollments be ON be.candidate_id=p.candidate_id
        LEFT JOIN batches b ON b.id=be.batch_id AND b.trainer_id=$1
        WHERE b.trainer_id=$2 ORDER BY p.placement_date DESC LIMIT 50""", [user["id"], user["id"]])


@router.get("/reports/scheme")
async def report_scheme(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT b.id,b.batch_code,b.name,b.scheme_type,b.status,
        COUNT(DISTINCT be.candidate_id) enrolled,
        COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) passed_count,
        COUNT(DISTINCT CASE WHEN be.status='completed' THEN be.candidate_id END) completed_count,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) avg_att
        FROM batches b
        LEFT JOIN batch_enrollments be ON be.batch_id=b.id
        LEFT JOIN attendance a ON a.batch_id=b.id
        WHERE b.trainer_id=$1
        GROUP BY b.id,b.batch_code,b.name,b.scheme_type,b.status
        ORDER BY b.scheme_type,b.start_date DESC""", [user["id"]])


@router.get("/cert-eligible")
async def cert_eligible(user: dict = Depends(auth_required)):
    _trainer_only(user)
    return await query("""SELECT u.name,u.email,b.batch_code,be.assessment_score,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) att_pct,be.passed,be.status
        FROM batch_enrollments be
        JOIN users u ON u.id=be.candidate_id JOIN batches b ON b.id=be.batch_id
        LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
        WHERE b.trainer_id=$1
        GROUP BY be.id,u.name,u.email,b.batch_code,be.assessment_score,be.passed,be.status
        ORDER BY u.name""", [user["id"]])


@router.post("/cert-issue", status_code=201)
async def cert_issue(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    email = body.get("email", "").strip()
    batch_code = body.get("batch_code", "").strip()
    if not email or not batch_code:
        raise HTTPException(400, detail="email and batch_code are required")
    candidate = await query_one("SELECT id,name FROM users WHERE email=$1", [email])
    if not candidate:
        raise HTTPException(404, detail="Candidate not found")
    batch = await query_one("SELECT id,name FROM batches WHERE batch_code=$1 AND trainer_id=$2", [batch_code, user["id"]])
    if not batch:
        raise HTTPException(404, detail="Batch not found or not yours")
    await execute("""CREATE TABLE IF NOT EXISTS candidate_certificates (
        id SERIAL PRIMARY KEY, candidate_id INTEGER NOT NULL, batch_id INTEGER,
        cert_no TEXT UNIQUE NOT NULL, issued_by INTEGER,
        issued_at TIMESTAMPTZ DEFAULT NOW(), status TEXT DEFAULT 'issued'
    )""")
    import time as _t
    cert_no = f"CERT-{batch_code}-{candidate['id']}-{int(_t.time())}"
    existing = await query_one("SELECT id FROM candidate_certificates WHERE candidate_id=$1 AND batch_id=$2", [candidate["id"], batch["id"]])
    if existing:
        raise HTTPException(409, detail="Certificate already issued for this learner and batch")
    row = await execute_returning(
        "INSERT INTO candidate_certificates (candidate_id,batch_id,cert_no,issued_by) VALUES ($1,$2,$3,$4) RETURNING id,cert_no",
        [candidate["id"], batch["id"], cert_no, user["id"]])
    return {"ok": True, "cert_no": row["cert_no"], "candidate": candidate["name"]}


@router.get("/cert-issued")
async def cert_issued(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("""CREATE TABLE IF NOT EXISTS candidate_certificates (
        id SERIAL PRIMARY KEY, candidate_id INTEGER NOT NULL, batch_id INTEGER,
        cert_no TEXT UNIQUE NOT NULL, issued_by INTEGER,
        issued_at TIMESTAMPTZ DEFAULT NOW(), status TEXT DEFAULT 'issued'
    )""")
    return await query("""SELECT cc.cert_no,cc.issued_at,cc.status,u.name,u.email,b.batch_code
        FROM candidate_certificates cc
        JOIN users u ON u.id=cc.candidate_id
        LEFT JOIN batches b ON b.id=cc.batch_id
        WHERE cc.issued_by=$1 ORDER BY cc.issued_at DESC""", [user["id"]])


@router.get("/cert-verify")
async def cert_verify(cert_no: str, user: dict = Depends(auth_required)):
    _trainer_only(user)
    if not cert_no: raise HTTPException(400, detail="cert_no is required")
    cert = await query_one("""SELECT cc.*,u.name as candidate_name,u.email
        FROM candidate_certificates cc JOIN users u ON u.id=cc.candidate_id
        WHERE cc.cert_no=$1""", [cert_no.strip()])
    if not cert: raise HTTPException(404, detail="Certificate not found")
    return cert


@router.get("/notifications")
async def trainer_notifications(user: dict = Depends(auth_required)):
    _trainer_only(user)
    from datetime import date, timedelta
    tid = user["id"]
    today = date.today().isoformat()
    in7  = (date.today() + timedelta(days=7)).isoformat()
    in14 = (date.today() + timedelta(days=14)).isoformat()
    since3 = (date.today() - timedelta(days=3)).isoformat()
    items = []

    for s in await query("SELECT s.topic,b.batch_code FROM trainer_sessions s JOIN batches b ON b.id=s.batch_id WHERE s.trainer_id=$1 AND s.session_date=$2 ORDER BY s.start_time", [tid, today]):
        items.append({"color": "gold", "icon": "📅", "title": f"Session today: {s['topic']} ({s['batch_code']})", "meta": "Today"})

    for a in await query("SELECT a.type,a.date,b.batch_code FROM trainer_assessments a JOIN batches b ON b.id=a.batch_id WHERE a.trainer_id=$1 AND a.date BETWEEN $2 AND $3 ORDER BY a.date", [tid, today, in7]):
        items.append({"color": "blue", "icon": "📝", "title": f"{a['type']} assessment for {a['batch_code']} on {a['date']}", "meta": str(a['date'])})

    at_risk = await query("""SELECT COUNT(DISTINCT be.candidate_id) cnt FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id
        LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
        WHERE b.trainer_id=$1 AND be.status='enrolled'
        GROUP BY be.candidate_id HAVING ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) < 70""", [tid])
    if at_risk:
        n = len(at_risk)
        items.append({"color": "red", "icon": "⚠️", "title": f"{n} learner{'s are' if n>1 else ' is'} below 70% attendance and at risk", "meta": "Action required"})

    for b in await query("SELECT batch_code,end_date FROM batches WHERE trainer_id=$1 AND status='active' AND end_date BETWEEN $2 AND $3", [tid, today, in14]):
        items.append({"color": "purple", "icon": "🏁", "title": f"Batch {b['batch_code']} ends on {b['end_date']}", "meta": str(b['end_date'])})

    for s in await query("""SELECT s.topic,s.session_date,b.batch_code FROM trainer_sessions s JOIN batches b ON b.id=s.batch_id
        WHERE s.trainer_id=$1 AND s.session_date BETWEEN $2 AND $3 AND s.session_date < $4 ORDER BY s.session_date DESC LIMIT 3""", [tid, since3, today, today]):
        items.append({"color": "green", "icon": "✅", "title": f"Session conducted: {s['topic']} ({s['batch_code']})", "meta": str(s['session_date'])})

    open_tickets = await query_one("SELECT COUNT(*) cnt FROM trainer_support_tickets WHERE trainer_id=$1 AND status='Open'", [tid])
    ot = int(open_tickets["cnt"] or 0) if open_tickets else 0
    if ot: items.append({"color": "teal", "icon": "🎧", "title": f"{ot} open support ticket{'s' if ot>1 else ''} awaiting response", "meta": "Help & Support"})

    eligible = await query_one("SELECT COUNT(*) cnt FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=$1 AND be.passed=1", [tid])
    el = int(eligible["cnt"] or 0) if eligible else 0
    if el: items.append({"color": "gold", "icon": "🏆", "title": f"{el} learner{'s are' if el>1 else ' is'} eligible for certificate issuance", "meta": "Certificates → Issue"})

    if not items:
        items.append({"color": "green", "icon": "✅", "title": "All caught up! No pending actions.", "meta": "System"})
    return items


# ── Announcements ───────────────────────────────────────────────────────────────
@router.get("/announcements")
async def get_announcements(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("""CREATE TABLE IF NOT EXISTS trainer_announcements (
        id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL,
        batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        title TEXT NOT NULL, message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'Normal',
        sent_at TIMESTAMPTZ DEFAULT NOW()
    )""")
    return await query("SELECT a.*, b.batch_code FROM trainer_announcements a LEFT JOIN batches b ON b.id=a.batch_id WHERE a.trainer_id=$1 ORDER BY a.sent_at DESC LIMIT 50", [user["id"]])

@router.post("/announcements", status_code=201)
async def add_announcement(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("""CREATE TABLE IF NOT EXISTS trainer_announcements (
        id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL,
        batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        title TEXT NOT NULL, message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'Normal',
        sent_at TIMESTAMPTZ DEFAULT NOW()
    )""")
    row = await query_one(
        "INSERT INTO trainer_announcements (trainer_id,batch_id,title,message,priority) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [user["id"], body.get("batch_id"), body["title"], body["message"], body.get("priority","Normal")]
    )
    return row

@router.delete("/announcements/{aid}")
async def del_announcement(aid: int, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("DELETE FROM trainer_announcements WHERE id=$1 AND trainer_id=$2", [aid, user["id"]])
    return {"ok": True}


# ── Bank Details ────────────────────────────────────────────────────────────────
@router.get("/bank-details")
async def get_bank_details(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("""CREATE TABLE IF NOT EXISTS trainer_bank_details (
        id SERIAL PRIMARY KEY, trainer_id INTEGER UNIQUE NOT NULL,
        account_name TEXT, account_no TEXT, ifsc TEXT,
        bank_name TEXT, branch TEXT, upi_id TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )""")
    row = await query_one("SELECT * FROM trainer_bank_details WHERE trainer_id=$1", [user["id"]])
    return row or {}

@router.put("/bank-details")
async def save_bank_details(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute("""CREATE TABLE IF NOT EXISTS trainer_bank_details (
        id SERIAL PRIMARY KEY, trainer_id INTEGER UNIQUE NOT NULL,
        account_name TEXT, account_no TEXT, ifsc TEXT,
        bank_name TEXT, branch TEXT, upi_id TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )""")
    await execute("""INSERT INTO trainer_bank_details (trainer_id,account_name,account_no,ifsc,bank_name,branch,upi_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (trainer_id) DO UPDATE SET
            account_name=EXCLUDED.account_name, account_no=EXCLUDED.account_no,
            ifsc=EXCLUDED.ifsc, bank_name=EXCLUDED.bank_name,
            branch=EXCLUDED.branch, upi_id=EXCLUDED.upi_id,
            updated_at=NOW()""",
        [user["id"], body.get("account_name"), body.get("account_no"), body.get("ifsc"),
         body.get("bank_name"), body.get("branch"), body.get("upi_id")])
    return {"ok": True}


# ── Feedback & Ratings ────────────────────────────────────────────────────────
_FEEDBACK_DDL = """CREATE TABLE IF NOT EXISTS trainer_session_feedback (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL,
    batch_id INTEGER,
    candidate_id INTEGER,
    session_topic TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
)"""

@router.get("/feedback/sessions")
async def get_session_feedback(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute(_FEEDBACK_DDL)
    return await query("""SELECT f.*, u.name AS candidate_name, b.batch_code
        FROM trainer_session_feedback f
        LEFT JOIN users u ON u.id=f.candidate_id
        LEFT JOIN batches b ON b.id=f.batch_id
        WHERE f.trainer_id=$1
        ORDER BY f.submitted_at DESC LIMIT 100""", [user["id"]])

@router.get("/feedback/rating-summary")
async def get_rating_summary(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute(_FEEDBACK_DDL)
    row = await query_one("""SELECT
        ROUND(AVG(rating)::numeric, 2) AS avg_rating,
        COUNT(*) AS total_reviews,
        COUNT(CASE WHEN rating=5 THEN 1 END) AS five_star,
        COUNT(CASE WHEN rating=4 THEN 1 END) AS four_star,
        COUNT(CASE WHEN rating=3 THEN 1 END) AS three_star,
        COUNT(CASE WHEN rating=2 THEN 1 END) AS two_star,
        COUNT(CASE WHEN rating=1 THEN 1 END) AS one_star
        FROM trainer_session_feedback WHERE trainer_id=$1""", [user["id"]])
    return row or {"avg_rating": None, "total_reviews": 0,
                   "five_star":0,"four_star":0,"three_star":0,"two_star":0,"one_star":0}

@router.post("/feedback", status_code=201)
async def submit_feedback(body: dict, user: dict = Depends(auth_required)):
    """Candidates call this to rate a trainer's session."""
    await execute(_FEEDBACK_DDL)
    trainer_id = body.get("trainer_id")
    if not trainer_id or not body.get("rating"):
        raise HTTPException(400, detail="trainer_id and rating are required")
    row = await execute_returning("""INSERT INTO trainer_session_feedback
        (trainer_id,batch_id,candidate_id,session_topic,rating,comment)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING id""",
        [trainer_id, body.get("batch_id"), user["id"],
         body.get("session_topic"), int(body["rating"]), body.get("comment")])
    return {"id": row["id"]}


# ── Payments ──────────────────────────────────────────────────────────────────
_PAYMENTS_DDL = """CREATE TABLE IF NOT EXISTS trainer_payments (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL,
    batch_id INTEGER,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE,
    reference_no TEXT,
    payment_mode TEXT DEFAULT 'Bank Transfer',
    description TEXT,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMPTZ DEFAULT NOW()
)"""

@router.get("/payments/history")
async def payment_history(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute(_PAYMENTS_DDL)
    return await query("""SELECT p.*, b.batch_code, b.name AS batch_name
        FROM trainer_payments p
        LEFT JOIN batches b ON b.id=p.batch_id
        WHERE p.trainer_id=$1 ORDER BY p.payment_date DESC LIMIT 100""", [user["id"]])

@router.get("/payments/pending")
async def payment_pending(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute(_PAYMENTS_DDL)
    # Pending = completed batches with learners but no payment recorded yet
    completed_batches = await query("""SELECT b.id,b.batch_code,b.name,b.end_date,
        COUNT(DISTINCT be.candidate_id) AS learner_count
        FROM batches b
        JOIN batch_enrollments be ON be.batch_id=b.id
        WHERE b.trainer_id=$1 AND b.status IN ('completed','active')
        GROUP BY b.id,b.batch_code,b.name,b.end_date""", [user["id"]])
    paid_batch_ids = {r["batch_id"] for r in await query(
        "SELECT DISTINCT batch_id FROM trainer_payments WHERE trainer_id=$1 AND batch_id IS NOT NULL", [user["id"]]
    )}
    pending = [b for b in completed_batches if b["id"] not in paid_batch_ids]
    return {"pending": pending, "paid_batch_ids": list(paid_batch_ids)}

@router.post("/payments", status_code=201)
async def add_payment(body: dict, user: dict = Depends(require_role("admin", "administrator", "superadmin"))):
    """Admin records a payment for a trainer."""
    await execute(_PAYMENTS_DDL)
    if not body.get("trainer_id") or not body.get("amount"):
        raise HTTPException(400, detail="trainer_id and amount are required")
    row = await execute_returning("""INSERT INTO trainer_payments
        (trainer_id,batch_id,amount,payment_date,reference_no,payment_mode,description,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id""",
        [body["trainer_id"], body.get("batch_id"), body["amount"],
         body.get("payment_date"), body.get("reference_no"),
         body.get("payment_mode","Bank Transfer"), body.get("description"),
         body.get("status","paid")])
    return {"id": row["id"]}


# ── Job Referrals ─────────────────────────────────────────────────────────────
_REFERRALS_DDL = """CREATE TABLE IF NOT EXISTS trainer_job_referrals (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL,
    candidate_email TEXT NOT NULL,
    candidate_id INTEGER,
    job_id INTEGER,
    job_title TEXT,
    company TEXT,
    note TEXT,
    status TEXT DEFAULT 'sent',
    referred_at TIMESTAMPTZ DEFAULT NOW()
)"""

@router.get("/referrals")
async def get_referrals(user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute(_REFERRALS_DDL)
    return await query("""SELECT r.*, u.name AS candidate_name
        FROM trainer_job_referrals r
        LEFT JOIN users u ON u.email=r.candidate_email
        WHERE r.trainer_id=$1 ORDER BY r.referred_at DESC""", [user["id"]])

@router.post("/referrals", status_code=201)
async def add_referral(body: dict, user: dict = Depends(auth_required)):
    _trainer_only(user)
    await execute(_REFERRALS_DDL)
    email = (body.get("candidate_email") or "").strip()
    job_title = (body.get("job_title") or "").strip()
    if not email or not job_title:
        raise HTTPException(400, detail="candidate_email and job_title are required")
    candidate = await query_one("SELECT id FROM users WHERE email=$1", [email])
    row = await execute_returning("""INSERT INTO trainer_job_referrals
        (trainer_id,candidate_email,candidate_id,job_id,job_title,company,note)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id""",
        [user["id"], email, candidate["id"] if candidate else None,
         body.get("job_id"), job_title, body.get("company"), body.get("note")])
    return {"id": row["id"], "ok": True}
