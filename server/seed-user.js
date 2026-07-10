// Run once after PostgreSQL is set up: node seed-user.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/skillsnjobs' });

async function main() {
  const hash = bcrypt.hashSync('Welcome@123', 10);
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
     RETURNING id, email, role`,
    ['NetApp Training', 'netapp@gmail.com', hash, 'training_vendor']
  );
  console.log('User ready:', res.rows[0]);
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
