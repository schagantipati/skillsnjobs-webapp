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
    out.myEnrollments = db.prepare(`SELECT COUNT(*) c FROM enrollments WHERE candidate_id=?`).get(req.user.id).c;
  }
  if (req.user.role === 'employer') {
    out.myJobs = db.prepare(`SELECT COUNT(*) c FROM jobs WHERE employer_id=?`).get(req.user.id).c;
    out.myApplicants = db.prepare(`SELECT COUNT(*) c FROM applications a JOIN jobs j ON j.id=a.job_id WHERE j.employer_id=?`).get(req.user.id).c;
  }
  res.json(out);
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SkillsNJobs API running on http://localhost:${PORT}`));
