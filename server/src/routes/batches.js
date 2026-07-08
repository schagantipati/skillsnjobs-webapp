const express = require('express');
const { db } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Trainer: list my batches
router.get('/mine', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, c.title as course_title,
      (SELECT COUNT(*) FROM batch_enrollments WHERE batch_id=b.id) as learner_count,
      (SELECT AVG(CASE WHEN present=1 THEN 100.0 ELSE 0 END) FROM attendance WHERE batch_id=b.id) as avg_attendance
    FROM batches b
    LEFT JOIN courses c ON c.id=b.course_id
    WHERE b.trainer_id=?
    ORDER BY b.start_date DESC
  `).all(req.user.id);
  res.json(rows);
});

// Admin: list all batches
router.get('/', authRequired, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, c.title as course_title, u.name as trainer_name,
      (SELECT COUNT(*) FROM batch_enrollments WHERE batch_id=b.id) as learner_count
    FROM batches b
    LEFT JOIN courses c ON c.id=b.course_id
    LEFT JOIN users u ON u.id=b.trainer_id
    ORDER BY b.start_date DESC
  `).all();
  res.json(rows);
});

// Create batch
router.post('/', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const { batch_code, name, course_id, start_date, end_date, capacity, status, scheme_type } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const code = batch_code || `BATCH-${Date.now()}`;
  try {
    const info = db.prepare(`
      INSERT INTO batches (trainer_id, course_id, batch_code, name, start_date, end_date, capacity, status, scheme_type)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(req.user.id, course_id || null, code, name, start_date || null, end_date || null, capacity || 30, status || 'upcoming', scheme_type || 'None');
    const batch = db.prepare('SELECT * FROM batches WHERE id=?').get(info.lastInsertRowid);
    res.status(201).json(batch);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Batch code already exists' });
    throw e;
  }
});

// Update batch
router.put('/:id', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const batch = db.prepare('SELECT * FROM batches WHERE id=?').get(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  if (req.user.role !== 'admin' && batch.trainer_id !== req.user.id)
    return res.status(403).json({ error: 'Not your batch' });
  const { name, course_id, start_date, end_date, capacity, status, scheme_type } = req.body;
  db.prepare(`UPDATE batches SET name=?, course_id=?, start_date=?, end_date=?, capacity=?, status=?, scheme_type=? WHERE id=?`).run(
    name ?? batch.name, course_id ?? batch.course_id,
    start_date ?? batch.start_date, end_date ?? batch.end_date,
    capacity ?? batch.capacity, status ?? batch.status,
    scheme_type ?? batch.scheme_type ?? 'None', req.params.id
  );
  res.json(db.prepare('SELECT * FROM batches WHERE id=?').get(req.params.id));
});

// Delete batch
router.delete('/:id', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const batch = db.prepare('SELECT * FROM batches WHERE id=?').get(req.params.id);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  if (req.user.role !== 'admin' && batch.trainer_id !== req.user.id)
    return res.status(403).json({ error: 'Not your batch' });
  db.prepare('DELETE FROM batches WHERE id=?').run(req.params.id);
  res.status(204).end();
});

// Learners in a batch
router.get('/:id/learners', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT be.*, u.name, u.email, u.phone,
      (SELECT ROUND(AVG(CASE WHEN present=1 THEN 100.0 ELSE 0 END),1) FROM attendance WHERE batch_id=be.batch_id AND candidate_id=be.candidate_id) as attendance_pct
    FROM batch_enrollments be
    JOIN users u ON u.id=be.candidate_id
    WHERE be.batch_id=?
    ORDER BY u.name
  `).all(req.params.id);
  res.json(rows);
});

// Attendance for a batch on a date
router.get('/:id/attendance', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const { date } = req.query;
  let rows;
  if (date) {
    rows = db.prepare(`
      SELECT a.*, u.name FROM attendance a JOIN users u ON u.id=a.candidate_id
      WHERE a.batch_id=? AND a.date=?
    `).all(req.params.id, date);
  } else {
    rows = db.prepare(`
      SELECT date, COUNT(*) total, SUM(present) present_count
      FROM attendance WHERE batch_id=? GROUP BY date ORDER BY date DESC
    `).all(req.params.id);
  }
  res.json(rows);
});

// Mark attendance (bulk upsert for a date)
router.post('/:id/attendance', authRequired, requireRole('trainer', 'admin'), (req, res) => {
  const { date, records } = req.body; // records: [{candidate_id, present}]
  if (!date || !Array.isArray(records)) return res.status(400).json({ error: 'date and records[] required' });
  const upsert = db.prepare(`
    INSERT INTO attendance (batch_id, candidate_id, date, present)
    VALUES (?,?,?,?)
    ON CONFLICT(batch_id, candidate_id, date) DO UPDATE SET present=excluded.present
  `);
  const txn = db.transaction(() => records.forEach(r => upsert.run(req.params.id, r.candidate_id, date, r.present ? 1 : 0)));
  txn();
  res.json({ saved: records.length });
});

module.exports = router;
