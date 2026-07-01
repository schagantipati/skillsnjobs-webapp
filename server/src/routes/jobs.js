const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { matchScore } = require('../match');

const router = express.Router();

function jobOut(j, extra = {}) {
  return {
    id: j.id, employer_id: j.employer_id, title: j.title, description: j.description,
    required_skills: JSON.parse(j.required_skills || '[]'), location: j.location,
    job_type: j.job_type, salary_min: j.salary_min, salary_max: j.salary_max,
    status: j.status, created_at: j.created_at, ...extra
  };
}

// Public-ish listing (requires auth, any role)
router.get('/', authRequired, (req, res) => {
  const { q, location, skill } = req.query;
  let rows = db.prepare(`SELECT j.*, u.name as employer_name, u.org_name FROM jobs j
    JOIN users u ON u.id = j.employer_id WHERE j.status='open' ORDER BY j.created_at DESC`).all();

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(r => r.title.toLowerCase().includes(needle) || (r.description || '').toLowerCase().includes(needle));
  }
  if (location) {
    rows = rows.filter(r => (r.location || '').toLowerCase().includes(location.toLowerCase()));
  }
  if (skill) {
    rows = rows.filter(r => JSON.parse(r.required_skills || '[]').some(s => s.toLowerCase().includes(skill.toLowerCase())));
  }

  let candidateSkills = [];
  let candidateExp = 0;
  if (req.user.role === 'candidate') {
    const me = db.prepare('SELECT skills, experience_years FROM users WHERE id = ?').get(req.user.id);
    candidateSkills = JSON.parse(me.skills || '[]');
    candidateExp = me.experience_years || 0;
  }

  const out = rows.map(j => {
    const extra = { employer_name: j.org_name || j.employer_name };
    if (req.user.role === 'candidate') {
      const { score } = matchScore(candidateSkills, JSON.parse(j.required_skills || '[]'), candidateExp);
      extra.match_score = score;
    }
    return jobOut(j, extra);
  });

  if (req.user.role === 'candidate') out.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  res.json(out);
});

router.get('/:id', authRequired, (req, res) => {
  const j = db.prepare(`SELECT j.*, u.name as employer_name, u.org_name FROM jobs j
    JOIN users u ON u.id = j.employer_id WHERE j.id = ?`).get(req.params.id);
  if (!j) return res.status(404).json({ error: 'Job not found' });
  res.json(jobOut(j, { employer_name: j.org_name || j.employer_name }));
});

router.post('/', authRequired, requireRole('employer', 'admin'), (req, res) => {
  const { title, description, required_skills, location, job_type, salary_min, salary_max } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db.prepare(`INSERT INTO jobs (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    req.user.id, title, description || '', JSON.stringify(required_skills || []),
    location || '', job_type || 'Full-time', salary_min || null, salary_max || null
  );
  const j = db.prepare('SELECT * FROM jobs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(jobOut(j));
});

router.put('/:id', authRequired, requireRole('employer', 'admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (req.user.role !== 'admin' && job.employer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your job posting' });
  }
  const { title, description, required_skills, location, job_type, salary_min, salary_max, status } = req.body;
  db.prepare(`UPDATE jobs SET title=?, description=?, required_skills=?, location=?, job_type=?, salary_min=?, salary_max=?, status=? WHERE id=?`).run(
    title ?? job.title, description ?? job.description,
    JSON.stringify(required_skills ?? JSON.parse(job.required_skills || '[]')),
    location ?? job.location, job_type ?? job.job_type,
    salary_min ?? job.salary_min, salary_max ?? job.salary_max,
    status ?? job.status, req.params.id
  );
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json(jobOut(updated));
});

router.delete('/:id', authRequired, requireRole('employer', 'admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (req.user.role !== 'admin' && job.employer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your job posting' });
  }
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Employer: list jobs they posted
router.get('/mine/list', authRequired, requireRole('employer', 'admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(j => jobOut(j)));
});

module.exports = router;
