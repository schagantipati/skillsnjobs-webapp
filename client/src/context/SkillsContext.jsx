import { createContext, useContext, useState } from 'react';

/* ── NSDL / Central Govt. Skill Registry ────────────────────────
   Source: NSDC Qualification Packs, PMKVY sector-wise job roles.
   Structure: Sector → Skills → Sub-skills (specialisations)
───────────────────────────────────────────────────────────────── */
export const NSDL_SKILLS = [
  {
    id: 'it',
    sector: 'Information Technology & ITeS',
    code: 'SSC/Q0101',
    icon: '💻',
    color: '#1E5FBF',
    skills: [
      { id: 'it-webdev',     name: 'Web Development',           subSkills: ['HTML5','CSS3','JavaScript','React.js','Angular','Vue.js','Node.js','PHP','WordPress','Bootstrap'] },
      { id: 'it-software',   name: 'Software Development',      subSkills: ['Java','Python','C++','C#','.NET','Spring Boot','Django','REST APIs','Microservices','Git'] },
      { id: 'it-data',       name: 'Data Science & Analytics',  subSkills: ['Python','R','SQL','Machine Learning','Deep Learning','Pandas','NumPy','TensorFlow','Power BI','Tableau'] },
      { id: 'it-cloud',      name: 'Cloud Computing',           subSkills: ['AWS','Azure','Google Cloud','Docker','Kubernetes','DevOps','CI/CD','Terraform','Linux','Networking'] },
      { id: 'it-cyber',      name: 'Cybersecurity',             subSkills: ['Network Security','Ethical Hacking','VAPT','SIEM','Firewall','CEH','CISSP','Incident Response','SOC','Cryptography'] },
      { id: 'it-mobile',     name: 'Mobile App Development',    subSkills: ['Android','iOS','React Native','Flutter','Kotlin','Swift','Xamarin','Firebase','App Store','Play Store'] },
      { id: 'it-bpo',        name: 'BPO / Customer Support',    subSkills: ['English Communication','CRM','Inbound Calling','Outbound Calling','Email Support','Chat Support','Data Entry','MS Office','Typing Speed','CSAT'] },
      { id: 'it-deo',        name: 'Data Entry & Back Office',  subSkills: ['MS Excel','MS Word','Typing','Tally','Data Verification','Document Management','Scanning','MIS Reports','Accuracy','Speed'] },
    ],
  },
  {
    id: 'health',
    sector: 'Healthcare & Life Sciences',
    code: 'HSS/Q5101',
    icon: '🏥',
    color: '#0A7B6C',
    skills: [
      { id: 'h-nurse',    name: 'Nursing & Patient Care',      subSkills: ['Basic Nursing','ICU Care','OT Assistance','Wound Dressing','Vital Signs','IV Administration','Catheterisation','Patient Handling','Infection Control','Medical Records'] },
      { id: 'h-pharma',   name: 'Pharmacy',                    subSkills: ['Drug Dispensing','Pharmacovigilance','Cold Chain Management','Drug Store Management','Prescription Reading','Quality Control','Labelling','Inventory','CDSCO Compliance','Compounding'] },
      { id: 'h-lab',      name: 'Medical Lab Technology',      subSkills: ['Blood Sample Collection','Phlebotomy','Haematology','Biochemistry','Microbiology','Pathology','Sample Processing','Lab Equipment','Report Generation','Quality Assurance'] },
      { id: 'h-radio',    name: 'Radiology & Imaging',         subSkills: ['X-Ray','MRI Assistance','CT Scan','Ultrasound','PACS','Radiation Safety','Patient Positioning','Film Processing','Digital Imaging','AERB Compliance'] },
      { id: 'h-gda',      name: 'General Duty Assistant',      subSkills: ['Patient Escort','Stretcher Handling','Linen Management','Sanitation','Sterilisation','Ward Assistance','CSSD','Biomedical Waste','Hospital Housekeeping','Compassionate Care'] },
      { id: 'h-dental',   name: 'Dental Assistance',           subSkills: ['Sterilisation','Chairside Assistance','Dental Records','Radiography','Impression Taking','Infection Control','Instrument Management','Patient Communication','Orthodontic Assistance','Preventive Care'] },
    ],
  },
  {
    id: 'construct',
    sector: 'Construction',
    code: 'CON/Q0101',
    icon: '🏗️',
    color: '#D97706',
    skills: [
      { id: 'c-mason',    name: 'Masonry',                     subSkills: ['Brick Laying','Plastering','Flooring','Tile Fixing','Waterproofing','Shuttering','Scaffolding','Stone Masonry','RCC Work','Quality Checking'] },
      { id: 'c-bar',      name: 'Bar Bending & Steel Fixing',  subSkills: ['Bar Bending','Steel Fixing','Blueprint Reading','Cutting','Welding','Rebar Tying','Column Reinforcement','Slab Reinforcement','Safety','IS Code'] },
      { id: 'c-elec',     name: 'Electrical Work',             subSkills: ['Wiring','Switch Board','Earthing','MCB/ELCB','Conduit Laying','Panel Wiring','Solar Wiring','Cable Laying','Testing','IS Standards'] },
      { id: 'c-plumb',    name: 'Plumbing',                    subSkills: ['Pipe Fitting','Drainage','Sanitary','Hot & Cold Water','Fixtures','Leak Repair','CPVC/UPVC','Sewer Lines','Pressure Testing','NBC Compliance'] },
      { id: 'c-paint',    name: 'Interior Painting & Finishing',subSkills: ['Surface Preparation','Putty','Primer','Emulsion Painting','Enamel Painting','Texture Painting','Waterproofing Coating','Wall Putty','POP Work','Colour Mixing'] },
      { id: 'c-hvac',     name: 'HVAC & Refrigeration',        subSkills: ['AC Installation','AC Servicing','Split AC','Duct Work','Refrigerant Handling','VRF Systems','AHU','Chiller','Energy Audit','BMS'] },
    ],
  },
  {
    id: 'manuf',
    sector: 'Manufacturing & Engineering',
    code: 'CSC/Q0101',
    icon: '🏭',
    color: '#7C3AED',
    skills: [
      { id: 'm-cnc',      name: 'CNC / Machine Operation',     subSkills: ['CNC Turning','CNC Milling','G-Code','M-Code','AutoCAD','Mastercam','Tool Setting','Quality Inspection','VMC','HMC'] },
      { id: 'm-weld',     name: 'Welding & Fabrication',       subSkills: ['MIG Welding','TIG Welding','Arc Welding','Gas Cutting','Plasma Cutting','Spot Welding','Pipe Welding','Structural Welding','NDT','IS 2062'] },
      { id: 'm-fitter',   name: 'Fitter / Maintenance',        subSkills: ['Assembly','Fitting','Maintenance','Hydraulics','Pneumatics','Bearings','Gearbox','Blueprint Reading','Precision Measurement','Preventive Maintenance'] },
      { id: 'm-quality',  name: 'Quality Control & Inspection', subSkills: ['CMM','Vernier Caliper','Micrometer','GO/NOGO Gauge','SPC','Six Sigma','ISO 9001','Defect Analysis','FMEA','Sampling'] },
      { id: 'm-electric', name: 'Industrial Electrician',       subSkills: ['PLC Programming','SCADA','VFD','Transformer','HT/LT','Panel Wiring','Motor Winding','Cable Termination','Earthing','IS Standards'] },
    ],
  },
  {
    id: 'retail',
    sector: 'Retail',
    code: 'RAS/Q0101',
    icon: '🛍️',
    color: '#BE185D',
    skills: [
      { id: 'r-sales',    name: 'Retail Sales',                subSkills: ['Customer Service','POS Operation','Visual Merchandising','Upselling','Stock Management','Cash Handling','Product Knowledge','Complaint Handling','KPI Awareness','CRM'] },
      { id: 'r-ecom',     name: 'E-Commerce Operations',       subSkills: ['Product Listing','Catalogue Management','Order Processing','Warehouse Picking','Returns Handling','Marketplace (Amazon/Flipkart)','Inventory','Customer Queries','Packaging','Dispatch'] },
      { id: 'r-store',    name: 'Store Management',            subSkills: ['Team Management','Stock Audit','P&L Basics','Shrinkage Control','Planogram','Shift Management','Vendor Coordination','Sales Reporting','Staff Training','Store Hygiene'] },
    ],
  },
  {
    id: 'agri',
    sector: 'Agriculture & Allied',
    code: 'AGR/Q1001',
    icon: '🌾',
    color: '#166534',
    skills: [
      { id: 'ag-crop',    name: 'Crop Production',             subSkills: ['Seed Selection','Land Preparation','Sowing','Irrigation','Fertilisation','Pest Management','Harvesting','Post Harvest','Organic Farming','SRI Method'] },
      { id: 'ag-hort',    name: 'Horticulture',                subSkills: ['Nursery Management','Grafting','Pruning','Protected Cultivation','Drip Irrigation','Floriculture','Vegetable Cultivation','Fruit Crops','Poly House','Market Linkage'] },
      { id: 'ag-animal',  name: 'Animal Husbandry',            subSkills: ['Dairy Farming','Poultry','Goat Rearing','Vaccination','Artificial Insemination','Feed Management','Milk Collection','Disease Management','Record Keeping','Animal Nutrition'] },
      { id: 'ag-organic', name: 'Organic Farming',             subSkills: ['Vermicompost','Bio Pesticides','Crop Rotation','Soil Health','Certification (PGS/NPOP)','Green Manure','Integrated Farming','FPO Management','Record Keeping','Market Access'] },
    ],
  },
  {
    id: 'finance',
    sector: 'Banking, Financial Services & Insurance',
    code: 'BFSI/Q0101',
    icon: '🏦',
    color: '#0891B2',
    skills: [
      { id: 'b-bank',     name: 'Banking Operations',          subSkills: ['Teller Operations','KYC','Account Opening','Loan Processing','NEFT/RTGS','Banking Software','Audit','Compliance','RBI Guidelines','Customer Service'] },
      { id: 'b-insure',   name: 'Insurance',                   subSkills: ['Life Insurance','Health Insurance','Motor Insurance','Policy Issuance','Claims Processing','IRDA Compliance','Underwriting','Actuarial Basics','Sales','Renewal'] },
      { id: 'b-account',  name: 'Accounting & Taxation',       subSkills: ['Tally','GST','TDS','Payroll','Bookkeeping','Balance Sheet','P&L','Financial Statements','Audit Support','Income Tax'] },
      { id: 'b-mf',       name: 'Mutual Funds & Securities',   subSkills: ['AMFI Certification','Equity','Debt','SIP','Portfolio Management','NISM','Demat Operations','KYC','Risk Profiling','Investor Education'] },
    ],
  },
  {
    id: 'edu',
    sector: 'Education & Training',
    code: 'EDT/Q0101',
    icon: '🎓',
    color: '#065F46',
    skills: [
      { id: 'e-teach',    name: 'Teaching & Instruction',      subSkills: ['Lesson Planning','Classroom Management','Pedagogy','Assessment Design','Bloom\'s Taxonomy','NEP 2020','Learning Outcomes','Special Education','Digital Teaching','Parent Communication'] },
      { id: 'e-skill',    name: 'Skill Training & Facilitation',subSkills: ['Training Needs Analysis','Content Development','Facilitation','Assessment','LMS','Blended Learning','Simulation Training','On-the-Job Training','Training Evaluation','Certification'] },
      { id: 'e-counsel',  name: 'Counselling & Career Guidance',subSkills: ['Career Counselling','Psychometric Assessment','Resume Writing','Interview Prep','Soft Skills','Aptitude Testing','Job Placement','Career Mapping','Industry Connect','Mentoring'] },
    ],
  },
  {
    id: 'media',
    sector: 'Media & Entertainment',
    code: 'MES/Q0101',
    icon: '🎬',
    color: '#C0392B',
    skills: [
      { id: 'med-design', name: 'Graphic Design',              subSkills: ['Photoshop','Illustrator','InDesign','CorelDRAW','Typography','Branding','UI Design','Print Design','Social Media Creatives','Motion Graphics'] },
      { id: 'med-video',  name: 'Video Production',            subSkills: ['Camera Operation','Lighting','Sound','Editing (Premiere)','After Effects','Colour Grading','Storyboarding','YouTube','OTT','Drone Operations'] },
      { id: 'med-dig',    name: 'Digital Marketing',           subSkills: ['SEO','SEM','Google Ads','Meta Ads','Email Marketing','Content Marketing','Analytics','Social Media','Affiliate Marketing','Influencer Marketing'] },
    ],
  },
  {
    id: 'hospitality',
    sector: 'Hospitality & Tourism',
    code: 'THC/Q0101',
    icon: '🏨',
    color: '#9D174D',
    skills: [
      { id: 'ho-fd',      name: 'Food & Beverage Service',     subSkills: ['Table Setting','Menu Knowledge','Order Taking','Upselling','Bar Service','Buffet Service','Banquet Service','Fine Dining','Hygiene Standards','Guest Relations'] },
      { id: 'ho-house',   name: 'Housekeeping',                subSkills: ['Room Cleaning','Linen Management','Laundry','Public Area Cleaning','Turn-Down Service','Lost & Found','Chemical Handling','Guest Supplies','Pest Control','Quality Standards'] },
      { id: 'ho-fd2',     name: 'Food Production (Kitchen)',   subSkills: ['Indian Cuisine','Continental','Chinese','Bakery','Pastry','HACCP','Knife Skills','Mise-en-place','Menu Planning','Food Costing'] },
      { id: 'ho-front',   name: 'Front Office Operations',     subSkills: ['Check-in/Check-out','PMS Software','Reservation','Concierge','Billing','Guest Complaint Handling','Upselling','Night Audit','Room Assignment','Communication'] },
    ],
  },
  {
    id: 'auto',
    sector: 'Automotive',
    code: 'ASC/Q1401',
    icon: '🚗',
    color: '#374151',
    skills: [
      { id: 'a-service',  name: 'Automotive Service Technician',subSkills: ['Engine Repair','Transmission','Brakes','Suspension','AC Service','Electrical Systems','Wheel Alignment','Balancing','Diagnostics (OBD)','Service Advisor'] },
      { id: 'a-ev',       name: 'Electric Vehicle Technology',  subSkills: ['EV Battery','Battery Management System','Motor Control','Charging Infrastructure','High Voltage Safety','CAN Bus','EV Diagnostics','Range Optimization','OEM Software','EV Service'] },
      { id: 'a-body',     name: 'Automotive Body Repair',       subSkills: ['Dent Removal','Panel Beating','Spray Painting','Colour Matching','Putty Work','PPF','Wrapping','Rust Treatment','Headlight Restoration','Quality Check'] },
    ],
  },
  {
    id: 'govt',
    sector: 'Government & Public Administration',
    code: 'GOV/Q0101',
    icon: '🏛️',
    color: '#1F2937',
    skills: [
      { id: 'g-csc',      name: 'Common Service Centre (CSC)', subSkills: ['DigiPay','AEPS','PAN Card','Passport','Aadhaar Services','Insurance','Banking Correspondent','G2C Services','Digital Literacy','PMGDISHA'] },
      { id: 'g-admin',    name: 'Office Administration',        subSkills: ['File Management','Notesheets','RTI','Dak Management','MS Office','E-Office','CPGRAMS','Letter Drafting','Official Correspondence','Government Procedures'] },
    ],
  },
];

