const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { matchScore } = require('../match');

const router = express.Router();

// Admin: get all applications
router.get('/all', authRequired, requireRole('admin', 'administrator'), (req, res) => {
  const rows = db.prepare(`SELECT a.*, j.title, j.location, j.job_type,
    u_emp.org_name, u_emp.name as employer_name,
    u_can.name as candidate_name, u_can.email
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u_emp ON u_emp.id = j.employer_id
    JOIN users u_can ON u_can.id = a.candidate_id
    ORDER BY a.created_at DESC`).all();
  res.json(rows.map(r => ({ ...r, employer_name: r.org_name || r.employer_name })));
});

// Admin: delete any application
router.delete('/:id', authRequired, requireRole('admin', 'administrator'), (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Candidate applies to a job
router.post('/', authRequired, requireRole('candidate', 'administrator'), (req, res) => {
  const { job_id } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const existing = db.prepare('SELECT id FROM applications WHERE job_id=? AND candidate_id=?').get(job_id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already applied to this job' });

  const me = db.prepare('SELECT skills, experience_years FROM users WHERE id = ?').get(req.user.id);
  const { score } = matchScore(JSON.parse(me.skills || '[]'), JSON.parse(job.required_skills || '[]'), me.experience_years || 0);

  const info = db.prepare('INSERT INTO applications (job_id, candidate_id, match_score) VALUES (?,?,?)').run(job_id, req.user.id, score);
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(app);
});

// Candidate: my applications
router.get('/mine', authRequired, requireRole('candidate'), (req, res) => {
  const rows = db.prepare(`SELECT a.*, j.title, j.location, j.job_type, u.org_name, u.name as employer_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u ON u.id = j.employer_id
    WHERE a.candidate_id = ? ORDER BY a.created_at DESC`).all(req.user.id);
  res.json(rows.map(r => ({ ...r, employer_name: r.org_name || r.employer_name })));
});

// Employer: view applicants for a given job
router.get('/job/:jobId', authRequired, requireRole('employer', 'admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (req.user.role !== 'admin' && job.employer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your job posting' });
  }
  const rows = db.prepare(`SELECT a.*, u.name as candidate_name, u.email, u.location, u.skills, u.experience_years
    FROM applications a JOIN users u ON u.id = a.candidate_id
    WHERE a.job_id = ? ORDER BY a.match_score DESC`).all(req.params.jobId);
  res.json(rows.map(r => ({ ...r, skills: JSON.parse(r.skills || '[]') })));
});

// Employer updates application status
router.put('/:id/status', authRequired, requireRole('employer', 'admin'), (req, res) => {
  const { status } = req.body;
  const allowed = ['applied', 'shortlisted', 'interview', 'rejected', 'hired'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const app = db.prepare('SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (req.user.role !== 'admin' && app.employer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your job posting' });
  }
  db.prepare('UPDATE applications SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ ...app, status });
});

module.exports = router;
