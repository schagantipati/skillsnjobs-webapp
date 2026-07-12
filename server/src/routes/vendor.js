const express = require('express');
const { query, queryOne, execute, logAudit } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function vendorOnly(req, res, next) {
  if (req.user.role !== 'training_vendor') return res.status(403).json({ error: 'Training vendor only' });
  next();
}

const auth = [authRequired, vendorOnly];

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const vid = req.user.id;
    const n = async (sql, p) => parseInt((await queryOne(sql, p)).c || 0);
    const centres = await n('SELECT COUNT(*) c FROM vendor_centres WHERE vendor_id=$1 AND status!=$2', [vid, 'deleted']);
    const trainers = await n('SELECT COUNT(*) c FROM vendor_trainers WHERE vendor_id=$1 AND status=$2', [vid, 'active']);
    const batches  = await n("SELECT COUNT(*) c FROM batches WHERE vendor_id=$1 AND status IN ('active','upcoming')", [vid]);
    const candidates = await n("SELECT COUNT(*) c FROM vendor_candidates WHERE vendor_id=$1 AND status='active'", [vid]);
    const docs_pending = await n("SELECT COUNT(*) c FROM vendor_documents WHERE vendor_id=$1 AND status='expiring'", [vid]);
    const tickets_open = await n("SELECT COUNT(*) c FROM vendor_grievances WHERE vendor_id=$1 AND status='open'", [vid]);
    res.json({ centres, trainers, batches, candidates, docs_pending, tickets_open });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Centres ──────────────────────────────────────────────────────────────────
