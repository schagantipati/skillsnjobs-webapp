const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/trainer-docs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${req.user.id}_${Date.now()}_${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf','.jpg','.jpeg','.png','.doc','.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, JPG, PNG, DOC files allowed'));
  }
});

function trainerOnly(req, res, next) {
  if (req.user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// ── Certifications ──
router.get('/certifications', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_certifications WHERE trainer_id=? ORDER BY id').all(req.user.id));
});
router.post('/certifications', authRequired, trainerOnly, (req, res) => {
  const { cert_name, issuing_body, year, valid_until } = req.body;
  if (!cert_name || !issuing_body) return res.status(400).json({ error: 'cert_name and issuing_body are required' });
  const r = db.prepare('INSERT INTO trainer_certifications (trainer_id,cert_name,issuing_body,year,valid_until) VALUES (?,?,?,?,?)')
    .run(req.user.id, cert_name, issuing_body, year||null, valid_until||null);
  res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, cert_name, issuing_body, year, valid_until });
});
router.delete('/certifications/:id', authRequired, trainerOnly, (req, res) => {
  db.prepare('DELETE FROM trainer_certifications WHERE id=? AND trainer_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Documents ──
router.get('/documents', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_documents WHERE trainer_id=? ORDER BY id').all(req.user.id));
});

router.post('/documents', authRequired, trainerOnly, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'File upload error' });
    const { doc_type } = req.body;
    if (!doc_type) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'doc_type is required' });
    }
    const file_name = req.file ? req.file.originalname : null;
    const file_path = req.file ? req.file.filename : null;
    const r = db.prepare('INSERT INTO trainer_documents (trainer_id,doc_type,status,file_name,file_path) VALUES (?,?,?,?,?)')
      .run(req.user.id, doc_type, 'Submitted', file_name, file_path);
    res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, doc_type, status: 'Submitted', file_name, file_path });
  });
});

