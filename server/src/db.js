const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'skillsnjobs.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('candidate','employer','trainer','admin')),
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
    { name: 'Skillbridge Academy', email: 'trainer@skillbridge.in', password_hash: hash('password123'), role: 'trainer', org_name: 'Skillbridge Academy', location: 'Pune', bio: 'NSDC-approved training partner', skills: '[]', experience_years: 0 }
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

seedIfEmpty();

module.exports = db;
