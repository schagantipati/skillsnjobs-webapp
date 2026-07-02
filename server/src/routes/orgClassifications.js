const express = require('express');
const { db, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET all — public (used in registration dropdown)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM org_classifications ORDER BY sort_order, id').all();
  res.json(rows);
});

// POST create
router.post('/', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const exists = db.prepare('SELECT id FROM org_classifications WHERE name = ?').get(name.trim());
  if (exists) return res.status(409).json({ error: 'Classification already exists' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) m FROM org_classifications').get().m || 0;
  const info = db.prepare('INSERT INTO org_classifications (name, is_enabled, is_system, sort_order) VALUES (?, 1, 0, ?)').run(name.trim(), maxOrder + 1);
  const row = db.prepare('SELECT * FROM org_classifications WHERE id = ?').get(info.lastInsertRowid);
  logAudit({ user: req.user, action: 'Org classification added', entity: 'org_classification', entityId: row.id, detail: name.trim(), ip: req.ip });
  res.status(201).json(row);
});

// PATCH enable/disable
router.patch('/:id/status', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { is_enabled } = req.body;
  const row = db.prepare('SELECT * FROM org_classifications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE org_classifications SET is_enabled = ? WHERE id = ?').run(is_enabled ? 1 : 0, row.id);
  logAudit({ user: req.user, action: is_enabled ? 'Org classification enabled' : 'Org classification disabled', entity: 'org_classification', entityId: row.id, detail: row.name, ip: req.ip });
  res.json({ ...row, is_enabled: is_enabled ? 1 : 0 });
});

// PATCH rename
router.patch('/:id', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const row = db.prepare('SELECT * FROM org_classifications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.is_system) return res.status(400).json({ error: 'System classifications cannot be renamed' });
  const dup = db.prepare('SELECT id FROM org_classifications WHERE name = ? AND id != ?').get(name.trim(), row.id);
  if (dup) return res.status(409).json({ error: 'Name already exists' });
  db.prepare('UPDATE org_classifications SET name = ? WHERE id = ?').run(name.trim(), row.id);
  res.json({ ...row, name: name.trim() });
});

// DELETE
router.delete('/:id', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const row = db.prepare('SELECT * FROM org_classifications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.is_system) return res.status(400).json({ error: 'System classifications cannot be deleted' });
  db.prepare('DELETE FROM org_classifications WHERE id = ?').run(row.id);
  logAudit({ user: req.user, action: 'Org classification deleted', entity: 'org_classification', entityId: row.id, detail: row.name, ip: req.ip });
  res.json({ success: true });
});

module.exports = router;
