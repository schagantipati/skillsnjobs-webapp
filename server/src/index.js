require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./db');
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

// Lightweight dashboard stats
app.get('/api/stats/summary', authRequired, (req, res) => {
  const openJobs = db.prepare(`SELECT COUNT(*) c FROM jobs WHERE status='open'`).get().c;
  const candidates = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='candidate'`).get().c;
  const employers = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='employer'`).get().c;
  const courses = db.prepare(`SELECT COUNT(*) c FROM courses`).get().c;
  const applications = db.prepare(`SELECT COUNT(*) c FROM applications`).get().c;
  const hired = db.prepare(`SELECT COUNT(*) c FROM applications WHERE status='hired'`).get().c;

  const out = { openJobs, candidates, employers, courses, applications, hired };

  if (req.user.role === 'candidate') {
    out.myApplications = db.prepare(`SELECT COUNT(*) c FROM applications WHERE candidate_id=?`).get(req.user.id).c;
    out.myEnrollments  = db.prepare(`SELECT COUNT(*) c FROM enrollments WHERE candidate_id=?`).get(req.user.id).c;
    out.myCertificates = db.prepare(`SELECT COUNT(*) c FROM candidate_certificates WHERE candidate_id=?`).get(req.user.id).c;
    out.myShortlisted  = db.prepare(`SELECT COUNT(*) c FROM applications WHERE candidate_id=? AND status='shortlisted'`).get(req.user.id).c;
  }
  if (req.user.role === 'employer') {
    out.myJobs        = db.prepare(`SELECT COUNT(*) c FROM jobs WHERE employer_id=?`).get(req.user.id).c;
    out.myOpenJobs    = db.prepare(`SELECT COUNT(*) c FROM jobs WHERE employer_id=? AND status='open'`).get(req.user.id).c;
    out.myApplicants  = db.prepare(`SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=?`).get(req.user.id).c;
    out.myShortlisted = db.prepare(`SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=? AND a.status='shortlisted'`).get(req.user.id).c;
    out.myHired       = db.prepare(`SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=? AND a.status='hired'`).get(req.user.id).c;
  }
  if (req.user.role === 'trainer') {
    out.myBatches       = db.prepare(`SELECT COUNT(*) c FROM batches WHERE trainer_id=?`).get(req.user.id).c;
    out.myActiveBatches = db.prepare(`SELECT COUNT(*) c FROM batches WHERE trainer_id=? AND status='active'`).get(req.user.id).c;
    out.myLearners      = db.prepare(`SELECT COUNT(*) c FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=?`).get(req.user.id).c;
    const attRow = db.prepare(`SELECT AVG(present)*100 pct FROM attendance a JOIN batches b ON b.id=a.batch_id WHERE b.trainer_id=?`).get(req.user.id);
    out.avgAttendance   = attRow?.pct ? Math.round(attRow.pct) : 0;
    const passRow = db.prepare(`SELECT AVG(passed)*100 pct FROM batch_enrollments be JOIN batches b ON b.id=be.batch_id WHERE b.trainer_id=? AND be.assessment_score IS NOT NULL`).get(req.user.id);
    out.assessmentPassRate = passRow?.pct ? Math.round(passRow.pct) : 0;
  }
  if (req.user.role === 'placement_agency') {
    out.totalPlacements  = db.prepare(`SELECT COUNT(*) c FROM placements WHERE agency_id=?`).get(req.user.id).c;
    out.placedThisYear   = db.prepare(`SELECT COUNT(*) c FROM placements WHERE agency_id=? AND strftime('%Y',placement_date)=strftime('%Y','now')`).get(req.user.id).c;
    out.joinedCount      = db.prepare(`SELECT COUNT(*) c FROM placements WHERE agency_id=? AND status='joined'`).get(req.user.id).c;
    const ctcRow = db.prepare(`SELECT AVG(ctc) avg FROM placements WHERE agency_id=? AND status IN ('placed','joined')`).get(req.user.id);
    out.avgCTC           = ctcRow?.avg ? Math.round(ctcRow.avg / 100000 * 10) / 10 : 0;
  }
  if (req.user.role === 'superadmin' || req.user.role === 'admin') {
    out.totalBatches      = db.prepare(`SELECT COUNT(*) c FROM batches`).get().c;
    out.totalPlacements   = db.prepare(`SELECT COUNT(*) c FROM placements`).get().c;
    out.totalCertificates = db.prepare(`SELECT COUNT(*) c FROM candidate_certificates`).get().c;
    out.trainers          = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='trainer'`).get().c;
    out.placementAgencies = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='placement_agency'`).get().c;
    out.csrOrgs           = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='csr_org'`).get().c;
    out.trainingVendors   = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='training_vendor'`).get().c;
    out.sgTPs             = db.prepare(`SELECT COUNT(*) c FROM sg_training_partners`).get().c;
    out.sgTPsVerified     = db.prepare(`SELECT COUNT(*) c FROM sg_training_partners WHERE status='verified'`).get().c;
    out.sgTPsPending      = db.prepare(`SELECT COUNT(*) c FROM sg_training_partners WHERE status='pending'`).get().c;
    out.sgTPsSuspended    = db.prepare(`SELECT COUNT(*) c FROM sg_training_partners WHERE status='suspended'`).get().c;
    out.sgCandidates      = db.prepare(`SELECT COUNT(*) c FROM sg_candidates`).get().c;
    out.placedCandidates  = db.prepare(`SELECT COUNT(*) c FROM placements WHERE status IN ('placed','joined')`).get().c;
    out.activeBatches     = db.prepare(`SELECT COUNT(*) c FROM batches WHERE status='active'`).get().c;
    out.totalUsers        = db.prepare(`SELECT COUNT(*) c FROM users WHERE is_active=1`).get().c;
    out.sgGrievancesOpen  = db.prepare(`SELECT COUNT(*) c FROM sg_grievances WHERE status='open'`).get().c;
    out.vendorCentres     = db.prepare(`SELECT COUNT(*) c FROM vendor_centres WHERE status='active'`).get().c;
  }
  res.json(out);
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
}
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET env var not set — using insecure default. Set JWT_SECRET in production.');
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SkillsNJobs API running on http://localhost:${PORT}`));
