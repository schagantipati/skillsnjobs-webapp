import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES, validatePositiveNum, validateText } from '../utils/validators.js';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import AccountPreferences from '../components/AccountPreferences.jsx';

const SW = 220, TH = 58;
const C = {
  navy:'#0D2137', sidebar:'#010E3C', blue:'#1E5FBF', teal:'#0B7B8C', green:'#1A7C3E',
  gold:'#C8860A', red:'#C0392B', purple:'#6B3FA0', orange:'#C05621',
  pBlue:'#EBF1FB', pGreen:'#E8F5EE', pGold:'#FEF6E4',
  pRed:'#FDECEA', pPurple:'#F0EAFB', pTeal:'#E6F4F6', pOrange:'#FFF0E6',
};

const NAV = [
  { key:'dashboard',      label:'Dashboard',              section:'Main' },
  { key:'notifications',  label:'Notifications',          section:'Main' },
  { key:'profile-info',   label:'Organisation Information',section:'CSR Profile' },
  { key:'profile-contact',label:'Contact & Address',       section:'CSR Profile' },
  { key:'profile-docs',   label:'CSR Policy & Documents',  section:'CSR Profile' },
  { key:'profile-bank',   label:'Bank & Payment Details',  section:'CSR Profile' },
  { key:'proj-new',       label:'Propose New Project',     section:'CSR Projects' },
  { key:'proj-active',    label:'Active Projects',         section:'CSR Projects' },
  { key:'proj-draft',     label:'Draft Projects',          section:'CSR Projects' },
  { key:'proj-completed', label:'Completed Projects',      section:'CSR Projects' },
  { key:'proj-approval',  label:'Approval Status',         section:'CSR Projects' },
  { key:'bene-register',  label:'Register Beneficiary',    section:'Beneficiaries' },
  { key:'bene-list',      label:'Beneficiary List',        section:'Beneficiaries' },
  { key:'bene-track',     label:'Track Progress',          section:'Beneficiaries' },
  { key:'bene-placement', label:'Placement Outcomes',      section:'Beneficiaries' },
  { key:'tp-list',        label:'Empanelled Partners',     section:'Training Partners' },
  { key:'tp-add',         label:'Add Training Partner',    section:'Training Partners' },
  { key:'tp-performance', label:'Partner Performance',     section:'Training Partners' },
  { key:'tp-mou',         label:'MoU / Agreements',        section:'Training Partners' },
  { key:'fund-allocation',label:'Fund Allocation',         section:'Fund Management' },
  { key:'fund-disbursements',label:'Disbursements',        section:'Fund Management' },
  { key:'fund-utilization',label:'Utilization Reports',    section:'Fund Management' },
  { key:'fund-unspent',   label:'Unspent CSR Funds',       section:'Fund Management' },
  { key:'scheme-pmkvy',   label:'PMKVY',                   section:'Govt Schemes' },
  { key:'scheme-ddugky',  label:'DDU-GKY',                 section:'Govt Schemes' },
  { key:'scheme-star',    label:'STAR Scheme',             section:'Govt Schemes' },
  { key:'scheme-naps',    label:'NAPS / NATS',             section:'Govt Schemes' },
  { key:'rep-impact',     label:'Impact Reports',          section:'Reports' },
  { key:'rep-financial',  label:'Financial Reports',       section:'Reports' },
  { key:'rep-annual',     label:'Annual CSR Report',       section:'Reports' },
  { key:'rep-sector',     label:'Sector-wise Report',      section:'Reports' },
  { key:'rep-geo',        label:'Geographic Report',       section:'Reports' },
  { key:'comp-schedule7', label:'Schedule VII',            section:'Compliance' },
  { key:'comp-csr1',      label:'Form CSR-1',              section:'Compliance' },
  { key:'comp-csr2',      label:'Form CSR-2',              section:'Compliance' },
  { key:'comp-board',     label:'Board Resolutions',       section:'Compliance' },
  { key:'comp-audit',     label:'Audit Trail',             section:'Compliance' },
  { key:'helpdesk',       label:'Helpdesk',                section:'Support' },
  { key:'grievance',      label:'Grievance',               section:'Support' },
  { key:'faq',            label:'FAQ',                     section:'Support' },
  { key:'settings',       label:'Account Preferences',     section:'Account' },
];

// ── stable module-level helpers ───────────────────────────────────────────────
function Card({ children, style }) {
  return <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,.06)', border:'1px solid #e8ecf3', marginBottom:10, ...style }}>{children}</div>;
}
function CardTitle({ children }) {
  return <div style={{ fontWeight:700, fontSize:13, color:C.navy, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>{children}</div>;
}
function SectionHead({ title }) {
  return <div style={{ fontSize:17, fontWeight:800, color:C.navy, marginBottom:10 }}>{title}</div>;
}
function Bc({ parts }) {
  return <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>{parts.join(' › ')}</div>;
}
function Btn({ children, onClick, style, outline, danger, sm, teal, green }) {
  return <button onClick={onClick} style={{
    padding: sm ? '5px 12px' : '8px 18px', borderRadius:8,
    border: outline ? `1.5px solid ${C.blue}` : 'none',
    background: danger ? C.red : teal ? C.teal : green ? C.green : outline ? '#fff' : C.blue,
    color: outline ? C.blue : '#fff',
    fontSize: sm ? 12 : 13, fontWeight:600, cursor:'pointer', ...style,
  }}>{children}</button>;
}
function Badge({ children, color='blue' }) {
  const map = { blue:[C.pBlue,C.blue], green:[C.pGreen,C.green], gold:[C.pGold,C.gold], red:[C.pRed,C.red], purple:[C.pPurple,C.purple], teal:[C.pTeal,C.teal], orange:[C.pOrange,C.orange] };
  const [bg, fg] = map[color] || map.blue;
  return <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:10, fontSize:11, fontWeight:600, background:bg, color:fg }}>{children}</span>;
}
function KpiCard({ val, label, sub, color }) {
  return <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', border:'1px solid #e8ecf3', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
    <div style={{ fontSize:22, fontWeight:800, color: color||C.navy, lineHeight:1 }}>{val}</div>
    <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{label}</div>
    <div style={{ fontSize:10.5, marginTop:1, fontWeight:600, color: color||C.blue }}>{sub}</div>
  </div>;
}
function Table({ head, rows }) {
  return <table style={{ width:'100%', borderCollapse:'collapse' }}>
    <thead><tr>{head.map(h=><th key={h} style={{ textAlign:'left', fontSize:10.5, fontWeight:700, color:'#64748b', letterSpacing:'.05em', textTransform:'uppercase', padding:'5px 8px', borderBottom:'2px solid #e8ecf3' }}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={i} style={{ background: i%2===0?'#fff':'#fafbfc' }}>{r.map((c,j)=><td key={j} style={{ padding:'6px 8px', borderBottom:'1px solid #f0f2f5', fontSize:12 }}>{c}</td>)}</tr>)}</tbody>
  </table>;
}
function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>{label}</label>
    {children}
  </div>;
}
function Inp({ placeholder, defaultValue, value, onChange, type='text' }) {
  const controlled = value !== undefined;
  return <input type={type} placeholder={placeholder}
    {...(controlled ? { value, onChange } : { defaultValue })}
    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} />;
}

