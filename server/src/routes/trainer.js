const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, queryOne, execute } = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/trainer-docs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
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
router.get('/certifications', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_certifications WHERE trainer_id=$1 ORDER BY id', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/certifications', authRequired, trainerOnly, async (req, res) => {
  try {
    const { cert_name, issuing_body, year, valid_until } = req.body;
    if (!cert_name || !issuing_body) return res.status(400).json({ error: 'cert_name and issuing_body are required' });
    const r = await execute('INSERT INTO trainer_certifications (trainer_id,cert_name,issuing_body,year,valid_until) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.user.id, cert_name, issuing_body, year||null, valid_until||null]);
    res.json({ id: r.rows[0].id, trainer_id: req.user.id, cert_name, issuing_body, year, valid_until });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/certifications/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    await execute('DELETE FROM trainer_certifications WHERE id=$1 AND trainer_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Documents ──
router.get('/documents', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_documents WHERE trainer_id=$1 ORDER BY id', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/documents', authRequired, trainerOnly, (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message || 'File upload error' });
      const { doc_type } = req.body;
      if (!doc_type) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'doc_type is required' });
      }
      const file_name = req.file ? req.file.originalname : null;
      const file_path = req.file ? req.file.filename : null;
      const r = await execute('INSERT INTO trainer_documents (trainer_id,doc_type,status,file_name,file_path) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [req.user.id, doc_type, 'Submitted', file_name, file_path]);
      res.json({ id: r.rows[0].id, trainer_id: req.user.id, doc_type, status: 'Submitted', file_name, file_path });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
  });
});

