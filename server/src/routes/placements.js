const express = require('express');
const { db } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Placement agency: my placements
router.get('/mine', authRequired, requireRole('placement_agency', 'admin'), (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const rows = db.prepare(`
    SELECT p.*, u.name as candidate_name, u.email as candidate_email,
      e.name as employer_name, e.org_name
    FROM placements p
    JOIN users u ON u.id=p.candidate_id
    LEFT JOIN users e ON e.id=p.employer_id
    WHERE ${isAdmin ? '1=1' : 'p.agency_id=?'}
    ORDER BY p.placement_date DESC
  `).all(...(isAdmin ? [] : [req.user.id]));
  res.json(rows);
});

// Summary stats
router.get('/summary', authRequired, requireRole('placement_agency', 'admin'), (req, res) => {
  const agencyId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const where = isAdmin ? '' : 'WHERE agency_id=?';
  const params = isAdmin ? [] : [agencyId];

  const total = db.prepare(`SELECT COUNT(*) c, AVG(ctc) avg_ctc FROM placements ${where}`).get(...params);
  const thisYear = db.prepare(`SELECT COUNT(*) c FROM placements ${where ? where + ' AND' : 'WHERE'} strftime('%Y',placement_date)=strftime('%Y','now')`).get(...params);
  const joined = db.prepare(`SELECT COUNT(*) c FROM placements ${where ? where + ' AND' : 'WHERE'} status='joined'`).get(...params);

  res.json({
    total: total.c || 0,
    avg_ctc: total.avg_ctc ? Math.round(total.avg_ctc) : 0,
    this_year: thisYear.c || 0,
    joined: joined.c || 0
  });
});

// Create placement
router.post('/', authRequired, requireRole('placement_agency', 'admin'), (req, res) => {
  const { candidate_id, employer_id, job_title, company, location, ctc, placement_date, status } = req.body;
  if (!candidate_id || !job_title) return res.status(400).json({ error: 'candidate_id and job_title are required' });
  const info = db.prepare(`
    INSERT INTO placements (agency_id, candidate_id, employer_id, job_title, company, location, ctc, placement_date, status)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(req.user.id, candidate_id, employer_id || null, job_title, company || '', location || '', ctc || null, placement_date || new Date().toISOString().slice(0,10), status || 'placed');
  res.status(201).json(db.prepare('SELECT * FROM placements WHERE id=?').get(info.lastInsertRowid));
});

// Update placement status
router.put('/:id', authRequired, requireRole('placement_agency', 'admin'), (req, res) => {
  const pl = db.prepare('SELECT * FROM placements WHERE id=?').get(req.params.id);
  if (!pl) return res.status(404).json({ error: 'Placement not found' });
  if (req.user.role !== 'admin' && pl.agency_id !== req.user.id)
    return res.status(403).json({ error: 'Not your placement' });
  const { job_title, company, location, ctc, placement_date, status } = req.body;
  db.prepare(`UPDATE placements SET job_title=?, company=?, location=?, ctc=?, placement_date=?, status=? WHERE id=?`).run(
    job_title ?? pl.job_title, company ?? pl.company, location ?? pl.location,
    ctc ?? pl.ctc, placement_date ?? pl.placement_date, status ?? pl.status, req.params.id
  );
  res.json(db.prepare('SELECT * FROM placements WHERE id=?').get(req.params.id));
});

// Delete placement
router.delete('/:id', authRequired, requireRole('placement_agency', 'admin'), (req, res) => {
  const pl = db.prepare('SELECT * FROM placements WHERE id=?').get(req.params.id);
  if (!pl) return res.status(404).json({ error: 'Placement not found' });
  if (req.user.role !== 'admin' && pl.agency_id !== req.user.id)
    return res.status(403).json({ error: 'Not your placement' });
  db.prepare('DELETE FROM placements WHERE id=?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
