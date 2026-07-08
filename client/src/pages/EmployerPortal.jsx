import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES } from '../utils/validators.js';
import { useState, useRef, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import AccountPreferences from '../components/AccountPreferences.jsx';

const SW = 220, TH = 58;
const C = {
  navy:'#0D2137', sidebar:'#010E3C', blue:'#1E5FBF', teal:'#0B7B8C', green:'#1A7C3E',
  gold:'#C8860A', red:'#C0392B', purple:'#6B3FA0', orange:'#C05621',
  pBlue:'#EBF1FB', pGreen:'#E8F5EE', pGold:'#FEF6E4',
  pRed:'#FDECEA', pPurple:'#F0EAFB', pTeal:'#E6F4F6',
};

const NAV = [
  { key:'dashboard',        label:'Dashboard',             section:'Main' },
  { key:'notifications',    label:'Notifications',         section:'Main' },
  { key:'profile-info',     label:'Company Information',   section:'Company Profile' },
  { key:'profile-contact',  label:'Contact & Address',     section:'Company Profile' },
  { key:'profile-docs',     label:'Company Documents',     section:'Company Profile' },
  { key:'profile-bank',     label:'Bank & Billing',        section:'Company Profile' },
  { key:'profile-hr',       label:'HR Contacts',           section:'Company Profile' },
  { key:'job-post',         label:'Post New Job',          section:'Job Management' },
  { key:'job-active',       label:'Active Jobs',           section:'Job Management' },
  { key:'job-draft',        label:'Draft Jobs',            section:'Job Management' },
  { key:'job-closed',       label:'Closed Jobs',           section:'Job Management' },
  { key:'job-applications', label:'All Applications',      section:'Job Management' },
  { key:'cand-search',      label:'Search Candidates',     section:'Candidates' },
  { key:'cand-shortlist',   label:'Shortlisted',           section:'Candidates' },
  { key:'cand-interview',   label:'Interviews',            section:'Candidates' },
  { key:'cand-offer',       label:'Offers & Onboarding',   section:'Candidates' },
  { key:'cand-placed',      label:'Placement Records',     section:'Candidates' },
  { key:'appren-register',  label:'Register Vacancy',      section:'Apprenticeship' },
  { key:'appren-active',    label:'Active Apprentices',    section:'Apprenticeship' },
  { key:'appren-stipend',   label:'Stipend Management',    section:'Apprenticeship' },
  { key:'appren-reports',   label:'Apprenticeship Reports',section:'Apprenticeship' },
  { key:'skill-gap',        label:'Skill Gap Analysis',    section:'Skill Development' },
  { key:'skill-partners',   label:'Training Partner Connect',section:'Skill Development' },
  { key:'skill-requirements',label:'Training Requirements',section:'Skill Development' },
  { key:'skill-pmkvy',      label:'PMKVY Partnership',     section:'Skill Development' },
  { key:'scheme-pmkvy',     label:'PMKVY',                 section:'Schemes' },
  { key:'scheme-naps',      label:'NAPS / NATS',           section:'Schemes' },
  { key:'scheme-ddugky',    label:'DDU-GKY',               section:'Schemes' },
  { key:'scheme-star',      label:'STAR Scheme',           section:'Schemes' },
  { key:'scheme-incentives',label:'Employer Incentives',   section:'Schemes' },
  { key:'rep-hiring',       label:'Hiring Reports',        section:'Reports' },
  { key:'rep-placement',    label:'Placement Analytics',   section:'Reports' },
  { key:'rep-workforce',    label:'Workforce Reports',     section:'Reports' },
  { key:'rep-sector',       label:'Sector Reports',        section:'Reports' },
  { key:'comp-labour',      label:'Labour Law',            section:'Compliance' },
  { key:'comp-pfesi',       label:'PF / ESI',              section:'Compliance' },
  { key:'comp-contract',    label:'Contract Labour',       section:'Compliance' },
  { key:'comp-audit',       label:'Audit Trail',           section:'Compliance' },
  { key:'helpdesk',         label:'Helpdesk',              section:'Support' },
  { key:'grievance',        label:'Grievance',             section:'Support' },
  { key:'faq',              label:'FAQ',                   section:'Support' },
  { key:'settings',         label:'Account Preferences',   section:'Account' },
];

// ── stable module-level helpers ───────────────────────────────────────────────
function Card({ children, style }) {
  return <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.06)', border:'1px solid #e8ecf3', marginBottom:16, ...style }}>{children}</div>;
}
function CardTitle({ children }) {
  return <div style={{ fontWeight:700, fontSize:15, color:C.navy, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>{children}</div>;
}
function SectionHead({ title }) {
  return <div style={{ fontSize:22, fontWeight:800, color:C.navy, marginBottom:18 }}>{title}</div>;
}
function Bc({ parts }) {
  return <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>{parts.join(' › ')}</div>;
}
function Btn({ children, onClick, style, outline, danger, sm, teal, green }) {
  return <button onClick={onClick} style={{ padding: sm ? '5px 12px' : '8px 18px', borderRadius:8, border: outline ? `1.5px solid ${C.blue}` : 'none', background: danger ? C.red : teal ? C.teal : green ? C.green : outline ? '#fff' : C.blue, color: outline ? C.blue : '#fff', fontSize: sm ? 12 : 13, fontWeight:600, cursor:'pointer', ...style }}>{children}</button>;
}
function Badge({ children, color='blue' }) {
  const map = { blue:[C.pBlue,C.blue], green:[C.pGreen,C.green], gold:[C.pGold,C.gold], red:[C.pRed,C.red], purple:[C.pPurple,C.purple], teal:[C.pTeal,C.teal] };
  const [bg, fg] = map[color] || map.blue;
  return <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:10, fontSize:11, fontWeight:600, background:bg, color:fg }}>{children}</span>;
}
function KpiCard({ val, label, sub, color }) {
  return <div style={{ background:'#fff', borderRadius:12, padding:18, border:'1px solid #e8ecf3', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
    <div style={{ fontSize:26, fontWeight:800, color: color||C.navy, lineHeight:1 }}>{val}</div>
    <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</div>
    <div style={{ fontSize:11, marginTop:2, fontWeight:600, color: color||C.blue }}>{sub}</div>
  </div>;
}
function Table({ head, rows }) {
  return <div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse' }}>
    <thead><tr>{head.map(h=><th key={h} style={{ textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'.05em', textTransform:'uppercase', padding:'8px 10px', borderBottom:'2px solid #e8ecf3' }}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={i} style={{ background: i%2===0?'#fff':'#fafbfc' }}>{r.map((c,j)=><td key={j} style={{ padding:'10px', borderBottom:'1px solid #f0f2f5', fontSize:13 }}>{c}</td>)}</tr>)}</tbody>
  </table></div>;
}
function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}><label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>{label}</label>{children}</div>;
}
function Inp({ placeholder, defaultValue, value, onChange, type='text' }) {
  const controlled = value !== undefined;
  return <input type={type} placeholder={placeholder}
    {...(controlled ? { value, onChange } : { defaultValue })}
    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} />;
}

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
function Sel({ options, defaultValue, value, onChange }) {
  const controlled = value !== undefined;
  return <select {...(controlled ? { value, onChange } : { defaultValue })} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }}>
    {options.map(o=><option key={o}>{o}</option>)}
  </select>;
}
function Grid({ cols=2, children, gap=14 }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap }}>{children}</div>;
}
function Alert({ icon, children, type='info' }) {
  const map = { info:[C.pBlue,C.blue], warn:[C.pGold,C.gold], success:[C.pGreen,C.green], red:[C.pRed,C.red] };
  const [bg, fg] = map[type];
  return <div style={{ padding:'12px 16px', borderRadius:8, fontSize:13, marginBottom:14, background:bg, borderLeft:`4px solid ${fg}`, color:fg, display:'flex', gap:10 }}>{icon} <span>{children}</span></div>;
}
function Toggle({ label, sub, defaultChecked }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div><div style={{ fontSize:13, color:'#374151' }}>{label}</div><div style={{ fontSize:11, color:'#94a3b8' }}>{sub}</div></div>
    <label style={{ position:'relative', display:'inline-block', width:44, height:24, flexShrink:0 }}>
      <input type="checkbox" defaultChecked={defaultChecked} style={{ opacity:0, width:0, height:0, position:'absolute' }} />
      <span className="snj-track"></span>
    </label>
  </div>;
}
function TlItem({ dot, title, meta }) {
  return <div style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ width:10, height:10, borderRadius:'50%', background:dot, flexShrink:0, marginTop:4 }} />
    <div><div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{title}</div><div style={{ fontSize:11.5, color:'#94a3b8', marginTop:2 }}>{meta}</div></div>
  </div>;
}
function ProgBar({ pct, color }) {
  return <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <div style={{ background:'#e8ecf3', borderRadius:6, height:7, flex:1 }}><div style={{ height:7, borderRadius:6, width:`${pct}%`, background: color||C.blue }} /></div>
    <span style={{ fontSize:12, minWidth:30 }}>{pct}%</span>
  </div>;
}
function StatRow({ n, label, pct, color }) {
  return <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ fontSize:18, fontWeight:800, color:C.navy, minWidth:52, flexShrink:0 }}>{n}</div>
    <div style={{ fontSize:12.5, color:'#374151', flex:1, minWidth:0 }}>{label}</div>
    <div style={{ minWidth:60, flex:'0 0 30%' }}><ProgBar pct={pct} color={color} /></div>
  </div>;
}
function Step({ num, title, sub, done, pending }) {
  return <div style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ width:28, height:28, borderRadius:'50%', background: done ? C.green : pending ? '#e8ecf3' : C.blue, color: pending ? '#64748b' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{done ? '✓' : num}</div>
    <div><div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{title}</div><div style={{ fontSize:11.5, color:'#64748b', marginTop:2 }}>{sub}</div></div>
  </div>;
}
function CandCard({ initials, name, meta, skills, matchPct, matchColor, onShortlist }) {
  return <div style={{ background:'#fff', border:'1px solid #e8ecf3', borderRadius:10, padding:14, marginBottom:10, display:'flex', alignItems:'flex-start', gap:12 }}>
    <div style={{ width:42, height:42, borderRadius:'50%', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0 }}>{initials}</div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>{name} <Badge color={matchColor||'blue'}>{matchPct} Match</Badge></div>
      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{meta}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
        {skills.map(s=><span key={s} style={{ background:C.pBlue, color:C.blue, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:8 }}>{s}</span>)}
      </div>
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <Btn sm>View</Btn>
      <Btn sm outline>Shortlist</Btn>
    </div>
  </div>;
}