router.get('/documents/:id/download', async (req, res) => {
  const header = req.headers.authorization || '';
  const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
  const tokenFromQuery = req.query.token || null;
  const token = tokenFromHeader || tokenFromQuery;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  let user;
  try { user = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
  if (user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
  try {
    const doc = await queryOne('SELECT * FROM trainer_documents WHERE id=$1 AND trainer_id=$2', [req.params.id, user.id]);
    if (!doc || !doc.file_path) return res.status(404).json({ error: 'File not found' });
    const fullPath = path.join(UPLOADS_DIR, doc.file_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File missing on disk' });
    res.download(fullPath, doc.file_name || doc.file_path);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/documents/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    await execute('UPDATE trainer_documents SET status=$1 WHERE id=$2 AND trainer_id=$3', [status, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/documents/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    const doc = await queryOne('SELECT file_path FROM trainer_documents WHERE id=$1 AND trainer_id=$2', [req.params.id, req.user.id]);
    if (doc?.file_path) {
      const fullPath = path.join(UPLOADS_DIR, doc.file_path);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    await execute('DELETE FROM trainer_documents WHERE id=$1 AND trainer_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Sessions ──
router.get('/sessions', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_sessions WHERE trainer_id=$1 ORDER BY session_date DESC, start_time', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/sessions', authRequired, trainerOnly, async (req, res) => {
  try {
    const { batch_id, topic, session_date, start_time, duration_hrs, venue, mode, status } = req.body;
    if (!topic || !session_date) return res.status(400).json({ error: 'topic and session_date are required' });
    const r = await execute(`INSERT INTO trainer_sessions (trainer_id,batch_id,topic,session_date,start_time,duration_hrs,venue,mode,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.user.id, batch_id||null, topic, session_date, start_time||null, duration_hrs||null, venue||null, mode||'Classroom', status||'scheduled']);
    res.json({ id: r.rows[0].id, trainer_id: req.user.id, batch_id, topic, session_date, start_time, duration_hrs, venue, mode: mode||'Classroom', status: status||'scheduled' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.put('/sessions/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    const { topic, session_date, start_time, duration_hrs, venue, mode, status } = req.body;
    await execute(`UPDATE trainer_sessions SET topic=$1,session_date=$2,start_time=$3,duration_hrs=$4,venue=$5,mode=$6,status=$7 WHERE id=$8 AND trainer_id=$9`,
      [topic, session_date, start_time, duration_hrs, venue, mode, status, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/sessions/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    await execute('DELETE FROM trainer_sessions WHERE id=$1 AND trainer_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Assessments ──
router.get('/assessments', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_assessments WHERE trainer_id=$1 ORDER BY date DESC', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/assessments', authRequired, trainerOnly, async (req, res) => {
  try {
    const { batch_id, type, date, duration_hrs, total_marks, passing_marks, assessor, status } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });
    const r = await execute(`INSERT INTO trainer_assessments (trainer_id,batch_id,type,date,duration_hrs,total_marks,passing_marks,assessor,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.user.id, batch_id||null, type||'Final', date, duration_hrs||null, total_marks||100, passing_marks||50, assessor||null, status||'scheduled']);
    res.json({ id: r.rows[0].id, trainer_id: req.user.id, batch_id, type: type||'Final', date, duration_hrs, total_marks: total_marks||100, passing_marks: passing_marks||50, assessor, status: status||'scheduled' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.put('/assessments/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    const { type, date, duration_hrs, total_marks, passing_marks, assessor, status } = req.body;
    await execute(`UPDATE trainer_assessments SET type=$1,date=$2,duration_hrs=$3,total_marks=$4,passing_marks=$5,assessor=$6,status=$7 WHERE id=$8 AND trainer_id=$9`,
      [type, date, duration_hrs, total_marks, passing_marks, assessor, status, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/assessments/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    await execute('DELETE FROM trainer_assessments WHERE id=$1 AND trainer_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Mock Tests ──
router.get('/mock-tests', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_mock_tests WHERE trainer_id=$1 ORDER BY date DESC', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/mock-tests', authRequired, trainerOnly, async (req, res) => {
  try {
    const { batch_id, subject, date, duration_min, questions } = req.body;
    if (!subject || !date) return res.status(400).json({ error: 'subject and date are required' });
    const r = await execute('INSERT INTO trainer_mock_tests (trainer_id,batch_id,subject,date,duration_min,questions) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [req.user.id, batch_id||null, subject, date, duration_min||60, questions||50]);
    res.json({ id: r.rows[0].id, trainer_id: req.user.id, batch_id, subject, date, duration_min: duration_min||60, questions: questions||50 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/mock-tests/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    await execute('DELETE FROM trainer_mock_tests WHERE id=$1 AND trainer_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Content ──
router.get('/content', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_content WHERE trainer_id=$1 ORDER BY id DESC', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/content', authRequired, trainerOnly, async (req, res) => {
  try {
    const { type, title, description, batch_targets, file_name } = req.body;
    if (!title || !type) return res.status(400).json({ error: 'title and type are required' });
    const r = await execute('INSERT INTO trainer_content (trainer_id,type,title,description,batch_targets,file_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [req.user.id, type, title, description||null, batch_targets||'All', file_name||null]);
    res.json({ id: r.rows[0].id, trainer_id: req.user.id, type, title, description, batch_targets: batch_targets||'All', file_name, views: 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/content/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    await execute('DELETE FROM trainer_content WHERE id=$1 AND trainer_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Support Tickets ──
router.get('/tickets', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_support_tickets WHERE trainer_id=$1 ORDER BY id DESC', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/tickets', authRequired, trainerOnly, async (req, res) => {
  try {
    const { category, priority, subject, details } = req.body;
    if (!subject || !details) return res.status(400).json({ error: 'subject and details are required' });
    const ticket_id = 'TKT-' + String(Date.now()).slice(-5);
    const r = await execute('INSERT INTO trainer_support_tickets (trainer_id,ticket_id,category,priority,subject,details,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [req.user.id, ticket_id, category||'Other', priority||'Medium', subject, details, 'Open']);
    res.json({ id: r.rows[0].id, trainer_id: req.user.id, ticket_id, category: category||'Other', priority: priority||'Medium', subject, details, status: 'Open' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.put('/tickets/:id', authRequired, trainerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    await execute('UPDATE trainer_support_tickets SET status=$1 WHERE id=$2 AND trainer_id=$3', [status, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Grievances ──
router.get('/grievances', authRequired, trainerOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM trainer_grievances WHERE trainer_id=$1 ORDER BY id DESC', [req.user.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/grievances', authRequired, trainerOnly, async (req, res) => {
  try {
    const { grievance_type, against_whom, details } = req.body;
    if (!details) return res.status(400).json({ error: 'details are required' });
    const ref_id = 'GRV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);
    const r = await execute('INSERT INTO trainer_grievances (trainer_id,ref_id,grievance_type,against_whom,details,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [req.user.id, ref_id, grievance_type||'Other', against_whom||null, details, 'Submitted']);
    res.json({ id: r.rows[0].id, trainer_id: req.user.id, ref_id, grievance_type: grievance_type||'Other', against_whom, details, status: 'Submitted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Computed Reports ──
router.get('/reports/attendance', authRequired, trainerOnly, async (req, res) => {
  try {
    const rows = await query(`
      SELECT b.id, b.batch_code, b.name,
        COUNT(DISTINCT a.date) sessions,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) avg_att,
        COUNT(DISTINCT CASE WHEN (
          SELECT AVG(CASE WHEN a2.present=1 THEN 100.0 ELSE 0 END)
          FROM attendance a2 WHERE a2.batch_id=b.id AND a2.candidate_id=a.candidate_id
        ) < 60 THEN a.candidate_id END) below60
      FROM batches b
      LEFT JOIN attendance a ON a.batch_id=b.id
      WHERE b.trainer_id=$1
      GROUP BY b.id
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/reports/batch', authRequired, trainerOnly, async (req, res) => {
  try {
    const rows = await query(`
      SELECT b.id, b.batch_code, b.name, b.status,
        COUNT(DISTINCT be.candidate_id) enrolled,
        COUNT(DISTINCT CASE WHEN be.status='completed' THEN be.candidate_id END) completed_count,
        COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) passed_count,
        COUNT(DISTINCT CASE WHEN be.status='dropped' THEN be.candidate_id END) dropout_count
      FROM batches b
      LEFT JOIN batch_enrollments be ON be.batch_id=b.id
      WHERE b.trainer_id=$1
      GROUP BY b.id
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/reports/dropout', authRequired, trainerOnly, async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.name, u.email, b.batch_code,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) att_pct,
        be.status
      FROM batch_enrollments be
      JOIN users u ON u.id=be.candidate_id
      JOIN batches b ON b.id=be.batch_id
      LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
      WHERE b.trainer_id=$1 AND be.status='enrolled'
      GROUP BY be.id, u.name, u.email, b.batch_code, be.status
      HAVING ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) < 70
      ORDER BY att_pct ASC
      LIMIT 20
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/reports/assessment', authRequired, trainerOnly, async (req, res) => {
  try {
    const rows = await query(`
      SELECT b.batch_code, b.name,
        COUNT(DISTINCT be.candidate_id) appeared,
        COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) pass_count,
        COUNT(DISTINCT CASE WHEN be.passed=0 THEN be.candidate_id END) fail_count,
        ROUND(AVG(be.assessment_score),1) avg_score
      FROM batches b
      JOIN batch_enrollments be ON be.batch_id=b.id
      WHERE b.trainer_id=$1 AND be.assessment_score IS NOT NULL
      GROUP BY b.id, b.batch_code, b.name
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/reports/placement', authRequired, trainerOnly, async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.name, b.batch_code, p.company, p.ctc, p.status, p.placement_date
      FROM placements p
      JOIN users u ON u.id=p.candidate_id
      LEFT JOIN batch_enrollments be ON be.candidate_id=p.candidate_id
      LEFT JOIN batches b ON b.id=be.batch_id AND b.trainer_id=$1
      WHERE b.trainer_id=$2
      ORDER BY p.placement_date DESC
      LIMIT 50
    `, [req.user.id, req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Eligible for certificates (passed + attendance ≥70%) ──
router.get('/cert-eligible', authRequired, trainerOnly, async (req, res) => {
  try {
    const rows = await query(`
      SELECT u.name, u.email, b.batch_code, be.assessment_score,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) att_pct,
        be.passed, be.status
      FROM batch_enrollments be
      JOIN users u ON u.id=be.candidate_id
      JOIN batches b ON b.id=be.batch_id
      LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
      WHERE b.trainer_id=$1
      GROUP BY be.id, u.name, u.email, b.batch_code, be.assessment_score, be.passed, be.status
      ORDER BY u.name
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Notifications (computed from real data) ──
router.get('/notifications', authRequired, trainerOnly, async (req, res) => {
  try {
    const tid = req.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const items = [];

    const todaySessions = await query(`
      SELECT s.topic, b.batch_code FROM trainer_sessions s
      JOIN batches b ON b.id=s.batch_id
      WHERE s.trainer_id=$1 AND s.session_date=$2 ORDER BY s.start_time
    `, [tid, today]);
    todaySessions.forEach(s => items.push({
      color: 'gold', icon: '📅',
      title: `Session today: ${s.topic} (${s.batch_code})`,
      meta: `Today`,
    }));

    const upcomingAssess = await query(`
      SELECT a.type, a.date, b.batch_code FROM trainer_assessments a
      JOIN batches b ON b.id=a.batch_id
      WHERE a.trainer_id=$1 AND a.date BETWEEN $2 AND $3 ORDER BY a.date
    `, [tid, today, in7]);
    upcomingAssess.forEach(a => items.push({
      color: 'blue', icon: '📝',
      title: `${a.type} assessment for ${a.batch_code} on ${a.date}`,
      meta: a.date,
    }));

    const atRisk = await query(`
      SELECT COUNT(DISTINCT be.candidate_id) cnt
      FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id
      LEFT JOIN attendance a ON a.batch_id=be.batch_id AND a.candidate_id=be.candidate_id
      WHERE b.trainer_id=$1 AND be.status='enrolled'
      GROUP BY be.candidate_id
      HAVING ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) < 70
    `, [tid]);
    if (atRisk.length > 0) items.push({
      color: 'red', icon: '⚠️',
      title: `${atRisk.length} learner${atRisk.length > 1 ? 's are' : ' is'} below 70% attendance and at risk`,
      meta: 'Action required',
    });

    const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const endingSoon = await query(`
      SELECT batch_code, end_date FROM batches WHERE trainer_id=$1 AND status='active' AND end_date BETWEEN $2 AND $3
    `, [tid, today, in14]);
    endingSoon.forEach(b => items.push({
      color: 'purple', icon: '🏁',
      title: `Batch ${b.batch_code} ends on ${b.end_date}`,
      meta: b.end_date,
    }));

    const since3 = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    const recentSessions = await query(`
      SELECT s.topic, s.session_date, b.batch_code FROM trainer_sessions s
      JOIN batches b ON b.id=s.batch_id
      WHERE s.trainer_id=$1 AND s.session_date BETWEEN $2 AND $3 AND s.session_date < $4
      ORDER BY s.session_date DESC LIMIT 3
    `, [tid, since3, today, today]);
    recentSessions.forEach(s => items.push({
      color: 'green', icon: '✅',
      title: `Session conducted: ${s.topic} (${s.batch_code})`,
      meta: s.session_date,
    }));

    const openTickets = await queryOne(`SELECT COUNT(*) cnt FROM trainer_support_tickets WHERE trainer_id=$1 AND status='Open'`, [tid]);
    if (parseInt(openTickets.cnt) > 0) items.push({
      color: 'teal', icon: '🎧',
      title: `${openTickets.cnt} open support ticket${openTickets.cnt > 1 ? 's' : ''} awaiting response`,
      meta: 'Help & Support',
    });

    const eligible = await queryOne(`
      SELECT COUNT(*) cnt FROM batch_enrollments be
      JOIN batches b ON b.id=be.batch_id
      WHERE b.trainer_id=$1 AND be.passed=1
    `, [tid]);
    if (parseInt(eligible.cnt) > 0) items.push({
      color: 'gold', icon: '🏆',
      title: `${eligible.cnt} learner${eligible.cnt > 1 ? 's are' : ' is'} eligible for certificate issuance`,
      meta: 'Certificates → Issue',
    });

    if (items.length === 0) items.push({ color: 'green', icon: '✅', title: 'All caught up! No pending actions.', meta: 'System' });

    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Certificate verification ──
router.get('/cert-verify', authRequired, trainerOnly, async (req, res) => {
  try {
    const { cert_no } = req.query;
    if (!cert_no) return res.status(400).json({ error: 'cert_no is required' });
    const cert = await queryOne(`
      SELECT cc.*, u.name as candidate_name, u.email
      FROM candidate_certificates cc
      JOIN users u ON u.id=cc.candidate_id
      WHERE cc.cert_no=$1
    `, [cert_no.trim()]);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json(cert);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Scheme-wise batch report ──
router.get('/reports/scheme', authRequired, trainerOnly, async (req, res) => {
  try {
    const rows = await query(`
      SELECT b.id, b.batch_code, b.name, b.scheme_type, b.status,
        COUNT(DISTINCT be.candidate_id) enrolled,
        COUNT(DISTINCT CASE WHEN be.passed=1 THEN be.candidate_id END) passed_count,
        COUNT(DISTINCT CASE WHEN be.status='completed' THEN be.candidate_id END) completed_count,
        ROUND(AVG(CASE WHEN a.present=1 THEN 100.0 ELSE 0 END),1) avg_att
      FROM batches b
      LEFT JOIN batch_enrollments be ON be.batch_id=b.id
      LEFT JOIN attendance a ON a.batch_id=b.id
      WHERE b.trainer_id=$1
      GROUP BY b.id, b.batch_code, b.name, b.scheme_type, b.status
      ORDER BY b.scheme_type, b.start_date DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
