"""
Seed realistic test data for Candidate Portal (Aisha Khan, id=2)
Data flows from: Employer Portal, Training Vendor, Trainer, Placement Agency, State Govt
Run: python3 seed_candidate_data.py
"""
import asyncio, asyncpg, json

CANDIDATE_ID = 2
EMPLOYER_ID  = 4
VENDOR_ID    = 11
TRAINER_ID   = 5
AGENCY_ID    = 9

async def main():
    conn = await asyncpg.connect('postgresql://localhost/skillsnjobs')
    print("Connected. Seeding data for Aisha Khan (id=2)...")

    # 1. More employers
    print("\n[1] Employers & jobs...")
    for uid, name, email, org in [
        (100, 'Infosys Ltd',        'hr@infosys.in',   'Infosys Ltd'),
        (101, 'Wipro Technologies', 'hr@wipro.in',     'Wipro Technologies'),
        (102, 'HDFC Bank',          'hr@hdfcbank.in',  'HDFC Bank'),
        (103, 'Zomato Pvt Ltd',     'hr@zomato.in',    'Zomato Pvt Ltd'),
    ]:
        await conn.execute("""
            INSERT INTO users (id,name,email,role,org_name,password_hash)
            VALUES ($1,$2,$3,'employer',$4,'$2b$12$placeholder')
            ON CONFLICT (id) DO UPDATE SET name=$2, org_name=$4
        """, uid, name, email, org)

    for emp, title, skills, loc, jtype, smin, smax in [
        (100,'Python Developer',           json.dumps(['Python','Django']),'Bengaluru','full_time',600000,900000),
        (100,'Data Scientist',             json.dumps(['Python','ML']),'Hyderabad','full_time',800000,1200000),
        (101,'QA Automation Engineer',     json.dumps(['Selenium','Python']),'Pune','full_time',500000,800000),
        (101,'HR Executive',               json.dumps(['Communication','MS Office']),'Delhi','full_time',300000,500000),
        (102,'Credit Analyst',             json.dumps(['Excel','Finance','SQL']),'Mumbai','full_time',600000,900000),
        (102,'Branch Operations Officer',  json.dumps(['Banking','Communication']),'Chennai','full_time',400000,600000),
        (103,'Operations Executive',       json.dumps(['Logistics','Excel']),'Hyderabad','full_time',350000,500000),
        (EMPLOYER_ID,'AI/ML Intern',       json.dumps(['Python','ML']),'Remote','internship',120000,180000),
    ]:
        await conn.execute("""
            INSERT INTO jobs (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING
        """, emp, title, f"We are looking for a talented {title} to join our team.", skills, loc, jtype, smin, smax)
    print("   done")

    # 2. Courses & batches
    print("\n[2] Courses & batches...")
    for cid, trid, title, provider, tags, dur, level in [
        (10, TRAINER_ID,'Python for Data Science','Bright Future Skills Academy',json.dumps(['Python','Pandas','NumPy']),8,'intermediate'),
        (11, TRAINER_ID,'Digital Marketing Basics','Bright Future Skills Academy',json.dumps(['SEO','Social Media']),6,'beginner'),
        (12, TRAINER_ID,'Tally ERP & Accounting',  'Bright Future Skills Academy',json.dumps(['Tally','GST']),4,'beginner'),
        (13, TRAINER_ID,'English Communication',    'Bright Future Skills Academy',json.dumps(['Speaking','Writing']),3,'beginner'),
    ]:
        await conn.execute("""
            INSERT INTO courses (id,trainer_id,title,provider,skill_tags,duration_weeks,level)
            VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET title=$3
        """, cid, trid, title, provider, tags, dur, level)

    for vid, title, sector, qp, nos, nsqf, dur, scheme in [
        (VENDOR_ID,"Python for Data Science","IT & ITES","SSC/Q2602","SSC/N2602","4",120,"PMKVY"),
        (VENDOR_ID,'Digital Marketing Basics','Media & Entmt','MES/Q0701','MES/N0701',3,80,'PMKVY'),
        (VENDOR_ID,'Tally ERP & Accounting','BFSI','BFSI/Q0101','BFSI/N0101',3,60,'DDU-GKY'),
        (VENDOR_ID,'English Communication','Soft Skills','SSC/Q0804','SSC/N0804',2,40,'PMKVY'),
    ]:
        await conn.execute("""
            INSERT INTO vendor_courses (vendor_id,title,sector,qp_code,nos_code,nsqf_level,duration_hours,fee_type,fee_amount,scheme,status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'free',0,$8,'active') ON CONFLICT DO NOTHING
        """, vid, title, sector, qp, nos, nsqf, dur, scheme)

    for bid, trid, cid, vid, bcode, bname, start, end, cap, scheme, status in [
        (10,TRAINER_ID,10,VENDOR_ID,'PY-BATCH-JUN25',   'Python Data Science - Jun 2025',  '2025-06-01','2025-07-31',25,'PMKVY',  'completed'),
        (11,TRAINER_ID,11,VENDOR_ID,'DM-BATCH-AUG25',   'Digital Marketing - Aug 2025',    '2025-08-01','2025-09-15',20,'PMKVY',  'active'),
        (12,TRAINER_ID,12,VENDOR_ID,'TALLY-BATCH-OCT25','Tally ERP - Oct 2025',            '2025-10-01','2025-10-31',30,'DDU-GKY','active'),
        (13,TRAINER_ID,13,VENDOR_ID,'ENG-BATCH-NOV25',  'English Communication - Nov 2025','2025-11-01','2025-11-30',35,'PMKVY',  'upcoming'),
    ]:
        await conn.execute("""
            INSERT INTO batches (id,trainer_id,course_id,batch_code,name,start_date,end_date,capacity,scheme_type,status,vendor_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET name=$5,status=$10
        """, bid, trid, cid, bcode, bname, start, end, cap, scheme, status, vid)
    print("   done")

    # 3. Enrollments
    print("\n[3] Enrollments...")
    for cid, bid, prog, status in [
        (1, 1, 100,'completed'),
        (2, 2, 100,'completed'),
        (3, 3, 100,'completed'),
        (10,10,  82,'active'),
        (11,11,  38,'active'),
    ]:
        await conn.execute("""
            INSERT INTO enrollments (course_id,candidate_id,progress,status,batch_id)
            VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
        """, cid, CANDIDATE_ID, prog, status, bid)
        await conn.execute("""
            INSERT INTO vendor_candidates (vendor_id,batch_id,name,mobile,dob,gender,category,scheme,enroll_date,attendance_pct,placement_status,status,user_id)
            VALUES ($1,$2,'Aisha Khan','9812345670','1999-05-15','Female','General','PMKVY','2025-06-01',$3,'Placed','active',$4)
            ON CONFLICT DO NOTHING
        """, VENDOR_ID, bid, prog, CANDIDATE_ID)
    print("   done")

    # 4. Certificates (schema: candidate_id, enrollment_id, course_title, issuer, nsqf_level, issued_date, cert_no, status)
    print("\n[4] Certificates...")
    enr_ids = await conn.fetch("SELECT id FROM enrollments WHERE candidate_id=$1 AND status='completed'", CANDIDATE_ID)
    eids = [r['id'] for r in enr_ids]
    for i, (course_title, issuer, nsqf, issued, cert_no) in enumerate([
        ('SQL for Data Analysis',  'Skillbridge Academy', 4,'2025-02-28','CERT-SQL-2025-0042'),
        ('Power BI Fundamentals',  'Skillbridge Academy', 4,'2025-03-20','CERT-PBI-2025-0087'),
        ("React.js for Beginners", 'Bright Future Skills',4,'2025-06-05','CERT-RJS-2025-0033'),
    ]):
        eid = eids[i] if i < len(eids) else None
        await conn.execute("""
            INSERT INTO candidate_certificates (candidate_id,enrollment_id,course_title,issuer,nsqf_level,issued_date,cert_no,status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'issued') ON CONFLICT DO NOTHING
        """, CANDIDATE_ID, eid, course_title, issuer, nsqf, issued, cert_no)
    print("   done")

    # 5. Trainer assessments
    print("\n[5] Assessments...")
    for trid, bid, atype, adate, total, passing, assessor, status, agency, slot, count in [
        (TRAINER_ID,1, 'Theory',   '2025-02-15',100,40,'NSDC Assessor',     'completed','NSDC Assessments','10:00 AM',25),
        (TRAINER_ID,1, 'Practical','2025-02-20',100,40,'NSDC Assessor',     'completed','NSDC Assessments','10:00 AM',25),
        (TRAINER_ID,3, 'Theory',   '2025-05-20',100,40,'SSC Nasscom Panel', 'completed','SSC Nasscom',      '10:00 AM',22),
        (TRAINER_ID,10,'Theory',   '2025-07-25',100,40,'NSDC Assessor',     'completed','NSDC Assessments', '02:00 PM',20),
        (TRAINER_ID,11,'Mid-term', '2025-08-28', 50,20,'Internal',          'upcoming', 'Internal',         '11:00 AM',18),
    ]:
        await conn.execute("""
            INSERT INTO trainer_assessments (trainer_id,batch_id,type,date,duration_hrs,total_marks,passing_marks,assessor,status,agency,time_slot,candidate_count)
            VALUES ($1,$2,$3,$4,2,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING
        """, trid, bid, atype, adate, total, passing, assessor, status, agency, slot, count)

    # Vendor assessment with results
    results = json.dumps([
        {"name":"Aisha Khan","score":88,"status":"pass","user_id":2},
        {"name":"Rahul Verma","score":72,"status":"pass","user_id":3},
        {"name":"Priya Singh","score":45,"status":"fail"},
        {"name":"Arjun Nair","score":91,"status":"pass"},
        {"name":"Sunita Devi","score":38,"status":"fail"},
    ])
    await conn.execute("""
        INSERT INTO vendor_assessments (vendor_id,batch_id,agency,scheduled_date,time_slot,candidate_count,results,status,type,total_marks,passing_marks,assessor,duration_hrs)
        VALUES ($1,1,'NSDC Assessments Pvt Ltd','2025-02-20','10:00 AM',25,$2,'completed','Theory',100,40,'Mr. Arun Kumar',3)
        ON CONFLICT DO NOTHING
    """, VENDOR_ID, results)
    print("   done")

    # 6. Notifications
    print("\n[6] Notifications...")
    await conn.execute("DELETE FROM candidate_notifications WHERE candidate_id=$1", CANDIDATE_ID)
    for title, body, ntype, is_read in [
        ('Application Shortlisted 🎉','You have been shortlisted for Frontend Developer (React) at TechNova Pvt Ltd.','application',False),
        ('Interview Scheduled 📅',   'Your interview for Junior Data Analyst at TechNova is on 20 Jul 2025 at 11:00 AM.','interview',False),
        ('Course Completed ✅',       'Congratulations! You completed SQL for Data Analysis. Your certificate is ready.','course',False),
        ('New Job Match 💼',         '5 new jobs match your profile — Data Analyst, Python Developer and more.','job',True),
        ('Assessment Reminder ⏰',   'Upcoming assessment for Digital Marketing batch on 28 Aug 2025. Prepare!','assessment',True),
        ('Certificate Issued 🏅',    'Your NSDC certificate for React.js has been issued. Download from Skill Passport.','certificate',False),
        ('Scheme Alert 📢',         'You may be eligible for PMKVY 4.0 stipend of ₹8,000. Check Government Schemes.','scheme',True),
        ('Profile Incomplete ⚠️',   'Profile is 85% complete. Add Aadhaar and bank details to receive scheme benefits.','profile',True),
        ('Placement Update 🚀',     'Pioneer Placements referred you to HDFC Bank for Credit Analyst role.','placement',False),
        ('New Course Recommended 📚','Based on your skills, we recommend "Python for Data Science" — 120 hrs, NSQF 4.','course',True),
    ]:
        await conn.execute("INSERT INTO candidate_notifications (candidate_id,title,body,type,is_read) VALUES ($1,$2,$3,$4,$5)",
            CANDIDATE_ID, title, body, ntype, is_read)
    print("   done")

    # 7. Saved jobs & alerts
    print("\n[7] Saved jobs & alerts...")
    job_ids = await conn.fetch("SELECT id FROM jobs ORDER BY id LIMIT 15")
    for r in list(job_ids)[3:8]:
        await conn.execute("INSERT INTO saved_jobs (candidate_id,job_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", CANDIDATE_ID, r['id'])
    await conn.execute("""
        INSERT INTO job_alerts (candidate_id,preferred_role,preferred_sector,preferred_location,frequency,is_active)
        VALUES ($1,'Data Analyst','IT & ITES','Bengaluru,Hyderabad','daily',true) ON CONFLICT DO NOTHING
    """, CANDIDATE_ID)
    await conn.execute("""
        INSERT INTO job_alerts (candidate_id,preferred_role,preferred_sector,preferred_location,frequency,is_active)
        VALUES ($1,'React Developer','IT & ITES','Remote,Pune','weekly',true) ON CONFLICT DO NOTHING
    """, CANDIDATE_ID)
    print("   done")

    # 8. Grievances
    print("\n[8] Grievances...")
    await conn.execute("""
        INSERT INTO candidate_grievances (candidate_id,category,subject,description,status)
        VALUES ($1,'Certificate','Certificate not received after 30 days',
            'I completed SQL for Data Analysis on 28 Feb 2025 but have not received my NSDC certificate. Please resolve.','resolved')
        ON CONFLICT DO NOTHING
    """, CANDIDATE_ID)
    await conn.execute("""
        INSERT INTO candidate_grievances (candidate_id,category,subject,description,status)
        VALUES ($1,'Stipend','PMKVY stipend not credited for February',
            'PMKVY training stipend for February 2025 has not been credited. Batch code: B2025-01.','pending')
        ON CONFLICT DO NOTHING
    """, CANDIDATE_ID)
    print("   done")

    # 9. Placement
    print("\n[9] Placement...")
    await conn.execute("""
        INSERT INTO placements (agency_id,candidate_id,employer_id,job_title,company,location,ctc,placement_date,status)
        VALUES ($1,$2,$3,'Junior Data Analyst','TechNova Pvt Ltd','Bengaluru',480000,'2025-08-01','placed')
        ON CONFLICT DO NOTHING
    """, AGENCY_ID, CANDIDATE_ID, EMPLOYER_ID)
    print("   done")

    # 10. Update Aisha's profile
    print("\n[10] Profile update...")
    await conn.execute("""
        UPDATE users SET phone='9812345670', location='Hyderabad',
            skills=$1,
            bio='Recent graduate with SQL, Power BI and React.js experience. Completed PMKVY training at Bright Future Skills Academy. Seeking entry-level data/frontend roles.'
        WHERE id=$2
    """, json.dumps(['SQL','Power BI','React.js','Python','Excel','Communication']), CANDIDATE_ID)
    print("   done")

    await conn.close()
    print("\n✅ All done!")
    print("  • 4 employers + 8 jobs added")
    print("  • 4 courses + 4 batches (Bright Future vendor)")
    print("  • 5 enrollments for Aisha")
    print("  • 3 certificates issued")
    print("  • 5 trainer assessments + 1 vendor assessment with results")
    print("  • 10 notifications")
    print("  • 5 saved jobs + 2 job alerts")
    print("  • 2 grievances")
    print("  • 1 placement via Pioneer Placements")

asyncio.run(main())