export default function EmployerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({});
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dbStats, setDbStats] = useState({});
  const searchRef = useRef(null);

  // ── Job management state ──
  const [myJobs, setMyJobs] = useState([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [allApps, setAllApps] = useState([]);
  const [appsLoaded, setAppsLoaded] = useState(false);
  const [jobForm, setJobForm] = useState({ title:'', description:'', required_skills:'', location:'', job_type:'Full-time', salary_min:'', salary_max:'' });
  const [jobSaving, setJobSaving] = useState(false);
  const [jobMsg, setJobMsg] = useState('');
  const [candidateList, setCandidateList] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);

  // ── Interview scheduling state ──
  const [interview, setInterview] = useState({ candidate_name:'', job_role:'', round:'Technical Round 1', date:'', time:'', mode:'Video Call', interviewers:'', link:'' });
  const [interviewSaving, setInterviewSaving] = useState(false);
  const [interviewMsg, setInterviewMsg] = useState('');
  const [scheduledInterviews, setScheduledInterviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('snj_interviews') || '[]'); } catch { return []; }
  });

  async function scheduleInterview() {
    if (!interview.candidate_name.trim() || !interview.date || !interview.time) {
      setInterviewMsg('Candidate name, date and time are required.'); return;
    }
    setInterviewSaving(true); setInterviewMsg('');
    const entry = { ...interview, id: Date.now(), scheduled_at: new Date().toISOString() };
    const updated = [entry, ...scheduledInterviews];
    setScheduledInterviews(updated);
    localStorage.setItem('snj_interviews', JSON.stringify(updated));
    setInterview({ candidate_name:'', job_role:'', round:'Technical Round 1', date:'', time:'', mode:'Video Call', interviewers:'', link:'' });
    setInterviewMsg('✅ Interview scheduled successfully.');
    setInterviewSaving(false);
  }

  // ── Offer letter state ──
  const [offer, setOffer] = useState({ candidate_name:'', job_role:'', ctc:'', joining_date:'', probation:'3 Months', special_terms:'' });
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerMsg, setOfferMsg] = useState('');
  const [sentOffers, setSentOffers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('snj_offers') || '[]'); } catch { return []; }
  });

  async function generateOffer(send) {
    if (!offer.candidate_name.trim() || !offer.job_role.trim() || !offer.ctc) {
      setOfferMsg('Candidate name, job role and CTC are required.'); return;
    }
    setOfferSaving(true); setOfferMsg('');
    const entry = { ...offer, id: Date.now(), status: send ? 'Sent' : 'Generated', created_at: new Date().toISOString() };
    const updated = [entry, ...sentOffers];
    setSentOffers(updated);
    localStorage.setItem('snj_offers', JSON.stringify(updated));
    setOffer({ candidate_name:'', job_role:'', ctc:'', joining_date:'', probation:'3 Months', special_terms:'' });
    setOfferMsg(send ? '✅ Offer letter sent successfully.' : '✅ Offer letter generated.');
    setOfferSaving(false);
  }

  // ── HR Contacts state ──
  const [hrContacts, setHrContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('snj_hr_contacts') || '[]'); } catch { return []; }
  });
  const [hrForm, setHrForm] = useState({ name:'', designation:'', email:'', phone:'' });
  const [hrSaving, setHrSaving] = useState(false);
  const [hrMsg, setHrMsg] = useState('');
  const [showHrForm, setShowHrForm] = useState(false);

  function saveHrContact() {
    if (!hrForm.name.trim()) { setHrMsg('Name is required.'); return; }
    setHrSaving(true);
    const entry = { ...hrForm, id: Date.now() };
    const updated = [...hrContacts, entry];
    setHrContacts(updated);
    localStorage.setItem('snj_hr_contacts', JSON.stringify(updated));
    setHrForm({ name:'', designation:'', email:'', phone:'' });
    setShowHrForm(false); setHrMsg(''); setHrSaving(false);
  }
  function removeHrContact(id) {
    const updated = hrContacts.filter(c => c.id !== id);
    setHrContacts(updated);
    localStorage.setItem('snj_hr_contacts', JSON.stringify(updated));
  }

  // ── Bank state ──
  const [bank, setBank] = useState({ bank_account_name: user?.bank_account_name||'', bank_account_number: user?.bank_account_number||'', bank_ifsc: user?.bank_ifsc||'' });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState('');
  // ── Docs state (lifted from PanelProfileDocs to avoid hooks-in-conditional violation) ──
  const [empDocs, setEmpDocs] = useState(() => { try { return JSON.parse(localStorage.getItem('snj_emp_docs') || '[]'); } catch { return []; } });
  // ── Candidate search query (lifted from PanelCandSearch) ──
  const [candSearchQ, setCandSearchQ] = useState('');

  async function saveBank() {
    setBankSaving(true); setBankMsg('');
    try {
      await api.updateMe({ bank_account_name: bank.bank_account_name||null, bank_account_number: bank.bank_account_number||null, bank_ifsc: bank.bank_ifsc.toUpperCase()||null });
      setBankMsg('Saved successfully');
    } catch { setBankMsg('Save failed. Please try again.'); }
    setBankSaving(false);
  }

  // ── Profile form state (controlled) ──
  const [profileInfo, setProfileInfo] = useState(() => ({
    org_name: user?.org_name || '',
    phone: (user?.phone || '').replace(/^\+91/, ''),
    location: user?.location || '',
    pan: user?.pan || '',
    gstin: user?.gstin || '',
    tan: user?.tan || '',
    cin: user?.cin || '',
    website: user?.website || '',
    bio: user?.bio || '',
    spoc_name: user?.spoc_name || '',
    address_line1: user?.address_line1 || '',
    address_line2: user?.address_line2 || '',
    city: user?.city || '',
    state_name: user?.state_name || '',
    pincode: user?.pincode || '',
    email: user?.email || '',
  }));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [panError, setPanError] = useState('');
  const [cinError, setCinError] = useState('');
  const [gstError, setGstError] = useState('');
  const [tanError, setTanError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
  const CIN_RE = /^[A-Z]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
  const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

  useEffect(() => {
    api.dashboardStats().then(setDbStats).catch(() => {});
    // Load jobs and apps eagerly for dashboard
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
    api.myJobs().then(jobs =>
      Promise.all(jobs.map(j => api.jobApplicants(j.id).then(apps => apps.map(a => ({ ...a, job_title: j.title }))).catch(() => [])))
        .then(all => { setAllApps(all.flat()); setAppsLoaded(true); })
    ).catch(() => {});
  }, []);

  function loadJobs() {
    if (jobsLoaded) return;
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
  }
  function refreshJobs() {
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
  }
  function loadApps() {
    if (appsLoaded) return;
    // Load applicants for all my jobs
    api.myJobs().then(jobs => {
      Promise.all(jobs.map(j => api.jobApplicants(j.id).then(apps => apps.map(a => ({ ...a, job_title: j.title }))).catch(() => [])))
        .then(all => { setAllApps(all.flat()); setAppsLoaded(true); });
    }).catch(() => {});
  }
  function loadCandidates() {
    if (candidateList.length) return;
    setCandidateLoading(true);
    api.candidates().then(c => { setCandidateList(c); setCandidateLoading(false); }).catch(() => setCandidateLoading(false));
  }

  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function go(key) {
    setPanel(key); window.scrollTo(0,0);
    if (['job-active','job-draft','job-closed','job-post'].includes(key)) loadJobs();
    if (key === 'job-applications') { loadApps(); }
    if (key === 'cand-search') loadCandidates();
  }
  function handleLogout() { logout(); navigate('/'); }

  const searchResults = searchQ.trim()
    ? NAV.filter(n => n.label.toLowerCase().includes(searchQ.toLowerCase()) || n.section.toLowerCase().includes(searchQ.toLowerCase())).slice(0,8)
    : [];

  // ── SIDEBAR ──────────────────────────────────────────────────────────────
  function Sidebar() {
    function NavItem({ icon, label, id, badge, onClick, active }) {
      return <div onClick={onClick} style={{ padding:'9px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:9, color: active ? '#fff' : 'rgba(255,255,255,.75)', background: active ? C.blue : 'transparent', transition:'.15s' }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,.07)'; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
        <span style={{ width:20, textAlign:'center', fontSize:15, flexShrink:0 }}>{icon}</span>
        <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{label}</span>
        {badge && <span style={{ background:C.red, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{badge}</span>}
        {id && <span style={{ fontSize:10, transition:'.2s', transform: openMenus[id] ? 'rotate(90deg)' : 'none', display:'inline-block' }}>›</span>}
      </div>;
    }
    function Sub({ id, children }) { return openMenus[id] ? <div style={{ background:'rgba(0,0,0,.12)' }}>{children}</div> : null; }
    function SubItem({ label, k }) {
      return <div onClick={()=>go(k)} style={{ padding:'7px 16px 7px 45px', cursor:'pointer', fontSize:12.5, color: panel===k ? C.blue : 'rgba(255,255,255,.52)', fontWeight: panel===k ? 600 : 400, transition:'.15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#fff'; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color = panel===k ? C.blue : 'rgba(255,255,255,.52)'; }}>
        · {label}
      </div>;
    }
    const lbl = s => <div style={{ padding:'16px 16px 4px', fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,.32)', letterSpacing:'.08em', textTransform:'uppercase' }}>{s}</div>;

    return (
      <div style={{ position:'fixed', top:0, left:0, width:SW, height:'100vh', background:C.sidebar, overflowY:'hidden', zIndex:200, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'0 16px', height:TH, minHeight:TH, display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #e0e8f4', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}><img src="/logo.png" alt="Skills n Jobs" style={{ width:34, height:34, objectFit:'contain' }} /></div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14, lineHeight:1.2 }}>SkillsNJobs</div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:9.5 }}>EMPLOYER PORTAL</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {lbl('Main')}
        <NavItem icon="🏠" label="Dashboard" active={panel==='dashboard'} onClick={()=>go('dashboard')} />
        <NavItem icon="🔔" label="Notifications" badge="4" active={panel==='notifications'} onClick={()=>go('notifications')} />

        {lbl('Company Profile')}
        <NavItem icon="🏢" label="Company Profile" id="profile" onClick={()=>toggleMenu('profile')} />
        <Sub id="profile">
          <SubItem label="Company Information" k="profile-info" />
          <SubItem label="Contact & Address" k="profile-contact" />
          <SubItem label="Company Documents" k="profile-docs" />
          <SubItem label="Bank & Billing" k="profile-bank" />
          <SubItem label="HR Contacts" k="profile-hr" />
        </Sub>

        {lbl('Job Management')}
        <NavItem icon="📋" label="Job Postings" id="jobs" onClick={()=>toggleMenu('jobs')} />
        <Sub id="jobs">
          <SubItem label="Post New Job" k="job-post" />
          <SubItem label="Active Jobs" k="job-active" />
          <SubItem label="Draft Jobs" k="job-draft" />
          <SubItem label="Closed Jobs" k="job-closed" />
          <SubItem label="All Applications" k="job-applications" />
        </Sub>

        {lbl('Candidate Management')}
        <NavItem icon="👥" label="Candidates" id="cand" onClick={()=>toggleMenu('cand')} />
        <Sub id="cand">
          <SubItem label="Search Candidates" k="cand-search" />
          <SubItem label="Shortlisted" k="cand-shortlist" />
          <SubItem label="Interviews" k="cand-interview" />
          <SubItem label="Offers & Onboarding" k="cand-offer" />
          <SubItem label="Placement Records" k="cand-placed" />
        </Sub>

        {lbl('Apprenticeship')}
        <NavItem icon="🎓" label="Apprenticeship" id="appren" onClick={()=>toggleMenu('appren')} />
        <Sub id="appren">
          <SubItem label="Register Vacancy" k="appren-register" />
          <SubItem label="Active Apprentices" k="appren-active" />
          <SubItem label="Stipend Management" k="appren-stipend" />
          <SubItem label="Apprenticeship Reports" k="appren-reports" />
        </Sub>

        {lbl('Skill Development')}
        <NavItem icon="📚" label="Skill Development" id="skill" onClick={()=>toggleMenu('skill')} />
        <Sub id="skill">
          <SubItem label="Skill Gap Analysis" k="skill-gap" />
          <SubItem label="Training Partner Connect" k="skill-partners" />
          <SubItem label="Training Requirements" k="skill-requirements" />
          <SubItem label="PMKVY Partnership" k="skill-pmkvy" />
        </Sub>

        {lbl('Govt Schemes')}
        <NavItem icon="🏛️" label="Schemes & Benefits" id="scheme" onClick={()=>toggleMenu('scheme')} />
        <Sub id="scheme">
          <SubItem label="PMKVY" k="scheme-pmkvy" />
          <SubItem label="NAPS / NATS" k="scheme-naps" />
          <SubItem label="DDU-GKY" k="scheme-ddugky" />
          <SubItem label="STAR Scheme" k="scheme-star" />
          <SubItem label="Employer Incentives" k="scheme-incentives" />
        </Sub>

        {lbl('Reports & Analytics')}
        <NavItem icon="📊" label="Reports" id="rep" onClick={()=>toggleMenu('rep')} />
        <Sub id="rep">
          <SubItem label="Hiring Reports" k="rep-hiring" />
          <SubItem label="Placement Analytics" k="rep-placement" />
          <SubItem label="Workforce Reports" k="rep-workforce" />
          <SubItem label="Sector Reports" k="rep-sector" />
        </Sub>

        {lbl('Compliance')}
        <NavItem icon="📜" label="Compliance" id="comp" onClick={()=>toggleMenu('comp')} />
        <Sub id="comp">
          <SubItem label="Labour Law" k="comp-labour" />
          <SubItem label="PF / ESI" k="comp-pfesi" />
          <SubItem label="Contract Labour" k="comp-contract" />
          <SubItem label="Audit Trail" k="comp-audit" />
        </Sub>

        {lbl('Support')}
        <NavItem icon="🎧" label="Helpdesk" active={panel==='helpdesk'} onClick={()=>go('helpdesk')} />
        <NavItem icon="📣" label="Grievance" active={panel==='grievance'} onClick={()=>go('grievance')} />
        <NavItem icon="❓" label="FAQ" active={panel==='faq'} onClick={()=>go('faq')} />

        {lbl('Account')}
        <NavItem icon="⚙️" label="Account Preferences" active={panel==='settings'} onClick={()=>go('settings')} />
        <NavItem icon="🚪" label="Sign Out" active={panel==='signout'} onClick={()=>go('signout')} />
        </div>
      </div>
    );
  }

  // ── TOPBAR ────────────────────────────────────────────────────────────────
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left:SW, right:0, height:TH, background:'#fff', borderBottom:'1px solid #e4e8ef', display:'flex', alignItems:'center', padding:'0 20px', gap:12, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ flex:1, maxWidth:400, position:'relative' }}>
          <input ref={searchRef} value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            onFocus={()=>setSearchOpen(true)} onBlur={()=>setTimeout(()=>setSearchOpen(false),150)}
            placeholder="Search jobs, candidates, reports…"
            style={{ width:'100%', padding:'8px 12px 8px 36px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#f6f8fc' }} />
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', opacity:.4, fontSize:14 }}>🔍</span>
          {searchOpen && searchResults.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1.5px solid #dde2eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:500, maxHeight:260, overflowY:'auto' }}>
              {searchResults.map(r=>(
                <div key={r.key} onMouseDown={()=>{ go(r.key); setSearchQ(''); setSearchOpen(false); }}
                  style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, borderBottom:'1px solid #f0f2f5' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.pBlue}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  {r.label}<div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{r.section}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:'auto' }}>
          <div style={{ cursor:'pointer', padding:6, position:'relative', fontSize:18 }} onClick={()=>go('notifications')}>
            🔔
          </div>
          <div style={{ width:38, height:38, borderRadius:'50%', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>
            {(user?.org_name || 'EM').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{ lineHeight:1.25 }}>
            <div style={{ fontWeight:700, fontSize:13.5 }}>{user?.org_name || '—'}</div>
            <div style={{ fontSize:11.5, color:'#64748b' }}>ID: EMP-{String(user?.id||'').padStart(6,'0')}</div>
          </div>
          <button onClick={handleLogout}
            style={{ marginLeft:8, padding:'7px 16px', borderRadius:8, border:'none', background:C.blue, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            ⏻ Sign Out
          </button>
        </div>
      </div>
    );
  }

  // ── PANELS ────────────────────────────────────────────────────────────────
  function PanelDashboard() {
    return <>
      <Alert icon="⚡" type="warn"><strong>Action required:</strong> 3 job applications are awaiting your review. <strong>Review Now →</strong></Alert>
      <SectionHead title={`Welcome, ${user?.org_name || ''}! 💼`} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val={dbStats.myOpenJobs ?? '—'} label="Active Job Postings" sub="My open roles" color={C.blue} />
        <KpiCard val={dbStats.myApplicants ?? '—'} label="Total Applications" sub="All my jobs" color={C.teal} />
        <KpiCard val={dbStats.myShortlisted ?? '—'} label="Candidates Shortlisted" sub="Pending interview" color={C.green} />
        <KpiCard val={dbStats.myHired ?? '—'} label="Total Hired" sub="All time" color={C.gold} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[['📋','Post a Job','job-post'],['🔍','Search Candidates','cand-search'],['🗓️','Schedule Interview','cand-interview'],['🎓','Register Apprentice','appren-register']].map(([icon,lbl,k])=>(
          <div key={k} onClick={()=>go(k)} style={{ background:'#fff', border:'1.5px solid #e8ecf3', borderRadius:12, padding:'18px 10px', textAlign:'center', cursor:'pointer' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.background=C.pBlue; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8ecf3'; e.currentTarget.style.background='#fff'; }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📊 Hiring Funnel — All Time</CardTitle>
          {(() => {
            const total = allApps.length;
            const screened = allApps.filter(a => a.status !== 'applied').length;
            const shortlisted = allApps.filter(a => ['shortlisted','interview','hired'].includes(a.status)).length;
            const interview = allApps.filter(a => ['interview','hired'].includes(a.status)).length;
            const hired = allApps.filter(a => a.status === 'hired').length;
            const pct = n => total ? Math.round(n / total * 100) : 0;
            return <>
              <StatRow n={total}      label="Applications Received" pct={100}        color={C.blue} />
              <StatRow n={screened}   label="Screened"              pct={pct(screened)}   color={C.teal} />
              <StatRow n={shortlisted} label="Shortlisted"          pct={pct(shortlisted)} color={C.green} />
              <StatRow n={interview}  label="Interview Scheduled"   pct={pct(interview)}  color={C.gold} />
              <StatRow n={hired}      label="Offers / Hired"        pct={pct(hired)}      color={C.purple} />
            </>;
          })()}
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🏆 Top Active Jobs</CardTitle>
          {myJobs.filter(j => j.status==='open').length === 0
            ? <div style={{ color:'#888', padding:'20px 0' }}>No active jobs. <span style={{ color:C.blue, cursor:'pointer' }} onClick={() => go('job-post')}>Post one →</span></div>
            : <Table head={['Job Title','Applications','Status']} rows={myJobs.filter(j=>j.status==='open').slice(0,5).map(j => [
                j.title,
                String(allApps.filter(a=>a.job_id===j.id||a.job_title===j.title).length),
                <Badge color="green">Active</Badge>
              ])} />
          }
        </Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🔔 Recent Activity</CardTitle>
          {allApps.length === 0
            ? <div style={{ color:'#888', padding:'20px 0', fontSize:13 }}>No recent activity. Post a job to get started.</div>
            : allApps.slice(0,5).map((a,i) => (
                <TlItem key={i} dot={C.blue}
                  title={`${a.candidate_name || `Candidate #${a.candidate_id}`} applied for ${a.job_title || 'a role'}`}
                  meta={a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-IN') : new Date(a.created_at).toLocaleDateString('en-IN')} />
              ))
          }
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>👥 Recent Applications</CardTitle>
          {allApps.length === 0
            ? <div style={{ color:'#888', padding:'20px 0', fontSize:13 }}>No applications yet.</div>
            : <Table head={['Candidate','Role','Status']} rows={allApps.slice(0,5).map(a => [
                a.candidate_name || `Candidate #${a.candidate_id}`,
                a.job_title || '—',
                <Badge color={{ applied:'blue', shortlisted:'green', interview:'teal', hired:'purple', rejected:'red' }[a.status] || 'blue'}>{a.status}</Badge>
              ])} />
          }
        </Card>
      </div>
    </>;
  }

  function PanelNotifications() {
    const pending = allApps.filter(a => a.status === 'pending');
    return <>
      <Bc parts={['Notifications']} />
      <SectionHead title="Notifications 🔔" />
      <Card>
        {pending.length > 0 && <TlItem dot={C.gold} title={`⚠️ ${pending.length} application${pending.length>1?'s':''} pending review`} meta="Action required" />}
        {myJobs.filter(j=>j.status==='open').slice(0,3).map(j=>(
          <TlItem key={j.id} dot={C.blue} title={`📋 Job "${j.title}" is active`} meta={j.location||'—'} />
        ))}
        {pending.length === 0 && myJobs.length === 0 && (
          <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No notifications</div>
        )}
      </Card>
    </>;
  }

  function PanelProfileInfo() {
    const set = k => e => setProfileInfo(f => ({ ...f, [k]: e.target.value }));
    const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' };
    async function saveInfo() {
      if (profileInfo.pan) {
        const pan = profileInfo.pan.toUpperCase().trim();
        if (!PAN_RE.test(pan)) { setPanError('Invalid PAN — format: ABCDE1234F (10 chars)'); return; }
      }
      if (profileInfo.cin) {
        const cin = profileInfo.cin.toUpperCase().trim();
        if (!CIN_RE.test(cin)) { setCinError('Invalid CIN — format: U72200KA2015PTC082341 (21 chars)'); return; }
      }
      if (profileInfo.gstin) {
        const gst = profileInfo.gstin.toUpperCase().trim();
        if (!GST_RE.test(gst)) { setGstError('Invalid GSTIN — format: 29AAACT1234A1ZK (15 chars)'); return; }
      }
      if (profileInfo.tan) {
        const tan = profileInfo.tan.toUpperCase().trim();
        if (!/^[A-Z]{4}\d{5}[A-Z]$/.test(tan)) { setTanError('Invalid TAN — format: PDES03028F (10 chars)'); return; }
      }
      if (profileInfo.website) {
        const wErr = fieldValidate('website', profileInfo.website);
        if (wErr) { setWebsiteError(wErr); return; }
      }
      setPanError(''); setCinError(''); setGstError(''); setTanError(''); setWebsiteError('');
      setProfileSaving(true); setProfileMsg('');
      try {
        await api.updateMe({
          org_name: profileInfo.org_name || null,
          pan: profileInfo.pan || null,
          gstin: profileInfo.gstin || null,
          tan: profileInfo.tan || null,
          cin: profileInfo.cin || null,
          website: profileInfo.website || null,
          bio: profileInfo.bio || null,
        });
        setProfileMsg('✅ Company information saved.');
      } catch(e) { setProfileMsg('❌ ' + e.message); }
      finally { setProfileSaving(false); }
    }
    return <>
      <Bc parts={['Company Profile','Company Information']} />
      <SectionHead title="Company Information 🏢" />
      <Card>
        <CardTitle>🏛️ Basic Details</CardTitle>
        <Grid>
          <Field label="Company Name"><input value={profileInfo.org_name} onChange={set('org_name')} placeholder="Company name" style={inp} /></Field>
          <Field label="CIN Number">
            <div style={{ width:'100%' }}>
              <input value={profileInfo.cin}
                onChange={e => { setProfileInfo(f => ({ ...f, cin: e.target.value.toUpperCase() })); setCinError(''); }}
                onBlur={() => { if (profileInfo.cin) setCinError(CIN_RE.test(profileInfo.cin.toUpperCase()) ? '' : 'Invalid CIN — format: U72200KA2015PTC082341 (21 chars)'); }}
                placeholder="e.g. U72200KA2015PTC082341"
                style={{ ...inp, borderColor: cinError ? '#C0392B' : '#dde2eb', background: cinError ? '#FEF2F2' : '#fafbfc' }} />
              {cinError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {cinError}</div>}
            </div>
          </Field>
        </Grid>
        <Grid>
          <Field label="Website">
            <div style={{ width:'100%' }}>
              <input value={profileInfo.website}
                onChange={e => { setProfileInfo(f => ({ ...f, website: e.target.value })); setWebsiteError(''); }}
                onBlur={() => { if (profileInfo.website) setWebsiteError(fieldValidate('website', profileInfo.website)); }}
                placeholder="https://example.com"
                style={{ ...inp, borderColor: websiteError ? '#C0392B' : '#dde2eb', background: websiteError ? '#FEF2F2' : '#fafbfc' }} />
              {websiteError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {websiteError}</div>}
            </div>
          </Field>
        </Grid>
        <Grid>
          <Field label="PAN Number">
            <div style={{ width:'100%' }}>
              <input value={profileInfo.pan}
                onChange={e => { setProfileInfo(f => ({ ...f, pan: e.target.value.toUpperCase().slice(0,10) })); setPanError(''); }}
                onBlur={() => { if (profileInfo.pan) setPanError(PAN_RE.test(profileInfo.pan) ? '' : 'Invalid PAN — format: ABCDE1234F (10 chars)'); }}
                placeholder="e.g. AAACT1234A" maxLength={10}
                style={{ ...inp, borderColor: panError ? '#C0392B' : '#dde2eb', background: panError ? '#FEF2F2' : '#fafbfc' }} />
              {panError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {panError}</div>}
            </div>
          </Field>
          <Field label="GSTIN">
            <div style={{ width:'100%' }}>
              <input value={profileInfo.gstin}
                onChange={e => { setProfileInfo(f => ({ ...f, gstin: e.target.value.toUpperCase() })); setGstError(''); }}
                onBlur={() => { if (profileInfo.gstin) setGstError(GST_RE.test(profileInfo.gstin.toUpperCase()) ? '' : 'Invalid GSTIN — format: 29AAACT1234A1ZK (15 chars)'); }}
                placeholder="e.g. 29AAACT1234A1ZK"
                style={{ ...inp, borderColor: gstError ? '#C0392B' : '#dde2eb', background: gstError ? '#FEF2F2' : '#fafbfc' }} />
              {gstError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {gstError}</div>}
            </div>
          </Field>
        </Grid>
        <Grid>
          <Field label="TAN">
            <div style={{ width:'100%' }}>
              <input value={profileInfo.tan}
                onChange={e => { setProfileInfo(f => ({ ...f, tan: e.target.value.toUpperCase() })); setTanError(''); }}
                onBlur={() => { if (profileInfo.tan) setTanError(/^[A-Z]{4}\d{5}[A-Z]$/.test(profileInfo.tan.toUpperCase()) ? '' : 'Invalid TAN — format: PDES03028F (10 chars)'); }}
                placeholder="e.g. PDES03028F"
                style={{ ...inp, borderColor: tanError ? '#C0392B' : '#dde2eb', background: tanError ? '#FEF2F2' : '#fafbfc' }} />
              {tanError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {tanError}</div>}
            </div>
          </Field>
        </Grid>
        <Field label="Company Description">
          <textarea rows={3} value={profileInfo.bio} onChange={set('bio')} placeholder="Brief about your company…"
            style={{ ...inp, resize:'vertical' }} />
        </Field>
        {profileMsg && <div style={{ marginBottom:10, fontSize:13, color: profileMsg.startsWith('✅') ? C.green : C.red }}>{profileMsg}</div>}
        <div style={{ textAlign:'right' }}><Btn onClick={saveInfo}>{profileSaving ? 'Saving…' : '💾 Save Changes'}</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileContact() {
    const set = k => e => setProfileInfo(f => ({ ...f, [k]: e.target.value }));
    const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' };
    const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Delhi','Dadra & Nagar Haveli','Daman & Diu','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'];
    async function saveContact() {
      if (profileInfo.phone) {
        const digits = profileInfo.phone.replace(/\D/g, '');
        if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
          setPhoneError('Must be a 10-digit number starting with 6–9'); return;
        }
      }
      setPhoneError('');
      if (profileInfo.email) {
        const emailPat = /^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailPat.test(profileInfo.email)) { setEmailError('Invalid email address'); return; }
      }
      setEmailError('');
      setProfileSaving(true); setProfileMsg('');
      try {
        await api.updateMe({
          phone: profileInfo.phone ? '+91' + profileInfo.phone : null,
          email: profileInfo.email || null,
          location: profileInfo.city || profileInfo.location || null,
          spoc_name: profileInfo.spoc_name || null,
          address_line1: profileInfo.address_line1 || null,
          address_line2: profileInfo.address_line2 || null,
          city: profileInfo.city || null,
          state_name: profileInfo.state_name || null,
          pincode: profileInfo.pincode || null,
        });
        setProfileMsg('✅ Contact details saved.');
      } catch(e) { setProfileMsg('❌ ' + e.message); }
      finally { setProfileSaving(false); }
    }
    return <>
      <Bc parts={['Company Profile','Contact & Address']} />
      <SectionHead title="Contact & Address 📍" />
      <Card>
        <CardTitle>📞 Contact Details</CardTitle>
        <Grid>
          <Field label="SPOC Name">
            <input value={profileInfo.spoc_name} onChange={set('spoc_name')} placeholder="Single Point of Contact name" style={inp} />
          </Field>
          <Field label="Phone / Helpline">
            <div style={{ width:'100%' }}>
              <input value={profileInfo.phone}
                onChange={e => { setProfileInfo(f => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) })); setPhoneError(''); }}
                onBlur={() => { const v = profileInfo.phone; if (v) setPhoneError(/^[6-9]\d{9}$/.test(v) ? '' : 'Must be a 10-digit number starting with 6–9'); }}
                placeholder="e.g. 9876543210" maxLength={10}
                style={{ ...inp, borderColor: phoneError ? '#C0392B' : '#dde2eb', background: phoneError ? '#FEF2F2' : '#fafbfc' }} />
              {phoneError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {phoneError}</div>}
            </div>
          </Field>
          <Field label="Email Address">
            <div style={{ width:'100%' }}>
              <input value={profileInfo.email}
                onChange={e => { setProfileInfo(f => ({ ...f, email: e.target.value })); setEmailError(''); }}
                onBlur={() => { const v = profileInfo.email; if (v) { const ok = /^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/.test(v); setEmailError(ok ? '' : 'Invalid email address'); } }}
                placeholder="e.g. contact@company.com"
                style={{ ...inp, borderColor: emailError ? '#C0392B' : '#dde2eb', background: emailError ? '#FEF2F2' : '#fafbfc' }} />
              {emailError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {emailError}</div>}
            </div>
          </Field>
        </Grid>
        <CardTitle style={{ marginTop:16 }}>🏢 Address</CardTitle>
        <Field label="Address Line 1">
          <input value={profileInfo.address_line1} onChange={set('address_line1')} placeholder="House / Flat No., Street, Area" style={inp} />
        </Field>
        <Field label="Address Line 2">
          <input value={profileInfo.address_line2} onChange={set('address_line2')} placeholder="Landmark, Colony (optional)" style={inp} />
        </Field>
        <Grid>
          <Field label="City / Town">
            <input value={profileInfo.city} onChange={set('city')} placeholder="City" style={inp} />
          </Field>
          <Field label="State">
            <select value={profileInfo.state_name} onChange={set('state_name')} style={inp}>
              <option value="">Select state</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </Grid>
        <Field label="PIN Code">
          <input value={profileInfo.pincode} onChange={e => setProfileInfo(f => ({ ...f, pincode: e.target.value.replace(/\D/g,'').slice(0,6) }))} placeholder="6-digit PIN" maxLength={6} style={inp} />
        </Field>
        {profileMsg && <div style={{ marginBottom:10, fontSize:13, color: profileMsg.startsWith('✅') ? C.green : C.red }}>{profileMsg}</div>}
        <div style={{ textAlign:'right' }}><Btn onClick={saveContact}>{profileSaving ? 'Saving…' : '💾 Save Changes'}</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileDocs() {
    const docTypes = ['GST Certificate','PAN Card','Incorporation Certificate','Trade License','MSME Certificate','ISO Certificate'];
    const docs = empDocs; const setDocs = setEmpDocs;
    function handleUpload(type, file) {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB'); return; }
      const entry = { type, name: file.name, size: Math.round(file.size/1024) + ' KB', uploaded: new Date().toLocaleDateString('en-IN') };
      const updated = [...docs.filter(d => d.type !== type), entry];
      setDocs(updated);
      localStorage.setItem('snj_emp_docs', JSON.stringify(updated));
    }
    return <>
      <Bc parts={['Company Profile','Company Documents']} />
      <SectionHead title="Company Documents 📄" />
      <Card>
        <Alert icon="ℹ️" type="info">Upload clear scanned copies. Accepted: PDF, JPG, PNG. Max 2 MB per file.</Alert>
        {docTypes.map(type => {
          const uploaded = docs.find(d => d.type === type);
          return (
            <div key={type} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', border:'1px solid #dde2eb', borderRadius:9, marginBottom:10, background:'#fff' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:'#0D2137' }}>{type}</div>
                {uploaded && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{uploaded.name} · {uploaded.size} · {uploaded.uploaded}</div>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {uploaded
                  ? <Badge color="green">Uploaded</Badge>
                  : <span style={{ fontSize:11, color:'#94a3b8' }}>No file</span>}
                <label style={{ padding:'6px 14px', borderRadius:7, background:'#1E5FBF', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  📎 {uploaded ? 'Replace' : 'Upload'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleUpload(type, e.target.files[0])} />
                </label>
              </div>
            </div>
          );
        })}
      </Card>
    </>;
  }

  function PanelProfileBank() {
    const set = k => e => setBank(b => ({ ...b, [k]: e.target.value }));
    return <>
      <Bc parts={['Company Profile','Bank & Billing']} />
      <SectionHead title="Bank & Billing 🏦" />
      <Card>
        <Grid>
          <Field label="Account Holder Name">
            <Inp value={bank.bank_account_name} onChange={set('bank_account_name')} placeholder="As per bank records" />
          </Field>
          <Field label="Account Number">
            <Inp value={bank.bank_account_number} onChange={e => setBank(b=>({...b, bank_account_number: e.target.value.replace(/\D/g,'')}))} placeholder="Account number" />
          </Field>
        </Grid>
        <Field label="IFSC Code">
          <Inp value={bank.bank_ifsc} onChange={e => setBank(b=>({...b, bank_ifsc: e.target.value.toUpperCase()}))} placeholder="e.g. ICIC0001234" />
        </Field>
        <Alert icon="⚠️" type="warn">Bank details require OTP verification and admin approval before changes take effect.</Alert>
        {bankMsg && <div style={{ fontSize:12.5, color: bankMsg.includes('fail') ? '#dc2626':'#16a34a', marginTop:4 }}>{bankMsg}</div>}
        <div style={{ textAlign:'right', marginTop:10 }}><Btn onClick={saveBank} disabled={bankSaving}>{bankSaving ? 'Saving…' : '💾 Save & Verify'}</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileHr() {
    const sh = k => e => setHrForm(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['Company Profile','HR Contacts']} />
      <SectionHead title="HR Contacts 👤" />
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <CardTitle>👤 HR Team</CardTitle>
          <Btn onClick={() => { setShowHrForm(v => !v); setHrMsg(''); }}>+ Add HR Contact</Btn>
        </div>
        {showHrForm && (
          <div style={{ background:'#f8fafc', border:'1px solid #dde2eb', borderRadius:10, padding:16, marginBottom:16 }}>
            {hrMsg && <Alert type="red">{hrMsg}</Alert>}
            <Grid>
              <Field label="Name *"><Inp value={hrForm.name} onChange={sh('name')} placeholder="Full name" /></Field>
              <Field label="Designation"><Inp value={hrForm.designation} onChange={sh('designation')} placeholder="e.g. HR Manager" /></Field>
            </Grid>
            <Grid>
              <Field label="Email"><Inp value={hrForm.email} onChange={sh('email')} placeholder="email@company.com" /></Field>
              <Field label="Phone"><Inp value={hrForm.phone} onChange={sh('phone')} placeholder="10-digit mobile" /></Field>
            </Grid>
            <div style={{ textAlign:'right', display:'flex', gap:10, justifyContent:'flex-end' }}>
              <Btn outline onClick={() => setShowHrForm(false)}>Cancel</Btn>
              <Btn green onClick={saveHrContact}>Save Contact</Btn>
            </div>
          </div>
        )}
        {hrContacts.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'24px 0', textAlign:'center' }}>No HR contacts added yet.</div>
          : <Table head={['Name','Designation','Email','Phone','Action']} rows={hrContacts.map(c => [
              c.name, c.designation || '—', c.email || '—', c.phone || '—',
              <Btn sm danger onClick={() => removeHrContact(c.id)}>Remove</Btn>,
            ])} />}
      </Card>
    </>;
  }

  function PanelJobPost() {
    const f = jobForm;
    async function handlePost(status) {
      if (!f.title.trim()) { setJobMsg('Job title is required.'); return; }
      setJobSaving(true); setJobMsg('');
      try {
        const skills = f.required_skills.split(',').map(s => s.trim()).filter(Boolean);
        await api.createJob({ title: f.title, description: f.description, required_skills: skills, location: f.location, job_type: f.job_type, salary_min: f.salary_min ? Number(f.salary_min) : null, salary_max: f.salary_max ? Number(f.salary_max) : null, status });
        setJobMsg(status === 'open' ? '✅ Job published successfully!' : '✅ Saved as draft.');
        setJobForm({ title:'', description:'', required_skills:'', location:'', job_type:'Full-time', salary_min:'', salary_max:'' });
        refreshJobs();
      } catch(e) { setJobMsg('❌ ' + e.message); }
      setJobSaving(false);
    }
    const set = k => e => setJobForm(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['Job Management','Post New Job']} />
      <SectionHead title="Post New Job 📋" />
      {jobMsg && <Alert type={jobMsg.startsWith('✅') ? 'info' : 'red'}>{jobMsg}</Alert>}
      <Card>
        <CardTitle>📝 Job Details</CardTitle>
        <Field label="Job Title *"><input value={f.title} onChange={set('title')} placeholder="e.g. Senior Frontend Developer" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <Grid cols={3}><Field label="Employment Type"><select value={f.job_type} onChange={set('job_type')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>{['Full-time','Part-time','Contract','Internship','Apprenticeship'].map(o=><option key={o}>{o}</option>)}</select></Field><Field label="Location"><input value={f.location} onChange={set('location')} placeholder="e.g. Bengaluru, Remote" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field><Field label="Required Skills"><input value={f.required_skills} onChange={set('required_skills')} placeholder="e.g. React, Node.js, SQL (comma separated)" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field></Grid>
        <Field label="Job Description"><textarea value={f.description} onChange={set('description')} rows={5} placeholder="Describe roles, responsibilities…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
      </Card>
      <Card>
        <CardTitle>💰 Compensation</CardTitle>
        <Grid cols={2}><Field label="Min Salary (₹/year)"><input value={f.salary_min} onChange={set('salary_min')} type="number" placeholder="500000" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field><Field label="Max Salary (₹/year)"><input value={f.salary_max} onChange={set('salary_max')} type="number" placeholder="800000" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field></Grid>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn outline onClick={() => handlePost('draft')} disabled={jobSaving}>Save Draft</Btn>
          <Btn green onClick={() => handlePost('open')} disabled={jobSaving}>🚀 Publish Job</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelJobActive() {
    const active = myJobs.filter(j => j.status === 'open');
    return <>
      <Bc parts={['Job Management','Active Jobs']} />
      <SectionHead title="Active Jobs 🚀" />
      <Card>
        {!jobsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         active.length === 0 ? <div style={{ color:'#888', padding:16 }}>No active jobs. <span style={{ color:C.blue, cursor:'pointer' }} onClick={() => go('job-post')}>Post one now →</span></div> :
        <Table head={['Job Title','Location','Type','Salary','Status','Action']} rows={active.map(j => [
          j.title, j.location || '—', j.job_type || '—',
          j.salary_min ? `₹${(j.salary_min/100000).toFixed(1)}–${(j.salary_max/100000).toFixed(1)} LPA` : '—',
          <Badge color="green">Active</Badge>,
          <Btn sm outline onClick={() => { api.updateJob(j.id, { status:'closed' }).then(refreshJobs); }}>Close</Btn>
        ])} />}
        <div style={{ marginTop:14 }}><Btn onClick={() => go('job-post')}>+ Post New Job</Btn></div>
      </Card>
    </>;
  }

  function PanelJobDraft() {
    const drafts = myJobs.filter(j => j.status === 'draft');
    return <>
      <Bc parts={['Job Management','Draft Jobs']} />
      <SectionHead title="Draft Jobs 📝" />
      <Card>
        {!jobsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         drafts.length === 0 ? <div style={{ color:'#888', padding:16 }}>No draft jobs.</div> :
        <Table head={['Job Title','Location','Type','Action']} rows={drafts.map(j => [
          j.title, j.location || '—', j.job_type || '—',
          <><Btn sm outline onClick={() => api.deleteJob(j.id).then(refreshJobs)}>Delete</Btn>{' '}
            <Btn sm green onClick={() => api.updateJob(j.id, { status:'open' }).then(refreshJobs)}>Publish</Btn></>
        ])} />}
        <div style={{ marginTop:14 }}><Btn onClick={() => go('job-post')}>+ Create New Draft</Btn></div>
      </Card>
    </>;
  }

  function PanelJobClosed() {
    const closed = myJobs.filter(j => j.status === 'closed');
    return <>
      <Bc parts={['Job Management','Closed Jobs']} />
      <SectionHead title="Closed Jobs ✅" />
      <Card>
        {!jobsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         closed.length === 0 ? <div style={{ color:'#888', padding:16 }}>No closed jobs.</div> :
        <Table head={['Job Title','Location','Type','Action']} rows={closed.map(j => [
          j.title, j.location || '—', j.job_type || '—',
          <Btn sm outline onClick={() => api.updateJob(j.id, { status:'open' }).then(refreshJobs)}>Repost</Btn>
        ])} />}
      </Card>
    </>;
  }

  function PanelJobApplications() {
    const total = allApps.length;
    const shortlisted = allApps.filter(a => a.status === 'shortlisted').length;
    const hired = allApps.filter(a => a.status === 'hired').length;
    const statusColor = { applied:'blue', shortlisted:'green', interview:'teal', hired:'purple', rejected:'red' };
    return <>
      <Bc parts={['Job Management','All Applications']} />
      <SectionHead title="All Applications 📬" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val={total} label="Total Applications" sub="Across all jobs" color={C.blue} />
        <KpiCard val={shortlisted} label="Shortlisted" sub={`${total ? Math.round(shortlisted/total*100) : 0}% of total`} color={C.green} />
        <KpiCard val={hired} label="Hired" sub="Offer accepted" color={C.teal} />
        <KpiCard val={allApps.filter(a=>a.status==='applied').length} label="New / Pending" sub="Awaiting review" color={C.gold} />
      </div>
      <Card>
        {!appsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         allApps.length === 0 ? <div style={{ color:'#888', padding:16 }}>No applications yet.</div> :
        <Table head={['Candidate','Job Applied','Status','Action']} rows={allApps.slice(0,50).map(a => [
          a.candidate_name || `Candidate #${a.candidate_id}`,
          a.job_title || '—',
          <Badge color={statusColor[a.status] || 'blue'}>{a.status}</Badge>,
          <select style={{ fontSize:12, padding:'3px 6px', borderRadius:6, border:'1px solid #dde2eb' }}
            value={a.status}
            onChange={e => api.updateApplicationStatus(a.id, e.target.value).then(loadApps)}>
            {['applied','shortlisted','interview','hired','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ])} />}
      </Card>
    </>;
  }

  function PanelCandSearch() {
    const q = candSearchQ; const setQ = setCandSearchQ;
    const filtered = q.trim() ? candidateList.filter(c =>
      (c.name||'').toLowerCase().includes(q.toLowerCase()) ||
      (c.skills||'').toLowerCase().includes(q.toLowerCase()) ||
      (c.location||'').toLowerCase().includes(q.toLowerCase())
    ) : candidateList;
    return <>
      <Bc parts={['Candidates','Search Candidates']} />
      <SectionHead title="Search Candidates 🔍" />
      <Card>
        <CardTitle>🔍 Search</CardTitle>
        <Field label="Name / Skill / Location"><input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. React, Bengaluru, Priya" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
      </Card>
      {candidateLoading && <div style={{ color:'#888', padding:16 }}>Loading candidates…</div>}
      {filtered.slice(0,20).map(c => {
        const skills = (() => { try { return JSON.parse(c.skills||'[]'); } catch { return []; } })();
        const initials = (c.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        return CandCard({ key: c.id, initials, name: c.name, meta: [c.location, c.education, c.experience_years ? `${c.experience_years} yr exp` : 'Fresher'].filter(Boolean).join(' · '), skills: skills.slice(0,4), matchPct: null, matchColor:'blue' });
      })}
      {!candidateLoading && filtered.length === 0 && <div style={{ color:'#888', padding:16 }}>No candidates found.</div>}
    </>;
  }

  function PanelCandShortlist() {
    const shortlisted = allApps.filter(a => ['shortlisted','interview'].includes(a.status));
    return <>
      <Bc parts={['Candidates','Shortlisted']} />
      <SectionHead title="Shortlisted Candidates 📌" />
      <Card>
        {!appsLoaded
          ? <div style={{ color:'#888', padding:16 }}>Loading…</div>
          : shortlisted.length === 0
            ? <div style={{ color:'#888', padding:'20px 0', textAlign:'center', fontSize:13 }}>No shortlisted candidates yet. Review applications and shortlist candidates.</div>
            : <Table head={['Candidate','Job Applied','Status','Action']} rows={shortlisted.map(a => [
                a.candidate_name || `Candidate #${a.candidate_id}`,
                a.job_title || '—',
                <Badge color={a.status==='interview' ? 'teal' : 'green'}>{a.status}</Badge>,
                <select style={{ fontSize:12, padding:'3px 6px', borderRadius:6, border:'1px solid #dde2eb' }}
                  value={a.status}
                  onChange={e => api.updateApplicationStatus(a.id, e.target.value).then(() => api.myJobs().then(jobs =>
                    Promise.all(jobs.map(j => api.jobApplicants(j.id).then(apps => apps.map(ap => ({ ...ap, job_title: j.title }))).catch(() => [])))
                      .then(all => setAllApps(all.flat()))
                  ))}>
                  {['shortlisted','interview','hired','rejected'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              ])} />
        }
      </Card>
    </>;
  }

  function PanelCandInterview() {
    const si = k => e => setInterview(v => ({ ...v, [k]: e.target.value }));
    return <>
      <Bc parts={['Candidates','Interviews']} />
      <SectionHead title="Interview Management 🗓️" />
      <Card>
        <CardTitle>📅 Schedule New Interview</CardTitle>
        {interviewMsg && <Alert type={interviewMsg.startsWith('✅') ? 'info' : 'red'}>{interviewMsg}</Alert>}
        <Grid cols={3}>
          <Field label="Candidate Name *"><Inp value={interview.candidate_name} onChange={si('candidate_name')} placeholder="e.g. Rahul Verma" /></Field>
          <Field label="Job Role"><Inp value={interview.job_role} onChange={si('job_role')} placeholder="e.g. React Developer" /></Field>
          <Field label="Interview Round"><Sel value={interview.round} onChange={si('round')} options={['Technical Round 1','Technical Round 2','HR Round','Final Round']} /></Field>
        </Grid>
        <Grid cols={3}>
          <Field label="Date *"><Inp type="date" value={interview.date} onChange={si('date')} /></Field>
          <Field label="Time *"><Inp type="time" value={interview.time} onChange={si('time')} /></Field>
          <Field label="Mode"><Sel value={interview.mode} onChange={si('mode')} options={['Video Call','In-Person','Telephonic']} /></Field>
        </Grid>
        <Grid>
          <Field label="Interviewers"><Inp value={interview.interviewers} onChange={si('interviewers')} placeholder="e.g. Kavitha Reddy, Arjun Nair" /></Field>
          <Field label="Meeting Link / Venue"><Inp value={interview.link} onChange={si('link')} placeholder="e.g. https://meet.google.com/xyz-abc" /></Field>
        </Grid>
        <div style={{ textAlign:'right' }}>
          <Btn green onClick={scheduleInterview} style={{ opacity: interviewSaving ? .7 : 1 }}>
            {interviewSaving ? 'Scheduling…' : '📅 Schedule Interview'}
          </Btn>
        </div>
      </Card>
      <Card>
        <CardTitle>📋 Scheduled Interviews</CardTitle>
        {scheduledInterviews.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No interviews scheduled yet.</div>
          : <Table head={['Candidate','Role','Round','Date','Time','Mode']} rows={scheduledInterviews.map(i => [
              i.candidate_name, i.job_role || '—', i.round, i.date, i.time, i.mode,
            ])} />}
      </Card>
    </>;
  }

  function PanelCandOffer() {
    const so = k => e => setOffer(v => ({ ...v, [k]: e.target.value }));
    return <>
      <Bc parts={['Candidates','Offers & Onboarding']} />
      <SectionHead title="Offers & Onboarding 📨" />
      <Card>
        <CardTitle>📝 Generate Offer Letter</CardTitle>
        {offerMsg && <Alert type={offerMsg.startsWith('✅') ? 'info' : 'red'}>{offerMsg}</Alert>}
        <Grid>
          <Field label="Candidate Name *"><Inp value={offer.candidate_name} onChange={so('candidate_name')} placeholder="e.g. Priya Verma" /></Field>
          <Field label="Job Role *"><Inp value={offer.job_role} onChange={so('job_role')} placeholder="e.g. Senior React Developer" /></Field>
        </Grid>
        <Grid cols={3}>
          <Field label="CTC (₹/year) *"><Inp value={offer.ctc} onChange={so('ctc')} placeholder="e.g. 750000" /></Field>
          <Field label="Joining Date"><Inp type="date" value={offer.joining_date} onChange={so('joining_date')} /></Field>
          <Field label="Probation Period"><Sel value={offer.probation} onChange={so('probation')} options={['No Probation','1 Month','3 Months','6 Months']} /></Field>
        </Grid>
        <Field label="Special Terms"><Inp value={offer.special_terms} onChange={so('special_terms')} placeholder="e.g. Sign-on bonus of ₹50,000, WFH 2 days/week" /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn teal onClick={() => generateOffer(false)} style={{ opacity: offerSaving ? .7 : 1 }}>Generate Letter</Btn>
          <Btn green onClick={() => generateOffer(true)} style={{ opacity: offerSaving ? .7 : 1 }}>Send via Email</Btn>
        </div>
      </Card>
      <Card>
        <CardTitle>📋 Offer Tracker</CardTitle>
        {sentOffers.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No offers generated yet.</div>
          : <Table head={['Candidate','Role','CTC','Joining Date','Status']} rows={sentOffers.map(o => [
              o.candidate_name, o.job_role,
              o.ctc ? `₹${Number(o.ctc).toLocaleString('en-IN')}` : '—',
              o.joining_date || '—',
              <Badge color={o.status === 'Sent' ? 'green' : 'blue'}>{o.status}</Badge>,
            ])} />}
      </Card>
    </>;
  }

  function PanelCandPlaced() {
    const hired = allApps.filter(a => a.status === 'hired');
    return <>
      <Bc parts={['Candidates','Placement Records']} />
      <SectionHead title="Placement Records 🏆" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val={hired.length} label="Total Hires" sub="All time" color={C.green} />
        <KpiCard val={allApps.filter(a=>a.status==='shortlisted').length} label="Shortlisted" sub="Pending interview" color={C.blue} />
        <KpiCard val={allApps.filter(a=>a.status==='interview').length} label="In Interview" sub="Active pipeline" color={C.teal} />
      </div>
      <Card>
        {!appsLoaded
          ? <div style={{ color:'#888', padding:16 }}>Loading…</div>
          : hired.length === 0
            ? <div style={{ color:'#888', padding:'20px 0', textAlign:'center', fontSize:13 }}>No hires recorded yet. Update application status to "hired" to track placements.</div>
            : <Table head={['Candidate','Role','Hired On','Status']} rows={hired.map(a => [
                a.candidate_name || `Candidate #${a.candidate_id}`,
                a.job_title || '—',
                a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-IN') : new Date(a.created_at).toLocaleDateString('en-IN'),
                <Badge color="green">Hired</Badge>
              ])} />
        }
      </Card>
    </>;
  }

  function PanelApprenRegister() {
    return <>
      <Bc parts={['Apprenticeship','Register Vacancy']} />
      <SectionHead title="Register Apprenticeship Vacancy 🎓" />
      <Alert icon="ℹ️" type="info">Register on the <strong>NAPS portal</strong> to get 25% of stipend (up to ₹1,500/month) reimbursed by Government of India for each apprentice.</Alert>
      <Card>
        <Grid cols={3}><Field label="Trade / Designation"><Sel options={['Mechanic (Motor Vehicle)','Electrician','Welder','Data Entry Operator','Software Testing','Customer Support']} /></Field><Field label="Sector Skill Council"><Sel options={['AutoSector','Electronics SSC','IT-ITeS SSC','BFSI SSC','Healthcare SSC']} /></Field><Field label="Duration (Months)"><Inp defaultValue="12" /></Field></Grid>
        <Grid cols={3}><Field label="Number of Seats"><Inp defaultValue="15" /></Field><Field label="Location"><Inp defaultValue="Bengaluru" /></Field><Field label="Monthly Stipend (₹)"><Inp defaultValue="7000" /></Field></Grid>
        <Grid><Field label="Start Date"><Inp type="date" /></Field><Field label="Education Eligibility"><Sel options={['10th Pass','12th Pass','ITI','Diploma','Graduate']} /></Field></Grid>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><Btn outline>Save Draft</Btn><Btn green>🚀 Submit to NAPS Portal</Btn></div>
      </Card>
    </>;
  }

  function PanelApprenActive() {
    return <>
      <Bc parts={['Apprenticeship','Active Apprentices']} />
      <SectionHead title="Active Apprentices 📋" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val="42" label="Total Apprentices" sub="Currently active" color={C.blue} />
        <KpiCard val="₹2.94 L" label="Monthly Stipend" sub="Total outgo" color={C.teal} />
        <KpiCard val="₹63,000" label="Govt Reimbursement" sub="This month (NAPS)" color={C.green} />
        <KpiCard val="8" label="Completing Soon" sub="In next 30 days" color={C.gold} />
      </div>
      <Card>
        <Table head={['Name','Trade','Location','Progress','Stipend','Status']} rows={[
          ['Ramesh Kumar','Software Testing','Bengaluru',<Badge color="blue">50%</Badge>,'₹7,000',<Badge color="green">Active</Badge>],
          ['Sunita Devi','Customer Support','Hyderabad',<Badge color="blue">50%</Badge>,'₹7,000',<Badge color="green">Active</Badge>],
          ['Deepak Yadav','Data Entry Operator','Pune',<Badge color="teal">38%</Badge>,'₹6,000',<Badge color="teal">Active</Badge>],
          ['Kavya Nair','Electrician','Chennai',<Badge color="green">75%</Badge>,'₹8,000',<Badge color="green">Active</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelApprenStipend() {
    return <>
      <Bc parts={['Apprenticeship','Stipend Management']} />
      <SectionHead title="Stipend Management 💰" />
      <Card>
        <CardTitle>📊 July 2026</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
          <KpiCard val="42" label="Apprentices" sub="On payroll" color={C.blue} />
          <KpiCard val="₹2,94,000" label="Gross Stipend" sub="Total payout" color={C.teal} />
          <KpiCard val="₹63,000" label="Govt Share (NAPS)" sub="25% reimbursed" color={C.green} />
        </div>
        <Table head={['Apprentice','Trade','Stipend','Govt Share','Net Cost','Status']} rows={[
          ['Ramesh Kumar','Software Testing','₹7,000','₹1,500','₹5,500',<Badge color="green">Paid</Badge>],
          ['Sunita Devi','Customer Support','₹7,000','₹1,500','₹5,500',<Badge color="green">Paid</Badge>],
          ['Deepak Yadav','Data Entry Operator','₹6,000','₹1,500','₹4,500',<Badge color="gold">Pending</Badge>],
          ['Kavya Nair','Electrician','₹8,000','₹1,500','₹6,500',<Badge color="green">Paid</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelApprenReports() {
    return <>
      <Bc parts={['Apprenticeship','Reports']} />
      <SectionHead title="Apprenticeship Reports 📊" />
      <Card>
        <Table head={['Batch','Trade','Enrolled','Completed','Retained','Govt Reimbursement']} rows={[
          ['Batch 1 (2025)','Software Testing','15','13','10',<Badge color="green">₹2.3 L</Badge>],
          ['Batch 2 (2025)','Customer Support','12','11','9',<Badge color="green">₹1.9 L</Badge>],
          ['Batch 3 (2026)','Data Entry Operator','15','—','—',<Badge color="blue">Ongoing</Badge>],
        ]} />
        <div style={{ marginTop:14, display:'flex', gap:10 }}><Btn outline>📥 Download Report</Btn><Btn>📊 Export to Excel</Btn></div>
      </Card>
    </>;
  }

  function PanelSkillGap() {
    return <>
      <Bc parts={['Skill Development','Skill Gap Analysis']} />
      <SectionHead title="Skill Gap Analysis 📊" />
      <Card>
        <CardTitle>🎯 Demand vs Supply</CardTitle>
        <StatRow n="48 vs 12" label="React / Next.js — High Gap" pct={75} color={C.red} />
        <StatRow n="22 vs 8"  label="Cloud / AWS — High Gap"    pct={64} color={C.red} />
        <StatRow n="30 vs 18" label="Data Analytics — Medium"   pct={40} color={C.gold} />
        <StatRow n="18 vs 14" label="QA / Testing — Low Gap"   pct={22} color={C.green} />
        <StatRow n="15 vs 6"  label="DevOps / CI-CD — High"    pct={60} color={C.red} />
      </Card>
      <Card>
        <CardTitle>🏛️ Recommended Schemes</CardTitle>
        <Alert icon="💡" type="info">Based on your skill gaps, PMKVY Batch aligned with IT-ITeS SSC can fill React and Cloud roles within 3 months.</Alert>
        <Table head={['Scheme','Skill Focus','Duration','Action']} rows={[
          ['PMKVY 4.0','React, Cloud, Data','3 months',<Btn sm green>Enroll</Btn>],
          ['STAR Scheme','QA, Testing','2 months',<Btn sm green>Enroll</Btn>],
          ['NAPS','All Trades','12 months',<Btn sm outline>Register</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelSkillPartners() {
    return <>
      <Bc parts={['Skill Development','Training Partner Connect']} />
      <SectionHead title="Training Partner Connect 🤝" />
      <Card>
        <Grid cols={3}><Field label="Skill Area"><Inp placeholder="e.g. React, Cloud" /></Field><Field label="Location"><Sel options={['All India','Bengaluru','Hyderabad','Pune']} /></Field><Field label="Scheme"><Sel options={['Any','PMKVY','STAR','DDU-GKY','NAPS']} /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn>🔍 Search Partners</Btn></div>
      </Card>
      <Card>
        <CardTitle>🏆 Recommended Partners</CardTitle>
        <Table head={['Partner','Courses','Location','Rating','Placement Rate','Action']} rows={[
          ['SkillBridge Institute','React, Cloud, QA','Bengaluru','⭐ 4.7','84%',<Btn sm outline>Connect</Btn>],
          ['TechLearn Academy','Data, Python, SQL','Hyderabad','⭐ 4.5','79%',<Btn sm outline>Connect</Btn>],
          ['CodeCraft Academy','QA, DevOps, AWS','Pune','⭐ 4.3','71%',<Btn sm outline>Connect</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelSkillReqs() {
    return <>
      <Bc parts={['Skill Development','Training Requirements']} />
      <SectionHead title="Training Requirements 📋" />
      <Card>
        <Field label="Skill Required"><Inp placeholder="e.g. Cloud Computing with AWS" /></Field>
        <Grid cols={3}><Field label="No. of Candidates Needed"><Inp defaultValue="20" /></Field><Field label="Target Date"><Inp type="date" /></Field><Field label="Budget per Candidate (₹)"><Inp defaultValue="15000" /></Field></Grid>
        <Field label="Additional Requirements"><Inp placeholder="e.g. 3-month intensive, must include certification" /></Field>
        <div style={{ textAlign:'right' }}><Btn green>📩 Submit Requirement</Btn></div>
      </Card>
    </>;
  }

  function PanelSkillPmkvy() {
    return <>
      <Bc parts={['Skill Development','PMKVY Partnership']} />
      <SectionHead title="PMKVY Partnership 🏛️" />
      <Alert icon="✅" type="success">{user?.org_name || 'Your company'} is a <strong>PMKVY 4.0 Employer Partner</strong>. You are eligible for placement-linked incentives on certified candidates hired.</Alert>
      <Card>
        <Table head={['Name','Trade','Certification','Hired On','Incentive','Status']} rows={[
          ['Aisha Khan','Data Entry Operator','NSQF L4','Jun 1, 2026',<Badge color="green">₹5,000 Claimed</Badge>,'Retained'],
          ['Vikas Patel','Software Tester','NSQF L4','Apr 1, 2026',<Badge color="green">₹5,000 Claimed</Badge>,'Retained'],
          ['Meena Srinivas','BPO Associate','NSQF L3','May 15, 2026',<Badge color="gold">Pending</Badge>,'Retained'],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Add PMKVY Hire</Btn></div>
      </Card>
    </>;
  }

  function PanelSchemePmkvy() {
    return <>
      <Bc parts={['Schemes','PMKVY']} />
      <SectionHead title="PMKVY 4.0 🏛️" />
      <Card>
        <p style={{ fontSize:13, lineHeight:1.8, marginBottom:12, color:'#374151' }}>Hire PMKVY-certified candidates and claim <strong>placement-linked incentives of ₹5,000–₹10,000 per hire</strong>. Candidates are trained as per industry-aligned Sector Skill Council curriculum and assessed by SSC assessors.</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
          <Badge color="green">Placement incentive per hire</Badge>
          <Badge color="blue">SSC-aligned curriculum</Badge>
          <Badge color="teal">NSQF certified</Badge>
        </div>
      </Card>
      <Card>
        <CardTitle>📊 Your PMKVY Activity</CardTitle>
        <Table head={['Year','Candidates Hired','Incentive Claimed','Pending','Status']} rows={[
          ['FY 2025-26','8','₹40,000',<Badge color="gold">₹10,000 Pending</Badge>,<Badge color="green">Active</Badge>],
          ['FY 2024-25','14','₹70,000','—',<Badge color="teal">Closed</Badge>],
        ]} />
        <div style={{ marginTop:14 }}><Btn green>📩 Claim Incentive</Btn></div>
      </Card>
    </>;
  }

  function PanelSchemeNaps() {
    return <>
      <Bc parts={['Schemes','NAPS / NATS']} />
      <SectionHead title="NAPS — National Apprenticeship Promotion Scheme 📜" />
      <Card>
        <p style={{ fontSize:13, lineHeight:1.8, marginBottom:12, color:'#374151' }}>NAPS provides <strong>25% of monthly stipend (max ₹1,500/month)</strong> reimbursement per apprentice registered on the apprenticeship.gov.in portal.</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Badge color="green">25% stipend reimbursed</Badge>
          <Badge color="blue">Max ₹1,500/month/apprentice</Badge>
          <Badge color="teal">Any trade eligible</Badge>
        </div>
      </Card>
      <Card>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          <KpiCard val="42" label="Active Apprentices" sub="Across 4 trades" color={C.blue} />
          <KpiCard val="₹63,000" label="Monthly Govt Share" sub="This month" color={C.green} />
          <KpiCard val="₹7.56 L" label="Total Benefit" sub="Since registration" color={C.teal} />
        </div>
        <div style={{ marginTop:14 }}><Btn green>+ Register New Apprentices</Btn></div>
      </Card>
    </>;
  }

  function PanelSchemeDdugky() {
    return <>
      <Bc parts={['Schemes','DDU-GKY']} />
      <SectionHead title="DDU-GKY 🌾" />
      <Card>
        <p style={{ fontSize:13, lineHeight:1.8, marginBottom:12, color:'#374151' }}>DDU-GKY targets <strong>rural youth (15-35 years, BPL families)</strong> with free training and mandatory placement. Partner with PIAs to get pre-trained, job-ready rural candidates at no hiring cost.</p>
      </Card>
      <Card>
        <CardTitle>📋 Your DDU-GKY Hires</CardTitle>
        <Table head={['Name','Trade','State','Hired On','CTC','Retention']} rows={[
          ['Ramesh Kumar','Data Entry Operator','UP','May 1, 2026','₹1.8 LPA',<Badge color="green">Retained</Badge>],
          ['Sunita Devi','BPO Associate','Bihar','Apr 15, 2026','₹1.6 LPA',<Badge color="green">Retained</Badge>],
        ]} />
        <div style={{ marginTop:14, display:'flex', gap:10 }}><Btn outline>🤝 Partner with a PIA</Btn><Btn green>+ Add DDU-GKY Hire</Btn></div>
      </Card>
    </>;
  }

  function PanelSchemeStar() {
    return <>
      <Bc parts={['Schemes','STAR Scheme']} />
      <SectionHead title="STAR Scheme ⭐" />
      <Card>
        <p style={{ fontSize:13, lineHeight:1.8, marginBottom:12, color:'#374151' }}>Hiring STAR-certified candidates qualifies for placement incentives and preferred access to the <strong>Skill India Digital talent pool</strong>. Candidates receive ₹500–₹2,000 monetary reward on certification.</p>
      </Card>
      <Card>
        <Table head={['Name','Job Role','Cert Level','Hire Date','Status']} rows={[
          ['Meena Srinivas','Customer Support','NSQF L3','May 15, 2026',<Badge color="green">Active</Badge>],
          ['Vikas Rao','Data Analyst','NSQF L4','Apr 1, 2026',<Badge color="green">Active</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelSchemeIncentives() {
    return <>
      <Bc parts={['Schemes','Employer Incentives']} />
      <SectionHead title="Employer Incentives 💰" />
      <Card>
        <Table head={['Incentive','Scheme','Amount','Eligibility','Status']} rows={[
          ['Placement Incentive','PMKVY 4.0','₹5,000–10,000/hire','Hire PMKVY-certified candidate',<Badge color="green">Eligible</Badge>],
          ['Apprenticeship Subsidy','NAPS','25% stipend (max ₹1,500/mo)','Register on NAPS portal',<Badge color="teal">Active</Badge>],
          ['Fresher Hiring Incentive','Skill India','₹3,000/fresher','NSQF certified, first job',<Badge color="green">Eligible</Badge>],
          ['Women Empowerment Bonus','State Scheme','₹8,000/hire','Women candidates from rural areas',<Badge color="gold">Check Eligibility</Badge>],
        ]} />
      </Card>
      <Card>
        <CardTitle>📋 Claimed Incentives</CardTitle>
        <Table head={['Incentive','Amount','Claimed On','Status','UTR']} rows={[
          ['PMKVY Placement — 8 hires','₹40,000','Jun 30, 2026',<Badge color="green">Credited</Badge>,'UTR-20260630-001'],
          ['NAPS Reimbursement — Jun','₹63,000','Jul 1, 2026',<Badge color="gold">Processing</Badge>,'UTR-20260701-005'],
        ]} />
      </Card>
    </>;
  }

  function PanelRepHiring() {
    return <>
      <Bc parts={['Reports','Hiring Reports']} />
      <SectionHead title="Hiring Reports 📋" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val="47"    label="Total Hires" sub="FY 2025-26" color={C.green} />
        <KpiCard val="₹6.8 LPA" label="Avg CTC" sub="All hires" color={C.blue} />
        <KpiCard val="28 days" label="Avg Time to Hire" sub="Posting to offer" color={C.teal} />
        <KpiCard val="87%"   label="Offer Acceptance" sub="Above industry avg" color={C.gold} />
      </div>
      <Card>
        <Table head={['Month','Applications','Shortlisted','Offers','Hires','Acceptance']} rows={[
          ['April 2026','68','32','8','7',<Badge color="green">88%</Badge>],
          ['May 2026','72','38','10','9',<Badge color="green">90%</Badge>],
          ['June 2026','84','42','12','10',<Badge color="teal">83%</Badge>],
          ['July 2026 (MTD)','118','48','12','8',<Badge color="gold">67%</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepPlacement() {
    return <>
      <Bc parts={['Reports','Placement Analytics']} />
      <SectionHead title="Placement Analytics 📈" />
      <Card>
        <CardTitle>🔍 Source Analysis</CardTitle>
        <StatRow n="18 hires" label="Skill India Digital" pct={38} color={C.blue} />
        <StatRow n="12 hires" label="Referral" pct={26} color={C.green} />
        <StatRow n="8 hires"  label="Campus" pct={17} color={C.teal} />
        <StatRow n="6 hires"  label="Job Portals" pct={13} color={C.gold} />
        <StatRow n="3 hires"  label="Walk-in" pct={6}  color={C.purple} />
      </Card>
      <Card>
        <CardTitle>🏆 Role-wise Placements</CardTitle>
        <Table head={['Role','Hires','Avg CTC','Avg Joining Time','Retention (30d)']} rows={[
          ['Software Developer','18','₹7.2 LPA','22 days',<Badge color="green">94%</Badge>],
          ['Data Analyst','10','₹6.0 LPA','28 days',<Badge color="green">90%</Badge>],
          ['QA Engineer','8','₹5.0 LPA','30 days',<Badge color="teal">88%</Badge>],
          ['DevOps Engineer','6','₹9.5 LPA','35 days',<Badge color="gold">83%</Badge>],
          ['UI/UX Designer','5','₹7.8 LPA','25 days',<Badge color="green">100%</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepWorkforce() {
    return <>
      <Bc parts={['Reports','Workforce Reports']} />
      <SectionHead title="Workforce Reports 👥" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard val="420" label="Total Employees" sub="As of Jul 2026" color={C.navy} />
        <KpiCard val="18"  label="Open Positions" sub="Across departments" color={C.blue} />
        <KpiCard val="7.2%" label="Annual Attrition" sub="Industry avg: 18%" color={C.green} />
        <KpiCard val="42"  label="Apprentices" sub="Active under NAPS" color={C.teal} />
      </div>
      <Card>
        <Table head={['Department','Headcount','Open Roles','Attrition','Skill India Hires']} rows={[
          ['Engineering','210','10','5.1%','12'],
          ['Product','48','3','6.2%','2'],
          ['QA','52','2','8.0%','6'],
          ['Design','28','1','3.6%','1'],
          ['Sales & Marketing','42','2','12.5%','4'],
          ['HR & Admin','40','0','4.2%','0'],
        ]} />
      </Card>
    </>;
  }

  function PanelRepSector() {
    return <>
      <Bc parts={['Reports','Sector Reports']} />
      <SectionHead title="Sector Reports 🏭" />
      <Card>
        <CardTitle>IT-ITeS Benchmarks — FY 2025-26</CardTitle>
        <Table head={['Metric',user?.org_name||'Your Company','Sector Avg','Rank']} rows={[
          ['Avg Time to Hire','28 days','35 days',<Badge color="green">Top 20%</Badge>],
          ['Offer Acceptance Rate','87%','74%',<Badge color="green">Top 15%</Badge>],
          ['30-day Retention','92%','84%',<Badge color="teal">Top 25%</Badge>],
          ['Fresher Hiring %','31%','22%',<Badge color="blue">Above Avg</Badge>],
          ['Skill India Portal Hires','38%','18%',<Badge color="green">Leader</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelCompLabour() {
    return <>
      <Bc parts={['Compliance','Labour Law']} />
      <SectionHead title="Labour Law Compliance 📜" />
      <Card>
        <Step num={1} title="Shops & Establishments Act Registration" sub="Licensed under Karnataka Shops & Establishments Act, 2023" done />
        <Step num={2} title="Minimum Wages Compliance" sub="All roles pay at or above notified minimum wage" done />
        <Step num={3} title="Equal Remuneration Act" sub="Gender pay parity policy in place" done />
        <Step num={4} title="Maternity Benefit Act" sub="6-month maternity leave policy active" done />
        <Step num={5} title="POSH Compliance" sub="Internal Complaints Committee constituted; annual return filed" done />
        <Step num={6} title="Contract Labour Act" sub="Registration obtained; Principal Employer compliance" pending />
      </Card>
    </>;
  }

  function PanelCompPfesi() {
    return <>
      <Bc parts={['Compliance','PF / ESI']} />
      <SectionHead title="PF / ESI Compliance 🏦" />
      <Card>
        <Grid><Field label="PF Establishment Code"><Inp defaultValue="KN/BLR/1234567" /></Field><Field label="ESI Code"><Inp defaultValue="53000012345678" /></Field></Grid>
      </Card>
      <Card>
        <CardTitle>📊 Monthly Contributions</CardTitle>
        <Table head={['Month','Employees','PF (Employer)','PF (Employee)','ESI','Status']} rows={[
          ['June 2026','420','₹5,04,000','₹5,04,000','₹1,47,000',<Badge color="green">Filed</Badge>],
          ['May 2026','415','₹4,98,000','₹4,98,000','₹1,45,250',<Badge color="green">Filed</Badge>],
          ['April 2026','408','₹4,89,600','₹4,89,600','₹1,42,800',<Badge color="green">Filed</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelCompContract() {
    return <>
      <Bc parts={['Compliance','Contract Labour']} />
      <SectionHead title="Contract Labour Compliance 📋" />
      <Alert icon="ℹ️" type="info">Establishments employing 20+ contract workers must register under the Contract Labour (R&A) Act, 1970.</Alert>
      <Card>
        <Table head={['Contractor','Workers','Work Type','License No.','Compliance']} rows={[
          ['CleanTech Services','32','Facility Management','CL/KA/2024/001',<Badge color="green">Compliant</Badge>],
          ['SecureGuard Pvt Ltd','18','Security','CL/KA/2024/002',<Badge color="green">Compliant</Badge>],
          ['TempStaff Solutions','12','IT Support','CL/KA/2025/003',<Badge color="gold">Under Review</Badge>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Add Contractor</Btn></div>
      </Card>
    </>;
  }

  function PanelCompAudit() {
    return <>
      <Bc parts={['Compliance','Audit Trail']} />
      <SectionHead title="Audit Trail 🔍" />
      <Card>
        {myJobs.length === 0 && allApps.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No activity recorded yet</div>
          : <Table head={['Action','Details']} rows={[
              ...myJobs.slice(0,3).map(j=>['Job Posted', `${j.title} — ${j.status}`]),
              ...allApps.slice(0,3).map(a=>['Application', `${a.candidate_name||a.email||'Candidate'} → ${a.job_title||'Role'} (${a.status})`]),
            ]} />
        }
      </Card>
    </>;
  }

  function PanelHelpdesk() {
    return <>
      <Bc parts={['Support','Helpdesk']} />
      <SectionHead title="Helpdesk 🎧" />
      <Card>
        <CardTitle>🆕 Raise a Ticket</CardTitle>
        <Grid><Field label="Category"><Sel options={['Job Posting Issue','Candidate Search','Scheme / Incentive Query','Technical Issue','Compliance','Other']} /></Field><Field label="Priority"><Sel options={['Low','Medium','High','Critical']} defaultValue="Medium" /></Field></Grid>
        <Field label="Subject"><Inp placeholder="e.g. Unable to post job — getting validation error" /></Field>
        <Field label="Description"><textarea className="inp" rows={4} placeholder="Describe your issue…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn green>📩 Submit Ticket</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 My Tickets</CardTitle>
        <Table head={['Ticket ID','Category','Subject','Status','Updated']} rows={[
          ['TKT-20260001','Scheme / Incentive','PMKVY incentive not credited',<Badge color="green">Resolved</Badge>,'Jul 3, 2026'],
          ['TKT-20260002','Technical','Job search filters not working',<Badge color="gold">In Progress</Badge>,'Jul 2, 2026'],
        ]} />
      </Card>
    </>;
  }

  function PanelGrievance() {
    return <>
      <Bc parts={['Support','Grievance']} />
      <SectionHead title="Grievance Redressal 📣" />
      <Alert icon="ℹ️" type="info">Grievances related to scheme delays, portal issues, or unfair practices. Expected resolution: 10 working days.</Alert>
      <Card>
        <Field label="Grievance Type"><Sel options={['Scheme Incentive Delay','Portal Malfunction','Candidate Data Issue','Unfair Practices','Other']} /></Field>
        <Field label="Against (if applicable)"><Inp placeholder="e.g. NSDC, State Nodal Agency" /></Field>
        <Field label="Description"><textarea className="inp" rows={5} placeholder="Describe your grievance with relevant dates and amounts…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn danger>📤 Submit Grievance</Btn></div>
      </Card>
    </>;
  }

  function PanelFAQ() {
    return <>
      <Bc parts={['Support','FAQ']} />
      <SectionHead title="Frequently Asked Questions ❓" />
      {[
        ['How do I post a job?','Go to Job Management → Post New Job. Fill in job details, compensation, and publish. Your job will be visible to candidates on the Skill India Digital platform.'],
        ['What is the PMKVY Placement Incentive?','Employers who hire PMKVY-certified candidates receive ₹5,000–₹10,000 per hire as a placement incentive, credited after 90-day retention verification.'],
        ['How do I claim NAPS reimbursement?','Register your apprenticeship vacancies on the NAPS portal (apprenticeship.gov.in). The portal auto-calculates and reimburses 25% of monthly stipend (up to ₹1,500/apprentice).'],
        ['Can I search for scheme-trained candidates?','Yes. In Candidate Search, filter by "PMKVY Certified", "DDU-GKY Trained", or "STAR Certified" to find scheme-trained candidates.'],
        ['What compliance documents are required?','You need GST certificate, CIN/PAN, Shops & Establishments Registration, PF/ESI registration, and NAPS registration (for apprenticeship). Upload all under Company Documents.'],
        ['How is the match score calculated?','The match score compares the candidate\'s skills, experience, location, and education against your job requirements using the Skill India Digital matching algorithm.'],
      ].map(([q,a])=>(
        <Card key={q}>
          <div style={{ fontSize:13.5, fontWeight:700, color:C.navy, marginBottom:6 }}>Q: {q}</div>
          <div style={{ fontSize:13, color:'#374151', lineHeight:1.7 }}>{a}</div>
        </Card>
      ))}
    </>;
  }

  function PanelSettings() {
    return <AccountPreferences onLogout={handleLogout} />;
  }

  function PanelSignOut() {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'70vh' }}>
        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 32px rgba(0,0,0,.1)', padding:'48px 56px', textAlign:'center', maxWidth:440, width:'100%' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🚪</div>
          <div style={{ fontSize:22, fontWeight:800, color:C.navy, marginBottom:10 }}>Sign Out</div>
          <div style={{ fontSize:14, color:'#64748b', marginBottom:32, lineHeight:1.7 }}>
            Are you sure you want to sign out of the Employer Portal?<br />
            You will be redirected to the home page.
          </div>
          <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
            <button
              onClick={() => go('dashboard')}
              style={{ padding:'11px 28px', borderRadius:8, border:'1.5px solid #dde2eb', background:'#f6f8fc', color:C.navy, fontWeight:600, fontSize:14, cursor:'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleLogout}
              style={{ padding:'11px 28px', borderRadius:8, border:'none', background:C.red||'#dc2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Yes, Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderPanel() {
    switch(panel) {
      case 'dashboard':         return PanelDashboard();
      case 'notifications':     return PanelNotifications();
      case 'profile-info':      return PanelProfileInfo();
      case 'profile-contact':   return PanelProfileContact();
      case 'profile-docs':      return PanelProfileDocs();
      case 'profile-bank':      return PanelProfileBank();
      case 'profile-hr':        return PanelProfileHr();
      case 'job-post':          return PanelJobPost();
      case 'job-active':        return PanelJobActive();
      case 'job-draft':         return PanelJobDraft();
      case 'job-closed':        return PanelJobClosed();
      case 'job-applications':  return PanelJobApplications();
      case 'cand-search':       return PanelCandSearch();
      case 'cand-shortlist':    return PanelCandShortlist();
      case 'cand-interview':    return PanelCandInterview();
      case 'cand-offer':        return PanelCandOffer();
      case 'cand-placed':       return PanelCandPlaced();
      case 'appren-register':   return PanelApprenRegister();
      case 'appren-active':     return PanelApprenActive();
      case 'appren-stipend':    return PanelApprenStipend();
      case 'appren-reports':    return PanelApprenReports();
      case 'skill-gap':         return PanelSkillGap();
      case 'skill-partners':    return PanelSkillPartners();
      case 'skill-requirements':return PanelSkillReqs();
      case 'skill-pmkvy':       return PanelSkillPmkvy();
      case 'scheme-pmkvy':      return PanelSchemePmkvy();
      case 'scheme-naps':       return PanelSchemeNaps();
      case 'scheme-ddugky':     return PanelSchemeDdugky();
      case 'scheme-star':       return PanelSchemeStar();
      case 'scheme-incentives': return PanelSchemeIncentives();
      case 'rep-hiring':        return PanelRepHiring();
      case 'rep-placement':     return PanelRepPlacement();
      case 'rep-workforce':     return PanelRepWorkforce();
      case 'rep-sector':        return PanelRepSector();
      case 'comp-labour':       return PanelCompLabour();
      case 'comp-pfesi':        return PanelCompPfesi();
      case 'comp-contract':     return PanelCompContract();
      case 'comp-audit':        return PanelCompAudit();
      case 'helpdesk':          return PanelHelpdesk();
      case 'grievance':         return PanelGrievance();
      case 'faq':               return PanelFAQ();
      case 'settings':          return PanelSettings();
      case 'signout':           return PanelSignOut();
      default:                  return <SectionHead title="Panel Not Found" />;
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      {Sidebar()}
      {Topbar()}
      <div style={{ marginLeft:SW, marginTop:TH, padding:24, minHeight:`calc(100vh - ${TH}px)`, overflowX:'hidden', boxSizing:'border-box' }}>
        {renderPanel()}
      </div>
    </div>
  );
}
