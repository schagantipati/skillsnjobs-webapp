import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES, validateSalaryRange, validateText, validatePosInt, validatePositiveNum } from '../utils/validators.js';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import AccountPreferences from '../components/AccountPreferences.jsx';
import { api } from '../api.js';

const SW = 220, TH = 58;
const C = {
  navy:'#0D2137', sidebar:'#010E3C', blue:'#1E5FBF', teal:'#0B7B8C', green:'#1A7C3E',
  gold:'#C8860A', red:'#C0392B', purple:'#6B3FA0',
  pBlue:'#EBF1FB', pGreen:'#E8F5EE', pGold:'#FEF6E4',
  pRed:'#FDECEA', pPurple:'#F0EAFB', pTeal:'#E6F4F6',
};

const NAV = [
  { key:'dashboard',   label:'Dashboard',           section:'Main' },
  { key:'notifications',label:'Notifications',      section:'Main' },
  { key:'profile-info',  label:'Agency Information',section:'Agency Profile' },
  { key:'profile-contact',label:'Contact & Address',section:'Agency Profile' },
  { key:'profile-docs',  label:'Documents & Licenses',section:'Agency Profile' },
  { key:'profile-bank',  label:'Bank Details',      section:'Agency Profile' },
  { key:'jobs-post',   label:'Post a Job',          section:'Job Postings' },
  { key:'jobs-active', label:'Active Jobs',          section:'Job Postings' },
  { key:'jobs-draft',  label:'Drafts',               section:'Job Postings' },
  { key:'jobs-closed', label:'Closed Jobs',          section:'Job Postings' },
  { key:'cand-search', label:'Search Candidates',    section:'Candidates' },
  { key:'cand-shortlisted',label:'Shortlisted',      section:'Candidates' },
  { key:'cand-applications',label:'Applications Received',section:'Candidates' },
  { key:'cand-interview',label:'Interview Pipeline', section:'Candidates' },
  { key:'cand-offer',  label:'Offer Letters',        section:'Candidates' },
  { key:'pl-active',   label:'Active Placements',    section:'Placement Tracker' },
  { key:'pl-completed',label:'Completed Placements', section:'Placement Tracker' },
  { key:'pl-dropout',  label:'Dropout / Withdrawn',  section:'Placement Tracker' },
  { key:'pl-incentive',label:'Incentive Claims',     section:'Placement Tracker' },
  { key:'emp-list',    label:'Registered Employers', section:'Employers' },
  { key:'emp-add',     label:'Add Employer',         section:'Employers' },
  { key:'emp-mou',     label:'MoU / Agreements',    section:'Employers' },
  { key:'emp-demand',  label:'Demand Requests',      section:'Employers' },
  { key:'scheme-pmkvy',label:'PMKVY Placement',      section:'Govt Schemes' },
  { key:'scheme-naps', label:'NAPS / NATS',          section:'Govt Schemes' },
  { key:'scheme-ddugky',label:'DDU-GKY',             section:'Govt Schemes' },
  { key:'scheme-pli',  label:'PLI — Placement Linked',section:'Govt Schemes' },
  { key:'rep-placement',label:'Placement Reports',   section:'Reports' },
  { key:'rep-candidate',label:'Candidate Reports',   section:'Reports' },
  { key:'rep-employer', label:'Employer Reports',    section:'Reports' },
  { key:'rep-monthly', label:'Monthly Summary',      section:'Reports' },
  { key:'rep-incentive',label:'Incentive Reports',   section:'Reports' },
  { key:'helpdesk',    label:'Helpdesk',             section:'Support' },
  { key:'grievance',   label:'Grievance',            section:'Support' },
  { key:'faq',         label:'FAQ',                  section:'Support' },
  { key:'settings',    label:'Account Preferences',  section:'Account' },
];

const SEARCH_INDEX = NAV;

// ── stable helpers (module-level so React never sees new references) ──────────
function Card({ children, style }) {
  return <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.06)', border:'1px solid #e8ecf3', marginBottom:16, ...style }}>{children}</div>;
}
function CardTitle({ children }) {
  return <div style={{ fontWeight:700, fontSize:15, color:C.navy, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>{children}</div>;
}
function SectionHead({ title }) {
  return <div style={{ fontSize:22, fontWeight:800, color:C.navy, marginBottom:18 }}>{title}</div>;
}
function Btn({ children, onClick, style, outline, danger, sm, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{
    padding: sm ? '5px 12px' : '8px 18px',
    borderRadius:8, border: outline ? `1.5px solid ${C.blue}` : 'none',
    background: danger ? C.red : outline ? '#fff' : C.blue,
    color: outline ? C.blue : '#fff',
    fontSize: sm ? 12 : 13, fontWeight:600, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1, ...style,
  }}>{children}</button>;
}
function Badge({ children, color='blue' }) {
  const map = { blue:[C.pBlue,C.blue], green:[C.pGreen,C.green], gold:[C.pGold,C.gold], red:[C.pRed,C.red], purple:[C.pPurple,C.purple], teal:[C.pTeal,C.teal] };
  const [bg, fg] = map[color] || map.blue;
  return <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:10, fontSize:11, fontWeight:600, background:bg, color:fg }}>{children}</span>;
}
function KpiCard({ val, label, sub, color }) {
  return <div style={{ background:'#fff', borderRadius:12, padding:18, border:'1px solid #e8ecf3', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
    <div style={{ fontSize:28, fontWeight:800, color: color||C.navy, lineHeight:1 }}>{val}</div>
    <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</div>
    <div style={{ fontSize:11, marginTop:2, fontWeight:600, color: color||C.blue }}>{sub}</div>
  </div>;
}
function ProgBar({ pct, color }) {
  return <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <div style={{ background:'#e8ecf3', borderRadius:6, height:7, flex:1 }}>
      <div style={{ height:7, borderRadius:6, width:`${pct}%`, background: color||C.blue }} />
    </div>
    <span style={{ fontSize:12, minWidth:30 }}>{pct}%</span>
  </div>;
}
function Table({ head, rows }) {
  return <table style={{ width:'100%', borderCollapse:'collapse' }}>
    <thead><tr>{head.map(h=><th key={h} style={{ textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'.05em', textTransform:'uppercase', padding:'8px 10px', borderBottom:'2px solid #e8ecf3' }}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={i} style={{ background: i%2===0?'#fff':'#fafbfc' }}>{r.map((c,j)=><td key={j} style={{ padding:'10px', borderBottom:'1px solid #f0f2f5', fontSize:13 }}>{c}</td>)}</tr>)}</tbody>
  </table>;
}
function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>{label}</label>
    {children}
  </div>;
}
function Inp({ placeholder, defaultValue, type='text' }) {
  return <input type={type} placeholder={placeholder} defaultValue={defaultValue}
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
function Sel({ options }) {
  return <select style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }}>
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
  const id = `tgl-${Math.random()}`;
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div>
      <div style={{ fontSize:13, color:'#374151' }}>{label}</div>
      <div style={{ fontSize:11, color:'#94a3b8' }}>{sub}</div>
    </div>
    <label style={{ position:"relative", display:"inline-block", width:44, height:24, flexShrink:0 }}><input type="checkbox" defaultChecked={defaultChecked} style={{ opacity:0, width:0, height:0, position:"absolute" }} /><span className="snj-track"></span></label>
  </div>;
}
function TlItem({ dot, title, meta }) {
  return <div style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ width:10, height:10, borderRadius:'50%', background:dot, flexShrink:0, marginTop:4 }} />
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{title}</div>
      <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:2 }}>{meta}</div>
    </div>
  </div>;
}
function Bc({ parts }) {
  return <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>{parts.join(' › ')}</div>;
}

