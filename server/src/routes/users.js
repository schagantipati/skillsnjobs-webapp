const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    org_name: u.org_name, location: u.location, bio: u.bio,
    skills: JSON.parse(u.skills || '[]'), experience_years: u.experience_years
  };
}

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(user));
});

router.put('/me', authRequired, (req, res) => {
  const { name, location, bio, skills, experience_years, org_name } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  db.prepare(`UPDATE users SET name=?, location=?, bio=?, skills=?, experience_years=?, org_name=? WHERE id=?`).run(
    name ?? existing.name,
    location ?? existing.location,
    bio ?? existing.bio,
    JSON.stringify(skills ?? JSON.parse(existing.skills || '[]')),
    experience_years ?? existing.experience_years,
    org_name ?? existing.org_name,
    req.user.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(publicUser(updated));
});

// Employers/admin can browse candidates
router.get('/candidates', authRequired, (req, res) => {
  if (!['employer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`SELECT * FROM users WHERE role = 'candidate' ORDER BY created_at DESC`).all();
  res.json(rows.map(publicUser));
});

module.exports = router;
