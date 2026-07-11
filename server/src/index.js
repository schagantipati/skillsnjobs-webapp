require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb, query } = require('./db');
const { authRequired } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const courseRoutes = require('./routes/courses');
const importRoutes = require('./routes/importData');
const orgClassificationRoutes = require('./routes/orgClassifications');
const accreditationRoutes = require('./routes/accreditations');
const geographicCoverageRoutes = require('./routes/geographicCoverage');
const targetBeneficiaryRoutes = require('./routes/targetBeneficiaries');
const vendorRoutes = require('./routes/vendor');
const stateGovtRoutes = require('./routes/stateGovt');
const batchRoutes = require('./routes/batches');
const placementRoutes = require('./routes/placements');
const csrRoutes = require('./routes/csr');
const trainerRoutes = require('./routes/trainer');
const collaborationRoutes = require('./routes/collaboration');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'skillsnjobs-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/import', importRoutes);
app.use('/api/org-classifications', orgClassificationRoutes);
app.use('/api/accreditations', accreditationRoutes);
app.use('/api/geographic-coverage', geographicCoverageRoutes);
app.use('/api/target-beneficiaries', targetBeneficiaryRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/csr', csrRoutes);
app.use('/api/state-govt', stateGovtRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/collaboration', collaborationRoutes);

app.get('/api/stats/summary', authRequired, async (req, res) => {
  try {
    const n = async (sql, p) => parseInt((await query(sql, p))[0]?.c || 0);
    const out = {
      openJobs:     await n(`SELECT COUNT(*) c FROM jobs WHERE status='open'`),
      candidates:   await n(`SELECT COUNT(*) c FROM users WHERE role='candidate'`),
      employers:    await n(`SELECT COUNT(*) c FROM users WHERE role='employer'`),
      courses:      await n(`SELECT COUNT(*) c FROM courses`),
      applications: await n(`SELECT COUNT(*) c FROM applications`),
      hired:        await n(`SELECT COUNT(*) c FROM applications WHERE status='hired'`),
    };
    const u = req.user;
    if (u.role === 'candidate') {
      out.myApplications = await n(`SELECT COUNT(*) c FROM applications WHERE candidate_id=$1`, [u.id]);
      out.myEnrollments  = await n(`SELECT COUNT(*) c FROM enrollments WHERE candidate_id=$1`, [u.id]);
      out.myCertificates = await n(`SELECT COUNT(*) c FROM candidate_certificates WHERE candidate_id=$1`, [u.id]);
      out.myShortlisted  = await n(`SELECT COUNT(*) c FROM applications WHERE candidate_id=$1 AND status='shortlisted'`, [u.id]);
    }
    if (u.role === 'employer') {
      out.myJobs        = await n(`SELECT COUNT(*) c FROM jobs WHERE employer_id=$1`, [u.id]);
      out.myOpenJobs    = await n(`SELECT COUNT(*) c FROM jobs WHERE employer_id=$1 AND status='open'`, [u.id]);
      out.myApplicants  = await n(`SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=$1`, [u.id]);
      out.myShortlisted = await n(`SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=$1 AND a.status='shortlisted'`, [u.id]);
      out.myHired       = await n(`SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=$1 AND a.status='hired'`, [u.id]);
    }
    if (u.role === 'trainer') {
      out.myBatches       = await n(`SELECT COUNT(*) c FROM batches WHERE trainer_id=$1`, [u.id]);
      out.myActiveBatches = await n(`SELECT COUNT(*) c FROM batches WHERE trainer_id=$1 AND status='active'`, [u.id]);
      out.myLearners      = await n(`SELECT COUNT(*) c FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=$1`, [u.id]);
      const attRow = (await query(`SELECT AVG(present::int)*100 pct FROM attendance a JOIN batches b ON b.id=a.batch_id WHERE b.trainer_id=$1`, [u.id]))[0];
      out.avgAttendance   = attRow?.pct ? Math.round(attRow.pct) : 0;
      const passRow = (await query(`SELECT AVG(passed::int)*100 pct FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=$1 AND be.assessment_score IS NOT NULL`, [u.id]))[0];
      out.assessmentPassRate = passRow?.pct ? Math.round(passRow.pct) : 0;
    }
    if (u.role === 'placement_agency') {
      out.totalPlacements = await n(`SELECT COUNT(*) c FROM placements WHERE agency_id=$1`, [u.id]);
      out.placedThisYear  = await n(`SELECT COUNT(*) c FROM placements WHERE agency_id=$1 AND LEFT(placement_date,4)=TO_CHAR(CURRENT_DATE,'YYYY')`, [u.id]);
      out.joinedCount     = await n(`SELECT COUNT(*) c FROM placements WHERE agency_id=$1 AND status='joined'`, [u.id]);
      const ctcRow = (await query(`SELECT AVG(ctc) avg FROM placements WHERE agency_id=$1 AND status IN ('placed','joined')`, [u.id]))[0];
      out.avgCTC = ctcRow?.avg ? Math.round(ctcRow.avg / 100000 * 10) / 10 : 0;
    }
    if (u.role === 'superadmin' || u.role === 'admin') {
      out.totalBatches      = await n(`SELECT COUNT(*) c FROM batches`);
      out.totalPlacements   = await n(`SELECT COUNT(*) c FROM placements`);
      out.totalCertificates = await n(`SELECT COUNT(*) c FROM candidate_certificates`);
      out.trainers          = await n(`SELECT COUNT(*) c FROM users WHERE role='trainer'`);
      out.placementAgencies = await n(`SELECT COUNT(*) c FROM users WHERE role='placement_agency'`);
      out.csrOrgs           = await n(`SELECT COUNT(*) c FROM users WHERE role='csr_org'`);
      out.trainingVendors   = await n(`SELECT COUNT(*) c FROM users WHERE role='training_vendor'`);
      out.sgTPs             = await n(`SELECT COUNT(*) c FROM sg_training_partners`);
      out.sgTPsVerified     = await n(`SELECT COUNT(*) c FROM sg_training_partners WHERE status='verified'`);
      out.sgTPsPending      = await n(`SELECT COUNT(*) c FROM sg_training_partners WHERE status='pending'`);
      out.sgCandidates      = await n(`SELECT COUNT(*) c FROM sg_candidates`);
      out.placedCandidates  = await n(`SELECT COUNT(*) c FROM placements WHERE status IN ('placed','joined')`);
      out.activeBatches     = await n(`SELECT COUNT(*) c FROM batches WHERE status='active'`);
      out.totalUsers        = await n(`SELECT COUNT(*) c FROM users WHERE is_active=1`);
      out.sgGrievancesOpen  = await n(`SELECT COUNT(*) c FROM sg_grievances WHERE status='open'`);
      out.vendorCentres     = await n(`SELECT COUNT(*) c FROM vendor_centres WHERE status='active'`);
    }
    res.json(out);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
}
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => app.listen(PORT, () => console.log(`SkillsNJobs API running on http://localhost:${PORT}`)))
  .catch(err => { console.error('DB init failed:', err.message); process.exit(1); });
