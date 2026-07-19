import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES, validateSalaryRange, validateText } from '../utils/validators.js';
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
  { key:'profile-info',     label:'Company Information',   section:'Main' },
  { key:'profile-contact',  label:'Contact & Address',     section:'Main' },
  { key:'profile-docs',     label:'Company Documents',     section:'Main' },
  { key:'profile-bank',     label:'Bank & Billing',        section:'Main' },
  { key:'profile-hr',       label:'HR Contacts',           section:'Main' },
  { key:'notifications',    label:'Notifications',         section:'Main' },
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
  { key:'assessments',       label:'Assessments',           section:'Talent' },
  { key:'ai-insights',      label:'AI Insights',           section:'Talent' },
  { key:'saved-searches',   label:'Saved Searches',        section:'Talent' },
  { key:'employer-branding',label:'Employer Branding',     section:'Employer' },
  { key:'billing-plans',    label:'Billing & Plans',       section:'Employer' },
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
  const [menuPerms, setMenuPerms] = useState({});
  const [avatarTipOpen, setAvatarTipOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [scheduledInterviews, setScheduledInterviews] = useState([]);

  async function loadInterviews() {
    try { setScheduledInterviews(await api.employerInterviews()); } catch {}
  }

  async function scheduleInterview() {
    if (!interview.candidate_name.trim() || !interview.date || !interview.time) {
      setInterviewMsg('Candidate name, date and time are required.'); return;
    }
    setInterviewSaving(true); setInterviewMsg('');
    try {
      await api.createEmployerInterview({
        candidate_name: interview.candidate_name, job_role: interview.job_role,
        round: interview.round, interview_date: interview.date, interview_time: interview.time,
        mode: interview.mode, interviewers: interview.interviewers, link: interview.link,
      });
      await loadInterviews();
      setInterview({ candidate_name:'', job_role:'', round:'Technical Round 1', date:'', time:'', mode:'Video Call', interviewers:'', link:'' });
      setInterviewMsg('✅ Interview scheduled successfully.');
    } catch (e) { setInterviewMsg('❌ ' + e.message); }
    setInterviewSaving(false);
  }

  // ── Offer letter state ──
  const [offer, setOffer] = useState({ candidate_name:'', job_role:'', ctc:'', joining_date:'', probation:'3 Months', special_terms:'' });
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerMsg, setOfferMsg] = useState('');
  const [sentOffers, setSentOffers] = useState([]);

  async function loadOffers() {
    try { setSentOffers(await api.employerOffers()); } catch {}
  }

  async function generateOffer(send) {
    if (!offer.candidate_name.trim() || !offer.job_role.trim() || !offer.ctc) {
      setOfferMsg('Candidate name, job role and CTC are required.'); return;
    }
    setOfferSaving(true); setOfferMsg('');
    try {
      await api.createEmployerOffer({ ...offer, status: send ? 'Sent' : 'Generated' });
      await loadOffers();
      setOffer({ candidate_name:'', job_role:'', ctc:'', joining_date:'', probation:'3 Months', special_terms:'' });
      setOfferMsg(send ? '✅ Offer letter sent successfully.' : '✅ Offer letter generated.');
    } catch (e) { setOfferMsg('❌ ' + e.message); }
    setOfferSaving(false);
  }

  // ── HR Contacts state ──
  const [hrContacts, setHrContacts] = useState([]);
  const [hrForm, setHrForm] = useState({ name:'', designation:'', email:'', phone:'' });
  const [hrSaving, setHrSaving] = useState(false);
  const [hrMsg, setHrMsg] = useState('');
  const [showHrForm, setShowHrForm] = useState(false);

  async function loadHrContacts() {
    try { setHrContacts(await api.employerHrContacts()); } catch {}
  }

  async function saveHrContact() {
    if (!hrForm.name.trim()) { setHrMsg('Name is required.'); return; }
    const nameErr = fieldValidate('name', hrForm.name);
    if (nameErr) { setHrMsg(nameErr); return; }
    if (hrForm.email) { const eErr = fieldValidate('email', hrForm.email); if (eErr) { setHrMsg(eErr); return; } }
    if (hrForm.phone) { const pErr = fieldValidate('mobile', hrForm.phone.replace(/\D/g,'')); if (pErr) { setHrMsg('HR Phone: ' + pErr); return; } }
    setHrSaving(true);
    try {
      await api.createEmployerHrContact(hrForm);
      await loadHrContacts();
      setHrForm({ name:'', designation:'', email:'', phone:'' });
      setShowHrForm(false); setHrMsg('');
    } catch (e) { setHrMsg('❌ ' + e.message); }
    setHrSaving(false);
  }

  async function removeHrContact(id) {
    try { await api.deleteEmployerHrContact(id); await loadHrContacts(); } catch {}
  }

  // ── Bank state ──
  const [bank, setBank] = useState({ bank_account_name: user?.bank_account_name||'', bank_account_number: user?.bank_account_number||'', bank_ifsc: user?.bank_ifsc||'' });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState('');
  // ── Docs state ──
  const [empDocs, setEmpDocs] = useState([]);

  async function loadEmpDocs() {
    try { setEmpDocs(await api.employerDocuments()); } catch {}
  }

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

  const [chatOpen,    setChatOpen]   = useState(false);
  const [chatMsgs,    setChatMsgs]   = useState([{ role:'assistant', text:'Hi! 👋 I\'m your SkillsnJobs AI assistant. Ask me about job postings, candidates, hiring, or compliance.' }]);
  const [chatInput,   setChatInput]  = useState('');
  const [chatLoading, setChatLoading]= useState(false);

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

  const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
  const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [panel]); // eslint-disable-line

  useEffect(() => {
    api.getRolePermissions().then(all => setMenuPerms(all['employer'] || {})).catch(() => {});
  }, []);
  const PERM_LOCKED = new Set(['dashboard','notifications','settings','profile-info','profile-contact','profile-docs','profile-bank','profile-hr']);
  const allowed = k => !k || PERM_LOCKED.has(k) || menuPerms[k] !== false;
  useEffect(() => { if (Object.keys(menuPerms).length && !allowed(panel)) setPanel('dashboard'); }, [menuPerms]); // eslint-disable-line

  useEffect(() => {
    api.dashboardStats().then(setDbStats).catch(() => {});
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
    api.myJobs().then(jobs =>
      Promise.all(jobs.map(j => api.jobApplicants(j.id).then(apps => apps.map(a => ({ ...a, job_title: j.title }))).catch(() => [])))
        .then(all => { setAllApps(all.flat()); setAppsLoaded(true); })
    ).catch(() => {});
    loadHrContacts();
    loadEmpDocs();
    loadInterviews();
    loadOffers();
  }, []); // eslint-disable-line

  function loadJobs() {
    if (jobsLoaded) return;
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
  }
  function refreshJobs() {
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
  }
  function loadApps() {
    if (appsLoaded) return;
    refreshApps();
  }
  function refreshApps() {
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
    function NavItem({ icon, label, id, badge, onClick, active, permKey }) {
      if (permKey && !allowed(permKey)) return null;
      return <div onClick={onClick} style={{ padding:'5px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color: active ? '#fff' : 'rgba(255,255,255,.75)', background: active ? C.blue : 'transparent', transition:'.15s' }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,.07)'; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
        <span style={{ width:18, textAlign:'center', fontSize:13, flexShrink:0 }}>{icon}</span>
        <span style={{ flex:1, fontSize:12, fontWeight:500 }}>{label}</span>
        {badge && <span style={{ background:C.red, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{badge}</span>}
        {id && <span style={{ fontSize:10, transition:'.2s', transform: openMenus[id] ? 'rotate(90deg)' : 'none', display:'inline-block' }}>›</span>}
      </div>;
    }
    function Sub({ id, children }) { return openMenus[id] ? <div style={{ background:'rgba(0,0,0,.12)' }}>{children}</div> : null; }
    function SubItem({ label, k }) {
      if (!allowed(k)) return null;
      return <div onClick={()=>go(k)} style={{ padding:'4px 14px 4px 40px', cursor:'pointer', fontSize:12, color: panel===k ? C.blue : 'rgba(255,255,255,.52)', fontWeight: panel===k ? 600 : 400, transition:'.15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#fff'; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color = panel===k ? C.blue : 'rgba(255,255,255,.52)'; }}>
        · {label}
      </div>;
    }
    const lbl = s => <div style={{ padding:'10px 14px 3px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,.32)', letterSpacing:'.08em', textTransform:'uppercase' }}>{s}</div>;

    return (
      <>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199 }} />
        )}
        <div style={{ position:'fixed', top:0, left:0, width:SW, height:'100vh', background:C.sidebar, overflowY:'hidden', zIndex:200, display:'flex', flexDirection:'column', transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)', transition:'transform 0.25s ease' }}>
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
        <NavItem icon="🏢" label="Company Profile" id="profile" onClick={()=>toggleMenu('profile')} />
        <Sub id="profile">
          <SubItem label="Company Information" k="profile-info" />
          <SubItem label="Contact & Address" k="profile-contact" />
          <SubItem label="Company Documents" k="profile-docs" />
          <SubItem label="Bank & Billing" k="profile-bank" />
          <SubItem label="HR Contacts" k="profile-hr" />
        </Sub>
        <NavItem icon="🔔" label="Notifications" badge="4" active={panel==='notifications'} onClick={()=>go('notifications')} />

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
        <NavItem icon="🎧" label="Helpdesk" permKey="helpdesk" active={panel==='helpdesk'} onClick={()=>go('helpdesk')} />
        <NavItem icon="📣" label="Grievance" permKey="grievance" active={panel==='grievance'} onClick={()=>go('grievance')} />
        <NavItem icon="❓" label="FAQ" permKey="faq" active={panel==='faq'} onClick={()=>go('faq')} />

        {lbl('Account')}
        <NavItem icon="⚙️" label="Account Preferences" active={panel==='settings'} onClick={()=>go('settings')} />
        <NavItem icon="🚪" label="Sign Out" active={panel==='signout'} onClick={()=>go('signout')} />
        </div>
      </div>
      </>
    );
  }

  // ── TOPBAR ────────────────────────────────────────────────────────────────
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left: isMobile ? 0 : SW, right:0, height:TH, background:'#fff', borderBottom:'1px solid #e4e8ef', display:'flex', alignItems:'center', padding:'0 20px', gap:12, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(v => !v)} style={{ width:38, height:38, borderRadius:8, border:'none', background:'#f1f5f9', fontSize:20, cursor:'pointer', flexShrink:0 }}>☰</button>
        )}
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
        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
          {/* Notification bell */}
          <button onClick={()=>go('notifications')}
            style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#64748B', fontSize:17, cursor:'pointer', flexShrink:0 }}>
            🔔
            <span style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#EF4444', border:'2px solid #fff' }} />
          </button>
          {/* Avatar with hover tooltip */}
          <div style={{ position:'relative' }}
            onMouseEnter={() => setAvatarTipOpen(true)}
            onMouseLeave={() => setAvatarTipOpen(false)}>
            <div onClick={() => go('profile-info')}
              style={{ display:'flex', alignItems:'center', padding:5, borderRadius:'50%', background:'#F1F5F9', border:'1px solid #E2E8F0', cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${C.navy},${C.blue})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#fff', flexShrink:0 }}>
                {(user?.org_name || 'EM').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
            </div>
            {avatarTipOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:500, background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'12px 14px', minWidth:200, boxShadow:'0 8px 24px rgba(0,0,0,.13)', whiteSpace:'nowrap' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0B1E3D' }}>{user?.org_name || 'Employer'}</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>ID: EMP-{String(user?.id||'0').padStart(6,'0')}</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{user?.email || ''}</div>
                <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid #E2E8F0' }}>
                  <button onClick={() => { setAvatarTipOpen(false); go('profile-info'); }}
                    style={{ width:'100%', padding:'5px 0', background:C.blue, color:'#fff', border:'none', borderRadius:7, fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
                    View Profile →
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Sign out icon */}
          <button onClick={handleLogout} title="Sign Out"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', border:'none', background:C.blue, color:'#fff', fontSize:18, cursor:'pointer', flexShrink:0 }}>
            ⏻
          </button>
        </div>
      </div>
    );
  }

  // ── PANELS ────────────────────────────────────────────────────────────────
  function PanelDashboard() {
    const totalApps   = allApps.length || dbStats.myApplicants || 0;
    const shortlisted = allApps.filter(a=>['shortlisted','interview','hired'].includes(a.status)).length || dbStats.myShortlisted || 0;
    const interviews  = allApps.filter(a=>['interview','hired'].includes(a.status)).length;
    const hired       = allApps.filter(a=>a.status==='hired').length || dbStats.myHired || 0;
    const openJobs    = dbStats.myOpenJobs ?? myJobs.filter(j=>j.status==='open').length;
    const applied     = allApps.filter(a=>a.status==='applied').length;
    const offered     = allApps.filter(a=>a.status==='offered').length;

    // Donut chart helper
    function DonutChart({ segments, total, label, size=130 }) {
      const r = 42, cx = size/2, cy = size/2, circ = 2*Math.PI*r;
      let offset = 0;
      const slices = segments.map(s => {
        const dash = (s.val/total)*circ;
        const el = <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
          strokeWidth={18} strokeDasharray={`${dash} ${circ-dash}`}
          strokeDashoffset={-offset} style={{transition:'stroke-dasharray .4s'}} />;
        offset += dash;
        return el;
      });
      return (
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={18}/>
          {slices}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            style={{fontSize:15,fontWeight:700,fill:'#0D2137',transform:'rotate(90deg)',transformOrigin:`${cx}px ${cy}px`}}>
            {total.toLocaleString()}
          </text>
          <text x={cx} y={cy+16} textAnchor="middle" dominantBaseline="middle"
            style={{fontSize:9,fill:'#94A3B8',transform:'rotate(90deg)',transformOrigin:`${cx}px ${cy}px`}}>
            {label}
          </text>
        </svg>
      );
    }

    // Sparkline for Applications Overview
    function Sparkline() {
      const pts = [320,380,410,355,490,530,480,560,620,590,670,640,700,680,730,710,760,740,780,760,790,770,800,810,820];
      const pts2= [80,95,110,90,120,140,130,150,130,120,110,130,140,135,142];
      const W=420, H=120, pad=10;
      const max1=Math.max(...pts), min1=Math.min(...pts);
      const scaleY = v => pad + (1-(v-min1)/(max1-min1))*(H-2*pad);
      const scaleX = (i,arr) => pad + (i/(arr.length-1))*(W-2*pad);
      const line1 = pts.map((v,i)=>`${i===0?'M':'L'}${scaleX(i,pts)},${scaleY(v)}`).join(' ');
      const area1 = line1 + ` L${scaleX(pts.length-1,pts)},${H} L${scaleX(0,pts)},${H} Z`;
      const max2=Math.max(...pts2), min2=Math.min(...pts2);
      const sy2 = v => pad + (1-(v-min2)/(max2-min2))*(H-2*pad);
      const line2 = pts2.map((v,i)=>`${i===0?'M':'L'}${scaleX(i,pts2)},${sy2(v)}`).join(' ');
      const labels=['14 May','20 May','26 May','01 Jun','07 Jun','13 Jun'];
      return (
        <svg viewBox={`0 0 ${W+20} ${H+30}`} style={{width:'100%',height:140}}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E5FBF" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#1E5FBF" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area1} fill="url(#g1)"/>
          <path d={line1} fill="none" stroke="#1E5FBF" strokeWidth={2.5} strokeLinejoin="round"/>
          <path d={line2} fill="none" stroke="#1A7C3E" strokeWidth={2} strokeLinejoin="round" strokeDasharray="4 2"/>
          {labels.map((l,i)=>(
            <text key={l} x={pad+(i/(labels.length-1))*(W-2*pad)} y={H+24} textAnchor="middle" style={{fontSize:9,fill:'#94A3B8'}}>{l}</text>
          ))}
          {[0,250,500,750,1000].map(v=>(
            <text key={v} x={2} y={scaleY(min1+(v/(1000))*(max1-min1))} dominantBaseline="middle" style={{fontSize:9,fill:'#CBD5E1'}}>{v===0?'0':v===1000?'1K':v}</text>
          ))}
          <circle cx={scaleX(pts.length-1,pts)} cy={scaleY(pts[pts.length-1])} r={4} fill="#1E5FBF"/>
          <rect x={scaleX(pts.length-1,pts)-18} y={scaleY(pts[pts.length-1])-14} width={36} height={14} rx={4} fill="#1E5FBF"/>
          <text x={scaleX(pts.length-1,pts)} y={scaleY(pts[pts.length-1])-7} textAnchor="middle" style={{fontSize:9,fill:'#fff',fontWeight:700}}>820</text>
          <circle cx={scaleX(pts2.length-1,pts2)} cy={sy2(pts2[pts2.length-1])} r={4} fill="#1A7C3E"/>
          <rect x={scaleX(pts2.length-1,pts2)-18} y={sy2(pts2[pts2.length-1])-14} width={36} height={14} rx={4} fill="#1A7C3E"/>
          <text x={scaleX(pts2.length-1,pts2)} y={sy2(pts2[pts2.length-1])-7} textAnchor="middle" style={{fontSize:9,fill:'#fff',fontWeight:700}}>142</text>
        </svg>
      );
    }

    const kpiCards = [
      { icon:'💼', iconBg:'#EEF2FF', iconColor:'#4F46E5', val: openJobs||48, label:'Total Jobs', sub:'Active Jobs', trend:'+12%', up:true },
      { icon:'👥', iconBg:'#ECFDF5', iconColor:'#059669', val: (totalApps||2846).toLocaleString(), label:'Total Applications', sub:'All time', trend:'+18%', up:true },
      { icon:'👤', iconBg:'#FFF7ED', iconColor:'#EA580C', val: shortlisted||362, label:'Shortlisted Candidates', sub:'All time', trend:'+15%', up:true },
      { icon:'📅', iconBg:'#FFF7ED', iconColor:'#D97706', val: interviews||128, label:'Interviews Scheduled', sub:'This Month', trend:'+8%', up:true },
      { icon:'👤', iconBg:'#F0FDF4', iconColor:'#16A34A', val: hired||26, label:'Hires Made', sub:'This Month', trend:'+24%', up:true },
    ];

    const appStatusSegs = [
      { label:'Applied',     val: applied||2106,   color:'#4F46E5' },
      { label:'Shortlisted', val: shortlisted||362, color:'#16A34A' },
      { label:'Interview',   val: interviews||128,  color:'#F59E0B' },
      { label:'Offered',     val: offered||146,     color:'#8B5CF6' },
      { label:'Hired',       val: hired||104,       color:'#06B6D4' },
    ];
    const appStatusTotal = appStatusSegs.reduce((s,x)=>s+x.val,0)||2846;

    const sourceSegs = [
      { label:'LinkedIn',        val:1256, color:'#4F46E5' },
      { label:'AISEP Job Portal',val:872,  color:'#16A34A' },
      { label:'Naukri',          val:432,  color:'#F59E0B' },
      { label:'Employee Referral',val:186, color:'#F97316' },
      { label:'Other',           val:100,  color:'#06B6D4' },
    ];
    const sourceTotal = sourceSegs.reduce((s,x)=>s+x.val,0);

    const topSkills = [
      { name:'React.js', pct:78, color:'#4F46E5' },
      { name:'AWS',      pct:74, color:'#8B5CF6' },
      { name:'Python',   pct:71, color:'#4F46E5' },
      { name:'Node.js',  pct:65, color:'#8B5CF6' },
      { name:'AI/ML',    pct:62, color:'#4F46E5' },
    ];

    const aiInsights = [
      { icon:'⚙️', iconBg:'#EEF2FF', title:'High Demand Skill', desc:'AI/ML Engineers are in high demand in your industry', badge:'High', badgeColor:'#FEF3C7', badgeText:'#92400E' },
      { icon:'🔗', iconBg:'#ECFDF5', title:'Top Source', desc:'LinkedIn is your best source of quality candidates', badge:'LinkedIn', badgeColor:'#EEF2FF', badgeText:'#4F46E5' },
      { icon:'⏱️', iconBg:'#FFF7ED', title:'Time to Hire', desc:'You are 15% faster than industry average', badge:'Faster', badgeColor:'#ECFDF5', badgeText:'#059669' },
      { icon:'👥', iconBg:'#F0FDF4', title:'Diversity Score', desc:'Your diversity score improved by 12% this month', badge:'Good', badgeColor:'#EEF2FF', badgeText:'#4F46E5' },
    ];

    const pipelineSteps = [
      { label:'Applied',     val: applied||2106,   color:'#4F46E5', pct:'17.2%' },
      { label:'Shortlisted', val: shortlisted||362, color:'#16A34A', pct:'35.4%' },
      { label:'Interview',   val: interviews||128,  color:'#F59E0B', pct:'114%' },
      { label:'Offered',     val: offered||146,     color:'#8B5CF6', pct:'71.2%' },
      { label:'Hired',       val: hired||104,       color:'#06B6D4', pct:null },
    ];

    const interviewSchedule = [
      { date:'MAY', day:16, title:'Frontend Developer Interview', time:'10:00 AM – 11:00 AM', count:3, color:'#4F46E5' },
      { date:'MAY', day:16, title:'AI/ML Engineer Interview',     time:'02:00 PM – 03:30 PM', count:4, color:'#16A34A' },
      { date:'MAY', day:17, title:'Product Manager Interview',    time:'11:00 AM – 12:00 PM', count:2, color:'#F59E0B' },
    ];

    const aiMatches = [
      { name:'Rahul Sharma',  role:'Senior Full Stack Developer', loc:'Bangalore · 5 yrs', score:95 },
      { name:'Priya Nair',    role:'AI/ML Engineer',             loc:'Hyderabad · 4 yrs', score:92 },
      { name:'Arjun Mehta',   role:'DevOps Engineer',            loc:'Pune · 3 yrs',      score:89 },
    ];

    const jobDepts = ['Engineering','Engineering','Product','Engineering','Design'];
    const jobLocs  = ['Bangalore','Hyderabad','Pune','Hybrid','Bangalore'];
    const jobApps  = [523,412,298,341,276];
    const jobShort = [82,67,45,56,38];
    const jobInts  = [28,24,18,20,16];
    const jobHires = [3,2,1,2,1];

    const activeJobs = myJobs.filter(j=>j.status==='open').slice(0,5);

    const card = { background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.06)', border:'1px solid #F1F5F9' };
    const sectionTitle = { fontSize:15, fontWeight:700, color:'#0D2137', marginBottom:14 };

    return (
      <div style={{ padding:'0 0 24px' }}>
        {/* KPI row + Post a Job */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, flex:1 }}>
            {kpiCards.map((k,i) => (
              <div key={i} style={{ ...card, padding:'16px 16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:k.iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{k.icon}</div>
                  <span style={{ fontSize:11, fontWeight:600, color: k.up?'#16A34A':'#DC2626', background: k.up?'#DCFCE7':'#FEE2E2', borderRadius:20, padding:'2px 8px' }}>{k.up?'↑':'↓'} {k.trend}</span>
                </div>
                <div style={{ fontSize:24, fontWeight:800, color:'#0D2137', lineHeight:1 }}>{k.val}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#0D2137', marginTop:4 }}>{k.label}</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{k.sub}</div>
              </div>
            ))}
          </div>
          {/* Avg Time to Hire + Post a Job */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:170 }}>
            <div style={{ ...card, padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⏱️</div>
                <span style={{ fontSize:12, fontWeight:600, color:'#64748B' }}>Avg. Time to Hire</span>
              </div>
              <div style={{ fontSize:28, fontWeight:800, color:'#0D2137' }}>21 <span style={{ fontSize:13, fontWeight:500, color:'#64748B' }}>Days</span></div>
              <div style={{ fontSize:11, color:'#DC2626', fontWeight:600, marginTop:4 }}>↓ 5 Days</div>
            </div>
            <button onClick={() => go('job-post')} style={{ background:'linear-gradient(135deg,#7C3AED,#4F46E5)', color:'#fff', border:'none', borderRadius:10, padding:'12px 16px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
              + Post a Job
            </button>
          </div>
        </div>

        {/* Row 2: Applications Overview | Applications by Status | AI Hiring Insights */}
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr', gap:14, marginBottom:14 }}>
          {/* Applications Overview */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={sectionTitle}>Applications Overview</span>
              <select style={{ fontSize:11, border:'1px solid #E2E8F0', borderRadius:6, padding:'3px 8px', color:'#64748B', background:'#F8FAFC' }}>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:14, marginBottom:4 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#4F46E5', fontWeight:600 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#4F46E5', display:'inline-block' }}/> Applications</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#16A34A', fontWeight:600 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#16A34A', display:'inline-block' }}/> Shortlisted</span>
            </div>
            <Sparkline/>
          </div>

          {/* Applications by Status donut */}
          <div style={card}>
            <div style={sectionTitle}>Applications by Status</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <DonutChart segments={appStatusSegs} total={appStatusTotal} label="Total" size={120}/>
              <div style={{ flex:1 }}>
                {appStatusSegs.map(s=>(
                  <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748B' }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:s.color, display:'inline-block', flexShrink:0 }}/>{s.label}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#0D2137' }}>{s.val.toLocaleString()} <span style={{ color:'#94A3B8', fontWeight:400 }}>({Math.round(s.val/appStatusTotal*100)}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Hiring Insights */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span style={sectionTitle}>AI Hiring Insights</span>
              <span style={{ fontSize:11, color:'#4F46E5', fontWeight:600, cursor:'pointer' }}>View All →</span>
            </div>
            {aiInsights.map((ins,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:ins.iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{ins.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0D2137' }}>{ins.title}</div>
                  <div style={{ fontSize:10, color:'#64748B', lineHeight:1.4 }}>{ins.desc}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:ins.badgeText, background:ins.badgeColor, borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap' }}>{ins.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Recent Job Postings | Top Skills | Applications by Source */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, marginBottom:14 }}>
          {/* Recent Job Postings */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={sectionTitle}>Recent Job Postings</span>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:'#94A3B8' }}>
                  {['Job Title','Department','Location','Applications','Shortlisted','Interviews','Hires','Status'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'4px 8px', fontWeight:600, fontSize:11, borderBottom:'1px solid #F1F5F9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activeJobs.length ? activeJobs : [
                  {id:1,title:'Senior Full Stack Developer'},{id:2,title:'AI/ML Engineer'},
                  {id:3,title:'Product Manager'},{id:4,title:'DevOps Engineer'},{id:5,title:'UI/UX Designer'}
                ]).map((j,i)=>(
                  <tr key={j.id} style={{ borderBottom:'1px solid #F8FAFC' }}>
                    <td style={{ padding:'8px 8px', display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:['#4F46E5','#16A34A','#F97316','#8B5CF6','#06B6D4'][i%5], display:'inline-block', flexShrink:0 }}/>
                      <span style={{ color:'#0D2137', fontWeight:500 }}>{j.title}</span>
                    </td>
                    <td style={{ padding:'8px 8px', color:'#64748B' }}>{j.department||jobDepts[i]||'Engineering'}</td>
                    <td style={{ padding:'8px 8px', color:'#64748B' }}>{j.location||jobLocs[i]||'Bangalore'}</td>
                    <td style={{ padding:'8px 8px', fontWeight:600, color:'#0D2137' }}>{allApps.filter(a=>a.job_id===j.id).length||jobApps[i]||0}</td>
                    <td style={{ padding:'8px 8px', fontWeight:600, color:'#0D2137' }}>{jobShort[i]||0}</td>
                    <td style={{ padding:'8px 8px', fontWeight:600, color:'#0D2137' }}>{jobInts[i]||0}</td>
                    <td style={{ padding:'8px 8px', fontWeight:600, color:'#0D2137' }}>{jobHires[i]||0}</td>
                    <td style={{ padding:'8px 8px' }}>
                      <span style={{ background:'#DCFCE7', color:'#15803D', borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign:'center', marginTop:12 }}>
              <span onClick={()=>go('job-active')} style={{ fontSize:12, color:'#4F46E5', fontWeight:600, cursor:'pointer' }}>View All Jobs →</span>
            </div>
          </div>

          {/* Top Skills in Demand */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span style={sectionTitle}>Top Skills in Demand</span>
              <span style={{ fontSize:11, color:'#4F46E5', fontWeight:600, cursor:'pointer' }}>View All →</span>
            </div>
            {topSkills.map(s=>(
              <div key={s.name} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'#0D2137' }}>{s.name}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#0D2137' }}>{s.pct}%</span>
                </div>
                <div style={{ height:8, background:'#F1F5F9', borderRadius:4 }}>
                  <div style={{ height:'100%', width:`${s.pct}%`, background:`linear-gradient(90deg,${s.color},${s.color}aa)`, borderRadius:4 }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Applications by Source */}
          <div style={card}>
            <div style={sectionTitle}>Applications by Source</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
              <DonutChart segments={sourceSegs} total={sourceTotal} label="Total" size={130}/>
            </div>
            {sourceSegs.map(s=>(
              <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748B' }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:s.color, display:'inline-block', flexShrink:0 }}/>{s.label}
                </span>
                <span style={{ fontSize:11, fontWeight:700, color:'#0D2137' }}>{s.val.toLocaleString()} <span style={{ color:'#94A3B8', fontWeight:400 }}>({Math.round(s.val/sourceTotal*100)}%)</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Candidate Pipeline | Interview Schedule | AI Candidate Match */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1.3fr 1fr', gap:14 }}>
          {/* Candidate Pipeline */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span style={sectionTitle}>Candidate Pipeline</span>
              <select style={{ fontSize:11, border:'1px solid #E2E8F0', borderRadius:6, padding:'3px 8px', color:'#64748B', background:'#F8FAFC' }}>
                <option>This Month</option>
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
              {pipelineSteps.map((s,i)=>(
                <div key={s.label} style={{ flex:1, textAlign:'center', position:'relative' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val.toLocaleString()}</div>
                  <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{s.label}</div>
                  <div style={{ fontSize:18, margin:'10px 0' }}>
                    {s.label==='Applied'?'📋':s.label==='Shortlisted'?'✅':s.label==='Interview'?'🗓️':s.label==='Offered'?'📨':'🏆'}
                  </div>
                  {s.pct && <div style={{ fontSize:10, fontWeight:700, color:s.color }}>{s.pct}<br/><span style={{ color:'#94A3B8', fontWeight:400 }}>Conversion</span></div>}
                  {i < pipelineSteps.length-1 && (
                    <span style={{ position:'absolute', right:-8, top:10, fontSize:16, color:'#CBD5E1' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interview Schedule */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span style={sectionTitle}>Interview Schedule</span>
              <span onClick={()=>go('cand-interview')} style={{ fontSize:11, color:'#4F46E5', fontWeight:600, cursor:'pointer' }}>View Calendar →</span>
            </div>
            {interviewSchedule.map((ev,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:ev.color, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:8, color:'rgba(255,255,255,.8)', fontWeight:700, textTransform:'uppercase' }}>{ev.date}</span>
                  <span style={{ fontSize:16, fontWeight:800, color:'#fff', lineHeight:1 }}>{ev.day}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0D2137' }}>{ev.title}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{ev.time}</div>
                </div>
                <div style={{ display:'flex' }}>
                  {Array.from({length:ev.count}).map((_,j)=>(
                    <div key={j} style={{ width:24, height:24, borderRadius:'50%', background:`hsl(${210+j*30},60%,55%)`, border:'2px solid #fff', marginLeft:j?-8:0, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>
                      {String.fromCharCode(65+j)}
                    </div>
                  ))}
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'#F1F5F9', border:'2px solid #fff', marginLeft:-8, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontWeight:700 }}>
                    +{ev.count}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Candidate Match */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span style={sectionTitle}>AI Candidate Match</span>
              <span style={{ fontSize:11, color:'#4F46E5', fontWeight:600, cursor:'pointer' }}>View All →</span>
            </div>
            {aiMatches.map((m,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:`hsl(${200+i*40},55%,55%)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#fff', flexShrink:0 }}>
                  {m.name.split(' ').map(w=>w[0]).join('')}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0D2137' }}>{m.name}</div>
                  <div style={{ fontSize:11, color:'#64748B' }}>{m.role}</div>
                  <div style={{ fontSize:10, color:'#94A3B8' }}>{m.loc}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'#16A34A' }}>{m.score}%</div>
                  <div style={{ fontSize:10, color:'#94A3B8' }}>Match Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function PanelNotifications() {
    const pending = allApps.filter(a => a.status === 'applied');
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
        const cinErr = fieldValidate('cin', profileInfo.cin);
        if (cinErr) { setCinError(cinErr); return; }
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
                onBlur={() => { setCinError(fieldValidate('cin', profileInfo.cin)); }}
                placeholder="e.g. U72200KA2015PTC082341"
                maxLength={21}
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
    const docs = empDocs;
    async function handleUpload(type, file) {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB'); return; }
      const file_size = Math.round(file.size / 1024) + ' KB';
      try {
        await api.upsertEmployerDocument({ doc_type: type, file_name: file.name, file_size });
        await loadEmpDocs();
      } catch (e) { alert('Upload failed: ' + e.message); }
    }
    return <>
      <Bc parts={['Company Profile','Company Documents']} />
      <SectionHead title="Company Documents 📄" />
      <Card>
        <Alert icon="ℹ️" type="info">Upload clear scanned copies. Accepted: PDF, JPG, PNG. Max 2 MB per file.</Alert>
        {docTypes.map(type => {
          const uploaded = docs.find(d => d.doc_type === type);
          return (
            <div key={type} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', border:'1px solid #dde2eb', borderRadius:9, marginBottom:10, background:'#fff' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:'#0D2137' }}>{type}</div>
                {uploaded && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{uploaded.file_name} · {uploaded.file_size} · {uploaded.uploaded_at ? new Date(uploaded.uploaded_at).toLocaleDateString('en-IN') : ''}</div>}
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
      const titleErr = validateText(f.title, 'Job title', { min: 3, max: 200 });
      if (titleErr) { setJobMsg(titleErr); return; }
      const salaryErr = validateSalaryRange(f.salary_min, f.salary_max);
      if (salaryErr) { setJobMsg(salaryErr); return; }
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
            onChange={e => api.updateApplicationStatus(a.id, e.target.value).then(refreshApps)}>
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
                  onChange={e => api.updateApplicationStatus(a.id, e.target.value).then(refreshApps)}>
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

  function PanelAssessments() {
    const tests = [
      { title:'Full Stack Developer Assessment', type:'Technical', candidates:24, avg:72, status:'Active' },
      { title:'Product Manager Case Study',      type:'Case Study', candidates:18, avg:68, status:'Active' },
      { title:'DevOps Proficiency Test',         type:'Technical', candidates:12, avg:81, status:'Closed' },
    ];
    return <>
      <Bc parts={['Talent','Assessments']} />
      <SectionHead title="Assessments 📋" sub="Evaluate candidate skills before interviews" />
      <Card>
        <CardTitle>Active Assessments</CardTitle>
        <Table head={['Assessment','Type','Candidates','Avg Score','Status']} rows={tests.map(t=>[
          t.title, t.type, String(t.candidates), `${t.avg}%`,
          <Badge color={t.status==='Active'?'green':'blue'}>{t.status}</Badge>
        ])} />
      </Card>
    </>;
  }

  function PanelAIInsights() {
    const insights = [
      { title:'High Demand Skill', desc:'AI/ML Engineers are in high demand — post roles now', badge:'High', color:C.gold },
      { title:'Top Hiring Source', desc:'LinkedIn drives 44% of quality applications', badge:'LinkedIn', color:C.blue },
      { title:'Time to Hire', desc:'You are 15% faster than industry average', badge:'Faster', color:C.green },
      { title:'Diversity Score', desc:'Diversity score improved 12% this month', badge:'Good', color:C.teal },
      { title:'Drop-off Alert', desc:'35% of applicants abandon after round 2 — consider shortening process', badge:'Action', color:C.red },
    ];
    return <>
      <Bc parts={['Talent','AI Insights']} />
      <SectionHead title="AI Insights ⚡" sub="Powered by real-time hiring data" />
      {insights.map((ins,i)=>(
        <Card key={i} style={{ marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, color:C.navy, marginBottom:4 }}>{ins.title}</div>
              <div style={{ fontSize:13, color:'#64748B' }}>{ins.desc}</div>
            </div>
            <span style={{ background: ins.color+'22', color:ins.color, borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700, whiteSpace:'nowrap', marginLeft:16 }}>{ins.badge}</span>
          </div>
        </Card>
      ))}
    </>;
  }

  function PanelSavedSearches() {
    const searches = [
      { name:'Senior React Developer – Bangalore', filters:'React, 5+ yrs, Bangalore', count:42, saved:'2 days ago' },
      { name:'AI/ML Engineer – Hyderabad',         filters:'Python, TensorFlow, 3+ yrs', count:28, saved:'1 week ago' },
      { name:'Product Manager – Remote',           filters:'Product, Agile, Remote', count:19, saved:'2 weeks ago' },
    ];
    return <>
      <Bc parts={['Talent','Saved Searches']} />
      <SectionHead title="Saved Searches 🔍" sub="Quickly re-run your frequent candidate searches" />
      <Card>
        <CardTitle>Your Saved Searches</CardTitle>
        {searches.length === 0
          ? <div style={{ color:'#94a3b8', padding:'20px 0', textAlign:'center' }}>No saved searches yet. Use Talent Search to save one.</div>
          : <Table head={['Search Name','Filters','Matching Candidates','Saved']} rows={searches.map(s=>[
              <span style={{ color:C.blue, fontWeight:600, cursor:'pointer' }} onClick={()=>go('cand-search')}>{s.name}</span>,
              s.filters, String(s.count), s.saved
            ])} />
        }
      </Card>
    </>;
  }

  function PanelEmployerBranding() {
    return <>
      <Bc parts={['Employer','Employer Branding']} />
      <SectionHead title="Employer Branding 🏆" sub="Manage how candidates see your company" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>Company Profile Completeness</CardTitle>
          {[['Logo & Banner','90%',C.green],['Company Description','75%',C.blue],['Culture & Values','60%',C.gold],['Office Photos','40%',C.red]].map(([lbl,pct,col])=>(
            <div key={lbl} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                <span style={{ color:C.navy }}>{lbl}</span><span style={{ color:col, fontWeight:700 }}>{pct}</span>
              </div>
              <div style={{ height:7, background:'#F1F5F9', borderRadius:4 }}>
                <div style={{ height:'100%', width:pct, background:col, borderRadius:4 }}/>
              </div>
            </div>
          ))}
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>Branding Reach</CardTitle>
          <StatRow n={4820}  label="Profile Views (this month)" pct={78} color={C.blue} />
          <StatRow n={312}   label="Followers"                  pct={45} color={C.teal} />
          <StatRow n={96}    label="Job Saves"                  pct={32} color={C.green} />
          <StatRow n={4.2}   label="Avg Rating (out of 5)"      pct={84} color={C.gold} />
        </Card>
      </div>
    </>;
  }

  function PanelBillingPlans() {
    return <>
      <Bc parts={['Employer','Billing & Plans']} />
      <SectionHead title="Billing & Plans 💳" sub="Manage your subscription and invoices" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {[
          { name:'Free',       price:'₹0',     jobs:3,  highlight:false },
          { name:'Pro',        price:'₹4,999', jobs:25, highlight:true  },
          { name:'Enterprise', price:'Custom',  jobs:-1, highlight:false },
        ].map(p=>(
          <Card key={p.name} style={{ marginBottom:0, border: p.highlight ? `2px solid ${C.blue}` : undefined, position:'relative' }}>
            {p.highlight && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:C.blue, color:'#fff', borderRadius:20, padding:'2px 14px', fontSize:11, fontWeight:700 }}>Current Plan</div>}
            <div style={{ fontSize:18, fontWeight:800, color:C.navy, marginBottom:4 }}>{p.name}</div>
            <div style={{ fontSize:26, fontWeight:800, color:C.blue }}>{p.price}<span style={{ fontSize:12, color:'#94A3B8' }}>/mo</span></div>
            <div style={{ fontSize:13, color:'#64748B', marginTop:8 }}>{p.jobs === -1 ? 'Unlimited job posts' : `Up to ${p.jobs} active jobs`}</div>
          </Card>
        ))}
      </div>
      <Card>
        <CardTitle>Recent Invoices</CardTitle>
        <Table head={['Invoice','Date','Amount','Status']} rows={[
          ['INV-2025-06','Jun 2025','₹4,999',<Badge color="green">Paid</Badge>],
          ['INV-2025-05','May 2025','₹4,999',<Badge color="green">Paid</Badge>],
          ['INV-2025-04','Apr 2025','₹4,999',<Badge color="green">Paid</Badge>],
        ]} />
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
      case 'assessments':       return PanelAssessments();
      case 'ai-insights':       return PanelAIInsights();
      case 'saved-searches':    return PanelSavedSearches();
      case 'employer-branding': return PanelEmployerBranding();
      case 'billing-plans':     return PanelBillingPlans();
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
      <div style={{ marginLeft: isMobile ? 0 : SW, marginTop:TH, padding:24, minHeight:`calc(100vh - ${TH}px)`, overflowX:'hidden', boxSizing:'border-box' }}>
        {renderPanel()}
      </div>
      {/* ── AI Chatbot floating widget ── */}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:10001, display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
        {chatOpen && (
          <div style={{ width:340, height:460, background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', border:'1px solid #E0E6EF', display:'flex', flexDirection:'column', marginBottom:10, overflow:'hidden' }}>
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
            <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
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
            <div style={{ padding:'6px 10px', display:'flex', gap:6, overflowX:'auto', borderTop:'1px solid #F1F5F9' }}>
              {['Post a job','Find candidates','Hiring process','Compliance help'].map(s => (
                <button key={s} onClick={() => setChatInput(s)}
                  style={{ flexShrink:0, fontSize:10.5, padding:'4px 10px', borderRadius:20, border:'1px solid #E0E6EF', background:'#F8FAFC', color:'#3D5170', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {s}
                </button>
              ))}
            </div>
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
        <button onClick={() => setChatOpen(o => !o)} style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#7B5CF6,#010E3C)', border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(123,92,246,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, position:'relative' }}>
          {chatOpen ? '✕' : '🤖'}
          {!chatOpen && chatMsgs.filter(m => m.role === 'assistant').length > 1 && (
            <span style={{ position:'absolute', top:0, right:0, width:14, height:14, borderRadius:'50%', background:'#EF4444', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff', fontWeight:700 }}>!</span>
          )}
        </button>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
