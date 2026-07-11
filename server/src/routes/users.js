const express = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne, execute, logAudit } = require('../db');
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
    tan: u.tan,
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

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(user));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/me', authRequired, async (req, res) => {
  try {
    const {
      name, location, bio, skills, experience_years, org_name,
      first_name, middle_name, last_name, dob, gender, phone, photo,
      address_line1, address_line2, city, state_name, country, pincode,
      category, qualification, year_passed, board, university, percentage,
      employment_status, interests, preferred_sector,
      lang_english, lang_hindi, lang_regional,
      certificates, resume,
      email, tan, cin, website,
      registration_number, pan, gstin, year_established, head_office, branch_offices,
      ceo_name, spoc_name, ops_head, finance_contact, placement_officer,
      bank_account_name, bank_ifsc, bank_account_number,
      training_centres, centre_photos, vendor_profile,
    } = req.body;

    const e = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);

    // Duplicate checks for training_vendor profile updates
    if (e.role === 'training_vendor') {
      if (email && email !== e.email) {
        const dup = await queryOne('SELECT id FROM users WHERE email=$1 AND id!=$2', [email, e.id]);
        if (dup) return res.status(409).json({ error: 'This email is already registered with another account.', field: 'email' });
      }
      if (org_name && org_name.trim() && org_name.trim().toLowerCase() !== (e.org_name || '').trim().toLowerCase()) {
        const dup = await queryOne("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(org_name))=LOWER(TRIM($1)) AND id!=$2", [org_name.trim(), e.id]);
        if (dup) return res.status(409).json({ error: `Organisation "${org_name.trim()}" is already registered.`, field: 'org_name' });
      }
    }

    await execute(`UPDATE users SET
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
      bank_account_name=$49, bank_ifsc=$50, bank_account_number=$51,
      training_centres=$52, centre_photos=$53, vendor_profile=$54
      WHERE id=$55`, [
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
      (email || e.email), tan ?? e.tan, cin ?? e.cin, website ?? e.website,
      registration_number ?? e.registration_number, pan ?? e.pan, gstin ?? e.gstin,
      year_established ?? e.year_established, head_office ?? e.head_office, branch_offices ?? e.branch_offices,
      ceo_name ?? e.ceo_name, spoc_name ?? e.spoc_name, ops_head ?? e.ops_head,
      finance_contact ?? e.finance_contact, placement_officer ?? e.placement_officer,
      bank_account_name ?? e.bank_account_name, bank_ifsc ?? e.bank_ifsc,
      bank_account_number ?? e.bank_account_number,
      training_centres ?? e.training_centres, centre_photos ?? e.centre_photos,
      vendor_profile !== undefined ? JSON.stringify(vendor_profile) : e.vendor_profile,
      req.user.id
    ]);

    const updated = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    await logAudit({ user: req.user, action: 'Profile updated', entity: 'user', entityId: req.user.id, ip: req.ip });
    res.json(publicUser(updated));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/me/change-password', authRequired, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password are required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!bcrypt.compareSync(current_password, user.password_hash)) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = bcrypt.hashSync(new_password, 10);
    await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    await logAudit({ user: req.user, action: 'Password changed', entity: 'user', entityId: req.user.id, ip: req.ip });
    res.json({ message: 'Password updated successfully' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/candidates', authRequired, async (req, res) => {
  try {
    if (!['employer', 'admin', 'administrator', 'superadmin', 'state_government', 'central_government'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rows = await query(`SELECT * FROM users WHERE role = 'candidate' ORDER BY created_at DESC`);
    res.json(rows.map(publicUser));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin / administrator: list users by role
router.get('/by-role/:role', authRequired, async (req, res) => {
  try {
    if (!['superadmin', 'administrator'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const allowed = ['candidate','employer','trainer','placement_agency','csr_org','training_vendor','state_government','central_government','administrator','admin'];
    const role = req.params.role;
    if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const rows = await query('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC', [role]);
    res.json(rows.map(publicUser));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin / admin: get audit logs
router.get('/audit-logs', authRequired, async (req, res) => {
  try {
    if (!['superadmin', 'administrator', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const action = req.query.action || null;
    let rows, total;
    if (action) {
      rows = await query('SELECT * FROM audit_logs WHERE action = $1 ORDER BY id DESC LIMIT $2 OFFSET $3', [action, limit, offset]);
      total = parseInt((await queryOne('SELECT COUNT(*) c FROM audit_logs WHERE action = $1', [action])).c);
    } else {
      rows = await query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
      total = parseInt((await queryOne('SELECT COUNT(*) c FROM audit_logs')).c);
    }
    res.json({ rows, total });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin: list ALL users (with optional role filter & search)
router.get('/all', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const { role, search, status } = req.query;
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let idx = 1;
    if (role)   { sql += ` AND role = $${idx++}`;                       params.push(role); }
    if (status) { sql += ` AND (is_active = $${idx++} OR is_active IS NULL)`; params.push(status === 'active' ? 1 : 0); }
    if (search) { sql += ` AND (name ILIKE $${idx} OR email ILIKE $${idx+1} OR org_name ILIKE $${idx+2})`; const q = `%${search}%`; params.push(q, q, q); idx += 3; }
    sql += ' ORDER BY created_at DESC';
    const rows = await query(sql, params);
    res.json(rows.map(publicUser));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin/administrator: update any user profile by id
router.put('/:id', authRequired, async (req, res) => {
  try {
    if (!['superadmin', 'administrator'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { org_name, location, bio, phone, gender, registration_number, pan, gstin, year_established, dob, verification_status,
      ceo_name, spoc_name, ops_head, finance_contact, placement_officer,
      bank_account_name, bank_ifsc, bank_account_number,
      head_office, branch_offices, address_line1, address_line2, city, state_name, pincode,
      vendor_profile } = req.body;
    const vpJson = vendor_profile !== undefined ? JSON.stringify(vendor_profile) : null;
    await execute(`UPDATE users SET
      org_name = COALESCE($1, org_name),
      location = COALESCE($2, location),
      bio = COALESCE($3, bio),
      phone = COALESCE($4, phone),
      gender = COALESCE($5, gender),
      registration_number = COALESCE($6, registration_number),
      pan = COALESCE($7, pan),
      gstin = COALESCE($8, gstin),
      year_established = COALESCE($9, year_established),
      dob = COALESCE($10, dob),
      verification_status = COALESCE($11, verification_status),
      ceo_name = COALESCE($12, ceo_name),
      spoc_name = COALESCE($13, spoc_name),
      ops_head = COALESCE($14, ops_head),
      finance_contact = COALESCE($15, finance_contact),
      placement_officer = COALESCE($16, placement_officer),
      bank_account_name = COALESCE($17, bank_account_name),
      bank_ifsc = COALESCE($18, bank_ifsc),
      bank_account_number = COALESCE($19, bank_account_number),
      head_office = COALESCE($20, head_office),
      branch_offices = COALESCE($21, branch_offices),
      address_line1 = COALESCE($22, address_line1),
      address_line2 = COALESCE($23, address_line2),
      city = COALESCE($24, city),
      state_name = COALESCE($25, state_name),
      pincode = COALESCE($26, pincode),
      vendor_profile = CASE WHEN $27 IS NOT NULL THEN $27 ELSE vendor_profile END
      WHERE id = $28`, [
      org_name ?? null, location ?? null, bio ?? null, phone ?? null,
      gender ?? null, registration_number ?? null, pan ?? null, gstin ?? null,
      year_established ?? null, dob ?? null, verification_status ?? null,
      ceo_name ?? null, spoc_name ?? null, ops_head ?? null, finance_contact ?? null, placement_officer ?? null,
      bank_account_name ?? null, bank_ifsc ?? null, bank_account_number ?? null,
      head_office ?? null, branch_offices ?? null, address_line1 ?? null, address_line2 ?? null,
      city ?? null, state_name ?? null, pincode ?? null,
      vpJson,
      req.params.id
    ]);
    const updated = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    await logAudit({ user: req.user, action: 'User profile updated', entity: 'user', entityId: req.params.id, ip: req.ip });
    res.json(publicUser(updated));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin: activate / deactivate a user
router.put('/:id/status', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const { is_active } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await execute('UPDATE users SET is_active = $1 WHERE id = $2', [is_active ? 1 : 0, req.params.id]);
    await logAudit({ user: req.user, action: is_active ? 'User activated' : 'User deactivated', entity: 'user', entityId: req.params.id, ip: req.ip });
    res.json({ success: true, is_active: !!is_active });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin: delete a user
router.delete('/:id', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await execute('DELETE FROM users WHERE id = $1', [req.params.id]);
    await logAudit({ user: req.user, action: 'User deleted', entity: 'user', entityId: req.params.id, ip: req.ip });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin: get stats per role
router.get('/stats', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const n = async (sql, p) => parseInt((await queryOne(sql, p)).c || 0);
    const roles = ['candidate','training_vendor','trainer','csr_org','placement_agency','employer'];
    const stats = {};
    for (const r of roles) {
      stats[r] = await n('SELECT COUNT(*) c FROM users WHERE role = $1', [r]);
    }
    stats.total_users   = await n('SELECT COUNT(*) c FROM users', []);
    stats.open_jobs     = await n("SELECT COUNT(*) c FROM jobs WHERE status='open'", []);
    stats.total_jobs    = await n('SELECT COUNT(*) c FROM jobs', []);
    stats.total_courses = await n('SELECT COUNT(*) c FROM courses', []);
    stats.applications  = await n('SELECT COUNT(*) c FROM applications', []);
    stats.hired         = await n("SELECT COUNT(*) c FROM applications WHERE status='hired'", []);
    stats.shortlisted   = await n("SELECT COUNT(*) c FROM applications WHERE status='shortlisted'", []);
    stats.enrollments   = await n('SELECT COUNT(*) c FROM enrollments', []);
    res.json(stats);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Superadmin: all training sessions with trainer & batch info
router.get('/admin/sessions', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const rows = await query(`
      SELECT ts.id, ts.topic, ts.session_date, ts.start_time, ts.duration_hrs,
             ts.venue, ts.mode, ts.status, ts.created_at,
             u.name AS trainer_name, u.email AS trainer_email,
             b.batch_code, b.batch_name, b.course_name
      FROM trainer_sessions ts
      JOIN users u ON u.id = ts.trainer_id
      LEFT JOIN batches b ON b.id = ts.batch_id
      ORDER BY ts.session_date DESC, ts.start_time
    `, []);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Trainer: Qualifications ──
router.get('/me/qualifications', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const rows = await query('SELECT * FROM trainer_qualifications WHERE trainer_id = $1 ORDER BY id', [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/me/qualifications', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const { degree, institution, year, score } = req.body;
    if (!degree || !institution) return res.status(400).json({ error: 'degree and institution are required' });
    const result = await execute(
      'INSERT INTO trainer_qualifications (trainer_id, degree, institution, year, score) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, degree, institution, year || null, score || null]
    );
    res.json({ id: result.rows[0].id, trainer_id: req.user.id, degree, institution, year, score });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/me/qualifications/:id', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    await execute('DELETE FROM trainer_qualifications WHERE id = $1 AND trainer_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Trainer: Experience ──
router.get('/me/experience', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const rows = await query('SELECT * FROM trainer_experience WHERE trainer_id = $1 ORDER BY id', [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/me/experience', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const { org, role, from_date, to_date, sector } = req.body;
    if (!org || !role) return res.status(400).json({ error: 'org and role are required' });
    const result = await execute(
      'INSERT INTO trainer_experience (trainer_id, org, role, from_date, to_date, sector) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [req.user.id, org, role, from_date || null, to_date || null, sector || null]
    );
    res.json({ id: result.rows[0].id, trainer_id: req.user.id, org, role, from_date, to_date, sector });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/me/experience/:id', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    await execute('DELETE FROM trainer_experience WHERE id = $1 AND trainer_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Trainer: Skills ──
router.get('/me/skills', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const rows = await query('SELECT * FROM trainer_skills WHERE trainer_id = $1 ORDER BY id', [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/me/skills', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const { domain, courses, ssc, nsqf_level, years_exp } = req.body;
    if (!domain) return res.status(400).json({ error: 'domain is required' });
    const result = await execute(
      'INSERT INTO trainer_skills (trainer_id, domain, courses, ssc, nsqf_level, years_exp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [req.user.id, domain, courses || null, ssc || null, nsqf_level || null, years_exp || null]
    );
    res.json({ id: result.rows[0].id, trainer_id: req.user.id, domain, courses, ssc, nsqf_level, years_exp });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/me/skills/:id', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    await execute('DELETE FROM trainer_skills WHERE id = $1 AND trainer_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
