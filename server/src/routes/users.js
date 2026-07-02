const express = require('express');
const { db, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    org_name: u.org_name, location: u.location, bio: u.bio,
    skills: JSON.parse(u.skills || '[]'), experience_years: u.experience_years,
    first_name: u.first_name, middle_name: u.middle_name, last_name: u.last_name,
    dob: u.dob, gender: u.gender, phone: u.phone, photo: u.photo,
    address_line1: u.address_line1, address_line2: u.address_line2,
    city: u.city, state_name: u.state_name, country: u.country, pincode: u.pincode,
    category: u.category,
    qualification: u.qualification, year_passed: u.year_passed,
    board: u.board, university: u.university, percentage: u.percentage,
    employment_status: u.employment_status,
    interests: u.interests, preferred_sector: u.preferred_sector,
    lang_english: u.lang_english, lang_hindi: u.lang_hindi, lang_regional: u.lang_regional,
    certificates: u.certificates, resume: u.resume,
    // Training Vendor
    registration_number: u.registration_number, pan: u.pan, gstin: u.gstin,
    year_established: u.year_established, head_office: u.head_office,
    branch_offices: u.branch_offices,
    ceo_name: u.ceo_name, spoc_name: u.spoc_name, ops_head: u.ops_head,
    finance_contact: u.finance_contact, placement_officer: u.placement_officer,
    bank_account_name: u.bank_account_name, bank_ifsc: u.bank_ifsc,
    bank_account_number: u.bank_account_number,
    training_centres: u.training_centres, centre_photos: u.centre_photos,
  };
}

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(user));
});

