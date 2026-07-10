const express = require('express');
const { query, queryOne, execute } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { matchScore } = require('../match');

const router = express.Router();

// Admin: get all applications
router.get('/all', authRequired, requireRole('admin', 'administrator'), async (req, res) => {
  try {
    const rows = await query(`SELECT a.*, j.title, j.location, j.job_type,
      u_emp.org_name, u_emp.name as employer_name,
      u_can.name as candidate_name, u_can.email
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u_emp ON u_emp.id = j.employer_id
      JOIN users u_can ON u_can.id = a.candidate_id
      ORDER BY a.created_at DESC`);
    res.json(rows.map(r => ({ ...r, employer_name: r.org_name || r.employer_name })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Candidate withdraws own application; admin can delete any
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const app = await queryOne('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    const isAdmin = ['admin', 'administrator'].includes(req.user.role);
    const isOwner = req.user.role === 'candidate' && app.candidate_id === req.user.id;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    await execute('DELETE FROM applications WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Candidate applies to a job
router.post('/', authRequired, requireRole('candidate', 'administrator'), async (req, res) => {
  try {
    const { job_id } = req.body;
    const job = await queryOne('SELECT * FROM jobs WHERE id = $1', [job_id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const existing = await queryOne('SELECT id FROM applications WHERE job_id=$1 AND candidate_id=$2', [job_id, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Already applied to this job' });

    const me = await queryOne('SELECT skills, experience_years FROM users WHERE id = $1', [req.user.id]);
    const { score } = matchScore(JSON.parse(me.skills || '[]'), JSON.parse(job.required_skills || '[]'), me.experience_years || 0);

    const result = await execute('INSERT INTO applications (job_id, candidate_id, match_score) VALUES ($1,$2,$3) RETURNING id', [job_id, req.user.id, score]);
    const app = await queryOne('SELECT * FROM applications WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(app);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Candidate: my applications
router.get('/mine', authRequired, requireRole('candidate'), async (req, res) => {
  try {
    const rows = await query(`SELECT a.*, j.title, j.location, j.job_type, u.org_name, u.name as employer_name
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN users u ON u.id = j.employer_id
      WHERE a.candidate_id = $1 ORDER BY a.created_at DESC`, [req.user.id]);
    res.json(rows.map(r => ({ ...r, employer_name: r.org_name || r.employer_name })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Employer: view applicants for a given job
router.get('/job/:jobId', authRequired, requireRole('employer', 'admin'), async (req, res) => {
  try {
    const job = await queryOne('SELECT * FROM jobs WHERE id = $1', [req.params.jobId]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (req.user.role !== 'admin' && job.employer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your job posting' });
    }
    const rows = await query(`SELECT a.*, u.name as candidate_name, u.email, u.location, u.skills, u.experience_years
      FROM applications a JOIN users u ON u.id = a.candidate_id
      WHERE a.job_id = $1 ORDER BY a.match_score DESC`, [req.params.jobId]);
    res.json(rows.map(r => ({ ...r, skills: JSON.parse(r.skills || '[]') })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Employer updates application status
router.put('/:id/status', authRequired, requireRole('employer', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['applied', 'shortlisted', 'interview', 'rejected', 'hired'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const app = await queryOne('SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=$1', [req.params.id]);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (req.user.role !== 'admin' && app.employer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your job posting' });
    }
    await execute('UPDATE applications SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ ...app, status });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