router.get('/documents/:id/download', (req, res) => {
  // Accept token from Authorization header OR ?token= query param (needed for <a href> downloads)
  const header = req.headers.authorization || '';
  const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
  const tokenFromQuery = req.query.token || null;
  const token = tokenFromHeader || tokenFromQuery;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  let user;
  try { user = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
  if (user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  const doc = db.prepare('SELECT * FROM trainer_documents WHERE id=? AND trainer_id=?').get(req.params.id, user.id);
  if (!doc || !doc.file_path) return res.status(404).json({ error: 'File not found' });
  const fullPath = path.join(UPLOADS_DIR, doc.file_path);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File missing on disk' });
  res.download(fullPath, doc.file_name || doc.file_path);
});

router.put('/documents/:id', authRequired, trainerOnly, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE trainer_documents SET status=? WHERE id=? AND trainer_id=?').run(status, req.params.id, req.user.id);
  res.json({ ok: true });
});
router.delete('/documents/:id', authRequired, trainerOnly, (req, res) => {
  const doc = db.prepare('SELECT file_path FROM trainer_documents WHERE id=? AND trainer_id=?').get(req.params.id, req.user.id);
  if (doc?.file_path) {
    const fullPath = path.join(UPLOADS_DIR, doc.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  db.prepare('DELETE FROM trainer_documents WHERE id=? AND trainer_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Sessions ──
router.get('/sessions', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_sessions WHERE trainer_id=? ORDER BY session_date DESC, start_time').all(req.user.id));
});
router.post('/sessions', authRequired, trainerOnly, (req, res) => {
  const { batch_id, topic, session_date, start_time, duration_hrs, venue, mode, status } = req.body;
  if (!topic || !session_date) return res.status(400).json({ error: 'topic and session_date are required' });
  const r = db.prepare(`INSERT INTO trainer_sessions (trainer_id,batch_id,topic,session_date,start_time,duration_hrs,venue,mode,status)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(req.user.id, batch_id||null, topic, session_date, start_time||null,
    duration_hrs||null, venue||null, mode||'Classroom', status||'scheduled');
  res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, batch_id, topic, session_date, start_time, duration_hrs, venue, mode: mode||'Classroom', status: status||'scheduled' });
});
router.put('/sessions/:id', authRequired, trainerOnly, (req, res) => {
  const { topic, session_date, start_time, duration_hrs, venue, mode, status } = req.body;
  db.prepare(`UPDATE trainer_sessions SET topic=?,session_date=?,start_time=?,duration_hrs=?,venue=?,mode=?,status=? WHERE id=? AND trainer_id=?`)
    .run(topic, session_date, start_time, duration_hrs, venue, mode, status, req.params.id, req.user.id);
  res.json({ ok: true });
});
router.delete('/sessions/:id', authRequired, trainerOnly, (req, res) => {
  db.prepare('DELETE FROM trainer_sessions WHERE id=? AND trainer_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Assessments ──
router.get('/assessments', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_assessments WHERE trainer_id=? ORDER BY date DESC').all(req.user.id));
});
router.post('/assessments', authRequired, trainerOnly, (req, res) => {
  const { batch_id, type, date, duration_hrs, total_marks, passing_marks, assessor, status } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  const r = db.prepare(`INSERT INTO trainer_assessments (trainer_id,batch_id,type,date,duration_hrs,total_marks,passing_marks,assessor,status)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(req.user.id, batch_id||null, type||'Final', date,
    duration_hrs||null, total_marks||100, passing_marks||50, assessor||null, status||'scheduled');
  res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, batch_id, type: type||'Final', date, duration_hrs, total_marks: total_marks||100, passing_marks: passing_marks||50, assessor, status: status||'scheduled' });
});
router.put('/assessments/:id', authRequired, trainerOnly, (req, res) => {
  const { type, date, duration_hrs, total_marks, passing_marks, assessor, status } = req.body;
  db.prepare(`UPDATE trainer_assessments SET type=?,date=?,duration_hrs=?,total_marks=?,passing_marks=?,assessor=?,status=? WHERE id=? AND trainer_id=?`)
    .run(type, date, duration_hrs, total_marks, passing_marks, assessor, status, req.params.id, req.user.id);
  res.json({ ok: true });
});
router.delete('/assessments/:id', authRequired, trainerOnly, (req, res) => {
  db.prepare('DELETE FROM trainer_assessments WHERE id=? AND trainer_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Mock Tests ──
router.get('/mock-tests', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_mock_tests WHERE trainer_id=? ORDER BY date DESC').all(req.user.id));
});
router.post('/mock-tests', authRequired, trainerOnly, (req, res) => {
  const { batch_id, subject, date, duration_min, questions } = req.body;
  if (!subject || !date) return res.status(400).json({ error: 'subject and date are required' });
  const r = db.prepare('INSERT INTO trainer_mock_tests (trainer_id,batch_id,subject,date,duration_min,questions) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, batch_id||null, subject, date, duration_min||60, questions||50);
  res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, batch_id, subject, date, duration_min: duration_min||60, questions: questions||50 });
});
router.delete('/mock-tests/:id', authRequired, trainerOnly, (req, res) => {
  db.prepare('DELETE FROM trainer_mock_tests WHERE id=? AND trainer_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Content ──
router.get('/content', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_content WHERE trainer_id=? ORDER BY id DESC').all(req.user.id));
});
router.post('/content', authRequired, trainerOnly, (req, res) => {
  const { type, title, description, batch_targets, file_name } = req.body;
  if (!title || !type) return res.status(400).json({ error: 'title and type are required' });
  const r = db.prepare('INSERT INTO trainer_content (trainer_id,type,title,description,batch_targets,file_name) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, type, title, description||null, batch_targets||'All', file_name||null);
  res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, type, title, description, batch_targets: batch_targets||'All', file_name, views: 0 });
});
router.delete('/content/:id', authRequired, trainerOnly, (req, res) => {
  db.prepare('DELETE FROM trainer_content WHERE id=? AND trainer_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Support Tickets ──
router.get('/tickets', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_support_tickets WHERE trainer_id=? ORDER BY id DESC').all(req.user.id));
});
router.post('/tickets', authRequired, trainerOnly, (req, res) => {
  const { category, priority, subject, details } = req.body;
  if (!subject || !details) return res.status(400).json({ error: 'subject and details are required' });
  const ticket_id = 'TKT-' + String(Date.now()).slice(-5);
  const r = db.prepare('INSERT INTO trainer_support_tickets (trainer_id,ticket_id,category,priority,subject,details,status) VALUES (?,?,?,?,?,?,?)')
    .run(req.user.id, ticket_id, category||'Other', priority||'Medium', subject, details, 'Open');
  res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, ticket_id, category: category||'Other', priority: priority||'Medium', subject, details, status: 'Open' });
});
router.put('/tickets/:id', authRequired, trainerOnly, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE trainer_support_tickets SET status=? WHERE id=? AND trainer_id=?').run(status, req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Grievances ──
router.get('/grievances', authRequired, trainerOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM trainer_grievances WHERE trainer_id=? ORDER BY id DESC').all(req.user.id));
});
router.post('/grievances', authRequired, trainerOnly, (req, res) => {
  const { grievance_type, against_whom, details } = req.body;
  if (!details) return res.status(400).json({ error: 'details are required' });
  const ref_id = 'GRV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);
  const r = db.prepare('INSERT INTO trainer_grievances (trainer_id,ref_id,grievance_type,against_whom,details,status) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, ref_id, grievance_type||'Other', against_whom||null, details, 'Submitted');
  res.json({ id: r.lastInsertRowid, trainer_id: req.user.id, ref_id, grievance_type: grievance_type||'Other', against_whom, details, status: 'Submitted' });
});

// ── Computed Reports ──
router.get('/reports/attendance', authRequired, trainerOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT b.id, b.batch_code, b.name,
      COUNT(DISTINCT a.date) sessions,
      ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) avg_att,
      COUNT(DISTINCT CASE WHEN (
        SELECT AVG(CASE WHEN a2.present=1 THEN 100.0 ELSE 0 END)
        FROM attendance a2 WHERE a2.batch_id=b.id AND a2.candidate_id=a.candidate_id
      ) < 60 THEN a.candidate_id END) below60
    FROM batches b
    LEFT JOIN attendance a ON a.batch_id=b.id
    WHERE b.trainer_id=?
    GROUP BY b.id
  `).all(req.user.id);
  res.json(rows);
});

router.get('/reports/batch', authRequired, trainerOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT b.id, b.batch_code, b.name, b.status,
      COUNT(DISTINCT be.candidate_id) enrolled,
      COUNT(DISTINCT CASE WHEN be.status='completed' THEN be.candidate_id END) completed_count,
      COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) passed_count,
      COUNT(DISTINCT CASE WHEN be.status='dropped' THEN be.candidate_id END) dropout_count
    FROM batches b
    LEFT JOIN batch_enrollments be ON be.batch_id=b.id
    WHERE b.trainer_id=?
    GROUP BY b.id
  `).all(req.user.id);
  res.json(rows);
});

router.get('/reports/dropout', authRequired, trainerOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT u.name, u.email, b.batch_code,
      ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) att_pct,
      be.status
    FROM batch_enrollments be
    JOIN users u ON u.id=be.candidate_id
    JOIN batches b ON b.id=be.batch_id
    LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
    WHERE b.trainer_id=? AND be.status='enrolled'
    GROUP BY be.id
    HAVING att_pct < 70
    ORDER BY att_pct ASC
    LIMIT 20
  `).all(req.user.id);
  res.json(rows);
});

router.get('/reports/assessment', authRequired, trainerOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT b.batch_code, b.name,
      COUNT(DISTINCT be.candidate_id) appeared,
      COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) pass_count,
      COUNT(DISTINCT CASE WHEN be.passed=0 THEN be.candidate_id END) fail_count,
      ROUND(AVG(be.assessment_score),1) avg_score
    FROM batches b
    JOIN batch_enrollments be ON be.batch_id=b.id
    WHERE b.trainer_id=? AND be.assessment_score IS NOT NULL
    GROUP BY b.id
  `).all(req.user.id);
  res.json(rows);
});

router.get('/reports/placement', authRequired, trainerOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT u.name, b.batch_code, p.company_name, p.ctc, p.status, p.placed_date
    FROM placements p
    JOIN users u ON u.id=p.candidate_id
    LEFT JOIN batch_enrollments be ON be.candidate_id=p.candidate_id
    LEFT JOIN batches b ON b.id=be.batch_id AND b.trainer_id=?
    WHERE b.trainer_id=?
    ORDER BY p.placed_date DESC
    LIMIT 50
  `).all(req.user.id, req.user.id);
  res.json(rows);
});

// ── Eligible for certificates (passed + attendance ≥70%) ──
router.get('/cert-eligible', authRequired, trainerOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT u.name, u.email, b.batch_code, be.assessment_score,
      ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) att_pct,
      be.passed, be.status
    FROM batch_enrollments be
    JOIN users u ON u.id=be.candidate_id
    JOIN batches b ON b.id=be.batch_id
    LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
    WHERE b.trainer_id=?
    GROUP BY be.id
    ORDER BY u.name
  `).all(req.user.id);
  res.json(rows);
});

