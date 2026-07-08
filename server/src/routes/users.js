const express = require('express');
const bcrypt = require('bcryptjs');
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
    // Shared org
    cin: u.cin, website: u.website,
    // Training Vendor
    registration_number: u.registration_number, pan: u.pan, gstin: u.gstin,
    year_established: u.year_established, head_office: u.head_office,
    branch_offices: u.branch_offices,
    ceo_name: u.ceo_name, spoc_name: u.spoc_name, ops_head: u.ops_head,
    finance_contact: u.finance_contact, placement_officer: u.placement_officer,
    bank_account_name: u.bank_account_name, bank_ifsc: u.bank_ifsc,
    bank_account_number: u.bank_account_number,
    training_centres: u.training_centres, centre_photos: u.centre_photos,
    vendor_profile: u.vendor_profile ? JSON.parse(u.vendor_profile) : null,
    is_active: u.is_active, verification_status: u.verification_status,
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
    cin, website,
    registration_number, pan, gstin, year_established, head_office, branch_offices,
    ceo_name, spoc_name, ops_head, finance_contact, placement_officer,
    bank_account_name, bank_ifsc, bank_account_number,
    training_centres, centre_photos, vendor_profile,
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
    cin=?, website=?,
    registration_number=?, pan=?, gstin=?, year_established=?, head_office=?, branch_offices=?,
    ceo_name=?, spoc_name=?, ops_head=?, finance_contact=?, placement_officer=?,
    bank_account_name=?, bank_ifsc=?, bank_account_number=?,
    training_centres=?, centre_photos=?, vendor_profile=?
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
    cin ?? e.cin, website ?? e.website,
    registration_number ?? e.registration_number, pan ?? e.pan, gstin ?? e.gstin,
    year_established ?? e.year_established, head_office ?? e.head_office, branch_offices ?? e.branch_offices,
    ceo_name ?? e.ceo_name, spoc_name ?? e.spoc_name, ops_head ?? e.ops_head,
    finance_contact ?? e.finance_contact, placement_officer ?? e.placement_officer,
    bank_account_name ?? e.bank_account_name, bank_ifsc ?? e.bank_ifsc,
    bank_account_number ?? e.bank_account_number,
    training_centres ?? e.training_centres, centre_photos ?? e.centre_photos,
    vendor_profile !== undefined ? JSON.stringify(vendor_profile) : e.vendor_profile,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  logAudit({ user: req.user, action: 'Profile updated', entity: 'user', entityId: req.user.id, ip: req.ip });
  res.json(publicUser(updated));
});

router.post('/me/change-password', authRequired, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password are required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password_hash)) return res.status(400).json({ error: 'Current password is incorrect' });
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  logAudit({ user: req.user, action: 'Password changed', entity: 'user', entityId: req.user.id, ip: req.ip });
  res.json({ message: 'Password updated successfully' });
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