export default function PlacementPartnerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dbStats, setDbStats] = useState({});
  const [menuPerms, setMenuPerms] = useState({});
  const searchRef = useRef(null);

  // ── Placement & Job state ──
  const [myPlacements, setMyPlacements] = useState([]);
  const [placementsLoaded, setPlacementsLoaded] = useState(false);
  const [myJobs, setMyJobs] = useState([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [plForm, setPlForm] = useState({ candidate_id:'', job_title:'', company:'', location:'', ctc:'', placement_date:'', status:'placed' });
  const [plSaving, setPlSaving] = useState(false);
  const [plMsg, setPlMsg] = useState('');
  const [showAddPlacement, setShowAddPlacement] = useState(false);
  const [candidateList, setCandidateList] = useState([]);
  const [jobForm, setJobForm] = useState({ title:'', description:'', required_skills:'', location:'', job_type:'Full-time', salary_min:'', salary_max:'' });
  const [jobSaving, setJobSaving] = useState(false);
  const [jobMsg, setJobMsg] = useState('');
  const [allApps, setAllApps] = useState([]);
  const [appsLoaded, setAppsLoaded] = useState(false);

  // ── Agency Info state ──
  const [agInfo, setAgInfo] = useState({ org_name:'', cin:'', gstin:'', pan:'', tan:'', website:'', phone:'', email:'' });
  const [agInfoLoaded, setAgInfoLoaded] = useState(false);
  const [agInfoSaving, setAgInfoSaving] = useState(false);
  const [agInfoMsg, setAgInfoMsg] = useState('');
  const [agInfoErrors, setAgInfoErrors] = useState({});

  function setAgErr(k, msg) { setAgInfoErrors(e => ({ ...e, [k]: msg })); }
  function clearAgErr(k) { setAgInfoErrors(e => ({ ...e, [k]: '' })); }

  // ── Contact & Address state ──
  const [contact, setContact] = useState({ spoc_name:'', phone:'', email:'', address_line1:'', address_line2:'', city:'', state_name:'', pincode:'' });
  const [contactLoaded, setContactLoaded] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactMsg, setContactMsg] = useState('');

  function loadContact() {
    if (contactLoaded) return;
    api.me().then(u => {
      setContact({
        spoc_name:    u.spoc_name     || '',
        phone:        u.phone         || '',
        email:        u.email         || '',
        address_line1:u.address_line1 || '',
        address_line2:u.address_line2 || '',
        city:         u.city          || '',
        state_name:   u.state_name    || '',
        pincode:      u.pincode       || '',
      });
      setContactLoaded(true);
    }).catch(() => {});
  }

  async function saveContact() {
    setContactSaving(true); setContactMsg('');
    try {
      await api.updateMe({
        spoc_name:     contact.spoc_name.trim()     || null,
        phone:         contact.phone.replace(/\D/g,'') || null,
        email:         contact.email.trim()         || null,
        address_line1: contact.address_line1.trim() || null,
        address_line2: contact.address_line2.trim() || null,
        city:          contact.city.trim()          || null,
        state_name:    contact.state_name.trim()    || null,
        pincode:       contact.pincode.trim()       || null,
      });
      setContactMsg('Saved successfully');
    } catch { setContactMsg('Save failed. Please try again.'); }
    setContactSaving(false);
  }

  // ── Interview scheduling state ──
  const [ppInterview, setPpInterview] = useState({ candidate_name:'', job_role:'', date:'', time:'', mode:'In-person', interviewer:'' });
  const [ppInterviewSaving, setPpInterviewSaving] = useState(false);
  const [ppInterviewMsg, setPpInterviewMsg] = useState('');
  const [scheduledInterviews, setScheduledInterviews] = useState(() => { try { return JSON.parse(localStorage.getItem('snj_pp_interviews') || '[]'); } catch { return []; } });

  function scheduleInterview() {
    if (!ppInterview.candidate_name.trim() || !ppInterview.date || !ppInterview.time) {
      setPpInterviewMsg('Candidate name, date and time are required.'); return;
    }
    const nameErr = fieldValidate('name', ppInterview.candidate_name);
    if (nameErr) { setPpInterviewMsg(nameErr); return; }
    const entry = { ...ppInterview, id: Date.now(), scheduled_at: new Date().toISOString() };
    const updated = [entry, ...scheduledInterviews];
    setScheduledInterviews(updated);
    localStorage.setItem('snj_pp_interviews', JSON.stringify(updated));
    setPpInterview({ candidate_name:'', job_role:'', date:'', time:'', mode:'In-person', interviewer:'' });
    setPpInterviewMsg('✅ Interview scheduled.');
  }

  // ── Offer letter state ──
  const [ppOffer, setPpOffer] = useState({ candidate_name:'', job_role:'', joining_date:'', ctc:'' });
  const [ppOfferSaving, setPpOfferSaving] = useState(false);
  const [ppOfferMsg, setPpOfferMsg] = useState('');
  const [generatedOffers, setGeneratedOffers] = useState(() => { try { return JSON.parse(localStorage.getItem('snj_pp_offers') || '[]'); } catch { return []; } });

  function generateOffer() {
    if (!ppOffer.candidate_name.trim() || !ppOffer.job_role.trim()) {
      setPpOfferMsg('Candidate and job role are required.'); return;
    }
    const nameErr = fieldValidate('name', ppOffer.candidate_name);
    if (nameErr) { setPpOfferMsg(nameErr); return; }
    if (ppOffer.ctc) {
      const ctcErr = validateText(String(ppOffer.ctc), 'CTC', { min: 1, max: 20 });
      if (ctcErr) { setPpOfferMsg('CTC: ' + ctcErr); return; }
    }
    const entry = { ...ppOffer, id: Date.now(), status: 'Generated', created_at: new Date().toISOString() };
    const updated = [entry, ...generatedOffers];
    setGeneratedOffers(updated);
    localStorage.setItem('snj_pp_offers', JSON.stringify(updated));
    setPpOffer({ candidate_name:'', job_role:'', joining_date:'', ctc:'' });
    setPpOfferMsg('✅ Offer letter generated & sent.');
  }

  // ── Add Employer state ──
  const [empForm, setEmpForm] = useState({ company_name:'', sector:'IT-ITES', contact_person:'', designation:'', mobile:'', email:'', city:'', state_name:'Maharashtra', vacancies:'', nsqf_level:'Any', notes:'' });
  const [empSaving, setEmpSaving] = useState(false);
  const [empMsg, setEmpMsg] = useState('');
  const [addedEmployers, setAddedEmployers] = useState(() => { try { return JSON.parse(localStorage.getItem('snj_pp_employers') || '[]'); } catch { return []; } });

  function addEmployer() {
    if (!empForm.company_name.trim()) { setEmpMsg('Company name is required.'); return; }
    const compErr = validateText(empForm.company_name, 'Company name', { min: 2, max: 200 });
    if (compErr) { setEmpMsg(compErr); return; }
    if (empForm.contact_person) { const cpErr = fieldValidate('name', empForm.contact_person); if (cpErr) { setEmpMsg('Contact person: ' + cpErr); return; } }
    if (empForm.email) { const eErr = fieldValidate('email', empForm.email); if (eErr) { setEmpMsg(eErr); return; } }
    if (empForm.mobile) { const mErr = fieldValidate('mobile', empForm.mobile.replace(/\D/g,'')); if (mErr) { setEmpMsg(mErr); return; } }
    if (empForm.vacancies) { const vErr = validatePosInt(empForm.vacancies, 'Vacancies', 10000); if (vErr) { setEmpMsg(vErr); return; } }
    setEmpSaving(true);
    const entry = { ...empForm, id: Date.now(), added_at: new Date().toISOString() };
    const updated = [entry, ...addedEmployers];
    setAddedEmployers(updated);
    localStorage.setItem('snj_pp_employers', JSON.stringify(updated));
    setEmpForm({ company_name:'', sector:'IT-ITES', contact_person:'', designation:'', mobile:'', email:'', city:'', state_name:'Maharashtra', vacancies:'', nsqf_level:'Any', notes:'' });
    setEmpMsg('✅ Employer added successfully.');
    setEmpSaving(false);
  }

  // ── MoU state ──
  const [mouForm, setMouForm] = useState({ employer:'', mou_date:'', validity:'12', positions:'', file_name:'' });
  const [mouMsg, setMouMsg] = useState('');
  const [uploadedMous, setUploadedMous] = useState(() => { try { return JSON.parse(localStorage.getItem('snj_pp_mous') || '[]'); } catch { return []; } });

  function uploadMou() {
    if (!mouForm.employer || mouForm.employer === 'Select Employer') { setMouMsg('Please select an employer.'); return; }
    if (!mouForm.mou_date) { setMouMsg('MoU date is required.'); return; }
    if (new Date(mouForm.mou_date) > new Date()) { setMouMsg('MoU date cannot be a future date.'); return; }
    if (mouForm.positions) { const posErr = validatePosInt(mouForm.positions, 'Positions', 10000); if (posErr) { setMouMsg(posErr); return; } }
    const entry = { ...mouForm, id: Date.now(), uploaded_at: new Date().toISOString(), status: 'Active' };
    const updated = [entry, ...uploadedMous];
    setUploadedMous(updated);
    localStorage.setItem('snj_pp_mous', JSON.stringify(updated));
    setMouForm({ employer:'', mou_date:'', validity:'12', positions:'', file_name:'' });
    setMouMsg('✅ MoU uploaded successfully.');
  }

  // ── Incentive claim state ──
  const [claimForm, setClaimForm] = useState({ scheme:'PMKVY Placement Linked Incentive', candidate:'', employer:'', joining_date:'' });
  const [claimMsg, setClaimMsg] = useState('');
  const [claims, setClaims] = useState(() => { try { return JSON.parse(localStorage.getItem('snj_pp_claims') || '[]'); } catch { return []; } });

  function submitClaim() {
    if (!claimForm.candidate || claimForm.candidate === 'Select Candidate') { setClaimMsg('Please select a candidate.'); return; }
    const entry = { ...claimForm, id: Date.now(), status: 'Submitted', submitted_at: new Date().toISOString() };
    const updated = [entry, ...claims];
    setClaims(updated);
    localStorage.setItem('snj_pp_claims', JSON.stringify(updated));
    setClaimForm({ scheme:'PMKVY Placement Linked Incentive', candidate:'', employer:'', joining_date:'' });
    setClaimMsg('✅ Claim submitted successfully.');
  }

  // ── Candidate search state ──
  const [searchFilters, setSearchFilters] = useState({ sector:'All', nsqf:'All', location:'', qualification:'Any' });
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [shortlistCandidate, setShortlistCandidate] = useState(null); // { id, name }
  const [shortlistForm, setShortlistForm] = useState({ job_title:'', company:'', location:'' });
  const [shortlisting, setShortlisting] = useState(false);
  const [shortlistMsg, setShortlistMsg] = useState('');

  async function saveShortlist() {
    if (!shortlistForm.job_title.trim()) { setShortlistMsg('❌ Job title is required.'); return; }
    setShortlisting(true);
    try {
      await api.createPlacement({ candidate_id: shortlistCandidate.id, job_title: shortlistForm.job_title.trim(), company: shortlistForm.company.trim(), location: shortlistForm.location.trim(), status: 'shortlisted' });
      setShortlistMsg('✅ Candidate shortlisted!');
      setShortlistCandidate(null);
      setShortlistForm({ job_title:'', company:'', location:'' });
      refreshPlacements();
    } catch { setShortlistMsg('❌ Failed to shortlist.'); }
    setShortlisting(false);
  }

  async function searchCandidates() {
    setSearching(true);
    try {
      const results = await api.candidates();
      let filtered = results || [];
      if (searchFilters.sector !== 'All') filtered = filtered.filter(c => (c.sector || '').includes(searchFilters.sector));
      if (searchFilters.location.trim()) filtered = filtered.filter(c => (c.city || c.location || '').toLowerCase().includes(searchFilters.location.toLowerCase()));
      setSearchResults(filtered);
    } catch { setSearchResults([]); }
    setSearching(false);
  }

  // ── Bank Details state ──
  const [bank, setBank] = useState({ bank_account_name:'', bank_account_number:'', bank_ifsc:'', bank_name:'', bank_branch:'' });
  const [bankLoaded, setBankLoaded] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState('');

  function loadBank() {
    if (bankLoaded) return;
    api.me().then(u => {
      setBank({
        bank_account_name:   u.bank_account_name   || '',
        bank_account_number: u.bank_account_number || '',
        bank_ifsc:           u.bank_ifsc           || '',
        bank_name:           u.bank_name           || '',
        bank_branch:         u.bank_branch         || '',
      });
      setBankLoaded(true);
    }).catch(() => {});
  }

  async function saveBank() {
    setBankSaving(true); setBankMsg('');
    try {
      await api.updateMe({
        bank_account_name:   bank.bank_account_name.trim()   || null,
        bank_account_number: bank.bank_account_number.trim() || null,
        bank_ifsc:           bank.bank_ifsc.toUpperCase().trim() || null,
        bank_name:           bank.bank_name.trim()           || null,
        bank_branch:         bank.bank_branch.trim()         || null,
      });
      setBankMsg('Saved successfully');
    } catch { setBankMsg('Save failed. Please try again.'); }
    setBankSaving(false);
  }

  function loadAgInfo() {
    if (agInfoLoaded) return;
    api.me().then(u => {
      setAgInfo({
        org_name: u.org_name || '',
        cin:      u.cin      || '',
        gstin:    u.gstin    || '',
        pan:      u.pan      || '',
        tan:      u.tan      || '',
        website:  u.website  || '',
        phone:    u.phone    || '',
        email:    u.email    || '',
      });
      setAgInfoLoaded(true);
    }).catch(() => {});
  }

  async function saveAgInfo() {
    const errs = {};
    if (!agInfo.org_name.trim()) errs.org_name = 'Agency name is required';
    if (agInfo.cin)    { const e = fieldValidate('cin', agInfo.cin);    if (e) errs.cin     = e; }
    if (agInfo.gstin  && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(agInfo.gstin.toUpperCase())) errs.gstin   = 'Invalid GSTIN format';
    if (agInfo.pan    && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(agInfo.pan.toUpperCase()))                      errs.pan     = 'Invalid PAN format';
    if (agInfo.tan    && !/^[A-Z]{4}\d{5}[A-Z]{1}$/.test(agInfo.tan.toUpperCase()))                      errs.tan     = 'Invalid TAN — format: PDES03028F (10 chars)';
    if (agInfo.website && !/^https?:\/\/.+\..+/.test(agInfo.website))                                    errs.website = 'Enter a valid URL (e.g. https://example.com)';
    if (agInfo.phone  && !/^[6-9]\d{9}$/.test(agInfo.phone.replace(/\D/g,'')))                           errs.phone   = 'Enter a valid 10-digit mobile number';
    if (agInfo.email  && !/^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/.test(agInfo.email.trim()))        errs.email   = 'Enter a valid email address';
    if (Object.keys(errs).length) { setAgInfoErrors(errs); return; }
    setAgInfoSaving(true); setAgInfoMsg('');
    try {
      await api.updateMe({
        org_name: agInfo.org_name.trim(),
        cin:      agInfo.cin.toUpperCase().trim()   || null,
        gstin:    agInfo.gstin.toUpperCase().trim() || null,
        pan:      agInfo.pan.toUpperCase().trim()   || null,
        tan:      agInfo.tan.toUpperCase().trim()   || null,
        website:  agInfo.website.trim()             || null,
        phone:    agInfo.phone.replace(/\D/g,'')    || null,
        email:    agInfo.email.trim()               || null,
      });
      setAgInfoMsg('Saved successfully');
    } catch { setAgInfoMsg('Save failed. Please try again.'); }
    setAgInfoSaving(false);
  }

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [panel]); // eslint-disable-line

  useEffect(() => {
    api.getRolePermissions().then(all => setMenuPerms(all['placement_agency'] || {})).catch(() => {});
  }, []);
  const PERM_LOCKED = new Set(['dashboard','notifications','settings','profile-info','profile-contact','profile-docs','profile-bank']);
  const allowed = k => !k || PERM_LOCKED.has(k) || menuPerms[k] !== false;
  useEffect(() => { if (Object.keys(menuPerms).length && !allowed(panel)) setPanel('dashboard'); }, [menuPerms]); // eslint-disable-line

  useEffect(() => {
    api.dashboardStats().then(setDbStats).catch(() => {});
    api.myPlacements().then(p => { setMyPlacements(p); setPlacementsLoaded(true); }).catch(() => {});
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
  }, []);

  function loadPlacements() {
    if (placementsLoaded) return;
    api.myPlacements().then(p => { setMyPlacements(p); setPlacementsLoaded(true); }).catch(() => {});
  }
  function refreshPlacements() {
    api.myPlacements().then(p => { setMyPlacements(p); setPlacementsLoaded(true); }).catch(() => {});
  }
  function loadJobs() {
    if (jobsLoaded) return;
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
  }
  function refreshJobs() {
    api.myJobs().then(j => { setMyJobs(j); setJobsLoaded(true); }).catch(() => {});
  }
  function loadCandidates() {
    if (candidateList.length) return;
    api.candidates().then(setCandidateList).catch(() => {});
  }
  function loadApps() {
    if (appsLoaded) return;
    refreshApps();
  }
  function refreshApps() {
    api.myJobs().then(jobs => {
      Promise.all(jobs.map(j => api.jobApplicants(j.id).then(apps => apps.map(a => ({ ...a, job_title: j.title }))).catch(() => [])))
        .then(all => { setAllApps(all.flat()); setAppsLoaded(true); });
    }).catch(() => {});
  }

  function toggleMenu(id) {
    setOpenMenus(m => ({ ...m, [id]: !m[id] }));
  }
  function go(key) {
    setPanel(key);
    if (['pl-active','pl-completed','pl-dropout'].includes(key)) { loadPlacements(); loadCandidates(); }
    if (['jobs-active','jobs-draft','jobs-closed'].includes(key)) loadJobs();
    if (key === 'cand-search') loadCandidates();
    if (['cand-applications','cand-interview'].includes(key)) loadApps();
    if (key === 'profile-info') loadAgInfo();
    if (key === 'profile-contact') loadContact();
    if (key === 'profile-bank') loadBank();
  }

  function handleLogout() { logout(); navigate('/'); }

  const navSearchResults = searchQ.trim()
    ? SEARCH_INDEX.filter(n => n.label.toLowerCase().includes(searchQ.toLowerCase()) || n.section.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  // ── SIDEBAR ────────────────────────────────────────────────────────────────
  function Sidebar() {
    function NavItem({ icon, label, id, badge, onClick, active, permKey }) {
      if (permKey && !allowed(permKey)) return null;
      return <div onClick={onClick} style={{
        padding:'9px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:10,
        color: active ? '#fff' : 'rgba(255,255,255,.75)',
        background: active ? C.blue : 'transparent', transition:'.15s',
      }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,.07)'; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
        <span style={{ width:20, textAlign:'center', fontSize:15, flexShrink:0 }}>{icon}</span>
        <span style={{ flex:1, fontSize:13.5, fontWeight:500 }}>{label}</span>
        {badge && <span style={{ background:C.red, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{badge}</span>}
        {id && <span style={{ fontSize:10, transition:'.2s', transform: openMenus[id] ? 'rotate(90deg)' : 'none', display:'inline-block' }}>›</span>}
      </div>;
    }
    function Sub({ id, children }) {
      return openMenus[id] ? <div style={{ paddingLeft:0 }}>{children}</div> : null;
    }
    function SubItem({ label, k }) {
      if (!allowed(k)) return null;
      return <div onClick={()=>go(k)} style={{
        padding:'7px 18px 7px 48px', cursor:'pointer', fontSize:12.5,
        color: panel===k ? C.blue : 'rgba(255,255,255,.55)', fontWeight: panel===k ? 600 : 400, transition:'.15s',
      }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#fff'; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color = panel===k ? C.blue : 'rgba(255,255,255,.55)'; }}>
        · {label}
      </div>;
    }
    const label = s => <div style={{ padding:'18px 18px 5px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.35)', letterSpacing:'.08em', textTransform:'uppercase' }}>{s}</div>;
    return (
      <>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199 }} />
        )}
        <div style={{ position:'fixed', top:0, left:0, width:SW, height:'100vh', background:C.sidebar, overflowY:'hidden', zIndex:200, display:'flex', flexDirection:'column', transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)', transition:'transform 0.25s ease' }}>
        <div style={{ padding:'0 16px', height:TH, display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,.1)', flexShrink:0, minHeight:TH }}>
          <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #e0e8f4', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}><img src="/logo.png" alt="Skills n Jobs" style={{ width:34, height:34, objectFit:'contain' }} /></div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14.5, lineHeight:1.2 }}>SkillsNJobs</div>
            <div style={{ color:'rgba(255,255,255,.5)', fontSize:10 }}>PLACEMENT PARTNER</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {label('Main')}
        <NavItem icon="🏠" label="Dashboard" active={panel==='dashboard'} onClick={()=>go('dashboard')} />
        <NavItem icon="🔔" label="Notifications" active={panel==='notifications'} onClick={()=>go('notifications')} />

        {label('My Profile')}
        <NavItem icon="🏢" label="Agency Profile" id="profile" onClick={()=>toggleMenu('profile')} />
        <Sub id="profile">
          <SubItem label="Agency Information" k="profile-info" />
          <SubItem label="Contact & Address" k="profile-contact" />
          <SubItem label="Documents & Licenses" k="profile-docs" />
          <SubItem label="Bank Details" k="profile-bank" />
        </Sub>

        {label('Job Management')}
        <NavItem icon="📋" label="Job Postings" id="jobs" onClick={()=>toggleMenu('jobs')} />
        <Sub id="jobs">
          <SubItem label="Post a Job" k="jobs-post" />
          <SubItem label="Active Jobs" k="jobs-active" />
          <SubItem label="Drafts" k="jobs-draft" />
          <SubItem label="Closed Jobs" k="jobs-closed" />
        </Sub>

        {label('Candidate Management')}
        <NavItem icon="👥" label="Candidates" id="candidates" onClick={()=>toggleMenu('candidates')} />
        <Sub id="candidates">
          <SubItem label="Search Candidates" k="cand-search" />
          <SubItem label="Shortlisted" k="cand-shortlisted" />
          <SubItem label="Applications Received" k="cand-applications" />
          <SubItem label="Interview Pipeline" k="cand-interview" />
          <SubItem label="Offer Letters" k="cand-offer" />
        </Sub>

        {label('Placements')}
        <NavItem icon="🎯" label="Placement Tracker" id="placements" onClick={()=>toggleMenu('placements')} />
        <Sub id="placements">
          <SubItem label="Active Placements" k="pl-active" />
          <SubItem label="Completed" k="pl-completed" />
          <SubItem label="Dropout / Withdrawn" k="pl-dropout" />
          <SubItem label="Incentive Claims" k="pl-incentive" />
        </Sub>

        {label('Employer Connect')}
        <NavItem icon="🏭" label="Employers" id="employers" onClick={()=>toggleMenu('employers')} />
        <Sub id="employers">
          <SubItem label="Registered Employers" k="emp-list" />
          <SubItem label="Add Employer" k="emp-add" />
          <SubItem label="MoU / Agreements" k="emp-mou" />
          <SubItem label="Demand Requests" k="emp-demand" />
        </Sub>

        {label('Schemes & Incentives')}
        <NavItem icon="🏛️" label="Govt Schemes" id="schemes" onClick={()=>toggleMenu('schemes')} />
        <Sub id="schemes">
          <SubItem label="PMKVY Placement" k="scheme-pmkvy" />
          <SubItem label="NAPS / NATS" k="scheme-naps" />
          <SubItem label="DDU-GKY" k="scheme-ddugky" />
          <SubItem label="PLI — Placement Linked" k="scheme-pli" />
        </Sub>

        {label('Reports & Analytics')}
        <NavItem icon="📊" label="Reports" id="reports" onClick={()=>toggleMenu('reports')} />
        <Sub id="reports">
          <SubItem label="Placement Reports" k="rep-placement" />
          <SubItem label="Candidate Reports" k="rep-candidate" />
          <SubItem label="Employer Reports" k="rep-employer" />
          <SubItem label="Monthly Summary" k="rep-monthly" />
          <SubItem label="Incentive Reports" k="rep-incentive" />
        </Sub>

        {label('Support')}
        <NavItem icon="🎧" label="Helpdesk" permKey="helpdesk" active={panel==='helpdesk'} onClick={()=>go('helpdesk')} />
        <NavItem icon="📣" label="Grievance" permKey="grievance" active={panel==='grievance'} onClick={()=>go('grievance')} />
        <NavItem icon="❓" label="FAQ" permKey="faq" active={panel==='faq'} onClick={()=>go('faq')} />

        {label('Account')}
        <NavItem icon="⚙️" label="Account Preferences" active={panel==='settings'} onClick={()=>go('settings')} />
        </div>
      </div>
      </>
    );
  }

  // ── TOPBAR ─────────────────────────────────────────────────────────────────
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left: isMobile ? 0 : SW, right:0, height:TH, background:'#fff', borderBottom:'1px solid #e4e8ef', display:'flex', alignItems:'center', padding:'0 20px', gap:12, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(v => !v)} style={{ width:38, height:38, borderRadius:8, border:'none', background:'#f1f5f9', fontSize:20, cursor:'pointer', flexShrink:0 }}>☰</button>
        )}
        <div style={{ flex:1, maxWidth:400, position:'relative' }}>
          <input
            ref={searchRef}
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            onFocus={()=>setSearchOpen(true)}
            onBlur={()=>setTimeout(()=>setSearchOpen(false),150)}
            placeholder="Search jobs, candidates, employers…"
            style={{ width:'100%', padding:'8px 12px 8px 36px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#f6f8fc' }}
          />
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', opacity:.45, fontSize:14 }}>🔍</span>
          {searchOpen && navSearchResults.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1.5px solid #dde2eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:500, maxHeight:260, overflowY:'auto' }}>
              {navSearchResults.map(r => (
                <div key={r.key} onMouseDown={()=>{ go(r.key); setSearchQ(''); setSearchOpen(false); }}
                  style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, borderBottom:'1px solid #f0f2f5' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#EBF1FB'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  {r.label}
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{r.section}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:'auto' }}>
          <div style={{ cursor:'pointer', padding:6, position:'relative' }} onClick={()=>go('notifications')}>
            🔔
          </div>
          <div style={{ width:38, height:38, borderRadius:'50%', background:C.blue, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15 }}>
            {(user?.org_name || 'PP').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{ lineHeight:1.25 }}>
            <div style={{ fontWeight:700, fontSize:13.5 }}>{user?.org_name || '—'}</div>
            <div style={{ fontSize:11.5, color:'#64748b' }}>ID: PA-{String(user?.id || '').padStart(6,'0')}</div>
          </div>
          <button onClick={handleLogout} style={{ background:C.blue, color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>⏻ Sign Out</button>
        </div>
      </div>
    );
  }

  // ── PANELS ─────────────────────────────────────────────────────────────────
  function PanelDashboard() {
    return <>
      {myPlacements.length === 0 && <Alert icon="⚡" type="info">Complete your agency profile and start adding placements to track your progress.</Alert>}
      <SectionHead title={`Welcome back, ${user?.org_name || ''}! 🎯`} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val={dbStats.totalPlacements ?? '—'} label="Total Placements" sub="All time" />
        <KpiCard val={dbStats.placedThisYear ?? '—'} label="Placed This Year" sub={new Date().getFullYear()} color={C.blue} />
        <KpiCard val={dbStats.joinedCount ?? '—'} label="Joined" sub="Confirmed joinings" color={C.teal} />
        <KpiCard val={dbStats.openJobs ?? '—'} label="Open Jobs" sub="Platform-wide" color={C.green} />
        <KpiCard val={dbStats.avgCTC ? `₹${dbStats.avgCTC}L` : '—'} label="Avg CTC" sub="Placed candidates" color={C.gold} />
        <KpiCard val={dbStats.totalPlacements && dbStats.candidates ? `${Math.min(100, Math.round(dbStats.totalPlacements/dbStats.candidates*100))}%` : '—'} label="Placement Rate" sub="Placed vs candidates" color={C.purple} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[['📋','Post a Job','jobs-post'],['🔍','Find Candidates','cand-search'],['🗓️','Interviews Today','cand-interview'],['💰','Claim Incentive','pl-incentive']].map(([icon,lbl,k])=>(
          <div key={k} onClick={()=>go(k)} style={{ background:'#fff', border:'1.5px solid #e8ecf3', borderRadius:12, padding:'18px 10px', textAlign:'center', cursor:'pointer' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.background='#EBF1FB'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8ecf3'; e.currentTarget.style.background='#fff'; }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{lbl}</div>
          </div>
        ))}
      </div>
      <Grid cols={2}>
        <Card>
          <CardTitle>📋 Recent Job Postings</CardTitle>
          {myJobs.length === 0
            ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No job postings yet</div>
            : <Table head={['Job Title','Location','Status']} rows={myJobs.slice(0,5).map(j=>[
                j.title || '—',
                j.location  || '—',
                <Badge color={j.status==='open'?'green':j.status==='draft'?'gold':'red'}>
                  {j.status==='open'?'Active':j.status==='draft'?'Draft':'Closed'}
                </Badge>
              ])} />
          }
        </Card>
        <Card>
          <CardTitle>📈 Placement Funnel</CardTitle>
          {(()=>{
            const total  = myPlacements.length;
            const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status)).length;
            const funnel = [
              [total,   'Total Candidates', 100,   C.blue],
              [placed,  'Placed / Joined',  total?Math.round(placed/total*100):0, C.green],
            ];
            if (total === 0) return <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No placement data yet</div>;
            return funnel.map(([n,l,p,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.navy, minWidth:52 }}>{n}</div>
                <div style={{ fontSize:13, color:'#374151', flex:1 }}>{l}</div>
                <div style={{ width:160 }}><ProgBar pct={p} color={c} /></div>
              </div>
            ));
          })()}
        </Card>
      </Grid>
      <Grid cols={2}>
        <Card>
          <CardTitle>🔔 Recent Placements</CardTitle>
          {myPlacements.length === 0
            ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No recent activity</div>
            : myPlacements.slice(0,5).map((p,i)=>(
                <TlItem key={i} dot={p.status==='joined'?C.green:C.blue}
                  title={`${p.candidate_name||'Candidate'} — ${p.job_title||'Role'} at ${p.company||'Employer'}`}
                  meta={p.placement_date ? new Date(p.placement_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''} />
              ))
          }
        </Card>
        <Card>
          <CardTitle>🏆 Top Employers by Placements</CardTitle>
          {(()=>{
            const counts = {};
            myPlacements.forEach(p=>{ if(p.company) counts[p.company]=(counts[p.company]||0)+1; });
            const rows = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5)
              .map(([emp,n])=>[emp, n, <Badge color="blue">{n} placed</Badge>]);
            return rows.length === 0
              ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No employer data yet</div>
              : <Table head={['Employer','Placed','']} rows={rows} />;
          })()}
        </Card>
      </Grid>
    </>;
  }

  function PanelNotifications() {
    const recent = myPlacements.slice(0,7);
    return <>
      <Bc parts={['Notifications']} />
      <SectionHead title="Notifications 🔔" />
      <Card>
        {recent.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No notifications yet</div>
          : recent.map((p,i) => (
              <TlItem key={i} dot={p.status==='joined'?C.green:C.blue}
                title={`${p.candidate_name||'Candidate'} — ${p.job_title||'Role'} at ${p.company||'Employer'} (${p.status})`}
                meta={p.placement_date ? new Date(p.placement_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) + ' · Placements' : 'Placements'} />
            ))
        }
      </Card>
    </>;
  }

  function PanelProfileInfo() {
    const inp = (field, opts = {}) => {
      const hasErr = !!agInfoErrors[field];
      return (
        <input
          value={agInfo[field]}
          onChange={e => { setAgInfo(a => ({ ...a, [field]: opts.upper ? e.target.value.toUpperCase() : e.target.value })); clearAgErr(field); }}
          onBlur={opts.onBlur || undefined}
          placeholder={opts.placeholder || ''}
          maxLength={opts.max}
          style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${hasErr ? '#dc2626' : '#dde2eb'}`, borderRadius:8, fontSize:13.5, outline:'none', boxSizing:'border-box' }}
        />
      );
    };
    const ErrMsg = ({ f }) => agInfoErrors[f] ? <div style={{ fontSize:11.5, color:'#dc2626', marginTop:3 }}>{agInfoErrors[f]}</div> : null;

    return <>
      <Bc parts={['Agency Profile','Agency Information']} />
      <SectionHead title="Agency Information 🏢" />
      {!agInfoLoaded && <div style={{ color:'#64748b', padding:'16px 0' }}>Loading…</div>}
      {agInfoLoaded && <Card>
        <Field label="Agency Name *">
          {inp('org_name', { placeholder:'Full registered name of the agency',
            onBlur: () => !agInfo.org_name.trim() && setAgErr('org_name','Agency name is required') })}
          <ErrMsg f="org_name" />
        </Field>
        <Grid>
          <Field label="CIN Number">
            {inp('cin', { upper:true, placeholder:'e.g. U74999MH2021PTC000001', max:21,
              onBlur: () => { const e = fieldValidate('cin', agInfo.cin); if (e) setAgErr('cin', e); } })}
            <ErrMsg f="cin" />
          </Field>
          <Field label="GST Number">
            {inp('gstin', { upper:true, placeholder:'e.g. 27AAAPL1234C1ZV', max:15,
              onBlur: () => { const v = agInfo.gstin.toUpperCase(); if (v && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(v)) setAgErr('gstin','Invalid GSTIN format'); } })}
            <ErrMsg f="gstin" />
          </Field>
        </Grid>
        <Grid>
          <Field label="PAN Number">
            {inp('pan', { upper:true, placeholder:'e.g. AAAPL1234C', max:10,
              onBlur: () => { const v = agInfo.pan.toUpperCase(); if (v && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(v)) setAgErr('pan','Invalid PAN format'); } })}
            <ErrMsg f="pan" />
          </Field>
          <Field label="TAN">
            {inp('tan', { upper:true, placeholder:'e.g. PDES03028F', max:10,
              onBlur: () => { const v = agInfo.tan.toUpperCase(); if (v && !/^[A-Z]{4}\d{5}[A-Z]{1}$/.test(v)) setAgErr('tan','Invalid TAN — format: PDES03028F (10 chars)'); } })}
            <ErrMsg f="tan" />
          </Field>
        </Grid>
        <Grid>
          <Field label="Website URL">
            {inp('website', { placeholder:'https://www.youragency.com',
              onBlur: () => { if (agInfo.website && !/^https?:\/\/.+\..+/.test(agInfo.website)) setAgErr('website','Enter a valid URL (e.g. https://example.com)'); } })}
            <ErrMsg f="website" />
          </Field>
        </Grid>
        <Grid>
          <Field label="Phone Number">
            <input
              value={agInfo.phone}
              onChange={e => { setAgInfo(a => ({ ...a, phone: e.target.value.replace(/\D/g,'').slice(0,10) })); clearAgErr('phone'); }}
              onBlur={() => { const v = agInfo.phone.replace(/\D/g,''); if (v && !/^[6-9]\d{9}$/.test(v)) setAgErr('phone','Enter a valid 10-digit mobile number'); }}
              placeholder="e.g. 9876543210"
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${agInfoErrors.phone ? '#dc2626' : '#dde2eb'}`, borderRadius:8, fontSize:13.5, outline:'none', boxSizing:'border-box' }}
            />
            <ErrMsg f="phone" />
          </Field>
          <Field label="Email ID">
            {inp('email', { placeholder:'contact@youragency.in',
              onBlur: () => { const v = agInfo.email.trim(); if (v && !/^[^\s@.][^\s@]{0,252}@[^\s@]+\.[^\s@]{2,}$/.test(v)) setAgErr('email','Enter a valid email address'); } })}
            <ErrMsg f="email" />
          </Field>
        </Grid>
        {agInfoMsg && <div style={{ fontSize:13, color: agInfoMsg.includes('failed') ? '#dc2626' : '#16a34a', marginBottom:8 }}>{agInfoMsg}</div>}
        <div style={{ textAlign:'right' }}>
          <Btn style={{ background: agInfoSaving ? '#94a3b8' : C.blue }} onClick={saveAgInfo} disabled={agInfoSaving}>
            {agInfoSaving ? 'Saving…' : '💾 Save Changes'}
          </Btn>
        </div>
      </Card>}
    </>;
  }

  function PanelProfileContact() {
    if (!contactLoaded) return <div style={{ padding:40, textAlign:'center', color:'#64748b' }}>Loading…</div>;
    const set = (k,v) => setContact(c => ({ ...c, [k]:v }));
    return <>
      <Bc parts={['Agency Profile','Contact & Address']} />
      <SectionHead title="Contact & Address 📍" />
      <Card>
        <CardTitle>Primary Contact</CardTitle>
        <Grid>
          <Field label="Contact Person">
            <Inp value={contact.spoc_name} onChange={e=>set('spoc_name',e.target.value)} placeholder="e.g. Suresh Patil" />
          </Field>
          <Field label="Mobile">
            <ValidInp value={contact.phone} onChange={e=>set('phone',e.target.value.replace(/\D/g,'').slice(0,10))} validate="mobile" placeholder="10-digit mobile" />
          </Field>
        </Grid>
        <Field label="Email">
          <ValidInp value={contact.email} onChange={e=>set('email',e.target.value)} validate="email" placeholder="contact@yourcompany.com" />
        </Field>
      </Card>
      <Card>
        <CardTitle>Office Address</CardTitle>
        <Field label="Address Line 1"><Inp value={contact.address_line1} onChange={e=>set('address_line1',e.target.value)} placeholder="Street / Building" /></Field>
        <Field label="Address Line 2"><Inp value={contact.address_line2} onChange={e=>set('address_line2',e.target.value)} placeholder="Area / Landmark (optional)" /></Field>
        <Grid>
          <Field label="City"><Inp value={contact.city} onChange={e=>set('city',e.target.value)} placeholder="City" /></Field>
          <Field label="State"><Inp value={contact.state_name} onChange={e=>set('state_name',e.target.value)} placeholder="State" /></Field>
        </Grid>
        <Field label="PIN Code"><Inp value={contact.pincode} onChange={e=>set('pincode',e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit PIN" /></Field>
        {contactMsg && <div style={{ fontSize:12.5, color: contactMsg.includes('fail') ? '#dc2626':'#16a34a', marginTop:4 }}>{contactMsg}</div>}
        <div style={{ textAlign:'right', marginTop:10 }}>
          <Btn style={{ background:C.blue }} onClick={saveContact} disabled={contactSaving}>
            {contactSaving ? 'Saving…' : '💾 Save Changes'}
          </Btn>
        </div>
      </Card>
    </>;
  }

  function PanelProfileDocs() {
    return <>
      <Bc parts={['Agency Profile','Documents & Licenses']} />
      <SectionHead title="Documents & Licenses 📄" />
      <Card>
        <CardTitle>Uploaded Documents</CardTitle>
        <Table head={['Document','Status','Uploaded','Action']} rows={[
          ['Certificate of Incorporation',<Badge color="green">Verified</Badge>,'Jan 10, 2021',<Btn sm outline>View</Btn>],
          ['GST Certificate',<Badge color="green">Verified</Badge>,'Jan 12, 2021',<Btn sm outline>View</Btn>],
          ['NSDC Empanelment Letter',<Badge color="green">Verified</Badge>,'Mar 5, 2022',<Btn sm outline>View</Btn>],
          ['PAN Card',<Badge color="green">Verified</Badge>,'Jan 10, 2021',<Btn sm outline>View</Btn>],
          ['Placement Agency License',<Badge color="gold">Pending</Badge>,'Jun 1, 2026',<Btn sm style={{ background:C.blue }}>Upload</Btn>],
        ]} />
      </Card>
      <Card>
        <CardTitle>Upload New Document</CardTitle>
        <Grid><Field label="Document Type"><Sel options={['Certificate of Incorporation','GST Certificate','PAN Card','Placement Agency License','Other']} /></Field><Field label="Document Number"><Inp placeholder="Enter document number" /></Field></Grid>
        <Field label="Upload File"><input type="file" style={{ padding:6 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>📤 Upload Document</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileBank() {
    if (!bankLoaded) return <div style={{ padding:40, textAlign:'center', color:'#64748b' }}>Loading…</div>;
    const set = (k,v) => setBank(b => ({ ...b, [k]:v }));
    return <>
      <Bc parts={['Agency Profile','Bank Details']} />
      <SectionHead title="Bank Details 🏦" />
      <Alert icon="🔒" type="info">Bank details are used for incentive disbursals. Keep them accurate and up to date.</Alert>
      <Card>
        <Grid>
          <Field label="Account Holder Name">
            <Inp value={bank.bank_account_name} onChange={e=>set('bank_account_name',e.target.value)} placeholder="As per bank records" />
          </Field>
          <Field label="Bank Name">
            <Inp value={bank.bank_name} onChange={e=>set('bank_name',e.target.value)} placeholder="e.g. State Bank of India" />
          </Field>
        </Grid>
        <Grid>
          <Field label="Account Number">
            <Inp value={bank.bank_account_number} onChange={e=>set('bank_account_number',e.target.value.replace(/\D/g,''))} placeholder="Account number" />
          </Field>
          <Field label="IFSC Code">
            <Inp value={bank.bank_ifsc} onChange={e=>set('bank_ifsc',e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" />
          </Field>
        </Grid>
        <Field label="Branch">
          <Inp value={bank.bank_branch} onChange={e=>set('bank_branch',e.target.value)} placeholder="Branch name / location" />
        </Field>
        <Field label="Cancelled Cheque / Passbook"><input type="file" style={{ padding:6 }} /></Field>
        {bankMsg && <div style={{ fontSize:12.5, color: bankMsg.includes('fail') ? '#dc2626':'#16a34a', marginTop:4 }}>{bankMsg}</div>}
        <div style={{ textAlign:'right', marginTop:10 }}>
          <Btn style={{ background:C.blue }} onClick={saveBank} disabled={bankSaving}>
            {bankSaving ? 'Saving…' : '💾 Save Bank Details'}
          </Btn>
        </div>
      </Card>
    </>;
  }

  function PanelJobPost() {
    const f = jobForm;
    async function handlePost(status) {
      if (!f.title.trim()) { setJobMsg('❌ Job title is required.'); return; }
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
      } catch (e) { setJobMsg('❌ ' + e.message); }
      setJobSaving(false);
    }
    const set = k => e => setJobForm(v => ({ ...v, [k]: e.target.value }));
    return <>
      <Bc parts={['Job Postings','Post a Job']} />
      <SectionHead title="Post a Job 📋" />
      {jobMsg && <Alert type={jobMsg.startsWith('✅') ? 'info' : 'red'}>{jobMsg}</Alert>}
      <Card>
        <Field label="Job Title"><input value={f.title} onChange={set('title')} placeholder="e.g., Data Entry Operator" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <Grid><Field label="Job Location"><input value={f.location} onChange={set('location')} placeholder="City" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field><Field label="Job Type"><select value={f.job_type} onChange={set('job_type')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>{['Full-time','Part-time','Contract','Apprenticeship'].map(o=><option key={o}>{o}</option>)}</select></Field></Grid>
        <Field label="Required Skills"><input value={f.required_skills} onChange={set('required_skills')} placeholder="e.g. Excel, Communication, MS Office (comma separated)" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <Grid><Field label="Min Salary (₹/year)"><input value={f.salary_min} onChange={set('salary_min')} type="number" placeholder="e.g. 150000" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field><Field label="Max Salary (₹/year)"><input value={f.salary_max} onChange={set('salary_max')} type="number" placeholder="e.g. 220000" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field></Grid>
        <Field label="Job Description"><textarea value={f.description} onChange={set('description')} rows={4} placeholder="Describe roles, responsibilities, requirements…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontFamily:'inherit', fontSize:13.5 }} /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn outline onClick={() => handlePost('draft')} disabled={jobSaving}>Save as Draft</Btn>
          <Btn style={{ background:C.blue }} onClick={() => handlePost('open')} disabled={jobSaving}>🚀 Post Job</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelJobsActive() {
    const active = myJobs.filter(j => j.status === 'open');
    return <>
      <Bc parts={['Job Postings','Active Jobs']} />
      <SectionHead title="Active Jobs 📋" />
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <Btn style={{ background:C.blue }} onClick={() => go('jobs-post')}>+ Post New Job</Btn>
      </div>
      <Card>
        {!jobsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         active.length === 0 ? <div style={{ color:'#888', padding:16 }}>No active jobs.</div> :
        <Table head={['Job Title','Location','Type','Action']} rows={active.map(j => [
          j.title, j.location || '—', j.job_type || '—',
          <Btn sm outline onClick={() => api.updateJob(j.id, { status:'closed' }).then(() => api.myJobs().then(jobs => { setMyJobs(jobs); }))}>Close</Btn>
        ])} />}
      </Card>
    </>;
  }

  function PanelJobsDraft() {
    const drafts = myJobs.filter(j => j.status === 'draft');
    return <>
      <Bc parts={['Job Postings','Drafts']} />
      <SectionHead title="Draft Jobs" />
      <Card>
        {!jobsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         drafts.length === 0 ? <div style={{ color:'#888', padding:16 }}>No draft jobs.</div> :
        <Table head={['Job Title','Location','Type','Action']} rows={drafts.map(j => [
          j.title, j.location || '—', j.job_type || '—',
          <><Btn sm outline onClick={() => api.deleteJob(j.id).then(() => api.myJobs().then(setMyJobs))}>Delete</Btn>{' '}
            <Btn sm style={{ background:C.blue }} onClick={() => api.updateJob(j.id, { status:'open' }).then(() => api.myJobs().then(setMyJobs))}>Publish</Btn></>
        ])} />}
      </Card>
    </>;
  }

  function PanelJobsClosed() {
    const closed = myJobs.filter(j => j.status === 'closed');
    return <>
      <Bc parts={['Job Postings','Closed Jobs']} />
      <SectionHead title="Closed Jobs" />
      <Card>
        {!jobsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         closed.length === 0 ? <div style={{ color:'#888', padding:16 }}>No closed jobs.</div> :
        <Table head={['Job Title','Location','Type','Action']} rows={closed.map(j => [
          j.title, j.location || '—', j.job_type || '—',
          <Btn sm outline onClick={() => api.updateJob(j.id, { status:'open' }).then(() => api.myJobs().then(setMyJobs))}>Repost</Btn>
        ])} />}
      </Card>
    </>;
  }

  function PanelCandSearch() {
    const sf = k => e => setSearchFilters(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['Candidates','Search Candidates']} />
      <SectionHead title="Search Candidates 🔍" />
      <Card>
        <CardTitle>Filters</CardTitle>
        <Grid>
          <Field label="Sector / Trade"><Sel options={['All','IT-ITES','Retail','Hospitality','Healthcare','Logistics','BPO']} value={searchFilters.sector} onChange={sf('sector')} /></Field>
          <Field label="NSQF Level"><Sel options={['All','Level 2','Level 3','Level 4','Level 5']} value={searchFilters.nsqf} onChange={sf('nsqf')} /></Field>
        </Grid>
        <Grid>
          <Field label="Location"><Inp placeholder="City or State" value={searchFilters.location} onChange={sf('location')} /></Field>
          <Field label="Qualification"><Sel options={['Any','10th Pass','12th Pass','Diploma','Graduate']} value={searchFilters.qualification} onChange={sf('qualification')} /></Field>
        </Grid>
        <div style={{ textAlign:'right' }}>
          <Btn style={{ background:C.blue, opacity: searching ? .7 : 1 }} onClick={searchCandidates}>{searching ? 'Searching…' : '🔍 Search'}</Btn>
        </div>
      </Card>
      {shortlistCandidate && (
        <Card style={{ border:`1.5px solid ${C.blue}` }}>
          <CardTitle>Shortlist: {shortlistCandidate.name}</CardTitle>
          <Grid>
            <Field label="Job Title *"><Inp placeholder="e.g. Sales Executive" value={shortlistForm.job_title} onChange={e => setShortlistForm(f => ({ ...f, job_title: e.target.value }))} /></Field>
            <Field label="Company"><Inp placeholder="Employer company name" value={shortlistForm.company} onChange={e => setShortlistForm(f => ({ ...f, company: e.target.value }))} /></Field>
            <Field label="Location"><Inp placeholder="City" value={shortlistForm.location} onChange={e => setShortlistForm(f => ({ ...f, location: e.target.value }))} /></Field>
          </Grid>
          {shortlistMsg && <Alert type={shortlistMsg.startsWith('✅') ? 'info' : 'red'}>{shortlistMsg}</Alert>}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <Btn style={{ background:C.blue, opacity: shortlisting ? .7 : 1 }} onClick={saveShortlist}>{shortlisting ? 'Saving…' : '✅ Confirm Shortlist'}</Btn>
            <Btn outline onClick={() => { setShortlistCandidate(null); setShortlistForm({ job_title:'', company:'', location:'' }); setShortlistMsg(''); }}>Cancel</Btn>
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>Search Results {searchResults !== null ? `(${searchResults.length} candidates)` : ''}</CardTitle>
        {searchResults === null
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>Use filters above to search candidates.</div>
          : searchResults.length === 0
            ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No candidates found matching your filters.</div>
            : <Table head={['Name','Location','Skills','Action']} rows={searchResults.map(c => [
                c.name || c.email || '—',
                c.city || c.location || '—',
                (c.skills || []).slice(0,3).join(', ') || '—',
                <Btn sm style={{ background:C.blue }} onClick={() => { setShortlistCandidate({ id: c.id, name: c.name || c.email || 'Candidate' }); setShortlistMsg(''); }}>Shortlist</Btn>,
              ])} />}
      </Card>
    </>;
  }

  function PanelCandShortlisted() {
    const rows = myPlacements.map(p=>[
      p.candidate_name || '—',
      p.job_title      || '—',
      p.company        || '—',
      p.placement_date ? new Date(p.placement_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—',
      <Badge color={p.status==='joined'?'green':p.status==='placed'?'teal':'gold'}>{p.status}</Badge>,
      <Btn sm outline>View</Btn>,
    ]);
    return <>
      <Bc parts={['Candidates','Shortlisted']} />
      <SectionHead title="Shortlisted Candidates" />
      <Card>
        {rows.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No shortlisted candidates</div>
          : <Table head={['Name','Job Role','Employer','Date','Status','Action']} rows={rows} />
        }
      </Card>
    </>;
  }

  function PanelCandApplications() {
    const total   = allApps.length;
    const shortlisted = allApps.filter(a=>['shortlisted','interview','hired'].includes(a.status)).length;
    const pending  = allApps.filter(a=>a.status==='applied').length;
    const statusColor = { applied:'blue', shortlisted:'green', interview:'teal', hired:'purple', rejected:'red' };
    return <>
      <Bc parts={['Candidates','Applications Received']} />
      <SectionHead title="Applications Received 📥" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val={total}       label="Total Applications" sub="Across my jobs" />
        <KpiCard val={shortlisted} label="Shortlisted+"       sub="Progressed"     color={C.green} />
        <KpiCard val={pending}     label="New / Pending"      sub="Awaiting review" color={C.blue} />
      </div>
      <Card>
        {!appsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         allApps.length === 0 ? <div style={{ color:'#888', padding:16 }}>No applications yet. Post a job to start receiving applications.</div> :
        <Table head={['Candidate','Job Applied','Experience','Status','Action']} rows={allApps.map(a => [
          a.candidate_name || `Candidate #${a.candidate_id}`,
          a.job_title || '—',
          a.experience_years != null ? `${a.experience_years} yr` : 'Fresher',
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

  function PanelCandInterview() {
    const inPipeline = allApps.filter(a => a.status === 'interview');
    const si = k => e => setPpInterview(v => ({ ...v, [k]: e.target.value }));
    return <>
      <Bc parts={['Candidates','Interview Pipeline']} />
      <SectionHead title="Interview Pipeline 🗓️" />
      <Card>
        <CardTitle>Active Candidates in Pipeline</CardTitle>
        {!appsLoaded ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>Loading…</div> :
         inPipeline.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No candidates in interview stage</div>
          : <Table head={['Candidate','Job Role','Status','Action']} rows={inPipeline.map(a=>[
              a.candidate_name || '—', a.job_title || '—',
              <Badge color="teal">{a.status}</Badge>,
              <select style={{ fontSize:12, padding:'3px 6px', borderRadius:6, border:'1px solid #dde2eb' }}
                value={a.status}
                onChange={e => api.updateApplicationStatus(a.id, e.target.value).then(refreshApps)}>
                {['applied','shortlisted','interview','hired','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>,
            ])} />}
      </Card>
      <Card>
        <CardTitle>📅 Schedule New Interview</CardTitle>
        {ppInterviewMsg && <Alert type={ppInterviewMsg.startsWith('✅') ? 'info' : 'red'}>{ppInterviewMsg}</Alert>}
        <Grid>
          <Field label="Candidate Name *"><Inp value={ppInterview.candidate_name} onChange={si('candidate_name')} placeholder="Candidate name" /></Field>
          <Field label="Job Role"><Inp value={ppInterview.job_role} onChange={si('job_role')} placeholder="e.g. Sales Executive" /></Field>
        </Grid>
        <Grid>
          <Field label="Interview Date *"><Inp type="date" value={ppInterview.date} onChange={si('date')} /></Field>
          <Field label="Interview Time *"><Inp type="time" value={ppInterview.time} onChange={si('time')} /></Field>
        </Grid>
        <Grid>
          <Field label="Mode"><Sel options={['In-person','Video Call','Phone Call']} value={ppInterview.mode} onChange={si('mode')} /></Field>
          <Field label="Interviewer Name"><Inp value={ppInterview.interviewer} onChange={si('interviewer')} placeholder="Interviewer name" /></Field>
        </Grid>
        <div style={{ textAlign:'right' }}>
          <Btn style={{ background:C.blue }} onClick={scheduleInterview}>📅 Schedule Interview</Btn>
        </div>
      </Card>
      {scheduledInterviews.length > 0 && (
        <Card>
          <CardTitle>Scheduled Interviews</CardTitle>
          <Table head={['Candidate','Role','Date','Time','Mode']} rows={scheduledInterviews.map(i=>[
            i.candidate_name, i.job_role||'—', i.date, i.time, i.mode,
          ])} />
        </Card>
      )}
    </>;
  }

  function PanelCandOffer() {
    const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status));
    const so = k => e => setPpOffer(v => ({ ...v, [k]: e.target.value }));
    return <>
      <Bc parts={['Candidates','Offer Letters']} />
      <SectionHead title="Offer Letters 📩" />
      <Card>
        <CardTitle>📋 Placement Offers Tracker</CardTitle>
        {placed.length === 0 && generatedOffers.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No offer letters yet</div>
          : <Table head={['Candidate','Job Role','Joining Date','CTC','Status']} rows={[
              ...placed.map(p=>[
                p.candidate_name||'—', p.job_title||'—',
                p.placement_date ? new Date(p.placement_date).toLocaleDateString('en-IN') : '—',
                p.ctc ? `₹${Number(p.ctc).toLocaleString('en-IN')}/mo` : '—',
                <Badge color={p.status==='joined'?'green':'teal'}>{p.status}</Badge>,
              ]),
              ...generatedOffers.map(o=>[
                o.candidate_name, o.job_role, o.joining_date||'—',
                o.ctc ? `₹${Number(o.ctc).toLocaleString('en-IN')}/mo` : '—',
                <Badge color="blue">{o.status}</Badge>,
              ]),
            ]} />
        }
      </Card>
      <Card>
        <CardTitle>📝 Generate Offer Letter</CardTitle>
        {ppOfferMsg && <Alert type={ppOfferMsg.startsWith('✅') ? 'info' : 'red'}>{ppOfferMsg}</Alert>}
        <Grid>
          <Field label="Candidate Name *"><Inp value={ppOffer.candidate_name} onChange={so('candidate_name')} placeholder="Candidate name" /></Field>
          <Field label="Job Role *"><Inp value={ppOffer.job_role} onChange={so('job_role')} placeholder="e.g. Sales Executive" /></Field>
        </Grid>
        <Grid>
          <Field label="Joining Date"><Inp type="date" value={ppOffer.joining_date} onChange={so('joining_date')} /></Field>
          <Field label="Offered CTC (₹/month)"><Inp value={ppOffer.ctc} onChange={so('ctc')} placeholder="e.g. 15000" /></Field>
        </Grid>
        <div style={{ textAlign:'right' }}>
          <Btn style={{ background:C.blue }} onClick={generateOffer}>📄 Generate & Send</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelPlActive() {
    const active = myPlacements.filter(p => ['placed','joined'].includes(p.status));
    async function submitPlacement() {
      if (!plForm.candidate_id || !plForm.job_title.trim()) { setPlMsg('❌ Candidate and job title are required.'); return; }
      const titleErr = validateText(plForm.job_title, 'Job title', { min: 2, max: 200 });
      if (titleErr) { setPlMsg(titleErr); return; }
      if (plForm.ctc) { const ctcErr = validatePositiveNum(plForm.ctc, 'CTC', 0, 1e8); if (ctcErr) { setPlMsg(ctcErr); return; } }
      setPlSaving(true); setPlMsg('');
      try {
        await api.createPlacement({ ...plForm, candidate_id: Number(plForm.candidate_id), ctc: plForm.ctc ? Number(plForm.ctc) : null });
        setPlMsg('✅ Placement recorded!');
        setPlForm({ candidate_id:'', job_title:'', company:'', location:'', ctc:'', placement_date:'', status:'placed' });
        setShowAddPlacement(false);
        refreshPlacements();
      } catch (e) { setPlMsg('❌ ' + e.message); }
      setPlSaving(false);
    }
    const setPl = k => e => setPlForm(v => ({ ...v, [k]: e.target.value }));
    return <>
      <Bc parts={['Placement Tracker','Active Placements']} />
      <SectionHead title="Active Placements 🎯" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val={active.length || dbStats.totalPlacements || 0} label="Currently Placed" sub="In employment" />
        <KpiCard val={dbStats.placedThisYear || 0} label="This Year" sub="New placements" color={C.green} />
        <KpiCard val={dbStats.joinedCount || 0} label="Joined" sub="Confirmed joining" color={C.blue} />
        <KpiCard val={dbStats.avgCTC ? `₹${dbStats.avgCTC}L` : '—'} label="Avg CTC" sub="Per annum" color={C.purple} />
      </div>
      <div style={{ marginBottom:14 }}>
        <Btn style={{ background:C.blue }} onClick={() => setShowAddPlacement(v => !v)}>{showAddPlacement ? 'Cancel' : '+ Add Placement'}</Btn>
      </div>
      {showAddPlacement && (
        <Card style={{ marginBottom:16 }}>
          <CardTitle>New Placement Record</CardTitle>
          {plMsg && <Alert type={plMsg.startsWith('✅') ? 'info' : 'red'}>{plMsg}</Alert>}
          <Grid>
            <Field label="Candidate">
              <select value={plForm.candidate_id} onChange={setPl('candidate_id')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">Select candidate…</option>
                {candidateList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Job Title"><input value={plForm.job_title} onChange={setPl('job_title')} placeholder="e.g. Data Entry Operator" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
          </Grid>
          <Grid>
            <Field label="Company"><input value={plForm.company} onChange={setPl('company')} placeholder="e.g. TechNova Pvt Ltd" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
            <Field label="Location"><input value={plForm.location} onChange={setPl('location')} placeholder="e.g. Bengaluru" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
          </Grid>
          <Grid>
            <Field label="CTC (₹/year)"><input value={plForm.ctc} onChange={setPl('ctc')} type="number" placeholder="e.g. 350000" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
            <Field label="Placement Date"><input value={plForm.placement_date} onChange={setPl('placement_date')} type="date" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }} /></Field>
          </Grid>
          <Field label="Status">
            <select value={plForm.status} onChange={setPl('status')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['placed','joined','dropped'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn style={{ background:C.blue }} onClick={submitPlacement} disabled={plSaving}>{plSaving ? 'Saving…' : 'Save Placement'}</Btn>
          </div>
        </Card>
      )}
      <Card>
        {!placementsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         active.length === 0 ? <div style={{ color:'#888', padding:16 }}>No active placements yet.</div> :
        <Table head={['Candidate','Company','Role','Location','Joined','CTC','Status','Action']} rows={active.map(p => [
          p.candidate_name || `Candidate #${p.candidate_id}`,
          p.company || p.org_name || '—',
          p.job_title,
          p.location || '—',
          p.placement_date || '—',
          p.ctc ? `₹${(p.ctc/100000).toFixed(1)}L` : '—',
          <Badge color={p.status==='joined'?'green':'blue'}>{p.status}</Badge>,
          <select style={{ fontSize:11, padding:'2px 5px', borderRadius:5, border:'1px solid #dde2eb' }}
            value={p.status}
            onChange={e => api.updatePlacement(p.id, { status: e.target.value }).then(refreshPlacements)}>
            {['placed','joined','dropped'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        ])} />}
      </Card>
    </>;
  }

  function PanelPlCompleted() {
    const completed = myPlacements.filter(p => ['placed','joined','dropped'].includes(p.status));
    const total = myPlacements.length;
    return <>
      <Bc parts={['Placement Tracker','Completed Placements']} />
      <SectionHead title="Completed Placements ✅" />
      <Card>
        <CardTitle>Total: {total} Placements</CardTitle>
        {!placementsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         myPlacements.length === 0 ? <div style={{ color:'#888', padding:16 }}>No placements recorded yet.</div> :
        <Table head={['Candidate','Company','Role','Placed On','CTC','Status']} rows={myPlacements.map(p => [
          p.candidate_name || `Candidate #${p.candidate_id}`,
          p.company || '—', p.job_title, p.placement_date || '—',
          p.ctc ? `₹${(p.ctc/100000).toFixed(1)}L` : '—',
          <Badge color={p.status==='joined'?'green':p.status==='dropped'?'red':'blue'}>{p.status}</Badge>
        ])} />}
      </Card>
    </>;
  }

  function PanelPlDropout() {
    const dropouts = myPlacements.filter(p => p.status === 'dropped');
    return <>
      <Bc parts={['Placement Tracker','Dropout / Withdrawn']} />
      <SectionHead title="Dropout / Withdrawn ⚠️" />
      <Alert icon="ℹ️" type="info">Documenting dropout reasons helps improve future matching and scheme compliance.</Alert>
      <Card>
        {!placementsLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         dropouts.length === 0 ? <div style={{ color:'#888', padding:16 }}>No dropouts recorded.</div> :
        <Table head={['Candidate','Company','Role','Placed On','Action']} rows={dropouts.map(p => [
          p.candidate_name || `Candidate #${p.candidate_id}`,
          p.company || '—', p.job_title, p.placement_date || '—',
          <Btn sm outline onClick={() => api.updatePlacement(p.id, { status:'placed' }).then(refreshPlacements)}>Reactivate</Btn>
        ])} />}
      </Card>
    </>;
  }

  function PanelPlIncentive() {
    const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status));
    const candOptions = ['Select Candidate', ...placed.map(p=>p.candidate_name).filter(Boolean)];
    const empOptions  = ['Select Employer',  ...[...new Set(placed.map(p=>p.company).filter(Boolean))]];
    return <>
      <Bc parts={['Placement Tracker','Incentive Claims']} />
      <SectionHead title="Incentive Claims 💰" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val={placed.length} label="Eligible Placements" sub="Placed / Joined" color={C.green} />
      </div>
      <Card>
        <CardTitle>Claims History</CardTitle>
        {claims.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No claims filed yet</div>
          : <Table head={['Scheme','Candidate','Employer','Joining Date','Status']} rows={claims.map(c=>[
              c.scheme, c.candidate, c.employer||'—', c.joining_date||'—',
              <Badge color="blue">{c.status}</Badge>,
            ])} />}
      </Card>
      <Card>
        <CardTitle>File New Claim</CardTitle>
        {claimMsg && <Alert type={claimMsg.startsWith('✅') ? 'info' : 'red'}>{claimMsg}</Alert>}
        <Grid>
          <Field label="Scheme"><Sel options={['PMKVY Placement Linked Incentive','DDU-GKY','NAPS','PLI']} value={claimForm.scheme} onChange={e=>setClaimForm(f=>({...f,scheme:e.target.value}))} /></Field>
          <Field label="Candidate"><Sel options={candOptions} value={claimForm.candidate} onChange={e=>setClaimForm(f=>({...f,candidate:e.target.value}))} /></Field>
        </Grid>
        <Grid>
          <Field label="Employer"><Sel options={empOptions} value={claimForm.employer} onChange={e=>setClaimForm(f=>({...f,employer:e.target.value}))} /></Field>
          <Field label="Joining Date"><Inp type="date" value={claimForm.joining_date} onChange={e=>setClaimForm(f=>({...f,joining_date:e.target.value}))} /></Field>
        </Grid>
        <Field label="Upload Joining Letter / Appointment Letter"><input type="file" style={{ padding:6 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }} onClick={submitClaim}>📤 Submit Claim</Btn></div>
      </Card>
    </>;
  }

  function PanelEmpList() {
    const employers = [...new Set(myPlacements.map(p=>p.company).filter(Boolean))];
    const rows = employers.map(emp => {
      const count = myPlacements.filter(p=>p.company===emp && ['placed','joined'].includes(p.status)).length;
      return [emp, count, <Badge color="green">Active</Badge>];
    });
    return <>
      <Bc parts={['Employers','Registered Employers']} />
      <SectionHead title="Registered Employers 🏭" />
      <div style={{ display:'flex', gap:10, marginBottom:14 }}><input style={{ flex:1, padding:'8px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13 }} placeholder="Search employers…" /><Btn style={{ background:C.blue }} onClick={()=>go('emp-add')}>+ Add Employer</Btn></div>
      <Card>
        {rows.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No employers added yet</div>
          : <Table head={['Employer','Placements','Status']} rows={rows} />
        }
      </Card>
    </>;
  }

  function PanelEmpAdd() {
    const se = k => e => setEmpForm(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['Employers','Add Employer']} />
      <SectionHead title="Add Employer 🏭" />
      {addedEmployers.length > 0 && (
        <Card>
          <CardTitle>Recently Added</CardTitle>
          <Table head={['Company','Sector','Contact','City','Vacancies']} rows={addedEmployers.slice(0,5).map(e=>[
            e.company_name, e.sector, e.contact_person||'—', e.city||'—', e.vacancies||'—'
          ])} />
        </Card>
      )}
      <Card>
        {empMsg && <Alert type={empMsg.startsWith('✅') ? 'info' : 'red'}>{empMsg}</Alert>}
        <Grid>
          <Field label="Company Name *"><Inp value={empForm.company_name} onChange={se('company_name')} placeholder="Full company name" /></Field>
          <Field label="Industry / Sector"><Sel value={empForm.sector} onChange={se('sector')} options={['IT-ITES','Retail','Hospitality','Logistics','BPO','Healthcare','Manufacturing']} /></Field>
        </Grid>
        <Grid>
          <Field label="Contact Person"><Inp value={empForm.contact_person} onChange={se('contact_person')} placeholder="HR / Recruiter name" /></Field>
          <Field label="Designation"><Inp value={empForm.designation} onChange={se('designation')} placeholder="e.g. HR Manager" /></Field>
        </Grid>
        <Grid>
          <Field label="Mobile"><Inp value={empForm.mobile} onChange={se('mobile')} placeholder="10-digit mobile" /></Field>
          <Field label="Email"><Inp value={empForm.email} onChange={se('email')} placeholder="email@company.com" /></Field>
        </Grid>
        <Grid>
          <Field label="City"><Inp value={empForm.city} onChange={se('city')} placeholder="City" /></Field>
          <Field label="State"><Sel value={empForm.state_name} onChange={se('state_name')} options={['Maharashtra','Karnataka','Tamil Nadu','Telangana','Delhi','Gujarat','Rajasthan','West Bengal','Other']} /></Field>
        </Grid>
        <Grid>
          <Field label="Number of Vacancies"><Inp value={empForm.vacancies} onChange={se('vacancies')} placeholder="e.g. 10" /></Field>
          <Field label="Preferred NSQF Level"><Sel value={empForm.nsqf_level} onChange={se('nsqf_level')} options={['Level 2','Level 3','Level 4','Level 5','Any']} /></Field>
        </Grid>
        <Field label="Notes / Demand Details">
          <textarea value={empForm.notes} onChange={se('notes')} rows={3} placeholder="Any specific requirements…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontFamily:'inherit', fontSize:13.5 }} />
        </Field>
        <div style={{ textAlign:'right' }}>
          <Btn style={{ background:C.blue, opacity: empSaving ? .7 : 1 }} onClick={addEmployer}>{empSaving ? 'Adding…' : '➕ Add Employer'}</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelEmpMou() {
    const empOptions = ['Select Employer', ...[...new Set([...myPlacements.map(p=>p.company), ...addedEmployers.map(e=>e.company_name)].filter(Boolean))]];
    const sm = k => e => setMouForm(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['Employers','MoU / Agreements']} />
      <SectionHead title="MoU / Agreements 📑" />
      <Card>
        <CardTitle>Active Agreements</CardTitle>
        {uploadedMous.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No MoU agreements uploaded yet</div>
          : <Table head={['Employer','MoU Date','Validity','Positions','Status']} rows={uploadedMous.map(m=>[
              m.employer, m.mou_date, `${m.validity} months`, m.positions||'—',
              <Badge color="green">{m.status}</Badge>,
            ])} />}
      </Card>
      <Card>
        <CardTitle>📤 Upload New MoU</CardTitle>
        {mouMsg && <Alert type={mouMsg.startsWith('✅') ? 'info' : 'red'}>{mouMsg}</Alert>}
        <Grid>
          <Field label="Employer *"><Sel value={mouForm.employer} onChange={sm('employer')} options={empOptions} /></Field>
          <Field label="MoU Date *"><Inp type="date" value={mouForm.mou_date} onChange={sm('mou_date')} /></Field>
        </Grid>
        <Grid>
          <Field label="Validity (months)"><Inp value={mouForm.validity} onChange={sm('validity')} placeholder="12" /></Field>
          <Field label="No. of Positions"><Inp value={mouForm.positions} onChange={sm('positions')} placeholder="e.g. 20" /></Field>
        </Grid>
        <Field label="Upload Signed MoU (PDF)">
          <input type="file" accept=".pdf" onChange={e => setMouForm(f => ({ ...f, file_name: e.target.files[0]?.name || '' }))} style={{ padding:6 }} />
        </Field>
        <div style={{ textAlign:'right' }}>
          <Btn style={{ background:C.blue }} onClick={uploadMou}>📤 Upload MoU</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelEmpDemand() {
    return <>
      <Bc parts={['Employers','Demand Requests']} />
      <SectionHead title="Demand Requests 📬" />
      <Card>
        <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No demand requests received yet</div>
      </Card>
    </>;
  }

  function PanelSchemePmkvy() {
    const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status));
    const today = new Date();
    return <>
      <Bc parts={['Govt Schemes','PMKVY Placement']} />
      <SectionHead title="PMKVY Placement 🏛️" />
      <Grid cols={2}>
        <Card>
          <CardTitle>Scheme Overview</CardTitle>
          <TlItem dot={C.blue} title="Scheme: PMKVY 4.0" meta="Pradhan Mantri Kaushal Vikas Yojana" />
          <TlItem dot={C.green} title="PLI: ₹12,000 per placement" meta="Placement Linked Incentive (90-day retention)" />
          <TlItem dot={C.gold} title="Sectors: All NSQF-aligned" meta="Retail, IT, Hospitality, Logistics and more" />
          <TlItem dot={C.purple} title="Eligibility: PMKVY certified candidates only" meta="Certification required before placement" />
        </Card>
        <Card>
          <CardTitle>Your PMKVY Stats</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <KpiCard val={placed.length} label="Total Placements" sub="All time" color={C.blue} />
            <KpiCard val={dbStats.placedThisYear ?? 0} label="This Year" sub={new Date().getFullYear()} color={C.green} />
          </div>
        </Card>
      </Grid>
      <Card>
        <CardTitle>Placed Candidates</CardTitle>
        {placed.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No placements recorded yet</div>
          : <Table head={['Candidate','Employer','Role','Joined','90-Day Check','Status']} rows={placed.map(p => {
              const joined = p.placement_date ? new Date(p.placement_date) : null;
              const check90 = joined ? new Date(joined.getTime() + 90*24*60*60*1000) : null;
              const daysLeft = check90 ? Math.ceil((check90 - today) / (24*60*60*1000)) : null;
              const badge = daysLeft === null ? <Badge color="gold">—</Badge>
                : daysLeft > 0 ? <Badge color="gold">{daysLeft}d left</Badge>
                : <Badge color="green">Eligible</Badge>;
              return [
                p.candidate_name || '—',
                p.company        || '—',
                p.job_title      || '—',
                joined ? joined.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—',
                check90 ? check90.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—',
                badge,
              ];
            })} />
        }
      </Card>
    </>;
  }

  function PanelSchemeNaps() {
    return <>
      <Bc parts={['Govt Schemes','NAPS / NATS']} />
      <SectionHead title="NAPS / NATS 🏛️" />
      <Grid cols={2}>
        <Card>
          <CardTitle>NAPS — National Apprenticeship Promotion Scheme</CardTitle>
          <table style={{ width:'100%' }}><tbody>
            {[['Govt. Stipend Share','25% (up to ₹1,500/month)'],['Duration','6 months – 3 years'],['Sectors','All NSQF aligned'],['Eligibility','Passed 5th standard & above']].map(([k,v])=>(
              <tr key={k}><td style={{ color:'#64748b', fontSize:12, padding:'6px 0' }}>{k}</td><td style={{ fontWeight:700 }}>{v}</td></tr>
            ))}
          </tbody></table>
          <div style={{ marginTop:10 }}><Badge color="gold">Contact your NSDC partner for enrollment details</Badge></div>
        </Card>
        <Card>
          <CardTitle>NATS — National Apprenticeship Training Scheme</CardTitle>
          <table style={{ width:'100%' }}><tbody>
            {[['Administered By','Board of Apprenticeship Training'],['Target','Diploma / Degree graduates'],['Duration','1 year'],['Stipend','As per company norms + Govt. top-up']].map(([k,v])=>(
              <tr key={k}><td style={{ color:'#64748b', fontSize:12, padding:'6px 0' }}>{k}</td><td style={{ fontWeight:700 }}>{v}</td></tr>
            ))}
          </tbody></table>
          <div style={{ marginTop:10 }}><Badge color="gold">Contact BOAT for enrollment details</Badge></div>
        </Card>
      </Grid>
    </>;
  }

  function PanelSchemeDdugky() {
    const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status));
    const today = new Date();
    return <>
      <Bc parts={['Govt Schemes','DDU-GKY']} />
      <SectionHead title="DDU-GKY 🏛️" />
      <Alert icon="ℹ️" type="info">Deen Dayal Upadhyaya Grameen Kaushalya Yojana — rural youth skill and placement programme.</Alert>
      <Card>
        <CardTitle>Scheme Details</CardTitle>
        <table style={{ width:'100%' }}><tbody>
          {[['Target Group','Rural youth aged 15–35'],['Placement Incentive','₹15,000 per placement (wage ≥ ₹8,000/month)'],['Post-Placement Support','3 months post-placement tracking mandatory'],['Sectors','Retail, Hospitality, Construction, Healthcare']].map(([k,v])=>(
            <tr key={k}><td style={{ color:'#64748b', fontSize:12, padding:'8px 0', width:200 }}>{k}</td><td style={{ fontWeight:700 }}>{v}</td></tr>
          ))}
        </tbody></table>
      </Card>
      <Card>
        <CardTitle>Your DDU-GKY Placements</CardTitle>
        {placed.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No placements recorded yet</div>
          : <Table head={['Candidate','Employer','Role','CTC','3-Month Status']} rows={placed.map(p => {
              const joined = p.placement_date ? new Date(p.placement_date) : null;
              const days = joined ? Math.floor((today - joined) / (24*60*60*1000)) : null;
              const badge = days === null ? <Badge color="gold">—</Badge>
                : days >= 90 ? <Badge color="green">Completed</Badge>
                : <Badge color="blue">Day {days} of 90</Badge>;
              return [
                p.candidate_name || '—',
                p.company        || '—',
                p.job_title      || '—',
                p.ctc ? `₹${Number(p.ctc).toLocaleString('en-IN')}/mo` : '—',
                badge,
              ];
            })} />
        }
      </Card>
    </>;
  }

  function PanelSchemePli() {
    const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status));
    const today = new Date();
    return <>
      <Bc parts={['Govt Schemes','PLI — Placement Linked']} />
      <SectionHead title="PLI — Placement Linked Incentive 💰" />
      <Card>
        <CardTitle>How PLI Works</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, textAlign:'center' }}>
          {[['1️⃣','Place Candidate','Must be scheme-certified',C.pBlue],['2️⃣','90-Day Retention','Candidate must stay ≥ 90 days',C.pGold],['3️⃣','Claim ₹12,000','Submit docs → disbursal',C.pGreen]].map(([n,t,s,bg])=>(
            <div key={n} style={{ background:bg, borderRadius:10, padding:16 }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{n}</div>
              <div style={{ fontWeight:700, fontSize:13 }}>{t}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{s}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>PLI Tracker</CardTitle>
        {placed.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No placements to track yet</div>
          : <Table head={['Candidate','Employer','Join Date','90-Day Date','Days Left','Status']} rows={placed.map(p => {
              const joined = p.placement_date ? new Date(p.placement_date) : null;
              const check90 = joined ? new Date(joined.getTime() + 90*24*60*60*1000) : null;
              const daysLeft = check90 ? Math.ceil((check90 - today) / (24*60*60*1000)) : null;
              const badge = daysLeft === null ? <Badge color="gold">—</Badge>
                : daysLeft > 30 ? <Badge color="gold">Not Yet Eligible</Badge>
                : daysLeft > 0  ? <Badge color="blue">Almost Ready</Badge>
                : <Badge color="green">Eligible</Badge>;
              return [
                p.candidate_name || '—',
                p.company        || '—',
                joined    ? joined.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})   : '—',
                check90   ? check90.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})  : '—',
                daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : '0 days') : '—',
                badge,
              ];
            })} />
        }
      </Card>
    </>;
  }

  function PanelRepPlacement() {
    const total  = myPlacements.length;
    const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status)).length;
    const rate   = total > 0 ? Math.round(placed/total*100) : 0;
    const empCounts = {};
    myPlacements.filter(p=>['placed','joined'].includes(p.status)).forEach(p=>{
      if (p.company) empCounts[p.company] = (empCounts[p.company]||0)+1;
    });
    const empRows = Object.entries(empCounts).sort((a,b)=>b[1]-a[1])
      .map(([emp,n])=>[emp, n, `${total>0?Math.round(n/total*100):0}%`]);
    return <>
      <Bc parts={['Reports','Placement Reports']} />
      <SectionHead title="Placement Reports 📊" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val={dbStats.totalPlacements ?? total} label="Total Placements" sub="All time" />
        <KpiCard val={dbStats.placedThisYear ?? 0}      label="This Year"        sub={new Date().getFullYear()} color={C.green} />
        <KpiCard val={`${rate}%`}                       label="Placement Rate"   sub="Placed vs total"         color={C.blue} />
      </div>
      <Card>
        <CardTitle>Placements by Employer</CardTitle>
        {empRows.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No placement data yet</div>
          : <Table head={['Employer','Placed','% Share']} rows={empRows} />
        }
      </Card>
      <div style={{ textAlign:'right', marginTop:10 }}><Btn style={{ background:C.blue }}>📥 Download PDF</Btn> <Btn outline>📊 Download Excel</Btn></div>
    </>;
  }

  function PanelRepCandidate() {
    const total  = myPlacements.length;
    const placed = myPlacements.filter(p=>['placed','joined'].includes(p.status)).length;
    const pct = n => total > 0 ? `${Math.round(n/total*100)}%` : '—';
    return <>
      <Bc parts={['Reports','Candidate Reports']} />
      <SectionHead title="Candidate Reports 👥" />
      <Card>
        <CardTitle>Candidate Pipeline Summary</CardTitle>
        <Table head={['Stage','Count','% of Total']} rows={[
          ['Total Candidates', total,  '100%'],
          ['Placed / Joined',  placed, pct(placed)],
          ['In Progress',      total-placed, pct(total-placed)],
        ]} />
      </Card>
      <Card>
        <CardTitle>Candidate Demographics</CardTitle>
        <Grid cols={2}>
          <div>
            <div style={{ fontWeight:700, marginBottom:8, fontSize:13 }}>By Gender</div>
            {[['Male','58',C.blue],['Female','42',C.purple]].map(([l,p,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #f0f2f5' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:c, flexShrink:0 }} />
                <div style={{ fontSize:13, flex:1 }}>{l} — {p}%</div>
                <div style={{ width:120 }}><ProgBar pct={parseInt(p)} color={c} /></div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight:700, marginBottom:8, fontSize:13 }}>By Qualification</div>
            {[['10th Pass','35',C.green],['12th Pass','45',C.gold],['Graduate','20',C.teal]].map(([l,p,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #f0f2f5' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:c, flexShrink:0 }} />
                <div style={{ fontSize:13, flex:1 }}>{l} — {p}%</div>
                <div style={{ width:120 }}><ProgBar pct={parseInt(p)} color={c} /></div>
              </div>
            ))}
          </div>
        </Grid>
      </Card>
    </>;
  }

  function PanelRepEmployer() {
    const counts = {};
    myPlacements.filter(p=>['placed','joined'].includes(p.status)).forEach(p=>{
      if (p.company) counts[p.company] = (counts[p.company]||0)+1;
    });
    const rows = Object.entries(counts).sort((a,b)=>b[1]-a[1])
      .map(([emp,n])=>[emp, n]);
    return <>
      <Bc parts={['Reports','Employer Reports']} />
      <SectionHead title="Employer Reports 🏭" />
      <Card>
        {rows.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No employer data yet</div>
          : <Table head={['Employer','Placements']} rows={rows} />
        }
      </Card>
    </>;
  }

  function PanelRepMonthly() {
    const now = new Date();
    const thisMonth = myPlacements.filter(p=>{
      if (!p.placement_date) return false;
      const d = new Date(p.placement_date);
      return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
    });
    const monthName = now.toLocaleString('en-IN',{month:'long',year:'numeric'});
    return <>
      <Bc parts={['Reports','Monthly Summary']} />
      <SectionHead title="Monthly Summary 📅" />
      <Card>
        <CardTitle>{monthName} Summary</CardTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
          <KpiCard val={thisMonth.length}  label="Placements"    sub={monthName}    color={C.green} />
          <KpiCard val={myPlacements.length} label="Total All Time" sub="Cumulative" />
        </div>
        {thisMonth.length === 0
          ? <div style={{ color:'#94a3b8', fontSize:13, padding:'12px 0', textAlign:'center' }}>No placements recorded this month</div>
          : <Table head={['Candidate','Employer','Role','Date']} rows={thisMonth.map(p=>[
              p.candidate_name || '—',
              p.company        || '—',
              p.job_title      || '—',
              p.placement_date ? new Date(p.placement_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—',
            ])} />
        }
      </Card>
    </>;
  }

  function PanelRepIncentive() {
    return <>
      <Bc parts={['Reports','Incentive Reports']} />
      <SectionHead title="Incentive Reports 💰" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:20 }}>
        <KpiCard val={myPlacements.filter(p=>['placed','joined'].includes(p.status)).length} label="Eligible Placements" sub="For incentive" color={C.green} />
      </div>
      <Card>
        <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No incentive claims filed yet. Use Placement Tracker → Incentive Claims to file.</div>
      </Card>
    </>;
  }

  function PanelHelpdesk() {
    return <>
      <Bc parts={['Support','Helpdesk']} />
      <SectionHead title="Helpdesk 🎧" />
      <Card>
        <CardTitle>Raise a Support Ticket</CardTitle>
        <Grid><Field label="Issue Type"><Sel options={['Technical Issue','Incentive Claim Query','Candidate Profile Issue','Employer Issue','Scheme Query','Other']} /></Field><Field label="Priority"><Sel options={['Normal','High','Urgent']} /></Field></Grid>
        <Field label="Subject"><Inp placeholder="Briefly describe your issue" /></Field>
        <Field label="Description"><textarea rows={4} placeholder="Provide full details…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontFamily:'inherit', fontSize:13.5 }} /></Field>
        <Field label="Attachment (optional)"><input type="file" style={{ padding:6 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>📤 Submit Ticket</Btn></div>
      </Card>
      <Card>
        <CardTitle>My Tickets</CardTitle>
        <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No tickets raised yet</div>
      </Card>
    </>;
  }

  function PanelGrievance() {
    return <>
      <Bc parts={['Support','Grievance']} />
      <SectionHead title="Grievance 📣" />
      <Alert icon="ℹ️" type="info">Grievances are reviewed by the nodal officer within 7 working days as per NSDC guidelines.</Alert>
      <Card>
        <CardTitle>Raise Grievance</CardTitle>
        <Grid><Field label="Grievance Category"><Sel options={['Incentive Not Disbursed','Profile Verification Delay','Scheme Eligibility Dispute','Employer Misconduct','Portal Technical Issue','Other']} /></Field><Field label="Against"><Sel options={['Employer','Training Partner','Portal Administration','NSDC / Govt. Body']} /></Field></Grid>
        <Field label="Grievance Description"><textarea rows={5} placeholder="Describe the grievance clearly with dates and reference numbers…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontFamily:'inherit', fontSize:13.5 }} /></Field>
        <Field label="Supporting Documents"><input type="file" multiple style={{ padding:6 }} /></Field>
        <div style={{ textAlign:'right' }}><Btn style={{ background:C.blue }}>📤 Submit Grievance</Btn></div>
      </Card>
      <Card>
        <CardTitle>My Grievances</CardTitle>
        <div style={{ color:'#94a3b8', fontSize:13, padding:'16px 0', textAlign:'center' }}>No grievances raised yet</div>
      </Card>
    </>;
  }

  function PanelFAQ() {
    const faqs = [
      ['How do I post a job for my employer?','Go to Job Postings → Post a Job, fill the job details, select the employer, and click Publish.'],
      ['How do I claim a PMKVY placement incentive?','After 90 days of candidate employment, go to Placement Tracker → Incentive Claims → File New Claim and upload the joining letter.'],
      ['How long does incentive disbursal take?','Typically 15–30 working days after claim approval. Check claim status under Incentive Claims.'],
      ['Can I register a new employer?','Yes. Go to Employers → Add Employer, fill in the details, and upload a signed MoU.'],
      ['What documents are needed for registration?','Certificate of Incorporation, GST Certificate, PAN Card, and Placement Agency License.'],
      ['How do I handle a dropout candidate?','Go to Placement Tracker → Dropout / Withdrawn, find the candidate, and update the reason for exit.'],
    ];
    return <>
      <Bc parts={['Support','FAQ']} />
      <SectionHead title="Frequently Asked Questions ❓" />
      <Card>
        {faqs.map(([q,a])=>(
          <details key={q} style={{ borderBottom:'1px solid #f0f2f5', padding:'12px 0', cursor:'pointer' }}>
            <summary style={{ fontWeight:600, fontSize:13.5, color:C.navy }}>{q}</summary>
            <div style={{ marginTop:8, fontSize:13, color:'#374151', lineHeight:1.6 }}>{a}</div>
          </details>
        ))}
      </Card>
    </>;
  }

  function PanelSettings() {
    return <AccountPreferences onLogout={handleLogout} />;
  }

  function renderPanel() {
    switch(panel) {
      case 'dashboard':          return PanelDashboard();
      case 'notifications':      return PanelNotifications();
      case 'profile-info':       return PanelProfileInfo();
      case 'profile-contact':    return PanelProfileContact();
      case 'profile-docs':       return PanelProfileDocs();
      case 'profile-bank':       return PanelProfileBank();
      case 'jobs-post':          return PanelJobPost();
      case 'jobs-active':        return PanelJobsActive();
      case 'jobs-draft':         return PanelJobsDraft();
      case 'jobs-closed':        return PanelJobsClosed();
      case 'cand-search':        return PanelCandSearch();
      case 'cand-shortlisted':   return PanelCandShortlisted();
      case 'cand-applications':  return PanelCandApplications();
      case 'cand-interview':     return PanelCandInterview();
      case 'cand-offer':         return PanelCandOffer();
      case 'pl-active':          return PanelPlActive();
      case 'pl-completed':       return PanelPlCompleted();
      case 'pl-dropout':         return PanelPlDropout();
      case 'pl-incentive':       return PanelPlIncentive();
      case 'emp-list':           return PanelEmpList();
      case 'emp-add':            return PanelEmpAdd();
      case 'emp-mou':            return PanelEmpMou();
      case 'emp-demand':         return PanelEmpDemand();
      case 'scheme-pmkvy':       return PanelSchemePmkvy();
      case 'scheme-naps':        return PanelSchemeNaps();
      case 'scheme-ddugky':      return PanelSchemeDdugky();
      case 'scheme-pli':         return PanelSchemePli();
      case 'rep-placement':      return PanelRepPlacement();
      case 'rep-candidate':      return PanelRepCandidate();
      case 'rep-employer':       return PanelRepEmployer();
      case 'rep-monthly':        return PanelRepMonthly();
      case 'rep-incentive':      return PanelRepIncentive();
      case 'helpdesk':           return PanelHelpdesk();
      case 'grievance':          return PanelGrievance();
      case 'faq':                return PanelFAQ();
      case 'settings':           return PanelSettings();
      default:                   return <SectionHead title="Panel Not Found" />;
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      {Sidebar()}
      {Topbar()}
      <div style={{ marginLeft: isMobile ? 0 : SW, marginTop:TH, padding:24, minHeight:`calc(100vh - ${TH}px)` }}>
        {renderPanel()}
      </div>
    </div>
  );
}
