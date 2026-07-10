require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/skillsnjobs' });

async function query(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

async function queryOne(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows[0] || null;
}

async function execute(sql, params) {
  return await pool.query(sql, params);
}

async function logAudit({ user, action, entity = null, entityId = null, detail = null, ip = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, user_role, action, entity, entity_id, detail, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [user?.id ?? null, user?.name ?? 'System', user?.role ?? null, action,
       entity ?? null, entityId != null ? String(entityId) : null, detail ?? null, ip ?? null]
    );
  } catch (_) {}
}

async function initDb() {
  // Create all tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY, user_id INTEGER, user_name TEXT, user_role TEXT,
      action TEXT NOT NULL, entity TEXT, entity_id TEXT, detail TEXT, ip TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('candidate','employer','trainer','admin','placement_agency','csr_org','administrator','state_government','central_government','training_vendor','superadmin')),
      org_name TEXT, location TEXT, bio TEXT, skills TEXT DEFAULT '[]', experience_years REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1, reset_token TEXT, reset_token_expires BIGINT,
      verification_status TEXT DEFAULT 'pending', vendor_profile TEXT,
      first_name TEXT, middle_name TEXT, last_name TEXT, dob TEXT, gender TEXT, phone TEXT, photo TEXT,
      address_line1 TEXT, address_line2 TEXT, city TEXT, state_name TEXT, country TEXT, pincode TEXT,
      category TEXT, qualification TEXT, year_passed TEXT, board TEXT, university TEXT, percentage TEXT,
      employment_status TEXT, interests TEXT, preferred_sector TEXT,
      lang_english TEXT, lang_hindi TEXT, lang_regional TEXT, certificates TEXT, resume TEXT,
      cin TEXT, website TEXT, tan TEXT,
      registration_number TEXT, pan TEXT, gstin TEXT, year_established TEXT,
      head_office TEXT, branch_offices TEXT,
      ceo_name TEXT, spoc_name TEXT, ops_head TEXT, finance_contact TEXT, placement_officer TEXT,
      bank_account_name TEXT, bank_ifsc TEXT, bank_account_number TEXT,
      training_centres TEXT, centre_photos TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY, employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT, required_skills TEXT DEFAULT '[]',
      location TEXT, job_type TEXT DEFAULT 'Full-time', salary_min INTEGER, salary_max INTEGER,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'applied' CHECK(status IN ('applied','shortlisted','interview','rejected','hired')),
      match_score INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(job_id, candidate_id)
    );
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY, trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL, provider TEXT, skill_tags TEXT DEFAULT '[]',
      duration_weeks INTEGER DEFAULT 4, level TEXT DEFAULT 'Beginner', rating REAL DEFAULT 4.5,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled','completed','dropped')),
      created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(course_id, candidate_id)
    );
    CREATE TABLE IF NOT EXISTS org_classifications (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_enabled INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS accreditations (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_enabled INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS geographic_coverage (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_enabled INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS target_beneficiaries (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_enabled INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_centres (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, address TEXT, state_name TEXT, district TEXT, city TEXT, pincode TEXT,
      geo TEXT, classrooms INTEGER DEFAULT 0, labs INTEGER DEFAULT 0, seating_capacity INTEGER DEFAULT 0,
      internet TEXT, power_backup TEXT, accessibility TEXT, equipment TEXT,
      status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_trainers (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      centre_id INTEGER REFERENCES vendor_centres(id) ON DELETE SET NULL,
      name TEXT NOT NULL, email TEXT, mobile TEXT, qualification TEXT, sector TEXT,
      experience_years INTEGER DEFAULT 0, nsqf_level TEXT, certification_doc TEXT,
      status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_courses (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, sector TEXT, qp_code TEXT, nos_code TEXT, nsqf_level TEXT,
      duration_hours INTEGER DEFAULT 0, fee_type TEXT DEFAULT 'fee-based', fee_amount REAL DEFAULT 0,
      scheme TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_batches (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      centre_id INTEGER REFERENCES vendor_centres(id) ON DELETE SET NULL,
      course_id INTEGER REFERENCES vendor_courses(id) ON DELETE SET NULL,
      batch_code TEXT, start_date TEXT, end_date TEXT, capacity INTEGER DEFAULT 30,
      enrolled INTEGER DEFAULT 0, trainer_id INTEGER REFERENCES vendor_trainers(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'upcoming', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_candidates (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES vendor_batches(id) ON DELETE SET NULL,
      name TEXT NOT NULL, mobile TEXT, aadhaar_masked TEXT, dob TEXT, gender TEXT,
      category TEXT, scheme TEXT, enroll_date DATE DEFAULT CURRENT_DATE,
      attendance_pct INTEGER DEFAULT 0, placement_status TEXT DEFAULT 'not-placed',
      status TEXT DEFAULT 'enrolled', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_assessments (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES vendor_batches(id) ON DELETE SET NULL,
      agency TEXT, scheduled_date TEXT, time_slot TEXT, candidate_count INTEGER DEFAULT 0,
      results TEXT, status TEXT DEFAULT 'scheduled', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_documents (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doc_type TEXT NOT NULL, filename TEXT, file_data TEXT, expiry_date TEXT,
      status TEXT DEFAULT 'uploaded', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendor_grievances (
      id SERIAL PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_no TEXT, category TEXT, priority TEXT DEFAULT 'normal', subject TEXT,
      details TEXT, status TEXT DEFAULT 'open', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sg_schemes (
      id SERIAL PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      ministry TEXT, description TEXT, is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sg_targets (
      id SERIAL PRIMARY KEY, state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scheme_id INTEGER NOT NULL REFERENCES sg_schemes(id) ON DELETE CASCADE,
      fy TEXT NOT NULL, annual_target INTEGER DEFAULT 0,
      q1_target INTEGER DEFAULT 0, q2_target INTEGER DEFAULT 0,
      q3_target INTEGER DEFAULT 0, q4_target INTEGER DEFAULT 0,
      q1_achieved INTEGER DEFAULT 0, q2_achieved INTEGER DEFAULT 0,
      q3_achieved INTEGER DEFAULT 0, q4_achieved INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(state_user_id, scheme_id, fy)
    );
    CREATE TABLE IF NOT EXISTS sg_training_partners (
      id SERIAL PRIMARY KEY, state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vendor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL, type TEXT, district TEXT, state_name TEXT, nsdc_code TEXT,
      email TEXT, mobile TEXT, scheme TEXT, centre_count INTEGER DEFAULT 0,
      trainee_count INTEGER DEFAULT 0, accreditation TEXT, accreditation_expiry TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','verified','suspended','blacklisted')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sg_candidates (
      id SERIAL PRIMARY KEY, state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      candidate_ref TEXT UNIQUE, name TEXT NOT NULL, gender TEXT, dob TEXT,
      district TEXT, state_name TEXT, mobile TEXT, aadhaar_masked TEXT,
      scheme TEXT, course TEXT, tp_id INTEGER REFERENCES sg_training_partners(id) ON DELETE SET NULL,
      batch_code TEXT, enroll_date DATE DEFAULT CURRENT_DATE,
      assessment_status TEXT DEFAULT 'pending', certification_status TEXT DEFAULT 'not-certified',
      placement_status TEXT DEFAULT 'not-placed', employer_name TEXT, salary INTEGER DEFAULT 0,
      dropout_reason TEXT,
      status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled','in-training','assessed','certified','placed','dropped')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sg_disbursements (
      id SERIAL PRIMARY KEY, state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tp_id INTEGER REFERENCES sg_training_partners(id) ON DELETE SET NULL,
      scheme TEXT, amount REAL NOT NULL, tranche TEXT, fy TEXT, disbursed_date TEXT,
      reference_no TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','disbursed','on-hold')),
      remarks TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sg_grievances (
      id SERIAL PRIMARY KEY, state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_no TEXT UNIQUE, filed_by TEXT, filer_type TEXT, category TEXT, district TEXT,
      description TEXT, priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      status TEXT DEFAULT 'open' CHECK(status IN ('open','in-progress','resolved','closed')),
      resolution TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), resolved_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS sg_certificates (
      id SERIAL PRIMARY KEY, state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      candidate_id INTEGER REFERENCES sg_candidates(id) ON DELETE SET NULL,
      cert_no TEXT UNIQUE, candidate_name TEXT, course TEXT, nsqf_level TEXT,
      tp_name TEXT, scheme TEXT, issued_date TEXT,
      valid_status TEXT DEFAULT 'valid' CHECK(valid_status IN ('valid','revoked','flagged')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sg_notifications (
      id SERIAL PRIMARY KEY, state_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      icon TEXT DEFAULT '🔵', title TEXT NOT NULL, message TEXT, category TEXT,
      priority TEXT DEFAULT 'normal', is_read INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS batches (
      id SERIAL PRIMARY KEY, trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      batch_code TEXT, name TEXT NOT NULL, start_date TEXT, end_date TEXT,
      capacity INTEGER DEFAULT 30, scheme_type TEXT DEFAULT 'None',
      status TEXT DEFAULT 'active' CHECK(status IN ('upcoming','active','completed')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS batch_enrollments (
      id SERIAL PRIMARY KEY, batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assessment_score INTEGER, passed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled','completed','dropped')),
      created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(batch_id, candidate_id)
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY, batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL, present INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(batch_id, candidate_id, date)
    );
    CREATE TABLE IF NOT EXISTS placements (
      id SERIAL PRIMARY KEY, agency_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      candidate_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      employer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      job_title TEXT NOT NULL, company TEXT NOT NULL, location TEXT,
      ctc REAL DEFAULT 0, placement_date DATE DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'placed' CHECK(status IN ('placed','joined','dropped')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS candidate_certificates (
      id SERIAL PRIMARY KEY, candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
      course_title TEXT NOT NULL, issuer TEXT, nsqf_level TEXT DEFAULT 'Level 4',
      issued_date DATE DEFAULT CURRENT_DATE, cert_no TEXT UNIQUE,
      status TEXT DEFAULT 'valid' CHECK(status IN ('valid','revoked')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS csr_projects (
      id SERIAL PRIMARY KEY, csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, activity TEXT, sub_sector TEXT, state_name TEXT, district TEXT,
      start_date TEXT, end_date TEXT, budget INTEGER DEFAULT 0, spent INTEGER DEFAULT 0,
      beneficiaries_target INTEGER DEFAULT 0, beneficiaries_actual INTEGER DEFAULT 0,
      implementing_agency TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','completed','delayed','cancelled')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS csr_beneficiaries (
      id SERIAL PRIMARY KEY, csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES csr_projects(id) ON DELETE SET NULL,
      name TEXT NOT NULL, gender TEXT CHECK(gender IN ('Male','Female','Other')),
      age INTEGER, district TEXT, state_name TEXT, course TEXT, batch_code TEXT,
      enroll_date TEXT,
      training_status TEXT DEFAULT 'enrolled' CHECK(training_status IN ('enrolled','in_progress','completed','dropout')),
      placement_status TEXT DEFAULT 'not_placed' CHECK(placement_status IN ('not_placed','placed','self_employed')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS csr_disbursements (
      id SERIAL PRIMARY KEY, csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES csr_projects(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL, recipient TEXT, purpose TEXT, disbursed_date TEXT,
      reference_no TEXT, fy TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','disbursed','returned')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS csr_training_partners (
      id SERIAL PRIMARY KEY, csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, type TEXT, state_name TEXT, district TEXT,
      contact_email TEXT, contact_mobile TEXT, mou_date TEXT, mou_expiry TEXT,
      beneficiaries_trained INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','mou_expired')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_certifications (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cert_name TEXT NOT NULL, issuing_body TEXT NOT NULL, year TEXT, valid_until TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_documents (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doc_type TEXT NOT NULL, status TEXT DEFAULT 'Submitted', file_name TEXT, file_path TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_sessions (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      topic TEXT NOT NULL, session_date TEXT NOT NULL, start_time TEXT,
      duration_hrs REAL, venue TEXT, mode TEXT DEFAULT 'Classroom',
      status TEXT DEFAULT 'scheduled', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_assessments (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      type TEXT DEFAULT 'Final', date TEXT NOT NULL, duration_hrs REAL,
      total_marks INTEGER DEFAULT 100, passing_marks INTEGER DEFAULT 50,
      assessor TEXT, status TEXT DEFAULT 'scheduled', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_mock_tests (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
      subject TEXT NOT NULL, date TEXT NOT NULL, duration_min INTEGER DEFAULT 60,
      questions INTEGER DEFAULT 50, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_content (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
      batch_targets TEXT DEFAULT 'All', file_name TEXT, views INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_support_tickets (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_id TEXT, category TEXT DEFAULT 'Other', priority TEXT DEFAULT 'Medium',
      subject TEXT NOT NULL, details TEXT, status TEXT DEFAULT 'Open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_grievances (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ref_id TEXT, grievance_type TEXT DEFAULT 'Other', against_whom TEXT,
      details TEXT NOT NULL, status TEXT DEFAULT 'Submitted', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS candidate_grievances (
      id SERIAL PRIMARY KEY, candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT DEFAULT 'Other', subject TEXT NOT NULL, description TEXT NOT NULL,
      status TEXT DEFAULT 'Submitted', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_qualifications (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      degree TEXT NOT NULL, institution TEXT NOT NULL, year TEXT, score TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_experience (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      org TEXT NOT NULL, role TEXT NOT NULL, from_date TEXT, to_date TEXT, sector TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_skills (
      id SERIAL PRIMARY KEY, trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      domain TEXT NOT NULL, courses TEXT, ssc TEXT, nsqf_level TEXT, years_exp TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed org_classifications
  const ocCount = (await pool.query('SELECT COUNT(*) c FROM org_classifications')).rows[0].c;
  if (parseInt(ocCount) === 0) {
    const defaults = ['Training Partner','NGO','Trust','Society','Company','Polytechnic','ITI',
      'College / University','CSR Foundation','Industry Training Centre',
      'Apprenticeship Provider','Sector Skill Council Partner','Assessment Agency','Placement Agency'];
    for (let i = 0; i < defaults.length; i++) {
      await pool.query('INSERT INTO org_classifications (name,is_enabled,is_system,sort_order) VALUES ($1,1,1,$2) ON CONFLICT(name) DO NOTHING', [defaults[i], i+1]);
    }
  }

  // Seed accreditations
  const acCount = (await pool.query('SELECT COUNT(*) c FROM accreditations')).rows[0].c;
  if (parseInt(acCount) === 0) {
    const defaults = ['NSDC Affiliation','Sector Skill Council Affiliation','State Skill Mission Empanelment',
      'DDU-GKY PIA','PMKVY Partner','Apprenticeship Registration','ISO Certification','NABL / NABCB','Other Recognitions'];
    for (let i = 0; i < defaults.length; i++) {
      await pool.query('INSERT INTO accreditations (name,is_enabled,is_system,sort_order) VALUES ($1,1,1,$2) ON CONFLICT(name) DO NOTHING', [defaults[i], i+1]);
    }
  }

  // Seed geographic_coverage
  const gcCount = (await pool.query('SELECT COUNT(*) c FROM geographic_coverage')).rows[0].c;
  if (parseInt(gcCount) === 0) {
    const defaults = ['States of Operation','Districts of Operation','Aspirational District Experience',
      'Rural Coverage','Urban Coverage','Remote / Tribal Area Experience'];
    for (let i = 0; i < defaults.length; i++) {
      await pool.query('INSERT INTO geographic_coverage (name,is_enabled,is_system,sort_order) VALUES ($1,1,1,$2) ON CONFLICT(name) DO NOTHING', [defaults[i], i+1]);
    }
  }

  // Seed target_beneficiaries
  const tbCount = (await pool.query('SELECT COUNT(*) c FROM target_beneficiaries')).rows[0].c;
  if (parseInt(tbCount) === 0) {
    const defaults = ['Women','Youth','SC','ST','OBC','Minorities','Persons with Disabilities',
      'School Dropouts','College Students','Rural Youth','Urban Poor','Migrant Workers',
      'Ex-Servicemen','Prison Inmates','Senior Citizens'];
    for (let i = 0; i < defaults.length; i++) {
      await pool.query('INSERT INTO target_beneficiaries (name,is_enabled,is_system,sort_order) VALUES ($1,1,1,$2) ON CONFLICT(name) DO NOTHING', [defaults[i], i+1]);
    }
  }

  // Seed sg_schemes
  const schemeCount = (await pool.query('SELECT COUNT(*) c FROM sg_schemes')).rows[0].c;
  if (parseInt(schemeCount) === 0) {
    const schemes = [
      ['PMKVY','PMKVY 4.0','Ministry of Skill Development & Entrepreneurship','Pradhan Mantri Kaushal Vikas Yojana 4.0'],
      ['DDU-GKY','DDU-GKY','Ministry of Rural Development','Deen Dayal Upadhyaya Grameen Kaushalya Yojana'],
      ['NAPS','NAPS','Ministry of Skill Development & Entrepreneurship','National Apprenticeship Promotion Scheme'],
      ['STATE','State Skill Mission','State Government','State Skill Development Mission'],
      ['CSR','CSR Programs','Various Corporate Houses','Corporate Social Responsibility Skill Programs'],
      ['FEE','Fee-Based Courses','N/A','Self-funded vocational training programs'],
    ];
    for (const s of schemes) {
      await pool.query('INSERT INTO sg_schemes (code,name,ministry,description) VALUES ($1,$2,$3,$4) ON CONFLICT(code) DO NOTHING', s);
    }
  }

  // Seed users
  const userCount = (await pool.query('SELECT COUNT(*) c FROM users')).rows[0].c;
  if (parseInt(userCount) === 0) {
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    const users = [
      ['Admin User','admin@skillsnjobs.in',hash('password123'),'admin'],
      ['Aisha Khan','aisha@example.com',hash('password123'),'candidate'],
      ['Rahul Verma','rahul@example.com',hash('password123'),'candidate'],
      ['TechNova Pvt Ltd','hr@technova.com',hash('password123'),'employer'],
      ['Skillbridge Academy','trainer@skillbridge.in',hash('password123'),'trainer'],
      ['Super Admin','superadmin@skillsnjobs.in',hash('Welcome@123'),'superadmin'],
      ['State Admin','stateadmin@skillsnjobs.in',hash('Welcome@123'),'state_government'],
      ['Pioneer Placements','pioneer@placements.in',hash('password123'),'placement_agency'],
      ['Cipla Foundation','csr@cipla.com',hash('password123'),'csr_org'],
      ['NetApp Training','netapp@gmail.com',hash('Welcome@123'),'training_vendor'],
    ];
    for (const [name, email, password_hash, role] of users) {
      await pool.query(
        'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING',
        [name, email, password_hash, role]
      );
    }
  }

  console.log('Database initialized');
}

module.exports = { pool, query, queryOne, execute, logAudit, initDb };
