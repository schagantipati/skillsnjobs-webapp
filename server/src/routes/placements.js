const express = require('express');
const { query, queryOne, execute } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Placement agency: my placements
router.get('/mine', authRequired, requireRole('placement_agency', 'admin'), async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let sql = `SELECT p.*, u.name as candidate_name, u.email as candidate_email,
      e.name as employer_name, e.org_name
      FROM placements p
      JOIN users u ON u.id=p.candidate_id
      LEFT JOIN users e ON e.id=p.employer_id`;
    const params = [];
    if (!isAdmin) { sql += ' WHERE p.agency_id=$1'; params.push(req.user.id); }
    sql += ' ORDER BY p.placement_date DESC';
    res.json(await query(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Summary stats
router.get('/summary', authRequired, requireRole('placement_agency', 'admin'), async (req, res) => {
  try {
    const agencyId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const where = isAdmin ? '' : 'WHERE agency_id=$1';
    const params = isAdmin ? [] : [agencyId];
    const yearWhere = isAdmin ? "WHERE EXTRACT(YEAR FROM placement_date)=EXTRACT(YEAR FROM CURRENT_DATE)" : "WHERE agency_id=$1 AND EXTRACT(YEAR FROM placement_date)=EXTRACT(YEAR FROM CURRENT_DATE)";
    const joinedWhere = isAdmin ? "WHERE status='joined'" : "WHERE agency_id=$1 AND status='joined'";

    const total    = await queryOne(`SELECT COUNT(*) c, AVG(ctc) avg_ctc FROM placements ${where}`, params);
    const thisYear = await queryOne(`SELECT COUNT(*) c FROM placements ${yearWhere}`, params);
    const joined   = await queryOne(`SELECT COUNT(*) c FROM placements ${joinedWhere}`, params);

    res.json({
      total: parseInt(total.c || 0),
      avg_ctc: total.avg_ctc ? Math.round(total.avg_ctc) : 0,
      this_year: parseInt(thisYear.c || 0),
      joined: parseInt(joined.c || 0)
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Create placement
router.post('/', authRequired, requireRole('placement_agency', 'admin'), async (req, res) => {
  try {
    const { candidate_id, employer_id, job_title, company, location, ctc, placement_date, status } = req.body;
    if (!candidate_id || !job_title) return res.status(400).json({ error: 'candidate_id and job_title are required' });
    const result = await execute(`
      INSERT INTO placements (agency_id, candidate_id, employer_id, job_title, company, location, ctc, placement_date, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [req.user.id, candidate_id, employer_id || null, job_title, company || '', location || '', ctc || null, placement_date || new Date().toISOString().slice(0,10), status || 'placed']);
    res.status(201).json(await queryOne('SELECT * FROM placements WHERE id=$1', [result.rows[0].id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Update placement status
router.put('/:id', authRequired, requireRole('placement_agency', 'admin'), async (req, res) => {
  try {
    const pl = await queryOne('SELECT * FROM placements WHERE id=$1', [req.params.id]);
    if (!pl) return res.status(404).json({ error: 'Placement not found' });
    if (req.user.role !== 'admin' && pl.agency_id !== req.user.id)
      return res.status(403).json({ error: 'Not your placement' });
    const { job_title, company, location, ctc, placement_date, status } = req.body;
    await execute(`UPDATE placements SET job_title=$1, company=$2, location=$3, ctc=$4, placement_date=$5, status=$6 WHERE id=$7`, [
      job_title ?? pl.job_title, company ?? pl.company, location ?? pl.location,
      ctc ?? pl.ctc, placement_date ?? pl.placement_date, status ?? pl.status, req.params.id
    ]);
    res.json(await queryOne('SELECT * FROM placements WHERE id=$1', [req.params.id]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// Delete placement
router.delete('/:id', authRequired, requireRole('placement_agency', 'admin'), async (req, res) => {
  try {
    const pl = await queryOne('SELECT * FROM placements WHERE id=$1', [req.params.id]);
    if (!pl) return res.status(404).json({ error: 'Placement not found' });
    if (req.user.role !== 'admin' && pl.agency_id !== req.user.id)
      return res.status(403).json({ error: 'Not your placement' });
    await execute('DELETE FROM placements WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
