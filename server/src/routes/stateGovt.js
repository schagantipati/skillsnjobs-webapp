const express = require('express');
const { db, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Only state_government role can access these endpoints
function stateOnly(req, res, next) {
  if (!['state_government', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'State government access required' });
  }
  next();
}

// ── DASHBOARD STATS ──
router.get('/stats', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const tpCount = db.prepare('SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=?').get(uid).c;
  const tpActive = db.prepare("SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=? AND status='verified'").get(uid).c;
  const tpPending = db.prepare("SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=? AND status='pending'").get(uid).c;
  const candTotal = db.prepare('SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=?').get(uid).c;
  const candCertified = db.prepare("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=? AND certification_status='certified'").get(uid).c;
  const candPlaced = db.prepare("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=? AND placement_status='placed'").get(uid).c;
  const candDropped = db.prepare("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=? AND status='dropped'").get(uid).c;
  const disbTotal = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=? AND status='disbursed'").get(uid).s;
  const disbPending = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=? AND status='pending'").get(uid).s;
  const grievOpen = db.prepare("SELECT COUNT(*) c FROM sg_grievances WHERE state_user_id=? AND status='open'").get(uid).c;
  const notifUnread = db.prepare('SELECT COUNT(*) c FROM sg_notifications WHERE state_user_id=? AND is_read=0').get(uid).c;
  const schemes = db.prepare('SELECT * FROM sg_schemes WHERE is_active=1').all();

  res.json({
    tpCount, tpActive, tpPending,
    candTotal, candCertified, candPlaced, candDropped,
    disbTotal, disbPending,
    grievOpen, notifUnread,
    schemes,
    certRate: candTotal ? Math.round((candCertified / candTotal) * 100) : 0,
    placementRate: candCertified ? Math.round((candPlaced / candCertified) * 100) : 0,
  });
});

// ── TRAINING PARTNERS ──
router.get('/training-partners', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { status, scheme, q } = req.query;
  let sql = 'SELECT * FROM sg_training_partners WHERE state_user_id=?';
  const params = [uid];
  if (status) { sql += ' AND status=?'; params.push(status); }
  if (scheme) { sql += ' AND scheme=?'; params.push(scheme); }
  if (q) { sql += ' AND name LIKE ?'; params.push(`%${q}%`); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/training-partners', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { name, type, district, state_name, nsdc_code, email, mobile, scheme, accreditation, accreditation_expiry } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const info = db.prepare(
    `INSERT INTO sg_training_partners (state_user_id,name,type,district,state_name,nsdc_code,email,mobile,scheme,accreditation,accreditation_expiry,status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')`
  ).run(uid, name, type, district, state_name, nsdc_code, email, mobile, scheme, accreditation, accreditation_expiry);
  logAudit({ user: req.user, action: 'TP Created', entity: 'sg_training_partners', entityId: info.lastInsertRowid, detail: name });
  res.json({ id: info.lastInsertRowid });
});

router.put('/training-partners/:id', authRequired, stateOnly, (req, res) => {
  const { status, name, type, district, scheme, accreditation, accreditation_expiry, centre_count, trainee_count } = req.body;
  db.prepare(
    `UPDATE sg_training_partners SET status=COALESCE(?,status), name=COALESCE(?,name), type=COALESCE(?,type),
     district=COALESCE(?,district), scheme=COALESCE(?,scheme), accreditation=COALESCE(?,accreditation),
     accreditation_expiry=COALESCE(?,accreditation_expiry), centre_count=COALESCE(?,centre_count), trainee_count=COALESCE(?,trainee_count)
     WHERE id=? AND state_user_id=?`
  ).run(status, name, type, district, scheme, accreditation, accreditation_expiry, centre_count, trainee_count, req.params.id, req.user.id);
  logAudit({ user: req.user, action: 'TP Updated', entity: 'sg_training_partners', entityId: req.params.id });
  res.json({ ok: true });
});

