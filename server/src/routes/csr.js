const express = require('express');
const router = express.Router();
const { query, queryOne, execute } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

router.use(authRequired);
router.use(requireRole('csr_org', 'superadmin', 'admin'));

const uid = req => req.user.id;

// ── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const id = uid(req);
    const n = async (sql, p) => parseInt((await queryOne(sql, p)).c || (await queryOne(sql, p)).s || 0);
    const totalProjects      = parseInt((await queryOne('SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=$1', [id])).c);
    const activeProjects     = parseInt((await queryOne("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=$1 AND status='active'", [id])).c);
    const completedProjects  = parseInt((await queryOne("SELECT COUNT(*) c FROM csr_projects WHERE csr_user_id=$1 AND status='completed'", [id])).c);
    const totalBeneficiaries = parseInt((await queryOne('SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=$1', [id])).c);
    const placedBeneficiaries= parseInt((await queryOne("SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=$1 AND placement_status='placed'", [id])).c);
    const certifiedBeneficiaries= parseInt((await queryOne("SELECT COUNT(*) c FROM csr_beneficiaries WHERE csr_user_id=$1 AND training_status='completed'", [id])).c);
    const totalDisbursedRow  = await queryOne("SELECT COALESCE(SUM(amount),0) s FROM csr_disbursements WHERE csr_user_id=$1 AND status='disbursed'", [id]);
    const totalDisbursed     = parseFloat(totalDisbursedRow.s || 0);
    const pendingDisbursements= parseInt((await queryOne("SELECT COUNT(*) c FROM csr_disbursements WHERE csr_user_id=$1 AND status='pending'", [id])).c);
    const totalPartners      = parseInt((await queryOne('SELECT COUNT(*) c FROM csr_training_partners WHERE csr_user_id=$1', [id])).c);
    const activePartners     = parseInt((await queryOne("SELECT COUNT(*) c FROM csr_training_partners WHERE csr_user_id=$1 AND status='active'", [id])).c);
    const totalBudgetRow     = await queryOne('SELECT COALESCE(SUM(budget),0) s FROM csr_projects WHERE csr_user_id=$1', [id]);
    const totalBudget        = parseFloat(totalBudgetRow.s || 0);
    const totalSpentRow      = await queryOne('SELECT COALESCE(SUM(spent),0) s FROM csr_projects WHERE csr_user_id=$1', [id]);
    const totalSpent         = parseFloat(totalSpentRow.s || 0);
    res.json({ totalProjects, activeProjects, completedProjects, totalBeneficiaries, placedBeneficiaries, certifiedBeneficiaries, totalDisbursed, pendingDisbursements, totalPartners, activePartners, totalBudget, totalSpent });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Projects ───────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM csr_projects WHERE csr_user_id=$1 ORDER BY created_at DESC', [uid(req)]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/projects', async (req, res) => {
  try {
    const { title, activity, sub_sector, state_name, district, start_date, end_date, budget, beneficiaries_target, implementing_agency, status } = req.body;
    const result = await execute('INSERT INTO csr_projects (csr_user_id,title,activity,sub_sector,state_name,district,start_date,end_date,budget,beneficiaries_target,implementing_agency,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id',
      [uid(req), title, activity, sub_sector, state_name, district, start_date, end_date, budget||0, beneficiaries_target||0, implementing_agency, status||'draft']);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.put('/projects/:id', async (req, res) => {
  try {
    const { title, activity, sub_sector, state_name, district, start_date, end_date, budget, spent, beneficiaries_target, beneficiaries_actual, implementing_agency, status } = req.body;
    await execute('UPDATE csr_projects SET title=$1,activity=$2,sub_sector=$3,state_name=$4,district=$5,start_date=$6,end_date=$7,budget=$8,spent=$9,beneficiaries_target=$10,beneficiaries_actual=$11,implementing_agency=$12,status=$13 WHERE id=$14 AND csr_user_id=$15',
      [title, activity, sub_sector, state_name, district, start_date, end_date, budget, spent, beneficiaries_target, beneficiaries_actual, implementing_agency, status, req.params.id, uid(req)]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/projects/:id', async (req, res) => {
  try {
    await execute('DELETE FROM csr_projects WHERE id=$1 AND csr_user_id=$2', [req.params.id, uid(req)]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Beneficiaries ──────────────────────────────────────────────────────────
router.get('/beneficiaries', async (req, res) => {
  try {
    const { project_id, status } = req.query;
    let q = 'SELECT b.*, p.title project_title FROM csr_beneficiaries b LEFT JOIN csr_projects p ON p.id=b.project_id WHERE b.csr_user_id=$1';
    const params = [uid(req)];
    let idx = 2;
    if (project_id) { q += ` AND b.project_id=$${idx++}`; params.push(project_id); }
    if (status) { q += ` AND b.training_status=$${idx++}`; params.push(status); }
    q += ' ORDER BY b.created_at DESC';
    res.json(await query(q, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/beneficiaries', async (req, res) => {
  try {
    const { project_id, name, gender, age, district, state_name, course, batch_code, enroll_date, training_status, placement_status } = req.body;
    const result = await execute('INSERT INTO csr_beneficiaries (csr_user_id,project_id,name,gender,age,district,state_name,course,batch_code,enroll_date,training_status,placement_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id',
      [uid(req), project_id||null, name, gender, age||null, district, state_name, course, batch_code, enroll_date, training_status||'enrolled', placement_status||'not_placed']);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.put('/beneficiaries/:id', async (req, res) => {
  try {
    const { training_status, placement_status } = req.body;
    await execute('UPDATE csr_beneficiaries SET training_status=$1,placement_status=$2 WHERE id=$3 AND csr_user_id=$4',
      [training_status, placement_status, req.params.id, uid(req)]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Disbursements ──────────────────────────────────────────────────────────
router.get('/disbursements', async (req, res) => {
  try {
    const rows = await query('SELECT d.*, p.title project_title FROM csr_disbursements d LEFT JOIN csr_projects p ON p.id=d.project_id WHERE d.csr_user_id=$1 ORDER BY d.created_at DESC', [uid(req)]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/disbursements', async (req, res) => {
  try {
    const { project_id, amount, recipient, purpose, disbursed_date, reference_no, fy, status } = req.body;
    const result = await execute('INSERT INTO csr_disbursements (csr_user_id,project_id,amount,recipient,purpose,disbursed_date,reference_no,fy,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
      [uid(req), project_id||null, amount, recipient, purpose, disbursed_date||null, reference_no, fy, status||'pending']);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.put('/disbursements/:id/status', async (req, res) => {
  try {
    await execute('UPDATE csr_disbursements SET status=$1 WHERE id=$2 AND csr_user_id=$3', [req.body.status, req.params.id, uid(req)]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Training Partners ──────────────────────────────────────────────────────
router.get('/training-partners', async (req, res) => {
  try {
    res.json(await query('SELECT * FROM csr_training_partners WHERE csr_user_id=$1 ORDER BY created_at DESC', [uid(req)]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.post('/training-partners', async (req, res) => {
  try {
    const { name, type, state_name, district, contact_email, contact_mobile, mou_date, mou_expiry, status } = req.body;
    const result = await execute('INSERT INTO csr_training_partners (csr_user_id,name,type,state_name,district,contact_email,contact_mobile,mou_date,mou_expiry,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
      [uid(req), name, type, state_name, district, contact_email, contact_mobile, mou_date, mou_expiry, status||'active']);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.put('/training-partners/:id', async (req, res) => {
  try {
    const { status, beneficiaries_trained } = req.body;
    await execute('UPDATE csr_training_partners SET status=$1,beneficiaries_trained=$2 WHERE id=$3 AND csr_user_id=$4',
      [status, beneficiaries_trained, req.params.id, uid(req)]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});
router.delete('/training-partners/:id', async (req, res) => {
  try {
    await execute('DELETE FROM csr_training_partners WHERE id=$1 AND csr_user_id=$2', [req.params.id, uid(req)]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
