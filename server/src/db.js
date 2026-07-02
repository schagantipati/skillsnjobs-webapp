const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'skillsnjobs.db');
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

// Migrations — safe to run on every startup
try { db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN reset_token TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN reset_token_expires INTEGER`); } catch {}

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

seedIfEmpty();

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
