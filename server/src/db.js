const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'skillsnjobs.db');
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  detail TEXT,
  ip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government','training_vendor','superadmin')),
  org_name TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT DEFAULT '[]',
  experience_years REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT DEFAULT '[]',
  location TEXT,
  job_type TEXT DEFAULT 'Full-time',
  salary_min INTEGER,
  salary_max INTEGER,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK(status IN ('applied','shortlisted','interview','rejected','hired')),
  match_score INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  provider TEXT,
  skill_tags TEXT DEFAULT '[]',
  duration_weeks INTEGER DEFAULT 4,
  level TEXT DEFAULT 'Beginner',
  rating REAL DEFAULT 4.5,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled','completed','dropped')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(course_id, candidate_id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS org_classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_enabled INTEGER DEFAULT 1,
  is_system INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Seed default org classifications if table is empty
const ocCount = db.prepare('SELECT COUNT(*) c FROM org_classifications').get().c;
if (ocCount === 0) {
  const defaults = [
    'Training Partner','NGO','Trust','Society','Company','Polytechnic','ITI',
    'College / University','CSR Foundation','Industry Training Centre',
    'Apprenticeship Provider','Sector Skill Council Partner','Assessment Agency','Placement Agency'
  ];
  const ins = db.prepare('INSERT INTO org_classifications (name, is_enabled, is_system, sort_order) VALUES (?, 1, 1, ?)');
  defaults.forEach((name, i) => ins.run(name, i + 1));
}

