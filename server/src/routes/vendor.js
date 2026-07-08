const express = require('express');
const { db, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function vendorOnly(req, res, next) {
  if (req.user.role !== 'training_vendor') return res.status(403).json({ error: 'Training vendor only' });
  next();
}

const auth = [authRequired, vendorOnly];

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', auth, (req, res) => {
  const vid = req.user.id;
  const centres = db.prepare('SELECT COUNT(*) c FROM vendor_centres WHERE vendor_id=? AND status!=?').get(vid, 'deleted').c;
  const trainers = db.prepare('SELECT COUNT(*) c FROM vendor_trainers WHERE vendor_id=? AND status=?').get(vid, 'active').c;
  const batches  = db.prepare("SELECT COUNT(*) c FROM vendor_batches WHERE vendor_id=? AND status IN ('active','upcoming')").get(vid).c;
  const candidates = db.prepare("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=? AND status='active'").get(vid).c;
  const docs_pending = db.prepare("SELECT COUNT(*) c FROM vendor_documents WHERE vendor_id=? AND status='expiring'").get(vid).c;
  const tickets_open = db.prepare("SELECT COUNT(*) c FROM vendor_grievances WHERE vendor_id=? AND status='open'").get(vid).c;
  res.json({ centres, trainers, batches, candidates, docs_pending, tickets_open });
});

