import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES, validatePassingYear, validateText } from '../utils/validators.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPreferences from '../components/AccountPreferences.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

/* ─── palette ─────────────────────────────────────────────────── */
const C = {
  saffron:'#FF6B00', saffronDark:'#E05A00', saffronPale:'#FFF3EB',
  navy:'#003366',
  teal:'#007B5E', tealPale:'#E6F4F1',
  green:'#28A745', greenPale:'#E8F5E9',
  blue:'#0057A8', bluePale:'#E8F0FB',
  gold:'#F4A900', goldPale:'#FEF8E7',
  sidebar:'#010E3C',
  surface:'#F4F6F9', card:'#FFFFFF',
  border:'#E0E6EF', ink:'#1A2B4A', ink2:'#3D5170', ink3:'#6B7FA3',
};
const SW = 220;   // sidebar width
const TH = 58;    // topbar height

/* ─── nav structure ────────────────────────────────────────────── */
const NAV = [
  { section:'Main', items:[
    { id:'dashboard',     icon:'🏠', label:'Dashboard' },
    { id:'profile', icon:'👤', label:'My Profile', children:[
      { id:'profile-basic', label:'Basic Information' },
      { id:'profile-edu',   label:'Education Details' },
      { id:'profile-exp',   label:'Work Experience' },
      { id:'profile-skills',label:'Skills & Competencies' },
      { id:'profile-docs',  label:'Documents & ID Proof' },
      { id:'profile-pref',  label:'Job Preferences' },
    ]},
    { id:'notifications', icon:'🔔', label:'Notifications', badge:3 },
  ]},
  { section:'Courses & Learning', items:[
    { id:'courses', icon:'📚', label:'Courses', children:[
      { id:'browse-courses',   label:'Browse Courses' },
      { id:'my-courses',       label:'My Enrolled Courses' },
      { id:'course-progress',  label:'Learning Progress' },
      { id:'certificates',     label:'My Certificates' },
      { id:'course-recommend', label:'AI Recommendations' },
    ]},
    { id:'assessments', icon:'📝', label:'Assessments', children:[
      { id:'assess-upcoming',  label:'Upcoming' },
      { id:'assess-completed', label:'Completed' },
      { id:'assess-results',   label:'Results & Scorecards' },
      { id:'rpl',              label:'RPL Assessment' },
    ]},
    { id:'certificates', icon:'🏆', label:'Certificates' },
  ]},
  { section:'Career & AI Tools', items:[
    { id:'skill-passport', icon:'🏅', label:'Skill Passport', badge:'NEW', badgeBlue:true },
    { id:'ai-tools', icon:'🤖', label:'AI Tools', children:[
      { id:'resume-builder-ai', label:'Resume Builder', badge:'AI', badgeBlue:true },
      { id:'ai-skill-gap',      label:'AI Skill Gap',   badge:'AI', badgeBlue:true },
    ]},
    { id:'career-group', icon:'🚀', label:'Career', children:[
      { id:'interviews',          label:'Interviews' },
      { id:'mock-interviews',     label:'Mock Interviews' },
      { id:'career-counselling',  label:'Career Counselling' },
      { id:'career-path',         label:'Career Pathways' },
      { id:'skills-endorsements', label:'Skills & Endorsements' },
    ]},
  ]},
  { section:'Jobs & Employment', items:[
    { id:'jobs', icon:'💼', label:'Jobs', children:[
      { id:'browse-jobs',     label:'Browse Jobs' },
      { id:'my-applications', label:'My Applications' },
      { id:'saved-jobs',      label:'Saved Jobs' },
      { id:'job-alerts',      label:'Job Alerts' },
      { id:'placement-status',label:'Placement Status' },
    ]},
    { id:'apprenticeship', icon:'🔧', label:'Apprenticeship', children:[
      { id:'apprentice-browse', label:'Browse Opportunities' },
      { id:'apprentice-applied',label:'Applied' },
      { id:'naps',              label:'NAPS Registration' },
    ]},
  ]},
  { section:'Schemes & Benefits', items:[
    { id:'schemes', icon:'🏛️', label:'Govt Schemes', children:[
      { id:'pmkvy',      label:'PMKVY 4.0' },
      { id:'naps-scheme',label:'NAPS / NATS' },
      { id:'rpl-scheme', label:'RPL — Prior Learning' },
      { id:'pmegp',      label:'PMEGP / Startup' },
      { id:'scholarship',label:'Scholarships & Stipends' },
    ]},
    { id:'financial-aid', icon:'💰', label:'Financial Assistance' },
  ]},
  { section:'User Preferences', items:[
    { id:'settings', icon:'⚙️', label:'Account Preferences' },
  ]},
  { section:'Support', items:[
    { id:'helpdesk',  icon:'🎧', label:'Help & Support' },
    { id:'grievance', icon:'📣', label:'Grievance' },
    { id:'faq',       icon:'❓', label:'FAQ' },
  ]},
];

/* ─── shared micro-components ──────────────────────────────────── */
function KpiCard({ icon, value, label, sub, accent }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
      padding:'16px 18px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg,${accent},${accent}99)` }} />
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:800, color:C.navy, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11.5, color:C.ink3, marginTop:5, fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:10.5, fontWeight:700, color:accent, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function ProgBar({ pct, color }) {
  return (
    <div style={{ height:6, background:C.border, borderRadius:4, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:4 }} />
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
      padding:'18px 20px', ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ children, action, onAction }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontWeight:700, fontSize:13, color:C.navy }}>{children}</span>
      {action && <span style={{ fontSize:12, color:C.saffron, cursor:'pointer', fontWeight:600 }}
        onClick={onAction}>{action} →</span>}
    </div>
  );
}

function Btn({ children, primary, sm, onClick, style: extra }) {
  return (
    <button onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: sm ? '5px 12px' : '8px 18px',
      borderRadius:8, fontWeight:700, fontSize: sm ? 12 : 13, cursor:'pointer',
      background: primary ? C.blue : 'transparent',
      color: primary ? '#fff' : C.ink2,
      border: primary ? 'none' : `1.5px solid ${C.border}`,
      ...extra,
    }}>{children}</button>
  );
}

function SectionHead({ title }) {
  return (
    <div style={{ marginBottom:20 }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>{title}</h1>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{ background:'#F8FAFC', padding:'10px 14px', textAlign:'left', fontSize:11,
      fontWeight:700, color:C.ink3, borderBottom:`1.5px solid ${C.border}`,
      textTransform:'uppercase', letterSpacing:'.04em' }}>{children}</th>
  );
}

function Td({ children, bold }) {
  return (
    <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`,
      color: bold ? C.ink : C.ink2, fontWeight: bold ? 600 : 400 }}>{children}</td>
  );
}

function StatusTag({ status }) {
  const m = {
    shortlisted:[C.tealPale,C.teal], hired:[C.greenPale,C.green],
    rejected:['#FEE2E2','#DC2626'], applied:[C.saffronPale,C.saffron],
    pending:[C.saffronPale,C.saffron], interview:['#EDE9FE','#7C3AED'],
  };
  const [bg, fg] = m[(status||'').toLowerCase()] || [C.bluePale, C.blue];
  return (
    <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:20,
      fontSize:10.5, fontWeight:700, background:bg, color:fg }}>
      {status || 'Applied'}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

// Flat search index — built once at module level (NAV never changes)
const SEARCH_INDEX = NAV.flatMap(s => s.items.flatMap(item => {
  const rows = [{ id: item.id, label: item.label, icon: item.icon || '📌', section: s.section }];
  if (item.children) item.children.forEach(c => rows.push({ id: c.id, label: c.label, icon: item.icon || '📌', section: item.label }));
  return rows;
}));

function ValidInp({ placeholder, defaultValue, value: valueProp, type='text', validate: vtype, required }) {
  const [val, setVal] = useState(typeof defaultValue !== 'undefined' ? String(defaultValue) : (typeof valueProp !== 'undefined' ? String(valueProp) : ''));
  const [error, setError] = useState('');
  function handleChange(e) {
    let v = e.target.value;
    if (vtype && UPPERCASE_TYPES.has(vtype)) v = v.toUpperCase();
    setVal(v);
    if (error) setError('');
  }
  function handleBlur(e) {
    const v = e.target.value.trim();
    if (required && !v) { setError('This field is required'); return; }
    if (vtype && v) { setError(fieldValidate(vtype, v)); }
    else setError('');
  }
  const borderColor = error ? '#C0392B' : (val && vtype && !fieldValidate(vtype, val)) ? '#1A7C3E' : '#dde2eb';
  return (
    <div style={{ width:'100%' }}>
      <input type={type} placeholder={placeholder} value={val}
        onChange={handleChange} onBlur={handleBlur}
        style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${borderColor}`,
          borderRadius:8, fontSize:13.5, outline:'none',
          background: error ? '#FEF2F2' : '#fafbfc', fontFamily:'inherit' }} />
      {error && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {error}</div>}
    </div>
  );
}

