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
  { key:'camp-create',    label:'Create Campaign',           section:'CSR Campaigns' },
  { key:'camp-list',      label:'My Campaigns',              section:'CSR Campaigns' },
  { key:'camp-applications', label:'Received Proposals',     section:'CSR Campaigns' },
  { key:'camp-approval',  label:'Approval Workflow',         section:'CSR Campaigns' },
  { key:'camp-progress',  label:'Progress Reports',          section:'CSR Campaigns' },
  { key:'audit-list',     label:'Field Audits',              section:'Audit & Verification' },
  { key:'audit-new',      label:'Schedule Audit',            section:'Audit & Verification' },
  { key:'ai-proposal',    label:'Proposal Quality Scoring',   section:'AI Components' },
  { key:'ai-duplicate',   label:'Duplicate Proposal Detection',section:'AI Components' },
  { key:'ai-budget',      label:'Budget Anomaly Detection',    section:'AI Components' },
  { key:'ai-ngo-risk',    label:'NGO Risk Assessment',         section:'AI Components' },
  { key:'ai-recommend',   label:'CSR Recommendation Engine',   section:'AI Components' },
  { key:'ai-fraud',       label:'Beneficiary Fraud Detection', section:'AI Components' },
  { key:'ai-predict',     label:'Predictive Budget Utilization',section:'AI Components' },
  { key:'ai-forecast',    label:'Impact Forecasting',          section:'AI Components' },
  { key:'ai-sentiment',   label:'Sentiment Analysis',          section:'AI Components' },
  { key:'ai-summary',     label:'AI Executive Summaries',      section:'AI Components' },
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
function Btn({ children, onClick, style, outline, danger, sm, teal, green, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{
    padding: sm ? '5px 12px' : '8px 18px', borderRadius:8,
    border: outline ? `1.5px solid ${C.blue}` : 'none',
    background: danger ? C.red : teal ? C.teal : green ? C.green : outline ? '#fff' : C.blue,
    color: outline ? C.blue : '#fff',
    fontSize: sm ? 12 : 13, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, ...style,
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
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState('');
  function showToast(msg) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 3500);
  }

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

  async function saveInfo() {
    if (!profileInfo.org_name.trim()) { showToast('Organisation name is required.'); return; }
    setInfoSaving(true);
    try {
      await api.updateMe({ org_name: profileInfo.org_name, cin: profileInfo.cin, pan: profileInfo.pan, gstin: profileInfo.gstin, tan: profileInfo.tan, website: profileInfo.website, bio: profileInfo.bio, avg_net_profit: profileInfo.avg_net_profit || 0, csr_obligation: profileInfo.csr_obligation || 0, csr_total_spend: profileInfo.csr_total_spend || 0 });
      showToast('✅ Organisation info saved.');
    } catch { showToast('Save failed. Please try again.'); } finally { setInfoSaving(false); }
  }
  async function saveContact() {
    if (!profileContact.email.trim()) { showToast('Email address is required.'); return; }
    const eErr = fieldValidate('email', profileContact.email.trim());
    if (eErr) { showToast('Email: ' + eErr); return; }
    if (profileContact.phone) {
      const mErr = fieldValidate('mobile', profileContact.phone.replace(/^\+91/, ''));
      if (mErr) { showToast('Mobile: ' + mErr); return; }
    }
    setContactSaving(true);
    try {
      await api.updateMe({
        address_line1: profileContact.address_line1, city: profileContact.city,
        state_name: profileContact.state_name, pincode: profileContact.pincode,
        phone: profileContact.phone ? '+91' + profileContact.phone.replace(/^\+91/, '') : null,
        email: profileContact.email,
        spoc_name: profileContact.spoc_name,
        designation: profileContact.designation,
      });
      showToast('✅ Contact info saved.');
    } catch { showToast('Save failed. Please try again.'); } finally { setContactSaving(false); }
  }
  async function saveBank() {
    if (!profileBank.bank_account_name.trim()) { showToast('Account holder name is required.'); return; }
    if (!profileBank.bank_account_number.trim()) { showToast('Account number is required.'); return; }
    if (!profileBank.bank_ifsc.trim()) { showToast('IFSC code is required.'); return; }
    const ifscErr = fieldValidate('ifsc', profileBank.bank_ifsc.trim());
    if (ifscErr) { showToast('IFSC: ' + ifscErr); return; }
    setBankSaving(true);
    try {
      await api.updateMe({ bank_account_name: profileBank.bank_account_name, bank_account_number: profileBank.bank_account_number, bank_ifsc: profileBank.bank_ifsc.trim().toUpperCase(), account_type: profileBank.account_type });
      showToast('✅ Bank details saved.');
    } catch { showToast('Save failed. Please try again.'); } finally { setBankSaving(false); }
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
  const [vendorList, setVendorList] = useState([]);
  const [loaded, setLoaded] = useState({});

  // CSR Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campForm, setCampForm] = useState({ title:'', theme:'Skill Development', description:'', total_budget:'', financial_year:'2025-26', target_states:'', open_date:'', close_date:'', eligibility_criteria:'', status:'draft' });
  const [campSaving, setCampSaving] = useState(false);
  const [campMsg, setCampMsg] = useState('');
  const [applications, setApplications] = useState([]);
  const [appForm, setAppForm] = useState({ campaign_id:'', org_name:'', reg_no:'', contact_person:'', email:'', phone:'', proposed_budget:'', project_title:'', proposal_summary:'', target_beneficiaries:'', target_states:'' });
  const [appSaving, setAppSaving] = useState(false);
  const [appMsg, setAppMsg] = useState('');
  const [progressReports, setProgressReports] = useState([]);
  const [progForm, setProgForm] = useState({ project_id:'', report_month:'', bene_count:'', spend_amount:'', train_pct:'', issues:'', highlights:'' });
  const [progSaving, setProgSaving] = useState(false);
  const [progMsg, setProgMsg] = useState('');
  const [fieldAudits, setFieldAudits] = useState([]);
  const [auditForm, setAuditForm] = useState({ project_id:'', auditor_name:'', visit_date:'', location:'', bene_verified:'', funds_verified:'', compliance_score:'', findings:'', recommendations:'', status:'scheduled' });
  const [auditFmSaving, setAuditFmSaving] = useState(false);
  const [auditFmMsg, setAuditFmMsg] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ category:'Technical Issue', priority:'Medium', subject:'', description:'' });
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketMsg, setTicketMsg] = useState('');
  const [grievances, setGrievances] = useState([]);
  const [grievanceForm, setGrievanceForm] = useState({ type:'Project Approval Delay', against:'', description:'' });
  const [grievanceSaving, setGrievanceSaving] = useState(false);
  const [grievanceMsg, setGrievanceMsg] = useState('');

  // CSR-2 form state (kept here to avoid hook-order issues when panel renders as plain function)
  const CSR2_FY = '2025-26';
  const [csr2Record, setCsr2Record] = useState(null);
  const [csr2Form, setCsr2Form] = useState({
    cin: '', company_name: '', registered_office: '',
    avg_net_profit: '', csr_obligation: '', amount_spent_own: '',
    amount_spent_implementing_agency: '', amount_transferred_unspent: '',
    transfer_account_name: '', transfer_date: '',
    board_approval_date: '', csr_committee_composition: '',
    activities_undertaken: '', ongoing_projects: '',
    total_amount_spent: '', unspent_amount: '',
    reason_shortfall: '', impact_assessment: '',
    ceo_name: '', ceo_designation: '', cfo_name: '', cfo_designation: '',
  });
  const [csr2Msg, setCsr2Msg] = useState('');
  const [csr2Saving, setCsr2Saving] = useState(false);
  const [csr2Loading, setCsr2Loading] = useState(false);

  // AI Chatbot state
  const [chatOpen,    setChatOpen]   = useState(false);
  const [chatMsgs,    setChatMsgs]   = useState([{ role:'assistant', text:'Hi! 👋 I\'m your SkillsnJobs AI assistant. Ask me about CSR compliance, project management, campaigns, or anything else.' }]);
  const [chatInput,   setChatInput]  = useState('');
  const [chatLoading, setChatLoading]= useState(false);

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
  const loadVendors = useCallback(() => {
    if (loaded.vendors) return;
    api.csrVendorList().then(d => { setVendorList(d); setLoaded(l => ({ ...l, vendors: true })); }).catch(() => {});
  }, [loaded.vendors]);
  const loadUnspentFunds = useCallback(() => {
    if (loaded.unspent) return;
    api.csrUnspentFunds().then(d => { setUnspentFunds(d); setLoaded(l => ({ ...l, unspent: true })); }).catch(() => {});
  }, [loaded.unspent]);
  const loadNotifications = useCallback(() => {
    if (loaded.notifs) return;
    api.csrNotifications().then(d => { setNotifications(d); setLoaded(l => ({ ...l, notifs: true })); }).catch(() => {});
  }, [loaded.notifs]);
  const loadAuditLogs = useCallback(() => {
    if (loaded.audit) return;
    api.csrAuditTrail().then(d => { setAuditLogs(Array.isArray(d) ? d : []); setLoaded(l => ({ ...l, audit: true })); }).catch(() => {});
  }, [loaded.audit]);
  const loadTickets = useCallback(() => {
    if (loaded.tickets) return;
    api.csrTickets().then(d => { setTickets(d); setLoaded(l => ({ ...l, tickets: true })); }).catch(() => {});
  }, [loaded.tickets]);
  const loadGrievances = useCallback(() => {
    if (loaded.grievances) return;
    api.csrGrievances().then(d => { setGrievances(d); setLoaded(l => ({ ...l, grievances: true })); }).catch(() => {});
  }, [loaded.grievances]);
  const loadCampaigns = useCallback(() => {
    api.csrCampaigns().then(d => { setCampaigns(Array.isArray(d) ? d : []); setLoaded(l => ({ ...l, campaigns: true })); }).catch(() => {});
  }, []);
  const loadApplications = useCallback(() => {
    api.csrApplications().then(d => { setApplications(Array.isArray(d) ? d : []); setLoaded(l => ({ ...l, applications: true })); }).catch(() => {});
  }, []);
  const loadProgressReports = useCallback(() => {
    api.csrProgressReports().then(d => { setProgressReports(Array.isArray(d) ? d : []); setLoaded(l => ({ ...l, progressReports: true })); }).catch(() => {});
  }, []);
  const loadFieldAudits = useCallback(() => {
    api.csrFieldAudits().then(d => { setFieldAudits(Array.isArray(d) ? d : []); setLoaded(l => ({ ...l, fieldAudits: true })); }).catch(() => {});
  }, []);

  useEffect(() => { loadStats(); loadProjects(); loadDisbursements(); loadBeneficiaries(); loadTPs(); }, []);
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
    if (['dashboard','proj-active','proj-draft','proj-completed','proj-approval','fund-allocation','comp-schedule7','rep-sector','rep-geo','rep-annual','scheme-pmkvy','scheme-ddugky','scheme-star','scheme-naps'].includes(key)) loadProjects();
    if (['bene-list','bene-track','bene-placement','rep-impact'].includes(key)) loadBeneficiaries();
    if (['fund-disbursements','fund-utilization'].includes(key)) loadDisbursements();
    if (key === 'fund-unspent') { loadDisbursements(); loadUnspentFunds(); }
    if (key === 'rep-financial') { loadUnspentFunds(); }
    if (['tp-list','tp-performance','tp-mou'].includes(key)) { loadTPs(); loadVendors(); }
    if (key === 'notifications') loadNotifications();
    if (key === 'comp-audit') loadAuditLogs();
    if (key === 'helpdesk') loadTickets();
    if (key === 'grievance') loadGrievances();
    if (key === 'comp-csr2' && !csr2Loading && !csr2Record) {
      setCsr2Loading(true);
      api.csrGetForm('csr2', CSR2_FY).then(d => {
        if (d && d.data) {
          const saved = typeof d.data === 'string' ? JSON.parse(d.data) : d.data;
          setCsr2Form(f => ({ ...f, ...saved }));
          setCsr2Record(d);
        }
        setCsr2Loading(false);
      }).catch(() => setCsr2Loading(false));
    }
    if (key.startsWith('ai-')) {
      setOpenMenus(m => ({ ...m, ai: true }));
      loadProjects(); loadBeneficiaries(); loadDisbursements(); loadTPs();
    }
    if (key.startsWith('camp-')) {
      setOpenMenus(m => ({ ...m, camp: true }));
      loadCampaigns(); loadApplications(); loadProgressReports(); loadProjects();
    }
    if (key.startsWith('audit-')) {
      setOpenMenus(m => ({ ...m, fieldaudit: true }));
      loadFieldAudits(); loadProjects();
    }
  }
  function handleLogout() { logout(); navigate('/'); }

  const crore = n => n >= 10000000 ? `₹${(n/10000000).toFixed(1)} Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)} L` : `₹${(n||0).toLocaleString('en-IN')}`;
  const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;

  function downloadCSV(filename, headers, rows) {
    const escape = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  }

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
    function SubItem({ label, k, noBullet }) {
      if (!allowed(k)) return null;
      return <div onClick={()=>go(k)} style={{ padding:'3px 16px 3px 45px', cursor:'pointer', fontSize:12.5, color: panel===k ? C.blue : 'rgba(255,255,255,.52)', fontWeight: panel===k ? 600 : 400, transition:'.15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#fff'; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color = panel===k ? C.blue : 'rgba(255,255,255,.52)'; }}>
        {noBullet ? '' : '· '}{label}
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
        <NavItem icon="🔔" label="Notifications" badge={notifications.length > 0 ? notifications.length : undefined} active={panel==='notifications'} onClick={()=>go('notifications')} />

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

        {lbl('CSR Campaigns')}
        <NavItem icon="🚀" label="CSR Campaigns" id="camp" onClick={()=>toggleMenu('camp')} active={panel.startsWith('camp-')} />
        <Sub id="camp">
          <SubItem label="Create Campaign"    k="camp-create" noBullet />
          <SubItem label="My Campaigns"       k="camp-list" noBullet />
          <SubItem label="Received Proposals" k="camp-applications" noBullet />
          <SubItem label="Approval Workflow"  k="camp-approval" noBullet />
          <SubItem label="Progress Reports"   k="camp-progress" noBullet />
        </Sub>

        {lbl('Audit & Verification')}
        <NavItem icon="🔍" label="Audit & Verification" id="fieldaudit" onClick={()=>toggleMenu('fieldaudit')} active={panel.startsWith('audit-')} />
        <Sub id="fieldaudit">
          <SubItem label="Field Audits"    k="audit-list" noBullet />
          <SubItem label="Schedule Audit"  k="audit-new" noBullet />
        </Sub>

        {lbl('AI Components')}
        <NavItem icon="🤖" label="AI Components" id="ai" onClick={()=>toggleMenu('ai')} active={panel.startsWith('ai-')} />
        <Sub id="ai">
          <SubItem label="Proposal Scoring"      k="ai-proposal" noBullet />
          <SubItem label="Duplicate Detection"   k="ai-duplicate" noBullet />
          <SubItem label="Budget Anomaly"        k="ai-budget" noBullet />
          <SubItem label="NGO Risk"              k="ai-ngo-risk" noBullet />
          <SubItem label="CSR Recommender"       k="ai-recommend" noBullet />
          <SubItem label="Fraud Detection"       k="ai-fraud" noBullet />
          <SubItem label="Budget Forecast"       k="ai-predict" noBullet />
          <SubItem label="Impact Forecast"       k="ai-forecast" noBullet />
          <SubItem label="Sentiment Analysis"    k="ai-sentiment" noBullet />
          <SubItem label="Executive Summary"     k="ai-summary" noBullet />
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
    const placementRate = pct(stats.placedBeneficiaries, stats.totalBeneficiaries);
    const certRate = pct(stats.certifiedBeneficiaries, stats.totalBeneficiaries);

    // ── SVG chart helpers ──────────────────────────────────────────
    function DonutChart({ slices, size = 90, hole = 0.62 }) {
      const r = size / 2, cx = r, cy = r, ir = r * hole;
      let angle = -Math.PI / 2;
      const paths = slices.map(({ value, color }, i) => {
        if (!value) return null;
        const sweep = (value / slices.reduce((s, x) => s + (x.value || 0), 0)) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        angle += sweep;
        const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
        const ix1 = cx + ir * Math.cos(angle - sweep), iy1 = cy + ir * Math.sin(angle - sweep);
        const ix2 = cx + ir * Math.cos(angle), iy2 = cy + ir * Math.sin(angle);
        const large = sweep > Math.PI ? 1 : 0;
        return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${large},0 ${ix1},${iy1} Z`} fill={color} />;
      });
      return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
    }

    function BarChart({ bars, height = 70 }) {
      const max = Math.max(...bars.map(b => b.value), 1);
      const w = 100 / bars.length;
      return (
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width:'100%', height }}>
          {bars.map((b, i) => {
            const bh = (b.value / max) * (height - 16);
            return <g key={i}>
              <rect x={i * w + 1} y={height - 14 - bh} width={w - 2} height={bh} fill={b.color || C.blue} rx="2" />
              <text x={i * w + w / 2} y={height - 2} textAnchor="middle" fontSize="6" fill="#64748b">{b.label}</text>
            </g>;
          })}
        </svg>
      );
    }

    function LineChart({ points, height = 70, color = C.blue }) {
      if (!points.length) return null;
      const maxV = Math.max(...points.map(p => p.value), 1);
      const minV = Math.min(...points.map(p => p.value), 0);
      const range = maxV - minV || 1;
      const pts = points.map((p, i) => {
        const x = (i / (points.length - 1 || 1)) * 96 + 2;
        const y = height - 14 - ((p.value - minV) / range) * (height - 20);
        return `${x},${y}`;
      });
      const area = `M${pts[0]} L${pts.join(' L')} L${pts[pts.length-1].split(',')[0]},${height-14} L2,${height-14} Z`;
      return (
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width:'100%', height }}>
          <defs><linearGradient id={`lg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.18"/><stop offset="100%" stopColor={color} stopOpacity="0.01"/></linearGradient></defs>
          <path d={area} fill={`url(#lg${color.replace('#','')})`} />
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => {
            const x = (i / (points.length - 1 || 1)) * 96 + 2;
            const y = height - 14 - ((p.value - minV) / range) * (height - 20);
            return <g key={i}>
              <circle cx={x} cy={y} r="2.5" fill={color} />
              <text x={x} y={height - 2} textAnchor="middle" fontSize="5.5" fill="#64748b">{p.label}</text>
            </g>;
          })}
        </svg>
      );
    }

    // ── Derive chart data from loaded state ────────────────────────
    // Sector allocation from project activity field
    const sectorColors = ['#1E5FBF','#0B7B8C','#1A7C3E','#C8860A','#6B3FA0','#C05621','#C0392B'];
    const sectorMap = projects.reduce((acc, p) => {
      const s = p.activity || p.sub_sector || 'Other';
      acc[s] = (acc[s] || 0) + 1; return acc;
    }, {});
    const sectorSlices = Object.entries(sectorMap).slice(0, 7).map(([label, value], i) => ({ label, value, color: sectorColors[i % sectorColors.length] }));

    // State-wise projects bar chart
    const stateMap = projects.reduce((acc, p) => { const s = (p.state_name || 'Unknown').slice(0, 5); acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    const stateBars = Object.entries(stateMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value], i) => ({ label, value, color: sectorColors[i % sectorColors.length] }));

    // Monthly disbursements line chart (last 6 months)
    const now = new Date(); const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short' });
      months.push({ key, label, value: 0 });
    }
    disbursements.filter(d => d.status === 'disbursed').forEach(d => {
      const date = d.disbursed_date || d.created_at || '';
      const key = date.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) m.value += Number(d.amount) || 0;
    });
    const disbMonthly = months.map(m => ({ label: m.label, value: m.value / 100000 })); // in lakhs

    // Project status counts for pie-style bars
    const statusCounts = { active: 0, completed: 0, draft: 0, pending: 0 };
    projects.forEach(p => { if (statusCounts[p.status] !== undefined) statusCounts[p.status]++; });

    return <>
      <Alert icon="⚡" type="warn"><strong>Action needed:</strong> FY 2025-26 CSR-2 form submission due by 30 Sep 2026. <strong style={{ cursor:'pointer', color:C.blue }} onClick={()=>go('comp-csr2')}>File Now →</strong></Alert>
      <SectionHead title={`Welcome, ${user?.org_name || user?.name || 'CSR Organisation'}! 🏛️`} />

      {/* ── Row 1: 6 KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:10 }}>
        <KpiCard val={crore(stats.totalBudget)} label="CSR Budget" sub="Total obligation" color={C.blue} />
        <KpiCard val={stats.totalProjects || 0} label="Projects" sub={`${stats.activeProjects||0} active`} color={C.teal} />
        <KpiCard val={stats.totalPartners || 0} label="Training Partners" sub={`${stats.activePartners||0} active MoUs`} color={C.green} />
        <KpiCard val={(stats.totalBeneficiaries || 0).toLocaleString('en-IN')} label="Beneficiaries" sub={`${stats.certifiedBeneficiaries||0} certified`} color={C.gold} />
        <KpiCard val={`${certRate}%`} label="Certified Rate" sub="Training completed" color={C.purple} />
        <KpiCard val={`${placementRate}%`} label="Placement Rate" sub="Of certified learners" color={C.orange} />
      </div>

      {/* ── Row 2: Quick actions ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:10 }}>
        {[['📋','Propose Project','proj-new'],['👥','Add Beneficiary','bene-register'],['💰','Disburse Funds','fund-disbursements'],['📜','File CSR-2','comp-csr2'],['🚀','New Campaign','camp-create'],['🔍','Field Audit','audit-new']].map(([icon,lbl,k])=>(
          <div key={k} onClick={()=>go(k)} style={{ background:'#fff', border:'1.5px solid #e8ecf3', borderRadius:10, padding:'10px 8px', textAlign:'center', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.background=C.pBlue; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#e8ecf3'; e.currentTarget.style.background='#fff'; }}>
            <div style={{ fontSize:18 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:600, color:C.navy }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Row 3: Spend vs Budget | Project Status table ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📊 CSR Spend vs Budget</CardTitle>
          <StatRow n={crore(stats.totalSpent)} label="Actual Spend" pct={utilPct} color={C.green} />
          <StatRow n={crore(stats.totalBudget)} label="Total Budget Allocated" pct={100} color={C.blue} />
          <StatRow n={crore(Math.max(0,(stats.totalBudget||0)-(stats.totalSpent||0)))} label="Unspent Balance" pct={100-utilPct} color={C.red} />
          <hr style={{ border:'none', borderTop:'1px solid #e8ecf3', margin:'12px 0 8px' }} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:4 }}>
            {[['active',C.green],['completed',C.blue],['draft',C.gold],['pending',C.purple]].map(([s,col])=>(
              <div key={s} style={{ background:'#f8fafc', borderRadius:8, padding:'7px 6px', textAlign:'center', borderTop:`3px solid ${col}` }}>
                <div style={{ fontWeight:700, color:col, fontSize:17 }}>{statusCounts[s]||0}</div>
                <div style={{ fontSize:10.5, color:'#64748b', textTransform:'capitalize' }}>{s}</div>
              </div>
            ))}
          </div>
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

      {/* ── Row 4: Sector Allocation | State-wise Projects | Monthly Disbursements ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🎯 Sector Allocation</CardTitle>
          {sectorSlices.length === 0
            ? <div style={{ color:'#888', fontSize:12, padding:8 }}>No project data yet.</div>
            : <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ flexShrink:0 }}><DonutChart slices={sectorSlices} size={88} /></div>
                <div style={{ flex:1, minWidth:0 }}>
                  {sectorSlices.map((s, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                      <div style={{ fontSize:11, color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{s.label}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#64748b', flexShrink:0 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>}
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🗺️ State-wise Projects</CardTitle>
          {stateBars.length === 0
            ? <div style={{ color:'#888', fontSize:12, padding:8 }}>No location data yet.</div>
            : <BarChart bars={stateBars} height={88} />}
        </Card>
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📈 Monthly Disbursements (₹L)</CardTitle>
          {disbursements.length === 0
            ? <div style={{ color:'#888', fontSize:12, padding:8 }}>No disbursement data yet.</div>
            : <LineChart points={disbMonthly} height={88} color={C.teal} />}
        </Card>
      </div>

      {/* ── Row 5: SDG Progress | Impact Score | Programme Performance ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
        {/* SDG Progress */}
        <Card style={{ marginBottom:0 }}>
          <CardTitle>🌍 SDG Alignment</CardTitle>
          {(() => {
            const SDG_MAP = {
              'Skill Development':'SDG 4', 'Vocational Training':'SDG 4', 'Education':'SDG 4',
              'Livelihood':'SDG 8', 'Employment':'SDG 8', 'Retail':'SDG 8',
              'Health':'SDG 3', 'Women Empowerment':'SDG 5', 'Women':'SDG 5',
              'Environment':'SDG 13', 'Clean Energy':'SDG 7', 'Agriculture':'SDG 2',
              'Plumbing':'SDG 9', 'Construction':'SDG 9', 'Infrastructure':'SDG 9',
            };
            const SDG_LABELS = { 'SDG 2':'Zero Hunger','SDG 3':'Good Health','SDG 4':'Quality Edu','SDG 5':'Gender Eq','SDG 7':'Clean Energy','SDG 8':'Decent Work','SDG 9':'Industry','SDG 13':'Climate' };
            const SDG_COLORS = { 'SDG 4':'#1E5FBF','SDG 8':'#C8860A','SDG 3':'#1A7C3E','SDG 5':'#6B3FA0','SDG 13':'#0B7B8C','SDG 9':'#C05621','SDG 2':'#C0392B','SDG 7':'#F59E0B' };
            const counts = {};
            projects.forEach(p => {
              const act = p.activity || p.sub_sector || '';
              const sdg = Object.entries(SDG_MAP).find(([k]) => act.toLowerCase().includes(k.toLowerCase()));
              const key = sdg ? sdg[1] : 'SDG 4';
              counts[key] = (counts[key] || 0) + (Number(p.beneficiaries_actual) || Number(p.beneficiaries_target) || 1);
            });
            const maxV = Math.max(...Object.values(counts), 1);
            const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
            if (!entries.length) return <div style={{ color:'#888', fontSize:12, padding:8 }}>Add projects to see SDG alignment.</div>;
            return <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {entries.slice(0,6).map(([sdg, val]) => (
                <div key={sdg}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                    <span style={{ fontWeight:600, color: SDG_COLORS[sdg]||C.blue }}>{sdg}</span>
                    <span style={{ color:'#64748b' }}>{SDG_LABELS[sdg]||sdg} · {val}</span>
                  </div>
                  <div style={{ height:6, background:'#E8EDF4', borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${Math.round(val/maxV*100)}%`, background: SDG_COLORS[sdg]||C.blue, borderRadius:4, transition:'width .4s' }} />
                  </div>
                </div>
              ))}
            </div>;
          })()}
        </Card>

        {/* Impact Score Gauge */}
        <Card style={{ marginBottom:0 }}>
          <CardTitle>⭐ Impact Score</CardTitle>
          {(() => {
            const score = Math.round(
              Math.min(100, (placementRate * 0.4) + (certRate * 0.35) + (utilPct * 0.25))
            );
            const grade = score >= 80 ? ['A+', C.green] : score >= 60 ? ['A', C.teal] : score >= 40 ? ['B', C.gold] : ['C', C.red];
            const R = 40, cx = 60, cy = 58;
            const pct01 = score / 100;
            const startAngle = -Math.PI * 0.75;
            const endAngle = startAngle + pct01 * Math.PI * 1.5;
            const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
            const x2 = cx + R * Math.cos(endAngle), y2 = cy + R * Math.sin(endAngle);
            const large = pct01 > 0.5 ? 1 : 0;
            return <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <svg viewBox="0 0 120 80" style={{ width:'100%', maxWidth:180 }}>
                <path d={`M${cx+R*Math.cos(-Math.PI*0.75)},${cy+R*Math.sin(-Math.PI*0.75)} A${R},${R} 0 1,1 ${cx+R*Math.cos(-Math.PI*0.25)},${cy+R*Math.sin(-Math.PI*0.25)}`} fill="none" stroke="#E8EDF4" strokeWidth="8" strokeLinecap="round" />
                {score > 0 && <path d={`M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2}`} fill="none" stroke={grade[0]==='A+'?C.green:grade[0]==='A'?C.teal:grade[0]==='B'?C.gold:C.red} strokeWidth="8" strokeLinecap="round" />}
                <text x={cx} y={cy-6} textAnchor="middle" fontSize="18" fontWeight="700" fill={grade[1]}>{score}</text>
                <text x={cx} y={cy+8} textAnchor="middle" fontSize="7" fill="#64748b">out of 100</text>
                <text x={cx} y={cy+20} textAnchor="middle" fontSize="9" fontWeight="700" fill={grade[1]}>{grade[0]}</text>
              </svg>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, width:'100%', marginTop:4 }}>
                {[['Placement',`${placementRate}%`,C.green],['Certified',`${certRate}%`,C.teal],['Utilization',`${utilPct}%`,C.gold]].map(([l,v,c])=>(
                  <div key={l} style={{ textAlign:'center', padding:'5px 4px', background:'#F8FAFC', borderRadius:8, borderTop:`2px solid ${c}` }}>
                    <div style={{ fontWeight:700, color:c, fontSize:13 }}>{v}</div>
                    <div style={{ fontSize:9.5, color:'#64748b' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>;
          })()}
        </Card>

        {/* Programme Performance Radar */}
        <Card style={{ marginBottom:0 }}>
          <CardTitle>📡 Programme Performance</CardTitle>
          {(() => {
            const total = stats.totalBeneficiaries || 0;
            const dims = [
              { label:'Reach', val: Math.min(100, (new Set(projects.map(p=>p.state_name).filter(Boolean)).size / 5) * 100) },
              { label:'Scale', val: Math.min(100, (total / 100) * 100) },
              { label:'Conversion', val: certRate },
              { label:'Placement', val: placementRate },
              { label:'Utilization', val: utilPct },
              { label:'Partners', val: Math.min(100, (stats.totalPartners||0) * 25) },
            ];
            const n = dims.length, cx = 70, cy = 68, r = 52;
            const pts = dims.map((d, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
              const v = (d.val || 0) / 100;
              return { x: cx + r * v * Math.cos(angle), y: cy + r * v * Math.sin(angle), lx: cx + (r + 14) * Math.cos(angle), ly: cy + (r + 14) * Math.sin(angle), label: d.label };
            });
            const spokes = dims.map((_, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
              return { x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle) };
            });
            const rings = [0.25, 0.5, 0.75, 1].map(scale => {
              const rpts = dims.map((_, i) => {
                const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
                return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
              });
              return rpts.join(' ');
            });
            return <svg viewBox="0 0 140 140" style={{ width:'100%' }}>
              {rings.map((rpts, i) => <polygon key={i} points={rpts} fill="none" stroke="#E8EDF4" strokeWidth={i===3?1.5:0.8} />)}
              {spokes.map((s, i) => <line key={i} x1={cx} y1={cy} x2={s.x2} y2={s.y2} stroke="#E8EDF4" strokeWidth="0.8" />)}
              <polygon points={pts.map(p=>`${p.x},${p.y}`).join(' ')} fill={`${C.blue}30`} stroke={C.blue} strokeWidth="1.5" />
              {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.blue} />)}
              {pts.map((p, i) => <text key={i} x={p.lx} y={p.ly+3} textAnchor="middle" fontSize="7" fontWeight="600" fill="#334155">{p.label}</text>)}
            </svg>;
          })()}
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:0 }}>
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
          <CardTitle>👥 Beneficiary Pipeline</CardTitle>
          <StatRow n={stats.totalBeneficiaries||0} label="Total Enrolled" pct={100} color={C.blue} />
          <StatRow n={beneficiaries.filter(b=>b.training_status==='enrolled').length} label="In Training" pct={pct(beneficiaries.filter(b=>b.training_status==='enrolled').length, stats.totalBeneficiaries)} color={C.gold} />
          <StatRow n={stats.certifiedBeneficiaries||0} label="Training Completed" pct={certRate} color={C.teal} />
          <StatRow n={stats.placedBeneficiaries||0} label="Placed in Jobs" pct={placementRate} color={C.green} />
          <hr style={{ border:'none', borderTop:'1px solid #e8ecf3', margin:'10px 0 6px' }} />
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {[['Male', beneficiaries.filter(b=>b.gender==='M').length, C.blue],['Female', beneficiaries.filter(b=>b.gender==='F').length, C.purple],['Other', beneficiaries.filter(b=>b.gender&&b.gender!=='M'&&b.gender!=='F').length, C.teal]].map(([lbl,cnt,col])=>(
              <div key={lbl} style={{ flex:1, background:'#f8fafc', borderRadius:8, padding:'6px 8px', textAlign:'center', borderTop:`2px solid ${col}` }}>
                <div style={{ fontWeight:700, color:col, fontSize:15 }}>{cnt}</div>
                <div style={{ fontSize:10, color:'#64748b' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>;
  }

  function PanelNotifications() {
    const dotColor = t => ({ project:C.blue, disbursement:C.green, alert:C.gold, warn:C.red }[t] || C.blue);
    const icon = t => ({ project:'📋', disbursement:'💰', alert:'⚠️', warn:'🔴' }[t] || '🔔');
    return <>
      <Bc parts={['Notifications']} />
      <SectionHead title="Notifications 🔔" />
      <Card>
        <Alert icon="ℹ️" type="info">CSR-2 for FY 2025-26 is due by <strong>30 Sep 2026</strong>. File on the MCA21 portal.</Alert>
        {!loaded.notifs ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : notifications.length === 0 ? <div style={{ color:'#888', padding:12 }}>No recent activity. Start by proposing a project or adding beneficiaries.</div>
         : notifications.map((n,i) => (
             <TlItem key={i} dot={dotColor(n.type)}
               title={`${icon(n.type)} ${n.title}`}
               meta={n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : 'System'} />
           ))}
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
          ['CSR Policy FY 2025-26','v3.1','Mar 15, 2025',<Badge color="green">Current</Badge>,<Btn sm outline onClick={()=>showToast('No file uploaded yet. Use Upload Document to attach the file.')}>Download</Btn>],
          ['CSR Implementation Plan','v2.0','Apr 01, 2025',<Badge color="green">Current</Badge>,<Btn sm outline onClick={()=>showToast('No file uploaded yet. Use Upload Document to attach the file.')}>Download</Btn>],
          ['Board Resolution — CSR','FY26','Apr 01, 2025',<Badge color="teal">Verified</Badge>,<Btn sm outline onClick={()=>showToast('No file uploaded yet. Use Upload Document to attach the file.')}>Download</Btn>],
          ['Annual Action Plan','FY26','Apr 05, 2025',<Badge color="gold">Under Review</Badge>,<Btn sm outline onClick={()=>showToast('No file uploaded yet. Use Upload Document to attach the file.')}>Download</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn onClick={()=>showToast('File uploads require document storage to be configured. Contact your administrator.')}>📤 Upload Document</Btn></div>
      </Card>
      <Card>
        <CardTitle>🏆 Certifications</CardTitle>
        {['MCA CSR-1 Registered','DPIIT Recognised','NSDC Partner','ISO 9001:2015','FCRA Registered'].map(s=>(
          <span key={s} style={{ display:'inline-block', padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:'#e8ecf3', color:'#374151', margin:2 }}>{s}</span>
        ))}
        <div style={{ marginTop:14 }}><Btn onClick={()=>showToast('Certifications are managed via your Organisation Profile. Contact support to update them.')}>+ Add Certification</Btn></div>
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
         : active.map(p => (
             <div key={p.id} style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:'12px 14px', marginBottom:10 }}>
               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                 <div>
                   <div style={{ fontWeight:700, fontSize:13.5, color:C.navy }}>{p.title}</div>
                   <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{p.state_name||'—'} · Budget: {crore(p.budget)} · Spent: {crore(p.spent)} ({pct(p.spent,p.budget)}%) · Beneficiaries: {(p.beneficiaries_actual||0).toLocaleString('en-IN')}</div>
                 </div>
                 <Badge color="green">{p.status}</Badge>
               </div>
               <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                 <Btn sm outline onClick={()=>{ setDisbForm(f=>({...f, project_id: p.title})); go('fund-disbursements'); }}>💰 Disburse Funds</Btn>
                 <Btn sm outline onClick={()=>go('bene-register')}>👥 Add Beneficiary</Btn>
                 <Btn sm outline onClick={()=>go('audit-new')}>🔍 Schedule Field Audit</Btn>
                 <Btn sm outline onClick={()=>go('camp-progress')}>📋 Submit Progress Report</Btn>
                 <Btn sm outline onClick={()=>go('bene-track')}>📈 Track Beneficiaries</Btn>
               </div>
             </div>
           ))}
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
             <><Btn sm outline onClick={() => { setProjForm({ title: p.title || '', schedule7: p.activity || 'Skill Development', sub_sector: p.sub_sector || 'Vocational Training', target_beneficiaries: p.beneficiaries_target || '', target_states: p.target_states || '', start_date: p.start_date || '', end_date: p.end_date || '', objectives: p.objectives || '', budget: p.budget || '', own_contribution: p.own_contribution || '', other_sources: p.other_sources || '', implementing_agency: p.implementing_agency || '', agency_type: p.agency_type || 'NGO', mou_signed: p.mou_signed || 'No — in progress' }); go('proj-new'); }}>Edit</Btn>{' '}<Btn sm green onClick={() => api.csrUpdateProject(p.id, { status: 'pending' }).then(() => { setLoaded(l => ({ ...l, projects: false })); loadProjects(); go('proj-approval'); }).catch(() => {})}>Submit</Btn></>
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
         : <Table head={['Project','State','Beneficiaries','Fund Used','Certificate','Actions']} rows={completed.map(p => [
             p.title, p.state_name || '—',
             (p.beneficiaries_actual||0).toLocaleString('en-IN'),
             crore(p.spent),
             <Btn sm outline onClick={()=>showToast('No certificate file uploaded for this project yet.')}>Download</Btn>,
             <div style={{ display:'flex', gap:6 }}>
               <Btn sm outline onClick={()=>go('rep-impact')}>📊 Impact Report</Btn>
               <Btn sm outline onClick={()=>go('comp-csr2')}>📜 File CSR-2</Btn>
             </div>
           ])} />}
      </Card>
    </>;
  }

  function PanelProjApproval() {
    const pending = projects.filter(p => p.status === 'pending');
    return <>
      <Bc parts={['Projects','Approval Status']} />
      <SectionHead title="Approval Status 🔄" />
      <Card>
        <CardTitle>📌 Pending Approvals</CardTitle>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : pending.length === 0 ? <div style={{ color:'#888', padding:12 }}>No projects currently awaiting approval.</div>
         : <Table head={['Project','State','Budget','Submitted','Stage']} rows={pending.map(p => [
             p.title, p.state_name||'—', crore(p.budget),
             p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—',
             <Badge color="gold">Pending Review</Badge>
           ])} />}
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
             <Table head={['Name','Gender','State','Project','Training Status','Batch','Actions']} rows={beneficiaries.map(b => [
               b.name, b.gender || '—', b.state_name || '—',
               b.project_title || '—',
               <Badge color={b.training_status==='completed'?'green':b.training_status==='in_progress'?'blue':b.training_status==='dropout'?'red':'teal'}>{b.training_status}</Badge>,
               b.batch_code || '—',
               <div style={{ display:'flex', gap:6 }}>
                 <Btn sm outline onClick={()=>go('bene-track')}>📈 Track</Btn>
                 {b.training_status==='completed' && <Btn sm outline onClick={()=>go('bene-placement')}>🎯 Placement</Btn>}
               </div>
             ])} />
             <div style={{ marginTop:12, display:'flex', gap:10, alignItems:'center' }}>
               <span style={{ fontSize:12, color:'#64748b' }}>Total: {beneficiaries.length} beneficiaries</span>
               <Btn sm outline onClick={()=>go('bene-track')}>📈 View Progress Funnel</Btn>
               <Btn sm outline onClick={()=>go('bene-placement')}>🎯 Placement Outcomes</Btn>
             </div>
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
          <div style={{ marginTop:14, display:'flex', gap:10 }}>
            <Btn sm outline onClick={()=>go('bene-list')}>← Back to List</Btn>
            <Btn sm green onClick={()=>go('bene-placement')}>🎯 View Placement Outcomes →</Btn>
          </div>
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
    const isLoading = !loaded.vendors && !loaded.tps;
    const allPartners = [
      ...vendorList.map(v => ({ ...v, _source: 'system' })),
      ...trainingPartners.map(tp => ({ ...tp, _source: 'csr', type: tp.type || 'Training Partner' })),
    ];
    return <>
      <Bc parts={['Training Partners','Empanelled Partners']} />
      <SectionHead title="Empanelled Training Partners 🎓" />
      {vendorList.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginBottom:14 }}>
          {[
            { label:'Total Vendors', val: vendorList.length },
            { label:'Total Trainers', val: vendorList.reduce((s,v)=>s+(v.num_trainers||0),0) },
            { label:'Total Centres', val: vendorList.reduce((s,v)=>s+(v.num_centres||0),0) },
            { label:'Beneficiaries Trained', val: vendorList.reduce((s,v)=>s+(v.beneficiaries_trained||0),0).toLocaleString('en-IN') },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:10, padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:C.blue }}>{s.val}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <Card>
        <CardTitle>🏢 Registered Training Vendors</CardTitle>
        {!loaded.vendors ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : vendorList.length === 0 ? <div style={{ color:'#888', padding:12 }}>No training vendors registered in the system yet.</div>
         : <Table
             head={['Organisation','Email','Phone','State','District / City','Centres','Trainers','Courses','Beneficiaries','Status']}
             rows={vendorList.map(v => [
               <span style={{ fontWeight:600, color:C.navy }}>{v.name}</span>,
               v.email,
               v.phone || '—',
               v.state_name,
               v.district !== '—' ? `${v.district}${v.city && v.city !== '—' ? ', '+v.city : ''}` : (v.city !== '—' ? v.city : '—'),
               v.num_centres,
               v.num_trainers,
               v.num_courses,
               (v.beneficiaries_trained||0).toLocaleString('en-IN'),
               <Badge color="green">Active</Badge>
             ])}
           />}
      </Card>
      {trainingPartners.length > 0 && (
        <Card>
          <CardTitle>📋 CSR-Added Partners</CardTitle>
          <Table head={['Partner','Type','State','District','Trainers','Beneficiaries Trained','Status']} rows={trainingPartners.map(tp => [
            tp.name, tp.type||'—', tp.state_name||'—', tp.district||'—',
            tp.num_trainers||'—',
            (tp.beneficiaries_trained||0).toLocaleString('en-IN'),
            <Badge color={tp.status==='active'?'green':tp.status==='mou_expired'?'red':'gold'}>{tp.status}</Badge>
          ])} />
        </Card>
      )}
      <div style={{ marginTop:4 }}><Btn onClick={()=>go('tp-add')}>+ Add Partner Manually</Btn></div>
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
        {!loaded.tps ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : trainingPartners.length === 0 ? <div style={{ color:'#888', padding:12 }}>No training partners added yet. <button onClick={()=>go('tp-add')} style={{ background:'none', border:'none', color:C.blue, cursor:'pointer', fontWeight:600 }}>Add a partner →</button></div>
         : <Table head={['Partner','Type','State','Beneficiaries Trained','Contact','Status']} rows={trainingPartners.map(tp => {
             const trained = tp.beneficiaries_trained || 0;
             return [
               tp.name, tp.type||'—', tp.state_name||'—',
               trained.toLocaleString('en-IN'),
               tp.contact_person || tp.contact_email || '—',
               <Badge color={tp.status==='active'?'green':tp.status==='mou_expired'?'red':'gold'}>{tp.status}</Badge>
             ];
           })} />}
      </Card>
    </>;
  }

  function PanelTpMou() {
    const withMou = trainingPartners.filter(tp => tp.mou_date);
    return <>
      <Bc parts={['Training Partners','MoU / Agreements']} />
      <SectionHead title="MoU & Agreements 📄" />
      <Card>
        {!loaded.tps ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : withMou.length === 0
           ? <div style={{ color:'#888', padding:12 }}>No MoUs on record. When you add a training partner with MoU dates, they appear here.</div>
           : <Table head={['Partner','Type','MoU Date','Valid Till','NSDC Reg','Status']} rows={withMou.map(tp => [
               tp.name, tp.type||'—', tp.mou_date||'—', tp.mou_expiry||'—',
               tp.nsdc_reg||'—',
               <Badge color={tp.status==='active'?'green':tp.status==='mou_expired'?'red':'gold'}>{tp.status}</Badge>
             ])} />}
        <div style={{ marginTop:14 }}><Btn onClick={()=>go('tp-add')}>+ Add Training Partner with MoU</Btn></div>
      </Card>
    </>;
  }

  function PanelFundAllocation() {
    const obligation = parseFloat(user?.csr_obligation || 0);
    const allocated = stats.totalBudget || 0;
    const spent = stats.totalSpent || 0;
    const unalloc = Math.max(0, obligation - allocated);
    const allocPct = obligation > 0 ? Math.round(allocated / obligation * 100) : 0;
    return <>
      <Bc parts={['Funds','Fund Allocation']} />
      <SectionHead title="Fund Allocation 💰" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
        <KpiCard val={obligation > 0 ? crore(obligation) : '—'} label="Total CSR Obligation" sub="FY 2025-26" color={C.navy} />
        <KpiCard val={crore(allocated)} label="Allocated to Projects" sub={`${allocPct}% of obligation`} color={C.blue} />
        <KpiCard val={crore(unalloc)} label="Unallocated / Unspent" sub="Must transfer by Sep 30" color={C.red} />
      </div>
      {obligation === 0 && <Alert icon="ℹ️" type="info">Set your CSR obligation in <button onClick={()=>go('profile-info')} style={{ background:'none', border:'none', color:C.blue, cursor:'pointer', fontWeight:600, padding:0 }}>Organisation Information</button> to see allocation breakdown.</Alert>}
      <Card>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : projects.length === 0 ? <div style={{ color:'#888', padding:12 }}>No projects yet.</div>
         : <Table head={['Project','Allocated','Spent','Remaining','Utilization']} rows={projects.map(p => {
             const alloc = p.budget || 0;
             const disb = p.spent || 0;
             const rem = Math.max(0, alloc - disb);
             const u = pct(disb, alloc);
             return [p.title, crore(alloc), crore(disb), crore(rem),
               <Badge color={u>=75?'green':u>=50?'blue':'gold'}>{u}%</Badge>];
           })} />}
        <div style={{ marginTop:12, display:'flex', gap:10 }}>
          <Btn sm outline onClick={()=>go('fund-disbursements')}>📤 Add Disbursement →</Btn>
          <Btn sm outline onClick={()=>go('fund-utilization')}>📊 Utilization Report →</Btn>
          {unalloc > 0 && <Btn sm outline onClick={()=>go('fund-unspent')}>⚠️ Report Unspent Funds →</Btn>}
        </div>
      </Card>
    </>;
  }

  function PanelFundDisbursements() {
    const df = disbForm;
    const set = k => e => setDisbForm(f => ({ ...f, [k]: e.target.value }));

    async function saveDisbursement() {
      if (!df.recipient.trim()) { setDisbMsg('Recipient name is required.'); return; }
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
      {disbMsg && <Alert icon={disbMsg.startsWith('✅') ? '✅' : '❌'} type={disbMsg.startsWith('✅') ? 'success' : 'red'}>{disbMsg}{disbMsg.startsWith('✅') && <> <button onClick={()=>go('fund-utilization')} style={{ background:'none', border:'none', color:C.blue, cursor:'pointer', fontWeight:600, padding:0 }}>View Utilization →</button></>}</Alert>}
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
        {disbursements.length > 0 && <div style={{ marginTop:12 }}><Btn sm outline onClick={()=>go('fund-utilization')}>📊 View Utilization Report →</Btn></div>}
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
        <div style={{ marginTop:14, display:'flex', gap:10, flexWrap:'wrap' }}>
          <Btn outline onClick={()=>downloadCSV('csr_utilization_report.csv',
            ['Project','State','Budget (₹)','Spent (₹)','Utilization %'],
            projects.map(p=>[ p.title, p.state_name||'', p.budget||0, p.spent||0, pct(p.spent,p.budget) ]))}>📥 Download Report</Btn>
          <Btn onClick={()=>downloadCSV('csr_full_year_report.csv',
            ['Project','Activity','State','District','Budget (₹)','Spent (₹)','Beneficiaries Target','Beneficiaries Actual','Status'],
            projects.map(p=>[ p.title, p.activity||'', p.state_name||'', p.district||'', p.budget||0, p.spent||0, p.beneficiaries_target||0, p.beneficiaries_actual||0, p.status ]))}>📊 Full Year Report</Btn>
          <Btn outline onClick={()=>go('rep-impact')}>🌟 View Impact Report →</Btn>
          <Btn outline onClick={()=>go('rep-financial')}>💹 Financial Report →</Btn>
        </div>
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
    const skillProjects = projects.filter(p => p.activity === 'Skill Development');
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
        <CardTitle>📊 Skill Development Projects (PMKVY-aligned)</CardTitle>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : skillProjects.length === 0 ? <div style={{ color:'#888', padding:12 }}>No Skill Development projects yet. <button onClick={()=>go('proj-new')} style={{ background:'none', border:'none', color:C.blue, cursor:'pointer', fontWeight:600 }}>Propose one →</button></div>
         : <Table head={['Project','State','Budget','Beneficiaries','Status']} rows={skillProjects.map(p => [
             p.title, p.state_name||'—', crore(p.budget), p.beneficiaries_actual||0,
             <Badge color={p.status==='active'?'green':p.status==='completed'?'teal':p.status==='pending'?'gold':'blue'}>{p.status}</Badge>
           ])} />}
        <div style={{ marginTop:14 }}><Btn onClick={()=>go('proj-new')}>+ Propose New Project</Btn></div>
      </Card>
    </>;
  }

  function PanelSchemeDdugky() {
    const ruralProjects = projects.filter(p => ['Skill Development','Eradicating Poverty','Gender Equality'].includes(p.activity));
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
        <CardTitle>📋 DDU-GKY Eligible Projects</CardTitle>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : ruralProjects.length === 0 ? <div style={{ color:'#888', padding:12 }}>No eligible projects. Propose a Skill Development or Poverty Eradication project.</div>
         : <Table head={['Project','State','Agency','Target','Actual','Status']} rows={ruralProjects.map(p => [
             p.title, p.state_name||'—', p.implementing_agency||'—',
             p.beneficiaries_target||0, p.beneficiaries_actual||0,
             <Badge color={p.status==='active'?'green':p.status==='completed'?'teal':'gold'}>{p.status}</Badge>
           ])} />}
      </Card>
    </>;
  }

  function PanelSchemeStar() {
    const skillProjects = projects.filter(p => p.activity === 'Skill Development');
    const totalCertified = stats.certifiedBeneficiaries || 0;
    return <>
      <Bc parts={['Schemes','STAR Scheme']} />
      <SectionHead title="STAR Scheme — Standard Training Assessment and Reward ⭐" />
      <Card>
        <div style={{ fontSize:13, color:'#374151', lineHeight:1.8, marginBottom:12 }}>
          STAR offers <strong>monetary rewards to candidates</strong> who get certified in pre-defined job roles.{' '}
          <Badge color="teal">₹500–₹2,000 reward per candidate</Badge>{' '}<Badge color="blue">Aadhaar-linked disbursement</Badge>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:12 }}>
          <KpiCard val={totalCertified.toLocaleString('en-IN')} label="Certified Beneficiaries" sub="STAR reward eligible" color={C.green} />
          <KpiCard val={crore(totalCertified * 1000)} label="Est. Rewards Payable" sub="@₹1,000 avg per candidate" color={C.teal} />
          <KpiCard val={skillProjects.length} label="Eligible Projects" sub="Skill Development activity" color={C.blue} />
        </div>
      </Card>
      <Card>
        <CardTitle>📊 STAR Benefits in My Projects</CardTitle>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : skillProjects.length === 0 ? <div style={{ color:'#888', padding:12 }}>No Skill Development projects yet.</div>
         : <Table head={['Project','State','Beneficiaries Target','Status']} rows={skillProjects.map(p => [
             p.title, p.state_name||'—', p.beneficiaries_target||0,
             <Badge color={p.status==='active'?'green':p.status==='completed'?'teal':'gold'}>{p.status}</Badge>
           ])} />}
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
        <div style={{ marginTop:14 }}><Btn onClick={()=>go('bene-register')}>+ Enroll New Apprentice</Btn></div>
      </Card>
    </>;
  }

  function PanelRepImpact() {
    const total = stats.totalBeneficiaries || 0;
    const certified = stats.certifiedBeneficiaries || 0;
    const placed = stats.placedBeneficiaries || 0;
    const women = beneficiaries.filter(b => b.gender === 'Female').length;
    const womenPct = total > 0 ? Math.round(women / total * 100) : 0;
    const byState = {};
    beneficiaries.forEach(b => {
      const s = b.state_name || 'Unknown';
      if (!byState[s]) byState[s] = { enrolled:0, certified:0, placed:0 };
      byState[s].enrolled++;
      if (b.training_status === 'completed') byState[s].certified++;
      if (b.placement_status === 'placed') byState[s].placed++;
    });
    return <>
      <Bc parts={['Reports','Impact Reports']} />
      <SectionHead title="Impact Reports 🌟" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
        <KpiCard val={certified.toLocaleString('en-IN')} label="Beneficiaries Certified" sub="All projects" color={C.green} />
        <KpiCard val={placed.toLocaleString('en-IN')} label="Placed in Jobs" sub={`${pct(placed,certified)}% placement rate`} color={C.blue} />
        <KpiCard val={stats.totalPartners||0} label="Training Partners" sub="Active engagements" color={C.teal} />
        <KpiCard val={`${womenPct}%`} label="Women Beneficiaries" sub={`${women} of ${total}`} color={C.purple} />
      </div>
      <Card>
        <CardTitle>State-wise Impact</CardTitle>
        {!loaded.beneficiaries ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : Object.keys(byState).length === 0 ? <div style={{ color:'#888', padding:12 }}>No beneficiary data yet.</div>
         : <Table head={['State','Enrolled','Certified','Placed','Placement Rate']} rows={Object.entries(byState).map(([state, data]) => {
             const rate = data.certified > 0 ? Math.round(data.placed/data.certified*100) : 0;
             return [state, data.enrolled, data.certified, data.placed,
               <Badge color={rate>=75?'green':rate>=50?'blue':'gold'}>{rate}%</Badge>];
           })} />}
      </Card>
    </>;
  }

  function PanelRepFinancial() {
    const obligation = parseFloat(user?.csr_obligation || 0);
    const totalSpend = stats.totalSpent || 0;
    const unspent = Math.max(0, obligation - totalSpend);
    const util = pct(totalSpend, obligation);
    return <>
      <Bc parts={['Reports','Financial Reports']} />
      <SectionHead title="Financial Reports 💰" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
        <KpiCard val={obligation > 0 ? crore(obligation) : '—'} label="CSR Obligation FY26" sub="2% of avg net profit" color={C.navy} />
        <KpiCard val={crore(totalSpend)} label="Actual Spend" sub="All projects" color={C.green} />
        <KpiCard val={`${util}%`} label="Utilization" sub={crore(unspent) + ' unspent'} color={util>=75?C.green:util>=50?C.gold:C.red} />
      </div>
      <Card>
        <CardTitle>📊 FY 2025-26 Summary</CardTitle>
        {obligation === 0 && <Alert icon="ℹ️" type="info">Set your CSR obligation in <button onClick={()=>go('profile-info')} style={{ background:'none', border:'none', color:C.blue, cursor:'pointer', fontWeight:600, padding:0 }}>Organisation Information</button> for accurate figures.</Alert>}
        <StatRow n={obligation > 0 ? crore(obligation) : '—'} label="Total CSR Obligation" pct={100} color={C.navy} />
        <StatRow n={crore(totalSpend)} label="Total Spent" pct={util} color={C.green} />
        <StatRow n={crore(unspent)} label="Unspent Amount" pct={100-util} color={C.red} />
        {unspentFunds.length > 0 && <>
          <div style={{ marginTop:14, marginBottom:8, fontWeight:700, fontSize:13, color:C.navy }}>Recorded Unspent Fund Plans</div>
          <Table head={['FY','Amount','Destination','Status']} rows={unspentFunds.map(u => [
            u.financial_year, crore(u.unspent_amount), u.transfer_destination||'—',
            <Badge color={u.status==='transferred'?'green':u.status==='pending'?'gold':'blue'}>{u.status}</Badge>
          ])} />
        </>}
        <div style={{ marginTop:14 }}><Btn outline onClick={()=>{
          const rows = [
            ['CSR Obligation FY26', obligation > 0 ? obligation : '—'],
            ['Total Spent', totalSpend],
            ['Unspent Amount', unspent],
            ['Utilization %', util + '%'],
            ...unspentFunds.map(u=>['Unspent Fund — '+u.financial_year, u.unspent_amount]),
          ];
          downloadCSV('csr_financial_statement.csv', ['Line Item','Value (₹)'], rows);
        }}>📥 Download Statement</Btn></div>
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
        <div style={{ marginTop:14, textAlign:'right' }}><Btn green onClick={()=>{
          downloadCSV('csr_annual_report.csv',
            ['Project','Activity','State','District','Budget (₹)','Spent (₹)','Beneficiaries Target','Beneficiaries Actual','IA','Status'],
            projects.map(p=>[p.title,p.activity||'',p.state_name||'',p.district||'',p.budget||0,p.spent||0,p.beneficiaries_target||0,p.beneficiaries_actual||0,p.implementing_agency||'',p.status]));
          showToast('Annual report exported as CSV.');
        }}>🔄 Generate Report</Btn></div>
      </Card>
      <Card>
        <CardTitle>📁 Past Annual Reports</CardTitle>
        <Table head={['Year','Generated On','Pages','Action']} rows={[
          ['FY 2024-25','Apr 15, 2025','42',<Btn sm outline onClick={()=>showToast('Historical PDF reports are not stored yet — use Generate Report to export current data.')}>Download</Btn>],
          ['FY 2023-24','Apr 12, 2024','38',<Btn sm outline onClick={()=>showToast('Historical PDF reports are not stored yet — use Generate Report to export current data.')}>Download</Btn>],
          ['FY 2022-23','Apr 18, 2023','35',<Btn sm outline onClick={()=>showToast('Historical PDF reports are not stored yet — use Generate Report to export current data.')}>Download</Btn>],
        ]} />
      </Card>
    </>;
  }

  function PanelRepSector() {
    const bySector = {};
    projects.forEach(p => {
      const s = p.activity || 'Skill Development';
      if (!bySector[s]) bySector[s] = { projects:0, beneficiaries:0, spend:0 };
      bySector[s].projects++;
      bySector[s].beneficiaries += p.beneficiaries_actual || 0;
      bySector[s].spend += p.spent || 0;
    });
    return <>
      <Bc parts={['Reports','Sector-wise Report']} />
      <SectionHead title="Sector-wise Report 🏭" />
      <Card>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : Object.keys(bySector).length === 0 ? <div style={{ color:'#888', padding:12 }}>No project data yet.</div>
         : <Table head={['Sector (Schedule VII)','Projects','Beneficiaries','Spend']} rows={Object.entries(bySector).map(([sector, data]) => [
             sector, data.projects, data.beneficiaries.toLocaleString('en-IN'), crore(data.spend)
           ])} />}
      </Card>
    </>;
  }

  function PanelRepGeo() {
    const byState = {};
    projects.forEach(p => {
      const s = p.state_name || 'Unknown';
      if (!byState[s]) byState[s] = { projects:0, beneficiaries:0, spend:0, districts:new Set() };
      byState[s].projects++;
      byState[s].beneficiaries += p.beneficiaries_actual || 0;
      byState[s].spend += p.spent || 0;
      if (p.district) byState[s].districts.add(p.district);
    });
    return <>
      <Bc parts={['Reports','Geographic Report']} />
      <SectionHead title="Geographic Report 🗺️" />
      <Card>
        {!loaded.projects ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : Object.keys(byState).length === 0 ? <div style={{ color:'#888', padding:12 }}>No project data yet.</div>
         : <Table head={['State','Projects','Beneficiaries','Spend','Districts']} rows={Object.entries(byState).map(([state, data]) => [
             state, data.projects, data.beneficiaries.toLocaleString('en-IN'), crore(data.spend),
             [...data.districts].join(', ') || '—'
           ])} />}
        <div style={{ marginTop:14 }}><Btn outline onClick={()=>downloadCSV('csr_geographic_report.csv',
          ['State','Projects','Beneficiaries','Spend (₹)','Districts'],
          Object.entries(byState).map(([state,d])=>[state,d.projects,d.beneficiaries,d.spend,[...d.districts].join('; ')||'—']))}>📥 Download State Report</Btn></div>
      </Card>
    </>;
  }

  function PanelCompSchedule7() {
    const clauseMap = {
      'Eradicating Poverty': 'i', 'Promoting Education': 'ii', 'Healthcare & Sanitation': 'iii',
      'Gender Equality': 'iii', 'Environment': 'vi', 'National Heritage': 'v',
      'Sports': 'vii', 'Skill Development': 'vii', 'PM National Relief Fund': 'viii',
    };
    const actSpend = {};
    const activeActs = new Set(projects.map(p => p.activity));
    projects.forEach(p => {
      const a = p.activity || 'Skill Development';
      actSpend[a] = (actSpend[a] || 0) + (p.spent || 0);
    });
    const clauses = [
      ['i', 'Eradicating extreme poverty, hunger, malnutrition'],
      ['ii', 'Promoting education and vocational skills'],
      ['iii', 'Promoting gender equality / Healthcare & Sanitation'],
      ['iv', 'Reducing infant mortality, maternal health'],
      ['v', 'National Heritage / Arts / Culture'],
      ['vi', 'Environmental sustainability'],
      ['vii', 'Employment enhancing vocational skills (Skill Development)'],
      ['viii', 'PM National Relief Fund / PM CARES'],
    ];
    return <>
      <Bc parts={['Compliance','Schedule VII']} />
      <SectionHead title="Schedule VII Compliance 📜" />
      <Card>
        <p style={{ fontSize:13, color:'#374151', marginBottom:14 }}>CSR activities must fall under Schedule VII of the Companies Act, 2013. Your active project activities are mapped below.</p>
        {clauses.map(([n, title]) => {
          const matchingActs = Object.entries(clauseMap).filter(([,c]) => c === n).map(([a]) => a);
          const spend = matchingActs.reduce((s, a) => s + (actSpend[a] || 0), 0);
          const active = matchingActs.some(a => activeActs.has(a));
          const sub = spend > 0 ? `Active — ${crore(spend)} spent` : 'Not in current project scope';
          return <Step key={n} num={n} title={title} sub={sub} done={active} pending={!active} />;
        })}
        {!loaded.projects && <div style={{ color:'#888', fontSize:12, marginTop:8 }}>Loading project data…</div>}
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
          ['SkillBridge Institute Pvt Ltd','U85100MH2015PTC266234','Jan 10, 2025',<Badge color="green">Verified</Badge>,<Btn sm outline onClick={()=>showToast('IA filing details are maintained on the MCA21 portal. Use the CSR-1 registry to verify.')}>View</Btn>],
          ['TrainRight Academy Society','S-00123/RJ/2018','Jan 15, 2025',<Badge color="green">Verified</Badge>,<Btn sm outline onClick={()=>showToast('IA filing details are maintained on the MCA21 portal. Use the CSR-1 registry to verify.')}>View</Btn>],
          ['HealSkill Foundation','U85310BR2012NPL012345','Feb 01, 2025',<Badge color="gold">Under Review</Badge>,<Btn sm outline onClick={()=>showToast('IA filing details are maintained on the MCA21 portal. Use the CSR-1 registry to verify.')}>View</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn onClick={()=>window.open('https://www.mca.gov.in/content/mca/global/en/mca/e-filing/company-forms-download.html','_blank','noopener,noreferrer')}>+ Register New IA (CSR-1)</Btn></div>
      </Card>
    </>;
  }

  function PanelCompCsr2() {
    const form = csr2Form;
    const setForm = setCsr2Form;
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const totalSpent = (Number(form.amount_spent_own || 0) + Number(form.amount_spent_implementing_agency || 0));
    const obligation = Number(form.csr_obligation || user?.csr_obligation || 0);
    const unspent = Math.max(0, obligation - totalSpent);

    async function handleSave(status) {
      if (status === 'submitted') {
        if (!form.company_name.trim()) { setCsr2Msg('❌ Company name is required before submitting.'); return; }
        if (!form.avg_net_profit || Number(form.avg_net_profit) <= 0) { setCsr2Msg('❌ Average net profit (Part B) is required before submitting.'); return; }
        if (!form.csr_obligation || Number(form.csr_obligation) <= 0) { setCsr2Msg('❌ CSR obligation (Part B) is required before submitting.'); return; }
        if (!form.ceo_name.trim()) { setCsr2Msg('❌ CEO/MD name (Part D — Certification) is required before submitting.'); return; }
      }
      setCsr2Saving(true); setCsr2Msg('');
      const data = { ...form, total_amount_spent: totalSpent, unspent_amount: unspent };
      try {
        const res = await api.csrSaveForm('csr2', { financial_year: '2025-26', data, status });
        setCsr2Record(res);
        setCsr2Msg(status === 'submitted' ? '✅ CSR-2 data submitted successfully! File the form on MCA21 portal to complete compliance.' : '✅ Draft saved.');
      } catch(e) { setCsr2Msg('❌ ' + (e.message || 'Save failed.')); }
      setCsr2Saving(false);
    }

    if (csr2Loading) return <div style={{ color:'#888', padding:20 }}>Loading saved data…</div>;

    const isSubmitted = csr2Record?.status === 'submitted';

    return <>
      <Bc parts={['Compliance','Form CSR-2']} />
      <SectionHead title="Form CSR-2 — Annual Report on CSR 📝" />
      <Alert icon="⚠️" type="warn"><strong>CSR-2 for FY 2025-26</strong> is due by <strong>30 Sep 2026</strong>. Fill the details below, save, then file on MCA21 portal.</Alert>
      {csr2Msg && <Alert icon={csr2Msg.startsWith('✅')?'✅':'❌'} type={csr2Msg.startsWith('✅')?'success':'red'}>{csr2Msg}</Alert>}
      {isSubmitted && <Alert icon="✅" type="success">This CSR-2 was marked as submitted on {csr2Record.submitted_at ? new Date(csr2Record.submitted_at).toLocaleDateString('en-IN') : '—'}. You can update and re-save.</Alert>}

      {/* Part A — Company Details */}
      <Card>
        <CardTitle>📋 Part A — Company Details</CardTitle>
        <Grid>
          <Field label="CIN"><Inp value={form.cin} onChange={set('cin')} placeholder="L12345MH2000PLC123456" /></Field>
          <Field label="Company Name"><Inp value={form.company_name} onChange={set('company_name')} placeholder="Company name as per MCA" /></Field>
        </Grid>
        <Field label="Registered Office Address"><Inp value={form.registered_office} onChange={set('registered_office')} placeholder="Full address" /></Field>
      </Card>

      {/* Part B — Financial Details */}
      <Card>
        <CardTitle>💰 Part B — CSR Financial Details</CardTitle>
        <Grid cols={3}>
          <Field label="Avg Net Profit (3yr) ₹"><Inp type="number" value={form.avg_net_profit} onChange={set('avg_net_profit')} placeholder="e.g. 10000000" /></Field>
          <Field label="2% CSR Obligation ₹"><Inp type="number" value={form.csr_obligation} onChange={set('csr_obligation')} placeholder="Computed by system" /></Field>
          <Field label="Board Approval Date"><Inp type="date" value={form.board_approval_date} onChange={set('board_approval_date')} /></Field>
        </Grid>
        <Grid cols={3}>
          <Field label="Amount Spent (Own) ₹"><Inp type="number" value={form.amount_spent_own} onChange={set('amount_spent_own')} placeholder="Direct spend" /></Field>
          <Field label="Amount via Implementing Agency ₹"><Inp type="number" value={form.amount_spent_implementing_agency} onChange={set('amount_spent_implementing_agency')} placeholder="Via IA" /></Field>
          <Field label="Amount Transferred to Unspent A/C ₹"><Inp type="number" value={form.amount_transferred_unspent} onChange={set('amount_transferred_unspent')} placeholder="If applicable" /></Field>
        </Grid>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10, background:'#f8fafc', borderRadius:8, padding:'10px 14px' }}>
          <div><div style={{ fontSize:11, color:'#64748b' }}>Total Spent (auto)</div><div style={{ fontWeight:700, color:C.green, fontSize:14 }}>₹{(totalSpent/100000).toFixed(2)}L</div></div>
          <div><div style={{ fontSize:11, color:'#64748b' }}>Obligation</div><div style={{ fontWeight:700, color:C.navy, fontSize:14 }}>₹{(obligation/100000).toFixed(2)}L</div></div>
          <div><div style={{ fontSize:11, color:'#64748b' }}>Unspent (auto)</div><div style={{ fontWeight:700, color:unspent>0?C.red:C.green, fontSize:14 }}>₹{(unspent/100000).toFixed(2)}L</div></div>
        </div>
        {Number(form.amount_transferred_unspent) > 0 && <Grid style={{ marginTop:10 }}>
          <Field label="Transfer Account Name"><Inp value={form.transfer_account_name} onChange={set('transfer_account_name')} placeholder="Bank / Fund name" /></Field>
          <Field label="Transfer Date"><Inp type="date" value={form.transfer_date} onChange={set('transfer_date')} /></Field>
        </Grid>}
      </Card>

      {/* Part C — CSR Committee */}
      <Card>
        <CardTitle>👥 Part C — CSR Committee & Activities</CardTitle>
        <Field label="CSR Committee Composition"><textarea rows={2} value={form.csr_committee_composition} onChange={set('csr_committee_composition')} placeholder="Names and designations of CSR committee members…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit' }} /></Field>
        <Field label="Activities Undertaken (Schedule VII reference)" style={{ marginTop:8 }}><textarea rows={3} value={form.activities_undertaken} onChange={set('activities_undertaken')} placeholder="List CSR activities and Schedule VII clauses covered…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit' }} /></Field>
        <Field label="Ongoing Multi-year Projects (if any)" style={{ marginTop:8 }}><textarea rows={2} value={form.ongoing_projects} onChange={set('ongoing_projects')} placeholder="Project names and expected completion dates…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit' }} /></Field>
        {unspent > 0 && <Field label="Reason for Shortfall (if obligation not fully met)" style={{ marginTop:8 }}><textarea rows={2} value={form.reason_shortfall} onChange={set('reason_shortfall')} placeholder="Explain reasons for shortfall…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit' }} /></Field>}
        <Field label="Impact Assessment Summary" style={{ marginTop:8 }}><textarea rows={2} value={form.impact_assessment} onChange={set('impact_assessment')} placeholder="Key outcomes and beneficiary impact…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit' }} /></Field>
      </Card>

      {/* Part D — Certification */}
      <Card>
        <CardTitle>✍️ Part D — Certification</CardTitle>
        <Grid>
          <Field label="CEO / MD Name"><Inp value={form.ceo_name} onChange={set('ceo_name')} placeholder="Full name" /></Field>
          <Field label="Designation"><Inp value={form.ceo_designation} onChange={set('ceo_designation')} placeholder="e.g. Managing Director" /></Field>
        </Grid>
        <Grid>
          <Field label="CFO Name"><Inp value={form.cfo_name} onChange={set('cfo_name')} placeholder="Full name" /></Field>
          <Field label="Designation"><Inp value={form.cfo_designation} onChange={set('cfo_designation')} placeholder="e.g. Chief Financial Officer" /></Field>
        </Grid>
      </Card>

      {/* Checklist */}
      <Card>
        <CardTitle>📋 Filing Checklist</CardTitle>
        {[
          [!!form.avg_net_profit, 'Average net profit of 3 preceding FYs entered', form.avg_net_profit ? `₹${(Number(form.avg_net_profit)/10000000).toFixed(2)} Cr` : 'Pending'],
          [!!form.csr_obligation, '2% CSR obligation computed', form.csr_obligation ? `₹${(Number(form.csr_obligation)/10000000).toFixed(2)} Cr` : 'Pending'],
          [totalSpent > 0, 'Total amount spent filled', totalSpent > 0 ? `₹${(totalSpent/10000000).toFixed(2)} Cr` : 'Pending'],
          [unspent === 0 || !!form.amount_transferred_unspent, 'Unspent amount addressed', unspent === 0 ? 'Fully utilised ✅' : form.amount_transferred_unspent ? 'Transfer recorded' : 'Pending transfer'],
          [!!form.csr_committee_composition, 'CSR committee composition filled', form.csr_committee_composition ? 'Done' : 'Pending'],
          [!!form.ceo_name && !!form.cfo_name, 'Certification details filled', (form.ceo_name && form.cfo_name) ? 'Done' : 'Pending'],
          [isSubmitted, 'CSR-2 data saved and marked submitted', isSubmitted ? 'Submitted ✅' : 'Not yet submitted'],
        ].map(([done, title, sub], i) => (
          <Step key={i} num={i+1} title={title} sub={sub} done={done} pending={!done} />
        ))}
      </Card>

      <div style={{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap' }}>
        <Btn outline onClick={() => handleSave('draft')} disabled={csr2Saving}>{csr2Saving ? '⏳ Saving…' : '💾 Save Draft'}</Btn>
        <Btn green onClick={() => handleSave('submitted')} disabled={csr2Saving}>{csr2Saving ? '⏳ Submitting…' : '✅ Mark as Submitted'}</Btn>
        <Btn teal onClick={() => window.open('https://www.mca.gov.in/content/mca/global/en/mca/e-filing/company-forms-download.html', '_blank', 'noopener,noreferrer')}>🔗 File on MCA21 Portal</Btn>
      </div>
    </>;
  }

  function PanelCompBoard() {
    return <>
      <Bc parts={['Compliance','Board Resolutions']} />
      <SectionHead title="Board Resolutions 🏛️" />
      <Card>
        <Table head={['Resolution','Date','Subject','Status','Action']} rows={[
          ['BR-2025-CSR-001','Apr 01, 2025','Annual CSR Budget & Plan — FY26',<Badge color="green">Verified</Badge>,<Btn sm outline onClick={()=>showToast('No file attached yet. Upload the resolution PDF to enable download.')}>Download</Btn>],
          ['BR-2025-CSR-002','Apr 15, 2025','SkillBridge Institute engagement as IA',<Badge color="green">Verified</Badge>,<Btn sm outline onClick={()=>showToast('No file attached yet. Upload the resolution PDF to enable download.')}>Download</Btn>],
          ['BR-2025-CSR-003','Jul 01, 2025','Q1 Expenditure Ratification',<Badge color="green">Verified</Badge>,<Btn sm outline onClick={()=>showToast('No file attached yet. Upload the resolution PDF to enable download.')}>Download</Btn>],
          ['BR-2025-CSR-004','Sep 30, 2025','Q2 Plan Revision',<Badge color="gold">Pending Upload</Badge>,<Btn sm onClick={()=>showToast('File uploads require document storage to be configured. Contact your administrator.')}>Upload</Btn>],
        ]} />
        <div style={{ marginTop:14 }}><Btn onClick={()=>showToast('File uploads require document storage to be configured. Contact your administrator.')}>📤 Upload Resolution</Btn></div>
      </Card>
    </>;
  }

  function PanelCompAudit() {
    return <>
      <Bc parts={['Compliance','Audit Trail']} />
      <SectionHead title="Audit Trail 🔍" />
      <Card>
        {!loaded.audit ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : auditLogs.length === 0
           ? <div style={{ color:'#888', padding:12 }}>No audit records found for your account.</div>
           : <Table head={['Timestamp','Action','Resource','Details']} rows={auditLogs.slice(0,20).map(a => [
               a.created_at ? new Date(a.created_at).toLocaleString('en-IN') : '—',
               a.action || a.event || '—',
               a.resource || a.entity || '—',
               a.details || a.description || '—',
             ])} />}
      </Card>
    </>;
  }

  function PanelHelpdesk() {
    const tf = ticketForm;
    const set = k => e => setTicketForm(f => ({ ...f, [k]: e.target.value }));
    async function submitTicket() {
      if (!tf.subject.trim()) { setTicketMsg('Subject is required.'); return; }
      setTicketSaving(true); setTicketMsg('');
      try {
        await api.csrCreateTicket({ category: tf.category, priority: tf.priority, subject: tf.subject, description: tf.description });
        setTicketMsg('✅ Ticket submitted successfully!');
        setTicketForm({ category:'Technical Issue', priority:'Medium', subject:'', description:'' });
        setLoaded(l => ({ ...l, tickets: false }));
        api.csrTickets().then(setTickets).catch(() => {});
      } catch(e) { setTicketMsg('❌ ' + (e.message || 'Submit failed.')); }
      setTicketSaving(false);
    }
    return <>
      <Bc parts={['Support','Helpdesk']} />
      <SectionHead title="Helpdesk 🎧" />
      {ticketMsg && <Alert icon={ticketMsg.startsWith('✅') ? '✅' : '❌'} type={ticketMsg.startsWith('✅') ? 'success' : 'red'}>{ticketMsg}</Alert>}
      <Card>
        <CardTitle>🆕 Raise a Ticket</CardTitle>
        <Grid>
          <Field label="Category"><Sel value={tf.category} onChange={set('category')} options={['CSR Registration','Fund Transfer','Project Approval','Compliance Query','Technical Issue','Other']} /></Field>
          <Field label="Priority"><Sel value={tf.priority} onChange={set('priority')} options={['Low','Medium','High','Critical']} /></Field>
        </Grid>
        <Field label="Subject"><Inp value={tf.subject} onChange={set('subject')} placeholder="e.g. Unable to upload CSR-1 document" /></Field>
        <Field label="Description"><textarea value={tf.description} onChange={set('description')} rows={4} placeholder="Describe your issue…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn green onClick={submitTicket} disabled={ticketSaving}>{ticketSaving ? '⏳ Submitting…' : '📩 Submit Ticket'}</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 My Tickets</CardTitle>
        {!loaded.tickets ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : tickets.length === 0 ? <div style={{ color:'#888', padding:12 }}>No tickets raised yet.</div>
         : <Table head={['Ticket ID','Category','Subject','Priority','Status','Raised']} rows={tickets.map(t => [
             `TKT-${String(t.id).padStart(8,'0')}`, t.category||'—', t.subject||'—',
             <Badge color={t.priority==='Critical'?'red':t.priority==='High'?'orange':t.priority==='Medium'?'gold':'teal'}>{t.priority||'Medium'}</Badge>,
             <Badge color={t.status==='resolved'?'green':t.status==='in_progress'?'blue':'gold'}>{t.status||'open'}</Badge>,
             t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'
           ])} />}
      </Card>
    </>;
  }

  function PanelGrievance() {
    const gf = grievanceForm;
    const set = k => e => setGrievanceForm(f => ({ ...f, [k]: e.target.value }));
    async function submitGrievance() {
      if (!gf.description.trim()) { setGrievanceMsg('Description is required.'); return; }
      setGrievanceSaving(true); setGrievanceMsg('');
      try {
        await api.csrCreateGrievance({ type: gf.type, against: gf.against, description: gf.description });
        setGrievanceMsg('✅ Grievance submitted!');
        setGrievanceForm({ type:'Project Approval Delay', against:'', description:'' });
        setLoaded(l => ({ ...l, grievances: false }));
        api.csrGrievances().then(setGrievances).catch(() => {});
      } catch(e) { setGrievanceMsg('❌ ' + (e.message || 'Submit failed.')); }
      setGrievanceSaving(false);
    }
    return <>
      <Bc parts={['Support','Grievance']} />
      <SectionHead title="Grievance Redressal 📣" />
      <Alert icon="ℹ️" type="info">Grievances related to CSR project disbursement delays, beneficiary issues, or scheme approvals. Expected resolution: 15 working days.</Alert>
      {grievanceMsg && <Alert icon={grievanceMsg.startsWith('✅') ? '✅' : '❌'} type={grievanceMsg.startsWith('✅') ? 'success' : 'red'}>{grievanceMsg}</Alert>}
      <Card>
        <Field label="Grievance Type"><Sel value={gf.type} onChange={set('type')} options={['Project Approval Delay','Fund Disbursement Delay','Training Partner Issue','Beneficiary Welfare','Scheme Non-compliance','Other']} /></Field>
        <Field label="Against (If Applicable)"><Inp value={gf.against} onChange={set('against')} placeholder="e.g. State Nodal Agency / Training Partner" /></Field>
        <Field label="Description"><textarea value={gf.description} onChange={set('description')} rows={5} placeholder="Describe your grievance with relevant dates, amounts, and details…" style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} /></Field>
        <div style={{ textAlign:'right' }}><Btn danger onClick={submitGrievance} disabled={grievanceSaving}>{grievanceSaving ? '⏳ Submitting…' : '📤 Submit Grievance'}</Btn></div>
      </Card>
      <Card>
        <CardTitle>📋 Past Grievances</CardTitle>
        {!loaded.grievances ? <div style={{ color:'#888', padding:12 }}>Loading…</div>
         : grievances.length === 0 ? <div style={{ color:'#888', padding:12 }}>No grievances filed yet.</div>
         : <Table head={['GRV ID','Type','Against','Filed On','Status']} rows={grievances.map(g => [
             `GRV-${String(g.id).padStart(7,'0')}`, g.type||'—', g.against||'—',
             g.created_at ? new Date(g.created_at).toLocaleDateString('en-IN') : '—',
             <Badge color={g.status==='resolved'?'green':g.status==='under_review'?'gold':'blue'}>{g.status||'submitted'}</Badge>
           ])} />}
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

  function PanelAI({ sub }) {
    const C2 = { accent:'#6366f1', accentSoft:'#eef2ff', gold:'#f59e0b', green:'#10b981', red:'#ef4444', navy:'#1e3a5f', muted:'#64748b' };
    const projs = projects || [];
    const benes = beneficiaries || [];
    const disbs = disbursements || [];
    const totalBudget = projs.reduce((s,p)=>s+(Number(p.budget)||0),0);
    const totalSpent  = disbs.filter(d=>d.status==='disbursed').reduce((s,d)=>s+(Number(d.amount)||0),0);
    const utilPct = totalBudget>0 ? Math.round((totalSpent/totalBudget)*100) : 0;
    const certRate = benes.length>0 ? Math.round((benes.filter(b=>b.training_status==='certified').length/benes.length)*100) : 0;
    const placedRate = benes.length>0 ? Math.round((benes.filter(b=>b.placement_status==='placed').length/benes.length)*100) : 0;

    const AICard = ({ icon, title, badge, badgeColor='#6366f1', children }) => (
      <div style={{ background:'#fff', borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #e8ecf3', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontWeight:700, fontSize:14, color:C2.navy, flex:1 }}>{title}</span>
          {badge && <span style={{ background:badgeColor, color:'#fff', borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:700 }}>{badge}</span>}
        </div>
        {children}
      </div>
    );

    const ScoreBar = ({ label, score, max=100, color='#6366f1' }) => (
      <div style={{ marginBottom:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C2.muted, marginBottom:3 }}>
          <span>{label}</span><span style={{ fontWeight:700, color }}>{score}/{max}</span>
        </div>
        <div style={{ background:'#f1f5f9', borderRadius:4, height:7 }}>
          <div style={{ width:`${(score/max)*100}%`, height:'100%', borderRadius:4, background:color }} />
        </div>
      </div>
    );

    const InfoRow = ({ label, value, color }) => (
      <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
        <span style={{ color:C2.muted }}>{label}</span>
        <span style={{ fontWeight:600, color: color || C2.navy }}>{value}</span>
      </div>
    );

    if (sub === 'ai-proposal') {
      const scored = projs.map(p => {
        let score = 40;
        if (p.objectives && p.objectives.length > 30) score += 15;
        if (p.implementing_agency) score += 10;
        if (p.mou_signed && p.mou_signed.includes('Yes')) score += 10;
        if (p.budget && Number(p.budget) > 0) score += 10;
        if (p.target_beneficiaries && Number(p.target_beneficiaries) > 0) score += 10;
        if (p.start_date && p.end_date) score += 5;
        return { ...p, score: Math.min(100, score) };
      });
      return <>
        <Bc parts={['AI Components','Proposal Quality Scoring']} />
        <SectionHead title="🧠 Proposal Quality Scoring" />
        <AICard icon="📊" title="How It Works" badge="AI Model">
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Each proposal is evaluated across 7 dimensions: objectives clarity, implementing agency, MoU status, financial planning, beneficiary targeting, timeline definition, and sector alignment. Scores above 80 are recommended for fast-track approval.</p>
        </AICard>
        {scored.length === 0 ? <div style={{ color:C2.muted, padding:20 }}>No proposals to score yet.</div> :
          scored.map(p => (
            <AICard key={p.id} icon="📋" title={p.title || 'Untitled'} badge={p.score>=80?'High Quality':p.score>=60?'Good':'Needs Work'} badgeColor={p.score>=80?C2.green:p.score>=60?C2.gold:C2.red}>
              <ScoreBar label="Overall Score" score={p.score} color={p.score>=80?C2.green:p.score>=60?C2.gold:C2.red} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 }}>
                <ScoreBar label="Objectives" score={p.objectives?.length>30?15:0} max={15} color={C2.accent} />
                <ScoreBar label="Agency" score={p.implementing_agency?10:0} max={10} color={C2.accent} />
                <ScoreBar label="MoU" score={p.mou_signed?.includes('Yes')?10:0} max={10} color={C2.accent} />
                <ScoreBar label="Budget" score={p.budget&&Number(p.budget)>0?10:0} max={10} color={C2.accent} />
                <ScoreBar label="Beneficiaries" score={p.target_beneficiaries&&Number(p.target_beneficiaries)>0?10:0} max={10} color={C2.accent} />
                <ScoreBar label="Timeline" score={p.start_date&&p.end_date?5:0} max={5} color={C2.accent} />
              </div>
            </AICard>
          ))
        }
      </>;
    }

    if (sub === 'ai-duplicate') {
      const groups = [];
      const used = new Set();
      projs.forEach((p, i) => {
        if (used.has(i)) return;
        const group = [p];
        projs.forEach((q, j) => {
          if (i === j || used.has(j)) return;
          const titleSim = p.title && q.title && p.title.toLowerCase().split(' ').filter(w=>w.length>3).some(w=>q.title.toLowerCase().includes(w));
          const sectorSim = p.activity === q.activity;
          const stateSim = p.target_states && q.target_states && p.target_states === q.target_states;
          if (titleSim && (sectorSim || stateSim)) { group.push(q); used.add(j); }
        });
        if (group.length > 1) groups.push(group);
        used.add(i);
      });
      return <>
        <Bc parts={['AI Components','Duplicate Proposal Detection']} />
        <SectionHead title="🔍 Duplicate Proposal Detection" />
        <AICard icon="🤖" title="Detection Method" badge={`${groups.length} Cluster${groups.length!==1?'s':''} Found`} badgeColor={groups.length>0?C2.red:C2.green}>
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>The AI compares proposal titles, activity sectors, and target geographies using similarity analysis. Proposals with overlapping keywords, same sector, and same target state are flagged as potential duplicates for review.</p>
        </AICard>
        {groups.length === 0
          ? <AICard icon="✅" title="No Duplicates Detected" badge="Clean" badgeColor={C2.green}><p style={{ fontSize:13, color:C2.muted, margin:0 }}>All proposals appear to be unique based on title, sector, and geography analysis.</p></AICard>
          : groups.map((g, gi) => (
            <AICard key={gi} icon="⚠️" title={`Duplicate Cluster ${gi+1}`} badge="Review Required" badgeColor={C2.red}>
              {g.map(p => (
                <div key={p.id} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:'8px 10px', marginBottom:6 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{p.title}</div>
                  <div style={{ fontSize:12, color:C2.muted }}>{p.activity} · {p.target_states} · ₹{Number(p.budget||0).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </AICard>
          ))
        }
      </>;
    }

    if (sub === 'ai-budget') {
      const projBudgets = projs.map(p => {
        const budget = Number(p.budget||0);
        const benes_count = benes.filter(b=>b.project_id===p.id).length;
        const perHead = benes_count>0 ? Math.round(budget/benes_count) : 0;
        const anomalies = [];
        if (budget > 5000000) anomalies.push('Budget exceeds ₹50L threshold');
        if (perHead > 100000) anomalies.push(`High per-beneficiary cost: ₹${perHead.toLocaleString('en-IN')}`);
        if (budget > 0 && !p.own_contribution) anomalies.push('No co-contribution declared');
        if (p.other_sources && Number(p.other_sources||0) + budget > budget*1.5) anomalies.push('Other sources exceed 50% of CSR budget');
        return { ...p, budget, benes_count, perHead, anomalies };
      });
      return <>
        <Bc parts={['AI Components','Budget Anomaly Detection']} />
        <SectionHead title="💸 Budget Anomaly Detection" />
        <AICard icon="🤖" title="Detection Rules" badge="4 Rules Active">
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Analyzes each project budget for: unusually high total amounts, high per-beneficiary costs (above ₹1L), missing co-contributions, and disproportionate third-party funding ratios.</p>
        </AICard>
        {projBudgets.map(p => (
          <AICard key={p.id} icon={p.anomalies.length>0?'⚠️':'✅'} title={p.title||'Untitled'} badge={p.anomalies.length>0?`${p.anomalies.length} Anomal${p.anomalies.length>1?'ies':'y'}`:'Normal'} badgeColor={p.anomalies.length>0?C2.red:C2.green}>
            <InfoRow label="Total Budget" value={`₹${p.budget.toLocaleString('en-IN')}`} />
            <InfoRow label="Beneficiaries" value={p.benes_count} />
            <InfoRow label="Per-Beneficiary Cost" value={p.benes_count>0?`₹${p.perHead.toLocaleString('en-IN')}`:'N/A'} color={p.perHead>100000?C2.red:C2.green} />
            {p.anomalies.length>0 && <div style={{ marginTop:8 }}>{p.anomalies.map((a,i)=>(
              <div key={i} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:4, padding:'4px 8px', fontSize:12, color:'#dc2626', marginBottom:4 }}>⚠ {a}</div>
            ))}</div>}
          </AICard>
        ))}
        {projs.length===0 && <div style={{ color:C2.muted, padding:20 }}>No projects to analyse yet.</div>}
      </>;
    }

    if (sub === 'ai-ngo-risk') {
      const tps = trainingPartners || [];
      const scored = tps.map(tp => {
        let risk = 0;
        if (!tp.nsdc_reg) risk += 30;
        if (!tp.contact_person) risk += 15;
        if (!tp.email) risk += 10;
        if (Number(tp.num_trainers||0) < 5) risk += 20;
        if (Number(tp.max_batch_size||0) > 100) risk += 15;
        const label = risk>=50?'High':risk>=25?'Medium':'Low';
        const color = risk>=50?C2.red:risk>=25?C2.gold:C2.green;
        return { ...tp, risk, label, color };
      });
      return <>
        <Bc parts={['AI Components','NGO Risk Assessment']} />
        <SectionHead title="🏢 NGO Risk Assessment" />
        <AICard icon="🤖" title="Risk Factors" badge={`${scored.length} Partners`}>
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Partners are scored on NSDC registration status, contact completeness, trainer capacity, and batch size limits. Risk bands: Low (0–24), Medium (25–49), High (50+).</p>
        </AICard>
        {scored.length===0 ? <div style={{ color:C2.muted, padding:20 }}>No training partners added yet.</div>
          : scored.map(tp=>(
          <AICard key={tp.id} icon="🏢" title={tp.org_name||'Partner'} badge={`${tp.label} Risk`} badgeColor={tp.color}>
            <ScoreBar label="Risk Score" score={tp.risk} color={tp.color} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px', marginTop:6 }}>
              <InfoRow label="NSDC Reg" value={tp.nsdc_reg||'Not provided'} color={tp.nsdc_reg?C2.green:C2.red} />
              <InfoRow label="Trainers" value={tp.num_trainers||0} color={Number(tp.num_trainers||0)<5?C2.red:C2.green} />
              <InfoRow label="Contact" value={tp.contact_person||'Missing'} color={tp.contact_person?C2.green:C2.red} />
              <InfoRow label="Max Batch" value={tp.max_batch_size||0} />
            </div>
          </AICard>
        ))}
      </>;
    }

    if (sub === 'ai-recommend') {
      const topSectors = ['Skill Development','Education','Health','Women Empowerment','Livelihood'];
      const topStates = ['Maharashtra','Uttar Pradesh','Rajasthan','Odisha','Jharkhand'];
      const usedSectors = [...new Set(projs.map(p=>p.activity).filter(Boolean))];
      const usedStates = [...new Set(projs.map(p=>p.target_states).filter(Boolean).flatMap(s=>s.split(',')))];
      const recommendations = [];
      topSectors.filter(s=>!usedSectors.includes(s)).slice(0,3).forEach(s=>{
        recommendations.push({ type:'Sector Gap', text:`Your portfolio lacks projects in "${s}" — a high-impact Schedule VII activity.`, priority:'High' });
      });
      topStates.filter(s=>!usedStates.some(u=>u.trim()===s)).slice(0,2).forEach(s=>{
        recommendations.push({ type:'Geography Gap', text:`Consider expanding to ${s}, a high-need state with low CSR penetration.`, priority:'Medium' });
      });
      if (utilPct < 50) recommendations.push({ type:'Utilization', text:`Only ${utilPct}% of CSR budget utilised. Accelerate disbursements to avoid unspent fund penalties.`, priority:'High' });
      if (benes.length === 0) recommendations.push({ type:'Beneficiaries', text:'No beneficiaries registered. Start enrolling beneficiaries to activate impact tracking.', priority:'High' });
      if ((trainingPartners||[]).length === 0) recommendations.push({ type:'Partners', text:'No training partners empanelled. Add at least one implementation partner to deliver training.', priority:'High' });
      return <>
        <Bc parts={['AI Components','CSR Recommendation Engine']} />
        <SectionHead title="💡 CSR Recommendation Engine" />
        <AICard icon="🤖" title="Personalised for Your Portfolio" badge={`${recommendations.length} Suggestions`}>
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Recommendations are generated from your active projects, sector coverage, geographic spread, and fund utilization — compared against national CSR benchmarks.</p>
        </AICard>
        {recommendations.length===0
          ? <AICard icon="🌟" title="Portfolio looks strong!" badge="Optimal" badgeColor={C2.green}><p style={{ fontSize:13, color:C2.muted, margin:0 }}>Your CSR programme covers diverse sectors, states, and maintains good utilization. Keep it up!</p></AICard>
          : recommendations.map((r,i)=>(
          <AICard key={i} icon={r.priority==='High'?'🔴':'🟡'} title={r.type} badge={r.priority+' Priority'} badgeColor={r.priority==='High'?C2.red:C2.gold}>
            <p style={{ fontSize:13, color:'#374151', margin:0 }}>{r.text}</p>
          </AICard>
        ))}
      </>;
    }

    if (sub === 'ai-fraud') {
      const flagged = benes.map(b => {
        const flags = [];
        const dupeAadhaar = benes.filter(x=>x.id!==b.id && x.aadhaar && x.aadhaar===b.aadhaar);
        if (dupeAadhaar.length>0) flags.push('Duplicate Aadhaar detected');
        const dupeMobile = benes.filter(x=>x.id!==b.id && x.mobile && x.mobile===b.mobile);
        if (dupeMobile.length>0) flags.push('Duplicate mobile number');
        if (b.training_status==='certified' && b.placement_status==='placed' && !b.enrollment_date) flags.push('Certified without enrollment date');
        if (b.dob && new Date().getFullYear()-new Date(b.dob).getFullYear()<15) flags.push('Beneficiary appears under age');
        return { ...b, flags };
      });
      const suspicious = flagged.filter(b=>b.flags.length>0);
      return <>
        <Bc parts={['AI Components','Beneficiary Fraud Detection']} />
        <SectionHead title="🛡️ Beneficiary Fraud Detection" />
        <AICard icon="🤖" title="Detection Checks" badge={`${suspicious.length} Flagged`} badgeColor={suspicious.length>0?C2.red:C2.green}>
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Scans for: duplicate Aadhaar, duplicate mobile numbers, certified status without enrollment, and age anomalies. Flagged records should be manually verified before disbursal.</p>
        </AICard>
        {suspicious.length===0
          ? <AICard icon="✅" title="No Suspicious Records" badge="Clean" badgeColor={C2.green}><p style={{ fontSize:13, color:C2.muted, margin:0 }}>All {benes.length} beneficiary records passed fraud checks.</p></AICard>
          : suspicious.map(b=>(
          <AICard key={b.id} icon="⚠️" title={b.full_name||`BNF-${b.id}`} badge={`${b.flags.length} Flag${b.flags.length>1?'s':''}`} badgeColor={C2.red}>
            <InfoRow label="Aadhaar" value={b.aadhaar ? b.aadhaar.replace(/\d(?=\d{4})/g,'*') : 'Not provided'} />
            <InfoRow label="Status" value={b.training_status||'—'} />
            <div style={{ marginTop:8 }}>{b.flags.map((f,i)=>(
              <div key={i} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:4, padding:'4px 8px', fontSize:12, color:'#dc2626', marginBottom:4 }}>⚠ {f}</div>
            ))}</div>
          </AICard>
        ))}
      </>;
    }

    if (sub === 'ai-predict') {
      const monthsElapsed = (() => {
        const start = projs.map(p=>p.start_date).filter(Boolean).sort()[0];
        if (!start) return 1;
        return Math.max(1, Math.round((new Date()-new Date(start))/2592000000));
      })();
      const monthlyBurn = monthsElapsed > 0 ? totalSpent / monthsElapsed : 0;
      const remaining = totalBudget - totalSpent;
      const monthsToExhaust = monthlyBurn > 0 ? Math.round(remaining / monthlyBurn) : null;
      const projectedEndUtil = monthlyBurn > 0 && projs.some(p=>p.end_date) ? (() => {
        const latestEnd = projs.map(p=>p.end_date).filter(Boolean).sort().reverse()[0];
        const monthsLeft = Math.max(0, Math.round((new Date(latestEnd)-new Date())/2592000000));
        return Math.min(100, Math.round(((totalSpent + monthlyBurn*monthsLeft)/totalBudget)*100));
      })() : null;
      return <>
        <Bc parts={['AI Components','Predictive Budget Utilization']} />
        <SectionHead title="📈 Predictive Budget Utilization" />
        <AICard icon="🤖" title="Burn Rate Model" badge="Linear Projection">
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Projects monthly spending from historical disbursements and estimates remaining runway and projected end-of-project utilization.</p>
        </AICard>
        <AICard icon="💰" title="Utilization Forecast">
          <InfoRow label="Total Budget" value={`₹${totalBudget.toLocaleString('en-IN')}`} />
          <InfoRow label="Spent So Far" value={`₹${totalSpent.toLocaleString('en-IN')}`} />
          <InfoRow label="Remaining" value={`₹${remaining.toLocaleString('en-IN')}`} />
          <InfoRow label="Current Utilization" value={`${utilPct}%`} color={utilPct>=75?C2.green:utilPct>=40?C2.gold:C2.red} />
          <InfoRow label="Avg Monthly Burn" value={monthlyBurn>0?`₹${Math.round(monthlyBurn).toLocaleString('en-IN')}`:'No data'} />
          <InfoRow label="Months to Exhaust" value={monthsToExhaust!=null?`~${monthsToExhaust} months`:'N/A'} />
          {projectedEndUtil!=null && <InfoRow label="Projected End Utilization" value={`${projectedEndUtil}%`} color={projectedEndUtil>=80?C2.green:C2.gold} />}
        </AICard>
        <AICard icon="⚡" title="AI Recommendation" badge={utilPct<50?'Action Needed':'On Track'} badgeColor={utilPct<50?C2.red:C2.green}>
          <p style={{ fontSize:13, color:'#374151', margin:0 }}>
            {utilPct < 30 && 'Utilization is critically low. Accelerate disbursements or risk MCA penalties for unspent funds.'}
            {utilPct >= 30 && utilPct < 60 && 'Utilization is below optimal. Consider increasing disbursement frequency to stay on track.'}
            {utilPct >= 60 && utilPct < 80 && 'Utilization is progressing well. Monitor monthly to ensure year-end compliance.'}
            {utilPct >= 80 && 'Excellent utilization rate. Ensure remaining funds are linked to approved projects.'}
          </p>
        </AICard>
      </>;
    }

    if (sub === 'ai-forecast') {
      const activeProjs = projs.filter(p=>p.status==='active');
      const forecastCert = Math.round(benes.length * (certRate/100 + (certRate<80?0.1:0.02)));
      const forecastPlaced = Math.round(forecastCert * Math.max(0.3, placedRate/100 + 0.05));
      const projectedImpact = Math.min(100, Math.round((forecastPlaced/Math.max(1,benes.length))*100*1.2));
      return <>
        <Bc parts={['AI Components','Impact Forecasting']} />
        <SectionHead title="🔮 Impact Forecasting" />
        <AICard icon="🤖" title="Forecast Model" badge="AI Projection">
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Uses current certification and placement trajectories, with a 5–10% improvement factor for in-progress cohorts, to project end-of-programme outcomes for active beneficiaries.</p>
        </AICard>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
          {[
            { label:'Forecast Certified', val:forecastCert, curr:benes.filter(b=>b.training_status==='certified').length, color:C2.accent },
            { label:'Forecast Placed', val:forecastPlaced, curr:benes.filter(b=>b.placement_status==='placed').length, color:C2.green },
            { label:'Projected Impact Score', val:`${projectedImpact}%`, curr:`${utilPct}%`, color:C2.gold },
          ].map(k=>(
            <div key={k.label} style={{ background:C2.accentSoft, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.val}</div>
              <div style={{ fontSize:11, color:C2.muted, marginTop:2 }}>{k.label}</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>Current: {k.curr}</div>
            </div>
          ))}
        </div>
        <AICard icon="📊" title="Project-level Forecast">
          {activeProjs.length===0 ? <div style={{ color:C2.muted, fontSize:13 }}>No active projects to forecast.</div>
            : activeProjs.map(p=>{
            const pb = benes.filter(b=>b.project_id===p.id).length;
            const fc = Math.round(pb * Math.max(0.6, certRate/100+0.1));
            const fp = Math.round(fc * Math.max(0.3, placedRate/100+0.05));
            return (
              <div key={p.id} style={{ borderBottom:'1px solid #f1f5f9', paddingBottom:8, marginBottom:8 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{p.title}</div>
                <div style={{ display:'flex', gap:16, fontSize:12, color:C2.muted }}>
                  <span>Enrolled: <b style={{ color:C2.navy }}>{pb}</b></span>
                  <span>→ Cert: <b style={{ color:C2.accent }}>{fc}</b></span>
                  <span>→ Placed: <b style={{ color:C2.green }}>{fp}</b></span>
                </div>
              </div>
            );
          })}
        </AICard>
      </>;
    }

    if (sub === 'ai-sentiment') {
      const reports = projs.map(p => {
        const text = [p.objectives||'', p.title||''].join(' ').toLowerCase();
        const positiveWords = ['excellent','success','achieved','good','completed','trained','placed','improved','empowered','skills'];
        const negativeWords = ['delay','challenge','issue','problem','deficit','failure','pending','incomplete','gap','concern'];
        const posCount = positiveWords.filter(w=>text.includes(w)).length;
        const negCount = negativeWords.filter(w=>text.includes(w)).length;
        const score = 50 + (posCount-negCount)*10;
        const sentiment = score>=65?'Positive':score>=45?'Neutral':'Negative';
        const color = score>=65?C2.green:score>=45?C2.gold:C2.red;
        return { ...p, score: Math.min(100,Math.max(0,score)), sentiment, color, posCount, negCount };
      });
      const avgSentiment = reports.length>0 ? Math.round(reports.reduce((s,r)=>s+r.score,0)/reports.length) : 50;
      return <>
        <Bc parts={['AI Components','Sentiment Analysis']} />
        <SectionHead title="💬 Sentiment Analysis of Project Reports" />
        <AICard icon="🤖" title="NLP Sentiment Engine" badge={`Avg: ${avgSentiment}/100`} badgeColor={avgSentiment>=65?C2.green:avgSentiment>=45?C2.gold:C2.red}>
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>Analyses project objectives and titles for positive and negative sentiment markers using keyword-based NLP. Helps flag projects that may be under stress or facing challenges.</p>
        </AICard>
        {reports.length===0 ? <div style={{ color:C2.muted, padding:20 }}>No project text to analyse.</div>
          : reports.map(r=>(
          <AICard key={r.id} icon={r.sentiment==='Positive'?'😊':r.sentiment==='Neutral'?'😐':'😟'} title={r.title||'Untitled'} badge={r.sentiment} badgeColor={r.color}>
            <ScoreBar label="Sentiment Score" score={r.score} color={r.color} />
            <div style={{ display:'flex', gap:16, fontSize:12, marginTop:6 }}>
              <span style={{ color:C2.green }}>✅ {r.posCount} positive signals</span>
              <span style={{ color:C2.red }}>⚠ {r.negCount} concern signals</span>
            </div>
          </AICard>
        ))}
      </>;
    }

    if (sub === 'ai-summary') {
      const fyStart = new Date().getMonth()>=3 ? new Date().getFullYear() : new Date().getFullYear()-1;
      const summaryData = {
        org: stats.org_name || user?.org_name || 'Your Organisation',
        fy: `FY ${fyStart}–${(fyStart+1).toString().slice(2)}`,
        obligation: totalBudget,
        spent: totalSpent,
        utilPct,
        projects: projs.length,
        active: projs.filter(p=>p.status==='active').length,
        benes: benes.length,
        certified: benes.filter(b=>b.training_status==='certified').length,
        placed: benes.filter(b=>b.placement_status==='placed').length,
        certRate, placedRate,
        partners: (trainingPartners||[]).length,
        sectors: [...new Set(projs.map(p=>p.activity).filter(Boolean))],
        states: [...new Set(projs.map(p=>p.target_states).filter(Boolean))],
      };
      const execSummary = `${summaryData.org} CSR Programme — ${summaryData.fy} Executive Summary

FINANCIAL OVERVIEW
During ${summaryData.fy}, the organisation committed a total CSR budget of ₹${(summaryData.obligation/100000).toFixed(1)}L under the mandate of the Companies Act, 2013. As of the reporting date, ₹${(summaryData.spent/100000).toFixed(1)}L has been disbursed, representing a utilization rate of ${summaryData.utilPct}%.${summaryData.utilPct<80?' Efforts are underway to accelerate remaining disbursements before the financial year close.':' The programme is on track for full utilization.'}

PROGRAMME SCOPE
A total of ${summaryData.projects} CSR project${summaryData.projects!==1?'s':''} ${summaryData.projects===1?'has':'have'} been registered under the programme, of which ${summaryData.active} ${summaryData.active===1?'is':'are'} currently active. Implementation is being carried out across ${summaryData.states.length||'—'} state${summaryData.states.length!==1?'s':''} in partnership with ${summaryData.partners} empanelled training partner${summaryData.partners!==1?'s':''}.

BENEFICIARY IMPACT
The programme has enrolled ${summaryData.benes} beneficiar${summaryData.benes!==1?'ies':'y'} to date. Of these, ${summaryData.certified} (${summaryData.certRate}%) have successfully completed training and received certification. Employment outcomes stand at ${summaryData.placed} placements, reflecting a placement rate of ${summaryData.placedRate}% among certified learners.

SECTOR FOCUS
CSR activities span the following sectors: ${summaryData.sectors.length>0?summaryData.sectors.join(', '):'Not yet classified'}. All activities are aligned with Schedule VII of the Companies Act, 2013.

COMPLIANCE STATUS
The organisation is ${summaryData.utilPct>=75?'well on track':'actively working'} toward meeting its statutory obligations for ${summaryData.fy}. Form CSR-2 submission is due by 30 September ${fyStart+1}.`;

      return <>
        <Bc parts={['AI Components','AI Executive Summaries']} />
        <SectionHead title="📄 AI-Generated Executive Summary" />
        <AICard icon="🤖" title="Auto-Generated from Live Data" badge="AI Generated">
          <p style={{ fontSize:13, color:C2.muted, margin:0 }}>This executive summary is generated in real-time from your CSR programme data — projects, disbursements, beneficiaries, and partners. You can copy and use it in board reports or CSR-2 filings.</p>
        </AICard>
        <div style={{ background:'#fff', borderRadius:10, padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #e8ecf3', fontFamily:'Georgia, serif' }}>
          <pre style={{ whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.8, color:'#1e293b', margin:0, fontFamily:'inherit' }}>{execSummary}</pre>
        </div>
        <div style={{ marginTop:10, display:'flex', gap:8 }}>
          <button onClick={()=>{navigator.clipboard.writeText(execSummary);}} style={{ background:C2.accent, color:'#fff', border:'none', borderRadius:6, padding:'8px 16px', fontSize:13, cursor:'pointer', fontWeight:600 }}>📋 Copy to Clipboard</button>
        </div>
      </>;
    }

    return <div style={{ color:C2.muted, padding:20 }}>Select an AI feature from the menu.</div>;
  }

  // ── CSR Campaigns panels ───────────────────────────────────────────────────
  function PanelCampaigns({ sub }) {
    const THEMES = ['Skill Development','Digital Literacy','Healthcare','Women Empowerment','Rural Development','Green Environment','Education','Livelihood'];
    const STATES = ['Andhra Pradesh','Bihar','Gujarat','Haryana','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal'];
    const FYS = ['2024-25','2025-26','2026-27'];
    const cf = campForm;
    const setCf = v => setCampForm(p => ({ ...p, ...v }));

    const APPROVAL_STAGES = ['Document Verification','Technical Review','Finance Review','Board Approval','Fund Released'];
    const stageColor = s => s==='approved'?C.green:s==='rejected'?C.red:s==='pending'?C.gold:'#94a3b8';
    const stageBg   = s => s==='approved'?C.pGreen:s==='rejected'?C.pRed:s==='pending'?C.pGold:'#f8fafc';

    const statusBadge = (s) => {
      const map = { draft:['#64748b','#f1f5f9'], published:[C.teal,C.pTeal], closed:[C.red,C.pRed], submitted:[C.blue,C.pBlue], shortlisted:[C.green,C.pGreen], rejected:[C.red,C.pRed], approved:[C.green,C.pGreen], acknowledged:[C.green,C.pGreen], scheduled:[C.gold,C.pGold], completed:[C.green,C.pGreen] };
      const [fg,bg] = map[s] || ['#475569','#f1f5f9'];
      return <span style={{ background:bg, color:fg, borderRadius:10, padding:'2px 9px', fontSize:11, fontWeight:700 }}>{s}</span>;
    };

    if (sub === 'camp-create') {
      const handleSave = async (status) => {
        if (!cf.title.trim()) { setCampMsg('❌ Campaign title is required.'); return; }
        if (cf.total_budget && (isNaN(Number(cf.total_budget)) || Number(cf.total_budget) <= 0)) { setCampMsg('❌ Total budget must be a positive number.'); return; }
        if (cf.open_date && cf.close_date && cf.close_date < cf.open_date) { setCampMsg('❌ Close date must be after the open date.'); return; }
        setCampSaving(true); setCampMsg('');
        try {
          await api.csrCreateCampaign({ ...cf, status });
          setCampMsg('✅ Campaign ' + (status==='published'?'published':'saved as draft') + ' successfully!');
          setCampForm({ title:'', theme:'Skill Development', description:'', total_budget:'', financial_year:'2025-26', target_states:'', open_date:'', close_date:'', eligibility_criteria:'', status:'draft' });
          loadCampaigns();
        } catch(e) { setCampMsg('❌ ' + (e.message||'Save failed.')); }
        finally { setCampSaving(false); }
      };
      return <>
        <Bc parts={['CSR Campaigns','Create Campaign']} />
        <SectionHead title="🚀 Create CSR Campaign" />
        {campMsg && <Alert icon={campMsg.startsWith('✅')?'✅':'❌'} type={campMsg.startsWith('✅')?'success':'red'}>{campMsg}</Alert>}
        <Card>
          <CardTitle>📋 Campaign Details</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Campaign Title *"><Inp value={cf.title} onChange={v=>setCf({title:v})} placeholder="e.g. Skill India FY 2025-26" /></Field>
            <Field label="Theme / Sector"><Sel value={cf.theme} onChange={v=>setCf({theme:v})} options={THEMES} /></Field>
            <Field label="Financial Year"><Sel value={cf.financial_year} onChange={v=>setCf({financial_year:v})} options={FYS} /></Field>
            <Field label="Total Budget (₹)"><Inp value={cf.total_budget} onChange={v=>setCf({total_budget:v})} placeholder="e.g. 15000000" /></Field>
            <Field label="Application Open Date"><Inp type="date" value={cf.open_date} onChange={v=>setCf({open_date:v})} /></Field>
            <Field label="Application Close Date"><Inp type="date" value={cf.close_date} onChange={v=>setCf({close_date:v})} /></Field>
          </div>
          <Field label="Target States" style={{ marginTop:8 }}><Inp value={cf.target_states} onChange={v=>setCf({target_states:v})} placeholder="e.g. Maharashtra, Odisha, Bihar" /></Field>
          <Field label="Campaign Description" style={{ marginTop:8 }}><textarea value={cf.description} onChange={e=>setCf({description:e.target.value})} rows={3} placeholder="Describe the CSR programme objectives, expected outcomes..." style={{ width:'100%', borderRadius:6, border:'1px solid #d1d5db', padding:'7px 9px', fontSize:13, resize:'vertical' }} /></Field>
          <Field label="Eligibility Criteria" style={{ marginTop:8 }}><textarea value={cf.eligibility_criteria} onChange={e=>setCf({eligibility_criteria:e.target.value})} rows={2} placeholder="e.g. Registered NGO with 3+ years experience, valid 12A & 80G..." style={{ width:'100%', borderRadius:6, border:'1px solid #d1d5db', padding:'7px 9px', fontSize:13, resize:'vertical' }} /></Field>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <Btn onClick={()=>handleSave('draft')} outline disabled={campSaving}>💾 Save Draft</Btn>
            <Btn onClick={()=>handleSave('published')} green disabled={campSaving}>📢 Publish Opportunity</Btn>
          </div>
        </Card>
      </>;
    }

    if (sub === 'camp-list') {
      return <>
        <Bc parts={['CSR Campaigns','My Campaigns']} />
        <SectionHead title="🗂️ My CSR Campaigns" />
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
          <Btn green onClick={()=>go('camp-create')}>+ Create Campaign</Btn>
        </div>
        {campaigns.length === 0
          ? <Alert icon="ℹ️" type="info">No campaigns yet. <span style={{ cursor:'pointer', color:C.blue, fontWeight:600 }} onClick={()=>go('camp-create')}>Create your first campaign →</span></Alert>
          : campaigns.map(c => (
            <Card key={c.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>{c.title}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{c.theme} · {c.financial_year} · {c.target_states||'—'}</div>
                  {c.open_date && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Open: {c.open_date} → {c.close_date||'—'}</div>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {statusBadge(c.status)}
                  <span style={{ fontWeight:700, color:C.green, fontSize:13 }}>₹{(Number(c.total_budget||0)/100000).toFixed(1)}L</span>
                </div>
              </div>
              {c.description && <div style={{ fontSize:12, color:'#475569', marginTop:8, borderTop:'1px solid #f1f5f9', paddingTop:8 }}>{c.description}</div>}
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                {c.status==='draft' && <Btn sm green onClick={async()=>{ await api.csrUpdateCampaign(c.id,{...c,status:'published'}); loadCampaigns(); }}>📢 Publish</Btn>}
                {c.status==='published' && <Btn sm outline onClick={async()=>{ await api.csrUpdateCampaign(c.id,{...c,status:'closed'}); loadCampaigns(); }}>🔒 Close</Btn>}
                <Btn sm outline onClick={()=>go('camp-applications')}>👁 View Proposals ({applications.filter(a=>a.campaign_id===c.id).length})</Btn>
              </div>
            </Card>
          ))
        }
      </>;
    }

    if (sub === 'camp-applications') {
      const af = appForm;
      const setAf = v => setAppForm(p=>({...p,...v}));
      const publishedCamps = campaigns.filter(c=>c.status==='published');

      const handleSubmitApp = async () => {
        if (!af.campaign_id||!af.org_name) { setAppMsg('❌ Campaign and organisation name are required.'); return; }
        setAppSaving(true); setAppMsg('');
        try {
          await api.csrCreateApplication(af);
          setAppMsg('✅ Application submitted successfully!');
          setAppForm({ campaign_id:'', org_name:'', reg_no:'', contact_person:'', email:'', phone:'', proposed_budget:'', project_title:'', proposal_summary:'', target_beneficiaries:'', target_states:'' });
          loadApplications();
        } catch(e) { setAppMsg('❌ ' + (e.message||'Submit failed.')); }
        finally { setAppSaving(false); }
      };

      const handleStatusChange = async (id, status, reason='') => {
        try { await api.csrUpdateApplicationStatus(id, { status, rejection_reason: reason }); loadApplications(); }
        catch(e) { showToast('Update failed: ' + (e.message||'Try again.')); }
      };

      const aiColor = s => s>=75?C.green:s>=55?C.gold:C.red;

      return <>
        <Bc parts={['CSR Campaigns','Received Proposals']} />
        <SectionHead title="📥 Received Proposals" />

        {publishedCamps.length > 0 && <Card style={{ marginBottom:12 }}>
          <CardTitle>➕ Add NGO Application</CardTitle>
          {appMsg && <Alert icon={appMsg.startsWith('✅')?'✅':'❌'} type={appMsg.startsWith('✅')?'success':'red'}>{appMsg}</Alert>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Field label="Campaign *"><Sel value={af.campaign_id} onChange={v=>setAf({campaign_id:v})} options={['', ...publishedCamps.map(c=>c.id)]} labels={['Select...', ...publishedCamps.map(c=>c.title)]} /></Field>
            <Field label="NGO / Org Name *"><Inp value={af.org_name} onChange={v=>setAf({org_name:v})} placeholder="Organisation name" /></Field>
            <Field label="Registration No."><Inp value={af.reg_no} onChange={v=>setAf({reg_no:v})} placeholder="12A / 80G / Reg No." /></Field>
            <Field label="Contact Person"><Inp value={af.contact_person} onChange={v=>setAf({contact_person:v})} placeholder="Name" /></Field>
            <Field label="Email"><Inp value={af.email} onChange={v=>setAf({email:v})} placeholder="contact@ngo.org" /></Field>
            <Field label="Phone"><Inp value={af.phone} onChange={v=>setAf({phone:v})} placeholder="+91 " /></Field>
            <Field label="Proposed Budget (₹)"><Inp value={af.proposed_budget} onChange={v=>setAf({proposed_budget:v})} placeholder="Amount" /></Field>
            <Field label="Target Beneficiaries"><Inp value={af.target_beneficiaries} onChange={v=>setAf({target_beneficiaries:v})} placeholder="Count" /></Field>
            <Field label="Project Title"><Inp value={af.project_title} onChange={v=>setAf({project_title:v})} placeholder="Proposed project name" /></Field>
            <Field label="Target States"><Inp value={af.target_states} onChange={v=>setAf({target_states:v})} placeholder="States" /></Field>
          </div>
          <Field label="Proposal Summary" style={{ marginTop:6 }}><textarea value={af.proposal_summary} onChange={e=>setAf({proposal_summary:e.target.value})} rows={2} placeholder="Brief description of the proposed project..." style={{ width:'100%', borderRadius:6, border:'1px solid #d1d5db', padding:'7px 9px', fontSize:13, resize:'vertical' }} /></Field>
          <div style={{ marginTop:10 }}><Btn green onClick={handleSubmitApp} disabled={appSaving}>📨 Submit Application</Btn></div>
        </Card>}

        {applications.length === 0
          ? <Alert icon="ℹ️" type="info">No proposals received yet. Publish a campaign to start receiving applications.</Alert>
          : applications.map(a => (
            <Card key={a.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>{a.org_name}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{a.project_title||'—'} · {a.campaign_title||'—'}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>Reg: {a.reg_no||'—'} · {a.contact_person||'—'} · {a.email||'—'}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  {statusBadge(a.status)}
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:10, color:'#64748b' }}>AI Score:</span>
                    <span style={{ fontWeight:800, fontSize:13, color:aiColor(a.ai_score||0), cursor:'pointer' }} onClick={()=>go('ai-proposal')} title="View AI Proposal Scoring">
                      {a.ai_score||0}/100 🤖
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:16, fontSize:12, color:'#64748b', marginTop:6 }}>
                <span>Budget: <b style={{ color:C.navy }}>₹{(Number(a.proposed_budget||0)/100000).toFixed(1)}L</b></span>
                <span>Beneficiaries: <b style={{ color:C.navy }}>{a.target_beneficiaries||0}</b></span>
                <span>States: <b style={{ color:C.navy }}>{a.target_states||'—'}</b></span>
              </div>
              {a.proposal_summary && <div style={{ fontSize:12, color:'#475569', marginTop:6, borderTop:'1px solid #f1f5f9', paddingTop:6 }}>{a.proposal_summary}</div>}
              {a.status === 'submitted' && <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <Btn sm green onClick={()=>handleStatusChange(a.id,'shortlisted')}>✅ Shortlist</Btn>
                <Btn sm teal onClick={()=>go('camp-approval')}>⚖️ Send to Committee</Btn>
                <Btn sm danger onClick={()=>{ const r=prompt('Rejection reason:'); if(r) handleStatusChange(a.id,'rejected',r); }}>❌ Reject</Btn>
              </div>}
              {a.status === 'shortlisted' && <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <Btn sm teal onClick={()=>go('camp-approval')}>⚖️ Start Approval Workflow</Btn>
              </div>}
            </Card>
          ))
        }
      </>;
    }

    if (sub === 'camp-approval') {
      const STAGES = ['Document Verification','Technical Review','Finance Review','Board Approval','Fund Released'];
      const shortlisted = applications.filter(a=>['shortlisted','approved'].includes(a.status));

      const handleDecision = async (appId, stage, decision, remarks) => {
        try {
          await api.csrCreateApproval({ application_id: appId, stage, decision, remarks });
          if (stage === 'Fund Released' && decision === 'approved') {
            await api.csrUpdateApplicationStatus(appId, { status: 'approved' });
          }
          loadApplications();
        } catch(e) { showToast('Failed: ' + (e.message||'Try again.')); }
      };

      return <>
        <Bc parts={['CSR Campaigns','Approval Workflow']} />
        <SectionHead title="⚖️ Committee Approval Workflow" />
        <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
          {STAGES.map((s,i)=>(
            <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ background:'#eef2ff', border:'1.5px solid #c7d2fe', borderRadius:8, padding:'8px 12px', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'#4338ca', minWidth:120, textAlign:'center' }}>
                <div style={{ fontWeight:800, color:'#6366f1', fontSize:11 }}>Step {i+1}</div>
                {s}
              </div>
              {i < STAGES.length-1 && <span style={{ color:'#94a3b8', fontSize:18, fontWeight:700 }}>›</span>}
            </div>
          ))}
        </div>
        {shortlisted.length === 0
          ? <Alert icon="ℹ️" type="info">No shortlisted applications yet. Shortlist proposals from Received Proposals panel.</Alert>
          : shortlisted.map(a => (
            <Card key={a.id} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>{a.org_name}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{a.project_title} · ₹{(Number(a.proposed_budget||0)/100000).toFixed(1)}L · AI Score: <b style={{ color:a.ai_score>=70?C.green:C.gold }}>{a.ai_score}/100</b></div>
                </div>
                {statusBadge(a.status)}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {STAGES.map(stage => (
                  <div key={stage} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'8px 10px', minWidth:130, flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6 }}>{stage}</div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>{ const r=prompt(`Remarks for "${stage}":`)||''; handleDecision(a.id,stage,'approved',r); }}
                        style={{ background:C.pGreen, color:C.green, border:'none', borderRadius:4, padding:'3px 8px', fontSize:11, cursor:'pointer', fontWeight:600 }}>✓ Approve</button>
                      <button onClick={()=>{ const r=prompt(`Rejection reason for "${stage}":`)||''; handleDecision(a.id,stage,'rejected',r); }}
                        style={{ background:C.pRed, color:C.red, border:'none', borderRadius:4, padding:'3px 8px', fontSize:11, cursor:'pointer', fontWeight:600 }}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        }
      </>;
    }

    if (sub === 'camp-progress') {
      const pf = progForm;
      const setPf = v => setProgForm(p=>({...p,...v}));
      const activeProjs = projects.filter(p=>p.status==='active');

      const handleSubmitReport = async () => {
        if (!pf.project_id || !pf.report_month) { setProgMsg('❌ Project and report month are required.'); return; }
        setProgSaving(true); setProgMsg('');
        try {
          await api.csrCreateProgressReport(pf);
          setProgMsg('✅ Progress report submitted!');
          setProgForm({ project_id:'', report_month:'', bene_count:'', spend_amount:'', train_pct:'', issues:'', highlights:'' });
          loadProgressReports();
        } catch(e) { setProgMsg('❌ ' + (e.message||'Submit failed.')); }
        finally { setProgSaving(false); }
      };

      return <>
        <Bc parts={['CSR Campaigns','Progress Reports']} />
        <SectionHead title="📊 Monthly Progress Reports" />
        <Card style={{ marginBottom:12 }}>
          <CardTitle>📝 Submit Progress Report</CardTitle>
          {progMsg && <Alert icon={progMsg.startsWith('✅')?'✅':'❌'} type={progMsg.startsWith('✅')?'success':'red'}>{progMsg}</Alert>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Field label="Project *"><Sel value={pf.project_id} onChange={v=>setPf({project_id:v})} options={['', ...activeProjs.map(p=>p.id)]} labels={['Select project...', ...activeProjs.map(p=>p.title)]} /></Field>
            <Field label="Report Month *"><Inp type="month" value={pf.report_month} onChange={v=>setPf({report_month:v})} /></Field>
            <Field label="Beneficiaries Count"><Inp value={pf.bene_count} onChange={v=>setPf({bene_count:v})} placeholder="Number" /></Field>
            <Field label="Amount Spent (₹)"><Inp value={pf.spend_amount} onChange={v=>setPf({spend_amount:v})} placeholder="Amount" /></Field>
            <Field label="Training Completion (%)"><Inp value={pf.train_pct} onChange={v=>setPf({train_pct:v})} placeholder="0-100" /></Field>
          </div>
          <Field label="Key Highlights" style={{ marginTop:6 }}><textarea value={pf.highlights} onChange={e=>setPf({highlights:e.target.value})} rows={2} placeholder="Key achievements this month..." style={{ width:'100%', borderRadius:6, border:'1px solid #d1d5db', padding:'7px 9px', fontSize:13, resize:'vertical' }} /></Field>
          <Field label="Issues / Blockers" style={{ marginTop:6 }}><textarea value={pf.issues} onChange={e=>setPf({issues:e.target.value})} rows={2} placeholder="Any challenges or blockers..." style={{ width:'100%', borderRadius:6, border:'1px solid #d1d5db', padding:'7px 9px', fontSize:13, resize:'vertical' }} /></Field>
          <div style={{ marginTop:10, display:'flex', gap:10 }}>
            <Btn green onClick={handleSubmitReport} disabled={progSaving}>📤 Submit Report</Btn>
            {activeProjs.length === 0 && <Btn outline onClick={()=>go('proj-active')}>← View Active Projects</Btn>}
          </div>
        </Card>
        <SectionHead title="Past Reports" />
        {progressReports.length === 0
          ? <Alert icon="ℹ️" type="info">No progress reports submitted yet.</Alert>
          : progressReports.map(r => (
            <Card key={r.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{r.project_title||`Project #${r.project_id}`} · {r.report_month}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                    Beneficiaries: <b>{r.bene_count||0}</b> · Spent: <b>₹{(Number(r.spend_amount||0)/100000).toFixed(2)}L</b> · Training: <b>{r.train_pct||0}%</b>
                  </div>
                </div>
                {statusBadge(r.status)}
              </div>
              {r.highlights && <div style={{ fontSize:12, color:'#059669', marginTop:6 }}>✅ {r.highlights}</div>}
              {r.issues && <div style={{ fontSize:12, color:'#dc2626', marginTop:4 }}>⚠️ {r.issues}</div>}
              {r.status === 'submitted' && <div style={{ marginTop:8 }}>
                <Btn sm green onClick={async()=>{ await api.csrAcknowledgeReport(r.id); loadProgressReports(); }}>✅ Acknowledge</Btn>
              </div>}
            </Card>
          ))
        }
      </>;
    }

    return <div style={{ color:'#64748b', padding:20 }}>Select an option from the CSR Campaigns menu.</div>;
  }

  // ── Audit & Verification panels ────────────────────────────────────────────
  function PanelAudit({ sub }) {
    const af = auditForm;
    const setAf = v => setAuditForm(p=>({...p,...v}));
    const activeProjs = projects.filter(p=>p.status==='active');

    const statusBadge = (s) => {
      const map = { scheduled:[C.gold,C.pGold], 'in-progress':[C.blue,C.pBlue], completed:[C.green,C.pGreen] };
      const [fg,bg] = map[s]||['#64748b','#f1f5f9'];
      return <span style={{ background:bg, color:fg, borderRadius:10, padding:'2px 9px', fontSize:11, fontWeight:700 }}>{s}</span>;
    };

    const handleSaveAudit = async (isNew) => {
      if (!af.project_id) { setAuditFmMsg('❌ Project is required.'); return; }
      if (!af.visit_date) { setAuditFmMsg('❌ Visit date is required.'); return; }
      if (af.compliance_score && (isNaN(Number(af.compliance_score)) || Number(af.compliance_score) < 0 || Number(af.compliance_score) > 100)) { setAuditFmMsg('❌ Compliance score must be between 0 and 100.'); return; }
      setAuditFmSaving(true); setAuditFmMsg('');
      try {
        await api.csrCreateFieldAudit(af);
        setAuditFmMsg('✅ Audit ' + (af.status==='scheduled'?'scheduled':'saved') + ' successfully!');
        setAuditForm({ project_id:'', auditor_name:'', visit_date:'', location:'', bene_verified:'', funds_verified:'', compliance_score:'', findings:'', recommendations:'', status:'scheduled' });
        loadFieldAudits();
      } catch(e) { setAuditFmMsg('❌ ' + (e.message||'Save failed.')); }
      finally { setAuditFmSaving(false); }
    };

    if (sub === 'audit-new') {
      return <>
        <Bc parts={['Audit & Verification','Schedule Audit']} />
        <SectionHead title="🗓️ Schedule Field Audit" />
        {auditFmMsg && <Alert icon={auditFmMsg.startsWith('✅')?'✅':'❌'} type={auditFmMsg.startsWith('✅')?'success':'red'}>{auditFmMsg}</Alert>}
        <Card>
          <CardTitle>📋 Audit Details</CardTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Field label="Project *"><Sel value={af.project_id} onChange={v=>setAf({project_id:v})} options={['', ...activeProjs.map(p=>p.id)]} labels={['Select project...', ...activeProjs.map(p=>p.title)]} /></Field>
            <Field label="Auditor Name"><Inp value={af.auditor_name} onChange={v=>setAf({auditor_name:v})} placeholder="Name of auditor / firm" /></Field>
            <Field label="Visit Date"><Inp type="date" value={af.visit_date} onChange={v=>setAf({visit_date:v})} /></Field>
            <Field label="Location / Centre"><Inp value={af.location} onChange={v=>setAf({location:v})} placeholder="Village, District, State" /></Field>
            <Field label="Status"><Sel value={af.status} onChange={v=>setAf({status:v})} options={['scheduled','in-progress','completed']} /></Field>
            <Field label="Beneficiaries Verified"><Inp value={af.bene_verified} onChange={v=>setAf({bene_verified:v})} placeholder="Count" /></Field>
            <Field label="Funds Verified (₹)"><Inp value={af.funds_verified} onChange={v=>setAf({funds_verified:v})} placeholder="Amount" /></Field>
            <Field label="Compliance Score (0-100)"><Inp value={af.compliance_score} onChange={v=>setAf({compliance_score:v})} placeholder="0–100" /></Field>
          </div>
          <Field label="Findings" style={{ marginTop:6 }}><textarea value={af.findings} onChange={e=>setAf({findings:e.target.value})} rows={2} placeholder="Key observations during field visit..." style={{ width:'100%', borderRadius:6, border:'1px solid #d1d5db', padding:'7px 9px', fontSize:13, resize:'vertical' }} /></Field>
          <Field label="Recommendations" style={{ marginTop:6 }}><textarea value={af.recommendations} onChange={e=>setAf({recommendations:e.target.value})} rows={2} placeholder="Corrective actions recommended..." style={{ width:'100%', borderRadius:6, border:'1px solid #d1d5db', padding:'7px 9px', fontSize:13, resize:'vertical' }} /></Field>
          <div style={{ marginTop:10 }}><Btn green onClick={handleSaveAudit} disabled={auditFmSaving}>📅 Save Audit</Btn></div>
        </Card>
      </>;
    }

    // audit-list (default)
    return <>
      <Bc parts={['Audit & Verification','Field Audits']} />
      <SectionHead title="🔍 Field Audits" />
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
        <Btn green onClick={()=>go('audit-new')}>+ Schedule Audit</Btn>
      </div>
      {fieldAudits.length === 0
        ? <Alert icon="ℹ️" type="info">No field audits yet. <span style={{ cursor:'pointer', color:C.blue, fontWeight:600 }} onClick={()=>go('audit-new')}>Schedule one →</span> or <span style={{ cursor:'pointer', color:C.blue, fontWeight:600 }} onClick={()=>go('proj-active')}>view active projects →</span></Alert>
        : fieldAudits.map(a => (
          <Card key={a.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:C.navy }}>{a.project_title||`Project #${a.project_id}`}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Auditor: {a.auditor_name||'—'} · {a.visit_date||'—'} · {a.location||'—'}</div>
              </div>
              <div style={{ display:'flex', align:'center', gap:8 }}>
                {statusBadge(a.status)}
                {a.compliance_score > 0 && <span style={{ background:a.compliance_score>=75?C.pGreen:a.compliance_score>=50?C.pGold:C.pRed, color:a.compliance_score>=75?C.green:a.compliance_score>=50?C.gold:C.red, borderRadius:10, padding:'2px 9px', fontSize:11, fontWeight:700 }}>Score: {a.compliance_score}/100</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:16, fontSize:12, color:'#64748b', marginTop:6 }}>
              {a.bene_verified > 0 && <span>Beneficiaries verified: <b style={{ color:C.navy }}>{a.bene_verified}</b></span>}
              {a.funds_verified > 0 && <span>Funds verified: <b style={{ color:C.navy }}>₹{(Number(a.funds_verified)/100000).toFixed(2)}L</b></span>}
            </div>
            {a.findings && <div style={{ fontSize:12, color:'#374151', marginTop:6, borderTop:'1px solid #f1f5f9', paddingTop:6 }}>📋 <b>Findings:</b> {a.findings}</div>}
            {a.recommendations && <div style={{ fontSize:12, color:'#374151', marginTop:4 }}>💡 <b>Recommendations:</b> {a.recommendations}</div>}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              {a.status !== 'completed' && <Btn sm green onClick={async()=>{ await api.csrUpdateFieldAudit(a.id,{...a,status:'completed'}); loadFieldAudits(); }}>✅ Mark Completed</Btn>}
              <Btn sm outline onClick={()=>go('rep-impact')}>📊 View Impact Report</Btn>
              <Btn sm outline onClick={()=>go('comp-audit')}>📋 Audit Trail</Btn>
            </div>
          </Card>
        ))
      }
    </>;
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
      case 'camp-create':     return PanelCampaigns({ sub:'camp-create' });
      case 'camp-list':       return PanelCampaigns({ sub:'camp-list' });
      case 'camp-applications': return PanelCampaigns({ sub:'camp-applications' });
      case 'camp-approval':   return PanelCampaigns({ sub:'camp-approval' });
      case 'camp-progress':   return PanelCampaigns({ sub:'camp-progress' });
      case 'audit-list':      return PanelAudit({ sub:'audit-list' });
      case 'audit-new':       return PanelAudit({ sub:'audit-new' });
      case 'ai-proposal':     return PanelAI({ sub:'ai-proposal' });
      case 'ai-duplicate':    return PanelAI({ sub:'ai-duplicate' });
      case 'ai-budget':       return PanelAI({ sub:'ai-budget' });
      case 'ai-ngo-risk':     return PanelAI({ sub:'ai-ngo-risk' });
      case 'ai-recommend':    return PanelAI({ sub:'ai-recommend' });
      case 'ai-fraud':        return PanelAI({ sub:'ai-fraud' });
      case 'ai-predict':      return PanelAI({ sub:'ai-predict' });
      case 'ai-forecast':     return PanelAI({ sub:'ai-forecast' });
      case 'ai-sentiment':    return PanelAI({ sub:'ai-sentiment' });
      case 'ai-summary':      return PanelAI({ sub:'ai-summary' });
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
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:9999, background:C.navy, color:'#fff', padding:'10px 22px', borderRadius:10, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,.25)', display:'flex', gap:14, alignItems:'center', whiteSpace:'nowrap' }}>
          {toast}
          <button onClick={() => setToast('')} style={{ background:'none', border:'none', color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:16, lineHeight:1, padding:0 }}>✕</button>
        </div>
      )}

      {/* ── AI Chatbot floating widget ── */}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:10001, display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
        {chatOpen && (
          <div style={{ width:340, height:460, background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', border:'1px solid #E0E6EF', display:'flex', flexDirection:'column', marginBottom:10, overflow:'hidden' }}>
            <div style={{ background:C.navy, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#7B5CF6,#9B6FFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
                <div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>AI Assistant</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>SkillsnJobs · Always here</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
            </div>
            <div id="csr-chat-msgs" style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'82%', padding:'8px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.role === 'user' ? C.navy : '#F1F5F9',
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
              {['CSR-2 compliance','Unspent funds','Campaign tips','Project reporting'].map(s => (
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
                style={{ width:34, height:34, borderRadius:'50%', background:chatInput.trim() ? C.navy : '#E0E6EF', border:'none', cursor:'pointer',
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
