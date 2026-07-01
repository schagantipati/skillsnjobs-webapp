const express = require('express');
const { db } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function courseOut(c) {
  return {
    id: c.id, trainer_id: c.trainer_id, title: c.title, provider: c.provider,
    skill_tags: JSON.parse(c.skill_tags || '[]'), duration_weeks: c.duration_weeks,
    level: c.level, rating: c.rating, created_at: c.created_at
  };
}

router.get('/', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
  res.json(rows.map(courseOut));
});

router.post('/', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const { title, provider, skill_tags, duration_weeks, level } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db.prepare(`INSERT INTO courses (trainer_id,title,provider,skill_tags,duration_weeks,level,rating)
    VALUES (?,?,?,?,?,?,4.5)`).run(
    req.user.id, title, provider || req.user.name, JSON.stringify(skill_tags || []),
    duration_weeks || 4, level || 'Beginner'
  );
  const c = db.prepare('SELECT * FROM courses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(courseOut(c));
});

// Candidate enrolls
router.post('/:id/enroll', authRequired, requireRole('candidate'), (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const existing = db.prepare('SELECT id FROM enrollments WHERE course_id=? AND candidate_id=?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already enrolled' });
  db.prepare('INSERT INTO enrollments (course_id, candidate_id) VALUES (?,?)').run(req.params.id, req.user.id);
  res.status(201).json({ ok: true });
});

router.get('/mine/enrollments', authRequired, requireRole('candidate'), (req, res) => {
  const rows = db.prepare(`SELECT e.*, c.title, c.provider, c.duration_weeks, c.level
    FROM enrollments e JOIN courses c ON c.id = e.course_id
    WHERE e.candidate_id = ? ORDER BY e.created_at DESC`).all(req.user.id);
  res.json(rows);
});

// Recommend courses that close the candidate's biggest skill gaps vs open jobs
router.get('/recommendations/for-me', authRequired, requireRole('candidate'), (req, res) => {
  const me = db.prepare('SELECT skills FROM users WHERE id = ?').get(req.user.id);
  const mySkills = new Set(JSON.parse(me.skills || '[]').map(s => s.toLowerCase()));

  const jobs = db.prepare(`SELECT required_skills FROM jobs WHERE status='open'`).all();
  const gapCount = {};
  for (const j of jobs) {
    for (const s of JSON.parse(j.required_skills || '[]')) {
      const key = s.toLowerCase();
      if (!mySkills.has(key)) gapCount[key] = (gapCount[key] || 0) + 1;
    }
  }
  const topGaps = Object.entries(gapCount).sort((a, b) => b[1] - a[1]).map(([s]) => s);

  const courses = db.prepare('SELECT * FROM courses').all();
  const scored = courses.map(c => {
    const tags = JSON.parse(c.skill_tags || '[]').map(s => s.toLowerCase());
    const relevance = tags.filter(t => topGaps.includes(t)).length;
    return { ...courseOut(c), relevance };
  }).filter(c => c.relevance > 0).sort((a, b) => b.relevance - a.relevance);

  res.json({ topSkillGaps: topGaps.slice(0, 6), recommendedCourses: scored });
});

module.exports = router;
