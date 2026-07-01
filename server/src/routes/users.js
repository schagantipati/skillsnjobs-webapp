const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    org_name: u.org_name, location: u.location, bio: u.bio,
    skills: JSON.parse(u.skills || '[]'), experience_years: u.experience_years,
    first_name: u.first_name, middle_name: u.middle_name, last_name: u.last_name,
    dob: u.dob, gender: u.gender, phone: u.phone, photo: u.photo,
    address_line1: u.address_line1, address_line2: u.address_line2,
    city: u.city, state_name: u.state_name, country: u.country, pincode: u.pincode,
    category: u.category,
    qualification: u.qualification, year_passed: u.year_passed,
    board: u.board, university: u.university, percentage: u.percentage,
    employment_status: u.employment_status,
    interests: u.interests, preferred_sector: u.preferred_sector,
    lang_english: u.lang_english, lang_hindi: u.lang_hindi, lang_regional: u.lang_regional,
    certificates: u.certificates, resume: u.resume,
  };
}

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(user));
});

router.put('/me', authRequired, (req, res) => {
  const {
    name, location, bio, skills, experience_years, org_name,
    first_name, middle_name, last_name, dob, gender, phone, photo,
    address_line1, address_line2, city, state_name, country, pincode,
    category, qualification, year_passed, board, university, percentage,
    employment_status, interests, preferred_sector,
    lang_english, lang_hindi, lang_regional,
    certificates, resume,
  } = req.body;

  const e = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  db.prepare(`UPDATE users SET
    name=?, location=?, bio=?, skills=?, experience_years=?, org_name=?,
    first_name=?, middle_name=?, last_name=?, dob=?, gender=?, phone=?, photo=?,
    address_line1=?, address_line2=?, city=?, state_name=?, country=?, pincode=?,
    category=?, qualification=?, year_passed=?, board=?, university=?, percentage=?,
    employment_status=?, interests=?, preferred_sector=?,
    lang_english=?, lang_hindi=?, lang_regional=?,
    certificates=?, resume=?
    WHERE id=?`).run(
    name ?? e.name,
    location ?? e.location,
    bio ?? e.bio,
    JSON.stringify(skills ?? JSON.parse(e.skills || '[]')),
    experience_years ?? e.experience_years,
    org_name ?? e.org_name,
    first_name ?? e.first_name,
    middle_name ?? e.middle_name,
    last_name ?? e.last_name,
    dob ?? e.dob,
    gender ?? e.gender,
    phone ?? e.phone,
    photo ?? e.photo,
    address_line1 ?? e.address_line1,
    address_line2 ?? e.address_line2,
    city ?? e.city,
    state_name ?? e.state_name,
    country ?? e.country,
    pincode ?? e.pincode,
    category ?? e.category,
    qualification ?? e.qualification,
    year_passed ?? e.year_passed,
    board ?? e.board,
    university ?? e.university,
    percentage ?? e.percentage,
    employment_status ?? e.employment_status,
    interests ?? e.interests,
    preferred_sector ?? e.preferred_sector,
    lang_english ?? e.lang_english,
    lang_hindi ?? e.lang_hindi,
    lang_regional ?? e.lang_regional,
    certificates ?? e.certificates,
    resume ?? e.resume,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(publicUser(updated));
});

router.get('/candidates', authRequired, (req, res) => {
  if (!['employer', 'admin', 'administrator'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`SELECT * FROM users WHERE role = 'candidate' ORDER BY created_at DESC`).all();
  res.json(rows.map(publicUser));
});

module.exports = router;
