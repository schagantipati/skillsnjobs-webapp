const express = require('express');
const bcrypt = require('bcryptjs');
const { db, logAudit } = require('../db');
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
router.post('/users', authRequired, (req, res) => {
  if (guard(req, res)) return;
  const { role, records } = req.body;
  if (!role || !Array.isArray(records)) return res.status(400).json({ error: 'role and records required' });

  const defaultHash = bcrypt.hashSync('Welcome@123', 10);
  const insert = db.prepare(`INSERT INTO users
    (name,email,password_hash,role,org_name,location,bio,skills,experience_years,
     first_name,middle_name,last_name,dob,gender,phone,city,state_name,country,
     registration_number,pan,gstin,year_established,ceo_name,spoc_name)
    VALUES (@name,@email,@password_hash,@role,@org_name,@location,@bio,@skills,@exp,
            @first_name,@middle_name,@last_name,@dob,@gender,@phone,@city,@state_name,@country,
            @registration_number,@pan,@gstin,@year_established,@ceo_name,@spoc_name)`);

  const results = [];
  for (const r of records) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(r.email);
    if (existing) { results.push({ email: r.email, status: 'skipped', reason: 'Email already exists' }); continue; }
    try {
      const fullName = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || r.name || r.email.split('@')[0];
      insert.run({
        name: fullName, email: r.email, password_hash: r.password ? bcrypt.hashSync(r.password, 10) : defaultHash,
        role, org_name: r.org_name || null, location: r.location || r.city || null,
        bio: r.bio || null,
        skills: JSON.stringify((r.skills || '').split(';').map(s => s.trim()).filter(Boolean)),
        exp: parseFloat(r.experience_years) || 0,
        first_name: r.first_name || null, middle_name: r.middle_name || null, last_name: r.last_name || null,
        dob: r.dob || null, gender: r.gender || null, phone: r.phone || null,
        city: r.city || null, state_name: r.state_name || null, country: r.country || 'India',
        registration_number: r.registration_number || null, pan: r.pan || null, gstin: r.gstin || null,
        year_established: r.year_established || null, ceo_name: r.ceo_name || null, spoc_name: r.spoc_name || null,
      });
      results.push({ email: r.email, status: 'imported' });
    } catch (e) {
      results.push({ email: r.email, status: 'error', reason: e.message });
    }
  }

  logAudit({ user: req.user, action: 'Bulk import', entity: 'user', detail: `Role: ${role}, Records: ${records.length}`, ip: req.ip });
  const imported = results.filter(r => r.status === 'imported').length;
  const skipped  = results.filter(r => r.status === 'skipped').length;
  const errors   = results.filter(r => r.status === 'error').length;
  res.json({ imported, skipped, errors, results });
});

// POST /api/import/jobs  { employer_email, records: [{title,description,...}] }
router.post('/jobs', authRequired, (req, res) => {
  if (guard(req, res)) return;
  const { records } = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records required' });

  const insert = db.prepare(`INSERT INTO jobs
    (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max)
    VALUES (@employer_id,@title,@description,@required_skills,@location,@job_type,@salary_min,@salary_max)`);

  const results = [];
  for (const r of records) {
    try {
      let employer_id = null;
      if (r.employer_email) {
        const emp = db.prepare('SELECT id FROM users WHERE email = ?').get(r.employer_email);
        if (emp) employer_id = emp.id;
      }
      if (!employer_id) {
        const fallback = db.prepare(`SELECT id FROM users WHERE role='employer' LIMIT 1`).get();
        employer_id = fallback?.id;
      }
      if (!employer_id) { results.push({ title: r.title, status: 'error', reason: 'No employer found' }); continue; }

      insert.run({
        employer_id, title: r.title, description: r.description || null,
        required_skills: JSON.stringify((r.required_skills || '').split(';').map(s => s.trim()).filter(Boolean)),
        location: r.location || null,
        job_type: ['Full-time','Part-time','Contract','Internship','Freelance'].includes(r.job_type) ? r.job_type : 'Full-time',
        salary_min: parseInt(r.salary_min) || null, salary_max: parseInt(r.salary_max) || null,
      });
      results.push({ title: r.title, status: 'imported' });
    } catch (e) {
      results.push({ title: r.title, status: 'error', reason: e.message });
    }
  }

  logAudit({ user: req.user, action: 'Bulk import', entity: 'job', detail: `Records: ${records.length}`, ip: req.ip });
  res.json({ imported: results.filter(r => r.status === 'imported').length, errors: results.filter(r => r.status === 'error').length, results });
});

// POST /api/import/courses  { records }
router.post('/courses', authRequired, (req, res) => {
  if (guard(req, res)) return;
  const { records } = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records required' });

  const insert = db.prepare(`INSERT INTO courses (trainer_id,title,provider,skill_tags,duration_weeks,level,rating)
    VALUES (@trainer_id,@title,@provider,@skill_tags,@duration_weeks,@level,@rating)`);

  const results = [];
  for (const r of records) {
    try {
      let trainer_id = null;
      if (r.trainer_email) {
        const t = db.prepare('SELECT id FROM users WHERE email = ?').get(r.trainer_email);
        if (t) trainer_id = t.id;
      }
      insert.run({
        trainer_id, title: r.title, provider: r.provider || null,
        skill_tags: JSON.stringify((r.skill_tags || '').split(';').map(s => s.trim()).filter(Boolean)),
        duration_weeks: parseInt(r.duration_weeks) || 4,
        level: ['Beginner','Intermediate','Advanced'].includes(r.level) ? r.level : 'Beginner',
        rating: parseFloat(r.rating) || 4.5,
      });
      results.push({ title: r.title, status: 'imported' });
    } catch (e) {
      results.push({ title: r.title, status: 'error', reason: e.message });
    }
  }

  logAudit({ user: req.user, action: 'Bulk import', entity: 'course', detail: `Records: ${records.length}`, ip: req.ip });
  res.json({ imported: results.filter(r => r.status === 'imported').length, errors: results.filter(r => r.status === 'error').length, results });
});

module.exports = router;
