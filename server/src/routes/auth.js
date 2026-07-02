const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, logAudit } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// In-memory OTP store: key = "type:value", value = { otp, expires }
const otpStore = new Map();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    org_name: u.org_name, location: u.location, bio: u.bio,
    skills: JSON.parse(u.skills || '[]'), experience_years: u.experience_years,
    first_name: u.first_name, middle_name: u.middle_name, last_name: u.last_name,
    dob: u.dob, gender: u.gender, phone: u.phone,
    address_line1: u.address_line1, address_line2: u.address_line2,
    city: u.city, state_name: u.state_name, country: u.country, pincode: u.pincode,
    photo: u.photo,
  };
}

// Send OTP to mobile or email
router.post('/send-otp', (req, res) => {
  const { type, value } = req.body; // type: 'mobile' | 'email'
  if (!type || !value) return res.status(400).json({ error: 'type and value are required' });

  const otp = generateOtp();
  const key = `${type}:${value}`;
  otpStore.set(key, { otp, expires: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

  // In production: integrate SMS (Twilio/MSG91) or email (SendGrid/SES) here
  console.log(`[OTP] ${type.toUpperCase()} OTP for ${value}: ${otp}`);

  res.json({ success: true, message: `OTP sent to ${type === 'mobile' ? 'mobile number' : 'email address'}`, ...(process.env.NODE_ENV !== 'production' ? { dev_otp: otp } : {}) });
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { type, value, otp } = req.body;
  if (!type || !value || !otp) return res.status(400).json({ error: 'type, value and otp are required' });

  const key = `${type}:${value}`;
  const record = otpStore.get(key);
  if (!record) return res.status(400).json({ error: 'OTP not sent or expired. Please request a new OTP.' });
  if (Date.now() > record.expires) { otpStore.delete(key); return res.status(400).json({ error: 'OTP has expired. Please request a new one.' }); }
  if (record.otp !== String(otp)) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });

  otpStore.delete(key);
  res.json({ success: true, verified: true });
});

router.post('/register', (req, res) => {
  const {
    name, email, password, role, org_name, location, bio, skills,
    first_name, middle_name, last_name, dob, gender, phone,
    address_line1, address_line2, city, state_name, country, pincode, photo,
    mobile_verified, email_verified,
  } = req.body;

  const validRoles = ['candidate', 'employer', 'trainer', 'placement_agency', 'csr_org', 'administrator', 'state_government', 'central_government', 'training_vendor'];
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password and role are required' });
  if (!validRoles.includes(role)) return res.status(400).json({ error: `Invalid role` });

  // For candidates, enforce OTP verification
  if (role === 'candidate') {
    if (!mobile_verified) return res.status(400).json({ error: 'Mobile OTP verification is required' });
    if (!email_verified) return res.status(400).json({ error: 'Email OTP verification is required' });
    if (!first_name || !last_name) return res.status(400).json({ error: 'First name and last name are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing && role !== 'training_vendor') return res.status(409).json({ error: 'Email already registered', field: 'email' });

  // Training vendor duplicate checks
  if (role === 'training_vendor') {
    const dupEmail = db.prepare("SELECT id FROM users WHERE role='training_vendor' AND email=?").get(email);
    if (dupEmail) return res.status(409).json({ error: 'Email is already registered with another training vendor.', field: 'email' });
    // Email exists under a different role — still must block (DB unique constraint)
    if (existing) return res.status(409).json({ error: 'This email is already in use by another account.', field: 'email' });
    const { org_name: on, phone: ph, registration_number: rn, gstin: gs, pan: pn } = req.body;
    if (on?.trim()) {
      const dupOrg = db.prepare("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(org_name))=LOWER(TRIM(?))").get(on.trim());
      if (dupOrg) return res.status(409).json({ error: `Organisation "${on.trim()}" is already registered.`, field: 'org_name' });
    }
    if (ph?.trim()) {
      const dupPhone = db.prepare("SELECT id FROM users WHERE role='training_vendor' AND TRIM(phone)=TRIM(?)").get(ph.trim());
      if (dupPhone) return res.status(409).json({ error: `Mobile number ${ph.trim()} is already registered.`, field: 'phone' });
    }
    if (rn?.trim()) {
      const dupReg = db.prepare("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(registration_number))=LOWER(TRIM(?))").get(rn.trim());
      if (dupReg) return res.status(409).json({ error: `Registration/CIN number "${rn.trim()}" is already registered.`, field: 'registration_number' });
    }
    if (gs?.trim()) {
      const dupGst = db.prepare("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(gstin))=LOWER(TRIM(?))").get(gs.trim());
      if (dupGst) return res.status(409).json({ error: `GSTIN "${gs.trim()}" is already registered.`, field: 'gstin' });
    }
    if (pn?.trim()) {
      const dupPan = db.prepare("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(pan))=LOWER(TRIM(?))").get(pn.trim());
      if (dupPan) return res.status(409).json({ error: `PAN "${pn.trim()}" is already registered.`, field: 'pan' });
    }
  }

  const fullName = role === 'candidate'
    ? [first_name, middle_name, last_name].filter(Boolean).join(' ')
    : (name || email.split('@')[0]);

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO users (name,email,password_hash,role,org_name,location,bio,skills,experience_years,
      first_name,middle_name,last_name,dob,gender,phone,
      address_line1,address_line2,city,state_name,country,pincode,photo)
    VALUES (?,?,?,?,?,?,?,?,0, ?,?,?,?,?,?, ?,?,?,?,?,?,?)
  `).run(
    fullName, email, password_hash, role,
    org_name || null, location || city || null, bio || null,
    JSON.stringify(skills || []),
    first_name || null, middle_name || null, last_name || null,
    dob || null, gender || null, phone || null,
    address_line1 || null, address_line2 || null,
    city || null, state_name || null, country || 'India', pincode || null,
    photo || null,
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  logAudit({ user, action: 'User registered', entity: 'user', entityId: user.id, detail: `Role: ${user.role}`, ip: req.ip });
  res.status(201).json({ token, user: publicUser(user) });
});

// Forgot password — generates reset token, returns it (+ logs it for dev)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Always respond ok to prevent email enumeration
  if (!user) return res.json({ success: true });

  const token = require('crypto').randomBytes(32).toString('hex');
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(token, expires, user.id);
  logAudit({ user, action: 'Password reset requested', entity: 'user', entityId: user.id, ip: req.ip });

  // In production integrate SendGrid/SES here. For now return token so dev can use it.
  console.log(`[RESET] Token for ${email}: ${token}`);
  res.json({ success: true, ...(process.env.NODE_ENV !== 'production' ? { dev_token: token } : {}) });
});

// Reset password — validates token, updates password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
  if (Date.now() > user.reset_token_expires) {
    db.prepare('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(user.id);
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(password_hash, user.id);
  logAudit({ user, action: 'Password reset completed', entity: 'user', entityId: user.id, ip: req.ip });
  res.json({ success: true });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    logAudit({ user: null, action: 'Login failed', detail: `Email: ${email}`, ip: req.ip });
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  logAudit({ user, action: 'Login', entity: 'user', entityId: user.id, detail: `Role: ${user.role}`, ip: req.ip });
  res.json({ token, user: publicUser(user) });
});

module.exports = router;