// ── Notifications (computed from real data) ──
router.get('/notifications', authRequired, trainerOnly, (req, res) => {
  const tid = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const items = [];

  // Today's sessions not yet started
  const todaySessions = db.prepare(`
    SELECT s.topic, b.batch_code FROM trainer_sessions s
    JOIN batches b ON b.id=s.batch_id
    WHERE s.trainer_id=? AND s.session_date=? ORDER BY s.start_time
  `).all(tid, today);
  todaySessions.forEach(s => items.push({
    color: 'gold', icon: '📅',
    title: `Session today: ${s.topic} (${s.batch_code})`,
    meta: `Today`,
  }));

  // Upcoming assessments in next 7 days
  const upcomingAssess = db.prepare(`
    SELECT a.type, a.date, b.batch_code FROM trainer_assessments a
    JOIN batches b ON b.id=a.batch_id
    WHERE a.trainer_id=? AND a.date BETWEEN ? AND ? ORDER BY a.date
  `).all(tid, today, in7);
  upcomingAssess.forEach(a => items.push({
    color: 'blue', icon: '📝',
    title: `${a.type} assessment for ${a.batch_code} on ${a.date}`,
    meta: a.date,
  }));

  // At-risk learners (< 70% attendance)
  const atRisk = db.prepare(`
    SELECT COUNT(DISTINCT be.candidate_id) cnt
    FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id
    LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
    WHERE b.trainer_id=? AND be.status='enrolled'
    GROUP BY be.candidate_id
    HAVING ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) < 70
  `).all(tid);
  if (atRisk.length > 0) items.push({
    color: 'red', icon: '⚠️',
    title: `${atRisk.length} learner${atRisk.length > 1 ? 's are' : ' is'} below 70% attendance and at risk`,
    meta: 'Action required',
  });

  // Batches ending within 14 days
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const endingSoon = db.prepare(`
    SELECT batch_code, end_date FROM batches WHERE trainer_id=? AND status='active' AND end_date BETWEEN ? AND ?
  `).all(tid, today, in14);
  endingSoon.forEach(b => items.push({
    color: 'purple', icon: '🏁',
    title: `Batch ${b.batch_code} ends on ${b.end_date}`,
    meta: b.end_date,
  }));

  // Recent sessions conducted (last 3 days)
  const since3 = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const recentSessions = db.prepare(`
    SELECT s.topic, s.session_date, b.batch_code FROM trainer_sessions s
    JOIN batches b ON b.id=s.batch_id
    WHERE s.trainer_id=? AND s.session_date BETWEEN ? AND ? AND s.session_date < ?
    ORDER BY s.session_date DESC LIMIT 3
  `).all(tid, since3, today, today);
  recentSessions.forEach(s => items.push({
    color: 'green', icon: '✅',
    title: `Session conducted: ${s.topic} (${s.batch_code})`,
    meta: s.session_date,
  }));

  // Unresolved support tickets
  const openTickets = db.prepare(`SELECT COUNT(*) cnt FROM trainer_support_tickets WHERE trainer_id=? AND status='Open'`).get(tid);
  if (openTickets.cnt > 0) items.push({
    color: 'teal', icon: '🎧',
    title: `${openTickets.cnt} open support ticket${openTickets.cnt > 1 ? 's' : ''} awaiting response`,
    meta: 'Help & Support',
  });

  // Cert-eligible learners
  const eligible = db.prepare(`
    SELECT COUNT(*) cnt FROM batch_enrollments be
    JOIN batches b ON b.id=be.batch_id
    WHERE b.trainer_id=? AND be.passed=1
  `).get(tid);
  if (eligible.cnt > 0) items.push({
    color: 'gold', icon: '🏆',
    title: `${eligible.cnt} learner${eligible.cnt > 1 ? 's are' : ' is'} eligible for certificate issuance`,
    meta: 'Certificates → Issue',
  });

  if (items.length === 0) items.push({ color: 'green', icon: '✅', title: 'All caught up! No pending actions.', meta: 'System' });

  res.json(items);
});

// ── Certificate verification ──
router.get('/cert-verify', authRequired, trainerOnly, (req, res) => {
  const { cert_no } = req.query;
  if (!cert_no) return res.status(400).json({ error: 'cert_no is required' });
  const cert = db.prepare(`
    SELECT cc.*, u.name as candidate_name, u.email
    FROM candidate_certificates cc
    JOIN users u ON u.id=cc.candidate_id
    WHERE cc.cert_no=?
  `).get(cert_no.trim());
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  res.json(cert);
});

// ── Scheme-wise batch report ──
router.get('/reports/scheme', authRequired, trainerOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT b.id, b.batch_code, b.name, b.scheme_type, b.status,
      COUNT(DISTINCT be.candidate_id) enrolled,
      COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) passed_count,
      COUNT(DISTINCT CASE WHEN be.status='completed' THEN be.candidate_id END) completed_count,
      ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) avg_att
    FROM batches b
    LEFT JOIN batch_enrollments be ON be.batch_id=b.id
    LEFT JOIN attendance a ON a.batch_id=b.id
    WHERE b.trainer_id=?
    GROUP BY b.id
    ORDER BY b.scheme_type, b.start_date DESC
  `).all(req.user.id);
  res.json(rows);
});

module.exports = router;
