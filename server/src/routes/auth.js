const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    org_name: u.org_name, location: u.location, bio: u.bio,
    skills: JSON.parse(u.skills || '[]'), experience_years: u.experience_years
  };
}

router.post('/register', (req, res) => {
  const { name, email, password, role, org_name, location, bio, skills } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (!['candidate', 'employer', 'trainer'].includes(role)) {
    return res.status(400).json({ error: 'role must be candidate, employer or trainer' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`INSERT INTO users (name,email,password_hash,role,org_name,location,bio,skills,experience_years)
    VALUES (?,?,?,?,?,?,?,?,0)`).run(
    name, email, password_hash, role, org_name || null, location || null, bio || null,
    JSON.stringify(skills || [])
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: publicUser(user) });
});

module.exports = router;
