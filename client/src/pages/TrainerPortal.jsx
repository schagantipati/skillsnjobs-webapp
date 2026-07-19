import { validate as fieldValidate, UPPERCASE_FIELDS as UPPERCASE_TYPES, validatePassingYear, validateScore, validateMonthYear, validatePosInt, validatePositiveNum, validatePassingMarks, validateText } from '../utils/validators.js';
import { formatDate } from '../utils/date.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPreferences from '../components/AccountPreferences.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

/* ─── palette ─────────────────────────────────────────────────── */
const C = {
  navy:'#003366', blue:'#0057A8', bluePale:'#E8F0FB',
  teal:'#007B5E', tealPale:'#E6F4F1',
  green:'#28A745', greenPale:'#E8F5E9',
  gold:'#F4A900', goldPale:'#FEF8E7',
  red:'#DC2626', redPale:'#FEE2E2',
  purple:'#7C3AED', purplePale:'#EDE9FE',
  sidebar:'#010E3C',
  surface:'#F4F6F9', card:'#FFFFFF',
  border:'#E0E6EF', ink:'#1A2B4A', ink2:'#3D5170', ink3:'#6B7FA3',
};
const SW = 220;
const TH = 58;
const SECTORS = ['Retail','IT / ITeS','BFSI','Healthcare','Construction','Logistics','Tourism & Hospitality','Agriculture','Automotive','Beauty & Wellness','Electronics','Textile & Apparel','Media & Entertainment','Telecom','Green Jobs'];

/* ─── nav ──────────────────────────────────────────────────────── */
const NAV = [
  { section:'Main', items:[
    { id:'dashboard',     icon:'🏠', label:'Dashboard' },
    { id:'profile', icon:'👤', label:'My Profile', children:[
      { id:'profile-personal',        label:'Personal Information' },
      { id:'profile-qualifications',  label:'Educational Qualifications' },
      { id:'profile-experience',      label:'Work Experience' },
      { id:'profile-expertise',       label:'Domain & Skills' },
      { id:'profile-certifications',  label:'Certifications & Awards' },
      { id:'profile-docs',            label:'Documents & KYC' },
    ]},
    { id:'notifications', icon:'🔔', label:'Notifications', badge:5, badgeRed:true },
  ]},
  { section:'Training Management', items:[
    { id:'batch', icon:'📋', label:'Batch Management', children:[
      { id:'batch-active',    label:'Active Batches' },
      { id:'batch-upcoming',  label:'Upcoming Batches' },
      { id:'batch-completed', label:'Completed Batches' },
      { id:'batch-create',    label:'Create New Batch' },
    ]},
    { id:'sessions', icon:'📅', label:'Session Management', children:[
      { id:'session-schedule',    label:'Schedule Sessions' },
      { id:'session-today',       label:"Today's Sessions" },
      { id:'session-calendar',    label:'Training Calendar' },
      { id:'session-reschedule',  label:'Reschedule / Cancel' },
    ]},
    { id:'attendance', icon:'✅', label:'Attendance', children:[
      { id:'attendance-mark',     label:'Mark Attendance' },
      { id:'attendance-reports',  label:'Attendance Reports' },
      { id:'attendance-summary',  label:'Batch-wise Summary' },
    ]},
  ]},
  { section:'Learners', items:[
    { id:'learners', icon:'👥', label:'My Learners', children:[
      { id:'learner-list',       label:'All Learners' },
      { id:'learner-progress',   label:'Learning Progress' },
      { id:'learner-dropout',    label:'Dropout / At-Risk' },
      { id:'learner-placement',  label:'Placement Status' },
    ]},
  ]},
  { section:'Assessments', items:[
    { id:'assessments', icon:'📝', label:'Assessments', children:[
      { id:'assess-schedule', label:'Assessment Schedule' },
      { id:'assess-results',  label:'Results & Scorecards' },
      { id:'assess-rpl',      label:'RPL Assessment' },
      { id:'assess-mock',     label:'Mock Tests' },
    ]},
  ]},
  { section:'Content & Resources', items:[
    { id:'content', icon:'📚', label:'Course Content', children:[
      { id:'content-materials', label:'Study Materials' },
      { id:'content-videos',    label:'Video Lectures' },
      { id:'content-upload',    label:'Upload Content' },
      { id:'content-library',   label:'Resource Library' },
    ]},
  ]},
  { section:'Certificates', items:[
    { id:'certificates', icon:'🏆', label:'Certificates', children:[
      { id:'cert-issue',  label:'Issue Certificates' },
      { id:'cert-issued', label:'Issued Certificates' },
      { id:'cert-verify', label:'Verify Certificate' },
    ]},
  ]},
  { section:'Reports & Analytics', items:[
    { id:'reports', icon:'📊', label:'Reports', children:[
      { id:'report-batch',       label:'Batch Performance' },
      { id:'report-attendance',  label:'Attendance Analytics' },
      { id:'report-assessment',  label:'Assessment Analytics' },
      { id:'report-placement',   label:'Placement Analytics' },
      { id:'report-trainer',     label:'My Performance' },
    ]},
  ]},
  { section:'Schemes', items:[
    { id:'schemes', icon:'🏛️', label:'Govt Schemes', children:[
      { id:'scheme-pmkvy', label:'PMKVY 4.0' },
      { id:'scheme-rpl',   label:'RPL — Prior Learning' },
      { id:'scheme-naps',  label:'NAPS / NATS' },
      { id:'scheme-ddu',   label:'DDU-GKY' },
    ]},
  ]},
  { section:'Communication', items:[
    { id:'communication', icon:'📢', label:'Announcements', children:[
      { id:'announce-send',    label:'Send Announcement' },
      { id:'announce-history', label:'Announcement History' },
    ]},
  ]},
  { section:'Feedback & Ratings', items:[
    { id:'feedback', icon:'⭐', label:'Feedback & Ratings', children:[
      { id:'feedback-session',  label:'Session Feedback' },
      { id:'feedback-overall',  label:'My Trainer Rating' },
    ]},
  ]},
  { section:'Earnings', items:[
    { id:'earnings', icon:'💰', label:'Earnings & Payments', children:[
      { id:'earnings-history', label:'Payment History' },
      { id:'earnings-pending', label:'Pending Dues' },
      { id:'earnings-bank',    label:'Bank Details' },
    ]},
  ]},
  { section:'Job Board', items:[
    { id:'jobs', icon:'💼', label:'Job Board', children:[
      { id:'jobs-browse',   label:'Browse Jobs' },
      { id:'jobs-referrals',label:'My Referrals' },
    ]},
  ]},
  { section:'AI Tools', items:[
    { id:'ai', icon:'🤖', label:'AI Assistant', children:[
      { id:'ai-session',    label:'Session Planner' },
      { id:'ai-assessment', label:'Assessment Builder' },
      { id:'ai-insights',   label:'Batch Insights' },
      { id:'ai-dropout',    label:'Dropout Risk' },
    ]},
  ]},
  { section:'Support', items:[
    { id:'helpdesk',  icon:'🎧', label:'Help & Support' },
    { id:'grievance', icon:'📣', label:'Grievance' },
    { id:'faq',       icon:'❓', label:'FAQ' },
  ]},
  { section:'Account', items:[
    { id:'settings', icon:'⚙️', label:'Settings & Preferences' },
  ]},
];

/* ─── search index ─────────────────────────────────────────────── */
const SEARCH_INDEX = NAV.flatMap(s => s.items.flatMap(item => {
  const rows = [{ id: item.id, label: item.label, icon: item.icon || '📌', section: s.section }];
  if (item.children) item.children.forEach(c => rows.push({ id: c.id, label: c.label, icon: item.icon || '📌', section: item.label }));
  return rows;
}));

/* ─── micro-components (module-level, stable references) ──────── */
function Card({ children, style }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px', ...style }}>
      {children}
    </div>
  );
}
function CardTitle({ children }) {
  return <div style={{ fontSize:13.5, fontWeight:700, color:C.navy, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>{children}</div>;
}
function SectionHead({ title, action }) {
  return (
    <div style={{ marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.navy, margin:0 }}>{title}</h1>
      {action}
    </div>
  );
}
function Btn({ children, primary, sm, red, outline, onClick, style: extra }) {
  return (
    <button onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: sm ? '5px 12px' : '8px 18px',
      borderRadius:8, fontWeight:700, fontSize: sm ? 12 : 13, cursor:'pointer',
      background: red ? C.red : primary ? C.blue : 'transparent',
      color: (red || primary) ? '#fff' : C.ink2,
      border: (red || primary) ? 'none' : `1.5px solid ${C.border}`,
      ...extra,
    }}>{children}</button>
  );
}
function Badge({ children, color='blue' }) {
  const map = { blue:[C.bluePale,C.blue], green:[C.greenPale,C.green], gold:[C.goldPale,'#9A6A00'], red:[C.redPale,C.red], teal:[C.tealPale,C.teal], purple:[C.purplePale,C.purple] };
  const [bg, fg] = map[color] || map.blue;
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:20, fontSize:10.5, fontWeight:700, background:bg, color:fg }}>{children}</span>;
}
function ProgBar({ pct, color=C.blue }) {
  return (
    <div style={{ height:6, background:C.border, borderRadius:4, overflow:'hidden', width:'100%' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:4 }} />
    </div>
  );
}
function KpiCard({ icon, value, label, sub, accent }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent, borderRadius:'10px 10px 0 0' }} />
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:800, color:C.navy, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11.5, color:C.ink3, marginTop:5, fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:10.5, fontWeight:700, color:accent, marginTop:4 }}>{sub}</div>}
    </div>
  );
}
function Table({ headers, rows }) {
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
      <thead>
        <tr>{headers.map((h,i)=><th key={i} style={{ background:'#F8FAFC', padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:C.ink3, textTransform:'uppercase', letterSpacing:'.04em', borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}
function Td({ children, style }) {
  return <td style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}`, color:C.ink2, verticalAlign:'middle', ...style }}>{children}</td>;
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:C.ink2, marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}
function Inp({ placeholder, type='text', value, defaultValue, onChange }) {
  return <input type={type} placeholder={placeholder} value={value} defaultValue={defaultValue} onChange={onChange}
    style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`,
      borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc',
      fontFamily:'inherit', color:C.ink2, boxSizing:'border-box' }} />;
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

function G({ cols=2, gap=14, children }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap, marginBottom:14 }}>{children}</div>;
}
function Sel({ options, defaultValue }) {
  return <select defaultValue={defaultValue} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }}>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>;
}
function Alert({ children, type='info' }) {
  const map = { info:[C.bluePale,C.blue], warn:[C.goldPale,C.gold], success:[C.greenPale,C.green], red:[C.redPale,C.red] };
  const [bg, fg] = map[type] || map.info;
  return <div style={{ padding:'12px 16px', borderRadius:8, fontSize:13, marginBottom:14, background:bg, borderLeft:`4px solid ${fg}`, color:fg }}>{children}</div>;
}
function TlItem({ dot, title, meta }) {
  return <div style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
    <div style={{ width:10, height:10, borderRadius:'50%', background:dot, flexShrink:0, marginTop:4 }} />
    <div><div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{title}</div><div style={{ fontSize:11.5, color:C.ink3, marginTop:2 }}>{meta}</div></div>
  </div>;
}
function StatRow({ n, label, pct, color }) {
  return <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
    <div style={{ fontSize:18, fontWeight:800, color:C.navy, minWidth:52, flexShrink:0 }}>{n}</div>
    <div style={{ fontSize:12.5, color:C.ink2, flex:1, minWidth:0 }}>{label}</div>
    <div style={{ minWidth:60, flex:'0 0 28%' }}><ProgBar pct={pct} color={color||C.blue} /></div>
  </div>;
}

