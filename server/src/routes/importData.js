const express = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne, execute, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_ROLES = ['superadmin', 'administrator', 'admin'];

function guard(req, res) {
  if (!ALLOWED_ROLES.includes(req.user.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return true;
  }
  return false;
}

// POST /api/import/users  { role, records: [{first_name,last_name,email,phone,...}] }
router.post('/users', authRequired, async (req, res) => {
  try {
    if (guard(req, res)) return;
    const { role, records } = req.body;
    if (!role || !Array.isArray(records)) return res.status(400).json({ error: 'role and records required' });

    const defaultHash = bcrypt.hashSync('Welcome@123', 10);
    const results = [];

    for (const r of records) {
      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [r.email]);
      if (existing) { results.push({ email: r.email, status: 'skipped', reason: 'Email already exists' }); continue; }
      try {
        const fullName = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || r.name || r.email.split('@')[0];
        await execute(`INSERT INTO users
          (name,email,password_hash,role,org_name,location,bio,skills,experience_years,
           first_name,middle_name,last_name,dob,gender,phone,city,state_name,country,
           registration_number,pan,gstin,year_established,ceo_name,spoc_name)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`, [
          fullName, r.email, r.password ? bcrypt.hashSync(r.password, 10) : defaultHash,
          role, r.org_name || null, r.location || r.city || null, r.bio || null,
          JSON.stringify((r.skills || '').split(';').map(s => s.trim()).filter(Boolean)),
          parseFloat(r.experience_years) || 0,
          r.first_name || null, r.middle_name || null, r.last_name || null,
          r.dob || null, r.gender || null, r.phone || null,
          r.city || null, r.state_name || null, r.country || 'India',
          r.registration_number || null, r.pan || null, r.gstin || null,
          r.year_established || null, r.ceo_name || null, r.spoc_name || null,
        ]);
        results.push({ email: r.email, status: 'imported' });
      } catch (e) {
        results.push({ email: r.email, status: 'error', reason: e.message });
      }
    }

    await logAudit({ user: req.user, action: 'Bulk import', entity: 'user', detail: `Role: ${role}, Records: ${records.length}`, ip: req.ip });
    const imported = results.filter(r => r.status === 'imported').length;
    const skipped  = results.filter(r => r.status === 'skipped').length;
    const errors   = results.filter(r => r.status === 'error').length;
    res.json({ imported, skipped, errors, results });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/import/jobs  { employer_email, records: [{title,description,...}] }
router.post('/jobs', authRequired, async (req, res) => {
  try {
    if (guard(req, res)) return;
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: 'records required' });

    const results = [];
    for (const r of records) {
      try {
        let employer_id = null;
        if (r.employer_email) {
          const emp = await queryOne('SELECT id FROM users WHERE email = $1', [r.employer_email]);
          if (emp) employer_id = emp.id;
        }
        if (!employer_id) {
          const fallback = await queryOne(`SELECT id FROM users WHERE role='employer' LIMIT 1`);
          employer_id = fallback?.id;
        }
        if (!employer_id) { results.push({ title: r.title, status: 'error', reason: 'No employer found' }); continue; }

        await execute(`INSERT INTO jobs
          (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [
          employer_id, r.title, r.description || null,
          JSON.stringify((r.required_skills || '').split(';').map(s => s.trim()).filter(Boolean)),
          r.location || null,
          ['Full-time','Part-time','Contract','Internship','Freelance'].includes(r.job_type) ? r.job_type : 'Full-time',
          parseInt(r.salary_min) || null, parseInt(r.salary_max) || null,
        ]);
        results.push({ title: r.title, status: 'imported' });
      } catch (e) {
        results.push({ title: r.title, status: 'error', reason: e.message });
      }
    }

    await logAudit({ user: req.user, action: 'Bulk import', entity: 'job', detail: `Records: ${records.length}`, ip: req.ip });
    res.json({ imported: results.filter(r => r.status === 'imported').length, errors: results.filter(r => r.status === 'error').length, results });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/import/courses  { records }
router.post('/courses', authRequired, async (req, res) => {
  try {
    if (guard(req, res)) return;
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: 'records required' });

    const results = [];
    for (const r of records) {
      try {
        let trainer_id = null;
        if (r.trainer_email) {
          const t = await queryOne('SELECT id FROM users WHERE email = $1', [r.trainer_email]);
          if (t) trainer_id = t.id;
        }
        await execute(`INSERT INTO courses (trainer_id,title,provider,skill_tags,duration_weeks,level,rating)
          VALUES ($1,$2,$3,$4,$5,$6,$7)`, [
          trainer_id, r.title, r.provider || null,
          JSON.stringify((r.skill_tags || '').split(';').map(s => s.trim()).filter(Boolean)),
          parseInt(r.duration_weeks) || 4,
          ['Beginner','Intermediate','Advanced'].includes(r.level) ? r.level : 'Beginner',
          parseFloat(r.rating) || 4.5,
        ]);
        results.push({ title: r.title, status: 'imported' });
      } catch (e) {
        results.push({ title: r.title, status: 'error', reason: e.message });
      }
    }

    await logAudit({ user: req.user, action: 'Bulk import', entity: 'course', detail: `Records: ${records.length}`, ip: req.ip });
    res.json({ imported: results.filter(r => r.status === 'imported').length, errors: results.filter(r => r.status === 'error').length, results });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