// ── CANDIDATES / BENEFICIARIES ──
router.get('/candidates', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { scheme, district, status, q } = req.query;
  let sql = 'SELECT c.*, t.name as tp_name FROM sg_candidates c LEFT JOIN sg_training_partners t ON t.id=c.tp_id WHERE c.state_user_id=?';
  const params = [uid];
  if (scheme) { sql += ' AND c.scheme=?'; params.push(scheme); }
  if (district) { sql += ' AND c.district=?'; params.push(district); }
  if (status) { sql += ' AND c.status=?'; params.push(status); }
  if (q) { sql += ' AND (c.name LIKE ? OR c.candidate_ref LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY c.created_at DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

router.post('/candidates', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { name, gender, dob, district, state_name, mobile, aadhaar_masked, scheme, course, tp_id, batch_code, enroll_date } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const ref = `SKL-${(req.user.state_name || 'ST').substring(0,2).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const info = db.prepare(
    `INSERT INTO sg_candidates (state_user_id,candidate_ref,name,gender,dob,district,state_name,mobile,aadhaar_masked,scheme,course,tp_id,batch_code,enroll_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(uid, ref, name, gender, dob, district, state_name, mobile, aadhaar_masked, scheme, course, tp_id || null, batch_code, enroll_date || new Date().toISOString().split('T')[0]);
  logAudit({ user: req.user, action: 'Candidate Enrolled', entity: 'sg_candidates', entityId: info.lastInsertRowid, detail: name });
  res.json({ id: info.lastInsertRowid, candidate_ref: ref });
});

router.put('/candidates/:id', authRequired, stateOnly, (req, res) => {
  const { status, assessment_status, certification_status, placement_status, employer_name, salary, dropout_reason } = req.body;
  db.prepare(
    `UPDATE sg_candidates SET status=COALESCE(?,status), assessment_status=COALESCE(?,assessment_status),
     certification_status=COALESCE(?,certification_status), placement_status=COALESCE(?,placement_status),
     employer_name=COALESCE(?,employer_name), salary=COALESCE(?,salary), dropout_reason=COALESCE(?,dropout_reason)
     WHERE id=? AND state_user_id=?`
  ).run(status, assessment_status, certification_status, placement_status, employer_name, salary, dropout_reason, req.params.id, req.user.id);
  logAudit({ user: req.user, action: 'Candidate Updated', entity: 'sg_candidates', entityId: req.params.id });
  res.json({ ok: true });
});

// ── TARGETS ──
router.get('/targets', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { fy } = req.query;
  let sql = `SELECT t.*, s.code, s.name as scheme_name FROM sg_targets t JOIN sg_schemes s ON s.id=t.scheme_id WHERE t.state_user_id=?`;
  const params = [uid];
  if (fy) { sql += ' AND t.fy=?'; params.push(fy); }
  res.json(db.prepare(sql).all(...params));
});

router.post('/targets', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { scheme_id, fy, annual_target, q1_target, q2_target, q3_target, q4_target } = req.body;
  const info = db.prepare(
    `INSERT OR REPLACE INTO sg_targets (state_user_id,scheme_id,fy,annual_target,q1_target,q2_target,q3_target,q4_target)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(uid, scheme_id, fy, annual_target, q1_target || 0, q2_target || 0, q3_target || 0, q4_target || 0);
  res.json({ id: info.lastInsertRowid });
});

router.put('/targets/:id/achievement', authRequired, stateOnly, (req, res) => {
  const { q1_achieved, q2_achieved, q3_achieved, q4_achieved } = req.body;
  db.prepare(
    `UPDATE sg_targets SET q1_achieved=COALESCE(?,q1_achieved), q2_achieved=COALESCE(?,q2_achieved),
     q3_achieved=COALESCE(?,q3_achieved), q4_achieved=COALESCE(?,q4_achieved)
     WHERE id=? AND state_user_id=?`
  ).run(q1_achieved, q2_achieved, q3_achieved, q4_achieved, req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── DISBURSEMENTS ──
router.get('/disbursements', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const rows = db.prepare(
    `SELECT d.*, t.name as tp_name FROM sg_disbursements d LEFT JOIN sg_training_partners t ON t.id=d.tp_id
     WHERE d.state_user_id=? ORDER BY d.created_at DESC LIMIT 100`
  ).all(uid);
  const summary = db.prepare(
    `SELECT status, COALESCE(SUM(amount),0) total FROM sg_disbursements WHERE state_user_id=? GROUP BY status`
  ).all(uid);
  res.json({ disbursements: rows, summary });
});

router.post('/disbursements', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { tp_id, scheme, amount, tranche, fy, disbursed_date, reference_no, remarks } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount is required' });
  const info = db.prepare(
    `INSERT INTO sg_disbursements (state_user_id,tp_id,scheme,amount,tranche,fy,disbursed_date,reference_no,remarks,status)
     VALUES (?,?,?,?,?,?,?,?,?,'pending')`
  ).run(uid, tp_id || null, scheme, amount, tranche, fy, disbursed_date, reference_no, remarks);
  logAudit({ user: req.user, action: 'Disbursement Initiated', entity: 'sg_disbursements', entityId: info.lastInsertRowid, detail: `₹${amount}` });
  res.json({ id: info.lastInsertRowid });
});

router.put('/disbursements/:id/status', authRequired, stateOnly, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE sg_disbursements SET status=? WHERE id=? AND state_user_id=?').run(status, req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── GRIEVANCES ──
router.get('/grievances', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { status } = req.query;
  let sql = 'SELECT * FROM sg_grievances WHERE state_user_id=?';
  const params = [uid];
  if (status) { sql += ' AND status=?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/grievances', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { filed_by, filer_type, category, district, description, priority } = req.body;
  const ticket_no = `GRV-${(req.user.state_name || 'ST').substring(0,2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const info = db.prepare(
    `INSERT INTO sg_grievances (state_user_id,ticket_no,filed_by,filer_type,category,district,description,priority)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(uid, ticket_no, filed_by, filer_type, category, district, description, priority || 'medium');
  res.json({ id: info.lastInsertRowid, ticket_no });
});

router.put('/grievances/:id', authRequired, stateOnly, (req, res) => {
  const { status, resolution } = req.body;
  const resolved_at = status === 'resolved' ? new Date().toISOString() : null;
  db.prepare(
    `UPDATE sg_grievances SET status=COALESCE(?,status), resolution=COALESCE(?,resolution),
     resolved_at=COALESCE(?,resolved_at) WHERE id=? AND state_user_id=?`
  ).run(status, resolution, resolved_at, req.params.id, req.user.id);
  logAudit({ user: req.user, action: 'Grievance Updated', entity: 'sg_grievances', entityId: req.params.id, detail: status });
  res.json({ ok: true });
});

// ── CERTIFICATES ──
router.get('/certificates', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const { q } = req.query;
  let sql = 'SELECT * FROM sg_certificates WHERE state_user_id=?';
  const params = [uid];
  if (q) { sql += ' AND (cert_no LIKE ? OR candidate_name LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC LIMIT 100';
  res.json(db.prepare(sql).all(...params));
});

router.post('/certificates/verify', authRequired, stateOnly, (req, res) => {
  const { cert_no } = req.body;
  const cert = db.prepare('SELECT * FROM sg_certificates WHERE cert_no=?').get(cert_no);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  res.json(cert);
});

// ── NOTIFICATIONS ──
router.get('/notifications', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  res.json(db.prepare('SELECT * FROM sg_notifications WHERE state_user_id=? ORDER BY created_at DESC LIMIT 50').all(uid));
});

router.put('/notifications/mark-read', authRequired, stateOnly, (req, res) => {
  db.prepare('UPDATE sg_notifications SET is_read=1 WHERE state_user_id=?').run(req.user.id);
  res.json({ ok: true });
});

// ── SCHEMES MASTER ──
router.get('/schemes', authRequired, stateOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM sg_schemes WHERE is_active=1 ORDER BY id').all());
});

// ── MIS SUMMARY ──
router.get('/mis', authRequired, stateOnly, (req, res) => {
  const uid = req.user.id;
  const schemes = db.prepare('SELECT * FROM sg_schemes WHERE is_active=1').all();
  const result = schemes.map(s => {
    const enrolled = db.prepare("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=? AND scheme=?").get(uid, s.code).c;
    const certified = db.prepare("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=? AND scheme=? AND certification_status='certified'").get(uid, s.code).c;
    const placed = db.prepare("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=? AND scheme=? AND placement_status='placed'").get(uid, s.code).c;
    const disbursed = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=? AND scheme=? AND status='disbursed'").get(uid, s.code).s;
    return { ...s, enrolled, certified, placed, disbursed, certRate: enrolled ? Math.round(certified / enrolled * 100) : 0 };
  });
  res.json(result);
});

// ── PROFILE ──
router.get('/profile', authRequired, stateOnly, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,org_name,location,state_name,phone FROM users WHERE id=?').get(req.user.id);
  res.json(user || {});
});

module.exports = router;
