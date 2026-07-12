const express = require('express');
const { query, queryOne, execute } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Trainer: list my batches
router.get('/mine', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const rows = await query(`
      SELECT b.*, c.title as course_title,
        (SELECT COUNT(*) FROM batch_enrollments WHERE batch_id=b.id) as learner_count,
        (SELECT AVG(CASE WHEN present=1 THEN 100.0 ELSE 0 END) FROM attendance WHERE batch_id=b.id) as avg_attendance
      FROM batches b
      LEFT JOIN courses c ON c.id=b.course_id
      WHERE b.trainer_id=$1
      ORDER BY b.start_date DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Admin: list all batches (trainer-owned + vendor-owned unified)
router.get('/', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const rows = await query(`
      SELECT b.*,
        COALESCE(c.title, vco.title) AS course_title,
        u.name AS trainer_name,
        vu.name AS vendor_name,
        vc_centre.name AS centre_name,
        vt.name AS vendor_trainer_name,
        (SELECT COUNT(*) FROM batch_enrollments WHERE batch_id=b.id) AS learner_count,
        CASE WHEN b.vendor_id IS NOT NULL THEN 'vendor' ELSE 'trainer' END AS source
      FROM batches b
      LEFT JOIN courses c ON c.id=b.course_id AND b.vendor_id IS NULL
      LEFT JOIN vendor_courses vco ON vco.id=b.vendor_course_id
      LEFT JOIN users u ON u.id=b.trainer_id
      LEFT JOIN users vu ON vu.id=b.vendor_id
      LEFT JOIN vendor_centres vc_centre ON vc_centre.id=b.centre_id
      LEFT JOIN vendor_trainers vt ON vt.id=b.vendor_trainer_id
      WHERE COALESCE(b.status,'upcoming') != 'cancelled'
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Create batch
router.post('/', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const { batch_code, name, course_id, start_date, end_date, capacity, status, scheme_type } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const code = batch_code || `BATCH-${Date.now()}`;
    const result = await execute(`
      INSERT INTO batches (trainer_id, course_id, batch_code, name, start_date, end_date, capacity, status, scheme_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [req.user.id, course_id || null, code, name, start_date || null, end_date || null, capacity || 30, status || 'upcoming', scheme_type || 'None']);
    const batch = await queryOne('SELECT * FROM batches WHERE id=$1', [result.rows[0].id]);
    res.status(201).json(batch);
  } catch (err) {
    if (err.message && err.message.includes('unique')) return res.status(409).json({ error: 'Batch code already exists' });
    console.error(err); res.status(500).json({ error: 'Internal server error' });
  }
});

// Update batch
router.put('/:id', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const batch = await queryOne('SELECT * FROM batches WHERE id=$1', [req.params.id]);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    if (req.user.role !== 'admin' && batch.trainer_id !== req.user.id)
      return res.status(403).json({ error: 'Not your batch' });
    const { name, course_id, start_date, end_date, capacity, status, scheme_type } = req.body;
    await execute(`UPDATE batches SET name=$1, course_id=$2, start_date=$3, end_date=$4, capacity=$5, status=$6, scheme_type=$7 WHERE id=$8`, [
      name ?? batch.name, course_id ?? batch.course_id,
      start_date ?? batch.start_date, end_date ?? batch.end_date,
      capacity ?? batch.capacity, status ?? batch.status,
      scheme_type ?? batch.scheme_type ?? 'None', req.params.id
    ]);
    res.json(await queryOne('SELECT * FROM batches WHERE id=$1', [req.params.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Delete batch
router.delete('/:id', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const batch = await queryOne('SELECT * FROM batches WHERE id=$1', [req.params.id]);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    if (req.user.role !== 'admin' && batch.trainer_id !== req.user.id)
      return res.status(403).json({ error: 'Not your batch' });
    await execute('DELETE FROM batches WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Learners in a batch
router.get('/:id/learners', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const rows = await query(`
      SELECT be.*, u.name, u.email, u.phone,
        (SELECT ROUND(AVG(CASE WHEN present=1 THEN 100.0 ELSE 0 END),1) FROM attendance WHERE batch_id=be.batch_id AND candidate_id=be.candidate_id) as attendance_pct
      FROM batch_enrollments be
      JOIN users u ON u.id=be.candidate_id
      WHERE be.batch_id=$1
      ORDER BY u.name
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Attendance for a batch on a date
router.get('/:id/attendance', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const { date } = req.query;
    let rows;
    if (date) {
      rows = await query(`
        SELECT a.*, u.name FROM attendance a JOIN users u ON u.id=a.candidate_id
        WHERE a.batch_id=$1 AND a.date=$2
      `, [req.params.id, date]);
    } else {
      rows = await query(`
        SELECT date, COUNT(*) total, SUM(present) present_count
        FROM attendance WHERE batch_id=$1 GROUP BY date ORDER BY date DESC
      `, [req.params.id]);
    }
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Mark attendance (bulk upsert for a date)
router.post('/:id/attendance', authRequired, requireRole('trainer', 'admin'), async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{candidate_id, present}]
    if (!date || !Array.isArray(records)) return res.status(400).json({ error: 'date and records[] required' });
    for (const r of records) {
      await execute(`
        INSERT INTO attendance (batch_id, candidate_id, date, present)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT(batch_id, candidate_id, date) DO UPDATE SET present=EXCLUDED.present
      `, [req.params.id, r.candidate_id, date, r.present ? 1 : 0]);
    }
    res.json({ saved: records.length });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
