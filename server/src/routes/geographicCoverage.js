const express = require('express');
const { db, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  res.json(db.prepare('SELECT * FROM geographic_coverage ORDER BY sort_order, id').all());
});

router.post('/', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  if (db.prepare('SELECT id FROM geographic_coverage WHERE name = ?').get(name.trim()))
    return res.status(409).json({ error: 'Value already exists' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) m FROM geographic_coverage').get().m || 0;
  const info = db.prepare('INSERT INTO geographic_coverage (name, is_enabled, is_system, sort_order) VALUES (?, 1, 0, ?)').run(name.trim(), maxOrder + 1);
  const row = db.prepare('SELECT * FROM geographic_coverage WHERE id = ?').get(info.lastInsertRowid);
  logAudit({ user: req.user, action: 'Geographic coverage added', entity: 'geographic_coverage', entityId: row.id, detail: name.trim(), ip: req.ip });
  res.status(201).json(row);
});

router.patch('/:id/status', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { is_enabled } = req.body;
  const row = db.prepare('SELECT * FROM geographic_coverage WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE geographic_coverage SET is_enabled = ? WHERE id = ?').run(is_enabled ? 1 : 0, row.id);
  logAudit({ user: req.user, action: is_enabled ? 'Geographic coverage enabled' : 'Geographic coverage disabled', entity: 'geographic_coverage', entityId: row.id, detail: row.name, ip: req.ip });
  res.json({ ...row, is_enabled: is_enabled ? 1 : 0 });
});

router.patch('/:id', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  const row = db.prepare('SELECT * FROM geographic_coverage WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.is_system) return res.status(400).json({ error: 'System values cannot be renamed' });
  if (db.prepare('SELECT id FROM geographic_coverage WHERE name = ? AND id != ?').get(name.trim(), row.id))
    return res.status(409).json({ error: 'Name already exists' });
  db.prepare('UPDATE geographic_coverage SET name = ? WHERE id = ?').run(name.trim(), row.id);
  res.json({ ...row, name: name.trim() });
});

router.delete('/:id', authRequired, (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const row = db.prepare('SELECT * FROM geographic_coverage WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.is_system) return res.status(400).json({ error: 'System values cannot be deleted' });
  db.prepare('DELETE FROM geographic_coverage WHERE id = ?').run(row.id);
  logAudit({ user: req.user, action: 'Geographic coverage deleted', entity: 'geographic_coverage', entityId: row.id, detail: row.name, ip: req.ip });
  res.json({ success: true });
});

module.exports = router;
