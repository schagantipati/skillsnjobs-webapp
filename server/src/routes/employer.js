const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const emp = [authRequired, requireRole('employer', 'admin', 'superadmin')];

// ── HR Contacts ──────────────────────────────────────────────────────────────
router.get('/hr-contacts', ...emp, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM employer_hr_contacts WHERE employer_id=$1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/hr-contacts', ...emp, async (req, res) => {
  const { name, designation, email, phone } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const row = await queryOne(
      `INSERT INTO employer_hr_contacts (employer_id, name, designation, email, phone)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, name.trim(), designation || null, email || null, phone || null]
    );
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/hr-contacts/:id', ...emp, async (req, res) => {
  try {
    await query(
      'DELETE FROM employer_hr_contacts WHERE id=$1 AND employer_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Documents ─────────────────────────────────────────────────────────────────
router.get('/documents', ...emp, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM employer_documents WHERE employer_id=$1 ORDER BY uploaded_at ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/documents', ...emp, async (req, res) => {
  const { doc_type, file_name, file_size } = req.body;
  if (!doc_type) return res.status(400).json({ error: 'doc_type is required' });
  try {
    const row = await queryOne(
      `INSERT INTO employer_documents (employer_id, doc_type, file_name, file_size)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (employer_id, doc_type)
       DO UPDATE SET file_name=$3, file_size=$4, uploaded_at=NOW()
       RETURNING *`,
      [req.user.id, doc_type, file_name || null, file_size || null]
    );
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/documents/:id', ...emp, async (req, res) => {
  try {
    await query(
      'DELETE FROM employer_documents WHERE id=$1 AND employer_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Interviews ────────────────────────────────────────────────────────────────
router.get('/interviews', ...emp, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM employer_interviews WHERE employer_id=$1 ORDER BY interview_date ASC, interview_time ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/interviews', ...emp, async (req, res) => {
  const { candidate_name, job_role, round, interview_date, interview_time, mode, interviewers, link } = req.body;
  if (!candidate_name?.trim()) return res.status(400).json({ error: 'Candidate name is required' });
  if (!interview_date) return res.status(400).json({ error: 'Date is required' });
  if (!interview_time) return res.status(400).json({ error: 'Time is required' });
  try {
    const row = await queryOne(
      `INSERT INTO employer_interviews
         (employer_id, candidate_name, job_role, round, interview_date, interview_time, mode, interviewers, link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, candidate_name.trim(), job_role || null, round || null,
       interview_date, interview_time, mode || 'Video Call', interviewers || null, link || null]
    );
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/interviews/:id', ...emp, async (req, res) => {
  try {
    await query(
      'DELETE FROM employer_interviews WHERE id=$1 AND employer_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Offers ────────────────────────────────────────────────────────────────────
router.get('/offers', ...emp, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM employer_offers WHERE employer_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/offers', ...emp, async (req, res) => {
  const { candidate_name, job_role, ctc, joining_date, probation, special_terms, status } = req.body;
  if (!candidate_name?.trim()) return res.status(400).json({ error: 'Candidate name is required' });
  if (!job_role?.trim()) return res.status(400).json({ error: 'Job role is required' });
  if (!ctc) return res.status(400).json({ error: 'CTC is required' });
  try {
    const row = await queryOne(
      `INSERT INTO employer_offers
         (employer_id, candidate_name, job_role, ctc, joining_date, probation, special_terms, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, candidate_name.trim(), job_role.trim(), ctc,
       joining_date || null, probation || null, special_terms || null, status || 'Draft']
    );
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/offers/:id', ...emp, async (req, res) => {
  const { status } = req.body;
  try {
    const row = await queryOne(
      'UPDATE employer_offers SET status=$1 WHERE id=$2 AND employer_id=$3 RETURNING *',
      [status, req.params.id, req.user.id]
    );
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