db.exec(`
CREATE TABLE IF NOT EXISTS accreditations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_enabled INTEGER DEFAULT 1,
  is_system INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

const acCount = db.prepare('SELECT COUNT(*) c FROM accreditations').get().c;
if (acCount === 0) {
  const defaults = [
    'NSDC Affiliation','Sector Skill Council Affiliation','State Skill Mission Empanelment',
    'DDU-GKY PIA','PMKVY Partner','Apprenticeship Registration',
    'ISO Certification','NABL / NABCB','Other Recognitions'
  ];
  const ins = db.prepare('INSERT INTO accreditations (name, is_enabled, is_system, sort_order) VALUES (?, 1, 1, ?)');
  defaults.forEach((name, i) => ins.run(name, i + 1));
}

db.exec(`
CREATE TABLE IF NOT EXISTS geographic_coverage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_enabled INTEGER DEFAULT 1,
  is_system INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

const gcCount = db.prepare('SELECT COUNT(*) c FROM geographic_coverage').get().c;
if (gcCount === 0) {
  const gcDefaults = [
    'States of Operation','Districts of Operation','Aspirational District Experience',
    'Rural Coverage','Urban Coverage','Remote / Tribal Area Experience'
  ];
  const gcIns = db.prepare('INSERT INTO geographic_coverage (name, is_enabled, is_system, sort_order) VALUES (?, 1, 1, ?)');
  gcDefaults.forEach((name, i) => gcIns.run(name, i + 1));
}

db.exec(`
CREATE TABLE IF NOT EXISTS target_beneficiaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_enabled INTEGER DEFAULT 1,
  is_system INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

const tbCount = db.prepare('SELECT COUNT(*) c FROM target_beneficiaries').get().c;
if (tbCount === 0) {
  const tbDefaults = [
    'Women','Youth','SC','ST','OBC','Minorities',
    'Persons with Disabilities','School Dropouts','College Students',
    'Rural Youth','Urban Poor','Migrant Workers',
    'Ex-Servicemen','Prison Inmates','Senior Citizens'
  ];
  const tbIns = db.prepare('INSERT INTO target_beneficiaries (name, is_enabled, is_system, sort_order) VALUES (?, 1, 1, ?)');
  tbDefaults.forEach((name, i) => tbIns.run(name, i + 1));
}

db.exec(`
CREATE TABLE IF NOT EXISTS vendor_centres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  state_name TEXT,
  district TEXT,
  city TEXT,
  pincode TEXT,
  geo TEXT,
  classrooms INTEGER DEFAULT 0,
  labs INTEGER DEFAULT 0,
  seating_capacity INTEGER DEFAULT 0,
  internet TEXT,
  power_backup TEXT,
  accessibility TEXT,
  equipment TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_trainers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  centre_id INTEGER REFERENCES vendor_centres(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  qualification TEXT,
  sector TEXT,
  experience_years INTEGER DEFAULT 0,
  nsqf_level TEXT,
  certification_doc TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sector TEXT,
  qp_code TEXT,
  nos_code TEXT,
  nsqf_level TEXT,
  duration_hours INTEGER DEFAULT 0,
  fee_type TEXT DEFAULT 'fee-based',
  fee_amount REAL DEFAULT 0,
  scheme TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  centre_id INTEGER REFERENCES vendor_centres(id) ON DELETE SET NULL,
  course_id INTEGER REFERENCES vendor_courses(id) ON DELETE SET NULL,
  batch_code TEXT,
  start_date TEXT,
  end_date TEXT,
  capacity INTEGER DEFAULT 30,
  enrolled INTEGER DEFAULT 0,
  trainer_id INTEGER REFERENCES vendor_trainers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'upcoming',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES vendor_batches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  aadhaar_masked TEXT,
  dob TEXT,
  gender TEXT,
  category TEXT,
  scheme TEXT,
  enroll_date TEXT DEFAULT (date('now')),
  attendance_pct INTEGER DEFAULT 0,
  placement_status TEXT DEFAULT 'not-placed',
  status TEXT DEFAULT 'enrolled',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES vendor_batches(id) ON DELETE SET NULL,
  agency TEXT,
  scheduled_date TEXT,
  time_slot TEXT,
  candidate_count INTEGER DEFAULT 0,
  results TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  filename TEXT,
  file_data TEXT,
  expiry_date TEXT,
  status TEXT DEFAULT 'uploaded',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_grievances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_no TEXT,
  category TEXT,
  priority TEXT DEFAULT 'normal',
  subject TEXT,
  details TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Migrations — safe to run on every startup
try { db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN reset_token TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN reset_token_expires INTEGER`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending'`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN vendor_profile TEXT`); } catch {}

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (userCount > 0) return;

  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const insertUser = db.prepare(`INSERT INTO users (name,email,password_hash,role,org_name,location,bio,skills,experience_years)
    VALUES (@name,@email,@password_hash,@role,@org_name,@location,@bio,@skills,@experience_years)`);

  const users = [
    { name: 'Admin User', email: 'admin@skillsnjobs.in', password_hash: hash('password123'), role: 'admin', org_name: null, location: 'New Delhi', bio: 'Platform administrator', skills: '[]', experience_years: 0 },
    { name: 'Aisha Khan', email: 'aisha@example.com', password_hash: hash('password123'), role: 'candidate', org_name: null, location: 'Hyderabad', bio: 'Aspiring data analyst', skills: JSON.stringify(['Excel','SQL','Communication']), experience_years: 1 },
    { name: 'Rahul Verma', email: 'rahul@example.com', password_hash: hash('password123'), role: 'candidate', org_name: null, location: 'Bengaluru', bio: 'Frontend developer learning React', skills: JSON.stringify(['HTML','CSS','JavaScript']), experience_years: 2 },
    { name: 'TechNova Pvt Ltd', email: 'hr@technova.com', password_hash: hash('password123'), role: 'employer', org_name: 'TechNova Pvt Ltd', location: 'Bengaluru', bio: 'Mid-size product company', skills: '[]', experience_years: 0 },
    { name: 'Skillbridge Academy', email: 'trainer@skillbridge.in', password_hash: hash('password123'), role: 'trainer', org_name: 'Skillbridge Academy', location: 'Pune', bio: 'NSDC-approved training partner', skills: '[]', experience_years: 0 },
    { name: 'Super Admin', email: 'superadmin@skillsnjobs.in', password_hash: hash('Welcome@123'), role: 'superadmin', org_name: null, location: 'New Delhi', bio: 'Platform super administrator', skills: '[]', experience_years: 0 },
    { name: 'State Admin', email: 'stateadmin@skillsnjobs.in', password_hash: hash('Welcome@123'), role: 'state_government', org_name: 'State Government', location: 'Hyderabad', bio: 'State government representative', skills: '[]', experience_years: 0 },
    { name: 'Central Admin', email: 'centraladmin@skillsnjobs.in', password_hash: hash('Welcome@123'), role: 'central_government', org_name: 'Central Government', location: 'New Delhi', bio: 'Central government representative', skills: '[]', experience_years: 0 },
    { name: 'Pioneer Placements', email: 'pioneer@placements.in', password_hash: hash('password123'), role: 'placement_agency', org_name: 'Pioneer Placements Pvt. Ltd.', location: 'Navi Mumbai', bio: 'NSDC-empanelled placement agency', skills: '[]', experience_years: 0 },
    { name: 'Cipla Foundation', email: 'csr@cipla.com', password_hash: hash('password123'), role: 'csr_org', org_name: 'Cipla Foundation', location: 'Mumbai', bio: 'NSDC-empanelled CSR organisation', skills: '[]', experience_years: 0 },
  ];
  const userIds = {};
  for (const u of users) {
    const info = insertUser.run(u);
    userIds[u.email] = info.lastInsertRowid;
  }

  const insertJob = db.prepare(`INSERT INTO jobs (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max)
    VALUES (@employer_id,@title,@description,@required_skills,@location,@job_type,@salary_min,@salary_max)`);
  insertJob.run({
    employer_id: userIds['hr@technova.com'],
    title: 'Junior Data Analyst',
    description: 'Analyze business data, build dashboards, and support decision-making using SQL and Power BI.',
    required_skills: JSON.stringify(['SQL','Excel','Power BI','Communication']),
    location: 'Bengaluru', job_type: 'Full-time', salary_min: 400000, salary_max: 600000
  });
  insertJob.run({
    employer_id: userIds['hr@technova.com'],
    title: 'Frontend Developer (React)',
    description: 'Build responsive web interfaces using React, work closely with design and backend teams.',
    required_skills: JSON.stringify(['JavaScript','React','CSS','HTML']),
    location: 'Bengaluru', job_type: 'Full-time', salary_min: 500000, salary_max: 800000
  });

  const insertCourse = db.prepare(`INSERT INTO courses (trainer_id,title,provider,skill_tags,duration_weeks,level,rating)
    VALUES (@trainer_id,@title,@provider,@skill_tags,@duration_weeks,@level,@rating)`);
  insertCourse.run({ trainer_id: userIds['trainer@skillbridge.in'], title: 'SQL for Data Analysis', provider: 'Skillbridge Academy', skill_tags: JSON.stringify(['SQL','Excel']), duration_weeks: 6, level: 'Beginner', rating: 4.7 });
  insertCourse.run({ trainer_id: userIds['trainer@skillbridge.in'], title: 'Power BI Fundamentals', provider: 'Skillbridge Academy', skill_tags: JSON.stringify(['Power BI']), duration_weeks: 4, level: 'Beginner', rating: 4.6 });
  insertCourse.run({ trainer_id: userIds['trainer@skillbridge.in'], title: 'React.js for Beginners', provider: 'Skillbridge Academy', skill_tags: JSON.stringify(['React','JavaScript']), duration_weeks: 8, level: 'Intermediate', rating: 4.8 });
}

// Migrate: add new candidate profile columns if they don't exist
const existingCols = db.pragma('table_info(users)').map(c => c.name);
const newCols = [
  // Candidate profile
  ['category', 'TEXT'], ['qualification', 'TEXT'], ['year_passed', 'TEXT'],
  ['board', 'TEXT'], ['university', 'TEXT'], ['percentage', 'TEXT'],
  ['employment_status', 'TEXT'], ['interests', 'TEXT'], ['preferred_sector', 'TEXT'],
  ['lang_english', 'TEXT'], ['lang_hindi', 'TEXT'], ['lang_regional', 'TEXT'],
  ['certificates', 'TEXT'], ['resume', 'TEXT'],
  // Shared / identity
  ['first_name', 'TEXT'], ['middle_name', 'TEXT'], ['last_name', 'TEXT'],
  ['dob', 'TEXT'], ['gender', 'TEXT'], ['phone', 'TEXT'], ['photo', 'TEXT'],
  ['address_line1', 'TEXT'], ['address_line2', 'TEXT'],
  ['city', 'TEXT'], ['state_name', 'TEXT'], ['country', 'TEXT'], ['pincode', 'TEXT'],
  // Shared org identity
  ['cin', 'TEXT'], ['website', 'TEXT'], ['tan', 'TEXT'],
  // Training Vendor – org details
  ['registration_number', 'TEXT'], ['pan', 'TEXT'], ['gstin', 'TEXT'],
  ['year_established', 'TEXT'], ['head_office', 'TEXT'], ['branch_offices', 'TEXT'],
  // Training Vendor – contact persons
  ['ceo_name', 'TEXT'], ['spoc_name', 'TEXT'], ['ops_head', 'TEXT'],
  ['finance_contact', 'TEXT'], ['placement_officer', 'TEXT'],
  // Training Vendor – bank
  ['bank_account_name', 'TEXT'], ['bank_ifsc', 'TEXT'], ['bank_account_number', 'TEXT'],
  // Training Vendor – infrastructure
  ['training_centres', 'TEXT'], ['centre_photos', 'TEXT'],
];
for (const [col, type] of newCols) {
  if (!existingCols.includes(col)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${col} ${type}`);
  }
}

// ══════════ STATE GOVERNMENT PORTAL TABLES ══════════
db.exec(`
CREATE TABLE IF NOT EXISTS sg_schemes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ministry TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sg_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheme_id INTEGER NOT NULL REFERENCES sg_schemes(id) ON DELETE CASCADE,
  fy TEXT NOT NULL,
  annual_target INTEGER DEFAULT 0,
  q1_target INTEGER DEFAULT 0,
  q2_target INTEGER DEFAULT 0,
  q3_target INTEGER DEFAULT 0,
  q4_target INTEGER DEFAULT 0,
  q1_achieved INTEGER DEFAULT 0,
  q2_achieved INTEGER DEFAULT 0,
  q3_achieved INTEGER DEFAULT 0,
  q4_achieved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(state_user_id, scheme_id, fy)
);

CREATE TABLE IF NOT EXISTS sg_training_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT,
  district TEXT,
  state_name TEXT,
  nsdc_code TEXT,
  email TEXT,
  mobile TEXT,
  scheme TEXT,
  centre_count INTEGER DEFAULT 0,
  trainee_count INTEGER DEFAULT 0,
  accreditation TEXT,
  accreditation_expiry TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','verified','suspended','blacklisted')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sg_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_ref TEXT UNIQUE,
  name TEXT NOT NULL,
  gender TEXT,
  dob TEXT,
  district TEXT,
  state_name TEXT,
  mobile TEXT,
  aadhaar_masked TEXT,
  scheme TEXT,
  course TEXT,
  tp_id INTEGER REFERENCES sg_training_partners(id) ON DELETE SET NULL,
  batch_code TEXT,
  enroll_date TEXT DEFAULT (date('now')),
  assessment_status TEXT DEFAULT 'pending',
  certification_status TEXT DEFAULT 'not-certified',
  placement_status TEXT DEFAULT 'not-placed',
  employer_name TEXT,
  salary INTEGER DEFAULT 0,
  dropout_reason TEXT,
  status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled','in-training','assessed','certified','placed','dropped')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sg_disbursements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tp_id INTEGER REFERENCES sg_training_partners(id) ON DELETE SET NULL,
  scheme TEXT,
  amount REAL NOT NULL,
  tranche TEXT,
  fy TEXT,
  disbursed_date TEXT,
  reference_no TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','disbursed','on-hold')),
  remarks TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sg_grievances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_no TEXT UNIQUE,
  filed_by TEXT,
  filer_type TEXT,
  category TEXT,
  district TEXT,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'open' CHECK(status IN ('open','in-progress','resolved','closed')),
  resolution TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS sg_certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id INTEGER REFERENCES sg_candidates(id) ON DELETE SET NULL,
  cert_no TEXT UNIQUE,
  candidate_name TEXT,
  course TEXT,
  nsqf_level TEXT,
  tp_name TEXT,
  scheme TEXT,
  issued_date TEXT,
  valid_status TEXT DEFAULT 'valid' CHECK(valid_status IN ('valid','revoked','flagged')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sg_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon TEXT DEFAULT '🔵',
  title TEXT NOT NULL,
  message TEXT,
  category TEXT,
  priority TEXT DEFAULT 'normal',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Seed schemes master if empty
const schemeCount = db.prepare('SELECT COUNT(*) c FROM sg_schemes').get().c;
if (schemeCount === 0) {
  const schemes = [
    ['PMKVY','PMKVY 4.0','Ministry of Skill Development & Entrepreneurship','Pradhan Mantri Kaushal Vikas Yojana 4.0'],
    ['DDU-GKY','DDU-GKY','Ministry of Rural Development','Deen Dayal Upadhyaya Grameen Kaushalya Yojana'],
    ['NAPS','NAPS','Ministry of Skill Development & Entrepreneurship','National Apprenticeship Promotion Scheme'],
    ['STATE','State Skill Mission','State Government','State Skill Development Mission'],
    ['CSR','CSR Programs','Various Corporate Houses','Corporate Social Responsibility Skill Programs'],
    ['FEE','Fee-Based Courses','N/A','Self-funded vocational training programs'],
  ];
  const ins = db.prepare('INSERT INTO sg_schemes (code,name,ministry,description) VALUES (?,?,?,?)');
  schemes.forEach(s => ins.run(...s));
}

// ══════════ TRAINER FEATURE TABLES ══════════
db.exec(`
CREATE TABLE IF NOT EXISTS trainer_certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cert_name TEXT NOT NULL,
  issuing_body TEXT NOT NULL,
  year TEXT,
  valid_until TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  status TEXT DEFAULT 'Submitted',
  file_name TEXT,
  file_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  session_date TEXT NOT NULL,
  start_time TEXT,
  duration_hrs REAL,
  venue TEXT,
  mode TEXT DEFAULT 'Classroom',
  status TEXT DEFAULT 'scheduled',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'Final',
  date TEXT NOT NULL,
  duration_hrs REAL,
  total_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 50,
  assessor TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_mock_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  duration_min INTEGER DEFAULT 60,
  questions INTEGER DEFAULT 50,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  batch_targets TEXT DEFAULT 'All',
  file_name TEXT,
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id TEXT,
  category TEXT DEFAULT 'Other',
  priority TEXT DEFAULT 'Medium',
  subject TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'Open',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_grievances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ref_id TEXT,
  grievance_type TEXT DEFAULT 'Other',
  against_whom TEXT,
  details TEXT NOT NULL,
  status TEXT DEFAULT 'Submitted',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS candidate_grievances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'Other',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Submitted',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// ══════════ TRAINER PROFILE TABLES ══════════
db.exec(`
CREATE TABLE IF NOT EXISTS trainer_qualifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  year TEXT,
  score TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_experience (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org TEXT NOT NULL,
  role TEXT NOT NULL,
  from_date TEXT,
  to_date TEXT,
  sector TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainer_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  courses TEXT,
  ssc TEXT,
  nsqf_level TEXT,
  years_exp TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Add scheme_type to batches if not present (safe migration)
try { db.exec(`ALTER TABLE batches ADD COLUMN scheme_type TEXT DEFAULT 'None'`); } catch(e) {}

// Add file_path to trainer_documents if not present (safe migration)
try { db.exec(`ALTER TABLE trainer_documents ADD COLUMN file_path TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE trainer_documents ADD COLUMN file_name TEXT`); } catch(e) {}

// ══════════ NEW TABLES: batches, attendance, placements, certificates ══════════
db.exec(`
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  batch_code TEXT,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  capacity INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK(status IN ('upcoming','active','completed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batch_enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_score INTEGER,
  passed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled','completed','dropped')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(batch_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  present INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(batch_id, candidate_id, date)
);

CREATE TABLE IF NOT EXISTS placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  candidate_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  employer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  ctc REAL DEFAULT 0,
  placement_date TEXT DEFAULT (date('now')),
  status TEXT DEFAULT 'placed' CHECK(status IN ('placed','joined','dropped')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidate_certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL,
  issuer TEXT,
  nsqf_level TEXT DEFAULT 'Level 4',
  issued_date TEXT DEFAULT (date('now')),
  cert_no TEXT UNIQUE,
  status TEXT DEFAULT 'valid' CHECK(status IN ('valid','revoked')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS csr_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity TEXT,
  sub_sector TEXT,
  state_name TEXT,
  district TEXT,
  start_date TEXT,
  end_date TEXT,
  budget INTEGER DEFAULT 0,
  spent INTEGER DEFAULT 0,
  beneficiaries_target INTEGER DEFAULT 0,
  beneficiaries_actual INTEGER DEFAULT 0,
  implementing_agency TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','completed','delayed','cancelled')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS csr_beneficiaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES csr_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('Male','Female','Other')),
  age INTEGER,
  district TEXT,
  state_name TEXT,
  course TEXT,
  batch_code TEXT,
  enroll_date TEXT,
  training_status TEXT DEFAULT 'enrolled' CHECK(training_status IN ('enrolled','in_progress','completed','dropout')),
  placement_status TEXT DEFAULT 'not_placed' CHECK(placement_status IN ('not_placed','placed','self_employed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS csr_disbursements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES csr_projects(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  recipient TEXT,
  purpose TEXT,
  disbursed_date TEXT,
  reference_no TEXT,
  fy TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','disbursed','returned')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS csr_training_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  state_name TEXT,
  district TEXT,
  contact_email TEXT,
  contact_mobile TEXT,
  mou_date TEXT,
  mou_expiry TEXT,
  beneficiaries_trained INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','mou_expired')),
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Seed new tables if empty
function seedNewTables() {
  const batchCount = db.prepare('SELECT COUNT(*) c FROM batches').get().c;
  if (batchCount > 0) return;

  const trainer = db.prepare("SELECT id FROM users WHERE role='trainer' LIMIT 1").get();
  const candidates = db.prepare("SELECT id FROM users WHERE role='candidate'").all();
  const courses = db.prepare('SELECT id, title FROM courses').all();
  const agency = db.prepare("SELECT id FROM users WHERE role='placement_agency' LIMIT 1").get();
  const employer = db.prepare("SELECT id FROM users WHERE role='employer' LIMIT 1").get();

  if (!trainer || candidates.length === 0 || courses.length === 0) return;

  // ── Batches ──
  const insBatch = db.prepare(`INSERT INTO batches (trainer_id,course_id,batch_code,name,start_date,end_date,capacity,status) VALUES (?,?,?,?,?,?,?,?)`);
  const batchData = [
    [trainer.id, courses[0]?.id, 'B2025-01', 'SQL Batch Jan 2025', '2025-01-10', '2025-02-20', 30, 'completed'],
    [trainer.id, courses[1]?.id, 'B2025-02', 'Power BI Batch Feb 2025', '2025-02-15', '2025-03-15', 25, 'completed'],
    [trainer.id, courses[2]?.id, 'B2025-03', 'React Batch Apr 2025', '2025-04-01', '2025-05-30', 20, 'completed'],
    [trainer.id, courses[0]?.id, 'B2026-01', 'SQL Batch Jun 2026', '2026-06-01', '2026-07-15', 30, 'active'],
  ];
  const batchIds = batchData.map(b => insBatch.run(...b).lastInsertRowid);

  // ── Batch Enrollments ──
  const insEnroll = db.prepare(`INSERT OR IGNORE INTO batch_enrollments (batch_id,candidate_id,assessment_score,passed,status) VALUES (?,?,?,?,?)`);
  const scores = [82, 76, 91, 68, 85, 73, 95, 61, 88, 79, 55, 92, 70, 84, 67];
  candidates.forEach((c, i) => {
    batchIds.slice(0, 3).forEach((bid, j) => {
      const score = scores[(i * 3 + j) % scores.length];
      insEnroll.run(bid, c.id, score, score >= 60 ? 1 : 0, 'completed');
    });
    insEnroll.run(batchIds[3], c.id, null, 0, 'enrolled');
  });

  // ── Attendance (last 30 sessions per active batch) ──
  const insAtt = db.prepare(`INSERT OR IGNORE INTO attendance (batch_id,candidate_id,date,present) VALUES (?,?,?,?)`);
  const sessions = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date('2026-07-06');
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) sessions.push(d.toISOString().slice(0, 10));
  }
  candidates.forEach(c => {
    sessions.forEach(date => {
      const present = Math.random() > 0.1 ? 1 : 0;
      insAtt.run(batchIds[3], c.id, date, present);
    });
  });

  // ── Placements ──
  if (agency && employer) {
    const insPlace = db.prepare(`INSERT INTO placements (agency_id,candidate_id,employer_id,job_title,company,location,ctc,placement_date,status) VALUES (?,?,?,?,?,?,?,?,?)`);
    const placementData = [
      ['Junior Data Analyst','TechNova Pvt Ltd','Bengaluru', 480000,'2025-03-15','joined'],
      ['Frontend Developer','Infosys','Hyderabad', 550000,'2025-04-10','joined'],
      ['Business Analyst','Wipro','Mumbai', 520000,'2025-05-01','joined'],
      ['Data Entry Operator','HDFC Bank','Chennai', 320000,'2025-06-01','placed'],
      ['SQL Developer','TCS','Pune', 600000,'2025-07-10','joined'],
      ['React Developer','Capgemini','Bengaluru', 700000,'2025-08-20','joined'],
      ['QA Analyst','HCL','Noida', 450000,'2025-09-05','joined'],
      ['Power BI Analyst','Deloitte','Hyderabad', 650000,'2025-10-12','joined'],
      ['Junior Developer','Accenture','Mumbai', 480000,'2025-11-03','placed'],
      ['Data Analyst','Cognizant','Chennai', 520000,'2026-01-15','joined'],
      ['Web Developer','Mindtree','Bengaluru', 580000,'2026-02-20','joined'],
      ['Business Analyst','IBM','Delhi', 620000,'2026-03-10','dropped'],
      ['Frontend Dev','Mphasis','Pune', 560000,'2026-04-05','joined'],
      ['SQL Analyst','Tech Mahindra','Hyderabad', 490000,'2026-05-18','placed'],
      ['React Developer','Persistent','Nagpur', 640000,'2026-06-01','joined'],
    ];
    candidates.forEach((c, i) => {
      if (i < placementData.length) {
        const [jt, co, loc, ctc, pd, st] = placementData[i];
        insPlace.run(agency.id, c.id, employer.id, jt, co, loc, ctc, pd, st);
      }
    });
  }

  // ── Certificates ──
  const insCert = db.prepare(`INSERT OR IGNORE INTO candidate_certificates (candidate_id,enrollment_id,course_title,issuer,nsqf_level,issued_date,cert_no,status) VALUES (?,?,?,?,?,?,?,?)`);
  const enrollments = db.prepare('SELECT * FROM enrollments').all();
  enrollments.forEach((e, i) => {
    const course = db.prepare('SELECT title,provider FROM courses WHERE id=?').get(e.course_id);
    if (course) {
      try {
        insCert.run(e.candidate_id, e.id, course.title, course.provider, 'Level 4',
          '2025-03-' + String(10 + i).padStart(2,'0'),
          `SNJ-CERT-${String(2025001 + i).padStart(7,'0')}`, 'valid');
      } catch (_) {}
    }
  });
}

seedNewTables();

const _insertLog = db.prepare(
  `INSERT INTO audit_logs (user_id, user_name, user_role, action, entity, entity_id, detail, ip)
   VALUES (@user_id, @user_name, @user_role, @action, @entity, @entity_id, @detail, @ip)`
);

function logAudit({ user, action, entity = null, entityId = null, detail = null, ip = null }) {
  try {
    _insertLog.run({
      user_id:   user?.id   ?? null,
      user_name: user?.name ?? 'System',
      user_role: user?.role ?? null,
      action,
      entity:    entity    ?? null,
      entity_id: entityId  != null ? String(entityId) : null,
      detail:    detail    ?? null,
      ip:        ip        ?? null,
    });
  } catch (_) {}
}

module.exports = { db, logAudit };
