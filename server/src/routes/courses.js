const express = require('express');
const { query, queryOne, execute } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function courseOut(c) {
  return {
    id: c.id, trainer_id: c.trainer_id, title: c.title, provider: c.provider,
    skill_tags: JSON.parse(c.skill_tags || '[]'), duration_weeks: c.duration_weeks,
    level: c.level, rating: c.rating, created_at: c.created_at
  };
}

router.get('/', authRequired, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(rows.map(courseOut));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const { title, provider, skill_tags, duration_weeks, level } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const result = await execute(`INSERT INTO courses (trainer_id,title,provider,skill_tags,duration_weeks,level,rating)
      VALUES ($1,$2,$3,$4,$5,$6,4.5) RETURNING id`, [
      req.user.id, title, provider || req.user.name, JSON.stringify(skill_tags || []),
      duration_weeks || 4, level || 'Beginner'
    ]);
    const c = await queryOne('SELECT * FROM courses WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(courseOut(c));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Candidate enrolls
router.post('/:id/enroll', authRequired, requireRole('candidate'), async (req, res) => {
  try {
    const course = await queryOne('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const existing = await queryOne('SELECT id FROM enrollments WHERE course_id=$1 AND candidate_id=$2', [req.params.id, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Already enrolled' });
    await execute('INSERT INTO enrollments (course_id, candidate_id) VALUES ($1,$2)', [req.params.id, req.user.id]);
    res.status(201).json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/mine/enrollments', authRequired, requireRole('candidate'), async (req, res) => {
  try {
    const rows = await query(`SELECT e.*, c.title, c.provider, c.duration_weeks, c.level
      FROM enrollments e JOIN courses c ON c.id = e.course_id
      WHERE e.candidate_id = $1 ORDER BY e.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/mine/certificates', authRequired, requireRole('candidate'), async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM candidate_certificates WHERE candidate_id=$1 ORDER BY issued_date DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/mine/grievances', authRequired, requireRole('candidate'), async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM candidate_grievances WHERE candidate_id=$1 ORDER BY created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/mine/grievances', authRequired, requireRole('candidate'), async (req, res) => {
  try {
    const { category, subject, description } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'subject and description are required' });
    const result = await execute(`INSERT INTO candidate_grievances (candidate_id,category,subject,description) VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.user.id, category || 'Other', subject, description]);
    const row = await queryOne('SELECT * FROM candidate_grievances WHERE id=$1', [result.rows[0].id]);
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Recommend courses that close the candidate's biggest skill gaps vs open jobs
router.get('/recommendations/for-me', authRequired, requireRole('candidate'), async (req, res) => {
  try {
    const me = await queryOne('SELECT skills FROM users WHERE id = $1', [req.user.id]);
    const mySkills = new Set(JSON.parse(me.skills || '[]').map(s => s.toLowerCase()));

    const jobs = await query(`SELECT required_skills FROM jobs WHERE status='open'`);
    const gapCount = {};
    for (const j of jobs) {
      for (const s of JSON.parse(j.required_skills || '[]')) {
        const key = s.toLowerCase();
        if (!mySkills.has(key)) gapCount[key] = (gapCount[key] || 0) + 1;
      }
    }
    const topGaps = Object.entries(gapCount).sort((a, b) => b[1] - a[1]).map(([s]) => s);

    const courses = await query('SELECT * FROM courses');
    const scored = courses.map(c => {
      const tags = JSON.parse(c.skill_tags || '[]').map(s => s.toLowerCase());
      const relevance = tags.filter(t => topGaps.includes(t)).length;
      return { ...courseOut(c), relevance };
    }).filter(c => c.relevance > 0).sort((a, b) => b.relevance - a.relevance);

    res.json({ topSkillGaps: topGaps.slice(0, 6), recommendedCourses: scored });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