export default function TrainerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchShow, setSearchShow] = useState(false);
  const [dbStats, setDbStats] = useState({});
  const [menuPerms, setMenuPerms] = useState({});

  // ── Batch management state ──
  const [myBatches, setMyBatches] = useState([]);
  const [batchesLoaded, setBatchesLoaded] = useState(false);
  const [batchForm, setBatchForm] = useState({ name:'', batch_code:'', course_id:'', start_date:'', end_date:'', capacity:30, status:'upcoming', scheme_type:'None', mode:'Classroom', venue:'' });
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchMsg, setBatchMsg] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchLearners, setBatchLearners] = useState([]);
  const [learnersLoaded, setLearnersLoaded] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0,10));
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [allLearners, setAllLearners] = useState([]);
  const [allLearnersLoaded, setAllLearnersLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [enrolModal, setEnrolModal] = useState(null); // batchId | null
  const [enrolEmail, setEnrolEmail] = useState('');
  const [enrolMsg, setEnrolMsg] = useState('');
  const [showAddQual, setShowAddQual] = useState(false);
  const [qualForm, setQualForm] = useState({ degree:'', institution:'', year:'', score:'' });
  const [qualList, setQualList] = useState([]);
  const [showAddExp, setShowAddExp] = useState(false);
  const [expForm, setExpForm] = useState({ org:'', role:'', from:'', to:'', sector:'' });
  const [expList, setExpList] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillForm, setSkillForm] = useState({ domain:'', courses:'', ssc:'', nsqfLevel:'', yearsExp:'' });
  const [skillList, setSkillList] = useState([]);
  const DOMAINS = ['IT-ITeS','Electronics','Retail','BFSI','Healthcare','Logistics','Automotive','Construction','Apparel','Tourism'];
  const NSQF_LEVELS = ['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6','Level 7'];

  // Certifications
  const [certList, setCertList] = useState([]);
  const [showAddCert, setShowAddCert] = useState(false);
  const [certForm, setCertForm] = useState({ cert_name:'', issuing_body:'', year:'', valid_until:'' });

  // Documents
  const [docList, setDocList] = useState([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({ doc_type:'', file_name:'', _file: null });
  const [docUploading, setDocUploading] = useState(false);

  // Sessions
  const [sessionList, setSessionList] = useState([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ batch_id:'', topic:'', session_date:'', start_time:'', duration_hrs:'2', venue:'', mode:'Classroom' });

  // Assessments
  const [assessList, setAssessList] = useState([]);
  const [showAddAssess, setShowAddAssess] = useState(false);
  const [assessForm, setAssessForm] = useState({ batch_id:'', type:'Final', date:'', duration_hrs:'2', total_marks:'100', passing_marks:'50', assessor:'' });

  // Mock Tests
  const [mockList, setMockList] = useState([]);
  const [showAddMock, setShowAddMock] = useState(false);
  const [mockForm, setMockForm] = useState({ batch_id:'', subject:'', date:'', duration_min:'60', questions:'50', total_marks:'100', passing_marks:'50', mode:'Online', time_slot:'' });

  // Content
  const [contentList, setContentList] = useState([]);
  const [showAddContent, setShowAddContent] = useState(false);
  const [contentForm, setContentForm] = useState({ type:'Study Material (PDF)', title:'', description:'', batch_targets:'All', file_name:'', url:'' });

  // Support Tickets
  const [ticketList, setTicketList] = useState([]);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({ category:'Batch Issue', priority:'Medium', subject:'', details:'' });

  // Grievances
  const [grievanceList, setGrievanceList] = useState([]);
  const [showAddGrievance, setShowAddGrievance] = useState(false);
  const [grievanceForm, setGrievanceForm] = useState({ grievance_type:'Other', against_whom:'', details:'' });

  // Reschedule panel state (must be top-level — Rules of Hooks)
  const [reschedSelId, setReschedSelId] = useState('');
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');

  // Personal Info
  const [personalForm, setPersonalForm] = useState({ name:'', dob:'', gender:'Male', category:'General', phone:'', email:'', aadhaar:'', pan:'', sector:'' });
  const [personalSaving, setPersonalSaving] = useState(false);
  const [aadhaarError, setAadhaarError] = useState('');
  const [panError, setPanError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Reports
  const [reportAtt, setReportAtt] = useState([]);
  const [reportBatch, setReportBatch] = useState([]);
  const [reportDropout, setReportDropout] = useState([]);
  const [reportAssess, setReportAssess] = useState([]);
  const [reportPlacement, setReportPlacement] = useState([]);
  const [reportScheme, setReportScheme] = useState([]);
  const [certEligible, setCertEligible] = useState([]);
  const [certIssued, setCertIssued] = useState([]);
  const [certIssuedLoading, setCertIssuedLoading] = useState(true);
  useEffect(() => {
    api.trainerCertIssued()
      .then(r => setCertIssued(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setCertIssuedLoading(false));
  }, []);

  // Notifications
  const [notifList, setNotifList] = useState([]);

  // Cert verify
  const [certVerifyQ, setCertVerifyQ] = useState('');
  const [certVerifyResult, setCertVerifyResult] = useState(null); // null=untouched, false=not found, object=found
  const [certVerifying, setCertVerifying] = useState(false);

  // Course dropdown (PanelBatchCreate) — must be top-level (Rules of Hooks)
  const [courseOpts, setCourseOpts] = useState([]);
  useEffect(() => { api.courses().then(r => setCourseOpts(Array.isArray(r) ? r : r.courses || [])).catch(() => {}); }, []);

  // Announcements (PanelAnnounceSend / PanelAnnounceHistory)
  const [announceForm, setAnnounceForm] = useState({ batch_id:'', title:'', message:'', priority:'Normal' });
  const [announceSent, setAnnounceSent] = useState([]);
  const [announceSaving, setAnnounceSaving] = useState(false);
  const [announceHistory, setAnnounceHistory] = useState([]);
  const [announceHistoryLoading, setAnnounceHistoryLoading] = useState(true);
  useEffect(() => {
    api.trainerAnnouncements()
      .then(r => setAnnounceHistory(Array.isArray(r) ? r : r.announcements || []))
      .catch(() => {})
      .finally(() => setAnnounceHistoryLoading(false));
  }, []);

  // Bank Details (PanelEarningsBank)
  const [bankForm, setBankForm] = useState({ account_name:'', account_no:'', ifsc:'', bank_name:'', branch:'', upi_id:'' });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  useEffect(() => {
    api.trainerBankDetails()
      .then(r => { if (r && r.account_name) setBankForm({ account_name:r.account_name||'', account_no:r.account_no||'', ifsc:r.ifsc||'', bank_name:r.bank_name||'', branch:r.branch||'', upi_id:r.upi_id||'' }); })
      .catch(() => {});
  }, []);

  // Job Board (PanelJobsBrowse)
  const [jobsList, setJobsList] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [referModal, setReferModal] = useState(null);
  const [referEmail, setReferEmail] = useState('');
  const [referNote, setReferNote] = useState('');
  const [referSending, setReferSending] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  useEffect(() => {
    api.jobs().then(r => { setJobsList(Array.isArray(r) ? r : r.jobs || []); setJobsLoading(false); })
      .catch(() => setJobsLoading(false));
    api.trainerReferrals().then(r => setReferrals(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setReferralsLoading(false));
  }, []);

  // Feedback & Ratings state
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [ratingSummary, setRatingSummary] = useState(null);
  useEffect(() => {
    api.trainerFeedbackSessions().then(r => setFeedbackList(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setFeedbackLoading(false));
    api.trainerRatingSummary().then(r => setRatingSummary(r)).catch(() => {});
  }, []);

  // Payments state
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentPending, setPaymentPending] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.trainerPaymentHistory(), api.trainerPaymentPending()])
      .then(([hist, pend]) => {
        setPaymentHistory(Array.isArray(hist) ? hist : []);
        setPaymentPending(Array.isArray(pend?.pending) ? pend.pending : []);
      }).catch(() => {}).finally(() => setPaymentsLoading(false));
  }, []);

  // AI Tools state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState([]);
  useEffect(() => { api.chatbotSuggestions().then(r => setChatSuggestions(r.suggestions || [])).catch(() => {}); }, []);

  const [sessionPlan, setSessionPlan] = useState({ topic:'', batch_id:'', duration:'60', learner_count:'', objectives:'', prior_knowledge:'' });
  const [sessionPlanResult, setSessionPlanResult] = useState('');
  const [sessionPlanLoading, setSessionPlanLoading] = useState(false);

  const [assessBuilder, setAssessBuilder] = useState({ topic:'', type:'MCQ', count:'10', difficulty:'Medium', batch_id:'' });
  const [assessBuilderResult, setAssessBuilderResult] = useState('');
  const [assessBuilderLoading, setAssessBuilderLoading] = useState(false);

  const [batchInsights, setBatchInsights] = useState(null);
  const [batchInsightsLoading, setBatchInsightsLoading] = useState(false);
  const [batchInsightsBatch, setBatchInsightsBatch] = useState('');

  const [dropoutData, setDropoutData] = useState(null);
  const [dropoutLoading, setDropoutLoading] = useState(false);
  const [dropoutBatch, setDropoutBatch] = useState('');

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [panel]); // eslint-disable-line

  useEffect(() => { api.dashboardStats().then(setDbStats).catch(() => {}); }, []);
  useEffect(() => {
    api.getRolePermissions().then(all => setMenuPerms(all['trainer'] || {})).catch(() => {});
  }, []);
  const PERM_LOCKED = new Set(['dashboard','notifications','settings','profile','profile-personal','profile-qualifications','profile-experience','profile-expertise','profile-certifications','profile-docs']);
  const allowed = k => !k || PERM_LOCKED.has(k) || menuPerms[k] !== false;
  useEffect(() => { if (Object.keys(menuPerms).length && !allowed(panel)) setPanel('dashboard'); }, [menuPerms]); // eslint-disable-line
  useEffect(() => {
    if (user) setPersonalForm(f => ({
      ...f,
      name: user.name || '',
      dob: user.dob || '',
      gender: user.gender || 'Male',
      category: user.category || 'General',
      phone: (user.phone || '').replace(/^\+91/, ''),
      email: user.email || '',
      aadhaar: '',
      pan: user.pan || '',
      sector: user.preferred_sector || '',
    }));
  }, [user]);
  useEffect(() => {
    api.trainerQualifications().then(rows => setQualList(rows.map(r => ({ id: r.id, degree: r.degree, institution: r.institution, year: r.year || '', score: r.score || '' })))).catch(() => {});
    api.trainerExperience().then(rows => setExpList(rows.map(r => ({ id: r.id, org: r.org, role: r.role, from: r.from_date || '', to: r.to_date || '', sector: r.sector || '' })))).catch(() => {});
    api.trainerSkills().then(rows => setSkillList(rows.map(r => ({ id: r.id, domain: r.domain, courses: r.courses || '', ssc: r.ssc || '', nsqfLevel: r.nsqf_level || '', yearsExp: r.years_exp || '' })))).catch(() => {});
    api.trainerCertifications().then(setCertList).catch(() => {});
    api.trainerDocuments().then(setDocList).catch(() => {});
    api.trainerSessions().then(setSessionList).catch(() => {});
    api.trainerAssessments().then(setAssessList).catch(() => {});
    api.trainerMockTests().then(setMockList).catch(() => {});
    api.trainerContent().then(setContentList).catch(() => {});
    api.trainerTickets().then(setTicketList).catch(() => {});
    api.trainerGrievances().then(setGrievanceList).catch(() => {});
    api.trainerReportAttendance().then(setReportAtt).catch(() => {});
    api.trainerReportBatch().then(setReportBatch).catch(() => {});
    api.trainerReportDropout().then(setReportDropout).catch(() => {});
    api.trainerReportAssessment().then(setReportAssess).catch(() => {});
    api.trainerReportPlacement().then(setReportPlacement).catch(() => {});
    api.trainerCertEligible().then(setCertEligible).catch(() => {});
    api.trainerNotifications().then(setNotifList).catch(() => {});
    api.trainerReportScheme().then(setReportScheme).catch(() => {});
  }, []);
  useEffect(() => {
    if (!batchesLoaded) return;
    Promise.all(myBatches.map(b =>
      api.batchLearners(b.id)
        .then(ls => ls.map(l => ({ ...l, batchName: b.name, batchCode: b.batch_code })))
        .catch(() => [])
    )).then(all => { setAllLearners(all.flat()); setAllLearnersLoaded(true); });
  }, [batchesLoaded]);

  function loadBatches() {
    api.myBatches().then(b => { setMyBatches(b); setBatchesLoaded(true); }).catch(() => {});
  }
  function refreshBatches() {
    api.myBatches().then(b => { setMyBatches(b); setBatchesLoaded(true); }).catch(() => {});
  }
  function loadLearnersForBatch(batchId) {
    setSelectedBatchId(batchId);
    setLearnersLoaded(false);
    api.batchLearners(batchId).then(l => { setBatchLearners(l); setLearnersLoaded(true); }).catch(() => setLearnersLoaded(true));
  }

  function go(id) {
    setPanel(id); window.scrollTo(0, 0);
    if (['batch-active','batch-upcoming','batch-completed','learner-list','learner-progress','learner-dropout','learner-placement'].includes(id)) loadBatches();
    if (id === 'attendance-mark') loadBatches();
  }
  function toggleMenu(id) { setOpenMenus(m => ({ ...m, [id]: !m[id] })); }
  function handleLogout() { logout(); navigate('/'); }

  const searchResults = searchQ.trim()
    ? SEARCH_INDEX.filter(r => r.label.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 8)
    : [];

  // ── SIDEBAR ──────────────────────────────────────────────────────
  function Sidebar() {
    return (
      <>
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199 }} />
        )}
        <div style={{ position:'fixed', top:0, left:0, width:SW, height:'100vh', background:C.sidebar, overflowY:'hidden', zIndex:200, display:'flex', flexDirection:'column', transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)', transition:'transform 0.25s ease' }}>
        <div style={{ padding:'0 16px', height:TH, minHeight:TH, display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,.08)', flexShrink:0 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', border:'2px solid #e0e8f4', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}><img src="/logo.png" alt="Skills n Jobs" style={{ width:34, height:34, objectFit:'contain' }} /></div>
          <div><div style={{ color:'#fff', fontWeight:800, fontSize:14 }}>SkillsNJobs</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:9.5 }}>TRAINER PORTAL</div></div>
        </div>
        <div style={{ flex:1, overflowY:'auto', paddingBottom:4 }}>
        {NAV.map(sec => {
          const visItems = sec.items.filter(item => allowed(item.id));
          if (!visItems.length) return null;
          return (
          <div key={sec.section}>
            <div style={{ padding:'6px 16px 2px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:'.08em', textTransform:'uppercase' }}>{sec.section}</div>
            {visItems.map(item => {
              const visChildren = item.children ? item.children.filter(c => allowed(c.id)) : null;
              return (
              <div key={item.id}>
                <div onClick={() => item.children ? toggleMenu(item.id) : go(item.id)}
                  style={{ padding:'5px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:9,
                    color: panel===item.id ? '#fff' : 'rgba(255,255,255,.72)',
                    background: panel===item.id ? C.blue : 'transparent' }}
                  onMouseEnter={e => { if(panel!==item.id) e.currentTarget.style.background='rgba(255,255,255,.07)'; }}
                  onMouseLeave={e => { if(panel!==item.id) e.currentTarget.style.background='transparent'; }}>
                  <span style={{ width:20, textAlign:'center', fontSize:14, flexShrink:0 }}>{item.icon}</span>
                  <span style={{ flex:1, fontSize:12.5, fontWeight:500 }}>{item.label}</span>
                  {item.badge && <span style={{ background:C.red, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{item.badge}</span>}
                  {visChildren && <span style={{ fontSize:10, transition:'.2s', transform: openMenus[item.id] ? 'rotate(90deg)' : 'none', display:'inline-block' }}>›</span>}
                </div>
                {visChildren && openMenus[item.id] && (
                  <div style={{ background:'rgba(0,0,0,.15)' }}>
                    {visChildren.map(c => (
                      <div key={c.id} onClick={() => go(c.id)}
                        style={{ padding:'5px 16px 5px 45px', cursor:'pointer', fontSize:12,
                          color: panel===c.id ? C.gold : 'rgba(255,255,255,.5)', fontWeight: panel===c.id ? 700 : 400 }}
                        onMouseEnter={e => { e.currentTarget.style.color='#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = panel===c.id ? C.gold : 'rgba(255,255,255,.5)'; }}>
                        · {c.label}
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
      </div>
      </div>
      </>
    );
  }

  // ── TOPBAR ────────────────────────────────────────────────────────
  function Topbar() {
    return (
      <div style={{ position:'fixed', top:0, left: isMobile ? 0 : SW, right:0, height:TH, background:'#fff', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 20px', gap:12, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(v => !v)} style={{ width:38, height:38, borderRadius:8, border:'none', background:'#f1f5f9', fontSize:20, cursor:'pointer', flexShrink:0 }}>☰</button>
        )}
        <div style={{ flex:1, maxWidth:400, position:'relative' }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            onFocus={() => setSearchShow(true)} onBlur={() => setTimeout(() => setSearchShow(false), 150)}
            placeholder="Search sessions, learners, reports…"
            style={{ width:'100%', padding:'8px 12px 8px 36px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', background:'#f6f8fc' }} />
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', opacity:.4, fontSize:14 }}>🔍</span>
          {searchShow && searchResults.length > 0 && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.1)', zIndex:500, maxHeight:260, overflowY:'auto' }}>
              {searchResults.map(r => (
                <div key={r.id} onMouseDown={() => { go(r.id); setSearchQ(''); setSearchShow(false); }}
                  style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, borderBottom:`1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background=C.bluePale}
                  onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                  {r.icon} {r.label}<div style={{ fontSize:11, color:C.ink3, marginTop:2 }}>{r.section}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
          {/* Notification bell */}
          <div style={{ cursor:'pointer', padding:6, position:'relative', fontSize:18 }} onClick={() => go('notifications')}>
            🔔{notifList.length > 0 && (
              <span style={{ position:'absolute', top:2, right:2, width:17, height:17, borderRadius:'50%', background:C.red, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{notifList.length > 9 ? '9+' : notifList.length}</span>
            )}
          </div>
          {/* Avatar with tooltip */}
          <div style={{ position:'relative' }}
            onMouseEnter={e => { const t = e.currentTarget.querySelector('.tp-tooltip'); if(t){t.style.opacity='1';t.style.pointerEvents='auto';} }}
            onMouseLeave={e => { const t = e.currentTarget.querySelector('.tp-tooltip'); if(t){t.style.opacity='0';t.style.pointerEvents='none';} }}>
            <div onClick={() => go('profile-personal')} style={{ display:'flex', alignItems:'center', padding:5, borderRadius:'50%', background:C.surface, border:`1px solid ${C.border}`, cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${C.blue},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#fff', border:`2px solid ${C.bluePale||'#e0e7ff'}` }}>
                {(user?.name||'T').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
              </div>
            </div>
            <div className="tp-tooltip" style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:500, background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', minWidth:190, boxShadow:'0 8px 24px rgba(0,0,0,.12)', opacity:0, pointerEvents:'none', transition:'opacity 0.15s ease', whiteSpace:'nowrap' }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{user?.name||'Trainer'}</div>
              <div style={{ fontSize:11, color:C.ink3, marginTop:2 }}>Trainer{user?.org_name ? ` · ${user.org_name}` : ''}</div>
              <div style={{ marginTop:10, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                <button onClick={() => go('profile-personal')} style={{ width:'100%', padding:'5px 0', background:C.navy, color:'#fff', border:'none', borderRadius:7, fontSize:11.5, fontWeight:600, cursor:'pointer' }}>View Profile →</button>
              </div>
            </div>
          </div>
          {/* Sign out icon button */}
          <button onClick={handleLogout} title="Sign Out" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:'50%', border:'none', background:C.blue, color:'#fff', fontSize:18, cursor:'pointer' }}>⏻</button>
        </div>
      </div>
    );
  }

  // ── PANELS ────────────────────────────────────────────────────────
  const u = { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' };

  function PanelDashboard() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    const monthStart = todayStr.slice(0, 7) + '-01';

    const batchLookup = Object.fromEntries(reportBatch.map(b => [b.id, b]));
    const attLookup = Object.fromEntries(reportAtt.map(b => [b.id, b]));
    const perfColors = [C.green, C.blue, C.teal, C.gold, C.purple];

    const todaySessions = sessionList.filter(s => s.session_date && s.session_date.slice(0, 10) === todayStr);
    const sessionsThisMonth = sessionList.filter(s => s.session_date && s.session_date.slice(0, 7) === todayStr.slice(0, 7));
    const pendingAssessments = assessList.filter(a => a.date >= todayStr && a.status !== 'completed' && a.status !== 'cancelled');
    const atRiskLearners = reportDropout.length;
    const placementCount = reportPlacement.length;

    // Learner funnel
    const totalEnrolled = reportBatch.reduce((s, b) => s + (b.enrolled || 0), 0);
    const totalCompleted = reportBatch.reduce((s, b) => s + (b.completed_count || 0), 0);
    const totalPassed = reportBatch.reduce((s, b) => s + (b.passed_count || 0), 0);

    const activity = [
      ...sessionList.map(s => ({ date: s.created_at, dot: C.blue, icon: '📅', title: `Session "${s.topic}" scheduled for ${batchLookup[s.batch_id]?.batch_code || 'a batch'} on ${formatDate(s.session_date)}` })),
      ...assessList.map(a => ({ date: a.created_at, dot: C.gold, icon: '📝', title: `${a.type} assessment scheduled for ${batchLookup[a.batch_id]?.batch_code || 'a batch'} on ${formatDate(a.date)}` })),
      ...mockList.map(m => ({ date: m.created_at, dot: C.teal, icon: '🧪', title: `Mock test "${m.subject}" scheduled for ${formatDate(m.date)}` })),
      ...contentList.map(c => ({ date: c.created_at, dot: C.purple, icon: '📤', title: `Content "${c.title}" uploaded` })),
    ].filter(a => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

    const upcomingWeek = [
      ...sessionList.filter(s => s.session_date >= todayStr && s.session_date <= weekEndStr).map(s => ({ date: s.session_date, dot: C.blue, icon: '📅', title: `${s.topic}`, sub: `${batchLookup[s.batch_id]?.batch_code || '—'} · ${s.start_time || 'TBD'} · ${s.venue || 'TBD'}` })),
      ...assessList.filter(a => a.date >= todayStr && a.date <= weekEndStr).map(a => ({ date: a.date, dot: C.gold, icon: '📝', title: `${a.type} Assessment`, sub: `${batchLookup[a.batch_id]?.batch_code || '—'} · ${a.time_slot || 'TBD'}` })),
      ...mockList.filter(m => m.date >= todayStr && m.date <= weekEndStr).map(m => ({ date: m.date, dot: C.teal, icon: '🧪', title: `Mock: ${m.subject}`, sub: `${m.batch_code || '—'} · ${m.time_slot || 'TBD'}` })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6);

    const quickActions = [
      { icon: '📅', label: 'Schedule Session', panel: 'session-schedule', color: C.blue },
      { icon: '🆕', label: 'Create Batch', panel: 'batch-create', color: C.teal },
      { icon: '📤', label: 'Upload Content', panel: 'content-materials', color: C.purple },
      { icon: '🧪', label: 'Create Mock Test', panel: 'assess-mock', color: C.gold },
      { icon: '👥', label: 'View Learners', panel: 'learner-list', color: C.green },
      { icon: '📊', label: 'View Reports', panel: 'report-batch', color: C.red },
    ];

    return <>
      {atRiskLearners > 0 && (
        <Alert type="red">⚠️ <strong>{atRiskLearners} learner{atRiskLearners > 1 ? 's are' : ' is'} at risk</strong> (attendance below 70%). <span onClick={() => go('learner-dropout')} style={{ cursor:'pointer', textDecoration:'underline', fontWeight:600 }}>View dropout list →</span></Alert>
      )}
      {todaySessions.length > 0 && (
        <Alert type="info">📋 You have <strong>{todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} today</strong>. Mark attendance before 5 PM to avoid compliance flag.</Alert>
      )}

      {/* KPI Row — single compact row of 6 */}
      <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:10 }}>
        <h2 style={{ fontSize:17, fontWeight:800, color:C.navy, margin:0 }}>Welcome back, {u.name || 'Trainer'} 🎓</h2>
        <span style={{ fontSize:12, color:C.ink3 }}>— {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:12 }}>
        {[
          { icon:'📋', value: dbStats.myActiveBatches ?? '—', label:'Active Batches', sub:`${dbStats.myBatches ?? 0} total`, accent:C.blue },
          { icon:'👥', value: dbStats.myLearners ?? '—', label:'Learners', sub:'All batches', accent:C.teal },
          { icon:'✅', value: dbStats.avgAttendance != null ? `${dbStats.avgAttendance}%` : '—', label:'Avg Attendance', sub:'Active batches', accent:C.green },
          { icon:'🏆', value: dbStats.assessmentPassRate != null ? `${dbStats.assessmentPassRate}%` : '—', label:'Pass Rate', sub:'All assessments', accent:C.gold },
          { icon:'📅', value: sessionsThisMonth.length, label:'Sessions / Month', sub:`${pendingAssessments.length} pending`, accent:C.purple },
          { icon:'🏢', value: placementCount, label:'Placements', sub:'Made', accent:C.red },
        ].map(k => (
          <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.accent, borderRadius:'8px 8px 0 0' }} />
            <div style={{ fontSize:16, marginBottom:4 }}>{k.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:C.navy, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:10.5, color:C.ink3, marginTop:3, fontWeight:500 }}>{k.label}</div>
            <div style={{ fontSize:10, fontWeight:700, color:k.accent, marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Today's Sessions + Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>📅 Today's Sessions ({todaySessions.length})</div>
          {todaySessions.length === 0
            ? <div style={{ color:C.ink3, fontSize:12.5, padding:'4px 0' }}>No sessions today. <span onClick={() => go('session-schedule')} style={{ color:C.blue, cursor:'pointer', fontWeight:600 }}>Schedule one →</span></div>
            : <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr>{['Batch','Topic','Time','Venue','Status',''].map((h,i)=><th key={i} style={{ background:'#F8FAFC', padding:'6px 10px', textAlign:'left', fontSize:10, fontWeight:700, color:C.ink3, textTransform:'uppercase', letterSpacing:'.04em', borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{todaySessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${C.border}`, color:C.ink2 }}>{batchLookup[s.batch_id]?.batch_code || '—'}</td>
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${C.border}`, color:C.ink2 }}>{s.topic}</td>
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${C.border}`, color:C.ink2 }}>{s.start_time || '—'}</td>
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${C.border}`, color:C.ink2 }}>{s.venue || '—'}</td>
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${C.border}` }}><Badge color={s.status==='completed'?'green':s.status==='rescheduled'?'gold':'blue'}>{s.status || 'scheduled'}</Badge></td>
                    <td style={{ padding:'7px 10px', borderBottom:`1px solid ${C.border}` }}>
                      {s.status !== 'completed' &&
                        <Btn sm primary onClick={() =>
                          api.updateTrainerSession(s.id, { ...s, status:'completed' })
                            .then(() => { setSessionList(p => p.map(x => x.id===s.id ? { ...x, status:'completed' } : x)); showToast('Session marked as completed!'); })
                            .catch(e => showToast(e.message||'Failed','error'))
                        }>✓ Done</Btn>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>⚡ Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {quickActions.map(qa => (
              <button key={qa.panel} onClick={() => go(qa.panel)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', border:`1.5px solid ${C.border}`, borderRadius:8, background:'#fafbfc', cursor:'pointer', fontSize:12, fontWeight:600, color:C.ink1 }}
                onMouseOver={e => { e.currentTarget.style.background=qa.color+'15'; e.currentTarget.style.borderColor=qa.color; }}
                onMouseOut={e => { e.currentTarget.style.background='#fafbfc'; e.currentTarget.style.borderColor=C.border; }}>
                <span style={{ fontSize:16 }}>{qa.icon}</span><span>{qa.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Batch Attendance + Learner Funnel */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>📊 Batch Attendance</div>
          {reportBatch.length === 0
            ? <div style={{ color:C.ink3, fontSize:12.5 }}>No batches yet.</div>
            : reportBatch.slice(0, 6).map((b, i) => {
                const att = parseFloat(attLookup[b.id]?.avg_att || 0);
                return (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.navy, minWidth:72, flexShrink:0 }}>{b.batch_code}</div>
                    <div style={{ flex:1, minWidth:0 }}><ProgBar pct={att} color={perfColors[i % perfColors.length]} /></div>
                    <div style={{ fontSize:11, color:C.ink3, minWidth:34, textAlign:'right', flexShrink:0 }}>{att}%</div>
                  </div>
                );
              }).concat(reportBatch.length > 6 ? [<div key="more" style={{ fontSize:11, color:C.ink3, marginTop:6, cursor:'pointer' }} onClick={() => go('report-batch')}>+{reportBatch.length - 6} more → View report</div>] : [])}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>🔽 Learner Funnel</div>
          {totalEnrolled === 0
            ? <div style={{ color:C.ink3, fontSize:12.5 }}>Enrol learners to see the funnel.</div>
            : [
                { label:'Enrolled', count:totalEnrolled, color:C.blue },
                { label:'Completed', count:totalCompleted, color:C.teal },
                { label:'Passed', count:totalPassed, color:C.green },
                { label:'Placed', count:Math.min(placementCount, totalEnrolled), color:C.gold },
              ].map(({ label, count, color }) => {
                const pct = totalEnrolled > 0 ? Math.round((count / totalEnrolled) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:500, marginBottom:3 }}>
                      <span>{label}</span>
                      <span style={{ color, fontWeight:700 }}>{count} <span style={{ color:C.ink3, fontWeight:400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ background:'#eef0f4', borderRadius:4, height:7, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4 }} />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Row 4: Upcoming Week + Recent Activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>📅 Upcoming This Week</div>
          {upcomingWeek.length === 0
            ? <div style={{ color:C.ink3, fontSize:12.5 }}>Nothing in the next 7 days. <span onClick={() => go('session-schedule')} style={{ color:C.blue, cursor:'pointer', fontWeight:600 }}>Add →</span></div>
            : upcomingWeek.map((item, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 0', borderBottom: i < upcomingWeek.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{item.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:12.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize:11, color:C.ink3 }}>{formatDate(item.date)} · {item.sub}</div>
                  </div>
                </div>
              ))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>🕐 Recent Activity</div>
          {activity.length === 0
            ? <div style={{ color:C.ink3, fontSize:12.5 }}>No recent activity yet.</div>
            : activity.map((a, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 0', borderBottom: i < activity.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{a.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:500, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize:11, color:C.ink3 }}>{formatDate(a.date)}</div>
                  </div>
                </div>
              ))}
        </div>
      </div>

    </>;
  }

  function PanelNotifications() {
    const colorMap = { gold: C.gold, blue: C.blue, green: C.green, red: C.red, teal: C.teal, purple: C.purple };
    return <>
      <SectionHead title="Notifications 🔔" />
      <Card>
        {notifList.length === 0
          ? <div style={{ color:'#888', padding:8 }}>Loading notifications…</div>
          : notifList.map((n, i) => (
              <TlItem key={i} dot={colorMap[n.color] || C.blue}
                title={`${n.icon} ${n.title}`} meta={n.meta} />
            ))}
      </Card>
    </>;
  }

  function PanelProfilePersonal() {
    function savePersonal() {
      if (!personalForm.name) { showToast('Full name is required.', 'warn'); return; }
      if (personalForm.aadhaar) {
        const aErr = fieldValidate('aadhaar', personalForm.aadhaar);
        if (aErr) { setAadhaarError(aErr); return; }
      }
      if (personalForm.pan) {
        const pErr = fieldValidate('pan', personalForm.pan);
        if (pErr) { setPanError(pErr); return; }
      }
      if (personalForm.email) {
        const eErr = fieldValidate('email', personalForm.email);
        if (eErr) { setEmailError(eErr); return; }
      }
      setPersonalSaving(true);
      api.updateMe({
        name: personalForm.name,
        dob: personalForm.dob || null,
        gender: personalForm.gender || null,
        category: personalForm.category || null,
        phone: personalForm.phone ? '+91' + personalForm.phone : null,
        email: personalForm.email || null,
        pan: personalForm.pan || null,
        preferred_sector: personalForm.sector || null,
      })
        .then(() => showToast('Personal information saved!'))
        .catch(e => showToast(e.message || 'Failed to save', 'error'))
        .finally(() => setPersonalSaving(false));
    }
    const pf = personalForm;
    const setPf = (key, val) => setPersonalForm(f => ({ ...f, [key]: val }));
    return <>
      <SectionHead title="Personal Information 👤" />
      <Card>
        <G>
          <Field label="Full Name"><Inp value={pf.name} onChange={e=>setPf('name',e.target.value)} /></Field>
          <Field label="Date of Birth"><Inp type="date" value={pf.dob} onChange={e=>setPf('dob',e.target.value)} /></Field>
        </G>
        <G>
          <Field label="Gender">
            <select value={pf.gender} onChange={e=>setPf('gender',e.target.value)}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['Male','Female','Other'].map(o=><option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={pf.category} onChange={e=>setPf('category',e.target.value)}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['General','OBC','SC','ST','EWS'].map(o=><option key={o}>{o}</option>)}
            </select>
          </Field>
        </G>
        <G>
          <Field label="Mobile Number">
            <div style={{ width:'100%' }}>
              <input value={pf.phone}
                onChange={e => { setPf('phone', e.target.value.replace(/\D/g,'').slice(0,10)); setPhoneError(''); }}
                onBlur={() => { const v = pf.phone; if (v) setPhoneError(/^[6-9]\d{9}$/.test(v) ? '' : 'Must be a 10-digit number starting with 6–9'); }}
                placeholder="10-digit mobile" maxLength={10}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${phoneError ? '#C0392B' : C.border}`,
                  borderRadius:8, fontSize:13.5, outline:'none', background: phoneError ? '#FEF2F2' : '#fafbfc',
                  fontFamily:'inherit', color:C.ink2, boxSizing:'border-box' }} />
              {phoneError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {phoneError}</div>}
            </div>
          </Field>
          <Field label="Email Address">
            <div style={{ width:'100%' }}>
              <input type="email" value={pf.email}
                onChange={e => { setPf('email', e.target.value); setEmailError(''); }}
                onBlur={() => { if (pf.email) setEmailError(fieldValidate('email', pf.email)); }}
                placeholder="trainer@example.com"
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${emailError ? '#C0392B' : C.border}`,
                  borderRadius:8, fontSize:13.5, outline:'none', background: emailError ? '#FEF2F2' : '#fafbfc',
                  fontFamily:'inherit', color:C.ink2, boxSizing:'border-box' }} />
              {emailError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {emailError}</div>}
            </div>
          </Field>
        </G>
        <G>
          <Field label="Aadhaar Number">
            <div style={{ width:'100%' }}>
              <input value={pf.aadhaar}
                onChange={e=>{ setPf('aadhaar', e.target.value.replace(/\D/g,'').slice(0,12)); setAadhaarError(''); }}
                onBlur={() => { if (pf.aadhaar) setAadhaarError(fieldValidate('aadhaar', pf.aadhaar)); }}
                placeholder="12-digit Aadhaar" maxLength={12}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${aadhaarError ? '#C0392B' : C.border}`,
                  borderRadius:8, fontSize:13.5, outline:'none', background: aadhaarError ? '#FEF2F2' : '#fafbfc',
                  fontFamily:'inherit', color:C.ink2, boxSizing:'border-box' }} />
              {aadhaarError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {aadhaarError}</div>}
            </div>
          </Field>
          <Field label="PAN Number">
            <div style={{ width:'100%' }}>
              <input value={pf.pan}
                onChange={e=>{ setPf('pan', e.target.value.toUpperCase().slice(0,10)); setPanError(''); }}
                onBlur={() => { if (pf.pan) setPanError(fieldValidate('pan', pf.pan)); }}
                placeholder="ABCDE1234F" maxLength={10}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${panError ? '#C0392B' : C.border}`,
                  borderRadius:8, fontSize:13.5, outline:'none', background: panError ? '#FEF2F2' : '#fafbfc',
                  fontFamily:'inherit', color:C.ink2, boxSizing:'border-box' }} />
              {panError && <div style={{ color:'#C0392B', fontSize:11, marginTop:3, fontWeight:500 }}>⚠ {panError}</div>}
            </div>
          </Field>
        </G>
        <G>
          <Field label="Primary Sector">
            <select value={pf.sector} onChange={e=>setPf('sector',e.target.value)}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              <option value="">— Select Sector —</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </G>
        <div style={{ textAlign:'right' }}>
          <Btn primary onClick={savePersonal} disabled={personalSaving}>
            {personalSaving ? '⏳ Saving…' : '💾 Save Changes'}
          </Btn>
        </div>
      </Card>
    </>;
  }

  function PanelProfileQualifications() {
    function submitQual() {
      if (!qualForm.degree || !qualForm.institution || !qualForm.year) {
        showToast('Please fill in Degree, Institution and Year.', 'warn'); return;
      }
      const yearErr = validatePassingYear(qualForm.year, 'Year of Passing');
      if (yearErr) { showToast(yearErr, 'warn'); return; }
      const scoreErr = validateScore(qualForm.score);
      if (scoreErr) { showToast(scoreErr, 'warn'); return; }
      api.addTrainerQualification({ degree: qualForm.degree, institution: qualForm.institution, year: qualForm.year, score: qualForm.score })
        .then(row => {
          setQualList(prev => [...prev, { id: row.id, degree: row.degree, institution: row.institution, year: row.year || '', score: row.score || '' }]);
          setQualForm({ degree:'', institution:'', year:'', score:'' });
          setShowAddQual(false);
          showToast('Qualification saved!');
        })
        .catch(err => showToast(err.message || 'Failed to save qualification', 'error'));
    }
    return <>
      <SectionHead title="Educational Qualifications 🎓" />
      <Card>
        <Table headers={['Degree','Institution','Year','Score']} rows={qualList.map((q,i) =>
          <tr key={i}><Td>{q.degree}</Td><Td>{q.institution}</Td><Td>{q.year}</Td><Td>{q.score || '—'}</Td></tr>
        )} />
        {showAddQual && (
          <div style={{ marginTop:16, padding:16, background:C.bluePale, borderRadius:10, border:`1px solid ${C.border}` }}>
            <G>
              <Field label="Degree / Course"><Inp value={qualForm.degree} onChange={e => setQualForm(f=>({...f,degree:e.target.value}))} placeholder="e.g. B.Tech Computer Science" maxLength={150} /></Field>
              <Field label="Institution"><Inp value={qualForm.institution} onChange={e => setQualForm(f=>({...f,institution:e.target.value}))} placeholder="e.g. NIT Warangal" maxLength={150} /></Field>
            </G>
            <G>
              <Field label="Year of Passing"><Inp value={qualForm.year} onChange={e => setQualForm(f=>({...f,year:e.target.value}))} placeholder="e.g. 2010" /></Field>
              <Field label="Score / Grade"><Inp value={qualForm.score} onChange={e => setQualForm(f=>({...f,score:e.target.value}))} placeholder="e.g. 8.4 CGPA or 85%" /></Field>
            </G>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn onClick={() => setShowAddQual(false)}>Cancel</Btn>
              <Btn primary onClick={submitQual}>💾 Save Qualification</Btn>
            </div>
          </div>
        )}
        <div style={{ marginTop:14 }}>
          <Btn primary onClick={() => setShowAddQual(v => !v)}>
            {showAddQual ? '✕ Cancel' : '+ Add Qualification'}
          </Btn>
        </div>
      </Card>
    </>;
  }

  function PanelProfileExperience() {
    function submitExp() {
      if (!expForm.org || !expForm.role || !expForm.from) {
        showToast('Please fill in Organisation, Role and From date.', 'warn'); return;
      }
      const fromErr = validateMonthYear(expForm.from, 'From date');
      if (fromErr) { showToast(fromErr, 'warn'); return; }
      const toErr = validateMonthYear(expForm.to, 'To date');
      if (toErr) { showToast(toErr, 'warn'); return; }
      api.addTrainerExperience({ org: expForm.org, role: expForm.role, from_date: expForm.from, to_date: expForm.to || 'Present', sector: expForm.sector })
        .then(row => {
          setExpList(prev => [...prev, { id: row.id, org: row.org, role: row.role, from: row.from_date || '', to: row.to_date || '', sector: row.sector || '' }]);
          setExpForm({ org:'', role:'', from:'', to:'', sector:'' });
          setShowAddExp(false);
          showToast('Experience saved!');
        })
        .catch(err => showToast(err.message || 'Failed to save experience', 'error'));
    }
    return <>
      <SectionHead title="Work Experience 💼" />
      <Card>
        <Table headers={['Organisation','Role','From','To','Sector']} rows={expList.map((e,i) =>
          <tr key={i}><Td>{e.org}</Td><Td>{e.role}</Td><Td>{e.from}</Td><Td>{e.to}</Td><Td>{e.sector||'—'}</Td></tr>
        )} />
        {showAddExp && (
          <div style={{ marginTop:16, padding:16, background:C.bluePale, borderRadius:10, border:`1px solid ${C.border}` }}>
            <G>
              <Field label="Organisation *"><Inp value={expForm.org} onChange={e => setExpForm(f=>({...f,org:e.target.value}))} placeholder="e.g. Infosys" maxLength={150} /></Field>
              <Field label="Role / Designation *"><Inp value={expForm.role} onChange={e => setExpForm(f=>({...f,role:e.target.value}))} placeholder="e.g. Senior Trainer" maxLength={100} /></Field>
            </G>
            <G cols={3}>
              <Field label="From *"><Inp value={expForm.from} onChange={e => setExpForm(f=>({...f,from:e.target.value}))} placeholder="e.g. Jan 2020" /></Field>
              <Field label="To"><Inp value={expForm.to} onChange={e => setExpForm(f=>({...f,to:e.target.value}))} placeholder="Present" /></Field>
              <Field label="Sector"><Inp value={expForm.sector} onChange={e => setExpForm(f=>({...f,sector:e.target.value}))} placeholder="e.g. IT-ITeS" maxLength={100} /></Field>
            </G>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn onClick={() => setShowAddExp(false)}>Cancel</Btn>
              <Btn primary onClick={submitExp}>💾 Save Experience</Btn>
            </div>
          </div>
        )}
        <div style={{ marginTop:14 }}>
          <Btn primary onClick={() => setShowAddExp(v => !v)}>
            {showAddExp ? '✕ Cancel' : '+ Add Experience'}
          </Btn>
        </div>
      </Card>
    </>;
  }

  function PanelProfileExpertise() {
    function submitSkill() {
      if (!skillForm.domain || !skillForm.courses) {
        showToast('Please fill in Domain and Courses.', 'warn'); return;
      }
      const yrsErr = validatePositiveNum(skillForm.yearsExp, 'Years of experience', 0, 60);
      if (yrsErr) { showToast(yrsErr, 'warn'); return; }
      api.addTrainerSkill({ domain: skillForm.domain, courses: skillForm.courses, ssc: skillForm.ssc, nsqf_level: skillForm.nsqfLevel, years_exp: skillForm.yearsExp })
        .then(row => {
          setSkillList(prev => [...prev, { id: row.id, domain: row.domain, courses: row.courses || '', ssc: row.ssc || '', nsqfLevel: row.nsqf_level || '', yearsExp: row.years_exp || '' }]);
          setSkillForm({ domain:'', courses:'', ssc:'', nsqfLevel:'', yearsExp:'' });
          setShowAddSkill(false);
          showToast('Domain & skills saved!');
        })
        .catch(err => showToast(err.message || 'Failed to save skill', 'error'));
    }
    return <>
      <SectionHead title="Domain & Skills 🛠️" />
      <Card>
        <Table headers={['Domain','Courses','Sector Skill Council','NSQF Level','Exp (yrs)']} rows={skillList.map((s,i) =>
          <tr key={i}>
            <Td>{s.domain}</Td>
            <Td>{s.courses}</Td>
            <Td>{s.ssc || '—'}</Td>
            <Td>{s.nsqfLevel || '—'}</Td>
            <Td>{s.yearsExp || '—'}</Td>
          </tr>
        )} />
        {showAddSkill && (
          <div style={{ marginTop:16, padding:16, background:C.bluePale, borderRadius:10, border:`1px solid ${C.border}` }}>
            <G>
              <Field label="Domain">
                <select value={skillForm.domain} onChange={e => setSkillForm(f=>({...f,domain:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }}>
                  <option value="">— Select Domain —</option>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Courses You Can Train">
                <Inp value={skillForm.courses} onChange={e => setSkillForm(f=>({...f,courses:e.target.value}))} placeholder="e.g. React.js, Node.js, Python" maxLength={300} />
              </Field>
            </G>
            <G>
              <Field label="Sector Skill Council">
                <Inp value={skillForm.ssc} onChange={e => setSkillForm(f=>({...f,ssc:e.target.value}))} placeholder="e.g. IT-ITeS SSC (NASSCOM)" maxLength={100} />
              </Field>
              <Field label="NSQF Level">
                <select value={skillForm.nsqfLevel} onChange={e => setSkillForm(f=>({...f,nsqfLevel:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }}>
                  <option value="">— Select Level —</option>
                  {NSQF_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
            </G>
            <Field label="Years of Training Experience">
              <Inp value={skillForm.yearsExp} onChange={e => setSkillForm(f=>({...f,yearsExp:e.target.value}))} placeholder="e.g. 6" />
            </Field>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn onClick={() => setShowAddSkill(false)}>Cancel</Btn>
              <Btn primary onClick={submitSkill}>💾 Save Domain & Skills</Btn>
            </div>
          </div>
        )}
        <div style={{ marginTop:14 }}>
          <Btn primary onClick={() => setShowAddSkill(v => !v)}>
            {showAddSkill ? '✕ Cancel' : '+ Add Domain & Skills'}
          </Btn>
        </div>
      </Card>
    </>;
  }

  function PanelProfileCertifications() {
    function submitCert() {
      if (!certForm.cert_name || !certForm.issuing_body) { showToast('Certification name and issuing body are required.', 'warn'); return; }
      const yearErr = validatePassingYear(certForm.year, 'Year of certification');
      if (yearErr) { showToast(yearErr, 'warn'); return; }
      api.addTrainerCertification(certForm)
        .then(r => { setCertList(p => [...p, r]); setCertForm({ cert_name:'', issuing_body:'', year:'', valid_until:'' }); setShowAddCert(false); showToast('Certification saved!'); })
        .catch(e => showToast(e.message || 'Failed to save', 'error'));
    }
    return <>
      <SectionHead title="Certifications & Awards 🏅" />
      <Card>
        <Table headers={['Certification','Issuing Body','Year','Valid Until','']} rows={certList.map(c =>
          <tr key={c.id}><Td>{c.cert_name}</Td><Td>{c.issuing_body}</Td><Td>{c.year||'—'}</Td><Td>{c.valid_until||'—'}</Td>
          <Td><Btn sm onClick={() => api.deleteTrainerCertification(c.id).then(() => setCertList(p=>p.filter(x=>x.id!==c.id)))} style={{ background:C.red }}>Delete</Btn></Td></tr>
        )} />
        {showAddCert && (
          <div style={{ marginTop:16, padding:16, background:C.bluePale, borderRadius:10, border:`1px solid ${C.border}` }}>
            <G><Field label="Certification Name *"><Inp value={certForm.cert_name} onChange={e=>setCertForm(f=>({...f,cert_name:e.target.value}))} placeholder="e.g. Certified Trainer (PMKVY)" maxLength={200} /></Field>
            <Field label="Issuing Body *"><Inp value={certForm.issuing_body} onChange={e=>setCertForm(f=>({...f,issuing_body:e.target.value}))} placeholder="e.g. NSDC" maxLength={200} /></Field></G>
            <G><Field label="Year"><Inp value={certForm.year} onChange={e=>setCertForm(f=>({...f,year:e.target.value}))} placeholder="e.g. 2021" /></Field>
            <Field label="Valid Until"><Inp value={certForm.valid_until} onChange={e=>setCertForm(f=>({...f,valid_until:e.target.value}))} placeholder="e.g. 2026 or Lifetime" /></Field></G>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn onClick={()=>setShowAddCert(false)}>Cancel</Btn>
              <Btn primary onClick={submitCert}>💾 Save Certification</Btn>
            </div>
          </div>
        )}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddCert(v=>!v)}>{showAddCert?'✕ Cancel':'+ Add Certification'}</Btn></div>
      </Card>
    </>;
  }

  function PanelProfileDocs() {
    const statusColor = { Verified:'green', Submitted:'blue', 'Under Review':'gold', Rejected:'red' };

    function submitDoc() {
      if (!docForm.doc_type) { showToast('Please select a document type.', 'warn'); return; }
      if (!docForm._file) { showToast('Please choose a file to upload.', 'warn'); return; }
      const fd = new FormData();
      fd.append('doc_type', docForm.doc_type);
      fd.append('file', docForm._file);
      setDocUploading(true);
      api.addTrainerDocument(fd)
        .then(r => {
          setDocList(p => [...p, r]);
          setDocForm({ doc_type:'', file_name:'', _file: null });
          setShowAddDoc(false);
          showToast('Document uploaded successfully!');
        })
        .catch(e => showToast(e.message || 'Upload failed', 'error'))
        .finally(() => setDocUploading(false));
    }

    return <>
      <SectionHead title="Documents & KYC 📄" />
      <Card>
        <Table headers={['Document','File','Status','Uploaded','']} rows={docList.map(d =>
          <tr key={d.id}>
            <Td>{d.doc_type}</Td>
            <Td>{d.file_name
              ? <a href={api.downloadTrainerDocument(d.id) + '?token=' + localStorage.getItem('snj_token')}
                  target="_blank" rel="noreferrer"
                  style={{ color: C.blue, textDecoration:'none', fontWeight:600 }}>
                  📎 {d.file_name}
                </a>
              : '—'}
            </Td>
            <Td><Badge color={statusColor[d.status]||'blue'}>{d.status}</Badge></Td>
            <Td>{d.created_at ? d.created_at.slice(0,10) : '—'}</Td>
            <Td><Btn sm onClick={()=>api.deleteTrainerDocument(d.id).then(()=>setDocList(p=>p.filter(x=>x.id!==d.id)))} style={{ background:C.red }}>Delete</Btn></Td>
          </tr>
        )} />

        {showAddDoc && (
          <div style={{ marginTop:16, padding:16, background:C.bluePale, borderRadius:10, border:`1px solid ${C.border}` }}>
            <Field label="Document Type *">
              <select value={docForm.doc_type} onChange={e=>setDocForm(f=>({...f,doc_type:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">— Select —</option>
                {['Aadhaar Card','PAN Card','Passport','Degree Certificate','PMKVY Trainer Certificate','Experience Letter','Bank Passbook','Other'].map(d=><option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Choose File *">
              <div style={{ marginTop:4 }}>
                <label style={{ display:'inline-block', padding:'8px 16px', background:C.blue, color:'#fff', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  📁 Browse File
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    style={{ display:'none' }}
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) setDocForm(f => ({ ...f, _file: file, file_name: file.name }));
                    }} />
                </label>
                {docForm._file && (
                  <span style={{ marginLeft:12, fontSize:13, color:C.ink2 }}>
                    ✅ {docForm._file.name} ({(docForm._file.size/1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              <div style={{ marginTop:6, fontSize:12, color:'#888' }}>Supported: PDF, JPG, PNG, DOC · Max 10 MB</div>
            </Field>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:12 }}>
              <Btn onClick={()=>{ setShowAddDoc(false); setDocForm({ doc_type:'', file_name:'', _file:null }); }}>Cancel</Btn>
              <Btn primary onClick={submitDoc} disabled={docUploading}>
                {docUploading ? '⏳ Uploading…' : '📤 Upload Document'}
              </Btn>
            </div>
          </div>
        )}

        <div style={{ marginTop:14 }}>
          <Btn primary onClick={()=>setShowAddDoc(v=>!v)}>{showAddDoc ? '✕ Cancel' : '📤 Upload Document'}</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelBatchActive() {
    const active = myBatches.filter(b => b.status === 'active');
    const totalLearners = active.reduce((s, b) => s + (b.learner_count || 0), 0);
    const avgAtt = active.length ? Math.round(active.reduce((s,b) => s + (b.avg_attendance||0), 0) / active.length) : 0;
    return <>
      <SectionHead title="Active Batches 📋" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard icon="📋" value={active.length || dbStats.myActiveBatches || 0} label="Active Batches" sub="" accent={C.blue} />
        <KpiCard icon="👥" value={totalLearners || dbStats.myLearners || 0} label="Total Learners" sub="" accent={C.teal} />
        <KpiCard icon="✅" value={`${avgAtt || dbStats.avgAttendance || 0}%`} label="Avg Attendance" sub="" accent={C.green} />
        <KpiCard icon="📅" value={myBatches.length || dbStats.myBatches || 0} label="All My Batches" sub="" accent={C.gold} />
      </div>
      <Card>
        {!batchesLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         active.length === 0 ? <div style={{ color:'#888', padding:16 }}>No active batches. <span style={{ color:C.blue, cursor:'pointer' }} onClick={() => go('batch-create')}>Create one →</span></div> :
        <Table headers={['Batch Code','Name','Course','Learners','Avg Attendance','Action']} rows={active.map(b => <tr key={b.id}>
          <Td>{b.batch_code}</Td><Td>{b.name}</Td><Td>{b.course_title || '—'}</Td>
          <Td>{b.learner_count || 0}</Td>
          <Td>{b.avg_attendance ? `${Math.round(b.avg_attendance)}%` : '—'}</Td>
          <Td><Btn sm primary onClick={() => loadLearnersForBatch(b.id)}>Learners</Btn></Td>
        </tr>)} />}
        {selectedBatchId && <div style={{ marginTop:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <CardTitle style={{ margin:0 }}>👥 Learners in selected batch</CardTitle>
            <Btn sm primary onClick={() => setEnrolModal(selectedBatchId)}>+ Enrol Learner</Btn>
          </div>
          {batchLearners.length === 0
            ? <div style={{ color:'#888', padding:8 }}>No learners yet. Click "Enrol Learner" to add one.</div>
            : <Table headers={['Name','Email','Attendance','Score','Status']} rows={batchLearners.map(l => <tr key={l.id}>
                <Td>{l.name}</Td><Td>{l.email}</Td>
                <Td>{l.attendance_pct != null ? `${Math.round(l.attendance_pct)}%` : '—'}</Td>
                <Td>{l.assessment_score != null ? l.assessment_score : '—'}</Td>
                <Td><Badge color={l.status==='completed'?'green':l.status==='dropped'?'red':'blue'}>{l.status}</Badge></Td>
              </tr>)} />
          }
        </div>}
        <div style={{ marginTop:14 }}><Btn onClick={() => go('batch-create')}>+ Create New Batch</Btn></div>
      </Card>
    </>;
  }

  function PanelBatchUpcoming() {
    const upcoming = myBatches.filter(b => b.status === 'upcoming');
    return <>
      <SectionHead title="Upcoming Batches 📅" />
      <Card>
        {!batchesLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         upcoming.length === 0 ? <div style={{ color:'#888', padding:16 }}>No upcoming batches.</div> :
        <Table headers={['Batch Code','Name','Start Date','Capacity','Action']} rows={upcoming.map(b => <tr key={b.id}>
          <Td>{b.batch_code}</Td><Td>{b.name}</Td>
          <Td>{b.start_date || '—'}</Td><Td>{b.capacity || 30}</Td>
          <Td><Btn sm primary onClick={() => api.updateBatch(b.id, { status:'active' }).then(refreshBatches)}>Start</Btn>
          {' '}<Btn sm onClick={() => api.deleteBatch(b.id).then(refreshBatches)} style={{ background:C.red }}>Delete</Btn></Td>
        </tr>)} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={() => go('batch-create')}>+ Plan New Batch</Btn></div>
      </Card>
    </>;
  }

  function PanelBatchCompleted() {
    const completed = myBatches.filter(b => b.status === 'completed');
    return <>
      <SectionHead title="Completed Batches ✅" />
      <Card>
        {!batchesLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         completed.length === 0 ? <div style={{ color:'#888', padding:16 }}>No completed batches yet.</div> :
        <Table headers={['Batch Code','Name','Course','Learners','Start','End']} rows={completed.map(b => <tr key={b.id}>
          <Td>{b.batch_code}</Td><Td>{b.name}</Td><Td>{b.course_title || '—'}</Td>
          <Td>{b.learner_count || 0}</Td><Td>{b.start_date || '—'}</Td><Td>{b.end_date || '—'}</Td>
        </tr>)} />}
      </Card>
    </>;
  }

  function PanelBatchCreate() {
    const bf = batchForm;
    const set = k => e => setBatchForm(f => ({ ...f, [k]: e.target.value }));
    const sel = (k, opts, labelFn) => (
      <select value={bf[k]} onChange={set(k)} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
        {opts.map(o => <option key={typeof o === 'object' ? o.id : o} value={typeof o === 'object' ? o.id : o}>{typeof o === 'object' ? labelFn(o) : o}</option>)}
      </select>
    );
    async function handleCreate() {
      if (!bf.name.trim()) { setBatchMsg('Batch name is required.'); return; }
      if (bf.batch_code && !/^[A-Za-z0-9][A-Za-z0-9\-_]{1,19}$/.test(bf.batch_code.trim())) {
        setBatchMsg('Batch code must be 2–20 characters (letters, digits, dash or underscore).'); return;
      }
      const capErr = validatePosInt(bf.capacity, 'Capacity', 1000);
      if (capErr) { setBatchMsg(capErr); return; }
      setBatchSaving(true); setBatchMsg('');
      try {
        await api.createBatch({ name: bf.name, batch_code: bf.batch_code, course_id: bf.course_id || null, start_date: bf.start_date, end_date: bf.end_date, capacity: Number(bf.capacity)||30, status: bf.status, scheme_type: bf.scheme_type || 'None', mode: bf.mode, venue: bf.venue });
        setBatchMsg('✅ Batch created!');
        setBatchForm({ name:'', batch_code:'', course_id:'', start_date:'', end_date:'', capacity:30, status:'upcoming', scheme_type:'None', mode:'Classroom', venue:'' });
        refreshBatches();
      } catch(e) { setBatchMsg('❌ ' + e.message); }
      setBatchSaving(false);
    }
    const inp = (k, placeholder, type='text') => <input value={bf[k]} onChange={set(k)} placeholder={placeholder} type={type} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, outline:'none', background:'#fafbfc', fontFamily:'inherit' }} />;
    return <>
      <SectionHead title="Create New Batch 🆕" />
      {batchMsg && <Alert type={batchMsg.startsWith('✅') ? 'info' : 'red'}>{batchMsg}</Alert>}
      <Card>
        <G><Field label="Batch Name *">{inp('name', 'e.g. React.js Batch July 2026')}</Field><Field label="Batch Code">{inp('batch_code', 'e.g. IT-2026-B5')}</Field></G>
        <Field label="Course (optional)">
          <select value={bf.course_id} onChange={set('course_id')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
            <option value="">— No course linked —</option>
            {courseOpts.map(c => <option key={c.id} value={c.id}>{c.title}{c.provider ? ` (${c.provider})` : ''}</option>)}
          </select>
        </Field>
        <G cols={3}><Field label="Start Date">{inp('start_date', '', 'date')}</Field><Field label="End Date">{inp('end_date', '', 'date')}</Field><Field label="Capacity">{inp('capacity', '30', 'number')}</Field></G>
        <G>
          <Field label="Venue / Location">{inp('venue', 'e.g. Lab 2 / Online')}</Field>
          <Field label="Mode"><select value={bf.mode} onChange={set('mode')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
            {['Classroom','Online','Hybrid'].map(m=><option key={m}>{m}</option>)}
          </select></Field>
        </G>
        <G cols={2}>
          <Field label="Status"><select value={bf.status} onChange={set('status')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
            {['upcoming','active','completed'].map(s=><option key={s}>{s}</option>)}
          </select></Field>
          <Field label="Govt Scheme"><select value={bf.scheme_type} onChange={set('scheme_type')} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
            {['None','PMKVY','RPL','NAPS','DDU-GKY','Other'].map(s=><option key={s}>{s}</option>)}
          </select></Field>
        </G>
        <div style={{ textAlign:'right', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn primary onClick={handleCreate} disabled={batchSaving}>🚀 Create Batch</Btn>
        </div>
      </Card>
    </>;
  }

  function PanelSessionSchedule() {
    if (!batchesLoaded) loadBatches();
    function submitSession() {
      if (!sessionForm.topic || !sessionForm.session_date) { showToast('Topic and date are required.', 'warn'); return; }
      const durErr = validatePositiveNum(sessionForm.duration_hrs, 'Duration', 0.5, 24);
      if (durErr) { showToast(durErr, 'warn'); return; }
      const batch = myBatches.find(b => String(b.id) === String(sessionForm.batch_id));
      api.addTrainerSession({ ...sessionForm, batch_id: sessionForm.batch_id || null })
        .then(r => {
          setSessionList(p => [...p, { ...r, batch_code: batch?.batch_code || '' }]);
          setSessionForm({ batch_id:'', topic:'', session_date:'', start_time:'', duration_hrs:'2', venue:'', mode:'Classroom' });
          setShowAddSession(false);
          showToast('Session scheduled!');
        })
        .catch(e => showToast(e.message||'Failed','error'));
    }
    const modeColor = { Classroom:'blue', Online:'teal', Hybrid:'gold' };
    return <>
      <SectionHead title="Schedule Sessions 📅" />
      {showAddSession && (
        <Card>
          <CardTitle>New Session</CardTitle>
          <G>
            <Field label="Batch">
              <select value={sessionForm.batch_id} onChange={e=>setSessionForm(f=>({...f,batch_id:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">— Select Batch —</option>
                {myBatches.map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.name}</option>)}
              </select>
            </Field>
            <Field label="Topic *"><Inp value={sessionForm.topic} onChange={e=>setSessionForm(f=>({...f,topic:e.target.value}))} placeholder="e.g. React Hooks Deep Dive" /></Field>
          </G>
          <G cols={3}>
            <Field label="Date *"><Inp type="date" value={sessionForm.session_date} onChange={e=>setSessionForm(f=>({...f,session_date:e.target.value}))} /></Field>
            <Field label="Start Time"><Inp type="time" value={sessionForm.start_time} onChange={e=>setSessionForm(f=>({...f,start_time:e.target.value}))} /></Field>
            <Field label="Duration (hrs)"><Inp value={sessionForm.duration_hrs} onChange={e=>setSessionForm(f=>({...f,duration_hrs:e.target.value}))} placeholder="2" /></Field>
          </G>
          <G>
            <Field label="Venue / Link"><Inp value={sessionForm.venue} onChange={e=>setSessionForm(f=>({...f,venue:e.target.value}))} placeholder="Lab 3 / https://meet.google.com/..." /></Field>
            <Field label="Mode">
              <select value={sessionForm.mode} onChange={e=>setSessionForm(f=>({...f,mode:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                {['Classroom','Online','Hybrid'].map(m=><option key={m}>{m}</option>)}
              </select>
            </Field>
          </G>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowAddSession(false)}>Cancel</Btn>
            <Btn primary onClick={submitSession}>📅 Schedule Session</Btn>
          </div>
        </Card>
      )}
      <Card>
        {sessionList.length === 0 ? <div style={{ color:'#888', padding:8 }}>No sessions scheduled yet.</div> :
        <Table headers={['Date','Time','Batch','Topic','Venue','Mode','']} rows={sessionList.map(s =>
          <tr key={s.id}>
            <Td>{s.session_date}</Td><Td>{s.start_time||'—'}</Td>
            <Td>{s.batch_code||'—'}</Td><Td>{s.topic}</Td>
            <Td>{s.venue||'—'}</Td>
            <Td><Badge color={modeColor[s.mode]||'blue'}>{s.mode}</Badge></Td>
            <Td><Btn sm onClick={()=>api.deleteTrainerSession(s.id).then(()=>setSessionList(p=>p.filter(x=>x.id!==s.id)))} style={{ background:C.red }}>Delete</Btn></Td>
          </tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddSession(v=>!v)}>{showAddSession?'✕ Cancel':'+ Schedule New Session'}</Btn></div>
      </Card>
    </>;
  }

  function PanelSessionToday() {
    const today = new Date().toISOString().slice(0,10);
    const todaySessions = sessionList.filter(s => s.session_date === today);
    return <>
      <SectionHead title="Today's Sessions 📆" />
      <Card>
        {todaySessions.length === 0
          ? <Alert type="info">No sessions scheduled for today ({today}).</Alert>
          : <Table headers={['Batch','Topic','Start','Venue','Mode']} rows={todaySessions.map(s =>
              <tr key={s.id}><Td>{s.batch_code||'—'}</Td><Td>{s.topic}</Td><Td>{s.start_time||'—'}</Td><Td>{s.venue||'—'}</Td><Td>{s.mode}</Td></tr>
            )} />
        }
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>go('session-schedule')}>+ Schedule Session</Btn></div>
      </Card>
    </>;
  }

  function PanelSessionCalendar() {
    const upcoming = sessionList.filter(s => s.session_date >= new Date().toISOString().slice(0,10)).slice(0,20);
    return <>
      <SectionHead title="Training Calendar 🗓️" />
      <Card>
        {upcoming.length === 0
          ? <Alert type="info">No upcoming sessions. Go to Schedule Sessions to add some.</Alert>
          : <Table headers={['Date','Time','Batch','Topic','Venue','Mode']} rows={upcoming.map(s =>
              <tr key={s.id}><Td>{s.session_date}</Td><Td>{s.start_time||'—'}</Td><Td>{s.batch_code||'—'}</Td><Td>{s.topic}</Td><Td>{s.venue||'—'}</Td><Td>{s.mode}</Td></tr>
            )} />
        }
      </Card>
    </>;
  }

  function PanelSessionReschedule() {
    const sel = sessionList.find(s => String(s.id) === reschedSelId);
    function doReschedule() {
      if (!reschedSelId || !reschedDate) { showToast('Select a session and new date.', 'warn'); return; }
      api.updateTrainerSession(reschedSelId, { ...sel, session_date: reschedDate, start_time: reschedTime||sel.start_time, status:'scheduled' })
        .then(() => { setSessionList(p => p.map(s => String(s.id)===reschedSelId ? { ...s, session_date:reschedDate, start_time:reschedTime||s.start_time } : s)); showToast('Session rescheduled!'); setReschedSelId(''); setReschedDate(''); setReschedTime(''); })
        .catch(e => showToast(e.message||'Failed','error'));
    }
    function doCancel() {
      if (!reschedSelId) { showToast('Select a session to cancel.', 'warn'); return; }
      api.deleteTrainerSession(reschedSelId)
        .then(() => { setSessionList(p=>p.filter(s=>String(s.id)!==reschedSelId)); showToast('Session cancelled.', 'warn'); setReschedSelId(''); })
        .catch(e => showToast(e.message||'Failed','error'));
    }
    return <>
      <SectionHead title="Reschedule / Cancel Session ⚠️" />
      <Card>
        <Field label="Select Session">
          <select value={reschedSelId} onChange={e=>setReschedSelId(e.target.value)}
            style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
            <option value="">— Select Session —</option>
            {sessionList.map(s=><option key={s.id} value={s.id}>{s.session_date} · {s.topic} ({s.batch_code||'No batch'})</option>)}
          </select>
        </Field>
        <G><Field label="New Date"><Inp type="date" value={reschedDate} onChange={e=>setReschedDate(e.target.value)} /></Field>
        <Field label="New Start Time"><Inp type="time" value={reschedTime} onChange={e=>setReschedTime(e.target.value)} /></Field></G>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn onClick={doCancel} style={{ background:C.red, color:'#fff' }}>❌ Cancel Session</Btn>
          <Btn primary onClick={doReschedule}>🔄 Reschedule</Btn>
        </div>
      </Card>
    </>;
  }

  // attendance panel state lives at component level (Rules of Hooks)
  const [attSelBatch, setAttSelBatch] = useState('');
  const [attLearners, setAttLearners] = useState([]);
  const [attMarks, setAttMarks] = useState({});
  const [attMsg, setAttMsg] = useState('');
  const [attSaving, setAttSaving] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0,10));

  function onAttBatchChange(id) {
    setAttSelBatch(id);
    if (!id) { setAttLearners([]); return; }
    api.batchLearners(id).then(l => {
      setAttLearners(l);
      const init = {};
      l.forEach(lr => { init[lr.candidate_id] = true; });
      setAttMarks(init);
    }).catch(() => {});
  }

  async function submitAttendance() {
    if (!attSelBatch || !attDate) { setAttMsg('Select a batch and date.'); return; }
    setAttSaving(true); setAttMsg('');
    try {
      const records = attLearners.map(l => ({ candidate_id: l.candidate_id, present: attMarks[l.candidate_id] ? 1 : 0 }));
      await api.markAttendance(attSelBatch, attDate, records);
      setAttMsg('✅ Attendance saved!');
    } catch(e) { setAttMsg('❌ ' + e.message); }
    setAttSaving(false);
  }

  function PanelAttendanceMark() {
    return <>
      <SectionHead title="Mark Attendance ✅" />
      {attMsg && <Alert type={attMsg.startsWith('✅') ? 'info' : 'red'}>{attMsg}</Alert>}
      <Card>
        <G cols={2}>
          <Field label="Batch">
            <select value={attSelBatch} onChange={e => onAttBatchChange(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              <option value="">— Select Batch —</option>
              {myBatches.filter(b=>b.status==='active').map(b => <option key={b.id} value={b.id}>{b.batch_code} · {b.name}</option>)}
            </select>
          </Field>
          <Field label="Session Date">
            <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde2eb', borderRadius:8, fontSize:13.5 }} />
          </Field>
        </G>
      </Card>
      {attLearners.length > 0 && <Card>
        <CardTitle>👥 Learner Attendance</CardTitle>
        <Table headers={['Name','Email','Present']} rows={attLearners.map(l => <tr key={l.candidate_id}>
          <Td>{l.name}</Td><Td>{l.email}</Td>
          <Td><input type="checkbox" checked={!!attMarks[l.candidate_id]}
            onChange={e => setAttMarks(m => ({ ...m, [l.candidate_id]: e.target.checked }))} /></Td>
        </tr>)} />
        <div style={{ marginTop:14, textAlign:'right' }}>
          <Btn primary onClick={submitAttendance} disabled={attSaving}>💾 Submit Attendance</Btn>
        </div>
      </Card>}
    </>;
  }

  function PanelAttendanceReports() {
    return <>
      <SectionHead title="Attendance Reports 📊" />
      <Card>
        {reportAtt.length === 0 ? <div style={{ color:'#888', padding:8 }}>No attendance data yet. Mark attendance to see reports.</div> :
        <Table headers={['Batch','Sessions','Avg Attendance','Below 60%']} rows={reportAtt.map(b =>
          <tr key={b.id}>
            <Td>{b.batch_code} · {b.name}</Td>
            <Td>{b.sessions||0}</Td>
            <Td><Badge color={b.avg_att>=80?'green':b.avg_att>=60?'gold':'red'}>{b.avg_att!=null?`${b.avg_att}%`:'—'}</Badge></Td>
            <Td>{b.below60||0}</Td>
          </tr>
        )} />}
      </Card>
    </>;
  }

  function PanelAttendanceSummary() {
    return <>
      <SectionHead title="Batch-wise Attendance Summary 📈" />
      <Card>
        {reportAtt.length === 0 ? <div style={{ color:'#888', padding:8 }}>No attendance data yet.</div> :
        reportAtt.map(b => <StatRow key={b.id} n={b.avg_att!=null?`${b.avg_att}%`:'—'} label={`${b.batch_code} · ${b.name}`} pct={b.avg_att||0} color={b.avg_att>=80?C.green:b.avg_att>=60?C.gold:C.red} />)}
      </Card>
    </>;
  }

  function PanelLearnerList() {
    if (!batchesLoaded) loadBatches();
    return <>
      <SectionHead title="All Learners 👥" />
      <Card>
        {!allLearnersLoaded ? <div style={{ color:'#888', padding:16 }}>Loading…</div> :
         allLearners.length === 0 ? <div style={{ color:'#888', padding:16 }}>No learners enrolled in your batches yet.</div> :
        <Table headers={['Name','Email','Phone','Batch','Attendance','Score','Status']} rows={allLearners.map(l => <tr key={`${l.batch_id}-${l.candidate_id}`}>
          <Td>{l.name}</Td>
          <Td>{l.email||'—'}</Td>
          <Td>{l.phone||'—'}</Td>
          <Td>{l.batchCode}</Td>
          <Td>{l.attendance_pct != null ? <Badge color={l.attendance_pct>=75?'green':l.attendance_pct>=60?'gold':'red'}>{Math.round(l.attendance_pct)}%</Badge> : '—'}</Td>
          <Td>{l.assessment_score != null ? l.assessment_score : '—'}</Td>
          <Td><Badge color={l.status==='completed'?'green':l.status==='dropped'?'red':'blue'}>{l.status}</Badge></Td>
        </tr>)} />}
      </Card>
    </>;
  }

  function PanelLearnerProgress() {
    return <>
      <SectionHead title="Learning Progress 📈" />
      <Card>
        {reportBatch.length === 0
          ? <div style={{ color:'#888', padding:8 }}>No batch data yet. Create batches and enrol learners to see progress.</div>
          : reportBatch.map(b => {
              const pct = b.enrolled > 0 ? Math.round((b.completed_count / b.enrolled) * 100) : 0;
              const color = pct >= 70 ? C.green : pct >= 40 ? C.blue : C.gold;
              return <StatRow key={b.id}
                n={`${b.completed_count}/${b.enrolled}`}
                label={`${b.batch_code} · ${b.name} · ${pct}% completed`}
                pct={pct} color={color} />;
            })}
      </Card>
      <Card>
        <CardTitle>📊 Pass / Fail Summary</CardTitle>
        {reportBatch.length === 0
          ? <div style={{ color:'#888', padding:8 }}>No data yet.</div>
          : <Table headers={['Batch','Enrolled','Completed','Passed','Dropout']} rows={reportBatch.map(b =>
              <tr key={b.id}>
                <Td>{b.batch_code}</Td><Td>{b.enrolled}</Td>
                <Td>{b.completed_count}</Td>
                <Td><Badge color="green">{b.passed_count}</Badge></Td>
                <Td><Badge color={b.dropout_count > 0 ? 'red' : 'teal'}>{b.dropout_count}</Badge></Td>
              </tr>
            )} />}
      </Card>
    </>;
  }

  function PanelLearnerDropout() {
    return <>
      <SectionHead title="Dropout / At-Risk Learners ⚠️" />
      {reportDropout.length > 0 && <Alert type="red">{reportDropout.length} learner{reportDropout.length>1?'s are':' is'} below 70% attendance and at risk of dropout.</Alert>}
      <Card>
        {reportDropout.length === 0 ? <div style={{ color:'#888', padding:8 }}>No at-risk learners detected. Good attendance across all batches!</div> :
        <Table headers={['Name','Email','Batch','Attendance','Status']} rows={reportDropout.map((l,i) =>
          <tr key={i}>
            <Td>{l.name}</Td><Td>{l.email}</Td><Td>{l.batch_code}</Td>
            <Td><Badge color={l.att_pct<60?'red':'gold'}>{l.att_pct!=null?`${l.att_pct}%`:'No data'}</Badge></Td>
            <Td><Btn sm primary onClick={()=>showToast(`Counselling note logged for ${l.name}.`)}>Counsel</Btn></Td>
          </tr>
        )} />}
      </Card>
    </>;
  }

  function PanelLearnerPlacement() {
    return <>
      <SectionHead title="Placement Status 🏢" />
      <Card>
        {reportPlacement.length === 0 ? <div style={{ color:'#888', padding:8 }}>No placement records for your batches yet.</div> :
        <Table headers={['Learner','Batch','Company','Job Title','Location','CTC','Date']} rows={reportPlacement.map((p,i) =>
          <tr key={i}>
            <Td>{p.name}</Td><Td>{p.batch_code||'—'}</Td><Td>{p.company_name||'—'}</Td>
            <Td>{p.job_title||'—'}</Td><Td>{p.location||p.job_location||'—'}</Td>
            <Td>{p.ctc||'—'}</Td><Td>{p.placed_date||'—'}</Td>
          </tr>
        )} />}
      </Card>
    </>;
  }

  function PanelAssessSchedule() {
    if (!batchesLoaded) loadBatches();
    function submitAssess() {
      if (!assessForm.date) { showToast('Assessment date is required.', 'warn'); return; }
      const durErr = validatePositiveNum(assessForm.duration_hrs, 'Duration', 0.5, 24);
      if (durErr) { showToast(durErr, 'warn'); return; }
      const marksErr = validatePosInt(assessForm.total_marks, 'Total marks', 1000);
      if (marksErr) { showToast(marksErr, 'warn'); return; }
      const passErr = validatePassingMarks(assessForm.passing_marks, assessForm.total_marks);
      if (passErr) { showToast(passErr, 'warn'); return; }
      const batch = myBatches.find(b => String(b.id) === String(assessForm.batch_id));
      api.addTrainerAssessment({ ...assessForm, batch_id: assessForm.batch_id||null })
        .then(r => {
          setAssessList(p=>[...p, { ...r, batch_code: batch?.batch_code||'' }]);
          setAssessForm({ batch_id:'', type:'Final', date:'', duration_hrs:'2', total_marks:'100', passing_marks:'50', assessor:'' });
          setShowAddAssess(false);
          showToast('Assessment scheduled!');
        })
        .catch(e=>showToast(e.message||'Failed','error'));
    }
    const statusColor = { scheduled:'blue', confirmed:'green', completed:'teal', cancelled:'red' };
    return <>
      <SectionHead title="Assessment Schedule 📝" />
      {showAddAssess && (
        <Card>
          <CardTitle>Schedule New Assessment</CardTitle>
          <G>
            <Field label="Batch">
              <select value={assessForm.batch_id} onChange={e=>setAssessForm(f=>({...f,batch_id:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">— Select Batch —</option>
                {myBatches.map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.name}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select value={assessForm.type} onChange={e=>setAssessForm(f=>({...f,type:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                {['Mid-term','Final','Mock','RPL'].map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
          </G>
          <G cols={3}>
            <Field label="Date *"><Inp type="date" value={assessForm.date} onChange={e=>setAssessForm(f=>({...f,date:e.target.value}))} /></Field>
            <Field label="Duration (hrs)"><Inp value={assessForm.duration_hrs} onChange={e=>setAssessForm(f=>({...f,duration_hrs:e.target.value}))} placeholder="2" /></Field>
            <Field label="Total Marks"><Inp value={assessForm.total_marks} onChange={e=>setAssessForm(f=>({...f,total_marks:e.target.value}))} placeholder="100" /></Field>
          </G>
          <G>
            <Field label="Passing Marks"><Inp value={assessForm.passing_marks} onChange={e=>setAssessForm(f=>({...f,passing_marks:e.target.value}))} placeholder="50" /></Field>
            <Field label="Assessor Name"><Inp value={assessForm.assessor} onChange={e=>setAssessForm(f=>({...f,assessor:e.target.value}))} placeholder="e.g. SSC-Designated Assessor" /></Field>
          </G>
          <G cols={3}>
            <Field label="Assessment Agency">
              <select value={assessForm.agency||''} onChange={e=>setAssessForm(f=>({...f,agency:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">— Select —</option>
                {['Wheebox','NSDC Assessment','Ernst & Young','MERIT-TNL','CDAC','NTTF','Manipal ProLearn','Other'].map(a=><option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Time Slot">
              <select value={assessForm.time_slot||''} onChange={e=>setAssessForm(f=>({...f,time_slot:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">— Select —</option>
                {['9:00 AM – 12:00 PM','12:00 PM – 3:00 PM','2:00 PM – 5:00 PM','Full day'].map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="No. of Candidates"><Inp type="number" value={assessForm.candidate_count||''} onChange={e=>setAssessForm(f=>({...f,candidate_count:e.target.value}))} placeholder="0" /></Field>
          </G>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowAddAssess(false)}>Cancel</Btn>
            <Btn primary onClick={submitAssess}>📅 Schedule Assessment</Btn>
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>📋 Assessments</CardTitle>
        {assessList.length === 0 ? <div style={{ color:'#888', padding:8 }}>No assessments scheduled yet.</div> :
        <Table headers={['Date','Batch','Type','Agency','Time Slot','Candidates','Marks','Assessor','Status','']} rows={assessList.map(a =>
          <tr key={a.id}>
            <Td>{a.date}</Td><Td>{a.batch_code||'—'}</Td><Td>{a.type}</Td>
            <Td>{a.agency||'—'}</Td><Td>{a.time_slot||'—'}</Td>
            <Td>{a.candidate_count||0}</Td>
            <Td>{a.total_marks}/{a.passing_marks}</Td>
            <Td>{a.assessor||'—'}</Td>
            <Td><Badge color={statusColor[a.status]||'blue'}>{a.status}</Badge></Td>
            <Td><Btn sm onClick={()=>api.deleteTrainerAssessment(a.id).then(()=>setAssessList(p=>p.filter(x=>x.id!==a.id)))} style={{ background:C.red }}>Delete</Btn></Td>
          </tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddAssess(v=>!v)}>{showAddAssess?'✕ Cancel':'+ Schedule Assessment'}</Btn></div>
      </Card>
    </>;
  }

  function PanelAssessResults() {
    const scored = allLearners.filter(l => l.assessment_score != null);
    return <>
      <SectionHead title="Assessment Results 📊" />
      <Card>
        {scored.length === 0 ? <div style={{ color:'#888', padding:8 }}>No assessment scores recorded yet.</div> :
        <Table headers={['Learner','Batch','Score','Pass/Fail','Cert Eligible']} rows={scored.map((l,i) =>
          <tr key={i}>
            <Td>{l.name}</Td><Td>{l.batchCode||l.batchName||'—'}</Td>
            <Td>{l.assessment_score}</Td>
            <Td><Badge color={l.passed?'green':'red'}>{l.passed?'Pass':'Fail'}</Badge></Td>
            <Td><Badge color={l.passed && (l.attendance_pct==null||l.attendance_pct>=70)?'green':'red'}>
              {l.passed && (l.attendance_pct==null||l.attendance_pct>=70)?'Yes':'No'}
            </Badge></Td>
          </tr>
        )} />}
      </Card>
    </>;
  }

  function PanelAssessRPL() {
    const rplList = assessList.filter(a => a.type === 'RPL');
    const statusColor = { scheduled:'blue', confirmed:'green', completed:'teal', cancelled:'red' };
    return <>
      <SectionHead title="RPL Assessment 🔖" />
      <Alert type="info">Recognition of Prior Learning (RPL) allows experienced workers to get NSQF certification without full training. Schedule RPL assessments using the Assessment Schedule panel (select type "RPL").</Alert>
      <Card>
        {rplList.length === 0
          ? <div style={{ color:'#888', padding:8 }}>No RPL assessments scheduled yet. Go to Assessments → Schedule Assessment and select type "RPL" to add one.</div>
          : <Table headers={['Date','Batch','Assessor','Total Marks','Passing Marks','Status']} rows={rplList.map(a =>
              <tr key={a.id}>
                <Td>{a.date}</Td>
                <Td>{a.batch_code || '—'}</Td>
                <Td>{a.assessor || '—'}</Td>
                <Td>{a.total_marks}</Td>
                <Td>{a.passing_marks}</Td>
                <Td><Badge color={statusColor[a.status] || 'blue'}>{a.status}</Badge></Td>
              </tr>
            )} />}
      </Card>
    </>;
  }

  function PanelAssessMock() {
    if (!batchesLoaded) loadBatches();
    function submitMock() {
      if (!mockForm.subject || !mockForm.date) { showToast('Subject and date are required.', 'warn'); return; }
      const durErr = validatePosInt(mockForm.duration_min, 'Duration', 300);
      if (durErr) { showToast(durErr, 'warn'); return; }
      const qErr = validatePosInt(mockForm.questions, 'Number of questions', 500);
      if (qErr) { showToast(qErr, 'warn'); return; }
      const batch = myBatches.find(b => String(b.id) === String(mockForm.batch_id));
      api.addTrainerMockTest({ ...mockForm, batch_id: mockForm.batch_id||null })
        .then(r => {
          setMockList(p=>[...p, { ...r, batch_code: batch?.batch_code||'' }]);
          setMockForm({ batch_id:'', subject:'', date:'', duration_min:'60', questions:'50', total_marks:'100', passing_marks:'50', mode:'Online', time_slot:'' });
          setShowAddMock(false);
          showToast('Mock test created!');
        })
        .catch(e=>showToast(e.message||'Failed','error'));
    }
    return <>
      <SectionHead title="Mock Tests 🧪" />
      {showAddMock && (
        <Card>
          <G>
            <Field label="Batch">
              <select value={mockForm.batch_id} onChange={e=>setMockForm(f=>({...f,batch_id:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">— Select Batch —</option>
                {myBatches.map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.name}</option>)}
              </select>
            </Field>
            <Field label="Subject *"><Inp value={mockForm.subject} onChange={e=>setMockForm(f=>({...f,subject:e.target.value}))} placeholder="e.g. JavaScript Fundamentals" /></Field>
          </G>
          <G cols={3}>
            <Field label="Date *"><Inp type="date" value={mockForm.date} onChange={e=>setMockForm(f=>({...f,date:e.target.value}))} /></Field>
            <Field label="Duration (min)"><Inp value={mockForm.duration_min} onChange={e=>setMockForm(f=>({...f,duration_min:e.target.value}))} /></Field>
            <Field label="Questions"><Inp value={mockForm.questions} onChange={e=>setMockForm(f=>({...f,questions:e.target.value}))} /></Field>
          </G>
          <G cols={2}>
            <Field label="Total Marks"><Inp type="number" value={mockForm.total_marks} onChange={e=>setMockForm(f=>({...f,total_marks:e.target.value}))} placeholder="100" /></Field>
            <Field label="Passing Marks"><Inp type="number" value={mockForm.passing_marks} onChange={e=>setMockForm(f=>({...f,passing_marks:e.target.value}))} placeholder="50" /></Field>
          </G>
          <G>
            <Field label="Mode">
              <select value={mockForm.mode} onChange={e=>setMockForm(f=>({...f,mode:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                {['Online','Offline','Hybrid'].map(m=><option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Time Slot">
              <select value={mockForm.time_slot} onChange={e=>setMockForm(f=>({...f,time_slot:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                <option value="">— Select —</option>
                {['9:00 AM – 12:00 PM','12:00 PM – 3:00 PM','2:00 PM – 5:00 PM','Evening (6:00 PM – 9:00 PM)'].map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
          </G>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowAddMock(false)}>Cancel</Btn>
            <Btn primary onClick={submitMock}>🧪 Create Mock Test</Btn>
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>📋 Mock Tests</CardTitle>
        {mockList.length === 0 ? <div style={{ color:'#888', padding:8 }}>No mock tests created yet.</div> :
        <Table headers={['Date','Batch','Subject','Duration','Questions','Marks','Pass','Mode','Time Slot','']} rows={mockList.map(m =>
          <tr key={m.id}>
            <Td>{m.date}</Td><Td>{m.batch_code||'—'}</Td><Td>{m.subject}</Td>
            <Td>{m.duration_min} min</Td><Td>{m.questions} Qs</Td>
            <Td>{m.total_marks||'—'}</Td><Td>{m.passing_marks||'—'}</Td>
            <Td><Badge color={m.mode==='Online'?'teal':m.mode==='Hybrid'?'gold':'blue'}>{m.mode||'—'}</Badge></Td>
            <Td>{m.time_slot||'—'}</Td>
            <Td><Btn sm onClick={()=>api.deleteTrainerMockTest(m.id).then(()=>setMockList(p=>p.filter(x=>x.id!==m.id)))} style={{ background:C.red }}>Delete</Btn></Td>
          </tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddMock(v=>!v)}>{showAddMock?'✕ Cancel':'🧪 Create Mock Test'}</Btn></div>
      </Card>
    </>;
  }

  function ContentUploadForm({ filterType }) {
    function submitContent() {
      if (!contentForm.title || !contentForm.type) { showToast('Title and type are required.', 'warn'); return; }
      const titleErr = validateText(contentForm.title, 'Title', { min: 3, max: 200 });
      if (titleErr) { showToast(titleErr, 'warn'); return; }
      const descErr = validateText(contentForm.description, 'Description', { min: 0, max: 500 });
      if (descErr) { showToast(descErr, 'warn'); return; }
      api.addTrainerContent(contentForm)
        .then(r => { setContentList(p=>[...p,r]); setContentForm({ type:'Study Material (PDF)', title:'', description:'', batch_targets:'All', file_name:'' }); setShowAddContent(false); showToast('Content uploaded!'); })
        .catch(e=>showToast(e.message||'Failed','error'));
    }
    const batchTargetOpts = ['All', ...myBatches.map(b=>b.batch_code||b.name)];
    return showAddContent ? (
      <Card>
        <G>
          <Field label="Content Type">
            <select value={contentForm.type} onChange={e=>setContentForm(f=>({...f,type:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['Study Material (PDF)','Video Lecture','Assignment','Practice Questions','Resource Link','Other'].map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Target Batch">
            <select value={contentForm.batch_targets} onChange={e=>setContentForm(f=>({...f,batch_targets:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {batchTargetOpts.map(o=><option key={o}>{o}</option>)}
            </select>
          </Field>
        </G>
        <Field label="Title *"><Inp value={contentForm.title} onChange={e=>setContentForm(f=>({...f,title:e.target.value}))} placeholder="e.g. React Hooks — Week 4 Notes" /></Field>
        <Field label="Description"><textarea value={contentForm.description} onChange={e=>setContentForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="Brief description…" maxLength={500} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit' }} /></Field>
        {contentForm.type === 'Resource Link'
          ? <Field label="Resource URL *"><Inp value={contentForm.url} onChange={e=>setContentForm(f=>({...f,url:e.target.value}))} placeholder="https://..." /></Field>
          : <Field label="File Name"><Inp value={contentForm.file_name} onChange={e=>setContentForm(f=>({...f,file_name:e.target.value}))} placeholder="e.g. react-hooks-notes.pdf" /></Field>
        }
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <Btn onClick={()=>setShowAddContent(false)}>Cancel</Btn>
          <Btn primary onClick={submitContent}>📤 Upload</Btn>
        </div>
      </Card>
    ) : null;
  }

  function PanelContentMaterials() {
    const list = contentList.filter(c => c.type !== 'Video Lecture');
    return <>
      <SectionHead title="Study Materials & Content 📚" />
      <ContentUploadForm />
      <Card>
        {list.length === 0 ? <div style={{ color:'#888', padding:8 }}>No materials uploaded yet.</div> :
        <Table headers={['Title','Type','Batch','Uploaded','']} rows={list.map(c =>
          <tr key={c.id}><Td>{c.title}</Td><Td>{c.type}</Td><Td>{c.batch_targets}</Td>
          <Td>{c.created_at?.slice(0,10)||'—'}</Td>
          <Td><Btn sm onClick={()=>api.deleteTrainerContent(c.id).then(()=>setContentList(p=>p.filter(x=>x.id!==c.id)))} style={{ background:C.red }}>Delete</Btn></Td></tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddContent(v=>!v)}>{showAddContent?'✕ Cancel':'📤 Upload Material'}</Btn></div>
      </Card>
    </>;
  }

  function PanelContentVideos() {
    const list = contentList.filter(c => c.type === 'Video Lecture');
    return <>
      <SectionHead title="Video Lectures 🎥" />
      <ContentUploadForm filterType="Video Lecture" />
      <Card>
        {list.length === 0 ? <div style={{ color:'#888', padding:8 }}>No videos uploaded yet.</div> :
        <Table headers={['Title','Batch','Views','']} rows={list.map(c =>
          <tr key={c.id}><Td>{c.title}</Td><Td>{c.batch_targets}</Td><Td>{c.views||0}</Td>
          <Td><Btn sm onClick={()=>api.deleteTrainerContent(c.id).then(()=>setContentList(p=>p.filter(x=>x.id!==c.id)))} style={{ background:C.red }}>Delete</Btn></Td></tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>{ setContentForm(f=>({...f,type:'Video Lecture'})); setShowAddContent(v=>!v); }}>{showAddContent?'✕ Cancel':'📤 Upload Video'}</Btn></div>
      </Card>
    </>;
  }

  function PanelContentUpload() {
    return <>
      <SectionHead title="Upload Content 📤" />
      <ContentUploadForm />
      <Card>
        {contentList.length === 0 ? <div style={{ color:'#888', padding:8 }}>No content uploaded yet.</div> :
        <Table headers={['Title','Type','Batch','File','Uploaded','']} rows={contentList.map(c =>
          <tr key={c.id}><Td>{c.title}</Td><Td>{c.type}</Td><Td>{c.batch_targets}</Td>
          <Td>{c.file_name||'—'}</Td><Td>{c.created_at?.slice(0,10)||'—'}</Td>
          <Td><Btn sm onClick={()=>api.deleteTrainerContent(c.id).then(()=>setContentList(p=>p.filter(x=>x.id!==c.id)))} style={{ background:C.red }}>Delete</Btn></Td></tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddContent(v=>!v)}>{showAddContent?'✕ Cancel':'📤 Upload Content'}</Btn></div>
      </Card>
    </>;
  }

  function PanelContentLibrary() {
    const resources = contentList.filter(c => ['Resource Link','Other'].includes(c.type));
    return <>
      <SectionHead title="Resource Library 📖" />
      <ContentUploadForm />
      <Card>
        {resources.length === 0 ? <div style={{ color:'#888', padding:8 }}>No resources added yet.</div> :
        <Table headers={['Resource','Type','Batch','Added','']} rows={resources.map(c =>
          <tr key={c.id}><Td>{c.title}</Td><Td>{c.type}</Td><Td>{c.batch_targets}</Td>
          <Td>{c.created_at?.slice(0,10)||'—'}</Td>
          <Td><Btn sm onClick={()=>api.deleteTrainerContent(c.id).then(()=>setContentList(p=>p.filter(x=>x.id!==c.id)))} style={{ background:C.red }}>Delete</Btn></Td></tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddContent(v=>!v)}>{showAddContent?'✕ Cancel':'+ Add Resource'}</Btn></div>
      </Card>
    </>;
  }

  function PanelCertIssue() {
    return <>
      <SectionHead title="Issue Certificates 🏆" />
      <Alert type="info">Certificates can be issued to learners who passed the assessment with 70%+ attendance.</Alert>
      <Card>
        {certEligible.length === 0 ? <div style={{ color:'#888', padding:8 }}>No learners with assessment data yet.</div> :
        <Table headers={['Learner','Batch','Score','Attendance','Eligible','Action']} rows={certEligible.map((l,i) => {
          const eligible = l.passed && (l.att_pct==null || l.att_pct >= 70);
          return <tr key={i}>
            <Td>{l.name}</Td><Td>{l.batch_code}</Td>
            <Td>{l.assessment_score!=null?l.assessment_score:'—'}</Td>
            <Td>{l.att_pct!=null?`${l.att_pct}%`:'—'}</Td>
            <Td><Badge color={eligible?'green':'red'}>{eligible?'Yes':'No'}</Badge></Td>
            <Td>{eligible ? <Btn sm primary onClick={() => {
              api.trainerCertIssue({ email: l.email, batch_code: l.batch_code })
                .then(r => { showToast(`Certificate issued: ${r.cert_no}`); return api.trainerCertIssued(); })
                .then(r => setCertIssued(Array.isArray(r) ? r : []))
                .catch(e => showToast(e.message || 'Already issued or error', 'error'));
            }}>Issue</Btn> : '—'}</Td>
          </tr>;
        })} />}
      </Card>
    </>;
  }

  function PanelCertIssued() {
    return <>
      <SectionHead title="Issued Certificates 📜" />
      <Card>
        {certIssuedLoading ? <div style={{ color:'#888', padding:8 }}>Loading…</div> :
         certIssued.length === 0 ? <div style={{ color:'#888', padding:8 }}>No certificates issued yet. Issue certificates from the "Issue Certificates" panel.</div> :
        <Table headers={['Cert No','Learner','Email','Batch','Issued On','Status']} rows={certIssued.map((c,i) =>
          <tr key={i}>
            <Td><span style={{ fontFamily:'monospace', fontSize:11.5 }}>{c.cert_no}</span></Td>
            <Td>{c.name}</Td><Td>{c.email}</Td><Td>{c.batch_code||'—'}</Td>
            <Td>{c.issued_at ? new Date(c.issued_at).toLocaleDateString('en-IN') : '—'}</Td>
            <Td><Badge color="green">{c.status||'issued'}</Badge></Td>
          </tr>
        )} />}
      </Card>
    </>;
  }

  function PanelCertVerify() {
    function doVerify() {
      if (!certVerifyQ.trim()) { showToast('Enter a certificate number.', 'warn'); return; }
      const certErr = fieldValidate('certNo', certVerifyQ.trim());
      if (certErr) { showToast(certErr, 'warn'); return; }
      setCertVerifying(true);
      setCertVerifyResult(null);
      api.trainerVerifyCert(certVerifyQ.trim())
        .then(data => setCertVerifyResult(data))
        .catch(() => setCertVerifyResult(false))
        .finally(() => setCertVerifying(false));
    }
    return <>
      <SectionHead title="Verify Certificate 🔍" />
      <Card>
        <Field label="Certificate Number">
          <Inp value={certVerifyQ} onChange={e => { setCertVerifyQ(e.target.value); setCertVerifyResult(null); }}
            placeholder="e.g. CERT-2026-00412"
            onKeyDown={e => e.key === 'Enter' && doVerify()} />
        </Field>
        <div style={{ textAlign:'right', marginBottom:16 }}>
          <Btn primary onClick={doVerify} disabled={certVerifying}>
            {certVerifying ? '⏳ Checking…' : '🔍 Verify Certificate'}
          </Btn>
        </div>
        {certVerifyResult === false && (
          <Alert type="red">❌ No certificate found with number "{certVerifyQ}". Please check and try again.</Alert>
        )}
        {certVerifyResult && certVerifyResult.status === 'valid' && (
          <Alert type="success">
            ✅ Certificate <strong>{certVerifyResult.cert_no}</strong> is valid.<br />
            Issued to <strong>{certVerifyResult.candidate_name}</strong> for <strong>{certVerifyResult.course_title}</strong> (NSQF {certVerifyResult.nsqf_level}) on {certVerifyResult.issued_date}.
          </Alert>
        )}
        {certVerifyResult && certVerifyResult.status === 'revoked' && (
          <Alert type="red">⛔ Certificate {certVerifyResult.cert_no} has been <strong>revoked</strong>. It is no longer valid.</Alert>
        )}
      </Card>
    </>;
  }

  function PanelReportBatch() {
    return <>
      <SectionHead title="Batch Performance Reports 📊" />
      <Card>
        {reportBatch.length === 0 ? <div style={{ color:'#888', padding:8 }}>No batch data yet.</div> :
        <Table headers={['Batch','Status','Enrolled','Completed','Passed','Dropout']} rows={reportBatch.map(b =>
          <tr key={b.id}>
            <Td>{b.batch_code}</Td>
            <Td><Badge color={b.status==='active'?'blue':b.status==='completed'?'green':'gold'}>{b.status}</Badge></Td>
            <Td>{b.enrolled}</Td><Td>{b.completed_count}</Td>
            <Td>{b.passed_count}</Td><Td>{b.dropout_count}</Td>
          </tr>
        )} />}
      </Card>
    </>;
  }

  function PanelReportAttendance() {
    return <>
      <SectionHead title="Attendance Analytics 📈" />
      <Card>
        {reportAtt.length === 0 ? <div style={{ color:'#888', padding:8 }}>No attendance data yet.</div> :
        reportAtt.map(b => <StatRow key={b.id} n={b.avg_att!=null?`${b.avg_att}%`:'—'} label={`${b.batch_code} · ${b.name}`} pct={b.avg_att||0} color={b.avg_att>=80?C.green:b.avg_att>=60?C.gold:C.red} />)}
      </Card>
    </>;
  }

  function PanelReportAssessment() {
    return <>
      <SectionHead title="Assessment Analytics 📝" />
      <Card>
        {reportAssess.length === 0 ? <div style={{ color:'#888', padding:8 }}>No assessment data yet.</div> :
        <Table headers={['Batch','Appeared','Pass','Fail','Avg Score']} rows={reportAssess.map((b,i) =>
          <tr key={i}><Td>{b.batch_code}</Td><Td>{b.appeared}</Td>
          <Td><Badge color="green">{b.pass_count}</Badge></Td>
          <Td><Badge color="red">{b.fail_count}</Badge></Td>
          <Td>{b.avg_score!=null?`${b.avg_score}%`:'—'}</Td></tr>
        )} />}
      </Card>
    </>;
  }

  function PanelReportPlacement() {
    const total = reportPlacement.length;
    return <>
      <SectionHead title="Placement Analytics 🏢" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard icon="🏆" value={total} label="Total Placed" sub="from your batches" accent={C.green} />
        <KpiCard icon="💰" value={total > 0 ? `₹${(reportPlacement.reduce((s,p)=>s+(parseFloat(p.ctc)||0),0)/total).toFixed(1)} LPA` : '—'} label="Avg CTC" sub="" accent={C.blue} />
        <KpiCard icon="✅" value={myBatches.length ? `${Math.round(total/Math.max(allLearners.length,1)*100)}%` : '—'} label="Placement Rate" sub="" accent={C.gold} />
      </div>
      <Card>
        {reportPlacement.length === 0 ? <div style={{ color:'#888', padding:8 }}>No placement data for your batches yet.</div> :
        <Table headers={['Learner','Batch','Company','Job Title','Location','CTC','Date']} rows={reportPlacement.map((p,i) =>
          <tr key={i}>
            <Td>{p.name}</Td><Td>{p.batch_code||'—'}</Td><Td>{p.company_name||'—'}</Td>
            <Td>{p.job_title||'—'}</Td><Td>{p.location||p.job_location||'—'}</Td>
            <Td>{p.ctc||'—'}</Td><Td>{p.placed_date||'—'}</Td>
          </tr>
        )} />}
      </Card>
    </>;
  }

  function PanelReportTrainer() {
    const totalLearners = allLearners.length;
    const avgAtt = reportAtt.length ? Math.round(reportAtt.reduce((s,b)=>s+(b.avg_att||0),0)/reportAtt.length) : 0;
    const passRate = reportAssess.length ? Math.round(reportAssess.reduce((s,b)=>s+(b.pass_count||0),0) / Math.max(reportAssess.reduce((s,b)=>s+(b.appeared||0),0),1) * 100) : 0;
    const placedCount = reportPlacement.length;
    return <>
      <SectionHead title="My Performance 🌟" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard icon="👥" value={totalLearners} label="Total Learners" sub="across all batches" accent={C.blue} />
        <KpiCard icon="✅" value={`${avgAtt}%`} label="Avg Attendance" sub="" accent={C.green} />
        <KpiCard icon="📝" value={`${passRate}%`} label="Assessment Pass Rate" sub="" accent={C.teal} />
        <KpiCard icon="🏢" value={placedCount} label="Learners Placed" sub="" accent={C.gold} />
      </div>
      <Card>
        <Table headers={['Metric','Value']} rows={[
          <tr key="1"><Td>Batches Handled</Td><Td>{myBatches.length}</Td></tr>,
          <tr key="2"><Td>Active Batches</Td><Td>{myBatches.filter(b=>b.status==='active').length}</Td></tr>,
          <tr key="3"><Td>Completed Batches</Td><Td>{myBatches.filter(b=>b.status==='completed').length}</Td></tr>,
          <tr key="4"><Td>Avg Batch Attendance</Td><Td>{avgAtt}%</Td></tr>,
          <tr key="5"><Td>Assessment Pass Rate</Td><Td>{passRate}%</Td></tr>,
          <tr key="6"><Td>Placements from Batches</Td><Td>{placedCount}</Td></tr>,
        ]} />
      </Card>
    </>;
  }

  function SchemePanel({ title, scheme, description }) {
    const batches = reportScheme.filter(b => b.scheme_type === scheme);
    return <>
      <SectionHead title={title} />
      <Alert type="info">{description}</Alert>
      <Card>
        {batches.length === 0
          ? <div style={{ color:'#888', padding:8 }}>
              No batches tagged as "{scheme}" yet.<br />
              <span style={{ fontSize:12 }}>When creating or editing a batch, set the Govt Scheme field to "{scheme}" to track it here.</span>
            </div>
          : <Table headers={['Batch','Course','Enrolled','Passed','Avg Att%','Status']} rows={batches.map(b =>
              <tr key={b.id}>
                <Td>{b.batch_code}</Td><Td>{b.name}</Td>
                <Td>{b.enrolled}</Td>
                <Td><Badge color="green">{b.passed_count}</Badge></Td>
                <Td><Badge color={b.avg_att>=80?'green':b.avg_att>=60?'gold':'red'}>{b.avg_att!=null?`${b.avg_att}%`:'—'}</Badge></Td>
                <Td><Badge color={b.status==='active'?'blue':b.status==='completed'?'green':'gold'}>{b.status}</Badge></Td>
              </tr>
            )} />}
      </Card>
    </>;
  }

  function PanelSchemePmkvy() {
    return <SchemePanel
      title="PMKVY 4.0 🏛️"
      scheme="PMKVY"
      description="Pradhan Mantri Kaushal Vikas Yojana — free short-term skill training with certification and placement support. Batches tagged PMKVY appear here with real enrollment and pass stats." />;
  }

  function PanelSchemeRPL() {
    const rplAssess = assessList.filter(a => a.type === 'RPL');
    const statusColor = { scheduled:'blue', confirmed:'green', completed:'teal', cancelled:'red' };
    return <>
      <SectionHead title="RPL — Recognition of Prior Learning 🔖" />
      <Alert type="info">RPL allows experienced workers to get NSQF certification based on demonstrated skills. Schedule RPL assessments from Assessments → Schedule Assessment (select type "RPL").</Alert>
      <SchemePanel title="" scheme="RPL" description="" />
      {rplAssess.length > 0 && <Card>
        <CardTitle>📋 Scheduled RPL Assessments</CardTitle>
        <Table headers={['Date','Batch','Assessor','Status']} rows={rplAssess.map(a =>
          <tr key={a.id}>
            <Td>{a.date}</Td><Td>{a.batch_code||'—'}</Td>
            <Td>{a.assessor||'—'}</Td>
            <Td><Badge color={statusColor[a.status]||'blue'}>{a.status}</Badge></Td>
          </tr>
        )} />
      </Card>}
    </>;
  }

  function PanelSchemeNAPS() {
    return <SchemePanel
      title="NAPS / NATS 🎓"
      scheme="NAPS"
      description="National Apprenticeship Promotion Scheme — on-the-job training. Tag batches as NAPS to track apprenticeship-linked learners here." />;
  }

  function PanelSchemeDDU() {
    return <SchemePanel
      title="DDU-GKY 🌾"
      scheme="DDU-GKY"
      description="Deen Dayal Upadhyaya Grameen Kaushalya Yojana — targets rural BPL youth. Mandatory placement after training. Tag batches as DDU-GKY to track them here." />;
  }

  function PanelHelpdesk() {
    function submitTicket() {
      if (!ticketForm.subject || !ticketForm.details) { showToast('Subject and details are required.', 'warn'); return; }
      const subjectErr = validateText(ticketForm.subject, 'Subject', { min: 5, max: 200 });
      if (subjectErr) { showToast(subjectErr, 'warn'); return; }
      const detailsErr = validateText(ticketForm.details, 'Details', { min: 10, max: 2000 });
      if (detailsErr) { showToast(detailsErr, 'warn'); return; }
      api.addTrainerTicket(ticketForm)
        .then(r => { setTicketList(p=>[...p,r]); setTicketForm({ category:'Batch Issue', priority:'Medium', subject:'', details:'' }); setShowAddTicket(false); showToast('Support ticket submitted! You will be notified within 24 hours.'); })
        .catch(e=>showToast(e.message||'Failed','error'));
    }
    const statusColor = { Open:'blue', 'In Progress':'gold', Resolved:'green', Closed:'teal' };
    return <>
      <SectionHead title="Help & Support 🎧" />
      {showAddTicket && (
        <Card>
          <G>
            <Field label="Category">
              <select value={ticketForm.category} onChange={e=>setTicketForm(f=>({...f,category:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                {['Batch Issue','Assessment Query','Certificate','Technical','Salary / Payment','Other'].map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={ticketForm.priority} onChange={e=>setTicketForm(f=>({...f,priority:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
                {['Low','Medium','High'].map(p=><option key={p}>{p}</option>)}
              </select>
            </Field>
          </G>
          <Field label="Subject *"><Inp value={ticketForm.subject} onChange={e=>setTicketForm(f=>({...f,subject:e.target.value}))} placeholder="Brief description of the issue" /></Field>
          <Field label="Details *"><textarea value={ticketForm.details} onChange={e=>setTicketForm(f=>({...f,details:e.target.value}))} rows={4} placeholder="Describe your issue in detail…" maxLength={2000} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit' }} /></Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowAddTicket(false)}>Cancel</Btn>
            <Btn primary onClick={submitTicket}>📩 Submit Ticket</Btn>
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>📋 My Tickets</CardTitle>
        {ticketList.length === 0 ? <div style={{ color:'#888', padding:8 }}>No tickets raised yet.</div> :
        <Table headers={['Ticket ID','Category','Priority','Subject','Status','Raised']} rows={ticketList.map(t =>
          <tr key={t.id}><Td>{t.ticket_id}</Td><Td>{t.category}</Td>
          <Td><Badge color={t.priority==='High'?'red':t.priority==='Medium'?'gold':'blue'}>{t.priority}</Badge></Td>
          <Td>{t.subject}</Td>
          <Td><Badge color={statusColor[t.status]||'blue'}>{t.status}</Badge></Td>
          <Td>{t.created_at?.slice(0,10)||'—'}</Td></tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn primary onClick={()=>setShowAddTicket(v=>!v)}>{showAddTicket?'✕ Cancel':'📩 Raise Support Ticket'}</Btn></div>
      </Card>
    </>;
  }

  function PanelGrievance() {
    function submitGrievance() {
      if (!grievanceForm.details) { showToast('Please provide grievance details.', 'warn'); return; }
      const detailsErr = validateText(grievanceForm.details, 'Details', { min: 20, max: 2000 });
      if (detailsErr) { showToast(detailsErr, 'warn'); return; }
      api.addTrainerGrievance(grievanceForm)
        .then(r => { setGrievanceList(p=>[...p,r]); setGrievanceForm({ grievance_type:'Other', against_whom:'', details:'' }); setShowAddGrievance(false); showToast(`Grievance submitted. Reference: ${r.ref_id}`); })
        .catch(e=>showToast(e.message||'Failed','error'));
    }
    return <>
      <SectionHead title="Grievance 📣" />
      {showAddGrievance && (
        <Card>
          <Field label="Grievance Type">
            <select value={grievanceForm.grievance_type} onChange={e=>setGrievanceForm(f=>({...f,grievance_type:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['Salary / Payment Delay','Facilities Issue','Assessment Irregularity','Unfair Treatment','Other'].map(g=><option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Against (if applicable)"><Inp value={grievanceForm.against_whom} onChange={e=>setGrievanceForm(f=>({...f,against_whom:e.target.value}))} placeholder="e.g. Training Partner Management" /></Field>
          <Field label="Details *"><textarea value={grievanceForm.details} onChange={e=>setGrievanceForm(f=>({...f,details:e.target.value}))} rows={5} placeholder="Describe your grievance with dates and amounts…" maxLength={2000} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit' }} /></Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowAddGrievance(false)}>Cancel</Btn>
            <Btn onClick={submitGrievance} style={{ background:C.red, color:'#fff' }}>📤 Submit Grievance</Btn>
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>📋 My Grievances</CardTitle>
        {grievanceList.length === 0 ? <div style={{ color:'#888', padding:8 }}>No grievances submitted yet.</div> :
        <Table headers={['Ref ID','Type','Against','Status','Date']} rows={grievanceList.map(g =>
          <tr key={g.id}><Td>{g.ref_id}</Td><Td>{g.grievance_type}</Td><Td>{g.against_whom||'—'}</Td>
          <Td><Badge color={g.status==='Resolved'?'green':g.status==='Submitted'?'gold':'blue'}>{g.status}</Badge></Td>
          <Td>{g.created_at?.slice(0,10)||'—'}</Td></tr>
        )} />}
        <div style={{ marginTop:14 }}><Btn onClick={()=>setShowAddGrievance(v=>!v)} style={{ background:C.red, color:'#fff' }}>{showAddGrievance?'✕ Cancel':'📤 Submit Grievance'}</Btn></div>
      </Card>
    </>;
  }

  // ── ANNOUNCEMENTS ────────────────────────────────────────────────
  function PanelAnnounceSend() {
    if (!batchesLoaded) loadBatches();
    const form = announceForm;
    const setForm = setAnnounceForm;
    const sent = announceSent;
    const setSent = setAnnounceSent;
    const saving = announceSaving;
    const setSaving = setAnnounceSaving;
    function submit() {
      if (!form.title.trim() || !form.message.trim()) { showToast('Title and message are required.', 'warn'); return; }
      setSaving(true);
      const batch = myBatches.find(b => String(b.id) === String(form.batch_id));
      api.addTrainerAnnouncement({ ...form, batch_id: form.batch_id || null })
        .then(r => {
          setSent(p => [{ ...r, batch_name: batch ? `${batch.batch_code} · ${batch.name}` : 'All Batches' }, ...p]);
          setForm({ batch_id:'', title:'', message:'', priority:'Normal' });
          showToast('Announcement sent to learners!');
        })
        .catch(e => showToast(e.message || 'Failed to send announcement.', 'error'))
        .finally(() => setSaving(false));
    }
    return <>
      <SectionHead title="Send Announcement 📢" />
      <Card>
        <CardTitle>New Announcement</CardTitle>
        <G>
          <Field label="Target Batch">
            <select value={form.batch_id} onChange={e=>setForm(f=>({...f,batch_id:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              <option value="">— All My Batches —</option>
              {myBatches.map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}
              style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['Normal','Important','Urgent'].map(p=><option key={p}>{p}</option>)}
            </select>
          </Field>
        </G>
        <Field label="Title *"><Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Assessment rescheduled to next Friday" /></Field>
        <Field label="Message *">
          <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4}
            placeholder="Write your announcement here…" maxLength={1000}
            style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn primary onClick={submit} disabled={saving}>📢 Send Announcement</Btn>
        </div>
      </Card>
      {sent.length > 0 && (
        <Card>
          <CardTitle>📋 Sent This Session</CardTitle>
          <Table headers={['Title','Batch','Priority','Sent At']} rows={sent.map(s=>(
            <tr key={s.id}>
              <Td>{s.title}</Td><Td>{s.batch_name}</Td>
              <Td><Badge color={s.priority==='Urgent'?'red':s.priority==='Important'?'gold':'blue'}>{s.priority}</Badge></Td>
              <Td>{s.sent_at?.slice(0,10)}</Td>
            </tr>
          ))} />
        </Card>
      )}
    </>;
  }

  function PanelAnnounceHistory() {
    const rows = announceHistory;
    const setRows = setAnnounceHistory;
    const loading = announceHistoryLoading;
    function del(id) {
      api.deleteTrainerAnnouncement(id)
        .then(() => { setRows(p => p.filter(x => x.id !== id)); showToast('Deleted.'); })
        .catch(e => showToast(e.message || 'Delete failed.', 'error'));
    }
    return <>
      <SectionHead title="Announcement History 📋" />
      <Alert type="info">Announcements are delivered to learners via SMS and in-app notification. History is retained for 90 days.</Alert>
      <Card>
        {loading ? <div style={{ color:C.ink3, padding:8 }}>Loading…</div> :
         rows.length === 0 ? <div style={{ color:C.ink3, padding:8 }}>No past announcements found. Use "Send Announcement" to notify your learners.</div> :
        <Table headers={['Title','Batch','Priority','Sent At','']} rows={rows.map(s => (
          <tr key={s.id}>
            <Td style={{ fontWeight:600 }}>{s.title}</Td>
            <Td>{s.batch_name || (s.batch_id ? `Batch #${s.batch_id}` : 'All Batches')}</Td>
            <Td><Badge color={s.priority==='Urgent'?'red':s.priority==='Important'?'gold':'blue'}>{s.priority||'Normal'}</Badge></Td>
            <Td>{s.sent_at?.slice(0,10)}</Td>
            <Td><Btn onClick={() => del(s.id)} style={{ padding:'3px 10px', fontSize:12, color:'red' }}>Delete</Btn></Td>
          </tr>
        ))} />}
      </Card>
    </>;
  }

  // ── FEEDBACK & RATINGS ───────────────────────────────────────────
  function PanelFeedbackSession() {
    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
    return <>
      <SectionHead title="Session Feedback ⭐" />
      <Alert type="info">Learner ratings and comments submitted after your sessions appear here.</Alert>
      {feedbackLoading ? <Card><div style={{ color:C.ink3, padding:8 }}>Loading…</div></Card> :
       feedbackList.length === 0 ? (
        <Card>
          <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>No feedback received yet</div>
            <div style={{ fontSize:13 }}>Learners can rate each session after it's marked complete.</div>
          </div>
        </Card>
      ) : (
        <Card>
          <Table headers={['Learner','Batch','Session','Rating','Comment','Date']} rows={feedbackList.map((f,i) => (
            <tr key={i}>
              <Td>{f.candidate_name||f.candidate_email||'—'}</Td>
              <Td>{f.batch_code||'—'}</Td>
              <Td>{f.session_topic||'—'}</Td>
              <Td><span style={{ color:C.gold, fontWeight:700, letterSpacing:1 }}>{stars(f.rating||0)}</span> <span style={{ fontSize:12, color:C.ink3 }}>({f.rating}/5)</span></Td>
              <Td style={{ maxWidth:200 }}>{f.comment||'—'}</Td>
              <Td style={{ whiteSpace:'nowrap' }}>{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString('en-IN') : '—'}</Td>
            </tr>
          ))} />
        </Card>
      )}
    </>;
  }

  function PanelFeedbackOverall() {
    const s = ratingSummary;
    const avg = s && s.avg_rating ? parseFloat(s.avg_rating) : null;
    const total = s ? parseInt(s.total_reviews||0) : 0;
    const bars = [
      { label:'5 ★', count: parseInt(s?.five_star||0), color:C.green },
      { label:'4 ★', count: parseInt(s?.four_star||0), color:C.teal },
      { label:'3 ★', count: parseInt(s?.three_star||0), color:C.gold },
      { label:'2 ★', count: parseInt(s?.two_star||0), color:C.orange||'#f97316' },
      { label:'1 ★', count: parseInt(s?.one_star||0), color:C.red },
    ];
    return <>
      <SectionHead title="My Trainer Rating 📊" />
      {total === 0 ? (
        <Card>
          <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📊</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>No ratings yet</div>
            <div style={{ fontSize:13 }}>Your aggregate score will appear once learners submit feedback.</div>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ display:'flex', gap:32, alignItems:'center', marginBottom:24, flexWrap:'wrap' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:56, fontWeight:800, color:C.navy, lineHeight:1 }}>{avg?.toFixed(1)}</div>
              <div style={{ fontSize:22, color:C.gold, margin:'4px 0' }}>{'★'.repeat(Math.round(avg||0))}{'☆'.repeat(5-Math.round(avg||0))}</div>
              <div style={{ fontSize:13, color:C.ink3 }}>{total} review{total!==1?'s':''}</div>
            </div>
            <div style={{ flex:1, minWidth:180 }}>
              {bars.map(b => (
                <div key={b.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:32, fontSize:12, color:C.ink2 }}>{b.label}</div>
                  <div style={{ flex:1, background:'#E5E7EB', borderRadius:4, height:10 }}>
                    <div style={{ width:`${total ? Math.round(b.count/total*100) : 0}%`, background:b.color, height:10, borderRadius:4, transition:'width .4s' }} />
                  </div>
                  <div style={{ width:24, fontSize:12, color:C.ink3, textAlign:'right' }}>{b.count}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </>;
  }

  // ── EARNINGS & PAYMENTS ──────────────────────────────────────────
  function PanelEarningsHistory() {
    const total = paymentHistory.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    return <>
      <SectionHead title="Payment History 💰" />
      {paymentsLoading ? <Card><div style={{ color:C.ink3, padding:8 }}>Loading…</div></Card> :
       paymentHistory.length === 0 ? (
        <Card>
          <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>💰</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>No payment records yet</div>
            <div style={{ fontSize:13 }}>Payments recorded by your organisation will appear here.</div>
          </div>
        </Card>
      ) : <>
        <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
          <KpiCard icon="💰" value={`₹${total.toLocaleString('en-IN')}`} label="Total Received" sub={`${paymentHistory.length} transactions`} accent={C.green} />
          <KpiCard icon="📅" value={paymentHistory[0]?.payment_date ? new Date(paymentHistory[0].payment_date).toLocaleDateString('en-IN') : '—'} label="Last Payment" sub={paymentHistory[0]?.description||''} accent={C.blue} />
        </div>
        <Card>
          <Table headers={['Date','Batch','Amount','Mode','Reference','Description','Status']} rows={paymentHistory.map((p,i) => (
            <tr key={i}>
              <Td style={{ whiteSpace:'nowrap' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</Td>
              <Td>{p.batch_code||'—'}</Td>
              <Td style={{ fontWeight:600, color:C.green }}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</Td>
              <Td>{p.payment_mode||'—'}</Td>
              <Td><span style={{ fontFamily:'monospace', fontSize:11.5 }}>{p.reference_no||'—'}</span></Td>
              <Td>{p.description||'—'}</Td>
              <Td><Badge color={p.status==='paid'?'green':'gold'}>{p.status||'paid'}</Badge></Td>
            </tr>
          ))} />
        </Card>
      </>}
    </>;
  }

  function PanelEarningsPending() {
    return <>
      <SectionHead title="Pending Dues ⏳" />
      <Alert type="info">Batches that have enrolled learners but no payment recorded yet are listed here. Contact your organisation to initiate disbursement.</Alert>
      {paymentsLoading ? <Card><div style={{ color:C.ink3, padding:8 }}>Loading…</div></Card> :
       paymentPending.length === 0 ? (
        <Card>
          <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>No pending dues</div>
            <div style={{ fontSize:13 }}>All active/completed batches have payments recorded.</div>
          </div>
        </Card>
      ) : (
        <Card>
          <Table headers={['Batch Code','Batch Name','End Date','Learners','Action']} rows={paymentPending.map((b,i) => (
            <tr key={i}>
              <Td><span style={{ fontFamily:'monospace', fontWeight:600 }}>{b.batch_code}</span></Td>
              <Td>{b.name}</Td>
              <Td>{b.end_date ? new Date(b.end_date).toLocaleDateString('en-IN') : '—'}</Td>
              <Td>{b.learner_count}</Td>
              <Td><Btn sm onClick={() => showToast('Contact your organisation admin to process payment for this batch.','warn')}>Request Payment</Btn></Td>
            </tr>
          ))} />
        </Card>
      )}
    </>;
  }

  function PanelEarningsBank() {
    const saving = bankSaving;
    const setSaving = setBankSaving;
    const saved = bankSaved;
    const setSaved = setBankSaved;
    function save() {
      setSaving(true); setSaved(false);
      api.saveTrainerBankDetails(bankForm)
        .then(() => { setSaved(true); showToast('Bank details saved!'); })
        .catch(e => showToast(e.message || 'Save failed.', 'error'))
        .finally(() => setSaving(false));
    }
    return <>
      <SectionHead title="Bank Details 🏦" />
      <Alert type="info">Your bank details are used for payment disbursement. Ensure they match your KYC documents.</Alert>
      <Card>
        <G>
          <Field label="Account Holder Name"><Inp value={bankForm.account_name} onChange={e=>setBankForm(f=>({...f,account_name:e.target.value}))} placeholder="As per bank records" /></Field>
          <Field label="Account Number"><Inp value={bankForm.account_no} onChange={e=>setBankForm(f=>({...f,account_no:e.target.value}))} placeholder="XXXXXXXXXXXX" /></Field>
        </G>
        <G>
          <Field label="IFSC Code"><Inp value={bankForm.ifsc} onChange={e=>setBankForm(f=>({...f,ifsc:e.target.value.toUpperCase()}))} placeholder="e.g. SBIN0001234" /></Field>
          <Field label="Bank Name"><Inp value={bankForm.bank_name} onChange={e=>setBankForm(f=>({...f,bank_name:e.target.value}))} placeholder="e.g. State Bank of India" /></Field>
        </G>
        <G>
          <Field label="Branch"><Inp value={bankForm.branch} onChange={e=>setBankForm(f=>({...f,branch:e.target.value}))} placeholder="e.g. Koramangala, Bengaluru" /></Field>
          <Field label="UPI ID (optional)"><Inp value={bankForm.upi_id} onChange={e=>setBankForm(f=>({...f,upi_id:e.target.value}))} placeholder="name@upi" /></Field>
        </G>
        {saved && <Alert type="success">✅ Bank details saved successfully.</Alert>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn primary onClick={save} disabled={saving}>💾 {saving ? 'Saving…' : 'Save Bank Details'}</Btn>
        </div>
      </Card>
    </>;
  }

  // ── JOB BOARD ────────────────────────────────────────────────────
  function PanelJobsBrowse() {
    const jobs = jobsList;
    const loading = jobsLoading;
    function sendReferral(job) {
      if (!referEmail.trim()) { showToast('Enter learner email', 'warn'); return; }
      setReferSending(true);
      api.addTrainerReferral({ candidate_email: referEmail.trim(), job_id: job.id, job_title: job.title, company: job.company_name||job.employer||'', note: referNote.trim() })
        .then(r => {
          showToast(`Referral sent to ${referEmail} for "${job.title}"`);
          setReferModal(null); setReferEmail(''); setReferNote('');
          return api.trainerReferrals();
        })
        .then(r => setReferrals(Array.isArray(r) ? r : []))
        .catch(e => showToast(e.message || 'Failed to send referral', 'error'))
        .finally(() => setReferSending(false));
    }
    return <>
      <SectionHead title="Browse Jobs 💼" />
      <Alert type="info">Refer suitable job openings to your learners directly from here. They'll receive an email notification with the job details.</Alert>
      <Card>
        {loading ? <div style={{ color:C.ink3, padding:8 }}>Loading jobs…</div> :
         jobs.length === 0 ? <div style={{ color:C.ink3, padding:8 }}>No job listings available at the moment.</div> :
        <Table headers={['Title','Company','Location','Salary','Skills','Action']} rows={jobs.slice(0,10).map((j,i)=>(
          <tr key={j.id||i}>
            <Td style={{ fontWeight:600 }}>{j.title}</Td>
            <Td>{j.company_name||j.employer||'—'}</Td>
            <Td>{j.location||'—'}</Td>
            <Td>{j.salary_range||j.salary||'—'}</Td>
            <Td>{(j.skills||[]).slice(0,2).join(', ')||'—'}</Td>
            <Td><Btn sm primary onClick={()=>setReferModal(j)}>Refer Learner</Btn></Td>
          </tr>
        ))} />}
      </Card>
      {referModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:380 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Refer Learner — {referModal.title}</div>
            <Field label="Learner Email"><Inp value={referEmail} onChange={e=>setReferEmail(e.target.value)} placeholder="learner@example.com" /></Field>
            <Field label="Note (optional)"><Inp value={referNote} onChange={e=>setReferNote(e.target.value)} placeholder="Why this job suits them…" /></Field>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Btn onClick={()=>{setReferModal(null);setReferEmail('');setReferNote('');}}>Cancel</Btn>
              <Btn primary disabled={referSending} onClick={()=>sendReferral(referModal)}>📤 {referSending?'Sending…':'Send Referral'}</Btn>
            </div>
          </div>
        </div>
      )}
    </>;
  }

  function PanelJobsReferrals() {
    const statusColor = { sent:'blue', viewed:'teal', applied:'green', rejected:'red' };
    return <>
      <SectionHead title="My Referrals 🔗" />
      {referralsLoading ? <Card><div style={{ color:C.ink3, padding:8 }}>Loading…</div></Card> :
       referrals.length === 0 ? (
        <Card>
          <div style={{ textAlign:'center', padding:'40px 0', color:C.ink3 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🔗</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>No referrals sent yet</div>
            <div style={{ fontSize:13 }}>Browse Jobs and click "Refer Learner" to send a referral.</div>
          </div>
        </Card>
      ) : (
        <Card>
          <Table headers={['Learner Email','Candidate','Job Title','Company','Note','Date','Status']} rows={referrals.map((r,i) => (
            <tr key={i}>
              <Td>{r.candidate_email}</Td>
              <Td>{r.candidate_name||'—'}</Td>
              <Td style={{ fontWeight:600 }}>{r.job_title}</Td>
              <Td>{r.company||'—'}</Td>
              <Td style={{ maxWidth:160 }}>{r.note||'—'}</Td>
              <Td style={{ whiteSpace:'nowrap' }}>{r.referred_at ? new Date(r.referred_at).toLocaleDateString('en-IN') : '—'}</Td>
              <Td><Badge color={statusColor[r.status]||'blue'}>{r.status||'sent'}</Badge></Td>
            </tr>
          ))} />
        </Card>
      )}
    </>;
  }

  function PanelFAQ() {
    return <>
      <SectionHead title="FAQ ❓" />
      {[
        ['How do I mark attendance?','Go to Attendance → Mark Attendance, select the batch and session date, then mark each learner present/absent and submit before 5 PM.'],
        ['How are certificates issued?','After a learner passes the final assessment with 70%+ attendance, you can initiate certificate issuance from Certificates → Issue Certificates. PMKVY batches need NSDC approval.'],
        ['What is RPL?','Recognition of Prior Learning lets experienced workers get NSQF certification based on demonstrated skills via assessment rather than full training.'],
        ['How do I get my performance report?','Go to Reports → My Performance. It updates monthly with attendance, pass rate, placement, and learner satisfaction scores.'],
        ['What if a learner is at risk of dropout?','Flag them in Learners → Dropout / At-Risk and schedule a counselling session. Learners below 60% attendance may be barred from assessment.'],
      ].map(([q,a]) => (
        <Card key={q}>
          <div style={{ fontSize:13.5, fontWeight:700, color:C.navy, marginBottom:6 }}>Q: {q}</div>
          <div style={{ fontSize:13, color:C.ink2, lineHeight:1.7 }}>{a}</div>
        </Card>
      ))}
    </>;
  }

  function PanelSettings() {
    return <AccountPreferences onLogout={handleLogout} />;
  }

  // ── AI TOOLS ─────────────────────────────────────────────────────

  function PanelAISession() {
    function generate() {
      if (!sessionPlan.topic.trim()) { showToast('Enter a session topic.', 'warn'); return; }
      setSessionPlanLoading(true); setSessionPlanResult('');
      const batch = myBatches.find(b => String(b.id) === String(sessionPlan.batch_id));
      const prompt = `Create a detailed ${sessionPlan.duration}-minute session plan for a trainer on the topic "${sessionPlan.topic}".
Batch: ${batch ? `${batch.batch_code} – ${batch.name}` : 'General training batch'}
Learners: ${sessionPlan.learner_count || 'Not specified'}
Prior knowledge: ${sessionPlan.prior_knowledge || 'None specified'}
Learning objectives: ${sessionPlan.objectives || 'General understanding'}
Include: Learning objectives, agenda with time breakdown, teaching methods, activities, assessment ideas, and materials needed.`;
      api.chatbot(prompt, [])
        .then(r => setSessionPlanResult(r.reply))
        .catch(e => setSessionPlanResult('⚠️ ' + (e.message || 'Could not generate plan.')))
        .finally(() => setSessionPlanLoading(false));
    }
    return <>
      <SectionHead title="AI Session Planner 📋" />
      <Alert type="info">Describe your session and let AI generate a structured lesson plan with agenda, activities, and materials.</Alert>
      <Card>
        <CardTitle>Session Details</CardTitle>
        <G>
          <Field label="Topic *"><Inp value={sessionPlan.topic} onChange={e => setSessionPlan(f=>({...f,topic:e.target.value}))} placeholder="e.g. Introduction to Python Variables" /></Field>
          <Field label="Duration (minutes)">
            <select value={sessionPlan.duration} onChange={e=>setSessionPlan(f=>({...f,duration:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['30','45','60','90','120'].map(d=><option key={d}>{d}</option>)}
            </select>
          </Field>
        </G>
        <G>
          <Field label="Batch (optional)">
            <select value={sessionPlan.batch_id} onChange={e=>setSessionPlan(f=>({...f,batch_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              <option value="">— Select batch —</option>
              {myBatches.map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.name}</option>)}
            </select>
          </Field>
          <Field label="No. of Learners"><Inp value={sessionPlan.learner_count} onChange={e=>setSessionPlan(f=>({...f,learner_count:e.target.value}))} placeholder="e.g. 25" type="number" /></Field>
        </G>
        <Field label="Learning Objectives"><Inp value={sessionPlan.objectives} onChange={e=>setSessionPlan(f=>({...f,objectives:e.target.value}))} placeholder="e.g. Understand data types, write basic programs" /></Field>
        <Field label="Learners' Prior Knowledge"><Inp value={sessionPlan.prior_knowledge} onChange={e=>setSessionPlan(f=>({...f,prior_knowledge:e.target.value}))} placeholder="e.g. No prior coding experience" /></Field>
        <div style={{ textAlign:'right' }}>
          <Btn primary onClick={generate} disabled={sessionPlanLoading}>🤖 {sessionPlanLoading ? 'Generating…' : 'Generate Session Plan'}</Btn>
        </div>
      </Card>
      {sessionPlanResult && (
        <Card>
          <CardTitle>📄 Generated Session Plan</CardTitle>
          <pre style={{ whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.65, color:C.ink, fontFamily:'inherit', margin:0 }}>{sessionPlanResult}</pre>
          <div style={{ marginTop:12, display:'flex', gap:10 }}>
            <Btn onClick={() => { navigator.clipboard?.writeText(sessionPlanResult); showToast('Copied to clipboard!'); }}>📋 Copy</Btn>
            <Btn onClick={() => setSessionPlanResult('')}>Clear</Btn>
          </div>
        </Card>
      )}
    </>;
  }

  function PanelAIAssessment() {
    function generate() {
      if (!assessBuilder.topic.trim()) { showToast('Enter a topic.', 'warn'); return; }
      setAssessBuilderLoading(true); setAssessBuilderResult('');
      const prompt = `Generate ${assessBuilder.count} ${assessBuilder.type} questions on the topic "${assessBuilder.topic}" for a vocational training assessment.
Difficulty: ${assessBuilder.difficulty}
Format each question clearly with answer options (if MCQ) and the correct answer marked.
Include a brief explanation for each answer.`;
      api.chatbot(prompt, [])
        .then(r => setAssessBuilderResult(r.reply))
        .catch(e => setAssessBuilderResult('⚠️ ' + (e.message || 'Could not generate questions.')))
        .finally(() => setAssessBuilderLoading(false));
    }
    return <>
      <SectionHead title="AI Assessment Builder 📝" />
      <Alert type="info">Auto-generate assessment questions for any topic. Review and edit before use in your assessments.</Alert>
      <Card>
        <G>
          <Field label="Topic *"><Inp value={assessBuilder.topic} onChange={e=>setAssessBuilder(f=>({...f,topic:e.target.value}))} placeholder="e.g. Safety at Construction Sites" /></Field>
          <Field label="Question Type">
            <select value={assessBuilder.type} onChange={e=>setAssessBuilder(f=>({...f,type:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['MCQ','True/False','Short Answer','Mixed'].map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
        </G>
        <G>
          <Field label="Number of Questions">
            <select value={assessBuilder.count} onChange={e=>setAssessBuilder(f=>({...f,count:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['5','10','15','20','25'].map(n=><option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Difficulty">
            <select value={assessBuilder.difficulty} onChange={e=>setAssessBuilder(f=>({...f,difficulty:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              {['Easy','Medium','Hard','Mixed'].map(d=><option key={d}>{d}</option>)}
            </select>
          </Field>
        </G>
        <div style={{ textAlign:'right' }}>
          <Btn primary onClick={generate} disabled={assessBuilderLoading}>🤖 {assessBuilderLoading ? 'Generating…' : 'Generate Questions'}</Btn>
        </div>
      </Card>
      {assessBuilderResult && (
        <Card>
          <CardTitle>📋 Generated Questions</CardTitle>
          <pre style={{ whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.7, color:C.ink, fontFamily:'inherit', margin:0 }}>{assessBuilderResult}</pre>
          <div style={{ marginTop:12, display:'flex', gap:10 }}>
            <Btn onClick={() => { navigator.clipboard?.writeText(assessBuilderResult); showToast('Copied to clipboard!'); }}>📋 Copy</Btn>
            <Btn onClick={() => setAssessBuilderResult('')}>Clear</Btn>
          </div>
        </Card>
      )}
    </>;
  }

  function PanelAIInsights() {
    function loadInsights() {
      if (!batchInsightsBatch) { showToast('Select a batch first.', 'warn'); return; }
      setBatchInsightsLoading(true); setBatchInsights(null);
      const batch = myBatches.find(b => String(b.id) === String(batchInsightsBatch));
      const metrics = {
        batch_code: batch?.batch_code,
        batch_name: batch?.name,
        enrolled: batch?.enrolled || 0,
        avg_attendance: batch?.avg_attendance ? Math.round(batch.avg_attendance) + '%' : 'N/A',
        learner_count: batch?.learner_count || 0,
        status: batch?.status,
      };
      api.aiInsights(metrics, `batch "${batch?.name || batchInsightsBatch}"`)
        .then(r => setBatchInsights(r.insights))
        .catch(e => setBatchInsights('⚠️ ' + (e.message || 'Could not generate insights.')))
        .finally(() => setBatchInsightsLoading(false));
    }
    return <>
      <SectionHead title="AI Batch Insights 📊" />
      <Alert type="info">Get AI-powered analysis of any batch — what's working well, concerns, and specific recommendations.</Alert>
      <Card>
        <G>
          <Field label="Select Batch">
            <select value={batchInsightsBatch} onChange={e=>setBatchInsightsBatch(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              <option value="">— Choose a batch —</option>
              {myBatches.map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.name} ({b.status})</option>)}
            </select>
          </Field>
          <Field label=" "><Btn primary onClick={loadInsights} disabled={batchInsightsLoading} style={{ marginTop:22 }}>🤖 {batchInsightsLoading ? 'Analysing…' : 'Get AI Insights'}</Btn></Field>
        </G>
        {batchInsightsBatch && (() => {
          const b = myBatches.find(x => String(x.id) === String(batchInsightsBatch));
          return b ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:8 }}>
              <KpiCard icon="👥" value={b.enrolled||0} label="Enrolled" accent={C.blue} />
              <KpiCard icon="✅" value={b.avg_attendance ? Math.round(b.avg_attendance)+'%' : '—'} label="Avg Attendance" accent={C.green} />
              <KpiCard icon="📚" value={b.learner_count||0} label="Active Learners" accent={C.teal} />
              <KpiCard icon="📋" value={b.status} label="Status" accent={C.gold} />
            </div>
          ) : null;
        })()}
      </Card>
      {batchInsights && (
        <Card>
          <CardTitle>🤖 AI Insights</CardTitle>
          <pre style={{ whiteSpace:'pre-wrap', fontSize:13.5, lineHeight:1.7, color:C.ink, fontFamily:'inherit', margin:0 }}>{batchInsights}</pre>
        </Card>
      )}
    </>;
  }

  function PanelAIDropout() {
    function loadDropout() {
      if (!dropoutBatch) { showToast('Select a batch.', 'warn'); return; }
      setDropoutLoading(true); setDropoutData(null);
      api.dropoutRiskBatch(dropoutBatch)
        .then(r => setDropoutData(r))
        .catch(e => { showToast(e.message || 'Failed to load risk data.', 'error'); setDropoutLoading(false); })
        .finally(() => setDropoutLoading(false));
    }
    const riskColor = level => level === 'High' ? C.red : level === 'Medium' ? C.gold : C.green;
    return <>
      <SectionHead title="AI Dropout Risk Predictor ⚠️" />
      <Alert type="warn">Identifies learners at risk of dropping out based on attendance, assessment scores, and engagement patterns.</Alert>
      <Card>
        <G>
          <Field label="Select Batch">
            <select value={dropoutBatch} onChange={e=>setDropoutBatch(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13.5, fontFamily:'inherit' }}>
              <option value="">— Choose a batch —</option>
              {myBatches.filter(b=>b.status==='active').map(b=><option key={b.id} value={b.id}>{b.batch_code} · {b.name}</option>)}
            </select>
          </Field>
          <Field label=" "><Btn primary onClick={loadDropout} disabled={dropoutLoading} style={{ marginTop:22 }}>🤖 {dropoutLoading ? 'Analysing…' : 'Predict Risk'}</Btn></Field>
        </G>
      </Card>
      {dropoutData && (() => {
        const learners = dropoutData.learners || [];
        const high = learners.filter(l=>l.risk_level==='High').length;
        const med = learners.filter(l=>l.risk_level==='Medium').length;
        return <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 }}>
            <KpiCard icon="👥" value={learners.length} label="Total Learners" accent={C.blue} />
            <KpiCard icon="🔴" value={high} label="High Risk" accent={C.red} />
            <KpiCard icon="🟡" value={med} label="Medium Risk" accent={C.gold} />
            <KpiCard icon="🟢" value={learners.length - high - med} label="Low Risk" accent={C.green} />
          </div>
          <Card>
            <CardTitle>👤 Learner Risk Breakdown</CardTitle>
            {learners.length === 0
              ? <div style={{ color:C.ink3, padding:8 }}>No learner data available for this batch.</div>
              : <Table headers={['Learner','Attendance','Score','Risk Level','Risk Factors']} rows={learners.map((l,i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight:600 }}>{l.name || l.candidate_name || `Learner ${i+1}`}</Td>
                    <Td>{l.attendance_pct != null ? Math.round(l.attendance_pct)+'%' : '—'}</Td>
                    <Td>{l.assessment_score != null ? l.assessment_score : '—'}</Td>
                    <Td><Badge color={l.risk_level==='High'?'red':l.risk_level==='Medium'?'gold':'green'}>{l.risk_level||'Low'}</Badge></Td>
                    <Td style={{ fontSize:12, color:C.ink3 }}>{(l.risk_factors||[]).join(', ') || '—'}</Td>
                  </tr>
                ))} />
            }
          </Card>
          {dropoutData.summary && (
            <Card>
              <CardTitle>📊 AI Summary</CardTitle>
              <div style={{ fontSize:13.5, lineHeight:1.65, color:C.ink }}>{dropoutData.summary}</div>
            </Card>
          )}
        </>;
      })()}
    </>;
  }

  function renderPanel() {
    switch (panel) {
      case 'dashboard':             return PanelDashboard();
      case 'notifications':         return PanelNotifications();
      case 'profile-personal':      return PanelProfilePersonal();
      case 'profile-qualifications':return PanelProfileQualifications();
      case 'profile-experience':    return PanelProfileExperience();
      case 'profile-expertise':     return PanelProfileExpertise();
      case 'profile-certifications':return PanelProfileCertifications();
      case 'profile-docs':          return PanelProfileDocs();
      case 'batch-active':          return PanelBatchActive();
      case 'batch-upcoming':        return PanelBatchUpcoming();
      case 'batch-completed':       return PanelBatchCompleted();
      case 'batch-create':          return PanelBatchCreate();
      case 'session-schedule':      return PanelSessionSchedule();
      case 'session-today':         return PanelSessionToday();
      case 'session-calendar':      return PanelSessionCalendar();
      case 'session-reschedule':    return PanelSessionReschedule();
      case 'attendance-mark':       return PanelAttendanceMark();
      case 'attendance-reports':    return PanelAttendanceReports();
      case 'attendance-summary':    return PanelAttendanceSummary();
      case 'learner-list':          return PanelLearnerList();
      case 'learner-progress':      return PanelLearnerProgress();
      case 'learner-dropout':       return PanelLearnerDropout();
      case 'learner-placement':     return PanelLearnerPlacement();
      case 'assess-schedule':       return PanelAssessSchedule();
      case 'assess-results':        return PanelAssessResults();
      case 'assess-rpl':            return PanelAssessRPL();
      case 'assess-mock':           return PanelAssessMock();
      case 'content-materials':     return PanelContentMaterials();
      case 'content-videos':        return PanelContentVideos();
      case 'content-upload':        return PanelContentUpload();
      case 'content-library':       return PanelContentLibrary();
      case 'cert-issue':            return PanelCertIssue();
      case 'cert-issued':           return PanelCertIssued();
      case 'cert-verify':           return PanelCertVerify();
      case 'report-batch':          return PanelReportBatch();
      case 'report-attendance':     return PanelReportAttendance();
      case 'report-assessment':     return PanelReportAssessment();
      case 'report-placement':      return PanelReportPlacement();
      case 'report-trainer':        return PanelReportTrainer();
      case 'scheme-pmkvy':          return PanelSchemePmkvy();
      case 'scheme-rpl':            return PanelSchemeRPL();
      case 'scheme-naps':           return PanelSchemeNAPS();
      case 'scheme-ddu':            return PanelSchemeDDU();
      case 'announce-send':         return PanelAnnounceSend();
      case 'announce-history':      return PanelAnnounceHistory();
      case 'feedback-session':      return PanelFeedbackSession();
      case 'feedback-overall':      return PanelFeedbackOverall();
      case 'earnings-history':      return PanelEarningsHistory();
      case 'earnings-pending':      return PanelEarningsPending();
      case 'earnings-bank':         return PanelEarningsBank();
      case 'jobs-browse':           return PanelJobsBrowse();
      case 'jobs-referrals':        return PanelJobsReferrals();
      case 'ai-session':            return PanelAISession();
      case 'ai-assessment':         return PanelAIAssessment();
      case 'ai-insights':           return PanelAIInsights();
      case 'ai-dropout':            return PanelAIDropout();
      case 'helpdesk':              return PanelHelpdesk();
      case 'grievance':             return PanelGrievance();
      case 'faq':                   return PanelFAQ();
      case 'settings':              return PanelSettings();
      default:                      return PanelDashboard();
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.surface }}>
      {Sidebar()}
      {Topbar()}
      <div style={{ marginLeft: isMobile ? 0 : SW, marginTop:TH, padding:24, minHeight:`calc(100vh - ${TH}px)`, overflowX:'hidden', boxSizing:'border-box' }}>
        {renderPanel()}
      </div>
      {/* SkillBot floating widget */}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9998, display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
        {chatOpen && (
          <div style={{ width:340, marginBottom:12, background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ background:C.navy, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>🤖</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13.5, color:'#fff' }}>SkillBot</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>AI Assistant</div>
              </div>
              {chatHistory.length > 0 && (
                <button onClick={() => setChatHistory([])} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:6, padding:'3px 8px', fontSize:11, cursor:'pointer' }}>Clear</button>
              )}
              <button onClick={() => setChatOpen(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:18, cursor:'pointer', lineHeight:1, padding:'0 2px' }}>✕</button>
            </div>
            {/* Messages */}
            <div style={{ height:280, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              {chatHistory.length === 0 && (
                <div style={{ color:C.ink3, fontSize:12.5, textAlign:'center', paddingTop:16 }}>
                  <div style={{ marginBottom:10 }}>Pick a suggestion or ask anything:</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
                    {chatSuggestions.slice(0,4).map(s => (
                      <span key={s} onClick={() => setChatInput(s)}
                        style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:'4px 11px', fontSize:11.5, cursor:'pointer', color:C.ink2 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth:'82%', padding:'8px 12px', borderRadius: m.role==='user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    background: m.role==='user' ? C.blue : C.surface, color: m.role==='user' ? '#fff' : C.ink,
                    fontSize:12.5, lineHeight:1.55, whiteSpace:'pre-wrap' }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <div style={{ background:C.surface, borderRadius:'14px 14px 14px 3px', padding:'8px 14px', fontSize:12.5, color:C.ink3 }}>SkillBot is thinking…</div>
                </div>
              )}
            </div>
            {/* Input */}
            <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) {
                  const msg = chatInput.trim(); if (!msg) return;
                  const newHistory = [...chatHistory, { role:'user', content: msg }];
                  setChatHistory(newHistory); setChatInput(''); setChatLoading(true);
                  api.chatbot(msg, newHistory)
                    .then(r => setChatHistory(h => [...h, { role:'assistant', content: r.reply }]))
                    .catch(e => setChatHistory(h => [...h, { role:'assistant', content: '⚠️ ' + (e.message||'Error') }]))
                    .finally(() => setChatLoading(false));
                }}}
                placeholder="Ask SkillBot…"
                style={{ flex:1, padding:'8px 11px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit' }} />
              <button disabled={chatLoading || !chatInput.trim()} onClick={() => {
                const msg = chatInput.trim(); if (!msg) return;
                const newHistory = [...chatHistory, { role:'user', content: msg }];
                setChatHistory(newHistory); setChatInput(''); setChatLoading(true);
                api.chatbot(msg, newHistory)
                  .then(r => setChatHistory(h => [...h, { role:'assistant', content: r.reply }]))
                  .catch(e => setChatHistory(h => [...h, { role:'assistant', content: '⚠️ ' + (e.message||'Error') }]))
                  .finally(() => setChatLoading(false));
              }} style={{ background:C.blue, color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1 }}>Send</button>
            </div>
          </div>
        )}
        {/* Toggle button */}
        <button onClick={() => setChatOpen(o => !o)}
          style={{ width:56, height:56, borderRadius:'50%', background:C.blue, border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, transition:'transform .15s' }}>
          {chatOpen ? '✕' : '🤖'}
        </button>
      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:28, right:28, background: toast.type==='error'?C.red : toast.type==='warn'?C.gold : C.teal, color:'#fff', padding:'12px 22px', borderRadius:10, fontSize:14, fontWeight:600, boxShadow:'0 4px 18px rgba(0,0,0,0.18)', zIndex:9999, animation:'fadeIn .2s' }}>
          {toast.type==='error'?'❌ ':toast.type==='warn'?'⚠️ ':'✅ '}{toast.msg}
        </div>
      )}
      {enrolModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:28, width:380, boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Enrol Learner into Batch</div>
            <div style={{ marginBottom:6, fontSize:13, color:'#374151' }}>Candidate email address</div>
            <input
              style={{ width:'100%', padding:'9px 12px', border:'1px solid #CBD5E1', borderRadius:8, fontSize:14, boxSizing:'border-box' }}
              placeholder="candidate@example.com"
              value={enrolEmail}
              onChange={e => { setEnrolEmail(e.target.value); setEnrolMsg(''); }}
            />
            {enrolMsg && <div style={{ marginTop:8, fontSize:12, color: enrolMsg.startsWith('✅') ? '#15803D' : '#C0392B' }}>{enrolMsg}</div>}
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button style={{ flex:1, padding:'9px 0', background:'#F1F5F9', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }} onClick={() => { setEnrolModal(null); setEnrolEmail(''); setEnrolMsg(''); }}>Cancel</button>
              <button style={{ flex:2, padding:'9px 0', background:C.blue, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }} onClick={async () => {
                if (!enrolEmail.trim()) return setEnrolMsg('Email is required');
                try {
                  await api.enrollLearner(enrolModal, { email: enrolEmail.trim() });
                  setEnrolMsg('✅ Learner enrolled successfully');
                  loadLearnersForBatch(enrolModal);
                  setTimeout(() => { setEnrolModal(null); setEnrolEmail(''); setEnrolMsg(''); }, 1200);
                } catch (e) {
                  const msg = await e?.response?.json?.().catch(() => null);
                  setEnrolMsg(msg?.error || 'Enrolment failed');
                }
              }}>Enrol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