router.put('/me', authRequired, (req, res) => {
  const {
    name, location, bio, skills, experience_years, org_name,
    first_name, middle_name, last_name, dob, gender, phone, photo,
    address_line1, address_line2, city, state_name, country, pincode,
    category, qualification, year_passed, board, university, percentage,
    employment_status, interests, preferred_sector,
    lang_english, lang_hindi, lang_regional,
    certificates, resume,
    registration_number, pan, gstin, year_established, head_office, branch_offices,
    ceo_name, spoc_name, ops_head, finance_contact, placement_officer,
    bank_account_name, bank_ifsc, bank_account_number,
    training_centres, centre_photos,
  } = req.body;

  const e = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  db.prepare(`UPDATE users SET
    name=?, location=?, bio=?, skills=?, experience_years=?, org_name=?,
    first_name=?, middle_name=?, last_name=?, dob=?, gender=?, phone=?, photo=?,
    address_line1=?, address_line2=?, city=?, state_name=?, country=?, pincode=?,
    category=?, qualification=?, year_passed=?, board=?, university=?, percentage=?,
    employment_status=?, interests=?, preferred_sector=?,
    lang_english=?, lang_hindi=?, lang_regional=?,
    certificates=?, resume=?,
    registration_number=?, pan=?, gstin=?, year_established=?, head_office=?, branch_offices=?,
    ceo_name=?, spoc_name=?, ops_head=?, finance_contact=?, placement_officer=?,
    bank_account_name=?, bank_ifsc=?, bank_account_number=?,
    training_centres=?, centre_photos=?
    WHERE id=?`).run(
    name ?? e.name, location ?? e.location, bio ?? e.bio,
    JSON.stringify(skills ?? JSON.parse(e.skills || '[]')),
    experience_years ?? e.experience_years, org_name ?? e.org_name,
    first_name ?? e.first_name, middle_name ?? e.middle_name, last_name ?? e.last_name,
    dob ?? e.dob, gender ?? e.gender, phone ?? e.phone, photo ?? e.photo,
    address_line1 ?? e.address_line1, address_line2 ?? e.address_line2,
    city ?? e.city, state_name ?? e.state_name, country ?? e.country, pincode ?? e.pincode,
    category ?? e.category, qualification ?? e.qualification, year_passed ?? e.year_passed,
    board ?? e.board, university ?? e.university, percentage ?? e.percentage,
    employment_status ?? e.employment_status, interests ?? e.interests, preferred_sector ?? e.preferred_sector,
    lang_english ?? e.lang_english, lang_hindi ?? e.lang_hindi, lang_regional ?? e.lang_regional,
    certificates ?? e.certificates, resume ?? e.resume,
    registration_number ?? e.registration_number, pan ?? e.pan, gstin ?? e.gstin,
    year_established ?? e.year_established, head_office ?? e.head_office, branch_offices ?? e.branch_offices,
    ceo_name ?? e.ceo_name, spoc_name ?? e.spoc_name, ops_head ?? e.ops_head,
    finance_contact ?? e.finance_contact, placement_officer ?? e.placement_officer,
    bank_account_name ?? e.bank_account_name, bank_ifsc ?? e.bank_ifsc,
    bank_account_number ?? e.bank_account_number,
    training_centres ?? e.training_centres, centre_photos ?? e.centre_photos,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  logAudit({ user: req.user, action: 'Profile updated', entity: 'user', entityId: req.user.id, ip: req.ip });
  res.json(publicUser(updated));
});

router.get('/candidates', authRequired, (req, res) => {
  if (!['employer', 'admin', 'administrator', 'superadmin', 'state_government', 'central_government'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`SELECT * FROM users WHERE role = 'candidate' ORDER BY created_at DESC`).all();
  res.json(rows.map(publicUser));
});

// Superadmin / administrator: list users by role
router.get('/by-role/:role', authRequired, (req, res) => {
  if (!['superadmin', 'administrator'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const allowed = ['candidate','employer','trainer','placement_agency','csr_org','training_vendor','state_government','central_government','administrator','admin'];
  const role = req.params.role;
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const rows = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC').all(role);
  res.json(rows.map(publicUser));
});

// Superadmin / admin: get audit logs
router.get('/audit-logs', authRequired, (req, res) => {
  if (!['superadmin', 'administrator', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  const action = req.query.action || null;
  const rows = action
    ? db.prepare('SELECT * FROM audit_logs WHERE action = ? ORDER BY id DESC LIMIT ? OFFSET ?').all(action, limit, offset)
    : db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);
  const total = action
    ? db.prepare('SELECT COUNT(*) c FROM audit_logs WHERE action = ?').get(action).c
    : db.prepare('SELECT COUNT(*) c FROM audit_logs').get().c;
  res.json({ rows, total });
});

// Superadmin: list ALL users (with optional role filter & search)
router.get('/all', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { role, search, status } = req.query;
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  if (role)   { sql += ' AND role = ?';                       params.push(role); }
  if (status) { sql += ' AND (is_active = ? OR is_active IS ?)'; params.push(status === 'active' ? 1 : 0, null); }
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR org_name LIKE ?)'; const q = `%${search}%`; params.push(q, q, q); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(publicUser));
});

// Superadmin: activate / deactivate a user
router.put('/:id/status', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { is_active } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
  logAudit({ user: req.user, action: is_active ? 'User activated' : 'User deactivated', entity: 'user', entityId: req.params.id, ip: req.ip });
  res.json({ success: true, is_active: !!is_active });
});

// Superadmin: delete a user
router.delete('/:id', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  logAudit({ user: req.user, action: 'User deleted', entity: 'user', entityId: req.params.id, ip: req.ip });
  res.json({ success: true });
});

// Superadmin: get stats per role
router.get('/stats', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const roles = ['candidate','training_vendor','trainer','csr_org','placement_agency','employer'];
  const stats = {};
  for (const r of roles) {
    stats[r] = db.prepare('SELECT COUNT(*) c FROM users WHERE role = ?').get(r).c;
  }
  stats.total_users   = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  stats.open_jobs     = db.prepare("SELECT COUNT(*) c FROM jobs WHERE status='open'").get().c;
  stats.total_jobs    = db.prepare('SELECT COUNT(*) c FROM jobs').get().c;
  stats.total_courses = db.prepare('SELECT COUNT(*) c FROM courses').get().c;
  stats.applications  = db.prepare('SELECT COUNT(*) c FROM applications').get().c;
  stats.hired         = db.prepare("SELECT COUNT(*) c FROM applications WHERE status='hired'").get().c;
  stats.shortlisted   = db.prepare("SELECT COUNT(*) c FROM applications WHERE status='shortlisted'").get().c;
  stats.enrollments   = db.prepare('SELECT COUNT(*) c FROM enrollments').get().c;
  res.json(stats);
});

module.exports = router;