export default function CandidatePortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [active,      setActive]    = useState('dashboard');
  const [openMenus,   setOpenMenus] = useState({});
  const [isMobile,    setIsMobile]  = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuPerms,   setMenuPerms] = useState({});
  const [jobs,        setJobs]      = useState([]);
  const [courses,     setCourses]   = useState([]);
  const [myApps,      setMyApps]    = useState([]);
  const [myEnroll,    setMyEnroll]  = useState([]);
  const [dbStats,     setDbStats]   = useState({});
  const [loading,     setLoading]   = useState(true);
  const [applyingId,  setApplyingId]= useState(null);
  const [enrollingId, setEnrollingId]=useState(null);
  const [enrollBatchModal, setEnrollBatchModal] = useState(null); // course object | null
  const [availBatches, setAvailBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [toast,       setToast]     = useState(null);
  const [searchQ,     setSearchQ]   = useState('');
  const [searchOpen,  setSearchOpen]= useState(false);
  const [myCerts,     setMyCerts]   = useState([]);
  const [myPlacements,setMyPlacements]= useState([]);
  const [grievances,  setGrievances]= useState([]);
  const [grievForm,   setGrievForm] = useState({ category:'', subject:'', description:'' });
  const [grievSaving, setGrievSaving]= useState(false);
  const [grievMsg,    setGrievMsg]  = useState('');
  const [jobAlertsSaved, setJobAlertsSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('snj_job_alerts') || 'null'); } catch { return null; }
  });
  const [jobAlertsForm, setJobAlertsForm] = useState({ role:'', sector:'', location:'', frequency:'Daily' });

  const [profileDraft, setProfileDraft] = useState(() => ({
    first_name: '', last_name: '', dob: '', gender: '', phone: '', bio: '',
    address_line1: '', address_line2: '', city: '', state_name: '', district: '', pincode: '', category: '',
    bank_account_number: '', bank_ifsc: '',
    edu_level: '', edu_board: '', edu_year: '', edu_institute: '',
    emp_status: '', exp_sector: '',
    skill_category: '', skill_name: '', skill_proficiency: '',
    pref_role: '', pref_emp_type: '', pref_salary: '', pref_sector: '', pref_state: '',
  }));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [docFiles, setDocFiles] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [experiences, setExperiences] = useState([{
    org:'', designation:'', sector:'', nature:'', joining_date:'', leaving_date:'', responsibilities:'', salary:'', reason:''
  }]);
  const [assessData, setAssessData] = useState(null);
  const [assessLoading, setAssessLoading] = useState(true);
  // Resume Builder AI panel state
  const [rbStep, setRbStep] = useState(1);
  const [rbForm, setRbForm] = useState({ objective:'', skills:'', experience:'', education:'' });
  const [rbGenerated, setRbGenerated] = useState('');
  const [rbLoading, setRbLoading] = useState(false);
  // Skills & Endorsements panel state
  const [newSkill, setNewSkill] = useState('');
  // AI Skill Gap panel state
  const [skillGapData, setSkillGapData] = useState(null);
  const [skillGapLoading, setSkillGapLoading] = useState(true);
  // Interviews panel state
  const [interviewTab, setInterviewTab] = useState('mock');
  // Saved Jobs
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  // Job Alerts (DB)
  const [jobAlertDb, setJobAlertDb] = useState(null);
  const [jobAlertLoading, setJobAlertLoading] = useState(true);
  // Notifications (DB)
  const [dbNotifications, setDbNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  // Resume (DB)
  const [dbResume, setDbResume] = useState(null);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [aiJobMatches, setAiJobMatches] = useState({ jobs: [] });
  const [courseRecs, setCourseRecs] = useState({ topSkillGaps: [], recommendedCourses: [] });
  const [previewCert, setPreviewCert] = useState(null);
  // AI Chatbot state
  const [chatOpen,    setChatOpen]   = useState(false);
  const [chatMsgs,    setChatMsgs]   = useState([{ role:'assistant', text:'Hi Aisha! 👋 I\'m your SkillsnJobs AI assistant. Ask me about jobs, courses, schemes, or your profile.' }]);
  const [chatInput,   setChatInput]  = useState('');
  const [chatLoading, setChatLoading]= useState(false);
  // Resume upload + AI parse
  const [resumeParseLoading, setResumeParseLoading] = useState(false);
  const [resumeParseMsg,     setResumeParseMsg]     = useState('');
  // AI Interview Coach
  const [interviewRole,    setInterviewRole]    = useState('');
  const [interviewQs,      setInterviewQs]      = useState([]);
  const [interviewAnswers, setInterviewAnswers] = useState({});
  const [interviewScores,  setInterviewScores]  = useState(null);
  const [interviewGenLoading, setInterviewGenLoading] = useState(false);
  const [interviewScoreLoading, setInterviewScoreLoading] = useState(false);
  // Withdraw & match explain
  const [withdrawingId,   setWithdrawingId]   = useState(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState(null);
  const [matchExplainJob, setMatchExplainJob] = useState(null);
  const [matchExplainText,setMatchExplainText]= useState('');
  const [matchExplainLoading, setMatchExplainLoading] = useState(false);
  const [appSearch, setAppSearch] = useState('');

  useEffect(() => {
    const pin = profileDraft.pincode?.trim();
    if (!pin || pin.length !== 6) return;
    let cancelled = false;
    setPinLoading(true);
    fetch(`https://api.postalpincode.in/pincode/${pin}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data[0]?.Status === 'Success') {
          const po = data[0].PostOffice[0];
          setProfileDraft(d => ({ ...d, state_name: po.State, district: po.District, city: po.Division || po.Block || po.Name }));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPinLoading(false); });
    return () => { cancelled = true; };
  }, [profileDraft.pincode]);

  useEffect(() => {
    api.savedJobs().then(d => { setSavedJobs(d || []); setSavedJobIds(new Set((d||[]).map(j=>j.job_id))); }).catch(()=>{});
    api.getJobAlert().then(d => setJobAlertDb(d && d.id ? d : null)).catch(()=>{}).finally(()=>setJobAlertLoading(false));
    api.candidateNotifications().then(d => setDbNotifications(d||[])).catch(()=>{}).finally(()=>setNotifsLoading(false));
    api.getResume().then(d => setDbResume(d && d.id ? d : null)).catch(()=>{});
  }, []);

  useEffect(() => {
    api.myAssessments()
      .then(d => setAssessData(d))
      .catch(() => setAssessData({ upcoming: [], completed: [] }))
      .finally(() => setAssessLoading(false));
  }, []);

  useEffect(() => {
    api.skillGapAnalysis()
      .then(d => setSkillGapData(d))
      .catch(() => setSkillGapData(null))
      .finally(() => setSkillGapLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      const prefs = (() => { try { return JSON.parse(user.interests || '{}'); } catch { return {}; } })();
      setProfileDraft(d => ({
        ...d,
        first_name:  user.first_name  || user.name?.split(' ')[0] || '',
        last_name:   user.last_name   || user.name?.split(' ').slice(1).join(' ') || '',
        dob:         user.dob         || '',
        gender:      user.gender      || '',
        phone:       (user.phone || '').replace(/^\+91/, ''),
        bio:         user.bio         || '',
        address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '',
        city:          user.city          || '',
        state_name:    user.state_name    || '',
        pincode:       user.pincode       || '',
        category:      user.category      || '',
        bank_account_number: user.bank_account_number || '',
        bank_ifsc:           user.bank_ifsc           || '',
        // Education
        edu_level:     user.qualification  || '',
        edu_board:     user.board          || '',
        edu_year:      user.year_passed    || '',
        edu_institute: user.university     || '',
        // Employment & preferences
        emp_status:    user.employment_status || '',
        pref_sector:   user.preferred_sector  || '',
        pref_role:     prefs.pref_role     || '',
        pref_emp_type: prefs.pref_emp_type || '',
        pref_salary:   prefs.pref_salary   || '',
        pref_state:    prefs.pref_state    || '',
        // Skills
        skill_category:   prefs.skill_category   || '',
        skill_name:       prefs.skill_name       || '',
        skill_proficiency: prefs.skill_proficiency || '',
      }));
    }
  }, [user?.id]);

  async function saveProfileDraft() {
    setProfileSaving(true); setProfileMsg('');
    try {
      const d = profileDraft;
      const prefs = {
        pref_role: d.pref_role || '', pref_emp_type: d.pref_emp_type || '',
        pref_salary: d.pref_salary || '', pref_state: d.pref_state || '',
        skill_category: d.skill_category || '', skill_name: d.skill_name || '',
        skill_proficiency: d.skill_proficiency || '',
      };
      await api.updateMe({
        first_name:    d.first_name   || null,
        last_name:     d.last_name    || null,
        dob:           d.dob          || null,
        gender:        d.gender       || null,
        phone:         d.phone ? '+91' + d.phone : null,
        bio:           d.bio          || null,
        address_line1: d.address_line1 || null,
        address_line2: d.address_line2 || null,
        city:          d.city          || null,
        state_name:    d.state_name    || null,
        pincode:       d.pincode       || null,
        category:      d.category      || null,
        bank_account_number: d.bank_account_number || null,
        bank_ifsc:     d.bank_ifsc     || null,
        // Education → direct DB columns
        qualification: d.edu_level     || null,
        board:         d.edu_board     || null,
        year_passed:   d.edu_year      || null,
        university:    d.edu_institute || null,
        // Employment & preferences
        employment_status: d.emp_status  || null,
        preferred_sector:  d.pref_sector || null,
        // Remaining preferences stored as JSON in interests
        interests: JSON.stringify(prefs),
      });
      setProfileMsg('Draft saved successfully.');
    } catch { setProfileMsg('Save failed. Please try again.'); }
    setProfileSaving(false);
  }

  function validateStep(stepId) {
    const d = profileDraft;
    const errs = {};
    const nameRe = /^[A-Za-z\s'.'-]{2,50}$/;
    const currentYear = new Date().getFullYear();

    if (stepId === 'profile-basic') {
      // Names
      if (!d.first_name?.trim())
        errs.first_name = 'First Name is required';
      else if (d.first_name.trim().length < 2)
        errs.first_name = 'First Name must be at least 2 characters';
      else if (!nameRe.test(d.first_name.trim()))
        errs.first_name = 'First Name must contain only letters';

      if (!d.last_name?.trim())
        errs.last_name = 'Last Name is required';
      else if (d.last_name.trim().length < 1)
        errs.last_name = 'Last Name is required';
      else if (!nameRe.test(d.last_name.trim()))
        errs.last_name = 'Last Name must contain only letters';

      // Date of birth — must be 14–80 years old
      if (!d.dob) {
        errs.dob = 'Date of Birth is required';
      } else {
        const dob = new Date(d.dob);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        if (isNaN(dob.getTime()))  errs.dob = 'Invalid date';
        else if (age < 14)         errs.dob = 'Must be at least 14 years old';
        else if (age > 80)         errs.dob = 'Date of Birth seems too far in the past';
      }

      if (!d.gender) errs.gender = 'Gender is required';

      // Mobile — 10 digits starting with 6-9
      if (!d.phone?.trim())
        errs.phone = 'Mobile Number is required';
      else if (!/^[6-9]\d{9}$/.test(d.phone.trim()))
        errs.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6–9)';

      if (!d.category) errs.category = 'Category is required';

      // Bio — optional but max 500 chars
      if (d.bio && d.bio.length > 500)
        errs.bio = `Bio must be under 500 characters (${d.bio.length}/500)`;

      // Address
      if (!d.address_line1?.trim())
        errs.address_line1 = 'Address Line 1 is required';
      else if (d.address_line1.trim().length < 5)
        errs.address_line1 = 'Please enter a more complete address';

      if (!d.city?.trim())    errs.city       = 'City / Town is required';
      if (!d.state_name)      errs.state_name = 'State is required';

      if (!d.pincode?.trim())
        errs.pincode = 'PIN Code is required';
      else if (!/^\d{6}$/.test(d.pincode.trim()))
        errs.pincode = 'PIN Code must be exactly 6 digits';
    }

    if (stepId === 'profile-edu') {
      if (!d.edu_level) errs.edu_level = 'Highest Education Level is required';

      if (!d.edu_board?.trim())
        errs.edu_board = 'Board / University name is required';
      else if (d.edu_board.trim().length < 3)
        errs.edu_board = 'Please enter the full board or university name';

      if (!d.edu_year) {
        errs.edu_year = 'Year of Passing is required';
      } else {
        const yr = parseInt(d.edu_year, 10);
        if (yr < 1960 || yr > currentYear)
          errs.edu_year = `Year must be between 1960 and ${currentYear}`;
        else { const yErr = validatePassingYear(d.edu_year, 'Year of Passing'); if (yErr) errs.edu_year = yErr; }
      }

      if (!d.edu_institute?.trim())
        errs.edu_institute = 'Institute Name is required';
      else if (d.edu_institute.trim().length < 3)
        errs.edu_institute = 'Please enter the full institute name';
    }

    if (stepId === 'profile-exp') {
      if (!d.emp_status) errs.emp_status = 'Current Employment Status is required';
      if (!d.exp_sector) errs.exp_sector = 'Sector / Industry is required';
      // Validate each experience entry if not fresher
      if (d.emp_status && d.emp_status !== 'Fresher / Never Employed') {
        experiences.forEach((exp, i) => {
          if (!exp.org?.trim())         errs[`exp_${i}_org`]         = 'Organisation name is required';
          if (!exp.designation?.trim()) errs[`exp_${i}_designation`] = 'Designation is required';
          if (!exp.joining_date)        errs[`exp_${i}_joining_date`] = 'Joining date is required';
          if (exp.joining_date && exp.leaving_date && exp.leaving_date <= exp.joining_date)
            errs[`exp_${i}_leaving_date`] = 'Leaving date must be after joining date';
          if (exp.salary && !/^\d+$/.test(exp.salary.replace(/,/g,'')))
            errs[`exp_${i}_salary`] = 'Salary must be a number';
        });
      }
    }

    if (stepId === 'profile-skills') {
      if (!d.skill_category)    errs.skill_category    = 'Skill Category is required';
      if (!d.skill_name?.trim()) errs.skill_name       = 'Specific Skill / Trade is required';
      else if (d.skill_name.trim().length < 2) errs.skill_name = 'Skill name must be at least 2 characters';
      if (!d.skill_proficiency)  errs.skill_proficiency = 'Proficiency Level is required';
      if (d.skill_exp_years !== undefined && d.skill_exp_years !== '') {
        const yrs = Number(d.skill_exp_years);
        if (isNaN(yrs) || yrs < 0 || yrs > 50) errs.skill_exp_years = 'Experience years must be between 0 and 50';
      }
    }

    if (stepId === 'profile-docs') {
      if (!docFiles.aadhaar)      errs.aadhaar      = 'Aadhaar Card upload is required';
      if (!docFiles.marksheet_10) errs.marksheet_10 = '10th Marksheet / Certificate upload is required';
    }

    if (stepId === 'profile-pref') {
      if (!d.pref_role?.trim())
        errs.pref_role = 'Preferred Job Role is required';
      else if (d.pref_role.trim().length < 2)
        errs.pref_role = 'Please enter a valid job role';

      if (!d.pref_emp_type) errs.pref_emp_type = 'Preferred Employment Type is required';
      if (!d.pref_sector)   errs.pref_sector   = 'Preferred Sector is required';
      if (!d.pref_state)    errs.pref_state    = 'Preferred State is required';

      if (!d.pref_salary?.trim()) {
        errs.pref_salary = 'Expected Monthly Salary is required';
      } else {
        const sal = Number(d.pref_salary.replace(/,/g,'').trim());
        if (isNaN(sal))       errs.pref_salary = 'Salary must be a number (e.g. 15000)';
        else if (sal < 1000)  errs.pref_salary = 'Expected salary seems too low (min ₹1,000/month)';
        else if (sal > 9999999) errs.pref_salary = 'Expected salary seems too high';
      }
    }

    setFieldErrors(errs);
    return errs;
  }

  const u        = user || {};
  // Profile completion: weighted across all 5 profile sections
  const pctSections = [
    // Basic Info (25%) — 5 key fields
    { weight: 25, filled: [profileDraft.first_name, profileDraft.last_name, profileDraft.dob, profileDraft.gender, profileDraft.phone, profileDraft.category].filter(Boolean).length, total: 6 },
    // Education (20%)
    { weight: 20, filled: [profileDraft.edu_level, profileDraft.edu_board, profileDraft.edu_year, profileDraft.edu_institute].filter(Boolean).length, total: 4 },
    // Work Experience (15%)
    { weight: 15, filled: [profileDraft.emp_status, profileDraft.skill_name].filter(Boolean).length, total: 2 },
    // Job Preferences (20%)
    { weight: 20, filled: [profileDraft.pref_role, profileDraft.pref_sector, profileDraft.pref_salary, profileDraft.pref_emp_type].filter(Boolean).length, total: 4 },
    // Documents & Bank (20%) — email always present; bio, bank details optional but counted
    { weight: 20, filled: [u.email, profileDraft.bank_account_number, profileDraft.bank_ifsc, u.bio || profileDraft.bio].filter(Boolean).length, total: 4 },
  ];
  const pct = Math.min(100, Math.round(pctSections.reduce((sum, s) => sum + s.weight * (s.filled / s.total), 0)));
  const initials = (u.name || 'CA').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [active]); // eslint-disable-line

  useEffect(() => {
    api.getRolePermissions().then(all => setMenuPerms(all['candidate'] || {})).catch(() => {});
  }, []);
  const PERM_LOCKED = new Set(['dashboard','notifications','settings','profile','profile-personal','skill-passport']);
  const allowed = k => !k || PERM_LOCKED.has(k) || menuPerms[k] !== false;
  useEffect(() => { if (Object.keys(menuPerms).length && !allowed(active)) setActive('dashboard'); }, [menuPerms]); // eslint-disable-line

  useEffect(() => {
    (async () => {
      try {
        const [j, c, apps, enroll, stats, certs, grievs, aiJobs, recs, placements] = await Promise.allSettled([
          api.jobs(), api.courses(), api.myApplications(), api.myEnrollments(), api.dashboardStats(),
          api.myCertificates(), api.myGrievances(), api.aiJobsForMe(), api.recommendations(),
          api.candidatePlacements(),
        ]);
        if (j.status          === 'fulfilled') setJobs(j.value || []);
        if (c.status          === 'fulfilled') setCourses(c.value || []);
        if (apps.status       === 'fulfilled') setMyApps(apps.value || []);
        if (enroll.status     === 'fulfilled') setMyEnroll(enroll.value || []);
        if (stats.status      === 'fulfilled') setDbStats(stats.value || {});
        if (certs.status      === 'fulfilled') setMyCerts(certs.value || []);
        if (grievs.status     === 'fulfilled') setGrievances(grievs.value || []);
        if (aiJobs.status     === 'fulfilled') setAiJobMatches(aiJobs.value || { jobs: [] });
        if (recs.status       === 'fulfilled') setCourseRecs(recs.value || { topSkillGaps: [], recommendedCourses: [] });
        if (placements.status === 'fulfilled') setMyPlacements(placements.value || []);
      } finally { setLoading(false); }
    })();
  }, []);

  /* flat search index is computed at module level */

  const searchResults = searchQ.trim().length > 0
    ? SEARCH_INDEX.filter(r => r.label.toLowerCase().includes(searchQ.toLowerCase()) || r.section.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 6)
    : [];

  function toast3(msg, ok=true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function applyJob(job_id) {
    setApplyingId(job_id);
    try {
      await api.apply(job_id);
      setMyApps(await api.myApplications() || []);
      setDbStats(await api.dashboardStats() || {});
      toast3('Application submitted!');
    } catch (e) { toast3(e.message, false); }
    finally { setApplyingId(null); }
  }

  async function openEnrollModal(course) {
    setEnrollBatchModal(course);
    setSelectedBatch('');
    // fetch batches linked to this course
    try {
      const all = await api.allBatches();
      setAvailBatches((all || []).filter(b => b.course_id === course.id && b.status !== 'cancelled' && b.status !== 'completed'));
    } catch { setAvailBatches([]); }
  }

  async function enrollCourse(courseId, batchId) {
    setEnrollingId(courseId);
    try {
      await api.enroll(courseId, batchId ? { batch_id: batchId } : undefined);
      setMyEnroll(await api.myEnrollments() || []);
      setDbStats(await api.dashboardStats() || {});
      toast3('Enrolled successfully!');
      setEnrollBatchModal(null);
    } catch (e) { toast3(e.message, false); }
    finally { setEnrollingId(null); }
  }

  function go(id) { setActive(id); window.scrollTo(0,0); }
  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function signOut() { logout(); navigate('/'); }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const history = chatMsgs.map(m => ({ role: m.role, content: m.text }));
    setChatMsgs(m => [...m, { role:'user', text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.chatbot(text, history);
      setChatMsgs(m => [...m, { role:'assistant', text: res?.reply || res?.message || 'Sorry, I could not process that.' }]);
    } catch {
      setChatMsgs(m => [...m, { role:'assistant', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally { setChatLoading(false); }
  }

  async function parseResumeAndFill(file) {
    if (!file) return;
    setResumeParseLoading(true);
    setResumeParseMsg('');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const b64 = e.target.result.split(',')[1];
          const contentType = file.type || 'application/pdf';
          const parsed = await api.parseResumeFile(b64, contentType);
          if (parsed) {
            setProfileDraft(d => ({
              ...d,
              first_name: parsed.first_name || d.first_name,
              last_name:  parsed.last_name  || d.last_name,
              phone:      parsed.phone      || d.phone,
              city:       parsed.city       || d.city,
              state_name: parsed.state      || d.state_name,
              bio:        parsed.summary    || d.bio,
              edu_level:  parsed.education  || d.edu_level,
              skill_name: (Array.isArray(parsed.skills) ? parsed.skills[0] : parsed.skills) || d.skill_name,
            }));
            setResumeParseMsg('✅ Profile auto-filled from resume! Review and save.');
            go('profile-basic');
          }
        } catch { setResumeParseMsg('❌ Could not parse resume. Try a text-based PDF.'); }
        finally { setResumeParseLoading(false); }
      };
      reader.readAsDataURL(file);
    } catch { setResumeParseLoading(false); setResumeParseMsg('❌ Upload failed.'); }
  }

  async function generateInterviewQuestions() {
    const role = interviewRole || profileDraft.pref_role || 'Software Developer';
    setInterviewGenLoading(true);
    setInterviewQs([]); setInterviewAnswers({}); setInterviewScores(null);
    try {
      const res = await api.chatbot(
        `Generate 5 interview questions for the role: "${role}". Return ONLY a JSON array of strings, no explanation. Example: ["Q1","Q2","Q3","Q4","Q5"]`,
        []
      );
      const raw = res?.reply || res?.message || '[]';
      const match = raw.match(/\[[\s\S]*\]/);
      const qs = match ? JSON.parse(match[0]) : [];
      setInterviewQs(qs.slice(0, 5));
    } catch { setInterviewQs(['Tell me about yourself.', 'What are your key strengths?', 'Describe a challenging project you handled.', 'Where do you see yourself in 5 years?', 'Why do you want this role?']); }
    finally { setInterviewGenLoading(false); }
  }

  async function scoreInterviewAnswers() {
    if (!interviewQs.length) return;
    setInterviewScoreLoading(true);
    const qa = interviewQs.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${interviewAnswers[i] || '(no answer)'}`).join('\n\n');
    try {
      const res = await api.chatbot(
        `You are an interview coach. Score these answers for the role "${interviewRole || 'the applied role'}" out of 10 each and give one short tip per answer. Return JSON: {"scores":[{"q":"...","score":8,"tip":"..."}]}.\n\n${qa}`,
        []
      );
      const raw = res?.reply || res?.message || '{}';
      const match = raw.match(/\{[\s\S]*\}/);
      setInterviewScores(match ? JSON.parse(match[0]) : null);
    } catch { setInterviewScores(null); }
    finally { setInterviewScoreLoading(false); }
  }

  async function withdrawApplication(id) {
    setWithdrawingId(id);
    try {
      await api.deleteApplication(id);
      setMyApps(prev => prev.filter(a => a.id !== id));
      showToast('Application withdrawn.');
    } catch { showToast('Failed to withdraw. Please try again.', 'error'); }
    finally { setWithdrawingId(null); setWithdrawConfirm(null); }
  }

  async function explainMatch(job) {
    setMatchExplainJob(job);
    setMatchExplainText('');
    setMatchExplainLoading(true);
    try {
      const res = await api.aiExplainMatch({ job_id: job.id, candidate_id: u?.id }).catch(() => null);
      if (res?.explanation) { setMatchExplainText(res.explanation); return; }
      // Fallback: use chatbot
      const skills = (u?.skills ? (typeof u.skills === 'string' ? JSON.parse(u.skills) : u.skills) : []).join(', ') || 'your skills';
      const reply = await api.chatbot(
        `In 3–4 sentences, explain why a candidate with skills "${skills}" would be a good match for the role "${job.title}" at "${job.company || job.employer_name || 'this company'}".`,
        []
      ).catch(() => null);
      setMatchExplainText(reply?.reply || reply?.message || 'This role matches your profile based on your skills and preferences.');
    } catch { setMatchExplainText('Unable to load match explanation right now.'); }
    finally { setMatchExplainLoading(false); }
  }

  const appliedIds  = new Set(myApps.map(a => a.job_id));
  const enrolledIds = new Set(myEnroll.map(e => e.course_id));

  /* ── Sidebar ──────────────────────────────────────────────────── */
  function Sidebar() {
    return (
      <>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199 }} />
        )}
        <aside style={{ width:SW, background:C.sidebar, display:'flex', flexDirection:'column',
          position:'fixed', top:0, left:0, bottom:0, zIndex:200, overflowY:'hidden',
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)', transition:'transform 0.25s ease' }}>

        {/* Brand */}
        <div style={{ padding:'0 16px', height:58, borderBottom:'1px solid rgba(255,255,255,.08)',
          display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #e0e8f4', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}><img src="/logo.png" alt="Skills n Jobs" style={{ width:34, height:34, objectFit:'contain' }} /></div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:800 }}>SkillsnJobs</div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:9.5 }}>Candidate Portal</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:'4px 0', overflowY:'auto' }}>
          {NAV.map(sec => {
            const visItems = sec.items.filter(item => allowed(item.id));
            if (!visItems.length) return null;
            return (
            <div key={sec.section}>
              <div style={{ fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,.28)',
                letterSpacing:'1px', textTransform:'uppercase', padding:'5px 16px 2px' }}>{sec.section}</div>
              {visItems.map(item => {
                const visChildren = item.children ? item.children.filter(c => allowed(c.id)) : null;
                const hasActiveChild = visChildren && visChildren.some(c => c.id === active);
                const isActive = active === item.id;
                return (
                  <div key={item.id}>
                    <div onClick={() => item.children ? toggleMenu(item.id) : go(item.id)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'3px 14px', margin:'1px 8px', borderRadius:7, cursor:'pointer',
                        fontSize:13,
                        fontWeight: isActive || hasActiveChild ? 700 : 500,
                        color: isActive || hasActiveChild ? '#fff' : 'rgba(255,255,255,.68)',
                        background: isActive
                          ? 'linear-gradient(135deg,rgba(255,107,0,.6),rgba(255,107,0,.35))'
                          : hasActiveChild ? 'rgba(255,255,255,.05)' : 'transparent',
                        border: isActive ? '1px solid rgba(255,107,0,.4)' : '1px solid transparent',
                      }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <span style={{ fontSize:15, width:20, textAlign:'center' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        {item.badge != null && (
                          <span style={{ fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:20,
                            background: item.badgeBlue ? C.blue : C.saffron, color:'#fff' }}>{item.badge}</span>
                        )}
                        {visChildren && (
                          <span style={{ fontSize:10, color:'rgba(255,255,255,.35)',
                            display:'inline-block', transform: openMenus[item.id] ? 'rotate(180deg)' : 'none',
                            transition:'transform .2s' }}>▾</span>
                        )}
                      </div>
                    </div>
                    {visChildren && openMenus[item.id] && (
                      <div>
                        {visChildren.map(ch => (
                          <div key={ch.id} onClick={() => go(ch.id)}
                            style={{ display:'flex', alignItems:'center', gap:7,
                              padding:'4px 14px 4px 43px', margin:'1px 8px', borderRadius:6, cursor:'pointer',
                              fontSize:12,
                              fontWeight: active===ch.id ? 600 : 400,
                              color: active===ch.id ? '#FFB347' : 'rgba(255,255,255,.5)',
                              background: active===ch.id ? 'rgba(255,107,0,.15)' : 'transparent',
                              border: active===ch.id ? '1px solid rgba(255,107,0,.2)' : '1px solid transparent',
                            }}>
                            <span style={{ color: active===ch.id ? '#FFB347' : 'rgba(255,255,255,.25)', fontSize:10 }}>•</span>
                            {ch.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })}
        </nav>

        {/* Go Premium banner */}
        <div style={{ margin:'6px 8px 8px', borderRadius:10, padding:'7px 10px',
          background:'linear-gradient(135deg,#1a1060,#3d2db0)',
          border:'1px solid rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
          <span style={{ fontSize:14, flexShrink:0 }}>👑</span>
          <span style={{ fontWeight:700, fontSize:11, whiteSpace:'nowrap',
            background:'linear-gradient(90deg,#FFD700,#FFA500)', WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent', backgroundClip:'text', flex:1 }}>Go Premium</span>
          <button onClick={() => go('financial-aid')}
            style={{ flexShrink:0, padding:'4px 10px', borderRadius:20, border:'none', cursor:'pointer',
              background:'linear-gradient(90deg,#7B5CF6,#9B6FFF)',
              color:'#fff', fontWeight:700, fontSize:10, whiteSpace:'nowrap' }}
            onMouseEnter={e => e.target.style.opacity='0.85'}
            onMouseLeave={e => e.target.style.opacity='1'}>
            Upgrade
          </button>
        </div>

      </aside>
      </>
    );
  }

  /* ── Topbar ───────────────────────────────────────────────────── */
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left: isMobile ? 0 : SW, right:0, height:TH,
        background:'#fff', borderBottom:`1px solid ${C.border}`, display:'flex',
        alignItems:'center', padding:'0 24px', zIndex:100, gap:14,
        boxShadow:'0 1px 4px rgba(0,51,102,.06)' }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(v => !v)} style={{ width:38, height:38, borderRadius:8, border:'none', background:'#f1f5f9', fontSize:20, cursor:'pointer', flexShrink:0 }}>☰</button>
        )}
        <div style={{ flex:1, display:'flex', justifyContent:'center', position:'relative' }}>
          <div style={{ width:'100%', maxWidth:420, position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center',
              background:C.surface, border:`1px solid ${searchOpen ? C.blue : C.border}`,
              borderRadius:searchOpen && searchResults.length > 0 ? '20px 20px 0 0' : 20,
              overflow:'visible', transition:'border-color .15s' }}>
              <input
                placeholder="Search courses, jobs, schemes…"
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                style={{ flex:1, background:'none', border:'none', outline:'none',
                  padding:'8px 16px', fontSize:12.5, color:C.ink, borderRadius:20 }} />
              <div style={{ padding:'0 14px', color:C.ink3 }}>🔍</div>
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0,
                background:'#fff', border:`1px solid ${C.blue}`, borderTop:'none',
                borderRadius:'0 0 14px 14px', boxShadow:'0 8px 24px rgba(0,51,102,.12)',
                zIndex:200, overflow:'hidden' }}>
                {searchResults.map((r, i) => (
                  <div key={r.id + i}
                    onMouseDown={() => { go(r.id); setSearchQ(''); setSearchOpen(false); }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
                      cursor:'pointer', borderBottom: i < searchResults.length-1 ? `1px solid ${C.border}` : 'none',
                      transition:'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bluePale}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <span style={{ fontSize:16 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{r.label}</div>
                      <div style={{ fontSize:10.5, color:C.ink3 }}>{r.section}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchOpen && searchQ.trim().length > 0 && searchResults.length === 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0,
                background:'#fff', border:`1px solid ${C.border}`, borderTop:'none',
                borderRadius:'0 0 14px 14px', padding:'14px 16px', zIndex:200,
                color:C.ink3, fontSize:12.5, textAlign:'center' }}>
                No results for "{searchQ}"
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ position:'relative' }} className="avatar-wrap"
            onMouseEnter={e => { const t = e.currentTarget.querySelector('.avatar-tooltip'); if(t) t.style.opacity='1'; t && (t.style.pointerEvents='auto'); }}
            onMouseLeave={e => { const t = e.currentTarget.querySelector('.avatar-tooltip'); if(t) t.style.opacity='0'; t && (t.style.pointerEvents='none'); }}>
            <div onClick={() => go('profile-basic')} style={{ display:'flex', alignItems:'center',
              padding:'5px', borderRadius:'50%', background:C.surface, border:`1px solid ${C.border}`,
              cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:'50%',
                background:'linear-gradient(135deg,#FF6B00,#FFB347)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:800, fontSize:14, color:'#fff',
                border:'2px solid rgba(255,107,0,.3)' }}>{initials}</div>
            </div>
            {/* Tooltip */}
            <div className="avatar-tooltip" style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:500,
              background:'#fff', border:`1px solid ${C.border}`, borderRadius:12,
              padding:'12px 14px', minWidth:180, boxShadow:'0 8px 24px #0002',
              opacity:0, pointerEvents:'none', transition:'opacity 0.15s ease',
              whiteSpace:'nowrap' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{u.name || 'Candidate'}</div>
              <div style={{ fontSize:11, color:C.ink3, marginTop:2 }}>ID: SK-{String(u.id||'0').padStart(6,'0')}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
                <div style={{ flex:1, height:4, background:C.border, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#FF6B00,#FFB347)', borderRadius:4 }} />
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:C.saffron }}>{pct}%</span>
              </div>
              <div style={{ fontSize:10, color:C.ink3, marginTop:4 }}>Profile completion</div>
              <div style={{ marginTop:10, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                <button onClick={() => go('profile-basic')}
                  style={{ width:'100%', padding:'5px 0', background:C.navy, color:'#fff',
                    border:'none', borderRadius:7, fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
                  View Profile →
                </button>
              </div>
            </div>
          </div>
          <button onClick={signOut} title="Sign Out"
            style={{ display:'flex', alignItems:'center', justifyContent:'center',
              width:38, height:38, borderRadius:'50%', border:'none',
              background:C.blue, color:'#fff', fontSize:18, cursor:'pointer' }}>⏻</button>
        </div>
      </div>
    );
  }

  /* ── Panels (lazy — only the active one evaluates) ────────────── */

  function PanelDashboard() {
    const appCount = dbStats.myApplications ?? myApps.length;
    const shortlisted = dbStats.myShortlisted ?? myApps.filter(a => a.status === 'shortlisted').length;
    const interviews = myApps.filter(a => a.status === 'interview').length;
    const offers = myApps.filter(a => a.status === 'hired').length;

    // Derive resume score from real profile completeness
    const userSkills = Array.isArray(u.skills) ? u.skills : [];
    const resumeScore = Math.min(100, Math.round(
      (u.bio ? 15 : 0) +
      (userSkills.length >= 3 ? 20 : userSkills.length * 5) +
      (u.qualification ? 20 : 0) +
      (u.employment_status ? 10 : 0) +
      (u.phone ? 10 : 0) +
      (myCerts.length > 0 ? 15 : 0) +
      (u.address_line1 ? 10 : 0)
    ));

    // Real AI job match data
    const aiJobs = aiJobMatches.jobs || [];
    const topAiScore = aiJobs.length > 0 ? Math.round(aiJobs.slice(0,3).reduce((s,j) => s + j.score, 0) / Math.min(3, aiJobs.length)) : 0;
    const jobMatchScore = topAiScore || (jobs.length > 0 ? 62 : 0);

    // Skill score: how many of candidate's skills are matched in AI jobs
    const matchedSkillsSet = new Set(aiJobs.flatMap(j => j.matched || []));
    const skillScore = userSkills.length > 0
      ? Math.min(100, Math.round((matchedSkillsSet.size / Math.max(userSkills.length, 1)) * 100 + (userSkills.length * 5)))
      : 0;

    // Real skill gaps from recommendations API
    const skillGaps = courseRecs.topSkillGaps || [];
    const gapPriority = (i) => i < 2 ? { label:'High Priority', pc:'#FEE2E2', fc:'#DC2626' } : { label:'Medium Priority', pc:'#FEF3C7', fc:'#D97706' };

    // Real course recommendations
    const recCourses = courseRecs.recommendedCourses || [];

    // Donut SVG helper
    function DonutChart({ pct, size, color, label, sublabel }) {
      const r = (size - 12) / 2;
      const circ = 2 * Math.PI * r;
      const fill = circ * pct / 100;
      return (
        <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
          <svg width={size} height={size}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EEF2F7" strokeWidth={10} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
              strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${size/2} ${size/2})`} />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:size > 80 ? 20 : 13, fontWeight:800, color:C.navy, lineHeight:1 }}>{label}</div>
            {sublabel && <div style={{ fontSize:9.5, color:C.ink3, marginTop:2, textAlign:'center', lineHeight:1.2 }}>{sublabel}</div>}
          </div>
        </div>
      );
    }

    // Radar chart — built from real user skills
    function RadarChart() {
      const base = userSkills.length > 0 ? userSkills.slice(0,6) : ['No skills', 'added', 'yet'];
      const matchSet = new Set(aiJobs.flatMap(j => j.matched || []).map(s => s.toLowerCase()));
      const skills = base.map(s => ({
        label: s.length > 8 ? s.slice(0,7) + '…' : s,
        val: matchSet.has(s.toLowerCase()) ? 0.80 + Math.random() * 0.15 : 0.45 + Math.random() * 0.25,
      }));
      const cx = 90, cy = 90, R = 72;
      const n = skills.length;
      const angles = skills.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);
      const toXY = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const grid = [0.25, 0.5, 0.75, 1].map(g =>
        angles.map(a => toXY(R * g, a)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z'
      );
      const userPoly = angles.map((a, i) => toXY(R * skills[i].val, a)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
      const industryPoly = angles.map((a) => toXY(R * 0.72, a)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
      return (
        <svg width={180} height={180} viewBox="0 0 180 180">
          {grid.map((d, i) => <path key={i} d={d} fill="none" stroke={C.border} strokeWidth={0.8} />)}
          {angles.map((a, i) => { const [x2, y2] = toXY(R, a); return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={C.border} strokeWidth={0.8} />; })}
          <path d={industryPoly} fill="none" stroke={C.ink3} strokeWidth={1} strokeDasharray="3,3" />
          <path d={userPoly} fill={`${C.blue}22`} stroke={C.blue} strokeWidth={2} />
          {angles.map((a, i) => {
            const [x, y] = toXY(R + 14, a);
            const lines = skills[i].label.split('\n');
            return (
              <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={600} fill={C.ink2}>
                {lines.map((l, li) => <tspan key={li} x={x} dy={li === 0 ? 0 : 11}>{l}</tspan>)}
              </text>
            );
          })}
        </svg>
      );
    }

    // Simple sparkline — built from real application status progression
    function Sparkline() {
      // Use myApps count per status as trend points; pad with 0s to always have 8 pts
      const statusOrder = ['applied','shortlisted','interview','offered','hired'];
      const basePts = statusOrder.map(s => myApps.filter(a => a.status === s).length);
      const cumulative = basePts.map((v, i) => basePts.slice(0, i + 1).reduce((a, b) => a + b, 0) || 0);
      const pts = cumulative.length >= 2 ? cumulative : [0, myApps.length || 0];
      const max = Math.max(...pts), min = Math.min(...pts);
      const norm = pts.map(p => 40 - ((p - min) / (max - min)) * 35);
      const path = pts.map((_, i) => `${i === 0 ? 'M' : 'L'}${i * (120 / (pts.length - 1))},${norm[i]}`).join(' ');
      return (
        <svg width={120} height={44} style={{ display:'block' }}>
          <path d={path} fill="none" stroke={C.teal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`${path} L120,44 L0,44 Z`} fill={`${C.teal}18`} />
        </svg>
      );
    }

    const DCard = ({ children, style: s }) => (
      <div style={{ background:'#fff', borderRadius:12, border:`1px solid ${C.border}`,
        boxShadow:'0 1px 4px rgba(0,0,0,.04)', padding:'16px 18px', ...s }}>{children}</div>
    );
    const DTitle = ({ children, action, onAction }) => (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13.5, fontWeight:700, color:C.navy }}>{children}</span>
        {action && <span onClick={onAction} style={{ fontSize:12, color:C.blue, cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>{action} →</span>}
      </div>
    );

    const topJobs = aiJobs.length > 0
      ? aiJobs.slice(0,4).map(j => ({
          id: j.id, company: j.employer_name || 'Company', role: j.title,
          match: j.score,
          salary: j.salary_min && j.salary_max ? `₹${(j.salary_min/100000).toFixed(1)}–${(j.salary_max/100000).toFixed(1)} LPA` : '—',
          location: j.location || 'India',
          missing: j.missing || [],
        }))
      : jobs.slice(0,4).map((j, i) => ({
          id: j.id, company: j.company || j.employer_name || 'Company', role: j.title,
          match: myApps.find(a => a.job_id === j.id)?.match_score * 25 || 60,
          salary: j.salary_min && j.salary_max ? `₹${(j.salary_min/100000).toFixed(1)}–${(j.salary_max/100000).toFixed(1)} LPA` : '—',
          location: j.location || 'India',
          missing: [],
        }));

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* ── Row 0: greeting */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ margin:0, fontSize:21, fontWeight:800, color:C.navy }}>
              Welcome back, {u.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p style={{ margin:'3px 0 0', fontSize:12.5, color:C.ink3 }}>Your personalised skill-to-career dashboard</p>
          </div>
          {pct < 100 && (
            <div onClick={() => go('profile-basic')} style={{ background:'linear-gradient(135deg,#FFF3E8,#FFF8F0)',
              border:'1px solid #FFD4A8', borderRadius:9, padding:'9px 16px',
              fontSize:12.5, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <span>⚡</span>
              <span style={{ color:C.saffronDark, fontWeight:600 }}>Profile {pct}% — Complete now</span>
            </div>
          )}
        </div>

        {/* ── Row 1: 5 top metric cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
          {[
            { label:'Profile Completion', val:pct, unit:'%', sub:`↑ ${Math.max(0,pct-80)}%`, subColor:C.green, bar:true, barColor:'#4F46E5', desc:'Complete your profile', icon:'👤' },
            { label:'Resume Score', val:resumeScore, unit:'', sub: resumeScore >= 70 ? '↑ Good' : 'Needs work', subColor: resumeScore >= 70 ? C.green : C.saffron, bar:true, barColor:'#7C3AED', desc:'Based on profile completeness', icon:'📄' },
            { label:'Job Match Score', val:jobMatchScore, unit:'%', sub: jobMatchScore >= 80 ? '↑ Excellent' : jobMatchScore >= 60 ? '↑ Good' : 'Low', subColor: jobMatchScore >= 80 ? C.green : C.saffron, bar:true, barColor:C.green, desc:'Based on your preferences', icon:'💼' },
            { label:'Skill Score', val:skillScore, unit:'%', sub: skillScore >= 70 ? '↑ Strong' : 'Add skills', subColor: skillScore >= 70 ? C.green : C.saffron, bar:true, barColor:C.saffron, desc:`${myCerts.length} cert${myCerts.length !== 1 ? 's' : ''} earned`, icon:'⚙️' },
            { label:'Applications', val:appCount, unit:'', sub:'Active', subColor:C.blue, bar:false, desc:`${shortlisted} in progress`, icon:'📋' },
          ].map(m => (
            <DCard key={m.label} style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:C.bluePale,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{m.icon}</div>
                <div style={{ fontSize:11, color:C.ink3, lineHeight:1.3 }}>{m.label}</div>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:6 }}>
                <span style={{ fontSize:26, fontWeight:800, color:C.navy, lineHeight:1 }}>{m.val}</span>
                <span style={{ fontSize:14, fontWeight:700, color:C.ink2 }}>{m.unit}</span>
                <span style={{ fontSize:11, fontWeight:700, color:m.subColor, marginLeft:4 }}>{m.sub}</span>
              </div>
              {m.bar && <ProgBar pct={m.val} color={m.barColor} />}
              <div style={{ fontSize:10.5, color:C.ink3, marginTop:6 }}>{m.desc}</div>
            </DCard>
          ))}
        </div>

        {/* ── Row 2: AI Insights | Skill Gap | Resume Analysis */}
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:14 }}>

          {/* AI Career Insights */}
          <DCard>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:13.5, fontWeight:700, color:C.navy }}>✨ AI Career Insights</span>
              <span style={{ fontSize:10, fontWeight:700, color:C.blue, background:C.bluePale,
                padding:'2px 8px', borderRadius:20 }}>Powered by AI</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <DonutChart pct={jobMatchScore} size={100} color={C.blue} label={`${jobMatchScore}%`} sublabel={"Career\nFit Score"} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:C.ink2, marginBottom:8 }}>Best Fit Roles for You</div>
                {aiJobs.length > 0
                  ? aiJobs.slice(0,3).map(j => (
                    <div key={j.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'5px 10px', background:C.bluePale, borderRadius:7, marginBottom:5, cursor:'pointer' }}
                      onClick={() => go('browse-jobs')}>
                      <span style={{ fontSize:11.5, fontWeight:600, color:C.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>{j.title}</span>
                      <span style={{ fontSize:10.5, fontWeight:700, color:C.blue, whiteSpace:'nowrap', flexShrink:0 }}>{j.score}% match</span>
                    </div>
                  ))
                  : <div style={{ fontSize:12, color:C.ink3, textAlign:'center', padding:'8px 0' }}>Complete your profile to see AI job matches</div>
                }
              </div>
            </div>
          </DCard>

          {/* Skill Gap Analysis */}
          <DCard>
            <DTitle action="View Details" onAction={() => go('skill-passport')}>Skill Gap Analysis</DTitle>
            {skillGaps.length === 0
              ? <p style={{ color:C.ink3, fontSize:12, padding:'12px 0' }}>Complete your profile to see skill gap analysis.</p>
              : null}
            {skillGaps.slice(0,4).map((skill, i) => {
              const p = gapPriority(i);
              const sg = { skill: skill.charAt(0).toUpperCase() + skill.slice(1), priority: p.label, pc: p.pc, fc: p.fc };
              return (
              <div key={sg.skill} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:7, background:C.surface,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>⚙️</div>
                  <span style={{ fontSize:12.5, fontWeight:600, color:C.navy }}>{sg.skill}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10.5, fontWeight:700, background:sg.pc, color:sg.fc,
                    padding:'2px 8px', borderRadius:20 }}>{sg.priority}</span>
                  <span style={{ color:C.ink3, fontSize:13 }}>›</span>
                </div>
              </div>
            );
            })}
          </DCard>

          {/* Resume Analysis */}
          <DCard>
            <DTitle>Resume Analysis</DTitle>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
              <DonutChart pct={resumeScore} size={86} color={C.blue} label={String(resumeScore)} sublabel={"ATS Score"} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:resumeScore >= 70 ? C.green : C.saffron, marginBottom:10 }}>● {resumeScore >= 80 ? 'Good' : resumeScore >= 60 ? 'Fair' : 'Needs Work'}</div>
                {[
                  { k:'Content', v: u.bio ? Math.min(100, 60 + u.bio.length / 5) : 40 },
                  { k:'Keywords', v: Math.min(100, userSkills.length * 15 + 25) },
                  { k:'Education', v: u.qualification ? 85 : 45 },
                  { k:'Experience', v: u.employment_status ? 80 : 50 },
                ].map(r => ({ ...r, v: Math.round(r.v) })).map(r => (
                  <div key={r.k} style={{ display:'flex', justifyContent:'space-between',
                    fontSize:11.5, color:C.ink2, marginBottom:4 }}>
                    <span>{r.k}</span>
                    <span style={{ fontWeight:700, color:C.navy }}>{r.v}/100</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => go('resume-builder-ai')} style={{ width:'100%', padding:'8px 0', borderRadius:8,
              background:`linear-gradient(90deg,${C.blue},#7C3AED)`, color:'#fff',
              border:'none', fontSize:12.5, fontWeight:700, cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center', gap:6 }}>
              ✨ Improve Resume
            </button>
          </DCard>
        </div>

        {/* ── Row 3: Top Job Matches | Upcoming Interviews | Learning Recs */}
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr', gap:14 }}>

          {/* Top Job Matches */}
          <DCard style={{ padding:0 }}>
            <div style={{ padding:'14px 18px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13.5, fontWeight:700, color:C.navy }}>Top Job Matches</span>
              <span onClick={() => go('browse-jobs')} style={{ fontSize:12, color:C.blue, cursor:'pointer', fontWeight:600 }}>View All Jobs →</span>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Company','Role','Match','Salary','Location','Action'].map(h => (
                    <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:10.5,
                      fontWeight:700, color:C.ink3, borderBottom:`1px solid ${C.border}`,
                      textTransform:'uppercase', letterSpacing:'.03em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topJobs.length > 0 ? topJobs.map((j, i) => (
                  <tr key={j.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:'9px 14px', fontWeight:600, color:C.navy }}>{j.company}</td>
                    <td style={{ padding:'9px 14px', color:C.ink2 }}>{j.role}</td>
                    <td style={{ padding:'9px 14px' }}>
                      <span style={{ fontWeight:800, color:C.green }}>{j.match}%</span>
                    </td>
                    <td style={{ padding:'9px 14px', color:C.ink2, whiteSpace:'nowrap' }}>{j.salary}</td>
                    <td style={{ padding:'9px 14px', color:C.ink3 }}>{j.location}</td>
                    <td style={{ padding:'9px 14px' }}>
                      <button onClick={() => go('browse-jobs')} style={{ padding:'5px 14px', borderRadius:7,
                        background:C.blue, color:'#fff', border:'none', fontSize:11.5,
                        fontWeight:700, cursor:'pointer' }}>Apply</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ padding:'24px', textAlign:'center', color:C.ink3, fontSize:12.5 }}>
                    <div style={{ marginBottom:8, fontSize:24 }}>💼</div>No job matches yet. <span onClick={() => go('browse-jobs')} style={{ color:C.blue, cursor:'pointer', fontWeight:600 }}>Browse jobs →</span>
                  </td></tr>
                )}
              </tbody>
            </table>
          </DCard>

          {/* Upcoming Interviews */}
          <DCard>
            <DTitle action="View All" onAction={() => go('my-applications')}>Upcoming Interviews</DTitle>
            {myApps.filter(a => a.status === 'interview').length > 0 ? (
              myApps.filter(a => a.status === 'interview').slice(0, 3).map(a => (
                <div key={a.id} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:C.bluePale,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🏢</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12.5, fontWeight:700, color:C.navy }}>{a.company || a.employer_name}</div>
                    <div style={{ fontSize:11, color:C.ink3 }}>{a.job_title}</div>
                    <span style={{ fontSize:10, fontWeight:700, background:C.greenPale, color:C.green,
                      padding:'2px 7px', borderRadius:20, marginTop:3, display:'inline-block' }}>Confirmed</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign:'center', padding:'20px 0', color:C.ink3 }}>
                <div style={{ fontSize:32 }}>📅</div>
                <p style={{ marginTop:8, fontSize:12 }}>No interviews scheduled yet.</p>
                <Btn sm onClick={() => go('browse-jobs')} style={{ marginTop:10 }}>Browse Jobs →</Btn>
              </div>
            )}
          </DCard>

          {/* Learning Recommendations */}
          <DCard>
            <DTitle action="View All" onAction={() => go('browse-courses')}>Learning Recommendations</DTitle>
            {recCourses.length > 0
              ? recCourses.slice(0,3).map(c => (
                <div key={c.id} onClick={() => go('browse-courses')}
                  style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:`1px solid ${C.border}`, cursor:'pointer' }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:C.bluePale,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📚</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize:10.5, color:C.ink3 }}>{c.provider || 'SIDH'}{c.rating ? ` · ⭐ ${Number(c.rating).toFixed(1)}` : ''}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, background:C.greenPale, color:C.green,
                    padding:'3px 8px', borderRadius:20, height:'fit-content', whiteSpace:'nowrap', flexShrink:0 }}>{c.relevance ? `${Math.min(100, c.relevance * 40)}% Match` : 'Recommended'}</span>
                </div>
              ))
              : <div style={{ fontSize:12, color:C.ink3, padding:'16px 0', textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>📚</div>
                  No recommendations yet — add skills to your profile
                </div>
            }
          </DCard>
        </div>

        {/* ── Row 4: Skills Overview | Certifications | Career Roadmap | Market Insights */}
        <div style={{ display:'grid', gridTemplateColumns:'0.9fr 1fr 1.3fr 1fr', gap:14 }}>

          {/* Skills Overview */}
          <DCard>
            <DTitle action="View All" onAction={() => go('skill-passport')}>Skills Overview</DTitle>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <RadarChart />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, color:C.ink2 }}>
                <div style={{ width:10, height:3, borderRadius:2, background:C.blue }} /> Your Level
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, color:C.ink3 }}>
                <svg width={18} height={4}><line x1={0} y1={2} x2={18} y2={2} stroke={C.ink3} strokeWidth={1.5} strokeDasharray="3,2"/></svg> Industry Avg
              </div>
            </div>
          </DCard>

          {/* Certifications */}
          <DCard>
            <DTitle action="View All" onAction={() => go('certificates')}>Certifications</DTitle>
            {myCerts.length > 0
              ? myCerts.slice(0,4).map((c, i) => {
                  const icons = ['🔴','🟠','🔵','🟣','🟢'];
                  const issued = c.issued_at || c.created_at || '';
                  const dateStr = issued ? new Date(issued).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '—';
                  return (
                    <div key={c.id || i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`1px solid ${C.border}`, alignItems:'center' }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>{icons[i % icons.length]}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11.5, fontWeight:600, color:C.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.course_title || c.title || 'Certificate'}</div>
                        <div style={{ fontSize:10.5, color:C.ink3 }}>Issued: {dateStr}</div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:C.green, background:C.greenPale, padding:'2px 7px', borderRadius:20, flexShrink:0 }}>Verified</span>
                    </div>
                  );
                })
              : <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>🏅</div>
                  <div style={{ fontSize:12, color:C.ink3, marginBottom:10 }}>No certificates yet</div>
                  <button onClick={() => go('browse-courses')} style={{ padding:'6px 14px', borderRadius:7, background:C.blue, color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>Browse Courses</button>
                </div>
            }
          </DCard>

          {/* Career Roadmap */}
          <DCard>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:13.5, fontWeight:700, color:C.navy }}>Career Roadmap</span>
              <span onClick={() => go('career-counselling')} style={{ fontSize:12, color:C.blue, cursor:'pointer', fontWeight:600 }}>View Full Roadmap →</span>
            </div>
            <div style={{ position:'relative', paddingLeft:0 }}>
              {/* Timeline track */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
                {[
                  { icon:'💼', label:'Current Role', sub:'Developer', done:true },
                  { icon:'📚', label:'Skills to Learn', sub:'4 Remaining', done:false },
                  { icon:'🏅', label:'Certifications', sub:'2 Recommended', done:false },
                  { icon:'🔨', label:'Projects', sub:'3 Suggested', done:false },
                  { icon:'🎤', label:'Interview Prep', sub:'Mock Interviews', done:false },
                  { icon:'🎯', label:'Offer', sub:'Your Goal', done:false },
                ].map((step, i, arr) => (
                  <div key={step.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                    {i < arr.length - 1 && (
                      <div style={{ position:'absolute', top:18, left:'50%', width:'100%', height:2,
                        background:`linear-gradient(90deg,${step.done ? C.blue : C.border},${C.border})` }} />
                    )}
                    <div style={{ width:36, height:36, borderRadius:'50%', zIndex:1,
                      background: step.done ? C.blue : '#fff',
                      border:`2px solid ${step.done ? C.blue : C.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
                      {step.icon}
                    </div>
                    <div style={{ textAlign:'center', marginTop:6 }}>
                      <div style={{ fontSize:10, fontWeight:700, color: step.done ? C.navy : C.ink2 }}>{step.label}</div>
                      <div style={{ fontSize:9.5, color:C.ink3, marginTop:1 }}>{step.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Tracker */}
            <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:10 }}>Application Tracker</div>
              <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                {[
                  { label:'Applied', val:appCount, color:C.blue },
                  { label:'Shortlisted', val:shortlisted, color:C.teal },
                  { label:'Interview', val:interviews, color:'#7C3AED' },
                  { label:'HR Round', val:Math.max(0, interviews - 1), color:C.saffron },
                  { label:'Offer', val:offers, color:C.green },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{ flex:1, display:'flex', alignItems:'center' }}>
                    <div style={{ flex:1, textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val < 10 ? `0${s.val}` : s.val}</div>
                      <div style={{ fontSize:9.5, color:C.ink3, marginTop:2 }}>{s.label}</div>
                    </div>
                    {i < arr.length - 1 && <div style={{ fontSize:16, color:C.border, flexShrink:0 }}>→</div>}
                  </div>
                ))}
              </div>
            </div>
          </DCard>

          {/* Market Insights */}
          <DCard>
            <DTitle>Market Insights</DTitle>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11.5, color:C.ink3, marginBottom:4 }}>Your preferred role is in</div>
              <div style={{ fontSize:16, fontWeight:800, color:C.green }}>High Demand</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div style={{ background:C.surface, borderRadius:9, padding:'10px 12px' }}>
                <div style={{ fontSize:10.5, color:C.ink3, marginBottom:3 }}>Avg. Salary</div>
                <div style={{ fontSize:15, fontWeight:800, color:C.navy }}>
                  {jobs.length && jobs.some(j => j.salary_max)
                    ? `₹${(jobs.filter(j=>j.salary_max).reduce((s,j)=>s+(j.salary_min||0)+(j.salary_max||0),0) / (2*jobs.filter(j=>j.salary_max).length) / 100000).toFixed(1)} LPA`
                    : '—'}
                </div>
              </div>
              <div style={{ background:C.surface, borderRadius:9, padding:'10px 12px' }}>
                <div style={{ fontSize:10.5, color:C.ink3, marginBottom:3 }}>Job Openings</div>
                <div style={{ fontSize:15, fontWeight:800, color:C.navy }}>{dbStats.openJobs > 100 ? `${(dbStats.openJobs/1000).toFixed(1)}k+` : `${dbStats.openJobs || 0}+`}</div>
              </div>
            </div>
            <Sparkline />

          </DCard>
        </div>

      </div>
    );
  }

  function PanelBrowseJobs() {
    const userSkills = u?.skills ? (typeof u.skills === 'string' ? (() => { try { return JSON.parse(u.skills); } catch { return u.skills.split(',').map(s=>s.trim()); } })() : u.skills) : [];

    function jobMatchPct(j) {
      const reqSkills = j.required_skills ? (typeof j.required_skills === 'string' ? (() => { try { return JSON.parse(j.required_skills); } catch { return []; } })() : j.required_skills) : [];
      if (!reqSkills.length || !userSkills.length) return null;
      const matched = reqSkills.filter(rs => userSkills.some(us => us.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(us.toLowerCase())));
      return Math.round((matched.length / reqSkills.length) * 100);
    }

    return (
      <div>
        {/* AI Match Explain Modal */}
        {matchExplainJob && (
          <div style={{ position:'fixed', inset:0, background:'#0008', zIndex:9999,
            display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={e => e.target === e.currentTarget && setMatchExplainJob(null)}>
            <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:500, width:'90%',
              boxShadow:'0 20px 60px #0003' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:C.navy }}>🤖 Why You Match</div>
                  <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>{matchExplainJob.title} · {matchExplainJob.company || matchExplainJob.employer_name}</div>
                </div>
                <button onClick={() => setMatchExplainJob(null)}
                  style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:C.ink3, lineHeight:1 }}>✕</button>
              </div>
              {matchExplainLoading
                ? <div style={{ textAlign:'center', padding:'24px 0', color:C.ink3 }}>
                    <div style={{ fontSize:28 }}>⏳</div>
                    <div style={{ fontSize:13, marginTop:8 }}>AI is analysing your profile…</div>
                  </div>
                : <div style={{ fontSize:13.5, color:C.ink, lineHeight:1.7,
                    padding:'14px 16px', background:'#F5F3FF', borderRadius:10, border:'1px solid #DDD6FE' }}>
                    {matchExplainText}
                  </div>
              }
              {(() => {
                const pct = jobMatchPct(matchExplainJob);
                return pct !== null ? (
                  <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1 }}><ProgBar pct={pct} color={pct>=70?C.green:pct>=40?C.saffron:'#DC2626'} /></div>
                    <span style={{ fontSize:13, fontWeight:700, color:pct>=70?C.green:pct>=40?C.saffron:'#DC2626' }}>{pct}% skill match</span>
                  </div>
                ) : null;
              })()}
              <div style={{ marginTop:18, display:'flex', gap:10, justifyContent:'flex-end' }}>
                <Btn sm onClick={() => setMatchExplainJob(null)}>Close</Btn>
                {!appliedIds.has(matchExplainJob.id) && (
                  <Btn primary sm onClick={() => { applyJob(matchExplainJob.id); setMatchExplainJob(null); }}>Apply Now →</Btn>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>Browse Jobs</span></div>
        <SectionHead title="Browse Jobs" />
        <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
          {['All','IT & Digital','Healthcare','Manufacturing','BFSI','Retail'].map(f => (
            <Btn key={f} primary={f==='All'} sm>{f}</Btn>
          ))}
        </div>
        {loading
          ? <p style={{ color:C.ink3 }}>Loading jobs…</p>
          : jobs.length === 0
            ? <Card><p style={{ color:C.ink3, textAlign:'center', padding:'40px 0' }}>No jobs available right now. Check back soon.</p></Card>
            : <Card>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead><tr><Th>Job Title</Th><Th>Company</Th><Th>Location</Th><Th>Salary</Th><Th>Match</Th><Th>Action</Th></tr></thead>
                  <tbody>
                    {jobs.map(j => {
                      const pct = jobMatchPct(j);
                      return (
                        <tr key={j.id}>
                          <Td bold>
                            <div style={{ fontWeight:700 }}>{j.title}</div>
                            <div style={{ fontSize:11, color:C.ink3, fontWeight:400 }}>{j.job_type || j.category || 'Full-time'}</div>
                          </Td>
                          <Td>{j.company || j.employer_name || '—'}</Td>
                          <Td>{j.location || '—'}</Td>
                          <Td>{j.salary_min && j.salary_max ? `₹${(j.salary_min/100000).toFixed(1)}–${(j.salary_max/100000).toFixed(1)}L` : j.salary_range || '—'}</Td>
                          <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                            {pct !== null ? (
                              <button onClick={() => explainMatch(j)}
                                title="Why am I matched?"
                                style={{ background:'none', border:'none', cursor:'pointer', padding:0, textAlign:'left' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                  <span style={{ fontSize:12, fontWeight:700,
                                    color:pct>=70?C.green:pct>=40?C.saffron:'#DC2626' }}>{pct}%</span>
                                  <span style={{ fontSize:10, color:'#7C3AED', textDecoration:'underline', fontWeight:600 }}>Why?</span>
                                </div>
                              </button>
                            ) : <span style={{ fontSize:11, color:C.ink3 }}>—</span>}
                          </td>
                          <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              {appliedIds.has(j.id)
                                ? <span style={{ fontSize:11.5, fontWeight:700, color:C.teal }}>✓ Applied</span>
                                : <Btn primary sm onClick={() => applyJob(j.id)}
                                    style={{ opacity: applyingId===j.id ? .6 : 1 }}>
                                    {applyingId===j.id ? 'Applying…' : 'Apply'}
                                  </Btn>
                              }
                              <button onClick={async () => {
                                if (savedJobIds.has(j.id)) {
                                  await api.unsaveJob(j.id).catch(()=>{});
                                  setSavedJobs(s => s.filter(x => x.job_id !== j.id));
                                  setSavedJobIds(s => { const n = new Set(s); n.delete(j.id); return n; });
                                } else {
                                  const saved = await api.saveJob(j.id).catch(()=>null);
                                  if (saved) {
                                    setSavedJobs(s => [...s, { ...j, job_id: j.id, saved_at: saved.saved_at }]);
                                    setSavedJobIds(s => new Set([...s, j.id]));
                                  }
                                }
                              }} title={savedJobIds.has(j.id) ? 'Unsave' : 'Save job'}
                                style={{ background:'none', border:'none', cursor:'pointer', fontSize:17, padding:'2px 4px',
                                  color: savedJobIds.has(j.id) ? C.saffron : C.ink3 }}>
                                🔖
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
        }
      </div>
    );
  }

  function PanelMyApplications() {
    const STAGES = ['applied','shortlisted','interview','offered','hired'];
    const stageLabel = { applied:'Applied', shortlisted:'Shortlisted', interview:'Interview', offered:'Offered', hired:'Hired' };
    const stageColor = { applied:'#D97706', shortlisted:'#1D4ED8', interview:'#7C3AED', offered:C.green, hired:C.green };

    function renderStatusTimeline(status) {
      const isRejected = status === 'rejected';
      const curIdx = STAGES.indexOf(isRejected ? 'applied' : status);
      return (
        <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:8 }}>
          {STAGES.map((s, i) => {
            const done  = !isRejected && i <= curIdx;
            const isCur = !isRejected && i === curIdx;
            const color = isCur ? (stageColor[s] || C.navy) : done ? C.green : C.border;
            return (
              <React.Fragment key={s}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:56 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%',
                    background: done ? color : '#fff', border:`2px solid ${color}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, color:'#fff', fontWeight:700 }}>
                    {done ? '✓' : ''}
                  </div>
                  <div style={{ fontSize:9.5, color: isCur ? color : C.ink3, fontWeight: isCur ? 700 : 400,
                    marginTop:3, textAlign:'center', whiteSpace:'nowrap' }}>
                    {stageLabel[s]}
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ flex:1, height:2, background: done && i < curIdx ? C.green : C.border,
                    marginBottom:14, minWidth:8 }} />
                )}
              </React.Fragment>
            );
          })}
          {isRejected && (
            <div style={{ marginLeft:8, fontSize:11, fontWeight:700, color:'#DC2626',
              background:'#FEF2F2', padding:'2px 8px', borderRadius:20 }}>✗ Rejected</div>
          )}
        </div>
      );
    }

    const active = myApps.filter(a => !['rejected','withdrawn'].includes(a.status));
    const closed = myApps.filter(a => ['rejected','withdrawn'].includes(a.status));

    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>My Applications</span></div>
        <SectionHead title="My Applications" />
        {loading
          ? <p style={{ color:C.ink3 }}>Loading…</p>
          : myApps.length === 0
            ? <Card><div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:36 }}>💼</div>
                <p style={{ color:C.ink3, margin:'12px 0' }}>No applications yet.</p>
                <Btn primary onClick={() => go('browse-jobs')}>Browse Jobs →</Btn>
              </div></Card>
            : <div>
                {/* Summary bar */}
                <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
                  {[['Total', myApps.length, C.navy],['Active', active.length, C.teal],
                    ['Interview', myApps.filter(a=>a.status==='interview').length, '#7C3AED'],
                    ['Offered', myApps.filter(a=>a.status==='offered'||a.status==='hired').length, C.green],
                    ['Rejected', myApps.filter(a=>a.status==='rejected').length, '#DC2626'],
                  ].map(([l,v,col]) => (
                    <div key={l} style={{ padding:'8px 16px', background:C.card, border:`1px solid ${C.border}`,
                      borderRadius:10, textAlign:'center', minWidth:70 }}>
                      <div style={{ fontSize:20, fontWeight:800, color:col }}>{v}</div>
                      <div style={{ fontSize:11, color:C.ink3, fontWeight:600 }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Active applications */}
                {active.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.navy, marginBottom:10 }}>Active Applications ({active.length})</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {active.map(a => (
                        <div key={a.id} style={{ background:C.card, border:`1px solid ${C.border}`,
                          borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 4px #0001' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <div>
                              <div style={{ fontWeight:700, fontSize:13.5, color:C.navy }}>{a.title || '—'}</div>
                              <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>
                                {a.org_name || a.employer_name || '—'} •{' '}
                                Applied {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—'}
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                              <StatusTag status={a.status} />
                              {withdrawConfirm === a.id ? (
                                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                                  <span style={{ fontSize:11.5, color:C.ink3 }}>Withdraw?</span>
                                  <button onClick={() => withdrawApplication(a.id)} disabled={withdrawingId === a.id}
                                    style={{ padding:'3px 10px', background:'#DC2626', color:'#fff', border:'none',
                                      borderRadius:6, fontSize:11.5, fontWeight:700, cursor:'pointer' }}>
                                    {withdrawingId===a.id ? '…' : 'Yes'}
                                  </button>
                                  <button onClick={() => setWithdrawConfirm(null)}
                                    style={{ padding:'3px 8px', background:C.surface, color:C.ink2,
                                      border:`1px solid ${C.border}`, borderRadius:6, fontSize:11.5, cursor:'pointer' }}>
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setWithdrawConfirm(a.id)}
                                  title="Withdraw application"
                                  style={{ padding:'4px 10px', background:'#FEF2F2', color:'#DC2626',
                                    border:'1px solid #FECACA', borderRadius:7, fontSize:11.5, fontWeight:600,
                                    cursor:'pointer' }}>
                                  Withdraw
                                </button>
                              )}
                            </div>
                          </div>
                          {renderStatusTimeline(a.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Closed applications */}
                {closed.length > 0 && (
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:C.ink3, marginBottom:10 }}>Closed / Rejected ({closed.length})</div>
                    <Card>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                        <thead><tr><Th>Job Title</Th><Th>Company</Th><Th>Applied On</Th><Th>Status</Th></tr></thead>
                        <tbody>
                          {closed.map(a => (
                            <tr key={a.id}>
                              <Td bold>{a.title || '—'}</Td>
                              <Td>{a.org_name || a.employer_name || '—'}</Td>
                              <Td>{a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—'}</Td>
                              <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                                <StatusTag status={a.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                )}
              </div>
        }
      </div>
    );
  }

  function PanelBrowseCourses() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📚 Courses › <span style={{ color:C.saffron }}>Browse Courses</span></div>
        <SectionHead title="Browse Courses" />
        <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
          {['All','IT & Digital','Healthcare','Construction','Agriculture','BFSI'].map(f => (
            <Btn key={f} primary={f==='All'} sm>{f}</Btn>
          ))}
        </div>
        {loading
          ? <p style={{ color:C.ink3 }}>Loading courses…</p>
          : courses.length === 0
            ? <Card><p style={{ color:C.ink3, textAlign:'center', padding:'40px 0' }}>No courses available right now.</p></Card>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {courses.map(c => (
                  <div key={c.id} style={{ border:`1px solid ${C.border}`, borderRadius:10,
                    padding:16, background:C.card, display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ fontSize:26 }}>📘</div>
                    <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>{c.title}</div>
                    <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:20,
                      fontSize:10, fontWeight:700, background:C.bluePale, color:C.blue, width:'fit-content' }}>
                      {c.sector || 'General'} · {c.level || 'NSQF L3'}
                    </span>
                    <div style={{ fontSize:12, color:C.ink3, lineHeight:1.5, flex:1 }}>
                      {c.description || 'NSQF-aligned course.'} · {c.provider || 'SIDH'}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>{c.duration || '—'} hrs</span>
                      {enrolledIds.has(c.id)
                        ? <span style={{ fontSize:11.5, fontWeight:700, color:C.teal }}>✓ Enrolled</span>
                        : <Btn primary sm onClick={() => openEnrollModal(c)}
                            style={{ opacity: enrollingId===c.id ? .6 : 1 }}>
                            {enrollingId===c.id ? 'Enrolling…' : 'Enroll Free'}
                          </Btn>
                      }
                    </div>
                  </div>
                ))}
              </div>
        }
      </div>
    );
  }

  function PanelMyCourses() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📚 Courses › <span style={{ color:C.saffron }}>My Courses</span></div>
        <SectionHead title="My Enrolled Courses" />
        {loading
          ? <p style={{ color:C.ink3 }}>Loading…</p>
          : myEnroll.length === 0
            ? <Card><div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:36 }}>📚</div>
                <p style={{ color:C.ink3, margin:'12px 0' }}>You haven't enrolled in any courses yet.</p>
                <Btn primary onClick={() => go('browse-courses')}>Browse Courses →</Btn>
              </div></Card>
            : <Card>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead><tr><Th>Course</Th><Th>Provider</Th><Th>Progress</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                  <tbody>
                    {myEnroll.map(e => {
                      const pctE = e.progress || 0;
                      const isComplete = e.status === 'completed' || pctE >= 100;
                      return (
                        <tr key={e.course_id || e.id}>
                          <Td bold>{e.title}</Td>
                          <Td>{e.provider || 'SIDH'}</Td>
                          <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ flex:1 }}><ProgBar pct={pctE} color={isComplete ? C.green : C.saffron} /></div>
                              <span style={{ fontSize:11, fontWeight:700 }}>{pctE}%</span>
                            </div>
                          </td>
                          <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ display:'inline-flex', padding:'3px 8px', borderRadius:20,
                              fontSize:10.5, fontWeight:700,
                              background: isComplete ? C.greenPale : C.saffronPale,
                              color: isComplete ? C.green : C.saffron }}>
                              {isComplete ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                            {isComplete
                              ? <Btn sm onClick={() => go('certificates')}>View Certificate</Btn>
                              : <Btn primary sm>Continue</Btn>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
        }
      </div>
    );
  }

  function PanelLearningProgress() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📚 Courses › <span style={{ color:C.saffron }}>Learning Progress</span></div>
        <SectionHead title="Learning Progress 📊" />
        {myEnroll.length === 0
          ? <Card><div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:36 }}>📊</div>
              <p style={{ color:C.ink3, margin:'12px 0' }}>Enroll in courses to track your learning progress here.</p>
              <Btn primary onClick={() => go('browse-courses')}>Browse Courses →</Btn>
            </div></Card>
          : <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
                {[
                  { icon:'📚', label:'Enrolled', value:myEnroll.length, color:C.blue },
                  { icon:'⏳', label:'In Progress', value:myEnroll.filter(e => e.status!=='completed' && (e.progress||0)<100).length, color:C.saffron },
                  { icon:'✅', label:'Completed', value:myEnroll.filter(e => e.status==='completed' || (e.progress||0)>=100).length, color:C.green },
                ].map(k => (
                  <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px' }}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
                    <div style={{ fontSize:26, fontWeight:800, color:k.color }}>{k.value}</div>
                    <div style={{ fontSize:12, color:C.ink3, marginTop:4 }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <Card>
                <CardTitle>📋 Course-wise Progress</CardTitle>
                {myEnroll.map(e => {
                  const pctE = e.progress || 0;
                  const isComplete = e.status === 'completed' || pctE >= 100;
                  return (
                    <div key={e.course_id||e.id} style={{ padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{e.title}</div>
                          <div style={{ fontSize:11.5, color:C.ink3, marginTop:2 }}>{e.provider || 'SIDH'} · {e.duration_weeks ? e.duration_weeks + ' weeks' : '—'}</div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color: isComplete ? C.green : C.saffron }}>{pctE}%</span>
                      </div>
                      <div style={{ height:8, background:C.surface, borderRadius:8, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pctE}%`, background:`linear-gradient(90deg,${isComplete ? C.green : C.saffron},${isComplete ? '#52C97A' : '#FFB347'})`, borderRadius:8 }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.ink3, marginTop:5 }}>
                        <span>Enrolled {e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : ''}</span>
                        <span style={{ color: isComplete ? C.green : C.saffron, fontWeight:600 }}>{isComplete ? 'Completed' : 'In Progress'}</span>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </>
        }
      </div>
    );
  }

  function PanelCertificates() {
    function downloadCertificate(cert) {
      const candidateName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || 'Candidate';
      const issuedDate = cert.issued_date
        ? new Date(cert.issued_date).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
        : 'N/A';
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Certificate — ${cert.course_title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#f8f5ef; display:flex; align-items:center; justify-content:center; min-height:100vh; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  .cert { width:900px; background:#fff; border:10px solid #010E3C; padding:0; position:relative; box-shadow:0 8px 40px rgba(0,0,0,0.15); }
  .top-bar { background:#010E3C; padding:20px 48px; display:flex; justify-content:space-between; align-items:center; }
  .logo-text { color:#fff; font-size:22px; font-weight:700; letter-spacing:1px; }
  .nsdc-badge { background:#FF671F; color:#fff; padding:6px 16px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:1px; }
  .body { padding:40px 60px 32px; text-align:center; }
  .cert-label { font-size:11px; font-weight:700; letter-spacing:3px; color:#6B7FA3; text-transform:uppercase; margin-bottom:8px; }
  .cert-title { font-family:'Playfair Display',serif; font-size:42px; font-weight:700; color:#010E3C; margin-bottom:4px; line-height:1.2; }
  .cert-sub { font-size:13px; color:#6B7FA3; margin-bottom:28px; }
  .divider { width:80px; height:3px; background:linear-gradient(90deg,#FF671F,#010E3C); margin:0 auto 28px; border-radius:2px; }
  .presented { font-size:13px; color:#6B7FA3; margin-bottom:8px; }
  .name { font-family:'Playfair Display',serif; font-size:36px; color:#FF671F; font-weight:700; margin-bottom:4px; }
  .course-label { font-size:13px; color:#6B7FA3; margin:20px 0 8px; }
  .course-name { font-size:22px; font-weight:700; color:#010E3C; margin-bottom:20px; }
  .meta-row { display:flex; justify-content:center; gap:40px; margin:20px 0; }
  .meta-box { text-align:center; }
  .meta-label { font-size:10px; font-weight:700; letter-spacing:2px; color:#6B7FA3; text-transform:uppercase; }
  .meta-val { font-size:15px; font-weight:700; color:#010E3C; margin-top:4px; }
  .nsqf-badge { display:inline-block; background:#010E3C; color:#fff; padding:6px 20px; border-radius:20px; font-size:12px; font-weight:700; margin:12px 0 24px; }
  .bottom-bar { background:#f8f5ef; border-top:2px solid #E0E6EF; padding:20px 60px; display:flex; justify-content:space-between; align-items:flex-end; }
  .sig-line { width:140px; border-top:2px solid #010E3C; padding-top:6px; font-size:11px; color:#6B7FA3; text-align:center; }
  .cert-no { font-size:11px; color:#aaa; text-align:center; margin-top:4px; }
  .seal { width:70px; height:70px; border-radius:50%; background:linear-gradient(135deg,#010E3C,#2563EB); display:flex; align-items:center; justify-content:center; color:#fff; font-size:28px; }
  @media print { body { background:#fff; } .cert { box-shadow:none; } }
</style></head><body>
<div class="cert">
  <div class="top-bar">
    <div class="logo-text">🎓 SkillsnJobs</div>
    <div style="color:#aaa;font-size:12px;">National Skill Development Platform</div>
    <div class="nsdc-badge">NSDC ALIGNED</div>
  </div>
  <div class="body">
    <div class="cert-label">Certificate of Completion</div>
    <div class="cert-title">CERTIFICATE</div>
    <div class="cert-sub">of Successful Completion</div>
    <div class="divider"></div>
    <div class="presented">This is to certify that</div>
    <div class="name">${candidateName}</div>
    <div class="course-label">has successfully completed the course</div>
    <div class="course-name">${cert.course_title}</div>
    <div class="nsqf-badge">NSQF Level ${cert.nsqf_level || '4'}</div>
    <div class="meta-row">
      <div class="meta-box"><div class="meta-label">Issued By</div><div class="meta-val">${cert.issuer || 'NSDC / SkillsnJobs'}</div></div>
      <div class="meta-box"><div class="meta-label">Issue Date</div><div class="meta-val">${issuedDate}</div></div>
      <div class="meta-box"><div class="meta-label">Certificate No.</div><div class="meta-val">${cert.cert_no || '—'}</div></div>
    </div>
  </div>
  <div class="bottom-bar">
    <div>
      <div class="sig-line">Authorised Signatory<br/>Training Provider</div>
    </div>
    <div class="seal">🏅</div>
    <div>
      <div class="sig-line">Director<br/>SkillsnJobs Platform</div>
    </div>
  </div>
  <div class="cert-no">Verify at: skillsnjobs.gov.in/verify · ${cert.cert_no || ''}</div>
</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        // Fallback: direct download
        const a = document.createElement('a');
        a.href = url; a.download = `Certificate_${cert.cert_no || cert.course_title}.html`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📚 Courses › <span style={{ color:C.saffron }}>My Certificates</span></div>
        <SectionHead title="My Certificates 🏆" />
        {myCerts.length === 0
          ? <Card>
              <div style={{ textAlign:'center', padding:'50px 0' }}>
                <div style={{ fontSize:52 }}>🏆</div>
                <div style={{ fontWeight:700, fontSize:16, color:C.navy, marginTop:14 }}>No Certificates Yet</div>
                <p style={{ color:C.ink3, marginTop:8, lineHeight:1.7 }}>
                  Complete enrolled courses to earn NSQF-linked certificates.<br />
                  Certificates can be downloaded and shared with employers.
                </p>
                <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:18 }}>
                  <Btn primary onClick={() => go('browse-courses')}>Browse Courses</Btn>
                  <Btn onClick={() => go('my-courses')}>My Courses</Btn>
                </div>
              </div>
            </Card>
          : <>
              {/* Certificate cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
                {myCerts.map(cert => (
                  <div key={cert.id} style={{ background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:12,
                    overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
                    {/* Card header */}
                    <div style={{ background:'linear-gradient(135deg,#010E3C,#1E3A6E)', padding:'20px 20px 16px', textAlign:'center' }}>
                      <div style={{ fontSize:36, marginBottom:6 }}>🏅</div>
                      <div style={{ color:'#fff', fontWeight:700, fontSize:13, lineHeight:1.4 }}>{cert.course_title}</div>
                      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, marginTop:4 }}>{cert.issuer || 'NSDC / SkillsnJobs'}</div>
                    </div>
                    {/* Card body */}
                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                        <div>
                          <div style={{ fontSize:10, color:C.ink3, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>NSQF Level</div>
                          <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginTop:2 }}>{cert.nsqf_level ? `Level ${cert.nsqf_level}` : 'Level 4'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:C.ink3, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Issued On</div>
                          <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginTop:2 }}>
                            {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                          </div>
                        </div>
                        <div style={{ gridColumn:'1/-1' }}>
                          <div style={{ fontSize:10, color:C.ink3, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Certificate No.</div>
                          <div style={{ fontSize:12, fontWeight:600, color:C.ink2, marginTop:2 }}>{cert.cert_no || '—'}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                          background: cert.status==='valid' ? '#F0FDF4' : '#FEF2F2',
                          color: cert.status==='valid' ? '#15803D' : '#DC2626' }}>
                          {cert.status === 'valid' ? '✅ Valid' : '❌ Revoked'}
                        </span>
                      </div>
                      {cert.status === 'valid' && (
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => downloadCertificate(cert)}
                            style={{ flex:1, padding:'8px 0', background:'#010E3C', color:'#fff', border:'none',
                              borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex',
                              alignItems:'center', justifyContent:'center', gap:5 }}>
                            ⬇ Download
                          </button>
                          <button onClick={() => setPreviewCert(previewCert?.id === cert.id ? null : cert)}
                            style={{ flex:1, padding:'8px 0', background:C.surface, color:C.navy, border:`1px solid ${C.border}`,
                              borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            👁 Preview
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Inline preview */}
                    {previewCert?.id === cert.id && (
                      <div style={{ borderTop:`1px solid ${C.border}`, padding:16 }}>
                        <div style={{ background:'linear-gradient(135deg,#010E3C,#1E3A6E)', borderRadius:10, padding:'20px 24px', color:'#fff', textAlign:'center' }}>
                          <div style={{ fontSize:11, letterSpacing:2, color:'rgba(255,255,255,0.6)', marginBottom:6, textTransform:'uppercase' }}>Certificate of Completion</div>
                          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>
                            {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name}
                          </div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:10 }}>has successfully completed</div>
                          <div style={{ fontSize:14, fontWeight:700, color:'#FFD700', marginBottom:12 }}>{cert.course_title}</div>
                          <div style={{ display:'flex', justifyContent:'center', gap:20, fontSize:11 }}>
                            <span>🏅 NSQF {cert.nsqf_level || '4'}</span>
                            <span>📅 {cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
                            <span>🔖 {cert.cert_no || '—'}</span>
                          </div>
                        </div>
                        <div style={{ textAlign:'center', marginTop:10 }}>
                          <button onClick={() => downloadCertificate(cert)}
                            style={{ padding:'8px 24px', background:'#010E3C', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                            ⬇ Download Full Certificate (PDF)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary table */}
              <Card>
                <CardTitle>All Certificates</CardTitle>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginTop:12 }}>
                  <thead><tr><Th>Course</Th><Th>Issuer</Th><Th>NSQF</Th><Th>Cert No.</Th><Th>Issued On</Th><Th>Status</Th><Th>Action</Th></tr></thead>
                  <tbody>
                    {myCerts.map(cert => (
                      <tr key={cert.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                        <Td bold>{cert.course_title}</Td>
                        <Td>{cert.issuer || 'NSDC / SkillsnJobs'}</Td>
                        <Td>Level {cert.nsqf_level || '4'}</Td>
                        <Td>{cert.cert_no || '—'}</Td>
                        <Td>{cert.issued_date ? new Date(cert.issued_date).toLocaleDateString('en-IN') : '—'}</Td>
                        <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ padding:'3px 8px', borderRadius:20, fontSize:10.5, fontWeight:700,
                            background: cert.status==='valid' ? '#F0FDF4' : '#FEF2F2',
                            color: cert.status==='valid' ? '#15803D' : '#DC2626' }}>
                            {cert.status === 'valid' ? '✅ Valid' : '❌ Revoked'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                          {cert.status === 'valid'
                            ? <button onClick={() => downloadCertificate(cert)}
                                style={{ padding:'5px 14px', background:'#010E3C', color:'#fff', border:'none',
                                  borderRadius:6, fontSize:11.5, fontWeight:700, cursor:'pointer' }}>
                                ⬇ Download
                              </button>
                            : <span style={{ color:C.ink3, fontSize:12 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
        }
      </div>
    );
  }

  function PanelAIRecommendations() {
    const recs = (courseRecs.recommendedCourses || []).length > 0
      ? courseRecs.recommendedCourses.slice(0, 6)
      : courses.filter(c => !enrolledIds.has(c.id)).slice(0, 6);
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📚 Courses › <span style={{ color:C.saffron }}>AI Recommendations</span></div>
        <SectionHead title="AI Course Recommendations 🤖" />
        <div style={{ padding:'14px 16px', background:C.bluePale, border:`1px solid #C5D9F5`, borderRadius:9, marginBottom:20, fontSize:13, color:C.blue }}>
          🤖 Recommendations are personalised based on your skills, job preferences, and learning history.
        </div>
        {recs.length === 0
          ? <Card><p style={{ color:C.ink3, textAlign:'center', padding:'40px 0' }}>Complete your profile to get personalised course recommendations.</p></Card>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {recs.map(c => (
                <div key={c.id} style={{ border:`1px solid ${C.border}`, borderRadius:10, padding:16, background:C.card, display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ fontSize:26 }}>📘</div>
                    <span style={{ fontSize:9.5, fontWeight:700, padding:'2px 8px', borderRadius:20, background:C.saffronPale, color:C.saffron }}>⭐ Recommended</span>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>{c.title}</div>
                  <div style={{ fontSize:12, color:C.ink3, lineHeight:1.5, flex:1 }}>{c.description || 'NSQF-aligned course.'}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>{c.duration || '—'} hrs</span>
                    {enrolledIds.has(c.id)
                      ? <span style={{ fontSize:11.5, fontWeight:700, color:C.teal }}>✓ Enrolled</span>
                      : <Btn primary sm onClick={() => enrollCourse(c.id)}>{enrollingId===c.id ? 'Enrolling…' : 'Enroll Free'}</Btn>
                    }
                  </div>
                </div>
              ))}
            </div>
        }
        <Card style={{ marginTop:18 }}>
          <CardTitle>💡 Why These Courses?</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:4 }}>
            {[
              ['🎯 Skill Gap Analysis','Based on your current skills vs job market demand.'],
              ['📍 Location Match','Courses available in your preferred region.'],
              ['💼 Job Role Fit','Aligned to your preferred job role and sector.'],
              ['📈 Career Growth','Courses that open higher NSQF-level opportunities.'],
            ].map(([t,d]) => (
              <div key={t} style={{ padding:'12px 14px', border:`1px solid ${C.border}`, borderRadius:8 }}>
                <div style={{ fontWeight:700, fontSize:12.5, color:C.navy, marginBottom:4 }}>{t}</div>
                <div style={{ fontSize:12, color:C.ink3 }}>{d}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function PanelAssessments() {
    const upcoming  = assessData?.upcoming  || [];
    const completed = assessData?.completed || [];

    const assessTab = active === 'assess-completed' ? 'completed'
                    : active === 'assess-results'   ? 'results'
                    : 'upcoming';

    function daysUntil(dateStr) {
      if (!dateStr) return null;
      const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
      return diff;
    }

    function UpcomingCard({ a }) {
      const date = (a.assess_date || a.scheduled_date || a.date || '').toString().slice(0, 10);
      const agency = a.agency || a.assessor || '—';
      const days = daysUntil(date);
      const urgency = days !== null && days <= 7 ? '#E53935' : days !== null && days <= 14 ? C.saffron : C.green;
      return (
        <div style={{ padding:'16px', border:`1.5px solid ${urgency}22`, borderLeft:`4px solid ${urgency}`,
          borderRadius:10, background:'#fff', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>{a.course_title || a.batch_code || 'Assessment'}</div>
              <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>
                Batch: {a.batch_code || '—'} · <span style={{ fontWeight:600, color:C.ink2 }}>{a.type || 'Final'} Assessment</span>
              </div>
            </div>
            {days !== null && (
              <span style={{ background: urgency + '18', color: urgency, fontWeight:700, fontSize:11,
                borderRadius:12, padding:'3px 10px', whiteSpace:'nowrap' }}>
                {days === 0 ? 'Today' : days < 0 ? 'Overdue' : `${days}d left`}
              </span>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:10 }}>
            <div>
              <div style={{ fontSize:10.5, color:C.ink3, fontWeight:600, textTransform:'uppercase', letterSpacing:0.4 }}>Date & Time</div>
              <div style={{ fontSize:12.5, color:C.ink, fontWeight:600, marginTop:2 }}>
                {date ? new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                {a.time_slot ? <><br />{a.time_slot}</> : ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:C.ink3, fontWeight:600, textTransform:'uppercase', letterSpacing:0.4 }}>Assessing Agency</div>
              <div style={{ fontSize:12.5, color:C.ink, fontWeight:600, marginTop:2 }}>{agency}</div>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:C.ink3, fontWeight:600, textTransform:'uppercase', letterSpacing:0.4 }}>Pass Marks</div>
              <div style={{ fontSize:12.5, color:C.ink, fontWeight:600, marginTop:2 }}>
                {a.total_marks ? `${a.passing_marks || 40} / ${a.total_marks}` : '—'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    function CompletedRow({ a }) {
      const date = (a.assess_date || a.scheduled_date || a.date || '').toString().slice(0, 10);
      const score = a.assessment_score ?? a.score ?? null;
      const passed = a.passed ?? (score !== null && a.passing_marks ? score >= a.passing_marks : null);
      return (
        <tr style={{ borderBottom:`1px solid ${C.border}` }}>
          <Td bold>{a.course_title || a.batch_code || 'Assessment'}</Td>
          <Td>{a.type || 'Final'}</Td>
          <Td>{date ? new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</Td>
          <Td>{a.agency || a.assessor || '—'}</Td>
          <Td>
            {score !== null
              ? <span style={{ fontWeight:700, color: passed ? C.green : '#E53935' }}>{score}/{a.total_marks || 100}</span>
              : <span style={{ color:C.ink3 }}>—</span>}
          </Td>
          <Td>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:12,
              background: passed ? '#F0FDF4' : passed === false ? '#FEF2F2' : C.surface,
              color: passed ? '#15803D' : passed === false ? '#DC2626' : C.ink3 }}>
              {passed ? '✅ Passed' : passed === false ? '❌ Failed' : '⏳ Awaited'}
            </span>
          </Td>
        </tr>
      );
    }

    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📝 <span style={{ color:C.saffron }}>Assessments</span></div>
        <SectionHead title="Assessments 📝" />

        {/* Tab switcher */}
        <div style={{ display:'flex', gap:0, marginBottom:20, background:C.card, border:`1px solid ${C.border}`, borderRadius:9, overflow:'hidden' }}>
          {[['upcoming','📅 Upcoming', upcoming.length],['completed','✅ Completed', completed.length],['results','📊 Results & Scorecards', null]].map(([k,l,cnt]) => (
            <button key={k} onClick={() => go(`assess-${k === 'upcoming' ? 'upcoming' : k === 'completed' ? 'completed' : 'results'}`)}
              style={{ flex:1, padding:'10px 0', border:'none', cursor:'pointer', fontSize:12.5, fontWeight:600,
                background: assessTab===k ? C.navy : 'transparent', color: assessTab===k ? '#fff' : C.ink2 }}>
              {l}{cnt ? ` (${cnt})` : ''}
            </button>
          ))}
        </div>

        {assessLoading ? (
          <Card><div style={{ textAlign:'center', padding:32, color:C.ink3 }}>Loading assessments…</div></Card>
        ) : assessTab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <Card>
              <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
                <div style={{ fontSize:40 }}>📅</div>
                <p style={{ marginTop:12, fontSize:13 }}>No upcoming assessments scheduled.</p>
                <Btn primary sm style={{ marginTop:14 }} onClick={() => go('browse-courses')}>Enroll in Courses</Btn>
              </div>
            </Card>
          ) : (
            <div>
              <div style={{ padding:'10px 14px', background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:9, marginBottom:16, fontSize:13, color:'#C2410C' }}>
                ⏰ You have <strong>{upcoming.length}</strong> upcoming assessment{upcoming.length > 1 ? 's' : ''}. Prepare well — passing marks are mandatory for certification.
              </div>
              {upcoming.map((a, i) => <UpcomingCard key={i} a={a} />)}
            </div>
          )
        ) : assessTab === 'completed' ? (
          completed.length === 0 ? (
            <Card>
              <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
                <div style={{ fontSize:40 }}>✅</div>
                <p style={{ marginTop:12, fontSize:13 }}>No assessments completed yet.</p>
              </div>
            </Card>
          ) : (
            <Card>
              <CardTitle>Completed Assessments</CardTitle>
              <table style={{ width:'100%', borderCollapse:'collapse', marginTop:12 }}>
                <thead><tr>{['Course / Batch','Type','Date','Agency','Score','Result'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>{completed.map((a,i) => <CompletedRow key={i} a={a} />)}</tbody>
              </table>
            </Card>
          )
        ) : (
          /* Results & Scorecards tab */
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
              {[
                { icon:'📝', label:'Total Assessments', value: (upcoming.length + completed.length) },
                { icon:'✅', label:'Passed', value: completed.filter(a => a.passed || (a.assessment_score != null && a.passing_marks && a.assessment_score >= a.passing_marks)).length, color: C.green },
                { icon:'🏅', label:'Certificates Earned', value: myCerts.length, color: C.saffron },
              ].map(k => (
                <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px', textAlign:'center' }}>
                  <div style={{ fontSize:28 }}>{k.icon}</div>
                  <div style={{ fontSize:26, fontWeight:800, color: k.color || C.navy, margin:'6px 0' }}>{k.value}</div>
                  <div style={{ fontSize:12, color:C.ink3 }}>{k.label}</div>
                </div>
              ))}
            </div>
            <Card>
              <CardTitle>Scorecard Summary</CardTitle>
              {completed.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', color:C.ink3, fontSize:13 }}>No completed assessments yet.</div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', marginTop:12 }}>
                  <thead><tr>{['Course / Batch','Type','Score','Result','Certificate'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                  <tbody>
                    {completed.map((a, i) => {
                      const score = a.assessment_score ?? a.score ?? null;
                      const passed = a.passed ?? (score !== null && a.passing_marks ? score >= a.passing_marks : null);
                      const cert = myCerts.find(c => (c.course_title||'').toLowerCase().includes((a.course_title||'').toLowerCase().split(' ')[0]));
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                          <Td bold>{a.course_title || a.batch_code || '—'}</Td>
                          <Td>{a.type || 'Final'}</Td>
                          <Td>{score !== null ? <span style={{ fontWeight:700, color: passed ? C.green : '#E53935' }}>{score}/{a.total_marks||100}</span> : '—'}</Td>
                          <Td>
                            <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:12,
                              background: passed ? '#F0FDF4' : '#FEF2F2', color: passed ? '#15803D' : '#DC2626' }}>
                              {passed ? '✅ Passed' : '❌ Failed'}
                            </span>
                          </Td>
                          <Td>{cert ? <span style={{ color:C.saffron, fontWeight:600, fontSize:12 }}>🏅 {cert.cert_no || 'Issued'}</span> : <span style={{ color:C.ink3, fontSize:12 }}>—</span>}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
        <Card>
          <CardTitle>🏅 RPL — Recognition of Prior Learning</CardTitle>
          <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>
            Have existing skills? Get them formally assessed and earn an NSQF certificate through the RPL process without attending full training.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
            {[['📋','Apply for RPL','Submit your prior experience'],['📍','Assessment Camp','Attend an RPL camp near you'],['🏅','Get Certified','Receive NSQF certificate']].map(([i,t,d]) => (
              <div key={t} style={{ padding:'14px', border:`1px solid ${C.border}`, borderRadius:9, textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{i}</div>
                <div style={{ fontWeight:700, fontSize:12.5, color:C.navy, marginBottom:4 }}>{t}</div>
                <div style={{ fontSize:11.5, color:C.ink3 }}>{d}</div>
              </div>
            ))}
          </div>
          <Btn primary onClick={() => go('rpl-scheme')}>Apply for RPL Assessment →</Btn>
        </Card>
      </div>
    );
  }

  function PanelSavedJobs() {
    async function unsave(jobId) {
      await api.unsaveJob(jobId).catch(()=>{});
      setSavedJobs(s => s.filter(j => j.job_id !== jobId));
      setSavedJobIds(s => { const n = new Set(s); n.delete(jobId); return n; });
    }
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>Saved Jobs</span></div>
        <SectionHead title="Saved Jobs 🔖" />
        {savedJobs.length === 0 ? (
          <Card>
            <div style={{ textAlign:'center', padding:'50px 0' }}>
              <div style={{ fontSize:48 }}>🔖</div>
              <div style={{ fontWeight:700, fontSize:16, color:C.navy, marginTop:14 }}>No Saved Jobs</div>
              <p style={{ color:C.ink3, marginTop:8 }}>Bookmark jobs while browsing to review and apply later.</p>
              <div style={{ marginTop:18 }}><Btn primary onClick={() => go('browse-jobs')}>Browse Jobs →</Btn></div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardTitle action={`${savedJobs.length} saved`}>{null}</CardTitle>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr><Th>Job Title</Th><Th>Company</Th><Th>Location</Th><Th>Saved On</Th><Th>Action</Th></tr></thead>
              <tbody>
                {savedJobs.map(j => (
                  <tr key={j.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <Td bold>{j.title}</Td>
                    <Td>{j.company || '—'}</Td>
                    <Td>{j.location || '—'}</Td>
                    <Td>{new Date(j.saved_at).toLocaleDateString('en-IN')}</Td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Btn sm primary onClick={() => { go('browse-jobs'); }}>Apply</Btn>
                        <Btn sm onClick={() => unsave(j.job_id)}>🗑 Remove</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    );
  }

  function PanelJobAlerts() {
    const active = jobAlertDb;
    async function saveAlerts() {
      if (!jobAlertsForm.role && !jobAlertsForm.sector && !jobAlertsForm.location) {
        toast3('Please fill in at least one preference.', false); return;
      }
      try {
        const saved = await api.upsertJobAlert({
          preferred_role: jobAlertsForm.role,
          preferred_sector: jobAlertsForm.sector,
          preferred_location: jobAlertsForm.location,
          frequency: jobAlertsForm.frequency,
          is_active: true,
        });
        setJobAlertDb(saved);
        toast3('Job alerts saved to your account!');
      } catch(e) { toast3('Save failed: ' + e.message, false); }
    }
    async function deactivate() {
      try {
        const saved = await api.upsertJobAlert({ ...jobAlertDb, is_active: false });
        setJobAlertDb(saved);
        toast3('Job alerts deactivated.');
      } catch(e) { toast3('Failed: ' + e.message, false); }
    }
    const inp = { width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' };
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>Job Alerts</span></div>
        <SectionHead title="Job Alerts 🔔" />
        {jobAlertLoading ? (
          <Card><p style={{ color:C.ink3, textAlign:'center', padding:'20px 0' }}>Loading…</p></Card>
        ) : (
          <>
            {active?.is_active && (
              <div style={{ padding:'12px 16px', background:C.greenPale, border:`1px solid ${C.green}33`, borderRadius:9, marginBottom:16, fontSize:13, color:C.green, fontWeight:600 }}>
                ✅ Active alerts for: {[active.preferred_role, active.preferred_sector, active.preferred_location].filter(Boolean).join(' · ')} · {active.frequency}
              </div>
            )}
            <Card>
              <CardTitle>Set Up Job Alerts</CardTitle>
              <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:16 }}>
                Get notified when new jobs matching your profile are posted. Saved to your account.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                {[
                  ['Preferred Job Role','role','preferred_role','e.g. Data Analyst, Electrician'],
                  ['Preferred Sector','sector','preferred_sector','e.g. IT, Healthcare, Retail'],
                  ['Preferred Location','location','preferred_location','State / City'],
                ].map(([l, k, dbk, p]) => (
                  <div key={l}>
                    <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>{l}</label>
                    <input
                      value={active?.is_active ? (active[dbk]||'') : (jobAlertsForm[k]||'')}
                      placeholder={p}
                      onChange={e => setJobAlertsForm(s => ({ ...s, [k]: e.target.value }))}
                      readOnly={!!active?.is_active}
                      style={{ ...inp, background: active?.is_active ? C.surface : '#fff' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Alert Frequency</label>
                  <select
                    value={active?.is_active ? (active.frequency||'Daily') : jobAlertsForm.frequency}
                    onChange={e => setJobAlertsForm(s => ({ ...s, frequency: e.target.value }))}
                    disabled={!!active?.is_active}
                    style={{ ...inp, background: active?.is_active ? C.surface : '#fff' }}>
                    <option>Daily</option><option>Weekly</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {active?.is_active
                  ? <><Btn onClick={() => setJobAlertDb(null)}>✏️ Edit Preferences</Btn>
                      <Btn onClick={deactivate}>🔕 Deactivate</Btn></>
                  : <Btn primary onClick={saveAlerts}>🔔 Activate Job Alerts</Btn>
                }
              </div>
            </Card>
          </>
        )}
      </div>
    );
  }

  function PanelPlacementStatus() {
    const statusColor = s => ({
      placed:'#7C3AED', joined:C.green, offer_extended:C.saffron, interviewing:C.blue,
    }[s] || C.ink3);
    const statusLabel = s => ({
      placed:'Placed', joined:'Joined', offer_extended:'Offer Extended', interviewing:'Interviewing',
    }[s] || s);
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💼 Jobs › <span style={{ color:C.saffron }}>Placement Status</span></div>
        <SectionHead title="Placement Status 📋" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          {[
            { icon:'📤', label:'Applications Sent', value: myApps.length, color:C.blue },
            { icon:'👀', label:'Shortlisted', value: myApps.filter(a=>a.status==='shortlisted').length, color:C.saffron },
            { icon:'🚀', label:'Agency Referrals', value: myPlacements.length, color:'#7C3AED' },
            { icon:'✅', label:'Placed / Joined', value: myPlacements.filter(p=>['placed','joined'].includes(p.status)).length, color:C.green },
          ].map(k => (
            <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{k.icon}</div>
              <div style={{ fontSize:26, fontWeight:800, color:k.color }}>{k.value}</div>
              <div style={{ fontSize:12, color:C.ink3, marginTop:4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {myPlacements.length > 0 && (
          <Card style={{ marginBottom:18 }}>
            <CardTitle>🚀 Placement Agency Referrals</CardTitle>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr><Th>Role</Th><Th>Company</Th><Th>Location</Th><Th>CTC</Th><Th>Agency</Th><Th>Date</Th><Th>Status</Th></tr></thead>
              <tbody>
                {myPlacements.map(p => (
                  <tr key={p.id}>
                    <Td bold>{p.job_title}</Td>
                    <Td>{p.company || p.employer_org || '—'}</Td>
                    <Td>{p.location || '—'}</Td>
                    <Td>{p.ctc ? `₹${(p.ctc/100000).toFixed(1)} LPA` : '—'}</Td>
                    <Td>{p.agency_name || '—'}</Td>
                    <Td>{p.placement_date ? new Date(p.placement_date).toLocaleDateString('en-IN') : '—'}</Td>
                    <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                      <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:20, fontSize:10.5, fontWeight:700,
                        background: statusColor(p.status) + '22', color: statusColor(p.status) }}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card>
          <CardTitle>📊 Application Timeline</CardTitle>
          {myApps.length === 0
            ? <p style={{ color:C.ink3, padding:'20px 0', textAlign:'center' }}>Apply to jobs to track placement status here.</p>
            : <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead><tr><Th>Job</Th><Th>Company</Th><Th>Applied On</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {myApps.map(a => (
                    <tr key={a.id}>
                      <Td bold>{a.title}</Td>
                      <Td>{a.company || a.employer_name || '—'}</Td>
                      <Td>{a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-IN') : new Date(a.created_at).toLocaleDateString('en-IN')}</Td>
                      <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}><StatusTag status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </Card>
      </div>
    );
  }

  function PanelCareerServices() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🚀 <span style={{ color:C.saffron }}>Career Services</span></div>
        <SectionHead title="Career Services 🚀" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {[
            { icon:'📄', title:'Resume Builder', desc:'Build a professional resume with our guided template. Download as PDF and share with employers.', btn:'Build Resume', id:'resume-builder' },
            { icon:'🎙️', title:'Career Counselling', desc:'Book a one-on-one session with a career expert to plan your skill-to-career journey.', btn:'Book Session', id:'career-counselling' },
            { icon:'🎤', title:'Mock Interviews', desc:'Practice interviews with industry scenarios. Get AI feedback and tips to improve.', btn:'Start Practice', id:'mock-interviews' },
            { icon:'🗺️', title:'Career Pathways', desc:'Explore NSQF-linked career paths in your preferred sector with skill and salary benchmarks.', btn:'Explore Paths', id:'career-path' },
          ].map(s => (
            <Card key={s.id}>
              <div style={{ fontSize:32, marginBottom:10 }}>{s.icon}</div>
              <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>{s.title}</div>
              <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>{s.desc}</p>
              <Btn primary sm onClick={() => go(s.id)}>{s.btn} →</Btn>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function PanelCareerCounselling() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🎙️ <span style={{ color:C.saffron }}>Career Counselling</span></div>
        <SectionHead title="Career Counselling 🎙️" />
        <div style={{ padding:'14px 16px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:9, marginBottom:20, fontSize:13, color:'#1D4ED8' }}>
          Book a one-on-one session with a certified career counsellor to chart your skill-to-career journey.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }}>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>📅</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>Book a Session</div>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Schedule a 30-minute or 60-minute one-on-one with a career expert in your sector.</p>
            <Btn primary sm>Book Now →</Btn>
          </Card>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>💬</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>Chat with a Counsellor</div>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Get quick advice via live chat. Available Mon–Sat, 9 AM – 6 PM.</p>
            <Btn sm>Start Chat →</Btn>
          </Card>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>Career Assessment</div>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Take a guided interest & aptitude test and receive personalised career suggestions.</p>
            <Btn sm>Take Assessment →</Btn>
          </Card>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>🎓</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>My Sessions</div>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>View upcoming appointments, past session notes, and counsellor recommendations.</p>
            <Btn sm>View Sessions →</Btn>
          </Card>
        </div>
      </div>
    );
  }

  function PanelCareerPathways() {
    const paths = [
      { sector:'IT & ITES', roles:['Data Analyst','Web Developer','Cybersecurity Analyst'], nsqf:'4–6', salary:'₹3–12 LPA', icon:'💻' },
      { sector:'Healthcare', roles:['Lab Technician','Nursing Assistant','Paramedic'], nsqf:'3–5', salary:'₹2–7 LPA', icon:'🏥' },
      { sector:'Construction', roles:['Supervisor','Surveyor','Safety Officer'], nsqf:'3–5', salary:'₹2–6 LPA', icon:'🏗️' },
      { sector:'Retail & Logistics', roles:['Warehouse Manager','Supply Chain Analyst','Retail Lead'], nsqf:'3–5', salary:'₹2–5 LPA', icon:'🛒' },
      { sector:'Beauty & Wellness', roles:['Cosmetologist','Spa Therapist','Salon Manager'], nsqf:'3–4', salary:'₹1.5–5 LPA', icon:'💇' },
      { sector:'Agriculture', roles:['Agri-tech Operator','Farm Supervisor','Horticulture Expert'], nsqf:'3–5', salary:'₹1.5–4 LPA', icon:'🌾' },
    ];
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🗺️ <span style={{ color:C.saffron }}>Career Pathways</span></div>
        <SectionHead title="Career Pathways 🗺️" />
        <p style={{ fontSize:13, color:C.ink2, marginBottom:18, lineHeight:1.7 }}>
          Explore NSQF-linked career paths across sectors. Each pathway shows the roles you can grow into, the qualification level required, and expected salary range.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {paths.map(p => (
            <Card key={p.sector}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontSize:24 }}>{p.icon}</span>
                <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{p.sector}</div>
              </div>
              <div style={{ marginBottom:8 }}>
                {p.roles.map(r => (
                  <div key={r} style={{ fontSize:12, color:C.ink2, padding:'3px 0', borderBottom:`1px solid ${C.border}` }}>• {r}</div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:11.5 }}>
                <span style={{ color:C.teal, fontWeight:600 }}>NSQF {p.nsqf}</span>
                <span style={{ color:C.ink3 }}>{p.salary}</span>
              </div>
              <Btn sm style={{ marginTop:10, width:'100%' }}>Explore Path →</Btn>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function PanelApprenticeship() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🔧 <span style={{ color:C.saffron }}>Apprenticeship</span></div>
        <SectionHead title="Apprenticeship 🔧" />
        <div style={{ padding:'14px 16px', background:C.tealPale, border:`1px solid #A8D8CE`, borderRadius:9, marginBottom:20, fontSize:13, color:C.teal }}>
          🔧 Under the National Apprenticeship Promotion Scheme (NAPS), the Government of India pays 25% of the stipend directly to apprentices.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }}>
          <Card>
            <CardTitle>🔍 Browse Opportunities</CardTitle>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Find apprenticeship openings across sectors in your preferred location.</p>
            <Btn primary sm onClick={() => go('apprentice-browse')}>Search Apprenticeships</Btn>
          </Card>
          <Card>
            <CardTitle>📝 NAPS Registration</CardTitle>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Register on the National Apprenticeship Portal (NAPS) to access thousands of opportunities.</p>
            <Btn primary sm onClick={() => go('naps')}>Register on NAPS →</Btn>
          </Card>
        </div>
        <Card>
          <CardTitle>📋 My Applications</CardTitle>
          <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
            <div style={{ fontSize:36 }}>📋</div>
            <p style={{ marginTop:10, fontSize:13 }}>No apprenticeship applications yet. <span onClick={() => go('apprentice-browse')} style={{ color:C.blue, cursor:'pointer', fontWeight:600 }}>Browse opportunities →</span></p>
          </div>
        </Card>
      </div>
    );
  }

  function PanelApprenticeBrowse() {
    // Filter real jobs tagged as apprenticeship/internship from the jobs state
    const apprenticeJobs = jobs.filter(j =>
      j.job_type === 'apprenticeship' || j.job_type === 'internship' ||
      (j.title || '').toLowerCase().includes('apprentice') ||
      (j.title || '').toLowerCase().includes('trainee')
    );
    const filtered = appSearch
      ? apprenticeJobs.filter(j =>
          (j.title || '').toLowerCase().includes(appSearch.toLowerCase()) ||
          (j.employer_name || j.company || '').toLowerCase().includes(appSearch.toLowerCase()) ||
          (j.location || '').toLowerCase().includes(appSearch.toLowerCase())
        )
      : apprenticeJobs;
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🔧 <span style={{ color:C.saffron }}>Apprenticeship</span></div>
        <SectionHead title="Browse Opportunities 🔍" />
        <div style={{ padding:'14px 16px', background:C.tealPale, border:`1px solid #A8D8CE`, borderRadius:9, marginBottom:18, fontSize:13, color:C.teal }}>
          🔧 Under NAPS, the Government of India pays 25% of the stipend directly to apprentices.
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          <input value={appSearch} onChange={e => setAppSearch(e.target.value)}
            placeholder="Search by role, company or location…" style={{ flex:1, padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none' }} />
          <Btn primary sm>🔍 Search</Btn>
        </div>
        {filtered.length ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {filtered.map(l => (
              <Card key={l.id}>
                <div style={{ fontWeight:700, fontSize:13, color:C.navy, marginBottom:4 }}>{l.title}</div>
                <div style={{ fontSize:12, color:C.ink2, marginBottom:8 }}>{l.employer_name || l.company || 'Employer'} · {l.location}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  <span style={{ fontSize:11, background:'#EFF6FF', color:C.blue, borderRadius:5, padding:'2px 8px' }}>{l.job_type}</span>
                  {l.salary_min && <span style={{ fontSize:11, background:'#FFF7ED', color:'#C2410C', borderRadius:5, padding:'2px 8px' }}>₹{Math.round(l.salary_min/1000)}k–{Math.round(l.salary_max/1000)}k/yr</span>}
                </div>
                <Btn primary sm onClick={() => { setSelectedJob(l); go('browse-jobs'); }}>Apply Now →</Btn>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
              <div style={{ fontSize:40 }}>🔍</div>
              <p style={{ marginTop:12, fontSize:13 }}>No apprenticeship opportunities found yet. Employers post apprenticeship openings from their portal.</p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  function PanelApprenticeApplied() {
    // Filter real applications for apprenticeship/trainee/internship jobs
    const apprenticeJobIds = new Set(
      jobs.filter(j =>
        j.job_type === 'apprenticeship' || j.job_type === 'internship' ||
        (j.title || '').toLowerCase().includes('apprentice') ||
        (j.title || '').toLowerCase().includes('trainee')
      ).map(j => j.id)
    );
    const applied = myApps.filter(a => apprenticeJobIds.has(a.job_id));
    const statusColor = { applied:'#D97706', shortlisted:'#1D4ED8', interview:'#7C3AED', offered:C.green, hired:C.green, rejected:'#DC2626' };
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🔧 <span style={{ color:C.saffron }}>Apprenticeship</span></div>
        <SectionHead title="My Applications 📋" />
        {applied.length === 0 ? (
          <Card>
            <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
              <div style={{ fontSize:36 }}>📋</div>
              <p style={{ marginTop:10, fontSize:13 }}>No apprenticeship applications yet. <span onClick={() => go('apprentice-browse')} style={{ color:C.blue, cursor:'pointer', fontWeight:600 }}>Browse opportunities →</span></p>
            </div>
          </Card>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {applied.map(a => {
              const clr = statusColor[a.status] || '#888';
              return (
                <Card key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{a.job_title || a.title}</div>
                    <div style={{ fontSize:12, color:C.ink2, marginTop:2 }}>{a.employer_name || a.company || 'Employer'}</div>
                    <div style={{ fontSize:11, color:C.ink3, marginTop:4 }}>Applied: {a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:clr, background:clr+'18', borderRadius:6, padding:'4px 12px', textTransform:'capitalize' }}>{a.status}</span>
                    <div style={{ marginTop:8 }}><Btn sm onClick={() => go('my-applications')}>View Details</Btn></div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function PanelNapsRegistration() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🔧 <span style={{ color:C.saffron }}>Apprenticeship</span></div>
        <SectionHead title="NAPS Registration 📝" />
        <div style={{ padding:'14px 16px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:9, marginBottom:20, fontSize:13, color:'#1D4ED8' }}>
          📝 The National Apprenticeship Promotion Scheme (NAPS) is managed by the Ministry of Skill Development & Entrepreneurship. Register below to access thousands of government-backed apprenticeship openings.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }}>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>🆕</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>New Registration</div>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Register on the NAPS portal for the first time. You will need your Aadhaar, qualification certificates, and bank details.</p>
            <Btn primary sm onClick={() => window.open('https://www.apprenticeshipindia.gov.in', '_blank')}>Register on NAPS →</Btn>
          </Card>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>🔗</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>Link Existing Account</div>
            <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>Already registered on NAPS? Link your NAPS ID to your SkillsnJobs profile for unified tracking.</p>
            <Btn sm>Link NAPS ID</Btn>
          </Card>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>Documents Needed</div>
            <div style={{ fontSize:12.5, color:C.ink2, lineHeight:1.8 }}>
              {['Aadhaar Card','Class 10 / ITI Certificate','Bank Account (for stipend)','Passport-size Photo','Mobile linked to Aadhaar'].map(d => (
                <div key={d}>✅ {d}</div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:28, marginBottom:8 }}>❓</div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:6 }}>FAQs</div>
            {[['Who can apply?','Any Indian citizen aged 14–35 who has completed Class 8 or above.'],['How is stipend paid?','25% by govt directly to your bank; 75% by employer.'],['Duration?','6 months to 3 years depending on trade.']].map(([q,a]) => (
              <div key={q} style={{ marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.ink }}>{q}</div>
                <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>{a}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  function PanelFinancialAid() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>💰 <span style={{ color:C.saffron }}>Financial Assistance</span></div>
        <SectionHead title="Financial Assistance 💰" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {[
            { icon:'🎓', title:'Training Stipend', desc:'Monthly stipend during PMKVY-funded training. Paid directly to bank account post-biometric attendance.' },
            { icon:'✅', title:'Post-Placement Incentive', desc:'One-time incentive for candidates placed in jobs after skill training. Paid in two tranches.' },
            { icon:'🏅', title:'Merit Scholarship', desc:'Scholarship for top performers in NSQF assessments. Contact your Training Centre for details.' },
            { icon:'🏠', title:'Hostel / Boarding Allowance', desc:'Available for outstation candidates undergoing residential training programmes.' },
            { icon:'🚌', title:'Transport Allowance', desc:'Reimbursement for daily travel to training centre (selected schemes only).' },
            { icon:'♿', title:'Differently Abled Support', desc:'Special incentives and accessibility support under the UDAAN and DAP schemes.' },
          ].map(s => (
            <Card key={s.title}>
              <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, color:C.navy, marginBottom:6 }}>{s.title}</div>
              <div style={{ fontSize:12.5, color:C.ink3, lineHeight:1.6 }}>{s.desc}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function PanelGrievance() {
    async function submitGrievance() {
      if (!grievForm.subject || !grievForm.description) {
        setGrievMsg('❌ Subject and description are required.'); return;
      }
      const subErr = validateText(grievForm.subject, 'Subject', { min: 5, max: 200 });
      if (subErr) { setGrievMsg('❌ ' + subErr); return; }
      const descErr = validateText(grievForm.description, 'Description', { min: 10, max: 2000 });
      if (descErr) { setGrievMsg('❌ ' + descErr); return; }
      setGrievSaving(true); setGrievMsg('');
      try {
        const newG = await api.submitGrievance(grievForm);
        setGrievances(g => [newG, ...g]);
        setGrievForm({ category:'', subject:'', description:'' });
        setGrievMsg('✅ Grievance submitted successfully.');
      } catch (e) {
        setGrievMsg('❌ ' + e.message);
      } finally { setGrievSaving(false); }
    }
    const inp = { width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, background:'#fff', outline:'none', boxSizing:'border-box' };
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📣 <span style={{ color:C.saffron }}>Grievance</span></div>
        <SectionHead title="Grievance Redressal 📣" />
        <Card>
          <CardTitle>Submit a Grievance</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Category</label>
              <select value={grievForm.category} onChange={e => setGrievForm(f => ({ ...f, category:e.target.value }))} style={inp}>
                <option value="">Select Category</option>
                {['Training Issue','Job Issue','Technical','Payment / Stipend','Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Subject</label>
              <input placeholder="Brief subject of the grievance" value={grievForm.subject}
                onChange={e => setGrievForm(f => ({ ...f, subject:e.target.value }))} style={inp} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Description</label>
            <textarea placeholder="Describe your grievance in detail…" rows={4} value={grievForm.description}
              onChange={e => setGrievForm(f => ({ ...f, description:e.target.value }))}
              style={{ ...inp, resize:'vertical', fontFamily:'inherit' }} />
          </div>
          {grievMsg && <div style={{ marginBottom:12, fontSize:13, color: grievMsg.startsWith('✅') ? C.green : '#DC2626' }}>{grievMsg}</div>}
          <Btn primary onClick={submitGrievance}>{grievSaving ? 'Submitting…' : '📤 Submit Grievance'}</Btn>
        </Card>
        <Card style={{ marginTop:18 }}>
          <CardTitle>📋 My Grievances</CardTitle>
          {grievances.length === 0
            ? <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}><p style={{ fontSize:13 }}>No grievances submitted yet.</p></div>
            : <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead><tr><Th>Subject</Th><Th>Category</Th><Th>Submitted On</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {grievances.map(g => (
                    <tr key={g.id}>
                      <Td bold>{g.subject}</Td>
                      <Td>{g.category}</Td>
                      <Td>{new Date(g.created_at).toLocaleDateString('en-IN')}</Td>
                      <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                        <span style={{ display:'inline-flex', padding:'3px 8px', borderRadius:20, fontSize:10.5, fontWeight:700,
                          background: g.status==='Resolved' ? C.greenPale : C.saffronPale,
                          color: g.status==='Resolved' ? C.green : C.saffron }}>{g.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </Card>
      </div>
    );
  }

  function PanelSkillPassport() {
    const skills = (() => {
      if (Array.isArray(u.skills)) return u.skills;
      if (typeof u.skills === 'string') {
        try { const p = JSON.parse(u.skills); if (Array.isArray(p)) return p; } catch {}
        return u.skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    })();
    const certifiedSkills = new Set(myCerts.map(c => c.course_title));
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>👤 › <span style={{ color:C.saffron }}>Skill Passport</span></div>
        <SectionHead title="My Skill Passport 🏅" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
          <Card>
            <CardTitle>✅ Verified Skills</CardTitle>
            {skills.length === 0
              ? <p style={{ color:C.ink3, fontSize:13 }}>No skills added yet. <span onClick={() => go('profile-skills')} style={{ color:C.saffron, cursor:'pointer' }}>Add skills →</span></p>
              : <div style={{ lineHeight:2 }}>
                  {skills.map(s => (
                    <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:5,
                      background: certifiedSkills.has(s) ? C.greenPale : C.tealPale,
                      color: certifiedSkills.has(s) ? C.green : C.teal,
                      border:`1px solid ${certifiedSkills.has(s) ? C.green+'44' : '#A8D8CE'}`,
                      borderRadius:20, padding:'4px 11px', fontSize:11.5, fontWeight:600, margin:3 }}>
                      {s.trim()} {certifiedSkills.has(s) ? <span title="NSDC Certified">🏅</span> : <span style={{ color:C.green }}>✓</span>}
                    </span>
                  ))}
                </div>
            }
          </Card>
          <Card>
            <CardTitle>📋 Profile Information</CardTitle>
            {[
              ['Name', u.name],
              ['Email', u.email],
              ['Phone', (u.phone||'').replace(/^\+91/,'')],
              ['Location', [profileDraft.city, profileDraft.state_name].filter(Boolean).join(', ') || u.location],
              ['DOB', profileDraft.dob ? new Date(profileDraft.dob).toLocaleDateString('en-IN') : null],
              ['Category', profileDraft.category],
              ['Education', u.qualification],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:10, padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.ink3, width:80, flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:12.5, color: v ? C.ink : C.ink3, fontStyle: v ? 'normal' : 'italic' }}>{v || 'Not added'}</span>
              </div>
            ))}
            <div style={{ marginTop:14 }}><Btn primary sm onClick={() => go('profile-basic')}>✏️ Edit Profile</Btn></div>
          </Card>
        </div>
        <Card>
          <CardTitle>🏆 Certificates & Credentials</CardTitle>
          {myCerts.length === 0
            ? <div style={{ textAlign:'center', padding:'30px 0', color:C.ink3 }}>
                <div style={{ fontSize:36 }}>🏆</div>
                <p style={{ marginTop:12 }}>Complete enrolled courses to earn NSQF certificates.</p>
                <div style={{ marginTop:14 }}><Btn primary sm onClick={() => go('browse-courses')}>Browse Courses →</Btn></div>
              </div>
            : <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginTop:8 }}>
                <thead><tr><Th>Course</Th><Th>Issuer</Th><Th>NSQF</Th><Th>Cert No.</Th><Th>Issued</Th></tr></thead>
                <tbody>
                  {myCerts.map(c => (
                    <tr key={c.id}>
                      <Td bold>{c.course_title}</Td>
                      <Td>{c.issuer || 'NSDC'}</Td>
                      <Td>Level {c.nsqf_level || '4'}</Td>
                      <Td>{c.cert_no || '—'}</Td>
                      <Td>{c.issued_date ? new Date(c.issued_date).toLocaleDateString('en-IN') : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </Card>
      </div>
    );
  }

  function PanelSchemes() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🏛️ <span style={{ color:C.saffron }}>Government Schemes</span></div>
        <SectionHead title="Government Schemes" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {[
            { icon:'🎓', name:'PMKVY 4.0 — PM Kaushal Vikas Yojana', desc:'Free short-term skill training with NSQF certification, monetary reward & placement support.', btn:'Apply Now', id:'pmkvy' },
            { icon:'🔧', name:'NAPS — National Apprenticeship', desc:'Apprenticeship with industry; govt pays 25% of stipend directly to your account.', btn:'Register', id:'naps' },
            { icon:'🏅', name:'RPL — Recognition of Prior Learning', desc:'Get NSQF certificate for skills you already have. Cash incentive on certification.', btn:'Check Eligibility', id:'rpl-scheme' },
            { icon:'💰', name:'Scholarships & Stipends', desc:'Monthly stipend during training, post-placement incentive, and merit scholarships.', btn:'View Scholarships', id:'scholarship' },
          ].map(s => (
            <Card key={s.name}>
              <CardTitle>{s.icon} {s.name}</CardTitle>
              <p style={{ fontSize:13, color:C.ink2, lineHeight:1.7, marginBottom:14 }}>{s.desc}</p>
              <Btn primary sm onClick={() => go(s.id)}>{s.btn}</Btn>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function PanelNotifications() {
    const unreadCount = dbNotifications.filter(n => !n.is_read).length;
    async function markAll() {
      await api.markAllNotificationsRead().catch(()=>{});
      setDbNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    }
    async function markOne(id) {
      await api.markNotificationRead(id).catch(()=>{});
      setDbNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
    const typeIcon = { info:'ℹ️', success:'✅', warning:'⚠️', error:'❌' };
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <SectionHead title={`Notifications 🔔${unreadCount ? ` (${unreadCount})` : ''}`} />
          {unreadCount > 0 && <Btn sm onClick={markAll}>Mark all read</Btn>}
        </div>
        <Card>
          {notifsLoading ? (
            <p style={{ color:C.ink3, textAlign:'center', padding:'20px 0' }}>Loading…</p>
          ) : dbNotifications.length === 0 ? (
            <p style={{ color:C.ink3, textAlign:'center', padding:'20px 0', fontSize:13 }}>No notifications yet.</p>
          ) : dbNotifications.map((n, i) => (
            <div key={n.id} style={{ display:'flex', gap:10, padding:'13px 0',
              borderBottom: i < dbNotifications.length-1 ? `1px solid ${C.border}` : 'none',
              opacity: n.is_read ? 0.6 : 1, cursor: n.is_read ? 'default' : 'pointer' }}
              onClick={() => !n.is_read && markOne(n.id)}>
              <div style={{ width:8, height:8, borderRadius:'50%',
                background: n.is_read ? C.border : C.saffron, marginTop:5, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:13, fontWeight: n.is_read ? 400 : 600, color:C.ink, lineHeight:1.4 }}>
                  {typeIcon[n.type] || 'ℹ️'} {n.title}
                </div>
                <div style={{ fontSize:12, color:C.ink2, lineHeight:1.5, marginTop:2 }}>{n.body}</div>
                <div style={{ fontSize:11, color:C.ink3, marginTop:3 }}>
                  {new Date(n.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  function PanelProfile() {
    const STEPS = [
      { id:'profile-basic',  icon:'👤', label:'Personal Details' },
      { id:'profile-edu',    icon:'🎓', label:'Education' },
      { id:'profile-exp',    icon:'💼', label:'Work Experience' },
      { id:'profile-skills', icon:'🛠️', label:'Skills' },
      { id:'profile-docs',   icon:'📄', label:'Documents' },
      { id:'profile-pref',   icon:'🎯', label:'Job Preferences' },
    ];
    const stepIdx = STEPS.findIndex(s => s.id === active);
    const cur = stepIdx === -1 ? 0 : stepIdx;

    const Lbl = ({ children, req }) => (
      <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>
        {children}{req && <span style={{ color:'#DC2626', marginLeft:2 }}>*</span>}
      </label>
    );
    const pd = profileDraft;
    const setPd = k => e => { setProfileDraft(d => ({ ...d, [k]: e.target.value })); if (fieldErrors[k]) setFieldErrors(f => ({ ...f, [k]: undefined })); };
    // Fields locked from registration (non-editable)
    const REG_LOCKED = new Set(['first_name','last_name','dob','gender','phone']);
    const getRegVal = key => {
      if (key === 'first_name') return user?.first_name || user?.name?.split(' ')[0];
      if (key === 'last_name')  return user?.last_name  || (user?.name?.includes(' ') ? user.name.split(' ').slice(1).join(' ') : null);
      return user?.[key];
    };
    const isLocked = key => key && REG_LOCKED.has(key) && !!getRegVal(key);

    const lockedStyle = { width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
      border:`1px solid ${C.border}`, background:C.surface, color:C.ink2,
      outline:'none', boxSizing:'border-box', cursor:'not-allowed' };

    const Inp = ({ placeholder, type='text', value, draftKey, wide, max, min }) => {
      const locked = isLocked(draftKey);
      const hasErr = draftKey && fieldErrors[draftKey];
      function handleBlurField() {
        if (!draftKey || locked) return;
        const val = profileDraft[draftKey];
        const errs = { ...fieldErrors };
        // Per-field inline validation on blur
        if (draftKey === 'first_name') {
          if (!val?.trim()) errs.first_name = 'First Name is required';
          else if (val.trim().length < 2) errs.first_name = 'At least 2 characters';
          else if (!/^[A-Za-z\s'.'-]{1,50}$/.test(val.trim())) errs.first_name = 'Letters only';
          else delete errs.first_name;
        } else if (draftKey === 'last_name') {
          if (!val?.trim()) errs.last_name = 'Last Name is required';
          else if (!/^[A-Za-z\s'.'-]{1,50}$/.test(val.trim())) errs.last_name = 'Letters only';
          else delete errs.last_name;
        } else if (draftKey === 'phone') {
          if (!val?.trim()) errs.phone = 'Mobile Number is required';
          else if (!/^[6-9]\d{9}$/.test(val.trim())) errs.phone = 'Valid 10-digit number starting with 6–9';
          else delete errs.phone;
        } else if (draftKey === 'bio') {
          if (val && val.length > 500) errs.bio = `Max 500 characters (${val.length}/500)`;
          else delete errs.bio;
        } else if (draftKey === 'pincode') {
          if (!val?.trim()) errs.pincode = 'PIN Code is required';
          else if (!/^\d{6}$/.test(val.trim())) errs.pincode = 'Must be exactly 6 digits';
          else delete errs.pincode;
        } else if (draftKey === 'address_line1') {
          if (!val?.trim()) errs.address_line1 = 'Address Line 1 is required';
          else if (val.trim().length < 5) errs.address_line1 = 'Please enter a more complete address';
          else delete errs.address_line1;
        } else if (draftKey === 'city') {
          if (!val?.trim()) errs.city = 'City / Town is required';
          else delete errs.city;
        } else if (draftKey === 'pref_salary') {
          if (!val?.trim()) errs.pref_salary = 'Expected Salary is required';
          else {
            const sal = Number(val.replace(/,/g,'').trim());
            if (isNaN(sal)) errs.pref_salary = 'Must be a number (e.g. 15000)';
            else if (sal < 1000) errs.pref_salary = 'Minimum ₹1,000/month';
            else delete errs.pref_salary;
          }
        } else if (draftKey === 'pref_role') {
          if (!val?.trim()) errs.pref_role = 'Preferred Job Role is required';
          else delete errs.pref_role;
        } else if (fieldErrors[draftKey] && val?.trim()) {
          delete errs[draftKey];
        }
        setFieldErrors(errs);
      }
      return (
        <div style={{ position:'relative' }}>
          <input type={type}
            {...(draftKey ? { value: pd[draftKey] ?? '', onChange: locked ? undefined : setPd(draftKey) } : { defaultValue: value||'' })}
            placeholder={placeholder}
            readOnly={locked}
            onBlur={handleBlurField}
            {...(max ? { max } : {})}
            {...(min ? { min } : {})}
            style={locked ? lockedStyle : { width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
              border:`1px solid ${hasErr ? '#DC2626' : C.border}`,
              background:'#fff', color:C.ink, outline:'none', boxSizing:'border-box' }} />
          {locked && <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:C.ink3 }}>🔒</span>}
        </div>
      );
    };
    const Sel = ({ opts, placeholder, draftKey }) => {
      const locked = isLocked(draftKey);
      if (locked) return (
        <div style={{ position:'relative' }}>
          <input readOnly value={pd[draftKey] ?? ''} style={lockedStyle} />
          <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:C.ink3 }}>🔒</span>
        </div>
      );
      return (
      <select
        {...(draftKey ? { value: pd[draftKey] || '', onChange: setPd(draftKey) } : { defaultValue: '' })}
        style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
          border:`1px solid ${draftKey && fieldErrors[draftKey] ? '#DC2626' : C.border}`,
          background:'#fff', color:C.ink, outline:'none', appearance:'none', boxSizing:'border-box' }}>
        <option value="" disabled>{placeholder || 'Select'}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      );
    };
    const Row = ({ children, cols='1fr 1fr' }) => (
      <div style={{ display:'grid', gridTemplateColumns:cols, gap:16, marginBottom:16 }}>{children}</div>
    );
    const Field = ({ label, req, errKey, children }) => (
      <div>
        <Lbl req={req}>{label}</Lbl>
        {children}
        {errKey && fieldErrors[errKey] && (
          <div style={{ fontSize:11.5, color:'#DC2626', marginTop:4 }}>⚠ {fieldErrors[errKey]}</div>
        )}
      </div>
    );
    const Divider = ({ title }) => (
      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0 16px' }}>
        <div style={{ height:1, background:C.border, flex:1 }} />
        <span style={{ fontSize:11, fontWeight:700, color:C.ink3, textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>{title}</span>
        <div style={{ height:1, background:C.border, flex:1 }} />
      </div>
    );

    function stepContent() {
      /* ── Personal Details ── */
      if (active === 'profile-basic') return (
        <div>
          <Divider title="Personal Information" />
          <Row><Field label="First Name" req errKey="first_name"><Inp placeholder="Enter first name" draftKey="first_name" /></Field><Field label="Last Name" req errKey="last_name"><Inp placeholder="Enter last name" draftKey="last_name" /></Field></Row>
          <Row><Field label="Date of Birth" req errKey="dob"><Inp type="date" draftKey="dob" max={new Date().toISOString().split('T')[0]} min="1900-01-01" /></Field><Field label="Gender" req errKey="gender"><Sel opts={['Male','Female','Transgender','Prefer not to say']} placeholder="Select gender" draftKey="gender" /></Field></Row>
          <Row>
            <Field label="Mobile Number" req errKey="phone">
              {user?.phone ? (
                <div style={{ position:'relative' }}>
                  <input readOnly value={profileDraft.phone ?? ''} style={lockedStyle} />
                  <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:C.ink3 }}>🔒</span>
                </div>
              ) : (
                <ValidInp placeholder="10-digit mobile number" value={profileDraft.phone} onChange={e => { setProfileDraft(d => ({ ...d, phone: e.target.value.replace(/\D/g,'').slice(0,10) })); if (fieldErrors.phone) setFieldErrors(f => ({ ...f, phone: undefined })); }} validate="mobile" />
              )}
            </Field>
            <Field label="Email Address" req>
              <div style={{ position:'relative' }}>
                <input readOnly value={u.email ?? ''} style={lockedStyle} />
                <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:C.ink3 }}>🔒</span>
              </div>
            </Field>
          </Row>
          <Row><Field label="Aadhaar Number"><ValidInp placeholder="12-digit Aadhaar number" validate="aadhaar" /></Field><Field label="Category" req errKey="category"><Sel opts={['General','SC','ST','OBC','EWS']} placeholder="Select category" draftKey="category" /></Field></Row>
          <Row><Field label="Religion"><Sel opts={['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Others','Prefer not to say']} placeholder="Select religion" /></Field><Field label="Differently Abled"><Sel opts={['No','Yes — Locomotor','Yes — Visual','Yes — Hearing','Yes — Others']} placeholder="Select" /></Field></Row>
          <Row cols="1fr"><Field label="About / Bio"><textarea value={pd.bio} onChange={e => setProfileDraft(d => ({ ...d, bio: e.target.value }))} placeholder="Write a short bio about yourself, your goals and interests…" rows={3} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} /></Field></Row>

          <Divider title="Current Address" />
          <Row cols="1fr"><Field label="Address Line 1" req errKey="address_line1"><Inp placeholder="House/Flat No., Street, Area" draftKey="address_line1" /></Field></Row>
          <Row cols="1fr"><Field label="Address Line 2"><Inp placeholder="Landmark, Colony (optional)" draftKey="address_line2" /></Field></Row>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>State<span style={{ color:'#DC2626', marginLeft:2 }}>*</span></label>
              <select value={pd.state_name ?? ''} onChange={e => { setProfileDraft(d => ({ ...d, state_name: e.target.value })); if (fieldErrors.state_name) setFieldErrors(f => ({ ...f, state_name: undefined })); }}
                style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${fieldErrors.state_name ? '#DC2626' : C.border}`, background:'#fff', color:pd.state_name ? C.ink : C.ink3, outline:'none', boxSizing:'border-box' }}>
                <option value="">Select state</option>
                {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {fieldErrors.state_name && <div style={{ fontSize:11.5, color:'#DC2626', marginTop:4 }}>⚠ {fieldErrors.state_name}</div>}
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>District<span style={{ color:'#DC2626', marginLeft:2 }}>*</span></label>
              <input value={pd.district ?? ''} placeholder="Auto-filled from PIN"
                onChange={e => { setProfileDraft(d => ({ ...d, district: e.target.value })); }}
                style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, background:'#fff', color:C.ink, outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>City / Town<span style={{ color:'#DC2626', marginLeft:2 }}>*</span></label>
              <input value={pd.city ?? ''} placeholder="Auto-filled from PIN"
                onChange={e => { setProfileDraft(d => ({ ...d, city: e.target.value })); if (fieldErrors.city) setFieldErrors(f => ({ ...f, city: undefined })); }}
                style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${fieldErrors.city ? '#DC2626' : C.border}`, background:'#fff', color:C.ink, outline:'none', boxSizing:'border-box' }} />
              {fieldErrors.city && <div style={{ fontSize:11.5, color:'#DC2626', marginTop:4 }}>⚠ {fieldErrors.city}</div>}
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>PIN Code<span style={{ color:'#DC2626', marginLeft:2 }}>*</span></label>
              <div style={{ position:'relative' }}>
                <input
                  value={pd.pincode ?? ''}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  inputMode="numeric"
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g,'').slice(0,6);
                    setProfileDraft(d => ({ ...d, pincode: val }));
                    if (fieldErrors.pincode) setFieldErrors(f => ({ ...f, pincode: undefined }));
                  }}
                  style={{ width:'100%', padding:'9px 12px', paddingRight: pinLoading ? 36 : 12,
                    borderRadius:7, fontSize:13,
                    border:`1px solid ${fieldErrors.pincode ? '#DC2626' : C.border}`,
                    background:'#fff', color:C.ink, outline:'none', boxSizing:'border-box' }}
                />
                {pinLoading && <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:C.ink3 }}>⏳</span>}
              </div>
              {fieldErrors.pincode && <div style={{ fontSize:11.5, color:'#DC2626', marginTop:4 }}>⚠ {fieldErrors.pincode}</div>}
            </div>
          </div>
          <Row>
            <Field label="Same as Permanent Address">
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:4 }}>
                <input type="checkbox" style={{ width:16, height:16, accentColor:C.saffron }} />
                <span style={{ fontSize:13, color:C.ink2 }}>My current and permanent address are the same</span>
              </label>
            </Field>
          </Row>
        </div>
      );

      /* ── Education ── */
      if (active === 'profile-edu') return (
        <div>
          <Divider title="Highest Qualification" />
          <Row><Field label="Highest Education Level" req errKey="edu_level"><Sel opts={['8th Pass','10th Pass (Matriculation)','12th Pass (Intermediate)','ITI / Diploma','Graduation (B.A./B.Sc./B.Com)','Graduation (B.Tech/B.E.)','Post Graduation (M.A./M.Sc./M.Com)','Post Graduation (M.Tech/M.E.)','Ph.D / Doctorate','Others']} placeholder="Select highest qualification" draftKey="edu_level" /></Field><Field label="Specialisation / Stream"><Inp placeholder="e.g. Science, Commerce, Computer Science" /></Field></Row>
          <Row><Field label="Board / University / Institute" req errKey="edu_board"><Inp placeholder="Name of board or university" draftKey="edu_board" /></Field><Field label="Year of Passing" req errKey="edu_year"><Sel opts={Array.from({length:40},(_,i)=>String(2024-i))} placeholder="Select year" draftKey="edu_year" /></Field></Row>
          <Row><Field label="Marks / Percentage / CGPA"><Inp placeholder="e.g. 75% or 8.2 CGPA" /></Field><Field label="Grade / Division"><Sel opts={['First Class / Distinction (≥60%)','Second Class (50-59%)','Pass Class (35-49%)','CGPA / Grade System']} placeholder="Select grade" /></Field></Row>
          <Row cols="1fr"><Field label="Institute Name" req errKey="edu_institute"><Inp placeholder="Name of school, college or institute" draftKey="edu_institute" /></Field></Row>
          <Row><Field label="State of Institute"><Sel opts={['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Other']} placeholder="Select state" /></Field><Field label="District of Institute"><Inp placeholder="Enter district" /></Field></Row>

          <Divider title="Additional Qualifications" />
          <Row><Field label="Other Certifications / Diplomas"><Inp placeholder="e.g. Tally, AutoCAD, Spoken English (comma separated)" /></Field><Field label="Year Obtained"><Inp placeholder="Year" /></Field></Row>
          <div style={{ padding:'12px 16px', background:C.bluePale, border:`1px solid #C5D9F5`, borderRadius:8, fontSize:12.5, color:C.blue, marginBottom:16 }}>
            ℹ️ Upload supporting education documents in the <strong>Documents</strong> section.
          </div>
        </div>
      );

      /* ── Work Experience ── */
      if (active === 'profile-exp') {
        const today = new Date().toISOString().split('T')[0];
        const setExp = (idx, field, val) =>
          setExperiences(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
        const addExp = () => setExperiences(prev => [...prev, {
          org:'', designation:'', sector:'', nature:'', joining_date:'', leaving_date:'', responsibilities:'', salary:'', reason:''
        }]);
        const removeExp = idx => setExperiences(prev => prev.filter((_, i) => i !== idx));

        const inputSx = (hasErr) => ({
          width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
          border:`1px solid ${hasErr ? '#DC2626' : C.border}`,
          background:'#fff', color:C.ink, outline:'none', boxSizing:'border-box'
        });
        const selSx = inputSx;

        return (
          <div>
            <Divider title="Employment Status" />
            <Row>
              <Field label="Current Employment Status" req errKey="emp_status">
                <Sel opts={['Fresher / Never Employed','Currently Employed','Self Employed / Freelance','Unemployed (Previously Employed)','Apprentice / Trainee']} placeholder="Select status" draftKey="emp_status" />
              </Field>
              <Field label="Total Work Experience">
                <Sel opts={['No Experience','Less than 6 months','6 months – 1 year','1 – 2 years','2 – 5 years','5 – 10 years','More than 10 years']} placeholder="Select experience" />
              </Field>
            </Row>

            {experiences.map((exp, idx) => {
              const minLeaving = exp.joining_date
                ? (() => { const d = new Date(exp.joining_date); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })()
                : undefined;
              const isFirst = idx === 0;
              const title = isFirst ? 'Current / Last Employer' : `Previous Employer ${idx + 1}`;
              return (
                <div key={idx} style={{ border:`1px solid ${C.border}`, borderRadius:10, marginBottom:18,
                  background: idx === 0 ? '#FAFAFA' : '#F8F9FB', overflow:'hidden' }}>
                  {/* Card header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 16px', borderBottom:`1px solid ${C.border}`,
                    background: idx === 0 ? C.saffronPale : '#EEF0F5' }}>
                    <span style={{ fontWeight:700, fontSize:13, color:C.navy }}>
                      💼 {exp.org || title}
                    </span>
                    {experiences.length > 1 && (
                      <button onClick={() => removeExp(idx)}
                        style={{ background:'none', border:'none', cursor:'pointer',
                          fontSize:12, color:'#DC2626', fontWeight:600, padding:'2px 8px' }}>
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding:'16px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                      <div>
                        <Lbl>Organisation Name</Lbl>
                        <input value={exp.org} onChange={e => setExp(idx,'org',e.target.value)}
                          placeholder="Company / employer name" style={inputSx(false)} />
                      </div>
                      <div>
                        <Lbl>Designation / Job Title</Lbl>
                        <input value={exp.designation} onChange={e => setExp(idx,'designation',e.target.value)}
                          placeholder="e.g. Sales Executive, Lab Technician" style={inputSx(false)} />
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                      <div>
                        <Lbl req={isFirst}>Sector / Industry</Lbl>
                        {isFirst
                          ? <>
                              <Sel opts={['Agriculture','Automotive','BFSI (Banking/Finance/Insurance)','Construction','Domestic Worker','Electronics','Food Processing','Gems & Jewellery','Green Jobs','Healthcare','Hospitality','IT / ITeS','Leather','Logistics','Manufacturing','Media & Entertainment','Mining','Plumbing','Retail','Security','Telecom','Textile','Tourism','Others']} placeholder="Select sector" draftKey="exp_sector" />
                              {fieldErrors.exp_sector && <div style={{fontSize:11.5,color:'#DC2626',marginTop:4}}>⚠ {fieldErrors.exp_sector}</div>}
                            </>
                          : <select value={exp.sector} onChange={e => setExp(idx,'sector',e.target.value)} style={selSx(false)}>
                              <option value="">Select sector</option>
                              {['Agriculture','Automotive','BFSI (Banking/Finance/Insurance)','Construction','Domestic Worker','Electronics','Food Processing','Gems & Jewellery','Green Jobs','Healthcare','Hospitality','IT / ITeS','Leather','Logistics','Manufacturing','Media & Entertainment','Mining','Plumbing','Retail','Security','Telecom','Textile','Tourism','Others'].map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                        }
                      </div>
                      <div>
                        <Lbl>Nature of Employment</Lbl>
                        <select value={exp.nature} onChange={e => setExp(idx,'nature',e.target.value)} style={selSx(false)}>
                          <option value="">Select type</option>
                          {['Permanent / Regular','Contract / Temporary','Part-time','Apprenticeship','Self-employed','Daily Wage'].map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                      <div>
                        <Lbl>Date of Joining</Lbl>
                        <input type="date" value={exp.joining_date} max={today}
                          onChange={e => { setExp(idx,'joining_date',e.target.value); if (exp.leaving_date && exp.leaving_date <= e.target.value) setExp(idx,'leaving_date',''); }}
                          style={inputSx(false)} />
                      </div>
                      <div>
                        <Lbl>Date of Leaving (if applicable)</Lbl>
                        <input type="date" value={exp.leaving_date} max={today}
                          {...(minLeaving ? { min: minLeaving } : {})}
                          onChange={e => setExp(idx,'leaving_date',e.target.value)}
                          style={inputSx(false)} />
                      </div>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <Lbl>Key Responsibilities / Role Description</Lbl>
                      <textarea value={exp.responsibilities} onChange={e => setExp(idx,'responsibilities',e.target.value)}
                        placeholder="Briefly describe your key responsibilities and achievements…" rows={3}
                        style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
                          border:`1px solid ${C.border}`, resize:'vertical', fontFamily:'inherit',
                          outline:'none', boxSizing:'border-box', background:'#fff' }} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      <div>
                        <Lbl>Last Monthly Salary (₹)</Lbl>
                        <input value={exp.salary} onChange={e => setExp(idx,'salary',e.target.value)}
                          placeholder="e.g. 15000" style={inputSx(false)} />
                      </div>
                      <div>
                        <Lbl>Reason for Leaving</Lbl>
                        <select value={exp.reason} onChange={e => setExp(idx,'reason',e.target.value)} style={selSx(false)}>
                          <option value="">Select reason</option>
                          {['Better Opportunity','Career Growth','Relocation','Health Reasons','Company Closure','Contract End','Others'].map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ textAlign:'center', marginBottom:8 }}>
              <Btn sm onClick={addExp} style={{ borderColor:C.saffron, color:C.saffron, padding:'8px 20px' }}>
                + Add Another Experience
              </Btn>
            </div>
          </div>
        );
      }

      /* ── Skills ── */
      if (active === 'profile-skills') return (
        <div>
          <Divider title="Technical Skills" />
          <Row><Field label="Skill Category" req errKey="skill_category"><Sel opts={['Agriculture & Allied','Apparel, Madeups & Home Furnishing','Automotive','Beauty & Wellness','BFSI','Capital Goods','Construction','Domestic Worker','Electronics & Hardware','Food Processing','Furniture & Fittings','Green Jobs & Sustainability','Gems & Jewellery','Healthcare','Hospitality & Tourism','IT & ITeS','Leather','Logistics','Media & Entertainment','Mining','Plumbing','Retail','Rubber','Security','Sporticulture','Telecom','Textile','Others']} placeholder="Select skill sector" draftKey="skill_category" /></Field><Field label="Specific Skill / Trade" req errKey="skill_name"><Inp placeholder="e.g. Python Programming, Electrician, Beautician" draftKey="skill_name" /></Field></Row>
          <Row><Field label="Proficiency Level" req errKey="skill_proficiency"><Sel opts={['Beginner (Basic awareness)','Elementary (Can do with guidance)','Intermediate (Can work independently)','Advanced (Can train others)','Expert (Specialised knowledge)']} placeholder="Select proficiency" draftKey="skill_proficiency" /></Field><Field label="Years of Experience with Skill"><Sel opts={['Less than 1 year','1 – 2 years','2 – 5 years','More than 5 years']} placeholder="Select" /></Field></Row>
          <Row><Field label="NSQF Level (if certified)"><Sel opts={['Not Certified','Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7','Level 8','Level 9','Level 10']} placeholder="Select NSQF level" /></Field><Field label="Certifying Body"><Inp placeholder="e.g. NSDC, MSME, SSC, NIELIT" /></Field></Row>
          <div style={{ textAlign:'right', marginBottom:4 }}>
            <Btn sm style={{ borderColor:C.saffron, color:C.saffron }}>+ Add Another Skill</Btn>
          </div>

          <Divider title="Language Skills" />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Language','Read','Write','Speak'].map(h => (
                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontWeight:700, fontSize:11, color:C.ink3, borderBottom:`1.5px solid ${C.border}`, textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Hindi','English','Regional Language'].map(lang => (
                  <tr key={lang}>
                    <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, fontWeight:600, color:C.ink }}>{lang}</td>
                    {['Read','Write','Speak'].map(s => (
                      <td key={s} style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
                        <input type="checkbox" style={{ width:15, height:15, accentColor:C.saffron }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Divider title="Computer / Digital Skills" />
          <Row cols="1fr 1fr 1fr">
            {['MS Word','MS Excel','MS PowerPoint','Internet Browsing','Email','Tally','AutoCAD','Programming','Graphic Design'].map(skill => (
              <label key={skill} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'6px 0' }}>
                <input type="checkbox" style={{ width:15, height:15, accentColor:C.saffron }} />
                <span style={{ fontSize:13, color:C.ink2 }}>{skill}</span>
              </label>
            ))}
          </Row>
        </div>
      );

      /* ── Documents ── */
      if (active === 'profile-docs') {
        const ALLOWED_TYPES = ['application/pdf','image/jpeg','image/jpg','image/png'];
        const ALLOWED_EXT   = ['.pdf','.jpg','.jpeg','.png'];
        const MAX_SIZE_MB   = 2;
        const MAX_BYTES     = MAX_SIZE_MB * 1024 * 1024;

        function handleFileChange(docKey, e) {
          const file = e.target.files[0];
          e.target.value = '';
          if (!file) return;
          const ext = '.' + file.name.split('.').pop().toLowerCase();
          if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
            setDocErrors(de => ({ ...de, [docKey]: `Invalid file type. Allowed: PDF, JPG, PNG.` }));
            return;
          }
          if (file.size > MAX_BYTES) {
            setDocErrors(de => ({ ...de, [docKey]: `File too large. Maximum size is ${MAX_SIZE_MB} MB (your file: ${(file.size/1024/1024).toFixed(1)} MB).` }));
            return;
          }
          setDocFiles(df => ({ ...df, [docKey]: file }));
          setDocErrors(de => ({ ...de, [docKey]: undefined }));
          if (fieldErrors[docKey]) setFieldErrors(f => ({ ...f, [docKey]: undefined }));
        }

        function DocRow({ docKey, label, req, hint }) {
          const file = docFiles[docKey];
          const err  = docErrors[docKey] || fieldErrors[docKey];
          const borderColor = err ? '#DC2626' : file ? '#16A34A' : C.border;
          return (
            <div style={{ border:`1px solid ${borderColor}`, borderRadius:9, marginBottom:10, background:'#fff', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:C.ink }}>
                    {label}{req && <span style={{ color:'#DC2626', marginLeft:3 }}>*</span>}
                  </div>
                  {hint && <div style={{ fontSize:11.5, color:C.ink3, marginTop:2 }}>{hint}</div>}
                  {file && (
                    <div style={{ fontSize:11.5, color:'#16A34A', marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
                      ✅ {file.name} <span style={{ color:C.ink3 }}>({(file.size/1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  {file && (
                    <button onClick={() => setDocFiles(df => ({ ...df, [docKey]: undefined }))}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#DC2626', padding:'4px 6px' }}
                      title="Remove file">✕ Remove</button>
                  )}
                  <label style={{ padding:'6px 14px', borderRadius:7,
                    background: file ? C.teal : C.blue,
                    color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                    {file ? '🔄 Replace' : '📎 Upload'}
                    <input type="file" accept={ALLOWED_EXT.join(',')} style={{ display:'none' }}
                      onChange={e => handleFileChange(docKey, e)} />
                  </label>
                </div>
              </div>
              {err && (
                <div style={{ padding:'8px 16px', background:'#FEF2F2', borderTop:'1px solid #FCA5A5',
                  fontSize:12, color:'#DC2626' }}>⚠ {err}</div>
              )}
            </div>
          );
        }

        return (
          <div>
            {/* AI Resume Parser */}
            <div style={{ padding:'14px 16px', background:'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border:'1.5px solid #DDD6FE',
              borderRadius:10, marginBottom:18, display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ fontSize:28, flexShrink:0 }}>🤖</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#5B21B6', marginBottom:3 }}>AI Resume Parser — Auto-fill Profile</div>
                <div style={{ fontSize:12, color:'#6D28D9', marginBottom:10, lineHeight:1.5 }}>
                  Upload your resume (PDF or Word) and AI will automatically fill your profile details.
                </div>
                {resumeParseMsg && (
                  <div style={{ padding:'7px 10px', background: resumeParseMsg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2',
                    border:`1px solid ${resumeParseMsg.startsWith('✅') ? '#BBF7D0' : '#FECACA'}`,
                    borderRadius:7, fontSize:12, color: resumeParseMsg.startsWith('✅') ? '#166534' : '#DC2626', marginBottom:8 }}>
                    {resumeParseMsg}
                  </div>
                )}
                <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px',
                  background: resumeParseLoading ? '#C4B5FD' : '#7C3AED', color:'#fff',
                  borderRadius:8, fontSize:12.5, fontWeight:600, cursor: resumeParseLoading ? 'wait' : 'pointer' }}>
                  <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }}
                    onChange={e => e.target.files?.[0] && parseResumeAndFill(e.target.files[0])}
                    disabled={resumeParseLoading} />
                  {resumeParseLoading ? '⏳ Parsing…' : '📄 Upload Resume & Auto-fill'}
                </label>
              </div>
            </div>

            <div style={{ padding:'12px 16px', background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:8, fontSize:12.5, color:'#9A6A00', marginBottom:18 }}>
              ⚠️ Upload clear scanned copies or photos. Accepted: <strong>PDF, JPG, PNG</strong> only. Max size: <strong>{MAX_SIZE_MB} MB</strong> per document.
            </div>

            <Divider title="Identity Documents" />
            <DocRow docKey="aadhaar"    label="Aadhaar Card"  req hint="Front & Back pages" />
            <DocRow docKey="pan"        label="PAN Card"           hint="Optional — required for certain schemes" />
            <DocRow docKey="voter_id"   label="Voter ID"           hint="Optional" />
            <DocRow docKey="passport"   label="Passport"           hint="Optional" />

            <Divider title="Education Documents" />
            <DocRow docKey="marksheet_10" label="10th Marksheet / Certificate"      req />
            <DocRow docKey="marksheet_12" label="12th Marksheet / Certificate"          />
            <DocRow docKey="degree"        label="Graduation / Degree Certificate"      />
            <DocRow docKey="other_qual"    label="Other Qualification Certificate"      />

            <Divider title="Skill / Training Certificates" />
            <DocRow docKey="skill_cert"          label="Skill Training Certificate (NSQF)"       />
            <DocRow docKey="apprenticeship_cert"  label="Apprenticeship Completion Certificate"   />
            <DocRow docKey="other_cert"           label="Other Skill / IT Certificates"           />

            <Divider title="Bank / Financial Details (for scheme benefits)" />
            <Row><Field label="Bank Account Number"><Inp placeholder="Enter account number" draftKey="bank_account_number" /></Field><Field label="Confirm Account Number"><Inp placeholder="Re-enter account number" /></Field></Row>
            <Row><Field label="IFSC Code"><Inp placeholder="e.g. SBIN0001234" draftKey="bank_ifsc" /></Field><Field label="Bank Name"><Inp placeholder="Name of bank" /></Field></Row>
            <Row cols="1fr"><Field label="Branch Name & Address"><Inp placeholder="Branch name and city" /></Field></Row>
            <Row><Field label="Passbook / Cancelled Cheque">
              <DocRow docKey="passbook" label="" />
            </Field></Row>
          </div>
        );
      }

      /* ── Job Preferences ── */
      if (active === 'profile-pref') return (
        <div>
          <Divider title="Job / Work Preferences" />
          <Row><Field label="Preferred Job Role / Designation" req errKey="pref_role"><Inp placeholder="e.g. Data Analyst, Electrician, Sales Executive" draftKey="pref_role" /></Field><Field label="Preferred Employment Type" req errKey="pref_emp_type"><Sel opts={['Full-time','Part-time','Contract / Project','Freelance / Consultancy','Apprenticeship','Internship','Any']} placeholder="Select type" draftKey="pref_emp_type" /></Field></Row>
          <Row><Field label="Expected Monthly Salary (₹)" req errKey="pref_salary"><Inp placeholder="e.g. 20000" draftKey="pref_salary" /></Field><Field label="Notice Period"><Sel opts={['Immediately Available','15 Days','1 Month','2 Months','3 Months','More than 3 Months']} placeholder="Select notice period" /></Field></Row>
          <Row><Field label="Preferred Sector" req errKey="pref_sector"><Sel opts={['Agriculture','Automotive','BFSI','Construction','Electronics','Food Processing','Healthcare','Hospitality','IT / ITeS','Logistics','Manufacturing','Media','Retail','Security','Telecom','Textile','Others']} placeholder="Select sector" draftKey="pref_sector" /></Field><Field label="Preferred Work Mode"><Sel opts={['On-site / Office','Work from Home','Hybrid','Open to Any']} placeholder="Select work mode" /></Field></Row>

          <Divider title="Preferred Location" />
          <Row><Field label="Preferred State" req errKey="pref_state"><Sel opts={['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Open to Relocation']} placeholder="Select preferred state" draftKey="pref_state" /></Field><Field label="Preferred City / District"><Inp placeholder="Enter preferred city or district" /></Field></Row>
          <Row>
            <Field label="Open to Relocation">
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:4 }}>
                <input type="checkbox" style={{ width:16, height:16, accentColor:C.saffron }} />
                <span style={{ fontSize:13, color:C.ink2 }}>Yes, I am willing to relocate anywhere in India</span>
              </label>
            </Field>
          </Row>

          <Divider title="Training & Upskilling Interest" />
          <Row cols="1fr 1fr 1fr">
            {['Short-term Skill Training (PMKVY)','Apprenticeship Programme (NAPS)','Recognition of Prior Learning (RPL)',
              'Online Courses / e-Learning','Long-term Diploma / Degree','Entrepreneurship / Self-employment'].map(opt => (
              <label key={opt} style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', padding:'6px 0' }}>
                <input type="checkbox" style={{ width:15, height:15, accentColor:C.saffron, marginTop:2, flexShrink:0 }} />
                <span style={{ fontSize:12.5, color:C.ink2, lineHeight:1.5 }}>{opt}</span>
              </label>
            ))}
          </Row>

          <Divider title="Social / Government Scheme Benefits" />
          <Row>
            <Field label="Are you a BPL (Below Poverty Line) card holder?">
              <Sel opts={['No','Yes']} placeholder="Select" />
            </Field>
            <Field label="Do you have a Skill India / PMKVY registration?">
              <Sel opts={['No','Yes — please provide ID']} placeholder="Select" />
            </Field>
          </Row>
          <Row cols="1fr"><Field label="PMKVY / Scheme Registration ID (if any)"><Inp placeholder="Enter registration number if enrolled in any scheme" /></Field></Row>

          <Divider title="Declaration" />
          <div style={{ padding:'14px 16px', background:'#F8FAFC', border:`1px solid ${C.border}`, borderRadius:9, marginBottom:16 }}>
            <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
              <input type="checkbox" style={{ width:15, height:15, accentColor:C.saffron, marginTop:2, flexShrink:0 }} />
              <span style={{ fontSize:12.5, color:C.ink2, lineHeight:1.7 }}>
                I hereby declare that all the information provided by me in this profile is true, correct and complete to the best of my knowledge. I understand that any false information may lead to disqualification from schemes and employment opportunities.
              </span>
            </label>
          </div>
        </div>
      );

      return null;
    }

    return (
      <div>
        {/* Page header */}
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>👤 My Profile › <span style={{ color:C.saffron }}>{STEPS[cur].label}</span></div>
        <div style={{ marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>My Profile</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, color:C.ink3 }}>Step {cur+1} of {STEPS.length}</span>
            <div style={{ padding:'4px 12px', borderRadius:20, background:C.saffronPale,
              border:`1px solid #FFD4A8`, fontSize:12, fontWeight:700, color:C.saffron }}>
              Profile {pct}% complete
            </div>
          </div>
        </div>

        {/* Step tabs */}
        <div style={{ display:'flex', gap:0, marginBottom:20, background:C.card,
          border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          {STEPS.map((s, i) => {
            const isActive = i === cur;
            const isDone   = i < cur;
            return (
              <div key={s.id} onClick={() => go(s.id)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  padding:'10px 8px', cursor:'pointer', position:'relative',
                  background: isActive ? C.saffron : isDone ? '#E8F5E9' : '#fff',
                  borderRight: i < STEPS.length-1 ? `1px solid ${C.border}` : 'none',
                  transition:'background .15s' }}>
                <span style={{ fontSize:16 }}>{isDone ? '✅' : s.icon}</span>
                <span style={{ fontSize:10.5, fontWeight: isActive ? 700 : 600,
                  color: isActive ? '#fff' : isDone ? C.green : C.ink3,
                  textAlign:'center', lineHeight:1.3 }}>{s.label}</span>
                {isActive && (
                  <div style={{ position:'absolute', bottom:-1, left:'50%', transform:'translateX(-50%)',
                    width:0, height:0, borderLeft:'8px solid transparent',
                    borderRight:'8px solid transparent', borderTop:`8px solid ${C.saffron}` }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <Card>
          {/* Section title */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20,
            paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:38, height:38, borderRadius:9, background:C.saffronPale,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
              {STEPS[cur].icon}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:C.navy }}>{STEPS[cur].label}</div>
              <div style={{ fontSize:12, color:C.ink3, marginTop:1 }}>
                {{
                  'profile-basic':'Fill in your personal information and contact details.',
                  'profile-edu':'Add your educational qualifications and academic achievements.',
                  'profile-exp':'Provide your work history and employment details.',
                  'profile-skills':'List your technical skills, languages and digital competencies.',
                  'profile-docs':'Upload identity, education and bank documents.',
                  'profile-pref':'Tell us your preferred job type, sector and location.',
                }[active]}
              </div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:11, color:C.ink3 }}>
              <span style={{ color:'#DC2626' }}>*</span> Required fields
            </div>
          </div>

          {stepContent()}

          {/* Validation error summary */}
          {Object.keys(fieldErrors).filter(k => fieldErrors[k]).length > 0 && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:8,
              padding:'12px 16px', marginTop:16 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#DC2626', marginBottom:6 }}>
                ⚠ Please fix the following before saving:
              </div>
              <ul style={{ margin:0, paddingLeft:18 }}>
                {Object.values(fieldErrors).filter(Boolean).map((msg, i) => (
                  <li key={i} style={{ fontSize:12.5, color:'#B91C1C', marginBottom:2 }}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            marginTop:24, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
            <Btn onClick={() => { setFieldErrors({}); cur > 0 && go(STEPS[cur-1].id); }}
              style={{ opacity: cur===0 ? .4 : 1, pointerEvents: cur===0 ? 'none':'auto' }}>
              ← Previous
            </Btn>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {profileMsg && <span style={{ fontSize:12, color: profileMsg.includes('failed') ? '#DC2626' : C.teal }}>{profileMsg}</span>}
              <Btn onClick={() => { const errs = validateStep(active); if (Object.keys(errs).length === 0) saveProfileDraft(); }}
                style={{ borderColor:C.teal, color:C.teal, opacity: profileSaving ? .7 : 1 }}>
                {profileSaving ? 'Saving…' : '💾 Save Draft'}
              </Btn>
              {cur < STEPS.length-1
                ? <Btn primary onClick={() => { const errs = validateStep(active); if (Object.keys(errs).length === 0) { saveProfileDraft(); setFieldErrors({}); go(STEPS[cur+1].id); } }}>Save & Continue →</Btn>
                : <Btn primary onClick={() => { const errs = validateStep(active); if (Object.keys(errs).length === 0) { saveProfileDraft(); setProfileMsg('Profile submitted successfully!'); } }} style={{ background:C.blue }}>✅ Submit Profile</Btn>
              }
            </div>
          </div>
        </Card>
      </div>
    );
  }

  function PanelHelpdesk() {
    return (
      <div>
        <SectionHead title="Help & Support 🎧" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <Card>
            <CardTitle>📞 Contact Us</CardTitle>
            {[['Toll-Free','1800-123-9626 (24×7)'],['Email','support@sidh.gov.in'],['WhatsApp','+91-98765-43210']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:14, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.ink3, width:100, flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:600, color:C.navy }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <CardTitle>❓ FAQ</CardTitle>
            {[
              ['How do I apply for PMKVY?','Go to Govt Schemes → PMKVY 4.0 → Apply Now.'],
              ['How to download certificates?','Go to Skill Passport → Certificates → Download.'],
              ['How is job match % calculated?','Based on your skills, location, and experience.'],
            ].map(([q,a]) => (
              <div key={q} style={{ padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontWeight:600, fontSize:12.5, color:C.ink, marginBottom:3 }}>{q}</div>
                <div style={{ fontSize:12, color:C.ink3 }}>{a}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  function PrefToggle({ label, desc, defaultOn }) {
    return (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 0', borderBottom:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{label}</div>
          {desc && <div style={{ fontSize:11.5, color:C.ink3, marginTop:2 }}>{desc}</div>}
        </div>
        <label style={{ position:'relative', width:44, height:24, cursor:'pointer', flexShrink:0, display:'inline-block' }}>
          <input type="checkbox" defaultChecked={defaultOn} style={{ opacity:0, width:0, height:0, position:'absolute' }} />
          <span className="snj-track" />
        </label>
      </div>
    );
  }

  function PanelPrefAccount() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>⚙️ <span style={{ color:C.saffron }}>User Preferences</span></div>
        <SectionHead title="Account Settings 👤" />
        <Card style={{ marginBottom:18 }}>
          <CardTitle>Account Information</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div><label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Full Name</label><input defaultValue={u?.name||''} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' }} /></div>
            <div><label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Email Address</label><input type="email" defaultValue={u?.email||''} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' }} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div><label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Mobile Number</label><input defaultValue={u?.phone||''} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' }} /></div>
            <div><label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Alternate Mobile</label><input placeholder="Optional" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' }} /></div>
          </div>
          <div style={{ marginBottom:16 }}><label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>About / Bio</label><textarea defaultValue={u?.bio||''} placeholder="Short bio…" rows={3} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} /></div>
          <div style={{ textAlign:'right' }}><Btn primary>💾 Save Changes</Btn></div>
        </Card>
      </div>
    );
  }

  function PanelPrefNotifications() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>⚙️ <span style={{ color:C.saffron }}>User Preferences</span></div>
        <SectionHead title="Notification Preferences 🔔" />
        <Card>
          <CardTitle>Email & SMS Alerts</CardTitle>
          <PrefToggle label="Job Alerts via SMS"          desc="Get SMS when new jobs match your profile"            defaultOn={true} />
          <PrefToggle label="Job Alerts via Email"        desc="Get email digest of matching jobs"                   defaultOn={true} />
          <PrefToggle label="Course Recommendations"      desc="Notify me about new recommended courses"             defaultOn={true} />
          <PrefToggle label="Application Status Updates"  desc="Updates when employer reviews your application"      defaultOn={true} />
          <PrefToggle label="Scheme & Benefit Alerts"     desc="Alerts about new government schemes you qualify for" defaultOn={false} />
          <PrefToggle label="Platform Announcements"      desc="News and updates from SkillsnJobs"                   defaultOn={false} />
          <PrefToggle label="Interview Reminders"         desc="Reminders 24h before scheduled interviews"           defaultOn={true} />
          <PrefToggle label="Assessment Due Alerts"       desc="Reminder when an assessment deadline is approaching" defaultOn={true} />
          <div style={{ marginTop:16, textAlign:'right' }}><Btn primary>💾 Save Preferences</Btn></div>
        </Card>
      </div>
    );
  }

  function PanelPrefPrivacy() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>⚙️ <span style={{ color:C.saffron }}>User Preferences</span></div>
        <SectionHead title="Privacy Settings 🔏" />
        <Card style={{ marginBottom:18 }}>
          <CardTitle>Profile Visibility</CardTitle>
          <PrefToggle label="Profile Visible to Employers"  desc="Allow employers to search and view your profile"    defaultOn={true} />
          <PrefToggle label="Show Contact Details"           desc="Display mobile and email to shortlisted employers"  defaultOn={false} />
          <PrefToggle label="Resume Download by Employer"    desc="Allow employers to download your resume"            defaultOn={true} />
          <PrefToggle label="Show in Talent Pool"            desc="Let training providers discover your profile"       defaultOn={true} />
        </Card>
        <Card>
          <CardTitle>Data & Activity</CardTitle>
          <PrefToggle label="Activity-based Recommendations" desc="Use my browsing history for better suggestions"    defaultOn={true} />
          <PrefToggle label="Share Anonymous Usage Data"      desc="Help improve the platform with anonymised data"    defaultOn={false} />
          <div style={{ marginTop:16, textAlign:'right' }}><Btn primary>💾 Save Settings</Btn></div>
        </Card>
      </div>
    );
  }

  function PanelPrefPassword() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>⚙️ <span style={{ color:C.saffron }}>User Preferences</span></div>
        <SectionHead title="Change Password 🔒" />
        <Card style={{ maxWidth:480 }}>
          <CardTitle>Update Your Password</CardTitle>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Current Password</label>
            <input type="password" placeholder="Enter current password" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>New Password</label>
            <input type="password" placeholder="Min 8 characters" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Confirm New Password</label>
            <input type="password" placeholder="Re-enter new password" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, outline:'none', boxSizing:'border-box' }} />
          </div>
          <Btn primary>🔐 Update Password</Btn>
        </Card>
      </div>
    );
  }

  function PanelPrefLanguage() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>⚙️ <span style={{ color:C.saffron }}>User Preferences</span></div>
        <SectionHead title="Language & Region 🌐" />
        <Card style={{ maxWidth:480 }}>
          <CardTitle>Display Language</CardTitle>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Interface Language</label>
            <select defaultValue="en" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, background:'#fff', outline:'none', boxSizing:'border-box' }}>
              {[['en','English'],['hi','हिन्दी (Hindi)'],['te','తెలుగు (Telugu)'],['ta','தமிழ் (Tamil)'],['kn','ಕನ್ನಡ (Kannada)'],['ml','മലയാളം (Malayalam)'],['mr','मराठी (Marathi)'],['bn','বাংলা (Bengali)'],['gu','ગુજરાતી (Gujarati)'],['pa','ਪੰਜਾਬੀ (Punjabi)']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Time Zone</label>
            <select defaultValue="IST" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, background:'#fff', outline:'none', boxSizing:'border-box' }}>
              <option value="IST">India Standard Time (IST, UTC+5:30)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>Date Format</label>
            <select defaultValue="dd/mm/yyyy" style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, background:'#fff', outline:'none', boxSizing:'border-box' }}>
              <option value="dd/mm/yyyy">DD/MM/YYYY</option>
              <option value="mm/dd/yyyy">MM/DD/YYYY</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD</option>
            </select>
          </div>
          <Btn primary>💾 Save Preferences</Btn>
        </Card>
      </div>
    );
  }

  function PanelPrefAppearance() {
    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>⚙️ <span style={{ color:C.saffron }}>User Preferences</span></div>
        <SectionHead title="Appearance 🎨" />
        <Card style={{ maxWidth:520 }}>
          <CardTitle>Theme</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
            {[['☀️','Light','light'],['🌙','Dark','dark'],['💻','System','system']].map(([icon,label,val]) => (
              <label key={val} style={{ border:`2px solid ${val==='light'?C.blue:C.border}`, borderRadius:10, padding:'14px 10px', textAlign:'center', cursor:'pointer', background: val==='light'?'#EFF6FF':'#fff' }}>
                <input type="radio" name="theme" value={val} defaultChecked={val==='light'} style={{ display:'none' }} />
                <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:12, fontWeight:600, color:C.ink }}>{label}</div>
              </label>
            ))}
          </div>
          <CardTitle>Font Size</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
            {[['Small','13px'],['Medium','15px'],['Large','17px']].map(([label,size]) => (
              <label key={label} style={{ border:`2px solid ${label==='Medium'?C.blue:C.border}`, borderRadius:10, padding:'12px', textAlign:'center', cursor:'pointer', background: label==='Medium'?'#EFF6FF':'#fff' }}>
                <input type="radio" name="fontsize" value={size} defaultChecked={label==='Medium'} style={{ display:'none' }} />
                <div style={{ fontSize: label==='Small'?12:label==='Medium'?14:16, fontWeight:600, color:C.ink }}>{label}</div>
              </label>
            ))}
          </div>
          <Btn primary>💾 Apply</Btn>
        </Card>
      </div>
    );
  }

  function PanelSettings() {
    return <AccountPreferences onLogout={signOut} />;
  }

  function PanelSettingsOld() {
    const Row = ({ children, cols='1fr 1fr' }) => (
      <div style={{ display:'grid', gridTemplateColumns:cols, gap:16, marginBottom:16 }}>{children}</div>
    );
    const Field = ({ label, children }) => (
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>{label}</label>
        {children}
      </div>
    );
    const Inp = ({ placeholder, type='text', value }) => (
      <input type={type} defaultValue={value||''} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13,
          border:`1px solid ${C.border}`, background:'#fff', color:C.ink,
          outline:'none', boxSizing:'border-box' }} />
    );
    const Toggle = ({ label, desc, defaultOn }) => (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'13px 0', borderBottom:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{label}</div>
          {desc && <div style={{ fontSize:11.5, color:C.ink3, marginTop:2 }}>{desc}</div>}
        </div>
        <label className="snj-toggle" style={{ position:'relative', width:44, height:24, cursor:'pointer', flexShrink:0, display:'inline-block' }}>
          <input type="checkbox" defaultChecked={defaultOn} style={{ opacity:0, width:0, height:0, position:'absolute' }} />
          <span className="snj-track" />
        </label>
      </div>
    );

    return (
      <div>
        <SectionHead title="Settings ⚙️" />

        <Card style={{ marginBottom:18 }}>
          <CardTitle>👤 Account Information</CardTitle>
          <Row><Field label="Full Name"><Inp placeholder="Full name" value={u.name} /></Field><Field label="Email Address"><ValidInp type="email" placeholder="Email" value={u.email} validate="email" /></Field></Row>
          <Row><Field label="Mobile Number"><ValidInp placeholder="10-digit mobile" value={u.phone} validate="mobile" /></Field><Field label="Alternate Mobile"><ValidInp placeholder="Optional" validate="mobile" /></Field></Row>
          <Row cols="1fr"><Field label="About / Bio"><textarea defaultValue={u.bio||''} placeholder="Short bio…" rows={2} style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, border:`1px solid ${C.border}`, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} /></Field></Row>
          <div style={{ textAlign:'right' }}><Btn primary style={{ background:C.blue }}>💾 Save Changes</Btn></div>
        </Card>

        <Card style={{ marginBottom:18 }}>
          <CardTitle>🔒 Change Password</CardTitle>
          <Row><Field label="Current Password"><Inp type="password" placeholder="Enter current password" /></Field></Row>
          <Row><Field label="New Password"><Inp type="password" placeholder="Min 8 characters" /></Field><Field label="Confirm New Password"><Inp type="password" placeholder="Re-enter new password" /></Field></Row>
          <div style={{ textAlign:'right' }}><Btn primary style={{ background:C.blue }}>🔐 Update Password</Btn></div>
        </Card>

        <Card style={{ marginBottom:18 }}>
          <CardTitle>🔔 Notification Preferences</CardTitle>
          <Toggle label="Job Alerts via SMS"         desc="Get SMS when new jobs match your profile"           defaultOn={true} />
          <Toggle label="Job Alerts via Email"       desc="Get email digest of matching jobs"                  defaultOn={true} />
          <Toggle label="Course Recommendations"     desc="Notify me about new recommended courses"            defaultOn={true} />
          <Toggle label="Application Status Updates" desc="Updates when employer reviews your application"     defaultOn={true} />
          <Toggle label="Scheme & Benefit Alerts"    desc="Alerts about new government schemes you qualify for" defaultOn={false} />
          <Toggle label="Platform Announcements"     desc="News and updates from SkillsnJobs"                  defaultOn={false} />
        </Card>

        <Card style={{ marginBottom:18 }}>
          <CardTitle>🔏 Privacy Settings</CardTitle>
          <Toggle label="Profile Visible to Employers" desc="Allow employers to search and view your profile"    defaultOn={true} />
          <Toggle label="Show Contact Details"          desc="Display mobile and email to shortlisted employers" defaultOn={false} />
          <Toggle label="Resume Download by Employer"   desc="Allow employers to download your resume"           defaultOn={true} />
        </Card>

        <Card>
          <CardTitle>⚠️ Account Actions</CardTitle>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
            <Btn style={{ borderColor:'#DC2626', color:'#DC2626' }}>🗑️ Delete Account</Btn>
            <Btn style={{ borderColor:C.ink3, color:C.ink3 }} onClick={signOut}>🚪 Sign Out</Btn>
          </div>
        </Card>
      </div>
    );
  }

  function PanelResumeBuilderAI() {
    async function handleGenerate() {
      setRbLoading(true);
      const content = `RESUME — ${user?.name || 'Your Name'}
${user?.email || ''} · ${profileDraft?.phone || ''} · ${profileDraft?.city || ''}

OBJECTIVE
${rbForm.objective || 'Motivated professional seeking opportunities to grow and contribute.'}

SKILLS
${rbForm.skills || (profileDraft?.skill_name || 'Add your skills')}

WORK EXPERIENCE
${rbForm.experience || 'Add your work experience here.'}

EDUCATION
${rbForm.education || 'Add your education details here.'}`;
      // Simulate brief AI processing
      await new Promise(r => setTimeout(r, 1200));
      setRbGenerated(content);
      setRbStep(3);
      // Save to DB
      setResumeSaving(true);
      try {
        const saved = await api.saveResume(content);
        setDbResume(saved);
        toast3('Resume saved to your account ✅');
        // Refresh notifications so "Resume saved" notif appears
        api.candidateNotifications().then(d => setDbNotifications(d||[])).catch(()=>{});
      } catch(e) {
        toast3('Resume generated but save failed: ' + e.message, false);
      } finally {
        setResumeSaving(false);
        setRbLoading(false);
      }
    }

    const existingContent = dbResume?.content;

    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>📄 <span style={{ color:C.saffron }}>Career & AI Tools</span></div>
        <SectionHead title="AI Resume Builder 📄" />
        {existingContent && rbStep === 1 && (
          <div style={{ padding:'12px 16px', background:C.greenPale, border:`1px solid ${C.green}33`,
            borderRadius:9, marginBottom:16, fontSize:13, color:C.green, fontWeight:600,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>✅ You have a saved resume (v{dbResume.version})</span>
            <Btn sm onClick={() => { setRbGenerated(existingContent); setRbStep(3); }}>View →</Btn>
          </div>
        )}
        <div style={{ display:'flex', gap:12, marginBottom:22 }}>
          {['1. Fill Details','2. Generate','3. Download'].map((s,i) => (
            <div key={i} style={{ flex:1, textAlign:'center', padding:'10px 8px', borderRadius:8,
              background: rbStep===i+1 ? C.navy : C.card,
              border:`1px solid ${rbStep===i+1 ? C.navy : C.border}`,
              color: rbStep===i+1 ? '#fff' : C.ink3, fontSize:12, fontWeight:600 }}>{s}</div>
          ))}
        </div>
        {rbStep !== 3 ? (
          <Card>
            <CardTitle>Resume Details</CardTitle>
            <div style={{ display:'grid', gap:14, marginTop:12 }}>
              {[
                { key:'objective', label:'Career Objective', placeholder:'e.g. Seeking a role in IT support with 3+ years experience…' },
                { key:'skills',    label:'Key Skills (comma-separated)', placeholder:'e.g. Python, SQL, Communication, Teamwork' },
                { key:'experience',label:'Work Experience', placeholder:'Company | Role | Duration | Key responsibilities…' },
                { key:'education', label:'Education', placeholder:'Degree | Institution | Year | Percentage/Grade…' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:5 }}>{f.label}</label>
                  <textarea value={rbForm[f.key]} onChange={e => setRbForm(p => ({...p, [f.key]: e.target.value}))}
                    placeholder={f.placeholder}
                    style={{ width:'100%', minHeight:72, padding:'9px 12px', borderRadius:7,
                      border:`1px solid ${C.border}`, fontSize:13, fontFamily:'inherit',
                      resize:'vertical', boxSizing:'border-box', color:C.ink }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop:18 }}>
              <Btn primary onClick={handleGenerate} disabled={rbLoading}>
                {rbLoading ? 'Generating & Saving…' : '✨ Generate Resume with AI →'}
              </Btn>
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <CardTitle>Your Resume {dbResume?.version ? `(v${dbResume.version})` : ''}</CardTitle>
              <div style={{ display:'flex', gap:8 }}>
                <Btn sm onClick={() => { setRbStep(1); setRbGenerated(''); }}>✏️ Edit</Btn>
                <Btn sm primary onClick={() => {
                  const el = document.createElement('a');
                  el.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(rbGenerated);
                  el.download = 'resume.txt'; el.click();
                }}>⬇ Download</Btn>
              </div>
            </div>
            {resumeSaving && <p style={{ fontSize:12, color:C.ink3, marginBottom:8 }}>Saving to account…</p>}
            <pre style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
              padding:'16px 18px', fontSize:12.5, lineHeight:1.8, whiteSpace:'pre-wrap',
              color:C.ink, fontFamily:'monospace', margin:0 }}>{rbGenerated}</pre>
          </Card>
        )}
      </div>
    );
  }

  function PanelSkillsEndorsements() {
    // Use same skill parsing as PanelSkillPassport — real data from user object
    const u = user || {};
    let mySkills = [];
    if (Array.isArray(u.skills)) mySkills = u.skills;
    else if (typeof u.skills === 'string') {
      try { mySkills = JSON.parse(u.skills); } catch { mySkills = u.skills.split(',').map(s => s.trim()).filter(Boolean); }
    }
    if (!mySkills.length && profileDraft?.skill_name) mySkills = [profileDraft.skill_name];

    // Endorsed skills = skills that have a certificate (NSDC verified)
    const certifiedSkillNames = new Set(
      myCerts.map(c => {
        const t = (c.course_title || '').toLowerCase();
        if (t.includes('sql')) return 'SQL';
        if (t.includes('power bi') || t.includes('pbi')) return 'Power BI';
        if (t.includes('react')) return 'React.js';
        if (t.includes('python')) return 'Python';
        if (t.includes('tally')) return 'Tally';
        return null;
      }).filter(Boolean)
    );

    // Skill verification rows: certified skills show "NSDC Verified", others self-declared
    const verificationRows = mySkills.map(skill => ({
      skill,
      by: certifiedSkillNames.has(skill) ? 'Course Certificate (NSDC)' : 'Self-declared',
      status: certifiedSkillNames.has(skill) ? '✅ Verified' : '⏳ Pending',
    }));

    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>⭐ <span style={{ color:C.saffron }}>Career & AI Tools</span></div>
        <SectionHead title="Skills & Endorsements ⭐" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }}>
          <Card>
            <CardTitle>My Skills</CardTitle>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
              {mySkills.length ? mySkills.map(s => (
                <span key={s} style={{ background: certifiedSkillNames.has(s) ? '#F0FDF4' : C.bluePale,
                  color: certifiedSkillNames.has(s) ? '#15803D' : C.blue,
                  border:`1px solid ${certifiedSkillNames.has(s) ? '#86EFAC' : C.blue+'33'}`,
                  borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600 }}>
                  {certifiedSkillNames.has(s) ? '🏅 ' : ''}{s}
                </span>
              )) : <p style={{ color:C.ink3, fontSize:13 }}>No skills added yet. Update your profile.</p>}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                placeholder="Add a skill…"
                style={{ flex:1, padding:'8px 12px', borderRadius:7, border:`1px solid ${C.border}`,
                  fontSize:13, color:C.ink }} />
              <Btn sm primary onClick={() => setNewSkill('')}>Add</Btn>
            </div>
          </Card>
          <Card>
            <CardTitle>Endorsements Received</CardTitle>
            <div style={{ marginTop:12 }}>
              {certifiedSkillNames.size > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[...certifiedSkillNames].map(skill => (
                    <div key={skill} style={{ padding:'10px 14px', background:C.surface,
                      borderRadius:8, border:`1px solid ${C.border}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontWeight:700, fontSize:13, color:C.navy }}>🏅 {skill}</span>
                        <span style={{ background:C.green, color:'#fff', borderRadius:12,
                          padding:'2px 10px', fontSize:11, fontWeight:700 }}>NSDC</span>
                      </div>
                      <div style={{ fontSize:11, color:C.ink3, marginTop:4 }}>Verified via course certificate</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'24px 0', color:C.ink3 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🎓</div>
                  <p style={{ fontSize:13 }}>Complete a certified course to earn skill endorsements.</p>
                  <div style={{ marginTop:12 }}><Btn sm primary onClick={() => go('browse-courses')}>Browse Courses →</Btn></div>
                </div>
              )}
            </div>
          </Card>
        </div>
        <Card>
          <CardTitle>Skill Verification Status</CardTitle>
          {verificationRows.length ? (
            <table style={{ width:'100%', borderCollapse:'collapse', marginTop:12 }}>
              <thead>
                <tr>{['Skill','Verified By','Status'].map(h => <Th key={h}>{h}</Th>)}</tr>
              </thead>
              <tbody>
                {verificationRows.map(r => (
                  <tr key={r.skill} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <Td bold>{r.skill}</Td><Td>{r.by}</Td>
                    <Td><span style={{ color: r.status.startsWith('✅') ? C.green : C.saffron, fontWeight:600, fontSize:12 }}>{r.status}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign:'center', padding:'24px 0', color:C.ink3, fontSize:13 }}>
              Add skills to your profile to see verification status.
            </div>
          )}
        </Card>
      </div>
    );
  }

  function PanelAISkillGap() {
    const gaps = skillGapData?.gaps || [];

    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🧠 <span style={{ color:C.saffron }}>Career & AI Tools</span></div>
        <SectionHead title="AI Skill Gap Analysis 🧠" />
        <div style={{ padding:'12px 16px', background:'#F3E5F5', border:'1px solid #CE93D8',
          borderRadius:9, marginBottom:20, fontSize:13, color:'#6A1B9A' }}>
          🤖 Our AI compares your current skills against employer demand in your preferred sector and location, highlighting gaps to prioritise.
        </div>
        {skillGapLoading ? (
          <Card><div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>Analysing skill demand…</div></Card>
        ) : !gaps.length ? (
          <Card>
            <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
              <div style={{ fontSize:40 }}>🧠</div>
              <p style={{ marginTop:12, fontSize:13 }}>Complete your profile with skills and job preferences so our AI can analyse your skill gaps.</p>
              <div style={{ marginTop:16 }}><Btn primary sm onClick={() => go('profile')}>Update Profile →</Btn></div>
            </div>
          </Card>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
              {[
                { icon:'🎯', label:'Skills Matched', value: `${gaps.filter(g=>g.gap<20).length}/${gaps.length}`, color:C.green },
                { icon:'⚠️', label:'High Priority Gaps', value: gaps.filter(g=>g.priority==='High').length, color:'#E53935' },
                { icon:'📈', label:'Avg. Market Demand', value: `${Math.round(gaps.reduce((s,g)=>s+g.demand,0)/gaps.length)}%`, color:C.blue },
              ].map(k => (
                <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:10, padding:'16px 18px', textAlign:'center' }}>
                  <div style={{ fontSize:26 }}>{k.icon}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:k.color, margin:'6px 0' }}>{k.value}</div>
                  <div style={{ fontSize:11.5, color:C.ink3, fontWeight:500 }}>{k.label}</div>
                </div>
              ))}
            </div>
            <Card style={{ marginBottom:20 }}>
              <CardTitle>Skill Gap Breakdown</CardTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:14 }}>
                {gaps.map(g => {
                  const priColor = g.priority==='High' ? '#E53935' : g.priority==='Medium' ? C.saffron : C.green;
                  return (
                    <div key={g.skill}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontWeight:600, fontSize:13, color:C.navy }}>{g.skill}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:priColor,
                          background:`${priColor}18`, border:`1px solid ${priColor}44`,
                          borderRadius:12, padding:'2px 9px' }}>{g.priority} Priority</span>
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
                        <span style={{ fontSize:11, color:C.ink3, width:90 }}>Your level</span>
                        <div style={{ flex:1, height:7, background:C.border, borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${g.have}%`, background:C.blue, borderRadius:4 }} />
                        </div>
                        <span style={{ fontSize:11, color:C.blue, fontWeight:600, width:30 }}>{g.have}%</span>
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ fontSize:11, color:C.ink3, width:90 }}>Market demand</span>
                        <div style={{ flex:1, height:7, background:C.border, borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${g.demand}%`, background:priColor, borderRadius:4 }} />
                        </div>
                        <span style={{ fontSize:11, color:priColor, fontWeight:600, width:30 }}>{g.demand}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <CardTitle>Recommended Courses to Close Gaps</CardTitle>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                {gaps.filter(g=>g.priority==='High').map(g => (
                  <div key={g.skill} style={{ padding:'12px 14px', background:C.surface,
                    border:`1px solid ${C.border}`, borderRadius:9 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:4 }}>{g.skill}</div>
                    <div style={{ fontSize:11.5, color:C.ink3, marginBottom:8 }}>Gap: {g.gap}% · {g.priority} Priority</div>
                    <Btn sm primary onClick={() => go('browse-courses')}>Find Courses →</Btn>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    );
  }

  function PanelInterviews() {
    const tab = interviewTab;
    const setTab = setInterviewTab;
    const scheduledInterviews = myApps.filter(a => a.status === 'interview');
    const tips = [
      'Research the company thoroughly before the interview.',
      'Use the STAR method (Situation, Task, Action, Result) for behavioural questions.',
      'Practice answering "Tell me about yourself" in under 2 minutes.',
      'Prepare 3–5 questions to ask the interviewer.',
      'Send a thank-you email within 24 hours of the interview.',
      'Dress appropriately — even for online interviews, dress as you would in person.',
      'Arrive (or join) 5–10 minutes early and test tech setup beforehand.',
    ];

    const scoreColor = s => s >= 8 ? C.green : s >= 6 ? C.saffron : '#DC2626';

    return (
      <div>
        <div style={{ marginBottom:6, fontSize:12, color:C.ink3 }}>🎤 <span style={{ color:C.saffron }}>Career & AI Tools</span></div>
        <SectionHead title="Interviews 🎤" />
        <div style={{ display:'flex', gap:0, marginBottom:20, background:C.card,
          border:`1px solid ${C.border}`, borderRadius:9, overflow:'hidden' }}>
          {[['mock','🤖 AI Coach'],['scheduled','📅 Scheduled'],['tips','💡 Tips']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex:1, padding:'10px 0', border:'none', cursor:'pointer', fontSize:12.5, fontWeight:600,
                background: tab===k ? C.navy : 'transparent', color: tab===k ? '#fff' : C.ink2 }}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'mock' && (
          <div>
            {/* AI Interview Coach */}
            <Card style={{ marginBottom:20, border:'2px solid #7C3AED20', background:'linear-gradient(135deg,#F5F3FF,#fff)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#7C3AED,#010E3C)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🤖</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>AI Interview Coach</div>
                  <div style={{ fontSize:12, color:C.ink3 }}>Get personalised questions + instant AI scoring & tips</div>
                </div>
              </div>

              {/* Step 1: Role input */}
              {interviewQs.length === 0 && !interviewScores && (
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:C.ink2, display:'block', marginBottom:6 }}>
                    Target Role / Job Title
                  </label>
                  <div style={{ display:'flex', gap:10 }}>
                    <input
                      value={interviewRole}
                      onChange={e => setInterviewRole(e.target.value)}
                      placeholder={profileDraft.pref_role || 'e.g. Data Analyst, React Developer'}
                      style={{ flex:1, padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8,
                        fontSize:13, color:C.navy, outline:'none' }}
                      onKeyDown={e => e.key==='Enter' && generateInterviewQuestions()}
                    />
                    <button onClick={generateInterviewQuestions} disabled={interviewGenLoading}
                      style={{ padding:'9px 18px', background:'linear-gradient(135deg,#7C3AED,#010E3C)',
                        color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                        cursor: interviewGenLoading ? 'wait' : 'pointer', whiteSpace:'nowrap' }}>
                      {interviewGenLoading ? '⏳ Generating…' : '✨ Generate Questions'}
                    </button>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                    {['Data Analyst','React Developer','HR Executive','Python Developer','Sales Executive'].map(r => (
                      <button key={r} onClick={() => { setInterviewRole(r); }}
                        style={{ padding:'4px 10px', background: interviewRole===r ? '#EDE9FE' : C.surface,
                          color: interviewRole===r ? '#7C3AED' : C.ink2, border:`1px solid ${interviewRole===r ? '#7C3AED' : C.border}`,
                          borderRadius:20, fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Answer questions */}
              {interviewQs.length > 0 && !interviewScores && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontWeight:700, fontSize:13.5, color:C.navy }}>
                      🎯 Questions for: <span style={{ color:'#7C3AED' }}>{interviewRole || 'Your Role'}</span>
                    </div>
                    <button onClick={() => { setInterviewQs([]); setInterviewAnswers({}); setInterviewScores(null); }}
                      style={{ fontSize:12, color:C.ink3, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                      ↩ Reset
                    </button>
                  </div>
                  {interviewQs.map((q, i) => (
                    <div key={i} style={{ marginBottom:16, padding:'14px 16px', background:'#fff',
                      borderRadius:10, border:`1px solid ${C.border}`, boxShadow:'0 1px 4px #0001' }}>
                      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
                        <div style={{ minWidth:26, height:26, borderRadius:'50%',
                          background:'linear-gradient(135deg,#7C3AED,#010E3C)', color:'#fff',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>
                          {i+1}
                        </div>
                        <div style={{ fontWeight:600, fontSize:13, color:C.navy, lineHeight:1.5 }}>{q}</div>
                      </div>
                      <textarea
                        rows={3}
                        value={interviewAnswers[i] || ''}
                        onChange={e => setInterviewAnswers(a => ({ ...a, [i]: e.target.value }))}
                        placeholder="Type your answer here…"
                        style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8,
                          fontSize:13, color:C.ink, outline:'none', resize:'vertical', boxSizing:'border-box',
                          fontFamily:'inherit', lineHeight:1.6 }}
                      />
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
                    <button onClick={() => { setInterviewQs([]); setInterviewAnswers({}); setInterviewScores(null); }}
                      style={{ padding:'9px 16px', background:C.surface, color:C.ink2, border:`1px solid ${C.border}`,
                        borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      ↩ Start Over
                    </button>
                    <button onClick={scoreInterviewAnswers} disabled={interviewScoreLoading}
                      style={{ padding:'9px 20px', background:'linear-gradient(135deg,#7C3AED,#010E3C)',
                        color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                        cursor: interviewScoreLoading ? 'wait' : 'pointer' }}>
                      {interviewScoreLoading ? '⏳ AI Scoring…' : '🎯 Submit for AI Scoring'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Scores */}
              {interviewScores && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>
                      🏅 AI Scorecard — <span style={{ color:'#7C3AED' }}>{interviewRole || 'Your Role'}</span>
                    </div>
                    <button onClick={() => { setInterviewQs([]); setInterviewAnswers({}); setInterviewScores(null); setInterviewRole(''); }}
                      style={{ fontSize:12, color:'#7C3AED', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                      + New Session
                    </button>
                  </div>
                  {/* Overall score */}
                  {(() => {
                    const scores = interviewScores?.scores || [];
                    const avg = scores.length ? Math.round(scores.reduce((s,r)=>s+(r.score||0),0)/scores.length*10)/10 : 0;
                    return (
                      <div style={{ display:'flex', alignItems:'center', gap:20, padding:'14px 18px',
                        background: avg>=8?'#F0FDF4':avg>=6?'#FFFBEB':'#FEF2F2',
                        border:`1.5px solid ${scoreColor(avg)}30`, borderRadius:10, marginBottom:16 }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:32, fontWeight:800, color:scoreColor(avg) }}>{avg}</div>
                          <div style={{ fontSize:10, color:C.ink3, fontWeight:600 }}>/ 10 AVG</div>
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>
                            {avg>=8?'Excellent! You\'re interview-ready.':avg>=6?'Good effort — a bit more practice needed.':'Keep practising — focus on the tips below.'}
                          </div>
                          <div style={{ fontSize:12, color:C.ink3, marginTop:3 }}>Based on {scores.length} AI-evaluated answers</div>
                        </div>
                      </div>
                    );
                  })()}
                  {(interviewScores?.scores || []).map((r, i) => (
                    <div key={i} style={{ marginBottom:12, padding:'12px 14px', background:'#fff',
                      borderRadius:10, border:`1px solid ${C.border}`, display:'flex', gap:14 }}>
                      <div style={{ minWidth:42, height:42, borderRadius:10,
                        background: scoreColor(r.score)+'20', display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <div style={{ fontSize:17, fontWeight:800, color:scoreColor(r.score) }}>{r.score}</div>
                        <div style={{ fontSize:9, color:C.ink3 }}>/10</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12.5, fontWeight:600, color:C.navy, marginBottom:4, lineHeight:1.4 }}>{r.q || interviewQs[i]}</div>
                        {r.tip && (
                          <div style={{ display:'flex', gap:6, alignItems:'flex-start', marginTop:4,
                            padding:'6px 10px', background:'#F5F3FF', borderRadius:7 }}>
                            <span style={{ fontSize:12 }}>💡</span>
                            <span style={{ fontSize:11.5, color:'#5B21B6', lineHeight:1.5 }}>{r.tip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Interview type cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { icon:'🧑‍💻', title:'Technical Interview', desc:'Data structures, algorithms, system design, coding challenges.', role:'Software Developer', tags:['IT','Engineering'] },
                { icon:'🤝', title:'HR / Behavioural', desc:'Competency-based questions, cultural fit, situational scenarios.', role:'HR Executive', tags:['All roles'] },
                { icon:'📊', title:'Case Interview', desc:'Business problem-solving, market sizing, case frameworks.', role:'Business Analyst', tags:['Management','Consulting'] },
                { icon:'🏭', title:'Domain-specific', desc:'Sector-based technical questions tailored to your job preferences.', role: profileDraft.pref_role || 'Data Analyst', tags:['Finance','Healthcare','Logistics'] },
              ].map(m => (
                <Card key={m.title} style={{ cursor:'pointer' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{m.icon}</div>
                  <div style={{ fontWeight:700, fontSize:13, color:C.navy, marginBottom:5 }}>{m.title}</div>
                  <p style={{ fontSize:12, color:C.ink2, lineHeight:1.5, marginBottom:10 }}>{m.desc}</p>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                    {m.tags.map(t => (
                      <span key={t} style={{ background:C.tealPale, color:C.teal, fontSize:10,
                        borderRadius:12, padding:'2px 8px', fontWeight:600 }}>{t}</span>
                    ))}
                  </div>
                  <Btn sm primary onClick={() => {
                    setInterviewRole(m.role);
                    setInterviewQs([]); setInterviewAnswers({}); setInterviewScores(null);
                    setTimeout(generateInterviewQuestions, 100);
                  }}>Start Practice →</Btn>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'scheduled' && (
          <Card>
            <CardTitle>Upcoming Interview Slots</CardTitle>
            {scheduledInterviews.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
                {scheduledInterviews.map((a, i) => (
                  <div key={i} style={{ padding:'14px 16px', background:C.surface,
                    borderRadius:10, border:`1.5px solid #7C3AED30`, display:'flex', gap:14, alignItems:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:'#EDE9FE',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🎤</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13.5, color:C.navy }}>{a.title || 'Interview'}</div>
                      <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>
                        {a.employer_name || a.company || 'Company'} • {a.location || 'TBD'}
                      </div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, background:'#EDE9FE', color:'#7C3AED',
                      borderRadius:20, padding:'4px 12px' }}>Interview</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
                <div style={{ fontSize:40 }}>📅</div>
                <p style={{ marginTop:12, fontSize:13 }}>No interviews scheduled yet.</p>
                <div style={{ marginTop:16 }}><Btn primary sm onClick={() => go('browse-jobs')}>Browse Jobs & Apply →</Btn></div>
              </div>
            )}
          </Card>
        )}

        {tab === 'tips' && (
          <Card>
            <CardTitle>Interview Success Tips</CardTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start',
                  padding:'12px 14px', background:C.surface, borderRadius:8, border:`1px solid ${C.border}` }}>
                  <div style={{ minWidth:28, height:28, borderRadius:'50%', background:C.navy,
                    color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:700 }}>{i+1}</div>
                  <span style={{ fontSize:13, color:C.ink, lineHeight:1.6 }}>{tip}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:18, padding:'14px 16px', background:'#F5F3FF', borderRadius:10,
              border:'1px solid #DDD6FE', display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:24 }}>🤖</span>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#5B21B6' }}>Want personalised feedback?</div>
                <div style={{ fontSize:12, color:C.ink3, marginTop:2 }}>Try the AI Interview Coach for instant scoring on your answers.</div>
              </div>
              <Btn sm primary onClick={() => setTab('mock')} style={{ marginLeft:'auto', whiteSpace:'nowrap' }}>Start Now →</Btn>
            </div>
          </Card>
        )}
      </div>
    );
  }

  function PanelComingSoon(title, icon) {
    return (
      <div>
        <SectionHead title={title} />
        <Card>
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:48 }}>{icon || '🚧'}</div>
            <p style={{ color:C.ink3, fontSize:15, margin:'16px 0' }}>This section is coming soon.</p>
            <Btn primary onClick={() => go('dashboard')}>← Back to Dashboard</Btn>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Route to active panel ────────────────────────────────────── */
  function renderPanel() {
    switch(active) {
      case 'dashboard':        return PanelDashboard();
      case 'browse-jobs':      return PanelBrowseJobs();
      case 'my-applications':  return PanelMyApplications();
      case 'browse-courses':   return PanelBrowseCourses();
      case 'my-courses':       return PanelMyCourses();
      case 'course-progress':  return PanelLearningProgress();
      case 'certificates':     return PanelCertificates();
      case 'course-recommend': return PanelAIRecommendations();
      case 'assess-upcoming':
      case 'assess-completed':
      case 'assess-results':
      case 'rpl':              return PanelAssessments();
      case 'saved-jobs':       return PanelSavedJobs();
      case 'job-alerts':       return PanelJobAlerts();
      case 'placement-status': return PanelPlacementStatus();
      case 'apprentice-browse':  return PanelApprenticeBrowse();
      case 'apprentice-applied': return PanelApprenticeApplied();
      case 'naps':               return PanelNapsRegistration();
      case 'career':           return PanelCareerServices();
      case 'resume-builder':   return PanelResumeBuilderAI();
      case 'mock-interviews':  return PanelInterviews();
      case 'career-counselling': return PanelCareerCounselling();
      case 'career-path':      return PanelCareerPathways();
      case 'resume-builder-ai':  return PanelResumeBuilderAI();
      case 'skills-endorsements':return PanelSkillsEndorsements();
      case 'ai-skill-gap':       return PanelAISkillGap();
      case 'interviews':         return PanelInterviews();
      case 'financial-aid':    return PanelFinancialAid();
      case 'grievance':        return PanelGrievance();
      case 'settings':         return PanelSettings();
      case 'pref-account':       return PanelPrefAccount();
      case 'pref-notifications': return PanelPrefNotifications();
      case 'pref-privacy':       return PanelPrefPrivacy();
      case 'pref-password':      return PanelPrefPassword();
      case 'pref-language':      return PanelPrefLanguage();
      case 'pref-appearance':    return PanelPrefAppearance();
      case 'skill-passport':   return PanelSkillPassport();
      case 'pmkvy':
      case 'naps-scheme':
      case 'rpl-scheme':
      case 'pmegp':
      case 'scholarship':      return PanelSchemes();
      case 'notifications':    return PanelNotifications();
      case 'helpdesk':
      case 'faq':              return PanelHelpdesk();
      case 'profile-basic':
      case 'profile-edu':
      case 'profile-exp':
      case 'profile-skills':
      case 'profile-docs':
      case 'profile-pref':     return PanelProfile();
      default:                 return PanelComingSoon(active.replace(/-/g,' '), '🚧');
    }
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {Sidebar()}
      <div style={{ marginLeft: isMobile ? 0 : SW, flex:1, display:'flex', flexDirection:'column', background:C.surface }}>
        {Topbar()}
        <div style={{ marginTop:TH, flex:1, padding:'24px 28px 60px' }}>
          {renderPanel()}
        </div>
      </div>
      {/* ── AI Chatbot floating widget ── */}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:10001, display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
        {chatOpen && (
          <div style={{ width:340, height:460, background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', border:'1px solid #E0E6EF', display:'flex', flexDirection:'column', marginBottom:10, overflow:'hidden' }}>
            {/* Chat header */}
            <div style={{ background:'#010E3C', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7B5CF6,#9B6FFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
                <div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>AI Assistant</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>SkillsnJobs · Always here</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
            </div>
            {/* Messages */}
            <div id="chat-msgs" style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'82%', padding:'8px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.role === 'user' ? '#010E3C' : '#F1F5F9',
                    color: m.role === 'user' ? '#fff' : '#1A2B4A', fontSize:12.5, lineHeight:1.6 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <div style={{ padding:'8px 14px', background:'#F1F5F9', borderRadius:'12px 12px 12px 2px', fontSize:12 }}>
                    <span style={{ display:'inline-flex', gap:3 }}>
                      {[0,1,2].map(i => <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#94A3B8', display:'inline-block', animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* Quick suggestions */}
            <div style={{ padding:'6px 10px', display:'flex', gap:6, overflowX:'auto', borderTop:'1px solid #F1F5F9' }}>
              {['Find jobs for me','My certificates','PMKVY eligibility','Skill gap advice'].map(s => (
                <button key={s} onClick={() => { setChatInput(s); }}
                  style={{ flexShrink:0, fontSize:10.5, padding:'4px 10px', borderRadius:20, border:'1px solid #E0E6EF', background:'#F8FAFC', color:'#3D5170', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {s}
                </button>
              ))}
            </div>
            {/* Input */}
            <div style={{ padding:'10px 12px', borderTop:'1px solid #E0E6EF', display:'flex', gap:8, alignItems:'center' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask anything…"
                style={{ flex:1, padding:'8px 12px', borderRadius:20, border:'1.5px solid #E0E6EF', fontSize:12.5, outline:'none', color:'#1A2B4A' }} />
              <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}
                style={{ width:34, height:34, borderRadius:'50%', background:chatInput.trim() ? '#010E3C' : '#E0E6EF', border:'none', cursor:'pointer',
                  color:'#fff', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.2s' }}>
                ➤
              </button>
            </div>
          </div>
        )}
        {/* Trigger button */}
        <button onClick={() => { setChatOpen(o => !o); }} style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#7B5CF6,#010E3C)', border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(123,92,246,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, position:'relative' }}>
          {chatOpen ? '✕' : '🤖'}
          {!chatOpen && chatMsgs.filter(m => m.role === 'assistant').length > 1 && (
            <span style={{ position:'absolute', top:0, right:0, width:14, height:14, borderRadius:'50%', background:'#EF4444', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff', fontWeight:700 }}>!</span>
          )}
        </button>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:50, right:24, zIndex:9999,
          background: toast.ok ? C.teal : '#DC2626', color:'#fff',
          padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600,
          boxShadow:'0 4px 20px rgba(0,0,0,.25)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}
      {enrollBatchModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:420, boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Enroll in Course</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:16 }}>{enrollBatchModal.title}</div>
            {availBatches.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Select a Batch (optional)</div>
                <select style={{ width:'100%', padding:'9px 12px', border:'1px solid #CBD5E1', borderRadius:8, fontSize:13 }}
                  value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                  <option value="">— No specific batch —</option>
                  {availBatches.map(b => <option key={b.id} value={b.id}>{b.batch_code} · {b.start_date || 'TBD'} → {b.end_date || 'TBD'}</option>)}
                </select>
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ flex:1, padding:'9px 0', background:'#F1F5F9', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }} onClick={() => setEnrollBatchModal(null)}>Cancel</button>
              <button style={{ flex:2, padding:'9px 0', background:C.teal, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, opacity: enrollingId===enrollBatchModal.id ? .6 : 1 }}
                onClick={() => enrollCourse(enrollBatchModal.id, selectedBatch || null)}>
                {enrollingId===enrollBatchModal.id ? 'Enrolling…' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
