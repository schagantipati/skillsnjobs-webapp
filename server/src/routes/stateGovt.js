const express = require('express');
const { query, queryOne, execute, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Only state_government role can access these endpoints
function stateOnly(req, res, next) {
  if (!['state_government', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'State government access required' });
  }
  next();
}

// ── DASHBOARD STATS ──
router.get('/stats', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const n = async (sql, p) => parseInt((await queryOne(sql, p)).c || 0);
    const s = async (sql, p) => parseFloat((await queryOne(sql, p)).s || 0);
    const tpCount   = await n('SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=$1', [uid]);
    const tpActive  = await n("SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=$1 AND status='verified'", [uid]);
    const tpPending = await n("SELECT COUNT(*) c FROM sg_training_partners WHERE state_user_id=$1 AND status='pending'", [uid]);
    const candTotal    = await n('SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1', [uid]);
    const candCertified= await n("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND certification_status='certified'", [uid]);
    const candPlaced   = await n("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND placement_status='placed'", [uid]);
    const candDropped  = await n("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND status='dropped'", [uid]);
    const disbTotal  = await s("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=$1 AND status='disbursed'", [uid]);
    const disbPending= await s("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=$1 AND status='pending'", [uid]);
    const grievOpen  = await n("SELECT COUNT(*) c FROM sg_grievances WHERE state_user_id=$1 AND status='open'", [uid]);
    const notifUnread= await n('SELECT COUNT(*) c FROM sg_notifications WHERE state_user_id=$1 AND is_read=0', [uid]);
    const schemes    = await query('SELECT * FROM sg_schemes WHERE is_active=1');
    res.json({
      tpCount, tpActive, tpPending,
      candTotal, candCertified, candPlaced, candDropped,
      disbTotal, disbPending,
      grievOpen, notifUnread,
      schemes,
      certRate: candTotal ? Math.round((candCertified / candTotal) * 100) : 0,
      placementRate: candCertified ? Math.round((candPlaced / candCertified) * 100) : 0,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── TRAINING PARTNERS ──
router.get('/training-partners', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { status, scheme, q } = req.query;
    let sql = 'SELECT * FROM sg_training_partners WHERE state_user_id=$1';
    const params = [uid];
    let idx = 2;
    if (status) { sql += ` AND status=$${idx++}`; params.push(status); }
    if (scheme) { sql += ` AND scheme=$${idx++}`; params.push(scheme); }
    if (q) { sql += ` AND name ILIKE $${idx++}`; params.push(`%${q}%`); }
    sql += ' ORDER BY created_at DESC';
    res.json(await query(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/training-partners', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { name, type, district, state_name, nsdc_code, email, mobile, scheme, accreditation, accreditation_expiry } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await execute(
      `INSERT INTO sg_training_partners (state_user_id,name,type,district,state_name,nsdc_code,email,mobile,scheme,accreditation,accreditation_expiry,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending') RETURNING id`,
      [uid, name, type, district, state_name, nsdc_code, email, mobile, scheme, accreditation, accreditation_expiry]
    );
    await logAudit({ user: req.user, action: 'TP Created', entity: 'sg_training_partners', entityId: result.rows[0].id, detail: name });
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/training-partners/:id', authRequired, stateOnly, async (req, res) => {
  try {
    const { status, name, type, district, scheme, accreditation, accreditation_expiry, centre_count, trainee_count } = req.body;
    await execute(
      `UPDATE sg_training_partners SET status=COALESCE($1,status), name=COALESCE($2,name), type=COALESCE($3,type),
       district=COALESCE($4,district), scheme=COALESCE($5,scheme), accreditation=COALESCE($6,accreditation),
       accreditation_expiry=COALESCE($7,accreditation_expiry), centre_count=COALESCE($8,centre_count), trainee_count=COALESCE($9,trainee_count)
       WHERE id=$10 AND state_user_id=$11`,
      [status, name, type, district, scheme, accreditation, accreditation_expiry, centre_count, trainee_count, req.params.id, req.user.id]
    );
    await logAudit({ user: req.user, action: 'TP Updated', entity: 'sg_training_partners', entityId: req.params.id });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── CANDIDATES / BENEFICIARIES ──
router.get('/candidates', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { scheme, district, status, q } = req.query;
    let sql = 'SELECT c.*, t.name as tp_name FROM sg_candidates c LEFT JOIN sg_training_partners t ON t.id=c.tp_id WHERE c.state_user_id=$1';
    const params = [uid];
    let idx = 2;
    if (scheme)   { sql += ` AND c.scheme=$${idx++}`; params.push(scheme); }
    if (district) { sql += ` AND c.district=$${idx++}`; params.push(district); }
    if (status)   { sql += ` AND c.status=$${idx++}`; params.push(status); }
    if (q) { sql += ` AND (c.name ILIKE $${idx} OR c.candidate_ref ILIKE $${idx+1})`; params.push(`%${q}%`, `%${q}%`); idx += 2; }
    sql += ' ORDER BY c.created_at DESC LIMIT 200';
    res.json(await query(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/candidates', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { name, gender, dob, district, state_name, mobile, aadhaar_masked, scheme, course, tp_id, batch_code, enroll_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const ref = `SKL-${(req.user.state_name || 'ST').substring(0,2).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const result = await execute(
      `INSERT INTO sg_candidates (state_user_id,candidate_ref,name,gender,dob,district,state_name,mobile,aadhaar_masked,scheme,course,tp_id,batch_code,enroll_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [uid, ref, name, gender, dob, district, state_name, mobile, aadhaar_masked, scheme, course, tp_id || null, batch_code, enroll_date || new Date().toISOString().split('T')[0]]
    );
    await logAudit({ user: req.user, action: 'Candidate Enrolled', entity: 'sg_candidates', entityId: result.rows[0].id, detail: name });
    res.json({ id: result.rows[0].id, candidate_ref: ref });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/candidates/:id', authRequired, stateOnly, async (req, res) => {
  try {
    const { status, assessment_status, certification_status, placement_status, employer_name, salary, dropout_reason } = req.body;
    await execute(
      `UPDATE sg_candidates SET status=COALESCE($1,status), assessment_status=COALESCE($2,assessment_status),
       certification_status=COALESCE($3,certification_status), placement_status=COALESCE($4,placement_status),
       employer_name=COALESCE($5,employer_name), salary=COALESCE($6,salary), dropout_reason=COALESCE($7,dropout_reason)
       WHERE id=$8 AND state_user_id=$9`,
      [status, assessment_status, certification_status, placement_status, employer_name, salary, dropout_reason, req.params.id, req.user.id]
    );
    await logAudit({ user: req.user, action: 'Candidate Updated', entity: 'sg_candidates', entityId: req.params.id });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── TARGETS ──
router.get('/targets', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { fy } = req.query;
    let sql = `SELECT t.*, s.code, s.name as scheme_name FROM sg_targets t JOIN sg_schemes s ON s.id=t.scheme_id WHERE t.state_user_id=$1`;
    const params = [uid];
    if (fy) { sql += ' AND t.fy=$2'; params.push(fy); }
    res.json(await query(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/targets', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { scheme_id, fy, annual_target, q1_target, q2_target, q3_target, q4_target } = req.body;
    const result = await execute(
      `INSERT INTO sg_targets (state_user_id,scheme_id,fy,annual_target,q1_target,q2_target,q3_target,q4_target)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(state_user_id,scheme_id,fy) DO UPDATE SET
         annual_target=EXCLUDED.annual_target, q1_target=EXCLUDED.q1_target,
         q2_target=EXCLUDED.q2_target, q3_target=EXCLUDED.q3_target, q4_target=EXCLUDED.q4_target
       RETURNING id`,
      [uid, scheme_id, fy, annual_target, q1_target || 0, q2_target || 0, q3_target || 0, q4_target || 0]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/targets/:id/achievement', authRequired, stateOnly, async (req, res) => {
  try {
    const { q1_achieved, q2_achieved, q3_achieved, q4_achieved } = req.body;
    await execute(
      `UPDATE sg_targets SET q1_achieved=COALESCE($1,q1_achieved), q2_achieved=COALESCE($2,q2_achieved),
       q3_achieved=COALESCE($3,q3_achieved), q4_achieved=COALESCE($4,q4_achieved)
       WHERE id=$5 AND state_user_id=$6`,
      [q1_achieved, q2_achieved, q3_achieved, q4_achieved, req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── DISBURSEMENTS ──
router.get('/disbursements', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const rows = await query(
      `SELECT d.*, t.name as tp_name FROM sg_disbursements d LEFT JOIN sg_training_partners t ON t.id=d.tp_id
       WHERE d.state_user_id=$1 ORDER BY d.created_at DESC LIMIT 100`, [uid]
    );
    const summary = await query(
      `SELECT status, COALESCE(SUM(amount),0) total FROM sg_disbursements WHERE state_user_id=$1 GROUP BY status`, [uid]
    );
    res.json({ disbursements: rows, summary });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/disbursements', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { tp_id, scheme, amount, tranche, fy, disbursed_date, reference_no, remarks } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount is required' });
    const result = await execute(
      `INSERT INTO sg_disbursements (state_user_id,tp_id,scheme,amount,tranche,fy,disbursed_date,reference_no,remarks,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING id`,
      [uid, tp_id || null, scheme, amount, tranche, fy, disbursed_date, reference_no, remarks]
    );
    await logAudit({ user: req.user, action: 'Disbursement Initiated', entity: 'sg_disbursements', entityId: result.rows[0].id, detail: `₹${amount}` });
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/disbursements/:id/status', authRequired, stateOnly, async (req, res) => {
  try {
    const { status } = req.body;
    await execute('UPDATE sg_disbursements SET status=$1 WHERE id=$2 AND state_user_id=$3', [status, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── GRIEVANCES ──
router.get('/grievances', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { status } = req.query;
    let sql = 'SELECT * FROM sg_grievances WHERE state_user_id=$1';
    const params = [uid];
    if (status) { sql += ' AND status=$2'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    res.json(await query(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/grievances', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { filed_by, filer_type, category, district, description, priority } = req.body;
    const ticket_no = `GRV-${(req.user.state_name || 'ST').substring(0,2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const result = await execute(
      `INSERT INTO sg_grievances (state_user_id,ticket_no,filed_by,filer_type,category,district,description,priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [uid, ticket_no, filed_by, filer_type, category, district, description, priority || 'medium']
    );
    res.json({ id: result.rows[0].id, ticket_no });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/grievances/:id', authRequired, stateOnly, async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const resolved_at = status === 'resolved' ? new Date().toISOString() : null;
    await execute(
      `UPDATE sg_grievances SET status=COALESCE($1,status), resolution=COALESCE($2,resolution),
       resolved_at=COALESCE($3,resolved_at) WHERE id=$4 AND state_user_id=$5`,
      [status, resolution, resolved_at, req.params.id, req.user.id]
    );
    await logAudit({ user: req.user, action: 'Grievance Updated', entity: 'sg_grievances', entityId: req.params.id, detail: status });
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── CERTIFICATES ──
router.get('/certificates', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const { q } = req.query;
    let sql = 'SELECT * FROM sg_certificates WHERE state_user_id=$1';
    const params = [uid];
    if (q) { sql += ' AND (cert_no ILIKE $2 OR candidate_name ILIKE $3)'; params.push(`%${q}%`, `%${q}%`); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    res.json(await query(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/certificates/verify', authRequired, stateOnly, async (req, res) => {
  try {
    const { cert_no } = req.body;
    const cert = await queryOne('SELECT * FROM sg_certificates WHERE cert_no=$1', [cert_no]);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json(cert);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── NOTIFICATIONS ──
router.get('/notifications', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    res.json(await query('SELECT * FROM sg_notifications WHERE state_user_id=$1 ORDER BY created_at DESC LIMIT 50', [uid]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/notifications/mark-read', authRequired, stateOnly, async (req, res) => {
  try {
    await execute('UPDATE sg_notifications SET is_read=1 WHERE state_user_id=$1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── SCHEMES MASTER ──
router.get('/schemes', authRequired, stateOnly, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM sg_schemes WHERE is_active=1 ORDER BY id'));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── MIS SUMMARY ──
router.get('/mis', authRequired, stateOnly, async (req, res) => {
  try {
    const uid = req.user.id;
    const schemes = await query('SELECT * FROM sg_schemes WHERE is_active=1');
    const result = await Promise.all(schemes.map(async s => {
      const enrolled   = parseInt((await queryOne("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND scheme=$2", [uid, s.code])).c);
      const certified  = parseInt((await queryOne("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND scheme=$2 AND certification_status='certified'", [uid, s.code])).c);
      const placed     = parseInt((await queryOne("SELECT COUNT(*) c FROM sg_candidates WHERE state_user_id=$1 AND scheme=$2 AND placement_status='placed'", [uid, s.code])).c);
      const disbRow    = await queryOne("SELECT COALESCE(SUM(amount),0) s FROM sg_disbursements WHERE state_user_id=$1 AND scheme=$2 AND status='disbursed'", [uid, s.code]);
      const disbursed  = parseFloat(disbRow.s || 0);
      return { ...s, enrolled, certified, placed, disbursed, certRate: enrolled ? Math.round(certified / enrolled * 100) : 0 };
    }));
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── PROFILE ──
router.get('/profile', authRequired, stateOnly, async (req, res) => {
  try {
    const user = await queryOne('SELECT id,name,email,role,org_name,location,state_name,phone FROM users WHERE id=$1', [req.user.id]);
    res.json(user || {});
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
