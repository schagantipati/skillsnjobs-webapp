const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

router.use(authRequired);
router.use(requireRole('csr_org', 'superadmin', 'admin'));

const uid = req => req.user.id;

// ── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const id = uid(req);
  const totalProjects     = db.prepare('SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=?').get(id).c;
  const activeProjects    = db.prepare("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=? AND status='active'").get(id).c;
  const completedProjects = db.prepare("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=? AND status='completed'").get(id).c;
  const totalBeneficiaries= db.prepare('SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=?').get(id).c;
  const placedBeneficiaries= db.prepare("SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=? AND placement_status='placed'").get(id).c;
  const certifiedBeneficiaries= db.prepare("SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=? AND training_status='completed'").get(id).c;
  const totalDisbursed    = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM csr_disbursements WHERE csr_user_id=? AND status='disbursed'").get(id).s;
  const pendingDisbursements= db.prepare("SELECT COUNT(*) c FROM csr_disbursements WHERE csr_user_id=? AND status='pending'").get(id).c;
  const totalPartners     = db.prepare('SELECT COUNT(*) c FROM csr_training_partners WHERE csr_user_id=?').get(id).c;
  const activePartners    = db.prepare("SELECT COUNT(*) c FROM csr_training_partners WHERE csr_user_id=? AND status='active'").get(id).c;
  const totalBudget       = db.prepare('SELECT COALESCE(SUM(budget),0) s FROM csr_projects WHERE csr_user_id=?').get(id).s;
  const totalSpent        = db.prepare('SELECT COALESCE(SUM(spent),0) s FROM csr_projects WHERE csr_user_id=?').get(id).s;
  res.json({ totalProjects, activeProjects, completedProjects, totalBeneficiaries, placedBeneficiaries, certifiedBeneficiaries, totalDisbursed, pendingDisbursements, totalPartners, activePartners, totalBudget, totalSpent });
});