// Superadmin/administrator: update any user profile by id
router.put('/:id', authRequired, (req, res) => {
  if (!['superadmin', 'administrator'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { org_name, location, bio, phone, gender, registration_number, pan, gstin, year_established, dob, verification_status,
    ceo_name, spoc_name, ops_head, finance_contact, placement_officer,
    bank_account_name, bank_ifsc, bank_account_number,
    head_office, branch_offices, address_line1, address_line2, city, state_name, pincode,
    vendor_profile } = req.body;
  db.prepare(`UPDATE users SET
    org_name = COALESCE(?, org_name),
    location = COALESCE(?, location),
    bio = COALESCE(?, bio),
    phone = COALESCE(?, phone),
    gender = COALESCE(?, gender),
    registration_number = COALESCE(?, registration_number),
    pan = COALESCE(?, pan),
    gstin = COALESCE(?, gstin),
    year_established = COALESCE(?, year_established),
    dob = COALESCE(?, dob),
    verification_status = COALESCE(?, verification_status),
    ceo_name = COALESCE(?, ceo_name),
    spoc_name = COALESCE(?, spoc_name),
    ops_head = COALESCE(?, ops_head),
    finance_contact = COALESCE(?, finance_contact),
    placement_officer = COALESCE(?, placement_officer),
    bank_account_name = COALESCE(?, bank_account_name),
    bank_ifsc = COALESCE(?, bank_ifsc),
    bank_account_number = COALESCE(?, bank_account_number),
    head_office = COALESCE(?, head_office),
    branch_offices = COALESCE(?, branch_offices),
    address_line1 = COALESCE(?, address_line1),
    address_line2 = COALESCE(?, address_line2),
    city = COALESCE(?, city),
    state_name = COALESCE(?, state_name),
    pincode = COALESCE(?, pincode),
    vendor_profile = CASE WHEN ? IS NOT NULL THEN ? ELSE vendor_profile END
    WHERE id = ?`).run(
    org_name ?? null, location ?? null, bio ?? null, phone ?? null,
    gender ?? null, registration_number ?? null, pan ?? null, gstin ?? null,
    year_established ?? null, dob ?? null, verification_status ?? null,
    ceo_name ?? null, spoc_name ?? null, ops_head ?? null, finance_contact ?? null, placement_officer ?? null,
    bank_account_name ?? null, bank_ifsc ?? null, bank_account_number ?? null,
    head_office ?? null, branch_offices ?? null, address_line1 ?? null, address_line2 ?? null,
    city ?? null, state_name ?? null, pincode ?? null,
    vendor_profile !== undefined ? JSON.stringify(vendor_profile) : null,
    vendor_profile !== undefined ? JSON.stringify(vendor_profile) : null,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  logAudit({ user: req.user, action: 'User profile updated', entity: 'user', entityId: req.params.id, ip: req.ip });
  res.json(publicUser(updated));
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

// ── Trainer: Qualifications ──
router.get('/me/qualifications', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  const rows = db.prepare('SELECT * FROM trainer_qualifications WHERE trainer_id = ? ORDER BY id').all(req.user.id);
  res.json(rows);
});

router.post('/me/qualifications', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  const { degree, institution, year, score } = req.body;
  if (!degree || !institution) return res.status(400).json({ error: 'degree and institution are required' });
  const result = db.prepare(
    'INSERT INTO trainer_qualifications (trainer_id, degree, institution, year, score) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, degree, institution, year || null, score || null);
  res.json({ id: result.lastInsertRowid, trainer_id: req.user.id, degree, institution, year, score });
});

router.delete('/me/qualifications/:id', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM trainer_qualifications WHERE id = ? AND trainer_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Trainer: Experience ──
router.get('/me/experience', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  const rows = db.prepare('SELECT * FROM trainer_experience WHERE trainer_id = ? ORDER BY id').all(req.user.id);
  res.json(rows);
});

router.post('/me/experience', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  const { org, role, from_date, to_date, sector } = req.body;
  if (!org || !role) return res.status(400).json({ error: 'org and role are required' });
  const result = db.prepare(
    'INSERT INTO trainer_experience (trainer_id, org, role, from_date, to_date, sector) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, org, role, from_date || null, to_date || null, sector || null);
  res.json({ id: result.lastInsertRowid, trainer_id: req.user.id, org, role, from_date, to_date, sector });
});

router.delete('/me/experience/:id', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM trainer_experience WHERE id = ? AND trainer_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Trainer: Skills ──
router.get('/me/skills', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  const rows = db.prepare('SELECT * FROM trainer_skills WHERE trainer_id = ? ORDER BY id').all(req.user.id);
  res.json(rows);
});

router.post('/me/skills', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  const { domain, courses, ssc, nsqf_level, years_exp } = req.body;
  if (!domain) return res.status(400).json({ error: 'domain is required' });
  const result = db.prepare(
    'INSERT INTO trainer_skills (trainer_id, domain, courses, ssc, nsqf_level, years_exp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, domain, courses || null, ssc || null, nsqf_level || null, years_exp || null);
  res.json({ id: result.lastInsertRowid, trainer_id: req.user.id, domain, courses, ssc, nsqf_level, years_exp });
});

router.delete('/me/skills/:id', authRequired, (req, res) => {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM trainer_skills WHERE id = ? AND trainer_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