// ── Centres ──────────────────────────────────────────────────────────────────
router.get('/centres', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM vendor_centres WHERE vendor_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

router.post('/centres', auth, (req, res) => {
  const { name, address, state_name, district, city, pincode, geo, classrooms, labs,
          seating_capacity, internet, power_backup, accessibility, equipment } = req.body;
  if (!name) return res.status(400).json({ error: 'Centre name required' });
  const info = db.prepare(`INSERT INTO vendor_centres
    (vendor_id,name,address,state_name,district,city,pincode,geo,classrooms,labs,
     seating_capacity,internet,power_backup,accessibility,equipment)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, name, address, state_name, district, city, pincode, geo,
         classrooms||0, labs||0, seating_capacity||0, internet, power_backup, accessibility, equipment);
  logAudit({ user: req.user, action: 'centre_created', entity: 'vendor_centre', entityId: info.lastInsertRowid });
  res.json({ id: info.lastInsertRowid });
});

router.put('/centres/:id', auth, (req, res) => {
  const { name, address, state_name, district, city, pincode, geo, classrooms, labs,
          seating_capacity, internet, power_backup, accessibility, equipment, status } = req.body;
  db.prepare(`UPDATE vendor_centres SET
    name=?,address=?,state_name=?,district=?,city=?,pincode=?,geo=?,classrooms=?,labs=?,
    seating_capacity=?,internet=?,power_backup=?,accessibility=?,equipment=?,status=COALESCE(?,status)
    WHERE id=? AND vendor_id=?`)
    .run(name, address, state_name, district, city, pincode, geo,
         classrooms||0, labs||0, seating_capacity||0, internet, power_backup, accessibility, equipment,
         status||null, req.params.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/centres/:id', auth, (req, res) => {
  db.prepare('UPDATE vendor_centres SET status=? WHERE id=? AND vendor_id=?').run('deleted', req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Trainers ──────────────────────────────────────────────────────────────────
router.get('/trainers', auth, (req, res) => {
  const rows = db.prepare(`SELECT t.*, c.name AS centre_name FROM vendor_trainers t
    LEFT JOIN vendor_centres c ON c.id=t.centre_id
    WHERE t.vendor_id=? AND t.status!='deleted' ORDER BY t.created_at DESC`).all(req.user.id);
  res.json(rows);
});

router.post('/trainers', auth, (req, res) => {
  const { name, email, mobile, qualification, sector, experience_years, nsqf_level, centre_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Trainer name required' });
  const info = db.prepare(`INSERT INTO vendor_trainers
    (vendor_id,centre_id,name,email,mobile,qualification,sector,experience_years,nsqf_level)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, centre_id||null, name, email, mobile, qualification, sector, experience_years||0, nsqf_level);
  res.json({ id: info.lastInsertRowid });
});

router.put('/trainers/:id', auth, (req, res) => {
  const { name, email, mobile, qualification, sector, experience_years, nsqf_level, centre_id, status } = req.body;
  db.prepare(`UPDATE vendor_trainers SET
    name=COALESCE(?,name),email=COALESCE(?,email),mobile=COALESCE(?,mobile),
    qualification=COALESCE(?,qualification),sector=COALESCE(?,sector),
    experience_years=COALESCE(?,experience_years),nsqf_level=COALESCE(?,nsqf_level),
    centre_id=COALESCE(?,centre_id),status=COALESCE(?,status) WHERE id=? AND vendor_id=?`)
    .run(name||null, email||null, mobile||null, qualification||null, sector||null,
         experience_years!=null?experience_years:null, nsqf_level||null,
         centre_id||null, status||null, req.params.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/trainers/:id', auth, (req, res) => {
  db.prepare('UPDATE vendor_trainers SET status=? WHERE id=? AND vendor_id=?').run('deleted', req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Courses ───────────────────────────────────────────────────────────────────
router.get('/courses', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM vendor_courses WHERE vendor_id=? AND status!=? ORDER BY created_at DESC').all(req.user.id, 'deleted');
  res.json(rows);
});

router.post('/courses', auth, (req, res) => {
  const { title, sector, qp_code, nos_code, nsqf_level, duration_hours, fee_type, fee_amount, scheme } = req.body;
  if (!title) return res.status(400).json({ error: 'Course title required' });
  const info = db.prepare(`INSERT INTO vendor_courses
    (vendor_id,title,sector,qp_code,nos_code,nsqf_level,duration_hours,fee_type,fee_amount,scheme)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, title, sector, qp_code, nos_code, nsqf_level, duration_hours||0, fee_type||'fee-based', fee_amount||0, scheme);
  res.json({ id: info.lastInsertRowid });
});

router.put('/courses/:id', auth, (req, res) => {
  const { title, sector, qp_code, nos_code, nsqf_level, duration_hours, fee_type, fee_amount, scheme, status } = req.body;
  db.prepare(`UPDATE vendor_courses SET
    title=?,sector=?,qp_code=?,nos_code=?,nsqf_level=?,duration_hours=?,fee_type=?,fee_amount=?,
    scheme=?,status=COALESCE(?,status) WHERE id=? AND vendor_id=?`)
    .run(title, sector, qp_code, nos_code, nsqf_level, duration_hours||0, fee_type, fee_amount||0,
         scheme, status||null, req.params.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/courses/:id', auth, (req, res) => {
  db.prepare('UPDATE vendor_courses SET status=? WHERE id=? AND vendor_id=?').run('deleted', req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Batches ───────────────────────────────────────────────────────────────────
router.get('/batches', auth, (req, res) => {
  const rows = db.prepare(`SELECT b.*,
    c.name AS centre_name, vc.title AS course_title, t.name AS trainer_name
    FROM vendor_batches b
    LEFT JOIN vendor_centres c ON c.id=b.centre_id
    LEFT JOIN vendor_courses vc ON vc.id=b.course_id
    LEFT JOIN vendor_trainers t ON t.id=b.trainer_id
    WHERE b.vendor_id=? ORDER BY b.created_at DESC`).all(req.user.id);
  res.json(rows);
});

router.post('/batches', auth, (req, res) => {
  const { centre_id, course_id, batch_code, start_date, end_date, capacity, trainer_id } = req.body;
  const code = batch_code || `BT-${Date.now().toString().slice(-6)}`;
  const info = db.prepare(`INSERT INTO vendor_batches
    (vendor_id,centre_id,course_id,batch_code,start_date,end_date,capacity,trainer_id,status)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, centre_id||null, course_id||null, code, start_date, end_date, capacity||30, trainer_id||null, 'upcoming');
  res.json({ id: info.lastInsertRowid, batch_code: code });
});

router.put('/batches/:id', auth, (req, res) => {
  const { centre_id, course_id, batch_code, start_date, end_date, capacity, trainer_id, status } = req.body;
  db.prepare(`UPDATE vendor_batches SET
    centre_id=?,course_id=?,batch_code=?,start_date=?,end_date=?,capacity=?,
    trainer_id=?,status=COALESCE(?,status) WHERE id=? AND vendor_id=?`)
    .run(centre_id||null, course_id||null, batch_code, start_date, end_date, capacity||30,
         trainer_id||null, status||null, req.params.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/batches/:id', auth, (req, res) => {
  db.prepare('UPDATE vendor_batches SET status=? WHERE id=? AND vendor_id=?').run('cancelled', req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Candidates ────────────────────────────────────────────────────────────────
router.get('/candidates', auth, (req, res) => {
  const { batch_id } = req.query;
  let q = 'SELECT vc.*, vb.batch_code, vco.title AS course_title FROM vendor_candidates vc LEFT JOIN vendor_batches vb ON vb.id=vc.batch_id LEFT JOIN vendor_courses vco ON vco.id=vb.course_id WHERE vc.vendor_id=?';
  const params = [req.user.id];
  if (batch_id) { q += ' AND vc.batch_id=?'; params.push(batch_id); }
  q += ' ORDER BY vc.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

router.post('/candidates', auth, (req, res) => {
  const { name, mobile, aadhaar_masked, dob, gender, category, scheme, batch_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Candidate name required' });
  const info = db.prepare(`INSERT INTO vendor_candidates
    (vendor_id,batch_id,name,mobile,aadhaar_masked,dob,gender,category,scheme)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, batch_id||null, name, mobile, aadhaar_masked, dob, gender, category, scheme);
  if (batch_id) {
    db.prepare('UPDATE vendor_batches SET enrolled=enrolled+1 WHERE id=?').run(batch_id);
  }
  res.json({ id: info.lastInsertRowid });
});

router.put('/candidates/:id', auth, (req, res) => {
  const { name, mobile, aadhaar_masked, dob, gender, category, scheme, batch_id, status, attendance_pct, placement_status } = req.body;
  db.prepare(`UPDATE vendor_candidates SET
    name=COALESCE(?,name),mobile=COALESCE(?,mobile),aadhaar_masked=COALESCE(?,aadhaar_masked),
    dob=COALESCE(?,dob),gender=COALESCE(?,gender),category=COALESCE(?,category),
    scheme=COALESCE(?,scheme),batch_id=COALESCE(?,batch_id),
    status=COALESCE(?,status),attendance_pct=COALESCE(?,attendance_pct),placement_status=COALESCE(?,placement_status)
    WHERE id=? AND vendor_id=?`)
    .run(name||null, mobile||null, aadhaar_masked||null, dob||null, gender||null, category||null,
         scheme||null, batch_id||null,
         status||null, attendance_pct!=null?attendance_pct:null, placement_status||null,
         req.params.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/candidates/:id', auth, (req, res) => {
  db.prepare('UPDATE vendor_candidates SET status=? WHERE id=? AND vendor_id=?').run('withdrawn', req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Assessments ───────────────────────────────────────────────────────────────
router.get('/assessments', auth, (req, res) => {
  const rows = db.prepare(`SELECT a.*, vb.batch_code, vc.title AS course_title FROM vendor_assessments a
    LEFT JOIN vendor_batches vb ON vb.id=a.batch_id
    LEFT JOIN vendor_courses vc ON vc.id=vb.course_id
    WHERE a.vendor_id=? ORDER BY a.created_at DESC`).all(req.user.id);
  res.json(rows);
});

router.post('/assessments', auth, (req, res) => {
  const { batch_id, agency, scheduled_date, time_slot, candidate_count } = req.body;
  const info = db.prepare(`INSERT INTO vendor_assessments
    (vendor_id,batch_id,agency,scheduled_date,time_slot,candidate_count)
    VALUES (?,?,?,?,?,?)`)
    .run(req.user.id, batch_id||null, agency, scheduled_date, time_slot, candidate_count||0);
  res.json({ id: info.lastInsertRowid });
});

router.put('/assessments/:id', auth, (req, res) => {
  const { agency, scheduled_date, time_slot, candidate_count, results, status } = req.body;
  db.prepare(`UPDATE vendor_assessments SET
    agency=?,scheduled_date=?,time_slot=?,candidate_count=?,
    results=COALESCE(?,results),status=COALESCE(?,status) WHERE id=? AND vendor_id=?`)
    .run(agency, scheduled_date, time_slot, candidate_count||0,
         results ? JSON.stringify(results) : null, status||null,
         req.params.id, req.user.id);
  res.json({ ok: true });
});

router.delete('/assessments/:id', auth, (req, res) => {
  db.prepare('UPDATE vendor_assessments SET status=? WHERE id=? AND vendor_id=?').run('cancelled', req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Documents ─────────────────────────────────────────────────────────────────
router.get('/documents', auth, (req, res) => {
  const rows = db.prepare('SELECT id,doc_type,filename,expiry_date,status,created_at FROM vendor_documents WHERE vendor_id=? ORDER BY doc_type').all(req.user.id);
  res.json(rows);
});

router.post('/documents', auth, (req, res) => {
  const { doc_type, filename, file_data, expiry_date } = req.body;
  const existing = db.prepare('SELECT id FROM vendor_documents WHERE vendor_id=? AND doc_type=?').get(req.user.id, doc_type);
  if (existing) {
    db.prepare('UPDATE vendor_documents SET filename=?,file_data=?,expiry_date=?,status=?,created_at=datetime("now") WHERE id=?')
      .run(filename, file_data||null, expiry_date||null, 'uploaded', existing.id);
    return res.json({ id: existing.id, updated: true });
  }
  const info = db.prepare('INSERT INTO vendor_documents (vendor_id,doc_type,filename,file_data,expiry_date,status) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, doc_type, filename, file_data||null, expiry_date||null, 'uploaded');
  res.json({ id: info.lastInsertRowid });
});

router.delete('/documents/:id', auth, (req, res) => {
  db.prepare('DELETE FROM vendor_documents WHERE id=? AND vendor_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Grievances ────────────────────────────────────────────────────────────────
router.get('/grievances', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM vendor_grievances WHERE vendor_id=? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

router.post('/grievances', auth, (req, res) => {
  const { category, priority, subject, details } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject required' });
  const ticket_no = `TK-${Date.now().toString().slice(-6)}`;
  const info = db.prepare('INSERT INTO vendor_grievances (vendor_id,ticket_no,category,priority,subject,details) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, ticket_no, category, priority||'normal', subject, details);
  res.json({ id: info.lastInsertRowid, ticket_no });
});

router.put('/grievances/:id', auth, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE vendor_grievances SET status=? WHERE id=? AND vendor_id=?').run(status, req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
