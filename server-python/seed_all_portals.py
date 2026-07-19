"""
Comprehensive seed script — populates realistic data for all portals/menus.
Run: python3 seed_all_portals.py
"""
import asyncio
import asyncpg
from passlib.context import CryptContext

DB_URL = "postgresql://localhost:5432/skillsnjobs"
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
PW = pwd.hash("Test@1234")


async def run():
    pool = await asyncpg.create_pool(DB_URL)
    async with pool.acquire() as c:

        print("=== Seeding all portals ===\n")

        # ── 1. Extra Users ──────────────────────────────────────────
        print("1. Creating users...")
        users_to_add = [
            ("Priya Mehta",    "priya.mehta@example.com",   "candidate",        None,                      "Mumbai",   "F"),
            ("Arjun Singh",    "arjun.singh@example.com",   "candidate",        None,                      "Delhi",    "M"),
            ("Sneha Patel",    "sneha.patel@example.com",   "candidate",        None,                      "Ahmedabad","F"),
            ("Mohammed Irfan", "irfan@example.com",          "candidate",        None,                      "Hyderabad","M"),
            ("Kavita Rao",     "kavita.rao@example.com",    "candidate",        None,                      "Chennai",  "F"),
            ("Rajesh Nair",    "rajesh.nair@training.in",   "trainer",          "NSDC Skill Hub",          "Kochi",    "M"),
            ("Deepa Krishnan", "deepa.k@training.in",       "trainer",          "TechSkill Academy",       "Bengaluru","F"),
            ("Ravi Shankar",   "ravi@futureskills.in",      "training_vendor",  "Future Skills Institute", "Pune",     "M"),
            ("Nisha Agarwal",  "nisha@navjeevan.in",        "training_vendor",  "Navjeevan Skill Centre",  "Jaipur",   "F"),
            ("Arun Kapoor",    "arun@tatapower-csr.in",     "csr_org",          "Tata Power Community Dev","Mumbai",   "M"),
            ("Suman Verma",    "suman@bridgeit.in",         "placement_agency", "BridgeIT Placements",     "Noida",    "F"),
            ("Renu Sharma",    "renu@mpskill.gov.in",       "state_government", "MP Skill Dev Mission",    "Bhopal",   "F"),
        ]
        new_ids = {}
        for name, email, role, org, loc, gender in users_to_add:
            existing = await c.fetchrow("SELECT id FROM users WHERE email=$1", email)
            if existing:
                new_ids[email] = existing["id"]
                continue
            row = await c.fetchrow(
                "INSERT INTO users (name,email,password_hash,role,org_name,location,gender,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,1) RETURNING id",
                name, email, PW, role, org, loc, gender)
            new_ids[email] = row["id"]
            print(f"   + {role}: {name}")

        def uid(email): return new_ids.get(email)

        cand_ids    = [x for x in [2, 3, 15, uid("priya.mehta@example.com"), uid("arjun.singh@example.com"), uid("sneha.patel@example.com"), uid("irfan@example.com"), uid("kavita.rao@example.com")] if x]
        vendor_ids  = [x for x in [11, 13, 14, 16, uid("ravi@futureskills.in"), uid("nisha@navjeevan.in")] if x]
        trainer_ids = [x for x in [5, uid("rajesh.nair@training.in"), uid("deepa.k@training.in")] if x]
        csr_ids     = [x for x in [10, 17, uid("arun@tatapower-csr.in")] if x]
        pa_id       = uid("suman@bridgeit.in") or 9
        sg_id2      = uid("renu@mpskill.gov.in") or 7
        emp_ids     = [4, 100, 101, 102, 103]

        def ci(n): return cand_ids[n] if len(cand_ids) > n else cand_ids[0]
        def vi(n): return vendor_ids[n] if len(vendor_ids) > n else vendor_ids[0]
        def tri(n): return trainer_ids[n] if len(trainer_ids) > n else trainer_ids[0]
        def csi(n): return csr_ids[n] if len(csr_ids) > n else csr_ids[0]

        # ── 2. Geographic Coverage ──────────────────────────────────
        print("\n2. Geographic coverage...")
        for s in ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"]:
            ex = await c.fetchrow("SELECT id FROM geographic_coverage WHERE name=$1", s)
            if not ex:
                await c.execute("INSERT INTO geographic_coverage (name,is_enabled) VALUES ($1,1)", s)
        print("   32 states ensured")

        # ── 3. Accreditations ───────────────────────────────────────
        print("\n3. Accreditation types...")
        for a in ["NSDC Affiliated","ISO 9001:2015","NSQF Certified","SSC Empanelled","NAAC Accredited","NBA Approved","AICTE Approved","UGC Recognized","DGET Affiliated","MSME Certified","NSD Certified","QCI Certified"]:
            ex = await c.fetchrow("SELECT id FROM accreditations WHERE name=$1", a)
            if not ex:
                await c.execute("INSERT INTO accreditations (name,is_enabled) VALUES ($1,1)", a)
        print("   12 accreditation types ensured")

        # ── 4. Vendor Centres ───────────────────────────────────────
        print("\n4. Vendor training centres...")
        centres = [
            (vi(0),"Bright Future Main Centre","12 MG Road","Maharashtra","Pune","Pune","411001",6,3,120),
            (vi(0),"Bright Future Satellite","Plot 45 MIDC","Maharashtra","Nashik","Nashik","422001",4,2,80),
            (vi(1),"NetApp Skills Hub","IT Park Phase 2","Telangana","Hyderabad","Hyderabad","500081",8,4,200),
            (vi(2),"Skill Test Academy Main","Old Town","Punjab","Ludhiana","Ludhiana","141001",5,2,100),
            (vi(3),"LG Electronics Skill Lab","Sector 18","Haryana","Gurugram","Gurugram","122001",10,5,300),
            (vi(4),"Future Skills Pune","Aundh Road","Maharashtra","Pune","Pune","411007",6,3,150),
            (vi(5),"Navjeevan Main Centre","Station Road","Rajasthan","Jaipur","Jaipur","302001",4,2,90),
        ]
        for (vid,name,addr,state,dist,city,pin,cls,labs,cap) in centres:
            ex = await c.fetchrow("SELECT id FROM vendor_centres WHERE vendor_id=$1 AND name=$2", vid, name)
            if not ex:
                await c.execute("INSERT INTO vendor_centres (vendor_id,name,address,state_name,district,city,pincode,classrooms,labs,seating_capacity,internet,power_backup,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true,'active')", vid,name,addr,state,dist,city,pin,cls,labs,cap)
        print(f"   {len(centres)} centres added")

        # ── 5. Courses ──────────────────────────────────────────────
        print("\n5. Courses...")
        courses = [
            ("PMKVY Sewing Machine Operator","NSDC",'["Stitching","Fabric"]',8,"Beginner"),
            ("Retail Sales Associate","NSDC",'["Sales","Customer Service"]',10,"Beginner"),
            ("Beauty & Wellness Nail Art","NSDC",'["Nail Art","Cosmetology"]',6,"Beginner"),
            ("Healthcare GDA","NSDC",'["Patient Care","First Aid"]',12,"Beginner"),
            ("Solar Panel Installation","MNRE",'["Solar Energy","Electrical"]',8,"Intermediate"),
            ("Two Wheeler Repair","NSDC",'["Mechanics","Engine"]',10,"Beginner"),
            ("Plumber Pipe Fitting","NSDC",'["Plumbing","Pipe Fitting"]',8,"Beginner"),
            ("Cybersecurity Fundamentals","EC-Council",'["Network Security","Firewall"]',16,"Advanced"),
            ("AWS Cloud Practitioner","Amazon",'["Cloud","AWS","DevOps"]',12,"Intermediate"),
            ("Tally Prime Advanced","Tally",'["Accounting","GST","Tally"]',8,"Intermediate"),
            ("Food Processing Technician","FICSI",'["Food Safety","HACCP"]',10,"Beginner"),
            ("BPO Voice Process","NASSCOM",'["Communication","CRM"]',8,"Beginner"),
        ]
        for (title,provider,skills,dur,level) in courses:
            ex = await c.fetchrow("SELECT id FROM courses WHERE title=$1", title)
            if not ex:
                await c.execute("INSERT INTO courses (title,provider,skill_tags,duration_weeks,level) VALUES ($1,$2,$3,$4,$5)", title,provider,skills,dur,level)
        all_courses = await c.fetch("SELECT id FROM courses ORDER BY id")
        course_ids = [r["id"] for r in all_courses]
        def coid(n): return course_ids[n] if len(course_ids) > n else course_ids[0]
        print(f"   {len(course_ids)} total courses")

        # ── 6. Batches ──────────────────────────────────────────────
        print("\n6. Batches...")
        batches = [
            (tri(0),None,coid(0),"SB-2026-PY01","Python DS Batch Jul 2026","2026-07-01","2026-09-30","active",60,"PMKVY"),
            (tri(0),None,coid(1),"SB-2026-ML01","ML & AI Batch Aug 2026","2026-08-01","2026-11-30","upcoming",40,"PMKVY"),
            (tri(1),None,coid(2),"RN-2026-01","English Comm Batch","2026-06-01","2026-08-31","active",30,"DDU-GKY"),
            (tri(2),None,coid(3),"DK-2026-01","Digital Marketing Batch","2026-05-01","2026-07-31","completed",25,"PMKVY"),
            (None,vi(0),coid(4),"VB-BF-2026-01","Tally ERP Batch","2026-06-15","2026-09-15","active",50,"Fee-Based"),
            (None,vi(1),coid(0),"VB-NA-2026-01","Python Batch Hyd","2026-07-01","2026-10-31","upcoming",45,"PMKVY"),
            (None,vi(2),coid(5),"VB-ST-2026-01","Healthcare GDA Batch","2026-06-01","2026-09-30","active",35,"DDU-GKY"),
            (tri(0),None,coid(6),"SB-2025-SQL","SQL Batch Sep 2025","2025-09-01","2025-11-30","completed",20,"Fee-Based"),
            (None,vi(3),coid(0),"VB-LG-2026-01","Solar Installation Batch","2026-08-01","2026-10-31","upcoming",30,"PMKVY"),
        ]
        for (tid,vid,cid_,code,name,start,end,status,cap,scheme) in batches:
            ex = await c.fetchrow("SELECT id FROM batches WHERE batch_code=$1", code)
            if not ex:
                await c.execute("INSERT INTO batches (trainer_id,vendor_id,course_id,batch_code,name,start_date,end_date,status,capacity,scheme_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", tid,vid,cid_,code,name,start,end,status,cap,scheme)
        all_batches = await c.fetch("SELECT id FROM batches ORDER BY id")
        all_batch_ids = [r["id"] for r in all_batches]
        def bi(n): return all_batch_ids[n] if len(all_batch_ids) > n else all_batch_ids[0]
        print(f"   {len(all_batch_ids)} total batches")

        # ── 7. Batch Enrollments ────────────────────────────────────
        print("\n7. Batch enrollments...")
        be = [(bi(0),ci(0),88,True,"completed"),(bi(0),ci(1),72,True,"completed"),(bi(1),ci(2),65,True,"completed"),(bi(2),ci(3),55,True,"enrolled"),(bi(2),ci(4),48,False,"enrolled"),(bi(3),ci(5),90,True,"completed"),(bi(3),ci(6),78,True,"completed"),(bi(4),ci(7),82,True,"completed"),(bi(0),ci(7),60,True,"completed")]
        for (bid,cid_,score,passed,status) in be:
            ex = await c.fetchrow("SELECT id FROM batch_enrollments WHERE batch_id=$1 AND candidate_id=$2", bid, cid_)
            if not ex:
                await c.execute("INSERT INTO batch_enrollments (batch_id,candidate_id,assessment_score,passed,status) VALUES ($1,$2,$3,$4,$5)", bid,cid_,score,passed,status)
        print(f"   {len(be)} batch enrollments added")

        # ── 8. Course Enrollments ───────────────────────────────────
        print("\n8. Course enrollments...")
        enrol_count = 0
        for i, cand in enumerate(cand_ids[:6]):
            for j, crs in enumerate(course_ids[:4]):
                status = ["enrolled","enrolled","completed","completed"][min(j,3)]
                ex = await c.fetchrow("SELECT id FROM enrollments WHERE course_id=$1 AND candidate_id=$2", crs, cand)
                if not ex:
                    await c.execute("INSERT INTO enrollments (course_id,candidate_id,status,progress) VALUES ($1,$2,$3,$4)", crs, cand, status, 100 if status in ("completed","certified") else 40)
                    enrol_count += 1
        print(f"   {enrol_count} course enrollments added")

        # ── 9. Trainer Sessions ─────────────────────────────────────
        print("\n9. Trainer sessions...")
        sessions = [
            (tri(0),bi(0),"Python Basics & Syntax","2026-07-02","09:00",3,"Online","Zoom","completed"),
            (tri(0),bi(0),"Data Structures in Python","2026-07-05","09:00",3,"Online","Zoom","completed"),
            (tri(0),bi(0),"Pandas & NumPy","2026-07-09","09:00",4,"Online","Zoom","scheduled"),
            (tri(0),bi(0),"Machine Learning Intro","2026-07-12","09:00",4,"Online","Zoom","scheduled"),
            (tri(0),bi(1),"Linear Regression","2026-08-03","10:00",3,"Offline","Centre Hall A","scheduled"),
            (tri(1),bi(2),"Spoken English Week 1","2026-06-03","09:30",3,"Offline","Room 201","completed"),
            (tri(1),bi(2),"Grammar & Vocabulary","2026-06-10","09:30",3,"Offline","Room 201","completed"),
            (tri(2),bi(3),"Digital Marketing Overview","2026-05-02","11:00",4,"Online","Teams","completed"),
            (tri(2),bi(3),"SEO & SEM Fundamentals","2026-05-09","11:00",4,"Online","Teams","completed"),
            (tri(2),bi(3),"Social Media Marketing","2026-05-16","11:00",4,"Online","Teams","completed"),
        ]
        for (tid,bid,topic,date,time,dur,mode,venue,status) in sessions:
            ex = await c.fetchrow("SELECT id FROM trainer_sessions WHERE trainer_id=$1 AND topic=$2 AND session_date=$3", tid,topic,date)
            if not ex:
                await c.execute("INSERT INTO trainer_sessions (trainer_id,batch_id,topic,session_date,start_time,duration_hrs,mode,venue,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", tid,bid,topic,date,time,dur,mode,venue,status)
        print(f"   {len(sessions)} sessions added")

        # ── 10. Trainer Assessments ─────────────────────────────────
        print("\n10. Trainer assessments...")
        ta = [
            (tri(0),bi(0),"Mid-term","2026-07-20",2.0,100,40,"Wheebox","09:00",28,"scheduled"),
            (tri(0),bi(0),"Final","2026-09-25",3.0,100,50,"NSDC Assessment","10:00",28,"scheduled"),
            (tri(1),bi(2),"Final","2026-08-28",2.0,100,40,"Ernst & Young","09:00",20,"scheduled"),
            (tri(2),bi(3),"Final","2026-07-25",2.0,100,40,"Manipal ProLearn","11:00",18,"completed"),
        ]
        for (tid,bid,typ,date,dur,total,passing,agency,slot,cnt,status) in ta:
            ex = await c.fetchrow("SELECT id FROM trainer_assessments WHERE trainer_id=$1 AND batch_id=$2 AND type=$3", tid,bid,typ)
            if not ex:
                await c.execute("INSERT INTO trainer_assessments (trainer_id,batch_id,type,date,duration_hrs,total_marks,passing_marks,agency,time_slot,candidate_count,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", tid,bid,typ,date,dur,total,passing,agency,slot,cnt,status)
        print(f"   {len(ta)} trainer assessments added")

        # ── 11. Vendor Assessments ──────────────────────────────────
        print("\n11. Vendor assessments...")
        va = [
            (vi(0),bi(4),"Wheebox","2026-09-10","09:00",35,"scheduled","Final",100,40,3.0),
            (vi(1),bi(5),"CDAC","2026-10-20","10:00",40,"scheduled","Final",100,40,3.0),
            (vi(2),bi(6),"MERIT-TNL","2026-09-25","09:00",28,"scheduled","Final",100,40,2.5),
        ]
        for (vid,bid,agency,date,slot,cnt,status,typ,total,passing,dur) in va:
            ex = await c.fetchrow("SELECT id FROM vendor_assessments WHERE vendor_id=$1 AND batch_id=$2", vid,bid)
            if not ex:
                await c.execute("INSERT INTO vendor_assessments (vendor_id,batch_id,agency,scheduled_date,time_slot,candidate_count,status,type,total_marks,passing_marks,duration_hrs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", vid,bid,agency,date,slot,cnt,status,typ,total,passing,dur)
        print(f"   {len(va)} vendor assessments added")

        # ── 12. Trainer Profiles ────────────────────────────────────
        print("\n12. Trainer profiles...")
        for tid in trainer_ids:
            if not await c.fetchrow("SELECT id FROM trainer_qualifications WHERE trainer_id=$1", tid):
                await c.execute("INSERT INTO trainer_qualifications (trainer_id,degree,institution,year,score) VALUES ($1,'B.Tech / BE','National Institute of Technology',2015,78.5)", tid)
            if not await c.fetchrow("SELECT id FROM trainer_experience WHERE trainer_id=$1", tid):
                await c.execute("INSERT INTO trainer_experience (trainer_id,org,role,from_date,to_date,sector) VALUES ($1,'Infosys Ltd','Senior Engineer','2015-06-01','2020-05-31','IT-ITES')", tid)
            if not await c.fetchrow("SELECT id FROM trainer_skills WHERE trainer_id=$1", tid):
                await c.execute("INSERT INTO trainer_skills (trainer_id,domain,courses,ssc,nsqf_level,years_exp) VALUES ($1,'Information Technology','Python, Data Science, ML','SSC NASSCOM',5,6)", tid)
            if not await c.fetchrow("SELECT id FROM trainer_content WHERE trainer_id=$1", tid):
                await c.execute("INSERT INTO trainer_content (trainer_id,type,title,description,batch_targets) VALUES ($1,'PDF','Module 1 - Introduction','Course introduction material','All batches')", tid)
            if not await c.fetchrow("SELECT id FROM trainer_certifications WHERE trainer_id=$1", tid):
                await c.execute("INSERT INTO trainer_certifications (trainer_id,cert_name,issuing_body,year,valid_until) VALUES ($1,'Certified Trainer NSQF Level 5','NSDC',2023,'2026-03-31')", tid)
        print(f"   Profiles updated for {len(trainer_ids)} trainers")

        # ── 13. CSR Projects ────────────────────────────────────────
        print("\n13. CSR projects...")
        csr_proj = [
            (csi(0),"Digital Literacy for Rural Women","Skill Development","IT-ITES","Maharashtra","Nashik","2026-04-01","2026-12-31",2500000,1200000,500,"active","Train 500 rural women in digital skills"),
            (csi(0),"Solar Technician Training Vidarbha","Skill Development","Green Jobs","Maharashtra","Amravati","2026-01-01","2026-06-30",1800000,1800000,200,"completed","Skill 200 youth in solar panel installation"),
            (csi(0),"Healthcare Worker Upskilling","Skill Development","Healthcare","Maharashtra","Pune","2026-07-01","2027-03-31",3200000,0,300,"draft","Upskill 300 GDA and ANM workers"),
            (csi(1),"Sewing Machine Operator Training","Livelihood","Apparel","Tamil Nadu","Coimbatore","2026-03-01","2026-09-30",1500000,900000,150,"active","Train 150 women in garment sector"),
            (csi(1),"IT Literacy for SC ST Youth","Skill Development","IT-ITES","Tamil Nadu","Chennai","2025-10-01","2026-03-31",2000000,2000000,180,"completed","Digital skills for 180 marginalized youth"),
            (csi(2),"Plumbing & Construction Skills","Skill Development","Construction","Gujarat","Surat","2026-05-01","2026-11-30",1200000,400000,120,"active","Train 120 youth in plumbing"),
            (csi(2),"Retail & Sales Training","Skill Development","Retail","Gujarat","Ahmedabad","2026-09-01","2027-02-28",1600000,0,160,"draft","Enable 160 school dropouts in retail"),
        ]
        proj_ids = []
        for (cid_,title,activity,sub,state,dist,start,end,budget,spent,bene,status,obj) in csr_proj:
            ex = await c.fetchrow("SELECT id FROM csr_projects WHERE csr_user_id=$1 AND title=$2", cid_,title)
            if ex:
                proj_ids.append(ex["id"]); continue
            row = await c.fetchrow("INSERT INTO csr_projects (csr_user_id,title,activity,sub_sector,state_name,district,start_date,end_date,budget,spent,beneficiaries_target,status,objectives,mou_signed,agency_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Yes signed','NGO') RETURNING id", cid_,title,activity,sub,state,dist,start,end,budget,spent,bene,status,obj)
            proj_ids.append(row["id"])
            print(f"   + Project: {title[:50]}")
        def pi(n): return proj_ids[n] if len(proj_ids) > n else proj_ids[0]

        # ── 14. CSR Beneficiaries ───────────────────────────────────
        print("\n14. CSR beneficiaries...")
        bene = [
            (csi(0),pi(0),"Lata Shinde","F",24,"Nashik","Maharashtra","Digital Literacy","DL-2026-001","2026-04-10","in-training","unemployed","SC"),
            (csi(0),pi(0),"Sunita Pawar","F",22,"Nashik","Maharashtra","Digital Literacy","DL-2026-002","2026-04-10","in-training","unemployed","OBC"),
            (csi(0),pi(0),"Rekha Jadhav","F",26,"Nashik","Maharashtra","Digital Literacy","DL-2026-003","2026-04-10","in-training","unemployed","General"),
            (csi(0),pi(1),"Ramesh Desai","M",20,"Amravati","Maharashtra","Solar Technician","ST-2026-001","2026-01-15","completed","placed","OBC"),
            (csi(0),pi(1),"Sunil Wankhede","M",21,"Amravati","Maharashtra","Solar Technician","ST-2026-002","2026-01-15","completed","placed","SC"),
            (csi(0),pi(1),"Ganesh More","M",19,"Amravati","Maharashtra","Solar Technician","ST-2026-003","2026-01-15","completed","self-employed","General"),
            (csi(1),pi(3),"Meena Kumari","F",23,"Coimbatore","Tamil Nadu","Sewing Machine","SM-2026-001","2026-03-05","in-training","unemployed","SC"),
            (csi(1),pi(3),"Rani Devi","F",25,"Coimbatore","Tamil Nadu","Sewing Machine","SM-2026-002","2026-03-05","in-training","unemployed","OBC"),
            (csi(1),pi(4),"Arumugam K","M",22,"Chennai","Tamil Nadu","IT Literacy","IT-2025-001","2025-10-10","completed","placed","SC"),
            (csi(1),pi(4),"Selvam R","M",20,"Chennai","Tamil Nadu","IT Literacy","IT-2025-002","2025-10-10","completed","placed","ST"),
            (csi(1),pi(4),"Kavitha S","F",21,"Chennai","Tamil Nadu","IT Literacy","IT-2025-003","2025-10-10","completed","self-employed","OBC"),
        ]
        ts_map = {"in-training":"in_progress","completed":"completed","enrolled":"enrolled","dropout":"dropout"}
        ps_map = {"unemployed":"not_placed","placed":"placed","self-employed":"self_employed","not_placed":"not_placed"}
        gmap   = {"F":"Female","M":"Male"}
        for (cid_,pid,name,gender,age,dist,state,course,code,enroll_date,t_status,p_status,cat) in bene:
            ex = await c.fetchrow("SELECT id FROM csr_beneficiaries WHERE csr_user_id=$1 AND batch_code=$2", cid_,code)
            if not ex:
                await c.execute("INSERT INTO csr_beneficiaries (csr_user_id,project_id,name,gender,age,district,state_name,course,batch_code,enroll_date,training_status,placement_status,category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)", cid_,pid,name,gmap.get(gender,gender),age,dist,state,course,code,enroll_date,ts_map.get(t_status,t_status),ps_map.get(p_status,p_status),cat)
        print(f"   {len(bene)} beneficiaries added")

        # ── 15. CSR Disbursements ───────────────────────────────────
        print("\n15. CSR disbursements...")
        disb = [
            (csi(0),pi(0),600000,"Navjeevan Skill Centre","First Tranche Infrastructure","2026-04-15","CSR-DISB-001","2026-27","disbursed","NEFT"),
            (csi(0),pi(0),600000,"Navjeevan Skill Centre","Second Tranche Training Cost","2026-06-30","CSR-DISB-002","2026-27","disbursed","NEFT"),
            (csi(0),pi(1),1800000,"Future Skills Institute","Full Project Cost","2026-04-01","CSR-DISB-003","2026-27","disbursed","RTGS"),
            (csi(1),pi(3),500000,"Meena Tailoring Coop","First Tranche","2026-03-20","CSR-DISB-004","2026-27","disbursed","Cheque"),
            (csi(1),pi(3),400000,"Meena Tailoring Coop","Second Tranche","2026-06-20","CSR-DISB-005","2026-27","pending","NEFT"),
            (csi(1),pi(4),2000000,"IT Saksham Foundation","Full Cost","2025-10-05","CSR-DISB-006","2025-26","disbursed","RTGS"),
        ]
        for (cid_,pid,amt,recipient,purpose,date,ref,fy,status,mode) in disb:
            ex = await c.fetchrow("SELECT id FROM csr_disbursements WHERE reference_no=$1", ref)
            if not ex:
                await c.execute("INSERT INTO csr_disbursements (csr_user_id,project_id,amount,recipient,purpose,disbursed_date,reference_no,fy,status,mode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", cid_,pid,amt,recipient,purpose,date,ref,fy,status,mode)
        print(f"   {len(disb)} disbursements added")

        # ── 16. CSR Unspent Funds ───────────────────────────────────
        print("\n16. CSR unspent funds...")
        for (cid_,fy,amt,reason,deadline,dest,plan,status) in [(csi(0),"2024-25",350000,"Project delays","2024-09-30","PM CARES Fund","Submit remediation report","transferred"),(csi(1),"2024-25",180000,"Vendor onboarding delays","2024-09-30","National Skill Dev Fund","Re-allocate to 2025-26","pending")]:
            ex = await c.fetchrow("SELECT id FROM csr_unspent_funds WHERE csr_user_id=$1 AND financial_year=$2", cid_,fy)
            if not ex:
                await c.execute("INSERT INTO csr_unspent_funds (csr_user_id,financial_year,unspent_amount,reason,transfer_deadline,transfer_destination,remediation_plan,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", cid_,fy,amt,reason,deadline,dest,plan,status)
        print("   2 unspent fund records added")

        # ── 17. Placements ──────────────────────────────────────────
        print("\n17. Additional placements...")
        places = [
            (9,   ci(3),emp_ids[0],"Junior Python Developer","TechNova Pvt Ltd","Bengaluru",480000,"2026-06-15","placed"),
            (9,   ci(4),emp_ids[1],"Data Entry Executive","Infosys Ltd","Pune",300000,"2026-05-20","placed"),
            (pa_id,ci(5),emp_ids[2],"Digital Marketing Exec","Wipro Technologies","Hyderabad",420000,"2026-07-01","placed"),
            (pa_id,ci(6),emp_ids[3],"Customer Support","Zomato Pvt Ltd","Mumbai",360000,"2026-06-10","placed"),
            (pa_id,ci(7),emp_ids[4],"Finance Executive","HDFC Bank","Chennai",520000,"2026-07-15","placed"),
        ]
        for (aid,cid_,eid,title,company,loc,ctc,date,status) in places:
            ex = await c.fetchrow("SELECT id FROM placements WHERE candidate_id=$1 AND job_title=$2", cid_,title)
            if not ex:
                await c.execute("INSERT INTO placements (agency_id,candidate_id,employer_id,job_title,company,location,ctc,placement_date,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", aid,cid_,eid,title,company,loc,ctc,date,status)
        print(f"   {len(places)} placements added")

        # ── 18. SG Training Partners ────────────────────────────────
        print("\n18. State Govt training partner records...")
        sg_tps = [
            (7,vi(0),"Bright Future Skills Academy","NSDC Affiliated","Pune","Maharashtra","BF-MH-001","info@brightfuture.in","9800000010","PMKVY",8,480,"verified","2027-03-31"),
            (7,vi(1),"NetApp Skills Hub","SSC Empanelled","Hyderabad","Telangana","NA-TG-001","hr@netapp.in","9800000011","DDU-GKY",5,310,"verified","2027-06-30"),
            (7,vi(2),"Skill Test Academy","NSQF Certified","Ludhiana","Punjab","ST-PB-001","info@skilltest.in","9800000012","PMKVY",4,240,"pending","2026-12-31"),
            (7,vi(3),"LG Electronics Skill Lab","DGET Affiliated","Gurugram","Haryana","LG-HR-001","skill@lg.com","9800000013","Fee-Based",10,600,"verified","2028-03-31"),
            (sg_id2,vi(4),"Future Skills Institute","NSDC Affiliated","Pune","Maharashtra","FS-MH-001","ravi@futureskills.in","9800000014","PMKVY",6,350,"verified","2027-09-30"),
            (sg_id2,vi(5),"Navjeevan Skill Centre","NSQF Certified","Jaipur","Rajasthan","NJ-RJ-001","nisha@navjeevan.in","9800000015","DDU-GKY",3,180,"pending","2026-09-30"),
        ]
        for (sid,vid,name,accred,dist,state,code,email,mobile,scheme,centres_,trainees,status,acc_exp) in sg_tps:
            ex = await c.fetchrow("SELECT id FROM sg_training_partners WHERE nsdc_code=$1", code)
            if not ex:
                await c.execute("INSERT INTO sg_training_partners (state_user_id,vendor_id,name,type,district,state_name,nsdc_code,email,mobile,scheme,centre_count,trainee_count,accreditation,accreditation_expiry,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)", sid,vid,name,accred,dist,state,code,email,mobile,scheme,centres_,trainees,accred,acc_exp,status)
        print(f"   {len(sg_tps)} SG training partner records added")

        # ── 19. SG Schemes ─────────────────────────────────────────
        print("\n19. Government schemes...")
        scheme_ids = []
        for (code,name,ministry,desc,active) in [
            ("PMKVY","Pradhan Mantri Kaushal Vikas Yojana","MoSDE","National skill certification scheme",True),
            ("DDU-GKY","Deen Dayal Upadhyaya Grameen Kaushalya Yojana","MoRD","Rural skill training scheme",True),
            ("NAPS","National Apprenticeship Promotion Scheme","MoLE","Apprenticeship stipend support",True),
            ("SANKALP","Skill Acquisition and Knowledge Awareness for Livelihood Promotion","MoSDE","World Bank assisted scheme",True),
            ("ASEEM","Atmanirbhar Skilled Employee Employer Mapping","MoSDE","Skill supply-demand matching",True),
        ]:
            ex = await c.fetchrow("SELECT id FROM sg_schemes WHERE code=$1", code)
            if ex:
                scheme_ids.append(ex["id"])
            else:
                row = await c.fetchrow("INSERT INTO sg_schemes (code,name,ministry,description,is_active) VALUES ($1,$2,$3,$4,$5) RETURNING id", code,name,ministry,desc,active)
                scheme_ids.append(row["id"])
                print(f"   + Scheme: {code}")

        # ── 20. SG Targets ─────────────────────────────────────────
        print("\n20. State Govt targets...")
        for sg in [7, sg_id2]:
            for sid in scheme_ids[:3]:
                ex = await c.fetchrow("SELECT id FROM sg_targets WHERE state_user_id=$1 AND scheme_id=$2 AND fy=$3", sg,sid,"2026-27")
                if not ex:
                    await c.execute("INSERT INTO sg_targets (state_user_id,scheme_id,fy,annual_target,q1_target,q2_target,q3_target,q4_target,q1_achieved,q2_achieved,q3_achieved,q4_achieved) VALUES ($1,$2,$3,5000,1250,1250,1250,1250,980,1100,0,0)", sg,sid,"2026-27")
        print("   Targets set for 2 state govts x 3 schemes")

        # ── 21. Vendor Candidates ───────────────────────────────────
        print("\n21. Vendor candidates...")
        vc_count = 0
        for vid in vendor_ids[:3]:
            bid_q = await c.fetchrow("SELECT id FROM vendor_batches WHERE vendor_id=$1 LIMIT 1", vid)
            if not bid_q: continue
            vbid = bid_q["id"]
            for cand_user_id in cand_ids[:4]:
                u = await c.fetchrow("SELECT name,gender FROM users WHERE id=$1", cand_user_id)
                if not u: continue
                ex = await c.fetchrow("SELECT id FROM vendor_candidates WHERE vendor_id=$1 AND user_id=$2", vid,cand_user_id)
                if not ex:
                    await c.execute("INSERT INTO vendor_candidates (vendor_id,batch_id,name,mobile,gender,category,scheme,enroll_date,attendance_pct,placement_status,status,user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", vid,vbid,u["name"],f"9900{vid:06d}",u["gender"] or "M","General","PMKVY","2026-06-01",85,"placed","enrolled",cand_user_id)
                    vc_count += 1
        print(f"   {vc_count} vendor candidate records added")

        # ── 22. Additional Jobs ─────────────────────────────────────
        print("\n22. Additional jobs...")
        extra_jobs = [
            (emp_ids[0],"Data Analyst","Analyse datasets and build dashboards",'["SQL","Python","Power BI"]',"Bengaluru","Full-time",600000,900000),
            (emp_ids[1],"SAP ABAP Developer","Develop and maintain SAP ABAP modules",'["SAP","ABAP","ERP"]',"Pune","Full-time",700000,1100000),
            (emp_ids[2],"Cyber Security Analyst","Monitor and protect network security",'["Network","Firewall","SOC"]',"Hyderabad","Full-time",800000,1200000),
            (emp_ids[3],"Delivery Executive","Handle last-mile delivery operations",'["Logistics","GPS"]',"Mumbai","Full-time",240000,360000),
            (emp_ids[4],"Relationship Manager SME","Manage SME banking relationships",'["Banking","Sales","CRM"]',"Chennai","Full-time",600000,900000),
            (emp_ids[0],"React Developer","Build responsive web applications",'["React","JavaScript","CSS"]',"Remote","Full-time",700000,1000000),
            (emp_ids[1],"QA Engineer","Design and execute test cases",'["Testing","Selenium","Python"]',"Bengaluru","Full-time",500000,750000),
        ]
        for (eid,title,desc,skills,loc,jtype,smin,smax) in extra_jobs:
            ex = await c.fetchrow("SELECT id FROM jobs WHERE employer_id=$1 AND title=$2", eid,title)
            if not ex:
                await c.execute("INSERT INTO jobs (employer_id,title,description,required_skills,location,job_type,salary_min,salary_max,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open')", eid,title,desc,skills,loc,jtype,smin,smax)
        print(f"   {len(extra_jobs)} jobs added")

        # ── 23. Candidate Certificates ──────────────────────────────
        print("\n23. Candidate certificates...")
        certs = [
            (ci(0),bi(0),"Python for Data Science","NSDC","Level 5","2026-07-25","CERT-2026-001"),
            (ci(1),bi(0),"Python for Data Science","NSDC","Level 5","2026-07-25","CERT-2026-002"),
            (ci(2),bi(1),"Power BI Dashboard","NSDC","Level 4","2026-05-30","CERT-2026-003"),
            (ci(3),bi(2),"English Communication","NSDC","Level 3","2026-08-31","CERT-2026-004"),
            (ci(5),bi(3),"Digital Marketing","NSDC","Level 4","2026-07-31","CERT-2026-005"),
        ]
        for (cid_,bid,course,issuer,level,date,cert_no) in certs:
            ex = await c.fetchrow("SELECT id FROM candidate_certificates WHERE candidate_id=$1 AND cert_no=$2", cid_,cert_no)
            if not ex:
                await c.execute("INSERT INTO candidate_certificates (candidate_id,enrollment_id,course_title,issuer,nsqf_level,issued_date,cert_no,status) VALUES ($1,NULL,$2,$3,$4,$5,$6,'valid')", cid_,course,issuer,level,date,cert_no)
        print(f"   {len(certs)} candidate certificates added")

        # ── 24. Update Candidate Profiles ───────────────────────────
        print("\n24. Updating candidate profiles...")
        await c.execute("UPDATE users SET location='Bengaluru',skills='[\"Python\",\"Data Science\",\"SQL\"]',experience_years=1,bio='M.Sc Data Science, Delhi University 2024' WHERE id=2")
        await c.execute("UPDATE users SET location='Pune',skills='[\"Java\",\"Testing\",\"Selenium\"]',experience_years=2,bio='B.Tech CSE, VIT 2022' WHERE id=3")
        if uid("priya.mehta@example.com"):
            await c.execute("UPDATE users SET location='Mumbai',skills='[\"Python\",\"ML\",\"TensorFlow\"]',experience_years=2,bio='B.Tech IT, VJTI 2023' WHERE id=$1", uid("priya.mehta@example.com"))
        if uid("arjun.singh@example.com"):
            await c.execute("UPDATE users SET location='Delhi',skills='[\"React\",\"Node.js\",\"MongoDB\"]',experience_years=1,bio='BCA, Delhi University 2024' WHERE id=$1", uid("arjun.singh@example.com"))
        print("   Candidate profiles updated")

        # ── 25. Final Counts ────────────────────────────────────────
        print("\n=== Final row counts ===")
        for t in ["users","courses","batches","batch_enrollments","enrollments","trainer_sessions","trainer_assessments","vendor_assessments","vendor_centres","vendor_candidates","csr_projects","csr_beneficiaries","csr_disbursements","csr_unspent_funds","placements","jobs","sg_training_partners","sg_schemes","sg_targets","geographic_coverage","accreditations","trainer_qualifications","trainer_certifications","candidate_certificates"]:
            n = await c.fetchval(f"SELECT COUNT(*) FROM {t}")
            print(f"   {t}: {n}")

    print("\n=== Seed complete! ===")
    await pool.close()


asyncio.run(run())