/* ── Context ─────────────────────────────────────────────────── */
const SkillsContext = createContext(null);

export function SkillsProvider({ children }) {
  const [skills, setSkills] = useState(NSDL_SKILLS);

  /* Flat list of all skill names for simple dropdowns */
  const allSkillNames = skills.flatMap(s => s.skills.map(sk => sk.name));

  /* Flat list of all sub-skill names */
  const allSubSkillNames = skills.flatMap(s => s.skills.flatMap(sk => sk.subSkills));

  /* Get sub-skills for a given skill name */
  function getSubSkills(skillName) {
    for (const s of skills) {
      const sk = s.skills.find(x => x.name === skillName);
      if (sk) return sk.subSkills;
    }
    return [];
  }

  /* Get sector for a skill name */
  function getSector(skillName) {
    for (const s of skills) {
      if (s.skills.some(x => x.name === skillName)) return s.sector;
    }
    return null;
  }

  return (
    <SkillsContext.Provider value={{ skills, setSkills, allSkillNames, allSubSkillNames, getSubSkills, getSector }}>
      {children}
    </SkillsContext.Provider>
  );
}

export function useSkills() {
  const ctx = useContext(SkillsContext);
  if (!ctx) throw new Error('useSkills must be used inside SkillsProvider');
  return ctx;
}

