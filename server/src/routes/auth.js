const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, execute, logAudit } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// In-memory OTP store: key = "type:value", value = { otp, expires }
const otpStore = new Map();
setInterval(() => { const now = Date.now(); for (const [k, v] of otpStore) if (now > v.expires) otpStore.delete(k); }, 5 * 60 * 1000);

function generateOtp() {
  if (process.env.HARDCODE_OTP === 'true') return '000000';
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

// Check if email or phone is already registered (used before OTP send)
router.post('/check-duplicate', async (req, res) => {
  try {
    const { field, value } = req.body;
    if (!field || !value) return res.status(400).json({ error: 'field and value required' });
    let row;
    if (field === 'email') {
      row = await queryOne('SELECT id FROM users WHERE LOWER(TRIM(email))=LOWER(TRIM($1))', [value]);
      if (row) return res.status(409).json({ error: 'Email is already registered.', field: 'email' });
    } else if (field === 'phone') {
      const digits = value.replace(/\D/g, '').slice(-10);
      row = await queryOne("SELECT id FROM users WHERE RIGHT(REGEXP_REPLACE(phone,'\\D','','g'),10)=$1", [digits]);
      if (row) return res.status(409).json({ error: 'Mobile number is already registered.', field: 'phone' });
    }
    res.json({ available: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

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

  // Hardcode mode: accept 000000 without checking the store
  if (process.env.HARDCODE_OTP === 'true' && String(otp) === '000000') {
    return res.json({ success: true, verified: true });
  }

  const key = `${type}:${value}`;
  const record = otpStore.get(key);
  if (!record) return res.status(400).json({ error: 'OTP not sent or expired. Please request a new OTP.' });
  if (Date.now() > record.expires) { otpStore.delete(key); return res.status(400).json({ error: 'OTP has expired. Please request a new one.' }); }
  if (record.otp !== String(otp)) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });

  otpStore.delete(key);
  res.json({ success: true, verified: true });
});

router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role, org_name, location, bio, skills,
      first_name, middle_name, last_name, dob, gender, phone,
      address_line1, address_line2, city, state_name, country, pincode, photo,
      mobile_verified, email_verified,
    } = req.body;

    const validRoles = ['candidate', 'employer', 'trainer', 'placement_agency', 'csr_org', 'training_vendor'];
    if (!email || !password || !role) return res.status(400).json({ error: 'email, password and role are required' });
    if (!validRoles.includes(role)) return res.status(400).json({ error: `Invalid role` });

    // For candidates, trainers, employers and CSR orgs, enforce OTP verification
    if (['candidate', 'trainer', 'employer', 'csr_org', 'placement_agency'].includes(role)) {
      if (!mobile_verified) return res.status(400).json({ error: 'Mobile OTP verification is required' });
      if (!email_verified) return res.status(400).json({ error: 'Email OTP verification is required' });
      if (role === 'candidate' || role === 'trainer') {
        if (!first_name || !last_name) return res.status(400).json({ error: 'First name and last name are required' });
      } else {
        if (!first_name) return res.status(400).json({ error: 'Contact Person Name is required' });
      }
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing && role !== 'training_vendor') return res.status(409).json({ error: 'Email already registered', field: 'email' });

    // Phone duplicate check for non-vendor roles
    if (role !== 'training_vendor' && phone?.trim()) {
      const digits = phone.replace(/\D/g, '').slice(-10);
      const dupPhone = await queryOne("SELECT id FROM users WHERE RIGHT(REGEXP_REPLACE(phone,'\\D','','g'),10)=$1", [digits]);
      if (dupPhone) return res.status(409).json({ error: 'Mobile number is already registered with another account.', field: 'phone' });
    }

    // Training vendor duplicate checks
    if (role === 'training_vendor') {
      const dupEmail = await queryOne("SELECT id FROM users WHERE role='training_vendor' AND email=$1", [email]);
      if (dupEmail) return res.status(409).json({ error: 'Email is already registered with another training vendor.', field: 'email' });
      if (existing) return res.status(409).json({ error: 'This email is already in use by another account.', field: 'email' });
      const { org_name: on, phone: ph, registration_number: rn, gstin: gs, pan: pn } = req.body;
      if (on?.trim()) {
        const dupOrg = await queryOne("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(org_name))=LOWER(TRIM($1))", [on.trim()]);
        if (dupOrg) return res.status(409).json({ error: `Organisation "${on.trim()}" is already registered.`, field: 'org_name' });
      }
      if (ph?.trim()) {
        const dupPhone = await queryOne("SELECT id FROM users WHERE role='training_vendor' AND TRIM(phone)=TRIM($1)", [ph.trim()]);
        if (dupPhone) return res.status(409).json({ error: `Mobile number ${ph.trim()} is already registered.`, field: 'phone' });
      }
      if (rn?.trim()) {
        const dupReg = await queryOne("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(registration_number))=LOWER(TRIM($1))", [rn.trim()]);
        if (dupReg) return res.status(409).json({ error: `Registration/CIN number "${rn.trim()}" is already registered.`, field: 'registration_number' });
      }
      if (gs?.trim()) {
        const dupGst = await queryOne("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(gstin))=LOWER(TRIM($1))", [gs.trim()]);
        if (dupGst) return res.status(409).json({ error: `GSTIN "${gs.trim()}" is already registered.`, field: 'gstin' });
      }
      if (pn?.trim()) {
        const dupPan = await queryOne("SELECT id FROM users WHERE role='training_vendor' AND LOWER(TRIM(pan))=LOWER(TRIM($1))", [pn.trim()]);
        if (dupPan) return res.status(409).json({ error: `PAN "${pn.trim()}" is already registered.`, field: 'pan' });
      }
    }

    const fullName = (role === 'candidate' || role === 'trainer')
      ? [first_name, middle_name, last_name].filter(Boolean).join(' ')
      : (first_name || name || email.split('@')[0]);

    const password_hash = bcrypt.hashSync(password, 10);
    const result = await execute(`
      INSERT INTO users (name,email,password_hash,role,org_name,location,bio,skills,experience_years,
        first_name,middle_name,last_name,dob,gender,phone,
        address_line1,address_line2,city,state_name,country,pincode,photo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0, $9,$10,$11,$12,$13,$14, $15,$16,$17,$18,$19,$20,$21)
      RETURNING id
    `, [
      fullName, email, password_hash, role,
      org_name || null, location || city || null, bio || null,
      JSON.stringify(skills || []),
      first_name || null, middle_name || null, last_name || null,
      dob || null, gender || null, phone || null,
      address_line1 || null, address_line2 || null,
      city || null, state_name || null, country || 'India', pincode || null,
      photo || null,
    ]);

    const user = await queryOne('SELECT * FROM users WHERE id = $1', [result.rows[0].id]);
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    await logAudit({ user, action: 'User registered', entity: 'user', entityId: user.id, detail: `Role: ${user.role}`, ip: req.ip });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Forgot password — generates reset token, returns it (+ logs it for dev)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    // Always respond ok to prevent email enumeration
    if (!user) return res.json({ success: true });

    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    await execute('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [token, expires, user.id]);
    await logAudit({ user, action: 'Password reset requested', entity: 'user', entityId: user.id, ip: req.ip });

    console.log(`[RESET] Token for ${email}: ${token}`);
    res.json({ success: true, ...(process.env.NODE_ENV !== 'production' ? { dev_token: token } : {}) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Reset password — validates token, updates password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await queryOne('SELECT * FROM users WHERE reset_token = $1', [token]);
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (Date.now() > user.reset_token_expires) {
      await execute('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1', [user.id]);
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    await execute('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [password_hash, user.id]);
    await logAudit({ user, action: 'Password reset completed', entity: 'user', entityId: user.id, ip: req.ip });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      await logAudit({ user: null, action: 'Login failed', detail: `Email: ${email}`, ip: req.ip });
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    await logAudit({ user, action: 'Login', entity: 'user', entityId: user.id, detail: `Role: ${user.role}`, ip: req.ip });
    res.json({ token, user: publicUser(user) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
