const express = require('express');
const { query, queryOne, execute, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET all — public (used in registration dropdown)
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM org_classifications ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// POST create
router.post('/', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const exists = await queryOne('SELECT id FROM org_classifications WHERE name = $1', [name.trim()]);
    if (exists) return res.status(409).json({ error: 'Classification already exists' });
    const maxRow = await queryOne('SELECT MAX(sort_order) m FROM org_classifications');
    const maxOrder = maxRow?.m || 0;
    const result = await execute('INSERT INTO org_classifications (name, is_enabled, is_system, sort_order) VALUES ($1, 1, 0, $2) RETURNING id', [name.trim(), maxOrder + 1]);
    const row = await queryOne('SELECT * FROM org_classifications WHERE id = $1', [result.rows[0].id]);
    await logAudit({ user: req.user, action: 'Org classification added', entity: 'org_classification', entityId: row.id, detail: name.trim(), ip: req.ip });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// PATCH enable/disable
router.patch('/:id/status', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const { is_enabled } = req.body;
    const row = await queryOne('SELECT * FROM org_classifications WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await execute('UPDATE org_classifications SET is_enabled = $1 WHERE id = $2', [is_enabled ? 1 : 0, row.id]);
    await logAudit({ user: req.user, action: is_enabled ? 'Org classification enabled' : 'Org classification disabled', entity: 'org_classification', entityId: row.id, detail: row.name, ip: req.ip });
    res.json({ ...row, is_enabled: is_enabled ? 1 : 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// PATCH rename
router.patch('/:id', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const row = await queryOne('SELECT * FROM org_classifications WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (row.is_system) return res.status(400).json({ error: 'System classifications cannot be renamed' });
    const dup = await queryOne('SELECT id FROM org_classifications WHERE name = $1 AND id != $2', [name.trim(), row.id]);
    if (dup) return res.status(409).json({ error: 'Name already exists' });
    await execute('UPDATE org_classifications SET name = $1 WHERE id = $2', [name.trim(), row.id]);
    res.json({ ...row, name: name.trim() });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// DELETE
router.delete('/:id', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    const row = await queryOne('SELECT * FROM org_classifications WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (row.is_system) return res.status(400).json({ error: 'System classifications cannot be deleted' });
    await execute('DELETE FROM org_classifications WHERE id = $1', [row.id]);
    await logAudit({ user: req.user, action: 'Org classification deleted', entity: 'org_classification', entityId: row.id, detail: row.name, ip: req.ip });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
