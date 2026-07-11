const express = require('express');
const { query, queryOne, execute, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function vendorOnly(req, res, next) {
  if (req.user.role !== 'training_vendor') return res.status(403).json({ error: 'Training vendor only' });
  next();
}

const auth = [authRequired, vendorOnly];

// ── Consortium Builder — partner directory ────────────────────────────────────
router.get('/consortium', authRequired, async (req, res) => {
  try {
    const vid = req.user.id;
    // query() returns rows array directly
    const rows = await query(`
      SELECT u.id, u.name AS org_name, u.city, u.state_name,
             u.role, u.created_at, u.vendor_profile
      FROM users u
      WHERE u.role = 'training_vendor' AND u.id != $1
    `, [vid]);
    const partners = rows.map(r => {
      let vp = {};
      try { vp = typeof r.vendor_profile === 'string' ? JSON.parse(r.vendor_profile) : (r.vendor_profile || {}); } catch (_) {}
      const s1 = vp.step1 || {};
      const s4 = vp.step4 || {};
      return {
        id: r.id,
        org_name: r.org_name,
        type: 'Training Partner',
        sector: s1.sector || 'Multiple',
        state: s1.headState || r.state_name || '—',
        city: s1.headCity || r.city || '—',
        accreditation: s4.nsdc || s4.ssc || null,
        member_since: r.created_at,
      };
    });
    res.json(partners);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Invitations ───────────────────────────────────────────────────────────────
router.get('/invitations', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const received = await query(`
      SELECT i.*, u.name AS from_org_name
      FROM collab_invitations i
      JOIN users u ON u.id = i.from_vendor_id
      WHERE i.to_vendor_id = $1
      ORDER BY i.created_at DESC
    `, [vid]);
    const sent = await query(`
      SELECT i.*, COALESCE(u.name, i.to_org_name) AS to_org_name_resolved
      FROM collab_invitations i
      LEFT JOIN users u ON u.id = i.to_vendor_id
      WHERE i.from_vendor_id = $1
      ORDER BY i.created_at DESC
    `, [vid]);
    res.json({ received, sent });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/invitations', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const { to_vendor_id, to_org_name, invitation_type, project_name, sector, state, message } = req.body;
    if (!invitation_type || !project_name) return res.status(400).json({ error: 'invitation_type and project_name are required' });
    const result = await execute(`
      INSERT INTO collab_invitations (from_vendor_id, to_vendor_id, to_org_name, invitation_type, project_name, sector, state, message)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [vid, to_vendor_id || null, to_org_name || null, invitation_type, project_name, sector || null, state || null, message || null]);
    await logAudit({ user: req.user, action: 'collab_invitation_sent', entity: 'collab_invitations', entityId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.patch('/invitations/:id', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const { status } = req.body;
    if (!['accepted','rejected','withdrawn'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    let row;
    if (status === 'withdrawn') {
      row = await queryOne('UPDATE collab_invitations SET status=$1 WHERE id=$2 AND from_vendor_id=$3 RETURNING *', [status, req.params.id, vid]);
    } else {
      row = await queryOne('UPDATE collab_invitations SET status=$1 WHERE id=$2 AND to_vendor_id=$3 RETURNING *', [status, req.params.id, vid]);
    }
    if (!row) return res.status(404).json({ error: 'Invitation not found or not authorised' });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Partnership Requests ──────────────────────────────────────────────────────
router.get('/partnership-requests', authRequired, async (req, res) => {
  try {
    const vid = req.user.id;
    const all = await query(`
      SELECT r.*, u.name AS org_name, u.city, u.state_name,
             COUNT(rp.id) AS response_count
      FROM collab_partnership_requests r
      JOIN users u ON u.id = r.vendor_id
      LEFT JOIN collab_partnership_responses rp ON rp.request_id = r.id
      WHERE r.status = 'open'
      GROUP BY r.id, u.name, u.city, u.state_name
      ORDER BY r.created_at DESC
    `);
    const mine = await query(`
      SELECT r.*, u.name AS org_name,
             COUNT(rp.id) AS response_count
      FROM collab_partnership_requests r
      JOIN users u ON u.id = r.vendor_id
      LEFT JOIN collab_partnership_responses rp ON rp.request_id = r.id
      WHERE r.vendor_id = $1
      GROUP BY r.id, u.name
      ORDER BY r.created_at DESC
    `, [vid]);
    res.json({ all, mine });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/partnership-requests', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const { looking_for, sector, state, project_type, description } = req.body;
    if (!looking_for) return res.status(400).json({ error: 'looking_for is required' });
    const result = await execute(`
      INSERT INTO collab_partnership_requests (vendor_id, looking_for, sector, state, project_type, description)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [vid, looking_for, sector || null, state || null, project_type || null, description || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.patch('/partnership-requests/:id/close', auth, async (req, res) => {
  try {
    const row = await queryOne('UPDATE collab_partnership_requests SET status=$1 WHERE id=$2 AND vendor_id=$3 RETURNING *', ['closed', req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ error: 'Request not found' });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/partnership-requests/:id/respond', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const { message } = req.body;
    const result = await execute(`
      INSERT INTO collab_partnership_responses (request_id, vendor_id, message)
      VALUES ($1,$2,$3)
      ON CONFLICT (request_id, vendor_id) DO UPDATE SET message = EXCLUDED.message
      RETURNING *
    `, [req.params.id, vid, message || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/partnership-requests/:id/responses', auth, async (req, res) => {
  try {
    const req_row = await queryOne('SELECT * FROM collab_partnership_requests WHERE id=$1 AND vendor_id=$2', [req.params.id, req.user.id]);
    if (!req_row) return res.status(403).json({ error: 'Not authorised' });
    const rows = await query(`
      SELECT rp.*, u.name AS org_name, u.city, u.state_name
      FROM collab_partnership_responses rp
      JOIN users u ON u.id = rp.vendor_id
      WHERE rp.request_id = $1
      ORDER BY rp.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Resource Sharing ──────────────────────────────────────────────────────────
router.get('/resources', authRequired, async (req, res) => {
  try {
    const vid = req.user.id;
    const { listing_type } = req.query;
    let whereParts = ["r.status != 'deleted'"];
    const params = [];
    if (listing_type) { params.push(listing_type); whereParts.push(`r.listing_type = $${params.length}`); }
    const where = 'WHERE ' + whereParts.join(' AND ');
    const all = await query(`
      SELECT r.*, u.name AS org_name, u.city, u.state_name
      FROM collab_resources r
      JOIN users u ON u.id = r.vendor_id
      ${where}
      ORDER BY r.created_at DESC
    `, params);
    const mine = await query(`
      SELECT r.*, u.name AS org_name
      FROM collab_resources r
      JOIN users u ON u.id = r.vendor_id
      WHERE r.vendor_id = $1 AND r.status != 'deleted'
      ORDER BY r.created_at DESC
    `, [vid]);
    res.json({ all, mine });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/resources', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const { resource_type, qty, location, availability, sector, listing_type, details } = req.body;
    if (!resource_type || !listing_type) return res.status(400).json({ error: 'resource_type and listing_type are required' });
    const result = await execute(`
      INSERT INTO collab_resources (vendor_id, resource_type, qty, location, availability, sector, listing_type, details)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [vid, resource_type, qty || 1, location || null, availability || null, sector || null, listing_type, details || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/resources/:id', auth, async (req, res) => {
  try {
    const row = await queryOne("UPDATE collab_resources SET status='deleted' WHERE id=$1 AND vendor_id=$2 RETURNING id", [req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ error: 'Resource not found' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/resources/:id/request', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const { qty_needed, required_dates, message } = req.body;
    const result = await execute(`
      INSERT INTO collab_resource_requests (resource_id, vendor_id, qty_needed, required_dates, message)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.params.id, vid, qty_needed || 1, required_dates || null, message || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