// Return centres from the vendor's onboarding Step 6 profile (for import)
router.get('/centres/onboarding', auth, async (req, res) => {
  try {
    const user = await queryOne('SELECT vendor_profile FROM users WHERE id=$1', [req.user.id]);
    let step6Centres = [];
    try {
      const vp = typeof user.vendor_profile === 'string' ? JSON.parse(user.vendor_profile) : (user.vendor_profile || {});
      step6Centres = vp.step6?.centres || [];
    } catch {}
    // Mark which indices are already imported
    const imported = await query('SELECT step6_idx FROM vendor_centres WHERE vendor_id=$1 AND step6_idx IS NOT NULL AND status!=$2', [req.user.id, 'deleted']);
    const importedIdxs = new Set(imported.map(r => r.step6_idx));
    const result = step6Centres.map((c, i) => ({ ...c, _idx: i, _imported: importedIdxs.has(i) }));
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/centres', auth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vendor_centres WHERE vendor_id=$1 AND status!=$2 ORDER BY created_at DESC', [req.user.id, 'deleted']);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/centres', auth, async (req, res) => {
  try {
    const { name, address, state_name, district, city, pincode, geo, classrooms, labs,
            seating_capacity, internet, power_backup, accessibility, equipment,
            centre_code, centre_type, centre_status, ownership, year_started, area_sqft, step6_idx } = req.body;
    if (!name) return res.status(400).json({ error: 'Centre name required' });
    const dup = await queryOne(
      "SELECT id FROM vendor_centres WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted'",
      [req.user.id, name]);
    if (dup) return res.status(409).json({ error: `A training centre named "${name.trim()}" already exists.`, field: 'name' });
    const result = await execute(`INSERT INTO vendor_centres
      (vendor_id,name,address,state_name,district,city,pincode,geo,classrooms,labs,
       seating_capacity,internet,power_backup,accessibility,equipment,
       centre_code,centre_type,centre_status,ownership,year_started,area_sqft,step6_idx)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
      [req.user.id, name, address||null, state_name||null, district||null, city||null, pincode||null, geo||null,
       classrooms||0, labs||0, seating_capacity||0, internet||null, power_backup||null, accessibility||null, equipment||null,
       centre_code||null, centre_type||null, centre_status||null, ownership||null, year_started||null,
       area_sqft||null, step6_idx!=null ? step6_idx : null]);
    await logAudit({ user: req.user, action: 'centre_created', entity: 'vendor_centre', entityId: result.rows[0].id });
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/centres/:id', auth, async (req, res) => {
  try {
    const { name, address, state_name, district, city, pincode, geo, classrooms, labs,
            seating_capacity, internet, power_backup, accessibility, equipment, status,
            centre_code, centre_type, centre_status, ownership, year_started, area_sqft } = req.body;
    if (name) {
      const dup = await queryOne(
        "SELECT id FROM vendor_centres WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted' AND id!=$3",
        [req.user.id, name, req.params.id]);
      if (dup) return res.status(409).json({ error: `A training centre named "${name.trim()}" already exists.`, field: 'name' });
    }
    await execute(`UPDATE vendor_centres SET
      name=COALESCE($1,name), address=COALESCE($2,address), state_name=COALESCE($3,state_name),
      district=COALESCE($4,district), city=COALESCE($5,city), pincode=COALESCE($6,pincode),
      geo=COALESCE($7,geo), classrooms=COALESCE($8,classrooms), labs=COALESCE($9,labs),
      seating_capacity=COALESCE($10,seating_capacity), internet=COALESCE($11,internet),
      power_backup=COALESCE($12,power_backup), accessibility=COALESCE($13,accessibility),
      equipment=COALESCE($14,equipment), status=COALESCE($15,status),
      centre_code=COALESCE($16,centre_code), centre_type=COALESCE($17,centre_type),
      centre_status=COALESCE($18,centre_status), ownership=COALESCE($19,ownership),
      year_started=COALESCE($20,year_started), area_sqft=COALESCE($21,area_sqft)
      WHERE id=$22 AND vendor_id=$23`,
      [name||null, address||null, state_name||null, district||null, city||null, pincode||null,
       geo||null, classrooms!=null?classrooms:null, labs!=null?labs:null,
       seating_capacity!=null?seating_capacity:null, internet||null, power_backup||null,
       accessibility||null, equipment||null, status||null,
       centre_code||null, centre_type||null, centre_status||null, ownership||null,
       year_started||null, area_sqft!=null?area_sqft:null,
       req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/centres/:id', auth, async (req, res) => {
  try {
    await execute('UPDATE vendor_centres SET status=$1 WHERE id=$2 AND vendor_id=$3', ['deleted', req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Trainers ──────────────────────────────────────────────────────────────────

// Lookup a registered trainer user by email (for linking)
router.get('/trainers/lookup', auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    const u = await queryOne(
      `SELECT id, name, email, phone, gender, dob, category, pan, preferred_sector, qualification
       FROM users WHERE LOWER(email)=LOWER($1) AND role='trainer'`, [email]);
    if (!u) return res.status(404).json({ error: 'No registered trainer found with this email.' });
    res.json(u);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/trainers', auth, async (req, res) => {
  try {
    const rows = await query(`
      SELECT t.*, c.name AS centre_name,
             u.name AS linked_name, u.email AS linked_email,
             u.phone AS linked_phone, u.gender AS linked_gender,
             u.dob AS linked_dob, u.category AS linked_category,
             u.pan AS linked_pan, u.preferred_sector AS linked_sector,
             u.qualification AS linked_qualification
      FROM vendor_trainers t
      LEFT JOIN vendor_centres c ON c.id=t.centre_id
      LEFT JOIN users u ON u.id=t.user_id
      WHERE t.vendor_id=$1 AND t.status!='deleted' ORDER BY t.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/trainers', auth, async (req, res) => {
  try {
    const { name, email, mobile, qualification, sector, experience_years, nsqf_level,
            centre_id, dob, gender, category, aadhaar, pan, user_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Trainer name required' });
    const dup = await queryOne(
      "SELECT id FROM vendor_trainers WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted'",
      [req.user.id, name]);
    if (dup) return res.status(409).json({ error: `A trainer named "${name.trim()}" already exists.`, field: 'name' });

    // Auto-link by email if user_id not provided
    let resolvedUserId = user_id || null;
    if (!resolvedUserId && email) {
      const u = await queryOne("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='trainer'", [email]);
      if (u) resolvedUserId = u.id;
    }

    const result = await execute(`INSERT INTO vendor_trainers
      (vendor_id,centre_id,name,email,mobile,qualification,sector,experience_years,nsqf_level,dob,gender,category,aadhaar,pan,user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [req.user.id, centre_id||null, name, email||null, mobile||null, qualification||null,
       sector||null, experience_years||0, nsqf_level||null,
       dob||null, gender||null, category||null, aadhaar||null, pan||null, resolvedUserId]);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/trainers/:id', auth, async (req, res) => {
  try {
    const { name, email, mobile, qualification, sector, experience_years, nsqf_level,
            centre_id, status, dob, gender, category, aadhaar, pan, user_id } = req.body;
    if (name) {
      const dup = await queryOne(
        "SELECT id FROM vendor_trainers WHERE vendor_id=$1 AND LOWER(TRIM(name))=LOWER(TRIM($2)) AND status!='deleted' AND id!=$3",
        [req.user.id, name, req.params.id]);
      if (dup) return res.status(409).json({ error: `A trainer named "${name.trim()}" already exists.`, field: 'name' });
    }

    // Auto-link by email if user_id not already set on this record
    let resolvedUserId = user_id !== undefined ? (user_id || null) : undefined;
    if (resolvedUserId === undefined && email) {
      const existing = await queryOne('SELECT user_id FROM vendor_trainers WHERE id=$1', [req.params.id]);
      if (!existing?.user_id) {
        const u = await queryOne("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='trainer'", [email]);
        resolvedUserId = u ? u.id : null;
      }
    }

    await execute(`UPDATE vendor_trainers SET
      name=COALESCE($1,name), email=COALESCE($2,email), mobile=COALESCE($3,mobile),
      qualification=COALESCE($4,qualification), sector=COALESCE($5,sector),
      experience_years=COALESCE($6,experience_years), nsqf_level=COALESCE($7,nsqf_level),
      centre_id=COALESCE($8,centre_id), status=COALESCE($9,status),
      dob=COALESCE($10,dob), gender=COALESCE($11,gender), category=COALESCE($12,category),
      aadhaar=COALESCE($13,aadhaar), pan=COALESCE($14,pan),
      user_id=COALESCE($15::integer,user_id)
      WHERE id=$16 AND vendor_id=$17`,
      [name||null, email||null, mobile||null, qualification||null, sector||null,
       experience_years!=null?experience_years:null, nsqf_level||null,
       centre_id||null, status||null,
       dob||null, gender||null, category||null, aadhaar||null, pan||null,
       resolvedUserId!=null?resolvedUserId:null, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/trainers/:id', auth, async (req, res) => {
  try {
    await execute('UPDATE vendor_trainers SET status=$1 WHERE id=$2 AND vendor_id=$3', ['deleted', req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Courses ───────────────────────────────────────────────────────────────────
router.get('/courses', auth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vendor_courses WHERE vendor_id=$1 AND status!=$2 ORDER BY created_at DESC', [req.user.id, 'deleted']);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/courses', auth, async (req, res) => {
  try {
    const { title, sector, qp_code, nos_code, nsqf_level, duration_hours, fee_type, fee_amount, scheme } = req.body;
    if (!title) return res.status(400).json({ error: 'Course title required' });
    const dup = await queryOne(
      "SELECT id FROM vendor_courses WHERE vendor_id=$1 AND LOWER(TRIM(title))=LOWER(TRIM($2)) AND status!='deleted'",
      [req.user.id, title]);
    if (dup) return res.status(409).json({ error: `A course titled "${title.trim()}" already exists.`, field: 'title' });
    const result = await execute(`INSERT INTO vendor_courses
      (vendor_id,title,sector,qp_code,nos_code,nsqf_level,duration_hours,fee_type,fee_amount,scheme)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [req.user.id, title, sector, qp_code, nos_code, nsqf_level, duration_hours||0, fee_type||'fee-based', fee_amount||0, scheme]);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/courses/:id', auth, async (req, res) => {
  try {
    const { title, sector, qp_code, nos_code, nsqf_level, duration_hours, fee_type, fee_amount, scheme, status } = req.body;
    if (title) {
      const dup = await queryOne(
        "SELECT id FROM vendor_courses WHERE vendor_id=$1 AND LOWER(TRIM(title))=LOWER(TRIM($2)) AND status!='deleted' AND id!=$3",
        [req.user.id, title, req.params.id]);
      if (dup) return res.status(409).json({ error: `A course titled "${title.trim()}" already exists.`, field: 'title' });
    }
    await execute(`UPDATE vendor_courses SET
      title=$1,sector=$2,qp_code=$3,nos_code=$4,nsqf_level=$5,duration_hours=$6,fee_type=$7,fee_amount=$8,
      scheme=$9,status=COALESCE($10,status) WHERE id=$11 AND vendor_id=$12`,
      [title, sector, qp_code, nos_code, nsqf_level, duration_hours||0, fee_type, fee_amount||0,
       scheme, status||null, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/courses/:id', auth, async (req, res) => {
  try {
    await execute('UPDATE vendor_courses SET status=$1 WHERE id=$2 AND vendor_id=$3', ['deleted', req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Batches ───────────────────────────────────────────────────────────────────
router.get('/batches', auth, async (req, res) => {
  try {
    const rows = await query(`SELECT b.*,
      vc.name AS centre_name, vco.title AS course_title, t.name AS trainer_name
      FROM batches b
      LEFT JOIN vendor_centres vc ON vc.id=b.centre_id
      LEFT JOIN vendor_courses vco ON vco.id=b.vendor_course_id
      LEFT JOIN vendor_trainers t ON t.id=b.vendor_trainer_id
      WHERE b.vendor_id=$1 AND COALESCE(b.status,'upcoming')!='cancelled'
      ORDER BY b.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/batches', auth, async (req, res) => {
  try {
    const { centre_id, course_id, batch_code, start_date, end_date, capacity, trainer_id } = req.body;
    const code = batch_code || `BT-${Date.now().toString().slice(-6)}`;
    const dup = await queryOne(
      'SELECT id FROM batches WHERE vendor_id=$1 AND LOWER(TRIM(batch_code))=LOWER(TRIM($2))',
      [req.user.id, code]);
    if (dup) return res.status(409).json({ error: `A batch with code "${code.trim()}" already exists.`, field: 'batch_code' });
    const result = await execute(`INSERT INTO batches
      (vendor_id,centre_id,vendor_course_id,batch_code,start_date,end_date,capacity,vendor_trainer_id,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.user.id, centre_id||null, course_id||null, code, start_date, end_date, capacity||30, trainer_id||null, 'upcoming']);
    res.json({ id: result.rows[0].id, batch_code: code });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/batches/:id', auth, async (req, res) => {
  try {
    const { centre_id, course_id, batch_code, start_date, end_date, capacity, trainer_id, status } = req.body;
    if (batch_code) {
      const dup = await queryOne(
        'SELECT id FROM batches WHERE vendor_id=$1 AND LOWER(TRIM(batch_code))=LOWER(TRIM($2)) AND id!=$3',
        [req.user.id, batch_code, req.params.id]);
      if (dup) return res.status(409).json({ error: `A batch with code "${batch_code.trim()}" already exists.`, field: 'batch_code' });
    }
    await execute(`UPDATE batches SET
      centre_id=$1,vendor_course_id=$2,batch_code=$3,start_date=$4,end_date=$5,capacity=$6,
      vendor_trainer_id=$7,status=COALESCE($8,status) WHERE id=$9 AND vendor_id=$10`,
      [centre_id||null, course_id||null, batch_code, start_date, end_date, capacity||30,
       trainer_id||null, status||null, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/batches/:id', auth, async (req, res) => {
  try {
    await execute('UPDATE batches SET status=$1 WHERE id=$2 AND vendor_id=$3', ['cancelled', req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Candidates ────────────────────────────────────────────────────────────────
router.get('/candidates', auth, async (req, res) => {
  try {
    const { batch_id } = req.query;
    let sql = `SELECT vc.*, b.batch_code, vco.title AS course_title
      FROM vendor_candidates vc
      LEFT JOIN batches b ON b.id=vc.unified_batch_id
      LEFT JOIN vendor_courses vco ON vco.id=b.vendor_course_id
      WHERE vc.vendor_id=$1`;
    const params = [req.user.id];
    if (batch_id) { sql += ' AND vc.unified_batch_id=$2'; params.push(batch_id); }
    sql += ' ORDER BY vc.created_at DESC';
    res.json(await query(sql, params));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/candidates', auth, async (req, res) => {
  try {
    const { name, mobile, aadhaar_masked, dob, gender, category, scheme, batch_id, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Candidate name required' });
    // Fix A: auto-link to registered candidate user account by email or mobile
    let user_id = null;
    if (email) {
      const u = await queryOne("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='candidate'", [email]);
      if (u) user_id = u.id;
    }
    if (!user_id && mobile) {
      const u = await queryOne("SELECT id FROM users WHERE phone=$1 AND role='candidate'", [mobile]);
      if (u) user_id = u.id;
    }
    const result = await execute(`INSERT INTO vendor_candidates
      (vendor_id,unified_batch_id,user_id,name,mobile,aadhaar_masked,dob,gender,category,scheme)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [req.user.id, batch_id||null, user_id, name, mobile, aadhaar_masked, dob, gender, category, scheme]);
    if (batch_id) {
      await execute('UPDATE batches SET enrolled=enrolled+1 WHERE id=$1 AND vendor_id=$2', [batch_id, req.user.id]);
    }
    res.json({ id: result.rows[0].id, user_id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/candidates/:id', auth, async (req, res) => {
  try {
    const { name, mobile, aadhaar_masked, dob, gender, category, scheme, batch_id, status, attendance_pct, placement_status, email } = req.body;
    // Fix A: auto-link user_id if not already set
    const existing = await queryOne('SELECT user_id FROM vendor_candidates WHERE id=$1', [req.params.id]);
    let user_id = existing?.user_id || null;
    if (!user_id && email) {
      const u = await queryOne("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND role='candidate'", [email]);
      if (u) user_id = u.id;
    }
    if (!user_id && mobile) {
      const u = await queryOne("SELECT id FROM users WHERE phone=$1 AND role='candidate'", [mobile]);
      if (u) user_id = u.id;
    }
    await execute(`UPDATE vendor_candidates SET
      name=COALESCE($1,name),mobile=COALESCE($2,mobile),aadhaar_masked=COALESCE($3,aadhaar_masked),
      dob=COALESCE($4,dob),gender=COALESCE($5,gender),category=COALESCE($6,category),
      scheme=COALESCE($7,scheme),unified_batch_id=COALESCE($8,unified_batch_id),
      status=COALESCE($9,status),attendance_pct=COALESCE($10,attendance_pct),
      placement_status=COALESCE($11,placement_status),user_id=COALESCE($12,user_id)
      WHERE id=$13 AND vendor_id=$14`,
      [name||null, mobile||null, aadhaar_masked||null, dob||null, gender||null, category||null,
       scheme||null, batch_id||null,
       status||null, attendance_pct!=null?attendance_pct:null, placement_status||null,
       user_id, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/candidates/:id', auth, async (req, res) => {
  try {
    await execute('UPDATE vendor_candidates SET status=$1 WHERE id=$2 AND vendor_id=$3', ['withdrawn', req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Assessments ───────────────────────────────────────────────────────────────
router.get('/assessments', auth, async (req, res) => {
  try {
    const rows = await query(`SELECT a.*, b.batch_code, vc.title AS course_title FROM vendor_assessments a
      LEFT JOIN batches b ON b.id=a.unified_batch_id
      LEFT JOIN vendor_courses vc ON vc.id=b.vendor_course_id
      WHERE a.vendor_id=$1 ORDER BY a.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/assessments', auth, async (req, res) => {
  try {
    const { batch_id, agency, scheduled_date, time_slot, candidate_count, type, total_marks, passing_marks, assessor, duration_hrs } = req.body;
    const result = await execute(`INSERT INTO vendor_assessments
      (vendor_id,unified_batch_id,agency,scheduled_date,time_slot,candidate_count,type,total_marks,passing_marks,assessor,duration_hrs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [req.user.id, batch_id||null, agency, scheduled_date, time_slot, candidate_count||0,
       type||'Final', total_marks||100, passing_marks||50, assessor||null, duration_hrs||null]);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/assessments/:id', auth, async (req, res) => {
  try {
    const { agency, scheduled_date, time_slot, candidate_count, results, status, type, total_marks, passing_marks, assessor, duration_hrs } = req.body;
    await execute(`UPDATE vendor_assessments SET
      agency=$1,scheduled_date=$2,time_slot=$3,candidate_count=$4,
      results=COALESCE($5,results),status=COALESCE($6,status),
      type=COALESCE($7,type),total_marks=COALESCE($8,total_marks),
      passing_marks=COALESCE($9,passing_marks),assessor=COALESCE($10,assessor),
      duration_hrs=COALESCE($11,duration_hrs) WHERE id=$12 AND vendor_id=$13`,
      [agency, scheduled_date, time_slot, candidate_count||0,
       results ? JSON.stringify(results) : null, status||null,
       type||null, total_marks||null, passing_marks||null, assessor||null, duration_hrs||null,
       req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/assessments/:id', auth, async (req, res) => {
  try {
    await execute('UPDATE vendor_assessments SET status=$1 WHERE id=$2 AND vendor_id=$3', ['cancelled', req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Documents ─────────────────────────────────────────────────────────────────
router.get('/documents', auth, async (req, res) => {
  try {
    const rows = await query('SELECT id,doc_type,filename,expiry_date,status,created_at FROM vendor_documents WHERE vendor_id=$1 ORDER BY doc_type', [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/documents', auth, async (req, res) => {
  try {
    const { doc_type, filename, file_data, expiry_date } = req.body;
    const existing = await queryOne('SELECT id FROM vendor_documents WHERE vendor_id=$1 AND doc_type=$2', [req.user.id, doc_type]);
    if (existing) {
      await execute('UPDATE vendor_documents SET filename=$1,file_data=$2,expiry_date=$3,status=$4,created_at=NOW() WHERE id=$5',
        [filename, file_data||null, expiry_date||null, 'uploaded', existing.id]);
      return res.json({ id: existing.id, updated: true });
    }
    const result = await execute('INSERT INTO vendor_documents (vendor_id,doc_type,filename,file_data,expiry_date,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [req.user.id, doc_type, filename, file_data||null, expiry_date||null, 'uploaded']);
    res.json({ id: result.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/documents/:id', auth, async (req, res) => {
  try {
    await execute('DELETE FROM vendor_documents WHERE id=$1 AND vendor_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Grievances ────────────────────────────────────────────────────────────────
router.get('/grievances', auth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vendor_grievances WHERE vendor_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/grievances', auth, async (req, res) => {
  try {
    const { category, priority, subject, details } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject required' });
    const ticket_no = `TK-${Date.now().toString().slice(-6)}`;
    const result = await execute('INSERT INTO vendor_grievances (vendor_id,ticket_no,category,priority,subject,details) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [req.user.id, ticket_no, category, priority||'normal', subject, details]);
    res.json({ id: result.rows[0].id, ticket_no });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/grievances/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    await execute('UPDATE vendor_grievances SET status=$1 WHERE id=$2 AND vendor_id=$3', [status, req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