// ── Projects ───────────────────────────────────────────────────────────────
router.get('/projects', (req, res) => {
  const rows = db.prepare('SELECT * FROM csr_projects WHERE csr_user_id=? ORDER BY created_at DESC').all(uid(req));
  res.json(rows);
});
router.post('/projects', (req, res) => {
  const { title, activity, sub_sector, state_name, district, start_date, end_date, budget, beneficiaries_target, implementing_agency, status } = req.body;
  const info = db.prepare('INSERT INTO csr_projects (csr_user_id,title,activity,sub_sector,state_name,district,start_date,end_date,budget,beneficiaries_target,implementing_agency,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(uid(req), title, activity, sub_sector, state_name, district, start_date, end_date, budget||0, beneficiaries_target||0, implementing_agency, status||'draft');
  res.json({ id: info.lastInsertRowid });
});
router.put('/projects/:id', (req, res) => {
  const { title, activity, sub_sector, state_name, district, start_date, end_date, budget, spent, beneficiaries_target, beneficiaries_actual, implementing_agency, status } = req.body;
  db.prepare('UPDATE csr_projects SET title=?,activity=?,sub_sector=?,state_name=?,district=?,start_date=?,end_date=?,budget=?,spent=?,beneficiaries_target=?,beneficiaries_actual=?,implementing_agency=?,status=? WHERE id=? AND csr_user_id=?').run(title, activity, sub_sector, state_name, district, start_date, end_date, budget, spent, beneficiaries_target, beneficiaries_actual, implementing_agency, status, req.params.id, uid(req));
  res.json({ ok: true });
});
router.delete('/projects/:id', (req, res) => {
  db.prepare('DELETE FROM csr_projects WHERE id=? AND csr_user_id=?').run(req.params.id, uid(req));
  res.json({ ok: true });
});

// ── Beneficiaries ──────────────────────────────────────────────────────────
router.get('/beneficiaries', (req, res) => {
  const { project_id, status } = req.query;
  let q = 'SELECT b.*, p.title project_title FROM csr_beneficiaries b LEFT JOIN csr_projects p ON p.id=b.project_id WHERE b.csr_user_id=?';
  const params = [uid(req)];
  if (project_id) { q += ' AND b.project_id=?'; params.push(project_id); }
  if (status) { q += ' AND b.training_status=?'; params.push(status); }
  q += ' ORDER BY b.created_at DESC';
  res.json(db.prepare(q).all(...params));
});
router.post('/beneficiaries', (req, res) => {
  const { project_id, name, gender, age, district, state_name, course, batch_code, enroll_date, training_status, placement_status } = req.body;
  const info = db.prepare('INSERT INTO csr_beneficiaries (csr_user_id,project_id,name,gender,age,district,state_name,course,batch_code,enroll_date,training_status,placement_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(uid(req), project_id||null, name, gender, age||null, district, state_name, course, batch_code, enroll_date, training_status||'enrolled', placement_status||'not_placed');
  res.json({ id: info.lastInsertRowid });
});
router.put('/beneficiaries/:id', (req, res) => {
  const { training_status, placement_status } = req.body;
  db.prepare('UPDATE csr_beneficiaries SET training_status=?,placement_status=? WHERE id=? AND csr_user_id=?').run(training_status, placement_status, req.params.id, uid(req));
  res.json({ ok: true });
});

// ── Disbursements ──────────────────────────────────────────────────────────
router.get('/disbursements', (req, res) => {
  const rows = db.prepare('SELECT d.*, p.title project_title FROM csr_disbursements d LEFT JOIN csr_projects p ON p.id=d.project_id WHERE d.csr_user_id=? ORDER BY d.created_at DESC').all(uid(req));
  res.json(rows);
});
router.post('/disbursements', (req, res) => {
  const { project_id, amount, recipient, purpose, disbursed_date, reference_no, fy, status } = req.body;
  const info = db.prepare('INSERT INTO csr_disbursements (csr_user_id,project_id,amount,recipient,purpose,disbursed_date,reference_no,fy,status) VALUES (?,?,?,?,?,?,?,?,?)').run(uid(req), project_id||null, amount, recipient, purpose, disbursed_date||null, reference_no, fy, status||'pending');
  res.json({ id: info.lastInsertRowid });
});
router.put('/disbursements/:id/status', (req, res) => {
  db.prepare('UPDATE csr_disbursements SET status=? WHERE id=? AND csr_user_id=?').run(req.body.status, req.params.id, uid(req));
  res.json({ ok: true });
});

// ── Training Partners ──────────────────────────────────────────────────────
router.get('/training-partners', (req, res) => {
  res.json(db.prepare('SELECT * FROM csr_training_partners WHERE csr_user_id=? ORDER BY created_at DESC').all(uid(req)));
});
router.post('/training-partners', (req, res) => {
  const { name, type, state_name, district, contact_email, contact_mobile, mou_date, mou_expiry, status } = req.body;
  const info = db.prepare('INSERT INTO csr_training_partners (csr_user_id,name,type,state_name,district,contact_email,contact_mobile,mou_date,mou_expiry,status) VALUES (?,?,?,?,?,?,?,?,?,?)').run(uid(req), name, type, state_name, district, contact_email, contact_mobile, mou_date, mou_expiry, status||'active');
  res.json({ id: info.lastInsertRowid });
});
router.put('/training-partners/:id', (req, res) => {
  const { status, beneficiaries_trained } = req.body;
  db.prepare('UPDATE csr_training_partners SET status=?,beneficiaries_trained=? WHERE id=? AND csr_user_id=?').run(status, beneficiaries_trained, req.params.id, uid(req));
  res.json({ ok: true });
});
router.delete('/training-partners/:id', (req, res) => {
  db.prepare('DELETE FROM csr_training_partners WHERE id=? AND csr_user_id=?').run(req.params.id, uid(req));
  res.json({ ok: true });
});

module.exports = router;