/* ── Reusable SkillPicker component ─────────────────────────────
   Drop-in replacement wherever skills are selected.
   Props:
     value: string[]        selected skill names
     onChange: (string[]) => void
     placeholder?: string
     maxItems?: number
     showSubSkills?: boolean   if true, also show sub-skill tags
────────────────────────────────────────────────────────────────── */
export function SkillPicker({ value = [], onChange, placeholder = 'Search and select skills…', maxItems, showSubSkills = false }) {
  const { skills } = useSkills();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = search.length > 0
    ? skills.flatMap(s => s.skills
        .filter(sk => sk.name.toLowerCase().includes(search.toLowerCase()) || sk.subSkills.some(ss => ss.toLowerCase().includes(search.toLowerCase())))
        .map(sk => ({ ...sk, sector: s.sector, color: s.color })))
    : [];

  function toggle(name) {
    if (value.includes(name)) onChange(value.filter(v => v !== name));
    else if (!maxItems || value.length < maxItems) onChange([...value, name]);
  }

  function removeSubSkill(sub) { onChange(value.filter(v => v !== sub)); }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px', border: '1.5px solid #DDE3EE', borderRadius: 9, background: '#FAFBFD', minHeight: 42, cursor: 'text', alignItems: 'center' }}
        onClick={() => { setOpen(true); }}>
        {value.map(v => (
          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#1E5FBF', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: '1px solid #BFDBFE' }}>
            {v}
            <button onClick={e => { e.stopPropagation(); onChange(value.filter(x => x !== v)); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E5FBF', fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
        <input value={search} onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, minWidth: 120 }} />
      </div>
      {open && search.length > 0 && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #DDE3EE', borderRadius: 10, zIndex: 999, maxHeight: 260, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.12)', marginTop: 4 }}>
          {filtered.map(sk => (
            <div key={sk.id} onClick={() => { toggle(sk.name); setSearch(''); }}
              style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10,
                background: value.includes(sk.name) ? '#EFF6FF' : '#fff' }}
              onMouseEnter={e => { if (!value.includes(sk.name)) e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={e => { if (!value.includes(sk.name)) e.currentTarget.style.background = '#fff'; }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E3D' }}>{sk.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sk.sector}</div>
              </div>
              {value.includes(sk.name) && <span style={{ color: '#10B981', fontSize: 16 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(''); }} />
      )}
    </div>
  );
}
