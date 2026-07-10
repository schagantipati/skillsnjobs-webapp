const express = require('express');
const { query, queryOne, execute } = require('../db');
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
router.get('/', authRequired, async (req, res) => {
  try {
    const { q, location, skill } = req.query;
    let rows = await query(`SELECT j.*, u.name as employer_name, u.org_name FROM jobs j
      JOIN users u ON u.id = j.employer_id WHERE j.status='open' ORDER BY j.created_at DESC`);

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
      const me = await queryOne('SELECT skills, experience_years FROM users WHERE id = $1', [req.user.id]);
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
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    const j = await queryOne(`SELECT j.*, u.name as employer_name, u.org_name FROM jobs j
      JOIN users u ON u.id = j.employer_id WHERE j.id = $1`, [req.params.id]);
    if (!j) return res.status(404).json({ error: 'Job not found' });
    res.json(jobOut(j, { employer_name: j.org_name || j.employer_name }));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

function stripTags(str) {
  return typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : str;
}

router.post('/', authRequired, requireRole('employer', 'admin', 'placement_agency'), async (req, res) => {
  try {
    const { title, description, required_skills, location, job_type, salary_min, salary_max } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const result = await execute(`INSERT INTO jobs (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [
      req.user.id, stripTags(title), stripTags(description) || '', JSON.stringify(required_skills || []),
      stripTags(location) || '', job_type || 'Full-time', salary_min || null, salary_max || null
    ]);
    const j = await queryOne('SELECT * FROM jobs WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(jobOut(j));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', authRequired, requireRole('employer', 'admin', 'placement_agency'), async (req, res) => {
  try {
    const job = await queryOne('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (req.user.role !== 'admin' && job.employer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your job posting' });
    }
    const { title, description, required_skills, location, job_type, salary_min, salary_max, status } = req.body;
    await execute(`UPDATE jobs SET title=$1, description=$2, required_skills=$3, location=$4, job_type=$5, salary_min=$6, salary_max=$7, status=$8 WHERE id=$9`, [
      stripTags(title ?? job.title), stripTags(description ?? job.description),
      JSON.stringify(required_skills ?? JSON.parse(job.required_skills || '[]')),
      location ?? job.location, job_type ?? job.job_type,
      salary_min ?? job.salary_min, salary_max ?? job.salary_max,
      status ?? job.status, req.params.id
    ]);
    const updated = await queryOne('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    res.json(jobOut(updated));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', authRequired, requireRole('employer', 'admin', 'placement_agency'), async (req, res) => {
  try {
    const job = await queryOne('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (req.user.role !== 'admin' && job.employer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your job posting' });
    }
    await execute('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Employer: list jobs they posted
router.get('/mine/list', authRequired, requireRole('employer', 'admin', 'placement_agency'), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM jobs WHERE employer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows.map(j => jobOut(j)));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
