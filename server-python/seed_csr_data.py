"""
CSR Organization Portal — comprehensive seed data.
Populates: training partners (with MoU), helpdesk tickets, grievances,
           audit logs, campaigns, CSR-2 form, org obligation, and field audits.

Run: python3 seed_csr_data.py
"""
import asyncio
import asyncpg
import json
from datetime import date, datetime

DB_URL = "postgresql://localhost:5432/skillsnjobs"


async def run():
    pool = await asyncpg.create_pool(DB_URL)
    async with pool.acquire() as c:
        print("=== Seeding CSR Organization Portal data ===\n")

        # Resolve CSR user IDs (same as seed_all_portals.py)
        csr_users = await c.fetch(
            "SELECT id, email, org_name FROM users WHERE role='csr_org' ORDER BY id LIMIT 5"
        )
        if not csr_users:
            print("ERROR: No csr_org users found. Run seed_all_portals.py first.")
            return

        csr_ids = [r["id"] for r in csr_users]
        print(f"Found CSR users: {[(r['id'], r['email']) for r in csr_users]}")

        def csi(n):
            return csr_ids[n] if len(csr_ids) > n else csr_ids[0]

        # Helper: get project ids for a CSR user
        async def get_proj_ids(csr_uid):
            rows = await c.fetch("SELECT id FROM csr_projects WHERE csr_user_id=$1 ORDER BY id", csr_uid)
            return [r["id"] for r in rows]

        # ── 1. Set CSR Obligation on user profile ──────────────────
        print("\n1. Setting CSR obligation on org profiles...")
        try:
            await c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS csr_obligation BIGINT DEFAULT 0")
        except Exception:
            pass

        obligations = [
            (csi(0), 16000000),   # ₹1.6 Cr
            (csi(1), 8500000),    # ₹85 L
        ]
        for uid, obligation in obligations:
            await c.execute(
                "UPDATE users SET csr_obligation=$1 WHERE id=$2",
                obligation, uid
            )
            print(f"   User {uid}: obligation = ₹{obligation:,}")

        # ── 2. CSR Training Partners (CSR-Added Partners) ─────────
        print("\n2. CSR training partners...")
        await c.execute("""
            CREATE TABLE IF NOT EXISTS csr_training_partners (
                id SERIAL PRIMARY KEY,
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
                status TEXT DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        try:
            await c.execute("ALTER TABLE csr_training_partners ADD COLUMN IF NOT EXISTS nsdc_reg TEXT")
            await c.execute("ALTER TABLE csr_training_partners ADD COLUMN IF NOT EXISTS contact_person TEXT")
            await c.execute("ALTER TABLE csr_training_partners ADD COLUMN IF NOT EXISTS num_trainers INTEGER DEFAULT 0")
            await c.execute("ALTER TABLE csr_training_partners ADD COLUMN IF NOT EXISTS max_batch_size INTEGER DEFAULT 30")
        except Exception:
            pass

        partners = [
            # (csr_uid, name, type, state, district, email, mobile, mou_date, mou_expiry, trained, status, nsdc_reg, contact_person)
            (csi(0), "SkillBridge Institute Pvt Ltd", "Private ITC", "Maharashtra", "Pune",
             "admin@skillbridge.in", "9876543210", "2025-04-01", "2027-03-31", 120, "active",
             "NSDC-MH-2024-001", "Rahul Joshi"),
            (csi(0), "GreenSkills Foundation", "NGO", "Maharashtra", "Nashik",
             "contact@greenskills.org", "9876543211", "2025-06-15", "2027-06-14", 85, "active",
             "NSDC-MH-2024-002", "Sunita Patil"),
            (csi(0), "Digital Academy India", "Private ITC", "Maharashtra", "Mumbai",
             "hr@digitalacademy.in", "9876543212", "2024-10-01", "2025-09-30", 200, "mou_expired",
             "NSDC-MH-2023-009", "Ankit Shah"),
            (csi(1), "RuralSkill Cooperative", "Cooperative", "Tamil Nadu", "Coimbatore",
             "info@ruralskill.coop", "9876543213", "2025-03-01", "2027-02-28", 60, "active",
             "NSDC-TN-2025-003", "Kavitha Rajan"),
            (csi(1), "TechVoc Institute", "Private ITC", "Tamil Nadu", "Chennai",
             "admin@techvoc.in", "9876543214", "2025-07-01", "2027-06-30", 45, "active",
             "NSDC-TN-2025-004", "Selvam Kumar"),
        ]
        tp_count = 0
        for (uid, name, tp_type, state, dist, email, mobile, mou_date, mou_expiry,
             trained, status, nsdc_reg, contact_person) in partners:
            ex = await c.fetchrow(
                "SELECT id FROM csr_training_partners WHERE csr_user_id=$1 AND name=$2",
                uid, name
            )
            if not ex:
                await c.execute(
                    """INSERT INTO csr_training_partners
                       (csr_user_id,name,type,state_name,district,contact_email,contact_mobile,
                        mou_date,mou_expiry,beneficiaries_trained,status,nsdc_reg,contact_person)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
                    uid, name, tp_type, state, dist, email, mobile,
                    mou_date, mou_expiry, trained, status, nsdc_reg, contact_person
                )
                tp_count += 1
                print(f"   + Partner: {name}")
        print(f"   {tp_count} new training partners added")

        # ── 3. CSR Helpdesk Tickets ────────────────────────────────
        print("\n3. CSR helpdesk tickets...")
        await c.execute("""
            CREATE TABLE IF NOT EXISTS csr_tickets (
                id SERIAL PRIMARY KEY,
                csr_user_id INTEGER NOT NULL,
                category TEXT,
                priority TEXT DEFAULT 'Medium',
                subject TEXT,
                description TEXT,
                status TEXT DEFAULT 'open',
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        tickets = [
            (csi(0), "CSR Registration", "High",
             "Unable to upload CSR-1 document",
             "Getting an error when uploading Form CSR-1 PDF. File size is 2MB under the 5MB limit.",
             "in_progress", datetime(2026, 4, 10)),
            (csi(0), "Fund Transfer", "Medium",
             "Unspent fund transfer confirmation not received",
             "We transferred unspent FY 2024-25 CSR funds to PM CARES on Sep 28, 2025. No acknowledgement received.",
             "resolved", datetime(2026, 3, 15)),
            (csi(0), "Project Approval", "Low",
             "Approval status not updating for draft project",
             "The project 'Healthcare Worker Upskilling' shows draft even after submission 3 days ago.",
             "open", datetime(2026, 7, 1)),
            (csi(1), "Compliance Query", "High",
             "CSR-2 filing deadline clarification",
             "Need clarification on whether CSR-2 for FY 2025-26 can be filed with FY 2026-27 Annual Return.",
             "resolved", datetime(2026, 5, 20)),
            (csi(1), "Technical Issue", "Medium",
             "Dashboard KPI numbers not matching disbursements",
             "Dashboard shows ₹29L total spent but disbursements list totals ₹35L. Data mismatch.",
             "in_progress", datetime(2026, 6, 5)),
        ]
        tk_count = 0
        for (uid, category, priority, subject, description, status, created) in tickets:
            ex = await c.fetchrow(
                "SELECT id FROM csr_tickets WHERE csr_user_id=$1 AND subject=$2",
                uid, subject
            )
            if not ex:
                await c.execute(
                    """INSERT INTO csr_tickets
                       (csr_user_id,category,priority,subject,description,status,created_at)
                       VALUES ($1,$2,$3,$4,$5,$6,$7)""",
                    uid, category, priority, subject, description, status, created
                )
                tk_count += 1
        print(f"   {tk_count} tickets added")

        # ── 4. CSR Grievances ──────────────────────────────────────
        print("\n4. CSR grievances...")
        await c.execute("""
            CREATE TABLE IF NOT EXISTS csr_grievances (
                id SERIAL PRIMARY KEY,
                csr_user_id INTEGER NOT NULL,
                type TEXT,
                against TEXT,
                description TEXT,
                status TEXT DEFAULT 'submitted',
                resolution TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        grievances = [
            (csi(0), "Fund Disbursement Delay",
             "State Nodal Agency — Maharashtra",
             "Disbursement request CSR-DISB-002 submitted on 2026-04-15 was approved but funds not credited after 45 days. Following up since May 30, 2026.",
             "under_review", None, datetime(2026, 6, 1)),
            (csi(0), "Training Partner Issue",
             "Digital Academy India",
             "Partner failed to deliver 80 out of 200 committed training seats in the last quarter and has not responded to communications.",
             "resolved", "Partner's MoU has been terminated and replacement partner empanelled.", datetime(2026, 5, 10)),
            (csi(1), "Project Approval Delay",
             "State Skill Mission — Tamil Nadu",
             "Project 'Sewing Machine Operator Training' submitted for state-level approval 60 days ago with no response or escalation.",
             "submitted", None, datetime(2026, 7, 5)),
        ]
        gr_count = 0
        for (uid, grv_type, against, description, status, resolution, created) in grievances:
            ex = await c.fetchrow(
                "SELECT id FROM csr_grievances WHERE csr_user_id=$1 AND against=$2",
                uid, against
            )
            if not ex:
                await c.execute(
                    """INSERT INTO csr_grievances
                       (csr_user_id,type,against,description,status,resolution,created_at)
                       VALUES ($1,$2,$3,$4,$5,$6,$7)""",
                    uid, grv_type, against, description, status, resolution, created
                )
                gr_count += 1
        print(f"   {gr_count} grievances added")

        # ── 5. Audit Logs (CSR actions) ────────────────────────────
        print("\n5. CSR audit log entries...")
        try:
            await c.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INT,
                    user_name TEXT,
                    role TEXT,
                    action TEXT NOT NULL,
                    entity TEXT,
                    entity_id TEXT,
                    detail TEXT,
                    ip TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
        except Exception:
            pass

        # Resolve CSR user names
        user_names = {r["id"]: r.get("name", "CSR User") for r in
                      await c.fetch("SELECT id, name FROM users WHERE id = ANY($1::int[])", csr_ids)}

        proj_ids_0 = await get_proj_ids(csi(0))
        proj_ids_1 = await get_proj_ids(csi(1))

        audit_entries = [
            (csi(0), user_names.get(csi(0), "CSR User"), "csr_org",
             "Project Created", "csr_projects",
             str(proj_ids_0[0]) if proj_ids_0 else "1",
             "Created project: Digital Literacy for Rural Women", "2026-04-01T09:00:00"),
            (csi(0), user_names.get(csi(0), "CSR User"), "csr_org",
             "Disbursement Initiated", "csr_disbursements", "CSR-DISB-001",
             "Initiated disbursement of Rs 6,00,000 to Navjeevan Skill Centre", "2026-04-15T10:30:00"),
            (csi(0), user_names.get(csi(0), "CSR User"), "csr_org",
             "Disbursement Initiated", "csr_disbursements", "CSR-DISB-002",
             "Initiated second tranche Rs 6,00,000 to Navjeevan Skill Centre", "2026-06-30T11:00:00"),
            (csi(0), user_names.get(csi(0), "CSR User"), "csr_org",
             "Training Partner Added", "csr_training_partners", "SkillBridge Institute",
             "Empanelled SkillBridge Institute Pvt Ltd with MoU signed", "2025-04-02T14:00:00"),
            (csi(0), user_names.get(csi(0), "CSR User"), "csr_org",
             "Project Status Updated", "csr_projects",
             str(proj_ids_0[1]) if len(proj_ids_0) > 1 else "2",
             "Project marked as completed: Solar Technician Training Vidarbha", "2026-06-30T16:00:00"),
            (csi(0), user_names.get(csi(0), "CSR User"), "csr_org",
             "Beneficiary Enrolled", "csr_beneficiaries", "DL-2026-001",
             "Enrolled beneficiary: Lata Shinde in Digital Literacy batch", "2026-04-10T09:30:00"),
            (csi(0), user_names.get(csi(0), "CSR User"), "csr_org",
             "CSR Form Saved", "csr_forms", "CSR-2-FY2025-26",
             "Saved CSR-2 draft for FY 2025-26", "2026-06-01T15:00:00"),
            (csi(1), user_names.get(csi(1), "CSR User"), "csr_org",
             "Disbursement Initiated", "csr_disbursements", "CSR-DISB-004",
             "Initiated Rs 5,00,000 to Meena Tailoring Coop", "2026-03-20T10:00:00"),
            (csi(1), user_names.get(csi(1), "CSR User"), "csr_org",
             "Project Created", "csr_projects",
             str(proj_ids_1[0]) if proj_ids_1 else "4",
             "Created project: Sewing Machine Operator Training", "2026-02-28T09:00:00"),
            (csi(1), user_names.get(csi(1), "CSR User"), "csr_org",
             "Training Partner Added", "csr_training_partners", "RuralSkill Cooperative",
             "Empanelled RuralSkill Cooperative with MoU", "2025-03-02T11:00:00"),
        ]

        al_count = 0
        for (uid, uname, role, action, entity, entity_id, detail, created) in audit_entries:
            ex = await c.fetchrow(
                "SELECT id FROM audit_logs WHERE user_id=$1 AND action=$2 AND entity_id=$3",
                uid, action, entity_id
            )
            if not ex:
                await c.execute(
                    """INSERT INTO audit_logs
                       (user_id,user_name,user_role,action,entity,entity_id,detail,ip,created_at)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,'192.168.1.1',$8)""",
                    uid, uname, role, action, entity, entity_id, detail, created
                )
                al_count += 1
        print(f"   {al_count} audit log entries added")

        # ── 6. CSR Campaigns ──────────────────────────────────────
        print("\n6. CSR campaigns...")
        try:
            await c.execute("""
                CREATE TABLE IF NOT EXISTS csr_campaigns (
                    id SERIAL PRIMARY KEY,
                    csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    theme TEXT,
                    description TEXT,
                    total_budget BIGINT DEFAULT 0,
                    financial_year TEXT DEFAULT '2025-26',
                    target_states TEXT,
                    open_date TEXT,
                    close_date TEXT,
                    eligibility_criteria TEXT,
                    status TEXT DEFAULT 'draft',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
        except Exception:
            pass

        campaigns = [
            (csi(0), "Skill India Digital Literacy Drive 2026",
             "Skill Development",
             "Training 1,000 rural women in digital literacy, mobile banking, and e-governance services across Maharashtra.",
             5000000, "2025-26", "Maharashtra", "2026-04-01", "2026-09-30",
             "NGO / ITC with NSDC affiliation, min 3 years experience in digital literacy",
             "active"),
            (csi(0), "Green Jobs — Solar & EV Technician Initiative",
             "Skill Development",
             "Skilling 500 youth in solar panel installation and EV servicing for the green economy transition.",
             3500000, "2026-27", "Maharashtra, Gujarat", "2026-07-01", "2026-12-31",
             "NSQF Level 4+ certified training centres with green technology infrastructure",
             "draft"),
            (csi(1), "Women Empowerment through Vocational Skills",
             "Skill Development",
             "Empowering 300 underprivileged women in Coimbatore and Chennai with income-generating vocational skills.",
             2500000, "2025-26", "Tamil Nadu", "2026-03-01", "2026-08-31",
             "Women-focused NGOs with prior CSR project experience, registered under Section 8",
             "closed"),
        ]
        camp_count = 0
        for (uid, title, theme, desc, budget, fy, states, open_d, close_d, eligibility, status) in campaigns:
            ex = await c.fetchrow(
                "SELECT id FROM csr_campaigns WHERE csr_user_id=$1 AND title=$2",
                uid, title
            )
            if not ex:
                await c.execute(
                    """INSERT INTO csr_campaigns
                       (csr_user_id,title,theme,description,total_budget,financial_year,
                        target_states,open_date,close_date,eligibility_criteria,status)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
                    uid, title, theme, desc, budget, fy, states, open_d, close_d, eligibility, status
                )
                camp_count += 1
                print(f"   + Campaign: {title[:55]}")
        print(f"   {camp_count} campaigns added")

        # ── 7. CSR-2 Form Data ─────────────────────────────────────
        print("\n7. CSR-2 form (draft) data...")
        try:
            await c.execute("""
                CREATE TABLE IF NOT EXISTS csr_forms (
                    id SERIAL PRIMARY KEY,
                    csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    form_type TEXT NOT NULL,
                    financial_year TEXT NOT NULL,
                    data JSONB,
                    status TEXT DEFAULT 'draft',
                    submitted_at TIMESTAMPTZ,
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(csr_user_id, form_type, financial_year)
                )
            """)
        except Exception:
            pass

        csr2_data = {
            "cin": "L27100MH1986PLC040126",
            "company_name": "Tata Power Community Development Trust",
            "registered_office": "C-Block, Bombay House, 24 Homi Mody St, Fort, Mumbai 400001",
            "avg_net_profit": "800000000",
            "csr_obligation": "16000000",
            "board_approval_date": "2026-03-28",
            "amount_spent_own": "5200000",
            "amount_spent_implementing_agency": "8800000",
            "amount_transferred_unspent": "2000000",
            "transfer_account_name": "Unspent CSR Account — HDFC Bank MH09",
            "transfer_date": "2026-04-29",
            "csr_committee_composition": "1. Arun Kapoor (Managing Trustee, Chairman)\n2. Priya Deshpande (Independent Director)\n3. Nitin Verma (CFO)",
            "activities_undertaken": "Skill Development (Clause vii): Digital Literacy, Solar Technician, Healthcare Worker training across 3 districts in Maharashtra",
            "ongoing_projects": "Healthcare Worker Upskilling — expected completion March 2027",
            "reason_shortfall": "",
            "impact_assessment": "500 women trained in digital literacy; 200 youth certified as Solar Technicians with 85% placement rate; 300 GDA workers upskilled",
            "ceo_name": "Arun Kapoor",
            "ceo_designation": "Managing Trustee",
            "cfo_name": "Nitin Verma",
            "cfo_designation": "Chief Financial Officer",
        }

        ex = await c.fetchrow(
            "SELECT id FROM csr_forms WHERE csr_user_id=$1 AND form_type=$2 AND financial_year=$3",
            csi(0), "CSR-2", "2025-26"
        )
        if not ex:
            await c.execute(
                """INSERT INTO csr_forms (csr_user_id,form_type,financial_year,data,status)
                   VALUES ($1,'CSR-2','2025-26',$2,'draft')""",
                csi(0), json.dumps(csr2_data)
            )
            print("   CSR-2 draft saved for user 0")
        else:
            print("   CSR-2 already exists for user 0")

        # ── 8. CSR Field Audits ────────────────────────────────────
        print("\n8. CSR field audits...")
        try:
            await c.execute("""
                CREATE TABLE IF NOT EXISTS csr_field_audits (
                    id SERIAL PRIMARY KEY,
                    csr_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    project_id INTEGER REFERENCES csr_projects(id) ON DELETE SET NULL,
                    audit_date TEXT,
                    auditor TEXT,
                    location TEXT,
                    findings TEXT,
                    score INTEGER,
                    status TEXT DEFAULT 'completed',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
        except Exception:
            pass

        p0 = proj_ids_0[0] if proj_ids_0 else None
        p1 = proj_ids_0[1] if len(proj_ids_0) > 1 else None
        field_audits = [
            (csi(0), p0, "2026-05-20", "Rajesh Kumar (NSDC Auditor)",
             "Nashik, Maharashtra",
             "Training infrastructure adequate. 92% attendance maintained. Practical labs well-equipped. Minor: some attendance registers not digitized.",
             88, "completed"),
            (csi(0), p1, "2026-06-15", "Sunita Agarwal (NSDC Auditor)",
             "Amravati, Maharashtra",
             "Project completed successfully. All 200 trainees certified. 170 placed. Excellent industry linkage with solar firms.",
             95, "completed"),
        ]
        fa_count = 0
        for (uid, pid, audit_date, auditor, loc, findings, score, status) in field_audits:
            if pid is None:
                continue
            ex = await c.fetchrow(
                "SELECT id FROM csr_field_audits WHERE csr_user_id=$1 AND visit_date=$2",
                uid, audit_date
            )
            if not ex:
                try:
                    await c.execute(
                        """INSERT INTO csr_field_audits
                           (csr_user_id,project_id,visit_date,auditor,location,findings,score,status)
                           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
                        uid, pid, audit_date, auditor, loc, findings, score, status
                    )
                except Exception as e:
                    print(f"   Warning: field audit insert skipped ({e})")
                fa_count += 1
        print(f"   {fa_count} field audits added")

        print("\n=== CSR seed data complete ===")
        print("\nSummary:")
        for csr_uid in csr_ids:
            proj_c = await c.fetchval("SELECT COUNT(*) FROM csr_projects WHERE csr_user_id=$1", csr_uid)
            tp_c = await c.fetchval("SELECT COUNT(*) FROM csr_training_partners WHERE csr_user_id=$1", csr_uid)
            tk_c = await c.fetchval("SELECT COUNT(*) FROM csr_tickets WHERE csr_user_id=$1", csr_uid)
            gr_c = await c.fetchval("SELECT COUNT(*) FROM csr_grievances WHERE csr_user_id=$1", csr_uid)
            al_c = await c.fetchval("SELECT COUNT(*) FROM audit_logs WHERE user_id=$1", csr_uid)
            print(f"  User {csr_uid}: {proj_c} projects, {tp_c} partners, {tk_c} tickets, {gr_c} grievances, {al_c} audit logs")

    await pool.close()


if __name__ == "__main__":
    asyncio.run(run())