function ValidInp({ placeholder, defaultValue, value: valueProp, onChange: onChangeProp, type='text', validate: vtype, required }) {
  const [val, setVal] = useState(typeof valueProp !== 'undefined' ? String(valueProp) : (typeof defaultValue !== 'undefined' ? String(defaultValue) : ''));
  const [error, setError] = useState('');
  useEffect(() => { if (valueProp !== undefined) setVal(String(valueProp)); }, [valueProp]);
  function handleChange(e) {
    let v = e.target.value;
    if (vtype && UPPERCASE_TYPES.has(vtype)) v = v.toUpperCase();
    setVal(v);
    if (error) setError('');
    if (onChangeProp) onChangeProp({ target: { value: v } });
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
  return <div style={{ padding:'8px 12px', borderRadius:8, fontSize:12.5, marginBottom:8, background:bg, borderLeft:`4px solid ${fg}`, color:fg, display:'flex', gap:8 }}>{icon} <span>{children}</span></div>;
}
function Toggle({ label, sub, defaultChecked }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div>
      <div style={{ fontSize:13, color:'#374151' }}>{label}</div>
      <div style={{ fontSize:11, color:'#94a3b8' }}>{sub}</div>
    </div>
    <label style={{ position:'relative', display:'inline-block', width:44, height:24, flexShrink:0 }}>
      <input type="checkbox" defaultChecked={defaultChecked} style={{ opacity:0, width:0, height:0, position:'absolute' }} />
      <span className="snj-track"></span>
    </label>
  </div>;
}
function TlItem({ dot, title, meta }) {
  return <div style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ width:8, height:8, borderRadius:'50%', background:dot, flexShrink:0, marginTop:4 }} />
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{title}</div>
      <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{meta}</div>
    </div>
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
function StatRow({ n, label, pct, color }) {
  return <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ fontSize:15, fontWeight:800, color:C.navy, minWidth:44, flexShrink:0 }}>{n}</div>
    <div style={{ fontSize:12, color:'#374151', flex:1, minWidth:0 }}>{label}</div>
    <div style={{ minWidth:55, flex:'0 0 28%' }}>{ProgBar({pct, color})}</div>
  </div>;
}
function Step({ num, title, sub, done, pending }) {
  return <div style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid #f0f2f5' }}>
    <div style={{ width:28, height:28, borderRadius:'50%', background: done ? C.green : pending ? '#e8ecf3' : C.blue, color: pending ? '#64748b' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{done ? '✓' : num}</div>
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{title}</div>
      <div style={{ fontSize:11.5, color:'#64748b', marginTop:2 }}>{sub}</div>
    </div>
  </div>;
}

export default function CsrOrganizationPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuPerms, setMenuPerms] = useState({});
  const searchRef = useRef(null);

  const [profileInfo, setProfileInfo] = useState(() => ({
    org_name: user?.org_name || '',
    cin: user?.cin || '',
    pan: user?.pan || '',
    gstin: user?.gstin || '',
    tan: user?.tan || '',
    website: user?.website || '',
    bio: user?.bio || '',
    avg_net_profit: user?.avg_net_profit || '',
    csr_obligation: user?.csr_obligation || '',
    csr_total_spend: user?.csr_total_spend || '',
  }));
  const [infoSaving, setInfoSaving] = useState(false);

  const [profileContact, setProfileContact] = useState(() => ({
    address_line1: user?.address_line1 || '',
    city: user?.city || '',
    state_name: user?.state_name || '',
    pincode: user?.pincode || '',
    phone: (user?.phone || '').replace(/^\+91/, ''),
    email: user?.email || '',
    spoc_name: user?.spoc_name || '',
    designation: user?.designation || '',
  }));
  const [contactSaving, setContactSaving] = useState(false);

  const [profileBank, setProfileBank] = useState(() => ({
    bank_account_name: user?.bank_account_name || '',
    bank_account_number: user?.bank_account_number || '',
    bank_ifsc: user?.bank_ifsc || '',
    account_type: user?.account_type || 'Current',
  }));
  const [bankSaving, setBankSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileInfo(f => ({ ...f,
        org_name: user.org_name || '',
        cin: user.cin || '',
        pan: user.pan || '',
        gstin: user.gstin || '',
        tan: user.tan || '',
        website: user.website || '',
        bio: user.bio || '',
        avg_net_profit: user.avg_net_profit || '',
        csr_obligation: user.csr_obligation || '',
        csr_total_spend: user.csr_total_spend || '',
      }));
      setProfileContact(f => ({ ...f,
        address_line1: user.address_line1 || '',
        city: user.city || '',
        state_name: user.state_name || '',
        pincode: user.pincode || '',
        phone: (user.phone || '').replace(/^\+91/, ''),
        email: user.email || '',
        spoc_name: user.spoc_name || '',
        designation: user.designation || '',
      }));
      setProfileBank(f => ({ ...f,
        bank_account_name: user.bank_account_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_ifsc: user.bank_ifsc || '',
        account_type: user.account_type || 'Current',
      }));
    }
  }, [user]);

  async function saveInfo() {
    setInfoSaving(true);
    try {
      await api.updateMe({ org_name: profileInfo.org_name, cin: profileInfo.cin, pan: profileInfo.pan, gstin: profileInfo.gstin, tan: profileInfo.tan, website: profileInfo.website, bio: profileInfo.bio, avg_net_profit: profileInfo.avg_net_profit || 0, csr_obligation: profileInfo.csr_obligation || 0, csr_total_spend: profileInfo.csr_total_spend || 0 });
      alert('Organisation info saved.');
    } catch { alert('Save failed.'); } finally { setInfoSaving(false); }
  }
  async function saveContact() {
    setContactSaving(true);
    try {
      await api.updateMe({
        address_line1: profileContact.address_line1, city: profileContact.city,
        state_name: profileContact.state_name, pincode: profileContact.pincode,
        phone: profileContact.phone ? '+91' + profileContact.phone : null,
        email: profileContact.email,
        spoc_name: profileContact.spoc_name,
        designation: profileContact.designation,
      });
      alert('Contact info saved.');
    } catch { alert('Save failed.'); } finally { setContactSaving(false); }
  }
  async function saveBank() {
    setBankSaving(true);
    try {
      await api.updateMe({ bank_account_name: profileBank.bank_account_name, bank_account_number: profileBank.bank_account_number, bank_ifsc: profileBank.bank_ifsc, account_type: profileBank.account_type });
      alert('Bank details saved.');
    } catch { alert('Save failed.'); } finally { setBankSaving(false); }
  }

  // Project proposal form
  const [projForm, setProjForm] = useState({ title:'', schedule7:'Skill Development', sub_sector:'Vocational Training', target_beneficiaries:'', target_states:'', start_date:'', end_date:'', objectives:'', budget:'', own_contribution:'', other_sources:'', implementing_agency:'', agency_type:'NGO', mou_signed:'No — in progress' });
  const [projSaving, setProjSaving] = useState(false);
  const [projMsg, setProjMsg] = useState('');

  // Training partner add form
  const [tpForm, setTpForm] = useState({ org_name:'', type:'Private ITC', nsdc_reg:'', state_name:'Maharashtra', contact_person:'', email:'', num_trainers:'10', max_batch_size:'30' });
  const [tpSaving, setTpSaving] = useState(false);
  const [tpMsg, setTpMsg] = useState('');

  // Beneficiary registration form
  const [beneForm, setBeneForm] = useState({ full_name:'', dob:'', gender:'Male', category:'General', aadhaar:'', mobile:'', state_name:'Maharashtra', email:'', project_id:'', course:'Data Entry Operator', batch_code:'', enrollment_date:'', expected_completion:'' });
  const [beneSaving, setBeneSaving] = useState(false);
  const [beneMsg, setBeneMsg] = useState('');

  // Disbursement form
  const [disbForm, setDisbForm] = useState({ project_id:'', recipient:'', amount:'', payment_date:'', mode:'NEFT', purpose:'' });
  const [disbSaving, setDisbSaving] = useState(false);
  const [disbMsg, setDisbMsg] = useState('');

  // Unspent CSR funds form
  const [unspentForm, setUnspentForm] = useState({ financial_year:'2025-26', unspent_amount:'', reason:'Project Delays', transfer_deadline:'', transfer_destination:'Designated Unspent CSR Fund Account', remediation_plan:'' });
  const [unspentSaving, setUnspentSaving] = useState(false);
  const [unspentMsg, setUnspentMsg] = useState('');
  const [unspentFunds, setUnspentFunds] = useState([]);

  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [trainingPartners, setTrainingPartners] = useState([]);
  const [loaded, setLoaded] = useState({});

  const loadStats = useCallback(() => api.csrStats().then(setStats).catch(() => {}), []);
  const loadProjects = useCallback(() => {
    if (loaded.projects) return;
    api.csrProjects().then(d => { setProjects(d); setLoaded(l => ({ ...l, projects: true })); }).catch(() => {});
  }, [loaded.projects]);
  const loadBeneficiaries = useCallback(() => {
    if (loaded.beneficiaries) return;
    api.csrBeneficiaries().then(d => { setBeneficiaries(d); setLoaded(l => ({ ...l, beneficiaries: true })); }).catch(() => {});
  }, [loaded.beneficiaries]);
  const loadDisbursements = useCallback(() => {
    if (loaded.disbursements) return;
    api.csrDisbursements().then(d => { setDisbursements(d); setLoaded(l => ({ ...l, disbursements: true })); }).catch(() => {});
  }, [loaded.disbursements]);
  const loadTPs = useCallback(() => {
    if (loaded.tps) return;
    api.csrTrainingPartners().then(d => { setTrainingPartners(d); setLoaded(l => ({ ...l, tps: true })); }).catch(() => {});
  }, [loaded.tps]);
  const loadUnspentFunds = useCallback(() => {
    if (loaded.unspent) return;
    api.csrUnspentFunds().then(d => { setUnspentFunds(d); setLoaded(l => ({ ...l, unspent: true })); }).catch(() => {});
  }, [loaded.unspent]);

  useEffect(() => { loadStats(); loadProjects(); loadDisbursements(); }, []);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [panel]); // eslint-disable-line

  useEffect(() => {
    api.getRolePermissions().then(all => setMenuPerms(all['csr_org'] || {})).catch(() => {});
  }, []);
  const PERM_LOCKED = new Set(['dashboard','notifications','settings','profile-info','profile-contact','profile-docs','profile-bank']);
  const allowed = k => !k || PERM_LOCKED.has(k) || menuPerms[k] !== false;
  useEffect(() => { if (Object.keys(menuPerms).length && !allowed(panel)) setPanel('dashboard'); }, [menuPerms]); // eslint-disable-line

  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function go(key) {
    setPanel(key); window.scrollTo(0, 0);
    if (['dashboard','proj-active','proj-draft','proj-completed','proj-approval'].includes(key)) loadProjects();
    if (['bene-list','bene-track','bene-placement'].includes(key)) loadBeneficiaries();
    if (['fund-disbursements','fund-utilization'].includes(key)) loadDisbursements();
    if (key === 'fund-unspent') { loadDisbursements(); loadUnspentFunds(); }
    if (['tp-list','tp-performance'].includes(key)) loadTPs();
  }
  function handleLogout() { logout(); navigate('/'); }

  const crore = n => n >= 10000000 ? `₹${(n/10000000).toFixed(1)} Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)} L` : `₹${(n||0).toLocaleString('en-IN')}`;
  const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;

  const searchResults = searchQ.trim()
    ? NAV.filter(n => n.label.toLowerCase().includes(searchQ.toLowerCase()) || n.section.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  // ── SIDEBAR ──────────────────────────────────────────────────────────────
  function Sidebar() {
    function NavItem({ icon, label, id, badge, onClick, active, permKey }) {
      if (permKey && !allowed(permKey)) return null;
      return <div onClick={onClick} style={{ padding:'4px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:9, color: active ? '#fff' : 'rgba(255,255,255,.75)', background: active ? C.blue : 'transparent', transition:'.15s' }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,.07)'; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}>
        <span style={{ width:20, textAlign:'center', fontSize:15, flexShrink:0 }}>{icon}</span>
        <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{label}</span>
        {badge && <span style={{ background:C.red, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{badge}</span>}
        {id && <span style={{ fontSize:10, transition:'.2s', transform: openMenus[id] ? 'rotate(90deg)' : 'none', display:'inline-block' }}>›</span>}
      </div>;
    }
    function Sub({ id, children }) {
      return openMenus[id] ? <div style={{ background:'rgba(0,0,0,.12)' }}>{children}</div> : null;
    }
    function SubItem({ label, k }) {
      if (!allowed(k)) return null;
      return <div onClick={()=>go(k)} style={{ padding:'3px 16px 3px 45px', cursor:'pointer', fontSize:12.5, color: panel===k ? C.blue : 'rgba(255,255,255,.52)', fontWeight: panel===k ? 600 : 400, transition:'.15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#fff'; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color = panel===k ? C.blue : 'rgba(255,255,255,.52)'; }}>
        · {label}
      </div>;
    }
    const lbl = s => <div style={{ padding:'7px 16px 2px', fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,.32)', letterSpacing:'.08em', textTransform:'uppercase' }}>{s}</div>;

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
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:9.5 }}>CSR ORGANIZATION</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {lbl('Main')}
        <NavItem icon="🏠" label="Dashboard" active={panel==='dashboard'} onClick={()=>go('dashboard')} />
        <NavItem icon="🏢" label="Organisation Profile" id="profile" onClick={()=>toggleMenu('profile')} />
        <Sub id="profile">
          <SubItem label="Organisation Information" k="profile-info" />
          <SubItem label="Contact & Address" k="profile-contact" />
          <SubItem label="CSR Policy & Documents" k="profile-docs" />
          <SubItem label="Bank & Payment Details" k="profile-bank" />
        </Sub>
        <NavItem icon="🔔" label="Notifications" badge="5" active={panel==='notifications'} onClick={()=>go('notifications')} />

        {lbl('CSR Projects')}
        <NavItem icon="📋" label="Projects" id="projects" onClick={()=>toggleMenu('projects')} />
        <Sub id="projects">
          <SubItem label="Propose New Project" k="proj-new" />
          <SubItem label="Active Projects" k="proj-active" />
          <SubItem label="Drafts" k="proj-draft" />
          <SubItem label="Completed Projects" k="proj-completed" />
          <SubItem label="Approval Status" k="proj-approval" />
        </Sub>

        {lbl('Beneficiary Management')}
        <NavItem icon="👥" label="Beneficiaries" id="bene" onClick={()=>toggleMenu('bene')} />
        <Sub id="bene">
          <SubItem label="Register Beneficiary" k="bene-register" />
          <SubItem label="Beneficiary List" k="bene-list" />
          <SubItem label="Track Progress" k="bene-track" />
          <SubItem label="Placement Outcomes" k="bene-placement" />
        </Sub>

        {lbl('Training Partners')}
        <NavItem icon="🎓" label="Training Partners" id="tp" onClick={()=>toggleMenu('tp')} />
        <Sub id="tp">
          <SubItem label="Empanelled Partners" k="tp-list" />
          <SubItem label="Add Training Partner" k="tp-add" />
          <SubItem label="Partner Performance" k="tp-performance" />
          <SubItem label="MoU / Agreements" k="tp-mou" />
        </Sub>

        {lbl('Fund Management')}
        <NavItem icon="💰" label="Funds" id="fund" onClick={()=>toggleMenu('fund')} />
        <Sub id="fund">
          <SubItem label="Fund Allocation" k="fund-allocation" />
          <SubItem label="Disbursements" k="fund-disbursements" />
          <SubItem label="Utilization Reports" k="fund-utilization" />
          <SubItem label="Unspent CSR Funds" k="fund-unspent" />
        </Sub>

        {lbl('Govt Schemes')}
        <NavItem icon="🏛️" label="Schemes" id="scheme" onClick={()=>toggleMenu('scheme')} />
        <Sub id="scheme">
          <SubItem label="PMKVY" k="scheme-pmkvy" />
          <SubItem label="DDU-GKY" k="scheme-ddugky" />
          <SubItem label="STAR Scheme" k="scheme-star" />
          <SubItem label="NAPS / NATS" k="scheme-naps" />
        </Sub>

        {lbl('Reports & Analytics')}
        <NavItem icon="📊" label="Reports" id="rep" onClick={()=>toggleMenu('rep')} />
        <Sub id="rep">
          <SubItem label="Impact Reports" k="rep-impact" />
          <SubItem label="Financial Reports" k="rep-financial" />
          <SubItem label="Annual CSR Report" k="rep-annual" />
          <SubItem label="Sector-wise Report" k="rep-sector" />
          <SubItem label="Geographic Report" k="rep-geo" />
        </Sub>

        {lbl('Compliance')}
        <NavItem icon="📜" label="Compliance" id="comp" onClick={()=>toggleMenu('comp')} />
        <Sub id="comp">
          <SubItem label="Schedule VII" k="comp-schedule7" />
          <SubItem label="Form CSR-1" k="comp-csr1" />
          <SubItem label="Form CSR-2" k="comp-csr2" />
          <SubItem label="Board Resolutions" k="comp-board" />
          <SubItem label="Audit Trail" k="comp-audit" />
        </Sub>

        {lbl('Support')}
        <NavItem icon="🎧" label="Helpdesk" permKey="helpdesk" active={panel==='helpdesk'} onClick={()=>go('helpdesk')} />
        <NavItem icon="📣" label="Grievance" permKey="grievance" active={panel==='grievance'} onClick={()=>go('grievance')} />
        <NavItem icon="❓" label="FAQ" permKey="faq" active={panel==='faq'} onClick={()=>go('faq')} />

        {lbl('Account')}
        <NavItem icon="⚙️" label="Account Preferences" active={panel==='settings'} onClick={()=>go('settings')} />
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
            placeholder="Search projects, beneficiaries, reports…"
            style={{ width:'100%', padding:'8px 12px 8px 36px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#f6f8fc' }} />
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', opacity:.4, fontSize:14 }}>🔍</span>
          {searchOpen && searchResults.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1.5px solid #dde2eb', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:500, maxHeight:260, overflowY:'auto' }}>
              {searchResults.map(r => (
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
          <div style={{ position:'relative' }}
            onMouseEnter={e => { const t = e.currentTarget.querySelector('.avatar-tooltip'); if(t){ t.style.opacity='1'; t.style.pointerEvents='auto'; }}}
            onMouseLeave={e => { const t = e.currentTarget.querySelector('.avatar-tooltip'); if(t){ t.style.opacity='0'; t.style.pointerEvents='none'; }}}>
            <div onClick={()=>go('profile-info')} style={{ width:38, height:38, borderRadius:'50%', background:C.green, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              {(user?.org_name||'CS').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div className="avatar-tooltip" style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:500,
              background:'#fff', border:'1px solid #e2e8f0', borderRadius:12,
              padding:'12px 14px', minWidth:200, boxShadow:'0 8px 24px rgba(0,0,0,.12)',
              opacity:0, pointerEvents:'none', transition:'opacity 0.15s ease',
              whiteSpace:'nowrap' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{user?.org_name || 'CSR Organisation'}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>ID: CSR-{String(user?.id||'').padStart(6,'0')}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{user?.email || ''}</div>
              <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid #e2e8f0' }}>
                <button onClick={()=>go('profile-info')}
                  style={{ width:'100%', padding:'5px 0', background:C.navy, color:'#fff',
                    border:'none', borderRadius:7, fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
                  View Profile →
                </button>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} title="Sign Out" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', border:'none', background:C.blue, color:'#fff', fontSize:18, cursor:'pointer' }}>⏻</button>
        </div>
      </div>
    );
  }

  // ── PANELS ────────────────────────────────────────────────────────────────
  function PanelDashboard() {
    const utilPct = pct(stats.totalSpent, stats.totalBudget);
    const activeProjList = projects.filter(p => p.status === 'active').slice(0, 5);
    const completedProjList = projects.filter(p => p.status === 'completed');
    const inProgressBene = beneficiaries.filter(b => b.training_status === 'in_progress').length;
    const enrolledBene = beneficiaries.filter(b => b.training_status === 'enrolled').length;
    return <>
      <Alert icon="⚡" type="warn"><strong>Action needed:</strong> FY 2025-26 CSR-2 form submission due by 30 Sep 2026. <strong>File Now →</strong></Alert>
      <SectionHead title={`Welcome, ${user?.org_name || user?.name || 'CSR Organisation'}! 🏛️`} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
        <KpiCard val={crore(stats.totalSpent)} label="Total CSR Spend" sub="All projects combined" color={C.blue} />
        <KpiCard val={(stats.totalBeneficiaries || 0).toLocaleString('en-IN')} label="Beneficiaries Enrolled" sub={`${stats.certifiedBeneficiaries||0} certified`} color={C.teal} />
        <KpiCard val={stats.activeProjects || 0} label="Active Projects" sub={`${stats.completedProjects||0} completed`} color={C.green} />
        <KpiCard val={`${utilPct}%`} label="Fund Utilization" sub={`${crore(stats.totalBudget)} allocated`} color={C.gold} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
        {[['📋','Propose Project','proj-new'],['👥','Add Beneficiary','bene-register'],['💰','Disburse Funds','fund-disbursements'],['📜','File CSR-2','comp-csr2']].map(([icon,lbl,k])=>(
          <div key={k} onClick={()=>go(k)} style={{ background:'#fff', border:'1.5px solid #e8ecf3', borderRadius:10, padding:'10px 8px', textAlign:'center', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.background=C.pBlue; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8ecf3'; e.currentTarget.style.background='#fff'; }}>
            <div style={{ fontSize:18 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:0 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📊 CSR Spend vs Budget</CardTitle>
          <StatRow n={crore(stats.totalSpent)} label="Actual Spend" pct={utilPct} color={C.green} />
          <StatRow n={crore(stats.totalBudget)} label="Total Budget Allocated" pct={100} color={C.blue} />
          <StatRow n={crore(Math.max(0,(stats.totalBudget||0)-(stats.totalSpent||0)))} label="Unspent Balance" pct={100-utilPct} color={C.red} />
          <hr style={{ border:'none', borderTop:'1px solid #e8ecf3', margin:'14px 0' }} />
          <div style={{ fontSize:12, color:'#64748b' }}>{stats.totalPartners||0} training partners · {stats.activePartners||0} active MoUs</div>
        </Card>
        <Card style={{ marginBottom:0, overflowX:'auto' }}>
          <CardTitle>🏆 Project Status</CardTitle>
          {projects.length === 0
            ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
            : <Table head={['Project','Beneficiaries','Status']} rows={projects.slice(0,6).map(p => [
                p.title,
                (p.beneficiaries_actual||0).toLocaleString('en-IN'),
                <Badge color={p.status==='active'?'green':p.status==='completed'?'teal':p.status==='delayed'?'gold':'blue'}>{p.status}</Badge>
              ])} />}
        </Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🔔 Recent Disbursements</CardTitle>
          {disbursements.length === 0
            ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
            : disbursements.slice(0,5).map(d => (
                <TlItem key={d.id} dot={d.status==='disbursed'?C.green:C.gold}
                  title={`${crore(d.amount)} disbursed to ${d.recipient}`}
                  meta={`${d.purpose} · ${d.status}`} />
              ))}
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📈 Beneficiary Status</CardTitle>
          <StatRow n={stats.totalBeneficiaries||0} label="Total Enrolled" pct={100} color={C.blue} />
          <StatRow n={stats.certifiedBeneficiaries||0} label="Training Completed" pct={pct(stats.certifiedBeneficiaries,stats.totalBeneficiaries)} color={C.teal} />
          <StatRow n={stats.placedBeneficiaries||0} label="Placed" pct={pct(stats.placedBeneficiaries,stats.totalBeneficiaries)} color={C.green} />
          <StatRow n={stats.totalPartners||0} label="Training Partners" pct={pct(stats.activePartners,stats.totalPartners)*100/100} color={C.gold} />
        </Card>
      </div>
    </>;
  }

  function PanelNotifications() {
    return <>
      <Bc parts={['Notifications']} />
      <SectionHead title="Notifications 🔔" />
      <Card>
        {[
          [C.gold,'⚠️','CSR-2 for FY 2025-26 due by 30 Sep 2026','System · 5 min ago'],
          [C.blue,'📋','New PMKVY batch approved for Navi Mumbai project','MSDE · 2 hours ago'],
          [C.green,'✅','₹1.2 Cr disbursement to SkillBridge confirmed','Finance · Today'],
          [C.purple,'📊','Q1 FY26 Impact Report is ready to download','Reports · Jul 3'],
          [C.red,'🔴','Compliance: Form CSR-1 amendment pending','MCA · Jul 2'],
        ].map(([c,ic,t,m])=><TlItem key={t} dot={c} title={`${ic} ${t}`} meta={m} />)}
      </Card>
    </>;
  }

  function PanelProfileInfo() {
    const set = k => e => setProfileInfo(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['CSR Profile','Organisation Information']} />
      <SectionHead title="Organisation Information 🏢" />
      <Card>
        <CardTitle>🏛️ Basic Details</CardTitle>
        <Grid>
          <Field label="Organisation Name"><ValidInp value={profileInfo.org_name} onChange={set('org_name')} validate="name" placeholder="Organisation legal name" /></Field>
          <Field label="CIN Number"><ValidInp value={profileInfo.cin} onChange={set('cin')} validate="cin" /></Field>
        </Grid>
        <Grid>
          <Field label="PAN Number"><ValidInp value={profileInfo.pan} onChange={set('pan')} validate="pan" /></Field>
          <Field label="GSTIN"><ValidInp value={profileInfo.gstin} onChange={set('gstin')} validate="gst" placeholder="e.g. 29AAACT1234A1ZK" /></Field>
        </Grid>
        <Grid>
          <Field label="TAN"><ValidInp value={profileInfo.tan} onChange={set('tan')} validate="tan" placeholder="e.g. PDES03028F" /></Field>
          <Field label="Website"><ValidInp value={profileInfo.website} onChange={set('website')} validate="website" placeholder="https://www.example.com" /></Field>
        </Grid>
        <Field label="Description / Mission"><textarea className="inp" rows={3} value={profileInfo.bio} onChange={set('bio')} placeholder="Describe your CSR mission…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn onClick={saveInfo} style={{ opacity: infoSaving ? .7 : 1 }}>{infoSaving ? 'Saving…' : '💾 Save Changes'}</Btn></div>
      </Card>
      <Card>
        <CardTitle>📊 CSR Obligation (FY 2025-26)</CardTitle>
        <Grid cols={3}><Field label="Avg Net Profit (3 yrs) ₹"><Inp type="number" value={profileInfo.avg_net_profit} onChange={set('avg_net_profit')} placeholder="e.g. 100000000000" /></Field><Field label="2% CSR Obligation ₹"><Inp type="number" value={profileInfo.csr_obligation} onChange={set('csr_obligation')} placeholder="e.g. 2000000000" /></Field><Field label="Total Spend ₹"><Inp type="number" value={profileInfo.csr_total_spend} onChange={set('csr_total_spend')} placeholder="e.g. 1840000000" /></Field></Grid>
        <Alert icon="ℹ️" type="info">Unspent CSR amounts must be transferred to a designated account within 6 months of FY end as per Section 135(6).</Alert>
        <div style={{ textAlign:'right', marginTop:8 }}><Btn onClick={saveInfo} style={{ opacity: infoSaving ? .7 : 1 }}>{infoSaving ? 'Saving…' : '💾 Save Obligation Data'}</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileContact() {
    const set = k => e => setProfileContact(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['CSR Profile','Contact & Address']} />
      <SectionHead title="Contact & Address 📍" />
      <Card>
        <CardTitle>📞 Registered Office</CardTitle>
        <Field label="Street Address"><Inp value={profileContact.address_line1} onChange={set('address_line1')} placeholder="Street / Building" /></Field>
        <Grid cols={3}>
          <Field label="City"><Inp value={profileContact.city} onChange={set('city')} placeholder="City" /></Field>
          <Field label="State"><Inp value={profileContact.state_name} onChange={set('state_name')} placeholder="State" /></Field>
          <Field label="PIN Code"><ValidInp value={profileContact.pincode} onChange={set('pincode')} validate="pincode" /></Field>
        </Grid>
        <Grid>
          <Field label="Mobile Number"><ValidInp value={profileContact.phone} onChange={set('phone')} validate="mobile" placeholder="9876543210" /></Field>
          <Field label="Email"><ValidInp value={profileContact.email} onChange={set('email')} validate="email" placeholder="contact@org.com" /></Field>
        </Grid>
        <div style={{ textAlign:'right' }}><Btn onClick={saveContact} style={{ opacity: contactSaving ? .7 : 1 }}>{contactSaving ? 'Saving…' : '💾 Save Changes'}</Btn></div>
      </Card>
      <Card>
        <CardTitle>👤 Nodal Officer / SPOC</CardTitle>
        <Grid>
          <Field label="Officer Name"><ValidInp value={profileContact.spoc_name} onChange={set('spoc_name')} validate="name" placeholder="Officer name" /></Field>
          <Field label="Designation"><Inp value={profileContact.designation} onChange={set('designation')} placeholder="e.g. Head of CSR" /></Field>
        </Grid>
        <div style={{ textAlign:'right' }}><Btn onClick={saveContact} style={{ opacity: contactSaving ? .7 : 1 }}>{contactSaving ? 'Saving…' : '💾 Update Contact'}</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileDocs() {
    return <>
      <Bc parts={['CSR Profile','CSR Policy & Documents']} />
      <SectionHead title="CSR Policy & Documents 📄" />
      <Card>
        <CardTitle>📋 Policy Documents</CardTitle>
        <Table head={['Document','Version','Uploaded','Status','Action']} rows={[
          ['CSR Policy FY 2025-26','v3.1','Mar 15, 2025',<Badge color="green">Current</Badge>,<Btn sm outline>Download</Btn>],
          ['CSR Implementation Plan','v2.0','Apr 01, 2025',<Badge color="green">Current</Badge>,<Btn sm outline>Download</Btn>],
          ['Board Resolution — CSR','FY26','Apr 01, 2025',<Badge color="teal">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['Annual Action Plan','FY26','Apr 05, 2025',<Badge color="gold">Under Review</Badge>,<Btn sm outline>Download</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>📤 Upload Document</Btn></div>
      </Card>
      <Card>
        <CardTitle>🏆 Certifications</CardTitle>
        {['MCA CSR-1 Registered','DPIIT Recognised','NSDC Partner','ISO 9001:2015','FCRA Registered'].map(s=>(
          <span key={s} style={{ display:'inline-block', padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:'#e8ecf3', color:'#374151', margin:2 }}>{s}</span>
        ))}
        <div style={{ marginTop:14 }}><Btn>+ Add Certification</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileBank() {
    const set = k => e => setProfileBank(f => ({ ...f, [k]: e.target.value }));
    return <>
      <Bc parts={['CSR Profile','Bank & Payment Details']} />
      <SectionHead title="Bank & Payment Details 🏦" />
      <Card>
        <CardTitle>🏦 Primary Bank Account</CardTitle>
        <Grid>
          <Field label="Account Holder"><ValidInp value={profileBank.bank_account_name} onChange={set('bank_account_name')} validate="name" placeholder="As per bank records" /></Field>
          <Field label="Account Number"><ValidInp value={profileBank.bank_account_number} onChange={set('bank_account_number')} validate="bankAcct" placeholder="9–18 digit account number" /></Field>
        </Grid>
        <Grid>
          <Field label="IFSC Code"><ValidInp value={profileBank.bank_ifsc} onChange={set('bank_ifsc')} validate="ifsc" /></Field>
          <Field label="Account Type"><Sel value={profileBank.account_type} onChange={set('account_type')} options={['Current','Savings']} /></Field>
        </Grid>
        <Alert icon="⚠️" type="warn">Bank details once saved require OTP verification and board approval before changes take effect.</Alert>
        <div style={{ textAlign:'right' }}><Btn onClick={saveBank} style={{ opacity: bankSaving ? .7 : 1 }}>{bankSaving ? 'Saving…' : '💾 Save & Verify'}</Btn></div>
      </Card>
      <Card>
        <CardTitle>🏛️ Unspent CSR Fund Account</CardTitle>
        <Grid><Field label="Account Number"><ValidInp validate="bankAcct" placeholder="Designated unspent CSR account" /></Field><Field label="Bank"><Inp placeholder="Bank name" /></Field></Grid>
        <p style={{ fontSize:12.5, color:'#64748b', marginTop:8 }}>Designated for unspent CSR funds as per Section 135(6) of the Companies Act, 2013.</p>
      </Card>
    </>;
  }

  function PanelProjNew() {
    const pf = projForm;
    const set = k => e => setProjForm(f => ({ ...f, [k]: e.target.value }));

    async function saveProject(status) {
      if (!pf.title.trim()) { setProjMsg('Project title is required.'); return; }
      const titleErr = validateText(pf.title, 'Project title', { min: 5, max: 200 });
      if (titleErr) { setProjMsg(titleErr); return; }
      const objErr = validateText(pf.objectives, 'Objectives', { min: 0, max: 2000 });
      if (objErr) { setProjMsg(objErr); return; }
      if (pf.budget) { const budErr = validatePositiveNum(pf.budget.replace(/,/g, ''), 'Budget', 0, 1e10); if (budErr) { setProjMsg(budErr); return; } }
      setProjSaving(true); setProjMsg('');
      try {
        await api.csrCreateProject({ ...pf, status });
        setProjMsg(status === 'draft' ? '✅ Saved as draft.' : '✅ Submitted for approval!');
        setProjForm({ title:'', schedule7:'Skill Development', sub_sector:'Vocational Training', target_beneficiaries:'', target_states:'', start_date:'', end_date:'', objectives:'', budget:'', own_contribution:'', other_sources:'', implementing_agency:'', agency_type:'NGO', mou_signed:'No — in progress' });
        setLoaded(l => ({ ...l, projects: false }));
      } catch(e) { setProjMsg('❌ ' + (e.message || 'Save failed.')); }
      setProjSaving(false);
    }

    return <>
      <Bc parts={['Projects','Propose New Project']} />
      <SectionHead title="Propose New Project 📋" />
      {projMsg && <Alert icon={projMsg.startsWith('✅') ? '✅' : '❌'} type={projMsg.startsWith('✅') ? 'success' : 'red'}>{projMsg}</Alert>}
      <Card>
        <CardTitle>📝 Project Details</CardTitle>
        <Field label="Project Title"><Inp value={pf.title} onChange={set('title')} placeholder="e.g. Skill Development for Youth in Rural Maharashtra" /></Field>
        <Grid>
          <Field label="Schedule VII Activity"><Sel value={pf.schedule7} onChange={set('schedule7')} options={['Eradicating Poverty','Promoting Education','Healthcare & Sanitation','Skill Development','Gender Equality','Environment','National Heritage','Sports','PM National Relief Fund']} /></Field>
          <Field label="Sub-Sector"><Sel value={pf.sub_sector} onChange={set('sub_sector')} options={['Vocational Training','Literacy','Digital Skills','Financial Literacy']} /></Field>
        </Grid>
        <Grid>
          <Field label="Target Beneficiaries"><Inp value={pf.target_beneficiaries} onChange={set('target_beneficiaries')} placeholder="500" /></Field>
          <Field label="Target States"><Inp value={pf.target_states} onChange={set('target_states')} placeholder="Maharashtra, Rajasthan" /></Field>
        </Grid>
        <Grid>
          <Field label="Start Date"><Inp type="date" value={pf.start_date} onChange={set('start_date')} /></Field>
          <Field label="End Date"><Inp type="date" value={pf.end_date} onChange={set('end_date')} /></Field>
        </Grid>
        <Field label="Project Objectives"><textarea rows={3} value={pf.objectives} onChange={set('objectives')} placeholder="Describe objectives…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
      </Card>
      <Card>
        <CardTitle>💰 Financial Details</CardTitle>
        <Grid cols={3}>
          <Field label="Estimated Budget (₹)"><Inp value={pf.budget} onChange={set('budget')} placeholder="50,00,000" /></Field>
          <Field label="Own Contribution (₹)"><Inp value={pf.own_contribution} onChange={set('own_contribution')} placeholder="e.g. 40,00,000" /></Field>
          <Field label="Other Sources (₹)"><Inp value={pf.other_sources} onChange={set('other_sources')} placeholder="e.g. 10,00,000" /></Field>
        </Grid>
        <Field label="Implementing Agency"><Inp value={pf.implementing_agency} onChange={set('implementing_agency')} placeholder="e.g. SkillBridge Institute Pvt. Ltd." /></Field>
        <Grid>
          <Field label="Agency Type"><Sel value={pf.agency_type} onChange={set('agency_type')} options={['NGO','Training Institute','Government Body','Direct Implementation']} /></Field>
          <Field label="MoU Signed"><Sel value={pf.mou_signed} onChange={set('mou_signed')} options={['Yes','No — in progress']} /></Field>
        </Grid>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <Btn outline onClick={() => saveProject('draft')} disabled={projSaving}>💾 Save Draft</Btn>
          <Btn green onClick={() => saveProject('pending')} disabled={projSaving}>📤 Submit for Approval</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelProjActive() {
    const active = projects.filter(p => p.status === 'active');
    return <>
      <Bc parts={['Projects','Active Projects']} />
      <SectionHead title="Active Projects 🚀" />
      <Card>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : active.length === 0 ? <div style={{ color:'#888', padding:12 }}>No active projects.</div>
         : <Table head={['Project','State','Budget','Spent','Beneficiaries','Status']} rows={active.map(p => [
             p.title, p.state_name,
             crore(p.budget), `${crore(p.spent)} (${pct(p.spent,p.budget)}%)`,
             (p.beneficiaries_actual||0).toLocaleString('en-IN'),
             <Badge color={p.status==='active'?'green':p.status==='delayed'?'gold':'teal'}>{p.status}</Badge>
           ])} />}
      </Card>
    </>;
  }

  function PanelProjDraft() {
    const drafts = projects.filter(p => p.status === 'draft');
    return <>
      <Bc parts={['Projects','Draft Projects']} />
      <SectionHead title="Draft Projects 📝" />
      <Card>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : drafts.length === 0 ? <div style={{ color:'#888', padding:12 }}>No draft projects.</div>
         : <Table head={['Title','State','Budget','Action']} rows={drafts.map(p => [
             p.title, p.state_name || '—', crore(p.budget),
             <><Btn sm outline onClick={() => { setProjForm({ title: p.title || '', schedule7: p.activity || 'Skill Development', sub_sector: p.sub_sector || 'Vocational Training', target_beneficiaries: p.beneficiaries_target || '', target_states: p.target_states || '', start_date: p.start_date || '', end_date: p.end_date || '', objectives: p.objectives || '', budget: p.budget || '', own_contribution: p.own_contribution || '', other_sources: p.other_sources || '', implementing_agency: p.implementing_agency || '', agency_type: p.agency_type || 'NGO', mou_signed: p.mou_signed || 'No — in progress' }); go('proj-new'); }}>Edit</Btn>{' '}<Btn sm green onClick={() => api.csrUpdateProject(p.id, { status: 'pending' }).then(() => { setLoaded(l => ({ ...l, projects: false })); loadProjects(); }).catch(() => {})}>Submit</Btn></>
           ])} />}
        <div style={{ marginTop:14 }}><Btn onClick={()=>go('proj-new')}>+ Propose New Project</Btn></div>
      </Card>
    </>;
  }

  function PanelProjCompleted() {
    const completed = projects.filter(p => p.status === 'completed');
    return <>
      <Bc parts={['Projects','Completed Projects']} />
      <SectionHead title="Completed Projects ✅" />
      <Card>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : completed.length === 0 ? <div style={{ color:'#888', padding:12 }}>No completed projects yet.</div>
         : <Table head={['Project','State','Beneficiaries','Fund Used','Certificate']} rows={completed.map(p => [
             p.title, p.state_name || '—',
             (p.beneficiaries_actual||0).toLocaleString('en-IN'),
             crore(p.spent),
             <Btn sm outline>Download</Btn>
           ])} />}
      </Card>
    </>;
  }

  function PanelProjApproval() {
    return <>
      <Bc parts={['Projects','Approval Status']} />
      <SectionHead title="Approval Status 🔄" />
      <Card>
        <CardTitle>📌 Pending Approvals</CardTitle>
        <Table head={['Project','Submitted','Stage','Remarks']} rows={[
          ['Tribal Youth Coding Program','Jul 1, 2026',<Badge color="gold">State Nodal Review</Badge>,'Awaiting SDIA verification'],
          ['Water Conservation — Vidarbha','Jun 28, 2026',<Badge color="blue">NSDC Review</Badge>,'Impact assessment pending'],
        ]} />
      </Card>
      <Card>
        <CardTitle>📋 Approval Workflow</CardTitle>
        <Step num={1} title="Internal Board Approval" sub="Board resolution and CSR committee sign-off" done />
        <Step num={2} title="Submit on Portal" sub="Project proposal submitted on SkillsNJobs" done />
        <Step num={3} title="State Nodal Review" sub="State Directorate of Skill Development review" />
        <Step num={4} title="NSDC / MSDE Approval" sub="Ministry level clearance for schemes" pending />
        <Step num={5} title="Project Activation" sub="Funds released and implementation begins" pending />
      </Card>
    </>;
  }

  function PanelBeneRegister() {
    const bf = beneForm;
    const set = k => e => setBeneForm(f => ({ ...f, [k]: e.target.value }));

    async function saveBeneficiary() {
      if (!bf.full_name.trim()) { setBeneMsg('Full name is required.'); return; }
      const nameErr = fieldValidate('name', bf.full_name);
      if (nameErr) { setBeneMsg('Name: ' + nameErr); return; }
      if (bf.aadhaar) { const aErr = fieldValidate('aadhaar', bf.aadhaar.replace(/\s/g,'')); if (aErr) { setBeneMsg('Aadhaar: ' + aErr); return; } }
      if (bf.mobile) { const mErr = fieldValidate('mobile', bf.mobile); if (mErr) { setBeneMsg('Mobile: ' + mErr); return; } }
      if (bf.email) { const eErr = fieldValidate('email', bf.email); if (eErr) { setBeneMsg('Email: ' + eErr); return; } }
      setBeneSaving(true); setBeneMsg('');
      try {
        const projectObj = projects.find(p => p.title === bf.project_id);
        await api.csrCreateBeneficiary({
          full_name: bf.full_name, dob: bf.dob, gender: bf.gender,
          category: bf.category, aadhaar: bf.aadhaar.replace(/\s/g,''), mobile: bf.mobile,
          state_name: bf.state_name, email: bf.email || null,
          project_id: projectObj?.id || null, course: bf.course,
          batch_code: bf.batch_code, enrollment_date: bf.enrollment_date,
        });
        setBeneMsg('✅ Beneficiary registered successfully!');
        setBeneForm({ full_name:'', dob:'', gender:'Male', category:'General', aadhaar:'', mobile:'', state_name:'Maharashtra', email:'', project_id:'', course:'Data Entry Operator', batch_code:'', enrollment_date:'', expected_completion:'' });
        setLoaded(l => ({ ...l, beneficiaries: false }));
      } catch(e) { setBeneMsg('❌ ' + (e.message || 'Registration failed.')); }
      setBeneSaving(false);
    }

    const projectOptions = projects.length ? projects.map(p => p.title) : ['— No projects yet —'];

    return <>
      <Bc parts={['Beneficiaries','Register Beneficiary']} />
      <SectionHead title="Register Beneficiary 👤" />
      {beneMsg && <Alert icon={beneMsg.startsWith('✅') ? '✅' : '❌'} type={beneMsg.startsWith('✅') ? 'success' : 'red'}>{beneMsg}</Alert>}
      <Card>
        <CardTitle>📋 Personal Details</CardTitle>
        <Grid><Field label="Full Name *"><ValidInp value={bf.full_name} onChange={set('full_name')} validate="name" placeholder="e.g. Ramesh Kumar" /></Field><Field label="Date of Birth"><Inp type="date" value={bf.dob} onChange={set('dob')} /></Field></Grid>
        <Grid><Field label="Gender"><Sel value={bf.gender} onChange={set('gender')} options={['Male','Female','Transgender']} /></Field><Field label="Category"><Sel value={bf.category} onChange={set('category')} options={['General','OBC','SC','ST','Minority','Differently Abled']} /></Field></Grid>
        <Grid><Field label="Aadhaar Number"><ValidInp value={bf.aadhaar} onChange={set('aadhaar')} placeholder="XXXX XXXX XXXX" validate="aadhaar" /></Field><Field label="Mobile *"><ValidInp value={bf.mobile} onChange={set('mobile')} placeholder="9XXXXXXXXX" validate="mobile" /></Field></Grid>
        <Grid><Field label="State / UT"><Sel value={bf.state_name} onChange={set('state_name')} options={['Maharashtra','Rajasthan','Uttar Pradesh','Bihar','Gujarat','Punjab','Tamil Nadu','Karnataka','Madhya Pradesh','West Bengal']} /></Field><Field label="Email (optional)"><ValidInp value={bf.email} onChange={set('email')} placeholder="email@example.com" validate="email" /></Field></Grid>
      </Card>
      <Card>
        <CardTitle>🎓 Training Enrollment</CardTitle>
        <Grid><Field label="Project"><Sel value={bf.project_id} onChange={set('project_id')} options={projectOptions} /></Field><Field label="Course / Trade"><Sel value={bf.course} onChange={set('course')} options={['Data Entry Operator','BPO Associate','Retail Sales','Healthcare Worker','Electrician','EV Technician','Digital Marketing','Beauty & Wellness']} /></Field></Grid>
        <Grid><Field label="Batch Code"><ValidInp value={bf.batch_code} onChange={set('batch_code')} validate="batchCode" placeholder="e.g. PMKVY-NM-2026-B3" /></Field><Field label="Enrollment Date"><Inp type="date" value={bf.enrollment_date} onChange={set('enrollment_date')} /></Field></Grid>
        <div style={{ textAlign:'right' }}><Btn green onClick={saveBeneficiary} disabled={beneSaving}>{beneSaving ? '⏳ Registering…' : '+ Register Beneficiary'}</Btn></div>
      </Card>
    </>;
  }

  function PanelBeneList() {
    return <>
      <Bc parts={['Beneficiaries','Beneficiary List']} />
      <SectionHead title="Beneficiary List 👥" />
      <Card>
        {!loaded.beneficiaries ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : beneficiaries.length === 0 ? <div style={{ color:'#888', padding:12 }}>No beneficiaries registered yet.</div>
         : <>
             <Table head={['Name','Gender','State','Project','Training Status','Batch']} rows={beneficiaries.map(b => [
               b.name, b.gender || '—', b.state_name || '—',
               b.project_title || '—',
               <Badge color={b.training_status==='completed'?'green':b.training_status==='in_progress'?'blue':b.training_status==='dropout'?'red':'teal'}>{b.training_status}</Badge>,
               b.batch_code || '—'
             ])} />
             <div style={{ marginTop:12, fontSize:12, color:'#64748b' }}>Total: {beneficiaries.length} beneficiaries</div>
           </>}
      </Card>
    </>;
  }

  function PanelBeneTrack() {
    const total = beneficiaries.length;
    const inProgress = beneficiaries.filter(b => b.training_status === 'in_progress').length;
    const completed = beneficiaries.filter(b => b.training_status === 'completed').length;
    const placed = beneficiaries.filter(b => b.placement_status === 'placed').length;
    return <>
      <Bc parts={['Beneficiaries','Track Progress']} />
      <SectionHead title="Track Progress 📈" />
      <Card>
        <CardTitle>📊 Overall Beneficiary Funnel</CardTitle>
        {!loaded.beneficiaries ? <div style={{ color:'#888', padding:12 }}>Loading…</div> : <>
          <StatRow n={total} label="Total Enrolled" pct={100} color={C.blue} />
          <StatRow n={inProgress} label="Training In Progress" pct={pct(inProgress,total)} color={C.teal} />
          <StatRow n={completed} label="Training Completed" pct={pct(completed,total)} color={C.green} />
          <StatRow n={placed} label="Placed" pct={pct(placed,total)} color={C.gold} />
        </>}
      </Card>
    </>;
  }

  function PanelBenePlacement() {
    const total = beneficiaries.length;
    const completed = beneficiaries.filter(b => b.training_status === 'completed').length;
    const placed = beneficiaries.filter(b => b.placement_status === 'placed').length;
    const selfEmployed = beneficiaries.filter(b => b.placement_status === 'self_employed').length;
    const placedList = beneficiaries.filter(b => b.placement_status === 'placed');
    return <>
      <Bc parts={['Beneficiaries','Placement Outcomes']} />
      <SectionHead title="Placement Outcomes 🎯" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
        <KpiCard val={placed} label="Total Placed" sub="From your projects" color={C.green} />
        <KpiCard val={`${pct(placed,completed)}%`} label="Placement Rate" sub="Of certified" color={C.blue} />
        <KpiCard val={selfEmployed} label="Self-Employed" sub="From your projects" color={C.teal} />
        <KpiCard val={`${pct(placed+selfEmployed,total)}%`} label="Overall Outcome" sub="Placed or self-employed" color={C.purple} />
      </div>
      <Card>
        <CardTitle>📋 Placed Beneficiaries</CardTitle>
        {!loaded.beneficiaries ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : placedList.length === 0 ? <div style={{ color:'#888', padding:12 }}>No placed beneficiaries yet.</div>
         : <Table head={['Name','Gender','State','Project','Batch']} rows={placedList.map(b => [
             b.name, b.gender||'—', b.state_name||'—', b.project_title||'—', b.batch_code||'—'
           ])} />}
      </Card>
    </>;
  }

  function PanelTpList() {
    return <>
      <Bc parts={['Training Partners','Empanelled Partners']} />
      <SectionHead title="Empanelled Training Partners 🎓" />
      <Card>
        {!loaded.tps ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : trainingPartners.length === 0 ? <div style={{ color:'#888', padding:12 }}>No training partners added yet.</div>
         : <Table head={['Partner','Type','State','District','Beneficiaries Trained','Status']} rows={trainingPartners.map(tp => [
             tp.name, tp.type||'—', tp.state_name||'—', tp.district||'—',
             (tp.beneficiaries_trained||0).toLocaleString('en-IN'),
             <Badge color={tp.status==='active'?'green':tp.status==='mou_expired'?'red':'gold'}>{tp.status}</Badge>
           ])} />}
        <div style={{ marginTop:14 }}><Btn onClick={()=>go('tp-add')}>+ Add New Partner</Btn></div>
      </Card>
    </>;
  }

  function PanelTpAdd() {
    const tf = tpForm;
    const set = k => e => setTpForm(f => ({ ...f, [k]: e.target.value }));

    async function addPartner() {
      if (!tf.org_name.trim() || !tf.contact_person.trim()) { setTpMsg('Organisation name and contact person are required.'); return; }
      const orgErr = validateText(tf.org_name, 'Organisation name', { min: 3, max: 200 });
      if (orgErr) { setTpMsg(orgErr); return; }
      const contErr = fieldValidate('name', tf.contact_person);
      if (contErr) { setTpMsg('Contact person: ' + contErr); return; }
      if (tf.email) { const eErr = fieldValidate('email', tf.email); if (eErr) { setTpMsg(eErr); return; } }
      setTpSaving(true); setTpMsg('');
      try {
        await api.csrCreateTP({ name: tf.org_name, type: tf.type, nsdc_reg: tf.nsdc_reg, state_name: tf.state_name, contact_person: tf.contact_person, email: tf.email, num_trainers: tf.num_trainers, max_batch_size: tf.max_batch_size });
        setTpMsg('✅ Partner added successfully!');
        setTpForm({ org_name:'', type:'Private ITC', nsdc_reg:'', state_name:'Maharashtra', contact_person:'', email:'', num_trainers:'10', max_batch_size:'30' });
        setLoaded(l => ({ ...l, tps: false }));
      } catch(e) { setTpMsg('❌ ' + (e.message || 'Failed to add partner.')); }
      setTpSaving(false);
    }

    return <>
      <Bc parts={['Training Partners','Add Training Partner']} />
      <SectionHead title="Add Training Partner ➕" />
      {tpMsg && <Alert icon={tpMsg.startsWith('✅') ? '✅' : '❌'} type={tpMsg.startsWith('✅') ? 'success' : 'red'}>{tpMsg}</Alert>}
      <Card>
        <Grid>
          <Field label="Organisation Name *"><Inp value={tf.org_name} onChange={set('org_name')} placeholder="e.g. SkillBridge Institute" /></Field>
          <Field label="Type"><Sel value={tf.type} onChange={set('type')} options={['Private ITC','Government ITI','NGO','Society','Trust','Private Company']} /></Field>
        </Grid>
        <Grid>
          <Field label="NSDC Registration No."><Inp value={tf.nsdc_reg} onChange={set('nsdc_reg')} placeholder="NSDC-XXXX" /></Field>
          <Field label="State"><Sel value={tf.state_name} onChange={set('state_name')} options={['Maharashtra','Rajasthan','UP','Bihar','Gujarat','Punjab','Tamil Nadu','Karnataka']} /></Field>
        </Grid>
        <Grid>
          <Field label="Contact Person *"><Inp value={tf.contact_person} onChange={set('contact_person')} placeholder="Name" /></Field>
          <Field label="Email"><ValidInp type="email" value={tf.email} onChange={set('email')} validate="email" /></Field>
        </Grid>
        <Grid>
          <Field label="No. of Trainers"><Inp value={tf.num_trainers} onChange={set('num_trainers')} /></Field>
          <Field label="Max Batch Size"><Inp value={tf.max_batch_size} onChange={set('max_batch_size')} /></Field>
        </Grid>
        <div style={{ textAlign:'right' }}><Btn green onClick={addPartner} disabled={tpSaving}>{tpSaving ? '⏳ Adding…' : '+ Add Partner'}</Btn></div>
      </Card>
    </>;
  }

  function PanelTpPerformance() {
    return <>
      <Bc parts={['Training Partners','Partner Performance']} />
      <SectionHead title="Partner Performance 📊" />
      <Card>
        <Table head={['Partner','Enrolled','Certified','Placed','Cert Rate','Placement Rate','Score']} rows={[
          ['EV Academy India','480','456','380','95%','83%',<Badge color="green">⭐ 4.9</Badge>],
          ['SkillBridge Institute','1,200','1,080','920','90%','85%',<Badge color="green">⭐ 4.7</Badge>],
          ['TrainRight Academy','840','756','640','90%','85%',<Badge color="blue">⭐ 4.5</Badge>],
          ['TechLearn Pvt Ltd','2,100','1,800','1,200','86%','67%',<Badge color="blue">⭐ 4.3</Badge>],
          ['HealSkill Foundation','620','480','320','77%','67%',<Badge color="gold">⭐ 4.1</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelTpMou() {
    return <>
      <Bc parts={['Training Partners','MoU / Agreements']} />
      <SectionHead title="MoU & Agreements 📄" />
      <Card>
        <Table head={['Partner','MoU Date','Valid Till','Scope','Status','Action']} rows={[
          ['SkillBridge Institute','Apr 1, 2025','Mar 31, 2026','1,200 beneficiaries',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['TrainRight Academy','Apr 5, 2025','Mar 31, 2026','840 beneficiaries',<Badge color="green">Active</Badge>,<Btn sm outline>View</Btn>],
          ['TechLearn Pvt Ltd','Apr 10, 2025','Mar 31, 2026','2,100 beneficiaries',<Badge color="blue">Active</Badge>,<Btn sm outline>View</Btn>],
          ['HealSkill Foundation','May 1, 2025','Mar 31, 2026','620 beneficiaries',<Badge color="gold">Review</Badge>,<Btn sm outline>View</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>📤 Upload New MoU</Btn></div>
      </Card>
    </>;
  }

  function PanelFundAllocation() {
    return <>
      <Bc parts={['Funds','Fund Allocation']} />
      <SectionHead title="Fund Allocation 💰" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
        <KpiCard val="₹20.0 Cr" label="Total CSR Obligation" sub="FY 2025-26" color={C.navy} />
        <KpiCard val="₹18.4 Cr" label="Allocated to Projects" sub="92% of obligation" color={C.blue} />
        <KpiCard val="₹1.6 Cr" label="Unallocated / Unspent" sub="Must transfer by Sep 30" color={C.red} />
      </div>
      <Card>
        <Table head={['Project','Allocated','Disbursed','Remaining','Utilization']} rows={[
          ['Skill Dev — Navi Mumbai','₹1.50 Cr','₹1.10 Cr','₹0.40 Cr',<Badge color="green">73%</Badge>],
          ['Women Empowerment','₹80 L','₹52 L','₹28 L',<Badge color="blue">65%</Badge>],
          ['Digital Literacy Drive','₹2.00 Cr','₹1.60 Cr','₹0.40 Cr',<Badge color="green">80%</Badge>],
          ['Healthcare Outreach','₹60 L','₹38 L','₹22 L',<Badge color="gold">63%</Badge>],
          ['EV Technician Training','₹1.20 Cr','₹0.70 Cr','₹0.50 Cr',<Badge color="teal">58%</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelFundDisbursements() {
    const df = disbForm;
    const set = k => e => setDisbForm(f => ({ ...f, [k]: e.target.value }));

    async function saveDisbursement() {
      if (!df.amount || isNaN(Number(df.amount)) || Number(df.amount) <= 0) { setDisbMsg('A valid amount is required.'); return; }
      if (!df.payment_date) { setDisbMsg('Payment date is required.'); return; }
      setDisbSaving(true); setDisbMsg('');
      try {
        const projectObj = projects.find(p => p.title === df.project_id);
        await api.csrCreateDisbursement({
          project_id: projectObj?.id || null,
          recipient: df.recipient,
          amount: Number(df.amount),
          payment_date: df.payment_date,
          mode: df.mode,
          purpose: df.purpose,
        });
        setDisbMsg('✅ Disbursement request submitted!');
        setDisbForm({ project_id:'', recipient:'', amount:'', payment_date:'', mode:'NEFT', purpose:'' });
        setLoaded(l => ({ ...l, disbursements: false }));
        loadDisbursements();
      } catch(e) { setDisbMsg('❌ ' + (e.message || 'Failed to submit.')); }
      setDisbSaving(false);
    }

    const projectOptions = projects.length ? ['— Select Project —', ...projects.map(p => p.title)] : ['— No projects yet —'];

    return <>
      <Bc parts={['Funds','Disbursements']} />
      <SectionHead title="Disbursements 📤" />
      {disbMsg && <Alert icon={disbMsg.startsWith('✅') ? '✅' : '❌'} type={disbMsg.startsWith('✅') ? 'success' : 'red'}>{disbMsg}</Alert>}
      <Card>
        <CardTitle>➕ New Disbursement Request</CardTitle>
        <Grid><Field label="Project"><Sel value={df.project_id} onChange={set('project_id')} options={projectOptions} /></Field><Field label="Recipient / Training Partner"><Inp value={df.recipient} onChange={set('recipient')} placeholder="e.g. SkillBridge Institute" /></Field></Grid>
        <Grid cols={3}><Field label="Amount (₹) *"><Inp type="number" value={df.amount} onChange={set('amount')} placeholder="e.g. 5000000" /></Field><Field label="Payment Date *"><Inp type="date" value={df.payment_date} onChange={set('payment_date')} /></Field><Field label="Mode"><Sel value={df.mode} onChange={set('mode')} options={['NEFT','RTGS','Cheque','UPI']} /></Field></Grid>
        <Field label="Purpose / Milestone"><Inp value={df.purpose} onChange={set('purpose')} placeholder="e.g. Batch 3 training completion payment" /></Field>
        <div style={{ textAlign:'right' }}><Btn green onClick={saveDisbursement} disabled={disbSaving}>{disbSaving ? '⏳ Submitting…' : 'Submit Disbursement Request'}</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Recent Disbursements</CardTitle>
        {!loaded.disbursements ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : disbursements.length === 0 ? <div style={{ color:'#888', padding:12 }}>No disbursements recorded yet.</div>
         : <Table head={['Project','Recipient','Amount','Mode','Date','Status']} rows={disbursements.map(d => [
             d.project_title||'—', d.recipient||'—', crore(d.amount), d.mode||'—', d.disbursed_date||'—',
             <Badge color={d.status==='disbursed'?'green':d.status==='returned'?'red':'gold'}>{d.status}</Badge>
           ])} />}
      </Card>
    </>;
  }

  function PanelFundUtilization() {
    const utilPct = pct(stats.totalSpent, stats.totalBudget);
    return <>
      <Bc parts={['Funds','Utilization Reports']} />
      <SectionHead title="Utilization Reports 📊" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
        <KpiCard val={crore(stats.totalBudget)} label="Total Budget Allocated" sub="All active projects" color={C.navy} />
        <KpiCard val={crore(stats.totalSpent)} label="Total Spent" sub="Across all projects" color={C.green} />
        <KpiCard val={`${utilPct}%`} label="Utilization Rate" sub="Spent vs allocated" color={utilPct >= 75 ? C.green : utilPct >= 50 ? C.gold : C.red} />
      </div>
      <Card>
        <CardTitle>📊 Project-wise Utilization</CardTitle>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : projects.length === 0 ? <div style={{ color:'#888', padding:12 }}>No projects found.</div>
         : <Table head={['Project','Budget','Spent','Utilization']} rows={projects.map(p => {
             const u = pct(p.spent, p.budget);
             return [
               p.title, crore(p.budget), crore(p.spent),
               <Badge color={u>=75?'green':u>=50?'gold':'red'}>{u}%</Badge>
             ];
           })} />}
        <div style={{ marginTop:14, display:'flex', gap:10 }}><Btn outline>📥 Download Report</Btn><Btn>📊 Full Year Report</Btn></div>
      </Card>
    </>;
  }

  function PanelFundUnspent() {
    const uf = unspentForm;
    const set = k => e => setUnspentForm(f => ({ ...f, [k]: e.target.value }));

    async function saveUnspent(status) {
      const fyErr = fieldValidate('fy', uf.financial_year);
      if (fyErr) { setUnspentMsg('Financial year: ' + fyErr); return; }
      if (!uf.unspent_amount || isNaN(Number(uf.unspent_amount.replace(/[₹,\s]/g,''))) ) { setUnspentMsg('A valid unspent amount is required.'); return; }
      setUnspentSaving(true); setUnspentMsg('');
      try {
        const amount = Number(uf.unspent_amount.replace(/[₹,\s]/g,''));
        await api.csrCreateUnspentFund({
          financial_year: uf.financial_year, unspent_amount: amount,
          reason: uf.reason, transfer_deadline: uf.transfer_deadline,
          transfer_destination: uf.transfer_destination, remediation_plan: uf.remediation_plan,
          status,
        });
        setUnspentMsg(status === 'transferred' ? '✅ Transfer initiated!' : '✅ Plan saved successfully!');
        setLoaded(l => ({ ...l, unspent: false }));
        api.csrUnspentFunds().then(setUnspentFunds).catch(() => {});
      } catch(e) { setUnspentMsg('❌ ' + (e.message || 'Save failed.')); }
      setUnspentSaving(false);
    }

    return <>
      <Bc parts={['Funds','Unspent CSR Funds']} />
      <SectionHead title="Unspent CSR Funds ⚠️" />
      <Alert icon="⚠️" type="warn">Unspent CSR amounts must be transferred to a designated account or PM National Relief Fund by the deadline under Section 135(6).</Alert>
      {unspentMsg && <Alert icon={unspentMsg.startsWith('✅') ? '✅' : '❌'} type={unspentMsg.startsWith('✅') ? 'success' : 'red'}>{unspentMsg}</Alert>}
      <Card>
        <CardTitle>📝 Record Unspent Funds</CardTitle>
        <Grid><Field label="Financial Year"><ValidInp value={uf.financial_year} onChange={set('financial_year')} validate="fy" placeholder="e.g. 2025-26" /></Field><Field label="Unspent Amount (₹)"><Inp value={uf.unspent_amount} onChange={set('unspent_amount')} placeholder="e.g. 16000000" /></Field></Grid>
        <Grid><Field label="Reason"><Sel value={uf.reason} onChange={set('reason')} options={['Project Delays','Vendor Issues','Regulatory Hold','Planning Gap']} /></Field><Field label="Transfer Deadline"><Inp type="date" value={uf.transfer_deadline} onChange={set('transfer_deadline')} /></Field></Grid>
        <Field label="Transfer Destination"><Sel value={uf.transfer_destination} onChange={set('transfer_destination')} options={['Designated Unspent CSR Fund Account','PM National Relief Fund','PM CARES Fund','Ongoing CSR Projects']} /></Field>
        <Field label="Remediation Plan"><textarea rows={3} value={uf.remediation_plan} onChange={set('remediation_plan')} placeholder="Describe plan…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn onClick={() => saveUnspent('pending')} disabled={unspentSaving}>{unspentSaving ? '⏳…' : '💾 Save Plan'}</Btn>
          <Btn green onClick={() => saveUnspent('transferred')} disabled={unspentSaving}>📤 Initiate Transfer</Btn>
        </div>
      </Card>
      {unspentFunds.length > 0 && (
        <Card>
          <CardTitle>📋 Recorded Unspent Fund Plans</CardTitle>
          <Table head={['FY','Amount','Reason','Destination','Status']} rows={unspentFunds.map(u => [
            u.financial_year, crore(u.unspent_amount), u.reason||'—', u.transfer_destination||'—',
            <Badge color={u.status==='transferred'?'green':u.status==='pending'?'gold':'blue'}>{u.status}</Badge>
          ])} />
        </Card>
      )}
    </>;
  }

  function PanelSchemePmkvy() {
    return <>
      <Bc parts={['Schemes','PMKVY']} />
      <SectionHead title="PMKVY — Pradhan Mantri Kaushal Vikas Yojana 🏛️" />
      <Card>
        <div style={{ fontSize:13, color:'#374151', lineHeight:1.8, marginBottom:12 }}>
          <strong>PMKVY 4.0</strong> offers industry-aligned short-term skill training with certification by Sector Skill Councils.{' '}
          <Badge color="blue">₹800–₹8,000 per candidate</Badge>{' '}<Badge color="green">Assessment by SSC</Badge>{' '}<Badge color="teal">Job placement linkage</Badge>
        </div>
      </Card>
      <Card>
        <CardTitle>📊 My PMKVY Projects</CardTitle>
        <Table head={['Project','Partner','Trade','Enrolled','Certified','Placed','Status']} rows={[
          ['Skill Dev — NM','SkillBridge','Data Entry Operator','400','370','320',<Badge color="green">Active</Badge>],
          ['Digital Literacy — UP','TechLearn','BPO Associate','600','510','380',<Badge color="blue">Active</Badge>],
          ['EV Technician — GJ','EV Academy','EV Technician','200','190','160',<Badge color="teal">Active</Badge>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Apply for New PMKVY Batch</Btn></div>
      </Card>
    </>;
  }

  function PanelSchemeDdugky() {
    return <>
      <Bc parts={['Schemes','DDU-GKY']} />
      <SectionHead title="DDU-GKY — Deen Dayal Upadhyaya Grameen Kaushalya Yojana 🌾" />
      <Card>
        <div style={{ fontSize:13, color:'#374151', lineHeight:1.8, marginBottom:12 }}>
          <strong>DDU-GKY</strong> targets rural youth aged 15-35 from BPL families with free skill training and mandatory job placement.{' '}
          <Badge color="green">100% placement mandate</Badge>{' '}<Badge color="gold">Post-placement support</Badge>
        </div>
      </Card>
      <Card>
        <CardTitle>📋 My DDU-GKY Projects</CardTitle>
        <Table head={['Project','PIA','State','Target','Placed','Rate']} rows={[
          ['Agri-Tech — Punjab','SkillBridge','Punjab','390','320',<Badge color="green">82%</Badge>],
          ['Women Empowerment','TrainRight','Rajasthan','840','680',<Badge color="green">81%</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelSchemeStar() {
    return <>
      <Bc parts={['Schemes','STAR Scheme']} />
      <SectionHead title="STAR Scheme — Standard Training Assessment and Reward ⭐" />
      <Card>
        <div style={{ fontSize:13, color:'#374151', lineHeight:1.8, marginBottom:12 }}>
          STAR offers <strong>monetary rewards to candidates</strong> who get certified in pre-defined job roles.{' '}
          <Badge color="teal">₹500–₹2,000 reward per candidate</Badge>{' '}<Badge color="blue">Aadhaar-linked disbursement</Badge>
        </div>
      </Card>
      <Card>
        <CardTitle>📊 STAR Benefits in My Projects</CardTitle>
        <Table head={['Project','Certified','Rewards Claimed','Amount Released','Status']} rows={[
          ['Skill Dev — NM','370','320','₹4.8 L',<Badge color="green">Settled</Badge>],
          ['Digital Literacy — UP','510','480','₹7.2 L',<Badge color="gold">Processing</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelSchemeNaps() {
    return <>
      <Bc parts={['Schemes','NAPS / NATS']} />
      <SectionHead title="NAPS / NATS 📜" />
      <Card>
        <CardTitle>NAPS — National Apprenticeship Promotion Scheme</CardTitle>
        <div style={{ fontSize:13, color:'#374151', lineHeight:1.8, marginBottom:12 }}>
          Government shares <strong>25% of stipend</strong> (max ₹1,500/month) per apprentice. Promotes industry-based apprenticeship.
        </div>
        <div style={{ color:'#94a3b8', fontSize:13, padding:'12px 0', textAlign:'center' }}>No apprentice enrollments recorded yet</div>
        <div style={{ marginTop:14 }}><Btn>+ Enroll New Apprentice</Btn></div>
      </Card>
    </>;
  }

  function PanelRepImpact() {
    return <>
      <Bc parts={['Reports','Impact Reports']} />
      <SectionHead title="Impact Reports 🌟" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
        <KpiCard val="6,840" label="Beneficiaries Certified" sub="This year" color={C.green} />
        <KpiCard val="4,890" label="Placed in Jobs" sub="76% placement rate" color={C.blue} />
        <KpiCard val="₹14,200" label="Avg Monthly CTC" sub="Entry level" color={C.teal} />
        <KpiCard val="3,240" label="Women Beneficiaries" sub="47% of total" color={C.purple} />
      </div>
      <Card>
        <CardTitle>State-wise Impact</CardTitle>
        <Table head={['State','Enrolled','Certified','Placed','Impact Score']} rows={[
          ['Maharashtra','2,100','1,890','1,620',<Badge color="green">High</Badge>],
          ['Rajasthan','840','756','640',<Badge color="green">High</Badge>],
          ['Uttar Pradesh','2,400','2,160','1,400',<Badge color="blue">Medium</Badge>],
          ['Bihar','620','480','320',<Badge color="gold">Medium</Badge>],
          ['Gujarat','480','440','370',<Badge color="teal">High</Badge>],
        ]} />
        <div style={{ marginTop:14, display:'flex', gap:10 }}><Btn outline>📥 Download Report</Btn><Btn>📤 Share with Board</Btn></div>
      </Card>
    </>;
  }

  function PanelRepFinancial() {
    return <>
      <Bc parts={['Reports','Financial Reports']} />
      <SectionHead title="Financial Reports 💰" />
      <Card>
        <Table head={['Financial Year','Obligation','Actual Spend','Unspent','Utilization %']} rows={[
          ['FY 2025-26','₹20.0 Cr','₹18.4 Cr','₹1.6 Cr',<Badge color="green">92%</Badge>],
          ['FY 2024-25','₹18.0 Cr','₹17.8 Cr','₹0.2 Cr',<Badge color="green">99%</Badge>],
          ['FY 2023-24','₹16.5 Cr','₹16.5 Cr','—','100%'],
          ['FY 2022-23','₹14.0 Cr','₹13.2 Cr','₹0.8 Cr',<Badge color="blue">94%</Badge>],
        ]} />
        <div style={{ marginTop:14, display:'flex', gap:10 }}><Btn outline>📥 Download Statement</Btn><Btn>📊 Export to Excel</Btn></div>
      </Card>
    </>;
  }

  function PanelRepAnnual() {
    return <>
      <Bc parts={['Reports','Annual CSR Report']} />
      <SectionHead title="Annual CSR Report 📋" />
      <Card>
        <CardTitle>🔄 Generate Report</CardTitle>
        <Grid><Field label="Financial Year"><Sel options={['FY 2025-26','FY 2024-25','FY 2023-24']} /></Field><Field label="Format"><Sel options={['PDF','Word Document','Excel']} /></Field></Grid>
        <div style={{ marginTop:14, textAlign:'right' }}><Btn green>🔄 Generate Report</Btn></div>
      </Card>
      <Card>
        <CardTitle>📁 Past Annual Reports</CardTitle>
        <Table head={['Year','Generated On','Pages','Action']} rows={[
          ['FY 2024-25','Apr 15, 2025','42',<Btn sm outline>Download</Btn>],
          ['FY 2023-24','Apr 12, 2024','38',<Btn sm outline>Download</Btn>],
          ['FY 2022-23','Apr 18, 2023','35',<Btn sm outline>Download</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepSector() {
    return <>
      <Bc parts={['Reports','Sector-wise Report']} />
      <SectionHead title="Sector-wise Report 🏭" />
      <Card>
        <Table head={['Sector (Schedule VII)','Projects','Beneficiaries','Spend','Placement Rate']} rows={[
          ['Skill Development & Livelihood','7','5,200','₹12.4 Cr',<Badge color="green">78%</Badge>],
          ['Healthcare & Sanitation','2','620','₹3.2 Cr',<Badge color="blue">62%</Badge>],
          ['Promoting Education','2','840','₹2.2 Cr',<Badge color="teal">N/A</Badge>],
          ['Environment Sustainability','1','180','₹0.6 Cr',<Badge color="purple">N/A</Badge>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepGeo() {
    return <>
      <Bc parts={['Reports','Geographic Report']} />
      <SectionHead title="Geographic Report 🗺️" />
      <Card>
        <Table head={['State','Projects','Beneficiaries','Spend','Focus Districts']} rows={[
          ['Maharashtra','3','2,100','₹6.5 Cr','Mumbai, Navi Mumbai, Pune'],
          ['Uttar Pradesh','2','2,400','₹5.2 Cr','Lucknow, Varanasi, Agra'],
          ['Rajasthan','2','840','₹2.2 Cr','Jaipur, Jodhpur'],
          ['Bihar','1','620','₹1.6 Cr','Patna, Muzaffarpur'],
          ['Gujarat','2','480','₹2.4 Cr','Ahmedabad, Surat'],
          ['Punjab','1','390','₹0.9 Cr','Ludhiana, Amritsar'],
        ]} />
        <div style={{ marginTop:14 }}><Btn outline>📥 Download State Report</Btn></div>
      </Card>
    </>;
  }

  function PanelCompSchedule7() {
    return <>
      <Bc parts={['Compliance','Schedule VII']} />
      <SectionHead title="Schedule VII Compliance 📜" />
      <Card>
        <p style={{ fontSize:13, color:'#374151', marginBottom:14 }}>CSR activities must fall under one or more Schedule VII categories under Section 135 of the Companies Act, 2013.</p>
        {[
          ['i','Eradicating extreme poverty, hunger, malnutrition','Not in current scope',false,true],
          ['ii','Promoting education, vocational skills','✅ Active — ₹2.2 Cr',true,false],
          ['iii','Promoting gender equality, empowering women','✅ Active — ₹2.2 Cr',true,false],
          ['iv','Reducing infant mortality, maternal health','Not in current scope',false,true],
          ['vii','Employment enhancing vocational skills','✅ Active — ₹12.4 Cr',true,false],
          ['vi','Environmental sustainability','✅ Active — ₹0.6 Cr',true,false],
        ].map(([n,title,sub,done,pending])=>(
          <Step key={n} num={n} title={title} sub={sub} done={done} pending={pending} />
        ))}
      </Card>
    </>;
  }

  function PanelCompCsr1() {
    return <>
      <Bc parts={['Compliance','Form CSR-1']} />
      <SectionHead title="Form CSR-1 📄" />
      <Alert icon="ℹ️" type="info">Form CSR-1 is filed on the MCA portal to register an Implementing Agency (IA). Each IA must be CSR-1 registered before receiving CSR funds.</Alert>
      <Card>
        <CardTitle>📋 Registered Implementing Agencies</CardTitle>
        <Table head={['Implementing Agency','CIN / Reg No.','CSR-1 Date','Status','Action']} rows={[
          ['SkillBridge Institute Pvt Ltd','U85100MH2015PTC266234','Jan 10, 2025',<Badge color="green">Verified</Badge>,<Btn sm outline>View</Btn>],
          ['TrainRight Academy Society','S-00123/RJ/2018','Jan 15, 2025',<Badge color="green">Verified</Badge>,<Btn sm outline>View</Btn>],
          ['HealSkill Foundation','U85310BR2012NPL012345','Feb 01, 2025',<Badge color="gold">Under Review</Badge>,<Btn sm outline>View</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>+ Register New IA (CSR-1)</Btn></div>
      </Card>
    </>;
  }

  function PanelCompCsr2() {
    return <>
      <Bc parts={['Compliance','Form CSR-2']} />
      <SectionHead title="Form CSR-2 — Annual Report 📝" />
      <Alert icon="⚠️" type="warn"><strong>CSR-2 for FY 2025-26</strong> is due by <strong>30 Sep 2026</strong>. This is filed separately on the MCA21 portal.</Alert>
      <Card>
        <CardTitle>📋 Filing Checklist</CardTitle>
        {[
          [true,'Average net profit of 3 preceding FYs calculated','₹1,000 Cr (avg)'],
          [true,'2% CSR obligation computed','₹20.0 Cr'],
          [true,'Total amount spent filled','₹18.4 Cr'],
          [true,'Unspent amount identified','₹1.6 Cr'],
          [false,'Unspent amount transferred to designated account','Pending by Sep 30'],
          [false,'CSR-2 form filed on MCA21 portal','Pending'],
        ].map(([done,title,sub],i)=>(
          <Step key={i} num={i+1} title={title} sub={sub} done={done} pending={!done} />
        ))}
        <div style={{ marginTop:14 }}><Btn teal>🔗 Open MCA21 Portal to File CSR-2</Btn></div>
      </Card>
    </>;
  }

  function PanelCompBoard() {
    return <>
      <Bc parts={['Compliance','Board Resolutions']} />
      <SectionHead title="Board Resolutions 🏛️" />
      <Card>
        <Table head={['Resolution','Date','Subject','Status','Action']} rows={[
          ['BR-2025-CSR-001','Apr 01, 2025','Annual CSR Budget & Plan — FY26',<Badge color="green">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['BR-2025-CSR-002','Apr 15, 2025','SkillBridge Institute engagement as IA',<Badge color="green">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['BR-2025-CSR-003','Jul 01, 2025','Q1 Expenditure Ratification',<Badge color="green">Verified</Badge>,<Btn sm outline>Download</Btn>],
          ['BR-2025-CSR-004','Sep 30, 2025','Q2 Plan Revision',<Badge color="gold">Pending Upload</Badge>,<Btn sm>Upload</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn>📤 Upload Resolution</Btn></div>
      </Card>
    </>;
  }

  function PanelCompAudit() {
    return <>
      <Bc parts={['Compliance','Audit Trail']} />
      <SectionHead title="Audit Trail 🔍" />
      <Card>
        <Table head={['Timestamp','User','Action','Details','IP Address']} rows={[
          ['Jul 4, 2026 · 11:02','Amrita Patel','Document Uploaded','CSR Board Resolution Q1','122.xx.xx.12'],
          ['Jul 4, 2026 · 10:45','Finance Team','Disbursement Initiated','₹1.2 Cr to SkillBridge','122.xx.xx.14'],
          ['Jul 3, 2026 · 4:30 PM','Amrita Patel','Report Generated','Q1 Impact Report — FY26','122.xx.xx.12'],
          ['Jul 2, 2026 · 3:15 PM','Admin','Project Updated','Skill Dev NM — target revised','122.xx.xx.10'],
          ['Jul 1, 2026 · 9:00 AM','Amrita Patel','Login','Successful login','122.xx.xx.12'],
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
        <Grid><Field label="Category"><Sel options={['CSR Registration','Fund Transfer','Project Approval','Compliance Query','Technical Issue','Other']} /></Field><Field label="Priority"><Sel options={['Low','Medium','High','Critical']} defaultValue="Medium" /></Field></Grid>
        <Field label="Subject"><Inp placeholder="e.g. Unable to upload CSR-1 document" /></Field>
        <Field label="Description"><textarea className="inp" rows={4} placeholder="Describe your issue…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn green>📩 Submit Ticket</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 My Tickets</CardTitle>
        <Table head={['Ticket ID','Category','Subject','Status','Updated']} rows={[
          ['TKT-20260001','Fund Transfer','NEFT to SkillBridge failed',<Badge color="green">Resolved</Badge>,'Jul 3, 2026'],
          ['TKT-20260002','Compliance','CSR-2 filing date extension?',<Badge color="gold">In Progress</Badge>,'Jul 2, 2026'],
          ['TKT-20260003','Technical','Login OTP not received',<Badge color="green">Resolved</Badge>,'Jun 28, 2026'],
        ]} />
      </Card>
    </>;
  }

  function PanelGrievance() {
    return <>
      <Bc parts={['Support','Grievance']} />
      <SectionHead title="Grievance Redressal 📣" />
      <Alert icon="ℹ️" type="info">Grievances related to CSR project disbursement delays, beneficiary issues, or scheme approvals. Expected resolution: 15 working days.</Alert>
      <Card>
        <Field label="Grievance Type"><Sel options={['Project Approval Delay','Fund Disbursement Delay','Training Partner Issue','Beneficiary Welfare','Scheme Non-compliance','Other']} /></Field>
        <Field label="Against (If Applicable)"><Inp placeholder="e.g. State Nodal Agency / Training Partner" /></Field>
        <Field label="Description"><textarea className="inp" rows={5} placeholder="Describe your grievance with relevant dates, amounts, and details…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn danger>📤 Submit Grievance</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Past Grievances</CardTitle>
        <Table head={['GRV ID','Type','Filed On','Status','Resolution']} rows={[
          ['GRV-2026-001','Fund Disbursement Delay','Jun 15, 2026',<Badge color="green">Resolved</Badge>,'Credited within 5 days after escalation'],
          ['GRV-2026-002','Project Approval Delay','Jun 28, 2026',<Badge color="gold">Under Review</Badge>,'Escalated to NSDC HQ'],
        ]} />
      </Card>
    </>;
  }

  function PanelFAQ() {
    return <>
      <Bc parts={['Support','FAQ']} />
      <SectionHead title="Frequently Asked Questions ❓" />
      {[
        ['What is the CSR obligation under Companies Act, 2013?','Every company with net worth ₹500 Cr+, turnover ₹1,000 Cr+, or net profit ₹5 Cr+ must spend at least 2% of its average net profit of the preceding 3 FYs on CSR activities.'],
        ['Which activities qualify under Schedule VII?','Activities like poverty alleviation, education, healthcare, gender equality, environmental sustainability, skill development, and contributions to national funds qualify.'],
        ['What is the deadline to file CSR-2?','Form CSR-2 for FY 2025-26 must be filed on the MCA21 portal by 30 September 2026 as a standalone form, separate from the Annual Return.'],
        ['What happens to unspent CSR funds?','Unspent funds for ongoing projects must be transferred to a special account within 30 days of FY end. For non-ongoing projects, funds must go to PM National Relief Fund or similar designated funds.'],
        ['Can CSR funds be used for employee benefits?','No. CSR activities cannot be for the exclusive benefit of employees, their family members, or the company itself.'],
        ['How is an Implementing Agency registered?','An IA must file Form CSR-1 on MCA21 before receiving CSR funds. You can verify their registration from the CSR-1 registry.'],
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

  function renderPanel() {
    switch(panel) {
      case 'dashboard':       return PanelDashboard();
      case 'notifications':   return PanelNotifications();
      case 'profile-info':    return PanelProfileInfo();
      case 'profile-contact': return PanelProfileContact();
      case 'profile-docs':    return PanelProfileDocs();
      case 'profile-bank':    return PanelProfileBank();
      case 'proj-new':        return PanelProjNew();
      case 'proj-active':     return PanelProjActive();
      case 'proj-draft':      return PanelProjDraft();
      case 'proj-completed':  return PanelProjCompleted();
      case 'proj-approval':   return PanelProjApproval();
      case 'bene-register':   return PanelBeneRegister();
      case 'bene-list':       return PanelBeneList();
      case 'bene-track':      return PanelBeneTrack();
      case 'bene-placement':  return PanelBenePlacement();
      case 'tp-list':         return PanelTpList();
      case 'tp-add':          return PanelTpAdd();
      case 'tp-performance':  return PanelTpPerformance();
      case 'tp-mou':          return PanelTpMou();
      case 'fund-allocation': return PanelFundAllocation();
      case 'fund-disbursements': return PanelFundDisbursements();
      case 'fund-utilization':return PanelFundUtilization();
      case 'fund-unspent':    return PanelFundUnspent();
      case 'scheme-pmkvy':    return PanelSchemePmkvy();
      case 'scheme-ddugky':   return PanelSchemeDdugky();
      case 'scheme-star':     return PanelSchemeStar();
      case 'scheme-naps':     return PanelSchemeNaps();
      case 'rep-impact':      return PanelRepImpact();
      case 'rep-financial':   return PanelRepFinancial();
      case 'rep-annual':      return PanelRepAnnual();
      case 'rep-sector':      return PanelRepSector();
      case 'rep-geo':         return PanelRepGeo();
      case 'comp-schedule7':  return PanelCompSchedule7();
      case 'comp-csr1':       return PanelCompCsr1();
      case 'comp-csr2':       return PanelCompCsr2();
      case 'comp-board':      return PanelCompBoard();
      case 'comp-audit':      return PanelCompAudit();
      case 'helpdesk':        return PanelHelpdesk();
      case 'grievance':       return PanelGrievance();
      case 'faq':             return PanelFAQ();
      case 'settings':        return PanelSettings();
      default:                return <SectionHead title="Panel Not Found" />;
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      {Sidebar()}
      {Topbar()}
      <div style={{ marginLeft: isMobile ? 0 : SW, marginTop:TH, padding:16, minHeight:`calc(100vh - ${TH}px)`, overflowX:'hidden', boxSizing:'border-box' }}>
        {renderPanel()}
      </div>
    </div>
  );
}
