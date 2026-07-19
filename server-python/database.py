from __future__ import annotations
import asyncpg
import json
import os
from dotenv import load_dotenv

load_dotenv()

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=os.getenv("DATABASE_URL", "postgresql://localhost:5432/skillsnjobs"),
            min_size=2,
            max_size=10,
        )
    return _pool


async def query(sql: str, params: list = None) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *(params or []))
        return [dict(r) for r in rows]


async def query_one(sql: str, params: list = None) -> dict | None:
    rows = await query(sql, params)
    return rows[0] if rows else None


async def execute(sql: str, params: list = None) -> str:
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(sql, *(params or []))


async def execute_returning(sql: str, params: list = None) -> dict | None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *(params or []))
        return dict(row) if row else None


async def log_audit(user, action: str, entity: str = None, entity_id=None, detail: str = None, ip: str = None):
    try:
        await execute(
            """INSERT INTO audit_logs (user_id, user_name, role, action, entity, entity_id, detail, ip)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
            [
                user["id"] if user else None,
                user["name"] if user else None,
                user["role"] if user else None,
                action, entity, str(entity_id) if entity_id else None,
                detail, ip,
            ],
        )
    except Exception:
        pass


async def init_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Run column migrations (add missing columns if not exist)
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires BIGINT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_pref JSONB",
            """CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INT, user_name TEXT, role TEXT,
                action TEXT NOT NULL, entity TEXT, entity_id TEXT,
                detail TEXT, ip TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS role_permissions (
                role TEXT NOT NULL,
                menu_key TEXT NOT NULL,
                enabled BOOLEAN NOT NULL DEFAULT TRUE,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (role, menu_key)
            )""",
            """CREATE TABLE IF NOT EXISTS saved_jobs (
                id SERIAL PRIMARY KEY,
                candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                saved_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(candidate_id, job_id)
            )""",
            """CREATE TABLE IF NOT EXISTS job_alerts (
                id SERIAL PRIMARY KEY,
                candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                preferred_role TEXT,
                preferred_sector TEXT,
                preferred_location TEXT,
                frequency TEXT DEFAULT 'Daily',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(candidate_id)
            )""",
            """CREATE TABLE IF NOT EXISTS candidate_notifications (
                id SERIAL PRIMARY KEY,
                candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS candidate_resumes (
                id SERIAL PRIMARY KEY,
                candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                version INT DEFAULT 1,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS org_classifications (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                is_enabled INTEGER DEFAULT 1,
                is_system INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            # CSR profile fields
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS designation TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'Current'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_branch TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_net_profit BIGINT DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS csr_obligation BIGINT DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS csr_total_spend BIGINT DEFAULT 0",
            # CSR project extra fields
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS objectives TEXT",
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS target_states TEXT",
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS own_contribution BIGINT DEFAULT 0",
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS other_sources BIGINT DEFAULT 0",
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS agency_type TEXT",
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS mou_signed TEXT",
            # CSR beneficiary extra fields
            "ALTER TABLE csr_beneficiaries ADD COLUMN IF NOT EXISTS dob TEXT",
            "ALTER TABLE csr_beneficiaries ADD COLUMN IF NOT EXISTS aadhaar TEXT",
            "ALTER TABLE csr_beneficiaries ADD COLUMN IF NOT EXISTS mobile TEXT",
            "ALTER TABLE csr_beneficiaries ADD COLUMN IF NOT EXISTS email TEXT",
            "ALTER TABLE csr_beneficiaries ADD COLUMN IF NOT EXISTS category TEXT",
            # CSR disbursement extra fields
            "ALTER TABLE csr_disbursements ADD COLUMN IF NOT EXISTS mode TEXT",
            # CSR unspent funds table
            """CREATE TABLE IF NOT EXISTS csr_unspent_funds (
                id SERIAL PRIMARY KEY,
                csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                financial_year TEXT NOT NULL,
                unspent_amount BIGINT NOT NULL DEFAULT 0,
                reason TEXT,
                transfer_deadline TEXT,
                transfer_destination TEXT,
                remediation_plan TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS csr_campaigns (
                id SERIAL PRIMARY KEY,
                csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                theme TEXT NOT NULL,
                description TEXT,
                total_budget BIGINT DEFAULT 0,
                financial_year TEXT,
                target_states TEXT,
                open_date TEXT,
                close_date TEXT,
                eligibility_criteria TEXT,
                status TEXT DEFAULT 'draft',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS csr_applications (
                id SERIAL PRIMARY KEY,
                campaign_id INTEGER NOT NULL REFERENCES csr_campaigns(id) ON DELETE CASCADE,
                csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                org_name TEXT NOT NULL,
                reg_no TEXT,
                contact_person TEXT,
                email TEXT,
                phone TEXT,
                proposed_budget BIGINT DEFAULT 0,
                project_title TEXT,
                proposal_summary TEXT,
                target_beneficiaries INTEGER DEFAULT 0,
                target_states TEXT,
                ai_score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'submitted',
                rejection_reason TEXT,
                submitted_at TIMESTAMPTZ DEFAULT NOW(),
                reviewed_at TIMESTAMPTZ,
                reviewed_by INTEGER REFERENCES users(id)
            )""",
            """CREATE TABLE IF NOT EXISTS csr_approvals (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL REFERENCES csr_applications(id) ON DELETE CASCADE,
                stage TEXT NOT NULL,
                reviewer_id INTEGER REFERENCES users(id),
                decision TEXT DEFAULT 'pending',
                remarks TEXT,
                decided_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            """CREATE TABLE IF NOT EXISTS csr_progress_reports (
                id SERIAL PRIMARY KEY,
                project_id INTEGER NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
                csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                report_month TEXT NOT NULL,
                bene_count INTEGER DEFAULT 0,
                spend_amount BIGINT DEFAULT 0,
                train_pct INTEGER DEFAULT 0,
                issues TEXT,
                highlights TEXT,
                status TEXT DEFAULT 'submitted',
                submitted_at TIMESTAMPTZ DEFAULT NOW(),
                acknowledged_by INTEGER REFERENCES users(id),
                ack_at TIMESTAMPTZ
            )""",
            """CREATE TABLE IF NOT EXISTS csr_field_audits (
                id SERIAL PRIMARY KEY,
                project_id INTEGER NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
                csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                auditor_name TEXT,
                visit_date TEXT,
                location TEXT,
                bene_verified INTEGER DEFAULT 0,
                funds_verified BIGINT DEFAULT 0,
                compliance_score INTEGER DEFAULT 0,
                findings TEXT,
                recommendations TEXT,
                status TEXT DEFAULT 'scheduled',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )""",
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES csr_campaigns(id)",
            "ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS application_id INTEGER REFERENCES csr_applications(id)",
            """CREATE TABLE IF NOT EXISTS csr_forms (
                id SERIAL PRIMARY KEY,
                csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                form_type TEXT NOT NULL,
                financial_year TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                status TEXT DEFAULT 'draft',
                submitted_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(csr_user_id, form_type, financial_year)
            )""",
        ]
        for sql in migrations:
            try:
                await conn.execute(sql)
            except Exception as e:
                print(f"Migration warning: {e}")

    print("Database initialized")
